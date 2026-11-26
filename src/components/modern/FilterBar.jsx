import { useTheme } from "@app/hooks/useTheme";
import { Search } from "lucide-react";
import TextField from "./TextField";
import SmoothSelect from "./SmoothSelect";
import SmoothDate from "./SmoothDate";

/*
  <FilterBar
    fields={[
      { kind:"text",   name, label, icon, placeholder, type, maxLength, disabled, readOnly, colSpan },
      { kind:"select", name, label, icon, options:[{label,value}], clearable, placeholder, colSpan },
      { kind:"date",   name, label, icon, displayFormat, minDate, maxDate, clearable, colSpan },
      { kind:"pill",   name, label, options:[{label,value}], colSpan },
      { kind:"custom", name, render({values,onChange,setFieldValue}), colSpan },
    ]}
    values
    onChange
    setFieldValue                  // optional, for select/date that send {target:{name,value}}
    onSubmit
    submitLabel="Search"
    submitIcon={Search}
    extraActions={<>...</>}
    minColWidth={180}
    gap={8}
  />
*/

export default function FilterBar({
  fields = [],
  values = {},
  onChange,
  setFieldValue,
  onSubmit,
  submitLabel = "Search",
  submitIcon: SubmitIcon = Search,
  extraActions,
  minColWidth = 180,
  gap = 8,
  showSubmit = true,
}) {
  const { theme } = useTheme();
  const T = theme.colors;

  const handleFieldChange = (e) => {
    if (onChange) onChange(e);
    if (setFieldValue && e?.target) setFieldValue(e.target.name, e.target.value);
  };

  const submit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(values, e);
  };

  const renderField = (f) => {
    const common = {
      name: f.name,
      id: f.id || f.name,
      label: f.label,
      icon: f.icon,
      value: values?.[f.name] ?? "",
      onChange: handleFieldChange,
      disabled: f.disabled,
    };
    switch (f.kind) {
      case "select":
        return (
          <SmoothSelect
            {...common}
            options={f.options || []}
            clearable={f.clearable}
            placeholder={f.placeholder}
          />
        );
      case "date":
        return (
          <SmoothDate
            {...common}
            displayFormat={f.displayFormat}
            minDate={f.minDate}
            maxDate={f.maxDate}
            clearable={f.clearable}
          />
        );
      case "pill":
        return (
          <div
            style={{
              display: "inline-flex",
              padding: 3,
              borderRadius: 999,
              background: T.accentSoft,
              border: `1px solid ${T.border}`,
              gap: 2,
              alignSelf: "center",
              width: "100%",
              boxSizing: "border-box",
              flexWrap: "wrap",
            }}
            role="radiogroup"
            aria-label={f.label}
          >
            {(f.options || []).map((o) => {
              const cur = values?.[f.name];
              const curVal = cur && typeof cur === "object" ? cur.value : cur;
              const on = String(curVal) === String(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() =>
                    handleFieldChange({ target: { name: f.name, value: o.value } })
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "0 12px",
                    height: 26,
                    borderRadius: 999,
                    border: "none",
                    background: on ? T.headerGradient : "transparent",
                    color: on ? "#fff" : T.textMuted,
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background .15s, color .15s",
                    boxShadow: on ? "0 3px 8px -4px rgba(20,184,166,.6)" : "none",
                  }}
                  role="radio"
                  aria-checked={on}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        );
      case "text":
        return (
          <TextField
            {...common}
            type={f.type || "text"}
            placeholder={f.placeholder}
            maxLength={f.maxLength}
            readOnly={f.readOnly}
            onKeyDown={(e) => {
              if (e.key === "Enter" && onSubmit) submit(e);
            }}
          />
        );
      case "custom":
        return f.render
          ? f.render({ values, onChange: handleFieldChange, setFieldValue })
          : null;
      default:
        return null;
    }
  };

  return (
    <form
      onSubmit={submit}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${minColWidth}px, 1fr))`,
        gap,
        alignItems: "end",
      }}
    >
      {fields.map((f, i) => (
        <div
          key={f.name || i}
          style={{
            gridColumn: f.colSpan ? `span ${f.colSpan}` : undefined,
            minWidth: 0,
          }}
        >
          {renderField(f)}
        </div>
      ))}

      {(showSubmit || extraActions) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            justifyContent: "flex-end",
          }}
        >
          {extraActions}
          {showSubmit && (
            <button
              type="submit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "0 14px",
                height: 30,
                borderRadius: 8,
                border: "none",
                background: T.headerGradient,
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 12px -6px rgba(20,184,166,.5)",
                letterSpacing: 0.3,
              }}
            >
              {SubmitIcon && <SubmitIcon size={13} />}
              {submitLabel}
            </button>
          )}
        </div>
      )}
    </form>
  );
}
