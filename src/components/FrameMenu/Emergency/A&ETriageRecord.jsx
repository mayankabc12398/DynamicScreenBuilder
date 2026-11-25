import React, { useEffect, useState, useRef } from 'react'
import Heading from '../../UI/Heading'
import { useTranslation } from 'react-i18next'
import DatePicker from '../../formComponent/DatePicker'
import TimePicker from '../../formComponent/TimePicker'
import MultiSelectOtherComp from '../../formComponent/MultiSelectOtherOption'
import MultiSelectComp from '../../formComponent/MultiSelectComp'
import ReactSelect from '../../formComponent/ReactSelect'
import Input from '../../formComponent/Input'
import { bindAllergyListApi, bindAdmitToWardApi, saveOrUpdateAllergyApi, SaveAandETriageRecordApi, getListOfAandETriageApi, AETriageReportApi } from '../../../networkServices/nursingWardAPI'
import { handleReactSelectDropDownOptions } from '../../../utils/utils'
import AllergyModal from '../../modalComponent/Utils/AllergyModel'
import Modal from '../../modalComponent/Modal'
import { notify } from '../../../utils/ustil2'
import TextAreaInput from '../../formComponent/TextAreaInput'
import { useSelector, useDispatch } from 'react-redux'
import { GetAllDoctor } from '../../../store/reducers/common/CommonExportFunction'
import LabeledInput from '../../formComponent/LabeledInput'
import moment from 'moment'
import Tables from '../../UI/customTable'
import { RedirectURL } from '../../../networkServices/PDFURL'
import { ReprintSVG } from '../../SvgIcons'
const AETriageForm = ({ data }) => {
    const { transactionID, patientID } = data;
    const [t] = useTranslation()
    const initialValue = {
        transactionID: data?.transactionID,
        patientID: data?.patientID,
        patientName: data?.patientName,
        id: "",
        DATE1: new Date(),
        DATE2: new Date(),
        Time1: new Date(),
        Time2: new Date(),
        tid: "",
        type: "save",
        observation: []
    }

    const THEAD = [
        t("S.No"),
        t("Home/Referral"),
        t("Created by"),
        t("Entry Date"),
        { name: t("Edit"), width: "1%" },
        { name: t("Print"), width: "1%" },

    ]

    const dispatch = useDispatch()
    const { VITE_DATE_FORMAT } = import.meta.env;

    const [values, setValues] = useState(initialValue);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((val) => ({ ...val, [name]: value }));
    };
    const [formValues, setFormValues] = useState([])
    const escortedByOptions = [
        { name: "Family", code: "family" },
        { name: "Friends", code: "friends" },
        { name: "Colleague", code: "colleague" },
        // { name: "Other", code: "other" },   // <-- required for custom input
    ];
    const modeOfArrivalOptions = [
        { name: "Ambulance", code: "ambulance" },
        { name: "Walking", code: "walking" },
        { name: "Wheelchair", code: "wheelchair" },
        { name: "Stretcher", code: "stretcher" }
    ];
    const TRUE_FALSE_OPTIONS = [
        { label: t("Yes"), value: "1" },
        { label: t("No"), value: "0" },
    ];
    const modePayload = {};
    const allKeys = ["ambulance", "walking", "wheelchair", "stretcher"];
    values?.modeOfArrival?.forEach(item => {
        modePayload[item.code] = "1";
    });

    allKeys?.forEach(key => {
        if (!modePayload[key]) {
            modePayload[key] = "0";
        }
    });
    const supportKeys = ["family", "friends", "colleague", "other"];
    const supportPayload = {};

    formValues?.escortedBy?.forEach(item => {
        if (supportKeys.includes(item.code)) {
            supportPayload[item.code] = "1";
        }
    });

    supportKeys.forEach(key => {
        if (!supportPayload[key]) {
            supportPayload[key] = "0";
        }
    });

    supportPayload["other1"] = formValues?.otherText || "";

    const [handleModelData, setHandleModelData] = useState({});
    const [modalData, setModalData] = useState({});
    const handleAllergyAPI_ref = useRef(null);
    const { GetAllDoctorList } = useSelector((state) => state?.CommonSlice);
    const [tableData, setTableData] = useState([])
    const handleModel = (
        label,
        width,
        type,
        isOpen,
        Component,
        handleInsertAPI
    ) => {
        setHandleModelData({
            label: label,
            width: width,
            type: type,
            isOpen: isOpen,
            Component: Component,
            handleInsertAPI,
        });
    };
    const [DropDownState, setDropDownState] = useState({
        bindAllergyList: [],
        bindAdmitToWard: [],
    })

    const handleReactSelectChange = (name, val) => {
        debugger
        setValues((prev) => ({
            ...prev,
            [name]: val,
        }));
    }


    const getBindAllergyList = async () => {
        try {
            const data = await bindAllergyListApi();
            return data?.data;
        } catch (error) {
            console.error(error);
        }
    };
    const getbindAdmitToWardList = async () => {
        try {
            const data = await bindAdmitToWardApi();
            return data?.data;
        } catch (error) {
            console.error(error);
        }
    };
    const FetchAllDropDown = async () => {
        try {
            const [BindAllergyList, BindAdmitToWardApi] = await Promise.all([
                getBindAllergyList(),
                getbindAdmitToWardList(),

            ]);

            const dropDownData = {

                bindAllergyList: handleReactSelectDropDownOptions(
                    BindAllergyList,
                    "AllergyName",
                    "ID"
                ),
                bindAdmitToWard: handleReactSelectDropDownOptions(
                    BindAdmitToWardApi,
                    "WardName",
                    "RoomID"
                )
            };

            setDropDownState(dropDownData);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }



    const handleAllergyAPI = async () => {
        const payload = handleAllergyAPI_ref.current();

        if (!payload?.name) {
            return notify(t("Please enter Allergy Name"), "warn")
        }
        const response = await saveOrUpdateAllergyApi(payload);
        if (response?.success) {
            notify(response?.message, "success")
            const list = await getBindAllergyList();
            setDropDownState(prev => ({
                ...prev,
                bindAllergyList: handleReactSelectDropDownOptions(list, "AllergyName", "ID")
            }));
            setIsOpen()

        } else {
            notify(response?.message, "error")
        }

    };

    const fetchList = async () => {
        const resp = await getListOfAandETriageApi(transactionID)
        if (resp?.success) {
            setTableData(resp?.data)
        } else {
            setTableData([])
        }
    }


    const handleEdit = (item) => {
        const selectedArrivalModes = modeOfArrivalOptions
            .filter(x => item[x.name] === 1)   // keep only where value = 1
            .map(x => ({ name: x.name, code: x.code }));

        const escortedValues = escortedByOptions
            .filter((x) => item[x.name] === 1)
            .map((x) => ({
                name: x.name,
                code: x.code
            }));

        // if (item.Other === 1 && item.Other1) {
        //     escortedValues.push({
        //         name: item.Other1,
        //         code: "other"
        //     });
        // }

        const time1 = new Date();
        const time2 = new Date();
        if (!item?.Time1) {
            const [hours, minutes, period] = item?.Time1.match(
                /(\d+):(\d+)\s*(AM|PM)/i
            )?.slice(1);
            time1.setHours(
                period === "PM" && hours !== "12"
                    ? +hours + 12
                    : hours === "12" && period === "AM"
                        ? 0
                        : +hours
            );
            time1.setMinutes(+minutes);
        }
        if (!item?.Time2) {
            const [hours, minutes, period] = item?.Time1.match(
                /(\d+):(\d+)\s*(AM|PM)/i
            )?.slice(1);
            time2.setHours(
                period === "PM" && hours !== "12"
                    ? +hours + 12
                    : hours === "12" && period === "AM"
                        ? 0
                        : +hours
            );
            time2.setMinutes(+minutes);
        }
        setValues({
            ...values,

            DATE1: item.Date1 ? new Date(item.Date1) : "",
            DATE2: item.Date2 ? new Date(item.Date2) : "",
            Time1: time1,
            Time2: time2,
            Other: item?.Other,
            otherItem: item?.Other1 ?? 0,
            patientName: item.patientName || "",
            mrdNo: item.MRDNo || "",
            age: item.Age || "",
            sex: item.sex || "",
            modeOfArrival: selectedArrivalModes,

            Ambulance: item.Ambulance?.toString() || "0",
            Wheelchair: item.Wheelchair?.toString() || "0",
            Stretcher: item.Stretcher?.toString() || "0",
            Walking: item.Walking?.toString() || "0",
            TetenusToxoid: item.TetenusToxoid?.toString() || "0",
            Valuable: item.ValuableChecked?.toString() || "0",
            removed: item.Removed?.toString() || "0",
            other: item.Other?.toString() || "0",
            Family: item.Family?.toString() || "0",
            Friends: item.Friends?.toString() || "0",
            Colleague: item.Colleague?.toString() || "0",

            admitToWard: item.AdmitToWard,
            homeReferral: item.HomeReferral
                ? { value: item.HomeReferral, label: item.HomeReferral }
                : "",
            Doctor: item.DoctorName,
            DoctorAttending: item.DrAttending,

            // Text Areas
            TriageNotes: item.TriageNotes || "",
            PassedMedical: item.PassedMedicalHistory || "",
            RoutineMeds: item.RutineMeds || "",
            Laboratory: item.Laboratory || "",
            Radiology: item.Radiology || "",
            Procedures: item.Procedures || "",
            Others: item.Other1 || "",
            Communication: item.Communication || "",
            Decision: item.Decision || "",
            ChiefComplaint: item.ChiefComplaint || "",

            // Allergy selection
            Allergy: item.Allergies,
            // ? { value: item.Allergies, label: item.Allergies }
            // : "",

            // Communicable
            CommunicableDiseases: item.CommunicableDiseases || "",

            // Vital Signs
            bp: item.bp || "",
            pulse: item.pulse || "",
            resp: item.resp || "",
            temp: item.temp || "",
            spo2: item.spo2 || "",
            avpuGcs: item.avpuGcs || "",
            weight: item.weight || "",
            Lmp: item.LMP || "",
            id: item?.ID || 0,

            DischargeDiagnosis: item.DischargeDiagnosis || "",
            otherTests: item.OtherTests || "",
        });

        setFormValues((prev) => ({
            ...prev,
            escortedBy: escortedValues
        }));

        // setIsEditing(true);
    };
    console.log(formValues, values);


    useEffect(() => {
        FetchAllDropDown();
        dispatch(GetAllDoctor());
        fetchList()
    }, [])
    const setIsOpen = () => {
        setHandleModelData((val) => ({ ...val, isOpen: false }));
    };

    const makePayload = (v) => {
        debugger
        // const otherItem = v?.escortedBy?.find(x => x.code === "other");
        return {

            transactionID: v?.transactionID || "",
            patientID: v?.patientID || "",
            patientName: v?.patientName || "",
            mrdNo: v?.mrdNo || "",
            sex: v?.sex || "",
            doctorName: v?.Doctor?.value ? v?.Doctor?.value : v?.Doctor ?? "",
            age: v?.age || "",

            date1: v?.DATE1 ? moment(v?.DATE1).format("DD-MMM-YYYY") : "",
            date2: v?.DATE2 ? moment(v?.DATE2).format("DD-MMM-YYYY") : "",
            time1: v?.Time1 ? moment(v?.Time1).format("hh:mm A") : "",


            ambulance: v?.modeOfArrival?.some(x => x.code === "ambulance") ? "1" : "0",
            walking: v?.modeOfArrival?.some(x => x.code === "walking") ? "1" : "0",
            wheelchair: v?.modeOfArrival?.some(x => x.code === "wheelchair") ? "1" : "0",
            stretcher: v?.modeOfArrival?.some(x => x.code === "stretcher") ? "1" : "0",


            tetenusToxoid: v?.TetenusToxoid?.value ? v?.TetenusToxoid?.value : v?.TetenusToxoid ?? "0",

            family: v?.escortedBy?.some(x => x.code === "family") ? "1" : "0",
            friends: v?.escortedBy?.some(x => x.code === "friends") ? "1" : "0",
            colleague: v?.escortedBy?.some(x => x.code === "colleague") ? "1" : "0",

            other: v?.Other?.value ?? v?.Other ?? 0,
            other1: (v?.Other?.value || v?.Other) ? v?.otherItem : "",


            communicableDiseases: v?.CommunicableDiseases || "",
            valuableChecked: v?.Valuable?.value ? v?.Valuable?.value : v?.Valuable ?? "0",
            removed: v?.Removed?.value ? v?.Removed?.value : v?.Removed ?? "0",
            allergies: v?.Allergy?.ID ? v?.Allergy?.ID : v?.Allergy ?? "",

            chiefComplaint: v?.ChiefComplaint || "",
            triageNotes: v?.TriageNotes || "",
            passedMedicalHistory: v?.PassedMedical || "",
            rutineMeds: v?.RoutineMeds || "",
            laboratory: v?.Laboratory || "",
            radiology: v?.Radiology || "",
            procedures: v?.Procedures || "",
            otherTests: v?.otherTests || "",

            communication: v?.Communication || "",
            decision: v?.Decision || "",
            homeReferral: v?.homeReferral?.value || "",
            admitToWard: v?.admitToWard?.value ? v?.admitToWard?.value : v?.admitToWard || "",
            doctordrop: v?.Doctor?.Name || "",

            time2: v?.Time2 ? moment(v?.Time2).format("hh:mm A") : "",

            dischargeDiagnosis: v?.dischargeDiagnosis || "",
            drAttending: v?.DoctorAttending?.DoctorID ? v?.DoctorAttending?.DoctorID : v?.DoctorAttending || "",
            lmp: v?.Lmp || "",
            id: v?.id ? v?.id : 0,


            observation: v?.observation?.map((o) => ({
                time11: o?.time11 || "",
                time22: o?.time22 || "",
                time33: o?.time33 || "",
                route: o?.route || "",
                medsTreatment: o?.medsTreatment || "",
                givenBy: o?.givenBy || "",
                dose: o?.dose || "",
                site: o?.site || "",
                outcome: o?.outcome || "",
            })) || [],
        };
    };


    const handleSave = async () => {

        const payload = makePayload({ ...values, ...formValues });
        const response = await SaveAandETriageRecordApi(payload)
        if (response?.success) {
            notify(response?.message, "success")
            fetchList();
        } else {
            notify(response?.message, "error")
        }
    }
    const handlePrint = async (item) => {

        const res = await AETriageReportApi(item?.ID, item?.TransactionID)
        if (res?.success) {
            RedirectURL(res?.data?.pdfUrl);
        } else {
            notify(res?.message, "error")
        }
    }
    return (

        <div className="mt-2 spatient_registration_card">
            <form className="patient_registration card">
                <Heading
                    title={t("Entry Details")}
                    isBreadcrumb={false}
                />

                <div className="row p-2">
                    <div className="col-xl-2 col-md-4 col-sm-6 col-12 d-flex">
                        <DatePicker
                            className={`custom-calendar `}
                            respclass="vital-sign-date"
                            id="Date1"
                            name="DATE1"
                            inputClassName={"required-fields"}
                            value={values?.DATE1 ? values?.DATE1 : ""}
                            handleChange={handleChange}
                            lable={t("Date")}
                            placeholder={VITE_DATE_FORMAT}
                        />
                        <TimePicker
                            placeholderName={t("Time")}
                            lable={t("Time")}
                            id="Time"
                            respclass="vital-sign-time ml-1"
                            name="Time1"
                            value={values?.Time1 ? values?.Time1 : new Date()}
                            // value={new Date(`1970-01-01T00:00:00`)}
                            handleChange={handleChange}
                        />
                    </div>
                    <MultiSelectComp
                        placeholderName={t("mode Of Arrival")}
                        id={"modeOfArrival"}
                        name="modeOfArrival"
                        value={values?.modeOfArrival}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={modeOfArrivalOptions}
                        searchable={true}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <ReactSelect
                        placeholderName={t("Tetenus Toxoid")}
                        name="TetenusToxoid"
                        value={values?.TetenusToxoid ? values?.TetenusToxoid : "0"}
                        handleChange={handleReactSelectChange}
                        // requiredClassName="required-fields"
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="TetenusToxoid"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <div className="col-sm-4 col-12">
                        <div
                            className="pt-3 pb-2 pr-2 pl-2 form-group"
                            style={{
                                border: "1px solid #ced4da",
                                borderRadius: "4px",
                                position: "relative",
                            }}
                        >
                            <label className="label" style={{ position: "absolute" }}>
                                {t("escorted By")}
                            </label>
                            <div className="row">

                                <MultiSelectOtherComp
                                    placeholderName={t("Escorted By")}
                                    name="escortedBy"
                                    value={formValues.escortedBy}
                                    dynamicOptions={escortedByOptions}
                                    respclass=" col-sm-4 col-12"
                                    handleChange={(name, val) => setFormValues({ formValues, [name]: val })}
                                />
                                <ReactSelect
                                    placeholderName={t("Other")}
                                    name="Other"
                                    value={values?.Other ? values?.Other : "0"}
                                    handleChange={handleReactSelectChange}
                                    // requiredClassName="required-fields"
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    searchable={false}
                                    id="Other"
                                    respclass="col-sm-4 col-12"
                                    removeIsClearable={true}
                                />
                                {(values?.Other?.value == 1 || values?.Other == 1) ?
                                    <Input
                                        type="text"
                                        className="form-control"
                                        id="otherItem"
                                        name="otherItem"
                                        value={values?.otherItem ? values?.otherItem : ""}
                                        onChange={handleChange}
                                        lable={t("otherItem")}
                                        placeholder=" "
                                        respclass="col-md-4 col-12"
                                    />
                                    : ""}
                            </div>

                        </div>
                    </div>
                    <ReactSelect
                        placeholderName={t("Valuable")}
                        name="Valuable"
                        value={values?.Valuable ? values?.Valuable : "0"}
                        handleChange={handleReactSelectChange}
                        // requiredClassName="required-fields"
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="Valuable"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <ReactSelect
                        placeholderName={t("Removed")}
                        name="Removed"
                        value={values?.Removed ? values?.Removed : "0"}
                        handleChange={handleReactSelectChange}
                        // requiredClassName="required-fields"
                        dynamicOptions={TRUE_FALSE_OPTIONS}
                        searchable={false}
                        id="Removed"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <DatePicker
                        className={`custom-calendar `}
                        id="Date2"
                        name="DATE2"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        inputClassName={"required-fields"}
                        value={values?.DATE2 ? values?.DATE2 : new Date()}
                        handleChange={handleChange}
                        lable={t("Date")}
                        placeholder={VITE_DATE_FORMAT}
                    />
                    <Input
                        type="text"
                        className="form-control required-fields"
                        id="CommunicableDiseases"
                        name="CommunicableDiseases"
                        value={values?.CommunicableDiseases ? values?.CommunicableDiseases : ""}
                        onChange={handleChange}
                        lable={t("Communicable Diseases")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                    <div className="col-xl-2 col-md-3 col-sm-4 col-12">
                        <div className="d-flex">
                            <ReactSelect
                                placeholderName={t("Allergy")}
                                name="Allergy"
                                value={values?.Allergy?.value ? values?.Allergy?.value : values?.Allergy}
                                handleChange={handleReactSelectChange}
                                // requiredClassName="required-fields"
                                dynamicOptions={DropDownState?.bindAllergyList}
                                searchable={false}
                                id="Allergy"
                                respclass="w-100 pr-2"
                                // respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                                removeIsClearable={true}
                            />
                            <button
                                type='button'
                                className="btn btn-sm btn-primary"
                                onClick={() =>
                                    handleModel(
                                        "Allergy Model",
                                        "25vw",
                                        "Allergy",
                                        true,
                                        <AllergyModal
                                            editList={DropDownState?.bindAllergyList}
                                            inputData={{}}
                                            handleSave={handleAllergyAPI_ref}
                                        />,
                                        handleAllergyAPI
                                    )
                                }
                            >
                                <i className="fa fa-plus-circle fa-sm new_record_pluse "></i>
                            </button>
                        </div>
                    </div>
                    <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                        <LabeledInput label={t("Time")} value={values?.time || "—"} />
                    </div>

                    <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                        <LabeledInput label={t("BP")} value={values?.bp || "—"} />
                    </div>

                    <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                        <LabeledInput label={t("Temp")} value={values?.temp || "—"} />
                    </div>

                    <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                        <LabeledInput label={t("Pulse")} value={values?.pulse || "—"} />
                    </div>

                    <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                        <LabeledInput label={t("Resp")} value={values?.resp || "—"} />
                    </div>

                    <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                        <LabeledInput label={t("AVPU/GCS")} value={values?.avpuGcs || "—"} />
                    </div>

                    <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                        <LabeledInput label="SPO2" value={values?.spo2 || "—"} />
                    </div>

                    <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                        <LabeledInput label={t("Weight")} value={values?.weight || "—"} />
                    </div>
                    <Input
                        type="text"
                        className="form-control"
                        id="Lmp"
                        name="Lmp"
                        value={values?.Lmp ? values?.Lmp : ""}
                        onChange={handleChange}
                        lable={t("LMP")}
                        placeholder=" "
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                    />
                </div>
                <Heading
                    title={t("Chief Complaient")}
                    isBreadcrumb={false}
                />
                <div className="row p-2">
                    <TextAreaInput
                        // className='form-control'
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        lable={t('Triage Note')}
                        name="TriageNotes"
                        rows={2}
                        value={values?.TriageNotes}
                        maxLength={200}
                        onChange={handleChange}
                    />
                    <TextAreaInput
                        // className='form-control'
                        lable={t("Passed Medical")}
                        placeholder=""
                        rows={2}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        id={"PassedMedical"}
                        name="PassedMedical"
                        value={values?.PassedMedical}
                        maxLength={200}
                        onChange={handleChange}
                    />
                    <TextAreaInput
                        // className='form-control'
                        lable={t("Routine Meds")}
                        placeholder=""
                        rows={2}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        id={"RoutineMeds"}
                        name="RoutineMeds"
                        value={values?.RoutineMeds}
                        maxLength={200}
                        onChange={handleChange}
                    />
                    <TextAreaInput
                        // className='form-control'
                        lable={t("Laboratory")}
                        placeholder=""
                        rows={2}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        id={"Laboratory"}
                        name="Laboratory"
                        value={values?.Laboratory}
                        maxLength={200}
                        onChange={handleChange}
                    />
                    <TextAreaInput
                        // className='form-control'
                        lable={t("Radiology")}
                        placeholder=""
                        rows={2}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        id={"Radiology"}
                        name="Radiology"
                        value={values?.Radiology}
                        maxLength={200}
                        onChange={handleChange}
                    />
                    <TextAreaInput
                        // className='form-control'
                        lable={t("Procedures")}
                        placeholder=""
                        rows={2}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        id={"Procedures"}
                        name="Procedures"
                        value={values?.Procedures}
                        maxLength={200}
                        onChange={handleChange}
                    />
                    <TextAreaInput
                        // className='form-control'
                        lable={t("otherTests")}
                        placeholder=""
                        rows={2}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        id={"otherTests"}
                        name="otherTests"
                        value={values?.otherTests}
                        maxLength={200}
                        onChange={handleChange}
                    />
                    <TextAreaInput
                        // className='form-control'
                        lable={t("Communication")}
                        placeholder=""
                        rows={2}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        id={"Communication"}
                        name="Communication"
                        value={values?.Communication}
                        maxLength={200}
                        onChange={handleChange}
                    />
                    <TextAreaInput
                        // className='form-control'
                        lable={t("Decision")}
                        placeholder=""
                        rows={2}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        id={"Decision"}
                        name="Decision"
                        value={values?.Decision}
                        maxLength={200}
                        onChange={handleChange}
                    />

                    <ReactSelect
                        placeholderName={t("homeReferral")}
                        name="homeReferral"
                        value={values?.homeReferral?.value ? values?.homeReferral?.value : values?.homeReferral}
                        handleChange={handleReactSelectChange}
                        dynamicOptions={[{ label: t("Home"), value: "Home" }, { label: t("Referral"), value: "Referral" }]}
                        searchable={true}
                        id="homeReferral"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <ReactSelect
                        placeholderName={t("Admit To Ward")}
                        name="admitToWard"
                        className="form-control"
                        value={values?.admitToWard?.value ? values?.admitToWard?.value : values?.admitToWard}
                        handleChange={handleReactSelectChange}
                        // requiredClassName="required-fields"
                        dynamicOptions={DropDownState?.bindAdmitToWard}
                        searchable={true}
                        id="admitToWard"
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        removeIsClearable={true}
                    />
                    <ReactSelect
                        placeholderName={t("Doctor")}
                        className="form-control"
                        id={"Doctor"}
                        name="Doctor"
                        dynamicOptions={handleReactSelectDropDownOptions(
                            GetAllDoctorList,
                            "Name",
                            "DoctorID"
                        )}
                        searchable={true}
                        removeIsClearable={true}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        // requiredClassName={"required-fields"}
                        value={values?.Doctor?.value ? values?.Doctor?.value : values?.Doctor}
                        handleChange={handleReactSelectChange}
                    />
                    <TimePicker
                        placeholderName={t("Time")}
                        lable={t("Time")}
                        id="Time"
                        name="Time2"
                        value={values?.Time2 ? values?.Time2 : new Date()}
                        // value={new Date(`1970-01-01T00:00:00`)}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        handleChange={handleChange}
                    />

                    <div className="col-xl-2 col-md-4 col-sm-4 col-12">
                        <LabeledInput
                            label={t("Discharge Diagnosis")}
                            value={values?.dischargeDiagnosis || "—"}
                        />
                    </div>
                    <ReactSelect
                        placeholderName={t("Attending Doctor")}
                        className="form-control"
                        id={"DoctorAttending"}
                        name="DoctorAttending"
                        dynamicOptions={handleReactSelectDropDownOptions(
                            GetAllDoctorList,
                            "Name",
                            "DoctorID"
                        )}
                        searchable={true}
                        removeIsClearable={true}
                        respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                        // requiredClassName={"required-fields"}
                        value={values?.DoctorAttending?.value ? values?.DoctorAttending?.value : values?.DoctorAttending}
                        handleChange={handleReactSelectChange}
                    />
                    <button
                        className="btn btn-sm btn-success"
                        type="button"
                        style={{ float: "right" }}
                        onClick={() => {
                            handleSave("save");
                        }}
                    >
                        {values?.id ? t("Update") : t("Save")}
                    </button>
                </div>

            </form >


            <div className="patient_registration card">
                {tableData?.length > 0 &&
                    <>
                        <Heading
                            title={t("History")}
                            isBreadcrumb={false}
                        />
                        <Tables thead={THEAD}
                            tbody={tableData?.map((item, index) => ({
                                SNo: index + 1,
                                Refferral: item?.HomeReferral,
                                created: item?.CreatedBy,
                                createdDate: item?.CreatedDate1 ? moment(item?.CreatedDate1).format("DD-MMM-YYYY") : "",
                                edit: (

                                    <i className="fa fa-edit" aria-hidden="true" onClick={() => { handleEdit(item) }}></i>),
                                print: <div
                                    // className='btn btn-primary'
                                    style={{ textAlign: "center", cursor: "pointer" }}
                                    onClick={() => handlePrint(item)}
                                >
                                    <ReprintSVG />
                                </div>
                            }))}
                        />

                    </>
                }
            </div>


            {handleModelData?.isOpen && (
                <Modal
                    visible={handleModelData?.isOpen}
                    setVisible={setIsOpen}
                    modalWidth={handleModelData?.width}
                    Header={t(handleModelData?.label)}
                    handleAPI={handleModelData?.handleInsertAPI}
                    setModalData={setModalData}
                    modalData={modalData}
                >
                    {handleModelData?.Component}
                </Modal>

            )}
        </div >
    )
}

export default AETriageForm