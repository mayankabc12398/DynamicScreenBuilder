/**
 * REFERENCE TEMPLATE — Emergency Patient Search.
 *
 * This is the proof that the builder is generic: the entire screen below is
 * plain JSON over the generic component registry. There is no bespoke
 * "emergency screen" component anywhere in the codebase — swap the JSON and a
 * completely different screen renders.
 *
 * It ships with mock data so it renders immediately; point `ds_patients` and
 * `ds_kpi` at real endpoints (mode: "api") and the same screen goes live.
 */

/* ------------------------------------------------------------- mock data */

const PATIENTS = [
  {
    id: 1,
    UHID: "UH-240118",
    PatientName: "Ramesh Kumar",
    EmergencyNo: "EM-1042",
    TriagingCode: "Urgent",
    Status: "Currently Admitted",
    Age: "42 Y",
    Sex: "Male",
    Contact: "98110 44231",
    Bed: "EM-04",
    InDateTime: "2026-09-01T09:12",
    Doctor: "Dr. A. Verma",
    Panel: "CGHS",
    Complaint: "Chest pain since 3 hours, sweating",
    WaitingType: "Immediate",
    BP: "148/96",
    Pulse: "104",
    SpO2: "94",
    Temp: "99.4",
  },
  {
    id: 2,
    UHID: "UH-240119",
    PatientName: "Sita Devi",
    EmergencyNo: "EM-1043",
    TriagingCode: "Normal",
    Status: "Released Patient",
    Age: "35 Y",
    Sex: "Female",
    Contact: "98110 77123",
    Bed: "EM-07",
    InDateTime: "2026-09-01T10:02",
    Doctor: "Dr. S. Nair",
    Panel: "Cash",
    Complaint: "Fever, body ache",
    WaitingType: "Routine",
    BP: "118/78",
    Pulse: "82",
    SpO2: "98",
    Temp: "101.2",
  },
  {
    id: 3,
    UHID: "UH-240120",
    PatientName: "Arjun Mehta",
    EmergencyNo: "EM-1044",
    TriagingCode: "Urgent",
    Status: "Shifted To Ipd",
    Age: "58 Y",
    Sex: "Male",
    Contact: "99100 12045",
    Bed: "EM-02",
    InDateTime: "2026-09-01T07:45",
    Doctor: "Dr. K. Sharma",
    Panel: "Star Health",
    Complaint: "Breathlessness, known COPD",
    WaitingType: "Immediate",
    BP: "132/88",
    Pulse: "96",
    SpO2: "89",
    Temp: "98.8",
  },
  {
    id: 4,
    UHID: "UH-240121",
    PatientName: "Fatima Noor",
    EmergencyNo: "EM-1045",
    TriagingCode: "Normal",
    Status: "Released For Ipd",
    Age: "27 Y",
    Sex: "Female",
    Contact: "97170 88342",
    Bed: "EM-09",
    InDateTime: "2026-09-01T11:30",
    Doctor: "Dr. R. Iyer",
    Panel: "ECHS",
    Complaint: "RTA — left leg injury",
    WaitingType: "Urgent",
    BP: "124/80",
    Pulse: "88",
    SpO2: "97",
    Temp: "98.2",
  },
  {
    id: 5,
    UHID: "UH-240122",
    PatientName: "John Peter",
    EmergencyNo: "EM-1046",
    TriagingCode: "Urgent",
    Status: "Currently Admitted",
    Age: "64 Y",
    Sex: "Male",
    Contact: "88221 90876",
    Bed: "EM-01",
    InDateTime: "2026-09-01T06:20",
    Doctor: "Dr. A. Verma",
    Panel: "CGHS",
    Complaint: "Giddiness, sudden fall",
    WaitingType: "Immediate",
    BP: "160/100",
    Pulse: "112",
    SpO2: "92",
    Temp: "98.6",
  },
  {
    id: 6,
    UHID: "UH-240123",
    PatientName: "Anita Rao",
    EmergencyNo: "EM-1047",
    TriagingCode: "Normal",
    Status: "Currently Admitted",
    Age: "31 Y",
    Sex: "Female",
    Contact: "90011 23456",
    Bed: "EM-06",
    InDateTime: "2026-09-01T12:05",
    Doctor: "Dr. S. Nair",
    Panel: "Cash",
    Complaint: "Abdominal pain",
    WaitingType: "Routine",
    BP: "110/72",
    Pulse: "78",
    SpO2: "99",
    Temp: "98.4",
  },
];

const KPI = [
  {
    TotalPatients: 128,
    CurrentlyAdmitted: 42,
    ReleasedPatient: 51,
    ReleasedForIpd: 19,
    ShiftedToIpd: 16,
  },
];

/* ------------------------------------------------------- colour rule sets */

const TRIAGE_RULES = [
  { field: "TriagingCode", op: "eq", value: "Urgent", target: "chip", bg: "#FDE047", fg: "#713F12" },
  { field: "TriagingCode", op: "eq", value: "Critical", target: "chip", bg: "#FEE2E2", fg: "#B91C1C" },
  { field: "TriagingCode", op: "eq", value: "Normal", target: "chip", bg: "#DCFCE7", fg: "#15803D" },
];

const STATUS_RULES = [
  { field: "Status", op: "eq", value: "Currently Admitted", target: "chip", bg: "#EDE9FE", fg: "#7C3AED" },
  { field: "Status", op: "eq", value: "Released Patient", target: "chip", bg: "#DCFCE7", fg: "#15803D" },
  { field: "Status", op: "eq", value: "Released For Ipd", target: "chip", bg: "#DBEAFE", fg: "#1D4ED8" },
  { field: "Status", op: "eq", value: "Shifted To Ipd", target: "chip", bg: "#FFEDD5", fg: "#C2410C" },
];

const kpi = (id, label, value, icon, accent) => ({
  id,
  type: "StatCard",
  name: label,
  props: { label, value, icon, accent, size: "md" },
});

const filterInput = (id, label, field, extra = {}) => ({
  id,
  type: "TextInput",
  name: label,
  props: { label, field, placeholder: label, floatingLabel: true, ...extra },
});

const detailTile = (id, label, value, icon, accent, rules) => ({
  id,
  type: "InfoTile",
  name: label,
  props: { label, value, icon, accent },
  ...(rules ? { rules: { visibility: [], color: rules } } : {}),
});

const vital = (id, label, value, unit, range, icon, accent) => ({
  id,
  type: "VitalCard",
  name: `Vital ${label}`,
  props: { label, value, unit, range, icon, accent },
});

/* ------------------------------------------------------------- the screen */

export const EMERGENCY_SCREEN = {
  id: "scr_emergency_patient_search",
  name: "Emergency Patient Search",
  description:
    "KPI strip, filter panel, tabbed result grid with conditional colour chips and a closable patient detail panel. Built entirely from the component registry.",
  category: "Emergency",
  status: "published",
  version: 1,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",

  theme: {
    mode: "light",
    tokens: { primary: "#2563eb", radius: "12px", fontSize: "13px" },
  },

  palette: [
    { name: "Urgent", bg: "#FDE047", fg: "#713F12" },
    { name: "Currently Admitted", bg: "#EDE9FE", fg: "#7C3AED" },
    { name: "Released", bg: "#DCFCE7", fg: "#15803D" },
    { name: "Shifted", bg: "#FFEDD5", fg: "#C2410C" },
    { name: "Released For IPD", bg: "#DBEAFE", fg: "#1D4ED8" },
  ],

  dataSources: {
    ds_patients: {
      id: "ds_patients",
      name: "Emergency patients",
      mode: "static",
      url: "Emergency/SearchEmergencyPatients",
      method: "POST",
      headers: {},
      params: {},
      body: {
        UHID: "{{values.uhid}}",
        PatientName: "{{values.patientName}}",
        EmergencyNo: "{{values.emergencyNo}}",
        TriageCode: "{{values.triageCode}}",
        WaitingType: "{{values.waitingType}}",
        Panel: "{{values.panel}}",
        Status: "{{vars.statusFilter}}",
        FromDate: "{{values.fromDate}}",
        ToDate: "{{values.toDate}}",
      },
      responsePath: "data",
      staticData: PATIENTS,
      autoLoad: true,
    },
    ds_kpi: {
      id: "ds_kpi",
      name: "Emergency counts",
      mode: "static",
      url: "Emergency/GetEmergencyCounts",
      method: "GET",
      headers: {},
      params: {},
      body: {},
      responsePath: "data",
      staticData: KPI,
      autoLoad: true,
    },
  },

  variables: { statusFilter: "", selected: null },

  root: {
    id: "n_root",
    type: "Container",
    name: "Screen",
    locked: true,
    props: { direction: "column", gap: 14, padding: 16, align: "stretch", justify: "flex-start" },
    style: { minHeight: "100%" },
    children: [
      /* 2 — breadcrumb header bar -------------------------------------- */
      {
        id: "n_crumbs",
        type: "Breadcrumb",
        name: "Breadcrumb bar",
        props: {
          // Read from the menu, the way the hand-coded page does; the typed
          // list is what shows when the menu has no entry (the canvas, or a
          // screen opened straight from its URL).
          source: "menu",
          items: [{ label: "Home", icon: "Home" }, { label: "Emergency" }, { label: "Emergency Patient Search" }],
          // The app codes emergency screens red — see AuroraHeading's family table.
          appearance: "heading",
          family: "red",
          radius: 8,
          separator: "/",
        },
      },

      /* 1 — KPI strip --------------------------------------------------- */
      {
        id: "n_kpi",
        type: "GridLayout",
        name: "KPI strip",
        props: { autoFit: true, minColWidth: 190, gap: 12, columns: 5, padding: 0 },
        responsive: { tablet: { props: { minColWidth: 220 } }, mobile: { props: { minColWidth: 150 } } },
        children: [
          kpi("n_kpi1", "Total Patients", "{{rows.ds_kpi.0.TotalPatients}}", "Users", "#2563eb"),
          kpi("n_kpi2", "Currently Admitted", "{{rows.ds_kpi.0.CurrentlyAdmitted}}", "BedDouble", "#7C3AED"),
          kpi("n_kpi3", "Released Patient", "{{rows.ds_kpi.0.ReleasedPatient}}", "UserCheck", "#16a34a"),
          kpi("n_kpi4", "Released For Ipd", "{{rows.ds_kpi.0.ReleasedForIpd}}", "LogOut", "#0ea5e9"),
          kpi("n_kpi5", "Shifted To Ipd", "{{rows.ds_kpi.0.ShiftedToIpd}}", "MoveRight", "#f59e0b"),
        ],
      },

      /* 3 — search / filter panel --------------------------------------- */
      {
        id: "n_filters",
        type: "CardPanel",
        name: "Search panel",
        props: {
          title: "Search Emergency Patients",
          icon: "Search",
          collapsible: true,
          padding: 14,
          radius: 12,
          bordered: true,
          shadow: true,
          actions: [],
        },
        children: [
          {
            id: "n_filtergrid",
            type: "GridLayout",
            name: "Filter grid",
            // Six across a desktop, narrowing with the screen: the filter block
            // reads as one block instead of a ragged wrap, and every control is
            // the same width whatever kind it is.
            props: { columns: 6, colsLg: 4, colsMd: 2, colsSm: 1, autoFit: false, gap: 12, padding: 0 },
            children: [
              filterInput("n_f_uhid", "UHID", "uhid", { prefixIcon: "Hospital" }),
              filterInput("n_f_name", "PatientName", "patientName", { prefixIcon: "User" }),
              filterInput("n_f_emg", "Emergency No", "emergencyNo", { prefixIcon: "Siren" }),
              filterInput("n_f_triage", "Triage Code", "triageCode", { prefixIcon: "AlertTriangle" }),
              filterInput("n_f_wait", "Waiting Type", "waitingType", {
                prefixIcon: "Clock",
                tooltip: "How long the patient has been waiting for first assessment",
              }),
              {
                id: "n_f_panel",
                type: "SelectInput",
                name: "Panel",
                props: {
                  label: "Panel",
                  field: "panel",
                  floatingLabel: true,
                  isClearable: true,
                  isSearchable: true,
                  placeholder: "Select panel",
                  optionsSource: "static",
                  options: [
                    { value: "Cash", label: "Cash" },
                    { value: "CGHS", label: "CGHS" },
                    { value: "ECHS", label: "ECHS" },
                    { value: "Star Health", label: "Star Health" },
                  ],
                },
              },
              {
                id: "n_f_status",
                type: "SelectInput",
                name: "Status",
                props: {
                  label: "Status",
                  field: "status",
                  floatingLabel: true,
                  isClearable: true,
                  isSearchable: true,
                  placeholder: "Select status",
                  optionsSource: "static",
                  options: [
                    { value: "Currently Admitted", label: "Currently Admitted" },
                    { value: "Released Patient", label: "Released Patient" },
                    { value: "Released For Ipd", label: "Released For Ipd" },
                    { value: "Shifted To Ipd", label: "Shifted To Ipd" },
                  ],
                },
              },
              {
                id: "n_f_from",
                type: "DatePicker",
                name: "From Date",
                props: { label: "From Date", field: "fromDate", floatingLabel: true, showButton: true },
              },
              {
                id: "n_f_to",
                type: "DatePicker",
                name: "To Date",
                props: { label: "To Date", field: "toDate", floatingLabel: true, showButton: true },
              },
            ],
          },
          {
            id: "n_filteractions",
            type: "Row",
            name: "Filter actions",
            props: { direction: "row", gap: 8, justify: "flex-end", align: "center", padding: 0, wrap: true },
            children: [
              {
                id: "n_btn_search",
                type: "ButtonControl",
                name: "Search button",
                props: { text: "Search", variant: "success", size: "sm", extraClass: "px-3", faIcon: "fa fa-search" },
                events: {
                  onClick: [
                    { type: "refresh", sourceId: "ds_patients" },
                    { type: "refresh", sourceId: "ds_kpi" },
                  ],
                },
              },
              {
                id: "n_btn_reset",
                type: "ButtonControl",
                name: "Reset button",
                props: { text: "Reset", variant: "outline-secondary", size: "sm", extraClass: "px-3", faIcon: "fa fa-redo" },
                events: {
                  onClick: [
                    { type: "resetForm" },
                    { type: "setVar", field: "statusFilter", value: "" },
                    { type: "refresh", sourceId: "ds_patients" },
                  ],
                },
              },
            ],
          },
        ],
      },

      /* 4 — tabs with live count badges --------------------------------- */
      {
        id: "n_tabs",
        type: "Tabs",
        name: "Status tabs",
        props: { variant: "underline", align: "left", stretch: false },
        events: {
          onTabChange: [
            { type: "setVar", field: "statusFilter", value: "{{value}}" },
            { type: "refresh", sourceId: "ds_patients" },
          ],
        },
        children: [
          {
            id: "n_tab_all",
            type: "TabPane",
            name: "ALLPATIENTS",
            props: { label: "ALLPATIENTS", value: "", count: "{{rows.ds_kpi.0.TotalPatients}}", icon: "Users" },
            children: [
              /* 5 + 6 — result grid and the closable detail panel --------- */
              {
                id: "n_split",
                type: "SplitView",
                name: "Grid + detail",
                props: {
                  leftWidth: 60,
                  gap: 14,
                  detailClosable: true,
                  detailOpenByDefault: true,
                  detailTitle: "Patient Detail",
                  stackOn: "tablet",
                },
                children: [
                  {
                    id: "n_split_left",
                    type: "Container",
                    name: "List Pane",
                    props: { direction: "column", gap: 10, padding: 0 },
                    children: [
                      {
                        id: "n_grid",
                        type: "DataTable",
                        name: "Result grid",
                        binding: { sourceId: "ds_patients", path: "", fieldMap: {} },
                        props: {
                          title: "Emergency Patients",
                          dataSourceId: "ds_patients",
                          viewMode: "table",
                          showViewToggle: true,
                          paginate: true,
                          pageSize: 8,
                          sortable: true,
                          selectable: true,
                          stickyHeader: true,
                          resizable: true,
                          zebra: false,
                          headerColor: "#1d4ed8",
                          maxHeight: 420,
                          rowHeight: 40,
                          emptyText: "No emergency patients for these filters",
                          columns: [
                            { key: "UHID", header: "UHID", type: "text", width: 110, align: "left", sortable: true, visible: true },
                            { key: "PatientName", header: "Patient Name", type: "text", width: 170, align: "left", sortable: true, visible: true },
                            { key: "EmergencyNo", header: "Emergency No", type: "text", width: 120, align: "left", sortable: true, visible: true },
                            {
                              key: "TriagingCode",
                              header: "Triaging Code",
                              type: "chip",
                              width: 130,
                              align: "left",
                              sortable: true,
                              visible: true,
                              chipRules: TRIAGE_RULES,
                            },
                            { key: "Bed", header: "Bed", type: "text", width: 80, align: "center", sortable: true, visible: true },
                            { key: "InDateTime", header: "In Datetime", type: "datetime", width: 150, align: "left", sortable: true, visible: true },
                            {
                              key: "Status",
                              header: "Status",
                              type: "chip",
                              width: 160,
                              align: "left",
                              sortable: true,
                              visible: true,
                              chipRules: STATUS_RULES,
                            },
                          ],
                          cardConfig: {
                            titleField: "PatientName",
                            subtitleField: "UHID",
                            statusField: "Status",
                            icon: "User",
                            bodyFields: ["EmergencyNo", "TriagingCode", "Bed", "InDateTime"],
                            columns: 2,
                          },
                        },
                        rules: {
                          visibility: [],
                          color: [{ field: "TriagingCode", op: "eq", value: "Urgent", target: "row", bg: "#FEFCE8", fg: "" }],
                        },
                        events: {
                          onRowClick: [
                            { type: "setVar", field: "selected", value: "{{row}}" },
                            { type: "openPanel", target: "n_split" },
                          ],
                        },
                      },
                    ],
                  },

                  {
                    id: "n_split_right",
                    type: "Container",
                    name: "Detail Pane",
                    props: { direction: "column", gap: 12, padding: 0 },
                    children: [
                      {
                        id: "n_pt_head",
                        type: "Row",
                        name: "Patient header",
                        props: { direction: "row", gap: 12, align: "center", justify: "flex-start", padding: 0, wrap: false },
                        children: [
                          {
                            id: "n_pt_avatar",
                            type: "Avatar",
                            name: "Avatar",
                            props: { name: "{{vars.selected.PatientName}}", size: 46, shape: "circle", color: "#2563eb" },
                          },
                          {
                            id: "n_pt_ident",
                            type: "Column",
                            name: "Identity",
                            props: { direction: "column", gap: 4, padding: 0, grow: 1 },
                            children: [
                              {
                                id: "n_pt_namerow",
                                type: "Row",
                                name: "Name row",
                                props: { direction: "row", gap: 8, align: "center", padding: 0, wrap: true },
                                children: [
                                  {
                                    id: "n_pt_name",
                                    type: "Heading",
                                    name: "Patient name",
                                    props: { text: "{{vars.selected.PatientName}}", level: "h3", size: 16, weight: 700, align: "left" },
                                  },
                                  {
                                    id: "n_pt_urgency",
                                    type: "Chip",
                                    name: "Urgency tag",
                                    props: { text: "{{vars.selected.TriagingCode}}", bg: "#FDE047", fg: "#713F12", size: "sm", variant: "solid", icon: "Siren" },
                                    rules: {
                                      visibility: [],
                                      color: [
                                        { field: "vars.selected.TriagingCode", op: "eq", value: "Urgent", target: "chip", bg: "#FDE047", fg: "#713F12" },
                                        { field: "vars.selected.TriagingCode", op: "eq", value: "Normal", target: "chip", bg: "#DCFCE7", fg: "#15803D" },
                                      ],
                                    },
                                  },
                                ],
                              },
                              {
                                id: "n_pt_meta",
                                type: "Row",
                                name: "Identifiers",
                                props: { direction: "row", gap: 14, align: "center", padding: 0, wrap: true },
                                children: [
                                  { id: "n_pt_uhid", type: "TextBlock", name: "UHID", props: { label: "UHID", value: "{{vars.selected.UHID}}", layout: "inline" } },
                                  { id: "n_pt_emg", type: "TextBlock", name: "Emergency No", props: { label: "Emergency No", value: "{{vars.selected.EmergencyNo}}", layout: "inline" } },
                                  { id: "n_pt_age", type: "TextBlock", name: "Age", props: { label: "Age", value: "{{vars.selected.Age}}", layout: "inline" } },
                                  { id: "n_pt_sex", type: "TextBlock", name: "Sex", props: { label: "Sex", value: "{{vars.selected.Sex}}", layout: "inline" } },
                                  { id: "n_pt_contact", type: "TextBlock", name: "Contact", props: { label: "Contact", value: "{{vars.selected.Contact}}", layout: "inline" } },
                                ],
                              },
                            ],
                          },
                        ],
                      },

                      {
                        id: "n_tiles",
                        type: "GridLayout",
                        name: "Info tiles",
                        props: { autoFit: true, minColWidth: 150, gap: 10, padding: 0 },
                        children: [
                          detailTile("n_tile_bed", "Bed", "{{vars.selected.Bed}}", "BedDouble", "#2563eb"),
                          detailTile("n_tile_in", "In Datetime", "{{vars.selected.InDateTime}}", "Clock", "#0ea5e9"),
                          detailTile("n_tile_doc", "Doctor", "{{vars.selected.Doctor}}", "Stethoscope", "#16a34a"),
                          detailTile("n_tile_status", "Status", "{{vars.selected.Status}}", "Activity", "#7C3AED", [
                            { field: "vars.selected.Status", op: "eq", value: "Currently Admitted", target: "text", fg: "#7C3AED", bg: "" },
                            { field: "vars.selected.Status", op: "eq", value: "Released Patient", target: "text", fg: "#15803D", bg: "" },
                            { field: "vars.selected.Status", op: "eq", value: "Shifted To Ipd", target: "text", fg: "#C2410C", bg: "" },
                            { field: "vars.selected.Status", op: "eq", value: "Released For Ipd", target: "text", fg: "#1D4ED8", bg: "" },
                          ]),
                        ],
                      },

                      {
                        id: "n_vitals",
                        type: "GridLayout",
                        name: "Vitals",
                        props: { autoFit: true, minColWidth: 130, gap: 10, padding: 0 },
                        children: [
                          vital("n_v_bp", "BP", "{{vars.selected.BP}}", "mmHg", "90/60 – 120/80", "HeartPulse", "#e11d48"),
                          vital("n_v_pulse", "Pulse", "{{vars.selected.Pulse}}", "bpm", "60 – 100", "Activity", "#f59e0b"),
                          vital("n_v_spo2", "SpO2", "{{vars.selected.SpO2}}", "%", "95 – 100", "Wind", "#0ea5e9"),
                          vital("n_v_temp", "Temp", "{{vars.selected.Temp}}", "°F", "97 – 99", "Thermometer", "#7c3aed"),
                        ],
                      },

                      {
                        id: "n_complaint",
                        type: "TextBlock",
                        name: "Complaint",
                        props: { label: "Complaint", value: "{{vars.selected.Complaint}}", layout: "stacked" },
                      },
                      {
                        id: "n_panelname",
                        type: "TextBlock",
                        name: "Panel",
                        props: { label: "Panel", value: "{{vars.selected.Panel}}", layout: "stacked" },
                      },

                      {
                        id: "n_actions",
                        type: "ActionGrid",
                        name: "Patient actions",
                        props: {
                          columns: 4,
                          maxVisible: 10,
                          moreLabel: "MORE",
                          accent: "#2563eb",
                          compact: false,
                          actions: [
                            { label: "Vital Graph", icon: "LineChart", color: "#2563eb" },
                            { label: "Capture Vitals", icon: "HeartPulse", color: "#e11d48" },
                            { label: "Lab Results", icon: "FlaskConical", color: "#0ea5e9" },
                            { label: "Labs", icon: "Syringe", color: "#7c3aed" },
                            { label: "Meds", icon: "Pill", color: "#16a34a" },
                            { label: "Flowsheets", icon: "ClipboardList", color: "#f59e0b" },
                            { label: "Remarks", icon: "MessageSquare", color: "#0891b2" },
                            { label: "Waiting Type", icon: "Clock", color: "#64748b" },
                            { label: "Medicine Issue", icon: "Pill", color: "#15803d" },
                            { label: "Release For Ipd", icon: "LogOut", color: "#1d4ed8" },
                            { label: "Discharge", icon: "UserCheck", color: "#334155" },
                            { label: "Print Case Sheet", icon: "Printer", color: "#334155" },
                          ],
                        },
                        responsive: { tablet: { props: { columns: 3 } }, mobile: { props: { columns: 2, compact: true } } },
                        events: {
                          onClick: [{ type: "toast", message: "{{action.label}} — coming from the action grid", variant: "info" }],
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },

          {
            id: "n_tab_admitted",
            type: "TabPane",
            name: "Currently Admitted",
            props: { label: "Currently Admitted", value: "Currently Admitted", count: "{{rows.ds_kpi.0.CurrentlyAdmitted}}" },
            children: [
              {
                id: "n_grid_admitted",
                type: "DataTable",
                name: "Admitted grid",
                binding: { sourceId: "ds_patients", path: "", fieldMap: {} },
                props: {
                  dataSourceId: "ds_patients",
                  viewMode: "card",
                  showViewToggle: true,
                  pageSize: 6,
                  headerColor: "#7C3AED",
                  columns: [
                    { key: "UHID", header: "UHID", type: "text", width: 110, visible: true, sortable: true },
                    { key: "PatientName", header: "Patient Name", type: "text", width: 170, visible: true, sortable: true },
                    { key: "Bed", header: "Bed", type: "text", width: 80, visible: true, sortable: true },
                    { key: "Status", header: "Status", type: "chip", width: 160, visible: true, sortable: true, chipRules: STATUS_RULES },
                  ],
                  cardConfig: {
                    titleField: "PatientName",
                    subtitleField: "UHID",
                    statusField: "Status",
                    icon: "BedDouble",
                    bodyFields: ["Bed", "Doctor"],
                    columns: 3,
                  },
                },
              },
            ],
          },
          {
            id: "n_tab_released",
            type: "TabPane",
            name: "Released Patient",
            props: { label: "Released Patient", value: "Released Patient", count: "{{rows.ds_kpi.0.ReleasedPatient}}" },
            children: [
              {
                id: "n_grid_released",
                type: "DataTable",
                name: "Released grid",
                binding: { sourceId: "ds_patients", path: "", fieldMap: {} },
                props: {
                  dataSourceId: "ds_patients",
                  viewMode: "table",
                  pageSize: 8,
                  headerColor: "#15803D",
                  columns: [
                    { key: "UHID", header: "UHID", type: "text", width: 110, visible: true, sortable: true },
                    { key: "PatientName", header: "Patient Name", type: "text", width: 170, visible: true, sortable: true },
                    { key: "InDateTime", header: "In Datetime", type: "datetime", width: 150, visible: true, sortable: true },
                    { key: "Status", header: "Status", type: "chip", width: 160, visible: true, sortable: true, chipRules: STATUS_RULES },
                  ],
                },
              },
            ],
          },
          {
            id: "n_tab_relipd",
            type: "TabPane",
            name: "Released For Ipd",
            props: { label: "Released For Ipd", value: "Released For Ipd", count: "{{rows.ds_kpi.0.ReleasedForIpd}}" },
            children: [
              {
                id: "n_grid_relipd",
                type: "DataTable",
                name: "Released for IPD grid",
                binding: { sourceId: "ds_patients", path: "", fieldMap: {} },
                props: {
                  dataSourceId: "ds_patients",
                  viewMode: "table",
                  pageSize: 8,
                  headerColor: "#1D4ED8",
                  columns: [
                    { key: "UHID", header: "UHID", type: "text", width: 110, visible: true, sortable: true },
                    { key: "PatientName", header: "Patient Name", type: "text", width: 170, visible: true, sortable: true },
                    { key: "Doctor", header: "Doctor", type: "text", width: 150, visible: true, sortable: true },
                    { key: "Status", header: "Status", type: "chip", width: 160, visible: true, sortable: true, chipRules: STATUS_RULES },
                  ],
                },
              },
            ],
          },
          {
            id: "n_tab_shifted",
            type: "TabPane",
            name: "Shifted To Ipd",
            props: { label: "Shifted To Ipd", value: "Shifted To Ipd", count: "{{rows.ds_kpi.0.ShiftedToIpd}}" },
            children: [
              {
                id: "n_grid_shifted",
                type: "DataTable",
                name: "Shifted grid",
                binding: { sourceId: "ds_patients", path: "", fieldMap: {} },
                props: {
                  dataSourceId: "ds_patients",
                  viewMode: "table",
                  pageSize: 8,
                  headerColor: "#C2410C",
                  columns: [
                    { key: "UHID", header: "UHID", type: "text", width: 110, visible: true, sortable: true },
                    { key: "PatientName", header: "Patient Name", type: "text", width: 170, visible: true, sortable: true },
                    { key: "Bed", header: "Bed", type: "text", width: 90, visible: true, sortable: true },
                    { key: "Status", header: "Status", type: "chip", width: 160, visible: true, sortable: true, chipRules: STATUS_RULES },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  },
};

/** Templates shipped with the builder (seeded into the library on first run). */
export const BUILT_IN_TEMPLATES = [
  {
    ...EMERGENCY_SCREEN,
    id: "tpl_emergency_patient_search",
    name: "Emergency Patient Search",
    status: "template",
  },
];

export default EMERGENCY_SCREEN;
