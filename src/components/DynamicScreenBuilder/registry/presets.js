/**
 * Healthcare presets — the palette's clinical building blocks.
 *
 * Not new component types: each one is an ordinary subtree of existing
 * components (Card / Panel, Field Card, Vitals Card, Table, inputs) with the
 * labels, icons and sample shape a hospital screen starts from. Dropped, it is
 * indistinguishable from the same thing assembled by hand — every part stays
 * selectable and editable, and nothing new has to be understood by the
 * renderer, the migrator or the code generator.
 *
 * `build()` returns a fresh node each time, so two drops never share ids.
 */
import { createNode } from "../schema/schema";
import { REGISTRY } from "./index";

const node = (type, props = {}, children, extra = {}) => {
  const def = REGISTRY[type];
  const n = createNode(def, { ...extra, props });
  if (children) n.children = children;
  return n;
};

const card = (title, icon, children, props = {}) => node("CardPanel", { title, icon, iconStyle: "badge", ...props }, children, { name: title });

const grid = (children, minColWidth = 180) => node("GridLayout", { autoFit: true, minColWidth, gap: 12 }, children, { name: "Grid" });

const field = (label, icon, value, accent = "") =>
  node("FieldCard", { label, icon, value, accent, layout: "stacked", emptyText: "—" }, null, { name: label });

const vital = (label, icon, unit, range, accent) =>
  node("VitalCard", { label, icon, value: "", unit, range, accent, emptyText: "—" }, null, { name: `${label} vital` });

const input = (type, label, icon, props = {}) => node(type, { label, icon, ...props }, null, { name: label });

const options = (...labels) => labels.map((l, i) => ({ value: String(i + 1), label: l }));

const table = (title, columns, rows) =>
  node("DataTable", { title, dataMode: "static", columns, staticRows: rows, showViewToggle: false, pageSize: 5 }, null, {
    name: title,
  });

export const HEALTHCARE_PRESETS = [
  {
    id: "patientInfo",
    label: "Patient Info",
    icon: "UserRound",
    hint: "UHID, name, gender/age, mobile, address, marital status, blood group, scheme",
    rootType: "CardPanel",
    build: () =>
      card("Patient Information", "UserRound", [
        grid([
          field("UHID", "IdCard", "{{row.UHID}}"),
          field("Patient Name", "User", "{{row.PatientName}}"),
          field("Gender / Age", "VenusAndMars", "{{row.GenderAge}}"),
          field("Mobile No", "Smartphone", "{{row.Mobile}}"),
          field("Marital Status", "HeartHandshake", "{{row.MaritalStatus}}"),
          field("Blood Group", "Droplet", "{{row.BloodGroup}}", "#dc2626"),
          field("Address", "MapPin", "{{row.Address}}"),
          field("Scheme / Panel", "ShieldPlus", "{{row.Panel}}"),
        ]),
      ]),
  },
  {
    id: "patientForm",
    label: "Patient Registration",
    icon: "UserPlus",
    hint: "Registration inputs with leading icons",
    rootType: "CardPanel",
    build: () =>
      card("Patient Registration", "UserPlus", [
        grid(
          [
            input("TextInput", "Patient Name", "User", { field: "PatientName" }),
            input("SelectInput", "Gender", "VenusAndMars", { field: "Gender", options: options("Male", "Female", "Other") }),
            input("DatePicker", "Date of Birth", "", { field: "DOB" }),
            input("NumberInput", "Age", "Cake", { field: "Age" }),
            input("SelectInput", "Marital Status", "HeartHandshake", {
              field: "MaritalStatus",
              options: options("Single", "Married", "Divorced", "Widowed"),
            }),
            input("SelectInput", "Blood Group", "Droplet", {
              field: "BloodGroup",
              options: options("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"),
            }),
            input("TextInput", "Mobile No", "Smartphone", { field: "Mobile", maxLength: 10 }),
            input("TextInput", "Email", "Mail", { field: "Email" }),
            input("TextInput", "Address", "MapPin", { field: "Address" }),
            input("NumberInput", "Weight (kg)", "Weight", { field: "Weight" }),
            input("NumberInput", "Height (cm)", "Ruler", { field: "Height" }),
          ],
          200,
        ),
      ]),
  },
  {
    id: "vitals",
    label: "Vitals",
    icon: "HeartPulse",
    hint: "BP, pulse, temperature, SpO₂, respiration",
    rootType: "CardPanel",
    build: () =>
      card("Vitals", "HeartPulse", [
        grid(
          [
            vital("BP", "Gauge", "mmHg", "90/60 – 120/80", "#e11d48"),
            vital("Pulse", "HeartPulse", "bpm", "60 – 100", "#db2777"),
            vital("Temp", "Thermometer", "°F", "97 – 99", "#ea580c"),
            vital("SpO₂", "Wind", "%", "95 – 100", "#0284c7"),
            vital("Resp. rate", "Activity", "/min", "12 – 20", "#0d9488"),
          ],
          140,
        ),
      ]),
  },
  { id: "bp", label: "Blood Pressure", icon: "Gauge", rootType: "VitalCard", build: () => vital("BP", "Gauge", "mmHg", "90/60 – 120/80", "#e11d48") },
  {
    id: "temperature",
    label: "Temperature",
    icon: "Thermometer",
    rootType: "VitalCard",
    build: () => vital("Temp", "Thermometer", "°F", "97 – 99", "#ea580c"),
  },
  {
    id: "bloodGroup",
    label: "Blood Group",
    icon: "Droplet",
    rootType: "FieldCard",
    build: () => field("Blood Group", "Droplet", "{{row.BloodGroup}}", "#dc2626"),
  },
  {
    id: "allergies",
    label: "Allergies",
    icon: "ShieldAlert",
    rootType: "FieldCard",
    build: () => {
      const n = field("Allergies", "ShieldAlert", "{{row.Allergies}}", "#dc2626");
      n.props.emptyText = "No known allergies";
      return n;
    },
  },
  {
    id: "prescription",
    label: "Prescription",
    icon: "Pill",
    rootType: "CardPanel",
    build: () =>
      card("Prescription", "Pill", [
        table(
          "",
          [
            { key: "Medicine", header: "Medicine", headerIcon: "Pill" },
            { key: "Dose", header: "Dose", headerIcon: "Tablets" },
            { key: "Frequency", header: "Frequency", headerIcon: "Clock" },
            { key: "Duration", header: "Duration", headerIcon: "CalendarRange" },
            { key: "Route", header: "Route", headerIcon: "Syringe" },
          ],
          [
            { Medicine: "Paracetamol 500 mg", Dose: "1 tab", Frequency: "TDS", Duration: "5 days", Route: "Oral" },
            { Medicine: "Pantoprazole 40 mg", Dose: "1 tab", Frequency: "OD", Duration: "7 days", Route: "Oral" },
          ],
        ),
      ]),
  },
  {
    id: "vaccination",
    label: "Injection / Vaccine",
    icon: "Syringe",
    rootType: "CardPanel",
    build: () =>
      card("Vaccination", "Syringe", [
        table(
          "",
          [
            { key: "Vaccine", header: "Vaccine", headerIcon: "Syringe" },
            { key: "Dose", header: "Dose", headerIcon: "Hash" },
            { key: "GivenOn", header: "Given on", headerIcon: "Calendar" },
            { key: "GivenBy", header: "Given by", headerIcon: "Stethoscope" },
          ],
          [{ Vaccine: "Tetanus toxoid", Dose: "1", GivenOn: "21-Sep-2026", GivenBy: "Dr. Sharma" }],
        ),
      ]),
  },
  {
    id: "diagnosis",
    label: "Diagnosis",
    icon: "ClipboardPlus",
    rootType: "CardPanel",
    build: () =>
      card("Diagnosis", "ClipboardPlus", [
        input("TextInput", "ICD Code", "Hash", { field: "ICDCode" }),
        input("Textarea", "Provisional Diagnosis", "", { field: "Diagnosis", rows: 3 }),
      ]),
  },
  {
    id: "labReport",
    label: "Lab Report",
    icon: "TestTube",
    rootType: "CardPanel",
    build: () =>
      card("Lab Report", "TestTube", [
        table(
          "",
          [
            { key: "Test", header: "Test", headerIcon: "FlaskConical" },
            { key: "Result", header: "Result", headerIcon: "Activity" },
            { key: "Unit", header: "Unit", headerIcon: "Ruler" },
            { key: "Range", header: "Normal range", headerIcon: "Gauge" },
            { key: "Status", header: "Status", type: "chip", headerIcon: "BadgeCheck" },
          ],
          [
            { Test: "Haemoglobin", Result: "13.2", Unit: "g/dL", Range: "13 – 17", Status: "Normal" },
            { Test: "Blood Sugar (R)", Result: "212", Unit: "mg/dL", Range: "70 – 140", Status: "Critical" },
            { Test: "Serum Creatinine", Result: "—", Unit: "mg/dL", Range: "0.7 – 1.3", Status: "Pending" },
          ],
        ),
      ]),
  },
  {
    id: "imaging",
    label: "X-Ray / Scan",
    icon: "ScanLine",
    rootType: "CardPanel",
    build: () =>
      card("Imaging", "ScanLine", [
        input("FileUpload", "Upload scan", "", { field: "ScanFile" }),
        input("Textarea", "Findings", "", { field: "Findings", rows: 3 }),
      ]),
  },
  {
    id: "doctorNotes",
    label: "Doctor Notes",
    icon: "NotebookPen",
    rootType: "CardPanel",
    build: () => card("Doctor Notes", "NotebookPen", [input("Textarea", "Notes", "", { field: "DoctorNotes", rows: 4 })]),
  },
  {
    id: "insurance",
    label: "Insurance",
    icon: "ShieldPlus",
    rootType: "CardPanel",
    build: () =>
      card("Insurance", "ShieldPlus", [
        grid([
          field("Panel / TPA", "ShieldPlus", "{{row.Panel}}"),
          field("Policy No", "IdCard", "{{row.PolicyNo}}"),
          field("Valid Till", "Calendar", "{{row.ValidTill}}"),
          field("Approved Amount", "IndianRupee", "{{row.ApprovedAmount}}"),
        ]),
      ]),
  },
  {
    id: "emergencyContact",
    label: "Emergency Contact",
    icon: "PhoneCall",
    rootType: "CardPanel",
    build: () =>
      card("Emergency Contact", "PhoneCall", [
        grid([
          input("TextInput", "Contact Name", "User", { field: "EmergencyName" }),
          input("SelectInput", "Relation", "UsersRound", {
            field: "EmergencyRelation",
            options: options("Spouse", "Father", "Mother", "Son", "Daughter", "Sibling", "Other"),
          }),
          input("TextInput", "Mobile No", "PhoneCall", { field: "EmergencyMobile", maxLength: 10 }),
        ]),
      ]),
  },
  {
    id: "statusBadges",
    label: "Status Badges",
    icon: "BadgeCheck",
    hint: "Admitted, Discharged, Critical, Stable, Pending, In Surgery, Under Observation",
    rootType: "Row",
    build: () =>
      node(
        "Row",
        { direction: "row", wrap: true, gap: 8, autoFit: false, align: "center" },
        ["Admitted", "Discharged", "Critical", "Stable", "Pending", "In Surgery", "Under Observation"].map((t) =>
          node("Chip", { text: t, statusIcon: true, statusTone: true, variant: "soft", bg: "", fg: "" }, null, { name: t }),
        ),
        { name: "Status badges" },
      ),
  },
  {
    id: "bedSelection",
    label: "Bed Selection",
    icon: "BedDouble",
    hint: "Bed cards — available, occupied, blocked; clicking a free bed selects it as BedID",
    rootType: "CardList",
    // Static rows so it draws straight away; switch "Cards come from" to
    // Dynamic API and pick the bed endpoint — the card reads the same fields.
    build: () =>
      node(
        "CardList",
        {
          title: "Select Bed",
          headerIcon: "BedDouble",
          headerColor: "#16a34a",
          countLabel: "Beds",
          summaryField: "Status",
          dataMode: "static",
          staticRows: [
            { BedID: 101, RoomName: "General ward 1-GW1", BedNo: "Bed 01", Status: "Available" },
            { BedID: 102, RoomName: "General ward 2-GW2", BedNo: "Bed 02", Status: "Available" },
            { BedID: 103, RoomName: "General ward 3-GW3", BedNo: "Bed 03", Status: "Occupied" },
            { BedID: 201, RoomName: "ICU-1", BedNo: "Bed 01", Status: "Available" },
            { BedID: 202, RoomName: "ICU-2", BedNo: "Bed 02", Status: "Blocked" },
          ],
          rowKeyField: "BedID",
          cardIcon: "BedDouble",
          cardTitle: "{{row.RoomName}} / {{row.BedNo}}",
          cardStatus: "{{row.Status}}",
          cardAccentDefault: "#16a34a",
          minCardWidth: 230,
          selectMode: "single",
          field: "BedID",
          valueField: "BedID",
          selectedText: "Selected",
          clickableWhen: [{ field: "Status", op: "eq", value: "Available" }],
        },
        null,
        {
          name: "Bed selection",
          rules: {
            visibility: [],
            color: [
              { id: "r_bed_occ", field: "Status", op: "eq", value: "Occupied", target: "accent", bg: "#dc2626", fg: "", border: "" },
              { id: "r_bed_blk", field: "Status", op: "eq", value: "Blocked", target: "accent", bg: "#f59e0b", fg: "", border: "" },
            ],
          },
        },
      ),
  },
  {
    id: "haloStatCards",
    label: "Halo Stat Cards",
    icon: "CircleDot",
    hint: "Centred stat cards — icon in a pastel ring, count badge, caption, date / time / user footer; each card its own pastel",
    rootType: "CardList",
    // A Card List in its halo design. Every card reads its record, so swap the
    // static rows for an endpoint and the cards follow; {{row.Icon}} and the
    // palette give each one its own glyph and colour.
    build: () =>
      node(
        "CardList",
        {
          dataMode: "static",
          staticRows: [
            { Id: 1, Title: "Discharge", Caption: "Patients released", Count: 4, Icon: "BriefcaseMedical", Date: "01-Sep-26", Time: "11:36 AM", By: "Mr. Administrator" },
            { Id: 2, Title: "Admission", Caption: "New in-patients", Count: 12, Icon: "BedDouble", Date: "01-Sep-26", Time: "10:05 AM", By: "Dr. Anita Rao" },
            { Id: 3, Title: "Transfer", Caption: "Ward to ward", Count: 3, Icon: "ArrowRightLeft", Date: "01-Sep-26", Time: "09:42 AM", By: "Nurse Sita Devi" },
            { Id: 4, Title: "Emergency", Caption: "Walk-ins today", Count: 7, Icon: "Ambulance", Date: "01-Sep-26", Time: "08:15 AM", By: "Dr. John Peter" },
          ],
          rowKeyField: "Id",
          cardStyle: "halo",
          haloFill: "soft",
          palette: "cycle",
          cardIcon: "{{row.Icon}}",
          cardTitle: "{{row.Title}}",
          cardSubtitle: "{{row.Caption}}",
          cardValue: "{{row.Count}}",
          cardMeta1: "{{row.Date}}",
          cardMeta1Icon: "CalendarDays",
          cardMeta2: "{{row.Time}}",
          cardMeta2Icon: "Clock",
          cardStatus: "{{row.By}}",
          cardStatusIcon: "CircleUser",
          minCardWidth: 220,
          gap: 16,
        },
        null,
        { name: "Halo stat cards" },
      ),
  },
];

export const presetById = (id) => HEALTHCARE_PRESETS.find((p) => p.id === id) || null;
