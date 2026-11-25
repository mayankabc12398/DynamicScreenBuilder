import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LabeledInput from "../../../formComponent/LabeledInput";
import ReactSelect from "../../../formComponent/ReactSelect";
import {
  BindDoctorDeptAll,
  PatientBillingChangeItemDoctor,
} from "../../../../networkServices/BillingsApi";
import { handleReactSelectDropDownOptions, notify } from "../../../../utils/utils";

// Department Details > Edit row: change the doctor credited against one billed
// item (f_ledgertnxdetail.DoctorID / DoctorName). Rate, Qty, discount and amount
// are untouched. Gated end-to-end by fin_global_resources ShowChangeDoctorOnBillItem.
const ChangeItemDoctorModal = ({ data, handleModalState, GetBindBillDepartment }) => {
  const [t] = useTranslation();
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await BindDoctorDeptAll();
        setDoctorOptions(
          handleReactSelectDropDownOptions(response?.data, "Name", "DoctorID"),
        );
      } catch (error) {
        console.log(error, "Something Went Wrong");
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!doctor?.value) {
      notify(t("Please select Doctor"), "warn");
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    try {
      const response = await PatientBillingChangeItemDoctor({
        ID: data?.ID,
        DoctorID: Number(doctor.value),
        TransactionID: data?.TransactionID,
      });
      notify(response?.message, response?.success ? "success" : "error");
      if (response?.success) {
        handleModalState(false, null, null, null);
        await GetBindBillDepartment();
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="row">
        <LabeledInput
          className={"col-12"}
          value={data?.ItemName}
          label={t("Item Name")}
        />
        <LabeledInput
          className={"col-12"}
          // sp_ipd_billing_showItemsDetails selects f_ledgertnxdetail.Doctorname with no
          // alias, which MySQL/Dapper returns keyed by the table's own column name
          // (DoctorName) - data?.Name is the entry USER (ltd.UserName), not the doctor,
          // so it must not be used here.
          value={data?.DoctorName ?? data?.Doctorname ?? ""}
          label={t("Current Doctor")}
        />
        <ReactSelect
          respclass={"col-12"}
          placeholderName={t("New Doctor")}
          searchable={true}
          removeIsClearable={true}
          value={doctor}
          name={"doctor"}
          dynamicOptions={doctorOptions}
          handleChange={(name, e) => setDoctor(e)}
        />
      </div>
      <div className="d-flex align-items-center justify-content-end mt-2">
        <button
          className="btn btn-sm btn-primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {t("Save")}
        </button>
      </div>
    </>
  );
};

export default ChangeItemDoctorModal;
