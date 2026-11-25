import React, { useMemo, useState } from "react";
import DatePicker from "../../formComponent/DatePicker";
import Button from "../../formComponent/Button";
import {
  BindInvestigation,
  GetUrgentPrescribedTests,
} from "../../../networkServices/opdserviceAPI";
import Tables from "../../UI/customTable";
import moment from "moment/moment";
import ColorCodingSearch from "../../commonComponents/ColorCodingSearch"
import { useTranslation } from "react-i18next";
import { notify } from "../../../utils/utils";

function CPOEModal({ singlePatientData, handlegetCheckedData }) {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation()
  const [payload, setPayload] = useState({
    fromDate: new Date(),
    toDate: new Date(),
    tableData: [],
  });

  const handleBindInvestigation = async (payload) => {
    try {
      debugger
      const data = await BindInvestigation(payload);
   if(data?.success){
    return data
   }else{
     notify(data?.message, "error")
    return []
   
   }
    } catch (error) {
      console.log(error, "error");
    }
  };

  /* The urgent marks the doctor made, joined onto the rows by PatientTest_ID.
     A failure here only costs the badge - the tests themselves still list, so the
     counter is never blocked from billing by it. */
  const withUrgentFlags = async (rows) => {
    if (!rows?.length) return rows || [];
    try {
      const res = await GetUrgentPrescribedTests(
        singlePatientData?.PatientID,
        moment(payload?.fromDate).format("DD-MM-YYYY"),
        moment(payload?.toDate).format("DD-MM-YYYY"),
      );
      if (!res?.success || !Array.isArray(res?.data)) return rows;
      const urgent = new Set(
        res.data
          .map((u) => String(u?.PatientTest_ID ?? u?.patientTest_ID ?? ""))
          .filter(Boolean),
      );
      if (!urgent.size) return rows;
      return rows.map((row) => ({
        ...row,
        isUrgent: urgent.has(String(row?.PatientTest_ID ?? "")),
      }));
    } catch (error) {
      console.log("urgent flags", error);
      return rows;
    }
  };

  const handleBindInvestigationOnCLick = async () => {
   try {
     const response = await handleBindInvestigation({
      PatientId : singlePatientData?.PatientID,
      /* ISO, not MM/DD/YYYY. The server parses this with Util.GetDateTime, which
         is a bare DateTime.Parse under the server's own culture - a dd/MM one
         here - so "10/15/2026" was read as day 10 of month 15 and threw
         "String '10/15/2026' was not recognized as a valid DateTime".
         yyyy-MM-dd is unambiguous in every culture. */
      FromDate : moment(payload?.fromDate).format("YYYY-MM-DD"),
      ToDate : moment(payload?.toDate).format("YYYY-MM-DD"),
      Condition : "CPOE Prescription",
    });
    if(response?.success){
      const rows = await withUrgentFlags(response?.data);
      setPayload({ ...payload, tableData: rows });
    }
    else{
      notify(response?.message, "error")
      setPayload({ ...payload, tableData: [] });
    }
   } catch (error) {
    console.log("error",error)
   }

    // setPayload({ ...payload, tableData: response });
  };

  const handleChecked = (e, index) => {
    const { name, checked } = e.target;
    const tableData = [...payload?.tableData];
    tableData[index][name] = checked;
    handlegetCheckedData(tableData);
    setPayload({ ...payload, tableData });
  };

  const settleValue = (row, index) => {
    const tableData = {
      All: null,
      SNo: null,
      Type: null,
      ItemName: null,
      Quantity: null,
      OutSource: null,
      Remarks: null,
    };

    // All

    tableData.All = (
      <input
        type="checkbox"
        className="table-checkbox"
        checked={row?.isChecked}
        name="isChecked"
        onChange={(e) => {
          handleChecked(e, index);
        }}
        disabled={row?.isOutSource === 1 || row?.IsIssue === 1}
      />
    );

    // SNo
    tableData.SNo = <div>{index + 1}</div>;

    // Type
    tableData.Type = <div>{row?.labType}</div>;

    // ItemName — an urgent test is called out here rather than in a column of its
    // own: the counter reads down the item names, and a separate column is easy to
    // miss on a long list.
    tableData.ItemName = (
      <div className="d-flex align-items-center" style={{ gap: 6 }}>
        <span>{row?.typeName}</span>
        {row?.isUrgent ? (
          <span
            title={t("Marked urgent by the doctor")}
            style={{
              background: "#dc2626",
              color: "#fff",
              borderRadius: 10,
              padding: "1px 7px",
              fontSize: 10,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {t("URGENT")}
          </span>
        ) : null}
      </div>
    );

    // Quantity
    tableData.Quantity = <div>{row?.Quantity}</div>;

    // OutSource

    tableData.OutSource = <div>{row?.isOutSource === 0 ? t("No") : t("Yes")}</div>;

    // Remarks

    tableData.Remarks = <div>{row?.Remarks}</div>;

    return tableData;
  };

  const tableBody = useMemo(() => {
    return payload?.tableData?.map((row, index) => {
      const { All, SNo, Type, ItemName, Quantity, OutSource, Remarks } =
        settleValue({ ...row, isChecked: row?.isChecked ?? false }, index);
      return {
        All,
        SNo,
        Type,
        ItemName,
        Quantity,
        OutSource,
        Remarks,
      };
    });
  }, [payload?.tableData]);

  const handleChange = (e) => {
    const { checked } = e?.target
    let list = payload?.tableData?.map((val) => {
      // debugger
      if (val?.isOutSource === 0 && val?.IsIssue === 0) {
        val.isChecked = checked
        return val
      }
      else {
        val.isChecked = false
        return val
      }

    })
    setPayload((val) => ({ ...val, ['tableData']: list }))
    handlegetCheckedData(list);
  }
  const THEAD = [
    {
      name: <>
        <input type="checkbox" className="table-checkbox" onChange={handleChange} />
      </>, width: "1%"
    },
    { name: t("S.No."), width: "1%" },
    t("Type"),
    t("Item Name"),
    { name: t("Quantity"), width: "1%" },
    t("OutSource"),
    t("Remarks")
  ];

  const searchHandleChange = (e) => {
    const { name, value } = e.target;
    setPayload({ ...payload, [name]: value });
  };
  const getRowClass = (val, index) => {
    // debugger
    if (payload?.tableData[index]?.IsIssue === 1) {
      return "color-indicator-1-bg"
    }else if(payload?.tableData[index]?.isOutSource === 1){
      return "color-indicator-2-bg"
    }
  }

  return (
    <div>
      <div className="row">
        <DatePicker
          className="custom-calendar"
          id="DOB"
          name="fromDate"
          lable={t("fromDate")}
          placeholder={VITE_DATE_FORMAT}
          respclass={"col-xl-3 col-md-4 col-sm-6 col-12"}
          value={payload?.fromDate}
          handleChange={searchHandleChange}
        />
        <DatePicker
          className="custom-calendar"
          id="toDate"
          name="toDate"
          lable={t("toDate")}
          placeholder={VITE_DATE_FORMAT}
          respclass={"col-xl-3 col-md-4 col-sm-6 col-12"}
          value={payload?.toDate}
          handleChange={searchHandleChange}
        />

        <div className="col-xl-2 col-md-4 col-sm-6 col-12">
          <div className="form-group">
            <Button
              name={t("Search")}
              className={"btn btn-sm  btn-primary"}
              handleClick={handleBindInvestigationOnCLick}
            />
          </div>
        </div>

        <div className="d-flex align-items-center">
          <ColorCodingSearch color={"color-indicator-1-bg"} label={t("Done")} />
          <ColorCodingSearch color={"color-indicator-2-bg"} label={t("Out Source")} />
        </div>

      </div>
      {tableBody.length > 0 && (
        <div>
          <Tables
          scrollView={"scrollView"}
          thead={THEAD} tbody={tableBody} getRowClass={getRowClass} />
        </div>
      )}
    </div>
  );
}

export default CPOEModal;
