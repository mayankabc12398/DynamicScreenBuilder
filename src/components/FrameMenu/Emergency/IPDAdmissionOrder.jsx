import React, { useEffect, useState } from "react";
import Heading from "../../UI/Heading";
import ReactSelect from "../../formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import TextAreaInput from "../../formComponent/TextAreaInput";
import { handleReactSelectDropDownOptions } from "../../../utils/utils";
import { bindAdmitToWardApi } from "../../../networkServices/nursingWardAPI";
import { GetBindDoctorDept } from "../../../networkServices/opdserviceAPI";
import { getIpdAdmissionOrderApi, saveIpdAdmissionOrderApi } from "../../../networkServices/Emergency";
import { notify } from "../../../utils/ustil2";
import Tables from "../../UI/customTable";
const intialState = {
  WardType: "",
  Doctor: "",
  PatientType: "",
  ReasonForAdmission: "",
};
// const thead = [
//   { name: t("S.No."), width: "4%" },
//   { width: "4%", name: "Patient Name" },
//   t("Ward Type"),
//   t("Doctor Name"),
//   t("Patient Type"),
//   t("Reason For Admission"),
//   t("Entry By"),
//   t("Entry Date"),
// ];
// const tableData = [
//   {
//     sr: 1,
//     patientName: "Mr. KILONZO NGURE",
//     wardType: "General Ward",
//     doctorName: "Dr. Sharma",
//     patientType: "IPD",
//     reasonForAdmission: "Fever",
//     entryBy: "Admin",
//     entryDate: "2025-01-01",
//   },
//   {
//     sr: 2,
//     patientName: "Komal Singh",
//     wardType: "Private Ward",
//     doctorName: "Dr. Verma",
//     patientType: "OPD",
//     reasonForAdmission: "Headache",
//     entryBy: "Admin",
//     entryDate: "2025-01-02",
//   },
// ];

const IPDAdmissionOrder = ({ data }) => {
  const { t } = useTranslation();
  const TransactionID = data?.TransactionID;
  const PatientID = data?.PatientID;

  const [payload, setPayload] = useState({ ...intialState });
  const handleReactSelect = (name, e) => {
    setPayload({ ...payload, [name]: e.value });
  };
  const PatientType = [
    { label: t("Medical"), value: "Medical" },
    { label: t("Surgical"), value: "Surgical" },
    { label: t("Isolation"), value: "Isolation" },
  ]
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload({ ...payload, [name]: value });
  };
  const [DropDownState, setDropDownState] = useState({
    bindDoctor: [],
    bindAdmitToWard: [],
  })
  console.log(DropDownState);

  const getbindAdmitToWardList = async () => {
    try {
      const data = await bindAdmitToWardApi();
      return data?.data;
    } catch (error) {
      console.error(error);
    }
  };
  const handleDoctorDeptWise = async () => {
    const Department = "All";
    try {
      const data = await GetBindDoctorDept(Department);
      return data?.data;
    } catch (error) {
      console.log(error);
    }
  };
  const FetchAllDropDown = async () => {
    try {
      const [BindAdmitToWardApi, DoctorDeptWise] = await Promise.all([
        getbindAdmitToWardList(),
        handleDoctorDeptWise(),
      ]);

      const dropDownData = {

        bindAdmitToWard: handleReactSelectDropDownOptions(
          BindAdmitToWardApi,
          "WardName",
          "RoomID"
        ),
        doctor: handleReactSelectDropDownOptions(
          DoctorDeptWise,
          "Name",
          "DoctorID"
        ),

      };

      setDropDownState(dropDownData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }
  const [tableData, setTableData] = useState([])

  const handleSave = async () => {
    const data = {
      transactionID: TransactionID,
      patientID: PatientID,
      roomTypeId: payload?.WardType,
      doctorId: payload?.Doctor,
      patientType: payload?.PatientType,
      note: payload?.ReasonForAdmission,
    }
    const res = await saveIpdAdmissionOrderApi(data)
    if (res?.success) {
      notify(res?.message, "success")
    } else {
      notify(res?.message, "error")
    }

  }
  console.log(tableData);

  const fetchList = async () => {
    const res = await getIpdAdmissionOrderApi(TransactionID, PatientID)
    if (res?.success) {
      setTableData(res?.data)
    } else {
      setTableData([])
    }
  }
  useEffect(() => {
    FetchAllDropDown();
    fetchList()
  }, [])
  return (
    <>
      <div className="card">
        <Heading title={t("Admission Order")} />
        <div className="row p-2">
          <ReactSelect
            placeholderName={"Ward Type"}
            id={"WardType"}
            name="WardType"
            value={payload?.WardType}
            handleChange={handleReactSelect}
            dynamicOptions={DropDownState?.bindAdmitToWard}
            searchable={true}
            removeIsClearable={true}
            respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          />
          <ReactSelect
            placeholderName={"Doctor / Team"}
            id={"Doctor"}
            name="Doctor"
            value={payload?.Doctor}
            handleChange={handleReactSelect}
            dynamicOptions={DropDownState?.doctor}
            searchable={true}
            removeIsClearable={true}
            respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          />
          <ReactSelect
            placeholderName={"Patient Type"}
            id={"PatientType"}
            name="PatientType"
            value={payload?.PatientType}
            handleChange={handleReactSelect}
            dynamicOptions={PatientType}
            searchable={true}
            removeIsClearable={true}
            respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
          />
          <TextAreaInput
            lable={t("Reason For Admission")}
            placeholder=""
            className="w-100"
            id={"ReasonForAdmission"}
            name="ReasonForAdmission"
            value={payload?.ReasonForAdmission}
            maxLength={300}
            rows="2"
            onChange={handleChange}
            respclass="col-xl-5 col-md-3 col-sm-4 col-12"
          />
          {tableData?.length > 0 ? '' :
            <div className="col-sm-1">
              <button className="btn btn-sm btn-success" onClick={handleSave}>{t("Save")}</button>
            </div>
          }
          <Tables
            thead={[
              { name: t("S.No"), width: "1%" },
              { name: t("Patient Name"), width: "5%" },
              { name: t("Ward Type"), width: "5%" },
              { name: t("Doctor Name"), width: "5%" },
              { name: t("Patient Type"), width: "5%" },
              { name: t("Reason For Admission"), width: "5%" },
              { name: t("Entry By"), width: "5%" },
              { name: t("Entry Date"), width: "5%" },
            ]}
            tbody={tableData?.map((item, index) => ({
              SNo: index + 1,
              Patient: item?.patientName,
              ipdCaseTypeName:item?.ipdCaseTypeName,
              docName:item?.docName,
              ipdPatientType:item?.ipdPatientType,
              reason:"",
              Entry:item?.enteredBy,
              entryDate:item?.entryDate
            }))}
          />
        </div>
      </div>
      {/* <div className="card mt-2">
        <Heading title={"Patient Transfer Data"} />
        <Tables
          thead={thead}
          tbody={tableData?.map((ele, index) => ({
            "S.No.": index + 1,
            "Patient Name": ele.pname,
            "Ward Type": ele.WardType || "-",
            "Doctor Name": ele.DoctorName || "-",
            "Patient Type": ele.PatientType || "-",
            "Reason For Admission": ele.Reason || "-",
            "Entry By": ele.EntryBy,
            "Entry Date": ele.EntryDate,
          }))}
        />
      </div> */}
    </>
  );
};

export default IPDAdmissionOrder;
