import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import TextAreaInput from '../formComponent/TextAreaInput';
import Input from '../formComponent/Input';
import DatePicker from '../formComponent/DatePicker';
import Heading from '../UI/Heading';
import { getChemotherapyTreatmentSheetApi, saveOrUpdateChemotherapyTreatmentSheetApi } from '../../networkServices/nursingWardAPI';
import moment from 'moment';
import { notify } from '../../utils/ustil2';
import Tables from '../UI/customTable';
const ChemotherapyTreatmentSheet = ({ data }) => {
    console.log(data);

    const { patientID, transactionID } = data;
    const [payload, setPayload] = useState({
        date: new Date(),
        id: 0,
        height: "",
        weight: "",
        bsa: "",
        bmi: "",
        diagnosis: "",
        t: "",
        n: "",
        m: "",
        stage: "",
        histology: "",
        others: "",
        chemotherapyRegime: "",
        doctorName: "",
        sign: "",

    })
    const [t] = useTranslation();
    const { VITE_DATE_FORMAT } = import.meta.env;
    const handleChange = (e) => {
        const { name, value } = e.target;
        setPayload((val) => ({ ...val, [name]: value }))
    };
    const HandleSave = async () => {
        const payloadData = {
            ...payload,
            date: moment(payload?.date).format("DD-MM-YYYY"),
            PateintId: patientID,
            transcationid: transactionID
        }

        const res = await saveOrUpdateChemotherapyTreatmentSheetApi(payloadData);
        if (res?.success) {
            notify(res?.message, "success");
            fetchDataList()
        } else {
            notify(res?.message, "error");
        }
    }
    const THEAD = [
        { name: t("S.No"), width: "1%" },
        { name: t("UHID"), width: "10%" },
        { name: t("created By"), width: "10%" },
        { name: t("Action"), width: "1%" },
    ]
    const [tableData, setTableData] = useState([]);
    const handleEdit = (item) => {
        debugger
        setPayload(prev => ({
            ...prev,
            ...item,
            date: new Date(item?.date),
        }));
    }
    const fetchDataList = async () => {
        const res = await getChemotherapyTreatmentSheetApi(patientID,transactionID)
        if (res?.success) {
            setTableData(res?.data)
        } else {
            notify(res?.message, "error")
            setTableData([])
        }
    }
    console.log(tableData);

    useEffect(() => {
        fetchDataList()
    }, [])
    return (
        <div className='mt-2 spatient_registration_card card'>
            <Heading title={t("Chemotherapy Treatment Sheet")} />
            <div className='row p-2'>

                <Input
                    type="text"
                    className="form-control"
                    id="height"
                    name="height"
                    value={payload?.height}
                    onChange={handleChange}
                    lable={t("height")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="weight"
                    name="weight"
                    value={payload?.weight}
                    onChange={handleChange}
                    lable={t("weight")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="bsa"
                    name="bsa"
                    value={payload?.bsa}
                    onChange={handleChange}
                    lable={t("bsa")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="bmi"
                    name="bmi"
                    value={payload?.bmi}
                    onChange={handleChange}
                    lable={t("bmi")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="diagnosis"
                    name="diagnosis"
                    value={payload?.diagnosis}
                    onChange={handleChange}
                    lable={t("diagnosis")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="T"
                    name="t"
                    value={payload?.t}
                    onChange={handleChange}
                    lable={t("t")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="n"
                    name="n"
                    value={payload?.n}
                    onChange={handleChange}
                    lable={t("N")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="M"
                    name="m"
                    value={payload?.m}
                    onChange={handleChange}
                    lable={t("M")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="stage"
                    name="stage"
                    value={payload?.stage}
                    onChange={handleChange}
                    lable={t("stage")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="histology"
                    name="histology"
                    value={payload?.histology}
                    onChange={handleChange}
                    lable={t("histology")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="others"
                    name="others"
                    value={payload?.others}
                    onChange={handleChange}
                    lable={t("others")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <TextAreaInput
                    type="text"
                    name="chemotherapyRegime"
                    rows={2}
                    value={payload?.chemotherapyRegime}
                    onChange={handleChange}
                    lable={t("Chemotherapy Regiment")}
                    placeholder=" "
                    respclass=" col-sm-6 col-12"
                    className="form-control required-fields"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="doctorName"
                    name="doctorName"
                    value={payload?.doctorName}
                    onChange={handleChange}
                    lable={t("doctor Name")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="sign"
                    name="sign"
                    value={payload?.sign}
                    onChange={handleChange}
                    lable={t("sign")}
                    placeholder=""
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                />
                <DatePicker
                    className={`custom-calendar `}
                    respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    id="date"
                    name="date"
                    inputClassName={"required-fields"}
                    value={payload?.date ? payload?.date : ""}
                    handleChange={handleChange}
                    lable={t("Date")}
                    placeholder={VITE_DATE_FORMAT}
                />
            </div>
            <div className='p-2'>
                <button className="btn btn-sm btn-success" type="button" style={{ float: "right" }} onClick={HandleSave}>
                    {payload?.id === 0 ? t("Save") : t("Update")}
                </button>
            </div>
            {tableData?.length > 0 ?
                <>
                    <Heading title={t("Data List")} />
                    <Tables thead={THEAD} tbody={tableData?.map((item, index) => ({
                        SNO: index + 1,
                        PatientID: item?.pateintId,
                        createdBy: item?.createdby,
                        Edit: <i className="fa fa-edit" aria-hidden="true" onClick={() => { handleEdit(item) }}></i>
                    }))}
                    />
                </>
                : ""
            }
        </div>
    )
}

export default ChemotherapyTreatmentSheet;