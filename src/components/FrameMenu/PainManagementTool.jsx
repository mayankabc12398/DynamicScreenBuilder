import React, { useEffect, useState } from 'react'
import Heading from '../UI/Heading';
import { useTranslation } from 'react-i18next';
import ReactSelect from '../formComponent/ReactSelect';
import Input from '../formComponent/Input';
import LabeledInput from '../formComponent/LabeledInput';
import moment from 'moment';
import DatePicker from '../formComponent/DatePicker';
import TimePicker from '../formComponent/TimePicker';
import { saveOrUpdatePainManagementApi, getPainManagementListApi } from '../../networkServices/Emergency';
import { notify } from '../../utils/ustil2';
import Tables from '../UI/customTable';
import { ReprintSVG } from '../SvgIcons';
const PainManagementTool = ({ data }) => {
    const { patientID, transactionID } = data;
    const [t] = useTranslation()
    const scoreOptions = [
        { label: t("0 - No Hurt"), value: 0 },
        { label: t("2 - Hurts Little Bit"), value: 2 },
        { label: t("4 - Hurts Little More"), value: 4 },
        { label: t("6 - Hurts Even More"), value: 6 },
        { label: t("8 - Hurts Whole Lot"), value: 8 },
        { label: t("10 - Hurts Worst"), value: 10 },
    ];
    const THEAD = [
        { name: t("S.No"), width: "10%" },
        { name: t("UHID"), width: "10%" },
        { name: t("Wong"), width: "10%" },
        { name: t("Total Score"), width: "10%" },
        { name: t("Entry Date"), width: "10%" },
        { name: t("Entry Time"), width: "10%" },
        // { name: t("Action"), width: "10%" },
    ]
    const [values, setValues] = useState({
        id: "",
        date: new Date(),
        time: new Date(),
        wong: "",
        numeric: "",
        totalScore: "",
        patientID: "",
        transactionID: ""
    })
    const { VITE_DATE_FORMAT } = import.meta.env;
    const [tableData, setTableData] = useState([]);
    const handleReactSelectChange = (name, val) => {
        setValues((prev) => ({
            ...prev,
            [name]: val,
        }));
    }
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "numeric") {
            if (value === "") {
                setValues((v) => ({ ...v, numeric: "" }));
                return;
            }

            const num = Number(value);
            if (num < 0 || num > 10) return;
        }
        setValues((val) => ({ ...val, [name]: value }));
    };
    const handleSave = async () => {
        const payload = {
            id: values.id || 0,
            date: values?.date ? moment(values.date).format("YYYY-MM-DD") : values?.date,
            time: values?.time ? moment(values.Time).format("hh:mm A") : new Date(),
            wong: values?.wong?.value ?? values?.wong ?? "",
            numeric: Number(values.numeric ?? 0),
            totalScore: Number(values.totalScore ?? 0),
            patientID: patientID || "",
            transactionID: transactionID || "",
        }
        const res = await saveOrUpdatePainManagementApi(payload)
        if (res?.success) {
            notify(res?.message, "success")
            getListData()
        } else {
            notify(res?.message, "error")
        }
    }
    const handlePrint = () => {

    }

    useEffect(() => {
        const w = Number(values.wong?.value ?? values.wong ?? 0);
        const n = Number(values.numeric ?? 0);
        setValues((prev) => ({ ...prev, totalScore: w + n }));
    }, [values.wong, values.numeric]);
    const getListData = async () => {
        const res = await getPainManagementListApi(patientID, transactionID)
        if (res?.success) {
            setTableData(res?.data)
        } else {
            setTableData([])
            notify(res?.message, "error")
        }
    }
    useEffect(() => {
        getListData()
    }, [])

    return (
        <div className='mt-2 spatient_registration_card'>
            <Heading
                title={t("Pain Management Tool")}
                isBreadcrumb={false}

            />

            <div className='row p-2'>


                <DatePicker
                    className={`custom-calendar `}
                    id="date"
                    name="date"
                    inputClassName={"required-fields"}
                    value={values?.date ? values?.date : new date()}
                    handleChange={handleChange}
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    lable={t("date")}
                    placeholder={VITE_DATE_FORMAT}
                />
                <TimePicker
                    placeholderName={t("Time")}
                    lable={t("Time")}
                    id="Time"
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    name="Time"
                    value={values?.time ? values?.time : new Date()}
                    // value={new Date(`1970-01-01T00:00:00`)}
                    handleChange={handleChange}
                />
                <div className="col-xl-2 col-md-4 col-sm-4 col-12">
                    <LabeledInput
                        label={t("Total")}
                        value={values?.totalScore}
                    />
                </div>

                <div className='col-12 '>

                    <div
                        className="pt-3 pb-2 pr-2 pl-2 form-group "
                        style={{
                            border: "1px solid #ced4da",
                            borderRadius: "4px",
                            position: "relative",
                        }}
                    >
                        <label className="label" style={{ position: "absolute" }}>
                            {t("Wong Baker Faces Pain Rating Scale Age 3 years and older")}
                        </label>
                        <div className='row'>

                            <img className='img-fluid col-12 col-md-6 '
                                src={"../src/assets/image/img1.png"}
                                alt="Wong Baker Faces Pain Scale"
                                style={{ height: "110px", borderRadius: 6 }}
                            />
                            <ReactSelect
                                placeholderName={t("wong")}
                                name="wong"
                                value={values?.wong}
                                handleChange={handleReactSelectChange}
                                dynamicOptions={scoreOptions}
                                searchable={true}
                                id="wong"
                                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                removeIsClearable={true}
                            />
                        </div>
                    </div>
                </div>
                <div className='col-12 '>
                    <div
                        className="pt-3 pb-2 pr-2 pl-2 form-group "
                        style={{
                            border: "1px solid #ced4da",
                            borderRadius: "4px",
                            position: "relative",
                        }}
                    >
                        <label className="label" style={{ position: "absolute" }}>
                            {t("Numeric rating scale pain assessment tool(7 years and above)")}
                        </label>
                        <div className='row'>

                            <img className='img-fluid col-12 col-md-6 '
                                src={"../src/assets/image/numeric.jpg"}
                                alt="Numeric rating scale pain assessment tool(7 years and above)"
                                style={{ height: "100px", borderRadius: 6 }}
                            />
                            <Input
                                type="number"
                                className="form-control"
                                id="numeric"
                                name="numeric"
                                value={values?.numeric}
                                onChange={handleChange}
                                lable={t("Numeric Score")}
                                respclass="col-sm-6 col-md-4 col-lg-2 col-12"
                            />

                        </div>
                    </div>
                </div>

                <div className='col-12'>

                    <button
                        className="btn btn-primary ml-2"
                        type='button'
                        style={{ float: "right" }}
                        onClick={handleSave}
                    >
                        {values?.id ? t("Update") : t("Save")}
                    </button>
                </div>
            </div>
            {console.log(tableData)}
            {tableData?.length > 0 ?
                <>  <Heading isBreadcrumb={false} title={t("List")} />
                    <Tables thead={THEAD}
                        tbody={tableData?.map((item, index) => ({
                            SNo: index + 1,
                            patientID: item?.patientID,
                            wong: item?.wong,
                            totalScore: item?.totalScore,
                            date: item?.date ? moment(item?.date).format("DD-MM-YYYY") : "-",
                            time: item?.time,
                            // action: <div
                            //     // className='btn btn-primary'
                            //     style={{ textAlign: "center", cursor: "pointer" }}
                            //     onClick={() => handlePrint(item?.ID)}
                            // >
                            //     <ReprintSVG />
                            // </div>
                        }))}
                        scrollView={"scrollView"}
                    />
                </>
                : ""}
        </div>
    );
}

export default PainManagementTool;