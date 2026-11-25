/**
 * ============================================================================
 *  DYNAMIC SCREEN BUILDER — JSON SCHEMA (single source of truth)
 * ============================================================================
 *
 *  A "screen" is a pure JSON document. The builder produces it, the renderer
 *  consumes it. Nothing about a screen is hardcoded in React — every pixel is
 *  derived from this document plus the component registry.
 *
 *  ---------------------------------------------------------------------------
 *  SCREEN
 *  ---------------------------------------------------------------------------
 *  {
 *    id:          "scr_emergency_search",     // unique, stable
 *    name:        "Emergency Patient Search",
 *    description: "",
 *    category:    "Emergency",                // used by the template library
 *    status:      "draft" | "published",
 *    version:     3,                          // bumped on every publish
 *    createdAt:   ISO string,
 *    updatedAt:   ISO string,
 *
 *    theme: {                                 // see theme/tokens.js
 *      mode:   "light" | "dark",
 *      tokens: { primary:"#2563eb", radius:"10px", ... }
 *    },
 *
 *    header: {                                // the page header the screen
 *      mode:  "auto" | "on" | "off",          // wears, drawn by the app's own
 *      showBreadcrumb: true,                  // <Heading /> so it matches every
 *      title: "",                             // hand-coded page. "auto" stands
 *      icon:  "", color: ""                   // aside when the tree already has
 *    },                                       // a Breadcrumb / Page Heading.
 *
 *    palette: [ { name:"Urgent", bg:"#FDE047", fg:"#713F12" }, ... ],
 *
 *    dataSources: {                           // screen level, referenced by id
 *      ds_patients: {
 *        id:           "ds_patients",
 *        name:         "Patients",
 *        mode:         "api" | "static",
 *        url:          "/api/emergency/search",
 *        method:       "GET" | "POST" | ...,
 *        headers:      { Authorization: "Bearer {{vars.token}}" },
 *        params:       { status: "{{values.status}}" },   // query string
 *        body:         { fromDate: "{{values.fromDate}}" },
 *        responsePath: "data.result.items",   // where the array lives
 *        staticData:   [ {...}, {...} ],      // used when mode === "static"
 *        autoLoad:     true                   // fetch on screen load
 *      }
 *    },
 *
 *    variables: { activeTab: "ALL" },         // seeded screen state
 *
 *    root: <NODE>                             // the component tree
 *  }
 *
 *  ---------------------------------------------------------------------------
 *  NODE
 *  ---------------------------------------------------------------------------
 *  {
 *    id:     "n_9f2c",            // unique within the screen
 *    type:   "DataTable",         // MUST exist in the component registry
 *    name:   "Result Grid",       // shown in the layers tree
 *
 *    props:  { ... },             // component props, shape = registry propSchema
 *    style:  { padding:"12px", background:"var(--dsb-surface)" },  // CSS object
 *
 *    responsive: {                // per-breakpoint overrides (merged over base)
 *      tablet: { hidden:false, props:{ columns:2 }, style:{ padding:"8px" } },
 *      mobile: { hidden:false, props:{ stack:true }, style:{} }
 *    },
 *
 *    binding: {                   // data binding
 *      sourceId: "ds_patients",   // which data source feeds this node
 *      path:     "",              // optional extra path inside the source
 *      fieldMap: { value:"counts.total" }   // prop -> path in the record/object
 *    },
 *
 *    events: {                    // event name -> ordered action list
 *      onRowClick: [
 *        { type:"openPanel",  target:"n_detail" },
 *        { type:"setValue",   field:"selectedId", value:"{{row.PatientId}}" }
 *      ]
 *    },
 *
 *    rules: {
 *      visibility: [ { when:{ field:"values.type", op:"eq", value:"IPD" },
 *                      effect:"show" | "hide" | "enable" | "disable" | "require" } ],
 *      color:      [ { field:"Status", op:"eq", value:"Urgent",
 *                      target:"chip" | "row" | "text" | "icon" | "card",
 *                      bg:"#FDE047", fg:"#713F12", border:"" } ]
 *    },
 *
 *    validation: { required:false, min:null, max:null, minLength:null,
 *                  maxLength:null, regex:"", email:false, message:"" },
 *
 *    roles:  { visibleTo: [], editableBy: [] },   // empty array = everyone
 *
 *    locked: false,               // builder: cannot be selected/dragged
 *    hidden: false,               // builder + runtime: not rendered
 *
 *    children: [ <NODE>, ... ]    // only for registry entries with isContainer
 *  }
 *
 *  ---------------------------------------------------------------------------
 *  BINDING EXPRESSIONS
 *  ---------------------------------------------------------------------------
 *  Any string prop may contain `{{path}}` templates resolved at render time
 *  against the runtime scope:
 *      {{row.PatientName}}   current record (inside a table/repeat)
 *      {{values.uhid}}       form field values
 *      {{vars.activeTab}}    screen variables
 *      {{data.ds_kpi.total}} raw data-source payload
 *      {{user.name}}         logged in user
 * ============================================================================
 */

/** Breakpoints supported by the builder + renderer, widest first. */
export const BREAKPOINTS = [
  { key: "desktop", label: "Desktop", width: 1440, minWidth: 1024 },
  { key: "tablet", label: "Tablet", width: 834, minWidth: 640 },
  { key: "mobile", label: "Mobile", width: 390, minWidth: 0 },
];

/**
 * The node types that count as "a control" when a layout decides how to lay
 * itself out. A row of these is a filter block and wants an even grid; a row of
 * cards or panels is not and must keep the width it was given.
 */
export const FORM_CONTROL_TYPES = [
  "TextInput",
  "NumberInput",
  "PasswordInput",
  "Textarea",
  "SelectInput",
  "SelectAddInput",
  "SearchLookup",
  "AutoCompleteInput",
  "DatePicker",
  "DateRangePicker",
  "TimePicker",
  "CheckboxInput",
  "RadioGroup",
  "SwitchInput",
  "FileUpload",
  "ButtonControl",
];

/** Events any node can expose (registry entries narrow this down). */
export const EVENT_TYPES = [
  "onClick",
  "onChange",
  "onBlur",
  "onFocus",
  "onRowClick",
  "onRowSelect",
  "onRowAction",
  "onCellChange",
  "onRowReorder",
  "onTabChange",
  "onSearch",
  "onReset",
  "onOpen",
  "onClose",
  "onSave",
  "onCancel",
  "onLoad",
];

/**
 * Actions the no-code event editor can attach to an event.
 *
 * Two things every action may carry besides its own fields:
 *
 *   `when`  a condition (same shape as a visibility rule). The action is
 *           skipped when it does not hold, and the chain carries on — which is
 *           how one button reaches a different endpoint per row without a
 *           script. Absent means always run, so nothing saved before this
 *           changes behaviour.
 *   scope   what the actions before it left behind. `callApi` leaves
 *           `{{response.…}}`; see RuntimeContext.runActions.
 */
export const ACTION_TYPES = [
  // `api` is a full endpoint config (utils/apiConfig): controller, route,
  // verb, parameters and body, the same shape a table or a select binds to.
  // `sourceId` re-runs something already on the screen, and url/method/body
  // remain for a hand-written call. First one filled in wins, in that order.
  // `bodyAs` is auto | json | form. Auto (and unset) sends multipart form data
  // only when the body carries a file, so every call saved before it is JSON.
  { type: "callApi", label: "Call API", fields: ["api", "sourceId", "url", "method", "body", "bodyAs", "targetId"] },
  // Put this ABOVE the action it guards: answering "no" stops the chain.
  { type: "confirm", label: "Ask for confirmation", fields: ["message", "title", "okText", "cancelText", "variant"] },
  // The password gate the billing pages put in front of a settlement. Also
  // above the action it guards: a wrong password stops the chain.
  { type: "verifyUser", label: "Ask for the user's password", fields: ["userId", "title"] },
  // Runs the chain in `actions` once per record of `list` — "print every
  // ticked bill". Each pass reads the record as {{row}} / {{item}}, its place
  // as {{index}} / {{number}} and the size of the run as {{count}}.
  { type: "forEach", label: "Repeat for every row", fields: ["list", "actions", "gapMs", "emptyMessage", "stopOnFail"] },
  { type: "navigate", label: "Navigate to route", fields: ["route"] },
  // A URL the server handed back — a rendered PDF, a report, a signed link.
  // `navigate` is for routes inside this app; everything else comes through
  // here, and it reads {{response.…}} left behind by the call before it.
  { type: "openUrl", label: "Open a URL / file", fields: ["url", "target"] },
  // `rowVar` is optional on both: the clicked row is handed to the overlay's
  // contents either way, and naming it additionally stores it as a variable
  // for anything OUTSIDE the overlay to read.
  //
  // A modal may instead be a component of the app: `appModal` then holds its
  // key (utils/appModals — `file:pages/…` for any page or component file) and
  // `target` is empty. It opens in the app-modal host with the action's own
  // `title`, `size`, `props` and `sourceId`; the target picker sets these.
  { type: "openModal", label: "Open modal", fields: ["target", "rowVar"] },
  { type: "closeModal", label: "Close modal", fields: ["target"] },
  // Not a target: the frame menu is the module's own list of patient screens,
  // read per role, and it opens on whatever record the chain is running for.
  { type: "openFrameMenu", label: "Open frame menu (patient screens)", fields: ["frameName", "showPatientHeader"] },
  { type: "closeFrameMenu", label: "Close frame menu", fields: [] },
  // One of the app's own row modals (utils/appModals): Labs, Meds, FlowSheets,
  // Remarks, Waiting type. It opens on the record the chain runs for, and the
  // real component is mounted — not a rebuilt copy of it.
  { type: "openAppModal", label: "Open app modal (Labs / Meds / FlowSheets / Remarks…)", fields: ["appModal", "title", "size", "sourceId"] },
  { type: "closeAppModal", label: "Close app modal", fields: [] },
  { type: "openPanel", label: "Open side panel", fields: ["target", "rowVar"] },
  { type: "closePanel", label: "Close side panel", fields: ["target"] },
  { type: "setValue", label: "Set field value", fields: ["field", "value"] },
  { type: "setVar", label: "Set variable", fields: ["field", "value"] },
  // Kept in the browser's localStorage, so it outlives the screen — read back
  // anywhere as {{local.<storageKey>}} (an object saved here as JSON, so
  // {{local.<key>.Field}} reaches inside it). `storageOp` is set | remove;
  // absent means set.
  { type: "setStorage", label: "Save to local storage", fields: ["storageOp", "storageKey", "value"] },
  // The whole clicked record under one name, rather than a setValue per column.
  { type: "storeRow", label: "Store clicked row in variable", fields: ["rowVar"] },
  // A grid's Edit icon: every control takes its value from the clicked row
  // (matched by field name, or by `map`), and the row is stored as `editVar`
  // so Save / Update can swap on {{vars.editRow}}. Reset form leaves edit mode.
  { type: "fillForm", label: "Edit row — fill form from clicked row", fields: ["within", "editVar", "map"] },
  { type: "refresh", label: "Refresh data source", fields: ["sourceId"] },
  // Editing a grid's rows on the screen, before anything is saved: "Add Panel"
  // appends a row built from a dropdown's choice, the trash icon on that row
  // takes it out. `target` is the table ("" = the table the click came from);
  // `rowValues` is [{ key, value }] with templates; `from` a whole record to
  // start from ({{selected.Panel}}). Save then sends {{grid.<table>.rows}}.
  { type: "addRow", label: "Add row to table", fields: ["gridTarget", "from", "rowValues", "position", "uniqueBy", "duplicateMessage"] },
  { type: "removeRow", label: "Remove row from table", fields: ["gridTarget", "which", "match"] },
  { type: "updateRow", label: "Update row in table", fields: ["gridTarget", "which", "match", "rowValues"] },
  // Another component's chain, as if it had been clicked: Save re-running the
  // Search button's call into the bills grid instead of a copy of it.
  { type: "runEvent", label: "Run another component's action", fields: ["eventTarget", "eventName"] },
  { type: "resetForm", label: "Reset form / filters", fields: [] },
  { type: "toast", label: "Show toast", fields: ["message", "variant"] },
  // Where the rows come from is `via`: "source" (rows a data source or table
  // already holds — the only kind before `via`), "endpoint" (call `api` now
  // and download what it answers, the "Download … Excel Sheet" button of the
  // hand-coded pages) or "list" (a template naming a list, e.g.
  // {{response.data}} or {{grid.<table>.checked}}). `format` is xlsx | csv —
  // absent on older screens, which keep reading it off the file name.
  // `columns` is [{ key, header }]; empty exports every field.
  {
    type: "export",
    label: "Export data",
    fields: ["via", "sourceId", "api", "list", "format", "fileName", "titleRow", "sheetTitle", "sheetSubtitle", "columns", "emptyMessage"],
  },
  { type: "print", label: "Print screen", fields: [] },
  // `within` narrows it to one container's fields — a dialog's Save checks the
  // dialog, not the form behind it. Empty is the whole screen, as before.
  { type: "validate", label: "Validate all fields", fields: ["within"] },
  { type: "script", label: "Run custom JS", fields: ["code"] },
];

/**
 * Which component types actually answer an overlay action.
 *
 * `openModal` flips `ui.modals[<id>]` and only ModalDialog reads that;
 * `openPanel` flips `ui.panels[<id>]`, read by DrawerPanel and SplitView.
 * Pointing one at any other component — a Card / Panel is the easy mistake,
 * since that is what people build the dialog's contents in — leaves a button
 * that fires and a screen that does not move. Both the target picker and the
 * runtime check against this.
 */
export const OVERLAY_TARGETS = {
  modal: { types: ["ModalDialog"], label: "Modal / Dialog" },
  panel: { types: ["DrawerPanel", "SplitView"], label: "Drawer / Side Panel" },
};

/** "openModal" / "closeModal" -> "modal". Empty for non-overlay actions. */
export const overlayKind = (actionType) =>
  /Modal$/.test(actionType || "") ? "modal" : /Panel$/.test(actionType || "") ? "panel" : "";

/**
 * Where an Export action's rows come from. Screens saved before `via` existed
 * only ever named a source, so that is what an action without one means.
 */
export const exportVia = (a) =>
  a?.via === "endpoint" || a?.via === "list" || a?.via === "source"
    ? a.via
    : a?.sourceId
      ? "source"
      : a?.api?.endpoint
        ? "endpoint"
        : a?.list
          ? "list"
          : "source";

/** xlsx | csv. An action from before `format` decided by its file name. */
export const exportFormat = (a) => a?.format || (/\.xlsx$/i.test(String(a?.fileName || "")) ? "xlsx" : "csv");

/** Comparison operators shared by visibility rules, color rules and filters. */
export const OPERATORS = [
  { op: "eq", label: "=" },
  { op: "ne", label: "!=" },
  { op: "gt", label: ">" },
  { op: "gte", label: ">=" },
  { op: "lt", label: "<" },
  { op: "lte", label: "<=" },
  { op: "contains", label: "contains" },
  { op: "notContains", label: "not contains" },
  { op: "startsWith", label: "starts with" },
  { op: "in", label: "in (a,b,c)" },
  { op: "notIn", label: "not in" },
  { op: "empty", label: "is empty" },
  { op: "notEmpty", label: "is not empty" },
];

let seq = 0;
/** Short, collision-safe id generator (readable in exported JSON). */
export function uid(prefix = "n") {
  seq += 1;
  return `${prefix}_${Date.now().toString(36).slice(-4)}${seq.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 5)}`;
}

/** Empty per-node structures — always cloned, never shared. */
export function emptyResponsive() {
  return { tablet: {}, mobile: {} };
}

export function emptyRules() {
  return { visibility: [], color: [] };
}

export function emptyValidation() {
  return {
    required: false,
    min: null,
    max: null,
    minLength: null,
    maxLength: null,
    regex: "",
    email: false,
    message: "",
  };
}

/**
 * Build a node from a registry definition. The registry is the only place
 * that knows a component's defaults — this function just materialises them.
 */
export function createNode(def, overrides = {}) {
  const node = {
    id: uid("n"),
    type: def.type,
    name: overrides.name || def.label,
    props: JSON.parse(JSON.stringify(def.defaultProps || {})),
    style: JSON.parse(JSON.stringify(def.defaultStyle || {})),
    responsive: emptyResponsive(),
    binding: { sourceId: "", path: "", fieldMap: {} },
    events: {},
    rules: emptyRules(),
    validation: emptyValidation(),
    roles: { visibleTo: [], editableBy: [] },
    locked: false,
    hidden: false,
  };
  if (def.isContainer) node.children = [];
  // A definition may ship a ready-made subtree (e.g. Tabs with two panes).
  if (typeof def.createChildren === "function") node.children = def.createChildren();
  return { ...node, ...overrides, props: { ...node.props, ...(overrides.props || {}) } };
}

/** A brand-new blank screen. */
/**
 * The page header a screen wears by default.
 *
 * `auto` is what makes a generated screen look like a hand-coded one without
 * anybody configuring it: the header appears unless the screen already carries
 * its own Breadcrumb or Page Heading node, and the trail comes from the menu
 * the API returned — the same lookup <Heading isBreadcrumb /> does.
 *
 * The rest is what a hand-coded page hands its Heading: text and a count, a
 * search box, and buttons — each with the same fields as a card's header icon
 * (label, icon, tooltip, colours, what it opens, when it shows) plus how it is
 * drawn (`display`: both | icon | text, `variant`, `size`).
 */
export function createScreenHeader() {
  return {
    mode: "auto",
    showBreadcrumb: true,
    title: "",
    icon: "",
    color: "",
    rightText: "",
    rightIcon: "",
    count: "",
    showSearch: false,
    searchField: "headerSearch",
    searchPlaceholder: "Search…",
    onSearch: [],
    buttons: [],
  };
}

export function createScreen(name = "Untitled Screen") {
  const now = new Date().toISOString();
  return {
    id: uid("scr"),
    name,
    description: "",
    category: "General",
    status: "draft",
    version: 1,
    createdAt: now,
    updatedAt: now,
    theme: { mode: "light", tokens: {} },
    header: createScreenHeader(),
    palette: [],
    dataSources: {},
    variables: {},
    // What the screen is opened with, { name: previewValue } — utils/screenParams.
    params: {},
    appModals: [],
    root: {
      id: uid("root"),
      type: "Container",
      name: "Screen",
      props: { direction: "column", gap: 16, padding: 16, wrap: false, align: "stretch", justify: "flex-start" },
      style: {},
      responsive: emptyResponsive(),
      binding: { sourceId: "", path: "", fieldMap: {} },
      events: {},
      rules: emptyRules(),
      validation: emptyValidation(),
      roles: { visibleTo: [], editableBy: [] },
      locked: true,
      hidden: false,
      children: [],
    },
  };
}

/**
 * Repair / upgrade a screen document read from storage or an import file so
 * the rest of the app can assume every field exists.
 */
export function normalizeScreen(raw) {
  if (!raw || typeof raw !== "object") return createScreen();
  const base = createScreen(raw.name || "Untitled Screen");
  const screen = {
    ...base,
    ...raw,
    theme: { mode: "light", tokens: {}, ...(raw.theme || {}) },
    // Screens saved before the header existed get the default one, so they pick
    // up the automatic breadcrumb without being edited and re-saved.
    header: { ...createScreenHeader(), ...(raw.header || {}) },
    palette: Array.isArray(raw.palette) ? raw.palette : [],
    dataSources: raw.dataSources && typeof raw.dataSources === "object" ? raw.dataSources : {},
    variables: raw.variables && typeof raw.variables === "object" ? raw.variables : {},
    params: raw.params && typeof raw.params === "object" && !Array.isArray(raw.params) ? raw.params : {},
    // Modals this screen registered for itself (utils/appModals). They travel
    // in the screen's JSON, so an exported screen opens what it opened here.
    appModals: Array.isArray(raw.appModals) ? raw.appModals : [],
  };
  screen.root = normalizeNode(raw.root || base.root);
  return screen;
}

export function normalizeNode(raw) {
  if (!raw || typeof raw !== "object") return null;
  const node = {
    id: raw.id || uid("n"),
    type: raw.type || "Container",
    name: raw.name || raw.type || "Node",
    props: raw.props && typeof raw.props === "object" ? raw.props : {},
    style: raw.style && typeof raw.style === "object" ? raw.style : {},
    responsive: { ...emptyResponsive(), ...(raw.responsive || {}) },
    binding: { sourceId: "", path: "", fieldMap: {}, ...(raw.binding || {}) },
    events: raw.events && typeof raw.events === "object" ? raw.events : {},
    rules: { ...emptyRules(), ...(raw.rules || {}) },
    validation: { ...emptyValidation(), ...(raw.validation || {}) },
    roles: { visibleTo: [], editableBy: [], ...(raw.roles || {}) },
    locked: !!raw.locked,
    hidden: !!raw.hidden,
  };
  // Dropped from a common component (utils/commonComponents): which saved pack
  // this subtree came from. Kept through a normalise so the badge survives a
  // save-and-reopen, and so instances can be found again later.
  if (raw.common && typeof raw.common === "object") node.common = { ...raw.common };
  // "Restrict access": at runtime the box shows only to the users granted it on
  // the Screen Box Permission page (sb_screen_access) and admin roles.
  if (raw.access?.restricted) node.access = { restricted: true };
  // File Upload's "files" and "base64" Store modes were folded into "all"
  // (Everything: the File and its base64 at once, plus a sheet's rows). Read
  // the same way at runtime; rewritten here so the inspector shows it too.
  if (node.type === "FileUpload" && (node.props.valueMode === "files" || node.props.valueMode === "base64")) {
    node.props = { ...node.props, valueMode: "all" };
  }
  if (Array.isArray(raw.children)) {
    node.children = raw.children.map(normalizeNode).filter(Boolean);
  }
  return node;
}

/**
 * Structural validation used by the import dialog. Returns a list of human
 * readable problems; an empty list means the document is safe to load.
 */
export function validateScreen(doc, registry) {
  const errors = [];
  if (!doc || typeof doc !== "object") return ["Document is not a JSON object."];
  if (!doc.root) errors.push("Missing `root` node.");
  const seen = new Set();
  const walk = (node, path) => {
    if (!node) return;
    if (!node.type) errors.push(`${path}: node has no \`type\`.`);
    else if (registry && !registry[node.type]) errors.push(`${path}: unknown component type "${node.type}".`);
    if (node.id) {
      if (seen.has(node.id)) errors.push(`${path}: duplicate node id "${node.id}".`);
      seen.add(node.id);
    }
    (node.children || []).forEach((c, i) => walk(c, `${path}/${node.type}[${i}]`));
  };
  walk(doc.root, "root");
  return errors;
}

/** Screen-level data source factory. */
export function createDataSource(name = "New source") {
  const id = uid("ds");
  return {
    id,
    name,
    mode: "static",
    url: "",
    method: "GET",
    headers: {},
    params: {},
    body: {},
    responsePath: "",
    staticData: [],
    autoLoad: true,
  };
}
