import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";
import { setSharedFile } from "./DigitalFileStore";
import { useTranslation } from "react-i18next";
pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();
 
const ACCEPT = "application/pdf,image/*";
 
const DigitalFormMaster = () => {
  const [t] = useTranslation();
  const inputRef = useRef(null);
  const previewRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  // Opened either as a frame-menu child or as a route. The IPD and Emergency
  // menus pass the patient as `data`, the OPD menu as `patientDetail`.
  const routeData = location.state?.data || location.state || {};
  const frameData = data && Object.keys(data).length > 0 ? data : patientDetail;
  const patientData = frameData && Object.keys(frameData).length > 0 ? frameData : routeData;
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const txnId = useMemo(
    () => resolveTransactionId({ ...(location.state || {}), ...patientData }, location.search, { useShared: false }),
    [patientData, location.state, location.search]
  );

  // Hand the id to the editor, which is a separate route and so loses the
  // frame-menu props the upload page was rendered with. Cleared when this
  // patient has none, so the editor never saves under the previous patient.
  useEffect(() => {
    setSharedTransactionId(txnId);
  }, [txnId]);
 
  const renderPreview = async (f) => {
    const cv = previewRef.current;
    if (!cv) return;
    if (f.type.startsWith("image/")) {
      await new Promise((res) => {
        const img = new Image();
        img.onload = () => {
          cv.width = img.naturalWidth;
          cv.height = img.naturalHeight;
          cv.getContext("2d").drawImage(img, 0, 0);
          URL.revokeObjectURL(img.src);
          res();
        };
        img.src = URL.createObjectURL(f);
      });
    } else {
      const pdf = await pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise;
      const page = await pdf.getPage(1);
      const vp = page.getViewport({ scale: 1.5 });
      cv.width = vp.width;
      cv.height = vp.height;
      await page.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
    }
  };
 
  const handleFile = async (f) => {
    if (!f) return;
    const isImg = f.type.startsWith("image/");
    const isPdf = f.type === "application/pdf";
    if (!isImg && !isPdf) { alert(t("Only PDF or image files are allowed.")); return; }
    setLoading(true);
    try {
      setFile(f);
      setSharedFile(f);             
      await renderPreview(f);
    } catch (err) {
      console.error(err);
      alert("Could not load file: " + err.message);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };
 
  return (
    <div className="d-flex flex-column" style={{ height: "100vh", background: "#fff" }}>
      <div className="d-flex align-items-center px-3 py-2 border-bottom">
        <span className="fw-semibold">{t("Digital Form Master")}</span>
      </div>
 
      <div className="d-flex align-items-center gap-2 px-3 py-2 border-bottom">
        <button className="btn btn-sm btn-success mx-1 p-2 border-0" style={{ background: "#0d6efd" }}
          onClick={() => inputRef.current?.click()}>{t("Upload PDF / Image")}</button>
        <input ref={inputRef} type="file" accept={ACCEPT} className="d-none"
          onChange={(e) => handleFile(e.target.files?.[0])} />
 
        {file && (
  <button
    className="btn btn-sm btn-success mx-1 p-2 border-0"
    onClick={() =>
      navigate(
        txnId ? `/edit-form-page?transactionId=${encodeURIComponent(txnId)}` : "/edit-form-page",
        { state: { data: patientData, transactionID: txnId } }
      )
    }
  >
    {t("Edit")}
  </button>
)}
      </div>
 
      <div className="flex-grow-1 overflow-auto p-3" style={{ background: "#f1f5f9", position: "relative" }}>
        {loading && (
          <div className="position-absolute top-50 start-50 translate-middle text-muted">{t("Loading…")}</div>
        )}
        {!file && !loading && (
          <div className="text-center text-muted py-5">{t("Upload a PDF or image to preview.")}</div>
        )}
        <div style={{ display: file ? "block" : "none", textAlign: "center" }}>
          <canvas ref={previewRef} style={{ maxWidth: "100%", height: "auto", border: "1px solid #ddd" }} />
        </div>
      </div>
    </div>
  );
};
 
export default DigitalFormMaster;