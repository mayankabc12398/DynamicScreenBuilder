import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Tables from "../..";
import { AutoComplete } from "primereact/autocomplete";
import { Tooltip } from "primereact/tooltip";
import { useTranslation } from "react-i18next";
import {
  GetMedicineDose,
  MedicineItemSearch,
} from "../../../../../networkServices/DoctorApi";
import Input from "../../../../formComponent/Input";
import { PRESCRIBED_MEDICINE } from "../../../../../utils/constant";
import { translateIfKnown } from "../../../../WrapTranslate";
import { notify } from "../../../../../utils/utils";
import { FileOpenIcon } from "../../../../SvgIcons";
// KMSI C18 - reorder lines in a prescription (drag-and-drop / arrows / group by timing).
import MedicineReorderPanel, {
  isFilledMedicineRow,
} from "./MedicineReorderPanel";
import {
  findSimilarGenericRows,
  GENERIC_ALERT_LEVEL,
} from "../../../../../utils/prescriptionGenericAlert";

/** The C18 "Reorder" toggle. Rendered by the grid itself, or by the page in the
 *  Prescribed Medicine header next to "View Interaction" (then the grid is told to hide
 *  its own copy through hideReorderToggle). */
export function RxReorderToggle({ open, onToggle, show = true, className = "" }) {
  const [t] = useTranslation();
  if (!show) return null;
  return (
    <button
      type="button"
      className={`btn btn-sm rx-reorder__toggle${open ? " rx-reorder__toggle--on" : ""} ${className}`}
      aria-pressed={!!open}
      onClick={onToggle}
      title={t("Change the order of the medicines (drag and drop)")}
    >
      <i className="fas fa-arrows-alt-v mr-1" aria-hidden="true"></i>
      {open ? t("Close reorder") : t("Reorder")}
    </button>
  );
}

function PrescribedMedicineTable({
  tags,
  setTags,
  type,
  presTable,
  setPresTable,
  isDesktop,
  isShowFirst,
  apiData,
  // C18: the page can own the reorder state and render the toggle in its header
  reorderOpen: reorderOpenProp,
  setReorderOpen: setReorderOpenProp,
  hideReorderToggle = false,
}) {
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const [editingCell, setEditingCell] = useState({ row: null, field: null });
  const [editingGenericIndex, setEditingGenericIndex] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState("");
  const [medicineData, setMedicineData] = useState([]);
  const KEYS_NAME = "Prescribed Medicine";
  const [t] = useTranslation();
  // Reorder mode (KMSI C18). Only rewrites the order of tags[KEYS_NAME]; the grid and the
  // save keep reading that array exactly as before.
  const [reorderOpenState, setReorderOpenState] = useState(false);
  const reorderOpen = reorderOpenProp ?? reorderOpenState;
  const setReorderOpen = setReorderOpenProp ?? setReorderOpenState;
  const filledRowCount = (tags?.[KEYS_NAME] || []).filter(isFilledMedicineRow).length;
  const applyReorderedRows = (rows) =>
    setTags((prev) => ({ ...prev, [KEYS_NAME]: rows }));
  // Same / similar generic soft alert (see utils/prescriptionGenericAlert.js).
  // Recomputed whenever the medicine rows change, so it reacts as the doctor
  // types, picks, removes, or hand-edits a generic.
  const genericAlerts = useMemo(
    () => findSimilarGenericRows(tags?.[KEYS_NAME]),
    [tags?.[KEYS_NAME]],
  );
  const autoCompleteRefs = useRef([]);
  const doseAutoCompleteRefs = useRef([]);
  const timeAutoCompleteRefs = useRef([]);
  const durationAutoCompleteRefs = useRef([]);
  const mealAutoCompleteRefs = useRef([]);
  const routeAutoCompleteRefs = useRef([]);
  const headerAutoCompleteRefs = useRef({});
  const itemsRef = useRef({ Name: [] });
  const [items, setItems] = useState({
    Name: [],
    Dose: [],
    Time: [],
    Duration: [],
    Meal: [],
    Route: [],
    AllItemListData: [],
  });

  const [headerSelected, setHeaderSelected] = useState({
    Time: null,
    Meal: null,
    Duration: null,
    Route: null,
    Remarks: null,
  });
  console.log("tags[KEYS_NAME]", tags[KEYS_NAME]);
  const transformAndSetData = (medicines) => {
    if (!medicines) {
      return;
    } else {
      const transformedData = medicines.map((med) => ({
        ItemCode: "",
        Typename: med.medicineName,
        ItemID: med.medicine_ID,
        MedicineType: "",
        Dose: { value: med.dose },
        Duration: { value: med.noOfDays },
        Meal: { value: med.meal },
        Route: { value: med.route },
        Times: { value: med.noTimesDay },
        Brand: med.medicineName,
        Generic: med?.generic,
      }));

      setMedicineData(transformedData);
    }
  };

  useEffect(() => {
    transformAndSetData(apiData?.[0]?.medicines);
  }, [apiData]);
  console.log(apiData?.[0]?.medicines, "medicinesmedicines");
  const [filteredItems, setFilteredItems] = useState({
    Name: [],
    Dose: [],
    Time: [],
    Duration: [],
    Meal: [],
    Route: [],
  });
  const [newSearchItems, setNewSearchItems] = useState({
    Name: [],
    Dose: [],
    Time: [],
    Duration: [],
    Meal: [],
    Route: [],
  });

  const shouldShowAllFields =
    import.meta.env.VITE_APP_FIELD_VISIBILITY === "true";

  const allFields = [
    "Dose",
    "Time",
    "Meal",
    "Duration",
    // "Route",
    // "Quantity",
    "Remarks",
  ];
  const hiddenFieldsWhenFalse = ["Route", "Quantity"];

  const visibleFields = shouldShowAllFields
    ? allFields
    : allFields.filter((field) => !hiddenFieldsWhenFalse.includes(field));

  let Thead = [
    { name: "S.No.", width: "3%" },
    { name: "Name", width: "35%" },

    ...visibleFields,
  ];

  const calculateQuantity = (duration, times) => {
    const days = parseInt(duration?.Factor);
    const perDay = parseInt(times?.Factor);
    return days * perDay;
  };
  const flattenTags = (arr) =>
    arr.map((row) => (Array.isArray(row) ? row[0] : row));
  /* A line the pharmacy has already issued (loaded with IsIssued = 1). The save keeps
     such lines whatever the grid sends - PrescribeServiceRepo only deactivates
     IsIssued = 0 lines - so the grid must not offer to remove them: it would look removed
     until the next reload. */
  const isIssuedRow = (row) =>
    Number(row?.AllItemListData?.isIssued ?? row?.AllItemListData?.IsIssued ?? row?.IsIssued ?? 0) === 1;
  const onHeaderSelect = (e, category) => {
    const { value } = e;
    const selectedValue = value?.Text ? value.Text.split("#")[0] : value;
    const newHeaderValue = {
      value: selectedValue,
      ID: value?.ID,
      Factor: value?.Factor,
    };

    setHeaderSelected((prev) => ({
      ...prev,
      [category]: newHeaderValue,
    }));

    setTags((prev) => {
    const blankUpdatedRow = (prev[KEYS_NAME] || []).map((row) => {
      const hasMedicineID =
        (row?.AllItemListData && row.AllItemListData.medicine_ID) ||
        (row?.Name && row.Name.ID);

      if (!hasMedicineID) {
        return row;
      }

      return {
        ...row,
        [category]: newHeaderValue,
        Quantity: row.Quantity?.isManual
          ? row.Quantity
          : category === "Duration" && row.Time
            ? { value: calculateQuantity(newHeaderValue, row.Time) }
            : category === "Time" && row.Duration
              ? { value: calculateQuantity(row.Duration, newHeaderValue) }
              : row.Quantity,
      };
    });
    return { ...prev, [KEYS_NAME]: flattenTags(blankUpdatedRow) };
    });

    const sequence = ["Dose", "Time", "Meal", "Duration", "Route"];
    const nextIndex = sequence.indexOf(category) + 1;
    const nextField = sequence[nextIndex];

    setTimeout(() => {
      if (nextField && headerAutoCompleteRefs.current[nextField]) {
        headerAutoCompleteRefs.current[nextField].focus();
        headerAutoCompleteRefs.current[nextField].show();
      }
    }, 50);
  };

  const handleHeaderRemarksChange = (e) => {
    const { value, name } = e.target;
    const newHeaderValue = { value };

    setHeaderSelected((prev) => ({
      ...prev,
      [name]: newHeaderValue,
    }));

    setTags((prev) => ({
      ...prev,
      [KEYS_NAME]: flattenTags(
        (prev[KEYS_NAME] || []).map((row) => ({ ...row, [name]: newHeaderValue })),
      ),
    }));
  };

  const getRefCollection = (field) => {
    switch (field) {
      case "Dose":
        return doseAutoCompleteRefs;
      case "Time":
        return timeAutoCompleteRefs;
      case "Duration":
        return durationAutoCompleteRefs;
      case "Meal":
        return mealAutoCompleteRefs;
      case "Route":
        return routeAutoCompleteRefs;
      default:
        return null;
    }
  };
  const StaticItemTemplate = (item) => {
    const doseValue = item?.Text.split("#")[0];
    return (
      <div className="p-clearfix">
        <div style={{ float: "left", fontSize: "12px", width: "100%" }}>
          {doseValue}
        </div>
      </div>
    );
  };
  const renderHeaderAutoField = (field) => {
    const refCollection = getRefCollection(field);

    return (
      <>
        <AutoComplete
          ref={(el) => (headerAutoCompleteRefs.current[field] = el)}
          suggestions={filteredItems[field]}
          completeMethod={(e) => searchStatic(e, field)}
          className="w-100"
          name={field}
          onChange={(e) => {
            setHeaderSelected((prev) => ({
              ...prev,
              [field]: { value: e.target.value },
            }));
          }}
          onSelect={(e) => onHeaderSelect(e, field)}
          onFocus={() => {
            handleFocus(refCollection, -1, field);
          }}
          itemTemplate={StaticItemTemplate}
        />
      </>
    );
  };

  const theadCustomStyle = [
    { name: t("S.No."), style: { textAlign: "center" }, width: "3%" },
    { name: t("Name"), style: { textAlign: "left" }, width: "25%" },
    ...visibleFields.map((field) => {
      if (field === "Remarks") {
        return {
          name: (
            <span className="w-100">
              <div>{translateIfKnown(t, field)}</div>
              <input
                type="text"
                className="table-input"
                respclass="w-100"
                name="Remarks"
                value={headerSelected.Remarks?.value || ""}
                onChange={handleHeaderRemarksChange}
              />
            </span>
          ),
          width: "15%",
        };
      }
      // if (field === "Quantity") {
      //   return { name: "Quantity", width: "7%" };
      // }
      return {
        name: (
          <>
            <div>{translateIfKnown(t, field)}</div>
            {renderHeaderAutoField(field)}
          </>
        ),
        width: "10%",
      };
    }),
  ];
  const handleFocus = (refs, index, type) => {
    if (type === "Name") {
      const focusData = items.Name.length ? items.Name : medicineData || [];

      setFilteredItems((prev) => ({
        ...prev,
        Name: focusData.slice(0, 100),
      }));
      refs.current[index]?.show();
    } else {
      searchStatic({ query: "" }, type);
      refs.current[index]?.show();
    }
  };
  const handleMedicineItemSearch = async (prefix) => {
    try {
      const response = await MedicineItemSearch(prefix);
      return response?.data || [];
    } catch {
      return [];
    }
  };

  const debouncedSearch = useCallback(
    debounce(async (query, name) => {
      if (!query) return;
      const item = await handleAPICalls(query.trim(), name);
      if (item?.length) {
        setNewSearchItems((prev) => ({
          ...prev,
          [name]: item.slice(0, 20),
        }));
        setFilteredItems((prev) => ({
          ...prev,
          [name]: item.slice(0, 20),
        }));
      }
    }, 250),
    [],
  );
  const search = (event, name) => {
    const query = event?.query?.trim();
    if (!query) {
      setFilteredItems((prev) => ({
        ...prev,
        [name]: items[name] || medicineData || [],
      }));
      return;
    }

    debouncedSearch(query, name);
  };

  const handleAPICalls = async (prefix, name) => {
    const apis = {
      Name: await handleMedicineItemSearch(prefix),
    };
    return apis[name];
  };

  const searchStatic = (event, type) => {
    const { query } = event;
    const data = items[type].filter((ele) => {
      if (!query) return true;
      return ele?.Text.toLowerCase()
        .trim()
        .includes(query.toLowerCase().trim());
    });

    const uniqueMap = new Map();
    data.forEach((item) => {
      const key = item?.Text?.toLowerCase().trim();
      if (key && !uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });
    const uniqueData = Array.from(uniqueMap.values());
    setFilteredItems({
      ...filteredItems,
      [type]: uniqueData,
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

    const length = Object.keys(returnData).length;
    const keys = Object.keys(returnData);
    for (let i = 0; i < length; i++) {
      try {
        const data = await GetMedicineDose(Type[keys[i]]);
        returnData[keys[i]] = data?.data;
      } catch (error) {
        console.log(error, "error");
      }
    }
    setItems({ ...items, ...returnData });
  };

  const itemTemplate = (item) => {
    // AvlQty = OPD pharmacy stock (API key PrescriptionStockRoleID); absent -> name only, as before
    const hasQty = item?.AvlQty !== undefined && item?.AvlQty !== null && item?.AvlQty !== "";
    const qty = Number(item?.AvlQty) || 0;
    return (
      <div className="p-clearfix" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "12px", flex: "1 1 auto", minWidth: 0 }}>
          {item?.Typename}
        </span>
        {hasQty && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              whiteSpace: "nowrap",
              color: qty > 0 ? "#1b5e20" : "#c62828",
            }}
          >
            {t("Avl Qty")}: {Number.isInteger(qty) ? qty : qty.toFixed(2)}
          </span>
        )}
      </div>
    );
  };

  const safeText = (val) => {
    if (val == null) return "";
    if (typeof val === "object") return val.value || val.Text || "";
    return val;
  };
  const clearDependentFields = (index) => {
    setTags((prev) => {
      const data = JSON.parse(JSON.stringify(prev[KEYS_NAME] || []));
      if (!data[index]) return prev;
      ["Dose", "Time", "Duration", "Meal", "Route", "Quantity"].forEach(
        (field) => {
          data[index][field] = { value: "" };
        },
      );
      return { ...prev, [KEYS_NAME]: flattenTags(data) };
    });
  };
  console.log("tags[KEYS_NAME]", tags[KEYS_NAME]);
  const handleChange = (e, index) => {
    const { value, name } = e.target;
    setTags((prev) => {
    const list = prev[KEYS_NAME] || [];
    const data = JSON.parse(JSON.stringify(list));
    if (!data[index]) return prev;

    if (name === "Quantity") {
      data[index][name] = { value, isManual: true };
    } else {
      if (value?.Factor) {
        data[index][name] = {
          value: value.Text?.split("#")[0],
          Factor: value.Factor,
        };
      } else {
        data[index][name] = { value };
      }

      if (
        (name === "Duration" || name === "Time") &&
        !data[index]["Quantity"]?.isManual
      ) {
        const duration = data[index]["Duration"];
        const times = data[index]["Time"];
        if (duration && times) {
          data[index]["Quantity"] = {
            value: calculateQuantity(duration, times),
          };
        }
      }
    }
    if (index === list.length - 1) {
      data.push({ ...PRESCRIBED_MEDICINE });
    }
    return { ...prev, [KEYS_NAME]: flattenTags(data) };
    });
  };

  const HandleRow = () => {
    return JSON.parse(JSON.stringify(tags[KEYS_NAME]));
  };

  const handleRemove = (index) => {
    setTags((prev) => ({
      ...prev,
      [KEYS_NAME]: (prev[KEYS_NAME] || []).filter((_, inx) => index !== inx),
    }));
  };

  const handleRemove1 = (index) => {
    const data = presTable;
    const returnData = data.filter((_, inx) => index !== inx);
    setPresTable(returnData);
  };
  const getVal = (v) => {
    if (v == null) return "";
    if (typeof v === "object" && "value" in v) return v.value;
    return v;
  };
  // A medicine can be on the prescription only once: the same item (or, for a
  // typed-in medicine, the same name) on another row blocks the selection.
  const isMedicineAlreadyAdded = (rows, index, itemID, name) => {
    const id = String(itemID ?? "").trim();
    const text = String(name ?? "").trim().toLowerCase();
    return (rows || []).some((row, i) => {
      if (i === index) return false;
      const rowID = String(row?.Name?.ID ?? "").trim();
      const rowName = String(row?.Name?.value ?? "").trim().toLowerCase();
      if (id && id !== "0" && rowID === id) return true;
      return !!text && !!row?.Name?.isDisable && rowName === text;
    });
  };

  const onSelect = (e, category, index) => {
    // debugger;
    const value = e?.value;
    setTags((prev) => {
    const list = prev[KEYS_NAME] || [];
    const data = JSON.parse(JSON.stringify(list));
    if (!data[index]) return prev;

    if (
      category === "Name" &&
      isMedicineAlreadyAdded(data, index, value?.ItemID, getVal(value?.Brand))
    ) {
      notify(`${getVal(value?.Brand) || "This medicine"} is already added`, "warn");
      data[index]["Name"] = { ...PRESCRIBED_MEDICINE?.Name, value: "" };
      setTags({ ...tags, [KEYS_NAME]: data });
      setEditingCell({ row: null, field: null });
      return;
    }

    if (category === "Name") {
      data[index]["Name"] = {
        value: getVal(value?.Brand),
        ID: value?.ItemID,
        isDisable: true,
        Typename: value?.Typename,
        Generic: value?.Generic,
      };

      data[index]["Dose"] = { value: getVal(value?.Dose) };
      data[index]["Time"] = { value: getVal(value?.Times) };
      data[index]["Duration"] = { value: getVal(value?.Duration) };
      data[index]["Route"] = { value: getVal(value?.Route) };
      data[index]["Meal"] = { value: getVal(value?.Meal) };

      data[index]["AllItemListData"] = value;

      if (index === list.length - 1) {
        data.push({ ...PRESCRIBED_MEDICINE });
      }
    } else {
      data[index][category] = {
        value: getVal(value?.HindiText),
        ID: value?.ID,
        Factor: value?.Factor,
      };
    }

    return { ...prev, [KEYS_NAME]: flattenTags(data) };
    });

    setEditingCell({ row: null, field: null });
  };

  const handleRemarksChange = (e, index) => {
    const { name, value } = e.target;
    setTags((prev) => {
      const data = JSON.parse(JSON.stringify(prev[KEYS_NAME] || []));
      if (!data[index]) return prev;
      data[index][name] = { value };
      return { ...prev, [KEYS_NAME]: data };
    });
  };
  const handleKeyPress = (e, category, index) => {
    if (e.key !== "Enter") return;
    const currentRows = tags[KEYS_NAME] || [];
    const currentValue = currentRows[index]?.[category]?.value;
    if (!currentValue) return;
    if (
      category === "Name" &&
      isMedicineAlreadyAdded(
        currentRows,
        index,
        currentRows[index]?.Name?.ID,
        currentValue,
      )
    ) {
      notify(`${currentValue} is already added`, "warn");
      return;
    }
    setTags((prev) => {
      const data = JSON.parse(JSON.stringify(prev[KEYS_NAME] || []));
      if (!data[index]?.[category]?.value) return prev;
      data[index][category] = {
        ...data[index][category],
        isDisable: true,
      };
      if (index === data.length - 1) {
        data.push({ ...PRESCRIBED_MEDICINE });
      }
      return { ...prev, [KEYS_NAME]: flattenTags(data) };
    });

    setEditingCell({ row: null, field: null });
  };

  // const handleKeyPress = (e, category, index) => {
  //   if (e.key === "Enter" && tags[KEYS_NAME][index][category]?.value) {
  //     const data = HandleRow(category);
  //     data[index][category] = { ...data[index][category], isDisable: true };

  //     setTags({
  //       ...tags,
  //       [KEYS_NAME]: data,
  //     });
  //   }
  // };
  const handleGenericChange = (value, index) => {
    // no in-place mutation of the row object shared with the previous state
    setTags((prev) => ({
      ...prev,
      [KEYS_NAME]: (prev[KEYS_NAME] || []).map((row, i) =>
        i === index ? { ...row, Name: { ...(row?.Name || {}), Generic: value } } : row,
      ),
    }));
  };
  // Soft, non-blocking flag beside the medicine name when another row on this
  // prescription carries the same or an overlapping generic. Hover lists those
  // rows and the shared salt(s). Clicking it must not open the name editor.
  const renderGenericAlert = (index) => {
    const alert = genericAlerts[index];
    if (!alert) return null;

    const isSame = alert.level === GENERIC_ALERT_LEVEL.SAME;
    const tooltipId = `rx-generic-alert-${index}`;
    const label = t(isSame ? "Same Generic" : "Similar Generic");
    const detail = alert.matches
      .map(
        (match) =>
          `#${match.index + 1} ${match.name || ""} (${match.shared.join(", ")})`,
      )
      .join("\n");

    return (
      <>
        <Tooltip
          target={`#${tooltipId}`}
          position="top"
          className="rx-generic-alert__tooltip"
          content={`${label}\n${detail}`}
        />
        <span
          id={tooltipId}
          className={`rx-generic-alert ${
            isSame ? "rx-generic-alert--same" : "rx-generic-alert--similar"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <i className="pi pi-exclamation-triangle" aria-hidden="true"></i>
          {label}
        </span>
      </>
    );
  };

  // console.log("filteredItems", tags["Time"])
  const settleValue = (item, index) => {
    // debugger;
    const fields = ["Dose", "Time", "Duration", "Meal", "Route"];
    const itemName = safeText(item?.Name?.value || item?.Name);
    // debugger

    const renderAutoField = (field, refCollection, fieldItems, template) => {
      const isNameSelected = !!item?.Name?.ID;
      const isEditing =
        field === "Duration"
          ? selectedDuration
          : editingCell.row === index && editingCell.field === field;
      const fieldValue = safeText(item?.[field]);
      // const id = item?.Name?.ID;
      const id =
        fieldItems?.find((ele) => {
          const val = ele?.HindiText;
          return val === fieldValue;
        })?.ID ?? item?.Name?.ID;
      if (isEditing || !fieldValue || !id) {
        // debugger;
        return (
          <>
            <AutoComplete
              ref={(el) => (refCollection.current[index] = el)}
              suggestions={fieldItems}
              completeMethod={(e) => searchStatic(e, field)}
              value={fieldValue}
              placeholder={t("Type and press Enter")}
              className="w-100"
              name={field}
              onChange={(e) => handleChange(e, index)}
              onSelect={(e) => onSelect(e, field, index)}
              onFocus={() => {
                if (field === "Duration") setSelectedDuration(true);
                // Keep the box mounted while it has focus. An EMPTY dose / time / meal cell
                // renders this box without edit mode; the first keystroke gave the cell a
                // value, the cell flipped to plain text, the box unmounted and the rest of
                // the typing was lost. Clicking a filled cell already sets edit mode; focus
                // now does the same, and blur clears it exactly as before.
                else setEditingCell({ row: index, field });
                handleFocus(refCollection, index, field);
              }}
              onBlur={() => {
                setTimeout(() => {
                  if (field === "Duration") setSelectedDuration(false);
                  else setEditingCell({ row: null, field: null });
                }, 150);
              }}
              itemTemplate={template}
            />
          </>
        );
      }

      return (
        <span
          onClick={(e) => {
            e.stopPropagation();
            if (field === "Duration") {
              setSelectedDuration(true);
              setEditingCell({ row: index, field });
              setTimeout(() => {
                if (durationAutoCompleteRefs.current[index]) {
                  durationAutoCompleteRefs.current[index].show();
                }
              }, 50);
            } else {
              setEditingCell({ row: index, field });
              const refMap = {
                Dose: doseAutoCompleteRefs,
                Time: timeAutoCompleteRefs,
                Meal: mealAutoCompleteRefs,
                Route: routeAutoCompleteRefs,
              };

              const refCollection = refMap[field];
              setTimeout(() => {
                if (refCollection && refCollection.current[index]) {
                  refCollection.current[index].show();
                }
              }, 50);
            }
          }}
          style={{
            cursor: "pointer",
            display: "inline-block",
            width: "100%",
            minHeight: "24px",
            whiteSpace: "normal",
          }}
        >
          {fieldValue}
        </span>
      );
    };

    const renderNameField = () => {
      const isEditing =
        editingCell.row === index && editingCell.field === "Name";
      const fieldValue = safeText(item?.Name?.value || item?.Name);

      if (isEditing || !item?.Name?.ID) {
        // debugger
        return (
          <>
            <AutoComplete
              ref={(el) => (autoCompleteRefs.current[index] = el)}
              suggestions={
                Array.isArray(filteredItems["Name"])
                  ? filteredItems["Name"]
                  : []
              }
              completeMethod={(e) => search(e, "Name")}
              value={fieldValue}
              placeholder={t("Type and Press Enter")}
              className="w-100"
              name="Name"
              onChange={(e) => handleChange(e, index)}
              onSelect={(e) => onSelect(e, "Name", index)}
              onKeyPress={(e) => handleKeyPress(e, "Name", index)}
              onFocus={() => handleFocus(autoCompleteRefs, index, "Name")}
              onBlur={() => {
                setTimeout(
                  () => setEditingCell({ row: null, field: null }),
                  150,
                );
              }}
              itemTemplate={itemTemplate}
              id={`searchtest-${index}`}
            />
            {item?.Name?.value && (
              <div>
                {isIssuedRow(item) && (
                  <span
                    className="rx-issued-line__tag"
                    title={t("Issued by the pharmacy - this line cannot be removed")}
                  >
                    {t("Issued")}
                  </span>
                )}
                {renderGenericAlert(index)}
                {editingGenericIndex === index ? (
                  <input
                    type="text"
                    value={item?.Name?.Generic || ""}
                    onChange={(e) => handleGenericChange(e.target.value, index)}
                    onBlur={() => setEditingGenericIndex(null)}
                    autoFocus
                    className="table-input"
                    respclass="w-100"
                    style={{
                      fontSize: "12px",
                      width: "100%",
                      border: "1px solid #ccc",
                      background: "#fff",
                      padding: "2px 4px",
                      color: "#526a97f6 ",
                      textTransform: "uppercase",
                    }}
                  />
                ) : (
                  <span onClick={() => setEditingGenericIndex(index)}>
                    {(
                      <span
                        style={{
                          display: "flex",
                        }}
                      >
                        <i
                          className="pi pi-pen-to-square mr-2"
                          aria-hidden="true"
                          style={{
                            // fontSize: "5px",
                            fontWeight: "bold",
                            color: "#526a97f6 ",
                          }}
                        ></i>
                        <span
                          style={{
                            fontSize: "88px !important",
                            fontWeight: "bold",
                            display: "inline-block",
                            maxWidth: "100%",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                            color: "#526a97f6 ",
                            textTransform: "uppercase",
                          }}
                        >
                          {item?.Name?.Generic ??
                            item?.Name?.composition ??
                            item?.AllItemListData?.Generic ?? item?.AllItemListData?.composition}
                        </span>
                      </span>
                    ) || (
                      <>
                        <i
                          className="pi pi-pen-to-square"
                          aria-hidden="true"
                          style={{
                            fontSize: "5px",
                            fontWeight: "bold",
                            color: "#526a97f6 ",
                          }}
                        ></i>
                      </>
                    )}
                  </span>
                )}
              </div>
            )}
          </>
        );
      }
      return (
        <div>
          <span
            onClick={() => {
              setEditingCell({ row: index, field: "Name" });
              setTimeout(() => {
                if (autoCompleteRefs.current[index]) {
                  autoCompleteRefs.current[index].focus();
                  autoCompleteRefs.current[index].show();
                }
              }, 50);
            }}
            style={{
              cursor: "pointer",
              display: "inline-block",
              width: "100%",
              minHeight: "24px",
              whiteSpace: "normal",
            }}
          >
            <span isDisable style={{ color: "#000000", fontWeight: "600" }}>
              {item?.Name?.value}
            </span>
            {isIssuedRow(item) && (
              <span
                className="rx-issued-line__tag"
                title={t("Issued by the pharmacy - this line cannot be removed")}
              >
                {t("Issued")}
              </span>
            )}
            {renderGenericAlert(index)}
            <br />
          </span>
          <div>
            {editingGenericIndex === index && item?.Name?.value ? (
              <input
                type="text"
                value={item?.Name?.Generic || ""}
                onChange={(e) => handleGenericChange(e.target.value, index)}
                onBlur={() => setEditingGenericIndex(null)}
                autoFocus
                className="table-input"
                respclass="w-100"
                style={{
                  fontSize: "9px !important",
                  width: "100%",
                  border: "1px solid #ccc",
                  background: "#fff",
                  padding: "2px 4px",
                  color: "#526a97f6 ",
                  textTransform: "uppercase",
                }}
              />
            ) : (
              <span onClick={() => setEditingGenericIndex(index)}>
                {(
                  <span
                    style={{
                      display: "flex",
                    }}
                  >
                    <i
                      className="pi pi-pen-to-square mr-2"
                      aria-hidden="true"
                      style={{
                        fontSize: "9px",
                        fontWeight: "bold",
                        color: "#526a97f6 ",
                      }}
                    ></i>
                    <span
                      className="fontColors"
                      style={{
                        fontSize: "14px !important",
                        color: "#526a97f6 ",
                        fontWeight: "bold",
                        display: "inline-block",
                        maxWidth: "100%",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        textTransform: "uppercase",
                      }}
                    >
                      {item?.Name?.Generic ??
                        item?.Name?.composition ??
                        item?.AllItemListData?.Generic ?? item?.AllItemListData?.composition}
                    </span>
                  </span>
                ) || (
                  <>
                    <i
                      className="pi pi-pen-to-square"
                      aria-hidden="true"
                      style={{
                        fontSize: "9px",
                        fontWeight: "bold",
                        color: "#526a97f6 ",
                      }}
                    ></i>
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      );
    };

    const returnObject = {
      SNo: (
        <>
          {tags[KEYS_NAME].length !== index + 1 &&
            (isIssuedRow(item) ? (
              <div
                className="rx-issued-lock"
                aria-disabled="true"
                title={t("Issued by the pharmacy - this line cannot be removed")}
              >
                <i className="pi pi-trash" aria-hidden="true"></i>
              </div>
            ) : (
              <div
                style={{
                  borderRadius: "25px",
                  padding: "1px 10px",
                  cursor: "pointer",
                }}
                onClick={() => handleRemove(index)}
              >
                <i className="pi pi-trash" aria-hidden="true"></i>
              </div>
            ))}
        </>
      ),
      Name: genericAlerts[index] ? (
        <div
          className={`rx-generic-flag-cell ${
            genericAlerts[index].level === GENERIC_ALERT_LEVEL.SAME
              ? "rx-generic-flag-cell--same"
              : "rx-generic-flag-cell--similar"
          }`}
        >
          {renderNameField()}
        </div>
      ) : (
        renderNameField()
      ),
    };
    
    returnObject.Dose = renderAutoField(
      "Dose",
      doseAutoCompleteRefs,
      Array.isArray(filteredItems["Dose"]) ? filteredItems["Dose"] : [],
      StaticItemTemplate,
    );
    returnObject.Time = renderAutoField(
      "Time",
      timeAutoCompleteRefs,
      Array.isArray(filteredItems["Time"]) ? filteredItems["Time"] : [],
      // filteredItems["Time"],
      StaticItemTemplate,
    );
    returnObject.Duration = renderAutoField(
      "Duration",
      durationAutoCompleteRefs,
      Array.isArray(filteredItems["Duration"]) ? filteredItems["Duration"] : [],
      // filteredItems["Duration"],
      StaticItemTemplate,
    );
    returnObject.Meal = renderAutoField(
      "Meal",
      mealAutoCompleteRefs,
      Array.isArray(filteredItems["Meal"]) ? filteredItems["Meal"] : [],
      // filteredItems["Meal"],
      StaticItemTemplate,
    );
    // returnObject.Route = renderAutoField(
    //   "Route",
    //   routeAutoCompleteRefs,
    //   filteredItems["Route"],
    //   StaticItemTemplate
    // );

    returnObject.Remarks = (
      <Input
        type="text"
        className="table-input"
        placeholder={t("Type")}
        value={safeText(item?.Remarks)}
        respclass="w-100"
        name="Remarks"
        onChange={(e) => handleRemarksChange(e, index)}
      />
    );

    returnObject.Quantity = (
      <Input
        type="number"
        className="table-input"
        placeholder={t("Type")}
        value={safeText(item?.Quantity)}
        respclass="w-100"
        name="Quantity"
        onChange={(e) => handleChange(e, index)}
        min={0}
      />
    );

    return returnObject;
  };

  const handleTabody = () => {
    return tags[KEYS_NAME]?.map((item, index) => {
      const values = settleValue(item, index);
      let row = {
        SNo: values.SNo,
        Name: values.Name,
      };
      visibleFields.forEach((field) => {
        if (values[field]) {
          row[field] = values[field];
        }
      });

      if (type === "FromPage" && !isDesktop) {
        row.Remarks = values.Remarks;
      }

      return row;
    });
  };

  useEffect(() => {
    handleGetMedicineDose();
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      const timeData = await GetMedicineDose(2);
      const durationData = await GetMedicineDose(3);
      const mealData = await GetMedicineDose(5);
      const routeData = await GetMedicineDose(4);
      const doseData = await GetMedicineDose(1);

      setItems((prevItems) => ({
        ...prevItems,
        Dose: doseData?.data || [],
        Time: timeData?.data || [],
        Duration: durationData?.data || [],
        Meal: mealData?.data || [],
        Route: routeData?.data || [],
      }));
    };

    fetchInitialData();
  }, []);

  return (
    <div className="w-100">
      {isShowFirst && !hideReorderToggle && filledRowCount >= 2 && (
        <div className="rx-reorder__toggle-row">
          <RxReorderToggle open={reorderOpen} onToggle={() => setReorderOpen(!reorderOpen)} />
        </div>
      )}
      {reorderOpen && (
        <MedicineReorderPanel
          rows={tags?.[KEYS_NAME] || []}
          onChange={applyReorderedRows}
          onClose={() => setReorderOpen(false)}
        />
      )}
      <Tables
        thead={theadCustomStyle}
        tbody={handleTabody()}
        tableHeight={"rx-rxgrid-scroll"}
        style={{ height: "auto" }}
      />
    </div>
  );
}

export default PrescribedMedicineTable;
