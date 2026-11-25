/**
 * Immutable node-tree helpers. Every mutation returns a NEW root so the
 * reducer can push the previous root onto the undo stack and React can rely
 * on reference equality for memoisation.
 */
import { uid, emptyResponsive, emptyRules, emptyValidation } from "../schema/schema";

export function findNode(root, id) {
  if (!root || !id) return null;
  if (root.id === id) return root;
  const kids = root.children || [];
  for (let i = 0; i < kids.length; i += 1) {
    const hit = findNode(kids[i], id);
    if (hit) return hit;
  }
  return null;
}

export function findParent(root, id, parent = null) {
  if (!root) return null;
  if (root.id === id) return parent;
  const kids = root.children || [];
  for (let i = 0; i < kids.length; i += 1) {
    const hit = findParent(kids[i], id, root);
    if (hit) return hit;
  }
  return null;
}

/** Path of ancestors from root down to (and including) the node. */
export function findPath(root, id, trail = []) {
  if (!root) return null;
  const next = [...trail, root];
  if (root.id === id) return next;
  const kids = root.children || [];
  for (let i = 0; i < kids.length; i += 1) {
    const hit = findPath(kids[i], id, next);
    if (hit) return hit;
  }
  return null;
}

export function forEachNode(root, fn, parent = null) {
  if (!root) return;
  fn(root, parent);
  (root.children || []).forEach((c) => forEachNode(c, fn, root));
}

export function flatten(root) {
  const out = [];
  forEachNode(root, (n) => out.push(n));
  return out;
}

/** True when `maybeAncestorId` sits above `nodeId` (used to block bad drops). */
export function isAncestor(root, maybeAncestorId, nodeId) {
  const anc = findNode(root, maybeAncestorId);
  if (!anc) return false;
  return !!findNode(anc, nodeId) && maybeAncestorId !== nodeId;
}

/** Structural map — returns a new tree with `fn(node)` applied to every node. */
export function mapTree(root, fn) {
  if (!root) return root;
  const mapped = fn(root);
  if (!mapped.children) return mapped;
  return { ...mapped, children: mapped.children.map((c) => mapTree(c, fn)) };
}

export function updateNode(root, id, updater) {
  return mapTree(root, (n) => (n.id === id ? updater(n) : n));
}

export function removeNode(root, id) {
  if (!root || root.id === id) return root; // never remove the root
  const strip = (node) => {
    if (!node.children) return node;
    const kids = node.children.filter((c) => c.id !== id).map(strip);
    return { ...node, children: kids };
  };
  return strip(root);
}

/** Insert `node` into `parentId` at `index` (clamped). */
export function insertNode(root, parentId, node, index = -1) {
  return mapTree(root, (n) => {
    if (n.id !== parentId) return n;
    const kids = [...(n.children || [])];
    const at = index < 0 || index > kids.length ? kids.length : index;
    kids.splice(at, 0, node);
    return { ...n, children: kids };
  });
}

/**
 * Move an existing node under a new parent at a given index. The index is
 * interpreted against the tree AFTER the node has been detached, which is the
 * behaviour a drag-and-drop drop indicator implies.
 *
 * Nothing is subtracted for a move within the same parent. The drop resolver
 * already measures against the siblings with the dragged node filtered out, so
 * its index is in post-detach terms; compensating again shifted every forward
 * move one slot short of where the indicator had been drawn.
 */
export function moveNode(root, nodeId, newParentId, index) {
  if (nodeId === newParentId) return root;
  if (isAncestor(root, nodeId, newParentId)) return root; // cannot nest into self
  const node = findNode(root, nodeId);
  if (!node) return root;
  const detached = removeNode(root, nodeId);
  return insertNode(detached, newParentId, node, index);
}

export function reorderChildren(root, parentId, fromIndex, toIndex) {
  return mapTree(root, (n) => {
    if (n.id !== parentId || !n.children) return n;
    const kids = [...n.children];
    const [moved] = kids.splice(fromIndex, 1);
    if (!moved) return n;
    kids.splice(toIndex, 0, moved);
    return { ...n, children: kids };
  });
}

/** Deep clone with brand-new ids all the way down (copy / paste / duplicate). */
export function cloneNode(node, suffix = "") {
  if (!node) return null;
  const copy = JSON.parse(JSON.stringify(node));
  const rename = (n, isRoot) => {
    n.id = uid("n");
    if (isRoot && suffix) n.name = `${n.name}${suffix}`;
    if (!n.responsive) n.responsive = emptyResponsive();
    if (!n.rules) n.rules = emptyRules();
    if (!n.validation) n.validation = emptyValidation();
    (n.children || []).forEach((c) => rename(c, false));
    return n;
  };
  return rename(copy, true);
}

/** Sibling index of a node inside its parent. */
export function indexOfNode(root, id) {
  const parent = findParent(root, id);
  if (!parent) return -1;
  return (parent.children || []).findIndex((c) => c.id === id);
}
