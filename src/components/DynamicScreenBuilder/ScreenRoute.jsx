/**
 * Runtime route — /screen/:screenId
 *
 * Loads a saved screen document and renders it as a real, working page. No
 * code is written per screen: publish from the builder and the route works.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import Icon from "./registry/icons";
import ScreenRenderer from "./renderer/ScreenRenderer";
import { ScreenRepo } from "./utils/storage";
import { normalizeScreen } from "./schema/schema";
import { resolveScreenParams } from "./utils/screenParams";
import { EMERGENCY_SCREEN } from "./templates/emergencyPatientSearch";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import { getMyScreenAccess, reportScreenLoad } from "@app/networkServices/screenBuilderApi";
import "./styles/screenroute.css";

/**
 * @param screenId  when mounted as a component rather than by the route:
 *                  `<ScreenRoute screenId="scr_3smy1flo" embeddedUHID={uhid} />`
 * @param params    values for the screen's parameters ({{params.x}}).
 *                  Every other prop is a parameter too, so a screen can stand
 *                  in for a component that took `embeddedUHID` as a prop.
 */
/** A value's text for a memo key — a record with a cycle in it is not fatal. */
function safeKey(v) {
  try {
    return JSON.stringify(v);
  } catch (e) {
    return String(Date.now());
  }
}

/** Whether any box on the screen is marked "Restrict access". */
function hasRestricted(node) {
  if (!node) return false;
  if (node.access?.restricted) return true;
  return (node.children || []).some(hasRestricted);
}

export default function ScreenRoute({ screenId: embeddedId, params: passed, ...props } = {}) {
  const { screenId: routeId } = useParams();
  const screenId = embeddedId || routeId;
  const [query] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const userData = useLocalStorage("userData", "get");
  const [screen, setScreen] = useState(null);
  const [status, setStatus] = useState("loading");
  // Screen Load Monitor: when this load started and when its answer came back.
  const timing = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setStatus("loading");
      const startedAt = performance.now();
      timing.current = null;
      // The published version, from the API cache — not the builder's draft.
      let doc = await ScreenRepo.getLive(screenId);
      timing.current = { screenId, startedAt, fetchedAt: performance.now() };
      // The reference screen is always available, even on a fresh browser.
      if (!doc && (screenId === EMERGENCY_SCREEN.id || !screenId)) doc = normalizeScreen(EMERGENCY_SCREEN);
      if (!alive) return;
      if (doc) {
        setScreen(doc);
        setStatus("ok");
      } else {
        setStatus("missing");
      }
    })();
    return () => {
      alive = false;
    };
  }, [screenId]);

  /**
   * Once the screen has painted, tell the Screen Load Monitor how long the
   * fetch and the render took. Two frames after the commit = after the paint.
   */
  useEffect(() => {
    const t = timing.current;
    if (status !== "ok" || !screen || !t || t.screenId !== screenId) return undefined;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (timing.current !== t) return;
        timing.current = null;
        const paintedAt = performance.now();
        reportScreenLoad({
          screenKey: screenId,
          screenName: screen.name || "",
          version: Number(screen.version) || null,
          fetchMs: t.fetchedAt - t.startedAt,
          renderMs: paintedAt - t.fetchedAt,
          totalMs: paintedAt - t.startedAt,
          embedded: !!embeddedId,
        });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [status, screen, screenId, embeddedId]);

  /**
   * The restricted boxes this user may see (sb_screen_access). Asked only when
   * the screen has one. Null until it answers — and on a failed call — so a
   * restricted box stays hidden rather than flashing up for someone it is not
   * meant for.
   */
  const [access, setAccess] = useState(null);
  const restricted = useMemo(() => hasRestricted(screen?.root), [screen]);
  useEffect(() => {
    setAccess(null);
    if (!restricted || !screen?.id) return undefined;
    let alive = true;
    getMyScreenAccess(screen.id)
      .then((res) => {
        if (alive && res?.success) setAccess(res.data || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [restricted, screen?.id, userData?.employeeID, userData?.defaultRole]);

  /**
   * The site's own switches, flattened to { Name: Value } for `{{globals.X}}`.
   *
   * The selector lives here rather than in RuntimeContext on purpose: the
   * runtime has no redux dependency, and the builder's canvas mounts the same
   * renderer. Whoever hosts a screen knows where the resources are kept.
   */
  const { GetGlobalResources, GetRoleList } = useSelector((s) => s.CommonSlice) || {};
  const globals = useMemo(() => {
    if (!Array.isArray(GetGlobalResources)) return {};
    return GetGlobalResources.reduce((acc, r) => {
      if (r?.Name !== undefined) acc[r.Name] = r.Value;
      return acc;
    }, {});
  }, [GetGlobalResources]);

  /**
   * The signed-in user, as a screen reads them.
   *
   * `role` is the id, which answers "is this that role" and nothing else.
   * What a role MAY DO is kept on the role record — the settlement list shows
   * PHY bills to one role, OPD bills to another and everything to a third,
   * off `settlementType` — so the whole record goes in under `roleInfo`:
   * {{user.roleInfo.settlementType}}. Without it a rule about what a role may
   * see could not be written at all, and the flags are on the record rather
   * than in a switch of our own so a new one needs no change here.
   */
  const user = useMemo(() => {
    const roleInfo =
      (Array.isArray(GetRoleList) ? GetRoleList : []).find(
        (r) => Number(r?.roleID) === Number(userData?.defaultRole),
      ) || {};
    return {
      id: userData?.employeeID,
      name: userData?.userName || userData?.employeeName,
      role: String(userData?.defaultRole ?? ""),
      roleName: roleInfo?.roleName || "",
      roleInfo,
      centreId: userData?.centreID,
    };
  }, [userData, GetRoleList]);

  /**
   * What the screen was opened WITH: ?uhid=… on the URL, `state.params` from a
   * navigate(), and the props of whoever embedded it — later ones winning.
   * Keyed on the text of it, so a parent re-rendering with the same values
   * does not rebuild every binding on the screen.
   */
  const queryText = query.toString();
  const stateParams = location?.state?.params;
  const incoming = { ...props, ...(passed || {}) };
  const incomingKey = safeKey(incoming);
  const stateKey = safeKey(stateParams || null);
  const params = useMemo(
    () => resolveScreenParams(screen, { query: new URLSearchParams(queryText), state: stateParams, props: incoming }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [screen, queryText, stateKey, incomingKey],
  );

  if (status === "loading") {
    return (
      <div className="dsb-route-state">
        <div className="dsb-route-card">
          <Icon name="Wand2" size={18} />
          <span>Loading screen…</span>
        </div>
      </div>
    );
  }

  if (status === "missing") {
    return (
      <div className="dsb-route-state">
        <div className="dsb-route-card is-empty">
          <Icon name="AlertCircle" size={20} />
          <h3>Screen not found</h3>
          <p>
            No published screen with id <code>{screenId}</code>.
          </p>
          <button type="button" onClick={() => navigate("/dynamic-screen-builder")}>
            Open the screen builder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dsb-route">
      <ScreenRenderer
        screen={screen}
        mode="runtime"
        breakpoint="desktop"
        role={user.role}
        user={user}
        globals={globals}
        access={access}
        params={params}
        onNavigate={(route) => route && navigate(route)}
      />
    </div>
  );
}
