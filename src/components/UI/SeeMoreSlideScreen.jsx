import { useEffect, useRef, useState, useMemo } from "react";
import ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";
import { PageIconSVG } from "../SvgIcons";

const SeeMoreSlideScreen = ({
  name,
  seeMore = [],
  handleChangeComponent,
  data,
  handleBindFrameMenu,
  openFirstItem,
  isRemoveSvg,
  minWidth = "320px",
}) => {
  // debugger;
  const [t] = useTranslation();
  const [show, setShow] = useState(false);
  const [searchText, setSearchText] = useState("");
  // Every group is open when the list appears, so the user sees the whole menu
  // without having to search or expand. Clicking a header still collapses it.
  const [openCategories, setOpenCategories] = useState([]);
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    maxHeight: "auto",
    isUpper: false,
  });

  const cardRef = useRef(null);
  const buttonRef = useRef(null);
  // 1. ROBUST GROUPING LOGIC
  const groupedData = useMemo(() => {
    if (!seeMore || !Array.isArray(seeMore)) return [];

    const groups = seeMore.reduce((acc, item) => {
      // FIX: Hunt for ANY key that might contain the form name
      const label =
        item?.FileName ||
        item?.FormName ||
        item?.Text ||
        item?.MenuName ||
        item?.menuName ||
        item?.name ||
        item?.label ||
        item?.Name ||
        "Untitled Form";

      // FIX: Hunt for ANY key that might contain the category/header
      const category =
        item?.MenuHeaderName ||
        item?.menuHeaderName ||
        item?.Category ||
        item?.Header ||
        item?.GroupName ||
        "OTHERS";

      if (
        searchText &&
        !label.toLowerCase().includes(searchText.toLowerCase())
      ) {
        return acc;
      }

      if (!acc[category]) acc[category] = [];
      acc[category].push({
        ...item,
        safeLabel: label,
        safeCategory: category,
      });
      return acc;
    }, {});

    // Sort: Keep 'GENERAL' at bottom, others alphabetical
    return Object.entries(groups).sort((a, b) => {
      if (a[0] === "OTHERS") return 1;
      if (b[0] === "OTHERS") return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [seeMore, searchText]);

  // 2. AUTO-EXPAND LOGIC
  // Open every group that is currently listed, so the full menu is visible as
  // soon as the card opens and while the user filters it.
  useEffect(() => {
    if (show && groupedData.length > 0) {
      setOpenCategories(groupedData.map(([header]) => header));
    }
  }, [groupedData, show]);

  const toggleCategory = (header) =>
    setOpenCategories((prev) =>
      prev.includes(header)
        ? prev.filter((item) => item !== header)
        : [...prev, header],
    );

  // 3. DYNAMIC POSITIONING
  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const spaceBelow = vh - rect.bottom - 10;
      const spaceAbove = rect.top - 10;
      const isUpper = spaceBelow < 400 && spaceAbove > spaceBelow;

      setDropdownPos({
        top: isUpper ? "auto" : rect.bottom + 5,
        bottom: isUpper ? vh - rect.top + 5 : "auto",
        left: Math.min(rect.left, window.innerWidth - parseInt(minWidth) - 20),
        maxHeight: isUpper ? spaceAbove : spaceBelow,
        isUpper,
      });
    }
  };

  useEffect(() => {
    if (show) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [show, openCategories, searchText]);

  const handleToggleCard = () => {
    handleBindFrameMenu && handleBindFrameMenu(data);
    setShow(!show);
    if (!show) setSearchText("");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        cardRef.current &&
        !cardRef.current.contains(e.target) &&
        !buttonRef.current.contains(e.target)
      ) {
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderCard = () => {
    if (!show || openFirstItem === false) return null;

    return ReactDOM.createPortal(
      <div
        ref={cardRef}
        style={{
          position: "fixed",
          zIndex: 10000,
          top: dropdownPos.top,
          bottom: dropdownPos.bottom,
          left: `${dropdownPos.left}px`,
          width: minWidth,
          maxHeight: `${dropdownPos.maxHeight}px`,
          backgroundColor: "#fff",
          borderRadius: "8px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          border: "1px solid #cbd5e1",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "8px", background: "#f1f5f9" }}>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder={t("SEARCH FORMS...")}
            value={searchText}
            autoFocus
            onChange={(e) => setSearchText(e.target.value)}
            style={{ fontSize: "12px" }}
          />
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {groupedData.length > 0 ? (
            groupedData.map(([header, items]) => {
              const isExpanded = openCategories.includes(header);
              return (
                <div key={header} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <div
                    onClick={() => toggleCategory(header)}
                    style={{
                      padding: "10px 15px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: isExpanded ? "#f8fafc" : "#fff",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "bold",
                        color: "#475569",
                        textTransform: "uppercase",
                      }}
                    >
                      {header}
                    </span>
                    <i
                      className={`fas fa-chevron-${isExpanded ? "down" : "right"}`}
                      style={{ fontSize: "9px", color: "#94a3b8" }}
                    />
                  </div>

                  <div
                    style={{
                      // No fixed cap here: a long menu (45+ forms) would be
                      // clipped and the last items unreachable. The card itself
                      // scrolls, so the open group can be its natural height.
                      maxHeight: isExpanded ? "none" : "0",
                      overflow: isExpanded ? "visible" : "hidden",
                    }}
                    //    style={{
                    //    maxHeight: isExpanded ? "1000px" : "0",
                    //   overflow: "hidden",
                    // }}
                  >
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setShow(false);
                          // callers title the frame with item.label; frame-menu items carry
                          // it as name / FileName, so pass the resolved label along
                          handleChangeComponent({ ...item, label: item?.label || item?.safeLabel });
                        }}
                        style={{
                          padding: "8px 15px 8px 30px",
                          fontSize: "12px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          borderTop: "1px solid #f8fafc",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#f1f5f9")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <i
                          className="far fa-file-alt"
                          style={{ color: "#3b82f6" }}
                        />
                        <span style={{ color: "#1e293b" }}>
                          {item.safeLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "#94a3b8",
                fontSize: "12px",
              }}
            >
              {t("No Results")}
            </div>
          )}
        </div>
      </div>,
      document.body,
    );
  };

  return (
    <div ref={buttonRef} style={{ display: "inline-block" }}>
      <div
        onClick={handleToggleCard}
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span style={{ fontWeight: "bold", fontSize: "13px" }}>{name}</span>
        {!isRemoveSvg && <PageIconSVG />}
      </div>
      {renderCard()}
    </div>
  );
};

export default SeeMoreSlideScreen;
