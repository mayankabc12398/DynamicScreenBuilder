import React, { useEffect, useState } from "react";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import DatePicker from "../formComponent/DatePicker";
import {
  NursingWardPatientDocumentDetail,
  NursingWardSaveViewUploadDocument,
} from "../../networkServices/nursingWardAPI";
import moment from "moment";
import Tables from "../UI/customTable";
import Modal from "../modalComponent/Modal";
import {
  getBase64,
  notify,
  NursingPatientTableDataModifiedDocument,
} from "../../utils/utils";

// Only these file types are allowed for patient document uploads.
const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];
const FILE_ACCEPT = ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";
const MAX_FILE_SIZE_MB = 10;

const UploadPatientDocuments = ({ data }) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();
  const [tableData, setTableData] = useState([]);
  const { transactionID, patientID } = data;

  // Documents are loaded from the patient's admit date till today by default.
  const getAdmitDate = () => {
    const admit = moment(data?.admitDate, [
      "DD-MMM-YYYY hh:mm A",
      "DD-MMM-YYYY",
      "YYYY-MM-DD HH:mm:ss",
      "YYYY-MM-DD",
      moment.ISO_8601,
    ]);
    return admit.isValid() ? admit.toDate() : new Date();
  };

  const [payload, setPayload] = useState({
    fromDate: new Date(),
    date: new Date(),
    uploadDate: new Date(),
  });

  // Bumped after every successful save so the (uncontrolled) file inputs
  // remount and clear the previously selected filename.
  const [resetKey, setResetKey] = useState(0);

  // View popup state: holds the form name and the list of uploaded documents.
  const [viewModal, setViewModal] = useState({
    show: false,
    name: "",
    documents: [],
  });

  const THEAD = [
    t("SNo"),
    t("Upload Date"),
    t("Form Name"),
    t("Choose File"),
    t("Remarks"),
    t("View"),
  ];

  // Merge rows that share the same Form Name into a single row so a document
  // that was uploaded more than once does not appear as duplicate rows. Each
  // merged row keeps every already-uploaded document in `Documents`, while the
  // file input / remark drive a *new* pending upload only.
  const groupDocumentsByName = (rows = []) => {
    const map = new Map();

    rows?.forEach((row) => {
      const key = String(row?.Name ?? "")
        .trim()
        .toLowerCase();
      const hasDocument = !!row?.DocumentData;
      const document = hasDocument
        ? {
            id: row?.ID,
            documentData: row?.DocumentData,
            imageName: row?.ImageName,
            remark: row?.Remark,
            documentDate: row?.DocumentDate,
          }
        : null;

      if (map.has(key)) {
        const group = map.get(key);
        if (document) group.Documents.push(document);
        if (!group.DocumentDate && row?.DocumentDate) {
          group.DocumentDate = row.DocumentDate;
        }
        // A row without a document is the master/placeholder row; its ID is the
        // form master id we must send when uploading a fresh document.
        if (!hasDocument && row?.ID !== undefined && row?.ID !== null) {
          group.ID = row.ID;
        }
      } else {
        map.set(key, {
          ID: row?.ID,
          Name: row?.Name,
          Remark: "",
          DocumentDate: hasDocument ? row?.DocumentDate ?? "" : "",
          Documents: document ? [document] : [],
          // Pending new upload (empty until the user chooses a file).
          DocumentData: "",
          ImageName: "",
          IsNewUpload: false,
        });
      }
    });

    return Array.from(map.values());
  };

  const handleNursingWardPatientDocumentDetail = async (
    transactionID,
    DocumentDate,
    FromDate = payload?.fromDate
  ) => {
    if (moment(FromDate).isAfter(moment(DocumentDate), "day")) {
      notify(t("From Date can not be greater than To Date."), "error");
      return;
    }
    try {
      const responseData = await NursingWardPatientDocumentDetail(
        transactionID,
        moment(DocumentDate).format("YYYY-MM-DD"),
        moment(FromDate).format("YYYY-MM-DD")
      );

      const reponseModified = await NursingPatientTableDataModifiedDocument(
        responseData?.data
      );

      setTableData(groupDocumentsByName(reponseModified));
    } catch (error) {
      console.log(error, "SomeThing Went Wrong");
    }
  };
  const ip = localStorage.getItem("ip");

  const handleNursingWardSaveViewUploadDocument = async () => {
    try {
      // Only send rows where the user picked a NEW file in this session.
      // Previously uploaded documents already loaded from the server must NOT
      // be re-sent, otherwise the backend inserts them again (duplicate rows).
      const newUploads = tableData?.filter(
        (row) => row?.IsNewUpload && row?.DocumentData
      );

      if (!newUploads?.length) {
        notify(t("Please select at least one document to upload."), "warn");
        return;
      }

      // Back date upload is allowed only between admit date and today.
      const uploadDay = moment(payload?.uploadDate);
      if (
        !uploadDay.isValid() ||
        uploadDay.isBefore(moment(getAdmitDate()), "day") ||
        uploadDay.isAfter(moment(), "day")
      ) {
        notify(
          t("Date of Reporting must be between Admit Date and Today."),
          "error"
        );
        return;
      }

      const documents = newUploads.map((item) => ({
        masterID: String(item?.ID ?? ""),
        name: String(item?.Name ?? ""),
        fileName: String(item?.ImageName || item?.Name || ""),
        remark: String(item?.Remark ?? ""),
        file: item?.DocumentData?.includes(",")
          ? item.DocumentData.split(",")[1]
          : item?.DocumentData,
      }));

      const apiResponse = await NursingWardSaveViewUploadDocument({
        transactionID: String(transactionID),
        uploadDate: String(moment(payload?.uploadDate).format("YYYY-MM-DD")),
        ipAddress: ip,
        documents,
      });

      if (apiResponse?.success) {
        notify(apiResponse?.message, "success");
        // Clear the file inputs so the saved files are not shown as pending
        // (and cannot be uploaded again on the next save).
        setResetKey((prev) => prev + 1);
        // Widen From Date so a back dated upload is visible in the list, then
        // Date of Reporting goes back to today after every upload.
        const fromDate = moment(payload?.uploadDate).isBefore(
          moment(payload?.fromDate),
          "day"
        )
          ? payload?.uploadDate
          : payload?.fromDate;
        setPayload((prev) => ({ ...prev, fromDate, uploadDate: new Date() }));
        handleNursingWardPatientDocumentDetail(
          transactionID,
          payload?.date,
          fromDate
        );
      } else {
        notify(apiResponse?.message, "error");
      }
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  const validateFile = (file) => {
    const extension = String(file?.name ?? "").split(".").pop()?.toLowerCase();
    const isValidType =
      ALLOWED_EXTENSIONS.includes(extension) ||
      ALLOWED_MIME_TYPES.includes(file?.type);

    if (!isValidType) {
      notify(t("Only PDF, PNG, JPG and JPEG files are allowed."), "error");
      return false;
    }

    if (file?.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      notify(
        t("File size must not exceed {{size}} MB.", { size: MAX_FILE_SIZE_MB }),
        "error"
      );
      return false;
    }

    return true;
  };

  const handleImage = async (e, index) => {
    const { files } = e.target;
    const selectedFile = files?.[0];
    if (!selectedFile) return;

    if (!validateFile(selectedFile)) {
      e.target.value = "";
      return;
    }

    const base64 = await getBase64(selectedFile);
    const data = [...tableData];
    data[index].DocumentData = base64.split(",")[1];
    data[index].ImageName = selectedFile.name;
    data[index].IsNewUpload = true;
    setTableData(data);
  };

  const handleRemarkChange = (index, newRemark) => {
    const updatedData = [...tableData];
    updatedData[index].Remark = newRemark ?? "";
    setTableData(updatedData);
  };

  const getMimeType = (base64Data) => {
    const base64 = base64Data?.includes(",")
      ? base64Data.split(",")[1]
      : base64Data;
    if (!base64) return "";
    if (base64.startsWith("JVBERi0")) return "application/pdf";
    if (base64.startsWith("/9j/")) return "image/jpeg";
    if (base64.startsWith("iVBORw0KGgo")) return "image/png";
    if (base64.startsWith("UEsDB"))
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return "";
  };

  // Build a { src, mimeType } data-uri from stored base64.
  const buildDocumentSource = (base64Data) => {
    if (!base64Data) return null;
    const mimeType = getMimeType(base64Data);
    if (!mimeType) return null;
    const cleanBase64 = base64Data.includes(",")
      ? base64Data.split(",")[1]
      : base64Data;
    return { src: `data:${mimeType};base64,${cleanBase64}`, mimeType };
  };

  const handleDownloadDocument = (document) => {
    const built = buildDocumentSource(document?.documentData);
    if (!built) {
      notify(t("Unable to download this file."), "error");
      return;
    }
    const extension =
      built.mimeType === "application/pdf"
        ? "pdf"
        : built.mimeType.split("/")[1] || "file";
    const link = window.document.createElement("a");
    link.href = built.src;
    link.download =
      document?.imageName || `${viewModal?.name || "document"}.${extension}`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const renderDocumentPreview = (document) => {
    const built = buildDocumentSource(document?.documentData);
    if (!built) {
      return (
        <div className="text-danger p-2">
          {t("Unsupported or missing file.")}
        </div>
      );
    }
    if (built.mimeType.startsWith("image/")) {
      return (
        <img
          src={built.src}
          alt={t("Document")}
          className="img-fluid"
          style={{ maxHeight: "70vh", width: "100%", objectFit: "contain" }}
        />
      );
    }
    if (built.mimeType === "application/pdf") {
      return (
        <iframe
          title={t("Document")}
          src={built.src}
          style={{ width: "100%", height: "70vh", border: "none" }}
        />
      );
    }
    // e.g. legacy .docx documents – no inline preview, offer download instead.
    return (
      <div className="text-center p-3">
        {t("Preview is not available for this file type. Please download it.")}
      </div>
    );
  };

  const handleViewDocument = (row) => {
    const documents = [...(row?.Documents || [])];

    // Include the not-yet-saved selection so the user can preview it too.
    if (row?.IsNewUpload && row?.DocumentData) {
      documents.push({
        id: "pending",
        documentData: row.DocumentData,
        imageName: row.ImageName,
        remark: row.Remark,
        documentDate: t("Not saved yet"),
      });
    }

    if (!documents.length) {
      notify(t("No document uploaded yet."), "warn");
      return;
    }

    setViewModal({
      show: true,
      name: row?.Name || t("Document"),
      documents,
    });
  };

  const closeViewModal = () =>
    setViewModal({ show: false, name: "", documents: [] });

  const uploadedChipStyle = {
    display: "inline-block",
    marginTop: "4px",
    padding: "1px 8px",
    borderRadius: "10px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#fff",
    backgroundColor: "#2e7d32",
  };
  const pendingChipStyle = { ...uploadedChipStyle, backgroundColor: "#1565c0" };

  const handletableChange = (rows) => {
    return rows?.map((items, index) => {
      const { Name, DocumentDate, Documents, IsNewUpload } = items;
      const uploadedCount = Documents?.length || 0;
      const hasUploaded = uploadedCount > 0;
      return {
        "S.NO": index + 1,
        DocumentDate: DocumentDate ? DocumentDate : "",
        Name: Name ? Name : "",
        ImageName: (
          <div>
            <input
              key={`file-${index}-${resetKey}`}
              type="file"
              name="DocumentData"
              accept={FILE_ACCEPT}
              onChange={(e) => handleImage(e, index)}
            />
            {IsNewUpload ? (
              <div>
                <span style={pendingChipStyle}>{t("New file selected")}</span>
              </div>
            ) : hasUploaded ? (
              <div>
                <span style={uploadedChipStyle}>
                  {t("Uploaded")}
                  {uploadedCount > 1 ? ` (${uploadedCount})` : ""}
                </span>
              </div>
            ) : null}
          </div>
        ),
        Remark: (
          <input
            key={index}
            className="form-control"
            value={items.Remark || ""}
            onChange={(e) => handleRemarkChange(index, e.target.value)}
          />
        ),
        Visible: (
          <span
            className="pointer-cursor"
            style={{ color: "#1565c0", cursor: "pointer" }}
            onClick={() => handleViewDocument(items)}
          >
            {t("View")}
          </span>
        ),
      };
    });
  };

  useEffect(() => {
    handleNursingWardPatientDocumentDetail(transactionID, payload?.date);
  }, []);

  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("Upload Patient Documents")} isBreadcrumb={false} />

          <div className="row p-2">
            <DatePicker
              className="custom-calendar"
              id="fromDate"
              name="fromDate"
              lable={t("FromDate")}
              value={payload?.fromDate}
              minDate={moment(getAdmitDate()).startOf("day").toDate()}
              maxDate={new Date()}
              handleChange={(e) =>
                setPayload((prev) => ({ ...prev, fromDate: e.target.value }))
              }
              placeholder={VITE_DATE_FORMAT}
              respclass={"col-xl-2 col-md-4 col-sm-4 col-12"}
            />
            <DatePicker
              className="custom-calendar"
              id="toDate"
              name="toDate"
              lable={t("ToDate")}
              value={payload?.date}
              minDate={moment(getAdmitDate()).startOf("day").toDate()}
              maxDate={new Date()}
              handleChange={(e) =>
                setPayload((prev) => ({ ...prev, date: e.target.value }))
              }
              placeholder={VITE_DATE_FORMAT}
              respclass={"col-xl-2 col-md-4 col-sm-4 col-12"}
            />
            <div className="col-xl-2 col-md-4 col-sm-4 col-12">
              <button
                className="btn btn-sm btn-primary"
                onClick={() =>
                  handleNursingWardPatientDocumentDetail(
                    transactionID,
                    payload?.date,
                    payload?.fromDate
                  )
                }
              >
                {t("Search")}
              </button>
            </div>

            <div className="col-12">
              <Tables thead={THEAD} tbody={handletableChange(tableData)} />
            </div>

            <div className="col-12 mt-2">
              <div className="d-flex justify-content-end">
                <DatePicker
                  className="custom-calendar"
                  id="reportingDate"
                  name="reportingDate"
                  placeholder={VITE_DATE_FORMAT}
                  lable={t("Date of Reporting")}
                  value={payload?.uploadDate}
                  minDate={moment(getAdmitDate()).startOf("day").toDate()}
                  maxDate={new Date()}
                  handleChange={(e) =>
                    setPayload((prev) => ({ ...prev, uploadDate: e.target.value }))
                  }
                />

                <div className="mx-2">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={handleNursingWardSaveViewUploadDocument}
                  >
                    {t("Upload")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewModal.show && (
        <Modal
          visible={viewModal.show}
          setVisible={closeViewModal}
          modalWidth="70vw"
          Header={`${viewModal.name} - ${t("Uploaded Document")}${
            viewModal.documents.length > 1 ? "s" : ""
          }`}
          footer={<></>}
        >
          <div className="row">
            {viewModal.documents.map((document, i) => (
              <div className="col-12 mb-4" key={document?.id ?? i}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <strong>
                    {viewModal.documents.length > 1 ? `${i + 1}. ` : ""}
                    {viewModal.name}
                    {document?.documentDate ? ` (${document.documentDate})` : ""}
                  </strong>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handleDownloadDocument(document)}
                  >
                    {t("Download")}
                  </button>
                </div>
                {renderDocumentPreview(document)}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
};

export default UploadPatientDocuments;
