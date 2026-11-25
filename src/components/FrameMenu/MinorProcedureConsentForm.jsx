import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../UI/Heading";
import Input from "../formComponent/Input";
import DatePicker from "../formComponent/DatePicker";
import ReactSelect from "../formComponent/ReactSelect";
import Tables from "../UI/customTable";
import { notify } from "../../utils/utils";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { RedirectURL } from "../../networkServices/PDFURL";
import {
  getBindDetailsMinorProcedureConsentForm,
  handleSaveMinorProcedureConsentForm,
  handleUpdateMinorProcedureConsentForm,
  minorProcedureConsentFormPdfApi,
} from "../../networkServices/Emergency";

// SRS-2026-0074 : Minor Procedure Consent Form (Emergency module).
// The signed copy is printed in English or Hindi as per the formats shared by the
// client; the language only drives the PDF template, the entry screen stays English.
const languageOptions = [
  { label: "English", value: "en" },
  { label: "Hindi", value: "hi" },
];

const initialState = {
  id: 0,
  doctorName: "",
  procedureName: "",
  patientRelativeName: "",
  relationWithPatient: "",
  witnessName: "",
  consentDate: new Date(),
};

const MinorProcedureConsentForm = ({ data }) => {
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
    t("Procedure Name"),
    t("Doctor Name"),
    t("Patient / Relative"),
    t("Relation With Patient"),
    t("Witness"),
    t("Consent Date"),
    t("Entry By"),
    t("Entry Date"),
    { name: t("Print"), width: "4%" },
    { name: t("Edit"), width: "4%" },
  ];

  const getBindData = async () => {
    try {
      const response = await getBindDetailsMinorProcedureConsentForm(
        patientID || 0,
      );
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
    if (!payload?.doctorName?.trim()) {
      notify("Please Enter Doctor Name", "error");
      return;
    }
    if (!payload?.procedureName?.trim()) {
      notify("Please Enter Name of Procedure", "error");
      return;
    }
    if (!payload?.patientRelativeName?.trim()) {
      notify("Please Enter Name of Patient / Relatives", "error");
      return;
    }

    const requestBody = {
      id: isUpdate ? payload?.id || 0 : 0,
      patientID: patientID || "",
      transactionID: transactionID || "",
      emergencyNo: data?.EmergencyNo || "",
      wardNo: data?.Room || "",
      // BedNo stores the screen's Room No value: IPD exposes it as roomName,
      // the emergency patient row as Room.
      bedNo: data?.roomName || data?.Room || data?.Bed || "",
      doctorName: payload?.doctorName || "",
      procedureName: payload?.procedureName || "",
      patientRelativeName: payload?.patientRelativeName || "",
      relationWithPatient: payload?.relationWithPatient || "",
      witnessName: payload?.witnessName || "",
      consentDate: payload?.consentDate,
      ipAddress: ip || "",
    };

    try {
      const response = isUpdate
        ? await handleUpdateMinorProcedureConsentForm(requestBody)
        : await handleSaveMinorProcedureConsentForm(requestBody);

      if (response?.success) {
        notify(response?.message, "success");
        setPayload({ ...initialState, doctorName: data?.Doctor || "" });
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
      doctorName: ele?.DoctorName || "",
      procedureName: ele?.ProcedureName || "",
      patientRelativeName: ele?.PatientRelativeName || "",
      relationWithPatient: ele?.RelationWithPatient || "",
      witnessName: ele?.WitnessName || "",
      consentDate: parseApiDate(ele?.ConsentDate) || new Date(),
    });
  };

  const handlePrint = async (ID) => {
    if (!ID) {
      notify("Please save the consent form before printing", "error");
      return;
    }
    try {
      const response = await minorProcedureConsentFormPdfApi(
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
    setPayload((prev) => ({ ...prev, doctorName: data?.Doctor || "" }));
    getBindData();
  }, []);

  return (
    <>
      <div className="card patient_registration border mt-1">
        <Heading
          title={t("MINOR PROCEDURE CONSENT FORM")}
          isBreadcrumb={false}
        />

        <div className="p-3">
         

          <div className="mb-3">
            <strong>{t("Instructions :")}</strong>
            <ol className="mt-2 mb-0">
              <li>
                {t(
                  "The consent forms should be signed by the patient himself / herself he / she is an adult and in sound frame of mind.",
                )}
              </li>
              <li>
                {t(
                  "The consent form will be signed by the parent / guardian / surrogate in case of minor or where the patient lacks the ability to make informed decision.",
                )}
              </li>
            </ol>
          </div>

          <div className="mb-3">
            <strong>{t("Procedure :")}</strong>

            <div className="d-flex align-items-center flex-wrap mt-2">
              <span className="me-1">{t("I hereby authorize to Dr.")}</span>
              <Input
                type="text"
                className="form-control d-inline-block mx-1"
                style={{ width: "300px" }}
                name="doctorName"
                id="doctorName"
                value={payload?.doctorName}
                onChange={handleChange}
              />
              <span className="ms-1">
                {t(
                  "and whomsoever he may designated as his assistants to perform the following procedure and / or alternative procedure necessary to treat my condition.",
                )}
              </span>
            </div>

            <div className="d-flex align-items-center flex-wrap mt-2">
              <span className="me-1">
                {t("Name of Procedure to be performed")}
              </span>
              <Input
                type="text"
                className="form-control d-inline-block mx-1"
                style={{ width: "400px" }}
                name="procedureName"
                id="procedureName"
                value={payload?.procedureName}
                onChange={handleChange}
              />
            </div>

            <ul className="mt-3 mb-0">
              <li>
                {t(
                  "I understand the reason for the procedure / treatment being carried in good faith and in my (patient's) best interest.",
                )}
              </li>
              <li>
                {t(
                  "I have been explained the risk and benefits and alternative associated with the procedures.",
                )}
              </li>
              <li>
                {t(
                  "Risk : This authorization is given with the understanding that any procedure involve some risks and hazards, like infection, bleeding, injury, blood clot, allergic reactions and other they can be serious or possible fatal. My physician has explained specific risk for this procedure to me.",
                )}
              </li>
              <li>
                {t(
                  "Alternative : All the feasible alternative treatment or procedures, including the option of taking no action, with description of risk and protectial complications associated with the alternatives have been explained to me.",
                )}
              </li>
              <li>
                {t(
                  "I have been given an opportunity to ask all / any questions and all my queries are answered to my full satisfaction.",
                )}
              </li>
            </ul>
          </div>

          <p className="mb-3">
            <strong>
              {t(
                "I CERTIFY THAT THE STATEMENT MADE IN THE CONSENT FORM HAVE BEEN READ OVER AND EXPLAINED TO ME IN MY LANGUAGE AND I HAVE FULLY UNDERSTOOD THE IMPLICATIONS OF THE ABOVE CONSENT.",
              )}
            </strong>
          </p>

          <div className="row align-items-center">
            <Input
              type="text"
              className="form-control"
              lable={t("Name of Patient / Relatives")}
              name="patientRelativeName"
              id="patientRelativeName"
              value={payload?.patientRelativeName}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12 mb-2"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              lable={t("Relation With Patient")}
              name="relationWithPatient"
              id="relationWithPatient"
              value={payload?.relationWithPatient}
              respclass="col-xl-3 col-md-4 col-sm-6 col-12 mb-2"
              onChange={handleChange}
            />
            <Input
              type="text"
              className="form-control"
              lable={t("Name of Witness")}
              name="witnessName"
              id="witnessName"
              value={payload?.witnessName}
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

          <p className="text-muted mb-3">
            <small>
              {t(
                "Signature of Patient / Relatives, Signature of Doctors and Signature of Witness are signed manually on the printed consent form.",
              )}
            </small>
          </p>

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

      <Heading
        title={t("Minor Procedure Consent Form Detail")}
        isBreadcrumb={false}
      />
      <div className="row p-2">
        <Tables
          thead={thead}
          tbody={tableData?.map((ele, index) => ({
            sr: index + 1,
            ProcedureName: ele?.ProcedureName,
            DoctorName: ele?.DoctorName,
            PatientRelativeName: ele?.PatientRelativeName,
            RelationWithPatient: ele?.RelationWithPatient,
            WitnessName: ele?.WitnessName,
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

export default MinorProcedureConsentForm;
