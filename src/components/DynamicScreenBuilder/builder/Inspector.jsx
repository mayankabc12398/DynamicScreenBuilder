/**
 * Property inspector — entirely driven by the registry's `propSchema`, so a new
 * component gets a full editing UI the moment it is registered.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "../registry/icons";
import { fieldsOf, getDef } from "../registry";
import { useBuilder, selectedNode, allNodes } from "../store/builderStore";
import { rowContextAt, rowFieldsOf } from "../utils/rowContext";
import {
  ColorField,
  ColorRulesEditor,
  DebouncedInput,
  EventsEditor,
  KeyValueEditor,
  PropField,
  Row,
  ScopeBrowser,
  ScopeRailContext,
  Section,
  SelectBox,
  Toggle,
  VisibilityRulesEditor,
} from "./editors";
import { HeaderSection } from "./DataPanel";
import { eventRecordOf, liveScope, onEventRecord, setEventSample } from "../utils/livescope";
import { deriveColumns, mergeColumns, nodeSourceId, PREVIEW_ROW_LIMIT } from "../utils/apiConfig";
import { varRows } from "../utils/gridRows";

const TABS = [
  { key: "props", label: "Props", icon: "SlidersHorizontal" },
  { key: "style", label: "Style", icon: "Paintbrush" },
  { key: "data", label: "Data", icon: "Database" },
  { key: "events", label: "Events", icon: "Zap" },
  { key: "rules", label: "Rules", icon: "ListChecks" },
  { key: "colors", label: "Colours", icon: "Palette" },
  { key: "responsive", label: "Screens", icon: "MonitorSmartphone" },
];

/* ------------------------------------------------------------ style editor */

/**
 * How wide a node is inside its parent, expressed as four intents instead of
 * raw CSS. Everything still lands in node.style, so the runtime needs no extra
 * concept — this is only a friendlier way to write it.
 */
const SIZE_MODES = [
  { key: "fill", label: "Fill", title: "Take the full width of the parent" },
  { key: "grow", label: "Auto", title: "Share the space equally with its siblings" },
  { key: "hug", label: "Hug", title: "Only as wide as the content" },
  { key: "fixed", label: "Fixed", title: "An exact width in pixels" },
];

function readSizeMode(s) {
  if (typeof s.flex === "string" && /^1\s+1/.test(s.flex)) return "grow";
  if (s.width && s.width !== "100%") return "fixed";
  if (s.alignSelf === "flex-start" && !s.width) return "hug";
  return "fill";
}

function sizePatch(mode, current) {
  switch (mode) {
    case "hug":
      return { width: undefined, minWidth: undefined, flex: "0 0 auto", alignSelf: "flex-start" };
    case "grow":
      return { width: undefined, minWidth: "0", flex: "1 1 0", alignSelf: undefined };
    case "fixed":
      return {
        width: current.width && current.width !== "100%" ? current.width : "260px",
        minWidth: undefined,
        flex: "0 0 auto",
        alignSelf: undefined,
      };
    default:
      return { width: "100%", minWidth: undefined, flex: undefined, alignSelf: undefined };
  }
}

function StyleTab({ node, updateStyle }) {
  const s = node.style || {};
  const set = (k, v) => updateStyle(node.id, { [k]: v === "" ? undefined : v }, `style:${node.id}:${k}`);
  const mode = readSizeMode(s);
  return (
    <>
      <Section title="Size" icon="Ruler">
        <div className="dsb-seg is-wide dsbi-sizeseg">
          {SIZE_MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              title={m.title}
              className={mode === m.key ? "is-on" : ""}
              onClick={() => updateStyle(node.id, sizePatch(m.key, s), `size:${node.id}`)}
            >
              {m.label}
            </button>
          ))}
        </div>
        {mode === "fixed" ? (
          <Row label="Width">
            <DebouncedInput
              value={s.width ?? ""}
              onChange={(v) => set("width", /^\d+$/.test(String(v).trim()) ? `${String(v).trim()}px` : v)}
              placeholder="260px"
            />
          </Row>
        ) : null}
        <p className="dsbi-note">
          Drop a component into a Row and it takes an equal share automatically. Turn on “Auto-fit children” on any
          container to keep its children equal as they are added or removed.
        </p>
      </Section>

      <Section title="Spacing" icon="Move">
        <div className="dsbi-grid2">
          <Row label="Padding">
            <DebouncedInput value={s.padding ?? ""} onChange={(v) => set("padding", v)} placeholder="12px" />
          </Row>
          <Row label="Margin">
            <DebouncedInput value={s.margin ?? ""} onChange={(v) => set("margin", v)} placeholder="0 0 8px" />
          </Row>
        </div>
        <div className="dsbi-grid2">
          <Row label="Width">
            <DebouncedInput value={s.width ?? ""} onChange={(v) => set("width", v)} placeholder="100% / 240px" />
          </Row>
          <Row label="Height">
            <DebouncedInput value={s.height ?? ""} onChange={(v) => set("height", v)} placeholder="auto" />
          </Row>
        </div>
        <div className="dsbi-grid2">
          <Row label="Min width">
            <DebouncedInput value={s.minWidth ?? ""} onChange={(v) => set("minWidth", v)} />
          </Row>
          <Row label="Flex">
            <DebouncedInput value={s.flex ?? ""} onChange={(v) => set("flex", v)} placeholder="1 1 auto" />
          </Row>
        </div>
      </Section>

      <Section title="Colour & border" icon="Palette">
        <Row label="Background">
          <ColorField value={s.background} onChange={(v) => set("background", v)} />
        </Row>
        <Row label="Text colour">
          <ColorField value={s.color} onChange={(v) => set("color", v)} />
        </Row>
        <Row label="Border">
          <DebouncedInput value={s.border ?? ""} onChange={(v) => set("border", v)} placeholder="1px solid #e5e9f0" />
        </Row>
        <Row label="Radius">
          <DebouncedInput value={s.borderRadius ?? ""} onChange={(v) => set("borderRadius", v)} placeholder="10px" />
        </Row>
        <Row label="Shadow">
          <DebouncedInput value={s.boxShadow ?? ""} onChange={(v) => set("boxShadow", v)} placeholder="var(--dsb-shadow)" />
        </Row>
      </Section>

      <Section title="Typography" icon="Type" defaultOpen={false}>
        <div className="dsbi-grid2">
          <Row label="Font size">
            <DebouncedInput value={s.fontSize ?? ""} onChange={(v) => set("fontSize", v)} placeholder="13px" />
          </Row>
          <Row label="Weight">
            <DebouncedInput value={s.fontWeight ?? ""} onChange={(v) => set("fontWeight", v)} placeholder="600" />
          </Row>
        </div>
        <Row label="Text align">
          <SelectBox
            value={s.textAlign}
            onChange={(v) => set("textAlign", v)}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
          />
        </Row>
      </Section>
    </>
  );
}

/* ------------------------------------------------------------- data editor */

/** Every field the screen's controls write, except this node's own. */
function formFieldsOf(nodes, selfId) {
  return [...new Set((nodes || []).filter((n) => n.id !== selfId).flatMap(fieldsOf))];
}

function DataTab({ node, screen, setNodeField }) {
  const binding = node.binding || { sourceId: "", path: "", fieldMap: {} };
  const set = (patch) => setNodeField(node.id, "binding", { ...binding, ...patch }, `bind:${node.id}`);
  const sources = Object.values(screen.dataSources || {});
  return (
    <>
      <Section title="Data source" icon="Database">
        {(node.props?.dataMode || "") === "static" ? (
          <p className="dsbi-note">
            This node is on <b>Static rows</b> — its rows are typed in Props and nothing is fetched. Switch{" "}
            <b>Rows come from</b> to <b>Dynamic API</b> in Props to use the source below.
          </p>
        ) : null}
        <Row label="Source" hint="Feeds tables, cards and bound props">
          <SelectBox
            value={binding.sourceId}
            onChange={(v) => set({ sourceId: v })}
            options={sources.map((s) => ({ value: s.id, label: `${s.name} (${s.mode})` }))}
          />
        </Row>
        <Row label="Path inside source" hint="e.g. counts, items[0]">
          <DebouncedInput value={binding.path} onChange={(v) => set({ path: v })} placeholder="" />
        </Row>
      </Section>
      <Section title="Field mapping" icon="ArrowRightLeft" right={<span className="dsbi-badge">{Object.keys(binding.fieldMap || {}).length}</span>}>
        <p className="dsbi-note">
          Map a component prop to a path in the data. Example: <code>value</code> → <code>source.counts.total</code>, or use{" "}
          <code>{"{{rows.ds_x.length}}"}</code> directly in the prop.
        </p>
        <KeyValueEditor
          value={binding.fieldMap || {}}
          onChange={(v) => set({ fieldMap: v })}
          keyPlaceholder="prop"
          valPlaceholder="source.path"
        />
      </Section>
      <Section title="Validation" icon="ShieldCheck" defaultOpen={false}>
        <Row label="Required">
          <Toggle value={!!node.validation?.required} onChange={(v) => setNodeField(node.id, "validation", { ...node.validation, required: v })} />
        </Row>
        <div className="dsbi-grid2">
          <Row label="Min">
            <DebouncedInput type="number" value={node.validation?.min ?? ""} onChange={(v) => setNodeField(node.id, "validation", { ...node.validation, min: v })} />
          </Row>
          <Row label="Max">
            <DebouncedInput type="number" value={node.validation?.max ?? ""} onChange={(v) => setNodeField(node.id, "validation", { ...node.validation, max: v })} />
          </Row>
        </div>
        <div className="dsbi-grid2">
          <Row label="Min length">
            <DebouncedInput type="number" value={node.validation?.minLength ?? ""} onChange={(v) => setNodeField(node.id, "validation", { ...node.validation, minLength: v })} />
          </Row>
          <Row label="Max length">
            <DebouncedInput type="number" value={node.validation?.maxLength ?? ""} onChange={(v) => setNodeField(node.id, "validation", { ...node.validation, maxLength: v })} />
          </Row>
        </div>
        <Row label="Email">
          <Toggle value={!!node.validation?.email} onChange={(v) => setNodeField(node.id, "validation", { ...node.validation, email: v })} />
        </Row>
        <Row label="Regex">
          <DebouncedInput value={node.validation?.regex ?? ""} onChange={(v) => setNodeField(node.id, "validation", { ...node.validation, regex: v })} />
        </Row>
        <Row label="Message">
          <DebouncedInput value={node.validation?.message ?? ""} onChange={(v) => setNodeField(node.id, "validation", { ...node.validation, message: v })} />
        </Row>
      </Section>
      <Section title="Roles & permissions" icon="UserCog" defaultOpen={false}>
        <Row label="Visible to roles" hint="Comma separated. Empty = everyone">
          <DebouncedInput
            value={(node.roles?.visibleTo || []).join(",")}
            onChange={(v) =>
              setNodeField(node.id, "roles", {
                ...node.roles,
                visibleTo: v.split(",").map((x) => x.trim()).filter(Boolean),
              })
            }
          />
        </Row>
        <Row label="Editable by roles">
          <DebouncedInput
            value={(node.roles?.editableBy || []).join(",")}
            onChange={(v) =>
              setNodeField(node.id, "roles", {
                ...node.roles,
                editableBy: v.split(",").map((x) => x.trim()).filter(Boolean),
              })
            }
          />
        </Row>
      </Section>
    </>
  );
}

/* -------------------------------------------------------------- responsive */

function ResponsiveTab({ node, breakpoint, updateResponsive, def }) {
  if (breakpoint === "desktop") {
    return (
      <div className="dsbi-empty">
        <Icon name="Maximize2" size={20} />
        <p>Switch the canvas to Tablet or Mobile to add per-breakpoint overrides. Desktop is the base layout.</p>
      </div>
    );
  }
  const ov = node.responsive?.[breakpoint] || {};
  return (
    <>
      <Section title={`${breakpoint} overrides`}>
        <Row label="Hide on this size">
          <Toggle value={!!ov.hidden} onChange={(v) => updateResponsive(node.id, breakpoint, { hidden: v })} />
        </Row>
        <Row label="Width">
          <DebouncedInput
            value={ov.style?.width ?? ""}
            onChange={(v) => updateResponsive(node.id, breakpoint, { style: { width: v || undefined } }, `rw:${node.id}`)}
            placeholder="100%"
          />
        </Row>
        <Row label="Padding">
          <DebouncedInput
            value={ov.style?.padding ?? ""}
            onChange={(v) => updateResponsive(node.id, breakpoint, { style: { padding: v || undefined } }, `rp:${node.id}`)}
          />
        </Row>
      </Section>
      <Section title="Prop overrides" icon="MonitorSmartphone">
        {(def.propSchema || [])
          .filter((sch) => ["number", "boolean", "select", "text"].includes(sch.type))
          .map((sch) => (
            <PropField
              key={sch.key}
              schema={sch}
              value={ov.props?.[sch.key] ?? node.props?.[sch.key]}
              onChange={(v) => updateResponsive(node.id, breakpoint, { props: { [sch.key]: v } }, `rp:${node.id}:${sch.key}`)}
            />
          ))}
      </Section>
    </>
  );
}

/* ---------------------------------------------------------------- shell */

/** The inspector's prop groups, each with the glyph its header carries. */
const GROUP_ICONS = {
  Content: "LetterText",
  Data: "Database",
  Appearance: "Palette",
  Behaviour: "Zap",
  Layout: "LayoutDashboard",
  Header: "PanelTop",
};

export default function Inspector() {
  const b = useBuilder();
  const { state } = b;
  const node = selectedNode(state);
  const nodes = useMemo(() => allNodes(state), [state.screen.root]);
  const def = node ? getDef(node.type) : null;

  // Hooks must run on every render — compute before the empty-state return.
  const rowCtx = useMemo(
    () => rowContextAt(state.screen.root, node?.id),
    [state.screen.root, node?.id],
  );
  const groups = useMemo(() => {
    const out = {};
    ((def && def.propSchema) || []).forEach((sch) => {
      if (sch.when && !sch.when(node?.props || {})) return;
      const g = sch.group || "Content";
      out[g] = out[g] || [];
      out[g].push(sch);
    });
    return out;
  }, [def, node?.props]);

  /*
   * A grid a button fills only learned its fields from a Test call on that
   * button's action, so pressing Search in Preview left it with live rows and
   * still no columns and no keys to pick. Those rows are taken up the moment
   * the grid is opened here: every key becomes a column when it has none, and
   * a sample is kept as its preview so the canvas and the key lists have data.
   */
  // A table over a screen variable is filled the same way: by whatever the
  // canvas's last run left in {{vars.<name>}}.
  const fromVar = node?.props?.dataMode === "vars";
  const fillAction = node?.props?.dataMode === "action" || fromVar;
  // Not every control's `columns` is a column list — a grid's is a count.
  const hasCols = Array.isArray(node?.props?.columns) && node.props.columns.some((c) => c && c.key);
  const hasPreview = Array.isArray(node?.props?.previewRows) && node.props.previewRows.length > 0;
  useEffect(() => {
    if (!fillAction || (hasCols && hasPreview)) return undefined;
    const id = node.id;
    const ownPreview = Array.isArray(node.props.previewRows) ? node.props.previewRows : [];
    const columns = Array.isArray(node.props.columns) ? node.props.columns : [];
    // The live scope is read, not subscribed to: the rows may land while the
    // grid is already open in edit mode (a Search pressed in the canvas, a
    // data source loading), so it is looked at again until they do.
    const tryBind = () => {
      const live = fromVar ? varRows(node, liveScope()?.vars) : liveScope()?.rows?.[nodeSourceId(id)];
      const rows = (Array.isArray(live) ? live : []).filter((r) => r && typeof r === "object");
      const sample = rows.length ? rows : ownPreview;
      if (!sample.length) return false;
      const patch = {};
      if (!hasPreview) patch.previewRows = sample.slice(0, PREVIEW_ROW_LIMIT);
      if (!hasCols) patch.columns = mergeColumns(columns, deriveColumns(sample));
      b.updateProps(id, patch, `p:${id}:sync`);
      return true;
    };
    if (tryBind()) return undefined;
    const timer = setInterval(() => {
      if (tryBind()) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.id, fillAction, hasCols, hasPreview, node?.props?.rowsVar]);

  /*
   * {{row}} for the event editors: the selected component's first record —
   * its last Sync, else its typed rows or options — so an onSelect chain can
   * pick {{row.ItemName}} from a list and see a value beside it. Only the
   * builder's scope reads it; the running screen never does.
   */
  // Bumped when Preview parks a real picked record for this node.
  const [pickTick, setPickTick] = useState(0);
  useEffect(() => onEventRecord((id) => id === node?.id && setPickTick((t) => t + 1)), [node?.id]);
  const sampleRec = useMemo(() => {
    const pr = node?.props || {};
    const picked = eventRecordOf(node?.id);
    if (picked) return picked;
    // An Auto Complete over an endpoint never offers its fixed `options` —
    // they are the "list" source's placeholders, and as the sample they made
    // {{row}} look like { value, label } whatever the endpoint returns.
    const endpointAc = node?.type === "AutoCompleteInput" && pr.source !== "list";
    const lists = [pr.previewOptions, pr.previewRows, pr.staticRows, endpointAc ? null : pr.options];
    for (const list of lists) {
      const hit = (Array.isArray(list) ? list : []).find((r) => r && typeof r === "object" && !Array.isArray(r));
      if (hit) return hit;
    }
    if (endpointAc) {
      // Not synced yet: at least the keys the box was told about.
      const keys = [pr.optionValueField, pr.optionLabelField, pr.subLabelField].filter(Boolean);
      if (keys.length) return keys.reduce((acc, k) => ({ ...acc, [k]: "" }), {});
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.props, node?.id, node?.type, pickTick]);
  useEffect(() => {
    setEventSample(sampleRec);
    return () => setEventSample(null);
  }, [sampleRec]);

  // Full screen: the panel takes the whole workspace under the toolbar, for a
  // long action chain or a column list that a 360px strip turns into a scroll.
  const [full, setFull] = useState(false);
  const layout = useFullLayout();
  const hasNode = !!(node && def);
  useEffect(() => {
    if (!hasNode) setFull(false);
  }, [hasNode]);
  useEffect(() => {
    if (!full) return undefined;
    // Captured ahead of the shell's own Escape, which would deselect the node
    // and leave nothing to edit. An open picker or a field being typed in keeps
    // its Escape.
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      const el = document.activeElement;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      if (typing || document.querySelector(".dsbi-pop")) return;
      e.stopImmediatePropagation();
      setFull(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [full]);

  // The page header is page chrome, not a node, so it has no propSchema: its
  // settings are the screen's own, the same ones the Data drawer shows.
  if ((!node || !def) && state.headerSelected) {
    return (
      <aside className="dsb-panel-right">
        <header className="dsb-insp-head">
          <span className="dsb-insp-ic" style={{ background: "var(--dsb-primary-soft)" }}>
            <Icon name="PanelTop" size={14} />
          </span>
          <div className="dsb-insp-name">
            <strong>Page header</strong>
            <span>Screen setting</span>
          </div>
        </header>
        <div className="dsb-insp-body">
          <HeaderSection
            screen={state.screen}
            setMeta={b.setMeta}
            patchNode={(id, patch) => b.updateProps(id, patch, `p:${id}:sample`)}
          />
        </div>
      </aside>
    );
  }

  if (!node || !def) {
    return (
      <aside className="dsb-panel-right">
        <div className="dsb-panel-empty">
          <Icon name="MousePointerClick" size={22} />
          <h4>Nothing selected</h4>
          <p>Select a component on the canvas or in the layers tree to edit its properties.</p>
        </div>
      </aside>
    );
  }

  const tab = state.inspectorTab;

  // `onPatchProps` lets an editor write more than its own key — the API picker
  // uses it to drop the columns it discovered onto the component after a Sync.
  const ctx = {
    palette: state.screen.palette,
    columns: Array.isArray(node.props?.columns) ? node.props.columns : [],
    // The whole prop bag, so an editor that needs a sibling's value (the API
    // picker reads the label/value mapping) does not need its own plumbing.
    props: node.props || {},
    // What the component's data actually contains, so a column key is picked
    // from a list rather than retyped. A Sync fills previewRows, static rows are
    // typed in; either way the first row is the shape of the data.
    fieldKeys: rowFieldsOf(node.props),
    // What {{row.…}} means where this node SITS, rather than what it holds
    // itself: a Label + Value inside a drawer has no data of its own, but the
    // record the drawer was opened on is what it is there to show.
    rowFields: rowCtx.fields,
    rowSource: rowCtx.sourceName,
    // Field names of the other controls on the screen — what a dependent
    // select points at.
    formFields: formFieldsOf(nodes, node.id),
    // The whole flattened tree and which node is selected, so a prop can
    // report on the rest of the screen (“which button fills this grid?”).
    nodes,
    nodeId: node.id,
    // What an action editor needs, wherever it is rendered from.
    dataSources: state.screen.dataSources || {},
    patchNode: (id, patch) => b.updateProps(id, patch, `p:${id}:sample`),
    onPatchProps: (patch) => b.updateProps(node.id, patch, `p:${node.id}:sync`),
    // Drops a ready-made subtree at the end of the screen — how a Select + Add
    // designs its add dialog in one click. The new node becomes the selection.
    addSubtree: (subtree) => b.addSubtree(subtree, state.screen.root.id, -1),
    // Modals this screen registered for itself, and the writer that adds one.
    // They live on the screen rather than on the node: two tiles opening the
    // same screen should not each carry their own copy of how to open it.
    appModals: state.screen.appModals || [],
    addAppModal: (entry) => {
      const list = state.screen.appModals || [];
      const next = list.some((e) => e.key === entry.key) ? list.map((e) => (e.key === entry.key ? entry : e)) : [...list, entry];
      b.setMeta({ appModals: next });
    },
  };

  return (
    <ScopeRailContext.Provider value={full}>
    <aside className={`dsb-panel-right${full ? " is-full" : ""}`}>
      <header className="dsb-insp-head">
        <span className="dsb-insp-ic" style={{ background: "var(--dsb-primary-soft)" }}>
          <Icon name={def.icon} size={14} />
        </span>
        <div className="dsb-insp-name">
          <DebouncedInput value={node.name} onChange={(v) => b.updateNode(node.id, { name: v }, `name:${node.id}`)} />
          <span>{def.label}</span>
        </div>
        <div className="dsb-insp-tools">
          <button
            type="button"
            className={full ? "is-on" : ""}
            title={full ? "Exit full screen  (Esc)" : "Expand the properties panel to full screen"}
            aria-pressed={full}
            onClick={() => setFull((f) => !f)}
          >
            <Icon name={full ? "Minimize2" : "Maximize2"} size={14} />
          </button>
          <button type="button" title={node.hidden ? "Show" : "Hide"} onClick={() => b.updateNode(node.id, { hidden: !node.hidden })}>
            <Icon name={node.hidden ? "EyeOff" : "Eye"} size={14} />
          </button>
          <button type="button" title={node.locked ? "Unlock" : "Lock"} onClick={() => b.updateNode(node.id, { locked: !node.locked })}>
            <Icon name="Lock" size={14} />
          </button>
        </div>
      </header>

      <nav className="dsb-insp-tabs">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={tab === t.key ? "is-on" : ""} onClick={() => b.setInspectorTab(t.key)} title={t.label}>
            <Icon name={t.icon} size={13} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Full screen is wide enough to work in two columns: what is being
          edited, and what there is to put in it. `display: contents` in the
          docked case, so the narrow panel's layout is untouched. */}
      <div
        className={`dsb-insp-split${full && !layout.railOpen ? " is-rail-closed" : ""}`}
        ref={layout.splitRef}
        style={full ? { "--dsb-rail-w": `${layout.railW}px` } : undefined}
      >
      <div
        className={`dsb-insp-body${tab === "props" ? " is-props" : ""}`}
        style={full ? { "--dsb-col-w": `${layout.colW}px` } : undefined}
      >
        {tab === "props" ? (
          <>
            {Object.entries(groups).map(([group, list]) => {
              const sec = (
                <Section key={group} title={group} icon={GROUP_ICONS[group] || "SlidersHorizontal"}>
                  {list.map((sch) => (
                    <PropField
                      key={sch.key}
                      schema={sch}
                      value={node.props?.[sch.key]}
                      ctx={ctx}
                      onChange={(v) => b.updateProps(node.id, { [sch.key]: v }, `p:${node.id}:${sch.key}`)}
                    />
                  ))}
                </Section>
              );
              // Full screen lays the groups out side by side; the right edge
              // of any of them is a handle that sets the width of all the
              // columns, so the grid reflows into more or fewer of them.
              return full ? (
                <div key={group} className="dsb-insp-cell">
                  {sec}
                  <span
                    className="dsb-insp-colgrip"
                    title="Drag to make the sections wider or narrower — double-click to reset"
                    onPointerDown={layout.startCol}
                    onDoubleClick={layout.resetCol}
                  />
                </div>
              ) : (
                sec
              );
            })}
            {!Object.keys(groups).length ? <p className="dsbi-note">This component has no editable props.</p> : null}
          </>
        ) : null}

        {tab === "style" ? <StyleTab node={node} updateStyle={b.updateStyle} /> : null}
        {tab === "data" ? <DataTab node={node} screen={state.screen} setNodeField={b.setNodeField} /> : null}
        {tab === "events" ? (
          <EventsEditor
            node={node}
            events={def.events}
            nodes={nodes}
            // An action can fill another component; testing it writes that
            // component's preview rows and columns, so the editor needs to be
            // able to patch a node other than the selected one.
            patchNode={(id, patch) => b.updateProps(id, patch, `p:${id}:sample`)}
            dataSources={state.screen.dataSources}
            // Same record the prop pickers offer: a payload assembled here is
            // usually about the row this node sits on.
            rowFields={rowCtx.fields}
            rowSource={rowCtx.sourceName}
            onChange={(events) => b.setNodeField(node.id, "events", events)}
          />
        ) : null}
        {tab === "rules" ? (
          <Section title="Conditional visibility" icon="Eye">
            <p className="dsbi-note">
              {rowCtx.fields.length
                ? `Pick a field of ${rowCtx.sourceName || "the record"} this sits on, or another control on the screen. `
                : "Reference other controls with values.fieldName. "}
              Variables are <code>vars.x</code> and the signed-in role is <code>user.role</code> — type either straight in.
            </p>
            <VisibilityRulesEditor
              value={node.rules?.visibility}
              onChange={(v) => b.setNodeField(node.id, "rules", { ...node.rules, visibility: v })}
              // The record this node stands on — a rule inside a drawer is
              // almost always about the row the drawer was opened on.
              rowFields={rowCtx.fields}
              rowSource={rowCtx.sourceName}
              formFields={formFieldsOf(nodes, node.id)}
            />
          </Section>
        ) : null}
        {tab === "colors" ? (
          <Section title="Conditional colour rules" icon="Palette">
            <p className="dsbi-note">
              Rules run top to bottom; the first match for each target wins. Table rows read <code>row</code> fields directly.
            </p>
            <ColorRulesEditor
              value={node.rules?.color}
              palette={state.screen.palette}
              onChange={(v) => b.setNodeField(node.id, "rules", { ...node.rules, color: v })}
            />
          </Section>
        ) : null}
        {tab === "responsive" ? (
          <ResponsiveTab node={node} def={def} breakpoint={state.breakpoint} updateResponsive={b.updateResponsive} />
        ) : null}
      </div>

        {full ? (
          <div
            className="dsb-insp-gutter"
            onPointerDown={layout.railOpen ? layout.startRail : undefined}
            onDoubleClick={layout.railOpen ? layout.resetRail : undefined}
            title={layout.railOpen ? "Drag to resize — double-click to reset" : undefined}
          >
            <button
              type="button"
              className="dsb-insp-gutter-btn"
              title={layout.railOpen ? "Hide “What this screen holds”" : "Show “What this screen holds”"}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => layout.setRailOpen((o) => !o)}
            >
              <Icon name={layout.railOpen ? "ChevronRight" : "ChevronLeft"} size={12} />
            </button>
          </div>
        ) : null}
        {full ? (
          <aside className="dsb-insp-rail" aria-hidden={!layout.railOpen}>
            <div className="dsb-insp-rail-in">
              <ScopeBrowser docked />
            </div>
          </aside>
        ) : null}
      </div>

      <footer className="dsb-insp-foot">
        <span className="dsb-id">{node.id}</span>
        <button type="button" className="dsbi-mini" onClick={() => b.duplicate(node.id)}>
          <Icon name="Copy" size={12} /> Duplicate
        </button>
        <button type="button" className="dsbi-mini is-danger" onClick={() => b.removeNodes([node.id])}>
          <Icon name="Trash2" size={12} /> Delete
        </button>
      </footer>
    </aside>
    </ScopeRailContext.Provider>
  );
}

/* ---------------------------------------------------- full screen layout */

const LAYOUT_KEY = "dsb.inspector.full.v1";
const RAIL_DEFAULT = 420;
const COL_DEFAULT = 420;
const readLayout = () => {
  try {
    return JSON.parse(window.localStorage.getItem(LAYOUT_KEY) || "{}") || {};
  } catch (e) {
    return {};
  }
};

/**
 * The full-screen inspector's own sizes: how wide the "What this screen holds"
 * rail is, whether it is open, and how wide the property columns are. Dragged
 * with the pointer, remembered per browser — a layout someone has settled on
 * should not reset every time they select a different component.
 */
function useFullLayout() {
  const saved = useMemo(readLayout, []);
  const [railW, setRailW] = useState(Number(saved.railW) || RAIL_DEFAULT);
  const [railOpen, setRailOpen] = useState(saved.railOpen !== false);
  const [colW, setColW] = useState(Number(saved.colW) || COL_DEFAULT);
  const splitRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(LAYOUT_KEY, JSON.stringify({ railW, railOpen, colW }));
    } catch (e) {
      /* a private window: the sizes simply are not remembered */
    }
  }, [railW, railOpen, colW]);

  /** One drag: `apply(dx)` on every move, cursor and selection held meanwhile. */
  const drag = useCallback((e, apply, cursor) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const x0 = e.clientX;
    const body = document.body;
    const prev = { cursor: body.style.cursor, select: body.style.userSelect };
    body.style.cursor = cursor;
    body.style.userSelect = "none";
    // Follows the pointer exactly while dragging; the eased transition is for
    // the fold button only.
    body.classList.add("dsb-resizing");
    const move = (ev) => apply(ev.clientX - x0);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      body.style.cursor = prev.cursor;
      body.style.userSelect = prev.select;
      body.classList.remove("dsb-resizing");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, []);

  const startRail = useCallback(
    (e) => {
      const w0 = railW;
      const total = splitRef.current?.getBoundingClientRect().width || window.innerWidth;
      // The editor keeps at least 420px; the rail between 260px and 60%.
      const max = Math.max(260, Math.min(total * 0.6, total - 420));
      drag(e, (dx) => setRailW(Math.round(Math.min(max, Math.max(260, w0 - dx)))), "col-resize");
    },
    [railW, drag],
  );
  const startCol = useCallback(
    (e) => {
      const w0 = colW;
      drag(e, (dx) => setColW(Math.round(Math.min(1200, Math.max(280, w0 + dx)))), "col-resize");
    },
    [colW, drag],
  );

  return {
    railW,
    railOpen,
    setRailOpen,
    colW,
    splitRef,
    startRail,
    startCol,
    resetRail: () => setRailW(RAIL_DEFAULT),
    resetCol: () => setColW(COL_DEFAULT),
  };
}
