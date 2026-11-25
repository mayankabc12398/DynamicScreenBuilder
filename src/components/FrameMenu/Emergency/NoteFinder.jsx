import { useEffect, useState } from "react";
import Heading from "../../UI/Heading";
import Tables from "../../UI/customTable";
import MultiSelectComp from "../../formComponent/MultiSelectComp";
import ReactSelect from "../../formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import moment from "moment";
import DatePicker from "../../formComponent/DatePicker";
import {
  AcknowledgeNoteByTransactionApi,
  ApproveNoteApi,
  bindCadreTypeApi,
  bindDocSpecializationApi,
  bindNoteTypeMasterApi,
  bindTierTypeApi,
  noteFinderSearchApi,
} from "../../../networkServices/Emergency";
import { notify } from "../../../utils/utils";
import Modal from "../../modalComponent/Modal";
import NoteFinderVitalModal from "../../modalComponent/Utils/Emergency/NoteFinderVitalModal";
import TextAreaInput from "../../formComponent/TextAreaInput";

const { VITE_DATE_FORMAT } = import.meta.env;

// Default note types for summary search
const DEFAULT_NOTE_TYPES = "19,20,2,6,26,27";

const NoteFinder = (props) => {
  const { data } = props;

  const { t } = useTranslation();
  const transactionID =
    data?.transactionID ||
    data?.TransactionID ||
    data?.patientDetail?.TransactionID;

  const [payload, setPayload] = useState({
    cadreID: "0",
    tierID: "0",
    specialtyID: "0",
    noteType: "", // Array of selected note type objects
    encounter: "0",
    encounterType: "0",
    fromdate: new Date(),
    todate: new Date(),
    isAllDate: 0,
  });

  const [options, setOptions] = useState({
    cadre: [],
    specialty: [],
    tier: [],
    noteTypes: [],
  });

  const [tableData, setTableData] = useState([]);
  const [isModal, setIsModal] = useState(false);
  const [modalData, setModalData] = useState("");
  const [approveStatus, setApproveStatus] = useState(false);
  const [summaryTable, setSummaryTable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableMode, setTableMode] = useState("");
  const dateOptions = [
    { value: "0", label: t("This Encounter") },
    { value: "1", label: t("Date range") },
  ];
  const [values, setValues] = useState({
    approvedRemark: "",
  });
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };
  const tableHead = [
    { name: t("SrNo") },
    { name: t("From Role") },
    { name: t("Date&Time") },
    { name: t("Author") },
    { name: t("Note Type") },
    { name: t("Note") },
  ];
  const SUMM_THEAD = [
    { name: t("SrNo") },
    { name: t("From Role") },
    { name: t("Ack") },
    { name: t("Date&Time") },
    { name: t("Author") },
    { name: t("Note Type") },
    { name: t("Cadre") },
    { name: t("Tier") },
    { name: t("Specialty") },
    { name: t("Ack By") },
    { name: t("View Note") },
    { name: t("Addend Note") },
    { name: t("Approved Status") },
    { name: t("Approve") },
    { name: t("Approved By") },
    { name: t("Approved Comment") },
    { name: t("Approve DateTime") },
    { name: t("Action") },
  ];

  // Validate date range
  const validateDates = () => {
    if (payload.isAllDate) return true;

    const from = moment(payload.fromdate);
    const to = moment(payload.todate);

    if (!from.isValid() || !to.isValid()) {
      notify(t("Invalid date format"), "error");
      return false;
    }

    if (from.isAfter(to)) {
      notify(t("From Date cannot be after To Date"), "error");
      return false;
    }

    return true;
  };

  /* // Build search payload
  const buildSearchPayload = (useDefaultNoteTypes = false) => {
    const noteTypeString = useDefaultNoteTypes
      ? DEFAULT_NOTE_TYPES
      : payload.noteTypes.map((nt) => nt.code).join(",");

    return {
      cadreID: payload.cadreID,
      tierID: payload.tierID,
      specialtyID: payload.specialtyID,
      noteType: noteTypeString,
      encounter: payload.encounter,
      encounterType: transactionID,
      fromdate: moment(payload.fromdate).format("DD-MMM-YYYY"),
      todate: moment(payload.todate).format("DD-MMM-YYYY"),
      isAllDate: payload.isAllDate,
    };
  }; */

  // Summary search with default note types
  const handleSummaryClick = async () => {
    setTableMode("summary");
    setLoading(true);

    const noteTypeString = payload?.noteType?.length
      ? payload.noteType.map((nt) => nt.code).join(",")
      : "0";

    try {
      const res = await noteFinderSearchApi({
        cadreID: payload.cadreID,
        tierID: payload.tierID,
        specialtyID: payload.specialtyID,
        noteType: noteTypeString,
        encounter: payload.encounter,
        encounterType: transactionID,
        fromdate: moment(payload.fromdate).format("DD-MMM-YYYY"),
        todate: moment(payload.todate).format("DD-MMM-YYYY"),
        isAllDate: payload.isAllDate,
      });
      if (res?.success) {
        setSummaryTable(res?.data || []);
        setTableData([]);
      } else {
        notify(res?.message || "Failed to fetch summary", "error");
      }
    } catch (e) {
      notify(e?.message || "Failed to fetch summary", "error");
    } finally {
      setLoading(false);
    }
  };

  // Detail search with selected note types
  const handleDetailClick = async () => {
    setTableMode("detail");
    setLoading(true);
    const noteTypeString = payload?.noteType?.length
      ? payload.noteType.map((nt) => nt.code).join(",")
      : "0";
    try {
      const searchPayload = {
        cadreID: payload.cadreID,
        tierID: payload.tierID,
        specialtyID: payload.specialtyID,
        noteType: noteTypeString || "0",
        encounter: payload.encounter,
        encounterType: transactionID,
        fromdate: moment(payload.fromdate).format("DD-MMM-YYYY"),
        todate: moment(payload.todate).format("DD-MMM-YYYY"),
        isAllDate: payload.isAllDate,
      };
      const res = await noteFinderSearchApi(searchPayload);
      setTableData(res?.data);
    } catch (error) {
      notify(error?.message || "Failed to fetch details", "error");
    } finally {
      setLoading(false);
    }
  };

  // All notes search
  const handleAllNotesClick = async () => {
    if (!validateDates()) return;

    setLoading(true);
    try {
      const noteTypeString = payload?.noteType?.length
        ? payload.noteType.map((nt) => nt.code).join(",")
        : "0";

      const searchPayload = {
        cadreID: payload.cadreID,
        tierID: payload.tierID,
        specialtyID: payload.specialtyID,
        noteType: noteTypeString || "0",
        encounter: payload.encounter,
        encounterType: transactionID,
        fromdate: moment(payload.fromdate).format("DD-MMM-YYYY"),
        todate: moment(payload.todate).format("DD-MMM-YYYY"),
        isAllDate: payload.isAllDate,
      };
      const res = await noteFinderSearchApi(searchPayload);
      setTableData(res?.data);
    } catch (error) {
      notify(error?.message || "Failed to fetch all notes", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMultiSelectChange = (name, selectedOptions) => {
    setPayload((prev) => ({
      ...prev,
      [name]: selectedOptions,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleSelectChange = (name, selected) => {
    setPayload((prev) => ({
      ...prev,
      [name]: selected?.value || "",
    }));
  };

  const handleDateRangeChange = (name, selected) => {
    setPayload((prev) => ({
      ...prev,
      encounterType: selected?.value,
    }));
  };

  useEffect(() => {
    fetchAllDropdowns();
  }, []);

  const fetchAllDropdowns = async () => {
    try {
      const [cadreRes, specRes, tierRes, noteTypeRes] = await Promise.all([
        bindCadreTypeApi(),
        bindDocSpecializationApi(),
        bindTierTypeApi(),
        bindNoteTypeMasterApi(),
      ]);

      const cadreList = cadreRes?.data?.map((item) => ({
        value: item.ID?.toString() || "",
        label: item.CadreName || "",
      }));

      const specialtyList = specRes?.data?.map((item) => ({
        value: item.ID?.toString() || "",
        label: item.Name || "",
      }));

      const tierList = tierRes?.data?.map((item) => ({
        value: item.ID?.toString() || "",
        label: item.TierName || item.Name || "",
      }));

      const noteTypeList = noteTypeRes?.data?.map((item) => ({
        name: item.HeaderName || "",
        code: item.Header_Id?.toString() || "", // Fixed potential typo
      }));

      setOptions({
        cadre: [{ value: "0", label: t("All") }, ...cadreList],
        specialty: [{ value: "0", label: t("All") }, ...specialtyList],
        tier: [{ value: "0", label: t("All") }, ...tierList],
        noteTypes: noteTypeList,
      });
    } catch (err) {
      console.error("Dropdown Load Error:", err);
      notify(t("Failed to load dropdown options"), "error");
    }
  };

  const formatNoteText = (html = "") => {
    if (!html) return "";

    const temp = document.createElement("div");
    temp.innerHTML = html;

    temp.querySelectorAll("h1,h2,h3,h4,h5,h6,div,p,br,li").forEach((el) => {
      el.after(document.createTextNode("\n"));
    });

    return temp.textContent.replace(/\n\s*\n/g, "\n").trim();
  };
  const handleApproveSubmit = async () => {
    debugger;
    const payload = {
      id: approveStatus?.NoteId,
      isApproved: 1,
      approvedRemark: values.approvedRemark,
    };
    try {
      const res = await ApproveNoteApi(payload);
      if (res?.success) {
        notify(res?.message, "success");
        setApproveStatus(false);
      }
    } catch (error) {
      notify(error?.message, "error");
    }
  };

  return (
    <div className="card patient_registration border mt-2">
      <div className="card card_background">
        <Heading isBreadcrumb={false} title={t("Note Type Finding")} />

        <div className="row mt-2">
          <ReactSelect
            placeholderName="Select Cadre"
            dynamicOptions={options.cadre}
            value={payload.cadreID}
            handleChange={handleSelectChange}
            name="cadreID"
            respclass="col-xl-2 col-md-6 col-sm-4 col-12"
          />

          <ReactSelect
            placeholderName="Select Tier"
            dynamicOptions={options.tier}
            value={payload.tierID}
            handleChange={handleSelectChange}
            name="tierID"
            respclass="col-xl-2 col-md-6 col-sm-4 col-12"
          />

          <ReactSelect
            placeholderName="Select Specialty"
            dynamicOptions={options.specialty}
            value={payload.specialtyID}
            handleChange={handleSelectChange}
            name="specialtyID"
            respclass="col-xl-2 col-md-6 col-sm-4 col-12"
          />

          <MultiSelectComp
            dynamicOptions={options.noteTypes}
            value={payload.noteType}
            handleChange={handleMultiSelectChange}
            name="noteType"
            id="noteType"
            placeholderName={t("Select Note Types")}
            requiredClassName={true}
            respclass="col-xl-2 col-md-6 col-sm-4 col-12"
          />

          <ReactSelect
            placeholderName="Date Range"
            dynamicOptions={dateOptions}
            value={payload.encounterType}
            handleChange={handleDateRangeChange}
            name="encounterType"
            respclass="col-xl-2 col-md-6 col-sm-4 col-12"
          />

          <div
            className="col-xl-1 col-md-3 col-sm-6 col-12 mb-2 d-flex align-items-center"
            style={{ gap: "8px" }}
          >
            <input
              type="checkbox"
              id="allDate"
              name="isAllDate"
              checked={payload.isAllDate === 1}
              onChange={handleChange}
            />
            <label
              htmlFor="allDate"
              style={{ fontWeight: 400, fontSize: "12px", margin: 0 }}
            >
              {t("All Date")}
            </label>
          </div>

          <DatePicker
            className="custom-calendar"
            id="FormDate"
            name="fromdate"
            placeholder={VITE_DATE_FORMAT}
            lable={t("Form Date")}
            value={payload.fromdate}
            handleChange={handleChange}
            respclass="col-xl-2 col-md-6 col-sm-4 col-12"
          />

          <DatePicker
            className="custom-calendar"
            id="ToDate"
            name="todate"
            placeholder={VITE_DATE_FORMAT}
            lable={t("To Date")}
            value={payload.todate}
            handleChange={handleChange}
            respclass="col-xl-2 col-md-6 col-sm-4 col-12"
          />

          <div className="col-8 d-flex">
            <ol className="text-red" style={{ fontWeight: 900 }}>
              <li>{t("By Default Search Note")}</li>
              <li>{t("Progress Note")}</li>
              <li>{t("Doctor Order")}</li>
              <li>{t("History and Physical")}</li>
              <li>
                {t("Discharge Summary (all types) - If you want to search other notes, please select it from Note Type.")}
              </li>
            </ol>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-xl-12 d-flex justify-content-end">
            <button
              className="btn btn-sm btn-success"
              onClick={handleSummaryClick}
              disabled={loading}
            >
              {loading ? t("Loading...") : t("Summary")}
            </button>
            <button
              className="btn btn-sm btn-success ml-2"
              onClick={handleDetailClick}
              disabled={loading}
            >
              {t("Detail")}
            </button>
            <button
              className="btn btn-sm btn-success ml-2"
              onClick={handleAllNotesClick}
              disabled={loading}
            >
              {t("AllNotes")}
            </button>
          </div>
        </div>
        {tableMode === "detail" && (
          <Tables
            thead={tableHead}
            tbody={tableData?.map((item, i) => ({
              "S.NO": i + 1,
              roleName: item?.RoleName,
              dates: item?.Dates,
              Author: item?.Author,
              NoteType: item?.NoteType,
              Note: (
                <pre
                  style={{
                    margin: 0,
                    fontFamily: "inherit",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {formatNoteText(item?.Detail)}
                </pre>
              ),
            }))}
            tableHeight={"tableHeight"}
          />
        )}
        {tableMode === "summary" && (
          <Tables
            thead={SUMM_THEAD}
            tbody={summaryTable?.map((item, i) => ({
              SrNo: i + 1,

              FromRole: item?.RoleName || "-",

              Ack: item?.Ackstring || "-",

              "Date&Time": item?.Dates || "-",

              Author: item?.Author || "-",

              "Note Type": item?.NoteType || "-",

              Cadre: item?.Cadre || "-",

              Tier: item?.Tier || "-",

              Specialty: item?.Specialty || "-",

              "Ack By": item?.Ackstring ? item.Ackstring : "-",

              "View Note":
                item?.IsView === 1 ? (
                  <i
                    className="fa fa-search "
                    aria-hidden="true"
                    onClick={() => {
                      setModalData(item?.Detail);
                      setIsModal(true);
                    }}
                  />
                ) : (
                  "-"
                ),

              "Addend Note":
                item?.Isedit === "1"
                  ? "Edit"
                  : item?.Isedit === "0"
                    ? "Edit Time Expire"
                    : "-",

              "Approved Status": item?.ApprovedStatus || "-",

              Approve: item?.IsApproved === 0 ? "Approve" : "Approved",

              "Approved By": item?.ApprovedBy || "-",

              "Approved Comment": item?.ApprovedRemark || "-",

              "Approve DateTime": item?.ApprovedDate || "-",
              Action: (
                <button
                  className="btn btn-sm btn-success ml-2"
                  onClick={() => setApproveStatus(item)}
                  disabled={loading || item?.IsApproved === 1}
                >
                  {t("Approve")}
                </button>
              ),
            }))}
            scrollView={"scrollView"}
          />
        )}
      </div>
      <Modal
        visible={isModal}
        setVisible={setIsModal}
        modalWidth={"45vw"}
        Header={t("Note View")}
        footer={<></>}
      >
        <NoteFinderVitalModal inputData={modalData} />
      </Modal>
      <Modal
        visible={approveStatus}
        setVisible={setApproveStatus}
        modalWidth={"45vw"}
        Header={t("Approve Status")}
        footer={
          <button
            className="btn btn-sm btn-success ml-2"
            onClick={handleApproveSubmit}
            disabled={loading}
          >
            {t("Approve")}
          </button>
        }
      >
        <TextAreaInput
          label={t("Approved Remark")}
          name="approvedRemark"
          id="approvedRemark"
          value={values?.remark}
          onChange={handleInputChange}
          respclass={"col-12"}
          requiredClassName={true}
        />
      </Modal>
    </div>
  );
};

export default NoteFinder;
