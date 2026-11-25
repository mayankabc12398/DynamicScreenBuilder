import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import Heading from '../../UI/Heading';
import DatePicker from '../../formComponent/DatePicker';
import Input from '../../formComponent/Input';
import LabeledInput from '../../formComponent/LabeledInput';
import TextAreaInput from '../../formComponent/TextAreaInput';
import ReactSelect from '../../formComponent/ReactSelect';
import moment from 'moment';
import { saveOrUpdateReferralApi, getReferralListApi } from '../../../networkServices/Emergency';
import { notify } from '../../../utils/ustil2';
import Tables from '../../UI/customTable';

const RefferalLetter = ({ data }) => {
    const [t] = useTranslation();
    console.log(data);

    const { PatientID, transactionID, Name, Doctor } = data;
    const [values, setValues] = useState({
        Date: new Date(),
        id: 0,
        patientId: "",
        transactionId: "",
        refMsg: "",
        nameOfHosRefTo: "",
        refferalConsultant: "",
        resionOfRefferal: "",
        refferingConsultent: "",
        referralTo: "",
        clinicalFindings: "",
        investigation: "",
        provisionalDiagnosis: "",
        treatment: "",
        referFor: "",
        source: "",
        sourceOC: "",
        referingDoctor: Doctor,
        designation: ""
    })
    const { VITE_DATE_FORMAT } = import.meta.env;
    const sourceOption = [
        { label: t("Refered from"), value: "Referedfrom" },
        { label: t("Refered To"), value: "ReferedTo" }
    ]
    const sourceOCOption = [
        { label: t("Other Health facility"), value: "Other Health facility" },
        { label: t("Community unit"), value: "Community unit" }
    ]
    const THEAD = [
        { name: t("S.No"), width: "1%" },
        { name: t("patientId"), width: "1%" },
        { name: t("enterBy"), width: "1%" },
        { name: t("enterDate"), width: "1%" },
        { name: t("Action"), width: "1%" },

    ]
    const [tableData, setTableData] = useState([]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((val) => ({ ...val, [name]: value }));
    };
    const fetchList = async () => {
        const res = await getReferralListApi(PatientID, transactionID);
        if (res?.success) {
            setTableData(res?.data)
        } else {
            setTableData([])
            notify(res?.message, "error")
        }
    }
    useEffect(() => {
        fetchList()
    }, [])
    const handleReactSelectChange = (name, val) => {
        setValues((prev) => ({
            ...prev,
            [name]: val,
        }));
    }
    const handleSave = async () => {
        const payload = {
            id: values.id || 0,
            patientId: values.patientId || PatientID,   // from props
            transactionId: values.transactionId || transactionID,
            refMsg: values.clinicalFindings || "",
            nameOfHosRefTo: values.nameOfHosRefTo || "",
            refferalConsultant: values.refferalConsultant || "",
            resionOfRefferal: values.resionOfRefferal || "",
            refferingConsultent: values.refferingConsultent || "",
            referralTo: values.referralTo || "",
            clinicalFindings: values.clinicalFindings || "",
            investigation: values.investigation || "",
            provisionalDiagnosis: values.provisionalDiagnosis || "",
            treatment: values.treatment || "",
            referFor: values.referFor || "",
            source: values.source || "",
            sourceOC: values.sourceOC?.value ?? values.sourceOC ?? "",
            referingDoctor: values.referingDoctor || Doctor,
            designation: values.designation || "",
            date: values.Date ? moment(values?.Date).format("DD-MM-YYYY") : ""
        };
        const res = await saveOrUpdateReferralApi(payload)
        if (res?.success) {
            notify(res?.message, "success")
            fetchList()
        } else {
            notify(res?.message, "error")
        }

    }

    const handleEdit = (row) => {
        setValues(prev => ({
            ...prev,
            ...row
        }))
    }


    return (
        <div className='mt-2 spatient_registration_card'>
            <div className="patient_registration card">
                <Heading
                    title={t("Refferal Letter")}
                    isBreadcrumb={false}
                />
                <div className='row p-2'>
                    <Input
                        type="text"
                        className="form-control required-fields"
                        id="referralTo"
                        name="referralTo"
                        value={values?.referralTo}
                        onChange={handleChange}
                        lable={t("referral To")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />
                    <DatePicker
                        className={`custom-calendar `}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        id="Date"
                        name="Date"
                        // inputClassName={"required-fields"}
                        value={values?.Date ? values?.Date : new Date()}
                        handleChange={handleChange}
                        lable={t("Date")}
                        disable={true}
                        placeholder={VITE_DATE_FORMAT}
                    />

                    <div className="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12">
                        <LabeledInput
                            label={t("Patient Name")}
                            value={Name}
                        />
                    </div>
                    <div className="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12">
                        <LabeledInput
                            label={t("TKH IP/OP No")}
                            value={PatientID}
                        />
                    </div>


                    <TextAreaInput
                        type="text"
                        className="form-textarea"
                        id="clinicalFindings"
                        name="clinicalFindings"
                        value={values.clinicalFindings || ""}
                        onChange={handleChange}
                        lable={t("Brief History And Clinical Findings")}
                        placeholder=""
                        respclass="col-xl-4 col-md-3 col-sm-4 col-12"
                    />
                    <TextAreaInput
                        type="text"
                        className="form-textarea"
                        id="investigation"
                        name="investigation"
                        value={values.investigation || ""}
                        onChange={handleChange}
                        lable={t("investigation")}
                        placeholder=""
                        respclass="col-xl-4 col-md-3 col-sm-4 col-12"
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="provisionalDiagnosis"
                        name="provisionalDiagnosis"
                        value={values?.provisionalDiagnosis}
                        onChange={handleChange}
                        lable={t("provisional Diagnosis")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="treatment"
                        name="treatment"
                        value={values?.treatment}
                        onChange={handleChange}
                        lable={t("treatment")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="referFor"
                        name="referFor"
                        value={values?.referFor}
                        onChange={handleChange}
                        lable={t("referFor")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />
                    {sourceOption.map((item) => (
                        <label key={item.value} style={{ marginRight: "15px" }}>
                            <input
                                type="radio"
                                name="source"
                                value={item.value}
                                checked={values.source === item.value}
                                onChange={(e) =>
                                    handleChange({
                                        target: { name: "source", value: e.target.value }
                                    })
                                }
                            />
                            {item.label}
                        </label>
                    ))}
                    {/* <ReactSelect
                        placeholderName={t("Before Touching")}
                        name="source"
                        value={values?.source ? values?.source : "0"}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={sourceOption}
                        id="source"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    /> */}
                    {console.log(values)}

                    <ReactSelect
                        placeholderName={t("source OC")}
                        name="sourceOC"
                        value={values?.sourceOC ? values?.sourceOC : "0"}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={sourceOCOption}
                        id="sourceOC"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="nameOfHosRefTo"
                        name="nameOfHosRefTo"
                        value={values?.nameOfHosRefTo}
                        onChange={handleChange}
                        lable={t("nameOfHosRefTo")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="refferalConsultant"
                        name="refferalConsultant"
                        value={values?.refferalConsultant}
                        onChange={handleChange}
                        lable={t("refferalConsultant")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="resionOfRefferal"
                        name="resionOfRefferal"
                        value={values?.resionOfRefferal}
                        onChange={handleChange}
                        lable={t("resionOfRefferal")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="refferingConsultent"
                        name="refferingConsultent"
                        value={values?.refferingConsultent}
                        onChange={handleChange}
                        lable={t("refferingConsultent")}
                        respclass="col-sm-6  col-md-2 col-12"
                        placeholder=""
                    />

                    <div className="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12">
                        <LabeledInput
                            label={t("referingDoctor")}
                            value={values?.referingDoctor}
                        />
                    </div>
                </div>
                <div className='p-2'>

                    <button
                        className="btn btn-primary"
                        type='button'
                        style={{ float: "right" }}
                        onClick={handleSave}
                    >
                        {values?.id ? t("Update") : t("Save")}
                    </button>
                </div>
                {tableData?.length > 0 ?
                    <>
                        <Heading title={t("Refferal List")} />
                        <Tables
                            thead={THEAD}
                            tbody={tableData?.map((item, index) => ({
                                SNo: index + 1,
                                patientID: item?.patientId,
                                enterBy: item?.enterBy,
                                enterDate: item?.enterDate,
                                action: <i className="fa fa-edit" aria-hidden="true" onClick={() => { handleEdit(item) }}></i>
                            }))}
                        />
                    </>
                    : ""}
            </div>
        </div >
    )
}

export default RefferalLetter;