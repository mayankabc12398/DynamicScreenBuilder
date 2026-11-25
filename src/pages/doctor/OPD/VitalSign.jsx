// priyam
import React, {
  useImperativeHandle,
  forwardRef,
  useEffect,
  useState,
  useRef,
} from "react";
import Heading from "../../../components/UI/Heading";
import { useTranslation } from "react-i18next";
import Input from "../../../components/formComponent/Input";
import {
  CommonAPIGetDoctorIDByEmployeeID,
  getAllVitalMasterApi,
  getDoctorDepartmentLitsApi,
  SaveVitals,
  UpdateVitals,
} from "../../../networkServices/DoctorApi";
import { useFormik } from "formik";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { handleReactSelectDropDownOptions, notify } from "../../../utils/utils";
import VitalSignTable from "../../../components/UI/customTable/doctorTable/ViewConsultationtable/VitalSignTable";
import { useDispatch, useSelector } from "react-redux";
import { getBindVital } from "../../../store/reducers/DoctorModule/VitalSign";
import { setLoading as setReloadDoctor } from "../../../store/reducers/DoctorModule/patientDetailsReload";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import { Checkbox } from "primereact/checkbox";
import { AutoComplete } from "primereact/autocomplete";
import { BinddonorBloodGroup } from "../../../networkServices/blooadbankApi";
import MultiSelectComp from "../../../components/formComponent/MultiSelectComp";
import DatePicker from "../../../components/formComponent/DatePicker";
import TimePicker from "../../../components/formComponent/TimePicker";
import moment from "moment";

const VitalSign = forwardRef((props, ref) => {
  // debugger
  const autoCompleteTempRef = useRef([]);
  const autoCompleteBPRef = useRef([]);
  const autoCompletePulseRef = useRef([]);
  const autoCompletespO2Ref = useRef([]);
  const autoCompletePSRef = useRef([]);
  const { patientDetail, setActionType, menuItemData, toggleAction } = props;
  const localData = useLocalStorage("userData", "get");
  const [bmi, setBmi] = useState("");
  const dispatch = useDispatch();
  const { getBindVitalData } = useSelector((state) => state?.vitalSignSlice);
  const reloadDoctor = useSelector((state) => state.reloadDoctor.loading);
  const [doctorDepartment, setDoctorDepartment] = useState([]);
  const [doctorID, setDoctorID] = useState(props?.patientDetail?.DoctorID);
  const [bloodBank, setBloodBank] = useState([]);
  const [btnValue, setBtnValue] = useState("Save");
  const [status, setStatus] = useState("");
  const [t] = useTranslation();
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const { VITE_DATE_FORMAT } = import.meta.env;
  console.log(menuItemData, "menuItemData");
  const [apiData, setApiData] = useState({
    getBindVitalData: [],
    getBindVitalBP: [],
    getBindVitalPulse: [],
    getBindVitalTemp: [],
    getBindVitalSPO2: [],
    getBindVitalPS: [],
  });
  // debugger
  const payload = {
    tid: patientDetail?.currentPatient?.TransactionID,
    pid: patientDetail?.currentPatient?.PatientID,
    IsPregnancy: 0,
    DepartmentID: { label: "", value: "" },
    time: new Date(),
    bp: "",
    p: "",
    r: "",
    t: "",
    ht: "",
    wt: "",
    armSpan: "",
    sittingHeight: "",
    bmi: "",
    ibw: "",
    spO2: "",
    bf: "",
    muac: "",
    fbs: "",
    userID: localData?.employeeID,
    tw: "",
    vf: "",
    muscle: "",
    rm: "",
    wfa: "",
    bmifa: "",
    app_ID: patientDetail?.currentPatient?.App_ID,
    cbg: "",
    painScore: "",
    remark: "",
    heightRemarks: "",
    tabID: String(menuItemData?.id),
    menuID: String(menuItemData?.id),
    Hr: "",
    Bsa: "",
    Rr: "",
    FBS: "",
    Allergy: "",
    PainScore: "",
    BloodGlucose: "",
    GCS: "",
    bloodGroup: { label: "", value: "" },
    MUAC: "",
    HeartRate: "",
    DangerSign: "",
    TriagingCodes: { label: "Non Urgent", value: "5" },
    Alcohol: { label: "", value: "" },
    Smoking: { label: "", value: "" },
    Diabetes: { label: "", value: "" },
    Pregnant: { label: "", value: "" },
    Implant: { label: "", value: "" },
    HIV: { label: "", value: "" },
    PersistentFever: { label: "", value: "" },
    Unexplained: { label: "", value: "" },
    Drenching: { label: "", value: "" },
  };
  const [values, setValues] = useState(payload);
  const HandleAutoOptions = [
    { value: "1", label: t("Yes") },
    { value: "0", label: t("No") },
  ];
  const triAgeingCodesOptions = [
    { value: "0", label: t("Select") },
    { value: "2", label: t("Emergent") },
    { value: "3", label: t("Urgent") },
    { value: "5", label: t("Non Urgent") },
  ];
  const handleChange = (e) => {
    // debugger
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value,
    });
  };
  console.log("valuesvaluesvaluesvalues", bloodBank);
  const {
    setFieldValue,
    handleSubmit,
    errors,
    touched,
    validateForm,
    resetForm,
  } = useFormik({
    initialValues: payload,
    enableReinitialize: false,
  });
  const onSubmit = async () => {
    // setActionType("VitalSign");

    // if (
    //   !values.bp &&
    //   !values.p &&
    //   !values.r &&
    //   !values.t &&
    //   !values.ht &&
    //   !values.wt
    // ) {
    //   notify("Please enter at least one vital sign to save.", "error");
    //   return;
    // }
    /* if (!values?.bloodGroup?.value) {
      notify("Please select Blood Group", "error");
      return;
    }
    if (!values?.MUAC?.value) {
      notify("Please select MUAC", "error");
      return;
    }

    if (!values.HeartRate) {
      notify("Please Add Heart Rate", "error");
      return;
    } */
    debugger;
    const newVlaues = {
      tid: values.tid,
      pid: values.pid,
      bp: values.bp,
      p: String(values.p),
      r: values.r,
      t: values.t,
      ht: values?.ht,
      wt: values.wt,
      armSpan: values.armSpan,
      sittingHeight: values.sittingHeight,
      bmi: values.bmi || bmi,
      ibw: values.ibw,
      spO2: values.spO2,
      bf: values.bf,
      muac: values.muac,
      fbs: values.fbs,
      tw: values.tw,
      vf: values.vf,
      muscle: values.muscle,
      rm: values.rm,
      wfa: values.wfa,
      bmifa: values.bmifa,
      app_ID: values.app_ID,
      cbg: values.cbg,
      painScore: values.PainScore,
      remark: values.remark,
      tabID: menuItemData ? Number(menuItemData.id) : 0,
      menuID: menuItemData ? String(menuItemData.id) : "",
      pallor: "",
      odema: "",
      uterus: "",
      varicoseVeins: "",
      nodes: "",
      breasts: "",
      cvs: "",
      repiratory: "",
      anyAdventitiousSounds: "",
      paExamination: "",
      isPregnancy: Number(values?.Pregnant?.value) || 0,
      departmentID: values?.DepartmentID?.value || "",
      hr: values.Hr ?? "",
      bsa: values.Bsa ?? "",
      rr: values.Rr ?? "",
      heightRemarks: values.heightRemarks ?? "",
      hospital_ID: "",
      wtType: "KG",
      htType: "CM",
      tType: "F",
      gcs: values?.GCS ? values?.GCS : 0,
      ciwa: "0",
      bloodGroup: values?.bloodGroup?.label,
      muacc: values?.MUAC?.value,
      danger1: values?.DangerSign?.includes("Breastfeed") ? 1 : 0,
      danger2: values?.DangerSign?.includes("Vomits") ? 1 : 0,
      danger3: values?.DangerSign?.includes("Convulsions") ? 1 : 0,
      danger4: values?.DangerSign?.includes("lethargic") ? 1 : 0,
      danger5: values?.DangerSign?.includes("convulsing") ? 1 : 0,
      date: moment(values?.Date).format("YYYY-MM-DD"),
      time: moment(values?.time).format("HH:mm"),
      heartRate: values.HeartRate || 0,
      allergy: values?.Allergy ? String(values?.Allergy) : "",

      IsSmoking: Number(values?.Smoking?.value) || 0,
      IsTriagingCodes: String(values?.TriagingCodes?.value) || 0,
      IsAlcohol: Number(values?.Alcohol?.value) || 0,
      diabetes: Number(values?.Diabetes?.value) || 0,
      isPregnancy: Number(values?.Pregnant?.value) || 0,
      isimplant: Number(values?.Implant?.value) || 0,

      cough: Number(values?.HIV?.value ?? 0),
      persistent: Number(values?.PersistentFever?.value) || 0,
      unexplainedweight: Number(values?.Unexplained?.value) || 0,
      drenchingnight: Number(values?.Drenching?.value) || 0,
    };

    try {
      const response = await SaveVitals(newVlaues);
      if (response.success === true) {
        notify(response.message, "success");
        resetForm();
        setTimeout(() => setFieldValue("IsPregnancy", 0), 0);

        setWeight("");
        setHeight("");
        setValues(payload);
        // setFieldValue("IsPregnancy")
        // setIsPregnancy(false);

        // dispatch(getBindVital(patientDetail.currentPatient.TransactionID));
        dispatch(
          getBindVital(
            patientDetail?.currentPatient?.TransactionID ??
              patientDetail?.TransactionID,
          ),
        );
        dispatch(setReloadDoctor(!reloadDoctor));
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  const handleSlashInputChange = (e) => {
    debugger;
    const { name, value } = e.target;

    let formattedValue = value.replace(/[^0-9/.]/g, "");

    const parts = formattedValue.split("/");
    if (parts.length > 2) return;

    parts.forEach((part, index) => {
      const subParts = part.split(".");
      if (subParts.length > 2) return;
      if (subParts[1]) subParts[1] = subParts[1].slice(0, 2);
      parts[index] = subParts.join(".");
    });

    setValues((prevValues) => ({
      ...prevValues,
      [name]: parts.join("/"),
    }));
  };

  const handleDecimalInputChange = (e) => {
    const { name, value } = e.target;
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value) || value === "") {
      setValues((prevValues) => ({
        ...prevValues,
        [name]: value,
      }));
    }
  };

  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value,
    });
  };
  const getCurrentDoctorID = async () => {
    try {
      const response = await CommonAPIGetDoctorIDByEmployeeID();
      if (response?.success) {
        setDoctorID(response?.data[0]?.doctorID);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const handleSelect = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (name, selectedOptions) => {
    const selectedValues = Array.isArray(selectedOptions)
      ? selectedOptions.map((opt) => {
          if (opt.name) {
            return opt.name;
          }
          return opt.value || opt;
        })
      : [];

    setValues({
      ...values,
      [name]: selectedValues,
    });
  };
  useImperativeHandle(ref, () => ({
    callChildFunctionHandleSaveVitals: handleSubmit,
    callChildFunctionHandleUpdateVitals: handleUpdate,
  }));

  const handledBinddonorBloodGroup = async () => {
    try {
      const response = await BinddonorBloodGroup();
      if (response.success) {
        setBloodBank(response?.data);
      } else {
        console.error(
          "API returned success as false or invalid response:",
          response,
        );
        setBloodBank([]);
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
      setBloodBank([]);
    }
  };

  useEffect(() => {
    const wt = parseFloat(values.wt);
    const ht = parseFloat(values.ht);

    if (!wt || !ht) {
      setBmi(null);
      setStatus("");
      setFieldValue("bmi", "");
      return;
    }

    const heightInMeters = ht / 100;

    if (heightInMeters <= 0) {
      setBmi(null);
      setStatus("");
      setFieldValue("bmi", "");
      return;
    }

    const bmiValue = (wt / (heightInMeters * heightInMeters)).toFixed(2);
    setBmi(bmiValue);
    setFieldValue("bmi", bmiValue);

    let bmiStatus = "";

    if (bmiValue < 18.5) {
      bmiStatus = "Underweight";
    } else if (bmiValue < 24.9) {
      bmiStatus = "Normal";
    } else if (bmiValue < 24.9) {
      bmiStatus = "Overweight";
    } else {
      bmiStatus = "Obese";
    }

    setStatus(bmiStatus);
  }, [values.wt, values.ht]);

  const fetchVitalData = async (type) => {
    try {
      const response = await getAllVitalMasterApi(type);
      if (response?.success) {
        setApiData((prev) => ({
          ...prev,
          [`getBindVital${type}`]: response?.data || [],
        }));
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {}
  };

  useEffect(() => {
    // getBindVital()
    const vitalTypes = ["BP", "Pulse", "Temp", "SPO2", "PS"];
    vitalTypes.forEach((type) => fetchVitalData(type));
    dispatch(
      getBindVital(
        patientDetail?.currentPatient?.TransactionID ??
          patientDetail?.TransactionID,
      ),
    );
    handledBinddonorBloodGroup();
  }, []);
  const dangerSignOptions = [
    { name: "Unable to drink or Breastfeed", value: "Breastfeed" },
    { name: "Vomits everything", value: "Vomits" },
    { name: "Had Convulsions in this illness", value: "Convulsions" },
    { name: "Is lethargic or Unconscious", value: "lethargic" },
    { name: "Is convulsing now", value: "convulsing" },
  ];
  console.log("valueqqqs", values);
  // const [editData, setEditData] = useState({});
  const handleEditVitalSignValue = (item) => {
    debugger;

    const selectedDangerSigns = [
      item.Danger1 === 1 && "Breastfeed",
      item.Danger2 === 1 && "Vomits",
      item.Danger3 === 1 && "Convulsions",
      item.Danger4 === 1 && "Lethargic",
      item.Danger5 === 1 && "Convulsing",
    ].filter(Boolean);

    const bloodid = bloodBank?.find(
      (ele) => ele?.bloodgroup === item?.BloodGroup,
    )?.id;
    const triagename = triAgeingCodesOptions?.find(
      (ele) => ele?.value === item?.IsTriagingCodes,
    )?.label;
    const IsAlcoholName = triAgeingCodesOptions?.find(
      (ele) => ele?.value === item?.IsAlcohol,
    )?.label;
    const SmokingName = triAgeingCodesOptions?.find(
      (ele) => ele?.value === item?.IsSmoking,
    )?.label;
    const DiabetesName = triAgeingCodesOptions?.find(
      (ele) => ele?.value === item?.Diabetes,
    )?.label;
    const IsPregnancyName = triAgeingCodesOptions?.find(
      (ele) => ele?.value === item?.IsPregnancy,
    )?.label;
    const IsimplantName = triAgeingCodesOptions?.find(
      (ele) => ele?.value === item?.Isimplant,
    )?.label;
    const CoughName = triAgeingCodesOptions?.find(
      (ele) => ele?.value === item?.Cough,
    )?.label;
    const DrenchingnighthName = triAgeingCodesOptions?.find(
      (ele) => ele?.value === item?.Drenchingnight,
    )?.label;
    const UnexplainedweightName = triAgeingCodesOptions?.find(
      (ele) => ele?.value === item?.Unexplainedweight,
    )?.label;
    const PersistentName = triAgeingCodesOptions?.find(
      (ele) => ele?.value === item?.Persistent,
    )?.label;
    // debugger
    const DepartmentIDName = doctorDepartment?.find(
      (ele) => ele?.DepartmentID === item?.DepartmentID,
    )?.DepartmentName;
    // toggleAction();
    setBtnValue("Update");
    // debugger;
    // setActionType("UpdateVitalSign");
    setValues({
      ...values,
      bp: item.BP,
      p: item.P,
      r: item.R,
      t: item.T,
      ht: item.HT,
      wt: item.WT,
      armSpan: item.ArmSpan,
      sittingHeight: item.SHight,
      bmi: item.BMI,
      ibw: item.IBWKg,
      spO2: item.SPO2,
      bf: item.BF,
      muac: item.MUAC,
      fbs: item.FBS,
      tw: item.tw,
      vf: item.vf,
      muscle: item.muscle,
      rm: item.rm,
      wfa: item.WFA,
      bmifa: item.BMIFA,
      id: item?.ID,
      cbg: item.CBG,
      painScore: item?.PainScore ? item?.PainScore : "",
      remark: item.Remarks,
      heightRemarks: item?.HeightRemarks ? item?.HeightRemarks : "",
      app_ID: item.App_ID,
      IsPregnancy: item.IsPregnancy,
      Hr: item.Hr,
      Bsa: item.Bsa,
      Rr: item.Rr,
      FBS: item.FBS,
      Allergy: item.Allergy ? String(item.Allergy) : "",
      GCS: item?.GCS ? item?.GCS : 0,
      bloodGroup: item?.BloodGroup
        ? { label: item?.BloodGroup, value: bloodid }
        : { label: "", value: "" },
      MUAC: item?.MUACC
        ? { label: item?.MUACC, value: item?.MUACC }
        : { label: "", value: "" },
      HeartRate: item.HeartRate,
      PainScore: item.PainScore,
      DepartmentID: { label: DepartmentIDName, value: item?.DepartmentID },
      DangerSign: selectedDangerSigns,
      TriagingCodes: { label: triagename, value: item?.IsTriagingCodes },
      Alcohol: { label: IsAlcoholName, value: item?.IsAlcohol },
      Smoking: { label: SmokingName, value: item?.IsSmoking },
      Diabetes: { label: DiabetesName, value: item?.Diabetes },
      Pregnant: { label: IsPregnancyName, value: item?.IsPregnancy },
      Implant: { label: IsimplantName, value: item?.Isimplant },
      HIV: { label: CoughName, value: item?.Cough },
      PersistentFever: { label: PersistentName, value: item?.Persistent },
      Unexplained: {
        label: UnexplainedweightName,
        value: item?.Unexplainedweight,
      },
      Drenching: { label: DrenchingnighthName, value: item?.Drenchingnight },
    });

    setHeight(item.HT);
    setWeight(item.WT);
  };

  const handleUpdate = async () => {
    /* if (!values?.bloodGroup?.value) {
      notify("Please select Blood Group", "error");
      return;
    }
    if (!values?.MUAC?.value) {
      notify("Please select MUAC", "error");
      return;
    }

    if (!values.HeartRate) {
      notify("Please Add Heart Rate", "error");
      return;
    } */
    debugger;
    const requestBody = {
      tid: values?.tid ?? "",
      pid: values?.pid ?? "",

      bp: values?.bp ? String(values.bp) : "",
      p: values?.p ? String(values.p) : "",
      r: values?.r ? String(values.r) : "",
      t: values?.t ? String(values.t) : "",

      ht: values?.ht ? String(values.ht) : "",
      wt: values?.wt ? String(values.wt) : "",

      armSpan: values?.armSpan ? String(values.armSpan) : "",
      sittingHeight: values?.sittingHeight ? String(values.sittingHeight) : "",

      bmi: Number(bmi || values?.bmi  || 0),
      ibw: Number(values?.ibw ?? 0),
      spO2: Number(values?.spO2 ?? 0),
      bf: Number(values?.bf ?? 0),
      muac: Number(values?.muac ?? 0),
      fbs: Number(values?.fbs ?? 0),
      tw: Number(values?.tw ?? 0),
      vf: Number(values?.vf ?? 0),
      muscle: Number(values?.muscle ?? 0),
      rm: Number(values?.rm ?? 0),
      cbg: values?.cbg ?? "",
      painScore: values?.PainScore ?? "",
      remark: values?.remark ?? "",
      id: Number(values?.id ?? 0),
      pallor: "",
      odema: "",
      uterus: "",
      varicoseVeins: "",
      nodes: "",
      breasts: "",
      cvs: "",
      repiratory: "",
      anyAdventitiousSounds: "",
      paExamination: "",

      // isPregnancy: Number(values?.Pregnant?.value ?? 0),
      departmentID: Number(values?.DepartmentID?.value ?? 0),

      hr: values?.hr ?? "",
      bsa: values?.bsa ?? "",
      rr: values?.rr ?? "",
      heightRemarks: values?.heightRemarks ?? "",
      hospital_ID: values?.hospital_ID ?? "",

      wtType: "KG",
      htType: "CM",
      tType: "F",

      gcs: values?.GCS ? values?.GCS : 0,
      ciwa: values?.ciwa ?? "0",

      bloodGroup: values?.bloodGroup?.label ?? "",
      muacc: values?.MUAC?.value ?? "",

      danger1: values?.DangerSign?.includes("Breastfeed") ? 1 : 0,
      danger2: values?.DangerSign?.includes("Vomits") ? 1 : 0,
      danger3: values?.DangerSign?.includes("Convulsions") ? 1 : 0,
      danger4: values?.DangerSign?.includes("lethargic") ? 1 : 0,
      danger5: values?.DangerSign?.includes("convulsing") ? 1 : 0,

      date: values?.Date ? moment(values.Date).format("YYYY-MM-DD") : "",
      time: values?.time ? moment(values.time).format("HH:mm") : "",

      heartRate: values.HeartRate,
      allergy: values?.Allergy ? String(values?.Allergy) : "",

      IsSmoking: Number(values?.Smoking?.value) || 0,
      IsTriagingCodes: String(values?.TriagingCodes?.value) || 0,
      IsAlcohol: Number(values?.Alcohol?.value) || 0,
      diabetes: Number(values?.Diabetes?.value) || 0,
      isPregnancy: Number(values?.Pregnant?.value) || 0,
      isimplant: Number(values?.Implant?.value) || 0,

      cough: Number(values?.HIV?.value ?? 0),
      persistent: Number(values?.PersistentFever?.value) || 0,
      unexplainedweight: Number(values?.Unexplained?.value) || 0,
      drenchingnight: Number(values?.Drenching?.value) || 0,
    };

    try {
      const res = await UpdateVitals(requestBody);

      if (res.success) {
        notify(res.message, "success");
        setValues(payload);
        // dispatch(getBindVital(patientDetail.currentPatient.TransactionID));
        dispatch(
          getBindVital(
            patientDetail?.currentPatient?.TransactionID ??
              patientDetail?.TransactionID,
          ),
        );
        resetForm();
        setWeight("");
        setHeight("");
        setActionType("VitalSign");
        setBtnValue("Save");
        dispatch(setReloadDoctor(!reloadDoctor));
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleGetDoctorDepartments = async () => {
    try {
      const res = await getDoctorDepartmentLitsApi(doctorID);
      setDoctorDepartment(res.data);
      const defaultKey = doctorDepartment?.find((ele) => ele?.IsDefault === 1);
      setFieldValue("DepartmentID", defaultKey?.DepartmentID);
    } catch (error) {
      notify(error.response?.message, "error");
      console.log(error);
    }
  };

  useEffect(() => {
    const defaultKey = doctorDepartment?.find((ele) => ele?.IsDefault === 1);
    setFieldValue("DepartmentID", defaultKey?.DepartmentID);
  }, [doctorDepartment]);
  useEffect(() => {
    // getCurrentDoctorID();
    if (doctorID) {
      handleGetDoctorDepartments();
    }
  }, [props?.patientDetail?.DoctorID]);

  const handleReactSelect = (name, e) => {
    setValues((prevValues) => ({
      ...prevValues,
      [name]: e?.value,
    }));
  };

  const handleChangeCreate = (selectedOption) => {
    setValues((prev) => ({
      ...prev,
      painScore: selectedOption ? selectedOption.value : "",
    }));
  };

  const [filteredData, setFilteredData] = useState();

  const search = (event, type) => {
    const query = (event.query || "").toLowerCase();
    let allValues = "";
    switch (type) {
      case "bp":
        allValues = apiData?.getBindVitalBP?.map((item) => item?.value) || [];
        break;
      case "pulse":
        allValues =
          apiData?.getBindVitalPulse?.map((item) => item?.value) || [];
        break;
      case "temp":
        allValues = apiData?.getBindVitalTemp?.map((item) => item?.value) || [];
        break;
      case "spO2":
        allValues = apiData?.getBindVitalSPO2?.map((item) => item?.value) || [];
        break;
      case "ps":
        allValues = apiData?.getBindVitalPS?.map((item) => item?.value) || [];
        break;
      default:
        break;
    }

    const filtered =
      allValues?.length > 0 &&
      allValues?.filter((item) => item?.toLowerCase().includes(query));
    setFilteredData(filtered);
  };

  const handleFocus = (type) => {
    const query = ""; // show full list
    search({ query });
    // setTimeout(() => {

    switch (type) {
      case "temp":
        search({ query, type: "temp" }); // Optional filtering
        autoCompleteTempRef.current?.show();
        break;
      case "bp":
        search({ query, type: "bp" });
        autoCompleteBPRef.current?.show();
        break;
      case "pulse":
        search({ query, type: "pulse" });
        autoCompletePulseRef.current?.show();
        break;
      case "spO2":
        search({ query, type: "spO2" });
        autoCompletespO2Ref.current?.show();
        break;
      case "ps":
        search({ query, type: "ps" });
        autoCompletePSRef.current?.show();
        break;
      default:
        break;
    }
  };

  const handleSelectBox = (e, name) => {
    const value = name.value;
    setFieldValue(e, name.value);
    // setSelectedObject({ label: value, value }); // store as object
  };
  const handleManualMouseSelect = (item) => {};
  const itemTemplate = (item) => {
    return (
      <div
        onClick={() => {
          handleManualMouseSelect({ value: item });
          // setInputValue(item.label);
          // autoCompleteBPRef.current.hide();
        }}
        style={{ padding: "8px", cursor: "pointer" }}
      >
        {item}
      </div>
    );
  };

  return (
    <>
      <div className="">
        <div className="m-2 spatient_registration_card">
          <div className="patient_registration card">
            <Heading
              title={t("Physical Examination")}
              // isBreadcrumb={true}
            />
            <div className="row g-4 m-2">
              <DatePicker
                className="custom-calendar"
                id="Date"
                name="Date"
                value={moment(values?.Date).toDate()}
                handleChange={handleChange}
                lable={t("Date")}
                placeholder={VITE_DATE_FORMAT}
                respclass={"col-xl-2 col-md-4 col-sm-6 col-12"}
              />
              <TimePicker
                placeholderName={t("Time")}
                lable={t("Time")}
                id="time"
                name="time"
                value={values?.time}
                respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                handleChange={handleDateTimeChange}
              />
              <div className="position-relative d-flex col-xl-2 col-md-4 col-sm-4 col-12">
                <AutoComplete
                  ref={autoCompleteBPRef}
                  value={values?.bp}
                  suggestions={
                    filteredData?.length > 0
                      ? filteredData
                      : apiData?.getBindVitalBP?.map((item) => item?.value)
                  }
                  completeMethod={(e) => search(e, "bp")}
                  placeholder={t("Enter BP")}
                  className="w-100"
                  onFocus={() => handleFocus("bp")}
                  onBlur={() => {
                    setTimeout(() => {
                      autoCompleteBPRef.current?.hide();
                    }, 150);
                  }}
                  name="bp"
                  onChange={handleChange}
                  // onChange={(e) => setFieldValue("bp", e.value)}
                  onSelect={(e) => handleSelectBox("bp", e)}
                  itemTemplate={itemTemplate}
                />
                {values?.bp && (
                  <label
                    className="label lable truncate ml-3 p-1"
                    style={{ fontSize: "5px !important" }}
                  >
                    {t("BP")}
                  </label>
                )}
                <span className="text-muted fw-semibold input-box">
                  {t("mm/Hg")}
                </span>
              </div>

              <div className="position-relative d-flex col-xl-2 col-md-4 col-sm-4 col-12">
                <AutoComplete
                  ref={autoCompletePulseRef}
                  value={values?.p}
                  suggestions={
                    filteredData?.length > 0
                      ? filteredData
                      : apiData?.getBindVitalPulse?.map((item) => item?.value)
                  }
                  completeMethod={(e) => search(e, "pulse")}
                  placeholder={t("Pulse")}
                  className="w-100"
                  onFocus={() => handleFocus("pulse")}
                  onBlur={() => {
                    setTimeout(() => {
                      autoCompletePulseRef.current?.hide();
                    }, 150);
                  }}
                  name="p"
                  id="Pulse"
                  onChange={handleDecimalInputChange}
                  // onChange={(e) => setFieldValue("p", e.value)}
                  onSelect={(e) => handleSelectBox("pulse", e)}
                  itemTemplate={itemTemplate}
                />
                {values?.p && (
                  <label
                    className="label lable truncate ml-3 p-1"
                    style={{ fontSize: "5px !important" }}
                  >
                    {t("Pulse")}
                  </label>
                )}
                <span className="text-muted fw-semibold input-box">
                  {t("bpm")}
                </span>
              </div>

              <Input
                type="text"
                className="form-control"
                id="Resp"
                lable={t("Resp")}
                placeholder=" "
                required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name="r"
                value={values?.r}
                onChange={handleDecimalInputChange}
                placeholderLabel={"/min"}
              />
              <div className="position-relative d-flex col-xl-2 col-md-4 col-sm-4 col-12">
                <AutoComplete
                  ref={autoCompleteTempRef}
                  value={values?.t}
                  suggestions={
                    filteredData?.length > 0
                      ? filteredData
                      : apiData?.getBindVitalTemp?.map((item) => item?.value)
                  }
                  completeMethod={(e) => search(e, "temp")}
                  placeholder={t("Enter Temp")}
                  className="w-100"
                  name="t"
                  onFocus={() => handleFocus("temp")}
                  onBlur={() => {
                    setTimeout(() => {
                      autoCompleteTempRef.current?.hide();
                    }, 150);
                  }}
                  onChange={handleChange}
                  // onChange={(e) => setFieldValue("t", e.value)}
                  onSelect={(e) => handleSelectBox("temp", e)}
                  itemTemplate={itemTemplate}
                />
                {values?.t && (
                  <label
                    className="label lable truncate ml-3 p-1"
                    style={{ fontSize: "5px !important" }}
                  >
                    {t("Temp")}
                  </label>
                )}
                <span className="text-muted fw-semibold input-box">°F</span>
              </div>

              <Input
                type="text"
                className="form-control"
                id="Height"
                lable={t("Height")}
                placeholder=" "
                required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name="ht"
                onChange={handleDecimalInputChange}
                value={values?.ht}
                placeholderLabel={"CM"}
              />

              <Input
                type="text"
                className="form-control"
                id="Weight"
                lable={t("Weight ")}
                placeholder=" "
                required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name="wt"
                placeholderLabel={"Kg"}
                value={values?.wt}
                onChange={handleDecimalInputChange}
              />
              <Input
                type="text"
                className="form-control"
                id="bmi"
                lable={t("bmi")}
                placeholder=" "
                required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name="bmi"
                placeholderLabel={"kg/m²"}
                value={bmi ? bmi : values?.bmi}
                disabled={true}
              />

              <Input
                type="text"
                className="form-control"
                id="ArmSpan"
                lable={t("Arm Span")}
                placeholder=" "
                placeholderLabel={"CM"}
                required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name="armSpan"
                value={values?.armSpan}
                onChange={handleDecimalInputChange}
              />
              <Input
                type="text"
                className="form-control"
                id="SittingHeight"
                lable={t("Sitting Height ")}
                placeholder=" "
                required={true}
                placeholderLabel={"CM"}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name="sittingHeight"
                value={values?.sittingHeight}
                onChange={handleDecimalInputChange}
              />
              <Input
                type="text"
                className="form-control"
                id="IBW"
                lable={t("IBW ")}
                placeholder=" "
                placeholderLabel={"KG"}
                required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name="ibw"
                value={values?.ibw}
                onChange={handleDecimalInputChange}
              />
              <div className="position-relative d-flex col-xl-2 col-md-4 col-sm-4 col-12">
                <AutoComplete
                  ref={autoCompletespO2Ref}
                  value={values?.spO2}
                  suggestions={
                    filteredData?.length > 0
                      ? filteredData
                      : apiData?.getBindVitalSPO2?.map((item) => item?.value)
                  }
                  completeMethod={(e) => search(e, "spO2")}
                  placeholder={t("Select or Enter spO2")}
                  className="w-100"
                  name="spO2"
                  onFocus={() => handleFocus("spO2")}
                  onBlur={() => {
                    setTimeout(() => {
                      autoCompletespO2Ref.current?.hide();
                    }, 150);
                  }}
                  onChange={handleChange}
                  onSelect={(e) => handleSelectBox("spO2", e)}
                  itemTemplate={itemTemplate}
                />
                {values?.spO2 && (
                  <label
                    className="label lable truncate ml-3 p-1"
                    style={{ fontSize: "5px !important" }}
                  >
                    {t("spO2")}
                  </label>
                )}
                <span className="text-muted fw-semibold input-box">%</span>
              </div>

              {/* <Input
                type="text"
                className="form-control "
                id="BloodGlucose"
                lable={t("Blood Glucose")}
                placeholderLabel={"mmol/L"}
                placeholder=" "
                required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name="BloodGlucose"
                value={values?.BloodGlucose}
                onChange={handleSlashInputChange}
              /> */}
              <Input
                type="text"
                className="form-control"
                id="PainScore"
                lable={t("Pain Score")}
                placeholderLabel={""}
                placeholder=" "
                required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name="PainScore"
                value={values?.PainScore}
                onChange={handleSlashInputChange}
              />
              <Input
                type="text"
                className="form-control"
                id="GCS"
                lable={t("GCS")}
                placeholderLabel={""}
                placeholder=" "
                required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name="GCS"
                value={values?.GCS}
                onChange={handleSlashInputChange}
              />

              <ReactSelect
                placeholderName={t("Blood Group")}
                id={"bloodGroup"}
                // className="required-fields"
                searchable={true}
                removeIsClearable={true}
                dynamicOptions={[
                  // { value: "0", label: "ALL" },
                  ...handleReactSelectDropDownOptions(
                    bloodBank,
                    "bloodgroup",
                    "id",
                  ),
                ]}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                handleChange={handleSelect}
                // requiredClassName="required-fields"
                value={`${values?.bloodGroup?.value}`}
                name={"bloodGroup"}
              />

              <ReactSelect
                dynamicOptions={[
                  { value: "Select", label: t("Select") },
                  { value: "Red", label: t("Red") },
                  { value: "Green", label: t("Green") },
                  { value: "Yellow", label: t("Yellow") },
                ]}
                name={"MUAC"}
                value={values?.MUAC?.value}
                handleChange={handleSelect}
                placeholderName={"MUAC"}
                // requiredClassName="required-fields"
                id={"MUAC"}
                respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
              />
              <Input
                type="text"
                className="form-control"
                id="HeartRate"
                lable={t("Heart Rate")}
                placeholder=" "
                required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name="HeartRate"
                value={values.HeartRate}
                onChange={handleChange}
              />

              <Input
                type="text"
                className="form-control"
                id="remark"
                lable={t("Remarks")}
                placeholder=" "
                required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name="remark"
                value={values?.remark}
                onChange={handleChange}
              />

              <ReactSelect
                dynamicOptions={doctorDepartment?.map((ele) => {
                  return {
                    value: ele?.DepartmentID,
                    label: ele?.DepartmentName,
                  };
                })}
                name={"DepartmentID"}
                value={values?.DepartmentID?.value}
                handleChange={handleSelect}
                placeholderName={"Doctor Department"}
                id={"DepartmentID"}
                respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
              />

              {(patientDetail?.Gender === "F" ||
                patientDetail?.Sex === "Female") && (
                <div className="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12">
                  <label
                    className="d-flex align-items-center ml-3"
                    style={{ cursor: "pointer" }}
                  >
                    <Checkbox
                      id="is_pregnancy"
                      className="mt-2"
                      onChange={(e) =>
                        setFieldValue("IsPregnancy", e.target.checked ? 1 : 0)
                      }
                      checked={Boolean(values.IsPregnancy)}
                    />
                    {t("IsPregnent")}
                  </label>
                </div>
              )}

              {/* <MultiSelectComp
                respclass="col-xl-2 col-md-3 col-sm-6 col-12"
                name="DangerSign"
                id="DangerSign"
                placeholderName={t("Danger Sign")}
                dynamicOptions={dangerSignOptions}
                handleChange={handleMultiSelectChange}
                value={values?.DangerSign}
                isRemoveTemplate={true}
              /> */}
              <MultiSelectComp
                respclass="col-xl-2 col-md-3 col-sm-6 col-12"
                name="DangerSign"
                id="DangerSign"
                placeholderName={t("Danger Sign")}
                dynamicOptions={dangerSignOptions}
                handleChange={handleMultiSelectChange}
                value={values?.DangerSign}
                isRemoveTemplate={true}
              />

              <ReactSelect
                dynamicOptions={[
                  {
                    value: props?.patientDetail?.DoctorID,
                    label: props?.patientDetail?.DName,
                  },
                ]}
                name={"departmentName"}
                value={props?.patientDetail?.DoctorID}
                handleChange={handleSelect}
                placeholderName={"Doctor Name"}
                id={"departmentName"}
                respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
              />
              <ReactSelect
                dynamicOptions={triAgeingCodesOptions}
                name={"TriagingCodes"}
                value={values?.TriagingCodes?.value}
                handleChange={handleSelect}
                placeholderName={"Triaging Codes"}
                id={"TriagingCodes"}
                respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
              />
              <ReactSelect
                dynamicOptions={HandleAutoOptions}
                name={"Alcohol"}
                value={values?.Alcohol?.value}
                handleChange={handleSelect}
                placeholderName={"Alcohol"}
                id={"Alcohol"}
                respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
              />
              <ReactSelect
                dynamicOptions={HandleAutoOptions}
                name={"Smoking"}
                value={values?.Smoking?.value}
                handleChange={handleSelect}
                placeholderName={"Smoking"}
                id={"Smoking"}
                respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
              />
              <ReactSelect
                dynamicOptions={HandleAutoOptions}
                name={"Diabetes"}
                value={values?.Diabetes?.value}
                handleChange={handleSelect}
                placeholderName={"Diabetes"}
                id={"Diabetes"}
                respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
              />
              <ReactSelect
                dynamicOptions={HandleAutoOptions}
                name={"Pregnant"}
                value={values?.Pregnant?.value}
                handleChange={handleSelect}
                placeholderName={"Pregnant"}
                id={"Pregnant"}
                respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
              />
              <ReactSelect
                dynamicOptions={[
                  { value: "1", label: t("Yes") },
                  { value: "0", label: t("No") },
                ]}
                name={"Implant"}
                value={values?.Implant?.value}
                handleChange={handleSelect}
                placeholderName={"Implant"}
                id={"Implant"}
                respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
              />
              <Input
                type="text"
                className="form-control"
                id="Allergy"
                lable={t("Allergy")}
                placeholder=" "
                required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name="Allergy"
                value={values?.Allergy}
                onChange={handleChange}
              />
            </div>
            <Heading
              title={t("Adult TB Symptoms Screening")}
              // isBreadcrumb={true}
            />

            <div className="row m-2">
              <ReactSelect
                dynamicOptions={HandleAutoOptions}
                name={"HIV"}
                value={values?.HIV?.value}
                handleChange={handleSelect}
                placeholderName={
                  "Cough ≥ 2 weeks OR of any duration if HIV positive"
                }
                id={"HIV"}
                respclass={"col-xl-6 col-md-6 col-sm-4 col-sm-4 col-12"}
              />
              <ReactSelect
                dynamicOptions={HandleAutoOptions}
                name={"PersistentFever"}
                value={values?.PersistentFever?.value}
                handleChange={handleSelect}
                placeholderName={"Persistent fever ≥ 2 weeks"}
                id={"PersistentFever"}
                respclass={"col-xl-6 col-md-6 col-sm-4 col-sm-4 col-12"}
              />
              <ReactSelect
                dynamicOptions={HandleAutoOptions}
                name={"Unexplained"}
                value={values?.Unexplained?.value}
                handleChange={handleSelect}
                placeholderName={"Unexplained weight loss > 1.5 kg in a month"}
                id={"Unexplained"}
                respclass={"col-xl-6 col-md-6 col-sm-4 col-sm-4 col-12"}
              />
              <ReactSelect
                dynamicOptions={HandleAutoOptions}
                name={"Drenching"}
                value={values?.Drenching?.value}
                handleChange={handleSelect}
                placeholderName={"Drenching night sweats ≥ 2 weeks"}
                id={"Drenching"}
                respclass={"col-xl-6 col-md-6 col-sm-4 col-sm-4 col-12"}
              />

              <div>
                <button
                  className="btn btn-sm btn-success "
                  onClick={btnValue === "Save" ? onSubmit : handleUpdate}
                >
                  {btnValue}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <VitalSignTable
        tbody={getBindVitalData}
        handleEditVitalSignValue={handleEditVitalSignValue}
        isPregnant={Boolean(values.IsPregnancy)}
        patientDetail={patientDetail}
      />
    </>
  );
});

export default VitalSign;
