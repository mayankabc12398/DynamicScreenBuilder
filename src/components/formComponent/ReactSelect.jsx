// import { Tooltip } from "primereact/tooltip";
// import React from "react";
// import { useTranslation } from "react-i18next";
// import Select, { components } from "react-select";
// const { ValueContainer, Placeholder } = components;

// const CustomValueContainer = ({ children, ...props }) => {
//   return (
//     <ValueContainer {...props}>
//       <Placeholder {...props} isFocused={props.isFocused} className="truncate">
//         {props.selectProps.placeholder}
//       </Placeholder>
//       {React.Children.map(children, (child) =>
//         child && child.type !== Placeholder ? child : null
//       )}
//     </ValueContainer>
//   );
// };
// const ReactSelect = ({
//   placeholderName,
//   searchable,
//   defaultValue,
//   respclass,
//   id,
//   handleChange,
//   value,
//   requiredClassName,
//   dynamicOptions,
//   name,
//   inputId,
//   isDisabled,
//   ref,
//   DropdownIndicator,
// }) => {
//   const [t] = useTranslation();
//   const options = [
//     {
//       value: "a",
//       label: "chocolate",
//     },
//     { value: "strawberry", label: "Strawberry" },
//     { value: "vanilla", label: "Vanilla" },
//     { value: "chocolate", label: "Chocolate" },
//     { value: "strawberry", label: "Strawberry" },
//     { value: "vanilla", label: "Vanilla" },
//     { value: "chocolate", label: "Chocolate" },
//     { value: "strawberry", label: "Strawberry" },
//     { value: "vanilla", label: "Vanilla" },
//     { value: "chocolate", label: "Chocolate" },
//     { value: "strawberry", label: "Strawberry" },
//     { value: "vanilla", label: "Vanilla" },
//   ];
// const customStyles = {
//   control: (base, state) => ({
//     ...base,
//     height: 15,
//     minHeight: "24px !important",
//     width: "100%",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     flexDirection: "row",
//     flexWrap: "nowrap",
//     borderColor: state.isFocused ? "#ced4da" : "#ced4da",
//     boxShadow: "none",
//     whiteSpace: "normal",

//     // fontWeight: " normal"
//   }),
//   placeholder: (defaultStyles, state) => {
//     return {
//       ...defaultStyles,
//       color: "none",
//       position: "absolute",
//       top: state.hasValue || state.selectProps.inputValue ? -8 : "",
//       backgroundColor:
//         state.hasValue || state.selectProps.inputValue
//           ? "white"
//           : "transparent",
//       transition: "top 0.1s, font-size 0.1s",
//       fontSize:
//         state.hasValue || state.selectProps.inputValue ? "13px" : "12px",
//       lineHeight: "18px",
//       width: "80%",
//       fontWeight:
//         state.hasValue || state.selectProps.isFocused ? " 600" : "500",
//     };
//   },
//   menu: (styles) => ({
//     ...styles,
//     width: "100%",
//     fontSize: 12,
//     padding: 0,
//   }),
//   menuList: (styles) => ({
//     ...styles,
//     width: "100%",
//     fontSize: 12,
//     padding: 0,
//   }),
//   container: (provided, state) => ({
//     ...provided,
//     // marginTop: 50
//   }),
//   valueContainer: (provided, state) => ({
//     ...provided,
//     overflow: "visible",
//   }),
// };
//   const CustomInput = ({ getDynamicClass, ...props }) => {
//     return <components.Input {...props} inputClassName={getDynamicClass()} />;
//   };
//   const getDynamicClass = () => {
//     return requiredClassName;
//   };
//   const DefaultDropdownIndicator = () => (
//     <div className="custom-dropdown-indicator">
//       {!DropdownIndicator && (
//         <svg
//           height="20"
//           width="20"
//           viewBox="0 0 20 20"
//           aria-hidden="true"
//           focusable="false"
//           className="css-tj5bde-Svg"
//         >
//           <path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path>
//         </svg>
//       )}
//     </div>
//   );
//   return (
//     <>
//       <Tooltip
//         target={`#${id}`}
//         position="top"
//         content={t(placeholderName)}
//         // event="focus"
//       />
//       <div className={respclass}>
//         <div className="form-group">
//           <Select
//             options={dynamicOptions ? dynamicOptions : []}
//             isSearchable={searchable}
//             defaultValue={defaultValue}
//             disabled={true}
//             components={{
//               ValueContainer: CustomValueContainer,
//               Input: (props) => (
//                 <CustomInput {...props} getDynamicClass={getDynamicClass} />
//               ),
//               DropdownIndicator: DefaultDropdownIndicator,
//             }}
//             id={id}
//             ref={ref}
//             inputId={inputId}
//             value={dynamicOptions?.find((option) => option?.value === value)}
//             styles={customStyles}
//             placeholder={placeholderName}
//             onChange={handleChange ? (e) => handleChange(name, e) : () => {}}
//             isDisabled={isDisabled}
//             className={requiredClassName}
//             menuPortalTarget={document.body}
//           />
//         </div>
//       </div>
//     </>
//   );
// };

// export default ReactSelect;

import { Tooltip } from "primereact/tooltip";
import React, { useState, useRef, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import Select, { components } from "react-select";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import AutoCompleteReactSelect from "./AutoCompleteReactSelect";
import CustomAutoCompleteReactSelect from "./AutoCompleteReactSelect";
import { DesignContext } from "@app/providers/DesignProvider";
import { SmoothSelect } from "@app/components/modern";
import { OptionLabel, optionFillStyle } from "./optionColor";
import { translateIfKnown } from "@components/WrapTranslate";
const { ValueContainer, Placeholder } = components;

const CustomValueContainer = ({ children, ...props }) => (
  <ValueContainer {...props}>
    <Placeholder {...props} isFocused={props.isFocused} className="truncate">
      {props.selectProps.placeholder}
    </Placeholder>
    {React.Children.map(children, (child) =>
      child && child.type !== Placeholder ? child : null
    )}
  </ValueContainer>
);

const ReactSelect = ({
  // true = always the normal dropdown list, even above 500 options (default: type-to-search box)
  forceDropdown = false,
  placeholderName,
  searchable,
  defaultValue,
  respclass,
  id,
  handleChange,
  value,
  requiredClassName,
  dynamicOptions,
  name,
  inputId,
  isDisabled,
  removeIsClearable,
  // Opt-in. `removeIsClearable` historically gated BOTH clearability and the chevron, so
  // a clearable select lost its arrow and showed only the x. Existing callers are
  // untouched; pass this to keep the chevron while still allowing the value to be cleared.
  showDropdownIndicator,
  ref,
  DropdownIndicator,
  tabIndex,
  onKeyDown,
  handleFormatlabel,
  backgroundColor,
  // Optional. react-select filters the options it was given; a caller with more rows than
  // it is willing to hand over at once uses this to narrow the source list as you type.
  // Undefined for every existing caller, which is what react-select expects anyway.
  onInputChange,
  // Overrides the hover tooltip, which otherwise just repeats the placeholder.
  // Pass a string to say something about the selected value instead.
  tooltipContent,
}) => {
  const [t] = useTranslation();
  const selectRef = useRef(null);
  const selectInputId = inputId || name || id;
  const { isModern } = useContext(DesignContext);
  const theme = useLocalStorage("theme", "get");
  const isBigList =
    Array.isArray(dynamicOptions) && dynamicOptions.length > 500;

  if (isModern && !isBigList) {
    let opts = Array.isArray(dynamicOptions) ? [...dynamicOptions] : [];
    const isObjVal = value && typeof value === "object";
    const primitiveValue = isObjVal
      ? value?.value
      : value !== undefined && value !== null
      ? value
      : "";

    if (
      isObjVal &&
      value?.value !== undefined &&
      value?.value !== null &&
      value?.value !== "" &&
      !opts.some((o) => String(o?.value) === String(value.value))
    ) {
      opts = [...opts, value];
    }

    const handleModernChange = (e) => {
      const v = e?.target?.value;
      const matched = opts.find((o) => String(o?.value) === String(v)) || null;
      if (handleChange) handleChange(name, matched);
    };

    return (
      <div
        className={respclass}
        style={
          isDisabled
            ? { pointerEvents: "none", opacity: 0.55 }
            : undefined
        }
      >
        <SmoothSelect
          id={id}
          name={name}
          label={placeholderName}
          value={primitiveValue}
          options={opts}
          onChange={handleModernChange}
          clearable={!removeIsClearable}
          searchable={searchable !== false}
          required={
            typeof requiredClassName === "string" &&
            requiredClassName.includes("required-fields")
          }
          className="text-theme-colornew"
          tabSkip={
            isDisabled ||
            (typeof requiredClassName === "string" &&
              requiredClassName.includes("disable-focus"))
          }
        />
      </div>
    );
  }

  const customStyles = {
    control: (base, state) => ({
      ...base,
      height: 15,
      // legacy/old-view height — modern view overrides via react-select.css (--rs-height)
      minHeight: "2rem !important",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      flexWrap: "nowrap",
      borderColor: state.isFocused ? "#ced4da" : "#ced4da",
      boxShadow: "none",
      whiteSpace: "normal",
      backgroundColor: backgroundColor ? backgroundColor : "",

      // fontWeight: " normal"
    }),
    // placeholder: (defaultStyles, state) => {
    //   return {
    //     ...defaultStyles,
    //     color: "none",
    //     position: "absolute",
    //     top: state.hasValue || state.selectProps.inputValue ? -9 : "",
    //     backgroundColor:
    //       state.hasValue || state.selectProps.inputValue
    //         ? "white"
    //         : "transparent",
    //     transition: "top 0.1s, font-size 0.1s",
    //     fontSize:
    //       state.hasValue || state.selectProps.inputValue ? "0.75rem" : "1rem",
    //     lineHeight: "18px",
    //     width: "80%",
    //     fontWeight:
    //       state.hasValue || state.selectProps.isFocused ? " 600" : "500",
    //   };
    // },

    placeholder: (base, state) => {
      const hasText = state.hasValue || state.selectProps.inputValue;

      return {
        ...base,
        position: "absolute",

        top: hasText ? "clamp(-0.45rem, -0.55rem, -0.65rem)" : "50%",

        transform: hasText ? "none" : "translateY(-50%)",

        backgroundColor: hasText ? "white" : "transparent",
        padding: hasText ? "0 0.25rem" : "0",

        fontSize: hasText ? "0.75rem" : "1rem",
        lineHeight: hasText ? "1" : "1.2",

        fontWeight: hasText ? 600 : 500,
        color: "#6c757d",

        // width: "80%",
        pointerEvents: "none",
        transition:
          "top 0.12s cubic-bezier(0.4, 0, 0.2, 1), font-size 0.12s ease, transform 0.12s ease",

        // transition:
        //   "top 0.15s ease, font-size 0.15s ease, transform 0.15s ease",
      };
    },

    singleValue: (provided, state) => ({
      ...provided,
      fontSize: "1rem",
      lineHeight: 1.2,
      // The box's background comes from the caller's `backgroundColor`; the
      // text has to follow it or a dark fill swallows the label.
      ...(state?.data?.paint === "fill" && state?.data?.fg ? { color: state.data.fg } : {}),
    }),

    menu: (styles) => ({
      ...styles,
      width: "100%",
      fontSize: 12,
      padding: 0,
    }),
    // option: (provided) => ({
    //   ...provided,
    //   borderBottom: "1px solid lightgray",
    //   // padding: "0px 0px 0px 5px !important",
    //   padding: "0.25rem 0.42rem 0.25rem 0.42rem !important",
    // }),

    option: (provided, state) => ({
      ...provided,
      fontSize: "1rem",
      lineHeight: 1.2,

      /* asymmetric padding */
      paddingTop: "0.35rem",
      paddingBottom: "0.55rem",
      paddingLeft: "0.6rem",
      paddingRight: "0.6rem",

      minHeight: "calc(1rem * 2.2)",
      display: "flex",
      alignItems: "center",

      borderBottom: "1px solid lightgray",

      backgroundColor: state.isSelected
        ? "#e9ecef"
        : state.isFocused
          ? "#f8f9fa"
          : "white",

      // An option carrying its own colour paints over the row background —
      // the highlight is a background too, so it cannot show through one.
      ...(optionFillStyle(state.data, {
        selected: state.isSelected,
        focused: state.isFocused,
      }) || {}),
    }),

    menuList: (styles) => ({
      ...styles,
      width: "100%",
      fontSize: 12,
      padding: 0,
    }),
    container: (provided, state) => ({
      ...provided,
      // marginTop: 50
    }),
    valueContainer: (provided, state) => ({
      ...provided,
      overflow: "visible",
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  const CustomInput = ({ getDynamicClass, ...props }) => (
    <components.Input {...props} inputClassName={getDynamicClass()} />
  );

  const getDynamicClass = () => requiredClassName;
  // const getDynamicClass = () => "";

  const DefaultDropdownIndicator = () => (
    <div className="custom-dropdown-indicator">
      {/* !DropdownIndicator */}
      {(removeIsClearable || showDropdownIndicator) && (
        <svg
          height="20"
          width="20"
          viewBox="0 0 20 20"
          aria-hidden="true"
          focusable="false"
          className="css-tj5bde-Svg"
        >
          <path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path>
        </svg>
      )}
    </div>
  );

  const isMobile = window.innerWidth <= 800;
  let CustomComponent;
  if (isMobile) {
    CustomComponent = {
      ValueContainer: CustomValueContainer,
      DropdownIndicator: DefaultDropdownIndicator,
    };
  } else {
    CustomComponent = {
      ValueContainer: CustomValueContainer,
      Input: (props) => (
        <CustomInput {...props} getDynamicClass={getDynamicClass} />
      ),
      DropdownIndicator: DefaultDropdownIndicator,
    };
  }

  // const handleMenuOpen = () => {
  //   setMenuIsOpen(true);
  //   selectRef.current?.focus();
  // };

  // const handleMenuClose = () => {
  //   setMenuIsOpen(false);
  // };

  return (
    <>
      {!forceDropdown && Array.isArray(dynamicOptions) && dynamicOptions.length > 500 ? (
        <CustomAutoCompleteReactSelect
          list={dynamicOptions}
          handleChange={handleChange}
          name={name}
          className={`w-100 ${requiredClassName}`}
          selectedvalue={value}
          label={translateIfKnown(t, placeholderName)}
          id={id}
          respclass={respclass}
          isDisabled={isDisabled}
        />
      ) : (
        <>
          <Tooltip
            target={`#${id}`}
            position="top"
            content={tooltipContent || t(placeholderName)}
          />
          <div className={respclass}>
            <div
              className={
                isDisabled ? "form-group select-disable" : "form-group"
              }
            >
              <Select
                options={Array.isArray(dynamicOptions) ? dynamicOptions : []}
                isSearchable={searchable}
                defaultValue={defaultValue}
                formatOptionLabel={({ label, ...rest }, meta) => {
                  if (handleFormatlabel) {
                    // meta.context: "menu" (option in the list) or "value" (the selected one)
                    return handleFormatlabel(name, label, rest, meta);
                  }

                  return (
                    <div>
                      <OptionLabel option={{ label, ...rest }} />
                    </div>
                  );
                }}
                components={CustomComponent}
                id={id}
                ref={selectRef}
                inputId={selectInputId}
                instanceId={selectInputId}
                // value={
                //   value
                //     ? dynamicOptions?.find(
                //         (option) => String(option?.value) === String(value)
                //       )
                //     : ""
                // }
                value={
                  value !== undefined && value !== null && value !== ""
                    ? dynamicOptions?.find((option) =>
                        typeof value === "object" && value?.value !== undefined
                          ? String(option?.value) === String(value?.value)
                          : String(option?.value) === String(value)
                      ) || (typeof value === "object" ? value : null)
                    : defaultValue || null
                }
                styles={customStyles}
                placeholder={translateIfKnown(t, placeholderName)}
                onChange={
                  handleChange ? (e) => handleChange(name, e) : () => { }
                }
                isDisabled={isDisabled}
                className={requiredClassName}
                menuPortalTarget={document.body}
                scrollMenuIntoView={false}
                classNamePrefix={`remove-extrapadding react-select-font ${theme}`}
                onKeyDown={onKeyDown}
                onInputChange={onInputChange}
                isClearable={!removeIsClearable}
                menuPlacement="auto"
                menuPosition="absolute"
              // tabIndex={tabIndex ? tabIndex : "-1"}
              // menuIsOpen={true}
              // onMenuOpen={handleMenuOpen}
              // onMenuClose={handleMenuClose}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ReactSelect;
