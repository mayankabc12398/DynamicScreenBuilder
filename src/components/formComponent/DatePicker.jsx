// // updated date picker by akhilesh for manual date enter feature
// import React from "react";
// import { Calendar } from "primereact/calendar";
// import moment from "moment";

// function DatePicker({
//   name,
//   className,
//   respclass,
//   id,
//   placeholder,
//   lable,
//   value,
//   handleChange,
//   tabIndex,
//   inputClassName,
//   removeFormGroupClass,
//   maxDate,
//   minDate,
//   disable,
//   viewDate,
//   handleSelect,
//   isRange = false,
//   showIcon = true
// }) {
//   // PrimeReact expects this format for display
//   const primeDateFormat = "dd/M/yy";

//   // Use moment for parsing typed input
//   const handleManualInput = (e) => {
//     const manualInput = e.target.value;

//     // Match the format you expect users to type: "DD/MM/YYYY"
//     const parsed = moment(manualInput, "DD/MM/YYYY", true); // true = strict parsing

//     if (parsed.isValid()) {
//       // Return value as a native Date object (same as calendar pick)
//       handleChange({ target: { name, value: parsed.toDate() } });
//     } else {
//       console.warn("Invalid date format entered:", manualInput);
//       // Optional: add custom invalid-date handling here
//     }
//   };

//   return (
//     <div className={respclass} style={{ position: "relative" }}>
//       <div className={removeFormGroupClass ? "" : "form-group"}>
//         <Calendar
//           inputId={id}
//           showIcon={showIcon}
//           placeholder={placeholder || "DD/MM/YYYY"}
//           className={className}
//           dateFormat={primeDateFormat} // PrimeReact format (not moment)
//           view={viewDate || "date"}
//           value={value && String(value) !== "Invalid Date" ? value : null}
//           name={name}
//           maxDate={maxDate}
//           onInput={isRange ? undefined : handleManualInput}
//           minDate={minDate}
//           disabled={disable}
//           selectionMode={isRange ? "range" : "single"}
//           onChange={handleChange}
//           onSelect={handleSelect}
//           inputClassName={inputClassName}
//           tabIndex={tabIndex || "-1"}
//         />

//         {lable && (
//           <label
//             htmlFor={id}
//             className="labelPicker lable truncate"
//             style={{ fontSize: "5px !important" }}
//           >
//             {lable}
//           </label>
//         )}
//       </div>
//     </div>
//   );
// }

// export default DatePicker;


// new date picker for manage font size

import React, { useContext } from "react";
import { useSelector } from "react-redux";
import { Calendar } from "primereact/calendar";
import moment from "moment";
import { DesignContext } from "@app/providers/DesignProvider";
import { SmoothDate } from "@app/components/modern";
import { useTranslation } from "react-i18next";
import { translateIfKnown } from "@components/WrapTranslate";

function DatePicker({
  name,
  className,
  respclass,
  id,
  placeholder,
  lable,
  value,
  handleChange,
  tabIndex,
  inputClassName,
  removeFormGroupClass,
  maxDate,
  minDate,
  disable,
  viewDate,
  handleSelect,
  isRange = false,
  showIcon = true,

  showTime = false,
  timeOnly = false,
  hourFormat = "12",
  showSeconds = false,
  appendTo,
  baseZIndex,
  icon,
  enableYearPicker = true,
}) {
  const { isModern } = useContext(DesignContext);
  const [t] = useTranslation();
  // PrimeReact expects this format for display
  const primeDateFormat = "dd/M/yy";

  // fin_global_resources IsSelectOtherMonthDates = 1: the greyed days of the previous / next
  // month shown in the calendar grid can be picked too (by default they are not clickable).
  const globalResources = useSelector((state) => state?.CommonSlice?.GetGlobalResources);
  const selectOtherMonths =
    Array.isArray(globalResources) &&
    String(
      globalResources.find((item) => item?.Name === "IsSelectOtherMonthDates")?.Value,
    ) === "1";

  // Use moment for parsing typed input
  const handleManualInput = (e) => {
    const manualInput = e.target.value;

    // Match the format you expect users to type: "DD/MM/YYYY"
    const parsed = moment(manualInput, "DD/MM/YYYY", true); // true = strict parsing

    if (parsed.isValid()) {
      // Return value as a native Date object (same as calendar pick)
      handleChange({ target: { name, value: parsed.toDate() } });
    } else {
      console.warn("Invalid date format entered:", manualInput);
      // Optional: add custom invalid-date handling here
    }
  };

  if (isModern) {
    const toISO = (v) => {
      if (!v) return "";
      if (v instanceof Date && !isNaN(v)) return moment(v).format("YYYY-MM-DD");
      const parsed = moment(v, ["DD-MMM-YYYY", "DD/MM/YYYY", moment.ISO_8601, "YYYY-MM-DD"]);
      return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
    };

    

    const modernOnChange = (e) => {
      const iso = e?.target?.value;
      const dateVal = iso ? moment(iso, "YYYY-MM-DD").toDate() : "";
      if (handleChange) handleChange({ target: { name, value: dateVal } });
      if (handleSelect && dateVal) handleSelect({ value: dateVal });
    };

    return (
      <div
        className={respclass}
        style={
          disable
            ? { position: "relative", pointerEvents: "none", opacity: 0.55 }
            : { position: "relative" }
        }
      >
       <SmoothDate
  icon={icon}
  label={lable}
  id={id}
  name={name}
  placeholder={placeholder || "DD/MM/YYYY"}
  value={toISO(value && String(value) !== "Invalid Date" ? value : null)}
  onChange={modernOnChange}
  minDate={minDate}
  maxDate={maxDate}
  enableYearPicker={enableYearPicker}
  required={[className, inputClassName].some(
    (c) => typeof c === "string" && c.includes("required-fields"),
  )}
  tabSkip={
    disable ||
    [className, inputClassName].some(
      (c) => typeof c === "string" && c.includes("disable-focus"),
    )
  }
/>
      </div>
    );
  }

  return (
    <div className={respclass} style={{ position: "relative" }}>
      <div className={removeFormGroupClass ? "" : "form-group"} >
        <Calendar
          inputId={id}
          showIcon={isModern ? false : showIcon}
          placeholder={placeholder || "DD/MM/YYYY"}
          className={className}
          dateFormat={primeDateFormat} // PrimeReact format (not moment)
          view={viewDate || "date"}
          value={value && String(value) !== "Invalid Date" ? value : null}
          name={name}
          maxDate={maxDate}
          showOtherMonths={true}
          selectOtherMonths={selectOtherMonths}
          onInput={isRange ? undefined : handleManualInput}
          minDate={minDate}
          disabled={disable}
          selectionMode={isRange ? "range" : "single"}
          appendTo={appendTo}
          baseZIndex={baseZIndex}
          onChange={handleChange}
          onSelect={handleSelect}
          showClear={true}
          inputClassName={`${inputClassName} custom-date-input`} // Apply custom class to the input elementinputClassName}
          tabIndex={tabIndex || "-1"}
          // showTime={showTime}
          hourFormat={hourFormat}
          // inputClassName="custom-date-input"
        />

        {lable && (
          <label
            htmlFor={id}
            className="labelPicker lable truncate"
            style={{ fontSize: "5px !important" }}
          >
            {translateIfKnown(t, lable)}
          </label>
        )}
      </div>
    </div>
  );
}

export default DatePicker;

