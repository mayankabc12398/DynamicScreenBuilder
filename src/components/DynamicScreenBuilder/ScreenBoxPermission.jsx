/**
 * Screen Box Permission — /screen-box-permission
 *
 * A box marked "Restrict access" in the builder (right-click a component) is
 * hidden at /screen/:id from everyone except the users granted it here and
 * admin roles (API appsettings ScreenBuilder:AccessAdminRoles). Grants live in
 * sb_screen_access, one row per box per user.
 *
 * Boxes are read from both the published screen (what users see) and the
 * draft, so access can be set up before a newly restricted box is published.
 *
 * Two views over the same grants:
 *  - By role (permission/RoleAccessView, the default): role > employee >
 *    screen > the screen's restricted boxes as cards, ticked per employee.
 *  - By box (BoxView, below): screen > box > every active employee as a
 *    checkbox card (loaded once, filtered in the browser).
 *
 * Styled after the Cache Manager (pages/Tools/CacheManager): same spacing,
 * pastel tones and soft buttons. Buttons are spans for the same reason as
 * there — the global theme repaints real <button>s.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import { useTranslation } from "react-i18next";
import {
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  EyeOff,
  Info,
  Lightbulb,
  Loader2,
  Monitor,
  MousePointerClick,
  Pencil,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";
import Heading from "@app/components/UI/Heading";
import { notify } from "@app/utils/utils";
import {
  bindRoleMasterList,
  getRoleEmployees,
  getScreenAccess,
  listScreens,
  saveScreenAccess,
} from "@app/networkServices/screenBuilderApi";
import {
  Btn,
  Highlight,
  idKey,
  idsOf,
  initials,
  loadScreenBoxes,
  normRoles,
  RolePicker,
  toneOf,
  typeLabel,
  uniqueEmployees,
  useFitHeight,
  ViewTabs,
} from "./permission/shared";
import RoleAccessView from "./permission/RoleAccessView";
import "./styles/box-permission.css";

// Employee cards drawn at a time; "Show more" adds this many again. Keeps a
// hospital with thousands of staff from drawing them all on every tick.
const PAGE = 120;

/** Which view the page opened on last, per browser. */
const VIEW_KEY = "sbp.view";

const isPublished = (s) => s?.status === "published";

/**
 * The screen picker: a searchable list grouped into Published and Drafts.
 * The page's own control rather than the app's shared ReactSelect, which every
 * other page uses and is not restyled from here.
 */
function ScreenPicker({ screens, value, onChange, t }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(-1);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const current = screens.find((s) => s.value === value) || null;

  // Published first, then drafts; the filter applies to both.
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const hit = (s) => !needle || s.name.toLowerCase().includes(needle);
    return [
      { key: "published", title: t("Published"), items: screens.filter((s) => isPublished(s) && hit(s)) },
      { key: "draft", title: t("Drafts"), items: screens.filter((s) => !isPublished(s) && hit(s)) },
    ].filter((g) => g.items.length);
  }, [screens, q, t]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => {
    if (!open) return undefined;
    const down = (e) => !rootRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, [open]);

  // Opening: clear the search, focus it and start on the current screen.
  useEffect(() => {
    if (!open) return;
    setQ("");
    setActive(Math.max(0, screens.findIndex((s) => s.value === value)));
    requestAnimationFrame(() => inputRef.current?.focus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => setActive(flat.length ? 0 : -1), [q]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the highlighted row in view.
  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (s) => {
    setOpen(false);
    if (s && s.value !== value) onChange(s.value);
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(flat[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const meta = (s) =>
    [isPublished(s) && s.version ? `v${s.version}` : "", s.updatedOn ? `${t("updated")} ${moment(s.updatedOn).fromNow()}` : ""]
      .filter(Boolean)
      .join(" · ");

  let idx = -1;
  return (
    <div className={`sbp-picker${open ? " is-open" : ""}`} ref={rootRef}>
      <div
        role="combobox"
        tabIndex={0}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="sbp-picker-field"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="sbp-picker-icon">{current && !isPublished(current) ? <Pencil size={14} /> : <Monitor size={14} />}</span>
        <span className="sbp-picker-value">
          <span className={current ? "" : "is-placeholder"}>{current ? current.name : t("Pick a screen…")}</span>
        </span>
        {current ? (
          <span className={`sbp-status-chip${isPublished(current) ? " is-live" : ""}`}>
            {isPublished(current) ? t("Published") : t("Draft")}
          </span>
        ) : null}
        <ChevronDown size={15} className="sbp-picker-chevron" />
      </div>

      {open ? (
        <div className="sbp-picker-panel" role="listbox">
          <div className="sbp-search sbp-picker-search">
            <Search size={13} />
            <input
              ref={inputRef}
              type="text"
              className="sbp-search-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKey}
              placeholder={t("Search screens…")}
            />
            {q ? (
              <span className="sbp-search-clear" role="button" tabIndex={-1} onClick={() => setQ("")}>
                <X size={13} />
              </span>
            ) : null}
          </div>
          <div className="sbp-picker-list" ref={listRef}>
            {groups.map((g) => (
              <div key={g.key}>
                <div className="sbp-picker-group">
                  {g.title}
                  <span className="sbp-count">{g.items.length}</span>
                </div>
                {g.items.map((s) => {
                  idx += 1;
                  const i = idx;
                  const selected = s.value === value;
                  return (
                    <div
                      key={s.value}
                      role="option"
                      aria-selected={selected}
                      data-idx={i}
                      className={`sbp-picker-opt${selected ? " is-selected" : ""}${i === active ? " is-active" : ""}`}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(s)}
                    >
                      <span className={`sbp-picker-opt-icon${isPublished(s) ? " is-live" : ""}`}>
                        {isPublished(s) ? <Monitor size={13} /> : <Pencil size={13} />}
                      </span>
                      <span className="sbp-picker-opt-text">
                        <span className="sbp-picker-opt-name">
                          <Highlight text={s.name} q={q} />
                        </span>
                        {meta(s) ? <small>{meta(s)}</small> : null}
                      </span>
                      {selected ? <Check size={14} className="sbp-picker-check" /> : null}
                    </div>
                  );
                })}
              </div>
            ))}
            {!flat.length ? <div className="sbp-list-none">{t("No screen matches")}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="sbp-main">
      <div className="sbp-list">
        {[0, 1, 2].map((i) => (
          <div className="sbp-skel sbp-skel-card" key={i} />
        ))}
      </div>
      <div className="sbp-detail">
        <div className="sbp-skel sbp-skel-line" style={{ width: "35%" }} />
        <div className="sbp-skel sbp-skel-line" style={{ width: "55%" }} />
        <div className="sbp-skel sbp-skel-input" />
        <div className="sbp-skel sbp-skel-row" />
        <div className="sbp-skel sbp-skel-row" />
      </div>
    </div>
  );
}

/**
 * The page: "By role" (role > employee > screen > boxes, the default) or
 * "By box" (screen > box > employees). Switching views with unsaved changes
 * asks first, the same as switching screens does.
 */
export default function ScreenBoxPermission({ data }) {
  const [t] = useTranslation();
  const [view, setView] = useState(() => {
    try {
      return window.localStorage.getItem(VIEW_KEY) === "box" ? "box" : "role";
    } catch (e) {
      return "role";
    }
  });
  const dirtyRef = useRef(false);
  const onDirty = useCallback((d) => {
    dirtyRef.current = !!d;
  }, []);

  const choose = (next) => {
    if (next === view) return;
    if (dirtyRef.current && !window.confirm(t("You have unsaved changes. Switch view and lose them?"))) return;
    dirtyRef.current = false;
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch (e) {
      /* private window: the view is simply not remembered */
    }
  };

  const tabs = <ViewTabs view={view} onChange={choose} t={t} />;
  return view === "box" ? (
    <BoxView data={data} tabs={tabs} onDirty={onDirty} />
  ) : (
    <RoleAccessView data={data} tabs={tabs} onDirty={onDirty} />
  );
}

/** Screen > restricted box > employees: one box's users at a time. */
function BoxView({ data, tabs, onDirty }) {
  const [t] = useTranslation();
  const [screens, setScreens] = useState([]);
  const pageRef = useRef(null);
  const fitHeight = useFitHeight(pageRef);
  const [screenKey, setScreenKey] = useState("");
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(false);
  // { [nodeId]: [{ employeeID, employeeName }] } — what is on screen now.
  const [granted, setGranted] = useState({});
  // The same as last saved, so a box can say it has unsaved changes.
  const [saved, setSaved] = useState({});
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  // The role the grants are made under: a user sees a box only while logged
  // in under the role it was granted in.
  const [roles, setRoles] = useState([]);
  const [roleId, setRoleId] = useState("");
  useEffect(() => {
    bindRoleMasterList().then((res) => setRoles(normRoles(res?.data)));
  }, []);
  // The role's active employees (f_login), loaded when the role changes.
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empFilter, setEmpFilter] = useState("");
  const [onlySelected, setOnlySelected] = useState(false);
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    setEmployees([]);
    if (!roleId) return undefined;
    let alive = true;
    setEmpLoading(true);
    getRoleEmployees(roleId)
      .then((res) => alive && setEmployees(uniqueEmployees(res?.data)))
      .finally(() => alive && setEmpLoading(false));
    return () => {
      alive = false;
    };
  }, [roleId]);

  // A different box or filter starts the grid from the top again.
  useEffect(() => setShown(PAGE), [selectedId, empFilter, onlySelected, roleId]);

  useEffect(() => {
    listScreens().then((res) => {
      setScreens(
        (Array.isArray(res?.data) ? res.data : []).map((s) => ({
          value: s.screenKey,
          name: s.name || s.screenKey,
          status: s.status,
          version: s.version,
          updatedOn: s.updatedOn,
        })),
      );
    });
  }, []);

  // The screen's restricted boxes, from the published copy and the draft.
  useEffect(() => {
    setBoxes([]);
    setSelectedId("");
    setFilter("");
    if (!screenKey) return undefined;
    let alive = true;
    setLoading(true);
    loadScreenBoxes(screenKey)
      .then((all) => {
        if (!alive) return;
        setBoxes(all);
        setSelectedId(all[0]?.id || "");
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [screenKey]);

  // Who holds each box under the chosen role.
  const [accessLoading, setAccessLoading] = useState(false);
  useEffect(() => {
    setGranted({});
    setSaved({});
    if (!screenKey || !roleId) return undefined;
    let alive = true;
    setAccessLoading(true);
    getScreenAccess(screenKey, roleId)
      .then((accessRes) => {
        if (!alive) return;
        const byNode = {};
        (Array.isArray(accessRes?.data) ? accessRes.data : []).forEach((g) => {
          const id = idKey(g.employeeID);
          const list = (byNode[g.nodeId] = byNode[g.nodeId] || []);
          if (id && !list.some((u) => u.employeeID === id)) list.push({ employeeID: id, employeeName: g.employeeName });
        });
        setGranted(byNode);
        setSaved(byNode);
      })
      .finally(() => alive && setAccessLoading(false));
    return () => {
      alive = false;
    };
  }, [screenKey, roleId]);

  const dirty = useMemo(
    () => Object.fromEntries(boxes.map((b) => [b.id, idsOf(granted[b.id]) !== idsOf(saved[b.id])])),
    [boxes, granted, saved],
  );
  const dirtyBoxes = boxes.filter((b) => dirty[b.id]);
  useEffect(() => onDirty?.(dirtyBoxes.length > 0), [dirtyBoxes.length, onDirty]);

  const shownBoxes = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return boxes;
    return boxes.filter((b) =>
      [b.label, b.name, typeLabel(b.type), ...b.path].some((s) => String(s || "").toLowerCase().includes(q)),
    );
  }, [boxes, filter]);

  const box = boxes.find((b) => b.id === selectedId) || null;
  const users = (box && granted[box.id]) || [];

  const pickScreen = (value) => {
    if (value === screenKey) return;
    if (dirtyBoxes.length && !window.confirm(t("You have unsaved changes. Switch screen and lose them?"))) return;
    setScreenKey(value || "");
  };

  const pickRole = (value) => {
    if (value === roleId) return;
    if (dirtyBoxes.length && !window.confirm(t("You have unsaved changes. Switch role and lose them?"))) return;
    setRoleId(value || "");
  };
  const role = roles.find((r) => r.id === roleId) || null;

  const selectedIds = useMemo(() => new Set(users.map((u) => String(u.employeeID))), [users]);

  // Every employee, plus any granted user no longer active (so they can be
  // unticked); then the filter and "selected only".
  const empList = useMemo(() => {
    const byId = new Map(employees.map((e) => [String(e.employeeID), e]));
    users.forEach((u) => {
      if (!byId.has(String(u.employeeID))) byId.set(String(u.employeeID), u);
    });
    const q = empFilter.trim().toLowerCase();
    return [...byId.values()].filter((e) => {
      if (onlySelected && !selectedIds.has(String(e.employeeID))) return false;
      if (!q) return true;
      return `${e.employeeName || ""} ${e.employeeID}`.toLowerCase().includes(q);
    });
  }, [employees, users, empFilter, onlySelected, selectedIds]);

  const allShownTicked = empList.length > 0 && empList.every((e) => selectedIds.has(String(e.employeeID)));
  const someShownTicked = empList.some((e) => selectedIds.has(String(e.employeeID)));

  const setBoxUsers = (fn) => box && setGranted((prev) => ({ ...prev, [box.id]: fn(prev[box.id] || []) }));

  const toggleUser = (emp) =>
    setBoxUsers((list) => {
      const id = String(emp.employeeID);
      return list.some((u) => String(u.employeeID) === id)
        ? list.filter((u) => String(u.employeeID) !== id)
        : [...list, { employeeID: id, employeeName: emp.employeeName || "" }];
    });

  // "All employees": ticks every employee the filter shows, or clears them
  // when they are all ticked already.
  const toggleAll = () =>
    setBoxUsers((list) => {
      const shownIds = new Set(empList.map((e) => String(e.employeeID)));
      if (allShownTicked) return list.filter((u) => !shownIds.has(String(u.employeeID)));
      const have = new Set(list.map((u) => String(u.employeeID)));
      return [
        ...list,
        ...empList
          .filter((e) => !have.has(String(e.employeeID)))
          .map((e) => ({ employeeID: String(e.employeeID), employeeName: e.employeeName || "" })),
      ];
    });

  const resetBox = () => box && setGranted((prev) => ({ ...prev, [box.id]: saved[box.id] || [] }));

  const saveBoxes = async (list) => {
    if (!list.length || saving || !roleId) return;
    setSaving(true);
    let failed = 0;
    for (const b of list) {
      const next = granted[b.id] || [];
      const res = await saveScreenAccess({
        screenKey,
        nodeId: b.id,
        nodeName: b.name,
        roleID: roleId,
        users: next.map((u) => ({ employeeID: String(u.employeeID), employeeName: u.employeeName || "" })),
      });
      if (res?.success) setSaved((prev) => ({ ...prev, [b.id]: next }));
      else {
        failed += 1;
        notify(res?.message || t("Access could not be saved."), "error");
      }
    }
    setSaving(false);
    if (!failed) notify(list.length > 1 ? t("All changes saved.") : t("Access saved."), "success");
  };

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
          {/* one line: title, chips, then the subtitle, which shortens with "…" */}
          <div className="sbp-title-main">
            <span className="sbp-title-text">{t("Screen Box Permission")}</span>
            {tabs}
            {screenKey && !loading ? (
              <span className="sbp-pill">
                <ShieldCheck size={12} /> {boxes.length} {t("restricted")}
              </span>
            ) : null}
            {dirtyBoxes.length ? (
              <span className="sbp-pill is-dirty">
                <span className="sbp-dot" /> {dirtyBoxes.length} {t("unsaved")}
              </span>
            ) : null}
            <span className="sbp-subtitle">· {t("Choose which users of a role can see restricted boxes.")}</span>
          </div>
        </div>
        <div className="sbp-actions">
          <div className="sbp-pick sbp-pick-role">
            <RolePicker roles={roles} value={roleId} onChange={pickRole} t={t} />
          </div>
          <div className="sbp-pick">
            <ScreenPicker screens={screens} value={screenKey} onChange={pickScreen} t={t} />
          </div>
          {dirtyBoxes.length > 1 ? (
            <Btn tone="green" off={saving} onClick={() => saveBoxes(dirtyBoxes)}>
              <Save size={14} /> {t("Save all")} ({dirtyBoxes.length})
            </Btn>
          ) : null}
        </div>
      </div>

      <div className="sbp-body">
        {!roleId ? (
          <div className="sbp-empty sbp-tone-violet">
            <span className="sbp-empty-icon">
              <Briefcase size={22} />
            </span>
            <b>{t("Pick a role")}</b>
            <small>{t("Grants are per role: a user sees a box only while logged in under the role it was granted in.")}</small>
          </div>
        ) : !screenKey ? (
          <div className="sbp-empty sbp-tone-blue">
            <span className="sbp-empty-icon">
              <Monitor size={22} />
            </span>
            <b>{t("Pick a screen")}</b>
            <small>{t("Its restricted boxes and who in this role can see them will show here.")}</small>
          </div>
        ) : loading || accessLoading ? (
          <Skeleton />
        ) : !boxes.length ? (
          <div className="sbp-empty sbp-tone-amber">
            <span className="sbp-empty-icon">
              <ShieldAlert size={22} />
            </span>
            <b>{t("No restricted boxes on this screen")}</b>
            <small>{t("In the screen builder, right-click a component and choose “Restrict access…”.")}</small>
          </div>
        ) : (
          <>
            {/* -------------------------------------------- list + detail */}
            <div className="sbp-main">
              <div className="sbp-side">
                <div className="sbp-side-label">
                  {t("Restricted boxes")}
                  <span className="sbp-count">{boxes.length}</span>
                </div>
                <div className="sbp-search sbp-box-search">
                  <Search size={13} />
                  <input
                    type="text"
                    className="sbp-search-input"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder={t("Filter boxes…")}
                  />
                  {filter ? (
                    <span className="sbp-search-clear" role="button" tabIndex={0} onClick={() => setFilter("")}>
                      <X size={13} />
                    </span>
                  ) : null}
                </div>
              <div className="sbp-list">
                {shownBoxes.map((b, i) => {
                  const count = (granted[b.id] || []).length;
                  return (
                    <div
                      key={b.id}
                      role="button"
                      tabIndex={0}
                      className={`sbp-box sbp-tone-amber${b.id === selectedId ? " is-active" : ""}`}
                      style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                      onClick={() => setSelectedId(b.id)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedId(b.id)}
                    >
                      <div className="sbp-box-head">
                        <div className="sbp-box-icon">
                          <ShieldCheck size={12} />
                        </div>
                        <div className="sbp-box-name" title={b.label !== b.name ? `${b.label} (${b.name})` : b.name}>
                          {b.label}
                        </div>
                        <span className="sbp-box-type">{typeLabel(b.type)}</span>
                        {dirty[b.id] ? <span className="sbp-dot" title={t("Unsaved changes")} /> : null}
                        <span className={`sbp-box-count${count ? "" : " is-none"}`} title={t("Users who can see it")}>
                          <User size={11} /> {count}
                        </span>
                      </div>
                      {/* a second line only for the publish-state tags */}
                      {b.draftOnly || b.liftedInDraft ? (
                        <div className="sbp-box-foot">
                          {b.draftOnly ? <span className="is-draft">{t("Not published yet")}</span> : null}
                          {b.liftedInDraft ? <span className="is-lifted">{t("Lifted in draft")}</span> : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                {!shownBoxes.length ? <div className="sbp-list-none">{t("No box matches")}</div> : null}
              </div>
              </div>

              {box ? (
                <div className="sbp-detail" key={box.id}>
                  {/* one strip: the box, then the employee controls */}
                  <div className="sbp-detail-head">
                    <div className="sbp-detail-icon">
                      <ShieldCheck size={13} />
                    </div>
                    <div className="sbp-detail-title">
                      <b>{box.label}</b>
                      <span className="sbp-type">{typeLabel(box.type)}</span>
                      {box.label !== box.name ? (
                        <span className="sbp-node-name" title={t("Name in the screen builder's Layers panel")}>
                          {box.name}
                        </span>
                      ) : null}
                      <small className="sbp-crumbs">
                        {box.path.length
                          ? box.path.map((p, i) => (
                              <span key={`${p}-${i}`}>
                                {p}
                                {i < box.path.length - 1 ? <ChevronRight size={10} /> : null}
                              </span>
                            ))
                          : t("Top of the screen")}
                      </small>
                    </div>
                    <span className="sbp-head-divider" />
                    <div className="sbp-emp-bar">
                      <span
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={allShownTicked ? "true" : someShownTicked ? "mixed" : "false"}
                        className={`sbp-all${allShownTicked ? " is-on" : someShownTicked ? " is-some" : ""}${
                          empList.length ? "" : " is-off"
                        }`}
                        onClick={() => empList.length && toggleAll()}
                        onKeyDown={(e) => {
                          if ((e.key === "Enter" || e.key === " ") && empList.length) {
                            e.preventDefault();
                            toggleAll();
                          }
                        }}
                      >
                        <span className="sbp-check">
                          {allShownTicked ? <Check size={12} /> : someShownTicked ? <span className="sbp-check-dash" /> : null}
                        </span>
                        {empFilter.trim() || onlySelected ? t("All shown") : t("All")}
                        <b>{empList.length}</b>
                      </span>
                      <div className="sbp-search sbp-emp-search">
                        <Search size={13} />
                        <input
                          type="text"
                          className="sbp-search-input"
                          value={empFilter}
                          onChange={(e) => setEmpFilter(e.target.value)}
                          placeholder={t("Filter employees by name or ID…")}
                        />
                        {empFilter ? (
                          <span className="sbp-search-clear" role="button" tabIndex={0} onClick={() => setEmpFilter("")}>
                            <X size={13} />
                          </span>
                        ) : null}
                      </div>
                      <label className="sbp-only">
                        <input type="checkbox" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)} />
                        <span className="sbp-switch" />
                        {t("Selected only")}
                      </label>
                      <span className="sbp-selected" title={t("Selected")}>
                        <Users size={13} /> <b>{users.length}</b>/{employees.length}
                      </span>
                    </div>
                  </div>

                  {box.draftOnly ? (
                    <div className="sbp-note sbp-tone-amber">
                      <Info size={13} />
                      {t("Restricted in the draft only. It applies to users once the screen is published.")}
                    </div>
                  ) : null}
                  {box.liftedInDraft ? (
                    <div className="sbp-note sbp-tone-slate">
                      <Info size={13} />
                      {t("The draft no longer restricts this box. It opens to everyone on the next publish.")}
                    </div>
                  ) : null}

                  {!users.length ? (
                    <div className="sbp-note sbp-tone-red">
                      <EyeOff size={14} />
                      <div>
                        <b>{t("Hidden from everyone")}</b> — {role ? `${t("no one in")} ${role.name} ${t("sees this box until you tick users (admin roles always do).")}` : t("only admin roles see this box until you tick users.")}
                      </div>
                    </div>
                  ) : null}

                  {empLoading ? (
                    <div className="sbp-emps">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div className="sbp-skel sbp-skel-row" key={i} />
                      ))}
                    </div>
                  ) : empList.length ? (
                    <>
                      <div className="sbp-emps">
                        {empList.slice(0, shown).map((e) => {
                          const id = String(e.employeeID);
                          const on = selectedIds.has(id);
                          return (
                            <div
                              key={id}
                              role="checkbox"
                              tabIndex={0}
                              aria-checked={on}
                              className={`sbp-emp sbp-tone-${toneOf(id)}${on ? " is-on" : ""}`}
                              onClick={() => toggleUser(e)}
                              onKeyDown={(ev) => {
                                if (ev.key === "Enter" || ev.key === " ") {
                                  ev.preventDefault();
                                  toggleUser(e);
                                }
                              }}
                              title={`${e.employeeName || id} (${id})`}
                            >
                              <span className="sbp-check">{on ? <Check size={12} /> : null}</span>
                              <span className="sbp-avatar">{initials(e.employeeName || id)}</span>
                              <span className="sbp-emp-text">
                                <span className="sbp-user-name">{e.employeeName || id}</span>
                                <span className="sbp-emp-id">{id}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {empList.length > shown ? (
                        <div className="sbp-more">
                          <Btn tone="slate" small onClick={() => setShown((n) => n + PAGE)}>
                            {t("Show more")} ({empList.length - shown})
                          </Btn>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="sbp-list-none">
                      {onlySelected ? t("Nobody is ticked yet.") : t("No employee matches.")}
                    </div>
                  )}

                  <div className="sbp-detail-foot">
                    <span className={`sbp-status${dirty[box.id] ? " is-dirty" : ""}`}>
                      {dirty[box.id] ? (
                        <>
                          <span className="sbp-dot" /> {t("Unsaved changes")}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} /> {t("All changes saved")}
                        </>
                      )}
                    </span>
                    <Btn tone="slate" off={!dirty[box.id] || saving} onClick={resetBox}>
                      <RotateCcw size={13} /> {t("Reset")}
                    </Btn>
                    <Btn tone="blue" off={!dirty[box.id] || saving} onClick={() => saveBoxes([box])}>
                      {saving ? <Loader2 size={13} className="sbp-spin" /> : <Save size={13} />}{" "}
                      {saving ? t("Saving…") : t("Save changes")}
                    </Btn>
                  </div>
                </div>
              ) : (
                <div className="sbp-detail sbp-detail-none">{t("Select a box on the left.")}</div>
              )}
            </div>
          </>
        )}

        {/* ------------------------------------------------------ good to know */}
        <div className="sbp-tips sbp-tone-amber">
          <div className="sbp-tips-head">
            <Lightbulb size={14} /> {t("Good to know")}
          </div>
          <ul>
            <li>
              <MousePointerClick size={12} /> {t("In the screen builder, right-click a box and choose “Restrict access…”, then publish.")}
            </li>
            <li>
              <EyeOff size={12} /> {t("Grants hold for the chosen role only. “All” ticks every current employee of the role; people who join it later need ticking too.")}
            </li>
            <li>
              <Clock size={12} /> {t("Changes apply the next time the user opens the screen.")}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
