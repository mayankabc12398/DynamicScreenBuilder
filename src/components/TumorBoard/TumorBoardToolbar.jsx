import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "primereact/tooltip";
import Modal from "../modalComponent/Modal";
import { notify } from "../../utils/utils";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import {
  FlagTumorBoard,
  GetTumorBoardDiscussion,
  GetTumorBoardStatus,
  UnflagTumorBoard,
} from "../../networkServices/DoctorApi";
import BoardDiscussionView from "./BoardDiscussionView";
import { normaliseSheet, readApiResult, toolbarState } from "./boardDiscussion";
/* The toolbar's icons are self-contained gradient tiles (see regdocs.svg) - the
   button behind them has no background of its own. Two tiles for the flag so
   its state reads at a glance: violet off, red on. */
import icFlag from "../../assets/image/doctor-toolbar/tumor-board.svg";
import icFlagOn from "../../assets/image/doctor-toolbar/tumor-board-on.svg";
import icBoard from "../../assets/image/doctor-toolbar/board-discussion.svg";

/* =============================================================================
   Tumor Board — the two EMR toolbar buttons.

   1. Flag / unflag the patient for the Tumor Board. Always shown; lit when the
      patient is on the board.
   2. Board Discussion — opens the board's sheet read-only. Shown ONLY when a
      discussion exists for the patient; until the board has met there is
      nothing to show, and the brief asks for the button to be hidden.

   One status call per patient (keyed on PatientID), and the sheet itself is
   fetched only when the button is pressed.
   ============================================================================= */

function TumorBoardToolbar({ patient }) {
  const [t] = useTranslation();
  const userData = useLocalStorage("userData", "get");
  const hospitalName =
    userData?.centreName || userData?.CentreName || userData?.hospitalName || "";

  const patientID = patient?.PatientID || patient?.MRNo || "";
  const [state, setState] = useState(toolbarState(null));
  const [sheet, setSheet] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  /* t is left out of the deps on purpose: react-i18next hands back a new
     function identity on every render, and depending on it turns this into a
     fetch-per-render loop. */
  const loadStatus = useCallback(async () => {
    if (!patientID) {
      setState(toolbarState(null));
      return;
    }
    try {
      const { ok, data } = readApiResult(await GetTumorBoardStatus(patientID));
      setState(toolbarState(ok ? data : null));
    } catch (e) {
      setState(toolbarState(null));
    }
  }, [patientID]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleToggleFlag = async () => {
    if (!patientID) return;
    setBusy(true);
    try {
      if (state.isFlagged) {
        const res = await UnflagTumorBoard(state.referralID, patientID);
        notify(res?.message || (res?.success ? t("Removed from the tumor board list") : t("Failed")),
          res?.success ? "success" : "error");
      } else {
        const res = await FlagTumorBoard({
          patientID,
          transactionID: asText(patient?.TransactionID),
          doctorID: asText(patient?.DoctorID),
          note: "",
        });
        notify(res?.message || (res?.success ? t("Patient flagged for the tumor board") : t("Failed")),
          res?.success ? "success" : "error");
      }
      await loadStatus();
    } catch (e) {
      notify(t("Failed to update the tumor board flag"), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleOpenDiscussion = async () => {
    if (!state.hasDiscussion) return;
    setBusy(true);
    try {
      const { ok, data } = readApiResult(await GetTumorBoardDiscussion({ patientID }));
      if (!ok || !data) {
        notify(t("The board discussion could not be read"), "error");
        return;
      }
      setSheet(normaliseSheet(data));
      setOpen(true);
    } catch (e) {
      notify(t("The board discussion could not be read"), "error");
    } finally {
      setBusy(false);
    }
  };

  if (!patientID) return null;

  const flagTitle = state.isFlagged
    ? `${t("On the Tumor Board list")}${state.referralDate ? ` · ${state.referralDate}` : ""} — ${t("click to remove")}`
    : t("Flag for Tumor Board");

  return (
    <>
      <button
        type="button"
        className="btn btn-sm text-white mx-2"
        title={flagTitle}
        aria-label={t("Tumor Board")}
        aria-pressed={state.isFlagged}
        onClick={handleToggleFlag}
        disabled={busy}
      >
        <img
          src={state.isFlagged ? icFlagOn : icFlag}
          className="rx-tb-ico"
          alt=""
          data-pr-tooltip={flagTitle}
          data-pr-position="top"
          id="TumorBoardFlag"
          style={state.isFlagged ? { boxShadow: "0 0 0 2px rgba(179,38,30,0.35)" } : undefined}
        />
        <Tooltip target="#TumorBoardFlag" />
      </button>

      {state.hasDiscussion && (
        <button
          type="button"
          className="btn btn-sm text-white mx-2"
          title={`${t("Board Discussion")}${state.nextMeetingDate ? ` · ${t("next")} ${state.nextMeetingDate}` : ""}`}
          aria-label={t("Board Discussion")}
          onClick={handleOpenDiscussion}
          disabled={busy}
        >
          <img src={icBoard} className="rx-tb-ico" alt="" data-pr-tooltip="Board Discussion" data-pr-position="top" id="TumorBoardView" />
          <Tooltip target="#TumorBoardView" />
        </button>
      )}

      {open && sheet && (
        <Modal
          visible={open}
          setVisible={setOpen}
          Header={t("Tumor Board Discussion")}
          modalWidth="80vw"
          footer={<></>}
        >
          <BoardDiscussionView sheet={sheet} patient={patient} hospitalName={hospitalName} />
        </Modal>
      )}
    </>
  );
}

const asText = (v) =>
  v === null || v === undefined || typeof v === "object" ? "" : String(v);

export default TumorBoardToolbar;
