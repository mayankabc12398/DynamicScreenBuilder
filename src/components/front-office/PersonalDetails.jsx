import React, { useEffect, useRef, useState } from "react";
import ReactSelect from "@app/components/formComponent/ReactSelect";
import Input from "@app/components/formComponent/Input";
import DynamicForm from "@app/components/formComponent/DynamicForm";
import LabeledInput from "@app/components/formComponent/LabeledInput";
import { useTranslation } from "react-i18next";
import UploadImage from "./UploadImage";
import Modal from "../modalComponent/Modal";
import DatePicker from "../../components/formComponent/DatePicker";
import CityModel from "../modalComponent/Utils/CityModel";
import AreaModel from "../modalComponent/Utils/AreaModel";
import PostalAddressModel from "../modalComponent/Utils/PostalAddressModel";
import DistrictModel from "../modalComponent/Utils/DistrictModel";
import StateModel from "../modalComponent/Utils/StateModel";
import PoliceStationModel from "../modalComponent/Utils/PoliceStationModel";
import Voiceformfiller from "../../../src/pages/frontOffice/PatientRegistration/Voiceformfiller.jsx";
import AadhaarOcrFab from "../../../src/pages/frontOffice/PatientRegistration/AadhaarOcrFab.jsx";
import AbhaLinkButton from "../../../src/pages/frontOffice/PatientRegistration/AbhaLinkButton.jsx";
import pro from "../../../src/assets/image/pro.jpg";

import {
  ageValidation,
  filterByType,
  filterByTypes,
  inputBoxValidation,
  notify,
} from "../../utils/utils";
import {
  AGE_TYPE,
  MOBILE_NUMBER_VALIDATION_REGX,
  VARCHAR_REGX,
  GEMINI_MODEL,
} from "../../utils/constant";
import {
  cityInsert,
  districtInsert,
  storeState,
  policeStationInsert,
} from "../../store/reducers/common/storeStateDistrictCity";
import makeApiRequest from "../../networkServices/axiosInstance";
import { apiUrls } from "../../networkServices/apiEndpoints";
import { useDispatch } from "react-redux";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import AttachDoumentModal from "../modalComponent/Utils/AttachDoumentModal";
import UploadImageModal from "../modalComponent/Utils/UploadImageModal";
import { Tooltip } from "primereact/tooltip";
import moment from "moment/moment";
import {
  findAgeByDOB,
  BindArea,
  SaveArea,
  UpdateArea,
  BindPostalAddress,
  SavePostalAddress,
} from "../../networkServices/directPatientReg";
import { CentreWiseCacheByCenterID } from "../../store/reducers/common/CommonExportFunction";
import { useSelector } from "react-redux";
import { Checkbox } from "primereact/checkbox";
import MergeFamilyMemberModal from "../modalComponent/Utils/MergeFamilyMemberModal";
import MergeStaffID from "../modalComponent/MergeStaffID";
import Accordion from "../UI/Accordion.jsx";
import Heading from "../UI/Heading.jsx";
import PatientBiometricDetails from "./PatientBiometricDetails.jsx";

import { aiFetch, AI_GENERATE_URL } from "../../utils/aiClient";
const getPatientImageSrc = (values = {}) => {
  const imageValue =
    values?.profileImage ||
    values?.Image ||
    values?.PatientPhoto ||
    values?.PatienetPhoto ||
    "";

  if (!imageValue) return "";
  if (/^data:image\//i.test(imageValue) || /^https?:\/\//i.test(imageValue)) {
    return imageValue;
  }

  const cleanBase64 = String(imageValue).includes(",")
    ? String(imageValue).split(",")[1]
    : String(imageValue);

  return `data:image/jpeg;base64,${cleanBase64}`;
};

const normalizeAgeType = (type) => {
  if (!type) return "YRS";
  const cleanType = String(type).toUpperCase().trim();
  if (cleanType.includes("YEAR") || cleanType.includes("YR") || cleanType === "Y") {
    return "YRS";
  }
  if (cleanType.includes("MONTH") || cleanType.includes("MTH") || cleanType === "M") {
    return "MONTH(S)";
  }
  if (cleanType.includes("DAY") || cleanType.includes("DY") || cleanType === "D") {
    return "DAY(S)";
  }
  return "YRS";
};

export default function PersonalDetails({
  CentreWiseCache,
  dpdpSlot = null,
  handleChange,
  values,
  handleReactSelect,
  handleOldPatientSearch,
  isDisableInputs,
  handleKeyDown,
  setValues,
  documentIds,
  setDocumentIds,
  isUpdate,
  handleDateKeyDown,
  dynamicData,
  setDynamicData,
  babyTitle,
  setBabyTitle,
  showLandmark,
}) {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const VITE_AADHAAR_OCR_API = "http://103.12.132.113:8000/extract";
  const dispatch = useDispatch();
  const { BindResource } = useSelector((state) => state?.CommonSlice);
  const [handleModelData, setHandleModelData] = useState({});
  const [t] = useTranslation();
  // master_area rows for the Area dropdown (beside Local Address).
  const [areaList, setAreaList] = useState([]);
  const loadAreaList = async () => {
    const res = await BindArea();
    setAreaList(res?.success && Array.isArray(res?.data) ? res.data : []);
    return res?.success && Array.isArray(res?.data) ? res.data : [];
  };
  useEffect(() => {
    loadAreaList();
  }, []);

  // master_postal_address rows for the Postal Address dropdown (narrowed to the chosen state / district).
  const [policeStationOptions, setPoliceStationOptions] = useState([]);
  const loadPoliceStations = async (stateID = 0, districtID = 0) => {
    try {
      const res = await makeApiRequest(apiUrls.GetPoliceStations, {
        method: "GET",
        params: { StateID: stateID, DistrictID: districtID },
      });
      const list = res?.status && Array.isArray(res?.data)
        ? res.data.map((r) => ({ label: r.TextField, value: String(r.ValueField) }))
        : [];
      setPoliceStationOptions(list);
      return list;
    } catch {
      return [];
    }
  };

  const [postalList, setPostalList] = useState([]);
  const loadPostalList = async () => {
    const res = await BindPostalAddress();
    const list = res?.success && Array.isArray(res?.data) ? res.data : [];
    setPostalList(list);
    return list;
  };
  useEffect(() => {
    loadPostalList();
  }, []);
  const idOf = (v) => String(v?.value ?? v ?? "");
  // "+" beside Postal Address: needs State and District; saves, reloads the list and selects the new address.
  const handlePostalInsertAPI = async (data) => {
    const stateID = Number(idOf(values?.StateID)) || 0;
    const districtID = Number(idOf(values?.districtID)) || 0;
    if (!stateID || !districtID) {
      notify(t("Select State and District first"), "error");
      return;
    }
    const name = String(data?.postalAddress || "").trim().toUpperCase();
    if (!name) {
      notify(t("Postal Address is required"), "error");
      return;
    }
    const res = await SavePostalAddress({ PostalAddress: name, StateID: stateID, DistrictID: districtID });
    if (!res?.success) {
      notify(res?.message || t("Failed to save postal address"), "error");
      return;
    }
    notify(res?.message || t("Postal Address saved successfully"), "success");
    setModalData({});
    setHandleModelData((val) => ({ ...val, isOpen: false }));
    await loadPostalList();
    setValues((prev) => ({
      ...prev,
      PostalAddress: { label: res?.data?.PostalAddress ?? name, value: String(res?.data?.PostalAddressID ?? "") },
    }));
  };
  const [modalData, setModalData] = useState({});
  const [isuploadDocOpen, setIsuploadDocOpen] = useState(false);
  const localdata = useLocalStorage("userData", "get");
  const ip = useLocalStorage("ip", "get");
  const [preview, setPreview] = useState("l");
  const [isuploadOpen, setIsuploadOpen] = useState(false);
  const [isExtractAdharOpen, setIsExtractAdharOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [checkbox, setCheckbox] = useState(false);
  const videoRef = useRef();
  const canvasRef = useRef();
  const initialAadhaarScanState = {
    step: "front",
    frontPreview: "",
    backPreview: "",
    isProcessing: false,
  };

  const [aadhaarScan, setAadhaarScan] = useState(initialAadhaarScanState);
  const userData = useLocalStorage("userData", "get");
  const patientImageSrc = getPatientImageSrc(values);
  const handleChangeModel = (data) => {
    setModalData(data);
  };

  const handleStateInsertAPI = async (data) => {
    let insData = await dispatch(storeState(data));
    if (insData?.payload?.status) {
      setModalData({});
      setHandleModelData((val) => ({ ...val, isOpen: false }));
      dispatch(
        CentreWiseCacheByCenterID({
          centreID: localdata?.defaultCentre,
        }),
      );
    }
  };
  const handleDistrictInsertAPI = async (data) => {
    let insData = await dispatch(districtInsert(data));
    if (insData?.payload?.status) {
      setModalData({});
      setHandleModelData((val) => ({ ...val, isOpen: false }));
      // dispatch(
      //   CentreWiseCacheByCenterID({
      //     centreID: localdata?.defaultCentre,
      //   })
      // );
    }
  };

  // "+" beside Area: save the new area, reload the list and select it.
  /* The area's State / District, as picked in the Area popup, put into the form the same
     way picking an area does - District filled in, State only when it changes (as its id,
     so the State effect does not clear the district), City cleared. */
  const stateLabelOf = (stateID) =>
    (CentreWiseCache ?? []).find(
      (r) => Number(r?.TypeID) === 8 && String(r?.ValueField) === String(stateID),
    )?.TextField ?? "";
  const bindAreaDistrict = (prev, stateID, districtID, districtName) => {
    if (!(Number(districtID) > 0)) return {};
    const currentState = Number(prev?.StateID?.value ?? prev?.StateID ?? 0);
    return {
      ...(Number(stateID) > 0 && Number(stateID) !== currentState
        ? { StateID: Number(stateID), State: stateLabelOf(stateID) || prev?.State }
        : {}),
      districtID: { label: districtName, value: Number(districtID) },
      District: districtName,
      cityID: null,
    };
  };

  const handleAreaInsertAPI = async (data) => {
    const areaName = String(data?.areaName || "").trim().toUpperCase();
    if (!areaName) {
      notify(t("Area is required"), "error");
      return;
    }
    if (!(Number(data?.districtID) > 0)) {
      notify(t("Please select the District of this area"), "error");
      return;
    }
    const res = await SaveArea(areaName, data?.districtID);
    if (!res?.success) {
      notify(res?.message || t("Failed to save area"), "error");
      return;
    }
    const savedName =
      res?.data?.areaName ?? res?.data?.AreaName ?? areaName;
    notify(res?.message || t("Area saved successfully"), "success");
    setModalData({});
    setHandleModelData((val) => ({ ...val, isOpen: false }));
    await loadAreaList();
    setValues((prev) => ({
      ...prev,
      Area: { label: savedName, value: savedName },
      ...bindAreaDistrict(prev, data?.stateID, data?.districtID, data?.districtName),
    }));
  };

  // Edit button beside Area: rename the selected area, reload the list and keep it selected.
  const selectedAreaName = String(values?.Area?.value ?? values?.Area ?? "").trim();
  const selectedAreaRow = areaList.find(
    (row) => String(row?.AreaName ?? "").trim() === selectedAreaName,
  );
  const handleAreaUpdateAPI = async (data) => {
    const areaName = String(data?.areaName || "").trim().toUpperCase();
    if (!areaName) {
      notify(t("Area is required"), "error");
      return;
    }
    if (!selectedAreaRow?.ID) {
      notify(t("Select an area to edit"), "error");
      return;
    }
    if (!(Number(data?.districtID) > 0)) {
      notify(t("Please select the District of this area"), "error");
      return;
    }
    const res = await UpdateArea(selectedAreaRow.ID, areaName, data?.districtID);
    if (!res?.success) {
      notify(res?.message || t("Failed to update area"), "error");
      return;
    }
    const savedName = res?.data?.areaName ?? res?.data?.AreaName ?? areaName;
    notify(res?.message || t("Area updated successfully"), "success");
    setModalData({});
    setHandleModelData((val) => ({ ...val, isOpen: false }));
    await loadAreaList();
    setValues((prev) => ({
      ...prev,
      Area: { label: savedName, value: savedName },
      ...bindAreaDistrict(
        prev,
        data?.stateID,
        data?.districtID,
        data?.districtName || selectedAreaRow?.District,
      ),
    }));
  };

  const handleCityInsertAPI = async (data) => {
    let insData = await dispatch(cityInsert(data));
    if (insData?.payload?.status) {
      setModalData({});
      setHandleModelData((val) => ({ ...val, isOpen: false }));
      dispatch(
        CentreWiseCacheByCenterID({
          centreID: localdata?.defaultCentre,
        }),
      );
    }
  };

  const handlePoliceStationInsertAPI = async (data) => {
    const stateID = data?.StateID?.value ? parseInt(data.StateID.value) : parseInt(data?.StateID ?? 0);
    const districtID = data?.DistrictID?.value ? parseInt(data.DistrictID.value) : parseInt(data?.DistrictID ?? 0);
    const payload = {
      PoliceStation: data?.PoliceStation,
      StateID: stateID,
      DistrictID: districtID,
      CountryID: parseInt(values?.countryID?.value ?? values?.countryID ?? 0),
      IPAddress: ip,
    };
    const res = await dispatch(policeStationInsert(payload));
    const ok = res?.payload?.status ?? res?.payload?.Status;
    if (ok) {
      setModalData({});
      setHandleModelData((val) => ({ ...val, isOpen: false }));
      dispatch(CentreWiseCacheByCenterID({ centreID: localdata?.defaultCentre }));
      loadPoliceStations(stateID, districtID);
    }
  };

  const handleVoiceDOB = async (dobDate) => {
    try {
      const parsedDate = moment(dobDate);

      if (!parsedDate.isValid()) return;

      const ageResponse = await findAgeByDOB(parsedDate.format("YYYY-MM-DD"));

      setValues((prev) => ({
        ...prev,
        DOB: parsedDate.toDate(),
        Age: ageResponse?.success
          ? ageResponse?.data?.split(" ")[0] || prev.Age
          : prev.Age,
        AgeType: ageResponse?.success
          ? normalizeAgeType(ageResponse?.data?.split(" ")[1]) || prev.AgeType
          : prev.AgeType,
      }));
    } catch (error) {
      console.error("Voice DOB error:", error);
    }
  };

  const handleModel = (
    label,
    width,
    type,
    isOpen,
    Component,
    handleInsertAPI,
    extrabutton,
  ) => {
    setHandleModelData({
      label: label,
      width: width,
      type: type,
      isOpen: isOpen,
      Component: Component,
      handleInsertAPI: handleInsertAPI,
      extrabutton: extrabutton ? extrabutton : <></>,
    });
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;

    setCheckbox(checked);

    if (checked) {
      setValues((prev) => ({
        ...prev,
        parmanentAddress: prev.House_No || "",
      }));
    } else {
      setValues((prev) => ({
        ...prev,
        parmanentAddress: "",
      }));
    }
  };

  useEffect(() => {
    setHandleModelData((val) => ({ ...val, modalData: modalData }));
  }, [modalData]);

  useEffect(() => {
    if (patientImageSrc) {
      setPreview(patientImageSrc);
      // setPreview(values?.PatientPhoto);
      // setCameraStream((val) => ({ ...val, active: true }));
    }
  }, [patientImageSrc]);

  const setIsOpen = () => {
    setHandleModelData((val) => ({ ...val, isOpen: false }));
  };

  const closeCameraStream = (status) => {
    if (cameraStream) {
      // cameraStream?.getTracks()?.forEach((track) => track?.stop());
      setCameraStream((val) => ({ ...val, active: false }));
      // setCameraStream(null);
    }
    if (status === "close") {
      setPreview("l");
    }
  };

  const startCamera = async () => {
    try {
      setPreview(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch (err) {
      console.error("Error accessing the camera: ", err);
    }
  };

  const takePhoto = (base64Image) => {
    setPreview(base64Image);
    setCameraStream((val) => ({ ...val, active: true }));
  };

  const handleImageChange = (e) => {
    e.preventDefault();

    let reader = new FileReader();
    let file = e.target.files[0];
    closeCameraStream();
    reader.onloadend = () => {
      // setImage(file);
      setPreview(reader.result);
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const base64ToFile = (base64String, fileName = "aadhaar.jpg") => {
    const [meta, content] = base64String.split(",");
    const mime = meta?.match(/data:(.*?);base64/)?.[1] || "image/jpeg";

    const binary = atob(content);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new File([bytes], fileName, { type: mime });
  };

  const findOptionByText = (options = [], searchValues = []) => {
    const searchList = (
      Array.isArray(searchValues) ? searchValues : [searchValues]
    )
      .filter(Boolean)
      .map((item) => String(item).toLowerCase().trim());

    return (
      options.find((option) => {
        const label = String(option?.label || option?.TextField || "")
          .toLowerCase()
          .trim();
        const value = String(option?.value || option?.ValueField || "")
          .toLowerCase()
          .trim();

        return searchList.some(
          (search) =>
            label === search ||
            value === search ||
            label.includes(search) ||
            search.includes(label),
        );
      }) || null
    );
  };

  const splitFullName = (fullName = "") => {
    const parts = String(fullName).trim().split(/\s+/).filter(Boolean);

    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" "),
    };
  };

  // const extractAadhaarFromImage = async (imagePreview) => {
  //   if (!VITE_AADHAAR_OCR_API) {
  //     throw new Error("VITE_AADHAAR_OCR_API is missing in .env");
  //   }

  //   const file = base64ToFile(imagePreview);
  //   const formData = new FormData();
  //   formData.append("file", file);

  //   const response = await fetch(VITE_AADHAAR_OCR_API, {
  //     method: "POST",
  //     body: formData,
  //   });

  //   const result = await response.json();

  //   if (!response.ok) {
  //     throw new Error(result?.detail || "OCR extraction failed");
  //   }

  //   return result;
  // };

  const parseGeminiJSON = (rawText = "") => {
    const cleaned = String(rawText)
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "");

    return JSON.parse(cleaned);
  };

  const getAadhaarCurrentPreview = () =>
    aadhaarScan?.step === "back"
      ? aadhaarScan?.backPreview
      : aadhaarScan?.frontPreview;

  const resetAadhaarScanState = () => {
    setAadhaarScan({
      step: "front",
      frontPreview: "",
      backPreview: "",
      isProcessing: false,
    });
  };

  const openAadhaarScanModal = () => {
    resetAadhaarScanState();
    setIsExtractAdharOpen(true);
    closeCameraStream("close");
  };

  const startAadhaarCamera = () => {
    closeCameraStream();
    setAadhaarScan((prev) => ({
      ...prev,
      [prev.step === "front" ? "frontPreview" : "backPreview"]: "",
    }));
  };

  const takeAadhaarPhoto = (base64Image) => {
    if (!base64Image) return;

    setCameraStream((val) => ({ ...val, active: true }));

    setAadhaarScan((prev) => {
      if (prev.step === "front") {
        return {
          ...prev,
          frontPreview: base64Image,
          step: "back",
        };
      }

      return {
        ...prev,
        backPreview: base64Image,
      };
    });
  };

  const handleAadhaarImageChange = (e) => {
    e.preventDefault();

    const file = e.target.files?.[0];
    if (!file) return;

    closeCameraStream();

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;

      setAadhaarScan((prev) => {
        if (prev.step === "front") {
          return {
            ...prev,
            frontPreview: result,
            step: "back",
          };
        }

        return {
          ...prev,
          backPreview: result,
        };
      });
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const getOcrAddress = (ocrData = {}) =>
    ocrData?.address ||
    ocrData?.Address ||
    ocrData?.full_address ||
    ocrData?.FullAddress ||
    "";

  const extractAadhaarFromImage = async (imagePreview) => {
    if (!VITE_AADHAAR_OCR_API) {
      throw new Error("VITE_AADHAAR_OCR_API is missing in .env");
    }

    const file = base64ToFile(imagePreview);
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(VITE_AADHAAR_OCR_API, {
      method: "POST",
      body: formData,
    });
    debugger;
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.detail || "OCR extraction failed");
    }

    return result;
  };

  const cleanAadhaarAddressWithGemini = async (rawAddress = "") => {
    const inputAddress = String(rawAddress || "").trim();
    if (!inputAddress) return "";

    const prompt = `
Return ONLY valid JSON:
{
  "area": "",
  "city": "",
  "state": "",
  "pin": ""
}

Rules:
- Extract a clean Indian address
- Keep only: Area/Locality, City/District, State, PIN
- IGNORE person names (especially after S/O, D/O, C/O)
- IGNORE UIDAI, INDIA, numbers except PIN
- Prefer location words (village, nagar, colony, shahpur, etc.)
- If multiple candidates exist, choose the one near PIN
- Remove duplicates
- PIN must be 6 digits
- Output uppercase

Input: ${inputAddress}
`;

    try {
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
                parts: [{ text: prompt }],
              },
            ],
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || "Gemini request failed");
      }

      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        return inputAddress.toUpperCase();
      }

      const parsed = parseGeminiJSON(rawText);

      return [parsed?.area, parsed?.city, parsed?.state, parsed?.pin]
        .map((item) =>
          String(item || "")
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean)
        .join(", ");
    } catch (error) {
      console.error("Gemini address cleanup error:", error);
      return inputAddress.toUpperCase();
    }
  };

  const applyAadhaarFrontDataToForm = async (ocrData) => {
    const aadhaarNumber = String(
      ocrData?.aadhar ||
      ocrData?.aadhaar ||
      ocrData?.aadhaar_number ||
      ocrData?.Aadhaar ||
      "",
    ).replace(/\D/g, "");

    const dobText = ocrData?.dob || ocrData?.DOB || "";
    const dobMoment = dobText
      ? moment(dobText, ["DD/MM/YYYY", "DD-MM-YYYY", "YYYY-MM-DD"], true)
      : null;

    let age = "";
    let ageType = "";

    if (dobMoment?.isValid()) {
      const ageResponse = await findAgeByDOB(dobMoment.format("YYYY-MM-DD"));
      if (ageResponse?.success) {
        age = ageResponse?.data?.split(" ")[0] || "";
        ageType = ageResponse?.data?.split(" ")[1] ? normalizeAgeType(ageResponse?.data?.split(" ")[1]) : "";
      }
    }

    const genderOptions = getDynamicOptionData(22) || [];
    const idProofOptions =
      filterByType(CentreWiseCache, 13, "TypeID", "TextField", "ValueField") ||
      [];
    const countryOptions =
      filterByTypes(
        CentreWiseCache,
        [7],
        ["TypeID"],
        "TextField",
        "ValueField",
        "STD_CODE",
      ) || [];

    const genderOption = findOptionByText(
      genderOptions,
      ocrData?.gender || ocrData?.Gender,
    );

    const aadhaarProofOption = findOptionByText(idProofOptions, [
      "aadhaar",
      "aadhar",
    ]);

    const indiaOption = findOptionByText(countryOptions, ["india", "bharat"]);
    const { firstName, lastName } = splitFullName(
      ocrData?.name || ocrData?.Name,
    );

    setValues((prev) => {
      const previousCountryValue =
        prev?.countryID?.value !== undefined
          ? prev?.countryID?.value
          : prev?.countryID;

      const nextCountry =
        indiaOption &&
          String(previousCountryValue || "") !== String(indiaOption?.value || "")
          ? indiaOption
          : prev?.countryID;

      return {
        ...prev,
        PFirstName: firstName || prev.PFirstName,
        PLastName: lastName || prev.PLastName,
        Gender:
          genderOption ||
          (ocrData?.gender || ocrData?.Gender
            ? {
              label: ocrData?.gender || ocrData?.Gender,
              value: ocrData?.gender || ocrData?.Gender,
            }
            : prev.Gender),
        DOB: dobMoment?.isValid() ? dobMoment.toDate() : prev.DOB,
        Age: age || prev.Age,
        AgeType: ageType || prev.AgeType,
        documentName: aadhaarProofOption || prev.documentName,
        ID_Proof_No: aadhaarNumber || prev.ID_Proof_No,
        countryID: nextCountry || prev.countryID,
        Country: indiaOption?.label || prev.Country,
        IsInternational: "2",
      };
    });
  };

  const applyAadhaarBackAddressToForm = (cleanAddress) => {
    if (!cleanAddress) return;

    setValues((prev) => ({
      ...prev,
      House_No: cleanAddress || prev.House_No,
      parmanentAddress: checkbox ? cleanAddress : prev.parmanentAddress,
    }));
  };

  const handleAadhaarScan = async () => {
    const frontPreview = aadhaarScan?.frontPreview;
    const backPreview = aadhaarScan?.backPreview;

    if (!frontPreview || !backPreview) {
      notify(
        t("Please upload or capture both front and back Aadhaar images"),
        "error",
      );
      return;
    }

    try {
      setAadhaarScan((prev) => ({ ...prev, isProcessing: true }));

      const frontOcrData = await extractAadhaarFromImage(frontPreview);
      await applyAadhaarFrontDataToForm(frontOcrData);

      const backOcrData = await extractAadhaarFromImage(backPreview);
      const rawAddress = getOcrAddress(backOcrData);
      const cleanedAddress = rawAddress
        ? await cleanAadhaarAddressWithGemini(rawAddress)
        : "";

      applyAadhaarBackAddressToForm(cleanedAddress || rawAddress);

      notify(t("Aadhaar details extracted successfully"), "success");
      setIsExtractAdharOpen(false);
      resetAadhaarScanState();
      closeCameraStream("close");
    } catch (error) {
      notify(error?.message || "Failed to extract Aadhaar details", "error");
    } finally {
      setAadhaarScan((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  const applyAadhaarDataToForm = async (ocrData, imagePreview) => {
    const aadhaarNumber = ocrData?.aadhar
      ? String(ocrData.aadhar).replace(/\s+/g, "")
      : "";

    const dobMoment = ocrData?.dob
      ? moment(ocrData.dob, "DD/MM/YYYY", true)
      : null;

    let age = "";
    let ageType = "";

    if (dobMoment?.isValid()) {
      const ageResponse = await findAgeByDOB(dobMoment.format("YYYY-MM-DD"));
      if (ageResponse?.success) {
        age = ageResponse?.data?.split(" ")[0] || "";
        ageType = ageResponse?.data?.split(" ")[1] ? normalizeAgeType(ageResponse?.data?.split(" ")[1]) : "";
      }
    }

    const genderOptions = getDynamicOptionData(22) || [];
    const idProofOptions =
      filterByType(CentreWiseCache, 13, "TypeID", "TextField", "ValueField") ||
      [];

    const genderOption = findOptionByText(genderOptions, ocrData?.gender);
    const aadhaarProofOption = findOptionByText(idProofOptions, [
      "aadhaar",
      "aadhar",
    ]);

    const { firstName, lastName } = splitFullName(ocrData?.name);

    setValues((prev) => ({
      ...prev,

      // if you want to keep showing scanned image in the image box, keep this line
      // profileImage: imagePreview || prev.profileImage,

      PFirstName: firstName || prev.PFirstName,
      PLastName: lastName || prev.PLastName,

      Gender:
        genderOption ||
        (ocrData?.gender
          ? { label: ocrData.gender, value: ocrData.gender }
          : prev.Gender),

      DOB: dobMoment?.isValid() ? dobMoment.toDate() : prev.DOB,
      Age: age || prev.Age,
      AgeType: ageType || prev.AgeType,

      House_No: ocrData?.address || prev.House_No,

      // always select Aadhaar in ID Proof Name
      documentName: aadhaarProofOption || prev.documentName,

      // fill Aadhaar number in ID Proof No
      ID_Proof_No: aadhaarNumber || prev.ID_Proof_No,
    }));
  };

  // const handleAadhaarScan = async (imagePreview) => {
  //   if (!imagePreview || imagePreview === "l") {
  //     notify("Please upload or capture Aadhaar image first", "error");
  //     return;
  //   }

  //   try {
  //     const ocrData = await extractAadhaarFromImage(imagePreview);
  //     await applyAadhaarDataToForm(ocrData, imagePreview);
  //     notify("Aadhaar details extracted successfully", "success");
  //     setIsuploadOpen(false);
  //     setIsExtractAdharOpen(false);
  //     closeCameraStream();
  //   } catch (error) {
  //     notify(error?.message || "Failed to extract Aadhaar details", "error");
  //   }
  // };

  const handleAddDocumentIDs = (e) => {
    if (e.key === "Enter") {
      let docIDs = documentIds?.find(
        (item) =>
          item?.id === e.target.value ||
          item?.name?.value === values?.documentName?.value,
      );
      debugger
      let validDocLength = parseInt(
        values?.documentName?.value?.split("#")[1]
          ? values?.documentName?.value?.split("#")[1]
          : 0,
      );
      if (!values?.documentName?.label) {
        notify(t("Please Select Document id"), "error");
      } else if (!e.target.value) {
        notify(t("Document Can't Be Empty"), "error");
      } else if (docIDs) {
        notify(t("This Document Has Already Been Added"), "error");
      } else if (e.target.value?.length !== validDocLength) {
        notify(
          `${values?.documentName?.label} must be ${validDocLength} digit `,
          "error",
        );
      } else {
        setDocumentIds((val) => [
          ...val,
          { name: values?.documentName, id: e.target.value },
        ]);
        let ids = [...documentIds];
        ids.push({ name: values?.documentName, id: e.target.value });
        setValues((val) => ({
          ...val,
          ID_Proof_No: "",
          documentName: "",
          documentIds: ids,
        }));
      }
      handleKeyDown(e);
    }
  };

  const handleAddDocumentIDsOnClick = () => {
    const inputValue = values?.ID_Proof_No?.trim(); // Get input value from state

    let docIDs = documentIds?.find(
      (item) =>
        item?.id === inputValue ||
        item?.name?.value === values?.documentName?.value,
    );

    let validDocLength = parseInt(
      values?.documentName?.value?.split("#")[1] || 0,
    );

    if (!values?.documentName?.label) {
      notify(t("Please Select Document id"), "error");
    } else if (!inputValue) {
      notify(t("Document Can't Be Empty"), "error");
    } else if (docIDs) {
      notify(t("This Document Has Already Been Added"), "error");
    } else if (inputValue.length !== validDocLength) {
      notify(
        `${values?.documentName?.label} must be ${validDocLength} digit`,
        "error",
      );
    } else {
      const newDoc = { name: values?.documentName, id: inputValue };

      setDocumentIds((prev) => [...prev, newDoc]);

      setValues((prev) => ({
        ...prev,
        ID_Proof_No: "",
        documentName: "",
        documentIds: [...documentIds, newDoc],
      }));
    }
  };

  const deleteDocument = (doc) => {
    const docDetail = documentIds?.filter((val) => val.id !== doc?.id);
    setValues((val) => ({ ...val, documentIds: docDetail }));
    setDocumentIds(docDetail);
  };

  const getAgeByDateOfBirth = async (e) => {
    try {
      let dobValue = e.target.value;
      if (!dobValue) return;

      let dateString = "";
      if (dobValue instanceof Date || dobValue._isAMomentObject || (typeof dobValue === "object" && dobValue !== null)) {
        dateString = moment(dobValue).format("YYYY-MM-DD");
      } else {
        // String date
        const parsed = moment(dobValue, VITE_DATE_FORMAT, true);
        if (parsed.isValid()) {
          dateString = parsed.format("YYYY-MM-DD");
        } else {
          const fallback = moment(dobValue);
          if (fallback.isValid()) {
            dateString = fallback.format("YYYY-MM-DD");
          }
        }
      }

      if (!dateString) return;

      // 1. Calculate DOB difference locally first using calendar-aware rules
      const birth = moment(dateString, "YYYY-MM-DD");
      const today = moment();
      let localAge = "0";
      let localAgeType = "YRS";

      if (!birth.isAfter(today)) {
        const years = today.diff(birth, "years");
        if (years > 0) {
          localAge = String(years);
          localAgeType = "YRS";
        } else {
          const months = today.diff(birth, "months");
          if (months > 0) {
            localAge = String(months);
            localAgeType = "MONTH(S)";
          } else {
            const days = today.diff(birth, "days");
            localAge = String(days >= 0 ? days : 0);
            localAgeType = "DAY(S)";
          }
        }
      }

      // Immediately update Formik values to keep the UI responsive
      setValues((val) => ({
        ...val,
        DOB: moment(dateString).toDate(),
        Age: localAge,
        AgeType: localAgeType,
      }));

      // 2. Call API as background verification
      let age = await findAgeByDOB(dateString);
      if (age?.success) {
        const parts = age?.data?.split(" ");
        const normVal = parts[1] ? normalizeAgeType(parts[1]) : "YRS";
        setValues((val) => ({
          ...val,
          DOB: moment(dateString).toDate(),
          Age: parts[0] || 0,
          AgeType: normVal,
        }));
      }
    } catch (error) {
      console.error("Error calculating age:", error);
    }
  };

  //  This All UseEffect For hanlde to show or remove the Country,State,City,District value
  useEffect(() => {
    if (typeof values?.countryID === "object") {
      setValues((val) => ({
        ...val,
        StateID: null,
        districtID: null,
        cityID: null,
      }));
    }
  }, [values?.countryID]);

  useEffect(() => {
    if (typeof values?.StateID === "object") {
      setValues((val) => ({ ...val, districtID: null, cityID: null }));
    }
  }, [values?.StateID]);

  useEffect(() => {
    if (typeof values?.districtID === "object") {
      setValues((val) => ({ ...val, cityID: null }));
    }
  }, [values?.districtID]);

  useEffect(() => {
    const chosen = values?.PostalAddress;
    if (!chosen || typeof chosen !== "object") return;
    const row = postalList.find((r) => String(r?.PostalAddressID) === String(chosen?.value));
    const districtID = idOf(values?.districtID);
    if (row && districtID && String(row?.DistrictID) !== districtID) {
      setValues((val) => ({ ...val, PostalAddress: "" }));
    }
  }, [values?.districtID, values?.StateID]);

  console.log("CentreWiseCacheCentreWiseCache", CentreWiseCache);

  // to handle dynmaic option for start district and city
  const getDynamicOptionData = (CommonAPITypeID, ControlName) => {
    let data;
    if (ControlName === "PostalAddress") {
      const districtID = idOf(values?.districtID);
      const stateID = idOf(values?.StateID);
      return postalList
        .filter((row) => (!districtID || String(row?.DistrictID) === districtID) && (!stateID || String(row?.StateID) === stateID))
        .map((row) => ({ label: row?.PostalAddress, value: String(row?.PostalAddressID) }));
    }
    if (ControlName === "Area") {
      const options = areaList.map((row) => ({
        label: row?.AreaName,
        value: row?.AreaName,
      }));
      const current = values?.Area?.value ?? values?.Area;
      if (
        typeof current === "string" &&
        current.trim() !== "" &&
        !options.some((o) => o.value === current)
      ) {
        options.unshift({ label: current, value: current });
      }
      return options;
    }
    if (CommonAPITypeID === 1) {
      data = filterByTypes(
        CentreWiseCache,
        [CommonAPITypeID],
        ["TypeID"],
        "TextField",
        "ValueField",
        "Department",
      );
    } else if (CommonAPITypeID === 8) {
      // 8 to bind state
      data = filterByTypes(
        CentreWiseCache,
        [
          CommonAPITypeID,
          `${values?.countryID?.value ? parseInt(values?.countryID?.value) : values?.countryID}`,
        ],
        ["TypeID", "CountryID"],
        "TextField",
        "ValueField",
      );
    } else if (CommonAPITypeID === 9) {
      // 9 to bind district
      data = values?.StateID
        ? filterByTypes(
          CentreWiseCache,
          [
            CommonAPITypeID,
            `${values?.countryID?.value ? values?.countryID?.value : values?.countryID}`,
            values?.StateID?.value
              ? parseInt(values?.StateID?.value)
              : values?.StateID,
          ],
          ["TypeID", "CountryID", "StateID"],
          "TextField",
          "ValueField",
        )
        : [];
    } else if (CommonAPITypeID === 10) {
      // 10 to bind city
      data = values?.districtID
        ? filterByTypes(
          CentreWiseCache,
          [
            CommonAPITypeID,
            values?.StateID?.value
              ? parseInt(values?.StateID?.value)
              : values?.StateID,
            values?.districtID?.value
              ? parseInt(values?.districtID?.value)
              : values?.districtID,
          ],
          ["TypeID", "StateID", "DistrictID"],
          "TextField",
          "ValueField",
        )
        : [];
    } else if (CommonAPITypeID === 32) {
      // Police stations come from the dedicated GetPoliceStations API (policeStationOptions local state)
      // because bindPatientControls SP may not include TypeID=32.
      data = values?.districtID ? policeStationOptions : [];
    } else {
      data = filterByTypes(
        CentreWiseCache,
        [CommonAPITypeID],
        ["TypeID"],
        "TextField",
        "ValueField",
      );
    }
    return data;
  };

  const HanldeAddStaffID = (val) => {
    console.log("HanldeAddStaffID", val);
  };
  // TO handle Add state city and district
  const handleAddNewData = (ControlName) => {
    if (ControlName === "PostalAddress") {
      return (
        <button
          className="btn btn-sm btn-primary"
          disabled={isDisableInputs}
          onClick={() => {
            if (!idOf(values?.StateID) || !idOf(values?.districtID)) {
              notify(t("Select State and District first"), "error");
              return;
            }
            handleModel(
              "Add Postal Address",
              "25vw",
              "Postal Address",
              true,
              <PostalAddressModel
                handleChangeModel={handleChangeModel}
                stateName={values?.StateID?.label ?? (typeof values?.State === "string" ? values.State : "")}
                districtName={values?.districtID?.label ?? (typeof values?.District === "string" ? values.District : "")}
              />,
              handlePostalInsertAPI,
            );
          }}
          type="button"
          title={t("Add Postal Address")}
        >
          <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
        </button>
      );
    }
    if (ControlName === "Area") {
      return (
        <div className="d-flex flex-nowrap" style={{ gap: "3px" }}>
          <button
            className="btn btn-sm btn-primary"
            disabled={isDisableInputs}
            onClick={() =>
              handleModel(
                "Add Area",
                "25vw",
                "Area",
                true,
                <AreaModel
                  handleChangeModel={handleChangeModel}
                  countryID={values?.countryID}
                  CentreWiseCache={CentreWiseCache}
                  initialStateID={values?.StateID?.value ?? values?.StateID ?? 0}
                />,
                handleAreaInsertAPI,
              )
            }
            type="button"
            title={t("Add Area")}
          >
            <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
          </button>
          <button
            className="btn btn-sm btn-primary"
            disabled={isDisableInputs || !selectedAreaRow?.ID}
            onClick={() =>
              handleModel(
                "Edit Area",
                "25vw",
                "Area",
                true,
                <AreaModel
                  handleChangeModel={handleChangeModel}
                  initialName={selectedAreaRow?.AreaName || ""}
                  initialStateID={selectedAreaRow?.StateID || 0}
                  initialDistrictID={selectedAreaRow?.DistrictID || 0}
                  countryID={values?.countryID}
                  CentreWiseCache={CentreWiseCache}
                />,
                handleAreaUpdateAPI,
              )
            }
            type="button"
            title={t("Edit Area")}
          >
            <i className="fa fa-edit fa-sm new_record_pluse"></i>
          </button>
        </div>
      );
    }
    if (ControlName === "StateID") {
      return (
        <button
          className="btn btn-sm btn-primary"
          disabled={values?.countryID && !isDisableInputs ? false : true}
          onClick={() =>
            handleModel(
              "Add_State",
              "20vw",
              "State",
              true,
              <StateModel
                handleChangeModel={handleChangeModel}
                inputData={{
                  countryID: values?.countryID?.value
                    ? values?.countryID?.value
                    : values?.countryID,
                  ipAddress: ip,
                  EntryBy: userData?.employeeID,
                }}
              />,
              handleStateInsertAPI,
            )
          }
          type="button"
        >
          <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
        </button>
      );
    } else if (ControlName === "districtID") {
      return (
        <button
          className="btn btn-sm btn-primary"
          disabled={values?.StateID && !isDisableInputs ? false : true}
          onClick={() =>
            handleModel(
              "Add_District",
              "20vw",
              "District",
              true,
              <DistrictModel
                handleChangeModel={handleChangeModel}
                inputData={{
                  stateID: values?.StateID?.value
                    ? parseInt(values?.StateID?.value)
                    : values?.StateID,
                  countryID: values?.countryID?.value
                    ? parseInt(values?.countryID?.value)
                    : values?.countryID,
                  ipAddress: ip,
                  EntryBy: userData?.employeeID,
                }}
              />,
              handleDistrictInsertAPI,
            )
          }
          type="button"
        >
          <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
        </button>
      );
    } else if (ControlName === "cityID") {
      return (
        <button
          className="btn btn-sm btn-primary"
          disabled={values?.districtID && !isDisableInputs ? false : true}
          onClick={() =>
            handleModel(
              "Add_City",
              "20vw",
              "city",
              true,
              <CityModel
                handleChangeModel={handleChangeModel}
                inputData={{
                  city: "noida",
                  country: `${values?.countryID?.value ? parseInt(values?.countryID?.value) : values?.countryID}`,
                  ipAddress: ip,
                  districtID: values?.districtID?.value
                    ? parseInt(values?.districtID?.value)
                    : values?.districtID,
                  CreatedBy: userData?.employeeID,
                  stateID: values?.StateID?.value
                    ? parseInt(values?.StateID?.value)
                    : values?.StateID,
                }}
              />,
              handleCityInsertAPI,
            )
          }
          type="button"
        >
          <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
        </button>
      );
    } else if (ControlName === "PoliceStationID") {
      return (
        <button
          className="btn btn-sm btn-primary"
          disabled={values?.districtID && !isDisableInputs ? false : true}
          onClick={() => {
            if (!values?.StateID || !values?.districtID) {
              notify(t("Select State and District first"), "error");
              return;
            }
            handleModel(
              "Add Police Station",
              "25vw",
              "PoliceStation",
              true,
              <PoliceStationModel
                handleChangeModel={handleChangeModel}
                inputData={{
                  PoliceStation: "",
                  StateID: values?.StateID?.value ? parseInt(values.StateID.value) : parseInt(values?.StateID ?? 0),
                  DistrictID: values?.districtID?.value ? parseInt(values.districtID.value) : parseInt(values?.districtID ?? 0),
                  stateName: values?.StateID?.label ?? "",
                  districtName: values?.districtID?.label ?? "",
                }}
              />,
              handlePoliceStationInsertAPI,
            );
          }}
          type="button"
          title={t("Add Police Station")}
        >
          <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
        </button>
      );
    } else if (ControlName === "Merge_Family_Number") {
      return (
        <button
          className="btn btn-sm btn-primary"
          // disabled={values?.districtID && !isDisableInputs ? false : true}
          onClick={() =>
            handleModel(
              "Merge Family Number ( )",
              "50vw",
              "Family Number",
              true,
              <MergeFamilyMemberModal handleChangeModel={handleChangeModel} />,
              null,
              <button className="btn btn-sm btn-success">
                <i className="fa fa-search"></i> {t("Search")}
              </button>,
            )
          }
          type="button"
        >
          <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
        </button>
      );
    } else if (ControlName === "Dependent_ID") {
      return (
        <button
          className="btn btn-sm btn-primary"
          // disabled={values?.districtID && !isDisableInputs ? false : true}
          onClick={() =>
            handleModel(
              "Add Staff ID",
              "80vw",
              "Add Staff ID",
              true,
              <MergeStaffID
                // handleChangeModel={handleChangeModel}
                handleChangeModel={handleChangeModel}
              />,
              HanldeAddStaffID,
              //  null,
              // <button className="btn btn-sm btn-success">
              //   <i className="fa fa-search"></i> Search
              // </button>
              // <button className="btn btn-sm btn-success">
              //   <i className="fa fa-search"></i> Search
              // </button>
            )
          }
          type="button"
        >
          <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
        </button>
      );
    } else if (ControlName === "ID_Proof_No") {
      return (
        <button
          className="btn btn-sm btn-primary"
          disabled={isDisableInputs}
          onClick={handleAddDocumentIDsOnClick}
          type="button"
          title={t("Add ID Proof")}
        >
          <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
        </button>
      );
    }
  };
  const getDOBFromAge = (age, ageType) => {
    if (!age) return null;

    const today = moment();

    // Normalize: uppercase + trim for safe comparison
    const ageTypeValue = (ageType?.value || ageType || "YEAR")
      .toString()
      .toUpperCase()
      .trim();

    // Hospedia writes an age as "<years>.<months>" / "<months>.<days>" (Get_Current_Age: 1 year
    // 5 months = "1.5 YRS", 2 months 10 days = "2.10 MONTH(S)"), so the digits after the dot are the
    // next smaller unit - not a decimal fraction. Reading "1.5" as 1.5 years gave a DOB 18 months
    // back, and the age came back as "1.6 YRS" the next time the patient was searched / updated.
    const [wholeText, fractionText = ""] = String(age).trim().split(".");
    const whole = parseInt(wholeText, 10) || 0;
    const fraction = parseInt(fractionText.slice(0, 2), 10) || 0;

    if (ageTypeValue.includes("MONTH")) {
      return today.subtract(whole, "months").subtract(fraction, "days").toDate();
    } else if (ageTypeValue.includes("DAY")) {
      return today.subtract(age, "days").toDate();
    } else if (ageTypeValue.includes("WEEK")) {
      return today.subtract(age, "weeks").toDate();
    } else {
      // YEAR (default)
      return today.subtract(whole, "years").subtract(fraction, "months").toDate();
    }
  };

  const handleCustomChange = (e, Type, ControlName) => {
    if (ControlName === "PostalCode") {
      const digits = String(e.target.value || "").replace(/\D/g, "").slice(0, 6);
      setValues((prev) => ({ ...prev, PostalCode: digits }));
      return;
    }
    if (ControlName === "ID_Proof_No") {
      return inputBoxValidation(
        VARCHAR_REGX(values?.documentName?.value?.split("#")[1]),
        e,
        handleChange,
      );
    } else if (ControlName === "Age") {
      const age = e.target.value;
      ageValidation(
        /^\d{0,2}(\.\d{0,2})?$/,
        e,
        handleChange,
        values?.AgeType?.value ? values?.AgeType?.value : values?.AgeType,
      );
      if (age) {
        // ✅ Pass AgeType here
        const calculatedDOB = getDOBFromAge(age, values?.AgeType);

        setValues((prev) => ({
          ...prev,
          Age: age,
          DOB: calculatedDOB,
        }));
      }
    } else if (ControlName === "AgeType") {
      // ✅ Also recalculate DOB when AgeType changes
      if (values?.Age) {
        const calculatedDOB = getDOBFromAge(values.Age, e); // e = new AgeType value
        setValues((prev) => ({
          ...prev,
          DOB: calculatedDOB,
        }));
      }
    } else if (ControlName === "DOB") {
      const dateInput = e.target.value;
      getAgeByDateOfBirth(e);
      setValues((prev) => ({ ...prev, DOB: moment(dateInput).toDate() }));
    } else if (Type === "text") {
      return handleChange(e);
    } else if (Type === "checkbox") {
      // debugger
      return handleChange(e);
    } else if (Type === "number") {
      return inputBoxValidation(MOBILE_NUMBER_VALIDATION_REGX, e, handleChange);
    }
  };

  const handleKeyDownFun = (e, ControlName) => {
    // debugger
    if (ControlName === "ID_Proof_No") {
      handleAddDocumentIDs(e);
    } else if ((ControlName, "Barcode")) {
      handleOldPatientSearch(e);
      handleKeyDown(e);
    }
  };

  const handleCustomReactSelect = (name, value) => {
    if (name === "Title") {
      setValues((val) => ({
        ...val,
        [name]: value,
        Gender: value?.extraColomn !== "UnKnown" ? value?.extraColomn : "",
      }));
      const updatedData = JSON.parse(
        JSON.stringify(dynamicData?.personalDetails),
      )?.map((val) => {
        const isDisable = (ValueField) => {
          if (
            ValueField == "Master" ||
            ValueField == "Dr." ||
            ValueField == "Prof." ||
            ValueField == "B/O." ||
            ValueField == "Baby."
          ) {
            return 0;
          }
          return 1;
        };
        if (val?.ControlName === "Gender") {
          val.IsDisabled = isDisable(value?.ValueField);
        }
        return val;
      });
      setDynamicData((val) => ({ ...val, personalDetails: updatedData }));
    } else if (name === "Area") {
      /* An area belongs to a district (master_area.DistrictID), so picking one fills the
         District in, and the State with it when the district is in another state. The
         State goes in as its id - as the defaults set it - so the effect that clears the
         District whenever a State is picked does not clear this one straight away. City
         is cleared: it belongs to the old district. An area with no district set leaves
         State and District as they are. */
      const row = areaList.find(
        (r) => String(r?.AreaName ?? "").trim() === String(value?.value ?? "").trim(),
      );
      const districtID = Number(row?.DistrictID || 0);
      const stateID = Number(row?.StateID || 0);
      if (districtID > 0) {
        const currentState = Number(values?.StateID?.value ?? values?.StateID ?? 0);
        const stateLabel = stateID > 0 ? stateLabelOf(stateID) : "";
        setValues((prev) => ({
          ...prev,
          Area: value,
          ...(stateID > 0 && stateID !== currentState
            ? { StateID: stateID, State: stateLabel || prev?.State }
            : {}),
          districtID: { label: row?.District, value: districtID },
          District: row?.District,
          cityID: null,
        }));
      } else {
        handleReactSelect(name, value);
      }
    } else if (name === "AgeType") {
      const newDOB = values?.Age
        ? getDOBFromAge(values.Age, value)
        : values?.DOB;

      setValues((prev) => ({
        ...prev,
        AgeType: value,
        DOB: newDOB,
      }));
    } else {
      handleReactSelect(name, value);
    }
  };

  useEffect(() => {
    const stateID = values?.StateID?.value ? parseInt(values.StateID.value) : parseInt(values?.StateID ?? 0);
    const districtID = values?.districtID?.value ? parseInt(values.districtID.value) : parseInt(values?.districtID ?? 0);
    if (districtID > 0) {
      loadPoliceStations(stateID, districtID);
    } else {
      setPoliceStationOptions([]);
    }
  }, [values?.districtID]);

  useEffect(() => {
    if (babyTitle === "B/O.") {
      setDynamicData((prev) => {
        const updatedPersonalDetails = prev?.personalDetails?.map((field) => {
          if (field?.ControlName === "Barcode") {
            return { ...field, IsDisabled: 1 };
          }
          return field;
        });
        return { ...prev, personalDetails: updatedPersonalDetails };
      });
      // Optionally set default values for B/O
      setValues((prev) => ({
        ...prev,
        Title: "B/O.",
        Age: "",
        Gender: "",
        // AgeType:"",
        DOB: "",
        // Title: {
        //   label: "B/O.",
        //   value: "B/O.",
        // },
      }));
      setBabyTitle("B/O.");
    }
  }, [babyTitle]);

  return (
    <>
      <Heading
        // title={t("FrontOffice.OPD.Personal_Details")}
        title={t("Personal_Details")}
        // isBreadcrumb={true}
        defaultValue={true}
        secondTitle={
          <div className="reg-toolbar-actions">
            <AbhaLinkButton />
            <AadhaarOcrFab onClick={openAadhaarScanModal} />
            <Voiceformfiller
              handleReactSelect={handleReactSelect}
              handleCustomReactSelect={handleCustomReactSelect}
              getDynamicOptionData={getDynamicOptionData}
              handleVoiceDOB={handleVoiceDOB}
            // isDisableInputs={isDisableInputs}
            // dynamicFormData={dynamicData?.personalDetails}
            />
          </div>
        }
      />
      <div className="row pt-2 pl-2 pr-2">
        <div className="d-md-none">
          {/* <UploadImage /> */}

          <label
            style={{
              position: "absolute",
              zIndex: "1",
              top: "0px",
              right: "100px",
            }}
            id="document-s"
            onClick={() => setIsuploadDocOpen(true)}
          >
            <i className="fa fa-file" aria-hidden="true"></i>
          </label>
          <label
            style={{
              position: "absolute",
              zIndex: "1",
              top: "0px",
              right: "10px",
            }}
            onClick={() => setIsuploadOpen(true)}
          >
            {t("Upload Image")}
          </label>
        </div>
        <div className="col-md-11 col-sm-12 ">
          <div className="row row-cols-lg-5 row-cols-md-2 row-cols-1">
            <DynamicForm
              dynamicData={dynamicData?.personalDetails}
              values={values}
              documentIds={documentIds}
              handleCustomChange={handleCustomChange}
              handleKeyDownFun={handleKeyDownFun}
              handleCustomReactSelect={handleCustomReactSelect}
              getDynamicOptionData={getDynamicOptionData}
              handleAddNewData={handleAddNewData}
              t={t}
              VITE_DATE_FORMAT={VITE_DATE_FORMAT}
              setValues={setValues}
            
            />

            {showLandmark && (
              <Input
                type="text"
                className="form-control required-fields"
                id="Landmark"
                name="Landmark"
                value={values?.Landmark || values?.landMark || ""}
                onChange={handleChange}
                lable={t("Landmark") + " *"}
                placeholder=" "
                respclass="col"
                disabled={isDisableInputs}
              />
            )}

            {/* old code */}
            {/* {dynamicData?.personalDetails?.map(({ ControlName, DisplayName, IsReadOnly, IsMandatory, IsDisabled, className, defaultValue, IsActive, Type, respClass, CommonControlName, IsAddEnable, CommonAPITypeID, IsShowCount }, index) => {
              const nextField = dynamicData?.personalDetails[index + 1];

              if ((CommonControlName === nextField?.CommonControlName && IsActive === 1)) {

                return <div className={className} style={{ width: "15%", marginLeft: "0px" }}>
                  <div className="row">
                    {Type === "text" ?
                      <Input
                        type="text"
                        className={`form-control ${IsMandatory && "required-fields"}`}
                        id={ControlName}
                        name={ControlName}
                        readOnly={IsReadOnly}
                        value={values?.[ControlName] ? values?.[ControlName] : ""}
                        // onChange={handleChange}
                        // onChange={(e) => {
                        //   Type === "text" ? handleChange(e) : inputBoxValidation(
                        //     MOBILE_NUMBER_VALIDATION_REGX,
                        //     e,
                        //     handleChange
                        //   );
                        // }}
                        onChange={(e) => { handleCustomChange(e, Type, ControlName) }}
                        onKeyDown={(e) => { handleKeyDownFun(e, ControlName) }}
                        showTooltipCount={IsShowCount}
                        lable={t(DisplayName)}
                        placeholder=" "
                        disabled={IsDisabled}
                        respclass={respClass}
                      /> :
                      <ReactSelect
                        placeholderName={t(DisplayName)}
                        searchable={true}
                        respclass={respClass}
                        id={ControlName}
                        name={ControlName}
                        value={values?.[ControlName] ? values?.[ControlName] : ""}
                        handleChange={(name, value) => { handleCustomReactSelect(name, value) }}
                        dynamicOptions={getDynamicOptionData(CommonAPITypeID, ControlName)}
                        requiredClassName={`${IsMandatory && "required-fields"}`}
                        isDisabled={IsDisabled}
                      />
                    }


                    {nextField?.Type === "text" ?
                      <Input
                        type="text"
                        className={`form-control ${nextField?.IsMandatory && "required-fields"}`}
                        id={nextField?.ControlName}
                        name={nextField?.ControlName}
                        readOnly={nextField?.IsReadOnly}
                        value={values?.[nextField?.ControlName] ? values?.[nextField?.ControlName] : ""}
                        // onChange={handleChange}
                        // onChange={(e) => {
                        //   nextField?.Type === "text" ? handleChange(e) : inputBoxValidation(
                        //     MOBILE_NUMBER_VALIDATION_REGX,
                        //     e,
                        //     handleChange
                        //   );
                        // }}
                        onChange={(e) => { handleCustomChange(e, nextField?.Type, nextField?.ControlName) }}
                        onKeyDown={(e) => { handleKeyDownFun(e, nextField?.ControlName) }}
                        lable={t(nextField?.DisplayName)}
                        placeholder=" "
                        disabled={nextField?.IsDisabled}
                        respclass={nextField?.respClass}
                        showTooltipCount={IsShowCount}
                      /> :
                      <ReactSelect
                        placeholderName={t(nextField?.DisplayName)}
                        searchable={true}
                        id={nextField?.ControlName}
                        name={nextField?.ControlName}
                        value={values?.[nextField?.ControlName] ? values?.[nextField?.ControlName] : ""}
                        handleChange={(name, value) => { handleCustomReactSelect(name, value) }}
                        requiredClassName={`${nextField?.IsMandatory && "required-fields"}`}
                        dynamicOptions={getDynamicOptionData(nextField?.CommonAPITypeID, nextField?.ControlName)}
                        isDisabled={nextField?.IsDisabled}
                        respclass={nextField?.respClass}
                      />
                    }


                  </div>
                </div>

              }

              if (CommonControlName === dynamicData?.personalDetails[index - 1]?.CommonControlName) return
              if ((Type === "text" || Type === "number") && IsActive === 1) {
                return <><Input
                  type="text"
                  className={`form-control ${IsMandatory && "required-fields"}`}
                  id={ControlName}
                  name={ControlName}
                  readOnly={IsReadOnly}
                  value={values?.[ControlName] ? values?.[ControlName] : ""}
                  onChange={(e) => { handleCustomChange(e, Type, ControlName) }}
                  onKeyDown={(e) => { handleKeyDownFun(e, ControlName) }}
                  lable={t(DisplayName)}
                  placeholder=" "
                  disabled={IsDisabled}
                  respclass={className}
                  showTooltipCount={IsShowCount}
                />


                </>
              } else if (Type === "select" && IsActive === 1) {
                if (IsAddEnable === 1) {
                  return <div className={className} style={{ width: "15%", marginLeft: "0px" }}>
                    <div className="row">
                      <ReactSelect
                        placeholderName={t(DisplayName)}
                        searchable={true}
                        // Area has two buttons (+ and Edit), so its select is narrower
                        respclass={ControlName === "Area" ? "col-8" : "col-10"}
                        id={ControlName}
                        name={ControlName}
                        value={values?.[ControlName] ? values?.[ControlName] : ""}
                        handleChange={(name, value) => { handleCustomReactSelect(name, value) }}
                        requiredClassName={`${IsMandatory && "required-fields"}`}
                        dynamicOptions={getDynamicOptionData(CommonAPITypeID, ControlName)}
                        isDisabled={IsDisabled}
                      />
                      <div className="box-inner">
                        {handleAddNewData(CommonAPITypeID)}
                      </div>
                    </div>
                  </div>
                } else {
                  return <ReactSelect
                    placeholderName={t(DisplayName)}
                    searchable={true}
                    respclass={className}
                    id={ControlName}
                    name={ControlName}
                    value={values?.[ControlName] ? values?.[ControlName] : ""}
                    handleChange={(name, value) => { handleCustomReactSelect(name, value) }}
                    requiredClassName={`${IsMandatory && "required-fields"}`}
                    dynamicOptions={getDynamicOptionData(CommonAPITypeID, ControlName)}
                    // dynamicOptions={filterByType(
                    //   CentreWiseCache,
                    //   CommonAPITypeID,
                    //   "TypeID",
                    //   "TextField",
                    //   "ValueField"
                    // )}
                    isDisabled={IsDisabled}
                  />
                }
              } else if (Type === "datepicker" && IsActive === 1) {
                return <DatePicker
                  className={`custom-calendar ${IsMandatory && "required-fields"}`}
                  respclass={className}
                  id={ControlName}
                  name={ControlName}
                  value={values?.[ControlName] ? moment(values?.[ControlName]).toDate() : ""}
                  // maxDate={new Date()}
                  handleChange={(e) => {
                    getAgeByDateOfBirth(e); // Calculate Age and update DOB state
                  }}
                  lable={t(DisplayName)}
                  placeholder={VITE_DATE_FORMAT}
                  disable={IsDisabled}

                />
              }
            })} */}

            {/* <Input
              type="text"
              className="form-control "
              id="Barcode"
              name="Barcode"
              value={values?.Barcode ? values?.Barcode : ""}
              readOnly={isUpdate}
              lable={t("BarCode")}
              placeholder=" "
              respclass="col-xl-2.5 col-md-3 col-sm-6 col-12"
              onKeyDown={(e) => {
                handleOldPatientSearch(e);
                handleKeyDown(e);
              }}
              onChange={handleChange}
          
            />
            <Input
              type="text"
              className="form-control required-fields"
              id="Mobile"
              name="Mobile"
              value={values?.Mobile ? values?.Mobile : ""}
              onChange={(e) => {
                inputBoxValidation(
                  MOBILE_NUMBER_VALIDATION_REGX,
                  e,
                  handleChange
                );
              }}
              showTooltipCount={true}
              lable={t("Mobile Number")}
              placeholder=" "
              respclass="col-xl-2.5 col-md-3 col-sm-6 col-12"
              onKeyDown={(e) => {
                handleOldPatientSearch(e);
                handleKeyDown(e);
              }}
              disabled={isDisableInputs}
            />

            <div className="col-xl-2.5 col-md-3 col-sm-6 col-12">
              <div className="row">
                <ReactSelect
                  placeholderName={t("Title")}
                  dynamicOptions={filterByTypes(
                    CentreWiseCache,
                    [1],
                    ["TypeID"],
                    "TextField",
                    "ValueField",
                    "Department"
                  )}
                 
                  name="Title"
                 
                  inputId="Title"
                  value={values?.Title}
                  handleChange={(name, value) => {
                    setValues((val) => ({
                      ...val,
                      [name]: value,
                      Gender:
                        value?.extraColomn !== "UnKnown"
                          ? value?.extraColomn
                          : "",
                    }));
                  }}
                  searchable={true}
                  respclass="col-5 "
                  requiredClassName="required-fields"
                
                  isDisabled={isDisableInputs}

                />

                <Input
                  type="text"
                  className="form-control required-fields"
                  id="First"
                  name="PFirstName"
                  value={values?.PFirstName ? values?.PFirstName : ""}
                  onChange={handleChange}
                  lable={t("First_Name")}
                  placeholder=" "
                  respclass="col-7"
                  onKeyDown={(e) => {
                    handleOldPatientSearch(e);
                    handleKeyDown(e);
                  }}
                  isUpperCase={true}
                
                  disabled={isDisableInputs}

                />
              </div>
            </div>

            <Input
              type="text"
              className="form-control"
              id="Last_Name"
              name="PLastName"
              value={values?.PLastName ? values?.PLastName : ""}
              onChange={handleChange}
              lable={t("Last_Name")}
              placeholder=" "
              respclass="col-xl-2.5 col-md-3 col-sm-6 col-12"
              isUpperCase={true}
              disabled={isDisableInputs}

            />

            <div className="col-xl-2.5 col-md-3 col-sm-6 col-12">
              <div className="row">
                <ReactSelect
                  placeholderName={t("Gender")}
                  isDisabled={
                    values?.Gender === "Male" || values?.Gender === "Female" || isDisableInputs
                      ? true
                      : false
                  }

                  inputId="Gender"
                  dynamicOptions={filterByTypes(
                    CentreWiseCache,
                    [22],
                    ["TypeID"],
                    "TextField",
                    "ValueField"
                  )}
                  name="Gender"
                  value={values?.Gender}
                  handleChange={handleReactSelect}
                  searchable={true}
                  respclass="col-12"
                  requiredClassName={`required-fields ${values?.Gender === "Male" || values?.Gender === "Female" ? "disable-focus" : ""}`}
                  DropdownIndicator={true}


                />
              </div>
            </div>
          
            <DatePicker
              className="custom-calendar"
              respclass="col-xl-2.5 col-md-3 col-sm-6 col-12"
              id="DOB"
              name="DOB"
              value={values?.DOB ? moment(values?.DOB).toDate() : ""}
              maxDate={new Date()}
              handleChange={(e) => {
                getAgeByDateOfBirth(e); // Calculate Age and update DOB state
              }}
              lable={t("DOB")}
              placeholder={VITE_DATE_FORMAT}
              disable={isDisableInputs}

            />

            <div className="col-xl-2.5 col-md-3 col-sm-6 col-12">
              <div className="row">
                <Input
                  type="text"
                  className="form-control required-fields"
                  id="Age"
                  name="Age"
                  value={values?.Age ? values?.Age : ""}
                  onChange={(e) => {
                    ageValidation(
                      /^\d{0,2}(\.\d{0,2})?$/,
                      e,
                      handleChange,
                      values?.AgeType?.value
                        ? values?.AgeType?.value
                        : values?.AgeType
                    );
                  }}
                  lable={t("Age")}
                  placeholder=" "
                  respclass="col-5"
                  disabled={isDisableInputs}

                
                />

                <ReactSelect
                  placeholderName={t("Type")}
                  id="Type"
                  name="AgeType"
                  removeIsClearable={true}
                  value={values?.AgeType}
                  handleChange={handleReactSelect}
                  dynamicOptions={AGE_TYPE}
                  searchable={true}
                  respclass="col-7"
                  isDisabled={isDisableInputs}


                
                />
              </div>
            </div>

            <Input
              type="text"
              className="form-control "
              id="Email_Address"
              name="Email"
              value={values?.Email ? values?.Email : ""}
              onChange={handleChange}
              lable={t("Email")}
              placeholder=" "
              respclass="col-xl-2.5 col-md-3 col-sm-6 col-12"
              disabled={isDisableInputs}

            />

            <div className="col-xl-2.5 col-md-3 col-sm-6 col-12">
              <div className="row">
                <Input
                  type="text"
                  className="form-control"
                  id="Local_Address"
                  name="House_No"
                  value={values?.House_No || ""}
                  onChange={handleChange}
                  lable={t("Local_Address")}
                  placeholder=" "
                  respclass="col-11"
                  disabled={isDisableInputs}

                />

                <div className="col-1 d-flex align-items-center justify-content-center registerion-checkbox">
                  <Checkbox
                    id="checkbox"
                    className=""
                    name="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkbox}
                    disabled={isDisableInputs}
                  />
                </div>

              </div>
            </div>

            <Input
              type="text"
              className="form-control "
              id="parmanentAddress"
              name="parmanentAddress"
              value={values?.parmanentAddress ? values?.parmanentAddress : ""}
              onChange={handleChange}
              lable={t("Perma_Address")}
              placeholder=" "
              respclass="col-xl-2.5 col-md-3 col-sm-6 col-12"
              disabled={isDisableInputs}

            />

            <ReactSelect
              placeholderName={t("Country")}
              searchable={true}
              id="Country"
              respclass="col-xl-2.5 col-md-3 col-sm-6 col-12"
              dynamicOptions={filterByTypes(
                CentreWiseCache,
                [7],
                ["TypeID"],
                "TextField",
                "ValueField",
                "STD_CODE"
              )}
              name="countryID"
              value={values?.countryID || ""}
              handleChange={handleReactSelect}
              isDisabled={isDisableInputs}

          
            />

            <div className="col-xl-2.5 col-md-3 col-sm-6 col-12">
              <div className="d-flex">
                <ReactSelect
                  placeholderName={t("State")}
                  searchable={true}
                  respclass="w-100 pr-2"
                  id="State"
                  dynamicOptions={
                    values?.countryID
                      ? filterByTypes(
                        CentreWiseCache,
                        [
                          8,
                         
                          `${values?.countryID?.value ? parseInt(values?.countryID?.value) : values?.countryID}`,
                        ],
                        ["TypeID", "CountryID"],
                        "TextField",
                        "ValueField"
                      )
                      : []
                  }
                  name="StateID"
                  value={values?.StateID || ""}
                  handleChange={handleReactSelect}
                  isDisabled={isDisableInputs}

               
                />

                <div>
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={values?.countryID && !isDisableInputs ? false : true}
                    onClick={() =>
                      handleModel(
                        "Add_State",
                        "20vw",
                        "State",
                        true,
                        <StateModel
                          handleChangeModel={handleChangeModel}
                          inputData={{
                            countryID: values?.countryID?.value
                              ? values?.countryID?.value
                              : values?.countryID,
                            ipAddress: ip,
                            EntryBy: userData?.employeeID,
                          }}
                        />,
                        handleStateInsertAPI
                      )
                    }
                    type="button"
                  >
                    <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="col-xl-2.5 col-md-3 col-sm-6 col-12">
              <div className="d-flex">
                <ReactSelect
                  placeholderName={t("District")}
                  searchable={true}
                  id="District"
                  dynamicOptions={
                    values?.StateID
                      ? filterByTypes(
                        CentreWiseCache,
                        [
                          9,
                          `${values?.countryID?.value ? values?.countryID?.value : values?.countryID}`,
                          values?.StateID?.value
                            ? parseInt(values?.StateID?.value)
                            : values?.StateID,
                        ],
                        ["TypeID", "CountryID", "StateID"],
                        "TextField",
                        "ValueField"
                      )
                      : []
                  }
                  name="districtID"
                  value={values?.districtID || ""}
                  handleChange={handleReactSelect}
                  respclass="w-100 pr-2"
                  isDisabled={isDisableInputs}

               
                />
                <div className="box-inner">
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={values?.StateID && !isDisableInputs ? false : true}
                    onClick={() =>
                      handleModel(
                        "Add_District",
                        "20vw",
                        "District",
                        true,
                        <DistrictModel
                          handleChangeModel={handleChangeModel}
                          inputData={{
                            stateID: values?.StateID?.value
                              ? parseInt(values?.StateID?.value)
                              : values?.StateID,
                            countryID: values?.countryID?.value
                              ? parseInt(values?.countryID?.value)
                              : values?.countryID,
                            ipAddress: ip,
                            EntryBy: userData?.employeeID,
                          }}
                        />,
                        handleDistrictInsertAPI
                      )
                    }
                    type="button"
                  >
                    <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="col-xl-2.5 col-md-3 col-sm-6 col-12">
              <div className="d-flex">
                <ReactSelect
                  placeholderName={t("City")}
                  searchable={true}
                  respclass="w-100 pr-2"
                  id="City"
                  dynamicOptions={
                    values?.districtID
                      ? filterByTypes(
                        CentreWiseCache,
                        [
                          10,
                          values?.StateID?.value
                            ? parseInt(values?.StateID?.value)
                            : values?.StateID,
                          values?.districtID?.value
                            ? parseInt(values?.districtID?.value)
                            : values?.districtID,
                        ],
                        ["TypeID", "StateID", "DistrictID"],
                        "TextField",
                        "ValueField"
                      )
                      : []
                  }
                  name="cityID"
                  value={values?.cityID || ""}
                  handleChange={handleReactSelect}
                  isDisabled={isDisableInputs}

                />

                <div className="box-inner">
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={values?.districtID && !isDisableInputs ? false : true}
                    onClick={() =>
                      handleModel(
                        "Add_City",
                        "20vw",
                        "city",
                        true,

                        <CityModel
                          handleChangeModel={handleChangeModel}
                          inputData={{
                            city: "noida",
                            country: `${values?.countryID?.value ? parseInt(values?.countryID?.value) : values?.countryID}`,
                            ipAddress: ip,
                            districtID: values?.districtID?.value
                              ? parseInt(values?.districtID?.value)
                              : values?.districtID,
                            CreatedBy: userData?.employeeID,
                            stateID: values?.StateID?.value
                              ? parseInt(values?.StateID?.value)
                              : values?.StateID,
                          }}

                        />,
                        handleCityInsertAPI
                      )
                    }
                    type="button"
                  >
                    <i className="fa fa-plus-circle fa-sm new_record_pluse"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="col-xl-2.5 col-md-3 col-sm-6 col-12">
              <div className="row align-items-end g-1">
              
                <div className="col-md-4 col-5">
                  <ReactSelect
                    placeholderName={t("ID")}
                    name="documentName"
                    value={values?.documentName || ""}
                    handleChange={handleReactSelect}
                    searchable={true}
                    id={"ID"}
                    dynamicOptions={filterByType(
                      CentreWiseCache,
                      13,
                      "TypeID",
                      "TextField",
                      "ValueField"
                    )}
                    isDisabled={isDisableInputs}

                  />
                </div>

                
                <div className="col-md-6 col-6">
                  <Input
                    type="text"
                    className="form-control"
                    id="ID_Proof_No"
                    name="ID_Proof_No"
                    value={values?.ID_Proof_No ? values?.ID_Proof_No : ""}
                    onChange={(e) => {
                      inputBoxValidation(
                        VARCHAR_REGX(
                          values?.documentName?.value?.split("#")[1]
                        ),
                        e,
                        handleChange
                      );
                    }}
                    lable={t("ID_Proof_No")}
                    placeholder=" "
                    showTooltipCount={true}
                    onKeyDown={handleAddDocumentIDs}
                    disabled={isDisableInputs}

                  />
                </div>

                <div className="col-md-2 col-1 d-flex justify-center align items-center mb-1">
                  <button
                    className="btn btn-primary p-2"
                    type="button"
                    onClick={handleAddDocumentIDsOnClick}
                    disabled={isDisableInputs}
                  >
                    <i className="fa fa-plus-circle fa-sm new_record_pluse "></i>
                  </button>
                </div>
              </div>
            </div> */}

            {/* <div className="d-flex"> */}
            {documentIds?.map((doc, key) => {
              return (
                <div className="col-xl-2.5 col-md-3 col-sm-6 col-12 position-relative">
                  <LabeledInput
                    label={doc?.name?.label}
                    value={doc?.id}
                    className={"mb-2"}
                  />
                  {/* <button
                      className="btn btn-sm btn-primary "
                      type="button"
                      onClick={() => {
                        deleteDocument(doc);
                      }}
                    > */}
                  <i
                    className="fa fa-times fa-sm new_record_pluse"
                    style={{ position: "absolute", top: "5px", right: "24px" }}
                    onClick={() => {
                      deleteDocument(doc);
                    }}
                  ></i>
                  {/* </button> */}
                </div>
              );
            })}
            {/* </div> */}
          </div>
        </div>
        <div className="col-1 d-none d-md-block position-relative">
          <div
            style={{
              border: "1px solid grey",
              borderRadius: "5px",
              textAlign: "center",
              width: "67%",
              marginLeft: "10px",
            }}
            className="p-1"
          >
            <img
              height={50}
              // width={116}
              src={patientImageSrc ? patientImageSrc : pro}
              // src={values?.PatientPhoto || values?.profileImage}
              style={{ width: "100%" }}
              // alt="Patient"
              onClick={() => setIsuploadOpen(true)}
            />
          </div>
          <div className="p-1 personalDetailUploadDocument">
            <Tooltip
              target={`#document-s`}
              position="top"
              content={t("Patient Document's")}
              event="hover"
            />
            {/* Document + DPDP consent: two image buttons in the slot the document bar used, so the column keeps its height */}
            <div className="personal-photo-actions position-absolute" style={{ width: "62%", marginLeft: "5px", bottom: "5px" }}>
              <button
                className="text-white rounded p-1"
                type="button"
                style={{ fontSize: "11px", flex: 1 }}
                id="document-s"
                onClick={() => setIsuploadDocOpen(true)}
              >
                <i className="fa fa-file" aria-hidden="true"></i>
              </button>
              {dpdpSlot}
            </div>
            {/* <button
              className="text-white rounded d-block d-xl-none position-absolute"
              style={{ width: "67%", marginLeft: "3px", bottom: "5px" }}
              id="document-s"
            >
              <i className="fa fa-file" aria-hidden="true"></i>
            </button> */}
          </div>
          {/* Fingerprint biometric capture (opens popup) - below patient photo */}
          <PatientBiometricDetails
            values={values}
            setValues={setValues}
            isUpdate={isUpdate}
          />
        </div>
      </div>

      {handleModelData?.isOpen && (
        <Modal
          visible={handleModelData?.isOpen}
          setVisible={setIsOpen}
          modalWidth={handleModelData?.width}
          Header={t(handleModelData?.label)}
          buttonType={"submit"}
          buttons={handleModelData?.extrabutton}
          modalData={handleModelData?.modalData}
          setModalData={setModalData}
          handleAPI={handleModelData?.handleInsertAPI}
        >
          {handleModelData?.Component}
        </Modal>
      )}

      {isuploadDocOpen && (
        <AttachDoumentModal
          isuploadOpen={isuploadDocOpen}
          setIsuploadOpen={setIsuploadDocOpen}
          documentsViewList={values?.documentsList}
          // preview={preview}
          isCalender={false}
          values={values}
          modelHeader={t("Upload Patient Document")}
          handleAPI={(data) => {
            setValues((val) => ({ ...val, documentsList: data }));
            setIsuploadDocOpen(false);
          }}

        // handleImageChange={handleImageChange}
        />
      )}
      {/* isExtractAdharOpen */}
      {isExtractAdharOpen && (
        <UploadImageModal
          isuploadOpen={isExtractAdharOpen}
          closeCameraStream={closeCameraStream}
          setIsuploadOpen={(isOpen) => {
            if (!isOpen) {
              resetAadhaarScanState();
            }
            setIsExtractAdharOpen(isOpen);
          }}
          modalData={{
            step: aadhaarScan.step,
            frontPreview: aadhaarScan.frontPreview,
            backPreview: aadhaarScan.backPreview,
            preview: getAadhaarCurrentPreview(),
            isProcessing: aadhaarScan.isProcessing,
          }}
          handleImageChange={handleAadhaarImageChange}
          startCamera={startAadhaarCamera}
          videoRef={videoRef}
          cameraStream={cameraStream}
          takePhoto={takeAadhaarPhoto}
          canvasRef={canvasRef}
          handleAPI={handleAadhaarScan}
        />
      )}

      {isuploadOpen && (
        <UploadImageModal
          isuploadOpen={isuploadOpen}
          closeCameraStream={closeCameraStream}
          setIsuploadOpen={setIsuploadOpen}
          // preview={preview}
          modalData={{ preview: preview }}
          handleImageChange={handleImageChange}
          startCamera={startCamera}
          videoRef={videoRef}
          cameraStream={cameraStream}
          takePhoto={takePhoto}
          canvasRef={canvasRef}
          handleAPI={(data) => {
            setValues((val) => ({ ...val, profileImage: data?.preview }));
            setIsuploadOpen(false);
            closeCameraStream();
          }}
        />
      )}

      {/* {getOldPatientData?.length > 0 && (
        <div
          style={{
            position: "absolute",
            zIndex: 9,
            width: "80%",
            top: "63px",
          }}
        >
          <EasyUI
            dataBind={getOldPatientData}
            dataColoum={BIND_TABLE_OLDPATIENTSEARCH_REG}
            onClick={handleClickEasyUI}
          />
        </div>
      )} */}
      {/* </Accordion> */}
    </>
  );
}
