import React, { useEffect, useRef, useState } from 'react'
import Input from '../../../formComponent/Input'
import { PanelControlSavePanelAmountAllocationDetails } from '../../../../networkServices/Tools'
import { BankAPIBankAPIGetResponse, BankAPIBankAPIInserAndInitiatePayment } from '../../../../networkServices/opdserviceAPI';
import { notify } from '../../../../utils/ustil2';
import { useTranslation } from "react-i18next";

const MakePayment = ({
    isUPIMODE,
    singlePatientData,
    isPayment = true
}) => {
    const [t] = useTranslation();

    const [isPaymenetProcess, setIsPaymentProcess] = useState(false)
    const [paymentSuccess, setPaymentSuccess] = useState(false)
    const [data, setData] = useState({})
    const [message, setMessage] = useState({})

    const [values, setValues] = useState({ Mobile: "" })
    const [timeLeft, setTimeLeft] = useState(300) // 5 min
    const [isTimeout, setIsTimeout] = useState(false)

    const pollingRef = useRef(null)

    /* ------------------- INPUT CHANGE ------------------- */
    const handleChange = (e) => {
        const { name, value } = e.target
        setValues(prev => ({ ...prev, [name]: value }))
    }

    /* ------------------- API CHECK (EVERY 2 SEC) ------------------- */
    const handlePaymentIsDone = async (data) => {


        try {
            const response = await BankAPIBankAPIGetResponse(data)

            if (response?.success) {
                if (response?.data[0]?.Status == 4) {
                    // success..... 
                    setMessage(response?.data[0])
                } else if (response?.data[0]?.Status == 3) {
                    // fail....
                }
                setPaymentSuccess(true)
                setIsPaymentProcess(false)
                clearInterval(pollingRef.current)
                pollingRef.current = null

                // notify(response?.message, "success")
            }
            else {
                //  notify(response?.message, "error")
            }
        } catch (error) {
            console.error("Payment check error", error)
        }
    }

    /* ------------------- START PAYMENT ------------------- */
    const handlePayment = async () => {
        const payload =
        {
            // paymentAmt: 1,
            paymentAmt: isUPIMODE?.Amount,
            patientID: singlePatientData?.PatientID,
            billNo: "",
            mobileNo: values?.Mobile
        }
        try {
            const response = await BankAPIBankAPIInserAndInitiatePayment(payload)
            if (response?.success) {
                setData(response?.data)
                setIsPaymentProcess(true)
                setPaymentSuccess(false)
                setIsTimeout(false)     // 🔥 reset timeout
                setTimeLeft(300)
            }
            // debugger
            // if (response?.success) {
            //     setData(response?.data)
            //     setIsPaymentProcess(true)
            //     setPaymentSuccess(false)
            //     setTimeLeft(300)
            // } 

            else {
                notify(response?.message, "error")
                console.log("error", response.message)
            }
        } catch (error) {
            console.log("error", error)
        }

    }

    /* ------------------- 2 SECOND POLLING ------------------- */
    useEffect(() => {
        if (!isPaymenetProcess || paymentSuccess) return

        pollingRef.current = setInterval(() => {
            handlePaymentIsDone(data)
        }, 2000)

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current)
                pollingRef.current = null
            }
        }
    }, [isPaymenetProcess, paymentSuccess])

    // useEffect(() => {
    //     if (!isPaymenetProcess) return
    //     if (paymentSuccess) return

    //     pollingRef.current = setInterval(() => {
    //         handlePaymentIsDone(data)
    //     }, 2000)

    //     return () => clearInterval(pollingRef.current)
    // }, [isPaymenetProcess, paymentSuccess])

    /* ------------------- TIMER (1 SEC) ------------------- */
    // useEffect(() => {
    //     if (!isPaymenetProcess) return
    //     if (timeLeft <= 0 || paymentSuccess) return

    //     const timer = setInterval(() => {
    //         setTimeLeft(prev => prev - 1)
    //     }, 1000)

    //     return () => clearInterval(timer)
    // }, [isPaymenetProcess, timeLeft, paymentSuccess])

    useEffect(() => {
        if (!isPaymenetProcess) return
        if (paymentSuccess) return

        if (timeLeft <= 0) {
            // ⛔ STOP EVERYTHING
            clearInterval(pollingRef.current)
            pollingRef.current = null

            setIsPaymentProcess(false)
            setIsTimeout(true)

            notify(t("Payment timeout. Please try again."), "error")
            return
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [isPaymenetProcess, timeLeft, paymentSuccess])


    /* ------------------- MOBILE AUTO FILL ------------------- */
    useEffect(() => {
        setValues(prev => ({
            ...prev,
            Mobile: singlePatientData?.Mobile
        }))
    }, [singlePatientData])

    /* ------------------- TIME FORMAT ------------------- */
    const formatTime = (seconds) => {
        const min = String(Math.floor(seconds / 60)).padStart(2, '0')
        const sec = String(seconds % 60).padStart(2, '0')
        return `${min}:${sec}`
    }

    return (
        <div className="spatient_registration_card">

            <div 
            className="row "
            // className="row row-cols-lg-5 row-cols-md-2 row-cols-1 p-2"
            >

                <Input
                    type="text"
                    className="form-control"
                    id="Mobile"
                    name="Mobile"
                    value={values?.Mobile}
                    onChange={handleChange}
                    lable="Mobile"
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                />

                <Input
                    type="text"
                    className="form-control"
                    id="Amount"
                    name="Amount"
                    value={isUPIMODE?.Amount || ""}
                    lable="Amount"
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    disabled
                />
                <div className="col-sm-2 col-xl-1">
                    <button
                        className="btn btn-sm btn-success"
                        type="button"
                        disabled={isPaymenetProcess}
                        onClick={handlePayment}
                    >
                        {(t("Process Payment"))}
                    </button>
                </div>
            </div>
            {/* ------------------- LOADER + TIMER ------------------- */}
            {isPaymenetProcess && (
                <div className="row justify-content-center text-center py-3">
                    <div className="col-auto">
                        
                        <div className="bg-light rounded-4 shadow-sm p-3 mb-3">

                            {/* <svg width="110" height="110" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" stroke="#e9ecef" strokeWidth="8" fill="none" />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    stroke="#ffc107"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray="264"
                                    strokeLinecap="round"
                                >
                                    <animateTransform
                                        attributeName="transform"
                                        type="rotate"
                                        from="0 50 50"
                                        to="360 50 50"
                                        dur="1s"
                                        repeatCount="indefinite"
                                    />
                                </circle>

                                <text
                                    x="50"
                                    y="55"
                                    textAnchor="middle"
                                    fontSize="20"
                                    fontWeight="bold"
                                >
                                    ⏳ {formatTime(timeLeft)}
                                </text>
                            </svg> */}
{/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">

<linearGradient id="a7"><stop offset="0" stop-color="#FF156D" stop-opacity="0"></stop><stop offset="1" stop-color="#FF156D"></stop></linearGradient><circle fill="none" stroke="url(#a7)" stroke-width="15" stroke-linecap="round" stroke-dasharray="0 44 0 44 0 44 0 44 0 360" cx="100" cy="100" r="70" transform-origin="center"><animateTransform type="rotate" attributeName="transform" calcMode="discrete" dur="2" values="360;324;288;252;216;180;144;108;72;36" repeatCount="indefinite"></animateTransform></circle>


</svg> */}
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><linearGradient id="a7"><stop offset="0" stop-color="#1D06FF" stop-opacity="0"></stop><stop offset="1" stop-color="#1D06FF"></stop></linearGradient>
<circle fill="none" stroke="url(#a7)" stroke-width="13" stroke-linecap="round" stroke-dasharray="0 44 0 44 0 44 0 44 0 360" cx="100" cy="100" r="70" transform-origin="center">
    
    <animateTransform type="rotate" attributeName="transform" calcMode="discrete" dur="1.9" values="360;324;288;252;216;180;144;108;72;36" repeatCount="indefinite"></animateTransform></circle></svg>
⏳ {formatTime(timeLeft)}
                            <div className="fw-semibold text-muted mt-2">
                                {t("Processing Payment")} 
                            </div>  </div>

                        <div className="alert alert-danger py-2 px-3 small fw-semibold">
                            {t("⚠ Please do not close or refresh the page")}
                        </div>
                    </div>
                </div>
            )}


            {paymentSuccess && (
                message?.Status === 4 ? (
                    <div className="alert alert-success text-center fw-bold">
                        {t("✅ Payment Completed Successfully")}

                        <div className="mt-2 text-start">
                            <div><b>{t("Transaction Date:")}</b> {message?.TransactionDate ?? "-"}</div>
                            <div><b>{t("Payment Ref No:")}</b> {message?.PaymentReffNo ?? "-"}</div>
                            <div><b>{t("Receipt No:")}</b> {message?.MpesaReceiptNumber ?? "-"}</div>
                        </div>
                    </div>
                ) : (
                    <div className="alert alert-danger text-center fw-bold">
                        {t("❌ Payment Failed Please initiate payment again")}
                    </div>
                )
            )}

            {isTimeout && !paymentSuccess && (
                <div className="alert alert-warning text-center fw-bold">
                    {t("⏰ Payment timed out. Please initiate payment again.")}
                </div>
            )}
        </div>
    )
}

export default MakePayment

