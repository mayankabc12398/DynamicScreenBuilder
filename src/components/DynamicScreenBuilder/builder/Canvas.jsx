/**
 * The canvas.
 *
 * It mounts the very same <ScreenRenderer/> the live page uses and passes a
 * `wrapNode` decorator that adds selection chrome, drop targets and resize
 * handles. Nothing about the components themselves changes between design and
 * runtime — that is what makes the canvas WYSIWYG.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "../registry/icons";
import ScreenRenderer from "../renderer/ScreenRenderer";
import { previewParams } from "../utils/screenParams";
import { BREAKPOINTS } from "../schema/schema";
import { useBuilder } from "../store/builderStore";
import { useDnd } from "./DndManager";
import NodeMenu from "./NodeMenu";

const SNAP = 6; // px tolerance for the resize snapping guides
// How far the pointer has to travel before a press on a component counts as
// a drag rather than a click that selects it.
const DRAG_THRESHOLD = 4;

/* Style properties that decide how big a node is inside its parent. The design
   wrapper copies these so the selection outline and the resize handles hug the
   component rather than the whole row. */
const SIZE_KEYS = [
  "width",
  "minWidth",
  "maxWidth",
  "height",
  "minHeight",
  "maxHeight",
  "flex",
  "flexGrow",
  "flexBasis",
  "alignSelf",
  "gridColumn",
  "gridRow",
];

function sizingOf(style) {
  const out = {};
  let sized = false;
  SIZE_KEYS.forEach((k) => {
    const v = style?.[k];
    if (v !== undefined && v !== null && v !== "") {
      out[k] = v;
      sized = true;
    }
  });
  return { sizing: out, sized };
}

function ResizeHandles({ node, updateStyle, snap }) {
  const [guide, setGuide] = useState(null);

  const start = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    const wrapper = e.currentTarget.closest("[data-dsb-node]");
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    // Sibling edges are the snap targets — this is what makes resizing feel
    // like a design tool instead of a raw drag.
    const parentId = wrapper.dataset.dsbParent;
    const siblings = parentId
      ? Array.from(document.querySelectorAll(`[data-dsb-parent="${parentId}"]`))
          .filter((el) => el !== wrapper)
          .map((el) => el.getBoundingClientRect())
      : [];

    const move = (ev) => {
      const patch = {};
      if (mode !== "b") {
        let w = Math.max(40, rect.width + (ev.clientX - startX));
        if (snap) {
          const hit = siblings.find((s) => Math.abs(s.width - w) < SNAP);
          if (hit) {
            w = hit.width;
            setGuide({ left: rect.left, top: rect.top - 3, width: w, kind: "w" });
          } else setGuide(null);
        }
        patch.width = `${Math.round(w)}px`;
      }
      if (mode !== "r") {
        const h = Math.max(24, rect.height + (ev.clientY - startY));
        patch.height = `${Math.round(h)}px`;
      }
      // Pin the node: inside an auto-fit parent it would otherwise be
      // stretched straight back to an equal share.
      patch.flex = "0 0 auto";
      updateStyle(node.id, patch, `resize:${node.id}`);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setGuide(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <>
      <span className="dsb-rz r" onPointerDown={(e) => start(e, "r")} />
      <span className="dsb-rz b" onPointerDown={(e) => start(e, "b")} />
      <span className="dsb-rz br" onPointerDown={(e) => start(e, "br")} />
      {guide ? <div className="dsb-guide" style={{ left: guide.left, top: guide.top, width: guide.width }} /> : null}
    </>
  );
}

export default function Canvas() {
  const b = useBuilder();
  const { state } = b;
  const dnd = useDnd();
  const scrollRef = useRef(null);
  const [panning, setPanning] = useState(false);
  // Which node was right-clicked, and where the pointer was. The menu itself is
  // portalled to <body>, so this only has to remember the coordinates.
  const [menu, setMenu] = useState(null);
  const spaceRef = useRef(false);

  const bp = BREAKPOINTS.find((x) => x.key === state.breakpoint) || BREAKPOINTS[0];
  const design = state.mode === "design";
  // The screen's parameters, at their preview values — so a screen that
  // behaves differently when opened with a UHID can be tried both ways here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const params = useMemo(() => previewParams(state.screen), [state.screen?.params]);

  /* Space + drag to pan, exactly like a design tool. */
  useEffect(() => {
    const down = (e) => {
      if (e.code === "Space" && !e.repeat && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        spaceRef.current = true;
        document.body.classList.add("dsb-pan");
      }
    };
    const up = (e) => {
      if (e.code === "Space") {
        spaceRef.current = false;
        document.body.classList.remove("dsb-pan");
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      document.body.classList.remove("dsb-pan");
    };
  }, []);

  const onPointerDown = (e) => {
    if (!spaceRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    setPanning(true);
    const sx = e.clientX;
    const sy = e.clientY;
    const sl = el.scrollLeft;
    const st = el.scrollTop;
    const move = (ev) => {
      el.scrollLeft = sl - (ev.clientX - sx);
      el.scrollTop = st - (ev.clientY - sy);
    };
    const up = () => {
      setPanning(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  /**
   * Grab a component anywhere on its body to move it.
   *
   * A pointerdown is ambiguous — it could be the start of a click that selects,
   * or the start of a drag that moves — so nothing happens until the pointer
   * has travelled far enough to be a drag. Below that it stays a plain click,
   * which is what makes selecting a component and dragging it feel like one
   * gesture rather than two modes.
   *
   * The tag's grip still works; this only means the whole component is a handle
   * too, instead of a ten-pixel icon.
   */
  const armDrag = useCallback(
    (e, payload) => {
      if (e.button !== 0) return;
      // Anything that handles its own pointer (a tab, a table's view toggle)
      // keeps it.
      if (e.target?.closest?.("[data-dsb-interactive]")) return;

      const startX = e.clientX;
      const startY = e.clientY;

      const cleanup = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", cleanup);
        window.removeEventListener("pointercancel", cleanup);
      };
      const move = (ev) => {
        if (Math.abs(ev.clientX - startX) < DRAG_THRESHOLD && Math.abs(ev.clientY - startY) < DRAG_THRESHOLD) return;
        cleanup();
        // Not the pointermove itself: `button` is -1 on a move (no button
        // changed state), and startDrag rejects anything that is not the left
        // button. Only the press said which button this is, so pass that on
        // with the current position.
        dnd?.startDrag(payload, { clientX: ev.clientX, clientY: ev.clientY, button: 0 });
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", cleanup);
      window.addEventListener("pointercancel", cleanup);
    },
    [dnd],
  );

  /* Ctrl/⌘ + wheel zooms the canvas. */
  const onWheel = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    b.setZoom(state.zoom + (e.deltaY > 0 ? -0.08 : 0.08));
  };

  const wrapNode = useCallback(
    ({ node, def, element, hidden, parentId, style }) => {
      const selected = state.selectedIds.includes(node.id);
      const isRoot = node.id === state.screen.root.id;
      const empty = def.isContainer && !(node.children || []).length;
      const dragTarget = dnd?.target?.parentId === node.id;
      const { sizing, sized } = sizingOf(style);

      return (
        <div
          key={node.id}
          className={`dsb-dnode ${selected ? "is-sel" : ""} ${hidden ? "is-hidden" : ""} ${isRoot ? "is-root" : ""} ${
            empty ? "is-empty" : ""
          } ${dragTarget ? "is-droptarget" : ""} ${node.locked ? "is-locked" : ""} ${node.access?.restricted ? "is-restricted" : ""}`}
          data-dsb-node={node.id}
          data-dsb-type={node.type}
          data-dsb-parent={parentId || undefined}
          data-dsb-container={def.isContainer ? "1" : undefined}
          data-dsb-sized={sized ? "1" : undefined}
          style={sized ? sizing : undefined}
          onPointerDown={(e) => {
            if (spaceRef.current) return;
            e.stopPropagation();
            if (node.locked) return;
            if (e.metaKey || e.ctrlKey) b.toggleSelect(node.id);
            else b.select(node.id);
            if (isRoot) return;
            armDrag(e, { kind: "move", type: node.type, nodeId: node.id, label: node.name, icon: def.icon });
          }}
          onContextMenu={(e) => {
            // Only the innermost component under the pointer answers — without
            // stopPropagation every ancestor would open its own menu on the way
            // up and the last one to run would win.
            e.preventDefault();
            e.stopPropagation();
            b.select(node.id);
            setMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
          }}
        >
          {element}

          {empty ? (
            <div className="dsb-dropzone">
              <Icon name={def.icon} size={14} />
              <span>{def.dropHint || "Drop components here"}</span>
            </div>
          ) : null}

          {!isRoot ? (
            <span className="dsb-dnode-tag">
              <span
                className="dsb-dnode-grip"
                title="Drag to move"
                aria-label={`Drag ${node.name} to move it`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (node.locked) return;
                  dnd?.startDrag({ kind: "move", type: node.type, nodeId: node.id, label: node.name, icon: def.icon }, e);
                }}
              >
                <Icon name="GripVertical" size={10} />
              </span>
              <Icon name={def.icon} size={10} className="dsb-dnode-type" />
              {node.name}
              {node.hidden ? <Icon name="EyeOff" size={10} /> : null}
              {node.locked ? <Icon name="Lock" size={10} /> : null}
              {node.access?.restricted ? <Icon name="ShieldCheck" size={10} /> : null}
            </span>
          ) : null}

          {/* Always on, not only on hover: which boxes only granted users see
              is the point of the marker. */}
          {node.access?.restricted && !isRoot ? (
            <span className="dsb-dnode-restricted" title="Restricted — shown only to users granted it on the Screen Box Permission page">
              <Icon name="ShieldCheck" size={10} />
              Restricted
            </span>
          ) : null}

          {selected && !isRoot && !node.locked ? <ResizeHandles node={node} updateStyle={b.updateStyle} snap={state.snap} /> : null}
        </div>
      );
    },
    [state.selectedIds, state.screen.root.id, state.snap, dnd, b, armDrag],
  );

  const frameWidth = state.breakpoint === "desktop" ? "100%" : `${bp.width}px`;

  return (
    <div
      className={`dsb-canvas-wrap ${state.showGrid ? "has-grid" : ""} ${panning ? "is-panning" : ""}`}
      ref={scrollRef}
      onPointerDown={onPointerDown}
      onWheel={onWheel}
    >
      <div
        className="dsb-canvas-zoom"
        // A transform — `scale(1)` included — makes this element the containing
        // block for every `position: fixed` descendant, which would pin an
        // overlay to the scrolled canvas instead of the viewport. At 1:1 there
        // is nothing to scale, so the transform is left off entirely.
        style={
          state.zoom === 1
            ? { width: "100%" }
            : { transform: `scale(${state.zoom})`, transformOrigin: "top center", width: `${100 / state.zoom}%` }
        }
      >
        <div
          className={`dsb-frame bp-${state.breakpoint} ${design ? "is-design" : "is-preview"}`}
          style={{ width: frameWidth, maxWidth: state.breakpoint === "desktop" ? 1400 : bp.width }}
          onPointerDown={(e) => {
            // Clicking the empty frame clears the selection.
            if (e.target === e.currentTarget) b.select([]);
          }}
        >
          <div className={`dsb-canvas ${design ? "is-design" : ""}`}>
            <ScreenRenderer
              screen={state.screen}
              mode={design ? "design" : "preview"}
              breakpoint={state.breakpoint}
              params={params}
              wrapNode={design ? wrapNode : undefined}
              onSelectHeader={design ? b.selectHeader : undefined}
              headerSelected={design && !!state.headerSelected}
            />
          </div>
        </div>
      </div>

      {menu ? <NodeMenu x={menu.x} y={menu.y} nodeId={menu.nodeId} onClose={() => setMenu(null)} /> : null}

      <div className="dsb-canvas-hud">
        <span>{bp.label}</span>
        <em>{state.breakpoint === "desktop" ? "fluid" : `${bp.width}px`}</em>
        <span>{Math.round(state.zoom * 100)}%</span>
      </div>
    </div>
  );
}
