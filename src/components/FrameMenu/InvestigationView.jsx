import React, { useEffect, useState } from "react";
import Heading from "../UI/Heading";
import ColorCodingSearch from "../commonComponents/ColorCodingSearch";
import ReactSelect from "../formComponent/ReactSelect";
import { handleReactSelectDropDownOptions, notify } from "../../utils/utils";
import { INVESTIGATION_VIEW } from "../../utils/constant";
import Tables from "../UI/customTable";
import DatePicker from "../formComponent/DatePicker";
import { BindInvestigationViewList } from "../../networkServices/Emergency";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { FaPaperclip } from "react-icons/fa6";
import AddReportResultLab from "../../pages/ResultEntry/AddReportResultLab";
import Modal from "../modalComponent/Modal";
import AddFileResultLab from "../../pages/ResultEntry/AddFileResultLab";
import { RedirectURL } from "../../networkServices/PDFURL";
import { BindLabReport } from "../../networkServices/resultEntry";
import { translateOptions } from "@components/WrapTranslate";
import { labLabel } from "../../utils/labNoLabel";
import { useSelector } from "react-redux";

export default function InvestigationView({ data }) {
  const [values, setValues] = useState({
    Type: { value: "ALL" },
    fromDate: data?.admitDate,
    toDate: new Date(),
  });
  const [tBody, setTBody] = useState([]);
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const ip = localStorage.getItem("ip");
  const isMobile = window.innerWidth <= 800;
  const [selectedRows, setSelectedRows] = useState([]);

  /* IsInvestigationViewApprovedOnly
     ------------------------------
     On hone par report approve hone se pehle na kholi ja sakti hai aur na
     print ke liye chuni ja sakti hai - View Reports aur row ka checkbox,
     dono band rehte hain.

     Site-wise hai: jis site par ye resource on nahi hai wahan sab pehle jaisa
     chalta rahega, isliye kisi chalu site par kuch nahi badlega.

     Attachment aur Document jaan-bujh kar khule rakhe gaye hain - wo alag se
     upload ki gayi file hain, report ke approve hone se unka koi sambandh
     nahi. */
  const { GetGlobalResources } = useSelector((state) => state?.CommonSlice);
  const approvedOnly =
    String(
      (Array.isArray(GetGlobalResources) ? GetGlobalResources : []).find(
        (item) => item?.Name === "IsInvestigationViewApprovedOnly",
      )?.Value ?? "",
    ) === "1";

  /* API do jagah approve hona batata hai - Status='A' aur Approved='APPROVED'.
     Dono dekh liye jaate hain, taaki kisi ek ke khaali aane par bhi sahi
     jawab mile. */
  const isApproved = (row) =>
    String(row?.Status ?? "") === "A" ||
    String(row?.Approved ?? "").toUpperCase() === "APPROVED";

  // Flag off ho to har row chalegi - purana vyavhaar.
  const canUse = (row) => !approvedOnly || isApproved(row);

  const handleChangeCheckboxHeader = (e) => {
    const checked = e.target.checked;

    // Header wala tick sirf un rows par lagta hai jo khul sakti hain.
    const updatedData = tBody.map((item) => ({
      ...item,
      isChecked: checked && canUse(item),
    }));

    setTBody(updatedData);

    if (checked) {
      setSelectedRows(updatedData.filter((item) => item.isChecked));
    } else {
      setSelectedRows([]);
    }
  };
  const handleRowCheckbox = (item, index) => {
    if (!canUse(item)) return;

    const updatedData = [...tBody];

    updatedData[index] = {
      ...updatedData[index],
      isChecked: !updatedData[index].isChecked,
    };

    setTBody(updatedData);

    const updatedSelected = updatedData.filter((row) => row.isChecked);
    setSelectedRows(updatedSelected);
  };
  const thead = [
    {
      width: "1%",
      name: !isMobile ? (
        <input
          type="checkbox"
          style={{ marginLeft: "3px" }}
          checked={
            tBody.filter(canUse).length > 0 &&
            selectedRows.length === tBody.filter(canUse).length
          }
          disabled={tBody.filter(canUse).length === 0}
          onChange={handleChangeCheckboxHeader}
        />
      ) : (
        "Check"
      ),
    },
    { name: t("Delta Check") },
    t("Date"),
    t("Type"),
    t(labLabel("Barcode No")),
    t("Department"),
    t("Investigations"),
    t("Pacs Images"),
    t("OutSource Lab Name"),
    t("View Reports"),
    t("View Attachment"),
    t("View Document"),
  ];

  const hanldeSelect = async (name, value) => {
    setValues((val) => ({ ...val, [name]: value }));
  };

  const InvestigationViewList = async (status) => {
    // let payload = {
    //     "pid": "AM24-07270001",
    //     "status": "",
    //     "fromDate": "2024-09-18",
    //     "toDate": "2024-11-21",
    //     "labDepartmentType": "ALL"
    // }
    let payload = {
      pid: data?.PatientID ?? data?.patientID,
      status: status,
      fromDate: moment(values?.fromDate).format("yyyy-MM-DD"),
      toDate: moment(values?.toDate).format("yyyy-MM-DD"),
      labDepartmentType: String(values?.Type?.value),
    };

    let apiResp = await BindInvestigationViewList(payload);
    if (apiResp?.success) {
      let tableList = apiResp?.data?.map((val) => {
        val.isChecked = false;
        return val;
      });
      setTBody(tableList);
    } else {
      setTBody([]);
      notify(apiResp?.message, "error");
    }
  };
  useEffect(() => {
    InvestigationViewList("");
  }, [data?.admitDate]);

  const getRowClass = (val, index) => {
    let data = tBody[index];
    // Critical result sabse upar - status ka colour isse overwrite nahi karega.
    if (Number(data?.IsCritical) === 1) {
      return "CriticalResult";
    }
    if (data?.OutSourceLab) {
      return "color-indicator-35-bg";
    }
    if (data?.Status === "SN") {
      return "statusEmergency";
    }
    if (data?.Status === "RN") {
      return "statusIsPaid";
    }
    if (data?.Status === "SC") {
      return "statusDocOut";
    }
    if (data?.Status === "NA") {
      return "CreditPanelLimitOver";
    }
    if (data?.Status === "A") {
      return "LightGreen";
    }
  };
  const [handleModelData, setHandleModelData] = useState({});
  const handleOpenDocument = (val) => {
    setHandleModelData({
      label: t("AddFile"),
      buttonName: t("Upload"),
      width: "40vw",
      isOpen: true,
      Component: (
        <AddReportResultLab
          handleChangeModel={() => { }}
          patientDetail={data}
          bindTestLab={[]}
          pdata={val}
          removeUpload={true}
        // fileData={fileData}
        />
      ),
      // handleInsertAPI: saveDocument,
      extrabutton: <></>,
      footer: <></>,
    });
  };
  const handleOpenAttachment = async (val) => {
    const RecPayload = {
      testID: val?.Test_ID,
      // isOnlinePrint is the Print Lab Header switch: only "1" prints the
      // letterhead, anything else (an empty string included) swaps it for a
      // blank white image. This screen has no header dropdown, so it asks for
      // the letterhead outright - the report used to come out headerless.
      isOnlinePrint: "1",
      isConversion: 0,
      isNabl: 0,
      orderBy: "",
      labType: val?.ReportType,
      ipAddress: ip,
      isPrev: false,
    };

    try {
      const apiResp = await BindLabReport(RecPayload);

      if (apiResp?.success) {
        RedirectURL(apiResp?.data);
      } else {
        notify(t("No records found"), "error");
      }
    } catch (error) {
      notify(t("An error occurred while fetching data"), "error");
    }
  };
  const hanldePrintBulkReport = async (val) => {
    const testIDs = selectedRows.map((r) => String(r.Test_ID)).join(",");
    const labTypes = selectedRows.map((r) => String(r.ReportType)).join(",");
    const RecPayload = {
      testID: testIDs,
      // Letterhead on this print too - see handleOpenAttachment above.
      isOnlinePrint: "1",
      isConversion: 0,
      isNabl: 0,
      orderBy: "",
      labType: labTypes,
      ipAddress: ip,
      isPrev: false,
    };

    try {
      const apiResp = await BindLabReport(RecPayload);

      if (apiResp?.success) {
        RedirectURL(apiResp?.data);
      } else {
        notify(t("No records found"), "error");
      }
    } catch (error) {
      notify(t("An error occurred while fetching data"), "error");
    }
  };

  const handleAddFile = (val, index = 0) => {
    setHandleModelData({
      label: t("AddFile"),
      buttonName: t("upload"),
      width: "40vw",
      height: "40vh",
      isOpen: true,
      Component: (
        <AddFileResultLab
          handleChangeModel={() => { }}
          patientDetail={data}
          val={{ ...val, PName: data?.pName, PatientID: data?.patientID }}
          removeUpload={true}
        />
      ),
      extrabutton: <></>,
      footer: <></>,
    });
  };
  return (
    <>
      {handleModelData?.isOpen && (
        <Modal
          visible={handleModelData?.isOpen}
          setVisible={() => {
            setHandleModelData({ isOpen: false });
          }}
          modalWidth={handleModelData?.width}
          Header={t(handleModelData?.label)}
          buttonType={"button"}
          buttons={handleModelData?.extrabutton}
          buttonName={handleModelData?.buttonName}
          // modalData={modalData}
          // setModalData={setModalData}
          footer={handleModelData?.footer}
          handleAPI={handleModelData?.handleInsertAPI}
        >
          {/* //uguiguiguiguig */}
          {handleModelData?.Component}
        </Modal>
      )}
      <div className="card patient_registration border mt-2">
        <div className="card card_background">
          <Heading
              title={t("Investigation Filter")} />
          <div className="row p-2">
            <ReactSelect
              placeholderName={t("Type")}
              className="form-control"
              id={"Type"}
              name="Type"
              removeIsClearable={true}
              dynamicOptions={translateOptions(INVESTIGATION_VIEW, t)}
              searchable={true}
              respclass="col-xl-2 col-md-4 col-sm-6 col-12"
              requiredClassName={"required-fields"}
              value={values?.Type?.value}
              handleChange={(name, value) => {
                hanldeSelect(name, value);
              }}
            />

            <DatePicker
              className="custom-calendar"
              id="fromDate"
              name="fromDate"
              lable={t("FromDate")}
              value={moment(values?.fromDate).toDate()}
              handleChange={(e) => {
                hanldeSelect("fromDate", e.target.value);
              }}
              placeholder={VITE_DATE_FORMAT}
              respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
            />
            <DatePicker
              className="custom-calendar"
              id="toDate"
              name="toDate"
              value={moment(values?.toDate).toDate()}
              handleChange={(e) => {
                hanldeSelect("toDate", e.target.value);
              }}
              lable={t("ToDate")}
              placeholder={VITE_DATE_FORMAT}
              respclass={"col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"}
            />

            <div className=" col-sm-2 col-xl-2">
              <button
                className="btn btn-sm btn-success"
                type="button"
                onClick={() => {
                  InvestigationViewList("");
                }}
              >
                {t("Search")}
              </button>
              {tBody.length > 0 && (
                <button
                  className="btn btn-sm btn-success mx-2"
                  type="button"
                  onClick={() => {
                    hanldePrintBulkReport();
                  }}
                >
                  {t("Print")}
                </button>
              )}
            </div>
          </div>

          <div className="">
           
               <Heading
            title={<div>{t("InvestigationResult")}</div>}
            secondTitle={
              <>
                <ColorCodingSearch
                  label={t("Test Prescribed")}
                  color="#f5f3b2"
                  onClick={() => {
                    InvestigationViewList("SN");
                  }}
                  cursor="pointer"
                />
                <ColorCodingSearch
                  label={t("Sample Collected")}
                  color="#f5c6f7"
                  onClick={() => {
                    InvestigationViewList("RN");
                  }}
                  cursor="pointer"
                />
                <ColorCodingSearch
                  label={t("Department Received")}
                  color="#c6eea7"
                  onClick={() => {
                    InvestigationViewList("SC");
                  }}
                  cursor="pointer"
                />
                <ColorCodingSearch
                  label={t("Not Approved")}
                  color="#ffbfbf"
                  onClick={() => {
                    InvestigationViewList("NA");
                  }}
                  cursor="pointer"
                />
                <ColorCodingSearch
                  label={t("Approved")}
                  color="LightGreen"
                  onClick={() => {
                    InvestigationViewList("A");
                  }}
                  cursor="pointer"
                />
                <ColorCodingSearch
                  label={t("Critical")}
                  color="#ff6b6b"
                  onClick={() => {
                    InvestigationViewList("CRITICAL");
                  }}
                  cursor="pointer"
                />
                <ColorCodingSearch
                  label={t("Outsourced")}
                  color="rgb(0, 255, 255)"
                  /* onClick={() => {
                    InvestigationViewList("A");
                  }} */
                  cursor="pointer"
                />
              </>
            }
          />
            <Tables
              isSearch={true}
              scrollView={"scrollView"}
              thead={thead}
              tbody={tBody?.map((item, index) => ({
                Sno: (
                  <input
                    type="checkbox"
                    checked={item?.isChecked || false}
                    disabled={!canUse(item)}
                    title={
                      canUse(item) ? undefined : "Report approve nahi hui hai"
                    }
                    onChange={() => handleRowCheckbox(item, index)}
                  />
                ),
                DeltaCheck: " ",
                Date: item?.DATE,
                Type: item?.Type,
                BarcodeNo: item?.BarcodeNo,
                Department: item?.Department,
                Name:
                  // <div className="" style={{
                  //   cursor: "pointer",
                  //   width: "250px",
                  //   whiteSpace: "normal",
                  //   wordBreak: "break-word",
                  //   overflowWrap: "break-word",
                  // }} titel={item?.Name}>
                    item?.Name,
                   
                PacsImages: " ",
                OutSourceLab: item?.OutSourceLab,
                "View Reports": canUse(item) ? (
                  <span onClick={() => handleOpenAttachment(item)}>
                    <FaPaperclip />
                  </span>
                ) : (
                  /* Approve hone se pehle report nahi khulti - icon dikhta hai
                     par bujha hua, aur click par kuch nahi hota. */
                  <span
                    style={{ opacity: 0.35, cursor: "not-allowed" }}
                    title="Report approve nahi hui hai"
                  >
                    <FaPaperclip />
                  </span>
                ),
                "View Attachment": (
                  <div
                    onClick={() => handleOpenDocument(item)}
                  // onClick={() => {
                  //   handleAddFile(val, index);
                  // }}
                  >
                    {" "}
                    <FaPaperclip />
                  </div>
                ),
                "View Document": (
                  <div
                    onClick={() => {
                      handleAddFile(item, index);
                    }}
                  >
                    {" "}
                    <FaPaperclip />
                  </div>
                ),
              }))}
              getRowClass={getRowClass}
            />
          </div>
        </div>
      </div>
    </>
  );
}
