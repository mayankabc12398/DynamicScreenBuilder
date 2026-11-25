import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import Heading from "../UI/Heading";
import Tables from "../UI/customTable";
import { tab } from "@testing-library/user-event/dist/cjs/convenience/tab.js";
import TextAreaInput from "../formComponent/TextAreaInput";
import {
  getObstetricRecordFormsApi,
  saveOrUpdateObstetricRecordFormsApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";
import moment from "moment";
const createEmptyRow = () => ({
  YEAROFBIRTH: "",
  GESTATIONPERIOD: "",
  SEX: "",
  MODEOFDELIVERY: "",
  BIRTHWEIGHT: "",
  PLACEOFBIRTH: "",
  BREASTFEDDURATION: "",
  PUERPERIUM: "",
  PRESENTCONDITIONOFBODY: "",
});

const ObstetricRecord = ({ data, section }) => {
  const { t } = useTranslation();
  const ip = useLocalStorage("ip", "get");
  const { VITE_DATE_FORMAT } = import.meta.env;
  const { transactionID } = data;

  const initialState = {
    AdmissionDate: new Date(),
    DischargeDate: new Date(),
    Religion: "",
    Occuption: "",
    PhoneNo: "",
    Residence: "",
    Gravida: "",
    Para: "",
    SteroidTherapy: "",
    BloodGroup: "",
    NextOfKin: "",
    LMP: "",
    EDD: "",
    RelationShip: "",
    Weight: "",
    Height: "",
    Doctor: "",
    Paediatrician: "",
    Anaesthetist: "",
    MedicalSurgicalHistory: "",
    FamilyHistory: "",
    DiagnosisReasonAdmission: "",
    obstetricTable: [createEmptyRow()],
  };
  const thead = [
    { name: t("S.No."), width: "4%" },
    { width: "4%", name: t("YEAR OF BIRTH") },
    t("GESTATION PERIOD"),
    t("SEX"),
    t("MODE OF DELIVERY"),
    t("BIRTH WEIGHT"),
    t("PLACE OF BIRTH	"),
    t("BREASTFED DURATION"),
    t("PUERPERIUM"),
    t("PRESENT CONDITION OFBODY"),
    t("Action"),
  ];
  const Updatedthead = [
    { name: t("S.No."), width: "4%" },
    { name: t("PatientId"), width: "30%" },
    { name: t("Entryby") },
    { name: t("EntryDate") },
    { name: t("Edit"), width: "4%" },
  ];
  const [payload, setPayload] = useState(initialState);
  const [recordId, setRecordId] = useState(0);
  const [listData, setListData] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const tableData = payload.obstetricTable;

  const handleTableChange = (index, field, value) => {
    setPayload((prev) => ({
      ...prev,
      obstetricTable: prev.obstetricTable.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      ),
    }));
  };

  const handleAddRow = (index) => {
    const updated = [...payload.obstetricTable];
    updated.splice(index + 1, 0, createEmptyRow());
    setPayload((prev) => ({
      ...prev,
      obstetricTable: updated,
    }));
  };

  const handleDeleteRow = (index) => {
    if (payload.obstetricTable.length === 1) return;
    const updated = payload.obstetricTable.filter((_, i) => i !== index);
    setPayload((prev) => ({
      ...prev,
      obstetricTable: updated,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchListOnly = async () => {
    const res = await getObstetricRecordFormsApi({
      TransactionId: transactionID,
      SectionType: section,
    });

    if (!res?.success) return;

    const headerRaw = res?.data?.obstetricRecord?.tableDataResponse;
    const detailsRaw = res?.data?.obstetricRecord?.detailsResponse;

    const header = Array.isArray(headerRaw)
      ? headerRaw
      : headerRaw
        ? [headerRaw]
        : [];

    const details = Array.isArray(detailsRaw)
      ? detailsRaw
      : detailsRaw
        ? [detailsRaw]
        : [];

    setListData(
      header.map((h) => ({
        ...h,
        details: details.filter(
          (d) =>
            d.patientId === h.patientId && d.transactionId === h.transactionId
        ),
      }))
    );
  };
  const mapDetailsToTable = (details = []) =>
    details.length
      ? details.map((d) => ({
          YEAROFBIRTH: d.txtyearofbirth || "",
          GESTATIONPERIOD: d.txtgestationperiod || "",
          SEX: d.txtsex || "",
          MODEOFDELIVERY: d.txtmodeofdelivery || "",
          BIRTHWEIGHT: d.txtBirthWeight || "",
          PLACEOFBIRTH: d.txtplaceofbirth || "",
          BREASTFEDDURATION: d.txtBreastFeedDuration || "",
          PUERPERIUM: d.txtPuerperium || "",
          PRESENTCONDITIONOFBODY: d.txtPresentConditionOfBody || "",
        }))
      : [createEmptyRow()];

  const mapHeaderToPayload = (header) => ({
    AdmissionDate: header.txtDate ? new Date(header.txtDate) : new Date(),
    DischargeDate: header.txtDate1 ? new Date(header.txtDate1) : new Date(),
    Religion: header.txtReligion || "",
    Occuption: header.txtOccuption || "",
    PhoneNo: header.txtPhoneNo || "",
    Residence: header.txtResidence || "",
    Gravida: header.txtGravida || "",
    Para: header.txtPara || "",
    SteroidTherapy: header.txtSteroid || "",
    BloodGroup: header.txtBloodGroup || "",
    NextOfKin: header.txtnextofkin || "",
    LMP: header.txtlmp || "",
    EDD: header.txtedd || "",
    RelationShip: header.txtRelationShip || "",
    Weight: header.txtWeight || "",
    Height: header.txtHeight || "",
    Doctor: header.txtDoctor || "",
    Paediatrician: header.txtPaediatrician || "",
    Anaesthetist: header.txtAnaesthetist || "",
    MedicalSurgicalHistory: header.txtmedicalsurgicalhistory || "",
    FamilyHistory: header.txtfamilyhistory || "",
    DiagnosisReasonAdmission: header.txtDiagnosisReason || "",
  });
  mapDetailsToTable;

  useEffect(() => {
    fetchListOnly();
  }, []);

  useEffect(() => {
    setPayload((prev) => ({
      ...prev,
    }));
  }, [data]);

  const handleSaveOrUpdate = async () => {
    try {
      const reqBody = {
        sectionType: section,
        obstetric: {
          obstetricTableData: {
            id: isEditMode ? recordId : 0,
            patientId: data?.patientID || "",
            transactionId: data?.transactionID || "",
            txtDate: payload?.AdmissionDate
              ? moment(payload.AdmissionDate).format("YYYY-MM-DD")
              : "",
            txtDate1: payload?.DischargeDate
              ? moment(payload.DischargeDate).format("YYYY-MM-DD")
              : "",
            txtReligion: payload?.Religion || "",
            txtOccupation: payload?.Occuption || "",
            txtPhoneNo: payload?.PhoneNo || "",
            txtResidence: payload?.Residence || "",
            txtGravida: payload?.Gravida || "",
            txtPara: payload?.Para || "",
            txtSteroid: payload?.SteroidTherapy || "",
            txtBloodGroup: payload?.BloodGroup || "",
            txtnextofkin: payload?.NextOfKin || "",
            txtlmp: payload?.LMP || "",
            txtedd: payload?.EDD || "",
            txtRelationShip: payload?.RelationShip || "",
            txtphoneno1: String(payload?.PhoneNumber || ""),
            txtWeight: payload?.Weight || "",
            txtHeight: payload?.Height || "",
            txtDoctor: payload?.Doctor || "",
            txtPaediatrician: payload?.Paediatrician || "",
            txtAnaesthetist: payload?.Anaesthetist || "",
            txtmedicalsurgicalhistory: payload?.MedicalSurgicalHistory || "",
            txtfamilyhistory: payload?.FamilyHistory || "",
            txtDiagnosisReason: payload?.DiagnosisReasonAdmission || "",
          },

          obstetricDetails: payload.obstetricTable.map((row) => ({
            txtid: isEditMode ? recordId : 0,
            patientId: data?.patientID || "",
            transactionId: data?.transactionID || "",
            txtyearofbirth: row.YEAROFBIRTH || "",
            txtgestationperiod: row.GESTATIONPERIOD || "",
            txtsex: row.SEX || "",
            txtmodeofdelivery: row.MODEOFDELIVERY || "",
            txtbirthweigt: row.BIRTHWEIGHT || "",
            txtplaceofbirth: row.PLACEOFBIRTH || "",
            txtbreastfedduration: row.BREASTFEDDURATION || "",
            txtpuerperium: row.PUERPERIUM || "",
            txtpresentconditionofbody: row.PRESENTCONDITIONOFBODY || "",
          })),
        },
      };

      const res = await saveOrUpdateObstetricRecordFormsApi(reqBody);

      if (res?.success) {
        notify(res?.message, "success");
       await fetchListOnly();
        resetForm();
      }
    } catch (error) {
      console.error(error);
      notify(t("Server error"), "error");
    }
  };
  const resetForm = () => {
    setPayload({
      AdmissionDate: new Date(),
      DischargeDate: new Date(),
      Religion: "",
      Occuption: "",
      PhoneNo: "",
      Residence: "",
      Gravida: "",
      Para: "",
      SteroidTherapy: "",
      BloodGroup: "",
      NextOfKin: "",
      LMP: "",
      EDD: "",
      RelationShip: "",
      Weight: "",
      Height: "",
      Doctor: "",
      Paediatrician: "",
      Anaesthetist: "",
      MedicalSurgicalHistory: "",
      FamilyHistory: "",
      DiagnosisReasonAdmission: "",
      obstetricTable: [createEmptyRow()],
    });

    setRecordId(0);
    setIsEditMode(false);
  };

  const handleEdit = (item) => {
    setPayload({
      ...initialState,
      ...mapHeaderToPayload(item),
      obstetricTable: mapDetailsToTable(item.details),
    });

    setRecordId(item.id);
    setIsEditMode(true);
  };

  return (
    <>
      <div className="row px-2 mt-2">
        <DatePicker
          className="custom-calendar"
          placeholder={VITE_DATE_FORMAT}
          lable={t(" Admission Date")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="AdmissionDate"
          id="AdmissionDate"
          value={payload?.AdmissionDate}
          showTime
          hourFormat="12"
          handleChange={(e) =>
            setPayload((prev) => ({
              ...prev,
              AdmissionDate: e.value,
            }))
          }
        />

        <DatePicker
          className="custom-calendar"
          placeholder={VITE_DATE_FORMAT}
          lable={t("Discharge Date")}
          respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          name="DischargeDate"
          id="DischargeDate"
          value={payload?.DischargeDate}
          showTime
          hourFormat="12"
          handleChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Religion")}
          placeholder=""
          name="Religion"
          id="Religion"
          value={payload?.Religion}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Occuption")}
          placeholder=""
          name="Occuption"
          id="Occuption"
          value={payload?.Occuption}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
        <Input
          type="number"
          className="form-control"
          lable={t("PhoneNo")}
          placeholder=""
          name="PhoneNo"
          id="PhoneNo"
          value={payload?.PhoneNo}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Residence")}
          placeholder=""
          name="Residence"
          id="Residence"
          value={payload?.Residence}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
      </div>
      <div className="px-2">
        <Heading title={t("Obstetric History")} />
      </div>
      <div className="row px-2 mt-2">
        <Input
          type="text"
          className="form-control"
          lable={t("Gravida")}
          placeholder=""
          name="Gravida"
          id="Gravida"
          value={payload?.Gravida}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Para")}
          placeholder=""
          name="Para"
          id="Para"
          value={payload?.Para}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Steroid Therapy")}
          placeholder=""
          name="SteroidTherapy"
          id="SteroidTherapy"
          value={payload?.SteroidTherapy}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Blood Group")}
          placeholder=""
          name="BloodGroup"
          id="BloodGroup"
          value={payload?.BloodGroup}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Next Of Kin")}
          placeholder=""
          name="NextOfKin"
          id="NextOfKin"
          value={payload?.NextOfKin}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("L.M.P")}
          placeholder=""
          name="LMP"
          id="LMP"
          value={payload?.LMP}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("E.D.D")}
          placeholder=""
          name="EDD"
          id="EDD"
          value={payload?.EDD}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Relation Ship")}
          placeholder=""
          name="RelationShip"
          id="RelationShip"
          value={payload?.RelationShip}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Weight")}
          placeholder=""
          name="Weight"
          id="Weight"
          value={payload?.Weight}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Height")}
          placeholder=""
          name="Height"
          id="Height"
          value={payload?.Height}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />

        <Input
          type="number"
          className="form-control"
          lable={t("Phone Number")}
          placeholder=""
          name="PhoneNumber"
          id="PhoneNumber"
          value={payload?.PhoneNumber}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Doctor")}
          placeholder=""
          name="Doctor"
          id="Doctor"
          value={payload?.Doctor}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Paediatrician")}
          placeholder=""
          name="Paediatrician"
          id="Paediatrician"
          value={payload?.Paediatrician}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
        <Input
          type="text"
          className="form-control"
          lable={t("Anaesthetist")}
          placeholder=""
          name="Anaesthetist"
          id="Anaesthetist"
          value={payload?.Anaesthetist}
          respclass="col-xl-2 col-md-4 col-sm-6 col-12 mb-2"
          onChange={handleChange}
        />
      </div>
      <Tables
        thead={thead}
        tbody={tableData.map((row, index) => ({
          "S.No.": index + 1,
          "YEAR OF BIRTH": (
            <input
              className="form-control"
              value={row.YEAROFBIRTH}
              onChange={(e) =>
                handleTableChange(index, "YEAROFBIRTH", e.target.value)
              }
            />
          ),
          "GESTATION PERIOD": (
            <input
              className="form-control"
              value={row.GESTATIONPERIOD}
              onChange={(e) =>
                handleTableChange(index, "GESTATIONPERIOD", e.target.value)
              }
            />
          ),
          SEX: (
            <input
              className="form-control"
              value={row.SEX}
              onChange={(e) => handleTableChange(index, "SEX", e.target.value)}
            />
          ),
          "MODE OF DELIVERY": (
            <input
              className="form-control"
              value={row.MODEOFDELIVERY}
              onChange={(e) =>
                handleTableChange(index, "MODEOFDELIVERY", e.target.value)
              }
            />
          ),
          "BIRTH WEIGHT": (
            <input
              className="form-control"
              value={row.BIRTHWEIGHT}
              onChange={(e) =>
                handleTableChange(index, "BIRTHWEIGHT", e.target.value)
              }
            />
          ),
          "PLACE OF BIRTH": (
            <input
              className="form-control"
              value={row.PLACEOFBIRTH}
              onChange={(e) =>
                handleTableChange(index, "PLACEOFBIRTH", e.target.value)
              }
            />
          ),
          "BREASTFED DURATION": (
            <input
              className="form-control"
              value={row.BREASTFEDDURATION}
              onChange={(e) =>
                handleTableChange(index, "BREASTFEDDURATION", e.target.value)
              }
            />
          ),
          PUERPERIUM: (
            <input
              className="form-control"
              value={row.PUERPERIUM}
              onChange={(e) =>
                handleTableChange(index, "PUERPERIUM", e.target.value)
              }
            />
          ),
          "PRESENT CONDITION OF BODY": (
            <input
              className="form-control"
              value={row.PRESENTCONDITIONOFBODY}
              onChange={(e) =>
                handleTableChange(
                  index,
                  "PRESENTCONDITIONOFBODY",
                  e.target.value
                )
              }
            />
          ),
          Action: (
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-success"
                onClick={() => handleAddRow(index)}
              >
                +
              </button>
              <button
                className="btn btn-sm btn-danger ml-2"
                onClick={() => handleDeleteRow(index)}
              >
                -
              </button>
            </div>
          ),
        }))}
      />
      <div className="row px-2 mt-2">
        <TextAreaInput
          lable={t("Medical & Surgical History")}
          placeholder=""
          className="w-100"
          name="MedicalSurgicalHistory"
          id="MedicalSurgicalHistory"
          value={payload?.MedicalSurgicalHistory}
          maxLength={200}
          onChange={handleChange}
          respclass="col-xl-3 col-md-4 col-sm-6 col-12 mb-2"
        />
        <TextAreaInput
          lable={t("Family History")}
          placeholder=""
          className="w-100"
          name="FamilyHistory"
          id="FamilyHistory"
          value={payload?.FamilyHistory}
          maxLength={200}
          onChange={handleChange}
          respclass="col-xl-3 col-md-4 col-sm-6 col-12 mb-2"
        />
        <TextAreaInput
          lable={t("DiagnosisReason For Admission")}
          placeholder=""
          className="w-100"
          name="DiagnosisReasonAdmission"
          id="DiagnosisReasonAdmission"
          value={payload?.DiagnosisReasonAdmission}
          maxLength={200}
          onChange={handleChange}
          respclass="col-xl-3 col-md-4 col-sm-6 col-12 mb-2"
        />
        <div className="col-sm-2">
          <button
            className="btn btn-sm btn-success"
            onClick={handleSaveOrUpdate}
          >
            {isEditMode ? t("Update") : t("Save")}
          </button>
        </div>
      </div>

      <Tables
        thead={Updatedthead}
        tbody={listData.map((item, index) => ({
          SNo: index + 1,
          PatientId: item?.patientID || data?.patientID,
          Entryby: item?.entryby || data?.entryby,
          EntryDate: item?.entryDate || data?.entryDate,
          Edit: (
            <i
              className="fa fa-edit"
              style={{ cursor: "pointer", color: "blue" }}
              onClick={() => handleEdit(item, index)}
            />
          ),
        }))}
      />
    </>
  );
};

export default ObstetricRecord;
