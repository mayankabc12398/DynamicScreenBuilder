import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import moment from "moment";
import Tables from "../UI/customTable";
import DatePicker from "../formComponent/DatePicker";
import Heading from "../UI/Heading";
import { notify } from "../../utils/utils";
import {
  cRRTgetUserNameApi,
  getCrrtFlowSheetMasterApi,
  getSavedCrrt_Multiple_Flowsheet,
  saveCRRTFlowSheetApi,
  updateCrrtFlowSheetMasterApi,
} from "../../networkServices/nursingWardAPI";
import Input from "../formComponent/Input";
import EcmoTables from "../UI/customTable/AnastheticOperativeTable/EcmoTable";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";

const CrrtFlowSheet = ({ data }) => {
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const localdata = useLocalStorage("userData", "get");
  const { patientID, transactionID, CRRTFlowsheetID } = data;
  console.log(data);
  const employeeID = localdata?.employeeID || "";
  const formatDate = (date) => (date ? moment(date).format("YYYY-MM-DD") : "");

  const [nurseName, setNurseName] = useState("");
  const initialForm = {
    id: 0,
    transactionID: "",
    patientID: "",
    insertionDate: new Date(),
    diagnosis: "",
    result: "",
    acess: "",
    urea: "",
    creat: "",
    nephologist: "",
    naPlus: "",
    hvC_HBsag: "",
    kPlus: "",
    hiv: "",
    cl: "",
  };

  const [form, setForm] = useState(initialForm);

  const initialECMORow = {
    date: new Date(),
    bp: "",
    hr: "",
    bpr: "",
    uf: "",
    ap: "",
    vp: "",
    tmp: "",
    heprin: "",
    diaSubs: "",
    bChange: "",
    nurse: "",
  };

  const [rows, setRows] = useState([
    { ...initialECMORow, nurse: nurseName || "" },
  ]);

  const tableHeadersForm = [
    { name: t("DATE"), width: "10%" },
    { name: t("BP") },
    { name: t("HR") },
    { name: t("BPR") },
    { name: t("UF") },
    { name: t("AP") },
    { name: t("VP") },
    { name: t("TMP") },
    { name: t("HEPARIN") },
    { name: t("DIA / SUBS") },
    { name: t("B. CHANGE") },
    { name: t("NURSE") },
    { name: t("ACTION"),width:'4%' },
  ];

  const THEAD = [
    { name: t("S.No."), width: "4%" },
    { name: t("UHID") },
    { name: t("Entered By") },
    { name: t("Edit"),width:"5%" },
  ];

  const [tableData, setTableData] = useState([]);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    const fetchNurseName = async () => {
      try {
        const res = await cRRTgetUserNameApi(employeeID);

        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setNurseName(res.data[0].UserName || "");
        }
      } catch (err) {
        console.error("Nurse name fetch failed", err);
      }
    };

    if (employeeID) {
      fetchNurseName();
    }
  }, []);
  useEffect(() => {
    if (nurseName) {
      setRows((prevRows) =>
        prevRows.map((row, index) =>
          index === 0 && !row.nurse ? { ...row, nurse: nurseName } : row
        )
      );
    }
  }, [nurseName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleECMOChange = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addNewRow = () => {
    setRows((prev) => [...prev, { ...initialECMORow, nurse: nurseName }]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      if (!rows.length) {
        notify(t("Please add at least one CRRT record"), "warning");
        return;
      }


      const finalPayload = {
        updateCrrtFLowSheetMaster: [
          {
            id: isEdit ? form.id : 0,
            PatientId: patientID,
            TransactionID: transactionID,
            Diagnosis: form?.diagnosis || "",
            Result: form?.result || "",
            Acess: form?.acess || "",
            Urea: form?.urea || "",
            InsertionDate: formatDate(form.insertionDate),
            Creat: form?.creat || "",
            Nephologist: form?.nephologist || "",
            NaPlus: form?.naPlus || "",
            HvC_HBsag: form?.hvC_HBsag || "",
            KPlus: form?.kPlus || "",
            Hiv: form?.hiv || "",
            Cl: form?.cl || "",
          },
        ],
        updateCrrt_Multiple_FlowsheetData: rows?.map((row) => ({
          id: row?.id ?? 0,
          PatientId: patientID,
          TransactionID: transactionID,
          CrrtFlowsheetMasterID: isEdit ? form.id : 0,
          DateTime: row?.date
            ? moment(row.date).format("YYYY-MM-DD HH:mm")
            : "",
          BP: row?.bp || "",
          HR: row?.hr || "",
          BPR: row?.bpr || "",
          UF: row?.uf || "",
          AP: row?.ap || "",
          VP: row?.vp || "",
          TMP: row?.tmp || "",
          Heprin: row?.heprin || "",
          DiaSubs: row?.diaSubs || "",
          BChange: row?.bChange || "",
          Nurse: row?.nurse || nurseName,
        })),
      };
      debugger
      const res = isEdit
        ? await updateCrrtFlowSheetMasterApi(finalPayload)
        : await saveCRRTFlowSheetApi(finalPayload);

      if (res?.success) {
        notify(
          isEdit ? "Updated successfully!" : "Saved successfully!",
          "success"
        );

        setForm(initialForm);
        setRows([{ ...initialECMORow, nurse: nurseName }]);
        setIsEdit(false);

        fetchData();
      } else {
        notify(res?.message || "Save failed", "error");
      }
    } catch (error) {
      console.error("SAVE ERROR:", error);
      notify(t("Something went wrong"), "error");
    }
  };
  const mapApiRowToUiRow = (row) => ({
    id: row?.id ?? 0,
    date: row?.Date_Time ? new Date(row.Date_Time) : "",
    bp: row?.BP ?? "",
    hr: row?.HR ?? "",
    bpr: row?.BPR ?? "",
    uf: row?.UF ?? "",
    ap: row?.AP ?? "",
    vp: row?.VP ?? "",
    tmp: row?.TMP ?? "",
    heprin: row?.Heprin ?? "",
    diaSubs: row?.Dia_Subs ?? "",
    bChange: row?.BChange ?? "",
    nurse: row?.Nurse ?? nurseName,
  });
  const handleEdit = async (item) => {
    try {
      setForm({
        id: item.id,
        transactionID,
        patientID,
        insertionDate: new Date(item?.InsertionDate),
        diagnosis: item?.Diagnosis || "",
        result: item?.Results || "",
        acess: item?.Acess || "",
        urea: item?.Urea || "",
        creat: item?.Creat || "",
        nephologist: item?.Nephologist || "",
        naPlus: item?.NaPlus || "",
        hvC_HBsag: item?.HVC_HBsag || "",
        kPlus: item?.KPlus || "",
        hiv: item?.HIV || "",
        cl: item?.CL || "",
      });

      setIsEdit(true);

      const res = await getSavedCrrt_Multiple_Flowsheet(item.CRRTFlowsheetID);

      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const mappedRows = res.data.map(mapApiRowToUiRow);
        setRows(mappedRows);
      } else {
        setRows([{ ...initialECMORow, nurse: nurseName }]);
      }
    } catch (error) {
      console.error("EDIT LOAD ERROR:", error);
      notify(t("Failed to load CRRT details"), "error");
    }
  };

  const fetchData = async () => {
    const res = await getCrrtFlowSheetMasterApi(patientID);
    if (res?.success && Array.isArray(res.data)) {
      const mapped = res.data.map((item) => ({
        ...item,
        id: item.Id,
        CRRTFlowsheetID: item.CrrtFlowsheetMasterID,
      }));
      setTableData(mapped);
    } else {
      notify(res?.message, "error");
      setTableData([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatTableData = (data) =>
    data?.map((row, index) => ({
      [t("DATE")]: (
        <DatePicker
          name="date"
          value={row?.date}
          handleChange={(e) => handleECMOChange(index, "date", e.target.value)}
          placeholder={VITE_DATE_FORMAT}
          hideLabel
        />
      ),

      [t("BP")]: (
        <Input
          name="bp"
          className="form-control"
          id="bp"
          value={row?.bp}
          onChange={(e) => handleECMOChange(index, "bp", e.target.value)}
        />
      ),

      [t("HR")]: (
        <Input
          name="hr"
          className="form-control"
          id="hr"
          value={row?.hr}
          onChange={(e) => handleECMOChange(index, "hr", e.target.value)}
        />
      ),

      [t("BPR")]: (
        <Input
          name="bpr"
          className="form-control"
          id="bpr"
          value={row?.bpr}
          onChange={(e) => handleECMOChange(index, "bpr", e.target.value)}
        />
      ),

      [t("UF")]: (
        <Input
          name="uf"
          className="form-control"
          id="uf"
          value={row?.uf}
          onChange={(e) => handleECMOChange(index, "uf", e.target.value)}
        />
      ),

      [t("AP")]: (
        <Input
          name="ap"
          className="form-control"
          id="ap"
          value={row?.ap}
          onChange={(e) => handleECMOChange(index, "ap", e.target.value)}
        />
      ),

      [t("VP")]: (
        <Input
          name="vp"
          type="text"
          className="form-control"
          id="vp"
          value={row?.vp}
          onChange={(e) => handleECMOChange(index, "vp", e.target.value)}
        />
      ),

      [t("TMP")]: (
        <Input
          name="tmp"
          className="form-control"
          id="tmp"
          value={row?.tmp}
          onChange={(e) => handleECMOChange(index, "tmp", e.target.value)}
        />
      ),

      [t("HEPARIN")]: (
        <Input
          name="heprin"
          className="form-control"
          id="herpin"
          value={row?.heprin}
          onChange={(e) => handleECMOChange(index, "heprin", e.target.value)}
        />
      ),

      [t("DIA / SUBS")]: (
        <Input
          name="diaSubs"
          className="form-control"
          id="diaSubs"
          value={row?.diaSubs}
          onChange={(e) => handleECMOChange(index, "diaSubs", e.target.value)}
        />
      ),

      [t("B. CHANGE")]: (
        <Input
          name="bChange"
          id="bChange"
          className="form-control"
          value={row?.bChange}
          onChange={(e) => handleECMOChange(index, "bChange", e.target.value)}
        />
      ),

      [t("NURSE")]: (
        <Input
          name="nurse"
          id="nurse"
          value={row?.nurse}
          readOnly
          className="form-control"
        />
      ),

      [t("ACTION")]: (
        <div className="d-flex">
          {index === rows.length - 1 && (
            <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={addNewRow}
            >
              +
            </button>
          )}

          {rows.length > 1 && (
            <button
              type="button"
              className="btn btn-sm btn-danger ml-2"
              onClick={() => removeRow(index)}
            >
              -
            </button>
          )}
        </div>
      ),
    }));

  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration card">
        <Heading title={t("CRRT FLOW SHEET")} />
        <div className="row row-cols-lg-6 row-cols-md-3 row-cols-1 p-2">
          <Input
            lable={t("Diagnosis")}
            name="diagnosis"
            className="form-control"
            id="diagnosis"
            placeholder=""
            value={form.diagnosis}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />

          <Input
            lable={t("Result")}
            name="result"
            className="form-control"
            id="result"
            placeholder=""
            value={form.result}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />

          <Input
            lable={t("Acess")}
            name="acess"
            className="form-control"
            id="acess"
            placeholder=""
            value={form.acess}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />

          <Input
            lable={t("Urea")}
            name="urea"
            className="form-control"
            id="urea"
            placeholder=""
            value={form.urea}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
          <DatePicker
            name="insertionDate"
            lable={t("Insertion Date")}
            value={form.insertionDate}
            handleChange={handleChange}
            respclass="col-xl-2 col-md-4 col-12"
          />
          <Input
            lable={t("Creat")}
            name="creat"
            className="form-control"
            id="creat"
            placeholder=""
            value={form.creat}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />

          <Input
            lable={t("Nephologist")}
            name="nephologist"
            className="form-control"
            id="nephologist"
            placeholder=""
            value={form.nephologist}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />

          <Input
            lable={t("NA Plus")}
            name="naPlus"
            className="form-control"
            id="naPlus"
            placeholder=""
            value={form.naPlus}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />

          <Input
            lable={t("HVC HBsag")}
            name="hvC_HBsag"
            className="form-control"
            id="hvCHBsag"
            placeholder=""
            value={form.hvC_HBsag}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />

          <Input
            lable={t("kPlus")}
            name="kPlus"
            className="form-control"
            id="kPlus"
            placeholder=""
            value={form.kPlus}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />

          <Input
            lable={t("HIV")}
            name="hiv"
            className="form-control"
            id="hiv"
            placeholder=""
            value={form.hiv}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
          <Input
            lable={t("CL")}
            name="cl"
            className="form-control"
            id="cl"
            placeholder=""
            value={form.cl}
            onChange={handleChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
        </div>
        <EcmoTables thead={tableHeadersForm} tbody={formatTableData(rows)} />

        <div className="col-12 d-flex justify-content-end p-2">
          <button
            type="button"
            className="btn btn-primary mr-2"
            onClick={handleSave}
          >
            {isEdit ? t("Update") : t("Save")}
          </button>

          {/* <button type="button" className="btn btn-primary">
            {t("Print")}
          </button> */}
        </div>
        {tableData.length > 0 && (
          <>
            <Heading title={t("FLOW SHEET List")} />
            <Tables
              thead={THEAD}
              tbody={tableData?.map((item, index) => ({
                "S.No.": index + 1,
                UHID: item?.PatientID || "",
                "Entered By": item?.EMployeeName || "",
                Edit: (
                  <i
                    className="fa fa-edit text-primary"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleEdit(item)}
                  />
                ),
              }))}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default CrrtFlowSheet;
