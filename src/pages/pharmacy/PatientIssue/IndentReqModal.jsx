import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Tables from "../../../components/UI/customTable";
import Input from "../../../components/formComponent/Input";
import TextAreaInput from "../../../components/formComponent/TextAreaInput";
import {
  BillingIPDAcknowledgmentIndent,
  BindItemDetailsAPI,
  GetAllPendingIndentsPharmecy,
  getPatientIndentAPI,
  PendingDraftListAPI,
  PharmacyRejectIndentItem,
  // SRSSAIH-2026-0061 Point 7 Slice B — flag-gated, shipped OFF
  EvaluateIndentApproval,
  RequestIndentApproval,
  DraftPharmecyAPICall,
} from "../../../networkServices/pharmecy";
import moment from "moment";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { notify } from "../../../utils/utils";
import { EDPCheckUserAuthorization } from "../../../networkServices/EDP/edpApi";

/* Indent reject is controlled from EDP > User Authorization (right CanRejectPharmacyIndent) once
   fin_global_resources PharmacyIndentRejectAuthorization is on; the API enforces the same check. */
const PHARMACY_REJECT_RIGHT_COL = "CanRejectPharmacyIndent";
const PHARMACY_REJECT_RESOURCE = "PharmacyIndentRejectAuthorization";
const PHARMACY_REJECT_DENIED =
  "You are not authorized to reject indents. Ask EDP to give you the 'Reject Pharmacy Indent' right in User Authorization.";
import PendingIndent from "./PendingIndent";
import PendingDraft from "./PendingDraft";
import Heading from "../../../components/UI/Heading";
import PrescriptionList from "./PrescriptionList";
import Modal from "../../../components/modalComponent/Modal";
import NestedRowTable from "../../../components/UI/customTable/NestedRowTable";
import SearchByMedicineItemName from "../../../components/commonComponents/SearchByMedicineItemName";
// SRSSAIH-2026-0061 Point 7 Slice D — flag-gated AND prop-gated, shipped OFF
import { SubstitutionOptions } from "../../../networkServices/InventoryApi";
// Doctor's own dose / timing / duration / remarks for a selected prescription (visit-scoped).
import { GetPrescriptionPrintLines } from "../../../networkServices/pharmacyRepeatApi";

/* 25-10-2026 - Pending Prescription rows. Store_Pharmacy_PatientPrescriptionSearch is not the same on every
   database: the column can come as patientID / PatientID / UHID, PatientName / PName, Date / PrescriptionDate,
   DName / DoctorName ... The list, Select and Print all read patientID, PatientName, Date, DoctorID, DName
   and NoOfMedicine, so a different spelling gave rows with every cell blank (and Select / Print sending an
   empty patient). Each row is given those six names from whichever spelling it came with; nothing is removed. */
const pickRxField = (row, names) => {
  const keys = Object.keys(row || {});
  for (const name of names) {
    const hit = keys.find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, "") === name);
    if (hit !== undefined && row[hit] !== null && row[hit] !== undefined && String(row[hit]).trim() !== "") return row[hit];
  }
  return undefined;
};
const normalisePrescriptionRow = (row) => {
  const out = { ...row };
  const set = (target, names) => {
    if (out[target] === undefined || out[target] === null || String(out[target]).trim() === "") {
      const v = pickRxField(row, names);
      if (v !== undefined) out[target] = v;
    }
  };
  set("patientID", ["patientid", "uhid", "mrno", "patientcode"]);
  set("PatientName", ["patientname", "pname", "name", "patient"]);
  set("Date", ["date", "prescriptiondate", "prescriptionon", "prescribedate", "prescribeddate", "visitdate", "entrydate"]);
  set("DoctorID", ["doctorid", "docid", "doctorcode"]);
  set("DName", ["dname", "doctorname", "drname", "prescriptionby", "prescribedby", "doctor"]);
  set("NoOfMedicine", ["noofmedicine", "noofmedicines", "medicinecount", "medicines", "count", "totalmedicine"]);
  return out;
};

export default function IndentReqModal({
  department,
  payloadValue,
  type,
  setParentValues,
  setSearchPatient,
  setModalData,
  SearchPatient,
  saleOnList,
  /* SRSSAIH-2026-0061 Point 7 Slice D — OFF unless the caller opts in.

     Only /ipd-pharmacy-issue passes this. /pharmacy-issue does not pass it at all, so on
     that screen the prop is undefined and every branch below is unreachable — the OPD page
     cannot change behaviour even if the global flag is switched on.

     Two gates rather than one: the prop decides WHICH SCREEN may do this, the global flag
     decides WHETHER THE CLIENT wants it. Neither alone is enough. */
  panelSubstituteOptions = false,
  /* SRSSAIH-2026-0061 Point 7 Slice E — OFF unless the caller opts in, same as Slice D.

     Renders each indent's items directly beneath its own row in the pending-indent grid,
     for every indent in the list at once, instead of one detached "Item Details" block for
     whichever indent was last ticked. /pharmacy-issue does not pass it. */
  inlineIndentItems = false,
  /* SRSSAIH-2026-0061 P7G (25 Sep 2026) — opted in by /ipd-pharmacy-issue only, like the
     two above. Passed straight through to the grid, which adds the indent-type and
     requested-doctor pickers and a free-text box, and orders by indent date then indent
     type. /pharmacy-issue passes nothing, so the OPD list is untouched. */
  wardFilters = false,
  // Patient Return's Indents popup: the indent list as accordion cards (see PendingIndent).
  cardList = false,
  /* With cardList: a button under the open card's lines that hands that indent's lines to
     the caller (Patient Return bills the return straight from the card). */
  onCardAction,
  cardActionLabel = "",
  /* P7P — bumped by the caller when something has changed the indents behind this list,
     a completed bill above all. Re-runs the search so statuses and issued quantities are
     the server's current ones. */
  refreshToken = 0,
  /* The Save action for the ticked indent's own rows — validates and hands them to the
     caller's add handler. Rendered inline, under that indent's own row (see
     inlineRowDetail), instead of once below the whole list, so which indent it acts on
     is never ambiguous. Undefined on /pharmacy-issue, which never ticks more than one
     indent's rows into view at a time the way the ward screen's inline previews do. */
  onAddIndentItems,
  isAddingIndent = false,
  /* Clearance ki "View Requisition" se aaya hua indent.

     Sirf tab bhara hota hai jab user wahan se aaya ho. Aam Indents button par
     ye undefined rehta hai aur niche ka saara hissa chalta hi nahi - yaani
     popup bilkul pehle jaisa khulta hai. */
  autoIndentNo,
  /* Patient Return's on-page Indents list: the search on opening (today's dates) says so
     when it finds no indent, instead of staying quiet. Off elsewhere. */
  listAllOnOpen = false,
}) {
  const [t] = useTranslation();
  const [bodyData, setBodyData] = useState([]);
  const firstIndentSearchDone = React.useRef(false);

  /* SRSSAIH-2026-0061 Point 7 Slice A — four flags, all shipped OFF, one per visible
     behaviour so a client can enable them independently. Read straight from the global
     resources already in redux; Slice A needs no backend change at all. */
  const { GetGlobalResources } = useSelector((state) => state?.CommonSlice);
  const p7Flags = React.useMemo(() => {
    const list = Array.isArray(GetGlobalResources)
      ? GetGlobalResources
      : GetGlobalResources?.data || [];
    const on = (name) =>
      list?.find((item) => item?.Name === name)?.Value === "1";
    const base = {
      sortByType: on("PharmacyIndentSortByType"), // 7.7
      typeFilter: on("PharmacyIndentTypeFilter"), // 7.8
      exportList: on("PharmacyIndentExport"), // 7.9
      fefoBatch: on("PharmacyIssueFEFOBatch"), // 7.10
    };

    /* P7G (25 Sep 2026) — the ward issue screen takes the two Point 7 behaviours that
       belong to issuing against a ward indent, without waiting for a site to set the
       matching global resource. They were built, shipped off, and nobody switched them on,
       which is why expanding a medicine looked like it had lost its old behaviour.

       fefoBatch is the one that matters: it re-sorts an item's batches so the earliest
       expiry comes first, and the allocation loop fills the issue quantity by walking that
       order — so it decides which BATCH goes out, not merely which is listed first.
       Expired stock sorts to the end rather than the front.

       Opted in per screen, so /pharmacy-issue keeps reading the flags alone. */
    return wardFilters
      ? { ...base, fefoBatch: true, typeFilter: true }
      : base;
  }, [GetGlobalResources, wardFilters]);

  /* A line nursing typed by hand on the requisition screen: no item id, so no
     stock, batch or price to issue against. Deliberately NOT behind
     IsIndentWiseMedicineOPDReturn - "Other Medicine" can be requested whatever that
     key says, so this modal must always be able to show what it receives. One
     helper, so the list filter and the three cells below can never disagree about
     what an "other medicine" row is. */
  const isOtherMedicineRow = (val) => Number(val?.ItemID || 0) === 0;

  /* "Issued Item" / flat row view — IPD Pharmacy Issue asked that once an indent is
     acknowledged, a single row show Indent Item | Issued Item | Issued Item Qty |
     Stock In Hand | MP | MRP | Expiry, with a substitute that fully covers the shortfall
     from ONE batch auto-filled straight into that row instead of a separate "SUBSTITUTE
     MED" sub-block. Gated on the same two props as the rest of Point 7 Slice D, so
     /pharmacy-issue (which passes neither) is untouched. A shortfall that needs MORE than
     one batch still falls back to the existing expandable sub-table — a single row can
     only name one item and one quantity. */
  const flatIssueMode = wardFilters && panelSubstituteOptions;

  let userData = useLocalStorage("userData", "get");
  let initialValue = {
    ToDate: new Date(),
    FromDate: new Date(),
    PatientID: SearchPatient?.PatientID,
    panelType: "0",
    type: {
      value: SearchPatient?.PatientType === "EMG" ? "EmergencyNo" : "IndentNo",
    },
    /* The list opens on ALL. It is used to find an indent as often as to work the
       pending queue, and a status that hides the issued ones reads as a list with rows
       missing. The colour chips above narrow it in one click. */
    Status: { value: "ALL", label: "ALL" },
    deptLedgerNo: userData?.deptLedgerNo,
    Name: SearchPatient?.TransNo,
    isDisabled: SearchPatient?.TransNo ? true : false,
  };
  const [values, setValues] = useState(initialValue);

  const handleReactSelect = async (name, value) => {
    setValues((val) => ({ ...val, [name]: value }));
  };
  const handleChange = (e) => {
    if (e.target.name === "PatientID" && SearchPatient?.PatientID) {
      return;
    }
    setValues((val) => ({ ...val, [e.target.name]: e.target.value }));
  };
  const handleMultiSelectChange = (name, selectedOptions) => {
    setValues((val) => ({ ...val, [name]: selectedOptions }));
  };

  /* The list searches itself: once when the popup opens, and again whenever a filter is
     picked - type, status, department, and either date.

     It is watched here rather than called from each dropdown's own handler, because
     those handlers only set state: calling the search inside one would send the filter
     as it was a moment ago, not as it has just been picked. By the time this effect
     runs, the state is the state.

     Quiet, so changing a filter that happens to match nothing leaves an empty list
     rather than an error toast on every pick. The typed indent number is not watched -
     that one waits for Search. */
  useEffect(() => {
    /* Only the Pending Indents popup searches indents. The draft and prescription lists load
       themselves, and this search fills the same bodyData with INDENTS - letting it run for them
       would race their list and, finishing last, replace it (blank / empty Pending Prescription). */
    if (type !== "indent") return;
    // listAllOnOpen: the first search (the Indents click) reports "no record"; later filter picks stay quiet.
    getIndentItem(listAllOnOpen && !firstIndentSearchDone.current);
    firstIndentSearchDone.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    values?.type?.value,
    values?.Status?.value,
    JSON.stringify(values?.department ?? []),
    /* The dates compared by the day they mean, not by the Date object. Two Date objects
       for the same day are never equal to each other, so watching them raw would search
       again on every render that rebuilt one. */
    moment(values?.FromDate).format("YYYY-MM-DD"),
    moment(values?.ToDate).format("YYYY-MM-DD"),
  ]);

  /* The Pending Prescription list searches itself: when the popup opens (both dates start as
     today, so it opens on today's prescriptions) and again whenever either date is changed.
     The indent search above stays out of prescription mode because it fills the same
     bodyData with indents; this is its prescription counterpart. The UHID box is not watched -
     that one waits for Search, like the indent number does. */
  useEffect(() => {
    if (type !== "prescription") return;
    getPatientIndentList(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    type,
    moment(values?.FromDate).format("YYYY-MM-DD"),
    moment(values?.ToDate).format("YYYY-MM-DD"),
  ]);

  /* P7P — and again whenever the caller says the indents have moved on. Skipped on mount:
     the effect above already ran. */
  useEffect(() => {
    if (!refreshToken) return;
    getIndentItem(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  const castDepPayload = () => {
    let data = values?.department?.map((val, index) => val?.code);
    return data;
  };

  const getIndentItem = async (isShowTost = true, statusOverride) => {   
    if (type !== "indent") {
      return;
    }
    const statusValue = statusOverride
      ? typeof statusOverride === "object"
        ? statusOverride?.value
        : statusOverride
      : values?.Status?.value || "PENDING";
    let payload = {
      fromRoleID: castDepPayload() || [],
      searchby: values?.type?.value,
      searchtype: values?.Name ? values?.Name : "",
      status: statusValue,
      fromDate: moment(values?.FromDate).format("DD-MMM-YYYY"),
      toDate: moment(values?.ToDate).format("DD-MMM-YYYY"),
      TransactionType: payloadValue?.transactionType || "Issue",
    };

    const apiResp = await GetAllPendingIndentsPharmecy(payload);
    if (apiResp?.success) {
      setBodyData(apiResp?.data);
      // P7E — pull each indent's items so they are on screen without a click.
      /* P7G — the ward accordion opens one indent at a time and loads that indent's
         lines when it is opened, so pre-loading every indent's items is fifteen HTTP
         calls per search for rows nobody has asked to see. Skipped entirely on that
         path; the flat Slice E grid, which really does show them all at once, still
         needs them. */
      if (inlineIndentItems && !wardFilters) loadInlineIndentItems(apiResp?.data);
    } else {
      setBodyData([]);
      setInlineDetails({});
      isShowTost && notify(apiResp?.message, "error");
    }
  };

  const getPendingDraftList = async (isShowTost = true) => {
    let apiResp = await PendingDraftListAPI();
    if (apiResp?.success) {
      setBodyData(apiResp?.data);
    } else {
      setBodyData([]);
      isShowTost && notify(apiResp?.message, "error");
    }
  };

  const thead = [
    // { name: t("Action"), width: "1%" },
    { name: t("S.No."), width: "1%" },
    { name: t("Medicine"), width: "1%" },
    { name: t("Requested"), width: "1%" },
    { name: t("Issued"), width: "1%" },
    { name: t("Rejected"), width: "1%" },
    { name: t("Available"), width: "1%" },
    { name: t("BatchNumber"), width: "1%" },
    { name: t("Expire Date"), width: "1%" },
    { name: t("MRP"), width: "1%" },
    { name: t("Issue"), width: "1%" },
  ];

  /* Column widths.
     Every column used to be "1%", which tells the browser nothing, so it shared the table
     out evenly: the medicine name - the one column that is read - was squeezed into the
     same space as a three digit quantity. The numbers are given what a number needs and
     the names get the rest. */
  const thead2 = [
    {
      name: t("Action"),
      width: "40px",
      /* Flat issue mode has nothing left for the pharmacist to toggle by hand — a
         multi-batch shortfall already opens its sub-table on its own (see isopen
         below), there is no manual search row any more, and a single auto-picked
         substitute is edited right in the main row. */
      remove: payloadValue?.transactionType === "Return" || flatIssueMode,
    },
    { name: t("S.No."), width: "45px" },
    { name: t(flatIssueMode ? "Indent Item" : "Medicine"), width: "22%" },
    /* The medicine actually handed over in place of the one asked for. It was written as
       a second line under the name, where it was easy to miss and made every substituted
       row twice as tall. In flat issue mode this becomes "Issued Item": the auto-picked
       substitute (or the indented item itself, when nothing needed substituting). */
    { name: t(flatIssueMode ? "Issued Item" : "Substitute"), width: "16%" },
    { name: t("Requested"), width: "7%", textAlign: "right" },
    {
      name: t(
        payloadValue?.transactionType === "Return" ? "Returned" : "Issued",
      ),
      width: "7%",
      textAlign: "right",
    },
    { name: t("Rejected"), width: "7%", textAlign: "right" },
    {
      name: t(flatIssueMode ? "Stock In Hand" : "Available"),
      width: "7%",
      textAlign: "right",
      remove: payloadValue?.transactionType === "Return" ? true : false,
    },
    {
      name: t("BatchNumber"),
      width: "9%",
      remove: payloadValue?.transactionType === "Return" ? true : false,
    },
    {
      name: t(flatIssueMode ? "Expiry" : "Expire Date"),
      width: "8%",
      remove: payloadValue?.transactionType === "Return" ? true : false,
    },
    {
      name: t("MRP"),
      width: "7%",
      textAlign: "right",
      remove: payloadValue?.transactionType === "Return" ? true : false,
    },
    {
      name: t(
        payloadValue?.transactionType === "Return"
          ? "Return"
          : flatIssueMode
            ? "Issued Item Qty"
            : "Issue",
      ),
      width: "70px",
    },
    { name: t("Reject"), width: "45px" },
  ];

  const seondThead = [
    { name: t("Substitute Med"), key: "med", width: "30%" },
    { name: t("Requested"), width: "8%" },
    { name: t("Issued"), width: "8%" },
    { name: t("Rejected"), width: "8%" },
    { name: t("Available"), width: "8%" },
    { name: t("BatchNumber"), width: "12%" },
    { name: t("Expire Date"), width: "10%" },
    { name: t("MRP"), width: "8%" },
    { name: t("Issue"), width: "80px" },
  ];

  const [itemDetailList, setItemDetailList] = useState([]);

  /* ===================================================================================
     SRSSAIH-2026-0061 Point 7 Slice D — show every substitute, let the pharmacist split.

     THE CASE
       Medicines a..f share a salt. Panel Y pays for b, c, d, e and f but not a. A patient
       on Y is indented a. In place of a's single row the pharmacist gets b, c, d, e, f —
       earliest expiry first — with the indented quantity already filled down the list and
       every box editable.

     WHY IN PLACE OF, AND NOT INSTEAD OF
       The row for a stays on screen, greyed, with its quantity forced to zero. Removing it
       would hide what the ward actually asked for, which is the one fact a pharmacist needs
       in order to judge whether the substitute is reasonable. So: a is shown, a is not
       issuable, and what CAN be issued sits underneath it, already open.

     EVERY BRANCH IS BEHIND panelSubstituteOptions. With the prop off this block is dead
     code and the screen behaves exactly as it did before.
     =================================================================================== */

  /* The indented item id arrives as "123" here but as "123#456" (item#stock) on other
     paths. Both have to reduce to the same number or nothing matches. */
  const bareItemID = (v) => Number(String(v ?? "").split("#")[0]) || 0;

  /* Fill the requested quantity down the list, earliest expiry first: as much as the first
     batch holds, then the second, and so on. This is the client's rule stated exactly —
     "in first row the indented item qty are decreased if stock available, otherwise from
     2nd row" — and it is why the server sorts by expiry rather than by name. */
  /* How much of the request the row's OWN batch can cover, and how much it cannot. The
     issue box on the row is capped the same way (see renderIndentItemTable), so these two
     always agree with what the screen shows. */
  /* P7M (25 Sep 2026) — what is still owed on a line: what was asked for, less what has
     already gone out, less what was REJECTED.

     Rejected quantity was not being subtracted, so a line requested 10 and rejected 10
     still offered 10 in its issue box. Rejecting a line is how the pharmacy refuses it;
     letting it be issued afterwards defeats the refusal and puts stock out against a
     quantity the ward is no longer owed. A fully rejected line now computes 0, which the
     input already treats as "disabled".

     Scoped to the ward screen, as the rest of this work is. The same gap exists on
     /pharmacy-issue's indent popup and is worth closing there too, but that screen was
     not in scope. */
  const remainingOf = (row) =>
    Math.max(
      0,
      Number(row?.TotalReqQty || 0) -
        Number(row?.ReceiveQty || 0) -
        (wardFilters ? Number(row?.RejectQty || 0) : 0),
    );
  const selfCoverOf = (row) =>
    Math.min(remainingOf(row), Math.max(0, Number(row?.AvlQty || 0)));
  const shortfallOf = (row) => Math.max(0, remainingOf(row) - selfCoverOf(row));

  /* `limit` is how much these alternatives should cover between them. Blocked rows pass
     nothing and get the whole outstanding quantity, because the requested medicine cannot
     go out at all. A row that is merely short passes its shortfall, so the alternatives
     top it up rather than replacing stock that is on the shelf.

     Never more than a batch holds, and never more than is still outstanding, so the
     allocation and the stock can not disagree. */
  const allocateAcrossOptions = (row, options, limit) => {
    let left =
      limit === undefined || limit === null
        ? remainingOf(row)
        : Math.max(0, Number(limit) || 0);

    return (options || []).map((opt) => {
      const available = Number(opt?.AvlQty || 0);
      const take = Math.max(0, Math.min(left, available));
      left -= take;
      return { ...opt, IssueQuantity: take };
    });
  };

  /* Asks the server what this panel would actually pay for, and what is on the shelf
     instead. Returns the rows to display — which is NOT always the rows it was given:

     a medicine with no stock in this department is dropped by the caller's own filter
     before it gets here, and that is exactly the case where a substitute matters most. So
     a dropped row comes BACK if it turns out to be blocked and to have alternatives. */
  const withPanelSubstituteOptions = async (allRows, visibleRows) => {
    const rows = Array.isArray(allRows) ? allRows : [];
    const visible = new Set(Array.isArray(visibleRows) ? visibleRows : []);

    const itemIDs = [...new Set(rows.map((r) => bareItemID(r?.ItemID)))].filter(
      Boolean,
    );
    if (itemIDs.length === 0) return visibleRows;

    const res = await SubstitutionOptions({
      panelID: Number(SearchPatient?.PanelID) || 0,
      /* The popup clears the selected patient as it opens and re-searches them
         asynchronously, so PanelID above is usually still 0 at this moment. The indent
         rows always carry TransactionID, so the server can find the panel we cannot. */
      transactionID:
        Number(rows.find((r) => Number(r?.TransactionID) > 0)?.TransactionID) ||
        0,
      itemIDs,
      saleOn: saleOnList?.[0]?.TextField || "",
    });

    // A failed lookup must not empty the screen. Fall back to the ordinary list.
    if (!res?.success || !Array.isArray(res?.data)) return visibleRows;

    const byID = new Map(res.data.map((d) => [Number(d?.ItemID), d]));

    const out = [];
    rows.forEach((row) => {
      const info = byID.get(bareItemID(row?.ItemID));
      const isBlocked = info?.Status === "BLOCKED";
      const options = Array.isArray(info?.Options) ? info.Options : [];
      const wasVisible = visible.has(row);

      if (!isBlocked) {
        /* The medicine may go out as itself. Two reasons an alternative still matters:

           P7J — the panel covers a same-generic medicine and this one it has never been
           told about. Worth showing, but nothing is moved to it on its own: the ward asked
           for this item and it is issuable.

           P7K — the shelf cannot cover the request. Twelve asked for, one in stock. The
           eleven that cannot come from this batch are allocated across the alternatives, so
           the ward gets what it asked for instead of a short issue nobody noticed.

           The row's own quantity is untouched either way — its issue box is already capped
           at its own availability, so the two together never exceed what was requested. */
        const shortfall = shortfallOf(row);
        if (options.length > 0) {
          row.PanelSubstitutePanelID = Number(info?.PanelID) || 0;
          row.ShortfallQty = shortfall;
          row.SelfCoverQty = selfCoverOf(row);
          row.PanelCoveredAlternative = shortfall === 0;
          row.ShortOfStock = shortfall > 0;
          row.SubstituteRows = allocateAcrossOptions(row, options, shortfall);
          // Open by itself only when this medicine's own stock cannot meet the request; otherwise the alternatives
          // stay closed until the + beside the medicine is clicked.
          row.isopen = shortfall > 0;
        } else if (shortfall > 0) {
          // Short of stock and no same-generic medicine to offer: still open, for the Search Item box.
          row.isopen = true;
        }
        if (wasVisible) out.push(row);
        return;
      }

      if (options.length === 0) {
        /* Blocked, and there is no same-salt medicine mapped to this panel. The quantity
           is deliberately NOT zeroed here. Refusing to issue anything at all would leave
           the ward with nothing, which is worse than a billing problem — and the mapping
           table being incomplete is far more likely than the medicine being genuinely
           forbidden. The pharmacist is told, and decides. */
        row.PanelBlocked = true;
        row.PanelNoAlternative = true;
        if (wasVisible) out.push(row);
        return;
      }

      row.PanelBlocked = true;
      row.PanelNoAlternative = false;
      /* The panel the SERVER resolved, kept under its own key on purpose.
         Writing it to row.PanelID would be wrong: that field is passed straight to the add
         API as PanelId, the indent detail proc does not return it, and giving it a value it
         has never had could move a price. This one is read only when the swap is logged. */
      row.PanelSubstitutePanelID = Number(info?.PanelID) || 0;
      /* Not payable on this panel, and there IS something to hand over instead: it cannot
         go out as itself. Zeroed and disabled, not hidden. */
      row.IssueQuantity = 0;
      row.SubstituteRows = allocateAcrossOptions(row, options);
      // Not payable on this panel: open by itself only when its own stock cannot meet the request; otherwise closed until
      // the + beside the medicine is clicked (the row says it is not payable and that alternatives exist).
      row.isopen = shortfallOf(row) > 0;
      out.push(row);
    });

    return out;
  };

  /* One substitute row's quantity, typed by hand.
     Capped at whatever that batch actually holds AND at what is still unallocated, so the
     rows can never add up to more than the ward asked for. Nothing is redistributed
     automatically — a number the pharmacist typed is not moved by the screen. */
  const handleSubstituteQty = (parentIndex, optionIndex, value) => {
    const list = [...itemDetailList];
    const row = { ...list[parentIndex] };
    const options = [...(row?.SubstituteRows || [])];
    if (!options[optionIndex]) return;

    const remaining = remainingOf(row);

    const takenByOthers = options.reduce(
      (sum, o, i) => (i === optionIndex ? sum : sum + Number(o?.IssueQuantity || 0)),
      0,
    );

    /* P7K — what the row itself is issuing counts against the request too. Without this
       the substitutes could be typed up to the full outstanding quantity while the row
       also issued its own stock, and more would leave the shelf than the ward asked for.
       A blocked row issues nothing, so its ceiling is the whole outstanding amount, which
       is what it was before. */
    const mainIssue = row?.PanelBlocked
      ? 0
      : Math.max(0, Number(row?.IssueQuantity || 0));
    const ceiling = Math.max(0, remaining - mainIssue);

    const available = Number(options[optionIndex]?.AvlQty || 0);
    const cap = Math.max(0, Math.min(available, ceiling - takenByOthers));

    const typed = Number(value);
    const next = Number.isNaN(typed) ? 0 : Math.max(0, Math.min(typed, cap));

    options[optionIndex] = { ...options[optionIndex], IssueQuantity: next };
    row.SubstituteRows = options;
    list[parentIndex] = row;

    setItemDetailList(list);
    setModalData((val) => ({ ...val, modalData: list }));
  };

  // How much of the request the substitutes currently cover. Shown on the parent row so
  // the pharmacist can see at a glance whether the indent is fully answered.
  const allocatedOn = (row) =>
    (row?.SubstituteRows || []).reduce(
      (sum, o) => sum + Number(o?.IssueQuantity || 0),
      0,
    );

  /* The substitute rows themselves. Keys are positional — NestedRowTable maps them onto
     seondThead in order — so the order of these properties is the column order. */
  const panelSubstituteSubRows = (val, index, editable = true) => {
    if (!panelSubstituteOptions) return [];
    const options = val?.SubstituteRows || [];
    if (options.length === 0) return [];

    const requested = Number(val?.TotalReqQty || 0);
    const alreadyIssued = Number(val?.ReceiveQty || 0);
    const remaining = Math.max(0, requested - alreadyIssued);

    return options.map((opt, optionIndex) => {
      const takenByOthers = options.reduce(
        (sum, o, i) =>
          i === optionIndex ? sum : sum + Number(o?.IssueQuantity || 0),
        0,
      );
      const available = Number(opt?.AvlQty || 0);
      const cap = Math.max(0, Math.min(available, remaining - takenByOthers));

      return {
        med: (
          <span>
            {opt?.ItemName}
            {/* Same salt is not the same medicine. A strength that does not match is a
                clinical decision, so it is said out loud rather than left to be noticed. */}
            {Number(opt?.StrengthMatched) === 1 ? null : (
              <small className="d-block text-danger" style={{ fontSize: "0.65rem" }}>
                {t("different strength")}
              </small>
            )}
            {/* A same-generic medicine is offered whether or not the panel covers it; one it does not cover says so. */}
            {opt?.PanelMapped !== undefined && Number(opt?.PanelMapped) === 0 ? (
              <small className="d-block text-warning" style={{ fontSize: "0.65rem" }}>
                {t("not mapped to this panel")}
              </small>
            ) : null}
          </span>
        ),
        ReqQty: requested || "0",
        IssueQty: alreadyIssued || "0",
        RejectQty: val?.RejectQty ? val?.RejectQty : "0",
        AvlQty: available,
        BatchNumber: opt?.BatchNumber || "",
        MedExpiryDate: opt?.Expiry || "",
        MRP: Number(opt?.MRP || 0).toFixed(2),
        IssueQuantity: (
          <Input
            type="text"
            className="table-input"
            removeFormGroupClass={true}
            display={"right"}
            name={"IssueQuantity"}
            value={String(opt?.IssueQuantity ?? 0)}
            disabled={!editable || (cap <= 0 && Number(opt?.IssueQuantity || 0) <= 0)}
            onChange={(e) =>
              handleSubstituteQty(index, optionIndex, e.target.value)
            }
          />
        ),
      };
    });
  };

  /* SRSSAIH-2026-0061 Point 7 Slice B (7.1 / 7.2).
     Threshold is per panel; 0 = no approval ever required, which is every panel's default.
     Cash patients need no special case for the same reason.
     `approval.lines` is keyed by ItemID so a row can ask "am I blocked?" cheaply. */
  const [approval, setApproval] = useState({
    enabled: false,
    panelLimit: 0,
    blockedCount: 0,
    lines: {},
  });
  const [approvalIndentNo, setApprovalIndentNo] = useState("");

  /* What is still to be issued on this line.

     The procedure hands back ReqQty already net of what has been received, so the only
     thing left to take off it is what was rejected. TotalReqQty is the original ask and
     is used as the fallback where ReqQty did not come through. */
  const pendingOnLine = (val) => {
    const asked = Number(val?.TotalReqQty ?? 0);
    const issued = Number(val?.ReceiveQty ?? 0);
    const rejected = Number(val?.RejectQty ?? 0);
    const remaining =
      val?.ReqQty !== undefined && val?.ReqQty !== null
        ? Number(val.ReqQty) - rejected
        : asked - issued - rejected;
    return Number.isFinite(remaining) ? remaining : 0;
  };

  /* The substitute panel opens on every line except one that is finished.

     It used to refuse whenever stock was plentiful - `AvlQty > ReqQty` - which is most
     lines most of the time, so the + looked broken: four units asked for and five in
     hand, and nothing happened. A substitute is wanted exactly when the pharmacist means
     to hand over something other than what was asked for, and having enough of the
     original says nothing about that.

     A line already issued in full is the one case worth refusing: there is nothing left
     to hand over, so there is nothing to substitute. */
  const handleClickEdit = (val, index, isopen) => {
    /* P7D — a blocked row must always open and close. The guard below refuses to expand a
       line that is already issued in full, which is sensible for the manual substitute
       search but wrong here: the substitutes are already loaded and they are the only
       thing that CAN be issued. */
    if (val?.PanelBlocked) {
      let tbody = JSON.parse(JSON.stringify(itemDetailList));
      tbody[index]["isopen"] = !isopen;
      setItemDetailList(tbody);
      return;
    }
    // An issued line still opens when a substitute is in stock, so the pharmacist can see it.
    if (pendingOnLine(val) <= 0 && !(val?.SubstituteRows?.length > 0)) {
      notify(t("This item is already issued in full"), "warn");
      return;
    }

    let tbody = JSON.parse(JSON.stringify(itemDetailList));
    tbody[index]["isopen"] = !isopen;
    setItemDetailList(tbody);
  };

  /* Asks the server whether any line on this indent needs approval, and where each
     request stands. The panel limit lives on f_panel_master, so the FE never has to know
     what the threshold is or which patients are "credit" — a cash panel simply has a
     limit of 0 and nothing is ever blocked. */
  const evaluateApproval = async (indentNo, lines) => {
    if (!indentNo || !Array.isArray(lines) || lines.length === 0) {
      setApproval({ enabled: false, panelLimit: 0, blockedCount: 0, lines: {} });
      return;
    }

    const res = await EvaluateIndentApproval({
      indentNo,
      panelID: Number(SearchPatient?.PanelID) || 0,
      transactionID: SearchPatient?.TransactionID || "",
      patientID: SearchPatient?.PatientID || "",
      lines: lines.map((l) => ({
        itemID: Number(l?.ItemID) || 0,
        itemName: l?.ItemName || "",
        reqQty: Number(l?.TotalReqQty ?? l?.ReqQty ?? 0),
        // MRP is the priced value on this screen; the amount is stored server-side so a
        // later price change cannot rewrite what was approved.
        rate: Number(l?.MRP) || 0,
      })),
    });

    if (!res?.success || !res?.data?.enabled) {
      setApproval({ enabled: false, panelLimit: 0, blockedCount: 0, lines: {} });
      return;
    }

    const byItem = {};
    (res.data.lines || []).forEach((l) => {
      byItem[Number(l.ItemID)] = l;
    });

    setApprovalIndentNo(indentNo);
    setApproval({
      enabled: true,
      panelLimit: Number(res.data.panelLimit) || 0,
      blockedCount: Number(res.data.blockedCount) || 0,
      basis: res.data.basis,
      lines: byItem,
    });
  };

  const approvalFor = (itemID) => approval?.lines?.[Number(itemID)];

  // 7.1 — a line that needs approval and does not have it cannot be issued.
  const isApprovalBlocked = (itemID) =>
    Boolean(approval?.enabled && approvalFor(itemID)?.IsBlocked);

  const handleRequestApproval = async () => {
    const lines = (itemDetailList || [])
      .filter((l) => approvalFor(l?.ItemID)?.RequiresApproval)
      .map((l) => ({
        itemID: Number(l?.ItemID) || 0,
        itemName: l?.ItemName || "",
        reqQty: Number(l?.TotalReqQty ?? l?.ReqQty ?? 0),
        rate: Number(l?.MRP) || 0,
      }));

    if (lines.length === 0) {
      notify(t("No line on this indent needs approval"), "warn");
      return;
    }

    const res = await RequestIndentApproval({
      indentNo: approvalIndentNo,
      panelID: Number(SearchPatient?.PanelID) || 0,
      transactionID: SearchPatient?.TransactionID || "",
      patientID: SearchPatient?.PatientID || "",
      lines,
    });

    notify(res?.message, res?.success ? "success" : "error");
    if (res?.success) {
      // Re-evaluate so the rows show PENDING rather than staying "not requested".
      evaluateApproval(approvalIndentNo, itemDetailList);
    }
  };

  /* Pending Prescription > Item Details: the doctor's instructions beside each requested
     medicine, so the pharmacist sees what was actually prescribed (dose, timing, meal,
     duration, remarks). Loaded once per selected prescription from the visit-scoped
     PrescriptionPrintLines and matched to the pharmacy's lines by item id, then by name.
     Purely informational - nothing about issuing changes. */
  const [doctorRxByItem, setDoctorRxByItem] = useState({ byId: {}, byName: {} });
  /* Every line of the selected prescription (issued or not). The Item Details grid only
     lists what can still be issued; the lines the pharmacy already issued are appended
     below it, greyed and without an Issue box, so the pharmacist sees the whole
     prescription ("doctor asked for two, one is done") without being able to issue them
     twice. The ADD payload reads itemDetailList only, so they can never be added. */
  const [doctorRxLines, setDoctorRxLines] = useState([]);
  const loadDoctorRx = async (pDetails) => {
    setDoctorRxByItem({ byId: {}, byName: {} });
    setDoctorRxLines([]);
    if (!pDetails?.patientID) return;
    try {
      const lines = await GetPrescriptionPrintLines({
        patientID: pDetails?.patientID,
        date: pDetails?.Date,
        doctorID: pDetails?.DoctorID,
        transactionID: pDetails?.TransactionID ?? pDetails?.transactionID ?? pDetails?.TID ?? "",
        appID: pDetails?.App_ID ?? pDetails?.AppID ?? "",
      });
      const byId = {};
      const byName = {};
      (lines || []).forEach((l) => {
        const id = String(l?.Medicine_ID ?? l?.ItemID ?? "").trim();
        const name = String(l?.MedicineName ?? l?.ItemName ?? "").trim().toLowerCase();
        if (id) byId[id] = l;
        if (name) byName[name] = l;
      });
      setDoctorRxByItem({ byId, byName });
      setDoctorRxLines(Array.isArray(lines) ? lines : []);
      if (!lines?.length) notify(t("No medicine found for this prescription"), "warn");
    } catch (error) {
      console.error("Doctor prescription lines could not be loaded:", error);
    }
  };
  const rxKey = (id, name) => ({
    id: String(id ?? "").split("#")[0].trim(),
    name: String(name ?? "").trim().toLowerCase(),
  });
  const issuedDoctorLines = () => {
    if (type !== "prescription") return [];
    const listed = (itemDetailList || []).map((r) => rxKey(r?.ItemID, r?.ItemName));
    return doctorRxLines.filter((l) => {
      if (Number(l?.IsIssued) !== 1) return false;
      const k = rxKey(l?.Medicine_ID ?? l?.ItemID, l?.MedicineName ?? l?.ItemName);
      return !listed.some((x) => (k.id && x.id === k.id) || (k.name && x.name === k.name));
    });
  };
  /* Prescribed, not yet issued, and not in the grid: the pharmacy has no stock of it. The
     stock query behind the grid only returns medicines that have a batch to issue from, so
     without these lines a medicine the doctor prescribed simply vanished - or, when none
     of the prescription was in stock, the whole prescription answered "No Record Found" -
     and the pharmacist could not tell "never prescribed" from "prescribed, none in stock".
     Shown beneath the grid with a clear tag and no Issue box; ADD reads itemDetailList only,
     so they can never be added. */
  const noStockDoctorLines = () => {
    if (type !== "prescription") return [];
    const listed = (itemDetailList || []).map((r) => rxKey(r?.ItemID, r?.ItemName));
    return doctorRxLines.filter((l) => {
      if (Number(l?.IsIssued) === 1 || Number(l?.Outsource) === 1) return false;
      const k = rxKey(l?.Medicine_ID ?? l?.ItemID, l?.MedicineName ?? l?.ItemName);
      return !listed.some((x) => (k.id && x.id === k.id) || (k.name && x.name === k.name));
    });
  };
  const doctorBits = (rx) =>
    [
      rx?.Dose ? `${t("Dose")}: ${rx.Dose}` : "",
      rx?.Time ? `${t("Timing")}: ${rx.Time}` : "",
      rx?.Meal ? `${t("Meal")}: ${rx.Meal}` : "",
      rx?.NoOfDays ? `${t("Duration")}: ${rx.NoOfDays}` : "",
      rx?.Route ? `${t("Route")}: ${rx.Route}` : "",
    ].filter(Boolean);
  const doctorRxFor = (row) =>
    doctorRxByItem.byId[String(row?.ItemID ?? "").split("#")[0]] ||
    doctorRxByItem.byName[String(row?.ItemName ?? "").trim().toLowerCase()] ||
    null;

  const BindItemDetails = async (
    URL,
    payload,
    isShowTost = true,
    pDetails,
    type,
    indentNo,
    /* SRSSAIH-2026-0061 P7E — { previewOnly: true } returns the shaped rows and touches no
       state at all. Slice E needs the rows for every indent in the list, and letting this
       run its normal course for each of them would have the last one to finish overwrite
       the ticked indent's lines, its approval evaluation and the modal payload ADD reads.

       A separate fetch-and-shape function would have been the other option and a worse
       one: the FEFO re-sort, the batch allocation and the panel substitution all live in
       here, and a second copy of them would drift. */
    options = {},
  ) => {
    let apiResp = await BindItemDetailsAPI(URL, payload);
    if (apiResp?.success) {
      /* SRSSAIH-2026-0061 P7.10 — "If the item has many batches then the first expiry
         batch should come on the top to issue".

         This is NOT cosmetic. Store_Pharmacy_Indent_Detail returns one row per item+batch,
         and the allocation loop directly below walks those rows in order, filling the
         issue quantity from each batch until the request is met. So the row order decides
         which batch is ISSUED, not merely which is shown first.

         The stored procedure is not in this repo and cannot be reordered from here, so the
         rows are re-sorted before the loop runs. Item grouping is preserved by sorting on
         ItemID first — the loop relies on same-item rows being consecutive.

         Expired batches sort to the END, not the front: a plain ascending sort on expiry
         would put already-expired stock first, which is the opposite of the intent. */
      if (p7Flags.fefoBatch && Array.isArray(apiResp?.data)) {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const expiryOf = (row) => {
          const raw = row?.MedExpiryDate ?? row?.Expiry ?? row?.ExpiryDate;
          if (!raw) return null;
          const d = new Date(raw);
          return Number.isNaN(d.getTime()) ? null : d;
        };

        // No expiry date (non-expirable stock) ranks after dated batches but before
        // expired ones — it is usable, just not datable.
        const rank = (d) => {
          if (!d) return 1;
          return d < startOfToday ? 2 : 0;
        };

        // Reorder batches WITHIN each item, preserving the order the items themselves
        // arrived in. Sorting the whole array by ItemID would also reshuffle the item
        // list, which the SRS does not ask for and the user does not expect.
        const groups = new Map();
        apiResp.data.forEach((row) => {
          const key = String(row?.ItemID ?? "");
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(row);
        });

        apiResp.data = [...groups.values()].flatMap((rows) =>
          rows.length < 2
            ? rows
            : [...rows].sort((a, b) => {
                const ea = expiryOf(a);
                const eb = expiryOf(b);
                const ra = rank(ea);
                const rb = rank(eb);
                if (ra !== rb) return ra - rb;
                if (ea && eb) return ea - eb;
                return 0;
              }),
        );
      }

      let pendingQty = 0;
      let data = apiResp?.data
        ?.map((val, index) => {
          let needToIssuQty = val?.ReqQty - val?.RejectQty;
          if (val?.ItemID === apiResp?.data[index - 1]?.ItemID) {
            val.IssueQuantity = 0;
            if (pendingQty > 0) {
              if (pendingQty > val?.AvlQty) {
                val.IssueQuantity = val?.AvlQty;
                pendingQty = pendingQty - val?.AvlQty;
              } else {
                val.IssueQuantity = pendingQty;
                pendingQty = 0;
              }
            }
          } else {
            if (needToIssuQty > val?.AvlQty) {
              val.IssueQuantity = val?.AvlQty;
              pendingQty = needToIssuQty - val?.AvlQty;
            } else {
              val.IssueQuantity = needToIssuQty;
              pendingQty = 0;
            }
          }
          if (type === "prescription") {
            val.PatientID = pDetails?.patientID;
            val.screenType = type;
            // Keep the doctor's prescription line id under the name the save payload
            // reads, whatever the stored procedure called it.
            val.patientMedicine =
              val.patientMedicine ||
              val.PatientMedicine_ID ||
              val.patientMedicine_ID ||
              val.PatientMedicineID ||
              val.PrescribeID ||
              0;
          }
          return val;
        })
        .map((val) => ({
          ...val,
          isopen: false,
          ItemObj: {}, // Initialize ItemObj to prevent "undefined" errors
          // Every detail row loaded here belongs to the single selected indent,
          // so stamp its number authoritatively. The detail API leaves IndentNo
          // blank on some rows (e.g. second-batch rows of an item), which would
          // otherwise reach the return payload as a blank indent number for an
          // against-indent return.
          ...(indentNo ? { IndentNo: indentNo } : {}),
        }));

      /* Lines worth offering: the ones that can still be issued, or an "other medicine"
         row, which carries no stock of its own.

         Where that leaves nothing, the indent's own lines are shown instead. An indent
         issued in full has nothing left on any line, and filtering it to nothing made
         the panel open empty - the indent looked lost rather than finished. Those rows
         cannot be issued again: the Issue box is disabled on its own once a line has
         nothing left, so they are there to be read and printed, not acted on. */
      const issuable = data?.filter(
        (val) =>
          isOtherMedicineRow(val) ||
          (val?.NoStock === 1 && (val?.Alternatives || []).length > 0) ||
          (val?.IssueQuantity !== 0 && val?.AvlQty !== 0),
      );

      /* On the ward screen the client wants the whole indent visible — a line already
         issued, or rejected, or out of stock is still something the ward asked for, and
         leaving it out makes the list disagree with the indent the nurse raised. Every
         other caller keeps the issue list to what can actually be issued (above). */
      const visibleLines = wardFilters
        ? data
        : issuable?.length > 0
          ? issuable
          : (data ?? []);

      /* SRSSAIH-2026-0061 P7D — replace anything the panel will not pay for with what it
         will, before the pharmacist sees the list.

         Gated on indentNo as well as the prop: drafts and prescriptions come through this
         same function without one, and neither is issued against a panel-bound indent. */
      const lines =
        panelSubstituteOptions && indentNo
          ? await withPanelSubstituteOptions(data, visibleLines)
          : visibleLines;

      /* 25-10-2026 - a prescribed medicine with no stock here arrives as a NoStock line with the same-generic medicines
         that are in stock. The best one (strength match, earliest expiry) is chosen as its substitute, quantity = what
         was prescribed up to its stock; the pharmacist can pick another from the list or search one. */
      if (type === "prescription") {
        (lines || []).forEach((line) => {
          if (line?.NoStock !== 1 || !Array.isArray(line?.Alternatives) || line.Alternatives.length === 0) return;
          const best = line.Alternatives[0];
          const wanted = Math.max(0, Number(line?.TotalReqQty || 0) - Number(line?.ReceiveQty || 0));
          line.ItemObj = { ...best, label: best.ItemName, IssueQuantity: Math.min(wanted, Number(best.AvlQty || 0)) };
          line.NewItemName = best.ItemName;
          line.NewItemID = best.ItemID;
          line.isSubtitute = 1;
        });
      }

      // P7E — the caller wants the rows, not the screen.
      if (options?.previewOnly) return lines;

      setItemDetailList(lines);

      // SRSSAIH-2026-0061 P7.1 / P7.2 — evaluate approval once the lines are priced.
      // Skipped entirely unless the client has enabled the feature, so a non-opted-in
      // client makes no extra call.
      evaluateApproval(indentNo, lines);
      setModalData((val) => ({
        ...val,
        modalData: lines,
      }));
      return lines;
    } else {
      if (options?.previewOnly) return [];

      setItemDetailList([]);
      setModalData((val) => ({ ...val, modalData: [] }));
      isShowTost && notify(apiResp?.message, "error");
      return [];
    }
  };

  /* ===================================================================================
     SRSSAIH-2026-0061 Point 7 Slice E — every indent's items, under its own row.

     Before this, the popup showed one detached "Item Details" block for whichever indent
     was last ticked. With more than one indent in the list there was nothing on screen
     tying a medicine to the indent it came from.

     ONLY THE TICKED INDENT IS LIVE. The others are rendered read-only, from this cache.
     ADD is completely unchanged: it reads the modal payload, which only the ticked
     indent's load writes. So a screen showing six indents still issues exactly the one
     that was chosen.
     =================================================================================== */

  // Rows per indent number, for the indents that are NOT ticked.
  const [inlineDetails, setInlineDetails] = useState({});
  const [inlineLoading, setInlineLoading] = useState(false);
  // Which indent the pharmacist ticked. That one renders live and editable.
  const [selectedIndentNo, setSelectedIndentNo] = useState("");

  /* One detail call per indent, and there is no batch endpoint to replace them with. The
     cap is why this is safe to do eagerly: a pharmacist searching a single IPD number gets
     a handful of indents, but a wide date range with no number can return hundreds, and
     firing hundreds of calls the moment a list loads would be a denial of service on our
     own API. Past the cap the remaining indents simply behave as they did before — tick
     one and its items load. */
  const INLINE_PREVIEW_LIMIT = 15;

  const loadInlineIndentItems = async (indentRows) => {
    const list = (Array.isArray(indentRows) ? indentRows : [])
      .filter((r) => r?.indentno)
      .slice(0, INLINE_PREVIEW_LIMIT);

    if (list.length === 0) {
      setInlineDetails({});
      return;
    }

    setInlineLoading(true);
    try {
      // In parallel: sequential would make a six-indent list visibly slow to settle.
      const pairs = await Promise.all(
        list.map(async (r) => {
          try {
            const rows = await BindItemDetails(
              "BindIndentDetailsURL",
              `indentNo=${r.indentno}`,
              false, // never toast per indent — fifteen toasts is not a diagnosis
              undefined,
              undefined,
              r.indentno,
              { previewOnly: true },
            );
            return [r.indentno, Array.isArray(rows) ? rows : []];
          } catch (err) {
            // One indent failing must not blank the other fourteen.
            return [r.indentno, []];
          }
        }),
      );
      setInlineDetails(Object.fromEntries(pairs));
    } finally {
      setInlineLoading(false);
    }
  };

  /* What to draw underneath one indent row. Returns null when there is nothing to show,
     which is how PendingIndent knows to render that indent as an ordinary flat row. */
  const inlineRowDetail = (indentRow) => {
    if (!inlineIndentItems) return null;
    const no = indentRow?.indentno;
    if (!no) return null;

    const isSelected = Boolean(selectedIndentNo) && no === selectedIndentNo;
    const rows = isSelected ? itemDetailList : inlineDetails[no];
    if (!rows || rows.length === 0) return null;

    return (
      <>
        {/* Only the ticked indent gets the approval banner: it is about the lines that are
            actually going to be issued, and repeating it over read-only previews would
            make it look like six separate problems. */}
        {isSelected ? approvalBanner() : null}
        {/* P7H — a line the panel will not pay for and that has no mapped alternative
            cannot be issued, and Add now refuses the whole indent because of it. Said
            here, above the table, so the pharmacist sees it before pressing Add rather
            than being stopped by it, and knows the way out is to send the line back to
            the ward that asked for it. */}
        {isSelected && rows?.some((r) => r?.PanelNoAlternative) ? (
          <div className="alert alert-warning py-1 px-2 mb-1" style={{ fontSize: "11.5px" }}>
            <strong>{t("Cannot be issued")}:</strong>{" "}
            {[
              ...new Set(
                rows
                  .filter((r) => r?.PanelNoAlternative)
                  .map((r) => r?.ItemName)
                  .filter(Boolean),
              ),
            ].join(", ")}{" "}
            — {t("not payable on this panel and no same-salt alternative is mapped.")}{" "}
            {t("Reject the line with the bin beside it so the ward can request a different medicine.")}
          </div>
        ) : null}
        {renderIndentItemTable(rows, isSelected)}
        {/* The Bill action for THIS indent, directly under its own rows — so there is no
           need to scroll all the way to the bottom Bill button to issue it. Both buttons
           run the exact same add-then-save logic (addIndentPicked): this one already has
           this indent's own itemDetailList in scope, so it can hand it over directly; the
           bottom button (always present, serves manual/walk-in adds too) works it out for
           itself from indentPanel.modalData when clicked with nothing added yet. Hidden
           once every line on this indent has been issued or rejected (pendingOnLine <= 0
           for all of them): there is nothing left to do at that point, same condition
           addIndentPicked falls back to checking itself. */}
        {isSelected &&
        onAddIndentItems &&
        rows?.some((r) => pendingOnLine(r) > 0) ? (
          <div className="d-flex justify-content-center px-2 pb-2">
            {/* Same "button" class as the bottom Bill button (PaymentGateway, in
               IPDPharmacyIssue/index.jsx) — same solid dark-green look site-wide, not a
               custom style of its own — just smaller, since it sits under every indent's
               own small table rather than alone at the foot of the whole page. */}
            <button
              type="button"
              className="button"
              style={{
                padding: "4px 24px",
                fontSize: "13px",
                minWidth: 0,
                width: "auto",
                display: "inline-block",
              }}
              disabled={isAddingIndent}
              onClick={() => onAddIndentItems(itemDetailList)}
            >
              {isAddingIndent ? t("Adding…") : t("Bill")}
            </button>
          </div>
        ) : null}
      </>
    );
  };

const SelectPendingIndent = (data, index) => {
    /* The row that was clicked, not bodyData[index].

       The list on screen is not bodyData: it is filtered by the indent type box, sorted
       by type, and now narrowed by the search box, so position N on screen is rarely
       position N in the data. Reading by position opened a different indent than the one
       clicked. The row itself is already handed in. */
    let item = { ...data };

    /* Clicking the open indent again closes it.

       The lines are drawn under the row now, so the tick that opened them is the only
       thing on screen that can put them away - and pressing it again is what anyone
       would try. Without this it re-read the same indent and left the panel where it
       was, which reads as a button that has stopped working.

       Not on the ward screen (wardFilters): its accordion opens and closes the card
       itself and only calls this to open one, so a toggle here would empty the panel
       when a card that is still the selected indent is opened again. */
    if (!wardFilters && item?.indentno && item.indentno === selectedIndentNo) {
      setSelectedIndentNo("");
      setItemDetailList([]);
      return;
    }

    // P7E — from here on this indent's block renders live and editable, and every other
    // indent's block stays a read-only preview.
    setSelectedIndentNo(item?.indentno || "");
    /* Panel/Doctor cleared here too, not just patientDetail below — ticking a NEW indent
       must not leave the PREVIOUS indent's resolved Panel sitting in values.Panel. On the
       ward screen the parent watches values.Panel.value becoming truthy as its signal
       that getPanelIdList has finished resolving the new patient's panel before it
       auto-issues the indent (see the effect next to addIndentPicked); a stale non-empty
       value from before would make that signal lie and fire the auto-issue against the
       wrong patient's panel. */
    setParentValues((val) => ({
      ...val,
      type: { value: 1 },
      Panel: null,
      Doctor: null,
    }));
     setSearchPatient((val) => ({
    ...val,
    value: "",
    patientDetail: {},
  }));
    setTimeout(() => {
    if (item?.IPDNo) {
      setSearchPatient((val) => ({
        ...val,
        value: item?.IPDNo,
        isCallhandleChange: true,
        name: "",
      }));
    } else if (item?.EMGNo) {
      setSearchPatient((val) => ({
        ...val,
        value: item?.EMGNo,
        isCallhandleChange: true,
        name: "",
      }));
    }
      }, 0);
    BindItemDetails(
      "BindIndentDetailsURL",
      `indentNo=${item?.indentno}`,
      true,
      undefined,
      undefined,
      item?.indentno,
    );
  };

  /* The indent whose items are showing (selectedIndentNo) is declared once, above with
     the P7E inline state - the lines are drawn under that indent's own row, so the list
     has to know which row that is. */

  /* Clearance se aaye indent ko khud khol dena.

     Do kadam me, kyunki list pehle aani zaroori hai aur wo API se aati hai:

       1. Filter is indent par set kar do. Dates jaan-bujh kar ek SAAL peeche se
          li jaati hain - popup khud aaj-se-aaj par khulta hai, aur Clearance me
          purane indent bhi dikhte hain (screenshot me 11-Oct ka tha). Aaj wali
          hadd rehti to list khaali aati aur kuch khulta hi nahi.
          Status ALL isliye ki CLOSE ho chuka indent bhi khulna chahiye - wahi
          to Clearance me sabse zyada dekha jaata hai.

       2. List aa jane par usi qatar ko chun lo. Poori qatar chahiye, sirf number
          nahi: SelectPendingIndent usme se IPDNo/EMGNo uthakar patient bhi load
          karta hai. Khud se banaya hua {indentno} bhejte to indent khulta par
          patient khaali reh jaata.

     autoOpenedRef se ek hi baar - warna har baar list badalne par wo dobara
     khul jaata, aur user ke band karne par bhi phir se. */
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    if (!autoIndentNo || autoOpenedRef.current) return;
    setValues((val) => ({
      ...val,
      Name: autoIndentNo,
      type: { value: "IndentNo" },
      Status: { value: "ALL", label: "ALL" },
      FromDate: moment().subtract(1, "year").toDate(),
      ToDate: new Date(),
      // Indent ka khana khula rakha jaata hai, taaki user chahe to badal sake.
      isDisabled: false,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoIndentNo]);

  useEffect(() => {
    if (!autoIndentNo || autoOpenedRef.current) return;

    const row = (Array.isArray(bodyData) ? bodyData : []).find(
      (r) => String(r?.indentno ?? "") === String(autoIndentNo),
    );
    if (!row) return;

    autoOpenedRef.current = true;
    SelectPendingIndent(row, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyData, autoIndentNo]);

  const [cancelModalData, setCancelModalData] = useState({ visible: false });
  const [rejectReason, setRejectReason] = useState("");

  // null = not known yet (the bins stay as they were); false = this user may not reject.
  const [canReject, setCanReject] = useState(null);
  const checkRejectRight = async () => {
    try {
      const res = await EDPCheckUserAuthorization(
        PHARMACY_REJECT_RIGHT_COL,
        PHARMACY_REJECT_RESOURCE,
      );
      const ok = res?.data?.isAuthorized ?? res?.data?.IsAuthorized;
      const allowed = !!res?.success && (ok === true || ok === 1 || ok === "1");
      setCanReject(allowed);
      return allowed;
    } catch (err) {
      setCanReject(false);
      return false;
    }
  };
  useEffect(() => {
    checkRejectRight();
  }, []);

  const handleDeleteIndent = async (Data) => {
    let payload = {
      indentID: String(
        Data?.indentno ? Data?.indentno : Data?.IndentNo ? Data?.IndentNo : "",
      ),
      itemID: String(Data?.ItemID ? Data?.ItemID : ""),
      rejectReason: rejectReason ? rejectReason : "",
    };

    const apiResp = await PharmacyRejectIndentItem(payload);
    if (apiResp?.success) {
      notify(apiResp?.message);
      if (Data?.IndentNo) {
        BindItemDetails(
          "BindIndentDetailsURL",
          `indentNo=${Data?.IndentNo}`,
          true,
          undefined,
          undefined,
          Data?.IndentNo,
        );
      } else {
        await getIndentItem(false);
      }
      setCancelModalData({ visible: false });
    } else {
      notify(apiResp?.message, "error");
    }
  };

  const SelectCancelIndent = async (item) => {
    // asked again on every click, so a right given or taken away in EDP counts straight away
    if (!(await checkRejectRight())) {
      notify(t(PHARMACY_REJECT_DENIED), "error");
      return;
    }
    setCancelModalData({
      visible: true,
      width: "25vw",
      label: <span>{t("Reject")}</span>,
      buttonName: "Reject",
      Component: (
        <TextAreaInput
          lable={"Reject Reason"}
          className="w-100 required-fields"
          id="RejectReason"
          rows={3}
          respclass="w-100"
          name="RejectReason"
          onChange={(e) => {
            setRejectReason(e?.target?.value);
          }}
        />
      ),
      modalData: item,
      CallAPI: handleDeleteIndent,
    });
  };

  const setAcknowledgmentIndent = async (val) => {
    const payload = { indentNo: val?.indentno };
    try {
      const response = await BillingIPDAcknowledgmentIndent(payload);
      if (response?.success) {
        notify(response?.message, "success");
        getIndentItem(false);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) { }
  };

  const handleCustomInput = (index, name, value, type, max, isSubMed) => {
    const numericValue = Number(value);
    const clampValue = isNaN(numericValue)
      ? 0
      : Math.max(0, Math.min(numericValue, max));

    // Value is still clamped (existing behaviour); the toast explains why, so an
    // over-limit entry is not silently corrected with no feedback.
    if (!isNaN(numericValue) && numericValue > max) {
      notify(t("Quantity cannot be more than the available stock"), "error");
    }

    const data = [...itemDetailList];
    if (isSubMed) {
      if (!data[index].ItemObj) {
        data[index].ItemObj = {};
      }
      data[index].ItemObj[name] = clampValue;
    } else {
      data[index][name] = clampValue;
    }

    setItemDetailList(data);
    setModalData((val) => ({ ...val, modalData: data }));
  };

  // The draft whose rows are currently shown in Item Details — needed to reload it
  // after an in-popup quantity update.
  const [selectedDraft, setSelectedDraft] = useState(null);

  const loadDraftItems = (draftID) =>
    BindItemDetails(
      "BindDraftDetailsURL",
      `demandDraftID=${draftID}&deptLedgerNo=${userData?.deptLedgerNo}`,
    );

  const SelectDroftItem = (data, index) => {
    let item = { ...bodyData[index] };
        // setParentValues((val) => ({ ...val, type: { value: 1 } }));
     setSearchPatient((val) => ({
    ...val,
    value: "",
    patientDetail: {},
  }))
    setParentValues((val) => ({
      ...val,
      type: { value: 1 },
      removeIsFocus: true,
    }));
    setSelectedDraft(item);
    loadDraftItems(item?.ID);
  };

  // Saves the edited Issue quantities straight back into the draft, so a quantity
  // change does not have to go the long way round (Add -> grid -> Draft -> reopen).
  // The API only ever rewrites Quantity on an existing draft row, so discounts and
  // every other stored column survive untouched.
  const [isUpdatingDraft, setIsUpdatingDraft] = useState(false);

  const handleUpdateDraft = async () => {
    if (isUpdatingDraft || !itemDetailList?.length) {
      return;
    }

    // Every row must already exist in the draft. Without a detail ID the API would
    // fall through to its "create" branch and write a second, duplicate draft.
    if (itemDetailList?.some((val) => !val?.draftDetailID)) {
      notify(
        t("This draft cannot be updated. Please reopen it and try again."),
        "error",
      );
      return;
    }

    const emptyQtyIndex = itemDetailList?.findIndex(
      (val) => !Number(val?.IssueQuantity),
    );
    if (emptyQtyIndex !== -1) {
      notify(
        `${t("Please enter the quantity for row number")} ${emptyQtyIndex + 1}`,
        "error",
      );
      return;
    }

    const overStockRow = itemDetailList?.find(
      (val) => Number(val?.IssueQuantity) > Number(val?.AvlQty),
    );
    if (overStockRow) {
      notify(
        `${t("Quantity cannot be more than the available stock")}: ${
          overStockRow?.ItemName || ""
        }`,
        "error",
      );
      return;
    }

    setIsUpdatingDraft(true);
    try {
      const payload = {
        draftDetails: {
          patientID: String(selectedDraft?.PatientID ?? ""),
          pName: String(selectedDraft?.PName ?? ""),
          mobile: String(selectedDraft?.ContactNo ?? ""),
          address: String(selectedDraft?.Address ?? ""),
          centreID: userData?.centreID,
        },
        draftItemDetails: itemDetailList?.map((val) => ({
          draftID: Number(val?.draftDetailID),
          itemID: String(val?.ItemID),
          discountpercent: Number(val?.DisPer ?? 0),
          stockID: String(val?.stockid ?? "0"),
          quantity: Number(val?.IssueQuantity),
        })),
      };

      const apiResp = await DraftPharmecyAPICall(payload);
      if (apiResp?.success) {
        notify(apiResp?.message, "success");
        // Reload so the Requested column shows the newly saved quantity, and refresh
        // the list above for its Total Items count.
        await loadDraftItems(selectedDraft?.ID);
        getPendingDraftList(false);
      } else {
        notify(apiResp?.message, "error");
      }
    } finally {
      setIsUpdatingDraft(false);
    }
  };

  const getPatientIndentList = async (isShowTost = true) => {
    const patientID = values?.PatientID?.trim();
    let payload = {
      deptLedgerNo: userData?.deptLedgerNo,
      IPDNO: "",
      PatientID: patientID || "",
      fromDate: moment(values?.FromDate).format("DD-MMM-YYYY"),
      toDate: moment(values?.ToDate).format("DD-MMM-YYYY"),
      indentID: "",
      searchType: "",
      demandDraftID: 0,
    };
    let apiResp = await getPatientIndentAPI(payload);
    if (apiResp?.success) {
      setBodyData(
        type === "prescription" && Array.isArray(apiResp?.data)
          ? apiResp.data.map(normalisePrescriptionRow)
          : apiResp?.data,
      );
    } else {
      setBodyData([]);
      isShowTost && notify(apiResp?.message, "error");
    }
  };

  const SelectPatientIndent = (val) => {
    setSearchPatient((val) => ({
      ...val,
      value: val?.patientID,
      isCallhandleChange: true,
      name: "",
    }));
    BindItemDetails(
      "BindPrescribeDetailsURL",
      `date=${val?.Date}&patientID=${val?.patientID}&doctorID=${val?.DoctorID}`,
      /* Quiet: this query answers "No Record Found" when nothing prescribed is in stock,
         which is not the same as nothing prescribed. loadDoctorRx below says so only when
         the prescription itself has no lines. */
      false,
      val,
      "prescription",
    );
    loadDoctorRx(val);
  };

  const handleItemSelect = (label, value, val, type, e, index) => {
    setItemDetailList((prev) => {
      const updatedList = [...prev];
      /* A starting number, not a limit. The indent's outstanding quantity is the
         sensible opening value, held to what the batch actually has; the box itself
         allows anything up to stock, as the parent line does. */
      const requested = Number(updatedList[index]?.TotalReqQty || 0);
      const issued = Number(updatedList[index]?.ReceiveQty || 0);
      const outstanding = Math.max(0, requested - issued);
      const available = Number(val?.AvlQty ?? 0);
      const defaultIssue = Math.min(outstanding, available);

      updatedList[index].ItemObj = {
        ...val,
        label: label,
        IssueQuantity: defaultIssue,
      };
      updatedList[index].NewItemName = label;
      updatedList[index].NewItemID = value;
      updatedList[index].isSubtitute = 1;
      return updatedList;
    });

    setModalData((val) => ({ ...val, modalData: itemDetailList }));
  };

  /* SRSSAIH-2026-0061 P7.1 — one banner rather than only per-row marks: a pharmacist who
     cannot see why Save is refusing will assume the screen is broken. */
  const approvalBanner = () => {
    if (!approval?.enabled) return null;
    const needing = Object.values(approval.lines || {}).filter(
      (l) => l?.RequiresApproval,
    );
    if (needing.length === 0) return null;

    const blocked = needing.filter((l) => l?.IsBlocked);
    const notRequested = needing.filter((l) => l?.Status === "NOT_REQUESTED");
    const rejected = needing.filter((l) => l?.Status === "REJECTED");

  return (
      <div
        className={`alert py-2 mx-2 mb-2 ${blocked.length > 0 ? "alert-warning" : "alert-success"}`}
      >
        <div className="d-flex align-items-center flex-wrap gap-2">
          <span>
            <strong>
              {needing.length} {t("line(s) exceed this panel's limit")}
            </strong>{" "}
            ({t("limit")} {Number(approval.panelLimit || 0).toFixed(2)},{" "}
            {approval.basis === "INDENT"
              ? t("compared on the indent total")
              : t("compared per item line")}
            ).{" "}
            {blocked.length > 0
              ? `${blocked.length} ${t("cannot be issued until approved")}.`
              : t("All approved.")}
            {rejected.length > 0 && ` ${rejected.length} ${t("rejected")}.`}
          </span>
          {notRequested.length > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-primary ms-auto"
              onClick={handleRequestApproval}
            >
              {t("Send")} {notRequested.length} {t("for approval")}
            </button>
          )}
        </div>
      </div>
    );
  };

  /* ===================================================================================
     The indent's item rows, as a function rather than inline JSX.

     Slice E shows the SAME table in two places: once, editable, under the indent the
     pharmacist has ticked, and once per remaining indent as a read-only preview. Rendering
     it from one function is what stops the two drifting apart — a substitute row that
     behaves differently depending on which block it is in would be worse than not showing
     the previews at all.

     `editable` is not cosmetic. A preview belongs to an indent that is NOT ticked, so its
     rows are not the rows ADD reads and not the rows the change handlers index into:
     handleCustomInput(index, ...) writes to itemDetailList[index], which for a preview is
     a different indent's line entirely. So every input is disabled (which also makes it
     unfocusable, so a keyboard cannot reach it) AND the block is wrapped in
     pointer-events: none. Two independent guards, because one silent mis-write here would
     put a quantity on the wrong patient's medicine.
     =================================================================================== */
  const renderIndentItemTable = (rows, editable = true) => {
    const table = (
              <NestedRowTable
                thead={thead2.filter((val) => (val?.remove ? false : true))}
                seondThead={seondThead}
                tbody={rows?.map((val, index) => {
                  let obj = {};
                  if (payloadValue?.transactionType !== "Return" && !flatIssueMode) {
                    /* A finished line's + is shown spent rather than live, so the
                       pharmacist can see there is nothing to open before clicking. */
                    const lineDone = pendingOnLine(val) <= 0 && !(val?.SubstituteRows?.length > 0);
                    obj.index = (
                        <span
                          onClick={() => handleClickEdit(val, index, val?.isopen)}
                          style={
                            lineDone
                              ? { opacity: 0.35, cursor: "not-allowed" }
                              : { cursor: "pointer" }
                          }
                          title={
                            lineDone
                              ? t("Already issued in full")
                              : t("Substitute this medicine")
                          }
                        >
                          {val?.isopen > 0 ? (
                            <i className="fa fa-minus" aria-hidden="true"></i>
                          ) : (
                            <i className="fa fa-plus" aria-hidden="true"></i>
                          )}
                        </span>
                    );
                  }
                  obj.sno = index + 1;
                  if (isOtherMedicineRow(val) && !flatIssueMode) {
                    obj.index = null;
                  }
                  /* P7D — say why this row cannot be issued, on the row itself. A greyed
                     input with no explanation reads as a broken screen. */
                  obj.ItemName = isOtherMedicineRow(val) ? (
                    <span>
                      {val?.ItemName}{" "}
                      <small className="text-muted">
                        ({t("Other Medicine")})
                      </small>
                    </span>
                  ) : val?.ShortOfStock ? (
                    /* P7K — the numbers, not a warning. A pharmacist about to hand over
                       two different boxes needs to see where each part of the quantity
                       came from. */
                    <span>
                      {val?.ItemName}
                      <small
                        className="d-block text-warning"
                        style={{ fontSize: "0.65rem", lineHeight: 1.1 }}
                      >
                        {t("Only")} {Number(val?.SelfCoverQty || 0)} {t("of")}{" "}
                        {Math.max(
                          0,
                          Number(val?.TotalReqQty || 0) - Number(val?.ReceiveQty || 0),
                        )}{" "}
                        {t("in stock")} — {Number(val?.ShortfallQty || 0)}{" "}
                        {t("allocated from the same-generic alternatives below")}
                      </small>
                    </span>
                  ) : val?.PanelCoveredAlternative ? (
                    <span>
                      {val?.ItemName}
                      <small
                        className="d-block text-info"
                        style={{ fontSize: "0.65rem", lineHeight: 1.1 }}
                      >
                        {(val?.SubstituteRows || []).some((o) => Number(o?.PanelMapped) !== 0)
                          ? t("This panel covers a same-generic medicine — shown below. Issue either.")
                          : t("A same-generic medicine is in stock — shown below. Issue either.")}
                      </small>
                    </span>
                  ) : val?.PanelBlocked ? (
                    <span>
                      {val?.ItemName}
                      {val?.PanelNoAlternative ? (
                        <small
                          className="d-block text-danger"
                          style={{ fontSize: "0.65rem", lineHeight: 1.1 }}
                        >
                          {t(
                            "Not payable on this panel and no same-salt alternative is mapped",
                          )}
                        </small>
                      ) : (
                        <small
                          className="d-block text-danger"
                          style={{ fontSize: "0.65rem", lineHeight: 1.1 }}
                        >
                          {t("Not payable on this panel")} —{" "}
                          {t("issue the alternatives below")} (
                          {allocatedOn(val)}/
                          {Math.max(
                            0,
                            Number(val?.TotalReqQty || 0) -
                              Number(val?.ReceiveQty || 0),
                          )}{" "}
                          {t("allocated")})
                        </small>
                      )}
                    </span>
                  ) : (
                    val?.ItemName
                  );

                  /* Flat issue mode — a shortfall that ONE substitute batch fully covers
                     is edited right here (see obj.Substitute / obj.IssueQuantity below)
                     instead of in the sub-table, so it needs picking out once per row. A
                     shortfall needing more than one batch still goes through the sub-table
                     — a single row cannot name two batches.

                     A substitute is only "needed" when the item cannot go out as itself —
                     short of its own stock (ShortOfStock) or not payable on the panel
                     (PanelBlocked). P7J also attaches SubstituteRows to a row that fully
                     covers the request on its own (PanelCoveredAlternative), purely as
                     optional alternatives to offer; those must NOT be read as "needs a
                     substitute" or a fully-stocked item would wrongly show "N batches —
                     see below" instead of its own name. */
                  const substituteNeeded =
                    flatIssueMode &&
                    Array.isArray(val?.SubstituteRows) &&
                    val.SubstituteRows.length > 0 &&
                    (val?.ShortOfStock || val?.PanelBlocked);
                  /* allocateAcrossOptions fills the shortfall down the list in order and
                     leaves every option past that point at IssueQuantity 0 — most of
                     them typically "not mapped to this panel" and simply offered for the
                     record, not genuinely usable. What matters for "does this fit in one
                     row" is how many options actually have something allocated, not how
                     many candidate rows exist: one DOLO panel-mapped batch covering the
                     whole shortfall, with twenty-three not-mapped alternatives sitting
                     behind it at 0, is still a single-row case. */
                  const allocatedSubOptions = substituteNeeded
                    ? val.SubstituteRows.filter(
                        (opt) => Number(opt?.IssueQuantity || 0) > 0,
                      )
                    : [];
                  const singleSubOpt =
                    allocatedSubOptions.length === 1 ? allocatedSubOptions[0] : null;
                  const multiSubstituteCount =
                    allocatedSubOptions.length > 1 ? allocatedSubOptions.length : 0;
                  /* Nothing to auto-pick and nothing to search for either (see
                     subRowList below, which drops the manual search row in flat issue
                     mode): said once here so the row does not look silently identical to
                     one that is simply fully stocked. */
                  const noSubstituteFound =
                    flatIssueMode &&
                    !isOtherMedicineRow(val) &&
                    !singleSubOpt &&
                    multiSubstituteCount === 0 &&
                    pendingOnLine(val) > 0 &&
                    Number(val?.AvlQty || 0) <= 0;

                  /* What went out in place of what was asked for.

                     The row's own name is the medicine actually issued, so the one it
                     replaced belongs beside it, not under it: as a second line it was
                     read as part of the name and made every substituted row twice as
                     tall. The quantity is shown where there is one, because a part
                     substitution is a different thing from a whole one.

                     In flat issue mode this cell becomes "Issued Item": the medicine
                     actually going out, picked automatically — itself when it has the
                     stock, the one auto-picked substitute when a single batch covers the
                     shortfall, or a count pointing at the sub-table when it takes more
                     than one batch. */
                  obj.Substitute = isOtherMedicineRow(val) ? (
                    <span className="text-muted">-</span>
                  ) : singleSubOpt ? (
                    <span className="text-success">
                      {singleSubOpt?.ItemName}
                      <small
                        className="d-block text-muted"
                        style={{ fontSize: "0.65rem", lineHeight: 1.1 }}
                      >
                        {t("auto-picked — out of stock")}
                      </small>
                    </span>
                  ) : multiSubstituteCount > 1 ? (
                    <span className="text-info">
                      {multiSubstituteCount} {t("batches")} —{" "}
                      {t("see below")}
                    </span>
                  ) : noSubstituteFound ? (
                    <span className="text-danger">
                      {t("No substitute in stock")}
                    </span>
                  ) : flatIssueMode ? (
                    <span>{val?.ItemName}</span>
                  ) : Number(val?.IsSubtitute || 0) === 1 &&
                    val?.SubtituteItemName ? (
                    <span
                      className="text-warning"
                      title={`${t("Substituted for")} ${val?.SubtituteItemName}`}
                    >
                      {val?.SubtituteItemName}
                      {Number(val?.SubstituteItemQty || 0) > 0
                        ? ` (${t("Qty")} ${val?.SubstituteItemQty})`
                        : ""}
                    </span>
                  ) : (
                    <span className="text-muted">-</span>
                  );
                  obj.ReqQty = val?.TotalReqQty ? val?.TotalReqQty : "0";
                  obj.IssueQty = val?.ReceiveQty ? val?.ReceiveQty : "0";
                  obj.RejectQty = val?.RejectQty ? val?.RejectQty : "0";
                  if (payloadValue?.transactionType !== "Return") {
                    /* Stock/batch/price shown here follow whatever is actually being
                       issued — the substitute's, when one has been auto-picked — so the
                       row never shows the zero stock of the item that could not go out. */
                    obj.AvlQty = singleSubOpt
                      ? singleSubOpt?.AvlQty ?? "0"
                      : val?.AvlQty
                        ? val?.AvlQty
                        : "0";
                    obj.BatchNumber = singleSubOpt
                      ? singleSubOpt?.BatchNumber
                      : val?.BatchNumber;
                    obj.MedExpiryDate = singleSubOpt
                      ? singleSubOpt?.Expiry
                      : val?.MedExpiryDate;
                    obj.MRP = singleSubOpt
                      ? Number(singleSubOpt?.MRP || 0).toFixed(4)
                      : val?.MRP
                        ? val?.MRP.toFixed(4)
                        : "0";
                  }
                  obj.IssueQuantity = (() => {
                    /* Flat issue mode — the single auto-picked substitute's quantity is
                       edited right here, in the one "Issued Item Qty" box, instead of in
                       a second box in the sub-table below. allocateAcrossOptions has
                       already filled it with the full shortfall (capped at that batch's
                       own stock); the pharmacist can still correct it, same as any
                       substitute qty, through handleSubstituteQty. */
                    if (singleSubOpt) {
                      const subAvailable = Number(singleSubOpt?.AvlQty || 0);
                      return (
                        <Input
                          type="text"
                          className="table-input"
                          removeFormGroupClass={true}
                          display={"right"}
                          name={"IssueQuantity"}
                          value={String(singleSubOpt?.IssueQuantity ?? 0)}
                          disabled={!editable || subAvailable <= 0}
                          onChange={(e) =>
                            handleSubstituteQty(index, 0, e.target.value)
                          }
                        />
                      );
                    }
                    /* Stock is the only ceiling on what can be issued. The requested
                       quantity is what was asked for, not a limit - a pharmacist may
                       hand over more or less than the indent asked, but never more than
                       the batch actually holds. */
                    const available = Number(val?.AvlQty || 0);
                    let maxIssue = available;

                    /* P7D — the panel will not pay for this medicine and there is one it
                       will. The quantity is forced to zero and the box disabled; the rows
                       underneath are what actually goes out.

                       A blocked row with NO alternative is left alone on purpose — see
                       withPanelSubstituteOptions. */
                    /* P7K — only a BLOCKED row gives up its own quantity. A row that is
                       merely short of stock still issues what it has, and the alternatives
                       cover the rest; zeroing it here would leave that stock on the shelf
                       and short-issue the ward. */
                    if (val?.PanelBlocked && val?.SubstituteRows?.length > 0) {
                      maxIssue = 0;
                    }

                    /* SRSSAIH-2026-0061 P7.1 — a line over its panel's limit cannot be
                       issued until it is approved. Blocking the input is the visible half;
                       the server refuses the save regardless. P7.2 shows who approved it
                       and when, on the line itself, so the pharmacist does not have to go
                       looking. */
                    const ap = approvalFor(val?.ItemID);
                    if (approval?.enabled && ap?.IsBlocked) {
                      maxIssue = 0;
                    }
                    if (approval?.enabled && ap?.RequiresApproval) {
                      return (
                        <div>
                          <Input
                            type="text"
                            className="table-input"
                            removeFormGroupClass={true}
                            display={"right"}
                            name={"IssueQuantity"}
                            value={ap?.IsBlocked ? 0 : (val?.IssueQuantity ?? 0)}
                            disabled={!editable || ap?.IsBlocked || maxIssue <= 0}
                            onChange={(e) => {
                              // Signature is (index, name, value, type, max, isSubMed).
                              // Passing maxIssue in the `type` slot would leave `max`
                              // undefined and clamp every entry to NaN.
                              handleCustomInput(
                                index,
                                "IssueQuantity",
                                e.target.value,
                                "number",
                                maxIssue,
                              );
                            }}
                          />
                          {ap?.Status === "APPROVED" ? (
                            <small
                              className="text-success d-block"
                              style={{ fontSize: "0.65rem", lineHeight: 1.1 }}
                              title={`${ap?.ApprovedBy || ""} ${ap?.ApprovedOn || ""}`}
                            >
                              {t("Approved by")} {ap?.ApprovedBy || "—"}
                              <br />
                              {ap?.ApprovedOn || ""}
                            </small>
                          ) : ap?.Status === "REJECTED" ? (
                            <small
                              className="text-danger d-block"
                              style={{ fontSize: "0.65rem", lineHeight: 1.1 }}
                              title={ap?.Remark || ""}
                            >
                              {t("Rejected")}
                              {ap?.Remark ? ` — ${ap.Remark}` : ""}
                            </small>
                          ) : ap?.Status === "PENDING" ? (
                            <small
                              className="text-warning d-block"
                              style={{ fontSize: "0.65rem", lineHeight: 1.1 }}
                            >
                              {t("Awaiting approval")}
                            </small>
                          ) : (
                            <small
                              className="text-danger d-block"
                              style={{ fontSize: "0.65rem", lineHeight: 1.1 }}
                            >
                              {t("Approval required")}
                            </small>
                          )}
                        </div>
                      );
                    }
                    // Typed by nursing, not an item in the master: there is no
                    // stock, batch or price to issue against, so show the request
                    // and nothing to act on.
                    if (isOtherMedicineRow(val)) {
                      return <span className="text-muted">&mdash;</span>;
                    }
                    return (
                      <Input
                        type="text"
                        className="table-input"
                        removeFormGroupClass={true}
                        display={"right"}
                        name={"IssueQuantity"}
                        value={val?.IssueQuantity ?? 0}
                        disabled={!editable || maxIssue <= 0}
                        onChange={(e) => {
                          handleCustomInput(
                            index,
                            "IssueQuantity",
                            e.target.value,
                            "number",
                            maxIssue,
                          );
                        }}
                      />
                    );
                  })();
                  obj.Reject = isOtherMedicineRow(val) || canReject === false ? null : (
                    <i
                      className="fa fa-trash text-danger text-center"
                      aria-hidden="true"
                      onClick={() => SelectCancelIndent(val, "ItemDetails")}
                    ></i>
                  );

                  obj.subRow = {
                    subRowList: [
                      /* P7D — the panel's own alternatives, FEFO, first.

                         When a single substitute batch fully covers the shortfall and is
                         already shown and editable in the main row (singleSubOpt above),
                         it is left out here — showing it twice would let the same batch's
                         quantity be edited from two boxes that do not know about each
                         other. */
                      ...(singleSubOpt
                        ? []
                        : panelSubstituteSubRows(val, index, editable)),
                      /* The manual "Search Item" fallback row — kept for every OTHER
                         screen that renders this table (it is the only way to reach a
                         medicine the substitution mapping does not know about). Flat
                         issue mode asked for the opposite: issuing against a ward indent
                         should stay fully automatic, with no ad-hoc search box on the
                         line — a request with no auto-matched substitute (noSubstituteFound
                         above) is said on the row itself instead, for the pharmacist to
                         chase as a stock problem rather than search around. */
                      ...(flatIssueMode
                        ? []
                        : [
                            {
                              med: (
                                <SearchByMedicineItemName
                                  handleItemSelect={handleItemSelect}
                                  itemName={val?.ItemObj}
                                  pateintDetails={SearchPatient}
                                  index={index}
                                  isMedSearch={false}
                                  isIndentMedicineSearch={true}
                                  saleOnList={saleOnList}
                                />
                              ),
                              ReqQty: val?.TotalReqQty ? val?.TotalReqQty : "0",
                              IssueQty: val?.ReceiveQty ? val?.ReceiveQty : "0",
                              RejectQty: val?.RejectQty ? val?.RejectQty : "0",
                              AvlQty: val?.ItemObj?.AvlQty ? val?.ItemObj?.AvlQty : "0",
                              BatchNumber: val?.ItemObj?.BatchNumber
                                ? val?.ItemObj?.BatchNumber
                                : "0",
                              MedExpiryDate: val?.ItemObj?.Expiry ? val?.ItemObj?.Expiry : "",
                              MRP: val?.ItemObj?.MRP ? val?.ItemObj?.MRP : "0",
                              IssueQuantity: (function () {
                                /* Stock is the only ceiling, the same rule the parent line
                                   already follows: what was asked for is a request, not a
                                   limit, and a pharmacist may hand over more or less of a
                                   substitute than the indent asked for - but never more
                                   than the batch holds. Capping by what was left after the
                                   parent line's own issue left the box dead on arrival. */
                                const available = Number(
                                  val?.ItemObj?.AvlQty ?? val?.AvlQty ?? 0,
                                );
                                const capped = available;
                                const currentValue = Number(
                                  val?.ItemObj?.IssueQuantity ?? NaN,
                                );
                                const displayValue = !Number.isNaN(currentValue)
                                  ? String(Math.min(currentValue, capped))
                                  : String(capped);
                                return (
                                  <Input
                                    type="text"
                                    className="table-input"
                                    removeFormGroupClass={true}
                                    display={"right"}
                                    name={"IssueQuantity"}
                                    value={displayValue}
                                    max={capped}
                                    disabled={!editable || capped <= 0}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      handleCustomInput(
                                        index,
                                        "IssueQuantity",
                                        v,
                                        "number",
                                        capped,
                                        true,
                                      );
                                    }}
                                  />
                                );
                              })(),
                            },
                          ]),
                    ],
                    /* Already shown and editable in the main row — nothing left under it
                       worth opening by default. In flat issue mode there is no manual
                       search row to fall back to either, so only the genuine multi-batch
                       case (the sub-table panelSubstituteSubRows still renders) has
                       anything worth opening. */
                    isopen: singleSubOpt
                      ? false
                      : flatIssueMode
                        ? multiSubstituteCount > 1 && val?.isopen
                        : val?.isopen,
                  };

                  /* P7L (25 Sep 2026) — the state of each medicine, as a row tint. Ward
                     screen only: NestedRowTable reads `colorcode`, and every other caller
                     of this table has never had tinted item rows.

                     Read in order of what a pharmacist needs to notice first: finished,
                     then refused, then part-done. A line that is simply waiting keeps the
                     default background, so colour means something happened. */
                  if (wardFilters) {
                    const requested = Number(val?.TotalReqQty || 0);
                    const issued = Number(val?.ReceiveQty || 0);
                    const rejected = Number(val?.RejectQty || 0);

                    obj.colorcode =
                      requested > 0 && issued >= requested
                        ? "#D6F0DA" // issued in full
                        : rejected > 0 && issued === 0
                          ? "#FFDDE3" // refused outright
                          : issued > 0
                            ? "#FDF1D6" // part issued, more to come
                            : rejected > 0
                              ? "#FFDDE3"
                              : val?.PanelBlocked
                                ? "#FFF0EE" // cannot go out as itself
                                : "";
                  }

                  return obj;
                })}
              />
    );

    if (editable) return table;

    return (
      <div
        style={{ opacity: 0.65, pointerEvents: "none" }}
        title={t("Tick Select on this indent to issue from it")}
      >
        {table}
      </div>
    );
  };


  /* The lines of the open indent.

     Drawn under the indent that was clicked rather than in a panel of its own at the
     bottom: with a long list the row and its items ended up on different screens, and
     nothing on either said which indent the items belonged to. Built here once and
     rendered in whichever place the current list wants it. */
  /* 25-10-2026 - Pending Prescription > Item Details can issue a substitute, as the indent lines can: search another
     medicine on the line, see its stock and type the quantity to hand over. Only the prescription table gets these
     three columns; what is picked is kept in the line's ItemObj, which the Add button already reads (the line's own
     quantity is added first, then the substitute, linked to the prescribed medicine). */
  const rxThead = [
    ...thead,
    { name: t("Substitute Medicine"), width: "18%" },
    { name: t("Sub. Available"), width: "1%" },
    { name: t("Sub. Issue"), width: "1%" },
  ];

  const renderItemDetails = () => {
    /* A prescription with nothing issuable still has something to show: the lines the
       pharmacy has no stock of (and any already issued). Hiding the block because the
       issuable grid was empty made exactly the prescriptions that most need explaining -
       "nothing in stock" - look like nothing had happened when they were clicked. */
    const prescriptionLines =
      type === "prescription" ? noStockDoctorLines().length + issuedDoctorLines().length : 0;
    if (!(itemDetailList?.length > 0) && prescriptionLines === 0) return null;
    return (
        <div className="mt-2 spatient_registration_card">
          <div className="patient_registration card">
            <Heading
              isBreadcrumb={false}
              title={t("Item Details")}
              secondTitle={
                type === "draft" ? (
                  <button
                    className="btn btn-success px-3"
                    type="button"
                    disabled={isUpdatingDraft}
                    onClick={handleUpdateDraft}
                  >
                    {t("Update Draft")}
                  </button>
                ) : null
              }
            />
            {/* SRSSAIH-2026-0061 P7.1 — renders nothing unless the feature is on AND a
                line on this indent actually exceeds the panel's limit. */}
            {approvalBanner()}
            {type === "indent" ? (
              renderIndentItemTable(itemDetailList, true)
            ) : (
              <Tables
                thead={type === "prescription" ? rxThead : thead}
                getRowClass={(row, index) => {
                  const gridRows = itemDetailList?.length || 0;
                  if (index < gridRows) return "";
                  return index < gridRows + noStockDoctorLines().length
                    ? "rx-nostock-line"
                    : "rx-issued-line";
                }}
                tbody={[...(itemDetailList || []).map((val, index) => ({
                  // Reject: (
                  //   <i
                  //     className="fa fa-trash text-danger text-center"
                  //     aria-hidden="true"
                  //     onClick={() => {
                  //       SelectCancelIndent(val, "ItemDetails");
                  //     }}
                  //   ></i>
                  // ),
                  sno: index + 1,
                  ItemName: (() => {
                    const rx = type === "prescription" ? doctorRxFor(val) : null;
                    if (!rx && val?.NoStock === 1) {
                      return (
                        <div className="text-wrap">
                          {val?.ItemName}
                          <small className="d-block text-danger" style={{ fontSize: "0.65rem" }}>
                            {t("No stock in this department - substitute chosen")}
                          </small>
                        </div>
                      );
                    }
                    if (!rx) return val?.ItemName;
                    const bits = [
                      rx?.Dose ? `${t("Dose")}: ${rx.Dose}` : "",
                      rx?.Time ? `${t("Timing")}: ${rx.Time}` : "",
                      rx?.Meal ? `${t("Meal")}: ${rx.Meal}` : "",
                      rx?.NoOfDays ? `${t("Duration")}: ${rx.NoOfDays}` : "",
                      rx?.Route ? `${t("Route")}: ${rx.Route}` : "",
                    ].filter(Boolean);
                    return (
                      <div className="text-wrap">
                        {val?.ItemName}
                        <div className="rx-doctor-rx">
                          <span className="rx-doctor-rx__tag">{t("Doctor")}</span>
                          {bits.length ? bits.join(" · ") : t("no dosing instruction")}
                          {rx?.Remarks && <div className="rx-doctor-rx__remark">{t("Remarks")}: {rx.Remarks}</div>}
                        </div>
                      </div>
                    );
                  })(),
                  ReqQty: val?.TotalReqQty ? val?.TotalReqQty : "0",
                  IssueQty: val?.ReceiveQty ? val?.ReceiveQty : "0",
                  RejectQty: val?.RejectQty ? val?.RejectQty : "0",
                  /* A no-stock line has nothing of its own to show, so Available / Batch / Expiry / MRP are those of the
                     substitute that is chosen for it (they used to read 0 and blank). */
                  AvlQty: (val?.NoStock === 1 && val?.ItemObj ? val.ItemObj.AvlQty : val?.AvlQty) || "0",
                  BatchNumber: val?.NoStock === 1 && val?.ItemObj ? val.ItemObj.BatchNumber : val?.BatchNumber,
                  MedExpiryDate: val?.NoStock === 1 && val?.ItemObj ? (val.ItemObj.MedExpiryDate || val.ItemObj.Expiry) : val?.MedExpiryDate,
                  MRP: (() => {
                    const mrp = val?.NoStock === 1 && val?.ItemObj ? val.ItemObj.MRP : val?.MRP;
                    return Number(mrp) ? Number(mrp).toFixed(4) : "0";
                  })(),
                  IssueQuantity: (() => {
                    // Stock is the only ceiling - see the note on the other Issue box.
                    const available = Number(val?.AvlQty || 0);
                    const maxIssue = available;
                    return (
                      <Input
                        type="text"
                        className="table-input"
                        removeFormGroupClass={true}
                        display={"right"}
                        name={"IssueQuantity"}
                        value={val?.IssueQuantity}
                        disabled={maxIssue <= 0}
                        onChange={(e) => {
                          handleCustomInput(
                            index,
                            "IssueQuantity",
                            e.target.value,
                            "number",
                            maxIssue,
                          );
                        }}
                      />
                    );
                  })(),
                  ...(type === "prescription"
                    ? {
                        SubstituteMedicine:
                          val?.NoStock === 1 && (val?.Alternatives || []).length > 0 ? (
                            <select
                              className="form-control"
                              style={{ fontSize: "12px", height: 32 }}
                              value={val?.ItemObj?.ItemID || ""}
                              onChange={(e) => {
                                const chosen = (val?.Alternatives || []).find((a) => a.ItemID === e.target.value);
                                if (chosen) handleItemSelect(chosen.ItemName, chosen.ItemID, chosen, "", null, index);
                              }}
                            >
                              {(val?.Alternatives || []).map((a) => (
                                <option key={a.ItemID} value={a.ItemID}>
                                  {`${a.ItemName} · ${a.BatchNumber || "-"} · ${a.Expiry || ""} · ${t("Avl")} ${a.AvlQty}`}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <SearchByMedicineItemName
                              handleItemSelect={handleItemSelect}
                              itemName={val?.ItemObj}
                              pateintDetails={SearchPatient}
                              index={index}
                              isMedSearch={false}
                              isIndentMedicineSearch={true}
                              saleOnList={saleOnList}
                            />
                          ),
                        SubAvailable: val?.ItemObj?.AvlQty ? val?.ItemObj?.AvlQty : "0",
                        SubIssue: (() => {
                          // Stock of the chosen substitute is the only ceiling, as on the indent lines.
                          const capped = Number(val?.ItemObj?.AvlQty ?? 0);
                          const current = Number(val?.ItemObj?.IssueQuantity ?? NaN);
                          return (
                            <Input
                              type="text"
                              className="table-input"
                              removeFormGroupClass={true}
                              display={"right"}
                              name={"IssueQuantity"}
                              value={!Number.isNaN(current) ? String(Math.min(current, capped)) : "0"}
                              max={capped}
                              disabled={!val?.ItemObj?.ItemID || capped <= 0}
                              onChange={(e) => {
                                handleCustomInput(index, "IssueQuantity", e.target.value, "number", capped, true);
                              }}
                            />
                          );
                        })(),
                      }
                    : {}),
                  })),
                  ...noStockDoctorLines().map((rx, i) => {
                    const bits = doctorBits(rx);
                    return {
                      sno: (itemDetailList?.length || 0) + i + 1,
                      ItemName: (
                        <div className="text-wrap">
                          {rx?.MedicineName || rx?.ItemName}
                          <span className="rx-nostock-line__tag">{t("Stock not available")}</span>
                          <div className="rx-doctor-rx">
                            <span className="rx-doctor-rx__tag">{t("Doctor")}</span>
                            {bits.length ? bits.join(" \u00b7 ") : t("no dosing instruction")}
                            {rx?.Remarks && <div className="rx-doctor-rx__remark">{t("Remarks")}: {rx.Remarks}</div>}
                          </div>
                        </div>
                      ),
                      ReqQty: rx?.Quantity ?? rx?.OrderQuantity ?? "-",
                      IssueQty: "0",
                      RejectQty: "-",
                      AvlQty: "0",
                      BatchNumber: "-",
                      MedExpiryDate: "-",
                      MRP: "-",
                      IssueQuantity: (
                        <span
                          className="rx-nostock-line__badge"
                          title={t("The pharmacy has no stock of this medicine, so it cannot be issued")}
                        >
                          <i className="fas fa-exclamation-triangle mr-1" aria-hidden="true"></i>
                          {t("Stock not available")}
                        </span>
                      ),
                    };
                  }),
                  ...issuedDoctorLines().map((rx, i) => {
                    const bits = doctorBits(rx);
                    return {
                      sno: (itemDetailList?.length || 0) + noStockDoctorLines().length + i + 1,
                      ItemName: (
                        <div className="text-wrap">
                          {rx?.MedicineName || rx?.ItemName}
                          <span className="rx-issued-line__tag">{t("Issued")}</span>
                          <div className="rx-doctor-rx">
                            <span className="rx-doctor-rx__tag">{t("Doctor")}</span>
                            {bits.length ? bits.join(" · ") : t("no dosing instruction")}
                            {rx?.Remarks && <div className="rx-doctor-rx__remark">{t("Remarks")}: {rx.Remarks}</div>}
                          </div>
                        </div>
                      ),
                      ReqQty: rx?.Quantity ?? rx?.OrderQuantity ?? "-",
                      IssueQty: Number(rx?.IssueQuantity || 0) > 0 ? Number(rx.IssueQuantity) : "-",
                      RejectQty: "-",
                      AvlQty: "-",
                      BatchNumber: "-",
                      MedExpiryDate: "-",
                      MRP: "-",
                      IssueQuantity: (
                        <span
                          className="rx-issued-line__badge"
                          title={t("Already issued - cannot be selected again")}
                        >
                          <i className="fas fa-check mr-1" aria-hidden="true"></i>
                          {t("Issued")}
                          {rx?.IssuedBillNo ? ` · ${rx.IssuedBillNo}` : ""}
                          {rx?.IssuedBy ? ` · ${rx.IssuedBy}` : ""}
                        </span>
                      ),
                      ...(type === "prescription"
                        ? { SubstituteMedicine: "-", SubAvailable: "-", SubIssue: "-" }
                        : {}),
                    };
                  }),
                ]}
                style={{ height: "20vh" }}
              />
            )}
          </div>
        </div>
    );
  };

  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card">
          {type === "indent" && (
            <PendingIndent
              payloadValue={payloadValue}
              handleChange={handleChange}
              handleReactSelect={handleReactSelect}
              values={values}
              department={department}
              handleMultiSelectChange={handleMultiSelectChange}
              getIndentItem={getIndentItem}
              bodyData={bodyData}
              SelectPendingIndent={SelectPendingIndent}
              p7Flags={p7Flags}
              SearchPatient={SearchPatient}
            SelectCancelIndent={SelectCancelIndent}
            canReject={canReject}
              setAcknowledgmentIndent={setAcknowledgmentIndent}
              /* P7E — opt in from this screen only. Absent, PendingIndent renders the flat
                 grid it always has. */
              renderRowDetail={inlineIndentItems ? inlineRowDetail : undefined}
              inlineLoading={inlineLoading}
              wardFilters={wardFilters}
              /* The flat grid draws the open indent's lines under its own row. Inline
                 mode (P7E) already renders every indent's items itself. */
              selectedIndentNo={selectedIndentNo}
              renderItemDetails={inlineIndentItems ? undefined : renderItemDetails}
              cardList={cardList && !inlineIndentItems}
              cardAction={
                cardList && typeof onCardAction === "function"
                  ? {
                      label: cardActionLabel || t("Add"),
                      run: () => onCardAction(itemDetailList),
                    }
                  : null
              }
            />
          )}
          {type === "draft" && (
            <PendingDraft
              bodyData={bodyData}
              getPendingDraftList={getPendingDraftList}
              SelectDroftItem={SelectDroftItem}
            />
          )}
          {type === "prescription" && (
            <PrescriptionList
              bodyData={bodyData}
              getPatientIndentList={getPatientIndentList}
              SelectPatientIndent={SelectPatientIndent}
              values={values}
              handleChange={handleChange}
              PatientID={SearchPatient?.PatientID}
              setSearchPatient={setSearchPatient}
              patientDetail={SearchPatient?.patientDetail || SearchPatient}
            />
          )}
        </div>
      </div>

      {/* Draft and prescription have no row to hang the lines under, so they keep the
          panel below. The indent list draws them inside itself - under the open row in
          the flat grid, or under every row in P7E inline mode. */}
      {type !== "indent" && renderItemDetails()}

      {cancelModalData?.visible && (
        <Modal
          visible={cancelModalData?.visible}
          setVisible={() => {
            setCancelModalData({ visible: false });
          }}
          modalData={cancelModalData?.modalData}
          modalWidth={cancelModalData?.width}
          Header={cancelModalData?.label}
          buttonType="button"
          buttonName={cancelModalData?.buttonName}
          footer={cancelModalData?.footer}
          handleAPI={cancelModalData?.CallAPI}
        >
          {cancelModalData?.Component}
        </Modal>
      )}
    </>
  );
}