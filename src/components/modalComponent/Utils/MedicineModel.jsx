import React, { useEffect, useState } from 'react'
import Heading from '../../UI/Heading';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { notify } from '../../../utils/ustil2';
import { getMedicineRequestApi } from '../../../networkServices/Emergency';
import ReactSelect from '../../formComponent/ReactSelect';
import ColorCodingSearch from '../../commonComponents/ColorCodingSearch';
import DatePicker from '../../formComponent/DatePicker';
import Tables from '../../UI/customTable';
import { Checkbox } from 'primereact/checkbox';

const MedicineModel = ({ data, onSave }) => {

    const [values, setValues] = useState({
        TransactionID: data?.TID,
    })

    const [t] = useTranslation();
    const [list, setList] = useState([])
    const { VITE_DATE_FORMAT } = import.meta.env;
    const getList = async () => {
        const res = await getMedicineRequestApi(values?.TransactionID)
        if (res?.success) {
            notify(res?.message, "success")
            setList(res?.data)
        } else {
            notify(res?.message, "error")
            setList([])
        }
    }
    useEffect(() => {
        // getList();
    }, []);

    const THEAD = [
        t("S.No"),
        { name: t("medicineName"), width: "1%" },
        { name: t("dose"), width: "1%" },
        { name: t("reqQty"), width: "1%" },
        { name: t("duration"), width: "1%" },
        { name: t("intervalName"), width: "1%" },
        { name: t("date"), width: "1%" },
    ];


    const filteredTableData = (type) => {
        // debugger
        const updatedTableList = list.length > 0 && list?.filter((item) => {
            debugger
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

        setBodyData((prev) => {
            return {
                ...prev,
                SearchPatient: updatedTableList,
            };
        })
    }
    return (
        <div>

            <Heading title={t("Patient Medicine Request")}
                secondTitle={
                    <>
                        <ColorCodingSearch color={"#add8e6"} label={t("Open")} onClick={() => filteredTableData("mlc")} />
                        <ColorCodingSearch color={"#9acd32"} label={t("Close")} onClick={() => filteredTableData("mlc")} />
                        <ColorCodingSearch color={"#ffb6c1"} label={t("Reject")} onClick={() => filteredTableData("mlc")} />
                        <ColorCodingSearch color={"#ffff00"} label={t("Partial")} onClick={() => filteredTableData("mlc")} />
                    </>
                }
            />
            {list?.length > 0 ?
                <Tables
                    thead={THEAD}
                    tbody={list?.map((item, index) => ({
                        SNo: index + 1,
                        medicineName: item?.medicineName,
                        dose: item?.dose,
                        reqQty: item?.reqQty,
                        duration: item?.duration,
                        intervalName: item?.intervalName,
                        date: item?.date

                    }))}
                    scrollView={"scrollView"}
                />
                : ""
            }

        </div>
    )
}

export default MedicineModel;