import React, { useEffect, useRef, useState } from "react";
import ReactSelect from "@app/components/formComponent/ReactSelect";
import Input from "@app/components/formComponent/Input";
import { useTranslation } from "react-i18next";
import ReferenceTypeModel from "../modalComponent/Utils/ReferenceTypeModel";
import PatientTypeModel from "../modalComponent/Utils/PatientTypeModel";
import Modal from "../modalComponent/Modal";
import {
  filterByType,
  filterByTypes,
  inputBoxValidation,
  notify,
} from "../../utils/utils";
import { SavePatientType, UpdatePatientType } from "../../networkServices/directPatientReg";
import {
  CentreWiseCacheByCenterID,
  ReferenceTypeInsert,
} from "../../store/reducers/common/CommonExportFunction";
import { useDispatch, useSelector } from "react-redux";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { MOBILE_NUMBER_VALIDATION_REGX } from "../../utils/constant";
import { Card } from "react-bootstrap";
import Tables from "../UI/customTable";
import { Checkbox } from "primereact/checkbox";
import { Tooltip } from "primereact/tooltip";
import DynamicForm from "@app/components/formComponent/DynamicForm";

const { VITE_DATE_FORMAT } = import.meta.env;

export default function OtherDetails({
  CentreWiseCache,
  handleChange,
  values,
  setValues,
  handleReactSelect,
  isDisableInputs,
  relations,
  setRelations,
  isRelationOfMandatory,
  dynamicData,
  setDynamicData,
  handleOldPatientSearch,
  handleKeyDown,
  showAlternateNumber,
}) {
  const [t] = useTranslation();
  const [handleModelData, setHandleModelData] = useState({});
  const [modalData, setModalData] = useState({});
  // const [relations, setRelations] = useState([]);
  const relation = values?.PendingRelation ?? {
    Relation: "",
    RelationName: "",
    RelationPhone: "",
  };
  const setRelation = (next) =>
    setValues((prev) => ({ ...prev, PendingRelation: next }));

  useEffect(() => {
    if (dynamicData?.otherDetails?.length > 0) {
      const patientType = typeof values?.HospPatientType === "object" && values?.HospPatientType !== null
        ? values.HospPatientType.value
        : values?.HospPatientType;
      const isTrust = patientType == "9";

      const trustField = dynamicData.otherDetails.find(val => val.ControlName === "TrusteeID");
      if (trustField) {
        const expectedIsActive = isTrust ? 1 : 0;
        if (trustField.IsActive !== expectedIsActive) {
          const updatedData = dynamicData.otherDetails.map((val) => {
            if (val.ControlName === "TrusteeID") {
              return { ...val, IsActive: expectedIsActive };
            }
            return val;
          });
          setDynamicData((prev) => ({ ...prev, otherDetails: updatedData }));

          if (!isTrust && values?.TrusteeID) {
            setValues((prev) => ({ ...prev, TrusteeID: "" }));
          }
        }
      }
    }
  }, [values?.HospPatientType, dynamicData?.otherDetails]);

  /* Relation Of follows Gender: Male -> "Son", Female -> "Daughter", and a Female who is
     Married / Remarried / Widow -> "Wife" (the relation master, CentreWiseCache TypeID 6, holds
     Son / Daughter / Wife; the prints add the " Of"). It is filled only while Relation Of is
     empty or still holds the value set here - a relation the user picked is never replaced.
     It is saved like any other: with Relation Name filled it goes out in patientRelationData. */
  const autoRelationRef = useRef("");
  useEffect(() => {
    const gender = String(values?.Gender?.value ?? values?.Gender ?? "").trim().toLowerCase();
    const marital = String(values?.MaritalStatus?.value ?? values?.MaritalStatus ?? "")
      .trim()
      .toLowerCase();
    let suggested = "";
    if (gender === "male") suggested = "Son";
    else if (gender === "female")
      suggested = ["married", "remarried", "widow"].includes(marital) ? "Wife" : "Daughter";

    const current = values?.PendingRelation?.Relation ?? "";
    if (current && current !== autoRelationRef.current) return; // the user's own choice
    autoRelationRef.current = suggested;
    if (current === suggested) return;
    setValues((prev) => ({
      ...prev,
      PendingRelation: {
        ...(prev?.PendingRelation ?? { Relation: "", RelationName: "", RelationPhone: "" }),
        Relation: suggested,
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values?.Gender, values?.MaritalStatus]);

  const handleModel = (
    label,
    width,
    type,
    isOpen,
    Component,
    handleInsertAPI,
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

  const handleChangeModel = (data) => {
    setModalData(data);
  };

  const userData = useLocalStorage("userData", "get");
  const dispatch = useDispatch();

  const handleReferenceTypeAPI = async (data) => {
    let insData = await dispatch(ReferenceTypeInsert(data));
    if (insData?.payload?.status) {
      setModalData({});
      setHandleModelData((val) => ({ ...val, isOpen: false }));
      dispatch(
        CentreWiseCacheByCenterID({
          centreID: userData?.defaultCentre,
        }),
      );
    }
  };

  const setIsOpen = () => {
    setHandleModelData((val) => ({ ...val, isOpen: false }));
  };

  /* Patient Type "+" / edit (same pattern as Area): patient_type rows reach the form through the
     centre cache (TypeID 12), so after a save the cache is reloaded and the saved type selected. */
  const PATIENT_TYPE_CACHE_ID = 12;
  const selectedPatientTypeID = String(
    values?.HospPatientType?.value ?? values?.HospPatientType ?? "",
  ).trim();
  const selectedPatientTypeRow = (CentreWiseCache ?? []).find(
    (r) =>
      Number(r?.TypeID) === PATIENT_TYPE_CACHE_ID &&
      selectedPatientTypeID !== "" &&
      String(r?.ValueField) === selectedPatientTypeID,
  );
  const afterPatientTypeSaved = async (res, fallbackName, successMsg) => {
    const savedID = res?.data?.id ?? res?.data?.ID;
    const savedName = res?.data?.patientType ?? res?.data?.PatientType ?? fallbackName;
    notify(res?.message || t(successMsg), "success");
    setModalData({});
    setHandleModelData((val) => ({ ...val, isOpen: false }));
    await dispatch(CentreWiseCacheByCenterID({ centreID: userData?.defaultCentre }));
    // select it; the HospPatientType effect above still applies the Trustee ID rule
    if (savedID)
      setValues((prev) => ({
        ...prev,
        HospPatientType: { label: savedName, value: savedID },
      }));
  };
  const handlePatientTypeInsertAPI = async (data) => {
    const name = String(data?.patientType || "").trim().toUpperCase();
    if (!name) {
      notify(t("Patient Type is required"), "error");
      return;
    }
    const res = await SavePatientType(name);
    if (!res?.success) {
      notify(res?.message || t("Failed to save patient type"), "error");
      return;
    }
    await afterPatientTypeSaved(res, name, "Patient Type saved successfully");
  };
  const handlePatientTypeUpdateAPI = async (data) => {
    const name = String(data?.patientType || "").trim().toUpperCase();
    if (!name) {
      notify(t("Patient Type is required"), "error");
      return;
    }
    if (!selectedPatientTypeRow?.ValueField) {
      notify(t("Select a patient type to edit"), "error");
      return;
    }
    const res = await UpdatePatientType(selectedPatientTypeRow.ValueField, name);
    if (!res?.success) {
      notify(res?.message || t("Failed to update patient type"), "error");
      return;
    }
    await afterPatientTypeSaved(res, name, "Patient Type updated successfully");
  };

  // master_page_configuration rows of Type 'relation' (RelationOf, RelationName,
  // RelationPhone) carry IsCapital for the hard-coded Relation inputs.
  const relationConfig = (controlName) =>
    dynamicData?.otherDetails?.find(
      (f) => f?.ControlName === controlName && f?.Type === "relation",
    );
  // fin_global_resources -> RelationMandatoryOnRegistration = 1 makes all three mandatory
  // (Index.jsx checks the added relations on Save).
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const isRelationMandatory =
    String(
      (Array.isArray(GetGlobalResources)
        ? GetGlobalResources
        : GetGlobalResources?.data || []
      ).find((item) => item?.Name === "RelationMandatoryOnRegistration")
        ?.Value ?? "",
    ).trim() === "1";
  // eslint-disable-next-line no-unused-vars
  const relationRequired = (controlName) =>
    isRelationMandatory ? "required-fields" : "";

  const handleAddRelation = () => {
    if (relation.Relation && relation.RelationName) {
      setRelations([...relations, { ...relation, isPersonal: true }]);
      setRelation({ Relation: "", RelationName: "", RelationPhone: "" });
    }
  };

  // Enter in Relation Name / Phone = the "+" button: adds the relation to the list below
  // (when Relation Of and Name are filled) and puts the cursor back on Relation Of.
  const handleRelationEnter = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    e.stopPropagation();
    if (!relation?.Relation || !String(relation?.RelationName || "").trim()) return;
    handleAddRelation();
    setTimeout(() => document.getElementById("Relation")?.focus(), 150);
  };

  const handleDeleteRelation = (index) => {
    const updatedRelations = relations.filter((_, i) => i !== index);
    setRelations(updatedRelations);
  };

  const handleChangRelation = (name, selectedOption) => {
    if (selectedOption) {
      setRelation({ ...relation, Relation: selectedOption.value });
    } else {
      setRelation({ ...relation, Relation: "" });
    }
  };

  const handlePersonalToggle = (index) => {
    const updatedRelations = relations.map((rel, i) =>
      i === index ? { ...rel, isPersonal: !rel.isPersonal } : rel,
    );
    setRelations(updatedRelations);
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    if (checked) {
      setValues((prev) => ({
        ...prev,
        parmanentAddress: prev.House_No || "",
        isSameLocalAdd: checked,
      }));
    } else {
      setValues((prev) => ({
        ...prev,
        parmanentAddress: "",
        isSameLocalAdd: checked,
      }));
    }
  };

  const getDynamicOptionData = (CommonAPITypeID) => {
    let data;
    // debugger
    data = filterByTypes(
      CentreWiseCache,
      [CommonAPITypeID],
      ["TypeID"],
      "TextField",
      "ValueField",
    );
    return data;
  };
  const handleCustomReactSelect = (name, value) => {
    if (name === "IsInternational") {
      const updatedData = JSON.parse(
        JSON.stringify(dynamicData?.otherDetails),
      )?.map((val) => {
        if (
          (val?.ControlName === "InternationalCountryID" ||
            val?.ControlName === "Passport_No" ||
            val?.ControlName === "InternationalNumber") &&
          value?.value === "No"
        ) {
          val.IsDisabled = 1;
        } else if (
          (val?.ControlName === "InternationalCountryID" ||
            val?.ControlName === "Passport_No" ||
            val?.ControlName === "InternationalNumber") &&
          value?.value === "Yes"
        ) {
          val.IsDisabled = 0;
        }
        return val;
      });
      setDynamicData((val) => ({ ...val, otherDetails: updatedData }));
      handleReactSelect(name, value);
    } else if (name === "HospPatientType") {
      const selectedValue = typeof value === "object" && value !== null ? value.value : value;
      const isTrust = selectedValue == "9";
      const updatedData = JSON.parse(
        JSON.stringify(dynamicData?.otherDetails),
      )?.map((val) => {
        if (val?.ControlName === "TrusteeID") {
          val.IsActive = isTrust ? 1 : 0;
        }
        return val;
      });
      setDynamicData((val) => ({ ...val, otherDetails: updatedData }));
      if (!isTrust) {
        setValues((prev) => ({ ...prev, [name]: value, TrusteeID: "" }));
      } else {
        setValues((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      handleReactSelect(name, value);
    }
  };

  const handleCustomChange = (e, Type, ControlName) => {
    // debugger
    if (Type === "text") {
      return handleChange(e);
    } else if (Type === "number") {
      return inputBoxValidation(MOBILE_NUMBER_VALIDATION_REGX, e, handleChange);
    }
  };
  // const handleKeyDownFun = (e, ControlName) => {
  //   // hanlde onkeydown if any
  // }
  const handleAddDocumentIDs = (e) => {
    // debugger
    if (e.key === "Enter") {
      let docIDs = documentIds?.find(
        (item) =>
          item?.id === e.target.value ||
          item?.name?.value === values?.documentName?.value,
      );

      let validDocLength = parseInt(
        values?.documentName?.value?.split("#")[1]
          ? values?.documentName?.value?.split("#")[1]
          : 0,
      );
      if (!values?.documentName?.label) {
        notify(t("Please Select Document id"), "error");
      } else if (!e.target.value) {
        notify(t("Document Can't Be Empty"), "error");
      } else if (docIDs?.id) {
        notify(t("This Document Has Already Added"), "error");
      } else if (e.target.value?.length !== validDocLength) {
        notify(
          `${values?.documentName?.label} must be ${validDocLength} digit `,
          "error",
        );
      } else {
        setDocumentIds((val) => [
          ...val,
          { name: values?.documentName, id: e.target.value },
        ]);
        let ids = [...documentIds];
        ids.push({ name: values?.documentName, id: e.target.value });
        setValues((val) => ({
          ...val,
          ID_Proof_No: "",
          documentName: "",
          documentIds: ids,
        }));
      }
      handleKeyDown(e);
    }
  };
  const handleKeyDownFun = (e, ControlName) => {
    // debugger
    if (ControlName === "ID_Proof_No") {
      handleAddDocumentIDs(e);
    } else if ((ControlName, "Barcode")) {
      handleOldPatientSearch(e);
      handleKeyDown(e);
    }
  };

  const handleAddNewData = (ControlName) => {
    // debugger
    if (ControlName === "HospPatientType") {
      return (
        <div className="d-flex flex-nowrap" style={{ gap: "3px" }}>
          <button
            className="btn btn-sm btn-primary"
            disabled={isDisableInputs}
            onClick={() =>
              handleModel(
                "Add Patient Type",
                "25vw",
                "PatientType",
                true,
                <PatientTypeModel handleChangeModel={handleChangeModel} />,
                handlePatientTypeInsertAPI,
              )
            }
            type="button"
            title={t("Add Patient Type")}
          >
            <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
          </button>
          <button
            className="btn btn-sm btn-primary"
            disabled={isDisableInputs || !selectedPatientTypeRow}
            onClick={() =>
              handleModel(
                "Edit Patient Type",
                "25vw",
                "PatientType",
                true,
                <PatientTypeModel
                  handleChangeModel={handleChangeModel}
                  initialName={selectedPatientTypeRow?.TextField || ""}
                />,
                handlePatientTypeUpdateAPI,
              )
            }
            type="button"
            title={t("Edit Patient Type")}
          >
            <i className="fa fa-edit fa-sm new_record_pluse"></i>
          </button>
        </div>
      );
    }
    if (ControlName === "TypeOfReference") {
      return (
        <button
          className="btn btn-sm btn-primary"
          disabled={isDisableInputs}
          onClick={() =>
            handleModel(
              t("Add Reference Type"),
              "20vw",
              "ReferenceType",
              true,
              <ReferenceTypeModel
                handleChangeModel={handleChangeModel}
                inputData={{
                  userID: userData?.employeeID,
                }}
              />,
              handleReferenceTypeAPI,
            )
          }
          type="button"
        >
          <i className="fa fa-plus-circle fa-sm new_record_pluse "></i>
        </button>
      );
    }
  };

  return (
    <>
      <div className="row  g-4 pt-2 pl-2 pr-2">
        <DynamicForm
          dynamicData={
            showAlternateNumber
              ? dynamicData?.otherDetails?.filter(
                  (f) => f.ControlName !== "Phone" && f.ControlName !== "Phone_STDCODE"
                )
              : dynamicData?.otherDetails
          }
          values={values}
          handleCustomChange={handleCustomChange}
          handleKeyDownFun={handleKeyDownFun}
          handleCustomReactSelect={handleCustomReactSelect}
          getDynamicOptionData={getDynamicOptionData}
          handleAddNewData={handleAddNewData}
          t={t}
          VITE_DATE_FORMAT={VITE_DATE_FORMAT}
          setValues={setValues}
        />

        {showAlternateNumber && (
          <>
            <Input
              type="text"
              className="form-control"
              id="Phone_STDCODE"
              name="Phone_STDCODE"
              value={values?.Phone_STDCODE || "+91"}
              onChange={handleChange}
              lable={t("Code")}
              placeholder=" "
              respclass="col-auto"
              style={{ maxWidth: "80px" }}
              disabled={isDisableInputs}
            />
            <Input
              type="text"
              className="form-control required-fields"
              id="Phone"
              name="Phone"
              value={values?.Phone || ""}
              onChange={handleChange}
              lable={t("Alternate Number") + " *"}
              placeholder=" "
              respclass="col"
              disabled={isDisableInputs}
            />
          </>
        )}

        {/* {dynamicData?.otherDetails?.map(({ ControlName, DisplayName, IsReadOnly, IsMandatory, IsDisabled, className, defaultValue, IsActive, Type, respClass, CommonControlName, IsAddEnable, CommonAPITypeID, IsShowCount }, index) => {

          if ((CommonControlName === dynamicData?.otherDetails[index + 1]?.CommonControlName && IsActive === 1)) {

            return <div className={className} style={{ width: "15%", marginLeft: "0px" }}>
              <div className="row">
                {(Type === "text" || Type === "number") ?
                  <Input
                    type="text"
                    className={`form-control ${IsMandatory && "required-fields"}`}
                    id={ControlName}
                    name={ControlName}
                    readOnly={IsReadOnly}
                    value={values?.[ControlName] ? values?.[ControlName] : ""}
                   
                    onChange={(e) => { handleCustomChange(e, Type, ControlName) }}
                    showTooltipCount={IsShowCount}
                    lable={t(DisplayName)}
                    placeholder=" "
                    disabled={IsDisabled}
                    respclass={respClass}
                  /> :
                  <ReactSelect
                    placeholderName={t(DisplayName)}
                    searchable={true}
                    respclass={respClass}
                    id={ControlName}
                    name={ControlName}
                    value={values?.[ControlName] ? values?.[ControlName] : ""}
                    handleChange={(name, value) => { handleCustomReactSelect(name, value) }}
                    dynamicOptions={getDynamicOptionData(CommonAPITypeID, ControlName)}
                    requiredClassName={`${IsMandatory && "required-fields"}`}
                    isDisabled={IsDisabled}
                  />
                }


                {dynamicData?.otherDetails[index + 1]?.Type === "text" || dynamicData?.otherDetails[index + 1]?.Type === "number" ?
                  <Input
                    type="text"
                    className={`form-control ${dynamicData?.otherDetails[index + 1]?.IsMandatory && "required-fields"}`}
                    id={dynamicData?.otherDetails[index + 1]?.ControlName}
                    name={dynamicData?.otherDetails[index + 1]?.ControlName}
                    readOnly={dynamicData?.otherDetails[index + 1]?.IsReadOnly}
                    value={values?.[dynamicData?.otherDetails[index + 1]?.ControlName] ? values?.[dynamicData?.otherDetails[index + 1]?.ControlName] : ""}
                    // onChange={handleChange}
                    // onChange={(e) => {
                    //   dynamicData?.otherDetails[index + 1]?.Type === "text" ? handleChange(e) : inputBoxValidation(
                    //     MOBILE_NUMBER_VALIDATION_REGX,
                    //     e,
                    //     handleChange
                    //   );
                    // }}
                    onChange={(e) => { handleCustomChange(e, dynamicData?.otherDetails[index + 1]?.Type, dynamicData?.otherDetails[index + 1]?.ControlName) }}
                    lable={t(dynamicData?.otherDetails[index + 1]?.DisplayName)}
                    placeholder=" "
                    disabled={dynamicData?.otherDetails[index + 1]?.IsDisabled}
                    respclass={dynamicData?.otherDetails[index + 1]?.respClass}
                    showTooltipCount={IsShowCount}
                  /> :
                  <ReactSelect
                    placeholderName={t(dynamicData?.otherDetails[index + 1]?.DisplayName)}
                    searchable={true}
                    id={dynamicData?.otherDetails[index + 1]?.ControlName}
                    name={dynamicData?.otherDetails[index + 1]?.ControlName}
                    value={values?.[dynamicData?.otherDetails[index + 1]?.ControlName] ? values?.[dynamicData?.otherDetails[index + 1]?.ControlName] : ""}
                    handleChange={(name, value) => { handleCustomReactSelect(name, value) }}
                    requiredClassName={`${dynamicData?.otherDetails[index + 1]?.IsMandatory && "required-fields"}`}
                    dynamicOptions={getDynamicOptionData(dynamicData?.otherDetails[index + 1]?.CommonAPITypeID, dynamicData?.otherDetails[index + 1]?.ControlName)}
                    isDisabled={dynamicData?.otherDetails[index + 1]?.IsDisabled}
                    respclass={dynamicData?.otherDetails[index + 1]?.respClass}
                  />
                }


              </div>
            </div>

          }

          if (CommonControlName === dynamicData?.otherDetails[index - 1]?.CommonControlName) return
          if ((Type === "text" || Type === "number") && IsActive === 1 && CommonControlName !== dynamicData?.otherDetails[index - 1]?.CommonControlName) {
            return <div className={className}>
              <div className="row">
                <Input
                  type="text"
                  className={`form-control ${IsMandatory && "required-fields"}`}
                  id={ControlName}
                  name={ControlName}
                  readOnly={IsReadOnly}
                  value={values?.[ControlName] ? values?.[ControlName] : ""}
                  // onChange={handleChange}
                  // onChange={(e) => {
                  //   Type === "text" ? handleChange(e) : inputBoxValidation(
                  //     MOBILE_NUMBER_VALIDATION_REGX,
                  //     e,
                  //     handleChange
                  //   );
                  // }}
                  onChange={(e) => { handleCustomChange(e, Type, ControlName) }}
                  lable={t(DisplayName)}
                  placeholder=" "
                  disabled={IsDisabled}
                  respclass={respClass ? respClass : "col-12"}
                  showTooltipCount={IsShowCount}
                />
              </div>
            </div>
          } else if (Type === "select" && IsActive === 1) {
            if (IsAddEnable === 1) {
              return <div className={className} style={{ width: "15%", marginLeft: "0px" }}>
                <div className="row">
                  <ReactSelect
                    placeholderName={t(DisplayName)}
                    searchable={true}
                    respclass={"col-10"}
                    id={ControlName}
                    name={ControlName}
                    value={values?.[ControlName] ? values?.[ControlName] : ""}
                    handleChange={(name, value) => { handleCustomReactSelect(name, value) }}
                    // handleChange={handleReactSelect}
                    // dynamicOptions={filterByType(
                    //   CentreWiseCache,
                    //   CommonAPITypeID,
                    //   "TypeID",
                    //   "TextField",
                    //   "ValueField"
                    // )}
                    dynamicOptions={getDynamicOptionData(CommonAPITypeID, ControlName)}
                    isDisabled={IsDisabled}
                  />
                  <div>
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={isDisableInputs}
                      onClick={() =>
                        handleModel(
                          t("Add Reference Type"),
                          "20vw",
                          "ReferenceType",
                          true,
                          <ReferenceTypeModel
                            handleChangeModel={handleChangeModel}
                            inputData={{
                              userID: userData?.employeeID,
                            }}
                          />,
                          handleReferenceTypeAPI
                        )
                      }
                      type="button"
                    >
                      <i className="fa fa-plus-circle fa-sm new_record_pluse "></i>
                    </button>
                  </div>
                </div>
              </div>
            } else {
              return <ReactSelect
                placeholderName={t(DisplayName)}
                searchable={true}
                respclass={className}
                id={ControlName}
                name={ControlName}
                value={values?.[ControlName] ? values?.[ControlName] : ""}
                // handleChange={handleReactSelect}
                handleChange={(name, value) => { handleCustomReactSelect(name, value) }}
                dynamicOptions={getDynamicOptionData(CommonAPITypeID, ControlName)}
                // dynamicOptions={filterByType(
                //   CentreWiseCache,
                //   CommonAPITypeID,
                //   "TypeID",
                //   "TextField",
                //   "ValueField"
                // )}
                isDisabled={IsDisabled}
              />
            }
          }
        })} */}
      </div>

      <div className="row px-2 pb-2">
        <ReactSelect
          placeholderName={t("Relation Of")}
          id="Relation"
          searchable={true}
          name="Relation"
          value={relation?.Relation}
          handleChange={handleChangRelation}
          placeholder=" "
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          requiredClassName={relationRequired("RelationOf")}
          dynamicOptions={filterByType(
            CentreWiseCache,
            6,
            "TypeID",
            "TextField",
            "ValueField",
          )}
          isDisabled={isDisableInputs}
        />

        <Input
          type="text"
          className={`form-control ${relationRequired("RelationName")}`}
          id="Relation_Name"
          name="RelationName"
          value={relation.RelationName}
          onChange={(e) =>
            setRelation({
              ...relation,
              RelationName:
                relationConfig("RelationName")?.IsCapital === 1
                  ? e.target.value.toUpperCase()
                  : e.target.value,
            })
          }
          lable={t("Relation_Name")}
          placeholder=" "
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          disabled={isDisableInputs}
          onKeyDown={handleRelationEnter}
        />
        <div className="col-xl-2 col-md-3 col-sm-4 col-12">
          <div className="d-flex">
            <Input
              type="text"
              className="form-control"
              id="Relation_Phone"
              name="RelationPhone"
              value={relation.RelationPhone}
              onChange={(e) => {
                const value = e.target.value;
                if (MOBILE_NUMBER_VALIDATION_REGX.test(value)) {
                  setRelation({ ...relation, RelationPhone: value });
                }
              }}
              lable={t("Relation_Phone")}
              placeholder=" "
              respclass="w-100 pr-2"
              disabled={isDisableInputs}
              onKeyDown={handleRelationEnter}
            />

            <div>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleAddRelation}
                disabled={isDisableInputs}
                type="button"
              >
                <i className="fa fa-plus-circle fa-sm new_record_pluse "></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {relations?.length > 0 && (
        <Card className="mb-1 ">
          <div className="col-12">
            <Tables
              tbody={relations.map((rel, index) => ({
                checkBox: (
                  <input
                    className="table-checkbox"
                    key={index}
                    type="checkbox"
                    checked={rel.isPersonal}
                    onChange={() => handlePersonalToggle(index)}
                  />
                ),
                relation: rel.Relation,
                RelationName: rel.RelationName,
                RelationPhone: rel.RelationPhone,
                delete: (
                  <i
                    className="fa fa-trash"
                    onClick={() => handleDeleteRelation(index)}
                    aria-hidden="true"
                    id="redDeleteColor"
                  ></i>
                ),
              }))}
              thead={[
                { width: "2%", name: t("isPersonal") },
                { name: t("Relation Of") },
                { name: t("Relation Name") },
                { name: t("Relation Phone") },
                { width: "5%", name: t("Action") },
              ]}
            />
          </div>
        </Card>
      )}

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
    </>
  );
}
