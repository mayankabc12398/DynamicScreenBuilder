import React, { useEffect, useState } from "react";
import { handleReactSelectDropDownOptions } from "../../../utils/utils";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { GetAllDoctor } from "../../../store/reducers/common/CommonExportFunction";
import ReactSelect from "../../formComponent/ReactSelect";
import { useTranslation } from "react-i18next";

const PrimaryDoctorModel = ({ onSave }) => {
    const {t}=useTranslation()
    const [payload, setPayload] = useState({
        Doctor: ""
    });
    const dispatch = useDispatch()
    const { GetAllDoctorList } = useSelector((state) => state?.CommonSlice);


    useEffect(() => {
        dispatch(GetAllDoctor());
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
                    dynamicOptions={handleReactSelectDropDownOptions(GetAllDoctorList, "Name", "DoctorID")}
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

export default PrimaryDoctorModel;
