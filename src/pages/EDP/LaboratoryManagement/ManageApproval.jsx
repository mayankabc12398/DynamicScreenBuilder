import React, { useEffect, useState } from "react";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import {
  BindDetailApproval,
  BindDoctor,
  BindEmployeeApproval,
  BindRoleApproval,
  GetApprovalGroupOptions,
  RemoveSignApproval,
  SaveManageApproval,
} from "../../../networkServices/EDP/edpApi";
import { handleReactSelectDropDownOptions, notify } from "../../../utils/utils";
import { THEAD } from "../../../utils/constant";
import Tables from "../../../components/UI/customTable";
import BrowseButton from "../../../components/formComponent/BrowseButton";
import MultiSelectComp from "../../../components/formComponent/MultiSelectComp";

const ManageApproval=()=> {
  const forApprovalOptions = [
    { ID: 1, Name: "Approve" },
    { ID: 2, Name: "Forward" },
    { ID: 3, Name: "Approve & NotApprove" },
    { ID: 4, Name: "Approve & NotApprove & Unhold" },
    { ID: 5, Name: "Result Entry" },
  ];
  const [t] = useTranslation();
  const [bindDoctorData, setBindDoctorData] = useState([]);
  const [employee, setEmployee] = useState([]);
  const [bindRoledata, setBindRoledata] = useState([]);
  const [manageApprovalData, setManageApprovaldata] = useState([]);

  /* Group dropdown and the Edit button - both behind fin_global_resources
     IsMultipleTechnicianApproval (the flag for giving one signature to several technicians),
     which the server reads on every call. Off -> the screen is exactly what it was. */
  const [groupOptions, setGroupOptions] = useState({ enabled: false, groups: [] });
  const [groupID, setGroupID] = useState("");
  // The row being edited. While set, the doctor is fixed and cannot be changed.
  const [editingID, setEditingID] = useState(null);
  // Role-wise grouping of the list (same flag as the group dropdown): the role opened.
  const [openRole, setOpenRole] = useState("");

  const [values, setValues] = useState({
    doctor: "",
    // several technicians can be given the same rights in one go
    technician: [],
    bindRole: "",
    DigitalSignature: "",
    forApproval: "",
  });

  const BindDoctorAPI = async () => {
    try {
      const response = await BindDoctor();
      if (response.success) {
        setBindDoctorData(response?.data);
      } else {
        setBindDoctorData([]);
      }
    } catch (error) {
      setBindDoctorData([]);
    }
  };

  const handleBindEmployeeApproval = async () => {
    try {
      const response = await BindEmployeeApproval();
      if (response.success) {
        setEmployee(response?.data);
      } else {
        setBindDoctorData([]);
      }
    } catch (error) {
      setBindDoctorData([]);
    }
  };

  const handleBindRoleApproval = async () => {
    try {
      const response = await BindRoleApproval();
      if (response.success) {
        setBindRoledata(response?.data);
        console.log("the response bindrole the observation", response);
      } else {
        setBindRoledata([]);
      }
    } catch (error) {
      setBindRoledata([]);
    }
  };

  const handleBindGroups = async () => {
    try {
      const response = await GetApprovalGroupOptions();
      const d = response?.data;
      if (response?.success && (d?.enabled ?? d?.Enabled)) {
        setGroupOptions({ enabled: true, groups: d?.groups ?? d?.Groups ?? [] });
      } else {
        setGroupOptions({ enabled: false, groups: [] });
      }
    } catch (error) {
      setGroupOptions({ enabled: false, groups: [] });
    }
  };

  // Picking a group ticks every employee of that group as a technician. A group's
  // member who is not in the technician list (an inactive one) is simply left out.
  const handleGroupSelect = (name, value) => {
    const id = value?.value ?? "";
    setGroupID(id);
    if (id === "") return;
    const group = groupOptions.groups.find((g) => String(g?.id ?? g?.ID) === String(id));
    const members = new Set((group?.employeeIDs ?? group?.EmployeeIDs ?? []).map(String));
    setValues((prev) => ({
      ...prev,
      technician: employee
        .filter((item) => members.has(String(item?.employeeID)))
        .map((item) => ({ name: item?.name, code: item?.employeeID })),
    }));
  };

  // Edit: the row's doctor, login type, authority and signature come into the form, the
  // doctor is locked, and its technician - if it has one - is ticked. A row without a
  // technician is fine: the box is just left empty to be filled.
  const handleEdit = (row) => {
    const techID = String(row?.TechnicalID ?? row?.technicalID ?? "");
    const tech = techID
      ? employee.find((item) => String(item?.employeeID) === techID)
      : null;
    setEditingID(row?.id);
    setOpenRole(String(row?.Roleid ?? ""));
    setGroupID("");
    setValues({
      doctor: String(row?.EmployeeID ?? ""),
      technician: tech ? [{ name: tech?.name, code: tech?.employeeID }] : [],
      bindRole: String(row?.Roleid ?? ""),
      DigitalSignature: row?.DigitalSignature || "",
      forApproval: row?.ApprovalID ?? row?.approvalID ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingID(null);
    setGroupID("");
    setValues({
      doctor: "",
      technician: [],
      bindRole: "",
      DigitalSignature: "",
      forApproval: "",
    });
  };

  const handleBindApproval = async () => {
    try {
      const response = await BindDetailApproval();
      if (response.success) {
        setManageApprovaldata(response?.data);
        console.log("the binde approval for table data is", response);
      } else {
        setManageApprovaldata([]);
      }
    } catch (error) {
      setManageApprovaldata([]);
    }
  };

  const handleImageChange = (e) => {
    const file = e?.target?.files[0];

    if (file) {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        notify(t("File size exceeds 5MB. Please choose a smaller file."), "error");
        return;
      }
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader?.result.split(",")[1];
        setValues((val) => ({ ...val, [e?.target?.name]: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };
  console.log(values);

  const handleSaveManageApproval = async () => {
    if (!values?.doctor) {
      notify(t("Please select doctor"), "error");
      return;
    }
    if (!values?.technician?.length) {
      notify(t("Please select technician"), "error");
      return;
    }
    if (!values?.bindRole) {
      notify(t("Please select role"), "error");
      return;
    }

    // The API saves one technician per call, so the selected technicians are
    // sent one after another and the outcome is reported once at the end.
    let selectedTechnicians = values?.technician || [];
    const failed = [];
    let saved = 0;

    /* Editing a row to give the same signature to more technicians: the ones this doctor
       already has in this login type are not saved again (the server would refuse them as
       "already exists"). */
    let skipped = 0;
    if (editingID) {
      selectedTechnicians = selectedTechnicians.filter((technician) => {
        const exists = manageApprovalData.some(
          (row) =>
            String(row?.EmployeeID) === String(values?.doctor) &&
            String(row?.TechnicalID ?? "") === String(technician?.code) &&
            String(row?.Roleid) === String(values?.bindRole),
        );
        if (exists) skipped += 1;
        return !exists;
      });
      if (!selectedTechnicians.length) {
        notify("These technicians already have this right. Pick others.", "error");
        return;
      }
    }

    try {
      for (const technician of selectedTechnicians) {
        const payload = {
          employeeID: values?.doctor,
          technicalID: technician?.code,
          approval: values?.forApproval,
          DigitalSignature: values?.DigitalSignature,
          roleID: values?.bindRole,
        };

        const apiResp = await SaveManageApproval(payload);
        if (apiResp?.success) {
          saved += 1;
        } else {
          failed.push(technician?.name);
        }
      }

      if (saved > 0) {
        notify(
          `${saved} technician(s) saved successfully` +
            (skipped ? ` (${skipped} already had it)` : ""),
          "success",
        );
        handleBindApproval();
        resetForm();
      }

      if (failed.length) {
        notify(`Not saved: ${failed.join(", ")}`, "error");
      }
    } catch (error) {
      notify(t("An error occurred while saving data"), "error");
    }
  };

  const handleOpenImage = (base64String) => {
    const imageType = "png";
    const imageSrc = `data:image/${imageType};base64,${base64String}`;
  
    const newTab = window.open('', '', 'width=600,height=400');
    if (newTab) {
      newTab.document.write(`<img src="${imageSrc}" style="width: 600px; height: 400px; object-fit: contain; alt="Image" />`);
      newTab.document.title = "Base64 Image";
    } };

  const handleSelect = (name, value) => {
    console.log(value);
    setValues((prev) => ({ ...prev, [name]: value?.value }));
  };

  const handleMultiSelect = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value || [] }));
  };

  const handleDelete = async (id) => {
    try {
      const response = await RemoveSignApproval(id);
      if (response.success) {
        notify(response?.message, "success");
        handleBindApproval();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const Thead = [
    { width: "5%", name: t("Sr.No") },
    { width: "15%", name: t("RoleName") },
    { width: "15%", name: t("Employee Name") },
    { width: "15%", name: t("Technician Name") },
    { width: "10%", name: t("Authority") },
    { width: "15%", name: t("Default Signature") },
    { width: "10%", name: t("Delete") },
    { width: "10%", name: t("View Signature") },
    ...(groupOptions.enabled ? [{ width: "5%", name: t("Edit") }] : []),
  ];

  // The list rows. Sr.No restarts inside each role when the list is grouped.
  const buildRows = (list) =>
    list.map((val, index) => ({
      sno: index + 1,
      RoleName: val.Rolename || "",
      EmployeeName: val.empName || "",
      TechnicianName: val.TechName || "",
      Authority: val.Authority || "",
      DefaultSignature: val.DefaultSignature || "No",
      Delete: (
        <i className="fa fa-trash text-danger" onClick={() => handleDelete(val.id)}></i>
      ),
      ViewSignature: (
        <i
          className="fa fa-search text-primary"
          onClick={() => handleOpenImage(val?.DigitalSignature)}
        ></i>
      ),
      ...(groupOptions.enabled && {
        Edit: (
          <i
            className="fa fa-edit text-primary"
            role="button"
            title={t("Edit")}
            onClick={() => handleEdit(val)}
          ></i>
        ),
      }),
    }));

  // Rows grouped by role, in the order the roles first appear.
  const roleGroups = [];
  manageApprovalData.forEach((val) => {
    const roleID = String(val?.Roleid ?? "");
    let grp = roleGroups.find((g) => g.roleID === roleID);
    if (!grp) {
      grp = { roleID, roleName: val?.Rolename || "", rows: [] };
      roleGroups.push(grp);
    }
    grp.rows.push(val);
  });

  useEffect(() => {
    BindDoctorAPI();
    handleBindEmployeeApproval();
    handleBindRoleApproval();
    handleBindApproval();
    handleBindGroups();
  }, []);
  return (
    <div className="card pt-3">
      <div className="row p-2">
        <ReactSelect
          placeholderName={t("Doctor")}
          id={"doctor"}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          name="doctor"
          dynamicOptions={[
            ...handleReactSelectDropDownOptions(
              bindDoctorData,
              "NAME",
              "EmployeeID"
            ),
          ]}
          handleChange={handleSelect}
          value={`${values?.doctor}`}
          isDisabled={!!editingID}
        />
        {groupOptions.enabled && (
          <ReactSelect
            placeholderName={t("Employee Group")}
            id={"employeeGroup"}
            searchable={true}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            name="employeeGroup"
            dynamicOptions={groupOptions.groups.map((g) => ({
              label: g?.name ?? g?.Name,
              value: g?.id ?? g?.ID,
            }))}
            handleChange={handleGroupSelect}
            value={`${groupID}`}
          />
        )}
        <MultiSelectComp
          placeholderName={t("Technician")}
          id={"technician"}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          name="technician"
          dynamicOptions={employee?.map((item) => ({
            name: item?.name,
            code: item?.employeeID,
          }))}
          handleChange={handleMultiSelect}
          value={values?.technician}
        />
        <ReactSelect
          placeholderName={t("Login Type")}
          id={"bindRole"}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          name="bindRole"
          dynamicOptions={[
            ...handleReactSelectDropDownOptions(bindRoledata, "RoleName", "ID"),
          ]}
          handleChange={handleSelect}
          value={`${values?.bindRole}`}
        />
        <ReactSelect
          placeholderName={t("For Approval")}
          id={"forApproval"}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          name="forApproval"
          dynamicOptions={[
            ...handleReactSelectDropDownOptions(
              forApprovalOptions,
              "Name",
              "ID"
            ),
          ]}
          handleChange={handleSelect}
          value={values?.forApproval}
        />

        <div className="d-flex justify-content-center align-items-baseline">
          <BrowseButton
            handleImageChange={handleImageChange}
            value={values.DigitalSignature}
            className={"btn-primary  w-100 "}
            name="DigitalSignature"
            label={t("Digital Signature")}
            accept={".jpg, .jpeg, .png"}
          />

          <button
            className="btn btn-lg btn-success ml-2"
            type="button"
            onClick={handleSaveManageApproval}
          >
            {editingID ? t("Update") : t("Add")}
          </button>
          {editingID && (
            <button
              className="btn btn-lg btn-secondary ml-2"
              type="button"
              onClick={resetForm}
            >
              {t("Cancel")}
            </button>
          )}
        </div>
      </div>

      {manageApprovalData.length > 0 && !groupOptions.enabled && (
        <div className="card">
          <Tables
            thead={Thead}
            tbody={buildRows(manageApprovalData)}
            // the table component renders its own search box above the grid
            isSearch={true}
          />
        </div>
      )}

      {/* Role-wise: one bar per role, and only the role that was clicked is open. */}
      {manageApprovalData.length > 0 && groupOptions.enabled && (
        <div className="card">
          {roleGroups.map((grp) => {
            const isOpen = String(openRole) === String(grp.roleID);
            return (
              <div key={grp.roleID} className="border-bottom">
                <div
                  role="button"
                  className="d-flex align-items-center justify-content-between px-3 py-2"
                  style={{
                    cursor: "pointer",
                    background: isOpen ? "#d9ecf7" : "#f4f7fa",
                    fontWeight: 600,
                  }}
                  onClick={() => setOpenRole(isOpen ? "" : String(grp.roleID))}
                >
                  <span>
                    <i
                      className={`fa ${isOpen ? "fa-chevron-down" : "fa-chevron-right"} mr-2`}
                      aria-hidden="true"
                    />
                    {grp.roleName || t("(No role)")}
                  </span>
                  <span className="badge badge-primary">{grp.rows.length}</span>
                </div>
                {isOpen && (
                  <Tables thead={Thead} tbody={buildRows(grp.rows)} isSearch={true} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ManageApproval;
