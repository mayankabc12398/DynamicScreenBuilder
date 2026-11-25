import { useState, useEffect } from "react";
import {
  bindDetails_History_SheetApi,
  blankPrint_History_Sheet,
  print_History_SheetApi,
  save_History_SheetApi,
} from "../../../networkServices/IVFApi";
import Heading from "../../UI/Heading";
import Input from "../../formComponent/Input";
import ReactSelect from "../../formComponent/ReactSelect";
import TextAreaInput from "../../formComponent/TextAreaInput";
import Tables from "../../UI/customTable";
import { notify } from "../../../utils/utils";
import { RedirectURL } from "../../../networkServices/PDFURL";
import { useTranslation } from "react-i18next";

const HistorySheet = (data) => {
  const {
    TransactionID: transactionID,
    PatientID: patientID,
    ivF_ID,
  } = data?.patientDetail || {};
  const [t] = useTranslation();
  const [payload, setPayload] = useState({
    id: "",
    patientID: "",
    transactionID: "",
    ivfid: "",
    chiefComplaints: "",
    menarche: "",
    mh: "",
    regularOrIrregular: "",
    scantyOrModerateHeavy: "",
    painfulOrPainless: "",
    lmp: "",
    obstetricsHistory: "",
    gravida: "",
    para: "",
    abortions: "",
    live: "",
    txt1: "",
    txt2: "",
    txt3: "",
    txt4: "",
    txt5: "",
    diet: "",
    others: "",
    dm: "",
    htn: "",
    cad: "",
    tb: "",
    thyroidDisorder: "",
    allergy: "",
    other: "",
    surgicalHistory: "",
    speciefy: "",
    familyHistory: "",
    medicalHistory: "",
    chkMedicalHis: "",
  });

  const regularOrIrregularOptions = [
    { label: t("Regular"), value: "Regular" },
    { label: t("IRRegular"), value: "Irregular" },
  ];
  const scantyOrModerateHeavyOptions = [
    { label: t("Scanty"), value: "Scanty" },
    { label: t("Moderate"), value: "Moderate" },
    { label: t("Heavy"), value: "Heavy" },
  ];

  const painfulOrPainlessOptions = [
    { label: t("Painful"), value: "Painful" },
    { label: t("Painless"), value: "Painless" },
  ];
  const Obstetrichistory = [
    { label: t("Single"), value: "Single" },
    { label: t("Married"), value: "Married" },
  ];
  const dietOPtions = [
    { label: t("Veg"), value: "veg" },
    { label: t("Non-veg"), value: "Nonveg" },
    { label: t("Lacto-Ovo-Vegetarian"), value: "LactoVegetarian" },
    { label: t("Jain"), value: "Jain" },
    { label: t("Islamic"), value: "Islamic" },
  ];
  const otherOPtions = [
    { label: t("Tobaco"), value: "Tobaco " },
    { label: t("Alcohol"), value: "Alcohol " },
    { label: t("REcreational drugs"), value: "REcreationaldrugs" },
  ];
  const yesNoOptions = [
    { label: t("Yes"), value: "Yes" },
    { label: t("No"), value: "No" },
  ];

  const THEAD = [
    { name: t("SNo"), width: "1%" },
    { name: t("ChiefComplaints") },
    { name: t("Lmp") },
    { name: t("Diet") },
    { name: t("Obstetrics History") },
    { name: t("Family History") },
    { name: t("CreatedBy") },
    { name: t("CreatedDatetime") },
    { name: t("Edit"), width: "1%" },
    { name: t("Print"), width: "1%" },
  ];
  const [tableData, setTableData] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const toNumberOrNull = (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };
  const handleSave = async () => {
    const finalPayload = {
      id: payload.id || "0",
      patientID: patientID ?? "",
      transactionID: transactionID ?? "",
      ivfid: ivF_ID ?? "",

      chiefComplaints: payload.chiefComplaints ?? "",
      menarche: payload.menarche ?? "",
      mh: payload.mh ?? "",
      regularOrIrregular: payload.regularOrIrregular ?? "",
      scantyOrModerateHeavy: payload.scantyOrModerateHeavy ?? "",
      painfulOrPainless: payload.painfulOrPainless ?? "",
      lmp: payload.lmp ?? "",
      obstetricsHistory: payload.obstetricsHistory ?? "",

      gravida: payload.gravida || 0,
      para: payload.para || 0,
      abortions: payload.abortions || 0,
      live: payload.live || 0,

      txt1: payload.txt1 ?? "",
      txt2: payload.txt2 ?? "",
      txt3: payload.txt3 ?? "",
      txt4: payload.txt4 ?? "",
      txt5: payload.txt5 ?? "",

      diet: payload.diet ?? "",
      others: payload.others ?? "",

      dm: payload.dm ?? "",
      htn: payload.htn ?? "",
      cad: payload.cad ?? "",
      tb: payload.tb ?? "",
      thyroidDisorder: payload.thyroidDisorder ?? "",
      allergy: payload.allergy ?? "",
      other: payload.other ?? "",

      surgicalHistory: payload.surgicalHistory ?? "",
      speciefy: payload.speciefy ?? "",

      familyHistory: payload.familyHistory ?? "",
      medicalHistory: payload.medicalHistory ?? "",
      chkMedicalHis: payload.chkMedicalHis ?? "",
    };

    try {
      const response = await save_History_SheetApi(finalPayload);

      if (response?.success) {
        notify(response.message, "success");
        fetchData();
        resetForm();
        setIsEdit(false);
      } else {
        notify(response?.message || "Save failed", "error");
      }
    } catch (error) {
      notify(t("Something went wrong"), "error");
      console.error(error);
    }
  };
  // const handleSave = async () => {
  //   const finalPayload = {
  //     // id: payload.id || "0",
  //     // patientID,
  //     // transactionID,
  //     // ivfid: payload.ivfid || "",

  //     // chiefComplaints: payload.chiefComplaints || "",
  //     // menarche: payload.menarche || "",
  //     // mh: payload.mh || "",
  //     // regularOrIrregular: payload.regularOrIrregular || "",
  //     // scantyOrModerateHeavy: payload.scantyOrModerateHeavy || "",
  //     // painfulOrPainless: payload.painfulOrPainless || "",
  //     // lmp: payload.lmp || "",
  //     // obstetricsHistory: payload.obstetricsHistory || "",
  //     // gravida: toNumberOrNull(payload.gravida),
  //     // para: toNumberOrNull(payload.para),
  //     // abortions: toNumberOrNull(payload.abortions),
  //     // live: toNumberOrNull(payload.live),

  //     // txt1: payload.txt1 || "",
  //     // txt2: payload.txt2 || "",
  //     // txt3: payload.txt3 || "",
  //     // txt4: payload.txt4 || "",
  //     // txt5: payload.txt5 || "",

  //     // diet: payload.diet || "",
  //     // others: payload.others || "",

  //     // dm: payload.dm || "",
  //     // htn: payload.htn || "",
  //     // cad: payload.cad || "",
  //     // tb: payload.tb || "",
  //     // thyroidDisorder: payload.thyroidDisorder || "",
  //     // allergy: payload.allergy || "",
  //     // other: payload.other || "",

  //     // surgicalHistory: payload.surgicalHistory || "",
  //     // speciefy: payload.speciefy || "",
  //     // familyHistory: payload.familyHistory || "",
  //     // medicalHistory: payload.medicalHistory || "",
  //     // chkMedicalHis: payload.chkMedicalHis || "",
  //     id: payload.id || "0",
  //     patientID: patientID ?? "",
  //     transactionID: transactionID ?? "",
  //     ivfid: ivF_ID ?? "",
  //     chiefComplaints: payload?.chiefComplaints ?? "",
  //     menarche: payload?.patientID ?? "",
  //     mh: payload?.patientID ?? "",
  //     regularOrIrregular: payload?.patientID ?? "",
  //     scantyOrModerateHeavy: payload?.patientID ?? "",
  //     painfulOrPainless: payload?.patientID ?? "",
  //     lmp: payload?.patientID ?? "",
  //     obstetricsHistory: payload?.patientID ?? "",
  //     gravida: 0,
  //     para: 0,
  //     abortions: 0,
  //     live: 0,
  //     txt1: payload?.patientID ?? "",
  //     txt2: payload?.patientID ?? "",
  //     txt3: payload?.patientID ?? "",
  //     txt4: payload?.patientID ?? "",
  //     txt5: payload?.patientID ?? "",
  //     diet: payload?.patientID ?? "",
  //     others: payload?.patientID ?? "",
  //     dm: payload?.patientID ?? "",
  //     htn: payload?.patientID ?? "",
  //     cad: payload?.patientID ?? "",
  //     tb: payload?.patientID ?? "",
  //     thyroidDisorder: payload?.patientID ?? "",
  //     allergy: payload?.patientID ?? "",
  //     other: payload?.patientID ?? "",
  //     surgicalHistory: payload?.patientID ?? "",
  //     speciefy: payload?.patientID ?? "",
  //     familyHistory: payload?.patientID ?? "",
  //     medicalHistory: payload?.patientID ?? "",
  //     chkMedicalHis: payload?.patientID ?? "",
  //   };

  //   try {
  //     const response = await save_History_SheetApi(finalPayload);

  //     if (response?.success) {
  //       notify(response.message, "success");
  //       fetchData();
  //       resetForm();
  //       setIsEdit(false);
  //     } else {
  //       notify(response?.message || "Save failed", "error");
  //     }
  //   } catch (error) {
  //     notify("Something went wrong", "error");
  //     console.error(error);
  //   }
  // };

  const handleEdit = (item) => {
    setIsEdit(true);

    setPayload({
      id: item?.ID?.toString() || "",
      patientID: item?.PatientID || "",
      transactionID: item?.TransactionID || "",
      ivfid: item?.IVFID || "",

      chiefComplaints: item?.ChiefComplaints || "",
      menarche: item?.Menarche || "",
      mh: item?.MH || "",
      regularOrIrregular: item?.RegularOrIrregular || "",
      scantyOrModerateHeavy: item?.ScantyOrModerateHeavy || "",
      painfulOrPainless: item?.PainfulOrPainless || "",
      lmp: item?.Lmp || "",
      obstetricsHistory: item?.ObstetricsHistory || "",
      gravida: item?.Gravida || "",
      para: item?.Para || "",
      abortions: item?.Aborations || "",
      live: item?.Live || "",

      txt1: item?.Txt1 || "",
      txt2: item?.Txt2 || "",
      txt3: item?.Txt3 || "",
      txt4: item?.Txt4 || "",
      txt5: item?.Txt5 || "",

      diet: item?.Diet || "",
      others: item?.Others || "",

      dm: item?.Dm || "",
      htn: item?.HTN || "",
      cad: item?.CAD || "",
      tb: item?.Tb || "",
      thyroidDisorder: item?.ThyroidDisorder || "",
      allergy: item?.Allergy || "",
      other: item?.Other || "",

      surgicalHistory: item?.SurgicalHistory || "",
      speciefy: item?.Speciefy || "",
      familyHistory: item?.FamilyHistory || "",
      medicalHistory: item?.MedicalHistory || "",
      chkMedicalHis: item?.chkMedicalHis || "",
    });
  };

  const resetForm = () => {
    setPayload({
      id: "",
      patientID: "",
      transactionID: "",
      ivfid: "",
      chiefComplaints: "",
      menarche: "",
      mh: "",
      regularOrIrregular: "",
      scantyOrModerateHeavy: "",
      painfulOrPainless: "",
      lmp: "",
      obstetricsHistory: "",
      gravida: "",
      para: "",
      abortions: "",
      live: "",
      txt1: "",
      txt2: "",
      txt3: "",
      txt4: "",
      txt5: "",
      diet: "",
      others: "",
      dm: "",
      htn: "",
      cad: "",
      tb: "",
      thyroidDisorder: "",
      allergy: "",
      other: "",
      surgicalHistory: "",
      speciefy: "",
      familyHistory: "",
      medicalHistory: "",
      chkMedicalHis: "",
    });
  };
  const fetchData = async () => {
    const res = await bindDetails_History_SheetApi(transactionID);
    if (res?.success) {
      setTableData(res?.data);
    } else {
      notify(res?.message, "error");
      setTableData([]);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  const handleSelect = (name, val) => {
    setPayload((prev) => ({
      ...prev,
      [name]: val?.value || "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const hanldleprint = async () => {
    try {
      const response = await blankPrint_History_Sheet(1);

      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleRowPrint = async (item) => {
    try {
      const response = await print_History_SheetApi(transactionID, item?.ID);
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  return (
    <>
      {/* <Heading title={t("History Sheet")} /> */}
      <div className="m-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("Entry details")} isBreadcrumb={false} />
          <div className="row p-2">
            <TextAreaInput
              name="chiefComplaints"
              id="chiefComplaints"
              placeholder=""
              lable={t("Chief Complaints")}
              value={payload.chiefComplaints}
              onChange={handleChange}
              rows={2}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
          </div>
          <Heading title={t("Histoory")} isBreadcrumb={false} />
          <div className="row p-2">
            <Input
              type="number"
              className="form-control"
              name="menarche"
              id="menarche"
              placeholder=""
              lable={t("Menarche")}
              value={payload?.menarche}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              name="mh"
              id="mh"
              placeholder=""
              lable={t("MH")}
              value={payload?.mh}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("RegularOrIrregular")}
              id="regularOrIrregular"
              name="regularOrIrregular"
              searchable={true}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              removeIsClearable={true}
              dynamicOptions={regularOrIrregularOptions}
              value={payload?.regularOrIrregular}
              handleChange={handleSelect}
            />
            <ReactSelect
              placeholderName={t("ScantyOrModerateHeavy")}
              id="scantyOrModerateHeavy"
              name="scantyOrModerateHeavy"
              searchable={true}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              removeIsClearable={true}
              dynamicOptions={scantyOrModerateHeavyOptions}
              value={payload?.scantyOrModerateHeavy}
              handleChange={handleSelect}
            />
            <ReactSelect
              placeholderName={t("PainfulOrPainless")}
              id="painfulOrPainless"
              name="painfulOrPainless"
              searchable={true}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              removeIsClearable={true}
              dynamicOptions={painfulOrPainlessOptions}
              value={payload?.painfulOrPainless}
              handleChange={handleSelect}
            />
            <Input
              type="text"
              className="form-control"
              name="lmp"
              id="lmp"
              placeholder=""
              lable={t("L.M.P")}
              value={payload?.lmp}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Obstetrichistory")}
              id="obstetricsHistory"
              name="obstetricsHistory"
              searchable={true}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4"
              removeIsClearable={true}
              dynamicOptions={Obstetrichistory}
              value={payload?.obstetricsHistory}
              handleChange={handleSelect}
            />
            <Input
              type="number"
              className="form-control"
              name="gravida"
              id="gravida"
              placeholder=""
              lable={t("Gravida")}
              value={payload?.gravida}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />

            <Input
              type="number"
              className="form-control"
              name="para"
              id="para"
              placeholder=""
              lable={t("Para")}
              value={payload?.para}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />

            <Input
              type="number"
              className="form-control"
              name="abortions"
              id="abortions"
              placeholder=""
              lable={t("Abortions")}
              value={payload?.abortions}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />

            <Input
              type="number"
              className="form-control"
              name="live"
              id="live"
              placeholder=""
              lable={t("Live")}
              value={payload?.live}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              name="txt1"
              id="txt1"
              placeholder=""
              lable={t("Txt1")}
              value={payload?.txt1}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              name="txt2"
              id="txt2"
              placeholder=""
              lable={t("Txt2")}
              value={payload?.txt2}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              name="txt3"
              id="txt3"
              placeholder=""
              lable={t("Txt3")}
              value={payload?.txt3}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              name="txt4"
              id="txt4"
              placeholder=""
              lable={t("Txt4")}
              value={payload?.txt4}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              name="txt5"
              id="txt5"
              placeholder=""
              lable={t("Txt5")}
              value={payload?.txt5}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
          </div>
          <Heading title={t("Personal History")} isBreadcrumb={false} />
          <div className="row p-2">
            <ReactSelect
              placeholderName={t("Diet")}
              id="diet"
              name="diet"
              searchable={true}
              removeIsClearable={true}
              value={payload?.diet}
              dynamicOptions={dietOPtions}
              handleChange={handleSelect}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Others")}
              id="others"
              name="others"
              searchable={true}
              removeIsClearable={true}
              value={payload?.others}
              dynamicOptions={otherOPtions}
              handleChange={handleSelect}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
          </div>
          <Heading title={t("Medical History")} isBreadcrumb={false} />
          <div className="row p-2">
            <ReactSelect
              placeholderName={t("Chk Medical History")}
              id="chkMedicalHis"
              name="chkMedicalHis"
              searchable={true}
              removeIsClearable={true}
              value={payload?.chkMedicalHis}
              dynamicOptions={yesNoOptions}
              handleChange={(name, val) => {
                handleSelect(name, val);

                if (val?.value === "No") {
                  setPayload((prev) => ({
                    ...prev,
                    medicalHistory: "",
                  }));
                }
              }}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />

            {payload?.chkMedicalHis === "Yes" && (
              <Input
                type="text"
                className="form-control"
                name="medicalHistory"
                id="medicalHistory"
                placeholder=""
                lable={t("Medical History")}
                value={payload?.medicalHistory}
                onChange={handleChange}
                respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              />
            )}

            <Input
              type="dm"
              className="form-control"
              name="dm"
              id="dm"
              placeholder=""
              lable={t("DM")}
              value={payload?.dm}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              name="htn"
              id="htn"
              placeholder=""
              lable={t("HTN")}
              value={payload?.htn}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              name="cad"
              id="cad"
              placeholder=""
              lable={t("CAD")}
              value={payload?.cad}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              name="tb"
              id="tb"
              placeholder=""
              lable={t("T.B")}
              value={payload?.tb}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              name="thyroidDisorder"
              id="thyroidDisorder"
              placeholder=""
              lable={t("Thyroid disorder")}
              value={payload?.thyroidDisorder}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              name="allergy"
              id="allergy"
              placeholder=""
              lable={t("Allergy")}
              value={payload?.allergy}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              name="other"
              id="other"
              placeholder=""
              lable={t("Other")}
              value={payload?.other}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
          </div>
          <Heading title={t("Surgical History")} isBreadcrumb={false} />
          <div className="row p-2">
            <ReactSelect
              placeholderName={t("Surgical History")}
              id="surgicalHistory"
              name="surgicalHistory"
              searchable={true}
              removeIsClearable={true}
              value={payload?.surgicalHistory}
              dynamicOptions={yesNoOptions}
              handleChange={handleSelect}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <TextAreaInput
              name="speciefy"
              id="speciefy"
              placeholder=""
              lable={t("Speciefy")}
              value={payload.speciefy}
              onChange={handleChange}
              rows={2}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />

            <TextAreaInput
              name="familyHistory"
              id="familyHistory"
              placeholder=""
              lable={t("Family History")}
              value={payload.familyHistory}
              onChange={handleChange}
              rows={2}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
          </div>
          <div className="d-flex justify-content-end gap-2 p-2">
            <button
              type="button"
              className="btn btn-primary mr-2"
              onClick={handleSave}
            >
              {isEdit ? t("Update") : t("Save")}
            </button>

            <button
              type="button"
              className="btn btn-success"
              onClick={hanldleprint}
            >
              {t("Print Blank")}
            </button>
          </div>
        </div>
      </div>
      {tableData && tableData.length > 0 && (
        <>
          <Heading title={t("History")} />
          <Tables
            thead={THEAD}
            tbody={tableData.map((item, index) => ({
              SNo: index + 1,
              ChiefComplaints: item?.ChiefComplaints,
              Lmp: item?.Lmp,
              Diet: item?.Diet,
              "Obstetrics History": item?.ObstetricsHistory,
              "Family History": item?.Endometriosis,
              CreatedBy: item?.EnterBy,
              CreatedDatetime: item?.CreatedDatetime,

              Edit: (
                <i
                  className="fa fa-edit p-1"
                  onClick={() => handleEdit(item)}
                  style={{ cursor: "pointer", color: "blue" }}
                  title={t("Edit")}
                />
              ),

              Print: (
                <i
                  className="fa fa-print p-1"
                  onClick={() => handleRowPrint(item)}
                  style={{ cursor: "pointer", color: "green" }}
                  title={t("Print")}
                />
              ),
            }))}
          />
        </>
      )}
    </>
  );
};

export default HistorySheet;
