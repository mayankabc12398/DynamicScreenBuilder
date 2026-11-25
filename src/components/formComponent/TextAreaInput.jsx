import React, { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "primereact/tooltip";
import { DesignContext } from "@app/providers/DesignProvider";
import { useTheme } from "@app/hooks/useTheme";
import { translateIfKnown } from "@components/WrapTranslate";

function TextAreaInput({
  name,
  className,
  respclass,
  id,
  lable,
  value,
  rows,
  maxLength,
  onChange,
  disabled,
  readOnly,
  defaultValue,
  placeholder,
  removeFormGroupClass,
  onFocus,
  showTooltipCount,
  labelColor = false,
}) {
  const [t] = useTranslation();
  const { isModern } = useContext(DesignContext);
  const { theme } = useTheme();
  const [focus, setFocus] = useState(false);

  // ---- Modern skin: match Input's FieldShell look (token-driven => dark mode aware) ----
  if (isModern) {
    const T = theme.colors;
    // match modern Input/Select single-line height (FieldShell FIELD_H).
    // single-row textareas render as one line the same height as a textbox;
    // rows > 1 keeps the taller multiline box.
    const FIELD_H = "2.0833rem";
    const rowCount = Number(rows) || 1;
    const singleLine = rowCount <= 1;
    const isRequiredField =
      typeof className === "string" && className.includes("required-fields");
    const borderColor = focus ? T.accent : T.border;
    const hasValue = value !== null && value !== undefined && String(value) !== "";
    const active = focus || hasValue; // floats up when focused or filled

    return (
      <div className={`${respclass} custominputbox`}>
        {id && lable && (
          <Tooltip
            target={`#${id}`}
            position="top"
            content={
              t(lable) +
              ` ${showTooltipCount ? "Count : " + (value?.length ? value?.length : "0") : ""}`
            }
            event="focus"
            className="ToolTipCustom"
          />
        )}
        <div className="mi-field-shell" style={{ position: "relative", margin: "3px 0", isolation: "isolate" }}>
          {/* label floats above for multiline, same colors as Input */}
          <label
            htmlFor={id}
            className={`truncate ${focus ? "text-theme-colornew" : ""}`}
            style={{
              position: "absolute",
              left: 10,
              top: active ? -6 : 9,
              fontSize: active ? "0.7917rem" : "0.9583rem",
              color: focus ? undefined : T.textMuted,
              background: active ? T.panel : "transparent",
              padding: active ? "0 4px" : 0,
              pointerEvents: "none",
              fontWeight: active ? 600 : 500,
              transition: "top .15s, font-size .15s, color .15s, background .15s",
              zIndex: 2,
              whiteSpace: "nowrap",
              lineHeight: 1.15,
              // keep long labels inside the box and ellipsize them
              maxWidth: "calc(100% - 20px)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              boxSizing: "border-box",
            }}
          >
            {lable}
          </label>
          <div
            data-mi-required={isRequiredField ? "true" : undefined}
            className={focus ? "border-colornew" : ""}
            style={{
              border: `1.4px solid ${borderColor}`,
              ...(isRequiredField ? { borderBottom: "1.5px solid #FCA5A5" } : {}),
              borderRadius: 8,
              background: T.panel,
              transition: "border-color .15s, box-shadow .15s",
              overflow: "hidden",
              // grow with the textarea when the user drags to resize
              minHeight: FIELD_H,
            }}
          >
            <textarea
              id={id}
              name={name}
              value={value}
              defaultValue={defaultValue}
              rows={rows || 3}
              maxLength={maxLength}
              placeholder={placeholder}
              disabled={disabled ? disabled : false}
              readOnly={readOnly}
              onChange={onChange}
              onFocus={(e) => {
                setFocus(true);
                onFocus && onFocus(e);
              }}
              onBlur={() => setFocus(false)}
              autoComplete="off"
              style={{
                width: "100%",
                display: "block",
                border: "none",
                outline: "none",
                background: "transparent",
                color: T.text,
                fontSize: 12.5,
                fontFamily: "inherit",
                // default height == FIELD_H (matches a textbox); still
                // browser-resizable vertically like the legacy view
                boxSizing: "border-box",
                minHeight: singleLine ? FIELD_H : undefined,
                height: singleLine ? FIELD_H : undefined,
                padding: singleLine ? "6px 10px" : "8px 10px",
                resize: "vertical",
                overflow: "auto",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ---- Legacy skin: keep markup, add custominputbox so it matches legacy Input ----
  return (
    <>
      <Tooltip
        target={`#${id}`}
        position="top"
        content={
          t(lable) +
          ` ${showTooltipCount ? "Count : " + (value?.length ? value?.length : "0") : ""}`
        }
        event="focus"
        className="ToolTipCustom"
      />

      <div className={`${respclass} custominputbox`}>
        <div className={removeFormGroupClass ? "" : "form-group"}>
          <textarea
            disabled={disabled}
            className={`${className} form-textarea`}
            placeholder={placeholder}
            id={id}
            name={name}
            value={value}
            rows={rows}
            maxLength={maxLength}
            onFocus={onFocus}
            onChange={onChange}
          ></textarea>
          <label
            htmlFor={id}
            className="lable truncate"
            style={labelColor ? { color: labelColor } : undefined}
          >
            {translateIfKnown(t, lable)}
          </label>
        </div>
      </div>
    </>
  );
}

export default TextAreaInput;
