import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { useTheme } from "@app/hooks/useTheme";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import { inputBoxValidation, notify } from "@app/utils/utils";
import { MOBILE_NUMBER_VALIDATION_REGX } from "@app/utils/constant";
import {
  updateUserDetail,
  updatePassword,
} from "@app/networkServices/HeaderApi";
import Modal from "@app/components/modalComponent/Modal";
import ChangePasswordModel from "@app/components/modalComponent/Utils/ChangePasswordModel";
import SignatureUpload from "./SignatureUpload";

/**
 * ProfilePanel — NextGen drawer profile card.
 *
 * Parity with the classic <UserDropdown/> profile popup: edit photo, mobile &
 * email (Update Profile), Update Signature, Change Password. Reuses the same
 * APIs (updateUserDetail / updatePassword / updateSignatureApi) and the existing
 * ChangePasswordModel / UploadSignature modal bodies, restyled to the drawer.
 */
export default function ProfilePanel({ onClose }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [t] = useTranslation();
  const localData = useLocalStorage("userData", "get") || {};

  const fileRef = useRef(null);
  const [preview, setPreview] = useState(localData?.employeePhoto);
  const [mobile, setMobile] = useState(localData?.mobile || "");
  const [email, setEmail] = useState(localData?.email || "");

  const [pwdModal, setPwdModal] = useState(false);
  const [pwdData, setPwdData] = useState({});
  const [sigModal, setSigModal] = useState({ isOpen: false });

  const name = localData?.empName || "User";

  const onPickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleUpdateProfile = async () => {
    if (!email) return notify("Please Enter Email", "warn");
    if (!mobile) return notify("Please Enter Mobile Number", "warn");
    if (!mobile.match(MOBILE_NUMBER_VALIDATION_REGX)) {
      return notify("Please Enter Valid Mobile Number", "warn");
    }
    const res = await updateUserDetail(
      { EmailId: email, MobileNo: mobile, preview },
      localData?.employeeID,
    );
    if (res?.success) {
      useLocalStorage("userData", "set", res?.data?.loginResponse);
      notify(res?.message, "success");
    } else {
      notify(res?.message || res?.data?.message, "error");
    }
  };

  const handleChangePwd = async () => {
    const res = await updatePassword(pwdData);
    if (res?.success) {
      notify(res?.message, "success");
      setPwdModal(false);
      setPwdData({});
    } else {
      notify(res?.message, "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          color: c.textMuted,
          textTransform: "uppercase",
          letterSpacing: ".5px",
        }}
      >
        {t("My Profile")}
      </div>

      <div
        style={{
          border: `1px solid ${c.border}`,
          borderRadius: 12,
          background: c.panel,
          overflow: "hidden",
        }}
      >
        {/* Identity strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 12px 10px",
            background:
              "linear-gradient(180deg,rgba(15,118,110,.06),rgba(15,118,110,0))",
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img
              src={preview}
              alt={name}
              style={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                objectFit: "cover",
                border: `2px solid ${c.panel}`,
                boxShadow: `0 0 0 2px ${c.accent}55`,
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title={t("Change Photo")}
              style={{
                position: "absolute",
                right: -2,
                bottom: -2,
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: `2px solid ${c.panel}`,
                background: c.accent,
                color: "#fff",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                fontSize: 9,
                padding: 0,
              }}
            >
              <i className="fa fa-camera" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onPickPhoto}
              style={{ display: "none" }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Field
              c={c}
              icon="fa fa-mobile-alt"
              placeholder={t("Mobile Number")}
              value={mobile}
              onChange={(e) =>
                inputBoxValidation(MOBILE_NUMBER_VALIDATION_REGX, e, (ev) =>
                  setMobile(ev.target.value),
                )
              }
            />
            <div style={{ height: 6 }} />
            <Field
              c={c}
              icon="fa fa-envelope"
              placeholder={t("Email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Action buttons — color coded */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 6,
            padding: "0 10px 10px",
          }}
        >
          <ProfileBtn
            icon="fa fa-user-check"
            label={t("Update Profile")}
            fg="#0f766e"
            bg="#E6F7F2"
            onClick={handleUpdateProfile}
          />
          <ProfileBtn
            icon="fa fa-signature"
            label={t("Signature")}
            fg="#8a5e10"
            bg="#FFF8E6"
            onClick={() => {
              onClose?.();
              setSigModal({ isOpen: true });
            }}
          />
          <ProfileBtn
            icon="fa fa-key"
            label={t("Password")}
            fg="#5b53d6"
            bg="#EEEDFB"
            onClick={() => {
              onClose?.();
              setPwdModal(true);
            }}
          />
        </div>
      </div>

      {createPortal(
        <>
          {pwdModal && (
            <Modal
              visible={pwdModal}
              setVisible={() => {
                setPwdModal(false);
                setPwdData({});
              }}
              modalWidth="60vw"
              Header={t("Change Password")}
              buttonName={t("Update Password")}
              modalData={pwdData}
              setModalData={setPwdData}
              handleAPI={handleChangePwd}
            >
              <ChangePasswordModel
                handleChangeModel={setPwdData}
                inputData={{}}
              />
            </Modal>
          )}

          {sigModal?.isOpen && (
            <Modal
              visible={sigModal?.isOpen}
              setVisible={() => setSigModal({ isOpen: false })}
              modalWidth="440px"
              Header={t("Update Signature")}
              footer={<></>}
            >
              <SignatureUpload setHandleModelData={setSigModal} />
            </Modal>
          )}
        </>,
        document.body,
      )}
    </div>
  );
}

function Field({ c, icon, placeholder, value, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 30,
        padding: "0 10px",
        borderRadius: 8,
        border: `1px solid ${c.border}`,
        background: c.inputBg,
      }}
    >
      <i
        className={icon}
        style={{ fontSize: 11, color: c.accent, width: 14, textAlign: "center" }}
      />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          outline: "none",
          background: "transparent",
          color: c.text,
          fontSize: 12,
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}

function ProfileBtn({ icon, label, fg, bg, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "8px 4px",
        borderRadius: 9,
        border: `1px solid ${fg}22`,
        background: bg,
        color: fg,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 10.5,
        fontWeight: 700,
        minWidth: 0,
        transition: "filter .15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(.96)")}
      onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
    >
      <i className={icon} style={{ fontSize: 13 }} />
      <span
        style={{
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </button>
  );
}
