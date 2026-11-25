import React, { useRef, useState, useEffect } from "react";
import moment from "moment";
import { GetPatientDocumentUploadHistory } from "../../networkServices/DoctorApi";
import { APIBaseURL } from "../../networkServices/axiosInstance";
import { useTranslation } from "react-i18next";
import Modal from "../modalComponent/Modal";
import { notify } from "../../utils/utils";

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  teal50: "#e8f7f4", teal100: "#c0ebe3", teal400: "#1aaa8c", teal600: "#0e7a65",
  blue50: "#eaf2fb", blue100: "#bcd8f4", blue400: "#3b8fd9", blue600: "#1e6cb5",
  amber50: "#fff8eb", amber100: "#fde8b3", amber400: "#f5a623", amber600: "#c47d0a",
  red50: "#fff0f0", red100: "#ffc7c7", red400: "#e84040", red600: "#b52020",
  green50: "#edfaf2", green100: "#b6edcc", green400: "#22c55e", green600: "#15803d",
  purple50: "#f3f0ff", purple100: "#d4c8fc", purple400: "#8b5cf6", purple600: "#6d28d9",
  gray50: "#f8f9fa", gray100: "#f1f3f5", gray200: "#e9ecef", gray300: "#dee2e6",
  gray400: "#ced4da", gray500: "#adb5bd", gray600: "#6c757d", gray700: "#495057",
  gray800: "#343a40", gray900: "#212529", bg: "#f4f6f9",
};

const getDocumentUrl = (filePath) => {
  if (!filePath) return "";
  const cleanPath = filePath.replace(/\\/g, "/");
  const index = cleanPath.toLowerCase().indexOf("/documents/");
  if (index !== -1) {
    const relativeUrl = cleanPath.substring(index);
    let base = APIBaseURL || "";
    if (base.endsWith("/api/v1")) {
      base = base.replace(/\/api\/v1$/, "");
    } else if (base.endsWith("/api")) {
      base = base.replace(/\/api$/, "");
    }
    if (base.endsWith("/")) {
      base = base.slice(0, -1);
    }
    return `${base}${relativeUrl}`;
  }
  return filePath;
};

const DocumentCarousel = ({ group, getDocumentUrl, setDocPreview, C, uploadDate, onDropDocument }) => {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  const rawDocs = group.documents || group.Documents || [];
  let parsedDocs = [];
  try {
    parsedDocs = typeof rawDocs === "string" ? JSON.parse(rawDocs) : rawDocs || [];
  } catch (e) {
    console.error("Failed to parse documents for date:", uploadDate, e);
  }

  if (parsedDocs.length === 0) return null;

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 5);
      setShowRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener("resize", checkScrollButtons);
    return () => window.removeEventListener("resize", checkScrollButtons);
  }, [parsedDocs]);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScrollButtons, 350);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => {
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        try {
          const dataStr = e.dataTransfer.getData("text/plain");
          if (dataStr) {
            const { doc, sourceDate } = JSON.parse(dataStr);
            if (moment(sourceDate).format("YYYY-MM-DD") !== moment(uploadDate).format("YYYY-MM-DD")) {
              onDropDocument(doc, sourceDate, uploadDate);
            }
          }
        } catch (err) {
          console.error("Drop failed:", err);
        }
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        position: "relative",
        padding: "10px",
        borderRadius: "14px",
        background: isDragOver ? "rgba(26, 170, 140, 0.06)" : "transparent",
        border: isDragOver ? `2px dashed ${C.teal400}` : "2px dashed transparent",
        transition: "all 0.25s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ fontSize: "12px", fontWeight: "600", color: C.teal600, background: C.teal50, padding: "3px 10px", borderRadius: "12px" }}>
          {moment(uploadDate).format("DD-MMM-YYYY")}
        </div>
        <div style={{ flex: 1, height: "1px", background: C.gray200 }} />
      </div>

      <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
        {showLeft && (
          <button
            onClick={() => handleScroll("left")}
            style={{
              position: "absolute",
              left: "4px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.95)",
              border: `1px solid ${C.gray300}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.15s, background-color 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-50%) scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(-50%) scale(1)"}
          >
            <i className="fas fa-chevron-left" style={{ color: C.gray700, fontSize: "14px" }} />
          </button>
        )}

        {showRight && (
          <button
            onClick={() => handleScroll("right")}
            style={{
              position: "absolute",
              right: "4px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.95)",
              border: `1px solid ${C.gray300}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.15s, background-color 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-50%) scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(-50%) scale(1)"}
          >
            <i className="fas fa-chevron-right" style={{ color: C.gray700, fontSize: "14px" }} />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScrollButtons}
          style={{
            display: "flex",
            gap: "14px",
            overflowX: "auto",
            scrollBehavior: "smooth",
            padding: "8px 4px 12px 4px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="hide-scrollbar"
        >
          {parsedDocs.map((doc, docIdx) => {
            const docName = doc.documentName || doc.DocumentName || doc.fileName || "Unnamed Document";
            const docID = doc.documentID || doc.DocumentID || "";

            let docSrc = "";
            if (doc.base64) {
              docSrc = doc.base64;
            } else {
              docSrc = getDocumentUrl(doc.Url || doc.url);
            }

            const isPdf = (doc.Url || doc.url || doc.fileName || "").toLowerCase().endsWith(".pdf") ||
              (doc.base64 && (doc.base64.startsWith("data:application/pdf") || doc.base64.startsWith("JVBERi0")));

            const displayTime = (doc.UploadDate || doc.uploadDate) ? moment(doc.UploadDate || doc.uploadDate).format("hh:mm A") : "";

            return (
              <div
                key={docIdx}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", JSON.stringify({ doc, sourceDate: uploadDate }));
                  e.currentTarget.style.opacity = "0.5";
                }}
                onDragEnd={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "12px",
                  border: `1px solid ${C.gray200}`,
                  background: "#fff",
                  overflow: "hidden",
                  transition: "transform 0.2s, box-shadow 0.2s, opacity 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  minWidth: "280px",
                  width: "280px",
                  flexShrink: 0,
                  cursor: "grab",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                }}
              >
                <div style={{
                  height: "120px",
                  background: C.gray50,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderBottom: `1px solid ${C.gray200}`,
                  position: "relative",
                  overflow: "hidden"
                }}>
                  {isPdf ? (
                    <div style={{ textAlign: "center" }}>
                      <i className="fas fa-file-pdf" style={{ fontSize: "40px", color: C.red400 }} />
                      <div style={{ fontSize: "11px", color: C.gray500, marginTop: "6px" }}>PDF Document</div>
                    </div>
                  ) : docSrc ? (
                    <img
                      src={docSrc}
                      alt={docName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        if (e.currentTarget.nextSibling) {
                          e.currentTarget.nextSibling.style.display = "flex";
                        }
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      display: (!isPdf && docSrc) ? "none" : "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <i className="far fa-file-image" style={{ fontSize: "40px", color: C.blue400 }} />
                    <div style={{ fontSize: "11px", color: C.gray500, marginTop: "6px" }}>Image Document</div>
                  </div>

                  {displayTime && (
                    <span style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      fontSize: "9px",
                      fontWeight: "600",
                      color: C.teal600,
                      background: C.teal50,
                      padding: "2px 6px",
                      borderRadius: "8px",
                      border: `1px solid ${C.teal100}`
                    }}>
                      {displayTime}
                    </span>
                  )}
                </div>

                <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: C.gray800, minHeight: "34px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.3 }}>
                    {docName}
                  </span>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", borderTop: `1px solid ${C.gray100}`, paddingTop: "8px" }}>
                    <span style={{ fontSize: "10px", color: C.gray500, fontFamily: "monospace" }}>
                      ID: {docID}
                    </span>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => setDocPreview?.({ name: docName, url: docSrc })}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: C.teal50,
                          color: C.teal600,
                          border: `1px solid ${C.teal100}`,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        <i className="fas fa-eye" /> View
                      </button>

                      <button
                        onClick={() => {
                          const link = window.document.createElement("a");
                          link.href = docSrc;
                          link.download = docName || "document";
                          link.target = "_blank";
                          window.document.body.appendChild(link);
                          link.click();
                          window.document.body.removeChild(link);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: C.blue50,
                          color: C.blue600,
                          border: `1px solid ${C.blue100}`,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        <i className="fas fa-download" /> Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const DateWiseDocument = ({ patientId, setDocPreview }) => {
  const [t] = useTranslation();
  const [uploadHistory, setUploadHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);
  const [docPreviewLocal, setDocPreviewLocal] = useState(null);

  const handleSetDocPreview = (val) => {
    setDocPreviewLocal(val);
    if (typeof setDocPreview === "function") {
      setDocPreview(val);
    }
  };

  const handleDropDocument = (draggedDoc, sourceDate, targetDate) => {
    const updatedHistory = uploadHistory.map((group) => {
      const groupDate = group.uploadDate || group.UploadDate;
      const rawDocs = group.documents || group.Documents || [];
      let parsedDocs = [];
      try {
        parsedDocs = typeof rawDocs === "string" ? JSON.parse(rawDocs) : rawDocs || [];
      } catch (e) {
        parsedDocs = [];
      }

      if (moment(groupDate).isSame(moment(sourceDate), "day")) {
        const filteredDocs = parsedDocs.filter((doc) => {
          const docId = doc.documentID || doc.DocumentID || doc.fileName || doc.DocumentName;
          const draggedId = draggedDoc.documentID || draggedDoc.DocumentID || draggedDoc.fileName || draggedDoc.DocumentName;
          return String(docId) !== String(draggedId);
        });
        return {
          ...group,
          documents: filteredDocs,
          totalDocuments: filteredDocs.length,
          TotalDocuments: filteredDocs.length,
        };
      }

      if (moment(groupDate).isSame(moment(targetDate), "day")) {
        const updatedDoc = {
          ...draggedDoc,
          UploadDate: moment(targetDate).format("YYYY-MM-DD HH:mm:ss"),
          uploadDate: moment(targetDate).format("YYYY-MM-DD HH:mm:ss"),
        };
        const newDocs = [...parsedDocs, updatedDoc];
        return {
          ...group,
          documents: newDocs,
          totalDocuments: newDocs.length,
          TotalDocuments: newDocs.length,
        };
      }

      return group;
    });

    setUploadHistory(updatedHistory);
    notify?.(
      `Document "${draggedDoc.documentName || draggedDoc.DocumentName || "Document"}" moved to ${moment(targetDate).format("DD-MMM-YYYY")}`,
      "success"
    );
  };

  useEffect(() => {
    const ViewDocumentsDatewise =
      localStorage.getItem("ViewDocumentsDatewise") ||
      localStorage.getItem("Datewisedocument") ||
      localStorage.getItem("DateWiseDocument") ||
      localStorage.getItem("datewisedocument") ||
      "0";

    setVisibleCount(3);

    if (!patientId || Number(ViewDocumentsDatewise) !== 1) {
      setUploadHistory([]);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await GetPatientDocumentUploadHistory(patientId);
        if (res?.success && res?.data?.dateWiseDocuments) {
          setUploadHistory(res.data.dateWiseDocuments);
        } else {
          setUploadHistory([]);
        }
      } catch (error) {
        console.error("Error fetching patient document upload history:", error);
        setUploadHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [patientId]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
        <i className="fas fa-spinner fa-spin" style={{ color: C.teal600, fontSize: "24px" }} />
      </div>
    );
  }

  if (!uploadHistory || uploadHistory.length === 0) {
    return null;
  }

  return (
    <div style={{ background: "#fff", borderRadius: "16px", padding: "16px 20px", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.gray200}` }}>
      {/* Style injection to hide scrollbars */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: 28, height: 28, borderRadius: "8px", background: C.teal50, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="fas fa-history" style={{ color: C.teal600, fontSize: "12px" }} />
          </div>
          <span style={{ fontSize: "13px", fontWeight: "600", color: C.gray800 }}>Document Upload History</span>
        </div>
        <span style={{ fontSize: "11px", color: C.gray500, background: C.gray100, padding: "2px 8px", borderRadius: "10px" }}>
          {uploadHistory.reduce((acc, curr) => acc + (curr.totalDocuments || curr.TotalDocuments || 0), 0)} Total Documents
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {uploadHistory.slice(0, visibleCount).map((group, groupIdx) => {
          const uploadDate = group.uploadDate || group.UploadDate;
          return (
            <DocumentCarousel
              key={groupIdx}
              group={group}
              getDocumentUrl={getDocumentUrl}
              setDocPreview={handleSetDocPreview}
              C={C}
              uploadDate={uploadDate}
              onDropDocument={handleDropDocument}
            />
          );
        })}
      </div>

      {uploadHistory.length > visibleCount && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
          <button
            onClick={() => setVisibleCount((prev) => prev + 3)}
            style={{
              padding: "8px 24px",
              background: C.teal50,
              color: C.teal600,
              border: `1px solid ${C.teal100}`,
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.teal100;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.teal50;
            }}
          >
            View More
          </button>
        </div>
      )}

      {docPreviewLocal && (
        <Modal
          visible={true}
          setVisible={() => handleSetDocPreview(null)}
          modalWidth="60vw"
          Header={docPreviewLocal?.name || t("Document")}
          footer={<></>}
        >
          <div style={{ textAlign: "center", padding: "8px" }}>
            {docPreviewLocal?.url ? (
              (docPreviewLocal.url.toLowerCase().endsWith(".pdf") ||
                docPreviewLocal.url.startsWith("data:application/pdf") ||
                docPreviewLocal.url.startsWith("JVBERi0")) ? (
                <iframe
                  title={docPreviewLocal?.name}
                  src={docPreviewLocal.url}
                  style={{ width: "100%", height: "70vh", border: "none" }}
                />
              ) : (
                <img
                  src={docPreviewLocal.url}
                  alt={docPreviewLocal?.name}
                  style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "8px" }}
                />
              )
            ) : docPreviewLocal?.image ? (
              <img
                src={docPreviewLocal.image}
                alt={docPreviewLocal?.name}
                style={{ maxWidth: "100%", height: "auto", borderRadius: "8px" }}
              />
            ) : (
              <div style={{ color: "#6c757d", padding: "24px" }}>
                {t("No preview available")}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DateWiseDocument;
