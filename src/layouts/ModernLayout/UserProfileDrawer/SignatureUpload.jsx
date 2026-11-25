import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useTheme } from "@app/hooks/useTheme";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import { notify } from "@app/utils/utils";
import { updateSignatureApi } from "@app/networkServices/HeaderApi";

/**
 * SignatureUpload — themed signature upload for the NextGen drawer modal.
 *
 * Same contract as the classic UploadSignature (PNG ≤ 30KB, base64 →
 * updateSignatureApi), restyled to a clean drag-and-drop card. Closes via
 * setHandleModelData({ isOpen:false }) so the drawer <Modal/> hides.
 */
const MAX_BYTES = 30000;

export default function SignatureUpload({ setHandleModelData }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [t] = useTranslation();
  const localData = useLocalStorage("userData", "get") || {};

  const inputRef = useRef(null);
  const [preview, setPreview] = useState(localData?.employeeSignature || "");
  const [base64, setBase64] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);

  const close = () => setHandleModelData((prev) => ({ ...prev, isOpen: false }));

  const readFile = (file) => {
    if (!file) return;
    if (file.type !== "image/png") return notify("Only PNG images are allowed.", "error");
    if (file.size > MAX_BYTES) return notify("File size must be 30KB or less.", "error");
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      setBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    readFile(e.dataTransfer.files?.[0]);
  };

  const removeImage = () => {
    setPreview("");
    setBase64("");
  };

  const save = async () => {
    if (!base64) return notify("Please upload a signature.", "warn");
    setSaving(true);
    const res = await updateSignatureApi(
      {
        EmailId: localData?.email,
        MobileNo: localData?.mobile,
        EmployeeSignature: base64,
        preview: localData?.employeePhoto,
      },
      localData?.employeeID,
    );
    setSaving(false);
    if (res?.success) {
      useLocalStorage("userData", "set", res?.data?.loginResponse);
      notify(res?.message, "success");
      close();
    } else {
      notify(res?.message || res?.data?.message, "error");
    }
  };

  return (
    <div
      style={{
        padding: 4,
        fontFamily: "'Plus Jakarta Sans','Outfit',system-ui,sans-serif",
        color: c.text,
      }}
    >
      {/* Dropzone / preview */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          position: "relative",
          border: `2px dashed ${dragOver ? c.accent : c.border}`,
          borderRadius: 14,
          background: dragOver ? c.accentSoft : c.panel2 || c.panel,
          minHeight: 190,
          display: "grid",
          placeItems: "center",
          padding: 18,
          cursor: "pointer",
          transition: "border-color .15s, background .15s",
        }}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Signature preview"
              style={{ maxWidth: "100%", maxHeight: 150, objectFit: "contain" }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeImage();
              }}
              title={t("Remove")}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "none",
                background: c.danger,
                color: "#fff",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
            >
              <i className="fa fa-trash" style={{ fontSize: 12 }} />
            </button>
          </>
        ) : (
          <div style={{ textAlign: "center", color: c.textMuted }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                margin: "0 auto 12px",
                display: "grid",
                placeItems: "center",
                background: c.accentSoft,
                color: c.accent,
              }}
            >
              <i className="fa fa-signature" style={{ fontSize: 22 }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>
              {t("Drop signature here or click to browse")}
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {t("PNG only")} · {t("Max size 30KB")}
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png"
          onChange={(e) => {
            readFile(e.target.files?.[0]);
            e.target.value = "";
          }}
          style={{ display: "none" }}
        />
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 16,
        }}
      >
        <button
          type="button"
          onClick={close}
          style={{
            padding: "9px 18px",
            borderRadius: 9,
            border: `1px solid ${c.border}`,
            background: c.panel,
            color: c.text,
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {t("Cancel")}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{
            padding: "9px 22px",
            borderRadius: 9,
            border: "none",
            background: c.accent,
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.7 : 1,
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <i className={`fa ${saving ? "fa-spinner fa-spin" : "fa-check"}`} />
          {t("Save")}
        </button>
      </div>
    </div>
  );
}
