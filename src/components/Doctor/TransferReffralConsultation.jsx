import React, { useEffect, useState } from "react";
import ReactSelect from "../formComponent/ReactSelect";
import { useDispatch, useSelector } from "react-redux";
import {
  GetBindDepartment,
  GetBindReferDoctor,
} from "../../store/reducers/common/CommonExportFunction";
import { GetBindDoctorDept } from "../../networkServices/opdserviceAPI";
import TextAreaInput from "../formComponent/TextAreaInput";
import { useTranslation } from "react-i18next";

const TransferReffralConsultation = (props) => {
  const [t] = useTranslation();
  const {
    prisciptionForm,
    handlechangebyPrisciption,
    handleReactSelectChangebyPrisciption,
    onFocus
  } = props;


  const dispatch = useDispatch();
  const {
    GetDepartmentList,
    GetBindAllDoctorConfirmationData,
    GetBindReferDoctorList,
  } = useSelector((state) => state.CommonSlice);

  const [doctorType, setDoctorType] = useState(prisciptionForm?.DoctorType || "In-House");
  // const [apiData, setApiData] = useState([]);
  const TEXTAREA_RENDER = [
    {
      Typename: "Impression/Diagnosis :",
      handleChangeOnchange: handlechangebyPrisciption,
      value:
        prisciptionForm?.ImpressionDiagnosis,
      name: "ImpressionDiagnosis",
    },
    {
      Typename: "Remarks :",
      handleChangeOnchange: handlechangebyPrisciption,
      value: prisciptionForm?.Remarks,
      name: "Remarks",
    },
  ];

  useEffect(() => {
    if (prisciptionForm?.DoctorType) {
      setDoctorType(prisciptionForm.DoctorType);
    }
  }, [prisciptionForm?.DoctorType]);

  useEffect(() => {
    dispatch(GetBindDepartment());
    dispatch(GetBindReferDoctor());
  }, [dispatch]);

  const handleReactSelectChange = async (name, e) => {

    setDoctorType(e?.value);
    handleReactSelectChangebyPrisciption(name, e?.value)
  };
  return (
    <>
      <div className="row mt-2">
        <div className="col-sm-4">
          <ReactSelect
            placeholderName={"Doctor Type"}
            id={"Type"}
            searchable={true}
            name={"DoctorType"}
            respclass=""
            dynamicOptions={[
              { label: t("In-House"), value: "In-House" },
              { label: t("OutSide"), value: "Out-Side" },
            ]}
            handleChange={handleReactSelectChange}
            value={doctorType}
            removeIsClearable={false}
          />
        </div>
        {doctorType === "In-House" && (
          <div className="col-sm-4">
            <ReactSelect
              placeholderName={"Department"}
              id={"Department"}
              searchable={true}
              name={"department"}
              respclass=""
              dynamicOptions={Array.isArray(GetDepartmentList) && GetDepartmentList?.map((item) => {
                return {
                  label: item?.Name || item?.Dept_Name,
                  value: item?.ID || item?.Dept_ID,
                };
              })}
              handleChange={handleReactSelectChangebyPrisciption}
              value={
                prisciptionForm?.department?.value
              }
              removeIsClearable={false}
            />
          </div>
        )}

        {/* {doctorType === "In-House" && (
          <div className="col-sm-4">
            <ReactSelect
              placeholderName={"Refer To"}
              id={"Refer"}
              searchable={true}
              name={"referTo"}
              respclass=""
              dynamicOptions={Array.isArray(GetBindAllDoctorConfirmationData) && GetBindAllDoctorConfirmationData
                ?.filter((doc) =>
                  doc?.DocDepartmentID?.toString() === prisciptionForm?.department?.value?.toString()
                )
                ?.map((item) => {
                  return {
                    label: item?.Name,
                    value: item?.DoctorID,
                  };
                })}
              handleChange={handleReactSelectChangebyPrisciption}
              value={prisciptionForm?.referTo?.value}
              removeIsClearable={false}
            />
          </div>
        )}

        {doctorType === "Out-Side" && (
          <div className="col-sm-4">
            <ReactSelect
              placeholderName={"Refer To"}
              id={"ReferDoctor"}
              searchable={true}
              name={"referTo"}
              respclass=""
              dynamicOptions={Array.isArray(GetBindReferDoctorList) && GetBindReferDoctorList?.map((item) => {
                return {
                  label: item?.NAME,
                  value: item?.DoctorID,
                };
              })}
              handleChange={handleReactSelectChangebyPrisciption}
              value={prisciptionForm?.referTo}
              removeIsClearable={false}
            />
          </div>
        )} */}
        <div className="col-sm-4">
          <ReactSelect
            placeholderName="Refer To"
            id={doctorType === "In-House" ? "Refer" : "ReferDoctor"}
            searchable
            name="referTo"
            dynamicOptions={
              doctorType === "In-House"
                ? (GetBindAllDoctorConfirmationData || [])
                  .filter((doc) =>
                    doc?.DocDepartmentID?.toString() === prisciptionForm?.department?.value?.toString()
                  )
                  .map((doc) => ({ label: doc?.Name, value: doc?.DoctorID }))
                : (GetBindReferDoctorList || []).map((doc) => ({
                  label: doc?.NAME,
                  value: doc?.DoctorID,
                }))
            }
            handleChange={handleReactSelectChangebyPrisciption}
            value={
              doctorType === "In-House"
                ? prisciptionForm?.referTo?.value
                : prisciptionForm?.referTo
            }
            removeIsClearable={false}
          />
        </div>

        <div className="col-sm-4">
          <ReactSelect
            placeholderName={"Referral Type"}
            id={"referralType"}
            searchable={true}
            name={"referralType"}
            respclass=""
            dynamicOptions={[
              { label: t("Urgent"), value: "Urgent" },
              { label: t("Routine"), value: "Routine" },
            ]}
            handleChange={handleReactSelectChangebyPrisciption}
            value={
              prisciptionForm?.referralType
            }
            removeIsClearable={false}
          />
        </div>

        <div className="col-sm-4">
          <ReactSelect
            placeholderName={"Consult Type"}
            id={"Consult"}
            searchable={true}
            name={"consultType"}
            respclass=""
            dynamicOptions={[
              { label: t("Refer"), value: "Refer" },
              { label: t("Transfer"), value: "Transfer" },
            ]}
            handleChange={handleReactSelectChangebyPrisciption}
            value={
              prisciptionForm?.consultType
            }
            removeIsClearable={false}
          />
        </div>

        <div className="col-sm-12 ">
          <div className="row justify-content-center px-2">
            {TEXTAREA_RENDER?.map((ele, index) => (
              <div
                className="col-md-12 col-lg-6 col-6 col-sm-12 "
                key={index}
              >
                <TextAreaInput
                  id={ele.name}
                  lable={ele.Typename}
                  className="col-12"
                  onFocus={onFocus}
                  name={ele.name}
                  value={ele.value}
                  onChange={ele.handleChangeOnchange}
                  placeholder=" "
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default TransferReffralConsultation;
