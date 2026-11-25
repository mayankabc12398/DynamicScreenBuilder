/**
 * Export a screen as readable JSX.
 *
 * The generated file renders the same tree through the builder's own renderer,
 * so it behaves exactly like the JSON screen did — a usable starting point when
 * a screen graduates from JSON into hand-maintained code.
 *
 * Two things the export has to get right, and used to get wrong:
 *
 *   - a registry component takes ONE object ({ node, props, style, rt, … }),
 *     not loose attributes, so `<TextInput label="UHID" />` handed straight to
 *     `def.render` left `props` undefined and the exported file threw on its
 *     first control. The `C()` adapter below is what makes plain attributes
 *     legal;
 *   - a node is more than its props. Its event chains, rules, validation,
 *     binding, responsive overrides and roles have no place in a JSX attribute
 *     list, so they travel in one `meta` object and the renderer applies them
 *     exactly as the canvas does.
 */
import { getDef } from "../registry";
import { screenHasHeaderNode } from "./breadcrumb";

const NL = "\n";
const pad = (n) => "  ".repeat(n);

function propValue(v) {
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number" || typeof v === "boolean") return `{${v}}`;
  return `{${JSON.stringify(v)}}`;
}

/**
 * Attributes for one node's props.
 *
 * Only `undefined` and `null` are dropped. An empty string is a real answer —
 * a DatePicker reads `calendarClass: ""` as "no class at all", and dropping it
 * would silently hand the export the default class instead.
 */
function propsToJsx(props, indent) {
  const entries = Object.entries(props || {}).filter(([, v]) => v !== undefined && v !== null);
  if (!entries.length) return "";
  if (entries.length <= 2 && entries.every(([, v]) => typeof v !== "object")) {
    return " " + entries.map(([k, v]) => `${k}=${propValue(v)}`).join(" ");
  }
  return NL + entries.map(([k, v]) => `${pad(indent + 1)}${k}=${propValue(v)}`).join(NL) + NL + pad(indent);
}

const hasKeys = (o) => !!o && typeof o === "object" && Object.keys(o).length > 0;
const hasList = (a) => Array.isArray(a) && a.length > 0;

/**
 * Everything about a node that is not a prop and not a style.
 *
 * Emitted only when there is something to say, so a plain layout box still
 * exports as one readable line.
 */
function metaOf(node) {
  const meta = { id: node.id };
  if (node.name) meta.name = node.name;
  if (hasKeys(node.events)) {
    const events = Object.fromEntries(Object.entries(node.events).filter(([, list]) => hasList(list)));
    if (hasKeys(events)) meta.events = events;
  }
  const rules = {};
  if (hasList(node.rules?.visibility)) rules.visibility = node.rules.visibility;
  if (hasList(node.rules?.color)) rules.color = node.rules.color;
  if (hasKeys(rules)) meta.rules = rules;
  if (hasKeys(node.validation)) {
    const set = Object.fromEntries(
      Object.entries(node.validation).filter(([, v]) => v !== "" && v !== null && v !== undefined && v !== false),
    );
    if (hasKeys(set)) meta.validation = set;
  }
  if (node.binding?.sourceId || hasKeys(node.binding?.fieldMap)) meta.binding = node.binding;
  const responsive = {};
  ["tablet", "mobile"].forEach((bp) => {
    if (hasKeys(node.responsive?.[bp])) responsive[bp] = node.responsive[bp];
  });
  if (hasKeys(responsive)) meta.responsive = responsive;
  if (hasList(node.roles?.visibleTo) || hasList(node.roles?.editableBy)) meta.roles = node.roles;
  if (node.hidden) meta.hidden = true;
  return meta;
}

function nodeToJsx(node, depth) {
  const def = getDef(node.type);
  if (!def) return `${pad(depth)}{/* unknown component: ${node.type} */}`;
  const name = node.type;
  const attrs = propsToJsx(node.props, depth);
  const styleAttr = Object.keys(node.style || {}).length ? ` style={${JSON.stringify(node.style)}}` : "";
  const meta = metaOf(node);
  // `id` alone is still worth emitting: the runtime looks a node up by it, and
  // an action pointed at this dialog names exactly this id.
  const metaAttr = ` meta={${JSON.stringify(meta)}}`;
  const kids = node.children || [];

  if (!kids.length) return `${pad(depth)}<${name}${attrs}${styleAttr}${metaAttr} />`;
  return [
    `${pad(depth)}<${name}${attrs}${styleAttr}${metaAttr}>`,
    ...kids.map((c) => nodeToJsx(c, depth + 1)),
    `${pad(depth)}</${name}>`,
  ].join(NL);
}

const pascal = (s) =>
  String(s || "Screen")
    .replace(/[^a-zA-Z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^[a-z]/, (c) => c.toUpperCase()) || "Screen";

/**
 * Whether the generated page should open with the app's page header.
 *
 * Same rule the renderer follows: off means never, auto means unless the tree
 * already carries a Breadcrumb bar or Page Heading of its own.
 */
function wantsHeader(screen) {
  const h = screen.header || {};
  const mode = h.mode || "auto";
  if (mode === "off") return false;
  if (mode === "on") return true;
  return !screenHasHeaderNode(screen.root);
}

/**
 * Whether the header carries more than a title.
 *
 * A plain header is written as the app's <Heading>, exactly as a hand-coded
 * page writes it. Buttons, a search box, text or a count are the builder's own
 * header config, so the page mounts the builder's ScreenHeader to keep them.
 */
function headerHasExtras(h) {
  if (!h) return false;
  return !!((Array.isArray(h.buttons) && h.buttons.length) || h.rightText || h.count || h.showSearch || h.icon);
}

/** The adapter that lets the tree below be written as ordinary JSX. */
const ADAPTER = [
  "/**",
  " * One element below is one node of the screen.",
  " *",
  " * Its attributes are the node's props, `style` is its style, and `meta`",
  " * carries what JSX cannot express: the node's id, its event chains, rules,",
  " * validation, data binding, responsive overrides and roles. NodeRenderer is",
  " * the builder's own renderer, so bindings, visibility rules, roles, the",
  " * responsive overrides and onLoad all behave as they did in the builder.",
  " */",
  "const NODES = new Map();",
  "",
  "const C = (type) =>",
  "  function Node({ children, meta, style, ...props }) {",
  "    const node = useMemo(",
  "      () => ({ type, props, style: style || {}, ...(meta || {}) }),",
  "      // eslint-disable-next-line react-hooks/exhaustive-deps",
  "      [type, style, meta, JSON.stringify(props)],",
  "    );",
  "    // The runtime finds nodes by id: `validate` reads their validation rules,",
  "    // openModal / openPanel check what they are pointed at, and a refresh",
  "    // action looks up a component's own endpoint. Registering on mount rather",
  "    // than during the render keeps this a side effect of being on screen.",
  "    useEffect(() => {",
  "      NODES.set(node.id, node);",
  "      return () => NODES.delete(node.id);",
  "    }, [node]);",
  "    return <NodeRenderer node={node} slot={children === undefined ? null : children} />;",
  "  };",
].join(NL);

export function generateJsx(screen) {
  const types = new Set();
  const walk = (n) => {
    if (!n) return;
    types.add(n.type);
    (n.children || []).forEach(walk);
  };
  walk(screen.root);

  const name = pascal(screen.name);
  const sources = JSON.stringify(screen.dataSources || {}, null, 2);
  const consts = [...types]
    .sort()
    .map((t) => `const ${t} = C("${t}");`)
    .join(NL);

  // Hand-written pages open with <Heading isBreadcrumb />, which reads the trail
  // from the menu itself — so the generated file says exactly that rather than
  // baking in the text this screen happens to show today.
  const withHeader = wantsHeader(screen);
  // Aliased: the registry has a "Heading" component of its own, and a screen
  // that uses one would otherwise export a file that declares the name twice.
  const richHeader = withHeader && headerHasExtras(screen.header);
  const headerJsx = richHeader
    ? `${pad(3)}<ScreenHeader screen={{ name: SCREEN.name, header: HEADER }} />`
    : screen.header?.showBreadcrumb === false
      ? `${pad(3)}<AppHeading title={SCREEN.name} />`
      : `${pad(3)}<AppHeading title={SCREEN.name} isBreadcrumb={true} />`;

  const header = [
    "/**",
    ` * ${screen.name}`,
    ` * Generated from the Dynamic Screen Builder — screen id: ${screen.id}`,
    " *",
    " * The components below are the registry's own renderers, so this file behaves",
    " * exactly like the JSON screen did. Replace any of them with hand-written",
    " * markup as the screen graduates into maintained code. Staying on",
    " * <ScreenRenderer screen={json}/> instead keeps it editable in the builder.",
    " */",
    'import React, { useEffect, useMemo } from "react";',
    'import { RuntimeProvider } from "@app/components/DynamicScreenBuilder/runtime/RuntimeContext";',
    'import { NodeRenderer } from "@app/components/DynamicScreenBuilder/renderer/ScreenRenderer";',
    ...(richHeader
      ? ['import ScreenHeader from "@app/components/DynamicScreenBuilder/renderer/ScreenHeader";']
      : withHeader
        ? ['import AppHeading from "@app/components/UI/Heading";']
        : []),
    'import "@app/components/DynamicScreenBuilder/styles/runtime.css";',
    "",
    ADAPTER,
    "",
    consts,
    "",
    `const DATA_SOURCES = ${sources};`,
    "",
    ...(richHeader
      ? [
          "// The page header's buttons, text and search, as configured in the builder.",
          `const HEADER = ${JSON.stringify({ ...screen.header, mode: "on" }, null, 2)};`,
          "",
        ]
      : []),
    `const SCREEN = {`,
    `  id: ${JSON.stringify(screen.id)},`,
    `  name: ${JSON.stringify(screen.name)},`,
    `  dataSources: DATA_SOURCES,`,
    `  variables: ${JSON.stringify(screen.variables || {})},`,
    `  theme: ${JSON.stringify(screen.theme || {})},`,
    "  // What is on screen right now, as a tree — the shape the runtime expects",
    "  // when an action asks it to validate the form or open a dialog by id.",
    "  get root() {",
    '    return { id: "root", type: "Container", props: {}, children: [...NODES.values()] };',
    "  },",
    `};`,
    "",
    `export default function ${name}() {`,
    "  return (",
    "    <RuntimeProvider screen={SCREEN}>",
  ].join(NL);

  const footer = ["    </RuntimeProvider>", "  );", "}", ""].join(NL);

  const body = withHeader ? [headerJsx, nodeToJsx(screen.root, 3)].join(NL) : nodeToJsx(screen.root, 3);
  return [header, body, footer].join(NL);
}

export default generateJsx;
