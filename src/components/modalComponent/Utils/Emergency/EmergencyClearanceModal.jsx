import React from 'react'
import { useTranslation } from "react-i18next";

const EmergencyClearanceModal = ({name}) => {
    const [t] = useTranslation();
    return (
        <>
            <div className="row">
                <div className="col-sm-12 text-center">
                    <div>
                        <label className="text-danger bold"> {t("Are you Sure!")}</label>
                    </div>
                    <label> {name}</label>
                </div>
            </div>
        </>
    )
}

export default EmergencyClearanceModal
