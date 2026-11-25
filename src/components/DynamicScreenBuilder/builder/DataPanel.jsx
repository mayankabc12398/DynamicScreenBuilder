/**
 * Screen settings: metadata, data sources (API or static mock), and screen
 * variables. Everything here lives in the JSON, so a screen designed against
 * mock data becomes live by flipping one source from "static" to "api".
 */
import React, { useMemo, useState } from "react";
import Icon from "../registry/icons";
import { createDataSource, createScreenHeader } from "../schema/schema";
import { screenHasHeaderNode } from "../utils/breadcrumb";
import { useBuilder } from "../store/builderStore";
import { flatten } from "../utils/tree";
import {
  ActionListEditor,
  ActionsEditor,
  DebouncedInput,
  IconField,
  KeyValueEditor,
  Row,
  Section,
  SelectBox,
  Toggle,
} from "./editors";
import ApiPicker from "./ApiPicker";

/* ------------------------------------------------------------- catalog glue */
/**
 * A screen-level source and a component's endpoint config hold the same facts
 * in different shapes: a source is flat (url, method, params as key/value),
 * an endpoint config is the catalog's (controller, relative path, typed
 * parameters with a source each). These two convert between them, so the same
 * searchable picker can fill in a source and nobody has to type a URL by hand.
 */
const cfgFromSource = (src) => ({
  controller: src.controller || "",
  endpoint: src.url || "",
  method: src.method || "GET",
  responsePath: src.responsePath || "",
  autoLoad: src.autoLoad !== false,
  bodyJson: src.bodyJson || "",
  params: [
    ...Object.entries(src.params || {}).map(([name, value]) => ({ name, value, source: "Query", type: "string" })),
    ...Object.entries(src.body || {}).map(([name, value]) => ({ name, value, source: "Body", type: "string" })),
  ],
});

const sourceFromCfg = (cfg) => {
  const params = {};
  const body = {};
  (cfg.params || []).forEach((prm) => {
    if (!prm?.name) return;
    if (prm.source === "Body" || prm.source === "Form") body[prm.name] = prm.value ?? "";
    else params[prm.name] = prm.value ?? "";
  });
  return {
    controller: cfg.controller || "",
    url: cfg.endpoint || "",
    method: cfg.method || "GET",
    responsePath: cfg.responsePath || "",
    autoLoad: cfg.autoLoad !== false,
    bodyJson: cfg.bodyJson || "",
    params,
    body,
  };
};

function SourceCard({ src, onChange, onRemove }) {
  const [jsonErr, setJsonErr] = useState("");
  return (
    <div className="dsb-src">
      <div className="dsb-src-head">
        <Icon name="Database" size={13} />
        <DebouncedInput value={src.name} onChange={(v) => onChange({ name: v })} placeholder="Source name" />
        <code className="dsb-src-id">{src.id}</code>
        <button type="button" className="dsbi-x" onClick={onRemove} title="Delete source">
          <Icon name="Trash2" size={12} />
        </button>
      </div>

      <Row label="Mode">
        <div className="dsb-seg is-wide">
          <button type="button" className={src.mode === "static" ? "is-on" : ""} onClick={() => onChange({ mode: "static" })}>
            Mock / static
          </button>
          <button type="button" className={src.mode === "api" ? "is-on" : ""} onClick={() => onChange({ mode: "api" })}>
            API
          </button>
        </div>
      </Row>

      {src.mode === "api" ? (
        <>
          <Section title="Pick from the API catalog" defaultOpen={!src.url}>
            <ApiPicker
              mode="source"
              value={cfgFromSource(src)}
              onChange={(cfg) => onChange(sourceFromCfg(cfg))}
            />
          </Section>
          <Row label="URL" hint="Relative to the app API base, or absolute">
            <DebouncedInput value={src.url} onChange={(v) => onChange({ url: v })} placeholder="Emergency/SearchPatients" />
          </Row>
          <Row label="Method">
            <SelectBox
              value={src.method}
              onChange={(v) => onChange({ method: v })}
              options={["GET", "POST", "PUT", "DELETE"].map((m) => ({ value: m, label: m }))}
            />
          </Row>
          <Row label="Response path" hint="Where the array lives, e.g. data.result.items">
            <DebouncedInput value={src.responsePath} onChange={(v) => onChange({ responsePath: v })} />
          </Row>
          <Row label="Auto load on open">
            <Toggle value={src.autoLoad !== false} onChange={(v) => onChange({ autoLoad: v })} />
          </Row>
          <Section title="Query params" defaultOpen={false}>
            <KeyValueEditor value={src.params} onChange={(v) => onChange({ params: v })} valPlaceholder="{{values.uhid}}" />
          </Section>
          <Section title="Body" defaultOpen={false}>
            <KeyValueEditor value={src.body} onChange={(v) => onChange({ body: v })} valPlaceholder="{{values.fromDate}}" />
          </Section>
          <Section title="Headers" defaultOpen={false}>
            <KeyValueEditor value={src.headers} onChange={(v) => onChange({ headers: v })} />
          </Section>
        </>
      ) : (
        <Row label="Static rows (JSON array)" stack>
          <textarea
            className="dsbi-input dsbi-code"
            rows={8}
            defaultValue={JSON.stringify(src.staticData || [], null, 2)}
            onBlur={(e) => {
              try {
                const parsed = JSON.parse(e.target.value || "[]");
                setJsonErr("");
                onChange({ staticData: Array.isArray(parsed) ? parsed : [parsed] });
              } catch (err) {
                setJsonErr(err.message);
              }
            }}
          />
          {jsonErr ? <div className="dsb-err-line">{jsonErr}</div> : null}
        </Row>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- page header */

const HEADER_MODES = [
  { value: "auto", label: "Automatic" },
  { value: "on", label: "Always show it" },
  { value: "off", label: "Never — the screen draws its own" },
];

const HEADER_SHOWS = [
  { value: "crumb", label: "The breadcrumb from the menu" },
  { value: "title", label: "A title I type" },
];

/**
 * The header the finished page wears.
 *
 * It is the app's own <Heading />, so a generated screen opens looking like a
 * hand-coded one — and on <b>Automatic</b> nobody has to switch it on: it shows
 * unless the screen already carries a Breadcrumb bar or Page Heading of its
 * own, which is what keeps a screen from ending up with two.
 *
 * Shown in the Data drawer and in the inspector when the header is clicked on
 * the canvas. `patchNode` is what an action chain's editor writes sample data
 * with, the same as for any component.
 */
export function HeaderSection({ screen, setMeta, patchNode }) {
  const header = { ...createScreenHeader(), ...(screen.header || {}) };
  const set = (patch) => setMeta({ header: { ...header, ...patch } });
  const own = screenHasHeaderNode(screen.root);
  const shows = header.showBreadcrumb === false ? "title" : "crumb";
  const nodes = useMemo(() => flatten(screen.root), [screen.root]);
  const dataSources = screen.dataSources || {};

  return (
    <>
      <Section title="Page header" icon="PanelTop">
        <p className="dsbi-note">
          The same header bar every hand-coded page uses. The trail is read from the menu the API
          returns for this screen — the screen does not spell it out, so it stays right when the menu
          is renamed.
        </p>
        <Row label="Show it" hint={header.mode === "auto" || !header.mode ? "Hidden while the screen has its own header node" : ""}>
          <SelectBox allowEmpty={false} value={header.mode || "auto"} onChange={(v) => set({ mode: v })} options={HEADER_MODES} />
        </Row>
        <Row label="It shows">
          <SelectBox
            allowEmpty={false}
            value={shows}
            onChange={(v) => set({ showBreadcrumb: v === "crumb" })}
            options={HEADER_SHOWS}
          />
        </Row>
        <Row
          label={shows === "crumb" ? "Fallback title" : "Title"}
          hint={shows === "crumb" ? "Used when the menu has no entry for this screen yet" : ""}
        >
          <DebouncedInput value={header.title || ""} onChange={(v) => set({ title: v })} placeholder={screen.name} />
        </Row>
        <Row label="Title icon" hint="Before a typed title; in the modern skin, in the heading's tile">
          <IconField value={header.icon} onChange={(v) => set({ icon: v })} suggestFrom={header.title || screen.name} />
        </Row>
        {(header.mode || "auto") === "auto" && own ? (
          <p className="dsbi-note">
            This screen has a <b>Breadcrumb bar</b> or <b>Page Heading</b> of its own, so the automatic
            header is standing aside. Delete that node, or set <b>Always show it</b>, to use this one.
          </p>
        ) : null}
      </Section>

      <Section title="Right side" icon="PanelRight">
        <Row label="Text" hint="Can read the screen's values: {{values.UHID}}, {{vars.ward}}">
          <DebouncedInput value={header.rightText || ""} onChange={(v) => set({ rightText: v })} placeholder="UHID: {{values.UHID}}" />
        </Row>
        {header.rightText ? (
          <Row label="Text icon">
            <IconField value={header.rightIcon} onChange={(v) => set({ rightIcon: v })} suggestFrom={header.rightText} />
          </Row>
        ) : null}
        <Row label="Count badge" hint="A number or {{…}}; the modern skin shows it beside the title">
          <DebouncedInput value={header.count || ""} onChange={(v) => set({ count: v })} placeholder="12" />
        </Row>
        <Row label="Search box">
          <Toggle value={!!header.showSearch} onChange={(v) => set({ showSearch: v })} />
        </Row>
        {header.showSearch ? (
          <>
            <Row label="Placeholder">
              <DebouncedInput value={header.searchPlaceholder || ""} onChange={(v) => set({ searchPlaceholder: v })} placeholder="Search…" />
            </Row>
            <Row label="Saves to field" hint={`Read it anywhere as {{values.${header.searchField || "headerSearch"}}}`}>
              <DebouncedInput value={header.searchField || ""} onChange={(v) => set({ searchField: v })} placeholder="headerSearch" />
            </Row>
            <Section title="On search" icon="Zap" defaultOpen={!!(header.onSearch || []).length}>
              <ActionListEditor
                value={header.onSearch || []}
                onChange={(v) => set({ onSearch: v })}
                nodes={nodes}
                dataSources={dataSources}
                patchNode={patchNode}
              />
              <p className="dsbi-note">
                Runs a moment after typing stops. <code>{"{{value}}"}</code> is the text typed.
              </p>
            </Section>
          </>
        ) : null}
      </Section>

      <Section title="Buttons" icon="MousePointerClick">
        <ActionsEditor
          as="buttons"
          value={header.buttons || []}
          onChange={(v) => set({ buttons: v })}
          nodes={nodes}
          dataSources={dataSources}
          patchNode={patchNode}
        />
      </Section>
    </>
  );
}

export default function DataPanel({ onClose }) {
  const b = useBuilder();
  const { state } = b;
  const screen = state.screen;
  const sources = Object.values(screen.dataSources || {});

  const patchSource = (id, patch) =>
    b.setDataSources({ ...screen.dataSources, [id]: { ...screen.dataSources[id], ...patch } });

  const removeSource = (id) => {
    const next = { ...screen.dataSources };
    delete next[id];
    b.setDataSources(next);
  };

  return (
    <div className="dsb-drawer-panel">
      <header className="dsb-dp-head">
        <Icon name="Database" size={15} />
        <h3>Screen settings & data</h3>
        <button type="button" onClick={onClose}>
          <Icon name="X" size={15} />
        </button>
      </header>

      <div className="dsb-dp-body">
        <Section title="Screen">
          <Row label="Name">
            <DebouncedInput value={screen.name} onChange={(v) => b.setMeta({ name: v })} />
          </Row>
          <Row label="Category">
            <DebouncedInput value={screen.category} onChange={(v) => b.setMeta({ category: v })} placeholder="Emergency" />
          </Row>
          <Row label="Description" stack>
            <textarea className="dsbi-input" rows={2} defaultValue={screen.description} onBlur={(e) => b.setMeta({ description: e.target.value })} />
          </Row>
          <Row label="Screen id" hint="Used by the route /screen/:screenId">
            <code className="dsb-src-id is-block">{screen.id}</code>
          </Row>
        </Section>

        <HeaderSection
          screen={screen}
          setMeta={b.setMeta}
          patchNode={(id, patch) => b.updateProps(id, patch, `p:${id}:sample`)}
        />

        <Section title="Data sources" right={<span className="dsbi-badge">{sources.length}</span>}>
          {sources.map((s) => (
            <SourceCard key={s.id} src={s} onChange={(patch) => patchSource(s.id, patch)} onRemove={() => removeSource(s.id)} />
          ))}
          <button
            type="button"
            className="dsbi-add"
            onClick={() => {
              const ds = createDataSource(`Source ${sources.length + 1}`);
              b.setDataSources({ ...screen.dataSources, [ds.id]: ds });
            }}
          >
            <Icon name="Plus" size={12} /> Add data source
          </button>
        </Section>

        <Section title="Screen variables" defaultOpen={false}>
          <p className="dsbi-note">
            Seed values available to every binding as <code>{"{{vars.name}}"}</code>.
          </p>
          <KeyValueEditor value={screen.variables} onChange={(v) => b.setVariables(v)} />
        </Section>

        <Section
          title="Screen parameters"
          defaultOpen={!!Object.keys(screen.params || {}).length}
          right={<span className="dsbi-badge">{Object.keys(screen.params || {}).length}</span>}
        >
          <p className="dsbi-note">
            What the screen is opened <b>with</b>, read as <code>{"{{params.name}}"}</code>: the URL (
            <code>/screen/{screen.id}?embeddedUHID=123</code>), a navigate&rsquo;s <code>state.params</code>, or the props of
            a page that embeds it (<code>{`<ScreenRoute screenId="${screen.id}" embeddedUHID={uhid} />`}</code>). The value
            here is only for the canvas and Preview — clear it to try the screen opened without one.
          </p>
          <KeyValueEditor
            value={screen.params || {}}
            onChange={(v) => b.setMeta({ params: v })}
            keyPlaceholder="embeddedUHID"
            valPlaceholder="preview value"
          />
          <p className="dsbi-note">
            To act on one when the screen opens — fill and lock the UHID box, start a year back, search at once — select
            the <b>Screen</b> in Layers and put the chain on its <b>onLoad</b>, each step with a “Run only when{" "}
            <code>params.embeddedUHID</code> is not empty”. A rule on a control can test it the same way.
          </p>
        </Section>
      </div>
    </div>
  );
}
