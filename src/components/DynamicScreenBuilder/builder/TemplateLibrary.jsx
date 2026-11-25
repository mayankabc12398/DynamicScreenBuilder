/**
 * Template & screen library: search, categories, thumbnails, duplicate,
 * version history with restore — and screens filed by module.
 *
 * A module is a role from the app's own role list (the "Select Your Role"
 * dialog: Front Office, Laboratory Management, Pharmacy…). A screen is filed
 * under any number of them, the Modules rail filters by one (a screen shows
 * under each of its modules), and each module wears the colour
 * family the role picker gives it (layouts/header/role-change-modal/
 * roleFamilies), so Front Office reads violet here as it does there.
 *
 * The modules are stored on the server (sb_screen_module, many to many) and in
 * the screen document, so they survive an export.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Icon from "../registry/icons";
import Tap from "./Tap";
import ScreenAccessModal from "./ScreenAccessModal";
import useScrollLock from "./useScrollLock";
import useSmoothClose from "./useSmoothClose";
import copyText from "@app/components/apibuilder/common/clipboard";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import { GetRoleListByEmployeeIDAndCentreID } from "@app/store/reducers/common/CommonExportFunction";
import { FAMILIES, resolveFamily, resolveRoleIcon } from "@app/layouts/header/role-change-modal/roleFamilies";
import { modulesOf, ScreenRepo, TemplateRepo } from "../utils/storage";
import { flatten } from "../utils/tree";

/** "12 Oct 2026" (or with the time, for tooltips); "" when the value is not a date. */
function fmtDate(value, withTime = false) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return "";
  const day = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return withTime ? `${day}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : day;
}

/** A role as a module: id, name, its colour family and its icon. */
function asModule(role) {
  if (!role) return null;
  const id = String(role.roleID ?? role.id ?? "");
  const name = String(role.roleName ?? role.name ?? "").trim();
  if (!id && !name) return null;
  const fam = FAMILIES[resolveFamily(name)] || FAMILIES.general;
  return {
    id,
    name: name || `Module ${id}`,
    family: fam,
    Icon: resolveRoleIcon({ roleName: name, iconSVG: role.iconSVG }),
  };
}

const FILTER_KEY = "dsb.lib.module";
const readPref = () => {
  try {
    return window.localStorage.getItem(FILTER_KEY) || "all";
  } catch {
    return "all";
  }
};
const writePref = (v) => {
  try {
    window.localStorage.setItem(FILTER_KEY, v);
  } catch {
    /* private mode: the filter just is not remembered */
  }
};

/** Title-case the role list's UPPERCASE names for a calmer list. */
const pretty = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(Opd|Ipd|Emr|Mrd|Ot|Mis|Ivf|Hr)\b/g, (m) => m.toUpperCase());

function ModuleBadge({ mod, small = false }) {
  if (!mod) {
    return (
      <span className={`dsb-mod-badge is-none${small ? " is-sm" : ""}`}>
        <Icon name="FolderOpen" size={11} /> Unassigned
      </span>
    );
  }
  const I = mod.Icon;
  return (
    <span
      className={`dsb-mod-badge${small ? " is-sm" : ""}`}
      style={{ color: mod.family.accent, background: `${mod.family.accent}14`, borderColor: `${mod.family.accent}33` }}
      title={mod.name}
    >
      {I ? <I size={11} strokeWidth={2.2} /> : null}
      <span>{pretty(mod.name)}</span>
    </span>
  );
}

/**
 * The modules a screen is filed under, as badges: the first `max`, then "+N"
 * with the rest in its tooltip so a card stays one line.
 */
function ModuleBadges({ mods, max = 2 }) {
  if (!mods.length) return <ModuleBadge mod={null} small />;
  const rest = mods.slice(max);
  return (
    <>
      {mods.slice(0, max).map((m) => (
        <ModuleBadge key={m.id} mod={m} small />
      ))}
      {rest.length ? (
        <span className="dsb-mod-badge is-sm is-more" title={rest.map((m) => pretty(m.name)).join(", ")}>
          +{rest.length}
        </span>
      ) : null}
    </>
  );
}

/**
 * Pick the modules for a screen — the role picker's grid in miniature, with the
 * same colours. Several can be ticked; nothing is saved until Save.
 */
function ModulePicker({ modules, current, screenName, onSave, onClose: closeNow }) {
  const [closing, onClose] = useSmoothClose(closeNow);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(() => new Set(current.map((m) => m.id)));
  const inputRef = useRef(null);
  useEffect(() => inputRef.current?.focus(), []);
  const shown = modules.filter((m) => m.name.toLowerCase().includes(q.trim().toLowerCase()));
  const toggle = (id) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const before = current.map((m) => m.id).sort().join("|");
  const after = [...picked].sort().join("|");
  const save = () => onSave(modules.filter((m) => picked.has(m.id)));
  return (
    <div className={`dsb-modpick-root${closing ? " is-closing" : ""}`} onClick={onClose}>
      <div className="dsb-modpick" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="File under modules">
        <header>
          <div>
            <strong>File under modules</strong>
            <span>{screenName}</span>
          </div>
          <span className="dsb-modpick-n">{picked.size} selected</span>
          <Tap className="dsb-modpick-x" onClick={onClose} aria-label="Close">
            <Icon name="X" size={15} />
          </Tap>
        </header>
        <div className="dsb-modpick-search">
          <Icon name="Search" size={13} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search module… (Enter ticks the first)"
            onKeyDown={(e) => {
              if (e.key === "Enter" && shown.length) toggle(shown[0].id);
              if (e.key === "Escape") onClose();
            }}
          />
        </div>
        <div className="dsb-modpick-grid">
          {shown.map((m) => {
            const I = m.Icon;
            const on = picked.has(m.id);
            return (
              <Tap
                key={m.id || m.name}
                role="checkbox"
                aria-checked={on}
                className={`dsb-modpick-item${on ? " is-on" : ""}`}
                onClick={() => toggle(m.id)}
                style={{ "--mod": m.family.accent, "--mod-a": m.family.grad[0], "--mod-b": m.family.grad[1] }}
              >
                <span className="dsb-modpick-ic">{I ? <I size={16} strokeWidth={2.2} /> : null}</span>
                <span className="dsb-modpick-name">{pretty(m.name)}</span>
                <span className={`dsb-modpick-tick${on ? " is-on" : ""}`}>{on ? <Icon name="Check" size={12} /> : null}</span>
              </Tap>
            );
          })}
          {!shown.length ? <div className="dsb-lib-empty">No module matches “{q}”.</div> : null}
        </div>
        <footer>
          {picked.size ? (
            <Tap className="dsb-modpick-clear" onClick={() => setPicked(new Set())}>
              <Icon name="X" size={13} /> Clear all
            </Tap>
          ) : (
            <span className="dsb-modpick-hint">Tick one or more modules.</span>
          )}
          <span style={{ flex: 1 }} />
          <Tap className="dsb-modpick-cancel" onClick={onClose}>
            Cancel
          </Tap>
          <Tap className="dsb-modpick-save" onClick={save} disabled={before === after}>
            <Icon name="Check" size={13} /> Save
          </Tap>
        </footer>
      </div>
    </div>
  );
}

export default function TemplateLibrary({ onClose: closeNow, onOpen, currentScreen, onSaveAsTemplate, onModulesChange }) {
  const [tab, setTab] = useState("screens");
  const [screens, setScreens] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  // The card whose Delete has been armed. Deleting is irreversible and the
  // button sits next to Open, so it takes two clicks — and the second one
  // says what it will destroy rather than relying on a browser dialog that
  // this modal cannot style and that reads as a page-level alert.
  const [armed, setArmed] = useState("");

  // ── Modules: the app's role list ──────────────────────────────────────
  const dispatch = useDispatch();
  const roleList = useSelector((s) => s?.CommonSlice?.GetRoleList);
  const userData = useLocalStorage("userData", "get");
  useEffect(() => {
    // The header loads it on sign-in; a builder opened in a fresh tab may not
    // have it yet.
    if (Array.isArray(roleList) && roleList.length) return;
    const centreID = userData?.defaultCentre || userData?.centreID;
    if (userData?.employeeID && centreID) {
      dispatch(GetRoleListByEmployeeIDAndCentreID({ employeeID: userData.employeeID, centreID }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [moduleFilter, setModuleFilter] = useState(readPref);
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("recent");
  const [picking, setPicking] = useState(null); // the screen whose module is being picked
  const [busy, setBusy] = useState("");
  // The page behind stays put while the library (and anything opened from it) is up.
  const rootRef = useRef(null);
  useScrollLock(rootRef);
  const [closing, onClose] = useSmoothClose(closeNow);
  const [accessFor, setAccessFor] = useState(null); // the screen whose page access is being set

  // An armed button that is left alone disarms itself: coming back to a screen
  // list minutes later and clicking what looks like a delete button should not
  // delete anything.
  useEffect(() => {
    if (!armed) return undefined;
    const t = setTimeout(() => setArmed(""), 5000);
    return () => clearTimeout(t);
  }, [armed]);

  const reload = async () => {
    setLoading(true);
    try {
      setScreens(await ScreenRepo.list());
      setTemplates(await TemplateRepo.list());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen?.id]);

  /**
   * Every module there is to pick from: the user's roles, plus any module a
   * screen is already filed under that this user does not hold — so a screen
   * filed by someone else still has its badge and its rail entry.
   */
  const modules = useMemo(() => {
    const byId = new Map();
    (Array.isArray(roleList) ? roleList : []).forEach((r) => {
      const m = asModule(r);
      if (m && !byId.has(m.id)) byId.set(m.id, m);
    });
    screens.forEach((s) => {
      (modulesOf(s) || []).forEach((ref) => {
        if (!byId.has(String(ref.id))) {
          const m = asModule({ roleID: ref.id, roleName: ref.name });
          if (m) byId.set(m.id, m);
        }
      });
    });
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [roleList, screens]);
  /** A screen's modules as the rail knows them — colour, icon and all. */
  const modsOf = (doc) =>
    (modulesOf(doc) || []).map((ref) => modules.find((m) => m.id === String(ref.id)) || asModule({ roleID: ref.id, roleName: ref.name })).filter(Boolean);
  const idsOf = (doc) => (modulesOf(doc) || []).map((m) => String(m.id));

  // A screen in three modules counts once in each of them.
  const counts = useMemo(() => {
    const c = { all: screens.length, none: 0 };
    screens.forEach((s) => {
      const ids = idsOf(s);
      if (!ids.length) c.none += 1;
      ids.forEach((id) => {
        c[id] = (c[id] || 0) + 1;
      });
    });
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screens]);

  const pickFilter = (v) => {
    setModuleFilter(v);
    writePref(v);
  };
  // A remembered module that no longer has screens falls back to All.
  const activeFilter = moduleFilter === "all" || moduleFilter === "none" || counts[moduleFilter] ? moduleFilter : "all";

  const search = (list) => {
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter(
      (s) =>
        String(s.name).toLowerCase().includes(t) ||
        String(s.category || "").toLowerCase().includes(t) ||
        (modulesOf(s) || []).some((m) => String(m.name || "").toLowerCase().includes(t)) ||
        String(s.id || "").toLowerCase().includes(t),
    );
  };

  const shownScreens = useMemo(() => {
    let list = search(screens);
    if (activeFilter === "none") list = list.filter((s) => !idsOf(s).length);
    else if (activeFilter !== "all") list = list.filter((s) => idsOf(s).includes(activeFilter));
    if (status !== "all") list = list.filter((s) => (s.status || "draft") === status);
    if (sort === "name") list = [...list].sort((a, b) => String(a.name).localeCompare(String(b.name)));
    else if (sort === "module") {
      const firstName = (d) => String((modulesOf(d) || []).map((m) => m.name).sort()[0] || "~");
      list = [...list].sort((a, b) => firstName(a).localeCompare(firstName(b)) || String(a.name).localeCompare(String(b.name)));
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screens, q, activeFilter, status, sort]);

  const list = tab === "screens" ? shownScreens : tab === "templates" ? search(templates) : [];

  /** File a screen under these modules (replacing its old set), shown at once. */
  const fileUnder = async (doc, mods) => {
    setPicking(null);
    const refs = (mods || []).map((m) => ({ id: m.id, name: m.name }));
    const before = screens;
    setBusy(doc.id);
    // Shown straight away; put back if the save fails.
    setScreens((all) => all.map((s) => (s.id === doc.id ? { ...s, modules: refs, module: undefined } : s)));
    try {
      await ScreenRepo.setModules(doc, refs);
      if (doc.id === currentScreen?.id) onModulesChange?.(refs);
      toast.success(
        refs.length
          ? `${doc.name} → ${refs.length === 1 ? pretty(refs[0].name) : `${refs.length} modules`}`
          : `${doc.name} removed from every module`,
      );
    } catch (e) {
      setScreens(before);
      toast.error(e?.message || "Could not change the modules");
    } finally {
      setBusy("");
    }
  };

  /**
   * Delete one screen or template.
   *
   * Both repos remove the server record first and the local mirror second, so a
   * failed call leaves the row listed rather than hiding something that still
   * exists on the server.
   */
  const remove = async (doc) => {
    const repo = tab === "screens" ? ScreenRepo : TemplateRepo;
    try {
      await repo.remove(doc.id);
      toast.success(`Deleted ${doc.name}`);
    } catch (e) {
      toast.error(e?.message || "Could not delete it");
    }
    setArmed("");
    reload();
  };

  const railModules = modules.filter((m) => counts[m.id]);
  const idleModules = modules.filter((m) => !counts[m.id]);

  return (
    <div ref={rootRef} className={`dsb-modal-root is-lib${closing ? " is-closing" : ""}`} onClick={onClose}>
      <div className={`dsb-lib${tab === "screens" ? " has-rail" : ""}`} onClick={(e) => e.stopPropagation()}>
        <header className="dsb-lib-head">
          <div className="dsb-lib-tabs">
            <button type="button" className={tab === "screens" ? "is-on" : ""} onClick={() => setTab("screens")}>
              <Icon name="Layers" size={13} /> Screens <span>{screens.length}</span>
            </button>
            <button type="button" className={tab === "templates" ? "is-on" : ""} onClick={() => setTab("templates")}>
              <Icon name="SquareStack" size={13} /> Templates <span>{templates.length}</span>
            </button>
          </div>
          {tab === "screens" ? (
            <div className="dsb-lib-filters is-head">
              <div className="dsb-seg-chips" role="radiogroup" aria-label="Status">
                {[
                  ["all", "All"],
                  ["draft", "Draft"],
                  ["published", "Published"],
                ].map(([v, label]) => (
                  <Tap
                    key={v}
                    role="radio"
                    aria-checked={status === v}
                    className={`dsb-chip${status === v ? " is-on" : ""} is-${v}`}
                    onClick={() => setStatus(v)}
                  >
                    {label}
                  </Tap>
                ))}
              </div>
              <div className="dsb-seg-chips" role="radiogroup" aria-label="Sort">
                <span className="dsb-lib-filters-l">Sort</span>
                {[
                  ["recent", "Recent"],
                  ["name", "Name"],
                  ["module", "Module"],
                ].map(([v, label]) => (
                  <Tap
                    key={v}
                    role="radio"
                    aria-checked={sort === v}
                    className={`dsb-chip${sort === v ? " is-on" : ""}`}
                    onClick={() => setSort(v)}
                  >
                    {label}
                  </Tap>
                ))}
              </div>
              <span className="dsb-lib-filters-n">
                {shownScreens.length} of {screens.length}
              </span>
            </div>
          ) : null}

          <div className="dsb-lib-search">
            <Icon name="Search" size={13} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search screens, modules…" />
            {q ? (
              <Tap className="dsb-lib-search-x" onClick={() => setQ("")} aria-label="Clear search">
                <Icon name="X" size={12} />
              </Tap>
            ) : null}
          </div>
          <button type="button" className="dsb-icon-btn" onClick={onClose}>
            <Icon name="X" size={16} />
          </button>
        </header>

        <div className="dsb-lib-main">
          {/* ── Modules rail (screens tab) ─────────────────────────────── */}
          {tab === "screens" ? (
            <nav className="dsb-mod-rail" aria-label="Modules">
              <div className="dsb-mod-rail-title">Modules</div>
              <Tap className={`dsb-mod-item${activeFilter === "all" ? " is-on" : ""}`} onClick={() => pickFilter("all")}>
                <span className="dsb-mod-dot is-all">
                  <Icon name="LayoutGrid" size={12} />
                </span>
                <span className="dsb-mod-name">All screens</span>
                <span className="dsb-mod-count">{counts.all}</span>
              </Tap>
              <Tap className={`dsb-mod-item${activeFilter === "none" ? " is-on" : ""}`} onClick={() => pickFilter("none")}>
                <span className="dsb-mod-dot is-none">
                  <Icon name="FolderOpen" size={12} />
                </span>
                <span className="dsb-mod-name">Unassigned</span>
                <span className="dsb-mod-count">{counts.none}</span>
              </Tap>
              {railModules.length ? <div className="dsb-mod-rail-sep" /> : null}
              {railModules.map((m) => {
                const I = m.Icon;
                return (
                  <Tap
                    key={m.id}
                    className={`dsb-mod-item${activeFilter === m.id ? " is-on" : ""}`}
                    onClick={() => pickFilter(m.id)}
                    style={{ "--mod": m.family.accent, "--mod-a": m.family.grad[0], "--mod-b": m.family.grad[1] }}
                    title={m.name}
                  >
                    <span className="dsb-mod-dot">{I ? <I size={12} strokeWidth={2.3} /> : null}</span>
                    <span className="dsb-mod-name">{pretty(m.name)}</span>
                    <span className="dsb-mod-count">{counts[m.id]}</span>
                  </Tap>
                );
              })}
              {idleModules.length ? (
                <div className="dsb-mod-rail-hint">
                  {idleModules.length} more module{idleModules.length === 1 ? "" : "s"} with no screens yet — file a screen under one from
                  its card.
                </div>
              ) : null}
            </nav>
          ) : null}

          <div className="dsb-lib-body">
            {
              <div className="dsb-lib-grid">
                {loading && !list.length
                  ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="dsb-lib-card dsb-tc is-ghost" />)
                  : null}
                {list.map((doc) => {
                  const mods = tab === "screens" ? modsOf(doc) : [];
                  // The module the rail is on leads, so a card reads in the colour it was found by.
                  const mod = mods.find((m) => m.id === activeFilter) || mods[0] || null;
                  const isOpenNow = doc.id === currentScreen?.id;
                  const tone = mod?.family.accent || "#64748b";
                  const fields = Math.max(0, flatten(doc.root).length - 1);
                  const status = doc.status || (tab === "screens" ? "draft" : "template");
                  // Built = the row's CreatedOn; templates and browser-only screens carry
                  // just the last save, so that stands in for it.
                  const built = doc.createdAt || doc.updatedAt;
                  const edited = doc.createdAt ? doc.updatedAt : null;
                  const duplicate = async () => {
                    if (tab === "screens") {
                      const copy = await ScreenRepo.duplicate(doc.id);
                      if (copy) onOpen(copy);
                    } else {
                      const copy = JSON.parse(JSON.stringify(doc));
                      copy.id = `scr_${Date.now().toString(36)}`;
                      copy.name = `${doc.name} (from template)`;
                      copy.status = "draft";
                      // Made while a module is picked on the rail: filed there.
                      const railMod = modules.find((m) => m.id === activeFilter);
                      copy.modules = railMod ? [{ id: railMod.id, name: railMod.name }] : [];
                      delete copy.module;
                      await ScreenRepo.save(copy);
                      onOpen(copy);
                    }
                  };
                  const copyLink = async () => {
                    const route = `/screen/${doc.id}`;
                    // copyText, not navigator.clipboard: the clipboard object only
                    // exists in a secure context, so on a server reached over plain
                    // http this button copied nothing while it worked on localhost.
                    const ok = await copyText(route);
                    if (ok) toast.success(`Copied ${route}`);
                    // Nothing reached the clipboard — showing the route is still
                    // better than nothing.
                    else toast.info(route);
                  };
                  return (
                    <div
                      key={doc.id}
                      className={`dsb-lib-card dsb-tc is-${status}${mod ? " has-mod" : ""}${isOpenNow ? " is-current" : ""}`}
                      style={{ "--c": tone, "--cl": `${tone}59`, "--cb": `${tone}0d` }}
                      onDoubleClick={() => onOpen(doc)}
                    >
                      <div className="dsb-tc-band">
                        {tab === "screens" ? (
                          <span className="dsb-tc-lead">
                            <Tap
                              className="dsb-tc-mods"
                              onClick={() => setPicking(doc)}
                              title={
                                mods.length
                                  ? `Modules: ${mods.map((m) => pretty(m.name)).join(", ")} — click to change`
                                  : "File this screen under one or more modules"
                              }
                              disabled={busy === doc.id}
                            >
                              <ModuleBadges mods={mods} />
                              <span className="dsb-tc-modedit">
                                <Icon name={busy === doc.id ? "Loader" : "Pencil"} size={11} />
                              </span>
                            </Tap>
                            <Tap
                              className="dsb-tc-access"
                              onClick={() => setAccessFor(doc)}
                              title="Set who can open this screen: module → roles → employees"
                            >
                              <Icon name="ShieldCheck" size={11} /> Access
                            </Tap>
                          </span>
                        ) : (
                          <span className="dsb-tc-mods">
                            <span className="dsb-mod-badge is-sm is-none">
                              <Icon name="LayoutGrid" size={11} /> {doc.category || "General"}
                            </span>
                          </span>
                        )}
                        <span className="dsb-tc-pills">
                          {isOpenNow ? <span className="dsb-tc-status is-open">open</span> : null}
                          <span className={`dsb-tc-status is-${status}`}>
                            <i className="dsb-tc-dot" />
                            {status === "published" ? `v${doc.version || 1} live` : status}
                          </span>
                        </span>
                      </div>
                      <div className="dsb-tc-body">
                        <h3 title={doc.name}>{doc.name}</h3>
                        <code>{doc.id}</code>
                        {built ? (
                          <span
                            className="dsb-tc-date"
                            title={[
                              `Built ${fmtDate(built, true)}${doc.createdBy ? ` by ${doc.createdBy}` : ""}`,
                              edited ? `Last edited ${fmtDate(edited, true)}${doc.updatedBy ? ` by ${doc.updatedBy}` : ""}` : "",
                            ]
                              .filter(Boolean)
                              .join("\n")}
                          >
                            <Icon name="CalendarDays" size={11} />
                            {doc.createdAt ? "Built" : "Updated"} {fmtDate(built)}
                            {edited && fmtDate(edited) !== fmtDate(built) ? <em>· edited {fmtDate(edited)}</em> : null}
                          </span>
                        ) : null}
                      </div>
                      <div className="dsb-tc-tags">
                        <span className="dsb-tc-tag is-count" title={`${fields} component${fields === 1 ? "" : "s"} on this screen`}>
                          <Icon name="Layers" size={11} /> {fields}
                        </span>
                        <span className="dsb-tc-tag" title="Version">
                          <Icon name="History" size={11} /> v{doc.version || 1}
                        </span>
                        {tab === "screens" ? (
                          <span className="dsb-tc-tag is-route" title={`Route /screen/${doc.id}`}>
                            <Icon name="Link2" size={11} /> <span>/screen/{doc.id}</span>
                          </span>
                        ) : null}
                      </div>
                      <div className="dsb-tc-foot">
                        <Tap className="dsb-tc-btn is-open" onClick={() => onOpen(doc)}>
                          Open
                        </Tap>
                        {tab === "screens" ? (
                          <Tap className="dsb-tc-btn is-icon is-link" title="Copy this screen's route to the clipboard" onClick={copyLink}>
                            <Icon name="Link2" size={13} />
                          </Tap>
                        ) : null}
                        <span className="dsb-tc-fill" />
                        {armed === doc.id ? (
                          <>
                            <Tap
                              className="dsb-tc-btn is-armed"
                              title={isOpenNow ? "This is the screen open in the builder" : "This cannot be undone"}
                              onClick={() => remove(doc)}
                            >
                              <Icon name="Trash2" size={12} /> {isOpenNow ? "Delete open" : "Confirm"}
                            </Tap>
                            <Tap className="dsb-tc-btn" onClick={() => setArmed("")}>
                              Cancel
                            </Tap>
                          </>
                        ) : (
                          <>
                            <Tap className="dsb-tc-btn is-icon is-act" title="Duplicate" onClick={duplicate}>
                              <Icon name="Copy" size={12} />
                            </Tap>
                            <Tap
                              className="dsb-tc-btn is-icon is-act is-del"
                              title={tab === "screens" ? "Delete this screen" : "Delete this template"}
                              onClick={() => setArmed(doc.id)}
                            >
                              <Icon name="Trash2" size={12} />
                            </Tap>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!loading && !list.length ? (
                  <div className="dsb-lib-empty">
                    {tab === "screens" && activeFilter !== "all"
                      ? activeFilter === "none"
                        ? "Every screen is filed under a module."
                        : "No screens in this module match."
                      : "Nothing here yet."}
                  </div>
                ) : null}
              </div>
            }
          </div>
        </div>

        <footer className="dsb-lib-foot">
          <Tap
            className="dsbi-mini tone-add"
            onClick={async () => {
              await onSaveAsTemplate();
              reload();
            }}
          >
            <Icon name="SquareStack" size={12} /> Save current screen as template
          </Tap>
          {tab === "screens" && currentScreen?.id ? (
            <span className="dsb-lib-foot-cur">
              Open screen:&nbsp;
              <ModuleBadges mods={modsOf(screens.find((s) => s.id === currentScreen.id) || currentScreen)} max={3} />
            </span>
          ) : null}
        </footer>

        {accessFor ? <ScreenAccessModal screen={accessFor} onClose={() => setAccessFor(null)} /> : null}

        {picking ? (
          <ModulePicker
            modules={modules}
            current={modsOf(picking)}
            screenName={picking.name}
            onSave={(mods) => fileUnder(picking, mods)}
            onClose={() => setPicking(null)}
          />
        ) : null}
      </div>
    </div>
  );
}
