import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../UI/Heading";
import TextAreaInput from "../formComponent/TextAreaInput";
import TimePicker from "../formComponent/TimePicker";
import ReactSelect from "../formComponent/ReactSelect";
import DatePicker from "../formComponent/DatePicker";
import Input from "../formComponent/Input";
import {
  BindBloodGroupAPI,
  getCardiopulmonaryBloodGasAPI,
  GetCardiopulmonaryDetailsAPI,
  SaveCardiopulmonaryBypassAPI,
  UpdateCardiopulmonaryBypassAPI,
} from "../../networkServices/OT/otAPI";
import { notify } from "../../utils/ustil2";
import Tables from "../UI/customTable";

const CardiopulmonaryBypass = ({ data }) => {
  const PatientID = data?.PatientID || data?.patientID;
  const TransactionID = data?.TransactionID || data?.transactionID;
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();

  const initialValues = {
    BloodGas: [
      {
        Cardio_Bypass_Id: "",
        PatientId: "",
        TransactionId: "",
        Time: new Date(),
        Temp: "",
        Flo2Flow: "",
        PH: "",
        Po2: "",
        Pco2: "",
        Spo2: "",
        HCO3: "",
        Hct: "",
        Hb: "",
        Na: "",
        K: "",
        Glu: "",
        CaPlus: "",
      },
    ],
    SaveCardiopulmonaryBypass: [
      {
        ID: "",
        BloodGasID: "",
        PID: "",
        TID: "",
        BloodGroup: "",
        CaseNo: "",
        Ht: "",
        Wt: "",
        BSA: "",
        DX: "",
        Procedure: "",
        PreHB: "",
        Hartmanns: "",
        Solumedrol: "",
        AssistSurgeon: "",
        Mannitol: "",
        Surgeon: "",
        Voluven: "",
        CaCL: "",
        Anaesthetist: "",
        DOSE: "",
        Blood: "",
        Heparin: "",
        Perfusionist: "",
        Time: new Date(),
        Meds: "",
        Albumin: "",
        Oxygenator: "",
        ACT: "",
        Total: "",
        Tranexamic: "",
        CustomPack: "",
        CoolTemp: "",
        NaHCO2: "",
        TotalByPass: "",
        Hemoconcentrator: "",
        Alarm_On: "",
        ChecklistCompleted: "",
        Cardioplegia: "",
        Time1: new Date(),
        HeparinPt: "",
        mgkg: "",
        ArterialCannula: "",
        XClamp: "",
        TotalProtamine: "",
        VenousCannula: "",
        PerfusionTime: new Date(),
        Cardioplegiainital: "",
        cckg: "",
        mgkg1: "",
        CardioplegiaCannula: "",
        CirculatoryArrest: "",
        Dosesubsequent: "",
        ccperkg: "",
        LVVent: "",
        UrinebyPass: "",
        postBypass: "",
        CUF: "",

        lmin1_0: "",
        lmin1_2: "",
        lmin1_4: "",
        lmin1_6: "",
        lmin1_8: "",
        lmin2_0: "",
        lmin2_2: "",
        lmin2_4: "",
        lmin2_6: "",
        lmin2_8: "",
        lmin3_0: "",
        lmin3_2: "",

        ImperialDeatils: "",
        Comments: "",
        PERFUNIST: "",
        CreatedBy: "",
      },
    ],
  };

  const [payload, setPayload] = useState(initialValues);
  const [tableData, setTableData] = useState([]);
  const [bloodGroup, setBloodGroup] = useState([]);
  const normalizeDate = (d) => (d ? new Date(d).toISOString() : "");
  const save_Payload = {
    bloodGasDTO: payload?.BloodGas?.map((row) => ({
      Cardio_Bypass_Id: row.Cardio_Bypass_Id || 0,
      PatientId: PatientID,
      TransactionId: TransactionID,
      Time: row.Time,
      Temp: row.Temp,
      Flo2Flow: row.Flo2Flow,
      PH: row.PH,
      Po2: row.Po2,
      Pco2: row.Pco2,
      Spo2: row.Spo2,
      HCO3: row.HCO3,
      Hct: row.Hct,
      Hb: row.Hb,
      Na: row.Na,
      K: row.K,
      Glu: row.Glu,
      CaPlus: row.CaPlus,
    })),
    saveCardiopulmonaryBypassDTOs: payload?.SaveCardiopulmonaryBypass?.map(
      (row) => ({
        ID: row.ID || 0,
        BloodGasID: row.BloodGasID || 0,
        PID: PatientID,
        TID: TransactionID,
        BloodGroup: row.BloodGroup || "",
        CaseNo: row.CaseNo ?? "",
        Ht: row.Ht ?? "",
        Wt: row.Wt ?? "",
        BSA: row.BSA ?? "",
        DX: row.DX ?? "",
        Procedure: row.Procedure ?? "",
        PreHB: row.PreHB ?? "",
        Hartmanns: row.Hartmanns ?? "",
        Solumedrol: row.Solumedrol ?? "",
        AssistSurgeon: row.AssistSurgeon ?? "",
        Mannitol: row.Mannitol ?? "",
        Surgeon: row.Surgeon ?? "",
        Voluven: row.Voluven ?? "",
        CaCL: row.CaCL ?? "",
        Anaesthetist: row.Anaesthetist ?? "",
        DOSE: row.DOSE ?? "",
        Blood: row.Blood ?? "",
        Heparin: row.Heparin ?? "",
        Perfusionist: row.Perfusionist ?? "",
        Time: row.Time ?? "",
        Meds: row.Meds ?? "",
        Albumin: row.Albumin ?? "",
        Oxygenator: row.Oxygenator ?? "",
        ACT: row.ACT ?? "",
        Total: row.Total ?? "",
        Tranexamic: row.Tranexamic ?? "",
        CustomPack: row.CustomPack ?? "",
        CoolTemp: row.CoolTemp ?? "",
        NaHCO2: row.NaHCO2 ?? "",
        TotalByPass: row.TotalByPass ?? "",
        Hemoconcentrator: row.Hemoconcentrator ?? "",
        Alarm_On: row.Alarm_On ?? "",
        ChecklistCompleted: row.ChecklistCompleted ?? "",
        Cardioplegia: row.Cardioplegia ?? "",
        Time1: row.Time1 ?? "",
        HeparinPt: row.HeparinPt ?? "",
        mgkg: row.mgkg ?? "",
        ArterialCannula: row.ArterialCannula ?? "",
        XClamp: row.XClamp ?? "",
        TotalProtamine: row.TotalProtamine ?? "",
        VenousCannula: row.VenousCannula ?? "",
        PerfusionTime: row.PerfusionTime ?? "",
        Cardioplegiainital: row.Cardioplegiainital ?? "",
        cckg: row.cckg ?? "",
        mgkg1: row.mgkg1 ?? "",
        CardioplegiaCannula: row.CardioplegiaCannula ?? "",
        CirculatoryArrest: row.CirculatoryArrest ?? "",
        Dosesubsequent: row.Dosesubsequent ?? "",
        ccperkg: row.ccperkg ?? "",
        LVVent: row.LVVent ?? "",
        UrinebyPass: row.UrinebyPass ?? "",
        postBypass: row.postBypass ?? "",
        CUF: row.CUF ?? "",

        lmin1_0: row.lmin1_0 ?? "",
        lmin1_2: row.lmin1_2 ?? "",
        lmin1_4: row.lmin1_4 ?? "",
        lmin1_6: row.lmin1_6 ?? "",
        lmin1_8: row.lmin1_8 ?? "",
        lmin2_0: row.lmin2_0 ?? "",
        lmin2_2: row.lmin2_2 ?? "",
        lmin2_4: row.lmin2_4 ?? "",
        lmin2_6: row.lmin2_6 ?? "",
        lmin2_8: row.lmin2_8 ?? "",
        lmin3_0: row.lmin3_0 ?? "",
        lmin3_2: row.lmin3_2 ?? "",

        ImperialDeatils: row.ImperialDeatils ?? "",
        Comments: row.Comments ?? "",
        PERFUNIST: row.PERFUNIST ?? "",
      }),
    ),

    // saveCardiopulmonaryBypassDTOs: [
    //   {
    //     ID: payload.SaveCardiopulmonaryBypass.ID || 0,
    //     BloodGasID: payload.SaveCardiopulmonaryBypass.BloodGasID || 0,
    //     PID: PatientID,
    //     TID: TransactionID,
    //     BloodGroup: payload.SaveCardiopulmonaryBypass.BloodGroup || "",
    //     CaseNo: payload.SaveCardiopulmonaryBypass.CaseNo ?? "",
    //     Ht: payload.SaveCardiopulmonaryBypass.Ht ?? "",
    //     Wt: payload.SaveCardiopulmonaryBypass.Wt ?? "",
    //     BSA: payload.SaveCardiopulmonaryBypass.BSA ?? "",
    //     DX: payload.SaveCardiopulmonaryBypass.DX ?? "",
    //     Procedure: payload.SaveCardiopulmonaryBypass.Procedure ?? "",
    //     PreHB: payload.SaveCardiopulmonaryBypass.PreHB ?? "",
    //     Hartmanns: payload.SaveCardiopulmonaryBypass.Hartmanns ?? "",
    //     Solumedrol: payload.SaveCardiopulmonaryBypass.Solumedrol ?? "",
    //     AssistSurgeon: payload.SaveCardiopulmonaryBypass.AssistSurgeon ?? "",
    //     Mannitol: payload.SaveCardiopulmonaryBypass.Mannitol ?? "",
    //     Surgeon: payload.SaveCardiopulmonaryBypass.Surgeon ?? "",
    //     Voluven: payload.SaveCardiopulmonaryBypass.Voluven ?? "",
    //     CaCL: payload.SaveCardiopulmonaryBypass.CaCL ?? "",
    //     Anaesthetist: payload.SaveCardiopulmonaryBypass.Anaesthetist ?? "",
    //     DOSE: payload.SaveCardiopulmonaryBypass.DOSE ?? "",
    //     Blood: payload.SaveCardiopulmonaryBypass.Blood ?? "",
    //     Heparin: payload.SaveCardiopulmonaryBypass.Heparin ?? "",
    //     Perfusionist: payload.SaveCardiopulmonaryBypass.Perfusionist ?? "",
    //     Time: payload.SaveCardiopulmonaryBypass.Time ?? "",
    //     Meds: payload.SaveCardiopulmonaryBypass.Meds ?? "",
    //     Albumin: payload.SaveCardiopulmonaryBypass.Albumin ?? "",
    //     Oxygenator: payload.SaveCardiopulmonaryBypass.Oxygenator ?? "",
    //     ACT: payload.SaveCardiopulmonaryBypass.ACT ?? "",
    //     Total: payload.SaveCardiopulmonaryBypass.Total ?? "",
    //     Tranexamic: payload.SaveCardiopulmonaryBypass.Tranexamic ?? "",
    //     CustomPack: payload.SaveCardiopulmonaryBypass.CustomPack ?? "",
    //     CoolTemp: payload.SaveCardiopulmonaryBypass.CoolTemp ?? "",
    //     NaHCO2: payload.SaveCardiopulmonaryBypass.NaHCO2 ?? "",
    //     TotalByPass: payload.SaveCardiopulmonaryBypass.TotalByPass ?? "",
    //     Hemoconcentrator: payload.SaveCardiopulmonaryBypass.Hemoconcentrator ?? "",
    //     Alarm_On: payload.SaveCardiopulmonaryBypass.Alarm_On ?? "",
    //     ChecklistCompleted:
    //       payload.SaveCardiopulmonaryBypass.ChecklistCompleted ?? "",
    //     Cardioplegia: payload.SaveCardiopulmonaryBypass.Cardioplegia ?? "",
    //     Time1: payload.SaveCardiopulmonaryBypass.Time1 ?? "",
    //     HeparinPt: payload.SaveCardiopulmonaryBypass.HeparinPt ?? "",
    //     mgkg: payload.SaveCardiopulmonaryBypass.mgkg ?? "",
    //     ArterialCannula: payload.SaveCardiopulmonaryBypass.ArterialCannula ?? "",
    //     XClamp: payload.SaveCardiopulmonaryBypass.XClamp ?? "",
    //     TotalProtamine: payload.SaveCardiopulmonaryBypass.TotalProtamine ?? "",
    //     VenousCannula: payload.SaveCardiopulmonaryBypass.VenousCannula ?? "",
    //     PerfusionTime: payload.SaveCardiopulmonaryBypass.PerfusionTime ?? "",
    //     Cardioplegiainital:
    //       payload.SaveCardiopulmonaryBypass.Cardioplegiainital ?? "",
    //     cckg: payload.SaveCardiopulmonaryBypass.cckg ?? "",
    //     mgkg1: payload.SaveCardiopulmonaryBypass.mgkg1 ?? "",
    //     CardioplegiaCannula:
    //       payload.SaveCardiopulmonaryBypass.CardioplegiaCannula ?? "",
    //     CirculatoryArrest: payload.SaveCardiopulmonaryBypass.CirculatoryArrest ?? "",
    //     Dosesubsequent: payload.SaveCardiopulmonaryBypass.Dosesubsequent ?? "",
    //     ccperkg: payload.SaveCardiopulmonaryBypass.ccperkg ?? "",
    //     LVVent: payload.SaveCardiopulmonaryBypass.LVVent ?? "",
    //     UrinebyPass: payload.SaveCardiopulmonaryBypass.UrinebyPass ?? "",
    //     postBypass: payload.SaveCardiopulmonaryBypass.postBypass ?? "",
    //     CUF: payload.SaveCardiopulmonaryBypass.CUF ?? "",

    //     lmin1_0: payload.SaveCardiopulmonaryBypass.lmin1_0 ?? "",
    //     lmin1_2: payload.SaveCardiopulmonaryBypass.lmin1_2 ?? "",
    //     lmin1_4: payload.SaveCardiopulmonaryBypass.lmin1_4 ?? "",
    //     lmin1_6: payload.SaveCardiopulmonaryBypass.lmin1_6 ?? "",
    //     lmin1_8: payload.SaveCardiopulmonaryBypass.lmin1_8 ?? "",
    //     lmin2_0: payload.SaveCardiopulmonaryBypass.lmin2_0 ?? "",
    //     lmin2_2: payload.SaveCardiopulmonaryBypass.lmin2_2 ?? "",
    //     lmin2_4: payload.SaveCardiopulmonaryBypass.lmin2_4 ?? "",
    //     lmin2_6: payload.SaveCardiopulmonaryBypass.lmin2_6 ?? "",
    //     lmin2_8: payload.SaveCardiopulmonaryBypass.lmin2_8 ?? "",
    //     lmin3_0: payload.SaveCardiopulmonaryBypass.lmin3_0 ?? "",
    //     lmin3_2: payload.SaveCardiopulmonaryBypass.lmin3_2 ?? "",

    //     ImperialDeatils: payload.SaveCardiopulmonaryBypass.ImperialDeatils ?? "",
    //     Comments: payload.SaveCardiopulmonaryBypass.Comments ?? "",
    //     PERFUNIST: payload.SaveCardiopulmonaryBypass.PERFUNIST ?? "",
    //   },
    // ],
  };

  const block2Config = [
    {
      component: "ReactSelect",
      id: "BloodGroup",
      name: "BloodGroup",
      label: t("Blood Group"),
      respclass: "col-sm-2 col-12",
      options: bloodGroup,
    },
    {
      component: "Input",
      id: "CaseNo",
      name: "CaseNo",
      label: t("Case No"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Ht",
      name: "Ht",
      label: t("Ht(cms)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Wt",
      name: "Wt",
      label: t("Wt(kgs)"),
      respclass: "col-sm-2 col-12",
    },

    {
      component: "Input",
      id: "BSA",
      name: "BSA",
      label: t("BSA(m²)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "DX",
      name: "DX",
      label: t("DX"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Procedure",
      name: "Procedure",
      label: t("Procedure"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "PreHB",
      name: "PreHB",
      label: t("Pre op HB"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Hartmanns",
      name: "Hartmanns",
      label: t("Hartmanns"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Solumedrol",
      name: "Solumedrol",
      label: t("Solumedrol"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "AssistSurgeon",
      name: "AssistSurgeon",
      label: t("Assist Surgeon"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Mannitol",
      name: "Mannitol",
      label: t("Mannitol"),
      respclass: "col-sm-2 col-12",
    },

    {
      component: "Input",
      id: "Surgeon",
      name: "Surgeon",
      label: t("Surgeon"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Voluven",
      name: "Voluven",
      label: t("Voluven(ml)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "CaCL",
      name: "CaCL",
      label: t("CaCL(ml)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Anaesthetist",
      name: "Anaesthetist",
      label: t("Anaesthetist"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "DOSE",
      name: "DOSE",
      label: t("DOSE(mg)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Blood",
      name: "Blood",
      label: t("Blood(ml)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Heparin",
      name: "Heparin",
      label: t("Heparin(mg)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Perfusionist",
      name: "Perfusionist",
      label: t("Perfusionist"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "TimePicker",
      id: "Time",
      name: "Time",
      label: t("Time"),
      respclass: "col-sm-2 col-12",
    },

    {
      component: "Input",
      id: "Meds",
      name: "Meds",
      label: t("Meds(ml)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Albumin",
      name: "Albumin",
      label: t("Albumin(ml)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Oxygenator",
      name: "Oxygenator",
      label: t("Oxygenator"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "ACT",
      name: "ACT",
      label: t("ACT(sec)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Total",
      name: "Total",
      label: t("Total(ml)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Tranexamic",
      name: "Tranexamic",
      label: t("Tranexamic(mg)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "CustomPack",
      name: "CustomPack",
      label: t("Custom Pack"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "CoolTemp",
      name: "CoolTemp",
      label: t("CoolTemp(0C)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "NaHCO2",
      name: "NaHCO2",
      label: t("NaHCO2(ml)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "TotalByPass",
      name: "TotalByPass",
      label: t("TotalByPass(ml)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Hemoconcentrator",
      name: "Hemoconcentrator",
      label: t("Hemoconcentrator"),
      respclass: "col-sm-2 col-12",
    },

    {
      component: "Input",
      id: "Alarm_On",
      name: "Alarm_On",
      label: t("Alarm On"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "ChecklistCompleted",
      name: "ChecklistCompleted",
      label: t("Check list Completed"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Cardioplegia",
      name: "Cardioplegia",
      label: t("Cardioplegia delivery set"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "TimePicker",
      id: "Time1",
      name: "Time1",
      label: t("Time"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "HeparinPt",
      name: "HeparinPt",
      label: t("Heparin Pt"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "mgkg",
      name: "mgkg",
      label: t("mg/kg"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "ArterialCannula",
      name: "ArterialCannula",
      label: t("Arterial Cannula size(fr)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "XClamp",
      name: "XClamp",
      label: t("XClamp(min)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "TotalProtamine",
      name: "TotalProtamine",
      label: t("Total Protamine(mg)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "mgkg1",
      name: "mgkg1",
      label: t("mg"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "VenousCannula",
      name: "VenousCannula",
      label: t("Venous Cannula(fr)"),
      respclass: "col-sm-2 col-12",
    },
    // {
    //   component: "TimePicker",
    //   id: "Time1",
    //   name: "Time1",
    //   label: "Time",
    //   respclass: "col-sm-2 col-12",
    // },
    {
      component: "TimePicker",
      id: "PerfusionTime",
      name: "PerfusionTime",
      label: t("Perfusion Time"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Cardioplegiainital",
      name: "Cardioplegiainital",
      label: t("Cardioplegiainital"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "cckg",
      name: "cckg",
      label: t("cc/kg(ml)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "CardioplegiaCannula",
      name: "CardioplegiaCannula",
      label: t("Cardioplegia Cannula size(fr)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "CirculatoryArrest",
      name: "CirculatoryArrest",
      label: t("Circulatory Arrest(min)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "Dosesubsequent",
      name: "Dosesubsequent",
      label: t("Dose Subsequent"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "ccperkg",
      name: "ccperkg",
      label: t("cc/kg(ml)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "LVVent",
      name: "LVVent",
      label: t("LVVent(fr)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "UrinebyPass",
      name: "UrinebyPass",
      label: t("Urine by Pass(ml)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "postBypass",
      name: "postBypass",
      label: t("post Bypass"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "CUF",
      name: "CUF",
      label: t("CUF(ml)"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "PERFUNIST",
      name: "PERFUNIST",
      label: t("Perfunist"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "TextArea",
      id: "ImperialDeatils",
      name: "ImperialDeatils",
      label: t("Imperial Deatils"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "TextArea",
      id: "Comments",
      name: "Comments",
      label: t("Comments"),
      respclass: "col-sm-2 col-12",
    },
  ];

  // const handleChange = (e) => {
  //   const { name, type, checked, value } = e.target;

  //   setPayload((prev) => ({
  //     ...prev,
  //     SaveCardiopulmonaryBypass: {
  //       ...prev.records,
  //       [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
  //     },
  //   }));
  // };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;

    setPayload((prev) => ({
      ...prev,
      SaveCardiopulmonaryBypass: prev.SaveCardiopulmonaryBypass?.map(
        (row, index) =>
          index === 0
            ? {
                ...row,
                [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
              }
            : row,
      ),
    }));
  };
  console.log(payload);

  const handleSelectChange = (name, value) => {
    setPayload((prev) => ({
      ...prev,
      SaveCardiopulmonaryBypass: prev.SaveCardiopulmonaryBypass.map(
        (row, index) =>
          index === 0
            ? {
                ...row,
                [name]: value?.value || "",
              }
            : row,
      ),
    }));
  };
  // const handleSelectChange = (name, value) => {
  //   debugger
  //   setPayload((prev) => ({
  //     ...prev,
  //     SaveCardiopulmonaryBypass: {
  //       ...prev.SaveCardiopulmonaryBypass,
  //       [name]: value?.value || "",
  //     },
  //   }));
  // };

  const handleDateTimeChange = (e, name) => {
    const selectedDate = e.value;

    setPayload((prev) => ({
      ...prev,
      SaveCardiopulmonaryBypass: prev.SaveCardiopulmonaryBypass.map(
        (row, index) =>
          index === 0
            ? {
                ...row,
                [name]: selectedDate,
              }
            : row,
      ),
    }));
  };
  // const handleDateTimeChange = (e, name) => {
  //   const selectedDate = e.value;
  //   setPayload((prev) => ({
  //     ...prev,
  //     SaveCardiopulmonaryBypass: {
  //       ...prev.SaveCardiopulmonaryBypass,
  //       [name]: selectedDate,
  //     },
  //   }));
  // };

  const renderField = (field) => {
    debugger;
    const commonProps = {
      id: field.id,
      name: field.name,
      lable: t(field.label),
      respclass: field.respclass,
      // value: payload.SaveCardiopulmonaryBypass[field.name],
      value: payload?.SaveCardiopulmonaryBypass?.[0]?.[field.name] || "",
    };

    switch (field.component) {
      case "Input":
        return (
          <Input
            {...commonProps}
            type="text"
            className="form-control"
            onChange={handleChange}
            placeholder={""}
          />
        );

      case "DatePicker":
        return (
          <DatePicker
            {...commonProps}
            handleChange={handleChange}
            {...field.extra}
          />
        );

      case "ReactSelect":
        return (
          <ReactSelect
            {...commonProps}
            placeholderName={t(field.label)}
            dynamicOptions={field.options}
            handleChange={handleSelectChange}
          />
        );

      case "TimePicker":
        return (
          <TimePicker
            {...commonProps}
            placeholderName={t("Time")}
            handleChange={(e) => handleDateTimeChange(e, field.name)}
          />
        );

      case "TextArea":
        return (
          <TextAreaInput
            {...commonProps}
            className="w-100"
            placeholder=""
            rows={field.rows || 2}
            onChange={handleChange}
            maxLength={field.maxLength || 1000}
          />
        );

      default:
        return null;
    }
  };

  const T1_HEAD = [
    t("L/min/m²"),
    "1.0",
    "1.2",
    "1.4",
    "1.6",
    "1.8",
    "2.0",
    "2.2",
    "2.4",
    "2.6",
    "2.8",
    "3.0",
    "3.2",
  ];

  const T1_BODY = [
    {
      TIME: "litre/min",
      "1.0": (
        <Input
          id="lmin1_0"
          value={payload.SaveCardiopulmonaryBypass?.[0]?.lmin1_0}
          onChange={handleChange}
          className="form-control"
          name="lmin1_0"
        />
      ),
      1.2: (
        <Input
          id="lmin1_2"
          value={payload.SaveCardiopulmonaryBypass?.[0]?.lmin1_2}
          onChange={handleChange}
          className="form-control"
          name="lmin1_2"
        />
      ),
      1.4: (
        <Input
          id="lmin1_4"
          value={payload.SaveCardiopulmonaryBypass?.[0]?.lmin1_4}
          onChange={handleChange}
          className="form-control"
          name="lmin1_4"
        />
      ),
      1.6: (
        <Input
          id="lmin1_6"
          value={payload.SaveCardiopulmonaryBypass?.[0]?.lmin1_6}
          onChange={handleChange}
          className="form-control"
          name="lmin1_6"
        />
      ),
      1.8: (
        <Input
          id="lmin1_8"
          value={payload.SaveCardiopulmonaryBypass?.[0]?.lmin1_8}
          onChange={handleChange}
          className="form-control"
          name="lmin1_8"
        />
      ),
      "2.0": (
        <Input
          id="lmin2_0"
          value={payload.SaveCardiopulmonaryBypass?.[0]?.lmin2_0}
          onChange={handleChange}
          className="form-control"
          name="lmin2_0"
        />
      ),
      2.2: (
        <Input
          id="lmin2_2"
          value={payload.SaveCardiopulmonaryBypass?.[0]?.lmin2_2}
          onChange={handleChange}
          className="form-control"
          name="lmin2_2"
        />
      ),
      2.4: (
        <Input
          id="lmin2_4"
          value={payload.SaveCardiopulmonaryBypass?.[0]?.lmin2_4}
          onChange={handleChange}
          className="form-control"
          name="lmin2_4"
        />
      ),
      2.6: (
        <Input
          id="lmin2_6"
          value={payload.SaveCardiopulmonaryBypass?.[0]?.lmin2_6}
          onChange={handleChange}
          className="form-control"
          name="lmin2_6"
        />
      ),
      2.8: (
        <Input
          id="lmin2_8"
          value={payload.SaveCardiopulmonaryBypass?.[0]?.lmin2_8}
          onChange={handleChange}
          className="form-control"
          name="lmin2_8"
        />
      ),
      "3.0": (
        <Input
          id="lmin3_0"
          value={payload.SaveCardiopulmonaryBypass?.[0]?.lmin3_0}
          onChange={handleChange}
          className="form-control"
          name="lmin3_0"
        />
      ),
      3.2: (
        <Input
          id="lmin3_2"
          value={payload.SaveCardiopulmonaryBypass?.[0]?.lmin3_2}
          onChange={handleChange}
          className="form-control"
          name="lmin3_2"
        />
      ),
    },
  ];

  const THEAD = [t("S.No"), t("UHID"), t("Entered By"), t("Edit")];

  // const handleEdit = (saveUpdatePayload) => {
  //   setPayload({ ...saveUpdatePayload });
  // };
  const timeFormateDate = (time) => {
    debugger;
    if (!time || typeof time !== "string") return null;

    const date = new Date();

    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
      const [h, m, s] = time.split(":").map(Number);
      date.setHours(h);
      date.setMinutes(m);
      date.setSeconds(s);
      return date;
    }

    if (/^\d{2}:\d{2}$/.test(time)) {
      const [h, m] = time.split(":").map(Number);
      date.setHours(h);
      date.setMinutes(m);
      date.setSeconds(0);
      return date;
    }

    const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let [_, hh, mm, period] = match;
      hh = Number(hh);
      mm = Number(mm);
      period = period.toUpperCase();

      if (period === "PM" && hh !== 12) hh += 12;
      if (period === "AM" && hh === 12) hh = 0;

      date.setHours(hh);
      date.setMinutes(mm);
      date.setSeconds(0);
      return date;
    }
    return null;
  };
  const handleEdit = async (apiData) => {
    const res = await getCardiopulmonaryBloodGasAPI(apiData?.id);
    setPayload({
      SaveCardiopulmonaryBypass: [
        {
          ID: apiData.id ?? "",
          BloodGasID: apiData.bloodGasID ?? "",
          PID: apiData.pid ?? PatientID,
          TID: apiData.tid ?? TransactionID,

          BloodGroup: apiData.bloodGroup ?? "",
          CaseNo: apiData.caseNo ?? "",
          Ht: apiData.ht ?? "",
          Wt: apiData.wt ?? "",
          BSA: apiData.bsa ?? "",
          DX: apiData.dx ?? "",
          Procedure: apiData.procedure ?? "",
          PreHB: apiData.preHB ?? "",

          Hartmanns: apiData.hartmanns ?? "",
          Solumedrol: apiData.solumedrol ?? "",
          AssistSurgeon: apiData.assistSurgeon ?? "",
          Mannitol: apiData.mannitol ?? "",
          Surgeon: apiData.surgeon ?? "",
          Voluven: apiData.voluven ?? "",
          CaCL: apiData.caCL ?? "",
          Anaesthetist: apiData.anaesthetist ?? "",
          DOSE: apiData.dose ?? "",
          Blood: apiData.blood ?? "",
          Heparin: apiData.heparin ?? "",
          Perfusionist: apiData.perfusionist ?? "",

          Time: apiData.time ? new Date(apiData.time) : null,
          Time1: apiData.time1 ? new Date(apiData.time1) : null,
          PerfusionTime: apiData.perfusionTime
            ? new Date(apiData.perfusionTime)
            : null,

          Meds: apiData.meds ?? "",
          Albumin: apiData.albumin ?? "",
          Oxygenator: apiData.oxygenator ?? "",
          ACT: apiData.act ?? "",
          Total: apiData.total ?? "",
          Tranexamic: apiData.tranexamic ?? "",
          CustomPack: apiData.customPack ?? "",
          CoolTemp: apiData.coolTemp ?? "",
          NaHCO2: apiData.naHCO2 ?? "",
          TotalByPass: apiData.totalByPass ?? "",
          Hemoconcentrator: apiData.hemoconcentrator ?? "",

          Alarm_On: apiData.alarm_On ?? "",
          ChecklistCompleted: apiData.checklistCompleted ?? "",
          Cardioplegia: apiData.cardioplegia ?? "",

          HeparinPt: apiData.heparinPt ?? "",
          mgkg: apiData.mgkg ?? "",
          mgkg1: apiData.mgkg1 ?? "",
          cckg: apiData.cckg ?? "",
          ccperkg: apiData.ccperkg ?? "",

          ArterialCannula: apiData.arterialCannula ?? "",
          VenousCannula: apiData.venousCannula ?? "",
          CardioplegiaCannula: apiData.cardioplegiaCannula ?? "",
          XClamp: apiData.xClamp ?? "",
          TotalProtamine: apiData.totalProtamine ?? "",
          CirculatoryArrest: apiData.circulatoryArrest ?? "",
          Dosesubsequent: apiData.dosesubsequent ?? "",
          LVVent: apiData.lvVent ?? "",
          UrinebyPass: apiData.urinebyPass ?? "",
          postBypass: apiData.postBypass ?? "",
          CUF: apiData.cuf ?? "",

          lmin1_0: apiData.lMin1_0 ?? "",
          lmin1_2: apiData.lMin1_2 ?? "",
          lmin1_4: apiData.lMin1_4 ?? "",
          lmin1_6: apiData.lMin1_6 ?? "",
          lmin1_8: apiData.lMin1_8 ?? "",
          lmin2_0: apiData.lMin2_0 ?? "",
          lmin2_2: apiData.lMin2_2 ?? "",
          lmin2_4: apiData.lMin2_4 ?? "",
          lmin2_6: apiData.lMin2_6 ?? "",
          lmin2_8: apiData.lMin2_8 ?? "",
          lmin3_0: apiData.lMin3_0 ?? "",
          lmin3_2: apiData.lMin3_2 ?? "",

          ImperialDeatils: apiData.imperialDeatils ?? "",
          Comments: apiData.comments ?? "",
          PERFUNIST: apiData.perfunist ?? "",
          CreatedBy: apiData.createdBy ?? "",
        },
      ],

      BloodGas: res?.data?.map((bg) => ({
        Cardio_Bypass_Id: bg.cardio_Bypass_Id ?? "",
        PatientId: bg.patientId ?? PatientID,
        TransactionId: bg.transactionId ?? TransactionID,
        Time: bg.time ? timeFormateDate(bg.time) : new Date(),
        Temp: bg.temp ?? "",
        Flo2Flow: bg.flo2Flow ?? "",
        PH: bg.ph ?? "",
        Po2: bg.po2 ?? "",
        Pco2: bg.pco2 ?? "",
        Spo2: bg.spo2 ?? "",
        HCO3: bg.hcO3 ?? "",
        Hct: bg.hct ?? "",
        Hb: bg.hb ?? "",
        Na: bg.na ?? "",
        K: bg.k ?? "",
        Glu: bg.glu ?? "",
        CaPlus: bg.caPlus ?? "",
      })),
    });
  };
  console.log(payload);

  const handleTableData = (tableData) => {
    return tableData?.map((items, index) => {
      const {} = items;
      return {
        SNO: index + 1,
        PatientId: items?.patientId,
        createdBy: items?.createdBy,
        Edit: (
          <i className="fa fa-edit p-1" onClick={() => handleEdit(items)} />
        ),
      };
    });
  };

  const handleBloodGasChange = (rowIndex, key, value) => {
    setPayload((prev) => {
      const updated = [...prev.BloodGas];
      updated[rowIndex][key] = value;
      return { ...prev, BloodGas: updated };
    });
  };

  const removeBloodGasRow = (index) => {
    setPayload((prev) => ({
      ...prev,
      BloodGas: prev.BloodGas.filter((_, i) => i !== index),
    }));
  };

  const addBloodGasRow = () => {
    setPayload((prev) => ({
      ...prev,
      BloodGas: [
        ...prev.BloodGas,
        {
          Cardio_Bypass_Id: "",
          Time: new Date(),
          Temp: "",
          Flo2Flow: "",
          PH: "",
          Po2: "",
          Pco2: "",
          Spo2: "",
          HCO3: "",
          Hct: "",
          Hb: "",
          Na: "",
          K: "",
          Glu: "",
          CaPlus: "",
        },
      ],
    }));
  };

  const handleBloodGasDateTimeChange = (rowIndex, name, value) => {
    setPayload((prev) => {
      const updated = [...prev.BloodGas];
      updated[rowIndex][name] = value;

      return { ...prev, BloodGas: updated };
    });
  };

  const BloodGas_HEAD = [
    t("TIME"),
    t("Temp"),
    t("Flo2Flow"),
    t("PH"),
    "PO2",
    "PCO2",
    "SPO2",
    t("HCO3/BE"),
    t("Hct"),
    t("HB"),
    t("Na"),
    "K",
    t("Glu"),
    t("Ca++"),
    "-",
  ];

  const handleBloodGasTable = (data) => {
    return data?.map((row, rowIndex) => ({
      TIME: (
        <TimePicker
          name="Time"
          value={row.Time}
          handleChange={(e) =>
            handleBloodGasDateTimeChange(rowIndex, "Time", e.target.value)
          }
        />
      ),

      Temp: (
        <Input
          className="form-control"
          value={row.Temp}
          onChange={(e) =>
            handleBloodGasChange(rowIndex, "Temp", e.target.value)
          }
        />
      ),
      Flo2Flow: (
        <Input
          className="form-control"
          value={row.Flo2Flow}
          onChange={(e) =>
            handleBloodGasChange(rowIndex, "Flo2Flow", e.target.value)
          }
        />
      ),

      PH: (
        <Input
          className="form-control"
          value={row.PH}
          onChange={(e) => handleBloodGasChange(rowIndex, "PH", e.target.value)}
        />
      ),

      PO2: (
        <Input
          className="form-control"
          value={row.Po2}
          onChange={(e) =>
            handleBloodGasChange(rowIndex, "Po2", e.target.value)
          }
        />
      ),

      PCO2: (
        <Input
          className="form-control"
          value={row.Pco2}
          onChange={(e) =>
            handleBloodGasChange(rowIndex, "Pco2", e.target.value)
          }
        />
      ),
      SPO2: (
        <Input
          className="form-control"
          value={row.Spo2}
          onChange={(e) =>
            handleBloodGasChange(rowIndex, "Spo2", e.target.value)
          }
        />
      ),

      "HCO3/BE": (
        <Input
          className="form-control"
          value={row.HCO3}
          onChange={(e) =>
            handleBloodGasChange(rowIndex, "HCO3", e.target.value)
          }
        />
      ),

      Hct: (
        <Input
          className="form-control"
          value={row.Hct}
          onChange={(e) =>
            handleBloodGasChange(rowIndex, "Hct", e.target.value)
          }
        />
      ),

      HB: (
        <Input
          className="form-control"
          value={row.Hb}
          onChange={(e) => handleBloodGasChange(rowIndex, "Hb", e.target.value)}
        />
      ),

      Na: (
        <Input
          className="form-control"
          value={row.Na}
          onChange={(e) => handleBloodGasChange(rowIndex, "Na", e.target.value)}
        />
      ),

      K: (
        <Input
          className="form-control"
          value={row.K}
          onChange={(e) => handleBloodGasChange(rowIndex, "K", e.target.value)}
        />
      ),

      Glu: (
        <Input
          className="form-control"
          value={row.Glu}
          onChange={(e) =>
            handleBloodGasChange(rowIndex, "Glu", e.target.value)
          }
        />
      ),

      "Ca++": (
        <Input
          className="form-control"
          value={row.CaPlus}
          onChange={(e) =>
            handleBloodGasChange(rowIndex, "CaPlus", e.target.value)
          }
        />
      ),

      "-": (
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm btn-success"
            onClick={addBloodGasRow}
          >
            +
          </button>

          {rowIndex > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-danger ml-2"
              onClick={() => removeBloodGasRow(rowIndex)}
            >
              -
            </button>
          )}
        </div>
      ),
    }));
  };

  const handleGetData = async (PatientID) => {
    try {
      const APIresponse = await GetCardiopulmonaryDetailsAPI(PatientID);
      const data = APIresponse?.data || [];
      if (data.length > 0) {
        setTableData(data);
      } else {
        setTableData([]);
      }
    } catch (error) {
      console.log(error);
    }
  };
  console.log("payload make", save_Payload);

  const handlesave = async (isUpdate) => {
    try {
      let response;
      if (isUpdate) {
        response = await UpdateCardiopulmonaryBypassAPI(save_Payload);
      } else {
        response = await SaveCardiopulmonaryBypassAPI(save_Payload);
      }

      if (response?.success) {
        notify(response?.message, "success");
        handleGetData(PatientID);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchBloodGroups = async () => {
      try {
        const response = await BindBloodGroupAPI();
        console.log({ response });
        const formatedData = response?.data.map((items) => ({
          value: items.id,
          label: items.bloodgroup,
        }));
        setBloodGroup(formatedData);
      } catch (error) {
        console.error("Error fetching blood groups:", error);
      }
    };

    fetchBloodGroups();
  }, []);
  useEffect(() => {
    handleGetData(PatientID);
  }, []);

  const hasRows = payload?.BloodGas?.length > 0;
  const hasBypassId = Number(payload?.BloodGas?.[0]?.Cardio_Bypass_Id) > 0;

  const isEdit = Number(payload?.SaveCardiopulmonaryBypass?.ID) > 0;
  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("CARDIO PULMONARY BYPASS")} isBreadcrumb={false} />
          <div className="row p-2">
            {" "}
            {block2Config.map((field, index) => (
              <React.Fragment key={index}>{renderField(field)}</React.Fragment>
            ))}
          </div>
          <div className="col-12">
            <Tables thead={T1_HEAD} tbody={T1_BODY} />
          </div>
          <div className="col-xl-12 col-md-12 col-sm-12 col-12 p-2 ">
            <div
              className="pt-3 pb-2 pr-2 pl-2 form-group"
              style={{
                border: "1px solid #ced4da",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <label className="label" style={{ position: "absolute" }}>
                {t("Blood Gas")}
              </label>
              <div className="col-12">
                <Tables
                  thead={BloodGas_HEAD}
                  tbody={handleBloodGasTable(payload.BloodGas)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-2">
          {/* {payload?.SaveCardiopulmonaryBypass?.ID ||
            payload?.BloodGas?.[0]?.Cardio_Bypass_Id ? (
            <>
              <button
                className="btn btn-sm btn-success"
                onClick={() => handlesave(true)}
              >
                {t("Update")}
              </button>
            </>
          ) : (
            <button
              className="btn btn-sm btn-success"
              onClick={() => handlesave()}
            >
              {t("Save")}
            </button>
          )} */}
          {tableData.length > 0 ? (
            hasBypassId || isEdit ? (
              // show update button
              <button
                className="btn btn-sm btn-success"
                onClick={() => handlesave(true)}
              >
                {t("Update")}
              </button>
            ) : (
              // notify user that records need edit first
              <button
                className="btn btn-sm btn-success"
                onClick={() =>
                  notify(t("Please edit records before update"), "warn")
                }
              >
                {t("Update")}
              </button>
            )
          ) : (
            // no rows -> normal save
            <button
              className="btn btn-sm btn-success"
              onClick={() => handlesave()}
            >
              {t("Save")}
            </button>
          )}
        </div>
      </div>
      <div className="col-12">
        <Tables thead={THEAD} tbody={handleTableData(tableData)} />
      </div>
    </>
  );
  
};

export default CardiopulmonaryBypass;
