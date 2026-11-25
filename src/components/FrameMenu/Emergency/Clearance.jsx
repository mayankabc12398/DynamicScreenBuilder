import React, { useEffect, useState } from 'react';
import Heading from '../../UI/Heading';
import { useTranslation } from 'react-i18next';
import Modal from '../../modalComponent/Modal';
import EmergencyClearanceModal from '../../modalComponent/Utils/Emergency/EmergencyClearanceModal';
import { CheckClearanceAPI, SaveClearanceAPI } from '../../../networkServices/Emergency';
import { useLocalStorage } from '../../../utils/hooks/useLocalStorage';
import { notify } from '../../../utils/utils';
import DpdpDischargeCheck from "../../front-office/DpdpDischargeCheck";
export default function Clearance({ data }) {
    const { t } = useTranslation();
    /* The Emergency board hands this screen a mapped object carrying both keys;
       the Day Care board hands it the raw row, which only has TID. Reading just
       `transactionID` posted the literal string "undefined", so the UPDATE
       matched no row and the save came back 200-but-unsuccessful with no
       message - the blank red toast. */
    const TID = data?.transactionID ?? data?.TID ?? data?.TransactionID;
    const userID = useLocalStorage("userData", "get");
    const [modalData, setModalData] = useState({});
    /* `pending` is keyed by department. It used to be a single `type` number,
       which the three parallel checks below overwrote in turn - so whichever
       check answered last was the only sign-off button that rendered, and the
       other two departments could not be cleared at all. */
    const [clearanceDetail, setClearanceDetail] = useState({ pending: {} });
    const handleModal = (label, width, Component = null, API, URL) => {
        setModalData({
            visible: true,
            width: width,
            label,
            Component,
            handleInsertAPI: API,
            URL: URL,
        });
    };
    const closeModal = () => {
        setModalData((prevData) => ({ ...prevData, visible: false }));
    };

    /* success = that department has already signed off and the message says so;
       failure = not signed off yet, so the button is offered. */
    const CheckClearance = async (url) => {
        let apiResp = await CheckClearanceAPI(TID, url)
        if (apiResp?.success) {
            setClearanceDetail((val) => ({
                ...val, [url]: apiResp?.message,
                pending: { ...val.pending, [url]: false },
            }))
        } else {
            setClearanceDetail((val) => ({
                ...val, [url]: undefined,
                pending: { ...val.pending, [url]: true },
            }))
        }
    }

    const handleCheckCLR = () => {
        CheckClearance("CheckBillingClearanceEMG")
        CheckClearance("CheckNursingClearanceEMG")
        CheckClearance("CheckDoctorClearanceEMG")
    }

    useEffect(() => {
        handleCheckCLR()
    }, [])

    const handleInsertAPI = async (url) => {
        if (!TID) {
            notify(t("No visit selected"), "error")
            return
        }
        let payload = {
            id: userID?.employeeID,
            transactionID: String(TID)
        }
        const apiResp = await SaveClearanceAPI(payload, url)
        if (apiResp?.success) {
            notify(apiResp?.message, "success")
            handleCheckCLR()
            closeModal()
        } else {
            // This endpoint answers 200 with no message when the UPDATE matched
            // nothing, so a bare message raises an empty toast.
            notify(apiResp?.message || t("Clearance could not be saved."), "error")
        }

    }

    return (
        <>
            <DpdpDischargeCheck data={data} />
            <div className="card patient_registration border mt-2">
                {(clearanceDetail?.pending?.CheckDoctorClearanceEMG || clearanceDetail?.CheckDoctorClearanceEMG) && <>
                    <Heading title={t("Doctor Clearance")} />
                    <div className="row p-2 d-flex justify-content-center">
                        {clearanceDetail?.CheckDoctorClearanceEMG ?
                            <strong className='text-danger'>{clearanceDetail?.CheckDoctorClearanceEMG}</strong>
                            :
                            <div className="col-sm-1">
                                <button
                                    className="btn btn-sm btn-success"
                                    onClick={() =>
                                        handleModal(
                                            'Doctor Clearance',
                                            '20vw',
                                            <EmergencyClearanceModal name={"Do you want to clear patient from doctor department ?"} />,
                                            handleInsertAPI,
                                            "SaveDoctorClearanceEMG"
                                        )
                                    }
                                >
                                    {t("Doctor Clearance")}
                                </button>
                            </div>

                        }
                    </div>
                </>
                }

                {(clearanceDetail?.pending?.CheckNursingClearanceEMG || clearanceDetail?.CheckNursingClearanceEMG) && <>
                    <Heading title={t("Nursing Clearance")} />
                    <div className="row p-2 d-flex justify-content-center">
                        {clearanceDetail?.CheckNursingClearanceEMG ?

                            <strong className='text-danger'>{clearanceDetail?.CheckNursingClearanceEMG}</strong>

                            :
                            <div className="col-sm-1">
                                <button
                                    className="btn btn-sm btn-success"
                                    onClick={() =>
                                        handleModal(
                                            'Nursing Clearance',
                                            '20vw',
                                            <EmergencyClearanceModal name={"Do you want to clear patient from Nursing department ?"} />,
                                            handleInsertAPI,
                                            "SaveNursingClearanceEMG"
                                        )
                                    }
                                >
                                    {t("Nursing Clearance")}
                                </button>
                            </div>
                        }
                    </div>
                </>}

                {(clearanceDetail?.pending?.CheckBillingClearanceEMG || clearanceDetail?.CheckBillingClearanceEMG) && <>
                    <Heading title={t("Billing Clearance")} />
                    <div className="row p-2 d-flex justify-content-center">
                        {clearanceDetail?.CheckBillingClearanceEMG ?

                            <strong className='text-danger'>{clearanceDetail?.CheckBillingClearanceEMG}</strong>

                            : <div className="col-sm-1">
                                <button
                                    className="btn btn-sm btn-success"
                                    onClick={() =>
                                        handleModal(
                                            'Billing Clearance',
                                            '20vw',
                                            <EmergencyClearanceModal name={"Do you want to clear patient from billing department ?"} />,
                                            handleInsertAPI,
                                            "SaveBillingClearanceEMG"
                                        )
                                    }
                                >
                                    {t("Billing Clearance")}
                                </button>
                            </div>}
                    </div>
                </>}

            </div>

            {modalData.visible && (
                <Modal
                    visible={modalData.visible}
                    setVisible={closeModal}
                    modalData={modalData?.URL}
                    modalWidth={modalData.width}
                    Header={t(modalData.label)}
                    buttonType="button"
                    buttonName={t("Yes")}
                    handleAPI={modalData?.handleInsertAPI}
                >
                    {modalData.Component}
                </Modal>
            )}
        </>

    );
}
