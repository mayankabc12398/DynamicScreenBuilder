import React, { useState, useEffect } from "react";
import Heading from "../../../../../components/UI/Heading";
import { useTranslation } from "react-i18next";
import Tables from "../../../../../components/UI/customTable";
import Input from "../../../../../components/formComponent/Input";
import DynamicInputTable from "../../../../../components/UI/customTable/PreOperativeTable/DynamicInputTable ";
import {
  SaveSwabsInstrumentAndSharpsCountAPI,
  SwabsInstrumentAndSharpsCountGetSearchData,
} from "../../../../../networkServices/OT/otAPI";
import { notify } from "../../../../../utils/ustil2";
import { ReprintSVG } from "../../../../../components/SvgIcons";

const SwabsInstrumentAndSharpsCount = ({ data }) => {
  console.log({ data });
  const PatientID = data?.PatientID;
  const TransactionID = data?.TransactionID;
  const { VITE_DATE_FORMAT } = import.meta.env;

  const [t] = useTranslation();
  const initialValue = {
    centreID: "",
    ID: "",
    TID: "",
    PID: "",

    AbdominalPreliminary: "",
    RaytecPreliminary: "",
    ThroatPackPreliminary: "",
    PreliminarycheckFreeText1: "",
    PreliminarycheckFreeText2: "",
    PreliminarycheckFreeText3: "",
    AbdominalPreliminary1: "",
    RaytecPreliminary1: "",
    ThroatPackPreliminary1: "",
    PreliminarycheckFreeText4: "",
    PreliminarycheckFreeText5: "",
    PreliminarycheckFreeText6: "",
    AbdominalPreliminary2: "",
    RaytecPreliminary2: "",
    ThroatPackPreliminary2: "",
    PreliminarycheckFreeText7: "",
    PreliminarycheckFreeText8: "",
    PreliminarycheckFreeText9: "",
    AbdominalPreliminary3: "",
    RaytecPreliminary3: "",
    ThroatPackPreliminary3: "",
    PreliminarycheckFreeText10: "",
    PreliminarycheckFreeText11: "",
    PreliminarycheckFreeText12: "",

    // Wound Closure
    AbdominalWound: "",
    RaytecWound: "",
    ThroatPackWound: "",
    Woundclosure1: "",
    Woundclosure2: "",
    Woundclosure3: "",
    AbdominalWound1: "",
    RaytecWound1: "",
    ThroatPackWound1: "",
    Woundclosure4: "",
    Woundclosure5: "",
    Woundclosure6: "",
    AbdominalWound2: "",
    RaytecWound2: "",
    ThroatPackWound2: "",
    Woundclosure7: "",
    Woundclosure8: "",
    Woundclosure9: "",
    AbdominalWound3: "",
    RaytecWound3: "",
    ThroatPackWound3: "",
    Woundclosure10: "",
    Woundclosure11: "",
    Woundclosure12: "",
    // Final Count
    FinalAbdominal: "",
    FinalRaytec: "",
    FinalThroat: "",
    Finalcount1: "",
    Finalcount2: "",
    Finalcount3: "",

    // Skin Closure
    SkinClosure: "",
    NonAbsorbable: "",
    Absorbable: "",
    Infiltrations: "",
    Dressing: "",
    Packed: "",
    Whole: "",
    Others: "",
    Infusion: "",
    Loss: "",
    UOutput: "",

    // Medication
    medicationdoss: "",
    Route: "",
    meicationTime: "",
    Signmedication: "",
    medicationdoss1: "",
    Route1: "",
    meicationTime1: "",
    Signmedication1: "",
    medicationdoss2: "",
    Route2: "",
    meicationTime2: "",
    Signmedication2: "",
    medicationdoss3: "",
    Route3: "",
    meicationTime3: "",
    Signmedication3: "",

    // Surgical Implements
    SurgicalImplant: "",
    Lotno: "",
    size: "",
    SurgicalImplant1: "",
    Lotno1: "",
    size1: "",
    SurgicalImplant2: "",
    Lotno2: "",
    size2: "",
    SurgicalImplant3: "",
    Lotno3: "",
    size3: "",
    SurgicalImplant4: "",
    Lotno4: "",
    size4: "",

    // Specimen
    type: "",
    histology: "",
    Crytology: "",
    Culture: "",
    NotAnalysis: "",
    Disposition: "",
    type1: "",
    histology1: "",
    Crytology1: "",
    Culture1: "",
    NotAnalysis1: "",
    Disposition1: "",
    type2: "",
    histology2: "",
    Crytology2: "",
    Culture2: "",
    NotAnalysis2: "",
    Disposition2: "",
    type3: "",
    histology3: "",
    Crytology3: "",
    Culture3: "",
    NotAnalysis3: "",
    Disposition3: "",

    // Additional Fields
    ReturnedThreatre: "",
    ReturnedThreatre1: "",
    ReturnedThreatre2: "",
    MaterialCharge: "",

    CountCorrect: "",
    TakenAction: "",
  };

  const [payload, setPayload] = useState({
    ...initialValue,
  });
  const [tableData, setTableData] = useState([]);

  const THEAD = [t("S.No"), t("Transaction_ID"), t("Patient_ID"), t("Edit"), t("Print")];

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleSelectChange = (name, option) => {
    setPayload((prev) => ({
      ...prev,
      [name]: option?.value ?? "",
    }));
  };
  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;

    setPayload({
      ...payload,
      [name]: value,
    });
  };

  const handleGetData = async (TransactionID, PatientID) => {
    try {
      const APIresponse = await SwabsInstrumentAndSharpsCountGetSearchData(
        TransactionID,
        PatientID
      );

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

  const handleCancel = () => {
    setPayload((prev) => {
      const cleared = {};
      Object.keys(prev).forEach((key) => {
        cleared[key] = "";
      });
      return cleared;
    });
  };

  const handleEdit = (row) => {
    setPayload({
      ID: row.ID || "",

      // Preliminary Check
      AbdominalPreliminary: row.AbdominalPreliminary || "",
      RaytecPreliminary: row.RaytecPreliminary || "",
      ThroatPackPreliminary: row.ThroatPackPreliminary || "",
      PreliminarycheckFreeText1: row.PreliminarycheckFreeText1 || "",
      PreliminarycheckFreeText2: row.PreliminarycheckFreeText2 || "",
      PreliminarycheckFreeText3: row.PreliminarycheckFreeText3 || "",

      AbdominalPreliminary1: row.AbdominalPreliminary1 || "",
      RaytecPreliminary1: row.RaytecPreliminary1 || "",
      ThroatPackPreliminary1: row.ThroatPackPreliminary1 || "",
      PreliminarycheckFreeText4: row.PreliminarycheckFreeText4 || "",
      PreliminarycheckFreeText5: row.PreliminarycheckFreeText5 || "",
      PreliminarycheckFreeText6: row.PreliminarycheckFreeText6 || "",

      AbdominalPreliminary2: row.AbdominalPreliminary2 || "",
      RaytecPreliminary2: row.RaytecPreliminary2 || "",
      ThroatPackPreliminary2: row.ThroatPackPreliminary2 || "",
      PreliminarycheckFreeText7: row.PreliminarycheckFreeText7 || "",
      PreliminarycheckFreeText8: row.PreliminarycheckFreeText8 || "",
      PreliminarycheckFreeText9: row.PreliminarycheckFreeText9 || "",

      AbdominalPreliminary3: row.AbdominalPreliminary3 || "",
      RaytecPreliminary3: row.RaytecPreliminary3 || "",
      ThroatPackPreliminary3: row.ThroatPackPreliminary3 || "",
      PreliminarycheckFreeText10: row.PreliminarycheckFreeText10 || "",
      PreliminarycheckFreeText11: row.PreliminarycheckFreeText11 || "",
      PreliminarycheckFreeText12: row.PreliminarycheckFreeText12 || "",

      // Wound Closure
      AbdominalWound: row.AbdominalWound || "",
      RaytecWound: row.RaytecWound || "",
      ThroatPackWound: row.ThroatPackWound || "",
      Woundclosure1: row.Woundclosure1 || "",
      Woundclosure2: row.Woundclosure2 || "",
      Woundclosure3: row.Woundclosure3 || "",

      AbdominalWound1: row.AbdominalWound1 || "",
      RaytecWound1: row.RaytecWound1 || "",
      ThroatPackWound1: row.ThroatPackWound1 || "",
      Woundclosure4: row.Woundclosure4 || "",
      Woundclosure5: row.Woundclosure5 || "",
      Woundclosure6: row.Woundclosure6 || "",

      AbdominalWound2: row.AbdominalWound2 || "",
      RaytecWound2: row.RaytecWound2 || "",
      ThroatPackWound2: row.ThroatPackWound2 || "",
      Woundclosure7: row.Woundclosure7 || "",
      Woundclosure8: row.Woundclosure8 || "",
      Woundclosure9: row.Woundclosure9 || "",

      AbdominalWound3: row.AbdominalWound3 || "",
      RaytecWound3: row.RaytecWound3 || "",
      ThroatPackWound3: row.ThroatPackWound3 || "",
      Woundclosure10: row.Woundclosure10 || "",
      Woundclosure11: row.Woundclosure11 || "",
      Woundclosure12: row.Woundclosure12 || "",

      // Final Count
      FinalAbdominal: row.FinalAbdominal || "",
      FinalRaytec: row.FinalRaytec || "",
      FinalThroat: row.FinalThroat || "",
      Finalcount1: row.Finalcount1 || "",
      Finalcount2: row.Finalcount2 || "",
      Finalcount3: row.Finalcount3 || "",

      // Skin Closure
      SkinClosure: row.SkinClosure || "",
      NonAbsorbable: row.NonAbsorbable || "",
      Absorbable: row.Absorbable || "",
      Infiltrations: row.Infiltrations || "",
      Dressing: row.Dressing || "",
      Packed: row.Packed || "",
      Whole: row.Whole || "",
      Others: row.Others || "",
      Infusion: row.Infusion || "",
      Loss: row.Loss || "",
      UOutput: row.UOutput || "",

      // Medication Set 0
      medicationdoss: row.medicationdoss || "",
      Route: row.Route || "",
      meicationTime: row.meicationTime || "",
      Signmedication: row.Signmedication || "",

      // Medication Set 1
      medicationdoss1: row.medicationdoss1 || "",
      Route1: row.Route1 || "",
      meicationTime1: row.meicationTime1 || "",
      Signmedication1: row.Signmedication1 || "",

      // Medication Set 2
      medicationdoss2: row.medicationdoss2 || "",
      Route2: row.Route2 || "",
      meicationTime2: row.meicationTime2 || "",
      Signmedication2: row.Signmedication2 || "",

      // Medication Set 3
      medicationdoss3: row.medicationdoss3 || "",
      Route3: row.Route3 || "",
      meicationTime3: row.meicationTime3 || "",
      Signmedication3: row.Signmedication3 || "",

      // Surgical Implements
      SurgicalImplant: row.SurgicalImplant || "",
      Lotno: row.Lotno || "",
      size: row.size || "",

      SurgicalImplant1: row.SurgicalImplant1 || "",
      Lotno1: row.Lotno1 || "",
      size1: row.size1 || "",

      SurgicalImplant2: row.SurgicalImplant2 || "",
      Lotno2: row.Lotno2 || "",
      size2: row.size2 || "",

      SurgicalImplant3: row.SurgicalImplant3 || "",
      Lotno3: row.Lotno3 || "",
      size3: row.size3 || "",

      SurgicalImplant4: row.SurgicalImplant4 || "",
      Lotno4: row.Lotno4 || "",
      size4: row.size4 || "",

      // Specimen
      type: row.type || "",
      histology: row.histology || "",
      Crytology: row.Crytology || "",
      Culture: row.Culture || "",
      NotAnalysis: row.NotAnalysis || "",
      Disposition: row.Disposition || "",

      type1: row.type1 || "",
      histology1: row.histology1 || "",
      Crytology1: row.Crytology1 || "",
      Culture1: row.Culture1 || "",
      NotAnalysis1: row.NotAnalysis1 || "",
      Disposition1: row.Disposition1 || "",

      type2: row.type2 || "",
      histology2: row.histology2 || "",
      Crytology2: row.Crytology2 || "",
      Culture2: row.Culture2 || "",
      NotAnalysis2: row.NotAnalysis2 || "",
      Disposition2: row.Disposition2 || "",

      type3: row.type3 || "",
      histology3: row.histology3 || "",
      Crytology3: row.Crytology3 || "",
      Culture3: row.Culture3 || "",
      NotAnalysis3: row.NotAnalysis3 || "",
      Disposition3: row.Disposition3 || "",

      // Additional Fields
      ReturnedThreatre: row.ReturnedThreatre || "",
      ReturnedThreatre1: row.ReturnedThreatre1 || "",
      ReturnedThreatre2: row.ReturnedThreatre2 || "",
      MaterialCharge: row.MaterialCharge || "",

      CountCorrect: row.CountCorrect || "",
      TakenAction: row.TakenAction || "",
    });
  };

  const handleTableData = (tableData) => {
    return tableData?.map((items, index) => {
      const { Transaction_ID, Patient_ID } = items;
      return {
        SNO: index + 1,
        Transaction_ID,
        Patient_ID,
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

  const handlePrint = async (row) => {};

  const handleSave = async () => {
    const savePayload = {
      centreID: payload.centreID,
      ID: payload.ID || 0,
      TID: TransactionID,
      PID: PatientID,

      // Preliminary Check
      AbdominalPreliminary: payload.AbdominalPreliminary,
      RaytecPreliminary: payload.RaytecPreliminary,
      ThroatPackPreliminary: payload.ThroatPackPreliminary,
      PreliminarycheckFreeText1: payload.PreliminarycheckFreeText1,
      PreliminarycheckFreeText2: payload.PreliminarycheckFreeText2,
      PreliminarycheckFreeText3: payload.PreliminarycheckFreeText3,

      AbdominalPreliminary1: payload.AbdominalPreliminary1,
      RaytecPreliminary1: payload.RaytecPreliminary1,
      ThroatPackPreliminary1: payload.ThroatPackPreliminary1,
      PreliminarycheckFreeText4: payload.PreliminarycheckFreeText4,
      PreliminarycheckFreeText5: payload.PreliminarycheckFreeText5,
      PreliminarycheckFreeText6: payload.PreliminarycheckFreeText6,

      AbdominalPreliminary2: payload.AbdominalPreliminary2,
      RaytecPreliminary2: payload.RaytecPreliminary2,
      ThroatPackPreliminary2: payload.ThroatPackPreliminary2,
      PreliminarycheckFreeText7: payload.PreliminarycheckFreeText7,
      PreliminarycheckFreeText8: payload.PreliminarycheckFreeText8,
      PreliminarycheckFreeText9: payload.PreliminarycheckFreeText9,

      AbdominalPreliminary3: payload.AbdominalPreliminary3,
      RaytecPreliminary3: payload.RaytecPreliminary3,
      ThroatPackPreliminary3: payload.ThroatPackPreliminary3,
      PreliminarycheckFreeText10: payload.PreliminarycheckFreeText10,
      PreliminarycheckFreeText11: payload.PreliminarycheckFreeText11,
      PreliminarycheckFreeText12: payload.PreliminarycheckFreeText12,

      // Wound Closure
      AbdominalWound: payload.AbdominalWound,
      RaytecWound: payload.RaytecWound,
      ThroatPackWound: payload.ThroatPackWound,
      Woundclosure1: payload.Woundclosure1,
      Woundclosure2: payload.Woundclosure2,
      Woundclosure3: payload.Woundclosure3,

      AbdominalWound1: payload.AbdominalWound1,
      RaytecWound1: payload.RaytecWound1,
      ThroatPackWound1: payload.ThroatPackWound1,
      Woundclosure4: payload.Woundclosure4,
      Woundclosure5: payload.Woundclosure5,
      Woundclosure6: payload.Woundclosure6,

      AbdominalWound2: payload.AbdominalWound2,
      RaytecWound2: payload.RaytecWound2,
      ThroatPackWound2: payload.ThroatPackWound2,
      Woundclosure7: payload.Woundclosure7,
      Woundclosure8: payload.Woundclosure8,
      Woundclosure9: payload.Woundclosure9,

      AbdominalWound3: payload.AbdominalWound3,
      RaytecWound3: payload.RaytecWound3,
      ThroatPackWound3: payload.ThroatPackWound3,
      Woundclosure10: payload.Woundclosure10,
      Woundclosure11: payload.Woundclosure11,
      Woundclosure12: payload.Woundclosure12,

      // Final Count
      FinalAbdominal: payload.FinalAbdominal,
      FinalRaytec: payload.FinalRaytec,
      FinalThroat: payload.FinalThroat,
      Finalcount1: payload.Finalcount1,
      Finalcount2: payload.Finalcount2,
      Finalcount3: payload.Finalcount3,

      // Skin Closure
      SkinClosure: payload.SkinClosure,
      NonAbsorbable: payload.NonAbsorbable,
      Absorbable: payload.Absorbable,
      Infiltrations: payload.Infiltrations,
      Dressing: payload.Dressing,
      Packed: payload.Packed,
      Whole: payload.Whole,
      Others: payload.Others,
      Infusion: payload.Infusion,
      Loss: payload.Loss,
      UOutput: payload.UOutput,

      // Medication
      medicationdoss: payload.medicationdoss,
      Route: payload.Route,
      meicationTime: payload.meicationTime,
      Signmedication: payload.Signmedication,

      medicationdoss1: payload.medicationdoss1,
      Route1: payload.Route1,
      meicationTime1: payload.meicationTime1,
      Signmedication1: payload.Signmedication1,

      medicationdoss2: payload.medicationdoss2,
      Route2: payload.Route2,
      meicationTime2: payload.meicationTime2,
      Signmedication2: payload.Signmedication2,

      medicationdoss3: payload.medicationdoss3,
      Route3: payload.Route3,
      meicationTime3: payload.meicationTime3,
      Signmedication3: payload.Signmedication3,

      // Surgical Implements
      SurgicalImplant: payload.SurgicalImplant,
      Lotno: payload.Lotno,
      size: payload.size,

      SurgicalImplant1: payload.SurgicalImplant1,
      Lotno1: payload.Lotno1,
      size1: payload.size1,

      SurgicalImplant2: payload.SurgicalImplant2,
      Lotno2: payload.Lotno2,
      size2: payload.size2,

      SurgicalImplant3: payload.SurgicalImplant3,
      Lotno3: payload.Lotno3,
      size3: payload.size3,

      SurgicalImplant4: payload.SurgicalImplant4,
      Lotno4: payload.Lotno4,
      size4: payload.size4,

      // Specimen
      type: payload.type,
      histology: payload.histology,
      Crytology: payload.Crytology,
      Culture: payload.Culture,
      NotAnalysis: payload.NotAnalysis,
      Disposition: payload.Disposition,

      type1: payload.type1,
      histology1: payload.histology1,
      Crytology1: payload.Crytology1,
      Culture1: payload.Culture1,
      NotAnalysis1: payload.NotAnalysis1,
      Disposition1: payload.Disposition1,

      type2: payload.type2,
      histology2: payload.histology2,
      Crytology2: payload.Crytology2,
      Culture2: payload.Culture2,
      NotAnalysis2: payload.NotAnalysis2,
      Disposition2: payload.Disposition2,

      type3: payload.type3,
      histology3: payload.histology3,
      Crytology3: payload.Crytology3,
      Culture3: payload.Culture3,
      NotAnalysis3: payload.NotAnalysis3,
      Disposition3: payload.Disposition3,

      // Additional Fields
      ReturnedThreatre: payload.ReturnedThreatre,
      ReturnedThreatre1: payload.ReturnedThreatre1,
      ReturnedThreatre2: payload.ReturnedThreatre2,
      MaterialCharge: payload.MaterialCharge,

      CountCorrect: payload.CountCorrect,
      TakenAction: payload.TakenAction,
    };

    console.log(savePayload);

    try {
      const response = await SaveSwabsInstrumentAndSharpsCountAPI(savePayload);
      if (response?.success) {
        notify(response?.message, "success");
        // setPayload(initialValue);

        handleGetData(TransactionID, PatientID);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    handleGetData(TransactionID, PatientID);
  }, []);

  const tbody = [
    {
      column1: (
        <table>
          <thead>
            <tr>
              <th>
                <strong>{t("Abdominal swabs")}</strong>
              </th>
              <th>
                <strong>{t("Abdominal swabs")}</strong>
              </th>
              <th>
                <strong>{t("Raytec swabs")}</strong>
              </th>
              <th>
                <strong>{t("Throat Packs")}</strong>
              </th>
              <th>
                <strong>-</strong>
              </th>
              <th>
                <strong>-</strong>
              </th>
              <th>
                <strong>-</strong>
              </th>
            </tr>
          </thead>

          <tbody>
            {/* ---------------- PRELIMINARY CHECK ROW 1 ---------------- */}
            <tr>
              <td>{t("Preliminary check")}</td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  name="AbdominalPreliminary"
                  id="AbdominalPreliminary"
                  value={payload.AbdominalPreliminary}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="RaytecPreliminary"
                  name="RaytecPreliminary"
                  value={payload.RaytecPreliminary}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="ThroatPackPreliminary"
                  name="ThroatPackPreliminary"
                  value={payload.ThroatPackPreliminary}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="PreliminarycheckFreeText1"
                  name="PreliminarycheckFreeText1"
                  value={payload.PreliminarycheckFreeText1}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="PreliminarycheckFreeText2"
                  name="PreliminarycheckFreeText2"
                  value={payload.PreliminarycheckFreeText2}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="PreliminarycheckFreeText3"
                  name="PreliminarycheckFreeText3"
                  value={payload.PreliminarycheckFreeText3}
                  onChange={handleChange}
                />
              </td>
            </tr>

            {/* ---------------- PRELIMINARY EMPTY ROW 2 ---------------- */}
            <tr>
              <td></td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="AbdominalPreliminary1"
                  name="AbdominalPreliminary1"
                  value={payload.AbdominalPreliminary1}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="RaytecPreliminary1"
                  name="RaytecPreliminary1"
                  value={payload.RaytecPreliminary1}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="ThroatPackPreliminary1"
                  name="ThroatPackPreliminary1"
                  value={payload.ThroatPackPreliminary1}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="PreliminarycheckFreeText4"
                  name="PreliminarycheckFreeText4"
                  value={payload.PreliminarycheckFreeText4}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="PreliminarycheckFreeText5"
                  name="PreliminarycheckFreeText5"
                  value={payload.PreliminarycheckFreeText5}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="PreliminarycheckFreeText6"
                  name="PreliminarycheckFreeText6"
                  value={payload.PreliminarycheckFreeText6}
                  onChange={handleChange}
                />
              </td>
            </tr>

            {/* ---------------- PRELIMINARY EMPTY ROW 3 ---------------- */}
            <tr>
              <td></td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="AbdominalPreliminary2"
                  name="AbdominalPreliminary2"
                  value={payload.AbdominalPreliminary2}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="RaytecPreliminary2"
                  name="RaytecPreliminary2"
                  value={payload.RaytecPreliminary2}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="ThroatPackPreliminary2"
                  name="ThroatPackPreliminary2"
                  value={payload.ThroatPackPreliminary2}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="PreliminarycheckFreeText7"
                  name="PreliminarycheckFreeText7"
                  value={payload.PreliminarycheckFreeText7}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="PreliminarycheckFreeText8"
                  name="PreliminarycheckFreeText8"
                  value={payload.PreliminarycheckFreeText8}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="PreliminarycheckFreeText9"
                  name="PreliminarycheckFreeText9"
                  value={payload.PreliminarycheckFreeText9}
                  onChange={handleChange}
                />
              </td>
            </tr>

            {/* ---------------- PRELIMINARY EMPTY ROW 4 ---------------- */}
            <tr>
              <td></td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="AbdominalPreliminary3"
                  name="AbdominalPreliminary3"
                  value={payload.AbdominalPreliminary3}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="RaytecPreliminary3"
                  name="RaytecPreliminary3"
                  value={payload.RaytecPreliminary3}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="ThroatPackPreliminary3"
                  name="ThroatPackPreliminary3"
                  value={payload.ThroatPackPreliminary3}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="PreliminarycheckFreeText10"
                  name="PreliminarycheckFreeText10"
                  value={payload.PreliminarycheckFreeText10}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="PreliminarycheckFreeText11"
                  name="PreliminarycheckFreeText11"
                  value={payload.PreliminarycheckFreeText11}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="PreliminarycheckFreeText12"
                  name="PreliminarycheckFreeText12"
                  value={payload.PreliminarycheckFreeText12}
                  onChange={handleChange}
                />
              </td>
            </tr>

            {/* ---------------- WOUND CLOSURE ---------------- */}
            <tr>
              <td>{t("Wound closure")}</td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="AbdominalWound"
                  name="AbdominalWound"
                  value={payload.AbdominalWound}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="RaytecWound"
                  name="RaytecWound"
                  value={payload.RaytecWound}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="ThroatPackWound"
                  name="ThroatPackWound"
                  value={payload.ThroatPackWound}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="Woundclosure1"
                  name="Woundclosure1"
                  value={payload.Woundclosure1}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="Woundclosure2"
                  name="Woundclosure2"
                  value={payload.Woundclosure2}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="Woundclosure3"
                  name="Woundclosure3"
                  value={payload.Woundclosure3}
                  onChange={handleChange}
                />
              </td>
            </tr>

            {/* ---------------- WOUND CLOSURE EMPTY ROW 2 ---------------- */}
            <tr>
              <td></td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="AbdominalWound1"
                  name="AbdominalWound1"
                  value={payload.AbdominalWound1}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="RaytecWound1"
                  name="RaytecWound1"
                  value={payload.RaytecWound1}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="ThroatPackWound1"
                  name="ThroatPackWound1"
                  value={payload.ThroatPackWound1}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="Woundclosure4"
                  name="Woundclosure4"
                  value={payload.Woundclosure4}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="Woundclosure5"
                  name="Woundclosure5"
                  value={payload.Woundclosure5}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="Woundclosure6"
                  name="Woundclosure6"
                  value={payload.Woundclosure6}
                  onChange={handleChange}
                />
              </td>
            </tr>

            {/* ---------------- WOUND CLOSURE EMPTY ROW 3 ---------------- */}
            <tr>
              <td></td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="AbdominalWound2"
                  name="AbdominalWound2"
                  value={payload.AbdominalWound2}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="RaytecWound2"
                  name="RaytecWound2"
                  value={payload.RaytecWound2}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="ThroatPackWound2"
                  name="ThroatPackWound2"
                  value={payload.ThroatPackWound2}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="Woundclosure7"
                  name="Woundclosure7"
                  value={payload.Woundclosure7}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="Woundclosure8"
                  name="Woundclosure8"
                  value={payload.Woundclosure8}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="Woundclosure9"
                  name="Woundclosure9"
                  value={payload.Woundclosure9}
                  onChange={handleChange}
                />
              </td>
            </tr>

            {/* ---------------- WOUND CLOSURE EMPTY ROW 4 ---------------- */}
            <tr>
              <td></td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="AbdominalWound3"
                  name="AbdominalWound3"
                  value={payload.AbdominalWound3}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="RaytecWound3"
                  name="RaytecWound3"
                  value={payload.RaytecWound3}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="ThroatPackWound3"
                  name="ThroatPackWound3"
                  value={payload.ThroatPackWound3}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="Woundclosure10"
                  name="Woundclosure10"
                  value={payload.Woundclosure10}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="Woundclosure11"
                  name="Woundclosure11"
                  value={payload.Woundclosure11}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="Woundclosure12"
                  name="Woundclosure12"
                  value={payload.Woundclosure12}
                  onChange={handleChange}
                />
              </td>
            </tr>

            {/* ---------------- FINAL COUNT ---------------- */}
            <tr>
              <td>{t("Final count")}</td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="FinalAbdominal"
                  name="FinalAbdominal"
                  value={payload.FinalAbdominal}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  id="FinalRaytec"
                  name="FinalRaytec"
                  value={payload.FinalRaytec}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  name="FinalThroat"
                  value={payload.FinalThroat}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  name="Finalcount1"
                  value={payload.Finalcount1}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  name="Finalcount2"
                  value={payload.Finalcount2}
                  onChange={handleChange}
                />
              </td>

              <td>
                <Input
                  type="text"
                  className="form-control"
                  name="Finalcount3"
                  value={payload.Finalcount3}
                  onChange={handleChange}
                />
              </td>
            </tr>
          </tbody>
        </table>
      ),
    },
  ];

  const thead = ["Swab Count Table"];

  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card mt-2">
          <div className="p-2 row">
            <div className="col-12">
              <Tables thead={[]} tbody={tbody} />
            </div>
          </div>
          <div className="row">
            <div className="col-xl-6 col-lg-6 col-md-12">
              <div className="patient_registration card mt-2">
                <Heading title={t("WOUND CLOSURE")} isBreadcrumb={false} />
                <div className="p-2 row">
                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="SkinClosure"
                    name="SkinClosure"
                    value={payload?.SkinClosure}
                    onChange={handleChange}
                    lable={t("Skin Closure")}
                    respclass="col-xl-4 col-md-6 col-sm-6 col-12"
                  />

                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="NonAbsorbable"
                    name="NonAbsorbable"
                    value={payload?.NonAbsorbable}
                    onChange={handleChange}
                    lable={t("Non Absorbable")}
                    respclass="col-xl-4 col-md-6 col-sm-6 col-12"
                  />

                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="Absorbable"
                    name="Absorbable"
                    value={payload?.Absorbable}
                    onChange={handleChange}
                    lable={t("Absorbable")}
                    respclass="col-xl-4 col-md-6 col-sm-6 col-12"
                  />

                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="Infiltrations"
                    name="Infiltrations"
                    value={payload?.Infiltrations}
                    onChange={handleChange}
                    lable={t("Wound Infiltrations")}
                    respclass="col-xl-4 col-md-6 col-sm-6 col-12"
                  />

                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="Dressing"
                    name="Dressing"
                    value={payload?.Dressing}
                    onChange={handleChange}
                    lable={t("Dressing Applied")}
                    respclass="col-xl-4 col-md-6 col-sm-6 col-12"
                  />
                </div>
                <div className="patient_registration card mt-2">
                  <Heading title={t("MEDICATION")} isBreadcrumb={false} />
                  <div className="p-2 row">
                    <DynamicInputTable
                      headers={[t("Medication/Doss"), t("route"), t("Time"), t("Sign")]}
                      rows={4}
                      columns={[
                        { base: "medicationdoss" },
                        { base: "Route" },
                        { base: "meicationTime", type: "time" },
                        { base: "Signmedication" },
                      ]}
                      payload={payload}
                      handleChange={handleChange}
                      handleDateTimeChange={handleDateTimeChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-6 col-lg-6 col-md-12">
              <div className="patient_registration card mt-2">
                <Heading
                  title={t(
                    "INTRAVENOUS INFUSION/TRANSFUSION BLOOD TRANSFUSION"
                  )}
                  isBreadcrumb={false}
                />

                <div className="p-2 row">
                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="Packed"
                    name="Packed"
                    value={payload?.Packed}
                    onChange={handleChange}
                    lable={t("Packed Cells(m/s)")}
                    respclass="col-xl-4 col-md-6 col-sm-6 col-12"
                  />

                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="Whole"
                    name="Whole"
                    value={payload?.Whole}
                    onChange={handleChange}
                    lable={t("Whole(m/s)")}
                    respclass="col-xl-4 col-md-6 col-sm-6 col-12"
                  />

                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="Others"
                    name="Others"
                    value={payload?.Others}
                    onChange={handleChange}
                    lable={t("Others(m/s)")}
                    respclass="col-xl-4 col-md-6 col-sm-6 col-12"
                  />

                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="Infusion"
                    name="Infusion"
                    value={payload?.Infusion}
                    onChange={handleChange}
                    lable={t("Intravenous Infusion(m/s)")}
                    respclass="col-xl-4 col-md-6 col-sm-6 col-12"
                  />

                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="Loss"
                    name="Loss"
                    value={payload?.Loss}
                    onChange={handleChange}
                    lable={t("Estimated Blood Loss(m/s)")}
                    respclass="col-xl-4 col-md-6 col-sm-6 col-12"
                  />

                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="UOutput"
                    name="UOutput"
                    value={payload?.UOutput}
                    onChange={handleChange}
                    lable={t("Urinary Output IntraOperative(m/s)")}
                    respclass="col-xl-4 col-md-6 col-sm-6 col-12"
                  />
                </div>

                <div className="p-2 row">
                  <DynamicInputTable
                    headers={[
                      t("Surgical Implants/Sprosthesis"),
                      t("Lot No."),
                      t("Size"),
                    ]}
                    rows={3}
                    columns={[
                      { base: "SurgicalImplant" },
                      { base: "Lotno" },
                      { base: "size" },
                    ]}
                    payload={payload}
                    handleChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="col-xl-6 col-lg-6 col-md-12">
              <div className="patient_registration card mt-2">
                <Heading title={t("Specimens")} isBreadcrumb={false} />
                <DynamicInputTable
                  headers={[
                    t("Type"),
                    t("Histology"),
                    t("Cytology"),
                    t("Culture"),
                    t("Not For Analysis"),
                    t("Disposition"),
                  ]}
                  rows={4}
                  columns={[
                    { base: "type" },
                    { base: "histology" },
                    { base: "Crytology" },
                    { base: "Culture" },
                    { base: "NotAnalysis" },
                    { base: "Disposition" },
                  ]}
                  payload={payload}
                  handleChange={handleChange}
                />
              </div>
            </div>{" "}
            <div className="col-xl-6 col-lg-6 col-md-12">
              <div className="row">
                <div
                  className="pt-3 pb-2 pr-2 pl-2 form-group"
                  style={{
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    position: "relative",
                  }}
                >
                  <label className="label" style={{ position: "absolute" }}>
                    {t("Items To BR Returned Theatre")}
                  </label>
                  <div className="row">
                    <Input
                      type="text"
                      className="form-control"
                      placeholder={t("items")}
                      id="ReturnedThreatre"
                      name="ReturnedThreatre"
                      value={payload?.ReturnedThreatre}
                      onChange={handleChange}
                      respclass="col-sm-4 col-12"
                    />
                    <Input
                      type="text"
                      className="form-control"
                      placeholder={t("items")}
                      id="ReturnedThreatre1"
                      name="ReturnedThreatre1"
                      value={payload?.ReturnedThreatre1}
                      onChange={handleChange}
                      respclass="col-sm-4 col-12"
                    />
                    <Input
                      type="text"
                      className="form-control"
                      placeholder={t("items")}
                      id="ReturnedThreatre2"
                      name="ReturnedThreatre2"
                      value={payload?.ReturnedThreatre2}
                      onChange={handleChange}
                      respclass="col-sm-4 col-12"
                    />
                    <Input
                      type="text"
                      className="form-control"
                      placeholder=""
                      id="MaterialCharge"
                      name="MaterialCharge"
                      value={payload?.MaterialCharge}
                      onChange={handleChange}
                      lable={t("Anaesthetic Materials Charge Theatre Fee")}
                      respclass="col-sm-4 col-12"
                    />

                    <div className="form-check ml-3">
                      <input
                        className="form-check-input table-checkbox"
                        type="checkbox"
                        style={{ marginLeft: "-12px" }}
                        name="CountCorrect"
                        checked={payload?.CountCorrect === 1}
                        onChange={handleChange}
                      />
                      <span className="form-check-label ml-2" htmlFor={`cao`}>
                        {t("Coarrugated")}
                      </span>
                    </div>
                    <Input
                      type="text"
                      className="form-control"
                      placeholder=""
                      id="TakenAction"
                      name="TakenAction"
                      value={payload?.TakenAction}
                      onChange={handleChange}
                      respclass="col-sm-4 col-12"
                      lable={"TakenAction"}
                      disabled={payload?.CountCorrect === 1}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-2">
            {payload?.ID ? (
              <>
                <button className="btn btn-sm btn-primary" onClick={handleSave}>
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
              <button className="btn btn-sm btn-primary" onClick={handleSave}>
                {t("Save")}
              </button>
            )}
          </div>
        </div>
      </div>
      <Heading
        title={t("Swabs Instrument And Sharp Count List ")}
        isBreadcrumb={false}
      />
      <div className="col-12">
        <Tables thead={THEAD} tbody={handleTableData(tableData)} />
      </div>
    </>
  );
};

export default SwabsInstrumentAndSharpsCount;
