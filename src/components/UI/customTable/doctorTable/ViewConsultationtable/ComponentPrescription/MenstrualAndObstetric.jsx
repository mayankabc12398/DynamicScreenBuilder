import React, { useEffect, useState } from 'react'
import DatePicker from '../../../../../formComponent/DatePicker'
import LabeledInput from '../../../../../formComponent/LabeledInput'
import Input from '../../../../../formComponent/Input'
import TextAreaInput from '../../../../../formComponent/TextAreaInput'
import { useLocalStorage } from '../../../../../../utils/hooks/useLocalStorage'
import moment from 'moment'
import { useTranslation } from "react-i18next";

const MenstrualAndObstetric = ({ loadSaveData, setPregnancyDetails, patientDetail, disabled, isPregnancy }) => {
    const [t] = useTranslation();
// debugger
    const { employeeID } = useLocalStorage("userData", "get");

    const { pregnancyBasicDetails } = loadSaveData;
    const initialState = {
        LMPDate: "",
        EDDDate: "",
        currentPregnancyDate: "",
        gestationalAge: 0,
        isDelivered: 0,
        Gravida: "",
        Para: "",
        Live: "",
        Abortion: "",
        Other: "",
        CorrectEDD: "",
        patientId: "",
        transactionId: "",
        entryDate: new Date(),
        isActive: 1,
        entryBy: employeeID,
    };

    const [values, setValues] = useState(initialState);
    // debugger
    useEffect(() => {
        if (loadSaveData && patientDetail) {
            setValues(
                {
                    LMPDate: pregnancyBasicDetails?.lmp ? moment(new Date(pregnancyBasicDetails?.lmp)).format("DD-MMM-YYYY") : "",
                    EDDDate: pregnancyBasicDetails?.edd ? moment(new Date(pregnancyBasicDetails?.edd)).format("DD-MMM-YYYY") : "",
                    currentPregnancyDate: pregnancyBasicDetails?.currentPregnancy ? moment(new Date(pregnancyBasicDetails?.currentPregnancy)).format("DD-MMM-YYYY") : "",
                    gestationalAge: pregnancyBasicDetails?.ga || 0,
                    isDelivered: pregnancyBasicDetails?.status || 0,
                    patientId: patientDetail?.currentPatient?.PatientID || "",
                    transactionId: patientDetail?.currentPatient?.TransactionID || "",
                    entryDate: new Date(),
                    isActive: 1,
                    entryBy: employeeID,
                    Gravida: pregnancyBasicDetails?.gravida || "",
                    Para: pregnancyBasicDetails?.para || "",
                    Live: pregnancyBasicDetails?.live || "",
                    Abortion: pregnancyBasicDetails?.abortion || "",
                    Other: pregnancyBasicDetails?.other || "",
                    CorrectEDD: pregnancyBasicDetails?.correctedEdd ? new Date(pregnancyBasicDetails?.correctedEdd) : "",
                }
            );
        }


    }, [loadSaveData])

    useEffect(() => {
        setPregnancyDetails({
            patientId: values.patientId,
            transactionId: values.transactionId,
            lmp: values.LMPDate,
            edd: values.EDDDate,
            currentPregnancy: values.currentPregnancyDate,
            entryDate: values.entryDate,
            isActive: values.isActive,
            entryBy: values.entryBy,
            status: Number(values.isDelivered),
            ga: values.gestationalAge,
            gravida: values.Gravida,
            para: values.Para,
            live: values.Live,
            abortion: values.Abortion,
            other: values.Other,
            correctedEdd: values.CorrectEDD,
        });
    }, [values, setPregnancyDetails]);





    const calculateGestationalAge = (startDate, currentDate) => {
        const diffInMilliseconds = currentDate - startDate;
        const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);
        return Math.floor(diffInDays / 7);
    };
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (!value) {
            setValues((prevValues) => {
                let updatedValues = { ...prevValues, [name]: "" };

                if (name === "LMPDate") {
                    updatedValues.EDDDate = "";
                    updatedValues.gestationalAge = "";
                } else if (name === "EDDDate") {
                    updatedValues.LMPDate = "";
                    updatedValues.gestationalAge = "";
                } else if (name === "CorrectEDD") {
                    updatedValues.LMPDate = "";
                    updatedValues.gestationalAge = "";
                }

                return updatedValues;
            });
            return;
        }

        const newDate = moment(value); // Parse Date directly
        if (!newDate.isValid()) {
            console.error("Invalid date detected:", value);
            return;
        }

        setValues((prevValues) => {
            let updatedValues = { ...prevValues, [name]: newDate.format("YYYY-MM-DD") };

            if (loadSaveData?.vitalSign?.isPregnancy === 0) {
                if (name === "LMPDate") {
                    updatedValues.LMPDate = newDate.format("YYYY-MM-DD");
                }
                return updatedValues;
            }

            if (name === "LMPDate") {
                const eddDate = newDate.clone().add(280, 'days');
                updatedValues.EDDDate = eddDate.format("YYYY-MM-DD");
                updatedValues.gestationalAge = calculateGestationalAge(newDate.toDate(), new Date());
            }

            if (name === "EDDDate") {
                const lmpDate = newDate.clone().subtract(280, 'days');
                updatedValues.LMPDate = lmpDate.format("YYYY-MM-DD");
                updatedValues.gestationalAge = calculateGestationalAge(lmpDate.toDate(), new Date());
            }

            if (name === "CorrectEDD") {
                const correctedLmpDate = newDate.clone().subtract(280, 'days');
                updatedValues.LMPDate = correctedLmpDate.format("YYYY-MM-DD");
                updatedValues.gestationalAge = calculateGestationalAge(correctedLmpDate.toDate(), new Date());
            }

            return updatedValues;
        });
    };



    const handleChangeInput =
        (e) => {
            const { name, value } = e.target;
            setValues((prev) => {
                return {
                    ...prev,
                    [name]: value
                }
            })
        }

    // Width-aware grids: fields wrap to new lines instead of being squeezed into
    // slivers when the card is narrow (Bootstrap col-* fractions crushed them).
    const gridStyle = (min) => ({
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`,
        gap: "4px 8px",
        width: "100%",
        alignItems: "center",
    });
    const cell = { minWidth: 0 };
    const isPreg = loadSaveData?.vitalSign?.isPregnancy == 1 || loadSaveData?.vitalSign === null;

    return (
        <div className="my-2 px-2" style={{ width: "100%", flex: "1 1 100%", minWidth: 0 }}>
            <div className="mb-1" style={gridStyle(150)}>
                <div style={cell}>
                    <DatePicker
                        placeholderText="dd-mm-yyyy"
                        lable={t("LMP Date")}
                        name="LMPDate"
                        id="LMPDate"
                        // value={values?.LMPDate?.length>0?new Date(values?.LMPDate):""}
                        value={values?.LMPDate ? moment(values?.LMPDate).toDate() : ""}
                        // showTime
                        // hourFormat="12"
                        handleChange={handleChange}
                        className="  col-12"
                        onChange={handleChange}
                        disable={disabled}
                    />
                </div>
                {isPreg && (

                    <div style={cell}>
                        <DatePicker
                            disable={disabled}
                            placeholder=""
                            lable={t("EDD Date")}
                            name="EDDDate"
                            id="EDDDate"
                            value={values?.EDDDate ? moment(values?.EDDDate).toDate() : ""}
                            hourFormat="12"
                            handleChange={handleChange}
                            className="  col-12" // flex-grow-1 makes it expand, me-2 adds margin between the two
                            onChange={handleChange}
                        />
                    </div>
                )}

                {isPreg && (
                    <>
                        <div style={cell}>
                            <DatePicker
                                disable={disabled}
                                placeholder=""
                                name="CorrectEDD"
                                id="CorrectEDD"
                                value={values?.CorrectEDD ? moment(values?.CorrectEDD).toDate() : ""} showTime
                                hourFormat="12"
                                handleChange={handleChange}
                                className="  col-12" // flex-grow-1 makes it expand, me-2 adds margin between the two
                                // onChange={handleChange}
                                lable={t("Corrected EDD Date")}
                            // className="col-12" // flex-grow-1 makes it expand, me-2 adds margin between the two
                            // onChange={handleChange}
                            />
                        </div>
                        <div style={cell}>
                            <DatePicker
                                disable={disabled}
                                placeholder=""
                                lable={t("Current Pregnancy Date")}  // Corrected to "lable"
                                name="currentPregnancyDate"
                                id="currentPregnancyDate"
                                value={values?.currentPregnancyDate ? moment(values?.currentPregnancyDate).toDate() : ""} showTime
                                hourFormat="12"
                                handleChange={handleChange}
                                className="  col-12"
                            />
                        </div>
                    </>
                )}
            </div>

            {isPreg && (
                <>
                    <div className="mb-1" style={gridStyle(90)}>
                        <div style={cell}>
                            <LabeledInput
                                label={t("G.Age (weeks)")}
                                value={values?.gestationalAge}
                                className="col-12 px-0"
                            />
                        </div>
                        {["Gravida", "Para", "Live", "Abortion"].map((f) => (
                            <div style={cell} key={f}>
                                <TextAreaInput
                                    disabled={disabled}
                                    id={f}
                                    lable={t(f)}
                                    name={f}
                                    value={values?.[f]}
                                    respclass=""
                                    rows={1}
                                    onChange={handleChangeInput}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mb-1" style={{ ...gridStyle(200), gridTemplateColumns: "minmax(0, 1fr) auto" }}>
                        <div style={cell}>
                            <TextAreaInput
                                disabled={disabled}
                                id={"OtherIfApplicable"}
                                lable={t("Other If Applicable")}
                                name="Other"
                                value={values?.Other}
                                respclass=""
                                rows={1}
                                onChange={handleChangeInput}
                            />
                        </div>
                        <div className="d-flex align-items-center" style={{ whiteSpace: "nowrap" }}>
                            <input
                                disabled={disabled}
                                type="checkbox"
                                checked={values?.isDelivered === 1 ? true : false}
                                onChange={() =>
                                    setValues(prev => ({ ...prev, isDelivered: prev.isDelivered ? 0 : 1 }))
                                }
                            />
                            <span className="font-weight-bold ml-2">: Is Delivered</span>
                        </div>

                    </div>
                </>
            )}

        </div>
    )
}

export default MenstrualAndObstetric