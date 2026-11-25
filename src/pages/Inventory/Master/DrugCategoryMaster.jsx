import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Input from "../../../components/formComponent/Input";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import Tables from "../../../components/UI/customTable";
import { useSelector } from "react-redux";
import {
    StoreItemMasterGetDrugCategoryMaster,
    StoreItemMasterSaveDrugCategoryMaster,
} from "../../../networkServices/InventoryApi";
import { bindFieldList } from "../../../networkServices/Emergency";
import { notify } from "../../../utils/utils";
import { DRUGCATEGORYMASTERMODAL_OPTIONS } from "../../../utils/constant";
import { translateOptions } from "@components/WrapTranslate";

const DrugCategoryMaster = ({ setModalData }) => {
    const { t } = useTranslation();
    const [tableData, setTableData] = useState([]);
    const [list, setList] = useState({});
    const [values, setValues] = useState({
        DrugCategory: "",
        PrescriptionReq: "",
        DrugCategoryColor: "",
        ColorCode: "",
        IsActive: 1,
        isEdit: 0,
    });
    console.log("values", values)

    const { getBindPanelListData } = useSelector((state) => state?.CommonSlice);

    /** Handle Input Change */
    const handleChange = ({ target: { name, value } }) =>
        setValues((prev) => ({ ...prev, [name]: value }));

    /** Handle Select Change */
    const handleReactSelect = (name, selectedOption) => {
        if (name === "DrugCategoryColor") {
            setValues((prev) => ({
                ...prev,
                [name]: selectedOption?.label || "",
                ColorCode: selectedOption?.value || "",
            }));
        } else {
            setValues((prev) => ({ ...prev, [name]: selectedOption?.label || "" }));
        }
    };

    /** Fetch Color + Status List */
    const bindAllList = useCallback(async () => {
        try {
            const data = await bindFieldList();
            if (data?.success) {
                const triageOptions = data.data
                    .filter((item) => item?.TypeID === 1)
                    .map((item) => ({ ...item, value: item.ColorCode }));

                setList({
                    statusList: data.data.filter((i) => i?.TypeID === 2),
                    DrugCategoryColor: triageOptions,
                });
            } else {
                setList({ statusList: [], DrugCategoryColor: [] });
            }
        } catch (error) {
            console.error("bindAllList error:", error);
        }
    }, []);

    /** Fetch Drug Category Table Data */
    const getData = useCallback(async () => {
        const response = await StoreItemMasterGetDrugCategoryMaster();
        if (response?.success) {
            setTableData(response?.data || []);
        } else {
            notify(response?.message, "error");
        }
    }, []);

    /** Save / Update Drug Category */
    const handleSave = async () => {
        
        const payload = {
            durgName: values?.DrugCategory,
            drugColor: values?.ColorCode,
            isPrescriptionRequired: values?.PrescriptionReq === "Yes" ? 1 : 0,
            drugCategoryMasterID: values?.isEdit ? values?.ID : 0,
            isActive: values?.IsActive ?? 1,
        };

        const response = await StoreItemMasterSaveDrugCategoryMaster(payload);
        if (response?.success) {
            notify(response?.message, "success");
            getData();
            setValues({
                DrugCategory: "",
                PrescriptionReq: "",
                DrugCategoryColor: "",
                ColorCode: "",
                IsActive: 1,
                isEdit: 0,
            });
        } else {
            notify(response?.message, "error");
        }
    };

    /** Handle Edit */
    const handleEdit = (val) => {
        
        setValues({
            ...val,
            DrugCategory: val?.DrugCategoryName,
            ColorCode: val?.DrugCaregoryColor,
            DrugCategoryColor: list?.DrugCategoryColor?.find(
                (item) => item?.value === val?.DrugCaregoryColor
            ),
            PrescriptionReq: val?.IsPrescriptionRequired,
            IsActive: val?.IsActive,
            drugCategoryMasterID: val?.DrugCategoryMasterID,
            isEdit: 1,
        });
    };

    /** Format label for Color Dropdown */
    const handleFormatlabel = (name, label, rest) => (
        <div style={{ backgroundColor: rest?.ColorCode, color: "white" }}>
            {label}
        </div>
    );

    /** Initial Load */
    useEffect(() => {
        bindAllList();
        getData();
    }, [bindAllList, getData]);

    /** Update list when Redux panel list changes */
    useEffect(() => {
        setList((prev) => ({ ...prev, panelList: getBindPanelListData }));
    }, [getBindPanelListData]);

    /** Table Columns */
    const THEAD = [
        { name: t("S.No."), width: "4%" },
        { name: t("Drug Category Name") },
        { name: t("Preview Color"), width: "1%" },
        { name: t("Is prescription Required") },
        { name: t("Drug Category Name") },
        { name: t("Edit"), width: "4%" },
    ];

    return (
        <>
            <div className="row p-2">
                <Input
                    type="text"
                    className="form-control required-fields"
                    id="DrugCategory"
                    name="DrugCategory"
                    onChange={handleChange}
                    value={values?.DrugCategory}
                    lable={t("Drug Category")}
                    placeholder=" "
                    respclass="col-xl-3 col-sm-4 col-md-6 col-12"
                />

                <ReactSelect
                    placeholderName={t("Drug Category Color")}
                    id="DrugCategoryColor"
                    searchable
                    respclass="col-xl-3 col-md-4 col-sm-6 col-12"
                    dynamicOptions={list?.DrugCategoryColor}
                    name="DrugCategoryColor"
                    handleChange={handleReactSelect}
                    value={values?.DrugCategoryName}
                    handleFormatlabel={handleFormatlabel}
                    backgroundColor={values?.ColorCode}
                />

                <ReactSelect
                    placeholderName={t("Prescription Req.")}
                    id="PrescriptionReq"
                    searchable
                    removeIsClearable
                    respclass="col-xl-2 col-md-3 col-sm-6 col-12"
                    dynamicOptions={translateOptions(DRUGCATEGORYMASTERMODAL_OPTIONS, t)}
                    name="PrescriptionReq"
                    handleChange={handleReactSelect}
                    value={values?.PrescriptionReq}
                />

                <button className="btn btn-sm btn-success mx-1 mt-1" onClick={handleSave}>
                    {values?.isEdit ? t("Update") : t("Save")}
                </button>

                <button
                    className="btn btn-sm btn-secondary mx-1 mt-1"
                    onClick={() =>
                        setValues({
                            DrugCategory: "",
                            PrescriptionReq: "",
                            DrugCategoryColor: "",
                            ColorCode: "",
                            IsActive: 1,
                            isEdit: 0,
                        })
                    }
                >
                    {t("Clear")}
                </button>
            </div>

            <Tables
                thead={THEAD}
                tbody={tableData?.map((ele, index) => ({
                    SrNo: index + 1,
                    DrugCategoryName: ele?.DrugCategoryName,
                    PreviewColor: ele?.DrugCaregoryColor,
                    IsPrescriptionRequired: ele?.IsPrescriptionRequired,
                    IsActive: ele?.IsActive,
                    edit: (
                        <i
                            className="fa fa-edit cursor-pointer"
                            aria-hidden="true"
                            onClick={() => handleEdit(ele)}
                        />
                    ),
                }))}
                specificCellStyle={(val, name, inx) =>
                    inx === 2 ? { backgroundColor: val?.PreviewColor } : {}
                }
            />
        </>
    );
};

export default DrugCategoryMaster;
