/**
 * Discharge summary helper: turns the raw clinical record of one admission (DischargeClinicalRecord/Get) into
 * sections the doctor can preview, tick and bind into the summary. Pure functions only (no React, no network),
 * so they are easy to test. Every section carries `origin`: where in the hospital system its data came from.
 */

export const escapeHtml = (v = "") =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Notes are rich text typed in our own editors; still, never let a script or event handler through into the page. */
export const sanitizeHtml = (html = "") =>
  String(html ?? "")
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

export const plainText = (html = "") =>
  String(html ?? "")
    .replace(/<\s*(br|\/p|\/div|\/li|\/h\d|\/tr)\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();

/** Which section a Note Creator note belongs to, from the name of its note type. */
export const classifyNote = (noteType = "") => {
  const n = String(noteType).toLowerCase();
  if (/surg|operat|procedure|anaesth|anesth|\bot\b/.test(n)) return "surgery";
  if (/nurs/.test(n)) return "nursing";
  if (/discharge/.test(n)) return "discharge";
  if (/progress|round|follow/.test(n)) return "progress";
  if (/doctor|consult|admission|clinical|history|assessment|physician|specialist|opinion/.test(n)) return "doctor";
  return "other";
};

const isImaging = (dept = "", name = "") => /radio|imag|x-?ray|ultra|sono|usg|\bct\b|\bmri\b|mammo|scan|echo|ecg|doppler/i.test(`${dept} ${name}`);

const SURGERY_FIELDS = [
  ["Surgery", "Surgery"], ["PreOp", "Pre-operative diagnosis"], ["PostOp", "Post-operative diagnosis"], ["Operation", "Operation"],
  ["Procedures", "Procedure"], ["Findings", "Findings"], ["Incision", "Incision"], ["Drains", "Drains"], ["Closure", "Closure"],
  ["Implants", "Implants"], ["Sample", "Sample"], ["Complication", "Complication"], ["BloodLoss", "Blood loss"],
  ["Anaesthesia", "Anaesthesia"], ["Anesthetist", "Anaesthetist"], ["Surgeon", "Surgeon"], ["Assistant", "Assistant"],
  ["StartTime", "Start"], ["EndTime", "End"], ["Instructions", "Post-operative instructions"],
];

const val = (x) => (x === null || x === undefined ? "" : String(x).trim());

const surgeryItem = (r) => {
  const rows = SURGERY_FIELDS.map(([k, label]) => [label, val(r[k] ?? r[k.toLowerCase()])])
    // The surgery name is the heading, and a field that repeats it adds nothing.
    .filter(([label, v]) => v && !(label === "Operation" && v === val(r.Surgery ?? r.surgery)));
  const html = rows.map(([label, v]) => (/<[a-z][\s\S]*>/i.test(v) ? `<p><b>${escapeHtml(label)}:</b></p>${sanitizeHtml(v)}` : `<p><b>${escapeHtml(label)}:</b> ${escapeHtml(v)}</p>`)).join("");
  return { id: `s-${r.Source}-${r.Id}`, at: val(r.At), title: val(r.Surgery ?? r.surgery) || "Surgery", author: val(r.Surgeon), origin: r.Source || "OT notes", html };
};

const noteItem = (r, origin) => ({
  id: `n-${r.Id}`, at: val(r.At), title: val(r.NoteType ?? r.Subject ?? r.Item), author: val(r.Author), origin, html: sanitizeHtml(r.Detail),
});

/**
 * Cross table of numeric results: one row per parameter, one column per date and time the result was reported.
 * @returns { columns: [{ key, label }], groups: [{ investigation, department, rows: [{ parameter, range, cells: { [colKey]: { value, critical } } }] }] }
 */
export const buildCrossTable = (labs = []) => {
  const columns = [];
  const seenCols = new Set();
  const groups = new Map();
  labs.forEach((l) => {
    const day = val(l.Day ?? l.day);
    const clock = val(l.Clock ?? l.clock);
    const key = `${day} ${clock}`.trim();
    if (!seenCols.has(key)) {
      seenCols.add(key);
      columns.push({ key, day, clock });
    }
    const inv = val(l.Investigation ?? l.investigation);
    if (!groups.has(inv)) groups.set(inv, { investigation: inv, department: val(l.Department ?? l.department), params: new Map() });
    const g = groups.get(inv);
    const name = val(l.Parameter ?? l.parameter);
    if (!g.params.has(name)) {
      const min = val(l.MinValue ?? l.minValue);
      const max = val(l.MaxValue ?? l.maxValue);
      g.params.set(name, { parameter: name, range: min || max ? `${min} - ${max}` : "", cells: {} });
    }
    g.params.get(name).cells[key] = { value: val(l.Value ?? l.value), critical: Number(l.IsCritical ?? l.isCritical) === 1 };
  });
  columns.sort((a, b) => a.key.localeCompare(b.key));
  const fmt = (c) => {
    const [y, m, d] = c.day.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return y && m && d ? `${d}-${months[Number(m) - 1] || m}-${y}` : c.day;
  };
  return {
    columns: columns.map((c) => ({ key: c.key, date: fmt(c), time: c.clock })),
    groups: [...groups.values()].map((g) => ({ investigation: g.investigation, department: g.department, rows: [...g.params.values()] })),
  };
};

/** The sections shown in the preview, in the order a discharge summary is usually written. */
export const buildSections = (raw) => {
  const r = raw || {};
  const notes = (r.notes || []).map((n) => ({ ...n, cls: classifyNote(n.NoteType) }));
  const fromNotes = (cls, origin) => notes.filter((n) => n.cls === cls).map((n) => noteItem(n, origin));

  const surgeryItems = [
    ...(r.surgery || []).map(surgeryItem),
    ...fromNotes("surgery", "Note Creator (surgery / procedure note)"),
  ];
  const labs = r.labs || [];
  const numericLabs = labs.filter((l) => !isImaging(l.Department ?? l.department, l.Investigation ?? l.investigation));
  const imagingLabs = labs.filter((l) => isImaging(l.Department ?? l.department, l.Investigation ?? l.investigation));
  const cross = buildCrossTable(numericLabs);
  const reportItems = [
    ...(r.reports || []).map((x) => ({
      id: `r-${x.TestId}`, at: `${val(x.Day)} ${val(x.Clock)}`.trim(), title: val(x.Investigation), author: "", origin: `Lab / Radiology (${val(x.Department) || "report"})`, html: sanitizeHtml(x.Report),
    })),
    // Numeric results of an imaging study (e.g. an echo) have no written report, so show them as a short list.
    ...(imagingLabs.length ? [{
      id: "r-imaging-values", at: "", title: "Imaging measurements", author: "", origin: "Radiology results",
      html: `<ul>${imagingLabs.map((l) => `<li>${escapeHtml(val(l.Investigation ?? l.investigation))} - ${escapeHtml(val(l.Parameter ?? l.parameter))}: ${escapeHtml(val(l.Value ?? l.value))} (${escapeHtml(val(l.Day ?? l.day))})</li>`).join("")}</ul>`,
    }] : []),
  ];

  const sections = [
    { key: "surgery", title: "Surgery / OT notes", origin: "OT > OT Notes, Operative notes, Note Creator (surgery notes)", kind: "text", items: surgeryItems },
    { key: "labs", title: "Laboratory results", origin: "Laboratory > patient results of this admission (by date and time)", kind: "cross", cross },
    { key: "reports", title: "Radiology and other reports", origin: "Radiology / Laboratory written reports", kind: "text", items: reportItems },
    { key: "doctor", title: "Doctor notes", origin: "Note Creator (admission, consultation and doctor notes)", kind: "text", items: fromNotes("doctor", "Note Creator") },
    { key: "progress", title: "Progress notes", origin: "Doctor progress notes (ward round) and Note Creator progress notes", kind: "text",
      items: [
        ...(r.progress || []).map((x) => ({ id: `p-${x.Id}`, at: val(x.At), title: "Progress note", author: val(x.Author), origin: "Doctor progress notes", html: sanitizeHtml(x.Detail) })),
        ...fromNotes("progress", "Note Creator"),
      ] },
    { key: "nursing", title: "Nursing notes", origin: "Nursing > Nursing notes", kind: "text",
      items: [
        ...(r.nursing || []).map((x) => ({ id: `u-${x.Id}`, at: val(x.At), title: val(x.Subject) || "Nursing note", author: val(x.Author), origin: `Nursing notes${val(x.WardName) ? ` (${val(x.WardName)})` : ""}`, html: sanitizeHtml(x.Detail) })),
        ...fromNotes("nursing", "Note Creator"),
      ] },
    { key: "discharge", title: "Discharge notes", origin: "Nursing > Discharge note and Note Creator", kind: "text",
      items: [
        ...(r.dischargeNotes || []).map((x) => ({
          id: `d-${x.Id}`, at: val(x.At), title: "Discharge note", author: val(x.Author), origin: "Discharge note",
          html: sanitizeHtml(x.Detail) + (val(x.NextVisit) ? `<p><b>Next visit:</b> ${escapeHtml(val(x.NextVisit))}</p>` : ""),
        })),
        ...fromNotes("discharge", "Note Creator"),
      ] },
    { key: "medicines", title: "Discharge medicine", origin: "Discharge > discharge medicine", kind: "table",
      columns: ["Medicine", "Dose", "Frequency", "Route", "Duration", "Meal", "Remarks"],
      rows: (r.medicines || []).map((m) => [val(m.Name), val(m.Dose), val(m.Frequency), val(m.Route), val(m.Duration), val(m.Meal), val(m.Remarks)]) },
    { key: "other", title: "Other clinical notes", origin: "Note Creator (all other note types)", kind: "text", items: fromNotes("other", "Note Creator") },
  ];
  return sections.map((s) => ({ ...s, count: countOf(s) }));
};

export const countOf = (s) => (s.kind === "cross" ? s.cross.groups.reduce((n, g) => n + g.rows.length, 0) : s.kind === "table" ? s.rows.length : (s.items || []).length);

/* ------------------------------------------------------------------ html for the summary */

// The discharge detail is stored in a TEXT column (64 KB), so tables are written with attributes, not a style on every cell,
// and a wide results table is split into blocks of COLS_PER_TABLE dates so it also fits the printed page.
const TABLE = 'border="1" cellspacing="0" cellpadding="3" style="border-collapse:collapse;font-size:11px;width:100%"';
const COLS_PER_TABLE = 7;

const crossHtml = (cross) => {
  if (!cross.columns.length) return "";
  const blocks = [];
  for (let i = 0; i < cross.columns.length; i += COLS_PER_TABLE) blocks.push(cross.columns.slice(i, i + COLS_PER_TABLE));
  return cross.groups.map((g) => `<p><b>${escapeHtml(g.investigation)}</b></p>` + blocks.map((cols) => {
    // Leave out parameters with no value in this block of dates.
    const rows = g.rows.filter((row) => cols.some((c) => row.cells[c.key]));
    if (!rows.length) return "";
    return `<table ${TABLE}><thead><tr><th>Parameter</th><th>Range</th>${cols.map((c) => `<th>${escapeHtml(c.date)} ${escapeHtml(c.time)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.parameter)}</td><td>${escapeHtml(row.range)}</td>${cols.map((c) => {
      const cell = row.cells[c.key];
      return `<td>${cell ? (cell.critical ? `<b>${escapeHtml(cell.value)}</b>` : escapeHtml(cell.value)) : ""}</td>`;
    }).join("")}</tr>`).join("")}</tbody></table>`;
  }).join("")).join("");
};

const tableHtml = (s) => `<table ${TABLE}><thead><tr>${s.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead><tbody>${s.rows.map((row) => `<tr>${row.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

const itemHtml = (it) => `<p><b>${escapeHtml(it.title)}</b>${it.at || it.author ? ` (${escapeHtml(it.at)}${it.at && it.author ? ", " : ""}${escapeHtml(it.author)})` : ""}</p>${it.html}`;

/** HTML of the ticked sections, as it will be placed in the summary editor. `selectedItems` = Set of item ids to leave out is not needed: pass sections already filtered. */
export const sectionsToHtml = (sections = []) =>
  sections.filter((s) => s.count > 0).map((s) => {
    const body = s.kind === "cross" ? crossHtml(s.cross) : s.kind === "table" ? tableHtml(s) : s.items.map(itemHtml).join("");
    return `<h3>${escapeHtml(s.title)}</h3>${body}`;
  }).join("");

/** Plain text of the ticked sections for the AI (capped so a very long stay cannot overflow the model). */
export const sectionsToText = (sections = [], cap = 60000) => {
  const parts = sections.filter((s) => s.count > 0).map((s) => {
    let body = "";
    if (s.kind === "cross") {
      body = s.cross.groups.map((g) => `${g.investigation}:\n${g.rows.map((row) => `  ${row.parameter}${row.range ? ` (${row.range})` : ""}: ${s.cross.columns.map((c) => (row.cells[c.key] ? `${c.date} ${c.time} = ${row.cells[c.key].value}` : "")).filter(Boolean).join("; ")}`).join("\n")}`).join("\n");
    } else if (s.kind === "table") {
      body = s.rows.map((row) => row.filter(Boolean).join(", ")).join("\n");
    } else {
      body = s.items.map((it) => `[${it.at}${it.author ? `, ${it.author}` : ""}] ${it.title}: ${plainText(it.html)}`).join("\n");
    }
    return `## ${s.title}\n${body}`;
  }).join("\n\n");
  return parts.length > cap ? `${parts.slice(0, cap)}\n[...truncated]` : parts;
};

/** Narrow every section to the items the user left ticked. `off` is a Set of "sectionKey|itemId". */
export const applySelection = (sections, onKeys, offItems) =>
  sections.filter((s) => onKeys.has(s.key)).map((s) => {
    if (s.kind !== "text") return s;
    const items = s.items.filter((it) => !offItems.has(`${s.key}|${it.id}`));
    return { ...s, items, count: items.length };
  });

/** Characters the discharge detail column can hold (TEXT = 65,535); stay well under it. */
export const MAX_DETAIL_CHARS = 50000;
