import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Input from "../formComponent/Input";
import TextAreaInput from "../formComponent/TextAreaInput";
import Heading from "../UI/Heading";
import { bindGridDetail, GetEditFamilyConference, saveFamilyConference, UpdateFamilyConference } from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";
import Tables from "../UI/customTable";

function FamilyConferenceForm({ data }) {
    const { t } = useTranslation();

    const initialValues = {
        id: "",
        patientID: "",
        transactionID: "",
        reasonFamilyConference: "",
        outcomeConference: "",
        wayForward: "",
        createdBy: "",
        createdDate: "",
        updatedBy: "",
        updatedDate: "",
        hospitalStaff: [
            {
                sNo: "",
                refId: 0,
                hospitalstaffName: "",
                department: ""
            }
        ],
        familyMembers: [
            {
                sNo: "",
                refId: 0,
                familyMembersName: "",
                relationship: ""
            }
        ]
    };

    const [values, setValues] = useState(initialValues);
    const [state, setState] = useState([]);
    const { familyMembers, hospitalStaff } = values;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleFamilyChange = (index, field, value) => {
        const updated = [...familyMembers];
        updated[index][field] = value;
        setValues((prev) => ({ ...prev, familyMembers: updated }));
    };

    const handleStaffChange = (index, field, value) => {
        const updated = [...hospitalStaff];
        updated[index][field] = value;
        setValues((prev) => ({ ...prev, hospitalStaff: updated }));
    };

    const fetchTableData = async () => {
        try {
            const res = await bindGridDetail(data?.patientID)
            if (res.success) {
                setState(res.data)
            }
        } catch (error) {
            notify(error.message, "error")
        }
    }
    const handleEdit = async (id) => {
        try {
            const res = await GetEditFamilyConference(id)
            debugger
            if (res?.success) {
                const data = res?.data?.response?.formData;

                setValues({
                    id: data?.id || "",
                    patientID: data?.patientID || "",
                    transactionID: data?.transactionID || "",
                    reasonFamilyConference: data?.reasonFamilyConference || "",
                    outcomeConference: data?.outcomeConference || "",
                    wayForward: data?.wayForward || "",
                    createdBy: data?.createdBy || "",
                    createdDate: data?.createdDate || "",
                    updatedBy: data?.updatedBy || "",
                    updatedDate: data?.updatedDate || "",

                    hospitalStaff: data?.hospitalStaff?.length
                        ? data.hospitalStaff
                        : [
                            {
                                sNo: "",
                                refId: 0,
                                hospitalstaffName: "",
                                department: ""
                            }
                        ],

                    familyMembers: data?.familyMembers?.length
                        ? data.familyMembers
                        : [
                            {
                                sNo: "",
                                refId: 0,
                                familyMembersName: "",
                                relationship: ""
                            }
                        ]
                });
            }

        } catch (error) {
            notify(error.message, "error")
        }
    }


    const handleSave = async () => {
        const {
            createdBy,
            createdDate,
            updatedBy,
            updatedDate,
            ...cleancode
        } = values
        const payload = {
            ...cleancode,
            Id:values?.id,
            transactionID: data?.transactionID,
            patientID: data?.patientID,
            hospitalStaff: values.hospitalStaff.map((item, index) => ({
                sNo: index + 1,
                refId: item.refId || 0,
                hospitalstaffName: item.hospitalstaffName,
                department: item.department
            })),
            familyMembers: values.familyMembers.map((item, index) => ({
                sNo: index + 1,
                refId: item.refId || 0,
                familyMembersName: item.familyMembersName,
                relationship: item.relationship
            }))
        };

        if (values?.id) {
            try {
                const res = await UpdateFamilyConference(payload)
                debugger
                if (res.success) {
                    fetchTableData()
                    setValues({...initialValues})
                    notify(res.message,"success")
                }
            } catch (error) {
                notify(error.message, "error")
            }
        } else {
            try {
                const res = await saveFamilyConference(payload)
                if (res.success) {
                    fetchTableData()
                    setValues({...initialValues})
                    notify(res.message, "success")
                }
            } catch (error) {
                notify(error.message, "error")
            }
        }

    }

    useEffect(() => {
        fetchTableData()
    }, [])
    const THEAD = [{ name: t("S.no"), width: "3%" },
    { name: t("Patient Name") },
    { name: t("Patient ID") },
    { name: t("CreatedBy") },
    { name: t("CreatedDate") },
    { name: t("Action"), width: "5%" },]
    return (
        <>

            <form className="card patient_registration border mt-1">
                <Heading title={t("Family Conference Form")} isBreadcrumb={false} />

                {/* FAMILY MEMBERS */}
                <div className="p-2">
                    <Heading title={t("Family Members")} isBreadcrumb={false} />

                    {familyMembers.map((item, index) => (
                        <div className="row align-items-end mt-2" key={index}>
                            <Input
                                type="text"
                                placeholder={""}
                                lable={t("Name")}
                                className="form-control"
                                name="familyMembersName"
                                id="familyMembersName"
                                value={item.familyMembersName}
                                onChange={(e) =>
                                    handleFamilyChange(index, "familyMembersName", e.target.value)
                                }
                                respclass="col-xl-4 col-md-4 col-sm-6 col-12"
                            />

                            <Input
                                type="text"
                                placeholder={""}
                                lable={t("Relationship")}
                                name="relationship"
                                id="relationship"
                                className="form-control"
                                value={item.relationship}
                                onChange={(e) =>
                                    handleFamilyChange(index, "relationship", e.target.value)
                                }
                                respclass="col-xl-4 col-md-4 col-sm-6 col-12"
                            />

                            <div className="col-xl-4 col-md-4 col-sm-12 col-12 mb-2">
                                <button
                                    type="button"
                                    className="btn btn-info btn-sm mx-1 "
                                    onClick={() =>
                                        setValues((prev) => ({
                                            ...prev,
                                            familyMembers: [
                                                ...prev.familyMembers,
                                                {
                                                    sNo: "",
                                                    refId: 0,
                                                    familyMembersName: "",
                                                    relationship: ""
                                                }
                                            ]
                                        }))
                                    }
                                >
                                    {<i className="fa fa-plus "></i>}
                                </button>

                                {familyMembers.length > 1 && (
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm mx-1"
                                        onClick={() =>
                                            setValues((prev) => ({
                                                ...prev,
                                                familyMembers: prev.familyMembers.filter((_, i) => i !== index)
                                            }))
                                        }
                                    >
                                        {<i className="fa fa-trash "></i>}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* HOSPITAL STAFF */}
                <div className="p-2">
                    <Heading title={t("Hospital Staff")} isBreadcrumb={false} />

                    {hospitalStaff.map((item, index) => (
                        <div className="row align-items-end mt-2" key={index}>
                            <Input
                                type="text"
                                placeholder={""}
                                lable={t("Name")}
                                className="form-control"
                                name="hospitalstaffName"
                                id="hospitalstaffName"
                                value={item.hospitalstaffName}
                                onChange={(e) =>
                                    handleStaffChange(index, "hospitalstaffName", e.target.value)
                                }
                                respclass="col-xl-4 col-md-4 col-sm-6 col-12"
                            />

                            <Input
                                type="text"
                                placeholder={""}
                                lable={t("Department")}
                                className="form-control"
                                name="department"
                                id="department"
                                value={item.department}
                                onChange={(e) =>
                                    handleStaffChange(index, "department", e.target.value)
                                }
                                respclass="col-xl-4 col-md-4 col-sm-6 col-12"
                            />

                            <div className="col-xl-4 col-md-4 col-sm-12 col-12 mb-2">
                                <button
                                    type="button"
                                    className="btn btn-info btn-sm me-2 mx-2"
                                    onClick={() =>
                                        setValues((prev) => ({
                                            ...prev,
                                            hospitalStaff: [
                                                ...prev.hospitalStaff,
                                                {
                                                    sNo: "",
                                                    refId: 0,
                                                    hospitalstaffName: "",
                                                    department: ""
                                                }
                                            ]
                                        }))
                                    }
                                >
                                    {<i className="fa fa-plus "></i>}
                                </button>

                                {hospitalStaff.length > 1 && (
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm mx-2"
                                        onClick={() =>
                                            setValues((prev) => ({
                                                ...prev,
                                                hospitalStaff: prev.hospitalStaff.filter((_, i) => i !== index)
                                            }))
                                        }
                                    >
                                        {<i className="fa fa-trash "></i>}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* TEXT AREAS */}
                <div className="p-2">
                    <TextAreaInput
                        respclass="col-xl-8 col-md-12 col-sm-12 col-12"
                        placeholder={""}
                        lable={t("Reasons for Family Conference")}
                        name="reasonFamilyConference"
                        id="reasonFamilyConference"
                        rows={4}
                        value={values.reasonFamilyConference}
                        onChange={handleChange}
                    />

                    <TextAreaInput
                        respclass="col-xl-8 col-md-12 col-sm-12 col-12 mt-3"
                        placeholder={""}
                        lable={t("Outcome of the Conference")}
                        name="outcomeConference"
                        id="outcomeConference"
                        rows={4}
                        value={values.outcomeConference}
                        onChange={handleChange}
                    />

                    <TextAreaInput
                        respclass="col-xl-8 col-md-12 col-sm-12 col-12 mt-3"
                        placeholder={""}
                        lable={t("Way Forward")}
                        name="wayForward"
                        id="wayForward"
                        rows={4}
                        value={values.wayForward}
                        onChange={handleChange}
                    />
                </div>
                <div className="text-right m-2">
                    <button className="btn btn-success btn-sm" type="button" onClick={handleSave}>{values?.id?t("Update"):t("save")}</button>
                </div>
            </form>

            <>
                <Heading title={t("History")} isBreadcrumb={false} />
                <Tables
                    thead={THEAD}
                    tbody={state.map((val, index) => ({
                        Sno: index + 1,
                        PName: val?.PName,
                        PatientID: val?.PatientID,
                        CreatedBy: val?.CreatedBy,
                        CreatedDate: val?.CreatedDate,
                        Edit: (
                            <i
                                className="fa fa-edit p-1"
                                onClick={() => handleEdit(val?.Id)}
                                style={{ cursor: "pointer" }}
                            />
                        ),
                    }))}
                />
            </>
        </>
    );
}

export default FamilyConferenceForm;
