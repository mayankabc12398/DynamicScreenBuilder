/**
 * Right-hand panel. Shows, in order of what is selected:
 *   elements → their content, binding, format, text style, border, behaviour
 *              (several selected → alignment tools + shared style);
 *   a band   → its settings (row set, group by, print on…);
 *   nothing  → the template: datasource, theme, page, watermark.
 */
import React, { useState } from "react";
import { LABEL_STOCKS, SYMBOLOGIES, setNameOf } from "../engine/printEngine";
import { BAND_TYPES, FONT_OPTIONS, FORMAT_TYPES, PRINT_ON, bandHeading, bandMeta, bandName, bandSummary, roundMm, toolMeta } from "../model/defaults";
import { findEl, useDesigner } from "../model/useDesigner";
import { ColorInput, NumberInput, Row, Section, Segmented, Select, TextArea, TextInput, Toggle } from "../ui/fields";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";
import { ChartContent, CrosstabContent, LayoutSection, PoweredBySection, ReprintSection, SecuritySection, SubreportContent } from "./AdvancedEditors";
import { ExprInput, TokenText, fieldList } from "./ExprInput";
import RulesEditor from "./RulesEditor";
import TableEditor from "./TableEditor";

/* ---------------------------------------------------- style presets + painter */

/** Ready text styles; a template adds its own under theme.presets. */
export const BUILTIN_PRESETS = {
  Heading: { fontSize: 13, fontWeight: 700 },
  "Sub-heading": { fontSize: 10.5, fontWeight: 600 },
  Label: { fontSize: 8.5, color: "#4b5563" },
  Value: { fontSize: 9, fontWeight: 600 },
  Amount: { fontSize: 9, fontWeight: 600, align: "right" },
  Total: { fontSize: 10.5, fontWeight: 700, align: "right", padding: 0.8, border: { width: 0.3, style: "solid", color: "#374151", sides: "t" } },
  "Small note": { fontSize: 7, italic: true, color: "#6b7280" },
};

const CLIP_KEY = "pbx.styleClipboard";
/** The copied style (format painter), kept per browser so it pastes into another template too. */
export const styleClipboard = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(CLIP_KEY) || "null");
    } catch {
      return null;
    }
  },
  set(v) {
    try {
      localStorage.setItem(CLIP_KEY, JSON.stringify(v));
    } catch {
      /* private mode: the painter just does nothing */
    }
  },
};

/** Copy an element's look (style + colour rules); paste it onto others. */
export function copyStyleOf(el) {
  styleClipboard.set({ style: el.style || {}, styleRules: el.styleRules });
}
export function pasteStyleTo(d, ids) {
  const clip = styleClipboard.get();
  if (!clip || !ids.length) return false;
  d.updateEls(ids, (x) => {
    x.style = JSON.parse(JSON.stringify(clip.style || {}));
    if (clip.styleRules && x.type !== "table") x.styleRules = JSON.parse(JSON.stringify(clip.styleRules));
  }, `paste:${ids.join(",")}`);
  return true;
}

function StylePresets({ ids, current }) {
  const d = useDesigner();
  const own = d.state.tpl.theme?.presets || {};
  const all = { ...BUILTIN_PRESETS, ...own };
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const apply = (n) =>
    n &&
    d.updateEls(ids, (x) => {
      x.style = { ...(x.style || {}), ...JSON.parse(JSON.stringify(all[n])) };
    }, `preset:${ids.join(",")}`);
  const save = () => {
    const n = name.trim();
    if (!n) return;
    d.update((t) => {
      t.theme = { ...(t.theme || {}), presets: { ...((t.theme && t.theme.presets) || {}), [n]: JSON.parse(JSON.stringify(current || {})) } };
    }, "theme:presets");
    setNaming(false);
    setName("");
  };
  const remove = (n) =>
    d.update((t) => {
      const p = { ...((t.theme && t.theme.presets) || {}) };
      delete p[n];
      t.theme = { ...(t.theme || {}), presets: p };
    }, "theme:presets");
  return (
    <Section title="Style preset">
      <Row label="Apply" wide hint="Applies a ready font, size, weight and colour. Your own presets are saved with the template.">
        <Select value="" onChange={apply} options={Object.keys(all).map((n) => ({ value: n, label: own[n] ? `${n} ★` : n }))} placeholder="Choose a preset…" />
      </Row>
      {naming ? (
        <span className="pbx-inline">
          <TextInput value={name} onChange={setName} placeholder="Preset name" />
          <Tap tone="primary" className="is-small" onClick={save} disabled={!name.trim()}>
            Save
          </Tap>
          <Tap tone="list" className="is-small" onClick={() => setNaming(false)}>
            Cancel
          </Tap>
        </span>
      ) : (
        <span className="pbx-inline">
          <Tap tone="add" className="is-small" onClick={() => setNaming(true)} title="Save this element's look as a preset of this template">
            ＋ Save as preset
          </Tap>
          {Object.keys(own).map((n) => (
            <Tap key={n} tone="list" className="is-small" onClick={() => remove(n)} title={`Remove preset ${n}`}>
              {n} ✕
            </Tap>
          ))}
        </span>
      )}
    </Section>
  );
}

const HEADER_TYPES = ["OPD", "IPD", "Pharmacy", "Laboratory", "Radiology", "Emergency"];
const WEIGHTS = [
  { value: "", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
];

export default function PropertyPanel({ schema, datasources, assets, onUploadAsset, onEditDatasource, onPageSetup, align, sample, onManage, onRefreshBlock }) {
  const d = useDesigner();
  const { tpl, sel, band: bandId, meta } = d.state;
  const found = sel.map((id) => findEl(tpl, id)).filter(Boolean);
  const params = schema?.params || [];

  if (found.length > 1) return <MultiPanel found={found} align={align} />;
  if (found.length === 1) {
    const { el, band } = found[0];
    const detail = tpl.bands.find((b) => b.type === "detail");
    const rowScoped = ["detail", "groupHeader", "groupFooter"].includes(band.type);
    const scopeSet = rowScoped && detail ? setNameOf(detail.dataset) : null;
    const fields = fieldList(schema, scopeSet, params);
    return (
      <ElementPanel
        key={el.id}
        el={el}
        band={band}
        fields={fields}
        schema={schema}
        params={params}
        assets={assets}
        onUploadAsset={onUploadAsset}
        sample={sample}
        selfCode={meta?.code}
        onRefreshBlock={onRefreshBlock}
      />
    );
  }
  const band = tpl.bands.find((b) => b.id === bandId);
  if (band) return <BandPanel key={band.id} band={band} schema={schema} params={params} />;
  return <TemplatePanel tpl={tpl} meta={meta} datasources={datasources} onEditDatasource={onEditDatasource} onPageSetup={onPageSetup} schema={schema} params={params} onManage={onManage} />;
}

/* ===================================================================== */

function PanelHead({ icon, title, sub, children }) {
  return (
    <div className="pbx-panel-head">
      <span className="pbx-panel-icon">
        <Icon name={icon} size={16} />
      </span>
      <span className="pbx-panel-title">
        <b>{title}</b>
        {sub && <small>{sub}</small>}
      </span>
      <span className="pbx-panel-actions">{children}</span>
    </div>
  );
}

function FormatEditor({ format, onChange }) {
  const f = format || {};
  const set = (patch) => onChange({ ...f, ...patch });
  return (
    <>
      <Row label="Format">
        <Select value={f.type || "none"} onChange={(v) => onChange(v === "none" ? undefined : { ...f, type: v })} options={FORMAT_TYPES} />
      </Row>
      {["number", "currency", "percent"].includes(f.type) && (
        <Row label="Decimals">
          <NumberInput value={f.decimals ?? (f.type === "percent" ? 0 : 2)} onChange={(v) => set({ decimals: v })} step={1} min={0} max={6} />
        </Row>
      )}
      {f.type === "currency" && (
        <Row label="Symbol" hint="Blank = the template's currency symbol">
          <TextInput value={f.currency} placeholder="₹" onChange={(v) => set({ currency: v })} />
        </Row>
      )}
      {["date", "datetime", "time"].includes(f.type) && (
        <Row label="Pattern" hint="DD MM MMM YYYY hh HH mm A — [literal]">
          <TextInput mono value={f.pattern} placeholder={f.type === "time" ? "hh:mm A" : f.type === "date" ? "DD-MMM-YYYY" : "DD-MMM-YYYY hh:mm A"} onChange={(v) => set({ pattern: v })} />
        </Row>
      )}
      {f.type && f.type !== "none" && (
        <>
          <Row label="Prefix">
            <TextInput value={f.prefix} onChange={(v) => set({ prefix: v })} />
          </Row>
          <Row label="Suffix">
            <TextInput value={f.suffix} onChange={(v) => set({ suffix: v })} />
          </Row>
        </>
      )}
    </>
  );
}

/** Font, colour, alignment — for one element or (via onStyle) many. */
function StyleEditor({ style = {}, onStyle, textual = true }) {
  const s = style || {};
  const b = s.border || {};
  const setB = (patch) => onStyle({ border: { width: 0, style: "solid", color: "#9ca3af", sides: "tblr", ...b, ...patch } });
  const sides = b.sides || "tblr";
  const toggleSide = (c) => {
    const next = sides.includes(c) ? sides.replace(c, "") : sides + c;
    setB({ sides: "tblr".split("").filter((x) => next.includes(x)).join("") || "t" });
  };
  return (
    <>
      {textual && (
        <Section title="Text">
          <Row label="Font">
            <Select value={s.fontFamily || ""} onChange={(v) => onStyle({ fontFamily: v || undefined })} options={FONT_OPTIONS} placeholder="Template font" />
          </Row>
          <Row label="Size">
            <NumberInput value={s.fontSize} placeholder="auto" onChange={(v) => onStyle({ fontSize: v })} step={0.5} min={4} max={72} suffix="pt" />
          </Row>
          <Row label="Weight">
            <Select value={String(s.fontWeight || "")} onChange={(v) => onStyle({ fontWeight: v ? Number(v) : undefined })} options={WEIGHTS} />
          </Row>
          <Row label="Style">
            <span className="pbx-inline">
              <Tap tone="list" active={!!s.italic} onClick={() => onStyle({ italic: !s.italic })} title="Italic">
                <i>I</i>
              </Tap>
              <Tap tone="list" active={!!s.underline} onClick={() => onStyle({ underline: !s.underline })} title="Underline">
                <u>U</u>
              </Tap>
              <Select
                value={s.transform || "none"}
                onChange={(v) => onStyle({ transform: v === "none" ? undefined : v })}
                options={[
                  { value: "none", label: "Aa" },
                  { value: "uppercase", label: "AA" },
                  { value: "lowercase", label: "aa" },
                  { value: "capitalize", label: "Aa Bb" },
                ]}
              />
            </span>
          </Row>
          <Row label="Colour">
            <ColorInput value={s.color} onChange={(v) => onStyle({ color: v || undefined })} />
          </Row>
          <Row label="Align">
            <Segmented
              value={s.align || "left"}
              onChange={(v) => onStyle({ align: v })}
              options={[
                { value: "left", icon: <Icon name="alignL" size={13} />, title: "Left" },
                { value: "center", icon: <Icon name="alignC" size={13} />, title: "Centre" },
                { value: "right", icon: <Icon name="alignR" size={13} />, title: "Right" },
                { value: "justify", label: "≡", title: "Justify" },
              ]}
            />
          </Row>
          <Row label="Vertical">
            <Segmented
              value={s.vAlign || "top"}
              onChange={(v) => onStyle({ vAlign: v })}
              options={[
                { value: "top", icon: <Icon name="alignT" size={13} />, title: "Top" },
                { value: "middle", icon: <Icon name="alignM" size={13} />, title: "Middle" },
                { value: "bottom", icon: <Icon name="alignB" size={13} />, title: "Bottom" },
              ]}
            />
          </Row>
          <Row label="Line height">
            <NumberInput value={s.lineHeight} placeholder="auto" onChange={(v) => onStyle({ lineHeight: v })} step={0.05} min={0.8} max={3} />
          </Row>
          <Row label="Spacing">
            <NumberInput value={s.letterSpacing} placeholder="0" onChange={(v) => onStyle({ letterSpacing: v })} step={0.1} suffix="pt" />
          </Row>
          <Row label="Wrap">
            <Toggle value={s.wrap !== false} onChange={(v) => onStyle({ wrap: v ? undefined : false })} label={s.wrap === false ? "One line, …" : "Wrap lines"} />
          </Row>
        </Section>
      )}
      <Section title="Box" defaultOpen={false}>
        <Row label="Fill">
          <ColorInput value={s.background} onChange={(v) => onStyle({ background: v || undefined })} />
        </Row>
        <Row label="Border">
          <NumberInput value={b.width} placeholder="0" onChange={(v) => setB({ width: v })} step={0.1} min={0} max={3} suffix="mm" />
        </Row>
        {Number(b.width) > 0 && (
          <>
            <Row label="Sides">
              <span className="pbx-inline">
                {[
                  ["t", "Top"],
                  ["r", "Right"],
                  ["b", "Bottom"],
                  ["l", "Left"],
                ].map(([c, t]) => (
                  <Tap key={c} tone="list" active={sides.includes(c)} onClick={() => toggleSide(c)} title={t}>
                    {t[0]}
                  </Tap>
                ))}
              </span>
            </Row>
            <Row label="Line">
              <Select value={b.style || "solid"} onChange={(v) => setB({ style: v })} options={["solid", "dashed", "dotted", "double"]} />
            </Row>
            <Row label="Colour">
              <ColorInput value={b.color} onChange={(v) => setB({ color: v })} allowEmpty={false} />
            </Row>
          </>
        )}
        <Row label="Radius">
          <NumberInput value={s.radius} placeholder="0" onChange={(v) => onStyle({ radius: v })} step={0.5} min={0} suffix="mm" />
        </Row>
        <Row label="Padding">
          <NumberInput value={s.padding} placeholder="0" onChange={(v) => onStyle({ padding: v })} step={0.5} min={0} suffix="mm" />
        </Row>
      </Section>
    </>
  );
}

/* ============================================================ element */

function ElementPanel({ el, band, fields, schema, assets, onUploadAsset, sample, selfCode, onRefreshBlock }) {
  const d = useDesigner();
  const set = (patch, key = `p:${el.id}:${Object.keys(patch).join(",")}`) =>
    d.updateEls([el.id], (x) => {
      Object.entries(patch).forEach(([k, v]) => {
        if (v === undefined) delete x[k];
        else x[k] = v;
      });
    }, key);
  const mutate = (fn, key) => d.updateEls([el.id], fn, key || `m:${el.id}`);
  const setStyle = (patch) =>
    d.updateEls([el.id], (x) => {
      x.style = { ...(x.style || {}) };
      Object.entries(patch).forEach(([k, v]) => {
        if (v === undefined || v === "") delete x.style[k];
        else x.style[k] = v;
      });
    }, `s:${el.id}:${Object.keys(patch).join(",")}`);
  const meta = toolMeta(el.type) || { label: el.type, icon: "dots" };
  const sets = Object.keys(schema?.sets || {});
  const tableSet = el.type === "table" ? setNameOf(el.dataset) : null;
  const tableFields = tableSet ? fieldList(schema, tableSet, schema?.params || []) : fields;
  const textual = !["line", "image", "box", "barcode", "qr", "section", "chart", "subreport"].includes(el.type);
  const rootFields = fieldList(schema, null, schema?.params || []);

  const order = (dir) =>
    d.update((t) => {
      const f = findEl(t, el.id);
      const i = f.list.indexOf(f.el);
      f.list.splice(i, 1);
      if (dir === "front") f.list.push(f.el);
      else f.list.unshift(f.el);
    });

  return (
    <div className="pbx-panel">
      <PanelHead icon={meta.icon} title={meta.label} sub={`${bandMeta(band.type).label} · ${el.id}`}>
        <Tap className="is-icon" tone="list" onClick={() => set({ locked: !el.locked || undefined })} title={el.locked ? "Unlock" : "Lock position"}>
          <Icon name={el.locked ? "lock" : "unlock"} size={14} />
        </Tap>
        <Tap className="is-icon" tone="list" onClick={() => copyStyleOf(el)} title="Copy style (Ctrl+Alt+C)">
          <Icon name="brush" size={14} />
        </Tap>
        <Tap className="is-icon" tone="list" onClick={() => pasteStyleTo(d, [el.id])} title="Paste style (Ctrl+Alt+V)">
          <Icon name="paint" size={14} />
        </Tap>
        <Tap className="is-icon" tone="list" onClick={() => d.duplicate([el.id])} title="Duplicate (Ctrl+D)">
          <Icon name="copy" size={14} />
        </Tap>
        <Tap className="is-icon" tone="danger" onClick={() => d.deleteEls([el.id])} title="Delete (Del)">
          <Icon name="trash" size={14} />
        </Tap>
      </PanelHead>

      <Section title="Position (mm)">
        <div className="pbx-grid4">
          {["x", "y", "w", "h"].map((k) => (
            <label key={k} className="pbx-mini">
              <span>{k.toUpperCase()}</span>
              <NumberInput value={el[k]} onChange={(v) => set({ [k]: Math.max(k === "w" || k === "h" ? 0.5 : 0, roundMm(v ?? 0)) })} step={0.5} />
            </label>
          ))}
        </div>
        <div className="pbx-inline">
          <Tap tone="list" className="is-small" onClick={() => order("front")}>
            Bring to front
          </Tap>
          <Tap tone="list" className="is-small" onClick={() => order("back")}>
            Send to back
          </Tap>
        </div>
      </Section>

      <Section title="Content">
        {(el.type === "label" || el.type === "heading") && (
          <Row label="Text" wide>
            <TokenText value={el.text} onChange={(v) => set({ text: v })} fields={fields} rows={el.type === "heading" ? 1 : 3} />
          </Row>
        )}
        {(el.type === "field" || el.type === "amountWords" || el.type === "barcode" || el.type === "qr") && (
          <Row label="Value" wide hint="Drag a field from the Data panel, or type an expression">
            <ExprInput value={el.expr} onChange={(v) => set({ expr: v })} fields={fields} />
          </Row>
        )}
        {el.type === "field" && <FormatEditor format={el.format} onChange={(f) => set({ format: f })} />}
        {el.type === "amountWords" && (
          <>
            <Row label="Currency">
              <TextInput value={el.currencyName} onChange={(v) => set({ currencyName: v })} />
            </Row>
            <Row label="Sub-unit">
              <TextInput value={el.subunitName} onChange={(v) => set({ subunitName: v })} />
            </Row>
            <Row label="Ending">
              <TextInput value={el.suffix} onChange={(v) => set({ suffix: v })} />
            </Row>
            <Row label="Prefix">
              <TextInput value={el.prefix} onChange={(v) => set({ prefix: v })} placeholder="Amount in words: " />
            </Row>
          </>
        )}
        {el.type === "barcode" && (
          <>
            <Row label="Type" hint="EAN / UPC add their check digit; Data Matrix is a small 2D square (44 characters)">
              <Select value={el.symbology || "code128"} onChange={(v) => set({ symbology: v === "code128" ? undefined : v })} options={SYMBOLOGIES} />
            </Row>
            {el.symbology !== "datamatrix" && (
              <Row label="Show text">
                <Toggle value={el.showText !== false} onChange={(v) => set({ showText: v })} />
              </Row>
            )}
          </>
        )}
        {el.type === "qr" && (
          <Row label="Error level">
            <Select value={el.ecc || "M"} onChange={(v) => set({ ecc: v })} options={["L", "M", "Q", "H"]} />
          </Row>
        )}
        {el.type === "pageNumber" && (
          <Row label="Text" wide hint="{page} and {pages} are replaced">
            <TextInput value={el.text} onChange={(v) => set({ text: v })} placeholder="Page {page} of {pages}" />
          </Row>
        )}
        {el.type === "printDate" && (
          <>
            <Row label="Prefix">
              <TextInput value={el.prefix} onChange={(v) => set({ prefix: v })} />
            </Row>
            <Row label="Pattern">
              <TextInput mono value={el.pattern} onChange={(v) => set({ pattern: v })} placeholder="DD-MMM-YYYY hh:mm A" />
            </Row>
          </>
        )}
        {el.type === "signature" && (
          <>
            <Row label="Caption" wide>
              <TokenText value={el.label} onChange={(v) => set({ label: v })} fields={fields} rows={1} />
            </Row>
            <Row label="Name" wide hint="Printed under the caption">
              <ExprInput value={el.nameExpr} onChange={(v) => set({ nameExpr: v })} fields={fields} placeholder="sys.printedBy" />
            </Row>
          </>
        )}
        {el.type === "richtext" && (
          <>
            <Row label="Source">
              <Segmented
                value={el.htmlExpr != null ? "expr" : "html"}
                onChange={(v) => set(v === "expr" ? { htmlExpr: "header.HeaderText" } : { htmlExpr: undefined })}
                options={[
                  { value: "html", label: "Write HTML" },
                  { value: "expr", label: "From data" },
                ]}
              />
            </Row>
            {el.htmlExpr != null ? (
              <Row label="HTML from" wide hint="e.g. header.HeaderText — the receipt_header letterhead">
                <ExprInput value={el.htmlExpr} onChange={(v) => set({ htmlExpr: v })} fields={fields} />
              </Row>
            ) : (
              <Row label="HTML" wide hint="b, i, u, br, p, table… · {{fields}} allowed">
                <TokenText value={el.html} onChange={(v) => set({ html: v })} fields={fields} rows={5} />
              </Row>
            )}
          </>
        )}
        {el.type === "image" && (
          <>
            <Row label="Source">
              <Segmented
                value={el.source || "centreLogo"}
                onChange={(v) => set({ source: v })}
                options={[
                  { value: "letterhead", label: "Letterhead" },
                  { value: "centreLogo", label: "Centre logo" },
                  { value: "asset", label: "Upload" },
                  { value: "expr", label: "From data" },
                ]}
              />
            </Row>
            {el.source === "asset" && (
              <>
                <Row label="Image" wide>
                  <Select value={el.assetKey || ""} onChange={(v) => set({ assetKey: v || undefined })} options={(assets || []).map((a) => ({ value: a.assetKey, label: `${a.name}${a.tag ? ` · ${a.tag}` : ""}` }))} placeholder="Choose…" />
                </Row>
                <label className="pbx-upload">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      const key = await onUploadAsset(file);
                      if (key) set({ assetKey: key });
                    }}
                  />
                  <span className="pbx-tap tone-add">
                    <Icon name="upload" size={13} /> Upload image
                  </span>
                </label>
              </>
            )}
            {el.source === "expr" && (
              <Row label="URL / data" wide hint="An expression giving a data: URI">
                <ExprInput value={el.expr} onChange={(v) => set({ expr: v })} fields={fields} placeholder="centre.FooterLogoUrl" />
              </Row>
            )}
            {el.source !== "asset" && (
              <Row
                label="If empty"
                wide
                hint={
                  el.source === "expr"
                    ? "Shown when the expression gives no image"
                    : el.source === "letterhead"
                      ? "Letterhead = the image old OPD / pharmacy receipts print (API Images/Jai_Clinic.jpeg), else the centre's ReportHeaderURL. This shows when neither exists"
                      : "Shown when the centre has no logo (pb_asset logo or center_master.ReportHeaderURL)"
                }
              >
                <Select
                  value={el.fallbackAssetKey || ""}
                  onChange={(v) => set({ fallbackAssetKey: v || undefined })}
                  options={[{ value: "", label: "Nothing" }, ...(assets || []).map((a) => ({ value: a.assetKey, label: `${a.name}${a.tag ? ` · ${a.tag}` : ""}` }))]}
                />
              </Row>
            )}
            <Row label="Fit">
              <Select value={el.fit || "contain"} onChange={(v) => set({ fit: v })} options={["contain", "cover", "fill"]} />
            </Row>
            <Row label="Anchor">
              <Segmented
                value={el.style?.align || "left"}
                onChange={(v) => setStyle({ align: v })}
                options={[
                  { value: "left", icon: <Icon name="alignL" size={13} /> },
                  { value: "center", icon: <Icon name="alignC" size={13} /> },
                  { value: "right", icon: <Icon name="alignR" size={13} /> },
                ]}
              />
            </Row>
          </>
        )}
        {el.type === "line" && (
          <>
            <Row label="Direction">
              <Segmented
                value={el.orientation || "h"}
                onChange={(v) => set({ orientation: v })}
                options={[
                  { value: "h", label: "Horizontal" },
                  { value: "v", label: "Vertical" },
                ]}
              />
            </Row>
            <Row label="Thickness">
              <NumberInput value={el.thickness} onChange={(v) => set({ thickness: v })} step={0.1} min={0.1} suffix="mm" />
            </Row>
            <Row label="Colour">
              <ColorInput value={el.color} onChange={(v) => set({ color: v })} allowEmpty={false} />
            </Row>
            <Row label="Dashed">
              <Toggle value={!!el.dash} onChange={(v) => set({ dash: v || undefined })} />
            </Row>
          </>
        )}
        {el.type === "table" && (
          <>
            <Row label="Rows from" wide hint="A result set of the datasource">
              <span className="pbx-inline is-fill">
                <Select value={sets.includes(el.dataset) ? el.dataset : ""} onChange={(v) => set({ dataset: v })} options={sets} placeholder={sets.length ? "Choose a result set" : "Fetch sample first"} />
              </span>
            </Row>
            <Row label="Expression" hint="Or any expression returning rows">
              <ExprInput value={el.dataset} onChange={(v) => set({ dataset: v })} fields={fields} />
            </Row>
            <TableEditor el={el} setFields={tableSet ? schema?.sets?.[tableSet] : []} fields={tableFields} onChange={mutate} />
          </>
        )}
        {el.type === "chart" && <ChartContent el={el} set={set} schema={schema} rootFields={rootFields} />}
        {el.type === "crosstab" && <CrosstabContent el={el} set={set} schema={schema} rootFields={rootFields} />}
        {el.type === "subreport" && <SubreportContent el={el} set={set} rootFields={rootFields} sample={sample} selfCode={selfCode} />}
        {el.type === "section" && el.blockCode && (
          <div className="pbx-blocklink">
            <Icon name="puzzle" size={14} />
            <span>
              From block <b>{el.blockCode}</b>
            </span>
            <Tap tone="refresh" className="is-small" onClick={() => onRefreshBlock?.(el)} title="Replace the contents with the block's current version">
              <Icon name="refresh" size={12} /> Update
            </Tap>
            <Tap tone="list" className="is-small" onClick={() => set({ blockCode: undefined })} title="Keep the contents, stop following the block">
              Unlink
            </Tap>
          </div>
        )}
        {el.type === "section" && (
          <>
            <Row label="Show if" wide hint="The whole block prints only when this is true">
              <ExprInput value={el.visibleIf} onChange={(v) => set({ visibleIf: v })} fields={fields} placeholder="bill.PanelID != 1" />
            </Row>
            <Row label="Close gap" hint="When hidden, move what is below it up">
              <Toggle value={el.collapse !== false} onChange={(v) => set({ collapse: v })} />
            </Row>
            <div className="pbx-note">Drop toolbox items onto the section to add them inside it ({(el.children || []).length} inside).</div>
          </>
        )}
      </Section>

      {el.type === "table" && (
        <Section title="Table look">
          <Row label="Header row">
            <Toggle value={el.showHeader !== false} onChange={(v) => set({ showHeader: v })} />
          </Row>
          <Row label="Repeat header" hint="On every page the table continues on">
            <Toggle value={el.repeatHeader !== false} onChange={(v) => set({ repeatHeader: v })} />
          </Row>
          <p className="pbx-note">
            On thermal rolls the rows stack by themselves: the item-name column (Role in each column) on line 1, the figures under it; a table without a
            name column prints label … value lines.
          </p>
          <Row label="Footer / totals">
            <Toggle value={!!el.showFooter} onChange={(v) => set({ showFooter: v })} />
          </Row>
          <Row label="Zebra rows">
            <Toggle value={el.zebra !== false} onChange={(v) => set({ zebra: v })} />
          </Row>
          <Row label="Lines">
            <Select
              value={el.grid || "lines"}
              onChange={(v) => set({ grid: v })}
              options={[
                { value: "lines", label: "Row lines" },
                { value: "grid", label: "Full grid" },
                { value: "none", label: "None" },
              ]}
            />
          </Row>
          <Row label="Font size">
            <NumberInput value={el.style?.fontSize} placeholder="auto" onChange={(v) => setStyle({ fontSize: v })} step={0.5} suffix="pt" />
          </Row>
          <Row label="Cell padding">
            <NumberInput value={el.cellPadding} placeholder="auto" onChange={(v) => set({ cellPadding: v })} step={0.2} min={0} suffix="mm" />
          </Row>
          <Row label="Cell align">
            <Segmented
              value={el.valign || "top"}
              onChange={(v) => set({ valign: v === "top" ? undefined : v })}
              options={[
                { value: "top", label: "Top" },
                { value: "middle", label: "Middle" },
                { value: "bottom", label: "Bottom" },
              ]}
            />
          </Row>
          <Row label="Min row height">
            <NumberInput value={el.rowMinHeight} placeholder="auto" onChange={(v) => set({ rowMinHeight: v })} step={0.5} suffix="mm" />
          </Row>
          <Row label="Header fill">
            <ColorInput value={el.headerStyle?.background} onChange={(v) => set({ headerStyle: { ...(el.headerStyle || {}), background: v || undefined } })} />
          </Row>
          <Row label="When empty">
            <TokenText value={el.emptyText} onChange={(v) => set({ emptyText: v })} fields={fields} rows={1} />
          </Row>
          <Row label="Filter" hint="Keep rows where this is true">
            <ExprInput value={el.filter} onChange={(v) => set({ filter: v })} fields={tableFields} placeholder="Amount > 0" />
          </Row>
          <Row label="Sort by">
            <ExprInput value={el.sortBy} onChange={(v) => set({ sortBy: v })} fields={tableFields} placeholder="ItemName" />
          </Row>
          {el.sortBy && (
            <Row label="Descending">
              <Toggle value={!!el.sortDesc} onChange={(v) => set({ sortDesc: v || undefined })} />
            </Row>
          )}
        </Section>
      )}

      {el.type === "table" && (
        <Section title="Group rows & sub-lines" defaultOpen={!!(el.groupBy || el.subRowIf)}>
          <Row label="Group by" hint="A full-width heading row whenever this changes from one row to the next">
            <ExprInput value={el.groupBy} onChange={(v) => set({ groupBy: v || undefined })} fields={tableFields} placeholder="upper(CategoryName)" />
          </Row>
          {el.groupBy && (
            <>
              <Row label="Heading" hint="Blank prints the group value; {{group}} is the value">
                <TokenText value={el.groupText} onChange={(v) => set({ groupText: v || undefined })} fields={tableFields} rows={1} />
              </Row>
              <Row label="Heading fill">
                <ColorInput value={el.groupStyle?.background} onChange={(v) => set({ groupStyle: { ...(el.groupStyle || {}), background: v || undefined } })} />
              </Row>
              <Row label="Heading colour">
                <ColorInput value={el.groupStyle?.color} onChange={(v) => set({ groupStyle: { ...(el.groupStyle || {}), color: v || undefined } })} />
              </Row>
            </>
          )}
          <Row label="Sub-line when" hint="Rows where this is true print as one indented line (e.g. a package's contents). {{rowNumber}} counts the other rows only; {{subNumber}} counts sub-lines.">
            <ExprInput value={el.subRowIf} onChange={(v) => set({ subRowIf: v || undefined })} fields={tableFields} placeholder="IsPackage = 1" />
          </Row>
          {el.subRowIf && (
            <>
              <Row label="Sub-line text">
                <TokenText value={el.subRowText} onChange={(v) => set({ subRowText: v || undefined })} fields={tableFields} rows={1} />
              </Row>
              <Row label="Italic">
                <Toggle value={!!el.subRowStyle?.italic} onChange={(v) => set({ subRowStyle: { ...(el.subRowStyle || {}), italic: v || undefined } })} />
              </Row>
            </>
          )}
        </Section>
      )}

      {textual && <StylePresets ids={[el.id]} current={el.style} />}
      <StyleEditor style={el.style} onStyle={setStyle} textual={textual} />

      {el.type === "table" ? (
        <Section title="Row colour rules" defaultOpen={!!el.rowRules?.length}>
          <RulesEditor rules={el.rowRules} onChange={(r) => set({ rowRules: r })} fields={tableFields} hint="Colours every cell of a matching row; row fields by name. Per-column rules are in each column." />
        </Section>
      ) : (
        !["line", "box", "image", "section", "chart", "subreport", "crosstab"].includes(el.type) && (
          <Section title="Colour rules" defaultOpen={!!el.styleRules?.length}>
            <RulesEditor rules={el.styleRules} onChange={(r) => set({ styleRules: r })} fields={fields} />
          </Section>
        )
      )}

      <Section title="Behaviour" defaultOpen={false}>
        <Row label="Priority" hint="Must: printed on every paper. Optional: may be dropped when a paper is too narrow (a wide letterhead is optional unless set to Must). Same setting for every paper.">
          <Select
            value={el.priority || ""}
            onChange={(v) => set({ priority: v || undefined })}
            options={[
              { value: "", label: "Auto" },
              { value: "must", label: "Must (every paper)" },
              { value: "optional", label: "Optional" },
            ]}
          />
        </Row>
        <Row label="Keep with next" hint="On a narrow paper this control stays on one line with the control to its right (e.g. a caption and its value)">
          <Toggle value={!!el.keepWithNext} onChange={(v) => set({ keepWithNext: v || undefined })} />
        </Row>
        <Row label="Min width" hint="Narrower than this on some paper → its row stacks there (blank = worked out from the text)">
          <NumberInput value={el.minWidth} onChange={(v) => set({ minWidth: v || undefined })} step={1} min={0} suffix="mm" placeholder="auto" />
        </Row>
        {el.type !== "section" && (
          <Row label="Show if" wide hint="Hide the element unless this is true">
            <ExprInput value={el.visibleIf} onChange={(v) => set({ visibleIf: v || undefined })} fields={fields} placeholder="bill.Remark != ''" />
          </Row>
        )}
        {el.visibleIf && el.type !== "section" && (
          <Row label="Close gap" hint="When hidden, move what is below it up">
            <Toggle value={!!el.collapse} onChange={(v) => set({ collapse: v || undefined })} />
          </Row>
        )}
        {["crosstab", "subreport"].includes(el.type) && (
          <Row label="Grow with rows" hint="Off: the box keeps its size and cuts what does not fit">
            <Toggle value={el.canGrow !== false} onChange={(v) => set({ canGrow: v ? undefined : false })} />
          </Row>
        )}
        {["label", "field", "richtext", "amountWords", "heading"].includes(el.type) && (
          <Row label="Can grow" hint="Grow to fit long text, pushing what is below down">
            <Toggle value={el.canGrow ?? el.type === "richtext"} onChange={(v) => set({ canGrow: v })} />
          </Row>
        )}
        {["field", "label", "amountWords"].includes(el.type) && (
          <Row label="If empty" hint="Printed when the value is null or blank">
            <TextInput value={el.nullText} onChange={(v) => set({ nullText: v })} placeholder="—" />
          </Row>
        )}
        {["box", "line"].includes(el.type) && (
          <Row label="Stretch to bottom" hint="Keep the gap to the band's bottom edge, so the border grows with the fields inside it">
            <Toggle value={!!el.stretch} onChange={(v) => set({ stretch: v || undefined })} />
          </Row>
        )}
        {d.state.tpl.theme?.translate !== false && ["label", "heading"].includes(el.type) && (
          <Row label="Translate" hint="Label translation is on for this template. Turn it off for text that must print exactly as typed.">
            <Toggle value={el.translate !== false} onChange={(v) => set({ translate: v ? undefined : false })} />
          </Row>
        )}
      </Section>
    </div>
  );
}

/* ============================================================== multi */

function MultiPanel({ found, align }) {
  const d = useDesigner();
  const ids = found.map((f) => f.el.id);
  const first = found[0].el;
  const setStyle = (patch) =>
    d.updateEls(ids, (x) => {
      x.style = { ...(x.style || {}) };
      Object.entries(patch).forEach(([k, v]) => {
        if (v === undefined || v === "") delete x.style[k];
        else x.style[k] = v;
      });
    }, `ms:${Object.keys(patch).join(",")}`);
  const tools = [
    ["left", "alignL", "Align left edges"],
    ["center", "alignC", "Align centres"],
    ["right", "alignR", "Align right edges"],
    ["top", "alignT", "Align tops"],
    ["middle", "alignM", "Align middles"],
    ["bottom", "alignB", "Align bottoms"],
    ["distH", "distH", "Distribute horizontally"],
    ["distV", "distV", "Distribute vertically"],
    ["sameW", "sameW", "Same width"],
    ["sameH", "sameH", "Same height"],
  ];
  return (
    <div className="pbx-panel">
      <PanelHead icon="layers" title={`${found.length} elements`} sub="Shift-click to add or remove">
        <Tap className="is-icon" tone="list" onClick={() => pasteStyleTo(d, ids)} title="Paste style onto all (Ctrl+Alt+V)">
          <Icon name="paint" size={14} />
        </Tap>
        <Tap className="is-icon" tone="list" onClick={() => d.duplicate(ids)} title="Duplicate">
          <Icon name="copy" size={14} />
        </Tap>
        <Tap className="is-icon" tone="danger" onClick={() => d.deleteEls(ids)} title="Delete">
          <Icon name="trash" size={14} />
        </Tap>
      </PanelHead>
      <Section title="Arrange">
        <div className="pbx-aligns">
          {tools.map(([k, icon, title]) => (
            <Tap key={k} className="is-icon" tone="info" onClick={() => align(k)} title={title} disabled={(k === "distH" || k === "distV") && found.length < 3}>
              <Icon name={icon} size={15} />
            </Tap>
          ))}
        </div>
      </Section>
      <StylePresets ids={ids} current={first.style} />
      <StyleEditor style={first.style} onStyle={setStyle} textual />
    </div>
  );
}

/* =============================================================== band */

function BandPanel({ band, schema, params }) {
  const d = useDesigner();
  const meta = bandMeta(band.type);
  const sets = Object.keys(schema?.sets || {});
  const detail = d.state.tpl.bands.find((b) => b.type === "detail");
  const detailSet = detail ? setNameOf(detail.dataset) : null;
  const rowFields = fieldList(schema, band.type === "detail" ? setNameOf(band.dataset) : detailSet, params);
  const rootFields = fieldList(schema, null, params);
  const set = (patch) =>
    d.updateBand(band.id, (b) => {
      Object.entries(patch).forEach(([k, v]) => {
        if (v === undefined || v === "") delete b[k];
        else b[k] = v;
      });
    }, `band:${band.id}:${Object.keys(patch).join(",")}`);
  const remove = () => d.update((t) => {
    t.bands = t.bands.filter((b) => b.id !== band.id);
  }, null, { sel: [], band: null });
  const fit = () => d.updateBand(band.id, (b) => {
    const bottom = Math.max(0, ...b.elements.map((e) => e.y + e.h));
    b.height = roundMm(Math.max(2, bottom + 1));
  });

  return (
    <div className="pbx-panel">
      <PanelHead icon={meta.icon || "layers"} title={bandName(band, d.state.tpl.bands).title} sub={`${meta.label} · ${meta.hint}`}>
        {band.elements.length > 0 && (
          <Tap
            className="is-icon"
            tone="add"
            onClick={() => window.dispatchEvent(new CustomEvent("pbx:open-blocks"))}
            title="Save this whole section as a reusable block (opens the Blocks tab)"
          >
            <Icon name="puzzle" size={14} />
          </Tap>
        )}
        <Tap className="is-icon" tone="danger" onClick={remove} title="Delete band and its elements">
          <Icon name="trash" size={14} />
        </Tap>
      </PanelHead>
      <Section title="Band">
        <Row label="Prints" hint="Where on the page this section prints. Changing it moves the section to that place.">
          <Select value={band.type} onChange={(v) => set({ type: v })} options={BAND_TYPES.map((b) => ({ value: b.type, label: `${b.label} (${b.tech})` }))} />
        </Row>
        <Row label="Name" hint="Your own name for this section, shown on the canvas and in Outline. Optional — designer only, never printed.">
          <TextInput value={band.name || ""} onChange={(v) => set({ name: v })} placeholder={bandHeading(band) || bandSummary(band)} />
        </Row>
        <p className="pbx-bandexplain">
          <b>Use for:</b> {meta.use}.
        </p>
        <Row label="Height">
          <span className="pbx-inline">
            <NumberInput value={band.height} onChange={(v) => set({ height: Math.max(1, roundMm(v ?? 1)) })} step={0.5} suffix="mm" />
            <Tap tone="list" className="is-small" onClick={fit}>
              Fit
            </Tap>
          </span>
        </Row>
        {band.type === "detail" && (
          <>
            <Row label="Repeat for" wide hint="One band per row of this result set">
              <Select value={sets.includes(band.dataset) ? band.dataset : ""} onChange={(v) => set({ dataset: v })} options={sets} placeholder={sets.length ? "Choose a result set" : "Fetch sample first"} />
            </Row>
            <Row label="Expression">
              <ExprInput value={band.dataset} onChange={(v) => set({ dataset: v })} fields={rootFields} />
            </Row>
            <Row label="Sort by">
              <ExprInput value={band.sortBy} onChange={(v) => set({ sortBy: v })} fields={rowFields} placeholder="CategoryName" />
            </Row>
            <Row label="Filter">
              <ExprInput value={band.filter} onChange={(v) => set({ filter: v })} fields={rowFields} placeholder="Amount > 0" />
            </Row>
          </>
        )}
        {(band.type === "groupHeader" || band.type === "groupFooter") && (
          <Row label="Group by" wide hint="Detail rows with the same value form a group; header and footer pair by this text">
            <ExprInput value={band.groupBy} onChange={(v) => set({ groupBy: v })} fields={rowFields} placeholder="CategoryName" allowEmpty={false} />
          </Row>
        )}
        {(band.type === "pageHeader" || band.type === "pageFooter") && (
          <Row label="Print on" hint="First-page letterhead + slim later pages: two page headers, one 'First page only', one 'All but the first'. Carried forward: a footer on 'All but the last'.">
            <Select value={band.printOn || "all"} onChange={(v) => set({ printOn: v })} options={PRINT_ON} />
          </Row>
        )}
        {band.type === "reportFooter" && (
          <Row label="At page bottom" hint="Sit at the bottom of the last page (signatures, totals)">
            <Toggle value={!!band.anchorBottom} onChange={(v) => set({ anchorBottom: v || undefined })} />
          </Row>
        )}
        {!["pageHeader", "pageFooter"].includes(band.type) && (
          <>
            <Row label="New page before" hint={band.type === "groupHeader" ? "Each group starts on a new page (the first one stays where it is)" : "Start this band on a new page"}>
              <Toggle value={!!band.pageBreakBefore} onChange={(v) => set({ pageBreakBefore: v || undefined })} />
            </Row>
            <Row label="New page after" hint="What follows this band starts on a new page">
              <Toggle value={!!band.pageBreakAfter} onChange={(v) => set({ pageBreakAfter: v || undefined })} />
            </Row>
            {band.type !== "detail" && (
              <Row label="Keep with next" hint="Never end a page with this band: it moves to the next page with the band after it">
                <Toggle value={!!band.keepWithNext} onChange={(v) => set({ keepWithNext: v || undefined })} />
              </Row>
            )}
          </>
        )}
        <Row label="Show if" wide>
          <ExprInput value={band.visibleIf} onChange={(v) => set({ visibleIf: v })} fields={rowFields} placeholder="(always)" />
        </Row>
        <Row label="Background">
          <ColorInput value={band.background} onChange={(v) => set({ background: v })} />
        </Row>
      </Section>
      <div className="pbx-note">
        Bands print in this order: page header · report header · group headers · detail rows · group footers · report footer · page footer. Tables inside any band break across pages by
        themselves.
      </div>
    </div>
  );
}

/* ============================================================ copies */

function CopiesSection({ tpl, fields }) {
  const d = useDesigner();
  const list = Array.isArray(tpl.copies) ? tpl.copies : [];
  const put = (next) => d.update((t) => {
    if (next.length) t.copies = next;
    else delete t.copies;
  }, "copies");
  const set = (i, patch) => put(list.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  return (
    <Section title="Copies" defaultOpen={list.length > 0}>
      <p className="pbx-hint">
        Print the whole document more than once in one PDF, e.g. Patient copy and Office copy. Each copy has its own page numbers; show its name with {"{{sys.copy}}"}.
      </p>
      {list.map((c, i) => (
        <div key={i} className="pbx-copyrow">
          <span className="pbx-rule-no">{i + 1}</span>
          <TextInput value={c.label} onChange={(v) => set(i, { label: v })} placeholder="Patient copy" />
          <Tap className="is-icon" tone="danger" onClick={() => put(list.filter((_, k) => k !== i))} title="Remove copy">
            <Icon name="trash" size={12} />
          </Tap>
          <div className="pbx-copywhen">
            <ExprInput value={c.when} onChange={(v) => set(i, { when: v || undefined })} fields={fields} placeholder="Only when… (always)" />
          </div>
        </div>
      ))}
      <span className="pbx-inline">
        <Tap tone="add" className="is-small" onClick={() => put([...list, { label: list.length ? `Copy ${list.length + 1}` : "Original" }])}>
          ＋ Copy
        </Tap>
        {!list.length && (
          <Tap tone="list" className="is-small" onClick={() => put([{ label: "Patient copy" }, { label: "Office copy" }])}>
            Patient + Office
          </Tap>
        )}
      </span>
    </Section>
  );
}

/* ============================================================ labels */

function LabelsSection({ tpl, schema, params }) {
  const d = useDesigner();
  const L = tpl.labels || {};
  const detail = tpl.bands.find((b) => b.type === "detail");
  const rowFields = fieldList(schema, detail ? setNameOf(detail.dataset) : null, params);
  const set = (patch) => d.update((t) => {
    t.labels = { ...(t.labels || {}), ...patch };
    Object.keys(t.labels).forEach((k) => t.labels[k] === undefined && delete t.labels[k]);
  }, `labels:${Object.keys(patch).join(",")}`);
  const useStock = (id) => {
    const s = LABEL_STOCKS.find((x) => x.id === id);
    if (!s) return;
    d.update((t) => {
      t.labels = { ...(t.labels || {}), enabled: true, stock: s.id, columns: s.columns, rows: s.rows, width: s.width, height: s.height, gapX: s.gapX, gapY: s.gapY };
      const m = s.margins;
      t.page = { ...t.page, size: s.page, orientation: "portrait", margins: { top: m, right: m, bottom: m, left: m }, ...(s.page === "Custom" ? { width: s.pageW, height: s.pageH } : {}) };
      // the detail band is the label: make it the label's height
      const det = t.bands.find((b) => b.type === "detail");
      if (det) det.height = s.height;
    }, "labels:stock");
  };
  return (
    <Section title="Label sheet" defaultOpen={!!L.enabled}>
      <Row label="Print as labels" hint="The detail band becomes one label, printed for every row across and down the sheet. Page and report bands do not print.">
        <Toggle value={!!L.enabled} onChange={(v) => set({ enabled: v || undefined })} />
      </Row>
      {L.enabled && (
        <>
          {!detail && <p className="pbx-note is-warn">Add a Detail band and set its rows (Repeat for): each row prints one label.</p>}
          <Row label="Stock" wide hint="Sets the paper, label size, columns and gaps. Check the sizes against your label box.">
            <Select value={L.stock || ""} onChange={useStock} options={LABEL_STOCKS.map((s) => ({ value: s.id, label: s.label }))} placeholder="Choose label stock…" />
          </Row>
          <div className="pbx-grid4">
            {[
              ["width", "W"],
              ["height", "H"],
              ["gapX", "Gap →"],
              ["gapY", "Gap ↓"],
            ].map(([k, lbl]) => (
              <label key={k} className="pbx-mini">
                <span>{lbl}</span>
                <NumberInput value={L[k]} onChange={(v) => set({ [k]: v ?? 0, stock: undefined })} step={0.5} min={0} />
              </label>
            ))}
          </div>
          <div className="pbx-grid4">
            <label className="pbx-mini">
              <span>Across</span>
              <NumberInput value={L.columns} placeholder="auto" onChange={(v) => set({ columns: v || undefined, stock: undefined })} step={1} min={1} />
            </label>
            <label className="pbx-mini">
              <span>Down</span>
              <NumberInput value={L.rows} placeholder="auto" onChange={(v) => set({ rows: v || undefined, stock: undefined })} step={1} min={1} />
            </label>
            <label className="pbx-mini">
              <span>Skip</span>
              <NumberInput value={L.skip} placeholder="0" onChange={(v) => set({ skip: v || undefined })} step={1} min={0} />
            </label>
          </div>
          <Row label="Labels per row" wide hint="How many labels each row prints, e.g. Qty for one sticker per strip. Blank = one.">
            <ExprInput value={L.countExpr} onChange={(v) => set({ countExpr: v || undefined })} fields={rowFields} placeholder="1" />
          </Row>
          <Row label="Outline" hint="Draw each label's edge (for lining up with the stock; turn off for real prints)">
            <Toggle value={!!L.outline} onChange={(v) => set({ outline: v || undefined })} />
          </Row>
          <Row label="Grow to content" hint="Plain sheet cut by hand: a label grows to fit long text and the sheet takes fewer rows. Off for die-cut stock (fixed size). Other papers always grow.">
            <Toggle value={!!L.grow} onChange={(v) => set({ grow: v || undefined })} />
          </Row>
        </>
      )}
    </Section>
  );
}

/* =========================================================== template */

function TemplatePanel({ tpl, meta, datasources, onEditDatasource, onPageSetup, schema, params, onManage }) {
  const d = useDesigner();
  const theme = tpl.theme || {};
  const wm = tpl.page?.watermark || {};
  const setTheme = (patch) => d.update((t) => {
    t.theme = { ...t.theme, ...patch };
  }, `theme:${Object.keys(patch).join(",")}`);
  const setWm = (patch) => d.update((t) => {
    t.page = { ...t.page, watermark: { ...(t.page.watermark || {}), ...patch } };
  }, `wm:${Object.keys(patch).join(",")}`);
  const fields = fieldList(schema, null, params);
  const page = tpl.page || {};
  const m = page.margins || {};
  return (
    <div className="pbx-panel">
      <PanelHead icon="page" title={meta?.name || "Template"} sub={meta?.code} />
      <Section title="Template">
        <Row label="Name">
          <TextInput value={meta?.name} onChange={(v) => d.setMeta({ name: v })} />
        </Row>
        <Row label="Category" hint="Several? Separate them with commas — the first one leads">
          <TextInput value={meta?.category} onChange={(v) => d.setMeta({ category: v })} placeholder="IPD, Billing…" />
        </Row>
        <Row label="Notes" wide>
          <TextArea value={meta?.description} onChange={(v) => d.setMeta({ description: v })} rows={2} />
        </Row>
      </Section>
      <Section title="Data">
        <Row label="Datasource" wide>
          <span className="pbx-inline is-fill">
            <Select
              value={meta?.datasourceCode || ""}
              onChange={(v) => {
                d.setMeta({ datasourceCode: v });
                d.update((t) => {
                  t.datasource = v;
                }, "ds");
              }}
              options={(datasources || []).map((x) => ({ value: x.dsCode, label: `${x.name} (${x.dsCode})` }))}
              placeholder="Choose…"
            />
            <Tap tone="map" className="is-small" onClick={() => onEditDatasource(meta?.datasourceCode || null)}>
              {meta?.datasourceCode ? "Edit" : "New"}
            </Tap>
          </span>
        </Row>
        <Row label="Letterhead" hint="receipt_header.HeaderType read into header.*">
          <Select
            value={tpl.header?.receiptHeaderType || "OPD"}
            onChange={(v) => d.update((t) => {
              t.header = { ...(t.header || {}), receiptHeaderType: v };
            })}
            options={HEADER_TYPES}
          />
        </Row>
      </Section>
      <Section title="Page">
        <div className="pbx-pagecard">
          <b>{page.size || "A4"}</b> · {page.orientation || "portrait"} · margins {m.top ?? 10}/{m.right ?? 10}/{m.bottom ?? 10}/{m.left ?? 10} mm
        </div>
        <Tap tone="primary" onClick={onPageSetup}>
          <Icon name="page" size={13} /> Page setup…
        </Tap>
      </Section>
      <Section title="Look">
        <Row label="Font">
          <Select value={theme.fontFamily || "Inter"} onChange={(v) => setTheme({ fontFamily: v })} options={FONT_OPTIONS} />
        </Row>
        <Row label="Base size">
          <NumberInput value={theme.fontSize} onChange={(v) => setTheme({ fontSize: v })} step={0.5} min={5} max={16} suffix="pt" />
        </Row>
        <Row label="Line height">
          <NumberInput value={theme.lineHeight} onChange={(v) => setTheme({ lineHeight: v })} step={0.05} min={1} max={2.4} />
        </Row>
        <Row label="Text colour">
          <ColorInput value={theme.color} onChange={(v) => setTheme({ color: v })} allowEmpty={false} />
        </Row>
        <Row label="Accent" hint="One accent colour: table headers, rules, totals">
          <ColorInput value={theme.accent} onChange={(v) => setTheme({ accent: v })} allowEmpty={false} />
        </Row>
        <Row label="Currency" hint="Symbol for currency formats">
          <TextInput value={theme.currency} onChange={(v) => setTheme({ currency: v })} placeholder="₹" />
        </Row>
        <Row label="If empty" hint="Default text for empty values">
          <TextInput value={theme.nullText} onChange={(v) => setTheme({ nullText: v })} placeholder="(blank)" />
        </Row>
        <Row label="Translate labels" hint="On for every template: labels, headings, column headers and signature captions print in the app language the user picked, from Country_langauge_master (English prints as designed). Turn off to print the designed text in every language. Field values are never translated.">
          <Toggle value={theme.translate !== false} onChange={(v) => setTheme({ translate: v ? undefined : false })} />
        </Row>
      </Section>
      <LayoutSection
        tpl={tpl}
        setTheme={setTheme}
        setPage={(patch) => d.update((t) => {
          t.page = { ...t.page, ...patch };
          Object.keys(patch).forEach((k) => patch[k] === undefined && delete t.page[k]);
        }, `page:${Object.keys(patch).join(",")}`)}
      />
      <PoweredBySection
        tpl={tpl}
        setPage={(patch) => d.update((t) => {
          t.page = { ...t.page, ...patch };
          Object.keys(patch).forEach((k) => patch[k] === undefined && delete t.page[k]);
        }, "page:poweredBy")}
      />
      <CopiesSection tpl={tpl} fields={fields} />
      <LabelsSection tpl={tpl} schema={schema} params={params} />
      <ReprintSection tpl={tpl} params={params} update={d.update} />
      <SecuritySection tpl={tpl} fields={fields} update={d.update} />
      <Section title="Watermark" defaultOpen={!!wm.text}>
        <Row label="Text">
          <TextInput value={wm.text} onChange={(v) => setWm({ text: v })} placeholder="DUPLICATE" />
        </Row>
        <Row label="Show when" wide hint="e.g. sys.duplicate — GeneratePdf's duplicate flag">
          <ExprInput value={wm.when} onChange={(v) => setWm({ when: v })} fields={fields} placeholder="sys.duplicate" />
        </Row>
        <Row label="Opacity">
          <NumberInput value={wm.opacity ?? 0.08} onChange={(v) => setWm({ opacity: v })} step={0.01} min={0.02} max={0.5} />
        </Row>
        <Row label="Size">
          <NumberInput value={wm.size ?? 72} onChange={(v) => setWm({ size: v })} step={2} suffix="pt" />
        </Row>
        <Row label="Angle">
          <NumberInput value={wm.angle ?? -30} onChange={(v) => setWm({ angle: v })} step={5} suffix="°" />
        </Row>
      </Section>
    </div>
  );
}
