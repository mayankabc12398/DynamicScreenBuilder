import React, { useMemo, useRef, useState } from "react";
import Table from "react-bootstrap/Table";
import { useTranslation } from "react-i18next";
import CustomTooltip from "../../formComponent/CustomTooltip";
import ColorCodingSearch from "../../commonComponents/ColorCodingSearch";
import Modal from "../../modalComponent/Modal";

// Pulls the plain text out of a sub-table cell, which is often a string
// wrapped in a <div>/<span> for alignment or a status tooltip (Rate, Item
// etc. in PatientBilling's buildRow). Used only to build the Set Filter
// checklist - never shown, never sent anywhere.
const getCellText = (val) => {
  if (val == null) return "";
  if (typeof val === "string" || typeof val === "number") return String(val);
  if (React.isValidElement(val)) {
    const children = val.props?.children;
    if (Array.isArray(children)) return children.map(getCellText).join(" ");
    return getCellText(children);
  }
  return "";
};
function NestedRowTable({
  thead,
  tbody,
  isRemoveSecondHeader = false,
  fs,
  getRowClass,
  style,
  tableHeight,
  scrollView,
  getRowClick,
  seondThead,
  WWW,
  SubtableClass,
  handleSubRow,
  zIndex,
  removeHeaderSpace = false,
  showSubRowSearch = false, // NEW: global switch — set false to hide search everywhere
  isLabStatusColourAllowed = false, // NEW: lab status colour-coding + tooltip feature
}) {
  console.log("tbody", tbody)
  const isMobile = window.innerWidth <= 768;
  const activeRowRef = useRef(null);
  const { t } = useTranslation();

  // NEW: filter text state, keyed by parent row index
  const [subRowFilterText, setSubRowFilterText] = useState({});

  // "Set Filter" (old-ASPX-style User + Item checklist), keyed by parent row index.
  // {} / { user: "", items: [] } = no structured filter applied, every row shown.
  const [subRowStructuredFilter, setSubRowStructuredFilter] = useState({});
  // Which department's Set Filter popup is open, and the in-progress picks before Filter is pressed.
  const [filterModal, setFilterModal] = useState({ show: false, index: null });
  const [draftUser, setDraftUser] = useState("");
  const [draftSubCat, setDraftSubCat] = useState("");
  const [draftItems, setDraftItems] = useState([]);

  const openSetFilter = (index, subRowList) => {
    const applied = subRowStructuredFilter[index];
    setDraftUser(applied?.user || "");
    setDraftSubCat(applied?.subCat || "");
    setDraftItems(applied?.items || []);
    setFilterModal({ show: true, index });
  };

  const closeSetFilter = () => setFilterModal({ show: false, index: null });

  const applySetFilter = () => {
    setSubRowStructuredFilter((prev) => ({
      ...prev,
      [filterModal.index]: {
        user: draftUser,
        subCat: draftSubCat,
        items: draftItems,
      },
    }));
    closeSetFilter();
  };

  // Function to handle row click
  const handleRowClick = (rowRef, rowColor, ele) => {
    getRowClick && getRowClick(ele);
    // Reset the previous active row style if it exists
    if (activeRowRef.current) {
      activeRowRef.current.style.backgroundColor = "";
    }
    // Set the new active row style
    if (rowRef) {
      rowRef.style.backgroundColor = "lightblue";
      activeRowRef.current = rowRef;
    }
  };

  // NEW: update filter text for a specific parent row's nested table
  const handleSubRowFilterChange = (index, value) => {
    setSubRowFilterText((prev) => ({ ...prev, [index]: value }));
  };

  // NEW: filter helper — matches filter text against any value in subRowData
  const getFilteredSubRowList = (subRowList, filterText, structured) => {
    // Guard: only filter real arrays, otherwise just return as-is (or empty array)
    if (!Array.isArray(subRowList)) return subRowList || [];
    let list = subRowList;

    if (filterText) {
      const search = filterText.toLowerCase();
      list = list.filter(
        (subRowData) =>
          subRowData &&
          typeof subRowData === "object" &&
          Object.entries(subRowData).some(
            // colorcode / textcolor / LabStatus / SubCat sirf meta fields hain, search me match nahi hone chahiye.
            ([key, val]) =>
              key !== "colorcode" &&
              key !== "textcolor" &&
              key !== "LabStatus" &&
              key !== "SubCat" &&
              String(val ?? "").toLowerCase().includes(search)
          )
      );
    }

    if (structured?.user) {
      list = list.filter(
        (subRowData) => getCellText(subRowData?.Name) === structured.user
      );
    }
    if (structured?.subCat) {
      list = list.filter(
        (subRowData) => getCellText(subRowData?.SubCat) === structured.subCat
      );
    }
    if (structured?.items?.length > 0) {
      list = list.filter((subRowData) =>
        structured.items.includes(getCellText(subRowData?.Item))
      );
    }

    return list;
  };

  // Distinct User / Item text values present in one department's sub-table, for the
  // Set Filter popup. "Item" / "Name" are PatientBilling's buildRow keys (the only
  // caller that turns showSubRowSearch on) - a sub-table built differently just
  // shows an empty checklist, nothing breaks.
  const getFilterChoices = (subRowList) => {
    const users = new Set();
    const subCats = new Set();
    const items = new Set();
    (subRowList || []).forEach((subRowData) => {
      const user = getCellText(subRowData?.Name).trim();
      const subCat = getCellText(subRowData?.SubCat).trim();
      const item = getCellText(subRowData?.Item).trim();
      if (user) users.add(user);
      if (subCat) subCats.add(subCat);
      if (item) items.add(item);
    });
    return {
      users: [...users].sort(),
      subCats: [...subCats].sort(),
      items: [...items].sort(),
    };
  };

  // Choices for the currently-open Set Filter popup, derived from the raw (unfiltered)
  // sub row list of the department it was opened for.
  const filterChoices = useMemo(
    () =>
      getFilterChoices(
        filterModal.index != null
          ? tbody?.[filterModal.index]?.subRow?.subRowList
          : null
      ),
    [filterModal.index, tbody]
  );

  const toggleDraftItem = (itemText) => {
    setDraftItems((prev) =>
      prev.includes(itemText)
        ? prev.filter((x) => x !== itemText)
        : [...prev, itemText]
    );
  };

  return (
    tbody?.length > 0 && (
      <>
      <div
        id="no-more-tables"
        style={style}
        className={`${tableHeight} ${scrollView} custom-scrollbar TabScroll`}
      >
        <div className="row">
          <div className="col-12">
            <Table className="mainTable pt-2 pl-2 pr-2" bordered>
              <thead style={{ zIndex: zIndex || 1 }}>
                {/*  // zIndex is changed */}
                <tr>
                  {thead?.map((headData, index) => (
                    <th
                      key={index}
                      style={{
                        width: headData?.width ? headData?.width : "",
                        textAlign: headData?.textAlign
                          ? headData?.textAlign
                          : "",
                      }}
                      className="px-2"
                    >
                      {headData?.name ? headData?.name : headData}
                      {removeHeaderSpace ? "" : <>&nbsp;</>}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody style={{ backgroundColor: "white" }}>
                {tbody?.map((ele, index) => {
                  const keys = Object.keys(ele).filter(
                    (key) => key !== "subRow" && key !== "colorcode"
                  );

                  const rowColor = ele.colorcode || ""; // Use colorcode if present

                  // NEW: compute filtered sub row list for this parent row
                  const filteredSubRowList = getFilteredSubRowList(
                    ele?.subRow?.subRowList,
                    subRowFilterText[index],
                    subRowStructuredFilter[index]
                  );

                  return (
                    <React.Fragment key={index}>
                      <tr
                        className={getRowClass ? getRowClass(ele, index) : ""}
                        style={{ backgroundColor: rowColor }}
                        onClick={(e) =>
                          handleRowClick(e.currentTarget, rowColor, ele)
                        }
                      >
                        {keys?.map((bodyData, inx) => (
                          <td
                            key={inx}
                            data-title={
                              thead[inx]?.name ? thead[inx]?.name : thead[inx]
                            }
                            style={{ width: WWW }}
                            className="px-2"
                          >
                            {!Array.isArray(ele[bodyData]) &&
                              ele[bodyData]?.label ? (
                              ele[bodyData]?.label
                            ) : !Array.isArray(ele[bodyData]) &&
                              ele[bodyData] ? (
                              ele[bodyData]
                            ) : (
                              <>&nbsp;</>
                            )}
                            {isMobile && <>&nbsp;</>}
                          </td>
                        ))}
                      </tr>
                      {/* Render the nested table if subRow exists */}
                      {ele?.subRow?.isopen &&
                        ele?.subRow?.subRowList?.length > 0 && (
                          <tr>
                            <td
                              colSpan={thead?.length}
                              className="nestedTableTD"
                            >

                              {/* NEW: filter input for the nested table — shown only if allowed */}
                              {showSubRowSearch &&
                                !ele?.subRow?.hideSearch && (
                                  <div
                                    className="d-flex align-items-center justify-content-between mb-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* Legend sirf un sub-tables par jinhone khud
                                        maanga ho (IPD Billing me sirf LABORATORY).
                                        Flag na ho to purana prop wala behaviour. */}
                                    {(ele?.subRow?.showLabStatusLegend ??
                                      isLabStatusColourAllowed) && (
                                      <div className="d-flex">
                                        <ColorCodingSearch
                                          color={'#1b5e20'}
                                          label={t("Approved")}
                                        />
                                        <ColorCodingSearch
                                          color={'#ffc0cb'}
                                          label={t("Provisional")}
                                        />
                                        <ColorCodingSearch
                                          color={'#d32f2f'}
                                          label={t("Rejected")}
                                        />
                                      </div>
                                    )}
                                    {ele?.subRow?.showRadiologyStatusLegend && (
                                      <div className="d-flex">
                                        <ColorCodingSearch
                                          color={'#1b5e20'}
                                          label={t("Accepted")}
                                        />
                                        <ColorCodingSearch
                                          color={'#d32f2f'}
                                          label={t("Rejected")}
                                        />
                                      </div>
                                    )}


                                    {/* Search input — left side */}
                                    <div className="d-flex align-items-center">
                                      <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        style={{ maxWidth: "220px" }}
                                        placeholder={t("Search") || "Search..."}
                                        value={subRowFilterText[index] || ""}
                                        onChange={(e) =>
                                          handleSubRowFilterChange(
                                            index,
                                            e.target.value
                                          )
                                        }
                                      />
                                      {/* Old-ASPX "Set Filter": User + Item checklist, client-side
                                          show/hide of the rows already loaded in this department. */}
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-primary ml-2"
                                        onClick={() =>
                                          openSetFilter(index, ele?.subRow?.subRowList)
                                        }
                                      >
                                        {t("Filter")}
                                      </button>
                                      {subRowStructuredFilter[index]?.user ||
                                      subRowStructuredFilter[index]?.subCat ||
                                      subRowStructuredFilter[index]?.items?.length > 0 ? (
                                        <span
                                          className="ml-2 text-danger"
                                          role="button"
                                          title={t("Clear Filter")}
                                          onClick={() =>
                                            setSubRowStructuredFilter((prev) => ({
                                              ...prev,
                                              [index]: { user: "", subCat: "", items: [] },
                                            }))
                                          }
                                        >
                                          <i className="fa fa-times-circle" aria-hidden="true" />
                                        </span>
                                      ) : null}
                                    </div>
                                    {/* Colour legend — right of search, only when lab status colouring is on */}

                                  </div>
                                )}

                              <Table
                                className={`nestedTable ${SubtableClass}`}
                                bordered
                              >
                                {!isRemoveSecondHeader && (
                                  <thead>
                                    <tr>
                                      {(
                                        ele?.subRow?.secondThead ?? seondThead
                                      )?.map((key, idx) => (
                                        <th
                                          key={idx}
                                          id={index}
                                          style={{
                                            width: key?.width ? key?.width : "",
                                            textAlign: key?.textAlign
                                              ? key?.textAlign
                                              : "",
                                          }}
                                        >
                                          {key?.name ? key?.name : key} &nbsp;
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                )}
                                <tbody>
                                  {filteredSubRowList?.length > 0 ? (
                                    filteredSubRowList.map(
                                      (subRowData, subIndex) => (
                                        <tr
                                          key={subIndex}
                                          id={`nested-subrow-${index}-${subIndex}`}
                                          className={`${handleSubRow &&
                                            handleSubRow(
                                              subRowData,
                                              index,
                                              subIndex
                                            )
                                            }`}
                                          style={{
                                            backgroundColor:
                                              subRowData?.colorcode || "",
                                            color: subRowData?.textcolor || "",
                                          }}
                                        >
                                          {/* CustomTooltip — only when lab-status colouring is on and LabStatus present */}
                                          {isLabStatusColourAllowed && subRowData?.LabStatus && (
                                            <CustomTooltip
                                              id={`nested-subrow-${index}-${subIndex}`}
                                              content={`${t("Lab Status") || "Lab Status"}: ${subRowData.LabStatus}`}
                                            />
                                          )}
                                          {Object.keys(subRowData)
                                            .filter(
                                              (key) =>
                                                key !== "colorcode" &&
                                                key !== "textcolor" &&
                                                key !== "LabStatus" &&
                                                key !== "SubCat",
                                            )
                                            .map(
                                              (key, idx) => (
                                                <td
                                                  style={{
                                                    width:
                                                      ele?.subRow?.secondThead
                                                        ?.length > 0
                                                        ? ele?.subRow
                                                          ?.secondThead[idx]
                                                          ?.width
                                                        : "",
                                                  }}
                                                  key={idx}
                                                  data-title={
                                                    ele?.subRow?.secondThead ? (
                                                      ele?.subRow?.secondThead[idx]
                                                        ?.name ? (
                                                        ele?.subRow?.secondThead[
                                                          idx
                                                        ]?.name
                                                      ) : ele?.subRow?.secondThead[
                                                        idx
                                                      ] ? (
                                                        ele?.subRow?.secondThead[
                                                        idx
                                                        ]
                                                      ) : (
                                                        <>&nbsp;</>
                                                      )
                                                    ) : seondThead[idx]?.name ? (
                                                      seondThead[idx]?.name
                                                    ) : seondThead[idx] ? (
                                                      seondThead[idx]
                                                    ) : (
                                                      <>&nbsp;</>
                                                    )
                                                  }
                                                >
                                                  {subRowData[key]}{" "}
                                                  {isMobile && <>&nbsp;</>}{" "}
                                                </td>
                                              )
                                            )}
                                        </tr>
                                      )
                                    )
                                  ) : (
                                    <tr>
                                      <td
                                        colSpan={
                                          (ele?.subRow?.secondThead ??
                                            seondThead)?.length || 1
                                        }
                                        className="text-center"
                                      >
                                        {t("No matching records found") ||
                                          t("No matching records found")}
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </Table>
                            </td>
                          </tr>
                        )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </div>
      </div>

      {/* Set Filter popup — same shape as the old ASPX screen: a User dropdown and an
          Item checklist with a "Select" (select all) box, built from the rows already
          loaded for that one department. Filter applies client-side, no API call. */}
      <Modal
        visible={filterModal.show}
        setVisible={closeSetFilter}
        Header={t("Set Filter")}
        modalWidth="50vw"
        buttonName={t("Filter")}
        handleAPI={applySetFilter}
        CancelbuttonName={t("Cancel")}
      >
        <div style={{ padding: "4px 2px" }}>
          {/* User + Sub Dept side by side - same row the old ASPX screen used them in */}
          <div className="d-flex" style={{ gap: "16px", marginBottom: "14px" }}>
            <div style={{ flex: 1 }}>
              <label className="font-weight-bold mb-1 d-block">{t("User")}</label>
              <select
                className="form-control form-control-sm"
                value={draftUser}
                onChange={(e) => setDraftUser(e.target.value)}
              >
                <option value="">{t("All")}</option>
                {filterChoices.users.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="font-weight-bold mb-1 d-block">{t("Sub Dept")}</label>
              <select
                className="form-control form-control-sm"
                value={draftSubCat}
                onChange={(e) => setDraftSubCat(e.target.value)}
              >
                <option value="">{t("All")}</option>
                {filterChoices.subCats.map((sc) => (
                  <option key={sc} value={sc}>
                    {sc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className="form-check"
            style={{ borderBottom: "1px solid #e0e0e0", paddingBottom: "8px", marginBottom: "10px" }}
          >
            <input
              type="checkbox"
              className="form-check-input"
              id="setFilterSelectAll"
              checked={
                filterChoices.items.length > 0 &&
                draftItems.length === filterChoices.items.length
              }
              onChange={(e) =>
                setDraftItems(e.target.checked ? [...filterChoices.items] : [])
              }
            />
            <label className="font-weight-bold form-check-label" htmlFor="setFilterSelectAll">
              {t("Select")}
            </label>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              columnGap: "20px",
              rowGap: "6px",
              maxHeight: "260px",
              overflowY: "auto",
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
              padding: "10px",
            }}
          >
            {filterChoices.items.map((itemText) => (
              <div className="form-check" key={itemText} style={{ wordBreak: "break-word" }}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  id={`setFilterItem-${itemText}`}
                  checked={draftItems.includes(itemText)}
                  onChange={() => toggleDraftItem(itemText)}
                />
                <label
                  className="form-check-label"
                  htmlFor={`setFilterItem-${itemText}`}
                  style={{ fontSize: "13px" }}
                >
                  {itemText}
                </label>
              </div>
            ))}
            {filterChoices.items.length === 0 && (
              <div className="text-muted" style={{ gridColumn: "1 / -1" }}>
                {t("No items")}
              </div>
            )}
          </div>
        </div>
      </Modal>
      </>
    )
  );
}

export default NestedRowTable;


// import React, { useRef, useState } from "react";
// import Table from "react-bootstrap/Table";
// import { useTranslation } from "react-i18next";

// function NestedRowTable({
//   thead,
//   tbody,
//   isRemoveSecondHeader = false,
//   fs,
//   getRowClass,
//   style,
//   tableHeight,
//   scrollView,
//   getRowClick,
//   seondThead,
//   WWW,
//   SubtableClass,
//   handleSubRow,
//   zIndex,
//   removeHeaderSpace = false,
// }) {
//   console.log("tbody", tbody)
//   const isMobile = window.innerWidth <= 768;
//   const activeRowRef = useRef(null);
//   const { t } = useTranslation();
//   // Function to handle row click
//   const handleRowClick = (rowRef, rowColor, ele) => {
//     getRowClick && getRowClick(ele);
//     // Reset the previous active row style if it exists
//     if (activeRowRef.current) {
//       activeRowRef.current.style.backgroundColor = "";
//     }
//     // Set the new active row style
//     if (rowRef) {
//       rowRef.style.backgroundColor = "lightblue";
//       activeRowRef.current = rowRef;
//     }
//   };

//   return (
//     tbody?.length > 0 && (
//       <div
//         id="no-more-tables"
//         style={style}
//         className={`${tableHeight} ${scrollView} custom-scrollbar TabScroll`}
//       >
//         <div className="row">
//           <div className="col-12">
//             <Table className="mainTable pt-2 pl-2 pr-2" bordered>
//               <thead style={{ zIndex: zIndex || 1 }}>
//                 {/*  // zIndex is changed */}
//                 <tr>
//                   {thead?.map((headData, index) => (
//                     <th
//                       key={index}
//                       style={{
//                         width: headData?.width ? headData?.width : "",
//                         textAlign: headData?.textAlign
//                           ? headData?.textAlign
//                           : "",
//                       }}
//                       className="px-2"
//                     >
//                       {/* <span className="px-2"> */}
//                       {headData?.name ? headData?.name : headData}
//                       {removeHeaderSpace ? "" : <>&nbsp;</>}
//                       {/* &nbsp; */}
//                       {/* </span> */}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>

//               <tbody style={{ backgroundColor: "white" }}>
//                 {tbody?.map((ele, index) => {
//                   const keys = Object.keys(ele).filter(
//                     (key) => key !== "subRow" && key !== "colorcode"
//                   );
//                   // const keys = Object.keys(ele).filter(
//                   //   (key) => key !== "colorcode"
//                   // );

//                   const rowColor = ele.colorcode || ""; // Use colorcode if present
//                   return (
//                     <React.Fragment key={index}>
//                       <tr
//                         className={getRowClass ? getRowClass(ele, index) : ""}
//                         style={{ backgroundColor: rowColor }}
//                         onClick={(e) =>
//                           handleRowClick(e.currentTarget, rowColor, ele)
//                         }
//                       >
//                         {keys?.map((bodyData, inx) => (
//                           <td
//                             key={inx}
//                             data-title={
//                               thead[inx]?.name ? thead[inx]?.name : thead[inx]
//                             }
//                             style={{ width: WWW }}
//                             className="px-2"
//                           >
//                             {!Array.isArray(ele[bodyData]) &&
//                               ele[bodyData]?.label ? (
//                               ele[bodyData]?.label
//                             ) : !Array.isArray(ele[bodyData]) &&
//                               ele[bodyData] ? (
//                               ele[bodyData]
//                             ) : (
//                               <>&nbsp;</>
//                             )}
//                             {isMobile && <>&nbsp;</>}
//                           </td>
//                         ))}
//                       </tr>
//                       {/* Render the nested table if subRow exists */}
//                       {/* {console.log("ele?.subRow?.subRowList",ele)} */}
//                       {ele?.subRow?.isopen &&
//                         ele?.subRow?.subRowList?.length > 0 && (
//                           <tr>
//                             <td
//                               colSpan={thead?.length}
//                               className="nestedTableTD"
//                             >
//                               <Table
//                                 className={`nestedTable ${SubtableClass}`}
//                                 bordered
//                               >
//                                 {!isRemoveSecondHeader && (
//                                   <thead>
//                                     <tr>
//                                       {(
//                                         ele?.subRow?.secondThead ?? seondThead
//                                       )?.map((key, idx) => (
//                                         <th
//                                           key={idx}
//                                           id={index}
//                                           style={{
//                                             width: key?.width ? key?.width : "",
//                                             textAlign: key?.textAlign
//                                               ? key?.textAlign
//                                               : "",
//                                           }}
//                                         >
//                                           {key?.name ? key?.name : key} &nbsp;
//                                         </th>
//                                       ))}
//                                     </tr>
//                                   </thead>
//                                 )}
//                                 <tbody>
//                                   {/* {ele.subRow.map((subRowData, subIndex) => (
//                                   <tr key={subIndex}>
//                                     {seondThead.map((key, idx) => (
//                                       <td key={idx}>{key}</td>
//                                     ))}
//                                   </tr>
//                                 ))} */}
//                                   {ele?.subRow?.subRowList?.map(
//                                     (subRowData, subIndex) => (
//                                       <tr
//                                         key={subIndex}
//                                         className={`${handleSubRow &&
//                                           handleSubRow(
//                                             subRowData,
//                                             index,
//                                             subIndex
//                                           )
//                                           }`}
//                                       // style={{
//                                       //   background:
//                                       //     handleSubRow &&
//                                       //     handleSubRow(
//                                       //       subRowData,
//                                       //       index,
//                                       //       subIndex
//                                       //     ),
//                                       // }}
//                                       >
//                                         {Object.keys(subRowData).map(
//                                           (key, idx) => (
//                                             <td
//                                               style={{ width: ele?.subRow?.secondThead?.length > 0 ? ele?.subRow?.secondThead[idx]?.width : "" }}
//                                               key={idx}
//                                               data-title={
//                                                 ele?.subRow?.secondThead ? (
//                                                   ele?.subRow?.secondThead[idx]
//                                                     ?.name ? (
//                                                     ele?.subRow?.secondThead[
//                                                       idx
//                                                     ]?.name
//                                                   ) : ele?.subRow?.secondThead[
//                                                     idx
//                                                   ] ? (
//                                                     ele?.subRow?.secondThead[
//                                                     idx
//                                                     ]
//                                                   ) : (
//                                                     <>&nbsp;</>
//                                                   )
//                                                 ) : seondThead[idx]?.name ? (
//                                                   seondThead[idx]?.name
//                                                 ) : seondThead[idx] ? (
//                                                   seondThead[idx]
//                                                 ) : (
//                                                   <>&nbsp;</>
//                                                 )
//                                               }
//                                             >
//                                               {subRowData[key]}{" "}
//                                               {isMobile && <>&nbsp;</>}{" "}
//                                             </td>
//                                           )
//                                         )}
//                                       </tr>
//                                     )
//                                   )}
//                                 </tbody>
//                               </Table>
//                             </td>
//                           </tr>
//                         )}
//                     </React.Fragment>
//                   );
//                 })}
//               </tbody>
//             </Table>
//           </div>
//         </div>
//       </div>
//     )
//   );
// }

// export default NestedRowTable;
