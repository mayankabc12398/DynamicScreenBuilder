import { useState, useTransition } from "react";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import Input from "../../../components/formComponent/Input";
import DatePicker from "../../../components/formComponent/DatePicker";
import { useTranslation } from "react-i18next";
import { IPDDetailGetPatientAdmissionOrder } from "../../../networkServices/BillingsApi";
import Heading from "../../../components/UI/Heading";
import Tables from "../../../components/UI/customTable";
import { notify } from "../../../utils/ustil2";
const AdmissionOrder = ({ setSearchPatient, handleModalClose , sendReset }) => {
    const [t] = useTranslation();
    const initialState = {
        uhid: "",
        firstName: "",
        lastName: "",
        contactNo: "",
        address: "",
        fromDate: new Date(),
        toDate: new Date(),
    }

    const THEAD = [
        { name: t("S.No"), width: "1%" },
        { name: t("UHID") },
        { name: t("Patient Name") },
        { name: t("Age / Sex") },
        { name: t("Address") },
        { name: t("Contact No.") },
        { name: t("Order Date") },
        { name: t("Sugg. Doctor") },
        { name: t("Sugg. Ward") },
        { name: t("Transfer Reason") },
        { name: t("Select") },
    ]

    const [tableData, setTableData] = useState([]);
    const [values, setValues] = useState(initialState);
    const { VITE_DATE_FORMAT } = import.meta.env;
    const [dropDownState, setDropDownState] = useState({

    })
    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
    };


    const handleSearch = async () => {

        const payload = {
            PatientID: values.uhid,
            PatientName: values.firstName,
            ContactNo: values.contactNo,
            FromDate: values.fromDate,
            ToDate: values.toDate,
        }

        const response = await IPDDetailGetPatientAdmissionOrder(payload);
        if (response?.success) {
            setTableData(response?.data);
        } else {
            setTableData([]);
            notify(response?.message, "error");
        }
    }

    const handleSelect = (val) => {
        sendReset();
        setSearchPatient((item) => ({ ...item, value: val?.PatientID, isCallhandleChange: true , patientDetail: val}));
        handleModalClose();
    }
    return (
        <div>
            <div className="row">
                <Input
                    type="text"
                    lable={t("UHID")}
                    name="uhid"
                    className="form-control"
                    id="uhid"
                    placeholder=""
                    value={values.uhid}
                    onChange={handleChange}
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                />
                <Input
                    type="text"
                    lable={t("Patient Name")}
                    name="firstName"
                    className="form-control"
                    id="firstName"
                    placeholder=""
                    value={values.firstName}
                    onChange={handleChange}
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                />
                <Input
                    type="text"
                    lable={t("Contact No.")}
                    name="contactNo"
                    className="form-control"
                    id="contactNo"
                    placeholder=""
                    value={values.contactNo}
                    onChange={handleChange}
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                />
                <DatePicker
                    placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
                    name="fromDate"
                    className="custom-calendar"
                    lable={t("From Date")}
                    value={values.fromDate}
                    handleChange={handleChange}
                    respclass="col-xl-2 col-md-4 col-12"
                />
                <DatePicker
                    placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
                    name="toDate"
                    className="custom-calendar"
                    lable={t("To Date")}
                    value={values.toDate}
                    handleChange={handleChange}
                    respclass="col-xl-2 col-md-4 col-12"
                />
                <button className="btn btn-success" onClick={() => handleSearch()}>
                    {t("Search")}
                </button>
            </div>
            {tableData?.length > 0 && <div>
                <Heading title={t("Result")} isBreadcrumb={false} />
                <Tables thead={THEAD} tbody={tableData?.map((val, index) => ({
                    "S.No": index + 1,
                    "UHID": val?.PatientID,
                    "Patient Name": val?.PName,
                    "Age / Sex": val?.AgeSex,
                    "Address": val?.FullAddress,
                    "Contact No.": val?.Mobile,
                    "Order Date": val?.EntryDate,
                    "Sugg. Doctor": val?.DoctorName,
                    "Sugg Ward": val?.RoomType,
                    "Transfer Reason": val?.OrderDetail,
                    "Select": (
                        <span className="fa fa-check" onClick={() => handleSelect(val)}>
                        </span>
                    )
                }))} />
            </div>}
        </div>
    );
};

export default AdmissionOrder;