import React, { useEffect, useState } from "react";
import moment from "moment";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import {
  PHARMACY_ITEMINDENT_STATUS,
  PHARMACY_ITEMINDENT_TYPE,
} from "../../../utils/constant";
import Input from "../../../components/formComponent/Input";
import MultiSelectComp from "../../../components/formComponent/MultiSelectComp";
import DatePicker from "../../../components/formComponent/DatePicker";
import Tables from "../../../components/UI/customTable";
// SRSSAIH-2026-0061 Point 7 Slice E — used only when a caller passes renderRowDetail
import NestedRowTable from "../../../components/UI/customTable/NestedRowTable";
import { SelectIconSVG } from "../../../components/SvgIcons";
import Heading from "../../../components/UI/Heading";
import { handleReactSelectDropDownOptions, notify } from "../../../utils/utils";
import ColorCodingSearch from "../../../components/commonComponents/ColorCodingSearch";
import { BindIndentDetailsPdf } from "../../../networkServices/pharmecy";
import { BindRequisitionType } from "../../../networkServices/BillingsApi";
import { RedirectURL } from "../../../networkServices/PDFURL";
import { translateOptions } from "@components/WrapTranslate";
import { exportToExcel } from "../../../utils/exportLibrary";

/* A ward's own colour, when one is set against it on f_rolemaster.
 *
 * Returned only for a colour the browser can actually read, so a typo in the master leaves
 * the cell plain rather than painting it transparent or black.
 */
const wardCellColour = (colour) => {
  const background = String(colour || "").trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(background) ? background : "";
};

/* Whether a colour needs light text on top of it.
 *
 * The colours are chosen by each site and some are dark - OPERATION THEATER (OT) is set to
 * #008080 here - so the text colour is worked out rather than assumed, or the number on a
 * dark ward would be unreadable. Rec. 709 luma: how bright a colour reads, not how big its
 * numbers are. */
const isDarkColour = (hex) => {
  const value = hex.slice(1);
  const full =
    value.length === 3
      ? value.split("").map((c) => c + c).join("")
      : value;
  const luma =
    (0.2126 * parseInt(full.slice(0, 2), 16) +
      0.7152 * parseInt(full.slice(2, 4), 16) +
      0.0722 * parseInt(full.slice(4, 6), 16)) /
    255;
  return luma <= 0.6;
};

export default function PendingIndent({
  values,
  handleReactSelect,
  handleChange,
  department,
  getIndentItem,
  handleMultiSelectChange,
  bodyData,
  SelectPendingIndent,
  SelectCancelIndent,
  // false = no EDP right to reject indents: the bin is not shown (null = not known yet)
  canReject,
  setAcknowledgmentIndent,
  // SRSSAIH-2026-0061 Point 7 Slice A. Defaults to everything off so this component still
  // renders correctly for any caller that does not pass it.
  p7Flags = {},
  /* SRSSAIH-2026-0061 Point 7 Slice E.

     Given a function, each indent row is followed by whatever that function returns for it
     — in practice that indent's own item table. Absent (every caller but
     /ipd-pharmacy-issue), the grid renders exactly as it always has, flat, through the
     shared Tables component. The two render paths are chosen by this prop alone, so a
     caller that does not pass it cannot be affected by any of it. */
  renderRowDetail,
  inlineLoading = false,
  /* SRSSAIH-2026-0061 P7G (25 Sep 2026) — opted in by /ipd-pharmacy-issue only, the same
     way Slice D and E are. It adds the indent-type and requested-doctor pickers and a
     free-text box above the grid, and orders the list by indent date then indent type.
     Every other caller passes nothing and sees this grid exactly as it was. */
  wardFilters = false,
  // The open indent and its lines. Both optional: without them the list behaves exactly
  // as it did, and the caller shows the lines wherever it did before.
  selectedIndentNo = "",
  renderItemDetails,
  /* Opted in by Patient Return's Indents popup only: the flat grid drawn as the
     /ipd-pharmacy-issue accordion cards (.ward-indent-*). Same data and same actions -
     opening a card is the old Select tick, its lines open inside it, and Print / Reject /
     Acknowledge stay on the card. Absent, every other caller sees the flat grid. */
  cardList = false,
  // { label, run } - a button under the open card's lines (Patient Return: "Return").
  cardAction = null,
}) {
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [filterData, setFilterData] = useState([]);
  console.log("filterData", filterData);
  const handleCallViewMedReq = (item) => {
    const filter_data = bodyData?.filter((val) => val?.Acknowledgment === item);
    setFilterData(filter_data);
    // handleSearchViewReqDetails(item);
  };
  const handlePrint = async(item) => {
try {
  const response = await BindIndentDetailsPdf(item?.indentno);
  if(response?.success){
 RedirectURL(response?.data?.pdfUrl)
  }
  else{
    notify(response?.message, "error");
  }
} catch (error) {
  console.log("error",error)
}
  }
  const thead = [
    { name: t("Ack."), width: "1%" },
    { name: t("Reject"), width: "1%" },
    { name: t("Print"), width: "1%" },
    { name: t("Select"), width: "1%" },
    { name: t("Indent No"), width: "1%" },
    { name: t("Date"), width: "1%" },
    { name: t("IPD No."), width: "1%" },
    // { name: t("EMG No."), width: "1%" },
      { name: t("Patient Name"), width: "1%" },
      { name: t("Indent By"), width: "1%" },
       { name: t("Panel"), width: "1%" },
        { name: t("Status"), width: "1%" },
    { name: t("Bed No."), width: "1%" },
    // { name: t("Patient Name"), width: "1%" },
    
    { name: t("Requested"), width: "1%" },
    { name: t("Rejected"), width: "1%" },
    { name: t("Indent Type"), width: "1%" },
    { name: t("Indent From."), width: "1%" },
    /* Kis pharmacy store ko ye indent gaya hai. ShowAllDepartmentPendingIndents
       chaalu ho to list me doosre store ke indent bhi aate hain, aur sirf rang
       se pata nahi chalta ki kaun sa kiska hai - isliye naam saamne likha hai.
       Flag band ho to saare indent apne hi store ke hote hain aur column me
       wahi ek naam aata hai. */
    { name: t("Indent To."), width: "1%" },
    // { name: t("Indent By"), width: "1%" },
    // { name: t("Status"), width: "1%" },
     { name: t("EMG No."), width: "1%" },
    { name: t("Acknowledged By"), width: "1%" },
    // { name: t("IsAcknowledge"), width: "1%" },
    // { name: t("Reject"), width: "1%" },
  ];

  /* ------------------------------------------------------------------
   * SRSSAIH-2026-0061 Point 7 Slice A
   * ---------------------------------------------------------------- */

  // 7.8 — the indent type filter. Values are derived from the loaded data rather than
  // hard-coded: IndentType is free text written by whichever screen raised the indent, so
  // a fixed list would silently hide anything the client actually uses.
  const [indentTypeFilter, setIndentTypeFilter] = useState(null);
  /* Requisition Type chosen by the ward when raising the indent (Normal / Discharge / Regular,
     f_typemaster via the same API the requisition screen uses). Filters the list already loaded,
     like the other boxes here - the list is not paged, so it narrows the whole result. */
  const [requisitionTypeFilter, setRequisitionTypeFilter] = useState(null);
  const [requisitionTypeOptions, setRequisitionTypeOptions] = useState([]);
  useEffect(() => {
    // "Normal" is now called "New" (same TypeID 1) - shown as New until the master is renamed too
    const order = ["new", "discharge", "regular"];
    BindRequisitionType()
      .then((res) => {
        const opts = (res?.data || [])
          .map((r) => String(r?.TypeName ?? "").trim())
          .map((name) => (name.toLowerCase() === "normal" ? "New" : name))
          .filter((name) => order.includes(name.toLowerCase()))
          .sort((a, b) => order.indexOf(a.toLowerCase()) - order.indexOf(b.toLowerCase()))
          .map((name) => ({ label: name, value: name }));
        setRequisitionTypeOptions(opts);
      })
      .catch(() => setRequisitionTypeOptions([]));
  }, []);
  /* P7G — the requested doctor, and a box that filters whatever is on screen as it is
     typed. Both are client-side: the whole result set is already in memory, so they
     narrow the real list rather than a page of it. */
  const [doctorFilter, setDoctorFilter] = useState(null);
  const [quickText, setQuickText] = useState("");
  /* P7G — one indent open at a time. Closed by default: the ward list is long, and a
     screen of expanded item tables showed four patients where thirty would fit. */
  const [openIndentNo, setOpenIndentNo] = useState("");
  /* P7P — the indent whose lines are on their way. Selecting one fetches its items, and
     until they land renderRowDetail has nothing to return, so the first click opened an
     empty panel that read as "the click did nothing". Clicking again collapsed it and a
     third click showed the table, which is why it looked like it needed two clicks. */
  const [loadingIndentNo, setLoadingIndentNo] = useState("");

  /* The doctor who asked for the indent. The list is served by a stored procedure whose
     column name differs between builds, so the first one present wins rather than
     hard-coding a single spelling; when none is returned the picker hides itself instead
     of offering an empty list. UserName is deliberately NOT used as a fallback — that is
     whoever keyed the indent in, which is a different person from the prescriber. */
  const doctorNameOf = (row) =>
    [row?.DoctorName, row?.Doctor, row?.DrName, row?.ConsultantName, row?.RefDoctor]
      .map((v) => (v ?? "").toString().trim())
      .find((v) => v) || "";

  const doctorOptions = React.useMemo(() => {
    const seen = new Set();
    (bodyData || []).forEach((r) => {
      const v = doctorNameOf(r);
      if (v) seen.add(v);
    });
    return [...seen].sort().map((v) => ({ label: v, value: v }));
  }, [bodyData]);

  /* dtEntry arrives as "21-May-26", so a string comparison sorts by day-of-month and puts
     2 June before 21 May. Parsed properly here; an unreadable date sorts last rather than
     throwing the whole order out. */
  const indentDateValue = (row) => {
    /* dtEntry arrives as "21-May-26" or "21-May-26 06:41 PM" depending on the build, so
       only the leading date is parsed and the time, when present, is ignored. */
    const raw = String(row?.dtEntry ?? "").trim().split(/\s+/)[0];
    const m = moment(raw, ["DD-MMM-YY", "DD-MMM-YYYY", "YYYY-MM-DD"], true);
    return m.isValid() ? m.valueOf() : Number.MAX_SAFE_INTEGER;
  };

  const indentTypeOptions = React.useMemo(() => {
    const seen = new Set();
    (bodyData || []).forEach((r) => {
      const v = (r?.IndentType ?? "").toString().trim();
      if (v) seen.add(v);
    });
    return [...seen]
      .sort()
      .map((v) => ({ label: v, value: v }));
  }, [bodyData]);

  /* 7.7 — "Indent should be sorted according to the Indent type like New first, then
     Discharge then Normal".

     Resilient by design: IndentType is free text, and a discharge indent may instead be
     marked by the isDischargeMedicine column on f_indent_detail_patient. Both are checked,
     and anything unrecognised falls to Normal, which is the SRS's own catch-all.

     Sorted in the browser rather than in SQL because this list is not paged — the whole
     result set is already in memory, so sorting here orders the entire list, not a page
     of it. If server paging is ever added, this must move into the query. */
  /* Requisition Type the ward chose: New (saved earlier as "Normal") first, then Discharge, then
     Regular; indents without one (raised before the type was saved) come last. */
  const requisitionTypeRank = (row) => {
    const v = String(row?.RequisitionType ?? "").trim().toLowerCase();
    if (v === "new" || v === "normal") return 1;
    if (v === "discharge") return 2;
    if (v === "regular") return 3;
    return 4;
  };

  /* IPD Pharmacy Issue: Excel per status. Takes the list exactly as it is on screen (date range,
     department, indent / requisition type, doctor and FILTER LIST already applied, sorted New ->
     Discharge -> Regular) and keeps only the rows of that one status. */
  const EXCEL_STATUS = {
    PENDING: { title: "Pending Requisitions", file: "Pending_Requisitions", match: ["PENDING", "OPEN"] },
    PARTIAL: { title: "Partial Requisitions", file: "Partial_Requisitions", match: ["PARTIAL"] },
    ISSUED: { title: "Issued Requisitions", file: "Issued_Requisitions", match: ["ISSUED"] },
  };
  const handleStatusExcel = (statusKey) => {
    const cfg = EXCEL_STATUS[statusKey];
    if (!cfg) return;
    const rows = (visibleRowsRef.current || []).filter((r) =>
      cfg.match.includes(String(r?.StatusNew ?? "").trim().toUpperCase()),
    );
    if (rows.length === 0) {
      notify(t(`No ${statusKey.toLowerCase()} records in the current list`), "error");
      return;
    }
    const data = rows.map((r, i) => ({
      "S.No": i + 1,
      "Indent No": r?.indentno ?? "",
      "Indent Date": r?.dtEntry ?? "",
      "Requisition Type": r?.RequisitionType ?? "",
      "Indent Type": r?.IndentType ?? "",
      Status: r?.StatusNew ?? "",
      "Patient Name": r?.PName ?? "",
      UHID: r?.PatientID ?? "",
      "IPD No": r?.IPDNo ?? "",
      "Bed Detail": r?.BedDetail ?? "",
      Panel: r?.PanelName ?? "",
      "From Ward": r?.DeptFrom ?? "",
      Doctor: doctorNameOf(r) ?? "",
      "Requested Qty": Number(r?.ReqQty ?? 0),
      "Rejected Qty": Number(r?.RejectQty ?? 0),
      "Raised By": r?.UserName ?? "",
      Acknowledged: Number(r?.Acknowledgment) === 1 ? "Yes" : "No",
      "Acknowledged By": r?.AcknowledgmentBy ?? "",
    }));
    const range =
      values?.FromDate && values?.ToDate
        ? `${moment(values.FromDate).format("DD-MMM-YYYY")} to ${moment(values.ToDate).format("DD-MMM-YYYY")}`
        : "";
    exportToExcel(data, cfg.title, range, false, cfg.file);
  };

  const indentTypeRank = (row) => {
    const t = (row?.IndentType ?? "").toString().trim().toUpperCase();
    if (t.includes("NEW")) return 1;
    const isDischarge =
      Number(row?.isDischargeMedicine ?? row?.IsDischargeMedicine ?? 0) === 1 ||
      t.includes("DISCHARGE");
    if (isDischarge) return 2;
    return 3;
  };

  /* Searching inside the list that has already been fetched.
     The boxes at the top go back to the server; this one does not. Once the indents are
     on screen the reader is hunting for one of them - a bed, a ward, a patient - and a
     round trip to re-ask for rows already in the browser only slows that down. Every
     column shown in the table is searched, so whatever is read on screen can be typed. */
  const [listSearch, setListSearch] = useState("");
  // Patient Return's indent cards (cardList): an ISSUED indent there means its medicine has
  // come back, so it reads RETURNED. Elsewhere the status shows as it is.
  const statusText = (status) =>
    cardList && String(status || "").trim().toUpperCase() === "ISSUED"
      ? "RETURNED"
      : status;

  const matchesSearch = (row, term) => {
    const needle = term.trim().toLowerCase();
    if (!needle) return true;
    return [
      row?.indentno,
      row?.dtEntry,
      row?.IPDNo,
      row?.EMGNo,
      row?.PName,
      row?.PatientID,
      row?.UserName,
      row?.PanelName,
      row?.StatusNew,
      row?.BedDetail,
      row?.IndentType,
      row?.RequisitionType,
      row?.DeptFrom,
      row?.AcknowledgmentBy,
    ].some((cell) => String(cell ?? "").toLowerCase().includes(needle));
  };

  const visibleRowsRef = React.useRef([]);
  const visibleRows = React.useMemo(() => {
    let rows = filterData || [];

    if (listSearch.trim()) rows = rows.filter((r) => matchesSearch(r, listSearch));

    if ((p7Flags?.typeFilter || wardFilters) && indentTypeFilter?.value) {
      rows = rows.filter(
        (r) =>
          (r?.IndentType ?? "").toString().trim() === indentTypeFilter.value,
      );
    }

    if (requisitionTypeFilter?.value) {
      // indents saved before the rename say "Normal": they are "New"
      const norm = (v) => {
        const x = String(v ?? "").trim().toLowerCase();
        return x === "normal" ? "new" : x;
      };
      const wanted = norm(requisitionTypeFilter.value);
      rows = rows.filter((r) => norm(r?.RequisitionType) === wanted);
    }

    if (wardFilters && doctorFilter?.value) {
      rows = rows.filter((r) => doctorNameOf(r) === doctorFilter.value);
    }

    /* 24-10-2026 - Status, Department and the From / To dates are sent to the server, but the
       stored procedure behind this list does not honour them on every build (it returned
       13-Oct and 22-Oct indents with both boxes on 24-Oct, whatever the Status or Department
       said). The three boxes are therefore applied to the loaded rows as well, so what the
       boxes say is what the grid shows. A row that does not carry the field is kept rather
       than dropped. When an indent / IPD number is typed the server skips the dates on
       purpose, so the dates are skipped here too. */
    const wantedStatus = String(values?.Status?.value ?? "").trim().toUpperCase();
    if (wantedStatus && wantedStatus !== "ALL") {
      // OPEN is what the procedure calls a PENDING indent, CLOSE what the list calls ISSUED
      const alias = { PENDING: ["PENDING", "OPEN"], ISSUED: ["ISSUED", "CLOSE"] };
      const accepted = alias[wantedStatus] || [wantedStatus];
      rows = rows.filter((r) => {
        const own = String(r?.Status ?? "").trim().toUpperCase();
        const calc = String(r?.StatusNew ?? "").trim().toUpperCase();
        if (!own && !calc) return true;
        return accepted.includes(own) || accepted.includes(calc);
      });
    }

    const wantedWards = (values?.department || [])
      .map((d) => String(d?.name ?? "").trim().toUpperCase())
      .filter(Boolean);
    if (wantedWards.length > 0) {
      rows = rows.filter((r) => {
        const ward = String(r?.DeptFrom ?? "").trim().toUpperCase();
        return !ward || wantedWards.includes(ward);
      });
    }

    if (!wardFilters && !String(values?.Name ?? "").trim() && values?.FromDate && values?.ToDate) {
      const from = moment(values.FromDate).startOf("day").valueOf();
      const to = moment(values.ToDate).endOf("day").valueOf();
      rows = rows.filter((r) => {
        const d = indentDateValue(r);
        return d === Number.MAX_SAFE_INTEGER || (d >= from && d <= to);
      });
    }

    /* The free-text box reads the columns a pharmacist actually scans for, not every key
       on the row: matching hidden ids would return rows with nothing visible to explain
       why they matched. */
    /* The From / To boxes are sent to the server, but the stored procedure behind this
       list returns every PENDING indent regardless of date — which is why the grid showed
       May and June indents while both boxes read today. The range is therefore applied
       here as well, so the boxes do what they say.

       Consequence worth knowing: the default is today, so yesterday's unissued indents are
       not on screen until the From date is moved back. That is the behaviour the client
       asked for. */
    if (wardFilters && values?.FromDate && values?.ToDate) {
      const from = moment(values.FromDate).startOf("day").valueOf();
      const to = moment(values.ToDate).endOf("day").valueOf();
      rows = rows.filter((r) => {
        const d = indentDateValue(r);
        // An unreadable date is kept rather than silently dropped.
        return d === Number.MAX_SAFE_INTEGER || (d >= from && d <= to);
      });
    }

    const needle = quickText.trim().toLowerCase();
    if (wardFilters && needle) {
      rows = rows.filter((r) =>
        [
          r?.indentno,
          r?.PName,
          r?.IPDNo,
          r?.IndentType,
          r?.BedDetail,
          r?.DeptFrom,
          r?.PanelName,
          r?.StatusNew,
          r?.UserName,
          doctorNameOf(r),
        ]
          .map((v) => (v ?? "").toString().toLowerCase())
          .some((v) => v.includes(needle)),
      );
    }

    /* P7G — indent date first, indent type second, at the client's request. Oldest first:
       this is a work queue, and the indent that has waited longest is the one to issue.
       Kept ahead of the older type-first ordering so that turning both on cannot leave the
       precedence ambiguous. */
    if (wardFilters) {
      rows = [...rows].sort((a, b) => {
        const byReqType = requisitionTypeRank(a) - requisitionTypeRank(b);
        if (byReqType !== 0) return byReqType;
        const byDate = indentDateValue(a) - indentDateValue(b);
        if (byDate !== 0) return byDate;
        return indentTypeRank(a) - indentTypeRank(b);
      });
    } else if (p7Flags?.sortByType) {
      // Copy before sorting — never mutate the array held in state.
      rows = [...rows].sort((a, b) => {
        const diff = indentTypeRank(a) - indentTypeRank(b);
        if (diff !== 0) return diff;
        // Within a type, oldest indent first: the one that has waited longest.
        return String(a?.dtEntry ?? "").localeCompare(String(b?.dtEntry ?? ""));
      });
    }

    visibleRowsRef.current = rows;
    return rows;
  }, [
    filterData,
    listSearch,
    indentTypeFilter,
    requisitionTypeFilter,
    doctorFilter,
    quickText,
    wardFilters,
    values?.FromDate,
    values?.ToDate,
    values?.Status?.value,
    values?.Name,
    JSON.stringify(values?.department ?? []),
    p7Flags?.typeFilter,
    p7Flags?.sortByType,
  ]);

  /* 7.9 — "Option to generate the report from the issue screen in the pdf or excel the
     same list which we have searched below in the list".

     No export code here on purpose: the shared Tables component already provides PDF and
     Excel export via isExportPDf / isExportExcel, and it exports the RENDERED table — which
     is exactly the searched list, after the type filter and in the sorted order. Writing a
     second exporter would duplicate what the project already has. */

  const colorMap = {
    OPEN: "#CCF1FF",
    PENDING: "#CCF1FF",
    PARTIAL: "#f7dc6f",
    // "OPEN','PARTIAL": "#FFF59D",
    CLOSE: "#E6E6E6",
    REJECT: "#FFD1DA",
    /* ISSUED had no entry, so its legend swatch was white on white and an issued row
       carried no tint at all. */
    ISSUED: "#D6F0DA",
    ALL: "#ff07a0",
  };
  /* IPD Pharmacy Issue ward list: darker shades of the same status colours, at the client's
     request. `fill` tints the row and the filter button, `strong` is the stripe, the
     swatch and the status pill. Other screens keep colorMap above. */
  const wardTone = {
    OPEN: { fill: "#9ED8F0", strong: "#1A8FC4" },
    PENDING: { fill: "#9ED8F0", strong: "#1A8FC4" },
    PARTIAL: { fill: "#F3CF4E", strong: "#C99A00" },
    ISSUED: { fill: "#9FD8AA", strong: "#2E9E4A" },
    REJECT: { fill: "#F4A7B6", strong: "#D64563" },
    CLOSE: { fill: "#C9C9C9", strong: "#8A8A8A" },
  };
  const wardStatusTone = (status) => wardTone[String(status || "").toUpperCase()];

  useEffect(() => {
    if (values?.deptLedgerNo) {
      getIndentItem(false);
    }
  }, [values?.deptLedgerNo]);
  useEffect(() => {
    // if()
    //   const filter_data=bodyData?.filter((val)=>val?.Acknowledgment===item)
    setFilterData(bodyData);
  }, [getIndentItem]);

  /* One row-builder for both render paths. Duplicating this map for the nested variant
     would be the obvious shortcut and the wrong one: the two copies would drift, and the
     grid a pharmacist sees would depend on a flag rather than on the data. */
  const buildIndentRows = () =>
    visibleRows?.map((val, index) => {
      /* ShowAllDepartmentPendingIndents chaalu ho to list me doosre
         pharmacy store ke indent bhi aate hain (API un par IsOwnStore = 0
         bhejta hai). Wo sirf dekhne ke liye hain - halke rang me dikhte
         hain aur unka Select nahi dabta, taaki issue apne hi store se ho.
         Flag band ho to API ye field bhejta hi nahi, aur `!== 0` sabko
         apna maan leta hai - yaani pehle jaisa. */
      const isOtherStore = Number(val?.IsOwnStore) === 0;

      return {
      /* rowMeta carries the indent number for the flat grid's renderExpandedRow (the
         shared Tables skips that key when it paints cells). NestedRowTable does not know
         the key, so it is left off the inline path. */
      ...(!renderRowDetail ? { rowMeta: { indentno: val?.indentno } } : {}),
              // tbody={bodyData?.map((val, index) => ({
              Acknowledgment: <>{val?.Acknowledgment !== 1 ? (
                <i className="fa fa-thumbs-up text-dark text-center" onClick={() => { setAcknowledgmentIndent(val); }} aria-hidden="true"></i>) : ""}

              </>,
              /* Reject works only while the indent is still PENDING - nothing issued, nothing
                 rejected yet. A PARTIAL, ISSUED or REJECT indent has had medicine given (or has
                 already been closed), so the icon is greyed and does nothing. */
              Delete: canReject === false ? "" : String(val?.StatusNew ?? "").trim().toUpperCase() === "PENDING" ? (
                <i className="fa fa-trash text-danger text-center ml-2" onClick={() => { SelectCancelIndent(val) }} aria-hidden="true"></i>
              ) : (
                <i
                  className="fa fa-trash text-muted text-center ml-2"
                  style={{ opacity: 0.4, cursor: "not-allowed" }}
                  title={t("Only a PENDING indent can be rejected")}
                  aria-hidden="true"
                ></i>
              ),
              Print: <i className="fa fa-print text-navy text-center ml-2" onClick={() => { handlePrint (val) }} aria-hidden="true"></i>,
//               Select:
//               <span className="text-center" style={ `${val?.IsDraft==1 ? { color: "red" } : { color: "green" }`}}> <i className="fa fa-check text-dark text-center ml-2" onClick={() => { SelectPendingIndent(val, index) }} aria-hidden="true"></i>
// </span>,
Select:
<button
  onClick={() => SelectPendingIndent(val, index)}
  title={
    isOtherStore
      ? `Ye indent ${val?.DeptTo || "doosre department"} ka hai - issue wahin se hoga`
      : undefined
  }
  style={{
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: val?.IsDraft == 1 ? "blue" : "#fff",
    cursor: val?.IsDraft === 1 || isOtherStore ? "not-allowed" : "pointer",
    marginLeft: "8px",

  }}
  disabled={val?.IsDraft === 1 || isOtherStore}
>
  <i
    className="fa fa-check"
    style={{ color:  val?.IsDraft == 1 ? "#fff" :  "", fontSize: "12px" }}
    aria-hidden="true"
  ></i>
</button>,
              /* The ward this indent came from, on its own cell.
                 The row keeps its status colour; this is a second thing worth seeing at a
                 glance, and it reads better as one coloured cell than as a fight over the
                 whole line. A ward with no colour set is written plainly, as before. */
              IndentNo: (function () {
                const ward = wardCellColour(val?.IndentColor);
                if (!ward) return val?.indentno;
                return (
                  <span
                    className="d-inline-block px-2"
                    style={{
                      background: ward,
                      borderRadius: 3,
                      fontWeight: 600,
                      // The text is dark, so a dark ward colour has to be kept readable.
                      color: isDarkColour(ward) ? "#fff" : "#212529",
                    }}
                    title={val?.DeptFrom || ""}
                  >
                    {val?.indentno}
                  </span>
                );
              })(),
              Date: val?.dtEntry,
              IPDNo: val?.IPDNo,
              // EMGNo: val?.EMGNo,
               PName: val?.PName,
                 UserName: val?.UserName,

                   Panel: val?.PanelName,
                     StatusNew: val?.StatusNew,
              BillNo: val?.BedDetail,
             
            
              ReqQty: val?.ReqQty ? val?.ReqQty : "0",
              RejectQty: val?.RejectQty ? val?.RejectQty : "0",
              IndentType: val?.IndentType,
              DeptFrom: val?.DeptFrom,
              DeptTo: (
                <span
                  className="d-inline-block px-2"
                  style={{
                    background: isOtherStore ? "#D8DEE6" : "#CFE6D4",
                    color: "#1B2733",
                    borderRadius: 3,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                  title={
                    isOtherStore
                      ? "Doosre store ka indent - issue wahin se hoga"
                      : "Apne store ka indent"
                  }
                >
                  {val?.DeptTo || "-"}
                </span>
              ),
              // UserName: val?.UserName,
              // StatusNew: val?.StatusNew,
              EMGNo: val?.EMGNo,
              AcknowledgmentBy: val?.AcknowledgmentBy,
              // Select: <span onClick={() => { SelectPendingIndent(val) }}><SelectIconSVG /></span>,
              // isAcknowled:
              //   val?.Acknowledgment !== 1 ? (
              //     <i
              //       className="fa fa-plus text-primary text-center"
              //       onClick={() => {
              //         setAcknowledgmentIndent(val);
              //       }}
              //       aria-hidden="true"
              //     ></i>
              //   ) : (
              //     ""
              //   ),
              // Delete: (
              //   <i
              //     className="fa fa-trash text-danger text-center"
              //     onClick={() => {
              //       SelectCancelIndent(val);
              //     }}
              //     aria-hidden="true"
              //   ></i>
              // ),
              /* The row's colour.
               *
               * Status, as it always has been. The ward colour is on the Indent No cell
               * instead - a row already carries its status in its colour, and two colour
               * meanings in one row leaves neither readable. */
              colorcode: (function () {
                /* Doosre department ka indent sirf dekhne ke liye hai - uska tick
                   nahi dabta - isliye use halka sletee rang diya gaya hai. Status
                   ka rang un rows par nahi lagta: wo bataata hai ki kya karna hai,
                   aur un par karne ko kuch hai hi nahi. */
                if (isOtherStore) return "#EDEFF2";

                const rowStatus =
                  val?.Status || val?.StatusNew || (val?.Status?.value) || val?.StatusName || "";
                return colorMap[rowStatus] || "";
              })(),

      /* Slice E only. `subRow` is a key NestedRowTable knows to skip when it lays out the
         main cells; the flat Tables component does not, and would render it as an extra
         column. So it is added only when there is a nested table to render. */
      ...(renderRowDetail
        ? {
            subRow: {
              subRowList: (() => {
                const detail = renderRowDetail(val, index);
                return detail ? [{ detail }] : [];
              })(),
              // Always open. Hiding an indent's items behind a click is the thing this
              // slice exists to remove.
              isopen: true,
              secondThead: [{ name: t("Item Details"), width: "100%" }],
            },
          }
        : {}),
      };
    });

  return (
    <>
      <div className="row pt-2 px-2">
        <ReactSelect
          placeholderName={t("Type")}
          id="type"
          inputId="type"
          name="type"
          value={values?.type?.value}
          isDisabled={values?.isDisabled}
          dynamicOptions={translateOptions(PHARMACY_ITEMINDENT_TYPE, t)}
          searchable={true}
          removeIsClearable={true}
          handleChange={(name, e) => {
            handleReactSelect(name, e);
          }}
          respclass={"col-xl-1 col-md-2 col-sm-4 col-sm-4 col-12"}
        />

        <Input
          type="text"
          className="form-control"
          disabled={values?.isDisabled}
          id="Name"
          name="Name"
          lable={t(`Enter ${values?.type?.label ? values?.type?.label : "IndentNo"}`)}
          value={values?.Name ? values?.Name : ""}
          placeholder=" "
          respclass="col-xl-2 col-md-2 col-sm-4 col-sm-4 col-12"
          onChange={handleChange}
        />
       
        <ReactSelect
          placeholderName={t("Status")}
          id="Status"
          inputId="Status"
          name="Status"
          value={values?.Status}
          dynamicOptions={translateOptions(PHARMACY_ITEMINDENT_STATUS, t)}
          searchable={true}
          removeIsClearable={true}
          handleChange={handleReactSelect}
          respclass={"col-xl-2 col-md-2 col-sm-4 col-sm-4 col-12"}
        />

        <MultiSelectComp
          respclass="col-xl-2 col-md-2 col-sm-4 col-sm-4 col-12"
          name="department"
          id="department"
          placeholderName={t("Department")}
          dynamicOptions={department?.map((item) => ({
            name: item.RoleName,
            code: item.RoleID,
          }))}
          // dynamicOptions={[{ value: "0", label: "ALL" },
          //         ...handleReactSelectDropDownOptions(department ? department : "", "ledgerName", "ledgerNumber")]}
          handleChange={handleMultiSelectChange}
          value={values?.department}
        />
        <DatePicker
          className="custom-calendar"
          id="date"
          name="FromDate"
          placeholder={VITE_DATE_FORMAT}
          value={values?.FromDate ? values?.FromDate : ""}
          lable={t("From Date")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          handleChange={handleChange}
        />
        {/* <div className="row pt-2 px-2"> */}
        <DatePicker
          className="custom-calendar"
          id="date"
          name="ToDate"
          placeholder={VITE_DATE_FORMAT}
          value={values?.ToDate ? values?.ToDate : ""}
          lable={t("To Date")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          handleChange={handleChange}
        />
        {/* SRSSAIH-2026-0061 P7.8 — present when the client has enabled it, and always on
            the ward issue screen, which opts in through wardFilters. */}
        {(p7Flags?.typeFilter || wardFilters) && (
          <ReactSelect
            placeholderName={t("Indent Type")}
            id="indentTypeFilter"
            inputId="indentTypeFilter"
            name="indentTypeFilter"
            value={indentTypeFilter?.value}
            dynamicOptions={indentTypeOptions}
            searchable={true}
            removeIsClearable={false}
            handleChange={(name, e) => setIndentTypeFilter(e)}
            respclass={"col-xl-2 col-md-2 col-sm-4 col-sm-4 col-12"}
          />
        )}

        {requisitionTypeOptions.length > 0 && (
          <ReactSelect
            placeholderName={t("Requisition Type")}
            id="requisitionTypeFilter"
            inputId="requisitionTypeFilter"
            name="requisitionTypeFilter"
            value={requisitionTypeFilter?.value}
            dynamicOptions={requisitionTypeOptions}
            searchable={true}
            removeIsClearable={false}
            handleChange={(name, e) => setRequisitionTypeFilter(e)}
            respclass={"col-xl-2 col-md-2 col-sm-4 col-sm-4 col-12"}
          />
        )}

        {/* P7G — the doctor who asked for the indent. Hidden when the list carries no
            doctor at all, so it never offers an empty dropdown. */}
        {wardFilters && doctorOptions.length > 0 && (
          <ReactSelect
            placeholderName={t("Requested Doctor")}
            id="indentDoctorFilter"
            inputId="indentDoctorFilter"
            name="indentDoctorFilter"
            value={doctorFilter?.value}
            dynamicOptions={doctorOptions}
            searchable={true}
            removeIsClearable={false}
            handleChange={(name, e) => setDoctorFilter(e)}
            respclass={"col-xl-2 col-md-2 col-sm-4 col-12"}
          />
        )}

        {/* P7G — narrows what is already on screen as it is typed; no round trip. */}
        {wardFilters && (
          <Input
            type="text"
            className="form-control"
            id="indentQuickFilter"
            name="indentQuickFilter"
            value={quickText}
            lable={t("Filter List")}
            placeholder=" "
            onChange={(e) => setQuickText(e.target.value)}
            respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          />
        )}

        <div className="col-xl-2 col-md-3 col-sm-4 col-12 d-flex align-items-start gap-1">
          <button
            className="btn  btn-success px-3"
            type="button"
            onClick={() => getIndentItem()}
          >
            {t("Search")}
          </button>

        </div>
      </div>
      {/* </div> */}
      {filterData?.length > 0 && (

        <>
          <Heading
            title={
              inlineLoading ? `${t("Search Item")} — ${t("loading items")}…` : t("Search Item")
            }
            secondTitleWide={wardFilters}
            secondTitle={
              <>
                <div
                  className="d-flex align-items-center flex-wrap"
                  style={wardFilters ? { gap: 14, width: "100%", padding: "4px 0" } : { gap: 8 }}
                >
                  {/* Narrows the rows already loaded - it does not re-query. Not on the IPD Pharmacy
                      Issue ward list: FILTER LIST above does the same there. */}
                  {!wardFilters && (
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    style={{ width: 200 }}
                    placeholder={t("Search in list")}
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                  />
                  )}
                  {!wardFilters && listSearch && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0"
                      title={t("Clear")}
                      onClick={() => setListSearch("")}
                    >
                      <i className="fa fa-times" aria-hidden="true"></i>
                    </button>
                  )}
                  {!wardFilters && (
                    <ColorCodingSearch color={"blue"} label={t("Draft")} />
                  )}
                  {PHARMACY_ITEMINDENT_STATUS.filter(
                    (s) => !(wardFilters && s.value === "ALL"),
                  ).map((s) => {
                    const key = s.value;
                    const chip = (
                      <ColorCodingSearch
                        key={key}
                        color={
                          (wardFilters && wardTone[key]?.strong) || colorMap[key] || "#FFFFFF"
                        }
                        label={t(cardList && key === "ISSUED" ? "Returned" : s.label)}
                        cursor="pointer"
                        onClick={() => {
                          // Setting the status is enough; the list searches on its own.
                          try {
                            handleReactSelect("Status", s);
                          } catch (err) {}
                        }}
                      />
                    );
                    /* Ward list: each colour filter as a wider, framed button in its status
                       colour, so it is an easy target (the search box beside it is gone). */
                    return wardFilters ? (
                      <div
                        key={key}
                        style={{
                          // spread over the header bar, from the filters' left edge to the right
                          flex: "1 1 0",
                          minWidth: 150,
                          padding: "5px 14px",
                          borderRadius: 16,
                          border: "1px solid rgba(15,23,42,.15)",
                          background: wardTone[key]?.fill || colorMap[key] || "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {chip}
                        {EXCEL_STATUS[key] && (
                          <button
                            type="button"
                            className="ml-3 d-inline-flex align-items-center justify-content-center"
                            title={t(`Download ${EXCEL_STATUS[key].file}.xlsx`)}
                            style={{
                              width: 34,
                              height: 28,
                              borderRadius: 6,
                              border: "1px solid #1e7e34",
                              background: "#fff",
                              cursor: "pointer",
                              padding: 0,
                              flex: "none",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusExcel(key);
                            }}
                          >
                            <i
                              className="fa fa-file-excel"
                              aria-hidden="true"
                              style={{ fontSize: 17, color: "#1e7e34" }}
                            ></i>
                          </button>
                        )}
                      </div>
                    ) : (
                      chip
                    );
                  })}
                </div>
              </>
            }
          />
          {visibleRows?.length === 0 && !(wardFilters && renderRowDetail) && !cardList && (
            <div className="text-center text-muted p-3">
              {t("No indent matches")}{listSearch ? ` "${listSearch}"` : ""}
            </div>
          )}
          {wardFilters && renderRowDetail ? (
            /* P7G — the ward list, as a compact accordion.

               The shared grid gives each indent eighteen columns, which wrap to four
               lines apiece, and Slice E then prints every indent's items underneath
               whether or not anyone asked for them. Two lines per indent and items only
               where they were asked for is the same information in a fraction of the
               height.

               The item table inside is UNCHANGED — renderRowDetail is the same function
               the flat path calls, so issuing, batching and the approval banner behave
               exactly as before. Only what surrounds it is new. */
            <div className="ward-indent-list ward-indent-compact">
              {inlineLoading && (
                <div className="text-muted small p-2">{t("Loading items…")}</div>
              )}
              {(visibleRows || []).length === 0 && !inlineLoading && (
                <div className="text-muted small p-3 text-center">
                  {t("No indents match these filters")}
                </div>
              )}
              {(visibleRows || []).map((val, i) => {
                const no = val?.indentno || "";
                const isOpen = openIndentNo && openIndentNo === no;
                /* SelectPendingIndent reads bodyData[index], not the row it is handed, so
                   it must be given the row's position in the ORIGINAL list. Passing the
                   display index would select a different indent as soon as the list is
                   filtered or sorted, which it now always is. */
                const realIndex = (bodyData || []).findIndex(
                  (b) => (b?.indentno || "") === no,
                );
                const stop = (fn) => (e) => {
                  e.stopPropagation();
                  fn();
                };
                /* Opening an indent SELECTS it. Selecting is what loads its lines and
                   hands them to the parent's Add button, so leaving that on a separate
                   tick meant Add had nothing to send — the button looked dead. One click
                   now does what the pharmacist means by "open this indent". */
                const openAndSelect = () => {
                  if (isOpen) {
                    setOpenIndentNo("");
                    setLoadingIndentNo("");
                    return;
                  }
                  setOpenIndentNo(no);
                  setLoadingIndentNo(no);
                  SelectPendingIndent(val, realIndex);
                };
                return (
                  <div
                    key={no || i}
                    className={`ward-indent-card${isOpen ? " is-open" : ""}`}
                    /* The status as a stripe down the edge rather than a tint across the
                       whole row: the row carries a lot of small text, and a wash behind it
                       costs more legibility than it buys. */
                    /* Status colour on the whole row (light wash) as well as the stripe, same
                       palette as the colour filter: Pending / Partial / Issued / Reject. */
                    style={{
                      borderLeft: `6px solid ${
                        wardStatusTone(val?.StatusNew)?.strong ||
                        colorMap[String(val?.StatusNew || "").toUpperCase()] ||
                        "#e3e6ec"
                      }`,
                      backgroundColor: wardStatusTone(val?.StatusNew)?.fill,
                    }}
                  >
                    <div
                      className="ward-indent-head"
                      role="button"
                      tabIndex={0}
                      onClick={openAndSelect}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openAndSelect();
                        }
                      }}
                    >
                      <span className="ward-indent-caret">
                        <i
                          className={`fa fa-chevron-${isOpen ? "down" : "right"}`}
                          aria-hidden="true"
                        ></i>
                      </span>

                      <div className="ward-indent-main">
                        <div className="ward-indent-line1">
                          <strong className="ward-indent-no">{no || "-"}</strong>
                          <span className="ward-indent-patient">{val?.PName || "-"}</span>
                          <span className="ward-indent-dim">{val?.IPDNo || "-"}</span>
                          <span className="ward-indent-dim">{val?.dtEntry || "-"}</span>
                          {/* The status pill was one fixed blue whatever the status
                              said, so pending and issued read identically at a glance.
                              It now carries the status colour itself — the same colour as
                              the legend swatch and the stripe down the card. */}
                          <span
                            className="ward-indent-chip ward-indent-status"
                            style={{
                              backgroundColor:
                                wardStatusTone(val?.StatusNew)?.strong ||
                                colorMap[
                                  String(val?.StatusNew || "").toUpperCase()
                                ] || "#eef2f7",
                              color: wardStatusTone(val?.StatusNew) ? "#fff" : undefined,
                            }}
                          >
                            {statusText(val?.StatusNew) || "-"}
                          </span>
                        </div>
                        <div className="ward-indent-line2">
                          {val?.BedDetail && (
                            <span className="ward-indent-dim">{val.BedDetail}</span>
                          )}
                          {val?.PanelName && (
                            <span className="ward-indent-dim">{val.PanelName}</span>
                          )}
                          {val?.UserName && (
                            <span className="ward-indent-dim">
                              {t("By")} {val.UserName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* The right half of the row was empty. The three facts a pharmacist
                          sorts by — what kind of indent, which ward it came from, how much
                          was asked for — live here as labelled columns rather than as more
                          dots on line two. */}
                      <div className="ward-indent-meta">
                        <div className="ward-indent-meta-cell">
                          <span className="ward-indent-meta-label">{t("Indent Type")}</span>
                          <span className="ward-indent-chip">
                            {val?.IndentType || "-"}
                            {val?.RequisitionType ? ` · ${val.RequisitionType}` : ""}
                          </span>
                        </div>
                        <div className="ward-indent-meta-cell">
                          <span className="ward-indent-meta-label">{t("From Ward")}</span>
                          <span className="ward-indent-meta-value">
                            {val?.DeptFrom || "-"}
                          </span>
                        </div>
                        <div className="ward-indent-meta-cell">
                          <span className="ward-indent-meta-label">{t("Requested")}</span>
                          <span className="ward-indent-meta-value">
                            {val?.ReqQty ?? 0}
                            {Number(val?.RejectQty) > 0 ? (
                              <span className="text-danger">
                                {" "}
                                ({t("Rej")} {val.RejectQty})
                              </span>
                            ) : null}
                          </span>
                        </div>
                      </div>

                      <div className="ward-indent-actions">
                        {/* Was a bare thumbs-up among three other icons, which read as
                            decoration. An indent that has not been acknowledged often
                            returns no lines, so this is the action that unblocks the row
                            and it says what it does. */}
                        {Number(val?.Acknowledgment) !== 1 ? (
                          <button
                            type="button"
                            className="btn btn-xs ward-indent-ack"
                            onClick={stop(() => setAcknowledgmentIndent(val))}
                            title={t("Acknowledge this indent")}
                          >
                            <i className="fa fa-thumbs-up mr-1" aria-hidden="true"></i>
                            {t("Acknowledge")}
                          </button>
                        ) : (
                          <span
                            className="ward-indent-acked"
                            title={`${t("Acknowledged by")} ${val?.AcknowledgmentBy || "-"}`}
                          >
                            <i className="fa fa-check" aria-hidden="true"></i>
                          </span>
                        )}
                        <i
                          className="fa fa-print"
                          title={t("Print")}
                          onClick={stop(() => handlePrint(val))}
                          aria-hidden="true"
                        ></i>
                        {/* Reject is not offered on the IPD Pharmacy Issue ward list. */}
                      </div>
                    </div>

                    {isOpen &&
                      (() => {
                        const detail = renderRowDetail(val);
                        // The lines have arrived; stop saying they are on their way.
                        if (detail && loadingIndentNo === no) {
                          setTimeout(() => setLoadingIndentNo(""), 0);
                        }
                        /* renderRowDetail returns null when the indent has no lines, and
                           an empty panel reads as "the click did nothing". Say what is
                           actually true instead. */
                        return (
                          <div className="ward-indent-body">
                            {detail ||
                              (loadingIndentNo === no ? (
                                <div className="text-muted small p-2">
                                  <i
                                    className="fa fa-spinner fa-spin mr-2"
                                    aria-hidden="true"
                                  ></i>
                                  {t("Loading this indent's medicines…")}
                                </div>
                              ) : Number(val?.Acknowledgment) !== 1 ? (
                                /* Why the panel is empty: the server withholds an
                                   unacknowledged indent's lines. No button here — the
                                   Acknowledge button already sits on this same card, a
                                   few pixels above, and two of them side by side is one
                                   too many. */
                                <div className="ward-indent-ackprompt">
                                  <i className="fa fa-info-circle mr-2" aria-hidden="true"></i>
                                  <span>
                                    {t("Acknowledge this indent to see the medicines it asks for.")}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-muted small p-2">
                                  {t("This indent has no lines left to show.")}
                                </div>
                              ))}
                          </div>
                        );
                      })()}
                  </div>
                );
              })}
            </div>
          ) : renderRowDetail ? (
            /* Slice E. No export buttons on this path: NestedRowTable has none, and P7.9's
               export belongs to the flat list. With both flags on, inline wins.

               The wrapper class is what stops the horizontal scrollbar: the global
               `.mainTable tbody tr td { white-space: nowrap; width: 200px }` rule is a
               descendant selector, so it sizes the nested item table's cells too and puts
               its right-hand columns off-screen. See index.css. */
            <div className="pharmacy-inline-indent-grid">
              <NestedRowTable
                thead={thead}
                seondThead={[{ name: t("Item Details"), width: "100%" }]}
                tbody={buildIndentRows()}
                style={{ maxHeight: "70vh" }}
                tableHeight={"scrollView"}
                SubtableClass="w-100"
              />
            </div>
          ) : cardList ? (
            <div className="ward-indent-list ward-indent-compact">
              {(visibleRows || []).length === 0 && (
                <div className="text-muted small p-3 text-center">
                  {t("No indents match these filters")}
                </div>
              )}
              {(visibleRows || []).map((val, i) => {
                const no = val?.indentno || "";
                const isOpen = Boolean(selectedIndentNo) && selectedIndentNo === no;
                // SelectPendingIndent reads bodyData[index] - the ORIGINAL list position.
                const realIndex = (bodyData || []).findIndex(
                  (b) => (b?.indentno || "") === no,
                );
                const tone = wardStatusTone(val?.StatusNew);
                const stop = (fn) => (e) => {
                  e.stopPropagation();
                  fn();
                };
                const isDraft = Number(val?.IsDraft) === 1;
                // Opening = the old Select tick; clicking the open card again closes it
                // (SelectPendingIndent toggles the same indent off).
                const toggle = () => {
                  if (!isDraft) SelectPendingIndent(val, realIndex);
                };
                return (
                  <div
                    key={no || i}
                    className={`ward-indent-card${isOpen ? " is-open" : ""}`}
                    style={{
                      borderLeft: `6px solid ${
                        tone?.strong ||
                        colorMap[String(val?.StatusNew || "").toUpperCase()] ||
                        "#e3e6ec"
                      }`,
                      backgroundColor:
                        colorMap[String(val?.StatusNew || "").toUpperCase()] || "#fff",
                    }}
                  >
                    <div
                      className="ward-indent-head"
                      role="button"
                      tabIndex={0}
                      onClick={toggle}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggle();
                        }
                      }}
                    >
                      <span className="ward-indent-caret">
                        <i
                          className={`fa fa-chevron-${isOpen ? "down" : "right"}`}
                          aria-hidden="true"
                        ></i>
                      </span>
                      <div className="ward-indent-main">
                        <div className="ward-indent-line1">
                          <strong className="ward-indent-no">{no || "-"}</strong>
                          <span className="ward-indent-patient">{val?.PName || "-"}</span>
                          <span className="ward-indent-dim">{val?.IPDNo || "-"}</span>
                          <span className="ward-indent-dim">{val?.dtEntry || "-"}</span>
                          <span
                            className="ward-indent-chip ward-indent-status"
                            style={{
                              backgroundColor: tone?.strong || "#eef2f7",
                              color: tone ? "#fff" : undefined,
                            }}
                          >
                            {statusText(val?.StatusNew) || "-"}
                          </span>
                          {isDraft && (
                            <span className="ward-indent-chip">{t("Draft")}</span>
                          )}
                        </div>
                        <div className="ward-indent-line2">
                          {val?.BedDetail && (
                            <span className="ward-indent-dim">{val.BedDetail}</span>
                          )}
                          {val?.PanelName && (
                            <span className="ward-indent-dim">{val.PanelName}</span>
                          )}
                          {val?.UserName && (
                            <span className="ward-indent-dim">
                              {t("By")} {val.UserName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ward-indent-meta">
                        <div className="ward-indent-meta-cell">
                          <span className="ward-indent-meta-label">{t("Indent Type")}</span>
                          <span className="ward-indent-chip">{val?.IndentType || "-"}</span>
                        </div>
                        <div className="ward-indent-meta-cell">
                          <span className="ward-indent-meta-label">{t("From Ward")}</span>
                          <span className="ward-indent-meta-value">{val?.DeptFrom || "-"}</span>
                        </div>
                        <div className="ward-indent-meta-cell">
                          <span className="ward-indent-meta-label">{t("Requested")}</span>
                          <span className="ward-indent-meta-value">
                            {val?.ReqQty ?? 0}
                            {Number(val?.RejectQty) > 0 ? (
                              <span className="text-danger">
                                {" "}({t("Rej")} {val.RejectQty})
                              </span>
                            ) : null}
                          </span>
                        </div>
                      </div>
                      <div className="ward-indent-actions">
                        {Number(val?.Acknowledgment) !== 1 ? (
                          <button
                            type="button"
                            className="btn btn-xs ward-indent-ack"
                            onClick={stop(() => setAcknowledgmentIndent(val))}
                            title={t("Acknowledge this indent")}
                          >
                            <i className="fa fa-thumbs-up mr-1" aria-hidden="true"></i>
                            {t("Acknowledge")}
                          </button>
                        ) : null}
                        {canReject !== false && (
                          <i
                            className="fa fa-trash text-danger"
                            title={t("Reject")}
                            onClick={stop(() => SelectCancelIndent(val))}
                            aria-hidden="true"
                          ></i>
                        )}
                        <i
                          className="fa fa-print"
                          title={t("Print")}
                          onClick={stop(() => handlePrint(val))}
                          aria-hidden="true"
                        ></i>
                      </div>
                    </div>
                    {isOpen &&
                      (() => {
                        const detail = renderItemDetails && renderItemDetails();
                        return (
                          <div className="ward-indent-body">
                            {detail || (
                              <div className="text-muted small p-2">
                                <i className="fa fa-spinner fa-spin mr-2" aria-hidden="true"></i>
                                {t("Loading this indent's medicines…")}
                              </div>
                            )}
                            {detail && cardAction && (
                              <div className="d-flex justify-content-center mt-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary px-4"
                                  disabled={Boolean(cardAction.busy)}
                                  onClick={() => cardAction.run()}
                                >
                                  {cardAction.label}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                  </div>
                );
              })}
            </div>
          ) : (
          <Tables
            thead={thead}
            /* SRSSAIH-2026-0061 P7.9 — the shared table's own PDF/Excel export, shown
               beside the title like every other exportable list in the product. It
               exports the rendered rows, which is the searched list after the indent-type
               filter and in the sorted order. */
            title={p7Flags?.exportList ? t("Pending Indents") : undefined}
            isExportPDf={Boolean(p7Flags?.exportList)}
            isExportExcel={Boolean(p7Flags?.exportList)}
            /* The lines of the open indent, drawn as a full width row directly beneath
               it. rowMeta is how the row carries its indent number here: the table skips
               that key when it paints cells, and the Indent No cell itself may be a
               coloured element rather than the plain number. */
            renderExpandedRow={
              renderItemDetails
                ? (row) =>
                    selectedIndentNo &&
                    row?.rowMeta?.indentno === selectedIndentNo
                      ? renderItemDetails()
                      : null
                : undefined
            }
            tbody={buildIndentRows()}
            style={{ maxHeight: "60vh" }}
            // handleDoubleClick={SelectPendingIndent}
            tableHeight={"scrollView"}
            /* Column ka kram aur kaun sa column chhupa hai - dono IS USER ke
               liye yaad rakhe jaate hain.

               Shared Tables me ye suvidha pehle se hai (GRN par chal rahi hai);
               use chalu karne ke liye sirf ek chaabi deni hoti hai. Kram
               localStorage me turant aur user_column_preference me server par
               (ScreenKey = yahi chaabi) save hota hai, isliye doosre computer
               par bhi wahi kram milta hai.

               Chaabi badalna matlab sab users ka saved kram kho jaana - isliye
               ise waisa hi rehne dena chahiye. */
            storageKey="pending-indent-grid"
          />
          )}
        </>)}
    </>
  );
}
