/**
 * Left panel "Blocks" tab: ready groups of elements (letterhead, patient header,
 * vitals, Rx, lab results, GST / VAT…) and the team's own saved blocks. Drag one
 * onto a band, or click to add it to the selected band. "Linked" inserts it as
 * a section that remembers the block and can be updated from the library later.
 */
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import * as api from "../../../networkServices/printBuilderApi";
import { BUILTIN_BLOCKS, blockElements, blockFromElements, blockSection, parseSavedBlocks } from "../model/blocks";
import { resolveLayout } from "../engine/printEngine";
import { bandName, roundMm } from "../model/defaults";
import { findEl, useDesigner } from "../model/useDesigner";
import { TextInput, Toggle } from "../ui/fields";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";
import { pbConfirm } from "../ui/confirm";

let SAVED = null;
/** The team's saved blocks (cached for the session; `reload` refreshes). */
export function useSavedBlocks() {
  const [list, setList] = useState(SAVED || []);
  const reload = async () => {
    if (!api.pbBlocks) return;
    const r = await api.pbBlocks();
    if (r?.success) {
      SAVED = parseSavedBlocks(r.data);
      setList(SAVED);
    }
  };
  useEffect(() => {
    if (!SAVED) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [list, reload];
}

/** A block by code, built-in or saved. */
export async function findBlock(code) {
  const b = BUILTIN_BLOCKS.find((x) => x.code === code);
  if (b) return b;
  if (!SAVED && api.pbBlocks) {
    const r = await api.pbBlocks();
    if (r?.success) SAVED = parseSavedBlocks(r.data);
  }
  return (SAVED || []).find((x) => x.code === code) || null;
}

export default function BlocksPanel({ onStatus }) {
  const d = useDesigner();
  const { tpl, band, sel } = d.state;
  const [saved, reload] = useSavedBlocks();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [linked, setLinked] = useState(true);
  const [saving, setSaving] = useState(null);
  const all = useMemo(() => [...saved, ...BUILTIN_BLOCKS], [saved]);
  const cats = useMemo(() => Array.from(new Set(all.map((b) => b.category))), [all]);
  const shown = all.filter((b) => (!cat || b.category === cat) && (!q || `${b.name} ${b.description} ${b.category}`.toLowerCase().includes(q.toLowerCase())));

  const add = (b) => {
    const target = tpl.bands.find((x) => x.id === band) || tpl.bands.find((x) => x.type === "reportHeader") || tpl.bands[0];
    if (!target) return;
    // an empty section takes the block at its top edge, as it was saved
    const y = roundMm(target.elements.length ? Math.max(...target.elements.map((e) => e.y + e.h)) + 1 : 0);
    const dw = resolveLayout(tpl).designWidth;
    if (linked) d.addElement(target.id, blockSection(b, 0, y, dw));
    else {
      const els = blockElements(b, 0, y, dw);
      d.update((t) => {
        const tb = t.bands.find((x) => x.id === target.id);
        tb.elements.push(...els);
        const bottom = Math.max(...els.map((e) => e.y + e.h));
        if (bottom > tb.height) tb.height = roundMm(bottom + 1);
      }, null, { sel: els.map((e) => e.id), band: target.id });
    }
    onStatus?.(`${b.name} added`);
  };

  const selectedEls = sel.map((id) => findEl(tpl, id)).filter(Boolean).map((f) => f.el);
  // nothing picked but a section is: the whole section (its elements, its height) becomes the block
  const bandObj = !selectedEls.length && band ? tpl.bands.find((b) => b.id === band) : null;
  const source = selectedEls.length ? selectedEls : bandObj?.elements || [];
  const sourceName = bandObj ? bandName(bandObj, tpl.bands) : null;
  const openSave = () =>
    setSaving({
      name: bandObj?.name || (sourceName?.auto ? sourceName.title.replace(/\s\d+$/, "") : sourceName && sourceName.summary !== "Empty" ? sourceName.summary.replace(/[:…]+$/, "").trim() : ""),
      category: bandObj ? (bandObj.type === "pageFooter" || bandObj.type === "reportFooter" ? "Footer" : "Header") : "",
      description: bandObj ? `Whole "${sourceName.title}" section` : "",
    });

  // "Save as block" from the section settings panel lands here
  useEffect(() => {
    const go = () => source.length && api.pbSaveBlock && openSave();
    window.addEventListener("pbx:save-block", go);
    return () => window.removeEventListener("pbx:save-block", go);
  });

  return (
    <div className="pbx-blocks">
      <div className="pbx-blocks-top">
        <TextInput value={q} onChange={setQ} placeholder="Search blocks…" className="pbx-search" />
        <Toggle value={linked} onChange={setLinked} label="Linked" />
      </div>
      <div className="pbx-chips is-tight">
        <Tap className={`pbx-filter${!cat ? " is-active" : ""}`} onClick={() => setCat("")}>
          All
        </Tap>
        {cats.map((c) => (
          <Tap key={c} className={`pbx-filter${cat === c ? " is-active" : ""}`} onClick={() => setCat(cat === c ? "" : c)}>
            {c}
          </Tap>
        ))}
      </div>
      <ul className="pbx-blocklist">
        {shown.map((b) => (
          <li key={b.code}>
            <Tap
              className={`pbx-blockcard tone-${b.tone || "violet"}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/x-pb-block", JSON.stringify({ code: b.code, linked }));
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => add(b)}
              title={`${b.description || ""}\nDrag onto a band, or click to add to the selected band`}
            >
              <span className="pbx-blockcard-icon">
                <Icon name={b.icon || "puzzle"} size={17} />
              </span>
              <span className="pbx-blockcard-body">
                <b>{b.name}</b>
                <small>{b.description}</small>
                <em>
                  {b.category} · {+Number(b.width).toFixed(0)} × {+Number(b.height).toFixed(0)} mm{b.saved ? " · saved" : ""}
                </em>
              </span>
              {b.saved && api.pbDeleteBlock && (
                <Tap
                  className="is-icon pbx-blockcard-del"
                  tone="danger"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!(await pbConfirm({ title: "Delete this block?", message: "It disappears from the Blocks list for everyone. Templates that already use it keep their copy.", detail: `${b.name} · ${b.category}`, confirmLabel: "Delete block" }))) return;
                    const r = await api.pbDeleteBlock(b.code);
                    if (r?.success) reload();
                    else toast.error(r?.message || "Delete failed");
                  }}
                  title="Delete this saved block"
                >
                  <Icon name="trash" size={11} />
                </Tap>
              )}
            </Tap>
          </li>
        ))}
        {!shown.length && <li className="pbx-muted pbx-pad">No blocks match.</li>}
      </ul>
      <div className="pbx-blocks-save">
        {saving ? (
          <div className="pbx-blocks-form">
            <TextInput value={saving.name} onChange={(v) => setSaving({ ...saving, name: v })} placeholder="Block name" />
            <TextInput value={saving.category} onChange={(v) => setSaving({ ...saving, category: v })} placeholder="Category (Header, Clinical…)" />
            <TextInput value={saving.description} onChange={(v) => setSaving({ ...saving, description: v })} placeholder="What it is for" />
            <span className="pbx-inline">
              <Tap
                tone="primary"
                className="is-small"
                disabled={!saving.name.trim()}
                onClick={async () => {
                  const def = blockFromElements(source, bandObj, { width: resolveLayout(tpl).designWidth, theme: tpl.theme });
                  const code = saving.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "BLOCK";
                  const r = await api.pbSaveBlock({ code, name: saving.name.trim(), category: saving.category || "Saved", description: saving.description, width: def.width, height: def.height, elements: JSON.stringify(def.elements) });
                  if (r?.success) {
                    toast.success(`Block ${saving.name} saved — every template can use it`);
                    setSaving(null);
                    reload();
                  } else toast.error(r?.message || "Could not save the block");
                }}
              >
                Save block
              </Tap>
              <Tap tone="list" className="is-small" onClick={() => setSaving(null)}>
                Cancel
              </Tap>
            </span>
          </div>
        ) : (
          <Tap
            tone="add"
            disabled={!source.length || !api.pbSaveBlock}
            onClick={openSave}
            title={
              selectedEls.length
                ? "Save the selected elements as a block every template can use"
                : bandObj
                  ? `Save the whole "${sourceName.title}" section (${source.length} items) as a block`
                  : "Select elements on the page, or click a section label, first"
            }
          >
            <Icon name="puzzle" size={13} />{" "}
            {selectedEls.length
              ? `Save selection as block (${selectedEls.length})`
              : bandObj && source.length
                ? `Save “${sourceName.title}” as block (${source.length})`
                : "Save selection as block"}
          </Tap>
        )}
      </div>
    </div>
  );
}
