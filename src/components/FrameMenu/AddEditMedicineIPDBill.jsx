import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import DatePicker from "../formComponent/DatePicker";
import Input from "../formComponent/Input";
import ReactSelect from "../formComponent/ReactSelect";
import Heading from "../UI/Heading";
import Tables from "../UI/customTable";
import { notify } from "../../utils/utils";
import {
  BindMedicineList,
  SaveMedicineDetailVM,
  SearchPrescribedMedicineData,
} from "../../networkServices/pharmecy";
import { PatientBillingReject } from "../../networkServices/BillingsApi";
import { exportToExcel } from "../../utils/exportLibrary";
import { RedirectURL } from "../../networkServices/PDFURL";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";

const getValue = (item, keys, fallback = "") => {
  const key = keys.find(
    (name) => item?.[name] !== undefined && item?.[name] !== null,
  );
  return key ? item[key] : fallback;
};

const getResponseList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.medicineData)) return data.medicineData;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.medicineData)) return data.data.medicineData;
  if (Array.isArray(data?.table)) return data.table;
  if (Array.isArray(data?.Table)) return data.Table;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data?.List)) return data.List;
  return [];
};

const toNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const parseStockDetails = (stock) => {
  const [batchNumber = "", mrp = "", expiryDate = ""] = String(stock || "")
    .split("$")
    .map((value) => value?.trim());

  return {
    batchNumber,
    mrp,
    expiryDate,
  };
};

const toDate = (value) => {
  if (!value) return null;

  const dateValue = moment(
    value,
    [
      moment.ISO_8601,
      "DD-MMM-YYYY",
      "DD/MM/YYYY",
      "MM/DD/YYYY",
      "YYYY-MM-DD",
      "DD-MM-YYYY",
    ],
    true,
  );

  if (dateValue.isValid()) return dateValue.toDate();

  const fallbackDate = moment(value);
  return fallbackDate.isValid() ? fallbackDate.toDate() : null;
};

const formatMedicineDate = (value) => {
  const dateValue = moment(
    value,
    [
      moment.ISO_8601,
      "DD-MMM-YYYY",
      "DD/MMM/YYYY",
      "DD/MM/YYYY",
      "DD/MMM/YY",
      "DD-MMM-YY",
      "YYYY-MM-DD",
      "MM/DD/YYYY",
    ],
    true,
  );

  if (dateValue.isValid()) return dateValue.format("DD/MMM/YYYY");

  const fallbackDate = moment(value);
  return fallbackDate.isValid() ? fallbackDate.format("DD/MMM/YYYY") : "";
};

const normalizeMedicineOption = (item) => {
  const stockDetails = parseStockDetails(getValue(item, ["stock", "Stock"]));
  const value = getValue(item, [
    "ItemID",
    "itemID",
    "MedicineID",
    "medicineID",
    "ID",
    "id",
  ]);
  const label = getValue(item, [
    "ItemName",
    "itemName",
    "MedicineName",
    "medicineName",
    "TypeName",
    "Name",
    "name",
  ]);

  return {
    ...item,
    BatchNumber: getValue(
      item,
      ["BatchNumber", "batchNumber", "BatchNo", "batchNo", "Batch"],
      stockDetails.batchNumber,
    ),
    MRP: getValue(item, ["MRP", "mrp", "Rate", "rate"], stockDetails.mrp),
    ExpiryDate: getValue(
      item,
      ["ExpiryDate", "expiryDate", "Expiry", "expiry"],
      stockDetails.expiryDate,
    ),
    label,
    value,
  };
};

const normalizeMedicineRow = (item, index) => {
  const stockDetails = parseStockDetails(getValue(item, ["stock", "Stock"]));
  const mrp = toNumber(
    getValue(item, ["MRP", "mrp", "Rate", "rate"], stockDetails.mrp),
  );
  const quantity = toNumber(
    getValue(item, ["Quantity", "quantity", "Qty", "qty"], 1),
  );

  return {
    id: getValue(
      item,
      ["StockID", "stockID", "ItemID", "itemID", "MedicineID", "medicineID"],
      index,
    ),
    isChecked: false,
    date: getValue(item, ["Date", "date", "EntryDate", "entryDate"]),
    medicineName: getValue(item, [
      "MedicineName",
      "medicineName",
      "ItemName",
      "itemName",
      "TypeName",
      "Name",
    ]),
    batchNumber: getValue(item, [
      "BatchNumber",
      "batchNumber",
      "BatchNo",
      "batchNo",
      "Batch",
    ], stockDetails.batchNumber),
    expiryDate: getValue(item, [
      "ExpiryDate",
      "expiryDate",
      "Expiry",
      "expiry",
    ], stockDetails.expiryDate),
    mrp,
    quantity,
    netAmount: toNumber(
      getValue(item, ["NetAmount", "netAmount", "Amount", "amount"], mrp * quantity),
    ),
    raw: item,
  };
};

const AddEditMedicineIPDBill = ({ data, handleModalState, setModalState }) => {
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const transactionID = data?.transactionID || data?.TransactionID || "";

  const [values, setValues] = useState({
    fromDate: moment(data?.admitDate).format("YYYY-MM-DD"),
    toDate: moment(data?.dischargeDate).format("YYYY-MM-DD"),
    medicine: null,
    quantity: "",
  });
  const [medicineOptions, setMedicineOptions] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const admitDateLimit = useMemo(() => toDate(data?.admitDate), [data?.admitDate]);
  const dischargeDateLimit = useMemo(
    () => toDate(data?.dischargeDate) || new Date(),
    [data?.dischargeDate],
  );
  const ipdCaseTypeID = getValue(data, ["IPDCaseTypeID", "ipdCaseTypeID", "IpdCaseTypeID"], "");
  const panelID = getValue(data, ["PanelID", "panelID", "PanelId", "panelId"], "");
  const patientID = getValue(data, ["PatientID", "patientID", "PatientId", "patientId"], "");

  const totalAmount = useMemo(
    () => rows.reduce((total, item) => total + toNumber(item?.netAmount), 0),
    [rows],
  );
  const showAddedColumns = rows.some((item) => item?.isAdded);
  const canDeleteRow = (item) =>
    Boolean(item?.isAdded) ||
    Number(getValue(item?.raw, ["afterbill", "AfterBill"], 0)) === 1;
  const showDeleteColumn = rows.some((item) => canDeleteRow(item));

  const tableHead = [
    {
      name: (
        <>
        
        {t("SN")}
        <input
          className="ml-2"
          type="checkbox"
          checked={selectAll}
          onChange={(e) => toggleAll(e.target.checked)}
        />
        </>
      ),
      type: "",
    },
    ...(showAddedColumns ? [t("Date")] : []),
    t("Medicine Name"),
    t("Entry Date"),
    t("BatchNumber"),
    t("Expiry Date"),
    t("MRP"),
    t("Quantity"),
    t("NetAmount"),
    ...(showDeleteColumn ? [t("Delete")] : []),
  ];

  const tableBody = rows.map((item, index) => {
    const rowData = {
      SrNo: (
        <>
          {index + 1}
          <input
            className="ml-2"
            type="checkbox"
            checked={item.isChecked}
            onChange={(e) => toggleRow(index, e.target.checked)}
          />
        </>
      ),
      "Medicine Name": item.medicineName,
      "EntryDate": item.expiryDate,
      BatchNumber: (
        <Input
          className="table-input"
          name="batchNumber"
          removeFormGroupClass={true}
          value={item.batchNumber}
          onChange={(e) => updateRow(index, "batchNumber", e.target.value)}
        />
      ),
      "Expiry Date": item.expiryDate,
      MRP: (
        <Input
          className="table-input"
          name="mrp"
          type="number"
          display="right"
          removeFormGroupClass={true}
          value={item.mrp}
          onChange={(e) => updateRow(index, "mrp", e.target.value)}
        />
      ),
      Quantity: (
        <Input
          className="table-input"
          name="quantity"
          type="number"
          display="right"
          removeFormGroupClass={true}
          value={item.quantity}
          disabled={!item?.isAdded}
          onChange={(e) => updateRow(index, "quantity", e.target.value)}
        />
      ),
      NetAmount: (
        <span className="font-weight-bold">
          {toNumber(item.netAmount).toFixed(2)}
        </span>
      ),
    };

    if (showAddedColumns || showDeleteColumn) {
      return {
        SrNo: rowData.SrNo,
        ...(showAddedColumns ? { Date: item?.isAdded ? item.date : "" } : {}),
        "Medicine Name": rowData["Medicine Name"],
         "Entry Date": item.date, 
        BatchNumber: rowData.BatchNumber,
        "Expiry Date": rowData["Expiry Date"],
        MRP: rowData.MRP,
        Quantity: rowData.Quantity,
        NetAmount: rowData.NetAmount,
        ...(showDeleteColumn
          ? {
              Delete: canDeleteRow(item) ? (
                <i
                  className="fa fa-trash text-danger pointer"
                  onClick={() => handleDeleteMedicine(item, index)}
                ></i>
              ) : (
                ""
              ),
            }
          : {}),
      };
    }

    return rowData;
  });

  const fetchMedicineList = async () => {
    try {
      const response = await BindMedicineList();
      const optionList = getResponseList(response?.data)
        .map(normalizeMedicineOption)
        .filter((item) => item?.label && item?.value !== "");

      setMedicineOptions(optionList);
    } catch (error) {
      console.error(error);
      notify(t("Unable to bind medicine list"), "error");
    }
  };

  const buildSearchPayload = (reportType = "") => ({
    FromDate: values?.fromDate
      ? moment(values.fromDate).format("DD-MMM-YYYY")
      : "",
    ToDate: values?.toDate ? moment(values.toDate).format("DD-MMM-YYYY") : "",
    TransactionID: String(transactionID || ""),
    ReportType: reportType,
  });

  const handleSearch = async (reportType = "") => {
    
    try {
      const response = await SearchPrescribedMedicineData(
        buildSearchPayload(reportType),
      );
      if (reportType) {
        const reportUrl = response?.data?.url || response?.data?.URL || response?.data?.medicineData || response?.data?.pdfUrl
        if(reportType==="0"){
          exportToExcel(reportUrl, "Prescribed_Medicine");

        }
        else if(reportType==="2" || reportType==="4"){
          RedirectURL(response?.data?.pdfUrl);
        }

        // if (typeof reportUrl === "string" && reportUrl) {
        //   window.open(reportUrl, "_blank");
        // }
        return;
      }

      const medicineRows = getResponseList(response?.data).map((item, index) => ({
        ...normalizeMedicineRow(item, index),
        isAdded: false,
      }));
      setRows(medicineRows);
      setSelectAll(false);

      if (!medicineRows?.length) {
        notify(t("No medicine data found"), "warn");
      }
    } catch (error) {
      console.error(error);
      notify(t("Unable to search medicine data"), "error");
    }
  };

  useEffect(() => {
    fetchMedicineList();
  }, []);

  useEffect(() => {
    setValues((prev) => {
      const minDate = admitDateLimit ? moment(admitDateLimit).startOf("day") : null;
      const maxDate = moment(dischargeDateLimit).startOf("day");
      let fromDate = moment(prev.fromDate).startOf("day");
      let toDate = moment(prev.toDate).startOf("day");

      if (!fromDate.isValid()) fromDate = minDate || maxDate;
      if (!toDate.isValid()) toDate = maxDate;

      if (minDate && fromDate.isBefore(minDate)) fromDate = minDate;
      if (fromDate.isAfter(maxDate)) fromDate = maxDate;

      if (minDate && toDate.isBefore(minDate)) toDate = minDate;
      if (toDate.isAfter(maxDate)) toDate = maxDate;
      if (toDate.isBefore(fromDate)) toDate = fromDate;
      return {
        ...prev,
        fromDate: fromDate.toDate(),
        toDate: toDate.toDate(),
      };
    });
  }, [admitDateLimit, dischargeDateLimit]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => {
      const nextValues = { ...prev, [name]: value };

      if (
        name === "fromDate" &&
        moment(nextValues.fromDate).isAfter(nextValues.toDate, "day")
      ) {
        nextValues.toDate = nextValues.fromDate;
      }

      if (
        name === "toDate" &&
        moment(nextValues.toDate).isBefore(nextValues.fromDate, "day")
      ) {
        nextValues.fromDate = nextValues.toDate;
      }

      return nextValues;
    });
  };

  const handleMedicineChange = (name, selectedOption) => {
    setValues((prev) => ({ ...prev, [name]: selectedOption }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  // const addMedicine = () => {
  //   debugger
  //   if (!values?.medicine?.value) {
  //     notify("Please select medicine", "warn");
  //     return;
  //   }


  //   const baseQuantity = toNumber(values?.quantity || 1);
  //   if (baseQuantity <= 0) {
  //     notify("Quantity must be greater than zero", "warn");
  //     return;
  //   }

  //   const quantity = baseQuantity;
  //   const mrp = toNumber(
  //     getValue(values?.medicine, ["MRP", "mrp", "Rate", "rate"]),
  //   );
  //   const newRow = normalizeMedicineRow(
  //     {
  //       ...values.medicine,
  //       Quantity: quantity,
  //       MRP: mrp,
  //       NetAmount: mrp * quantity,
  //       Date: moment(values.fromDate).format("DD-MMM-YYYY"),
  //       isAdded: true,
  //     },
  //     rows.length,
  //   );

  //   setRows((prev) => [...prev, { ...newRow, isAdded: true }]);
  //   setValues((prev) => ({ ...prev, medicine: null, quantity: "" }));
  // };
const addMedicine = () => {
  if (!values?.medicine?.value) {
    notify(t("Please select medicine"), "warn");
    return;
  }

  const baseQuantity = toNumber(values?.quantity || 1);
  if (baseQuantity <= 0) {
    notify(t("Quantity must be greater than zero"), "warn");
    return;
  }

  const mrp = toNumber(
    getValue(values?.medicine, ["MRP", "mrp", "Rate", "rate"]),
  );

  const startDate = moment(values.fromDate).startOf("day");
  const endDate = moment(values.toDate).startOf("day");

  if (!startDate.isValid() || !endDate.isValid() || endDate.isBefore(startDate)) {
    notify(t("Please select a valid date range"), "warn");
    return;
  }

  const newRows = [];
  const cursor = startDate.clone();

  while (cursor.isSameOrBefore(endDate, "day")) {
    newRows.push(
      normalizeMedicineRow(
        {
          ...values.medicine,
          Quantity: baseQuantity,
          MRP: mrp,
          NetAmount: mrp * baseQuantity,
          Date: cursor.format("DD-MMM-YYYY"),
          isAdded: true,
        },
        rows.length + newRows.length,
      ),
    );
    cursor.add(1, "day");
  }

  setRows((prev) => [
    ...prev,
    ...newRows.map((row) => ({ ...row, isAdded: true })),
  ]);
  setValues((prev) => ({ ...prev, medicine: null, quantity: "" }));
};
  const updateRow = (index, name, value) => {
    setRows((prev) =>
      prev.map((item, rowIndex) => {
        if (rowIndex !== index) return item;

        const updatedItem = { ...item, [name]: value };
        if (name === "mrp" || name === "quantity") {
          updatedItem.netAmount =
            toNumber(updatedItem.mrp) * toNumber(updatedItem.quantity);
        }
        return updatedItem;
      }),
    );
  };

  const toggleRow = (index, checked) => {
    const updatedRows = rows.map((item, rowIndex) =>
      rowIndex === index ? { ...item, isChecked: checked } : item,
    );
    setRows(updatedRows);
    setSelectAll(
      updatedRows.length > 0 && updatedRows.every((item) => item.isChecked),
    );
  };

  const toggleAll = (checked) => {
    setSelectAll(checked);
    setRows((prev) => prev.map((item) => ({ ...item, isChecked: checked })));
  };

  const buildSavePayload = () => {
    const medicineRows = rows.filter((item) => item?.isChecked);

    return {
      TransactionID: String(transactionID || ""),
      IPDCaseTypeID: String(ipdCaseTypeID || ""),
      PanelID: String(panelID || ""),
      PatientID: String(patientID || ""),
      PageURL:"AddEditMedicineIPDBill",
      DoctorID :data?.doctorID,
      DoctorName :data?.dName,
      IpAddress  :useLocalStorage("ip", "get"),
      ScheduleChargeID :data?.scheduleChargeID,
    
      MedicineDetail: medicineRows.map((item) => ({
        ID: Number(getValue(item?.raw, ["ID", "id"], 0)),
        ItemID: Number(getValue(item?.raw, ["ItemID", "itemID"], item?.id || 0)),
        ItemName: String(item?.medicineName || ""),
        MRP: toNumber(item?.mrp),
        Qty: toNumber(item?.quantity),
        Amount: toNumber(item?.netAmount),
        DiscAmt: toNumber(getValue(item?.raw, ["DiscAmt", "discAmt"], 0)),
        // EntryDate:"2026-06-12 12:00:00",
        // EntryDate: formatMedicineDate(item?.date || values?.fromDate),
        EntryDate: item?.date
  ? moment(item.date).format("YYYY-MM-DD HH:mm:ss") === moment(item.date).format("YYYY-MM-DD 00:00:00")
    ? moment(item.date).set({
        hour: moment().hour(),
        minute: moment().minute(),
        second: moment().second()
      }).format("YYYY-MM-DD HH:mm:ss")
    : moment(item.date).format("YYYY-MM-DD HH:mm:ss")
  : moment(values?.fromDate || new Date()).format("YYYY-MM-DD HH:mm:ss"),
        // EntryDate: moment(item?.date ).format("YYYY-MM-DD HH:mm:ss")||  moment(values?.fromDate).format("YYYY-MM-DD HH:mm:ss"),
        BatchNo: String(item?.batchNumber || ""),
        ExpiryDate: formatMedicineDate(item?.expiryDate),
        transactionID: String(transactionID || ""),
        CategoryID: String(getValue(item?.raw, ["CategoryID", "categoryID"], "")),
        CategoryName: String(
          getValue(item?.raw, ["CategoryName", "categoryName"], ""),
        ),
        SubCategoryID: String(
          getValue(item?.raw, ["SubcategoryID", "subCategoryID"], ""),
        ),
        SubCategoryName: String(
          getValue(item?.raw, ["subcategoryname", "subCategoryName"], ""),
        ),
        SubCategoryDisplayName: String(
          getValue(
            item?.raw,
            ["subcategorydisplayname", "subCategoryDisplayName"],
            "",
          ),
        ),
        UnitPrice : String(
          getValue(
            item?.raw,
            ["unitPrice", "UnitPrice"],
            "",
          ),
        ),
      })),
    };
  };

  const buildDeletePayload = (item) => ({
    IPAddress: String(localStorage.getItem("ip") || ""),
    transactionID: String(transactionID || ""),
    Remark: "Delete Medicine",
    macAddress: "00-14-22-01-23-45",
    pageUrl: String(window?.location?.pathname || "AddEditMedicineIPDBill"),
    objDRCrList: [
      {
        ledTnxID: Number(getValue(item?.raw, ["ID", "id"], 0)),
        typeofTnx: toNumber(item?.quantity) >= 0 ? "CR" : "DR",
        drCrType: toNumber(item?.quantity) >= 0 ? "CQ" : "DQ",
        quantity: toNumber(item?.quantity) * -1,
        rate: toNumber(item?.mrp),
        amount: toNumber(item?.netAmount) * -1,
        discountPercentage: toNumber(getValue(item?.raw, ["DiscPer", "discPer"], 0)),
        discAmt: toNumber(getValue(item?.raw, ["DiscAmt", "discAmt"], 0)) * -1,
        itemName: String(item?.medicineName || ""),
      },
    ],
  });

  const handleDeleteMedicine = async (item, index) => {
    if (item?.isAdded) {
      setRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
      return;
    }

    if (!canDeleteRow(item)) return;

    const ledTnxID = Number(getValue(item?.raw, ["ID", "id"], 0));
    if (!ledTnxID) {
      notify(t("Invalid medicine item"), "error");
      return;
    }

    try {
      const response = await PatientBillingReject(buildDeletePayload(item));

      if (response?.success === false) {
        notify(response?.message || "Unable to delete medicine", "error");
        return;
      }

      notify(response?.message || "Medicine deleted successfully", "success");
      setRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
    } catch (error) {
      console.error(error);
      notify(t("Unable to delete medicine"), "error");
    }
  };

  const handleSave = async () => {
    const savePayload = buildSavePayload();

    if (!savePayload.MedicineDetail.length) {
      notify(t("Please select medicine"), "warn");
      return;
    }

    try {
      const response = await SaveMedicineDetailVM(savePayload);

      if (response?.success) {
        notify(response?.message || "Medicine saved successfully", "success");
        handleSearch();
        handleModalState?.(false, null, null, null);
        setModalState?.((prev) => ({ ...prev, visible: false }));
      } else {
        notify(response?.message || "Unable to save medicine", "error");
      }
    } catch (error) {
      console.error(error);
      notify(t("Unable to save medicine"), "error");
    }
  };

  const billNo = getValue(data, ["billNo", "BillNo"], "");
  if (!billNo) {
    return (
      <div className="card mt-2">
        <Heading title={t("IPD Medicine Utility")} />
        <div className="p-3 text-center text-danger font-weight-bold">
          {t("Please generate bill first")}
        </div>
      </div>
    );
  }
useEffect(() => {
  if (admitDateLimit && dischargeDateLimit) {
    handleSearch();
  }
}, [data]);
  return (
    <div className="card mt-2">
      <Heading title={t("IPD Medicine Utility")} />
      <div className="row p-2">
<DatePicker
          className="custom-calendar"
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          id="fromDate"
          name="fromDate"
          value={values.fromDate}
          handleChange={handleDateChange}
          lable={t("From Date")}
          placeholder={VITE_DATE_FORMAT}
          minDate={admitDateLimit}
          maxDate={dischargeDateLimit}
        />
        <DatePicker
          className="custom-calendar"
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          id="toDate"
          name="toDate"
          value={values.toDate}
          handleChange={handleDateChange}
          lable={t("To Date")}
          placeholder={VITE_DATE_FORMAT}
          minDate={admitDateLimit}
          maxDate={dischargeDateLimit}
        />
         <button className="btn btn-sm btn-info" type="button" onClick={() => handleSearch()}>
            {t("Search")}
          </button>
        
      {/* </div>
      <div className="row p-2"> */}
           <ReactSelect
          placeholderName={t("New Medicine")}
          id="medicine"
          name="medicine"
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12"
          dynamicOptions={medicineOptions}
          value={values?.medicine?.value}
          handleChange={handleMedicineChange}
        />
        <Input
          type="number"
          className="form-control"
          id="quantity"
          name="quantity"
          value={values.quantity}
          onChange={handleInputChange}
          lable={t("Quantity")}
          respclass="col-xl-2 col-md-3 col-sm-6 col-12"
        />
        <div
        //  className="col-xl-3 col-md-5 col-sm-12 col-12 d-flex mb-2"
         >
         
          <button
          disabled={data?.billNo===""?true:false}
          className="btn btn-sm btn-info" type="button" onClick={addMedicine}>
            {t("Add")}
          </button>
        </div>
      </div>
      

      <div className="px-2">
        {rows.length > 0 ? (
          <>
          <Tables
            thead={tableHead}
            tbody={tableBody}
            tableHeight="tableHeight"
            style={{ maxHeight: "420px" }}
            removeShorting={true}
          />
           <div className="row align-items-center p-2">
        <div className="col-md-8 d-flex flex-wrap">
          <button className="btn btn-sm btn-success mr-2 mb-1" type="button" onClick={handleSave}>
            {t("Save")}
          </button>
          <button className="btn btn-sm btn-info mr-2 mb-1" type="button" onClick={() => handleSearch("0")}>
            {t("Print In Excel")}
          </button>
          {/* <button className="btn btn-sm btn-info mr-2 mb-1" type="button" onClick={() => handleSearch("Word")}>
            {t("Print In Word")}
          </button> */}
          <button className="btn btn-sm btn-info mr-2 mb-1" type="button" onClick={() => handleSearch("2")}>
            {t("Print In PDF")}
          </button>
          <button className="btn btn-sm btn-info mr-2 mb-1" type="button" onClick={() => handleSearch("4")}>
            {t("Print Utility Medicine")}
          </button>
        </div>
        <div className="col-md-4 text-right">
          <b>{t("Total Amount")} : </b>
          <b className="text-danger">{totalAmount.toFixed(2)}</b>
        </div>
      </div>
          </>
        ) : (
          <div className="text-center border py-2">{t("No Record Found")}</div>
        )}
      </div>

     
    </div>
  );
};

export default AddEditMedicineIPDBill;
