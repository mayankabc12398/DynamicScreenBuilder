import { useTranslation } from "react-i18next";
import Heading from "../UI/Heading";
import React, { useEffect, useState } from "react";
import Input from "../formComponent/Input";
import Tables from "../UI/customTable";
import TimePicker from "../formComponent/TimePicker";
import {
  AddSaveIrrigationChartAPI,
  IrrigationSearchChartDataAPI,
  UpdateIrrigationChartData,
} from "../../networkServices/OT/otAPI";
import { notify } from "../../utils/ustil2";
import { NursingWardSearchAssessmentDataSettler } from "../../utils/utils";

const BladderImigration = ({ data }) => {
  const PatientID = data?.PatientID;
  const TransactionID = data?.TransactionID;
  const [t] = useTranslation();

  const THEAD = [
    t("S.No"),
    t("Time"),
    t("Type Of Fluid"),
    t("Fluid In"),
    t("Fluid Out"),
    t("Balance"),
    t("Effluent Color Comm."),
    t("Entry By"),
    t("Edit"),
    // "Remove",
  ];

  const [formData, setFormData] = useState({
    Time: "",
    TimeTypeOfFluid: "",
    FluidIn: "",
    FluidOut: "",
    EffluentComment: "",
    balance: "",
    PatientID: "",
    TransactionID: "",
  });

  const [tableData, setTableData] = useState([]);
  console.log({ tableData });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };
      const fluidIn = parseFloat(updated.FluidIn) || 0;
      const fluidOut = parseFloat(updated.FluidOut) || 0;
      updated.balance = fluidIn - fluidOut;
      return updated;
    });
  };

  const handleIrrigationSearchChartDataAPI = async (TransactionID) => {
    try {
      const APIresponse = await IrrigationSearchChartDataAPI(TransactionID);
      if (APIresponse?.success) {
        setTableData(APIresponse?.data);
      } else {
        setTableData([])
        notify(APIresponse?.message, "error");
      }
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  const handleSaveFormData = async () => {
    if (!formData?.FluidIn) {
      return notify(t("Fluid In is Required"),"warn")
    }
    if (!formData?.FluidOut) {
      return notify(t("FluidOut is Required"),"warn")
    }
    const payload = {
      Time: formData.Time,
      TypeOfFluid: formData.TimeTypeOfFluid,
      FluidIn: formData.FluidIn,
      FluidOut: formData.FluidOut,
      EffluentComment: formData.EffluentComment,
      balance: formData.balance,
      PatientID: PatientID,
      TransactionID: TransactionID,
    };

    try {
      const response = await AddSaveIrrigationChartAPI(payload);
      if (response?.success) {
        notify(response?.message, "success");
        setFormData({});
        handleIrrigationSearchChartDataAPI(TransactionID);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  // edit work
  const timeFormateDate = (time) => {
    if (!time || typeof time !== "string") return null;

    // handle "Invalid date"
    if (time.toLowerCase().includes("invalid")) return null;

    // normalize 01-57 PM → 01:57 PM
    const normalizedTime = time.replace("-", ":");

    const date = new Date();

    // HH:mm:ss
    if (/^\d{2}:\d{2}:\d{2}$/.test(normalizedTime)) {
      const [h, m, s] = normalizedTime.split(":").map(Number);
      date.setHours(h, m, s, 0);
      return date;
    }

    // HH:mm
    if (/^\d{2}:\d{2}$/.test(normalizedTime)) {
      const [h, m] = normalizedTime.split(":").map(Number);
      date.setHours(h, m, 0, 0);
      return date;
    }

    // hh:mm AM/PM
    const match = normalizedTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let [, hh, mm, period] = match;
      hh = Number(hh);
      mm = Number(mm);

      if (period.toUpperCase() === "PM" && hh !== 12) hh += 12;
      if (period.toUpperCase() === "AM" && hh === 12) hh = 0;

      date.setHours(hh, mm, 0, 0);
      return date;
    }

    return null;
  };

  const handleEdit = (data) => {
    // const responseData = NursingWardSearchAssessmentDataSettler(data);
    setFormData((prev) => ({
      ...prev,
      Time: timeFormateDate(data?.TIME),
      TimeTypeOfFluid: data?.TypeOf_fluid,
      id: data?.ID,
      FluidIn: data?.fluidIn,
      FluidOut: data?.fluidOut,
      balance: data?.totalbalance,
      EffluentComment: data?.effluent_color_Comment,
    }));
  };

  const handleUpdate = async () => {
    try {
      if (!formData?.FluidIn) {
        return notify(t("Fluid In is Required"))
      }
      if (!formData?.FluidOut) {
        return notify(t("FluidOut is Required"))
      }
      const payload = {
        Time: formData.Time,
        TypeOfFluid: formData.TimeTypeOfFluid,
        FluidIn: formData.FluidIn,
        FluidOut: formData.FluidOut,
        EffluentComment: formData.EffluentComment,
        balance: formData.balance,
        PatientID: PatientID,
        TransactionID: TransactionID,
        id: formData?.id
      };

      const response = await UpdateIrrigationChartData(payload);
      if (response?.success) {
        notify(response?.message, "success");
        setFormData({});
        handleIrrigationSearchChartDataAPI(TransactionID);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  const handleItemRemove = () => { };



  useEffect(() => {
    handleIrrigationSearchChartDataAPI(TransactionID);
  }, []);

  return (
    <>
      <div className="spatient_registration_card card">
        <Heading title={t("Bladder Imigration")} isBreadcrumb={false} />
        <div className="row p-2">
          {/* --- Top Level Fields --- */}
          <TimePicker
            placeholderName={t("Time")}
            lable={t("Time ")}
            id="Time"
            className="required-fields"
            name="Time"
            value={formData?.Time}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            handleChange={handleChange}
          />
          <Input
            type="text"
            className="form-control required-fields"
            // placeholder=""
            id="TimeTypeOfFluid"
            name="TimeTypeOfFluid"
            value={formData?.TimeTypeOfFluid || ""}
            onChange={handleChange}
            lable={t("TYPE OF FLUID	")}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
          <Input
            type="number"
            className="form-control required-fields"
            // placeholder=""
            id="FluidIn"
            name="FluidIn"
            value={formData?.FluidIn || ""}
            onChange={handleChange}
            lable={t("FLUID IN")}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
          <Input
            type="number"
            className="form-control required-fields"
            // placeholder=""
            id="FluidOut"
            name="FluidOut"
            value={formData?.FluidOut || ""}
            onChange={handleChange}
            lable={t("FLUID OUT")}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
          <Input
            type="text"
            className="form-control"
            placeholder=""
            id="balance"
            name="balance"
            value={formData?.balance || "0"}
            onChange={handleChange}
            disabled={true}
            lable={t("Balance")}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
          <Input
            type="text"
            className="form-control required-fields"
            // placeholder=""
            id="EffluentComment"
            name="EffluentComment"
            value={formData?.EffluentComment || ""}
            onChange={handleChange}
            lable={t("EFFLUENT COLOUR COMM.")}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
        </div>
        <div className="p-2 d-flex justify-content-end">
          {formData?.id ? (
            <button className="btn btn-sm btn-primary" onClick={handleUpdate}>
              {t("Update")}
            </button>
          ) : (
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSaveFormData}
            >
              {t("Save")}
            </button>
          )}
          {/* <button
            className="btn btn-sm btn-primary mx-2"
            onClick={"handlePrint"}
          >
            {t("Print")}
          </button> */}
        </div>
      </div>
      <div className="patient_registration card mt-2">
        <Heading title={t("Bladder Irrigation Data")} isBreadcrumb={false} />
        {/* {tableData?.length > 0 && ( */}
        <div className="px-2 row">
          <div className="col-12">
            {tableData?.length > 0 &&
              <Tables thead={THEAD}
                tbody={
                  tableData?.map((item, index) => ({
                    SNO: index + 1,
                    Time: item?.TIME ?? "-",
                    Age_Text: item?.TypeOf_fluid ?? "-",
                    MentalStatus_Text: item?.fluidIn ?? "-",
                    Lengthofstay_Text: item?.fluidOut ?? "-",
                    Balance: item?.totalbalance,
                    Elimination_Text: item?.effluent_color_Comment ?? "-",
                    EntryBy: item?.EntryBy ?? "-",
                    Edit: (
                      <i
                        className="fa fa-edit p-1"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleEdit(item)}
                      />
                    ),
                    // Remove: (
                    //   <i
                    //     className="fa fa-trash text-danger"
                    //     style={{ cursor: "pointer" }}
                    //     onClick={() => handleItemRemove(item)}
                    //   />
                    // ),
                  }))
                } />
            }
          </div>
        </div>
        {/* )} */}
      </div>
    </>
  );
};

export default BladderImigration;
