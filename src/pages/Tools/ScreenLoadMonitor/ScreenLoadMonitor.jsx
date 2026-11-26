/**
 * Screen Load Monitor — /screen-load-monitor
 *
 * Which live screens (/screen/:id) users opened, when, whether they came from
 * the cache or the database, and how long they took to show. Data:
 * ScreenLoadLog/List (kept in the API's memory, newest 5000).
 *
 * Kept simple on purpose: four numbers, then one table at a time
 * (By screen / By user / Recent). Looks come from CacheManager.css.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  Check,
  ChevronDown,
  Clock,
  Database,
  ExternalLink,
  Gauge,
  History,
  Inbox,
  LayoutTemplate,
  RefreshCw,
  Search,
  Timer,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import Heading from "../../../components/UI/Heading";
import Modal from "../../../components/modalComponent/Modal";
import { notify } from "../../../utils/utils";
import { clearScreenLoadLog, getScreenLoadLog } from "../../../networkServices/screenBuilderApi";
import "../CacheManager/CacheManager.css";
import "./ScreenLoadMonitor.css";

// makeApiRequest returns the body on success but the axios response on an
// HTTP error (403 for a non-admin role), so read the body from either.
const bodyOf = (resp) => (resp?.headers && resp?.status ? resp?.data : resp);

const AUTO_REFRESH_MS = 15000;
const HOUR_MS = 3600000;

const PERIODS = [
  { id: "1h", label: "Last hour", ms: HOUR_MS },
  { id: "24h", label: "Today", ms: 24 * HOUR_MS },
  { id: "7d", label: "7 days", ms: 7 * 24 * HOUR_MS },
  { id: "all", label: "All", ms: 0 },
];

const TABS = [
  { id: "screens", label: "By screen", icon: LayoutTemplate },
  { id: "users", label: "By user", icon: Users },
  { id: "recent", label: "Recent loads", icon: History },
];

// Load time → colour. Under half a second is fast, over 1.5 s is slow.
const FAST_MS = 500;
const SLOW_MS = 1500;
const speedTone = (ms) => (ms == null ? "slate" : ms < FAST_MS ? "green" : ms < SLOW_MS ? "amber" : "red");
const speedWord = (ms) => (ms == null ? "" : ms < FAST_MS ? "Fast" : ms < SLOW_MS ? "OK" : "Slow");

const AVATAR_TONES = ["blue", "violet", "teal", "green", "amber", "red"];

const fullDate = (v) => (v ? moment(v).format("DD-MMM-YYYY hh:mm:ss A") : "");
const dateOnly = (v) => (v ? moment(v).format("DD-MMM-YYYY") : "");
const timeOnly = (v) => (v ? moment(v).format("hh:mm A") : "");
const fromNow = (v) => (v ? moment(v).fromNow() : "-");

/** 84 -> "84 ms", 1234 -> "1.2 s", null -> "-". */
function ms(v) {
  if (v == null || Number.isNaN(Number(v))) return "-";
  const n = Number(v);
  return n < 1000 ? `${Math.round(n)} ms` : `${(n / 1000).toFixed(1)} s`;
}

const avg = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null);

/** "Mayank Kumar" -> "MK". */
function initials(name) {
  const parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
function toneFor(text) {
  let h = 0;
  for (const c of String(text)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

/** A button the global theme cannot repaint (theme.css colours every bare <button>). */
function Btn({ tone = "blue-soft", icon: Icon, busy, disabled, onClick, children, title, small }) {
  const off = disabled || busy;
  const fire = () => !off && onClick?.();
  return (
    <span
      role="button"
      tabIndex={off ? -1 : 0}
      aria-disabled={off}
      title={title}
      className={`cm-btn cm-btn-${tone}${small ? " cm-btn-sm" : ""}${off ? " is-off" : ""}`}
      onClick={fire}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fire();
        }
      }}
    >
      {Icon ? <Icon size={small ? 13 : 15} className={busy ? "cm-spin" : ""} /> : null}
      {children}
    </span>
  );
}

const press = (fn) => (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
  }
};

function StatCard({ icon: Icon, tone, label, value, sub }) {
  return (
    <div className={`cm-stat cm-tone-${tone}`}>
      <div className="cm-stat-icon">
        <Icon size={17} />
      </div>
      <div className="cm-stat-body">
        <div className="cm-stat-label">{label}</div>
        <div className="cm-stat-value">{value}</div>
        {sub ? <div className="cm-stat-sub">{sub}</div> : null}
      </div>
    </div>
  );
}

/** Load time as a coloured pill; hover shows where the time went. */
function TimePill({ value, detail }) {
  return (
    <span className={`slm-speed cm-tone-${speedTone(value)}`} title={detail || speedWord(value)}>
      {ms(value)}
    </span>
  );
}

function Person({ name, role, id }) {
  return (
    <span className="slm-who">
      <span className={`slm-avatar cm-tone-${toneFor(id || name)}`}>{initials(name)}</span>
      <span>
        <b>{name || "-"}</b>
        {role ? <small>{role}</small> : null}
      </span>
    </span>
  );
}

/**
 * "All users" / one user. A custom list rather than a <select> so each person
 * shows their avatar, role and how many screens they opened.
 */
function UserPicker({ people, value, onChange, t }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const boxRef = useRef(null);
  const listRef = useRef(null);

  const total = people.reduce((n, u) => n + u.loads, 0);
  const options = useMemo(() => {
    const text = q.trim().toLowerCase();
    const list = people.filter(
      (u) => !text || u.name.toLowerCase().includes(text) || String(u.role).toLowerCase().includes(text),
    );
    return [{ id: "", name: t("All users"), role: `${people.length} ${t("people")}`, loads: total, all: true }, ...list];
  }, [people, q, total, t]);
  const current = people.find((u) => u.id === value);

  // Close on a click outside.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => boxRef.current && !boxRef.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // On open: empty search, highlight the current choice.
  useEffect(() => {
    if (!open) return;
    setQ("");
    setHi(Math.max(0, [{ id: "" }, ...people].findIndex((o) => o.id === value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    listRef.current?.children[hi]?.scrollIntoView({ block: "nearest" });
  }, [hi]);

  const pick = (id) => {
    onChange(id);
    setOpen(false);
  };
  const onKey = (e) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setHi((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      if (options[hi]) pick(options[hi].id);
    }
  };

  return (
    <div className={`slm-picker${open ? " is-open" : ""}`} ref={boxRef} onKeyDown={onKey}>
      <span
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="slm-picker-btn"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !open && (e.preventDefault(), setOpen(true))}
      >
        {current ? (
          <span className={`slm-avatar is-xs cm-tone-${toneFor(current.id)}`}>{initials(current.name)}</span>
        ) : (
          <span className="slm-picker-ico">
            <Users size={13} />
          </span>
        )}
        <span className="slm-picker-text">
          <b>{current ? current.name : t("All users")}</b>
          <small>{current ? current.role || t("User") : `${people.length} ${t("people")}`}</small>
        </span>
        {current ? (
          <span
            role="button"
            tabIndex={-1}
            className="slm-picker-clear"
            title={t("All users")}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
          >
            <X size={12} />
          </span>
        ) : null}
        <ChevronDown size={15} className="slm-picker-chev" />
      </span>

      {open ? (
        <div className="slm-picker-menu">
          <div className="slm-picker-search">
            <Search size={13} />
            <input
              autoFocus
              type="text"
              className="cm-search-input"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setHi(0);
              }}
              placeholder={t("Find a user…")}
            />
          </div>
          <div className="slm-picker-list" role="listbox" ref={listRef}>
            {options.map((o, i) => {
              const selected = o.id === value;
              return (
                <div
                  key={o.id || "__all"}
                  role="option"
                  aria-selected={selected}
                  className={`slm-picker-opt${selected ? " is-sel" : ""}${i === hi ? " is-hi" : ""}`}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => pick(o.id)}
                >
                  {o.all ? (
                    <span className="slm-picker-ico is-all">
                      <Users size={14} />
                    </span>
                  ) : (
                    <span className={`slm-avatar cm-tone-${toneFor(o.id)}`}>{initials(o.name)}</span>
                  )}
                  <span className="slm-picker-text">
                    <b>{o.name}</b>
                    {o.role ? <small>{o.role}</small> : null}
                  </span>
                  <span className="slm-picker-count" title={t("Screens opened")}>
                    {o.loads}
                  </span>
                  <span className="slm-picker-check">{selected ? <Check size={14} /> : null}</span>
                </div>
              );
            })}
            {options.length === 1 && q ? <div className="slm-picker-none">{t("No user matches")}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Empty({ text }) {
  return (
    <tr className="cm-empty-row">
      <td colSpan={6} className="cm-empty">
        <div className="cm-empty-box">
          <Inbox size={28} />
          <span>{text}</span>
        </div>
      </td>
    </tr>
  );
}

const ScreenLoadMonitor = ({ data }) => {
  const [t] = useTranslation();
  const [log, setLog] = useState(null);
  const [refusal, setRefusal] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(""); // "refresh" | "clear"
  const [confirmClear, setConfirmClear] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState(null);
  const [, setTick] = useState(0);
  const busyRef = useRef("");

  const [period, setPeriod] = useState("24h");
  const [userId, setUserId] = useState("");
  const [screenKey, setScreenKey] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("screens");
  const [rowsShown, setRowsShown] = useState(50);

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setBusy((b) => b || "refresh");
    try {
      const resp = bodyOf(await getScreenLoadLog());
      if (resp?.success) {
        setRefusal("");
        setLog(resp.data || null);
      } else {
        setLog(null);
        setRefusal(resp?.message || "Unable to load screen statistics.");
      }
      setRefreshedAt(Date.now());
    } catch (e) {
      const body = bodyOf(e?.response) || {};
      setRefusal(body?.message || e?.message || "Unable to load screen statistics.");
    } finally {
      setLoaded(true);
      if (!quiet) setBusy((b) => (b === "refresh" ? "" : b));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(() => {
      if (!busyRef.current && document.visibilityState === "visible") load({ quiet: true });
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  // Keep "x seconds ago" true.
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => setRowsShown(50), [period, userId, screenKey, search, tab]);

  const handleClear = async () => {
    setConfirmClear(false);
    setBusy("clear");
    try {
      const resp = bodyOf(await clearScreenLoadLog());
      notify(resp?.message, resp?.success ? "success" : "error");
      await load({ quiet: true });
    } finally {
      setBusy("");
    }
  };

  /* ------------------------------------------------------------ derived data */

  const entries = log?.entries || [];

  // Screens in the API cache right now: screenKey -> { cachedUtc, expiresUtc }.
  const cachedNow = useMemo(() => {
    const map = {};
    (log?.cached || []).forEach((c) => {
      map[c.screenKey] = c;
    });
    return map;
  }, [log]);

  const names = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      if (e.screenName && !map[e.screenKey]) map[e.screenKey] = e.screenName;
    });
    return map;
  }, [entries]);
  const nameOf = useCallback((key) => names[key] || key, [names]);

  const inPeriod = useMemo(() => {
    const p = PERIODS.find((x) => x.id === period);
    if (!p?.ms) return entries;
    const from = Date.now() - p.ms;
    return entries.filter((e) => moment(e.atUtc).valueOf() >= from);
  }, [entries, period]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inPeriod.filter(
      (e) =>
        (!userId || e.userId === userId) &&
        (!screenKey || e.screenKey === screenKey) &&
        (!q ||
          String(e.screenKey).toLowerCase().includes(q) ||
          String(nameOf(e.screenKey)).toLowerCase().includes(q) ||
          String(e.userName).toLowerCase().includes(q)),
    );
  }, [inPeriod, userId, screenKey, search, nameOf]);

  const totals = useMemo(() => {
    const ok = filtered.filter((e) => !e.failed);
    const timed = ok.filter((e) => e.totalMs != null);
    const fromMemory = ok.filter((e) => e.source === "cache" || e.source === "browser").length;
    return {
      loads: filtered.length,
      users: new Set(filtered.map((e) => e.userId)).size,
      screens: new Set(filtered.map((e) => e.screenKey)).size,
      fromMemory,
      fromDb: ok.length - fromMemory,
      memoryPct: ok.length ? (fromMemory / ok.length) * 100 : null,
      avgTotal: avg(timed.map((e) => e.totalMs)),
    };
  }, [filtered]);

  const screens = useMemo(() => {
    const map = {};
    filtered.forEach((e) => {
      const s = (map[e.screenKey] ||= { key: e.screenKey, loads: 0, users: new Set(), totals: [], last: null });
      s.loads += 1;
      s.users.add(e.userId);
      if (e.totalMs != null) s.totals.push(e.totalMs);
      if (!s.last || e.id > s.last.id) s.last = e;
    });
    return Object.values(map)
      .map((s) => ({ ...s, users: s.users.size, avg: avg(s.totals) }))
      .sort((a, b) => b.loads - a.loads);
  }, [filtered]);

  // Users of the period (not narrowed by the user filter, so the dropdown keeps everyone).
  const people = useMemo(() => {
    const map = {};
    inPeriod.forEach((e) => {
      const u = (map[e.userId] ||= {
        id: e.userId,
        name: e.userName || e.userId || "Unknown",
        role: e.roleName || "",
        loads: 0,
        screens: new Set(),
        totals: [],
        last: null,
      });
      u.loads += 1;
      u.screens.add(e.screenKey);
      if (e.totalMs != null) u.totals.push(e.totalMs);
      if (!u.last || e.id > u.last.id) u.last = e;
    });
    return Object.values(map)
      .map((u) => ({ ...u, screens: u.screens.size, avg: avg(u.totals) }))
      .sort((a, b) => b.loads - a.loads);
  }, [inPeriod]);

  const visiblePeople = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter((u) => (!userId || u.id === userId) && (!q || u.name.toLowerCase().includes(q)));
  }, [people, userId, search]);

  // Click a screen or a user: show their recent loads.
  const showScreen = (key) => {
    setScreenKey(key);
    setTab("recent");
  };
  const showUser = (id) => {
    setUserId(id);
    setTab("recent");
  };

  const anyBusy = !!busy;
  const filterOn = userId || screenKey || search;
  const counts = { screens: screens.length, users: visiblePeople.length, recent: filtered.length };

  const timeDetail = (e) =>
    e.totalMs == null
      ? ""
      : `${speedWord(e.totalMs)} — ${t("download")} ${ms(e.fetchMs)}, ${t("draw")} ${ms(e.renderMs)}`;

  /* ------------------------------------------------------------ render */

  return (
    <div className="card cm-page slm-page">
      <Heading title={data?.breadcrumb || t("Screen Load Monitor")} data={data} isBreadcrumb={true} />

      {/* ---------------------------------------------------- header */}
      <div className="cm-header">
        <div className="cm-title">
          <div className="cm-title-icon slm-title-icon">
            <Gauge size={18} />
          </div>
          <div>
            <div className="cm-title-text">{t("Screen Load Monitor")}</div>
            <div className="cm-subtitle">
              <span>{t("Which screens users opened, and how fast they loaded.")}</span>
              {refreshedAt ? (
                <span className="cm-refreshed">
                  {autoRefresh ? <span className="cm-live-dot" /> : <Clock size={11} />}
                  {t("Updated")} {fromNow(refreshedAt)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="cm-actions">
          <label className="cm-auto" title={t("Refresh every 15 seconds")}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            <span className="cm-switch" />
            {t("Auto refresh")}
          </label>
          <Btn tone="blue-soft" icon={RefreshCw} busy={busy === "refresh"} disabled={anyBusy} onClick={() => load()}>
            {t("Refresh")}
          </Btn>
          <Btn
            tone="red-soft"
            icon={Trash2}
            busy={busy === "clear"}
            disabled={anyBusy || !!refusal || !entries.length}
            onClick={() => setConfirmClear(true)}
            title={t("Remove the recorded loads (the cache is not touched)")}
          >
            {t("Clear")}
          </Btn>
        </div>
      </div>

      {!loaded ? (
        <div className="cm-body">
          <div className="cm-stats">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="cm-skeleton cm-skeleton-stat" />
            ))}
          </div>
          <div className="cm-skeleton slm-skeleton-table" />
        </div>
      ) : refusal ? (
        <div className="cm-body">
          <div className="cm-refusal">
            <AlertTriangle size={22} />
            <div>
              <b>{t("Screen load statistics are not available")}</b>
              <div>{refusal}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="cm-body">
          {/* ---------------------------------------------------- filters: when, who, what */}
          <div className="slm-toolbar">
            <div className="slm-seg" role="tablist" aria-label={t("Period")}>
              {PERIODS.map((p) => (
                <span
                  key={p.id}
                  role="tab"
                  tabIndex={0}
                  aria-selected={period === p.id}
                  className={period === p.id ? "is-on" : ""}
                  onClick={() => setPeriod(p.id)}
                  onKeyDown={press(() => setPeriod(p.id))}
                >
                  {t(p.label)}
                </span>
              ))}
            </div>
            <UserPicker people={people} value={userId} onChange={setUserId} t={t} />
            <div className="cm-search">
              <Search size={14} />
              <input
                type="text"
                className="cm-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Search screen or user…")}
              />
              {search ? (
                <span role="button" tabIndex={0} className="cm-search-clear" onClick={() => setSearch("")}>
                  <X size={13} />
                </span>
              ) : null}
            </div>
            {filterOn ? (
              <span
                role="button"
                tabIndex={0}
                className="slm-reset"
                onClick={() => {
                  setUserId("");
                  setScreenKey("");
                  setSearch("");
                }}
                onKeyDown={press(() => {
                  setUserId("");
                  setScreenKey("");
                  setSearch("");
                })}
              >
                <X size={12} /> {t("Clear filters")}
              </span>
            ) : null}
          </div>

          {/* ---------------------------------------------------- four numbers */}
          <div className="cm-stats">
            <StatCard
              icon={Activity}
              tone="blue"
              label={t("Screens opened")}
              value={totals.loads.toLocaleString()}
              sub={`${totals.screens} ${t("different screens")}`}
            />
            <StatCard
              icon={Users}
              tone="violet"
              label={t("Users")}
              value={totals.users}
              sub={t("People who opened a screen")}
            />
            <StatCard
              icon={Zap}
              tone="green"
              label={t("Loaded from cache")}
              value={totals.memoryPct == null ? "-" : `${Math.round(totals.memoryPct)}%`}
              sub={`${totals.fromMemory} ${t("from cache")} · ${totals.fromDb} ${t("from database")}`}
            />
            <StatCard
              icon={Timer}
              tone={totals.avgTotal == null ? "teal" : speedTone(totals.avgTotal)}
              label={t("Average load time")}
              value={ms(totals.avgTotal)}
              sub={totals.avgTotal == null ? t("No loads yet") : t(speedWord(totals.avgTotal))}
            />
          </div>

          {/* ---------------------------------------------------- one table at a time */}
          <div className="slm-panel">
            <div className="slm-tabs" role="tablist">
              {TABS.map(({ id, label, icon: Icon }) => (
                <span
                  key={id}
                  role="tab"
                  tabIndex={0}
                  aria-selected={tab === id}
                  className={`slm-tab${tab === id ? " is-on" : ""}`}
                  onClick={() => setTab(id)}
                  onKeyDown={press(() => setTab(id))}
                >
                  <Icon size={14} /> {t(label)} <i>{counts[id]}</i>
                </span>
              ))}
              {screenKey ? (
                <span className="slm-filter-chip">
                  <LayoutTemplate size={12} /> {nameOf(screenKey)}
                  <X size={12} role="button" onClick={() => setScreenKey("")} />
                </span>
              ) : null}
              <span className="slm-legend">
                <i className="cm-tone-green" /> {t("Fast")} &lt; 0.5 s
                <i className="cm-tone-amber" /> {t("OK")}
                <i className="cm-tone-red" /> {t("Slow")} &gt; 1.5 s
              </span>
            </div>

            <div className="cm-table-wrap slm-table-wrap">
              {tab === "screens" ? (
                <table className="cm-table">
                  <thead>
                    <tr>
                      <th>{t("Screen")}</th>
                      <th className="cm-num">{t("Opened")}</th>
                      <th className="cm-num">{t("Users")}</th>
                      <th className="cm-num">{t("Avg time")}</th>
                      <th>{t("Cache")}</th>
                      <th>{t("Last opened")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {screens.length === 0 ? (
                      <Empty text={entries.length ? t("Nothing matches these filters.") : t("No screen has been opened yet.")} />
                    ) : (
                      screens.map((s) => {
                        const inCache = cachedNow[s.key];
                        return (
                          <tr
                            key={s.key}
                            className={`slm-click cm-tone-${speedTone(s.avg)}`}
                            title={t("Click to see every load of this screen")}
                            onClick={() => showScreen(s.key)}
                          >
                            <td>
                              <span className="slm-scr">
                                <b>{nameOf(s.key)}</b>
                                <small>{s.key}</small>
                              </span>
                            </td>
                            <td className="cm-num">
                              <b>{s.loads}</b>
                            </td>
                            <td className="cm-num">{s.users}</td>
                            <td className="cm-num">
                              <TimePill value={s.avg} />
                            </td>
                            <td>
                              {inCache ? (
                                <span className="slm-cache is-in" title={`${t("Cached")} ${fullDate(inCache.cachedUtc)}`}>
                                  <Zap size={11} /> {t("Cached")} · {t("till")} {timeOnly(inCache.expiresUtc)}
                                </span>
                              ) : (
                                <span className="slm-cache is-out">
                                  <Database size={11} /> {t("Not cached")}
                                </span>
                              )}
                            </td>
                            <td>
                              <span className="slm-when" title={fullDate(s.last.atUtc)}>
                                <b>{fromNow(s.last.atUtc)}</b>
                                <small>
                                  {t("by")} {s.last.userName || s.last.userId}
                                </small>
                              </span>
                              <a
                                className="slm-open"
                                href={`/screen/${s.key}`}
                                target="_blank"
                                rel="noreferrer"
                                title={t("Open screen in a new tab")}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink size={13} />
                              </a>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : null}

              {tab === "users" ? (
                <table className="cm-table">
                  <thead>
                    <tr>
                      <th>{t("User")}</th>
                      <th className="cm-num">{t("Screens opened")}</th>
                      <th className="cm-num">{t("Different screens")}</th>
                      <th className="cm-num">{t("Avg time")}</th>
                      <th>{t("Last screen")}</th>
                      <th>{t("Last seen")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePeople.length === 0 ? (
                      <Empty text={t("No users to show.")} />
                    ) : (
                      visiblePeople.map((u) => (
                        <tr
                          key={u.id}
                          className={`slm-click cm-tone-${speedTone(u.avg)}`}
                          title={t("Click to see this user's loads")}
                          onClick={() => showUser(u.id)}
                        >
                          <td>
                            <Person name={u.name} role={u.role} id={u.id} />
                          </td>
                          <td className="cm-num">
                            <b>{u.loads}</b>
                          </td>
                          <td className="cm-num">{u.screens}</td>
                          <td className="cm-num">
                            <TimePill value={u.avg} />
                          </td>
                          <td>{nameOf(u.last?.screenKey)}</td>
                          <td>
                            <span className="slm-when" title={fullDate(u.last?.atUtc)}>
                              <b>{fromNow(u.last?.atUtc)}</b>
                              <small>{dateOnly(u.last?.atUtc)}</small>
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : null}

              {tab === "recent" ? (
                <table className="cm-table">
                  <thead>
                    <tr>
                      <th>
                        <CalendarClock size={12} /> {t("When")}
                      </th>
                      <th>{t("User")}</th>
                      <th>{t("Screen")}</th>
                      <th>{t("Loaded from")}</th>
                      <th className="cm-num">{t("Time taken")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <Empty text={t("No loads to show.")} />
                    ) : (
                      filtered.slice(0, rowsShown).map((e) => (
                        <tr key={e.id} className={`cm-tone-${e.failed ? "red" : speedTone(e.totalMs)}`}>
                          <td>
                            <span className="slm-when" title={fromNow(e.atUtc)}>
                              <b>{timeOnly(e.atUtc)}</b>
                              <small>{dateOnly(e.atUtc)}</small>
                            </span>
                          </td>
                          <td>
                            <span className="slm-link" role="button" tabIndex={0} onClick={() => setUserId(e.userId)}>
                              <Person name={e.userName || e.userId} role={e.roleName} id={e.userId} />
                            </span>
                          </td>
                          <td>
                            <span className="slm-scr slm-link" role="button" tabIndex={0} onClick={() => setScreenKey(e.screenKey)}>
                              <b>{nameOf(e.screenKey)}</b>
                              <small>{e.screenKey}</small>
                            </span>
                          </td>
                          <td>
                            {e.failed ? (
                              <span className="slm-cache is-bad">{t("Not found")}</span>
                            ) : e.source === "database" ? (
                              <span className="slm-cache is-db">
                                <Database size={11} /> {t("Database")}
                              </span>
                            ) : (
                              <span className="slm-cache is-in">
                                <Zap size={11} /> {t("Cache")}
                              </span>
                            )}
                          </td>
                          <td className="cm-num">
                            <TimePill value={e.totalMs} detail={timeDetail(e)} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : null}
            </div>

            {tab === "recent" && filtered.length > rowsShown ? (
              <div className="slm-foot">
                <span>
                  {t("Showing")} {rowsShown} {t("of")} {filtered.length}
                </span>
                <Btn tone="blue-soft" small onClick={() => setRowsShown((n) => n + 100)}>
                  {t("Show more")}
                </Btn>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {confirmClear && (
        <Modal
          visible={confirmClear}
          setVisible={() => setConfirmClear(false)}
          Header={t("Clear Load History")}
          modalWidth="440px"
          buttonName={t("Clear")}
          handleAPI={handleClear}
        >
          <div className="cm-confirm">
            <AlertTriangle size={20} />
            <span>{t("All recorded screen loads will be removed. The cache itself is not touched.")}</span>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ScreenLoadMonitor;
