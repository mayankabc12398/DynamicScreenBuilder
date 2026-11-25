/**
 * The app's own row modals, reachable from a built screen.
 *
 * The hand-coded list screens (EmergencyPatientTable is the reference) put a
 * strip of icons in each row — Labs, Meds, FlowSheets, Remarks, Waiting type —
 * and each one opens a real modal from `components/modalComponent/Utils`, fed
 * the row it was pressed on. A built screen has to open the SAME components:
 * re-drawing those screens in the builder would be a second copy of a lab
 * result grid, drifting from the one the app maintains.
 *
 * So each entry is a lazy import plus the framing the reference page uses (its
 * title and dialog width) and, where the modal writes something, the save call
 * that page makes. The host (AppModalHost) mounts them; the strip and the
 * `openAppModal` action only name a key.
 *
 * Adding one: an entry here, nothing else. The action editor, the strip's icon
 * picker, the Action Tile's "Opens" list and the host all read this object.
 *
 * An entry:
 *
 *   myScreen: {
 *     key:   "myScreen",              // must equal the property name
 *     label: "What the picker shows",
 *     search: "MyModal alias words",  // extra words the picker matches on
 *     icon:  "FlaskConical",          // a name from registry/icons.jsx
 *     title: "Dialog header",
 *     size:  "75vw",                  // dialog width
 *     load:  () => import("@app/components/modalComponent/Utils/MyModal"),
 *
 *     // optional
 *     shape: (row) => ({ ...row, patientID: row?.PatientID }),  // reshape `data`
 *     headerLoad: () => import("@app/.../PatientStrip"),        // strip above it
 *     reopens: true,                  // wants refreshAndReopen()
 *     save: async (payload, row) => { ... return { ok, message }; },
 *   }
 *
 * The host hands every screen `data` (the row, reshaped if `shape` says so),
 * `onSave`, `onClose`, `setVisible` and the close-variants some of these modals
 * expect, so a modal that closes itself needs nothing extra. `save` is only for
 * a modal that writes: return `{ ok, message }` and the host toasts it, closes
 * the dialog and refreshes the grid the row came from.
 */

// The frame-screen loader map the hand-coded pages import. Named imports only
// — every screen inside it stays lazy.
import { EMERGENCY_FRAME_COMPONENTS as FRAME_LOADERS } from "@app/components/commonComponents/EmergencySeeMoreList";

/** Every modal is handed the row as `data`. What else it takes is per entry. */
export const APP_MODALS = {
  labs: {
    key: "labs",
    label: "Investigation Result",
    search: "Labs LabsModel investigation result",
    icon: "FlaskConical",
    title: "Investigation Result",
    size: "75vw",
    load: () => import("@app/components/modalComponent/Utils/LabsModel"),
  },
  medicine: {
    key: "medicine",
    label: "Patient Requisition Details — Meds",
    search: "Meds MedicineModel medicine requisition",
    icon: "Pill",
    title: "Patient Requisition Details",
    size: "50vw",
    load: () => import("@app/components/modalComponent/Utils/MedicineModel"),
  },
  flowsheet: {
    key: "flowsheet",
    label: "FlowSheets",
    search: "FlowsheetModel flow sheets",
    icon: "ClipboardList",
    title: "FlowSheets",
    size: "75vw",
    load: () => import("@app/components/modalComponent/Utils/FlowsheetModel"),
  },
  remarks: {
    key: "remarks",
    label: "Remarks",
    search: "RemarksModal remark notes",
    icon: "MessageSquareText",
    title: "Remarks",
    size: "25vw",
    load: () => import("@app/components/modalComponent/Utils/RemarksModal"),
  },
  /**
   * The four the emergency patient panel opens off its action tiles. Same
   * components, same titles and widths as EmergencyPatientSearch — a tile on a
   * built screen and the tile on that page open the same dialog.
   */
  vitalGraph: {
    key: "vitalGraph",
    label: "Vital Sign Chart/Graph — Vital Graph",
    search: "EmergencyVitalGraphModal vital graph chart trend",
    icon: "LineChart",
    title: "Vital Sign Chart/Graph",
    size: "75vw",
    load: () => import("@app/components/modalComponent/Utils/Emergency/EmergencyVitalGraphModal"),
  },
  captureVital: {
    key: "captureVital",
    label: "Vital Sign — Capture Vital",
    search: "VitalSignChart capture vital sign entry",
    icon: "HeartPulse",
    title: "Vital Sign",
    size: "90vw",
    // Reads the patient off transactionID/patientID rather than the row's own
    // column names, exactly as the reference page hands it over.
    shape: (row) => ({ ...(row || {}), transactionID: row?.TID, patientID: row?.PatientID }),
    load: () => import("@app/components/FrameMenu/Emergency/VitalSignChart"),
  },
  labResults: {
    key: "labResults",
    label: "Lab Results",
    search: "EmergencyLabResults lab result critical abnormal",
    icon: "FlaskConical",
    title: "Lab Results",
    size: "88vw",
    load: () => import("@app/components/modalComponent/Utils/Emergency/EmergencyLabResults"),
  },
  investigation: {
    key: "investigation",
    label: "Investigation View — Labs",
    search: "InvestigationView Labs investigation EMGPersonalDetailsOfPatient",
    icon: "Syringe",
    title: "Investigation View",
    size: "90vw",
    shape: (row) => ({ ...(row || {}), transactionID: row?.TID, patientID: row?.PatientID }),
    // Opens under the patient's details strip, the way the reference page
    // composes the two inside one dialog.
    headerLoad: () => import("@app/components/FrameMenu/Emergency/EMGPersonalDetailsOfPatient"),
    load: () => import("@app/components/FrameMenu/InvestigationView"),
  },
  billing: {
    key: "billing",
    label: "Billing Details",
    search: "BillingDetails bill charges payment",
    icon: "CreditCard",
    title: "Billing Details",
    // The width the emergency page opens it at, which is wider than the frame
    // menu's default: this screen is a grid of bill lines, not a form.
    size: "90vw",
    // It edits the bill and then wants the list behind it refreshed; the host
    // gives it that through `refreshAndReopen`.
    reopens: true,
    load: () => import("@app/components/FrameMenu/Emergency/BillingDetails"),
  },
  opdServiceBooking: {
    key: "opdServiceBooking",
    label: "OPD Service Booking",
    search: "OPDServiceBooking opd service booking payment confirmation new appointment",
    icon: "CreditCard",
    title: "OPD Service Booking",
    // The Confirmation page's dialog: 96vw, most of the screen's height.
    size: "96vw",
    // UHID / appointmentID / TestData / appointmentDate are worked out of the
    // row the way Confirmation.jsx does — see OPDServiceBookingModal.
    load: () => import("./OPDServiceBookingModal"),
  },
  releaseIpd: {
    key: "releaseIpd",
    label: "Release For IPD",
    search: "RelaseForIPDAPI release ipd admit transfer",
    icon: "Hospital",
    title: "Alert",
    size: "24vw",
    load: () => import("./ReleaseForIpdConfirm"),
    /**
     * The same call and the same payload the emergency page makes, so a built
     * screen releases a patient exactly as the hand-coded one does. The host
     * closes the dialog and refreshes the grid on success.
     */
    save: async (row) => {
      const { RelaseForIPDAPI } = await import("@app/networkServices/Emergency");
      const res = await RelaseForIPDAPI({ TID: row?.TID, EMGNo: row?.EmergencyNo, RoomId: row?.RoomId });
      return { ok: !!res?.success, message: res?.message };
    },
  },
  waitingType: {
    key: "waitingType",
    label: "Wating Type",
    search: "WatingTypeModal waiting type queue",
    icon: "SquarePen",
    title: "Wating Type",
    size: "25vw",
    load: () => import("@app/components/modalComponent/Utils/patientBillingModal/WatingTypeModal"),
    /**
     * The one entry that writes. Same call and same payload shape the reference
     * page makes, so a built screen and the hand-coded one save identically;
     * the host closes the dialog and refreshes the grid on success.
     */
    save: async (payload) => {
      const { SaveWaitingTypeApi } = await import("@app/networkServices/BillingsApi");
      const res = await SaveWaitingTypeApi({
        waitingID: payload?.waitingType,
        transactionID: payload?.TID,
      });
      return { ok: !!res?.success, message: res?.message };
    },
  },
};

/**
 * The module's patient screens, openable as a modal.
 *
 * The frame menu opens these in the app's slide screen, picked from a
 * role-filtered list. Sometimes a screen wants one of them on a single icon
 * instead — "the discharge form, from this row, now" — and that is a modal,
 * not a menu. Same loaders (EMERGENCY_FRAME_COMPONENTS, the map the hand-coded
 * pages import), so there is one place a frame screen's path is written down.
 *
 * A frame screen expects the patient record shaped by frameMenuRecord and a
 * few menu props; the host supplies both. Keys are prefixed so they cannot
 * collide with the modals above.
 */
export const FRAME_MODAL_PREFIX = "frame:";

const frameSpec = (name) => ({
  key: `${FRAME_MODAL_PREFIX}${name}`,
  label: `Screen — ${name}`,
  icon: "FileText",
  title: name,
  size: "75vw",
  frame: true,
  load: () => FRAME_LOADERS[name](),
});


/* ---------------------------------------------------------------- custom --
   A modal someone added from the builder, without editing this file.

   The list above is the curated one: a key, a title, a width and the props the
   screen behind it expects. But a new modal is written every week, and waiting
   for an entry here to be added and deployed is the difference between a screen
   somebody can finish today and a ticket. So the builder can register one
   itself: pick the component's file, give it a title and a width, and the entry
   is saved WITH THE SCREEN — it travels in the screen's JSON, so the runtime
   resolves it the same way whether it came from here or from the canvas.

   The loader cannot be built from a string at runtime: a bundler has to see
   every import it will ever have to resolve. `import.meta.glob` is how it sees
   them — one lazy chunk per component, none of them fetched until a tile is
   pressed, and a path the glob does not cover simply cannot be picked. */
// Two globs, two jobs.
//
// The picker OFFERS the four folders this app keeps its dialogs and patient
// screens in — a list of every component under src/components would be a
// directory dump, not a choice. But a path can also be PASTED, and a pasted
// path has to resolve wherever it points, so the resolver covers all of
// src/components. The wider glob costs little here: these components are
// already in the build graph, reached statically by the pages that open them.
const PICKER_GLOB = {
  ...import.meta.glob("../../modalComponent/**/*.jsx"),
  ...import.meta.glob("../../FrameMenu/**/*.jsx"),
  ...import.meta.glob("../../commonComponents/**/*.jsx"),
  ...import.meta.glob("../../front-office/**/*.jsx"),
};
const COMPONENT_GLOB = import.meta.glob("../../**/*.jsx");

// Every page as well. "Open modal" offers any component the app has, so a page
// written today is in its list the next time the app is built — and under
// `vite dev` the moment the file is saved, because Vite re-runs a glob when a
// matching file appears. The list is the build's own for the same reason the
// loaders are: a component the bundle does not contain cannot be opened, so
// no hand-kept or server-kept list could be more accurate than this one.
//
// A glob puts every file it matches into the production build — including a
// page no route uses, which until now nobody compiled. The five named below are
// such files: their imports point at folders that moved, or at an export that
// was renamed since, so compiling them fails `vite build`. They are left out
// rather than changed. The same will happen to any unused page whose imports
// break later: the build error names the file — fix it, delete it, or add it
// here.
const PAGE_GLOB = import.meta.glob([
  "../../../pages/**/*.jsx",
  "!**/*.test.jsx",
  "!**/*.spec.jsx",
  "!../../../pages/Store/GetPurchaseReq.jsx",
  "!../../../pages/frontOffice/OPD/apa.jsx",
  "!../../../pages/SubMenu.jsx",
  "!../../../pages/profile/Profile.jsx",
  "!../../../pages/Inventory/Consume/ConsumeItem.jsx",
]);

/**
 * A glob key as a path people recognise.
 *
 *   `../../modalComponent/Utils/LabsModel.jsx`   → `components/modalComponent/Utils/LabsModel`
 *   `../../../pages/Billing/IPD/IDPDetailCard.jsx` → `pages/Billing/IPD/IDPDetailCard`
 */
const tidyPath = (raw) =>
  String(raw)
    .replace(/^\.\.\/\.\.\/\.\.\/pages\//, "pages/")
    .replace(/^\.\.\/\.\.\//, "components/")
    .replace(/\.jsx$/, "");

/**
 * Every component file the builder is allowed to open as a modal.
 *
 * Modals, frame screens, shared dialogs and the front-office slide screens —
 * the four places this app keeps things a page opens over itself. Sorted, so
 * the picker reads like a directory rather than like a build artefact.
 */
export const COMPONENT_PATHS = Object.keys(PICKER_GLOB)
  .map(tidyPath)
  .sort((a, b) => a.localeCompare(b));

/**
 * Make sense of a path somebody pasted.
 *
 * It will have been copied out of an import statement, out of the IDE's file
 * tree, or off a Windows path bar, so it arrives in any of half a dozen shapes:
 * `@app/components/x/Y`, `src/components/x/Y`, `../../x/Y`, backslashes, with
 * or without the extension. All of them name one file. Returns the tidy path
 * when it is a file the builder can actually import, and "" when it is not —
 * an unresolvable path has to be refused at the point it is typed, not turn
 * into a tile that does nothing at runtime.
 */
export function resolveComponentPath(raw) {
  if (!raw) return "";
  let v = String(raw).trim();
  v = v.replace(/\\/g, "/");
  v = v.replace(/^["'`]+|["'`]+$/g, "");
  v = v.replace(/\.jsx$/i, "");
  v = v.replace(/^@app\//, "src/").replace(/^~\//, "src/");
  v = v.replace(/^@pages\//, "src/pages/").replace(/^@components\//, "src/components/");
  // A path off the IDE's path bar carries the drive and the checkout folder
  // (D:/…/hospediav12-fe/src/pages/…); only what follows src/ names the file.
  const inSrc = v.lastIndexOf("/src/");
  if (inSrc >= 0) v = v.slice(inSrc + 1);
  v = v.replace(/^(\.\.\/)+/, "").replace(/^\.\//, "");
  v = v.replace(/^src\//, "");
  if (v.startsWith("pages/") || v.startsWith("components/")) return loaderFor(v) ? v : "";
  // A path that starts inside a folder (modalComponent/…, Billing/IPD/…) is
  // tried under src/components first, as it always was, then under src/pages.
  if (loaderFor(`components/${v}`)) return `components/${v}`;
  return loaderFor(`pages/${v}`) ? `pages/${v}` : "";
}

/** The glob key a tidy path came from — what the loader is actually keyed by. */
const globKey = (path) => {
  const p = String(path);
  return p.startsWith("pages/") ? `../../../${p}.jsx` : `../../${p.replace(/^components\//, "")}.jsx`;
};

/** The lazy import for a tidy path, from whichever glob covers it. */
const loaderFor = (path) => (String(path).startsWith("pages/") ? PAGE_GLOB : COMPONENT_GLOB)[globKey(path)];

export const CUSTOM_MODAL_PREFIX = "custom:";

/**
 * A screen-registered modal, in the same shape as the entries above.
 *
 * `shapePatient` is the one reshaping that comes up again and again: several of
 * these screens read the patient off `transactionID` / `patientID` rather than
 * off the row's own column names. It is a checkbox rather than a code box
 * because that is the whole of what anyone has needed.
 */
export function customSpec(entry) {
  if (!entry || !entry.path) return null;
  const loader = loaderFor(entry.path);
  if (!loader) return null;
  return {
    key: entry.key || `${CUSTOM_MODAL_PREFIX}${entry.path}`,
    label: entry.label || entry.path.split("/").pop(),
    /**
     * What to hand the component, under its OWN prop names.
     *
     *   { patientData: "{{row}}", transactionId: "{{row.TransactionID}}" }
     *
     * Every value is a binding resolved against the record the modal was
     * opened on. Without this a registered component only works if it happens
     * to read a prop called `data`, which made the "register any component"
     * feature true of about ten of them. `shapePatient` below is the special
     * case this generalises, and is kept for entries that already use it.
     */
    propsMap: entry.props && typeof entry.props === "object" ? entry.props : null,
    icon: entry.icon || "FileText",
    title: entry.title || entry.label || "",
    size: entry.size || "75vw",
    custom: true,
    shape: entry.shapePatient
      ? (row) => ({ ...(row || {}), transactionID: row?.TID, patientID: row?.PatientID })
      : undefined,
    reopens: !!entry.reopens,
    load: loader,
  };
}

/** The picker's options for a screen's own entries. */
export const customModalOptions = (list) =>
  (Array.isArray(list) ? list : [])
    .map((e) => customSpec(e))
    .filter(Boolean)
    .map((m) => ({ value: m.key, label: `${m.label} (this screen)`, search: `custom ${m.key}` }));

/* ------------------------------------------------------------------ file --
   Any component file, opened as a modal straight from "Open modal".

   Registering a component on the screen (above) is for one that several tiles
   and icons open under a single name. Most of the time it is one button and one
   dialog, and the key alone says everything: `file:pages/Billing/IPD/IDPDetailCard`
   names the file, and the action that opens it carries its own title, width and
   props. Nothing is saved beside the action, so there is nothing to go stale. */
export const FILE_MODAL_PREFIX = "file:";

/** `IDPDetailCard` → `IDP Detail Card`: a dialog title until someone types one. */
const titleOf = (name) =>
  String(name || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();

/** The file's own name, or its folder's when the file is an `index`. */
const nameOf = (path) => {
  const parts = String(path).split("/");
  const last = parts[parts.length - 1];
  return /^index$/i.test(last) && parts.length > 1 ? parts[parts.length - 2] : last;
};

const fileSpec = (path) => {
  const load = loaderFor(path);
  if (!load) return null;
  const name = nameOf(path);
  return {
    key: `${FILE_MODAL_PREFIX}${path}`,
    label: name,
    icon: "FileText",
    title: titleOf(name),
    size: "75vw",
    file: true,
    load,
  };
};

/**
 * Every component in the app — src/pages, then src/components — as options for
 * the "Open modal" picker. The builder's own files are left out: the builder
 * opened inside a dialog of a screen it built is not something anyone wants.
 */
export const FILE_MODAL_OPTIONS = [
  ...Object.keys(PAGE_GLOB).map(tidyPath).sort((a, b) => a.localeCompare(b)),
  ...Object.keys(COMPONENT_GLOB)
    .map(tidyPath)
    .filter((p) => !p.startsWith("components/DynamicScreenBuilder/"))
    .sort((a, b) => a.localeCompare(b)),
].map((path) => ({
  value: `${FILE_MODAL_PREFIX}${path}`,
  label: `${nameOf(path)} — ${path.slice(0, path.lastIndexOf("/"))}`,
  search: path,
  group: path.startsWith("pages/") ? "Pages — src/pages" : "Components — src/components",
}));

/** Options for a picker: the app modals first, then the module's screens. */
export const APP_MODAL_OPTIONS = [
  // `search` is what a picker matches on besides the label: the component's own
  // file name and the name the hand-coded pages give the action. Someone
  // wiring a tile is reading a page's source — they search for what they see
  // there ("Capture Vital", "VitalSignChart"), not for the label written here.
  ...Object.values(APP_MODALS).map((m) => ({ value: m.key, label: m.label, search: m.search || "" })),
  ...Object.keys(FRAME_LOADERS)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ value: `${FRAME_MODAL_PREFIX}${name}`, label: `Screen — ${name}`, search: name })),
];

/**
 * The spec for a picked key — one of the modals above, one of the module's
 * screens when the key carries the frame prefix, one the screen registered
 * itself when it carries the custom one, or any component file of the app when
 * it carries the file one.
 *
 * `screenModals` is the screen's own list; the host passes it so a key saved on
 * one screen means nothing on another, which is what keeps a screen's JSON the
 * whole truth about what it can open.
 */
export const appModal = (key, screenModals) => {
  if (!key) return null;
  const k = String(key);
  if (k.startsWith(FRAME_MODAL_PREFIX)) {
    const name = k.slice(FRAME_MODAL_PREFIX.length);
    return FRAME_LOADERS[name] ? frameSpec(name) : null;
  }
  if (k.startsWith(CUSTOM_MODAL_PREFIX)) {
    const entry = (Array.isArray(screenModals) ? screenModals : []).find((e) => (e?.key || `${CUSTOM_MODAL_PREFIX}${e?.path}`) === k);
    return entry ? customSpec(entry) : null;
  }
  if (k.startsWith(FILE_MODAL_PREFIX)) return fileSpec(k.slice(FILE_MODAL_PREFIX.length));
  return APP_MODALS[key] || null;
};
