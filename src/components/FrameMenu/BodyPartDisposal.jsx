import React, { useEffect, useState } from "react";
import Tables from "../UI/customTable";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import Input from "../formComponent/Input";
import ReactSelect from "../formComponent/ReactSelect";
import {
  GetBodyPartDisposalByPatientAPI,
  RelationshipListAPI,
  SaveBodyPartDisposalApi,
  UpdateBodyPartDisposalAPI,
} from "../../networkServices/OT/otAPI";
import { notify } from "../../utils/ustil2";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";

const BodyPartDisposal = ({ data }) => {
  console.log(data);
  const localData = useLocalStorage("userData", "get");
  const empName = localData?.empName;

  const PatientID = data?.PatientID;
  const TransactionID = data?.TransactionID;
  const Pname = data?.PName;
  const [t] = useTranslation();

  const THEAD = [
    t("S.No"),
    t("Patient Name"),
    t("Witness"),
    t("Entry By"),
    t("EntryDate"),
    t("Edit"),
    // "Print",
  ];

  const initialPayload = {
    id: "",
    patientID: "",
    transactionID: "",
    relativeName: "",
    relativeTo: "",
    nationalID: "",
    relationship: "",
    patientName: "",
    witness: "",
    witnessNationalID: "",
    nurseID: "",
    entryBy: "",
    bodyPartName: "",
  };

  const [payload, setPayload] = useState(initialPayload);
  const [relationshipOptions, setRelationshipOptions] = useState([]);
  const [tableData, setTableData] = useState([]);

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

  // edit work
  const handleEdit = async (row) => {
    try {
      setPayload({
        id: row?.id || "",
        patientID: row?.patientID || "",
        transactionID: row?.transactionID || "",
        relativeName: row?.relativeName || "",
        relativeTo: row?.relativeTo || "",
        nationalID: row?.nationalID || "",
        relationship: row?.relationship || "",
        patientName: row?.patientName || "",
        witness: row?.witness || "",
        witnessNationalID: row?.witnessNationalID || "",
        nurseID: row?.nurseID || "",
        entryBy: row?.entryBy1 || "",
        bodyPartName: row?.bodyPartName || "",
      });
    } catch (error) {
      console.log("Error loading edit data:", error);
    }
  };

  const handleTableData = (tableData) => {
    return tableData?.map((items, index) => {
      const { patientName, witness, entryBy1, entryDate1 } = items;
      return {
        SNO: index + 1,
        patientName,
        witness,
        entryBy1,
        entryDate1,
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

  const handlePrint = () => {};

  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        const res = await RelationshipListAPI();
        console.log("API Response:", res);

        const formattedOptions = res.map((item) => ({
          value: item.valueField,
          label: item.textField,
        }));
        setRelationshipOptions(formattedOptions);
      } catch (error) {
        console.log(error);
      }
    };

    fetchRelationships();
  }, []);

  const handleGetBodyPartDisposalByPatient = async (PatientID) => {
    try {
      const APIresponse = await GetBodyPartDisposalByPatientAPI(PatientID);
      if (APIresponse?.length > 0) {
        setTableData(APIresponse);
      }
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  const handlesave = async () => {
    const savePayload = {
      patientID: PatientID,
      transactionID: TransactionID,
      relativeName: payload.relativeName,
      relativeTo: payload.relativeTo,
      nationalID: payload.nationalID,
      relationship: payload.relationship,
      patientName: Pname,
      witness: payload.witness,
      witnessNationalID: payload.witnessNationalID,
      nurseID: payload.nurseID,
      entryBy: payload.entryBy,
      bodyPartName: payload.bodyPartName,
    };
    try {
      const response = await SaveBodyPartDisposalApi(savePayload);
      if (response?.success) {
        notify(response?.message, "success");

        setPayload(initialPayload);

        handleGetBodyPartDisposalByPatient(PatientID);
      } else {
        notify(response?.message, "error");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleUpdate = async () => {
    const updatePayload = {
      id: payload?.id,
      relativeName: payload?.relativeName,
      relativeTo: payload?.relativeTo,
      nationalID: payload?.nationalID,
      relationship: payload?.relationship,
      witness: payload?.witness,
      witnessNationalID: payload?.witnessNationalID,
      nurseID: payload?.nurseID,
      updateBy: empName, // From local storage
      bodyPartName: payload?.bodyPartName,
    };

    try {
      const response = await UpdateBodyPartDisposalAPI(updatePayload);

      if (response?.success) {
        notify(response?.message, "success");

        setPayload(initialPayload);

        handleGetBodyPartDisposalByPatient(PatientID);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  useEffect(() => {
    handleGetBodyPartDisposalByPatient(PatientID);
  }, []);

  const handleCancel = () => {
    setPayload({
      id: "",
      patientID: "",
      transactionID: "",
      relativeName: "",
      relativeTo: "",
      nationalID: "",
      relationship: "",
      patientName: "",
      witness: "",
      witnessNationalID: "",
      nurseID: "",
      entryBy: "",
      bodyPartName: "",
    });
  };

  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card mt-2">
          <Heading title={t("PATIENT BODY PART ")} isBreadcrumb={false} />
          <div className="p-2 row">
            <Input
              type="text"
              className="form-control"
              placeholder=""
              id="relativeName"
              name="relativeName"
              value={payload?.relativeName}
              onChange={handleChange}
              lable={t("Relative Name")}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              id="nationalID"
              name="nationalID"
              value={payload?.nationalID}
              onChange={handleChange}
              lable={t("National ID")}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              id="relativeTo"
              name="relativeTo"
              value={payload?.relativeTo}
              onChange={handleChange}
              lable={t("Relative To")}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <ReactSelect
              placeholderName={t("Relationship")}
              id="relationship"
              name="relationship"
              value={payload?.relationship}
              dynamicOptions={relationshipOptions}
              handleChange={handleSelectChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />

            <div className="p-2 row">
              <p className="text-bold ml-3">
                {t("I HAVE CONSENTED TO ALLOW THE HOSPITAL TO DISPOSE THE BODY PART/ CARRY THE BODY PART.")}
              </p>
            </div>

            <Input
              type="text"
              className="form-control"
              placeholder=""
              value={Pname}
              lable={t("Patient Name")}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              disabled={true}
            />
            <Input
              type="text"
              className="form-control"
              placeholder=""
              id="bodyPartName"
              name="bodyPartName"
              value={payload?.bodyPartName}
              onChange={handleChange}
              lable={t("Body Part Name")}
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
          </div>

          <div className="patient_registration card">
            <Heading title={t("PATIENT")} isBreadcrumb={false} />
            <div className="p-2 row" style={{ display: "flex", gap: "20rem" }}>
              <p className="">{t("patient Signature:")}</p>
              <p className="">{t("National ID:")}</p>
              <p className="">{t("Relationship:")}</p>
            </div>
          </div>

          <div className="patient_registration card">
            <Heading title={t("Relative")} isBreadcrumb={false} />
            <div className="p-2 row">
              <Input
                type="text"
                className="form-control"
                placeholder=""
                id="witness"
                name="witness"
                value={payload?.witness}
                onChange={handleChange}
                lable={t("Witness")}
                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              />
              <Input
                type="text"
                className="form-control"
                placeholder=""
                id="witnessNationalID"
                name="witnessNationalID"
                value={payload?.witnessNationalID}
                onChange={handleChange}
                lable={t("National ID")}
                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              />
              <p className="">{t("patient Signature:")}</p>
            </div>
          </div>

          <div className="patient_registration card">
            <Heading title={t("Nurse")} isBreadcrumb={false} />
            <div className="p-2 row">
              <Input
                type="text"
                className="form-control"
                placeholder=""
                value={empName}
                lable={t("Hospital Witness")}
                disabled={true}
                respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              />
              <p className="">{t("Signature:")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-2">
        {payload?.id ? (
          <>
            <button className="btn btn-sm btn-primary" onClick={handleUpdate}>
              {t("Update")}
            </button>

            <button className="btn btn-sm btn-secondary ml-2" onClick={handleCancel}>
              {t("Cancel")}
            </button>
          </>
        ) : (
          <button className="btn btn-sm btn-primary" onClick={handlesave}>
            {t("Save")}
          </button>
        )}
      </div>

      <div className="col-12">
        <Tables thead={THEAD} tbody={handleTableData(tableData)} />
      </div>
    </>
  );
};

export default BodyPartDisposal;
