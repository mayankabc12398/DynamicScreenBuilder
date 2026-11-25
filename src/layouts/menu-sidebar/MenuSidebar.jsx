import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, useNavigate } from "react-router-dom";
import MenuItem from "@app/layouts/menu-sidebar/MenuItem.jsx";
import { Image } from "@profabric/react-components";
import styled from "styled-components";
import i18n from "@app/utils/i18n";
import ReactSelectHead from "../../components/formComponent/ReactSelectHead";
import logo from "@app/assets/image/logo.png";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import { broadcastSessionChange } from "../../utils/tabSync";
import { useTranslation } from "react-i18next";
import DesktopMenuItem from "./DesktopMenuItem";
import { GetBindMenu } from "../../store/reducers/common/CommonExportFunction";
import { updateClaims } from "../../networkServices/HeaderApi";
import Input from "../../components/formComponent/Input";
import { NEWHR_MENU_LABELS } from "@app/pages/newHr/menuLabels";
import { EMPLOYEE_ROUTES, isPrivilegedUser } from "@app/pages/newHr/services/hrAccess";
// import { GetRoleListByEmployeeIDAndCentreID } from "../../store/reducers/common/getRoleListSlice";

// Register newHr labels before MENU is built so i18n.t resolves them proper-case;
// overwrite=false keeps any API-provided translation authoritative.
i18n.addResourceBundle("en", "translation", NEWHR_MENU_LABELS, true, false);

// HR nav gating (role-based): HR/Manager (defaultRole 6) sees every HR entry;
// an employee sees only the 6 self-service pages. Role comes from the login
// payload (localStorage) so gating is synchronous — no loading/fail-closed
// state. The backend enforces the same rule and scopes rows server-side.
const gateHrMenu = (categories) =>
  categories
    .map((category) => {
      const isHrGroup = (category.children || []).some((c) => String(c.url || "").startsWith("/hr/"));
      if (!isHrGroup) return category;
      if (isPrivilegedUser()) return category; // HR/Manager — all HR entries
      const children = (category.children || []).filter((c) =>
        EMPLOYEE_ROUTES.includes(String(c.url || "").toLowerCase())
      );
      return children.length > 0 ? { ...category, children } : null;
    })
    .filter(Boolean);

const Version = import.meta.env.VITE_APP_VERSION;

export const MENU = {
  commonComponent: [
    {
      menuName: i18n.t("Dashboard"),
      icon: "fas fa-tachometer-alt nav-icon",
      children: [
        {
          childrenName: i18n.t("Dashboard"),
          icon: "fas fa-regular fa-user",
          url: "/dashboard",
          breadcrumb: "Dashboard",
          actualUrl: "/dashboard",
        },
      ],
    },
    // Payroll (Legacy) — GNRSH Web Forms payroll migrated onto the frozen
    // pay_* schema (PayrollController). Static group (no DB menu seed);
    // /hr/ children make gateHrMenu restrict it to HR/Manager role.
    // Items are added here as each migrated page lands.

    // {
    //   menuName: i18n.t("Payroll (Legacy)"),
    //   icon: "fas fa-money-check-alt nav-icon",
    //   children: [
    //     {
    //       childrenName: i18n.t("Remuneration Master"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/legacy-payroll/remuneration-master",
    //       breadcrumb: "HR / Payroll (Legacy) / Remuneration Master",
    //       actualUrl: "/hr/legacy-payroll/remuneration-master",
    //     },
    //     {
    //       childrenName: i18n.t("Formula Master"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/legacy-payroll/formula-master",
    //       breadcrumb: "HR / Payroll (Legacy) / Formula Master",
    //       actualUrl: "/hr/legacy-payroll/formula-master",
    //     },
    //     {
    //       childrenName: i18n.t("Finance Salary"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/legacy-payroll/finance-salary",
    //       breadcrumb: "HR / Payroll (Legacy) / Finance Salary",
    //       actualUrl: "/hr/legacy-payroll/finance-salary",
    //     },
    //     {
    //       childrenName: i18n.t("Monthwise Remuneration"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/legacy-payroll/monthwise-remuneration",
    //       breadcrumb: "HR / Payroll (Legacy) / Monthwise Remuneration",
    //       actualUrl: "/hr/legacy-payroll/monthwise-remuneration",
    //     },
    //     {
    //       childrenName: i18n.t("Calculate Salary (Legacy)"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/legacy-payroll/salary-process",
    //       breadcrumb: "HR / Payroll (Legacy) / Calculate Salary",
    //       actualUrl: "/hr/legacy-payroll/salary-process",
    //     },
    //     {
    //       childrenName: i18n.t("Salary Slip Print"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/legacy-payroll/salary-slip-print",
    //       breadcrumb: "HR / Payroll (Legacy) / Salary Slip Print",
    //       actualUrl: "/hr/legacy-payroll/salary-slip-print",
    //     },
    //     {
    //       childrenName: i18n.t("P9 Report"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/legacy-payroll/p9-report",
    //       breadcrumb: "HR / Payroll (Legacy) / P9 Report",
    //       actualUrl: "/hr/legacy-payroll/p9-report",
    //     },
    //     {
    //       childrenName: i18n.t("Statutory Reports"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/legacy-payroll/statutory-reports",
    //       breadcrumb: "HR / Payroll (Legacy) / Statutory Reports",
    //       actualUrl: "/hr/legacy-payroll/statutory-reports",
    //     },
    //   ],
    // },
    //   {
    //   menuName: i18n.t("HR Administration"),
    //   icon: "fas fa-sitemap nav-icon",
    //   children: [
    //     {
    //       childrenName: i18n.t("Print / Template Designer"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/print-designer",
    //       breadcrumb: "HR / Administration / Print / Template Designer",
    //       actualUrl: "/hr/print-designer",
    //     },
    //   ],
    // },

    // HR Administration — configuration screens that have no DB menu seed yet.
    // Static group, same arrangement as Payroll (Legacy) above: the /hr/ children
    // make gateHrMenu restrict the whole group to HR/Manager, and each page is
    // additionally gated on its own page.*.view permission.
    // Remove an entry from here once sp_GetMenuByRole seeds it, or it shows twice.
  

    // Finance > Tools opening-balance screens — static group (no DB menu seed).
    // Remove once the sp_GetMenuByRole seed (DBScripts/Finance/opening_balance_menu.sql)
    // is applied, or entries will show twice.

    
    // "Help -> What's New / Release Update" is served by the API-driven menu
    // (GetBindMenu -> sp_GetMenuByRole). Seed it via Sql/releaseupdate_menu_seed.sql.
    // {
    //   menuName: i18n.t("HR"),
    //   icon: "fas fa-users-cog nav-icon",
    //   // Ordered to follow the HR lifecycle: overview -> setup -> hiring ->
    //   // joining -> daily operations -> talent -> exit -> payroll -> reports.
    //   children: [
    //     {
    //       childrenName: i18n.t("HR Dashboard"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/dashboard",
    //       breadcrumb: "HR / Dashboard",
    //       actualUrl: "/hr/dashboard",
    //     },
    //     {
    //       childrenName: i18n.t("Master Setup"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/masters",
    //       breadcrumb: "HR / Master Setup",
    //       actualUrl: "/hr/masters",
    //     },
    //     {
    //       childrenName: i18n.t("Clearance Config"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/clearance-config",
    //       breadcrumb: "HR / Clearance Config",
    //       actualUrl: "/hr/clearance-config",
    //     },
    //     {
    //       childrenName: i18n.t("Audit Log"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/audit-log",
    //       breadcrumb: "HR / Audit Log",
    //       actualUrl: "/hr/audit-log",
    //     },
    //     {
    //       childrenName: i18n.t("Recruitment"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/recruitment",
    //       breadcrumb: "HR / Recruitment",
    //       actualUrl: "/hr/recruitment",
    //     },
    //     {
    //       childrenName: i18n.t("Onboarding Center"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/onboarding",
    //       breadcrumb: "HR / Onboarding Center",
    //       actualUrl: "/hr/onboarding",
    //     },
    //     {
    //       childrenName: i18n.t("Employee Management"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/employees",
    //       breadcrumb: "HR / Employee Management",
    //       actualUrl: "/hr/employees",
    //     },
    //     {
    //       childrenName: i18n.t("Attendance & OT"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/attendance",
    //       breadcrumb: "HR / Attendance & OT",
    //       actualUrl: "/hr/attendance",
    //     },
    //     {
    //       childrenName: i18n.t("Duty Roster"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/duty-roster",
    //       breadcrumb: "HR / Duty Roster",
    //       actualUrl: "/hr/duty-roster",
    //     },
    //     {
    //       childrenName: i18n.t("Leave Management"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/leave",
    //       breadcrumb: "HR / Leave Management",
    //       actualUrl: "/hr/leave",
    //     },
    //     {
    //       childrenName: i18n.t("Leave Approvals"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/leave-approvals",
    //       breadcrumb: "HR / Leave Approvals",
    //       actualUrl: "/hr/leave-approvals",
    //     },
    //     {
    //       childrenName: i18n.t("Locum Management"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/locum",
    //       breadcrumb: "HR / Locum Management",
    //       actualUrl: "/hr/locum",
    //     },
    //     {
    //       childrenName: i18n.t("Approval Center"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/approvals",
    //       breadcrumb: "HR / Approval Center",
    //       actualUrl: "/hr/approvals",
    //     },
    //     {
    //       childrenName: i18n.t("Performance"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/performance",
    //       breadcrumb: "HR / Performance",
    //       actualUrl: "/hr/performance",
    //     },
    //     {
    //       childrenName: i18n.t("Documents Center"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/documents",
    //       breadcrumb: "HR / Documents Center",
    //       actualUrl: "/hr/documents",
    //     },
    //     {
    //       childrenName: i18n.t("Employee Actions"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/actions",
    //       breadcrumb: "HR / Employee Actions",
    //       actualUrl: "/hr/actions",
    //     },
    //     {
    //       childrenName: i18n.t("Employee Lifecycle"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/lifecycle",
    //       breadcrumb: "HR / Employee Lifecycle",
    //       actualUrl: "/hr/lifecycle",
    //     },
    //     {
    //       childrenName: i18n.t("Payroll & Salary"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/payroll",
    //       breadcrumb: "HR / Payroll & Salary",
    //       actualUrl: "/hr/payroll",
    //     },
    //     {
    //       childrenName: i18n.t("Employee Reports"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/reports/employees",
    //       breadcrumb: "HR / Employee Reports",
    //       actualUrl: "/hr/reports/employees",
    //     },
    //     {
    //       childrenName: i18n.t("Recruitment Reports"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/reports/recruitment",
    //       breadcrumb: "HR / Recruitment Reports",
    //       actualUrl: "/hr/reports/recruitment",
    //     },
    //     {
    //       childrenName: i18n.t("Payroll Reports"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/reports/payroll",
    //       breadcrumb: "HR / Payroll Reports",
    //       actualUrl: "/hr/reports/payroll",
    //     },
    //     // Payroll extension (Build C) — placed after the Reports entries per the
    //     // module spec ("after the existing Reports item"), in dependency order.
    //     {
    //       childrenName: i18n.t("Remuneration Master"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/payroll/components",
    //       breadcrumb: "HR / Remuneration Master",
    //       actualUrl: "/hr/payroll/components",
    //     },
    //     {
    //       childrenName: i18n.t("Formula Master"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/payroll/formulas",
    //       breadcrumb: "HR / Formula Master",
    //       actualUrl: "/hr/payroll/formulas",
    //     },
    //     {
    //       childrenName: i18n.t("Upload Employee Remuneration"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/payroll/remuneration-upload",
    //       breadcrumb: "HR / Upload Employee Remuneration",
    //       actualUrl: "/hr/payroll/remuneration-upload",
    //     },
    //     {
    //       childrenName: i18n.t("View Employee Remuneration"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/payroll/remuneration",
    //       breadcrumb: "HR / View Employee Remuneration",
    //       actualUrl: "/hr/payroll/remuneration",
    //     },
    //     {
    //       childrenName: i18n.t("Calculate Salary"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/payroll/calculate",
    //       breadcrumb: "HR / Calculate Salary",
    //       actualUrl: "/hr/payroll/calculate",
    //     },
    //     {
    //       childrenName: i18n.t("Salary Slip"),
    //       icon: "fas fa-regular fa-user",
    //       url: "/hr/payroll/slips",
    //       breadcrumb: "HR / Salary Slip",
    //       actualUrl: "/hr/payroll/slips",
    //     },
    //   ],
    // },
  ],
  frontOffice: [
    {
      name: i18n.t("Registration"),
      icon: "fas fa-regular fa-users",
      children: [
        {
          name: i18n.t("Register_Modify"),
          icon: "fas fa-regular fa-user",
          path: "/DirectPatientReg",
          breadcrumb: "Registration / Register/ Modify",
        },
        {
          name: i18n.t("Patient_Black_List"),
          icon: "fas fa-regular fa-user",
          path: "/PatientBlackList",
          breadcrumb: "Registration / Patient Black List",
        },
      ],
    },

    {
      name: i18n.t("Sidebar.FrontOffice.OPD.OPD"),
      icon: "fas fa-regular fa-users",
      children: [
        {
          name: i18n.t("Sidebar.FrontOffice.OPD.OPD_servicebooking"),
          icon: "fas fa-regular fa-user",
          path: "/opd-servicebooking",
          breadcrumb: "OPD / OPD Service Booking",
        },
        {
          name: i18n.t("Sidebar.FrontOffice.OPD.Confirmation"),
          icon: "fas fa-regular fa-user",
          path: "/Confirmation",
          breadcrumb: "OPD / Confirmation",
        },
        // {
        //   name: i18n.t("Sidebar.FrontOffice.OPD.LabPackageInclude"),
        //   icon: "fas fa-regular fa-user",
        //   path: "/opd-lab-package-include",
        //   breadcrumb: "OPD / Lab Package Include",
        // },
        {
          name: i18n.t("Sidebar.FrontOffice.OPD.opd-setellment"),
          icon: "fas fa-regular fa-user",
          path: "/opd-setellment",
          breadcrumb: "OPD / OPD Setellment",
        },
        {
          name: i18n.t("Sidebar.FrontOffice.OPD.opd-refund"),
          icon: "fas fa-regular fa-user",
          path: "/opd-refund",
          breadcrumb: "OPD / OPD Refund",
        },
        {
          name: i18n.t("Sidebar.FrontOffice.OPD.opd-advance"),
          icon: "fas fa-regular fa-user",
          path: "/opd-advance",
          breadcrumb: "OPD / OPD Advance",
        },
        {
          name: i18n.t("Sidebar.FrontOffice.OPD.card-print"),
          icon: "fas fa-regular fa-user",
          path: "/card-print",
          breadcrumb: "OPD / Card Print",
        },
        {
          name: i18n.t("Sidebar.FrontOffice.OPD.Upload_View_Document"),
          icon: "fas fa-regular fa-user",
          path: "/Uploadpatientdocuments",
          breadcrumb: "OPD / Upload View Document",
        },
      ],
    },

    {
      name: i18n.t("Sidebar.FrontOffice.Reprint.Reprint"),
      icon: "fas fa-regular fa-receipt",
      children: [
        {
          name: i18n.t("Sidebar.FrontOffice.Reprint.Receipt-Re-Print"),
          icon: "fas fa-regular fa-receipt",
          path: "/ReceiptReprint",
          breadcrumb: "OPD / Receipt Re-Print",
        },
      ],
    },
    {
      name: i18n.t("Tools"),
      icon: "fas fa-regular fa-receipt",
      children: [
        {
          // name: i18n.t('Sidebar.FrontOffice.Reprint.Receipt-Re-Print'),
          name: "Debit Credit Note",
          icon: "fas fa-regular fa-receipt",
          path: "/DebitCreditNote",
          breadcrumb: "Tools / Debit Credit Note",
        },
        {
          name: "Debit Credit Note (Inventory)",
          icon: "fas fa-regular fa-receipt",
          path: "/DebitCreditNoteInventory",
          breadcrumb: "Tools / Debit Credit Note Inventory",
        },
        {
          name: "Outstanding Approval",
          icon: "fas fa-regular fa-receipt",
          path: "/out-standing-approval",
          breadcrumb: "Tools / Outstanding Approval",

        },
        {
          // name: i18n.t('Sidebar.FrontOffice.Reprint.Receipt-Re-Print'),
          name: "Expence Voucher",
          icon: "fas fa-regular fa-receipt",
          path: "/expense-voucher",
          breadcrumb: "Tools / Expence Voucher",
        },
      ],
    },
    {
      name: "Reports",
      icon: "fas fa-regular fa-receipt",
      children: [
        {
          name: "Daily Collection",
          icon: "fas fa-regular fa-receipt",
          path: "/collection-report",
          breadcrumb: "Reports / Daily Collection",
        },
        {
          name: "Registration Detail",
          icon: "fas fa-regular fa-receipt",
          path: "/registration-report",
          breadcrumb: "Reports / Registration Detail",
        },
        {
          name: "OPD Balance/Advance Detail",
          icon: "fas fa-regular fa-receipt",
          path: "/opd-balance-advance-detail",
          breadcrumb: "Reports / OPD Balance/Advance Detail",
        },
        {
          name: "Refund Detail",
          icon: "fas fa-regular fa-receipt",
          path: "/refund-details",
          breadcrumb: "Refund Detail",
        },
        {
          name: "Patient Vise Search",
          icon: "fas fa-regular fa-receipt",
          path: "/patient-vise-search",
          breadcrumb: "Reports / Patient Vise Search",
        },
        {
          name: "OPD-Bill Register Report",
          icon: "fas fa-regular fa-receipt",
          path: "/opd-billregisterreport",
          breadcrumb: "Reports / OPD_Bill Register Report",
        },
      ],
    },
  ],
  helpDesk: [
    {
      name: "Help Desk",
      icon: "fas fa-tachometer-alt nav-icon",
      children: [
        {
          name: "Panel Detail",
          icon: "fas fa-regular fa-user",
          path: "/panel-detail",
          breadcrumb: "Help Desk / Panel Detail",
        },
        {
          name: "Doctor Timing",
          icon: "fas fa-regular fa-user",
          path: "/doctortiming",
          breadcrumb: "Help Desk / Doctor Timing",
        },
        {
          name: "OPD Package Detail",
          icon: "fas fa-regular fa-user",
          path: "/package-detail-opd",
          breadcrumb: "Help Desk / Doctor Timing",
        },
        {
          name: "Help Desk-IPD",
          icon: "fas fa-regular fa-user",
          path: "/help-deskipd",
          breadcrumb: "Help Desk / Help Desk-IPD",
        },
      ],
    },
    {
      name: " Estimate Billing ",
      icon: "fas fa-tachometer-alt nav-icon",
      children: [
        {
          name: "Surgery Estimate",
          icon: "fas fa-regular fa-user",
          path: "/cost-estimation-billing",
          breadcrumb: "Help Desk / Cost Estimation Billing",
        },
        {
          name: "Cost Estimation Re-print",
          icon: "fas fa-regular fa-user",
          path: "/cost-estimation-reprint",
          breadcrumb: "Help Desk / Cost Estimation Re-print",
        },
      ],
    },
  ],
  TokenManagement: [
    {
      name: "Token Management",
      icon: "fas fa-tachometer-alt nav-icon",
      children: [
        {
          name: "Exam Counter Master-----",
          icon: "fas fa-regular fa-user",
          path: "/exam-counter-master",
          breadcrumb: "Token Management / Exam Counter Master",
        },
        {
          name: "Reciept Token Master",
          icon: "fas fa-regular fa-user",
          path: "/token-generation-master",
          breadcrumb: "Token Management / Reciept Token Master",
        },

        {
          name: "Modality Master",
          icon: "fas fa-regular fa-user",
          path: "/modality-master",
          breadcrumb: "Token Management / Modality Master",
        },
        {
          name: "online Inv Slot Master",
          icon: "fas fa-regular fa-user",
          path: "/online-inv-slot-master",
          breadcrumb: "Token Management / Investigation Time Slot Master",
        },
        {
          name: "Sample Coll Room Master",
          icon: "fas fa-regular fa-user",
          path: "/samplecollroommaster",
          breadcrumb: "Token Management / Sample Collection Room Master",
        },
      ],
    },
  ],
  examinationRoom: [
    {
      name: "OPD",
      icon: "fas fa-tachometer-alt nav-icon",
      children: [
        {
          name: "Examination Room",
          icon: "fas fa-regular fa-user",
          path: "/vital-sign",
          breadcrumb: "Examination Room / OPD / Examination Room",
        },
      ],
    },
    {
      name: "Frame menu",
      icon: "fas fa-tachometer-alt nav-icon",
      children: [
        {
          name: "Vital Sign",
          icon: "fas fa-regular fa-user",
          path: "/vital-sign",
          breadcrumb: "Examination Room / Frame menu / Vital Examination ",
        },
        {
          name: "CPOE Folder",
          icon: "fas fa-regular fa-user",
          path: "/cpoe-folder",
          breadcrumb: "Examination Room / OPD / CPOE Folder",
        },
      ],
    },
    {
      name: "Reports",
      icon: "fas fa-tachometer-alt nav-icon",
      children: [
        {
          name: "Doctor Wise App Summary",
          icon: "fas fa-regular fa-user",
          path: "/doctorwiseappsummary",
          breadcrumb: "Examination Room / Doctor Wise App Summary",
        },
        {
          name: "Doctor Wise App Details",
          icon: "fas fa-regular fa-user",
          path: "/doctorwiseappdetails",
          breadcrumb: "Examination Room / Reports / Doctor Wise App Details",
        },
      ],
    },

  ],
  Billng: [
    {
      name: "IPD",
      icon: "fas fa-tachometer-alt nav-icon",
      children: [
        {
          name: "IPDAdmissionNew",
          icon: "fas fa-regular fa-user",
          path: "/IPDAdmissionNew",
          breadcrumb: "Billing / IPD / IPDAdmissionNew",
        },
      ],
    },



  ],
};

const StyledBrandImage = styled(Image)`
  float: left;
  line-height: 0.8;
  margin: -1px 8px 0 6px;
  opacity: 0.8;
  --pf-box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19),
    0 6px 6px rgba(0, 0, 0, 0.23) !important;
`;

const StyledUserImage = styled(Image)`
  --pf-box-shadow: 0 3px 6px #00000029, 0 3px 6px #0000003b !important;
`;

const MenuSidebar = () => {
  const [t] = useTranslation();
  const localData = useLocalStorage("userData", "get"); // get Data from localStorage
  const dispatch = useDispatch();
  const sidebarSkin = useSelector((state) => state.ui.sidebarSkin);
  const menuItemFlat = useSelector((state) => state.ui.menuItemFlat);
  const menuChildIndent = useSelector((state) => state.ui.menuChildIndent);
  const screenSize = useSelector((state) => state.ui.screenSize);
  const { GetMenuList, GetRoleList } = useSelector(
    (state) => state.CommonSlice
  );
  const [query, setQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  const navigate = useNavigate()
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setQuery(value);
    if (value) {
      const filtered = gateHrMenu([...MENU["commonComponent"], ...GetMenuList])
        .map((category) => {
          const filteredChildren = category.children.filter((child) =>
            child.childrenName.toLowerCase().includes(value)
          );

          if (filteredChildren.length > 0) {
            return {
              ...category,
              children: filteredChildren,
            };
          }
          return null;
        })
        .filter((category) => category !== null);

      setFilteredData(filtered);
    } else {
      setFilteredData([...MENU["commonComponent"], ...GetMenuList]);
    }
  };

  const handleUpdateClaims = async (roleID, centreID) => {
    const data = await updateClaims(String(roleID), String(centreID));

    if (data?.success) {
      // useLocalStorage("userData", "set", data?.data?.loginResponse);
      useLocalStorage("token", "set", data?.data?.token);
      return data
    }
  };
  // role bind
  const handleChangeRole = async (e) => {
    const { value } = e;
    // useLocalStorage("userData", "set", { ...localData, defaultRole: value });
    try {
      let apiResp = await handleUpdateClaims(value, localData?.defaultCentre);
      await dispatch(
        GetBindMenu({
          RoleID: value,
        })
      );
      //  useLocalStorage("userData", "set", { ...localData, defaultRole: value });
      useLocalStorage("userData", "set", { ...localData, defaultRole: Number(value), deptLedgerNo: apiResp?.data?.loginResponse?.deptLedgerNo, roleName: apiResp?.data?.loginResponse?.roleName });
      if (apiResp?.success) broadcastSessionChange("ROLE_CHANGED");
      navigate("/dashboard", { state: { data: "", actualUrl: "/dashboard" } });
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };


  useEffect(() => {
    if (GetMenuList?.length > 0) {
      setFilteredData([...MENU["commonComponent"], ...GetMenuList]);
    }else{
      setFilteredData([...MENU["commonComponent"]]);
    }
  }, [GetMenuList]);


  return ["lg", "md"].includes(screenSize) ? (
    <DesktopMenuItem filteredData={filteredData} />
  ) : (
    <aside className={`main-sidebar sidebar_border ${sidebarSkin}`}>
      <Link to="#" className="brand-link">
        <StyledBrandImage
          className="logoStyle"
          src={logo}
          alt="AdminLTE Logo"
          width={33}
          height={30}
          rounded
        />
        <span className="brand-text font-weight-bold ml-3 mt-3">{t("HOSPEDIA V12")}</span>
      </Link>
      <div className="sidebar">
        <div className="row mobile-view-bind-role  bindrole">
          <div className="mx-2 headerboxsize">
            <Input
              type="text"
              className="form-control organization-name"
              readOnly={true}
              // removeFormGroupClass={false}
              placeholder={" "}
              // id={"a"}
              // lable={""}
              name="barcode"
              value={localData?.organizationName}
              respclass={"w-100"}
            />

          </div>
          <ReactSelectHead
            placeholderName="Select Role"
            dynamicOptions={GetRoleList?.map((ele) => {
              return {
                label: t(ele?.roleName),
                value: ele?.roleID,
              };
            })}
            searchable={true}
            respclass="col-12"
            value={Number(localData?.defaultRole)}
            handleChange={handleChangeRole}
          />
        </div>
        <div className="row bindrole">
          <div className="col-12">
            <input
              type="text"
              className="form-control search_Items"
              id="search"
              name="search"
              label=""
              value={query}
              onChange={handleSearch}
              placeholder={t("Search")}
              respclass="col-12"
            />
            <i className="fa fa-search search_icon" aria-hidden="true"></i>
          </div>
        </div>

        <nav className="mt-2">
          <ul
            className={`nav  nav-sidebar flex-column${menuItemFlat ? " nav-flat" : ""
              }${menuChildIndent ? " nav-child-indent" : ""}`}
            role="menu"
          >
            {filteredData?.map((menuItem) => (
              <MenuItem
                key={menuItem.name + menuItem.path}
                menuItem={menuItem}
                isSearched={Boolean(query)}
              />
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default MenuSidebar;
