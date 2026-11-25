/**
 * COMMON COMPONENTS — one configured component, saved whole and reused.
 *
 * A "saved block" (utils/storage → GroupRepo) only ever stored the node tree.
 * That is enough for a layout, and wrong for anything wired up: a Panel with a
 * grid inside it carries a screen-level data source id, a variable name, an
 * app-modal key and an action that points at a sibling by node id. Dropping the
 * bare tree into another screen keeps all four references and none of the
 * things they refer to, so the copy renders and stays empty.
 *
 * A common component is therefore a PACK, not a node:
 *
 *   {
 *     id, name, icon, category, description,      // how it shows in the palette
 *     node:        <NODE>,                        // the subtree, ids as saved
 *     dataSources: { ds_x: {...} },               // every screen-level source it reads
 *     variables:   { activeTab: "ALL" },          // every {{vars.x}} it mentions
 *     appModals:   [ {...} ],                     // every app modal its actions open
 *     apis:        [ {label, method, endpoint} ], // shown in the save dialog
 *     at, packVersion
 *   }
 *
 * Dropping it runs `instantiateComponent`, which gives every node a fresh id,
 * rewrites the references INSIDE the subtree to the new ids, and merges the
 * sources / variables / modals into the target screen — reusing a source that
 * is already there and the same, renaming one that clashes.
 *
 * Component-level API configs (node.props.apiConfig, utils/apiConfig) need none
 * of this: their runtime source id is derived from the node id, so it follows
 * the node when it is re-ided. That is why an API picked on the component
 * itself is the most portable way to wire a common component up.
 */
import { normalizeNode, uid } from "../schema/schema";
import { flatten, forEachNode } from "./tree";
import { isApiConfigReady } from "./apiConfig";

/** A source id of this shape is a component's own API, keyed by its node id. */
export const NODE_REF = "node:";

export const PACK_VERSION = 1;

/** Categories offered in the save dialog. Free text is allowed beside them. */
export const COMMON_CATEGORIES = ["General", "Search", "Patient", "Billing", "Clinical", "Reports", "Admin"];

const clone = (v) => JSON.parse(JSON.stringify(v));

/**
 * Props that hold what a component is CALLED on screen, best first.
 *
 * `node.name` is the builder's own label and is usually still the registry
 * default ("Select", "Panel") long after the component has been given a real
 * caption — so the caption is the better name to offer when saving one.
 */
const NAME_PROPS = ["label", "title", "text", "caption", "heading", "placeholder"];

/**
 * The name to suggest for a saved component: its visible label, falling back to
 * the layers-tree name. A bound label (`{{row.x}}`) is skipped — that is a value
 * at runtime, not a name in the palette.
 */
export function suggestName(node) {
  if (!node) return "";
  for (let i = 0; i < NAME_PROPS.length; i += 1) {
    const v = node.props?.[NAME_PROPS[i]];
    if (typeof v === "string") {
      const text = v.trim().replace(/\s*\*$/, "");
      if (text && !text.includes("{{")) return text;
    }
  }
  return node.name || node.type || "";
}

/**
 * Walk every stored reference in a subtree, replacing each with `fn(value, kind)`.
 *
 * `kind` is "source" for anything that resolves against `rt.data` (a screen
 * data source id, or a `node:<id>` pointing at a component's own API) and
 * "node" for a plain node id. The tree is mutated, so callers pass a copy.
 */
export function visitRefs(tree, fn) {
  forEachNode(tree, (n) => {
    if (n.binding?.sourceId) n.binding.sourceId = fn(n.binding.sourceId, "source");
    if (n.props?.dataSourceId) n.props.dataSourceId = fn(n.props.dataSourceId, "source");
    Object.values(n.events || {}).forEach((list) => {
      (Array.isArray(list) ? list : []).forEach((a) => {
        if (!a || typeof a !== "object") return;
        if (a.sourceId) a.sourceId = fn(a.sourceId, "source");
        if (a.target) a.target = fn(a.target, "node");
        if (a.targetId) a.targetId = fn(a.targetId, "node");
      });
    });
  });
  return tree;
}

/** The node id inside a reference, whether it is bare or `node:`-prefixed. */
const refNodeId = (value) => (String(value).startsWith(NODE_REF) ? String(value).slice(NODE_REF.length) : "");

/** Variable names a subtree mentions as `{{vars.x}}`, anywhere in its JSON. */
export function usedVariables(tree) {
  const out = new Set();
  const re = /\{\{\s*vars\.([A-Za-z0-9_$]+)/g;
  const json = JSON.stringify(tree || {});
  let m = re.exec(json);
  while (m) {
    out.add(m[1]);
    m = re.exec(json);
  }
  return [...out];
}

/** App-modal keys the subtree's actions open. */
export function usedAppModals(tree) {
  const out = new Set();
  forEachNode(tree, (n) => {
    Object.values(n.events || {}).forEach((list) =>
      (Array.isArray(list) ? list : []).forEach((a) => {
        if (a?.type === "openAppModal" && a.appModal) out.add(a.appModal);
      }),
    );
    // A table's row actions carry their modal key in props, not in events.
    (Array.isArray(n.props?.rowActions) ? n.props.rowActions : []).forEach((a) => {
      if (a?.modal) out.add(a.modal);
    });
  });
  return [...out];
}

/**
 * Every API config anywhere inside a value, with the prop path that holds it.
 *
 * Deliberately structural rather than a list of known keys. A table keeps its
 * endpoint in `props.apiConfig`, a select keeps the one that fills its options
 * in `props.optionsApi`, an action keeps its own in `api` — and the next
 * component to want one will invent a fourth name. Anything shaped like an API
 * config counts, so the summary never again reports "0 API calls" over a
 * component that plainly calls one.
 */
function findApiConfigs(value, path = "", out = []) {
  if (!value || typeof value !== "object") return out;
  if (Array.isArray(value)) {
    value.forEach((v, i) => findApiConfigs(v, `${path}[${i}]`, out));
    return out;
  }
  if (isApiConfigReady(value)) {
    out.push({ path, cfg: value });
    return out; // an endpoint's own params are not more endpoints
  }
  Object.entries(value).forEach(([k, v]) => findApiConfigs(v, path ? `${path}.${k}` : k, out));
  return out;
}

/** Every endpoint the subtree calls, for the "what travels with it" summary. */
export function describeApis(tree, dataSources = {}) {
  const out = [];
  forEachNode(tree, (n) => {
    const who = n.name || n.type;
    findApiConfigs(n.props || {}).forEach(({ path, cfg }) => {
      out.push({
        kind: "component",
        owner: path === "apiConfig" ? who : `${who} · ${path}`,
        method: cfg.method || "GET",
        endpoint: cfg.endpoint,
      });
    });
    Object.entries(n.events || {}).forEach(([evt, list]) =>
      (Array.isArray(list) ? list : []).forEach((a) => {
        findApiConfigs(a || {}).forEach(({ cfg }) => {
          out.push({ kind: "action", owner: `${who} · ${evt}`, method: cfg.method || "GET", endpoint: cfg.endpoint });
        });
      }),
    );
  });
  Object.values(dataSources).forEach((ds) => {
    if (ds?.mode === "api" && ds.url) {
      out.push({ kind: "source", owner: ds.name || ds.id, method: ds.method || "GET", endpoint: ds.url });
    }
  });
  return out;
}

/**
 * Turn a selected node into a saveable pack.
 *
 * The `report` is what the save dialog shows: which endpoints travel with it,
 * and which references point OUTSIDE the selection — those cannot travel, and
 * saying so at save time is the difference between a component that works
 * everywhere and one that quietly does nothing on its second screen.
 */
export function packComponent({ node, screen, meta = {} }) {
  const tree = clone(node);
  // Saving an instance produces a component in its own right, not a copy that
  // still claims to belong to the pack it was dropped from.
  delete tree.common;
  const inside = new Set(flatten(tree).map((n) => n.id));

  const dataSources = {};
  const missingSources = [];
  const externalNodes = [];

  visitRefs(tree, (value, kind) => {
    const asNode = kind === "node" ? String(value) : refNodeId(value);
    if (asNode) {
      if (!inside.has(asNode)) externalNodes.push(asNode);
      return value;
    }
    if (kind === "source") {
      const ds = screen?.dataSources?.[value];
      if (ds) dataSources[value] = clone(ds);
      else missingSources.push(value);
    }
    return value;
  });

  const variables = {};
  usedVariables(tree).forEach((name) => {
    variables[name] = screen?.variables?.[name] ?? "";
  });

  const modalKeys = usedAppModals(tree);
  const appModals = (screen?.appModals || []).filter((e) => modalKeys.includes(e.key)).map(clone);

  const nodes = flatten(tree);
  const pack = {
    id: meta.id || uid("cmp"),
    name: meta.name || suggestName(node) || "Common component",
    icon: meta.icon || "SquareStack",
    category: meta.category || "General",
    description: meta.description || "",
    packVersion: PACK_VERSION,
    node: tree,
    dataSources,
    variables,
    appModals,
    apis: describeApis(tree, dataSources),
    rootType: tree.type,
    nodeCount: nodes.length,
    at: new Date().toISOString(),
  };

  return {
    pack,
    report: {
      apis: pack.apis,
      sources: Object.values(dataSources),
      variables: Object.keys(variables),
      appModals: modalKeys,
      externalNodes: [...new Set(externalNodes)],
      missingSources: [...new Set(missingSources)],
      nodeCount: nodes.length,
      ruleCount: nodes.reduce((sum, n) => sum + (n.rules?.visibility?.length || 0) + (n.rules?.color?.length || 0), 0),
      eventCount: nodes.reduce((sum, n) => sum + Object.values(n.events || {}).flat().length, 0),
      validationCount: nodes.filter((n) => n.validation?.required || n.validation?.regex || n.validation?.email).length,
    },
  };
}

/** Two sources are "the same" when they would fetch the same thing. */
const sameSource = (a, b) =>
  !!a &&
  !!b &&
  a.mode === b.mode &&
  String(a.url || "") === String(b.url || "") &&
  String(a.method || "") === String(b.method || "") &&
  String(a.responsePath || "") === String(b.responsePath || "");

/**
 * Materialise a pack into a target screen.
 *
 * Returns the node to insert plus the screen-level maps to write back. Nothing
 * on the way in is mutated: the caller commits the node and the maps together,
 * so a half-inserted component — a node whose data source never arrived —
 * cannot exist in history.
 */
export function instantiateComponent(pack, screen) {
  const tree = pack?.node ? clone(pack.node) : null;
  if (!tree) return null;

  const notes = [];

  /* ----------------------------------------------------- screen data sources */
  const dataSources = { ...(screen?.dataSources || {}) };
  const dsMap = {};
  Object.entries(pack.dataSources || {}).forEach(([id, ds]) => {
    const existing = dataSources[id];
    if (!existing) {
      dsMap[id] = id;
      dataSources[id] = { ...clone(ds), id };
      return;
    }
    if (sameSource(existing, ds)) {
      dsMap[id] = id; // already on this screen, and identical — reuse it
      return;
    }
    const fresh = uid("ds");
    dsMap[id] = fresh;
    dataSources[fresh] = { ...clone(ds), id: fresh, name: `${ds.name || id} (${pack.name})` };
    notes.push(`Data source “${ds.name || id}” already existed with other settings — added as a copy.`);
  });

  /* --------------------------------------------------------------- variables */
  const variables = { ...(screen?.variables || {}) };
  Object.entries(pack.variables || {}).forEach(([k, v]) => {
    if (!(k in variables)) variables[k] = v;
  });

  /* -------------------------------------------------------------- app modals */
  const appModals = [...(screen?.appModals || [])];
  (pack.appModals || []).forEach((entry) => {
    if (!appModals.some((e) => e.key === entry.key)) appModals.push(clone(entry));
  });

  /* ---------------------------------------------------------- fresh node ids */
  const idMap = {};
  flatten(tree).forEach((n) => {
    idMap[n.id] = uid("n");
  });
  forEachNode(tree, (n) => {
    n.id = idMap[n.id] || uid("n");
  });

  // Now the ids are new but every reference still holds the old one, so this
  // is the moment to rewrite them.
  visitRefs(tree, (value, kind) => {
    if (kind === "node") return idMap[value] || value;
    const asNode = refNodeId(value);
    if (asNode) return idMap[asNode] ? `${NODE_REF}${idMap[asNode]}` : value;
    return dsMap[value] || value;
  });

  const node = normalizeNode(tree);
  // The instance is named after the saved component, so the layers tree says
  // "Patient search panel" rather than the registry default it was built from.
  if (pack.name) node.name = pack.name;
  // The instance remembers where it came from, so it can be recognised later
  // (the badge in the layers tree, and a future "update every instance").
  node.common = { id: pack.id, name: pack.name, version: pack.packVersion || PACK_VERSION };

  return { node, dataSources, variables, appModals, notes };
}

export default { packComponent, instantiateComponent, visitRefs, describeApis, suggestName, COMMON_CATEGORIES };
