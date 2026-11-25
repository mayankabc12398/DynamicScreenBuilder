import React, { useEffect, useState } from "react";
import { PatientSearchbyBarcode } from "../../networkServices/opdserviceAPI";
import { BindRoomDetails } from "../../networkServices/BillingsApi";
import PatientInfoStrip from "./PatientInfoStrip";
import OverLay from "../modalComponent/OverLay";
import PatientRegistration from "../../pages/frontOffice/PatientRegistration/Index";

import { useTranslation } from "react-i18next";

// a photo the browser can show (data URL with content, http(s) or blob URL)
const isShowable = (src) =>
  /^(https?:|blob:)/i.test(src || "") || (/^data:image/i.test(src || "") && String(src).split(",")[1]?.length > 0);

const PersonalDetailsOfPatient = ({ data, onPanelUpdate }) => {
  // debugger
  // the strip reads every field itself; these drive the photo, billing category and panels
  const { patientID, patientPhoto, transactionID } = data;
  const [t] = useTranslation();

  /* patient_master.PatientPhoto holds the photo's folder on the server, not a URL, and the
     list data's patientPhoto is not a reliable image either. So the photo is always read
     the way Patient Registration reads it - the barcode search returns it as base64
     (Image); patientPhoto is used only when that has none and it is itself an image. */
  const [photo, setPhoto] = useState("");

  // Reads the patient's current photo from the API. Used on load and again on mouse hover.
  const fetchPhoto = async () => {
    const fallback = isShowable(patientPhoto) ? patientPhoto : "";
    if (!patientID) return fallback;
    try {
      const res = await PatientSearchbyBarcode(patientID, 1);
      const row = Array.isArray(res?.data) ? res.data[0] : res?.data;
      const img = row?.Image ?? row?.image;
      return isShowable(img) ? img : fallback;
    } catch {
      return fallback;
    }
  };

  useEffect(() => {
    setPhoto("");
    let alive = true;
    fetchPhoto().then((img) => alive && setPhoto(img));
    return () => {
      alive = false;
    };
  }, [patientID, patientPhoto]);

  /* Billing Category Name — same "current billing category" shown on Add Services
     (DoctorShift/BindRoomDetails, the "IN" row), read-only here too. */
  const [billingCategoryName, setBillingCategoryName] = useState("");
  useEffect(() => {
    setBillingCategoryName("");
    if (!transactionID) return;
    let alive = true;
    BindRoomDetails(transactionID)
      .then((res) => {
        if (!alive) return;
        const rows = res?.success ? res?.data || [] : [];
        const activeRoom = rows.find((r) => r?.Status === "IN") || rows[0];
        setBillingCategoryName(activeRoom?.BillingCategory || "");
      })
      .catch(() => alive && setBillingCategoryName(""));
    return () => {
      alive = false;
    };
  }, [transactionID]);

  const [panelListPopup, setPanelListPopup] = useState(false);
  return (
    <div className="mb-1">
      {/* pastel strip: photo, name, UHID / IPD (copy), room, doctor, admitted (day N), panel (+ add /
          remove panels), mobile, billing category, discharge, status — first line only until the
          arrow shows the rest */}
      <PatientInfoStrip
        data={{ ...data, patientPhoto: photo || (isShowable(patientPhoto) ? patientPhoto : "") }}
        t={t}
        billingCategory={billingCategoryName}
        onAddPanel={() => setPanelListPopup(true)}
      />
      {panelListPopup && (
        <OverLay
          visible={panelListPopup}
          setVisible={setPanelListPopup}
          Header={t("Add/Remove Scheme List")}
        >
          <PatientRegistration
            PatientID={patientID}
            type={"panelDetail"}
            setVisible={setPanelListPopup}
            bindDetail={true}
            bindDetailAPI={() => {}}
            updateButtonName={"Update Scheme"}
            handleBindPanelByPatientID={onPanelUpdate || (() => {})}
          />
        </OverLay>
      )}
    </div>
  );
};

export default PersonalDetailsOfPatient;
