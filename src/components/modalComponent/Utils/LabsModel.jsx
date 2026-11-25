import React, { useEffect, useState } from 'react'
import Heading from '../../UI/Heading';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { notify } from '../../../utils/ustil2';
import { getLabToPrintNewApi } from '../../../networkServices/Emergency';
import ReactSelect from '../../formComponent/ReactSelect';
import ColorCodingSearch from '../../commonComponents/ColorCodingSearch';
import DatePicker from '../../formComponent/DatePicker';
import Tables from '../../UI/customTable';
import { Checkbox } from 'primereact/checkbox';

const LabsModel = ({ data, onSave }) => {

    // useTranslation must come before anything that calls t(). invType below is
    // built during render, so with the hook declared after it the const was still
    // in its temporal dead zone and the component threw
    // "Cannot access 't' before initialization" the moment it mounted.
    const [t] = useTranslation();
    const [values, setValues] = useState({
        fromDate: new Date(),
        toDate: new Date(),
    })
    const invType = [
        { label: t("Labortory"), value: "Lab" },
        { label: t("Radiology"), value: "Rad" },
        { label: t("All"), value: "All" },
    ]
    const [list, setList] = useState([])
    const { VITE_DATE_FORMAT } = import.meta.env;
    const getLabList = async () => {
        const payload = {
            pid: data?.PatientID,
            status: data?.Status,
            fromDate: moment(values?.fromDate).format("DD-MM-YYYY"),
            toDate: moment(values?.toDate).format("DD-MM-YYYY"),
            labDepartmentType: "All"
        }
        const res = await getLabToPrintNewApi(payload)
        if (res?.success) {
            notify(res?.message, "success")
            setList(res?.data)
        } else {
            notify(res?.message, "error")
            setList([])
        }
    }
    useEffect(() => {
        getLabList();
    }, []);

    const THEAD = [
        t("S.No"),
        { name: t("Delta Check"), width: "4%", textAlign: "center" },
        { name: t("Date"), width: "8%", textAlign: "center" },
        { name: t("BarcodeNo"), width: "10%", textAlign: "center" },
        { name: t("Department"), width: "12%", textAlign: "center" },
        { name: t("Approve"), width: "6%", textAlign: "center" },
        { name: t("Ack"), width: "6%", textAlign: "center" },
        { name: t("Ack By"), width: "8%", textAlign: "center" },
        { name: t("Investigations"), width: "14%", textAlign: "center" }, // clickable link column
        { name: t("Remark"), width: "10%", textAlign: "center" },
        { name: t("File"), width: "8%", textAlign: "center" },
        { name: t("Recollect Reason"), width: "12%", textAlign: "center" }
    ];
    const handleReactSelect = (name, value) => {
        setValues({
            ...values,
            [name]: value?.value
        });
    };
    const handleChange = (e) => {
        setValues((val) => ({ ...val, [e.target.name]: e.target.value }))
    }


    const filteredTableData = (type) => {
        // debugger
        const updatedTableList = list.length > 0 && list?.filter((item) => {

            // if (type === "mlc") {
            //     return item?.mlc === "1";
            // }
            // else if (type === "isPatientReceived") {
            //     return item?.isPatientReceived === "0";
            // }
            // else if (type === "amtpaid") {
            //     return item?.amtpaid === "0";
            // }
            // else if (type === "aboveThresholdLimit") {
            //     return item?.aboveThresholdLimit === "1"
            // }
            // else if (type === "belowThresholdLimit") {
            //     return item?.belowThresholdLimit === "0"
            // }
            // else if (type === "creditPanelLimitOver") {
            //     return item?.creditPanelLimitOver === "1"
            // }

        }
        )

        setList((prev) => {
            return {
                ...prev,
                SearchPatient: updatedTableList,
            };
        })
    }
    const handleSearch = () => {
        getLabList();
    }
    const handleChangeList = (list) => {

    }
    return (
        <div>
            <div className='row m-2'>
                <ReactSelect
                    placeholderName="lab Department Type"
                    name="labDepartmentType"
                    value={values.labDepartmentType}
                    handleChange={handleReactSelect}
                    dynamicOptions={invType}
                    searchable={true}
                    respclass="col-xl-3 col-md-4 col-sm-4 col-12"
                    requiredClassName="required-fields"
                />

                <DatePicker
                    className="custom-calendar"
                    id="fromDate"
                    name="fromDate"
                    lable={t("FromDate")}
                    value={moment(values?.fromDate).toDate()}
                    handleChange={handleChange}
                    placeholder={VITE_DATE_FORMAT}
                    respclass={"col-xl-3 col-md-4 col-sm-4 col-12"}
                />
                <DatePicker
                    className="custom-calendar"
                    id="toDate"
                    name="toDate"
                    value={moment(values?.toDate).toDate()}
                    handleChange={handleChange}
                    lable={t("ToDate")}
                    placeholder={VITE_DATE_FORMAT}
                    respclass={"col-xl-3 col-md-4 col-sm-4 col-12"}
                />
                <button className='btn btn-sm btn-primary' onClick={handleSearch}>{t("Search")}</button>
            </div>
            <div className='row p-2 m-2'>

                <ColorCodingSearch color="#f5f3b2" label={t("Test Prescribed")} onClick={() => filteredTableData("mlc")} />
                <ColorCodingSearch color="#CC99FF" label={t("Sample Collected")} onClick={() => filteredTableData("mlc")} />
                <ColorCodingSearch color="#00ffff" label={t("Department Received")} onClick={() => filteredTableData("mlc")} />
                <ColorCodingSearch color={"blue"} label={t("Not Approve")} onClick={() => filteredTableData("mlc")} />
                <ColorCodingSearch color={"#90ee90"} label={t("Approve")} onClick={() => filteredTableData("mlc")} />
                <ColorCodingSearch color={"#ffff00"} label={t("Hold")} onClick={() => filteredTableData("mlc")} />
                <ColorCodingSearch color={"#ff0000"} label={t("Critical")} onClick={() => filteredTableData("mlc")} />
                <ColorCodingSearch color={"#fe53f1"} label={t("Sample To Recollect")} onClick={() => filteredTableData("mlc")} />

            </div>
            {list?.length > 0 ?
                <>
                    <Heading title={t("Investigation Details")} />
                    <Tables
                        thead={THEAD}
                        tbody={list?.map((item, index) => ({
                            SNo: index + 1,
                            Delta: "",
                            Date: item?.DATE,
                            BarcodeNo: item?.BarcodeNo,
                            Department: item?.Department,
                            Approve: item?.Approved,
                            Ack: <Checkbox type='checkbox' name='isCurrent' checked={item?.isoutsource == 1 ? true : false} onChange={handleChangeList(item)} />,
                            AckBy: "",
                            Investigations: item?.InvestigationID,
                            Remark: item?.Remark,
                            File: item?.File,
                            RecollectReason: ""

                        }))}
                        scrollView={"scrollView"}

                    />
                </>
                : ""
            }
        </div>
    )
}

export default LabsModel;