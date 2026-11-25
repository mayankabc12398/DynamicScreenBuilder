import React, { useEffect, useState } from "react";
import {
  PatientBillingGetPackage,
  PatientBillingItemPackageSave,
} from "../../../../networkServices/BillingsApi";
import ReactSelect from "../../../formComponent/ReactSelect";
import {
  handleReactSelectDropDownOptions,
  notify,
} from "../../../../utils/utils";
import { useLocalStorage } from "../../../../utils/hooks/useLocalStorage";
import { setLoading } from "../../../../store/reducers/loadingSlice/loadingSlice";
import store from "../../../../store/store";
import { useSelector } from "react-redux";
import Confirm from "../../Confirm";
import { useTranslation } from "react-i18next";

const PackageBilling = ({

  data,
  pateintDetails,
  handleModalState,
  GetBindBillDepartment,

}) => {
  const [t] = useTranslation();
  const [dropDownState, setDropDownState] = useState([]);
  const [packageID, setPackageID] = useState({ value: "0" });
  const [ledgerTnxRefID, setLedgerTnxRefID] = useState("");
  const ip = useLocalStorage("ip", "get");

  // Prompt before letting the selected items exceed the package amount.
  // Switched by IsPackageExceedAlertShow in fin_global_resources; when it is off
  // the save goes through exactly as it did before.
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const isPackageExceedAlertShow =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find((item) => item?.Name === "IsPackageExceedAlertShow")
      ?.Value === "1";

  const [exceedConfirm, setExceedConfirm] = useState({
    show: false,
    itemsTotal: 0,
    packageAmount: 0,
  });
  // console.log("data",data)
  //   useEffect(()=>{
  // const re=data?.map((val)=>val?.subRow?.subRowList.filter((i)=>i?.isChecked===true))
  // console.log("anand",re)
  //   },[data])

  // useEffect(() => {
  //   const re = data
  //     ?.map((val) =>
  //       val?.subRow?.subRowList?.filter((i) => i?.isChecked === true)
  //     )
  //     ?.flat(); // Flatten karta hai nested arrays ko
  //   console.log("anand", re);
  // }, [data]);



  // 💰 Sum of Amounts




  const handlePatientBillingGetPackage = async (TransactionID) => {
    try {

      const response = await PatientBillingGetPackage(TransactionID);
      console.log("firstresponse", response)
      setDropDownState([
        { label: t("No Package"), value: "0" },
        ...handleReactSelectDropDownOptions(
          response?.data,
          "TypeName",
          "ItemID"
        ),
      ]);
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  const handlePayload = () => {
    const obj = {
      ID: [],
    };

    for (let i = 0; i < data.length; i++) {
      if (
        data[i]?.subRow?.subRowList?.length > 0 ||
        data[i]?.subRow?.subRowList.some((ele, _) => ele?.isChecked)
      ) {
        for (let j = 0; j < data[i]["subRow"]["subRowList"].length; j++) {
          const subRow = data[i]["subRow"]["subRowList"];
          if (subRow[j]?.["isChecked"] === true) {
            obj.ID.push(`'${subRow[j]?.["ID"]}'`);
          }
        }
      }
    }

    return {
      ID: obj?.ID,
    };
  };


  /** Total of the items ticked for the package. */
  const getSelectedItemsTotal = () => {
    let total = 0;
    for (let i = 0; i < data.length; i++) {
      const subRow = data[i]?.subRow?.subRowList || [];
      for (let j = 0; j < subRow.length; j++) {
        if (subRow[j]?.isChecked === true) {
          // "Net Amt" on the grid is the Amount column; Rate x Qty is the fallback.
          const amount =
            Number(subRow[j]?.Amount) ||
            Number(subRow[j]?.Rate) * (Number(subRow[j]?.Quantity) || 1) ||
            0;
          total += amount;
        }
      }
    }
    return total;
  };

  const handleSave = async () => {
    const { ID } = handlePayload();

    if (ID.length > 0 && isPackageExceedAlertShow && packageID?.value !== "0") {
      // sp_ipd_billing_GetPackage returns the package value as Amount (Rate holds
      // the same figure); HospitalAmt is what a different package API uses.
      const packageAmount =
        Number(packageID?.Amount) ||
        Number(packageID?.Rate) ||
        Number(packageID?.HospitalAmt) ||
        0;
      const itemsTotal = getSelectedItemsTotal();

      // Over the package value - let the user decide rather than silently billing it.
      if (packageAmount > 0 && itemsTotal > packageAmount) {
        setExceedConfirm({ show: true, itemsTotal, packageAmount });
        return;
      }
    }

    await savePackageItems();
  };

  const savePackageItems = async () => {
    store.dispatch(setLoading(true));
    try {
      const { ID } = handlePayload();
      if (ID.length > 0) {
        const requestBody = {
          package: String(packageID?.value ? packageID?.value : "0"),
          ID: String(ID || 0),
          ipAddress: String(ip),
          TransactionID: String(pateintDetails?.TransactionID),
          PackageLedTnxId: ledgerTnxRefID ? ledgerTnxRefID : 0
        };
        const response = await PatientBillingItemPackageSave(requestBody);
        notify(response?.message, response?.success ? "success" : "error");

        if (response?.success) {
          handleModalState(false, null, null, null, null);
          await GetBindBillDepartment();
        }
      } else {
        notify(t("Please Select Test"), "error");
      }
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    } finally {
      store.dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    handlePatientBillingGetPackage(pateintDetails?.TransactionID);
  }, []);
  const handleReactSelectItem = (name, value) => {

    console.log(value, name);
    // setPayload((val) => ({ ...val, [name]: value }));
    const packageAmt = value?.HospitalAmt


    setPackageID(value);
    setLedgerTnxRefID(value?.ID)


    // if(totalAmount<=packageAmt){
    //   setPackageID(value?.value);
    //   setLedgerTnxRefID(value?.LedgerTnxRefID)
    // }
    // else{
    //   notify("Selected test amount exceeds the package amount", "warn");
    // }


    //     if(name==="package"){
    // setPackageID(name?.value)
    //     }

  };
  return (
    <div>
      <ReactSelect
        name="package"
        placeholderName={"package"}
        dynamicOptions={dropDownState}
        value={packageID?.value}
        removeIsClearable={true}
        // handleChange={(_, e) => setPackageID(e?.value)}
        handleChange={handleReactSelectItem}
      />

      <div className="d-flex aling-items-center justify-content-end">
        <button className="btn btn-sm btn-primary" onClick={handleSave}>
          {t("Save")}
        </button>
      </div>

      {/* Selected items cost more than the package covers - confirm before billing. */}
      <Confirm
        confirmBoxvisible={exceedConfirm}
        lableMessage="Package Amount Exceeded"
        alertMessage={`Selected items total ${Number(
          exceedConfirm.itemsTotal,
        ).toFixed(2)} but the package amount is only ${Number(
          exceedConfirm.packageAmount,
        ).toFixed(2)}. Do you want to continue?`}
      >
        <div>
          <button
            type="button"
            className="modalConfirmButton"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExceedConfirm({ show: false, itemsTotal: 0, packageAmount: 0 });
              savePackageItems();
            }}
          >
            Yes
          </button>
          <button
            type="button"
            className="modalCancelButton"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExceedConfirm({ show: false, itemsTotal: 0, packageAmount: 0 });
            }}
          >
            No
          </button>
        </div>
      </Confirm>
    </div>
  );
};

export default PackageBilling;
