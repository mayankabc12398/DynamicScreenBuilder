import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../modalComponent/Modal";
import Heading from "../UI/Heading";
import Tables from "../UI/customTable";
import SaveButton from "../UI/SaveButton";
import CancelButton from "../UI/CancelButton";
import AiThinkingRobot from "./AiThinkingRobot";
import { MedicineItemSearch } from "../../networkServices/DoctorApi";
import { DoctorPracticePatternSimilarCases } from "../../networkServices/DoctorPracticePatternApi";
import { PRESCRIBED_MEDICINE } from "../../utils/constant";
import { notify } from "../../utils/utils";
import { getGeminiPrescriptionSuggestion } from "../../utils/prescriptionSuggestAI";
import {
  allergyHits,
  bestMatch,
  buildMedicineRow,
  matchPatternMedicine,
  medicineKey,
  nextVisitDate,
  normalizePattern,
  patternForAI,
} from "../../utils/prescriptionSuggestLogic";

/**
 * Treatment Plan (AI) - opened from the Provisional Diagnosis header of the doctor's
 * prescription page.
 *
 * It reads the provisional diagnosis (with age, sex, weight, vitals, allergies, complaint and
 * what is already prescribed) and proposes a way to write the visit up: likely diagnoses and
 * expected course, medicines, tests and imaging, advice, notes and a follow-up date.
 *
 * It also looks at THIS doctor's own earlier prescriptions for patients with a similar diagnosis
 * and age range ("From your own practice"): what they usually prescribed and advised, as counts.
 * The counting is done on the server and the answer holds no patient detail; only medicine and
 * test names with percentages are given to the AI model, never advice or note wording.
 *
 * It only ever PROPOSES. Nothing is ticked, nothing is added until the doctor ticks it and
 * presses Add Selected, and what is added lands as ordinary rows in the prescription
 * (medicine grid, investigations, advice, notes, next visit) - editable like anything typed,
 * and not saved until the doctor saves the prescription as usual. Opening, closing or
 * cancelling this popup changes nothing on the page.
 */

// The last answer is kept while the context (diagnosis, patient, current medicines) is the same,
// so reopening the popup does not pay for the same question twice. "Regenerate" asks again.
let lastAnswer = { key: "", data: null, pattern: null, patternNote: "" };

const emptyPicks = () => ({
  dx: new Set(), med: new Set(), inv: new Set(), advice: new Set(), notes: new Set(), outcome: false, follow: false,
  // from the doctor's own practice
  pmed: new Set(), ptest: new Set(), padv: new Set(), pnote: new Set(), pfollow: false,
});

const sorted = (set) => [...set].sort((a, b) => a - b);

const firstWord = (name) =>
  String(name || "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .find((w) => w.length >= 3) || "";

export default function AIPrescriptionSuggestModal({
  visible,
  setVisible,
  context,
  patternRequest,
  tags,
  setTags,
  setPrisciptionForm,
  loadInvestigationCatalog,
}) {
  const [t] = useTranslation();
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [phase, setPhase] = useState("pattern"); // while loading: pattern | ai
  const [thinkIdx, setThinkIdx] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [pattern, setPattern] = useState(null);
  const [patternNote, setPatternNote] = useState("");
  const [picks, setPicks] = useState(emptyPicks);
  const [adding, setAdding] = useState(false);
  const runId = useRef(0);

  const contextKey = useMemo(
    () => `${JSON.stringify(context || {})}|${JSON.stringify(patternRequest || {})}`,
    [context, patternRequest],
  );

  const generate = useCallback(
    async (force = false) => {
      if (!force && lastAnswer.key === contextKey && lastAnswer.data) {
        setResult(lastAnswer.data);
        setPattern(lastAnswer.pattern);
        setPatternNote(lastAnswer.patternNote);
        setStatus("done");
        return;
      }
      const id = ++runId.current;
      setStatus("loading");
      setPhase("pattern");
      setThinkIdx(0);
      setError("");
      setPicks(emptyPicks());
      try {
        // 1. The doctor's own earlier prescriptions for similar patients. A failure here only
        //    means no pattern: the AI suggestion does not depend on it.
        let found = null;
        let note = "";
        if (patternRequest) {
          try {
            const res = await DoctorPracticePatternSimilarCases(patternRequest);
            if (res?.success) {
              found = normalizePattern(res.data);
              if (!found) note = res?.data?.message || "";
            }
          } catch (e) {
            found = null;
          }
        }
        if (id !== runId.current) return; // closed or asked again meanwhile

        // 2. The AI, given the patient's context and (only) the aggregate of that pattern.
        setPhase("ai");
        setThinkIdx(0);
        const data = await getGeminiPrescriptionSuggestion({ ...context, practicePattern: patternForAI(found) });
        if (id !== runId.current) return;
        lastAnswer = { key: contextKey, data, pattern: found, patternNote: note };
        setResult(data);
        setPattern(found);
        setPatternNote(note);
        setStatus("done");
      } catch (e) {
        if (id !== runId.current) return;
        console.log(e);
        setError(e?.message || t("The AI suggestion could not be produced"));
        setStatus("error");
      }
    },
    [contextKey, context, patternRequest, t],
  );

  // What the robot says while it works - the message moves on every couple of seconds.
  const thinkMessages =
    phase === "pattern"
      ? [t("Looking at your earlier prescriptions for similar patients")]
      : [
          t("Reading the diagnosis"),
          t("Weighing the likely causes"),
          t("Choosing medicines and tests"),
          t("Checking allergies and doses"),
          t("Preparing your suggestions"),
        ];
  useEffect(() => {
    if (status !== "loading") return undefined;
    const timer = setInterval(() => setThinkIdx((i) => i + 1), 2200);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (!visible) {
      runId.current += 1;
      return;
    }
    setPicks(emptyPicks());
    generate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  /* ---------------------------------- picking ---------------------------------- */

  const toggle = (kind, i) =>
    setPicks((p) => {
      const next = new Set(p[kind]);
      next.has(i) ? next.delete(i) : next.add(i);
      return { ...p, [kind]: next };
    });
  const setAll = (kind, count, on) =>
    setPicks((p) => ({ ...p, [kind]: on ? new Set(Array.from({ length: count }, (_, i) => i)) : new Set() }));

  const selectedCount =
    picks.dx.size + picks.med.size + picks.inv.size + picks.advice.size + picks.notes.size +
    picks.pmed.size + picks.ptest.size + picks.padv.size + picks.pnote.size +
    (picks.outcome ? 1 : 0) + (picks.follow ? 1 : 0) + (picks.pfollow ? 1 : 0);

  const check = (checked, onChange, label) => (
    <input
      type="checkbox"
      className="table-checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
    />
  );

  /* Select all | Clear. Plain text links, not buttons: every <button> in this app takes the active
     theme's colour, so a button sitting on a theme-coloured heading bar would disappear into it.
     White on the heading bars, the page's own text colour on the light sub-headings. */
  const selectAllLink = (kind, count, tone = "on-bar") =>
    count > 0 ? (
      <span className={`aps-all aps-all--${tone}`}>
        <span
          role="button"
          tabIndex={0}
          className="aps-link"
          onClick={() => setAll(kind, count, true)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setAll(kind, count, true)}
        >
          {t("Select all")}
        </span>
        <span className="mx-1">|</span>
        <span
          role="button"
          tabIndex={0}
          className="aps-link"
          onClick={() => setAll(kind, count, false)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setAll(kind, count, false)}
        >
          {t("Clear")}
        </span>
      </span>
    ) : null;

  /* ----------------------------------- adding ----------------------------------- */

  const handleAdd = async () => {
    if (!result || selectedCount === 0) {
      notify(t("Tick what you want to add to the prescription"), "warn");
      return;
    }
    setAdding(true);
    try {
      // Medicines: matched to the item master through the grid's own name search; one that is
      // not in the master is added as typed, exactly as if the doctor had typed it.
      const medicineRows = [];
      let typedOnly = 0;

      // The doctor's own usual medicines go in first, with their usual dose and timing, so when the
      // AI suggests the same one the doctor's own version is the one kept.
      for (const i of sorted(picks.pmed)) {
        const usual = pattern.medicines[i];
        let master = null;
        try {
          const found = await MedicineItemSearch(firstWord(usual.name));
          const list = found?.data || [];
          master =
            (usual.itemId && list.find((r) => String(r?.ItemID) === String(usual.itemId))) ||
            bestMatch(usual.name, list, (r) => r?.Brand);
        } catch (e) {
          master = null;
        }
        if (!master) typedOnly += 1;
        medicineRows.push(
          buildMedicineRow(
            { name: usual.name, dose: usual.dose, frequency: usual.frequency, meal: usual.meal, duration: usual.duration, route: usual.route, remarks: "" },
            master,
          ),
        );
      }

      for (const i of [...picks.med].sort((a, b) => a - b)) {
        const med = result.medicines[i];
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

      // Tests and imaging: matched to what this visit can actually order; one that is not in
      // the master is added by name only.
      let investigationTags = [];
      if (picks.inv.size > 0 || picks.ptest.size > 0) {
        let catalog = [];
        try {
          catalog = (await loadInvestigationCatalog?.()) || [];
        } catch (e) {
          catalog = [];
        }
        const asTag = (name, hit) =>
          hit
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
        const usualTests = sorted(picks.ptest).map((i) => {
          const usual = pattern.tests[i];
          const hit =
            (usual.testId && catalog.find((r) => String(r?.newItemID) === String(usual.testId))) ||
            bestMatch(usual.name, catalog, (r) => r?.typeName ?? r?.TypeName);
          return asTag(usual.name, hit);
        });
        investigationTags = [
          ...usualTests,
          ...[...picks.inv]
          .sort((a, b) => a - b)
          .map((i) => {
            const inv = result.investigations[i];
            const hit = bestMatch(inv.name, catalog, (r) => r?.typeName ?? r?.TypeName);
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
              : { ValueField: inv.name, TemplateName: inv.name };
          }),
        ];
      }

      const diagnosisTexts = [...picks.dx].sort((a, b) => a - b).map((i) => result.diagnoses[i].name);
      const adviceTexts = [
        ...sorted(picks.padv).map((i) => pattern.advice[i].text),
        ...[...picks.advice].sort((a, b) => a - b).map((i) => result.advice[i]),
      ];
      const noteTexts = [
        ...sorted(picks.pnote).map((i) => pattern.notes[i].text),
        ...[...picks.notes].sort((a, b) => a - b).map((i) => result.notes[i]),
      ];
      if (picks.outcome) {
        const p = result.prediction;
        const text = [
          p.expectedCourse && `${t("Expected course")}: ${p.expectedCourse}`,
          p.timeToRecovery && `${t("Recovery")}: ${p.timeToRecovery}`,
        ]
          .filter(Boolean)
          .join(". ");
        if (text) noteTexts.push(text.slice(0, 300));
      }

      /* A pure merge of the picks into a copy of the tags: nothing is mutated and nothing is
         counted as a side effect, so it can be run once to know what was new (for the message)
         and once inside setTags (which React may call twice) with the same answer. */
      const merge = (base) => {
        const next = { ...base };
        const counts = { med: 0, inv: 0, text: 0 };

        // Text tags: one tag each, never the same text twice.
        const addText = (category, texts) => {
          if (!texts.length) return;
          const existing = [...(next[category] || [])];
          const seen = new Set(existing.map((x) => String(x?.ValueField ?? "").trim().toLowerCase()));
          texts.forEach((text) => {
            const key = text.trim().toLowerCase();
            if (!key || seen.has(key)) return;
            seen.add(key);
            existing.push({ ValueField: text });
            counts.text += 1;
          });
          next[category] = existing;
        };
        addText("Provisional Diagnosis", diagnosisTexts);
        addText("Doctor Advice", adviceTexts);
        addText("Doctor Notes", noteTexts);

        if (investigationTags.length) {
          const existing = [...(next["Investigation(Lab & Radio)"] || [])];
          const seen = new Set(
            existing.flatMap((x) => [String(x?.ID ?? ""), String(x?.ValueField ?? "").trim().toLowerCase()]).filter(Boolean),
          );
          investigationTags.forEach((tag) => {
            const keys = [String(tag.ID ?? ""), String(tag.ValueField).trim().toLowerCase()].filter(Boolean);
            if (keys.some((k) => seen.has(k))) return;
            keys.forEach((k) => seen.add(k));
            existing.push(tag);
            counts.inv += 1;
          });
          next["Investigation(Lab & Radio)"] = existing;
        }

        if (medicineRows.length) {
          // The grid keeps one blank entry row at the end; the new rows go in front of it.
          const existing = [...(next["Prescribed Medicine"] || [])].filter(
            (row) => row?.Name?.value || row?.Name?.ID,
          );
          const seen = new Set(existing.map(medicineKey).filter(Boolean));
          medicineRows.forEach((row) => {
            const key = medicineKey(row);
            if (key && seen.has(key)) return;
            seen.add(key);
            existing.push(row);
            counts.med += 1;
          });
          existing.push({ ...PRESCRIBED_MEDICINE });
          next["Prescribed Medicine"] = existing;
        }
        return { next, counts };
      };

      const { counts } = merge(tags || {});
      setTags((prev) => merge(prev).next);

      // The doctor's own usual gap wins over the AI's when both are ticked.
      const followDays =
        picks.pfollow && pattern?.followUp
          ? pattern.followUp.days
          : picks.follow && result.followUp.days
            ? result.followUp.days
            : null;
      if (followDays) {
        setPrisciptionForm((prev) => ({
          ...prev,
          NextVisit: nextVisitDate(followDays),
          NextVisitRemarks:
            prev?.NextVisitRemarks || (picks.follow && !picks.pfollow ? result.followUp.reason : "") || "",
        }));
      }

      const parts = [
        counts.med ? `${counts.med} ${t("medicine(s)")}` : "",
        counts.inv ? `${counts.inv} ${t("test(s)")}` : "",
        counts.text ? `${counts.text} ${t("note(s) and advice")}` : "",
        followDays ? t("next visit") : "",
      ].filter(Boolean);
      notify(
        `${t("Added to the prescription")}: ${parts.join(", ") || t("nothing new - already present")}. ${t("Please review and save the prescription as usual.")}`,
        "success",
      );
      if (typedOnly > 0) {
        notify(
          `${typedOnly} ${t("medicine(s) are not in the item master and were added as typed - please check them")}`,
          "warn",
        );
      }
      setVisible(false);
    } catch (e) {
      console.log(e);
      notify(t("Could not add the suggestions"), "error");
    } finally {
      setAdding(false);
    }
  };

  /* ---------------------------------- rendering ---------------------------------- */

  const flag = (text) => <span className="aps-flag">{text}</span>;
  const r = result;

  const medicineRows = (r?.medicines || []).map((m, i) => {
    const hits = allergyHits(context?.allergies, m.name, m.rationale);
    const mine = matchPatternMedicine(m.name, pattern);
    return {
      pick: check(picks.med.has(i), () => toggle("med", i), m.name),
      name: (
        <div className="text-wrap">
          <b>{m.name}</b>
          {mine && (
            <span className="aps-mine" title={t("You prescribed this for similar patients")}>
              {t("Your practice")}: {mine.patients} / {pattern.matchedPatients}
            </span>
          )}
          {hits.length > 0 && flag(`${t("Allergy check")}: ${hits.join(", ")}`)}
          {m.rationale && <div className="aps-sub">{m.rationale}</div>}
        </div>
      ),
      dose: m.dose || "-",
      frequency: m.frequency || "-",
      meal: m.meal || "-",
      duration: m.duration || "-",
      remarks: m.remarks || "-",
    };
  });

  // "used for 9 of 14 similar patients" with a small bar.
  const used = (item) => (
    <span className="aps-used">
      <span className="aps-bar" aria-hidden="true"><i style={{ width: `${Math.round(item.share * 100)}%` }} /></span>
      <b>{Math.round(item.share * 100)}%</b> <span className="aps-sub">({item.patients} / {pattern?.matchedPatients})</span>
    </span>
  );

  const practiceMedicineRows = (pattern?.medicines || []).map((m, i) => {
    const hits = allergyHits(context?.allergies, m.name);
    return {
      pick: check(picks.pmed.has(i), () => toggle("pmed", i), `${t("Your practice")}: ${m.name}`),
      name: (
        <div className="text-wrap">
          <b>{m.name}</b>
          {hits.length > 0 && flag(`${t("Allergy check")}: ${hits.join(", ")}`)}
        </div>
      ),
      used: used(m),
      dose: m.dose || "-",
      frequency: m.frequency || "-",
      meal: m.meal || "-",
      duration: m.duration || "-",
    };
  });

  const practiceTestRows = (pattern?.tests || []).map((x, i) => ({
    pick: check(picks.ptest.has(i), () => toggle("ptest", i), `${t("Your practice")}: ${x.name}`),
    name: <b>{x.name}</b>,
    kind: <span className="aps-kind aps-kind--lab">{t(x.kind)}</span>,
    used: used(x),
  }));

  const practiceTextList = (kind, items) => (
    <ul className="aps-list">
      {items.map((item, i) => (
        <li key={`${kind}-${i}`}>
          <label className="d-flex align-items-start mb-1" style={{ gap: 8, cursor: "pointer" }}>
            {check(picks[kind].has(i), () => toggle(kind, i), `${t("Your practice")}: ${item.text}`)}
            <span>{item.text} {used(item)}</span>
          </label>
        </li>
      ))}
    </ul>
  );

  const investigationRows = (r?.investigations || []).map((x, i) => ({
    pick: check(picks.inv.has(i), () => toggle("inv", i), x.name),
    name: <b>{x.name}</b>,
    kind: <span className={`aps-kind aps-kind--${x.kind === "Radiology" ? "rad" : "lab"}`}>{t(x.kind)}</span>,
    reason: <div className="text-wrap">{x.reason || "-"}</div>,
  }));

  const checkList = (kind, items) =>
    items.length === 0 ? (
      <div className="aps-empty">{t("None suggested")}</div>
    ) : (
      <ul className="aps-list">
        {items.map((text, i) => (
          <li key={`${kind}-${i}`}>
            <label className="d-flex align-items-start mb-1" style={{ gap: 8, cursor: "pointer" }}>
              {check(picks[kind].has(i), () => toggle(kind, i), text)}
              <span>{text}</span>
            </label>
          </li>
        ))}
      </ul>
    );

  const footer = (
    <div className="ftr_btn">
      <button type="button" className="text-white" onClick={() => generate(true)} disabled={status === "loading" || adding}>
        <i className="fas fa-sync mr-1" aria-hidden="true" />
        {t("Regenerate")}
      </button>
      <SaveButton
        btnName={`${t("Add Selected")}${selectedCount ? ` (${selectedCount})` : ""}`}
        onClick={handleAdd}
        disabled={status !== "done" || selectedCount === 0 || adding}
      />
      <CancelButton cancleBtnName={t("Cancel")} onClick={() => setVisible(false)} />
    </div>
  );

  return (
    <Modal
      visible={visible}
      setVisible={setVisible}
      modalWidth="86vw"
      Header={
        <span>
          <i className="fas fa-wand-magic-sparkles mr-2" aria-hidden="true" />
          {t("Treatment Plan")}
        </span>
      }
      footer={footer}
    >
      <div className="aps">
        <div className="aps-banner">
          <i className="fas fa-info-circle mr-1" aria-hidden="true" />
          {t("AI-generated suggestions to support, not replace, your clinical judgement. Nothing is added until you tick it and press Add Selected. Added items stay editable and are saved only when you save the prescription.")}
        </div>

        <div className="aps-context">
          <b>{t("Based on")}:</b> {(context?.provisionalDiagnosis || []).join("; ") || "-"}
          {context?.age ? ` · ${context.age}` : ""}
          {context?.sex ? ` · ${context.sex}` : ""}
          {context?.weightKg ? ` · ${context.weightKg} kg` : ""}
          {(context?.allergies || []).length > 0 && (
            <span className="aps-flag ml-2">{t("Allergies")}: {context.allergies.join(", ")}</span>
          )}
        </div>

        {status === "loading" && (
          <AiThinkingRobot message={thinkMessages[thinkIdx % thinkMessages.length]} />
        )}

        {status === "error" && (
          <div className="aps-state aps-state--error">
            <div>{error}</div>
            <button type="button" className="btn btn-sm text-white mt-2" onClick={() => generate(true)}>
              {t("Try again")}
            </button>
          </div>
        )}

        {status === "done" && r && (
          <>
            {r.summary && <div className="aps-summary">{r.summary}</div>}

            {r.warnings.length > 0 && (
              <div className="aps-warn">
                <b><i className="fas fa-exclamation-triangle mr-1" aria-hidden="true" />{t("Please double-check")}</b>
                <ul className="mb-0">{r.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </div>
            )}

            <Heading title={t("From your own practice")} isBreadcrumb={false} />
            {pattern ? (
              <>
                <div className="aps-pattern-note">
                  <i className="fas fa-user-md mr-1" aria-hidden="true" />
                  {t("Based on")} <b>{pattern.matchedPatients}</b> {t("similar patients of yours")}
                  {pattern.ageFrom != null && ` (${t("age")} ${Math.round(pattern.ageFrom)}-${Math.round(pattern.ageTo)})`}.{" "}
                  {t("Only counts are used - no patient details are shown or shared.")}
                </div>

                {pattern.medicines.length > 0 && (
                  <>
                    <div className="aps-subhead">
                      {t("Medicines you usually prescribe")}
                      {selectAllLink("pmed", pattern.medicines.length, "on-light")}
                    </div>
                    <Tables
                      thead={[
                        { name: "", width: "3%" },
                        { name: t("Medicine"), width: "30%" },
                        { name: t("Used for"), width: "20%" },
                        { name: t("Usual dose"), width: "14%" },
                        { name: t("Time"), width: "12%" },
                        { name: t("Meal"), width: "11%" },
                        { name: t("Duration"), width: "10%" },
                      ]}
                      tbody={practiceMedicineRows}
                      style={{ maxHeight: "26vh" }}
                    />
                  </>
                )}

                {pattern.tests.length > 0 && (
                  <>
                    <div className="aps-subhead">
                      {t("Tests you usually advise")}
                      {selectAllLink("ptest", pattern.tests.length, "on-light")}
                    </div>
                    <Tables
                      thead={[
                        { name: "", width: "3%" },
                        { name: t("Test"), width: "47%" },
                        { name: t("Type"), width: "10%" },
                        { name: t("Used for"), width: "40%" },
                      ]}
                      tbody={practiceTestRows}
                      style={{ maxHeight: "22vh" }}
                    />
                  </>
                )}

                {pattern.advice.length > 0 && (
                  <>
                    <div className="aps-subhead">
                      {t("Advice you usually give")}
                      {selectAllLink("padv", pattern.advice.length, "on-light")}
                    </div>
                    {practiceTextList("padv", pattern.advice)}
                  </>
                )}

                {pattern.notes.length > 0 && (
                  <>
                    <div className="aps-subhead">
                      {t("Notes you usually write")}
                      {selectAllLink("pnote", pattern.notes.length, "on-light")}
                    </div>
                    {practiceTextList("pnote", pattern.notes)}
                  </>
                )}

                {pattern.followUp && (
                  <label className="d-flex align-items-start mx-2 mb-2" style={{ gap: 8, cursor: "pointer" }}>
                    {check(picks.pfollow, () => setPicks((p) => ({ ...p, pfollow: !p.pfollow })), t("Your usual follow-up"))}
                    <span>
                      {t("You usually ask them to return in")} <b>{pattern.followUp.days}</b> {t("day(s)")} ({nextVisitDate(pattern.followUp.days)})
                      <span className="aps-sub"> - {pattern.followUp.cases} {t("similar visits")}</span>
                    </span>
                  </label>
                )}
              </>
            ) : (
              <div className="aps-empty">
                {patternNote || t("No pattern from your earlier prescriptions yet")}
              </div>
            )}

            <Heading title={t("Likely diagnoses")} isBreadcrumb={false} secondTitle={selectAllLink("dx", r.diagnoses.length)} />
            {r.diagnoses.length === 0 ? (
              <div className="aps-empty">{t("None suggested")}</div>
            ) : (
              <ul className="aps-list">
                {r.diagnoses.map((d, i) => (
                  <li key={i}>
                    <label className="d-flex align-items-start mb-1" style={{ gap: 8, cursor: "pointer" }}>
                      {check(picks.dx.has(i), () => toggle("dx", i), d.name)}
                      <span>
                        <b>{d.name}</b> <span className={`aps-like aps-like--${d.likelihood.toLowerCase()}`}>{t(d.likelihood)}</span>
                        {d.reasoning && <div className="aps-sub">{d.reasoning}</div>}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {r.diagnoses.length > 0 && <small className="text-muted mx-2 d-block">{t("A ticked diagnosis is added to Provisional Diagnosis.")}</small>}

            <Heading title={t("Expected course and outcome")} isBreadcrumb={false} />
            <div className="aps-outcome">
              {[
                [t("Expected course"), r.prediction.expectedCourse],
                [t("Prognosis"), r.prediction.prognosis],
                [t("Time to recovery"), r.prediction.timeToRecovery],
              ]
                .filter(([, v]) => v)
                .map(([label, v]) => (
                  <div key={label}><b>{label}:</b> {v}</div>
                ))}
              {r.prediction.complications.length > 0 && (
                <div><b>{t("Possible complications")}:</b> {r.prediction.complications.join("; ")}</div>
              )}
              {r.prediction.redFlags.length > 0 && (
                <div className="aps-red"><b>{t("Red flags - advise the patient to return if")}:</b> {r.prediction.redFlags.join("; ")}</div>
              )}
              {(r.prediction.expectedCourse || r.prediction.timeToRecovery) && (
                <label className="d-flex align-items-center mt-1 mb-0" style={{ gap: 8, cursor: "pointer" }}>
                  {check(picks.outcome, () => setPicks((p) => ({ ...p, outcome: !p.outcome })), t("Add the outcome to Doctor Notes"))}
                  <span>{t("Add the expected course and recovery to Doctor Notes")}</span>
                </label>
              )}
            </div>

            <Heading title={t("Suggested medicines")} isBreadcrumb={false} secondTitle={selectAllLink("med", r.medicines.length)} />
            {r.medicines.length === 0 ? (
              <div className="aps-empty">{t("None suggested")}</div>
            ) : (
              <Tables
                thead={[
                  { name: "", width: "3%" },
                  { name: t("Medicine"), width: "34%" },
                  { name: t("Dose"), width: "11%" },
                  { name: t("Time"), width: "11%" },
                  { name: t("Meal"), width: "12%" },
                  { name: t("Duration"), width: "10%" },
                  { name: t("Remarks"), width: "19%" },
                ]}
                tbody={medicineRows}
                style={{ maxHeight: "30vh" }}
              />
            )}

            <Heading title={t("Suggested tests and imaging")} isBreadcrumb={false} secondTitle={selectAllLink("inv", r.investigations.length)} />
            {r.investigations.length === 0 ? (
              <div className="aps-empty">{t("None suggested")}</div>
            ) : (
              <Tables
                thead={[
                  { name: "", width: "3%" },
                  { name: t("Test"), width: "35%" },
                  { name: t("Type"), width: "10%" },
                  { name: t("Reason"), width: "52%" },
                ]}
                tbody={investigationRows}
                style={{ maxHeight: "24vh" }}
              />
            )}

            <div className="row mx-0">
              <div className="col-xl-6 col-12 px-0 pr-xl-1">
                <Heading title={t("Advice for the patient")} isBreadcrumb={false} secondTitle={selectAllLink("advice", r.advice.length)} />
                {checkList("advice", r.advice)}
              </div>
              <div className="col-xl-6 col-12 px-0 pl-xl-1">
                <Heading title={t("Doctor notes")} isBreadcrumb={false} secondTitle={selectAllLink("notes", r.notes.length)} />
                {checkList("notes", r.notes)}
              </div>
            </div>

            <Heading title={t("Follow-up")} isBreadcrumb={false} />
            {r.followUp.days ? (
              <label className="d-flex align-items-start mx-2 mb-2" style={{ gap: 8, cursor: "pointer" }}>
                {check(picks.follow, () => setPicks((p) => ({ ...p, follow: !p.follow })), t("Set the next visit"))}
                <span>
                  {t("Next visit in")} <b>{r.followUp.days}</b> {t("day(s)")} ({nextVisitDate(r.followUp.days)})
                  {r.followUp.reason && <div className="aps-sub">{r.followUp.reason}</div>}
                </span>
              </label>
            ) : (
              <div className="aps-empty">{t("No follow-up date suggested")}</div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
