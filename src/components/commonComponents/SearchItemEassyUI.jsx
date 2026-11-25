import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import EasyUI from "../EasyUI/EasyUI";
import { useTranslation } from "react-i18next";
import Input from "../formComponent/Input";
import { Oldpatientsearch } from "../../networkServices/opdserviceAPI";
import { BIND_TABLE_BY_MED_FIRST_NAME, BIND_TABLE_OLDPATIENTSEARCH } from "../../utils/constant";
import { debounce, focusInput } from "../../utils/utils";

/** Narrowest a floating result grid may be, whatever the field's own width. */
const FLOAT_MIN_WIDTH = 620;
/** Above the app's modals (3200) and below its toasts (4200). */
const FLOAT_Z = 4100;

const SearchItemEassyUI = ({ onClick, BindListAPI, BindDetails, Head, customInputRef, isSelectFirst, cellCss, selectedPackage, isCashPanel, isDisabled = false, onTextChange, minChars = 3, floating = false,gridWidth,cellCssClass }) => {
  const [t] = useTranslation();
  // debugger
  const [getOldPatientData, setGetOldPatientData] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [value, setValue] = useState("");
  const [floatBox, setFloatBox] = useState(null);

  const inputRef = useRef(null);
  const boxRef = useRef(null);
  const floatRef = useRef(null);
  const handleOldPatientSearch = async (value, BindDetails) => {
    try {
      // debugger
      const data = await BindListAPI(value, BindDetails, selectedPackage, isCashPanel);
      if (data?.data?.length === 1 && isSelectFirst) {
        onClick(data?.data[0])
      }
      setGetOldPatientData(data?.data);
      setSelectedIndex(null); // Reset the selected index on new search
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    setValue(BindDetails?.value)
    if (BindDetails?.value && BindDetails?.isCallhandleChange) {
      handleChange({ target: { value: BindDetails?.value } })
    }
  }, [BindDetails?.value])

  const handleOnClick = (details) => {
    onClick(details)
    setGetOldPatientData([])
  }

  const debouncedHandleOldPatientSearch = useCallback(
    debounce(handleOldPatientSearch, 300),
    [selectedPackage, isCashPanel]
  );

  const handleChange = (e) => {
    const { value } = e.target;
    if (value.length >= minChars) {
      debouncedHandleOldPatientSearch(value, BindDetails);
    } else {
      setGetOldPatientData([]);
    }
    setValue(value);
    // Optional: lets a caller keep its own state in step with what was typed,
    // without waiting for a row to be picked. Unused by the existing pages.
    if (onTextChange) onTextChange(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (selectedIndex !== null && getOldPatientData[selectedIndex]) {
        setValue(getOldPatientData[selectedIndex]?.ItemName)
        onClick(getOldPatientData[selectedIndex]);
        setGetOldPatientData([])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prevIndex) => {
        const newIndex =
          prevIndex === null
            ? 0
            : Math.min(prevIndex + 1, getOldPatientData.length - 1);
        return newIndex;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prevIndex) => {
        const newIndex =
          prevIndex === null
            ? getOldPatientData.length - 1
            : Math.max(prevIndex - 1, 0);
        return newIndex;
      });
    } else if (e.key === "Escape") {
      setGetOldPatientData([]);
    }
  };

  // useEffect(() => {
  //   // Optionally focus on input when component mounts
  //   focusInput("UHIDPatientNameMobileno");
  // }, []); // Empty dependency array to run only on mount

  const isOpen = getOldPatientData?.length > 0;

  /**
   * Where the floating result grid goes.
   *
   * Under the field, as wide as the field but never narrower than the columns
   * need, kept inside the viewport, and flipped above when there is more room
   * up there. The height is capped to the space that is actually free, so the
   * grid scrolls instead of running off the bottom of the window.
   */
  const measure = useCallback(() => {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(Math.max(r.width, FLOAT_MIN_WIDTH), vw - 16);
    const left = Math.min(Math.max(8, r.left), Math.max(8, vw - width - 8));
    const below = vh - r.bottom - 12;
    const above = r.top - 12;
    const flip = below < 220 && above > below;
    setFloatBox({
      left,
      width,
      maxHeight: Math.max(160, Math.min(460, flip ? above : below)),
      top: flip ? undefined : r.bottom + 2,
      bottom: flip ? vh - r.top + 2 : undefined,
    });
  }, []);

  useLayoutEffect(() => {
    if (!floating || !isOpen) return undefined;
    measure();
    // A drop-down pinned to the viewport has to follow the field it belongs
    // to. The capture flag matters: inside a modal or the builder canvas the
    // field scrolls in an ancestor, and a scroll there does not bubble.
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [floating, isOpen, measure]);

  useEffect(() => {
    if (!floating || !isOpen) return undefined;
    // Out in <body> the grid sits over everything, so it has to close itself.
    // Clicks on the field are not "outside": typing there is how it reopens.
    const onDown = (e) => {
      if (boxRef.current?.contains(e.target)) return;
      if (floatRef.current?.contains(e.target)) return;
      setGetOldPatientData([]);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [floating, isOpen]);

  const grid = isOpen ? (
    <EasyUI
      dataBind={getOldPatientData}
      dataColoum={Head}
      onClick={handleOnClick}
      selectedIndex={selectedIndex} // Pass selected index
      cellCss={cellCss}
      gridStyle={floating ? { width: "100%", maxHeight: floatBox?.maxHeight || 460 } : undefined}
    />
  ) : null;

  return (
    <div className="row   pr-2">
      <div className="col-12">
        <div style={{ position: "relative" }} ref={boxRef}>
          <div className="d-flex">
            <Input
              type="text"
              className={`form-control ${BindDetails?.className}`}
              id={`${BindDetails?.id ? BindDetails?.id : 'UHIDPatientNameMobileno'}`}
              removeFormGroupClass={false}
              name="barcode"
              lable={t(BindDetails?.label)}
              required={true}
              onChange={handleChange}
              onKeyDown={handleKeyDown} // Add keydown event handler
              inputRef={customInputRef ? customInputRef : inputRef}
              value={value ? value : ""}
              respclass={"w-100"}
              disabled={isDisabled}
            />
            <div
              className="easyuiSearchBtn"
              style={{ position: "absolute", right: "0px" }}
            >
              <label
                style={{
                  border: "1px solid #ced4da",
                  padding: "1px 5px 1px 5px",
                  margin: "1px",
                  borderRadius: "3px",
                }}
                onClick={() => inputRef?.current?.focus()}
              >
                <i className="fa fa-search" aria-hidden="true"></i>
              </label>
            </div>
          </div>

          {/* Two ways to show the same grid.

              Default (every existing page): absolutely positioned inside this
              field. Fine there, because those pages put the field in a plain
              form with nothing clipping around it.

              floating: the grid is portalled to <body> and positioned against
              the field. That is the only version that survives a container
              which clips — a Card/Panel (overflow:hidden), the Screen Builder
              canvas frame, a modal body — where the absolute one is cut off or
              hidden outright. */}
          {!floating && isOpen ? (
            <div
              style={{
                position: "absolute",
                zIndex: 99,
                width: "100%",
                top: "25px",
              }}
            >
              {grid}
              <EasyUI
                dataBind={getOldPatientData}
                dataColoum={Head}
                onClick={handleOnClick}
                selectedIndex={selectedIndex} // Pass selected index
                cellCss={cellCss}
                gridWidth={gridWidth}
                cellCssClass={cellCssClass}
              />
            </div>
          ) : null}
        </div>
      </div>
      {floating && isOpen && floatBox
        ? createPortal(
            <div
              ref={floatRef}
              className="easyuiSearchFloat"
              style={{
                position: "fixed",
                left: floatBox.left,
                top: floatBox.top,
                bottom: floatBox.bottom,
                width: floatBox.width,
                zIndex: FLOAT_Z,
              }}
            >
              {grid}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};

export default SearchItemEassyUI;
