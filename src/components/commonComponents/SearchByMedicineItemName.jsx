import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BindItem } from "../../networkServices/BillingsApi";
import { BindItemGRN } from "../../networkServices/InventoryApi";
import { AssetGetItemList } from "../../networkServices/AssetAndEquipment";
import { AutoComplete } from "primereact/autocomplete";
import { notify } from "../../utils/utils";
import { PharmacyMedicineItemSearch } from "../../networkServices/pharmecy";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { GetGlobalResources } from "../../networkServices/opdserviceAPI";

const getItemNameDisplayValue = (itemName) => {
  if (!itemName) return "";
  if (typeof itemName === "string") return itemName;
  return (
    itemName?.label ??
    itemName?.ItemName ??
    itemName?.TypeName ??
    itemName?.Typename ??
    ""
  );
};

const SearchByMedicineItemName = ({
  data,
  handleItemSelect,
  itemName,
  pateintDetails,
  payload,
  callfrom,
  storeLedgerNo,
  isConsignment,
  AddRowData,
  setIsExpirable,
  setValues,
  disabled,
  index,
  isMedSearch,
  isIndentMedicineSearch,
  saleOnList,
  isAvailQyantity,
}) => {
  const [t] = useTranslation();
  const [value, setValue] = useState("");
  const [items, setItems] = useState([]);
  const [itemsList, setItemList] = useState([]);
  const [isShowItemQty, setIsShowItemQty] = useState(false);
  // Zero stock wala item bhi chuna ja sake - fin_global_resources se on/off.
  const [isZeroQtyItemAllow, setIsZeroQtyItemAllow] = useState(false);
  const searchTimerRef = useRef(null);
  const searchRequestRef = useRef(0);
  const userData = useLocalStorage("userData", "get");
  const shouldShowAvailableQty = Boolean(isAvailQyantity && isShowItemQty);

  const getGlobalResources = async () => {
    try {
      const apiResp = await GetGlobalResources();
      const showItemQty = apiResp?.data?.find(
        (item) => item?.Name === "IsShowItemQty"
      );
      const zeroQtyItemAllow = apiResp?.data?.find(
        (item) => item?.Name === "IsZeroQtyItemAllow"
      );

      setIsShowItemQty(String(showItemQty?.Value) === "1");
      setIsZeroQtyItemAllow(String(zeroQtyItemAllow?.Value) === "1");
    } catch (error) {
      console.error(error);
      setIsShowItemQty(false);
      setIsZeroQtyItemAllow(false);
    }
  };

  useEffect(() => {
    getGlobalResources();
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setValue(getItemNameDisplayValue(itemName));
  }, [itemName]);

  const getbindIPDPatientDetails = async (value) => {
    if (callfrom === "AssetGRN") {
      if (storeLedgerNo == "") {
        return notify(t("Please Select Store."), "error");
      }
      const payLoadList = {
        itemName: value,
        storeTypeID: storeLedgerNo?.value,
      };
      try {
        const response = await AssetGetItemList(payLoadList);
        setItemList(response?.data);
        setIsExpirable ? setIsExpirable(response?.data) : null;
        return response?.data;
      } catch (error) {
        console.log(error);
      }
    } else if (callfrom == "GRN" || callfrom == "Con") {
      if (storeLedgerNo == "") {
        return notify(t("Please Select Store."), "error");
      }
      const payLoadList = {
        itemName: value,
        storeTypeID: storeLedgerNo?.value,
        isConsignment: callfrom == "Con" ? isConsignment : "0",
      };
      try {
        const response = await BindItemGRN(payLoadList);
       if(response?.success){
         setValues
          ? setValues((prevPayload) => ({
            ...prevPayload,
            ConversionFactor: response?.data?.[0]?.ConversionFactor,
          }))
          : null;
        setItemList(response?.data);
        setIsExpirable(response?.data);
        return response?.data;
       }else{
        notify(response?.message, "error");
        setItemList([]);
        return [];
       }
      } catch (error) {
        console.log(error);
      }
    } else if (isMedSearch) {
      let payload = {
        cmd: "item",
        type: "1",
        deptLedgerNo: userData?.deptLedgerNo,
        q: value,
        page: "1",
        rows: 20,
        sort: "ItemName",
        order: "asc",
        isWithAlternate: false,
        isBarCodeScan: false,
        PanelId: pateintDetails?.Panel
          ? pateintDetails?.Panel
          : pateintDetails?.Panel?.value,
        isCashPanel: pateintDetails?.isCashPanel
          ? pateintDetails?.isCashPanel
          : 1,
        isPackage: 0,
      };
      try {
        let apiResp = await PharmacyMedicineItemSearch(payload);
        return apiResp?.data;
      } catch (error) {
        console.log(error);
      }
    } else if (isIndentMedicineSearch) {
      let payload = {
        searchBy: "1",
        itemName: value,
        saleOn: saleOnList?.[0]?.TextField ? saleOnList?.[0]?.TextField : "",
        PanelId: pateintDetails?.Panel
          ? pateintDetails?.Panel
          : pateintDetails?.Panel?.value,
        isCashPanel: pateintDetails?.isCashPanel
          ? pateintDetails?.isCashPanel
          : 1,
        isPackage: 0,
      };
      try {
        let apiResp = await PharmacyMedicineItemSearch(payload);
        return apiResp?.data;
      } catch (error) {
        console.log(error);
      }
    } else {
      
      const payLoadList = {
        scheduleChargeID: Number(
          pateintDetails?.ScheduleChargeID
            ? pateintDetails?.ScheduleChargeID
            : "",
        ),
        panelID: Number(pateintDetails?.PanelID ? pateintDetails?.PanelID : ""),
        ipdCaseTypeID: Number(
          pateintDetails?.IPDCaseTypeID ? pateintDetails?.IPDCaseTypeID : "",
        ),
        itemName: value,
        categoryID: Number(
          payload?.Category?.value ? payload?.Category?.value : "",
        ),
        subcategory: Number(
          payload?.SubCategoryID?.value ? payload?.SubCategoryID?.value : "",
        ),
        requestType: String(payload?.Type ? payload?.Type : ""),
        IsInternational: pateintDetails?.IsInternational
          ? pateintDetails?.IsInternational
          : "2",
        LedgerNumber: String(payload?.department?.value?payload?.department?.value:payload?.department) || "0",
      };
      try {
        const response = await BindItem(payLoadList);
        return response?.data;
      } catch (error) {
        console.log(error);
      }
    }
  };

  const search = (event) => {
    const query = event?.query?.trim();
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (!query) {
      setItems([]);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      const item = await getbindIPDPatientDetails(query);

      if (searchRequestRef.current === requestId) {
        setItems(item || []);
      }
    }, 300);
  };

  const itemTemplate = (item) => {
    // CORRECTED: Ensure AvlQty is not null or empty string before checking if it's 0
    const isOutOfStock =
      shouldShowAvailableQty &&
      item?.AvlQty != null &&
      item?.AvlQty !== "" &&
      Number(item?.AvlQty) === 0;

    return (
      <div
        className="p-clearfix"
        style={isOutOfStock ? { opacity: 0.5, pointerEvents: "none" } : {}}
      >
        <div style={{ float: "left", fontSize: "16px !important", width: "100%" }}>
          {(callfrom == "GRN" || callfrom == "Con"
            ? item?.ItemName
            : item?.TypeName) || item?.ItemName}

          {shouldShowAvailableQty && (
            <span
              style={{
                float: "right",
                fontSize: "10px",
                color: isOutOfStock ? "red" : "#888",
                fontWeight: isOutOfStock ? "bold" : "normal",
              }}
            >
              {item?.AvlQty}
            </span>
          )}
        </div>
      </div>
    );
  };

  const handleSelectRow = (e) => {
    const { value } = e;

    // CORRECTED: Fixed early return bug and null check issue
    if (payload?.Type === "MI") {
      // Zero quantity par rok tabhi lagti hai jab IsZeroQtyItemAllow band ho.
      if (
        !isZeroQtyItemAllow &&
        shouldShowAvailableQty &&
        value?.AvlQty != null &&
        value?.AvlQty !== "" &&
        Number(value?.AvlQty) === 0
      ) {
        notify(t("Item cannot be selected as Available Quantity is 0."), "error");
        setValue(null);
        return; // Stops here ONLY if out of stock
      }
      // Removed the standalone `return` that was here, which prevented binding!
    }

    const selectedLabel = (callfrom == "AssetGRN"
      ? value?.Typename
      : callfrom == "GRN" || callfrom == "Con"
        ? value?.ItemName
        : value?.TypeName) || value?.ItemName || "";

    handleItemSelect(
      selectedLabel,
      value?.ItemID,
      value,
      e?.originalEvent?.type,
      e,
      index,
    );
    setValue(selectedLabel);
  };

  return (
    <div className="row">
      <div className="col-12">
        <AutoComplete
          value={value || ""}
          suggestions={items ? items : itemsList}
          completeMethod={search}
          className={` w-100 ${(callfrom == "GRN" || callfrom == "Con") && "table-auto-complete table-auto-complete-custom"}`}
          onSelect={(e) => handleSelectRow(e)}
          id="searchtest"
          onChange={(e) => {
            if (e?.value === undefined) {
              setValue("");
            } else if (typeof e?.value === "string") {
              setValue(e.value);
            }
          }}
          itemTemplate={itemTemplate}
          disabled={disabled}
        />
        {callfrom == "GRN" || callfrom == "Con" || callfrom === "AssetGRN" ? (
          <></>
        ) : (
          <label
            className="label lable truncate "
            style={{ fontSize: "5px !important" }}
          >
            {t("Search Item")}
          </label>
        )}
      </div>
    </div>
  );
};

export default SearchByMedicineItemName;




// import React, { useEffect, useRef, useState } from "react";
// import { useTranslation } from "react-i18next";
// import { BindItem } from "../../networkServices/BillingsApi";
// import { BindItemGRN } from "../../networkServices/InventoryApi";
// import { AssetGetItemList } from "../../networkServices/AssetAndEquipment";
// import { AutoComplete } from "primereact/autocomplete";
// import { notify } from "../../utils/utils";
// import { PharmacyMedicineItemSearch } from "../../networkServices/pharmecy";
// import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
// import { GetGlobalResources } from "../../networkServices/opdserviceAPI";

// const SearchByMedicineItemName = ({
//   data,
//   handleItemSelect,
//   itemName,
//   pateintDetails,
//   payload,
//   callfrom,
//   storeLedgerNo,
//   isConsignment,
//   AddRowData,
//   setIsExpirable,
//   setValues,
//   disabled,
//   index,
//   isMedSearch,
//   isIndentMedicineSearch,
//   saleOnList,
//   isAvailQyantity,
// }) => {
//   const [t] = useTranslation();
//   const [value, setValue] = useState("");
//   const [items, setItems] = useState([]);
//   const [itemsList, setItemList] = useState([]);
//   const [isShowItemQty, setIsShowItemQty] = useState(false);
//   const searchTimerRef = useRef(null);
//   const searchRequestRef = useRef(0);
//   const userData = useLocalStorage("userData", "get");
//   const shouldShowAvailableQty = Boolean(isAvailQyantity && isShowItemQty);

//   const getGlobalResources = async () => {
//     try {
//       const apiResp = await GetGlobalResources();
//       const showItemQty = apiResp?.data?.find(
//         (item) => item?.Name === "IsShowItemQty"
//       );

//       setIsShowItemQty(String(showItemQty?.Value) === "1");
//     } catch (error) {
//       console.error(error);
//       setIsShowItemQty(false);
//     }
//   };

//   useEffect(() => {
//     getGlobalResources();
//   }, []);

//   useEffect(() => {
//     return () => {
//       if (searchTimerRef.current) {
//         clearTimeout(searchTimerRef.current);
//       }
//     };
//   }, []);

//   const getbindIPDPatientDetails = async (value) => {
//     if (callfrom === "AssetGRN") {
//       if (storeLedgerNo == "") {
//         return notify("Please Select Store.", "error");
//       }
//       const payLoadList = {
//         itemName: value,
//         storeTypeID: storeLedgerNo?.value,
//       };
//       try {
//         const response = await AssetGetItemList(payLoadList);
//         setItemList(response?.data);
//         setIsExpirable ? setIsExpirable(response?.data) : null;
//         return response?.data;
//       } catch (error) {
//         console.log(error);
//       }
//     } else if (callfrom == "GRN" || callfrom == "Con") {
//       if (storeLedgerNo == "") {
//         return notify("Please Select Store.", "error");
//       }
//       const payLoadList = {
//         itemName: value,
//         storeTypeID: storeLedgerNo?.value,
//         isConsignment: callfrom == "Con" ? isConsignment : "0",
//       };
//       try {
//         const response = await BindItemGRN(payLoadList);
//        if(response?.success){
//          setValues
//           ? setValues((prevPayload) => ({
//             ...prevPayload,
//             ConversionFactor: response?.data?.[0]?.ConversionFactor,
//           }))
//           : null;
//         setItemList(response?.data);
//         setIsExpirable(response?.data);
//         return response?.data;
//        }else{
//         notify(response?.message, "error");
//         setItemList([]);
//         return [];
//        }
//       } catch (error) {
//         console.log(error);
//       }
//     } else if (isMedSearch) {
//       let payload = {
//         cmd: "item",
//         type: "1",
//         deptLedgerNo: userData?.deptLedgerNo,
//         q: value,
//         page: "1",
//         rows: 20,
//         sort: "ItemName",
//         order: "asc",
//         isWithAlternate: false,
//         isBarCodeScan: false,
//         PanelId: pateintDetails?.Panel
//           ? pateintDetails?.Panel
//           : pateintDetails?.Panel?.value,
//         isCashPanel: pateintDetails?.isCashPanel
//           ? pateintDetails?.isCashPanel
//           : 1,
//         isPackage: 0,
//       };
//       try {
//         let apiResp = await PharmacyMedicineItemSearch(payload);
//         return apiResp?.data;
//       } catch (error) {
//         console.log(error);
//       }
//     } else if (isIndentMedicineSearch) {
//       let payload = {
//         searchBy: "1",
//         itemName: value,
//         saleOn: saleOnList?.[0]?.TextField ? saleOnList?.[0]?.TextField : "",
//         PanelId: pateintDetails?.Panel
//           ? pateintDetails?.Panel
//           : pateintDetails?.Panel?.value,
//         isCashPanel: pateintDetails?.isCashPanel
//           ? pateintDetails?.isCashPanel
//           : 1,
//         isPackage: 0,
//       };
//       try {
//         let apiResp = await PharmacyMedicineItemSearch(payload);
//         return apiResp?.data;
//       } catch (error) {
//         console.log(error);
//       }
//     } else {
      
//       const payLoadList = {
//         scheduleChargeID: Number(
//           pateintDetails?.ScheduleChargeID
//             ? pateintDetails?.ScheduleChargeID
//             : "",
//         ),
//         panelID: Number(pateintDetails?.PanelID ? pateintDetails?.PanelID : ""),
//         ipdCaseTypeID: Number(
//           pateintDetails?.IPDCaseTypeID ? pateintDetails?.IPDCaseTypeID : "",
//         ),
//         itemName: value,
//         categoryID: Number(
//           payload?.Category?.value ? payload?.Category?.value : "",
//         ),
//         subcategory: Number(
//           payload?.SubCategoryID?.value ? payload?.SubCategoryID?.value : "",
//         ),
//         requestType: String(payload?.Type ? payload?.Type : ""),
//         IsInternational: pateintDetails?.IsInternational
//           ? pateintDetails?.IsInternational
//           : "2",
//         LedgerNumber: String(payload?.department?.value?payload?.department?.value:payload?.department) || "0",
//       };
//       try {
//         const response = await BindItem(payLoadList);
//         return response?.data;
//       } catch (error) {
//         console.log(error);
//       }
//     }
//   };

//   const search = (event) => {
//     const query = event?.query?.trim();
//     const requestId = searchRequestRef.current + 1;
//     searchRequestRef.current = requestId;

//     if (searchTimerRef.current) {
//       clearTimeout(searchTimerRef.current);
//     }

//     if (!query) {
//       setItems([]);
//       return;
//     }

//     searchTimerRef.current = setTimeout(async () => {
//       const item = await getbindIPDPatientDetails(query);

//       if (searchRequestRef.current === requestId) {
//         setItems(item || []);
//       }
//     }, 300);
//   };

//   const itemTemplate = (item) => {
//     // CORRECTED: Ensure AvlQty is not null or empty string before checking if it's 0
//     const isOutOfStock =
//       shouldShowAvailableQty &&
//       item?.AvlQty != null &&
//       item?.AvlQty !== "" &&
//       Number(item?.AvlQty) === 0;

//     return (
//       <div
//         className="p-clearfix"
//         style={isOutOfStock ? { opacity: 0.5, pointerEvents: "none" } : {}}
//       >
//         <div style={{ float: "left", fontSize: "16px !important", width: "100%" }}>
//           {(callfrom == "GRN" || callfrom == "Con"
//             ? item?.ItemName
//             : item?.TypeName) || item?.ItemName}

//           {shouldShowAvailableQty && (
//             <span
//               style={{
//                 float: "right",
//                 fontSize: "10px",
//                 color: isOutOfStock ? "red" : "#888",
//                 fontWeight: isOutOfStock ? "bold" : "normal",
//               }}
//             >
//               {item?.AvlQty}
//             </span>
//           )}
//         </div>
//       </div>
//     );
//   };

//   const handleSelectRow = (e) => {
//     const { value } = e;

//     // CORRECTED: Fixed early return bug and null check issue
//     if (payload?.Type === "MI") {
//       if (
//         shouldShowAvailableQty &&
//         value?.AvlQty != null &&
//         value?.AvlQty !== "" &&
//         Number(value?.AvlQty) === 0
//       ) {
//         notify("Item cannot be selected as Available Quantity is 0.", "error");
//         setValue("");
//         return; // Stops here ONLY if out of stock
//       }
//       // Removed the standalone `return` that was here, which prevented binding!
//     }

//     handleItemSelect(
//       (callfrom == "AssetGRN"
//         ? value?.Typename
//         : callfrom == "GRN" || callfrom == "Con"
//           ? value?.ItemName
//           : value?.TypeName),
//       value?.ItemID,
//       value,
//       e?.originalEvent?.type,
//       e,
//       index,
//     );
//     setValue(null);
//   };

//   return (
//     <div className="row">
//       <div className="col-12">
//         <AutoComplete
//           value={
//             callfrom == "GRN" || callfrom == "Con"
//               ? value
//                 ? value
//                 : itemName
//               : value ?? itemName?.label ?? itemName?.ItemName
//           }
//           suggestions={items ? items : itemsList}
//           completeMethod={search}
//           className={` w-100 ${(callfrom == "GRN" || callfrom == "Con") && "table-auto-complete table-auto-complete-custom"}`}
//           onSelect={(e) => handleSelectRow(e)}
//           id="searchtest"
//           onChange={(e) => {
//             setValue(e?.value === undefined ? null : e?.value);
//           }}
//           itemTemplate={itemTemplate}
//           disabled={disabled}
//         />
//         {callfrom == "GRN" || callfrom == "Con" || callfrom === "AssetGRN" ? (
//           <></>
//         ) : (
//           <label
//             className="label lable truncate "
//             style={{ fontSize: "5px !important" }}
//           >
//             {t("Search Item")}
//           </label>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SearchByMedicineItemName;
