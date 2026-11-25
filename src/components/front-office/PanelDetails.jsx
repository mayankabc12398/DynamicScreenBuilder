import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import ReactSelect from "../formComponent/ReactSelect";
import i18n from "@app/utils/i18n";
import Input from "@app/components/formComponent/Input";
import { useTranslation } from "react-i18next";
import Tables from "../UI/customTable";
import AttachDoumentModal from "../modalComponent/Utils/AttachDoumentModal";
import {
  filterByType,
  filterByTypes,
  handleReactSelectDropDownOptions,
  inputBoxValidation,
  notify,
} from "../../utils/utils";
import DatePicker from "../formComponent/DatePicker";
import moment from "moment";
import {
  AMOUNT_REGX,
  DefaultPanelGroup,
  DefaultPanelName,
  DefaultParentPanel,
} from "../../utils/constant";
import ViewSchemeDoc from "./ViewSchemeDoc";
import Modal from "../modalComponent/Modal";
import { BindCorporatePanelList } from "../../networkServices/EDP/edpApi";

// Module-level cache — API sirf ek baar call hogi puri session mein
let _corporatePanelCache = null;
let _corporatePanelPromise = null;
const getCorporatePanelList = () => {
  if (_corporatePanelCache !== null) return Promise.resolve(_corporatePanelCache);
  if (_corporatePanelPromise) return _corporatePanelPromise;
  _corporatePanelPromise = BindCorporatePanelList()
    .then((res) => {
      _corporatePanelCache = res?.success ? (res.data || []) : [];
      _corporatePanelPromise = null;
      return _corporatePanelCache;
    })
    .catch(() => {
      _corporatePanelCache = [];
      _corporatePanelPromise = null;
      return [];
    });
  return _corporatePanelPromise;
};

const PanelDetails = ({
  CentreWisePanelControlCacheList,
  handleChangePanelDetail,
  values,
  setValues,
  handleReactSelect,
  PanelPatientDetailList,
  setPanelBodyData,
  panelBodyData,
  setPanelDocumentData,
  panelDocumentData,
}) => {
  console.log("panelBodyData", panelBodyData);
  const [t] = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [isDesabled, setIsDesabled] = useState(false);
  const [errors, setErrors] = useState({});
  const [isuploadOpen, setIsuploadOpen] = useState(false);
  const [isViewSchemeDocment, setIsViewSchemeDocment] = useState(false);
  const [isEditable, setIsEditable] = useState({});
  const inputRef = useRef(null);

  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  // Policy No by default mandatory hai (panel/insurance wale patient par).
  // fin_global_resources me IsPolicyNoOptional ki active row (IsActive=1) ho
  // tabhi ye optional hota hai - row hata dene ya IsActive=0 karne par purana
  // mandatory behaviour wapas aa jata hai.
  const isPolicyNoOptional =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find((item) => item?.Name === "IsPolicyNoOptional")
      ?.Value === "1";

  const [corporatePanelList, setCorporatePanelList] = useState([]);

  useEffect(() => {
    getCorporatePanelList().then((data) => setCorporatePanelList(data));
  }, []);

  // const headData = [
  //   t("check"),
  //   t("PanelGroup"),
  //   t("Panel"),
  //   t("ParentPanel"),
  //   // t("Corporate"),
  //   t("PolicyNo"),
  //   t("PolicyCardNo"),
  //   t("NameOnCard"),
  //   t("ExpireDate"),
  //   t("CardHolder"),
  //   t("ApprovalAmount"),
  //   t("ApprovalRemark"),
  //    { name: t("Upload Document"), width: "24%" },
  //   // {name: t("Scheme Mode"), width: "10%" },
  //   { name: t("Scheme Mode"), width: "24%" },

  //   t("View Scheme"),
  //   t("Actions"),
  // ];
  const headData = [
    { name: t("check"), width: "5%" },
    { name: t("PanelGroup"), width: "5%" },
    { name: t("Panel"), width: "10%" },
    { name: t("ParentPanel"), width: "10%" },
    { name: t("Corporate"), width: "10%" },
    { name: t("PolicyNo"), width: "10%" },
    { name: t("PolicyCardNo"), width: "10%" },
    { name: t("NameOnCard"), width: "12%" },
    { name: t("ExpireDate"), width: "8%" },
    { name: t("CardHolder"), width: "10%" },
    { name: t("ApprovalAmount"), width: "10%" },
    { name: t("ApprovalRemark"), width: "12%" },
    { name: t("Upload Document"), width: "24%" },
    { name: t("Scheme Mode"), width: "54%" },
    // { name: t("View Scheme"), width: "10%" },
    { name: t("Actions"), width: "8%" },
  ];

  const modeList = [
    { label: t("Select"), value: "Select" },
    { label: t("SmartCard"), value: "SmartCard" },
    { label: t("SmartBiometric"), value: "SmartBiometric" },
    { label: t("Slade"), value: "Slade" },
    { label: t("LCT"), value: "LCT" },
    { label: t("M-tiba"), value: "M-tiba" },
  ];
  const ErrorHandling = () => {
    let errors = {};
    errors.id = [];
    if (!values?.PanelGroup?.value) {
      errors.PanelGroup = "Panel Group Is Required";
      errors.id[errors.id?.length] = "PanelGroupFocus";
    }
    if (!values?.ParentPanel?.value) {
      errors.ParentPanel = "Parent Panel Is Required";
      errors.id[errors.id?.length] = "ParentPanelFocus";
    }
    if (!values?.PanelName?.value) {
      errors.PanelName = "Panel Is Required";
      errors.id[errors.id?.length] = "PanelFocus";
    }
    // if (!values?.PolicyNo) {
    //   errors.PolicyNo = "Policy No Is Required";
    //   errors.id[errors.id?.length] = "PolicyNo";
    // }
    // if (!values?.PolicyCardNo) {
    //   errors.PolicyCardNo = "Policy Card No Is Required";
    //   errors.id[errors.id?.length] = "PolicyCardNo";
    // }
    // if (!values?.PanelCardName) {
    //   errors.PanelCardName = "Name On Card Is Required";
    //   errors.id[errors.id?.length] = "PanelCardName";
    // }
    // if (!values?.PolicyExpiry) {
    //   errors.PolicyExpiry = "Expire Date Is Required";
    //   errors.id[errors.id?.length] = "PolicyExpiry";
    // }
    // if (!values?.CardHolder) {
    //   errors.CardHolder = "Card Holder Is Required";
    //   errors.id[errors.id?.length] = "CardHolderFocus";
    // }
    // if (!values?.ApprovalAmount) {
    //   errors.ApprovalAmount = "Approval Amount Is Required";
    //   errors.id[errors.id?.length] = "ApprovalAmount";
    // }
    // if (!values?.ApprovalRemarks) {
    //   errors.ApprovalRemarks = "Approval Remark Is Required";
    //   errors.id[errors.id?.length] = "ApprovalRemarks";
    // }

    return errors;
  };

  useEffect(() => {
    if (errors?.id) {
      const inputElement = document.getElementById(errors?.id[0]);

      if (inputElement) {
        inputElement.focus();
      }
    }
  }, [errors]);
  console.log("Asdasdasdasdasdasd", panelBodyData);
  const handleSavePanelDetail = () => {
    const customerrors = ErrorHandling();
    if (Object.keys(customerrors)?.length > 1) {
      if (Object.values(customerrors)[0]) {
        notify(Object.values(customerrors)[1], "error");
        setErrors(customerrors);
      }
      return false;
    }
   if (!isPolicyNoOptional && values?.PanelGroup?.value !== "1") {
      if (!values?.PolicyNo) {
        notify(t("Policy is Required"), "warn");
        return;
      }
    }
    const isDuplicate = panelBodyData?.find(
      (item) => item?.PanelName?.value === values?.PanelName?.value,
    );
    if (isDuplicate) {
      notify(t("Panel Name already exist"), "error");
      return false;
    }
    if (
      !isPolicyNoOptional &&
      values?.PanelGroup?.value !== "1" &&
      !values?.PolicyNo
    ) {
      notify(t("Policy No Is Required"), "error");
      return;
    }
    // if (!values?.PolicyExpiry) {
    //   notify("Please Select Expiry", "error");
    //   return
    // }
    setPanelBodyData((val) => [
      {
        PanelGroup: values?.PanelGroup,
        PanelName: values?.PanelName,
        ParentPanel: values?.ParentPanel,
        CorporareName: values?.CorporareName?.value
          ? values?.CorporareName
          : "",
        PolicyNo: values?.PolicyNo,
        PolicyCardNo: values?.PolicyCardNo,
        PanelCardName: values?.PanelCardName,
        PolicyExpiry: values?.PolicyExpiry
          ? moment(values?.PolicyExpiry).format("YYYY-MM-DD")
          : "",
        CardHolder: values?.CardHolder,
        ApprovalAmount: values?.ApprovalAmount,
        ApprovalRemarks: values?.ApprovalRemarks,
        // Corporate: values?.Corporate,
        isDefaultPanel: panelBodyData?.length === 0 ? 1 : 0,
      },
      ...val,
    ]);
    setPanelDocumentData((val) => [
      {
        panelDocumentViewList: [],
        panelID: values?.PanelName?.value,
      },
      ...val,
    ]);

    setValues((val) => ({
      ...val,
      PanelGroup: { label: "", value: "" },
      ParentPanel: { label: "", value: "" },
      PanelName: { label: "", value: "" },
      CorporareName: values?.CorporareName ? { label: "", value: "" } : "",
      PolicyNo: "",
      PolicyCardNo: "",
      PanelCardName: "",
      PolicyExpiry: "",
      CardHolder: "",
      ApprovalAmount: "",
      ApprovalRemarks: "",
    }));
  };

  const handleUpdatePanelDetail = () => {
    const customerrors = ErrorHandling();
    if (Object.keys(customerrors)?.length > 1) {
      if (Object.values(customerrors)[0]) {
        notify(Object.values(customerrors)[1], "error");
        setErrors(customerrors);
      }
      return false;
    }

    let panelDetailTableData = panelBodyData?.map((obj, key) => {
      if (key === isEditable?.index) {
        obj["PanelGroup"] = values?.PanelGroup;
        obj["PanelName"] = values?.PanelName;
        obj["ParentPanel"] = values?.ParentPanel;
        obj["CorporareName"] = values?.CorporareName;
        obj["PolicyNo"] = values?.PolicyNo;
        obj["PolicyCardNo"] = values?.PolicyCardNo;
        obj["PanelCardName"] = values?.PanelCardName;
        obj["PolicyExpiry"] = values?.PolicyExpiry ? moment(values?.PolicyExpiry).format(
          VITE_DATE_FORMAT,
        ) : "";
        obj["CardHolder"] = values?.CardHolder;
        obj["ApprovalAmount"] = values?.ApprovalAmount;
        obj["ApprovalRemarks"] = values?.ApprovalRemarks;
      }
      return obj;
    });

    setPanelBodyData(panelDetailTableData);

    setValues((val) => ({
      ...val,
      PanelGroup: {},
      PanelName: "",
      ParentPanel: "",
      CorporareName: "",
      PolicyNo: "",
      PolicyCardNo: "",
      PanelCardName: "",
      PolicyExpiry: "",
      CardHolder: "",
      ApprovalAmount: "",
      ApprovalRemarks: "",
    }));
    setIsEditable({ status: false, index: null });
  };

  // Dynamically generate THEAD using bodyData keys
  // const THEAD = headData?.map((key) => {
  //   // Capitalize first letter and replace underscores with spaces
  //   return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
  // });
  // const handleChange = (e, index) => {
  //   const { name, value } = e.target;
  //   const data = [...panelBodyData];
  //   data[index][name] = (
  //     <input
  //       value={value}
  //       onChange={(e) => handleChange(e, index)}
  //       name="input"
  //     />
  //   );
  //   setPanelBodyData(data);
  // };

  // const handleReactChange = (key,name, value) => {
  //
  //   if (name === "SchemeMode") {
  //     setValues((val) => ({
  //       ...val,
  //       [name]: value,
  //     }));
  //   }
  // }
  const handleSchemeModeChange = (rowIndex, selectedOption) => {
    setPanelBodyData((prev) =>
      prev.map((row, index) =>
        index === rowIndex ? { ...row, SchemeMode: selectedOption || "" } : row,
      ),
    );
  };

  const handleEditAction = (index) => {
    let editData = panelBodyData?.find((item, i) => i === index);
    Object.keys(editData).forEach((key) => {
      values[key] = editData[key];
    });
    let ParentPanel = {
      ...values?.ParentPanel,
      extraColomn: values?.ParentPanel?.value,
    };
    let PanelName = {
      ...values?.PanelName,
      extraColomn: values?.PanelName?.value,
    };
    values.PolicyExpiry = values?.PolicyExpiry
      ? moment(values?.PolicyExpiry, "DD-MMM-YYYY").toDate()
      : "";
    values.ParentPanel = ParentPanel;
    values.PanelName = PanelName;
    setIsEditable({ status: true, index: index });
    setValues(values);
  };

  // const handleCheck = (index, val) => {
  //   let editData = panelBodyData[index];

  //   // fill values (already correct)
  //   Object.keys(editData).forEach((key) => {
  //     values[key] = editData[key];
  //   });

  //   // update checkbox state
  //   setPanelBodyData((prev) =>
  //     prev.map((item, i) => {
  //       if (i === index) {
  //         return { ...item, isDefaultPanel: 1 }; // selected row checked
  //       }
  //       return { ...item, isDefaultPanel: 0 }; // others unchecked
  //     }),
  //   );
  // };
  const handleCheck = (index) => {
    setPanelBodyData((prev) =>
      prev.map((item, i) => {
        // toggle same row
        if (i === index) {
          return {
            ...item,
            isDefaultPanel: item.isDefaultPanel === 1 ? 0 : 1,
          };
        }
        // uncheck others
        return { ...item, isDefaultPanel: 0 };
      }),
    );
  };

  const handleDeleteAction = (index) => {
    userRemovedDefault.current = true;
    let editData = panelBodyData?.filter((item, i) => i !== index);
    let documentData = panelDocumentData?.filter((item, i) => i !== index);
    setPanelBodyData(editData);
    setPanelDocumentData(documentData);
  };

  // Changing the Parent Panel only sets the parent; the Panel is never touched from here.
  // (It works the other way round: picking a Panel sets its Parent Panel and Insurance
  // Group - see handlePanelSelect.)
  const handleChangeParentPanel = (name, value) => {
    setValues((val) => ({
      ...val,
      [name]: value,
    }));
  };

  const handleReactSelectGroup = (name, value) => {
    // Insurance Group cleared (X): Parent Panel and Panel depend on it, so blank
    // them too instead of falling back to the default "Cash" parent.
    if (!value?.value) {
      setValues((prev) => ({
        ...prev,
        [name]: value,
        ParentPanel: { label: "", value: "" },
        PanelName: { label: "", value: "" },
      }));
      return;
    }
    setValues((prev) => ({
      ...prev,
      [name]: value,
      ParentPanel: DefaultParentPanel,
    }));
  };

  const [panelDocumentIndex, setPanelDocumentIndex] = useState(0);

  /* panelDocumentData is index-aligned with panelBodyData, but only rows added in this
     session were ever seeded with a panelID. Panels loaded for an existing patient have no
     entry at all, so their scans had no panel to be filed under and could not be stored
     panel-wise. Seed the row from the panel that was clicked, on open. */
  const handleOpenMode = (index, value) => {
    const panelID = value?.PanelName?.value ?? "";
    setPanelDocumentData((prev) => {
      const rows = [...(prev || [])];
      rows[index] = {
        panelDocumentViewList: [],
        ...(rows[index] || {}),
        panelID,
      };
      return rows;
    });
    setPanelDocumentIndex(index);
    setIsuploadOpen(true);
  };

  // const handleAddPanelDetail = (data) => {
  //   let bodyData = JSON.parse(JSON.stringify(panelDocumentData));
  //   bodyData[panelDocumentIndex]["panelDocumentViewList"] = JSON.parse(
  //     JSON.stringify(data),
  //   );
  //   setPanelDocumentData(bodyData);
  //   setIsuploadOpen(false);
  // };
  const handleAddPanelDetail = (data) => {
    console.log(data, "asdddddd");
    let bodyData = JSON.parse(JSON.stringify(panelDocumentData || []));
    if (!bodyData[panelDocumentIndex]) {
      bodyData[panelDocumentIndex] = {};
    }

    // Without a panelID the scans cannot be filed panel-wise, so fall back to the
    // panel on the row this popup was opened from.
    if (!bodyData[panelDocumentIndex].panelID) {
      bodyData[panelDocumentIndex].panelID =
        panelBodyData?.[panelDocumentIndex]?.PanelName?.value ?? "";
    }

    bodyData[panelDocumentIndex].panelDocumentViewList = [...data];

    setPanelDocumentData(bodyData);
    setIsuploadOpen(false);
  };

  console.log("panelllll", panelDocumentData);
  console.log("panelBodyData", panelBodyData);
  const handleAddPanelTable = useCallback(
    (panelBodyData) => {
      return panelBodyData?.map((val, key) => {
        const checkCol = {
          check: (
            <input
              type="checkbox"
              checked={val?.isDefaultPanel === 1}
              onChange={() => handleCheck(key)}
            />
          ),
        };

        // Convert data to match THEAD columns
        const obj = {
          PanelGroup: val.PanelGroup?.label,
          Panel: val.PanelName?.label, // FIXED
          ParentPanel: val.ParentPanel?.label,
          CorporareName: val.CorporareName?.label,
          // Corporate: val.CorporareName?.label,   // FIXED
          PolicyNo: val.PolicyNo,
          PolicyCardNo: val.PolicyCardNo,
          NameOnCard: val.PanelCardName, // FIXED
          ExpireDate: val.PolicyExpiry, // FIXED
          CardHolder: val.CardHolder?.label,
          ApprovalAmount: val.ApprovalAmount,
          ApprovalRemark: val.ApprovalRemarks, // FIXED
        };

        // Upload Document
        obj["Upload Document"] = (
          <button
            className="btn btn-danger btn-sm w-100"
            // disabled={isDesabled}
            onClick={(e) => {
              e.preventDefault();
              handleOpenMode(key, val);
            }}
            disabled={
              panelBodyData?.find((item) => item.isDefaultPanel === 1)
                ? false
                : true
            }
          >
            {t("Upload")}
          </button>
        );
        // view scheme

        // console.log("first",modeList?.find((e)=>e?.value=="LCT"))
        (obj["SchemeMode"] = (
          <div style={{ background: "white", padding: "2px" }}>
            {/* <ReactSelect
            name="SchemeMode"
            placeholderName={i18n.t("")}
            dynamicOptions={modeList}
            // value={modeList?.find((e)=>e?.value==val?.SchemeMode)}
            value={val?.SchemeMode ? modeList?.find((e)=>e?.value=="LCT")?.value : null}
            handleChange={(name, selectedOption) =>
              handleSchemeModeChange(key, selectedOption)
            }
          // handleChange={(e, name, value) =>
          //   handleSchemeModeChange(key, value)
          // }

          /> */}
            {/* {
  console.log("first1111",val )
}   */}
            {/* value={val?.SchemeMode ? modeList?.find((e)=>e?.value==val?.SchemeMode)?.value:val?.SchemeMode?.value} */}
            <ReactSelect
              name="SchemeMode"
              placeholderName={i18n.t("")}
              dynamicOptions={modeList}
              value={
                val?.SchemeMode?.value
                  ? val?.SchemeMode?.value
                  : modeList?.find((e) => e?.value == val?.SchemeMode)?.value
              }
              handleChange={(name, selectedOption) =>
                handleSchemeModeChange(key, selectedOption)
              }
            />
          </div>
        )),
          // (obj["View_Scheme"] = (
          //   <>
          //     <button
          //       className="btn btn-primary btn-sm w-100 "
          //       type="button"
          //       onClick={() => {
          //         setIsViewSchemeDocment(true);
          //       }}
          //     >
          //       <span className="">
          //         <i className="fa fa-eye mr-2" aria-hidden="true"></i>
          //       </span>
          //       {t("View")}
          //     </button>
          //   </>
          // ));
          // Actions
          (obj["Actions"] = (
            <>
              <span className="mx-2" onClick={() => handleEditAction(key)}>
                <i className="fa fa-edit"></i>
              </span>
              <span className="mx-2" onClick={() => handleDeleteAction(key)}>
                <i className="fa fa-trash text-danger"></i>
              </span>
            </>
          ));

        return {
          ...checkCol,
          ...obj,
        };
      });
    },
    [panelBodyData.length],
  );
  const allPanelsOptions = useMemo(
    () =>
      filterByTypes(
        CentreWisePanelControlCacheList,
        [1],
        ["TypeID"],
        "TextField",
        "ValueField",
        "ParentID",
      )?.map((item) => ({
        ...item,
        parentID: item?.ParentID ?? item?.parentID ?? item?.extraColomn ?? "",
        panelGroupID: item?.PanelGroupID ?? item?.panelGroupID ?? "",
      })),
    [CentreWisePanelControlCacheList],
  );

  const allParentOptions = useMemo(
    () =>
      filterByTypes(
        CentreWisePanelControlCacheList,
        [5],
        ["TypeID"],
        "TextField",
        "ValueField",
        "ParentID",
      )?.map((item) => ({
        ...item,
        panelGroupID: item?.PanelGroupID ?? item?.panelGroupID ?? "",
      })),
    [CentreWisePanelControlCacheList],
  );

  const parentPanelOptions = useMemo(() => {
    const groupValue = values?.PanelGroup?.value;
    let list = allParentOptions || [];
    if (groupValue && String(groupValue) !== "0") {
      list = list.filter(
        (item) => String(item?.panelGroupID) === String(groupValue),
      );
    }
    const chosen = values?.ParentPanel;
    if (
      chosen?.value &&
      !list.some((item) => String(item?.value) === String(chosen.value))
    ) {
      list = [{ label: chosen.label, value: chosen.value }, ...list];
    }
    return list;
  }, [allParentOptions, values?.PanelGroup?.value, values?.ParentPanel]);

  // Every panel is offered: the Panel drives Parent Panel and Insurance Group (handlePanelSelect),
  // so the list is not narrowed by them - otherwise a panel of another group/parent could never
  // be picked.
  const filteredPanelOptions = useMemo(
    () => allPanelsOptions || [],
    [allPanelsOptions],
  );

  const panelSelected = useMemo(() => {
    const v = values?.PanelName;
    if (!v) return "";
    const found = filteredPanelOptions?.find(
      (opt) => String(opt?.value) === String(v?.value ?? v),
    );
    if (found) return found;
    if (typeof v === "object" && v?.label !== undefined) return v;
    return { label: String(v), value: v };
  }, [filteredPanelOptions, values?.PanelName]);

  const handlePanelSelect = (name, selected) => {
    const selectedValue = selected?.value ?? selected;
    const panelObj = allPanelsOptions?.find(
      (p) => String(p?.value) === String(selectedValue),
    );

    if (!panelObj) {
      setValues((prev) => ({ ...prev, PanelName: selected }));
      return;
    }

    const parentOptions = filterByTypes(
      CentreWisePanelControlCacheList,
      [5],
      ["TypeID"],
      "TextField",
      "ValueField",
      "ParentID",
    )?.map((item) => ({
      ...item,
      id: item?.ValueField ?? item?.PanelID ?? item?.value,
      parentID: item?.ParentID ?? item?.parentID ?? "",
    }));
    const groupOptions = filterByTypes(
      CentreWisePanelControlCacheList,
      [4],
      ["TypeID"],
      "TextField",
      "ValueField",
    )?.map((item) => ({
      ...item,
      id: item?.ValueField ?? item?.PanelID ?? item?.value,
    }));

    const parentFull = parentOptions?.find((item) =>
      [panelObj?.ParentID, panelObj?.parentID, panelObj?.extraColomn].some(
        (id) => String(item?.id) === String(id),
      ),
    );
    const panelGroupFull = groupOptions?.find((item) =>
      [panelObj?.PanelGroupID, panelObj?.panelGroupID].some(
        (id) => String(item?.id) === String(id),
      ),
    );

    setValues((prev) => ({
      ...prev,
      PanelName: { label: panelObj?.label, value: panelObj?.value },
      // The Panel decides both: a panel with no parent / group clears the old one rather
      // than leaving another panel's values beside it.
      ParentPanel: parentFull
        ? { label: parentFull?.label, value: parentFull?.id }
        : { label: "", value: "" },
      PanelGroup: panelGroupFull
        ? { label: panelGroupFull?.label, value: panelGroupFull?.id }
        : { label: "", value: "" },
    }));
  };

  // ---- Default Panel (fin_global_resources se) --------------------------------
  // Registration khulte hi Panel apne aap chun jaye - kaunsa, ye code me nahi
  // balki global resource "DefaultPanelName" me likha hota hai. Usme panel ka
  // naam (jaise CASH) ya uski PanelID, dono chalte hain.
  // Row na ho ya khaali ho to kuch default nahi lagta - purana bartaav.
  const defaultPanelSetting = String(
    (Array.isArray(GetGlobalResources) &&
      GetGlobalResources?.find((item) => item?.Name === "DefaultPanelName")
        ?.Value) ||
      "",
  ).trim();
  const defaultPanelApplied = useRef(false);
  // 26-10-2026 - fin_global_resources DefaultPanelAutoAdd = 1: the default panel (DefaultPanelName, e.g. CASH) is also put
  // into the Scheme Details list on its own, as if ADD had been pressed, so a plain cash patient needs no panel step.
  const defaultPanelAutoAdd =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find((item) => item?.Name === "DefaultPanelAutoAdd")?.Value === "1";

  useEffect(() => {
    // Ek hi baar lagana hai, aur tabhi jab user/patient ka apna panel na ho -
    // warna purana patient kholne par uska panel badal jata.
    if (defaultPanelApplied.current) return;
    if (defaultPanelAutoAdd) return; // DefaultPanelAutoAdd mode is handled by the effect below
    if (!defaultPanelSetting) return;
    if (values?.PanelName?.value) return;
    if (!allPanelsOptions?.length) return;

    const wanted = defaultPanelSetting.toLowerCase();
    const match = allPanelsOptions.find(
      (p) =>
        String(p?.value ?? "").toLowerCase() === wanted ||
        String(p?.label ?? p?.name ?? "").trim().toLowerCase() === wanted,
    );

    if (!match) return;

    defaultPanelApplied.current = true;
    // Wahi raasta jo user ke chunne par chalta hai, taaki Panel Group aur
    // Parent Panel bhi saath me set ho jayen.
    handlePanelSelect("PanelName", match);
  }, [defaultPanelSetting, allPanelsOptions, values?.PanelName?.value]);

  /* Not "once per screen": whenever the Scheme Details list is EMPTY, the default panel is chosen and added again - after a
     registration is saved and the form is cleared, and after moving to another menu and back. Only a row the user deletes
     by hand stops it (until a panel is in the list again). Only the default panel itself is auto-added, never a panel the
     user is in the middle of picking. */
  const userRemovedDefault = useRef(false);
  const defaultAddTried = useRef(false);
  useEffect(() => {
    if (panelBodyData?.length > 0) {
      userRemovedDefault.current = false;
    }
    // The list changed (row added, or emptied after a save / menu change): allow the default panel to be tried again.
    defaultAddTried.current = false;
  }, [panelBodyData?.length]);

  useEffect(() => {
    if (!defaultPanelAutoAdd || !defaultPanelSetting || !allPanelsOptions?.length) return;
    if (panelBodyData?.length > 0 || userRemovedDefault.current) return;

    const wanted = defaultPanelSetting.toLowerCase();
    const match = allPanelsOptions.find(
      (p) =>
        String(p?.value ?? "").toLowerCase() === wanted ||
        String(p?.label ?? p?.name ?? "").trim().toLowerCase() === wanted,
    );
    if (!match) return;

    if (!values?.PanelName?.value) {
      defaultAddTried.current = false;
      handlePanelSelect("PanelName", match);
      return;
    }
    if (
      String(values.PanelName.value) === String(match.value) &&
      values?.PanelGroup?.value &&
      values?.ParentPanel?.value &&
      !defaultAddTried.current
    ) {
      defaultAddTried.current = true;
      handleSavePanelDetail();
    }
  }, [
    defaultPanelAutoAdd,
    defaultPanelSetting,
    allPanelsOptions,
    panelBodyData?.length,
    values?.PanelName?.value,
    values?.PanelGroup?.value,
    values?.ParentPanel?.value,
  ]);

  const corporateOptions = useMemo(
    () => handleReactSelectDropDownOptions(corporatePanelList, "Company_Name", "PanelID"),
    [corporatePanelList]
  );
  const handleDateTab = (e) => {
    // const inputElement = document.getElementById(`${e?.target?.name}`);
    const inputElement = document.getElementById("CardHolderFocus");
    if (inputElement) {
      inputElement.focus();
    }
  };
  console.log("asdasdsadsadsadsadsadsad", values);
  // useEffect(() => {
  //   setValues((prev) => ({
  //     ...prev,
  //     ParentPanel: { label: "", value: "" },
  //     PanelName: { label: "", value: "" },
  //   }));
  // }, [values?.PanelGroup?.value]);
  return (
    <>
      {isuploadOpen && (
        <AttachDoumentModal
          isuploadOpen={isuploadOpen}
          setIsuploadOpen={setIsuploadOpen}
          isCalender={true}
          documentsViewList={
            panelDocumentData[panelDocumentIndex]?.["panelDocumentViewList"]
          }
          values={values}
          modelHeader={t("Panel Document")}
          allowMultipleFiles={true}
          handleAPI={(data) => {
            handleAddPanelDetail(data);
          }}
          documentNameHoverText="document handled through panelDetail use props"
          documentListHoverText="fix it"
        />
      )}
      <Modal
        visible={isViewSchemeDocment}
        // modalData={documentsList}
        // handleAPI={handleAPI}
        setVisible={() => {
          // closeCameraStream();
          setIsViewSchemeDocment(false);
        }}
        modalWidth={`97vw`}
        Header={t("View Scheme")}
        footer={<></>}
      >
        <ViewSchemeDoc />
      </Modal>
      <div className="row g-4 pt-2 pl-2 pr-2">
        <div className="col-xl-2 col-md-3 col-sm-4 col-12">
          <div className="form-group">
            <ReactSelect
              placeholderName={i18n.t("PanelGroup")}
              dynamicOptions={[
                { label: t("All"), value: "0" },
                ...filterByTypes(
                  CentreWisePanelControlCacheList,
                  [4],
                  ["TypeID"],
                  "TextField",
                  "ValueField",
                ),
              ]}
              name="PanelGroup"
              value={values?.PanelGroup?.value || ""}
              // defaultValue={values?.PanelGroupID}
              // handleChange={handleReactSelect}
              handleChange={handleReactSelectGroup}
              requiredClassName={`required-fields ${errors?.PanelGroup ? "required-fields-active" : ""}`}
              id="PanelGroup"
              inputId="PanelGroupFocus"
              searchable={true}
            //tabIndex="6"
            />
          </div>
        </div>

        <div className="col-xl-2 col-md-3 col-sm-4 col-12">
          <div className="form-group">
            <ReactSelect
              placeholderName={i18n.t("ParentPanel")}
              // isDisabled={values?.PanelGroup?.value ? false : true}
              dynamicOptions={parentPanelOptions}
              id="ParentPanel"
              inputId="ParentPanelFocus"
              name="ParentPanel"
              value={values?.ParentPanel?.value || ""}
              handleChange={handleChangeParentPanel}
              searchable={true}
              requiredClassName={`required-fields ${errors?.ParentPanel ? "required-fields-active" : ""}`}
            //tabIndex="7"
            />
          </div>
        </div>
        <div className="col-xl-2 col-md-3 col-sm-4 col-12">
          <div className="form-group">
            <ReactSelect
              placeholderName={i18n.t("Panel")}
              // isDisabled={values?.PanelGroup?.value ? false : true}
              id="Panel"
              inputId="PanelFocus"
              name="PanelName"
              value={panelSelected?.value ?? ""}
              handleChange={handlePanelSelect}
              dynamicOptions={filteredPanelOptions}
              requiredClassName={`required-fields ${errors?.PanelName ? "required-fields-active" : ""}`}
              searchable={true}
            //tabIndex="8"
            />
          </div>
        </div>

        {corporatePanelList?.length > 0 && (
          <div className="col-xl-2 col-md-3 col-sm-4 col-12">
            <div className="form-group">
              <ReactSelect
                placeholderName={i18n.t("Corporate")}
                dynamicOptions={corporateOptions}
                //  dynamicOptions={handleReactSelectDropDownOptions(
                //                     corporatePanelList,
                //                     "Company_Name",
                //                     "PanelID",
                //                   )}
                name="CorporareName"
                value={`${values?.CorporareName?.value ? values?.CorporareName?.value : ""}`}
                // value={`${values?.CorporareName?.value ? values?.CorporareName?.value : ""}`}
                handleChange={handleReactSelect}
                id={"CorporareName"}
                searchable={true}
              />
            </div>
          </div>
        )}

        <div className="col-xl-2 col-md-3 col-sm-4 col-12 d-flex">
          <Input
            type="text"
            className={`form-control  ${errors?.PolicyNo && ""} ${!isPolicyNoOptional && values?.PanelGroup?.value !== "1" ? "required-fields" : ""}`}
            id="PolicyNo"
            name="PolicyNo"
            value={values?.PolicyNo}
            onChange={handleChangePanelDetail}
            inputRef={inputRef}
            disabled={isDesabled}
            lable={i18n.t("Policy_No")}
            placeholder=" "
            respclass="w-100 ml-1"
          //tabIndex="9"
          />
        </div>
        <Input
          type="text"
          className={`form-control  ${errors?.PolicyCardNo && ""}`}
          id="PolicyCardNo"
          name="PolicyCardNo"
          value={values?.PolicyCardNo}
          onChange={handleChangePanelDetail}
          lable={i18n.t("Policy_Card_No")}
          placeholder=" "
          disabled={isDesabled}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
        //tabIndex="10"
        />

        <Input
          type="text"
          className={`form-control  ${errors?.PanelCardName && ""}`}
          id="PanelCardName"
          name="PanelCardName"
          value={values?.PanelCardName}
          onChange={handleChangePanelDetail}
          lable={i18n.t("Name_On_Card")}
          placeholder=" "
          disabled={isDesabled}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
        //tabIndex="11"
        />

        <DatePicker
          className={`custom-calendar  ${errors?.PolicyExpiry && ""}`}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          // id="PolicyExpiry"
          name="PolicyExpiry"
          minDate={new Date()}
          // inputClassName={"required-fields"}
          value={values?.PolicyExpiry}
          // handleChange={handleChangePanelDetail}
          handleChange={(e) => {
            handleChangePanelDetail(e);
          }}
          lable={t("Expire_Date")}
          handleSelect={handleDateTab}
          placeholder={VITE_DATE_FORMAT}
        />

        {/* <Input
          type="date"
          className={`form-control required-fields ${errors?.PolicyExpiry && "required-fields-active"}`}
          id="PolicyExpiry"
          name="PolicyExpiry"
          value={values?.PolicyExpiry}
          onChange={handleChangePanelDetail}
          lable={i18n.t("Expire_Date")}
          placeholder=" "
          disabled={isDesabled}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
        /> */}

        <div className="col-xl-2 col-md-3 col-sm-4 col-12">
          <div className="form-group">
            <ReactSelect
              placeholderName={i18n.t("Card Holder")}
              dynamicOptions={filterByTypes(
                CentreWisePanelControlCacheList,
                [3],
                ["TypeID"],
                "TextField",
                "ValueField",
              )}
              name="CardHolder"
              value={values?.CardHolder?.value}
              handleChange={handleReactSelect}
              isDisabled={isDesabled}
              id="CardHolder"
              inputId="CardHolderFocus"
              searchable={true}
              requiredClassName={` ${errors?.CardHolder ? "" : ""}`}
            //tabIndex="13"
            />
          </div>
        </div>

        <Input
          type="text"
          className={`form-control  ${errors?.ApprovalAmount && ""}`}
          id="ApprovalAmount"
          name="ApprovalAmount"
          value={values?.ApprovalAmount}
          defaultValue={values?.ApprovalAmount}
          // onChange={handleChangePanelDetail}
          onChange={(e) => {
            inputBoxValidation(AMOUNT_REGX(8), e, handleChangePanelDetail);
          }}
          lable={i18n.t("Approval_Amount")}
          placeholder=" "
          disabled={isDesabled}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
        //tabIndex="14"
        />
        <Input
          type="text"
          className={`form-control  ${errors?.ApprovalRemarks && ""}`}
          id="ApprovalRemarks"
          name="ApprovalRemarks"
          value={values?.ApprovalRemarks}
          onChange={handleChangePanelDetail}
          lable={i18n.t("Approval_Remark")}
          placeholder=" "
          disabled={isDesabled}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
        //tabIndex="15"
        />

        <div className="col-xl-2 col-md-3 col-sm-4 col-12 d-flex">
          {isEditable?.status ? (
            <button
              className="btn btn-primary btn-sm  w-50 ml-1"
              type="button"
              onClick={handleUpdatePanelDetail}
            >
              {t("update")}
            </button>
          ) : (
            <button
              className="btn custom_save_button btn-primary btn-sm  w-50 ml-1 required-fields"
              type="button"
              onClick={handleSavePanelDetail}
            >
              {t("add")}
              {/* <i className="fa fa-save ml-1" aria-hidden="true"></i> */}
            </button>
          )}
        </div>
      </div>
     
        <Tables
          thead={headData}
          // thead={THEAD}
          scrollView={"scrollView"}
          style={{
            maxHeight: "125px",
          }}
          tbody={handleAddPanelTable(
            panelBodyData,
            // panelBodyData.filter((item) => item.PanelGroup?.value !== 1)
          )}
          fs={"12"}
        />
      
    </>
  );
};

export default PanelDetails;
