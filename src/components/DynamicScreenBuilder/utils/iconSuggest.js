/**
 * The icon a label means.
 *
 * Screens are built out of labels a hospital already uses — "UHID", "Gender /
 * Age", "Marital Status", "Referred Doctor", "Billing Category" — and each of
 * them has an obvious glyph. This reads the label the way a person would and
 * names that glyph, so the picker can offer it first and "Auto icons" can
 * decorate a whole screen in one step instead of forty trips to the picker.
 *
 * Rules run top to bottom and the first hit wins, so the specific ones sit
 * above the general: "Doctor Name" is a doctor before it is a name, "Attendant
 * Mobile" a phone before it is a relative. Only names from registry/icons are
 * returned, so whatever comes back renders.
 */
import { ICONS, searchIcons } from "../registry/icons";

/** "PatientName", "patient_name", "Gender/Age" -> "patient name", "gender age". */
export function normaliseLabel(text) {
  return ` ${String(text || "")
    .replace(/\{\{[^}]*\}\}/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_\-./\\:()[\],|]+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()} `;
}

// [pattern tested against " normalised label ", icon]
const LABEL_RULES = [
  // Screens and menus
  [/ dashboard | overview /, "LayoutDashboard"],
  [/ settings? | configuration | setup /, "Settings"],
  [/^ (reports?|mis) $/, "FileHeart"],
  // Identity
  [/ uhid | mrn | mr no | reg(istration)? no | patient id | ipd? no | opd no | emergency no | admission no | card no | id no /, "IdCard"],
  [/ aadh?aa?r | passport | pan no | voter | id proof | identity /, "Fingerprint"],
  // Demographics — the example the whole feature is judged on
  [/ gender | sex /, "VenusAndMars"],
  [/ marital | married | spouse | husband | wife /, "HeartHandshake"],
  [/ dob | date of birth | birth ?date | birthday /, "Cake"],
  [/ religion | caste /, "HandHeart"],
  [/ nationality | citizenship /, "Flag"],
  [/ country /, "Globe"],
  [/ language /, "Languages"],
  [/ education | qualification /, "GraduationCap"],
  [/ occupation | profession | employer | company | organi[sz]ation /, "Briefcase"],
  [/ blood ?group | blood type /, "Droplet"],
  [/ allerg/, "ShieldAlert"],
  // Contact
  [/ e ?mail /, "Mail"],
  [/ emergency contact /, "PhoneCall"],
  [/ mobile | cell /, "Smartphone"],
  [/ phone | contact no | telephone | tel no | landline /, "Phone"],
  [/ pin ?code | zip | postal /, "MapPinned"],
  [/ city | district | state | taluk|tehsil | village /, "MapPinned"],
  [/ address | street | locality | area | residence | location /, "MapPin"],
  // Vitals
  [/ bp | blood pressure | systolic | diastolic /, "Gauge"],
  [/ pulse | heart ?rate | hr /, "HeartPulse"],
  [/ temp(erature)? | fever /, "Thermometer"],
  [/ sp ?o2 | oxygen | saturation | resp(iration|iratory)? ?(rate)? | rr /, "Wind"],
  [/ sugar | glucose | rbs | fbs | ppbs /, "Droplets"],
  [/ bmi /, "Scale"],
  [/ weight | wt /, "Weight"],
  [/ height | ht /, "Ruler"],
  [/ vitals? /, "Activity"],
  // Time — above clinical, so "Date of Admission" is a date before it is an admission
  [/ appointment|booking|slot|visit|follow ?up/, "CalendarCheck"],
  [/ from date|to date|date range|period/, "CalendarRange"],
  [/ date|day /, "Calendar"],
  [/ time|hour|duration/, "Clock"],
  [/ token|queue/, "Ticket"],
  // Clinical
  [/ mlc | medico legal | police | fir /, "Gavel"],
  [/ diagnos|icd | provisional /, "ClipboardPlus"],
  [/ complaints? | symptoms? | chief /, "MessageSquareText"],
  [/ prescri|pharmac|medicines?|medications?|drugs?|tablets?|dose|dosage/, "Pill"],
  [/ vaccin|injection|immuni[sz]/, "Syringe"],
  [/ x ?ray| ct |mri|scan|radiolog|imaging|usg|ultra ?sound|sonograph/, "ScanLine"],
  [/ lab | labs | laborator|investigation|pathology|sample|specimen| tests? /, "FlaskConical"],
  [/ surg|operation| ot |procedure/, "Scissors"],
  [/ discharge/, "LogOut"],
  [/ emergency|casualty|triage|critical/, "Siren"],
  [/ ambulance/, "Ambulance"],
  [/ (medical |past |family )?history /, "History"],
  [/ notes?|remarks?|comments?|observations?|advice|instructions?/, "NotebookPen"],
  [/ nurs(e|ing)/, "HandHeart"],
  // People around the patient — after phone/mobile so "Attendant Mobile" stays a phone
  [/ doctor|consultant|physician|surgeon|dr | specialist|clinician/, "Stethoscope"],
  [/ attend(ant|ee)s?|relative|kin|guardian|relation|father|mother|husband|family|next of/, "UsersRound"],
  [/ refer/, "Share2"],
  // Hospital
  [/ ward|beds?|room|floor|cabin|icu|occupied|vacant/, "BedDouble"],
  [/ admission|admit|ipd|in ?patient/, "Hospital"],
  [/ department|speciality|specialty|unit|centre|center|branch/, "Building2"],
  [/ diet|meal|food/, "Utensils"],
  // Money
  [/ insurance|tpa|panel|scheme|policy|corporate|sponsor/, "ShieldPlus"],
  [/ bill|invoice|receipt/, "Receipt"],
  [/ discount|percent|tax|gst/, "Percent"],
  [/ payment|pay mode|paymode| card | upi /, "CreditCard"],
  [/ advance|deposit|refund|wallet/, "Wallet"],
  [/ amount|price|rate|charges?|fees?|cost|balance|due|paid|net|gross|total/, "IndianRupee"],
  // Actions (buttons, row icons)
  [/ (search|find) patient|patient (search|lookup)/, "UserRoundSearch"],
  [/ search|find|lookup/, "Search"],
  [/ view|preview|show|open/, "Eye"],
  [/ edit|modify|update|change/, "Pencil"],
  [/ delete|remove/, "Trash2"],
  [/ print/, "Printer"],
  [/ download|export|excel/, "Download"],
  [/ upload|import|attach/, "Upload"],
  [/ save|submit/, "Save"],
  [/ send|publish|forward/, "Send"],
  [/ add|new|create|register/, "Plus"],
  [/ cancel|close/, "X"],
  [/ reset|clear/, "RotateCcw"],
  [/ refresh|reload/, "RefreshCw"],
  [/ copy|duplicate/, "Copy"],
  [/ transfer|shift/, "ArrowRightLeft"],
  [/ filter/, "Filter"],
  // Generic — last
  [/ patient name | name | full name | first name | last name /, "User"],
  [/ patients /, "Users"],
  [/ patient /, "UserRound"],
  [/ status /, "Activity"],
  [/ type | category | class | kind /, "Tags"],
  [/ qty | quantity | count | no | number | serial /, "Hash"],
  [/ summary | details | info(rmation)? | overview /, "ClipboardList"],
];

/** The one icon a label stands for, or "" when nothing fits. */
export function suggestIcon(text) {
  const t = normaliseLabel(text);
  if (t.trim() === "") return "";
  const hit = LABEL_RULES.find(([re]) => re.test(t));
  return hit && ICONS[hit[1]] ? hit[1] : "";
}

/**
 * A few icons for the picker to offer first: the rule's answer, then whatever
 * the icon keywords say about the same words.
 */
export function suggestIcons(text, limit = 6) {
  const out = [];
  const first = suggestIcon(text);
  if (first) out.push(first);
  const words = normaliseLabel(text)
    .trim()
    .split(" ")
    .filter((w) => w.length > 2);
  words.forEach((w) => {
    searchIcons(w)
      .slice(0, 3)
      .forEach((n) => {
        if (!out.includes(n)) out.push(n);
      });
  });
  return out.slice(0, limit);
}

/* ------------------------------------------------------------------ status */

/**
 * A status word, as icon + tone: Admitted, Discharged, Critical, Stable…
 * Tones map onto the theme's semantic colours (success / warning / danger /
 * info / muted). null when the text is not a status anyone recognises, so a
 * chip that says "Cardiology" is left alone.
 */
const STATUS_RULES = [
  [/ critical | emergency | urgent | stat | serious | red /, "AlertTriangle", "danger"],
  [/ cancel|reject|fail|declin|expired|deceased|dead|death|absconded|lama|dama/, "CircleX", "danger"],
  [/ discharg|released|rfi|checked out|check ?out/, "LogOut", "muted"],
  [/ surgery| ot |operation|in theatre/, "Scissors", "info"],
  [/ observ|monitor/, "Eye", "info"],
  [/ admit|admitted|in ?patient|ipd| in /, "BedDouble", "info"],
  [/ transfer|shifted/, "ArrowRightLeft", "info"],
  [/ pending|waiting|queue|due|draft|hold|unpaid|partial|awaiting|scheduled|booked|in progress|process/, "Clock", "warning"],
  [/ stable|normal|complete|done|approved|active|paid|success|verified|confirmed|closed|yes|ok|arrived|checked in/, "CheckCircle2", "success"],
  [/ new|registered|fresh/, "Sparkles", "info"],
  [/ inactive|blocked|disabled|no /, "Ban", "muted"],
];

export function statusIcon(text) {
  const t = normaliseLabel(text);
  if (t.trim() === "" || t.length > 40) return null;
  const hit = STATUS_RULES.find(([re]) => re.test(t));
  return hit ? { icon: hit[1], tone: hit[2] } : null;
}

/** Tone -> the colours a status badge is painted with. */
export const TONE_COLORS = {
  success: { fg: "#15803d", bg: "#dcfce7", border: "#bbf7d0" },
  warning: { fg: "#b45309", bg: "#fef3c7", border: "#fde68a" },
  danger: { fg: "#b91c1c", bg: "#fee2e2", border: "#fecaca" },
  info: { fg: "#0369a1", bg: "#e0f2fe", border: "#bae6fd" },
  muted: { fg: "#475569", bg: "#f1f5f9", border: "#e2e8f0" },
};

/**
 * What a component calls itself — the words an icon for it should mean.
 * A bound value ({{row.Status}}) says nothing until the screen runs, so it is
 * skipped for the next candidate.
 */
export function iconContext(props = {}, fallback = "") {
  const hit = [props.label, props.title, props.text, props.header, props.heading, props.message, fallback].find(
    (v) => typeof v === "string" && v.replace(/\{\{[^}]*\}\}/g, "").trim(),
  );
  return hit || "";
}
