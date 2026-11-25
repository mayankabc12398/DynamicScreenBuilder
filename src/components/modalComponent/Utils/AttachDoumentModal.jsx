import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import moment from "moment";
import nurse from "../../../assets/image/nurse.png";
import { useDispatch, useSelector } from "react-redux";
import {
  GetPanelDocument,
  GetPatientUploadDocument,
} from "../../../store/reducers/common/CommonExportFunction";
import Modal from "../Modal";
import BrowseButton from "../../formComponent/BrowseButton";
import Button from "../../formComponent/Button";
import { useTranslation } from "react-i18next";
import DatePicker from "../../formComponent/DatePicker";
const { VITE_DATE_FORMAT } = import.meta.env;
const AttachDoumentModal = ({
  isuploadOpen,
  setIsuploadOpen,
  // handleImageChange,
  modelHeader,
  handleAPI,
  documentsViewList,
  values,
  isCalender,
  documentNameHoverText = "document handled through panelDetail use props",
  documentListHoverText = "fix it",
  // 27-10-2026: several files per document type (e.g. all pages of an Insurance Policy Copy). Off = one file, as before.
  allowMultipleFiles = false,
}) => {
  const dispatch = useDispatch();
  const [t] = useTranslation();

  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [preview, setPreview] = useState({});
  // which of the selected document's files is shown (allowMultipleFiles)
  const [previewFileIndex, setPreviewFileIndex] = useState(0);
  const [documentsList, setDocumentsList] = useState();

  const isValidDate = (dateStr) => {
    if (!dateStr) return false;
    if (dateStr instanceof Date) return !isNaN(dateStr.getTime());
    if (typeof dateStr === "string" && dateStr.startsWith("0001-01-01")) return false;
    return !isNaN(Date.parse(dateStr));
  };

  const patientList = async () => {
    let data = await dispatch(GetPatientUploadDocument({ patientID: 88 }));
    if (data?.payload?.success) {
      let respdata = data?.payload?.data;
      if (values?.documentvalue?.length > 0) {
        respdata = respdata?.map((val) => {
          const prevImage = values?.documentvalue?.find(
            (v) => (v?.documentID ?? v?.DocumentID ?? v?.documentId) === val?.DocumentID,
          );
          if (prevImage) {
            // Already on file: shown with its preview; kept in `base64` (not `image`)
            // so saving does not upload the same file again.
            val = {
              ...val,
              base64: prevImage?.base64,
              clearenceForm: isValidDate(prevImage?.expiryDate) ? prevImage?.expiryDate : "",
              isUploaded: true,
            };
          }
          return val;
        });
      }
      setDocumentsList(respdata);
      setPreview(respdata?.[0]);
    }
  };

  useEffect(() => {
    if (documentsViewList?.length > 0) {
      const syncedList = documentsViewList.map((val) => {
        const savedDoc = values?.documentvalue?.find(
          (v) => (v?.documentID ?? v?.DocumentID ?? v?.documentId) === val?.DocumentID
        );
        if (savedDoc) {
          /* Already on file for this patient (e.g. a permanent Aadhaar / PAN / TPA Card carried
             forward from an earlier visit): show it as uploaded with its preview. The file goes in
             `base64`, not `image`, so the save does not upload it again. */
          return {
            ...val,
            isUploaded: true,
            base64: val?.image ? val?.base64 : savedDoc?.base64 || savedDoc?.Base64 || val?.base64,
            // Kept so a saved PDF is recognised as a PDF (the API labels every file image/png).
            fileName: val?.fileName || savedDoc?.FileName || savedDoc?.fileName,
            clearenceForm:
              val?.clearenceForm ||
              (isValidDate(savedDoc?.expiryDate) ? savedDoc?.expiryDate : ""),
          };
        }
        return val;
      });
      setDocumentsList(syncedList);
      setPreview(syncedList[0]);
    } else {
      patientList();
    }
  }, [dispatch, documentsViewList, values?.documentvalue]);

  const handleSelect = (index, value) => {
    setSelectedDocIndex(index);
    setPreview(value);
    setPreviewFileIndex(0);
  };

  // True when this document row has an actual file to show: saved earlier, or attached now.
  // isUploaded alone is not enough - the record can exist while the file is missing on disk.
  const hasDocument = (doc) =>
    Boolean(
      doc?.image ||
        doc?.base64 ||
        doc?.FileBase64 ||
        (Array.isArray(doc?.files) && doc.files.length > 0),
    );

  // Saved for the patient, but the server could not read the file (empty Base64).
  const isFileMissing = (doc) => Boolean(doc?.isUploaded) && !hasDocument(doc);

  const rowColourClass = (doc) =>
    hasDocument(doc) ? "btn-success" : isFileMissing(doc) ? "btn-warning" : "btn-info";

  // allowMultipleFiles: the document's files, kept in `files`; `image` stays the first one so
  // everything that reads `image` keeps working.
  const docFiles = (doc) =>
    Array.isArray(doc?.files) && doc.files.length > 0
      ? doc.files
      : doc?.image
        ? [{ image: doc.image, fileName: doc.fileName, fileType: doc.fileType }]
        : [];

  const setDocFiles = (index, files) => {
    const updatedData = JSON.parse(JSON.stringify(documentsList));
    const first = files[0];
    updatedData[index] = {
      ...updatedData[index],
      files,
      image: first?.image,
      fileName: first?.fileName,
      fileType: first?.fileType,
      isUploaded: false,
    };
    setDocumentsList(updatedData);
    setPreview(updatedData[index]);
  };

  const handleRemoveFile = (fileIndex) => {
    const files = docFiles(documentsList?.[selectedDocIndex]).filter((_, i) => i !== fileIndex);
    setDocFiles(selectedDocIndex, files);
    setPreviewFileIndex(0);
  };

  const handleImageChange = async (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (!file) return;
    const pickedFiles = Array.from(e.target.files || []);
    e.target.value = ""; // the same file can be picked again

    const readFileAsBase64 = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    };

    try {
      const added = await Promise.all(
        (allowMultipleFiles ? pickedFiles : [file]).map(async (f) => ({
          image: await readFileAsBase64(f),
          fileName: f.name,
          fileType: f.type,
        })),
      );
      addFilesToSelectedDoc(added);
    } catch (error) {
      console.error("Error reading file", error);
    }
  };

  /* Puts files (from Browse or the webcam) on the selected document. Several files allowed:
     added to the ones picked so far (an already-saved document starts fresh). One file:
     replaces the document's file. */
  const addFilesToSelectedDoc = (added) => {
    if (!added?.length) return;
    if (selectedDocIndex < 0 || selectedDocIndex >= (documentsList?.length || 0)) return;

    if (allowMultipleFiles) {
      const current = documentsList[selectedDocIndex];
      const files = [...(current?.isUploaded ? [] : docFiles(current)), ...added];
      setDocFiles(selectedDocIndex, files);
      setPreviewFileIndex(files.length - added.length);
      return;
    }

    const updatedData = JSON.parse(JSON.stringify(documentsList));
    updatedData[selectedDocIndex] = {
      ...updatedData[selectedDocIndex],
      image: added[0].image,
      fileName: added[0].fileName,
      fileType: added[0].fileType,
      isUploaded: false,
    };
    setDocumentsList(updatedData);
    setPreview(updatedData[selectedDocIndex]);
  };

  // ── Webcam ────────────────────────────────────────────────────────────────
  // "Webcam" opens the camera in the preview area; "Capture" takes a JPEG and files it on the
  // selected document exactly like a browsed file, so Save uploads it the usual way.
  const webcamRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const handleCapture = () => {
    const shot = webcamRef.current?.getScreenshot();
    if (!shot) {
      setCameraError(t("Could not take a picture. Please try again."));
      return;
    }
    const docName = String(documentsList?.[selectedDocIndex]?.Document || "Document").replace(/[^\w-]+/g, "_");
    addFilesToSelectedDoc([
      { image: shot, fileName: `${docName}_${moment().format("YYYYMMDD_HHmmss")}.jpg`, fileType: "image/jpeg" },
    ]);
    // Several files allowed: keep the camera open for the next page. One file: done.
    if (!allowMultipleFiles) setCameraOpen(false);
  };
  const handleChange = (e, index) => {
    const { name, value } = e.target;
    const updatedList = documentsList.map((doc, idx) => {
      if (idx === index) {
        return {
          ...doc,
          [name]: value,
        };
      }
      return doc;
    });
    setDocumentsList(updatedList);
    if (selectedDocIndex === index) {
      setPreview((val) => ({ ...val, [name]: value }));
    }
  };

  const isPdfDocument = (doc) => {
    const src = doc?.image || doc?.base64 || doc?.FileBase64 || doc?.FileUrl;
    if (!src && !doc?.fileName && !doc?.DocumentName && !doc?.fileType && !doc?.FileType) return false;

    if (typeof src === "string") {
      if (src.startsWith("data:application/pdf")) return true;
      if (src.startsWith("JVBER")) return true;
      // The API prefixes every saved file with image/png, PDFs included.
      if (/^data:[^;]*;base64,JVBER/.test(src)) return true;
      if (src.toLowerCase().endsWith(".pdf") || src.toLowerCase().includes(".pdf?")) return true;
    }
    if (
      doc?.fileType === "application/pdf" ||
      doc?.FileType === "application/pdf" ||
      doc?.fileType === "pdf" ||
      doc?.FileType === "pdf"
    ) {
      return true;
    }
    if (
      doc?.fileName?.toLowerCase()?.endsWith(".pdf") ||
      doc?.DocumentName?.toLowerCase()?.endsWith(".pdf")
    ) {
      return true;
    }
    return false;
  };

  const getPreviewSrc = (doc) => {
    const src = doc?.image || doc?.base64 || doc?.FileBase64 || doc?.FileUrl;
    if (!src || typeof src !== "string") return null;
    // A PDF that came back labelled image/png: relabel it so the iframe can render it.
    if (src.startsWith("data:") && isPdfDocument(doc) && !src.startsWith("data:application/pdf")) {
      return `data:application/pdf;base64,${src.slice(src.indexOf(",") + 1)}`;
    }
    if (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://") || src.startsWith("blob:")) {
      return src;
    }
    if (src.startsWith("JVBER") || isPdfDocument(doc)) {
      return `data:application/pdf;base64,${src}`;
    }
    return `data:image/png;base64,${src}`;
  };

  return (
    <Modal
      visible={isuploadOpen}
      modalData={documentsList}
      handleAPI={handleAPI}
      setVisible={() => {
        // Unmounting the <Webcam> stops the camera stream.
        setCameraOpen(false);
        setIsuploadOpen(false);
      }}
      modalWidth={`70vw`}
      Header={modelHeader}
      buttons={
        <>
          <BrowseButton
            handleImageChange={handleImageChange}
            accept="image/*,application/pdf,.pdf"
            disabled={allowMultipleFiles ? false : preview?.isUploaded}
            multiple={allowMultipleFiles}
          />
          {/* Plain <button>: the shared Button component does not pass `disabled` on. */}
          <button
            type="button"
            className="text-white"
            onClick={() => {
              setCameraError("");
              setCameraOpen((open) => !open);
            }}
            disabled={!cameraOpen && !allowMultipleFiles && preview?.isUploaded}
            title={t("Take a photo of the document with the webcam")}
          >
            <i className={`fa ${cameraOpen ? "fa-times" : "fa-camera"}`} style={{ marginRight: 5 }} />
            {cameraOpen ? t("Close Webcam") : t("Webcam")}
          </button>
          <Button
            name={t("Scan Document")}
            type={"button"}
            className={"text-white"}
            handleClick={() => { }}
            disabled={preview?.isUploaded}
          />
        </>
      }
    >
      <style>{`
        @keyframes smoothSlideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 150px;
          }
        }
        .smooth-datepicker-container {
          animation: smoothSlideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          overflow: visible;
          width: 100%;
        }
      `}</style>
      {/* name, type, className ,handleClick */}
      <div className="row">
        <div className="col-sm-12 col-md-4">
          <div
            title={documentListHoverText}
            style={{
              minHeight: "300px",
              overflow: "scroll",
              borderRight: "3px solid grey",
              padding: "10px",
            }}
          >
            <button
              className="btn btn-sm my-1 btn-warning text-white w-100"
              style={{ background: "green" }}
            >
              {t("Panel Required Document's")}
            </button>
            {documentsList?.map((data, index) => (
              <div
                key={index}
                // While the webcam is open only a click changes the document, so passing the
                // mouse over the list on the way to "Capture" cannot redirect the photo.
                onMouseEnter={() => !cameraOpen && handleSelect(index, data)}
                onClick={() => handleSelect(index, data)}
                style={{ cursor: "pointer" }}
              >
                <div
                  // Green once this document has a file - either already saved for the patient
                  // (isUploaded) or attached in this session and waiting for Save.
                  className={`btn btn-sm my-1 ${rowColourClass(data)} text-white w-100 d-flex align-items-center justify-content-start ${selectedDocIndex === index ? "active-upload-document" : ""
                    }`}
                  title={
                    hasDocument(data)
                      ? t("Document Uploaded")
                      : isFileMissing(data)
                        ? t("Document saved, but its file was not found on the server")
                        : ""
                  }
                >
                  {isCalender && Number(data?.IsExpiryCheck) === 1 ? (
                    <>
                      <i className="fa fa-calendar me-2" aria-hidden="true" />
                      &nbsp;
                      &nbsp;
                      <span title={documentNameHoverText}>{data?.Document}</span>
                    </>
                  ) : (
                    <span title={documentNameHoverText}>{data?.Document}</span>
                  )}
                  {hasDocument(data) && (
                    <i className="fa fa-check-circle ms-auto ml-auto" aria-hidden="true" />
                  )}
                  {isFileMissing(data) && (
                    <i className="fa fa-exclamation-triangle ms-auto ml-auto" aria-hidden="true" />
                  )}
                </div>
                {
                  selectedDocIndex === index && isCalender && Number(data?.IsExpiryCheck) === 1 ? (
                    <div className="smooth-datepicker-container">
                      <DatePicker
                        className="custom-calendar"
                        id="clearenceForm"
                        name="clearenceForm"
                        lable={t("")}
                        placeholder={VITE_DATE_FORMAT}
                        value={isValidDate(data?.clearenceForm) ? new Date(data?.clearenceForm) : null}
                        // maxDate={new Date()}
                        handleChange={(e) => handleChange(e, index)}
                        disable={data?.isUploaded || !(data?.image || data?.base64 || data?.FileBase64)}
                      />
                    </div>
                  ) : ""
                }


              </div>
            ))}
          </div>
        </div>
        <div className="col-sm-12 col-md-8">
          {allowMultipleFiles && docFiles(preview).length > 0 && !preview?.isUploaded && (
            <div className="d-flex flex-wrap mb-2" style={{ gap: 6 }}>
              {docFiles(preview).map((f, fi) => (
                <span
                  key={fi}
                  className={`badge ${fi === previewFileIndex ? "badge-primary" : "badge-secondary"}`}
                  style={{ cursor: "pointer", fontSize: 12, padding: "5px 8px" }}
                  onClick={() => setPreviewFileIndex(fi)}
                  title={f?.fileName}
                >
                  {fi + 1}. {(f?.fileName || t("File")).slice(0, 28)}
                  <i
                    className="fa fa-times ml-2"
                    title={t("Remove")}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleRemoveFile(fi);
                    }}
                  />
                </span>
              ))}
            </div>
          )}
          {/* Webcam: live view in place of the preview. The photo goes on the document
              selected on the left (named here, since hovering the list changes it). */}
          {cameraOpen && (
            <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 8, background: "#000", textAlign: "center" }}>
              <div style={{ color: "#fff", fontSize: 12, marginBottom: 6, textAlign: "left" }}>
                <i className="fa fa-camera" style={{ marginRight: 6 }} />
                {t("Capturing for")}: <b>{documentsList?.[selectedDocIndex]?.Document || "-"}</b>
              </div>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.92}
                forceScreenshotSourceSize
                videoConstraints={{ width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: { ideal: "environment" } }}
                onUserMediaError={() =>
                  setCameraError(t("Webcam not available. Allow camera access in the browser, or check that a camera is connected."))
                }
                style={{ width: "100%", maxHeight: 360, objectFit: "contain", borderRadius: 6 }}
              />
              {cameraError && (
                <div style={{ color: "#ffb4b4", fontSize: 12, marginTop: 6 }}>{cameraError}</div>
              )}
              <div className="d-flex justify-content-center mt-2" style={{ gap: 8 }}>
                <button type="button" className="btn btn-sm btn-success" onClick={handleCapture} disabled={!!cameraError}>
                  <i className="fa fa-camera" style={{ marginRight: 5 }} />
                  {t("Capture")}
                </button>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setCameraOpen(false)}>
                  {t("Close")}
                </button>
              </div>
              {allowMultipleFiles && (
                <div style={{ color: "#bbb", fontSize: 11, marginTop: 6 }}>
                  {t("Each capture is added as a page. Close the webcam to see them.")}
                </div>
              )}
            </div>
          )}
          {!cameraOpen && (() => {
            // allowMultipleFiles: show the file picked in the list above
            const previewDoc =
              allowMultipleFiles && !preview?.isUploaded && docFiles(preview)[previewFileIndex]
                ? { ...preview, ...docFiles(preview)[previewFileIndex] }
                : preview;
            return (
          <div className="w-100">
            {getPreviewSrc(previewDoc) ? (
              isPdfDocument(previewDoc) ? (
                <iframe
                  src={getPreviewSrc(previewDoc)}
                  title="Document Preview"
                  style={{
                    width: "100%",
                    height: "450px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
              ) : (
                <img
                  src={getPreviewSrc(previewDoc)}
                  alt="Preview"
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: "450px",
                    objectFit: "contain",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                />
              )
            ) : (
              <div
                className="d-flex flex-column align-items-center justify-content-center text-muted"
                style={{
                  height: "350px",
                  border: "2px dashed #ccc",
                  borderRadius: "8px",
                  backgroundColor: "#f8f9fa",
                  padding: "20px",
                }}
              >
                <i className="fa fa-file-text-o fa-3x mb-3 text-secondary" style={{ opacity: 0.6 }} />
                {isFileMissing(preview) ? (
                  <>
                    <h5 className="mb-0 text-warning">{t("Document File Not Found")}</h5>
                    <p className="small text-muted mt-1">
                      {t("This document is saved for the patient, but its file could not be read from the server")}
                      {preview?.fileName ? ` (${preview.fileName})` : ""}
                    </p>
                  </>
                ) : (
                  <>
                    <h5 className="mb-0">{t("No Document Available")}</h5>
                    <p className="small text-muted mt-1">{t("Please select a document and upload a file")}</p>
                  </>
                )}
              </div>
            )}
          </div>
            );
          })()}
        </div>
      </div>
    </Modal>
  );
};

export default AttachDoumentModal;
