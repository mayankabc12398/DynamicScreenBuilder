import React, { useEffect, useState } from "react";
import Heading from "../UI/Heading";
import ReactSelect from "../formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import { notify } from "../../utils/utils";
import FullTextEditor from "../../utils/TextEditor";
import Input from "../formComponent/Input";
import {
  GetBindIVFDischargSummaryHeaders,
  GetBindIVFDischargSummaryTemplates,
  GetBindIVFPatientAdmitDetails,
  GetBindIVFPatientDischargeSummaryDetails,
  GetBindIVFPreviousDischargeSummary,
  GetBindIVFTemplateDetails,
  handleSaveOrUpdateIVFDischargeSummary,
  printPrintIVFDischargeSummary,
} from "../../networkServices/IVFCounsellingAPI";
import LabeledInput from "../formComponent/LabeledInput";
import Tables from "../UI/customTable";
import { ReprintSVG } from "../SvgIcons";
import { RedirectURL } from "../../networkServices/PDFURL";

const IVFDischargeSummary = ({ data }) => {
  const [t] = useTranslation();
  const [tableData, setTableData] = useState([]);
  const [AdmitList, setAdmitList] = useState([]);
  const [TemplateList, setTemplateList] = useState([]);
  const [HeaderList, setHeaderList] = useState([]);

  const [payload, setPayload] = useState({
    AdmitDischargeDetail: "",
    Header: "",
    Templates: "",
    TemplatesName: "",
    TempName: "",
    editorValue: "",
    RadioType: "Nothing",
    saveType: "Save",
    EditTable: false,
    clear: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((val) => ({ ...val, [name]: value }));
  };
  const handleReactSelect = (name, val) => {
    if (name === "Header") {
      setPayload((prev) => ({
        ...prev,
        [name]: val?.value,
        [`${name}Name`]: val?.label,
        Templates: "", // Header change hone par purana template clear karein
        TemplatesName: "",
      }));
      getTemplateList(val?.value);
    } else if (name === "Templates") {
      // Pehle state update karein ki kaunsa template select hua hai
      setPayload((prev) => ({
        ...prev,
        [name]: val?.value,
        TemplatesName: val?.label, // Isse label preserve rahega
      }));

      // Phir template ki details fetch karein (editor value ke liye)
      if (val?.value) {
        getTemplateDetails(val?.value);
      }
    } else {
      setPayload((prev) => ({
        ...prev,
        [name]: val?.value,
        [`${name}Name`]: val?.label,
      }));
    }
  };
  // const handleReactSelect = (name, val) => {
  //   debugger
  //   if (name === "Header") {
  //     setPayload((prev) => ({
  //       ...prev,
  //       [name]: val?.value,
  //       [`${name}Name`]: val?.label,
  //     }));
  //     getTemplateList(val?.value);
  //   } else if (name === "Templates") {
  //     setPayload((prev) => ({
  //       ...prev,
  //       [name]: val?.value,
  //       // TemplatesName: val?.label,
  //     }));
  //     getTemplateDetails(val?.value);
  //   } else {
  //     setPayload((prev) => ({
  //       ...prev,
  //       [name]: val?.value,
  //       [`${name}Name`]: val?.label,
  //     }));
  //   }
  // };

  const getDischargeAdmitList = async () => {
    try {
      const response = await GetBindIVFPatientAdmitDetails(data?.transactionID);
      if (response?.success) {
        setAdmitList(response?.data);
      }
    } catch (error) {
      console.error("Error fetching Admit List:", error);
    }
  };

  const getTemplateList = async (id) => {
    try {
      const response = await GetBindIVFDischargSummaryTemplates(id);
      if (response?.success) {
        setTemplateList(response?.data);
      }
    } catch (error) {
      console.error("Error fetching Template List:", error);
    }
  };

  const getHeaderList = async () => {
    try {
      const response = await GetBindIVFDischargSummaryHeaders();
      if (response?.success) {
        setHeaderList(response?.data);
      }
    } catch (error) {
      console.error("Error fetching Header List:", error);
    }
  };
  const getTemplateDetails = async (TemplateID) => {
    try {
      const response = await GetBindIVFTemplateDetails(TemplateID);
      if (response?.success) {
        setPayload((prev) => ({
          ...prev,
          editorValue: response?.data ?? "",
        }));
      }
    } catch (error) {
      console.error("Error fetching Template Details:", error);
    }
  };

  const handleSearch = async (AdmitId) => {
    try {
      const response = await GetBindIVFPreviousDischargeSummary(
        data?.transactionID ?? "",
        AdmitId ? AdmitId : payload?.AdmitDischargeDetail,
      );

      if (response?.success) {
        setTableData(response?.data);
      } else {
        setTableData([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (payload?.AdmitDischargeDetail) {
      handleSearch(payload?.AdmitDischargeDetail);
    }
  }, [payload?.AdmitDischargeDetail]);

  const handleEdit = async (ele) => {
    try {
      const response = await GetBindIVFPatientDischargeSummaryDetails(
        ele?.AdmitID,
        ele?.HeaderID,
      );

      if (response?.success) {
        setPayload((prev) => ({
          ...prev,
          // editorValue: response?.data ?? "",
          AdmitDischargeDetail: ele?.AdmitID,
          Header: ele?.HeaderID ?? "",
          Templates: "0",
          TemplatesName: "",
          TempName: "",
          editorValue: response?.data ?? "",
          RadioType: "Nothing",
          EditTable: false,
          clear: false,
          saveType: "Update",
        }));
        // setPayload({
        //   AdmitDischargeDetail: ele?.AdmitID,
        //   Header: ele?.HeaderID ?? "",
        //   Templates: "0",
        //   TemplatesName: "",
        //   TempName: "",
        //   editorValue: response?.data ?? "",
        //   RadioType: "Nothing",
        //   EditTable: true,
        //   clear: true,
        //   saveType: "Update",
        // });
      }
    } catch (error) {
      console.log(error);
    }
  };
  const hanldleprint = async () => {
    try {
      const response = await blankPrint_ANCPatientHistoryII(1);

      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleRowPrint = async (item) => {
    debugger;
    try {
      const response = await printPrintIVFDischargeSummary(
        data?.transactionID,
        item?.AdmitID ?? "0",
        "0",
      );
      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  const handleSave = async () => {
    if (!payload?.AdmitDischargeDetail) {
      notify(t("Admit Discharge Detail is required"), "warn");
      return;
    }

    if (!payload?.Header) {
      notify(t("Header is required"), "warn");
      return;
    }

    // if (payload?.saveType === "Save") {
    //   if (!payload?.Templates) {
    //     notify("Templates is required", "warn");
    //     return;
    //   }
    // }

    const reqBody = {
      tid: data?.transactionID ?? "",
      admitID: payload?.AdmitDischargeDetail ?? "",
      details: payload?.editorValue ?? "",
      saveType: payload?.saveType ?? "Save",
      templateName: payload?.TempName
        ? payload?.TempName
        : payload?.TemplatesName ?? "0",
      radios: payload?.RadioType ?? "",
      templateID: payload?.Templates ?? "",
      headerID: payload?.Header ?? "1",
    };

    try {
      const response = await handleSaveOrUpdateIVFDischargeSummary(reqBody);

      if (response?.success) {
        notify(response?.message, "success");
        handleSearch();
        getTemplateList(payload?.Header);
        setPayload((prev) => ({
          ...prev,
          AdmitDischargeDetail: "",
          Header: "",
          Templates: "",
          TempName: "",
          editorValue: "",
          saveType: "Save",
        }));
      } else {
        notify(response?.message, "danger");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getDischargeAdmitList();
    getHeaderList();
  }, []);
  console.log(data);
  return (
    <>
      <Heading title={t("IVF Discharge Summary")} />

      <div className="row p-2">
        <ReactSelect
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id="AdmitDischargeDetail"
          name="AdmitDischargeDetail"
          value={payload?.AdmitDischargeDetail}
          placeholderName={t("Admit Discharge Detail")}
          handleChange={handleReactSelect}
          dynamicOptions={AdmitList?.map((ele) => ({
            label: ele?.Detail,
            value: ele?.ID,
          }))}
        />

        <ReactSelect
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id="Header"
          name="Header"
          value={payload?.Header}
          placeholderName={t("Header")}
          handleChange={handleReactSelect}
          dynamicOptions={HeaderList?.map((ele) => ({
            label: ele?.HeaderName,
            value: ele?.Header_Id,
          }))}
        />

        <ReactSelect
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id="Templates"
          name="Templates"
          value={payload?.Templates}
          placeholderName={t("Templates")}
          handleChange={handleReactSelect}
          dynamicOptions={TemplateList?.map((ele) => ({
            label: ele?.Temp_Name,
            value: ele?.Template_Value,
          }))}
        />
      </div>

      <div className="p-2">
        <h6 className="fw-bold">{t("Write Note")}</h6>

        <FullTextEditor
          value={payload?.editorValue}
          setValue={(value) =>
            setPayload((prev) => ({ ...prev, editorValue: value }))
          }
          EditTable={payload?.EditTable}
          setEditTable={(value) =>
            setPayload((prev) => ({ ...prev, EditTable: value }))
          }
          clear={payload?.clear}
        />
      </div>

      <div className="row p-2">
        <div className="col-sm-8">
          <button className="btn btn-lg btn-success" onClick={handleSave}>
            {payload?.saveType === "Update" ? t("Update") : t("Save")}{t("onClick=")}
            {handleSave}
          </button>

          <button
            className="btn btn-md btn-success ml-2"
            onClick={handleRowPrint}
            // onClick={hanldleprint}
          >
            {t("Print All Summary")}
          </button>
        </div>

        <ReactSelect
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          id="RadioType"
          name="RadioType"
          value={payload?.RadioType}
          placeholderName={t("Type")}
          handleChange={handleReactSelect}
          dynamicOptions={[
            { label: t("Update"), value: "Update" },
            { label: t("New"), value: "New" },
            { label: t("Nothing"), value: "Nothing" },
          ]}
        />

        <Input
          type="text"
          className="form-control"
          id="TempName"
          name="TempName"
          value={payload?.TempName}
          onChange={handleChange}
          lable={t("Temp. Name")}
          placeholder=" "
          disabled={payload?.RadioType === "Nothing"}
          respclass="col-xl-2 col-md-3 col-sm-4 col-12"
          showTooltipCount={true}
        />
      </div>

      <Heading title={t("Records")} />

      <Tables
        thead={[
          { name: "S.N", width: "1%" },
          { name: t("Header Name"), width: "10%" },
          { name: t("Admit Discharge Details"), width: "10%" },
          { name: t("Prepared By"), width: "10%" },
          { name: t("Prepared Date Time"), width: "10%" },
          { name: t("Edit"), width: "2%" },
          { name: t("Print"), width: "2%" },
        ]}
        tbody={tableData?.map((ele, index) => ({
          SrNo: index + 1,
          HeaderName: ele?.HeaderName,
          Admitdetails: ele?.Admitdetails,
          CreatedBy: ele?.CreatedBy,
          CreatedDateTime: ele?.CreatedDateTime,
          Edit: (
            <i
              className="fa fa-edit"
              aria-hidden="true"
              onClick={() => handleEdit(ele)}
            ></i>
          ),
          Print: (
            <div onClick={() => handleRowPrint(ele)}>
              <ReprintSVG />
            </div>
          ),
        }))}
      />
    </>
  );
};

export default IVFDischargeSummary;
