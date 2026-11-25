import React, { useEffect, useState } from "react";
import {
  BillingIPDPackageReject,
  PatientBillingEditPackage,
  PatientBillingGetPackage,
  PatientBillingReject,
} from "../../../../networkServices/BillingsApi";
import Tables from "../../../UI/customTable";
import Input from "../../../formComponent/Input";
import DeletePackageModal from "./DeletePackageModal";
import { AMOUNT_REGX } from "../../../../utils/constant";
import { GetDiscReasonList } from "../../../../networkServices/opdserviceAPI";
import ReactSelect from "../../../formComponent/ReactSelect";
import { notify, reactSelectOptionList } from "../../../../utils/utils";
import { useLocalStorage } from "../../../../utils/hooks/useLocalStorage";
import { useTranslation } from "react-i18next";

const EditPackage = ({
  pateintDetails,
  handleModalState,
  GetBindBillDepartment,
  isShowAddSurgery,
  initialSurgery,
  onAddSurgery,
}) => {
  const { pathname } = location;
  const ip = useLocalStorage("ip", "get");
  const [tableData, setTableData] = useState([]);
  const [remark, setRemark] = useState("");
  // console.log("remarksss",remark);

  // Add Surgery opens the full Surgery screen as a slide-up frame, which means this
  // modal is closed and mounted again on the way back. The surgery that was picked
  // therefore arrives as a prop rather than surviving in state.
  const [selectedSurgery, setSelectedSurgery] = useState(initialSurgery || null);

  const [discounts, setDiscounts] = useState({
    discountReasonList: [],
  });
  const [t] = useTranslation()

  const handleCheckedAllTable = (e) => {
    const { name, checked } = e.target;
    const data = tableData?.map((item, _) => {
      return {
        ...item,
        [name]: checked,
      };
    });

    setTableData(data);
  };

  const THEAD_TABLE = [
    {
      name: (<input
        type="checkbox"
        name="isChecked"
        className="table-checkbox"
        checked={tableData?.every((row, _) => row?.isChecked === true)}
        onChange={handleCheckedAllTable}
      />)
    },
    t("Package"),
    t("Date"),
    t("Discount(%)"),
    {name:t("Rate"), width:"30%"},
    t("Reject"),
  ];

  const GetDiscListAPI = async () => {
    try {
      const [discountReasonListRes] = await Promise.all([
        GetDiscReasonList("OPD"),
      ]);

      setDiscounts({
        ...discounts,
        discountReasonList: discountReasonListRes?.data,
      });
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  const handlePatientBillingGetPackage = async (TransactionID) => {
    try {
      const response = await PatientBillingGetPackage(TransactionID);
      setTableData(response?.data);
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };


  const handleCustomInput = (index, name, value, type, max) => {
    if (type === "number") {
      if (!isNaN(value) && Number(value) <= max) {
        const data = [...tableData];
        data[index][name] = value;
        setTableData(data);
      } else {
        return false;
      }
    } else {
      const data = [...tableData];
      data[index][name] = value;
      setTableData(data);
    }
  };

  // const handleChangeTable = (e, index, ...rest) => {
  //   const { name, value } = e.target;
  //   // if (rest?.length > 0 && rest.some((item, _) => item === false)) {
  //   //   return;
  //   // }
  //   const data = [...tableData];
  //   data[index][name] = value;
  //   setTableData(data);
  // };

  const handleIsCheckedTable = (e, index) => {
    const { name, checked } = e.target;
    const data = [...tableData];
    data[index][name] = checked;
    setTableData(data);
  };

  const handlseReject = async (row) => {

    /* const payload = {
      "ID": [
        row?.ID
      ],
      "ipAddress": ip
    } */

    const requetPayload = {
      IPAddress: ip,
      transactionID: pateintDetails?.TransactionID,
      Remark: remark,
      macAddress: "00-14-22-01-23-45",
      pageUrl: pathname,
      objDRCrList: [
        {
          ledTnxID: row?.ID,
          typeofTnx: "CR",
          drCrType: "CQ",
          quantity: -Math.abs(row?.Quantity || 0),
          rate: row?.Rate,
          amount: -Math.abs(row?.Amount || 0),
          discountPercentage: row?.Discount,
          discAmt: 0,
          itemName: row?.TypeName
        }
      ]
    }
    try {
      // const response = await BillingIPDPackageReject(payload)
      const response = await PatientBillingReject(requetPayload)
      if (response?.success) {
        notify(response?.message, "success")
        setRemark("")
        handleModalState(false)
        handlePatientBillingGetPackage(pateintDetails?.TransactionID);
      } else {
        notify(response?.message, "error")
      }
    } catch (error) {

    }
  }
  const handleTableData = (tableData) => {

    return tableData?.map((row, index) => {
      const { TypeName, PDate, Discount, Amount, isChecked } = row;
      return {
        input: (
          <input
            type="checkbox"
            checked={isChecked}
            className="table-checkbox"
            name="isChecked"
            onChange={(e) => handleIsCheckedTable(e, index)}
          />
        ),
        TypeName: TypeName,
        PDate: PDate,
        DisPercentage: (
          <Input
            type={"text"}
            className={"table-input"}
            removeFormGroupClass={true}
            value={Discount}
            name={"Discount"}
            onChange={(e) => { handleCustomInput(index, "Discount", e.target.value, "number", 100) }}
          // onChange={(e) =>
          //   handleChangeTable(
          //     e,
          //     index,
          //     AMOUNT_REGX(3).test(e?.target?.value),
          //     e?.target?.value < 100
          //   )
          // }
          />
        ),
        Amount: (
          <Input
            type={"text"}
            className={"table-input"}
            removeFormGroupClass={true}
            value={Amount}
            name={"Amount"}
            onChange={(e) => { handleCustomInput(index, "Amount", e.target.value, "number", 99999999999999) }}
          // onChange={(e) =>handleChangeTable(e, index, AMOUNT_REGX(3).test(e?.target?.value))}
          />
        ),
        Reject: (
          <i
            className="fa fa-trash text-danger text-center"
            // onClick={() => handlseReject(row)}
            onClick={() =>
              handleModalState(
                true,
                t("Rejection Reason"),
                <DeletePackageModal
                  setRemark={setRemark}
                  onReject={() => handlseReject(row)}
                />,
                "25vw",
                <></>
              )
            }
          />
        ),

      };
    });
  };

  const handleReactChange = (name, e) => {
    const data = tableData?.map((row, _) => {
      return {
        ...row,
        [name]: e?.value,
      };
    });
    setTableData(data);
  };

  const handlePatientBillingEditPackage = async () => {


    try {
      const requestBody = tableData
        ?.filter((row, _) => row?.isChecked)
        ?.map((item, _) => {
          return {
            amount: Number(item?.Amount),
            discount: Number(item?.Discount),
            ipAddress: String(ip),
            disReason: String(item?.DiscReason),
            ID: String(item?.ID),
            isChecked: Boolean(item?.isChecked),
            // Only the ticked rows are saved, so the surgery is stamped on exactly
            // the rows this Save touches. Nothing picked leaves both blank and the
            // API keeps whatever the row already had.
            surgeryID: String(selectedSurgery?.surgeryID || ""),
            surgeryName: String(selectedSurgery?.surgeryName || ""),
          };
        });
      if (requestBody?.length === 0) {
        notify(t("Please select any item"), "error");
        return
      }

      const response = await PatientBillingEditPackage(requestBody);
      // const response = await PatientBillingEditPackage({
      //   edits: requestBody,
      // });

      notify(response?.message, response?.success ? "success" : "error");

      if (response?.success) {
        handleModalState(false, null, null, null, <></>);
        GetBindBillDepartment();
      }
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };

  useEffect(() => {

    handlePatientBillingGetPackage(pateintDetails?.TransactionID);
    GetDiscListAPI();
  }, []);

  console.log(tableData, "tableDatatableData")

  return (
    <div>
      {/* ShowAddSurgeryOnEditPackage se chalta hai. Off hone par button aur chip
          dono gayab, selectedSurgery hamesha null rehta hai, aur Save ke payload
          me surgery khali jaati hai - yani ltd ke surgery columns achhoote. */}
      {isShowAddSurgery ? (
        <div className="row mb-2 ml-1 align-items-center">
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onAddSurgery?.(selectedSurgery)}
          >
            {t("Add Surgery")}
          </button>

          {selectedSurgery ? (
            <div className="ml-3 d-flex align-items-center">
              <b>{t("Surgery")} :</b>
              <span className="ml-1">
                {selectedSurgery?.surgeryName} ({selectedSurgery?.surgeryID})
              </span>
              <i
                className="fa fa-times text-danger ml-2"
                title={t("Remove surgery from this package")}
                onClick={() => setSelectedSurgery(null)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <Tables thead={THEAD_TABLE} tbody={handleTableData(tableData)} scrollView={"scrollView"}/>
      <div className="mt-2  row flex-row-reverse mr-2">
        <button
          className="btn btn-sm btn-primary"
          onClick={handlePatientBillingEditPackage}
        >
          {t("Save")}
        </button>
        <ReactSelect
          respclass={"col-8"}
          placeholderName={"Discount Reason"}
          value={tableData?.[0]?.DiscReason}
          name={"DiscReason"}
          dynamicOptions={reactSelectOptionList(discounts?.discountReasonList,
            "DiscountReason",
            "DiscountReason"
          )}
          handleChange={handleReactChange}
        />
      </div>
    </div>
  );
};

export default EditPackage;
