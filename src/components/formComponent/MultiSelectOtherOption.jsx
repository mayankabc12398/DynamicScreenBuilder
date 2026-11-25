// import { MultiSelect } from "primereact/multiselect";
// import { useState, useEffect } from "react";

// const MultiSelectOtherComp = (props) => {
//   const {
//     respclass,
//     dynamicOptions,
//     value = [],
//     handleChange,
//     name,
//     placeholderName,
//     requiredClassName,
//     disabled,
//     isRemoveTemplate,
//     itemTemplate,
//     overlayVisible,
//     onToggle,
//   } = props;

//   const [otherText, setOtherText] = useState("");
//   const [showOtherInput, setShowOtherInput] = useState(false);

//   const isMobile = window.innerWidth <= 768;

//   const truncate = (str, maxLength) =>
//     str?.length > maxLength
//       ? isMobile
//         ? str
//         : str.substring(0, maxLength) + "..."
//       : str;

//   const customItemTemplate = (option) =>
//     !isRemoveTemplate ? (
//       <div>{truncate(option.name, 20)}</div>
//     ) : (
//       <div style={{ textWrap: "auto" }}>{option.name}</div>
//     );

//   // ONLY toggle input visibility – NO handleChange here!
//   useEffect(() => {
//     const otherSelected = value.some((item) => item.code === "other");
//     setShowOtherInput(otherSelected);

//     if (!otherSelected) {
//       setOtherText(""); // reset only
//     }
//   }, [value]);

//   // update only the "other" option
//   const handleOtherChange = (text) => {
//     setOtherText(text);

//     const updated = value.map((item) =>
//       item.code === "other" ? { name: text, code: "other" } : item
//     );

//     handleChange(name, updated);
//   };

//   // CONTROLLED onChange – removes "other" safely
//   const handleMultiSelectChange = (data) => {
//     const otherStillSelected = data.some((item) => item.code === "other");

//     // If Other is unchecked → remove & reset
//     if (!otherStillSelected) {
//       setOtherText("");
//     }

//     handleChange(name, data);
//   };

//   const footerTemplate = () =>
//     showOtherInput ? (
//       <div className="p-2">
//         <input
//           type="text"
//           className="form-control"
//           placeholder="Please specify Other Name"
//           value={otherText}
//           onChange={(e) => handleOtherChange(e.target.value)}
//         />
//       </div>
//     ) : null;

//   return (
//     <div className={respclass}>
//       <div className="form-controls mb-2">
//         <div className="panel-hover-container">
//           <span
//             className={`panel-hover-label ${
//               value && value.length ? "active" : ""
//             }`}
//           >
//             {placeholderName}
//           </span>

//           <MultiSelect
//             filter
//             value={value}
//             id="multiSelect"
//             onChange={(e) => handleMultiSelectChange(e.value)}
//             options={dynamicOptions}
//             optionLabel="name"
//             placeholder={!value?.length ? placeholderName : ""}
//             maxSelectedLabels={3}
//             className={`multiselect ${
//               requiredClassName ? "required-fields" : ""
//             }`}
//             name={name}
//             closeIcon
//             itemTemplate={itemTemplate || customItemTemplate}
//             disabled={disabled}
//             panelFooterTemplate={footerTemplate}
//             {...(overlayVisible !== undefined && { overlayVisible })}
//             {...(onToggle && {
//               onOverlayHide: () => onToggle(false),
//               onShow: () => onToggle(true),
//             })}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MultiSelectOtherComp;

import { MultiSelect } from "primereact/multiselect";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const MultiSelectOtherComp = (props) => {
  const [t] = useTranslation();
  const {
    respclass,
    dynamicOptions,
    value = [],
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

  const [otherText, setOtherText] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);

  const isMobile = window.innerWidth <= 768;

  const truncate = (str, maxLength) =>
    str?.length > maxLength
      ? isMobile
        ? str
        : str.substring(0, maxLength) + "..."
      : str;

  const customItemTemplate = (option) =>
    !isRemoveTemplate ? (
      <div>{truncate(option.name, 20)}</div>
    ) : (
      <div style={{ textWrap: "auto" }}>{option.name}</div>
    );

  // Show/hide Other text input
  useEffect(() => {
    const other = value.find((item) => item.code === "other");

    if (other) {
      setShowOtherInput(true);
      setOtherText(other.name); // keep same value on re-render
    } else {
      setShowOtherInput(false);
      setOtherText("");
    }
  }, [value]);

  // Update "other" field only, never duplicates
  const handleOtherChange = (text) => {
    setOtherText(text);

    const updated = value.map((item) =>
      item.code === "other" ? { name: text, code: "other" } : item
    );

    handleChange(name, updated);
  };

  // Main MultiSelect change handler — prevents duplicate "other"
  const handleMultiSelectChange = (selected) => {
    let filtered = [];
    let otherAdded = false;

    selected.forEach((item) => {
      if (item.code === "other") {
        if (!otherAdded) {
          filtered.push({
            name: otherText || "Other",
            code: "other",
          });
          otherAdded = true;
        }
      } else {
        filtered.push(item);
      }
    });

    // If "other" removed
    if (!otherAdded) {
      setOtherText("");
    }

    handleChange(name, filtered);
  };

  const footerTemplate = () =>
    showOtherInput ? (
      <div className="p-2">
        <input
          type="text"
          className="form-control"
          placeholder={t("Please specify Other Name")}
          value={otherText}
          onChange={(e) => handleOtherChange(e.target.value)}
        />
      </div>
    ) : null;

  return (
    <div className={respclass}>
      <div className="form-controls mb-2">
        <div className="panel-hover-container">
          <span
            className={`panel-hover-label ${
              value && value.length ? "active" : ""
            }`}
          >
            {placeholderName}
          </span>

          <MultiSelect
            filter
            value={value}
            onChange={(e) => handleMultiSelectChange(e.value)}
            options={dynamicOptions}
            optionLabel="name"
            placeholder={!value?.length ? placeholderName : ""}
            maxSelectedLabels={3}
            className={`multiselect ${
              requiredClassName ? "required-fields" : ""
            }`}
            name={name}
            closeIcon
            itemTemplate={itemTemplate || customItemTemplate}
            disabled={disabled}
            panelFooterTemplate={footerTemplate}
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

export default MultiSelectOtherComp;
