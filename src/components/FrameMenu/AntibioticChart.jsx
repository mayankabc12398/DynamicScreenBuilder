
import React, { useEffect, useState } from 'react'
import Heading from '../UI/Heading';
import { useTranslation } from 'react-i18next';
import DatePicker from '../formComponent/DatePicker';
import Input from '../formComponent/Input';
import { saveAntibioticChartApi, getListOfAntibioticChartApi, updateAntibioticChartApi, antibioticReportPrintApi } from '../../networkServices/nursingWardAPI';
import { notify } from '../../utils/ustil2';
import moment from 'moment';
import Tables from '../UI/customTable';
import { RedirectURL } from '../../networkServices/PDFURL';
const AntibioticChart = ({ data }) => {
    console.log(data);

    const { transactionID, patientID, doctorID } = data;
    const [t] = useTranslation()
    const THEAD = [
        { name: t("SNo") },
        { name: t("Antibiotic Name and Dosage") },
        { name: t("StartDate") },
        { name: t("EndDate") },
        { name: t("Reason for Stopping") },
        { name: t("Culture Results") },
        { name: t("EntryDate") },
        { name: t("Entry By") },
        { name: t("Action") },
    ]
    const { VITE_DATE_FORMAT } = import.meta.env;
    const [values, setValues] = useState({
        AntibioticName: "",
        StartDate: new Date(),
        EndDate: new Date(),
        Reason: "",
        CultureResult: ""
    })
    const [Editindex, setIndex] = useState(null);
    const [tableData, setTableData] = useState([])
    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues({
            ...values,
            [name]: value,
        });
    };

    const handlePrintAPI = async () => {
        const payload = {
            tid: transactionID,
            emgNo: ""
        }
        const res = await antibioticReportPrintApi(payload)
        if (res?.success) {
            RedirectURL(res?.data?.pdfUrl);
        } else {
            notify(res?.message, "error")
        }
    }

    const handleSaveAPI = async () => {
        try {
            const payload = {
                AntibioticName: values?.AntibioticName,
                startDate: values?.StartDate ? moment(values?.StartDate).format("YYYY-MM-DD") : "",
                endDate: values?.EndDate ? moment(values?.EndDate).format("YYYY-MM-DD") : "",
                reasonForStopping: values?.Reason,
                cultureResult: values?.CultureResult,
                transactionID: transactionID,
                patientID: patientID,
                doctorID: doctorID
            }
            const response = await saveAntibioticChartApi(payload)
            debugger
            if (response?.success) {
                notify(response?.message,"success")
                setValues({
                    AntibioticName: "",
                    StartDate: new Date(),
                    EndDate: new Date(),
                    Reason: "",
                    CultureResult: ""
                })
                fetchData()
            } else {
                notify(response?.message, "error")
                setTableData([])
            }
        } catch (error) {
            console.log(error);

        }
    }
    const fetchData = async () => {
        const res = await getListOfAntibioticChartApi(transactionID);
        if (res?.success) {
            setTableData(res?.data)
        } else {
            notify(res?.message, "error")
            setTableData([])
        }
    }

    const handleEditTable = (item) => {
        setValues({
            ...values,
            id: item?.ID,
            AntibioticName: item?.AntibioticName,
            StartDate: item?.StartDate ? new Date(item?.StartDate) : "",
            EndDate: item?.EndDate ? new Date(item?.EndDate) : "",
            Reason: item?.ReasonforStopping,
            CultureResult: item?.CultureResult,
        })
    }
    const handleUpdateAPI = async () => {
        const payload = {
            antibioticName: values?.AntibioticName,
            startDate: values?.StartDate ? moment(values?.StartDate).format("YYYY-MM-DD") : "",
            endDate: values?.EndDate ? moment(values?.EndDate).format("YYYY-MM-DD") : "",
            reasonForStopping: values?.Reason,
            cultureResult: values?.CultureResult,
            id: values?.id
        }
        try {
            const res = await updateAntibioticChartApi(payload)
            if (res?.success) {
                notify(res?.message, "success")
                setValues({
                    AntibioticName: "",
                    StartDate: new Date(),
                    EndDate: new Date(),
                    Reason: "",
                    CultureResult: ""
                })
                fetchData()
            } else {
                notify(res?.message, "error");
            }
        } catch (error) {
            console.log(error);

        }
    }
    useEffect(() => {
        fetchData()
    }, [])
    console.log(values);

    return (
        <div className="mt-2 spatient_registration_card">
            <div className="patient_registration card">
                <Heading
                    title={t("Antibiotic Chart")}
                    isBreadcrumb={false}
                />
                <div className="row p-2">

                    <Input
                        type="text"
                        className="form-control"
                        lable={t("Antibiotic Name")}
                        placeholder=""
                        name="AntibioticName"
                        id="AntibioticName"
                        value={values?.AntibioticName}
                        respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                        onChange={handleChange}
                    />
                    <DatePicker
                        className="custom-calendar"
                        placeholder={VITE_DATE_FORMAT}
                        lable={t("start date")}
                        respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
                        name="StartDate"
                        id="StartDate"
                        value={values?.StartDate}
                        showTime
                        hourFormat="12"
                        minDate={new Date()}
                        maxDate={new Date()}
                        handleChange={handleChange}
                    />
                    <DatePicker
                        className="custom-calendar"
                        placeholder={VITE_DATE_FORMAT}
                        lable={t("end date")}
                        respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
                        name="EndDate"
                        id="EndDate"
                        value={values?.EndDate}
                        showTime
                        hourFormat="12"
                        minDate={new Date()}
                        handleChange={handleChange}
                    />

                    <Input
                        type="text"
                        className="form-control"
                        lable={t("Reason")}
                        placeholder=""
                        name="Reason"
                        id="Reason"
                        value={values?.Reason}
                        respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                        onChange={handleChange}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        lable={t("Culture Result")}
                        placeholder=""
                        name="CultureResult"
                        id="CultureResult"
                        value={values?.CultureResult}
                        respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                        onChange={handleChange}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={values?.id ? handleUpdateAPI : handleSaveAPI}
                    >
                        {values?.id ? t("Update") : t("Save")}
                    </button>
                    <button
                        className="btn btn-primary ml-2"
                        onClick={handlePrintAPI}
                    >
                        {t("Print")}
                    </button>
                </div>

                {tableData?.length > 0 && (
                    <>
                        <Heading title={t("Antibiotic Chart List")} />
                        <Tables
                            thead={THEAD}
                            tbody={tableData?.map((item, index) => ({
                                SNo: index + 1,
                                AntibioticName: item?.AntibioticName,
                                startDate: item?.StartDate,
                                endDate: item?.EndDate,
                                reason: item?.ReasonforStopping,
                                Culture: item?.CultureResult,
                                entryDate: item?.EntryDate,
                                EntryBy: item?.EName,
                                Action: (
                                    <div className="p-1 text-center">
                                        <span className="mx-1" onClick={() => handleEditTable(item)}>
                                            <i className="fa fa-edit" aria-hidden="true"></i>
                                        </span>
                                    </div>
                                )
                            }))}
                        />
                    </>
                )}
            </div>
        </div>
    )
}

export default AntibioticChart