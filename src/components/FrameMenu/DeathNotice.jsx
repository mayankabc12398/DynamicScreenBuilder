import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Input from "../formComponent/Input";
import Heading from "../UI/Heading";
import DatePicker from "../formComponent/DatePicker";
import TimePicker from "../formComponent/TimePicker";
import { BindDetailsDeathNotice, SaveDeathNotice } from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";
import Tables from "../UI/customTable";

function DeathNotice({ data }) {
    const { t } = useTranslation();
    const { VITE_DATE_FORMAT } = import.meta.env;

    const initialValues = {
        transactionID: "",
        patientID: "",
        id: "",
        dateOfDeath: "",
        timeOfDeath: "",
        diagnosis: "",
        police: "",
        idCardNo: "",
        nextOfKin: "",
        nextOfKinIdCardNo: "",
        relationship: "",
        telephoneNo: "",
        witness1: "",
        witness2: "",
        witness3: "",
        witness4: "",
        witness5: "",
        witness6: "",
        witness7: "",
        certifiedByName: "",
        signature: "",
        dateSignature: ""
    };

    const [values, setValues] = useState(initialValues);
    const [state, setstate] = useState([]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
    };
    const THEAD = [{ name: t("S.no"), width: "3%" },
    { name: t("Transaction No") },
    { name: t("Patient ID") },
    { name: t("Action"), width: "5%" },]
    const bindDetailsDeathNotice = async () => {
        try {
            const response = await BindDetailsDeathNotice(data?.transactionID)
            if (response.success) {
                setstate(response?.data)
            }
        } catch (error) {
            notify(error?.message, "error")
        }
    }

    const handleEdit = async (values) => {
        debugger
        setValues({ ...values, id: values?.ID, dateOfDeath: new Date(values?.dateOfDeath), timeOfDeath: new Date(values?.timeOfDeath), dateSignature: new Date(values?.dateSignature), signature: values?.Signature, certifiedByName: values?.Certifiedbyname })
    }

    const handleSave = async () => {
        if (!values?.dateOfDeath) return notify(t("Date of Death field is required"), "error");
        if (!values?.timeOfDeath) return notify(t("Time of Death field is required"), "error");

        const { UpdatedBy, UpdatedDateTime, ...cleanData } = values;

        const payload = {
            ...cleanData,
            transactionID: data?.transactionID || "",
            patientID: data?.patientID || "",

        };
        if (values?.id) {
            debugger
            try {
                const response = await SaveDeathNotice(payload);
                if (response?.success) {
                    notify(response.message, "success");
                    setValues({ ...initialValues })
                    bindDetailsDeathNotice()
                } else {
                    notify(response?.message || "Save failed", "error");
                }
            } catch (error) {
                notify(t("Something went wrong"), "error");
            }

        } else {
            try {
                const response = await SaveDeathNotice(payload);
                if (response?.success) {
                    notify(response.message, "success");
                    setValues({ ...initialValues })
                    bindDetailsDeathNotice()
                } else {
                    notify(response?.message || "Save failed", "error");
                }
            } catch (error) {
                notify(t("Something went wrong"), "error");
            }
        }

    };
    useEffect(() => {
        bindDetailsDeathNotice()
    }, [])

    return (
        <>
            <form className="card patient_registration border mt-1">
                <Heading title={t("Death Notice")} isBreadcrumb={false} />

                <div className="row p-2">
                    <DatePicker
                        className="custom-calendar required-fields"
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        name="dateOfDeath"
                        lable={t("Date of Death")}
                        placeholder={VITE_DATE_FORMAT}
                        value={values?.dateOfDeath}
                        handleChange={handleChange}
                    />

                    <TimePicker
                        placeholderName={t("Time")}
                        name="timeOfDeath"
                        value={values?.timeOfDeath}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        handleChange={handleChange}
                        className={"required-fields"}
                    />

                    <Input
                        type="text"
                        className="form-control"
                        placeholder={""}
                        name="diagnosis"
                        id="diagnosis"
                        lable={t("Diagnosis")}
                        value={values?.diagnosis}
                        onChange={handleChange}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                </div>

                <Heading title={t("Personal informed")} isBreadcrumb={false} />

                <div className="row p-2">
                    <Input
                        type="text"
                        className="form-control"
                        placeholder={""}
                        name="police"
                        id="police"
                        lable={t("Police")}
                        value={values?.police}
                        onChange={handleChange}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />

                    <Input
                        type="text"
                        className="form-control"
                        placeholder={""}
                        name="idCardNo"
                        id="idCardNo"
                        lable={t("ID Card No")}
                        value={values?.idCardNo}
                        onChange={handleChange}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />

                    <Input
                        type="text"
                        className="form-control"
                        placeholder={""}
                        name="nextOfKin"
                        id="nextOfKin"
                        lable={t("Next of Kin")}
                        value={values?.nextOfKin}
                        onChange={handleChange}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />

                    <Input
                        type="text"
                        className="form-control"
                        placeholder={""}
                        name="relationship"
                        id="relationship"
                        lable={t("Relationship")}
                        value={values?.relationship}
                        onChange={handleChange}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />

                    <Input
                        type="text"
                        className="form-control"
                        placeholder={""}
                        name="telephoneNo"
                        id="telephoneNo"
                        lable={t("Telephone No")}
                        value={values?.telephoneNo}
                        onChange={handleChange}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                </div>

                <Heading title={t("Witness")} isBreadcrumb={false} />

                <div className="row p-2">
                    {["1", "2", "3", "4", "5", "6", "7"].map((no) => (
                        <Input
                            key={no}
                            type="text"
                            className="form-control"
                            placeholder={""}
                            name={`witness${no}`}
                            id={`witness${no}`}
                            lable={t(`Witness ${no}`)}
                            value={values[`witness${no}`]}
                            onChange={handleChange}
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        />
                    ))}

                    <Input
                        type="text"
                        className="form-control"
                        placeholder={""}
                        name="certifiedByName"
                        id="certifiedByName"
                        lable={t("Certified / Notified by Name")}
                        value={values?.certifiedByName}
                        onChange={handleChange}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />

                    <Input
                        type="text"
                        className="form-control"
                        placeholder={""}
                        name="signature"
                        id="signature"
                        lable={t("Signature")}
                        value={values?.signature}
                        onChange={handleChange}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />

                    <DatePicker
                        className="custom-calendar"
                        name="dateSignature"
                        id="dateSignature"
                        lable={t("Date")}
                        placeholder={VITE_DATE_FORMAT}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        value={values?.dateSignature}
                        handleChange={handleChange}
                    />
                </div>

                <div className="text-right mb-3">
                    <button
                        type="button"
                        className="btn btn-info px-4"
                        onClick={handleSave}
                    >
                        {values?.id ? t("Update") : t("Save")}
                    </button>
                </div>
            </form>
            {state?.length > 0 ? (
                <Tables
                    thead={THEAD}
                    tbody={state.map((val, index) => ({
                        Sno: index + 1,
                        transactionID: val?.transactionID,
                        patientID: val?.patientID,
                        Edit: (
                            <i
                                className="fa fa-edit p-1"
                                onClick={() => handleEdit(val)}
                                style={{ cursor: "pointer" }}
                            />
                        ),
                    }))}
                />
            ) : (
                <div className="text-center text-muted py-3">{t("No Data Found")}</div>
            )}
        </>



    );
}

export default DeathNotice;
