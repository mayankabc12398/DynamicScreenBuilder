/**
 * Screen Box Permission — "By role" view: a permission table.
 *
 *   [Role ▾]  [Employees ▾ (several)]  [Screens ▾ (several)]
 *
 *   ┌──────────────────────┬─────┬──────┬──────┬──────┐
 *   │ Screen / box         │ All │ Emp1 │ Emp2 │ …    │
 *   ├──────────────────────┼─────┼──────┼──────┼──────┤
 *   │ ▾ Screen A           │ [➖] │ [✓]  │ [ ]  │      │   ← whole screen
 *   │     Box 1            │ [✓] │ [✓]  │ [✓]  │      │
 *   │     Box 2            │ [ ] │ [ ]  │ [ ]  │      │
 *   │ ▸ Screen B (folded)  │ …                        │
 *   └──────────────────────┴──────────────────────────┘
 *
 * Rows are the restricted boxes of the chosen screens, grouped per screen;
 * columns are the chosen employees. Every cell is one employee on one box.
 * The "All" column, a screen's row and an employee's column head tick in bulk
 * and read all / some / none (✓ / ➖ / ☐). Cells changed since the last save
 * are marked, and one Save writes every changed employee on every screen in a
 * single transaction (ScreenBuilder/SaveRoleAccessBatch).
 *
 * Roles: EDP/RoleAndDepartmentSetUp/BindRoleMasterList. A role's employees:
 * the active ones who log in under it (f_login, ScreenBuilder/GetRoleEmployees).
 * Screens: the ones filed under the role (sb_screen_module), or every screen
 * with the "All screens" switch. Grants: read once per role
 * (ScreenBuilder/GetRoleScreenAccess).
 *
 * Grants are per role (sb_screen_access.RoleID): an employee sees a box only
 * while logged in under the role it was granted in. The live page asks
 * GetMyScreenAccess, which answers for the role on the login token.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import { useTranslation } from "react-i18next";
import {
  Briefcase,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Keyboard,
  Loader2,
  Monitor,
  Pencil,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Undo2,
  Users,
  X,
} from "lucide-react";
import Heading from "@app/components/UI/Heading";
import { notify } from "@app/utils/utils";
import {
  bindRoleMasterList,
  getRoleEmployees,
  getRoleScreenAccess,
  listScreens,
  saveRoleAccessBatch,
} from "@app/networkServices/screenBuilderApi";
import {
  Btn,
  docOf,
  EmployeePicker,
  Highlight,
  idKey,
  initials,
  loadScreenBoxes,
  normRoles,
  restrictedBoxes,
  RolePicker,
  SearchPicker,
  toneOf,
  typeLabel,
  useFitHeight,
} from "./shared";

/* ----------------------------------------------------------------- helpers */

/** Employee rows, each person once, ids trimmed. */
const normEmployees = (list) => {
  const seen = new Set();
  return (Array.isArray(list) ? list : [])
    .map((e) => ({
      employeeID: idKey(e?.employeeID ?? e?.EmployeeID),
      employeeName: String(e?.employeeName ?? e?.EmployeeName ?? "").trim(),
      grants: Number(e?.grants ?? e?.Grants) || 0,
    }))
    .filter((e) => e.employeeID && !seen.has(e.employeeID) && seen.add(e.employeeID));
};

/**
 * Screens as { key, name, status, version, updatedOn, modules, draftBoxes }.
 * `draftBoxes` is counted from the draft the list carries, only to offer and
 * sort screens — the table's rows are read from the published copy and the
 * draft both (loadScreenBoxes). The document is not kept.
 */
const normScreens = (list) =>
  (Array.isArray(list) ? list : [])
    .map((s) => ({
      key: s.screenKey,
      name: s.name || s.screenKey,
      status: s.status,
      version: s.version,
      updatedOn: s.updatedOn,
      modules: (s.modules || []).map((m) => idKey(m?.moduleId)),
      // from the draft the list already carries: drawn at once, no call per screen
      draft: restrictedBoxes(docOf(s)?.root),
      draftBoxes: 0,
    }))
    .filter((s) => s.key)
    .map((s) => ({ ...s, draftBoxes: s.draft.length }))
    .sort((a, b) => a.name.localeCompare(b.name));

const sameIds = (a, b) => [...(a || [])].sort().join(",") === [...(b || [])].sort().join(",");

const hit = (q, ...texts) => {
  const needle = q.trim().toLowerCase();
  return !needle || texts.some((s) => String(s || "").toLowerCase().includes(needle));
};

const isPublished = (s) => s?.status === "published";

/** More screens than this on the table and newly added ones start folded. */
const FOLD_AFTER = 8;

/** A steady colour per control type, so inputs, tiles and panels read apart down the Type column. */
const TYPE_TONES = ["violet", "teal", "blue", "amber", "green", "slate"];
const typeTone = (type) => {
  let h = 0;
  for (const ch of String(type || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TYPE_TONES[h % TYPE_TONES.length];
};

/** "a\u0000b" — a pair as one map key; neither part can hold a NUL. */
const pairKey = (emp, key) => `${emp}\u0000${key}`;

/* ------------------------------------------------------------------ pieces */

/**
 * The table's checkbox: all (✓), some (➖) or none, with a mark when it differs
 * from what is saved. A span, as everywhere on this page: the global theme
 * repaints real inputs.
 */
function Tick({ state = "none", dirty = false, off = false, onClick, title }) {
  const fire = (e) => {
    e.stopPropagation();
    if (!off) onClick?.();
  };
  return (
    <span
      role="checkbox"
      tabIndex={off ? -1 : 0}
      aria-checked={state === "all" ? "true" : state === "some" ? "mixed" : "false"}
      aria-disabled={off || undefined}
      title={title}
      className={`sbp-tick is-${state}${dirty ? " is-dirty" : ""}${off ? " is-off" : ""}`}
      onClick={fire}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          fire(e);
        }
      }}
    >
      {state === "all" ? <Check size={12} /> : state === "some" ? <span className="sbp-check-dash" /> : null}
    </span>
  );
}

/** What to do next until role, employees and screens are all chosen. */
function Guide({ t, steps }) {
  return (
    <div className="sbp-guide">
      <div className="sbp-guide-head">
        <span className="sbp-empty-icon">
          <ShieldCheck size={22} />
        </span>
        <b>{t("Set who sees which box, in three steps")}</b>
        <small>{t("Pick from the dropdowns at the top; the permission table appears here.")}</small>
      </div>
      <ol className="sbp-guide-steps">
        {steps.map((s, i) => (
          <li key={s.label} className={s.done ? "is-done" : s.current ? "is-current" : ""}>
            <span className="sbp-guide-n">{s.done ? <Check size={13} /> : i + 1}</span>
            <span className="sbp-guide-icon">{s.icon}</span>
            <span className="sbp-guide-text">
              <b>{s.label}</b>
              <small>{s.hint}</small>
            </span>
            {s.action || null}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* -------------------------------------------------------------------- view */

export default function RoleAccessView({ data, tabs, onDirty }) {
  const [t] = useTranslation();
  const pageRef = useRef(null);
  const fitHeight = useFitHeight(pageRef);

  /* --- roles ------------------------------------------------------------- */
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roleId, setRoleId] = useState("");
  useEffect(() => {
    bindRoleMasterList()
      .then((res) => setRoles(normRoles(res?.data)))
      .finally(() => setRolesLoading(false));
  }, []);
  const role = roles.find((r) => r.id === roleId) || null;

  /* --- the role's employees ------------------------------------------------ */
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empIds, setEmpIds] = useState([]);
  useEffect(() => {
    setEmployees([]);
    if (!roleId) return undefined;
    let alive = true;
    setEmpLoading(true);
    getRoleEmployees(roleId)
      .then((res) => alive && setEmployees(normEmployees(res?.data)))
      .finally(() => alive && setEmpLoading(false));
    return () => {
      alive = false;
    };
  }, [roleId]);

  /* --- every grant under the role: saved, and edits ------------------------ */
  // { [employeeID]: { [screenKey]: [nodeId] } } as last saved, loaded once per
  // role; edits hold only the employee/screen pairs touched since.
  const [saved, setSaved] = useState({});
  const [edits, setEdits] = useState({});
  const [grantsLoading, setGrantsLoading] = useState(false);
  const [grantsReady, setGrantsReady] = useState(false);
  useEffect(() => {
    setSaved({});
    setEdits({});
    setGrantsReady(false);
    if (!roleId) return undefined;
    let alive = true;
    setGrantsLoading(true);
    getRoleScreenAccess(roleId)
      .then((res) => {
        if (!alive) return;
        const byEmp = {};
        (Array.isArray(res?.data) ? res.data : []).forEach((g) => {
          const emp = idKey(g.employeeID);
          const id = String(g.nodeId || "");
          if (!emp || !id || !g.screenKey) return;
          const byScreen = (byEmp[emp] = byEmp[emp] || {});
          const list = (byScreen[g.screenKey] = byScreen[g.screenKey] || []);
          if (!list.includes(id)) list.push(id);
        });
        setSaved(byEmp);
        setGrantsReady(true);
      })
      .finally(() => alive && setGrantsLoading(false));
    return () => {
      alive = false;
    };
  }, [roleId]);

  const curOf = (emp, key) => edits[emp]?.[key] ?? saved[emp]?.[key] ?? [];
  const totalOf = (byScreen) => Object.values(byScreen || {}).reduce((n, list) => n + (list?.length || 0), 0);

  // Each employee's count from the grants held here, so it follows every save.
  const empRows = useMemo(
    () => (grantsReady ? employees.map((e) => ({ ...e, grants: totalOf(saved[e.employeeID]) })) : employees),
    [employees, saved, grantsReady],
  );
  const selected = useMemo(() => empRows.filter((e) => empIds.includes(e.employeeID)), [empRows, empIds]);

  /* --- screens ------------------------------------------------------------- */
  const [screens, setScreens] = useState([]);
  const [screensLoading, setScreensLoading] = useState(true);
  const [allScreens, setAllScreens] = useState(false);
  const [screenKeys, setScreenKeys] = useState([]);
  useEffect(() => {
    listScreens({ includeDefinition: true })
      .then((res) => setScreens(normScreens(res?.data)))
      .finally(() => setScreensLoading(false));
  }, []);

  const roleScreens = useMemo(() => screens.filter((s) => roleId && s.modules.includes(roleId)), [screens, roleId]);
  // A role with no screens filed under it offers every screen rather than none.
  const showingAll = allScreens || !roleScreens.length;
  const screenPool = showingAll ? screens : roleScreens;
  // Only screens with something to grant: a restricted box in the draft, or a
  // grant a chosen employee already holds there.
  const grantable = useMemo(
    () => screenPool.filter((s) => s.draftBoxes > 0 || empIds.some((emp) => (saved[emp]?.[s.key] || []).length > 0)),
    [screenPool, saved, empIds],
  );
  const screenMeta = (s) =>
    [isPublished(s) && s.version ? `v${s.version}` : t("Draft"), s.updatedOn ? moment(s.updatedOn).fromNow() : ""]
      .filter(Boolean)
      .join(" · ");
  const screenItems = useMemo(() => {
    // the chosen ones stay offered even when the "All screens" switch hides them
    const list = [...grantable];
    screenKeys.forEach((k) => {
      if (!list.some((s) => s.key === k)) {
        const s = screens.find((x) => x.key === k);
        if (s) list.push(s);
      }
    });
    return list.map((s) => ({
      id: s.key,
      name: s.name,
      sub: screenMeta(s),
      icon: (
        <span className={`sbp-picker-opt-icon${isPublished(s) ? " is-live" : ""}`}>
          {isPublished(s) ? <Monitor size={13} /> : <Pencil size={13} />}
        </span>
      ),
      badge: (
        <span className="sbp-box-count is-zero" title={t("Restricted boxes in the draft")}>
          <ShieldCheck size={11} /> {s.draftBoxes}
        </span>
      ),
    }));
  }, [grantable, screenKeys, screens]); // eslint-disable-line react-hooks/exhaustive-deps
  const selScreens = useMemo(
    () => screenKeys.map((k) => screens.find((s) => s.key === k)).filter(Boolean),
    [screenKeys, screens],
  );

  /* --- each chosen screen's restricted boxes ------------------------------- */
  // A screen's rows come from the draft the screen list already carries, so a
  // thousand screens cost no extra calls. The published copy (which can hold a
  // box the draft has since lifted) is fetched only for screens that are
  // opened and drawn, and then replaces the draft rows.
  // Cached for the page's life: undefined = not asked, null = on its way.
  const boxCache = useRef({});
  const [boxesBy, setBoxesBy] = useState({});

  const [boxQ, setBoxQ] = useState("");
  const [collapsed, setCollapsed] = useState(() => new Set());
  const groups = useMemo(
    () =>
      selScreens
        .map((s) => {
          const all = boxesBy[s.key] || s.draft;
          // the filter matches a screen's name (all its controls) or a control
          const screenHit = !!boxQ.trim() && hit(boxQ, s.name);
          return {
            s,
            live: !!boxesBy[s.key],
            all,
            boxes: screenHit ? all : all.filter((b) => hit(boxQ, b.label, b.name, typeLabel(b.type), ...b.path)),
          };
        })
        // filtering hides the screens with nothing that matches
        .filter((g) => !boxQ.trim() || g.boxes.length),
    [selScreens, boxesBy, boxQ],
  );

  // Screens drawn at a time; "Show more" adds this many again.
  const SCREEN_PAGE = 30;
  const [shownN, setShownN] = useState(SCREEN_PAGE);
  useEffect(() => setShownN(SCREEN_PAGE), [screenKeys, boxQ]);
  const shownGroups = groups.slice(0, shownN);

  // The published copy, for the screens open on the table right now.
  const openKeys = shownGroups.filter((g) => !collapsed.has(g.s.key)).map((g) => g.s.key).join(",");
  useEffect(() => {
    openKeys
      .split(",")
      .filter(Boolean)
      .forEach((key) => {
        if (boxCache.current[key] !== undefined) return;
        boxCache.current[key] = null;
        loadScreenBoxes(key)
          .then((list) => {
            boxCache.current[key] = list;
            setBoxesBy((p) => ({ ...p, [key]: list }));
          })
          .catch(() => {
            // keep showing the draft's rows
            boxCache.current[key] = undefined;
          });
      });
  }, [openKeys]);

  /* --- cells ----------------------------------------------------------------- */
  // Sets for quick lookups: what is ticked now, and what is saved.
  const sets = useMemo(() => {
    const cur = {};
    const was = {};
    empIds.forEach((emp) => {
      cur[emp] = {};
      was[emp] = {};
      screenKeys.forEach((k) => {
        cur[emp][k] = new Set(edits[emp]?.[k] ?? saved[emp]?.[k] ?? []);
        was[emp][k] = new Set(saved[emp]?.[k] ?? []);
      });
    });
    return { cur, was };
  }, [empIds, screenKeys, edits, saved]);
  const has = (emp, k, id) => !!sets.cur[emp]?.[k]?.has(id);
  const had = (emp, k, id) => !!sets.was[emp]?.[k]?.has(id);

  /** A list of [employee, screen, box] cells as all / some / none. */
  const triOf = (cells) => {
    if (!cells.length) return "none";
    let n = 0;
    cells.forEach(([e, k, i]) => {
      if (has(e, k, i)) n += 1;
    });
    if (!n) return "none";
    return n === cells.length ? "all" : "some";
  };
  const dirtyOf = (cells) => cells.some(([e, k, i]) => has(e, k, i) !== had(e, k, i));
  const countOn = (cells) => cells.filter(([e, k, i]) => has(e, k, i)).length;

  const [saving, setSaving] = useState(false);
  // No ticking while saving, or before the role's saved grants have arrived.
  const busy = saving || grantsLoading;

  /** Ticks (`on`) or unticks every cell given. */
  const setCells = (cells, on) =>
    setEdits((prev) => {
      const lists = {};
      cells.forEach(([emp, k, id]) => {
        const pk = pairKey(emp, k);
        if (!lists[pk]) lists[pk] = { emp, k, set: new Set(prev[emp]?.[k] ?? saved[emp]?.[k] ?? []) };
        if (on) lists[pk].set.add(id);
        else lists[pk].set.delete(id);
      });
      const out = { ...prev };
      Object.values(lists).forEach(({ emp, k, set }) => {
        out[emp] = { ...(out[emp] || {}), [k]: [...set] };
      });
      return out;
    });
  /** Bulk: all ticked -> untick them all; otherwise tick them all. */
  const flip = (cells) => cells.length && !busy && setCells(cells, triOf(cells) !== "all");

  const rowCells = (k, id) => empIds.map((emp) => [emp, k, id]);
  const screenEmpCells = (g, emp) => g.boxes.map((b) => [emp, g.s.key, b.id]);
  const screenCells = (g) => g.boxes.flatMap((b) => rowCells(g.s.key, b.id));
  const empCells = (emp) => groups.flatMap((g) => screenEmpCells(g, emp));
  const allCells = groups.flatMap(screenCells);

  /* --- unsaved changes --------------------------------------------------------- */
  // The employee/screen pairs that differ from what is saved, and how many
  // single cells that adds up to.
  const { dirtyPairs, changeCount } = useMemo(() => {
    const pairs = [];
    let n = 0;
    Object.entries(edits).forEach(([emp, byScreen]) =>
      Object.entries(byScreen || {}).forEach(([key, list]) => {
        const before = new Set(saved[emp]?.[key] || []);
        const now = new Set(list || []);
        let diff = 0;
        now.forEach((id) => !before.has(id) && (diff += 1));
        before.forEach((id) => !now.has(id) && (diff += 1));
        if (diff) {
          pairs.push({ emp, key });
          n += diff;
        }
      }),
    );
    return { dirtyPairs: pairs, changeCount: n };
  }, [edits, saved]);
  const dirtyScreens = useMemo(() => new Set(dirtyPairs.map((p) => p.key)), [dirtyPairs]);
  const dirtyEmps = useMemo(() => new Set(dirtyPairs.map((p) => p.emp)), [dirtyPairs]);
  useEffect(() => onDirty?.(dirtyPairs.length > 0), [dirtyPairs.length, onDirty]);

  const resetScreen = (key) =>
    setEdits((prev) => {
      const out = {};
      Object.entries(prev).forEach(([emp, byScreen]) => {
        const rest = { ...byScreen };
        delete rest[key];
        if (Object.keys(rest).length) out[emp] = rest;
      });
      return out;
    });

  /* --- choosing role, employees, screens -------------------------------------- */
  const pickRole = (id) => {
    if (id === roleId) return;
    if (dirtyPairs.length && !window.confirm(`${changeCount} ${t("unsaved change(s) under this role will be lost. Continue?")}`))
      return;
    setEdits({});
    setEmpIds([]);
    setScreenKeys([]);
    setRoleId(id);
  };

  /** Unticking someone with unsaved changes drops them — asked first. */
  const pickEmployees = (next) => {
    const keep = new Set(next);
    const leaving = [...dirtyEmps].filter((emp) => !keep.has(emp));
    if (leaving.length && !window.confirm(`${leaving.length} ${t("unticked employee(s) have unsaved changes. Discard them?")}`))
      return;
    if (leaving.length)
      setEdits((prev) => {
        const out = { ...prev };
        leaving.forEach((emp) => delete out[emp]);
        return out;
      });
    setEmpIds(next);
  };

  /** Unticking a screen with unsaved changes drops them — asked first. */
  const pickScreens = (next) => {
    const keep = new Set(next);
    const leaving = [...dirtyScreens].filter((k) => !keep.has(k));
    if (leaving.length && !window.confirm(`${leaving.length} ${t("unticked screen(s) have unsaved changes. Discard them?")}`))
      return;
    leaving.forEach(resetScreen);
    // Past a handful of screens, newly added ones start folded: the table then
    // reads as a list of screens to open, not thousands of rows.
    const had = new Set(screenKeys);
    const added = next.filter((k) => !had.has(k));
    if (added.length && next.length > FOLD_AFTER)
      setCollapsed((prev) => {
        const out = new Set(prev);
        added.forEach((k) => out.add(k));
        return out;
      });
    setScreenKeys(next);
  };

  const toggleGroup = (key) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const allFolded = selScreens.length > 0 && selScreens.every((s) => collapsed.has(s.key));
  const foldAll = () => setCollapsed(allFolded ? new Set() : new Set(selScreens.map((s) => s.key)));

  /* --- save ------------------------------------------------------------------ */
  const saveAll = async () => {
    if (!dirtyPairs.length || saving || !roleId) return;
    setSaving(true);
    const names = new Map(empRows.map((e) => [e.employeeID, e.employeeName]));
    const byScreen = {};
    dirtyPairs.forEach(({ emp, key }) => {
      // Grants for boxes no longer on the screen (deleted in the builder) are
      // dropped here: only boxes the screen still has are sent.
      // Only once the published copy is in: a box the draft lifted may still be live.
      const live = boxCache.current[key];
      const ids = (edits[emp]?.[key] || []).filter((id) => !live || live.some((b) => b.id === id));
      const known = live || screens.find((s) => s.key === key)?.draft;
      (byScreen[key] = byScreen[key] || []).push({ emp, ids, known });
    });
    const res = await saveRoleAccessBatch({
      roleID: roleId,
      screens: Object.entries(byScreen).map(([screenKey, list]) => ({
        screenKey,
        employees: list.map(({ emp, ids, known }) => ({
          employeeID: emp,
          employeeName: names.get(emp) || "",
          nodes: ids.map((id) => ({ nodeId: id, nodeName: known?.find((b) => b.id === id)?.name || "" })),
        })),
      })),
    }).catch(() => null);
    if (res?.success) {
      const next = { ...saved };
      Object.entries(byScreen).forEach(([key, list]) =>
        list.forEach(({ emp, ids }) => {
          next[emp] = { ...(next[emp] || {}), [key]: ids };
        }),
      );
      setSaved(next);
      setEdits({});
      notify(t("Access saved."), "success");
    } else {
      notify(res?.message || t("Access could not be saved. Nothing was changed."), "error");
    }
    setSaving(false);
  };

  // Ctrl+S saves while there is something to save.
  const saveRef = useRef(saveAll);
  saveRef.current = saveAll;
  const canSave = dirtyPairs.length > 0 && !saving;
  useEffect(() => {
    if (!canSave) return undefined;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canSave]);

  /* --- render ---------------------------------------------------------------- */
  const ready = !!roleId && selected.length > 0 && selScreens.length > 0;
  const boxTotal = groups.reduce((n, g) => n + g.boxes.length, 0);

  const steps = [
    {
      label: t("Pick a role"),
      icon: <Briefcase size={15} />,
      done: !!roleId,
      current: !roleId,
      hint: role ? role.name : t("Grants hold only while the employee is logged in under this role."),
    },
    {
      label: t("Pick employees"),
      icon: <Users size={15} />,
      done: selected.length > 0,
      current: !!roleId && !selected.length,
      hint: !roleId
        ? t("Everyone who logs in under the role is listed.")
        : empLoading
          ? t("Loading…")
          : selected.length
            ? `${selected.length} ${t("selected")}`
            : `${employees.length} ${t("in this role — pick one or several")}`,
      action:
        roleId && !selected.length && employees.length ? (
          <Btn tone="blue" small onClick={() => pickEmployees(employees.map((e) => e.employeeID))}>
            <Users size={12} /> {t("Select all")} ({employees.length})
          </Btn>
        ) : null,
    },
    {
      label: t("Pick screens"),
      icon: <Monitor size={15} />,
      done: selScreens.length > 0,
      current: !!roleId && selected.length > 0 && !selScreens.length,
      hint: selScreens.length
        ? `${selScreens.length} ${t("selected")}`
        : roleId
          ? `${grantable.length} ${t("screen(s) with restricted boxes")}`
          : t("Only screens with restricted boxes are offered."),
      action:
        roleId && !selScreens.length && grantable.length ? (
          <Btn tone="blue" small onClick={() => pickScreens(grantable.map((s) => s.key))}>
            <Monitor size={12} /> {t("Select all")} ({grantable.length})
          </Btn>
        ) : null,
    },
  ];

  const allState = triOf(allCells);

  return (
    <div
      ref={pageRef}
      className={`card sbp-page${fitHeight ? " is-fit" : ""}`}
      style={fitHeight ? { height: fitHeight } : undefined}
    >
      <Heading title={data?.breadcrumb || t("Screen Box Permission")} data={data} isBreadcrumb={true} />

      {/* ------------------------------------------------------------ header */}
      <div className="sbp-header">
        <div className="sbp-title">
          <div className="sbp-title-icon">
            <ShieldCheck size={15} />
          </div>
          <div className="sbp-title-main">
            <span className="sbp-title-text">{t("Screen Box Permission")}</span>
            {tabs}
            {changeCount ? (
              <span className="sbp-pill is-dirty">
                <span className="sbp-dot" /> {changeCount} {t("unsaved")}
              </span>
            ) : null}
          </div>
        </div>
        <div className="sbp-actions">
          <div className="sbp-pick sbp-pick-role">
            <RolePicker roles={roles} value={roleId} onChange={pickRole} t={t} loading={rolesLoading} />
          </div>
          <div className="sbp-pick sbp-pick-emp">
            <EmployeePicker
              employees={empRows}
              value={empIds}
              onChange={pickEmployees}
              t={t}
              loading={empLoading}
              disabled={!roleId}
            />
          </div>
          <div className="sbp-pick sbp-pick-screen">
            <SearchPicker
              className="sbp-screen-picker"
              items={screenItems}
              value={screenKeys}
              onChange={pickScreens}
              t={t}
              multiple
              manyLabel={(n) => `${n} ${t("screens")}`}
              fieldIcon={<Monitor size={14} />}
              placeholder={t("Pick screens…")}
              searchPlaceholder={t("Search screens…")}
              emptyText={t("No screen with restricted boxes")}
              disabled={!roleId}
              disabledText={t("Pick a role first…")}
              loading={screensLoading}
            />
          </div>
        </div>
      </div>

      <div className="sbp-body">
        <div className="sbp-matrix">
          {/* ------------------------------------------------------ toolbar */}
          <div className="sbp-mx-toolbar">
            <div className="sbp-search sbp-mx-search">
              <Search size={13} />
              <input
                type="text"
                className="sbp-search-input"
                value={boxQ}
                onChange={(e) => setBoxQ(e.target.value)}
                placeholder={t("Filter boxes by name, type or place…")}
              />
              {boxQ ? (
                <span className="sbp-search-clear" role="button" tabIndex={0} onClick={() => setBoxQ("")}>
                  <X size={13} />
                </span>
              ) : null}
            </div>
            {roleId && roleScreens.length ? (
              <label className="sbp-only" title={t("Offer every screen, not only the ones filed under this role")}>
                <input type="checkbox" checked={allScreens} onChange={(e) => setAllScreens(e.target.checked)} />
                <span className="sbp-switch" />
                {t("All screens")}
              </label>
            ) : null}
            {ready ? (
              <Btn tone="slate" small onClick={foldAll}>
                {allFolded ? <ChevronsUpDown size={12} /> : <ChevronsDownUp size={12} />}{" "}
                {allFolded ? t("Expand all") : t("Collapse all")}
              </Btn>
            ) : null}
            <span className="sbp-legend">
              <span>
                <Tick state="all" off /> {t("Can see")}
              </span>
              <span>
                <Tick state="some" off /> {t("Some")}
              </span>
              <span>
                <Tick state="none" off /> {t("Hidden")}
              </span>
              <span>
                <i className="sbp-legend-dirty" /> {t("Unsaved")}
              </span>
            </span>
          </div>

          {/* -------------------------------------------------------- table */}
          {!ready ? (
            <Guide t={t} steps={steps} />
          ) : (
            <div className={`sbp-mx-scroll${busy ? " is-saving" : ""}`}>
              <table className="sbp-mx">
                <thead>
                  <tr>
                    {/* screen, control, type and location stay put when the table scrolls sideways */}
                    <th className="sbp-mx-screencol">
                      <div className="sbp-mx-corner">
                        <b>{t("Screen")}</b>
                        <span className="sbp-count">{selScreens.length}</span>
                      </div>
                    </th>
                    <th className="sbp-mx-boxcol">
                      <div className="sbp-mx-corner">
                        <b>{t("Controls")}</b>
                        <span className="sbp-count">{boxTotal}</span>
                      </div>
                    </th>
                    <th className="sbp-mx-typecol">
                      <div className="sbp-mx-corner">
                        <b>{t("Type")}</b>
                      </div>
                    </th>
                    <th className="sbp-mx-placecol">
                      <div className="sbp-mx-corner">
                        <b>{t("Location in screen")}</b>
                      </div>
                    </th>
                    <th className="sbp-mx-allcol">
                      <div className="sbp-mx-head is-all" title={t("Every control for every chosen employee")}>
                        <Tick
                          state={allState}
                          dirty={dirtyOf(allCells)}
                          off={busy || !allCells.length}
                          onClick={() => flip(allCells)}
                          title={t("Every control for every chosen employee")}
                        />
                        <span className="sbp-mx-head-text">
                          <b>{t("All")}</b>
                          <small>
                            {selected.length} {t("people")}
                          </small>
                        </span>
                      </div>
                    </th>
                    {selected.map((e) => {
                      const cells = empCells(e.employeeID);
                      return (
                        <th key={e.employeeID} className="sbp-mx-empcol">
                          {/* avatar beside name; ID, tick and count on the line under it */}
                          <div
                            className={`sbp-mx-head is-emp sbp-tone-${toneOf(e.employeeID)}`}
                            title={`${e.employeeName} (${e.employeeID})`}
                          >
                            <span className="sbp-avatar">{initials(e.employeeName || e.employeeID)}</span>
                            <span className="sbp-mx-head-text">
                              <b className="sbp-mx-head-name">{e.employeeName || e.employeeID}</b>
                              <span className="sbp-mx-head-foot">
                                <small>{e.employeeID}</small>
                                <Tick
                                  state={triOf(cells)}
                                  dirty={dirtyOf(cells)}
                                  off={busy || !cells.length}
                                  onClick={() => flip(cells)}
                                  title={t("Every control shown, for this employee")}
                                />
                                <span className="sbp-mx-count">
                                  {countOn(cells)}/{cells.length}
                                </span>
                              </span>
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {shownGroups.map((g) => {
                  const open = !collapsed.has(g.s.key);
                  const cells = screenCells(g);
                  const dirty = dirtyScreens.has(g.s.key);
                  // the screen cell runs down its own row and every control row below it
                  const span = open ? 1 + (g.boxes.length || 1) : 1;
                  return (
                    <tbody key={g.s.key} className="sbp-mx-group">
                      <tr className={`sbp-mx-screen${dirty ? " is-dirty" : ""}`}>
                        {/* column 1: the screen, one cell down all of its rows */}
                        <th
                          rowSpan={span}
                          className="sbp-mx-screencol"
                          onClick={() => toggleGroup(g.s.key)}
                          title={open ? t("Collapse") : t("Expand")}
                        >
                          <div className="sbp-mx-screen-cell">
                            <ChevronRight size={14} className={`sbp-mx-chev${open ? " is-open" : ""}`} />
                            <div className="sbp-mx-screen-main">
                              <span className="sbp-mx-screen-title">
                                <span className={`sbp-box-icon${isPublished(g.s) ? " is-live" : ""}`}>
                                  {isPublished(g.s) ? <Monitor size={12} /> : <Pencil size={12} />}
                                </span>
                                <b className="sbp-mx-screen-name">{g.s.name}</b>
                              </span>
                              <span className="sbp-mx-screen-meta">
                                <span className={`sbp-status-chip${isPublished(g.s) ? " is-live" : ""}`}>
                                  {isPublished(g.s) ? t("Published") : t("Draft")}
                                </span>
                                <span className="sbp-mx-n">
                                  {g.boxes.length} {t("controls")}
                                </span>
                                {dirty ? (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    className="sbp-mx-undo"
                                    title={t("Undo this screen's unsaved changes")}
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      resetScreen(g.s.key);
                                    }}
                                  >
                                    <Undo2 size={12} />
                                  </span>
                                ) : null}
                              </span>
                            </div>
                          </div>
                        </th>
                        {/* column 2 on this row: the whole screen at once */}
                        <th className="sbp-mx-boxcol sbp-mx-sum" onClick={() => toggleGroup(g.s.key)}>
                          <div className="sbp-mx-sum-cell">
                            <b>{t("All controls")}</b>
                            <small>
                              {open ? t("whole screen") : `${g.boxes.length} ${t("hidden — click to show")}`}
                            </small>
                          </div>
                        </th>
                        <td className="sbp-mx-typecol">
                          <span className="sbp-mx-dash">—</span>
                        </td>
                        <td className="sbp-mx-placecol">
                          <span className="sbp-mx-dash">—</span>
                        </td>
                        <td className="sbp-mx-allcol">
                          <Tick
                            state={triOf(cells)}
                            dirty={dirtyOf(cells)}
                            off={busy || !cells.length}
                            onClick={() => flip(cells)}
                            title={t("This whole screen, for every chosen employee")}
                          />
                        </td>
                        {selected.map((e) => {
                          const c = screenEmpCells(g, e.employeeID);
                          return (
                            <td key={e.employeeID} className="sbp-mx-cell">
                              <Tick
                                state={triOf(c)}
                                dirty={dirtyOf(c)}
                                off={busy || !c.length}
                                onClick={() => flip(c)}
                                title={`${t("This whole screen, for")} ${e.employeeName || e.employeeID}`}
                              />
                            </td>
                          );
                        })}
                      </tr>

                      {!open ? null : !g.boxes.length ? (
                        <tr className="sbp-mx-none">
                          <td colSpan={4 + selected.length}>
                            {g.all.length ? (
                              t("No box matches the filter")
                            ) : (
                              <>
                                <ShieldAlert size={13} />{" "}
                                {t("No restricted boxes. In the screen builder, right-click a component and choose “Restrict access…”.")}
                              </>
                            )}
                          </td>
                        </tr>
                      ) : (
                        g.boxes.map((b) => {
                          const rc = rowCells(g.s.key, b.id);
                          return (
                            <tr key={b.id} className="sbp-mx-row">
                              {/* control: its label, and its name in the builder's Layers panel */}
                              <th className="sbp-mx-boxcol" title={b.label !== b.name ? `${b.label} (${b.name})` : b.name}>
                                <div className="sbp-mx-box">
                                  <b className="sbp-mx-box-name">
                                    <Highlight text={b.label} q={boxQ} />
                                  </b>
                                  {b.label !== b.name || b.draftOnly || b.liftedInDraft ? (
                                    <span className="sbp-mx-box-sub">
                                      {b.label !== b.name ? <span className="sbp-node-name">{b.name}</span> : null}
                                      {b.draftOnly ? <span className="sbp-tag is-draft">{t("Not published yet")}</span> : null}
                                      {b.liftedInDraft ? <span className="sbp-tag is-lifted">{t("Lifted in draft")}</span> : null}
                                    </span>
                                  ) : null}
                                </div>
                              </th>
                              <td className="sbp-mx-typecol">
                                <span className={`sbp-mx-type sbp-tone-${typeTone(b.type)}`}>{typeLabel(b.type)}</span>
                              </td>
                              <td
                                className="sbp-mx-placecol"
                                title={b.path.length ? b.path.join(" › ") : t("Top of the screen")}
                              >
                                <span className="sbp-mx-place">
                                  {b.path.length ? (
                                    b.path.map((p, j) => (
                                      <span key={`${p}-${j}`}>
                                        {j ? <ChevronRight size={10} /> : null}
                                        {j === b.path.length - 1 ? <b>{p}</b> : p}
                                      </span>
                                    ))
                                  ) : (
                                    <em>{t("Top of the screen")}</em>
                                  )}
                                </span>
                              </td>
                              <td className="sbp-mx-allcol" onClick={() => flip(rc)}>
                                <Tick
                                  state={triOf(rc)}
                                  dirty={dirtyOf(rc)}
                                  off={busy}
                                  onClick={() => flip(rc)}
                                  title={t("This box, for every chosen employee")}
                                />
                              </td>
                              {selected.map((e) => {
                                const on = has(e.employeeID, g.s.key, b.id);
                                const changed = on !== had(e.employeeID, g.s.key, b.id);
                                const cell = [[e.employeeID, g.s.key, b.id]];
                                return (
                                  <td
                                    key={e.employeeID}
                                    className={`sbp-mx-cell${on ? " is-on" : ""}${changed ? " is-changed" : ""}`}
                                    onClick={() => !busy && setCells(cell, !on)}
                                  >
                                    <Tick
                                      state={on ? "all" : "none"}
                                      dirty={changed}
                                      off={busy}
                                      onClick={() => setCells(cell, !on)}
                                      title={`${b.label} — ${e.employeeName || e.employeeID}: ${on ? t("can see") : t("hidden")}`}
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  );
                })}
                {groups.length > shownGroups.length ? (
                  <tbody>
                    <tr className="sbp-mx-more">
                      <td colSpan={4 + selected.length}>
                        <div className="sbp-mx-more-cell">
                          <span>
                            {t("Showing")} <b>{shownGroups.length}</b> {t("of")} <b>{groups.length}</b> {t("screens")}
                          </span>
                          <Btn tone="blue" small onClick={() => setShownN((n) => n + SCREEN_PAGE)}>
                            <ChevronsUpDown size={12} /> {t("Show")} {Math.min(SCREEN_PAGE, groups.length - shownGroups.length)}{" "}
                            {t("more")}
                          </Btn>
                          <Btn tone="slate" small onClick={() => setShownN(groups.length)}>
                            {t("Show all")}
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                ) : null}
              </table>
            </div>
          )}

          {/* ------------------------------------------------------- footer */}
          <div className="sbp-mx-foot">
            <span className={`sbp-status${changeCount ? " is-dirty" : ""}`}>
              {changeCount ? (
                <>
                  <span className="sbp-dot" /> {changeCount} {t("unsaved change(s)")} · {dirtyScreens.size} {t("screen(s)")} ·{" "}
                  {dirtyEmps.size} {t("employee(s)")}
                </>
              ) : ready && !grantsLoading ? (
                <>
                  <CheckCircle2 size={13} /> {t("All changes saved")}
                </>
              ) : grantsLoading ? (
                <>
                  <Loader2 size={13} className="sbp-spin" /> {t("Loading permissions…")}
                </>
              ) : null}
            </span>
            {changeCount ? (
              <span className="sbp-kbd" title={t("Keyboard shortcut")}>
                <Keyboard size={12} /> Ctrl+S
              </span>
            ) : null}
            <Btn tone="slate" off={!changeCount || saving} onClick={() => setEdits({})}>
              <RotateCcw size={13} /> {t("Reset")}
            </Btn>
            <Btn tone="blue" off={!changeCount || saving} onClick={saveAll}>
              {saving ? <Loader2 size={13} className="sbp-spin" /> : <Save size={13} />}{" "}
              {saving ? t("Saving…") : changeCount ? `${t("Save")} (${changeCount})` : t("Save")}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
