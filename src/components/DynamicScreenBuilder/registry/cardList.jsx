/**
 * CARD LIST — one card per record, from any list the screen can reach.
 *
 * The bed picker, the doctor roster, the package chooser: a record becomes a
 * card with an icon or logo, a title, a status and a value, and clicking it
 * either selects it (as a form answer) or runs a chain — or both.
 *
 *   Where the records come from   the same three ways a Table has — rows typed
 *                                 in, the component's own endpoint (picked from
 *                                 the catalog, Sync for a canvas preview), or
 *                                 rows a button pushed into it — plus a shared
 *                                 data source from the Data tab. `resolveRows`
 *                                 is the table's own, so the two cannot drift.
 *   What a card shows             `card*` props, each a template read against
 *                                 THAT card's record: "{{row.BedName}}",
 *                                 "₹ {{row.Rate | fixed:2}}". They are listed in
 *                                 `deferProps` so the renderer leaves them alone
 *                                 — it only has the screen's scope, not the card's.
 *   Anything else on a card       drop it in. Children are the card template:
 *                                 designed once on the first card, drawn on every
 *                                 card, each copy standing on its own record
 *                                 (runtime/repeatScope). A Button inside reads
 *                                 {{row.BedID}} in its payload like a row icon.
 *   What a click does             `selectMode` none / single / multi. A selection
 *                                 is a form value — {{values.<field>}} — so a Save
 *                                 posts it like any input, Required validates it
 *                                 and Reset clears it. onCardClick carries the
 *                                 record either way; the whole selection is
 *                                 {{grid.<id>.selected}}.
 *   Colours                       an accent (a swatch, or {{row.Colour}}), and the
 *                                 Colors tab per record: accent, card, border,
 *                                 icon, chip (the status) and text. "Colour
 *                                 coding" can instead hand every card its own
 *                                 pastel — in turn, or one per value of a field.
 *   Card design                   "classic" is the row card every saved screen
 *                                 has. "halo" is a centred stat card: the icon in
 *                                 a soft ring, the value as a badge on it, title
 *                                 and caption, then a footer of meta lines. Same
 *                                 props, same data, same clicks — only the look.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState, filterOptionRows, GROUPS, Icon, p, resolveDynamicColor, Skeleton } from "./shared";
import AppHeading from "./appHeading";
import { ICONS } from "./icons";
import { makeSampleRows, resolveRows, rowsVarProps, VARS_MODE_OPTION } from "./dataDisplay";
import { createApiConfig, isApiConfigReady, normalizeApiConfig } from "../utils/apiConfig";
import { DEFERRED_PROP_KEYS, getPath, interpolate } from "../utils/expressions";
import { resolveColor } from "../utils/colorRules";
import { humanizeKey, templateFields } from "../utils/rowContext";
import { RepeatContext } from "../runtime/repeatScope";
import { tr } from "../utils/i18n";

/** Props written once but read once PER CARD, against that card's record. */
const CARD_PROPS = [
  "cardIcon",
  "cardImage",
  "cardTitle",
  "cardSubtitle",
  "cardStatus",
  "cardValue",
  "cardValueLabel",
  "cardTooltip",
  "cardAccent",
  "cardMeta1",
  "cardMeta2",
];

const DEFER = new Set([...DEFERRED_PROP_KEYS, ...CARD_PROPS]);

const NO_ROWS = [];

/**
 * The pastel set "Colour coding" deals from. Each is the deep tone — the icon,
 * the badge, the caption; the pastel ring, wash and border are mixed from it
 * in the stylesheet, so one value per colour is all a card needs.
 */
const PASTELS = ["#2563eb", "#0d9488", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0891b2", "#ca8a04"];

/** Same value, same colour — on every screen and every reload. */
function hashIndex(v, n) {
  const s = String(v);
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % n;
}

const isHalo = (pr) => pr.cardStyle === "halo";

/** What a template resolved to, as text — an object or a missing field shows nothing. */
const text = (v) => (v === null || v === undefined || typeof v === "object" ? "" : String(v));

/** "240", 240, "240px", "50vh" — a number is pixels, anything else is CSS. */
const cssSize = (v) => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? String(v) : `${n}px`;
};

/** Same list, same rows, same order — reference equality, no deep walk. */
function sameRows(a, b) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * The icon tile or the logo.
 *
 * A logo URL from the data is tried first; one that will not load falls back
 * to the icon rather than to a broken-image glyph. The failure is kept per URL,
 * so a record that changes its logo is tried afresh.
 */
function CardMedia({ src, icon, size, shape, color, bg }) {
  const [failed, setFailed] = useState("");
  const useImg = !!src && failed !== src;
  const name = icon && ICONS[icon] ? icon : "LayoutGrid";
  return (
    <span
      className={`dsb-cl-media s-${shape || "rounded"}${useImg ? " is-img" : ""}`}
      style={{ width: size, height: size, ...(useImg ? null : { color: color || undefined, background: bg || undefined }) }}
    >
      {useImg ? (
        <img src={src} alt="" draggable={false} onError={() => setFailed(src)} />
      ) : (
        <Icon name={name} size={Math.round(size * 0.5)} />
      )}
    </span>
  );
}

/** The inspector section the list's own header settings sit in. */
const HEADER = "Header";

/** Anything a click inside a card must keep for itself. */
const OWN_CLICK = "button, a, input, select, textarea, label, [role='button'], [data-dsb-interactive]";

const CardListDef = {
  type: "CardList",
  label: "Card List",
  icon: "LayoutGrid",
  category: "Data",
  isContainer: true,
  dropHint: "Drop controls here — they repeat on every card",
  bindable: true,
  deferProps: DEFER,
  defaultProps: {
    title: "",
    headerSubtitle: "",
    headerIcon: "",
    headerColor: "",
    titleColor: "",
    headerStyle: "app",
    countStyle: "badge",
    countLabel: "",
    summaryField: "",
    summaryFilter: true,
    headerHeight: "",
    headerIconSize: "",
    headerTitleSize: "",
    headerSubtitleSize: "",
    countSize: "",
    chipSize: "",
    dataMode: "static",
    staticRows: [],
    apiConfig: createApiConfig(),
    /** Written by the picker's Sync button; design-time only, never fetched. */
    previewRows: [],
    dataSourceId: "",
    rowKeyField: "",
    rowFilters: [],
    groupField: "",

    cardIcon: "LayoutGrid",
    cardImage: "",
    cardTitle: "{{row.Name}}",
    cardSubtitle: "",
    cardStatus: "{{row.Status}}",
    cardValue: "",
    cardValueLabel: "",
    cardTooltip: "",
    cardMeta1: "",
    cardMeta1Icon: "CalendarDays",
    cardMeta2: "",
    cardMeta2Icon: "Clock",
    cardStatusIcon: "",

    cardStyle: "classic",
    haloFill: "soft",
    palette: "accent",
    paletteField: "",
    cardAccent: "",
    cardAccentDefault: "",
    border: "accent",
    mediaShape: "rounded",
    mediaSize: "",
    titleSize: "",
    subtitleSize: "",
    statusSize: "",
    valueSize: "",
    cardMinHeight: "",
    wrapTitle: false,
    compact: false,

    layout: "grid",
    perRow: "",
    minCardWidth: 240,
    gap: 12,
    maxHeight: "",

    selectMode: "none",
    field: "",
    valueField: "",
    selectedText: "Selected",
    selectedColor: "",
    showCheck: true,
    allowDeselect: true,
    clickableWhen: [],
    searchable: false,
    /** Keys the search box looks in; empty looks in every field. */
    searchFields: [],
    searchPlaceholder: "",
    searchWidth: null,
    emptyText: "No records found",
    disabled: false,
  },
  defaultStyle: {},
  events: ["onCardClick", "onChange", "onLoad"],
  propSchema: [
    /* --- header -------------------------------------------------------- */
    p.text("title", "Title", HEADER, { placeholder: "Total Beds" }),
    p.text("headerSubtitle", "Subtitle", HEADER, { placeholder: "General ward · 2nd floor" }),
    p.icon("headerIcon", "Icon", HEADER),
    p.color("headerColor", "Colour", HEADER, {
      hint: "The icon tile, the count and the band. Empty follows the theme's primary colour.",
    }),
    p.color("titleColor", "Title colour", HEADER),
    p.select(
      "headerStyle",
      "Style",
      [
        { value: "app", label: "App heading — same as the pages and cards" },
        { value: "softband", label: "Soft band — tinted, coloured edge" },
        { value: "card", label: "Card — white, with a shadow" },
        { value: "underline", label: "Underline" },
        { value: "plain", label: "Plain" },
      ],
      HEADER,
    ),
    p.select(
      "countStyle",
      "Count",
      [
        { value: "badge", label: "Solid badge" },
        { value: "soft", label: "Soft pill" },
        { value: "big", label: "Large number" },
        { value: "none", label: "Hidden" },
      ],
      HEADER,
    ),
    p.text("countLabel", "Count caption", HEADER, {
      placeholder: "Beds",
      when: (pr) => pr.countStyle !== "none",
      hint: "Shown after the number — “12 Beds”.",
    }),
    p.dataKey("summaryField", "Summary chips from", HEADER, {
      hint: "One chip per value with its count — Available 3 · Occupied 1 — in the same colours as the cards.",
    }),
    p.bool("summaryFilter", "Click a chip to show only those", HEADER, { when: (pr) => !!pr.summaryField }),
    // The box sits on the right of the header, so it is set up here rather
    // than with the card behaviour.
    p.bool("searchable", "Search box", HEADER, { hint: "A box on the right of the header that narrows the cards below as the user types." }),
    p.dataKeys("searchFields", "Search in", HEADER, {
      when: (pr) => !!pr.searchable,
      placeholder: "Add a field to search…",
      emptyNote: "Every field of the record. Add fields to search only those — Bed No and Room, not the status.",
      hint: "Several words must each be found in one of these fields: “gw 12” finds room GW1, bed 12.",
    }),
    p.text("searchPlaceholder", "Search placeholder", HEADER, {
      when: (pr) => !!pr.searchable,
      placeholder: "Empty names the fields — “Search Bed No, Room Name…”",
    }),
    p.number("searchWidth", "Search box width (px)", HEADER, { when: (pr) => !!pr.searchable, hint: "Empty keeps 170." }),
    p.number("headerHeight", "Header height (px)", HEADER, { hint: "The least it is; it still grows to fit. Empty fits the content." }),
    p.number("headerIconSize", "Icon size (px)", HEADER, {
      when: (pr) => !!pr.headerIcon,
      hint: "Empty keeps 18. The tile around it grows with it.",
    }),
    p.number("headerTitleSize", "Title size (px)", HEADER, { hint: "Empty keeps 15." }),
    p.number("headerSubtitleSize", "Subtitle size (px)", HEADER, { when: (pr) => !!pr.headerSubtitle, hint: "Empty keeps 12." }),
    p.number("countSize", "Count size (px)", HEADER, {
      when: (pr) => pr.countStyle !== "none",
      hint: "Empty keeps 12 — 24 for a large number.",
    }),
    p.number("chipSize", "Chip text size (px)", HEADER, { when: (pr) => !!pr.summaryField, hint: "Empty keeps 12." }),

    /* --- data ---------------------------------------------------------- */
    p.select(
      "dataMode",
      "Cards come from",
      [
        { value: "static", label: "Static rows (edited here)" },
        { value: "api", label: "Dynamic API (endpoint or data source)" },
        { value: "action", label: "Filled by a button / action" },
        VARS_MODE_OPTION,
      ],
      GROUPS.DATA,
    ),
    ...rowsVarProps(GROUPS.DATA),
    { key: "staticRows", label: "Rows", type: "rows", group: GROUPS.DATA, when: (pr) => (pr.dataMode || "static") === "static" },
    { key: "apiConfig", label: "API endpoint", type: "apiEndpoint", mode: "cards", group: GROUPS.DATA, when: (pr) => pr.dataMode === "api" },
    {
      key: "actionNote",
      label: "How this is filled",
      type: "note",
      group: GROUPS.DATA,
      when: (pr) => pr.dataMode === "action",
      text: (ctx) => {
        const feeders = (ctx?.nodes || []).filter((n) =>
          Object.values(n.events || {}).some((list) => (list || []).some((a) => a?.type === "callApi" && a.targetId === ctx.nodeId)),
        );
        if (feeders.length) return `Filled by ${feeders.map((n) => n.name).join(", ")}. Press it in Preview to see real cards.`;
        return "Nothing fills this yet. Select a button, open its Events tab, add a Call API action, pick the endpoint, then set “Put the rows into” to this component.";
      },
    },
    p.text("dataSourceId", "Shared data source id", GROUPS.DATA, {
      when: (pr) => pr.dataMode === "api" && !isApiConfigReady(pr.apiConfig),
      hint: "Or pick one in the Data tab. Leave empty when the endpoint above is set.",
    }),
    p.dataKey("rowKeyField", "Record key field", GROUPS.DATA, {
      hint: "The field that identifies a record — BedID, DoctorID. A selection is remembered against it when no value field is set below.",
    }),
    {
      key: "rowFilters",
      label: "Show only records where",
      type: "optionFilters",
      group: GROUPS.DATA,
      note: "A card is drawn only when its record matches every line. Filtering happens after the call, so one endpoint can feed several lists.",
    },
    p.dataKey("groupField", "Group cards by", GROUPS.DATA, {
      hint: "One heading per value — ward, floor, department. Empty draws one list.",
    }),

    /* --- card content --------------------------------------------------- */
    {
      key: "__cardNote",
      label: "What each card shows",
      type: "note",
      group: GROUPS.CONTENT,
      text: "Every box below is read once per record — the picker beside it writes {{row.Field}}, and text around it stays as typed. Anything else a card needs (a button, a chip, a second value) is dropped onto the FIRST card on the canvas; it repeats on every card with that card's record.",
    },
    p.icon("cardIcon", "Icon", GROUPS.CONTENT),
    p.template("cardImage", "Logo / image URL", GROUPS.CONTENT, {
      placeholder: "{{row.LogoUrl}}",
      hint: "Wins over the icon. An empty field or a link that will not load falls back to the icon.",
    }),
    p.template("cardTitle", "Title", GROUPS.CONTENT, { placeholder: "{{row.RoomName}} / {{row.BedNo}}" }),
    p.template("cardSubtitle", "Subtitle", GROUPS.CONTENT, { placeholder: "{{row.Floor}}" }),
    p.template("cardStatus", "Status", GROUPS.CONTENT, {
      placeholder: "{{row.Status}}",
      hint: "Drawn after a dot in the accent colour. A Colors-tab rule with target Chip / badge recolours it per value.",
    }),
    p.template("cardValue", "Value (right side)", GROUPS.CONTENT, { placeholder: "₹ {{row.Rate | fixed:2}}" }),
    p.template("cardValueLabel", "Value caption", GROUPS.CONTENT, { placeholder: "Per day" }),
    p.template("cardTooltip", "Tooltip", GROUPS.CONTENT, { placeholder: "{{row.Remarks}}" }),
    p.icon("cardStatusIcon", "Status icon", GROUPS.CONTENT, {
      when: isHalo,
      hint: "Drawn before the status line in the footer. Empty keeps the coloured dot.",
    }),
    p.template("cardMeta1", "Footer line 1", GROUPS.CONTENT, {
      when: isHalo,
      placeholder: "{{row.Date}}",
      hint: "Halo cards: a small line in the footer, beside line 2. Empty hides it.",
    }),
    p.icon("cardMeta1Icon", "Footer line 1 icon", GROUPS.CONTENT, { when: (pr) => isHalo(pr) && !!pr.cardMeta1 }),
    p.template("cardMeta2", "Footer line 2", GROUPS.CONTENT, { when: isHalo, placeholder: "{{row.Time}}" }),
    p.icon("cardMeta2Icon", "Footer line 2 icon", GROUPS.CONTENT, { when: (pr) => isHalo(pr) && !!pr.cardMeta2 }),

    /* --- appearance ----------------------------------------------------- */
    p.select("cardStyle", "Card design", [
      { value: "classic", label: "Classic — icon, text and value in a row" },
      { value: "halo", label: "Halo — centred icon in a ring, value badge" },
    ]),
    p.select(
      "haloFill",
      "Card fill",
      [
        { value: "soft", label: "Soft — a pastel wash behind the icon" },
        { value: "pastel", label: "Pastel — the whole card tinted" },
        { value: "white", label: "White" },
      ],
      GROUPS.APPEARANCE,
      { when: isHalo },
    ),
    p.select("palette", "Colour coding", [
      { value: "accent", label: "One accent for every card" },
      { value: "cycle", label: "Pastel palette — each card in turn" },
      { value: "field", label: "Pastel palette — one colour per value of a field" },
    ], GROUPS.APPEARANCE, {
      hint: "A palette colours the icon, ring, badge and border of each card. A Colors-tab rule with target Accent still wins.",
    }),
    p.dataKey("paletteField", "Colour by field", GROUPS.APPEARANCE, {
      when: (pr) => pr.palette === "field",
      hint: "Every record with the same value gets the same colour — the doctor, the ward, the status.",
    }),
    p.dynamicColor("cardAccent", "Accent colour", GROUPS.APPEARANCE, {
      when: (pr) => !pr.palette || pr.palette === "accent",
      hint: "Border, icon and status. {{row.ColorCode}} lets every record bring its own; a Colors-tab rule with target Accent wins over both.",
    }),
    p.select("border", "Border", [
      { value: "accent", label: "Accent colour" },
      { value: "neutral", label: "Neutral — accent on hover" },
    ]),
    p.select("mediaShape", "Icon / logo shape", [
      { value: "rounded", label: "Rounded square" },
      { value: "circle", label: "Circle" },
      { value: "square", label: "Square" },
    ], GROUPS.APPEARANCE, { when: (pr) => !isHalo(pr) }),
    p.number("mediaSize", "Icon / logo size (px)", GROUPS.APPEARANCE, { hint: "Empty keeps 36 (30 when compact); 64 on a halo card." }),
    p.number("titleSize", "Card title size (px)", GROUPS.APPEARANCE, { hint: "Empty keeps 14 (13 when compact)." }),
    p.number("subtitleSize", "Card subtitle size (px)", GROUPS.APPEARANCE, { hint: "Empty keeps 12." }),
    p.number("statusSize", "Status size (px)", GROUPS.APPEARANCE, { hint: "Empty keeps 12.5. The dot grows with it." }),
    p.number("valueSize", "Value size (px)", GROUPS.APPEARANCE, { hint: "Empty keeps 14." }),
    p.number("cardMinHeight", "Card min height (px)", GROUPS.APPEARANCE, {
      hint: "Every card at least this tall, so a row of cards lines up. Empty fits the content.",
    }),
    p.bool("wrapTitle", "Wrap long titles", GROUPS.APPEARANCE, {
      hint: "Off cuts a long title with … and shows it whole on hover.",
    }),
    p.bool("compact", "Compact", GROUPS.APPEARANCE),

    /* --- layout --------------------------------------------------------- */
    p.select(
      "layout",
      "Arrange cards",
      [
        { value: "grid", label: "Grid — wraps onto new lines" },
        { value: "list", label: "List — one card per line" },
        { value: "row", label: "One row — scrolls sideways" },
      ],
      GROUPS.LAYOUT,
    ),
    p.number("perRow", "Cards per row", GROUPS.LAYOUT, {
      when: (pr) => (pr.layout || "grid") === "grid",
      hint: "Empty fits as many as the minimum width allows, so a phone gets one and a wide screen gets five.",
    }),
    p.number("minCardWidth", "Card width (px)", GROUPS.LAYOUT, {
      when: (pr) => (pr.layout || "grid") !== "list",
      hint: "The narrowest a card gets in a grid; the exact width in one row.",
    }),
    p.number("gap", "Gap (px)", GROUPS.LAYOUT),
    p.text("maxHeight", "Max height", GROUPS.LAYOUT, {
      placeholder: "360, 360px or 50vh",
      hint: "Past this the cards scroll. Empty grows with the list.",
    }),

    /* --- behaviour ------------------------------------------------------ */
    p.select(
      "selectMode",
      "Clicking a card",
      [
        { value: "none", label: "Runs onCardClick only" },
        { value: "single", label: "Selects it — one at a time" },
        { value: "multi", label: "Selects it — several" },
      ],
      GROUPS.BEHAVIOUR,
    ),
    p.text("field", "Form field", GROUPS.BEHAVIOUR, {
      when: (pr) => pr.selectMode === "single" || pr.selectMode === "multi",
      placeholder: "BedID",
      hint: "The selection is saved as {{values.<this>}}, so a Save payload reads it like any input. Empty uses the component id.",
    }),
    p.dataKey("valueField", "Value to store", GROUPS.BEHAVIOUR, {
      when: (pr) => pr.selectMode === "single" || pr.selectMode === "multi",
      hint: "Which field of the record is the answer — BedID. Empty stores the record key. Several selected is a list of them.",
    }),
    p.text("selectedText", "Status when selected", GROUPS.BEHAVIOUR, {
      when: (pr) => pr.selectMode === "single" || pr.selectMode === "multi",
      hint: "Replaces the status line on a selected card. Empty keeps the record's own.",
    }),
    p.bool("allowDeselect", "Click again to clear", GROUPS.BEHAVIOUR, { when: (pr) => pr.selectMode === "single" }),
    p.color("selectedColor", "Selected colour", GROUPS.APPEARANCE, {
      when: (pr) => pr.selectMode === "single" || pr.selectMode === "multi",
      hint: "Border and tick of a selected card. Empty uses the accent.",
    }),
    p.bool("showCheck", "Tick on the selected card", GROUPS.APPEARANCE, {
      when: (pr) => pr.selectMode === "single" || pr.selectMode === "multi",
    }),
    {
      key: "clickableWhen",
      label: "Clickable only when",
      type: "optionFilters",
      group: GROUPS.BEHAVIOUR,
      note: "A card whose record fails any line is drawn faded and cannot be clicked or selected — an occupied bed, a doctor on leave. Empty means every card is clickable.",
    },
    p.text("emptyText", "Empty text"),
    p.bool("disabled", "Disabled", GROUPS.BEHAVIOUR),
  ],
  render: ({ node, props, style, rt, scope, children }) => {
    const design = !!rt?.design;
    const { rows: fetched, loading, error, sourceId } = resolveRows(node, props, rt);

    // The component's own endpoint loads when the rendered screen opens —
    // never on the canvas, where a keystroke in the inspector is not a reason
    // to call a live endpoint.
    const api = props.apiConfig;
    const apiKey = useMemo(() => (isApiConfigReady(api) ? JSON.stringify(normalizeApiConfig(api)) : ""), [api]);
    const refreshNode = rt?.refreshNode;
    useEffect(() => {
      if (!apiKey || design || !refreshNode) return;
      const cfg = JSON.parse(apiKey);
      if (cfg.autoLoad === false) return;
      refreshNode(node.id, cfg);
    }, [apiKey, design, refreshNode, node.id]);

    /**
     * Placeholder cards, canvas only.
     *
     * Nothing typed in and nothing synced yet: draw a few cards from the fields
     * the template names, so the card can be designed before the data exists.
     * The live screen never sees them — an empty list renders as empty.
     */
    // The field the palette colours by is sampled too, so the canvas shows the
    // colours spread across the cards rather than one colour for all.
    const sampleKey = [
      ...new Set([...templateFields(props, CARD_PROPS), ...(props.palette === "field" && props.paletteField ? [props.paletteField] : [])]),
    ].join("|");
    // A name is not a picture: the fields the icon and logo read get a real
    // icon and no URL, instead of "Ramesh Kumar" fetched as an image.
    const mediaKey = templateFields(props, ["cardIcon", "cardImage"]).join("|");
    const samples = useMemo(() => {
      if (!design || !sampleKey) return NO_ROWS;
      const media = new Set(mediaKey ? mediaKey.split("|") : []);
      return makeSampleRows(sampleKey.split("|").map((key) => ({ key })), 4).map((r) => {
        const out = { ...r, __sample: true };
        media.forEach((k) => {
          out[k] = "";
        });
        return out;
      });
    }, [design, sampleKey, mediaKey]);
    const apiRows = fetched.length || !design ? fetched : samples;

    /**
     * What identifies a record — computed on the whole result before any
     * filter, so a search that hides half the cards cannot move a positional
     * key onto somebody else's bed.
     */
    const keyFor = useMemo(() => {
      const map = new Map();
      apiRows.forEach((row, i) => {
        const named = props.rowKeyField ? getPath(row, props.rowKeyField) : undefined;
        const guessed = row?.id ?? row?.Id ?? row?.ID;
        const k = named !== undefined && named !== null && named !== "" ? named : guessed !== undefined && guessed !== null && guessed !== "" ? guessed : `i_${i}`;
        map.set(row, String(k));
      });
      return map;
    }, [apiRows, props.rowKeyField]);

    // A record's place in the whole result, for a palette dealt in turn — so a
    // search or a chip filter does not repaint the cards that stay.
    const indexOf = useMemo(() => {
      const map = new Map();
      apiRows.forEach((row, i) => map.set(row, i));
      return map;
    }, [apiRows]);

    // The screen scope is a fresh object each render; filters only need it
    // when they run, so it is read through a ref rather than depended on.
    const scopeRef = useRef(scope);
    scopeRef.current = scope;

    const filtersKey = JSON.stringify(props.rowFilters || []);
    const rows = useMemo(
      () => filterOptionRows(apiRows, props.rowFilters, scopeRef.current || {}),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [apiRows, filtersKey],
    );

    /**
     * The header's summary: one entry per value of `summaryField`, in the
     * order the values first arrive, with a record to colour the chip by.
     */
    const summary = useMemo(() => {
      if (!props.summaryField) return NO_ROWS;
      const at = new Map();
      const out = [];
      rows.forEach((r) => {
        const v = text(getPath(r, props.summaryField)) || "—";
        if (!at.has(v)) {
          at.set(v, out.length);
          out.push({ value: v, count: 0, row: r });
        }
        out[at.get(v)].count += 1;
      });
      return out;
    }, [rows, props.summaryField]);

    // A chip picked in the header. A value the list no longer holds (a new
    // search, a reload) stops filtering rather than leaving the list empty.
    const [picked, setPicked] = useState("");
    const pick = props.summaryField && props.summaryFilter !== false && summary.some((s) => s.value === picked) ? picked : "";

    const [query, setQuery] = useState("");
    // The fields the box looks in. Empty is every field, which is what it did
    // before this could be chosen — and still the right answer for a list
    // nobody has thought about. Chosen, a "2" stops matching every bed on the
    // second floor when only the bed number was meant.
    const searchKeys = useMemo(
      () => (Array.isArray(props.searchFields) ? props.searchFields.filter((k) => typeof k === "string" && k.trim()) : []),
      [props.searchFields],
    );
    const shown = useMemo(() => {
      // Each word on its own: "gw 12" is room GW1 AND bed 12, which no one
      // field holds as typed.
      const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let out = rows;
      if (pick) out = out.filter((r) => (text(getPath(r, props.summaryField)) || "—") === pick);
      if (!terms.length) return out;
      return out.filter((r) => {
        const hay = (searchKeys.length ? searchKeys.map((k) => getPath(r, k)) : Object.values(r || {}))
          .filter((v) => v !== null && v !== undefined && typeof v !== "object")
          .map((v) => String(v).toLowerCase());
        return terms.every((t) => hay.some((v) => v.includes(t)));
      });
    }, [rows, query, pick, props.summaryField, searchKeys]);

    /* ------------------------------------------------------- selection */

    const selecting = props.selectMode === "single" || props.selectMode === "multi";
    const multi = props.selectMode === "multi";
    const field = props.field || node.id;
    const current = rt?.values?.[field];
    const valueOf = (row) => (props.valueField ? getPath(row, props.valueField) : keyFor.get(row));

    // The answer lives in the form, not in the component: a Save reads it,
    // Reset clears it and a Set value action can pre-select a card.
    const chosen = useMemo(() => {
      if (!selecting) return new Set();
      const list = Array.isArray(current) ? current : current === undefined || current === null || current === "" ? [] : [current];
      return new Set(list.map((v) => String(v)));
    }, [current, selecting]);

    const isChosen = (row) => {
      const v = valueOf(row);
      return v !== undefined && v !== null && chosen.has(String(v));
    };

    const clickable = (row) =>
      !props.disabled && filterOptionRows([row], props.clickableWhen, scopeRef.current || {}).length > 0;

    /**
     * Publish what the list holds — {{grid.<id>.selected}} / .rows / .pageRows —
     * the same names a Table publishes, so a payload does not care which drew it.
     */
    const publish = rt?.setGrid;
    const publishedRef = useRef(null);
    useEffect(() => {
      if (design || !publish) return;
      const selected = selecting ? rows.filter(isChosen) : NO_ROWS;
      const prev = publishedRef.current;
      if (prev && sameRows(prev.rows, rows) && sameRows(prev.selected, selected) && sameRows(prev.pageRows, shown)) return;
      publishedRef.current = { rows, selected, pageRows: shown };
      publish(node.id, { rows, selected, checked: selected, pageRows: shown });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, shown, chosen, selecting, publish, node.id, design]);

    const press = (row, e) => {
      if (design) return;
      // A button or input inside the card answers its own click.
      const hit = e?.target?.closest?.(OWN_CLICK);
      if (hit && hit !== e.currentTarget && e.currentTarget.contains(hit)) return;
      if (!clickable(row)) return;

      let next = current;
      let on = false;
      if (selecting) {
        const v = valueOf(row);
        const was = isChosen(row);
        if (multi) {
          const list = Array.isArray(current) ? current : current === undefined || current === null || current === "" ? [] : [current];
          next = was ? list.filter((x) => String(x) !== String(v)) : [...list, v];
          on = !was;
        } else if (was) {
          next = props.allowDeselect === false ? v : "";
          on = props.allowDeselect === false;
        } else {
          next = v;
          on = true;
        }
        // Written before the chains run, so an onChange that searches or saves
        // sees the card just picked rather than the one before it.
        rt?.setValue?.(field, next);
        rt?.setSelection?.(node.id, on ? row : null);
      }
      rt?.runEvent(node, "onCardClick", { row, value: valueOf(row), selected: on });
      if (selecting) rt?.runEvent(node, "onChange", { row, value: next, field, selected: on });
    };

    /* ----------------------------------------------------------- look */

    const compact = !!props.compact;
    const halo = isHalo(props);
    const mediaPx = Number(props.mediaSize) > 0 ? Number(props.mediaSize) : halo ? (compact ? 52 : 64) : compact ? 30 : 36;
    const haloFill = ["soft", "pastel", "white"].includes(props.haloFill) ? props.haloFill : "soft";
    const layout = props.layout || "grid";
    const perRow = Number(props.perRow) || 0;
    const minW = Number(props.minCardWidth) > 0 ? Number(props.minCardWidth) : 240;
    const gap = props.gap === "" || props.gap === null || props.gap === undefined || Number.isNaN(Number(props.gap)) ? 12 : Number(props.gap);
    const listStyle = { gap };
    if (layout === "grid") {
      listStyle.gridTemplateColumns = perRow
        ? `repeat(${perRow}, minmax(0, 1fr))`
        : `repeat(auto-fill, minmax(min(${minW}px, 100%), 1fr))`;
    } else if (layout === "row") {
      listStyle.gridAutoColumns = `${minW}px`;
    }
    const rules = node.rules?.color;
    const selColorProp = resolveDynamicColor(props.selectedColor);

    /** The palette's colour for a record, or "" when the list keeps one accent. */
    const paletteOf = (row) => {
      if (props.palette === "cycle") return PASTELS[(indexOf.get(row) ?? 0) % PASTELS.length];
      if (props.palette === "field" && props.paletteField) {
        return PASTELS[hashIndex(text(getPath(row, props.paletteField)), PASTELS.length)];
      }
      return "";
    };

    /** A record's accent: a Colors-tab rule, else the palette, else the accent prop, else the theme. */
    const accentOf = (row) => {
      const r = resolveColor(rules, row, "accent", scope);
      const dealt = paletteOf(row);
      const own = !dealt && typeof props.cardAccent === "string" ? text(interpolate(props.cardAccent, { ...scope, row })) : "";
      return r?.bg || r?.fg || r?.border || dealt || resolveDynamicColor(own, props.cardAccentDefault) || "var(--dsb-primary)";
    };
    /** What its status line is drawn in — also what its summary chip wears. */
    const statusColorOf = (row, accent) => {
      const r = resolveColor(rules, row, "chip", scope);
      return r?.fg || r?.bg || accent || accentOf(row);
    };

    // Canvas only: the first card is the template (its children are the ones
    // being edited); the second shows what a selected card looks like.
    let position = 0;

    const card = (row) => {
      const at = position;
      position += 1;
      const key = keyFor.get(row) ?? `p_${at}`;
      const s = { ...scope, row };
      const read = (v) => (typeof v === "string" ? text(interpolate(v, s)) : text(v));

      const sel = selecting && (design ? at === 1 : isChosen(row));
      const canClick = clickable(row);

      const accent = accentOf(row);
      const selColor = selColorProp || accent;
      const cardRule = resolveColor(rules, row, "card", scope);
      const borderRule = resolveColor(rules, row, "border", scope);
      const iconRule = resolveColor(rules, row, "icon", scope);
      const textRule = resolveColor(rules, row, "text", scope);

      const ruleBorder = borderRule?.border || borderRule?.bg || borderRule?.fg || cardRule?.border || "";
      const border = sel ? selColor : ruleBorder || (props.border === "neutral" ? "" : accent);

      const title = read(props.cardTitle);
      const subtitle = read(props.cardSubtitle);
      const status = sel && props.selectedText ? tr(props.selectedText) : read(props.cardStatus);
      const statusColor = sel ? selColor : statusColorOf(row, accent);
      const value = read(props.cardValue);
      const valueLabel = read(props.cardValueLabel);
      const tooltip = read(props.cardTooltip);
      const image = read(props.cardImage);
      const icon = read(props.cardIcon);
      const iconColor = iconRule?.fg || iconRule?.border || accent;
      const iconBg = iconRule?.bg || "";

      const hasClick = selecting || (node.events?.onCardClick || []).length > 0;
      const preview = design && at > 0;

      const statusLine = status ? (
        <div className="dsb-cl-status" style={{ color: statusColor }}>
          {halo && props.cardStatusIcon ? (
            <Icon name={ICONS[props.cardStatusIcon] ? props.cardStatusIcon : "CircleUser"} size={14} />
          ) : (
            <i className="dsb-cl-dot" style={{ background: statusColor }} />
          )}
          <span>{status}</span>
        </div>
      ) : null;

      let inner;
      if (halo) {
        const metas = [
          [read(props.cardMeta1), props.cardMeta1Icon],
          [read(props.cardMeta2), props.cardMeta2Icon],
        ].filter(([v]) => v);
        inner = (
          <>
            <div className="dsb-cl-halo-top">
              <span className="dsb-cl-halo" style={iconBg ? { "--cl-halo": iconBg } : undefined}>
                {/* The icon sits solid in the accent, white on it; a Colors-tab
                    icon rule still recolours either part. */}
                <CardMedia
                  src={image}
                  icon={icon}
                  size={mediaPx}
                  shape="circle"
                  color={iconRule?.fg || "#fff"}
                  bg={iconRule?.border || accent}
                />
                {value ? (
                  <span className="dsb-cl-halo-badge" title={valueLabel ? `${valueLabel} ${value}` : undefined}>
                    {valueLabel ? <em>{valueLabel}</em> : null}
                    <b>{value}</b>
                  </span>
                ) : null}
              </span>
            </div>
            <div className="dsb-cl-halo-text">
              {title ? (
                <div className="dsb-cl-title" title={props.wrapTitle ? undefined : title} style={textRule?.fg ? { color: textRule.fg } : undefined}>
                  {title}
                </div>
              ) : null}
              {subtitle ? <div className="dsb-cl-sub">{subtitle}</div> : null}
            </div>
            {metas.length || statusLine ? (
              <div className="dsb-cl-halo-foot">
                {metas.length ? (
                  <div className="dsb-cl-halo-metas">
                    {metas.map(([v, ic], i) => (
                      <span key={i} className="dsb-cl-halo-meta">
                        {ic ? <Icon name={ICONS[ic] ? ic : "Info"} size={13} /> : null}
                        <span>{v}</span>
                      </span>
                    ))}
                  </div>
                ) : null}
                {statusLine}
              </div>
            ) : null}
          </>
        );
      } else {
        inner = (
          <div className="dsb-cl-main">
            {/* Configured is enough: a record whose icon field is empty or not
                an icon name gets the default tile, so the cards stay aligned. */}
            {props.cardImage || props.cardIcon ? (
              <CardMedia src={image} icon={icon} size={mediaPx} shape={props.mediaShape} color={iconColor} bg={iconBg} />
            ) : null}
            <div className="dsb-cl-text">
              {title ? (
                <div className="dsb-cl-title" title={props.wrapTitle ? undefined : title} style={textRule?.fg ? { color: textRule.fg } : undefined}>
                  {title}
                </div>
              ) : null}
              {subtitle ? <div className="dsb-cl-sub">{subtitle}</div> : null}
              {statusLine}
            </div>
            {value ? (
              <div className="dsb-cl-value">
                {valueLabel ? <span>{valueLabel}</span> : null}
                <strong>{value}</strong>
              </div>
            ) : null}
          </div>
        );
      }

      return (
        <div
          key={key}
          className={[
            "dsb-cl-card",
            halo ? `is-halo f-${haloFill}` : "",
            sel ? "is-selected" : "",
            canClick ? "" : "is-disabled",
            hasClick && canClick ? "is-clickable" : "",
            preview ? "is-preview" : "",
            row?.__sample ? "is-sample" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            "--cl-accent": accent,
            "--cl-sel": selColor,
            ...(border ? { "--cl-border": border } : null),
            background: cardRule?.bg || undefined,
            color: cardRule?.fg || undefined,
          }}
          role={selecting ? (multi ? "checkbox" : "radio") : hasClick ? "button" : undefined}
          aria-checked={selecting ? sel : undefined}
          aria-disabled={canClick ? undefined : true}
          tabIndex={hasClick && canClick && !design ? 0 : undefined}
          title={tooltip || undefined}
          onClick={(e) => press(row, e)}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
            e.preventDefault();
            press(row, e);
          }}
        >
          {sel && props.showCheck !== false ? (
            <span className="dsb-cl-check" aria-hidden="true">
              <Icon name="Check" size={11} strokeWidth={3} />
            </span>
          ) : null}
          {inner}
          {children ? (
            <div className="dsb-cl-body">
              <RepeatContext.Provider value={{ row, preview }}>{children}</RepeatContext.Provider>
            </div>
          ) : null}
        </div>
      );
    };

    /* ---------------------------------------------------------- states */

    /**
     * The header: icon tile, title and count on the left; summary chips,
     * search and refresh on the right. Drawn only when something asks for it,
     * so a bare list stays a bare list.
     */
    // "band" was the default before the app heading existed, so screens saved
    // with it get the app heading; the old band is "softband" now.
    const headStyle = !props.headerStyle || props.headerStyle === "band" ? "app" : props.headerStyle === "softband" ? "band" : props.headerStyle;
    const countStyle = props.countStyle || "badge";
    const narrowed = shown.length !== rows.length;
    /**
     * Sizes typed in the inspector, as custom properties on the list. The
     * stylesheet reads each one with the old size as its fallback, so an empty
     * box changes nothing — and the Style tab's own font size still applies
     * underneath a card title nobody sized here.
     */
    const pxOf = (v) => (Number(v) > 0 ? Number(v) : 0);
    const headIconPx = pxOf(props.headerIconSize);
    const sizeVars = {};
    const setPx = (name, v) => {
      const n = pxOf(v);
      if (n) sizeVars[name] = `${n}px`;
    };
    setPx("--cl-head-minh", props.headerHeight);
    // The tile keeps the 18-in-36 proportion it has by default.
    if (headIconPx) sizeVars["--cl-head-ic"] = `${headIconPx * 2}px`;
    setPx("--cl-head-fs", props.headerTitleSize);
    setPx("--cl-head-sub-fs", props.headerSubtitleSize);
    setPx("--cl-count-fs", props.countSize);
    setPx("--cl-chip-fs", props.chipSize);
    setPx("--cl-title-fs", props.titleSize);
    setPx("--cl-sub-fs", props.subtitleSize);
    setPx("--cl-status-fs", props.statusSize);
    setPx("--cl-value-fs", props.valueSize);
    setPx("--cl-card-minh", props.cardMinHeight);
    setPx("--cl-search-w", props.searchWidth);

    const countEl =
      countStyle === "none" || loading ? null : (
        <span className={`dsb-cl-count c-${countStyle}`} title={narrowed ? `${shown.length} of ${rows.length}` : undefined}>
          {narrowed ? `${shown.length} / ${rows.length}` : rows.length}
          {props.countLabel ? <em>{tr(props.countLabel)}</em> : null}
        </span>
      );
    const chipsClickable = props.summaryFilter !== false;
    const chips = summary.length ? (
      <div className="dsb-cl-sums" data-dsb-interactive>
        {summary.map((s) => {
          const color = statusColorOf(s.row);
          const on = pick === s.value;
          const Tag = chipsClickable ? "button" : "span";
          return (
            <Tag
              key={s.value}
              type={chipsClickable ? "button" : undefined}
              className={`dsb-cl-sum${on ? " is-on" : ""}${pick && !on ? " is-dim" : ""}`}
              style={{ "--cl-sum": color }}
              aria-pressed={chipsClickable ? on : undefined}
              title={chipsClickable ? (on ? "Show all" : `Show only ${s.value}`) : undefined}
              onClick={chipsClickable ? () => setPicked(on ? "" : s.value) : undefined}
            >
              <i className="dsb-cl-dot" />
              <span>{tr(s.value)}</span>
              <b>{s.count}</b>
            </Tag>
          );
        })}
      </div>
    ) : null;
    const hasHead = !!(props.title || props.headerIcon || props.headerSubtitle || props.searchable || summary.length);
    const clTools = (
          <div className="dsb-cl-tools" data-dsb-interactive>
            {props.searchable ? (
              <label className="dsb-cl-search">
                <Icon name="Search" size={13} />
                <input
                  type="search"
                  value={query}
                  placeholder={
                    // "Search…" was the old default, so it counts as unset.
                    props.searchPlaceholder && props.searchPlaceholder !== "Search…"
                      ? tr(props.searchPlaceholder)
                      : searchKeys.length
                        ? `${tr("Search")} ${searchKeys.map((k) => tr(humanizeKey(k))).join(", ")}…`
                        : tr("Search…")
                  }
                  aria-label={tr("Search")}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            ) : null}
            {sourceId && !design ? (
              <button type="button" className="dsb-icon-btn" title="Refresh" onClick={() => rt?.refresh(sourceId, { force: true })}>
                <Icon name="RefreshCw" size={14} />
              </button>
            ) : null}
          </div>
    );
    const bar = !hasHead ? null : headStyle === "app" ? (
      <AppHeading
        title={props.title ? tr(props.title) : ""}
        icon={props.headerIcon || undefined}
        count={countStyle === "none" || loading ? undefined : narrowed ? `${shown.length} / ${rows.length}` : rows.length}
        // The caption reads after the number elsewhere ("12 Beds"); on the
        // heading's right it leads: "Total Beds : 12".
        countLabel={props.countLabel ? `${tr("Total")} ${tr(props.countLabel)} :` : tr("Total Records :")}
        className="is-cl-head"
        right={
          <>
            {props.headerSubtitle ? <span className="dsb-apphead-sub">{tr(props.headerSubtitle)}</span> : null}
            {chips}
            {clTools}
          </>
        }
      />
    ) : (
      <div
        className={`dsb-cl-head hs-${headStyle}`}
        style={{
          ...(resolveDynamicColor(props.headerColor) ? { "--cl-head": resolveDynamicColor(props.headerColor) } : null),
          ...(resolveDynamicColor(props.titleColor) ? { "--cl-head-fg": resolveDynamicColor(props.titleColor) } : null),
        }}
      >
        <div className="dsb-cl-head-main">
          {props.headerIcon ? (
            <span className="dsb-cl-head-ic">
              <Icon name={props.headerIcon} size={headIconPx || 18} />
            </span>
          ) : null}
          <div className="dsb-cl-head-text">
            <div className="dsb-cl-head-title">
              {props.title ? <span>{tr(props.title)}</span> : null}
              {countEl}
            </div>
            {props.headerSubtitle ? <div className="dsb-cl-head-sub">{tr(props.headerSubtitle)}</div> : null}
          </div>
        </div>
        <div className="dsb-cl-head-side">
          {chips}
          {clTools}
        </div>
      </div>
    );

    const error_ = selecting ? rt?.errors?.[field] : "";
    const wrapClass = `dsb-cardlist${compact ? " is-compact" : ""}${props.wrapTitle ? " wraps-title" : ""}`;
    const wrapStyle = { ...style, ...sizeVars };

    if (loading) {
      return (
        <div className={wrapClass} style={wrapStyle}>
          {bar}
          <Skeleton rows={3} height={compact ? 48 : 60} />
        </div>
      );
    }
    if (error) {
      return (
        <div className={wrapClass} style={wrapStyle}>
          {bar}
          <EmptyState
            icon="AlertCircle"
            tone="danger"
            title="Could not load data"
            hint={String(error)}
            action={design ? null : { label: "Try again", icon: "RefreshCw", onClick: () => rt?.refresh(sourceId, { force: true }) }}
          />
        </div>
      );
    }
    if (!shown.length) {
      return (
        <div className={wrapClass} style={wrapStyle}>
          {bar}
          <EmptyState
            icon="LayoutGrid"
            title={tr(props.emptyText || "No records found")}
            hint={query ? "Nothing matches the search." : design ? "Type rows, or pick an endpoint and press Sync." : ""}
          />
          {children && design ? <div className="dsb-cl-body is-orphan">{children}</div> : null}
        </div>
      );
    }

    // Grouped: one heading per value, in the order the records arrive.
    const groups = [];
    if (props.groupField) {
      const at = new Map();
      shown.forEach((r) => {
        const g = text(getPath(r, props.groupField)) || "—";
        if (!at.has(g)) {
          at.set(g, groups.length);
          groups.push({ name: g, rows: [] });
        }
        groups[at.get(g)].rows.push(r);
      });
    }

    const list = (items) => (
      <div className={`dsb-cl-list l-${layout}`} style={listStyle}>
        {items.map(card)}
      </div>
    );

    // A list with a height to keep to — its own Max height, or a height or max
    // height from the Style tab — scrolls its cards INSIDE that room. Without
    // this a Style height left the cards spilling past the list, and a max
    // height taller than a fixed-height panel ran the last rows under the
    // panel's edge, where no scrolling could reach them.
    const bounded = !!(props.maxHeight || style?.height || style?.maxHeight);
    return (
      <div className={`${wrapClass}${bounded ? " is-bounded" : ""}`} style={wrapStyle}>
        {bar}
        <div
          className={`dsb-cl-scroll${bounded ? " is-scroll" : ""}`}
          style={props.maxHeight ? { maxHeight: cssSize(props.maxHeight) } : undefined}
        >
          {groups.length
            ? groups.map((g) => (
                <section key={g.name} className="dsb-cl-group">
                  <div className="dsb-cl-group-h">
                    <span>{g.name}</span>
                    <em>{g.rows.length}</em>
                  </div>
                  {list(g.rows)}
                </section>
              ))
            : list(shown)}
        </div>
        {error_ ? <div className="dsb-err">{error_}</div> : null}
        {design && apiRows[0]?.__sample ? (
          <div className="dsb-cl-note">
            Sample cards from the fields the template names — type rows, or pick an endpoint and press Sync, to see real ones.
          </div>
        ) : null}
      </div>
    );
  },
};

export default [CardListDef];
