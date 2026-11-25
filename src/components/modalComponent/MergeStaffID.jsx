import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Input from "@app/components/formComponent/Input";
import { CommonAPISearchStaff } from "../../networkServices/opdserviceAPI";
import DatePicker from "../formComponent/DatePicker";
import moment from "moment";
import Tables from "../UI/customTable";
import WrapTranslate from "../WrapTranslate";

export default function MergeStaffID({ handleChangeModel, inputData }) {
    const [t] = useTranslation();
    const { VITE_DATE_FORMAT } = import.meta.env;
    const [bodyData, setBodyData] = useState([]);
    const [inputs, setInputs] = useState({
        UHID: "",
        fromDate: new Date(),
        toDate: new Date(),
        StaffID: "",
        National: "",
        DependantID: "",
        Contact_No: ""
    });
    const handlechange = (e) => {

        setInputs((val) => ({ ...val, [e.target.name]: e.target.value }));
    };
    //   useEffect(() => {
    //     setModalData((preV)=>({
    //         ...preV,
    //         inputs
    //     }));
    //   }, [inputs]);
    useEffect(() => {
        handleChangeModel(inputs)
    }, [inputs])
    const handleSearch = async () => {
        const payload = {
            "staffID": inputs?.StaffID,
            "dependentID": inputs?.DependantID,
            "uhid": inputs?.UHID,
            "mobileNo": inputs?.Contact_No,
            "nationalID": inputs?.National,
            "fromDate": moment(inputs?.fromDate).format("YYYY-MM-DD"),
            "toDate": moment(inputs?.toDate).format("YYYY-MM-DD"),
            "status": 0
        }

        try {
            const response = await CommonAPISearchStaff(payload)
            if (response?.success) {
                setBodyData(response?.data)
            }
            else {
                setBodyData([])
            }

        } catch (error) {
            console.log("error", error)
        }
    }
     const thead = [
        { name: "S.No.", width: "2%" }, { name: "Name" }, { name: "StaffID" }, 
        { name: "House_No", width: "2%" },
        { name: "Mobile", width: "2%" },
        { name: "Email", width: "2%" },
    ]
    return (
        <>
            <div className="row p-2">
                <Input
                    type="text"
                    className={`form-control `}
                    id="StaffID"
                    name="StaffID"
                    value={inputs.StaffID}
                    onChange={handlechange}
                    lable={t("Staff ID")}
                    placeholder=" "
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="National"
                    name="National"
                    value={inputs.National}
                    onChange={handlechange}
                    lable={t("National/Birth ID")}
                    placeholder=" "
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                />

                <Input
                    type="text"
                    className="form-control"
                    id="UHID"
                    name="UHID"
                    value={inputs.UHID}
                    onChange={handlechange}
                    lable={t("UHID")}
                    placeholder=" "
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="Contact_No"
                    name="Contact_No"
                    value={inputs.Contact_No}
                    onChange={handlechange}
                    lable={t("Contact No.")}
                    placeholder=" "
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="DependantID"
                    name="DependantID"
                    value={inputs.DependantID}
                    onChange={handlechange}
                    lable={t("Dependant ID")}
                    placeholder=" "
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                />
                <DatePicker
                    className={`custom-calendar `}
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    id="fromDate"
                    name="fromDate"
                    value={inputs?.fromDate ? inputs?.fromDate : new Date()}
                    maxDate={new Date()}
                    handleChange={(e) => {
                        // Validate date format here as well when it is being changed
                        const dateInput = e.target.value;

                        setInputs((prev) => ({
                            ...prev,
                            fromDate: moment(dateInput).toDate(), // Ensure state updates
                        }));
                    }}
                    lable={t("From Date")}
                    placeholder={VITE_DATE_FORMAT}
                    inputClassName={""}
                />
                <DatePicker
                    className={`custom-calendar `}
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    id="toDate"
                    name="toDate"
                    value={inputs?.toDate ? inputs?.toDate : new Date()}
                    maxDate={new Date()}
                    handleChange={(e) => {
                        // Validate date format here as well when it is being changed
                        const dateInput = e.target.value;

                        setInputs((prev) => ({
                            ...prev,
                            toDate: moment(dateInput).toDate(), // Ensure state updates
                        }));
                    }}
                    lable={t("To Date")}
                    placeholder={VITE_DATE_FORMAT}
                    inputClassName={""}
                />
                <button className="btn" onClick={handleSearch}>
                    {t("Search")}
                </button>
            </div>
              <Tables thead={WrapTranslate(thead, "name")} tbody={bodyData?.map((val, index) => ({
                    SNo: index + 1,
                    PatientName: val?.PatientName,
                    StaffID: val?.StaffID,
                    House_No: val?.House_No,
                    Mobile: val?.Mobile,
                    Email: val?.Email,
                    // Delete: <i className='fa fa-trash text-danger' onClick={() => handleRemove(val?.ID)}></i>
                }))} />
        </>

    );
}
