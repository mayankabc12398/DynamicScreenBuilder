import { Tooltip } from "primereact/tooltip";
import React from "react";
import { useTranslation } from "react-i18next";
import Select, { components } from "react-select";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { translateIfKnown } from "@components/WrapTranslate";
const { ValueContainer, Placeholder } = components;

const CustomValueContainer = ({ children, ...props }) => {
  return (
    <ValueContainer {...props}>
      <Placeholder {...props} isFocused={props.isFocused}>
        {props.selectProps.placeholder}
      </Placeholder>
      {React.Children.map(children, (child) =>
        child && child.type !== Placeholder ? child : null,
      )}
    </ValueContainer>
  );
};
const ReactSelectHead = ({
  placeholderName,
  searchable,
  respclass,
  id,
  handleChange,
  dynamicOptions,
  value,
  name,
  defaultValue,
  isDisabled,
}) => {
  // console.log("dynamicOptions",dynamicOptions);
  // console.log("value",value);
  const [t] = useTranslation();

  const customStyles = {
    control: (base, state) => ({
      ...base,
      height: "1.25rem",
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
      // fontWeight: " normal"
      "@media (max-width: 767px)": {
        width: "100%", // Example for smaller screens
        // minHeight: 20,
      },
    }),
    placeholder: (defaultStyles, state) => {
      return {
        ...defaultStyles,
        color: "none",
        position: "absolute",
        top:
          state.hasValue || state.selectProps.inputValue
            ? "clamp(-0.45rem, -0.55rem, -0.65rem)"
            : "",
        backgroundColor:
          state.hasValue || state.selectProps.inputValue
            ? "white"
            : "transparent",
        transition: "top 0.1s, font-size 0.1s",
        fontSize:
          state.hasValue || state.selectProps.inputValue ? "0.75rem" : "1rem",
        lineHeight: "1.5rem",
        width: "80%",
        fontWeight:
          state.hasValue || state.selectProps.isFocused ? " 600" : "500",
      };
    },
    singleValue: (provided) => ({
      ...provided,
      fontSize: "1rem",
      lineHeight: 1.2,
    }),
    menu: (styles) => ({
      ...styles,
      width: "100%",
      fontSize: 12,
      padding: 0,
      textAlign: "left",
      "@media (max-width: 767px)": {
        width: "100%", // Example for smaller screens
      },
    }),
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
    }),
    menuList: (styles) => ({
      ...styles,
      width: "100%",
      fontSize: 12,
      padding: 0,
      textAlign: "left",
    }),
    container: (provided, state) => ({
      ...provided,
      // marginTop: 50
    }),
    valueContainer: (provided, state) => ({
      ...provided,
      overflow: "visible",
    }),
  };
  let theme = useLocalStorage("theme", "get");

  return (
    <>
      <Tooltip
        target={`#${id}`}
        position="top"
        content={t(placeholderName)}
        // event="focus"
      />
      <div className={respclass}>
        <div className="form-group mb-0 mobileReactselectwidth">
          <Select
            options={dynamicOptions ? dynamicOptions : []}
            isSearchable={searchable}
            id={id}
            styles={customStyles}
            // value={value}
            classNamePrefix={theme}
            value={dynamicOptions?.find(
              (option) => String(option.value) === String(value),
            )}
            isDisabled={isDisabled}
            placeholder={translateIfKnown(t, placeholderName)}
            onChange={handleChange ? handleChange : () => {}}
            name={name}
            defaultValue={defaultValue}
          />
        </div>
      </div>
    </>
  );
};

export default ReactSelectHead;

// new ReactSelectHead for header to manage size
