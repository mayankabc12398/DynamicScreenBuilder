/**
 * Who may open a screen as an app page — opened from a screen card's Access
 * button in the library.
 *
 * Three steps, in the app's own page tables (HospediaAPI ScreenPageAccess):
 *   1. Module     — the menu the page sits under   (f_filemaster.MenuID)
 *   2. Roles      — several                        (f_file_role)
 *   3. Employees  — several, per picked role       (user_pageaccess)
 *
 * Nothing is written until Save; Save sends the complete lists and the server
 * switches off whatever was left out.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCheck,
  FolderTree,
  Loader2,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Tap from "./Tap";
import {
  bindRoleMasterList,
  getPageAccessMenus,
  getRoleEmployees,
  getScreenPageAccess,
  saveScreenPageAccess,
} from "@app/networkServices/screenBuilderApi";
import { initials, normRoles } from "../permission/shared";
import useSmoothClose from "./useSmoothClose";
import "./screenAccess.css";

/** The menu's own default (f_filemaster.ReactSubMenuIcon). */
const DEFAULT_ICON = "fas fa-tachometer-alt";

/**
 * Font Awesome solid icons for hospital pages, [name, search words]. Every name exists in the stylesheet the
 * app loads (admin-lte/plugins/fontawesome-free, Font Awesome 5.15.4). Medical ones first.
 */
const ICONS = [
  // Medical, health, pharmacy, lab and patient care (Font Awesome 5.15.4 categories)
  ["allergies", "allergy freckles hand hives pox skin"], ["ambulance", "ambulance emergency covid-19 emt er help hospital"],
  ["assistive-listening-systems", "amplify audio deaf ear headset hearing"], ["baby", "baby maternity child diaper doll human infant kid"],
  ["baby-carriage", "buggy carrier infant push stroller transportation"], ["bacterium", "antibiotic antibody covid-19 health organism sick"],
  ["band-aid", "bandage boo first aid ouch band-aid"], ["bath", "clean shower tub wash bath"],
  ["bed", "bed ipd admit lodging mattress rest sleep travel"], ["biohazard", "covid-19 danger dangerous hazmat medical radioactive"],
  ["blind", "cane disability person sight blind"], ["bone", "ortho bone calcium dog skeletal skeleton tibia"],
  ["book-medical", "diary documentation health history journal library"],
  ["brain", "neuro cerebellum gray matter intellect medulla oblongata mind noodle"],
  ["briefcase-medical", "kit doctor emt first aid health medical briefcase"], ["burn", "caliente energy fire flame gas heat"],
  ["capsules", "pharmacy drugs medicine pills prescription capsules"], ["child", "boy girl kid toddler young child"],
  ["clinic-medical", "clinic opd covid-19 doctor general practitioner hospital infirmary medicine"],
  ["clipboard-check", "approve check accept agree confirm done ok select"],
  ["comment-medical", "advice bubble chat commenting conversation diagnose"], ["crutch", "ortho cane injury mobility wheelchair crutch"],
  ["deaf", "ear hearing sign language deaf"], ["diagnoses", "diagnosis analyze detect examine medicine diagnoses"],
  ["disease", "bacteria cancer covid-19 illness infection sickness"], ["dna", "double helix genetic molecule protein dna"],
  ["eye-dropper", "beaker clone color copy eyedropper pipette"], ["female", "human person profile user woman female"],
  ["file-medical", "medical record document health history prescription file"],
  ["file-medical-alt", "report document health history prescription record alternate medical file"],
  ["file-prescription", "document drugs medical medicine rx file prescription"], ["first-aid", "first aid emergency emt health medical rescue"],
  ["flask", "lab beaker experimental labs science flask"], ["h-square", "directions emergency hospital hotel map h square"],
  ["hand-holding-medical", "care covid-19 donate help hand holding medical cross"], ["hand-sparkles", "clean covid-19 hygiene magic soap wash"],
  ["hands-wash", "covid-19 hygiene soap wash hands"], ["head-side-cough", "cough covid-19 germs lungs respiratory sick"],
  ["head-side-cough-slash", "cough covid-19 germs lungs respiratory sick"],
  ["head-side-mask", "breath covid-19 filter respirator virus head side mask"], ["head-side-virus", "cold covid-19 flu sick head side virus"],
  ["heart", "cardio favorite like love relationship valentine heart"],
  ["heartbeat", "vitals ekg electrocardiogram health lifeline vital signs heartbeat"],
  ["hospital", "hospital building covid-19 emergency room medical center"],
  ["hospital-alt", "building covid-19 emergency room medical center alternate hospital"],
  ["hospital-symbol", "clinic covid-19 emergency map hospital symbol"],
  ["hospital-user", "hospital patient covid-19 doctor network primary care with user"],
  ["house-user", "covid-19 home isolation quarantine house user"],
  ["laptop-medical", "computer device ehr electronic health records history laptop medical"], ["low-vision", "blind eye sight low vision"],
  ["lungs", "lungs air breath covid-19 organ respiratory"], ["lungs-virus", "breath covid-19 respiratory sick lungs virus"],
  ["male", "human man person profile user male"], ["medkit", "kit first aid firstaid health help support medkit"],
  ["microscope", "lab pathology covid-19 electron lens optics science shrink"], ["mortar-pestle", "pharmacy crush culinary grind medical mix"],
  ["notes-medical", "emr notes clipboard doctor ehr health history records"], ["pager", "beeper cellphone communication pager"],
  ["people-arrows", "covid-19 personal space social distance spread users"], ["pills", "pharmacy medicine drugs prescription tablets pills"],
  ["prescription", "rx drugs medical medicine pharmacy prescription"],
  ["prescription-bottle", "drugs medical medicine pharmacy rx prescription bottle"],
  ["prescription-bottle-alt", "pharmacy drugs medical medicine rx alternate prescription bottle"],
  ["procedures", "ipd bed procedure ekg electrocardiogram health hospital life"],
  ["pump-medical", "anti-bacterial clean covid-19 disinfect hygiene medical grade"],
  ["pump-soap", "anti-bacterial clean covid-19 disinfect hygiene sanitizer"], ["radiation", "danger dangerous deadly hazard nuclear radioactive"],
  ["radiation-alt", "danger dangerous deadly hazard nuclear radioactive"], ["restroom", "bathroom john loo potty washroom waste"],
  ["shield-virus", "antibodies barrier covid-19 health protect shield virus"], ["shower", "bath clean faucet water shower"],
  ["sign-language", "translate asl deaf hands sign language"], ["skull-crossbones", "dungeons dragons alert bones d danger dead"],
  ["smoking-ban", "ban cancel no smoking non-smoking"], ["soap", "bubbles clean covid-19 hygiene wash soap"],
  ["star-of-life", "doctor emt first aid health medical star of life"],
  ["stethoscope", "doctor opd covid-19 diagnosis general practitioner hospital infirmary"],
  ["syringe", "injection vaccine covid-19 doctor immunizations medical needle syringe"], ["tablets", "drugs medicine pills prescription tablets"],
  ["teeth", "bite dental dentist gums mouth smile"], ["teeth-open", "dental dentist gums bite mouth smile tooth"],
  ["temperature-high", "cook covid-19 mercury summer thermometer warm"], ["temperature-low", "cold cool covid-19 mercury thermometer winter"],
  ["thermometer", "covid-19 mercury status temperature thermometer"], ["thermometer-full", "fever hot mercury status temperature thermometer full"],
  ["thermometer-half", "temperature mercury status thermometer 1 2 full"], ["toilet", "bathroom flush john loo pee plumbing"],
  ["tooth", "dental bicuspid dentist molar mouth teeth"],
  ["universal-access", "accessibility hearing person seeing visual impairment universal access"],
  ["user-injured", "patient cast injury ouch person sling"], ["user-md", "doctor covid-19 job medical nurse occupation physician"],
  ["user-nurse", "nurse covid-19 doctor midwife practitioner surgeon"], ["utensils", "diet kitchen cutlery dining dinner eat food fork"],
  ["vest", "biker fashion style vest"], ["vial", "lab sample experiment science test tube"],
  ["vials", "lab samples experiment sample science test tube"], ["virus", "bug covid-19 flu health sick viral"],
  ["virus-slash", "bug covid-19 cure eliminate flu health"], ["viruses", "bugs covid-19 flu health multiply sick"],
  ["weight", "weight health measurement scale"], ["wheelchair", "wheelchair accessible handicap person"],
  ["x-ray", "radiology health medical radiological images skeleton x-ray"], ["filter", "filter"], ["history", "history"], ["receipt", "receipt"],
  ["question-circle", "help"],
  // Billing, store, admin and general pages
  ["tachometer-alt", "dashboard"], ["home", "home"], ["th-large", "grid tiles"], ["list", "list"], ["list-alt", "list"], ["table", "table grid"],
  ["columns", "columns"], ["clipboard-list", "checklist"], ["tasks", "tasks"], ["check-circle", "done ok"], ["check-double", "verify"],
  ["search", "search find"], ["sliders-h", "settings"], ["cog", "settings gear"], ["cogs", "settings"], ["tools", "tools"], ["wrench", "tool fix"],
  ["edit", "edit"], ["pen", "edit write"], ["plus-circle", "add new"], ["trash-alt", "delete"], ["sync-alt", "refresh"], ["redo", "repeat"],
  ["undo", "undo cancel"], ["ban", "cancel block"], ["times-circle", "cancel close"], ["lock", "lock"], ["unlock", "unlock"],
  ["key", "key password"], ["shield-alt", "security"], ["user", "user"], ["users", "users group"], ["user-plus", "register"], ["user-cog", "admin"],
  ["user-tie", "staff hr"], ["id-card", "id card"], ["id-badge", "badge"], ["address-card", "contact"], ["eye", "eye view"], ["tint", "blood"],
  ["hand-holding-heart", "care"], ["broom", "housekeeping"], ["tshirt", "laundry"], ["recycle", "waste"], ["file-invoice", "invoice"],
  ["file-invoice-dollar", "bill"], ["money-bill-wave", "cash payment"], ["credit-card", "card payment"], ["wallet", "wallet advance"],
  ["rupee-sign", "rupee money"], ["dollar-sign", "money"], ["percent", "discount"], ["calculator", "calculate"], ["coins", "coins"],
  ["hand-holding-usd", "refund"], ["balance-scale", "balance account"], ["book", "ledger book"], ["chart-line", "chart report"],
  ["chart-bar", "chart report"], ["chart-pie", "chart"], ["chart-area", "chart"], ["file-alt", "file doc"], ["file-pdf", "pdf"],
  ["file-excel", "excel"], ["file-export", "export"], ["file-import", "import"], ["file-upload", "upload"], ["file-download", "download"],
  ["print", "print"], ["copy", "copy"], ["folder", "folder"], ["folder-open", "folder"], ["archive", "archive"], ["box", "box item"],
  ["boxes", "stock inventory"], ["box-open", "issue"], ["dolly", "store"], ["truck", "supplier delivery"], ["warehouse", "store warehouse"],
  ["shopping-cart", "purchase"], ["cart-plus", "order"], ["store", "store"], ["barcode", "barcode"], ["qrcode", "qr"], ["tags", "tags"],
  ["tag", "tag"], ["calendar-alt", "calendar appointment"], ["calendar-check", "appointment"], ["calendar-plus", "schedule"], ["clock", "time"],
  ["stopwatch", "timer"], ["hourglass-half", "pending"], ["bell", "alert"], ["exclamation-triangle", "warning"], ["info-circle", "info"],
  ["headset", "help desk"], ["phone", "phone"], ["envelope", "mail"], ["comments", "chat"], ["sms", "sms"], ["bullhorn", "announce"],
  ["tv", "display"], ["desktop", "desktop"], ["mobile-alt", "mobile app"], ["database", "database"], ["server", "server"],
  ["network-wired", "network"], ["plug", "integration"], ["code", "code"], ["robot", "ai"], ["building", "building centre"], ["city", "centre"],
  ["map-marker-alt", "location"], ["sitemap", "structure"], ["layer-group", "layers"], ["puzzle-piece", "module"], ["handshake", "panel insurance"],
  ["file-contract", "contract"], ["file-signature", "consent sign"], ["stamp", "approve stamp"], ["gavel", "legal"], ["graduation-cap", "training"],
  ["star", "star"], ["flag", "flag"], ["bookmark", "bookmark"], ["link", "link"], ["exchange-alt", "transfer"], ["random", "shift"],
  ["sign-in-alt", "in admit"], ["sign-out-alt", "out discharge"], ["door-open", "discharge exit"], ["walking", "visit"], ["car", "transport"],
  ["bolt", "quick"],
].map(([n, k]) => ({ cls: `fas fa-${n}`, name: n, keys: `${n} ${k}` }));

/** The page as it will sit in the menu, and the icons to pick from. */
function IconPicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const n = q
    .trim()
    .toLowerCase()
    .replace(/^fa[srb]?\s+/, "")
    .replace(/^fa-/, "");
  const shown = ICONS.filter((i) => !n || i.keys.includes(n));
  // Not in the list: any Font Awesome name can still be typed.
  const custom = n && /^[a-z0-9-]+$/.test(n) && !ICONS.some((i) => i.name === n) ? `fas fa-${n}` : "";
  const current = value || DEFAULT_ICON;
  return (
    <div className={`sax-icon${open ? " is-open" : ""}`}>
      <div className="sax-icon-row">
        <span className="sax-icon-lbl">Menu icon</span>
        <span className="sax-icon-preview" title={current}>
          <i className={current} />
          <span>{String(label || "").toUpperCase()}</span>
        </span>
        <code className="sax-icon-cls">{current}</code>
        <span className="sax-fill" />
        <Tap className="sax-ghost" onClick={() => setOpen((o) => !o)}>
          <i className="fas fa-icons" /> {open ? "Done" : "Change icon"}
        </Tap>
      </div>
      {open ? (
        <div className="sax-icon-panel">
          <SearchBox
            value={q}
            onChange={setQ}
            autoFocus
            placeholder="Search icon — bed, lab, bill, pharmacy… or type any fa- name"
            onEnter={() => (shown[0] ? onChange(shown[0].cls) : custom && onChange(custom))}
          />
          <div className="sax-icon-grid">
            {custom ? (
              <Tap className={`sax-icon-cell is-custom${value === custom ? " is-on" : ""}`} onClick={() => onChange(custom)} title={custom}>
                <i className={custom} />
                <em>use “{n}”</em>
              </Tap>
            ) : null}
            {shown.map((i) => (
              <Tap
                key={i.cls}
                role="radio"
                aria-checked={current === i.cls}
                className={`sax-icon-cell${current === i.cls ? " is-on" : ""}`}
                onClick={() => onChange(i.cls)}
                title={i.cls}
              >
                <i className={i.cls} />
                <em>{i.name.replace(/-/g, " ")}</em>
              </Tap>
            ))}
            {!shown.length && !custom ? <div className="sax-empty">No icon matches “{q}”.</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const STEPS = [
  { key: "module", label: "Menu", Icon: FolderTree },
  { key: "roles", label: "Roles", Icon: ShieldCheck },
  { key: "employees", label: "Employees", Icon: Users },
];

const pick = (o, ...keys) => {
  for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
  return undefined;
};
const id = (v) => String(v ?? "").trim();
const pairKey = (roleId, empId) => `${id(roleId)}|${id(empId)}`;
const pretty = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(Opd|Ipd|Emr|Mrd|Ot|Mis|Ivf|Hr|Edp|Db)\b/g, (m) => m.toUpperCase());

/** A steady hue per name, so a module or role keeps its colour between visits. */
const hueOf = (s) => {
  let h = 0;
  for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 360;
};
const tint = (name) => ({ "--h": hueOf(name) });

const matches = (q, ...texts) => {
  const n = q.trim().toLowerCase();
  return (
    !n ||
    texts.some((t) =>
      String(t || "")
        .toLowerCase()
        .includes(n),
    )
  );
};

function SearchBox({ value, onChange, placeholder, onEnter, autoFocus }) {
  const ref = useRef(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  return (
    <label className="sax-search">
      <Search size={14} />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
      />
      {value ? (
        <Tap className="sax-search-x" onClick={() => onChange("")} aria-label="Clear search">
          <X size={12} />
        </Tap>
      ) : null}
    </label>
  );
}

function Tick({ on, round = false }) {
  return (
    <span className={`sax-tick${on ? " is-on" : ""}${round ? " is-round" : ""}`}>{on ? <Check size={11} strokeWidth={3} /> : null}</span>
  );
}

function Skeleton({ rows = 6 }) {
  return (
    <div className="sax-grid">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="sax-skel" style={{ animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  );
}

export default function ScreenAccessModal({ screen, onClose: closeNow, onSaved }) {
  const [closing, onClose] = useSmoothClose(closeNow);
  const screenKey = screen?.id || "";
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [urlId, setUrlId] = useState(0);

  const [menus, setMenus] = useState([]);
  const [roles, setRoles] = useState([]);
  const [menuId, setMenuId] = useState("");
  const [roleIds, setRoleIds] = useState(() => new Set());
  const [empPairs, setEmpPairs] = useState(() => new Set());
  const [names, setNames] = useState({}); // employeeID → name, from saved access and loaded lists
  const [baseline, setBaseline] = useState("");
  const [icon, setIcon] = useState(""); // f_filemaster.ReactSubMenuIcon

  const [qMenu, setQMenu] = useState("");
  const [qRole, setQRole] = useState("");
  const [qEmp, setQEmp] = useState("");
  const [activeRole, setActiveRole] = useState("");
  const [empByRole, setEmpByRole] = useState({}); // roleId → { loading, list }

  const signature = (m, r, e, ic) => [m, ic || "", [...r].sort().join(","), [...e].sort().join(",")].join("#");

  /* --- load menus, roles and what is saved, together ---------------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [mRes, rRes, aRes] = await Promise.all([getPageAccessMenus(), bindRoleMasterList(), getScreenPageAccess(screenKey)]);
        if (!alive) return;
        setMenus(
          (Array.isArray(mRes?.data) ? mRes.data : [])
            .map((m) => ({
              id: id(pick(m, "id", "ID")),
              name: String(pick(m, "menuName", "MenuName") ?? "").trim(),
            }))
            .filter((m) => m.id && m.name),
        );
        setRoles(normRoles(rRes?.data).filter((r) => r.active));

        const a = aRes?.success === false ? null : aRes?.data;
        const m = id(pick(a || {}, "menuID", "MenuID"));
        const r = new Set(((a && pick(a, "roles", "Roles")) || []).map(id).filter(Boolean));
        const emps = (a && pick(a, "employees", "Employees")) || [];
        const e = new Set(emps.map((x) => pairKey(pick(x, "roleID", "RoleID"), pick(x, "employeeID", "EmployeeID"))));
        const n = {};
        emps.forEach((x) => {
          n[id(pick(x, "employeeID", "EmployeeID"))] = String(pick(x, "employeeName", "EmployeeName") ?? "").trim();
        });
        setUrlId(Number(pick(a || {}, "urlID", "UrlID")) || 0);
        setMenuId(m && m !== "0" ? m : "");
        setRoleIds(r);
        setEmpPairs(e);
        setNames(n);
        const ic = String(pick(a || {}, "icon", "Icon") ?? "").trim();
        setIcon(ic);
        setBaseline(signature(m && m !== "0" ? m : "", r, e, ic));
        // Already set up → open on the last step that has something in it.
        if (r.size) setStep(e.size ? 2 : 1);
      } catch (err) {
        toast.error(err?.message || "Could not load the access settings");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenKey]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* --- employees, fetched once per role when step 3 needs them ------------ */
  const pickedRoles = useMemo(() => roles.filter((r) => roleIds.has(r.id)), [roles, roleIds]);
  // A saved role that is no longer active still shows, so it can be removed.
  const pickedRoleList = useMemo(() => {
    const known = new Set(pickedRoles.map((r) => r.id));
    return [...pickedRoles, ...[...roleIds].filter((r) => !known.has(r)).map((r) => ({ id: r, name: `Role ${r}`, dept: "" }))];
  }, [pickedRoles, roleIds]);

  useEffect(() => {
    if (step !== 2) return;
    if (!activeRole || !roleIds.has(activeRole)) setActiveRole(pickedRoleList[0]?.id || "");
    pickedRoleList.forEach((r) => {
      if (empByRole[r.id]) return;
      setEmpByRole((s) => ({ ...s, [r.id]: { loading: true, list: [] } }));
      getRoleEmployees(r.id)
        .then((res) => {
          const seen = new Set();
          const list = (Array.isArray(res?.data) ? res.data : [])
            .map((e) => ({
              employeeID: id(pick(e, "employeeID", "EmployeeID")),
              employeeName: String(pick(e, "employeeName", "EmployeeName") ?? "").trim(),
            }))
            .filter((e) => e.employeeID && !seen.has(e.employeeID) && seen.add(e.employeeID));
          setEmpByRole((s) => ({ ...s, [r.id]: { loading: false, list } }));
          setNames((n) => {
            const next = { ...n };
            list.forEach((e) => {
              if (!next[e.employeeID]) next[e.employeeID] = e.employeeName;
            });
            return next;
          });
        })
        .catch(() =>
          setEmpByRole((s) => ({
            ...s,
            [r.id]: { loading: false, list: [], failed: true },
          })),
        );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, pickedRoleList]);

  /* --- edits -------------------------------------------------------------- */
  const toggleRole = (rid) =>
    setRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(rid)) {
        next.delete(rid);
        // Its employees go with it.
        setEmpPairs((p) => new Set([...p].filter((k) => !k.startsWith(`${rid}|`))));
      } else next.add(rid);
      return next;
    });
  const toggleEmp = (rid, eid) =>
    setEmpPairs((prev) => {
      const next = new Set(prev);
      const k = pairKey(rid, eid);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const shownMenus = menus.filter((m) => matches(qMenu, m.name));
  const shownRoles = roles.filter((r) => matches(qRole, r.name, r.dept));
  const roleEmps = empByRole[activeRole] || { loading: true, list: [] };
  // Saved employees the role list no longer returns still show, so they can be removed.
  const roleEmpList = useMemo(() => {
    const listed = new Set(roleEmps.list.map((e) => e.employeeID));
    const extra = [...empPairs]
      .filter((k) => k.startsWith(`${activeRole}|`))
      .map((k) => k.slice(activeRole.length + 1))
      .filter((eid) => !listed.has(eid))
      .map((eid) => ({
        employeeID: eid,
        employeeName: names[eid] || eid,
        stale: true,
      }));
    return [...extra, ...roleEmps.list];
  }, [roleEmps.list, empPairs, activeRole, names]);
  const shownEmps = roleEmpList.filter((e) => matches(qEmp, e.employeeName, e.employeeID));
  const countIn = (rid) => [...empPairs].filter((k) => k.startsWith(`${rid}|`)).length;

  const allShownRolesOn = shownRoles.length > 0 && shownRoles.every((r) => roleIds.has(r.id));
  const allShownEmpsOn = shownEmps.length > 0 && shownEmps.every((e) => empPairs.has(pairKey(activeRole, e.employeeID)));
  const setShownRoles = (on) =>
    shownRoles.forEach((r) => {
      if (roleIds.has(r.id) !== on) toggleRole(r.id);
    });
  const setShownEmps = (on) =>
    setEmpPairs((prev) => {
      const next = new Set(prev);
      shownEmps.forEach((e) => (on ? next.add(pairKey(activeRole, e.employeeID)) : next.delete(pairKey(activeRole, e.employeeID))));
      return next;
    });

  const menuName = menus.find((m) => m.id === menuId)?.name || "";
  const dirty = !loading && signature(menuId, roleIds, empPairs, icon) !== baseline;
  const canReach = (i) => i === 0 || (i === 1 && !!menuId) || (i === 2 && !!menuId && roleIds.size > 0);
  const canSave = !!menuId && roleIds.size > 0 && dirty && !saving;

  const go = (i) => {
    if (i === step || !canReach(i)) return;
    setDir(i > step ? 1 : -1);
    setStep(i);
  };

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await saveScreenPageAccess({
        screenKey,
        displayName: screen?.name || screenKey,
        menuID: Number(menuId),
        icon: icon || DEFAULT_ICON,
        roles: [...roleIds],
        employees: [...empPairs].map((k) => {
          const [roleID, employeeID] = k.split("|");
          return { roleID, employeeID };
        }),
      });
      if (res?.success === false) throw new Error(res?.message || "Could not save the access");
      toast.success(
        `${screen?.name || "Screen"} → ${pretty(menuName)} · ${roleIds.size} role${roleIds.size === 1 ? "" : "s"} · ${empPairs.size} employee${empPairs.size === 1 ? "" : "s"}`,
      );
      onSaved?.({
        urlID: res?.data?.urlID,
        menuID: menuId,
        menuName,
        roles: roleIds.size,
        employees: empPairs.size,
      });
      onClose();
    } catch (err) {
      toast.error(err?.message || "Could not save the access");
    } finally {
      setSaving(false);
    }
  };

  const summary = [
    menuId ? pretty(menuName) : null,
    roleIds.size ? `${roleIds.size} role${roleIds.size === 1 ? "" : "s"}` : null,
    empPairs.size ? `${empPairs.size} employee${empPairs.size === 1 ? "" : "s"}` : null,
  ];

  return (
    <div className={`sax-root${closing ? " is-closing" : ""}`} onClick={onClose}>
      <div className="sax" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Screen access">
        {/* ── header: title, steps and close on one line ─────────────────── */}
        <header className="sax-head">
          <span className="sax-head-ic">
            <ShieldCheck size={14} />
            <i
              className={`sax-head-live${urlId ? " is-live" : ""}`}
              title={urlId ? `Registered page · f_filemaster ID ${urlId}` : "Not a page yet — saving registers it"}
            />
          </span>
          <div className="sax-head-txt" title={`${screen?.name || ""}  /screen/${screenKey}`}>
            <strong>{screen?.name || "Screen access"}</strong>
            <code>/screen/{screenKey}</code>
          </div>

          <nav className="sax-steps" aria-label="Steps">
            {STEPS.map((s, i) => {
              const done = i < step || (i === 0 && menuId) || (i === 1 && roleIds.size) || (i === 2 && empPairs.size);
              return (
                <React.Fragment key={s.key}>
                  {i ? <span className={`sax-step-join${i <= step ? " is-on" : ""}`} /> : null}
                  <Tap
                    className={`sax-step${i === step ? " is-on" : ""}${done ? " is-done" : ""}`}
                    onClick={() => go(i)}
                    disabled={!canReach(i)}
                    title={`${s.label}: ${summary[i] || (i === 0 ? "pick one" : "pick several")}`}
                  >
                    <span className="sax-step-dot">{done && i !== step ? <Check size={10} strokeWidth={3.2} /> : <s.Icon size={11} />}</span>
                    <b>{s.label}</b>
                    <em>{summary[i] || "—"}</em>
                  </Tap>
                </React.Fragment>
              );
            })}
          </nav>

          <Tap className="sax-x" onClick={onClose} aria-label="Close">
            <X size={13} />
          </Tap>
          <span className="sax-head-progress" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </header>

        {/* ── body ───────────────────────────────────────────────────────── */}
        <div className="sax-body">
          {loading ? (
            <div className="sax-pane">
              <Skeleton rows={9} />
            </div>
          ) : (
            <div key={step} className={`sax-pane ${dir > 0 ? "is-fwd" : "is-back"}`}>
              {step === 0 ? (
                <>
                  <IconPicker value={icon} onChange={setIcon} label={screen?.name} />
                  <div className="sax-bar">
                    <SearchBox
                      value={qMenu}
                      onChange={setQMenu}
                      autoFocus
                      placeholder="Search module… (Enter picks the first)"
                      onEnter={() => shownMenus[0] && setMenuId(shownMenus[0].id)}
                    />
                    <span className="sax-count">{menus.length} modules</span>
                  </div>
                  <div className="sax-grid">
                    {shownMenus.map((m) => {
                      const on = m.id === menuId;
                      return (
                        <Tap
                          key={m.id}
                          role="radio"
                          aria-checked={on}
                          className={`sax-card${on ? " is-on" : ""}`}
                          style={tint(m.name)}
                          onClick={() => setMenuId(m.id)}
                          onDoubleClick={() => {
                            setMenuId(m.id);
                            go(1);
                          }}
                        >
                          <span className="sax-card-ic">
                            <FolderTree size={15} />
                          </span>
                          <span className="sax-card-txt">
                            <b>{pretty(m.name)}</b>
                            <em>Menu #{m.id}</em>
                          </span>
                          <Tick on={on} round />
                        </Tap>
                      );
                    })}
                    {!shownMenus.length ? <div className="sax-empty">No module matches “{qMenu}”.</div> : null}
                  </div>
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <div className="sax-bar">
                    <SearchBox
                      value={qRole}
                      onChange={setQRole}
                      autoFocus
                      placeholder="Search role or department… (Enter ticks the first)"
                      onEnter={() => shownRoles[0] && toggleRole(shownRoles[0].id)}
                    />
                    <Tap className="sax-ghost" onClick={() => setShownRoles(!allShownRolesOn)} disabled={!shownRoles.length}>
                      <CheckCheck size={13} /> {allShownRolesOn ? "Clear shown" : "Select shown"}
                    </Tap>
                  </div>
                  <div className="sax-grid">
                    {shownRoles.map((r) => {
                      const on = roleIds.has(r.id);
                      return (
                        <Tap
                          key={r.id}
                          role="checkbox"
                          aria-checked={on}
                          className={`sax-card${on ? " is-on" : ""}`}
                          style={tint(r.name)}
                          onClick={() => toggleRole(r.id)}
                        >
                          <span className="sax-card-ic">
                            <ShieldCheck size={15} />
                          </span>
                          <span className="sax-card-txt">
                            <b>{pretty(r.name)}</b>
                            <em>{r.dept ? pretty(r.dept) : `Role #${r.id}`}</em>
                          </span>
                          <Tick on={on} />
                        </Tap>
                      );
                    })}
                    {!shownRoles.length ? <div className="sax-empty">No role matches “{qRole}”.</div> : null}
                  </div>
                </>
              ) : null}

              {step === 2 ? (
                <div className="sax-split">
                  <aside className="sax-rail">
                    <div className="sax-rail-title">Roles</div>
                    {pickedRoleList.map((r) => {
                      const n = countIn(r.id);
                      const loaded = empByRole[r.id]?.list;
                      // Saved employees who no longer log in under the role still count.
                      const listed = new Set((loaded || []).map((e) => e.employeeID));
                      const stale = [...empPairs].filter((k) => k.startsWith(`${r.id}|`) && !listed.has(k.slice(r.id.length + 1))).length;
                      const total = loaded ? loaded.length + stale : undefined;
                      return (
                        <Tap
                          key={r.id}
                          className={`sax-rail-item${r.id === activeRole ? " is-on" : ""}`}
                          style={tint(r.name)}
                          onClick={() => {
                            setActiveRole(r.id);
                            setQEmp("");
                          }}
                        >
                          <span className="sax-rail-dot" />
                          <span className="sax-rail-name">{pretty(r.name)}</span>
                          <span className={`sax-rail-n${n ? " has" : ""}`}>
                            {empByRole[r.id]?.loading ? (
                              <Loader2 size={11} className="sax-spin" />
                            ) : (
                              `${n}${total != null ? `/${total}` : ""}`
                            )}
                          </span>
                        </Tap>
                      );
                    })}
                  </aside>
                  <section className="sax-emps">
                    <div className="sax-bar">
                      <SearchBox
                        value={qEmp}
                        onChange={setQEmp}
                        autoFocus
                        placeholder="Search name or ID… (Enter ticks the first)"
                        onEnter={() => shownEmps[0] && toggleEmp(activeRole, shownEmps[0].employeeID)}
                      />
                      <Tap className="sax-ghost" onClick={() => setShownEmps(!allShownEmpsOn)} disabled={!shownEmps.length}>
                        <CheckCheck size={13} /> {allShownEmpsOn ? "Clear shown" : "Select shown"}
                      </Tap>
                    </div>
                    {roleEmps.loading ? (
                      <Skeleton rows={6} />
                    ) : (
                      <div className="sax-list">
                        {shownEmps.map((e, i) => {
                          const on = empPairs.has(pairKey(activeRole, e.employeeID));
                          return (
                            <Tap
                              key={e.employeeID}
                              role="checkbox"
                              aria-checked={on}
                              className={`sax-emp${on ? " is-on" : ""}${e.stale ? " is-stale" : ""}`}
                              style={{
                                ...tint(e.employeeID),
                                animationDelay: `${Math.min(i, 12) * 18}ms`,
                              }}
                              onClick={() => toggleEmp(activeRole, e.employeeID)}
                            >
                              <span className="sax-av">{initials(e.employeeName)}</span>
                              <span className="sax-emp-txt">
                                <b>{e.employeeName || e.employeeID}</b>
                                <em>
                                  {e.employeeID}
                                  {e.stale ? " · no longer logs in under this role" : ""}
                                </em>
                              </span>
                              <Tick on={on} />
                            </Tap>
                          );
                        })}
                        {!shownEmps.length ? (
                          <div className="sax-empty">
                            {roleEmps.failed ? (
                              "Could not load this role's employees."
                            ) : qEmp ? (
                              `No employee matches “${qEmp}”.`
                            ) : (
                              <>
                                <UserRound size={18} /> Nobody logs in under this role.
                              </>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </section>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* ── footer ─────────────────────────────────────────────────────── */}
        <footer className="sax-foot">
          <span className="sax-foot-sum">
            <Building2 size={13} />
            {summary.filter(Boolean).length ? summary.filter(Boolean).join(" · ") : "Nothing picked yet"}
            {dirty ? <i className="sax-dirty">unsaved</i> : null}
          </span>
          <span className="sax-fill" />
          {step > 0 ? (
            <Tap className="sax-btn" onClick={() => go(step - 1)}>
              <ArrowLeft size={14} /> Back
            </Tap>
          ) : (
            <Tap className="sax-btn" onClick={onClose}>
              Cancel
            </Tap>
          )}
          {step < STEPS.length - 1 ? (
            <Tap className="sax-btn is-primary" onClick={() => go(step + 1)} disabled={!canReach(step + 1)}>
              Next <ArrowRight size={14} />
            </Tap>
          ) : null}
          <Tap className="sax-btn is-save" onClick={save} disabled={!canSave}>
            {saving ? <Loader2 size={14} className="sax-spin" /> : <Check size={14} strokeWidth={3} />} Save access
          </Tap>
        </footer>
      </div>
    </div>
  );
}
