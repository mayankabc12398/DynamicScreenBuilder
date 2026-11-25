import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import TextAreaInput from "../../../formComponent/TextAreaInput";
import { BillingRemarkSaveItemRemark } from "../../../../networkServices/BillingsApi";
import { notify } from "../../../../utils/utils";

/**
 * Bill ki EK line ka remark.
 *
 * Billing Remarks (upar wala button) poore bill ka remark hai - wo
 * patient_medical_history.BillingRemarks me jaata hai aur har baar naya likha
 * jaata hai. Ye uska chhota bhai nahi hai: ye EK line ka remark hai aur
 * f_ledgertnxdetail.Remarks me us line ki apni ID par jaata hai.
 *
 * DHYAN: wahi column Set Rate aur Set Quantity bhi likhte hain - wahan jo
 * reason bharte hain wo isi khaane me jaata hai. Yaani ek line par dono me se
 * jo baad me chalega, wahi reh jayega. Isi liye purana remark khulte hi dikh
 * jaata hai, taaki user bina dekhe kuch mita na de.
 */
const ItemRemarkModal = ({ data, handleModalState, GetBindBillDepartment, parentCategory }) => {
  const [t] = useTranslation();

  // Purana remark pehle se bhara hua - user use padh kar hi badle.
  const [remarks, setRemarks] = useState(data?.Remarks ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;

    const id = Number(data?.ID) || 0;
    if (!id) {
      notify(t("Item not found"), "error");
      return;
    }

    setSaving(true);
    try {
      const resp = await BillingRemarkSaveItemRemark({
        ID: id,
        // Column varchar(200) hai - server bhi kaatta hai, par yahan kaat dene
        // se user ko turant pata chal jaata hai ki kitna gaya.
        Remarks: String(remarks ?? "").trim().slice(0, 200),
      });

      if (resp?.success) {
        notify(resp?.message || t("Remark saved successfully"), "success");
        handleModalState(false, null, null, null, <></>);
        /* Sirf usi department ki line dobara padhi jaati hain, poore bill ki
           nahi - wahi tareeqa jo Reject par lagaya gaya tha. */
        if (GetBindBillDepartment) await GetBindBillDepartment(parentCategory);
        return;
      }

      notify(resp?.message || t("Could not save the remark"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-2">
      <div className="mb-2" style={{ fontSize: 13 }}>
        <strong>{data?.ItemName}</strong>
      </div>

      <TextAreaInput
        lable={t("Remark")}
        id="ItemRemark"
        name="ItemRemark"
        rows={4}
        value={remarks}
        onChange={(e) => setRemarks(e?.target?.value)}
        respclass="col-12"
      />

      <div
        className="mb-2"
        style={{ fontSize: 11.5, opacity: 0.7, textAlign: "right" }}
      >
        {String(remarks ?? "").length} / 200
      </div>

      <div className="d-flex align-items-center justify-content-end">
        <button
          className="btn btn-sm btn-primary"
          type="button"
          disabled={saving}
          onClick={handleSave}
        >
          {t("Save")}
        </button>
      </div>
    </div>
  );
};

export default ItemRemarkModal;
