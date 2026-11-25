import React, { useCallback, useEffect, useState } from "react";
import Modal from "../modalComponent/Modal";
import DpdpConsentPanel from "./DpdpConsentPanel";
import { DpdpAdmissionCheck } from "../../networkServices/DpdpApi";
import { StateBadge, f, useDpdpConfig, useTr } from "../../pages/DPDP/dpdpShared";
import "../../pages/DPDP/dpdp.css";

/**
 * DPDP check on the discharge / clearance screens (IPD, Emergency, Day Care). Shows only when something is open:
 * consent deferred at admission (emergency, unable to decide) or the privacy notice never given. It warns and offers
 * the consent panel; it never blocks discharge (DPDP s.7(f) - care is never held up).
 */
export default function DpdpDischargeCheck({ data }) {
  const tr = useTr();
  const config = useDpdpConfig();
  const uhid = data?.patientID ?? data?.PatientID ?? data?.patientId ?? data?.UHID ?? data?.uhid ?? "";
  const [check, setCheck] = useState(null);
  const [open, setOpen] = useState(false);
  const on = !!(config && f(config, "installed") && f(config, "enabled"));

  const load = useCallback(async () => {
    if (!uhid) return;
    const r = await DpdpAdmissionCheck(uhid, "DISCHARGE");
    setCheck(r?.success ? r.data : null);
  }, [uhid]);
  useEffect(() => {
    if (on) load();
  }, [on, load]);

  const todo = f(check, "todo") || [];
  if (!on || !uhid || !check || todo.length === 0) return null;

  return (
    <>
      <div className="color-indicator-4-bg p-2 mt-2 d-flex flex-wrap align-items-center" style={{ gap: 10, borderRadius: 4 }}>
        <b>{tr("Privacy consent before discharge")}</b>
        <StateBadge state={f(check, "state")} />
        <span>{todo.join(" ")}</span>
        <button type="button" className="btn btn-sm btn-success px-3" onClick={() => setOpen(true)}>
          {tr("Take consent now")}
        </button>
        <span className="dpdp-hint">{tr("Discharge is not held up by this.")}</span>
      </div>
      {open && (
        <Modal
          visible={true}
          setVisible={() => {
            setOpen(false);
            load();
          }}
          modalWidth="92vw"
          Header={`${tr("Privacy Consent (DPDP)")} - ${uhid}`}
        >
          <DpdpConsentPanel values={{}} relations={[]} uhid={uhid} source="DISCHARGE" />
        </Modal>
      )}
    </>
  );
}
