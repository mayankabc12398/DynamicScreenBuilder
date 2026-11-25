import React, { useEffect, useState } from 'react'
import Heading from '../../UI/Heading';
import { useTranslation } from 'react-i18next';
import DatePicker from '../../formComponent/DatePicker';
import Input from '../../formComponent/Input';
import ReactSelect from '../../formComponent/ReactSelect';
import TextAreaInput from '../../formComponent/TextAreaInput';
import { saveOrUpdateHandHygineAuditApi, getHandHygieneAuditDetailsApi } from '../../../networkServices/Emergency';
import moment from 'moment';
import { notify } from '../../../utils/ustil2';
import Tables from '../../UI/customTable';
const HandHygieneAudit = ({ data }) => {
    const { patientID, transactionID } = data;
    const [t] = useTranslation();
    const { VITE_DATE_FORMAT } = import.meta.env;
    const thead = [
        { width: "10%", name: t("S No.") },
        { width: "10%", name: t("UHID") },
        { width: "10%", name: t("Entered By") },
        { width: "1%", name: t("Edit") },

    ]
    const initialValue = {
        Id: 0,
        patientID: "",
        transactionId: "",

        Department: "",
        Date: new Date(),
        BeforeTouching: 0,
        BeforeAseptic: 0,
        BeforeTouchingPatient: 0,
        AfterBodyExposure: 0,
        AfterSurroundingTouch: 0,
        Remarks: "",

        Department1: "",
        Date1: new Date(),
        BeforeTouching1: 0,
        BeforeAseptic1: 0,
        BeforeTouchingPatient1: 0,
        AfterBodyExposure1: 0,
        AfterSurroundingTouch1: 0,
        Remarks1: "",

        BeforeTouching2: 0,
        BeforeAseptic2: 0,
        BeforeTouchingPatient2: 0,
        AfterBodyExposure2: 0,
        AfterSurroundingTouch2: 0,

        Remarks2: "",
        Remarks3: ""

    }
    const TRUE_FALSE_OPTIONS = [
        { label: t("Yes"), value: "1" },
        { label: t("No"), value: "0" },
    ];
    const [tableData, setTableData] = useState([])
    const [values, setValues] = useState(initialValue)
    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((val) => ({ ...val, [name]: value }));
    };
    const handleReactSelectChange = (name, val) => {
        setValues((prev) => ({
            ...prev,
            [name]: val,
        }));
    }
    const boolToInt = (field) => {
        const val = typeof field === "object" ? field?.value : field;
        if (val === "1" || val === 1 || val === true) return 1;
        if (val === "0" || val === 0 || val === false) return 0;

        return 0;
    };
    const handleSave = async () => {
        const payload = {
            id: values?.Id ? values?.Id : 0,
            patientID: patientID,
            transactionId: transactionID,


            department: values.Department,
            date: values?.Date ? moment(values?.Date).format("YYYY-MM-DD") : "",
            beforeTouching: boolToInt(values.BeforeTouching),
            beforeAseptic: boolToInt(values.BeforeAseptic),
            beforeTouchingPatient: boolToInt(values.BeforeTouchingPatient),
            afterBodyExposure: boolToInt(values.AfterBodyExposure),
            afterSurroundingTouch: boolToInt(values.AfterSurroundingTouch),
            remarks: values.Remarks,


            department1: values.Department1,
            date1: values.Date1 ? moment(values.Date1).format("YYYY-MM-DD") : "",
            beforeTouching1: boolToInt(values.BeforeTouching1),
            beforeAseptic1: boolToInt(values.BeforeAseptic1),
            beforeTouchingPatient1: boolToInt(values.BeforeTouchingPatient1),
            afterBodyExposure1: boolToInt(values.AfterBodyExposure1),
            afterSurroundingTouch1: boolToInt(values.AfterSurroundingTouch1),
            remarks1: values.Remarks1,


            beforeTouching2: boolToInt(values.BeforeTouching2),
            beforeAseptic2: boolToInt(values.BeforeAseptic2),
            beforeTouchingPatient2: boolToInt(values.BeforeTouchingPatient2),
            afterBodyExposure2: boolToInt(values.AfterBodyExposure2),
            afterSurroundingTouch2: boolToInt(values.AfterSurroundingTouch2),
            remarks2: values.Remarks2,

            remarks3: values.Remarks3,
        };

        const resp = await saveOrUpdateHandHygineAuditApi(payload);
        if (resp?.success) {
            notify(resp?.message, "success")
            fetchList()
            setValues({...initialValue})
        } else {
            notify(resp?.message, "error")
        }
    }
    const handlePrint = () => {

    }
    const fetchList = async () => {
        const boolToStr = (value) => (value === true ? "1" : "0");
        const res = await getHandHygieneAuditDetailsApi(transactionID)
        if (res?.success) {
            setTableData(res?.data)
            // debugger
            // setValues({
            //     ...values,
            //     Id: res?.data[0]?.Id || 0,
            //     PatientID: res?.data[0]?.PatientID,
            //     TransactionID: res?.data[0]?.TransactionID,

            //     Department: res?.data[0]?.Department || "",
            //     Date: res?.data[0]?.Date ? new Date(res?.data[0]?.Date) : new Date(),
            //     BeforeTouching: boolToStr(res?.data[0]?.BeforeTouching),
            //     beforeAseptic: boolToStr(res?.data[0]?.BeforeAseptic),
            //     BeforeTouchingPatient: boolToStr(res?.data[0]?.BeforeTouchingPatient),
            //     AfterBodyExposure: boolToStr(res?.data[0]?.AfterBodyExposure),
            //     AfterSurroundingTouch: boolToStr(res?.data[0]?.AfterSurroundingTouch),
            //     Remarks: res?.data[0]?.Remarks || "",

            //     Department1: res?.data[0]?.Department1 || "",
            //     Date1: res?.data[0]?.Date1 ? new Date(res?.data[0]?.Date1) : new Date(),
            //     BeforeTouching1: boolToStr(res?.data[0]?.BeforeTouching1),
            //     BeforeAseptic1: boolToStr(res?.data[0]?.BeforeAseptic1),
            //     BeforeTouchingPatient1: boolToStr(res?.data[0]?.BeforeTouchingPatient1),
            //     AfterBodyExposure1: boolToStr(res?.data[0]?.AfterBodyExposure1),
            //     AfterSurroundingTouch1: boolToStr(res?.data[0]?.AfterSurroundingTouch1),
            //     Remarks1: res?.data[0]?.Remarks1 || "",

            //     BeforeTouching2: boolToStr(res?.data[0]?.BeforeTouching2),
            //     BeforeAseptic2: boolToStr(res?.data[0]?.BeforeAseptic2),
            //     BeforeTouchingPatient2: boolToStr(res?.data[0]?.BeforeTouchingPatient2),
            //     AfterBodyExposure2: boolToStr(res?.data[0]?.AfterBodyExposure2),
            //     AfterSurroundingTouch2: boolToStr(res?.data[0]?.AfterSurroundingTouch2),
            //     Remarks2: res?.data[0]?.Remarks2 || "",
            //     Remarks3: res?.data[0]?.Remarks3 || "",
            // })
        } else {
            notify(res?.message, "error")
            setTableData([])
        }
    }
    
    const handleEdit = (val) => {
        const boolToStr = (value) => (value === true ? "1" : "0");
        const updated = {
            Id: val?.Id,
            PatientID: val.PatientID,
            TransactionID: val.TransactionID,

            Department: val.Department || "",
            Date: val.Date ? new Date(val.Date) : new Date(),
            BeforeTouching: boolToStr(val.BeforeTouching),
            BeforeAseptic: boolToStr(val.BeforeAseptic),
            BeforeTouchingPatient: boolToStr(val.BeforeTouchingPatient),
            AfterBodyExposure: boolToStr(val.AfterBodyExposure),
            AfterSurroundingTouch: boolToStr(val.AfterSurroundingTouch),
            Remarks: val.Remarks || "",

            Department1: val.Department1 || "",
            Date1: val.Date1 ? new Date(val.Date1) : new Date(),
            BeforeTouching1: boolToStr(val.BeforeTouching1),
            BeforeAseptic1: boolToStr(val.BeforeAseptic1),
            BeforeTouchingPatient1: boolToStr(val.BeforeTouchingPatient1),
            AfterBodyExposure1: boolToStr(val.AfterBodyExposure1),
            AfterSurroundingTouch1: boolToStr(val.AfterSurroundingTouch1),
            Remarks1: val.Remarks1 || "",

            BeforeTouching2: boolToStr(val.BeforeTouching2),
            BeforeAseptic2: boolToStr(val.BeforeAseptic2),
            BeforeTouchingPatient2: boolToStr(val.BeforeTouchingPatient2),
            AfterBodyExposure2: boolToStr(val.AfterBodyExposure2),
            AfterSurroundingTouch2: boolToStr(val.AfterSurroundingTouch2),
            Remarks2: val.Remarks2 || "",
            Remarks3: val.Remarks3 || "",
        };

        setValues(updated);
    }
    console.log(values);

    useEffect(() => {
        fetchList()
    }, [])
    return (
        <div className="mt-2 spatient_registration_card">
            <form className="patient_registration card">
                <Heading
                    title={t("Hand Hygiene Audit")}
                    isBreadcrumb={false}
                />
                <div className="row p-2">
                    <Input
                        type="text"
                        className="form-control"
                        id="Department"
                        name="Department"
                        value={values?.Department ? values?.Department : ""}
                        onChange={handleChange}
                        lable={t("Department")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"

                    />
                    <DatePicker
                        className={`custom-calendar `}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        id="Date"
                        name="Date"
                        inputClassName={"required-fields"}
                        value={values?.Date ? values?.Date : new Date()}
                        handleChange={handleChange}
                        lable={t("Date")}
                        placeholder={VITE_DATE_FORMAT}
                    />
                    <ReactSelect
                        placeholderName={t("Before Touching")}
                        name="BeforeTouching"
                        value={values?.BeforeTouching ? values?.BeforeTouching : "0"}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="BeforeTouching"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <ReactSelect
                        placeholderName={t("Before Aseptic")}
                        name="BeforeAseptic"
                        value={values?.BeforeAseptic ? values?.BeforeAseptic : "0"}
                        handleChange={handleReactSelectChange}
                        // requiredClassName="required-fields"
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="BeforeAseptic"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <ReactSelect
                        placeholderName={t("before Touching Patient")}
                        name="BeforeTouchingPatient"
                        value={values?.BeforeTouchingPatient ? values?.BeforeTouchingPatient : "0"}
                        handleChange={handleReactSelectChange}
                        // requiredClassName="required-fields"
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="BeforeTouchingPatient"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <ReactSelect
                        placeholderName={t("after Body Exposure")}
                        name="AfterBodyExposure"
                        value={values?.AfterBodyExposure ? values?.AfterBodyExposure : "0"}
                        handleChange={handleReactSelectChange}
                        // requiredClassName="required-fields"
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="AfterBodyExposure"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <ReactSelect
                        placeholderName={t("afterSurroundingTouch")}
                        name="AfterSurroundingTouch"
                        value={values?.AfterSurroundingTouch ? values?.AfterSurroundingTouch : "0"}
                        handleChange={handleReactSelectChange}
                        // requiredClassName="required-fields"
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="AfterSurroundingTouch"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <TextAreaInput
                        type="text"
                        className={`form-textarea `}
                        id="Remarks"
                        name="Remarks"
                        value={values?.Remarks ? values?.Remarks : ""}
                        onChange={handleChange}
                        lable={t("Remarks")}
                        placeholder=" "
                        respclass="col-12"
                    />

                    <Input
                        type="text"
                        className="form-control"
                        id="Department1"
                        name="Department1"
                        value={values?.Department1 || ""}
                        onChange={handleChange}
                        lable={t("Department")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />

                    <DatePicker
                        className={`custom-calendar`}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        id="Date1"
                        name="Date1"
                        inputClassName={"required-fields"}
                        value={values?.Date1 ? values?.Date1 : new Date()}
                        handleChange={handleChange}
                        lable={t("Date")}
                        placeholder={VITE_DATE_FORMAT}
                    />

                    <ReactSelect
                        placeholderName={t("Before Touching")}
                        name="BeforeTouching1"
                        value={values?.BeforeTouching1 || "0"}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="BeforeTouching1"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />

                    <ReactSelect
                        placeholderName={t("Before Aseptic")}
                        name="BeforeAseptic1"
                        value={values?.BeforeAseptic1 || "0"}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="BeforeAseptic1"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />

                    <ReactSelect
                        placeholderName={t("Before Touching Patient")}
                        name="BeforeTouchingPatient1"
                        value={values?.BeforeTouchingPatient1 || "0"}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="BeforeTouchingPatient1"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />

                    <ReactSelect
                        placeholderName={t("After Body Exposure")}
                        name="AfterBodyExposure1"
                        value={values?.AfterBodyExposure1 || "0"}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="AfterBodyExposure1"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />

                    <ReactSelect
                        placeholderName={t("After Surrounding Touch")}
                        name="AfterSurroundingTouch1"
                        value={values?.AfterSurroundingTouch1 || "0"}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="AfterSurroundingTouch1"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />

                    <TextAreaInput
                        type="text"
                        className={`form-textarea`}
                        id="Remarks1"
                        name="Remarks1"
                        value={values?.Remarks1 || ""}
                        onChange={handleChange}
                        lable={t("Remarks")}
                        placeholder=" "
                        respclass="col-12"
                    />


                    <ReactSelect
                        placeholderName={t("Before Touching")}
                        name="BeforeTouching2"
                        value={values?.BeforeTouching2 || "0"}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="BeforeTouching2"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />


                    <ReactSelect
                        placeholderName={t("Before Aseptic")}
                        name="BeforeAseptic2"
                        value={values?.BeforeAseptic2 || "0"}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="BeforeAseptic2"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />


                    <ReactSelect
                        placeholderName={t("Before Touching Patient")}
                        name="BeforeTouchingPatient2"
                        value={values?.BeforeTouchingPatient2 || "0"}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="BeforeTouchingPatient2"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />


                    <ReactSelect
                        placeholderName={t("After Body Exposure")}
                        name="AfterBodyExposure2"
                        value={values?.AfterBodyExposure2 || "0"}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="AfterBodyExposure2"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />


                    <ReactSelect
                        placeholderName={t("After Surrounding Touch")}
                        name="AfterSurroundingTouch2"
                        value={values?.AfterSurroundingTouch2 || "0"}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="AfterSurroundingTouch2"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />


                    <TextAreaInput
                        type="text"
                        className="form-textarea"
                        id="Remarks2"
                        name="Remarks2"
                        value={values?.Remarks2 || ""}
                        onChange={handleChange}
                        lable={t("Remarks (Section 2)")}
                        placeholder=" "
                        respclass="col-sm-6"
                    />

                    <TextAreaInput
                        type="text"
                        className="form-textarea"
                        id="Remarks3"
                        name="Remarks3"
                        value={values?.Remarks3 || ""}
                        onChange={handleChange}
                        lable={t("Calculating Compliance Rates Total number of times hand hygiene was performed/Total opportunities for hand hygiene x100= Remarks")}
                        placeholder=""
                        respclass="col-12"
                    />
                </div>
                {console.log(values?.Id,"values?.Id")}
                <div className='flex'>

                    <button className="btn btn-sm btn-success m-2" type='button' style={{ float: "right" }} onClick={handleSave}>
                        {values?.Id===0 ? t("Save") : t("Update")}
                    </button>
                    {/* <button className="btn btn-sm btn-success m-2" type='button' style={{ float: "right" }} onClick={handlePrint}>
                        {t("Report")}
                    </button> */}
                </div>
                {tableData?.length > 0 &&
                    <>
                        <Heading title={t("List of Leaving Against Medical Advice")} isBreadcrumb={false} />
                        <Tables thead={thead} tbody={
                            tableData?.map((item, index) => ({
                                SNo: index + 1,
                                uhid: item?.PatientID,
                                enteredBy: item?.EMployeeName,
                                edit: (
                                    <i
                                        className="fa fa-edit"
                                        aria-hidden="true"
                                        onClick={() => {
                                            handleEdit(item);
                                        }}
                                    ></i>
                                )
                            }))
                        }
                        />
                    </>
                }
            </form>
        </div>
    )
}

export default HandHygieneAudit;