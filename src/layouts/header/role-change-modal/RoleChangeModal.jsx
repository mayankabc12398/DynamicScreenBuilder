import React, { useState, useEffect, useRef, useContext } from "react";
import { DesignContext } from "@app/providers/DesignProvider";
import { resolveRoleIcon, resolveFamily, FAMILIES } from "./roleFamilies";
import { HomePlusIcon } from "../../../components/SvgIcons";
import "./RoleChangeModal.css";
import Heading from "../../../components/UI/Heading";
import { icons } from "../../../components/SvgIcons";
import { useTranslation } from "react-i18next";
import LanguagesDropdown from "../languages-dropdown/LanguagesDropdown";


const RoleChangeModal = ({ show, onClose, onRoleSelect, GetRoleList, currentTheme, languages }) => {
  const [t] = useTranslation();
  const { isModern } = useContext(DesignContext) || {};
  const [search, setSearch] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    if (show && searchRef.current) {
      setSearch("");
      searchRef.current.focus();
    }
  }, [show]);

  const filteredRoles = GetRoleList?.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.roleName.toLowerCase().includes(q) ||
      t(item.roleName).toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && filteredRoles.length > 0) {
      onRoleSelect(filteredRoles[0]);
      onClose();
    }
  };

  if (!show) return null;

  const showNoResultMessage = filteredRoles.length === 0 && search.length > 0;


  return (
    <div className="rcm-overlay" onClick={onClose}>
      <div className="rcm-modal" onClick={(e) => e.stopPropagation()}>
        <Heading
          title={<span className="text-dark">{t("Select Your Role")}</span>}
          secondTitle={
            <div className="d-flex align-items-center">
              <LanguagesDropdown languages={languages} />
              <button
                className="py-2"
                onClick={onClose}
                style={{ background: "none", border: "none" }}
              >
                ✕
              </button>
            </div>
          }
        />

        <div className="rcm-modal-content">
          <div className="rcm-search">
            <input
              type="text"
              placeholder={t("Search role...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              ref={searchRef}
              className="rcm-search input"
            />
          </div>

          <div className="rcm-grid">
            {filteredRoles.length > 0 ? (
              filteredRoles.map((item, index) => {
                const LegacyIcon = icons[item?.iconSVG];
                // NextGen: roles without a legacy SVG (unmapped iconSVG) fell back to
                // HomePlusIcon, which paints in currentColor on a theme-only background
                // class and came out invisible. Use the modern picker's per-role lucide
                // icon in its family colour instead.
                const ModernFallback = !LegacyIcon && isModern ? resolveRoleIcon(item) : null;
                const IconComponent = LegacyIcon || HomePlusIcon;

                return (
                  <div
                    key={index}
                    className="rcm-box gradient-box-theme-color"
                    onClick={() => {
                      onRoleSelect(item);
                      onClose();
                    }}
                  >
                    <div className="rcm-icon-wrapper">
                      {ModernFallback ? (
                        <ModernFallback
                          strokeWidth={1.8}
                          style={{
                            color: FAMILIES[resolveFamily(item?.roleName)].accent,
                            width: "80%",
                            height: "80%",
                          }}
                        />
                      ) : (
                        <IconComponent className="background-theme-color border-radius-50" />
                      )}
                    </div>
                    <div className="rcm-label">{t(item.roleName)}</div>
                  </div>
                );
              })
            ) : showNoResultMessage ? (
              <div className="rcm-no-result">{t("No matching roles")}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleChangeModal;
