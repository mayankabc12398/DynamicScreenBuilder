import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  GetLangaugeAPI,
  changeLanguageAPI,
} from "@app/store/reducers/dashboardSlice/CommonFunction";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import { notify } from "@app/utils/utils";
import { useTheme } from "@app/hooks/useTheme";
import { zIndex } from "@app/design-system/tokens/zIndex";

export default function LangPicker({ languages = [] }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { i18n } = useTranslation();
  const localData = useLocalStorage("userData", "get") || {};
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const popRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, openUp: false });

  const current =
    languages.find((l) => l?.key_code === i18n?.language) || languages[0];

  const computePos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const popH = Math.min(280, Math.max(120, (languages.length || 1) * 38 + 12));
    const popW = Math.max(r.width, 200);
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < popH + 12 && r.top > popH + 12;
    const top = openUp
      ? r.top + window.scrollY - popH - 6
      : r.bottom + window.scrollY + 6;
    let left = r.left + window.scrollX;
    if (left + popW > window.scrollX + window.innerWidth - 8) {
      left = window.scrollX + window.innerWidth - popW - 8;
    }
    if (left < 8) left = 8;
    setPos({ top, left, openUp, width: popW });
  };

  useEffect(() => {
    if (!open) return;
    computePos();
    const onDoc = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        popRef.current?.contains(e.target)
      )
        return;
      setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onScroll = () => computePos();
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, languages.length]);

  const pickLanguage = async (lng, label) => {
    try {
      const apiResp = await changeLanguageAPI({
        empLanguage: label,
        empLanguageCode: lng,
      });
      if (apiResp?.success) {
        useLocalStorage("userData", "set", {
          ...localData,
          empLanguage: label,
          empLanguageCode: lng,
        });
        const translation = {};
        const langlist = await GetLangaugeAPI(label);
        if (langlist?.success) {
          langlist?.data?.forEach((val) => {
            translation[val["FIELDNAME"]] = val["DISPLAYNAME"];
          });
        }
        i18n.addResourceBundle(lng, "translation", translation, true, true);
        i18n.changeLanguage(lng);
        notify(apiResp?.message, "success");
      } else {
        notify(apiResp?.message, "error");
      }
    } catch (e) {
      notify("Language change failed", "error");
    }
    setOpen(false);
  };

  if (!languages?.length) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 8,
          border: `1px solid ${c.border}`,
          background: c.panel,
          color: c.textMuted,
          fontSize: 11.5,
        }}
      >
        <i className="fa fa-language" />
        No languages
      </div>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Change language"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 8,
          border: `1px solid ${open ? c.accent : c.border}`,
          background: open ? c.accentSoft : c.panel,
          color: c.text,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 12,
          fontWeight: 600,
          width: "100%",
          transition: ".15s",
        }}
      >
        <span
          className={`flag-icon ${current?.icon || ""}`}
          style={{ fontSize: 16, flexShrink: 0 }}
        />
        <span
          style={{
            flex: 1,
            textAlign: "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {current?.label || "Language"}
        </span>
        <i
          className="fas fa-chevron-down"
          style={{
            fontSize: 10,
            opacity: 0.7,
            transform: open ? "rotate(180deg)" : "none",
            transition: ".2s",
          }}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={popRef}
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              zIndex: zIndex.notification + 50,
              width: pos.width || 220,
              maxHeight: 280,
              overflowY: "auto",
              background: c.panel,
              border: `1px solid ${c.border}`,
              borderRadius: 10,
              boxShadow:
                "0 20px 48px -18px rgba(15,23,42,.4), 0 0 0 4px " + c.accentSoft,
              padding: 4,
              fontFamily: "'Plus Jakarta Sans','Outfit',system-ui,sans-serif",
            }}
          >
            {languages.map((l) => {
              const active = current?.key_code === l.key_code;
              return (
                <button
                  key={l.key_code}
                  type="button"
                  onClick={() => pickLanguage(l.key_code, l.label)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 7,
                    border: "none",
                    background: active ? c.accentSoft : "transparent",
                    color: active ? c.accent : c.text,
                    fontWeight: active ? 700 : 500,
                    fontSize: 12.5,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = c.accentSoft;
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span className={`flag-icon ${l.icon}`} style={{ fontSize: 16, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{l.label}</span>
                  {active && <i className="fas fa-check" style={{ fontSize: 10 }} />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
