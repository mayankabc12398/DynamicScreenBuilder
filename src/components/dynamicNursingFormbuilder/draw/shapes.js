/**
 * Drawing model — Paint-style marks kept as vectors in mm, so they print sharp,
 * stay aligned with the form at any zoom, and every mark can be selected again.
 *
 *   { id, page, kind, stroke, fill, width, dash, opacity, fillOpacity, ... }
 *
 *   kind "stroke"   freehand: pts [[x,y]…], brush pencil|brush|marker|highlighter
 *   kind "line"     pts [a, b]           kind "curve"  pts [a, b, control]
 *   kind "polygon"  pts [[x,y]…] closed
 *   kind "text"     x, y, w, h, text, fontSize (pt)
 *   kind "image"    x, y, w, h, src (data URL; older marks: fileKey) — see image.js
 *   any SHAPES id   x, y, w, h  (rect, ellipse, star5, arrowR, heart, …)
 *
 * Shapes are written once in a 0..1 box and mapped to their mm box — the same
 * geometry draws the toolbar icons.
 */

const poly = (pts) => [["M", ...pts[0]], ...pts.slice(1).map((p) => ["L", ...p]), ["Z"]];
const starPts = (n, inner) => {
  const out = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? inner * 0.5 : 0.5;
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    out.push([0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)]);
  }
  return out;
};
const ellipse = (cx = 0.5, cy = 0.5, rx = 0.5, ry = 0.5) => {
  const kx = rx * 0.5523;
  const ky = ry * 0.5523;
  return [
    ["M", cx, cy - ry],
    ["C", cx + kx, cy - ry, cx + rx, cy - ky, cx + rx, cy],
    ["C", cx + rx, cy + ky, cx + kx, cy + ry, cx, cy + ry],
    ["C", cx - kx, cy + ry, cx - rx, cy + ky, cx - rx, cy],
    ["C", cx - rx, cy - ky, cx - kx, cy - ry, cx, cy - ry],
    ["Z"],
  ];
};
const cloud = () => {
  const n = 9;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [0.5 + 0.4 * Math.cos(a), 0.5 + 0.34 * Math.sin(a)];
  });
  const cmds = [["M", ...pts[0]]];
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    cmds.push(["Q", 0.5 + (mx - 0.5) * 1.42, 0.5 + (my - 0.5) * 1.42, ...b]);
  }
  cmds.push(["Z"]);
  return cmds;
};

/** Unit-box geometry of every shape tool, in toolbar order. */
const UNIT = {
  ellipse: ellipse(),
  rect: poly([[0, 0], [1, 0], [1, 1], [0, 1]]),
  triangle: poly([[0.5, 0], [1, 1], [0, 1]]),
  rtriangle: poly([[0, 0], [1, 1], [0, 1]]),
  diamond: poly([[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]]),
  pentagon: poly([[0.5, 0], [1, 0.38], [0.81, 1], [0.19, 1], [0, 0.38]]),
  hexagon: poly([[0.25, 0], [0.75, 0], [1, 0.5], [0.75, 1], [0.25, 1], [0, 0.5]]),
  arrowR: poly([[0, 0.3], [0.6, 0.3], [0.6, 0], [1, 0.5], [0.6, 1], [0.6, 0.7], [0, 0.7]]),
  arrowL: poly([[1, 0.3], [0.4, 0.3], [0.4, 0], [0, 0.5], [0.4, 1], [0.4, 0.7], [1, 0.7]]),
  arrowU: poly([[0.3, 1], [0.3, 0.4], [0, 0.4], [0.5, 0], [1, 0.4], [0.7, 0.4], [0.7, 1]]),
  arrowD: poly([[0.3, 0], [0.3, 0.6], [0, 0.6], [0.5, 1], [1, 0.6], [0.7, 0.6], [0.7, 0]]),
  star4: poly(starPts(4, 0.36)),
  star5: poly(starPts(5, 0.42)),
  star6: poly(starPts(6, 0.55)),
  callout: poly([[0, 0], [1, 0], [1, 0.72], [0.42, 0.72], [0.18, 1], [0.24, 0.72], [0, 0.72]]),
  cloud: cloud(),
  heart: [
    ["M", 0.5, 0.26],
    ["C", 0.5, 0.08, 0.25, -0.02, 0.1, 0.1],
    ["C", -0.06, 0.26, 0.04, 0.52, 0.5, 0.96],
    ["C", 0.96, 0.52, 1.06, 0.26, 0.9, 0.1],
    ["C", 0.75, -0.02, 0.5, 0.08, 0.5, 0.26],
    ["Z"],
  ],
  bolt: poly([[0.58, 0], [0.12, 0.56], [0.44, 0.56], [0.3, 1], [0.88, 0.4], [0.56, 0.4], [0.78, 0]]),
};

/** The shape tools as the toolbar lists them. "line", "curve", "polygon", "rrect" are drawn specially. */
export const SHAPES = [
  { id: "line", label: "Line" },
  { id: "curve", label: "Curve" },
  { id: "ellipse", label: "Oval" },
  { id: "rect", label: "Rectangle" },
  { id: "rrect", label: "Rounded rectangle" },
  { id: "polygon", label: "Polygon (double-click to close)" },
  { id: "triangle", label: "Triangle" },
  { id: "rtriangle", label: "Right triangle" },
  { id: "diamond", label: "Diamond" },
  { id: "pentagon", label: "Pentagon" },
  { id: "hexagon", label: "Hexagon" },
  { id: "arrowR", label: "Right arrow" },
  { id: "arrowL", label: "Left arrow" },
  { id: "arrowU", label: "Up arrow" },
  { id: "arrowD", label: "Down arrow" },
  { id: "star4", label: "4-point star" },
  { id: "star5", label: "5-point star" },
  { id: "star6", label: "6-point star" },
  { id: "callout", label: "Callout" },
  { id: "cloud", label: "Cloud" },
  { id: "heart", label: "Heart" },
  { id: "bolt", label: "Lightning" },
];

const f = (n) => Math.round(n * 1000) / 1000;
const mapCmds = (cmds, x, y, w, h) =>
  cmds
    .map(([c, ...n]) => {
      if (c === "Z") return "Z";
      const out = [];
      for (let i = 0; i < n.length; i += 2) out.push(`${f(x + n[i] * w)} ${f(y + n[i + 1] * h)}`);
      return `${c}${out.join(" ")}`;
    })
    .join("");

/** SVG path of a box shape at x, y, w, h (mm). */
export function shapeD(kind, x, y, w, h) {
  if (kind === "rrect") {
    const r = Math.min(Math.abs(w), Math.abs(h)) * 0.18;
    const sx = Math.sign(w) || 1;
    const sy = Math.sign(h) || 1;
    const rx = r * sx;
    const ry = r * sy;
    return `M${f(x + rx)} ${f(y)}H${f(x + w - rx)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + ry)}V${f(y + h - ry)}Q${f(x + w)} ${f(y + h)} ${f(x + w - rx)} ${f(y + h)}H${f(x + rx)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - ry)}V${f(y + ry)}Q${f(x)} ${f(y)} ${f(x + rx)} ${f(y)}Z`;
  }
  const u = UNIT[kind];
  return u ? mapCmds(u, x, y, w, h) : "";
}

/** Toolbar icon path for a shape tool (24-unit grid). */
export function shapeIconD(kind) {
  if (kind === "line") return "M4 20L20 4";
  if (kind === "curve") return "M4 18C8 2 14 24 20 6";
  if (kind === "polygon") return "M5 7L12 3L20 9L17 20L6 18Z";
  return shapeD(kind, 4, 4, 16, 16);
}

/** Smooth freehand path through the points (quadratic through midpoints). */
export function smoothD(pts) {
  if (!pts?.length) return "";
  if (pts.length === 1) return `M${f(pts[0][0])} ${f(pts[0][1])}l0.01 0`;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    d += `Q${f(x)} ${f(y)} ${f((x + nx) / 2)} ${f((y + ny) / 2)}`;
  }
  const l = pts[pts.length - 1];
  return `${d}L${f(l[0])} ${f(l[1])}`;
}

export function itemD(it) {
  switch (it.kind) {
    case "stroke":
      return smoothD(it.pts);
    case "line":
      return `M${f(it.pts[0][0])} ${f(it.pts[0][1])}L${f(it.pts[1][0])} ${f(it.pts[1][1])}`;
    case "curve": {
      const [a, b, c] = it.pts;
      const ctl = c || [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      return `M${f(a[0])} ${f(a[1])}Q${f(ctl[0])} ${f(ctl[1])} ${f(b[0])} ${f(b[1])}`;
    }
    case "polygon":
      return it.pts.length ? `M${it.pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L")}${it.closed === false ? "" : "Z"}` : "";
    default:
      return shapeD(it.kind, it.x, it.y, it.w, it.h);
  }
}

export const isPointKind = (k) => k === "stroke" || k === "line" || k === "curve" || k === "polygon";
export const isClosed = (it) => !["stroke", "line", "curve"].includes(it.kind);

/** Normalised box { x, y, w, h } (positive size), padded by half the stroke. */
export function bbox(it, pad = true) {
  let x0;
  let y0;
  let x1;
  let y1;
  if (isPointKind(it.kind)) {
    const xs = it.pts.map((p) => p[0]);
    const ys = it.pts.map((p) => p[1]);
    [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  } else {
    [x0, x1] = [Math.min(it.x, it.x + it.w), Math.max(it.x, it.x + it.w)];
    [y0, y1] = [Math.min(it.y, it.y + it.h), Math.max(it.y, it.y + it.h)];
  }
  const p = pad && it.kind !== "text" ? (it.width || 0) / 2 : 0;
  return { x: x0 - p, y: y0 - p, w: x1 - x0 + 2 * p, h: y1 - y0 + 2 * p };
}

const segDist = (p, a, b) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
};
const polyDist = (p, pts, closed) => {
  let d = pts.length === 1 ? Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]) : Infinity;
  for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segDist(p, pts[i], pts[i + 1]));
  if (closed && pts.length > 2) d = Math.min(d, segDist(p, pts[pts.length - 1], pts[0]));
  return d;
};
const inPoly = (p, pts) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const curvePts = (it) => {
  const [a, b, c] = it.pts;
  const ctl = c || [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  return Array.from({ length: 17 }, (_, i) => {
    const t = i / 16;
    const u = 1 - t;
    return [u * u * a[0] + 2 * u * t * ctl[0] + t * t * b[0], u * u * a[1] + 2 * u * t * ctl[1] + t * t * b[1]];
  });
};

/** Is point p (mm) on the mark? `tol` mm of slack. "inside" = a filled interior counts too. */
export function hitTest(it, p, tol = 1.2) {
  const half = (it.width || 0) / 2;
  if (it.kind === "stroke" || it.kind === "line") return polyDist(p, it.pts, false) <= tol + half;
  if (it.kind === "curve") return polyDist(p, curvePts(it), false) <= tol + half;
  if (it.kind === "polygon") return polyDist(p, it.pts, true) <= tol + half || (!!it.fill && inPoly(p, it.pts));
  const b = bbox(it, false);
  const inside = p[0] >= b.x - tol && p[0] <= b.x + b.w + tol && p[1] >= b.y - tol && p[1] <= b.y + b.h + tol;
  if (!inside) return false;
  if (it.kind === "text" || it.kind === "image" || it.fill) return true;
  const edge = Math.min(Math.abs(p[0] - b.x), Math.abs(p[0] - b.x - b.w), Math.abs(p[1] - b.y), Math.abs(p[1] - b.y - b.h));
  if (it.kind === "ellipse") {
    const rx = b.w / 2;
    const ry = b.h / 2;
    const nx = (p[0] - b.x - rx) / Math.max(rx, 0.01);
    const ny = (p[1] - b.y - ry) / Math.max(ry, 0.01);
    return Math.abs(Math.hypot(nx, ny) - 1) * Math.min(rx, ry) <= tol + half;
  }
  // other outlines: near the box edge, or near the centre of small shapes
  return edge <= tol + half + Math.min(b.w, b.h) * 0.12;
}

/** Topmost mark on `page` under p. */
export const topHit = (items, page, p, tol) => [...items].reverse().find((it) => it.page === page && hitTest(it, p, tol));

/** The mark mapped from box `from` to box `to` (move or resize). */
export function refit(it, from, to) {
  const sx = from.w ? to.w / from.w : 1;
  const sy = from.h ? to.h / from.h : 1;
  const map = ([x, y]) => [r2(to.x + (x - from.x) * sx), r2(to.y + (y - from.y) * sy)];
  if (isPointKind(it.kind)) return { ...it, pts: it.pts.map(map) };
  const [x, y] = map([it.x, it.y]);
  return { ...it, x, y, w: r2(it.w * sx), h: r2(it.h * sy) };
}
export const moveBy = (it, dx, dy) => {
  const b = bbox(it, false);
  return refit(it, b, { ...b, x: b.x + dx, y: b.y + dy });
};

const r2 = (n) => Math.round(n * 100) / 100;
let seq = 0;
export const drawId = () => `d${Date.now().toString(36)}${(seq++).toString(36)}`;
