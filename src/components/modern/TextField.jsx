import { useState } from "react";
import { useTheme } from "@app/hooks/useTheme";
import FieldShell from "./FieldShell";

export default function TextField({
  icon,
  label,
  id,
  name,
  type = "text",
  value,
  onChange,
  onKeyDown,
  onBlur,
  onFocus,
  placeholder,
  disabled,
  readOnly,
  maxLength,
  inputRef,
  style,
  compact = false,
}) {
  const { theme } = useTheme();
  const T = theme.colors;
  const [focus, setFocus] = useState(false);
  const v = value ?? "";
  const active = focus || v !== "";

  return (
    <FieldShell icon={icon} label={label} focus={focus} active={active} height={compact ? "1.75rem" : undefined}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type={type}
        value={v}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={(e) => { setFocus(true); onFocus && onFocus(e); }}
        onBlur={(e) => { setFocus(false); onBlur && onBlur(e); }}
        placeholder={placeholder || ""}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        autoComplete="off"
        style={{
          width: "100%",
          height: "100%",
          paddingLeft: icon ? 26 : 10,
          paddingRight: 10,
          border: "none",
          outline: "none",
          background: "transparent",
          color: T.text,
          fontSize: compact ? "0.9583rem" : "1.0417rem",
          fontFamily: "inherit",
          ...style,
        }}
      />
    </FieldShell>
  );
}
