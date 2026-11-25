import React, { useCallback, useState } from "react";
import Tables from "..";
import HtmlSelect from "../../../formComponent/HtmlSelect";
import Input from "../../../formComponent/Input";
import { notify } from "../../../../utils/utils";
import { useTranslation } from "react-i18next";
import CustomSelect from "../../../formComponent/CustomSelect";
import MPaisaPAyment from "./MPaisaPAyment";

function PaymentTable(props) {
  const {
    getBankMasterData,
    tbody,
    handleChange,
    handlePaymentRemove,
    getMachineData,
    singlePatientData,
    onRazorpayClick,
  } = props;
  const [t] = useTranslation();

  const THEAD = [
    t("Payment Mode"),
    t("Paid Amount"),
    t("Currency"),
    t("Bank Name"),
    t("Ref No."),
    t("Machine"),
    t("Base"),
    t("Action"),
  ];

  const handleAmountChange = (e, index, item) => {
    if (Number(item?.PaymentModeID) === 7) {
      const { value } = e.target;
      if (Number(value) > Number(item?.patientAdvance)) {
        notify(
          `Maximum  Patient Advance is Allowed ${item?.patientAdvance}`,
          "error"
        );
      } else {
        handleChange(e, index);
      }
    } else {
      handleChange(e, index);
    }
  };

  const settleValue = (row, index) => {
    // ;
    const tableData = {
      PaymentMode: null,
      Paid_Amount: null,
      currency: null,
      BankName: null,
      RefNo: null,
      Machine: null,
      Base: null,
      Action: null,
    };

    // payment mode;
    tableData.PaymentMode = row?.PaymentMode;

    // Paid_Amount

    tableData.Paid_Amount = (
      <Input
        className="table-input text-right"
        value={row?.S_Amount}
        removeFormGroupClass={true}
        name="S_Amount"
        disabled={Number(row?.PaymentModeID) === 4}
        onChange={(e) => handleAmountChange(e, index, row)}
      />
    );

    // currency

    tableData.currency = row?.S_Notation;

    // BankName
    if (![1, 4, 7, 8].includes(row?.PaymentModeID)) {
      tableData.BankName = (
        // <HtmlSelect
        //   name="BankName"
        //   option={[
        //     { label: "Select Bank", value: "" },
        //     ...getBankMasterData?.map((ele) => {
        //       return {
        //         label: ele?.BankName,
        //         value: ele?.BankName,
        //       };
        //     }),
        //   ]}
        //   value={row?.BankName}
        //   onChange={(e) => handleChange(e, index)}
        // />
        <CustomSelect
          option={[
            { label: t("Select Bank"), value: "" },
            ...getBankMasterData?.map((ele) => {
              return {
                label: ele?.BankName,
                value: ele?.BankName,
              };
            }),
          ]}
          value={row?.BankName}
          name="BankName"
          // onChange={(e) => handleChange(e, index)}
          onChange={(name, value) =>
            handleChange({ target: { name: name, value: value?.value } }, index)
          }
           requiredClassName=" required-fields"
        />
      );
    }

    // RefNo

    if (![1, 4, 7, 8].includes(row?.PaymentModeID)) {
      tableData.RefNo = (
        <Input
          className="table-input required-fields"
          type="text"
          removeFormGroupClass={true}
          value={row?.RefNo}
          name="RefNo"
          onChange={(e) => handleChange(e, index)}
          // required="required-fields"
        />
      );
    }

    if ([3].includes(row?.PaymentModeID)) {
      tableData.Machine = (
        // <HtmlSelect
        //   name="swipeMachine"
        //   option={[
        //     { label: "Select Machine", value: "" },
        //     ...getMachineData?.map((ele) => {
        //       return {
        //         label: ele?.MachineName,
        //         value: ele?.MachineID,
        //       };
        //     }),
        //   ]}
        //   value={row?.swipeMachine}
        //   onChange={(e) => handleChange(e, index)}
        // />
        <CustomSelect
          option={[
            { label: t("Select Machine"), value: "" },
            ...getMachineData?.map((ele) => {
              return {
                label: ele?.MachineName,
                value: ele?.MachineID,
              };
            }),
          ]}
          value={row?.swipeMachine}
          name="swipeMachine"
          onChange={(name, value) =>
            handleChange({ target: { name: name, value: value } }, index)
          }
        />
      );
    }

    tableData.Base = `${row?.Amount} ${row?.BaseCurrency}`;

    tableData.Action = (
      <i
        className="fa fa-trash text-danger text-center"
        aria-hidden="true"
        onClick={() => handlePaymentRemove(index)}
      ></i>
    );

    return tableData;
  };
  const isUPIMODE=tbody?.find((e)=>e?.PaymentModeID===9)
console.log("tbody",tbody)
  return (
    <>
      <Tables
        thead={THEAD}
        style={{ maxHeight: "140px" }}
        tbody={tbody?.map((row, index) => {
          const {
            PaymentMode,
            Paid_Amount,
            currency,
            BankName,
            RefNo,
            Machine,
            Base,
            Action,
          } = settleValue(row, index);
          return {
            PaymentMode,
            Paid_Amount,
            currency,
            BankName,
            RefNo,
            Machine,
            Base,
            Action,
          };
        })}
      />
     
      {
        isUPIMODE &&  <MPaisaPAyment isUPIMODE={isUPIMODE} singlePatientData={singlePatientData} onRazorpayClick={onRazorpayClick}/>
      }
    </>
  );
}

export default PaymentTable;
