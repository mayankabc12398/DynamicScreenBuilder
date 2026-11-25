/**
 * NESTED ROW TABLE — a row that opens into a table of its own.
 *
 * The IPD billing grid (components/UI/customTable/NestedRowTable.jsx): one row
 * per department with its count and amount, a +/- that opens the department's
 * items underneath, and in those items the checkboxes, inputs and icons the
 * user works with.
 *
 * Both levels ARE the Table / Cards component (DataTableDef) and not a copy of
 * it, so a column here offers exactly what a table's column offers: text,
 * number, date, dropdown, autocomplete, checkbox, button, icon strip, its
 * validation, Disabled when, totals and click chains. Row values are kept per
 * row by the table — which a control dropped from the palette could not do,
 * since all its copies would share one {{values.<field>}}.
 *
 *   The parent rows     the node's own data, read by `resolveRows`.
 *   The sub-rows        `subMode`:
 *                         group   one flat list, grouped by `groupField`; the
 *                                 parent row is the group, with a count and the
 *                                 `groupSum` fields added up
 *                         field   a list inside each row (`subRowsField`)
 *                         api     an endpoint called when a row is opened,
 *                                 reading the parent as {{row.X}}
 *
 * How it sits on the table: the top table gets the rows through static mode on
 * a stand-in node (`<id>__top`), because the rows here have already been loaded
 * and grouped. It reports through `props.__nest` — the one opt-in the table
 * knows about. Each opened parent gets a stand-in of its own (`<id>__sub_<key>`)
 * holding its ticks and edits, and stays mounted once opened so that closing a
 * row keeps them. This node then publishes the whole thing as {{grid.<id>.…}}.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmptyState, GROUPS, Icon, p, Skeleton } from "./shared";
import { DataTableDef, EDIT_CONTROLS, makeSampleRows, resolveRows, rowsVarProps, VARS_MODE_OPTION } from "./dataDisplay";
import { createApiConfig, deriveColumns, isApiConfigReady, normalizeApiConfig } from "../utils/apiConfig";
import { DEFERRED_PROP_KEYS, getPath, interpolateDeep } from "../utils/expressions";
import { rowFieldsOf } from "../utils/rowContext";
import { tr } from "../utils/i18n";

/** Stamped on every parent row: it is that row's key in the top table. */
const NEST_KEY = "__nestKey";
const NO_ROWS = [];

/** Read once per opened row, against that row — see `SubTable`. */
const DEFER = new Set([...DEFERRED_PROP_KEYS, "subApiConfig"]);

const subIdOf = (nodeId, key) => `${nodeId}__sub_${key}`;
const topIdOf = (nodeId) => `${nodeId}__top`;
const colsOf = (v) => (Array.isArray(v) ? v.filter((c) => c && c.key) : []);
const blank = (v) => v === undefined || v === null || v === "";

/** A list held in a row. Some procedures send it as a JSON string. */
function listIn(row, field) {
  const v = field ? getPath(row, field) : null;
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : NO_ROWS;
    } catch (e) {
      return NO_ROWS;
    }
  }
  return NO_ROWS;
}

/** The parent's fields a sub-row should carry into a payload. */
function inherit(parent, row, fields) {
  if (!fields?.length) return row;
  const next = { ...row };
  fields.forEach((f) => {
    if (next[f] === undefined) next[f] = parent?.[f];
  });
  return next;
}

/** "1,250.50", 1250.5 and "" all add up. Rounded so paise never read 0.1000001. */
function sumOf(list, field) {
  const total = list.reduce((acc, r) => {
    const n = parseFloat(String(getPath(r, field) ?? "").replace(/,/g, ""));
    return Number.isNaN(n) ? acc : acc + n;
  }, 0);
  return Math.round(total * 100) / 100;
}

/**
 * The rows the top table draws, and each one's sub-rows.
 *
 * Pure, so what a screen shows follows from its props and rows alone. `kids` is
 * keyed by NEST_KEY and its lists keep their identity between calls with the
 * same input, which matters: a table that sees a new list forgets its edits.
 */
export function buildNest(rows, props) {
  const mode = props.subMode || "group";
  const kids = new Map();

  if (mode === "group" && props.groupField) {
    const groups = new Map();
    rows.forEach((r) => {
      const v = getPath(r, props.groupField);
      const key = blank(v) ? "—" : String(v);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    });
    const countKey = props.groupCountField || "Count";
    const sums = Array.isArray(props.groupSum) ? props.groupSum : [];
    const parents = [...groups].map(([key, list]) => {
      // The first row underneath, so a column or a payload can still read
      // anything the group has in common (DepartmentID beside Department).
      const parent = { ...list[0], [NEST_KEY]: key, [countKey]: list.length };
      if (blank(getPath(list[0], props.groupField))) parent[props.groupField] = key;
      sums.forEach((f) => {
        parent[f] = sumOf(list, f);
      });
      kids.set(key, list);
      return parent;
    });
    return { parents, kids };
  }

  // A key that repeats takes a numbered suffix, as the table's own rows do.
  const seen = new Map();
  const parents = rows.map((r, i) => {
    const named = props.rowKeyField ? getPath(r, props.rowKeyField) : undefined;
    const raw = !blank(named) ? named : r?.id ?? r?.Id ?? r?.ID;
    const base = blank(raw) ? `i_${i}` : String(raw);
    const n = seen.get(base) || 0;
    seen.set(base, n + 1);
    const key = n ? `${base}#${n}` : base;
    if (mode === "field") {
      kids.set(key, listIn(r, props.subRowsField).map((k) => inherit(r, k, props.inheritFields)));
    }
    return { ...r, [NEST_KEY]: key };
  });
  return { parents, kids };
}

/** What a sub-row holds — the field list of the Sub-row columns editor. */
export function subFieldsOf(pr = {}) {
  const mode = pr.subMode || "group";
  const subColumns = pr.subColumns;
  if (mode === "api") return rowFieldsOf({ staticRows: pr.subPreviewRows, columns: subColumns });
  if (mode === "field") {
    const rows = [...(pr.previewRows || []), ...(pr.staticRows || [])];
    const list = rows.flatMap((r) => listIn(r, pr.subRowsField)).slice(0, 5);
    return rowFieldsOf({ staticRows: list, columns: subColumns });
  }
  return [...new Set([...rowFieldsOf(pr), ...colsOf(subColumns).map((c) => c.key)])];
}

/** Same values, same order — identity only. */
const sameList = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

const withoutKey = (row) => {
  if (!row || row[NEST_KEY] === undefined) return row;
  const { [NEST_KEY]: _drop, ...rest } = row;
  return rest;
};

/**
 * One opened row's table.
 *
 * A component of its own because it holds hooks and the number of open rows
 * changes. Its events are this control's onSub… chains, and they run with the
 * parent in the scope as {{parent.X}}.
 */
function SubTable({ owner, row, rowKey, rows, props, rt, scope }) {
  const mode = props.subMode || "group";
  const events = owner.events;
  const subRt = useMemo(() => {
    if (!rt) return rt;
    return {
      ...rt,
      runEvent: (n, ev, payload = {}) => rt.runEvent(n, ev, { parent: row, ...payload }),
      runActions: (list, ctx = {}) => rt.runActions(list, { parent: row, ...ctx }),
    };
  }, [rt, row]);
  const subScope = useMemo(() => ({ ...(scope || {}), parent: row }), [scope, row]);

  const apiConfig = useMemo(() => {
    if (mode !== "api" || !isApiConfigReady(props.subApiConfig)) return createApiConfig();
    // The row is resolved here: the table loads through refreshNode, whose scope
    // has no row in it. Opening the row IS the trigger, so autoLoad is forced.
    return { ...interpolateDeep(normalizeApiConfig(props.subApiConfig), { ...(scope || {}), row, parent: row }), autoLoad: true };
  }, [mode, props.subApiConfig, scope, row]);

  const subProps = useMemo(
    () => ({
      ...DataTableDef.defaultProps,
      title: "",
      columns: props.subColumns || NO_ROWS,
      rowKeyField: props.subRowKeyField || "",
      dataMode: mode === "api" ? "api" : "static",
      staticRows: mode === "api" ? NO_ROWS : rows,
      previewRows: mode === "api" ? rows : NO_ROWS,
      apiConfig,
      showHeader: !!props.subSearch,
      barStyle: "builder",
      searchable: !!props.subSearch,
      showViewToggle: false,
      headViewToggle: false,
      selectable: false,
      sortable: props.subSortable !== false,
      paginate: Number(props.subPageSize) > 0,
      pageSize: Number(props.subPageSize) || 10,
      stickyHeader: false,
      resizable: false,
      virtualize: false,
      maxHeight: "none",
      skin: props.skin || "app",
      fontSize: props.fontSize,
      dense: !!props.dense,
      zebra: false,
      headerBg: props.subHeaderBg || "",
      rowVar: props.subRowVar || "",
      emptyText: props.subEmptyText || "No records found",
    }),
    [props.subColumns, props.subRowKeyField, mode, rows, apiConfig, props.subSearch, props.subSortable, props.subPageSize, props.skin, props.fontSize, props.dense, props.subHeaderBg, props.subRowVar, props.subEmptyText],
  );

  const subNode = useMemo(
    () => ({
      id: subIdOf(owner.id, rowKey),
      type: "DataTable",
      props: subProps,
      events: {
        onRowClick: events?.onSubRowClick,
        onRowAction: events?.onSubRowAction,
        onCellChange: events?.onSubCellChange,
      },
    }),
    [owner.id, rowKey, subProps, events],
  );

  const Table = DataTableDef.render;
  return <Table node={subNode} props={subProps} rt={subRt} scope={subScope} />;
}

const DEFAULT_COLUMNS = [
  { key: "Department", header: "Department", type: "text" },
  { key: "Count", header: "Quantity", type: "text", align: "right" },
  { key: "Amount", header: "Amount", type: "text", align: "right" },
];

const DEFAULT_SUB_COLUMNS = [
  { key: "Selected", header: "Select", type: "text", control: "checkbox", width: 60 },
  { key: "Item", header: "Item", type: "text" },
  { key: "Quantity", header: "Quantity", type: "text", control: "number", align: "right", width: 110 },
  { key: "Rate", header: "Rate", type: "text", align: "right", width: 100 },
  { key: "Amount", header: "Amount", type: "text", align: "right", width: 110 },
  { key: "PayType", header: "Payable", type: "text", control: "select", options: "Payable, Non-Payable", width: 140 },
];

const NestedRowTableDef = {
  type: "NestedRowTable",
  label: "Nested Row Table",
  icon: "Rows3",
  category: "Data",
  bindable: true,
  deferProps: DEFER,
  defaultProps: {
    title: "",
    showHeader: false,
    expanderHeader: "Action",

    dataMode: "static",
    staticRows: [],
    apiConfig: createApiConfig(),
    /** Written by the picker's Sync button; design-time only, never fetched. */
    previewRows: [],
    dataSourceId: "",
    rowKeyField: "",
    columns: DEFAULT_COLUMNS,
    rowVar: "",

    subMode: "group",
    groupField: "Department",
    groupCountField: "Count",
    groupSum: ["Amount"],
    subRowsField: "",
    subApiConfig: createApiConfig(),
    subPreviewRows: [],
    inheritFields: [],
    subColumns: DEFAULT_SUB_COLUMNS,
    subRowKeyField: "",
    subRowVar: "",

    defaultOpen: "none",
    multiOpen: true,
    expandOnRowClick: true,
    searchable: false,
    subSearch: true,
    sortable: false,
    subSortable: true,
    paginate: false,
    pageSize: 20,
    subPageSize: "",
    emptyText: "No records found",
    subEmptyText: "No records found",

    skin: "app",
    dense: false,
    fontSize: "",
    headerBg: "",
    subHeaderBg: "",
    openRowColor: "",
    maxHeight: 600,
  },
  defaultStyle: {},
  events: ["onExpand", "onCollapse", "onRowClick", "onRowAction", "onCellChange", "onSubRowClick", "onSubRowAction", "onSubCellChange"],
  propSchema: [
    p.bool("showHeader", "Show heading bar", GROUPS.CONTENT),
    p.text("title", "Title", GROUPS.CONTENT, { when: (pr) => !!pr.showHeader }),
    p.text("expanderHeader", "+/- column heading", GROUPS.CONTENT),

    p.select(
      "dataMode",
      "Rows come from",
      [
        { value: "static", label: "Static rows (edited here)" },
        { value: "api", label: "Dynamic API (data source)" },
        { value: "action", label: "Filled by a button / action" },
        VARS_MODE_OPTION,
      ],
      GROUPS.DATA,
    ),
    ...rowsVarProps(GROUPS.DATA),
    {
      key: "staticRows",
      label: "Rows",
      type: "rows",
      group: GROUPS.DATA,
      when: (pr) => (pr.dataMode || "static") === "static",
      // Grouped, the rows typed here are the sub-rows.
      columnsOf: (pr) => ((pr.subMode || "group") === "group" ? colsOf(pr.subColumns) : colsOf(pr.columns)),
    },
    { key: "apiConfig", label: "API endpoint", type: "apiEndpoint", group: GROUPS.DATA, when: (pr) => pr.dataMode === "api" },
    p.text("dataSourceId", "Shared data source id", GROUPS.DATA, {
      when: (pr) => pr.dataMode === "api" && !isApiConfigReady(pr.apiConfig),
    }),

    p.select(
      "subMode",
      "Sub-rows come from",
      [
        { value: "group", label: "Group one flat list by a field" },
        { value: "field", label: "A list inside each row" },
        { value: "api", label: "An API, called when the row opens" },
      ],
      GROUPS.DATA,
      { hint: "Group: one row per Department, its rows underneath. List: each record carries its own items. API: the items are fetched for the row that was opened." },
    ),
    p.dataKey("groupField", "Group by", GROUPS.DATA, {
      when: (pr) => (pr.subMode || "group") === "group",
      placeholder: "e.g. Department",
    }),
    p.dataKeys("groupSum", "Add up in the parent row", GROUPS.DATA, {
      when: (pr) => (pr.subMode || "group") === "group",
      placeholder: "Add a field to total…",
      emptyNote: "Nothing added up. Add Amount, and the parent row's Amount column shows the group's total.",
    }),
    p.text("groupCountField", "Row count field", GROUPS.DATA, {
      when: (pr) => (pr.subMode || "group") === "group",
      placeholder: "Count",
      hint: "Each parent row gets the number of rows in its group under this name — point a column at it.",
    }),
    p.dataKey("subRowsField", "Field holding the list", GROUPS.DATA, {
      when: (pr) => pr.subMode === "field",
      placeholder: "e.g. Items",
    }),
    {
      key: "subApiConfig",
      label: "Sub-rows API",
      type: "apiEndpoint",
      group: GROUPS.DATA,
      when: (pr) => pr.subMode === "api",
      patchAs: { columns: "subColumns", previewRows: "subPreviewRows" },
    },
    p.dataKeys("inheritFields", "Copy parent fields to sub-rows", GROUPS.DATA, {
      when: (pr) => pr.subMode === "field" || pr.subMode === "api",
      placeholder: "Add a parent field…",
      emptyNote: "Nothing copied. Added fields travel with each sub-row in {{grid.<id>.subRows}}. In any chain the parent is also {{parent.Field}}.",
    }),
    p.dataKey("rowKeyField", "Row key field", GROUPS.DATA, {
      when: (pr) => (pr.subMode || "group") !== "group",
      placeholder: "What identifies one parent row",
    }),

    p.columns("columns", "Columns", GROUPS.DATA, {
      hint: "The parent row. Controls work here too.",
    }),
    p.columns("subColumns", "Sub-row columns", GROUPS.DATA, {
      fieldKeysOf: subFieldsOf,
      hint: "One column per field. Open a column and set Control to Input, Dropdown, Date, Checkbox, Button or Icon — each row keeps its own value.",
    }),
    p.text("subRowKeyField", "Sub-row key field", GROUPS.DATA, {
      placeholder: "What identifies one sub-row",
      hint: "Keeps a tick on its row when the list is sorted or searched.",
    }),
    p.text("rowVar", "Remember clicked row as", GROUPS.DATA, { placeholder: "e.g. selectedDepartment" }),
    p.text("subRowVar", "Remember clicked sub-row as", GROUPS.DATA, { placeholder: "e.g. selectedItem" }),
    {
      key: "__nestUse",
      label: "Read it from a Save",
      type: "note",
      group: GROUPS.DATA,
      text: (ctx) =>
        `{{grid.${ctx?.nodeId}.subRows}} every sub-row with its edits · .edited the changed ones · .checked the ticked ones · .checkedBy.<Column> one tick column · .rows the parents, each with its list. Sub-rows of a row never opened are sent as loaded; an API row sends none until it is opened.`,
    },

    p.select(
      "defaultOpen",
      "Open when the screen loads",
      [
        { value: "none", label: "All closed" },
        { value: "first", label: "First row" },
        { value: "all", label: "All rows" },
      ],
      GROUPS.BEHAVIOUR,
    ),
    p.bool("multiOpen", "Several rows open at once", GROUPS.BEHAVIOUR),
    p.bool("expandOnRowClick", "Click anywhere on the row to open it", GROUPS.BEHAVIOUR),
    p.bool("subSearch", "Search box in the sub-table", GROUPS.BEHAVIOUR),
    p.bool("subSortable", "Sortable sub-table columns", GROUPS.BEHAVIOUR),
    p.number("subPageSize", "Sub-rows per page", GROUPS.BEHAVIOUR, { hint: "Empty shows them all." }),
    p.bool("searchable", "Search box over the parent rows", GROUPS.BEHAVIOUR, {
      when: (pr) => !!pr.showHeader,
    }),
    p.bool("sortable", "Sortable parent columns", GROUPS.BEHAVIOUR),
    p.bool("paginate", "Page the parent rows", GROUPS.BEHAVIOUR),
    p.number("pageSize", "Parent rows per page", GROUPS.BEHAVIOUR, { when: (pr) => !!pr.paginate }),
    p.text("emptyText", "Empty text", GROUPS.BEHAVIOUR),
    p.text("subEmptyText", "Empty sub-table text", GROUPS.BEHAVIOUR),

    p.select(
      "skin",
      "Table look",
      [
        { value: "app", label: "App table (same as hand-coded pages)" },
        { value: "plain", label: "Builder" },
      ],
      GROUPS.APPEARANCE,
    ),
    p.bool("dense", "Dense rows", GROUPS.APPEARANCE),
    p.number("fontSize", "Font size (px)", GROUPS.APPEARANCE),
    p.color("headerBg", "Header background", GROUPS.APPEARANCE),
    p.color("subHeaderBg", "Sub-table header background", GROUPS.APPEARANCE),
    p.color("openRowColor", "Open row colour", GROUPS.APPEARANCE),
    p.text("maxHeight", "Max body height", GROUPS.LAYOUT, { placeholder: "600, 600px or 60vh" }),
  ],
  render: ({ node, props, style, rt, scope }) => {
    const design = !!rt?.design;
    const { rows: rawIn, loading, error } = resolveRows(node, props, rt);

    // Loads itself as a table does: on the rendered screen, never on the canvas.
    const api = props.apiConfig;
    const apiKey = useMemo(() => (isApiConfigReady(api) ? JSON.stringify(normalizeApiConfig(api)) : ""), [api]);
    const refreshNode = rt?.refreshNode;
    useEffect(() => {
      if (!apiKey || design || !refreshNode) return;
      const cfg = JSON.parse(apiKey);
      if (cfg.autoLoad === false) return;
      refreshNode(node.id, cfg);
    }, [apiKey, design, refreshNode, node.id]);

    const mode = props.subMode || "group";
    const parentColumnsSet = props.columns;
    const subColumnsSet = props.subColumns;

    // The canvas with nothing bound yet: rows that show this shape, grouped so
    // that the design reads as it will on the screen. Never on a live screen.
    const sampling = design && !!rawIn?.[0]?.__sample;
    const groupField = props.groupField;
    const source = useMemo(() => {
      if (!sampling) return rawIn || NO_ROWS;
      const rows = makeSampleRows([...colsOf(parentColumnsSet), ...colsOf(subColumnsSet)], 6);
      if (mode === "group" && groupField) rows.forEach((r, i) => (r[groupField] = i < 3 ? "Group A" : "Group B"));
      return rows;
    }, [sampling, sampling ? null : rawIn, parentColumnsSet, subColumnsSet, mode, groupField]);

    const { parents, kids } = useMemo(
      () =>
        buildNest(source, {
          subMode: mode,
          groupField,
          groupCountField: props.groupCountField,
          groupSum: props.groupSum,
          subRowsField: props.subRowsField,
          rowKeyField: props.rowKeyField,
          inheritFields: props.inheritFields,
        }),
      [source, mode, groupField, props.groupCountField, props.groupSum, props.subRowsField, props.rowKeyField, props.inheritFields],
    );

    // A list mode with nothing Synced yet still shows the sub-table on the canvas.
    const previewKids = useMemo(() => {
      if (!design || mode === "group") return NO_ROWS;
      const synced = mode === "api" ? props.subPreviewRows : null;
      return Array.isArray(synced) && synced.length ? synced : makeSampleRows(colsOf(subColumnsSet), 3);
    }, [design, mode, props.subPreviewRows, subColumnsSet]);
    const kidsOf = useCallback(
      (key) => {
        const list = kids.get(key);
        return list?.length ? list : previewKids;
      },
      [kids, previewKids],
    );

    /* ------------------------------------------------- which rows are open */
    const [picked, setPicked] = useState(null);
    const openKeys = useMemo(() => {
      if (picked) return picked;
      const keys = parents.map((r) => r[NEST_KEY]);
      if (props.defaultOpen === "all") return keys;
      // The canvas opens the first row, or nobody could see what is designed.
      return (design || props.defaultOpen === "first") && keys.length ? [keys[0]] : NO_ROWS;
    }, [picked, parents, props.defaultOpen, design]);

    // Everything ever opened stays mounted, so closing a row keeps its edits.
    const mountedRef = useRef(new Set());
    openKeys.forEach((k) => mountedRef.current.add(k));

    const toggle = (key, row) => {
      const isOpen = openKeys.includes(key);
      const others = props.multiOpen === false ? [] : openKeys.filter((k) => k !== key);
      setPicked(isOpen ? others : [...others, key]);
      if (!design) rt?.runEvent?.(node, isOpen ? "onCollapse" : "onExpand", { row: withoutKey(row) });
    };

    /**
     * A parent that is gone takes its open state and edits with it — otherwise
     * the same key coming back in a later search would inherit somebody else's
     * ticks. A row still there is handled by its own table, which clears them
     * when its list is replaced.
     */
    useEffect(() => {
      if (design) return;
      const live = new Set(parents.map((r) => r[NEST_KEY]));
      const gone = [...mountedRef.current].filter((k) => !live.has(k));
      if (!gone.length) return;
      gone.forEach((k) => {
        mountedRef.current.delete(k);
        colsOf(subColumnsSet).forEach((c) => {
          const id = `${subIdOf(node.id, k)}:${c.key}`;
          if (c.control === "checkbox") rt?.setChecks?.(id, {});
          else if (EDIT_CONTROLS.includes(c.control)) rt?.setCells?.(id, {});
        });
      });
      setPicked((cur) => (cur ? cur.filter((k) => live.has(k)) : cur));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parents]);

    /* ------------------------------------------------------ the top table */
    // Read through a ref: the column stays one object, and the table's own
    // memos keep their identity, while a click still sees the current state.
    const latest = useRef(null);
    latest.current = { toggle, openKeys, kidsOf, mode };

    const expanderHeader = props.expanderHeader;
    const columns = useMemo(() => {
      const own = colsOf(parentColumnsSet);
      const set = own.length
        ? own
        : mode === "group"
          ? [groupField, props.groupCountField || "Count", ...(props.groupSum || [])].filter(Boolean).map((key) => ({ key, header: key, type: "text" }))
          : deriveColumns(source, { max: 12 }).filter((c) => c.key !== props.subRowsField);
      return [
        {
          key: "__nestToggle",
          header: expanderHeader || "",
          type: "text",
          control: "nestToggle",
          width: 56,
          align: "center",
          sortable: false,
          renderCell: (row, rowId) => {
            const cur = latest.current;
            // Nothing to open: no button, rather than one that opens nothing.
            if (cur.mode !== "api" && !cur.kidsOf(rowId).length) return null;
            const isOpen = cur.openKeys.includes(rowId);
            const label = tr(isOpen ? "Collapse" : "Expand");
            return (
              <button
                type="button"
                className="dsb-nest-toggle"
                data-dsb-interactive
                aria-expanded={isOpen}
                aria-label={label}
                title={label}
                onClick={(e) => {
                  e.stopPropagation();
                  latest.current.toggle(rowId, row);
                }}
              >
                <Icon name={isOpen ? "Minus" : "Plus"} size={15} />
              </button>
            );
          },
        },
        ...set,
      ];
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parentColumnsSet, expanderHeader, mode, groupField, props.groupCountField, props.groupSum, props.subRowsField, source]);

    /* ------------------------- validation: every opened table, as one grid */
    const checksRef = useRef({});
    const registerGridValidator = useCallback((id, fn) => {
      checksRef.current[id] = fn;
      return () => {
        if (checksRef.current[id] === fn) delete checksRef.current[id];
      };
    }, []);
    const registerOwn = rt?.registerGridValidator;
    useEffect(() => {
      if (design || !registerOwn) return undefined;
      return registerOwn(node.id, (opts = {}) => {
        let count = 0;
        const failed = [];
        Object.entries(checksRef.current).forEach(([id, fn]) => {
          const n = Number(fn({ ...opts, reveal: opts.reveal !== false && count === 0 })?.count) || 0;
          count += n;
          if (n) failed.push(id);
        });
        // A failed cell in a closed row has to be seen to be fixed.
        const prefix = subIdOf(node.id, "");
        const reopen = failed.filter((id) => id.startsWith(prefix)).map((id) => id.slice(prefix.length));
        if (reopen.length) setPicked((cur) => [...new Set([...(cur || latest.current.openKeys), ...reopen])]);
        return { count };
      });
    }, [design, registerOwn, node.id]);

    const nestRt = useMemo(() => (rt ? { ...rt, registerGridValidator } : rt), [rt, registerGridValidator]);

    /* ------------------------------------------- {{grid.<id>.…}}, as one */
    const grids = rt?.ui?.grids;
    const publish = rt?.setGrid;
    const publishedRef = useRef(null);
    useEffect(() => {
      if (design || !publish) return;
      const top = grids?.[topIdOf(node.id)];
      const subs = parents.map((r) => grids?.[subIdOf(node.id, r[NEST_KEY])]);
      // The tables publish only when something changed, so their published
      // objects are the whole comparison.
      const seen = [parents, top, ...subs];
      if (sameList(publishedRef.current, seen)) return;
      publishedRef.current = seen;

      const inheritLive = mode === "api" ? props.inheritFields : null;
      const stamp = (parent, list) => (inheritLive?.length ? (list || NO_ROWS).map((r) => inherit(parent, r, inheritLive)) : list || NO_ROWS);
      const merged = top?.rows || parents;
      const listKey = (mode === "field" && props.subRowsField) || "subRows";
      const parentOf = (i) => merged[i] || parents[i];
      const rows = merged.map((row, i) => {
        const list = subs[i]?.rows || kids.get(parents[i]?.[NEST_KEY]) || NO_ROWS;
        return { ...withoutKey(row), [listKey]: stamp(row, list) };
      });
      const flat = (pick) => subs.flatMap((g, i) => stamp(parentOf(i), pick(g, i)));
      const checkedBy = {};
      subs.forEach((g, i) =>
        Object.entries(g?.checkedBy || {}).forEach(([col, list]) => {
          checkedBy[col] = [...(checkedBy[col] || []), ...stamp(parentOf(i), list)];
        }),
      );
      Object.entries(top?.checkedBy || {}).forEach(([col, list]) => {
        checkedBy[col] = [...(checkedBy[col] || []), ...list.map(withoutKey)];
      });
      publish(node.id, {
        rows,
        subRows: rows.flatMap((r) => r[listKey]),
        edited: flat((g) => g?.edited),
        checked: flat((g) => g?.checked),
        checkedBy,
        parentEdited: (top?.edited || NO_ROWS).map(withoutKey),
        parentChecked: (top?.checked || NO_ROWS).map(withoutKey),
        selected: NO_ROWS,
        pageRows: rows,
      });
    }, [grids, parents, kids, publish, design, node.id, mode, props.subRowsField, props.inheritFields]);

    /* ------------------------------------------------------------- render */
    const topProps = {
      ...DataTableDef.defaultProps,
      ...props,
      dataMode: "static",
      staticRows: parents,
      previewRows: NO_ROWS,
      apiConfig: createApiConfig(),
      dataSourceId: "",
      columns,
      rowKeyField: NEST_KEY,
      viewMode: "table",
      showViewToggle: false,
      headViewToggle: false,
      selectable: false,
      resizable: false,
      virtualize: false,
      barStyle: props.barStyle || "app",
      __nest: {
        rowClass: (key) => (openKeys.includes(key) ? " dsb-nest-open" : ""),
        onRow: (row, key) => {
          if (!design && props.expandOnRowClick !== false && (mode === "api" || kidsOf(key).length)) toggle(key, row);
        },
        after: (row, key, colSpan) => {
          const isOpen = openKeys.includes(key);
          if (!isOpen && !mountedRef.current.has(key)) return null;
          return (
            <tr className="dsb-nest-detail" style={isOpen ? undefined : { display: "none" }} onClick={(e) => e.stopPropagation()}>
              <td colSpan={colSpan}>
                <SubTable owner={node} row={row} rowKey={key} rows={kidsOf(key)} props={props} rt={nestRt} scope={scope} />
              </td>
            </tr>
          );
        },
      },
    };
    const topNode = { ...node, id: topIdOf(node.id), type: "DataTable", props: topProps, binding: undefined };

    if (loading && !parents.length) return <Skeleton rows={4} height={30} />;
    if (error) return <EmptyState icon="TriangleAlert" tone="danger" title={tr("Could not load the rows")} hint={String(error)} />;

    const Table = DataTableDef.render;
    const rootStyle = props.openRowColor ? { ...style, "--dsb-nest-open": props.openRowColor } : style;
    return <Table node={topNode} props={topProps} style={rootStyle} rt={nestRt} scope={scope} />;
  },
};

export default [NestedRowTableDef];
