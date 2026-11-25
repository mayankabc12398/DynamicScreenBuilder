import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";

const ChipAutocomplete = ({
  chips = [],
  inputValue = "",
  suggestions = [],
  onInputChange,
  onSearch,
  onSelect,
  onRemove,
  onUpdate,
  onFocus,
  placeholder = "Type and Press Enter",
  disabled = false,
  name,
  id,
  maxLength,
  itemTemplate,
  /* Opt-in overrides so a caller can match this box to the surrounding controls — the
     filter rows on the master screens use 2rem-high .form-control boxes, and the default
     38px chip box stands a head taller than everything beside it. Merged last, so a
     caller that passes nothing is unaffected. */
  wrapperStyle,
  inputStyle,
  /* Per-chip urgent mark, opt-in. Only the investigation box asks for it: a doctor
     flagging a test urgent is a property of that one test, so it belongs on the chip
     rather than as a switch over the whole box. Callers that pass nothing are
     unaffected and render exactly as before. */
  urgentEnabled = false,
  isChipUrgent,
  onToggleUrgent,
}) => {
  const [t] = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [dropdownLeft, setDropdownLeft] = useState(0);

  const inputRef = useRef(null);
  const editInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);
  // debugger
  // Styles
  const styles = {
    // SRS-2026-0057 point 2. This was a hard-coded `width: "75%"`, which is why
    // the prescription inputs never reached the right edge of the page. Each
    // row is a flex container (.tag-input-container) holding a label, an icon
    // group, then this box - so a fixed 75% of the row width starts after those
    // and stops short, and stops at a *different* place per section depending on
    // how wide that section's label and icons are. That is the ragged right edge
    // the client reported.
    //
    // flex:1 + minWidth:0 makes the box absorb exactly the space left on its
    // row, so every section now ends flush at the same right edge and the full
    // page width is used. minWidth:0 is required - without it a flex item will
    // not shrink below its content width and long chip lists push the row wide.
    container: {
      flex: "1 1 auto",
      minWidth: 0,
      position: "relative",
    },
    wrapper: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "4px",
      padding: "4px",
      background: disabled ? "#e9ecef" : "white",
      border: isFocused ? "1px solid #66afe9" : "1px solid #ccc",
      borderRadius: "3px",
      minHeight: "38px",
      cursor: disabled ? "not-allowed" : "text",
      boxShadow: isFocused
        ? "inset 0 1px 1px rgba(0,0,0,.075), 0 0 8px rgba(102, 175, 233, .6)"
        : "inset 0 1px 2px rgba(0,0,0,0.05)",
      transition: "border-color ease-in-out .15s, box-shadow ease-in-out .15s",
    },
    input: {
      // SRS-2026-0057 point 2. Re-enabled. Without flex the typing area kept its
      // default input width, so widening the box above just added dead space to
      // the right of the caret instead of a bigger place to type. minWidth keeps
      // it usable when chips have already filled most of the line.
      flex: "1 1 auto",
      minWidth: "80px",
      border: "none",
      outline: "none",
      fontSize: "14px",
      padding: "6px 4px",
      color: "#333",
      background: isFocused ? "#FFFFC5" : "white",
      height: "auto",
    },
    chip: {
      display: "inline-flex",
      alignItems: "center",
      backgroundColor: "#ffffd0", // Yellow sticky note
      color: "#000",
      border: "1px solid #d0d090",
      borderRadius: "0",
      padding: "2px 6px",
      fontSize: "13px",
      fontWeight: "600",
      height: "auto",
      cursor: "default",
      boxShadow: "1px 1px 2px rgba(0,0,0,0.1)",
      userSelect: "none",
      maxWidth: "100%",
    },
    chipEditing: {
      backgroundColor: "#fff",
      border: "1px dashed #666",
      boxShadow: "none",
      padding: "2px 6px",
    },
    /* An urgent test has to be obvious at a glance in a box that may hold a dozen
       chips, so it changes the whole chip rather than only its badge. */
    chipUrgent: {
      backgroundColor: "#ffe4e4",
      border: "1px solid #e0a0a0",
      color: "#8a1c1c",
    },
    chipUrgentToggle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "15px",
      height: "15px",
      marginRight: "3px",
      borderRadius: "50%",
      border: "1px solid #c9c98a",
      color: "#9a9a5a",
      background: "#fffff0",
      fontSize: "11px",
      fontWeight: "bold",
      lineHeight: "1",
      cursor: "pointer",
    },
    chipUrgentToggleOn: {
      background: "#dc2626",
      borderColor: "#b91c1c",
      color: "#fff",
    },
    chipText: {
      marginRight: "5px",
      cursor: "text",
      whiteSpace: "normal",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "100%",
    },
    chipRemove: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "#999900",
      fontSize: "16px",
      fontWeight: "bold",
      lineHeight: "1",
      marginLeft: "2px",
    },
    dropdown: {
      listStyle: "none",
      padding: "0",
      margin: "1px 0 0 0",
      background: "white",
      border: "1px solid #aaa",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
      position: "absolute",
      top: "100%",
      left: `${dropdownLeft}px`, // Dynamic Left Position
      minWidth: "200px",
      maxWidth: "400px",
      maxHeight: "300px",
      overflowY: "auto",
      zIndex: 9999,
    },
    item: {
      padding: "8px 12px",
      fontSize: "13px",
      color: "#333",
      cursor: "pointer",
      minHeight: "10px",
      display: "flex",
      alignItems: "center",
    },
    itemSelected: {
      backgroundColor: "#e6f7ff",
      color: "#000",
    },
  };

  // --- FIX: Dynamic Positioning ---
  useLayoutEffect(() => {
    // Determine which input is active (the main one or an edit one)
    const activeInput =
      editingIndex !== null ? editInputRef.current : inputRef.current;

    if (activeInput && containerRef.current) {
      const inputRect = activeInput.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const relativeLeft = inputRect.left - containerRect.left;

      // Ensure it doesn't go off-screen (basic check)
      setDropdownLeft(Math.max(0, relativeLeft));
    }
  }, [inputValue, editingIndex, isFocused, chips, editValue]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsFocused(false);
        // Commit the edit instead of discarding it. This mousedown fires before
        // the edit input's onBlur, and clearing editingIndex here unmounts that
        // input so its blur never saves - clicking Save (or anywhere outside)
        // after editing a chip used to silently restore the old value.
        if (editingIndex !== null) {
          finishEditing(editingIndex);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingIndex, editValue, chips, onSearch]);

  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingIndex]);
  // const handleKeyDown = (e) => {
  //   if (e.key === "ArrowDown") {
  //     e.preventDefault();
  //     setFocusedIndex((prev) =>
  //       prev < suggestions.length - 1 ? prev + 1 : prev
  //   );
  // } else if (e.key === "ArrowUp") {
  //   e.preventDefault();
  //   setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
  // } else if (e.key === "Enter") {
  //     // debugger
  //     e.preventDefault();
  //     if (focusedIndex >= 0 || suggestions[focusedIndex]) {
  //       handleSelect(suggestions[focusedIndex]);
  //     } else if (inputValue.trim() !== "") {
  //       handleSelect({ ValueField: inputValue.trim() });
  //     }
  //   } else if (e.key === "Escape") {
  //     setIsFocused(false);
  //     if (onSearch) onSearch({ query: "" });
  //   }
  // };

  // priyam
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();

      if (focusedIndex >= 0 && suggestions[focusedIndex]) {
        handleSelect(suggestions[focusedIndex]);
      } else if (inputValue.trim() !== "") {
        handleSelect({
          ValueField: inputValue.trim(),
          isCustom: true,
        });
      }
    } else if (e.key === "Escape") {
      setIsFocused(false);
      if (onSearch) onSearch({ query: "" });
    }
  };

  // const handleKeyDown = (e) => {

  //   // if (e.key === "Backspace" && inputValue === "" && chips.length > 0) {
  //   //   onRemove(chips.length - 1);
  //   // } else
  //   if (e.key === "ArrowDown") {
  //     e.preventDefault();
  //     setFocusedIndex((prev) =>
  //       prev < suggestions.length - 1 ? prev + 1 : prev
  //     );
  //   } else if (e.key === "ArrowUp") {
  //     e.preventDefault();
  //     setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
  //   } else if (e.key === "Enter" || e.key === "Tab") {
  //       debugger;
  //     e.preventDefault();
  //     if (focusedIndex >= 0 && suggestions[focusedIndex]) {
  //       handleSelect(suggestions[focusedIndex]);
  //     } else if (inputValue.trim() !== "") {
  //       handleSelect({ ValueField: inputValue.trim() });
  //     }
  //     if (inputRef.current) inputRef.current.focus();
  //   } else if (e.key === "Escape") {
  //     setIsFocused(false);
  //     if (onSearch) onSearch({ query: "" });
  //   }
  // };

  const startEditing = (index, e) => {
    e.stopPropagation();
    if (disabled) return;
    setEditingIndex(index);
    // A highlight left over from earlier would make Enter pick that suggestion
    // (searched with the OLD text) instead of what the user typed.
    setFocusedIndex(-1);
    const val = chips[index]?.ValueField || chips[index]?.TypeName || "";
    setEditValue(val);
    if (onSearch) onSearch({ query: val });
  };

  const finishEditing = (index, overrideValue = null) => {
    const val = overrideValue !== null ? overrideValue : editValue;
    if (onUpdate && val && (typeof val === "object" || val.trim() !== "")) {
      onUpdate(index, typeof val === "string" ? val.trim() : val);
    }
    setEditingIndex(null);
    setEditValue("");
    setFocusedIndex(-1);
    if (onSearch) onSearch({ query: "" });
  };

  const handleEditKeyDown = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && suggestions[focusedIndex]) {
        const selectedItem = suggestions[focusedIndex];
        finishEditing(index, selectedItem);
        if (inputRef.current) inputRef.current.focus();
      } else {
        finishEditing(index);
        if (inputRef.current) inputRef.current.focus();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setEditingIndex(null);
      if (onSearch) onSearch({ query: "" });
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleInputChange = (e) => {
    onInputChange(e);
    if (onSearch) {
      onSearch({ query: e.target.value });
    }
    setIsFocused(true);
  };

  const handleEditInputChange = (e) => {
    setEditValue(e.target.value);
    setFocusedIndex(-1);
    if (onSearch) {
      onSearch({ query: e.target.value });
    }
  };

  const handleMainInputFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleSelect = (item) => {
    onSelect({ value: item });
    setFocusedIndex(-1);
    if (onSearch) onSearch({ query: "" });
  };
  //  const handleBlur = () => {
  //   setTimeout(() => {
  //     setIsFocused(false);
  //     if (onSearch) onSearch({ query: "" });
  //   }, 120);
  // };
  const handleBlur = (e) => {
    setTimeout(() => {
      // if (focusedIndex >= 0 || suggestions[focusedIndex]) {
      //   handleSelect(suggestions[focusedIndex]);

      // }
      // else if (inputValue.trim() !== "") {
      //   handleSelect({ ValueField: inputValue.trim() });
      // }
      if (inputValue.trim() !== "") {
        handleSelect({ ValueField: inputValue.trim() });
      }
      setIsFocused(false);
      if (onSearch) onSearch({ query: "" });
    }, 100);
  };
  return (
    <div style={styles.container} ref={containerRef}>
      <div
        style={{ ...styles.wrapper, ...(wrapperStyle || {}) }}
        onClick={() => {
          if (!disabled && editingIndex === null) inputRef.current?.focus();
        }}
      >
        {chips.map((chip, index) => {
          const urgent = urgentEnabled && !!isChipUrgent?.(chip);
          return (
          <div
            key={index}
            style={{
              ...styles.chip,
              ...(editingIndex === index ? styles.chipEditing : {}),
              ...(urgent ? styles.chipUrgent : {}),
            }}
          >
            {editingIndex === index ? (
              <input
                ref={editInputRef}
                type="text"
                value={editValue}
                onChange={handleEditInputChange}
                onKeyDown={(e) => handleEditKeyDown(e, index)}
                onBlur={() => finishEditing(index)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "13px",
                  fontWeight: "600",
                  padding: 0,
                  minWidth: "20px",
                  width: `${Math.max(editValue.length, 1) + 2}ch`,
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                style={styles.chipText}
                onClick={(e) => startEditing(index, e)}
                title={t("Click to edit")}
              >
                {chip?.ValueField || chip?.TypeName}
              </span>
            )}

            {urgentEnabled && editingIndex !== index && (
              <div
                style={{
                  ...styles.chipUrgentToggle,
                  ...(urgent ? styles.chipUrgentToggleOn : {}),
                }}
                title={urgent ? t("Urgent — click to clear") : t("Mark urgent")}
                role="button"
                aria-pressed={urgent}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) onToggleUrgent?.(index);
                }}
              >
                !
              </div>
            )}

            {editingIndex !== index && !disabled && (
              <div
                style={styles.chipRemove}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
              >
                ×
              </div>
            )}
          </div>
          );
        })}

        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          style={{ ...styles.input, ...(inputStyle || {}) }}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleMainInputFocus}
          placeholder={chips.length === 0 ? placeholder : ""}
          disabled={disabled}
          maxLength={maxLength}
          autoComplete="off"
          onBlur={handleBlur}
        />
      </div>

      {((isFocused && suggestions.length > 0) ||
        (editingIndex !== null && suggestions.length > 0)) && (
        <ul style={styles.dropdown} ref={dropdownRef}>
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              style={{
                ...styles.item,
                ...(index === focusedIndex ? styles.itemSelected : {}),
              }}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur

                if (editingIndex !== null) {
                  // FIX: Update existing chip with FULL object
                  finishEditing(editingIndex, suggestion);
                } else {
                  // Add new chip
                  handleSelect(suggestion);
                  setTimeout(() => inputRef.current?.focus(), 10);
                }
              }}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              {itemTemplate
                ? itemTemplate(suggestion)
                : suggestion.TemplateName || suggestion.TypeName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChipAutocomplete;
