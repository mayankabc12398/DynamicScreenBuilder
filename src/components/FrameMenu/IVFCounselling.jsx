import React, { useState, useCallback, useMemo, useEffect } from "react";
import MultiSelectComp from "../formComponent/MultiSelectComp";
import { useTranslation } from "react-i18next";
import Accordion from "../UI/Accordion";
import TextAreaInput from "../formComponent/TextAreaInput";
import Input from "../formComponent/Input";
import Heading from "../UI/Heading";
import ReactSelect from "../formComponent/ReactSelect";
import Tables from "../UI/customTable";
import { ReprintSVG } from "../SvgIcons";
import { IVFCounsellingInitialState } from "../../utils/constant";
import {
  GetBindDataOfIVFConvertToPackage,
  GetBindDataOfIVFCounselling,
  GetPrintIVFFormCounselling,
  GetRenderPDF,
  handleIVFCounsellingInvestigationItemSearch,
  handleSaveOrUpdateIVFCounselling,
} from "../../networkServices/IVFCounsellingAPI";
import { CouncellingSavePayload } from "../../utils/utils";
import { notify } from "../../utils/ustil2";
import { GetIVFPackages } from "../../networkServices/BillingsApi";
import { RedirectURL } from "../../networkServices/PDFURL";
import { toast } from "react-toastify";

const IVFCounselling = ({ data }) => {
  // debugger;
  const [t] = useTranslation();
  const [tableData, setTableData] = useState([]);
  const [investigation, setInvestigation] = useState([]);
  const [ivfCounselling, setIVFCounselling] = useState([]);
  const [packageID, setPackageID] = useState([]);
  const [packageList, setPackageList] = useState([]);
  const [payload, setPayload] = useState(IVFCounsellingInitialState);
  const [isUpdate, setIsUpdate] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setPayload((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  }, []);

  const handleMultiSelectChange = useCallback((name, options) => {
    setPayload((prev) => ({
      ...prev,
      [name]: options,
    }));
  }, []);

  const handleReactSelect = useCallback((name, option) => {
    setPayload((prev) => ({
      ...prev,
      [name]: option?.value || "",
    }));
  }, []);

  const handleCounsellingInvestigationItemSearch = async () => {
    const reqBody = {
      isIPDData: 0,
      transactionId: String(data?.transactionID) || "",
      appID: data?.App_ID||String(data?.App_ID) || "",
    };
    try {
      const response =
        await handleIVFCounsellingInvestigationItemSearch(reqBody);
      if (response?.success) {
        setInvestigation(response?.data);
      } else {
        setInvestigation([]);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleSaveOrUpdateCounselling = async () => {
    // debugger;
    // if (
    //   payload?.testsForFemale === 0 ||
    //   payload?.testsForMale === 0 ||
    //   payload?.treatmentRisks === 0 ||
    //   payload?.donerInformation === 0 ||
    //   payload?.ivfEstimated == 0
    // ) {
    //   return toast("Check Atleast one Counselling", "danger");
    // }
    const formId = isUpdate ? payload?.id : 0;
    const reqBody = CouncellingSavePayload(payload, data, formId);
    try {
      const response = await handleSaveOrUpdateIVFCounselling(reqBody);
      if (response?.success) {
        notify(response?.message, "success");
        GetDataOfIVFCounselling();
        setIsUpdate(false);
        setPayload({ ...IVFCounsellingInitialState });
      } else {
        notify(response?.message, "danger");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const GetDataOfIVFCounselling = async () => {
    try {
      const response = await GetBindDataOfIVFCounselling(data?.transactionID);
      if (response?.success) {
        setTableData(response?.data);
      } else {
        setTableData([]);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const BindDataOfIVFConvertToPackage = async () => {
    try {
      const response = await GetBindDataOfIVFConvertToPackage(
        data?.transactionID,
      );
      if (response?.success) {
        setIVFCounselling(response?.data);
      } else {
        setIVFCounselling([]);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const getPackageList = async () => {
    try {
      const response = await GetIVFPackages();
      if (response?.success) {
        setPackageList(response?.data);
      }
    } catch (error) {
      console.error("Error fetching Pro Name List:", error);
    }
  };
  useEffect(() => {
    handleCounsellingInvestigationItemSearch();
    GetDataOfIVFCounselling();
    BindDataOfIVFConvertToPackage();
    getPackageList();
  }, []);
  const handleEdit = (item) => {
    setIsUpdate(true);
    console.log(isUpdate);
    const femalePartner =
      item?.FemaleItems?.split(",").map((id) => {
        const partner = investigation?.find((ele) => ele?.Type_ID == id);

        return {
          code: id,
          name: partner?.TypeName || "",
        };
      }) || [];

    const malePartner =
      item?.MaleItems?.split(",").map((id) => {
        const partner = investigation?.find((ele) => ele?.Type_ID == id);

        return {
          code: id,
          name: partner?.TypeName || "",
        };
      }) || [];
    setPayload({
      FemalePartner: femalePartner,
      MalePartner: malePartner,
      testsForFemale: item?.TestsForFemale || 0,
      testsForMale: item?.TestsForMale || 0,
      treatmentRisks: item?.TreatmentRisks || 0,

      IsRisksExplained: item?.TreatmentRiskExplain ? 1 : 0,
      ExplaineRisk: item?.TreatmentRisksRemarks || "",

      Ishusbandsinfo: item?.DonorHusband || 0,
      husbandsinfo: item?.DonorHusbandDate || "",

      IsOutsideDonor: item?.DonorOutside || 0,
      OutsideDonor: item?.DonorOutsideDate || "",

      IsOnetimePackage: item?.OneTimePackage ? 1 : 0,
      OnetimePackage: item?.SecondThirdCycleDate || "",

      IsEMIOption: item?.EMIOption || 0,
      EMIOption: item?.EMIOptionDate || "",

      IsRefundPolicyExplained: item?.RefundExplained || 0,
      RefundPolicyExplained: item?.RefundExplainedDate || "",

      PsychologicalSupport: item?.PsychSupport || "",

      Isgenericmedicines: item?.UseGenericMeds ? 1 : 0,
      IsMultiPackage: item?.MultiCyclePackage ? 1 : 0,

      InsuranceCoverage: item?.InsuranceProvider || "",
      GovernmentNGOSchemes: item?.NgoScheme || "",

      paymentPlans: item?.PaymentPlansRemarks || "",

      IsOvarianStimulationMed: item?.OvarianStim ? 1 : 0,
      OvarianStimulationMed: item?.OvarianStimDate || "",

      IsMonitoring: item?.Monitoring ? 1 : 0,
      Monitoring: item?.MonitoringDate || "",

      IsEggRetrieval: item?.EggRetrieval ? 1 : 0,
      EggRetrieval: item?.EggRetrievalDate || "",

      IsLabFertilization: item?.LabFertilization ? 1 : 0,
      LabFertilization: item?.LabFertilizationDate || "",

      IsEmbryoCulture: item?.EmbryoCulture ? 1 : 0,
      EmbryoCulture: item?.EmbryoCultureDate || "",

      IsEmbryoTransfer: item?.EmbryoTransfer ? 1 : 0,
      EmbryoTransfer: item?.EmbryoTransferDate || "",

      IsDonorEggsSperm: item?.DonorEggs ? 1 : 0,
      DonorEggsSperm: item?.DonorEggsDate || "",

      IsSurrogacyArrangements: item?.Surrogacy ? 1 : 0,
      SurrogacyArrangements: item?.SurrogacyDate || "",

      IsGeneticTesting: item?.GeneticTesting ? 1 : 0,
      GeneticTesting: item?.GeneticTestingDate || "",

      IsFreezingStorageCharges: item?.Freezing ? 1 : 0,
      FreezingStorageCharges: item?.FreezingDate || "",

      IsCycleCosts: item?.SecondThirdCycle || 0,
      CycleCosts: item?.SecondThirdCycleDate || "",

      package: item?.IvfPackage || "",
      OtherAmounts: item?.IvfOtherAmounts || "",

      ivfEstimated: item?.IVFEstimated || 0,
      id: item?.FormId,
      donerInformation: Number(item?.DonerInformation) ?? 0,
    });
  };
  const handleRowPrint = async (item) => {
    try {
      const response = await GetPrintIVFFormCounselling(item?.FormId);
      // const response = await GetRenderPDF(transactionID, item?.ID);
      if (response?.success) {
        RedirectURL(response?.data);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  return (
    <>
      <Heading
        title={t("Tests for Female Partner")}
        defaultValue={true}
        secondTitle={
          <>
            <div className="">
              <input
                type="checkbox"
                id="testsForFemale"
                name={"testsForFemale"}
                onChange={handleChange}
                checked={payload?.testsForFemale}
              />
            </div>
          </>
        }
      />
      {payload?.testsForFemale === 1 && (
        <div className="row p-2">
          <MultiSelectComp
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            name="FemalePartner"
            id="FemalePartner"
            placeholderName={t("Search Investigations")}
            handleChange={handleMultiSelectChange}
            value={payload?.FemalePartner}
            dynamicOptions={investigation?.map((item) => ({
              name: item?.TypeName,
              code: item?.Type_ID,
            }))}
          />
        </div>
      )}
      {/* </Accordion> */}
      <Heading
        title={t("Tests for Male Partner")}
        defaultValue={true}
        secondTitle={
          <>
            <div className="">
              <input
                type="checkbox"
                id="testsForMale"
                name={"testsForMale"}
                onChange={handleChange}
                checked={payload?.testsForMale}
              />
            </div>
          </>
        }
      />
      {payload?.testsForMale === 1 && (
        <div className="row p-2">
          <MultiSelectComp
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            name="MalePartner"
            id="MalePartner"
            placeholderName={t("Search Investigations")}
            handleChange={handleMultiSelectChange}
            value={payload?.MalePartner}
            dynamicOptions={investigation?.map((item) => ({
              name: item?.TypeName,
              code: item?.Type_ID,
            }))}
          />
        </div>
      )}

      <Heading
        title={t("Treatment Risks")}
        defaultValue={true}
        secondTitle={
          <>
            <div className="">
              <input
                type="checkbox"
                id="treatmentRisks"
                name={"treatmentRisks"}
                onChange={handleChange}
                checked={payload?.treatmentRisks}
              />
            </div>
          </>
        }
      />
      {payload?.treatmentRisks === 1 && (
        <div className="row p-2">
          <CheckboxWithInput
            checkboxId="IsRisksExplained"
            checkboxName="IsRisksExplained"
            checkboxValue={payload?.IsRisksExplained}
            label={t("Explain treatment risks")}
            inputName="ExplaineRisk"
            inputValue={payload?.ExplaineRisk}
            handleChange={handleChange}
          />
        </div>
      )}
      <Heading
        title={t("Donor Information")}
        secondTitle={
          <>
            <div className="">
              <input
                type="checkbox"
                id="donerInformation"
                name={"donerInformation"}
                onChange={handleChange}
                checked={payload?.donerInformation}
              />
            </div>
          </>
        }
      />
      {payload?.donerInformation === 1 && (
        <div className="row p-2">
          <CheckboxWithInput
            checkboxId="Ishusbandsinfo"
            checkboxName="Ishusbandsinfo"
            checkboxValue={payload?.Ishusbandsinfo}
            label={t("Husband (use husband's info)")}
            inputName="husbandsinfo"
            inputValue={payload?.husbandsinfo}
            handleChange={handleChange}
          />

          <CheckboxWithInput
            checkboxId="IsOutsideDonor"
            checkboxName="IsOutsideDonor"
            checkboxValue={payload?.IsOutsideDonor}
            label={t("Outside Donor")}
            inputName="OutsideDonor"
            inputValue={payload?.OutsideDonor}
            handleChange={handleChange}
          />
        </div>
      )}

      <Heading
        title={t("IVF Estimated Costing")}
        secondTitle={
          <>
            <div className="">
              <input
                type="checkbox"
                id="ivfEstimated"
                name={"ivfEstimated"}
                onChange={handleChange}
                checked={payload?.ivfEstimated}
              />
            </div>
          </>
        }
      />
      {payload?.ivfEstimated === 1 && (
        <>
          <div className="p-2">
            <Heading title={t("Payment & Refund Policies")} />
          </div>

          <div className="row p-2">
            <CheckboxWithInput
              checkboxId="IsOnetimePackage"
              checkboxName="IsOnetimePackage"
              checkboxValue={payload?.IsOnetimePackage}
              label={t("One-time Package")}
              inputName="OnetimePackage"
              inputValue={payload?.OnetimePackage}
              handleChange={handleChange}
            />

            <CheckboxWithInput
              checkboxId="IsEMIOption"
              checkboxName="IsEMIOption"
              checkboxValue={payload?.IsEMIOption}
              label={t("EMI Option")}
              inputName="EMIOption"
              inputValue={payload?.EMIOption}
              handleChange={handleChange}
            />

            <CheckboxWithInput
              checkboxId="IsRefundPolicyExplained"
              checkboxName="IsRefundPolicyExplained"
              checkboxValue={payload?.IsRefundPolicyExplained}
              label={t("Refund Policy Explained")}
              inputName="RefundPolicyExplained"
              inputValue={payload?.RefundPolicyExplained}
              handleChange={handleChange}
            />
          </div>

          <div className="p-2">
            <Heading title={t("Financial Counselling")} />
          </div>

          <div className="row p-2">
            <TextAreaInput
              lable="Psychological Support"
              id="PsychologicalSupport"
              name="PsychologicalSupport"
              value={payload?.PsychologicalSupport}
              onChange={handleChange}
              placeholder=""
              maxLength={200}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />

            <ReactSelect
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              id="InsuranceCoverage"
              name="InsuranceCoverage"
              value={payload?.InsuranceCoverage}
              placeholderName="Insurance & Coverage"
              handleChange={handleReactSelect}
            />

            <ReactSelect
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              id="GovernmentNGOSchemes"
              name="GovernmentNGOSchemes"
              value={payload?.GovernmentNGOSchemes}
              placeholderName="Government / NGO Schemes"
              handleChange={handleReactSelect}
              dynamicOptions={[
                { label: t("NGO Scheme 1"), value: "NGO Scheme 1" },
                { label: t("NGO Scheme 2"), value: "NGO Scheme 2" },
              ]}
            />
            <label className="col-sm-12">{t("Cost-Saving Guidance")}</label>
            <div className="col-sm-12">
              <input
                type="checkbox"
                id="Isgenericmedicines"
                name="Isgenericmedicines"
                onChange={handleChange}
                checked={payload?.Isgenericmedicines}
              />
              <label htmlFor="Isgenericmedicines" className="ml-2">
                {t("Use of generic medicines when safe")}
              </label>
            </div>
            <div className="col-sm-12">
              <input
                type="checkbox"
                id="IsMultiPackage"
                name="IsMultiPackage"
                onChange={handleChange}
                checked={payload?.IsMultiPackage}
              />
              <label htmlFor="IsMultiPackage" className="ml-2">
                {t("Choosing packages (multi-cycle) instead of single cycle")}
              </label>
            </div>
          </div>

          <div className="p-2">
            <Heading title={t("Payment Plans")} />
          </div>
          <div className="row p-2">
            <TextAreaInput
              lable={t("Explain payment plans")}
              placeholder=""
              id="paymentPlans"
              name="paymentPlans"
              value={payload?.paymentPlans}
              maxLength={200}
              onChange={handleChange}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
          </div>
          <div className="p-2">
            <Heading title={t("Treatment Cycle Costs")} />
          </div>

          <div className="row p-2">
            <CheckboxWithInput
              checkboxId="IsOvarianStimulationMed"
              checkboxName="IsOvarianStimulationMed"
              checkboxValue={payload?.IsOvarianStimulationMed}
              label={t("Ovarian Stimulation Medicines (injections, tablets)")}
              inputName="OvarianStimulationMed"
              inputValue={payload?.OvarianStimulationMed}
              handleChange={handleChange}
            />

            <CheckboxWithInput
              checkboxId="IsMonitoring"
              checkboxName="IsMonitoring"
              checkboxValue={payload?.IsMonitoring}
              label={t("Monitoring (ultrasounds)")}
              inputName="Monitoring"
              inputValue={payload?.Monitoring}
              handleChange={handleChange}
            />

            <CheckboxWithInput
              checkboxId="IsEggRetrieval"
              checkboxName="IsEggRetrieval"
              checkboxValue={payload?.IsEggRetrieval}
              label={t("Egg Retrieval Procedure")}
              inputName="EggRetrieval"
              inputValue={payload?.EggRetrieval}
              handleChange={handleChange}
            />

            <CheckboxWithInput
              checkboxId="IsLabFertilization"
              checkboxName="IsLabFertilization"
              checkboxValue={payload?.IsLabFertilization}
              label={t("Laboratory Fertilization (IVF/ICSI)")}
              inputName="LabFertilization"
              inputValue={payload?.LabFertilization}
              handleChange={handleChange}
            />
            <CheckboxWithInput
              checkboxId="IsEmbryoCulture"
              checkboxName="IsEmbryoCulture"
              checkboxValue={payload?.IsEmbryoCulture}
              label={t("Embryo Culture & Freezing")}
              inputName="EmbryoCulture"
              inputValue={payload?.EmbryoCulture}
              handleChange={handleChange}
            />
            <CheckboxWithInput
              checkboxId="IsEmbryoTransfer"
              checkboxName="IsEmbryoTransfer"
              checkboxValue={payload?.IsEmbryoTransfer}
              label={t("Embryo Transfer")}
              inputName="EmbryoTransfer"
              inputValue={payload?.EmbryoTransfer}
              handleChange={handleChange}
            />
          </div>
          <div className="p-2">
            <Heading title={t("Additional / Optional Costs")} />
          </div>

          <div className="row p-2">
            <CheckboxWithInput
              checkboxId="IsDonorEggsSperm"
              checkboxName="IsDonorEggsSperm"
              checkboxValue={payload?.IsDonorEggsSperm}
              label={t("Donor Eggs")}
              inputName="DonorEggsSperm"
              inputValue={payload?.DonorEggsSperm}
              handleChange={handleChange}
            />
            <CheckboxWithInput
              checkboxId="donorSperm"
              checkboxName="donorSperm"
              checkboxValue={payload?.donorSperm}
              label={t("Donor Sperm")}
              inputName="donorSperm"
              inputValue={payload?.donorSperm}
              handleChange={handleChange}
            />

            <CheckboxWithInput
              checkboxId="IsSurrogacyArrangements"
              checkboxName="IsSurrogacyArrangements"
              checkboxValue={payload?.IsSurrogacyArrangements}
              label={t("Surrogacy Arrangements")}
              inputName="SurrogacyArrangements"
              inputValue={payload?.SurrogacyArrangements}
              handleChange={handleChange}
            />

            <CheckboxWithInput
              checkboxId="IsGeneticTesting"
              checkboxName="IsGeneticTesting"
              checkboxValue={payload?.IsGeneticTesting}
              label={t("Genetic Testing (PGT/PGD)")}
              inputName="GeneticTesting"
              inputValue={payload?.GeneticTesting}
              handleChange={handleChange}
            />

            <CheckboxWithInput
              checkboxId="IsFreezingStorageCharges"
              checkboxName="IsFreezingStorageCharges"
              checkboxValue={payload?.IsFreezingStorageCharges}
              label={t("Freezing & Storage Charges")}
              inputName="FreezingStorageCharges"
              inputValue={payload?.FreezingStorageCharges}
              handleChange={handleChange}
            />
            <CheckboxWithInput
              checkboxId="IsCycleCosts"
              checkboxName="IsCycleCosts"
              checkboxValue={payload?.IsCycleCosts}
              label={t("Second or Third Cycle Costs")}
              inputName="CycleCosts"
              inputValue={payload?.CycleCosts}
              handleChange={handleChange}
            />
          </div>

          <div className="row p-2">
            <ReactSelect
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              id="package"
              name="package"
              value={payload?.package}
              placeholderName="Package"
              handleChange={handleReactSelect}
              dynamicOptions={packageList?.map((ele) => ({
                label: ele?.PackageName,
                value: ele?.PackageID,
              }))}
            />

            <Input
              type="number"
              className="form-control"
              id="OtherAmounts"
              removeFormGroupClass={false}
              name="OtherAmounts"
              lable={t("OtherAmounts")}
              required={true}
              onChange={handleChange}
              value={payload?.OtherAmounts}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
            />
            <div className="col-sm-2">
              <button
                className="btn btn-success btn-lg"
                onClick={handleSaveOrUpdateCounselling}
              >
                {!isUpdate ? t("Save") : t("Update")}
              </button>
            </div>
          </div>
        </>
      )}
      <Heading title={t("Records")} />

      <Tables
        thead={[
          { name: "S.N", width: "10%" },
          { name: t("Date"), width: "10%" },
          { name: t("Created By"), width: "10%" },
          { name: t("Edit"), width: "2%" },
          { name: t("Print"), width: "2%" },
        ]}
        tbody={tableData?.map((ele, index) => ({
          SrNo: index + 1,
          CreatedDate: ele?.CreatedDate,
          CreatedBy: ele?.CreatedBy,
          Edit: (
            <i
              className="fa fa-edit"
              aria-hidden="true"
              onClick={() => {
                handleEdit(ele);
              }}
            ></i>
          ),
          Print: (
            <div onClick={() => handleRowPrint(ele)}>
              <ReprintSVG />
            </div>
          ),
          // Print: <div onClick={() => handleRowPrint(item)}><ReprintSVG /></div>,
        }))}
      />
    </>
  );
};

export default IVFCounselling;

/* ------------------ Reusable Component ------------------ */

const CheckboxWithInput = ({
  checkboxId,
  checkboxName,
  checkboxValue,
  label,
  inputName,
  inputValue,
  handleChange,
}) => {
  return (
    <>
      <div className="col-sm-3">
        <input
          type="checkbox"
          id={checkboxId}
          name={checkboxName}
          onChange={handleChange}
          checked={checkboxValue}
        />
        <label htmlFor={checkboxId} className="ml-2">
          {label}
        </label>
      </div>

      <Input
        type="text"
        className="form-control"
        name={inputName}
        id={inputName}
        value={inputValue}
        respclass="col-xl-2 col-md-3 col-sm-4 col-12"
        onChange={handleChange}
      />
    </>
  );
};
