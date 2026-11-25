import React, { useState } from "react";
import TextAreaInput from "../../../formComponent/TextAreaInput";
import { useTranslation } from "react-i18next";
import { notify } from "../../../../utils/utils";

const DeletePackageModal = ({ setRemark, onReject }) => {
    const [t] = useTranslation();
    const [rejectReason, setRejectReason] = useState("");

    const handleIndicator = (state) => {
        return (
            <div className="text-danger">
                (max 200 Character) <span className="text-dark">{t("Remaining :")} </span>
                <span className="text-success">{200 - (state?.length || 0)}</span>
            </div>
        );
    };

    const handleChange = (e, type) => {
        const value = e.target.value;

        if (type === "Reason") {
            if (value.length <= 200) {
                setRejectReason(value);
                setRemark(value); 
            }
        }
    };

    const handleReject = () => {
        if (!rejectReason?.trim()) {
            notify(t("Please enter reason"),"error");
        }
        onReject?.(rejectReason);
    };

    return (
        <>
            <div className="row">
                <TextAreaInput
                    respclass={"col-12"}
                    name="Reason"
                    lable={"Reason"}
                    id={"Reason"}
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => handleChange(e, "Reason")}
                />
                <div className="col-12">{handleIndicator(rejectReason)}</div>
            </div>

            <div className="d-flex align-items-center justify-content-end">
                <button
                    className="btn btn-sm btn-danger mx-1"
                    onClick={handleReject}
                >
                    {t("Reject")}
                </button>
            </div>
        </>
    );
};

export default DeletePackageModal;