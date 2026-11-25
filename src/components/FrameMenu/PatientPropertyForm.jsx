import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import {
  DetailPatientPropertyDeclarationAPI,
  SavePatientPropertyDeclarationAPI,
} from "../../networkServices/OT/otAPI";
import Tables from "../UI/customTable";
import { notify } from "../../utils/ustil2";
const PatientPropertyForm = ({ data }) => {
  console.log(data);

  const PatientID = data?.patientID || data?.PatientID;
  const TransactionID = data?.transactionID || data?.TransactionID;
  const { VITE_DATE_FORMAT } = import.meta.env;

  const [t] = useTranslation();

  const initialValue = {
    Id: "",
    PatientID: "",
    TransactionId: "",

    WPNecklace: "",
    WPRings: "",
    WPTypeandMake: "",
    WPSATCOLOR: "",
    WPShillings: "",
    WPForeignCurrency: "",
    WPTravellersCheque: "",
    WPIDCard: "",
    WPPassport: "",
    WPCreditCards: "",
    WPMedicaInsurance: "",
    WPModel: "",
    WPPhoneNumber: "",
    WPsrno: "",
    WPRegNo: "",
    WPMobileNoModel: "",
    WPColor: "",
    WPLaptopBluetothSpeaker: "",
    WPTabletFlashdisc: "",
    WPModelType: "",
    WPBelt: "",
    WPBlouseSkirt: "",
    WPCoatJacket: "",
    WPDressTrousers: "",
    WPDressingGown: "",
    WPUnderwear: "",
    WPSocks: "",
    WPShoes: "",
    WPVestTie: "",
    WPShirtOthers: "",
    WPGlasses: "",
    WPContactsLenses: "",
    WPHearingAids: "",
    WPLeft: "",
    WPRight: "",
    WPProsthesis: "",
    WPOthers: "",
    WPPartials: "",
    WPUpper: "",
    WPLower: "",
    WPMiscellaneous: "",

    RHNecklace: "",
    RHRings: "",
    RHTypeandMake: "",
    RHSATCOLOR: "",
    RHShillings: "",
    RHForeignCurrency: "",
    RHTravellersCheque: "",
    RHIDCard: "",
    RHPassport: "",
    RHCreditCards: "",
    RHMedicalInsurance: "",
    RHMObileNOModel: "",
    RHPhoneNumber: "",
    RHSrNO: "",
    RHRegNo: "",
    RHModel: "",
    RHColor: "",
    RHLaptopBluetothSpeaker: "",
    RHTabletFlashdisc: "",
    RHModelType: "",
    RHBelt: "",
    RHBlouseSkirt: "",
    RHCoatJacket: "",
    RHDressTrousers: "",
    RHDressingGown: "",
    RHUnderwear: "",
    RHSocks: "",
    RHShoes: "",
    RHVestTie: "",
    RHShirtOthers: "",
    RHGlasses: "",
    RHContactsLenses: "",
    RHHearingAids: "",
    RHLeft: "",
    RHRight: "",
    RHProsthesis: "",
    RHOthers: "",
    RHPartials: "",
    RHUpper: "",
    RHLower: "",
    RHMiscellaneous: "",

    ResponsibilityName: "",
    ResponsibilityDate: new Date(),

    CutSevered: "",
    Thrownawayduetosoilage: "",
    Takenbysecuritypolice: "",

    ItemsTakenName: "",
    ItemsTakenDate: new Date(),

    Necklace: "",
    ModelType: "",
    Rings: "",
    Belt: "",
    TypeandMake: "",
    BlouseSkirt: "",
    SATCOLOR: "",
    CoatJacket: "",
    DressTrousers: "",
    DressingGown: "",
    Shillings: "",
    Underwear: "",
    ForeignCurrency: "",
    TravellersCheque: "",
    Socks: "",
    Shoes: "",
    VestTie: "",
    ShirtOthers: "",
    IDCard: "",
    Passport: "",
    CreditCards: "",
    Glasses: "",
    MedicalInsurance: "",
    ContactsLenses: "",
    HearingAids: "",
    Left1: "",
    Right1: "",
    PhoneNumber: "",
    SNo: "",
    Prosthesis: "",
    Others: "",
    RegNo: "",
    Model: "",
    Color: "",
    Partials: "",
    UPPER: "",
    LOWER: "",
    LaptopBluetothSpeaker: "",
    TabletFlashdisc: "",
    Model1: "",
    IsActive: "",
  };

  const [payload, setPayload] = useState(initialValue);
  const [isCutSeveredChecked, setIsCutSeveredChecked] = useState(false);
  const [isThrownAway, setIsThrownAway] = useState(false);
  const [isTakeBy, setIsTakeBy] = useState(false);
  const [tableData, setTableData] = useState([]);

  const THEAD = [
    t("S.No"),
    t("Responsibility Name"),
    t("ItemsTaken Name"),
    t("CreateDate"),
    t("Edit"),
    // "Print",
  ];

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const itemsData = [
    {
      category: "1. Jewellery",
      items: [
        {
          name: "Necklace",
          descField: "Necklace",
          withPatientField: "WPNecklace",
          returnedField: "RHNecklace",
        },
        {
          name: "Ring",
          descField: "Rings",
          withPatientField: "WPRings",
          returnedField: "RHRings",
        },
      ],
    },

    {
      category: "2. Watch",
      items: [
        {
          name: "Type and Make",
          descField: "TypeandMake",
          withPatientField: "WPTypeandMake",
          returnedField: "RHTypeandMake",
        },
        {
          name: "SAT/COLOR",
          descField: "SATCOLOR",
          withPatientField: "WPSATCOLOR",
          returnedField: "RHSATCOLOR",
        },
      ],
    },
    {
      category: "3. Cash",
      items: [
        {
          name: "Shillings (Kenyan)",
          descField: "Shillings",
          withPatientField: "WPShillings",
          returnedField: "RHShillings",
        },
        {
          name: "Foreign Currency",
          descField: "ForeignCurrency",
          withPatientField: "WPForeignCurrency",
          returnedField: "RHForeignCurrency",
        },
        {
          name: "Travellers Cheque",
          descField: "TravellersCheque",
          withPatientField: "WPTravellersCheque",
          returnedField: "RHTravellersCheque",
        },
      ],
    },
    {
      category: "4. Personal Documents",
      items: [
        {
          name: "ID Card",
          descField: "IDCard",
          withPatientField: "WPIDCard",
          returnedField: "RHIDCard",
        },
        {
          name: "Passport",
          descField: "Passport",
          withPatientField: "WPPassport",
          returnedField: "RHPassport",
        },
        {
          name: "Credit Cards",
          descField: "CreditCards",
          withPatientField: "WPCreditCards",
          returnedField: "RHCreditCards",
        },
        {
          name: "Medical Insurance",
          descField: "MedicalInsurance",
          withPatientField: "WPMedicaInsurance",
          returnedField: "RHMedicalInsurance",
        },
      ],
    },
    {
      category: "5. Mobile Phone",
      items: [
        {
          name: "Model",
          descField: "Model1",
          withPatientField: "WPMobileNoModel",
          returnedField: "RHMObileNOModel",
        },
        {
          name: "Phone Number",
          descField: "PhoneNumber",
          withPatientField: "WPPhoneNumber",
          returnedField: "RHPhoneNumber",
        },
        {
          name: "S/No.",
          descField: "SNo",
          withPatientField: "WPsrno",
          returnedField: "RHSrNO",
        },
      ],
    },
    {
      category: "6. Vehicle Deposit",
      items: [
        {
          name: "Reg. No",
          descField: "RegNo",
          withPatientField: "WPRegNo",
          returnedField: "RHRegNo",
        },
        {
          name: "Model",
          descField: "Model",
          withPatientField: "WPModel",
          returnedField: "RHModel",
        },
        {
          name: "Color",
          descField: "Color",
          withPatientField: "WPColor",
          returnedField: "RHColor",
        },
      ],
    },
    {
      category: "7. Electonic",
      items: [
        {
          name: "Laptop/Bluetoth Speaker",
          descField: "LaptopBluetothSpeaker",
          withPatientField: "WPLaptopBluetothSpeaker",
          returnedField: "RHLaptopBluetothSpeaker",
        },
        {
          name: "Tablet/Flash disc",
          descField: "TabletFlashdisc",
          withPatientField: "WPTabletFlashdisc",
          returnedField: "RHTabletFlashdisc",
        },
      ],
    },
    {
      category: "8. Weapon Declaration",
      items: [
        {
          name: "Model/Type",
          descField: "ModelType",
          withPatientField: "WPModelType",
          returnedField: "RHModelType",
        },
      ],
    },
    {
      category: "9. Clothing",
      items: [
        {
          name: "Belt",
          descField: "Belt",
          withPatientField: "WPBelt",
          returnedField: "RHBelt",
        },
        {
          name: "Blouse/Skirt",
          descField: "BlouseSkirt",
          withPatientField: "WPBlouseSkirt",
          returnedField: "RHBlouseSkirt",
        },
        {
          name: "Coat/Jacket",
          descField: "CoatJacket",
          withPatientField: "WPCoatJacket",
          returnedField: "RHCoatJacket",
        },
        {
          name: "Dress/Trousers",
          descField: "DressTrousers",
          withPatientField: "WPDressTrousers",
          returnedField: "RHDressTrousers",
        },
        {
          name: "Dressing Gown",
          descField: "DressingGown",
          withPatientField: "WPDressingGown",
          returnedField: "RHDressingGown",
        },
        {
          name: "Underwear",
          descField: "Underwear",
          withPatientField: "WPUnderwear",
          returnedField: "RHUnderwear",
        },
        {
          name: "Socks",
          descField: "Socks",
          withPatientField: "WPSocks",
          returnedField: "RHSocks",
        },
        {
          name: "Shoes",
          descField: "Shoes",
          withPatientField: "WPShoes",
          returnedField: "RHShoes",
        },
        {
          name: "Vest/Tie",
          descField: "VestTie",
          withPatientField: "WPVestTie",
          returnedField: "RHVestTie",
        },
        {
          name: "Shirt/Others",
          descField: "ShirtOthers",
          withPatientField: "WPShirtOthers",
          returnedField: "RHShirtOthers",
        },
      ],
    },
    {
      category: "10. Personal Items",
      items: [
        {
          name: "Glasses",
          descField: "Glasses",
          withPatientField: "WPGlasses",
          returnedField: "RHGlasses",
        },
        {
          name: "Contacts Lenses",
          descField: "ContactsLenses",
          withPatientField: "WPContactsLenses",
          returnedField: "RHContactsLenses",
        },
        {
          name: "Hearing Aids",
          descField: "HearingAids",
          withPatientField: "WPHearingAids",
          returnedField: "RHHearingAids",
        },
        {
          name: "Left ( )",
          descField: "Left1",
          withPatientField: "WPLeft",
          returnedField: "RHLeft",
        },
        {
          name: "Right ( )",
          descField: "Right1",
          withPatientField: "WPRight",
          returnedField: "RHRight",
        },
      ],
    },
    {
      category: "11. Assistive Devices	",
      items: [
        {
          name: "Prosthesis",
          descField: "Prosthesis",
          withPatientField: "WPProsthesis",
          returnedField: "RHProsthesis",
        },
        {
          name: "Others",
          descField: "Others",
          withPatientField: "WPOthers",
          returnedField: "RHOthers",
        },
      ],
    },
    {
      category: "12. Dentures	",
      items: [
        {
          name: "Partials",
          descField: "Partials",
          withPatientField: "WPPartials",
          returnedField: "RHPartials",
        },
        {
          name: "Upper ( )",
          descField: "UPPER",
          withPatientField: "WPUpper",
          returnedField: "RHUpper",
        },
        {
          name: "Lower ( )",
          descField: "LOWER",
          withPatientField: "WPLower",
          returnedField: "RHLower",
        },
      ],
    },
    {
      category: "13. Miscellaneous		",
      items: [
        {
          name: "Miscellaneous",
          withPatientField: "WPMiscellaneous",
          returnedField: "RHMiscellaneous",
        },
      ],
    },
  ];

  const handleGetData = async (PatientID, TransactionID) => {
    try {
      const APIresponse = await DetailPatientPropertyDeclarationAPI(
        PatientID,
        TransactionID
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

  const handleEdit = (row) => {
    setPayload({
      Id: row?.Id || "",
      WPNecklace: row?.WPNecklace || "",
      WPRings: row?.WPRings || "",
      WPTypeandMake: row?.WPTypeandMake || "",
      WPSATCOLOR: row?.WPSATCOLOR || "",
      WPShillings: row?.WPShillings || "",
      WPForeignCurrency: row?.WPForeignCurrency || "",
      WPTravellersCheque: row?.WPTravellersCheque || "",
      WPIDCard: row?.WPIDCard || "",
      WPPassport: row?.WPPassport || "",
      WPCreditCards: row?.WPCreditCards || "",
      WPMedicaInsurance: row?.WPMedicaInsurance || "",
      WPModel: row?.WPModel || "",
      WPPhoneNumber: row?.WPPhoneNumber || "",
      WPsrno: row?.WPsrno || "",
      WPRegNo: row?.WPRegNo || "",
      WPMobileNoModel: row?.WPMobileNoModel || "",
      WPColor: row?.WPColor || "",
      WPLaptopBluetothSpeaker: row?.WPLaptopBluetothSpeaker || "",
      WPTabletFlashdisc: row?.WPTabletFlashdisc || "",
      WPModelType: row?.WPModelType || "",
      WPBelt: row?.WPBelt || "",
      WPBlouseSkirt: row?.WPBlouseSkirt || "",
      WPCoatJacket: row?.WPCoatJacket || "",
      WPDressTrousers: row?.WPDressTrousers || "",
      WPDressingGown: row?.WPDressingGown || "",
      WPUnderwear: row?.WPUnderwear || "",
      WPSocks: row?.WPSocks || "",
      WPShoes: row?.WPShoes || "",
      WPVestTie: row?.WPVestTie || "",
      WPShirtOthers: row?.WPShirtOthers || "",
      WPGlasses: row?.WPGlasses || "",
      WPContactsLenses: row?.WPContactsLenses || "",
      WPHearingAids: row?.WPHearingAids || "",
      WPLeft: row?.WPLeft || "",
      WPRight: row?.WPRight || "",
      WPProsthesis: row?.WPProsthesis || "",
      WPOthers: row?.WPOthers || "",
      WPPartials: row?.WPPartials || "",
      WPUpper: row?.WPUpper || "",
      WPLower: row?.WPLower || "",
      WPMiscellaneous: row?.WPMiscellaneous || "",

      RHNecklace: row?.RHNecklace || "",
      RHRings: row?.RHRings || "",
      RHTypeandMake: row?.RHTypeandMake || "",
      RHSATCOLOR: row?.RHSATCOLOR || "",
      RHShillings: row?.RHShillings || "",
      RHForeignCurrency: row?.RHForeignCurrency || "",
      RHTravellersCheque: row?.RHTravellersCheque || "",
      RHIDCard: row?.RHIDCard || "",
      RHPassport: row?.RHPassport || "",
      RHCreditCards: row?.RHCreditCards || "",
      RHMedicalInsurance: row?.RHMedicalInsurance || "",
      RHMObileNOModel: row?.RHMObileNOModel || "",
      RHPhoneNumber: row?.RHPhoneNumber || "",
      RHSrNO: row?.RHSrNO || "",
      RHRegNo: row?.RHRegNo || "",
      RHModel: row?.RHModel || "",
      RHColor: row?.RHColor || "",
      RHLaptopBluetothSpeaker: row?.RHLaptopBluetothSpeaker || "",
      RHTabletFlashdisc: row?.RHTabletFlashdisc || "",
      RHModelType: row?.RHModelType || "",
      RHBelt: row?.RHBelt || "",
      RHBlouseSkirt: row?.RHBlouseSkirt || "",
      RHCoatJacket: row?.RHCoatJacket || "",
      RHDressTrousers: row?.RHDressTrousers || "",
      RHDressingGown: row?.RHDressingGown || "",
      RHUnderwear: row?.RHUnderwear || "",
      RHSocks: row?.RHSocks || "",
      RHShoes: row?.RHShoes || "",
      RHVestTie: row?.RHVestTie || "",
      RHShirtOthers: row?.RHShirtOthers || "",
      RHGlasses: row?.RHGlasses || "",
      RHContactsLenses: row?.RHContactsLenses || "",
      RHHearingAids: row?.RHHearingAids || "",
      RHLeft: row?.RHLeft || "",
      RHRight: row?.RHRight || "",
      RHProsthesis: row?.RHProsthesis || "",
      RHOthers: row?.RHOthers || "",
      RHPartials: row?.RHPartials || "",
      RHUpper: row?.RHUpper || "",
      RHLower: row?.RHLower || "",
      RHMiscellaneous: row?.RHMiscellaneous || "",

      ResponsibilityName: row?.ResponsibilityName || "",
      ResponsibilityDate: new Date(row?.ResponsibilityDate) || "",

      CutSevered: row?.CutSevered || "",
      Thrownawayduetosoilage: row?.Thrownawayduetosoilage || "",
      Takenbysecuritypolice: row?.Takenbysecuritypolice || "",

      ItemsTakenName: row?.ItemsTakenName || "",
      ItemsTakenDate: new Date(row?.ItemsTakenDate) || "",

      Necklace: row?.Necklace || "",
      ModelType: row?.ModelType || "",
      Rings: row?.Rings || "",
      Belt: row?.Belt || "",
      TypeandMake: row?.TypeandMake || "",
      BlouseSkirt: row?.BlouseSkirt || "",
      SATCOLOR: row?.SATCOLOR || "",
      CoatJacket: row?.CoatJacket || "",
      DressTrousers: row?.DressTrousers || "",
      DressingGown: row?.DressingGown || "",
      Shillings: row?.Shillings || "",
      Underwear: row?.Underwear || "",
      ForeignCurrency: row?.ForeignCurrency || "",
      TravellersCheque: row?.TravellersCheque || "",
      Socks: row?.Socks || "",
      Shoes: row?.Shoes || "",
      VestTie: row?.VestTie || "",
      ShirtOthers: row?.ShirtOthers || "",
      IDCard: row?.IDCard || "",
      Passport: row?.Passport || "",
      CreditCards: row?.CreditCards || "",
      Glasses: row?.Glasses || "",
      MedicalInsurance: row?.MedicalInsurance || "",
      ContactsLenses: row?.ContactsLenses || "",
      HearingAids: row?.HearingAids || "",
      Left1: row?.Left1 || "",
      Right1: row?.Right1 || "",
      PhoneNumber: row?.PhoneNumber || "",
      SNo: row?.SNo || "",
      Prosthesis: row?.Prosthesis || "",
      Others: row?.Others || "",
      RegNo: row?.RegNo || "",
      Model: row?.Model || "",
      Color: row?.Color || "",
      Partials: row?.Partials || "",
      UPPER: row?.UPPER || "",
      LOWER: row?.LOWER || "",
      LaptopBluetothSpeaker: row?.LaptopBluetothSpeaker || "",
      TabletFlashdisc: row?.TabletFlashdisc || "",
      Model1: row?.Model1 || "",
    });
    setIsCutSeveredChecked(!!row?.CutSevered);
    setIsThrownAway(!!row?.Thrownawayduetosoilage);
    setIsTakeBy(!!row?.Takenbysecuritypolice);
  };

  const handleSave = async () => {
    const savePayload = {
      Id: Number(payload?.Id) || 0,
      PatientID: PatientID,
      TransactionId: TransactionID,

      WPNecklace: payload.WPNecklace,
      WPRings: payload.WPRings,
      WPTypeandMake: payload.WPTypeandMake,
      WPSATCOLOR: payload.WPSATCOLOR,
      WPShillings: payload.WPShillings,
      WPForeignCurrency: payload.WPForeignCurrency,
      WPTravellersCheque: payload.WPTravellersCheque,
      WPIDCard: payload.WPIDCard,
      WPPassport: payload.WPPassport,
      WPCreditCards: payload.WPCreditCards,
      WPMedicaInsurance: payload.WPMedicaInsurance,
      WPModel: payload.WPModel,
      WPPhoneNumber: payload.WPPhoneNumber,
      WPsrno: payload.WPsrno,
      WPRegNo: payload.WPRegNo,
      WPMobileNoModel: payload.WPMobileNoModel,
      WPColor: payload.WPColor,
      WPLaptopBluetothSpeaker: payload.WPLaptopBluetothSpeaker,
      WPTabletFlashdisc: payload.WPTabletFlashdisc,
      WPModelType: payload.WPModelType,
      WPBelt: payload.WPBelt,
      WPBlouseSkirt: payload.WPBlouseSkirt,
      WPCoatJacket: payload.WPCoatJacket,
      WPDressTrousers: payload.WPDressTrousers,
      WPDressingGown: payload.WPDressingGown,
      WPUnderwear: payload.WPUnderwear,
      WPSocks: payload.WPSocks,
      WPShoes: payload.WPShoes,
      WPVestTie: payload.WPVestTie,
      WPShirtOthers: payload.WPShirtOthers,
      WPGlasses: payload.WPGlasses,
      WPContactsLenses: payload.WPContactsLenses,
      WPHearingAids: payload.WPHearingAids,
      WPLeft: payload.WPLeft,
      WPRight: payload.WPRight,
      WPProsthesis: payload.WPProsthesis,
      WPOthers: payload.WPOthers,
      WPPartials: payload.WPPartials,
      WPUpper: payload.WPUpper,
      WPLower: payload.WPLower,
      WPMiscellaneous: payload.WPMiscellaneous,

      RHNecklace: payload.RHNecklace,
      RHRings: payload.RHRings,
      RHTypeandMake: payload.RHTypeandMake,
      RHSATCOLOR: payload.RHSATCOLOR,
      RHShillings: payload.RHShillings,
      RHForeignCurrency: payload.RHForeignCurrency,
      RHTravellersCheque: payload.RHTravellersCheque,
      RHIDCard: payload.RHIDCard,
      RHPassport: payload.RHPassport,
      RHCreditCards: payload.RHCreditCards,
      RHMedicalInsurance: payload.RHMedicalInsurance,
      RHMObileNOModel: payload.RHMObileNOModel,
      RHPhoneNumber: payload.RHPhoneNumber,
      RHSrNO: payload.RHSrNO,
      RHRegNo: payload.RHRegNo,
      RHModel: payload.RHModel,
      RHColor: payload.RHColor,
      RHLaptopBluetothSpeaker: payload.RHLaptopBluetothSpeaker,
      RHTabletFlashdisc: payload.RHTabletFlashdisc,
      RHModelType: payload.RHModelType,
      RHBelt: payload.RHBelt,
      RHBlouseSkirt: payload.RHBlouseSkirt,
      RHCoatJacket: payload.RHCoatJacket,
      RHDressTrousers: payload.RHDressTrousers,
      RHDressingGown: payload.RHDressingGown,
      RHUnderwear: payload.RHUnderwear,
      RHSocks: payload.RHSocks,
      RHShoes: payload.RHShoes,
      RHVestTie: payload.RHVestTie,
      RHShirtOthers: payload.RHShirtOthers,
      RHGlasses: payload.RHGlasses,
      RHContactsLenses: payload.RHContactsLenses,
      RHHearingAids: payload.RHHearingAids,
      RHLeft: payload.RHLeft,
      RHRight: payload.RHRight,
      RHProsthesis: payload.RHProsthesis,
      RHOthers: payload.RHOthers,
      RHPartials: payload.RHPartials,
      RHUpper: payload.RHUpper,
      RHLower: payload.RHLower,
      RHMiscellaneous: payload.RHMiscellaneous,

      ResponsibilityName: payload.ResponsibilityName,
      ResponsibilityDate: payload.ResponsibilityDate,

      CutSevered: payload.CutSevered,
      Thrownawayduetosoilage: payload.Thrownawayduetosoilage,
      Takenbysecuritypolice: payload.Takenbysecuritypolice,

      ItemsTakenName: payload.ItemsTakenName,
      ItemsTakenDate: payload.ItemsTakenDate,

      Necklace: payload.Necklace,
      ModelType: payload.ModelType,
      Rings: payload.Rings,
      Belt: payload.Belt,
      TypeandMake: payload.TypeandMake,
      BlouseSkirt: payload.BlouseSkirt,
      SATCOLOR: payload.SATCOLOR,
      CoatJacket: payload.CoatJacket,
      DressTrousers: payload.DressTrousers,
      DressingGown: payload.DressingGown,
      Shillings: payload.Shillings,
      Underwear: payload.Underwear,
      ForeignCurrency: payload.ForeignCurrency,
      TravellersCheque: payload.TravellersCheque,
      Socks: payload.Socks,
      Shoes: payload.Shoes,
      VestTie: payload.VestTie,
      ShirtOthers: payload.ShirtOthers,
      IDCard: payload.IDCard,
      Passport: payload.Passport,
      CreditCards: payload.CreditCards,
      Glasses: payload.Glasses,
      MedicalInsurance: payload.MedicalInsurance,
      ContactsLenses: payload.ContactsLenses,
      HearingAids: payload.HearingAids,
      Left1: payload.Left1,
      Right1: payload.Right1,
      PhoneNumber: payload.PhoneNumber,
      SNo: payload.SNo,
      Prosthesis: payload.Prosthesis,
      Others: payload.Others,
      RegNo: payload.RegNo,
      Model: payload.Model,
      Color: payload.Color,
      Partials: payload.Partials,
      UPPER: payload.UPPER,
      LOWER: payload.LOWER,
      LaptopBluetothSpeaker: payload.LaptopBluetothSpeaker,
      TabletFlashdisc: payload.TabletFlashdisc,
      Model1: payload.Model1,
    };
    console.log(savePayload);
    debugger;
    try {
      const response = await SavePatientPropertyDeclarationAPI(savePayload);
      if (response?.success) {
        notify(response?.message, "success");
        setPayload(initialValue);
        setIsThrownAway(false);
        setIsTakeBy(false);
        setIsCutSeveredChecked(false);
        handleGetData(PatientID, TransactionID);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handlePrint = async (row) => { };

  const handleTableData = (tableData) => {
    return tableData?.map((items, index) => {
      const { ResponsibilityName, ItemsTakenName, CreateDate } = items;
      return {
        SNO: index + 1,
        ResponsibilityName,
        ItemsTakenName,
        CreateDate,
        Edit: (
          <i className="fa fa-edit p-1" onClick={() => handleEdit(items)} />
        ),
        // print: (
        //   <div onClick={handlePrint}>
        //     <ReprintSVG />
        //   </div>
        // ),
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
    setIsThrownAway(false);
    setIsTakeBy(false);
    setIsCutSeveredChecked(false);
  };

  useEffect(() => {
    handleGetData(PatientID, TransactionID);
  }, []);
  console.log("payload?.Id", payload?.Id);
  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading
            title={t(
              "PATIENTS PROPERTY DECLARATION FORM AND PROTECTION CERTIFICATE"
            )}
            isBreadcrumb={false}
          />
          <div className="row p-2">
            <div className="col-xl-6 col-md-12 col-sm-12 col-12 p-2 ">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <label className="label" style={{ position: "absolute" }}>
                  {t("PATIENT VALUABLES CHECKLIST/Tick as appropriate")}
                </label>
                <div
                  style={{
                    maxHeight: "350px",
                    overflowY: "auto",
                    overflowX: "hidden",
                  }}
                >
                  <table className="table mainTable pt-2 table-bordered">
                    <thead style={{ zIndex: 1 }}>
                      <tr>
                        <th>{t("Items")}</th>
                        <th>{t("Items Name")}</th>
                        <th>{t("Items Description")}</th>
                        <th style={{ width: "10%" }}>{t("With Patient")}</th>
                        <th style={{ width: "10%" }}>{t("Returned Home")}</th>
                      </tr>
                    </thead>
                    <tbody style={{ backgroundColor: "white" }}>
                      {itemsData.map((group, gIndex) =>
                        group.items.map((item, iIndex) => (
                          <tr key={`${gIndex}-${iIndex}`}>
                            {iIndex === 0 ? (
                              <td rowSpan={group.items.length}>
                                {group.category}
                              </td>
                            ) : null}
                            <td>{item.name}</td>
                            <td>
                              <Input
                                type="text"
                                className="form-control"
                                name={item.descField}
                                value={payload[item.descField] || ""}
                                onChange={handleChange}
                              // respclass="col-4"
                              />
                            </td>
                            <td>
                              <div
                                className="form-check "
                                style={{
                                  justifyContent: "center",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  className="table-checkbox"
                                  name={item.withPatientField}
                                  checked={payload[item.withPatientField] === 1}
                                  onChange={handleChange}
                                />
                              </div>
                            </td>
                            <td>
                              <div
                                className="form-check text-center"
                                style={{
                                  justifyContent: "center",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  className="form-check-input table-checkbox"
                                  name={item.returnedField}
                                  checked={payload[item.returnedField] === 1}
                                  onChange={handleChange}
                                />
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-xl-6 col-md-6 col-sm-6 col-12 p-2 ">
              <div
                className="pt-3 pb-2 pr-2 pl-2 form-group"
                style={{
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  position: "relative",
                }}
              >
                <label className="label" style={{ position: "absolute" }}>
                  {t("Responsibility Party")}
                </label>
                <div className="row">
                  <Input
                    type="text"
                    className="form-control"
                    placeholder=""
                    id="ResponsibilityName"
                    name="ResponsibilityName"
                    value={payload?.ResponsibilityName}
                    onChange={handleChange}
                    lable={t("Name")}
                    respclass="col-sm-4 col-12"
                  />
                  <DatePicker
                    id="ResponsibilityDate"
                    name="ResponsibilityDate"
                    className="custom-calendar"
                    placeholder={VITE_DATE_FORMAT}
                    value={payload?.ResponsibilityDate}
                    lable={t("Date")}
                    respclass="col-sm-4 col-12"
                    showTime
                    hourFormat="12"
                    disable={true}
                  />
                </div>
                <div
                  className="pt-3 pb-2 pr-2 pl-2 form-group"
                  style={{
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    position: "relative",
                  }}
                >
                  <label className="label" style={{ position: "absolute" }}>
                    {t("Items taken by")}
                  </label>
                  <div className="row">
                    <Input
                      type="text"
                      className="form-control"
                      placeholder=""
                      id="ItemsTakenName"
                      name="ItemsTakenName"
                      value={payload?.ItemsTakenName}
                      onChange={handleChange}
                      lable={t("Name")}
                      respclass="col-sm-4 col-12"
                    />
                    <DatePicker
                      className="custom-calendar"
                      id="ItemsTakenDate"
                      name="ItemsTakenDate"
                      placeholder={VITE_DATE_FORMAT}
                      value={payload?.ItemsTakenDate}
                      lable={t("Date")}
                      respclass="col-sm-4 col-12"
                      showTime
                      hourFormat="12"
                      disable={true}
                    />
                  </div>
                </div>
                <div
                  className="pt-3 pb-2 pr-2 pl-2 form-group"
                  style={{
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    position: "relative",
                  }}
                >
                  <label className="label" style={{ position: "absolute" }}>
                    {t("Following Items Were")}
                  </label>
                  <div className="form-check ">
                    <input
                      checked={isCutSeveredChecked}
                      type="checkbox"
                      className="form-check-input table-checkbox"
                      onChange={(e) => setIsCutSeveredChecked(e.target.checked)}
                    />
                    <span className="form-check-label ml-2">
                      {t("Cut/Severed")}
                    </span>
                  </div>
                  {isCutSeveredChecked && (
                    <Input
                      type="text"
                      className="form-control"
                      placeholder=""
                      id="CutSevered"
                      name="CutSevered"
                      value={payload?.CutSevered}
                      onChange={handleChange}
                      respclass="col-sm-4 col-12"
                    />
                  )}
                  <div className="form-check">
                    <input
                      checked={isThrownAway}
                      type="checkbox"
                      className="form-check-input table-checkbox"
                      onChange={(e) => setIsThrownAway(e.target.checked)}
                    />
                    <span className="form-check-label ml-2">
                      {t("Thrown away due to soilage")}
                    </span>
                  </div>
                  {isThrownAway && (
                    <Input
                      type="text"
                      className="form-control"
                      placeholder=""
                      id="Thrownawayduetosoilage"
                      name="Thrownawayduetosoilage"
                      value={payload?.Thrownawayduetosoilage}
                      onChange={handleChange}
                      respclass="col-sm-4 col-12"
                    />
                  )}
                  <div className="form-check">
                    <input
                      checked={isTakeBy}
                      type="checkbox"
                      className="form-check-input table-checkbox"
                      onChange={(e) => setIsTakeBy(e.target.checked)}
                    />
                    <span className="form-check-label ml-2">
                      {t("Taken by security police")}
                    </span>
                  </div>
                  {isTakeBy && (
                    <Input
                      type="text"
                      className="form-control"
                      placeholder=""
                      id="Takenbysecuritypolice"
                      name="Takenbysecuritypolice"
                      value={payload?.Takenbysecuritypolice}
                      onChange={handleChange}
                      respclass="col-sm-4 col-12"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-2 d-flex justify-content-end">
          {payload?.Id ? (
            <>
              <button className="btn btn-sm btn-primary" onClick={handleSave}>
                {t("Update")}
              </button>
              <button
                className="btn btn-sm btn-secondary ml-2"
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
      <div>
        <Heading
          title={t("PATIENTS PROPERTY DECLARATION LIST")}
          isBreadcrumb={false}
        />
        {tableData?.length > 0 &&
          <Tables thead={THEAD} tbody={handleTableData(tableData)} />
        }
      </div>
    </>
  );
};

export default PatientPropertyForm;
