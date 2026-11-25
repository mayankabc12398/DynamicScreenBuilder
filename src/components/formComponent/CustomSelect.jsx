

import React, { useState,useRef, useEffect, useMemo, useContext } from "react";
import { createPortal } from "react-dom";
import "./CustomSelect.css";
import { useTranslation } from "react-i18next";
import { DesignContext } from "@app/providers/DesignProvider";
import { SmoothSelect } from "@app/components/modern";

const CustomSelect = ({
  option,
  onChange,
  placeHolder,
  value,
  name,
  isDisable,
  isRemoveSearchable,
  requiredClassName
}) => {
  const [t]=useTranslation()
  const { isModern } = useContext(DesignContext);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const selectRef = useRef(null);
  const optionsRef = useRef([]);
  const [dropdownPosition, setDropdownPosition] = useState({});
  const [dropdownAbove, setDropdownAbove] = useState(false);

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
    setHighlightedIndex(-1);
    setTimeout(() => {
      // preventScroll: focusing the search box must not scroll the page - any scroll closes the list
      document.getElementById("searchQuery")?.focus({ preventScroll: true });
    }, 0);

    if (!isOpen && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      const availableSpaceBelow = window.innerHeight - rect.bottom;
      const availableSpaceAbove = rect.top;

      // Check if space below is less than a threshold (e.g., 300px), and position dropdown accordingly
      if (availableSpaceBelow < 220 && availableSpaceAbove > 220) {
        setDropdownAbove(true);
        setDropdownPosition({
          bottom: window.innerHeight - rect.top,
          left: rect.left,
          width: rect.width,
        });
      } else {
        setDropdownAbove(false);
        setDropdownPosition({
          top: rect.bottom,
          left: rect.left,
          width: rect.width,
        });
      }
    }
  };

  const handleOptionClick = (option) => {
    setIsOpen(false);
    onChange(name, option);
    setSearchQuery("");
  };

  const handleClickOutside = (event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target) &&
      !selectRef.current.contains(event.target)
    ) {
      setIsOpen(false);
    }
  };

  const handleWindowScroll = (event) => {
    if (isOpen && !dropdownRef?.current?.contains(event?.target)) {
      setIsOpen(false);
    }
  };

  // const filteredOptions = option?.filter((option) =>
  //   option.label.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  const filteredOptions = (option || []).filter((option) =>
    option?.label?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleKeyDown = (event) => {
    if (isOpen) {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          if (highlightedIndex !== filteredOptions.length - 1) {
            const data = (highlightedIndex + 1) % filteredOptions.length;
            optionsRef.current[data].scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
            setHighlightedIndex(data);
          }
          break;
        case "ArrowUp":
          event.preventDefault();
          if (highlightedIndex !== 0) {
            const data =
              (highlightedIndex - 1 + filteredOptions.length) %
              filteredOptions.length;
            optionsRef.current[data].scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
            setHighlightedIndex(data);
          }
          break;
        case "Enter":
          handleOptionClick(filteredOptions[highlightedIndex]);
          break;
        case "Escape":
          setIsOpen(false);
          break;
        default:
          break;
      }
    }
  };

  const handleSearchChange = (event) => {
    setHighlightedIndex(0);
    setSearchQuery(event.target.value);
  };

  const findValue = useMemo(() => {
    const data = option?.find((ele) => ele?.value === value);
    return data?.label ?? placeHolder;
  }, [value, option]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleWindowScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleWindowScroll, true);
    };
  }, [isOpen, highlightedIndex, filteredOptions]);

  if (isModern) {
    let opts = Array.isArray(option) ? [...option] : [];
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
      if (onChange) onChange(name, matched);
    };

    const hasMarker = (marker) =>
      typeof requiredClassName === "string" && requiredClassName.includes(marker);

    return (
      <div
        style={
          isDisable
            ? { pointerEvents: "none", opacity: 0.55 }
            : undefined
        }
      >
        <SmoothSelect
          id={name}
          name={name}
          label={placeHolder}
          value={primitiveValue}
          options={opts}
          onChange={handleModernChange}
          searchable={!isRemoveSearchable}
          required={hasMarker("required-fields")}
          tabSkip={hasMarker("disable-focus") || isDisable}
        />
      </div>
    );
  }

  return (
    <div className={`custom-select-container ${requiredClassName}`} ref={selectRef}>
      <div
        className="custom-select-header "
        onClick={() => {
          isDisable ? () => {} : handleToggleDropdown();
        }}
        style={{background:isDisable?"rgb(232 232 232)":"white"}}
      >
        {findValue}
        <span className={`arrow ${isOpen ? "open" : ""}`}></span>
      </div>
      {isOpen &&
        createPortal(
          <div
            className="custom-select-dropdown"
            ref={dropdownRef}
            style={{
              ...(dropdownAbove
                ? { bottom: `${dropdownPosition.bottom}px` }
                : { top: `${dropdownPosition.top}px` }),
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              // the top/left/bottom above come from getBoundingClientRect (viewport coordinates), so
              // the list is fixed; "absolute" put it off by the page's scroll on a scrolled page
              position: "fixed",
              zIndex: 999999,
            }}
          >
           {!isRemoveSearchable && <div className="custom-select-search-wrapper">
              <input
                type="text"
                className="custom-select-search form-control "
                placeholder={t("Search...")}
                id="searchQuery"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>}
            <div className="custom-option-select">
              {filteredOptions?.length>0?filteredOptions?.map((option, index) => (
                <div
                  value={option.value}
                  key={option.value}
                  className={`custom-select-option ${
                    index === highlightedIndex ? "highlighted" : ""
                  }`}
                  onClick={() => handleOptionClick(option)}
                  ref={(el) => (optionsRef.current[index] = el)}
                >
                  {option.label}
                </div>
              )): <div className="ml-3">{t("No Option")}</div>}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default CustomSelect;
