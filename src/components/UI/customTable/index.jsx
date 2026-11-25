import React, { useEffect, useMemo, useRef, useState } from "react";
import Table from "react-bootstrap/Table";
import {
  SortSVGIcon,
  IncreaseIngSortSVGIcon,
  DecreaseIngSortSVGIcon,
  PDFIconSVG,
  ExcelIconSVG,
} from "../../../components/SvgIcons/index.jsx";
import Input from "../../formComponent/Input.jsx";
import { useTranslation } from "react-i18next";
import Heading from "../Heading.jsx";
import { Dropdown } from "react-bootstrap";
import { Settings, ChevronUp, ChevronDown, GripVertical, RotateCcw } from "lucide-react";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage.js";
import {
  getUserColumnPreference,
  saveUserColumnPreference,
} from "../../../networkServices/HeaderApi.js";
import { getSubString } from "../../../utils/helpers.js";
import Checkbox from "../../formComponent/Checkbox.jsx";
import {
  exportHtmlToPDFNoPrint,
  exportHtmlToPDFNoPrintFinance,
} from "../../../utils/exportLibrary/index.js";
import { exportHtmlToExcel } from "../../../utils/exportLibrary/index.js";

/* ---------------------------------------------------------------------------
   Per-user column layout
   ---------------------------------------------------------------------------
   Opt-in: pass `storageKey` and the grid remembers this user's column order
   and which columns they hid. Without it the grid behaves exactly as before,
   so the other screens using <Tables> are unaffected.

   Layouts are keyed by the ROW-OBJECT KEY ("BillDate", "PatientName", ...),
   never by column index, so adding or removing a column in code cannot
   scramble a saved layout — unknown keys are dropped and new ones appended.
--------------------------------------------------------------------------- */

const COLUMN_PREFS_VERSION = 1;
/* Not real columns — carried on the row for row colouring / search bookkeeping.

   rowMeta bhi yahin hai. Wo row ke saath apna indent number le kar chalta hai
   taaki khuli hui lines sahi row ke niche bane - column wo kabhi nahi tha, aur
   niche tbody use paint karte waqt pehle se chhod deta hai (key !== "rowMeta").

   Ye list usse chhodti nahi thi, to jis bhi grid par storageKey lagta jiski
   rows me rowMeta hai, uske Columns wale panel me "rowMeta" ek column ban kar
   dikhta - aur save hue order me bhi ghus jaata, jabki painting use chhodti
   rehti. Yaani panel ka kram aur screen ka kram alag ho jaate. */
const NON_COLUMN_KEYS = ["colorcode", "isVisible", "rowMeta"];

// thead accepts either plain strings or { name, ... } objects. Only the string
// form may be rendered directly; handing React the object throws "Objects are
// not valid as a React child", so an object without a usable name renders blank.
const getHeadLabel = (headData) =>
  headData !== null && typeof headData === "object"
    ? (headData.name ?? "")
    : headData;

// Text shown for a column in the Columns menu. A header whose `name` is a widget (a drop-down, an
// input box) cannot be listed as text, so it supplies a plain `label` for the menu instead.
const columnMenuLabel = (head) => {
  if (head === null || typeof head !== "object") return head;
  return typeof head.name === "string" ? head.name : (head.label ?? "");
};

const prefsStorageKey = (employeeID, screenKey) =>
  `hospedia.cols.${employeeID || "anon"}.${screenKey}`;

/**
 * Caption to print for a header entry. `thead` may hold plain strings or
 * `{ name, type, ... }` objects, and a spacer column legitimately has a blank
 * name - so fall back to the entry itself only when it is not an object,
 * otherwise React is handed the header object and the whole page white-screens.
 */
const headLabel = (head) =>
  head && typeof head === "object" ? (head.name ?? "") : (head ?? "");

/** Column keys of a row, in their natural (code) order. */
const columnKeysOf = (row) =>
  row ? Object.keys(row).filter((key) => !NON_COLUMN_KEYS.includes(key)) : [];

/**
 * Merge a saved layout with the columns the code currently produces:
 * keep the saved order for keys that still exist, append newly added keys at
 * the end, and forget keys that no longer exist.
 */
const reconcilePrefs = (prefs, keys) => {
  const saved = Array.isArray(prefs?.order) ? prefs.order : [];
  const kept = saved.filter((key) => keys.includes(key));
  const added = keys.filter((key) => !kept.includes(key));
  return {
    order: [...kept, ...added],
    hidden: (Array.isArray(prefs?.hidden) ? prefs.hidden : []).filter((key) =>
      keys.includes(key),
    ),
  };
};

// D:\Mayank Data\hopedianew\src\utils\helpers.js
function Tables({
  thead,
  tbody,
  getRowClass,
  style,
  tableHeight,
  scrollView,
  getRowClick,
  // WWW,
  handleClassOnRow,
  handleDoubleClick,
  isSearch,
  notSingleClick = true,
  title,
  specificCellStyle,
  removeHeaderSpace,
  removeShorting = false,
  isExportPDf = false,
  isExportExcel = false,
  tfoot,
  paginationThreshold = 300,
  paginationPageSize = 100,
  storageKey,
  // Optional: return JSX to show in a full-width row right under this row
  // (used by Result Entry's Track Investigation timeline). Return falsy to skip.
  renderExpandedRow,
  // Optional JSX shown beside the search box (e.g. an extra filter).
  searchExtra,
  // Optional: told the search box text whenever it changes (e.g. so a page can export what is shown).
  onSearchChange,
  // Optional: keep the header row fixed while the table scrolls (Result Entry). Off by default - a sticky
  // header with a z-index shows through slide-up screens such as IPD Billing.
  stickyHeader = false,
}) {
  const [t] = useTranslation();
  const [bodyData, setBodyData] = useState([]);
  const [handleLanguageStatus, setHandleLanguageStatus] = useState(true);
  const [search, setSearch] = useState("");
  const [theadData, setTheadData] = useState([]);
  const [columnPrefs, setColumnPrefs] = useState(null);
  const employeeID = useLocalStorage("userData", "get")?.employeeID;
  // Set once the user edits the layout, so a slow server response can never
  // overwrite a change they just made.
  const prefsDirtyRef = useRef(false);
  const saveTimerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(paginationPageSize);
  const isMobile = window.innerWidth <= 768;
  const activeRowRef = useRef(null);
  const tableScrollRef = useRef(null);

  /* Table ke dikhne wale hisse ki chaudai.

     Khuli hui qatar (renderExpandedRow) ek <td colSpan> ke andar baithti hai,
     isliye wo POORI table jitni chaudi ho jaati hai - chahe table 2000px ki ho.
     Pending Indent me yahi hota tha: Item Details ke khane itne door phail
     jaate the ki unhe padhne ke liye daayein tak scroll karna padta tha.

     Isliye khuli qatar ko bas itna hi chaura rakha jaata hai jitna screen par
     dikhta hai, aur use baayein kinare par tika diya jaata hai (sticky). Upar
     wali table chahe jitni scroll ho, Item Details saamne hi rehta hai.

     0 rahe (naap na ho paye) to kuch nahi lagta aur sab pehle jaisa chalta
     hai - ye suvidha hai, zaroorat nahi. */
  const [scrollViewportWidth, setScrollViewportWidth] = useState(0);

  useEffect(() => {
    const wrapper = tableScrollRef.current;
    if (!wrapper) return undefined;

    const measure = () => setScrollViewportWidth(wrapper.clientWidth || 0);
    measure();

    /* ResizeObserver purane browser me nahi hota - tab ek baar ki naap se kaam
       chalta hai, window resize par thoda bemel ho sakta hai par toota nahi. */
    if (typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(measure);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [bodyData?.length]);
  const hoverSpeedRef = useRef(0);
  const scrollFrameRef = useRef(null);
  const shouldPaginate = bodyData?.length > paginationThreshold;
  const totalPages = shouldPaginate
    ? Math.max(1, Math.ceil(bodyData.length / rowsPerPage))
    : 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = shouldPaginate ? (safeCurrentPage - 1) * rowsPerPage : 0;
  const endIndex = shouldPaginate ? startIndex + rowsPerPage : bodyData?.length;
  const visibleBodyData = shouldPaginate
    ? bodyData?.slice(startIndex, endIndex)
    : bodyData;

  // useEffect(() => {
  //   console.log("bodyData", bodyData);
  // }, [bodyData]);

  /* ---------------- per-user column layout ---------------- */

  const naturalKeys = useMemo(() => columnKeysOf(tbody?.[0]), [tbody]);
  const effectivePrefs = useMemo(
    () => reconcilePrefs(columnPrefs, naturalKeys),
    [columnPrefs, naturalKeys],
  );
  // Cheap dependency for the effects that rebuild rows and headers.
  const layoutSignature = storageKey
    ? `${effectivePrefs.order.join("|")}::${effectivePrefs.hidden.join("|")}`
    : "";

  /**
   * Rebuild a row in the user's column order, dropping hidden columns. The
   * bookkeeping keys go last so the visible header index still lines up with
   * the row key index, which is what sorting relies on.
   */
  const applyColumnLayout = (row) => {
    if (!row) return row;
    if (!storageKey) return { ...row, isVisible: true };

    const ordered = {};
    effectivePrefs.order.forEach((key) => {
      if (!effectivePrefs.hidden.includes(key) && key in row) ordered[key] = row[key];
    });

    /* Jo column nahi hain wo bhi saath le jaane padte hain.

       Ye function row ko DOBARA banata hai, aur sirf unhi chaabiyon ko leta hai
       jo effectivePrefs.order me hain - yaani column. NON_COLUMN_KEYS me jo
       hain wo order me hote hi nahi, isliye yahan chhoot jaate hain.

       Pehle sirf colorcode naam le kar bachaya jaata tha. rowMeta bhi aise hi
       chhoot raha tha, aur uska natija chup-chaap bura tha: Pending Indent me
       khuli hui lines row ke niche aati hi nahi thin, kyunki wo milan
       row.rowMeta.indentno se hota hai. Select dabta, API chalti, data aata -
       aur screen par kuch nahi hota.

       Ab poori list se uthaya jaata hai, taaki kal koi nayi aisi chaabi jude to
       wo bhi apne aap bach jaye. */
    NON_COLUMN_KEYS.forEach((key) => {
      if (key in row) ordered[key] = row[key];
    });
    ordered.isVisible = true;
    return ordered;
  };

  // Local copy first so the grid paints in the user's order straight away,
  // then the server copy so the layout follows them to another workstation.
  useEffect(() => {
    if (!storageKey) return undefined;
    let cancelled = false;

    try {
      const local = window.localStorage.getItem(prefsStorageKey(employeeID, storageKey));
      if (local) setColumnPrefs(JSON.parse(local));
    } catch {
      /* unreadable local copy — fall through to the server */
    }

    (async () => {
      const resp = await getUserColumnPreference(storageKey);
      // Never clobber an edit the user made while this was in flight.
      if (cancelled || prefsDirtyRef.current) return;
      if (resp?.success && resp?.data) {
        try {
          setColumnPrefs(JSON.parse(resp.data));
        } catch {
          /* malformed server copy — keep whatever we already have */
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storageKey, employeeID]);

  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  /** Write through to localStorage now, and to the server shortly after. */
  const persistColumnPrefs = (next) => {
    prefsDirtyRef.current = true;
    setColumnPrefs(next);
    if (!storageKey) return;

    const payload = JSON.stringify({ v: COLUMN_PREFS_VERSION, ...next });
    try {
      window.localStorage.setItem(prefsStorageKey(employeeID, storageKey), payload);
    } catch {
      /* quota / private mode — the server copy is still written below */
    }
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(
      () => saveUserColumnPreference(storageKey, payload),
      800,
    );
  };

  const moveColumn = (fromIndex, toIndex) => {
    if (!storageKey) return;
    const order = [...effectivePrefs.order];
    if (toIndex < 0 || toIndex >= order.length || fromIndex === toIndex) return;
    const [moved] = order.splice(fromIndex, 1);
    order.splice(toIndex, 0, moved);
    persistColumnPrefs({ order, hidden: effectivePrefs.hidden });
  };

  const resetColumns = () => {
    prefsDirtyRef.current = true;
    setColumnPrefs(null);
    if (!storageKey) return;
    try {
      window.localStorage.removeItem(prefsStorageKey(employeeID, storageKey));
    } catch {
      /* nothing stored locally */
    }
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveUserColumnPreference(storageKey, ""), 800);
  };

  useEffect(() => {
    setBodyData(tbody?.map((val) => applyColumnLayout(val)));
    setCurrentPage(1);
    isSearch && handleItemSearch({ target: { value: search } });
  }, [tbody, layoutSignature]);

  useEffect(() => {
    setRowsPerPage(paginationPageSize);
  }, [paginationPageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (tbody?.length > 0) {
      let data = thead?.map((val, index) => {
        if (typeof val === "object") {
          if (
            typeof Object?.values(tbody[0])[index] === "object" ||
            removeShorting
          ) {
            val.type = "";
          } else {
            val.type = "N";
          }
        } else {
          if (
            typeof Object?.values(tbody[0])[index] === "object" ||
            removeShorting
          ) {
            val = { name: val, type: "" };
          } else {
            val = { name: val, type: "N" };
          }
        }
        return { ...val, key: naturalKeys[index], isVisible: true };
      });

      // Re-sequence the headers into the user's order and mark the hidden ones,
      // so the settings list can still offer them back.
      if (storageKey && data?.length) {
        data = effectivePrefs.order
          .map((key) => data.find((head) => head.key === key))
          .filter(Boolean)
          .map((head) => ({
            ...head,
            isVisible: !effectivePrefs.hidden.includes(head.key),
          }));
      }

      setTheadData(data);
    }
  }, [tbody, handleLanguageStatus, layoutSignature]);

  // i18next.on("languageChanged", (lng) => {
  //   console.log("Asdasd",lag)
  //   setHandleLanguageStatus(!handleLanguageStatus)
  // });

  // Handle Sort Functionality

  const handleSortTable = (index, type) => {
    let typeName = Object?.keys(bodyData[0])[index];
    let data = [...bodyData];
    if (type === "DESC") {
      data.sort((a, b) => {
        if (new Date(a[typeName]).toString() === "Invalid Date") {
          return b[typeName]?.localeCompare(a[typeName]);
        } else {
          return new Date(b[typeName]) - new Date(a[typeName]);
        }
      });
    } else {
      data.sort((a, b) => {
        if (new Date(a[typeName]).toString() === "Invalid Date") {
          return a[typeName]?.localeCompare(b[typeName]);
        } else {
          return new Date(a[typeName]) - new Date(b[typeName]);
        }
      });
    }
    setBodyData(data);

    if (typeof theadData[index] === "object") {
      let updatedHead = [...theadData]?.map((val, i) => {
        if (index === i) {
          val.type = type;
        } else {
          val.type = val.type === "" ? val.type : "N";
        }
        return val;
      });
      setTheadData(updatedHead);
    }
  };

  /* The text a cell actually shows, whatever it is made of.

     A cell is rarely a plain string: most are elements, because the text has to be
     clickable, coloured or sit next to an icon. The old search understood a string, an
     input's value and a {label} - so a name written as <span onClick>NAME</span> was
     never looked at, and typing a patient's name found nothing while that name sat on
     the screen. The text of an element lives in its children, so that is read too.

     Depth is capped because a cell can hold a whole sub-table, and a search box must
     stay quick while someone is typing. */
  const cellText = (value, depth = 0) => {
    if (value === null || value === undefined || typeof value === "boolean")
      return "";
    if (typeof value === "string" || typeof value === "number")
      return String(value);
    if (depth > 6) return "";
    if (Array.isArray(value))
      return value.map((item) => cellText(item, depth + 1)).join(" ");
    if (value?.label) return String(value.label);
    if (value?.props) {
      const { value: inputValue, title, children, val } = value.props;
      const parts = [
        typeof inputValue === "string" || typeof inputValue === "number"
          ? String(inputValue)
          : "",
        typeof title === "string" ? title : "",
        cellText(children, depth + 1),
        // Screen builder rows carry their data on a val object.
        val && typeof val === "object"
          ? Object.values(val).map((item) => cellText(item, depth + 1)).join(" ")
          : "",
      ];
      return parts.filter(Boolean).join(" ");
    }
    return "";
  };

  // handle Search Item
  const handleItemSearch = (e) => {
    onSearchChange?.(e?.target?.value || "");
    if (e?.target?.value) {
      setSearch(e?.target?.value);
      const needle = String(e.target.value).toLowerCase();
      const results = tbody?.filter((obj) =>
        Object.values(obj)?.some((value) =>
          cellText(value).toLowerCase().includes(needle),
        ),
      );
      setBodyData(results);
      setCurrentPage(1);
    } else {
      setSearch("");
      setBodyData(tbody?.map((val) => applyColumnLayout(val)));
      setCurrentPage(1);
    }
  };

  // Function to handle row click
  const handleRowClick = (rowRef, ele, index) => {
    getRowClick && getRowClick(ele, index);

    if (activeRowRef.current) {
      // Reset the previous active row to its original color
      const originalColor = activeRowRef.current.getAttribute(
        "data-original-color",
      );
      activeRowRef.current.style.backgroundColor = originalColor;
    }

    // Set the new active row style
    if (rowRef) {
      // Store the original color of the new active row
      rowRef.setAttribute("data-original-color", rowRef.style.backgroundColor);
      rowRef.style.backgroundColor = "lightblue";
      activeRowRef.current = rowRef;
    }
  };

  const toggleColumn = (checked, index, headName) => {
    // With a storageKey the layout is declarative and persisted; otherwise fall
    // back to the original in-place behaviour so other screens are unchanged.
    if (storageKey) {
      const key = theadData[index]?.key;
      if (!key) return;
      const hidden = checked
        ? effectivePrefs.hidden.filter((item) => item !== key)
        : [...effectivePrefs.hidden, key];
      persistColumnPrefs({ order: effectivePrefs.order, hidden });
      return;
    }
    legacyToggleColumn(checked, index, headName);
  };

  const legacyToggleColumn = (e, index, headName) => {
    let keyName = Object.keys(tbody[0])[index];
    let prevKeyName = Object.keys(tbody[0])[index - 1];
    const hData = [...theadData];
    hData[index].isVisible = e;

    setTheadData(hData);
    if (!e) {
      const bData = bodyData.map((item) => {
        delete item[keyName];
        return item;
      });
      setBodyData(bData);
    } else if (tbody && Array.isArray(tbody)) {
      const bData = bodyData?.map((val, ind) => {
        const orderedPatient = Object.fromEntries(
          Object.entries(val).reduce((acc, [key, value]) => {
            acc.push([key, value]);
            if (key === prevKeyName) {
              acc.push([keyName, tbody[ind][keyName]]);
            } else if (prevKeyName === undefined) {
              acc.unshift([keyName, tbody[ind][keyName]]);
            }
            return acc;
          }, []),
        );
        return orderedPatient; // Ensure the return value is properly handled.
      });
      setBodyData(bData);
    }
  };

  const [dropdownVisible, setDropdownVisible] = useState(false);

  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const updateHoverScroll = () => {
    const wrapper = tableScrollRef.current;
    if (!wrapper) {
      scrollFrameRef.current = null;
      return;
    }

    const speed = hoverSpeedRef.current;
    if (speed !== 0 && wrapper.scrollWidth > wrapper.clientWidth) {
      wrapper.scrollLeft += speed;
    }

    scrollFrameRef.current = requestAnimationFrame(updateHoverScroll);
  };

  const handleMouseMove = (event) => {
    const wrapper = tableScrollRef.current;
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const edgeWidth = Math.max(40, width * 0.15);
    let speed = 0;

    if (x < edgeWidth) {
      speed = -Math.ceil(((edgeWidth - x) / edgeWidth) * 20);
    } else if (x > width - edgeWidth) {
      speed = Math.ceil(((x - (width - edgeWidth)) / edgeWidth) * 20);
    }

    hoverSpeedRef.current = speed;
  };

  const handleMouseEnter = () => {
    if (!scrollFrameRef.current) {
      scrollFrameRef.current = requestAnimationFrame(updateHoverScroll);
    }
  };

  const handleMouseLeave = () => {
    hoverSpeedRef.current = 0;
    if (scrollFrameRef.current) {
      cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if the click was outside both the dropdown and the button
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setDropdownVisible(false);
      }
    };

    // Add event listener for clicks outside
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleExportPDF = () => {
    exportHtmlToPDFNoPrintFinance("printSectionpdf", title);
  };

  const handleExportExcel = () => {
    exportHtmlToExcel("printSectionpdf", title);
  };

  const renderPagination = () => {
    if (!shouldPaginate) return null;

    const firstRecord = bodyData.length === 0 ? 0 : startIndex + 1;
    const lastRecord = Math.min(endIndex, bodyData.length);

    return (
      <div
      style={{
    position: "sticky",
    bottom: 0,
    zIndex: 100,
    borderTop: "1px solid #ddd",
    background: "#fff",
  }}
      className="d-flex justify-content-between align-items-center flex-wrap px-2 py-1 no-print">
        <div>
          {t("Showing")} {firstRecord} {t("to")} {lastRecord} {t("of")}{" "}
          {bodyData.length} {t("entries")}
        </div>
        <div className="d-flex align-items-center">
          <select
            className="form-control form-control-sm mr-2"
            style={{ width: "80px" }}
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            {[100, 250, 500, 1000].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary mx-1"
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage(1)}
          >
            {t("First")}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary mx-1"
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            {t("Prev")}
          </button>
          <span className="mx-2">
            {safeCurrentPage} / {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary mx-1"
            disabled={safeCurrentPage === totalPages}
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
          >
            {t("Next")}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary mx-1"
            disabled={safeCurrentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            {t("Last")}
          </button>
        </div>
      </div>
    );
  };

  /* The column settings menu. Rendered inside the heading when the table
     has one, and on its own strip when it does not — otherwise a grid
     without a title could never reach its own column settings. */
  const columnSettingsDropdown = (
          <Dropdown show={dropdownVisible} ref={buttonRef}>
            <Dropdown.Toggle
              id="dropdown-basic"
              bsPrefix="custom-toggle"
              className="p-0 mx-1 theme-class"
            >
              <Settings
                size={18}
                onClick={() => {
                  setDropdownVisible(!dropdownVisible);
                }}
                style={{ color: "#000" }}
              />
            </Dropdown.Toggle>

            <Dropdown.Menu
              style={{
                position: "absolute",
                zIndex: "999 !important",
                minHeight: "150px",
                maxHeight: storageKey ? "320px" : "200px",
                minWidth: storageKey ? "230px" : undefined,
                overflowY: "auto",
              }}
              popperConfig={{ strategy: "fixed" }}
            >
              {storageKey && (
                <div className="hx-colcfg__head">
                  <span>{t("Columns")}</span>
                  <button
                    type="button"
                    className="hx-colcfg__reset"
                    onClick={resetColumns}
                    title={t("Restore the default column order")}
                  >
                    <RotateCcw size={12} />
                    {t("Reset")}
                  </button>
                </div>
              )}
              {theadData.map((head, index) => (
                <Dropdown.Item
                  key={index}
                  as="div"
                  ref={dropdownRef}
                  className={storageKey ? "hx-colcfg__row" : ""}
                  draggable={Boolean(storageKey)}
                  onDragStart={
                    storageKey
                      ? (e) => {
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", String(index));
                        }
                      : undefined
                  }
                  onDragOver={storageKey ? (e) => e.preventDefault() : undefined}
                  onDrop={
                    storageKey
                      ? (e) => {
                          e.preventDefault();
                          const from = Number(e.dataTransfer.getData("text/plain"));
                          if (Number.isInteger(from)) moveColumn(from, index);
                        }
                      : undefined
                  }
                  style={{
                    position: "relative",
                    backgroundColor: "transparent",
                    color: "#000",
                  }}
                  onClick={(e) => e.stopPropagation()} // prevent auto-close
                >
                  {storageKey && (
                    <GripVertical size={13} className="hx-colcfg__grip" />
                  )}
                  <Checkbox
                    id={storageKey ? columnMenuLabel(head) : headLabel(head)}
                    label={storageKey ? columnMenuLabel(head) : headLabel(head)}
                    className=""
                    name={storageKey ? columnMenuLabel(head) : headLabel(head)}
                    // respClass=""
                    removeSpacing={true}
                    checked={head?.isVisible}
                    onChange={(name, value) => toggleColumn(value, index)}
                  />
                  {storageKey && (
                    <span className="hx-colcfg__move">
                      <button
                        type="button"
                        onClick={() => moveColumn(index, index - 1)}
                        disabled={index === 0}
                        title={t("Move up")}
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveColumn(index, index + 1)}
                        disabled={index === theadData.length - 1}
                        title={t("Move down")}
                      >
                        <ChevronDown size={13} />
                      </button>
                    </span>
                  )}
                  {/* <input
                  type="checkbox"
                  checked={head?.isVisible}
                  onChange={(e) => toggleColumn(e, index, head)}
                  className="table-checkbox"
                />{" "}
                {head?.name || head} */}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
  );

  return (
    <>
      {title && (
        <Heading
          title={title}
          isBreadcrumb={false}
          secondTitle={
            <div className="d-flex justify-content-center align-items-center no-print">
              <>
                {isExportPDf ? (
                  <span onClick={handleExportPDF} className="no-print">
                    <PDFIconSVG />
                  </span>
                ) : (
                  ""
                )}

                {isExportExcel ? (
                  <span onClick={handleExportExcel} className="no-print">
                    <ExcelIconSVG />{" "}
                  </span>
                ) : (
                  ""
                )}
              </>

              {columnSettingsDropdown}
            </div>
          }
        />
      )}
      {!title && storageKey && (
        <div className="hx-colcfg__bar no-print">{columnSettingsDropdown}</div>
      )}
      {tbody?.length > 0 && isSearch ? (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            marginLeft: "2px",
          }}
          className="no-print"
        >
          <Input
            type="text"
            className="table-input my-1 ml-3"
            respclass={"width-250"}
            removeFormGroupClass={true}
            placeholder={t("Search")}
            onChange={handleItemSearch}
            // placeholderLabel={<i className="fa fa-search search_icon" aria-hidden="true"></i>}
          />
          {searchExtra}
        </div>
      ) : (
        ""
      )}
      {(bodyData?.length > 0 || search) && (
        <div
          id="no-more-tables"
          ref={tableScrollRef}
          style={style}
          className={`${tableHeight} ${scrollView} custom-scrollbar TabScroll`}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="row">
            <div className="col-12">
              <Table className="mainTable pt-2" bordered>
                <thead
                  style={
                    stickyHeader
                      ? {
                          position: "sticky",
                          top: 0,
                          zIndex: 15,
                          backgroundColor: "#f8f9fa",
                        }
                      : {
                          zIndex: 1,
                          backgroundColor: "blue !important",
                        }
                  }
                >
                  {
                    console.log("theadData", theadData)
                  }
                  <tr>
                    {theadData
                      ?.filter((val) => val?.isVisible !== false)
                      ?.map((headData, index) => (
                        <th
                          key={index}
                          style={{
                            width: headData?.width ? headData?.width : "",
                            textAlign: headData?.textAlign
                              ? headData?.textAlign
                              : "",
                            whiteSpace: headData?.whiteSpace,
                            marginLeft: "3px",
                          }}
                          className={`${headData?.className ? headData?.className : ""}`}
                        >
                          {headData?.type === "" && (
                            <> {headLabel(headData)}</>
                          )}
                          {headData?.type === "N" && (
                            <span
                              className="pointer-cursor"
                              onClick={() => {
                                handleSortTable(index, "ASC");
                              }}
                            >
                              {headLabel(headData)}

                              <SortSVGIcon />
                            </span>
                          )}
                          {headData?.type === "ASC" && (
                            <span
                              className="pointer-cursor"
                              onClick={() => {
                                handleSortTable(index, "DESC");
                              }}
                            >
                              {" "}
                              {headLabel(headData)}
                              <IncreaseIngSortSVGIcon />
                            </span>
                          )}
                          {headData?.type === "DESC" && (
                            <span
                              className="pointer-cursor"
                              onClick={() => {
                                handleSortTable(index, "ASC");
                              }}
                            >
                              {" "}
                              {headLabel(headData)}
                              <DecreaseIngSortSVGIcon />
                            </span>
                          )}
                          {removeHeaderSpace ? "" : <>&nbsp;</>}
                        </th>
                      ))}
                  </tr>
                </thead>
                {bodyData?.length > 0 ? (
                  <>
                    <tbody style={{ backgroundColor: "white" }}>
                      {visibleBodyData?.map((ele, index) => {
                        const actualIndex = shouldPaginate
                          ? startIndex + index
                          : index;
                        const keys = Object.keys(ele).filter(
                          (key) =>
                            key !== "colorcode" &&
                            key !== "isVisible" &&
                            key !== "rowMeta",
                        );

                        // && isVisible
                        const rowColor = ele.colorcode || "";
                        // console.log(rowColor)
                        const expandedContent = renderExpandedRow
                          ? renderExpandedRow(ele, actualIndex)
                          : null;

                        return (
                          <React.Fragment key={actualIndex}>
                          <tr
                            className={
                              getRowClass ? getRowClass(ele, actualIndex) : ""
                            }
                            style={{ backgroundColor: rowColor }}
                            onClick={(e) =>
                              notSingleClick
                                ? handleRowClick(
                                    e.currentTarget,
                                    ele,
                                    actualIndex,
                                  )
                                : undefined
                            }
                            onDoubleClick={(e) =>
                              handleDoubleClick &&
                              handleDoubleClick(ele, actualIndex)
                            }
                          >
                            {keys?.map((bodyData, inx) => (
                              <td
                                key={inx}
                                data-title={
                                  theadData[inx]?.name
                                    ? getSubString(theadData[inx]?.name, 27)
                                    : getSubString(theadData[inx], 27)
                                }
                                // style={{ width: WWW }}
                                style={
                                  specificCellStyle &&
                                  specificCellStyle(
                                    ele,
                                    theadData[inx]?.name
                                      ? theadData[inx]?.name
                                      : theadData[inx],
                                    inx,
                                  )
                                }
                                className={`
                             ${
                               handleClassOnRow
                                 ? handleClassOnRow(
                                     ele,
                                     theadData[inx]?.name
                                       ? theadData[inx]?.name
                                       : theadData[inx],
                                     inx,
                                     actualIndex,
                                   )
                                 : "px-2"
                             }`}
                              >
                                {ele[bodyData]?.label ? (
                                  ele[bodyData]?.label
                                ) : ele[bodyData] || ele[bodyData] === 0 ? (
                                  ele[bodyData]
                                ) : (
                                  <>&nbsp;</>
                                )}
                                {isMobile && <>&nbsp;</>}
                              </td>
                            ))}
                          </tr>
                          {expandedContent ? (
                            <tr className="table-expanded-row">
                              <td
                                colSpan={keys.length}
                                className="p-0"
                                style={{ backgroundColor: "#fff" }}
                              >
                                {/* Dekhiye scrollViewportWidth ka comment: khuli
                                    qatar ko screen jitna hi chaura rakha jaata
                                    hai aur baayein kinare par tika diya jaata
                                    hai, taaki use padhne ke liye daayein tak
                                    scroll na karna pade. */}
                                <div
                                  style={
                                    scrollViewportWidth
                                      ? {
                                          position: "sticky",
                                          left: 0,
                                          width: scrollViewportWidth,
                                          maxWidth: scrollViewportWidth,
                                        }
                                      : undefined
                                  }
                                >
                                  {expandedContent}
                                </div>
                              </td>
                            </tr>
                          ) : null}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    {tfoot && (
                      <tfoot
                        style={{
                          position: "sticky",
                          bottom: 0,
                          backgroundColor: "white",
                          zIndex: 1,
                        }}
                      >
                        {tfoot.map((ele, index) => {
                          const keys = Object.keys(ele).filter(
                            (key) => key !== "colorcode" && key !== "isVisible",
                          );
                          const rowColor = ele.colorcode || "#e1f7e1";
                          return (
                            <tr
                              key={`tfoot-${index}`}
                              style={{ backgroundColor: rowColor }}
                            >
                              {keys?.map((bodyData, inx) => (
                                <td
                                  key={inx}
                                  className="px-2"
                                  style={{ fontWeight: "bold" }}
                                >
                                  {ele[bodyData]?.label ? (
                                    ele[bodyData]?.label
                                  ) : ele[bodyData] || ele[bodyData] === 0 ? (
                                    ele[bodyData]
                                  ) : (
                                    <>&nbsp;</>
                                  )}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tfoot>
                    )}
                  </>
                ) : (
                  <td colSpan="200" className="text-center">
                    {" "}
                    {t("No data found")}
                  </td>
                )}
              </Table>
              {renderPagination()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Tables;





// import React, { useEffect, useRef, useState } from "react";
// import Table from "react-bootstrap/Table";
// import {
//   SortSVGIcon,
//   IncreaseIngSortSVGIcon,
//   DecreaseIngSortSVGIcon,
//   PDFIconSVG,
//   ExcelIconSVG,
// } from "../../../components/SvgIcons/index.jsx";
// import Input from "../../formComponent/Input.jsx";
// import { useTranslation } from "react-i18next";
// import Heading from "../Heading.jsx";
// import { Dropdown } from "react-bootstrap";
// import { Settings } from "lucide-react";
// import { getSubString } from "../../../utils/helpers.js";
// import Checkbox from "../../formComponent/Checkbox.jsx";
// import {
//   exportHtmlToPDFNoPrint,
//   exportHtmlToPDFNoPrintFinance,
// } from "../../../utils/exportLibrary/index.js";
// import { exportHtmlToExcel } from "../../../utils/exportLibrary/index.js";

// // D:\Mayank Data\hopedianew\src\utils\helpers.js
// function Tables({
//   thead,
//   tbody,
//   getRowClass,
//   style,
//   tableHeight,
//   scrollView,
//   getRowClick,
//   // WWW,
//   handleClassOnRow,
//   handleDoubleClick,
//   isSearch,
//   notSingleClick = true,
//   title,
//   specificCellStyle,
//   removeHeaderSpace,
//   removeShorting = false,
//   isExportPDf = false,
//   isExportExcel = false,
//   tfoot,
//   paginationThreshold = 300,
//   paginationPageSize = 100,
// }) {
//   const [t] = useTranslation();
//   const [bodyData, setBodyData] = useState([]);
//   const [handleLanguageStatus, setHandleLanguageStatus] = useState(true);
//   const [search, setSearch] = useState("");
//   const [theadData, setTheadData] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(paginationPageSize);
//   const isMobile = window.innerWidth <= 768;
//   const activeRowRef = useRef(null);
//   const shouldPaginate = bodyData?.length > paginationThreshold;
//   const totalPages = shouldPaginate
//     ? Math.max(1, Math.ceil(bodyData.length / rowsPerPage))
//     : 1;
//   const safeCurrentPage = Math.min(currentPage, totalPages);
//   const startIndex = shouldPaginate ? (safeCurrentPage - 1) * rowsPerPage : 0;
//   const endIndex = shouldPaginate ? startIndex + rowsPerPage : bodyData?.length;
//   const visibleBodyData = shouldPaginate
//     ? bodyData?.slice(startIndex, endIndex)
//     : bodyData;

//   // useEffect(() => {
//   //   console.log("bodyData", bodyData);
//   // }, [bodyData]);

//   useEffect(() => {
//     setBodyData(
//       tbody?.map((val) => {
//         return { ...val, isVisible: true };
//       }),
//     );
//     setCurrentPage(1);
//     isSearch && handleItemSearch({ target: { value: search } });
//   }, [tbody]);

//   useEffect(() => {
//     setRowsPerPage(paginationPageSize);
//   }, [paginationPageSize]);

//   useEffect(() => {
//     if (currentPage > totalPages) {
//       setCurrentPage(totalPages);
//     }
//   }, [currentPage, totalPages]);

//   useEffect(() => {
//     if (tbody?.length > 0) {
//       let data = thead?.map((val, index) => {
//         if (typeof val === "object") {
//           if (
//             typeof Object?.values(tbody[0])[index] === "object" ||
//             removeShorting
//           ) {
//             val.type = "";
//           } else {
//             val.type = "N";
//           }
//         } else {
//           if (
//             typeof Object?.values(tbody[0])[index] === "object" ||
//             removeShorting
//           ) {
//             val = { name: val, type: "" };
//           } else {
//             val = { name: val, type: "N" };
//           }
//         }
//         return { ...val, isVisible: true };
//       });
//       setTheadData(data);
//     }
//   }, [tbody, handleLanguageStatus]);

//   // i18next.on("languageChanged", (lng) => {
//   //   console.log("Asdasd",lag)
//   //   setHandleLanguageStatus(!handleLanguageStatus)
//   // });

//   // Handle Sort Functionality

//   const handleSortTable = (index, type) => {
//     let typeName = Object?.keys(bodyData[0])[index];
//     let data = [...bodyData];
//     if (type === "DESC") {
//       data.sort((a, b) => {
//         if (new Date(a[typeName]).toString() === "Invalid Date") {
//           return b[typeName]?.localeCompare(a[typeName]);
//         } else {
//           return new Date(b[typeName]) - new Date(a[typeName]);
//         }
//       });
//     } else {
//       data.sort((a, b) => {
//         if (new Date(a[typeName]).toString() === "Invalid Date") {
//           return a[typeName]?.localeCompare(b[typeName]);
//         } else {
//           return new Date(a[typeName]) - new Date(b[typeName]);
//         }
//       });
//     }
//     setBodyData(data);

//     if (typeof theadData[index] === "object") {
//       let updatedHead = [...theadData]?.map((val, i) => {
//         if (index === i) {
//           val.type = type;
//         } else {
//           val.type = val.type === "" ? val.type : "N";
//         }
//         return val;
//       });
//       setTheadData(updatedHead);
//     }
//   };

//   // handle Search Item
//   const handleItemSearch = (e) => {
//     if (e?.target?.value) {
//       setSearch(e?.target?.value);
//       const results = tbody?.filter((obj) =>
//         Object.values(obj)?.some((value) => {
//           // debugger

//           if (typeof value === "string" || typeof value === "number") {
//             return String(value)
//               ?.toLowerCase()
//               .includes(e?.target?.value.toLowerCase());
//           } else if (value?.props?.value) {
//             return String(value?.props?.value)
//               ?.toLowerCase()
//               ?.includes(e?.target?.value.toLowerCase());
//           } else if (value?.label) {
//             return String(value?.label)
//               ?.toLowerCase()
//               ?.includes(e?.target?.value.toLowerCase());
//           } else if (Array.isArray(value)) {
//             return value?.some((item) => {
//               if (item?.label) {
//                 return String(item?.label)
//                   ?.toLowerCase()
//                   ?.includes(e?.target?.value.toLowerCase());
//               } else if (typeof item === "string" || typeof item === "number") {
//                 return String(item)
//                   ?.toLowerCase()
//                   ?.includes(e?.target?.value.toLowerCase());
//               }
//             });
//           }
//           //  else if (typeof value === "object") {
//           //   debugger
//           //   return String(value)
//           //     ?.toLowerCase()
//           //     .includes(e?.target?.value.toLowerCase());
//           // }
//           else if (typeof value?.props?.val === "object") {
//             // This is for screen builder
//             let Valdata = value?.props?.val;

//             return Object.values(Valdata)?.some((item) => {
//               return String(item)
//                 ?.toLowerCase()
//                 .includes(e?.target?.value.toLowerCase());
//             });
//           }
//         }),
//       );
//       setBodyData(results);
//       setCurrentPage(1);
//     } else {
//       setSearch("");
//       setBodyData(
//         tbody?.map((val) => {
//           return { ...val, isVisible: true };
//         }),
//       );
//       setCurrentPage(1);
//     }
//   };

//   // Function to handle row click
//   const handleRowClick = (rowRef, ele, index) => {
//     getRowClick && getRowClick(ele, index);

//     if (activeRowRef.current) {
//       // Reset the previous active row to its original color
//       const originalColor = activeRowRef.current.getAttribute(
//         "data-original-color",
//       );
//       activeRowRef.current.style.backgroundColor = originalColor;
//     }

//     // Set the new active row style
//     if (rowRef) {
//       // Store the original color of the new active row
//       rowRef.setAttribute("data-original-color", rowRef.style.backgroundColor);
//       rowRef.style.backgroundColor = "lightblue";
//       activeRowRef.current = rowRef;
//     }
//   };

//   const toggleColumn = (e, index, headName) => {
//     let keyName = Object.keys(tbody[0])[index];
//     let prevKeyName = Object.keys(tbody[0])[index - 1];
//     const hData = [...theadData];
//     hData[index].isVisible = e;

//     setTheadData(hData);
//     if (!e) {
//       const bData = bodyData.map((item) => {
//         delete item[keyName];
//         return item;
//       });
//       setBodyData(bData);
//     } else if (tbody && Array.isArray(tbody)) {
//       const bData = bodyData?.map((val, ind) => {
//         const orderedPatient = Object.fromEntries(
//           Object.entries(val).reduce((acc, [key, value]) => {
//             acc.push([key, value]);
//             if (key === prevKeyName) {
//               acc.push([keyName, tbody[ind][keyName]]);
//             } else if (prevKeyName === undefined) {
//               acc.unshift([keyName, tbody[ind][keyName]]);
//             }
//             return acc;
//           }, []),
//         );
//         return orderedPatient; // Ensure the return value is properly handled.
//       });
//       setBodyData(bData);
//     }
//   };

//   const [dropdownVisible, setDropdownVisible] = useState(false);

//   const dropdownRef = useRef(null);
//   const buttonRef = useRef(null);

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       // Check if the click was outside both the dropdown and the button
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(e.target) &&
//         buttonRef.current &&
//         !buttonRef.current.contains(e.target)
//       ) {
//         setDropdownVisible(false);
//       }
//     };

//     // Add event listener for clicks outside
//     document.addEventListener("mousedown", handleClickOutside);

//     // Cleanup the event listener
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   const handleExportPDF = () => {
//     exportHtmlToPDFNoPrintFinance("printSectionpdf", title);
//   };

//   const handleExportExcel = () => {
//     exportHtmlToExcel("printSectionpdf", title);
//   };

//   const renderPagination = () => {
//     if (!shouldPaginate) return null;

//     const firstRecord = bodyData.length === 0 ? 0 : startIndex + 1;
//     const lastRecord = Math.min(endIndex, bodyData.length);

//     return (
//       <div
//       style={{
//     position: "sticky",
//     bottom: 0,
//     zIndex: 100,
//     borderTop: "1px solid #ddd",
//     background: "#fff",
//   }}
//       className="d-flex justify-content-between align-items-center flex-wrap px-2 py-1 no-print">
//         <div>
//           {t("Showing")} {firstRecord} {t("to")} {lastRecord} {t("of")}{" "}
//           {bodyData.length} {t("entries")}
//         </div>
//         <div className="d-flex align-items-center">
//           <select
//             className="form-control form-control-sm mr-2"
//             style={{ width: "80px" }}
//             value={rowsPerPage}
//             onChange={(e) => {
//               setRowsPerPage(Number(e.target.value));
//               setCurrentPage(1);
//             }}
//           >
//             {[100, 250, 500, 1000].map((size) => (
//               <option key={size} value={size}>
//                 {size}
//               </option>
//             ))}
//           </select>
//           <button
//             type="button"
//             className="btn btn-sm btn-outline-secondary mx-1"
//             disabled={safeCurrentPage === 1}
//             onClick={() => setCurrentPage(1)}
//           >
//             {t("First")}
//           </button>
//           <button
//             type="button"
//             className="btn btn-sm btn-outline-secondary mx-1"
//             disabled={safeCurrentPage === 1}
//             onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
//           >
//             {t("Prev")}
//           </button>
//           <span className="mx-2">
//             {safeCurrentPage} / {totalPages}
//           </span>
//           <button
//             type="button"
//             className="btn btn-sm btn-outline-secondary mx-1"
//             disabled={safeCurrentPage === totalPages}
//             onClick={() =>
//               setCurrentPage((page) => Math.min(totalPages, page + 1))
//             }
//           >
//             {t("Next")}
//           </button>
//           <button
//             type="button"
//             className="btn btn-sm btn-outline-secondary mx-1"
//             disabled={safeCurrentPage === totalPages}
//             onClick={() => setCurrentPage(totalPages)}
//           >
//             {t("Last")}
//           </button>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <>
//       {title && (
//         <Heading
//           title={title}
//           isBreadcrumb={false}
//           secondTitle={
//             <div className="d-flex justify-content-center align-items-center no-print">
//               <>
//                 {isExportPDf ? (
//                   <span onClick={handleExportPDF} className="no-print">
//                     <PDFIconSVG />
//                   </span>
//                 ) : (
//                   ""
//                 )}

//                 {isExportExcel ? (
//                   <span onClick={handleExportExcel} className="no-print">
//                     <ExcelIconSVG />{" "}
//                   </span>
//                 ) : (
//                   ""
//                 )}
//               </>

//               <Dropdown show={dropdownVisible} ref={buttonRef}>
//                 <Dropdown.Toggle
//                   id="dropdown-basic"
//                   bsPrefix="custom-toggle"
//                   className="p-0 mx-1 theme-class"
//                 >
//                   <Settings
//                     size={18}
//                     onClick={() => {
//                       setDropdownVisible(!dropdownVisible);
//                     }}
//                     style={{ color: "#000" }}
//                   />
//                 </Dropdown.Toggle>

//                 <Dropdown.Menu
//                   style={{
//                     position: "absolute",
//                     zIndex: "999 !important",
//                     minHeight: "150px",
//                     maxHeight: "200px",
//                     overflowY: "auto",
//                   }}
//                   popperConfig={{ strategy: "fixed" }}
//                 >
//                   {theadData.map((head, index) => (
//                     <Dropdown.Item
//                       key={index}
//                       as="div"
//                       ref={dropdownRef}
//                       style={{
//                         position: "relative",
//                         backgroundColor: "transparent",
//                         color: "#000",
//                       }}
//                       onClick={(e) => e.stopPropagation()} // prevent auto-close
//                     >
//                       <Checkbox
//                         id={storageKey ? columnMenuLabel(head) : head?.name || head}
//                         label={storageKey ? columnMenuLabel(head) : head?.name || head}
//                         className=""
//                         name={storageKey ? columnMenuLabel(head) : head?.name || head}
//                         // respClass=""
//                         removeSpacing={true}
//                         checked={head?.isVisible}
//                         onChange={(name, value) => toggleColumn(value, index)}
//                       />
//                       {/* <input
//                       type="checkbox"
//                       checked={head?.isVisible}
//                       onChange={(e) => toggleColumn(e, index, head)}
//                       className="table-checkbox"
//                     />{" "}
//                     {head?.name || head} */}
//                     </Dropdown.Item>
//                   ))}
//                 </Dropdown.Menu>
//               </Dropdown>
//             </div>
//           }
//         />
//       )}
//       {tbody?.length > 0 && isSearch ? (
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "flex-start",
//             marginLeft: "2px",
//           }}
//           className="no-print"
//         >
//           <Input
//             type="text"
//             className="table-input my-1 ml-3"
//             respclass={"width-250"}
//             removeFormGroupClass={true}
//             placeholder={t("Search")}
//             onChange={handleItemSearch}
//             // placeholderLabel={<i className="fa fa-search search_icon" aria-hidden="true"></i>}
//           />
//         </div>
//       ) : (
//         ""
//       )}
//       {(bodyData?.length > 0 || search) && (
//         <div
//           id="no-more-tables"
//           style={style}
//           className={`${tableHeight} ${scrollView} custom-scrollbar TabScroll`}
//         >
//           <div className="row">
//             <div className="col-12">
//               <Table className="mainTable pt-2" bordered>
//                 <thead
//                   style={{
//                     zIndex: 1,
//                     backgroundColor: "blue !important",
//                   }}
//                 >
//                   <tr>
//                     {theadData
//                       ?.filter((val) => val?.isVisible !== false)
//                       ?.map((headData, index) => (
//                         <th
//                           key={index}
//                           style={{
//                             width: headData?.width ? headData?.width : "",
//                             textAlign: headData?.textAlign
//                               ? headData?.textAlign
//                               : "",
//                             whiteSpace: headData?.whiteSpace,
//                             marginLeft: "3px",
//                           }}
//                           className={`${headData?.className ? headData?.className : ""}`}
//                         >
//                           {headData?.type === "" && (
//                             <> {headData?.name ?? ""}</>
//                           )}
//                           {headData?.type === "N" && (
//                             <span
//                               className="pointer-cursor"
//                               onClick={() => {
//                                 handleSortTable(index, "ASC");
//                               }}
//                             >
//                               {headData?.name ?? ""}

//                               <SortSVGIcon />
//                             </span>
//                           )}
//                           {headData?.type === "ASC" && (
//                             <span
//                               className="pointer-cursor"
//                               onClick={() => {
//                                 handleSortTable(index, "DESC");
//                               }}
//                             >
//                               {" "}
//                               {headData?.name ?? ""}
//                               <IncreaseIngSortSVGIcon />
//                             </span>
//                           )}
//                           {headData?.type === "DESC" && (
//                             <span
//                               className="pointer-cursor"
//                               onClick={() => {
//                                 handleSortTable(index, "ASC");
//                               }}
//                             >
//                               {" "}
//                               {headData?.name ?? ""}
//                               <DecreaseIngSortSVGIcon />
//                             </span>
//                           )}
//                           {removeHeaderSpace ? "" : <>&nbsp;</>}
//                         </th>
//                       ))}
//                   </tr>
//                 </thead>
//                 {bodyData?.length > 0 ? (
//                   <>
//                     <tbody style={{ backgroundColor: "white" }}>
//                       {visibleBodyData?.map((ele, index) => {
//                         const actualIndex = shouldPaginate
//                           ? startIndex + index
//                           : index;
//                         const keys = Object.keys(ele).filter(
//                           (key) => key !== "colorcode" && key !== "isVisible",
//                         );

//                         // && isVisible
//                         const rowColor = ele.colorcode || "";
//                         // console.log(rowColor)
//                         return (
//                           <tr
//                             key={actualIndex}
//                             className={
//                               getRowClass ? getRowClass(ele, actualIndex) : ""
//                             }
//                             style={{ backgroundColor: rowColor }}
//                             onClick={(e) =>
//                               notSingleClick
//                                 ? handleRowClick(
//                                     e.currentTarget,
//                                     ele,
//                                     actualIndex,
//                                   )
//                                 : undefined
//                             }
//                             onDoubleClick={(e) =>
//                               handleDoubleClick &&
//                               handleDoubleClick(ele, actualIndex)
//                             }
//                           >
//                             {keys?.map((bodyData, inx) => (
//                               <td
//                                 key={inx}
//                                 data-title={
//                                   theadData[inx]?.name
//                                     ? getSubString(theadData[inx]?.name, 27)
//                                     : getSubString(theadData[inx], 27)
//                                 }
//                                 // style={{ width: WWW }}
//                                 style={
//                                   specificCellStyle &&
//                                   specificCellStyle(
//                                     ele,
//                                     theadData[inx]?.name
//                                       ? theadData[inx]?.name
//                                       : theadData[inx],
//                                     inx,
//                                   )
//                                 }
//                                 className={`
//                              ${
//                                handleClassOnRow
//                                  ? handleClassOnRow(
//                                      ele,
//                                      theadData[inx]?.name
//                                        ? theadData[inx]?.name
//                                        : theadData[inx],
//                                      inx,
//                                      actualIndex,
//                                    )
//                                  : "px-2"
//                              }`}
//                               >
//                                 {ele[bodyData]?.label ? (
//                                   ele[bodyData]?.label
//                                 ) : ele[bodyData] || ele[bodyData] === 0 ? (
//                                   ele[bodyData]
//                                 ) : (
//                                   <>&nbsp;</>
//                                 )}
//                                 {isMobile && <>&nbsp;</>}
//                               </td>
//                             ))}
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                     {tfoot && (
//                       <tfoot
//                         style={{
//                           position: "sticky",
//                           bottom: 0,
//                           backgroundColor: "white",
//                           zIndex: 1,
//                         }}
//                       >
//                         {tfoot.map((ele, index) => {
//                           const keys = Object.keys(ele).filter(
//                             (key) => key !== "colorcode" && key !== "isVisible",
//                           );
//                           const rowColor = ele.colorcode || "#e1f7e1";
//                           return (
//                             <tr
//                               key={`tfoot-${index}`}
//                               style={{ backgroundColor: rowColor }}
//                             >
//                               {keys?.map((bodyData, inx) => (
//                                 <td
//                                   key={inx}
//                                   className="px-2"
//                                   style={{ fontWeight: "bold" }}
//                                 >
//                                   {ele[bodyData]?.label ? (
//                                     ele[bodyData]?.label
//                                   ) : ele[bodyData] || ele[bodyData] === 0 ? (
//                                     ele[bodyData]
//                                   ) : (
//                                     <>&nbsp;</>
//                                   )}
//                                 </td>
//                               ))}
//                             </tr>
//                           );
//                         })}
//                       </tfoot>
//                     )}
//                   </>
//                 ) : (
//                   <td colSpan="200" className="text-center">
//                     {" "}
//                     {t("No data found")}
//                   </td>
//                 )}
//               </Table>
//               {renderPagination()}
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// export default Tables;
