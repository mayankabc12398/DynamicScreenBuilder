/** Stroke icons for the print builder (24-unit grid, currentColor). */
import React from "react";

const P = {
  text: "M5 6h14M12 6v13M9 19h6",
  heading: "M6 5v14M18 5v14M6 12h12",
  field: "M4 7h16v10H4zM8 11h5M8 14h8",
  rich: "M5 6h9M5 10h14M5 14h9M5 18h14",
  table: "M4 5h16v14H4zM4 10h16M4 14.5h16M10 5v14",
  words: "M4 8h4M10 8h10M4 12h9M15 12h5M4 16h12",
  section: "M4 6h16v12H4zM4 9.5h16M7 7.8h.01",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5h.01",
  line: "M4 12h16",
  box: "M5 5h14v14H5z",
  barcode: "M5 5v14M8 5v14M10 5v14M13 5v14M16 5v14M18 5v14M20 5v14",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2",
  pages: "M7 4h10v14H7zM10 8h4M10 11h4M4 7v13h11",
  clock: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l3 2",
  sign: "M4 18c3-6 5-10 7-10s-1 9 2 9 3-4 5-4M4 21h16",
  undo: "M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
  redo: "M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  save: "M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6",
  rocket: "M12 15l-3-3M5 19c1-3 2-4 4-4M14 4c3 0 6 3 6 6l-6 6-6-6 6-6zM15 9h.01",
  history: "M4 12a8 8 0 1 0 3-6.2M4 4v4h4M12 8v4l3 2",
  page: "M6 3h9l4 4v14H6zM15 3v4h4",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  copy: "M8 8h11v12H8zM5 16V4h11",
  up: "M12 19V5M6 11l6-6 6 6",
  down: "M12 5v14M6 13l6 6 6-6",
  back: "M15 18l-6-6 6-6",
  grid: "M4 4h16v16H4zM4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16",
  magnet: "M6 4v8a6 6 0 0 0 12 0V4M6 8h4M14 8h4",
  database: "M12 4c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  layers: "M12 4l8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 16l8 4 8-4",
  bolt: "M13 3L5 14h6l-1 7 8-11h-6l1-7z",
  refresh: "M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4",
  check: "M5 12l5 5 9-10",
  alert: "M12 4l9 16H3zM12 10v4M12 17h.01",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  upload: "M12 20V9M7 14l5-5 5 5M5 4h14",
  search: "M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM20 20l-4.5-4.5",
  close: "M6 6l12 12M18 6L6 18",
  alignL: "M4 4v16M8 7h10M8 12h6M8 17h12",
  alignC: "M12 4v16M6 7h12M8 12h8M5 17h14",
  alignR: "M20 4v16M6 7h10M10 12h6M4 17h12",
  alignT: "M4 4h16M7 8v10M12 8v6M17 8v12",
  alignM: "M4 12h16M7 6v12M12 8v8M17 5v14",
  alignB: "M4 20h16M7 6v10M12 10v6M17 4v12",
  distH: "M4 4v16M20 4v16M9 8h2v8H9zM13 8h2v8h-2z",
  distV: "M4 4h16M4 20h16M8 9h8v2H8zM8 13h8v2H8z",
  sameW: "M4 8h16M4 16h16M4 6v4M20 6v4M4 14v4M20 14v4",
  sameH: "M8 4v16M16 4v16M6 4h4M6 20h4M14 4h4M14 20h4",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
  unlock: "M7 11V8a5 5 0 0 1 9.6-2M6 11h12v9H6z",
  pdf: "M6 3h9l4 4v14H6zM9 13h1.5a1.5 1.5 0 0 0 0-3H9v6M13 10v6h1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-1",
  dots: "M6 12h.01M12 12h.01M18 12h.01",
  folder: "M4 6h6l2 2h8v11H4z",
  brush: "M14 4l6 6-8 8-6-6zM6 12l-2 6 6-2M16 6l2 2",
  paint: "M4 5h12v5H4zM16 7h3v6h-7v3M11 16h2v5h-2z",
  keyboard: "M3 7h18v10H3zM6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M7 14h10",
  code:"M9 8l-4 4 4 4M15 8l4 4-4 4M13.5 5l-3 14",
  sparkle:"M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18",
  chart: "M4 20h16M7 16v-5M11 16V8M15 16v-3M19 16V5",
  pie: "M12 3a9 9 0 1 0 9 9h-9zM14 3.2V10h6.8A9 9 0 0 0 14 3.2z",
  pivot: "M4 4h16v16H4zM4 9h16M9 4v16M13 13h4M15 11v4",
  subreport: "M4 4h16v16H4zM8 9h8v7H8zM8 12h8",
  sigma: "M18 5H6l6 7-6 7h12",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  chat: "M5 5h14v10H9l-4 4zM8 9h8M8 12h5",
  printer: "M7 8V4h10v4M5 8h14v8h-3M8 13h8v7H8zM5 16H4",
  excel: "M5 3h10l4 4v14H5zM8 10l5 6M13 10l-5 6",
  word: "M5 3h10l4 4v14H5zM7.5 10l1.5 6 2-4 2 4 1.5-6",
  photo: "M4 6h16v12H4zM8 10h.01M4 16l5-4 4 3 3-2 4 3",
  puzzle: "M10 4h4v3a1.5 1.5 0 1 0 3 0V4h3v6h-3a1.5 1.5 0 1 0 0 3h3v7h-6v-3a1.5 1.5 0 1 0-3 0v3H4v-7h3a1.5 1.5 0 1 0 0-3H4V4z",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M21 20c0-2.8-1.7-5-4-5.7",
  pulse: "M3 12h4l2-6 4 12 2-6h6",
  pin: "M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11zM12 8v4M12 12h.01",
  compare: "M4 5h7v14H4zM13 5h7v14h-7zM7 9h1M16 9h1M7 13h1M16 13h2",
  wand: "M4 20L15 9M14 4v3M17.5 5.5l-2 2M20 9h-3M11 6.5l1 1M17 12l1 1",
  flag: "M5 21V4M5 4h11l-2 4 2 4H5",
  overlay: "M4 4h12v12H4zM8 8h12v12H8z",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  fx: "M10 4c-2 0-3 1-3 3v13M4 10h7M14 10l6 8M20 10l-6 8",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z",
  stack: "M4 7l8-4 8 4-8 4zM4 12l8 4 8-4M4 17l8 4 8-4",
  rtl: "M20 6H8M20 12H4M20 18H10M7 4l-3 2 3 2",
  send: "M4 12l16-8-6 16-2-7z",
  panelL: "M4 5h16v14H4zM9 5v14M15 10l-2 2 2 2",
  panelR: "M4 5h16v14H4zM15 5v14M9 10l2 2-2 2",
};

export default function Icon({ name, size = 16, stroke = 1.7, className = "", style }) {
  const d = P[name] || P.dots;
  return (
    <svg
      className={`pbx-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={d} />
    </svg>
  );
}
