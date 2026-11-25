import React from "react";
import moment from "moment";
import DatePicker from "./DatePicker";
import TimePicker from "./TimePicker";
const DATE = "YYYY-MM-DD";
const TIME = "HH:mm";
const DATE_TIME = "YYYY-MM-DDTHH:mm";

const toDate = (value, formats) => {
  if (!value) return null;
  const m = moment(value, formats, true);
  return m.isValid() ? m.toDate() : null;
};

const emit = (onChange, name, date, format) =>
  onChange?.({ target: { name, value: date ? moment(date).format(format) : "" } });

export function FormDate({ name, value, onChange, lable, respclass, className, disable, minDate, maxDate, compact }) {
  return (
    <DatePicker
      name={name}
      id={name}
      lable={compact ? undefined : lable}
      respclass={respclass}
      className={className || "custom-calendar"}
      value={toDate(value, [DATE])}
      handleChange={(e) => emit(onChange, name, e.value, DATE)}
      minDate={minDate}
      maxDate={maxDate}
      disable={disable}
      removeFormGroupClass={compact}
      placeholder="DD/MM/YYYY"
      tabIndex={0}
    />
  );
}

export function FormTime({ name, value, onChange, lable, respclass, className, disable, compact }) {
  return (
    <TimePicker
      name={name}
      id={name}
      lable={compact ? undefined : lable}
      respclass={respclass}
      className={className || "custom-calendar"}
      value={toDate(value, [TIME, "HH:mm:ss", "hh:mm A", "h:mm A"])}
      handleChange={(e) => emit(onChange, name, e.value, TIME)}
      disable={disable}
      placeholderName="hh:mm"
      removeFormControl={compact}
    />
  );
}

export function FormDateTime({ name, value, onChange, lable, respclass, className, disable, compact }) {
  return (
    <DatePicker
      name={name}
      id={name}
      lable={compact ? undefined : lable}
      respclass={respclass}
      className={className || "custom-calendar"}
      value={toDate(value, [DATE_TIME, "YYYY-MM-DD HH:mm"])}
      handleChange={(e) => emit(onChange, name, e.value, DATE_TIME)}
      disable={disable}
      removeFormGroupClass={compact}
      placeholder="DD/MM/YYYY hh:mm"
      showTime
      hourFormat="12"
      tabIndex={0}
    />
  );
}

// Picks the right picker for a grid column type ("date" | "time" | "datetime-local").
export function FormDateTimeByType({ type, ...props }) {
  if (type === "date") return <FormDate {...props} />;
  if (type === "time") return <FormTime {...props} />;
  return <FormDateTime {...props} />;
}
