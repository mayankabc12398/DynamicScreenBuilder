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
    AddTriageBooking,
    BindDetails,
    CommonAPIGetDoctorIDByEmployeeID,
    ExaminationRoomBindDoctorDept,
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
import moment from "moment";
import TimePicker from "../../../components/formComponent/TimePicker";

const TriageBookingDetails = forwardRef((props, ref) => {
    const { VITE_DATE_FORMAT } = import.meta.env;
    const autoCompleteTempRef = useRef([]);
    const autoCompleteBPRef = useRef([]);
    const autoCompletePulseRef = useRef([]);
    const autoCompletespO2Ref = useRef([]);
    const autoCompletePSRef = useRef([]);
    debugger
    const { patientDetail, setActionType, menuItemData, toggleAction } = props;
    const localData = useLocalStorage("userData", "get");
    const [bmi, setBmi] = useState("");
    const dispatch = useDispatch();
    const { getBindVitalData } = useSelector((state) => state?.vitalSignSlice);
    const reloadDoctor = useSelector((state) => state.reloadDoctor.loading);
    const [doctorDepartment, setDoctorDepartment] = useState([]);
    const [doctorDept, setDoctorDept] = useState([]);
    const [doctorID, setDoctorID] = useState(props?.patientDetail?.DoctorID);
    const [bloodBank, setBloodBank] = useState([]);
    const [btnValue, setBtnValue] = useState("Save");
    const [status, setStatus] = useState("");
    const [t] = useTranslation();
    const [weight, setWeight] = useState("");
    const [height, setHeight] = useState("");

    const [apiData, setApiData] = useState({
        getBindVitalData: [],
        getBindVitalBP: [],
        getBindVitalPulse: [],
        getBindVitalTemp: [],
        getBindVitalSPO2: [],
        getBindVitalPS: [],
    });

    const payload = {
        tid: patientDetail?.currentPatient?.TransactionID,
        pid: patientDetail?.currentPatient?.PatientID,
        IsPregnancy: 0,
        DepartmentID: 0,
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
    };

    const {
        handleChange,
        values,
        setFieldValue,
        setValues,
        handleSubmit,
        errors,
        touched,
        validateForm,
        resetForm,
    } = useFormik({
        initialValues: payload,
        enableReinitialize: false,

        // onSubmit: async (values) => {
        //     setActionType("VitalSign");
        //     // const customerrors = ErrorHandling();
        //     // if (Object.keys(customerrors)?.length > 1) {
        //     //   if (Object.values(customerrors)[0]) {
        //     //     notify(Object.values(customerrors)[1], "error");
        //     //     return;
        //     //   }
        //     // }

        //     if (
        //         !values.bp &&
        //         !values.p &&
        //         !values.r &&
        //         !values.t &&
        //         !values.ht &&
        //         !values.wt
        //     ) {
        //         notify("Please enter at least one vital sign to save.", "error");
        //         return;
        //     }

        //     const newVlaues =
        //     {
        //         "allergyremark": values?.AllergyRemarks,
        //         "typellergyID": values?.Type?.value,
        //         "allergyID": values?.Allergy?.value,
        //         "traiagecode": values?.TriagingCodes?.value,
        //         "doctorId": values?.doctorDept?.value,
        //         "uhid": patientDetail?.PatientID,
        //         "date": moment(values?.Date).format("YYYY-MM-DD"),
        //         "time": moment(values?.time).format("HH:mm"),
        //         "bp": values.bp,
        //         "pulse": values?.p,
        //         "resp": values?.r,
        //         "temp": values.t,
        //         "ht": values.height,
        //         "wt": values.weight,
        //         "arm": values.armSpan,
        //         "sitting": values?.sittingHeight,
        //         "ibw": values?.ibw,
        //         "spo": values?.spO2,
        //         "blood": "",
        //         "pain": values?.PainScore,
        //         "gcs": values?.GCS,
        //         "ciwa": "",
        //         "bloodGroup": values?.bloodGroup?.label,
        //         "remark": values.remark,
        //         "ddlmuac": values.muac,
        //         "alcohol": values?.Alcohol?.value,
        //         "smoking": values?.Smoking?.value,
        //         "unabletodrinkorBreastfeed": values?.DangerSign?.includes("Breastfeed") ? 1 : 0,
        //         "vomits": values?.DangerSign?.includes("Vomits") ? 1 : 0,
        //         "hadConvulsionsinthisillness": values?.DangerSign?.includes("Convulsions") ? 1 : 0,
        //         "islethargicorUnconscious": values?.DangerSign?.includes("lethargic") ? 1 : 0,
        //         "isconvulsingnow": values?.DangerSign?.includes("convulsing") ? 1 : 0,
        //         "doctorDepartment": values?.DoctorDepartment?.value,
        //         "doctorName": values?.doctorDept?.label,
        //         "createdBy": ""
        //     }



        //     try {
        //         const response = await AddTriageBooking(newVlaues);
        //         if (response.success === true) {
        //             notify(response.message, "success");
        //             resetForm();

        //             // ✅ Force UI update to reflect reset state
        //             setTimeout(() => setFieldValue("IsPregnancy", 0), 0);

        //             setWeight("");
        //             setHeight("");
        //             // setFieldValue("IsPregnancy")
        //             // setIsPregnancy(false);
        //             // debugger;
        //             dispatch(getBindVital(patientDetail.currentPatient.TransactionID));
        //             dispatch(setReloadDoctor(!reloadDoctor));
        //         }
        //     } catch (error) { }
        // },
    });


    const   onSubmit=async (values) => {
        
            const newVlaues =
            {
                "allergyremark": values?.AllergyRemarks,
                "typellergyID": values?.Type?.value,
                "allergyID": values?.Allergy?.value,
                "traiagecode": values?.TriagingCodes?.value,
                "doctorId": values?.doctorDept?.value,
                "uhid": patientDetail?.PatientID,
                "date": moment(values?.Date).format("YYYY-MM-DD"),
                "time": moment(values?.time).format("HH:mm"),
                "bp": values.bp,
                "pulse": values?.p,
                "resp": values?.r,
                "temp": values.t,
                "ht": values.height,
                "wt": values.weight,
                "arm": values.armSpan,
                "sitting": values?.sittingHeight,
                "ibw": values?.ibw,
                "spo": values?.spO2,
                "blood": "",
                "pain": values?.PainScore,
                "gcs": values?.GCS,
                "ciwa": "",
                "bloodGroup": values?.bloodGroup?.label,
                "remark": values.remark,
                "ddlmuac": values.muac,
                "alcohol": values?.Alcohol?.value,
                "smoking": values?.Smoking?.value,
                "unabletodrinkorBreastfeed": values?.DangerSign?.includes("Breastfeed") ? 1 : 0,
                "vomits": values?.DangerSign?.includes("Vomits") ? 1 : 0,
                "hadConvulsionsinthisillness": values?.DangerSign?.includes("Convulsions") ? 1 : 0,
                "islethargicorUnconscious": values?.DangerSign?.includes("lethargic") ? 1 : 0,
                "isconvulsingnow": values?.DangerSign?.includes("convulsing") ? 1 : 0,
                "doctorDepartment": values?.DoctorDepartment?.value,
                "doctorName": values?.doctorDept?.label,
                "createdBy": ""
            }



            try {
                const response = await AddTriageBooking(newVlaues);
                if (response.success) {
                    notify(response.message, "success");
                    // resetForm();

                    // // ✅ Force UI update to reflect reset state
                    // setTimeout(() => setFieldValue("IsPregnancy", 0), 0);

                    // setWeight("");
                    // setHeight("");
                    // // setFieldValue("IsPregnancy")
                    // // setIsPregnancy(false);
                    // // debugger;
                    // dispatch(getBindVital(patientDetail.currentPatient.TransactionID));
                    // dispatch(setReloadDoctor(!reloadDoctor));
                }
                else{
                    notify(response.message, "error");
                }
            } catch (error) { }
        };
    const handleDateTimeChange = (e) => {
        const { name, value } = e.target;
        setValues({
            ...values,
            [name]: value,
        });
    };
    const handleSlashInputChange = (e) => {
        const { name, value } = e.target;

        let formattedValue = value.replace(/[^0-9/.]/g, ""); // Remove invalid characters

        const parts = formattedValue.split("/");
        if (parts.length > 2) return; // Prevent multiple '/'

        parts.forEach((part, index) => {
            const subParts = part.split(".");
            if (subParts.length > 2) return; // Prevent multiple decimals in a number
            if (subParts[1]) subParts[1] = subParts[1].slice(0, 2); // Keep only 2 decimal places
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
    const BindDoctorDept = async (ID) => {
        try {
            const response = await ExaminationRoomBindDoctorDept(ID);
            if (response?.success) {
                setDoctorDept(response?.data);
                setDoctorID(response?.data[0]?.doctorID);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };
    const handleSelect = (name, value) => {
        setValues((prev) => ({ ...prev, [name]: value }));
        if( name==="DoctorDepartment" ){
        BindDoctorDept(value?.value)
        }

    };
    // const handleSelect = (name, value) => {
    //   setFieldValue("DepartmentID", value?.value);
    // };
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
                    response
                );
                setBloodBank([]);
            }
        } catch (error) {
            console.error("Error fetching department data:", error);
            setBloodBank([]);
        }
    };
    const ErrorHandling = () => {
        let errors = {};
        errors.id = [];
        //   if (!values.bp) {
        //     errors.bp = "BP Is Required";
        //     errors.id[errors?.id?.length] = "bp";
        //   }
        //   if (!values.p) {
        //     errors.p = "Pulse Is Required";
        //     errors.id[errors?.id?.length] = "p";
        //   }
        //   return errors;
    };

    // useEffect(() => {
    //   console.log("Render");
    //   if (!weight || !height) {
    //     setBmi(null);
    //     setStatus("");
    //   } else {
    //     const heightInMeters = parseFloat(height) / 100;
    //     const bmiValue = (
    //       parseFloat(weight) /
    //       (heightInMeters * heightInMeters)
    //     ).toFixed(2);
    //     setBmi(bmiValue);
    //     setFieldValue("bmi", bmiValue);
    //     setFieldValue("wt", weight);
    //     setFieldValue("ht", height);
    //     let bmiStatus = "";
    //     if (bmiValue < 18.5) {
    //       bmiStatus = "Underweight";
    //     } else if (bmiValue < 24.9) {
    //       bmiStatus = "Normal weight";
    //     } else if (bmiValue < 29.9) {
    //       bmiStatus = "Overweight";
    //     } else {
    //       bmiStatus = "Obesity";
    //     }
    //     setStatus(bmiStatus);
    //   }
    // }, [weight, height]);

    // const getBindVital = async ()=>{
    //   try {
    //     const res = await BindDetails(patientDetail.currentPatient.TransactionID)
    //     console.log(res);
    //     setApiData((prev)=>({...prev, getBindVitalData:res.data}))
    //   } catch (error) {
    //     console.log(error);

    //   }
    // }
    useEffect(() => {

        // Check if either weight or height is missing
        if (!values.wt || !values.ht) {
            setBmi("N/A"); // Set BMI to N/A if either weight or height is missing
            setStatus(""); // Reset the status
            setFieldValue("bmi", ""); // Set BMI field value to N/A
            setFieldValue("wt", values.wt); // Set weight field value
            setFieldValue("ht", values.ht); // Set height field value
        } else {
            // Proceed with BMI calculation if both weight and height are available
            const heightInMeters = parseFloat(values.ht) / 100; // Convert height to meters
            const bmiValue = (
                parseFloat(values.wt) /
                (heightInMeters * heightInMeters)
            ).toFixed(2); // Calculate BMI

            setBmi(bmiValue); // Set BMI value
            setFieldValue("bmi", bmiValue); // Set BMI field value
            setFieldValue("wt", values.wt); // Set weight field value
            setFieldValue("ht", values.ht); // Set height field value

            let bmiStatus = "";
            if (bmiValue < 18.5) {
                bmiStatus = "Underweight";
            } else if (bmiValue < 24.9) {
                bmiStatus = "Normal weight";
            } else if (bmiValue < 29.9) {
                bmiStatus = "Overweight";
            } else {
                bmiStatus = "Obesity";
            }

            setStatus(bmiStatus); // Set BMI status
        }
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
        } catch (error) { }
    };

    useEffect(() => {
        // getBindVital()
        const vitalTypes = ["BP", "Pulse", "Temp", "SPO2", "PS"];
        vitalTypes.forEach((type) => fetchVitalData(type));
        dispatch(getBindVital(patientDetail?.currentPatient?.TransactionID));
        handledBinddonorBloodGroup()
        
    }, []);

    useEffect(() => {   
        BindDoctorDept(values?.DoctorDepartment?.value);
    }, [values?.DoctorDepartment?.value]);


    // const [editData, setEditData] = useState({});
    const handleEditVitalSignValue = (item) => {
        toggleAction();
        setBtnValue("Update");
        // // debugger
        setActionType("UpdateVitalSign");
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
            id: item.ID,
            cbg: item.CBG,
            painScore: item.PainScore ? item.PainScore : "",
            remark: item.Remarks,
            heightRemarks: item?.HeightRemarks ? item?.HeightRemarks : "",
            app_ID: item.App_ID,
            IsPregnancy: item.IsPregnancy,
            Hr: item.Hr,
            Bsa: item.Bsa,
            Rr: item.Rr,
            FBS: item.FBS,
        });

        setHeight(item.HT);
        setWeight(item.WT);
    };


    const handleUpdate = async () => {
        try {
            const res = await UpdateVitals(values);

            if (res.success) {
                notify(res.message, "success");
                dispatch(getBindVital(patientDetail.currentPatient.TransactionID));
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
    const handleManualMouseSelect = (item) => {
    };
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
                                    onChange={(e) => setFieldValue("bp", e.value)}
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
                                    onChange={(e) => setFieldValue("t", e.value)}
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
                            // value={values.ht}
                            // onChange={handleChange}
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
                                // value={values.wt}
                                // onChange={handleChange}
                                value={values?.wt}
                                onChange={handleDecimalInputChange}
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
                                    onChange={(e) => setFieldValue("spO2", e.value)}
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
                            
                            <Input
                                type="text"
                                className="form-control"
                                id="BloodGlucose"
                                lable={t("Blood Glucose")}
                                placeholderLabel={"mmol/L"}
                                placeholder=" "
                                required={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                                name="BloodGlucose"
                                value={values?.BloodGlucose}
                                onChange={handleSlashInputChange}
                            />
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
                                searchable={true}
                                removeIsClearable={true}
                                dynamicOptions={[
                                    // { value: "0", label: "ALL" },
                                    ...handleReactSelectDropDownOptions(
                                        bloodBank,
                                        "bloodgroup",
                                        "id"
                                    ),
                                ]}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                                handleChange={handleSelect}
                                value={`${values?.bloodGroup?.value}`}
                                name={"bloodGroup"}
                            />
                            {/* <ReactSelect
                dynamicOptions={doctorDepartment?.map((ele) => {
                  return {
                    value: ele?.DepartmentID,
                    label: ele?.DepartmentName,
                  };
                })}
                name={"Blood Group"}
                value={values?.DepartmentID}
                handleChange={handleSelect}
                placeholderName={"Blood Group"}
                id={"Select"}
                respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
                // value={pageList}
              /> */}
                            <ReactSelect
                                dynamicOptions={doctorDepartment?.map((ele) => {
                                    return {
                                        value: ele?.DepartmentID,
                                        label: ele?.DepartmentName,
                                    };
                                })}
                                name={"DoctorDepartment"}
                                value={values?.DoctorDepartment?.value}
                                handleChange={handleSelect}
                                placeholderName={"DoctorDepartment"}
                                id={"DoctorDepartment"}
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
                            // value={pageList}
                            />
                            {/* <Input
                type="text"
                className="form-control"
                id="PainScore"
                lable={t("Pain Score")}
                placeholder=" "
                required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name="painScore"
                value={values.painScore}
                onChange={handleDecimalInputChange}
              /> */}

                            {/* <div className="position-relative d-flex col-xl-2 col-md-4 col-sm-4 col-12">
                <AutoComplete
                  ref={autoCompletePSRef}
                  value={values?.painScore}
                  suggestions={
                    filteredData?.length > 0
                      ? filteredData
                      : apiData?.getBindVitalPS?.map((item) => item?.value)
                  }
                  completeMethod={(e) => search(e, "ps")}
                  placeholder={t("Enter Pain Score")}
                  className="w-100"
                  onFocus={() => handleFocus("ps")}
                  onBlur={() => {
                    setTimeout(() => {
                      autoCompletePSRef.current?.hide();
                    }, 150);
                  }}
                  name="painScore"
                  onChange={(e) => setFieldValue("painScore", e.value)}
                  onSelect={(e) => handleSelectBox("ps", e)}
                  itemTemplate={itemTemplate}
                />
                {values.painScore && (
                  <label
                    className="label lable truncate ml-3 p-1"
                    style={{ fontSize: "5px !important" }}
                  >
                    {t("Pain score")}
                  </label>
                )}
                <span className="text-muted fw-semibold input-box">
                  {t("/10")}
                </span>
              </div> */}
                            {/* <Input
                type="text"
                className="form-control"
                id="Hr"
                lable={t("HR ")}
                placeholderLabel={""}
                placeholder=""
                required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name="Hr"
                value={values?.Hr}
                onChange={handleDecimalInputChange}
              />
              <Input
                type="text"
                className="form-control"
                id="Rr"
                lable={t("RR")}
                placeholderLabel={""}
                placeholder=" "
                required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name="Rr"
                value={values?.Rr}
                onChange={handleDecimalInputChange}
              />
              <Input
                type="text"
                className="form-control"
                id="Bsa"
                lable={t("BSA")}
                placeholder=" "
                required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name="Bsa"
                value={values?.Bsa}
                onChange={handleDecimalInputChange}
              />
              <Input
                type="text"
                className="form-control"
                id="FBS"
                lable={t("FBS/RBS")}
                placeholder=" "
                required={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                name="FBS"
                value={values?.FBS}
                onChange={handleSlashInputChange}
              /> */}
                            <Input
                                type="text"
                                className="form-control"
                                id="Remarks"
                                lable={t("Remarks")}
                                placeholder=" "
                                required={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                                name="remark"
                                value={values?.remark}
                                onChange={handleChange}
                            />

                            {/* <ReactSelect
                                dynamicOptions={doctorDepartment?.map((ele) => {
                                    return {
                                        value: ele?.DepartmentID,
                                        label: ele?.DepartmentName,
                                    };
                                })}
                                name={"departmentName"}
                                value={values?.DepartmentID}
                                handleChange={handleSelect}
                                placeholderName={"Doctor Department"}
                                id={"Select"}
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
                            // value={pageList}
                            /> */}

                            {/* <Input
                  type="checkbox"
                  placeholder=" "
                  className="mt-2"
                  onChange={handlePregnant}
                  checked={isPregnancy}
                  respclass="col-md-1 col-1 "
                  /> */}

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
                            {/* <div>
  <Checkbox
                      id="is_pregnancy"
                      className="mt-2"
                      onChange={(e) =>
                        setFieldValue("IsPregnancy", e.target.checked ? 1 : 0)
                      }
                      checked={Boolean(values.IsPregnancy)}
                    />
</div> */}
                            <MultiSelectComp
                                respclass="col-xl-2 col-md-3 col-sm-6 col-12"
                                name="DangerSign"
                                id="DangerSign"
                                placeholderName={t("Danger Sign")}
                                dynamicOptions={[
                                    { name: "Unable to drink or Breastfeed", value: "Breastfeed" },
                                    { name: "Vomits everything", value: "Vomits" },
                                    { name: "Had Convulsions in this illness", value: "Convulsions" },
                                    { name: "Is lethargic or Unconscious", value: "lethargic" },
                                    { name: "Is convulsing now", value: "convulsing" },
                                ]}
                                handleChange={handleMultiSelectChange}
                                value={values?.DangerSign}
                                isRemoveTemplate={true}
                            />
                            <ReactSelect
                                dynamicOptions={doctorDept?.map((ele) => {
                                    return {
                                        value: ele?.DoctorID,
                                        label: ele?.Name,
                                    };
                                })}
                                name={"doctorDept"}
                                value={values?.doctorDept?.value}
                                handleChange={handleSelect}
                                placeholderName={"Doctor Name"}
                                id={"doctorDept"}
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
                            // value={pageList}
                            />
                            <ReactSelect
                                dynamicOptions={[
                                    { value: "0", label: t("Select") },
                                    { value: "2", label: t("Emergent") },
                                    { value: "3", label: t("Urgent") },
                                    { value: "5", label: t("Non Urgent") },

                                ]}
                                name={"TriagingCodes"}
                                value={values?.TriagingCodes?.value}
                                handleChange={handleSelect}
                                placeholderName={"Triaging Codes"}
                                id={"TriagingCodes"}
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
                            // value={pageList}
                            />
                            <ReactSelect
                                dynamicOptions={[
                                    { value: "1", label: t("Yes") },
                                    { value: "0", label: t("No") },


                                ]}
                                name={"Alcohol"}
                                value={values?.Alcohol?.value}
                                handleChange={handleSelect}
                                placeholderName={"Alcohol"}
                                id={"Alcohol"}
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
                            // value={pageList}
                            />
                            <ReactSelect
                                dynamicOptions={[
                                    { value: "1", label: t("Yes") },
                                    { value: "0", label: t("No") },


                                ]}
                                name={"Smoking"}
                                value={values?.Smoking?.value}
                                handleChange={handleSelect}
                                placeholderName={"Smoking"}
                                id={"Smoking"}
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
                            // value={pageList}
                            />

                            {/* {bmi && (
                <div className="col-md-3 d-flex align-items-center justify-content-end">
                  <p style={{ color: "red", fontWeight: "bold", margin: "0" }}>
                    BMI Calculate: {bmi}
                  </p>
                </div>
              )} */}
                        </div>


                        <div className="row m-2">
                            <ReactSelect
                                dynamicOptions={[
                                    { value: "0", label: t("Select") },
                                    { value: "1", label: t("Food Ascsdcsllergy") },
                                    { value: "2", label: t("SUKUMA WIKI") },


                                ]}
                                name={"Type"}
                                value={values?.Type?.value}
                                handleChange={handleSelect}
                                placeholderName={"Type"}
                                id={"Type"}
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
                            // value={pageList}
                            />
                            <Input
                                type="text"
                                className="form-control"
                                id="AllergyRemarks"
                                lable={t("Remarks")}
                                placeholder=" "
                                required={true}
                                respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                                name="AllergyRemarks"
                                value={values?.AllergyRemarks}
                                onChange={handleChange}
                            />
                            <ReactSelect
                                dynamicOptions={[
                                    { value: "0", label: t("Select") },
                                    { value: "143", label: t("asdsa") },
                                    { value: "125", label: t("Cephalospori") },
                                    { value: "138", label: t("COARTEM") },


                                ]}
                                name={"Allergy"}
                                value={values?.Allergy?.value}
                                handleChange={handleSelect}
                                placeholderName={"Allergy"}
                                id={"Allergy"}
                                respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
                            // value={pageList}
                            />
                            <div className="col-xl-1 col-md-4 col-sm-4 col-sm-4 col-12">
                                <button
                                    className="btn btn-sm btn-success w-100"
                                    onClick={btnValue === "Save" ? onSubmit : handleUpdate}
                                    // onClick={btnValue === "Save" ? handleSubmit : handleUpdate}
                                >
                                    {btnValue}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* <div className="card patient_registration_card my-1 mt-2">
          {tableLogic(selectOPDRadio)}
        </div> */}

            <VitalSignTable
                tbody={getBindVitalData}
                handleEditVitalSignValue={handleEditVitalSignValue}
                isPregnant={Boolean(values.IsPregnancy)}
                patientDetail={patientDetail}
            />
        </>
    );
});

export default TriageBookingDetails;
