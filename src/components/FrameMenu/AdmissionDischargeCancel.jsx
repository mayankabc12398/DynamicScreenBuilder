import { useTranslation } from "react-i18next";
import ReactSelect from "../formComponent/ReactSelect";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import React, { useEffect, useState } from "react";
import Tables from "../UI/customTable";
import Modal from "../modalComponent/Modal";
import { notify } from "../../utils/ustil2";
import { LoadDetails } from "../../networkServices/CollectionReportApi";
import Button from "../formComponent/Button";
import {
    AdmitdischargeAdmitDischargeCancelScreenPatient,
    AdmitdischargeBilling_ForAdmitDiscCancel,
    AdmitdischargeBilling_GetPatientForAdmitDiscCancel,
    GetAdmitDischargeAuthorizationStatus
} from "../../networkServices/BillingsApi";

import LabeledInput from "../formComponent/LabeledInput";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { useSelector } from "react-redux";

// Parse "03-Nov-26 02:43 PM" → Date
function parseAdmitDate(str) {
    if (!str) return null;
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
    const m = str.match(/(\d{1,2})-([A-Za-z]{3})-(\d{2,4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) return null;
    const months = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
    let yr = parseInt(m[3]); if (yr < 100) yr += 2000;
    let hr = parseInt(m[4]);
    const min = parseInt(m[5]);
    const ap = (m[6] || '').toUpperCase();
    if (ap === 'PM' && hr !== 12) hr += 12;
    if (ap === 'AM' && hr === 12) hr = 0;
    return new Date(yr, months[m[2].toLowerCase()], parseInt(m[1]), hr, min);
}

const AdmissionDischargeCancel = () => {
    const [t] = useTranslation();
    const { GetGlobalResources } = useSelector((state) => state?.CommonSlice);
    const [SecondModal, setSecondModal] = useState({ isOpen: false });
    const [secModalData, setSecModalData] = useState([]);

    // Added loading state to prevent flashing "Unauthorized" while fetching
    const [isLoading, setIsLoading] = useState(true);
    const [authData, setAuthData] = useState(false);

    const THEAD = [
        { name: t("S.No."), width: "1%" },
        { name: t("IPD No.") },
        { name: t("UHID") },
        { name: t("Patient Name") },
        { name: t("Age/Gender") },
        { name: t("Address") },
        { name: t("DoctorName") },
        { name: t("Room No.") },
        { name: t("Panel Name") },
        { name: t("Select") },
    ];

    const [values, setValues] = useState({
        uhid: "",
        ipdNo: "",
        name: "",
    });

    const [tableData, setTableData] = useState([]);
    const [PatientStatus, setPatientStatus] = useState([]);
    const [selectedData, setSelectedData] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setValues((val) => ({ ...val, [name]: value }));
    };

    const handleSearch = async () => {
        try {
            if (!values?.uhid && !values?.ipdNo && !values?.name) {
                notify(t("Please fill any of the required fields"), "error");
                return;
            }
            if (!values?.uhid && !values?.ipdNo) {
                if (values?.name?.length < 3) {
                    notify(t("Minimum 3 Letter Required"), "warn");
                    return;
                }
            }

            const payload = {
                patientID: values?.uhid,
                ipdNo: values?.ipdNo,
                patientName: values?.name,
            };
            const apiResp = await AdmitdischargeBilling_GetPatientForAdmitDiscCancel(payload);
            if (apiResp?.success) {
                setTableData(apiResp?.data);
                setPatientStatus([]);
            } else {
                setTableData([]);
                setPatientStatus([]);
                notify(t("error"), apiResp?.message);
            }
        } catch (error) {
            notify(t("error"), error?.message);
        }
    };

    const setIsOpenClose = () => {
        setSecondModal((val) => ({ ...val, isOpen: false }));
    };

    const handleInsertSecondModelAPI = async () => { };

    const handleStateInsertAPI = async (data) => {
        // Time-limit check for Patient Admission cancel (step 1).
        if (Number(data?.ID) === 1 || data?.Step === "Patient Admission") {
            const limitRow = Array.isArray(GetGlobalResources)
                ? GetGlobalResources.find(r => r?.Name === "IPDAdmissionCancelTimeLimit")
                : null;
            // Enforce only when the flag exists and IsActive == 1
            if (limitRow && (String(limitRow?.IsActive) === "1")) {
                const limitMinutes = parseInt(limitRow?.Value) > 0 ? parseInt(limitRow?.Value) : 40;
                const admitDate = parseAdmitDate(data?.dDate);
                if (admitDate) {
                    const diffMinutes = (Date.now() - admitDate.getTime()) / 60000;
                    if (diffMinutes > limitMinutes) {
                        notify(
                            `Admission cancellation is only permitted within ${limitMinutes} minute(s) of the admission time. Beyond this period, please follow the standard discharge process.`,
                            "error"
                        );
                        return;
                    }
                }
            }
        }

        setSecondModal({
            label: `Cancel Remarks : ${data?.Step}`,
            width: "30vw",
            isOpen: true,
            Component: (
                <>
                    <Input
                        type="text"
                        className="form-control required-fields"
                        id="CancelRemarks"
                        name="CancelRemarks"
                        onChange={handleInputChange}
                        lable={t("Cancel Remarks")}
                        placeholder=""
                        respclass="col-12"
                    />
                </>
            ),
            handleInsertAPI: handleInsertSecondModelAPI,
            extrabutton: <></>,
        });

        setSecModalData(data);
    };

    const getAuth = async () => {
        try {
            setIsLoading(true);
            const response = await GetAdmitDischargeAuthorizationStatus();
            if (response?.success) {
                // Adjust this condition if response?.data is not strictly true/false
                setAuthData(response?.data === true || response?.data === 1 || response?.data === "true");
            } else {
                notify(t("error"), response?.message);
                setAuthData(false);
            }
        } catch (error) {
            notify(t("error"), error?.message);
            setAuthData(false);
        } finally {
            setIsLoading(false); // Replaced `store.dispatch(setLoading(false))`
        }
    };

    useEffect(() => {
        getAuth();
    }, []);

    const handleSecondInsertAPI = async (modalsdetails) => {
        const ip = useLocalStorage("ip", "get");

        if (!values?.CancelRemarks) {
            notify(t("Please fill Cancel Remarks"), "error");
            return;
        }
        const payload = {
            id: modalsdetails?.ID,
            userName: modalsdetails?.dUser,
            remark: values?.CancelRemarks,
            transactionID: modalsdetails?.TransactionID,
            ipAddress: ip,
            patientID: selectedData?.PatientID,
            RoomID: selectedData?.RoomID,
        };
        const response = await AdmitdischargeBilling_ForAdmitDiscCancel(payload);
        if (response?.success) {
            notify(response?.message, "success");
            handleSelect(selectedData);
            setValues({
                uhid: "",
                ipdNo: "",
                name: "",
                CancelRemarks: ""
            });
            setSecondModal({ isOpen: false });
        } else {
            notify(response?.message, "error");
            setValues((val) => ({ ...val, CancelRemarks: "" }));
        }
        setIsOpenClose();
    };

    const handleSelect = async (item) => {
        setSelectedData(item);
        setTableData([]);
        const transactionID = item?.TransactionID;
        const apiResp = await AdmitdischargeAdmitDischargeCancelScreenPatient(transactionID);
        if (apiResp?.success) {
            setPatientStatus(apiResp?.data);
        } else {
            setPatientStatus([]);
            notify(t("error"), apiResp?.message);
        }
    };

    const LabeledInputData = [
        { label: t("IPD No"), data: selectedData?.IPDNo },
        { label: t("UHID"), data: selectedData?.PatientID },
        { label: t("Patient Name"), data: selectedData?.PName },
        { label: t("Age/Gender"), data: selectedData?.AgeSex },
        { label: t("Mobile"), data: selectedData?.Mobile },
        { label: t("Address"), data: selectedData?.FullAddress },
        { label: t("Room No."), data: selectedData?.CurrentIPDCaseTypeName },
        { label: t("Doctor Name"), data: selectedData?.DoctorName },
        { label: t("Panel Name"), data: selectedData?.PanelName },
    ];


    if (isLoading) {
        return (
            <></>
            // <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
            //     <div className="spinner-border text-primary" role="status">
            //         {/* <span className="visually-hidden">Loading...</span> */}
            //     </div>
            // </div>
        );
    }

    if (!authData) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "75vh" }}>
                <div className="card shadow-lg text-center p-5" style={{ borderRadius: "15px", borderTop: "6px solid #dc3545", maxWidth: "500px" }}>
                    <div className="card-body">
                        <i className="fa fa-lock text-danger mb-4" style={{ fontSize: "5rem" }}></i>
                        <h2 className="text-danger fw-bold mb-3">{t("Access Denied")}</h2>
                        <p className="text-muted fs-5">
                            {t("You are not authorized to view this page. Please contact your administrator if you believe this is a mistake.")}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // MAIN RENDER (AUTHORIZED)
    // ==========================================
    return (
        <div className="card mt-2">
            <Heading title={t("Admission Discharge Cancel")} isBreadcrumb={true} />
            <div className="row p-2">
                <Input
                    type="text"
                    className="form-control required-fields"
                    id="uhid"
                    name="uhid"
                    value={values?.uhid ? values?.uhid : ""}
                    onChange={(e) => handleInputChange(e)}
                    lable={t("UHID")}
                    placeholder=" "
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control required-fields"
                    id="ipdNo"
                    name="ipdNo"
                    value={values?.ipdNo ? values?.ipdNo : ""}
                    onChange={(e) => handleInputChange(e)}
                    lable={t("IPD No")}
                    placeholder=" "
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control required-fields"
                    id="name"
                    name="name"
                    value={values?.name ? values?.name : ""}
                    onChange={(e) => handleInputChange(e)}
                    lable={t("Name")}
                    placeholder=" "
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <button onClick={handleSearch} className="btn btn-success">{t("Search")}</button>
            </div>

            {tableData?.length > 0 && (
                <div>
                    <Heading title={t("Result")} />
                    <Tables
                        thead={THEAD}
                        tbody={tableData?.map((item, index) => ({
                            "S.No.": index + 1,
                            "IPD No.": item?.IPDNo,
                            "UHID": item?.PatientID,
                            "Patient Name": item?.PName,
                            "AgeSex": item?.AgeSex,
                            "Address": item?.FullAddress,
                            "DoctorName": item?.DoctorName,
                            "Room No.": item?.CurrentIPDCaseTypeName,
                            "Panel Name": item?.PanelName,
                            "Select": (
                                <span className="fa fa-check text-success" style={{ cursor: "pointer", fontSize: "1.2rem" }} onClick={() => handleSelect(item)}></span>
                            ),
                        }))}
                        tableHeight={"tableHeight"}
                        scrollView={"scrollView"}
                    />
                </div>
            )}

            {PatientStatus?.length > 0 && (
                <div className="card">
                    <Heading title={t("Admission Discharge Cancel")} />
                    <div className="p-2">
                        <div className="row">
                            {Array.isArray(LabeledInputData) && LabeledInputData?.map((item, index) => (
                                <LabeledInput
                                    key={index}
                                    label={item?.label}
                                    value={item?.data}
                                    className="col-xl-2 col-md-4 col-sm-6 col-12"
                                />
                            ))}
                        </div>
                        <div className="row text-center">
                            {PatientStatus?.map((item, index) => (
                                <React.Fragment key={index}>
                                    <div
                                        className="col-sm-2 m-3 d-flex justify-content-around"
                                        style={{
                                            background: item?.nextPending == 1 ? "" : "rgba(255, 255, 255, 0.5)",
                                            opacity: item?.nextPending == 1 ? 1 : 0.7,
                                            pointerEvents: item?.nextPending == 1 ? "auto" : "none",
                                        }}
                                    >
                                        <div
                                            className={`card position-relative  ${item?.nextPending == 1 && "blink-box"}`}
                                            style={{
                                                border: "2px solid #568203",
                                                textAlign: "center",
                                                width: "150px",
                                                borderRadius: "5px",
                                                cursor: "pointer"
                                            }}
                                            onClick={() => handleStateInsertAPI(item)}
                                        >
                                            <div
                                                className="stepcard"
                                                style={{
                                                    background: item?.nextPending == 1
                                                        ? "linear-gradient(0deg, rgb(187, 53, 4) 10%, rgb(255, 69, 0))"
                                                        : item.dStatus == 1
                                                            ? "linear-gradient(0deg, rgb(10, 90, 46) 10%, rgb(46, 139, 87))"
                                                            : "linear-gradient(0deg, rgb(185, 141, 10) 10%, rgb(255, 191, 0))",
                                                }}
                                            >
                                                <label className="steps">{item?.sequenceNo}</label>
                                            </div>
                                            <div
                                                className="d-flex justify-content-center"
                                                style={{
                                                    paddingTop: "6px",
                                                    paddingBottom: "2px",
                                                    background: item?.nextPending == 1 ? "#ff4500" : item.dStatus == 1 ? "#2e8b57" : "#ffbf00",
                                                    margin: "5px",
                                                    borderRadius: "0px 0px 100px 100px ",
                                                }}
                                            >
                                                {item?.nextPending == 1 ? (
                                                    <svg fill="#000000" width="70px" height="70px" viewBox="-1.5 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        {/* Redacted path for brevity - used your provided SVG path */}
                                                        <path d="m6.53 8.098.14-.012c.053-.006.101-.025.141-.053l-.001.001c.134.462.298.948.503 1.457.263.666.522 1.213.812 1.741l-.04-.08c-.024.364-.053.738-.091 1.1-.018.223-.062.431-.129.627l.005-.018c-.012.005-.029 2.08-.029 2.08.001 1.353.938 2.486 2.198 2.787l.02.004c.057-.145.195-.246.357-.246h.574c.161.002.299.102.356.243l.001.003c1.283-.302 2.224-1.435 2.229-2.789v-.001s-.035-2.066-.053-2.08c-.055-.175-.099-.381-.122-.593l-.001-.015c-.035-.364-.058-.729-.091-1.1.247-.446.506-.992.734-1.555l.038-.106c.205-.509.364-.994.503-1.457.039.028.087.047.139.053h.001l.141.012c.17.018.32-.122.334-.339l.152-1.931c0-.001 0-.002 0-.002 0-.163-.122-.297-.279-.317h-.002-.017c.039-.281.061-.605.061-.934 0-.718-.106-1.412-.303-2.065l.013.051c-.577-1.266-1.721-2.185-3.099-2.442l-.026-.004c-.296-.061-.641-.102-.993-.112h-.009-.012c-.359.007-.704.047-1.038.118l.036-.006c-1.402.264-2.544 1.183-3.114 2.419l-.011.027c-.186.6-.293 1.29-.293 2.004 0 .333.023.661.068.981l-.004-.037c-.159.018-.282.151-.282.313v.007l.152 1.931c.014.222.166.356.33.338z" />
                                                        <path d="m21.416 20.878c-.07-3.04-.374-3.728-.538-4.194-.065-.187-.118-1.451-2.206-2.271-1.28-.504-2.932-.514-4.33-1.105v1.644c-.003 1.768-1.269 3.239-2.944 3.56l-.023.004c-.031.182-.187.318-.374.32h-.018v1.24c0 1.212.982 2.194 2.194 2.194s2.194-.982 2.194-2.194v-.866c-.608-.091-1.069-.609-1.069-1.235 0-.689.559-1.248 1.248-1.248s1.248.559 1.248 1.248c0 .546-.351 1.01-.839 1.18l-.009.003v.918.047c0 1.532-1.242 2.774-2.774 2.774s-2.774-1.242-2.774-2.774c0-.017 0-.033 0-.05v.002-1.251c-.178-.012-.322-.146-.35-.318v-.002c-1.69-.329-2.95-1.795-2.954-3.556v-1.657c-1.404.603-3.066.615-4.353 1.12-2.094.819-2.142 2.08-2.206 2.27-.16.468-.468 1.153-.538 4.195-.012.4 0 1.013 1.206 1.549 2.626 1.03 6.009 1.35 9.344 1.58h.32c3.342-.228 6.72-.547 9.344-1.58 1.201-.533 1.212-1.142 1.201-1.546zm-14.681-1.24h-1.246v1.251h-.89v-1.247h-1.246v-.89h1.246v-1.246h.89v1.246h1.246z" />
                                                        <path d="m16.225 17.965v-.001c0-.372-.301-.673-.673-.673s-.673.301-.673.673.301.673.673.673c.371 0 .672-.301.673-.672z" />
                                                    </svg>
                                                ) : (
                                                    <svg fill="#000000" width="30px" height="30px" viewBox="-1.5 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        {/* Redacted path for brevity - used your provided SVG path */}
                                                        <path d="m6.53 8.098.14-.012c.053-.006.101-.025.141-.053l-.001.001c.134.462.298.948.503 1.457.263.666.522 1.213.812 1.741l-.04-.08c-.024.364-.053.738-.091 1.1-.018.223-.062.431-.129.627l.005-.018c-.012.005-.029 2.08-.029 2.08.001 1.353.938 2.486 2.198 2.787l.02.004c.057-.145.195-.246.357-.246h.574c.161.002.299.102.356.243l.001.003c1.283-.302 2.224-1.435 2.229-2.789v-.001s-.035-2.066-.053-2.08c-.055-.175-.099-.381-.122-.593l-.001-.015c-.035-.364-.058-.729-.091-1.1.247-.446.506-.992.734-1.555l.038-.106c.205-.509.364-.994.503-1.457.039.028.087.047.139.053h.001l.141.012c.17.018.32-.122.334-.339l.152-1.931c0-.001 0-.002 0-.002 0-.163-.122-.297-.279-.317h-.002-.017c.039-.281.061-.605.061-.934 0-.718-.106-1.412-.303-2.065l.013.051c-.577-1.266-1.721-2.185-3.099-2.442l-.026-.004c-.296-.061-.641-.102-.993-.112h-.009-.012c-.359.007-.704.047-1.038.118l.036-.006c-1.402.264-2.544 1.183-3.114 2.419l-.011.027c-.186.6-.293 1.29-.293 2.004 0 .333.023.661.068.981l-.004-.037c-.159.018-.282.151-.282.313v.007l.152 1.931c.014.222.166.356.33.338z" />
                                                        <path d="m21.416 20.878c-.07-3.04-.374-3.728-.538-4.194-.065-.187-.118-1.451-2.206-2.271-1.28-.504-2.932-.514-4.33-1.105v1.644c-.003 1.768-1.269 3.239-2.944 3.56l-.023.004c-.031.182-.187.318-.374.32h-.018v1.24c0 1.212.982 2.194 2.194 2.194s2.194-.982 2.194-2.194v-.866c-.608-.091-1.069-.609-1.069-1.235 0-.689.559-1.248 1.248-1.248s1.248.559 1.248 1.248c0 .546-.351 1.01-.839 1.18l-.009.003v.918.047c0 1.532-1.242 2.774-2.774 2.774s-2.774-1.242-2.774-2.774c0-.017 0-.033 0-.05v.002-1.251c-.178-.012-.322-.146-.35-.318v-.002c-1.69-.329-2.95-1.795-2.954-3.556v-1.657c-1.404.603-3.066.615-4.353 1.12-2.094.819-2.142 2.08-2.206 2.27-.16.468-.468 1.153-.538 4.195-.012.4 0 1.013 1.206 1.549 2.626 1.03 6.009 1.35 9.344 1.58h.32c3.342-.228 6.72-.547 9.344-1.58 1.201-.533 1.212-1.142 1.201-1.546zm-14.681-1.24h-1.246v1.251h-.89v-1.247h-1.246v-.89h1.246v-1.246h.89v1.246h1.246z" />
                                                        <path d="m16.225 17.965v-.001c0-.372-.301-.673-.673-.673s-.673.301-.673.673.301.673.673.673c.371 0 .672-.301.673-.672z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <label
                                                className="statusIcon"
                                                style={{
                                                    background: item?.nextPending == 1
                                                        ? "linear-gradient(0deg, rgb(187, 53, 4) 10%, rgb(255, 69, 0))"
                                                        : item.dStatus == 1
                                                            ? "linear-gradient(0deg, rgb(10, 90, 46) 10%, rgb(46, 139, 87))"
                                                            : "linear-gradient(0deg, rgb(185, 141, 10) 10%, rgb(255, 191, 0))",
                                                }}
                                            >
                                                {t(item?.Step)}
                                            </label>
                                            <div
                                                className="card-body text-center"
                                                style={{
                                                    background: item?.nextPending == 1 ? "#ff4500" : item.dStatus == 1 ? "#2e8b57" : "#ffbf00",
                                                    color: "white",
                                                    padding: "0px",
                                                    margin: "0px",
                                                }}
                                            >
                                                <p className="card-text text-center m-0">{item?.dDate}</p>
                                                <p className="card-text text-center m-0">{item?.BedNo}</p>
                                                <p className="card-text text-center m-0"><label>{item.dUser}</label></p>
                                            </div>
                                        </div>
                                        {index !== PatientStatus.length - 1 && (
                                            <div className="d-flex justify-content-center align-items-center">
                                                <label className="Clearancearrow"></label>
                                            </div>
                                        )}
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {SecondModal?.isOpen && (
                <Modal
                    visible={SecondModal?.isOpen}
                    setVisible={setIsOpenClose}
                    modalWidth={SecondModal?.width}
                    Header={t(SecondModal?.label)}
                    buttonType={"button"}
                    buttonName={t("Save")}
                    buttons={SecondModal?.extrabutton}
                    modalData={secModalData}
                    setSecModalData={setSecModalData}
                    handleAPI={handleSecondInsertAPI}
                >
                    {SecondModal?.Component}
                </Modal>
            )}
        </div>
    );
};

export default AdmissionDischargeCancel;