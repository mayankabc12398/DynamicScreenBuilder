import React, { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { useTranslation } from "react-i18next";
import { SiGooglegemini } from "react-icons/si";
import { notify } from "../../utils/utils";
import { transcribeHandwriting } from "./dischargeAi";
import { sanitizeHtml } from "./dischargeClinicalRecord";

const MAX_MB = 15;

/**
 * Discharge summary > "Scan hand-written": the doctor photographs or uploads the paper summary, the AI types it out,
 * the doctor corrects the text in place, and it is added to the summary editor.
 */
export default function DischargeScanModal({ visible, onHide, onBind }) {
  const [t] = useTranslation();
  const [files, setFiles] = useState([]); // [{ file, url }]
  const [busy, setBusy] = useState(false);
  const [html, setHtml] = useState("");
  const editRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!visible) { setFiles((f) => { f.forEach((x) => URL.revokeObjectURL(x.url)); return []; }); setHtml(""); }
  }, [visible]);

  // The editable result is set from state only when the AI returns, so typing never fights React.
  useEffect(() => { if (editRef.current) editRef.current.innerHTML = html; }, [html]);

  const pick = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    const ok = picked.filter((f) => {
      if (!/^image\//.test(f.type) && f.type !== "application/pdf") { notify(`${f.name}: ${t("only images or a PDF can be read")}`, "error"); return false; }
      if (f.size > MAX_MB * 1024 * 1024) { notify(`${f.name}: ${t("larger than")} ${MAX_MB} MB`, "error"); return false; }
      return true;
    });
    setFiles((prev) => [...prev, ...ok.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  };

  const remove = (i) => setFiles((prev) => { URL.revokeObjectURL(prev[i].url); return prev.filter((_, k) => k !== i); });

  const read = async () => {
    if (!files.length) { notify(t("Add a photo or PDF of the hand-written summary first"), "error"); return; }
    setBusy(true);
    try {
      // One call per page, in the order added, so a long summary keeps its order.
      const pages = [];
      for (const { file } of files) pages.push(await transcribeHandwriting(file));
      setHtml(pages.join("<hr/>"));
    } catch (e) {
      notify(e?.message || t("Unable to read the hand-written summary"), "error");
    } finally {
      setBusy(false);
    }
  };

  const bind = () => {
    const edited = sanitizeHtml(editRef.current?.innerHTML || "").trim();
    if (!edited) { notify(t("Nothing to add yet"), "error"); return; }
    onBind(`<h3>${t("Hand-written discharge summary (scanned)")}</h3>${edited}`);
    onHide();
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={t("Scan hand-written discharge summary")}
      style={{ width: "min(1100px, 96vw)" }}
      contentStyle={{ maxHeight: "74vh" }}
      footer={(
        <div className="d-flex justify-content-end">
          <button type="button" className="btn btn-sm btn-secondary mr-2" onClick={onHide}>{t("Close")}</button>
          <button type="button" className="btn btn-sm btn-success" onClick={bind} disabled={busy || !html}>{t("Add to summary")}</button>
        </div>
      )}
    >
      <div className="row">
        <div className="col-lg-5 col-12">
          <input ref={inputRef} type="file" accept="image/*,application/pdf" multiple capture="environment" onChange={pick} style={{ display: "none" }} />
          <button type="button" className="btn btn-sm btn-primary mb-2" onClick={() => inputRef.current?.click()}>
            <i className="fa fa-camera mr-1" /> {t("Scan or choose photo / PDF")}
          </button>
          <div style={{ fontSize: 11, color: "#666" }}>{t("Add every page in order. Keep the page flat, well lit and fully in the picture.")}</div>
          {files.map((x, i) => (
            <div key={x.url} className="d-flex align-items-start mt-2" style={{ border: "1px solid #d6dde6", borderRadius: 6, padding: 4 }}>
              {x.file.type === "application/pdf"
                ? <div style={{ width: 90, textAlign: "center" }}><i className="fa fa-file-pdf-o fa-3x" /></div>
                : <img src={x.url} alt={`${t("Page")} ${i + 1}`} style={{ width: 90, maxHeight: 120, objectFit: "contain" }} />}
              <div className="ml-2" style={{ flex: 1, minWidth: 0, fontSize: 12, overflowWrap: "anywhere" }}>{`${t("Page")} ${i + 1}: ${x.file.name}`}</div>
              <button type="button" className="btn btn-sm btn-link text-danger" onClick={() => remove(i)} aria-label={t("Remove")}><i className="fa fa-trash" /></button>
            </div>
          ))}
          <button type="button" className="btn btn-sm mt-3 w-100" style={{ backgroundColor: "#6236ec", color: "white" }} onClick={read} disabled={busy || !files.length}>
            <SiGooglegemini /> {busy ? `${t("Reading")}...` : t("Convert to text with AI")}
          </button>
        </div>
        <div className="col-lg-7 col-12">
          <div style={{ fontWeight: 600 }}>{t("Typed text (you can correct it here)")}</div>
          <div
            ref={editRef}
            contentEditable={!busy}
            suppressContentEditableWarning
            style={{ minHeight: 320, maxHeight: "52vh", overflow: "auto", border: "1px solid #d6dde6", borderRadius: 6, padding: 10, fontSize: 14, background: "#fff" }}
          />
          <div style={{ fontSize: 11, color: "#666" }}>{t("Words the AI could not read are marked [illegible]. Check drug names, doses and values before approving.")}</div>
        </div>
      </div>
    </Dialog>
  );
}
