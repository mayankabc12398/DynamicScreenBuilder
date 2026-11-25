import React, { useEffect, useState } from "react";
import TextAreaInput from "../../../formComponent/TextAreaInput";
import { PatientBillingReject } from "../../../../networkServices/BillingsApi";
import { useLocalStorage } from "../../../../utils/hooks/useLocalStorage";
import { notify } from "../../../../utils/utils";
import store from "../../../../store/store";
import { setLoading } from "../../../../store/reducers/loadingSlice/loadingSlice";
import { PatientBillingRejectPayload } from "../../../../utils/ustil2";
import { useTranslation } from "react-i18next";

const RejectModal = ({
  data,
  handleModalState,
  GetBindBillDepartment,
  GetBindBillDetails,
  parentCategory,
  pateintDetails,
}) => {
  const [rejectReason, setRejectReason] = useState("");
  const [t] = useTranslation()
  const [tableList, setTableList] = useState([])
  const ip = useLocalStorage("ip", "get");

  const handleIndicator = (state) => {
    return (
      <div className="text-danger">
        (max 200 Charcter) <span className="text-dark">{t("Remaining :")} </span>{" "}
        <span className="text-success">{Number(200 - state?.length)}</span>
      </div>
    );
  };
  useEffect(() => {
    const handleJoinID = () => {
      const checkedData = [];
      if(!Array.isArray(data) && Object.keys(data).length > 0){
         checkedData.push(data)
         return checkedData
      }
      for (let i = 0; i < data?.length; i++) {
        const { subRow } = data[i];
        for (let j = 0; j < subRow?.subRowList?.length; j++) {
          if (subRow?.subRowList[j]?.["isChecked"] === true) {
            checkedData.push(subRow?.subRowList[j]);
          }
        }
      }
      return checkedData
    };
    setTableList(handleJoinID())

  }, [])

  const handleChange = (e) => {
    const { value } = e.target;
    if (value.length <= 200) setRejectReason(value);
  };


  const handlePatientBillingReject = async () => {
    // store.dispatch(setLoading(true));
    
    if (!rejectReason) {
      notify(t("Reject Reason Field Is Required !!"), "error")
      return
    }
    try {
      const requestBody = PatientBillingRejectPayload(rejectReason, pateintDetails, tableList)
      // const requestBody = {
      //   isSurgery: false,
      //   ledTnxID: Array.isArray(data)
      //     ? handleJoinID(data)
      //     : `'${String(data?.ID)}'`,
      //   cancelReason: String(rejectReason),
      //   ltNo: Array.isArray(data) ? "0" : String(data?.LedgerTransactionNo),
      //   ipAddress: String(ip),
      //   TransactionID: String(pateintDetails?.transactionID),
      // };
      // debugger
      const response = await PatientBillingReject(requestBody);

      if (response?.success) {
        handleModalState(false, null, null, null, null);

        /* Sirf us department ki lines dobara padhi jaati hain jisme se item
           hataya gaya - poore bill ki nahi.

           Pehle yahan khaali call jaati thi, to har reject par HAR department
           ke item dobara aate the. Item laane wala endpoint har department ke
           liye alag SP call karta hai, ek ke baad ek - saat department wale
           patient par wahi ~1.7 second le leta tha, jabki badla sirf ek
           department hota hai.

           `parentCategory` tabhi milta hai jab ek hi row reject ho rahi ho.
           Toolbar wale bulk reject me kai department ke item ek saath jaate
           hain, wahan ye khaali rehta hai aur poora reload hi hota hai - wahi
           sahi bhi hai.

           Package wale item par ye raasta aata hi nahi: list me Reject dabate
           hi screen rok deti hai ("remove from package first"). Package kai
           department me failta hai, isliye uske liye targeted reload galat
           hota. */
        if (GetBindBillDepartment) await GetBindBillDepartment(parentCategory);

        /* Reject ke andar sp_Billing_UpdateIPDBillDetails chalti hai, yaani
           Gross / Net / Balance DB me badal chuke hote hain. Pehle ye call
           hoti hi nahi thi, to upar wale khane purane aankde dikhate rehte
           the jab tak page dobara na khole. */
        if (GetBindBillDetails) await GetBindBillDetails();
      }

      notify(response?.message, response?.success ? "success" : "error");
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    } finally {
      // store.dispatch(setLoading(false));
    }
  };

  return (
    <>
      <div className="row">
        <TextAreaInput
          respclass={"col-12"}
          lable={"Reason"}
          id={"Reason"}
          rows={3}
          value={rejectReason}
          onChange={(e) => handleChange(e)}
        />

        <div className="col-12">{handleIndicator(rejectReason)}</div>
      </div>

      <div className="d-flex align-items-center justify-content-end">
        <button
          className="btn btn-sm btn-primary mx-1"
          style={{ backgroundColor: "red", border: "none" }}
          onClick={handlePatientBillingReject}
        >
          {t("Reject")}
        </button>
      </div>
    </>
  );
};

export default RejectModal;
