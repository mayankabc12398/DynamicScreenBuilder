import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import DatePicker from "../../../../components/formComponent/DatePicker";
import LabeledInput from "../../../../components/formComponent/LabeledInput";
import ReactSelect from "../../../../components/formComponent/ReactSelect";
import TextAreaInput from "../../../../components/formComponent/TextAreaInput";
import { AutoComplete } from "primereact/autocomplete";
import { notify } from "../../../../utils/ustil2";
import {
  GetBindVaccineBrand,
  SaveUpdateVaccineBrandName,
} from "../../../../networkServices/DoctorApi";
import moment from "moment";
import { translateOptions } from "@components/WrapTranslate";

const siteOptions = [
  { value: "Left hand", label: "Left hand" },
  { value: "Right hand", label: "Right hand" },
];

const EditVaccinationStatusModal = ({
  handleClose,
  refreshData,
  selectedCards = [],
  data,
  patientDetail,
  vaccineOptions,
  getChildVaccination,
}) => {
  const { t } = useTranslation();
  const autoCompleteRefs = useRef([]);
  const [vaccineSuggestions, setVaccineSuggestions] = useState([]);
  const [payload, setPayload] = useState([]);
  const [dates, setDates] = useState({
    givenDate: new Date(),
    dueDate: new Date(),
  });

  useEffect(() => {
    // debugger
    if (data?.DOB) {
      setDates({
        givenDate: data?.DOB ? data.DOB : new Date(),
        dueDate: new Date(),
      });
    }
  }, [data]);
  useEffect(() => {
    // debugger;
    if (selectedCards?.length) {
      const initialPayload = selectedCards.map((item) => ({
        VaccineId: item.value,
        VaccineName: item.label,
        vaccineName: "",
        vaccineBrand: "",
        Site: "",
        Note: "",
        cvsid: item?.vaccine?.cvsid,
        vaccineName: "",
        vaccineBrand: "",
        vaccineBrandObj: null,
      }));
      setPayload(initialPayload);
    }
  }, [selectedCards]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDates((prev) => ({ ...prev, [name]: value }));
  };

  // const handleRowChange = (index, field, value) => {
  //   debugger;
  //   if (field === "vaccineName") {
  //     setPayload((prev) => {
  //       const updated = [...prev];
  //       updated[index] = {
  //         ...updated[index],
  //         [field]: value?.VaccineBrandName,
  //       };
  //       return updated;
  //     });
  //   } else {
  //     setPayload((prev) => {
  //       const updated = [...prev];
  //       updated[index] = {
  //         ...updated[index],
  //         [field]: value,
  //       };
  //       return updated;
  //     });
  //   }
  // };
  const handleRowChange = (index, field, value) => {
    setPayload((prev) => {
      const updated = [...prev];

      if (field === "vaccineBrandObj") {
        updated[index] = {
          ...updated[index],
          vaccineBrandObj: value,
          vaccineName: value?.VaccineBrandName || "",
          vaccineBrand: value?.VaccineBrandID || "",
        };
      } else {
        updated[index] = {
          ...updated[index],
          [field]: value,
        };
      }

      return updated;
    });
  };

  const fetchVaccineBrands = async () => {
    try {
      const res = await GetBindVaccineBrand();
      if (res?.success) {
        setVaccineSuggestions(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const handleSubmit = async () => {
    const reqBody = payload?.map((ele) => ({
      vaccineId: String(ele?.VaccineId) || "",
      patientId: patientDetail?.PatientID || "",
      vaccineName: String(ele?.VaccineName) || "",
      vaccineBrandName: String(ele?.vaccineName) || "",
      site: String(ele?.Site) || "",
      notes: String(ele?.Note) || "",
      cvsId: ele?.cvsid ? ele?.cvsid : "",
      transactionId: patientDetail?.TransactionID || "",
      dayMasterId: String(vaccineOptions[0]?.fullItem?.dayId) || "",
      givenDate: moment(dates?.givenDate).format("YYYY-MMM-DD"),
      dueDate: moment(dates?.dueDate).format("YYYY-MMM-DD"),
    }));
    try {
      const res = await SaveUpdateVaccineBrandName(reqBody);

      if (res?.success) {
        notify(res.message || "Updated successfully", "success");
        // getChildVaccination();
        refreshData?.();
        handleClose?.();
      }
    } catch (err) {
      console.error(err);
      notify(t("Something went wrong"), "error");
    }
  };
  console.log(vaccineOptions, "payload");
  const itemTemplate = (item) => {
    console.log(item, "ssssss");
    return <div style={{ fontSize: "13px" }}>{item.VaccineBrandName}</div>;
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <DatePicker
          lable={t("Given Date")}
          name="givenDate"
          value={dates?.givenDate}
          showTime
          hourFormat="12"
          handleChange={handleDateChange}
          respclass="col-xl-3 col-md-3 col-sm-6"
        />

        <DatePicker
          lable={t("Due Date")}
          name="dueDate"
          value={dates?.dueDate}
          showTime
          hourFormat="12"
          handleChange={handleDateChange}
          respclass="col-xl-3 col-md-3 col-sm-6"
          disable={true}
        />
      </div>

      {/* Vaccine Rows */}
      {selectedCards.map((row, index) => (
        <div className="row border-bottom align-items-center" key={row.value}>
          {/* Vaccine */}
          <div className="col-xl-2 col-md-3 col-12">
            <LabeledInput label={t("Vaccine")} value={row.label} disabled />
          </div>

          {/* Brand */}
          <div className="col-xl-3 col-md-3 col-12 position-relative">
            {/* <AutoComplete
              ref={(el) => (autoCompleteRefs.current[index] = el)}
              value={payload[index]?.vaccineName || ""}
              suggestions={vaccineSuggestions}
              completeMethod={() => fetchVaccineBrands(row.value)}
              field="label"
              placeholder="Search Brand..."
              className="w-100"
              onChange={(e) => handleRowChange(index, "vaccineName", e.value)}
              onSelect={(e) => {
                handleRowChange(index, "vaccineName", e.value.label);
                handleRowChange(index, "vaccineBrand", e.value.value);
              }}
              itemTemplate={itemTemplate}
            /> */}
            <AutoComplete
              ref={(el) => (autoCompleteRefs.current[index] = el)}
              value={payload[index]?.vaccineBrandObj || null}
              suggestions={vaccineSuggestions}
              completeMethod={fetchVaccineBrands}
              field="VaccineBrandName"
              placeholder={t("Search Brand...")}
              className="w-100"
              onChange={(e) =>
                handleRowChange(index, "vaccineBrandObj", e.value)
              }
              itemTemplate={itemTemplate}
            />

            <label className="lable searchtest ml-4">
              {t("Vaccine Brand")}
            </label>
          </div>

          {/* Site */}
          <div className="col-xl-3 col-md-3 col-12 mt-2">
            <ReactSelect
              placeholderName={t("Site")}
              dynamicOptions={translateOptions(siteOptions, t)}
              value={payload[index]?.Site || ""}
              handleChange={(name, option) =>
                handleRowChange(index, "Site", option?.value)
              }
              removeIsClearable
            />
          </div>

          {/* Note */}
          <div className="col-xl-4 col-md-3 col-12 mt-2">
            <TextAreaInput
              lable={t("Note")}
              rows={1}
              value={payload[index]?.Note || ""}
              onChange={(e) => handleRowChange(index, "Note", e.target.value)}
            />
          </div>
        </div>
      ))}

      {/* Submit */}
      <div className="row justify-content-end mt-4">
        <div className="col-sm-2">
          <button className="btn btn-primary w-100" onClick={handleSubmit}>
            {t("Update")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditVaccinationStatusModal;
