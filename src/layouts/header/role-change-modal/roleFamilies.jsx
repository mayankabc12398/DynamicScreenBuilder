/* ============================================================
   Family -> color/icon config for the modern role picker.
   Edit this object to retune mapping; nothing else needs to change.
   Each role is matched to a family by keyword on its roleName.
   ============================================================ */
import {
  Stethoscope,
  HeartPulse,
  FlaskConical,
  Pill,
  Headset,
  ReceiptText,
  FolderArchive,
  Building2,
  Store,
  Droplets,
  CreditCard,
  FileCheck2,
  Siren,
  ClipboardList,
  Banknote,
  ConciergeBell,
  Warehouse,
  LifeBuoy,
  Archive,
  BedDouble,
  Syringe,
  ShoppingCart,
  Radiation,
  TestTubes,
  Users,
  Microscope,
} from "lucide-react";

export const FAMILIES = {
  clinical: {
    label: "Clinical",
    grad: ["#3b82f6", "#6366f1"],
    accent: "#4f6ef0",
    Icon: Stethoscope,
    keys: ["opd", "exam", "clinical", "emr", "order", "doctor", "consult", "physician"],
  },
  critical: {
    label: "Critical Care",
    grad: ["#fb7185", "#ef4444"],
    accent: "#f43f5e",
    Icon: HeartPulse,
    keys: ["nursing", "nurse", "ward", "emergency", "casualty", "ot", "operation", "theatre", "icu", "critical"],
  },
  diagnostics: {
    label: "Diagnostics",
    grad: ["#22d3ee", "#0ea5e9"],
    accent: "#0891b2",
    Icon: FlaskConical,
    keys: ["sample", "collection", "lab", "laborator", "radiology", "pathology", "imaging", "diagnost", "scan"],
  },
  pharmacy: {
    label: "Pharmacy",
    grad: ["#34d399", "#14b8a6"],
    accent: "#0d9488",
    Icon: Pill,
    keys: ["pharmacy", "pharma", "medicine", "drug", "dispens"],
  },
  frontdesk: {
    label: "Front Desk",
    grad: ["#a78bfa", "#8b5cf6"],
    accent: "#7c3aed",
    Icon: Headset,
    keys: ["front", "office", "reception", "counsel", "help", "discharge", "registration", "admission", "desk", "enquiry"],
  },
  billing: {
    label: "Billing",
    grad: ["#fbbf24", "#f59e0b"],
    accent: "#d97706",
    Icon: ReceiptText,
    keys: ["billing", "payroll", "cashier", "account", "invoice", "finance", "ipd billing", "payment"],
  },
  records: {
    label: "Records",
    grad: ["#c084fc", "#a855f7"],
    accent: "#9333ea",
    Icon: FolderArchive,
    keys: ["mrd", "record", "archive"],
  },
  general: {
    label: "General",
    grad: ["#94a3b8", "#64748b"],
    accent: "#64748b",
    Icon: Building2,
    keys: [],
  },
};

const FAMILY_ORDER = [
  "clinical",
  "critical",
  "diagnostics",
  "pharmacy",
  "frontdesk",
  "billing",
  "records",
  "general",
];

/** Resolve a roleName to a family key (keyword match, fallback "general"). */
export function resolveFamily(roleName = "") {
  const n = String(roleName).toLowerCase();
  for (const key of FAMILY_ORDER) {
    if (FAMILIES[key].keys.some((k) => n.includes(k))) return key;
  }
  return "general";
}

/* ============================================================
   Per-role icon. Background/gradient stays family-based, but each
   role gets a DISTINCT icon meaningful to its name.
   1) exact match on backend `iconSVG` key, else
   2) keyword scan on roleName, else
   3) family icon fallback.
   ============================================================ */

/** iconSVG key (from backend) -> distinct icon. */
const ROLE_ICONS = {
  medicalStore: Store,
  billing: ReceiptText,
  bloodBank: Droplets,
  creditControl: CreditCard,
  dischargeSummary: FileCheck2,
  doctor: Stethoscope,
  emergency: Siren,
  examination: ClipboardList,
  finance: Banknote,
  frontOffice: ConciergeBell,
  generalStore: Warehouse,
  helpDesk: LifeBuoy,
  laboratory: FlaskConical,
  MRD: Archive,
  nursingWard: BedDouble,
  operationTheatre: Syringe,
  pharmacy: Pill,
  purchase: ShoppingCart,
  radioLogy: Radiation,
  sampleCollection: TestTubes,
  HR: Users,
};

/** Ordered keyword -> icon (most specific first). roleName fallback. */
const ICON_KEYWORDS = [
  ["sample", TestTubes],
  ["collection", TestTubes],
  ["radiolog", Radiation],
  ["imaging", Radiation],
  ["pathology", Microscope],
  ["laborator", FlaskConical],
  ["lab", FlaskConical],
  ["pharmac", Pill],
  ["medicine", Pill],
  ["drug", Pill],
  ["dispens", Pill],
  ["operation", Syringe],
  ["theatre", Syringe],
  ["surgery", Syringe],
  ["nursing", BedDouble],
  ["nurse", BedDouble],
  ["ward", BedDouble],
  ["icu", BedDouble],
  ["casualty", Siren],
  ["emergency", Siren],
  ["doctor", Stethoscope],
  ["physician", Stethoscope],
  ["consult", Stethoscope],
  ["opd", Stethoscope],
  ["exam", ClipboardList],
  ["discharge", FileCheck2],
  ["reception", ConciergeBell],
  ["registration", ConciergeBell],
  ["admission", ConciergeBell],
  ["front", ConciergeBell],
  ["enquiry", ConciergeBell],
  ["help", LifeBuoy],
  ["credit", CreditCard],
  ["cashier", ReceiptText],
  ["invoice", ReceiptText],
  ["payment", ReceiptText],
  ["billing", ReceiptText],
  ["payroll", Banknote],
  ["finance", Banknote],
  ["account", Banknote],
  ["blood", Droplets],
  ["purchase", ShoppingCart],
  ["procure", ShoppingCart],
  ["store", Warehouse],
  ["inventory", Warehouse],
  ["stock", Warehouse],
  ["mrd", Archive],
  ["record", Archive],
  ["archive", Archive],
  ["human resource", Users],
  ["employee", Users],
  ["hr", Users],
];

/** Resolve a role to its distinct icon component. */
export function resolveRoleIcon(role) {
  const key = role?.iconSVG;
  if (key && ROLE_ICONS[key]) return ROLE_ICONS[key];
  const n = String(role?.roleName || "").toLowerCase();
  for (const [kw, Icon] of ICON_KEYWORDS) {
    if (n.includes(kw)) return Icon;
  }
  return FAMILIES[resolveFamily(role?.roleName)].Icon;
}
