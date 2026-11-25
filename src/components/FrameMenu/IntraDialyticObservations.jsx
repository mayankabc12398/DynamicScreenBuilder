import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import TimePicker from "../formComponent/TimePicker";
import Input from "../formComponent/Input";
import Tables from "../UI/customTable";
import {
  getHemodialysis_Intra_Dialytic_ObservationApi,
  saveHemodialysis_Intra_Dialytic_ObservationApi,
  updateHemodialysis_Intra_Dialytic_ObservationApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";

const IntraDialyticObservations = ({ data }) => {
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const { transactionID, patientID } = data;

  const [tableData, setTableData] = useState([
    {
      id: 0,
      Time: "",
      BP: "",
      HR: "",
      TEMP: "",
      NA: "",
      VP: "",
      AP: "",
      TMP: "",
      UF: "",
      Heparin: "",
      BFR: "",
      REMARK: "",
      EnterBy: "",
      EntryName: "",
    },
  ]);

  const thead = [
    t("Time"),
    t("BP"),
    t("HR"),
    t("TEMP"),
    t("NA"),
    t("VP"),
    t("AP"),
    t("TMP"),
    t("UF"),
    t("Heparin"),
    t("BFR"),
    t("REMARK"),
    t("Enter By"),
    t("Action"),
  ];
  function convertTo24Hour(timeStr) {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":");
    if (hours === "12") {
      hours = modifier === "AM" ? "00" : "12";
    } else if (modifier === "PM") {
      hours = String(parseInt(hours, 10) + 12);
    }
    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
  }

  const handleChange = (e, index) => {
    const { name, value } = e.target;
    const updatedData = [...tableData];
    updatedData[index][name] = value;
    setTableData(updatedData);
  };
  const [isSaved, setIsSaved] = useState(false);

  const addRow = () => {
    setTableData([
      ...tableData,
      {
        Time: "",
        BP: "",
        HR: "",
        TEMP: "",
        NA: "",
        VP: "",
        AP: "",
        TMP: "",
        UF: "",
        Heparin: "",
        BFR: "",
        REMARK: "",
        EnterBy: "",
      },
    ]);
  };

  const removeRow = (index) => {
    setTableData(tableData.filter((_, i) => i !== index));
  };
  const fetchList = async () => {
    try {
      const res = await getHemodialysis_Intra_Dialytic_ObservationApi(
        transactionID,
        patientID
      );
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const mappedData = res.data.map((record) => ({
          id: record.Id || 0,
          Time: record.Time
            ? new Date(`1970-01-01T${convertTo24Hour(record.Time)}`)
            : new Date(),
          BP: record.BP || "",
          HR: record.HR || "",
          TEMP: record.Temp || "",
          NA: record.NaPlus || "",
          VP: record.VP || "",
          AP: record.AP || "",
          TMP: record.TMP || "",
          UF: record.UF || "",
          Heparin: record.Heparin || "",
          BFR: record.BFR || "",
          REMARK: record.REMARK || "",
          EnterBy: record.EntryBy || "",
          EntryName: record.EntryByName || "",
        }));

        setTableData(mappedData);
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSaveOrUpdate = async () => {
    const payload = tableData.map((item) => ({
      id: item.id || 0,
      patientId: patientID || "",
      transactionId: transactionID || "",
      time: item.Time || "",
      bp: item.BP || "",
      hr: item.HR || "",
      temp: item.TEMP || "",
      vp: item.VP || "",
      ap: item.AP || "",
      tmp: item.TMP || "",
      uf: item.UF || "",
      heparin: item.Heparin || "",
      bfr: item.BFR || "",
      remark: item.REMARK || "",
      entryBy: item.EnterBy || "",
      entryName: item.EntryName || "",
      naPlus: item.NA || "",
    }));

    try {
      const apiCall = isSaved
        ? updateHemodialysis_Intra_Dialytic_ObservationApi
        : saveHemodialysis_Intra_Dialytic_ObservationApi;

      const res = await apiCall(payload);
      if (res?.success) {
        notify(res.message, "success");
        setIsSaved(true);
        await fetchList();
      }
    } catch (error) {
      console.error("Error saving/updating data:", error);
      notify(t("Failed to save/update data"), "error");
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration card">
        <Tables
          thead={thead}
          tbody={tableData.map((item, index) => ({
            Time: (
              <TimePicker
                name="Time"
                className="required-fields"
                value={item.Time}
                handleChange={(e) => handleChange(e, index)}
              />
            ),
            BP: (
              <Input
                className="form-control"
                name="BP"
                value={item.BP}
                onChange={(e) => handleChange(e, index)}
              />
            ),
            HR: (
              <Input
                className="form-control"
                name="HR"
                value={item.HR}
                onChange={(e) => handleChange(e, index)}
              />
            ),
            TEMP: (
              <Input
                className="form-control"
                name="TEMP"
                value={item.TEMP}
                onChange={(e) => handleChange(e, index)}
              />
            ),
            NA: (
              <Input
                className="form-control"
                name="NA"
                value={item.NA}
                onChange={(e) => handleChange(e, index)}
              />
            ),
            VP: (
              <Input
                className="form-control"
                name="VP"
                value={item.VP}
                onChange={(e) => handleChange(e, index)}
              />
            ),
            AP: (
              <Input
                className="form-control"
                name="AP"
                value={item.AP}
                onChange={(e) => handleChange(e, index)}
              />
            ),
            TMP: (
              <Input
                className="form-control"
                name="TMP"
                value={item.TMP}
                onChange={(e) => handleChange(e, index)}
              />
            ),
            UF: (
              <Input
                className="form-control"
                name="UF"
                value={item.UF}
                onChange={(e) => handleChange(e, index)}
              />
            ),
            Heparin: (
              <Input
                className="form-control"
                name="Heparin"
                value={item.Heparin}
                onChange={(e) => handleChange(e, index)}
              />
            ),
            BFR: (
              <Input
                className="form-control"
                name="BFR"
                value={item.BFR}
                onChange={(e) => handleChange(e, index)}
              />
            ),
            REMARK: (
              <Input
                className="form-control"
                name="REMARK"
                value={item.REMARK}
                onChange={(e) => handleChange(e, index)}
              />
            ),
            EnterBy: (
              <Input
                className="form-control"
                name="EnterBy"
                value={item.EnterBy}
                onChange={(e) => handleChange(e, index)}
              />
            ),
            Action: (
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={addRow}
                >
                  +
                </button>
                {tableData.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeRow(index)}
                  >
                    −
                  </button>
                )}
              </div>
            ),
          }))}
        />

        <div className="d-flex justify-content-end mt-2 mb-2">
          <button className="btn btn-primary" onClick={handleSaveOrUpdate}>
            {isSaved ? t("Update") : t("Save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntraDialyticObservations;
