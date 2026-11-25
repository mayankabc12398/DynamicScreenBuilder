import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Heading from '../UI/Heading';
import Input from '../formComponent/Input';
import Tables from '../UI/customTable';
import { notify } from '../../utils/utils';
import { GetReceipientAndDonorData, SaveReceipient, UpdateReceipient } from '../../networkServices/nursingWardAPI';

function RecipientDonarform({ data }) {
    debugger
    const { t } = useTranslation();
    const initialValues = {
        "id": 0,
        patientID: "",
        name: data?.pName,
        contactTel: data?.mobile,
        transactionId: data?.transactionID,
        ipD_No: data?.ipdno,
        "age": data?.age,
        "sex": data?.ageSex,
        "weight": "",
        "height": "",
        "bmi": "",
        "bp": "",
        "counseling": "",
        "consent": "",
        "nutritionist": "",
        "history_Taking": "",
        "blood_Group": "",
        "hiv": "",
        "hbv": "",
        "hcv": "",
        "urea": "",
        "creatinine": "",
        "k_NA_CA_PO4": "",
        "hb": "",
        "wbC_PLT_ESR": "",
        "fbs": "",
        "urinalysis": "",
        "lft": "",
        "lipid_Profile": "",
        "pth": "",
        "uric_Acid": "",
        "kuB_US": "",
        "doppler_US_Femorals_Iliacs": "",
        "plain_ABD_Xray_RT_Kid": "",
        "plain_ABD_Xray_LT_Kid": "",
        "hla": "",
        "hlA_A": "",
        "hlA_B": "",
        "hlA_DR": "",
        "hlA_DQ": "",
        "tcell_XMatch": "",
        "cT_Angiogram": "",
        "cxr": "",
        "ecG_ECHO": "",
        "cmV_lgG_lgM_PCR": "",
        "mcu": "",
        "paP_PDT_PSA": "",
        "echo": "",
        "na": "",
        "ca": "",
        "pO4": "",
        "plt": "",
        "esr": "",
        "psa": "",
        "pdt": "",
        "iliacs": ""
    }
    const [values, setValues] = useState(initialValues)
    const [tableData, settableData] = useState([])
    const isPatientExist = tableData?.find(
        item => item?.PatientId === data?.patientID
    );
    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleChecked = (e) => {
        const { name, checked } = e.target;
        setValues((prev) => ({
            ...prev,
            [name]: checked ? "1" : "0",
        }));
    };

    const thead = [
        { name: t("SrNo"), width: "4%" },
        { name: t("UHID") },
        { name: t("entered bY") },
        { name: t("Action"), width: "3%" },

    ]
    const getReceipientAndDonorData = async () => {
        try {
            const response = await GetReceipientAndDonorData(data?.patientID)
            if (response.success) {
                settableData(response?.data)
            }
        } catch (error) {
            notify(error?.message, "error")
        }
    }

    const handleEdit = async (val) => {
        try {
            const response = await GetReceipientAndDonorData(val?.PatientId)
            if (response.success) {
                const item = response?.data?.[0];
                setValues({
                    ...values,

                    id: item?.RecepientID,
                    patientID: item?.PatientId,
                    transactionId: item?.TransactionId,
                    name: item?.Name,
                    ipD_No: item?.IPD_No,

                    age: item?.Age,
                    sex: item?.Sex,

                    weight: item?.Weight,
                    height: item?.Height,
                    bmi: item?.BMI,
                    bp: item?.BP,

                    counseling: item?.Counseling,
                    consent: item?.Consent,
                    nutritionist: item?.Nutritionist,
                    history_Taking: item?.History_Taking,

                    blood_Group: item?.Blood_Group,
                    hiv: item?.HIV,
                    hbv: item?.HBV,
                    hcv: item?.HCV,

                    urea: item?.Urea,
                    creatinine: item?.Creatinine,
                    k_NA_CA_PO4: item?.K_NA_CA_PO4,
                    hb: item?.HB,
                    wbC_PLT_ESR: item?.WBC_PLT_ESR,
                    fbs: item?.FBS,
                    urinalysis: item?.Urinalysis,
                    lft: item?.LFT,
                    lipid_Profile: item?.Lipid_Profile,
                    pth: item?.PTH,
                    uric_Acid: item?.Uric_Acid,

                    kuB_US: item?.KUB_US,
                    doppler_US_Femorals_Iliacs: item?.Doppler_US_Femorals_Iliacs,

                    plain_ABD_Xray_RT_Kid: item?.Plain_ABD_Xray_RT_Kid,
                    plain_ABD_Xray_LT_Kid: item?.Plain_ABD_Xray_LT_Kid,

                    hla: String(item?.HLA), // important for radio/select
                    hlA_A: item?.HLA_A,
                    hlA_B: item?.HLA_B,
                    hlA_DQ: item?.HLA_DQ,

                    tcell_XMatch: item?.Tcell_XMatch,
                    cT_Angiogram: item?.CT_Angiogram,
                    cxr: item?.CXR,
                    ecG_ECHO: item?.ECG_ECHO,
                    cmV_lgG_lgM_PCR: item?.CMV_lgG_lgM_PCR,
                    mcu: item?.MCU,
                    paP_PDT_PSA: item?.PAP_PDT_PSA,

                    echo: item?.ECHO,
                    na: item?.NA,
                    ca: item?.CA,
                    pO4: item?.PO4,
                    plt: item?.PLT,
                    esr: item?.ESR,
                    psa: item?.PSA,
                    pdt: item?.PDT,
                    iliacs: item?.Iliacs
                });
            }
        } catch (error) {
            notify(error?.message, "error")
        }
    }
    const hanldeUpdate = async (e) => {
        e.preventDefault()
        if (values?.id) {
            const payload = [{ ...values }]
            try {
                const response = await UpdateReceipient(payload)
                if (response.success) {
                    getReceipientAndDonorData()
                    notify(response.message, "success")
                    setValues({ ...initialValues })
                }
            } catch (error) {
                notify(error.message, "success")
            }
        }

    }
    const handleSave = async (e) => {
        e.preventDefault()
        if (!isPatientExist?.PatientId) {
            const payload = [{ ...values, patientID: data?.patientID }]
            try {
                const response = await SaveReceipient(payload)
                if (response.success) {
                    getReceipientAndDonorData()
                    notify(response.message, "success")
                    setValues({ ...initialValues })
                }
            } catch (error) {
                notify(error.message, "success")
            }
        }

    }
    useEffect(() => {
        getReceipientAndDonorData()
    }, [])

    return (
        <>
            <form className='card patient_registration border mt-1'>
                <Heading
                    title={t("Recipient-Workup Checklist")}
                    isBreadcrumb={true}
                />
                {/* Stage 1 */}
                <div className='card'>
                    <Heading
                        title={t("Stage 1")}
                        isBreadcrumb={false}
                    />
                    <div className='row p-2'>
                        <div className="col-12">
                            <div className="row">
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="counseling"
                                    name="counseling"
                                    onChange={handleChange}
                                    value={values?.counseling}
                                    lable={t("Counseling")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="consent"
                                    name="consent"
                                    onChange={handleChange}
                                    value={values?.consent}
                                    lable={t("Consent")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="nutritionist"
                                    name="nutritionist"
                                    onChange={handleChange}
                                    value={values?.nutritionist}
                                    lable={t("Nutritionist")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="history_Taking"
                                    name="history_Taking"
                                    onChange={handleChange}
                                    value={values?.history_Taking}
                                    lable={t("History Taking")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stage 2 */}
                <div className='card'>
                    <Heading
                        title={t("Stage 2")}
                        isBreadcrumb={false}
                    />
                    <div className='row p-2'>
                        <div className="col-12">
                            <div className="row">
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="blood_Group"
                                    name="blood_Group"
                                    onChange={handleChange}
                                    value={values?.blood_Group}
                                    lable={t("Blood Group")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="hiv"
                                    name="hiv"
                                    onChange={handleChange}
                                    value={values?.hiv}
                                    lable={t("HIV")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="hbv"
                                    name="hbv"
                                    onChange={handleChange}
                                    value={values?.hbv}
                                    lable={t("HBV")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="hcv"
                                    name="hcv"
                                    onChange={handleChange}
                                    value={values?.hcv}
                                    lable={t("HCV")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="urea"
                                    name="urea"
                                    onChange={handleChange}
                                    value={values?.urea}
                                    lable={t("Urea")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="creatinine"
                                    name="creatinine"
                                    onChange={handleChange}
                                    value={values?.creatinine}
                                    lable={t("Creatinine")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="k_NA_CA_PO4"
                                    name="k_NA_CA_PO4"
                                    onChange={handleChange}
                                    value={values?.k_NA_CA_PO4}
                                    lable={t("K/NA/CA/PO4")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="na"
                                    name="na"
                                    onChange={handleChange}
                                    value={values?.na}
                                    lable={t("NA")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="ca"
                                    name="ca"
                                    onChange={handleChange}
                                    value={values?.ca}
                                    lable={t("CA")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="hb"
                                    name="hb"
                                    onChange={handleChange}
                                    value={values?.hb}
                                    lable={t("HB")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="pO4"
                                    name="pO4"
                                    onChange={handleChange}
                                    value={values?.pO4}
                                    lable={t("PO4")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="wbC_PLT_ESR"
                                    name="wbC_PLT_ESR"
                                    onChange={handleChange}
                                    value={values?.wbC_PLT_ESR}
                                    lable={t("WBC/PLT/ESR")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="plt"
                                    name="plt"
                                    onChange={handleChange}
                                    value={values?.plt}
                                    lable={t("PLT")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="esr"
                                    name="esr"
                                    onChange={handleChange}
                                    value={values?.esr}
                                    lable={t("ESR")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="fbs"
                                    name="fbs"
                                    onChange={handleChange}
                                    value={values?.fbs}
                                    lable={t("FBS")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="urinalysis"
                                    name="urinalysis"
                                    onChange={handleChange}
                                    value={values?.urinalysis}
                                    lable={t("Urinalysis")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="lft"
                                    name="lft"
                                    onChange={handleChange}
                                    value={values?.lft}
                                    lable={t("LFT")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="lipid_Profile"
                                    name="lipid_Profile"
                                    onChange={handleChange}
                                    value={values?.lipid_Profile}
                                    lable={t("Lipid Profile")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="pth"
                                    name="pth"
                                    onChange={handleChange}
                                    value={values?.pth}
                                    lable={t("PTH")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="uric_Acid"
                                    name="uric_Acid"
                                    onChange={handleChange}
                                    value={values?.uric_Acid}
                                    lable={t("Uric Acid")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stage 3 */}
                <div className='card'>
                    <Heading
                        title={t("Stage 3")}
                        isBreadcrumb={false}
                    />
                    <div className='row p-2'>
                        <div className="col-12">
                            <div className="row">
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="kuB_US"
                                    name="kuB_US"
                                    onChange={handleChange}
                                    value={values?.kuB_US}
                                    lable={t("KUB U/S")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <div className="d-flex align-items-center col-xl-2 col-md-4 col-sm-4 col-12">
                                    <input
                                        type="checkbox"
                                        name="doppler_US_Femorals_Iliacs"
                                        id="doppler_US_Femorals_Iliacs"
                                        className="mx-1"
                                        checked={values.doppler_US_Femorals_Iliacs === "1"}
                                        onChange={handleChecked}
                                    />
                                    <label htmlFor="doppler_US_Femorals_Iliacs" className="m-0">
                                        {t("Doppler U/S of Femorals Xray")}
                                    </label>
                                </div>

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="plain_ABD_Xray_RT_Kid"
                                    name="plain_ABD_Xray_RT_Kid"
                                    onChange={handleChange}
                                    value={values?.plain_ABD_Xray_RT_Kid}
                                    lable={t("RT Kid")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="plain_ABD_Xray_LT_Kid"
                                    name="plain_ABD_Xray_LT_Kid"
                                    onChange={handleChange}
                                    value={values?.plain_ABD_Xray_LT_Kid}
                                    lable={t("LT Kid")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <div className="d-flex align-items-center col-xl-2 col-md-4 col-sm-4 col-12">
                                    <input
                                        type="checkbox"
                                        name="iliacs"
                                        id="iliacs"
                                        className="mx-1"
                                        checked={values.iliacs === "1"}
                                        onChange={handleChecked}
                                    />
                                    <label htmlFor="iliacs" className="m-0">
                                        {t("Doppler U/S of Femorals Xray")}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stage 4 */}
                <div className='card'>
                    <Heading
                        title={t("Stage 4")}
                        isBreadcrumb={false}
                    />
                    <div className='row p-2'>
                        <div className="col-12">
                            <div className="row">
                                <div className="d-flex align-items-center col-xl-2 col-md-4 col-sm-4 col-12">
                                    <input
                                        type="checkbox"
                                        name="hla"
                                        id="hla"
                                        className="mx-1"
                                        checked={values.hla === "1"}
                                        onChange={handleChecked}
                                    />
                                    <label htmlFor="hla" className="m-0">
                                        {t("HLA")}
                                    </label>
                                </div>

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="hlA_A"
                                    name="hlA_A"
                                    onChange={handleChange}
                                    value={values?.hlA_A}
                                    lable={t("A")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="hlA_B"
                                    name="hlA_B"
                                    onChange={handleChange}
                                    value={values?.hlA_B}
                                    lable={t("B")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="hlA_DQ"
                                    name="hlA_DQ"
                                    onChange={handleChange}
                                    value={values?.hlA_DQ}
                                    lable={t("DQ")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="tcell_XMatch"
                                    name="tcell_XMatch"
                                    onChange={handleChange}
                                    value={values?.tcell_XMatch}
                                    lable={t("Tcell XMatch")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stage 5 */}
                <div className='card'>
                    <Heading
                        title={t("Stage 5")}
                        isBreadcrumb={false}
                    />
                    <div className='row p-2'>
                        <div className="col-12">
                            <div className="row">
                                <Input
                                    type="text"
                                    className="form-control"
                                    id="cT_Angiogram"
                                    name="cT_Angiogram"
                                    onChange={handleChange}
                                    value={values?.cT_Angiogram}
                                    lable={t("CT Angiogram *")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="cxr"
                                    name="cxr"
                                    onChange={handleChange}
                                    value={values?.cxr}
                                    lable={t("CXR")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="ecG_ECHO"
                                    name="ecG_ECHO"
                                    onChange={handleChange}
                                    value={values?.ecG_ECHO}
                                    lable={t("ECG/ECHO")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="echo"
                                    name="echo"
                                    onChange={handleChange}
                                    value={values?.echo}
                                    lable={t("ECHO")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="cmV_lgG_lgM_PCR"
                                    name="cmV_lgG_lgM_PCR"
                                    onChange={handleChange}
                                    value={values?.cmV_lgG_lgM_PCR}
                                    lable={t("CMV lgG lgM/PCR")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="mcu"
                                    name="mcu"
                                    onChange={handleChange}
                                    value={values?.mcu}
                                    lable={t("MCU")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <Input
                                    type="text"
                                    className="form-control"
                                    id="paP_PDT_PSA"
                                    name="paP_PDT_PSA"
                                    onChange={handleChange}
                                    value={values?.paP_PDT_PSA}
                                    lable={t("PAP/PDT/PSA")}
                                    placeholder=" "
                                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                />

                                <div className="text-right">
                                    <button className={`btn btn-sm btn-success ml-2 ${isPatientExist?.PatientId ? "d-none" : ""} `} type="button " onClick={handleSave}>
                                        {t("save")}
                                    </button>
                                </div>
                                <div className="text-right">
                                    <button
                                        className={`btn btn-sm btn-success ml-2 ${!(values?.patientID || isPatientExist?.PatientId) ? "d-none" : ""
                                            }`}
                                        type="button"
                                        onClick={hanldeUpdate}
                                    >
                                        {t("update")}
                                    </button>

                                </div>
                                <div className="text-right">
                                    <button
                                        className="btn btn-sm btn-success ml-2"
                                        style={{ color: "white", border: "none" }}
                                        onClick={() => { }}
                                    >
                                        {t("Print")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <div className='card p-4 py-2'>

            </div>

            {tableData && tableData.length > 0 ? (
                <>
                    <Heading
                        title={t("Search Results")}
                        isBreadcrumb={false}
                    />
                    <Tables
                        thead={thead}
                        tbody={tableData.map((val, index) => ({
                            "S.No": index + 1,
                            uhid: val?.PatientId,
                            enteredBy: val?.EmployeeName,

                            action: (<i className="fa fa-edit" aria-hidden="true" onClick={() => handleEdit(val)} />),
                        }))}
                    />
                </>
            ) : (
                ""
            )}
        </>
    )
}

export default RecipientDonarform