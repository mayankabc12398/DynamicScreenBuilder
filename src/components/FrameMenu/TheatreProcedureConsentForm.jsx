import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Input from '../formComponent/Input';
import ReactSelect from '../formComponent/ReactSelect';
import Heading from '../UI/Heading';
import Tables from '../UI/customTable';
import { notify } from '../../utils/utils';
import { BindGridDetailTHEATREPROCEDURE, GetEditTheatreProcedure, SaveTheatreProcedure, UpdateTheatreProcedure } from '../../networkServices/nursingWardAPI';

function TheatreProcedureConsentForm({ data }) {
    const { t } = useTranslation();

    const initialValue = {
        id: 0,
        patientID: "",
        transactionID: "",
        modeofPayment: "",
        patientConsentName: "",
        consentName: "",
        procedureName: "",
        consentNameForminors: "",
        relationWithPatient: "",
        voluntarilyName: "",
        gurdianID: "",
    }
    const [values, setValues] = useState(initialValue);
    const [state, setState] = useState([])
    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleReactSelectChange = (name, val) => {
        setValues((prev) => ({
            ...prev,
            [name]: val,
        }));
    }

    const paymentOptions = [
        { label: t("Cash"), value: '1' },
        { label: t("Insurance"), value: '2' },
        { label: t("Corporate"), value: '3' },
    ];
    const getBindTabelData = async () => {

        try {
            const res = await BindGridDetailTHEATREPROCEDURE(data?.patientID, data?.transactionID)
            if (res.success) {
                setState(res?.data)
            }
        } catch (error) {
            notify(error.message, "error")
        }
    }

    const handleSave = async () => {
        if (values?.id) {
            debugger
            const updatePayload = {
                ...values,
                patientID: data?.patientID,
                transactionID: data?.transactionID,
                modeofPayment: values?.modeofPayment?.value
            };

            try {
                const res = await UpdateTheatreProcedure(updatePayload)
                if (res.success) {
                    notify(res.message, "success")
                    getBindTabelData()
                    setValues({ ...initialValue })
                }
            } catch (error) {
                notify(error.message, "error")
            }
        } else {
            debugger
            const savePayload = {
                ...values,
                patientID: data?.patientID,
                transactionID: data?.transactionID,
                modeofPayment: values?.modeofPayment?.value
            };
            try {
                const res = await SaveTheatreProcedure(savePayload)
                if (res.success) {
                    notify(res.message, "success")
                    getBindTabelData()
                    setValues({ ...initialValue })
                }
            } catch (error) {
                notify(error.message, "error")
            }
        }


    }
    const handleEdit = async (id) => {
        debugger
        try {
            const res = await GetEditTheatreProcedure(id)
            if (res.success) {
                const item = res?.data[0]
                setValues({
                    ...values,
                    id: item?.Id,
                    modeofPayment: item?.ModeofPayment,
                    patientConsentName: item?.PatientConsentName,
                    consentName: item?.ConsentName,
                    procedureName: item?.ProcedureName,
                    consentNameForminors: item?.ConsentNameForminors,
                    relationWithPatient: item?.RelationWithPatient,
                    voluntarilyName: item?.VoluntarilyName,
                    gurdianID: item?.GurdianID,
                })
            }
        } catch (error) {
            notify(error.message, "error")
        }
    }

    const historyData = [
        {
            SrNo: 1,
            modeOfPayment: 'null',
            PatientConsentName: 'null',
            CreatedBy: 'Mr. Administrator',
            CreatedDatetime: '20-Dec-2025',
        },
    ];

    const thead = [
        { name: t('SrNo') },
        { name: t('Mode of payment') },
        { name: t('Patient ConsentName') },
        { name: t('CreatedBy') },
        { name: t('CreatedDatetime') },
        { name: t('Action'), width: '3%' },
    ];

    useEffect(() => {
        getBindTabelData()
    }, [])

    return (
        <>
            <div className="card patient_registration border mt-1">
                <Heading title={t('THEATRE/PROCEDURE CONSENT FORM')} isBreadcrumb={false} />

                <div className="p-3">
                    <Heading title={t('Entry details')} isBreadcrumb={false} />
                    <div className="mb-4 row align-items-center">
                        <div className="col-xl-1 col-md-3 col-sm-4">
                            <strong>{t('Mode of payment')} :</strong>
                        </div>
                        <ReactSelect
                            placeholderName={t("Select Mode of Payment")}
                            searchable={true}
                            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                            id="modeofPayment"
                            name="modeofPayment"
                            value={values?.modeofPayment}
                            removeIsClearable={false}
                            requiredClassName="required-fields"
                            dynamicOptions={paymentOptions}
                            handleChange={handleReactSelectChange}
                        />
                    </div>

                    <div className="mb-4">
                        <strong>{t("(A) Patient's Consent")}</strong>

                        <div className="d-flex align-items-center flex-wrap mt-2">
                            <strong className="me-1">{t("I,")}</strong>

                            <Input
                                type="text"
                                className="form-control d-inline-block mx-1"
                                style={{ width: "300px" }}
                                name="patientConsentName"
                                id="patientConsentName"
                                value={values.patientConsentName}
                                onChange={handleChange}
                            />

                            <span className="ms-1">
                                <b> being over 18 years, hereby voluntarily give my consent to undergo the
                                    operation / procedure of</b>
                            </span>

                            <Input
                                type="text"
                                className="form-control d-inline-block mx-1"
                                style={{ width: "400px" }}
                                name="procedureName"
                                id="procedureName"
                                value={values.procedureName}
                                onChange={handleChange}
                            />

                            <span>
                                <b>. The nature, risks and benefits of the operation, and alternative
                                    management options (as listed overleaf) have been fully explained to me.
                                    I also consent to further operation the doctor may find necessary during
                                    the course of the above said operation and the administration of
                                    General/Regional/Local Anaesthesia/IV Sedation/Monitored Anaesthesia Care
                                    (MAC).</b>
                            </span>
                        </div>
                    </div>
                    <div className="mb-4">
                        <strong>
                            {t("(B) Consent for minors/unconscious/mentally unstable/emergency cases:")}
                        </strong>

                        <div className="d-flex align-items-center flex-wrap mt-2">
                            <span className="me-1">I,</span>

                            <Input
                                type="text"
                                className="form-control d-inline-block mx-1"
                                style={{ width: "300px" }}
                                name="consentNameForminors"
                                id="consentNameForminors"
                                value={values.consentNameForminors}
                                onChange={handleChange}
                            />

                            <span className="mx-1"><b>{t("Relationship with patient:")}</b></span>

                            <Input
                                type="text"
                                className="form-control d-inline-block mx-1"
                                style={{ width: "250px" }}
                                name="relationWithPatient"
                                id="relationWithPatient"
                                value={values.relationWithPatient}
                                onChange={handleChange}
                            />

                            <span className="mx-1"><b>{t("do hereby voluntarily give my consent for")}</b></span>

                            <Input
                                type="text"
                                className="form-control d-inline-block mx-1"
                                style={{ width: "400px" }}
                                name="voluntarilyName"
                                id="voluntarilyName"
                                value={values.voluntarilyName}
                                onChange={handleChange}
                            />

                            <span>
                                <b>to be done on the above named. The nature, risks and benefits of the
                                    operation have been fully explained to me. I also consent to further
                                    operation the doctor may find necessary during the course of the above
                                    said operation and the administration of General/Regional/Local
                                    Anaesthesia/IV Sedation/Monitored Anaesthesia Care (MAC).</b>
                            </span>
                        </div>

                        <div className="d-flex align-items-center mt-3">
                            <strong className="me-2">
                                {t("Parent/Next of Kin/Guardian's ID/Passport No.:")}
                            </strong>

                            <Input
                                type="text"
                                className="form-control d-inline-block"
                                style={{ width: "300px" }}
                                name="gurdianID"
                                id="gurdianID"
                                value={values?.gurdianID}
                                onChange={handleChange}
                            />
                        </div>
                    </div>



                    <div className="text-center mb-4">
                        <button className="btn btn-info text-white" onClick={handleSave}>{values?.id? t('Update'):t('Save')}</button>
                    </div>
                    {state.length > 0 && (
                        <Tables thead={thead} tbody={
                            state?.map((val, index) => (
                                {
                                    "S.No": index + 1,
                                    ModeofPayment: val?.ModeofPayment === "1" ? "CASH" : val?.ModeofPayment === "2" ? "Insurance" : val?.ModeofPayment === "Corporate",
                                    PatientConsentName: val?.PatientConsentName,
                                    CreatedBy: val?.CreatedBy,
                                    CreatedDate: val?.CreatedDate,
                                    action: (
                                        <>
                                            <i className="fa fa-edit" aria-hidden="true" onClick={() => handleEdit(val?.Id)} />
                                        </>
                                    ),
                                }
                            ))
                        } />
                    )}
                </div>
            </div>
        </>
    );
}

export default TheatreProcedureConsentForm;