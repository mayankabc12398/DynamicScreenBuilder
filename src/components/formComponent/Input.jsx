import React, { useEffect, useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "primereact/tooltip";
import { DesignContext } from "@app/providers/DesignProvider";
import { FieldShell } from "@app/components/modern";
import { useTheme } from "@app/hooks/useTheme";
import { translateIfKnown } from "@components/WrapTranslate";

function Input({
  type,
  name,
  className,
  respclass,
  id,
  placeholder,
  lable,
  value,
  onKeyDown,
  required,
  display,
  onChange,
  onFocus,
  disabled,
  readOnly,
  defaultValue,
  isUpperCase,
  onBlur,
  inputRef,
  removeFormGroupClass,
  onInput,
  max,
  min,
  key,
  showTooltipCount,
  maxLength,
  tabIndex,
  isArrow,
  onKeyUp,
  placeholderLabel,
  style,
  icon,
}) {
  const [t] = useTranslation();
  const { isModern } = useContext(DesignContext);
  const { theme } = useTheme();
  const [modernFocus, setModernFocus] = useState(false);

  const customStyle = style?style:{ textAlign: display ?? "left"  }

  const handleInput = (e) => {
    if (onInput) {
      onInput(e);
    }
    const inputValue = e.target.value;
    e.target.value = inputValue
      .replace(/^\s+/g, "")
      .replace(/(\d)\s+(\d)/g, "$1$2");
  };

  if (isModern) {
    const T = theme.colors;
    const displayValue = isUpperCase
      ? (typeof value === "string" ? value.toUpperCase() : value ?? "")
      : value ?? "";
    const active = modernFocus || (displayValue !== "" && displayValue != null && displayValue !== undefined);

    const isRequiredField =
      required || (typeof className === "string" && className.includes("required-fields"));

    return (
      <div
        className={`${respclass} custominputbox`}
        style={placeholderLabel ? { position: "relative", isolation: "isolate" } : undefined}
      >
        <FieldShell icon={icon} label={lable} focus={modernFocus} active={active} required={isRequiredField} className="text-theme-colornew">
          <input
            ref={inputRef}
            type={type}
            id={id}
            name={name}
            data-tab-required={isRequiredField ? "true" : undefined}
            className={
              typeof className === "string" && className.includes("disable-focus")
                ? "disable-focus"
                : undefined
            }
            placeholder={placeholder || ""}
            value={displayValue}
            defaultValue={defaultValue}
            onChange={onChange}
            onInput={handleInput}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onFocus={(e) => {
              setModernFocus(true);
              onFocus && onFocus(e);
            }}
            onBlur={(e) => {
              setModernFocus(false);
              onBlur && onBlur(e);
            }}
            disabled={disabled ? disabled : false}
            readOnly={readOnly}
            required={required}
            max={max}
            min={min}
            maxLength={maxLength}
            tabIndex={tabIndex}
            step={type === "number" ? "0.01" : ""}
            autoComplete="off"
            key={key}
            style={{
              width: "100%",
              height: "100%",
              paddingLeft: icon ? 26 : 10,
              // leave room for the unit suffix (Kg, mm/Hg …) so text never runs under it
              paddingRight: placeholderLabel
                ? `${Math.max(10, String(placeholderLabel).length * 7 + 12)}px`
                : 10,
              border: "none",
              outline: "none",
              background: "transparent",
              color: T.text,
              fontSize: 12.5,
              fontFamily: "inherit",
              textAlign: display ?? "left",
              ...(style || {}),
            }}
          />
        </FieldShell>
        {placeholderLabel && (
          <span
            className="placeholderLabel"
            style={{
              top: "50%",
              right: 8,
              transform: "translateY(-50%)",
              fontSize: 11,
              lineHeight: 1,
              color: T.textMuted,
              pointerEvents: "none",
              whiteSpace: "nowrap",
              zIndex: 2,
            }}
          >
            {placeholderLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <>
    {id && lable &&
      <Tooltip
        target={`#${id}`}
        position="top"
        content={
          t(lable) +
          ` ${
            showTooltipCount
              ? t("Count : ") + (value?.length ? value?.length : "0")
              : ""
          }`
        }
        event="focus"
        className="ToolTipCustom"
      />}

      <div className={`${respclass} custominputbox`}>
        <div className={removeFormGroupClass ? "" : "form-group"}>
          <input
          onFocus={onFocus}
          style={customStyle}
            type={type}
            className={className}
            id={id}
            name={name}
            placeholder={placeholder}
            value={isUpperCase?value?.toUpperCase():value}
            onKeyDown={onKeyDown}
            key={key}
            onChange={onChange}
            autoComplete="off"
            step={type === "number" ? "0.01" : ""}
            required={required}
            ref={inputRef}
            onBlur={onBlur}
            max={max}
            min={min}
            onKeyUp={onKeyUp}
            // style={{ textAlign: display ?? "left"  }}
            onInput={handleInput}
            disabled={disabled ? disabled : false}
            readOnly={readOnly}
            maxLength={maxLength}
          />
          {lable && (
            <label htmlFor={id} className="lable truncate">
              {translateIfKnown(t, lable)}
            </label>
          )}
          <span className="placeholderLabel">{placeholderLabel}</span>
        </div>
      </div>
    </>
  );
}

export default Input;

