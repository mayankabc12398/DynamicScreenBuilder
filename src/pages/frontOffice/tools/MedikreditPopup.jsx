import React, { useState } from "react";
import Heading from "../../../components/UI/Heading";
import { useTranslation } from "react-i18next";
import Tables from "../../../components/UI/customTable";
import Input from "../../../components/formComponent/Input";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import {
  checkEligibilityApi,
  famCheckRequestApi,
} from "../../../networkServices/opdserviceAPI";
import { notify } from "../../../utils/utils";

export default function MedikreditPopup({
  singlePatientData,
  setVisible,
  onSelectRow,
  Panel,
}) {
  console.log("Panell", Panel)
  const [t] = useTranslation();

  const [values, setValues] = useState({
    memberNumber: "",
    Plan: "",
    Option: "",
  });

  const [tableData, setTableData] = useState([]);


  const optionList = [{ label: t("Classic"), value: "1" }];

  const thead = [
    { name: t("Select"), width: "8%" },
    { name: t("Member Number") },
    { name: t("Sur Name") },
    { name: t("First Name") },
    { name: t("Id Number") },
    { name: t("Benefit Details") },
    { name: t("Inits") },
    { name: t("DOB") },
    { name: t("Gender") },
    { name: t("Dep CD") },
    { name: t("Plan") },
  ];

  const handleInputChange = (e) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelect = (name, val) => {
    setValues((prev) => ({
      ...prev,
      [name]: val?.value || "",
    }));
  };

  const handleSearch = async () => {
    const searchPayload = {
      memberNumber: values?.memberNumber,
      // Plan: Panel?.label,
      Plan: "631372",
      Option: values?.Option,
    };
    //   memberNumber: values?.memberNumber,
    //   Plan: values?.Plan,
    //   Option: values?.Option || "",
    // };

    try {
      const res = await famCheckRequestApi(searchPayload);

      const patList = res?.data?.DOCUMENT?.TX?.MEM?.PAT;

      if (res?.success && Array.isArray(patList) && patList.length > 0) {
        setTableData(patList);
        notify(res?.message, "success");
      } else {
        setTableData([]);
        notify(res?.message || "No data found", "error");
      }
    } catch (error) {
      console.error("Search Error", error);
      setTableData([]);
      notify(error?.message || "Something went wrong", "error");
    }
  };

  const handleRowSelect = async (row) => {
debugger

    const eligibilityPayload = {
      memberNumber: values.memberNumber,
      sName: row?.sname,
      fName: row?.fname || "",
      id_nbr: row?.id_nbr,
      inits: row?.inits,
      dob: row?.dob,
      gender: row?.gender,
      dep_cd: row?.dep_cd,
      plan:  "631372",
    };

    try {
      const res = await checkEligibilityApi(eligibilityPayload);

      if (res?.success) {
        
        notify(res?.message, "success");

        const memData = res?.data?.DOCUMENT?.TX?.MEM;
        const txData = res?.data?.DOCUMENT?.TX;

        onSelectRow({
          memberNumber: eligibilityPayload.memberNumber,
          sName: memData?.sname || eligibilityPayload.sName,
          fName: memData?.PAT?.fname || eligibilityPayload.fName,
          id_nbr: memData?.PAT?.id_nbr || eligibilityPayload.id_nbr,
          inits: memData?.PAT?.inits || eligibilityPayload.inits,
          dob: memData?.PAT?.dob || eligibilityPayload.dob,
          gender: memData?.PAT?.gender || eligibilityPayload.gender,
          dep_cd: memData?.PAT?.dep_cd || eligibilityPayload.dep_cd,
          plan: Panel?.label,

          authNumber: txData?.AUTHS?.hnet ?? "",
          mem_acc_nbr: txData?.mem_acc_nbr ?? "",

          apiResponse: res?.data,
        });

        setVisible(false);
      } else {
        notify(res?.message || "Eligibility failed", "error");
      }
    } catch (error) {
      console.error(error);
      notify(error?.message || "Eligibility failed", "error");
    }
  };

  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration ">
        {/* <Heading title="MediCreditRequest" isSlideScreen /> */}
        {(
          <div className="col-12 mb-2">
            <div className="border rounded p-3 bg-light">
              <p className="mb-1">
                We found the following dependants for this member. Please choose the
                dependants that you want to add to your practice.
              </p>

              <p className="mb-1">
                <strong>{t("SCHEME:")}</strong>{" "}
                <span className="text-danger fw-bold">
                  {Panel?.PanelGroup}
                </span>
              </p>

              <p className="mb-1">
                <strong>{t("PLAN:")}</strong>{" "}
                <span className="text-danger fw-bold">
                  {Panel?.label}
                </span>
              </p>

              <p className="mb-2">
                {/* <strong>Member #:</strong> {values?.memberNumber} */}
              </p>

              <div className="alert alert-warning d-flex align-items-center mb-0">
                <i className="fa fa-exclamation-triangle me-2"></i>
                <span>
                  <strong>{t("ACTION REQUIRED:")}</strong> {t("Select scheme & plan before saving the patient record.")}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="row p-2">
          <Input
            type="text"
            className="form-control"
            name="memberNumber"
            id="memberNumber"
            value={values?.memberNumber}
            placeholder=""
            onChange={handleInputChange}
            lable={t("Member Number")}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
          {/* <ReactSelect
            name="Plan"
            id="Plan"
            dynamicOptions={groupOptions}
            value={values?.Plan}
            handleChange={handleSelect}
            placeholderName={t("Plan")}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          /> */}

          <ReactSelect
            name="Option"
            id="Option"
            dynamicOptions={optionList}
            value={values?.Option}
            handleChange={handleSelect}
            placeholderName={t("Option")}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />

          <button
            className="btn btn-sm btn-success px-4"
            type="button"
            onClick={handleSearch}
          >
            {t("Search")}
          </button>
        </div>

        {tableData?.length > 0 && (
          <Tables
            thead={thead}
            style={{ height: "45vh" }}
            tbody={tableData.map((row, index) => ({
              Select: (
                <button
                  type="button"
                  onClick={() => handleRowSelect(row)}
                  style={{
                    background: "#e7f1ff",
                    border: "1px solid #0d6efd",
                    color: "#0d6efd",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: 400,
                    fontSize: "12px",
                  }}
                >
                  {t("Select")}
                </button>
              ),

              "Member Number": values.memberNumber,
              "Sur Name": row?.sname,
              "First Name": row?.fname,
              "Id Number": row?.id_nbr,
              "Benefit Details": row?.benefitDetails,
              Inits: row?.inits,

              DOB: row?.dob,
              Gender: row?.gender === "1" ? "Male" : "Female",
              "Dep CD": row?.dep_cd,
              Plan: Panel?.label,
            }))}
          // handleDoubleClick={handleRowSelect}
          />
        )}
      </div>
    </div>
  );
}
