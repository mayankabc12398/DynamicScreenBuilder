import { MultiSelect } from "primereact/multiselect";

const FormBuilderMultiSelect = (props) => {
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
        onToggle,
    } = props;
    const isMobile = window.innerWidth <= 768;
    const isNullLike = (val) =>
        val === null ||
        val === undefined ||
        String(val).trim().toLowerCase() === "null" ||
        String(val).trim().toLowerCase() === "undefined";

    const normalizedOptions = (dynamicOptions || [])
        .map((opt) => ({
            name: opt.name ?? opt.label,
            code: opt.code ?? opt.value,
        }))
        .filter((opt) => !isNullLike(opt.name) && !isNullLike(opt.code));

    const normalizedValue = Array.isArray(value)
        ? value
            .map((item) =>
                item && typeof item === "object"
                    ? item.code ?? item.value ?? item.ID ?? item.id
                    : item,
            )
            .filter((item) => !isNullLike(item))
        : [];

    const truncate = (str, maxLength) => {
        if (str?.length > maxLength) {
            return isMobile ? str : str.substring(0, maxLength) + "...";
        }
        return str;
    };

    const customItemTemplate = (option) => {
        if (!isRemoveTemplate) {
            return <div>{truncate(option?.name, 20)}</div>;
        }
        return <div style={{ textWrap: "auto" }}>{option?.name}</div>;
    };

    return (
        <div className={respclass}>
            <div className="form-controls mb-2">
                <div className="panel-hover-container">
                    <span
                        className={`panel-hover-label ${normalizedValue && normalizedValue.length ? "active" : ""
                            }`}
                    >
                        {placeholderName}
                    </span>

                    <MultiSelect
                        filter
                        value={normalizedValue}
                        onChange={(e) => handleChange(name, e.value)}
                        options={normalizedOptions}
                        optionLabel="name"
                        optionValue="code"
                        placeholder={!normalizedValue || !normalizedValue.length ? placeholderName : ""}
                        maxSelectedLabels={3}
                        className={`multiselect ${requiredClassName ? "required-fields" : ""
                            }`}
                        name={name}
                        closeIcon
                        itemTemplate={itemTemplate ?? customItemTemplate}
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

export default FormBuilderMultiSelect;
