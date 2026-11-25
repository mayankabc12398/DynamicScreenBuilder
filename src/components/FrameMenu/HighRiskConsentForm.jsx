import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import TextAreaInput from "../formComponent/TextAreaInput";
import DatePicker from "../formComponent/DatePicker";
import ReactSelect from "../formComponent/ReactSelect";
import Tables from "../UI/customTable";
import { notify } from "../../utils/utils";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { RedirectURL } from "../../networkServices/PDFURL";
import {
  getBindDetailsHighRiskConsentForm,
  handleSaveHighRiskConsentForm,
  handleUpdateHighRiskConsentForm,
  highRiskConsentFormPdfApi,
} from "../../networkServices/Emergency";

// SRS-2026-0074 : High Risk Consent Form (Emergency module), form code JC/IPD/F-31.
// The signed copy is printed in English or Hindi as per the formats shared by the
// client; the language only drives the PDF template, the entry screen stays English.
const languageOptions = [
  { label: "English", value: "en" },
  { label: "Hindi", value: "hi" },
];

const initialState = {
  id: 0,
  explainedToName: "",
  natureOfDisease: "",
  patientName: "",
  patientRelationship: "",
  relativeName: "",
  relativeRelationship: "",
  witnessName: "",
  doctorName: "",
  consentObtainedBy: "",
  consentDate: new Date(),
};

const HighRiskConsentForm = ({ data }) => {
  const { t } = useTranslation();
  const ip = useLocalStorage("ip", "get");
  const { VITE_DATE_FORMAT } = import.meta.env;

  const patientID = data?.patientID || data?.PatientID;
  const transactionID = data?.transactionID || data?.TransactionID || data?.TID;

  const [tableData, setTableData] = useState([]);
  const [isUpdate, setIsUpdate] = useState(false);
  const [language, setLanguage] = useState(languageOptions[0]);
  const [payload, setPayload] = useState({ ...initialState });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({ ...prev, [name]: value }));
  };

  const thead = [
    { name: t("S.No."), width: "4%" },
    t("Explained To"),
    t("Nature of Disease"),
    t("Patient Name"),
    t("Relative Name"),
    t("Witness"),
    t("Doctor Name"),
    t("Consent Date"),
    t("Entry By"),
    t("Entry Date"),
    { name: t("Print"), width: "4%" },
    { name: t("Edit"), width: "4%" },
  ];

  const getBindData = async () => {
    try {
      const response = await getBindDetailsHighRiskConsentForm(patientID || 0);
      if (response?.success) {
        setTableData(response?.data || []);
      } else {
        setTableData([]);
      }
    } catch (error) {
      console.error(error);
      setTableData([]);
    }
  };

  const handleSave = async () => {
    if (!payload?.explainedToName?.trim()) {
      notify("Please Enter Name of Person Explained To", "error");
      return;
    }
    if (!payload?.natureOfDisease?.trim()) {
      notify("Please Enter Nature of Disease / Expected Complication", "error");
      return;
    }
    if (!payload?.doctorName?.trim()) {
      notify("Please Enter Doctor Name", "error");
      return;
    }

    const requestBody = {
      id: isUpdate ? payload?.id || 0 : 0,
      patientID: patientID || "",
      transactionID: transactionID || "",
      // Registration No. on the printed form: emergency episodes carry
      // EmergencyNo, IPD admissions carry the IPD No.
      emergencyNo: data?.EmergencyNo || data?.ipdno || "",
      // WardNo and BedNo both carry the screen's Room No value: IPD exposes it
      // as roomName, the emergency patient row as Room.
      wardNo: data?.roomName || data?.Room || "",
      bedNo: data?.roomName || data?.Room || data?.Bed || "",
      explainedToName: payload?.explainedToName || "",
      natureOfDisease: payload?.natureOfDisease || "",
      patientName: payload?.patientName || "",
      patientRelationship: payload?.patientRelationship || "",
      relativeName: payload?.relativeName || "",
      relativeRelationship: payload?.relativeRelationship || "",
      witnessName: payload?.witnessName || "",
      doctorName: payload?.doctorName || "",
      consentObtainedBy: payload?.consentObtainedBy || "",
      consentDate: payload?.consentDate,
      ipAddress: ip || "",
    };

    try {
      const response = isUpdate
        ? await handleUpdateHighRiskConsentForm(requestBody)
        : await handleSaveHighRiskConsentForm(requestBody);

      if (response?.success) {
        notify(response?.message, "success");
        setPayload({
          ...initialState,
          patientName: data?.Name || "",
          doctorName: data?.Doctor || "",
        });
        setIsUpdate(false);
        getBindData();
      } else {
        notify(response?.message || "Something went wrong", "error");
      }
    } catch (error) {
      console.error(error);
      notify("Server error", "error");
    }
  };

  const parseApiDate = (dateStr) => (dateStr ? new Date(dateStr) : null);

  const handleEdit = (ele) => {
    setIsUpdate(true);
    setPayload({
      id: ele?.ID,
      explainedToName: ele?.ExplainedToName || "",
      natureOfDisease: ele?.NatureOfDisease || "",
      patientName: ele?.PatientName || "",
      patientRelationship: ele?.PatientRelationship || "",
      relativeName: ele?.RelativeName || "",
      relativeRelationship: ele?.RelativeRelationship || "",
      witnessName: ele?.WitnessName || "",
      doctorName: ele?.DoctorName || "",
      consentObtainedBy: ele?.ConsentObtainedBy || "",
      consentDate: parseApiDate(ele?.ConsentDate) || new Date(),
    });
  };

  const handlePrint = async (ID) => {
    if (!ID) {
      notify("Please save the consent form before printing", "error");
      return;
    }
    try {
      const response = await highRiskConsentFormPdfApi(
        ID,
        language?.value || "en",
      );
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      } else {
        notify(response?.message || "Print error", "error");
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };

  useEffect(() => {
    setPayload((prev) => ({
      ...prev,
      patientName: data?.Name || "",
      doctorName: data?.Doctor || "",
    }));
    getBindData();
  }, []);

  return (
    <>
      <div className="card patient_registration border mt-1">
        <Heading title={t("HIGH RISK CONSENT")} isBreadcrumb={false} />

        <div className="p-3">
          <p className="text-right mb-2">
            <small>JC/IPD/F-31</small>
          </p>

          <div className="d-flex align-items-center flex-wrap mt-2">
            <span className="me-1">{t("I / We")}</span>
            <Input
              type="text"
              className="form-control d-inline-block mx-1"
              style={{ width: "300px" }}
              name="explainedToName"
              id="explainedToName"
              value={payload?.explainedToName}
              onChange={handleChange}
            />
            <span className="ms-1">
              {t(
                "have been explained the nature of disease & expected & complication and the patient is in serious conditions & may develop following problem which may further endanger his / her life.",
              )}
            </span>
          </div>

          <div className="row mt-3">
            <TextAreaInput
              className="form-control"
              lable={t("Nature of Disease / Expected Complication")}
            
              name="natureOfDisease"
              id="natureOfDisease"
              rows={4}
              value={payload?.natureOfDisease}
              respclass="col-12 mb-2"
              onChange={handleChange}
            />
          </div>

          <ol className="mt-2 mb-3">
            <li>
              {t(
                "I / We have understood that patient's condition can deteriorate further and that there is risk death during the stay in hospital.",
              )}
            </li>
            <li>
              {t(
                "I / We accept & give our consent for treatment, after fully understanding the verious aspects of treatment & will not hold anyone responsible for undesirable consequences.",
              )}
            </li>
            <li>
              {t(
                "I / We consent voluntary for such procedure by my signature & reconfirm that.",
              )}
            </li>
            <li>
              {t(
                "I have read & understood the information provide by the doctor. The procedure has been explained to me / us.",
              )}
            </li>
            <li>
              {t(
                "I / We were given full opportunity to ask questions to the doctor, and I / we have received satisfactory answers to all our questions.",
              )}
            </li>
            <li>{t("I declare that I am more that 18 years of age.")}</li>
            <li>
              {t(
                "That I / We have signed this consent voluntary our of my / our free will without any pressure and in my / our senses.",
              )}
            </li>
          </ol>

          <p className="mb-3">
            <strong>
              {t(
                "Note: Do Not Sign This Form Unless You Have Read It, Understood It & Agreed With What It Says.",
              )}
            </strong>
          </p>

          <div className="row">
            <Input
              type="text"
              className="form-control"
              lable={t("Patient Name")}
              name="patientName"
              id="patientName"
              value={payload?.patientName}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12 mb-2"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              lable={t("Patient Relationship")}
              name="patientRelationship"
              id="patientRelationship"
              value={payload?.patientRelationship}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12 mb-2"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              lable={t("Relative Name")}
              name="relativeName"
              id="relativeName"
              value={payload?.relativeName}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12 mb-2"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              lable={t("Relative Relationship")}
              name="relativeRelationship"
              id="relativeRelationship"
              value={payload?.relativeRelationship}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12 mb-2"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              lable={t("Witness Name (If Required)")}
              name="witnessName"
              id="witnessName"
              value={payload?.witnessName}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12 mb-2"
              onChange={handleChange}
            />
          </div>

          <p className="text-muted mb-3">
            <small>
              {t(
                "Signature and Thumb Impression of the Patient / Relative / Witness are taken manually on the printed consent form.",
              )}
            </small>
          </p>

          <p className="mb-2">
            {t(
              "I, the undersigned doctor, have explained the nature, potential risks and complications, intended benefits, expected post procedure course, and possible alternatives to the planned operation / procedure to the patient / patient representative. I believe that he / she has understood the information fully as described in this document.",
            )}
          </p>

          <div className="row">
            <Input
              type="text"
              className="form-control"
              lable={t("Doctor Name")}
              name="doctorName"
              id="doctorName"
              value={payload?.doctorName}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12 mb-2"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              lable={t("Consent Obtained By")}
              name="consentObtainedBy"
              id="consentObtainedBy"
              value={payload?.consentObtainedBy}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12 mb-2"
              onChange={handleChange}
            />
            <DatePicker
              className="custom-calendar"
              placeholder={VITE_DATE_FORMAT}
              lable={t("Date")}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12 mb-2"
              name="consentDate"
              id="consentDate"
              value={payload?.consentDate}
              showTime
              hourFormat="12"
              handleChange={handleChange}
            />
          </div>

          <div className="row align-items-center">
            <ReactSelect
              placeholderName={t("Print Language")}
              searchable={false}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              id="language"
              name="language"
              value={language}
              removeIsClearable={false}
              dynamicOptions={languageOptions}
              handleChange={(_, val) => setLanguage(val)}
            />
            <div className="col-xl-4 col-md-5 col-sm-6 col-12">
              <button className="btn btn-sm btn-success" onClick={handleSave}>
                {isUpdate ? t("Update") : t("Save")}
              </button>
              <button
                className="btn btn-sm btn-success ml-2"
                onClick={() => handlePrint(payload?.id)}
              >
                {t("Print PDF")}
              </button>
              {isUpdate && (
                <button
                  className="btn btn-sm btn-secondary ml-2"
                  onClick={() => {
                    setIsUpdate(false);
                    setPayload({
                      ...initialState,
                      patientName: data?.Name || "",
                      doctorName: data?.Doctor || "",
                    });
                  }}
                >
                  {t("Cancel")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Heading title={t("High Risk Consent Detail")} isBreadcrumb={false} />
      <div className="row p-2">
        <Tables
          thead={thead}
          tbody={tableData?.map((ele, index) => ({
            sr: index + 1,
            ExplainedToName: ele?.ExplainedToName,
            NatureOfDisease: ele?.NatureOfDisease,
            PatientName: ele?.PatientName,
            RelativeName: ele?.RelativeName,
            WitnessName: ele?.WitnessName,
            DoctorName: ele?.DoctorName,
            ConsentDate: ele?.ConsentDate,
            EntryBy: ele?.EntryBy,
            EntryDate: ele?.EntryDate,
            Print: (
              <span onClick={() => handlePrint(ele?.ID)}>
                <i
                  className="fa fa-print text-primary"
                  style={{ cursor: "pointer" }}
                />
              </span>
            ),
            Edit: (
              <span onClick={() => handleEdit(ele)}>
                <i
                  className="fa fa-edit text-primary"
                  style={{ cursor: "pointer" }}
                />
              </span>
            ),
          }))}
        />
      </div>
    </>
  );
};

export default HighRiskConsentForm;
