import React, { useEffect, useState } from "react";
import TimePicker from "../formComponent/TimePicker";
import DatePicker from "../formComponent/DatePicker";
import Input from "../formComponent/Input";
import { useTranslation } from "react-i18next";
import UniversalDynamicTable from "../UI/customTable/insertionOFcentralTable/UniversalDynamicTable ";
import Heading from "../UI/Heading";
import Tables from "../UI/customTable";
import { ReprintSVG } from "../SvgIcons";
import { notify } from "../../utils/ustil2";
import {
  BindDetailsInsertionOfCentralAPI,
  SaveSurgerySafetyAPI,
  UpdateInsertionOfCentralAPI,
} from "../../networkServices/OT/otAPI";
import moment from "moment";
import { timeFormateDate } from "../../utils/utils";

const InsertionOfCentralVenousCatheter = ({ data }) => {
  const PatientID = data?.PatientID;
  const TransactionID = data?.TransactionID;

  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;

  const initialValue = {
    PatientID: "",
    TransactionID: "",
    ID: "",

    Date: new Date(),
    Time: new Date(),
    StartDate: new Date(),
    StartTime: new Date(),
    EndDate: new Date(),
    EndTime: new Date(),
    PostInsertion: "",
    TypeOfCatheter: "",
    CatheterSite: "",
    ProcedureAssistant: "",

    Proceduralist: "",

    Verification1: "",
    Verification2: "",
    Verification3: "",
    Verification4: "",
    Verification5: "",
    Verification6: "",
    Verification7: "",
    Verification8: "",
    Verification9: "",

    Procedure1: "",
    Procedure2: "",
    Procedure3: "",
    Procedure4: "",
    Procedure5: "",
    Procedure6: "",
    Procedure7: "",
    Procedure8: "",
    Procedure9: "",
    Procedure10: "",
    Procedure11: "",
    Procedure12: "",
    Explain1: "",

    PostProcedure1: "",
    PostProcedure2: "",
    PostProcedure3: "",
    PostProcedure4: "",
    Explain2: "",

    CreatedBy: "",
    CreatedDate: "",
  };
  const THEAD = [
    t("S.No"),
    t("UHID"),
    t("PostInsertion"),
    t("Entry By"),
    t("EntryDate"),
    t("Entry Time"),
    t("Start Time"),
    t("End Date"),
    t("End Time"),
    t("Edit"),
    // "Print",
  ];

  const [payload, setPayload] = useState(initialValue);
  const [tableData, setTableData] = useState([]);

  const Options = [
    { value: "0", label: t("No") },
    { value: "1", label: t("Yes") },
  ];

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

  const table1 = [
    {
      label: t("Correct patient verified by using two patient Identifiers"),
      field: "Verification1",
      type: "select",
    },
    {
      label: t("Correct Site Identified"),
      field: "Verification2",
      type: "select",
    },
    {
      label: t("Correct Procedure Verified"),
      field: "Verification3",
      type: "select",
    },
    {
      label: t("Completed Correct Signed Procedure Consent Form"),
      field: "Verification4",
      type: "select",
    },
    {
      label: t("Relevant Documentation Available"),
      field: "Verification5",
      type: "select",
    },
    // {
    //   label: "Allergies",
    //   field: "Verification6",
    //   type: "text",
    // },
    {
      label:
        t("Any safety Precautions dictated by patient history on medication use"),
      field: "Verification6",
      type: "select",
    },
    // {
    //   label: "Explanation",
    //   field: "Verification8",
    //   type: "text",
    // },
    {
      label:
        t("Physical Examination of the patient done to establish suitability for central line insertion"),
      field: "Verification7",
      type: "select",
    },
    {
      label:
        t("Assessment of most suitable site for central line insertion done/"),
      field: "Verification8",
      type: "select",
    },
    {
      label:
        t("Patient/Family received education:prevention of central line associated blood stream infections"),
      field: "Verification9",
      type: "select",
    },
  ];

  const table2 = [
    {
      label: t("0.5% to 2% chlorohexidine in 70% alcohol used to disinfect site"),
      field: "Procedure1",
      type: "select",
    },
    {
      label: t("Chlorohexidine allowed to dry before skin puncture"),
      field: "Procedure2",
      type: "select",
    },
    {
      label: t("Hand hygiene performed before catheter insertion or manipuation"),
      field: "Procedure3",
      type: "select",
    },
    {
      label: t("Hand cover mask and sterile gown and gloves worn for procedure"),
      type: "labelOnly",
    },
    {
      label: t("Procedure Assistant"),
      field: "Procedure4",
      type: "select",
    },

    {
      label: t("Large Sterile drapes used as per protocol"),
      field: "Procedure5",
      type: "select",
    },

    {
      label: t("Sterile Field maintained throughout procedure"),
      field: "Procedure6",
      type: "select",
    },
    {
      label: t("Dressing applied using sterile technique"),
      field: "Procedure7",
      type: "select",
    },
    {
      label: t("Dressing dated as per policy"),
      field: "Procedure8",
      type: "select",
    },
    {
      label: t("Central line insertion guided by ultrasound"),
      field: "Procedure9",
      type: "select",
    },
    {
      label: t("Femoral vein not used unless other sites are not available"),
      field: "Procedure10",
      type: "select",
    },
    {
      label: t("Explain"),
      field: "Explain1",
      type: "text",
    },
  ];
  const table3 = [
    {
      label: t("Procedure Documented in the patients medical record"),
      field: "PostProcedure1",
      type: "select",
    },
    {
      label: t("Post check X-Ray ordered"),
      field: "PostProcedure2",
      type: "select",
    },
    {
      label: t("Confirmation of correct placement received"),
      field: "PostProcedure3",
      type: "select",
    },
    {
      label: t("Any Equipment Problems to be addressed"),
      field: "PostProcedure4",
      type: "select",
    },

    {
      label: t("Explain"),
      field: "Explain2",
      type: "text",
    },
  ];

  const handleTable1 = (data) => {
    return data.map((row) => ({
      ...row,
      value: payload[row.field] || "",
    }));
  };

  const handleEdit = (row) => {
    console.log(row.StartTime);
    setPayload({
      ID: row.ID || "",
      PatientID: row.PatientID || "",
      TransactionID: row.TransactionID || "",
      Date: new Date(row.Date1) || "",
      Time: timeFormateDate(row.Time1) || "",
      StartDate: new Date(row.StartDate1) || "",
      StartTime: timeFormateDate(row.StartTime1) || "",
      EndDate: new Date(row.EndDate1) || "",
      EndTime: timeFormateDate(row.EndTime1) || "",
      PostInsertion: row.PostInsertion || "",
      TypeOfCatheter: row.TypeOfCatheter || "",
      CatheterSite: row.CatheterSite || "",
      ProcedureAssistant: row.ProcedureAssistant || "",
      Proceduralist: row.Proceduralist || "",

      Verification1: row.Verification1 || "",
      Verification2: row.Verification2 || "",
      Verification3: row.Verification3 || "",
      Verification4: row.Verification4 || "",
      Verification5: row.Verification5 || "",
      Verification6: row.Verification6 || "",
      Verification7: row.Verification7 || "",
      Verification8: row.Verification8 || "",
      Verification9: row.Verification9 || "",

      Procedure1: row.Procedure1 || "",
      Procedure2: row.Procedure2 || "",
      Procedure3: row.Procedure3 || "",
      Procedure4: row.Procedure4 || "",
      Procedure5: row.Procedure5 || "",
      Procedure6: row.Procedure6 || "",
      Procedure7: row.Procedure7 || "",
      Procedure8: row.Procedure8 || "",
      Procedure9: row.Procedure9 || "",
      Procedure10: row.Procedure10 || "",
      Procedure11: row.Procedure11 || "",
      Procedure12: row.Procedure12 || "",
      Explain1: row.Explain1 || "",

      PostProcedure1: row.PostProcedure1 || "",
      PostProcedure2: row.PostProcedure2 || "",
      PostProcedure3: row.PostProcedure3 || "",
      PostProcedure4: row.PostProcedure4 || "",
      Explain2: row.Explain2 || "",

      CreatedBy: row.CreatedBy || "",
      CreatedDate: row.CreatedDate || "",
    });
  };

  const handlePrint = async (row) => {};

  const handleTableData = (tableData) => {
    return tableData?.map((items, index) => {
      const {
        PatientID,
        EmpName,
        Date1,
        Time1,
        StartDate1,
        StartTime1,
        EndDate1,
        EndTime1,
      } = items;
      return {
        SNO: index + 1,
        PatientID,
        EmpName,
        Date1,
        Time1,
        StartDate1,
        StartTime1,
        EndDate1,
        EndTime1,
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

  const block1Config = [
    {
      component: "DatePicker",
      id: "Date",
      name: "Date",
      label: t("Date"),
      respclass: "col-sm-2 col-12",
      extra: {
        placeholder: VITE_DATE_FORMAT,
        className: "custom-calendar",
        maxDate: new Date(),
      },
      disabled: true,
    },
    {
      component: "TimePicker",
      id: "Time",
      name: "Time",
      label: t("Time"),
      respclass: "col-sm-2 col-12",
      disabled: true,
    },
    {
      component: "DatePicker",
      id: "StartDate",
      name: "StartDate",
      label: t("Start Date"),
      respclass: "col-sm-2 col-12",
      extra: {
        placeholder: VITE_DATE_FORMAT,
        className: "custom-calendar",
        maxDate: new Date(),
      },
      disabled: true,
    },
    {
      component: "TimePicker",
      id: "StartTime",
      name: "StartTime",
      label: t("Start Time"),
      respclass: "col-sm-2 col-12",
      disabled: true,
    },
    {
      component: "DatePicker",
      id: "EndDate",
      name: "EndDate",
      label: t("End Date"),
      respclass: "col-sm-2 col-12",
      extra: {
        placeholder: VITE_DATE_FORMAT,
        className: "custom-calendar",
        minDate: new Date(),
      },
    },
    {
      component: "TimePicker",
      id: "EndTime",
      name: "EndTime",
      label: t("End Time"),
      respclass: "col-sm-2 col-12",
    },

    {
      component: "TimePicker",
      id: "PostInsertion",
      name: "PostInsertion",
      label: t("Post Insertion"),
      respclass: "col-sm-2 col-12",
      disabled: true,
    },
    {
      component: "Input",
      id: "TypeOfCatheter",
      name: "TypeOfCatheter",
      label: t("Type Of Catheter"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "CatheterSite",
      name: "CatheterSite",
      label: t("Catheter Site"),
      respclass: "col-sm-2 col-12",
    },
    {
      component: "Input",
      id: "ProcedureAssistant",
      name: "ProcedureAssistant",
      label: t("Procedure Assistant"),
      respclass: "col-sm-2 col-12",
    },
  ];

  const renderField = (field) => {
    const commonProps = {
      id: field.id,
      name: field.name,
      lable: t(field.label),
      respclass: field.respclass,
      value: payload[field.name],
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
            disable={field.disabled}
          />
        );

      case "TimePicker":
        return (
          <TimePicker
            {...commonProps}
            placeholderName={t("Time")}
            handleChange={handleDateTimeChange}
            disable={field.disabled}
          />
        );

      default:
        return null;
    }
  };

  const handleGetData = async (TransactionID, PatientID) => {
    try {
      const APIresponse = await BindDetailsInsertionOfCentralAPI(
        TransactionID,
        PatientID
      );

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

  const handleSave = async () => {
    const savePayload = {
      PatientID: PatientID,
      TransactionID: TransactionID,

      Date: moment(payload.Date).format("DD-MMM-YYYY"),
      Time: moment(payload.Time).format("hh:mm A"),
      StartDate: moment(payload.StartDate).format("DD-MMM-YYYY"),
      StartTime: moment(payload.StartTime).format("hh:mm A"),
      EndDate: moment(payload.EndDate).format("DD-MMM-YYYY"),
      EndTime: moment(payload.EndTime).format("hh:mm A"),

      PostInsertion: payload.PostInsertion,
      TypeOfCatheter: payload.TypeOfCatheter,
      CatheterSite: payload.CatheterSite,
      ProcedureAssistant: payload.ProcedureAssistant,

      Proceduralist: payload.Proceduralist,

      Verification1: payload.Verification1,
      Verification2: payload.Verification2,
      Verification3: payload.Verification3,
      Verification4: payload.Verification4,
      Verification5: payload.Verification5,
      Verification6: payload.Verification6,
      Verification7: payload.Verification7,
      Verification8: payload.Verification8,
      Verification9: payload.Verification9,

      Procedure1: payload.Procedure1,
      Procedure2: payload.Procedure2,
      Procedure3: payload.Procedure3,
      Procedure4: payload.Procedure4,
      Procedure5: payload.Procedure5,
      Procedure6: payload.Procedure6,
      Procedure7: payload.Procedure7,
      Procedure8: payload.Procedure8,
      Procedure9: payload.Procedure9,
      Procedure10: payload.Procedure10,
      Procedure11: payload.Procedure11,
      Procedure12: payload.Procedure12,
      Explain1: payload.Explain1,

      PostProcedure1: payload.PostProcedure1,
      PostProcedure2: payload.PostProcedure2,
      PostProcedure3: payload.PostProcedure3,
      PostProcedure4: payload.PostProcedure4,
      Explain2: payload.Explain2,
    };
    try {
      const response = await SaveSurgerySafetyAPI(savePayload);
      if (response?.success) {
        notify(response?.message, "success");
        setPayload(initialValue);
        handleGetData(TransactionID, PatientID);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleUpdate = async () => {
    const savePayload = {
      ID: payload.ID,
      Date: payload.Date,
      Time: payload.Time,
      StartDate: payload.StartDate,
      StartTime: payload.StartTime,
      EndDate: payload.EndDate,
      EndTime: payload.EndTime,

      PostInsertion: payload.PostInsertion,
      TypeOfCatheter: payload.TypeOfCatheter,
      CatheterSite: payload.CatheterSite,
      ProcedureAssistant: payload.ProcedureAssistant,

      Proceduralist: payload.Proceduralist,

      Verification1: payload.Verification1,
      Verification2: payload.Verification2,
      Verification3: payload.Verification3,
      Verification4: payload.Verification4,
      Verification5: payload.Verification5,
      Verification6: payload.Verification6,
      Verification7: payload.Verification7,
      Verification8: payload.Verification8,
      Verification9: payload.Verification9,

      Procedure1: payload.Procedure1,
      Procedure2: payload.Procedure2,
      Procedure3: payload.Procedure3,
      Procedure4: payload.Procedure4,
      Procedure5: payload.Procedure5,
      Procedure6: payload.Procedure6,
      Procedure7: payload.Procedure7,
      Procedure8: payload.Procedure8,
      Procedure9: payload.Procedure9,
      Procedure10: payload.Procedure10,
      Procedure11: payload.Procedure11,
      Procedure12: payload.Procedure12,
      Explain1: payload.Explain1,

      PostProcedure1: payload.PostProcedure1,
      PostProcedure2: payload.PostProcedure2,
      PostProcedure3: payload.PostProcedure3,
      PostProcedure4: payload.PostProcedure4,
      Explain2: payload.Explain2,
    };
    try {
      const response = await UpdateInsertionOfCentralAPI(savePayload);
      if (response?.success) {
        notify(response?.message, "success");
        setPayload(initialValue);
        handleGetData(TransactionID, PatientID);
      } else {
        notify(response?.message, "error");
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

  useEffect(() => {
    handleGetData(TransactionID, PatientID);
  }, []);

  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading
            title={t("Insertion Of Central Venous Catheter")}
            isBreadcrumb={false}
          />
          <div className="row p-2">
            {block1Config.map((field, index) => (
              <React.Fragment key={index}>{renderField(field)}</React.Fragment>
            ))}
          </div>
          <Heading title={t("Time Out Verification")} isBreadcrumb={false} />
          <div className="row p-2">
            <UniversalDynamicTable
              rows={handleTable1(table1)}
              payload={payload}
              handleSelectChange={handleSelectChange}
              handleChange={handleChange}
              Options={Options}
            />
          </div>
          <Heading title={t("Procedure")} isBreadcrumb={false} />
          <div className="row p-2">
            <UniversalDynamicTable
              rows={handleTable1(table2)}
              payload={payload}
              handleSelectChange={handleSelectChange}
              handleChange={handleChange}
              Options={Options}
            />
          </div>
          <Heading title={t("Post Procedure Checks")} isBreadcrumb={false} />
          <div className="row p-2">
            <UniversalDynamicTable
              rows={handleTable1(table3)}
              payload={payload}
              handleSelectChange={handleSelectChange}
              handleChange={handleChange}
              Options={Options}
            />
          </div>
        </div>
        <div className="p-2 d-flex justify-content-end">
          {payload?.ID ? (
            <>
              <button className="btn btn-sm btn-primary" onClick={handleUpdate}>
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
      <div className="col-12">
        <Tables thead={THEAD} tbody={handleTableData(tableData)} />
      </div>
    </>
  );
};

export default InsertionOfCentralVenousCatheter;
