import React, { useEffect, useState } from "react";
import Tables from "../../../components/UI/customTable";
import Heading from "../../../components/UI/Heading";
import DatePicker from "../../../components/formComponent/DatePicker";
import Input from "../../../components/formComponent/Input";
import { useTranslation } from "react-i18next";
// import { DoctorDisplayGetPreRegisteredUsers } from '../../../networkServices/registrationApi'
import moment from "moment";
import { notify } from "../../../utils/ustil2";
import { DoctorDisplayGetPreRegisteredUsers } from "../../../networkServices/registrationApi";
import { filterByType } from "../../../utils/utils";
import { findAgeByDOB } from "../../../networkServices/directPatientReg";

const normalizeAgeType = (type) => {
  if (!type) return "YRS";
  const cleanType = String(type).toUpperCase().trim();
  if (cleanType.includes("YEAR") || cleanType.includes("YR") || cleanType === "Y") {
    return "YRS";
  }
  if (cleanType.includes("MONTH") || cleanType.includes("MTH") || cleanType === "M") {
    return "MONTH(S)";
  }
  if (cleanType.includes("DAY") || cleanType.includes("DY") || cleanType === "D") {
    return "DAY(S)";
  }
  return "YRS";
};

const PreRegistration = ({
  values,
  setValues,
  setModalHandlerState,
  setRelations,
  relations,
  setCheckbox,
  setDocumentIds,
  CentreWiseCache,
}) => {
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;

  const THEAD = [
    { width: "0.2%", name: t("S No.") },
    { width: "0.2%", name: t("request Id.") },
    { width: "0.2%", name: t("patientId.") },
    { width: "1%", name: t("Patient Name") },
    { width: "1%", name: t("Gender") },
    { width: "1%", name: t("D.O.B") },
    { width: "1%", name: t("Mobile No") },
    { width: "1%", name: t("Emergency No") },
    { width: "1%", name: t("Email") },
    { width: "1%", name: t("Pincode") },
    { width: "1%", name: t("Religion") },
    // { width: "1%", name: t("Address") },
    // { width: "1%", name: t("Parmanent Address") },
    { width: "0.2%", name: t("Action") },
  ];
  const [searchData, setSearchData] = useState({
    requestId: "",
    patientName: "",
    mobileNo: "",
    fromDate: new Date(),
    toDate: new Date(),
  });
  const [tableData, setTableData] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "mobileNo") {
      newValue = newValue.replace(/\D/g, "");
      newValue = newValue.slice(0, 10);
    }

    setSearchData((prev) => ({ ...prev, [name]: newValue }));
  };

  const HandleSearch = async () => {
    const payload = {
      requestId: searchData?.requestId,
      patientName: searchData?.patientName,
      mobileNo: searchData?.mobileNo,
      fromDate: moment(searchData?.fromDate).format("YYYY-MM-DD"),
      toDate: moment(searchData?.toDate).format("YYYY-MM-DD"),
    };
    try {
      const response = await DoctorDisplayGetPreRegisteredUsers(payload);
      if (response?.success) {
        setTableData(response?.data);
      } else {
        notify(response?.message, "warn");
        setTableData([]);
      }
    } catch (error) { }
  };

  const loadPatient = async (patient, index) => {
    debugger;

    let calculatedAge = "0";
    let calculatedAgeType = "YRS";
    let parsedDobObj = null;

    if (patient?.dob) {
      try {
        const parsedDob = moment(patient.dob, [
          "MM/DD/YYYY HH:mm:ss",
          "MM/DD/YYYY hh:mm:ss A",
          "MM/DD/YYYY",
          "YYYY-MM-DD HH:mm:ss",
          "YYYY-MM-DD",
        ]);
        if (parsedDob.isValid()) {
          parsedDobObj = parsedDob.toDate();
          const formattedDob = parsedDob.format("YYYY-MM-DD");
          const ageResponse = await findAgeByDOB(formattedDob);
          if (ageResponse?.success && ageResponse?.data) {
            const parts = ageResponse.data.split(" ");
            calculatedAge = parts[0] || "0";
            calculatedAgeType = parts[1] ? normalizeAgeType(parts[1]) : "YRS";
          } else {
            // Local fallback
            const today = moment();
            const years = today.diff(parsedDob, "years");
            if (years > 0) {
              calculatedAge = String(years);
              calculatedAgeType = "YRS";
            } else {
              const months = today.diff(parsedDob, "months");
              if (months > 0) {
                calculatedAge = String(months);
                calculatedAgeType = "MONTH(S)";
              } else {
                const days = today.diff(parsedDob, "days");
                calculatedAge = String(days >= 0 ? days : 0);
                calculatedAgeType = "DAY(S)";
              }
            }
          }
        }
      } catch (err) {
        console.error("Error calculating age: ", err);
      }
    }

    let aadhaarProofOption = null;
    if (CentreWiseCache && patient?.aadhaarNumber) {
      const idProofOptions =
        filterByType(CentreWiseCache, 13, "TypeID", "TextField", "ValueField") ||
        [];
      aadhaarProofOption = idProofOptions.find((option) => {
        const label = String(option?.label || option?.TextField || "").toLowerCase().trim();
        return label.includes("aadhaar") || label.includes("adhar");
      });
    }

    if (!aadhaarProofOption && patient?.aadhaarNumber) {
      aadhaarProofOption = { label: "AADHAAR CARD", value: "3#12" };
    }

    const newDoc = patient?.aadhaarNumber
      ? {
        name: aadhaarProofOption,
        id: patient?.aadhaarNumber,
      }
      : null;

    const newDocList = newDoc ? [newDoc] : [];
    if (setDocumentIds) {
      setDocumentIds(newDocList);
    }

    const maritalStatusObj = patient?.maritalStatus ? {
      label: patient?.maritalStatus,
      value: patient?.maritalStatus,
    } : null;

    setValues({
      countryID: patient?.countryId,
      // StateID: patient?.stateId,
      // districtID: patient?.districtId,
      districtID: {
        label: patient?.districtName ? patient?.districtName : "",
        value: patient?.districtId ? String(patient?.districtId) : "",
      },
      StateID: {
        label: patient?.stateName ? patient?.stateName : "",
        value: patient?.stateId ? String(patient?.stateId) : "",
      },
      cityID: {
        label: patient?.cityName ? patient?.cityName : "",
        value: patient?.cityId ? String(patient?.cityId) : "",
      },
      // district: patient?.districtName,
      // state: patient?.stateName,
      // city: patient?.cityName ? patient?.cityName : "",
      // cityID: patient?.cityId,
      Country: patient?.countryName,
      PinCode: patient?.pinCode,
      IsInternational: "2",
      ResidentialNumber_STDCODE: "+91",
      Phone_STDCODE: "+91",
      House_No: patient?.address,
      parmanentAddress: patient?.permanentAddress,
      Mobile: patient?.mobileNo,
      Title: patient?.title,
      Gender: patient?.gender,
      PFirstName: patient?.firstName,
      PLastName: patient?.lastName,
      DOB: parsedDobObj || (patient?.dob ? new Date(patient.dob) : ""),
      Email: patient?.emailId,
      Phone: patient?.emergency,
      requestId: patient?.requestId,
      AgeType: calculatedAgeType,
      Age: calculatedAge,
      Maritial: maritalStatusObj,
      MaritalStatus: maritalStatusObj,
      Religion: patient?.religion ? { label: patient?.religion, value: patient?.religion } : null,
      // "InternationalCountryID":{label: patient?.countryName, value: patient?.countryId }
      aadhaarNumber: patient?.aadhaarNumber,
      ID_Proof_No: "",
      documentName: "",
      documentIds: newDocList,
    });
    setCheckbox(patient?.isSame ? true : false);
    const relation = [
      {
        Relation: patient?.relationName,
        RelationName: patient?.relationOfName,
        RelationPhone: patient?.relationPhone,
        isPersonal: true,
      },
    ];

    setRelations(relation);
    setModalHandlerState({
      show: false,
      component: null,
      size: null,
    });
  };

  useEffect(() => {
    HandleSearch();
  }, []);

  console.log(searchData, "searchData");

  return (
    <div style={{ minHeight: "60vh" }}>
      <div className="card">
        <Heading
          title={t("Search Pre Registered Patients")}
          isBreadcrumb={false}
        />
        <div className="row p-2">
          <Input
            type="text"
            className="form-control"
            id="requestId"
            lable={t("Request ID")}
            placeholder=" "
            value={searchData.requestId}
            respclass="col-xl-2 col-md-3 col-sm-6 col-12"
            name="requestId"
            onChange={handleChange}
          />
          <Input
            type="text"
            className="form-control"
            id="patientName"
            lable={t("Patient Name")}
            placeholder=" "
            value={searchData.patientName}
            respclass="col-xl-2 col-md-3 col-sm-6 col-12"
            name="patientName"
            onChange={handleChange}
          />
          <Input
            type="number"
            className="form-control"
            id="mobileNo"
            lable={t("Mobile No.")}
            placeholder=" "
            value={searchData.mobileNo}
            respclass="col-xl-2 col-md-3 col-sm-6 col-12"
            name="mobileNo"
            onChange={handleChange}
          />
          <DatePicker
            className="custom-calendar"
            id="From Data"
            name="fromDate"
            lable={t("From Date")}
            placeholder={VITE_DATE_FORMAT}
            respclass="col-xl-2 col-md-3 col-sm-6 col-12"
            value={searchData.fromDate}
            maxDate={new Date()}
            handleChange={handleChange}
          />
          <DatePicker
            className="custom-calendar"
            id="toDate"
            name="toDate"
            lable={t("To Date")}
            value={searchData.toDate}
            maxDate={new Date()}
            handleChange={handleChange}
            placeholder={VITE_DATE_FORMAT}
            respclass="col-xl-2 col-md-3 col-sm-6 col-12"
          />

          <div className="col-xl-2 col-md-3 col-sm-6 col-12 gap-2">
            <button className="btn btn-sm btn-primary" onClick={HandleSearch}>
              {t("Search")}
            </button>
          </div>
        </div>
      </div>
      <div className="py-2">
        {tableData?.length > 0 && (
          <div className="">
            <Heading title={t("Patient's List")} isBreadcrumb={false} />

            <Tables
              thead={THEAD}
              tbody={tableData?.map((val, ind) => ({
                sn: ind + 1,
                requestId: val?.requestId,
                patientId: val?.patientId,
                PatientName: val?.firstName + " " + val?.lastName,
                gender: val?.gender,
                dob: moment(val?.dob).format("DD-MM-YYYY"),
                mobileNo: val?.mobileNo,
                emergency: val?.emergency,
                emailId: val?.emailId,
                pincode: val?.pinCode,
                religion: val?.religion,
                // address: val?.address,
                // parAddress:val?.isSame ?'':val?.permanentAddress,
                action:
                  /* val?.patientId !== null ? (
                    ""
                  ) :  */(
                    <span
                      onClick={() => {
                        loadPatient(val, ind);
                      }}
                      className="d-flex justify-content-center my-2"
                    >
                      <i class="fas fa-sign-out-alt" aria-hidden="true"></i>
                    </span>
                  ),
                colorcode: val?.patientId && "#90EE90",
              }))}
              scrollView="scrollView"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PreRegistration;
