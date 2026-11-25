import React, { useEffect, useState } from "react";
import Input from "../formComponent/Input";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import { getDonorEvaluationTransplantApi, saveOrUpdateDonorEvaluationTransplantApi } from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/ustil2";
import Tables from "../UI/customTable";

const labInvestigationSchema = [
    {
        fields: [
            { key: "blood_Group", label: "Blood Group" },
            { key: "hlaTyping", label: "HLA Typing" },
            { key: "fullHaemogram", label: "Full Haemogram" },
            { key: "urinalysis", label: "Urinalysis" },
            { key: "ureaAndElectrolytes", label: "Urea & Electrolytes" },
            { key: "calciumAndPhosphate", label: "Calcium & Phosphate" },
            { key: "tsh", label: "TSH" },
            { key: "bloodSugar", label: "Blood Sugar" },
            { key: "ogtt", label: "OGTT" },
            { key: "liverFunctionTest", label: "LFT" },
            { key: "hBsAG", label: "HBsAg" },
            { key: "hcv", label: "HCV" },
            { key: "hivElisa", label: "HIV (ELISA)" },
            { key: "vdrl", label: "VDRL" },
            { key: "ebv", label: "EBV" },
            { key: "cmv", label: "CMV" },
            { key: "cmvAntibodies", label: "CMV Antibodies" },
            { key: "cxr", label: "CXR" },
            { key: "ecg", label: "ECG" },
            { key: "echo", label: "ECHO" },
            { key: "renalUltrasound", label: "Renal Ultrasound" },
            { key: "dtpaRenal", label: "DTPA Renal" },
            { key: "cag", label: "CAG" },
            { key: "counseling", label: "Counseling" },
            { key: "pdt", label: "PDT" },
        ],
    },
];

const DonorPreEvaluationForTransplantation = ({ data }) => {
    const [t] = useTranslation()
    const { patientID, transactionID } = data;
    const [formData, setFormData] = useState({
        id: 0,
        patientId: "",
        transactionId: "",

        blood_Group: "",
        hlaTyping: "",
        fullHaemogram: "",
        urinalysis: "",
        ureaAndElectrolytes: "",
        calciumAndPhosphate: "",
        tsh: "",
        bloodSugar: "",
        ogtt: "",
        liverFunctionTest: "",
        hBsAG: "",
        hcv: "",
        hivElisa: "",
        cmv: "",
        cxr: "",
        echo: "",
        ecg: "",
        cmvAntibodies: "",
        renalUltrasound: "",
        counseling: "",
        pdt: "",
        cag: "",
        dtpaRenal: "",
        vdrl: "",
        ebv: "",
    });
    const [isSave, setIsSave] = useState(null)
    const THEAD = [
        { name: t("S.No"), width: "1%" },
        { name: t("UHID"), width: "10%" },
        { name: t("created By"), width: "10%" },
        { name: t("Action"), width: "1%" },
    ]
    const [tableData, setTableData] = useState([])
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    const handleSave = async () => {
        const payload = {
            ...formData,
            patientId: patientID,
            transactionId: transactionID,
        };
        const res = await saveOrUpdateDonorEvaluationTransplantApi(payload)
        if (res?.success) {
            notify(res?.message, "success")
            fetchDataList()
        } else {
            notify(res?.message, "error")
        }
    };
    const fetchDataList = async () => {
        const res = await getDonorEvaluationTransplantApi(patientID)
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
        <div className="mt-2 spatient_registration_card">
            <div className="patient_registration card">
                <Heading title={t("Donor Evaluation For Transplantation")} isBreadcrumb={false} />
                {labInvestigationSchema.map((section, index) => (
                    <div key={index}>
                        <div className="row p-2">
                            {section.fields.map((field) => (
                                <div
                                    key={field.key}
                                    className="col-xl-2 col-md-4 col-sm-6 col-12"
                                >
                                    <Input
                                        type="text"
                                        className={"form-control"}
                                        id={field.key}
                                        name={field.key}
                                        lable={field.label}
                                        placeholder=""
                                        value={formData[field.key]}
                                        onChange={handleChange}
                                    />
                                </div>
                            ))}
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
                        <Heading title={t("Donor Evaluation For Transplantation List")} />
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
    );
};

export default DonorPreEvaluationForTransplantation;
