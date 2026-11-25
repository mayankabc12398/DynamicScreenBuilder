import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateIfKnown } from "../../WrapTranslate";
import { notify } from "../../../utils/utils";
import { MedicineItemSearch } from "../../../networkServices/DoctorApi";
import { PatientLabReportTrends } from "../../../networkServices/PatientLabReportApi";
import { loadPatientRecord } from "../../../utils/aiPatientRecord";
import { bestMatch, buildMedicineRow, nextVisitDate } from "../../../utils/prescriptionSuggestLogic";
import { buildClinicalContext, labsForAI, mergeIntoTags } from "../../../utils/aiClinicalLogic";
import AIScribe from "./AIScribe";
import AISafety from "./AISafety";
import AIAnalysis from "./AIAnalysis";
import AITools from "./AITools";
import "./aiClinicalTools.css";

/**
 * The Scribe, Safety and Analysis tabs of the doctor's existing AI Assistance panel
 * (layouts/Chatbot/AIPatientSummary.jsx), added 4 Nov 2026.
 *
 * Scribe   - listen to the consultation, structured note, apply section by section.
 * Safety   - interactions, allergy conflicts, dose alerts and the bedside score that fits.
 * Analysis - trends and history, body map, risk estimates with their drivers, recovery course,
 *            treatment options, image read, next best actions, the patient's own words.
 *
 * The panel stays mounted while AI Assistance is open (only hidden on its other tabs) so results survive a
 * tab switch. It only proposes: nothing reaches the prescription until the doctor presses Apply / Add, and
 * what is added is ordinary rows and tags, saved by the page's own Save. All AI goes through the central AI
 * (AI/Generate) with clinical context only - no name, UHID, phone or address.
 */

const firstWord = (name) =>
  String(name || "")
    .trim()
    .split(/\s+/)[0]
    .replace(/[^A-Za-z0-9-]/g, "") || String(name || "").trim();

export default function AIClinicalTools({
  tab,
  hidden,
  patient,
  vitals,
  tags,
  setTags,
  form,
  setForm,
  sections,
  loadInvestigationCatalog,
  onOpenInteractionChecker,
  onStatus,
  expanded,
  onExpand,
  oldVisits,
  visitType,
}) {
  const [t] = useTranslation();
  const tr = useCallback((s) => translateIfKnown(t, s), [t]);
  const [status, setStatusLocal] = useState({ mode: "", text: "Ready" });
  // The AI Assistance header shows what the AI is doing (orb + status line).
  const setStatus = useCallback(
    (s) => {
      setStatusLocal(s);
      onStatus?.(s);
    },
    [onStatus],
  );
  // Results kept per visit so switching tabs loses nothing.
  const [store, setStore] = useState({});
  const visitKey = String(patient?.TransactionID ?? patient?.PatientID ?? "");
  const patientID = patient?.PatientID ?? patient?.PatientId;

  useEffect(() => {
    setStore({});
    setStatus({ mode: "", text: "Ready" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitKey]);

  const put = useCallback((key, value) => setStore((s) => ({ ...s, [key]: typeof value === "function" ? value(s[key]) : value })), []);

  const ctx = useMemo(() => buildClinicalContext({ patient, vitals, tags, form }), [patient, vitals, tags, form]);

  /* Everything the AI reads about this patient, loaded once per visit and shared by every tab:
     the "Old Pres" visits with each visit's full saved prescription, the hospital's lab results and
     radiology reports (utils/aiPatientRecord.js), and the lab reports uploaded under Lab Reports & Trends. */
  const backgroundRef = useRef({ key: "", promise: null });
  const loadBackground = useCallback(() => {
    if (backgroundRef.current.key === visitKey && backgroundRef.current.promise) return backgroundRef.current.promise;
    const promise = (async () => {
      const [record, uploaded] = await Promise.all([
        loadPatientRecord({ patient, oldVisits, visitType }).catch(() => null),
        patientID ? PatientLabReportTrends(patientID).catch(() => null) : null,
      ]);
      const uploadedLabs = uploaded?.success ? labsForAI(uploaded.data) : [];
      return {
        record,
        history: record?.historyForAI || "[]",
        labs: { ...(record?.labsForAI || {}), uploadedLabReports: uploadedLabs },
        labCount: (record?.labs?.length || 0) + (record?.imaging?.length || 0) + uploadedLabs.length,
        labParams: uploaded?.success ? uploaded.data?.parameters || [] : [],
      };
    })();
    backgroundRef.current = { key: visitKey, promise };
    return promise;
  }, [visitKey, patientID, patient, oldVisits, visitType]);

  const hasSection = useCallback(
    (name) => !Array.isArray(sections) || !sections.length || sections.some((s) => s?.AccordianName === name),
    [sections],
  );
  const hasSectionId = useCallback((id) => !Array.isArray(sections) || !sections.length || sections.some((s) => Number(s?.ID) === id), [sections]);

  /**
   * Adds accepted items to the prescription. Medicines are matched to the item master through the grid's
   * own name search (added as typed when not found); tests to what this visit can order. Text goes only to
   * sections that are on this doctor's layout. Returns false when nothing was applied.
   */
  const applyToRx = useCallback(
    async ({ texts = {}, hpi = "", medicines = [], investigations = [], removeMedicines = [], followUpDays = null, followUpReason = "" }) => {
      try {
        setStatus({ mode: "thinking", text: "Adding to the prescription" });
        const skipped = [];
        const allowedTexts = {};
        Object.entries(texts).forEach(([cat, values]) => {
          if (!values?.length) return;
          if (hasSection(cat)) allowedTexts[cat] = values;
          else skipped.push(cat);
        });

        const medicineRows = [];
        let typedOnly = 0;
        if (medicines.length && hasSection("Prescribed Medicine")) {
          for (const med of medicines) {
            let master = null;
            try {
              const found = await MedicineItemSearch(firstWord(med.name));
              master = bestMatch(med.name, found?.data || [], (r) => r?.Brand);
            } catch (e) {
              master = null;
            }
            if (!master) typedOnly += 1;
            medicineRows.push(buildMedicineRow(med, master));
          }
        } else if (medicines.length) skipped.push("Prescribed Medicine");

        let investigationTags = [];
        if (investigations.length && hasSection("Investigation(Lab & Radio)")) {
          let catalog = [];
          try {
            catalog = (await loadInvestigationCatalog?.()) || [];
          } catch (e) {
            catalog = [];
          }
          investigationTags = investigations.map((inv) => {
            const name = typeof inv === "string" ? inv : inv.name;
            const hit = bestMatch(name, catalog, (r) => r?.typeName ?? r?.TypeName);
            return hit
              ? {
                  ID: hit.newItemID,
                  ValueField: hit.typeName ?? hit.TypeName,
                  TemplateName: hit.typeName ?? hit.TypeName,
                  AllItemData: hit.newItemID,
                  subCategoryID: hit.subCategoryID,
                  categoryID: hit.categoryid,
                  rate: Number(hit.rate ?? hit.Rate ?? 0),
                }
              : { ValueField: name, TemplateName: name };
          });
        } else if (investigations.length) skipped.push("Investigation(Lab & Radio)");

        const payload = { texts: allowedTexts, investigationTags, medicineRows, removeMedicines };
        const { counts } = mergeIntoTags(tags || {}, payload);
        setTags((prev) => mergeIntoTags(prev, payload).next);

        let hpiAdded = false;
        if (hpi && hasSectionId(37)) {
          hpiAdded = true;
          setForm((prev) => {
            const old = String(prev?.historyOfPresentIllness || "").trim();
            if (old.includes(hpi.trim())) return prev;
            return { ...prev, historyOfPresentIllness: old ? `${old}\n${hpi}` : hpi };
          });
        }
        if (followUpDays) {
          setForm((prev) => ({ ...prev, NextVisit: nextVisitDate(followUpDays), NextVisitRemarks: prev?.NextVisitRemarks || followUpReason || "" }));
        }

        const parts = [
          counts.med ? `${counts.med} ${t("medicine(s)")}` : "",
          counts.removed ? `${counts.removed} ${t("removed")}` : "",
          counts.inv ? `${counts.inv} ${t("test(s)")}` : "",
          counts.text ? `${counts.text} ${t("note(s) and advice")}` : "",
          hpiAdded ? tr("History of Present Illness") : "",
          followUpDays ? t("next visit") : "",
        ].filter(Boolean);
        notify(
          `${tr("Added to the prescription")}: ${parts.join(", ") || tr("nothing new - already present")}. ${tr("Please review and save the prescription as usual.")}`,
          parts.length ? "success" : "warn",
        );
        if (typedOnly) notify(`${typedOnly} ${tr("medicine(s) are not in the item master and were added as typed - please check them")}`, "warn");
        if (skipped.length) notify(`${tr("Not on your prescription layout, so not added")}: ${skipped.map(tr).join(", ")}`, "warn");
        return parts.length > 0;
      } catch (e) {
        notify(e?.message || tr("Could not add to the prescription"), "error");
        return false;
      } finally {
        setStatus({ mode: "", text: "Ready" });
      }
    },
    [tags, setTags, setForm, hasSection, hasSectionId, loadInvestigationCatalog, t, tr],
  );

  const shared = { tr, t, ctx, store, put, loadBackground, applyToRx, setStatus };

  return (
    <div className={`ccp${expanded ? " ccp--wide" : ""}`} style={hidden ? { display: "none" } : undefined}>
      <div className="ccp-body">
        {tab === "scribe" && <AIScribe {...shared} />}
        {tab === "safety" && <AISafety {...shared} onOpenInteractionChecker={onOpenInteractionChecker} />}
        {tab === "analysis" && <AIAnalysis {...shared} expanded={expanded} onFullView={onExpand} />}
        {tab === "tools" && <AITools {...shared} />}
      </div>
      <div className="ccp-foot">{tr("AI suggests; the doctor decides. Every output needs clinical review.")}</div>
    </div>
  );
}
