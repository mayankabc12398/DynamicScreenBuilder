import React from "react";
import { X } from "lucide-react";
import { useTheme } from "@app/hooks/useTheme";
import { FIELD_H } from "./hooks";

export default function FieldShell({
  icon: Icon,
  label,
  focus,
  active,
  hasClear,
  onClear,
  children,
  height = FIELD_H,
  required = false,
}) {
  const { theme, isDark } = useTheme();
  const T = theme.colors;
  // dark: T.border (#1E293B) is too dark vs the #3A4A63 plain inputs use → match it
  const borderColor = focus ? T.accent : (isDark ? "#3A4A63" : T.border);

  return (
    <div className="mi-field-shell" style={{ position: "relative", height, margin: "3px 0", isolation: "isolate" }}>
      {Icon && (
        <Icon
          size={13}
          style={{
            position: "absolute",
            left: 9,
            top: "50%",
            transform: "translateY(-50%)",
            color: focus ? T.accent : T.textMuted,
            transition: "color .15s",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      )}
      <label
        style={{
          position: "absolute",
          left: Icon ? (active ? 26 : 28) : 10,
          top: active ? -6 : "50%",
          transform: active ? "none" : "translateY(-50%)",
          fontSize: active ? "0.7917rem" : "0.9583rem",
          color: focus ? "undefined" : T.textMuted,
          background: active ? T.panel : "transparent",
          padding: active ? "0 4px" : 0,
          pointerEvents: "none",
          transition: "top .15s, font-size .15s, color .15s, left .15s",
          fontWeight: active ? 600 : 500,
          zIndex: 2,
          whiteSpace: "nowrap",
          lineHeight: 1.15,
          // long labels stay inside the field and ellipsize
          maxWidth: `calc(100% - ${Icon ? 36 : 20}px)`,
          overflow: "hidden",
          textOverflow: "ellipsis",
          boxSizing: "border-box",
        }}
        className={focus?"text-theme-colornew":""}
      >
        {label}
      </label>
      <div
        data-mi-required={required ? "true" : undefined}
        style={{
          height,
          border: focus ?"undefined":`1.4px solid ${borderColor}`,
          // red underline marks mandatory fields, same cue as legacy .required-fields
          // (data-mi-required CSS keeps it visible over theme focus border)
          ...(required ? { borderBottom: "1.5px solid #FCA5A5" } : {}),
          borderRadius: 8,
          background: T.panel,
          transition: "border-color .15s, box-shadow .15s",
          overflow: "hidden",
        }}
        className={focus?"border-colornew":""}
      >
        {children}
      </div>
      {hasClear && (
        <button
          type="button"
          onClick={onClear}
          tabIndex={-1}
          style={{
            position: "absolute",
            right: 7,
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            padding: 2,
            cursor: "pointer",
            color: T.textMuted,
            display: "grid",
            placeItems: "center",
            zIndex: 2,
          }}
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}
