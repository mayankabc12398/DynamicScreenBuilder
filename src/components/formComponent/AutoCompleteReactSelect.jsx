import React, { useEffect, useMemo, useState } from "react";
import { AutoComplete } from "primereact/autocomplete";
import { useTranslation } from "react-i18next";

export default function CustomAutoCompleteReactSelect({
  list = [],
  label = "",
  id = "",
  className = "w-100",
  respclass,
  name,
  selectedvalue,
  handleChange,
  isDisabled,
}) {
  const safeList = useMemo(() => (Array.isArray(list) ? list : []), [list]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [value, setValue] = useState("");
  const [t] = useTranslation();

  const prevListLength = React.useRef(0);

  useEffect(() => {
    if (safeList.length !== prevListLength.current) {
      setFilteredItems(safeList);
      prevListLength.current = safeList.length;
    }
  }, [safeList.length, safeList]);

  useEffect(() => {
    if (selectedvalue) {
      const selectedVal =
        typeof selectedvalue === "object" && selectedvalue !== null
          ? selectedvalue?.value
          : selectedvalue;

      const data = safeList.find(
        (item) => String(item?.value) === String(selectedVal),
      );

      setValue(data || selectedvalue);
    } else {
      setValue("");
    }
  }, [selectedvalue, safeList]);

  const search = (event) => {
    const query = event?.query?.toLowerCase?.() || "";

    if (!query) {
      setFilteredItems(safeList);
      return;
    }

    // The "ALL" row is only a default; once a name is being typed it must drop out of the
    // suggestions (typing "a" used to keep ALL at the top because "ALL" contains an a).
    const filtered = safeList.filter((item) => {
      const itemLabel = String(item?.label || "").toLowerCase();
      if (itemLabel.trim() === "all") return false;
      return itemLabel.includes(query);
    });

    setFilteredItems(filtered);
  };

  const itemTemplate = (item) => (
    <div style={{ fontSize: "13px" }}>{item?.label || ""}</div>
  );
  return (
    <div className={respclass}>
      <div className="form-group">
        <AutoComplete
          disabled={isDisabled}
          id={id}
          value={value?.label ? value.label : value}
          // dropdown={true}
          suggestions={Array.isArray(filteredItems) ? filteredItems : []}
          completeMethod={search}
          onChange={(e) => {
            // PrimeReact fires onChange on every keystroke, with e.value as the raw
            // text, and again with the option object when one is picked. The parents
            // read e.value.value, so sending the text up stored undefined and the
            // effect below wiped the box on each key - the field looked frozen.
            // Typed text now stays local; only a real pick or a clear goes up.
            setValue(e.value);
            handleChange(name, e.value);
            if (e.value === null || e.value === undefined || e.value === "") {
              handleChange(name, "");
            } else if (typeof e.value === "object") {
              handleChange(name, e.value);
            }
          }}
          itemTemplate={itemTemplate}
          className={className}
          onBlur={() => {
            const currentValue =
              typeof value === "object" && value !== null
                ? value?.label || ""
                : value || "";

            if (!currentValue) {
              setValue("");
              handleChange(name, "");
              return;
            }

            // Text left in the box that was never picked from the list is not a
            // selection, so the box goes back to whatever the parent holds.
            if (typeof value !== "object") {
              const match = safeList.find(
                (item) =>
                  String(item?.label || "").toLowerCase() ===
                  currentValue.toLowerCase(),
              );
              if (match) {
                setValue(match);
                handleChange(name, match);
              } else {
                setValue("");
                handleChange(name, "");
              }
            }
          }}
        />
        <label
          className="label lable truncate ml-3 p-1"
          style={{ fontSize: "5px !important" }}
        >
          {t(label)}
        </label>
      </div>
    </div>
  );
}
