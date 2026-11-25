import moment from "moment";
import Input from "./Input";
import ReactSelect from "./ReactSelect";
import DatePicker from "./DatePicker";
import TimePicker from "./TimePicker";
const { VITE_DATE_FORMAT } = import.meta.env;
import MultiSelectComp from "./MultiSelectComp";
import BrowseButton from "./BrowseButton";
import { use, useEffect } from "react";
import i18next from "i18next";

const FormField = ({
  field,
  value,
  values,
  documentIds,
  handleCustomChange,
  handleKeyDownFun,
  handleCustomReactSelect,
  getDynamicOptionData,
  handleAddNewData,
  t,
  // VITE_DATE_FORMAT,
  setValues,
  handleImageChange,
  manualTimeEntry,
}) => {
  const {
    ControlName,
    DisplayName,
    IsReadOnly,
    IsDisabled,
    className,
    Type,
    respClass,
    CommonAPITypeID,
    IsAddEnable,
    IsShowCount,
    IsCapital,
  } = field;

  const hasDocuments = (documentIds && documentIds.length > 0) || (values?.documentIds && values.documentIds.length > 0);
  const IsMandatory =
    field.IsMandatory &&
    !(
      (ControlName === "documentName" || ControlName === "ID_Proof_No") &&
      hasDocuments
    );
  // debugger
  useEffect(() => {
    if (ControlName !== "Is_Permanent_Address") return;
    setValues((prev) => ({
      ...prev,
      ParmanentAddress: prev?.Is_Permanent_Address ? prev?.House_No  : "",
    }));
  }, [values?.Is_Permanent_Address]);
  if (Type === "text" || Type === "number") {
    // -------------modified by shoib------------------
    const handleCapitalLatter = (e, Type, ControlName) => {
      if (IsCapital === 1) {
        let event = { ...e };
        event.target.value = event.target.value.toUpperCase();
        handleCustomChange(event, Type, ControlName);
      } else {
        handleCustomChange(e, Type, ControlName);
      }
    };
    return (
      <>
        {IsAddEnable ? (
          <div
            className={className}
            style={IsAddEnable ? { width: "15%" } : {}}
          >
            <div className="row ">
              <Input
                type="text"
                className={`form-control ${IsMandatory && "required-fields"}`}
                id={ControlName}
                name={ControlName}
                readOnly={IsReadOnly}
                value={value || ""}
                onChange={(e) => handleCapitalLatter(e, Type, ControlName)}
                onKeyDown={(e) => handleKeyDownFun(e, ControlName)}
                lable={t(DisplayName)}
                placeholder=" "
                disabled={IsDisabled}
                respclass={IsAddEnable ? "col-10" : respClass || className}
                showTooltipCount={IsShowCount}
              />

              {/* {IsAddEnable === 1 && ( */}
              <div className="box-inner">
                {handleAddNewData(ControlName, field)}
              </div>
              {/* )} */}
            </div>
          </div>
        ) : (
          <Input
            type="text"
            className={`form-control ${IsMandatory && "required-fields"}`}
            id={ControlName}
            name={ControlName}
            readOnly={IsReadOnly}
            value={value || ""}
            onChange={(e) => handleCapitalLatter(e, Type, ControlName)}
            onKeyDown={(e) => handleKeyDownFun(e, ControlName)}
            lable={t(DisplayName)}
            placeholder=" "
            disabled={IsDisabled}
            respclass={respClass || className}
            //  respclass={className || respClass}
            showTooltipCount={IsShowCount}
          />
        )}
      </>
    );
  }
  if (Type === "checkbox") {
    // -------------modified by priyam------------------
    const handleChanges = (e, Type, name) => {
      const { checked, value } = e.target;
      setValues((prev) => ({
        ...prev,
        [name]: Type === "checkbox" ? (checked ? 1 : 0) : value,
      }));
    };
    return (
      <>
        {IsAddEnable ? (
          <div
            className={className}
            style={IsAddEnable ? { width: "15%" } : {}}
          >
            <div className="row">
              <Input
                type="checkbox"
                className={`form-control ${IsMandatory && "required-fields"}`}
                id={ControlName}
                name={ControlName}
                readOnly={IsReadOnly}
                // value={value || 1}
                //  value={value ===1?true:false}
                checked={!!Number(value)}
                onChange={(e) => handleChanges(e, Type, ControlName)}
                onKeyDown={(e) => handleKeyDownFun(e, ControlName)}
                // lable={t(DisplayName)}
                placeholder=" "
                disabled={IsDisabled}
                respclass={IsAddEnable ? "col-10" : respClass || className}
                showTooltipCount={IsShowCount}
              />

              {/* {IsAddEnable === 1 && ( */}
              <div className="box-inner">
                {handleAddNewData(ControlName, field)}
              </div>
              {/* )} */}
            </div>
          </div>
        ) : (
          <Input
            type="checkbox"
            className={`form-control ${IsMandatory && "required-fields"}`}
            id={ControlName}
            name={ControlName}
            readOnly={IsReadOnly}
            // value={value || 1}
            checked={!!Number(value)}
            onChange={(e) => handleChanges(e, Type, ControlName)}
            onKeyDown={(e) => handleKeyDownFun(e, ControlName)}
            // lable={t(DisplayName)}
            placeholder=" "
            disabled={IsDisabled}
            respclass={respClass || className}
            //  respclass={className || respClass}
            showTooltipCount={IsShowCount}
          />
        )}
      </>
    );
  }

  // Radio group - purane ASP.NET reports me "Report Type" / "Sub-Type" jaise
  // chunav radio button hote the, dropdown nahi. Value wahi shakal me rakhte hain
  // jo select rakhta hai ({label, value, ...}), isliye payload banane wala code
  // aur handleCustomReactSelect dono jaise the waise hi chalte hain.
  if (Type === "radio") {
    const radioOptions = getDynamicOptionData(CommonAPITypeID, ControlName);
    const selected = value?.value ?? value ?? "";

    return (
      <div className={respClass || className}>
        <div className="form-group mb-0">
          <label className="lable d-block mb-1">{t(DisplayName)}</label>
          <div className="d-flex flex-wrap" style={{ gap: "14px" }}>
            {radioOptions.map((opt) => (
              <label
                key={String(opt?.value ?? opt?.code)}
                className="m-0"
                style={{ cursor: "pointer", whiteSpace: "nowrap" }}
              >
                <input
                  type="radio"
                  name={ControlName}
                  value={opt?.value ?? opt?.code}
                  checked={String(selected) === String(opt?.value ?? opt?.code)}
                  onChange={() => {
                    if (IsDisabled) return;
                    handleCustomReactSelect(ControlName, opt);
                  }}
                />{" "}
                {t(opt?.label ?? opt?.name)}
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (Type === "select") {
    return (
      <>
        {IsAddEnable ? (
          <div
            className={className}
            style={IsAddEnable ? { width: "15%" } : {}}
          >
            <div className="row ">
              <ReactSelect
                placeholderName={t(DisplayName)}
                searchable={true}
                // respclass={IsAddEnable ? "col-10" : respClass || className}
                respclass={`${IsAddEnable ? "col-10" : respClass || className} ${IsDisabled === 1 ? "readonly-field" : ""}`}
                id={ControlName}
                name={ControlName}
                value={value?.value ? value?.value : value || ""}
                handleChange={(name, val) => {
                  if (IsDisabled) return;
                  handleCustomReactSelect(name, val);
                }}
                requiredClassName={`${IsMandatory && "required-fields"}`}
                dynamicOptions={getDynamicOptionData(
                  CommonAPITypeID,
                  ControlName,
                )}
                // isDisabled={IsDisabled}
                readOnly={IsDisabled}
              />

              {/* {IsAddEnable === 1 && ( */}
              <div className="box-inner">
                {handleAddNewData(ControlName, field)}
              </div>
              {/* )} */}
            </div>
          </div>
        ) : (
          <ReactSelect
            placeholderName={t(DisplayName)}
            searchable={true}
            // respclass={IsAddEnable ? "col-10" : respClass || className}
            respclass={`${IsAddEnable ? "col-10" : respClass || className} ${IsDisabled === 1 ? "readonly-field" : ""}`}
            id={ControlName}
            name={ControlName}
            value={value?.value ? value?.value : value || ""}
            handleChange={(name, val) => {
              if (IsDisabled) return;
              handleCustomReactSelect(name, val);
            }}
            requiredClassName={`${IsMandatory && "required-fields"}`}
            dynamicOptions={getDynamicOptionData(CommonAPITypeID, ControlName)}
            // isDisabled={IsDisabled}
            readOnly={IsDisabled}
          />
        )}
      </>
    );
  }

  if (Type === "datepicker") {
    return (
      <DatePicker
        className={`custom-calendar ${IsMandatory && "required-fields"}`}
        respclass={className || respClass}
        id={ControlName}
        name={ControlName}
        value={value ? moment(value).toDate() : ""}
        handleChange={(e) => handleCustomChange(e, Type, ControlName)}
        lable={t(DisplayName)}
        placeholder={VITE_DATE_FORMAT}
        disable={IsDisabled}
        // respclass={IsAddEnable ? "col-10" : respClass || className}
      />
    );
  }

  if (Type === "multiselect") {
    const dynamicOptions = getDynamicOptionData(
      CommonAPITypeID,
      ControlName,
      "MultiSelect",
      field,
    )?.map((item) => {
      delete item.value;
      return { ...item };
    });
    let removeHeaderAllCheck = false;
    if (dynamicOptions?.find((val) => val?.disabled)) {
      removeHeaderAllCheck = true;
    }
    return (
      <>
        {IsAddEnable ? (
          <div
            className={className}
            style={IsAddEnable ? { width: "15%" } : {}}
          >
            <div className="row ">
              <MultiSelectComp
                placeholderName={t(DisplayName)}
                id={ControlName}
                name={ControlName}
                showSelectAll={!removeHeaderAllCheck}
                value={value || []}
                respclass={IsAddEnable ? "col-10" : respClass || className}
                handleChange={(name, val) =>
                  setValues((prev) => ({
                    ...prev,
                    [name]: val,
                  }))
                }
                dynamicOptions={dynamicOptions}
                searchable
                // respclass={respClass}
                requiredClassName={IsMandatory ? "required-fields" : ""}
              />

              {/* {IsAddEnable === 1 && ( */}
              <div className="box-inner">
                {handleAddNewData(ControlName, field)}
              </div>
              {/* )} */}
            </div>
          </div>
        ) : (
          <MultiSelectComp
            placeholderName={t(DisplayName)}
            id={ControlName}
            name={ControlName}
            showSelectAll={!removeHeaderAllCheck}
            value={value || []}
            handleChange={(name, val) =>
              setValues((prev) => ({
                ...prev,
                [name]: val,
              }))
            }
            // dynamicOptions={getDynamicOptionData(CommonAPITypeID, ControlName, "MultiSelect")}
            dynamicOptions={dynamicOptions}
            searchable
            respclass={IsAddEnable ? "col-10" : respClass || className}
            requiredClassName={IsMandatory ? "required-fields" : ""}
          />
        )}
      </>
    );
  }

  if (Type === "timepicker") {
    return (
      <TimePicker
        className={`custom-time ${IsMandatory && "required-fields"}`}
        respclass={className || respClass}
        id={ControlName}
        name={ControlName}
        value={value ? moment(value).toDate() : ""}
        //   value={value ? moment(value).toDate() : null}
        handleChange={(e) => handleCustomChange(e, Type, ControlName)}
        lable={t(DisplayName)}
        placeholder={i18next.t("HH:MM AM/PM")}
        disable={IsDisabled}
        manualEntry={manualTimeEntry}
      />
    );
  }

  if (Type === "imageUploader") {
    return (
      <div className={className || respClass}>
        <BrowseButton
          name={ControlName}
          handleImageChange={handleImageChange}
          label={t(DisplayName)}
          value={value}
          className={"col-12"}
        />
      </div>
    );
  }

  return null;
};

const DynamicForm = ({
  dynamicData,
  values,
  documentIds,
  handleCustomChange,
  handleKeyDownFun,
  handleCustomReactSelect,
  getDynamicOptionData,
  handleAddNewData,
  t,
  VITE_DATE_FORMAT,
  setValues,
  handleImageChange,
  manualTimeEntry,
}) => {
  return (
    <>
      {dynamicData?.map((field, index) => {
        const nextField = dynamicData?.[index + 1];
        if (field?.IsActive === 0) {
          return null;
        }
        if (
          nextField &&
          field.CommonControlName === nextField.CommonControlName &&
          field.IsActive === 1
        ) {
          return (
            <div
              className={field.className}
              style={{ width: "15%", marginLeft: "0px" }}
              key={field.ControlName}
            >
              <div className="row test">
                <FormField
                  field={field}
                  value={values?.[field.ControlName]}
                  values={values}
                  documentIds={documentIds}
                  handleCustomChange={handleCustomChange}
                  handleKeyDownFun={handleKeyDownFun}
                  handleCustomReactSelect={handleCustomReactSelect}
                  getDynamicOptionData={getDynamicOptionData}
                  handleAddNewData={handleAddNewData}
                  t={t}
                  VITE_DATE_FORMAT={VITE_DATE_FORMAT}
                  respClass={field?.className}
                  setValues={setValues}
                  handleImageChange={handleImageChange}
                  manualTimeEntry={manualTimeEntry}
                />
                <FormField
                  field={nextField}
                  value={values?.[nextField.ControlName]}
                  values={values}
                  documentIds={documentIds}
                  handleCustomChange={handleCustomChange}
                  handleKeyDownFun={handleKeyDownFun}
                  handleCustomReactSelect={handleCustomReactSelect}
                  getDynamicOptionData={getDynamicOptionData}
                  handleAddNewData={handleAddNewData}
                  t={t}
                  respClass={field?.className}
                  VITE_DATE_FORMAT={VITE_DATE_FORMAT}
                  setValues={setValues}
                  handleImageChange={handleImageChange}
                  manualTimeEntry={manualTimeEntry}
                />
              </div>
            </div>
          );
        }

        // ✅ Skip duplicate rendering for paired fields
        if (
          field.CommonControlName ===
          dynamicData?.[index - 1]?.CommonControlName
        ) {
          return null;
        }

        // ✅ Normal single field
        return (
          <FormField
            key={field.ControlName}
            field={field}
            value={values?.[field.ControlName]}
            values={values}
            documentIds={documentIds}
            handleCustomChange={handleCustomChange}
            handleKeyDownFun={handleKeyDownFun}
            handleCustomReactSelect={handleCustomReactSelect}
            getDynamicOptionData={getDynamicOptionData}
            handleAddNewData={handleAddNewData}
            t={t}
            VITE_DATE_FORMAT={VITE_DATE_FORMAT}
            setValues={setValues}
            handleImageChange={handleImageChange}
            manualTimeEntry={manualTimeEntry}
          />
        );
      })}
    </>
  );
};

export default DynamicForm;
