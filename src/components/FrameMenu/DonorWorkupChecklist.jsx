import React, { useEffect, useState } from 'react'
import Input from '../formComponent/Input';
import Heading from '../UI/Heading';
import { useTranslation } from 'react-i18next';
import { getDonorEvaluationApi, saveOrUpdateDonorEvaluationApi } from '../../networkServices/nursingWardAPI';
import { notify } from '../../utils/ustil2';
import Tables from '../UI/customTable';
const DonorWorkupChecklist = ({ data }) => {
    const { patientID, transactionID } = data;

    const [t] = useTranslation()
    const [formData, setFormData] = useState({
        id: 0,
        patientId: "",
        transactionId: "",
        name: "",
        ipD_No: "",
        age: "",
        sex: "",
        weight: "",
        height: "",
        bmi: "",
        bp: "",

        counseling: "",
        consent: "",
        nutritionist: "",
        history_Taking: "",

        blood_Group: "",
        hiv: "",
        hbv: "",
        hcv: "",

        urea: "",
        creatinine: "",
        k_NA_CA_PO4: "",
        hb: "",
        wbC_PLT_ESR: "",
        fbs: "",
        urinalysis: "",
        lft: "",
        lipid_Profile: "",
        uric_Acid: "",

        kuB_US: false,
        hr24Creat: "",
        clearence: "",

        dtpa: false,
        dtpA_LT: "",
        dtpA_RT: "",

        hla: false,
        hlA_A: "",
        hlA_B: "",
        hlA_DR: "",
        hlA_DQ: "",
        tcell_XMatch: "",

        cT_Angiogram: "",
        cxr: "",
        ecG_ECHO: "",
        echo: "",
        cmV_lgG_lgM_PCR: "",

        proposed_Date: "",
        pre_Op_Workup: "",

        na: "",
        cA1: "",
        pO4: "",
        plT1: "",
        esR1: "",
    })

    const donorWorkupSchema = [
        {
            stage: "Stage 1",
            fields: [
                { key: "counseling", label: t("Counseling"), type: "input" },
                { key: "consent", label: t("Consent"), type: "input" },
                { key: "nutritionist", label: t("Nutritionist"), type: "input" },
                { key: "history_Taking", label: t("History Taking"), type: "input" },
            ],
        },

        {
            stage: "Stage 2",
            fields: [
                { key: "blood_Group", label: t("Blood Group"), type: "input" },
                { key: "hiv", label: t("HIV"), type: "input" },
                { key: "hbv", label: t("HBV"), type: "input" },
                { key: "hcv", label: t("HCV"), type: "input" },
            ],
        },

        {
            stage: "Stage 4",
            fields: [
                { key: "kuB_US", label: t("KUB U/S"), type: "checkbox" },
                { key: "hr24Creat", label: t("24-Hr Creat"), type: "input", dependsOn: "kuB_US" },
                { key: "clearence", label: t("Clearance"), type: "input", dependsOn: "kuB_US" },

                { key: "dtpa", label: t("DTPA"), type: "checkbox" },
                { key: "dtpA_LT", label: t("LT"), type: "input", dependsOn: "dtpa" },
                { key: "dtpA_RT", label: t("RT"), type: "input", dependsOn: "dtpa" },
            ],
        },

        {
            stage: "Stage 5",
            fields: [
                { key: "hla", label: t("HLA"), type: "checkbox" },
                { key: "hlA_A", label: "A", type: "input", dependsOn: "hla" },
                { key: "hlA_B", label: "B", type: "input", dependsOn: "hla" },
                { key: "hlA_DR", label: t("DR"), type: "input", dependsOn: "hla" },
                { key: "hlA_DQ", label: t("DQ"), type: "input", dependsOn: "hla" },
                { key: "tcell_XMatch", label: t("XMatch"), type: "input", dependsOn: "hla" },
            ],
        },

        {
            stage: "Stage 6",
            fields: [
                { key: "cT_Angiogram", label: t("CT Angiogram"), type: "input" },
                { key: "cxr", label: t("CXR"), type: "input" },
                { key: "ecG_ECHO", label: t("ECG / ECHO"), type: "input" },
                { key: "echo", label: t("ECHO"), type: "input" },
                { key: "cmV_lgG_lgM_PCR", label: t("CMV IgG IgM / PCR"), type: "input" },
            ],
        },

        {
            stage: "Stage 7",
            fields: [
                { key: "proposed_Date", label: t("Proposed Date"), type: "date" },
                { key: "pre_Op_Workup", label: t("Pre Op Workup"), type: "input" },
            ],
        },
    ];
    const [isSave, setIsSave] = useState(null)
    const THEAD = [
        { name: t("S.No"), width: "1%" },
        { name: t("UHID"), width: "10%" },
        { name: t("created By"), width: "10%" },
        { name: t("Action"), width: "1%" },
    ]
    const [tableData, setTableData] = useState([])
    const handleChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleCheckbox = (key) => {
        setFormData(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };
    const handleSave = async () => {
        const payload = {
            ...formData,
            age: Number(formData?.age),
            bmi: Number(formData?.bmi),
            height: Number(formData?.height),
            weight: Number(formData?.weight),
            patientId: patientID,
            transactionId: transactionID,
        };
        const res = await saveOrUpdateDonorEvaluationApi(payload)
        if (res?.success) {
            notify(res?.message, "success")
            fetchDataList()
        } else {
            notify(res?.message, "error")
        }
    };
    const fetchDataList = async () => {
        const res = await getDonorEvaluationApi(patientID)
        if (res?.success) {
            notify(res?.message, "success")
            setTableData(res?.data)
            setIsSave("true")
        } else {
            notify(res?.message, "error")
            setIsSave("false")
            setTableData([])
        }
    }
    const handleEdit = (row) => {
        debugger
        setFormData(prev => ({
            ...prev,
            ...row,
        }));
        setIsSave(true);
    }
    useEffect(() => {
        fetchDataList()
    }, [])
    return (
        <div className='mt-2 spatient_registration_card'>
            <div className='patient_registration card'>
                <Heading
                    title={t("Donor-Workup Checklist")}
                    isBreadcrumb={false}
                />
                {donorWorkupSchema.map(stage => (
                    <div key={stage.stage} className="stage-box">
                        <Heading
                            title={t(`${stage.stage}`)}
                            isBreadcrumb={false}
                        />
                        <div className="row p-2">
                            {stage.fields.map(field => {

                                if (field.dependsOn && !formData[field.dependsOn]) {
                                    return null;
                                }

                                if (field.type === "checkbox") {
                                    return (
                                        <label key={field.key} className="col-xl-2 col-md-3 col-sm-4 col-12 items-center">
                                            <input
                                                type="checkbox"
                                                checked={!!formData[field.key]}
                                                onChange={() => handleCheckbox(field.key)}
                                            />
                                            {field.label}
                                        </label>
                                    );
                                }

                                return (
                                    <div key={field.key} className="col-xl-2 col-md-3 col-sm-4 col-12">

                                        <Input
                                            type={"text"}
                                            id={field.key}
                                            placeholder=""
                                            lable={field.key}
                                            className="form-control"
                                            value={formData[field.key] || ""}
                                            onChange={e => handleChange(field.key, e.target.value)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
                {isSave !== 'true' ?
                    <div className="footer-dyamic-component">
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={handleSave}
                        >
                            {formData?.id === 0 ? t("Save") : t("Update")}
                        </button>

                        {/* <button className="btn btn-sm btn-primary mx-2" onClick={handlePrint}>
                        {t("Print")}
                    </button> */}
                    </div>
                    : ""}
                {tableData?.length > 0 ?
                    <>
                        <Heading title={t("Donor-Workup Checklist")} />
                        <Tables thead={THEAD} tbody={tableData?.map((item, index) => ({
                            SNO: index + 1,
                            PatientID: item?.patientId,
                            createdBy: item?.createdBy,
                            Edit: <i className="fa fa-edit" aria-hidden="true" onClick={() => { handleEdit(item) }}></i>
                        }))}
                        />
                    </>
                    : ""
                }
            </div>

        </div>
    )
}

export default DonorWorkupChecklist;