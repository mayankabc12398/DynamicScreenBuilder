import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import ReactSelect from "../formComponent/ReactSelect";
import DatePicker from "../formComponent/DatePicker";

import {
    BinddonorBloodGroup,
    BloodBankBloodRequsteIPdBindDoctor,
    BloodBankBloodRequsteIPdGetItemSubCategory,
    BloodBankBloodRequsteIPdTransfus_Reason,
    BloodBankRequsteIPdGetItemRate,
    BloodBankRequsteIPdSaveIPDReceipt,
    bloodCollectionSearchData,
    BloodRequsteIPdLoadCategory,
    SaveCollectionRecord,
} from "../../networkServices/blooadbankApi";
import moment from "moment";

import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import { handleReactSelectDropDownOptions } from "../../utils/utils";
import Tables from "../UI/customTable";
import Modal from "../modalComponent/Modal";
import BloodCollectionDetails from "../../pages/BloodBank/DonorProcess/BloodCollectionDetails";
import { notify } from "../../utils/ustil2";
import TimePicker from "../formComponent/TimePicker";

const { VITE_DATE_FORMAT } = import.meta.env;

function BloodRequest(props) {
    debugger
    console.log("props?.data ", props?.data)
    const { patientID, ipdno, transactionID, doctorID, pName, panelID, ipdCaseTypeID, scheduleChargeID } = props?.data || {};
    console.log("props?.data", props?.data)
    const [t] = useTranslation();
    const [itemDetails, setItemDetails] = useState({})
    console.log("itemDetails1111", itemDetails)
    const [values, setValues] = useState({
        DateofBlood: new Date(),
        lastTransfusionDate: "",
        historyAdverseDate: "",
        historyPregnancyDate: "",
        bloodGroup: { value: "0", label: "ALL" },
        Historyofblood: { value: "0", label: "No" },
        time: new Date(),
        Historyofadversereaction: { value: "0", label: "No" },
        Historyofpregnancy: { value: "1", label: "Yes" },
        Reasonforbloodtransfus: {},
        hb: "",
        Platlet: "",
        Prothrombin: "",
        INR: "",
        RequestType: { value: "Desperate", label: "Desperate" },
        PatientConsent: { value: "1", label: "Yes" },
        Doctor: {},
        Category: {},
        SubCategory: {},
        Search: "",
        Quantity: "1",
        Reason: "",

    });
    console.log("values", values)

    const [bloodBank, setBloodBank] = useState([]);
    const [doctor, setDoctor] = useState([]);
    const [dropDownState, setDropDownState] = useState({
        doctor: [],
        Category: [],
        SubCategory: [],
        Transfus_Reason: [],
    })
    const [selectedData, setSelectedData] = useState([]);
    const [bloodCollectionData, setBloodCollectionData] = useState([]);
    console.log("first", selectedData)
    const [handleModelData, setHandleModelData] = useState({});
    const [modalData, setModalData] = useState({});

    const isMobile = window.innerWidth <= 800;

    const handleSelect = (name, value) => {
        debugger
        if (name === "Category") {
            // naya category -> purana item aur search saaf, us category ke items lao
            setValues((val) => ({ ...val, SubCategory: {}, Search: "" }))
            bindSubCategory(value)
        }
        if (name === "SubCategory") {
            bindIPdGetItemRate(value?.ItemID.split('#')[0])
        }
        // else{
        setValues((prev) => ({ ...prev, [name]: value }));
        // }

    };

    const handleRemove = (index) => {

        const filterData = selectedData?.filter((_, ind) => ind !== index)
        setSelectedData(filterData)

    }
    const handleChange = (e) => {
        setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleDateTimeChange = (e) => {
        const { name, value } = e.target;
        setValues({
            ...values,
            [name]: value,
        });
    };
    const handledBinddonorBloodGroup = async () => {
        try {
            const response = await BinddonorBloodGroup();
            if (response.success) {
                setBloodBank(response?.data);
            } else {
                console.error(
                    "API returned success as false or invalid response:",
                    response
                );
                setBloodBank([]);
            }
        } catch (error) {
            console.error("Error fetching department data:", error);
            setBloodBank([]);
        }
    };
    const bindDoctor = async () => {
        try {
            const response = await BloodBankBloodRequsteIPdBindDoctor();
            if (response.success) {
                setDropDownState((val) => ({
                    ...val,
                    doctor: handleReactSelectDropDownOptions(
                        response?.data,
                        "Name",
                        "DoctorID"
                    ),
                }));
            } else {
                console.error(
                    "API returned success as false or invalid response:",
                    response
                );
                // setDoctor([]);
            }
        } catch (error) {
            console.error("Error fetching department data:", error);
            // setDoctor([]);
        }
    };
    const bindCategory = async () => {
        try {
            const response = await BloodRequsteIPdLoadCategory();
            if (response.success) {
                setDropDownState((val) => ({
                    ...val,
                    // value = SubCategoryID: sab entries ka CategoryID ek hi (18) hota hai, us se
                    // dropdown do entries ko alag nahi kar paata tha. Save ke liye CategoryID
                    // option par hi rehta hai (neeche payload me wahi jaata hai).
                    Category: handleReactSelectDropDownOptions(
                        response?.data,
                        "Name",
                        "SubCategoryID"
                    ).map((o) => ({ ...o, value: String(o?.value ?? "") })),
                }));
            } else {
                console.error(
                    "API returned success as false or invalid response:",
                    response
                );
                // setDoctor([]);
            }
        } catch (error) {
            console.error("Error fetching department data:", error);
            // setDoctor([]);
        }
    };
    const bindSubCategory = async (category, text = "") => {

        try {
            // "ALL" = saare Blood Bank items (koi sub category filter nahi)
            const isAll = category?.value === "All";
            const response = await BloodBankBloodRequsteIPdGetItemSubCategory(
                isAll ? "" : category?.CategoryID,
                isAll ? "" : category?.SubCategoryID ?? category?.value,
                text,
            );
            if (response.success) {

                const newData = response?.data?.map((item, _) => ({
                    ...item,
                    value: item?.ItemID?.split("#")[0],
                    ItemID:item?.ItemID?.split("#")[0],
                itemName:item?.ItemID?.split("#")[2],
                }))

                setDropDownState((val) => ({
                    ...val,
                    SubCategory: handleReactSelectDropDownOptions(
                        newData,
                        // "itemName",
                        "TypeName",
                        "value"
                    ),
                }));
            } else {
                // purani list na dikhe; category chunne par batao ki item hi nahi bane hain
                setDropDownState((val) => ({ ...val, SubCategory: [] }));
                if (!text) {
                    notify(
                        isAll
                            ? t("No Blood Bank item found. Create the items in Item Master under the Blood Bank sub category (e.g. Process Charges).")
                            : `${t("No item found in")} ${category?.label ?? ""}. ${t("Create the item in Item Master under this sub category.")}`,
                        "warn",
                    );
                }
            }
        } catch (error) {
            console.error("Error fetching department data:", error);
            // setDoctor([]);
        }
    };
    // Search box: chuni hui category ke items naam se filter (thoda ruk kar, har akshar par nahi)
    useEffect(() => {
        if (!values?.Category?.value) return;
        const timer = setTimeout(() => bindSubCategory(values?.Category, values?.Search ?? ""), 400);
        return () => clearTimeout(timer);
    }, [values?.Search]);

    const bindIPdGetItemRate = async (itemID) => {

        try {
            const payload =

            // {
            //     ItemID: "278",
            //     PanelID: "1",
            //     CaseTypeID: "3",
            //     ScheduleChargeID: "1"
            // }
            {
                ItemID:itemID??"",
                PanelID:panelID??"",
                CaseTypeID:ipdCaseTypeID??"",
                ScheduleChargeID:scheduleChargeID??""
            }
            const response = await BloodBankRequsteIPdGetItemRate(payload);
            if (response.success) {
                setItemDetails(response?.data[0])

            } else {
                setItemDetails({})
                console.error(
                    "API returned success as false or invalid response:",
                    response
                );

            }
        } catch (error) {
            console.error("Error fetching department data:", error);

        }
    };
    const bindTransfus_Reason = async () => {
        try {
            const response = await BloodBankBloodRequsteIPdTransfus_Reason();
            if (response.success) {
                setDropDownState((val) => ({
                    ...val,
                    Transfus_Reason: handleReactSelectDropDownOptions(
                        response?.data,
                        "ReasonName",
                        "ID"
                    ),
                }));
            } else {
                console.error(
                    "API returned success as false or invalid response:",
                    response
                );

            }
        } catch (error) {
            console.error("Error fetching department data:", error);

        }
    };

    // bloodCollectionSearchData
    const handleSelectData = () => {
        debugger
        
        if (!values?.Doctor) {
            notify(t("Please Select Doctor"), "warn")
            return
        }

        if (Object.keys(values?.SubCategory || {}).length < 1) {
            notify(t("Please select an Item"), "warn");
            return;
        }
        
        setSelectedData((preV) => (

            [
                ...preV,
                {

                    // DateofBlood: "",
                    bloodGroup: values?.bloodGroup,
                    Historyofblood: values?.Historyofblood,
                    time: moment(values?.time).format("hh:mm A"),
                    Historyofadversereaction: values?.Historyofadversereaction,
                    Historyofpregnancy: values?.Historyofpregnancy,
                    Reasonforbloodtransfus: values?.Reasonforbloodtransfus,
                    hb: values?.hb,
                    Platlet: values?.Platlet,
                    Prothrombin: values?.Prothrombin,
                    INR: values?.INR,
                    RequestType: values?.RequestType,
                    PatientConsent: values?.PatientConsent,
                    Doctor: values?.Doctor,
                    Category: values?.Category,
                    SubCategory: values?.SubCategory,
                    Search: values?.Search,
                    Quantity: values?.Quantity === "" ? 1 : values?.Quantity,
                    Reason: values?.Reason,
                    DateofBlood: moment(values?.DateofBlood).format("YYYY-MM-DD"),
                    lastTransfusionDate: values?.lastTransfusionDate,
                    historyAdverseDate: values?.historyAdverseDate,
                    historyPregnancyDate: values?.historyPregnancyDate,
                    // Historyofadversereaction:values?.Historyofadversereaction
                    Rate:itemDetails?.Rate,
                    RateListID:itemDetails?.RateListID,
                    Type_ID:itemDetails?.Type_ID,
                    ItemCode:itemDetails?.ItemCode,
                    ConfigID:itemDetails?.ConfigID,
                    ItemDisplayName:itemDetails?.ItemDisplayName,
                    ScheduleChargeID:itemDetails?.ScheduleChargeID,
                    // Item:itemDetails?.Item,
                    ItemID:values?.SubCategory?.ItemID,
                    itemName:values?.SubCategory?.itemName,
                    // ItemID:values?.SubCategory?.ItemID,
                    // ScheduleChargeID:itemDetails?.ScheduleChargeID,
                }]
        ))
    }
    
    const thead = [
        { width: "5%", name: t("SNo") },
        { width: "15%", name: t("Sub Category") },
        { width: "15%", name: t("Item") },
        { width: "10%", name: t("Qty") },
        { width: "15%", name: t("Reserve Date") },
        { width: "15%", name: t("Reserve Time") },
        { width: "15%", name: t("Doctor") },
        { width: "10%", name: t("Action") },

    ];

    const handleChangeRejectModel = (data) => {

        console.log("handleChangeRejectModeldata", data)

        setModalData(data);
    };



    const setIsOpen = () => {
        setHandleModelData((val) => ({ ...val, isOpen: false }));
    };

    const handleSave = async () => {

debugger
        const payload = selectedData?.map((val, index) => (

            {
                "panelID": panelID,
                "ipdCaseType_ID": ipdCaseTypeID,
                "tid": transactionID,
                "pid": patientID,
                "category": val?.Category?.CategoryID ?? val?.Category?.value,
                "subCategory": val?.SubCategory?.label,
                "itemID": val?.ItemID,
                "item": val?.itemName??"",
                "typeID": val?.Type_ID??"",
                "quantity": Number(val?.Quantity),
                "rate": Number(val?.Rate??0),
                "serviceDate": moment(val?.DateofBlood).format("YYYY-MM-DD"),
                "reserveTime": val?.time,
                "subCategoryID": val?.SubCategory?.SubCategoryID,
                "doctorID": val?.Doctor?.value,
                "name": pName,
                "docCharges": 0,
                "tnxTypeID": "",
                "itemDisplayName": val?.SubCategory?.TypeName??"",
                "itemCode": val?.ItemCode??"",
                "rateListID":val?.RateListID?? 0,
                "configID": val?.ConfigID??0,
                "rTransfusionID": val?.Reasonforbloodtransfus?.value,
                "hb": val?.hb,
                "platlet": val?.Platlet,
                "prothrombin": val?.Prothrombin,
                "inr": val?.INR,
                "ref_Code": "",
                "scheduleChargeID": val?.ScheduleChargeID ?? "",
                // "His of blood transfusion (last)" - was always sent empty, so never saved
                "historyLastTransfusion": val?.Historyofblood?.value ?? "",
                "historyAdverse": val?.Historyofadversereaction?.value ?? "",
                "historyPregnancy": val?.Historyofpregnancy?.value,
                "requestType": val?.RequestType?.value,
                "consent": val?.PatientConsent?.value,
                "reasonForWholeBlood": val?.Reason,
                "lastTransfusionDate": val?.lastTransfusionDate ? moment(val?.lastTransfusionDate).format("YYYY-MM-DD") : "",
                "historyAdverseDate": val?.historyAdverseDate ? moment(val?.historyAdverseDate).format("YYYY-MM-DD") : "",
                "historyPregnancyDate": val?.historyPregnancyDate ? moment(val?.historyPregnancyDate).format("YYYY-MM-DD") : "",
            }
        ))
        try {
            const response = await BloodBankRequsteIPdSaveIPDReceipt(payload)
            console.log("response",response)
            if (response?.success) {
                notify(response?.message, "success")
                setSelectedData([])
            }
            else {
                notify(response?.message, "error")
            }
        } catch (error) {
            console.log("error", error)
        }

    }
    useEffect(() => {
        handledBinddonorBloodGroup();
        bindDoctor();
        bindCategory();
        bindTransfus_Reason();

    }, []);
    useEffect(() => {
debugger
        setValues((preV) => ({
            ...preV,
            Doctor: dropDownState?.doctor?.find((ele) => ele?.DoctorID == doctorID)

        }))
    }, [dropDownState?.doctor,doctorID]);

    return (
        <>
            {handleModelData?.isOpen && (
                <Modal
                    visible={handleModelData?.isOpen}
                    setVisible={setIsOpen}
                    modalWidth={handleModelData?.width}
                    Header={t(handleModelData?.label)}
                    buttonType={"submit"}
                    buttons={handleModelData?.extrabutton}
                    buttonName={handleModelData?.buttonName}
                    modalData={modalData}
                    setModalData={setModalData}
                    footer={handleModelData?.footer}
                    handleAPI={handleModelData?.handleInsertAPI}
                >
                    {handleModelData?.Component}
                </Modal>
            )}
            <div className=" spatient_registration_card card">
                <Heading title={t("Blood Collection")} isBreadcrumb={true} />

                <div className="row row-cols-lg-5 row-cols-md-2 row-cols-1 p-2">
                    <DatePicker
                        id="DateofBlood"
                        name="DateofBlood"
                        placeholder={VITE_DATE_FORMAT}
                        lable={t("Transfusion Planned")}
                        className="custom-calendar"
                        value={values?.DateofBlood}
                        handleChange={handleChange}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                        maxDate={new Date()}
                    />
                    <TimePicker
                        placeholderName={t("Time")}
                        lable={t("Time")}
                        id="time"
                        name="time"
                        value={values?.time}
                        respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                        handleChange={handleDateTimeChange}
                    />
                    <ReactSelect
                        placeholderName={t("Blood Group")}
                        id={"bloodGroup"}
                        searchable={true}
                        removeIsClearable={true}
                        dynamicOptions={[
                            { value: "0", label: t("ALL") },
                            ...handleReactSelectDropDownOptions(
                                bloodBank,
                                "bloodgroup",
                                "id"
                            ),
                        ]}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                        handleChange={handleSelect}
                        value={`${values?.bloodGroup?.value}`}
                        // requiredClassName={`${"required-fields"}`}
                        name={"bloodGroup"}
                    />
                    <ReactSelect
                        placeholderName={t("His of blood transfusion (last)")}
                        id={"Historyofblood"}
                        searchable={true}
                        removeIsClearable={true}
                        dynamicOptions={[
                            { value: "1", label: t("Yes") },
                            { value: "0", label: t("No") },
                            //   ...handleReactSelectDropDownOptions(
                            //     bloodBank,
                            //     "bloodgroup",
                            //     "id"
                            //   ),
                        ]}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                        handleChange={handleSelect}
                        value={`${values?.Historyofblood?.value}`}
                        // requiredClassName={`${"required-fields"}`}
                        name={"Historyofblood"}
                    />
                    {values?.Historyofblood?.value === "1" &&
                        <DatePicker
                            id="lastTransfusionDate"
                            name="lastTransfusionDate"
                            placeholder={VITE_DATE_FORMAT}
                            lable={t("Transfusion Planned")}
                            className="custom-calendar"
                            value={values?.lastTransfusionDate}
                            handleChange={handleChange}
                            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                            maxDate={new Date()}
                        />
                    }
                    <ReactSelect
                        placeholderName={t("His of adverse reaction")}
                        id={"Historyofadversereaction"}
                        searchable={true}
                        removeIsClearable={true}
                        dynamicOptions={[
                            { value: "1", label: t("Yes") },
                            { value: "0", label: t("No") },

                        ]}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                        handleChange={handleSelect}
                        value={`${values?.Historyofadversereaction?.value}`}
                        // requiredClassName={`${"required-fields"}`}
                        name={"Historyofadversereaction"}
                    />
                    {values?.Historyofadversereaction?.value === "1" &&
                        <DatePicker
                            id="historyAdverseDate"
                            name="historyAdverseDate"
                            placeholder={VITE_DATE_FORMAT}
                            lable={t("Transfusion Planned")}
                            className="custom-calendar"
                            value={values?.historyAdverseDate}
                            handleChange={handleChange}
                            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                            maxDate={new Date()}
                        />
                    }
                    <ReactSelect
                        placeholderName={t("His of pregnancy")}
                        id={"Historyofpregnancy"}
                        searchable={true}
                        removeIsClearable={true}
                        dynamicOptions={[
                            { value: "1", label: t("Yes") },
                            { value: "0", label: t("No") },

                        ]}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                        handleChange={handleSelect}
                        value={`${values?.Historyofpregnancy?.value}`}
                        // requiredClassName={`${"required-fields"}`}
                        name={"Historyofpregnancy"}
                    />
                    {values?.Historyofpregnancy?.value === "1" &&
                        <DatePicker
                            id="historyPregnancyDate"
                            name="historyPregnancyDate"
                            placeholder={VITE_DATE_FORMAT}
                            lable={t("Transfusion Planned")}
                            className="custom-calendar"
                            value={values?.historyPregnancyDate}
                            handleChange={handleChange}
                            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                            maxDate={new Date()}
                        />
                    }
                    <ReactSelect
                        placeholderName={t("Reason for blood transfus.")}
                        id={"Reasonforbloodtransfus"}
                        searchable={true}
                        removeIsClearable={true}
                        dynamicOptions={dropDownState?.Transfus_Reason}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                        handleChange={handleSelect}
                        value={`${values?.Reasonforbloodtransfus?.value}`}
                        // requiredClassName={`${"required-fields"}`}
                        name={"Reasonforbloodtransfus"}
                    />
                    <Input
                        type="text"
                        className="form-control"
                        id="hb"
                        placeholder=" "
                        name="hb"
                        value={values?.hb || ""}
                        onChange={handleChange}
                        lable={t("HB")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <Input
                        type="text"
                        placeholder=""
                        className="form-control"
                        id="Platlet"
                        name="Platlet"
                        value={values?.Platlet || ""}
                        onChange={handleChange}
                        lable={t("Platlet")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        type="text"
                        placeholder=""
                        className="form-control"
                        id="Prothrombin"
                        name="Prothrombin"
                        value={values?.Prothrombin || ""}
                        onChange={handleChange}
                        lable={t("Prothrombin")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        type="text"
                        placeholder=""
                        className="form-control"
                        id="INR"
                        name="INR"
                        value={values?.INR || ""}
                        onChange={handleChange}
                        lable={t("INR")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />




                    <ReactSelect
                        placeholderName={t("Request Type.")}
                        id={"RequestType"}
                        searchable={true}
                        removeIsClearable={true}
                        dynamicOptions={[
                            { value: "Desperate", label: t("Desperate") },
                            { value: "Urgent", label: t("Urgent") },
                            { value: "Elective", label: t("Elective") },

                        ]}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                        handleChange={handleSelect}
                        value={`${values?.RequestType?.value}`}
                        // requiredClassName={`${"required-fields"}`}
                        name={"RequestType"}
                    />
                    <ReactSelect
                        placeholderName={t("Patient Consent")}
                        id={"PatientConsent"}
                        searchable={true}
                        removeIsClearable={true}
                        dynamicOptions={[
                            { value: "1", label: t("Yes") },
                            { value: "0", label: t("No") },

                        ]}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                        handleChange={handleSelect}
                        value={`${values?.PatientConsent?.value}`}
                        // requiredClassName={`${"required-fields"}`}
                        name={"PatientConsent"}
                    />
                    <ReactSelect
                        placeholderName={t("Doctor")}
                        id={"Doctor"}
                        searchable={true}
                        removeIsClearable={true}
                        dynamicOptions={dropDownState?.doctor}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                        handleChange={handleSelect}
                        value={`${values?.Doctor?.value}`}
                        requiredClassName={`${"required-fields"}`}
                        name={"Doctor"}
                    />

                    <ReactSelect
                        placeholderName={t("Category")}
                        id={"Category"}
                        searchable={true}
                        removeIsClearable={true}
                        dynamicOptions={[

                            { label: t("ALL"), value: "All" },
                            ...dropDownState?.Category
                        ]}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                        handleChange={handleSelect}
                        value={`${values?.Category?.value}`}
                        requiredClassName={`${"required-fields"}`}
                        name={"Category"}
                    />
                    <ReactSelect
                        placeholderName={t("items")}
                        id={"SubCategory"}
                        searchable={true}
                        removeIsClearable={true}
                        dynamicOptions={[

                            // { label: "ALL", value: "All" },
                            ...dropDownState?.SubCategory
                        ]}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
                        handleChange={handleSelect}
                        value={`${values?.SubCategory?.value}`}
                        requiredClassName={`${"required-fields"}`}
                        name={"SubCategory"}
                    />
                    <Input
                        type="text"
                        placeholder=""
                        className="form-control"
                        id="Search"
                        name="Search"
                        value={values?.Search || ""}
                        onChange={handleChange}
                        lable={t("Search")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        type="text"
                        placeholder=""
                        className="form-control"
                        id="Quantity"
                        name="Quantity"
                        value={values?.Quantity || ""}
                        onChange={handleChange}
                        lable={t("Quantity")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />
                    <Input
                        type="text"
                        placeholder=""
                        className="form-control"
                        id="Reason"
                        name="Reason"
                        value={values?.Reason || ""}
                        onChange={handleChange}
                        lable={t("Reason for Whole Blood")}
                        respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    />

                    <div className="col-sm-2 col-xl-1">
                        <button
                            className="btn btn-sm btn-success"
                            type="button"
                            // onClick={handleSearchData}
                            onClick={handleSelectData}
                        >
                            {t("Select")}
                        </button>
                    </div>
                </div>

                {selectedData.length > 0 && (
                    <>
                        <div className="card">
                            <Heading title={t("Blood Collection")} isBreadcrumb={false} />
                            <Tables
                                thead={thead}
                                tbody={selectedData?.map((val, index) => ({
                                    sno: index + 1,
                                    Category: val.Category?.label,
                                    item: val.SubCategory?.label || "",
                                    Quantity: val.Quantity || "",
                                    DateofBlood: val.DateofBlood || "",
                                    // Gender: val.Gender || "",
                                    // sexGroup: val.Male || "",
                                    time: val?.time || "",
                                    Doctor: val.Doctor?.Name || "",
                                    action: <i className="fa fa-trash" onClick={() => handleRemove(index)}></i>


                                }))}
                            />
                        </div>
                        <div className="col-sm-2 col-xl-1 p-2">
                            <button
                                className="btn btn-sm btn-success "
                                type="button"
                                onClick={handleSave}
                            // onClick={handleSearchData}
                            // onClick={handleSelectData}
                            >
                                {t("Save")}
                            </button>
                        </div></>
                )}
            </div>

        </>
    );
}

export default BloodRequest;
