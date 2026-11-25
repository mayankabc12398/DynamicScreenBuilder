import Input from "../../../../../formComponent/Input";
import React, { useEffect, useState } from "react";
import Tables from "../../..";
import i18next from "i18next";
const t = (key, options) => i18next.t(key, options);

const FamilyHistoryTable = ({
  loadSaveData,
  setFamilyHistoryData,
  patientDetail,
  disabled,
}) => {
  const [data, setData] = useState([
    {
      id: 1, // Unique identifier for each row
      DM: "",
      HT: "",
      Thyroid: "",
      PCOD: "",
      AnomaliesTwins: "",
      Consangunity: "",
      MedicalDisorders: "",
      AnyOther: "",
    },
  ]);

  // Handle input changes for a specific row
  const handleChange = (index, field, value) => {
    const updatedData = [...data];
    updatedData[index][field] = value;
    setData(updatedData);
  };



  // Table headers
  const TableHead = [
    { width: "1%", name: t("Sr.No.") },
    { width: "5%", name: t("DM") },
    { width: "5%", name: t("HT") },
    { width: "5%", name: t("Thyroid") },
    { width: "5%", name: t("PCOD") },
    { width: "5%", name: t("Anomalies & Twins") },
    { width: "5%", name: t("Consangunity") },
    { width: "5%", name: t("Medical Disorders") },
    { width: "5%", name: t("Any Others") },
  ];

  // useEffect(() => {
  //     if (loadSaveData && patientDetail) {
  //         let payload = data.map((item, index) => {
  //             return {
  //                 patientId: patientDetail?.currentPatient?.PatientID || "",
  //                 transactionId: patientDetail?.currentPatient?.TransactionID || "",
  //                 dm: item?.DM || "",
  //                 ht: item?.HT || "",
  //                 anomalies: item?.AnomaliesTwins || "",
  //                 consangunity: item?.Consangunity || "",
  //                 medicalDisorders: item?.MedicalDisorders || "",
  //                 anyOther: item?.AnyOther || "",
  //                 entryDate: new Date(),
  //             };
  //         });
  //         setFamilyHistoryData(payload);
  //         // You can now use the `payload` array for further processing
  //         console.log(payload);
  //     }
  // }, [loadSaveData, patientDetail, data]); // Add dependencies here

  useEffect(() => {
    if (loadSaveData && patientDetail) {
      // Check if any field in any row has data
      const hasData = data.some(
        (row) =>
          row.DM !== "" ||
          row.HT !== "" ||
          row.Thyroid !== "" ||
          row.PCOD !== "" ||
          row.AnomaliesTwins !== "" ||
          row.Consangunity !== "" ||
          row.MedicalDisorders !== "" ||
          row.AnyOther !== "",
      );

      let payload;
      if (!hasData) {
        payload = []; // Send empty array if no fields have data
      } else {
        payload = data.map((item, index) => {
          return {
            patientId: patientDetail?.currentPatient?.PatientID || "",
            transactionId: patientDetail?.currentPatient?.TransactionID || "",
            dm: item?.DM || "",
            ht: item?.HT || "",
            Thyroid: item?.Thyroid || "",
            PCOD: item?.PCOD || "",
            anomalies: item?.AnomaliesTwins || "",
            consangunity: item?.Consangunity || "",
            medicalDisorders: item?.MedicalDisorders || "",
            anyOther: item?.AnyOther || "",
            entryDate: new Date(),
          };
        });
      }

      setFamilyHistoryData(payload);
      // You can now use the `payload` array for further processing
      console.log(payload);
    }
  }, [loadSaveData, patientDetail, data]); // Add dependencies here

  useEffect(() => {
    if (
      loadSaveData?.familyHistories &&
      loadSaveData?.familyHistories.length > 0
    ) {
      let tempData = loadSaveData?.familyHistories?.slice(0, 1).map((item, index) => {
        return {
          id: index + 1, // Unique identifier for each row
          DM: item?.dm,
          HT: item?.ht,
          Thyroid: item?.thyroid,
          PCOD: item?.pcod,
          AnomaliesTwins: item?.anomalies,
          Consangunity: item?.consangunity,
          MedicalDisorders: item?.medicalDisorders,
          AnyOther: item?.anyOther,
        };
      });
      setData(tempData);
    } else {
      setData([
        {
          id: 1, // Unique identifier for each row
          DM: "",
          HT: "",
          Thyroid: "",
          PCOD: "",
          AnomaliesTwins: "",
          Consangunity: "",
          MedicalDisorders: "",
          AnyOther: "",
        },
      ]);
    }
  }, [loadSaveData]);

  return (
    <div className="mt-2">
      <p className="col-sm-12 background-theme-color theme-color font-weight-bold">
        {t("Family History")}
      </p>
      <Tables
        thead={TableHead}
        tbody={data.map((row, index) => ({
          "Sr.No.": (
            <span className="d-flex justify-content-center align-items-center">
              {index + 1}
            </span>
          ),
          DM: (
            <Input
              type="text"
              className="table-input"
              removeFormGroupClass={true}
              name="DM"
              value={row.DM}
              onChange={(e) => handleChange(index, "DM", e.target.value)}

              disabled={disabled}
              maxLength={20}
            />
          ),
          HT: (
            <Input
              type="text"
              className="table-input"
              removeFormGroupClass={true}
              name="HT"
              value={row.HT}
              onChange={(e) => handleChange(index, "HT", e.target.value)}

              disabled={disabled}
              maxLength={20}
            />
          ),
          Thyroid: (
            <Input
              type="text"
              className="table-input"
              removeFormGroupClass={true}
              name="Thyroid"
              value={row.Thyroid}
              onChange={(e) => handleChange(index, "Thyroid", e.target.value)}

              disabled={disabled}
              maxLength={20}
            />
          ),
          PCOD: (
            <Input
              type="text"
              className="table-input"
              removeFormGroupClass={true}
              name="PCOD"
              value={row.PCOD}
              onChange={(e) => handleChange(index, "PCOD", e.target.value)}

              disabled={disabled}
              maxLength={20}
            />
          ),
          AnomaliesTwins: (
            <Input
              type="text"
              className="table-input"
              removeFormGroupClass={true}
              name="AnomaliesTwins"
              value={row.AnomaliesTwins}
              onChange={(e) =>
                handleChange(index, "AnomaliesTwins", e.target.value)
              }

              disabled={disabled}
              maxLength={20}
            />
          ),
          Consangunity: (
            <Input
              type="text"
              className="table-input"
              removeFormGroupClass={true}
              name="Consangunity"
              value={row.Consangunity}
              onChange={(e) =>
                handleChange(index, "Consangunity", e.target.value)
              }

              disabled={disabled}
              maxLength={20}
            />
          ),
          MedicalDisorders: (
            <Input
              type="text"
              className="table-input"
              removeFormGroupClass={true}
              name="MedicalDisorders"
              value={row.MedicalDisorders}
              onChange={(e) =>
                handleChange(index, "MedicalDisorders", e.target.value)
              }

              disabled={disabled}
              maxLength={20}
            />
          ),
          AnyOther: (
            <Input
              type="text"
              className="table-input"
              removeFormGroupClass={true}
              name="AnyOther"
              value={row.AnyOther}
              onChange={(e) => handleChange(index, "AnyOther", e.target.value)}

              disabled={disabled}
              maxLength={20}
            />
          ),
        }))}
      />
    </div>
  );
};

export default FamilyHistoryTable;
