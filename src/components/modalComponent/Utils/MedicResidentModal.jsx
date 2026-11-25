import React, { useEffect, useState } from "react";
import ReactSelect from "../../formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import { notify } from "../../../utils/ustil2";
import { getMedicResidanceCenterWiseApi } from "../../../networkServices/BillingsApi";

const MedicResidentModal = ({ onSave }) => {
    const { t } = useTranslation()
    const [payload, setPayload] = useState({
        Doctor: ""
    });
    const [data, setData] = useState([])
    const getMedicResident = async () => {
        const res = await getMedicResidanceCenterWiseApi();
        if(res?.success){
            const formatted = res.data.map(item => ({
                label: item.Name,
                value: item.DoctorID
            }));
            setData(formatted)
        }else{
            notify(res?.message,"error")
        }
    }

    useEffect(() => {
        getMedicResident()
    }, []);


    const handleReactSelect = (name, value) => {
        const updated = {
            ...payload,
            [name]: value?.value
        };

        setPayload(updated);
    };

    return (
        <>
            <div className="row">
                <ReactSelect
                    placeholderName={t("Doctor")}
                    className="form-control"
                    id={"Doctor"}
                    name="Doctor"
                    dynamicOptions={data}
                    searchable={true}
                    respclass="col-12"
                    requiredClassName={"required-fields"}
                    value={payload?.Doctor}
                    handleChange={handleReactSelect}
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

export default MedicResidentModal;
