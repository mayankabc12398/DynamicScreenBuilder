import moment from "moment";
import { getFormBuilderAPIList } from "../../networkServices/formBuilder";
import { handleReactSelectDropDownOptions } from "../../utils/utils";
const isDate = (val) => val instanceof Date;
export const evaluateVisibility = (currentFields, currentValues) => {
  const isEditMode = currentValues?.id || currentValues?.saveType === "Update";

  const namesToHide = new Set();

  const normalizeFieldName = (name = "") => name?.split("$")[0]?.split("^")[0];

  currentFields.forEach((field) => {
    if (field?.TableHeader && field?.TableHeader !== "") {
      let parseData = JSON.parse(field?.TableHeader);
      if (
        Object?.keys(parseData)?.length > 0 &&
        Object.values(parseData)[0]?.length > 0 &&
        Array.isArray(Object.values(parseData)[0])
      ) {
        // check table only in case of Visibility not for table

        Object?.keys(parseData)?.map((objKey) => {
          parseData[objKey]?.map((val) => {
            const normliseValue = normalizeFieldName(val);
            const keys = objKey?.split("^");
            if (keys?.length > 0 && field?.name === keys[1]) {
              const currentValue =
                currentValues[field?.name]?.value ??
                currentValues[field?.name] ??
                "";
              if (String(currentValue) === String(keys[0])) {
                namesToHide.add(normliseValue);
              }
            }
          });
        });
      }
      // if (
      //   Object.values(parseData)?.length > 0 &&
      //   Object.values(parseData)[0]?.length > 0 && Array.isArray(Object.values(parseData)[0])
      // ) {
      //   Object.values(parseData)[0]?.map((val) => {
      //     const normliseValue = normalizeFieldName(val);
      //     const keys = Object.keys(parseData)[0]?.split("^");
      //     if (keys?.length > 0 && field?.name === keys[1]) {
      //       const currentValue =
      //         currentValues[field?.name]?.value ??
      //         currentValues[field?.name] ??
      //         "";
      //       if (String(currentValue) === String(keys[0])) {
      //         namesToHide.add(normliseValue);
      //       }
      //     }
      //   });
      // }
    }
  });

  return currentFields.map((f) => {
    const isHiddenByRule = namesToHide.has(f.name);
    const isShowByDefault = isEditMode
      ? f.accordionName !== "Save"
      : f.accordionName !== "Update";

    return {
      ...f,
      isShow: isHiddenByRule ? false : isShowByDefault,
    };
  });
};

export const handleDynamicPayload = (splitedfield, values) => {
  let payload = {};

  const getPayloadValue = (value, fallback = "") => {
    if (Array.isArray(value)) {
      return value
        .map((item) => getPayloadValue(item, ""))
        .filter((item) => item !== "")
        .join(",");
    }

    if (value && typeof value === "object") {
      return (
        value.value ??
        value.code ??
        value.CentreID ??
        value.StoreTypeID ??
        value.ID ??
        value.id ??
        fallback
      );
    }

    return value ?? fallback;
  };

  splitedfield?.map((item) => {

    if (item?.split("$")[item?.split("$")?.length - 1] === "0") {
      payload[item?.split("$")[0]] = values[item?.split("$")[0]]
        ? getPayloadValue(values[item?.split("$")[0]])
        : item?.split("$")[1] || "";
    } else {
      if (item?.split("$")[2] === "text") {
        if (
          values[item?.split("$")[0]]?.value !== undefined ||
          values[item?.split("$")[0]?.split("^")[0]] !== undefined
        ) {
          if (item?.split("$")[0]?.split("^")?.length > 1) {
            payload[item?.split("$")[0]?.split("^")[0]] = String(
              values[item?.split("$")[0]?.split("^")[0]]?.value != undefined
                ? values[item?.split("$")[0]?.split("^")[0]]?.value
                : values[item?.split("$")[0]?.split("^")[0]] || "",
            );
            payload[item?.split("$")[0]?.split("^")[1]] = String(
              values[item?.split("$")[0]?.split("^")[0]]?.value != undefined
                ? values[item?.split("$")[0]?.split("^")[0]]?.label
                : values[item?.split("$")[0]?.split("^")[1]] || "",
            );

            // payload[item?.split("$")[0]?.split("^")[0]] = String(values[item?.split("$")[0]?.split("^")[0]]?.value || values[item?.split("$")[0]?.split("^")[0]] || "")
            // payload[item?.split("$")[0]?.split("^")[1]] = String(values[item?.split("$")[0]?.split("^")[1]]?.value || values[item?.split("$")[0]?.split("^")[1]] || "")
          } else {
            // debugger
            if (isDate(values[item?.split("$")[0]])) {
              payload[item?.split("$")[0]] = moment(values[item?.split("$")[0]]).format("DD-MMM-YYYY")

            } else {
              payload[item?.split("$")[0]] = String(
                getPayloadValue(values[item?.split("$")[0]]) ||
                "",
              );
            }
          }
        } else if (values[item?.split("$")[0]]) {
          // debugger
          payload[item?.split("$")[0]] = String(
            getPayloadValue(values[item?.split("$")[0]]) || "",
          );
        } else {
          // debugger
          payload[item?.split("$")[0]] = item?.split("$")[1] || "";
        }
      } else if (item?.split("$")[2] === "number") {
        if (
          values[item?.split("$")[0]]?.value !== undefined ||
          values[item?.split("$")[0]?.split("^")[0]] !== undefined
        ) {
          if (item?.split("$")[0]?.split("^")?.length > 1) {
            payload[item?.split("$")[0]?.split("^")[0]] = Number(
              values[item?.split("$")[0]?.split("^")[0]]?.value != undefined
                ? values[item?.split("$")[0]?.split("^")[0]]?.value
                : values[item?.split("$")[0]?.split("^")[0]] || 0,
            );
            payload[item?.split("$")[0]?.split("^")[1]] = String(
              values[item?.split("$")[0]?.split("^")[0]]?.value != undefined
                ? values[item?.split("$")[0]?.split("^")[0]]?.label
                : values[item?.split("$")[0]?.split("^")[1]] || "",
            );
          } else {
            payload[item?.split("$")[0]] = Number(
              getPayloadValue(values[item?.split("$")[0]], 0) || 0,
            );
          }
        } else if (values[item?.split("$")[0]]) {
          payload[item?.split("$")[0]] = Number(
            getPayloadValue(values[item?.split("$")[0]], 0) ||
            0,
          );
        } else {

          payload[item?.split("$")[0]] = Number(item?.split("$")[1] || 0);
        }
      }
    }
  });
  return payload;
};

const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value?.trim() === "";
  if (Array.isArray(value)) return value?.length === 0;
  if ((typeof value === "object")) return value?.value === "" || value?.value === null || value?.value === undefined;
  return false;
};

export const validateFieldsFormBuilder = (fields, configString, values) => {
  const errors = {};

  let configKeys = [];
  if (
    configString?.split("@")?.length > 1 &&
    configString?.split("@")[0]?.length > 0
  ) {
    configKeys = configString
      ?.split("@")[0]
      ?.split("#")
      ?.filter((val) => val)
      ?.map((item) => {
        return item?.split("$")[0];
      });
    const configKeysList = configString
      ?.split("@")[1]
      ?.split("*")[1]
      ?.split("#")
      ?.map((item) => {
        return item?.split("$")[0];
      });
    configKeys = [...configKeys, ...configKeysList];
  } else {
    configKeys = configString?.split("#").map((item) => {
      return item.split("$")[0];
    });
  }

  // debugger;
  // const configKeys = configString.split("#").map(item => {
  //   return item.split("$")[0];
  // });
  // Step 2: loop through fields
  fields.forEach((field) => {
    const { name, IsMandatory, value } = field;
    // debugger
    // condition check
    if (IsMandatory && configKeys.includes(name)) {
      const fieldValue = values[name];


      // validation logic
      // debugger
      if (field?.type === "datepicker" || field?.type === "timepicker") {
        // if (!fieldValue || !isDate(fieldValue)) {
        // debugger
        if (!fieldValue || (isDate(fieldValue) && isNaN(fieldValue.getTime()))) {
          errors[name] = `${field.lable || name} is required`;
        }
      } else if (
        // !fieldValue || // null/undefined
        // (Array.isArray(fieldValue) && fieldValue?.length === 0) ||
        // (typeof fieldValue === "object" &&
        //   !Array.isArray(fieldValue) &&
        //   !fieldValue.value) ||
        // fieldValue === ""
        isEmpty(fieldValue)
      ) {
        errors[name] = `${field.lable || name} is required`;
      }
    }
  });

  return errors;
};

export const buildQueryParams = (configString) => {
  return configString
    .split("#")
    .map((item) => {
      const parts = item.split("$");

      const key = parts[0];
      const value = parts[1];

      if (!key || !value) return null;

      return `${key}=${value}`;
    })
    .filter(Boolean)
    .join("&");
};

export const getDefaultValue = (type, value) => {
  const isNullLike = (val) =>
    val === null ||
    val === undefined ||
    String(val).trim().toLowerCase() === "null" ||
    String(val).trim().toLowerCase() === "undefined";

  if (type === "input") {
    return value?.split("$")[1];
  } else if (type === "select") {
    return {
      value:
        value?.split("$")[2] === "number"
          ? Number(value?.split("$")[1])
          : value?.split("$")[1],
    };
  } else if (type === "multiselect") {
    const rawValue = value?.split("$")[1];
    if (isNullLike(rawValue) || rawValue === "") {
      return [];
    }

    let code =
      value?.split("$")[2] === "number"
        ? Number(rawValue)
        : rawValue;
    if (!isNullLike(code) && code !== "") {
      return [{ code: code }];
    } else {
      return [];
    }
  } else {
    return "";
  }
};

export const CallAPIOnchange = async (getDetails, value, fields, setFields) => {
  let cacheData = [...fields];
  const findIndex = cacheData?.findIndex(
    (val) => val?.uniqueID === getDetails?.uniqueID,
  );
  // debugger
  if (getDetails?.method?.toLowerCase() === "get") {
    const data = await getFormBuilderAPIList(
      `${getDetails?.url}?${getDetails?.payload}=${value}`,
    );
    if (data?.success) {
      cacheData[findIndex]["dynamicOptions"] = handleReactSelectDropDownOptions(
        data?.data,
        getDetails?.OptionLabelKey,
        getDetails?.OptionValueKey,
      );
      setFields(cacheData);
    } else {
      // debugger;
      cacheData[findIndex]["dynamicOptions"] = [];
      setFields(cacheData);
    }
  } else if (getDetails?.method?.toLowerCase() === "post") {
    const data = await getFormBuilderAPIList(getDetails?.url, "post", {
      [getDetails?.payload]: value,
    });
    if (data?.success) {
      let cacheData = [...fields];
      cacheData[getDetails?.index]["dynamicOptions"] =
        handleReactSelectDropDownOptions(
          data?.data,
          getDetails?.OptionLabelKey,
          getDetails?.OptionValueKey,
        );
      setFields(cacheData);
    } else {
      cacheData[findIndex]["dynamicOptions"] = [];
      setFields(cacheData);
    }
  }
};
