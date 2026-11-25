import React from "react";
import Tables from "..";
import Heading from "../../Heading";
import { useTranslation } from "react-i18next";

const PatientAdvanceDetailTable = ({ tbody }) => {
  const { t } = useTranslation();
  const thead = [
    {name: t("S.No."), width: "1%"},
    t("Receipt No."),
    t("Payment Mode"),
    t("Amount Paid"),
    t("Date & Time"),
    t("Receiver"),
    t("Type"),
  ];

  return (
    <div className="col-sm-12">
      <Heading title={t("Patient Advance Detail")} />
      <Tables
        thead={thead}
        tbody={tbody.map((ele, index) => (   {
                SNo: index + 1,
                ReceiptNo: ele?.receiptNo,
                PaymentMode: ele?.paymentMode,
                amountPaid: ele?.amountPaid,
                ReceiptDate: ele?.receiptDate,
                Receiver: ele?.receiver,
                Type: ele?.type,
              }))}
      />
    </div>
  );
};

export default PatientAdvanceDetailTable;
