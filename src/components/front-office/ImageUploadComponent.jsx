import React from "react";
import { useTranslation } from "react-i18next";

const ImageUploadComponent = ({ isOpen, onClose, children }) => {
  const [t] = useTranslation();
  return (
    <>
      <div className={`imageUpload ${isOpen ? "open" : ""}`}>
        <div className="imageUpload-content">
          <button className="close-btn-Upload" onClick={onClose}>
            {t("Close")}
          </button>
          {children}
        </div>
      </div>
    </>
  );
};

export default ImageUploadComponent;
