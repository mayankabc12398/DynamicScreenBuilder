import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import Accordion from "@app/components/UI/Accordion";
import Input from "../formComponent/Input";
import ReactSelect from "../formComponent/ReactSelect";
import Modal from "../modalComponent/Modal";
import { notify } from "../../utils/utils";
import { dpdpLogView } from "../../utils/dpdpRuntime";
import {
  DpdpAdmissionCheck,
  DpdpAssisted,
  DpdpDefer,
  DpdpMyPrivacyLink,
  DpdpPatientSave,
  DpdpSend,
  DpdpSessionStatus,
  DpdpStatus,
} from "../../networkServices/DpdpApi";
import { Badge, SignaturePad, StateBadge, f, useDpdpConfig, useTr, yes } from "../../pages/DPDP/dpdpShared";
import "../../pages/DPDP/dpdp.css";

const COL = "col-xl-2 col-md-3 col-sm-4 col-12";

const visitTypeFromPath = (source) => {
  const p = window.location.pathname.toLowerCase();
  if (String(source || "").toUpperCase() === "EMERGENCY" || p.includes("emergency")) return "ER";
  if (p.includes("daycare") || p.includes("day-care")) return "DAYCARE";
  if (p.includes("ipd") || p.includes("admission")) return "IPD";
  return "OPD";
};

/** Years from the registration's Age / AgeType (YRS, MONTH(S), DAY(S)). */
const ageYears = (values) => {
  const n = parseFloat(values?.Age);
  if (Number.isNaN(n)) return null;
  const t = String(values?.AgeType?.value ?? values?.AgeType ?? "YRS").toUpperCase();
  if (t.startsWith("MONTH")) return n / 12;
  if (t.startsWith("DAY")) return 0;
  return n;
};

const firstRelation = (relations) => (Array.isArray(relations) ? relations[0] : relations) || {};
const plain = (v) => (v && typeof v === "object" ? v.label ?? v.value ?? "" : v ?? "");

/**
 * DPDP privacy consent on the shared registration window (OPD, IPD, Day Care, Emergency, OPD Advance ...).
 * Adds to the screen; changes nothing in registration. Hidden while the DPDP module is not installed or switched off.
 * Never blocks registration, billing or care (s.7(a) service asked for, s.7(f) emergency).
 */
export default function DpdpConsentPanel({ values, uhid, relations, source, popup = false, compact = false }) {
  const tr = useTr();
  const config = useDpdpConfig();
  const visitType = useMemo(() => visitTypeFromPath(source), [source]);
  const rel = firstRelation(relations);
  const age = ageYears(values);
  const minorAge = f(config, "minorAge") || 18;
  const minor = age !== null && age < minorAge;
  const [form, setForm] = useState({ MobileOwner: "SELF", CameWith: "", AbleToDecide: "YES", ReadAloud: false, LanguageCode: "", GuardianName: "", GuardianRelation: "", GuardianMobile: "" });
  const [state, setState] = useState(null);
  const [session, setSession] = useState(null); // { sessionID, link, channel, status }
  const [assisted, setAssisted] = useState(false);
  const [todo, setTodo] = useState([]);
  const [deferOpen, setDeferOpen] = useState(false);
  const [deferWhy, setDeferWhy] = useState("");
  const [myLink, setMyLink] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const savedFor = useRef("");
  const on = !!(config && f(config, "installed") && f(config, "enabled"));

  useEffect(() => {
    if (!on) return;
    setForm((p) => ({
      ...p,
      LanguageCode: p.LanguageCode || f(config, "defaultLanguage") || "en",
      GuardianName: p.GuardianName || (minor ? plain(rel?.RelationName) : ""),
      GuardianRelation: p.GuardianRelation || (minor ? plain(rel?.Relation) : ""),
      GuardianMobile: p.GuardianMobile || (minor ? plain(rel?.RelationPhone) : ""),
      AbleToDecide: visitType === "ER" && p.AbleToDecide === "YES" && !savedFor.current ? "YES" : p.AbleToDecide,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, minor, rel?.RelationName, rel?.Relation, rel?.RelationPhone]);

  const loadState = useCallback(async (id) => {
    const r = await DpdpStatus(id);
    if (r?.success) {
      setState(r.data);
      const d = r.data;
      setForm((p) => ({
        ...p,
        MobileOwner: f(d, "MobileOwner") || p.MobileOwner,
        CameWith: f(d, "CameWith") || p.CameWith,
        AbleToDecide: f(d, "AbleToDecide") || p.AbleToDecide,
        LanguageCode: f(d, "LanguageCode") || p.LanguageCode,
        GuardianName: f(d, "GuardianName") || p.GuardianName,
        GuardianRelation: f(d, "GuardianRelation") || p.GuardianRelation,
        GuardianMobile: f(d, "GuardianMobile") || p.GuardianMobile,
      }));
      if (f(d, "OpenSessionID")) setSession((s) => s || { sessionID: f(d, "OpenSessionID"), status: f(d, "OpenSessionStatus") });
    }
    if (visitType === "IPD" || visitType === "DAYCARE") {
      const a = await DpdpAdmissionCheck(id, "ADMISSION");
      setTodo(a?.success ? f(a.data, "todo") || [] : []);
    }
  }, [visitType]);

  // Existing patient loaded, or a new one just saved: show the badge, log the view, save the panel facts once.
  useEffect(() => {
    if (!on || !uhid) {
      setState(null);
      return;
    }
    dpdpLogView(uhid, `Registration (${visitType})`);
    loadState(uhid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, uhid]);

  const saveProfile = async () => {
    if (!uhid) return null;
    const r = await DpdpPatientSave({
      UHID: uhid,
      ...form,
      VisitType: visitType,
      IsStaff: !!(values?.StaffID || values?.EmployeeID || values?.EmployeeId),
      IsMLC: yes(values?.IsMLC) || yes(values?.MLC),
      Screen: window.location.pathname,
    });
    if (r?.success) {
      savedFor.current = uhid;
      setState(r.data);
    } else notify(r?.message || tr("Could not save the privacy details"), "error");
    return r;
  };

  // A new registration: the panel facts are saved as soon as the UHID exists.
  useEffect(() => {
    if (on && uhid && savedFor.current !== uhid && (form.MobileOwner !== "SELF" || form.CameWith || form.AbleToDecide !== "YES" || minor || visitType === "ER")) saveProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, uhid]);

  // Live status of a link that is out with the patient.
  useEffect(() => {
    if (!session?.sessionID || ["COMPLETED", "EXPIRED", "CANCELLED"].includes(session.status)) return;
    let n = 0;
    const t = setInterval(async () => {
      n += 1;
      const r = await DpdpSessionStatus(session.sessionID);
      const st = r?.success ? f(r.data, "Status") : null;
      if (st && st !== session.status) {
        setSession((s) => ({ ...s, status: st }));
        if (st === "COMPLETED") {
          notify(tr("Privacy consent completed"), "success");
          loadState(uhid);
        }
      }
      if (n > 120 || st === "COMPLETED" || st === "EXPIRED") clearInterval(t);
    }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.sessionID, session?.status]);

  if (!on) return null;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const st = (k) => f(state, k);
  const complete = st("State") === "COMPLETE";
  const showExtra = visitType === "ER" || minor || form.AbleToDecide !== "YES" || form.CameWith;

  const send = async (channel) => {
    if (!uhid) return notify(tr("Save the registration first. The consent link needs the UHID"), "warn");
    await saveProfile();
    const r = await DpdpSend({ UHID: uhid, Channel: channel, VisitType: visitType, SendTo: minor ? "GUARDIAN" : "SELF" });
    if (!r?.success) return notify(r?.message || tr("Could not send"), "error");
    setSession({ sessionID: f(r.data, "sessionID"), link: f(r.data, "link"), channel, status: "SENT", eventOn: f(r.data, "eventOn") });
    notify(r.message, f(r.data, "eventOn") === false && channel === "SMS" ? "warn" : "success");
  };

  const defer = async (value) => {
    if (!uhid) return notify(tr("Save the registration first"), "warn");
    const r = await DpdpDefer({ UHID: uhid, Value: value, Reason: value ? deferWhy || (visitType === "ER" ? "Emergency" : "") : "Cleared" });
    if (r?.success) {
      setState(r.data);
      setDeferOpen(false);
      notify(r.message, "success");
    } else notify(r?.message, "error");
  };

  const myPrivacy = async () => {
    const r = await DpdpMyPrivacyLink(uhid);
    if (r?.success) setMyLink(f(r.data, "link"));
    else notify(r?.message, "error");
  };

  const languages = (f(config, "languages") || []).map((l) => ({ label: f(l, "LanguageName"), value: f(l, "LanguageCode") }));
  const steps = ["SENT", "OPENED", "COMPLETED"];
  const curStep = steps.indexOf(session?.status);

  const badge = state ? <StateBadge state={state} /> : <Badge tone="off">{uhid ? tr("Loading") : tr("Shown after save")}</Badge>;

  const body = (
      <div className="dpdp-panel px-1">
        <div className="row">
          <ReactSelect
            placeholderName={tr("Mobile belongs to")}
            id="dpdp-mobile-owner"
            name="MobileOwner"
            respclass={COL}
            removeIsClearable={true}
            value={form.MobileOwner}
            dynamicOptions={[
              { label: tr(minor ? "Parent / guardian" : "Patient"), value: "SELF" },
              { label: tr("Relative"), value: "RELATIVE" },
              { label: tr("No mobile"), value: "NONE" },
            ]}
            handleChange={(_, o) => set("MobileOwner", o?.value || "SELF")}
          />
          <ReactSelect
            placeholderName={tr("Notice language")}
            id="dpdp-lang"
            name="LanguageCode"
            respclass={COL}
            removeIsClearable={true}
            value={form.LanguageCode}
            dynamicOptions={languages}
            handleChange={(_, o) => set("LanguageCode", o?.value || "en")}
          />
          {showExtra && (
            <>
              <ReactSelect
                placeholderName={tr("Came with")}
                id="dpdp-came-with"
                name="CameWith"
                respclass={COL}
                value={form.CameWith}
                dynamicOptions={[
                  { label: tr("No one"), value: "NONE" },
                  { label: tr("Parent"), value: "PARENT" },
                  { label: tr("Lawful guardian"), value: "GUARDIAN" },
                  { label: tr("Relative"), value: "RELATIVE" },
                  { label: tr("Police"), value: "POLICE" },
                ]}
                handleChange={(_, o) => set("CameWith", o?.value || "")}
              />
              <ReactSelect
                placeholderName={tr("Patient able to decide")}
                id="dpdp-able"
                name="AbleToDecide"
                respclass={COL}
                removeIsClearable={true}
                value={form.AbleToDecide}
                dynamicOptions={[
                  { label: tr("Yes"), value: "YES" },
                  { label: tr("Unconscious / too unwell"), value: "UNCONSC" },
                  { label: tr("Guardian decides"), value: "GUARDIAN" },
                  { label: tr("Mental capacity to be assessed"), value: "ASSESS" },
                ]}
                handleChange={(_, o) => set("AbleToDecide", o?.value || "YES")}
              />
            </>
          )}
          {(minor || form.AbleToDecide === "GUARDIAN" || form.MobileOwner === "RELATIVE") && (
            <>
              <Input type="text" className="form-control" id="dpdp-g-name" lable={tr(minor ? "Parent / guardian name" : "Guardian / relative name")} placeholder=" " value={form.GuardianName} onChange={(e) => set("GuardianName", e.target.value)} respclass={COL} />
              <Input type="text" className="form-control" id="dpdp-g-rel" lable={tr("Relation")} placeholder=" " value={form.GuardianRelation} onChange={(e) => set("GuardianRelation", e.target.value)} respclass={COL} />
              <Input type="text" className="form-control" id="dpdp-g-mob" lable={tr("Their mobile")} placeholder=" " value={form.GuardianMobile} onChange={(e) => set("GuardianMobile", e.target.value.replace(/[^\d+]/g, "").slice(0, 13))} respclass={COL} />
            </>
          )}
          <div className={`${COL} d-flex align-items-center`}>
            <label className="mb-0 d-flex align-items-center" style={{ gap: 6 }}>
              <input type="checkbox" checked={form.ReadAloud} onChange={(e) => set("ReadAloud", e.target.checked)} /> {tr("Read notice aloud")}
            </label>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center mt-1" style={{ gap: 8 }}>
          <button type="button" className="btn btn-sm btn-success px-3" onClick={() => send("TABLET")} disabled={!uhid}>
            {tr("Tablet")}
          </button>
          <button type="button" className="btn btn-sm btn-success px-3" onClick={() => send("SMS")} disabled={!uhid || (form.MobileOwner === "NONE" && !form.GuardianMobile)}>
            {tr("SMS link")}
          </button>
          <button type="button" className="btn btn-sm btn-success px-3" onClick={async () => (uhid ? (await saveProfile(), setAssisted(true)) : notify(tr("Save the registration first"), "warn"))} disabled={!uhid}>
            {tr("Assisted")}
          </button>
          {(visitType === "ER" || form.AbleToDecide !== "YES") && !yes(st("IsDeferred")) && (
            <button type="button" className="btn btn-sm btn-success px-3" onClick={() => setDeferOpen(true)} disabled={!uhid}>
              {tr("Defer")}
            </button>
          )}
          {yes(st("IsDeferred")) && (
            <span className="dpdp-link" role="button" onClick={() => defer(false)}>
              {tr("Clear deferral")}
            </span>
          )}
          {uhid && (
            <span className="dpdp-link" role="button" onClick={myPrivacy}>
              {tr("My privacy QR")}
            </span>
          )}
          {uhid && <b className="dpdp-num">{tr("UHID")} {uhid}</b>}
          <span className="dpdp-hint">
            {!uhid
              ? tr("Choices are taken after the registration is saved. Billing and care are never held up.")
              : complete
              ? tr("Nothing more to do for this visit.")
              : tr("Care and billing continue; the patient can finish this while waiting.")}
          </span>
        </div>

        {session && (
          <div className="mt-2">
            <div className="dpdp-track">
              {steps.map((s, i) => (
                <span key={s} className={i < curStep || session.status === "COMPLETED" ? "done" : i === curStep ? "cur" : ""}>
                  {tr({ SENT: "Sent", OPENED: "Opened", COMPLETED: "Completed" }[s])}
                </span>
              ))}
              {["EXPIRED", "CANCELLED"].includes(session.status) && <span className="cur">{tr(session.status === "EXPIRED" ? "Expired" : "Replaced by a newer link")}</span>}
            </div>
            {session.link && session.channel === "TABLET" && session.status !== "COMPLETED" && (
              <div className="d-flex flex-wrap align-items-center mt-2" style={{ gap: 16 }}>
                <div style={{ background: "#fff", padding: 6, border: "1px solid #dee2e6" }}>
                  <QRCode value={session.link} size={112} />
                </div>
                <div>
                  <div className="dpdp-hint">{tr("Scan on the consent tablet, or open it here and hand the screen to the patient.")}</div>
                  <a href={session.link} target="_blank" rel="noreferrer">
                    {tr("Open on this device")}
                  </a>
                </div>
              </div>
            )}
            {session.link && session.channel === "SMS" && session.eventOn === false && (
              <div className="dpdp-hint mt-1">
                {tr("SMS event is not switched on yet. Link to share")}: <a href={session.link} target="_blank" rel="noreferrer">{session.link}</a>
              </div>
            )}
          </div>
        )}

        {todo.length > 0 && (
          <ul className="dpdp-hint mt-2 mb-0 pl-3">
            {todo.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
      </div>
  );

  const extras = (
    <>
      {assisted && <AssistedModal uhid={uhid} config={config} minor={minor} form={form} onClose={() => setAssisted(false)} onSaved={(d) => { setState(d); setAssisted(false); }} />}

      {deferOpen && (
        <Modal visible={true} setVisible={() => setDeferOpen(false)} modalWidth="460px" Header={tr("Defer privacy consent")} buttonName={tr("Defer")} handleAPI={() => defer(true)}>
          <p className="dpdp-hint">{tr("Treatment goes ahead (DPDP s.7(f)). The notice and choices are taken when the patient is able, and before discharge.")}</p>
          <Input type="text" className="form-control" id="dpdp-defer-why" lable={tr("Reason")} placeholder=" " value={deferWhy} onChange={(e) => setDeferWhy(e.target.value)} respclass="col-12" />
        </Modal>
      )}

      {myLink && (
        <Modal visible={true} setVisible={() => setMyLink(null)} modalWidth="420px" Header={tr("My privacy")}>
          <div className="text-center">
            <div style={{ background: "#fff", padding: 8, display: "inline-block" }}>
              <QRCode value={myLink} size={180} />
            </div>
            <p className="dpdp-hint mt-2">{tr("The patient scans this to see and change their choices, download a summary, add a nominee or raise a request.")}</p>
            <a href={myLink} target="_blank" rel="noreferrer" style={{ wordBreak: "break-all" }}>
              {myLink}
            </a>
          </div>
        </Modal>
      )}
    </>
  );

  // Registration window: a tile under the fingerprint tile that opens the consent popup.
  if (popup) {
    const tone = f(state, "Tone") || "off";
    return (
      <>
        {compact ? (
          <button
            type="button"
            id="dpdp-consent-btn"
            title={`${tr("Privacy Consent (DPDP)")} - ${state ? tr(f(state, "Label")) : tr("Shown after save")}`}
            onClick={() => setPopupOpen(true)}
            className={`dpdp-mini rounded ${tone}`}
          >
            <i className="fa fa-user-shield" aria-hidden="true" />
          </button>
        ) : (
          <div
            id="dpdp-consent-btn"
            role="button"
            tabIndex={0}
            title={state ? tr(f(state, "Label")) : tr("Privacy consent - shown after save")}
            onClick={() => setPopupOpen(true)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setPopupOpen(true)}
            className={`fp-trigger dpdp-tile p-1 ${tone}`}
          >
            <i className="fa fa-user-shield fp-trigger-icon" aria-hidden="true" />
            <span className="fp-trigger-text">{complete ? tr("CONSENT OK") : tr("CONSENT")}</span>
          </div>
        )}
        {popupOpen && (
          <Modal
            visible={true}
            setVisible={() => setPopupOpen(false)}
            modalWidth="920px"
            Header={`${tr("Privacy Consent (DPDP)")}${uhid ? ` - ${uhid}` : ""}`}
            footer={
              <div className="ftr_btn">
                <button type="button" className="btn btn-sm btn-success px-3" onClick={() => setPopupOpen(false)}>
                  {tr("Close")}
                </button>
              </div>
            }
          >
            <div className="px-1 pb-2">{badge}</div>
            {body}
          </Modal>
        )}
        {extras}
      </>
    );
  }

  return (
    <Accordion title={tr("Privacy Consent (DPDP)")} secondTitle={badge} defaultValue={!complete}>
      {body}
      {extras}
    </Accordion>
  );
}

/** Staff record the choices the patient made on paper or after the notice was read to them. */
function AssistedModal({ uhid, config, minor, form, onClose, onSaved }) {
  const tr = useTr();
  const purposes = (f(config, "purposes") || []).filter((p) => f(p, "Basis") === "CONSENT" && !(minor && !yes(f(p, "ChildAllowed"))));
  const [choices, setChoices] = useState({});
  const [by, setBy] = useState(minor ? "PARENT" : "SELF");
  const [byName, setByName] = useState(minor ? form.GuardianName : "");
  const [attest, setAttest] = useState(false);
  const [sig, setSig] = useState(null);
  const save = async () => {
    const r = await DpdpAssisted({
      UHID: uhid,
      LanguageCode: form.LanguageCode,
      ConsentBy: by,
      ConsentByName: byName,
      ReadAloud: form.ReadAloud,
      Attested: attest,
      Signature: sig,
      Choices: purposes.map((p) => ({ Code: f(p, "Code"), Given: !!choices[f(p, "Code")] })),
    });
    if (r?.success) {
      notify(r.message, "success");
      onSaved(r.data);
    } else notify(r?.message || tr("Could not save"), "error");
  };
  return (
    <Modal visible={true} setVisible={onClose} modalWidth="640px" Header={tr("Assisted consent")} buttonName={tr("Save choices")} handleAPI={save}>
      <div className="dpdp-panel">
        <p className="dpdp-hint">
          {tr("Give the printed notice or read it aloud. Every purpose starts unticked. Tick only what the patient agrees to. Treatment does not depend on any of these.")}
        </p>
        <div className="row">
          <ReactSelect
            placeholderName={tr("Decided by")}
            id="dpdp-as-by"
            name="by"
            respclass="col-md-6 col-12"
            removeIsClearable={true}
            value={by}
            dynamicOptions={(minor ? [] : [{ label: tr("Patient"), value: "SELF" }]).concat([
              { label: tr("Parent"), value: "PARENT" },
              { label: tr("Lawful guardian"), value: "GUARDIAN" },
              { label: tr("Nominee"), value: "NOMINEE" },
            ])}
            handleChange={(_, o) => setBy(o?.value || "SELF")}
          />
          {by !== "SELF" && <Input type="text" className="form-control" id="dpdp-as-name" lable={tr("Their name")} placeholder=" " value={byName} onChange={(e) => setByName(e.target.value)} respclass="col-md-6 col-12" />}
        </div>
        <div className="mt-2">
          {purposes.map((p) => (
            <label key={f(p, "Code")} className="dpdp-choice mb-0" style={{ cursor: "pointer" }}>
              <p>
                {tr(f(p, "Name"))}
                <small>{tr(f(p, "Description") || "")}</small>
              </p>
              <input type="checkbox" checked={!!choices[f(p, "Code")]} onChange={(e) => setChoices((c) => ({ ...c, [f(p, "Code")]: e.target.checked }))} />
            </label>
          ))}
          {minor && <p className="dpdp-hint mt-1">{tr("Offers, loyalty, research and employer sharing are never offered for a child (DPDP s.9(3)).")}</p>}
        </div>
        <SignaturePad label={tr("Signature (optional, on a touch screen)")} onChange={setSig} />
        <label className="d-flex align-items-start mt-2" style={{ gap: 6 }}>
          <input type="checkbox" checked={attest} onChange={(e) => setAttest(e.target.checked)} style={{ marginTop: 3 }} />
          <span>{tr("I gave the privacy notice to the person deciding, in a language they understand, and recorded the choices they made.")}</span>
        </label>
      </div>
    </Modal>
  );
}
