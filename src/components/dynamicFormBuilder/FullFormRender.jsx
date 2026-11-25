import React from "react";
import { useSelector } from "react-redux";
import Input from "../formComponent/Input";
import ReactSelect from "../formComponent/ReactSelect";
import Heading from "../UI/Heading";
import Button from "../formComponent/Button"; 
// import MultiSelectComp from "../formComponent/MultiSelectComp";

import TextAreaInput from "../formComponent/TextAreaInput";
import Checkbox from "../formComponent/Checkbox";
import DatePicker from "../formComponent/DatePicker";
import TimePicker from "../formComponent/TimePicker";
import Tables from "../UI/customTable";
import AlignTableText from "../commonComponents/AlignTableText";
import HandleFieldTypeControl from "./HandleFieldTypeControl";
import FormBuilderMultiSelect from "./FormBuilderMultiSelect";
import LabeledInput from "../formComponent/LabeledInput";
import BrowseButton from "../formComponent/BrowseButton";
import { notify } from "../../utils/ustil2";
import {
  ViewToggle,
  MultiGridListView,
  MultiGridCardView,
  StandardGridListView,
  GridCardView,
} from "./GridCardComponent";
import { useTranslation } from "react-i18next";

const FullFormRender = ({
  field,
  fields,
  setFields,
  isPreview,
  handleChange,
  index,
  handleClick,
  handleAction,
  isUpdate,
  setModalData,
  modalData,
  callApiModal,
  handleImageChange,
}) => {
  const [t] = useTranslation();
  // ─── viewMode state lives here, in FullFormRender ───────────────────────────
  const [viewMode, setViewMode] = React.useState("card");
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const isTableCardListDefault =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find((item) => item?.Name === "IsTableCardShow")
      ?.Value === "1";

  React.useEffect(() => {
    if (isTableCardListDefault) {
      setViewMode("list");
    }
  }, [isTableCardListDefault]);

  // ─── deleteMultiGridList helper ─────────────────────────────────────────────
  const deleteMultiGridList = (val) => {
    let cacheData = [...fields];
    cacheData[index]["multiGridList"] = cacheData[index]["multiGridList"]?.filter(
      (item) => item?.id !== val?.id
    );
    setFields(cacheData);
    notify(t("Item Deleted Successfully"));
  };

  // ─── input ──────────────────────────────────────────────────────────────────
  if (field.type === "input") {
    return (
      <Input
        type="text"
        className={`form-control ${field?.IsMandatory ? "required-fields" : ""}`}
        id={field.name}
        name={field.name}
        maxLength={field?.maxLength}
        value={field.value ? field.value : ""}
        showTooltipCount={field?.isshowcount}
        lable={field.lable}
        disabled={isUpdate ? field?.isDisabled : ""}
        placeholder={field.placeholder}
        respclass={isPreview ? field?.respclass : "w-100"}
        onChange={(e) => {
          handleChange(e.target.name, e.target.value, index, field?.type);
        }}
      />
    );
  }

  // ─── labeledInput ───────────────────────────────────────────────────────────
  if (field?.type === "labeledInput") {
    return (
      <LabeledInput
        label={field?.lable}
        value={field?.value}
        className={isPreview ? field?.respclass : "w-100"}
      />
    );
  }

  // ─── imageUploader ──────────────────────────────────────────────────────────
  if (field?.type === "imageUploader") {
    return (
      <BrowseButton
        className={field?.className}
        label={field?.lable}
        handleImageChange={handleImageChange}
      />
    );
  }

  // ─── select ─────────────────────────────────────────────────────────────────
  if (field?.type === "select") {
    return (
      <>
        {field?.isAddEnable ? (
          <div className={field?.respclass}>
            <div className="d-flex">
              <ReactSelect
                placeholderName={field?.lable}
                id={field?.name?.replace(/[^a-zA-Z0-9]/g, "_")}
                inputId={field?.name?.replace(/[^a-zA-Z0-9]/g, "_")}
                name={field?.name}
                isDisabled={isUpdate ? field?.isDisabled : ""}
                value={field?.value?.value ?? ""}
                dynamicOptions={
                  Array.isArray(field?.dynamicOptions) && field?.isAllOption
                    ? [{ label: t("All"), value: "0" }, ...field?.dynamicOptions]
                    : field?.dynamicOptions
                }
                searchable={true}
                removeIsClearable={false}
                requiredClassName={field?.IsMandatory ? "required-fields" : ""}
                handleChange={(name, value) => {
                  handleChange(name, value, index, field?.type);
                }}
                respclass={"col-11"}
              />
              <button
                className="btn btn-sm btn-primary"
                type="button"
                onClick={() => {
                  setModalData({
                    visible: true,
                    modalData: {},
                    width: "30vw",
                    label: `Create ${field?.lable || "New"}`,
                    CallAPI: callApiModal,
                    ComponentType: "DynamicModal",
                    field: field,
                  });
                }}
              >
                <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
              </button>
            </div>
          </div>
        ) : (
          <ReactSelect
            placeholderName={field?.lable}
            id={field?.name?.replace(/[^a-zA-Z0-9]/g, "_")}
            inputId={field?.name?.replace(/[^a-zA-Z0-9]/g, "_")}
            name={field?.name}
            isDisabled={isUpdate ? field?.isDisabled : ""}
            value={field?.value?.value ?? ""}
            dynamicOptions={
              Array.isArray(field?.dynamicOptions) && field?.isAllOption
                ? [{ label: t("All"), value: "0" }, ...field?.dynamicOptions]
                : field?.dynamicOptions
            }
            searchable={true}
            removeIsClearable={false}
            requiredClassName={field?.IsMandatory ? "required-fields" : ""}
            handleChange={(name, value) => {
              handleChange(name, value, index, field?.type);
            }}
            respclass={isPreview ? field?.respclass : "w-100"}
          />
        )}
      </>
    );
  }

  // ─── multiselect ────────────────────────────────────────────────────────────
  if (field?.type === "multiselect") {
    return (
      <FormBuilderMultiSelect
        respclass={isPreview ? field?.respclass : "w-100"}
        dynamicOptions={field?.dynamicOptions?.map((val) => ({
          ...val,
          value: String(val?.value),
        }))}
        value={field?.value?.length > 0 ? field?.value : []}
        name={field?.name}
        disabled={isUpdate ? field?.isDisabled : ""}
        placeholderName={field?.lable}
        requiredClassName={field?.IsMandatory ? "required-fields" : ""}
        handleChange={(name, value) => {
          handleChange(name, value, index);
        }}
      />
    );
  }

  // ─── heading ────────────────────────────────────────────────────────────────
  if (field?.type === "heading") {
    return (
      <div className={`mb-2 ${field?.respclass}`}>
        <Heading title={field?.lable} />
      </div>
    );
  }

  // ─── button / excelDownloader ────────────────────────────────────────────────
  if (field?.type === "button" || field?.type === "excelDownloader") {
    return (
      <Button
        name={field?.lable}
        type="button"
        className={`btn btn-primary ml-2 mb-2 ml-1 ${field?.className}`}
        handleClick={() => handleClick(field)}
      />
    );
  }

  // ─── excelUploader ───────────────────────────────────────────────────────────
  if (field?.type === "excelUploader") {
    return (
      <div className={isPreview ? field?.respclass : "w-100"}>
        <input
          type="file"
          id={field?.id}
          accept=".xlsx, .xls"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              handleClick(field, file);
              e.target.value = "";
            }
          }}
        />
        <Button
          name={field?.lable}
          type="button"
          className={`btn btn-primary ml-2 ${field?.className}`}
          handleClick={() => document.getElementById(field?.id).click()}
        />
      </div>
    );
  }

  // ─── checkbox ───────────────────────────────────────────────────────────────
  if (field?.type === "checkbox") {
    return (
      <Checkbox
        id={field?.name}
        label={field?.lable}
        className=""
        disabled={isUpdate ? field?.isDisabled : ""}
        respClass={field?.respclass}
        name={field?.name}
        checked={field?.value ? field?.value : false}
        onChange={(name, value) => handleChange(name, value, index)}
      />
    );
  }

  // ─── textarea ────────────────────────────────────────────────────────────────
  if (field?.type === "textarea") {
    return (
      <TextAreaInput
        name={field?.name}
        rows={1}
        maxLength={field?.maxLength}
        value={field?.value ? field?.value : ""}
        lable={field?.lable}
        disabled={isUpdate ? field?.isDisabled : ""}
        placeholder={field?.placeholder}
        className={`${field?.IsMandatory ? "required-fields" : ""} h-24`}
        respclass={isPreview ? field?.respclass : "w-100"}
        onChange={(e) => handleChange(e.target.name, e.target.value, index)}
      />
    );
  }

  // ─── datepicker ──────────────────────────────────────────────────────────────
  if (field?.type === "datepicker") {
    return (
      <DatePicker
        id={field?.name}
        name={field?.name}
        disabled={isUpdate ? field?.isDisabled : ""}
        value={field?.value ? field?.value : new Date()}
        lable={field?.lable}
        className={`${field?.IsMandatory ? "required-fields" : ""} custom-calendar`}
        respclass={isPreview ? field?.respclass : "w-100"}
        handleChange={(e) => handleChange(e.target.name, e.target.value, index)}
        disable={field?.isDisabled}
      />
    );
  }

  // ─── timepicker ──────────────────────────────────────────────────────────────
  if (field?.type === "timepicker") {
    return (
      <TimePicker
        name={field?.name}
        value={field?.value ? field?.value : new Date()}
        lable={field?.lable}
        disabled={isUpdate ? field?.isDisabled : ""}
        placeholder={field?.placeholder}
        className={field?.IsMandatory ? "required-fields" : ""}
        respclass={isPreview ? field?.respclass : "w-100"}
        handleChange={(e) => handleChange(e.target.name, e.target.value, index)}
      />
    );
  }

  // ─── grid: multiGridList (AddInMultigridControl) ──────────────────────────────
  if (
    field?.type === "grid" &&
    field?.multiGridList?.length > 0 &&
    field?.AddInMultigridControl === "true"
  ) {
    const keys = Object.keys(field?.multiGridList[0] || {});
    if (keys.length === 0) return null;

    // Build tableBody for list view
    const tableBody = field?.multiGridList?.map((val, rowIdx) => {
      let obj = {};
      keys.forEach((item) => {
        if (item?.split("*")[0] === "Delete") {
          obj[item?.split("*")[0]] = (
            <i
              className="fa fa-trash text-danger"
              style={{ cursor: "pointer" }}
              onClick={() => deleteMultiGridList(val)}
            ></i>
          );
        } else {
          obj[item?.split("*")[0]] = val[item]?.label
            ? val[item]?.label
            : item === "id"
              ? rowIdx + 1
              : typeof val[item] !== "object"
                ? val[item]
                : "-";
        }
      });
      return obj;
    });

    return (
      <div className="col-12 card" id="printSectionpdf">
        {/* Toggle lives here in FullFormRender */}
        <div className="d-flex align-items-center justify-content-between px-2 pt-2">
          <span style={{ fontWeight: 600, fontSize: "14px" }}>{field?.lable}</span>
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        </div>

        {viewMode === "list" && (
          <MultiGridListView field={field} tableBody={tableBody} keys={keys} />
        )}

        {viewMode === "card" && (
          <MultiGridCardView field={field} deleteMultiGridList={deleteMultiGridList} />
        )}
      </div>
    );
  }

  // ─── grid: standard TableHeader grid ─────────────────────────────────────────
  if (
    field?.type === "grid" &&
    JSON?.parse(field?.TableHeader || "[]")?.length > 0
  ) {
    const tableHeader = JSON.parse(field?.TableHeader || "[]");
    const gridData = field?.gridDatalist || [];

    // Build tableBody for list view
    const tableBody = gridData.map((val, rowIdx) => {
      let obj = {};
      tableHeader.forEach((item) => {
        if (item?.tableKey === "S.No.") {
          obj[item?.tableKey] = (
            <AlignTableText
              value={rowIdx + 1}
              isbold={item?.isBold || false}
              side={item?.tableColumnAlignment}
            />
          );
        } else if (item?.IsAction) {
          obj[item?.tableKey] = (
            <>
              {item?.tableKey
                ?.split("_")
                ?.filter((btnval) => btnval !== "Action")
                ?.map((btnval) => (
                  <i
                    key={btnval}
                    className={`fa fa-${btnval} ${btnval === "trash" ? "text-danger" : ""} ml-2`}
                    onClick={() => handleAction(val, field, true)}
                  ></i>
                ))}
            </>
          );
        } else {
          obj[item?.tableKey] = (
            <HandleFieldTypeControl
              val={val}
              item={item}
              index={rowIdx}
              field={field}
              fields={fields}
              setFields={setFields}
            />
          );
        }
      });
      return obj;
    });

    // Build tfoot totals row
    let tfootData = null;
    if (tableHeader.some((item) => item.isTotal)) {
      let totalObj = {};
      let labelPlaced = false;
      tableHeader.forEach((item) => {
        if (item.isTotal) {
          const total = gridData.reduce(
            (acc, curr) => acc + Number(curr[item.tableKey] || 0),
            0
          );
          totalObj[item.tableKey] = (
            <AlignTableText value={total} isbold={true} side={item?.tableColumnAlignment} />
          );
        } else if (
          !labelPlaced &&
          (item.tableKey === "S.No." || item.tableKey === "index" || !item.IsAction)
        ) {
          totalObj[item.tableKey] = (
            <AlignTableText value="Total" isbold={true} side={item?.tableColumnAlignment} />
          );
          labelPlaced = true;
        } else {
          totalObj[item.tableKey] = "";
        }
      });
      totalObj.colorcode = "#e1f7e1";
      tfootData = [totalObj];
    }

    return (
      <div className="col-12 card" id="printSectionpdf">
        {/* <div className="d-flex align-items-center justify-content-between px-2 pt-2">
          {viewMode === "card" ? (
            <span style={{ fontWeight: 600, fontSize: "14px" }}>{field?.lable}</span>
          ) : (
            <span />
          )}
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        </div> */}

        {/* {viewMode === "list" && ( */}
          <StandardGridListView
            field={field}
            tableHeader={tableHeader}
            tableBody={tableBody}
            tfootData={tfootData}
          />


        {/* {viewMode === "card" && (
          <GridCardView
            tableHeader={tableHeader}
            gridData={gridData}
            handleAction={handleAction}
            field={field}
            fields={fields}
            setFields={setFields}
          />
        )} */}
      </div>
    );
  }

  return null;
};

export default FullFormRender;
