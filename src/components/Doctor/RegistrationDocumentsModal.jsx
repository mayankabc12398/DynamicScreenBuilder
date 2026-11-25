import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Modal from "../modalComponent/Modal";
import { notify } from "../../utils/utils";
import {
  GetPatientDocument,
  GetPatientPanelDocumentFile,
  GetPatientPanelDocumentVisitWise,
} from "../../store/reducers/common/CommonExportFunction";

const C = {
  green50: "#edfaf2", green100: "#b6edcc", green600: "#15803d",
  amber50: "#fff8eb", amber100: "#fde8b3", amber600: "#c47d0a",
  gray50: "#f8f9fa", gray100: "#f1f3f5", gray200: "#e9ecef",
  gray500: "#adb5bd", gray600: "#6c757d", gray700: "#495057", gray800: "#343a40",
};

const asText = (v) =>
  v === null || v === undefined || typeof v === "object" ? "" : String(v);

const pick = (...vals) => {
  for (const v of vals) {
    const s = asText(v).trim();
    if (s) return s;
  }
  return "";
};

const isPdf = (image) => String(image || "").startsWith("data:application/pdf");

/* makeApiRequest NEVER rethrows: on a failed call it returns the raw axios
   response instead of the API envelope (see networkServices/axiosInstance). So
   `res.success` being absent - not false - is how a failure arrives here, and
   reading only `res?.success ? ... : []` turns a 400 into "nothing uploaded". */
export const readApiResult = (res) => {
  if (res && typeof res.success === "boolean") {
    return { rows: res.success ? res.data || [] : [], message: res.message || "", failed: false };
  }
  if (!res) return { rows: [], message: "No response from the server", failed: true };
  const status = res?.status;
  const message =
    res?.data?.message || res?.data?.Message || res?.statusText || "Request failed";
  return {
    rows: [],
    message: status ? `${status} — ${message}` : String(message),
    failed: true,
  };
};

// A data: URL cannot be opened or saved directly in Chrome (top-level navigation
// to data: is blocked), so it goes through a blob instead.
const dataUrlToBlob = (dataUrl) => {
  const [head, body] = String(dataUrl || "").split(",");
  if (!body) return null;
  const type = (head.match(/data:([^;]+)/) || [])[1] || "application/octet-stream";
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
};

const withBlobUrl = (dataUrl, fn) => {
  const blob = dataUrlToBlob(dataUrl);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  try {
    fn(url);
  } finally {
    // Long enough for the new tab / download to pick the blob up.
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
};

/**
 * Read-only viewer for the documents scanned in at Patient Registration, opened
 * from the View Consultation toolbar so the doctor does not have to leave the EMR:
 *
 *  - Patient documents — the "Upload Patient Document" popup on Personal Details
 *    (PatientControl/GetPatientDocumentUpload returns them with their base64).
 *  - Panel documents  — the "Upload" button on each Scheme Details row
 *    (stored per visit; the scan itself is fetched only when one is opened).
 *
 * @param {object} patient the EMR's current patient (patientDetail.currentPatient)
 */
function RegistrationDocumentsModal({ visible, setVisible, patient }) {
  const [t] = useTranslation();

  const pid = pick(patient?.PatientID, patient?.MRNo, patient?.PID, patient?.pid);
  const patientName = pick(patient?.Pname, patient?.PatientName, patient?.pname);

  const { GetGlobalResources } = useSelector((state) => state?.CommonSlice) || {};
  const globalResourcesList = Array.isArray(GetGlobalResources)
    ? GetGlobalResources
    : GetGlobalResources?.data || [];
  /* Panel scans are only filed per visit when this is on — with it off there is
     nothing stored to show, so the section is hidden rather than left empty. */
  const showVisitWisePanelDocument =
    globalResourcesList?.find(
      (item) => item?.Name === "ShowVisitWisePanelDocument",
    )?.Value === "1";

  const [patientDocs, setPatientDocs] = useState([]);
  const [panelRows, setPanelRows] = useState([]);
  const [selected, setSelected] = useState(null); // { key, name, sub, image }
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  // A call that failed outright, versus the API's own explanation for an empty list.
  const [loadError, setLoadError] = useState("");
  const [apiNote, setApiNote] = useState("");

  useEffect(() => {
    if (!visible || !pid) return undefined;
    let active = true;
    setLoading(true);
    setLoadedOnce(false);
    setPatientDocs([]);
    setPanelRows([]);
    setSelected(null);
    setLoadError("");
    setApiNote("");
    (async () => {
      try {
        const [docRes, panelRes] = await Promise.all([
          GetPatientDocument(pid),
          showVisitWisePanelDocument
            ? GetPatientPanelDocumentVisitWise({ PID: pid })
            : Promise.resolve(null),
        ]);
        if (!active) return;
        /* "No documents found" comes back as success:false - an empty folder, not an
           error - but a 400 arrives as an axios response, which readApiResult tells
           apart from both. */
        const docResult = readApiResult(docRes);
        if (docResult.failed) setLoadError(docResult.message);
        else setApiNote(docResult.rows.length ? "" : docResult.message);

        /* A document whose file could not be read is KEPT, not filtered out. The
           row proves the upload was recorded; an empty Base64 means the API could
           not read the file back - which on this system usually means the file
           lives on the machine the upload was made against, not the one serving
           this request. Dropping it here is what made a recorded document look
           like one that was never uploaded. */
        const docs = docResult.rows.map((d, i) => ({
          key: `pt-${d?.documentID ?? d?.DocumentID ?? i}`,
          name: pick(d?.documentName, d?.DocumentName, d?.fileName, d?.FileName) ||
            t("Document"),
          sub: pick(d?.fileName, d?.FileName),
          image: pick(d?.base64, d?.Base64),
          // The API now says outright whether it could read the file; fall back to
          // "is there content" for a server that predates that.
          available:
            d?.available ?? d?.Available ?? !!pick(d?.base64, d?.Base64),
        }));
        setPatientDocs(docs);

        const panelResult = readApiResult(panelRes);
        setPanelRows(panelResult.rows);
        const firstViewable = docs.find((d) => d.image);
        if (firstViewable) setSelected(firstViewable);
        else if (docs.length) setSelected(docs[0]);
      } catch (e) {
        if (active) notify(t("Failed to load the documents"), "error");
      } finally {
        if (active) {
          setLoading(false);
          setLoadedOnce(true);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [visible, pid, showVisitWisePanelDocument]);

  // Panel rows carry no scan; it is fetched the first time one is opened and
  // then kept, so flipping between documents does not re-hit the API.
  const [panelFiles, setPanelFiles] = useState({});
  const panelKey = (row) =>
    `pn-${row?.transactionID}-${row?.panelID}-${row?.panelDocumentID}`;

  const openPanelDocument = async (row) => {
    const key = panelKey(row);
    const name = pick(row?.documentName) || t("Document");
    const sub = [pick(row?.panelName), pick(row?.visitDateText)]
      .filter(Boolean)
      .join(" · ");
    if (panelFiles[key]) {
      setSelected({ key, name, sub, image: panelFiles[key] });
      return;
    }
    try {
      const res = await GetPatientPanelDocumentFile({
        TransactionID: row?.transactionID,
        PanelID: row?.panelID,
        PanelDocumentID: row?.panelDocumentID,
      });
      const image = pick(res?.data?.base64, res?.data?.Base64);
      if (res?.success && image) {
        setPanelFiles((f) => ({ ...f, [key]: image }));
        setSelected({ key, name, sub, image });
      } else {
        notify(res?.message || t("Document not available"), "error");
      }
    } catch (e) {
      notify(t("Failed to load the document"), "error");
    }
  };

  // One group per visit day, newest first — the same shape the front office sees
  // on Patient Encounter History.
  const visitGroups = useMemo(() => {
    const byDate = new Map();
    panelRows?.forEach((row) => {
      const key = row?.visitDate || "unlinked";
      if (!byDate.has(key)) {
        byDate.set(key, {
          key,
          dateText: pick(row?.visitDateText) || t("Not linked to a visit"),
          rows: [],
        });
      }
      byDate.get(key).rows.push(row);
    });
    return [...byDate.values()];
  }, [panelRows, t]);

  const total = patientDocs.length + panelRows.length;

  const SectionHead = ({ icon, color, bg, title, count }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        padding: "8px 10px",
        background: bg,
        borderRadius: 8,
        marginBottom: 8,
      }}
    >
      <span
        style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color }}
      >
        <i className={icon} style={{ fontSize: 12 }} /> {title}
      </span>
      <span
        style={{
          fontSize: 11,
          color: C.gray600,
          background: "#fff",
          padding: "1px 8px",
          borderRadius: 10,
        }}
      >
        {count}
      </span>
    </div>
  );

  const DocButton = ({ active, name, sub, onClick, color, bg, border }) => (
    <div
      onClick={onClick}
      title={name}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        marginBottom: 6,
        borderRadius: 8,
        cursor: "pointer",
        background: active ? bg : "#fff",
        border: `1px solid ${active ? border : C.gray200}`,
      }}
    >
      <i
        className={isPdf(sub) ? "far fa-file-pdf" : "far fa-file-image"}
        style={{ fontSize: 12, color, flexShrink: 0 }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 12.5,
            fontWeight: 600,
            color: C.gray800,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </span>
        {sub ? (
          <span
            style={{
              display: "block",
              fontSize: 10.5,
              color: C.gray500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {sub}
          </span>
        ) : null}
      </span>
      <i className="fas fa-eye" style={{ fontSize: 11, color, flexShrink: 0 }} />
    </div>
  );

  return (
    <Modal
      visible={visible}
      setVisible={setVisible}
      modalWidth="78vw"
      Header={`${t("Registration Documents")}${patientName ? ` — ${patientName}` : ""}${
        pid ? ` (${pid})` : ""
      }`}
      footer={<></>}
    >
      <div className="row" style={{ margin: 0 }}>
        {/* ── Document list ─────────────────────────────────────────────── */}
        <div
          className="col-sm-12 col-md-4"
          style={{ maxHeight: "62vh", overflowY: "auto", paddingLeft: 0 }}
        >
          <SectionHead
            icon="fas fa-folder-open"
            color={C.green600}
            bg={C.green50}
            title={t("Patient Documents")}
            count={patientDocs.length}
          />
          {patientDocs.length === 0 ? (
            <div style={{ fontSize: 11.5, color: loadError ? C.red : C.gray500, padding: "0 4px 10px" }}>
              {loading
                ? t("Loading...")
                : loadError
                  ? `${t("Could not read the documents")}: ${loadError}`
                  : apiNote || t("Nothing uploaded at registration")}
            </div>
          ) : (
            patientDocs.map((d) => (
              <DocButton
                key={d.key}
                active={selected?.key === d.key}
                name={d.name}
                sub={d.image ? d.sub : t("File not available on this server")}
                onClick={() => setSelected(d)}
                color={d.image ? C.green600 : C.gray500}
                bg={C.green50}
                border={C.green100}
              />
            ))
          )}

          {showVisitWisePanelDocument && (
            <div style={{ marginTop: 12 }}>
              <SectionHead
                icon="fas fa-folder"
                color={C.amber600}
                bg={C.amber50}
                title={t("Panel Documents")}
                count={panelRows.length}
              />
              {visitGroups.length === 0 ? (
                <div style={{ fontSize: 11.5, color: C.gray500, padding: "0 4px" }}>
                  {loading ? t("Loading...") : t("No panel document uploaded")}
                </div>
              ) : (
                visitGroups.map((g) => (
                  <div key={g.key} style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.gray600,
                        margin: "4px 2px 6px",
                      }}
                    >
                      <i className="far fa-calendar mr-1" /> {g.dateText}
                    </div>
                    {g.rows.map((row) => (
                      <DocButton
                        key={panelKey(row)}
                        active={selected?.key === panelKey(row)}
                        name={pick(row?.documentName) || t("Document")}
                        sub={[pick(row?.panelName), pick(row?.uploadedOn)]
                          .filter(Boolean)
                          .join(" · ")}
                        onClick={() => openPanelDocument(row)}
                        color={C.amber600}
                        bg={C.amber50}
                        border={C.amber100}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Preview ───────────────────────────────────────────────────── */}
        <div className="col-sm-12 col-md-8" style={{ paddingRight: 0 }}>
          {selected ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: C.gray800 }}>
                  {selected.name}
                  {selected.sub ? (
                    <span style={{ fontWeight: 400, color: C.gray500 }}>
                      {" "}
                      — {selected.sub}
                    </span>
                  ) : null}
                </span>
                <span style={{ whiteSpace: "nowrap" }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary mr-2"
                    disabled={!selected.image}
                    onClick={() =>
                      withBlobUrl(selected.image, (url) => window.open(url, "_blank"))
                    }
                  >
                    <i className="fas fa-external-link-alt mr-1" /> {t("Open")}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={!selected.image}
                    onClick={() =>
                      withBlobUrl(selected.image, (url) => {
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${selected.name || "document"}${
                          isPdf(selected.image) ? ".pdf" : ".png"
                        }`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      })
                    }
                  >
                    <i className="fas fa-download mr-1" /> {t("Download")}
                  </button>
                </span>
              </div>
              <div
                style={{
                  border: `1px solid ${C.gray200}`,
                  borderRadius: 10,
                  background: C.gray50,
                  height: "58vh",
                  overflow: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {!selected.image ? (
                  <div style={{ textAlign: "center", color: C.gray600, padding: 20 }}>
                    <i className="fas fa-file-circle-exclamation" style={{ fontSize: 26 }} />
                    <div style={{ fontSize: 12.5, marginTop: 8, fontWeight: 600 }}>
                      {t("This document is recorded but its file could not be read")}
                    </div>
                    <div style={{ fontSize: 11.5, marginTop: 6, maxWidth: 420 }}>
                      {t(
                        "The upload is saved against the patient, but the server answering this screen cannot open the file. That usually means the file is stored on the machine the upload was made against.",
                      )}
                    </div>
                    {selected.sub ? (
                      <div style={{ fontSize: 11, marginTop: 6, color: C.gray500 }}>
                        {selected.sub}
                      </div>
                    ) : null}
                  </div>
                ) : isPdf(selected.image) ? (
                  <iframe
                    title={selected.name}
                    src={selected.image}
                    style={{ width: "100%", height: "100%", border: 0 }}
                  />
                ) : (
                  <img
                    src={selected.image}
                    alt={selected.name}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  />
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                height: "58vh",
                border: `1px dashed ${C.gray200}`,
                borderRadius: 10,
                background: C.gray50,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: C.gray500,
              }}
            >
              <i className="fas fa-folder-open" style={{ fontSize: 26 }} />
              <span style={{ fontSize: 12.5 }}>
                {loading
                  ? t("Loading...")
                  : loadedOnce && total === 0
                    ? t("No document was uploaded at registration for this patient")
                    : t("Select a document to view it")}
              </span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default RegistrationDocumentsModal;
