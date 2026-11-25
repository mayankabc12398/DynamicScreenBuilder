import React, { useEffect, useState } from "react";
import ReactSelect from "../../../formComponent/ReactSelect";
import { getWaitingTypeApi } from "../../../../networkServices/BillingsApi";
import { useTranslation } from "react-i18next";


const WaitingTypeModal = ({data, onSave }) => {
    const [t] = useTranslation();

    const [payload, setPayload] = useState({
        waitingType: "",
        TID:data?.TID,
    });

    const [waitingTypeOptions, setWaitingTypeOptions] = useState([]);


    const getWaitingTypeList = async () => {
        try {
            const res = await getWaitingTypeApi();
            const formatted = res.data.map(item => ({
                label: item.waitingType,
                value: item.id
            }));

            setWaitingTypeOptions(formatted);
        } catch (err) {
            console.error("Waiting Type API Error:", err);
        }
    };

    useEffect(() => {
        getWaitingTypeList();
    }, []);


    const handleReactSelect = (name, value) => {
        setPayload({
            ...payload,
            [name]: value?.value
        });
    };


    
    return (
        <>
            <div className="row">
                <ReactSelect
                    placeholderName="Select Waiting Type"
                    name="waitingType"
                    value={payload.waitingType}
                    handleChange={handleReactSelect}
                    dynamicOptions={waitingTypeOptions}
                    searchable={true}
                    respclass="col-xl-12 col-md-12 col-sm-12 col-12"
                    requiredClassName="required-fields"
                />
            </div>

            <div className="d-flex align-items-center justify-content-end mt-3">
                <button
                    className="btn btn-sm btn-primary"
                    onClick={() => onSave(payload)}
                >
                    {t("Save")}
                </button>
            </div>
        </>
    );
};

export default WaitingTypeModal;
