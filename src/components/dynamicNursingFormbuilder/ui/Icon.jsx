/** Line icons (24-unit grid, 1.75 stroke) — one set for the whole builder. */
import React from "react";

const P = {
  plus: "M12 5v14M5 12h14",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  x: "M6 6l12 12M18 6L6 18",
  check: "M5 12.5l4.5 4.5L19 7.5",
  chevL: "M15 6l-6 6 6 6",
  chevR: "M9 6l6 6-6 6",
  chevD: "M6 9l6 6 6-6",
  chevU: "M6 15l6-6 6 6",
  pdf: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M8.5 13.5h1.5a1.25 1.25 0 0 0 0-2.5H8.5v5M13 11v5h1a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2z",
  image: "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM20 15l-5-5L5 20",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5",
  upload: "M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  download: "M12 4v12M7 11l5 5 5-5M4 20h16",
  zoomIn: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M8 11h6M11 8v6",
  zoomOut: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M8 11h6",
  fitW: "M4 12h16M7 9l-3 3 3 3M17 9l3 3-3 3M4 4v16M20 4v16",
  fitP: "M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3",
  rotate: "M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6",
  full: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  fullExit: "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5",
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6",
  print: "M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z",
  edit: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  copy: "M9 9h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  restore: "M4 12a8 8 0 1 0 2.3-5.7M4 5v5h5",
  design: "M12 20l7-7-3-3-7 7v3zM16 10l-6-6-6 6 6 6M14 4l6 6",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  save: "M5 4h11l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8 4v5h7V4M8 20v-6h8v6",
  publish: "M7 18a5 5 0 0 1-.9-9.9A6 6 0 0 1 17.6 7 4.5 4.5 0 0 1 17 18M12 12v8M9 15l3-3 3 3",
  history: "M4 12a8 8 0 1 0 2.3-5.7M4 5v5h5M12 8v4l3 2",
  undo: "M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
  redo: "M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3",
  unlock: "M6 11h12v9H6zM8 11V8a4 4 0 0 1 7.5-2",
  grid: "M4 4h16v16H4zM4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16",
  ruler: "M3 17L17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2",
  magnet: "M6 4v8a6 6 0 0 0 12 0V4h-4v8a2 2 0 0 1-4 0V4zM6 8h4M14 8h4",
  alignL: "M4 3v18M8 7h10v4H8zM8 14h6v4H8z",
  alignCH: "M12 3v18M6 7h12v4H6zM8.5 14h7v4h-7z",
  alignR: "M20 3v18M6 7h10v4H6zM10 14h6v4h-6z",
  alignT: "M3 4h18M7 8h4v10H7zM14 8h4v6h-4z",
  alignCV: "M3 12h18M7 6h4v12H7zM14 8.5h4v7h-4z",
  alignB: "M3 20h18M7 6h4v10H7zM14 10h4v6h-4z",
  distH: "M4 3v18M20 3v18M9 8h6v8H9z",
  distV: "M3 4h18M3 20h18M8 9h8v6H8z",
  sameW: "M4 8h16v8H4zM4 4v2M20 4v2M4 5h16",
  sameH: "M8 4h8v16H8zM4 4h2M4 20h2M5 4v16",
  data: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  combo: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  text: "M5 6V4h14v2M12 4v16M9 20h6",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  tick: "M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM8 12l3 3 5-6",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2v2M18 18h2v2",
  barcode: "M4 5v14M7 5v14M10 5v14M14 5v14M16 5v14M20 5v14",
  input: "M4 7h16v10H4zM8 10v4M7 10h2M7 14h2",
  sign: "M3 17c3-1 4-6 6-6s0 6 2 6 3-4 5-4 2 3 5 3M3 21h18",
  layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
  panel: "M4 4h16v16H4zM9 4v16",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z",
  import: "M12 3v12M7 10l5 5 5-5M5 21h14",
  export: "M12 15V3M7 8l5-5 5 5M5 21h14",
  wand: "M15 4V2M15 10V8M11 6h2M17 6h2M4 20L14 10M18.5 3.5l1 1M10.5 3.5l-1 1M18.5 8.5l1 1",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  log: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  alert: "M12 3l9.5 17h-19zM12 10v4M12 17.5h.01",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  page: "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z",
  eraser: "M8 20h12M5 15l9-9 5 5-9 9H8z",
  keyboard: "M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5h.01",
  move: "M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3",
  repeat: "M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4",
  bold: "M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z",
  italic: "M10 5h8M6 19h8M14 5l-4 14",
  underline: "M7 4v7a5 5 0 0 0 10 0V4M5 20h14",
  bucket: "M5 11l7-7 7 7-7 7zM5 11h14M19 14c0 0 2 2.5 2 3.6a2 2 0 0 1-4 0c0-1.1 2-3.6 2-3.6z",
  pipette: "M15 4l5 5M17.5 6.5l-9.5 9.5-3 1 1-3 9.5-9.5M14 5l5 5",
  cursor: "M5 3l13 7-6 1.5-2.5 6z",
  hand: "M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.3l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15",
  brush: "M20 4L10 14M9 15c-2 0-4 1.5-4 4 0 .6-.5 1-1 1 1 1 2.5 1 4 1 2.5 0 4-2 4-4z",
  marker: "M14 4l6 6-8 8H6v-6zM6 18l-2 2M11 7l6 6",
  highlighter: "M9 11l6-6 4 4-6 6M9 11l4 4-3 3H6v-4zM6 18l-2 2h5",
  paint: "M12 3a9 9 0 0 0 0 18c1 0 1.5-.8 1.5-1.5 0-1.2-1-1.5-1-2.5s.8-1.5 2-1.5H17a4 4 0 0 0 4-4c0-4.7-4-8.5-9-8.5zM7.5 11h.01M10 7h.01M15 7h.01",
  outline: "M4 4h16v16H4z",
  fillbox: "M4 4h16v16H4zM4 12h16M4 16h16M4 8h16",
  lineW: "M4 6h16M4 11h16M4 17h16",
  tL: "M4 6h16M4 10h10M4 14h16M4 18h10",
  tC: "M4 6h16M7 10h10M4 14h16M7 18h10",
  tR: "M4 6h16M10 10h10M4 14h16M10 18h10",
};

export default function Icon({ name, size = 16, className = "", fill = false, strokeWidth = 1.75 }) {
  const d = P[name];
  if (!d) return null;
  return (
    <svg
      className={`nfb-ico ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
