import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ReactSelect from "../formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import { ChangeTypeOption } from "../../utils/constant";
import {
  BillingCategory,
  bindPanelRoleWisePanelGroupWise,
  GetPatientAdmissionDetails,
  LoadDiffPanelRates,
  SaveTariffic,
} from "../../networkServices/BillingsApi";
import Heading from "../UI/Heading";
import TariffModificationTable from "../UI/customTable/billings/TariffModificationTable";
import LabeledInput from "../formComponent/LabeledInput";
import { notify } from "../../utils/utils";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { bindPanelByPatientID } from "../../networkServices/opdserviceAPI";
import { translateOptions } from "@components/WrapTranslate";
import { BindCorporatePanelList } from "../../networkServices/EDP/edpApi";
import SeeMore from "../UI/SeeMore";
import OverLay from "../modalComponent/OverLay";
import SeeMoreList from "../commonComponents/SeeMoreList";

/* onSaved - tabhi aata hai jab ye screen Billing page ke pop-up me khuli ho.
   Tariff change bill ke rate hi badal deta hai, isliye save ke baad peeche
   wale page ke jod taaza karne padte hain. Frame menu se khulne par ye prop
   aata hi nahi aur screen pehle jaisi chalti hai. */
const TariffChange = ({ data, onSaved }) => {
  const { t } = useTranslation();
  const ip = useLocalStorage("ip", "get");

  /* Update ka button abhi tabhi dikhta hai jab niche ki table me kuch ho.

     Table LoadDiffPanelRates se banti hai, aur wo query seedhe
     f_ledgertnxdetail par chalti hai - yaani bill me jo charge PEHLE SE lage
     hain unka maujooda rate aur naye panel ka rate milakar farq dikhati hai.
     Abhi-abhi admit hue patient par koi charge hota hi nahi, to table khaali
     rehti hai aur uske saath button bhi gayab ho jaata hai.

     Par SaveTariffic ko table ki ek bhi row chahiye nahi - wo sirf panel /
     billing category / TID bhejta hai. Isliye button table se alag kiya ja
     sakta hai.

     fin_global_resources -> TariffChangeUpdateWithoutCharges

        0 / row hi na ho  ->  pehle jaisa. Charge na ho to button bhi nahi.
        1                 ->  button charge na hone par bhi dikhta hai, taaki
                              naye patient ka panel pehle hi badla ja sake.

     Ye sirf button DIKHANE ki baat hai. Save se pehle jo jaanch pehle se
     lagti thi (Change Type, Panel / Billing Category, Tariff Change chuna hai
     ya nahi) wo waisi ki waisi chalti hai, aur server ki apni jaanch bhi. */
  const { GetGlobalResources } = useSelector((state) => state?.CommonSlice);
  const showUpdateWithoutCharges =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find(
      (item) => item?.Name === "TariffChangeUpdateWithoutCharges",
    )?.Value === "1";
  const [billingCategory, setBillingCategory] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [panel, setPanel] = useState([]);
  const [originalBillingData, setOriginalBillingData] = useState([]);
  const [corporatePanelList, setCorporatePanelList] = useState([]);
  const initialState = {
    /* Screen khulte hi "On Change of Panel" chuna hua aata hai (ChangeTypeOption
       me iski value "1" hai, aur "2" Billing Category ki).

       Pehle "2" tha, to screen khulte hi niche ki table apne aap bhar jaati thi -
       par wo patient ki APNI billing category se tulna hoti thi, yaani har line
       par farq 0. Ab "1" ke saath table tabhi bharti hai jab panel chuna jaye,
       jo asal me dekhne layak baat hai. */
    ChangeType: "1",
    billCategory: "",
    panelID: "",
    corporatePanelID: "",
    insuranceID: "",
    isTariffChange: "0",
  };

  const [payload, setPayload] = useState({ ...initialState });

  // Three-dot menu next to Panel: "Add/Remove Panels List" (same popup as OPD Booking / Emergency),
  // so a panel the patient does not have yet can be added before changing to it.
  const [panelPopup, setPanelPopup] = useState({ visible: false, name: "", component: null });

  const handleReactSelect = (name, value) => {
    setPayload((prevData) => ({
      ...prevData,
      [name]: value?.value || "",
    }));

    if (name == "ChangeType") {
      if (payload?.ChangeType === "1") {
        setPayload((prevData) => ({
          ...prevData,
          billCategory: "",
        }));
      } else {
        setPayload((prevData) => ({
          ...prevData,
          billCategory: "",
        }));
        // getBindBillingCategory();
      }
    }
    if (name === "billCategory") {
      getLoadDiffPanelRates({ ...payload, [name]: value?.value });
    }
    if (name === "insuranceID") {
      // Clear the selected scheme if it doesn't belong to the chosen insurance.
      const selectedPanel = panel?.find((item) => item?.PanelID == payload?.panelID);
      if (value?.value && selectedPanel && selectedPanel?.ParentPanelID != value?.value) {
        setPayload((prevData) => ({ ...prevData, panelID: "" }));
      }
    }
    if (name === "panelID") {
      getLoadDiffPanelRates({ ...payload, [name]: value?.value });
    }
  };

  // Corporate list + the corporate already saved on this admission (pre-selected).
  const getBindCorporatePanel = async () => {
    try {
      const [listResponse, admissionResponse] = await Promise.all([
        BindCorporatePanelList(),
        GetPatientAdmissionDetails(data?.patientID, data?.transactionID),
      ]);
      setCorporatePanelList(listResponse?.data || []);
      const savedCorporateID = admissionResponse?.data?.admissionDetails?.[0]?.corporatePanelID;
      setPayload((prevData) => ({
        ...prevData,
        corporatePanelID: Number(savedCorporateID) ? String(savedCorporateID) : "",
      }));
    } catch (error) {
      setCorporatePanelList([]);
      console.error("Error fetching corporate panel data", error);
    }
  };
  const getBindBillingCategory = async () => {
    try {
      const response = await BillingCategory();
      setBillingCategory(response?.data || []);
      setOriginalBillingData(response?.data || []);
    } catch (error) {
      console.error("Error fetching billing categories", error);
    }
  };

  const getLoadDiffPanelRates = async (updatedPayload = payload) => {
    debugger
    const dataFound = panel.length > 0 ? panel?.find((item) => item?.PanelID == updatedPayload?.panelID) : {};

    const listPayload = {
      tid: Number(data?.transactionID),
      panelID:
        updatedPayload?.ChangeType == "1" ? updatedPayload?.panelID : data?.panelID,
      ipdCaseTypeID:
        updatedPayload?.ChangeType == "2"
          ? Number(updatedPayload?.billCategory ? updatedPayload?.billCategory : data?.ipdCaseTypeID)
          : Number(data?.ipdCaseTypeID),
      scheduleChargeID: updatedPayload?.ChangeType == "1" ? dataFound?.ScheduleChargeIDIPD : Number(data?.scheduleChargeID),
      actualPanelID: updatedPayload?.ChangeType == "1" ? dataFound?.ReferenceCode : Number(data?.panelID),
    };

    try {
      const response = await LoadDiffPanelRates(listPayload);
      setTableData(response?.data);
    } catch (error) {
      setTableData([]);
      console.error("Error fetching table data", error);
    }
  };

  // const getBindPanelGroup = async () => {
  //   try {
  //     const response = await bindPanelRoleWisePanelGroupWise();
  //     setPanel(response?.data || []);
  //   } catch (error) {
  //     console.error("Error fetching panel data", error);
  //   }
  // };


  const handleSave = async () => {
    const dataFound = panel.length > 0 ? panel?.find((item) => item?.PanelID == payload?.panelID) : ""
    const corporateFound = corporatePanelList?.find((item) => item?.PanelID == payload?.corporatePanelID);
    const originalDataFound = originalBillingData.length > 0 ? originalBillingData?.find((item) => item?.IPDCaseTypeID == payload?.billCategory) : ""
    if (!payload?.ChangeType) {
      notify(t("Please Select Change Type"), "error");
      return
    }
    if (payload?.ChangeType == "2" && !payload?.billCategory) {
      notify(t("Please Select Billing Category"), "error");
      return
    }
    if (payload?.ChangeType == "1" && !payload?.panelID) {
      notify(t("Please Select Panel"), "error");
      return
    }
    if (!payload?.isTariffChange) {
      notify(t("Please Select Is Tariff Change"), "error");
      return
    }
    try {
      const requestBody = {
        IpAddress: ip,
        ScheduleChargeID: payload?.ChangeType == "1" ? dataFound?.ScheduleChargeIDIPD : Number(data?.scheduleChargeID),
        IPDCaseTypeID:
          payload?.ChangeType == "2"
            ? Number(payload?.billCategory)
            : Number(data?.ipdCaseTypeID),
        TID: Number(data?.transactionID),
        PanelID:  
          payload?.ChangeType == "1" ? payload?.panelID : data?.panelID,
        PanelName: payload?.ChangeType == "1" ? dataFound?.PanelName : data?.company_Name,
        IPDCaseTypeBillName: payload?.ChangeType == "2" ? originalDataFound?.Name : data?.ipdCaseTypeBillName,
        TarrifChange: payload?.isTariffChange ? Number(payload?.isTariffChange) : 0,
        PatientID:data?.patientID??"",
        ...(payload?.ChangeType == "1" && {
          CorporatePanelID: corporateFound?.PanelID ? Number(corporateFound?.PanelID) : 0,
          CorporatePanelName: corporateFound?.Company_Name || "",
        }),
      };
      const response = await SaveTariffic(requestBody);

      if (response?.success) {
        notify(response?.message, "success");
        getLoadDiffPanelRates();
        if (onSaved) onSaved();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.error("Something went wrong", error);
    }
  };
  console.log("payload", payload, data)

  useEffect(() => {
    // getBindBillingCategory();
    // getBindPanelGroup();
    getLoadDiffPanelRates();
  }, []);

  useEffect(() => {
    if (payload?.ChangeType == "2") {
      getBindBillingCategory();
    }
  }, [payload?.ChangeType])
  useEffect(() => {
    if (payload?.ChangeType == "1") {
      handleBindPanelByPatientID();
      getBindCorporatePanel();
    }
  }, [payload?.ChangeType])




  const thead = [
    { width: "3%", name: t("S.No.") },
    { width: "30%", name: t("Category") },
    t("Current Gross Bill"),
    t("Total Disc. Amt."),
    t("Proposed Gross Bill"),
    t("Proposed Panel Disc. Amt."),
    t("Diff. in Gross Amt."),
  ];

  const TotalCurrentGrossBill = tableData?.length > 0 ? tableData?.reduce((acc, item) => {
    return acc + item.CurrentGrossBill;
  }, 0) : 0;
  const TotalProposedGrossBill = tableData?.length > 0 ? tableData?.reduce((acc, item) => {
    return acc + item.ProposedGrossBill;
  }, 0) : 0;
  const totalDiff = tableData?.length > 0 ? tableData?.reduce((acc, item) => {
    return acc + item.GrossAmtDiff;
  }, 0) : 0;

  const handleBindPanelByPatientID = async (PatientID) => {
    const item = PatientID ? PatientID : data?.patientID;
    try {
      const data = await bindPanelByPatientID(item);
      const panelList = data?.data || [];
      setPanel(panelList);
      // Pre-select the insurance of the patient's default panel.
      const defaultPanel = panelList.find((ele) => ele?.isDefaultPanel == 1) || panelList[0];
      setPayload((prevData) => ({
        ...prevData,
        insuranceID: defaultPanel?.ParentPanelID ? String(defaultPanel?.ParentPanelID) : "",
      }));
    } catch (error) {
      console.log(error);
    }
  };


  // useEffect(() => {
  //   handleBindPanelByPatientID();
  // }, [payload?.ChangeType])

  // Unique insurance list (ParentPanelID / ParentPanel) from the patient's panels.
  const insuranceOptions = [
    ...new Map(
      panel
        ?.filter((item) => item?.ParentPanelID)
        .map((item) => [
          String(item?.ParentPanelID),
          { label: item?.ParentPanel, value: String(item?.ParentPanelID) },
        ])
    ).values(),
  ];

  const schemeOptions = panel
    ?.filter((item) => !payload?.insuranceID || item?.ParentPanelID == payload?.insuranceID)
    .map((item) => ({
      label: item?.PanelName,
      value: item?.PanelID,
    }));
  const openAddRemovePanels = () => {
    const [item] = SeeMoreList(
      [{ ID: 2, MenuName: t("Add/Remove Panels List"), MenuURL: "Add/RemovePanelsList" }],
      {
        PatientID: data?.patientID,
        TransactionID: data?.transactionID,
        setVisible: (visible) => setPanelPopup((p) => ({ ...p, visible })),
        bindDetailAPI: () => {},
        // Panel list of this screen is refreshed after "Update Panel".
        handleBindPanelByPatientID: () => handleBindPanelByPatientID(),
      },
    );
    setPanelPopup({ visible: true, name: item?.name, component: item?.component });
  };

  console.log("payload", payload)

  return (
    <div className="card">
      <Heading title={t("Tariff Change")} />
      <div className="row p-2">
        <ReactSelect
          placeholderName={t("Change Type")}
          id="ChangeType"
          searchable={true}
          respclass="col-xl-2 col-md-2 col-sm-6 col-12"
          name="ChangeType"
          dynamicOptions={translateOptions(ChangeTypeOption, t)}
          value={payload?.ChangeType}
          handleChange={handleReactSelect}
        />
        {payload?.ChangeType === "1" && (
          <ReactSelect
            placeholderName={t("Insurance Name")}
            id="insuranceID"
            searchable={true}
            respclass="col-xl-2 col-md-2 col-sm-6 col-12"
            name="insuranceID"
            value={payload?.insuranceID}
            handleChange={handleReactSelect}
            dynamicOptions={insuranceOptions}
          />
        )}
        <ReactSelect
          placeholderName={t(
            payload?.ChangeType === "2" ? t("Proposed Billing Category") : t("Panel")
          )}
          id="billCategory"
          searchable={true}
          respclass="col-xl-2 col-md-2 col-sm-6 col-12"
          name={payload?.ChangeType === "2" ? "billCategory" : "panelID"}
          value={payload?.ChangeType === "2" ? payload?.billCategory : payload?.panelID}
          handleChange={handleReactSelect}
          dynamicOptions={
            payload?.ChangeType === "2"
              ? billingCategory.map((ele) => ({
                label: ele?.Name,
                value: ele?.IPDCaseTypeID,
              }))
              : schemeOptions
          }
        />
        {payload?.ChangeType === "1" && (
          <ReactSelect
            placeholderName={t("Corporate")}
            id="corporatePanelID"
            searchable={true}
            respclass="col-xl-2 col-md-2 col-sm-6 col-12"
            name="corporatePanelID"
            value={payload?.corporatePanelID}
            handleChange={(name, value) =>
              setPayload((prevData) => ({ ...prevData, [name]: value?.value || "" }))
            }
            dynamicOptions={corporatePanelList.map((item) => ({
              label: item?.Company_Name,
              value: String(item?.PanelID),
            }))}
          />
        )}
        {payload?.ChangeType !== "2" && (
          <div className="col-auto d-flex align-items-center px-0">
            <SeeMore
              Header={
                <button className="btn btn-sm btn-primary" type="button" title={t("More")}>
                  <i className="fa fa-ellipsis-v"></i>
                </button>
              }
            >
              <div
                style={{ padding: "6px 14px", cursor: "pointer", whiteSpace: "nowrap" }}
                onClick={openAddRemovePanels}
              >
                {t("Add/Remove Panels List")}
              </div>
            </SeeMore>
          </div>
        )}
        <ReactSelect
          placeholderName={t("Include Tariff Change Conversion")}
          id="isTariffChange"
          searchable={true}
          respclass="col-xl-2 col-md-2 col-sm-6 col-12"
          name="isTariffChange"
          dynamicOptions={[
            { label: t("Yes"), value: "1" },
            { label: t("No"), value: "0" },
          ]}
          value={payload?.isTariffChange}
          handleChange={handleReactSelect}
        />
      </div>
      <div className="row">
        <div className="col-sm-12">
          <TariffModificationTable THEAD={thead} tbody={tableData} />
        </div>
      </div>
      {tableData?.length > 0 ? (
        <div className="row p-2">
          <div className="col-sm-2">
            <LabeledInput
              label={t("Current Gross Total")}
              value={TotalCurrentGrossBill}
            />
          </div>
          <div className="col-sm-2">
            <LabeledInput
              label={t("Proposed Gross Total")}
              value={TotalProposedGrossBill}
            />
          </div>
          <div className="col-sm-2">
            <LabeledInput label={t("Total Gross AmtDiff")} value={totalDiff} />
          </div>
          <div className="col-sm-2">
            <button className="btn btn-sm btn-success" onClick={handleSave}>
              {t("Update")}
            </button>
          </div>
        </div>
      ) : showUpdateWithoutCharges ? (
        /* Bill me abhi koi charge nahi hai. Teen jod wale khane jaan-bujh kar
           nahi dikhaye ja rahe - teeno 0 aate aur user ko lagta ki hisaab
           laga kar 0 nikla hai, jabki hisaab lagane ko kuch tha hi nahi.
           Isliye seedha batana aur button. */
        <div className="row p-2">
          <div className="col-sm-12 d-flex align-items-center flex-wrap">
            <span className="mr-3" style={{ fontSize: "12.5px", opacity: 0.8 }}>
              {t(
                "Is bill me abhi koi charge nahi hai, isliye tulna nahi dikhayi ja sakti. Panel / billing category ab bhi badli ja sakti hai.",
              )}
            </span>
            <button className="btn btn-sm btn-success" onClick={handleSave}>
              {t("Update")}
            </button>
          </div>
        </div>
      ) : null}
      <OverLay
        visible={panelPopup.visible}
        setVisible={(visible) => setPanelPopup((p) => ({ ...p, visible }))}
        Header={panelPopup.name}
      >
        {panelPopup.component}
      </OverLay>
    </div>
  );
};

export default TariffChange;
