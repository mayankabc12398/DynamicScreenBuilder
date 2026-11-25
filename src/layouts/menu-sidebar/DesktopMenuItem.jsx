import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { confirmLeave } from "../../utils/leaveGuard";
import { useTranslation } from "react-i18next";
import { AutoComplete } from "primereact/autocomplete";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";

const DesktopMenuItem = ({ filteredData }) => {
  // console.log("filteredData",filteredData)
  const containerRef = useRef(null);
  const pageContainerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [t] = useTranslation();
  const [activeBar, setActiveBar] = useState(null);
  const [showPrevious, setShowPrevious] = useState(false);
  const [showPageScroll, setShowPageScroll] = useState({
    prev: false,
    next: false,
  });
  const [showNext, setShowNext] = useState(false);
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);

  const search = (event) => {
    const filteredSuggestions = extractedData
      .flat()
      .filter((suggestion) =>
        suggestion?.childrenName
          ?.toLowerCase()
          .startsWith(event.query?.toLowerCase())
      );
    if (filteredSuggestions.length > 0) {
      setSuggestions(
        filteredSuggestions.map((suggestion) => suggestion.childrenName)
      );
    } else {
      setSuggestions([]);
    }
  };
  const PageScrollToLeft = () => {
    if (pageContainerRef?.current) {
      pageContainerRef.current.scrollLeft -= 100; // You can adjust the scroll amount as needed
    }
  };

  const PageScrollToRight = () => {
    if (pageContainerRef?.current) {
      pageContainerRef.current.scrollLeft += 100; // You can adjust the scroll amount as needed
    }
  };

  const scrollToLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollLeft -= 100; // You can adjust the scroll amount as needed
    }
  };

  const scrollToRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollLeft += 100; // You can adjust the scroll amount as needed
    }
  };

  const findActiveTab = () => {
    for (let i = 0; i < filteredData?.length; i++) {
      for (let j = 0; j < filteredData[i]?.children?.length; j++) {
        // debugger
        if (
          filteredData[i]["children"][j]["actualUrl"]?.toLowerCase() ===
          location?.state?.actualUrl?.toLowerCase()
        ) {
          setActiveBar(i);
          break;
        }
      }
    }
  };

  const handleClick = (e) => {
    if (!confirmLeave()) return;
    const url = extractedData.flat();
    const { value } = e;
    const navi = url?.find((ele) =>
      ele?.childrenName?.toLowerCase().startsWith(value?.toLowerCase())
    );
    debugger
    // console.log("first",navi)
                  // state={{ data: item?.breadcrumb, subMenuID: item?.subMenuID, actualUrl: item?.actualUrl }}

    // navigate(navi?.url, { state: { data: navi?.breadcrumb, actualUrl: navi?.actualUrl, subMenuID: navi?.subMenuID } });
    navigate(navi?.url, { state:{ data: navi?.breadcrumb, subMenuID: navi?.subMenuID, actualUrl: navi?.actualUrl }});
    setValue("");
  };

  useEffect(() => {
    const checkScroll = () => {
      if (containerRef.current) {
        setShowPrevious(containerRef.current.scrollLeft > 0);
        setShowNext(
          containerRef.current.scrollLeft <
          containerRef.current.scrollWidth - containerRef.current.clientWidth
        );
      }
    };
    if (containerRef.current) {
      containerRef.current.addEventListener("scroll", checkScroll);
      // Check immediately on mount
      checkScroll();
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("scroll", checkScroll);
      }
    };
  }, [filteredData]);
  useEffect(() => {
    const checkScroll = () => {
      if (pageContainerRef.current) {
        setShowPageScroll({
          prev: pageContainerRef.current.scrollLeft > 0,
          next:
            pageContainerRef.current.scrollLeft <
            pageContainerRef.current.scrollWidth -
            pageContainerRef.current.clientWidth,
        });
      }
    };
    if (pageContainerRef.current) {
      pageContainerRef.current.addEventListener("scroll", checkScroll);
      // Check immediately on mount
      checkScroll();
    }

    return () => {
      if (pageContainerRef.current) {
        pageContainerRef.current.removeEventListener("scroll", checkScroll);
      }
    };
  }, [filteredData[activeBar]?.children]);
  
  const extractedData = filteredData?.map((menuItem) => {
    const childrenData = menuItem?.children?.map((child) => ({
      childrenName: child.childrenName,
      url: child.url,
      breadcrumb: child.breadcrumb,
      actualUrl: child.actualUrl,
      subMenuID: child.subMenuID,
    }));
    return childrenData;
  });

  useEffect(() => {
    findActiveTab();
  }, [filteredData, location]);

  const handlePageLink = (menuItem) => {
    if (menuItem?.children?.length) {
      navigate(menuItem?.children[0].url, {
        state: { data: menuItem?.children[0]?.breadcrumb, subMenuID: menuItem?.children[0]?.subMenuID, actualUrl: menuItem?.children[0]?.actualUrl }
      });
    }
  };

  const handleThemeClass = () => {
    let theme = useLocalStorage("theme", "get");
    let element = document.getElementById("root");
    const classList = Array.from(element.classList);

    classList.forEach((className) => {
      // console.log("a",className,theme)
      if (className !== theme && className.endsWith("_theme")) {
        element.classList.remove(className);
      }
    });
  };

  useEffect(() => {
    const handleShortcut = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "q") {
        e.preventDefault();
        searchRef.current.focus();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <div className="desktop-sidebar ">
      <div className="bg-color-container">
        <div className="d-flex justify-content-end bindrole container-fluid ">
          <nav style={{ width: "950px" }}>
            <div
              className="d-flex align-items-center justify-content-end"
              style={{ height: "24px" }}
            >
              {showPrevious && (
                <i
                  className="fa fa-angle-double-left text-white mx-2 mt-0-7rem"
                  aria-hidden="true"
                  onClick={scrollToLeft}
                ></i>
              )}
              <ul className={`nav nav-sidebar`} role="menu" ref={containerRef}>
                {filteredData?.map((menuItem, index) => (
                  <li
                    key={menuItem.menuName}
                    className={`nav-item menu-open ${activeBar === index && "active-sub-menu-list-style"}`}
                    onClick={() => {
                      if (!confirmLeave()) return;
                      setActiveBar(index);
                      handlePageLink(menuItem);
                    }}
                    style={{ textWrap: "nowrap" }}
                  >
                    <span
                      className={`nav-link`}
                      role="link"
                      style={{ cursor: "pointer" }}
                    >
                      <i
                        className={`${menuItem.menuName === "DASHBOARD" ? "fas fa-tachometer-alt nav-icon" : menuItem.menuIcon}  mr-2`}
                      />
                      <p>{t(menuItem.menuName)}</p>
                    </span>
                  </li>
                ))}
              </ul>

              {showNext && (
                <i
                  className="fa fa-angle-double-right text-white mx-2 mt-0-7rem"
                  aria-hidden="true"
                  onClick={scrollToRight}
                ></i>
              )}
            </div>
          </nav>
          <div className=" mx-2 " style={{ position: "relative" }}>
            <AutoComplete
              inputRef={searchRef}
              value={value}
              suggestions={suggestions}
              completeMethod={search}
              className="w-100 custom-magic-search"
              onSelect={(e) => handleClick(e)}
              id="searchtest"
              onChange={(e) => setValue(e.value)}
              placeholder={t("Menu Search")}
            />

            <i className="fa fa-search search_icon" aria-hidden="true"></i>
          </div>
        </div>
      </div>
      <div
        style={{ backgroundColor: "white", boxShadow: "0px 0px 5px grey" }}
        className="w-100 d-flex"
      >
        {showPageScroll?.prev && (
          <i
            className="fa fa-angle-double-left mx-2 mt-2 pointer-cursor mt-0-7rem"
            aria-hidden="true"
            onClick={PageScrollToLeft}
          ></i>
        )}

        <ul className="nav d-flex " ref={pageContainerRef}>
          {filteredData &&
            filteredData[activeBar]?.children &&
            filteredData[activeBar]?.children?.filter(item => item?.url !== "/emergency-patient-search")?.map((item,index) => (
              <li
                className={`nav-item mx-1 ${location?.state?.actualUrl?.toLowerCase() === item?.actualUrl?.toLowerCase() ? " active-tab-menu" : "text-black"}`}
                key={`${item.childrenName}_${index}`}
                // key={item.childrenName}
                style={{ padding: "3px 15px" }}
                onClick={handleThemeClass}
              >
             
                <NavLink
                  to={`${item.url}`}
                  state={{ data: item?.breadcrumb, subMenuID: item?.subMenuID, actualUrl: item?.actualUrl }}
                  onClick={(e) => { if (!confirmLeave()) e.preventDefault(); }}
                >
                  <p style={{ whiteSpace: "nowrap", margin: "0px" }}>
                    <i className={`${item?.subMenuIcon || "fas fa-tachometer-alt"} nav-icon mr-2`} />{" "}
                    {t(item?.childrenName)}
                  </p>
                </NavLink>
              </li>
            ))}
        </ul>
        
        {showPageScroll?.next && (
          <i
            className="fa fa-angle-double-right mx-2 mt-2 pointer-cursor mt-0-7rem"
            aria-hidden="true"
            onClick={PageScrollToRight}
          ></i>
        )}
      </div>
    </div>
  );
};

export default DesktopMenuItem;
