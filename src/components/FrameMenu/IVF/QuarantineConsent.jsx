import { useTranslation } from "react-i18next";
import {
  bindDetails_Ovum_Pickup,
  print_Ovum_Pickup,
  PrintblankPrint_Previous_Infertility,
  save_Ovum_Pickup,
} from "../../../networkServices/IVFApi";
import Heading from "../../UI/Heading";
import { notify } from "../../../utils/utils";
import { useEffect, useState } from "react";
import Input from "../../formComponent/Input";
import Tables from "../../UI/customTable";
import { RedirectURL } from "../../../networkServices/PDFURL";

const QuarantineConsent = (data) => {
  const [t] = useTranslation();
  const { TransactionID: transactionID, PatientID: patientID } =
    data?.patientDetail || {};
  const THEAD = [
    { name: t("SNo") },
    { name: t("EGGS AND EMBROYS") },
    { name: t("Explained To") },
    { name: t("Explained To") },
    { name: t("Witness Address") },
    { name: t("Witness Age") },
    { name: t("Edit") },
    { name: t("Print") },
  ];

  const [payload, setPayload] = useState({
    transactionID: "",
    patientID: "",
    ivfid: "",
    eggsandEmbroys: "",
    explainedTo: "",
    explainedTo1: "",
    witnessName: "",
    witnessAddress: "",
    witnessAge: "",
    id: "",
  });
  const [isEdit, setIsEdit] = useState(false);
  const [tableData, setTableData] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const fetchData = async () => {
    try {
      const response = await bindDetails_Ovum_Pickup(transactionID);
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
      const response = await PrintblankPrint_Previous_Infertility(1);

      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleRowPrint = async (item) => {
    try {
      const response = await print_Ovum_Pickup(transactionID, item?.ID);
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
      ivfid: payload?.ivfid || "",
      eggsandEmbroys: payload?.eggsandEmbroys || "",
      explainedTo: payload?.explainedTo || "",
      explainedTo1: payload?.explainedTo1 || "",
      witnessName: payload?.witnessName || "",
      witnessAddress: payload?.witnessAddress || "",
      witnessAge: payload?.witnessAge || "",
    };
    try {
      const response = await save_Ovum_Pickup(finalPayload);
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
      ivfid: "",
      eggsandEmbroys: "",
      explainedTo: "",
      explainedTo1: "",
      witnessName: "",
      witnessAddress: "",
      witnessAge: "",
      id: "",
    });
  };

  const handleEdit = (item) => {
    setPayload({
      id: item?.ID || "",
      patientID,
      transactionID,
      ivfID: item?.IVFID || "",
      eggsandEmbroys: item?.EggsandEmbroys || "",
      explainedTo: item?.ExplainedTo || "",
      explainedTo1: item?.ExplainedTo1 || "",
      witnessName: item?.WitnessName || "",
      witnessAddress: item?.WitnessAddress || "",
      witnessAge: item?.WitnessAge || "",
    });

    setIsEdit(true);
  };

  return (
    <>
      <div className="m-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("Entry details")} isBreadcrumb={false} />
          <div className="row p-2">
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("EGGS AND EMBROYS FROM")}
              id="eggsandEmbroys"
              name="eggsandEmbroys"
              value={payload?.eggsandEmbroys}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Explained to")}
              id="explainedTo"
              name="explainedTo"
              value={payload?.explainedTo}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("and")}
              id="explainedTo1"
              name="explainedTo1"
              value={payload?.explainedTo1}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />{" "}
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Witness Name")}
              id="witnessName"
              name="witnessName"
              value={payload?.witnessName}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />{" "}
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Witness Address")}
              id="witnessAddress"
              name="witnessAddress"
              value={payload?.witnessAddress}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              lable={t("Witness Age")}
              id="witnessAge"
              name="witnessAge"
              value={payload?.witnessAge}
              onChange={handleChange}
              respclass="col-xl-2 col-lg-2 col-md-6 col-sm-4 col-12"
            />
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3 mb-3 p-2">
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
            tbody={tableData?.map((item, index) => ({
              SNo: index + 1,
              "EGGS AND EMBROYS": item?.EggsandEmbroys,
              "Explained To": item?.ExplainedTo,
              "Witness Name": item?.WitnessName,
              "Witness Address": item?.WitnessAddress,
              "Witness Age": item?.WitnessAge,
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
export default QuarantineConsent;
