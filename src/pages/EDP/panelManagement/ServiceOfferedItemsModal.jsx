import React, { useEffect, useState } from 'react'
import Input from '../../../components/formComponent/Input'
import { useTranslation } from 'react-i18next';
import ReactSelect from '../../../components/formComponent/ReactSelect';
import NewTables from '../../../components/UI/customTable/NestedTable';
import { EDPBindCategoryListAPI, EDPPanelSetUpcopyPanelDiscount, EDPPanelSetUpGetItems, EDPPanelSetUpSavePanelDiscount, getBindSubCategoryListAPI, PanelMasterSavePanelDiscount, ServiceOfferedListAPI } from '../../../networkServices/EDP/edpApi';
import { handleReactSelectDropDownOptions } from '../../../utils/utils';
import { AutoComplete } from 'primereact/autocomplete';
import { notify } from '../../../utils/ustil2';
import Modal from '../../../components/modalComponent/Modal';
import LabeledInput from '../../../components/formComponent/LabeledInput';
import Heading from '../../../components/UI/Heading';
import { EDPLoadPanelCompany } from '../../../networkServices/EDP/govindedp';

export default function ServiceOfferedItemsModal({ data, setModalData }) {
    const initialValues = { OperationType: { value: "2" }, Panel: { value: "", label: "" } };
    const [confirmModalData, setConfirmModalData] = useState({ visible: false });

    const [items, setItems] = useState([]);
    const [values, setValues] = useState(initialValues);
    console.log("values", values)
    const [bodyData, setBodyData] = useState([]);
    console.log("bodyData", bodyData)
    const [list, setList] = useState({ category: [], subCategory: [] });
    const [t] = useTranslation();
    const [dropDownSate, setDropDownState] = useState({
        Panel: []
    })

    console.log("Panel", dropDownSate?.Panel)
    const [copyModalData, setCopyModalData] = useState(false);
    const allKeys = [
        "SelfOpdPer", "SelfOpdAmt", "SelfIpdPer", "SelfIpdAmt",
        "staffOpdPer", "staffOpdAmt", "staffIpdPer", "staffIpdAmt",
        "InsuredOpdPer", "InsuredOpdAmt", "InsuredIpdPer", "InsuredIpdAmt",
        "vipOpdPer", "vipOpdAmt", "vipIpdPer", "vipIpdAmt",
        "SponsoredOpdPer", "SponsoredOpdAmt", "SponsoredIpdPer", "SponsoredIpdAmt",
        "OtherOpdPer", "OtherOpdAmt", "OtherIpdPer", "OtherIpdAmt",
        "ReligionOpdPer", "ReligionOpdAmt", "ReligionIpdPer", "ReligionIpdAmt",
        "StaffIndepentOpdPer", "StaffIndepentOpdAmt", "StaffIndepentIpdPer", "StaffIndepentIpdAmt"
    ]

    const isMobile = window.innerWidth <= 768;

    const thead = [
        { label: isMobile ? t("check") : <input type='checkbox' onChange={(e) => handleSelectAll(e.target.checked)} />, rowSpan: 2, width: "1%" },
        { label: t("Item Name"), rowSpan: 2 },
        { label: t("OPD(%)"), rowSpan: 2 },
        { label: t("OPD(Amt)"), rowSpan: 2 },
        { label: t("IPD(%)"), rowSpan: 2 },
        { label: t("IPD(Amt)"), rowSpan: 2 },
        {
            label: t("Self"), children: [
                { label: t("OPD(%)") }, { label: t("OPD(Amt)") }, { label: t("IPD(%)") }, { label: t("IPD(Amt)") }
            ]
        },
        {
            label: t("Staff"), children: [
                { label: t("OPD(%)") }, { label: t("OPD(Amt)") }, { label: t("IPD(%)") }, { label: t("IPD(Amt)") }
            ]
        },
        {
            label: t("Insured"), children: [
                { label: t("OPD(%)") }, { label: t("OPD(Amt)") }, { label: t("IPD(%)") }, { label: t("IPD(Amt)") }
            ]
        },
        {
            label: t("VIP"), children: [
                { label: t("OPD(%)") }, { label: t("OPD(Amt)") }, { label: t("IPD(%)") }, { label: t("IPD(Amt)") }
            ]
        },
        {
            label: t("Sponsored"), children: [
                { label: t("OPD(%)") }, { label: t("OPD(Amt)") }, { label: t("IPD(%)") }, { label: t("IPD(Amt)") }
            ]
        },
        {
            label: t("Other"), children: [
                { label: t("OPD(%)") }, { label: t("OPD(Amt)") }, { label: t("IPD(%)") }, { label: t("IPD(Amt)") }
            ]
        },
        {
            label: t("Religion"), children: [
                { label: t("OPD(%)") }, { label: t("OPD(Amt)") }, { label: t("IPD(%)") }, { label: t("IPD(Amt)") }
            ]
        },
        {
            label: t("Staff Dependent"), children: [
                { label: t("OPD(%)") }, { label: t("OPD(Amt)") }, { label: t("IPD(%)") }, { label: t("IPD(Amt)") }
            ]
        }
    ];
    // The columns on this screen are fixed - Self / staff / Insured / vip / Sponsored / Other / Religion
    // / StaffIndepent - and PatientTypeID is what Save writes against each one. Match the API's
    // "<name>_PatientType_<id>" columns by the id, not the name, because patient_type.PatientType in the
    // DB is a hospital-set label (Jai Clinic has TPA / CAMP / EWS / CASH on ids 3-7, not Insured / VIP /
    // Sponsored / Religion). Matching by name used to drop every column whose label was renamed.
    const patientTypeMap = [
        { id: 1, prefix: "Self" },
        { id: 2, prefix: "staff" },
        { id: 3, prefix: "Insured" },
        { id: 4, prefix: "vip" },
        { id: 5, prefix: "Sponsored" },
        { id: 6, prefix: "Other" },
        { id: 7, prefix: "Religion" },
        { id: 8, prefix: "StaffIndepent" },
    ];
    const prefixByPatientTypeId = Object.fromEntries(patientTypeMap.map(({ id, prefix }) => [id, prefix]));

    const parseBodyData = (items) => {
        return items.map(item => {
            const parsed = { ...item };
            patientTypeMap.forEach(({ prefix }) => {
                parsed[`${prefix}OpdPer`] = "";
                parsed[`${prefix}IpdPer`] = "";
                parsed[`${prefix}OpdAmt`] = "";
                parsed[`${prefix}IpdAmt`] = "";
            });
            Object.keys(item).forEach((key) => {
                const match = key.match(/_PatientType_(\d+)$/);
                if (!match) return;
                const prefix = prefixByPatientTypeId[Number(match[1])];
                if (!prefix) return;
                const parts = String(item[key] ?? "").split("#");
                const opdPer = parts[0] !== "" && parts[0] !== undefined ? parseFloat(parts[0]) : NaN;
                const ipdPer = parts[1] !== "" && parts[1] !== undefined ? parseFloat(parts[1]) : NaN;
                const opdAmt = parts[2] !== "" && parts[2] !== undefined ? parseFloat(parts[2]) : NaN;
                const ipdAmt = parts[3] !== "" && parts[3] !== undefined ? parseFloat(parts[3]) : NaN;
                parsed[`${prefix}OpdPer`] = Number.isFinite(opdPer) && opdPer !== 0 ? opdPer : (opdPer === 0 ? 0 : "");
                parsed[`${prefix}IpdPer`] = Number.isFinite(ipdPer) && ipdPer !== 0 ? ipdPer : (ipdPer === 0 ? 0 : "");
                parsed[`${prefix}OpdAmt`] = Number.isFinite(opdAmt) && opdAmt !== 0 ? opdAmt : (opdAmt === 0 ? 0 : "");
                parsed[`${prefix}IpdAmt`] = Number.isFinite(ipdAmt) && ipdAmt !== 0 ? ipdAmt : (ipdAmt === 0 ? 0 : "");
            });
            parsed.isChecked = patientTypeMap.some(({ prefix }) =>
                parsed[`${prefix}OpdPer`] !== "" ||
                parsed[`${prefix}IpdPer`] !== "" ||
                parsed[`${prefix}OpdAmt`] !== "" ||
                parsed[`${prefix}IpdAmt`] !== ""
            );

            return parsed;
        });
    };

    const handleChange = (e) => {
        setValues((val) => ({ ...val, [e.target.name]: e.target.value }));
    }
    const handleSelect = async (name, value) => {
        if (name === "category") {
            let apiData = await getBindSubCategoryListAPI(value?.value)
            if (apiData?.success) {
                setList((val) => ({ ...val, subCategory: handleReactSelectDropDownOptions(apiData?.data, "Subcategory", "SubCategoryID") }))
                setValues((val) => ({
                    ...val,
                    ["SubCategory"]: { value: "" },
                }));
            } else {
                setList((val) => ({ ...val, subCategory: [] }))
            }
        }
        setValues((val) => ({
            ...val,
            [name]: value,
        }));
    }

    const getBindList = async () => {
        let [category] = await Promise.all([
            EDPBindCategoryListAPI(),
        ]);
        if (category?.success) {
            setList((val) => ({ ...val, category: handleReactSelectDropDownOptions(category?.data, "Name", "CategoryID") }))
        }
    }

    const BindServiceOfferedList = async (categoryID, subCategoryID, panelID, operationType) => {
        let apiResp = await ServiceOfferedListAPI(categoryID, subCategoryID?.split("#")[0], panelID, operationType)
        if (apiResp?.success) {
            setBodyData(parseBodyData(apiResp?.data?.items))
            console.log("apiResp?.data?.summary", apiResp?.data?.summary)
            if (apiResp?.data?.summary?.length > 0) {
                setValues((val) => ({ ...val, ...apiResp?.data?.summary[0] }))
            } else {
                setValues((val) => ({ ...val, IPDCategory: "", OPDCategory: "", IPDSubCategory: "", OPDSubCategory: "" }))

            }
        }
    }

    useEffect(() => {
        const cat = values?.category?.value;
        const sub = values?.SubCategory?.value;
        const panel = data?.PanelID;
        const op = values?.OperationType?.value;
        // Any filter missing (fresh open, category changed and sub-category cleared, panel not yet
        // supplied) - clear the table instead of leaving the previous panel's rows on screen. Only
        // call the API when all four are set, so the result row count really matches the filters.
        if (!cat || !sub || !panel || !op) {
            setBodyData([]);
            return;
        }
        BindServiceOfferedList(cat, sub, panel, op);
    }, [values?.category?.value, values?.SubCategory?.value, data?.PanelID, values?.OperationType?.value])

    const handleCheckbox = (index) => {
        const data = [...bodyData];
        data[index].isChecked = !data[index].isChecked;
        setBodyData(data);
    };

    const handleSelectAll = (checked) => {
        const data = bodyData.map(item => ({ ...item, isChecked: checked }));
        setBodyData(data);
    };

    useEffect(() => {
        getBindList()
    }, [])

    const handleCustomInput = (index, name, value, type, max = 9999999999999) => {
        if (type === "number") {
            if (!isNaN(value) && Number(value) <= max) {
                const data = [...bodyData];
                data[index][name] = value;
                updateRowSync(data, index, name, value);
                setBodyData(data);
            }
        }
    };

    const updateRowSync = (data, index, name, value) => {
        if (name === "OPD") {
            const opdItems = allKeys.filter(item => item.endsWith("OpdPer"));
            opdItems.forEach(val => data[index][val] = value);
        } else if (name === "OPDAmt") {
            const opdAmtItems = allKeys.filter(item => item.endsWith("OpdAmt"));
            opdAmtItems.forEach(val => data[index][val] = value);
        } else if (name === "IPDPer") {
            const ipdItems = allKeys.filter(item => item.endsWith("IpdPer"));
            ipdItems.forEach(val => data[index][val] = value);
        } else if (name === "IPDAmt") {
            const ipdAmtItems = allKeys.filter(item => item.endsWith("IpdAmt"));
            ipdAmtItems.forEach(val => data[index][val] = value);
        }
    }

    const handleKeyDown = (e, index, name, value) => {
        if (e.key === "Enter") {
            !copyModalData && setConfirmModalData({
                visible: true,
                Component: <div className=''>
                    <h1 style={{ fontSize: "17px", fontWeight: "800", textAlign: "center" }}>{t("Copy Cell Value To The Column !!")}</h1>
                    <div className="d-flex justify-content-center mt-2" style={{ gap: "12px" }}>
                        <button className='btn btn-success' onClick={() => {
                            const data = [...bodyData];
                            data.forEach((row, i) => {
                                data[i][name] = value;
                                updateRowSync(data, i, name, value);
                            });
                            setBodyData(data);
                            setCopyModalData(false)
                            setConfirmModalData({ visible: false })
                        }}>{t("Copy")}</button>
                        <button className='btn btn-danger' onClick={() => {
                            setConfirmModalData({ visible: false })
                            setCopyModalData(false)
                        }}>{t("No")}</button>
                    </div>
                </div>,
                width: "20%",
                footer: <></>,
                label: "Confirmation"
            })

        }
    }

    const handleSelectRow = (e) => {
        const { value } = e;
        console.log(value);
        // handleItemSelect(value?.TypeName, value?.ItemID, value);
        setValues(value);
    };

    const search = async (event) => {
        const payload = {
            Search: event?.query.trim(),
            categoryID: values?.category?.value || 0,
            subCategoryID: values?.SubCategory?.value || 0,
            panelID: data?.PanelID || 0,
            operationType: values?.OperationType?.value || 0
        }
        const response = await EDPPanelSetUpGetItems(payload);
        if (response?.success) {
            setItems(response?.data)
        } else {
            setItems([]);
        }
    };

    const itemTemplate = (item) => {
        return (
            <div
                className="p-clearfix"
            // onClick={() => validateInvestigation(item, 0, 0, 1, 0)}
            >
                <div style={{ float: "left", fontSize: "12px", width: "100%" }}>
                    {item?.TypeName}
                </div>
            </div>
        );
    };

    const handleCopyModal = () => {
        setConfirmModalData({
            visible: true,
            type: "copy",
            width: "30%",
            footer: <></>,
            label: "Copy Panel Service Offered"
        })
    }

    // The Sub Category dropdown's value is a composite that BindPanelsubcatagory builds as
    // CONCAT(SubCategoryID,'#',CategoryID,'#',CategoryName). Index 0 is the SubCategoryID - that is what
    // every save / copy / bind call wants. [1] (CategoryID) was being sent here before, so a save for
    // "Private OPD" happened to land in f_paneldisc because its SubCategoryID equals its CategoryID; any
    // sub-category where the two numbers differ was being written against the wrong SubCategoryID row.
    const subCategoryIDOf = (val) => Number(String(val ?? "").split("#")[0]);

    const handleSaveCopyModal = async () => {
        const payload = {
            "copyFromPanel": data?.PanelID,
            "subCategoryID": subCategoryIDOf(values?.SubCategory?.value),
            "copyToPanel": values?.Panel?.value
        }

        const response = await EDPPanelSetUpcopyPanelDiscount(payload)
        if (response?.success) {
            setModalData({ visible: false });
            setConfirmModalData({ visible: false })
            notify(response?.message, "success");
        } else {
            notify(response?.message, "error")
        }
    }

    const bindPanel = async () => {
        const response = await EDPLoadPanelCompany();

        if (response?.success) {
            setDropDownState((val) => ({
                ...val,
                Panel: handleReactSelectDropDownOptions(
                    response?.data,
                    "Company_Name",
                    "PanelID"
                ),
            }));
        }
    };

    const handleSaveServiceOffered = async () => {
        if (!values?.category?.value || !values?.SubCategory?.value || !values?.OperationType?.value) {
            notify(t("Please select Category, Sub Category and Operation Type"), "error")
            return
        }
        const payloadData = [];
        const categories = [
            { prefix: "Self", patientTypeID: 1 },
            { prefix: "staff", patientTypeID: 2 },
            { prefix: "Insured", patientTypeID: 3 },
            { prefix: "vip", patientTypeID: 4 },
            { prefix: "Sponsored", patientTypeID: 5 },
            { prefix: "Other", patientTypeID: 6 },
            { prefix: "Religion", patientTypeID: 7 },
            { prefix: "StaffIndepent", patientTypeID: 8 }
        ];

        bodyData.forEach(row => {
            if (row.isChecked) {
                categories.forEach(cat => {
                    const opdPer = row[`${cat.prefix}OpdPer`];
                    const opdAmt = row[`${cat.prefix}OpdAmt`];
                    const ipdPer = row[`${cat.prefix}IpdPer`];
                    const ipdAmt = row[`${cat.prefix}IpdAmt`];

                    // Only add to payload if at least one value is present
                    if (opdPer || opdAmt || ipdPer || ipdAmt) {
                        payloadData.push({
                            panelID: data?.PanelID,
                            categoryid: Number(values?.category?.value),
                            subcategoryid: subCategoryIDOf(values?.SubCategory?.value),
                            itemId: row.ItemID,
                            percentage: opdPer || 0,
                            IPDPercentage: ipdPer || 0,
                            OPDAmt: opdAmt || 0,
                            IPDAmt: ipdAmt || 0,
                            operationType: Number(values?.OperationType?.value),
                            patientTypeID: cat.patientTypeID
                        });
                    }
                });
            }
        });

        if (payloadData.length === 0) {
            notify(t("Please select at least one item and enter values"), "error");
            return;
        }

        const payload = {
            "panelID": data?.PanelID,
            "categoryID": Number(values?.category?.value),
            "subCategoryID": subCategoryIDOf(values?.SubCategory?.value),
            "operationType": Number(values?.OperationType?.value),
            "fPaneldisc": payloadData,
            "percentOnCategory": {
                "OPDPercent": values?.OPDCategory ? Number(values?.OPDCategory) : 0,
                "OPDAmt": values?.OPDCategoryAmt ? Number(values?.OPDCategoryAmt) : 0,
                "IPDPercent": values?.IPDCategory ? Number(values?.IPDCategory) : 0,
                "IPDAmt": values?.IPDCategoryAmt ? Number(values?.IPDCategoryAmt) : 0
            },
            "percentOnSubCategory": {
                "OPDPercent": values?.OPDSubCategoryPercent ? Number(values?.OPDSubCategoryPercent) : 0,
                "OPDAmt": values?.OPDSubCategoryAmt ? Number(values?.OPDSubCategoryAmt) : 0,
                "IPDPercent": values?.IPDSubCategoryPercent ? Number(values?.IPDSubCategoryPercent) : 0,
                "IPDAmt": values?.IPDSubCategoryAmt ? Number(values?.IPDSubCategoryAmt) : 0
            }
        }

        const response = await EDPPanelSetUpSavePanelDiscount(payload)
        if (response?.success) {
            notify(response?.message, "success");
            setConfirmModalData({
                visible: true,
                Component: <div className=''>
                    <h1 style={{ fontSize: "17px", fontWeight: "800", textAlign: "center" }}>{t("Do you want to copy same to another Panel ?")} </h1>
                    <div className="d-flex justify-content-center" style={{ gap: "12px" }}>
                        <button className='btn btn-success' onClick={() => {
                            handleCopyModal();
                        }}>{t("Yes Copy to another Panel")}</button>
                        <button className='btn btn-danger' onClick={() => {
                            setConfirmModalData({ visible: false })
                            setModalData({ visible: false })
                        }}>{t("Cancel")}</button>
                    </div>
                </div>,
                width: "40%",
                footer: <></>,
                label: "Confirmation"
            })
        } else {
            notify(response?.message, "error");
        }

    }

    useEffect(() => {
        bindPanel();
    }, []);



    return (
        <>
            <div className='row'>
                <ReactSelect
                    placeholderName={t("Category Name")}
                    searchable={true}
                    removeIsClearable={true}
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    requiredClassName={"required-fields"}
                    dynamicOptions={list?.category}
                    handleChange={handleSelect}
                    value={`${values?.category?.value}`}
                    name={"category"}
                />
                <ReactSelect
                    placeholderName={t("Sub Category Name")}
                    requiredClassName={"required-fields"}
                    searchable={true}
                    removeIsClearable={true}
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    dynamicOptions={list?.subCategory}
                    handleChange={handleSelect}
                    value={`${values?.SubCategory?.value}`}
                    name={"SubCategory"}
                />
                <ReactSelect
                    placeholderName={t("Operation Type")}
                    requiredClassName={"required-fields"}
                    //id={"fallowrateopd"}
                    searchable={true}
                    removeIsClearable={true}
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    dynamicOptions={[
                        { label: t("Set Discount"), value: "2" },
                        { label: t("Set Panel Co-Payment"), value: "3" },
                        { label: t("Set Panel Non-Payable"), value: "1" }
                    ]}
                    handleChange={handleSelect}
                    value={`${values?.OperationType?.value}`}
                    name={"OperationType"}
                />

                <Input
                    type="text"
                    className="form-control"
                    id="OPDCategory"
                    name="OPDCategory"
                    value={values?.OPDCategory}
                    onChange={handleChange}
                    lable={t("Category Opd %")}
                    placeholder=""
                    respclass="col-xl-2 col-md-2 col-sm-2 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="OPDCategoryAmt"
                    name="OPDCategoryAmt"
                    value={values?.OPDCategoryAmt}
                    onChange={handleChange}
                    lable={t("Category Opd Amt.")}
                    placeholder=""
                    respclass="col-xl-2 col-md-2 col-sm-2 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="IPDCategory"
                    name="IPDCategory"
                    value={values?.IPDCategory}
                    onChange={handleChange}
                    lable={t("Category Ipd %")}
                    placeholder=""
                    respclass="col-xl-2 col-md-2 col-sm-2 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="IPDCategoryAmt"
                    name="IPDCategoryAmt"
                    value={values?.IPDCategoryAmt}
                    onChange={handleChange}
                    lable={t("Category Ipd Amt.")}
                    placeholder=""
                    respclass="col-xl-2 col-md-2 col-sm-2 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="OPDSubCategory"
                    name="OPDSubCategoryPercent"
                    value={values?.OPDSubCategoryPercent}
                    onChange={handleChange}
                    lable={t("Sub Category Opd %")}
                    placeholder=""
                    respclass="col-xl-2 col-md-2 col-sm-2 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="OPDSubCategoryAmt"
                    name="OPDSubCategoryAmt"
                    value={values?.OPDSubCategoryAmt}
                    onChange={handleChange}
                    lable={t("Sub Category OPD Amt.")}
                    placeholder=""
                    respclass="col-xl-2 col-md-2 col-sm-2 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="IPDSubCategoryPercent"
                    name="IPDSubCategoryPercent"
                    value={values?.IPDSubCategoryPercent}
                    onChange={handleChange}
                    lable={t("Sub Category Ipd %")}
                    placeholder=""
                    respclass="col-xl-2 col-md-2 col-sm-2 col-12"
                />
                <Input
                    type="text"
                    className="form-control"
                    id="IPDSubCategoryAmt"
                    name="IPDSubCategoryAmt"
                    value={values?.IPDSubCategoryAmt}
                    onChange={handleChange}
                    lable={t("Sub Category IPD Amt.")}
                    placeholder=""
                    respclass="col-xl-2 col-md-2 col-sm-2 col-12"
                />
                {/* <div className="col-xl-4 col-md-2 col-sm-2 col-12">
                    <AutoComplete
                        value={values?.searchtest?.label}
                        suggestions={items}
                        completeMethod={search}
                        // ref={ref}
                        className="required-fields w-100"
                        onSelect={(e) => handleSelectRow(e)}
                        id="searchtest"
                        onChange={(e) => {
                            setValues(e?.value);
                        }}
                        itemTemplate={itemTemplate}
                    />
                    <label
                        // htmlFor={id}
                        className="label lable truncate ml-3 p-1"
                        style={{ fontSize: "5px !important" }}
                    >
                        {t("Search Item")}
                    </label>
                </div> */}
            </div>
            {bodyData?.length > 0 && <div>
                <Heading title={t("Item Details")} /> <NewTables
                    thead={thead}
                    tbody={bodyData?.map((ele, index) => {
                        const row = {
                            checkbox: <input type='checkbox' checked={ele?.isChecked || false} onChange={() => handleCheckbox(index)} />,
                            ItemName: <div style={{ whiteSpace: "normal", width: "100%" }}>{ele?.ItemName}</div>,
                            OPDPer: <Input
                                type="number"
                                className="table-input"
                                respclass={"w-100"}
                                removeFormGroupClass={true}
                                name={"OPD (%)"}
                                disabled={values?.OperationType?.value == "1" ? true : false}
                                value={ele?.OPD ? ele?.OPD : ""}
                                onChange={(e) => { handleCustomInput(index, "OPD", e.target.value, "number", 100) }}
                                onKeyDown={(e) => handleKeyDown(e, index, "OPD", e.target.value)}
                            />,
                            OPDAmt: <Input
                                type="number"
                                className="table-input"
                                respclass={"w-100"}
                                removeFormGroupClass={true}
                                name={"OPD (Amt)"}
                                disabled={values?.OperationType?.value == "1" ? true : false}
                                value={ele?.OPDAmt ? ele?.OPDAmt : ""}
                                onChange={(e) => { handleCustomInput(index, "OPDAmt", e.target.value, "number") }}
                                onKeyDown={(e) => handleKeyDown(e, index, "OPDAmt", e.target.value)}
                            />,
                            IPDPer: <Input
                                type="number"
                                className="table-input"
                                respclass={"w-100"}
                                removeFormGroupClass={true}
                                name={"IPD (%)"}
                                disabled={values?.OperationType?.value == "1" ? true : false}
                                value={ele?.IPDPer ? ele?.IPDPer : ""}
                                onChange={(e) => { handleCustomInput(index, "IPDPer", e.target.value, "number", 100) }}
                                onKeyDown={(e) => handleKeyDown(e, index, "IPDPer", e.target.value)}
                            />,
                            IPDAmt: <Input
                                type="number"
                                className="table-input"
                                respclass={"w-100"}
                                removeFormGroupClass={true}
                                name={"IPD (Amt)"}
                                disabled={values?.OperationType?.value == "1" ? true : false}
                                value={ele?.IPDAmt ? ele?.IPDAmt : ""}
                                onChange={(e) => { handleCustomInput(index, "IPDAmt", e.target.value, "number") }}
                                onKeyDown={(e) => handleKeyDown(e, index, "IPDAmt", e.target.value)}
                            />,
                        };

                        const categories = [
                            { prefix: "Self" },
                            { prefix: "staff" },
                            { prefix: "Insured" },
                            { prefix: "vip" },
                            { prefix: "Sponsored" },
                            { prefix: "Other" },
                            { prefix: "Religion" },
                            { prefix: "StaffIndepent" }
                        ];

                        categories.forEach(cat => {
                            row[`${cat.prefix}OpdPer`] = <Input
                                type="number"
                                className="table-input"
                                respclass={"w-100"}
                                removeFormGroupClass={true}
                                disabled={values?.OperationType?.value == "1" ? true : false}
                                name={`${cat.prefix}OpdPer`}
                                placeholder={""}
                                value={ele?.[`${cat.prefix}OpdPer`] || ""}
                                onChange={(e) => handleCustomInput(index, `${cat.prefix}OpdPer`, e.target.value, "number", 100)}
                                onKeyDown={(e) => handleKeyDown(e, index, `${cat.prefix}OpdPer`, e.target.value)}
                            />;
                            row[`${cat.prefix}OpdAmt`] = <Input
                                type="number"
                                className="table-input"
                                respclass={"w-100"}
                                removeFormGroupClass={true}
                                disabled={values?.OperationType?.value == "1" ? true : false}
                                name={`${cat.prefix}OpdAmt`}
                                placeholder={""}
                                value={ele?.[`${cat.prefix}OpdAmt`] || ""}
                                onChange={(e) => handleCustomInput(index, `${cat.prefix}OpdAmt`, e.target.value, "number")}
                                onKeyDown={(e) => handleKeyDown(e, index, `${cat.prefix}OpdAmt`, e.target.value)}
                            />;
                            row[`${cat.prefix}IpdPer`] = <Input
                                type="number"
                                className="table-input"
                                respclass={"w-100"}
                                removeFormGroupClass={true}
                                disabled={values?.OperationType?.value == "1" ? true : false}
                                name={`${cat.prefix}IpdPer`}
                                placeholder={""}
                                value={ele?.[`${cat.prefix}IpdPer`] || ""}
                                onChange={(e) => handleCustomInput(index, `${cat.prefix}IpdPer`, e.target.value, "number", 100)}
                                onKeyDown={(e) => handleKeyDown(e, index, `${cat.prefix}IpdPer`, e.target.value)}
                            />;
                            row[`${cat.prefix}IpdAmt`] = <Input
                                type="number"
                                className="table-input"
                                respclass={"w-100"}
                                removeFormGroupClass={true}
                                disabled={values?.OperationType?.value == "1" ? true : false}
                                name={`${cat.prefix}IpdAmt`}
                                placeholder={""}
                                value={ele?.[`${cat.prefix}IpdAmt`] || ""}
                                onChange={(e) => handleCustomInput(index, `${cat.prefix}IpdAmt`, e.target.value, "number")}
                                onKeyDown={(e) => handleKeyDown(e, index, `${cat.prefix}IpdAmt`, e.target.value)}
                            />;
                        });

                        return row;
                    })}
                    scrollView={"scrollView"}
                />
            </div >}
            <div className="d-flex justify-content-end mt-2">
                <button onClick={handleSaveServiceOffered} className='btn btn-success ml-2'>{t("Save")}</button>
                <button onClick={() => {
                    setModalData({ visible: false })
                }} className='btn btn-danger ml-2'>{t("Cancel")}</button>

            </div>

            {
                confirmModalData?.visible && (
                    <Modal
                        visible={confirmModalData?.visible}
                        setVisible={(ele, data) => { setConfirmModalData({ visible: false }) }}
                        modalData={confirmModalData?.modalData}
                        modalWidth={confirmModalData?.width}
                        Header={confirmModalData?.label}
                        buttonType="button"
                        buttonName={confirmModalData?.buttonName}
                        footer={confirmModalData?.footer}
                        handleAPI={confirmModalData?.CallAPI}
                    >
                        {confirmModalData?.type === "copy" ? (
                            <div className=''>
                                <div >
                                    <div className="row">
                                        <LabeledInput label={t("Copy Panel Name")} className={"col-xl-12 col-md-12 col-sm-12 col-12"} value={data?.Company_Name} />
                                        <ReactSelect
                                            placeholderName={t("Panel Name")}
                                            searchable={true}
                                            removeIsClearable={true}
                                            respclass="col-xl-12 col-md-12 col-sm-12 col-12 mt-2"
                                            dynamicOptions={dropDownSate?.Panel}
                                            handleChange={handleSelect}
                                            value={`${values?.Panel?.value}`}
                                            name={"Panel"}
                                        />
                                    </div>
                                    <div className='d-flex justify-content-end mt-2'>
                                        <button className='btn btn-success mr-2' onClick={() => {
                                            handleSaveCopyModal();
                                        }}>{t("Save")}</button>
                                        <button className='btn btn-danger' onClick={() => {
                                            setConfirmModalData({ visible: false })
                                            setModalData({ visible: false })
                                        }}>{t("Cancel")}</button>
                                    </div>
                                </div>
                            </div>
                        ) : confirmModalData?.Component}
                    </Modal>
                )
            }
        </>
    )
}
