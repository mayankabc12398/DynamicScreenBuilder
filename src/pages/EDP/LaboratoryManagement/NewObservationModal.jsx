import React, { useEffect, useState } from 'react'
import Input from '../../../components/formComponent/Input'
import { useTranslation } from 'react-i18next'

export default function NewObservationModal({ setHandleModelData, handleModelData }) {
    const [t] = useTranslation()

    useEffect(() => {
        setHandleModelData((val) => ({ ...val, modalData: {} }))
    }, [])

    const handleChange = (e) => {
        setHandleModelData((val) => ({ ...val, modalData: { ...val.modalData, [e.target.name]: e.target.value } }));
    };

    return (
        <div className='row'>

            <Input
                type="text"
                className="form-control"
                id="AddObservation"
                removeFormGroupClass={false}
                name="AddObservation"
                lable={t("Add Observation")}
                required={true}
                placeholder=""

                onChange={handleChange}
                value={handleModelData?.modalData?.AddObservation}
                respclass={"col-6"}
            />
            <Input
                type="text"
                className="form-control"
                id="Suffix"
                removeFormGroupClass={false}
                name="Suffix"
                lable={t("Suffix")}
                placeholder=""

                required={true}
                onChange={handleChange}
                value={handleModelData?.modalData?.Suffix}
                respclass={"col-6"}
            />



        </div>
    )
}
