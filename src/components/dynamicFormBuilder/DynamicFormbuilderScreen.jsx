import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getFormBuilderAPIList,
  GetScreenBuilderPageConfiguration,
} from "../../networkServices/formBuilder";
import FullFormRender from "./FullFormRender";
import {
  filterByTypes,
  handleReactSelectDropDownOptions,
  reactSelectOptionList,
} from "../../utils/utils";
import Heading from "../UI/Heading";
import { notify } from "../../utils/ustil2";
import Button from "../formComponent/Button";
import Modal from "../modalComponent/Modal";
import DynamicModal from "./DynamicModal";
import { exportToExcel } from "../../utils/exportLibrary";
import {
  buildQueryParams,
  CallAPIOnchange,
  evaluateVisibility,
  getDefaultValue,
  handleDynamicPayload,
  validateFieldsFormBuilder,
} from "./formbuilderHelper";
import { pseudoUUID } from "../../utils/constant";
import { useTranslation } from "react-i18next";

const DynamicFormbuilderScreen = ({ subMenuID,breadCrumbName  }) => {
  const [t] = useTranslation();
  const location = useLocation();
  const [values, setValues] = useState({});
  const [calledApi, setCalledApi] = useState({});
  const [callApiOnChangeDetals, setCallApiOnChangeDetals] = useState({});
  const [apiData, setApiData] = useState({});
  const [screenData, setScreenData] = useState([]);
  const [modalData, setModalData] = useState({ visible: false });
  const [fields, setFields] = useState([]);

  const handleMultiformData = (filed) => {
    const filterData = fields?.filter(
      (val) =>
        (val?.type === "input" || val?.type === "select") &&
        val?.AddInMultigridControl === "true",
    );

    if (filterData?.length > 0) {
      let addData = { id: Math.random() };
      let addDataPayload = { id: Math.random() };
      let resetPayload = {};
      filterData?.map((val) => {
        addData[`${val?.name}*${val?.lable}`] = val?.value;
        addDataPayload[`${val?.name}`] = val?.value;
        // debugger
        resetPayload[val?.name] = true;
      });
      setValues({ ...values, ...resetPayload });
      let newfieldData = fields.map((val) => {
        if (resetPayload[val?.name]) {
          return {
            ...val,
            value: "",
          };
        } else if (
          val?.type === "grid" &&
          val?.AddInMultigridControl === "true"
        ) {
          //
          return {
            ...val,
            multiGridList:
              val?.multiGridList?.length > 0
                ? [...val?.multiGridList, { ...addData, "Delete*Delete": true }]
                : [{ ...addData, "Delete*Delete": true }],
            gridDatalist:
              val?.gridDatalist?.length > 0
                ? [...val?.gridDatalist, { ...addDataPayload, }]
                : [addDataPayload],
               
              
              };
        }
        return val;
      });
      //
      //
      setFields(newfieldData);
      notify(t("Data Added In The Grid Successfully"));
    }
  };

  const handleClick = async (field, uploadFile) => {
    //

    if (field?.AddInMultigridControl === "true" && field?.type === "button") {
      handleMultiformData(field);
      return;
    }
    let url = field?.apiName?.url;

    const mandatoryFields = fields?.filter(
      (val) => val?.IsMandatory && val?.isShow,
    );

    let errors = validateFieldsFormBuilder(
      mandatoryFields,
      field?.apiName?.payload,
      values,
    );
    if (Object?.keys(errors)?.length > 0) {
      notify(errors[Object?.keys(errors)[0]], "error");
      return;
    }

    if (field?.type === "excelUploader" && uploadFile) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target.result.split(",")[1];
        if (field?.apiName?.url) {
          let payload = {};

          field?.apiName?.payload?.split("#")?.forEach((item) => {
            const [key, defaultValue] = item.split("$");

            if (key === "FileName") {
              payload[key] = uploadFile?.name || "";
              return;
            }

            if (key === "fileBytes") {
              payload[key] = base64String || "";
              return;
            }
            const val = values[key];
            payload[key] =
              val?.value !== undefined ? val.value : val ?? defaultValue ?? "";
          });

          const apiResp = await getFormBuilderAPIList(
            field?.apiName?.url,
            field?.apiName?.method || "post",
            payload,
          );
          if (apiResp?.success) {
            notify(apiResp?.message || "File uploaded successfully", "success");
          } else {
            notify(apiResp?.message || "File upload failed", "error");
          }
        } else {
          notify(t("API not configured for uploader"), "error");
        }
      };
      reader.readAsDataURL(uploadFile);
      return;
    }
    if (field?.type === "excelDownloader") {
      let payload = {};
      field?.apiName?.payload?.split("#")?.forEach((key) => {
        const val = values[key];
        payload[key] = val?.value !== undefined ? val.value : val || "";
      });

      const method = field?.apiName?.method || "GET";
      let url = field?.apiName?.url;
      let requestPayload = payload;
      if (method.toUpperCase() === "GET") {
        const queryString = new URLSearchParams(
          Object.entries(payload).filter(
            ([, value]) =>
              value !== undefined && value !== null && value !== "",
          ),
        ).toString();

        if (queryString) {
          url += url.includes("?") ? `&${queryString}` : `?${queryString}`;
        }

        requestPayload = null;
      }

      const resp = await getFormBuilderAPIList(url, method, requestPayload);

      if (resp?.success) {
        if (resp?.data?.length > 0) {
          exportToExcel(resp?.data, field?.lable);
        } else {
          notify(t("No data found to download"), "warn");
        }
      } else {
        notify(resp?.message || "Failed to fetch download data", "error");
      }

      return;
    }

    let payload = {};
    let gridDatalistPayload = [];
    if (field?.apiName?.payload?.split("@")?.length > 1) {
      if (field?.apiName?.payload?.split("@")[0]?.length > 0) {
        payload = handleDynamicPayload(
          field?.apiName?.payload?.split("@")[0]?.split("#"),
          values,
        );
      }
      // "COAID$0$number$1#IsActive$0$number$1"
      // debugger
      fields?.find((val) => val?.type === "grid")?.gridDatalist?.map((val) => {
        
        // let obj = {};
        // if(!field?.apiName?.payload?.split("@")[1]?.split("*")[0]){
          const obj = handleDynamicPayload(field?.apiName?.payload
          ?.split("@")[1]
          ?.split("*")[1]
          ?.split("#"), val)
          // debugger

          // field?.apiName?.payload
          // ?.split("@")[1]
          // ?.split("*")[1]
          // ?.split("#")
          // ?.map((keyname) => {
          //     // ;
          //     // debugger
          //     // COAID$0$number$1
          //     if (keyname?.split("$")[2] === "number") {
          //       obj[`${keyname?.split("$")[0]}`] = Number(
          //         val[`${keyname?.split("$")[0]}`] || 0,
          //       );
          //     } else {
          //       obj[`${keyname?.split("$")[0]}`] = String(
          //         val[`${keyname?.split("$")[0]}`] || "",
          //       );
          //     }
          //   });

          if (!field?.apiName?.payload?.split("@")[1]?.split("*")[0]) {
            gridDatalistPayload.push({ ...obj, ...payload });
          } else {
            gridDatalistPayload.push({ ...obj });
          }
          // debugger
        });
    } else {
      payload = handleDynamicPayload(
        field?.apiName?.payload?.split("#"),
        values,
      );
      // ;

      payload.id = values?.id ? values?.id : "";
      payload.saveType = values?.saveType ? values?.saveType : "Save";
    }
    if (!field?.apiName?.payload?.split("@")[1]?.split("*")[0]) {
      if (gridDatalistPayload?.length > 0) {
        payload = gridDatalistPayload;
      }
    } else {
      payload[field?.apiName?.payload?.split("@")[1]?.split("*")[0]] =
        gridDatalistPayload;
    }
    // field?.apiName?.url, field?.apiName?.method, payload

    // return

    //
    // This is for get payload param data
    if (
      field?.apiName?.method?.toLowerCase() === "get" &&
      Object.keys(payload)?.length > 0
    ) {
      Object.keys(payload)?.map((val, index) => {
        if (val !== "id" && val !== "saveType") {
          //
          if (index === 0) {
            url = `${url}?${val}=${payload[val] ?? ""}`;
          } else {
            url += `&${val}=${payload[val] ?? ""}`;
          }
        }
      });
    }
    //
    // debugger
    // return
    const data = await getFormBuilderAPIList(
      url,
      field?.apiName?.method,
      payload,
    );
    // 
    if (data?.success) {
      if (field?.type === "excelDownloader") {
        if (data?.data?.length > 0) {
          exportToExcel(data?.data, field?.lable, "", false, field?.lable);
        } else {
          notify(t("No data found to download"), "error");
        }
        return;
      }

      if (field?.accordionName === "Search") {
        const updatedFields = fields?.map((f) => {
          if (f?.type === "grid") {
            return {
              ...f,
              gridDatalist: data?.data || [],
            };
          }
          return f;
        });
        setFields(updatedFields);
      } else {
        notify(data?.message, "success");
        handleRestButton();
        setValues({});
      }
    } else {
      notify(data?.message, "error");
      if (field?.accordionName === "Search") {
        const updatedFields = fields?.map((f) => {
          if (f?.type === "grid") {
            return {
              ...f,
              gridDatalist: [],
            };
          }
          return f;
        });
        setFields(updatedFields);
      }
    }
  };

  const filterGridDataBasedOnExtraParam = (nextValues, currentFields) => {
    //
    const fieldsToProcess = currentFields || fields;
    const filterFields = fieldsToProcess?.filter(
      (f) => f?.AddInMultigridControl === "true",
    );

    return fieldsToProcess?.map((field) => {
      if (field?.type !== "grid") {
        return field;
      }
      const urlKey = field?.apiName?.url?.replace("/", "");
      const originalData = apiData?.[urlKey] || [];

      let filteredData = [...originalData];

      filterFields.forEach((filterField) => {
        const valObj = nextValues[filterField.name];
        const filterValue =
          valObj && typeof valObj === "object" && "value" in valObj
            ? valObj.value
            : valObj;
        const isEmptyValue =
          filterValue === undefined ||
          filterValue === null ||
          filterValue === "" ||
          filterValue === 0 ||
          (typeof filterValue === "object" &&
            Object.keys(filterValue).length === 0); // 👈 THIS IS MISSING

        if (!isEmptyValue) {
          filteredData = filteredData.filter(
            (row) =>
              row[filterField.lable] == filterValue ||
              row[filterField.name] == filterValue,
          );
        }
      });

      return {
        ...field,
        gridDatalist: filteredData,
      };
    });
  };

  const filterGridDataByIsFilterEnable = (nextValues, currentFields) => {
    const fieldsToProcess = currentFields || fields;
    const filterFields = fieldsToProcess?.filter((f) => f?.isFilterEnable == 1);

    return fieldsToProcess?.map((field) => {
      if (field?.type !== "grid") return field;

      const urlKey = field?.apiName?.url?.replace("/", "");
      const originalData =
        apiData?.[urlKey]?.length > 0
          ? apiData?.[urlKey]
          : field?.gridDatalist || [];

      let filteredData = [...originalData];

      filterFields.forEach((filterField) => {
        const valObj = nextValues[filterField.name];

        const filterValue =
          valObj && typeof valObj === "object" && "value" in valObj
            ? valObj.value
            : valObj;

        if (
          filterValue !== undefined &&
          filterValue !== null &&
          filterValue !== "" &&
          filterValue !== 0
        ) {
          const valueExistsInData = filteredData.some(
            (row) =>
              String(row[filterField.setValueKey]) === String(filterValue) ||
              String(row[filterField.name]) === String(filterValue) ||
              String(row[filterField.lable]) === String(filterValue),
          );

          if (valueExistsInData) {
            filteredData = filteredData.filter(
              (row) =>
                String(row[filterField.setValueKey]) === String(filterValue) ||
                String(row[filterField.name]) === String(filterValue) ||
                String(row[filterField.lable]) === String(filterValue),
            );
          }
        }
      });

      return {
        ...field,
        gridDatalist: filteredData,
      };
    });
  };
  const handleImageChange = (e) => {
    const file = e?.target?.files[0];

    if (file) {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(t("File size exceeds 5MB. Please choose a smaller file."));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader?.result.split(",")[1];
        const fileExtension = file?.name.split(".").pop();
        setValues({
          ...values,
          SelectFile: file,
          Document_Base64: base64String,
          FileExtension: fileExtension,
        });
      };
      reader.readAsDataURL(file); // Convert file to base64
    }
  };

  const handleChange = async (name, value, index, type) => {
    let updatedFields = [...fields];
    let nextValues = { ...values, [name]: value };
    const fieldDetails = updatedFields[index];

    if (
      type === "select" &&
      Object.keys(callApiOnChangeDetals)?.length > 0 &&
      callApiOnChangeDetals[`${fieldDetails?.lable}`]
    ) {
      const getDetails = callApiOnChangeDetals[fieldDetails?.lable];
      const findIndex = fields?.findIndex(
        (val) => val?.uniqueID === getDetails?.TableHeader?.CurrentId,
      );
      updatedFields[findIndex].value = {};
      nextValues[getDetails.ControlName] = {};
      if (updatedFields[index]?.isFilterEnable == 1) {
        const isCleared =
          value === null ||
          value === "" ||
          (typeof value === "object" &&
            value !== null &&
            Object.keys(value).length === 0);

        if (isCleared) {
          // Reset grid directly to original apiData when Category is cleared
          updatedFields = updatedFields.map((f) => {
            if (f?.type !== "grid") return f;
            const urlKey = f?.apiName?.url?.replace("/", "");
            const originalData = apiData?.[urlKey] || [];
            return { ...f, gridDatalist: originalData };
          });

          setValues((prev) => ({
            ...prev,
            [name]: value,
            [getDetails.ControlName]: {},
          }));
        } else {
          // Pass null for subCategory so filter starts fresh from full data
          const filterValues = {
            ...nextValues,
            [name]: value,
            [getDetails.ControlName]: null,
          };

          // displayValues keeps real values so selects stay in sync
          const displayValues = {
            ...nextValues,
            [name]: value,
            [getDetails.ControlName]: {},
          };

          setValues(displayValues);
          updatedFields = filterGridDataByIsFilterEnable(
            filterValues,
            updatedFields,
          );
        }
      } else {
        setValues((prev) => ({
          ...prev,
          [name]: value,
          [getDetails.ControlName]: {},
        }));
      }

      await CallAPIOnchange(getDetails, value?.value, fields, setFields);
    } else if (
      type === "select" &&
      updatedFields[index]?.AddInMultigridControl === "true"
    ) {
      //
      setValues(nextValues);
      // updatedFields = filterGridDataBasedOnExtraParam(
      //   nextValues,
      //   updatedFields,
      // );
    } else if (type === "select" && updatedFields[index]?.isFilterEnable == 1) {
      const isCleared =
        value === null ||
        value === "" ||
        (typeof value === "object" &&
          value !== null &&
          Object.keys(value).length === 0);
      const clearedValues = isCleared
        ? { ...nextValues, [name]: null }
        : nextValues;

      setValues(clearedValues);
      updatedFields = filterGridDataByIsFilterEnable(
        clearedValues,
        updatedFields,
      );
    } else {
      if (updatedFields[index]?.IsNumberOnly === 1) {
        if (!/^\d*$/.test(value)) {
          notify(t("Please enter only numbers"), "error");
          return;
        }

        setValues((prev) => ({
          ...prev,
          [name]: value === "" ? "" : Number(value),
        }));
      } else {
        setValues((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    }

    updatedFields[index]["value"] = value;
    const finalFields = evaluateVisibility(updatedFields, nextValues);
    // 
    setFields(finalFields);
  };
  const setDynamicOptions = async (item, datalist, index) => {
    if (item?.url && !calledApi?.apiName && item?.Type !== "button") {
      setCalledApi((prev) => ({
        ...prev,
        [`${item?.url?.replace("/", "")}`]: item?.url,
      }));
      //
      if (
        (item?.Type === "select" || item?.Type === "multiselect") &&
        item?.payload &&
        item?.TableHeader
      ) {
        const parseData = JSON.parse(item?.TableHeader)?.value;
        const getDependentValue = datalist?.find(
          (val) => val?.respClass === parseData,
        );

        //
        const dataSet = {
          DisplayName: getDependentValue?.DisplayName,
          payload: item?.payload,
          url: item?.url,
          method: item?.method,
          index: index,
          uniqueID: item?.respClass,
          OptionValueKey: item?.OptionValueKey,
          OptionLabelKey: item?.OptionLabelKey,
          ControlName: item?.ControlName,
          TableHeader: JSON.parse(item?.TableHeader),
        };
        // callApiOnChangeDetals
        //
        // if(callApiOnChangeDetals[`${getDependentValue?.DisplayName}`]){

        // }else{
        if (item?.ControlName) {
          setApiData((prev) => ({
            ...prev,
            [`${item?.ControlName}`]: true,
          }));
          setCallApiOnChangeDetals((val) => ({
            ...val,
            // [`${getDependentValue?.DisplayName}_${item?.ControlName}`]: dataSet,
            [`${getDependentValue?.DisplayName}`]: dataSet,
          }));
        }
        // }
      } else {
        let data = {};
        if (item?.method?.toLowerCase() === "get") {
          data = await getFormBuilderAPIList(
            `${item?.url}?${buildQueryParams(item?.payload)}`,
          );
        } else if (item?.method?.toLowerCase() === "post") {
          let payload = handleDynamicPayload(item?.payload?.split("#"), {});
          // ;
          // const payload = createPayloadObject(value?.payload);
          // console.log("payloadGetting", payload)
          data = await getFormBuilderAPIList(
            item?.url,
            item?.method,
            JSON.parse(payload),
          );
        }
        if (data?.success) {
          setApiData((prev) => ({
            ...prev,
            [`${item?.url?.replace("/", "")}`]: data?.data,
          }));
        } else {
          setApiData((prev) => ({
            ...prev,
            [`${item?.url?.replace("/", "")}`]: [],
          }));
        }
      }
    }
  };

  const getScreenData = async (id) => {
    // 
    let apiResp = await GetScreenBuilderPageConfiguration(id);
    if (apiResp?.success) {
      setScreenData(apiResp?.data);
      const distinct = Array.from(
        new Map(apiResp?.data?.map((item) => [item?.APIURLID, item])).values(),
      );
      distinct?.map((item, index) => {
        // let a = item?.Type
        // let na = item?.DisplayName
        // 
        //
        // if (item?.Type !== "grid") {
        setDynamicOptions(item, distinct, index);
        // }
      });
    }
  };

  useEffect(() => {
    //
    if (subMenuID) {
      setCallApiOnChangeDetals({})
      getScreenData(subMenuID);
    } else if (location?.state?.subMenuID) {
      setCallApiOnChangeDetals({})
      getScreenData(location?.state?.subMenuID);
    }
  }, [location?.state?.subMenuID, subMenuID]);

  const getDynamicOptions = (
    apiName,
    isTypeID,
    CommonAPITypeID,
    typeIDName = "TypeID",
    valueKey = "ValueField",
    labelKey = "TextField",
  ) => {
    //
    if (isTypeID === 1) {
      let dynamicOptions = filterByTypes(
        apiData?.[`${apiName?.replace("/", "")}`],
        [CommonAPITypeID],
        [typeIDName],
        labelKey,
        valueKey,
      );
      return dynamicOptions;
    } else {
      return reactSelectOptionList(
        apiData?.[`${apiName?.replace("/", "")}`],
        labelKey,
        valueKey,
      );
    }
  };

  const handleTableDropdownControl = async (item) => {
    if (item?.tableControlapiName?.method?.toLowerCase() === "get") {
      let apiResp = await getFormBuilderAPIList(
        `${item?.tableControlapiName?.value}?${item?.tableControlapiName?.DefaultPayload}`,
      );
      if (apiResp?.success) {
        return handleReactSelectDropDownOptions(
          apiResp?.data,
          item?.tableControlsetLabelKey,
          item?.tableControlsetValueKey,
        );
      } else {
        return [];
      }
    } else if (item?.tableControlapiName?.method?.toLowerCase() === "post") {
      let apiResp = await getFormBuilderAPIList(
        item?.tableControlapiName?.value,
        item?.tableControlapiName?.method,
        JSON.parse(item?.tableControlapiName?.DefaultPayload),
      );
      if (apiResp?.success) {
        return handleReactSelectDropDownOptions(
          apiResp?.data,
          item?.tableControlsetLabelKey,
          item?.tableControlsetValueKey,
        );
      } else {
        return [];
      }
    }
    return [];
  };

  const getTableHeader = async (item) => {
    if (item?.Type === "grid") {
      let data = JSON.parse(item?.TableHeader || "[]");
      const updatedData = await Promise.all(
        data.map(async (val) => {
          if (val?.tableControlType === "Select") {
            val.tableDropdownOptions = await handleTableDropdownControl(val);
            return val;
          }
          return val; // IMPORTANT
        }),
      );
      return JSON.stringify(updatedData);
    } else {
      return item?.TableHeader;
    }
  };
  const bindAllControls = async () => {
    let initialValues = { ...values };
    let formFields = await Promise.all(
      screenData?.map(async (item) => {
        //
        const defaultValue = getDefaultValue(
          item?.Type,
          item?.CommonControlName,
        );
        // 
        let newObj = {
          uniqueID: item?.respClass,
          IsNumberOnly: item?.IsNumberOnly,
          id: item?.PageConfigurationID,
          isFilterEnable: item?.ExtraParameter
            ? JSON.parse(item?.ExtraParameter)?.isFilterEnable
            : false,
          AddInMultigridControl: item?.ExtraParameter
            ? String(
              JSON.parse(item?.ExtraParameter)?.AddInMultigridControl ||
              false,
            )
            : "",
          isAllOption: item?.ExtraParameter
            ? JSON.parse(item?.ExtraParameter)?.isAllOption
            : "",
          maxLength: item?.ExtraParameter
            ? Number(JSON.parse(item?.ExtraParameter)?.maxLength)
            : null,
          gridDatalist:
            item?.Type === "grid"
              ? apiData?.[`${item?.url?.replace("/", "")}`]
              : [],
          type: item?.Type,
          lable: item?.DisplayName,
          name: item?.ControlName?.split("^")[0],
          commonControlName: item?.CommonControlName,
          isShow: item?.AccordionName === "Update" ? false : true,
          className: "",
          placeholder: "",
          respclass: item?.className,
          value: defaultValue,
          dynamicOptions:
            item?.Type === "select" || item?.Type === "multiselect"
              ? getDynamicOptions(
                item?.url,
                item?.IsTypeID,
                item?.CommonAPITypeID,
                item?.TypeIDName,
                item?.OptionValueKey,
                item?.OptionLabelKey,
              )
              : [],
          IsMandatory: item?.IsMandatory === 1,
          isDisabled: item?.IsDisabled === 1,
          apiName: {
            ID: item?.APIURLID,
            APIName: item?.url,
            url: item?.url,
            method: item?.method,
            payload: item?.payload,
            IsTypeID: item?.IsTypeID,
            label: item?.url,
            value: item?.url,
          },
          setLabelKey: item?.OptionLabelKey,
          isAddEnable: item?.IsAddEnable === 1,
          IsSearchable: item?.IsSearchable,
          accordionName: item?.AccordionName,
          setValueKey: item?.OptionValueKey,
          TableHeader: await getTableHeader(item),
          IsPdf: item?.IsPdf,
          IsExcel: item?.IsExcel,
          IsSerialNumber: item?.IsSerialNumber,
          getValueKey: {
            ID: item?.APIURLID,
            TypeID: item?.APIURLID,
            TypeName: "",
            label: "",
            value: item?.APIURLID,
          },
        };

        if (defaultValue || newObj?.type === "datepicker" || newObj?.type === "timepicker") {
          initialValues[newObj.name] = newObj?.type === "datepicker" || newObj?.type === "timepicker" ? new Date() : defaultValue;
        }
        // 
        return newObj;
      }),
    );

    const finalFields = evaluateVisibility(formFields, initialValues);
    setValues(initialValues);

    setFields(finalFields);
  };
  // console.log("ssssssssssssss",fields)
  useEffect(() => {
    bindAllControls();
  }, [apiData, screenData?.length]);

  useEffect(() => {
    if (values?.saveType === "Update") {
      if (Object?.keys(callApiOnChangeDetals)?.length > 0) {
        Object?.keys(callApiOnChangeDetals)?.map(async (getDetails) => {
          const fieldDetails = fields?.find(
            (val) =>
              val?.uniqueID ===
              callApiOnChangeDetals[getDetails]?.TableHeader?.value,
          );
          await CallAPIOnchange(
            callApiOnChangeDetals[getDetails],
            fieldDetails?.value?.value,
            fields,
            setFields,
          );
        });
      }
    }
  }, [values?.UniquId]); // this uniq id for only case of update

  const handleAction = async (itemDetails, field, isEdit) => {
    // 
    if (isEdit) {
      const newFields = await Promise.all(
        fields?.map(async (item) => {
          let newItem = { ...item };
          newItem.TableHeader = await getTableHeader(item);
          if (item?.type === "input" || item?.type === "textarea") {
            newItem.value = itemDetails[item?.name];
          } else if (item?.type === "select") {
            const keyname = item?.commonControlName?.split("$")[0];

            if (keyname?.split("^")?.length > 1) {
              newItem.value = {
                label: itemDetails[keyname?.split("^")[1]],
                value: itemDetails[keyname?.split("^")[0]],
              };
            } else {
              // 
              newItem.value = { value: itemDetails[keyname] };
            }
          } else if (item?.type === "multiselect") {
            newItem.value = itemDetails[item?.name]
              ? itemDetails[item?.name]?.split(",")
              : [];
            // newItem.value = itemDetails[item?.name]?.split(",")?.map((val)=>Number(val));
          } else if(item?.type==="datepicker" || item?.type==="timepicker"){
            // debugger
            newItem.value = itemDetails[item?.name] ? new Date(itemDetails[item?.name]) : new Date();
          }

          if (item?.accordionName === "Save") {
            newItem.isShow = false;
          } else {
            newItem.isShow = true;
          }
          return newItem;
        }),
      );
      const editValues = {
        ...values,
        ...itemDetails,
        saveType: "Update",
        UniquId: pseudoUUID(),
      };
      setValues(editValues);
      const finalFields = evaluateVisibility(newFields, editValues);
      setFields(finalFields);
    }
  };

  const handleRestButton = () => {
    const newFields = fields?.map((item) => {
      let newItem = { ...item };
      newItem.value = "";
      if (item?.accordionName === "Update") {
        newItem.isShow = false;
      } else {
        newItem.isShow = true;
      }
      return newItem;
    });
    setFields(newFields);
    setValues({});
    if (subMenuID) {
      getScreenData(subMenuID);
    } else if (location?.state?.subMenuID) {
      getScreenData(location?.state?.subMenuID);
    }
    bindAllControls();
  };

  const parsePayloadDefinition = (payloadString) => {
    if (!payloadString) return [];
    return payloadString.split("#").map((field) => {
      const cleanField = field.split("^")[0];
      const apiKey = cleanField.includes("$$")
        ? cleanField.split("$$")[0]
        : cleanField.split("$")[0];
      return apiKey;
    });
  };

  const buildApiPayload = (payloadKeys, modalValues) => {
    const payload = {};
    payloadKeys.forEach((key) => {
      if (modalValues?.[key] !== undefined) {
        payload[key] = modalValues[key];
      }
    });
    return payload;
  };

  const callApiModal = async (apiData) => {
    try {
      const saveData = apiData?.modalData?.saveData;

      if (!saveData) return;

      // payload definition string
      const payloadKeys = parsePayloadDefinition(saveData.payload);

      // modalData DOES NOT contain accountType
      // You must pass form values instead (example below)
      const payload = buildApiPayload(payloadKeys, apiData?.modalData);

      const apiResp = await getFormBuilderAPIList(
        saveData.api,
        saveData.method || "POST",
        payload,
      );

      if (apiResp?.success) {
        setModalData({ visible: false });
        notify(apiResp?.message || "Success", "success");
      } else {
        notify(apiResp?.message || "Error", "error");
      }
    } catch (error) {
      console.error("Modal API Error", error);
    }
  };

  return (
    <>
      <div className="p-1 py-2 card">
        <Heading
          title={breadCrumbName || "Dynamic Form Builder"}
          isBreadcrumb={breadCrumbName ? false : true}
          secondTitle={
            <>
              {" "}
              <Button
                name={"Reset"}
                type="button"
                className={`btn btn-primary ml-2`}
                handleClick={handleRestButton}
              />
            </>
          }
        />

        <div className="row py-2">
          {fields?.map((field, index) => {
            if (field?.isShow) {
              return (
                <FullFormRender
                  field={field}
                  fields={fields}
                  setFields={setFields}
                  isPreview={true}
                  handleChange={handleChange}
                  index={index}
                  handleClick={handleClick}
                  handleAction={handleAction}
                  isUpdate={values?.id}
                  callApiOnChangeDetals={callApiOnChangeDetals}
                  callApiModal={callApiModal}
                  setModalData={setModalData}
                  modalData={modalData}
                  handleImageChange={handleImageChange}
                />
              );
            }
          })}
        </div>
      </div>
      {modalData?.visible && (
        <Modal
          visible={modalData?.visible}
          setVisible={() => {
            setModalData({ visible: false });
          }}
          modalData={modalData}
          modalWidth={modalData?.width}
          Header={modalData?.label}
          buttonType="button"
          buttonName={modalData?.buttonName}
          footer={modalData?.footer}
          handleAPI={modalData?.CallAPI}
        >
          {modalData?.ComponentType === "DynamicModal" ? (
            <DynamicModal
              field={modalData?.field}
              modalData={modalData}
              setModalData={setModalData}
            />
          ) : (
            modalData?.Component
          )}
        </Modal>
      )}
    </>
  );
};

export default DynamicFormbuilderScreen;
