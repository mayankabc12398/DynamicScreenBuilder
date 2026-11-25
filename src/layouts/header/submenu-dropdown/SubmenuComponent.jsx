import React from 'react'
import { useTranslation } from "react-i18next";

const SubmenuComponent = ({ isOpen, onClose, children }) => {
  const [t] = useTranslation();
  return (
    <>
        <div className={`submenusidebar ${isOpen ? 'open' : ''}`}>
      <div className="submenusidebar-content">
        <button className="close-btn" onClick={onClose}>
          {t("Close")}
        </button>
        {children}
      </div>
    </div>
    </>
  )
}

export default SubmenuComponent