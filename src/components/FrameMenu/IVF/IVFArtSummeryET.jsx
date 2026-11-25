import { useTranslation } from "react-i18next";
import {
  bindDetails_ARTSummaryApi,
  print_ARTSummaryApi,
  PrintblankPrint_Previous_Infertility,
  save_ARTSummaryApi,
} from "../../../networkServices/IVFApi";
import { useEffect, useState } from "react";
import moment from "moment/moment";
import { notify } from "../../../utils/utils";
import Input from "../../formComponent/Input";
import DatePicker from "../../formComponent/DatePicker";
import Tables from "../../UI/customTable";
import { RedirectURL } from "../../../networkServices/PDFURL";
import Heading from "../../UI/Heading";

const IVFArtSummeryET = (data) => {
  const [t] = useTranslation();
  const { TransactionID: transactionID, PatientID: patientID } =
    data?.patientDetail || {};
  const { VITE_DATE_FORMAT } = import.meta.env;

  const THEAD = [
    { name: t("SNo") },
    { name: t("ART") },
    { name: t("Reason Of ART") },
    { name: t("Source Of Sperm") },
    { name: t("Source of Ovum") },
    { name: t("CreatedBy") },
    { name: t("CreatedDatetime") },
    { name: t("Edit"), width: "2%" },
    { name: t("Print"), width: "1%" },
  ];
  const DEVELOPINGTABLE = [
    { name: t("Code") },
    { name: t("Day") },
    { name: t("Cell Stage") },
    { name: t("%Fragmentation") },
    { name: t("State") },
    { name: t("Edit") },
    { name: t("Remove") },
  ];
  const [payload, setPayload] = useState({
    id: "",
    ivfid: "",
    art: "",
    reasonOfArt: "",
    sourceOfSperm: "",
    sourceOfOvum: "",
    procedure: "",
    dateOfEmbryoTransfer: new Date(),
    dateOfFreezing: new Date(),
    thawedEmbryosSurvive: "",
    transferredEmbryoNumber: "",
    transferDayStage: "",
    cryopreservedEmbryosLeft: "",
    embryos: [],
  });

  const [isEdit, setIsEdit] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [developingRows, setDevelopingRows] = useState([]);
  const [showDevelopingTable, setShowDevelopingTable] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const fetchData = async () => {
    try {
      const response = await bindDetails_ARTSummaryApi(transactionID);

      if (response?.success) {
        setTableData(response.data || []);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error?.response?.data?.message || "Something went wrong", "error");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRemoveRow = (id) => {
    const updatedRows = developingRows.filter((row) => row.id !== id);
    setDevelopingRows(updatedRows);

    if (updatedRows.length === 0) {
      setShowDevelopingTable(false);
    }
  };
  const handleAdd = () => {
    const newEmbryo = {
      id: Date.now(),
      patientID,
      transactionID,
      ivfid: payload.ivfid || "",
      code: payload.code,
      day: payload.day,
      cellStage: payload.cellStage,
      fragmentation: payload.fragmentation,
      state: payload.state,
    };

    setPayload((prev) => ({
      ...prev,
      embryos: [...(prev.embryos || []), newEmbryo],
      code: "",
      day: "",
      cellStage: "",
      fragmentation: "",
      state: "",
    }));

    setDevelopingRows((prev) => [
      ...prev,
      {
        id: newEmbryo.id,
        Code: newEmbryo.code,
        Day: newEmbryo.day,
        CellStage: newEmbryo.cellStage,
        Fragmentation: newEmbryo.fragmentation,
        State: newEmbryo.state,
      },
    ]);

    setShowDevelopingTable(true);
  };

  const hanldleprint = async () => {
    try {
      const response = await PrintblankPrint_Previous_Infertility(1);
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleRowPrint = async (item) => {
    try {
      const response = await print_ARTSummaryApi(transactionID, item?.ID);
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleSave = async () => {
    const finalPayload = {
      embryoData: {
        id: payload.id || "0",
        patientID,
        transactionID,
        ivfid: payload.ivfid || "",
        art: payload.art || "",
        reasonOfArt: payload.reasonOfArt || "",
        sourceOfSperm: payload.sourceOfSperm || "",
        sourceOfOvum: payload.sourceOfOvum || "",
        procedure: payload.procedure || "",
        dateOfEmbryoTransfer: payload.dateOfEmbryoTransfer
          ? moment(payload.dateOfEmbryoTransfer).format("YYYY-MM-DD")
          : "",
        dateOfFreezing: payload.dateOfFreezing
          ? moment(payload.dateOfFreezing).format("YYYY-MM-DD")
          : "",
        thawedEmbryosSurvive: payload.thawedEmbryosSurvive || "",
        transferredEmbryoNumber: payload.transferredEmbryoNumber || "",
        transferDayStage: payload.transferDayStage || "",
        cryopreservedEmbryosLeft: payload.cryopreservedEmbryosLeft || "",
      },

      embryos: (payload.embryos || []).map((embryo) => ({
        patientID,
        transactionID,
        ivfid: payload.ivfid || "",
        code: embryo.code || "",
        day: embryo.day || "",
        cellStage: embryo.cellStage || "",
        fragmentation: embryo.fragmentation || "",
        state: embryo.state || "",
      })),
    };

    try {
      const response = await save_ARTSummaryApi(finalPayload);

      if (response?.success) {
        notify(response?.message, "success");
        fetchData();
        resetForm();
        setIsEdit(false);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(t("Something went wrong"), "error");
      console.error(error);
    }
  };

  const resetForm = () => {
    setPayload({
      id: "",
      ivfid: "",
      art: "",
      reasonOfArt: "",
      sourceOfSperm: "",
      sourceOfOvum: "",
      procedure: "",
      dateOfEmbryoTransfer: "",
      dateOfFreezing: "",
      thawedEmbryosSurvive: "",
      transferredEmbryoNumber: "",
      transferDayStage: "",
      cryopreservedEmbryosLeft: "",
      code: "",
      day: "",
      cellStage: "",
      fragmentation: "",
      state: "",
    });

    setDevelopingRows([]);
  };
  const handleEditDevelopingRow = (row) => {
    setPayload((prev) => ({
      ...prev,
      code: row.Code || "",
      day: row.Day || "",
      cellStage: row.CellStage || "",
      fragmentation: row.Fragmentation || "",
      state: row.State || "",
    }));
  };

  const handleEdit = (item) => {
    setDevelopingRows([]);
    setShowDevelopingTable(false);

    const parsedDateOfEmbryoTransfer =
      item?.DateOfEmbryoTransfer &&
      item.DateOfEmbryoTransfer !== "0001-01-01T00:00:00"
        ? moment(item.DateOfEmbryoTransfer).toDate()
        : null;

    const parsedDateOfFreezing =
      item?.DateOfFreezing && item.DateOfFreezing !== "0001-01-01T00:00:00"
        ? moment(item.DateOfFreezing).toDate()
        : null;

    const embryosArray = item?.IVFEmbroys
      ? item.IVFEmbroys.split("|").map((val, index) => ({
          id: Date.now() + index,
          patientID,
          transactionID,
          ivfid: item?.IVFID || "",
          code: val,
          day: "",
          cellStage: "",
          fragmentation: "",
          state: "",
        }))
      : [];

    setPayload({
      id: item?.ID || "",
      ivfid: item?.IVFID || "",
      art: item?.ART || "",
      reasonOfArt: item?.ReasonOfART || "",
      sourceOfSperm: item?.SourceOfSperm || "",
      sourceOfOvum: item?.SourceOfOvum || "",
      procedure: item?.ProcedureToFormEmbryo || "",
      dateOfEmbryoTransfer: parsedDateOfEmbryoTransfer,
      dateOfFreezing: parsedDateOfFreezing,
      thawedEmbryosSurvive: item?.ThawedEmbryosSurvive || "",
      transferredEmbryoNumber: item?.TransferredEmbryoNumber || "",
      transferDayStage: item?.TransferDayStage || "",
      cryopreservedEmbryosLeft: item?.CryopreservedEmbryosLeft || "",
      code: "",
      day: "",
      cellStage: "",
      fragmentation: "",
      state: "",
      embryos: embryosArray,
    });

    setDevelopingRows(
      embryosArray.map((e) => ({
        id: e.id,
        Code: e.code,
        Day: e.day,
        CellStage: e.cellStage,
        Fragmentation: e.fragmentation,
        State: e.state,
      })),
    );

    setShowDevelopingTable(embryosArray.length > 0);
    setIsEdit(true);
  };

  return (
    <>
      <div className="m-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("Entry details")} />
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("ART")}
              id="art"
              name="art"
              value={payload?.art}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Reason of ART")}
              id="reasonOfArt"
              name="reasonOfArt"
              value={payload?.reasonOfArt}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Date of freezing of Embryos")}
              name="dateOfFreezing"
              id="dateOfFreezing"
              value={payload?.dateOfFreezing}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Source of Sperm")}
              id="sourceOfSperm"
              name="sourceOfSperm"
              value={payload?.sourceOfSperm}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />

            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Source of Ovum")}
              id="sourceOfOvum"
              name="sourceOfOvum"
              value={payload?.sourceOfOvum}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Procedure to form Embryo")}
              id="procedure"
              name="procedure"
              value={payload?.procedure}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <DatePicker
              placeholder={VITE_DATE_FORMAT}
              className="custom-calendar"
              lable={t("Date of Embryo Transfer")}
              name="dateOfEmbryoTransfer"
              id="dateOfEmbryoTransfer"
              value={payload?.dateOfEmbryoTransfer}
              showTime
              hourFormat="12"
              handleChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Thawed Embryos / Survive")}
              id="thawedEmbryosSurvive"
              name="thawedEmbryosSurvive"
              value={payload?.thawedEmbryosSurvive}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Transferred Embryo - Number")}
              id="transferredEmbryoNumber"
              name="transferredEmbryoNumber"
              value={payload?.transferredEmbryoNumber}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Transfer Day / Stage")}
              id="transferDayStage"
              name="transferDayStage"
              value={payload?.transferDayStage}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Cryopreserved Embryos left")}
              id="cryopreservedEmbryosLeft"
              name="cryopreservedEmbryosLeft"
              value={payload?.cryopreservedEmbryosLeft}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
          </div>
          <Heading title={t("Developing Embryos")} />
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Code")}
              id="code"
              name="code"
              value={payload?.code}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Day")}
              id="day"
              name="day"
              value={payload?.day}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Cell Stage")}
              id="cellStage"
              name="cellStage"
              value={payload?.cellStage}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("%Fragmentation")}
              id="fragmentation"
              name="fragmentation"
              value={payload?.fragmentation}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("State")}
              id="state"
              name="state"
              value={payload?.state}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
          </div>

          <div className="d-flex justify-content-end gap-2 p-2">
            <button
              type="button"
              className="btn btn-primary mr-2"
              onClick={handleSave}
            >
              {isEdit ? t("Update") : t("Save")}
            </button>

            <button
              type="button"
              className="btn btn-success"
              onClick={hanldleprint}
            >
              {t("Print Blank")}
            </button>
            <button
              type="button"
              className="btn btn-primary ml-2"
              onClick={handleAdd}
            >
              {t("Add")}
            </button>
          </div>
        </div>
      </div>
      <div className="mb-3">
        {showDevelopingTable && (
          <div className="mb-3">
            <Tables
              thead={DEVELOPINGTABLE}
              tbody={developingRows.map((row, index) => ({
                Code: row.Code,
                Day: row.Day,
                "Cell Stage": row.CellStage,
                "%Fragmentation": row.Fragmentation,
                State: row.State,
                Edit: (
                  <i
                    className="fa fa-edit p-1"
                    style={{ cursor: "pointer", color: "blue" }}
                    onClick={() => handleEditDevelopingRow(row)}
                  />
                ),

                Remove: (
                  <i
                    className="fa fa-times p-1"
                    onClick={() => handleRemoveRow(row.id)}
                    style={{ cursor: "pointer", color: "red" }}
                  />
                ),
              }))}
            />
          </div>
        )}
      </div>
      {tableData && tableData.length > 0 && (
        <>
          <Heading title={t("History")} />
          <Tables
            thead={THEAD}
            tbody={tableData?.map((item, index) => ({
              SNo: index + 1,
              ART: item?.ART,
              "Reason Of ART": item?.ReasonOfART,
              "Source Of Sperm": item?.SourceOfSperm,
              "Source of Ovum": item?.SourceOfOvum,
              CreatedBy: item?.EnterBy || "",
              CreatedDatetime: item?.EnterDatetime || "",
              Edit: (
                <i
                  className="fa fa-edit p-1"
                  onClick={() => handleEdit(item)}
                  style={{ cursor: "pointer", color: "blue" }}
                  title={t("Edit")}
                />
              ),
              Print: (
                <i
                  className="fa fa-print p-1"
                  onClick={() => handleRowPrint(item)}
                  style={{ cursor: "pointer", color: "green" }}
                  title={t("Print")}
                />
              ),
            }))}
          />
        </>
      )}
    </>
  );
};
export default IVFArtSummeryET;
