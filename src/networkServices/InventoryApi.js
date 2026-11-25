import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";
import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";

import { aiFetch, AI_GENERATE_URL } from "../utils/aiClient";
export const BindItemGRN = async (payload) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetItemList}?itemName=${payload?.itemName}&storeTypeID=${payload?.storeTypeID}&isConsignment=${payload?.isConsignment}`,
      {
        method: "get",
      },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const BindGST = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GetTaxGroups, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const BindManufacturer = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GetManufacturer, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

//Gate Entry
export const GateEntryBindGateEntryItems = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GateEntryBindGateEntryItems, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const SaveGateEntry = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GateEntrySaveGateEntry, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const GateEntryUserValidate = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GateEntryUserValidate, {
      method: "get",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const GateEntrySearchGetEntry = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.EDPGateEntrySearchGetEntry, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const GateEntryGetPurchaseOrders = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GateEntryGetPurchaseOrders, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const GateEntryReport = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(
      apiUrls.GateEntryGateEntryGateEntryReport,
      {
        method: "post",
        data: payload,
      },
    );
    return data;
  } catch (error) {
    console.log(error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const BindGateEntryItems = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GateEntryBindGateEntryItems, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const UpdateGateEntry = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GateEntryUpdateGateEntry, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const SaveGRN = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(apiUrls.SaveGRN, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};
export const SaveStockAdjustment = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(apiUrls.SaveStockAdjustment, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};
/* Hold Stock Medicine: hold / un-hold batches of the logged-in department's stock. */
export const HoldStockGetFilters = async () => {
  try {
    return await makeApiRequest(apiUrls.HoldStockGetFilters, { method: "get" });
  } catch (error) {
    console.log(error);
  }
};
export const HoldStockGetItems = async (subCategoryID = 0) => {
  try {
    return await makeApiRequest(
      `${apiUrls.HoldStockGetItems}?SubCategoryID=${subCategoryID}`,
      { method: "get" },
    );
  } catch (error) {
    console.log(error);
  }
};
export const HoldStockSearch = async ({ subCategoryID = 0, itemID = 0, status = "All" }) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(
      `${apiUrls.HoldStockSearch}?SubCategoryID=${subCategoryID}&ItemID=${itemID}&Status=${status}`,
      { method: "get" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};
export const HoldStockSave = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(apiUrls.HoldStockSave, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};
/** Stock Adjustment (+): the items of a sub category with their batches of the last year. */
export const GetStockAdjustmentItems = async ({
  subCategoryID,
  minorGroupID = 0,
  departmentRoleID = 0,
}) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(
      `${apiUrls.GetStockAdjustmentItems}?SubCategoryID=${subCategoryID}&MinorGroupID=${minorGroupID}&DepartmentRoleID=${departmentRoleID}`,
      { method: "get" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};
export const GetItemPriviousHistory = async (id) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetItemPriviousHistoryURL}?ItemID=${id}`,
      {
        method: "get",
      },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const DeleteGRNItem = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(`${apiUrls.RemoveGRNItemURL}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};
export const UpdateGRN = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(apiUrls.UpdateGRN, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};
export const DirectGRNReport = async (payload) => {
  try {
    store.dispatch(setLoading(true));

    const data = await makeApiRequest(apiUrls.DirectGRNReport, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};
export const GetGRNList = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.GetGRNList, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};
export const updateInvoiceDetails = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.updateInvoiceDetails, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const GRNPost = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GRNPost, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const IsGRNUnpostPost = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.IsGRNUnpostPost, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const GRNReject = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GRNReject, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const BindGRNItems = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(apiUrls.BindGRNItems, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.split(",")?.[1];
      if (result) resolve(result);
      else reject(new Error("Unable to convert file to base64"));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
const parseGeminiJSON = (rawText = "") => {
  const cleaned = String(rawText)
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(cleaned);
};

export const readGRNInvoiceWithGemini = async (
  file,
  _unusedKey, // kept for existing callers; the key is on the server
  GEMINI_MODEL,
) => {

  const base64Image = await fileToBase64(file);

  const prompt = `
Extract data from a medical invoice/GRN image.

Return ONLY valid JSON:
{
  "invoiceNo": "",
  "invoiceDate": "",
  "supplier": { "name": "" },
  "items": [
    {
      "itemName": "",
      "hsn": "",
      "batchNo": "",
      "exp": "",
      "qty": 0,
      "mrp": 0,
      "rate": 0,
      "taxPercent": 0,
      "discPercent": 0
    }
  ]
}

Rules:
- Supplier = Supplier Name only
- invoiceDate = Invoice Date (not GRN Date)
- Extract all item rows
- itemName = product name
- discPercent = Dis / Dis% / DISC(%)
- mrp = MRP or NEW MRP (ignore OLD MRP)
- Keep decimals (mrp, rate)
- exp = date or MM/YY
- Missing → "" or 0
`;
  store.dispatch(setLoading(true));

  const response = await aiFetch(AI_GENERATE_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: file?.type || "image/png",
                  data: base64Image,
                },
              },
            ],
          },
        ],
      }),
    },
  );

  const data = await response.json();
  store.dispatch(setLoading(false));

  if (!response.ok) {
    throw new Error(data?.error?.message || "Gemini request failed");
  }

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("No text returned from Gemini");
  }

  return parseGeminiJSON(rawText);
};

export const ReprintGRN = async (payload) => {
  try {
    store.dispatch(setLoading(true));

    const data = await makeApiRequest(apiUrls.ReprintGRN, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));

    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};
export const ReprintGRNPrintbuilder = async (payload) => {
  try {
    store.dispatch(setLoading(true));

    const data = await makeApiRequest(apiUrls.ReprintGRNPrintbuilder, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));

    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};

export const GetDepartmentDetails = async (sendPayload) => {
  store.dispatch(setLoading(true));
  /* storeTypeID - screen par chuna hua Store Type.

     Pehle sirf roleID jaata tha aur server item ki ConfigID role se tay karta
     tha. Ab Store Type bhi jaata hai, taaki wo chunav ginti me aaye. Na bheja
     jaye to 0 jaata hai aur server pehle jaisa hi chalta hai. */
  const { searchKey, roleID, storeTypeID } = sendPayload;
  try {
    const data = await makeApiRequest(
      // `${apiUrls.LoadStock}?SearchType=${searchKey}&deptLedgerNo=${deptLedgerNo}`,
      `${apiUrls.LoadStock}?SearchType=${searchKey}&RoleID=${roleID}&StoreTypeID=${
        Number(storeTypeID) || 0
      }`,
      {
        method: "get",
        data: { searchKey },
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const BindVendor = async (StoreTypeID) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(
      `${apiUrls.BindVendor}?StoreTypeID=${0}`,//all vendor bind medical and general store
      {
        method: "get",
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};

export const ConsumeBindItem = async (StoreTypeID) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.ConsumeBindItem}?StoreTypeID=${StoreTypeID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const ShowStock = async (ItemID) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.ShowStock}?ItemID=${ItemID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const BindStock = async (ItemID, DeptLedNo) => {
  try {
    const url = `${apiUrls.BindStock}?ItemID=${ItemID}&DeptLedNo=${DeptLedNo}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const SaveConsumeApi = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.SaveConsume, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};
export const SearchStock = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SearchStock, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const GetDataToFill = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GetDataToFill, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const StockTakeSaveData = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.StockTakeSaveData, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const SearchDetail = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(apiUrls.SearchDetail, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};

export const BindSubGroup = async (StorLedgerNo) => {
  try {
    const url = `${apiUrls.BindSubGroup}?StorLedgerNo=${StorLedgerNo}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const View = async (Dept, IndentNo) => {
  try {
    const url = `${apiUrls.View}?&IndentNo=${IndentNo}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const ViewDetail = async (Status, IndentNo) => {
  try {
    const url = `${apiUrls.ViewDetail}?Status=${Status}&IndentNo=${IndentNo}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const PrintIssue = async (IndentNo, ReportType) => {
  try {
    const url = `${apiUrls.PrintIssue}?IndentNo=${IndentNo}&ReportType=${2}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const SaveIssueDepartment = async (payload) => {
  try {
    /* The longest call on the Department Issue screen - it writes the issue, the stock
       and the sales rows for every batch of every item. It was the one call on that screen
       that raised no loader, so the screen sat there looking untouched while it ran and
       the first spinner to appear was a later call's. */
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(apiUrls.SaveIssueDepartment, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const DirectDepartmentIssueReport = async (salesNo) => {
  try {
    // Runs straight after the save, building the issue slip. Same reason as above.
    store.dispatch(setLoading(true));
    const url = `${apiUrls.DirectDepartmentIssueReport}?SalesNo=${salesNo}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const GetStockItem = async (ItemID, RoleId = 0) => {
  try {
    // RoleId is the store the screen is working as; 0 means the session's own role.
    const url = `${apiUrls.GetStockItem}?ItemID=${ItemID}&RoleId=${Number(RoleId) || 0}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};

/* Takes a transferred requisition into the receiving store's stock - the f_stock rows the
   transfer wrote at IsPost 5 become IsPost 1. Only rows still waiting are moved, so
   receiving twice is harmless. */
export const ViewRequisitionReceiveTransfer = async (IndentNo) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.ViewRequisitionReceiveTransfer}?IndentNo=${encodeURIComponent(IndentNo ?? "")}`,
      { method: "get" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};

export const ViewRequisition = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.ViewRequisition, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};

export const ViewIndent = async (IndentNo, Status, Type, TID) => {
  try {
    const url = `${apiUrls.ViewIndent}?IndentNo=${IndentNo}&Status=${Status},&Type=${Type}&TID=${TID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
// Nursing reject of a medicine indent: whole indent (no ItemID) or one item.
// The server refuses if medicine was already issued against it.
export const NursingRejectIndent = async (IndentNo, ItemID, RejectReason) => {
  try {
    const url = `${apiUrls.NursingRejectIndent}?IndentNo=${encodeURIComponent(IndentNo)}&ItemID=${encodeURIComponent(ItemID ?? "")}&RejectReason=${encodeURIComponent(RejectReason)}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const Reject = async (RejectResion, ItemID, IndentNo) => {
  try {
    const url = `${apiUrls.Reject}?RejectResion=${RejectResion}&ItemID=${ItemID}&IndentNo=${IndentNo}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const Approve = async (IndentNo) => {
  try {
    const url = `${apiUrls.Approve}?IndentNo=${IndentNo}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const PrintRequisition = async (IndentNo, Status, Type) => {
  try {
    store.dispatch(setLoading(true));
    const url = `${apiUrls.PrintRequisition}?IndentNo=${IndentNo}&Status=${Status}&Type=${Type}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const BindPhysicalData = async (StoreLedgerNo) => {
  try {
    const url = `${apiUrls.BindPhysicalData}?StoreTypeID=${StoreLedgerNo}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const GridView1_RowCommand = async (EntryNo, Type, StoreType) => {
  try {
    const url = `${apiUrls.GridView1_RowCommand}?EntryNo=${EntryNo}&Type=${Type}&StoreTypeID=${StoreType}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BindMedicineStoreDepartment = async (DeptID) => {
  try {
    const url = `${apiUrls.BindMedicineStoreDepartment}?Dept_RoleID=${DeptID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BindStoreGroup = async (DeptLedgerNo) => {
  try {
    const url = `${apiUrls.BindStoreGroup}?DeptLedgerNo=${DeptLedgerNo}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BindStoreSubCategory = async (CategoryID) => {
  try {
    const url = `${apiUrls.BindStoreSubCategory}?CategoryID=${CategoryID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BindStoreItems = async (Subcategory, ItemName) => {
  try {
    const url = `${apiUrls.BindStoreItems}?Subcategory=${Subcategory}&ItemName=${ItemName}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const IssueDetail = async () => {
  try {
    const url = `${apiUrls.IssueDetail}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BindUser = async () => {
  try {
    const url = `${apiUrls.BindUser}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BindSearchSalesItem = async () => {
  store.dispatch(setLoading(true));

  try {
    const url = `${apiUrls.BindSearchSalesItem}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));

    return data;
  } catch (error) {
    store.dispatch(setLoading(false));

    throw error;
  }
};

export const SearchSales = async (payload) => {
  try {
    store.dispatch(setLoading(true));

    const data = await makeApiRequest(apiUrls.SearchSales, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));

    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};
export const SearchSalesPrint = async (payload) => {
  try {
    store.dispatch(setLoading(true));

    const data = await makeApiRequest(apiUrls.SearchSalesPrint, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));

    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};

export const StoreCommonReceiptPdf = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.StoreCommonReceiptPdf}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.log(error, "error");
    store.dispatch(setLoading(false));
  }
};

export const StoreCommonReceiptReportIPD = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.StoreCommonReceiptReportIPD}`,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.log(error, "error");
    store.dispatch(setLoading(false));
  }
};

export const MedicalStoreThermalPDF = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.MedicalStoreThermalPrint}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.log(error, "error");
    store.dispatch(setLoading(false));
  }
};

export const PharmacyPrintLabelItem = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.PharmacyPrintLabel}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.log(error, "error");
    store.dispatch(setLoading(false));
  }
};

export const PharmacyPrintBarcodeItem = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.PharmacyPrintBarcode}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.log(error, "error");
    store.dispatch(setLoading(false));
  }
};

export const BindItemForLabelPrint = async (LedgerTnxID) => {
  try {
    const url = `${apiUrls.BindItemForLabelPrint}?TransactionID=${LedgerTnxID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const GetConsignmentList = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GetConsignmentList, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const BindConsignmentItemList = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.BindConsignmentItemList, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const ReportDetail = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.ReportDetail}`, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.log(error, "error");
    store.dispatch(setLoading(false));
  }
};

export const LoadStock = async (DeptLedgerNo) => {
  try {
    const url = `${apiUrls.LoadStock}?DeptLedgerNo=${DeptLedgerNo}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const SearchItem = async (ItemID, RoleID = 0) => {
  try {
    // RoleID is the store the screen is working as; 0 means the session's own role.
    const url = `${apiUrls.SearchItem}?ItemID=${ItemID}&RoleID=${Number(RoleID) || 0}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const getBindDetails = async (TID, Type) => {
  try {
    const url = `${apiUrls.getBindDetails}?TID=${TID}&Type=${Type}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const medViewRequisition = async (IndentNo, TID) => {
  try {
    const url = `${apiUrls.medViewRequisition}?IndentNo=${IndentNo}&TID=${TID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const ConsignmentPost = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.ConsignmentPost, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const ConsignmentCancelAll = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.ConsignmentCancelAll, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const GRNViewUploadfile = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(apiUrls.GRNViewUploadfile, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    console.log(error);
    store.dispatch(setLoading(false));
  }
};
// export const GRNFetchBindAttachment = async (payload) => {
//   try {
//     store.dispatch(setLoading(true));
//     const data = await makeApiRequest(apiUrls.GRNFetchBindAttachment, {
//       method: "post",
//       data: payload,
//     });
//     store.dispatch(setLoading(false));
//     return data;
//   } catch (error) {
//     console.log(error);
//     store.dispatch(setLoading(false));
//   }
// };
export const GRNBindPdf = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GRNBindPdf, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const ConsignmentRejectItem = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.ConsignmentRejectItem, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const GetConsignmentEditDetails = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.GetConsignmentEditDetails, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));

    return data;
  } catch (error) {
    store.dispatch(setLoading(false));

    console.log(error);
  }
};
export const SaveDirectMedicalIssue = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(apiUrls.SaveDirectMedicalIssue, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};

export const FromDepartment = async (StoreLedgerNo, CentreID) => {
  try {
    const url = `${apiUrls.FromDepartment}?StoreTypeID=${StoreLedgerNo}&CentreID=${CentreID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const ReturnBindItem = async (Dept, StoreType, CenterID) => {
  try {
    const url = `${apiUrls.ReturnBindItem}?ToRoleID=${Dept}&StoreTypeID=${StoreType}&CentreID=${CenterID} `;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const SearchDirectDepartment = async (payload, TransactionType) => {
  try {
    store.dispatch(setLoading(true));
    const url = `${apiUrls.SearchDirectDepartment}?FromDate=${payload?.FromDate}&ToDate=${payload?.ToDate}&SalesNo=${payload?.SalesNo}&TransactionType=${TransactionType}&StoreTypeID=${payload?.StoreTypeID || 0}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const SearchDepartmet = async (
  ItemID,
  StoreType,
  FromDept,
  CentreID,
) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.SearchDepartmet}?ItemID=${ItemID}&StoreTypeID=${StoreType}&FromRoleID=${FromDept}&CentreID=${CentreID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const BarCode = async (Dept, StockID) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.BarCode}?Dept=${Dept}&StockID=${StockID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const ReturnBindVendor = async (StoreType, useMaster = false) => {
  try {
    // useMaster: supplier names from the vendor master (View Supplier Return edit popup).
    const url = `${apiUrls.ReturnBindVendor}?StoreTypeID=${StoreType}${useMaster ? "&UseMaster=true" : ""}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const SaveFromDepartment = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(apiUrls.SaveFromDepartment, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};

export const PatientReturnReport = async (SalesNo, Dept) => {
  try {
    const url = `${apiUrls.PatientReturnReport}?SalesNo=${SalesNo}&Dept=${Dept}&ReportType=${2}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const ConsignmentStockItemList = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.ConsignmentStockItemList, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const AddItemList = async (ItemId) => {
  try {
    const url = `${apiUrls.AddConsignmentStockItemList}?ItemId=${ItemId}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const SaveConsignment = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveConsignmentStockTransfer, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const BindConsignmentVendorList = async (ItemId) => {
  try {
    const url = `${apiUrls.BindConsignmentVendorList}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const ConsignmentReturnSearchList = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.ConsignmentReturnSearchList, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.log(error);
  }
};
export const SaveConsignmentItemReturnList = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveConsignmentItemReturnList, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const ConsignmentReturnPrint = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.ConsignmentReturnPrint, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const PatientSearchList = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.PatientSearchList, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const BindPatientDetailsList = async (TransactionID, PName) => {
  try {
    const url = `${apiUrls.BindPatientDetailsList}?TransactionID=${TransactionID}&PatientID=${PName}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const ConsignmentReceivePrint = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.ConsignmentReceivePrint, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const BindItemSupplair = async (payloadData) => {
  try {
    const url = `${apiUrls.BindItemSupplair}?StoreTypeID=${payloadData?.storeType}&VendorID=${payloadData?.vendorID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
// View Supplier Return (15-Nov-2026). Errors come back as { success: false, message }.
const srvCall = async (url, options) => {
  store.dispatch(setLoading(true));
  try {
    return await makeApiRequest(url, options);
  } catch (error) {
    return { success: false, message: error?.message || "Something went wrong" };
  } finally {
    store.dispatch(setLoading(false));
  }
};
export const SupplierReturnViewSearch = (payload) =>
  srvCall(apiUrls.SupplierReturnViewSearch, { method: "POST", data: payload });
// key = { salesNo, storeTypeID, vendorID, entryMinute } (one save of a supplier return)
const srvKeyQuery = (k) =>
  `SalesNo=${k.salesNo}&StoreTypeID=${k.storeTypeID}&VendorID=${k.vendorID}&EntryMinute=${encodeURIComponent(k.entryMinute || "")}`;
export const SupplierReturnViewDetail = (key) =>
  srvCall(`${apiUrls.SupplierReturnViewDetail}?${srvKeyQuery(key)}`, { method: "get" });
export const SupplierReturnViewUpdate = (payload) =>
  srvCall(apiUrls.SupplierReturnViewUpdate, { method: "POST", data: payload });
export const SupplierReturnViewPost = (payload) =>
  srvCall(apiUrls.SupplierReturnViewPost, { method: "POST", data: payload });
export const SupplierReturnViewUnPost = (payload) =>
  srvCall(apiUrls.SupplierReturnViewUnPost, { method: "POST", data: payload });
export const SupplierReturnViewPrint = (key) =>
  srvCall(`${apiUrls.SupplierReturnViewPrint}?${srvKeyQuery(key)}`, { method: "get" });

export const SearchSupplair = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.SearchSupplair}`;
    const data = await makeApiRequest(url, {
      method: "POST",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const SearchItemType = async (search, userValidateID) => {
  try {
    const query = encodeURIComponent(search || "");
    const userValidateParam = userValidateID
      ? `&UserValidateID=${encodeURIComponent(userValidateID)}`
      : "";
    const url = `${apiUrls.SearchItemType}?Search=${query}${userValidateParam}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const SaveSupplair = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveSupplair, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// Supplier Return drafts. Saving a draft blocks the stock straight away and
// deleting one releases it again - both handled on the server.
export const SaveSupplairDraft = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveSupplairDraft, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const GetSupplairDrafts = async () => {
  try {
    const data = await makeApiRequest(apiUrls.GetSupplairDrafts, {
      method: "get",
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const GetSupplairDraftDetail = async (DraftID) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetSupplairDraftDetail}?DraftID=${DraftID}`,
      {
        method: "get",
      },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};

// The draft rows that have just become a real return: their block is released
// and the rows are removed, leaving the quantity deducted exactly once.
export const DeleteSupplairDraftItems = async (DraftDetailIDs) => {
  try {
    const data = await makeApiRequest(apiUrls.DeleteSupplairDraftItems, {
      method: "post",
      data: DraftDetailIDs,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const DeleteSupplairDraft = async (DraftID) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.DeleteSupplairDraft}?DraftID=${DraftID}`,
      {
        method: "delete",
      },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const SupplierReturnPrint = async (SalesNo, StoreTypeID) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.SupplierReturnPrint}?SalesNo=${SalesNo}&StoreTypeID=${StoreTypeID ?? ""}`,
      {
        method: "get",
      },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const SupplierReturnList = async (params) => {
  try {
    const query = new URLSearchParams({
      FromDate: params?.FromDate ?? "",
      ToDate: params?.ToDate ?? "",
      StoreTypeID: params?.StoreTypeID ?? "",
      VendorID: params?.VendorID ?? "",
      SalesNo: params?.SalesNo ?? "",
    }).toString();
    const data = await makeApiRequest(`${apiUrls.SupplierReturnList}?${query}`, {
      method: "get",
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const SaveVendorCreditNote = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveVendorCreditNote, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const VendorCreditNoteList = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.VendorCreditNoteList, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const SaveRGP = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.RGPSaveRGP, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const consignmentReturnSearch = async (TransNo, PatientName, Dept) => {
  try {
    const url = `${apiUrls.consignmentReturnSearch}?TransNo=${TransNo}&PatientName=${PatientName}&Dept=${Dept}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const ConsignmentBindItem = async (TID) => {
  try {
    const url = `${apiUrls.ConsignmentBindItem}?TID=${TID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BindPatientReturn = async (TID) => {
  try {
    const url = `${apiUrls.BindPatientReturn}?TID=${TID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const ReturnItem = async (TID, ItemID) => {
  try {
    const url = `${apiUrls.ReturnItem}?TID=${TID}&ItemID=${ItemID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const MasterSearchItem = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.MasterSearchItem, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const ConsignmentSave = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.ConsignmentSave, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const SaveManufacture = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveManufacture, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const SaveVendor = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveVendor, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const UpdateVendor = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.UpdateVendor, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const BindTerms = async () => {
  try {
    const url = `${apiUrls.BindTerms}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const VendorReportList = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.VendorForExcelReport, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const ItemMasterBindGroup = async (
  IsAsset,
  CategoryId,
  CategoryName,
) => {
  try {
    const url = `${apiUrls.ItemMasterBindGroup}?IsAsset=${IsAsset}&CategoryId=${CategoryId}&CategoryName=${CategoryName}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BindManufactureData = async (IsAsset) => {
  try {
    // The API takes `bool IsAsset`, which binds only "true"/"false"; callers pass 0/1,
    // "0"/"1" or booleans, and "0" comes back as 400 "The value '0' is not valid".
    const isAsset = IsAsset === true || String(IsAsset).toLowerCase() === "true" || String(IsAsset) === "1";
    const url = `${apiUrls.BindManufactureData}?IsAsset=${isAsset}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BindSaltItem = async (ItemID) => {
  try {
    const url = `${apiUrls.BindSaltItem}?ItemID=${ItemID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
// export const GetPurchaseOrders = async (StoreType,purchaseOrderFromDate,purchaseOrderToDate,purchaseOrderNumber,vendorID) => {
//   try {
//     const url = `${apiUrls.GetPurchaseOrders}?StoreType=${StoreType}&purchaseOrderFromDate=${purchaseOrderFromDate}&purchaseOrderToDate=${purchaseOrderToDate}&purchaseOrderNumber=${purchaseOrderNumber}&vendorID=${vendorID}`;
//     const data = await makeApiRequest(url, {
//       method: "get",
//     });
//     return data;
//   } catch (error) {
//     throw error;
//   }
// };

export const GetPurchaseOrders = async (
  StoreType,
  purchaseOrderFromDate,
  purchaseOrderToDate,
  purchaseOrderNumber,
  vendorID,
) => {
  try {
    let queryParams = new URLSearchParams({
      StoreType,
      purchaseOrderFromDate,
      purchaseOrderToDate,
    });
    if (purchaseOrderNumber) {
      queryParams.append("purchaseOrderNumber", purchaseOrderNumber);
    }
    if (vendorID) {
      queryParams.append("vendorID", vendorID);
    }

    const url = `${apiUrls.GetPurchaseOrders}?${queryParams.toString()}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });

    return data;
  } catch (error) {
    throw error;
  }
};

export const BindVatType = async () => {
  try {
    const url = `${apiUrls.BindVatType}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BindVatLine = async () => {
  try {
    const url = `${apiUrls.BindVatLine}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BindSaleVatType = async (IsAsset) => {
  try {
    const url = `${apiUrls.BindSaleVatType}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BindSaleVatLine = async () => {
  try {
    const url = `${apiUrls.BindSaleVatLine}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BindDrugCategoryMaster = async () => {
  try {
    const url = `${apiUrls.BindDrugCategoryMaster}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BindMajorUnit = async () => {
  try {
    const url = `${apiUrls.BindMajorUnit}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BindMinorUnit = async () => {
  try {
    const url = `${apiUrls.BindMinorUnit}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BindServiceItems = async () => {
  try {
    const url = `${apiUrls.BindServiceItems}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const Bind_Active_salt = async () => {
  try {
    const url = `${apiUrls.Bind_Active_salt}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const viewItem = async (IndentNo, Status) => {
  try {
    store.dispatch(setLoading(true));
    const url = `${apiUrls.viewItem}?IndentNo=${IndentNo}&Status=${Status}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const SearchVendor = async (SupplierName) => {
  try {
    store.dispatch(setLoading(true));
    const url = `${apiUrls.SearchVendor}?SupplierName=${SupplierName}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const GetItemNameList = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(apiUrls.BindInventoryGrid, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  } finally {
    // In a finally, not after the await: a failed search has to clear the overlay too,
    // or one error leaves the screen locked behind a spinner that never stops.
    store.dispatch(setLoading(false));
  }
};
export const ManufactureReportList = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls?.ManufactureReportList, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const UpdateManufacture = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.UpdateManufacture, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const SaveNewItem = async (payload) => {
  try {
    /* Saving an item writes the item, its units, taxes, groups and salts, so it is not
       quick. Without this the Save button left the screen looking untouched and invited a
       second click - and the overlay also blocks that second click while it runs. */
    store.dispatch(setLoading(true));
    const data = await makeApiRequest(apiUrls.SaveNewItem, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

/* ---------------------------------------------------------------------------
 * SRSSAIH-2026-0061 · Point 1 — Item Master enhancements
 * ------------------------------------------------------------------------- */

// P1.1 — preview of the next item code. Display only; the real code is allocated
// server-side inside the save transaction.
export const GetNextItemCode = async () => {
  try {
    const data = await makeApiRequest(apiUrls.GetNextItemCode, {
      method: "get",
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// Reads back the Point 1 fields on edit. The item search grid is served by a stored
// procedure that does not return them, so edit mode fetches them separately.
export const GetItemExtendedDetail = async (ItemID) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetItemExtendedDetail}?ItemID=${ItemID}`,
      { method: "get" },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};

// P1.2 — Minor Group, scoped to the selected subcategory.
export const BindMinorGroup = async (SubCategoryID = 0) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.BindMinorGroup}?SubCategoryID=${SubCategoryID || 0}`,
      { method: "get" },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const SaveMinorGroup = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveMinorGroup, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// Store Item Master inline Edit: rename a Category / SubCategory / Sub SubCategory /
// Purchase Unit / Sale Unit. payload: { masterType, id, oldName, newName }
// Store Item Master: Division Name dropdown + inline add.
export const BindDivision = async () => {
  try {
    return await makeApiRequest(apiUrls.BindDivision, { method: "get" });
  } catch (error) {
    console.log(error);
  }
};
export const SaveDivision = async (payload) => {
  try {
    return await makeApiRequest(apiUrls.SaveDivision, { method: "post", data: payload });
  } catch (error) {
    console.log(error);
  }
};

export const RenameMasterOption = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.RenameMasterOption, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// P1.4 — Marketed By.
export const BindMarketedBy = async () => {
  try {
    const data = await makeApiRequest(apiUrls.BindMarketedBy, {
      method: "get",
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// Marketed By Master page: every Marketed By of the centre, active and inactive.
export const MarketedByList = async () => {
  try {
    const data = await makeApiRequest(apiUrls.MarketedByList, {
      method: "get",
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const SaveMarketedBy = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveMarketedBy, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// Inline "Add New" for the two unit pickers on Item Master, mirroring SaveMarketedBy.
// Purchase Unit reads f_purchase_unit_master, Sale Unit reads f_unit_master, so they
// stay two separate endpoints rather than one with a type flag.
export const SavePurchaseUnit = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SavePurchaseUnit, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const SaveSaleUnit = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveSaleUnit, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// P1.7 / P1.8 — type-ahead for the sound-alike / look-alike pickers. Kept as a search
// rather than a full item list: the master runs to thousands of rows.
// ConfigIDs optionally narrows the search to an item group. Blank searches everything,
// which is what Item Master's sound-alike / look-alike pickers want; the pharmacy discount
// screen passes the medical group so it cannot offer lab or radiology items.
export const SearchItemForAlike = async (
  SearchName,
  ExcludeItemID = 0,
  ConfigIDs = "",
) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.SearchItemForAlike}?SearchName=${encodeURIComponent(
        SearchName || "",
      )}&ExcludeItemID=${ExcludeItemID || 0}&ConfigIDs=${encodeURIComponent(
        ConfigIDs || "",
      )}`,
      { method: "get" },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};

/* ---------------------------------------------------------------------------
 * SRSSAIH-2026-0061 · Point 2 — Generic Master and Mapping
 * ------------------------------------------------------------------------- */

// Paged list view. Paging is server-side: the item master runs to thousands of rows.
export const GetMappingList = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GetMappingList, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// All generic rows for one item — the mapping popup, combination drugs included.
export const GetItemMapping = async (ItemID) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetItemMapping}?ItemID=${ItemID}`,
      { method: "get" },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};

// The popup's single search box. Each result carries its full ATC chain so one pick
// fills L1, L2, L3, main and sub in a single action.
export const SearchGenericOrSalt = async (SearchName) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.SearchGenericOrSalt}?SearchName=${encodeURIComponent(
        SearchName || "",
      )}`,
      { method: "get" },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const BindATCLevel = async (LevelNo, ParentATCLevelID = 0) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.BindATCLevel}?LevelNo=${LevelNo}&ParentATCLevelID=${
        ParentATCLevelID || 0
      }`,
      { method: "get" },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};

/**
 * SRSSAIH-2026-0061 P2b — every ATC level for one generic, derived server-side from the
 * generic's single stored anchor. Used to fill L1..L5 when the generic is chosen from the
 * dropdown; the search box gets the same chain back on each hit.
 */
export const GetGenericATC = async (SaltID) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetGenericATC}?SaltID=${SaltID || 0}`,
      { method: "get" },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};

/** SRSSAIH-2026-0061 P2c — paged Generic Master list, each row with its ATC chain. */
export const GetGenericMasterList = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GetGenericMasterList, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

/** SRSSAIH-2026-0061 P2c — create or update one generic, classification included. */
export const SaveGenericMasterFull = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveGenericMasterFull, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

/**
 * SRSSAIH-2026-0061 P2g — save a generic's name and ATC classification together.
 *
 * One call for one dialog: splitting it made a half-applied edit possible (name saved,
 * classification failed). Narrower than the master's save — the parent and active flag are
 * not accepted, so the mapping popup cannot restructure the generic tree.
 */
export const SaveGenericDefinition = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveGenericDefinition, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const SaveATCLevel = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveATCLevel, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// ParentSaltID 0 returns main generics; a real id returns that main's sub generics;
// -1 returns every sub generic. ATCLevelID > 0 keeps only generics classified under
// that node (P2j — the Manage Generic Master popup filters by the selected level).
export const BindGenericList = async (ParentSaltID = 0, ATCLevelID = 0) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.BindGenericList}?ParentSaltID=${ParentSaltID || 0}&ATCLevelID=${
        ATCLevelID || 0
      }`,
      { method: "get" },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const SaveGenericMaster = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveGenericMaster, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

/** SRSSAIH-2026-0061 P2h — every active sub generic with its main generic, for the
    item mapping picker. One call, because the screen maps by sub generic only. */
export const BindSubGenericList = async () => {
  try {
    const data = await makeApiRequest(apiUrls.BindSubGenericList, {
      method: "get",
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

/** SRSSAIH-2026-0061 P2h — counts for the masters strip on the mapping screen. */
export const GetGenericMasterSummary = async () => {
  try {
    const data = await makeApiRequest(apiUrls.GetGenericMasterSummary, {
      method: "get",
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// Single save and "Map selected together" share this endpoint — one item id or many.
// Without overwriteExisting, the bulk path returns requiresConfirmation instead of
// silently replacing mappings that already exist.
export const SaveItemMapping = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveItemMapping, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

/* ---------------------------------------------------------------------------
 * SRSSAIH-2026-0061 · Point 3 — Department ROL / ROQ / Classification Master
 * ------------------------------------------------------------------------- */

// The editable grid. Returns stock in hand and quarterly consumption per row, plus the
// month window those consumption figures were taken from.
export const DeptNormGetItems = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.DeptNormGetItems, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// "Save all changes (n)" — every dirty row in one transaction.
export const DeptNormSaveBulk = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.DeptNormSaveBulk, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// Validate-then-commit. Call once with commit=false for the preview, again with
// commit=true once the user accepts it.
export const DeptNormImportExcel = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.DeptNormImportExcel, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const DeptNormBindRack = async (RoleID = 0) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.DeptNormBindRack}?RoleID=${RoleID || 0}`,
      { method: "get" },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};

// RackID for the filter panel's cascade; RoleID (with RackID 0) for the grid, which needs
// every shelf in the department because rows can sit on different racks.
export const DeptNormBindShelf = async (RackID = 0, RoleID = 0) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.DeptNormBindShelf}?RackID=${RackID || 0}&RoleID=${RoleID || 0}`,
      { method: "get" },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const DeptNormBindType = async () => {
  try {
    const data = await makeApiRequest(apiUrls.DeptNormBindType, {
      method: "get",
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const DeptNormBindClass = async () => {
  try {
    const data = await makeApiRequest(apiUrls.DeptNormBindClass, {
      method: "get",
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// The four inline "+ New ..." actions on the filter panel and bulk bar.
export const DeptNormSaveRack = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.DeptNormSaveRack, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const DeptNormSaveShelf = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.DeptNormSaveShelf, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const DeptNormSaveType = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.DeptNormSaveType, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const DeptNormSaveClass = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.DeptNormSaveClass, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

/* ---------------------------------------------------------------------------
 * SRSSAIH-2026-0061 · Point 8 — Map item with Panel / Panel Group
 * ------------------------------------------------------------------------- */

export const PanelItemMapGetItems = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.PanelItemMapGetItems, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// Groups come back with their active panel count — that is what the locked
// "All n panels in group" chip displays.
export const PanelItemMapBindPanelGroup = async () => {
  try {
    const data = await makeApiRequest(apiUrls.PanelItemMapBindPanelGroup, {
      method: "get",
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const PanelItemMapBindPanel = async (PanelGroupID = 0) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.PanelItemMapBindPanel}?PanelGroupID=${PanelGroupID || 0}`,
      { method: "get" },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const PanelItemMapGetItemMapping = async (ItemID) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.PanelItemMapGetItemMapping}?ItemID=${ItemID}`,
      { method: "get" },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const PanelItemMapSaveBulk = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.PanelItemMapSaveBulk, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// Group mappings are expanded at save time, so adding a panel to a group does not
// retroactively widen existing mappings. This is the explicit opt-in to that change.
export const PanelItemMapReapplyGroup = async (PanelGroupID) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.PanelItemMapReapplyGroup}?PanelGroupID=${PanelGroupID}`,
      { method: "post" },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};

// P8.2 — the consumer API for the OPD and IPD pharmacy issue screens, and the contract
// Point 7 is built against. Takes a LIST of item ids to avoid an N+1 per indent line.
export const IsItemAllowedForPanel = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.IsItemAllowedForPanel, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

/* ---------------------------------------------------------------------------
 * SRSSAIH-2026-0061 · Point 4 — Pharmacy Discount Master
 * ------------------------------------------------------------------------- */

// "Apply filters" — the items a rule would cover, each with its current effective
// discount and its category cap.
export const DiscountPreviewScope = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.DiscountPreviewScope, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const DiscountSaveRule = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.DiscountSaveRule, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const DiscountGetCaps = async () => {
  try {
    const data = await makeApiRequest(apiUrls.DiscountGetCaps, {
      method: "get",
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// The resolver. Returns the matching rule id alongside the percentage — "rule 47,
// specific item" is answerable at the counter in a way that "12.5%" is not.
// NOTE: not yet called by any billing path. See the Point 4 doc before wiring it in.
/**
 * SRSSAIH-2026-0061 P7C — read-only. For each indented item: is it payable on the patient's
 * panel, and if not, which same-salt medicine that IS mapped to the panel should go out.
 */
/**
 * SRSSAIH-2026-0061 P7D - every substitute for a blocked indent line, batch by batch,
 * earliest expiry first.
 *
 * Resolve answers "what should this become", which is what an automatic swap needs.
 * This answers "what could this become, and how much of each is on the shelf", which is
 * what a pharmacist allocating a quantity by hand needs.
 *
 * Pass TransactionID: the indent popup clears the selected patient as it opens, so the
 * screen often does not know the panel at the moment it asks. The server looks it up.
 */
/**
 * SRSSAIH-2026-0061 P7F — read the substitution log for one admission (or patient, or
 * indent), so the ward screens can show what was actually handed over.
 *
 * GET with query params rather than a body: it is a read, and the two callers are a
 * requisition list and a drug chart that both re-fetch on navigation.
 */
export const SubstitutionLog = async ({
  indentNo = "",
  patientID = "",
  transactionID = 0,
} = {}) => {
  try {
    const qs = [
      indentNo ? `IndentNo=${encodeURIComponent(indentNo)}` : "",
      patientID ? `PatientID=${encodeURIComponent(patientID)}` : "",
      Number(transactionID) > 0 ? `TransactionID=${Number(transactionID)}` : "",
    ]
      .filter(Boolean)
      .join("&");

    const data = await makeApiRequest(`${apiUrls.SubstitutionLog}?${qs}`, {
      method: "get",
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const SubstitutionOptions = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SubstitutionOptions, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const SubstitutionResolve = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SubstitutionResolve, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

/**
 * SRSSAIH-2026-0061 P7C — make the swap durable: point the indent line at what is actually
 * issued and record what was asked for. One call for the whole issue.
 */
export const SubstitutionApply = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SubstitutionApply, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const ResolveDiscount = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.ResolveDiscount, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

/* ---------------------------------------------------------------------------
 * SRSSAIH-2026-0061 · Point 5 — GRN accounts posting and price rules.
 *
 * Every behaviour is behind its own fin_global_resources flag, all shipped OFF.
 * GRNGetFeatureFlags is the single place the screens ask what is switched on, so no
 * screen has to re-derive it from the global resources list.
 * ------------------------------------------------------------------------- */

export const GRNGetFeatureFlags = async () => {
  try {
    const data = await makeApiRequest(apiUrls.GRNGetFeatureFlags, {
      method: "get",
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// Post status for a page of GRN numbers in one call — the GRN list itself comes from a
// stored procedure that cannot be widened from the repo.
export const GRNGetPostStatus = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GRNGetPostStatus, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const GRNMarkAccountPosted = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GRNMarkAccountPosted, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// Locked shut by default — GRNAccountPostReversalRoles ships empty, meaning nobody.
export const GRNReverseAccountPost = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GRNReverseAccountPost, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// change only the Credit Note Amount of a GRN (allowed after it is posted)
export const GRNUpdateCreditNote = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GRNUpdateCreditNote, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// mark a GRN as posted in Accounts (f_stock.IsAccountPosted) - locks its Credit Note
export const GRNMarkAccountPostedStock = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GRNMarkAccountPostedStock, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const GRNIsLocked = async (GRNNumber, StoreTypeID = 0) => {
  try {
    const data = await makeApiRequest(
      `${apiUrls.GRNIsLocked}?GRNNumber=${encodeURIComponent(
        GRNNumber || "",
      )}&StoreTypeID=${StoreTypeID || 0}`,
      { method: "get" },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};

// P5.5 — unit-aware: rate is per purchase unit and MRP per sale unit, so the server
// compares on one basis rather than raw MRP >= Rate.
export const GRNValidatePrices = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GRNValidatePrices, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// P5.6 — MRP from the selected purchase order.
export const GRNGetPOPrices = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GRNGetPOPrices, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const BindGeneric = async (params) => {
  store.dispatch(setLoading(true));
  try {
    const queryData = params?.event?.query;

    const urlWithParams = `${apiUrls.BindGeneric}?SearchType=${queryData ? queryData : "%%%%"}`;

    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(urlWithParams, options);
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const SaveGenericEdit = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveGenericEdit, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const AddNewGeneric = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.AddNewGeneric, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

// export const SearchGenericItem = async (payload) => {

//   try {
//     console.log("Payload" , payload)
//     const SearchType = payload?.SearchType;
//     const url = `${apiUrls.SearchGenericItem}?SearchType=${SearchType}`;
//     console.log("urls",url)
//     const data = await makeApiRequest(url, {
//       method: "get",
//     });
//     return data;
//   } catch (error) {
//     throw error;
//   }
// };

export const SearchGenericItem = async (params) => {
  store.dispatch(setLoading(true));

  try {
    const querydata = params?.event?.query;

    const urlWithParams = `${apiUrls.SearchGenericItem}?SearchType=${querydata}`;

    const options = {
      method: "GET",
    };

    const data = await makeApiRequest(urlWithParams, options);

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    console.error("Error Found", error);
  }
};

export const BindUnitMaster = async () => {
  try {
    const url = `${apiUrls.BindUnitMaster}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BindItemIdList = async (itemId) => {
  try {
    const url = `${apiUrls.BindItemIdList}?itemId=${itemId}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const SaveGeneric = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveGeneric, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const GenericDeleteitem = async (itemId, saltid) => {
  try {
    const url = `${apiUrls.GenericDeleteitem}?itemId=${itemId}&saltid=${saltid}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const ReportList = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.ReportList, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const GenericReportList = async (payload) => {
  console.log("Payload when in GenericReportLIst", payload?.reportTypeMajor);
  try {
    const data = await makeApiRequest(
      `${apiUrls.GenericReport}?ReportType=${payload?.reportTypeMajor} `,
      {
        method: "get",
        data: payload,
      },
    );
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const GetExpiryItems = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.GetExpiryItems, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const SaveItemExpiry = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveItemExpiry, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const SearchChangeMRP = async (
  CategoryID,
  SubcategoryID,
  ItemID,
  Price,
  StoreTypeID,
) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.SearchChangeMRP}?CategoryID=${CategoryID}&SubcategoryID=${SubcategoryID}&ItemID=${ItemID}&Price=${Price}&StoreTypeID=${StoreTypeID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const SaveChangeMRP = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveChangeMRP, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const BindToolItem = async (SubCategoryID, StoreLedgerNo) => {
  try {
    const url = `${apiUrls.BindToolItem}?SubCategoryID=${SubCategoryID}&StoreLedgerNo=${StoreLedgerNo}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const SaveDepartmentWiseRack = async (payload) => {
  try {
    const data = await makeApiRequest(apiUrls.SaveDepartmentWiseRack, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const BindDepartmentItemIssueToDept = async () => {
  try {
    const url = `${apiUrls.BindDepartmentItemIssueToDept}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const GetPurchaseOrderItems = async (payload) => {
  try {
    const url = `${apiUrls.GetPurchaseOrderItems}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const BinduploadOpeningBalanceControls = async (userValidateID) => {
  try {
    const url = `${apiUrls.BinduploadOpeningBalanceControls}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BindReconciliationDetails = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const url = `${apiUrls.BindReconciliationDetails}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const BankReconciliationURL = async () => {
  try {
    const url = `${apiUrls.BankReconciliationURL}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const SearchVoucher = async ({ filterType, voucherNo }) => {
  try {
    const url = `${apiUrls.SearchVoucher}?filterType=${filterType}&voucherNo=${voucherNo}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const UpdateReconciliation = async (payload) => {
  try {
    store.dispatch(setLoading(true));
    const url = `${apiUrls.UpdateReconciliation}`;
    const data = await makeApiRequest(url, {
      method: "POST",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const GetBankChargesUploadExcel = async () => {
  try {
    const url = `${apiUrls.GetBankChargesUploadExcel}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const BalanceTransaferControls = async ({ CentreID }) => {
  try {
    const url = `${apiUrls.BalanceTransaferControls}?centreID=${CentreID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const GetBankReconciliationExcel = async () => {
  try {
    const url = `${apiUrls.GetBankReconciliationExcel}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const GetBalanceToTransafer = async (payload) => {
  try {
    const url = `${apiUrls.GetBalanceToTransafer}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const UploadBalanceTransfer = async (payload) => {
  try {
    const url = `${apiUrls.UploadBalanceTransfer}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const SearchAccountBookReport = async (payload) => {
  try {
    const url = `${apiUrls.SearchAccountBookReport}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const GetOpeningBalanceToUpload = async (payload) => {
  try {
    const url = `${apiUrls.GetOpeningBalanceToUpload}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const GetOpeningBalanceExcell = async (payload) => {
  try {
    const url = `${apiUrls.GetOpeningBalanceExcell}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const SaveOpeningBalance = async (payload) => {
  try {
    const url = `${apiUrls.SaveOpeningBalance}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const GetOpeningUploadExcel = async (payload) => {
  try {
    const url = `${apiUrls.GetOpeningUploadExcel}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const UploadOpeningBalanceInvoiceWise = async (payload) => {
  try {
    const url = `${apiUrls.UploadOpeningBalanceInvoiceWise}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const NabhManualGetNabhDetail = async () => {
  try {
    const url = `${apiUrls.NabhManualGetNabhDetail}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
//store item master

export const ItemMasterBindDetail = async (TypeId) => {
  try {
    const url = `${apiUrls.ItemMasterBindDetail}?TypeId=${TypeId}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const SearchGateEntryItem = async (payload) => {
  try {
    const url = `${apiUrls.SearchGateEntryItem}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const GateEntryViewDetailGRNItem = async (GateNo) => {
  store.dispatch(setLoading(true));

  try {
    const data = await makeApiRequest(
      `${apiUrls.GateEntryViewDetailGRNItem}?GateNo=${GateNo}`,
      {
        method: "get",
      },
    );

    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

export const GateEntryGRNPost = async (payload) => {
  try {
    const url = `${apiUrls.GateEntryGRNPost}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const GateEntryPostToGRN = async (payload) => {
  try {
    const url = `${apiUrls.GateEntryPostToGRN}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const GateEntryGRNUnPost = async (payload) => {
  try {
    const url = `${apiUrls.GateEntryGRNUnPost}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const GRNCancel = async (payload) => {
  try {
    const url = `${apiUrls.GRNCancel}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const GRNSameStateBuyierSupplier = async (VendorID) => {
  try {
    const url = `${apiUrls.GRNSameStateBuyierSupplier}?VendorID=${VendorID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const GetVendorState = async (VendorID) => {
  try {
    const url = `${apiUrls.GetVendorState}?VendorID=${VendorID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const GetGRNNarrations = async (StoreTypeID) => {
  try {
    const url = `${apiUrls.GetGRNNarrations}?StoreTypeID=${StoreTypeID || 0}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
/* The GRN page's role dropdown: whether it is on, the session's own role, and the roles it
   offers - all read fresh from fin_global_resources on the server. */
export const GetGRNRoleDropdown = async () => {
  try {
    return await makeApiRequest(apiUrls.GRNGetRoleDropdown, { method: "get" });
  } catch (error) {
    console.log(error, "SomeThing Went Wrong");
  }
};
export const GetDrugFormularyPdf = async (ID) => {
  try {
    const url = `${apiUrls.GetDrugFormularyPdf}?ID=${ID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const GetDrugFormulary = async (ID) => {
  try {
    const url = `${apiUrls.GetDrugFormulary}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const NabhManualGetNabhpdf = async (ID) => {
  try {
    const url = `${apiUrls.NabhManualGetNabhpdf}?ID=${ID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const StoreItemMasterGetDrugCategoryMaster = async (ID) => {
  try {
    const url = `${apiUrls.StoreItemMasterGetDrugCategoryMaster}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    return data;
  } catch (error) {
    throw error;
  }
};
export const StoreItemMasterSaveDrugCategoryMaster = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.StoreItemMasterSaveDrugCategoryMaster}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const ViewPurchaseOrderBindCOADeptPdf = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.ViewPurchaseOrderBindCOADeptPdf}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const PhysicalVerifcationUploadDataPV = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.PhysicalVerifcationUploadDataPV}?CentreID=${payload.CentreID}&RoleID=${payload.RoleID}&StoreTypeID=${payload.StoreTypeID}`;
    const data = await makeApiRequest(url, {
      method: "get",
      // data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const PhysicalVerifcationExportStockPVExcel = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.PhysicalVerifcationExportStockPVExcel}?CentreID=${payload.CentreID}&RoleID=${payload.RoleID}&StoreTypeID=${payload.StoreTypeID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const PhysicalVerifcationSavePV = async (payload) => {
  store.dispatch(setLoading(true));

  try {
    const url = `${apiUrls.PhysicalVerifcationSavePV}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const PhysicalVerifcationBindDepartmentPV = async (CentreID) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.PhysicalVerifcationBindDepartmentPV}?CentreID=${CentreID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const PhysicalVerifcationUpdateStockBalance = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.PhysicalVerifcationUpdateStockBalance}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const PhysicalVerifcationBindPhysicalDataPV = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.PhysicalVerifcationBindPhysicalDataPV}?StoreTypeID=${payload.StoreTypeID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const PhysicalVerifcationViewPhycialVerificationDetail = async (
  payload,
) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.PhysicalVerifcationViewPhycialVerificationDetail}?EntryNo=${payload.EntryNo}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const PhysicalVerifcationRejectPhysicalApproval = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.PhysicalVerifcationRejectPhysicalApproval}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const PhysicalVerifcationSavePhysicalVerificationApproval = async (
  payload,
) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.PhysicalVerifcationSavePhysicalVerificationApproval}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const PharmacyGetDrugDocument = async (SalesID) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.PharmacyGetDrugDocument}?SalesID=${SalesID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const PhysicalVerifcationDownloadSetLowStockVerification = async (
  RoleID,
  CentreID,
  StoreTypeID,
) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.PhysicalVerifcationDownloadSetLowStockVerification}?RoleID=${RoleID}&CentreID=${CentreID}&StoreTypeID=${StoreTypeID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const PhysicalVerifcationSavePVSetLowStockVerification = async (
  payload,
) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.PhysicalVerifcationSavePVSetLowStockVerification}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const CreatePurchaseRequestSearchAllIndent = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.CreatePurchaseRequestSearchAllIndent}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const CreatePurchaseRequestSearchIndentDetail = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.CreatePurchaseRequestSearchIndentDetail}`;
    const data = await makeApiRequest(url, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const PharmacyBindPanelMarkupMaster = async () => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.PharmacyBindPanelMarkupMaster}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const PharmacyBindSubCategoryMarkupMaster = async (CategoryID) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.PharmacyBindSubCategoryMarkupMaster}?CategoryID=${CategoryID}`;
    const data = await makeApiRequest(url, {
      method: "get",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const IssueReturnSearchMedicineForDispense = async (TransactionID) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.IssueReturnSearchMedicineForDispense}?TransactionID=${TransactionID}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const IssueReturnCheckDispense = async (TransactionID) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.IssueReturnCheckDispense}?TransactionID=${TransactionID}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const IssueReturnSaveDispense = async (TransactionID) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.IssueReturnSaveDispense}?TransactionID=${TransactionID}`;
    const data = await makeApiRequest(url, {
      method: "POST",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const IssueReturnGetPrescribeMedicines = async (TransactionID) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.IssueReturnGetPrescribeMedicines}?TransactionID=${TransactionID}`;
    const data = await makeApiRequest(url, {
      method: "GET",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
export const IssueReturnPrintPrescribeMedicines = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    // const url = `${apiUrls.IssueReturnPrintPrescribeMedicines}?TransactionID=${TransactionID}&MedicineID=${MedicineID}`;
    const data = await makeApiRequest(
      apiUrls.IssueReturnPrintPrescribeMedicines,
      {
        method: "post",
        data: payload,
      },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};
