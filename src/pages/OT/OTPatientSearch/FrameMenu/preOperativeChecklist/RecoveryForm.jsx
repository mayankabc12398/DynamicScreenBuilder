import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../../../../../components/UI/Heading";
import Input from "../../../../../components/formComponent/Input";
import { useLocalStorage } from "../../../../../utils/hooks/useLocalStorage";
import TimePicker from "../../../../../components/formComponent/TimePicker";
import Tables from "../../../../../components/UI/customTable";
import { ReprintSVG } from "../../../../../components/SvgIcons";
import { notify } from "../../../../../utils/ustil2";
import {
  BindRecoveryRoomMonitoringChartAPI,
  SaveRecoveryRoomMonitoringChartAPI,
  UpdateRecoveryRoomMonitoringChartAPI,
} from "../../../../../networkServices/OT/otAPI";
import moment from "moment";

const Recoverypayload = ({ data }) => {
  const localData = useLocalStorage("userData", "get");
  const empName = localData?.empName;

  const PatientID = data?.PatientID;
  const TransactionID = data?.TransactionID;

  const initialValues = {
    centerID: "",
    Id: "",
    Reciver: empName,
    Dates: "",
    EntryBy: "",
    TransactionID: "",
    PID: "",

    ActivityFirst: "",
    ActivitySecond: "",
    ActivityThird: "",
    ActivityFourth: "",
    ActivityFifth: "",
    ActivitySix: "",

    RespirationFirst: "",
    RespirationSecond: "",
    RespirationThird: "",
    RespirationFourth: "",
    RespirationFifth: "",
    RespirationSix: "",

    CirculationFirst: "",
    CirculationSecond: "",
    CirculationThird: "",
    CirculationFourth: "",
    CirculationFifth: "",
    CirculationSix: "",

    ConsciousnessFirst: "",
    ConsciousnessSecond: "",
    ConsciousnessThird: "",
    ConsciousnessFourth: "",
    ConsciousnessFifth: "",
    ConsciousnessSix: "",

    OxygenFirst: "",
    OxygenSecond: "",
    OxygenThird: "",
    OxygenFourth: "",
    OxygenFifth: "",
    OxygenSix: "",
  };

  const [t] = useTranslation();
  const [payload, setPayload] = useState(initialValues);
  const [tableData, setTableData] = useState([]);

  const save_updatePayload = {
    centerID: payload.centerID || 0,
    Id: payload.Id || 0,
    Reciver: payload.Reciver || "",

    Dates: moment(payload.Dates).format("hh:mm A") || "",
    EntryBy: payload.EntryBy || "",
    TransactionID: TransactionID || "",
    PID: PatientID || "",

    ActivityFirst: payload.ActivityFirst || "",
    ActivitySecond: payload.ActivitySecond || "",
    ActivityThird: payload.ActivityThird || "",
    ActivityFourth: payload.ActivityFourth || "",
    ActivityFifth: payload.ActivityFifth || "",
    ActivitySix: payload.ActivitySix || "",

    RespirationFirst: payload.RespirationFirst || "",
    RespirationSecond: payload.RespirationSecond || "",
    RespirationThird: payload.RespirationThird || "",
    RespirationFourth: payload.RespirationFourth || "",
    RespirationFifth: payload.RespirationFifth || "",
    RespirationSix: payload.RespirationSix || "",

    CirculationFirst: payload.CirculationFirst || "",
    CirculationSecond: payload.CirculationSecond || "",
    CirculationThird: payload.CirculationThird || "",
    CirculationFourth: payload.CirculationFourth || "",
    CirculationFifth: payload.CirculationFifth || "",
    CirculationSix: payload.CirculationSix || "",

    ConsciousnessFirst: payload.ConsciousnessFirst || "",
    ConsciousnessSecond: payload.ConsciousnessSecond || "",
    ConsciousnessThird: payload.ConsciousnessThird || "",
    ConsciousnessFourth: payload.ConsciousnessFourth || "",
    ConsciousnessFifth: payload.ConsciousnessFifth || "",
    ConsciousnessSix: payload.ConsciousnessSix || "",

    OxygenFirst: payload.OxygenFirst || "",
    OxygenSecond: payload.OxygenSecond || "",
    OxygenThird: payload.OxygenThird || "",
    OxygenFourth: payload.OxygenFourth || "",
    OxygenFifth: payload.OxygenFifth || "",
    OxygenSix: payload.OxygenSix || "",
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;

    setPayload({
      ...payload,
      [name]: value,
    });
  };

  const THEAD = [
    t("S.No"),
    t("Received By"),
    t("Date"),
    t("Entered By"),
    t("Entered Date"),
    t("Updated By"),
    t("Updated Date"),
    t("Edit"),
    t("Print"),
  ];

  const handleChangeGetData = async (PatientID) => {
    try {
      const APIresponse = await BindRecoveryRoomMonitoringChartAPI(PatientID);

      const data = APIresponse?.data || [];
      console.log(data);

      if (data.length > 0) {
        setTableData(data);
      } else {
        setTableData([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleEdit = async (save_updatePayload) => {
    setPayload({ ...save_updatePayload });
  };

  const handlePrint = (save_updatePayload) => {};

  const handleTableData = (tableData) => {
    return tableData?.map((items, index) => {
      const { Reciver, Date, EntryBy, EntryDate, UpdatedBy, UpdatedDate } =
        items;
      return {
        SNO: index + 1,
        Reciver,
        Date,
        EntryBy,
        EntryDate,
        UpdatedBy,
        UpdatedDate,
        Edit: (
          <i className="fa fa-edit p-1" onClick={() => handleEdit(items)} />
        ),
        print: (
          <div onClick={handlePrint}>
            <ReprintSVG />
          </div>
        ),
      };
    });
  };

  const handleCancel = () => {
    setPayload((prev) => {
      const cleared = {};
      Object.keys(prev).forEach((key) => {
        cleared[key] = "";
      });
      return cleared;
    });
  };

  const handleSave = async (update) => {
    try {
      let response;
      if (update) {
        response =
          await UpdateRecoveryRoomMonitoringChartAPI(save_updatePayload);
      } else {
        response = await SaveRecoveryRoomMonitoringChartAPI(save_updatePayload);
      }

      if (response?.success) {
        notify(response?.message, "success");
        setPayload(initialValues);
        handleChangeGetData(PatientID);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    handleChangeGetData(PatientID);
  }, []);

  const tbody = [
    {
      column1: (
        <table>
          <tbody>
            {/* ========== 1. ACTIVITY ========== */}
            <tr>
              <td rowSpan={2}>
                <b>1</b>
              </td>
              <td rowSpan={2}>
                <b>{t("Activity able to move voluntary or on commands")}</b>
              </td>
              <td rowSpan={2}>
                <br />2<br />1<br />0
              </td>
              <td rowSpan={2}>
                <br /> {t("Four extremities")}
                <br /> {t("Two extremities")}
                <br /> {t("No extremities")}
              </td>

              <td>
                <Input
                  className="form-control"
                  id="ActivityFirst"
                  name="ActivityFirst"
                  value={payload.ActivityFirst}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="ActivitySecond"
                  name="ActivitySecond"
                  value={payload.ActivitySecond}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="ActivityThird"
                  name="ActivityThird"
                  value={payload.ActivityThird}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="ActivityFourth"
                  name="ActivityFourth"
                  value={payload.ActivityFourth}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="ActivityFifth"
                  name="ActivityFifth"
                  value={payload.ActivityFifth}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="ActivitySix"
                  name="ActivitySix"
                  value={payload.ActivitySix}
                  onChange={handleChange}
                />
              </td>
            </tr>

            {/* second row of Activity (Respirations starts next) */}
            <tr />

            {/* ========== 2. RESPIRATION ========== */}
            <tr>
              <td rowSpan={2}>
                <b>2</b>
              </td>
              <td rowSpan={2}>
                <b>{t("Respiration")}</b>
              </td>
              <td rowSpan={2}>
                <br />2<br />1<br />0
              </td>
              <td rowSpan={2}>
                <br /> {t("Able to breathe deeply and cough freely")}
                <br /> {t("Dyspnoeic, shallow or limited breathing")}
                <br /> {t("Apnoea")}
              </td>

              <td>
                <Input
                  className="form-control"
                  id="RespirationFirst"
                  name="RespirationFirst"
                  value={payload.RespirationFirst}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="RespirationSecond"
                  name="RespirationSecond"
                  value={payload.RespirationSecond}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="RespirationThird"
                  name="RespirationThird"
                  value={payload.RespirationThird}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="RespirationFourth"
                  name="RespirationFourth"
                  value={payload.RespirationFourth}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="RespirationFifth"
                  name="RespirationFifth"
                  value={payload.RespirationFifth}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="RespirationSix"
                  name="RespirationSix"
                  value={payload.RespirationSix}
                  onChange={handleChange}
                />
              </td>
            </tr>

            <tr />

            {/* ========== 3. CIRCULATION ========== */}
            <tr>
              <td rowSpan={2}>
                <b>3</b>
              </td>
              <td rowSpan={2}>
                <b>{t("Circulation")}</b>
              </td>
              <td rowSpan={2}>
                <br />2<br />1<br />0
              </td>
              <td rowSpan={2}>
                <br /> {t("BP within 20 mm Hg of preop")}
                <br /> {t("BP within 20–50 mm Hg")}
                <br /> {t("BP > 50 mm Hg")}
              </td>

              <td>
                <Input
                  className="form-control"
                  id="CirculationFirst"
                  name="CirculationFirst"
                  value={payload.CirculationFirst}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="CirculationSecond"
                  name="CirculationSecond"
                  value={payload.CirculationSecond}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="CirculationThird"
                  name="CirculationThird"
                  value={payload.CirculationThird}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="CirculationFourth"
                  name="CirculationFourth"
                  value={payload.CirculationFourth}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="CirculationFifth"
                  name="CirculationFifth"
                  value={payload.CirculationFifth}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="CirculationSix"
                  name="CirculationSix"
                  value={payload.CirculationSix}
                  onChange={handleChange}
                />
              </td>
            </tr>

            <tr />

            {/* ========== 4. CONSCIOUSNESS ========== */}
            <tr>
              <td rowSpan={2}>
                <b>4</b>
              </td>
              <td rowSpan={2}>
                <b>{t("Consciousness")}</b>
              </td>
              <td rowSpan={2}>
                <br />2<br />1<br />0
              </td>
              <td rowSpan={2}>
                <br /> {t("Fully awake")}
                <br /> {t("Arousal")}
                <br /> {t("Unresponsive")}
              </td>

              <td>
                <Input
                  className="form-control"
                  id="ConsciousnessFirst"
                  name="ConsciousnessFirst"
                  value={payload.ConsciousnessFirst}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="ConsciousnessSecond"
                  name="ConsciousnessSecond"
                  value={payload.ConsciousnessSecond}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="ConsciousnessThird"
                  name="ConsciousnessThird"
                  value={payload.ConsciousnessThird}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="ConsciousnessFourth"
                  name="ConsciousnessFourth"
                  value={payload.ConsciousnessFourth}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="ConsciousnessFifth"
                  name="ConsciousnessFifth"
                  value={payload.ConsciousnessFifth}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="ConsciousnessSix"
                  name="ConsciousnessSix"
                  value={payload.ConsciousnessSix}
                  onChange={handleChange}
                />
              </td>
            </tr>

            <tr />

            {/* ========== 5. OXYGEN ========== */}
            <tr>
              <td rowSpan={2}>
                <b>5</b>
              </td>
              <td rowSpan={2}>
                <b>{t("Oxygen saturation")}</b>
              </td>
              <td rowSpan={2}>
                <br />2<br />1<br />0
              </td>
              <td rowSpan={2}>
                <br /> {t("Saturation > 92% on room air")}
                <br /> {t("Needs O₂ to maintain > 90%")}
                <br /> &lt; 90% even with O₂
              </td>

              <td>
                <Input
                  className="form-control"
                  id="OxygenFirst"
                  name="OxygenFirst"
                  value={payload.OxygenFirst}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="OxygenSecond"
                  name="OxygenSecond"
                  value={payload.OxygenSecond}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="OxygenThird"
                  name="OxygenThird"
                  value={payload.OxygenThird}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="OxygenFourth"
                  name="OxygenFourth"
                  value={payload.OxygenFourth}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="OxygenFifth"
                  name="OxygenFifth"
                  value={payload.OxygenFifth}
                  onChange={handleChange}
                />
              </td>
              <td>
                <Input
                  className="form-control"
                  id="OxygenSix"
                  name="OxygenSix"
                  value={payload.OxygenSix}
                  onChange={handleChange}
                />
              </td>
            </tr>
          </tbody>
        </table>
      ),
    },
  ];
  const thead = ["Aldrete Score"];

  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card">
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              placeholder=""
              id="Reciver"
              name="Reciver"
              value={payload?.Reciver}
              lable={t("This patient received by")}
              disabled={true}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <TimePicker
              placeholderName={t("Time")}
              lable={t("Time")}
              id="Dates"
              name="Dates"
              value={payload?.Dates}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              handleChange={handleDateTimeChange}
            />
          </div>
          <div className="col-12"></div>
          <Tables thead={[]} tbody={tbody} />
        </div>
        <div className="p-2">
          {payload?.Id ? (
            <>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => handleSave(true)}
              >
                {t("Update")}
              </button>

              <button
                className="btn btn-sm btn-secondary"
                onClick={handleCancel}
              >
                {t("Cancel")}
              </button>
            </>
          ) : (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => handleSave()}
            >
              {t("Save")}
            </button>
          )}
        </div>
      </div>
      <Heading
        title={t("Recovery Room Monitoring Chart List")}
        isBreadcrumb={false}
      />
      <div className="col-12">
        <Tables thead={THEAD} tbody={handleTableData(tableData)} />
      </div>
    </>
  );
};

export default Recoverypayload;
