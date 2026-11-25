import React, { useEffect, useRef, useState } from "react";
import Tables from "../..";
import { AutoComplete } from "primereact/autocomplete";
import {
  GetMedicineDose,
  MedicineItemSearch,
} from "../../../../../networkServices/DoctorApi";
import { DischargeSummaryEMRMedicine } from "../../../../../networkServices/dischargeSummaryAPI";
import Input from "../../../../formComponent/Input";
import { DISCHARGESUMMARY_TYPE, PRESCRIBED_MEDICINE } from "../../../../../utils/constant";
import { DischargeSummaryEMRMedicinePayload, notify } from "../../../../../utils/utils";
import CustomSelect from "../../../../formComponent/CustomSelect";
import { useTranslation } from "react-i18next";
import { translateOptions } from "@components/WrapTranslate";

function DischageMedicineTable({ tags, setTags, transactionID, onSave }) {
  const [t] = useTranslation();
  console.log(tags, "tagsss");

  const KEYS_NAME = "Prescribed Medicine";
  const autoCompleteRefs = useRef([]);
  const doseAutoCompleteRefs = useRef([]);
  const timeAutoCompleteRefs = useRef([]);
  const durationAutoCompleteRefs = useRef([]);
  const mealAutoCompleteRefs = useRef([]);
  const routeAutoCompleteRefs = useRef([]);
  const justSelectedRef = useRef(false);

  const [items, setItems] = useState({
    Name: [],
    Dose: [],
    Time: [],
    Duration: [],
    Meal: [],
    Route: [],
  });
  const [filteredItems, setFilteredItems] = useState({
    Dose: [],
    Time: [],
    Duration: [],
    Meal: [],
    Route: [],
  });
  const initialValues = {
    PrescribedMedicine: tags[KEYS_NAME] || [
      {
        Name: "",
        Dose: "",
        Time: "",
        Duration: "",
        Meal: "",
        Route: "",
        Remarks: "",
      },
    ],
  };

  // const [inputValue, setInputValue] = useState({
  //   Name: "",
  //   Dose: "",
  //   Time: "",
  //   Duration: "",
  //   Meal: "",
  //   Route: "",
  //   Remarks: "",
  // });

  const Thead = [
    t("Sr No."),
    t("Type"),
    t("Medicine Name"),
    t("Dose"),
    t("Frequency"),
    t("Duration"),
    t("Route"),
    t("Meal"),
    t("Remarks"),
    t("Action"),
  ];

  const normalizeSuggestions = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.Data)) return value.Data;
    if (Array.isArray(value?.response)) return value.response;
    return [];
  };

  const getMedicineRows = () => {
    const rows = normalizeSuggestions(tags[KEYS_NAME])
      .map((row) => (Array.isArray(row) ? row[0] : row))
      .filter(Boolean);

    return rows.length ? rows.slice(0, 1) : [{ ...PRESCRIBED_MEDICINE }];
  };

  const setMedicineRows = (rows) => {
    setTags({
      ...tags,
      [KEYS_NAME]: flattenTags(rows.slice(0, 1)),
    });
  };

  const handleFocus = async (refs, index, type) => {
    // PrimeReact re-focuses the input right after an item is picked; skip that focus,
    // otherwise the preload reopens the list over the item just selected.
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (type === "Name") {
      await search({ query: "" }, type);
    } else {
      searchStatic({ query: "" }, type);
    }

    if (refs.current[index]) {
      refs.current[index].show();
    }
  };
  // const handleFocus = async (refs, index, type) => {
  //   debugger
  //   await searchStatic({ query: "" }, type);

  //   if (refs.current[index]) {
  //     refs.current[index].show();
  //   }

  //   if (type === "Name" && index === tags[KEYS_NAME].length - 1) {
  //     const updatedRows = [...tags[KEYS_NAME]];
  //     setTags({
  //       ...tags,
  //       [KEYS_NAME]: updatedRows,
  //     });
  //   }
  // };
  const handleMedicineItemSearch = async (prefix) => {
    try {
      // Empty box (on focus) -> preload the first medicines instead of an empty-prefix search
      const response = await MedicineItemSearch(prefix, prefix ? 0 : 1);
      return normalizeSuggestions(response?.data);
    } catch (error) {
      console.log(error, "error");
      return [];
    }
  };

  const handleAPICalls = async (prefix, name) => {
    const apis = {
      Name: await handleMedicineItemSearch(prefix),
    };

    return apis[name];
  };

  const search = async (event, name) => {
    const item = await handleAPICalls(event?.query?.trim() || "", name);
    setItems({ ...items, [name]: normalizeSuggestions(item) });
  };

  const searchStatic = (event, type) => {
    // debugger;
    const { query } = event;
    const data = normalizeSuggestions(items[type]).filter((ele) =>
      String(ele?.Text || "")
        .toLowerCase()
        .trim()
        .includes(String(query || "").toLowerCase().trim()),
    );
    setFilteredItems({
      ...filteredItems,
      [type]: data,
    });
  };

  const handleGetMedicineDose = async () => {
    const returnData = {
      Dose: [],
      Time: [],
      Duration: [],
      Route: [],
      Meal: [],
    };

    const Type = {
      Dose: 1,
      Time: 2,
      Duration: 3,
      Route: 4,
      Meal: 5,
    };

    const length = Object.keys(returnData);
    for (let i = 0; i < length.length; i++) {
      try {
        const data = await GetMedicineDose(Type[length[i]]);
        returnData[length[i]] = normalizeSuggestions(data?.data);
      } catch (error) {
        console.log(error, "error");
      }
    }
    setItems({ ...items, ...returnData });
  };

  const itemTemplate = (item) => {
    return (
      <div className="p-clearfix">
        <div style={{ float: "left", fontSize: "12px", width: "100%" }}>
          {item?.Typename}
        </div>
      </div>
    );
  };

  const StaticItemTemplate = (item) => {
    return (
      <div className="p-clearfix">
        <div style={{ float: "left", fontSize: "12px", width: "100%" }}>
          {String(item?.Text || "").split("#")[0]}
        </div>
      </div>
    );
  };

  const flattenTags = (arr) =>
    // arr.map((row) => (/* Array.isArray(row) ? row[0]: */ row));
    arr.map((row) => ({ ...(Array.isArray(row) ? row[0] : row) }));

  const handleChange = (e, index) => {
    // debugger
    const { value, name } = e.target;
    const data = JSON.parse(JSON.stringify(getMedicineRows()));
    if (!data[index]) data[index] = { ...PRESCRIBED_MEDICINE };
    data[index][name] = { value: value };
    if (name === "Name") {
      data[index]["Dose"] = { value: "" };
      data[index]["Time"] = { value: "" };
      data[index]["Duration"] = { value: "" };
      data[index]["Meal"] = { value: "" };
      data[index]["Route"] = { value: "" };
      data[index]["AllItemListData"] = { value: "" };
    }
    setMedicineRows(data);
  };
  // const handleChange = (e, index) => {
  //   const { value, name } = e.target;
  //   const data = JSON.parse(JSON.stringify(tags[KEYS_NAME]));

  //   if (name === "Quantity") {
  //     // doctor types manually
  //     data[index][name] = { value, isManual: true };
  //   } else {
  //     data[index][name] = { value };

  //     // recalc only if not manually overridden
  //     if (
  //       (name === "Duration" || name === "Time") &&
  //       !data[index]["Quantity"]?.isManual
  //     ) {
  //       const duration = data[index]["Duration"]?.value;
  //       const times = data[index]["Time"]?.value;
  //       if (duration && times) {
  //         data[index]["Quantity"] = {
  //           value: calculateQuantity(duration, times),
  //         };
  //       }
  //     }
  //   }

  //   setTags({
  //     ...tags,
  //     [KEYS_NAME]: flattenTags(data),
  //   });
  // };

  const HandleRow = (name) => {
    const data = JSON.parse(JSON.stringify(getMedicineRows()));
    if (name === "Name") {
      return data;
    } else {
      return data;
    }
  };

  const handleRemove = (index) => {
    const data = getMedicineRows();
    const returnData = data.filter((_, inx) => index !== inx);
    setMedicineRows(returnData.length ? returnData : [{ ...PRESCRIBED_MEDICINE }]);
  };

  const duplicateChecker = (arrayOfObjects, checker, category) => {
    if (arrayOfObjects.length > 0) {
      const returnData = arrayOfObjects.some(
        (ele) =>
          ele[category]?.value?.toLowerCase().trim() ===
          checker?.toLowerCase().trim(),
      );
      return returnData;
    } else {
      return false;
    }
  };

  // const onSelect = (e, category, index) => {
  //   // debugger
  //   const { value } = e;
  //   console.log(value);
  //   const data = HandleRow(category);
  //   console.log(data);

  //   // if (!duplicateChecker(tags[KEYS_NAME], value?.Brand, category)) {
  //   if (category === "Name") {
  //     data[index][category] = {
  //       value: value?.Brand || "", // Ensure value is a string
  //       ID: value?.ItemID,
  //       isDisable: true,
  //     };
  //     data[index]["Dose"] = { value: value?.Dose || "" };
  //     data[index]["Time"] = { value: value?.Times || "" };
  //     data[index]["Duration"] = { value: value?.Duration || "" };
  //     data[index]["Route"] = { value: value?.Route || "" };
  //     data[index]["Meal"] = { value: value?.Meal || "" };
  //   } else {
  //     data[index][category] = { value: value?.HindiText || "", ID: value?.ID };
  //   }

  //   setTags({
  //     ...tags,
  //     [KEYS_NAME]: data,
  //   });

  //   // Clear the input field and suggestions
  //   // setItems((prevItems) => ({
  //   //   ...prevItems,
  //   //   // [category]: [],
  //   // }));

  //   // } else {
  //   //   notify("Duplicate entry not added", "error");
  //   // }
  // };

  const onSelect = (e, category, index) => {
    justSelectedRef.current = true;
    const { value } = e;
    const selectedValue = value?.Text ? value.Text.split("#")[0] : value;
    const data = JSON.parse(JSON.stringify(getMedicineRows()));
    if (!data[index]) data[index] = { ...PRESCRIBED_MEDICINE };

    if (category === "Name") {
      data[index][category] = {
        value: value?.Brand,
        ID: value?.ItemID,
      };
      data[index]["Dose"] = { value: value?.Dose };
      data[index]["Time"] = { value: value?.Times };
      data[index]["Duration"] = { value: value?.Duration };
      // data[index]["Meal"] = { value: value?.Meal };
      data[index]["Route"] = { value: value?.Route };
      data[index]["AllItemListData"] = { value: value || "" };
    } else {
      data[index][category] = { value: selectedValue, ID: value?.ID };
    }

    // recalc only if not manual
    // const duration = data[index]["Duration"]?.value;
    // const times = data[index]["Time"]?.value;
    // if (duration && times && !data[index]["Quantity"]?.isManual) {
    //   data[index]["Quantity"] = { value: calculateQuantity(duration, times) };
    // }

    setMedicineRows(data);

    setTimeout(() => {
      // hide dropdowns
      if (category === "Name" && autoCompleteRefs.current[index]) {
        autoCompleteRefs.current[index].hide();
      } else if (category === "Dose" && doseAutoCompleteRefs.current[index]) {
        doseAutoCompleteRefs.current[index].hide();
      } else if (category === "Time" && timeAutoCompleteRefs.current[index]) {
        timeAutoCompleteRefs.current[index].hide();
      } else if (
        category === "Duration" &&
        durationAutoCompleteRefs.current[index]
      ) {
        durationAutoCompleteRefs.current[index].hide();
      } else if (category === "Meal" && mealAutoCompleteRefs.current[index]) {
        mealAutoCompleteRefs.current[index].hide();
      } else if (category === "Route" && routeAutoCompleteRefs.current[index]) {
        routeAutoCompleteRefs.current[index].hide();
      }
    }, 0);
  };

  const handleKeyPress = (e, category, index) => {
    const rows = getMedicineRows();
    if (e.key === "Enter" && rows[index][category]?.value) {
      const data = HandleRow(category);
      data[index][category] = { ...data[index][category] };

      setMedicineRows(data);

      // Clear the input field
      setItems((prevItems) => ({
        ...prevItems,
        [category]: [],
      }));
    }
  };

  const handleRemarksChange = (e, index) => {
    const { name, value } = e.target;
    const data = HandleRow(name);
    data[index][name] = { value };

    setMedicineRows(data);
  };

  const getFieldValue = (item, field) => {
    const value = item?.[field];
    if (value && typeof value === "object") return value.value || "";
    return value || "";
  };

  const handleSaveMedicineRow = async (item, index) => {
    const medicineName = getFieldValue(item, "Name");

    if (!medicineName?.trim()) {
      notify(t("Medicine Name is required."), "error");
      return;
    }

    if (!transactionID) {
      notify(t("Transaction ID is missing."), "error");
      return;
    }

    const payload = DischargeSummaryEMRMedicinePayload(
      {
        MedicineName: medicineName,
        Route: getFieldValue(item, "Route"),
        TimeOfNextDose: "",
        Dose: getFieldValue(item, "Dose"),
        Times: getFieldValue(item, "Time"),
        Duration: getFieldValue(item, "Duration"),
        Remark: getFieldValue(item, "Remarks"),
        Meal: getFieldValue(item, "Meal"),
      },
      transactionID,
    );

    try {
      const response = await DischargeSummaryEMRMedicine(payload);
      notify(response?.message, response?.success ? "success" : "error");

      if (response?.success) {
        setMedicineRows([{ ...PRESCRIBED_MEDICINE }]);

        onSave && onSave();
      }
    } catch (error) {
      console.log(error, "error");
      notify(t("Failed to save medicine."), "error");
    }
  };

  const handleCustomSelectChange = (name, e, index) => {
    const data = HandleRow(name);
    data[index][name] = e?.value;

    setMedicineRows(data);
  };
  const settleValue = (item, index) => {
    const returnObject = {
      SNo: null,
      Type: null,
      Name: null,
      Dose: null,
      Time: null,
      Duration: null,
      Meal: null,
      Route: null,
      Remarks: null,
      ItemID: null,
      Action: null,
    };

    // s.no

    returnObject.SNo = (
      <>
        {index + 1}
      </>
    );
    // name
    returnObject.Type = (
      //  item?.isEdit ? (
      <CustomSelect
        option={translateOptions(DISCHARGESUMMARY_TYPE, t)}
        placeHolder={"Select"}
        name="Type"
        value={item?.Type}
        onChange={(name, e) => handleCustomSelectChange(name, e, index)}
      />
    );
    // ) : (
    //   item?.Type
    // );
    returnObject.Name = (
      <AutoComplete
        ref={(el) => (autoCompleteRefs.current[index] = el)}
        suggestions={normalizeSuggestions(items["Name"])}
        completeMethod={(e) => search(e, "Name")}
        // value={item["Name"]?.value || ""}
        value={item["Name"]?.value ?? item.Name ?? ""}
        placeholder={t("Type and Press Enter")}
        className="w-100"
        disabled={false}
        onChange={(e) => handleChange(e, index)}
        name={"Name"}
        onSelect={(e) => onSelect(e, "Name", index)}
        onKeyPress={(e) => handleKeyPress(e, "Name", index)}
        onFocus={() => handleFocus(autoCompleteRefs, index, "Name")}
        id={`searchtest-${index}`}
        itemTemplate={itemTemplate}
      />
    );

    // Dose
    returnObject.Dose = (
      <AutoComplete
        ref={(el) => (doseAutoCompleteRefs.current[index] = el)} // Assign ref for Dose
        suggestions={normalizeSuggestions(filteredItems["Dose"])}
        completeMethod={(e) => searchStatic(e, "Dose")}
        value={item["Dose"]?.value ?? item.Dose ?? ""}
        placeholder={t("Type and Press Enter")}
        onChange={(e) => handleChange(e, index)}
        className="w-100"
        name={"Dose"}
        onSelect={(e) => onSelect(e, "Dose", index)}
        onFocus={() => handleFocus(doseAutoCompleteRefs, index, "Dose")}
        id={`dose-search-${index}`}
        itemTemplate={StaticItemTemplate}
      />
    );

    // Time
    returnObject.Time = (
      <AutoComplete
        ref={(el) => (timeAutoCompleteRefs.current[index] = el)} // Assign ref for Time
        suggestions={normalizeSuggestions(filteredItems["Time"])}
        completeMethod={(e) => searchStatic(e, "Time")}
        value={item["Time"]?.value ?? item.Time ?? ""}
        placeholder={t("Type and Press Enter")}
        onChange={(e) => handleChange(e, index)}
        className="w-100"
        name={"Time"}
        onSelect={(e) => onSelect(e, "Time", index)}
        onFocus={() => handleFocus(timeAutoCompleteRefs, index, "Time")}
        id={`time-search-${index}`}
        itemTemplate={StaticItemTemplate}
      />
    );

    // Duration
    returnObject.Duration = (
      <AutoComplete
        ref={(el) => (durationAutoCompleteRefs.current[index] = el)} // Assign ref for Duration
        suggestions={normalizeSuggestions(filteredItems["Duration"])}
        completeMethod={(e) => searchStatic(e, "Duration")}
        value={item["Duration"]?.value ?? item.Duration ?? ""}
        placeholder={t("Type and Press Enter")}
        onChange={(e) => handleChange(e, index)}
        className="w-100"
        name={"Duration"}
        onSelect={(e) => onSelect(e, "Duration", index)}
        onFocus={() => handleFocus(durationAutoCompleteRefs, index, "Duration")}
        id={`duration-search-${index}`}
        itemTemplate={StaticItemTemplate}
      />
    );

    // Meal
    returnObject.Meal = (
      <AutoComplete
        ref={(el) => (mealAutoCompleteRefs.current[index] = el)} // Assign ref for Meal
        suggestions={normalizeSuggestions(filteredItems["Meal"])}
        completeMethod={(e) => searchStatic(e, "Meal")}
        value={item["Meal"]?.value ?? item.Meal ?? ""}
        placeholder={t("Type and Press Enter")}
        onChange={(e) => handleChange(e, index)}
        className="w-100"
        name={"Meal"}
        onSelect={(e) => onSelect(e, "Meal", index)}
        onFocus={() => handleFocus(mealAutoCompleteRefs, index, "Meal")}
        id={`meal-search-${index}`}
        itemTemplate={StaticItemTemplate}
      />
    );

    // Route
    returnObject.Route = (
      <AutoComplete
        ref={(el) => (routeAutoCompleteRefs.current[index] = el)} // Assign ref for Route
        suggestions={normalizeSuggestions(filteredItems["Route"])}
        completeMethod={(e) => searchStatic(e, "Route")}
        value={item["Route"]?.value ?? item.Route ?? ""}
        placeholder={t("Type and Press Enter")}
        onChange={(e) => handleChange(e, index)}
        className="w-100"
        name={"Route"}
        onSelect={(e) => onSelect(e, "Route", index)}
        onFocus={() => handleFocus(routeAutoCompleteRefs, index, "Route")}
        id={`route-search-${index}`}
        itemTemplate={StaticItemTemplate}
      />
    );

    // Remarks
    returnObject.Remarks = (
      <>
        <Input
          type="text"
          className="table-input"
          placeholder={t("Type")}
          value={item?.Remarks?.value}
          name="Remarks"
          onChange={(e) => handleRemarksChange(e, index)}
        />
      </>
    );

    returnObject.Action = (
      <>
        {item?.Name?.value ? (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => handleSaveMedicineRow(item, index)}
          >
            {t("Save")}
          </button>
        ) : (
          <>&nbsp;</>
        )}
      </>
    );

    return returnObject;
  };

  const handleTabody = () => {
    return getMedicineRows().map((item, index) => {
      const {
        SNo,
        Type,
        Name,
        Dose,
        Time,
        Duration,
        Meal,
        Route,
        Remarks,
        Action,
        itemID,
      } = settleValue(item, index);

      const returnData = {
        SNo,
        Type,
        Name,
        Dose,
        Time,
        Duration,
        Route,
        Meal,
        Remarks,
        Action,
      };

      return returnData;
    });
  };

  useEffect(() => {
    handleGetMedicineDose();
  }, []);
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Prepare the data for submission, filtering out empty entries
    const formData = getMedicineRows().map((item) => {
      // Extract values and filter out any entries where all values are empty
      const values = {
        Type: item.Type?.value || "",
        Name: item.Name?.value || "",
        Dose: item.Dose?.value || "",
        Time: item.Time?.value || "",
        Duration: item.Duration?.value || "",
        Meal: item.Meal?.value || "",
        Route: item.Route?.value || "",
        Remarks: item.Remarks?.value || "",
      };

      // Check if all values are empty
      const isEmpty = Object.values(values).every(
        (value) => value.trim() === "",
      );

      return isEmpty ? null : values; // Return null if all fields are empty
    }).filter((item) => item !== null); // Remove null entries

    console.log(formData);

    // Now you can send formData to your API or handle it as needed
  };

  return (
    <div className="w-100">
      <Tables
        thead={Thead}
        tbody={handleTabody()}
      />
      {/* <button onClick={handleSubmit}>Send</button> */}
    </div>
  );
}

export default DischageMedicineTable;
