import React, { useEffect, useState } from "react";
import ReactSelect from "../../components/formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import Heading from "../../components/UI/Heading";
import { IPDBillPrints } from "../../networkServices/ReportsAPI";
import { GetGlobalResources } from "../../networkServices/opdserviceAPI";
import { RedirectURL } from "../../networkServices/PDFURL";
import store from "../../../src/store/store";
import ReportsMultiSelect from "../ReportCommonComponents/ReportsMultiSelect";
import { notify } from "../../utils/ustil2";

const IPDBillPrint = ({ data }) => {
  const [t] = useTranslation();

  const [values, setValues] = useState({
    billType: "SUM",
    currency: "0",
    showReceipt: true,
    // Logo default me ticked - bill letterhead ke saath hi chhapta hai, isliye
    // har baar haath se tick karne ki zarurat nahi. Bina logo ke chahiye to
    // tick hata sakte hain.
    type: [
      { name: "Logo", code: "1" },
      { name: "Show Receipt/Refund in Bill", code: "1" },
    ],
    TypeOfBill: "0",
    ReportType: "0",
  });
  const [isResourceLogo, setIsResourceLogo] = useState(0);

  const getGlobalResources = async () => {
    try {
      const apiResp = await GetGlobalResources();
      const resourceLogo = apiResp?.data?.find(
        (item) => item?.Name === "IsResourceLogo"
      );

      setIsResourceLogo(String(resourceLogo?.Value) === "1" ? 1 : 0);
    } catch (error) {
      console.error(error);
      setIsResourceLogo(0);
    }
  };

  useEffect(() => {
    getGlobalResources();
  }, []);

  const handleReactSelectChange = (name, e) => {
    setValues({ ...values, [name]: e?.value });
  };
  const handlePrint = async () => {

    try {
      const response = await IPDBillPrints({
        TransactionID: parseInt(data.transactionID),
        Duplicate: 1,
        /* DETNOPKG is a detail bill with the package's item list left off. It goes
           out as a plain "DET" so the stored procedure and the print view behave
           exactly as they do for a detail bill; only the extra flag differs. */
        BillType: ["DETNOPKG", "SUMITEM"].includes(values.billType) ? "DET" : values.billType,
        HidePackageItems: values.billType === "DETNOPKG" ? 1 : 0,
        /* SUMITEM is the item wise summary bill; it needs the detail lines, so it
           goes out as "DET" with this flag telling the API to print the summary view. */
        ItemSummary: values.billType === "SUMITEM" ? 1 : 0,
        IsBaseCurrency: parseInt(values.currency),
        IsReceipt: values?.type?.some(val => val?.name === "Show Receipt/Refund in Bill") ? 1 : 0,
        logo: values?.type?.some(val => val?.name === "Logo") ? 1 : 0,
        signature: values?.type?.some(val => val?.name === "Signature") ? 1 : 0,
        IsPrintedDate: values?.type?.some(val => val?.name === "Printed Date") ? 1 : 0,
        typeOfBill: parseInt(values?.TypeOfBill),
        ReportType: parseInt(values?.ReportType),
        IsResourceLogo: isResourceLogo
      });
      // if (response?.message) {
      //   notify(response?.message, "success");
      // }
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error, "No Record Found.");
    }
  };

  return (
    <>
      <div className="card patient_registration border">
        <Heading title={t("Admitted Patients")} isBreadcrumb={true} />
        <div className="row p-2">
          <ReactSelect
            placeholderName={t("Type of Bills")}
            id={"billType"}
            searchable={true}
            removeIsClearable={true}
            respclass="col-xl-2 col-md-2 colt-sm-6 col-12"
            dynamicOptions={[
              { label: t("Summary Bill"), value: "SUM" },
              { label: t("Summary Bill (Item Wise)"), value: "SUMITEM" },
              { label: t("Detail Bill"), value: "DET" },
              { label: t("Detail Bill (Without Package Items)"), value: "DETNOPKG" },
              { label: t("Package Bill Summary"), value: "PKGSUM" },
              { label: t("Package Bill Detail"), value: "PKGDET" },
              { label: t("Surgery Bill Summary"), value: "SURSUM" },
              { label: t("Surgery Bill Detail"), value: "SUR" },
            ]}
            name="billType"
            value={values.billType}
            handleChange={handleReactSelectChange}
          />

          <ReactSelect
            placeholderName={t("Bill Print Currency")}
            id={"currency"}
            searchable={true}
            removeIsClearable={true}

            respclass="col-xl-2 col-md-2 colt-sm-6 col-12"
            dynamicOptions={[
              { label: t("Base Currency"), value: "0" },
              { label: t("Bill Generate Currency"), value: "1" },
            ]}
            name="currency"
            value={values.currency}
            handleChange={handleReactSelectChange}

          />


          <ReportsMultiSelect
            name="type"
            placeholderName={t("Type")}
            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
            values={values}
            setValues={setValues}
            dynamicOptions={[
              { typeName: "Logo", typeID: "1" },
              { typeName: "Signature", typeID: "1" },
              { typeName: "Show Receipt/Refund in Bill", typeID: "1" },
              { typeName: "Printed Date", typeID: "1" },
            ]}
            // dynamicOptions={[{name:"abc",code:"dsd"},{name:"ddf",code:"dfdf"}]}
            labelKey="typeName"
            valueKey="typeID"
            requiredClassName="required-fields"
          />
          {/* <div className="col-xl-2 col-md-2 colt-sm-6 col-12 d-flex align-items-center">
            <input
              type="checkbox"
              checked={values.showReceipt}
              onChange={() =>
                setValues({ ...values, showReceipt: !values.showReceipt })
              }
            />
            <span>{t("Show Receipt/Refund in Bill")}</span>
          </div> */} 
          <ReactSelect
            placeholderName={t("Bill Type")}
            id={"TypeOfBill"}
            searchable={true}
            removeIsClearable={true}

            respclass="col-xl-2 col-md-2 colt-sm-6 col-12"
            dynamicOptions={[
              { label: t("Actual Bill"), value: "1" },
              { label: t("After Bill"), value: "0" },
            ]}
            name="TypeOfBill"
            value={values.TypeOfBill}
            handleChange={handleReactSelectChange}

          />
         <ReactSelect
            placeholderName={t("Report Type")}
            id={"ReportType"}
            searchable={true}
            removeIsClearable={true}
            respclass="col-xl-2 col-md-2 colt-sm-6 col-12"
            dynamicOptions={[
              { label: t("PDF"), value: "0" },
              { label: t("Word"), value: "1" },
            ]}
            name="ReportType"
            value={values.ReportType} // Will now properly bind to state
            handleChange={handleReactSelectChange}
          />
          <div className="row">

            <div className="col-sm-12 text-right">
              <button
                className="btn-primary btn-sm px-5 ml-1 custom_save_button required-fields"
                onClick={handlePrint}
              >
                {t("Bill Print")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IPDBillPrint;

