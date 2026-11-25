import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import NestedRowTable from "../NestedRowTable";
import { ReprintSVG } from "../../../SvgIcons";
import { RedirectURL } from "../../../../networkServices/PDFURL";
import {
  NursingRejectIndent,
  PrintRequisition,
  ViewIndent,
} from "../../../../networkServices/InventoryApi";
import { notify } from "../../../../utils/utils";
import { BillingIPDIssueIndentAccept } from "../../../../networkServices/pharmecy";
// SRSSAIH-2026-0061 Point 7 Slice F — renders nothing unless the flag is on
import {
  usePharmacySubstitutionLog,
  SubstitutionNote,
} from "../../../commonComponents/PharmacySubstitutionNote";
import Modal from "../../../modalComponent/Modal";
import { GetGlobalResources } from "../../../../networkServices/opdserviceAPI";

const ViewReqTable = ({
  tbody,
  tableHeight,
  payload,
  Tid,
  handleCallViewMedReq,
}) => {
  const [t] = useTranslation();
  // Nursing reject (Medicine Issue): whole indent when itemID is null, else one item.
  const [rejectModal, setRejectModal] = useState({
    visible: false,
    indentNo: "",
    itemID: null,
    label: "",
  });
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  // Backend switch (fin_global_resources.IsNursingIndentRejectAllowed); off unless a client enables it.
  const [rejectAllowed, setRejectAllowed] = useState(false);
  const isMI = payload?.Type === "MI";
  const isMR = payload?.Type === "MR";
  const showReject = (isMI || isMR) && rejectAllowed;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const resp = await GetGlobalResources();
        const row = resp?.data?.find((r) => r?.Name === "IsNursingIndentRejectAllowed");
        if (active) setRejectAllowed(String(row?.Value) === "1");
      } catch (e) {
        if (active) setRejectAllowed(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  const [bodyData, setBodyData] = useState([]);
  const [internalTbody, setInternalTbody] = useState([]); // Local state for table data
  const [checkedItems, setCheckedItems] = useState({});
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isAnyRowOpen, setIsAnyRowOpen] = useState(false);

  /* SRSSAIH-2026-0061 P7F — what the pharmacy actually handed over against this stay.
     `Tid` is the admission's TransactionID, the narrowest key available here: a patient
     readmitted later must not see an old stay's substitutions on this list. */
  const { lookup: substitutionFor } = usePharmacySubstitutionLog({
    transactionID: Tid,
  });
console.log("checkedItems",checkedItems)
console.log("isAllSelected",isAllSelected)
  useEffect(() => {
    setInternalTbody(
      tbody?.map((row) => ({ ...row, isopen:false }))
    );
    setCheckedItems({});
  }, [tbody]);

  const thead = [
    { name: t("SNo"), width: "1%" },
    { name: t("Requisition Date"), width: "10%" },
    t("Requisition No"),
    t("Requisition Type"),
    t("Department From"),
    t("Department To"),
    t("RaisedBy"),
    { name: t("Print"), width: "1%" },
    { name: t("View"), width: "1%" },
    ...(showReject ? [{ name: t("Reject"), width: "1%" }] : []),
  ];

  // Header for tables WITHOUT checkboxes
  const seondThead = [
    { name: t("SNo"), width: "1%" },
    t("Department From"),
    t("DepartmentTo"),
    { name: "Item Name", width: "1%" },
    { name: "Unit Type", width: "1%" },
    { name: t("Requested Qty"), width: "1%" },
    { name: t("Received Qty"), width: "1%" },
    { name: t("Pending Qty"), width: "1%" },
    { name: t("Rejected Qty"), width: "1%" },
    { name: "Narration", width: "1%" },
    { name: "Date", width: "1%" },
  ];

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    const newCheckedItems = {};
    if (isChecked) {
      internalTbody.forEach((row, parentIndex) => {
        if (row.isopen && row.SecondBodyDataList) {
          row.SecondBodyDataList.forEach((_, childIndex) => {
            const uniqueId = `${parentIndex}-${childIndex}`;
            newCheckedItems[uniqueId] = true;
          });
        }
      });
    }
    setCheckedItems(newCheckedItems);
  };

  // Header for tables WITH checkboxes (now only for "MI")
  const thirdThead = [
    {
      name: ("Select"
        // <input
        //   type="checkbox"
        //   checked={isAllSelected}
        //   onChange={handleSelectAll}
        //   disabled={!isAnyRowOpen} // Disable if no rows are open
        // />
      ),
      width: "1%",
    },
    { name: t("S.No."), width: "1%" },
    { name: t("Department From"), width: "15%" },
    t("Item Name"),
    { name: t("Substitute Item"), width: "15%" },
    { name: t("Substitute Qty"), width: "15%" },
    { name: t("AvailQty"), width: "15%" },
    { name: t("RequestedQty"), width: "15%" },
    { name: t("ReceiveQty"), width: "15%" },
    { name: t("PendingQty"), width: "15%" },
    { name: t("RejectQty"), width: "15%" },
    { name: t("ApprovedBy"), width: "15%" },
    { name: t("AcknowledgmentBy"), width: "15%" },
    { name: t("Acknowledgment Date"), width: "15%" },
    { name: t("IssueAcceptingBy"), width: "15%" },
   
    { name: "Narration", width: "15%" },
    { name: "Date", width: "15%" },
    ...(showReject ? [{ name: t("Reject"), width: "1%" }] : []),
  ];

  /* On a substituted line the screen shows the item the ward asked for under Item Name,
     and what the pharmacy actually sent in its own two columns beside it.

     A line can go out part one and part the other - 6 of the requested item and 4 of a
     stand-in against a request for 10. MainIssuedQty carries the requested item's share
     and SubstituteItemQty the stand-in's, so that split is named on the row rather than
     left to be worked out from Receive Qty.

     Read in either casing - these come back through a DataTable, which the serializer
     camel cases, while other rows on this screen arrive as written. */
  const pick = (item, key) => item?.[key[0].toLowerCase() + key.slice(1)] ?? item?.[key];

  const isSubstituted = (item) =>
    Number(pick(item, "IsSubtitute") ?? 0) === 1 &&
    (pick(item, "SubstituteIssuedName") ?? "") !== "";

  const substituteNameCell = (item) => {
    if (!isSubstituted(item)) return "";
    const mainQty = Number(pick(item, "MainIssuedQty") ?? 0);
    return (
      <span className="text-warning">
        {pick(item, "SubstituteIssuedName")}
        {mainQty > 0 ? (
          <small className="d-block" style={{ fontSize: "0.65rem", lineHeight: 1.1 }}>
            {t("Partly issued")} — {mainQty} {t("as")} {item?.itemName}
          </small>
        ) : null}
      </span>
    );
  };

  const substituteQtyCell = (item) => {
    if (!isSubstituted(item)) return "";
    const subQty = Number(pick(item, "SubstituteItemQty") ?? 0);
    const mainQty = Number(pick(item, "MainIssuedQty") ?? 0);
    return (
      <div
        className="text-right text-warning"
        title={
          mainQty > 0
            ? `${subQty} ${t("as")} ${pick(item, "SubstituteIssuedName")}, ${mainQty} ${t("as")} ${item?.itemName}`
            : `${subQty} ${t("as")} ${pick(item, "SubstituteIssuedName")}`
        }
      >
        {subQty}
      </div>
    );
  };

  const ISSUED_MSG =
    "Medicine is already issued against this indent, so nursing cannot reject it.";

  // Pre-check what is already on screen; the server enforces the same rule.
  const requestReject = (indentNo, item, parentIndex) => {
    if (item) {
      if (Number(item?.receiveQty) > 0) {
        notify(
          `"${item?.itemName}" is already issued against this indent, so it cannot be rejected.`,
          "warn",
        );
        return;
      }
    } else {
      const loaded = internalTbody?.[parentIndex]?.SecondBodyDataList;
      const status = internalTbody?.[parentIndex]?.StatusNew;
      if (
        (status && status !== "Open") ||
        loaded?.some((i) => Number(i?.receiveQty) > 0)
      ) {
        notify(ISSUED_MSG, "warn");
        return;
      }
    }
    setRejectReason("");
    setRejectModal({
      visible: true,
      indentNo,
      itemID: item ? item?.itemID : null,
      label: item ? item?.itemName : indentNo,
    });
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      notify("Please enter reject reason", "error");
      return;
    }
    setRejecting(true);
    try {
      const response = await NursingRejectIndent(
        rejectModal.indentNo,
        rejectModal.itemID,
        rejectReason.trim(),
      );
      if (response?.success) {
        notify(response?.message, "success");
        setRejectModal((v) => ({ ...v, visible: false }));
        handleCallViewMedReq?.("Open", payload?.Type);
      } else {
        notify(response?.message || ISSUED_MSG, "error");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setRejecting(false);
    }
  };

  const handleCheckboxChange = (uniqueId) => {
    setCheckedItems((prev) => ({ ...prev, [uniqueId]: !prev[uniqueId] }));
  };

  const handleSave = async () => {
    const selectedData = [];
    internalTbody.forEach((val, index) => {
      val.SecondBodyDataList?.forEach((item, i) => {
        if (checkedItems[`${index}-${i}`]) {
          selectedData.push({
            indentNo: item?.indentNo,
            itemID: item?.itemID,
          });
        }
      });
    });

    console.log("selectedData", selectedData);
    if (selectedData.length <= 0) {
      notify(t("Please Select atleast one item"), "warn");
      return;
    }
    debugger
    const response = await BillingIPDIssueIndentAccept(selectedData);

    if (response?.success) {
      notify(response?.message, "success");
      handleClickEdit("", "", false)
      // TODO: Add logic to refetch or update the UI after a successful save
    } else {
      notify(response?.message, "error");
    }
  };

  const handleClickEdit = async (val, index, isopen) => {
    debugger
    const updatedTbody = [...internalTbody];
    const currentItem = updatedTbody[index];

    if (!isopen && !currentItem.SecondBodyDataList) {
      const IndentNo = val?.IndentNo;
      const Status = val?.StatusNew ? val?.StatusNew : "Open";
      const Type = payload?.Type;
      const TID = Tid;
      const apiResp = await ViewIndent(IndentNo, Status, Type, TID);

      if (apiResp?.success) {
        currentItem.SecondBodyDataList = apiResp?.data?.dtnew;
      } else {
        notify(apiResp?.message, "error");
      }
    }

    currentItem.isopen = !isopen;
    setInternalTbody(updatedTbody);
  };

  const handleClickReport = async (val) => {
    const IndentNo = val?.IndentNo;
    const Status = val?.StatusNew ? val?.StatusNew : "Open";
    const Type = payload?.Type;
    let apiResp = await PrintRequisition(IndentNo, Status, Type);
    if (apiResp?.success) {
      RedirectURL(apiResp?.data?.pdfUrl);
    } else {
      notify(apiResp?.message, "error");
    }
  };

  const getRowClass = (val, index) => {
    if (!internalTbody || !internalTbody[index]) {
      return "";
    }
    const status = internalTbody[index]?.StatusNew;
    switch (status) {
      case "Open": return "md-record-RequisitionDone";
      case "Closed": return "md-record-PendingRequisition";
      case "Reject": return "md-record-Completed";
      case "Partial": return "md-record-Running";
      default: return "";
    }
  };

  useEffect(() => {
    const bindBodyData = () => {
      let list = [];
      internalTbody?.forEach((val, index) => {
        let secondTbody = [];
        if (val.isopen && val.SecondBodyDataList) {
          val.SecondBodyDataList.forEach((item, i) => {
            const uniqueId = `${index}-${i}`;
            let obj;
            // CORRECTED: Checkbox view is now ONLY for "MI" type
            if (payload?.Type === "MI") {
              debugger
              obj = {
                check: (
                  // val?.issueAccepting ?
                  Number(item?.receiveQty)> 0 ?
   <input
                    type="checkbox"
                    checked={!!checkedItems[uniqueId]}
                    onChange={() => handleCheckboxChange(uniqueId)}
                  />
                  : ""
              
                ),
                sno: i + 1,
                deptFrom: item?.deptFrom,
                /* P7F — the nurse asked for this medicine. If something else was
                   dispensed, say so here; without it the list reads as though the request
                   was fulfilled exactly as written. */
                itemName: (
                  <span>
                    {item?.itemName}
                    <SubstitutionNote
                      entry={substitutionFor(
                        item?.indentNo || val?.IndentNo,
                        item?.itemID,
                      )}
                    />
                  </span>
                ),
                substituteIssuedName: substituteNameCell(item),
                substituteItemQty: substituteQtyCell(item),
                availQty: item?.availQty,
                reqQty: <div className="text-right">{item?.reqQty}</div>,
              
                receiveQty: item?.receiveQty,
                pendingQty: item?.pendingQty,
                rejectQty: item?.rejectQty,
                approvedBy: item?.approvedBy,
                acknowledgmentBy: item?.acknowledgmentBy,
                acknowledgmentDate: item?.acknowledgmentDate,
                issueAcceptingBy: item?.issueAcceptingBy,
                narration: item?.narration,
                DATE: item?.date,
                reject:
                  Number(item?.rejectQty) >= Number(item?.reqQty) &&
                  Number(item?.reqQty) > 0 ? (
                    <span className="text-danger">{t("Rejected")}</span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      style={{
                        padding: "0 6px",
                        opacity: Number(item?.receiveQty) > 0 ? 0.5 : 1,
                      }}
                      title={
                        Number(item?.receiveQty) > 0
                          ? "Already issued - cannot reject"
                          : t("Reject")
                      }
                      onClick={() => requestReject(item?.indentNo, item, index)}
                    >
                      {t("Reject")}
                    </button>
                  ),
              };
            } else {
              // All other types get the detailed, non-checkbox view
              obj = {
                sno: i + 1,
                deptFrom: item?.deptFrom,
                deptTo: item?.deptTo,
                itemName: (
                  <span>
                    {item?.itemName}
                    <SubstitutionNote
                      entry={substitutionFor(
                        item?.indentNo || val?.IndentNo,
                        item?.itemID,
                      )}
                    />
                  </span>
                ),
                unitType: item?.unitType,
                reqQty: item?.reqQty,
                receiveQty: item?.receiveQty,
                pendingQty: item?.pendingQty,
                rejectQty: item?.rejectQty,
                Narration: item?.narration,
                DATE: item?.date,
              };
            }
            if (!showReject) delete obj.reject;
            secondTbody.push(obj);
          });
        }
        let obj = {
          sno: index + 1,
          dtentry: val?.dtentry,
          IndentNo: val?.IndentNo,
          RequisitionType: val?.RequisitionType || "-",
          Deptfrom: val?.Deptfrom,
          DeptTo: val?.DeptTo,
          EmpName: val?.EmpName,
          print: (<span onClick={() => handleClickReport(val)}> <ReprintSVG /> </span>),
          index: (
            <span onClick={() => handleClickEdit(val, index, val.isopen)}>
              {val.isopen ? (<i className="fa fa-minus" aria-hidden="true"></i>)
                           : (<i className="fa fa-plus" aria-hidden="true"></i>)}
            </span>
          ),
          ...(showReject
            ? {
                reject:
                  val?.StatusNew === "Reject" ? (
                    <span className="text-danger">{t("Rejected")}</span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      style={{
                        padding: "0 6px",
                        opacity: val?.StatusNew === "Open" ? 1 : 0.5,
                      }}
                      title={
                        val?.StatusNew === "Open"
                          ? t("Reject Indent")
                          : "Already issued - cannot reject"
                      }
                      onClick={() => requestReject(val?.IndentNo, null, index)}
                    >
                      {t("Reject")}
                    </button>
                  ),
              }
            : {}),
          subRow: { subRowList: secondTbody, isopen: val.isopen },
        };
        list.push(obj);
      });
      setBodyData(list);
    };

    bindBodyData();

    // Update derived states
    const anyOpen = internalTbody.some(row => row.isopen);
    setIsAnyRowOpen(anyOpen);

    const allVisibleItems = [];
    if (payload?.Type === "MI") {
        internalTbody.forEach((row, parentIndex) => {
            if (row.isopen && row.SecondBodyDataList) {
                row.SecondBodyDataList.forEach((_, childIndex) => {
                    allVisibleItems.push(`${parentIndex}-${childIndex}`);
                });
            }
        });
    }

    const allChecked = allVisibleItems.length > 0 && allVisibleItems.every(id => checkedItems[id]);
    setIsAllSelected(allChecked);

    // `substitutionFor` is in the list because the log is fetched asynchronously: it
    // arrives after the first render, and without it these rows would have been built once
    // against an empty log and the notes would never appear.
  }, [internalTbody, checkedItems, payload?.Type, substitutionFor, rejectAllowed]); // Rerun when these dependencies change

  return (
    <>
      <NestedRowTable
        thead={thead}
        // CORRECTED: Use thirdThead (with checkbox) only for "MI" type
        seondThead={payload?.Type === "MI" ? thirdThead : seondThead}
        tbody={bodyData}
        tableHeight={tableHeight}
        getRowClass={getRowClass}
        scrollView={"scrollView"}
      />
      {rejectModal.visible && (
        <Modal
          visible={rejectModal.visible}
          Header={
            rejectModal.itemID
              ? `${t("Reject Item")}: ${rejectModal.label}`
              : `${t("Reject Indent")}: ${rejectModal.label}`
          }
          modalWidth="30vw"
          setVisible={() => setRejectModal((v) => ({ ...v, visible: false }))}
          footer={
            <>
              <button
                className="btn btn-sm btn-danger mx-1"
                onClick={confirmReject}
                disabled={rejecting}
              >
                {t("Reject")}
              </button>
              <button
                className="btn btn-sm btn-secondary mx-1"
                onClick={() => setRejectModal((v) => ({ ...v, visible: false }))}
              >
                {t("Close")}
              </button>
            </>
          }
        >
          <div className="p-2">
            <small className="d-block mb-1 text-muted">
              Only an indent with no medicine issued against it can be rejected.
            </small>
            <textarea
              className="form-control"
              rows={3}
              maxLength={200}
              placeholder={t("Reject Reason")}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        </Modal>
      )}
      {/* CORRECTED: Show Save button only for "MI" type when a row is open */}
      {payload?.Type === "MI" && isAnyRowOpen && Object.values(checkedItems).some(Boolean) && (
        <div style={{ textAlign: "right", padding: "10px" }}>
          <button className="btn btn-primary" onClick={handleSave}>
            {t("Save")}
          </button>
        </div>
      )}
    </>
  );
};

export default ViewReqTable;




// import React, { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import NestedRowTable from "../NestedRowTable";
// import { ReprintSVG } from "../../../SvgIcons";
// import { RedirectURL } from "../../../../networkServices/PDFURL";
// import {
//   PrintRequisition,
//   ViewIndent,
// } from "../../../../networkServices/InventoryApi";
// import { notify } from "../../../../utils/utils";
// import { BillingIPDIssueIndentAccept } from "../../../../networkServices/pharmecy";

// const ViewReqTable = ({ tbody, tableHeight, payload, Tid }) => {
//   const [t] = useTranslation();
//   const [bodyData, setBodyData] = useState([]);
//   const [internalTbody, setInternalTbody] = useState([]); // Local state for table data
//   const [checkedItems, setCheckedItems] = useState({});
//   const [isAllSelected, setIsAllSelected] = useState(false);
//   const [isAnyRowOpen, setIsAnyRowOpen] = useState(false);

//   // Initialize internal state when the tbody prop changes
//   useEffect(() => {
//     // We add the 'isopen' property here if it doesn't exist to manage the toggle state locally
//     setInternalTbody(
//       tbody.map((row) => ({ ...row, isopen: !!row.isopen }))
//     );
//     // When tbody changes, reset selections
//     setCheckedItems({});
//   }, [tbody]);

//   const thead = [
//     { name: t("SNo"), width: "1%" },
//     { name: t("Requisition Date"), width: "10%" },
//     t("Requisition No"),
//     t("Department From"),
//     t("RaisedBy"),
//     { name: t("Print"), width: "1%" },
//     { name: "View", width: "1%" },
//   ];

//   // Header for tables WITHOUT checkboxes
//   const seondThead = [
//     { name: t("SNo"), width: "1%" },
//     t("Department From"),
//     t("DepartmentTo"),
//     { name: "Item Name", width: "1%" },
//     { name: "Unit Type", width: "1%" },
//     { name: t("Requested Qty"), width: "1%" },
//     { name: t("Received Qty"), width: "1%" },
//     { name: t("Pending Qty"), width: "1%" },
//     { name: t("Rejected Qty"), width: "1%" },
//     { name: "Narration", width: "1%" },
//     { name: "Date", width: "1%" },
//   ];
  
//   const handleSelectAll = (e) => {
//     const isChecked = e.target.checked;
//     const newCheckedItems = {};
//     if (isChecked) {
//       internalTbody.forEach((row, parentIndex) => {
//         if (row.isopen && row.SecondBodyDataList) {
//           row.SecondBodyDataList.forEach((_, childIndex) => {
//             const uniqueId = `${parentIndex}-${childIndex}`;
//             newCheckedItems[uniqueId] = true;
//           });
//         }
//       });
//     }
//     setCheckedItems(newCheckedItems);
//   };
  
//   // Header for tables WITH checkboxes (for MI and MR)
//   const thirdThead = [
//     {
//       name: (
//         <input
//           type="checkbox"
//           checked={isAllSelected}
//           onChange={handleSelectAll}
//           disabled={!isAnyRowOpen} // Disable if no rows are open
//         />
//       ),
//       width: "1%",
//     },
//     { name: t("S.No."), width: "1%" },
//     { name: t("Department From"), width: "15%" },
//     t("Item Name"),
//     { name: t("RequestedQty"), width: "15%" },
//     { name: "Narration", width: "15%" },
//     { name: "Date", width: "15%" },
//   ];

//   const handleCheckboxChange = (uniqueId) => {
//     setCheckedItems((prev) => ({ ...prev, [uniqueId]: !prev[uniqueId] }));
//   };

//   const handleSave = async () => {
//     const selectedData = [];
//     internalTbody.forEach((val, index) => {
//       val.SecondBodyDataList?.forEach((item, i) => {
//         if (checkedItems[`${index}-${i}`]) {
//           selectedData.push({
//             indentNo: item?.indentNo,
//             itemID: item?.itemID,
//           });
//         }
//       });
//     });

//     console.log("selectedData", selectedData);
//     if (selectedData.length <= 0) {
//       notify(`Please Select atleast one item`, "warn");
//       return;
//     }

//     const response = await BillingIPDIssueIndentAccept(selectedData);

//     if (response?.success) {
//       notify(response?.message, "success");
//       // TODO: Add any logic needed after a successful API call, like refetching data
//     } else {
//       notify(response?.message, "error");
//     }
//   };

//   const handleClickEdit = async (val, index, isopen) => {
//     // Create a new array to avoid direct mutation
//     const updatedTbody = [...internalTbody];
//     const currentItem = updatedTbody[index];

//     // If we are opening a row that doesn't have data yet, fetch it
//     if (!isopen && !currentItem.SecondBodyDataList) {
//       const IndentNo = val?.IndentNo;
//       const Status = val?.StatusNew ? val?.StatusNew : "Open";
//       const Type = payload?.Type;
//       const TID = Tid;
//       const apiResp = await ViewIndent(IndentNo, Status, Type, TID);

//       if (apiResp?.success) {
//         currentItem.SecondBodyDataList = apiResp?.data?.dtnew;
//       } else {
//         notify(apiResp?.message, "error");
//       }
//     }

//     // Toggle the open state and update the state
//     currentItem.isopen = !isopen;
//     setInternalTbody(updatedTbody);
//   };

//   const handleClickReport = async (val) => {
//     const IndentNo = val?.IndentNo;
//     const Status = val?.StatusNew ? val?.StatusNew : "Open";
//     const Type = payload?.Type;
//     let apiResp = await PrintRequisition(IndentNo, Status, Type);
//     if (apiResp?.success) {
//       RedirectURL(apiResp?.data?.pdfUrl);
//     } else {
//       notify(apiResp?.message, "error");
//     }
//   };

//   const getRowClass = (val, index) => {
//     if (!internalTbody || !internalTbody[index]) {
//       return "";
//     }
//     const status = internalTbody[index]?.StatusNew;
//     switch (status) {
//       case "Open":
//         return "md-record-RequisitionDone";
//       case "Closed":
//         return "md-record-PendingRequisition";
//       case "Reject":
//         return "md-record-Completed";
//       case "Partial":
//         return "md-record-Running";
//       default:
//         return "";
//     }
//   };

//   // This single, comprehensive useEffect handles all UI updates.
//   // It runs when the source data, toggle state, or selection state changes.
//   useEffect(() => {
//     const bindBodyData = () => {
//       let list = [];
//       internalTbody?.forEach((val, index) => {
//         let secondTbody = [];
//         if (val.isopen && val.SecondBodyDataList) {
//           val.SecondBodyDataList.forEach((item, i) => {
//             const uniqueId = `${index}-${i}`;
//             let obj;
//             // If type is MI or MR, show the table with checkboxes
//             if (payload?.Type === "MI" || payload?.Type === "MR") {
//               obj = {
//                 check: (
//                   <input
//                     type="checkbox"
//                     checked={!!checkedItems[uniqueId]}
//                     onChange={() => handleCheckboxChange(uniqueId)}
//                   />
//                 ),
//                 sno: i + 1,
//                 deptFrom: item?.deptFrom,
//                 itemName: item?.itemName,
//                 reqQty: <div className="text-right">{item?.reqQty}</div>,
//                 Narration: item?.narration,
//                 DATE: item?.dtEntry,
//               };
//             } else {
//               // For all other types, show the detailed view without checkboxes
//               obj = {
//                 sno: i + 1,
//                 deptFrom: item?.deptFrom,
//                 deptTo: item?.deptTo,
//                 itemName: item?.itemName,
//                 unitType: item?.unitType,
//                 reqQty: item?.reqQty,
//                 receiveQty: item?.receiveQty,
//                 pendingQty: item?.pendingQty,
//                 rejectQty: item?.rejectQty,
//                 Narration: item?.narration,
//                 DATE: item?.date,
//               };
//             }
//             secondTbody.push(obj);
//           });
//         }
//         let obj = {
//           sno: index + 1,
//           dtentry: val?.dtentry,
//           IndentNo: val?.IndentNo,
//           Deptfrom: val?.Deptfrom,
//           EmpName: val?.EmpName,
//           print: (
//             <span onClick={() => handleClickReport(val)}>
//               <ReprintSVG />
//             </span>
//           ),
//           index: (
//             <span onClick={() => handleClickEdit(val, index, val.isopen)}>
//               {val.isopen ? (
//                 <i className="fa fa-minus" aria-hidden="true"></i>
//               ) : (
//                 <i className="fa fa-plus" aria-hidden="true"></i>
//               )}
//             </span>
//           ),
//           subRow: { subRowList: secondTbody, isopen: val.isopen },
//         };
//         list.push(obj);
//       });
//       setBodyData(list);
//     };

//     bindBodyData();

//     // Update derived states
//     const anyOpen = internalTbody.some((row) => row.isopen);
//     setIsAnyRowOpen(anyOpen);

//     const allVisibleItems = [];
//     internalTbody.forEach((row, parentIndex) => {
//       if (row.isopen && row.SecondBodyDataList) {
//         row.SecondBodyDataList.forEach((_, childIndex) => {
//           allVisibleItems.push(`${parentIndex}-${childIndex}`);
//         });
//       }
//     });

//     const allChecked =
//       allVisibleItems.length > 0 &&
//       allVisibleItems.every((id) => checkedItems[id]);
//     setIsAllSelected(allChecked);
//   }, [internalTbody, checkedItems, payload?.Type, rejectAllowed]); // Rerun when these dependencies change

//   const isCheckboxType = payload?.Type === "MI" || payload?.Type === "MR";

//   return (
//     <>
//       <NestedRowTable
//         thead={thead}
//         seondThead={isCheckboxType ? thirdThead : seondThead}
//         tbody={bodyData}
//         tableHeight={tableHeight}
//         getRowClass={getRowClass}
//       />
//       {isCheckboxType && isAnyRowOpen && (
//         <div style={{ textAlign: "right", padding: "10px" }}>
//           <button className="btn btn-primary" onClick={handleSave}>
//             {t("Save")}
//           </button>
//         </div>
//       )}
//     </>
//   );
// };

// export default ViewReqTable;




// import React, { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import NestedRowTable from "../NestedRowTable";
// import { ReprintSVG } from "../../../SvgIcons";
// import { RedirectURL } from "../../../../networkServices/PDFURL";
// import {
//   PrintRequisition,
//   ViewIndent,
// } from "../../../../networkServices/InventoryApi";
// import { notify } from "../../../../utils/utils";
// import { BillingIPDIssueIndentAccept } from "../../../../networkServices/pharmecy";

// const ViewReqTable = ({ tbody, tableHeight, payload, Tid }) => {
//   const [t] = useTranslation();
//   const [bodyData, setBodyData] = useState([]);
//   const [internalTbody, setInternalTbody] = useState([]); // Local state for table data
//   const [checkedItems, setCheckedItems] = useState({});
//   const [isAllSelected, setIsAllSelected] = useState(false);
//   const [isAnyRowOpen, setIsAnyRowOpen] = useState(false);

//   // Initialize internal state when the tbody prop changes
//   useEffect(() => {
//     // We add the 'isopen' property here if it doesn't exist to manage the toggle state locally
//     setInternalTbody(
//       tbody.map((row) => ({ ...row, isopen: !!row.isopen }))
//     );
//     // When tbody changes, reset selections
//     setCheckedItems({});
//   }, [tbody]);

//   const thead = [
//     { name: t("SNo"), width: "1%" },
//     { name: t("Requisition Date"), width: "10%" },
//     t("Requisition No"),
//     t("Department From"),
//     t("RaisedBy"),
//     { name: t("Print"), width: "1%" },
//     { name: "View", width: "1%" },
//   ];

//   const seondThead = [
//     { name: t("SNo"), width: "1%" },
//     t("Department From"),
//     t("DepartmentTo"),
//     { name: "Item Name", width: "1%" },
//     { name: "Unit Type", width: "1%" },
//     { name: t("Requested Qty"), width: "1%" },
//     { name: t("Received Qty"), width: "1%" },
//     { name: t("Pending Qty"), width: "1%" },
//     { name: t("Rejected Qty"), width: "1%" },
//     { name: "Narration", width: "1%" },
//     { name: "Date", width: "1%" },
//   ];

//   const handleSelectAll = (e) => {
//     const isChecked = e.target.checked;
//     const newCheckedItems = {};
//     if (isChecked) {
//       internalTbody.forEach((row, parentIndex) => {
//         if (row.isopen && row.SecondBodyDataList) {
//           row.SecondBodyDataList.forEach((_, childIndex) => {
//             const uniqueId = `${parentIndex}-${childIndex}`;
//             newCheckedItems[uniqueId] = true;
//           });
//         }
//       });
//     }
//     setCheckedItems(newCheckedItems);
//   };

//   const thirdThead = [
//     {
//       name: (
//         <input
//           type="checkbox"
//           checked={isAllSelected}
//           onChange={handleSelectAll}
//           disabled={!isAnyRowOpen} // Disable if no rows are open
//         />
//       ),
//       width: "1%",
//     },
//     { name: t("S.No."), width: "1%" },
//     { name: t("Department From"), width: "15%" },
//     t("Item Name"),
//     { name: t("RequestedQty"), width: "15%" },
//     { name: "Narration", width: "15%" },
//     { name: "Date", width: "15%" },
//   ];

//   const handleCheckboxChange = (uniqueId) => {
//     setCheckedItems((prev) => ({ ...prev, [uniqueId]: !prev[uniqueId] }));
//   };

//   const handleSave = async() => {
   
//     const selectedData = [];
//     internalTbody.forEach((val, index) => {
     
//       val.SecondBodyDataList?.forEach((item, i) => {
//         if (checkedItems[`${index}-${i}`]) {
//           selectedData.push({
//             "indentNo": item?.indentNo, 
//             "itemID": item?.itemID
//           });

//         }
//       });
//     });
//     console.log("selectedData", selectedData);
//   if (selectedData.length <= 0) {
//       notify(`Please Select atleast one item`, "warn");
//     return
//   }
//   // }
// const response =await BillingIPDIssueIndentAccept(selectedData)
    
//     if (response?.success) {
//       notify(response?.message, "success");
//       // TODO: Add your API call logic here
//     } else {
//     notify(response?.message, "error");
//     }
//   };

//   const handleClickEdit = async (val, index, isopen) => {
//     // Create a new array to avoid direct mutation
//     const updatedTbody = [...internalTbody];
//     const currentItem = updatedTbody[index];

//     // If we are opening a row that doesn't have data yet, fetch it
//     if (!isopen && !currentItem.SecondBodyDataList) {
//       const IndentNo = val?.IndentNo;
//       const Status = val?.StatusNew ? val?.StatusNew : "Open";
//       const Type = payload?.Type;
//       const TID = Tid;
//       const apiResp = await ViewIndent(IndentNo, Status, Type, TID);

//       if (apiResp?.success) {
//         currentItem.SecondBodyDataList = apiResp?.data?.dtnew;
//       } else {
//         notify(apiResp?.message, "error");
//       }
//     }
    
//     // Toggle the open state and update the state
//     currentItem.isopen = !isopen;
//     setInternalTbody(updatedTbody);
//   };

//   const handleClickReport = async (val) => {
//     const IndentNo = val?.IndentNo;
//     const Status = val?.StatusNew ? val?.StatusNew : "Open";
//     const Type = payload?.Type;
//     let apiResp = await PrintRequisition(IndentNo, Status, Type);
//     if (apiResp?.success) {
//       RedirectURL(apiResp?.data?.pdfUrl);
//     } else {
//       notify(apiResp?.message, "error");
//     }
//   };

//   const getRowClass = (val, index) => {
//     if (!internalTbody || !internalTbody[index]) {
//       return "";
//     }
//     const status = internalTbody[index]?.StatusNew;
//     switch (status) {
//       case "Open": return "md-record-RequisitionDone";
//       case "Closed": return "md-record-PendingRequisition";
//       case "Reject": return "md-record-Completed";
//       case "Partial": return "md-record-Running";
//       default: return "";
//     }
//   };
  
//   // This single, comprehensive useEffect handles all UI updates.
//   // It runs when the source data, toggle state, or selection state changes.
//   useEffect(() => {
//     const bindBodyData = () => {
//       let list = [];
//       internalTbody?.forEach((val, index) => {
//         let secondTbody = [];
//         if (val.isopen && val.SecondBodyDataList) {
//           val.SecondBodyDataList.forEach((item, i) => {
//             const uniqueId = `${index}-${i}`;
//             const obj =
//               payload?.Type === "MI"
//                 ?  {
//                   sno: i + 1,
//                   deptFrom: item?.deptFrom,
//                   deptTo: item?.deptTo,
//                   itemName: item?.itemName,
//                   unitType: item?.unitType,
//                   reqQty: item?.reqQty,
//                   receiveQty: item?.receiveQty,
//                   pendingQty: item?.pendingQty,
//                   rejectQty: item?.rejectQty,
//                   Narration: item?.narration,
//                   DATE: item?.date,
//                 }
//                 : {
//                     check: (
//                       <input
//                         type="checkbox"
//                         checked={!!checkedItems[uniqueId]}
//                         onChange={() => handleCheckboxChange(uniqueId)}
//                       />
//                     ),
//                     sno: i + 1,
//                     deptFrom: item?.deptFrom,
//                     itemName: item?.itemName,
//                     reqQty: <div className="text-right">{item?.reqQty}</div>,
//                     Narration: item?.narration,
//                     DATE: item?.dtEntry,
//                   };
//             secondTbody.push(obj);
//           });
//         }
//         let obj = {
//             sno: index + 1,
//             dtentry: val?.dtentry,
//             IndentNo: val?.IndentNo,
//             Deptfrom: val?.Deptfrom,
//             EmpName: val?.EmpName,
//             print: ( <span onClick={() => handleClickReport(val)}> <ReprintSVG /> </span> ),
//             index: (
//               <span onClick={() => handleClickEdit(val, index, val.isopen)}>
//                 {val.isopen ? ( <i className="fa fa-minus" aria-hidden="true"></i> ) 
//                              : ( <i className="fa fa-plus" aria-hidden="true"></i> )}
//               </span>
//             ),
//             subRow: { subRowList: secondTbody, isopen: val.isopen },
//         };
//         list.push(obj);
//       });
//       setBodyData(list);
//     };

//     bindBodyData();

//     // Update derived states
//     const anyOpen = internalTbody.some(row => row.isopen);
//     setIsAnyRowOpen(anyOpen);

//     const allVisibleItems = [];
//     internalTbody.forEach((row, parentIndex) => {
//       if (row.isopen && row.SecondBodyDataList) {
//         row.SecondBodyDataList.forEach((_, childIndex) => {
//           allVisibleItems.push(`${parentIndex}-${childIndex}`);
//         });
//       }
//     });

//     const allChecked = allVisibleItems.length > 0 && allVisibleItems.every(id => checkedItems[id]);
//     setIsAllSelected(allChecked);

//   }, [internalTbody, checkedItems, payload?.Type, rejectAllowed]); // Rerun when these dependencies change

//   return (
//     <>
//       <NestedRowTable
//         thead={thead}
//         seondThead={payload?.Type === "MI" ? seondThead : thirdThead}
//         tbody={bodyData}
//         tableHeight={tableHeight}
//         getRowClass={getRowClass}
//       />
//       {payload?.Type !== "MI" && isAnyRowOpen && (
//         <div style={{ textAlign: "right", padding: "10px" }}>
//           <button className="btn btn-primary" onClick={handleSave}>
//             {t("Save")}
//           </button>
//         </div>
//       )}
//     </>
//   );
// };

// export default ViewReqTable;


// import React, { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import NestedRowTable from "../NestedRowTable";
// import { useLocalStorage } from "../../../../utils/hooks/useLocalStorage";
// import { ReprintSVG } from "../../../SvgIcons";
// import { OpenPDFURL, RedirectURL } from "../../../../networkServices/PDFURL";
// import {
//   PrintRequisition,
//   ViewIndent,
// } from "../../../../networkServices/InventoryApi";
// import { notify } from "../../../../utils/utils";

// const ViewReqTable = ({ tbody, tableHeight, payload, Tid }) => {
//   const [t] = useTranslation();
//   const [bodyData, setBodyData] = useState([]);
//   const [checkedItems, setCheckedItems] = useState({});
//   const [isAllSelected, setIsAllSelected] = useState(false);

//   const thead = [
//     { name: t("SNo"), width: "1%" },
//     { name: t("Requisition Date"), width: "10%" },
//     t("Requisition No"),
//     t("Department From"),
//     t("RaisedBy"),
//     { name: t("Print"), width: "1%" },
//     { name: "View", width: "1%" },
//   ];

//   const seondThead = [
//     { name: t("SNo"), width: "1%" },
//     t("Department From"),
//     t("DepartmentTo"),
//     { name: "Item Name", width: "1%" },
//     { name: "Unit Type", width: "1%" },
//     { name: t("Requested Qty"), width: "1%" },
//     { name: t("Received Qty"), width: "1%" },
//     { name: t("Pending Qty"), width: "1%" },
//     { name: t("Rejected Qty"), width: "1%" },
//     { name: "Narration", width: "1%" },
//     { name: "Date", width: "1%" },
//   ];

//   // Handler for the "Select All" checkbox in the thirdThead
//   const handleSelectAll = (e) => {
//     const isChecked = e.target.checked;
//     setIsAllSelected(isChecked);
//     const newCheckedItems = {};
//     if (isChecked) {
//       tbody.forEach((row, parentIndex) => {
//         if (row.isopen && row.SecondBodyDataList) {
//           row.SecondBodyDataList.forEach((_, childIndex) => {
//             const uniqueId = `${parentIndex}-${childIndex}`;
//             newCheckedItems[uniqueId] = true;
//           });
//         }
//       });
//     }
//     setCheckedItems(newCheckedItems);
//   };

//   const thirdThead = [
//     {
//       name: (
//         <input
//           type="checkbox"
//           checked={isAllSelected}
//           onChange={handleSelectAll}
//         />
//       ),
//       width: "1%",
//     },
//     { name: t("S.No."), width: "1%" },
//     { name: t("Department From"), width: "15%" },
//     t("Item Name"),
//     { name: t("RequestedQty"), width: "15%" },
//     { name: "Narration", width: "15%" },
//     { name: "Date", width: "15%" },
//   ];

//   // Handler for individual row checkboxes
//   const handleCheckboxChange = (uniqueId) => {
//     setCheckedItems((prev) => ({ ...prev, [uniqueId]: !prev[uniqueId] }));
//   };
  
//   // Handler for saving selected items
//   const handleSave = () => {
//     const selectedData = [];
//     tbody.forEach((val, index) => {
//         val.SecondBodyDataList?.forEach((item, i) => {
//             const uniqueId = `${index}-${i}`;
//             if (checkedItems[uniqueId]) {
//                 selectedData.push(item);
//             }
//         });
//     });
//     console.log("Selected Items to be saved:", selectedData);
//     if(selectedData.length > 0){
//        notify(`Saved ${selectedData.length} items successfully.`, "success");
//       // TODO: Add your API call logic here
//     } else {
//        notify("No items selected to save.", "warning");
//     }
//   };

//   const handleClickEdit = async (val, index, isopen) => {
//     const IndentNo = val?.IndentNo;
//     const Status = val?.StatusNew ? val?.StatusNew : "Open";
//     const Type = payload?.Type;
//     const TID = Tid;
//     const apiResp = await ViewIndent(IndentNo, Status, Type, TID);
//     tbody[index]["isopen"] = !isopen;
//     if (apiResp?.success) {
//       tbody[index]["SecondBodyDataList"] = apiResp?.data?.dtnew;
//     } else {
//       notify(apiResp?.message, "error");
//     }
//     bindBodyData(tbody);
//   };

//   const handleClickReport = async (val) => {
//     const IndentNo = val?.IndentNo;
//     const Status = val?.StatusNew ? val?.StatusNew : "Open";
//     const Type = payload?.Type;
//     let apiResp = await PrintRequisition(IndentNo, Status, Type);
//     if (apiResp?.success) {
//       RedirectURL(apiResp?.data?.pdfUrl);
//     } else {
//       notify(apiResp?.message, "error");
//     }
//   };

//   const getRowClass = (val, index) => {
//     if (!tbody || !tbody[index]) {
//       console.error(`Row data not found for index: ${index}`);
//       return "";
//     }
//     const status = tbody[index]?.StatusNew;
//     switch (status) {
//       case "Open":
//         return "md-record-RequisitionDone";
//       case "Closed":
//         return "md-record-PendingRequisition";
//       case "Reject":
//         return "md-record-Completed";
//       case "Partial":
//         return "md-record-Running";
//       default:
//         return "";
//     }
//   };

//   const bindBodyData = (tbody) => {
//     let list = [];
//     tbody?.map((val, index) => {
//       let secondTbody = [];
//       val?.SecondBodyDataList?.length > 0 &&
//         val?.SecondBodyDataList?.map((item, i) => {
//           const uniqueId = `${index}-${i}`;
//           const obj =
//             payload?.Type === "MI"
//               ? {
//                   sno: i + 1,
//                   deptFrom: item?.deptFrom,
//                   deptTo: item?.deptTo,
//                   itemName: item?.itemName,
//                   unitType: item?.unitType,
//                   reqQty: item?.reqQty,
//                   receiveQty: item?.receiveQty,
//                   pendingQty: item?.pendingQty,
//                   rejectQty: item?.rejectQty,
//                   Narration: item?.narration,
//                   DATE: item?.date,
//                 }
//               : {
//                   check: (
//                     <input
//                       type="checkbox"
//                       checked={!!checkedItems[uniqueId]}
//                       onChange={() => handleCheckboxChange(uniqueId)}
//                     />
//                   ),
//                   sno: i + 1,
//                   deptFrom: item?.deptFrom,
//                   itemName: item?.itemName,
//                   reqQty: <div className="text-right">{item?.reqQty}</div>,
//                   Narration: item?.narration,
//                   DATE: item?.dtEntry,
//                 };
//           secondTbody.push(obj);
//         });

//       let obj = {};
//       obj.sno = index + 1;
//       obj.dtentry = val?.dtentry;
//       obj.IndentNo = val?.IndentNo;
//       obj.Deptfrom = val?.Deptfrom;
//       obj.EmpName = val?.EmpName;
//       obj.print = (
//         <span onClick={() => handleClickReport(val)}>
//           <ReprintSVG />
//         </span>
//       );
//       obj.index = (
//         <span onClick={() => handleClickEdit(val, index, val?.isopen)}>
//           {val?.isopen > 0 ? (
//             <i className="fa fa-minus" aria-hidden="true"></i>
//           ) : (
//             <i className="fa fa-plus" aria-hidden="true"></i>
//           )}
//         </span>
//       );
//       obj.subRow = { subRowList: secondTbody, isopen: val?.isopen };
//       list.push(obj);
//     });
//     setBodyData(list);
//   };

//   useEffect(() => {
//     // Logic to check if all relevant items are checked
//     const allVisibleItems = [];
//     tbody.forEach((row, parentIndex) => {
//         if (row.isopen && row.SecondBodyDataList) {
//             row.SecondBodyDataList.forEach((_, childIndex) => {
//                 allVisibleItems.push(`${parentIndex}-${childIndex}`);
//             });
//         }
//     });
//     const allChecked = allVisibleItems.length > 0 && allVisibleItems.every(id => checkedItems[id]);
//     setIsAllSelected(allChecked);

//     bindBodyData(tbody);
//   }, [tbody, checkedItems]);

//   return (
//     <>
//       <NestedRowTable
//         thead={thead}
//         seondThead={payload?.Type === "MI" ? seondThead : thirdThead}
//         tbody={bodyData}
//         tableHeight={tableHeight}
//         getRowClass={getRowClass}
//       />
//       {payload?.Type !== "MI" && (
//         <div style={{ textAlign: "right", padding: "10px" }}>
//           <button className="btn btn-primary" onClick={handleSave}>
//             {t("Save")}
//           </button>
//         </div>
//       )}
//     </>
//   );
// };

// export default ViewReqTable;


// import React, { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import NestedRowTable from "../NestedRowTable";
// import { useLocalStorage } from "../../../../utils/hooks/useLocalStorage";
// import { ReprintSVG } from "../../../SvgIcons";
// import { OpenPDFURL, RedirectURL } from "../../../../networkServices/PDFURL";
// import {
//   PrintRequisition,
//   ViewIndent,
// } from "../../../../networkServices/InventoryApi";
// import { notify } from "../../../../utils/utils";

// const ViewReqTable = ({ tbody, tableHeight, payload,Tid }) => {
//   const [t] = useTranslation();
//   const [bodyData, setBodyData] = useState([]);

//   const thead = [
//     { name: t("SNo"), width: "1%" },
//     { name: t("Requisition Date"), width: "10%" },
//     t("Requisition No"),
//     // t("ItemName"),
//     // t("UnitType"),
//     t("Department From"),
//     t("RaisedBy"),
//     { name: t("Print"), width: "1%" },
//     { name: "View", width: "1%" },
//   ];
//   console.log("payload", payload);
//   const seondThead = [
//     { name: t("SNo"), width: "1%" },
//     t("Department From"),
//     t("DepartmentTo"),
//     { name: "Item Name", width: "1%" },
//     { name: "Unit Type", width: "1%" },
//     { name: t("Requested Qty"), width: "1%" },
//     { name: t("Received Qty"), width: "1%" },
//     { name: t("Pending Qty"), width: "1%" },
//     { name: t("Rejected Qty"), width: "1%" },
//     { name: "Narration", width: "1%" },
//     { name: "Date", width: "1%" },
//   ];
//   const thirdThead = [
//     { name: t("S.No."), width: "1%" },
//     { name: t("Department From"), width: "15%" },
//     t("Item Name"),
//     { name: t("RequestedQty"), width: "15%" },
//     { name: "Narration", width: "15%" },
//     { name: "Date", width: "15%" },
//   ];
//   console.log(tbody);
//   const handleClickEdit = async (val, index, isopen) => {
//     console.log(val);
//     const IndentNo = val?.IndentNo;
//     const Status = val?.StatusNew ? val?.StatusNew : "Open";
//     const Type = payload?.Type;
//     const TID = Tid;
//     const apiResp = await ViewIndent(IndentNo, Status, Type,TID);
//     tbody[index]["isopen"] = !isopen;
//     if (apiResp?.success) {
//       tbody[index]["SecondBodyDataList"] = apiResp?.data?.dtnew;
//     } else {
//       notify(apiResp?.message, "error");
//     }
//     bindBodyData(tbody);
//   };

//   const handleClickReport = async (val) => {
//     console.log(val);
//     const IndentNo = val?.IndentNo;
//     const Status = val?.StatusNew ? val?.StatusNew : "Open";
//     const Type = payload?.Type;
//     let apiResp = await PrintRequisition(IndentNo, Status, Type);
//     if (apiResp?.success) {
//       RedirectURL(apiResp?.data?.pdfUrl);
//     } else {
//       notify(apiResp?.message, "error");
//     }
//   };

//   // const getRowClass = (val, index) => {
//   //   console.log(tbody[index]["StatusNew"])
//   //   const status = tbody[index]["StatusNew"];
//   //   console.log(status)
//   //   if (status === "Open") {
//   //     return "md-record-RequisitionDone";
//   //   }
//   //   if (status === "Reject") {
//   //     return "md-record-PendingRequisition";
//   //   }
//   //   if (status === "Closed") {
//   //     return "md-record-Completed ";
//   //   }
//   //   if (status === "Partial") {
//   //     return "md-record-Running";
//   //   }
//   // };

//   const getRowClass = (val, index) => {
//     if (!tbody || !tbody[index]) {
//       console.error(`Row data not found for index: ${index}`);
//       return "";
//     }

//     const status = tbody[index]?.StatusNew;

//     switch (status) {
//       case "Open":
//         return "md-record-RequisitionDone";
//       case "Closed":
//         return "md-record-PendingRequisition";
//       case "Reject":
//         return "md-record-Completed";
//       case "Partial":
//         return "md-record-Running";
//       default:
//         return ""; // Return a default or empty string if status doesn't match
//     }
//   };

//   const bindBodyData = (tbody) => {
//     let list = [];
//     tbody?.map((val, index) => {
//       let secondTbody = [];

//       val?.SecondBodyDataList?.length > 0 &&
//         val?.SecondBodyDataList?.map((item, i) => {
//           const obj =
//             payload?.Type === "MI"
//               ? {
//                   sno: i + 1,
//                   deptFrom: item?.deptFrom,
//                   deptTo: item?.deptTo,
//                   itemName: item?.itemName,
//                   unitType: item?.unitType,
//                   reqQty: item?.reqQty,
//                   receiveQty: item?.receiveQty,
//                   pendingQty: item?.pendingQty,
//                   rejectQty: item?.rejectQty,
//                   Narration: item?.narration,
//                   DATE: item?.date,
//                 }
//               : {
//                   sno: i + 1,
//                   deptFrom: item?.deptFrom,
//                   itemName: item?.itemName,
//                   reqQty: <div className="text-right">{item?.reqQty}</div>,
//                   Narration: item?.narration,
//                   DATE: item?.dtEntry,
//                 };

//           secondTbody.push(obj);
//         });
//       let obj = {};

//       obj.sno = index + 1;
//       (obj.dtentry = val?.dtentry),
//         (obj.IndentNo = val?.IndentNo),
//         (obj.Deptfrom = val?.Deptfrom),
//         (obj.EmpName = val?.EmpName),
//         (obj.print = (
//           <span
//             onClick={() => {
//               handleClickReport(val);
//             }}
//           >
//             <ReprintSVG />
//           </span>
//         )),
//         (obj.index = (
//           <span
//             onClick={() => {
//               handleClickEdit(val, index, val?.isopen);
//             }}
//           >
//             {val?.isopen > 0 ? (
//               <i className="fa fa-minus" aria-hidden="true"></i>
//             ) : (
//               <i className="fa fa-plus" aria-hidden="true"></i>
//             )}
//           </span>
//         ));
//       obj.subRow = { subRowList: secondTbody, isopen: val?.isopen };
//       list.push(obj);
//     });
//     setBodyData(list);
//   };
//   useEffect(() => {
//     bindBodyData(tbody);
//   }, [tbody]);

//   // const getRowClass = (val) => {
//   //   if (val?.STATUS === "Completed") {
//   //     return "medicationTbaleRowColor";
//   //   }
//   //   if (val?.STATUS === "Stopped") {
//   //     return "medicationTbaleRowColorStopped";
//   //   }
//   //   if (val?.STATUS === "Not Issued") {
//   //     return "medicationTbaleRowColorNotIssued";
//   //   }
//   //   if (val?.STATUS === "Running") {
//   //     return "medicationTbaleRowColorRunning";
//   //   }
//   //   if (val?.STATUS === "Today Medicine") {
//   //     return "medicationTbaleRowColorTodayMedicine";
//   //   }
//   // };
//   console.log(bodyData);
//   return (
//     <>
//       <NestedRowTable
//         thead={thead}
//         seondThead={payload?.Type === "MI" ? seondThead : thirdThead}
//         tbody={bodyData}
//         tableHeight={tableHeight}
//         getRowClass={getRowClass}
//       />
//     </>
//   );
// };

// export default ViewReqTable;
