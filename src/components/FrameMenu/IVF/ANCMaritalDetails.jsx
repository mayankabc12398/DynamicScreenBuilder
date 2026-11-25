import { useTranslation } from "react-i18next";
import {
  bindDetails_Marital_Details,
  blankPrint_Marital_Details,
  print_Marital_Details,
  save_Marital_Details,
} from "../../../networkServices/IVFApi";
import { notify } from "../../../utils/utils";
import Heading from "../../UI/Heading";
import ReactSelect from "../../formComponent/ReactSelect";
import TextAreaInput from "../../formComponent/TextAreaInput";
import Tables from "../../UI/customTable";
import { useEffect, useState } from "react";
import Input from "../../formComponent/Input";
import { RedirectURL } from "../../../networkServices/PDFURL";

const ANCMaritalDetails = (data) => {
  const [t] = useTranslation();
  const { TransactionID: transactionID, PatientID: patientID } =
    data?.patientDetail || {};
  const THEAD = [
    { name: t("SNo") },
    { name: t("Duration of Marriage") },
    { name: t("Marital History") },
    { name: t("Any Complications From Previous Marriage") },
    { name: t("Remarks") },
    { name: t("Edit"), width: "2%" },
    { name: t("Print"), width: "2%" },
  ];
  const maritalOptions = [
    { label: t("First"), value: "1" },
    { label: t("Second"), value: "2" },
    { label: t("Third"), value: "3" },
  ];
  const yesNoOptions = [
    { label: t("Yes"), value: "1" },
    { label: t("No"), value: "0" },
  ];
  const [payload, setPayload] = useState({
    transactionID: "",
    patientID: "",
    ivfID: "",
    dom: "",
    mh: "",
    anyComp: "",
    remarks: "",
    id: "",
  });
  const [isEdit, setIsEdit] = useState(false);
  const [tableData, setTableData] = useState([]);
  const handleSelect = (name, value) => {
    setPayload((prev) => ({
      ...prev,
      [name]: value?.value || "",
    }));
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const fetchData = async () => {
    try {
      const response = await bindDetails_Marital_Details(transactionID);
      if (response?.success) {
        setTableData(response.data || []);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error?.response?.data?.message, "error");
      console.error(error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const hanldleprint = async () => {
    try {
      const response = await blankPrint_Marital_Details(1);

      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleRowPrint = async (item) => {
    try {
      const response = await print_Marital_Details(transactionID, item?.ID);
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleSave = async () => {
    const finalPayload = {
      id: payload.id || "0",
      patientID,
      transactionID,
      ivfid: payload?.ivfID || "",
      dom: payload?.dom || "",
      mh: payload?.mh || "",
      anyComp: payload?.anyComp || "",
      remarks: payload?.remarks || "",
    };
    try {
      const response = await save_Marital_Details(finalPayload);
      if (response?.success) {
        notify(response?.message, "success");
        fetchData();
        resetForm();
        setIsEdit();
      } else {
        notify(response?.message || "Save failed", "error");
      }
    } catch (error) {
      notify(response?.message, "error");
      console.error(error);
    }
  };
  const resetForm = () => {
    setPayload({
      transactionID: "",
      patientID: "",
      ivfID: "",
      dom: "",
      mh: "",
      anyComp: "",
      remarks: "",
      id: "",
    });
  };

  const handleEdit = (item) => {
    setPayload({
      id: item?.ID || "",
      patientID,
      transactionID,
      ivfID: item?.IVFID || "",
      dom: item?.DOM || "",
      mh: item?.MH || "",
      anyComp: item?.AnyComp || "",
      remarks: item?.Remarks || "",
    });

    setIsEdit(true);
  };

  return (
    <>
      <div className="m-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("Marital Details")} />
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Duration of Marriage")}
              id="dom"
              name="dom"
              value={payload?.dom}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Marital History")}
              id="mh"
              name="mh"
              searchable={true}
              onChange={handleChange}
              value={payload?.mh}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              removeIsClearable={true}
              dynamicOptions={maritalOptions}
              handleChange={handleSelect}
            />
            <ReactSelect
              placeholderName={t("Previous Marriage")}
              id="anyComp"
              name="anyComp"
              searchable={true}
              onChange={handleChange}
              value={payload?.anyComp}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              removeIsClearable={true}
              dynamicOptions={yesNoOptions}
              handleChange={handleSelect}
            />
            <TextAreaInput
              type="text"
              lable={t("Remarks")}
              className="form-control"
              id="remarks"
              name="remarks"
              value={payload?.remarks}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
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
          <div className="patient_registration card mt-2"></div>
          <Heading title={t("Marital History")} />
          <Tables
            thead={THEAD}
            tbody={tableData?.map((item, index) => ({
              SNo: index + 1,
              "Duration of Marriage": item?.DOM,
              "Marital History": item?.MH,
              "Any Complications From Previous Marriage": item?.AnyComp,
              Remarks: item?.Remarks,
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
export default ANCMaritalDetails;
