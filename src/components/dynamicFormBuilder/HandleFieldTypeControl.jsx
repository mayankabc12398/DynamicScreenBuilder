import React, { useState } from "react";
import AlignTableText from "../commonComponents/AlignTableText";
import Input from "../formComponent/Input";
import CustomSelect from "../formComponent/CustomSelect";
import DatePicker from "../formComponent/DatePicker";
import TimePicker from "../formComponent/TimePicker";
import { getFormBuilderAPIList } from "../../networkServices/formBuilder";

export default function HandleFieldTypeControl({
  val,
  item,
  index,
  field,
  fields,
  setFields,
}) {
  const handleChangeTable = (name, value) => {
    const findIndex = fields?.findIndex(
      (dtl) => dtl?.uniqueID === field?.uniqueID,
    );
    let cacheData = [...fields];
    cacheData[findIndex]["gridDatalist"][index][name] = value;
    setFields(cacheData);
  };



//   console.log("adasdasdsaasd", JSON.parse(field?.TableHeader), item?.tableKey);
  switch (item?.tableControlType ? item?.tableControlType : "No Control") {
    case "No Control":
      return (
        <AlignTableText
          value={val[item?.tableKey]}
          isbold={item?.isBold || false}
          side={item?.tableColumnAlignment}
        />
      );
    case "Input":
      return (
        <Input
          type="text"
          className={`table-input ${item?.isMandatoryTableField && "required-fields"}`}
          removeFormGroupClass={true}
          respclass="w-100"
          name={item?.tableKey}
          value={val[item?.tableKey]}
          onChange={(e) => {
            handleChangeTable(e.target.name, e.target.value);
          }}
        />
      );
    case "Select":
      return (
        <>
        {console.log("handleDropDownListData(item?.tableKey,item)",item?.tableDropdownOptions)}
          <CustomSelect
            option={item?.tableDropdownOptions || []}
            // option={handleDropDownListData(item?.tableKey,item)}
            placeHolder={`Select ${item?.tableColumnName}`}
            value={val[item?.tableKey]}
            name={item?.tableKey}
            onChange={(name, value) => {
              handleChangeTable(name, value?.value);
            }}
            requiredClassName={`${item?.isMandatoryTableField && "required-fields"}`}
          />
        </>
      );
    case "Checkbox":
      return (
        <>
          <input
            type="checkbox"
            id={`${item?.tableKey}_${index}`}
            className="table-checkbox"
            checked={val[item?.tableKey]?true:false}
            name={item?.tableKey}
            onChange={(e) => {
              handleChangeTable(item?.tableKey, e.target.checked);
            }}
          />
          {/* <Checkbox
              id={`${item?.tableKey}_${index}`}
              label={item?.tableColumnName}
              className="table-checkbox"
              respClass="w-100"
              name={item?.tableKey}
              checked={""}
              onChange={(name, value) => {}}
            /> */}
        </>
      );
    case "Date Picker":
      return (
        <>
          <DatePicker
            className="custom-calendar-table"
            inputClassName={`${item?.isMandatoryTableField && "required-fields"}`}
            id={`${item?.tableKey}_${index}`}
            respclass="w-100"
            name={item?.tableKey}
            showIcon={false}
            value={val[item?.tableKey]}
            // maxDate={new Date()}
            handleChange={
              (e) => {
                handleChangeTable(e.target.name, e.target.value);
              }
              // handleCustomInput(index, "InvoiceDate", e.target.value)
            }
          />
        </>
      );
    case "Time Picker":
      return (
        <>
          <TimePicker
            className="custom-calendar-table"
            inputClassName={`${item?.isMandatoryTableField && "required-fields"}`}
            id={`${item?.tableKey}_${index}`}
            respclass="w-100"
            name={item?.tableKey}
            showIcon={false}
            value={val[item?.tableKey] || new Date()}
            // maxDate={new Date()}
            handleChange={
              (e) => {
                handleChangeTable(e.target.name, e.target.value);
              }

              // handleCustomInput(index, "InvoiceDate", e.target.value)
            }
          />
        </>
      );
  }
}
