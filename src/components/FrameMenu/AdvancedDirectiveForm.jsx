import React, { useEffect, useState } from "react";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import Input from "../formComponent/Input";
import ReactSelect from "../formComponent/ReactSelect";
import Tables from "../UI/customTable";
import { saveOrUpdateAdvancedDirectiveApi, getAdvancedDirectiveFullDetailsApi } from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/ustil2";
const AdvanceDirectiveForm = ({ data }) => {
    const { transactionID} = data


    const [t] = useTranslation();
    const initial = {
        transactionID: transactionID,
        physicianName: "",
        telephoneAddress: "",
        subSpeciality: "",
        doctor2: "",
        doctor3: "",
        nurse1: "",
        nurse2: "",

        mechanicalVentilation: 0,
        vasopressorSupport: 0,
        dialysis: 0,
        antibiotics: 0,
        chemotherapyRadiotherapy: 0,
        transfusion: 0,
        specificMedications: 0,
        labTests: 0,
        name1: "",
        relationToPatient1: "",
        idPassport1: "",
        telephone1: "",

        name2: "",
        relationToPatient2: "",
        idPassport2: "",
        telephone2: "",

        name3: "",
        relationToPatient3: "",
        idPassport3: "",
        telephone3: "",

        name4: "",
        relationToPatient4: "",
        idPassport4: "",
        telephone4: "",
        address4: "",

        name5: "",
        relationToPatient5: "",
        idPassport5: "",
        telephone5: "",
        address5: "",

        id: 0,
        surgery: 0,
        directiveFor: "",
    }
    const [payload, setPayload] = useState(initial)
    const handleChange = (e) => {
        const { name, value } = e.target;
        setPayload((val) => ({ ...val, [name]: value }))
    };
    const TRUE_FALSE_OPTIONS = [
        { label: t("Yes"), value: "1" },
        { label: t("No"), value: "0" },
    ];
    const handleReactSelect = (name, val) => {
        setPayload((prev) => ({
            ...prev,
            [name]: val,
        }));
    }

    const baseFields = [
        { name: "name", label: t("name") },
        { name: "relationToPatient", label: t("relationToPatient") },
        { name: "idPassport", label: t("idPassport") },
        { name: "telephone", label: t("telephone") }
    ];
    const THEAD = [
        { name: t("S.No"), width: "1%" },
        { name: t("value"), width: "10%" },
        { name: t("Action"), width: "1%" },
    ]
    const THEAD1 = [
        { name: t("S.No"), width: "1%" },
        { name: t("Name of Physician"), width: "10%" },
        { name: t("Telephobe Address"), width: "10%" },
        { name: t("Sub Speciality"), width: "10%" },
        { name: t("Action"), width: "1%" },
    ]
    const [rows, setRows] = useState([
        { id: 1, value: "" }
    ]);
    const [tableData, setTableData] = useState([])
    const removeRow = (index) => {
        if (rows.length === 1) return;

        const updated = rows.filter((_, i) => i !== index);
        setRows(updated);
    };
    const handleTableChange = (index, e) => {
        const updatedRows = [...rows];
        updatedRows[index].value = e.target.value;
        setRows(updatedRows);
    };
    const addRow = () => {
        setRows([
            ...rows,
            { id: rows.length + 1, value: "" }
        ]);
    };

    const buildPayload = (values) => {
        const fixed = {
            id: values?.id || 0,

        };
        const dynamic = {};

        Object.entries(values).forEach(([key, val]) => {
            debugger
            if (key in fixed) return;
            if (val && typeof val === "object" && "value" in val) {
                dynamic[key] = Number(val.value);
            }
            else if (typeof val === "number") {
                dynamic[key] = val;
            }

            else if (typeof val === "string") {
                dynamic[key] = val;
            }
            else {
                dynamic[key] = 0;
            }
        });


        return { ...fixed, ...dynamic };
    };

    const HandleSave = async () => {
        let payloadData = buildPayload(payload)
        const savePayload = {
            obstreticCareerDetail: rows.map(row => ({
                blank: row.value || "",
                transactionID: transactionID,
                txtID: row?.txtID || 0,
            })),
            formDetails: payloadData
        }
        const res = await saveOrUpdateAdvancedDirectiveApi(savePayload)
        if (res?.success) {
            fetchListData()
            notify(res?.message, "success")
            setPayload(initial)
            setRows([{id:1,value:""}])
        } else {
            notify(res?.message, "error")
        }
    }

    const fetchListData = async () => {
        const res = await getAdvancedDirectiveFullDetailsApi(transactionID);
        if (res?.success) {
            setTableData(res?.data)
        } else {
            setTableData([])
            notify(res?.message, "error")
        }
    }
    useEffect(() => {
        fetchListData()
    }, [])
    const handleEdit = (row) => {
        setPayload(prev => ({
            ...prev,
            ...row,

        }));

        if (tableData?.obstreticValues?.length > 0) {
            setRows(
                tableData.obstreticValues.map(item => ({
                    txtID: item.mid,
                    value: item.value,
                }))
            );
        }
    }


    return (
        <div className='mt-2 spatient_registration_card card'>
            <Heading title={t("Chemotherapy Treatment Sheet")} />
            <div className="row p-2">
                <Input
                    type="text"
                    className="form-control"
                    id="physicianName"
                    name="physicianName"
                    value={payload?.physicianName}
                    onChange={handleChange}
                    lable={t("physicianName")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="telephoneAddress"
                    name="telephoneAddress"
                    value={payload?.telephoneAddress}
                    onChange={handleChange}
                    lable={t("telephoneAddress")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="subSpeciality"
                    name="subSpeciality"
                    value={payload?.subSpeciality}
                    onChange={handleChange}
                    lable={t("subSpeciality")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />

                <Input
                    type="text"
                    className="form-control"
                    id="doctor2"
                    name="doctor2"
                    value={payload?.doctor2}
                    onChange={handleChange}
                    lable={t("Doctor 2")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="doctor3"
                    name="doctor3"
                    value={payload?.doctor3}
                    onChange={handleChange}
                    lable={t("Doctor 3")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="nurse1"
                    name="nurse1"
                    value={payload?.nurse1}
                    onChange={handleChange}
                    lable={t("Doctor 1")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="nurse2"
                    name="nurse2"
                    value={payload?.nurse2}
                    onChange={handleChange}
                    lable={t("Nurse 2")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
            </div>
            <div style={{ lineHeight: "1.6", fontSize: "14px", whiteSpace: "pre-line", padding: "10px" }}>
                <h3>{t("The Patient Has Given You the Right as Next of Kin or Medical Proxy to Make All Medical Decisions on Their Behalf")}</h3>
                <p>{t("A medical proxy is authorized to:")}</p>

                <ol>
                    <li>Make all healthcare decisions for me, including decisions to provide, withhold, or withdraw artificial nutrition and hydration and all other forms of health care to keep one alive.</li>
                    <li>{t("Choose a particular physician or health care facility.")}</li>
                    <li>{t("To receive or consent to the release of all my medical information and records.")}</li>
                    <li>{t("Make anatomical gifts of my remains in the event of my death and authorize a medical autopsy.")}</li>
                </ol>

                <p>
                    A medical proxy’s authority becomes effective when the patient’s primary physician/medical team determines
                    that he/she is unable to make their own health care decisions. You may use this form now to tell your physician
                    and others what medical care you want for the patient who is too sick/unable to communicate their wishes.
                    You may choose to fill out the whole form or any part of the form and then sign and date the form.
                    You have the right to change this directive at any time.
                </p>

                <hr />

                <h3>{t("ADVANCE DIRECTIVE FORMS FOR NEXT OF KIN / MEDICAL PROXY / GUARDIAN")}</h3>

                <h4>{t("I) Prolongation of Life Directives")}</h4>
                <p>
                    <strong>{t("End of Life Decision:")}</strong> I/WE direct my health care providers and others involved in the patient’s care
                    to provide, withhold, or withdraw treatment for the patient in accordance with the choice I have marked below.
                </p>

                <p>
                    <strong>{t("Choice Not to Prolong:")}</strong> I/WE do not want the patient’s life to be prolonged if the likely risks and burdens of treatment
                    would outweigh the expected benefits, or if the patient becomes unconscious and, to a realistic degree of medical certainty,
                    the patient will not regain consciousness, or if they have an incurable and irreversible condition that will result in death
                    in a relatively short time. Please see below for specific directives.
                </p>

                <p>
                    <strong>{t("Or Choice to Prolong:")}</strong> I/WE want the patient’s life to be prolonged as long as possible within the limits of generally
                    accepted medical treatment and standards. Please see below for specific directives.
                </p>

                <h4>{t("II. Resuscitation Instructions")}</h4>
                <ol>
                    <li>
                        <strong>{t("Resuscitate Me:")}</strong> In the event that the patient’s heart stops or they stop breathing,
                        I/WE WANT them to be resuscitated by the emergency team and given all measures to restart and support breathing
                        including intubating and ventilating on life support machines.
                    </li>
                    <li>
                        <strong>{t("Do Not Resuscitate (DNR):")}</strong> In the event that the patient’s heart stops or they stop breathing,
                        I/WE DO NOT WANT the patient to be resuscitated by the emergency team or given any measures to restart my heart
                        or support breathing. DO NOT intubate or ventilate on life support machines.
                    </li>
                </ol>

                <h4>{t("III. Resuscitation Instructions for Ventilated Patients / Patients on Life Support")}</h4>
                <ol>
                    <li>
                        <strong>{t("Resuscitate Me:")}</strong> In the event that the patient’s heart stops or they stop breathing,
                        I/WE WANT them to be resuscitated by the emergency team and given all measures to restart and increase life support.
                    </li>
                    <li>
                        <strong>{t("Do Not Resuscitate Me (DNR):")}</strong> In the event that the patient’s heart stops or they stop breathing,
                        I/WE DO NOT WANT the patient to be resuscitated by the emergency team to increase their life support.
                    </li>
                </ol>

                <h4>{t("V. Specific Directives Related to My Care")}</h4>
                <p>
                    (Please ask your doctor/nurse to explain these terms to you if you are unsure.)
                    In the event of advanced cancer or multiple/severe organ damage that is terminal,
                    I WANT the medical treatment that I indicate below to be discontinued:
                </p>
            </div>
            <div className="row p-2">
                <ReactSelect
                    placeholderName={t("Mechanical ventilation")}
                    name="mechanicalVentilation"
                    value={String(payload?.mechanicalVentilation?.value ?? payload?.mechanicalVentilation ?? 0)}
                    handleChange={handleReactSelect}
                    dynamicOptions={TRUE_FALSE_OPTIONS}
                    searchable={false}
                    id="mechanicalVentilation"
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    removeIsClearable={true}
                />
                <ReactSelect
                    placeholderName={t("Vasopressor  support")}
                    name="vasopressorSupport"
                    value={String(payload?.vasopressorSupport?.value ?? payload?.vasopressorSupport ?? 0)}
                    handleChange={handleReactSelect}
                    dynamicOptions={TRUE_FALSE_OPTIONS}
                    searchable={false}
                    id="vasopressorSupport"
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    removeIsClearable={true}
                />
                <ReactSelect
                    placeholderName={t("Dialysis")}
                    name="dialysis"
                    value={String(payload?.dialysis?.value ?? payload?.dialysis ?? 0)}
                    handleChange={handleReactSelect}
                    dynamicOptions={TRUE_FALSE_OPTIONS}
                    searchable={false}
                    id="dialysis"
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    removeIsClearable={true}
                />
                <ReactSelect
                    placeholderName={t("Antibiotics")}
                    name="antibiotics"
                    value={String(payload?.antibiotics?.value ?? payload?.antibiotics ?? 0)}
                    handleChange={handleReactSelect}
                    dynamicOptions={TRUE_FALSE_OPTIONS}
                    searchable={false}
                    id="antibiotics"
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    removeIsClearable={true}
                />
                <ReactSelect
                    placeholderName={t("Chemotherapy and radiotherapy")}
                    name="chemotherapyRadiotherapy"
                    value={String(payload?.chemotherapyRadiotherapy?.value ?? payload?.chemotherapyRadiotherapy ?? 0)}
                    handleChange={handleReactSelect}
                    dynamicOptions={TRUE_FALSE_OPTIONS}
                    searchable={false}
                    id="chemotherapyRadiotherapy"
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    removeIsClearable={true}
                />
                <ReactSelect
                    placeholderName={t("Transfusion of blood and blood products")}
                    name="transfusion"
                    value={String(payload?.transfusion?.value ?? payload?.transfusion ?? 0)}
                    handleChange={handleReactSelect}
                    dynamicOptions={TRUE_FALSE_OPTIONS}
                    searchable={false}
                    id="transfusion"
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    removeIsClearable={true}
                />
                <ReactSelect
                    placeholderName={t("Specific Medications used to treat my medical condition(s)eg diabetes,hypertension")}
                    name="specificMedications"
                    value={String(payload?.specificMedications?.value ?? payload?.specificMedications ?? 0)}
                    handleChange={handleReactSelect}
                    dynamicOptions={TRUE_FALSE_OPTIONS}
                    searchable={false}
                    id="specificMedications"
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    removeIsClearable={true}
                />
                <ReactSelect
                    placeholderName={t("Lab Tests and Radiological Investigations necessary for my care")}
                    name="labTests"
                    value={String(payload?.labTests?.value ?? payload?.labTests ?? 0)}
                    handleChange={handleReactSelect}
                    dynamicOptions={TRUE_FALSE_OPTIONS}
                    searchable={false}
                    id="labTests"
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    removeIsClearable={true}
                />
                <ReactSelect
                    placeholderName={t("Surgery and Surgical Procedures are necessary for my care")}
                    name="surgery"
                    value={String(payload?.surgery?.value ?? payload?.surgery ?? 0)}
                    handleChange={handleReactSelect}
                    dynamicOptions={TRUE_FALSE_OPTIONS}
                    searchable={false}
                    id="surgery"
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    removeIsClearable={true}
                />

                <li className="p-2">
                    <strong>{t("Resuscitate Me:")}</strong> In the event that the patient’s heart stops or they stop breathing,
                    I/WE WANT them to be resuscitated by the emergency team and given all measures to restart and increase life support.
                </li>
            </div>
            <div className="p-2">

                <h4><strong>{t("VI. Declaration")} </strong>{t("STATEMENT OF INDIVIDUAL(S) I/WE declare that this document states MY/OUR wishes for advanced")}</h4>
                <Input
                    type="text"
                    className="form-control"
                    id="Directive"
                    name="directiveFor"
                    value={payload?.directiveFor}
                    onChange={handleChange}
                    lable={t("directiveFor")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <li>
                    {t("I/WE know that this document is legally binding once I/WE sign it")}
                </li>
                <li>
                    {t("I/WE know that I/WE can change these directive at any time")}
                </li>
                <li>
                    I/WE declare that I/WE am sound mind, above 18 years of age and under dures, fraud or undue influence to sign this document.
                </li>

                {[1, 2, 3].map((num) => (
                    <div key={num} className="row mb-3">
                        {baseFields.map((field, idx) => (
                            <Input
                                key={idx}
                                type="text"
                                className="form-control"
                                id={`${field.name}${num}`}
                                name={`${field.name}${num}`}
                                value={payload?.[`${field.name}${num}`] || ""}
                                onChange={handleChange}
                                lable={t(`${field.label} ${num}`)}
                                placeholder=""
                                respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                            />
                        ))}
                    </div>
                ))}
                <li>
                    <strong>{t("VII. Witnesses to this Advanced Directive Instruction")}</strong>
                </li>
                <li>
                    {t("STATEMENT OF WITNESSES: I declare under penalty of perjury under the laws of Kenya")}
                </li>
                <ol>
                    <li>
                        That the individual(s) who signed or acknowledged this advance health care directive is personally known to me or that the individual’s identity was proven to me by convincing evidence
                    </li>
                    <li>
                        {t("That the individual(s) signed or acknowledged this advance directive in my presence")}
                    </li>
                    <li>
                        {t("That the individual(s) appears to be of sound mind and under no duress, fraud, or under influence")}
                    </li>
                    <li>
                        {t("That I am not a person appointed as an agent by his advance directive")}
                    </li>
                    <li>
                        {t("That I am not their individuals healthcare provider or an employee of the individual’s health care provider.")}
                    </li>
                </ol>
                {[4, 5, 6].map((num) => (
                    <div key={num} className="row mb-3">
                        {baseFields.map((field, idx) => (
                            <Input
                                key={idx}
                                type="text"
                                className="form-control"
                                id={`${field.name}${num}`}
                                name={`${field.name}${num}`}
                                value={payload?.[`${field.name}${num}`] || ""}
                                onChange={handleChange}
                                lable={t(`${field.label} ${num}`)}
                                placeholder=""
                                respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                            />
                        ))}
                    </div>
                ))}
            </div>
            <Heading title={t("I/WE would like the following individuals to keep signed copies of this directive")} />
            <Tables
                thead={THEAD}
                tbody={rows?.map((item, index) => ({
                    SNo: index + 1,
                    val:
                        <Input
                            type="text"
                            className="form-control mt-1"
                            id="Value"
                            // name="Directive"
                            value={item.value}
                            onChange={(e) => { handleTableChange(index, e) }}
                            lable={t("Value")}
                            placeholder=""
                            respclass="col-12"
                        />,
                    Action:
                        <>
                            <button className="btn btn-sm btn-success" type="button" onClick={addRow}>
                                +
                            </button>
                            <button className="btn btn-sm btn-success ml-2" type="button" onClick={() => removeRow(index)}>
                                -
                            </button>

                        </>
                }))}
            />
            <div className='p-2'>
                <button className="btn btn-sm btn-success" type="button" style={{ float: "right" }} onClick={HandleSave}>
                    {payload?.id === 0 ? t("Save") : t("Update")}
                </button>
            </div>
            {tableData?.mainForm?.length > 0 ?
                <Tables thead={THEAD1}
                    tbody={tableData?.mainForm?.map((item, index) => ({
                        SNo: index + 1,
                        Physician: item?.physicianName,
                        Telephobe: item?.telephoneAddress,
                        Speciality: item?.subSpeciality,
                        edit: <i className="fa fa-edit" aria-hidden="true" onClick={() => { handleEdit(item) }}></i>
                    }))}
                />
                :
                ""}
        </div>
    );
}
export default AdvanceDirectiveForm;
