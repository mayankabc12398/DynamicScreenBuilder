import React, { useEffect, useState } from "react";
import ReactSelect from "../../../formComponent/ReactSelect";
import { getTriagingCodesApi } from "../../../../networkServices/BillingsApi";
import { useTranslation } from "react-i18next";

const TriagingSaveModal = ({ onSave }) => {
    const [t] = useTranslation();

    const [payload, setPayload] = useState({
        triageCode: ""
    });

    const [triageOptions, setTriageOptions] = useState([]);

    // Load triage list from API
    const getTriagingList = async () => {
        try {
            const res = await getTriagingCodesApi();

            const formatted = res.data.map(item => ({
                label: item.CodeType,
                value: item.ID
            }));

            setTriageOptions(formatted);
        } catch (err) {
            console.error("Triaging list fetch error:", err);
        }
    };

    useEffect(() => {
        getTriagingList();
    }, []);

    // Handle select
    const handleReactSelect = (name, value) => {
        const updated = {
            ...payload,
            [name]: value?.value
        };

        setPayload(updated);
        // getPayloadData(updated);   // send updated payload to parent immediately
    };

    return (
        <>
            <div className="row">
                <ReactSelect
                    placeholderName="Triaging Codes"
                    name="triageCode"
                    value={payload.triageCode}
                    handleChange={handleReactSelect}
                    dynamicOptions={triageOptions}
                    searchable={true}
                    respclass="col-xl-12 col-md-12 col-sm-12 col-12"
                    requiredClassName="required-fields"
                />

            </div>
            <div className="d-flex align-items-center justify-content-end mt-3">
                <button
                    className="btn btn-sm btn-primary"
                    onClick={() => onSave(payload)}   // send payload directly
                >
                    {t("Save")}
                </button>
            </div>
        </>
    );
};

export default TriagingSaveModal;
