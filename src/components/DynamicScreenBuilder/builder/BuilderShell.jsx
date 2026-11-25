/**
 * Builder shell — wires the panels, the DnD engine, keyboard shortcuts and
 * persistence together. This is the component the route mounts.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Icon from "../registry/icons";
import Canvas from "./Canvas";
import CommonProvider, { useCommon } from "./CommonLibrary";
import DataPanel from "./DataPanel";
import { DndProvider } from "./DndManager";
import Inspector from "./Inspector";
import LayersPanel from "./LayersPanel";
import Palette from "./Palette";
import SideSplit from "./SideSplit";
import TemplateLibrary from "./TemplateLibrary";
import AskName from "./AskName";
import ThemeEditor from "./ThemeEditor";
import Toolbar from "./Toolbar";
import Tap from "./Tap";
import { BuilderProvider, useBuilder } from "../store/builderStore";
import { createScreen, normalizeScreen, uid, validateScreen } from "../schema/schema";
import { REGISTRY, getDef } from "../registry";
import { presetById } from "../registry/presets";
import { findNode } from "../utils/tree";
import { GroupRepo, ScreenRepo, Settings, Storage, TemplateRepo, downloadJson, downloadText } from "../utils/storage";
import { BUILT_IN_TEMPLATES } from "../templates/emergencyPatientSearch";
import { generateJsx } from "../utils/codegen";
import "../styles/builder.css";
import "../styles/common-components.css";

/**
 * How wide each side panel may be dragged.
 *
 * A minimum, because a 60px palette is not a palette; a maximum, and a floor
 * under the canvas below, because the panels exist to serve the thing being
 * designed — a drag that squeezes the canvas to nothing has gone wrong
 * whatever the pointer says.
 */
/**
 * The migration console, loaded only if it is ever opened.
 *
 * It is a developer-machine tool: it talks to a Node service (tools/screen-
 * migrator) that reads src/pages off disk, and a deployed build has neither the
 * service nor the JSX source. Imported lazily rather than at the top, so the
 * chunk is fetched on a developer's machine when the panel opens and never on
 * the server — a static import would ship it to every user for a panel they
 * cannot open.
 */
const MigrationConsole = import.meta.env.DEV ? React.lazy(() => import("./MigrationConsole")) : null;

/**
 * Size the builder to exactly the space left under the app header.
 *
 * A fixed `100vh - 100px` was only right for one header height, and the header
 * grows with the app font-size setting — so after changing the font the page
 * gained a scrollbar. Measure instead: everything above the builder and below
 * it in its scroll container is subtracted, and the measure reruns on resize
 * and whenever the font-size variable on <html> changes.
 */
function useFitToViewport() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // The nearest ancestor that really scrolls. Checked while the builder is
    // overfilled: an overflow:auto box whose height follows its content (the
    // Modern layout's .ml-content has overflow-x:auto, which makes overflowY
    // compute to auto too) just grows with it, and sizing to that box made the
    // builder thousands of pixels tall — modals centred in it opened off-screen.
    const scrollerOf = (node) => {
      for (let p = node.parentElement; p && p !== document.body; p = p.parentElement) {
        const oy = getComputedStyle(p).overflowY;
        const scrolls = oy === "auto" || oy === "scroll" || (p.id === "root" && oy !== "visible");
        if (scrolls && p.scrollHeight > p.clientHeight + 1) return p;
      }
      return document.scrollingElement || document.documentElement;
    };
    let raf = 0;
    const fit = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Overfill first so scrollHeight reflects only what sits below the
        // builder, not leftover empty space — and so the real scroller shows
        // itself by overflowing; all writes land before paint.
        el.style.height = `${window.innerHeight * 2}px`;
        const sc = scrollerOf(el);
        const scTop = sc === document.scrollingElement ? 0 : sc.getBoundingClientRect().top;
        const top = el.getBoundingClientRect().top - scTop + sc.scrollTop;
        const below = sc.scrollHeight - (top + el.offsetHeight);
        const h = sc.clientHeight - top - Math.max(0, below);
        el.style.height = `${Math.floor(h)}px`;
      });
    };
    let late = 0;
    const fitAfterTransition = () => {
      fit();
      // html font-size animates for 0.15s; the header settles after it.
      clearTimeout(late);
      late = setTimeout(fit, 250);
    };
    fit();
    window.addEventListener("resize", fit);
    const mo = new MutationObserver(fitAfterTransition);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class"] });
    const ro = new ResizeObserver(fit);
    ro.observe(document.body);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(late);
      window.removeEventListener("resize", fit);
      mo.disconnect();
      ro.disconnect();
    };
  }, []);
  return ref;
}

/**
 * How long auto-save waits after the last change.
 *
 * Long enough that a sentence typed into a label is one write rather than
 * thirty, short enough that closing the tab a moment after an edit does not
 * lose it.
 */
const AUTOSAVE_WAIT = 1500;

const DOCK = {
  left: { min: 190, max: 460, base: 258 },
  right: { min: 240, max: 560, base: 316 },
};
const CANVAS_FLOOR = 360;

const clampDock = (side, px, bodyWidth) => {
  const d = DOCK[side];
  const room = Math.max(d.min, (bodyWidth || window.innerWidth) - CANVAS_FLOOR);
  return Math.round(Math.min(Math.max(px, d.min), Math.min(d.max, room)));
};

function ShellInner({ onExit }) {
  const b = useBuilder();
  const { state } = b;
  const common = useCommon();
  const [saving, setSaving] = useState(false);
  // Remembered per browser, like the dock widths: a preference about how this
  // person works, not part of the screen document.
  const [autoSave, setAutoSave] = useState(() => !!Settings.get().autoSave);
  // { at, error } — when the last silent save landed, or why it did not.
  const [autoState, setAutoState] = useState({ at: 0, error: "" });
  // "theme" | "data". The toolbar buttons that opened these were removed; the
  // panels and their close paths are left in place, so putting a way back in
  // is one call to setDrawer.
  const [drawer, setDrawer] = useState(null);
  const [library, setLibrary] = useState(false);
  const [migrate, setMigrate] = useState(false);
  // The "New screen" name, asked in the page: window.prompt is not available
  // in every host the builder runs in (see builder/AskName).
  const [askNew, setAskNew] = useState(false);
  const [groups, setGroups] = useState([]);
  const fileRef = useRef(null);

  /*
   * Version history. `viewing` is the old version on the canvas — { versionId,
   * version, at } — until it is saved (it becomes the latest) or put back.
   * `stash` is what the canvas held before the first one was loaded, unsaved
   * edits and all, so Back to latest returns exactly that.
   */
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [historyKey, setHistoryKey] = useState(0);
  const stash = useRef(null);

  /**
   * Which side panels are folded away.
   *
   * Stored beside the last screen id, so the builder opens the way it was last
   * left — someone who works on a small laptop with both panels shut should
   * not have to shut them again every session.
   */
  const [docks, setDocks] = useState(() => {
    const p = Settings.get().panels || {};
    return {
      left: !!p.left,
      right: !!p.right,
      leftW: clampDock("left", p.leftW || DOCK.left.base),
      rightW: clampDock("right", p.rightW || DOCK.right.base),
    };
  });
  const [dragSide, setDragSide] = useState("");
  const bodyRef = useRef(null);

  const toggleDock = useCallback((side) => {
    setDocks((d) => {
      const next = { ...d, [side]: !d[side] };
      Settings.set({ panels: next });
      return next;
    });
  }, []);

  /**
   * Drag a panel edge.
   *
   * Width is written straight to a CSS variable on the body, so the panel, its
   * dock, the collapse handle and this grip all move off the same number and
   * cannot drift apart mid-drag. Settings are written once at the end rather
   * than on every pointermove.
   */
  const startDockResize = useCallback(
    (side) => (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const rect = bodyRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDragSide(side);
      const key = side === "left" ? "leftW" : "rightW";

      const move = (ev) => {
        const px = side === "left" ? ev.clientX - rect.left : rect.right - ev.clientX;
        setDocks((d) => ({ ...d, [key]: clampDock(side, px, rect.width) }));
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setDragSide("");
        setDocks((d) => {
          Settings.set({ panels: d });
          return d;
        });
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [],
  );

  /** Arrow keys on a focused grip, for anyone not using a pointer. */
  const nudgeDock = useCallback((side, delta) => {
    const key = side === "left" ? "leftW" : "rightW";
    setDocks((d) => {
      const next = { ...d, [key]: clampDock(side, d[key] + delta, bodyRef.current?.clientWidth) };
      Settings.set({ panels: next });
      return next;
    });
  }, []);

  const resetDock = useCallback((side) => {
    const key = side === "left" ? "leftW" : "rightW";
    setDocks((d) => {
      const next = { ...d, [key]: DOCK[side].base };
      Settings.set({ panels: next });
      return next;
    });
  }, []);

  // A window that shrinks below what the stored widths assume would leave no
  // canvas at all, so the widths come back inside the clamp instead.
  useEffect(() => {
    const onResize = () =>
      setDocks((d) => {
        const w = bodyRef.current?.clientWidth;
        const leftW = clampDock("left", d.leftW, w);
        const rightW = clampDock("right", d.rightW, w);
        return leftW === d.leftW && rightW === d.rightW ? d : { ...d, leftW, rightW };
      });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const reloadGroups = useCallback(async () => setGroups(await GroupRepo.list()), []);
  useEffect(() => {
    reloadGroups();
  }, [reloadGroups]);

  /* ------------------------------------------------------------- persistence */
  /**
   * @param silent  an auto-save. It says nothing on success: a toast every few
   *                seconds while someone is dragging components about is noise
   *                that trains people to ignore toasts. A FAILURE still has to
   *                reach them — quietly, as the label beside the screen name,
   *                because work that is not being saved after they were told
   *                it would be is the one thing worth interrupting for.
   */
  const save = useCallback(
    async ({ silent = false } = {}) => {
      setSaving(true);
      try {
        // A Save on purpose is a version: numbered one past the last and kept
        // in the history. Auto-save is not — every pause in typing would be.
        // Saving an old version that was loaded makes it the latest; the row
        // it came from stays in the history untouched.
        const doc = silent
          ? await ScreenRepo.save(state.screen)
          : await ScreenRepo.save(
              { ...state.screen, version: (Number(state.screen.version) || 1) + 1 },
              { snapshot: true, note: viewing ? `Restored from v${viewing.version}` : "Saved" },
            );
        b.markSaved(doc);
        if (!silent) {
          if (viewing) toast.success(`v${viewing.version} is now the latest version (v${doc.version})`);
          setViewing(null);
          stash.current = null;
          setHistoryKey((k) => k + 1);
        }
        Settings.set({ lastScreenId: doc.id });
        // The storage API answers 200 even when the write failed, so "saved"
        // has to be read off the repo rather than assumed from the call
        // returning.
        const local = !Storage.remote;
        if (silent) setAutoState({ at: Date.now(), error: local ? "this browser only" : "" });
        else if (local) toast.warning(`Saved in this browser only — ${Storage.lastError}`);
        else if (!viewing) toast.success(`Screen saved — v${doc.version}`);
      } catch (e) {
        if (silent) setAutoState({ at: 0, error: "auto-save failed" });
        else toast.error("Could not save the screen");
      } finally {
        setSaving(false);
      }
    },
    [state.screen, b, viewing],
  );

  /**
   * Load an old version onto the canvas. An edit like any other — undoable,
   * unsaved — so nothing on the server changes until Save. The screen keeps
   * its own id, name, number and status: the version supplies the design.
   */
  const openVersion = useCallback(
    (doc, v) => {
      const cur = b.getState();
      if (!stash.current) stash.current = { screen: cur.screen, dirty: cur.dirty };
      const base = stash.current.screen;
      b.loadVersion({ ...doc, id: base.id, name: base.name, version: base.version, status: base.status });
      setViewing({ versionId: v.versionId, version: v.version, at: v.at });
      setHistoryOpen(false);
      toast.info(`v${v.version} loaded — Save to make it the latest version`);
    },
    [b],
  );

  /** Put back what the canvas held before the first old version was loaded. */
  const backToLatest = useCallback(() => {
    const kept = stash.current;
    if (!kept) return;
    b.loadVersion(kept.screen);
    // It was saved before; loading it back is not an unsaved change.
    if (!kept.dirty) b.markSaved();
    stash.current = null;
    setViewing(null);
    setHistoryOpen(false);
  }, [b]);

  // Another screen opened: whatever was being viewed belonged to the last one.
  const screenId = state.screen.id;
  useEffect(() => {
    stash.current = null;
    setViewing(null);
    setHistoryOpen(false);
  }, [screenId]);

  /**
   * Auto-save: the change is the trigger, and the last one wins.
   *
   * Keyed on the document itself, so every edit restarts the wait and a burst
   * of typing writes once at the end of it rather than once per keystroke.
   * Off by default and remembered per browser — saving someone's half-finished
   * experiment over the version their colleagues are opening is not a default
   * anyone asked for.
   */
  useEffect(() => {
    // An old version on the canvas is being looked at, not chosen: it becomes
    // the latest only on a Save somebody presses.
    if (!autoSave || !state.dirty || saving || viewing) return undefined;
    const t = setTimeout(() => save({ silent: true }), AUTOSAVE_WAIT);
    return () => clearTimeout(t);
  }, [autoSave, state.dirty, state.screen, saving, save, viewing]);

  const toggleAutoSave = useCallback(() => {
    setAutoSave((on) => {
      Settings.set({ autoSave: !on });
      return !on;
    });
    setAutoState({ at: 0, error: "" });
  }, []);

  const publish = useCallback(async () => {
    const doc = await ScreenRepo.publish(state.screen);
    b.markSaved(doc);
    // Published is saved: an old version on the canvas is now the latest.
    stash.current = null;
    setViewing(null);
    setHistoryKey((k) => k + 1);
    if (Storage.remote) toast.success(`Published v${doc.version} — live at /screen/${doc.id}`);
    else toast.warning(`Published in this browser only — ${Storage.lastError}`);
  }, [state.screen, b]);

  const saveAsTemplate = useCallback(async () => {
    const tpl = JSON.parse(JSON.stringify(state.screen));
    tpl.id = uid("tpl");
    tpl.status = "template";
    await TemplateRepo.save(tpl);
    if (Storage.remote) toast.success("Saved to the template library");
    else toast.warning(`Saved in this browser only — ${Storage.lastError}`);
  }, [state.screen]);

  const exportJson = useCallback(() => {
    downloadJson(`${state.screen.name.replace(/\s+/g, "-").toLowerCase()}.screen.json`, state.screen);
  }, [state.screen]);

  const exportCode = useCallback(() => {
    downloadText(`${state.screen.name.replace(/\s+/g, "")}.jsx`, generateJsx(state.screen), "text/jsx");
    toast.info("JSX exported");
  }, [state.screen]);

  const importJson = useCallback(
    (file) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const doc = JSON.parse(String(reader.result));
          const errors = validateScreen(doc, REGISTRY);
          if (errors.length) {
            toast.error(`Import failed: ${errors[0]}`);
            return;
          }
          b.setScreen(normalizeScreen(doc));
          toast.success("Screen imported");
        } catch (e) {
          toast.error("That file is not valid screen JSON");
        }
      };
      reader.readAsText(file);
    },
    [b],
  );

  /* --------------------------------------------------------------- shortcuts */
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
        return;
      }
      if (typing) return;

      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        b.undo();
      } else if ((mod && e.key.toLowerCase() === "y") || (mod && e.shiftKey && e.key.toLowerCase() === "z")) {
        e.preventDefault();
        b.redo();
      } else if (mod && e.key.toLowerCase() === "c") {
        if (state.selectedIds[0]) b.copy(state.selectedIds[0]);
      } else if (mod && e.key.toLowerCase() === "v") {
        b.paste(state.selectedIds[0]);
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (state.selectedIds[0]) b.duplicate(state.selectedIds[0]);
      } else if (mod && e.key.toLowerCase() === "g") {
        // Ctrl+G wraps the selection in a responsive Row, Ctrl+Shift+G in a Grid.
        e.preventDefault();
        if (state.selectedIds.length) {
          if (e.shiftKey) b.wrapInGrid(state.selectedIds);
          else b.wrapInRow(state.selectedIds);
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (state.selectedIds.length) {
          e.preventDefault();
          b.removeNodes(state.selectedIds);
        }
      } else if (e.key === "[") {
        toggleDock("left");
      } else if (e.key === "]") {
        toggleDock("right");
      } else if (e.key === "Escape") {
        b.select([]);
        setDrawer(null);
        setLibrary(false);
        setMigrate(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [b, save, state.selectedIds, toggleDock]);

  /* --------------------------------------------------------------------- DnD */
  const handleDrop = useCallback(
    ({ kind, type, nodeId, packId, presetId, parentId, index }) => {
      if (!parentId) return;
      if (kind === "move" && nodeId) {
        b.moveNode(nodeId, parentId, index);
        return;
      }
      // A saved common component brings its own subtree, API config, data
      // sources, variables and modals — placing it is not an "add component".
      if (kind === "common") {
        const pack = (common?.items || []).find((c) => c.id === packId);
        if (pack) common.place(pack, parentId, index);
        return;
      }
      // A healthcare preset is a ready-made subtree, built fresh for this drop.
      if (kind === "preset") {
        const preset = presetById(packId || presetId);
        if (preset) b.addSubtree(preset.build(), parentId, index);
        return;
      }
      if (kind !== "create") return;

      // Dropping into a horizontal container gives the new component an equal
      // share of the row, so two cards side by side each take half instead of
      // one hugging its text and the other stretching. A vertical container
      // keeps the default full-width behaviour.
      const parent = findNode(b.getState().screen.root, parentId);
      const pdef = parent ? getDef(parent.type) : null;
      const direction =
        parent?.props?.direction || (parent?.type === "Row" || parent?.type === "FlexBox" ? "row" : "column");
      const flowsAcross = !!pdef && parent.type !== "GridLayout" && direction === "row";

      // An auto-fit container already sizes its children (and lets them wrap),
      // so nothing is written on the node itself. A plain row gets an explicit
      // equal share with the same wrap-friendly basis.
      const seed =
        flowsAcross && !parent.props?.autoFit ? { style: { flex: "1 1 200px", minWidth: "0" } } : {};
      b.addComponent(type, parentId, index, seed);
    },
    [b, common],
  );

  const openDoc = (doc) => {
    b.setScreen(normalizeScreen(doc));
    setLibrary(false);
    Settings.set({ lastScreenId: doc.id });
  };

  /**
   * Put a converted screen on the canvas.
   *
   * It replaces what is open, so unsaved work is asked about first — the
   * console is browsed with the builder still holding a screen, and one click
   * on the wrong row should not discard an afternoon. Nothing is saved here:
   * the document is a draft until someone presses Save, exactly like an import.
   */
  const openConverted = useCallback(
    (doc) => {
      // eslint-disable-next-line no-alert
      if (state.dirty && !window.confirm("Replace the screen you are editing? Unsaved changes will be lost.")) return;
      const errors = validateScreen(doc, REGISTRY);
      if (errors.length) {
        toast.error(`The converted screen was rejected: ${errors[0]}`);
        return;
      }
      b.setScreen(normalizeScreen(doc));
      setMigrate(false);
      toast.success(`${doc.name} opened — review it, then Save`);
    },
    [b, state.dirty],
  );

  const rootRef = useFitToViewport();

  return (
    <DndProvider onDrop={handleDrop}>
      <div ref={rootRef} className={`dsb-root ${state.mode === "preview" ? "is-preview" : ""}`}>
        <Toolbar
          saving={saving}
          autoSave={autoSave}
          autoSavedAt={autoState.at}
          autoError={autoState.error}
          onToggleAutoSave={toggleAutoSave}
          onSave={() => save()}
          onPublish={publish}
          onOpenLibrary={() => setLibrary(true)}
          onOpenMigrate={() => setMigrate(true)}
          onExport={exportJson}
          onExportCode={exportCode}
          onImport={() => fileRef.current?.click()}
          onNew={() => setAskNew(true)}
          historyOpen={historyOpen}
          onToggleHistory={() => setHistoryOpen((o) => !o)}
          viewingVersion={viewing}
          historyKey={historyKey}
          onOpenVersion={openVersion}
          onBackToLatest={backToLatest}
        />
        {viewing ? (
          <div className="dsb-vbanner" role="status">
            <Icon name="History" size={14} />
            <span className="dsb-vbanner-text">
              Viewing <b>v{viewing.version}</b>
              {viewing.at ? ` from ${new Date(viewing.at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}` : ""}
              {" "}— edit it if you like; <b>Save</b> makes it the latest version. Auto-save is paused.
            </span>
            <Tap className="dsb-vbanner-btn tone-back" onClick={backToLatest}>
              <Icon name="Undo2" size={12} /> Back to latest
            </Tap>
            <Tap className="dsb-vbanner-btn tone-save" onClick={() => !saving && save()}>
              <Icon name="Save" size={12} /> {saving ? "Saving…" : "Save as latest"}
            </Tap>
          </div>
        ) : null}

        <div
          className={`dsb-body ${dragSide ? "is-resizing" : ""}`}
          ref={bodyRef}
          style={{
            "--b-dock-left": `${docks.leftW}px`,
            "--b-dock-right": `${docks.rightW}px`,
            // Nothing eases while a pointer is driving it: a transition on the
            // width someone is dragging reads as lag, not as smoothness.
            ...(dragSide ? { "--b-dock-ease": "0ms" } : null),
          }}
        >
          {state.mode === "design" ? (
            <>
              {/* The dock animates its width; the panel inside keeps its own,
                  so the contents slide out of sight instead of reflowing into
                  an ever-narrower column on the way. */}
              <div className={`dsb-dock is-left ${docks.left ? "is-collapsed" : ""}`}>
                <SideSplit
                  top={<Palette groups={groups} onReloadGroups={reloadGroups} />}
                  bottom={<LayersPanel onReloadGroups={reloadGroups} />}
                />
              </div>
              <button
                type="button"
                className={`dsb-dock-btn is-left ${docks.left ? "is-off" : ""}`}
                title={`${docks.left ? "Show" : "Hide"} the components panel  ([)`}
                aria-label={`${docks.left ? "Show" : "Hide"} the components panel`}
                aria-expanded={!docks.left}
                onClick={() => toggleDock("left")}
              >
                <Icon name={docks.left ? "ChevronRight" : "ChevronLeft"} size={13} />
              </button>
              {!docks.left ? (
                <div
                  className={`dsb-dock-grip is-left ${dragSide === "left" ? "is-on" : ""}`}
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize the components panel"
                  aria-valuenow={docks.leftW}
                  aria-valuemin={DOCK.left.min}
                  aria-valuemax={DOCK.left.max}
                  tabIndex={0}
                  title="Drag to resize — double-click to reset"
                  onPointerDown={startDockResize("left")}
                  onDoubleClick={() => resetDock("left")}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft") nudgeDock("left", -16);
                    else if (e.key === "ArrowRight") nudgeDock("left", 16);
                    else return;
                    e.preventDefault();
                  }}
                />
              ) : null}
            </>
          ) : null}

          <main className="dsb-main">
            <Canvas />
          </main>

          {state.mode === "design" ? (
            <>
              <div className={`dsb-dock is-right ${docks.right ? "is-collapsed" : ""}`}>
                <Inspector />
              </div>
              <button
                type="button"
                className={`dsb-dock-btn is-right ${docks.right ? "is-off" : ""}`}
                title={`${docks.right ? "Show" : "Hide"} the properties panel  (])`}
                aria-label={`${docks.right ? "Show" : "Hide"} the properties panel`}
                aria-expanded={!docks.right}
                onClick={() => toggleDock("right")}
              >
                <Icon name={docks.right ? "ChevronLeft" : "ChevronRight"} size={13} />
              </button>
              {!docks.right ? (
                <div
                  className={`dsb-dock-grip is-right ${dragSide === "right" ? "is-on" : ""}`}
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize the properties panel"
                  aria-valuenow={docks.rightW}
                  aria-valuemin={DOCK.right.min}
                  aria-valuemax={DOCK.right.max}
                  tabIndex={0}
                  title="Drag to resize — double-click to reset"
                  onPointerDown={startDockResize("right")}
                  onDoubleClick={() => resetDock("right")}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft") nudgeDock("right", 16);
                    else if (e.key === "ArrowRight") nudgeDock("right", -16);
                    else return;
                    e.preventDefault();
                  }}
                />
              ) : null}
            </>
          ) : null}

          {drawer ? (
            <div className="dsb-drawer-host">
              {drawer === "theme" ? <ThemeEditor onClose={() => setDrawer(null)} /> : null}
              {drawer === "data" ? <DataPanel onClose={() => setDrawer(null)} /> : null}
            </div>
          ) : null}
        </div>

        <footer className="dsb-statusbar">
          <span>
            <Icon name="Layers" size={11} /> {state.screen.name}
          </span>
          <span>
            <Icon name="Database" size={11} /> {Object.keys(state.screen.dataSources || {}).length} sources
          </span>
          <span>
            <Icon name="History" size={11} /> {state.history.past.length} undo steps
          </span>
          <span className="dsb-sb-hint">
            Ctrl+S save · Ctrl+Z undo · Ctrl+D duplicate · Ctrl+G wrap in Row · Ctrl+Shift+G wrap in Grid · Del remove · Space+drag pan
          </span>
          <span className="dsb-sb-route">
            <Icon name="Link2" size={11} /> /screen/{state.screen.id}
          </span>
          {onExit ? (
            <button type="button" className="dsbi-mini" onClick={onExit}>
              Close
            </button>
          ) : null}
        </footer>

        {/* Dev only, for the reason the toolbar button is (Toolbar.jsx): the
            console talks to a Node service on the developer's own machine, so
            on a deployed build there is nothing for it to reach. Gated at the
            mount as well as at the button, so a stale `migrate` flag cannot
            open a panel that could only report an error. */}
        {import.meta.env.DEV && migrate ? (
          <React.Suspense fallback={null}>
            <MigrationConsole onClose={() => setMigrate(false)} onOpen={openConverted} />
          </React.Suspense>
        ) : null}

        {askNew ? (
          <AskName
            title="New screen"
            label="Screen name"
            value="Untitled Screen"
            okText="Create"
            onCancel={() => setAskNew(false)}
            onOk={(name) => {
              setAskNew(false);
              b.setScreen(createScreen(name));
            }}
          />
        ) : null}

      {library ? (
          <TemplateLibrary
            onClose={() => setLibrary(false)}
            onOpen={openDoc}
            currentScreen={state.screen}
            onSaveAsTemplate={saveAsTemplate}
            // Filing the open screen from the library: the canvas's copy follows,
            // so its next save does not put the old modules back.
            onModulesChange={(modules) => b.setMeta({ modules, module: undefined })}
          />
        ) : null}

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importJson(f);
            e.target.value = "";
          }}
        />
      </div>
    </DndProvider>
  );
}

export default function BuilderShell({ screenId, onExit }) {
  const [boot, setBoot] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      // The builder always opens on an EMPTY screen. Nothing is auto-loaded:
      // the reference screen only exists in the template library, where it has
      // to be opened or duplicated on purpose. `?screen=<id>` opens a specific
      // saved screen; anything else starts from scratch.
      await TemplateRepo.seed(BUILT_IN_TEMPLATES);
      const doc = screenId ? await ScreenRepo.get(screenId) : null;
      if (alive) setBoot(doc ? normalizeScreen(doc) : createScreen("Untitled Screen"));
    })();
    return () => {
      alive = false;
    };
  }, [screenId]);

  if (!boot) {
    return (
      <div className="dsb-boot">
        <div className="dsb-boot-card">
          <Icon name="Wand2" size={20} />
          <span>Loading screen builder…</span>
        </div>
      </div>
    );
  }

  return (
    <BuilderProvider initialScreen={boot}>
      {/* Outside the shell, so the palette, the canvas menu and the drop
          handler all read one list of saved common components. */}
      <CommonProvider>
        <ShellInner onExit={onExit} />
      </CommonProvider>
    </BuilderProvider>
  );
}
