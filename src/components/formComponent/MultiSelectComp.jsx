import { MultiSelect } from "primereact/multiselect";
// Modern skin — self-imported (NOT via modern-skin/index.css). Rules gated on
// :root[data-design="modern"], so the old view is untouched.
import "../../design-system/modern-skin/multiselect.css";
import { useTranslation } from "react-i18next";
import { translateIfKnown } from "@components/WrapTranslate";

const MultiSelectComp = (props) => {
  const [t] = useTranslation();
  const {
    respclass,
    dynamicOptions,
    value,
    handleChange,
    name,
    placeholderName,
    requiredClassName,
    disabled,
    isRemoveTemplate,
    itemTemplate,
    overlayVisible,
    showSelectAll = true,
    onToggle,
    itemSizeVisible = false,
    onFilter,
    filterPlaceholder,
    resetFilterOnHide = false,
    // Opt-in: an (x) that empties the selection. Cleared -> handleChange gets [] (not null),
    // so callers that map over the value keep working.
    showClear = false,
  } = props;

  const isMobile = window.innerWidth <= 768;

  const truncate = (str, maxLength) => {
    if (str?.length > maxLength) {
      return isMobile ? str : str?.substring(0, maxLength) + "...";
    }
    return str;
  };

  const customItemTemplate = (option) => {
    if (!isRemoveTemplate) {
      // The name is cut at 20 characters in the list; the full name shows on hover.
      return <div title={option?.name}>{truncate(option?.name, 20)}</div>;
    } else {
      return <div style={{ textWrap: "auto" }}>{option?.name}</div>;
    }
  };

  return (
    <div className={respclass}>
      <div className="form-controls mb-2">
        <div className="panel-hover-container">
          <span
            className={`panel-hover-label ${value && value?.length ? "active" : ""}`}
            // Above the MultiSelect box (rendered after it, with its own background), so the
            // caption shows while empty; pointer-events: none keeps clicks on the box.
            style={{ zIndex: 1 }}
          >
            {translateIfKnown(t, placeholderName)}
          </span>

          <MultiSelect
            filter
            value={value}
            id="multiSelect"
            onChange={(e) => handleChange(name, showClear ? e.value ?? [] : e.value)}
            options={dynamicOptions}
            optionLabel="name"
            placeholder={!value || !value?.length ? translateIfKnown(t, placeholderName) : ""}
            maxSelectedLabels={3}
            className={`multiselect ${requiredClassName ? "required-fields" : ""}`}
            panelClassName="ms-modern-panel"
            name={name}
            showSelectAll={showSelectAll}
            showClear={showClear}
            closeIcon
            {...(itemSizeVisible && { virtualScrollerOptions: { itemSize: 38 } })}
            {...(onFilter && { onFilter, filterPlaceholder, resetFilterOnHide })}
            itemTemplate={itemTemplate ? itemTemplate : customItemTemplate}
            disabled={disabled}
            {...(overlayVisible !== undefined && { overlayVisible })}
            {...(onToggle && {
              onOverlayHide: () => onToggle(false),
              onShow: () => onToggle(true),
            })}
          />
        </div>
      </div>
    </div>
  );
};

export default MultiSelectComp;
