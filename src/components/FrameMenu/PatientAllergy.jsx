import React, { useState, useEffect, useRef } from "react";
import ReactSelect from "../formComponent/ReactSelect";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import {
  bindAllergyListApi,
  saveOrUpdateAllergyApi,
  bindAllergyTypeListApi,
  saveOrUpdateAllergyTypeApi,
  handleSavePatientAllergy,
  GetBindPatientAllergyList,
  handleDeletePatientAllergy,
} from "../../networkServices/nursingWardAPI";
import { handleReactSelectDropDownOptions } from "../../utils/utils";
import AllergyModal from "../modalComponent/Utils/AllergyModel";
import Modal from "../modalComponent/Modal";
import TypeModal from "../modalComponent/Utils/TypeModel";
import { notify } from "../../utils/ustil2";
import Input from "../formComponent/Input";
import Tables from "../UI/customTable";

const PatientAllergy = ({ data }) => {
  const [t] = useTranslation();
  const PatientID = data?.PatientID ?? data?.patientID;
  const TransactionID = data?.TransactionID ?? data?.TID ?? data?.transactionID;
  const appID = data?.App_ID ? data?.App_ID : "";
  const isMobile = window.innerWidth <= 768;
  const handleAllergyAPI_ref = useRef(null);
  const handleTypeAPI_ref = useRef(null);
  const [tableData, setTableData] = useState([]);
  const [values, setValues] = useState({
    Type: "",
    Remarks: "",
    Allergy: "",
  });

  const [modalData, setModalData] = useState({});
  const [handleModelData, setHandleModelData] = useState({
    isOpen: false,
    label: "",
    width: "",
    type: "",
    Component: null,
    handleInsertAPI: null,
  });

  const [dropDownState, setDropDownState] = useState({
    bindAllergyList: [],
    bindTypeList: [],
  });

  const fetchAllergyList = async () => {
    try {
      const res = await bindAllergyListApi();
      return handleReactSelectDropDownOptions(
        res?.data || [],
        "AllergyName",
        "ID",
      );
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const fetchTypeList = async () => {
    try {
      const res = await bindAllergyTypeListApi();
      return handleReactSelectDropDownOptions(
        res?.data || [],
        "TypeName",
        "ID",
      );
    } catch (error) {
      console.error(error);
      return [];
    }
  };
  const handleSearch = async () => {
    const reqbody = {
      TransactionID,
      appID,
    };

    try {
      const res = await GetBindPatientAllergyList(reqbody);

      if (res?.success && Array.isArray(res?.data)) {
        setTableData(res.data);
      } else {
        setTableData([]);
      }
    } catch (error) {
      console.error("Error while fetching allergy list:", error);
      setTableData([]);
    }
  };

  const fetchAllDropDowns = async () => {
    try {
      const [allergyOptions, typeOptions] = await Promise.all([
        fetchAllergyList(),
        fetchTypeList(),
      ]);

      setDropDownState({
        bindAllergyList: allergyOptions,
        bindTypeList: typeOptions,
      });
    } catch (error) {
      console.error("Error fetching dropdowns:", error);
    }
  };

  useEffect(() => {
    fetchAllDropDowns();
    handleSearch();
  }, []);
  console.log("TransactionID", data);
  // --- Handlers ---
  const handleReactSelectChange = (name, val) => {
    setValues((prev) => ({
      ...prev,
      [name]: val,
    }));
  };
  const handleChange = (e) => {
    setValues((val) => ({ ...val, [e.target.name]: e.target.value }));
  };
  const setIsOpen = () => {
    setHandleModelData((prev) => ({ ...prev, isOpen: false }));
  };

  const handleAllergyAPI = async () => {
    const payload = handleAllergyAPI_ref.current?.();
    if (!payload?.name) return notify(t("Please enter Allergy Name"), "warn");

    const response = await saveOrUpdateAllergyApi(payload);
    if (response?.success) {
      notify(response?.message, "success");
      const updatedList = await fetchAllergyList();
      setDropDownState((prev) => ({ ...prev, bindAllergyList: updatedList }));
      setIsOpen();
    } else {
      notify(response?.message, "error");
    }
  };

  const handleTypeAPI = async () => {
    const payload = handleTypeAPI_ref.current?.();
    if (!payload?.name) return notify(t("Please enter Type Name"), "warn");

    const payloadData = {
      ...payload,
      patientID: PatientID,
      transactionID: TransactionID,
    };

    const response = await saveOrUpdateAllergyTypeApi(payloadData);
    if (response?.success) {
      notify(response?.message, "success");
      // Re-fetch and update specifically the bindTypeList
      const updatedList = await fetchTypeList();
      setDropDownState((prev) => ({
        ...prev,
        bindTypeList: updatedList,
      }));
      setIsOpen();
    } else {
      notify(response?.message, "error");
    }
  };

  const handleModel = (
    label,
    width,
    type,
    isOpen,
    Component,
    handleInsertAPI,
  ) => {
    setHandleModelData({
      label,
      width,
      type,
      isOpen,
      Component,
      handleInsertAPI,
    });
  };
  const thead = [
    { name: t("S.No"), width: "1%" },
    { name: t("Allergy"), width: "10%" },
    { name: t("Allergy Type"), width: "10%" },
    { name: t("Remark"), width: "5%" },
    { name: t("Remove"), width: "5%" },
  ];
  console.log(data);

  const handleSave = async () => {
    const reqBody = {
      patientID: PatientID ?? "",
      transactionID: TransactionID ?? "",
      appID: appID ?? "",
      allergyName: values?.Allergy?.label ?? "",
      allergyID: values?.Allergy?.value ?? "",
      allergyType: values?.Type?.label ?? "",
      allergyTypeID: values?.Type?.value ?? "",
      remarks: values?.Remarks ?? "",
    };
    try {
      const response = await handleSavePatientAllergy(reqBody);
      if (response?.success) {
        notify(response?.message, "success");
        setValues({ Type: "", Remarks: "", Allergy: "" });
        handleSearch();
      } else {
        notify(response?.message, "warn");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const DeletePatientAllergy = async (ele) => {
    const reqbody = {
      id: ele?.ID ?? 0,
      transactionID: ele?.TransactionID ?? "",
      allergyName: ele?.Allergies ?? "",
      allergyType: ele?.AllergyType ?? "",
      remarks: ele?.Remarks ?? "",
    };
    try {
      const response = await handleDeletePatientAllergy(reqbody);
      if (response?.success) {
        notify(response?.message, "success");
        handleSearch();
      } else {
        notify(response?.message, "warn");
      }
    } catch (error) {
      console.error("Error fetching dropdowns:", error);
    }
  };
  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("Patient Allergy")} isBreadcrumb={false} />
          <div className="row p-2">
            <div className="col-xl-2 col-md-3 col-sm-4 col-12">
              <div className="d-flex">
                <ReactSelect
                  placeholderName={t("Allergy")}
                  name="Allergy"
                  value={values?.Allergy}
                  handleChange={handleReactSelectChange}
                  dynamicOptions={dropDownState?.bindAllergyList}
                  searchable={true}
                  id="Allergy"
                  respclass="w-100 pr-2"
                />
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() =>
                    handleModel(
                      "Allergy Model",
                      "25vw",
                      "Allergy",
                      true,
                      <AllergyModal
                        editList={dropDownState?.bindAllergyList}
                        handleSave={handleAllergyAPI_ref}
                      />,
                      handleAllergyAPI,
                    )
                  }
                >
                  <i className="fa fa-plus-circle fa-sm"></i>
                </button>
              </div>
            </div>

            <div className="col-xl-2 col-md-3 col-sm-4 col-12">
              <div className="d-flex">
                <ReactSelect
                  placeholderName={t("Type")}
                  name="Type"
                  value={values?.Type}
                  handleChange={handleReactSelectChange}
                  dynamicOptions={dropDownState?.bindTypeList}
                  searchable={true}
                  id="Type"
                  respclass="w-100 pr-2"
                />
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() =>
                    handleModel(
                      "Type Model",
                      "25vw",
                      "Type",
                      true,
                      <TypeModal
                        editList={dropDownState?.bindTypeList}
                        handleSave={handleTypeAPI_ref}
                      />,
                      handleTypeAPI,
                    )
                  }
                >
                  <i className="fa fa-plus-circle fa-sm"></i>
                </button>
              </div>
            </div>
            <Input
              type="text"
              className="form-control"
              id="Remarks"
              lable={t("Remarks")}
              placeholder=" "
              required={true}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              name="Remarks"
              value={values?.Remarks}
              onChange={handleChange}
            />
            <div className="col-xl-1 col-md-4 col-sm-4 col-sm-4 col-12">
              <button
                className="btn btn-sm btn-success w-100"
                onClick={handleSave}
              >
                {t("Save")}
              </button>
            </div>
          </div>
        </div>
        {tableData?.length > 0 && (
          <div className="card">
            <Heading title={t("Details")} isBreadcrumb={false} />
            <div className="row">
              <div className="col-sm-12">
                <Tables
                  thead={thead}
                  tbody={tableData?.map((ele, index) => ({
                    srNo: index + 1,
                    Allergy: ele?.Allergies,
                    AllergyType: ele?.AllergyType,
                    Remarks: ele?.Remarks,
                    Remove: (
                      <i
                        className="fa fa-trash text-danger"
                        style={{ cursor: "pointer" }}
                        onClick={() => DeletePatientAllergy(ele)}
                      />
                    ),
                  }))}
                  tableHeight={"scrollView"}
                  style={!isMobile ? { height: "44vh" } : {}}
                />
              </div>
            </div>
          </div>
        )}
        {handleModelData?.isOpen && (
          <Modal
            visible={handleModelData?.isOpen}
            setVisible={setIsOpen}
            modalWidth={handleModelData?.width}
            Header={t(handleModelData?.label)}
            handleAPI={handleModelData?.handleInsertAPI}
            setModalData={setModalData}
            modalData={modalData}
          >
            {handleModelData?.Component}
          </Modal>
        )}
      </div>
    </>
  );
};

export default PatientAllergy;
