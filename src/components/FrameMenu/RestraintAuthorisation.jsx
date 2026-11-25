import { useEffect, useState } from "react";
import Input from "../formComponent/Input";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import DatePicker from "../formComponent/DatePicker";
import EcmoTables from "../UI/customTable/AnastheticOperativeTable/EcmoTable";
import TimePicker from "../formComponent/TimePicker";
import Tables from "../UI/customTable";
import { ReprintSVG } from "../SvgIcons";
import { bindDetailsApi, saveApi } from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";

const RestraintAuthorisation = ({ data }) => {
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const { transactionID, patientID } = data;
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    id: "0",
    Patientdiagnosis: "",
    Doespatienthaveacentralline: "",
    Hasmarkedagitation: "",
    Unabletocomprehendtheseriousnessofcondition: "",
    Unabletocomprehendtheneedfortreatment: "",
    Unabletobenefitfrompatienteducation: "",
    AttempttopulloutIVlinesarteriallines: "",
    Pulloutcatheter: "",
    DifficultIVlines: "",
    HasalteredLOC: "",
    ETTrachealtube: "",
    Ispatientconfused: "",
    PulloutNGtube: "",
    Dislodgeintubationtube: "",
    CrawloutofBed: "",
    Othermethodattempted: "",
    Sedation: "",
    Physicalactivitypositionchange: "",
    Increasedsurveillance: "",
    Others: "",
    Verbalintervention: "",
    Realityorientation: "",
    Descriptionofrestraintsbeused: "",
    STAFF: "",
    STAFF_SIGN: "",
    STAFF_DATE: new Date(),
    DOCTOR: "",
    DOCTOR_SIGN: "",
    DOCTOR_DATE: new Date(),
    NEXTOFKIN: "",
    NEXTOFKIN_SIGN: "",
    NEXTOFKIN_DATE: new Date(),
  });

  const tableHeadersSaved = [
    { name: t("S.no."), width: "4%" },
    { name: t("PatientID") },
    { name: t("CreatedBy BY") },
    { name: t("CreatedDatetime") },
    { name: t("EDIT"),width: "5%" },
  ];

  const FLOW_COLUMNS = Array.from({ length: 8 }, (_, i) => `TIME_${i + 1}`);

  const FLOW_ROWS = [
    { key: "TIME", label: t("Time Q2h") },
    { key: "MENTAL_STATUS", label: t("Mental status (behaviour)") },
    { key: "RESTRAINT_APPLIED", label: t("Restraint properly applied") },
    {
      key: "CIRCULATION",
      label: t("Circulation, colour and temperature of extremities"),
    },
    { key: "RANGE_OF_MOTION", label: t("Range of motion of extremities") },
    { key: "BATHROOM", label: t("Bathroom") },
    { key: "FLUIDS", label: t("Fluids/nourishment") },
    { key: "NEED_CONTINUED_USE", label: t("Need for continued use") },
  ];

  const [savedTableData, setSavedTableData] = useState([]);
  const [isTableVisible, setIsTableVisible] = useState(false);

  const initialFlowState = FLOW_COLUMNS.reduce((acc, col) => {
    acc[col] = {
      TIME: "",
      MENTAL_STATUS: "",
      RESTRAINT_APPLIED: "",
      CIRCULATION: "",
      RANGE_OF_MOTION: "",
      BATHROOM: "",
      FLUIDS: "",
      NEED_CONTINUED_USE: "",
    };
    return acc;
  }, {});

  const [flowData, setFlowData] = useState(initialFlowState);

  const tableHeaders = [
    { name: t("Row"), type: "", isVisible: true },
    ...FLOW_COLUMNS.map((_, i) => ({
      name: `TIME_${i + 1}`,
      type: "",
      isVisible: true,
    })),
  ];
  const parseApiTime = (apiTime) => {
    if (!apiTime) return null;

    const date = new Date(apiTime);
    return isNaN(date.getTime()) ? null : date;
  };

  const formatTimeForApi = (date) => {
    if (!date) return "";
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  const formatTableData = () =>
    FLOW_ROWS.map((row) => {
      const rowObj = { Row: row.label };

      FLOW_COLUMNS.forEach((col) => {
        if (row.key === "TIME") {
          rowObj[col] = (
            <TimePicker
              placeholderName={t("Time")}
              value={flowData[col].TIME}
              respclass="col-12"
              handleChange={(e) =>
                handleFlowChange(col, "TIME", e.target.value)
              }
            />
          );
        } else if (row.key === "MENTAL_STATUS") {
          rowObj[col] = (
            <Input
              type="text"
              className="form-control form-control-sm"
              value={flowData[col].MENTAL_STATUS}
              onChange={(e) =>
                handleFlowChange(col, "MENTAL_STATUS", e.target.value)
              }
              hideLabel
            />
          );
        } else {
          rowObj[col] = (
            <Input
              type="text"
              className="form-control form-control-sm"
              value={flowData[col][row.key]}
              onChange={(e) => handleFlowChange(col, row.key, e.target.value)}
              hideLabel
            />
          );
        }
      });

      return rowObj;
    });

  const handleFlowChange = (col, row, value) => {
    setFlowData((prev) => ({
      ...prev,
      [col]: {
        ...prev[col],
        [row]: value,
      },
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    if (transactionID) {
      fetchSavedData();
    }
  }, [transactionID]);

  const fetchSavedData = async () => {
    try {
      const response = await bindDetailsApi(transactionID);

      const formattedData = response?.data?.map((item, index) => ({
        "S.no.": index + 1,
        PatientID: item?.PatientID || item?.patientID || "-",
        ENTEREDBY: item?.CreatedBy || item?.createdBy || "-",
        CreatedDatetime: item?.CreatedDatetime || item?.createdDatetime || "-",
        Edit: (
          <i
            className="fa fa-edit p-1"
            style={{ cursor: "pointer", color: "blue" }}
            onClick={() => handleEdit(item)}
          />
        ),
        // Print: (
        //   <div style={{ cursor: "pointer" }}>
        //     <ReprintSVG />
        //   </div>
        // ),
      }));

      setSavedTableData(formattedData || []);
      setIsTableVisible(true);
    } catch (error) {
      console.error("API Error", error);
    }
  };
  const handleEdit = (item) => {
    setEditMode(true);
    setEditId(String(item.ID ?? item.id ?? "0"));

    setFormData({
      Patientdiagnosis: item.PatientDiagnosis || "",
      Doespatienthaveacentralline: item.centralline || "",
      DifficultIVlines: item.Difficult || "",
      ETTrachealtube: item.ET || "",
      Ispatientconfused: item.Isthepatientconfused || "",
      Hasmarkedagitation: item.Hasmarkedagitation || "",
      HasalteredLOC: item.HasalteredLOC || "",
      Unabletocomprehendtheseriousnessofcondition: item.UCseriousness || "",
      Unabletocomprehendtheneedfortreatment: item.UCtreatment || "",
      Unabletobenefitfrompatienteducation: item.UBeducation || "",
      AttempttopulloutIVlinesarteriallines: item.Attemptarteriallines || "",
      PulloutNGtube: item.PullNGtube || "",
      Pulloutcatheter: item.Pulloutcatheter || "",
      Dislodgeintubationtube: item.Dislodgeintubationtube || "",
      CrawloutofBed: item.CrawlofBed || "",
      Sedation: item.Sedation || "",
      Verbalintervention: item.Verbalintervention || "",
      Physicalactivitypositionchange: item.Physicalpositionchange || "",
      Realityorientation: item.Realityorientation || "",
      Increasedsurveillance: item.Increasedsurveillance || "",
      Others: item.Others || "",
      Descriptionofrestraintsbeused: item.Descriptionrestraintsused || "",
      STAFF: item.Staff || "",
      STAFF_SIGN: item.Sign || "",
      STAFF_DATE: item.Date ? new Date(item.Date) : null,
      DOCTOR: item.Doctor || "",
      DOCTOR_SIGN: item.Sign1 || "",
      DOCTOR_DATE: item.Date1 ? new Date(item.Date1) : null,
      NEXTOFKIN: item.NextOfkin || "",
      NEXTOFKIN_SIGN: item.Sign2 || "",
      NEXTOFKIN_DATE: item.Date2 ? new Date(item.Date2) : null,
    });

    const newFlowData = { ...initialFlowState };

    FLOW_COLUMNS.forEach((col, index) => {
      const colIndex = index + 1;
      const timeKey = index === 0 ? "TQ2h" : `TQ2h${index}`;

      newFlowData[col] = {
        TIME: parseApiTime(item[timeKey]),
        MENTAL_STATUS: item[`mentalstatus${colIndex}`] || "",
        RESTRAINT_APPLIED: item[`restraint${colIndex}`] || "",
        CIRCULATION: item[`circulation${colIndex}`] || "",
        RANGE_OF_MOTION: item[`motion${colIndex}`] || "",
        BATHROOM: item[`bathroom${colIndex}`] || "",
        FLUIDS: item[`fluids${colIndex}`] || "",
        NEED_CONTINUED_USE: item[`needuse${colIndex}`] || "",
      };
    });

    setFlowData(newFlowData);
  };

  const preparePayload = () => {
    const payload = {
      patientID: patientID || "",
      transactionID: transactionID || "",
      id: editMode ? String(editId ?? "0") : "0",

      patientDiagnosis: formData.Patientdiagnosis || "",
      centralline: formData.Doespatienthaveacentralline || "",
      difficult: formData.DifficultIVlines || "",
      et: formData.ETTrachealtube || "",
      isthepatientconfused: formData.Ispatientconfused || "",
      hasmarkedagitation: formData.Hasmarkedagitation || "",
      hasalteredLOC: formData.HasalteredLOC || "",
      uCseriousness: formData.Unabletocomprehendtheseriousnessofcondition || "",
      uCtreatment: formData.Unabletocomprehendtheneedfortreatment || "",
      uBeducation: formData.Unabletobenefitfrompatienteducation || "",
      attemptarteriallines: formData.AttempttopulloutIVlinesarteriallines || "",
      pullNGtube: formData.PulloutNGtube || "",
      pulloutcatheter: formData.Pulloutcatheter || "",
      dislodgeintubationtube: formData.Dislodgeintubationtube || "",
      crawlofBed: formData.CrawloutofBed || "",
      sedation: formData.Sedation || "",
      verbalintervention: formData.Verbalintervention || "",
      physicalpositionchange: formData.Physicalactivitypositionchange || "",
      realityorientation: formData.Realityorientation || "",
      increasedsurveillance: formData.Increasedsurveillance || "",
      others: formData.Others || "",
      descriptionrestraintsused: formData.Descriptionofrestraintsbeused || "",
      staff: formData.STAFF || "",
      sign: formData.STAFF_SIGN || "",
      date: formData.STAFF_DATE || "",
      doctor: formData.DOCTOR || "",
      sign1: formData.DOCTOR_SIGN || "",
      date1: formData.DOCTOR_DATE || "",
      txtNextOfKin: formData.NEXTOFKIN || "",
      txtSign2: formData.NEXTOFKIN_SIGN || "",
      txtDate2: formData.NEXTOFKIN_DATE || "",
    };
    FLOW_COLUMNS.forEach((col, index) => {
      const colIndex = index + 1;
      const timeKey = index === 0 ? "TQ2h" : `TQ2h${index}`;

      payload[timeKey] = flowData[col].TIME
        ? flowData[col].TIME.toISOString()
        : "";

      payload[`mentalstatus${colIndex}`] = flowData[col].MENTAL_STATUS || "";
      payload[`restraint${colIndex}`] = flowData[col].RESTRAINT_APPLIED || "";
      payload[`circulation${colIndex}`] = flowData[col].CIRCULATION || "";
      payload[`motion${colIndex}`] = flowData[col].RANGE_OF_MOTION || "";
      payload[`bathroom${colIndex}`] = flowData[col].BATHROOM || "";
      payload[`fluids${colIndex}`] = flowData[col].FLUIDS || "";
      payload[`needuse${colIndex}`] = flowData[col].NEED_CONTINUED_USE || "";
    });

    return payload;
  };

  const handleSave = async () => {
    try {
      const finalPayload = preparePayload();

      const response = await saveApi(finalPayload);

      if (response.success) {
        notify(editMode ? "Updated successfully!" : "Saved successfully!");

        setFormData({
          Patientdiagnosis: "",
          Doespatienthaveacentralline: "",
          Hasmarkedagitation: "",
          Unabletocomprehendtheseriousnessofcondition: "",
          Unabletocomprehendtheneedfortreatment: "",
          Unabletobenefitfrompatienteducation: "",
          AttempttopulloutIVlinesarteriallines: "",
          Pulloutcatheter: "",
          DifficultIVlines: "",
          HasalteredLOC: "",
          ETTrachealtube: "",
          Ispatientconfused: "",
          PulloutNGtube: "",
          Dislodgeintubationtube: "",
          CrawloutofBed: "",
          Othermethodattempted: "",
          Sedation: "",
          Physicalactivitypositionchange: "",
          Increasedsurveillance: "",
          Others: "",
          Verbalintervention: "",
          Realityorientation: "",
          Descriptionofrestraintsbeused: "",
          STAFF: "",
          STAFF_SIGN: "",
          STAFF_DATE: null,
          DOCTOR: "",
          DOCTOR_SIGN: "",
          DOCTOR_DATE: null,
          NEXTOFKIN: "",
          NEXTOFKIN_SIGN: "",
          NEXTOFKIN_DATE: null,
        });

        // ✅ clear Q2h table
        setFlowData(initialFlowState);

        // ✅ reset edit state
        setEditMode(false);
        setEditId(null);

        fetchSavedData();
      }
    } catch (error) {
      console.error("Save error:", error);
      notify(t("Error saving data. Please try again."));
    }
  };

  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("Restraint Authorisation")} />
          <div className="p-2">
            <div className="row">
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Patient diagnosis")}
                  name="Patientdiagnosis"
                  id="Patientdiagnosis"
                  placeholder=" "
                  value={formData?.Patientdiagnosis}
                  respclass="col-12"
                  onChange={handleChange}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Does patient have a central line?")}
                  id="Doespatienthaveacentralline"
                  name="Doespatienthaveacentralline"
                  placeholder=" "
                  value={formData?.Doespatienthaveacentralline}
                  respclass="col-12"
                  onChange={handleChange}
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Marked agitation")}
                  name="Hasmarkedagitation"
                  id="Hasmarkedagitation"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.Hasmarkedagitation}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t(
                    "Unable to comprehend the seriousness of his/her condition"
                  )}
                  name="Unabletocomprehendtheseriousnessofcondition"
                  id="Unabletocomprehendtheseriousnessofcondition"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.Unabletocomprehendtheseriousnessofcondition}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Unable to comprehend the need for treatment?")}
                  name="Unabletocomprehendtheneedfortreatment"
                  id="Unabletocomprehendtheneedfortreatment"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.Unabletocomprehendtheneedfortreatment}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Benefit from education")}
                  name="Unabletobenefitfrompatienteducation"
                  id="Unabletobenefitfrompatienteducation"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.Unabletobenefitfrompatienteducation}
                  respclass="col-12"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Attempt to pull out IV lines/arterial lines")}
                  name="AttempttopulloutIVlinesarteriallines"
                  id="AttempttopulloutIVlinesarteriallines"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.AttempttopulloutIVlinesarteriallines}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Pull out catheter")}
                  name="Pulloutcatheter"
                  id="Pulloutcatheter"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.Pulloutcatheter}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Difficult IV lines")}
                  name="DifficultIVlines"
                  id="DifficultIVlines"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.DifficultIVlines}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Altered LOC")}
                  name="HasalteredLOC"
                  id="HasalteredLOC"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.HasalteredLOC}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("ET/Tracheal tube")}
                  name="ETTrachealtube"
                  placeholder=" "
                  id="ETTrachealtube"
                  onChange={handleChange}
                  value={formData?.ETTrachealtube}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Is the patient confused?")}
                  name="Ispatientconfused"
                  id="Ispatientconfused"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.Ispatientconfused}
                  respclass="col-12"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Pull out NG tube")}
                  name="PulloutNGtube"
                  id="PulloutNGtube"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.PulloutNGtube}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Dislodge intubation")}
                  name="Dislodgeintubationtube"
                  id="Dislodgeintubationtube"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.Dislodgeintubationtube}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Crawl out of bed")}
                  name="CrawloutofBed"
                  id="CrawloutofBed"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.CrawloutofBed}
                  respclass="col-12"
                />
              </div>

              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Other method attempted")}
                  name="Othermethodattempted"
                  id="Othermethodattempted"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.Othermethodattempted}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Sedation")}
                  name="Sedation"
                  id="Sedation"
                  onChange={handleChange}
                  value={formData?.Sedation}
                  placeholder=" "
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Physical/activity/position change")}
                  name="Physicalactivitypositionchange"
                  id="Physicalactivitypositionchange"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.Physicalactivitypositionchange}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Increased surveillance")}
                  name="Increasedsurveillance"
                  id="Increasedsurveillance"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.Increasedsurveillance}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Others")}
                  name="Others"
                  id="Others"
                  onChange={handleChange}
                  value={formData?.Others}
                  placeholder=" "
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Verbal intervention")}
                  name="Verbalintervention"
                  id="Verbalintervention"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.Verbalintervention}
                  respclass="col-12"
                />
              </div>

              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Reality orientation")}
                  name="Realityorientation"
                  id="Realityorientation"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.Realityorientation}
                  respclass="col-12"
                />
              </div>

              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Description of restraints be used")}
                  name="Descriptionofrestraintsbeused"
                  id="Descriptionofrestraintsbeused"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.Descriptionofrestraintsbeused}
                  respclass="col-12"
                />
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("STAFF")}
                  name="STAFF"
                  id="STAFF"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.STAFF}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Staff SIGN")}
                  name="STAFF_SIGN"
                  id="STAFF_SIGN"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.STAFF_SIGN}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <DatePicker
                  className="custom-calendar"
                  placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
                  lable={t("Staff Date")}
                  respclass="col-12"
                  name="STAFF_DATE"
                  id="STAFF_DATE"
                  value={formData?.STAFF_DATE}
                  showTime
                  hourFormat="12"
                  handleChange={handleChange}
                />
              </div>

              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("DOCTOR")}
                  name="DOCTOR"
                  id="DOCTOR"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData?.DOCTOR}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Doctor SIGN")}
                  name="DOCTOR_SIGN"
                  placeholder=" "
                  id="DOCTOR_SIGN"
                  onChange={handleChange}
                  value={formData?.DOCTOR_SIGN}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <DatePicker
                  className="custom-calendar"
                  placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
                  lable={t("Doctor Date")}
                  respclass="col-12"
                  name="DOCTOR_DATE"
                  id="DOCTOR_DATE"
                  value={formData?.DOCTOR_DATE}
                  showTime
                  hourFormat="12"
                  handleChange={handleChange}
                />
              </div>

              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  placeholder=" "
                  lable={t("NEXT OF KIN")}
                  name="NEXTOFKIN"
                  id="NEXTOFKIN"
                  onChange={handleChange}
                  value={formData?.NEXTOFKIN}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <Input
                  type="text"
                  className="form-control"
                  lable={t("Next Of Kin SIGN")}
                  name="NEXTOFKIN_SIGN"
                  placeholder=" "
                  id="NEXTOFKIN_SIGN"
                  onChange={handleChange}
                  value={formData.NEXTOFKIN_SIGN}
                  respclass="col-12"
                />
              </div>
              <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
                <DatePicker
                  className="custom-calendar"
                  placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
                  lable={t("Next Of Kin Date")}
                  respclass="col-12"
                  name="NEXTOFKIN_DATE"
                  id="NEXTOFKIN_DATE"
                  value={formData.NEXTOFKIN_DATE}
                  showTime
                  hourFormat="12"
                  handleChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <EcmoTables thead={tableHeaders} tbody={formatTableData()} />
      <div className="d-flex justify-content-end mt-2 mb-2">
        <button
          className="btn btn-primary btn-sm mr-2"
          style={{
            backgroundColor: editMode ? "#ffc107" : "#28a745",
            border: "none",
            color: "#fff",
          }}
          onClick={handleSave}
        >
          {editMode ? t("Update") : t("Save")}
        </button>
      </div>
      {isTableVisible && (
        <Tables thead={tableHeadersSaved} tbody={savedTableData} />
      )}
    </>
  );
};

export default RestraintAuthorisation;
