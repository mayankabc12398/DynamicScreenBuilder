import React, { useEffect, useState } from "react";
import Heading from "../../../components/UI/Heading";
import { useTranslation } from "react-i18next";
import Tables from "../../../components/UI/customTable";
import {
  GetBindBabyGrowthChart,
  handleSaveBabyGrowthChart,
} from "../../../networkServices/DoctorApi";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
import { notify } from "../../../utils/utils";
import Modal from "../../../components/modalComponent/Modal";
import BabyGrouthConfirmationModel from "./BabyGrouthConfirmationModel";
import ChildGrowthCharts from "./BabyGrowthChart/ChildGrowthCharts";
import { ChevronDown, Plus, Printer, Save } from "lucide-react";
import BabyGrowthForm from "./BabyGrowthForm";
import moment from "moment";

const BabyGrowthChart = ({ patientDetail }) => {
  const [t] = useTranslation();
  const {
    PatientID,
    TransactionID,
    Gender,
    Sex,
    Age,
    AgeInYears,
    AppointmentDate,
    DOB,
  } = patientDetail;
  debugger;
  const { employeeID } = useLocalStorage("userData", "get");
  const [isDOBModalOpen, setIsDOBModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [growthChart, setGrowChart] = useState([]);
  const [values, setValues] = useState({
    date: new Date(),
    time: new Date(),
    height: "",
    weight: "",
    BMI: "",
    OFC: "",

    age: "",
    weightUnit: { value: "Kg", label: "Kg" },
    updateRecord: false,
    item: "",
    ShowTableView: 0,
    ShowTimeLine: 0,
  });

  console.log("patientDetailpatientDetail", values);
  const babyTableHedings = [
    { width: "1%", name: t("S.No.") },
    { width: "5%", name: t("Date") },
    // { width: "5%", name: t("Time") },
    { width: "5%", name: t("Weight (Kg)") },
    { width: "5%", name: t("Weight (gm)") },
    { width: "5%", name: t("Age (Month)") },
    { width: "5%", name: t("Height (cm)") },
    { width: "5%", name: t("Status") },
    { width: "5%", name: t("Entry By") },
    { width: "1%", name: t("Edit") },
  ];
  function convertToDate(dateString) {
    const [day, month, year] = dateString.split("-");
    const months = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    const date = new Date(year, months[month], day);
    return date;
  }
  function convertTimeToDate(timeString) {
    if (!timeString) return new Date("1970-01-01T00:00:00");
    const [time, modifier] = timeString.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const timeInDate = new Date();
    timeInDate.setHours(hours, minutes, 0, 0);
    return timeInDate;
  }

  const handleCheckboxChange = (e) => {
    const { name, value, checked, type } = e.target;
    setValues({
      ...values,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    });
  };
  const getBabyChart = async () => {
    try {
      const response = await GetBindBabyGrowthChart(PatientID);
      // const response = await GetBindBabyGrowthNew(PatientID);
      if (response?.success) {
        setGrowChart(response.data);
      }
    } catch (error) {
      notify(response?.message, "error");
      setGrowChart([]);
    }
  };
  const handleSaveUpdate = async () => {
    if (values?.height < 30 || values?.height > 220) {
      notify(t("Height (cm) must be between 30 and 220."), "error");
    } else if (values?.weight < 0.5 || values?.weight > 150) {
      notify(t("Weight (kg) must be between 0.5 and 150."), "error");
    } else if (values?.OFC < 20 || values?.OFC > 80) {
      notify(t("OFC (cm) must be between 20 and 80."), "error");
    }
    const requestBody = {
      // patientId: PatientID ?? "",
      // transactionID: Number(TransactionID) ?? 0,
      // ageInYears: String(AgeInYears) || "",
      // height: Number(values?.height) || 0,
      // weight: Number(values?.weight) || 0,
      // bmi: Number(values?.BMI) ?? 0,
      // ofc: Number(values?.OFC) ?? 0,
      // id: values?.id ? values?.id : 0,

      patientId: PatientID ?? "",
      transactionId: Number(TransactionID) ?? 0,
      visitDate: values?.date,
      dob: DOB ? moment(DOB).format("YYYY/MM/DD") : "",
      gender: Gender === "M" ? "Male" : Gender === "F" ? "Female" : "Other",
      weight: Number(values?.weight) || 0,
      height: Number(values?.height) || 0,
      id: values?.id ? values?.id : "",
      ofc: Number(values?.OFC) || 0,
    };
    // if (isUpdate) {
    //   requestBody.id = values?.id;
    // }
    try {
      const response = await handleSaveBabyGrowthChart(requestBody);
      if (response?.success) {
        notify(response?.message, "success");
        setIsUpdate(false);
        setIsFormModalOpen(false);
        getBabyChart();
        // setValues({
        //   date: new Date(),
        //   time: new Date(),
        //   height: "",
        //   weight: "",
        //   BMI: "",
        //   OFC: "",
        // });
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(
        error?.message
          ? error?.response?.data?.message
          : "Something Wents Wrong",
        "error",
      );
    }
  };

  useEffect(() => {
    getBabyChart();
    setIsDOBModalOpen(true);
  }, []);
  const handlePrint = () => {
    window.print();
  };
  const parseDateTime = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;

    if (typeof value === "string") {
      const [datePart, timePart, meridian] = value.split(" ");
      const [day, month, year] = datePart.split("-");

      let hours = 0,
        minutes = 0;
      if (timePart) {
        [hours, minutes] = timePart.split(":").map(Number);
        if (meridian === "PM" && hours < 12) hours += 12;
        if (meridian === "AM" && hours === 12) hours = 0;
      }

      return new Date(year, month - 1, day, hours, minutes);
    }

    return new Date(value);
  };

  // const parseDateTime = (value) => {
  //   if (!value) return null;
  //   if (value instanceof Date) return value;
  //   if (typeof value === "string" && value.includes("-")) {
  //     return new Date(
  //       value.replace(
  //         /(\d{2})-(\w{3})-(\d{4}) (\d{1,2}:\d{2}) (AM|PM)/i,
  //         "$1 $2 $3 $4 $5",
  //       ),
  //     );
  //   }

  //   return new Date(value);
  // };
  const handleEditFromChart = (item) => {
    debugger;
    const dateObj = parseDateTime(item?.updatedAt);

    setIsUpdate(true);
    setIsFormModalOpen(true);

    setValues({
      date: parseDateTime(item?.updatedAt),
      time: dateObj,
      weight: item?.weight || "",
      height: item?.height || "",
      BMI: item?.bmi || "",
      OFC: item?.ofc || "",
      age: item?.ageLabel || "",
      id: item?.Id || 0,
      item: item,
      ShowTableView: 0,
      ShowTimeLine: 0,
    });
  };

  return (
    <>
      <div className="card patient_registration border p-2">
        <>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div
                className="rounded-circle bg-secondary d-flex justify-content-center align-items-center text-white mr-2"
                style={{ width: "40px", height: "40px" }}
              >
                {t("PN")}
              </div>
              <div>
                <h6 className="mb-0">
                  {patientDetail?.Pname} <ChevronDown size={14} />
                </h6>
                <small className="text-muted">{patientDetail?.Age}</small>
              </div>
            </div>

            <div className="d-flex align-items-center gap-3">
              <span
                className="badge rounded-pill p-2 px-3"
                style={{ backgroundColor: "#f3e5f5", color: "#7b1fa2" }}
              >
                {t("WHO-IAP Chart")}
              </span>
              <button
                className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                onClick={handlePrint}
              >
                <Printer size={16} /> {t("Print")} <ChevronDown size={14} />
              </button>
              <button
                className="btn btn-primary btn-sm d-flex align-items-center gap-2 ml-2"
                onClick={handleSaveUpdate}
              >
                <Save size={16} /> {isUpdate ? t("Update") : t("Save")}
              </button>
            </div>
          </div>

          <div className="d-flex justify-content-between mb-2 bg-white rounded shadow-sm">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsFormModalOpen(true)}
            >
              <Plus size={18} /> {t("Add Measurements")}
            </button>
            <div className="d-flex gap-4 align-items-center px-3">
              <small
                className="text-muted card p-1"
                style={{ cursor: "pointer" }}
                onClick={() => setIsDOBModalOpen(true)}
              >
                + Add mid parental height
              </small>
              <small
                className="text-muted ml-3 card p-1"
                style={{ cursor: "pointer" }}
                onClick={() => setIsDOBModalOpen(true)}
              >
                + Add gestation period
              </small>
              <div className="form-check form-switch d-flex align-items-center gap-2 ml-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="ShowTableView"
                  value={values?.ShowTableView}
                  onChange={handleCheckboxChange}
                />
                <label className="small text-muted mb-0 mx-2">
                  {t("Show Table View")}
                </label>
              </div>
              {/* <div className="form-check form-switch d-flex align-items-center gap-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="ShowTimeLine"
                  value={values?.ShowTimeLine}
                  onChange={handleCheckboxChange}
                />
                <label className="small text-muted mb-0 mx-2">
                  Show Timeline in years
                </label>
              </div> */}
            </div>
          </div>
        </>

        <Heading title={t("Result")} isBreadcrumb={false} />
        {values?.ShowTableView === 0 ? (
          <div className="col-12">
            <ChildGrowthCharts
              apiResponse={growthChart}
              patientDetail={patientDetail}
              onEdit={handleEditFromChart}
            />
          </div>
        ) : (
          <>
            <div className="col-16">
              <Tables
                thead={babyTableHedings}
                tbody={growthChart?.map((item, index) => ({
                  sNo: index + 1,
                  date: item?.VisitDate || "",
                  // time: item?.Time || "",
                  weightKg: item?.Weight || "",
                  weightGram: Math.floor(item?.Weight * 1000) || "",
                  age: item?.AgeMonth || "",
                  length: item?.Height || "",
                  status: item?.GrowthStatus || "",
                  entryBy: item?.CreatedByName || "",
                  edit: (
                    <span
                      onClick={() => {
                        const dateObj = parseDateTime(item?.VisitDate);
                        setIsUpdate(true);
                        setIsFormModalOpen(true);
                        setValues({
                          date: dateObj,
                          time: dateObj,
                          weight: item?.Weight || "",
                          height: item?.Height || "",
                          BMI: item?.BMI || "",
                          OFC: item?.OFC || "",
                          age: item?.AgeInYears || "",
                          item: item,
                          id: item?.Id,
                        });
                      }}
                    >
                      <i className="fa fa-edit" />
                    </span>
                  ),
                }))}
              />
            </div>
          </>
        )}
      </div>

      {isDOBModalOpen && (
        <Modal
          visible={isDOBModalOpen}
          setVisible={() => setIsDOBModalOpen(false)}
          modalWidth="30vw"
          Header={t("Update Details")}
          footer={<></>}
        >
          <BabyGrouthConfirmationModel setIsDOBModalOpen={setIsDOBModalOpen} />
        </Modal>
      )}
      {isFormModalOpen && (
        <Modal
          visible={isFormModalOpen}
          setVisible={() => setIsFormModalOpen(false)}
          modalWidth="70vw"
          Header={t("Baby Growth Form")}
          footer={<></>}
        >
          <BabyGrowthForm
            patientDetail={patientDetail}
            setIsFormModalOpen={setIsFormModalOpen}
            values={values}
            setValues={setValues}
            handleSaveUpdate={handleSaveUpdate}
            isUpdate={isUpdate}
            setIsUpdate={setIsUpdate}
          />
        </Modal>
      )}
    </>
  );
};

export default BabyGrowthChart;
