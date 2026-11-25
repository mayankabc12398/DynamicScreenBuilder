import React, { useEffect, useState } from 'react'
import Heading from '../UI/Heading'
import { useTranslation } from 'react-i18next'
import DatePicker from '../formComponent/DatePicker';
import TimePicker from "../formComponent/TimePicker";
import Input from '../formComponent/Input';
import Tables from '../UI/customTable';
import { bindGasBloodChart, BloodGasChartPrintOutAPI, SaveBloodGasChart, UpdateBloodGasChart } from '../../networkServices/nursingWardAPI';
import moment from 'moment';
import { notify, timeFormateDate } from '../../utils/utils';
import { RedirectURL } from '../../networkServices/PDFURL';

export default function ({ data }) {
    const [t] = useTranslation();
    const { VITE_DATE_FORMAT } = import.meta.env;

    let iniTialValue = {
        date: new Date(),
        time: new Date(),
        pid: data?.patientID,
        tid: data?.transactionID,
        type: "save",
        glucose: "",
        hct: "",
        hb: "",
        calcium: "",
        spo2: "",
        na: "",
        hco3: "",
        totalCo2: "",
        ph: "",
        pO2: "",
        pcO2: "",
        addedO2: "",
        site: "",
        rateorP: "",
        peepCPap: "",
        pipmap: "",
        fio2: "",
        NotIssued: "",
        mode: "",
        stdBicarbonate: "",
        k: "",
        actiontaken: "",
        lactate: "",
        basedeficit: ""
    }
    const [values, setValues] = useState(iniTialValue)
    const [tbody, setTbody] = useState([1])

    const thead = [
        { width: "1%", name: t("SNo") },
        { name: t("Date") },
        { name: t("Time") },
        { name: t("FiO2") },
        { name: t("PIP or MAP") },
        { name: t("PEEP or CPAP") },
        { name: t("Rate or P") },
        { name: t("Site") },
        { name: t("pCO2") },
        { name: t("Added O2") },
        { name: t("pO2") },
        { name: t("pH") },
        { name: t("HCO3") },
        { name: t("Spo2") },
        { name: t("TotalCo2") },
        { name: t("Na+") },
        { name: t("Calcium") },
        { name: t("K") },
        { name: t("Glucose") },
        { name: t("HCT") },
        { name: t("HB") },
        { name: t("EntryBy") },
        { width: "2%", name: t("Edit") },
    ]


    const handleEdit = (val) => {
        debugger
        setValues((item) => ({
            ...iniTialValue,
            type: "edit",
            date: new Date(val?.DATE),
            time: timeFormateDate(val?.TIME),
            fio2: val?.FiO2,
            pipmap: val?.PIPorMAP,
            peepCPap: val?.PEEPorCPAP,
            rateorP: val?.RateorP,
            site: val?.Site,
            pcO2: val?.pCO2,
            addedO2: val?.AddedO2,
            pO2: val?.pO2,
            ph: val?.pH,
            hco3: val?.HCO3,
            spo2: val?.SPO2,
            totalCo2: val?.TotalCO2,
            na: val?.Na,
            calcium: val?.Calcium,
            k: val?.K,
            glucose: val?.Glucose,
            hct: val?.hct,
            hb: val?.hb,
            id: val?.ID,
            mode: val?.MODE,
            stdBicarbonate: val?.StdBicarbonate,
            basedeficit: val?.Basedeficit,
            lactate: val?.Lactate,
            actiontaken: val?.ActionTaken,
            createdDate: val?.CreatedDate,
        }))
    }

    const SearchGasBloodChart = async () => {
        let apiResp = await bindGasBloodChart(data?.transactionID)

        if (apiResp?.success) {
            let data = []
            apiResp?.data?.map((val, i) => {
                let obj = {}
                obj.sno = i + 1
                obj.date = val?.DATE ? moment(val?.DATE).format("DD-MM-YYYY") : ""
                obj.time = val?.TIME ? moment(val?.Time).format("HH:mm") : ""
                obj.fio2 = val?.FiO2
                obj.pipmap = val?.PIPorMAP
                obj.peepCPap = val?.PEEPorCPAP
                obj.rateorP = val?.RateorP
                obj.site = val?.Site
                obj.pcO2 = val?.pCO2
                obj.addedO2 = val?.AddedO2
                obj.pO2 = val?.pO2
                obj.ph = val?.pH
                obj.hco3 = val?.HCO3
                obj.spo2 = val?.SPO2
                obj.totalCO2 = val?.TotalCO2
                obj.na = val?.Na
                obj.calcium = val?.Calcium
                obj.k = val?.K
                obj.glucose = val?.Glucose
                obj.hct = val?.hct
                obj.hb = val?.hb
                obj.EntryBy = val?.Username
                obj.edit = <i className="fa fa-edit" aria-hidden="true" onClick={() => { handleEdit(val) }}></i>
                data.push(obj);
            })
            setTbody(data);
            setValues((val) => ({ ...val, fillTimeON: val?.fillTimeON }))
        } else {
            setTbody([])
        }
    }

    useEffect(() => {
        SearchGasBloodChart()
    }, [])
    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((val) => ({ ...val, [name]: value }))
    };

    const SaveBloodGasChartAPI = async (type) => {
        // console.log("27-Aug-2024",moment(values.date).format("DD-MMM-yyyy"))
        if (!values?.date) {
            notify(t("Date field is required"), "error");
            return false
        }


        let apiResp
        if (type === "save") {
            apiResp = await SaveBloodGasChart(values);
        } else {
            const payload = {
                id: values?.id,
                date: values?.date ? moment(values.date).format("YYYY-MM-DD") : "",
                time: values?.time,
                fio2: values?.fio2,
                pipmap: values?.pipmap,
                peepCPap: values?.peepCPap,
                rateorP: values?.rateorP,
                site: values?.site,
                mode: values?.mode,
                pcO2: values?.pcO2,
                pO2: values?.pO2,
                ph: values?.ph,
                addedO2: values?.addedO2,
                na: values?.na,
                hcO3: values?.hco3,
                totalCO2: values?.totalCo2,
                spO2: values?.spo2,
                k: values?.k,
                calcium: values?.calcium,
                glucose: values?.glucose,
                hct: values?.hct,
                hb: values?.hb,
                stdBicarbonate: values?.stdBicarbonate,
                basedeficit: values?.basedeficit,
                lactate: values?.lactate,
                actiontaken: values?.actiontaken,
                tid: values?.tid,
                pid: values?.pid,
                createdDate: values?.createdDate,
            };
            apiResp = await UpdateBloodGasChart(payload);
        }

        if (apiResp?.success) {
            SearchGasBloodChart();
            setValues(iniTialValue);
            notify(apiResp?.message, "success");
        } else {
            notify(apiResp?.message, "error");
        }

        if (apiResp?.status !== 200) {
            notify(apiResp?.data?.message, "error");
        }


    }

    const handlePrint = async () => {
        try{
            const apiResp = await BloodGasChartPrintOutAPI(values?.tid);
            debugger
            if (apiResp?.success) {
                RedirectURL(apiResp?.data?.pdfUrl);
            } else {
                notify(apiResp?.message, "error")
            }
        }catch(error){
            console.log(error);
            
        }
        // OpenPDFURL("GasChartPrintOut", values?.tid);

    }

    return (
        <>
            <div className="mt-2 spatient_registration_card">
                <form className="patient_registration card">
                    <Heading
                        title={t("Blood Gas Chart")}
                        isBreadcrumb={false} />

                    <div className="row p-2">
                        <div className='col-xl-2 col-md-4 col-sm-6 col-12 d-flex'>

                            <DatePicker
                                className={`custom-calendar `}
                                respclass="vital-sign-date"
                                id="date"
                                name="date"
                                inputClassName={"required-fields"}
                                value={values?.date ? values?.date : ""}
                                handleChange={handleChange}
                                lable={t("Date")}
                                placeholder={VITE_DATE_FORMAT}
                            />
                            <TimePicker
                                placeholderName={t("Time")}
                                lable={t("Time")}
                                id="time"
                                respclass="vital-sign-time ml-1"
                                name="time"
                                value={values?.time ? values?.time : ""}
                                handleChange={handleChange}
                            />

                        </div>

                        <Input
                            type="text"
                            className="form-control "
                            id="fio2"
                            name="fio2"
                            value={values?.fio2 ? values?.fio2 : ""}
                            handleChange={handleChange}
                            onChange={handleChange}
                            lable={t("FiO2")}
                            // lable={"FiO2"}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        // placeholderLabel={"°C"}
                        />
                        <Input
                            type="text"
                            className="form-control "
                            id="pipmap"
                            name="pipmap"
                            value={values?.pipmap ? values?.pipmap : ""}
                            onChange={handleChange}
                            lable={t("PIP or MAP")}
                            // lable={"PIP or MAP"}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        // placeholderLabel={"°C"}
                        />
                        <Input
                            type="text"
                            className="form-control "
                            id="peepCPap"
                            name="peepCPap"
                            value={values?.peepCPap ? values?.peepCPap : ""}
                            onChange={handleChange}
                            lable={t("PEEP or CPAP")}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        // placeholderLabel={"°C"}
                        />
                        <Input
                            type="text"
                            className="form-control "
                            id="rateorP"
                            name="rateorP"
                            value={values?.rateorP ? values?.rateorP : ""}
                            onChange={handleChange}
                            lable={t("Rate or P")}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        // placeholderLabel={"°C"}
                        />
                        <Input
                            type="text"
                            className="form-control "
                            id="site"
                            name="site"
                            value={values?.site ? values?.site : ""}
                            onChange={handleChange}
                            lable={t("Site")}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        // placeholderLabel={"°C"}
                        />
                        {/* <Input
                            type="text"
                            className="form-control "
                            id="mode"
                            name="mode"
                            value={values?.mode ? values?.mode : ""}
                            onChange={handleChange}
                            lable={t("Mode")}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        // placeholderLabel={"°C"}
                        /> */}
                        <Input
                            type="text"
                            className="form-control "
                            id="pcO2"
                            name="pcO2"
                            value={values?.pcO2 ? values?.pcO2 : ""}
                            onChange={handleChange}
                            lable={t("pCO2")}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                            placeholderLabel={"mmHg"}
                        />
                        <Input
                            type="text"
                            className="form-control "
                            id="O2"
                            name="addedO2"
                            value={values?.addedO2 ? values?.addedO2 : ""}
                            onChange={handleChange}
                            lable={t("Added O2")}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                            placeholderLabel={"%"}
                        />
                        <Input
                            type="text"
                            className="form-control "
                            id="pO2"
                            name="pO2"
                            value={values?.pO2 ? values?.pO2 : ""}
                            onChange={handleChange}
                            lable={t("pO2")}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                            placeholderLabel={"mmHg"}
                        />
                        <Input
                            type="text"
                            className="form-control "
                            id="ph"
                            name="ph"
                            value={values?.ph ? values?.ph : ""}
                            onChange={handleChange}
                            lable={t("pH")}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        // placeholderLabel={"°C"}
                        />
                        <Input
                            type="text"
                            className="form-control "
                            id="HCO3"
                            name="hco3"
                            value={values?.hco3 ? values?.hco3 : ""}
                            onChange={handleChange}
                            lable={t("HCO3")}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                            placeholderLabel={"%"}
                        />
                        <Input
                            type="text"
                            className="form-control "
                            id="TotalCo2"
                            name="totalCo2"
                            value={values?.totalCo2 ? values?.totalCo2 : ""}
                            onChange={handleChange}
                            lable={t("Total Co2")}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                            placeholderLabel={"%"}
                        />
                        <Input
                            type="text"
                            className="form-control "
                            id="spo2"
                            name="spo2"
                            value={values?.spo2 ? values?.spo2 : ""}
                            onChange={handleChange}
                            lable={t("Spo2")}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                            placeholderLabel={"%"}
                        />
                        <Input
                            type="text"
                            className="form-control "
                            id="Na"
                            name="na"
                            value={values?.na ? values?.na : ""}
                            onChange={handleChange}
                            lable={t("Na+")}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        // placeholderLabel={""}
                        />
                        <Input
                            type="text"
                            className="form-control "
                            id="k"
                            name="k"
                            value={values?.k ? values?.k : ""}
                            onChange={handleChange}
                            lable={t("k+")}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        // placeholderLabel={""}
                        />
                        <Input
                            type="text"
                            className="form-control "
                            id="calcium"
                            name="calcium"
                            value={values?.calcium ? values?.calcium : ""}
                            onChange={handleChange}
                            lable={t("calcium")}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        // placeholderLabel={"mmHg"}
                        />
                        <Input
                            type="text"
                            className="form-control "
                            id="Glucose"
                            name="glucose"
                            value={values?.glucose ? values?.glucose : ""}
                            onChange={handleChange}
                            lable={t("Glucose")}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        // placeholderLabel={"mmHg"}
                        />
                        <Input
                            type="text"
                            className="form-control "
                            id="hct"
                            name="hct"
                            value={values?.hct ? values?.hct : ""}
                            onChange={handleChange}
                            lable={t("hct")}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        // placeholderLabel={"mmHg"}
                        />
                        <Input
                            type="text"
                            className="form-control "
                            id="hb"
                            name="hb"
                            value={values?.hb ? values?.hb : ""}
                            onChange={handleChange}
                            lable={t("hb")}
                            placeholder=" "
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        // placeholderLabel={"mmHg"}
                        />
                        <button className="btn btn-sm btn-success ml-2 mr-2" type="button" style={{ float: "right" }} onClick={handlePrint} >
                            {t("print")}
                        </button>

                        {values?.type === "save" ?

                            <button className="btn btn-sm btn-success" type="button" style={{ float: "right" }} onClick={() => { SaveBloodGasChartAPI("save") }}>
                                {t("Save")}
                            </button>
                            :
                            <button className="btn btn-sm btn-success" type="button" style={{ float: "right" }} onClick={() => { SaveBloodGasChartAPI("update") }}>
                                {t("Update")}
                            </button>
                        }
                    </div>


                </form>
            </div>

            {tbody?.length > 0 && <div className='patient_registration card'>
                <Heading
                    title={t("result")}
                    isBreadcrumb={false} />

                <Tables
                    thead={thead}
                    tbody={tbody}
                    scrollView={"scrollView"}
                />
            </div>}
        </>
    )
}
