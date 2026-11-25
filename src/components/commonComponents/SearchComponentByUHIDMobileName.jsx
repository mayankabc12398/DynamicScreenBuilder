import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import EasyUI from "../EasyUI/EasyUI";
import { useTranslation } from "react-i18next";
import Input from "../formComponent/Input";
import { Oldpatientsearch } from "../../networkServices/opdserviceAPI";
import { BIND_TABLE_OLDPATIENTSEARCH } from "../../utils/constant";
import { debounce, focusInput } from "../../utils/utils";
import { DesignContext } from "@app/providers/DesignProvider";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";

const SearchComponentByUHIDMobileName = ({
  onClick,
  data,
  prefilledValue = "",
}) => {
  const [t] = useTranslation();
  const themeClass = useLocalStorage("theme", "get");
  const [getOldPatientData, setGetOldPatientData] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [value, setValue] = useState("");
  const inputRef = useRef(null);
  const anchorRef = useRef(null);
  const { isModern } = useContext(DesignContext);
  const [popPos, setPopPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!isModern || !getOldPatientData?.length || !anchorRef.current) return;
    const compute = () => {
      const r = anchorRef.current.getBoundingClientRect();
      setPopPos({
        top: r.bottom + window.scrollY + 4,
        left: r.left + window.scrollX,
        width: r.width,
      });
    };
    compute();
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [isModern, getOldPatientData]);

  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  console.log("GetGlobalResources111", GetGlobalResources);
  const manualSelectResource = Array.isArray(GetGlobalResources)
    ? GetGlobalResources?.find(
        (item) => item?.Name === "IsPatientManualSelectOnSearch",
      )
    : null;
  
  const isManualSelect = String(manualSelectResource?.Value) === "1";

  const isManualSelectRef = useRef(isManualSelect);
  useEffect(() => {
    isManualSelectRef.current = isManualSelect;
  }, [isManualSelect]);

  const handleOldPatientSearch = async (value) => {
    try {
      const data = await Oldpatientsearch(value);
      if (!isManualSelectRef.current && data?.data?.length === 1) {
        onClick(data?.data[0]);
      }
      setGetOldPatientData(data?.data);
      setSelectedIndex(null);
    } catch (error) {
      console.log(error);
    }
  };

  // Manage Global (fin_global_resources) row "IsPatientSearchOnEnter" = 1: the search
  // runs only on Enter / the search icon, typing alone never hits the API (or shows the
  // loader). Without the row (or 0) it keeps searching as you type, from 3 characters.
  const isSearchOnEnter =
    GetGlobalResources?.find?.(
      (item) => item?.Name === "IsPatientSearchOnEnter",
    )?.Value === "1";

  const runSearch = () => {
    const text = value.trim();
    if (text.length > 2) {
      handleOldPatientSearch(text);
    } else {
      setGetOldPatientData([]);
    }
  };

  const debouncedHandleOldPatientSearch = useCallback(
    debounce(handleOldPatientSearch, 300),
    [],
  );

  const handleChange = (e) => {
    const { value } = e.target;
    if (isSearchOnEnter) {
      setGetOldPatientData([]);
      setSelectedIndex(null);
    } else if (value.length > 2) {
      debouncedHandleOldPatientSearch(value);
    } else {
      setGetOldPatientData([]);
      setSelectedIndex(null);
    }
    setValue(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (selectedIndex !== null && getOldPatientData[selectedIndex]) {
        onClick(getOldPatientData[selectedIndex]);
      } else if (isSearchOnEnter) {
        runSearch();
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
    }
  };

  useEffect(() => {
    setValue(prefilledValue || "");

    if ((prefilledValue || "").length > 2) {
      debouncedHandleOldPatientSearch(prefilledValue);
    } else {
      setGetOldPatientData([]);
      setSelectedIndex(null);
    }
  }, [prefilledValue, debouncedHandleOldPatientSearch]);

  useEffect(() => {
    focusInput("UHIDPatientNameMobileno");
  }, []);

  const dropdown =
    getOldPatientData?.length > 0 ? (
      <EasyUI
        dataBind={getOldPatientData}
        dataColoum={BIND_TABLE_OLDPATIENTSEARCH}
        onClick={onClick}
        selectedIndex={selectedIndex}
      />
    ) : null;

  return (
    <div className="row pt-2 pl-2 pr-2">
      <div className="col-xl-6 col-md-4 col-sm-6 col-12">
        <div style={{ position: "relative" }} ref={anchorRef}>
          <div className="d-flex">
            <Input
              type="text"
              className="form-control"
              id="UHIDPatientNameMobileno"
              removeFormGroupClass={false}
              name="barcode"
              lable={t(
                "UHID/Patient Name/Mobile no/Aadhaar No/Staaf ID/Trustee ID"
              )}
              required={true}
              onChange={handleChange}
              onKeyDown={handleKeyDown} // Add keydown event handler
              inputRef={inputRef}
              value={value}
              respclass={"w-100"}
            />
            <div style={{ position: "absolute", right: "0px" }}>
              <label
                style={{
                  padding: "2px 5px",
                  borderRadius: "3px",
                  cursor: "pointer",
                }}
                onClick={() => {
                  inputRef.current?.focus();
                  runSearch();
                }}
              >
                <i className="fa fa-search" aria-hidden="true"></i>
              </label>
            </div>
          </div>

          {dropdown && !isModern && (
            <div
              style={{
                position: "absolute",
                zIndex: 99,
                width: "100%",
                top: "25px",
              }}
            >
              {dropdown}
            </div>
          )}
        </div>
      </div>
      {dropdown &&
        isModern &&
        createPortal(
          <div
            className={`modernSearchDropdown ${themeClass} background-theme-colornew text-theme-colornew`}
            style={{
              position: "absolute",
              top: popPos.top,
              left: popPos.left,
              minWidth: popPos.width,
              zIndex: 2147483640,
              borderRadius: 10,
              boxShadow: "0 16px 40px -10px rgba(15,23,42,.28)",
              border: "1px solid #E2E8F0",
              overflow: "hidden",
              animation: "modernSearchIn .15s ease-out",
            }}
          >
            <style>{`
              @keyframes modernSearchIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
              .modernSearchDropdown { font-family: "Plus Jakarta Sans","Outfit",system-ui,sans-serif; color: #0F172A; font-size: 12px; }
              .modernSearchDropdown .datagrid { border: 0 !important; background: transparent !important; }
              .modernSearchDropdown .datagrid-view, .modernSearchDropdown .datagrid-view1, .modernSearchDropdown .datagrid-view2 { border: 0 !important; background: transparent !important; }
              .modernSearchDropdown .datagrid-header { background: transparent !important; border-bottom: 1px solid #E2E8F0 !important; }
              .modernSearchDropdown .datagrid-header td, .modernSearchDropdown .datagrid-header .datagrid-cell {  border: 0 !important; font-weight: 600 !important; font-size: 0.8rem !important; text-transform: uppercase; letter-spacing: 0.4px; padding: 2px 10px !important; line-height: 1.2 !important; vertical-align: middle !important; height: 20px !important; box-sizing: border-box !important; }
              .modernSearchDropdown .datagrid-header .datagrid-cell span { line-height: 1.2 !important; display: inline-block; }
              .modernSearchDropdown .datagrid-htable { height: 20px !important; }
              .modernSearchDropdown .datagrid-header { position: sticky; top: 0; z-index: 3; background: transparent !important; }
              .modernSearchDropdown .datagrid-body { background: #fff !important; }
              .modernSearchDropdown .datagrid-row { border: 0 !important; transition: background .15s; background: #fff !important; }
              .modernSearchDropdown .datagrid-row td, .modernSearchDropdown .datagrid-row .datagrid-cell { border: 0 !important;padding: 3px 10px !important; font-size: 11px !important; color: #0F172A !important; background: transparent !important; line-height: 1.3 !important; vertical-align: middle !important; }
              .modernSearchDropdown .datagrid-row:nth-child(even) { background: #F8FAFC !important; }
              .modernSearchDropdown .datagrid-row:hover { background: #ECFDF5 !important; cursor: pointer; }
              .modernSearchDropdown .datagrid-row.datagrid-row-selected,
              .modernSearchDropdown .datagrid-row.selected-row,
              .modernSearchDropdown .datagrid-row-over { background: rgba(15,118,110,.10) !important; box-shadow: none !important; }
              .modernSearchDropdown .datagrid-row.datagrid-row-selected td,
              .modernSearchDropdown .datagrid-row.selected-row td,
              .modernSearchDropdown .datagrid-row-over td { box-shadow: none !important; }
              .modernSearchDropdown .datagrid-row.datagrid-row-selected td,
              .modernSearchDropdown .datagrid-row.selected-row td { color: #0F172A !important; font-weight: 600 !important; }
              .modernSearchDropdown .datagrid-pager, .modernSearchDropdown .pagination { background: #F8FAFC !important; border-top: 1px solid #E2E8F0 !important; padding: 4px 8px !important; }
              .modernSearchDropdown .datagrid-pager .pagination-page-list { height: 24px !important; font-size: 11px !important; }
              .modernSearchDropdown .datagrid-pager .pagination-num { height: 22px !important; font-size: 11px !important; padding: 1px 6px !important; }
              .modernSearchDropdown .datagrid-pager .pagination-info { font-size: 11px !important; color: #64748B !important; }
              .modernSearchDropdown .datagrid-pager a, .modernSearchDropdown .datagrid-pager .pagination-link { color: #0F766E !important; }
              .modernSearchDropdown .datagrid-pager a.l-btn-disabled { opacity: 0.4 !important; }
              .modernSearchDropdown .datagrid-resize-proxy { background: #0F766E !important; }
              .modernSearchDropdown .datagrid-body::-webkit-scrollbar { width: 6px; height: 6px; }
              .modernSearchDropdown .datagrid-body::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
              .modernSearchDropdown .datagrid-body::-webkit-scrollbar-thumb:hover { background: #0F766E; }
            `}</style>
            {dropdown}
          </div>,
          document.body
        )}
    </div>
  );
};

export default SearchComponentByUHIDMobileName;