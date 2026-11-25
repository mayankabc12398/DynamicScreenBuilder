// import React, { useEffect, useRef, useState } from "react";
// import Table from "react-bootstrap/Table";
// import {
//   SortSVGIcon,
//   IncreaseIngSortSVGIcon,
//   DecreaseIngSortSVGIcon,
// } from "../../../components/SvgIcons/index.jsx";
// import Input from "../../formComponent/Input.jsx";
// import { useTranslation } from "react-i18next";
// import Heading from "../Heading.jsx";
// import { Dropdown } from "react-bootstrap";
// import { Settings } from "lucide-react";

// function NewTables({
//   thead,
//   tbody,
//   secondThead,
//   getRowClass,
//   style,
//   tableHeight,
//   scrollView,
//   getRowClick,
//   handleClassOnRow,
//   handleDoubleClick,
//   isSearch,
//   notSingleClick = true,
//   title,
//   specificCellStyle,
// }) {
//   const [t] = useTranslation();
//   const [bodyData, setBodyData] = useState([]);
//   const [theadData, setTheadData] = useState([]);
//   const [search, setSearch] = useState("");

//   const activeRowRef = useRef(null);
//   const dropdownRef = useRef(null);
//   const buttonRef = useRef(null);

//   const isMobile = window.innerWidth <= 768;

//   /** ----------------------------------------
//    * 1️⃣ PREPARE HEADER
//    * Supports both:
//    * - flat headers: ["Name", "Age"]
//    * - grouped headers: [{ label:"OPD", children:[...] }]
//    ---------------------------------------- */
//   useEffect(() => {
//     if (Array.isArray(thead)) {
//       const formatted = thead.map((col) => {
//         if (typeof col === "string") {
//           return { label: col, isVisible: true };
//         }
//         return { ...col, isVisible: true };
//       });
//       setTheadData(formatted);
//     }
//   }, [thead]);

//   /** ----------------------------------------
//    * 2️⃣ PREPARE BODY
//    ---------------------------------------- */
//   useEffect(() => {
//     if (tbody) {
//       setBodyData(
//         tbody.map((r) => ({
//           ...r,
//           isVisible: true,
//         }))
//       );
//     }
//   }, [tbody]);

//   /** ----------------------------------------
//    * 3️⃣ FLATTEN HEADERS
//    * Required because table body is single row
//    ---------------------------------------- */
//   const flatHeader = theadData.flatMap((col) =>
//     col.children ? col.children : col
//   );

//   /** ----------------------------------------
//    * 4️⃣ SORT FUNCTION
//    ---------------------------------------- */
//   const handleSortTable = (field, type) => {
//     let sorted = [...bodyData];

//     sorted.sort((a, b) => {
//       const v1 = a[field];
//       const v2 = b[field];

//       if (type === "ASC") return v1 > v2 ? 1 : -1;
//       else return v1 < v2 ? 1 : -1;
//     });

//     setBodyData(sorted);
//   };

//   /** ----------------------------------------
//    * 5️⃣ SEARCH
//    ---------------------------------------- */
//   const handleItemSearch = (e) => {
//     const val = e.target.value.toLowerCase();
//     setSearch(val);

//     const filtered = tbody.filter((row) =>
//       Object.values(row).some(
//         (v) => typeof v === "string" && v.toLowerCase().includes(val)
//       )
//     );

//     setBodyData(filtered);
//   };

//   /** ----------------------------------------
//    * 6️⃣ ROW CLICK
//    ---------------------------------------- */
//   const handleRowClick = (rowRef, ele, index) => {
//     getRowClick && getRowClick(ele, index);

//     if (activeRowRef.current) {
//       const original = activeRowRef.current.getAttribute("data-original-color");
//       activeRowRef.current.style.backgroundColor = original;
//     }

//     if (rowRef) {
//       rowRef.setAttribute("data-original-color", rowRef.style.backgroundColor);
//       rowRef.style.backgroundColor = "lightblue";
//       activeRowRef.current = rowRef;
//     }
//   };

//   /** ----------------------------------------
//    * 7️⃣ COLUMN VISIBILITY TOGGLE
//    ---------------------------------------- */
//   const toggleColumn = (index) => {
//     const updated = [...theadData];
//     updated[index].isVisible = !updated[index].isVisible;
//     setTheadData(updated);
//   };

//   /** ----------------------------------------
//    * 8️⃣ CLOSE DROPDOWN ON OUTSIDE CLICK
//    ---------------------------------------- */
//   const [dropdownVisible, setDropdownVisible] = useState(false);

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(e.target) &&
//         buttonRef.current &&
//         !buttonRef.current.contains(e.target)
//       ) {
//         setDropdownVisible(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   /** ----------------------------------------
//    * RENDER COMPONENT
//    ---------------------------------------- */

//   return (
//     <>
//       {/* TITLE + COLUMN SETTINGS */}
//       {title && (
//         <Heading
//           title={title}
//           secondTitle={
//             <Dropdown show={dropdownVisible} ref={buttonRef}>
//               <Dropdown.Toggle bsPrefix="custom-toggle" className="p-0 mx-1">
//                 <Settings
//                   size={18}
//                   onClick={() => setDropdownVisible(!dropdownVisible)}
//                 />
//               </Dropdown.Toggle>

//               <Dropdown.Menu
//                 ref={dropdownRef}
//                 popperConfig={{ strategy: "fixed" }}
//               >
//                 {theadData.map((head, i) => (
//                   <Dropdown.Item key={i} as="div">
//                     <input
//                       type="checkbox"
//                       checked={head.isVisible}
//                       onChange={() => toggleColumn(i)}
//                     />
//                     &nbsp; {head.label}
//                   </Dropdown.Item>
//                 ))}
//               </Dropdown.Menu>
//             </Dropdown>
//           }
//         />
//       )}

//       {/* SEARCH */}
//       {isSearch && (
//         <Input
//           type="text"
//           className="table-input my-1"
//           placeholder={t("Search")}
//           onChange={handleItemSearch}
//         />
//       )}

//       {/* TABLE */}
//       <div
//         id="no-more-tables"
//         style={style}
//         className={`${tableHeight} ${scrollView} custom-scrollbar`}
//       >
//         <Table bordered className="mainTable pt-2">
//           {/* --------------------- HEADER ---------------------- */}
//           <thead>
//             {/* FIRST ROW */}
//             <tr>
//               {theadData
//                 .filter((h) => h.isVisible)
//                 .map((h, index) => {
//                   if (!h.children) {
//                     return (
//                       <th key={index} rowSpan={2}>
//                         {h.label}
//                       </th>
//                     );
//                   }
//                   return (
//                     <th key={index} colSpan={h.children.length}>
//                       {h.label}
//                     </th>
//                   );
//                 })}
//             </tr>
//             {/* SECOND ROW = CHILD LABELS + INPUTS */}
//             <tr>
//               {theadData
//                 .filter((h) => h.isVisible)
//                 .flatMap((h) =>
//                   h.children
//                     ? h.children.map((child, index) => (
//                         <th
//                           key={`${h.label}-${index}`}
//                           style={{ textAlign: "center" }}
//                         >
//                           <div
//                             style={{ display: "flex", flexDirection: "column" }}
//                           >
//                             <span style={{ fontWeight: "600" }}>
//                               {child.label}
//                             </span>

//                             {/* {child.input ? (
//                               child.input
//                             ) : (
//                               <input
//                               className="table-input"
//                               handleChange={(e) => handleCustomInputData(child.name, e.target.value)}

//                                 type="text"
//                                 style={{
//                                   marginTop: "4px",
//                                   width: "90%",
//                                   height: "22px",
//                                   fontSize: "12px",
//                                   padding: "2px 4px",
//                                 }}
//                               />
                              
//                             )} */}
//                             {child.element ? child.element : null}
//                           </div>
//                         </th>
//                       ))
//                     : null
//                 )}
//             </tr>
//           </thead>

//           {/* --------------------- BODY ---------------------- */}
//           <tbody>
//   {bodyData.map((ele, rowIndex) => {
//     const rowColor = ele.colorcode ?? "";

//     return (
//       <>
//       {/* <tr
//         key={rowIndex}
//         style={{ backgroundColor: rowColor }}
//         className={getRowClass ? getRowClass(ele, rowIndex) : ""}
//         onClick={(e) =>
//           notSingleClick
//             ? handleRowClick(e.currentTarget, ele, rowIndex)
//             : undefined
//         }
//         onDoubleClick={() => handleDoubleClick && handleDoubleClick(ele, rowIndex)}
//       >
//         {flatHeader
//           .filter((h, idx) => {
//             const parent = theadData.find((p) =>
//               p.children?.includes(h)
//             );
//             return parent ? parent.isVisible : true;
//           })
//           .map((h, colIndex) => {
//             const keys = Object.keys(ele);
//             const key = keys[colIndex];

//             return (
//               <td key={colIndex}>
//                 {ele[key] || <>&nbsp;</>}
//                 {isMobile && <>&nbsp;</>}
//               </td>
//             );
//           })}


      
//       </tr> */}

//        {/* MAIN ROW */}
//         <tr
//           key={rowIndex}
//           style={{ backgroundColor: rowColor }}
//           className={getRowClass ? getRowClass(ele, rowIndex) : ""}
//           onClick={(e) =>
//             notSingleClick
//               ? handleRowClick(e.currentTarget, ele, rowIndex)
//               : undefined
//           }
//           onDoubleClick={() =>
//             handleDoubleClick && handleDoubleClick(ele, rowIndex)
//           }
//         >
//           {flatHeader
//             .filter((h) => {
//               const parent = theadData.find((p) =>
//                 p.children?.includes(h)
//               );
//               return parent ? parent.isVisible : true;
//             })
//             .map((h, colIndex) => {
//               const keys = Object.keys(ele);
//               const key = keys[colIndex];

//               return (
//                 <td key={colIndex}>
//                   {ele[key] || <>&nbsp;</>}
//                 </td>
//               );
//             })}
//         </tr>

// {/* {console.log('secondThead' , ele?.subRow)} */}
//         {/* { (ele?.subRow?.isopen && ele?.subRow?.subRowList?.length > 0) && ( */}
//                                   {/* {ele?.subRow?.isopen && (
//   <tr>
//     <td colSpan={flatHeader.length} className="nestedTableTD">
//       <Table bordered className="nestedTable">
//         <thead>
//           <tr>
//             {ele?.subRow?.secondThead?.map((th, idx) => (
//               <th key={idx}>{th.name}</th>
//             ))}
//           </tr>
//         </thead>

//         <tbody>
//           {ele?.subRow?.subRowList?.map((sub, sidx) => (
//             <tr key={sidx}>
//               {ele?.subRow?.secondThead?.map((th, tIdx) => (
//                 <td key={tIdx}>{sub[th.name]}</td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </Table>
//     </td>
//   </tr>
// )} */}


//                               {/* )} */}
//       </>

//     );
//   })}
// </tbody>
//         </Table>
//       </div>
//     </>
//   );
// }

// export default NewTables;


import React, { useEffect, useRef, useState } from "react";
import Table from "react-bootstrap/Table";
import {
  SortSVGIcon,
  IncreaseIngSortSVGIcon,
  DecreaseIngSortSVGIcon,
} from "../../../components/SvgIcons/index.jsx";
import Input from "../../formComponent/Input.jsx";
import { useTranslation } from "react-i18next";
import Heading from "../Heading.jsx";
import { Dropdown } from "react-bootstrap";
import { Settings } from "lucide-react";

function NewTables({
  thead,
  tbody,
  secondThead,
  getRowClass,
  style,
  tableHeight,
  scrollView,
  getRowClick,
  handleClassOnRow,
  handleDoubleClick,
  isSearch,
  notSingleClick = true,
  title,
  specificCellStyle,
}) {
  const [t] = useTranslation();
  const [bodyData, setBodyData] = useState([]);
  const [theadData, setTheadData] = useState([]);
  const [search, setSearch] = useState("");

  const activeRowRef = useRef(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const isMobile = window.innerWidth <= 768;

  /** ----------------------------------------
   * 1️⃣ PREPARE HEADER
   * Supports both:
   * - flat headers: ["Name", "Age"]
   * - grouped headers: [{ label:"OPD", children:[...] }]
   ---------------------------------------- */
  useEffect(() => {
    if (Array.isArray(thead)) {
      const formatted = thead.map((col) => {
        if (typeof col === "string") {
          return { label: col, isVisible: true };
        }
        return { ...col, isVisible: true };
      });
      setTheadData(formatted);
    }
  }, [thead]);

  /** ----------------------------------------
   * 2️⃣ PREPARE BODY
   ---------------------------------------- */
  useEffect(() => {
    if (tbody) {
      setBodyData(
        tbody.map((r) => ({
          ...r,
          isVisible: true,
        }))
      );
    }
  }, [tbody]);

  /** ----------------------------------------
   * 3️⃣ FLATTEN HEADERS
   * Required because table body is single row
   ---------------------------------------- */
  const flatHeader = theadData.flatMap((col) =>
    col.children ? col.children : col
  );

  /** ----------------------------------------
   * 4️⃣ SORT FUNCTION
   ---------------------------------------- */
  const handleSortTable = (field, type) => {
    let sorted = [...bodyData];

    sorted.sort((a, b) => {
      const v1 = a[field];
      const v2 = b[field];

      if (type === "ASC") return v1 > v2 ? 1 : -1;
      else return v1 < v2 ? 1 : -1;
    });

    setBodyData(sorted);
  };

  /** ----------------------------------------
   * 5️⃣ SEARCH
   ---------------------------------------- */
  const handleItemSearch = (e) => {
    const val = e.target.value.toLowerCase();
    setSearch(val);

    const filtered = tbody.filter((row) =>
      Object.values(row).some(
        (v) => typeof v === "string" && v.toLowerCase().includes(val)
      )
    );

    setBodyData(filtered);
  };

  /** ----------------------------------------
   * 6️⃣ ROW CLICK
   ---------------------------------------- */
  const handleRowClick = (rowRef, ele, index) => {
    getRowClick && getRowClick(ele, index);

    if (activeRowRef.current) {
      const original = activeRowRef.current.getAttribute("data-original-color");
      activeRowRef.current.style.backgroundColor = original;
    }

    if (rowRef) {
      rowRef.setAttribute("data-original-color", rowRef.style.backgroundColor);
      rowRef.style.backgroundColor = "lightblue";
      activeRowRef.current = rowRef;
    }
  };

  /** ----------------------------------------
   * 7️⃣ COLUMN VISIBILITY TOGGLE
   ---------------------------------------- */
  const toggleColumn = (index) => {
    const updated = [...theadData];
    updated[index].isVisible = !updated[index].isVisible;
    setTheadData(updated);
  };

  /** ----------------------------------------
   * 8️⃣ CLOSE DROPDOWN ON OUTSIDE CLICK
   ---------------------------------------- */
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /** ----------------------------------------
   * RENDER COMPONENT
   ---------------------------------------- */

  return (
    <>
      <style jsx>{`
        /* Mobile Responsive Styles */
        @media only screen and (max-width: 768px) {
          #no-more-tables table,
          #no-more-tables thead,
          #no-more-tables tbody,
          #no-more-tables th,
          #no-more-tables td,
          #no-more-tables tr {
            display: block;
          }

          #no-more-tables thead tr {
            position: absolute;
            top: -9999px;
            left: -9999px;
          }

          #no-more-tables tr {
            margin-bottom: 15px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }

          #no-more-tables td {
            border: none;
            border-bottom: 1px solid #eee;
            position: relative;
            padding-left: 50%;
            white-space: normal;
            text-align: left;
          }

          #no-more-tables td:before {
            position: absolute;
            top: 6px;
            left: 6px;
            width: 45%;
            padding-right: 10px;
            white-space: nowrap;
            text-align: left;
            font-weight: bold;
            content: attr(data-title);
          }

          .nestedTable {
            margin-top: 10px;
          }

          .nestedTableTD {
            padding: 0 !important;
          }
        }

        /* Tablet Responsive Styles */
        @media only screen and (min-width: 769px) and (max-width: 1024px) {
          #no-more-tables {
            overflow-x: auto;
          }

          #no-more-tables table {
            min-width: 100%;
            font-size: 14px;
          }

          #no-more-tables th,
          #no-more-tables td {
            padding: 8px;
          }
        }

        /* Desktop - ensure horizontal scroll if needed */
        @media only screen and (min-width: 1025px) {
          #no-more-tables {
            overflow-x: auto;
          }
        }

        /* General responsive utilities */
        .table-responsive-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>

      {/* TITLE + COLUMN SETTINGS */}
      {title && (
        <Heading
          title={title}
          secondTitle={
            <Dropdown show={dropdownVisible} ref={buttonRef}>
              <Dropdown.Toggle bsPrefix="custom-toggle" className="p-0 mx-1">
                <Settings
                  size={18}
                  onClick={() => setDropdownVisible(!dropdownVisible)}
                />
              </Dropdown.Toggle>

              <Dropdown.Menu
                ref={dropdownRef}
                popperConfig={{ strategy: "fixed" }}
              >
                {theadData.map((head, i) => (
                  <Dropdown.Item key={i} as="div">
                    <input
                      type="checkbox"
                      checked={head.isVisible}
                      onChange={() => toggleColumn(i)}
                    />
                    &nbsp; {head.label}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          }
        />
      )}

      {/* SEARCH */}
      {isSearch && (
        <Input
          type="text"
          className="table-input my-1"
          placeholder={t("Search")}
          onChange={handleItemSearch}
        />
      )}

      {/* TABLE */}
      <div
        id="no-more-tables"
        style={style}
        className={`${tableHeight} ${scrollView} custom-scrollbar table-responsive-wrapper`}
      >
        <Table bordered className="mainTable pt-2">
          {/* --------------------- HEADER ---------------------- */}
          <thead>
            {/* FIRST ROW */}
            <tr>
              {theadData
                .filter((h) => h.isVisible)
                .map((h, index) => {
                  if (!h.children) {
                    return (
                      <th key={index} rowSpan={2}>
                        {h.label}
                      </th>
                    );
                  }
                  return (
                    <th key={index} colSpan={h.children.length}>
                      {h.label}
                    </th>
                  );
                })}
            </tr>
            {/* SECOND ROW = CHILD LABELS + INPUTS */}
            <tr>
              {theadData
                .filter((h) => h.isVisible)
                .flatMap((h) =>
                  h.children
                    ? h.children.map((child, index) => (
                        <th
                          key={`${h.label}-${index}`}
                          style={{ textAlign: "center" }}
                        >
                          <div
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            <span style={{ fontWeight: "600" }}>
                              {child.label}
                            </span>

                            {/* {child.input ? (
                              child.input
                            ) : (
                              <input
                              className="table-input"
                              handleChange={(e) => handleCustomInputData(child.name, e.target.value)}

                                type="text"
                                style={{
                                  marginTop: "4px",
                                  width: "90%",
                                  height: "22px",
                                  fontSize: "12px",
                                  padding: "2px 4px",
                                }}
                              />
                              
                            )} */}
                            {child.element ? child.element : null}
                          </div>
                        </th>
                      ))
                    : null
                )}
            </tr>
          </thead>

          {/* --------------------- BODY ---------------------- */}
          <tbody>
  {bodyData.map((ele, rowIndex) => {
    const rowColor = ele.colorcode ?? "";

    return (
      <>
      {/* <tr
        key={rowIndex}
        style={{ backgroundColor: rowColor }}
        className={getRowClass ? getRowClass(ele, rowIndex) : ""}
        onClick={(e) =>
          notSingleClick
            ? handleRowClick(e.currentTarget, ele, rowIndex)
            : undefined
        }
        onDoubleClick={() => handleDoubleClick && handleDoubleClick(ele, rowIndex)}
      >
        {flatHeader
          .filter((h, idx) => {
            const parent = theadData.find((p) =>
              p.children?.includes(h)
            );
            return parent ? parent.isVisible : true;
          })
          .map((h, colIndex) => {
            const keys = Object.keys(ele);
            const key = keys[colIndex];

            return (
              <td key={colIndex}>
                {ele[key] || <>&nbsp;</>}
                {isMobile && <>&nbsp;</>}
              </td>
            );
          })}


      
      </tr> */}

       {/* MAIN ROW */}
        <tr
          key={rowIndex}
          style={{ backgroundColor: rowColor }}
          className={getRowClass ? getRowClass(ele, rowIndex) : ""}
          onClick={(e) =>
            notSingleClick
              ? handleRowClick(e.currentTarget, ele, rowIndex)
              : undefined
          }
          onDoubleClick={() =>
            handleDoubleClick && handleDoubleClick(ele, rowIndex)
          }
        >
          {flatHeader
            .filter((h) => {
              const parent = theadData.find((p) =>
                p.children?.includes(h)
              );
              return parent ? parent.isVisible : true;
            })
            .map((h, colIndex) => {
              const keys = Object.keys(ele);
              const key = keys[colIndex];

              return (
                <td 
                  key={colIndex}
                  data-title={h.label || `Column ${colIndex + 1}`}
                >
                  {ele[key] || <>&nbsp;</>}
                </td>
              );
            })}
        </tr>

{/* {console.log('secondThead' , ele?.subRow)} */}
        {/* { (ele?.subRow?.isopen && ele?.subRow?.subRowList?.length > 0) && ( */}
                                  {/* {ele?.subRow?.isopen && (
  <tr>
    <td colSpan={flatHeader.length} className="nestedTableTD">
      <Table bordered className="nestedTable">
        <thead>
          <tr>
            {ele?.subRow?.secondThead?.map((th, idx) => (
              <th key={idx}>{th.name}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {ele?.subRow?.subRowList?.map((sub, sidx) => (
            <tr key={sidx}>
              {ele?.subRow?.secondThead?.map((th, tIdx) => (
                <td key={tIdx}>{sub[th.name]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </td>
  </tr>
)} */}


                              {/* )} */}
      </>

    );
  })}
</tbody>
        </Table>
      </div>
    </>
  );
}

export default NewTables;