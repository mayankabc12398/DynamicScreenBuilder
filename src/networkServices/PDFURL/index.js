import { toast } from "react-toastify";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { apiUrls } from "../apiEndpoints";
import { APIBaseURL } from "../axiosInstance";

// const baseurl = import.meta.env.VITE_APP_REACT_APP_BASE_URL;
// const dynamicUrl = import.meta.env.VITE_APP_REACT_APP_DYNAMIC_URL === "true";
// const baseFromEnv = import.meta.env.VITE_APP_REACT_APP_BASE_URL;
// const baseUrl = dynamicUrl
//   ? `${window.location.protocol}//${window.location.hostname}${
//       window.location.port ? `:${window.location.port}` : ""
//     }/api/v1`
//   : baseFromEnv;

export const OpenPDFURL = (name, ...args) => {
  const urls = {
    // NursingWard
    NursingWardDeceasedPrint: (TID) =>
      `${apiUrls?.NursingWardDeceasedPrint}?TID=${TID}`,

    OPDSericeReceipt: (LedgerTransactionNo, Type) =>
      `${apiUrls?.CommonReciept_PDFCommonReceiptPdf}?LedgerTransactionNo=${LedgerTransactionNo}&Type=${Type}`,
    PrintIssueReport: (IndentNo, salesno, printall) =>
      `${apiUrls?.PrintIssue}?IndentNo=${IndentNo}&salesno=${salesno}&printall=${printall}`,

    OPDAdvanceReceipt: (LedgerTransactionNo, ReceiptNo, Type) =>
      `${apiUrls?.CommonReciept_PDFCommonReceiptPdf}?LedgerTransactionNo=${LedgerTransactionNo}&IsBill=0&ReceiptNo=${ReceiptNo}&Type=${Type}`,

    PrintVitalSignChart: (TID) => `${apiUrls?.PrintVitalSignChart}?TID=${TID}`,
    NursingProgressPrintOut: (TID, isEmergency) =>
      `${apiUrls?.PrintNurNote}?TransactionID=${TID}&isEmergency=${isEmergency}`,
    NursingWardPrintNurNote: (TransactionID, isEmergency) =>
      `${apiUrls?.NursingWardPrintNurNote}?TransactionID=${TransactionID}&isEmergency=${isEmergency}`,

    NursingWardDischargeCheckListPrint: (TID) =>
      `${apiUrls?.NursingWardDischargeCheckListPrint}?TID=${TID}`,

    NursingWardDiabeticChartPrint: (tid, pid, emgNo) =>
      `${apiUrls?.NursingWardDiabeticChartPrint}?tid=${tid}&pid=${pid}&emgNo=${emgNo}`,

    NursingWardIntakeOutPutChartPrint: (TID, Date) =>
      `${apiUrls?.NursingWardIntakeOutPutChartPrint}?TID=${TID}&Date=${Date}`,
    NursingWardAdultFallRiskPrint: (TID, FromDate, ToDate) =>
      `${apiUrls?.NursingWardAdultFallRiskPrint}?TID=${TID}&FromDate=${FromDate}&ToDate=${ToDate}`,
    NursingWardNeedleInjuryPrint: (TID, Date) =>
      `${apiUrls?.NursingWardNeedleInjuryPrint}?TID=${TID}&Date=${Date}`,
    NursingWardBabyChartPrint: (TID) =>
      `${apiUrls?.NursingWardBabyChartPrint}?TID=${TID}`,
    // print card
    PrintStickerPrintOut: (patId) => `${apiUrls?.PrintSticker}?patId=${patId}`,
    ViewReqEmgPrint: (transactionID) =>
      `${apiUrls?.ViewReqEmgPrintURL}?transactionID=${transactionID}`,
    PrintRequisition: (IndentNo, Status, ReportType) =>
      `${apiUrls?.PrintRequisition}?IndentNo=${IndentNo}&Status=${Status}&ReportType=${ReportType}`,
    PrintCardPrintOut: (pid, LedgerTransactionNo = 125) =>
      `${apiUrls?.PrintCard}?pid=${pid}&LedgerTransactionNo=${LedgerTransactionNo}`,

    CommonReceiptPdf: (detail) =>
      `${apiUrls?.CommonReciept_PDFCommonReceiptPdf}?ReceiptNo=${detail?.ReceiptNo}&LedgerTransactionNo=${detail?.LedgerTransactionNo}&IsBill=${detail?.PrintType === "1" ? 1 : 0}&Duplicate=${detail?.IsAllowedOriginalPrintValue ? 0 : 1}&Type=OPD`,
    IPDCommonReceiptPdf: (detail) =>
      `${apiUrls?.CommonReciept_PDFCommonReceiptPdf}?ReceiptNo=${detail?.ReceiptNo}&Duplicate=${detail?.IsAllowedOriginalPrintValue ? 0 : 1}&Type=IPD`,

    PEWSChartPrintOut: (fromDate, toDate, TID) =>
      `${apiUrls?.PhysiologicalEWSPrint}?FromDate=${fromDate}&ToDate=${toDate}&TID=${TID}`,

    GasChartPrintOut: (TID) => `${apiUrls?.BloodGasChartPrint}?TID=${TID}`,

    DoctorPrescriptionPrint: (details) =>
      `${apiUrls?.DoctorPrescriptionPrint}?pid=${details?.PatientID}&TransactionID=${details?.TransactionID}&AppID=${details?.App_ID}`,

    ReportsRegistrationDetail: (details) =>
      `${apiUrls?.ReportsRegistrationDetail}?FromDate=${details?.fromDate}&ToDate=${details?.toDate}&CentreID=${details?.centre}&CountryId=${details?.country}&StateId=${details?.state}&DistrictId=${details?.district}&CityId=${details?.city}&Village=${'""'}`,

    OPDAdvanceOutStandingReport: (details) =>
      `${apiUrls?.OPDAdvanceOutStandingReport}?FromDate=${details?.fromDate}&ToDate=${details?.toDate}&CentreId=${details?.centre}&PaymentModeType=${details?.paymentType}&AdvanceOutStan=${details?.type}&MrNo=${details?.UHID ? details?.UHID : '""'}`,

    RefundReport: (details) =>
      `${apiUrls?.RefundReport}?FromDate=${details?.fromDate}&ToDate=${details?.toDate}&CentreId=${details?.centre}&ReportType=${details?.reportType}`,

    DoctorRealtedOpdReportsRefundReport: (reportParams) =>
      `${apiUrls?.DoctorRealtedOpdReportsRefundReport}?${reportParams}`,
    // OPDBillRegisterReports: (details) =>
    //   `${apiUrls?.OPDBillRegisterReports}?FromDate=${details?.fromDate}&ToDate=${details?.toDate}&CentreId=${details?.centre}&PanelID=${details?.panel}&Type=${details?.type}&groupwise=${details?.groupBy}&BillNo=${details?.billNo}&UHID=${details?.UHID}`,

    PatientHistoryDetails: (details) =>
      `${apiUrls?.PatientHistoryDetails}?FromDate=${details?.fromDate ? details?.fromDate : '""'}&ToDate=${details?.toDate}&UHID=${details?.UHID}`,
    CommonReceiptPdf: (details) =>
      `${apiUrls?.CommonReceiptPdf}?ledgerTransactionNo=${details?.ledgerTransactionNo ? details?.ledgerTransactionNo : '""'}&isBill=${details?.isBill}&receiptNo=${details?.receiptNo ? details?.receiptNo : ""}&duplicate=${details?.duplicate ? details?.duplicate : ""}&type=${details?.type ? details?.type : ""}&supplierID=${details?.supplierID ? details?.supplierID : ""}&billNo=${details?.billNo ? details?.billNo : ""}&isEMGBilling=${details?.isEMGBilling ? details?.isEMGBilling : ""}&isOnlinePrint=${details?.isOnlinePrint ? details?.isOnlinePrint : ""}&isRefound=${details?.isRefound ? details?.isRefound : ""}`,
  };

  GeneratePDFURL(urls[name](...args));
};

export const GeneratePDFURL = (url) => {
  const validUser = useLocalStorage("userData", "get");
  const parameterChecker = () => {
    const symbol = url.includes("?") ? "&" : "?";
    return symbol;
  };
  const finalUrl = validUser
    ? `${url}${parameterChecker()}userValidateID=${validUser?.userValidateID}`
    : url;

  RedirectURL(finalUrl);
  console.log(finalUrl, "finalUrl");
};

/* Print ka naya tab khulwana.

   Pehle yahan sirf window.open tha aur uska nateeja kahin pakda nahi jaata tha.
   Browser us tab ko rok de to window.open null lautata hai - aur kuch na hone ke
   kaaran screen par koi nishaan nahi chhodta: na tab, na galti ka message. Bill
   ban chuka hota hai, screen saaf ho jaati hai, bas print gayab.

   Browser aisa kab karta hai: jab khulne ka hukm user ke click se seedha na jude.
   Pharmacy Issue me Save aur print ke beech teen API call aati hain (bill, hash,
   PDF), aur itni der me browser ka "abhi click hua tha" wala hisaab khatm ho
   chuka hota hai - isliye wahan ye sabse zyada hota hai.

   Ab tab ruk jaye to user ko ek message dikhta hai jise daba kar wo print khol
   sakta hai.

   Tab theek khul jaye to kuch nahi badalta - ye poora hissa tabhi chalta hai jab
   pehle chup-chaap kuch na hota. */
export const RedirectURL = (url) => {
  const finalUrl = `${APIBaseURL}/${url}`;

  let printTab = null;
  try {
    printTab = window.open(finalUrl, "_blank");
  } catch (error) {
    printTab = null;
  }

  /* Ruka hua tab in teenon me se kisi bhi roop me aata hai - browser ke hisaab se
     alag-alag. Teeno ko ek saath dekhna padta hai. */
  const blocked =
    !printTab || printTab.closed || typeof printTab.closed === "undefined";

  if (blocked) {
    /* Toast par click KHUD ek click hai, isliye usse khula tab kabhi nahi rukta -
       yahi is upaay ki poori jaan hai.

       autoClose: false jaan-bujh kar. Ye apne aap gayab ho gaya to user ke paas
       print kholne ka koi raasta hi nahi bachega. */
    toast.warn(
      "The browser blocked the print tab. Click here to open the print, or allow pop-ups for this site.",
      {
        autoClose: false,
        closeOnClick: false,
        style: { cursor: "pointer" },
        onClick: () => {
          window.open(finalUrl, "_blank");
        },
      },
    );
    return null;
  }

  window.focus();
  return printTab;
};
/* Print ka tab PEHLE SE rakh lena - click ke usi pal me.

   Asli dikkat ghadi ki hai. Browser naya tab tabhi khulne deta hai jab hukm user
   ke click se judaa ho, aur ye jod chand hi second me tootta hai (Chrome me
   lagbhag 5). Pharmacy Issue me Save aur print ke beech TEEN API chalti hain -
   bill, hash, PDF. Server halka ho to teeno us seema ke andar nikal jaati hain
   aur print khul jaata hai; thoda bojh ho ya bill bada ho to seema paar ho jaati
   hai aur browser tab rok deta hai.

   Isi se wo "kabhi aata hai kabhi nahi" wali baat banti hai. Kharabi me koi tuk
   nahi dikhta kyunki tuk code me hai hi nahi - wo ghadi me hai.

   Upaay: tab ko click ke usi pal me khaali khol lo, jab jod abhi taza hai, aur
   PDF taiyaar hone par usi khule tab ka pata badal do. Pata badalne par koi rok
   nahi lagti - tab to pehle hi khul chuka hai.

   null bhi laut sakta hai (user ne pop-up band kar rakhe hon). Tab RedirectURL
   apna wala message dikha deta hai, isliye kuch chhupta phir bhi nahi. */
export const ReservePrintTab = () => {
  try {
    const tab = window.open("", "_blank");
    if (!tab) return null;

    /* Khaali tab "about:blank" dikhta hai aur user ko lagta hai kuch toot gaya.
       Ek line likh dene se pata rehta hai ki intezaar karna hai. */
    try {
      tab.document.write(
        "<!doctype html><title>Print</title>" +
          "<p style='font-family:sans-serif;padding:16px;font-size:14px'>" +
          "Preparing your print, please keep this page open...</p>",
      );
      tab.document.close();
    } catch (error) {
      /* Kuch browser about:blank par likhne nahi dete. Tab phir bhi khula hai
         aur uska pata badalna chalta rahega, isliye yahan kuch karne ki zarurat
         nahi. */
    }

    return tab;
  } catch (error) {
    return null;
  }
};

/* Pehle se rakhe tab me print bhejna.

   Tab mil gaya to usi ka pata badal diya jaata hai. Na mila ho (ya user ne band
   kar diya ho) to seedha RedirectURL - wo khud kholta hai aur ruk jaye to apna
   message dikhata hai. Yaani dono haalat me print kahin kho nahi sakta. */
export const RedirectURLInTab = (tab, url) => {
  if (tab && !tab.closed) {
    try {
      tab.location.href = `${APIBaseURL}/${url}`;
      tab.focus();
      return tab;
    } catch (error) {
      /* niche wale raaste par chale jao */
    }
  }
  return RedirectURL(url);
};

/* Rakha hua tab band karna - jab print banne se pehle hi baat bigad jaye.

   Bina iske har nakaam save ek khaali tab chhod jaata, aur din bhar me user ke
   saamne unka dher lag jaata. */
export const CloseReservedTab = (tab) => {
  try {
    if (tab && !tab.closed) tab.close();
  } catch (error) {
    /* band na ho paaya to bhi kuch bigadta nahi */
  }
};

export const RedirectEXLURL = (response) => {
  const url = window.URL.createObjectURL(new Blob([response]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Report.xlsx`);
  document.body.appendChild(link);
  link.click();
};

export const RedirectURLReport = (base64, type) => {
  let base64String = base64.startsWith(type) ? base64.split(",")[1] : base64;
  // Handle padding
  const padding = base64String.length % 4;
  if (padding === 2) {
    base64String += "==";
  } else if (padding === 3) {
    base64String += "=";
  }
  // Convert Base64 to a binary string
  const binaryString = window.atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  // Create a Blob from the bytes
  const blob = new Blob([bytes], { type: "application/pdf" });
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  // Open the PDF in a new tab
  window.open(url);
};
