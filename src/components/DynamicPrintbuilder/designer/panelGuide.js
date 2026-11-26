/**
 * "Explain this panel": a step-by-step walk through the Properties panel on the
 * right, run by the same Tour as "How to build". The steps are built from what
 * the panel shows right now (an element, a section, several elements or the
 * template), one per section ([data-sec] on ui/fields Section), in screen order.
 */

/** Plain-words help per panel section, keyed by its title. `items` = [name, meaning]. */
export const PANEL_HELP = {
  "Position (mm)": {
    icon: "grid",
    tone: "sky",
    text: "Where this control sits inside its section, in millimetres.",
    items: [
      ["X / Y", "distance from the section's left edge / top"],
      ["W / H", "width and height of the control"],
      ["Bring to front / Send to back", "which one wins when two controls overlap"],
    ],
    tip: "Drag on the canvas for rough placement, type numbers here for exact.",
  },
  Content: {
    icon: "field",
    tone: "mint",
    text: "What this control prints. The rows change with the kind of control.",
    items: [
      ["Text", "fixed words, printed exactly as typed"],
      ["Value", "a data field or formula — the ƒ button builds one for you"],
      ["Format", "how it looks: amount ₹ 1,234.00, date 19-Oct-2026, upper case…"],
      ["From block", "linked to a saved block: Update pulls its latest design, Unlink makes it yours"],
    ],
    tip: "Drag a field from the Data tab and drop it on Value.",
  },
  "Style preset": {
    icon: "brush",
    tone: "violet",
    text: "Ready-made text styles, so headings and values look the same everywhere.",
    items: [
      ["Apply", "sets font, size, weight and colour in one click"],
      ["Save as preset", "keeps this control's style to reuse on others"],
    ],
  },
  Text: {
    icon: "text",
    tone: "teal",
    text: "How the words look.",
    items: [
      ["Font · Size · Weight", "typeface, size in points, normal / bold"],
      ["Style · Colour", "italic, underline, CAPS and text colour"],
      ["Align · Vertical", "left / centre / right, and top / middle / bottom in the box"],
      ["Line height · Spacing", "gap between lines and between letters"],
      ["Wrap", "on: long text goes to the next line · off: one line ending in …"],
    ],
  },
  Box: {
    icon: "box",
    tone: "peach",
    text: "The rectangle around the control: background, border and inner space.",
    items: [
      ["Fill", "background colour"],
      ["Border · Sides · Line · Colour", "border width, which sides, solid / dashed, colour"],
      ["Radius", "rounded corners"],
      ["Padding", "space between the border and the text"],
    ],
  },
  "Table look": {
    icon: "table",
    tone: "amber",
    text: "How the whole table prints.",
    items: [
      ["Header row · Repeat header", "show column titles, again on every new page"],
      ["Footer / totals", "a last row with sums"],
      ["Zebra rows · Lines", "striped rows and which grid lines to draw"],
      ["When empty", "text printed when there are no rows"],
      ["Filter · Sort by", "keep only some rows, and their order"],
    ],
  },
  "Group rows & sub-lines": {
    icon: "folder",
    tone: "lavender",
    text: "Split table rows under headings, or print some rows as indented sub-lines.",
    items: [
      ["Group by", "a heading row each time this value changes (e.g. department)"],
      ["Sub-line when", "rows matching this print as one indented line (e.g. package contents)"],
    ],
  },
  "Row colour rules": {
    icon: "paint",
    tone: "rose",
    text: "Colour a whole table row when a condition is true.",
    items: [["Example", "Amount < 0 → red text"]],
  },
  "Colour rules": {
    icon: "paint",
    tone: "rose",
    text: "Change this control's colour or weight when a condition is true.",
    items: [["Example", "Balance > 0 → bold red"]],
  },
  Behaviour: {
    icon: "bolt",
    tone: "amber",
    text: "When and how the control prints — and how it adapts to small papers.",
    items: [
      ["Show if · Close gap", "print only when true; when hidden, pull what is below up"],
      ["Can grow · If empty", "grow for long text; what to print when the value is blank"],
      ["Priority · Keep with next · Min width", "help the automatic layout on A5 / thermal paper"],
      ["Stretch to bottom", "keep touching the section's bottom edge"],
    ],
  },
  Arrange: {
    icon: "alignL",
    tone: "sky",
    text: "Line up several selected controls at once.",
    items: [
      ["Align", "same left / centre / right / top / middle / bottom"],
      ["Distribute · Same size", "equal gaps, equal width or height"],
    ],
  },
  Band: {
    icon: "layers",
    tone: "mint",
    text: "Settings of this section (band) — a horizontal strip of the page.",
    items: [
      ["Prints · Name · Height", "which kind of section, your own name for it, its height"],
      ["Repeat for · Group by", "one strip per data row; rows with the same value form a group"],
      ["Print on · At page bottom", "first page only / all but first; sit at the page bottom"],
      ["New page before / after · Show if", "page breaks, and print only when true"],
    ],
  },
  Copies: {
    icon: "copy",
    tone: "teal",
    text: "Print the document more than once in one PDF — e.g. Patient copy and Office copy, each with its own caption.",
  },
  "Label sheet": {
    icon: "grid",
    tone: "peach",
    text: "Print the content rows as stickers across a label sheet.",
    items: [
      ["Stock", "label paper: label size, columns and gaps"],
      ["Labels per row · Outline", "copies per row; draw label edges for lining up"],
    ],
  },
  Template: {
    icon: "page",
    tone: "sky",
    text: "Name, category and notes of this print — for finding it in the list. Never printed.",
  },
  Data: {
    icon: "database",
    tone: "mint",
    text: "Where the values come from.",
    items: [
      ["Datasource", "the procedure / API that returns the bill, patient and rows"],
      ["Letterhead", "the hospital header (logo, address) read from settings"],
    ],
  },
  Page: {
    icon: "page",
    tone: "amber",
    text: "The paper you design on (A4 master) and its margins. Page setup… opens all paper options.",
  },
  Look: {
    icon: "brush",
    tone: "violet",
    text: "Defaults for the whole print; each control can still override them.",
    items: [
      ["Font · Base size · Line height · Text colour", "the house style"],
      ["Accent", "one colour for table headers, rules and totals"],
      ["Currency · If empty", "money symbol; text for blank values"],
      ["Translate labels", "print captions in the user's language"],
    ],
  },
  Watermark: {
    icon: "overlay",
    tone: "rose",
    text: "Faint diagonal text behind the page — e.g. DUPLICATE on reprints.",
    items: [["Show when", "a condition, e.g. sys.duplicate"]],
  },
  Manage: {
    icon: "shield",
    tone: "lavender",
    text: "Housekeeping for this template.",
    items: [
      ["Who may edit / print", "limit by role or person"],
      ["Centre variants", "a different design for one centre"],
      ["Where used", "screens that print it"],
      ["Compare · Batch print", "check against the old print; print many records at once"],
    ],
  },
  "Layout direction & binding": {
    icon: "rtl",
    tone: "sky",
    text: "Right-to-left printing for Arabic / Urdu, and mirrored margins for two-sided bound prints.",
  },
  "Powered by": {
    icon: "sign",
    tone: "teal",
    text: "The small “Powered by …” credit line on each page: show it, and where.",
  },
  "Reprints & audit": {
    icon: "history",
    tone: "amber",
    text: "Control duplicate prints: ask for a reason, limit how many, mark them DUPLICATE.",
  },
  "PDF protection": {
    icon: "lock",
    tone: "rose",
    text: "Password to open the PDF, what readers may do (print, copy, edit), and a digital signature.",
  },
  "Chart look": {
    icon: "chart",
    tone: "violet",
    text: "Chart title, colours, legend and labels.",
  },
  "Crosstab look": {
    icon: "pivot",
    tone: "violet",
    text: "Totals and the order of rows and columns of the cross-table.",
  },
};

/** [name, meaning, icon] — the buttons in an element's panel head, left to right. */
const ELEMENT_ACTIONS = [
  ["Lock", "stop accidental moves on the canvas", "unlock"],
  ["Copy style", "take its font, colours and box (Ctrl+Alt+C)", "brush"],
  ["Paste style", "give that style to this control (Ctrl+Alt+V)", "paint"],
  ["Duplicate", "make a copy (Ctrl+D)", "copy"],
  ["Delete", "remove it (Del)", "trash"],
];

const cssEsc = (s) => (window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, "\\$&"));

/** Steps for the panel as it is on screen now. */
export function panelTourSteps() {
  const right = document.querySelector(".pbx-right");
  if (!right) return [];
  const headTitle = right.querySelector(".pbx-panel-head .pbx-panel-title b")?.textContent?.trim() || "Properties";
  const isElement = !!right.querySelector('.pbx-panel-head [title="Lock position"], .pbx-panel-head [title="Unlock"]');
  const what = isElement ? `this ${headTitle}` : headTitle === "Properties" ? "the template" : headTitle;
  const steps = [
    {
      id: "panel",
      sel: [".pbx-right"],
      title: "The Properties panel",
      tone: "lavender",
      icon: "brush",
      text: `It always shows the settings of what you selected — now ${what}. Click a control on the page, a section tag on the left, or empty space for the whole template.`,
      items: [
        ["A control", "its position, content, text and box"],
        ["A section tag", "height, repeat, page breaks"],
        ["Nothing", "datasource, page, house style"],
      ],
    },
  ];
  if (right.querySelector(".pbx-panel-head")) {
    steps.push({
      id: "panel-head",
      sel: [".pbx-right .pbx-panel-head"],
      title: `${headTitle}: what is selected`,
      tone: "sky",
      icon: "pin",
      text: isElement
        ? "The kind of control, its section and its id. The buttons act on it:"
        : "The name of what you are editing, with quick actions on the right.",
      items: isElement ? ELEMENT_ACTIONS : undefined,
    });
  }
  const seen = new Set();
  right.querySelectorAll("[data-sec]").forEach((secEl) => {
    const title = secEl.getAttribute("data-sec");
    if (!title || seen.has(title)) return;
    seen.add(title);
    const h = PANEL_HELP[title] || { icon: "list", tone: "sky", text: "Settings of this part. Hover a row label to see what it does." };
    steps.push({
      id: `sec:${title}`,
      sel: [`.pbx-right [data-sec="${cssEsc(title)}"]`],
      reveal: `.pbx-right [data-sec="${cssEsc(title)}"]`,
      title,
      tone: h.tone,
      icon: h.icon,
      text: h.text,
      items: h.items,
      tip: h.tip,
    });
  });
  steps.push({
    id: "panel-end",
    sel: [".pbx-right"],
    title: "That's the whole panel",
    tone: "mint",
    icon: "check",
    text: "Every change shows on the page at once and can be undone with Ctrl+Z. Hover any row label for a one-line hint.",
    tip: "Select something else and press “Explain this panel” again — the guide follows what is selected.",
  });
  return steps;
}
