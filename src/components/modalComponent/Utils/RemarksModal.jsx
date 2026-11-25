import React, { useEffect, useState } from "react";
import { getremarksApi } from "../../../networkServices/Emergency";
import moment from "moment";
import { useTranslation } from "react-i18next";


const RemarksModal = ({ data, onClose }) => {
    const [t] = useTranslation();

    const [payload, setPayload] = useState({
        TID: data?.TID,
    });

    const [list, setList] = useState('');
    const getAMPMTime = (dateTime) => {
        if (!dateTime) return "";
        const time = dateTime.split("T")[1];
        const [hour, minute] = time.split(":");

        let h = Number(hour);
        const suffix = h >= 12 ? "PM" : "AM";

        if (h === 0) h = 12;
        else if (h > 12) h = h - 12;

        return `${h}:${minute} ${suffix}`;
    };
    const admitDate = list[0]?.AdmitDateTime?.split("T")[0] ?? "";
    const admitTime = getAMPMTime(list[0]?.AdmitDateTime)

    const getWaitingTypeList = async () => {
        try {
            const res = await getremarksApi(payload?.TID);
            if (res?.success) {
                setList(res?.data);
            } else {
                setList('')
            }
        } catch (err) {
            console.error("Waiting Type API Error:", err);
        }
    };

    useEffect(() => {
        getWaitingTypeList();
    }, []);

    console.log(list, admitDate, admitTime);


    return (
        <>
            <div>
                {t("Admission Date :")} {admitDate}
            </div>
            <div>
                {t("Admission Time :")} {admitTime}
            </div>
            {t("Admission Remark :")}<span>{list[0]?.BillingRemarks}</span>	
            <div className="d-flex align-items-center justify-content-end mt-3">
                <button
                    className="btn btn-sm btn-primary"
                    onClick={onClose}
                >
                    {t("close")}
                </button>
            </div>
        </>
    );
};

export default RemarksModal;
