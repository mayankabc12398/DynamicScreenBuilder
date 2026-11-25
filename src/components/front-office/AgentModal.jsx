import React, { useEffect, useState } from "react";
import { t } from "i18next";
import ReactSelect from "../formComponent/ReactSelect";
import Input from "../formComponent/Input";
import TextAreaInput from "../formComponent/TextAreaInput";
import Tables from "../UI/customTable";
import Heading from "../UI/Heading";
import { BindAgent, DeleteAgent, UpdateAgent } from "../../networkServices/agent";
import { notify } from "../../utils/utils";

/**
 * Add / edit agents for the OPD booking screen. Built like ReferDoctorModal:
 * the form on top feeds the modal's Save button (through setModalData), while
 * edit and delete act on the list underneath straight away.
 */
const AgentModal = ({ setModalData, DropDownState, onListChange = () => {} }) => {
  const [agentList, setAgentList] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const emptyForm = {
    title: { label: "", value: "" },
    name: "",
    contactNo: "",
    proName: { label: "", value: "" },
    address: "",
    pincode: "",
  };
  const [values, setValues] = useState({ ...emptyForm });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "contactNo" && value?.length > 15) {
      return;
    }
    if (name === "pincode" && (!/^\d*$/.test(value) || value?.length > 6)) {
      return;
    }
    setValues((prevValues) => ({ ...prevValues, [name]: value }));
  };

  const handleReactSelectChange = (name, value) => {
    setValues((prevValues) => ({ ...prevValues, [name]: value }));
  };

  useEffect(() => {
    setModalData(values);
  }, [values]);

  const Thead = [
    { width: "5%", name: t("S.No") },
    { width: "10%", name: t("Title") },
    { width: "30%", name: t("Agent Name") },
    { width: "15%", name: t("Contact No.") },
    { width: "15%", name: t("Pro Name") },
    { width: "15%", name: t("Address") },
    { width: "5%", name: t("Pincode") },
    { width: "10%", name: t("Action") },
  ];

  const fetchAgentList = async () => {
    try {
      const resp = await BindAgent(1);
      setAgentList(resp?.success ? resp?.data || [] : []);
      onListChange();
    } catch (error) {
      console.log(error?.message);
    }
  };

  useEffect(() => {
    fetchAgentList();
  }, []);

  // The modal's own Save button makes no sense while a row is being edited,
  // so it is hidden until the edit is finished - same trick ReferDoctorModal uses.
  useEffect(() => {
    const saveBtn = document
      .querySelector(".agent-modal-container")
      ?.closest(".p-dialog")
      ?.querySelector(".ftr_btn button:first-child");
    if (saveBtn) {
      saveBtn.style.display = isEdit ? "none" : "inline-block";
    }
    return () => {
      if (saveBtn) {
        saveBtn.style.display = "inline-block";
      }
    };
  }, [isEdit]);

  const handleEdit = (item) => {
    setValues({
      title: item?.Title
        ? { label: item?.Title, value: item?.Title }
        : { label: "", value: "" },
      name: item?.AgentName || "",
      contactNo: item?.Mobile || "",
      proName: item?.ProID
        ? { label: item?.ProName || "", value: item?.ProID }
        : { label: "", value: "" },
      address: item?.Address || "",
      pincode: item?.Pincode || "",
    });
    setIsEdit(true);
    setEditId(item?.AgentID);
  };

  const resetForm = () => {
    setValues({ ...emptyForm });
    setIsEdit(false);
    setEditId(null);
  };

  const handleUpdate = async () => {
    if (!values?.name || values?.name.trim() === "") {
      notify("Agent Name is required", "error");
      return;
    }

    const payload = {
      agentID: editId,
      title: values?.title?.value || "",
      agentName: values?.name,
      mobile: values?.contactNo || "",
      address: values?.address || "",
      pincode: values?.pincode || "",
      proID: Number(values?.proName?.value || 0),
    };

    try {
      const resp = await UpdateAgent(payload);
      if (resp?.success) {
        notify(resp?.message, "success");
        fetchAgentList();
        resetForm();
      } else {
        notify(resp?.message || "Error updating agent", "error");
      }
    } catch (error) {
      console.error("Error updating agent:", error);
      notify(error?.message || "Error updating agent", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      const resp = await DeleteAgent(id);
      if (resp?.success) {
        notify(resp?.message, "success");
        fetchAgentList();
        resetForm();
      } else {
        notify(resp?.message || "Error deleting agent", "error");
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      notify(error?.message || "Error deleting agent", "error");
    }
  };

  return (
    <div className="agent-modal-container">
      <div className="row">
        <div className="d-flex justify-content-start align-items-center col-xl-12 col-md-12 col-sm-12 col-12">
          <ReactSelect
            placeholderName={t("Title")}
            searchable={true}
            name={"title"}
            respclass="col-xl-4 col-md-4 col-sm-6 col-3"
            dynamicOptions={[
              { label: t("Mr."), value: "Mr." },
              { label: t("Mrs."), value: "Mrs." },
              { label: t("Ms."), value: "Ms." },
            ]}
            handleChange={handleReactSelectChange}
            value={values?.title?.value}
            removeIsClearable={false}
          />
          <Input
            type="text"
            className="form-control required-fields"
            placeholder={" "}
            removeFormGroupClass={false}
            name="name"
            lable={t("Agent Name")}
            required={true}
            onChange={handleInputChange}
            value={values?.name}
            respclass="col-xl-8 col-md-8 col-sm-6 col-9"
          />
        </div>

        <div className="d-flex justify-content-start align-items-center col-xl-12 col-md-12 col-sm-12 col-12">
          <Input
            type="Number"
            className="form-control"
            removeFormGroupClass={false}
            name="contactNo"
            lable={t("Contact No.")}
            onChange={handleInputChange}
            value={values?.contactNo}
            respclass="col-xl-6 col-md-6 col-sm-12"
            placeholder={" "}
          />
          <ReactSelect
            placeholderName={t("Pro Name")}
            searchable={true}
            name={"proName"}
            respclass="col-xl-6 col-md-6 col-sm-12"
            dynamicOptions={DropDownState?.getBindProList}
            handleChange={handleReactSelectChange}
            value={values?.proName}
            removeIsClearable={false}
          />
        </div>

        <div className="d-flex justify-content-start align-items-center col-xl-12 col-md-12 col-sm-12 col-12">
          <TextAreaInput
            type="text"
            className="form-control min-h-70"
            placeholder={" "}
            removeFormGroupClass={false}
            name="address"
            lable={t("Address")}
            onChange={handleInputChange}
            value={values?.address}
            respclass="col-xl-9 col-md-9 col-sm-12 col-12 "
          />
          <Input
            type="text"
            className="form-control"
            removeFormGroupClass={false}
            name="pincode"
            lable={t("Pincode")}
            onChange={handleInputChange}
            value={values?.pincode}
            respclass="col-xl-3 col-md-3 col-sm-12 col-12"
            placeholder={" "}
          />
        </div>

        {isEdit && (
          <div className="d-flex justify-content-end col-xl-12 col-md-12 col-sm-12 col-12 mt-2">
            <button
              type="button"
              className="btn btn-sm btn-primary me-2"
              onClick={handleUpdate}
            >
              {t("Update")}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={resetForm}
            >
              {t("Cancel")}
            </button>
          </div>
        )}
      </div>

      {agentList?.length > 0 && (
        <div className="row mt-2">
          <div className="col-12">
            <Heading title={t("Agent List")} isBreadcrumb={false} />
            <Tables
              isSearch={true}
              thead={Thead}
              tbody={agentList?.map((item, index) => ({
                "S.No.": index + 1,
                Title: item?.Title,
                "Agent Name": item?.AgentName,
                "Contact No.": item?.Mobile,
                "Pro Name": item?.ProName,
                Address: item?.Address,
                Pincode: item?.Pincode,
                Action: (
                  <>
                    <button className="btn btn-sm btn-success mx-2">
                      <i
                        className="fas fa-edit pointer"
                        onClick={() => handleEdit(item)}
                        title={t("Edit")}
                      />
                    </button>
                    <button
                      className="btn btn-sm btn-danger mx-2"
                      title={t("Delete")}
                    >
                      <i
                        className="fas fa-trash pointer ms-2"
                        onClick={() => handleDelete(item?.AgentID)}
                      />
                    </button>
                  </>
                ),
              }))}
              tableHeight="tableHeight"
              scrollView="scrollView"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentModal;
