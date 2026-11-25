import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";

import Tables from "../UI/customTable";
import EcmoTables from "../UI/customTable/AnastheticOperativeTable/EcmoTable";
import DatePicker from "../formComponent/DatePicker";
import TimePicker from "../formComponent/TimePicker";
import Input from "../formComponent/Input";
import Heading from "../UI/Heading";

import { notify, parseApiTime } from "../../utils/utils";
import {
  editdataApi,
  getDataPressureAreaCareApi,
  getUserNamePressureAreaCareApi,
  savePresureAreaCareFormApi,
} from "../../networkServices/nursingWardAPI";

import { useLocalStorage } from "../../utils/hooks/useLocalStorage";

const PressureAreaCare = ({ data }) => {
  const { t } = useTranslation();
  const { patientID, transactionID } = data;
  const { VITE_DATE_FORMAT } = import.meta.env;

  const localdata = useLocalStorage("userData", "get");
  const employeeID = localdata?.employeeID || "";

  const initialRow = {
    id: 0,
    date: new Date(),
    time: "",
    position: "",
    comment: "",
    sign: "",
  };

  const [signUser, setSignUser] = useState("");
  const [rows, setRows] = useState([initialRow]);
  const [tableData, setTableData] = useState([]);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (!employeeID) return;

    getUserNamePressureAreaCareApi(employeeID).then((res) => {
      if (res?.success && res?.data?.length) {
        setSignUser(res.data[0].UserName);
      }
    });
  }, [employeeID]);

  useEffect(() => {
    if (!signUser) return;
    setRows((prev) => prev.map((r) => ({ ...r, sign: r.sign || signUser })));
  }, [signUser]);

  const updateRow = (index, key, value) => {
    setRows((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], [key]: value };
      return clone;
    });
  };

  const addRow = () => {
    setRows((prev) => [...prev, { ...initialRow, sign: signUser }]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      const payload = {
        patientId: patientID,
        transactionId: transactionID,

        presureAreaCare_Data: rows.map((r) => {
          const datePart = r.date ? moment(r.date).format("YYYY-MM-DD") : "";

          const timePart = r.time
            ? moment(r.time, "HH:mm").format("HH:mm:ss")
            : "00:00:00";

          return {
            id: r.id || 0,
            patientId: patientID,
            transactionID: transactionID,

            dateTime: datePart,
            time: timePart,

            dateTime_new: datePart && timePart ? `${datePart} ${timePart}` : "",

            position: r.position || "",
            comment: r.comment || "",
            sign: r.sign || signUser,
          };
        }),
      };

      const res = isEdit
        ? await editdataApi(payload)
        : await savePresureAreaCareFormApi(payload);

      if (res?.success) {
        notify(
          isEdit ? "Updated successfully" : "Saved successfully",
          "success"
        );
        setRows([{ ...initialRow, sign: signUser }]);
        setIsEdit(false);
        fetchData();
      } else {
        notify(res?.message || "Failed", "error");
      }
    } catch (err) {
      console.error(err);
      notify(t("Something went wrong"), "error");
    }
  };

  const handleEdit = (item) => {
    setRows([
      {
        id: item.Id,
        date: item.Date_Time ? new Date(item.Date_Time) : new Date(),
        time: parseApiTime(item.Time),
        position: item.Position || "",
        comment: item.Comment || "",
        sign: item.Sign || signUser,
      },
    ]);
    setIsEdit(true);
  };

  const fetchData = async () => {
    const res = await getDataPressureAreaCareApi(patientID, transactionID);
    if (res?.success) setTableData(res.data);
    else setTableData([]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formRows = rows.map((row, index) => ({
    DATE: (
      <DatePicker
        placeholder={VITE_DATE_FORMAT || "DD/MM/YYYY"}
        className="custom-calendar"
        hourFormat="12"
        id="date"
        name="date"
        value={row.date}
        handleChange={(e) => updateRow(index, "date", e.target.value)}
        hideLabel
      />
    ),
    TIME: (
      <TimePicker
        placeholderName=""
        id="time"
        name="time"
        value={row.time}
        handleChange={(e) => updateRow(index, "time", e.target.value)}
      />
    ),
    POSITION: (
      <Input
        className="form-control"
        type="text"
        id="position"
        name="position"
        value={row.position}
        onChange={(e) => updateRow(index, "position", e.target.value)}
      />
    ),
    COMMENT: (
      <Input
        className="form-control"
        type="text"
        id="comment"
        name="comment"
        value={row.comment}
        onChange={(e) => updateRow(index, "comment", e.target.value)}
      />
    ),
    SIGN: (
      <Input
        className="form-control"
        id="sign"
        name="sign"
        value={row.sign}
        readOnly
      />
    ),
    ACTION: (
      <div className="d-flex gap-1">
        <button className="btn btn-sm btn-success" onClick={addRow}>
          +
        </button>
        {rows.length > 1 && (
          <button
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
        <Heading title={t("Pressure Area Care")} />
      </div>

      <EcmoTables
        thead={[
          { name: t("DATE") },
          { name: t("TIME") },
          { name: t("POSITION") },
          { name: t("COMMENT") },
          { name: t("SIGN") },
          { name: t("ACTION") },
        ]}
        tbody={formRows}
      />


      <div className="col-12 d-flex justify-content-end mt-2 p-2">
        <button className="btn btn-primary" onClick={handleSave}>
          {isEdit ? t("Update") : t("Save")}
        </button>
      </div>


      {tableData.length > 0 && (
        <>
          <Heading title={t("PRESSURE AREA CARE List")} />
          <Tables
            thead={[
              { name: t("S.No.") },
              { name: t("DATE") },
              { name: t("TIME") },
              { name: t("POSITION") },
              { name: t("COMMENT") },
              { name: t("SIGN") },
              { name: t("ENTERED BY") },
              { name: t("Edit") },
            ]}
            tbody={tableData.map((item, index) => ({
              "S.No.": index + 1,
              DATE: item.Date_Time
                ? moment(item.Date_Time).format("DD-MM-YYYY")
                : "",
              TIME: item.Time ? item.Time.substring(0, 5) : "",
              POSITION: item.Position,
              COMMENT: item.Comment,
              SIGN: item.Sign,
              "ENTERED BY": item.CreatedByName,
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
  );
};

export default PressureAreaCare;
