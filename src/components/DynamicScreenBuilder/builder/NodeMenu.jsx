/**
 * Right-click menu for a component, shared by the canvas and the layers tree.
 *
 * It is the entry point for "save this as a common component": the thing people
 * reach for is the component itself, not a panel somewhere else, so the action
 * lives where the pointer already is.
 *
 * Rendered through a portal in viewport coordinates — the canvas has a zoom
 * transform on it, which would otherwise become the menu's containing block and
 * drag it away from the pointer.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "../registry/icons";
import { getDef } from "../registry";
import { useBuilder } from "../store/builderStore";
import { useCommon } from "./CommonLibrary";
import { findNode, findPath } from "../utils/tree";

const MENU_W = 244;

export default function NodeMenu({ x, y, nodeId, onClose }) {
  const b = useBuilder();
  const { state } = b;
  const common = useCommon();
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });

  /**
   * A right-click lands on the innermost component under the pointer, which is
   * an input far more often than it is the panel around it — and the panel is
   * usually what someone wants to save. So the menu can be walked up its own
   * ancestors instead of being dismissed and re-aimed at a two-pixel gap.
   */
  const [targetId, setTargetId] = useState(nodeId);
  useEffect(() => setTargetId(nodeId), [nodeId]);

  const node = findNode(state.screen.root, targetId);
  const def = node ? getDef(node.type) : null;
  const isRoot = node && node.id === state.screen.root.id;
  // Root first, the clicked node last. The root is the screen itself — saving
  // that as a "component" is a template, so it is not offered here.
  const ancestors = (findPath(state.screen.root, targetId) || []).slice(1, -1);

  // Keep the whole menu on screen even when the click was near an edge. Walking
  // to an ancestor changes the height, so this re-runs for that too.
  useLayoutEffect(() => {
    const h = ref.current?.offsetHeight || 260;
    setPos({
      left: Math.min(x, window.innerWidth - MENU_W - 8),
      top: Math.min(y, Math.max(8, window.innerHeight - h - 8)),
    });
  }, [x, y, targetId]);

  useEffect(() => {
    const down = (e) => {
      if (!ref.current?.contains(e.target)) onClose();
    };
    const key = (e) => e.key === "Escape" && onClose();
    window.addEventListener("pointerdown", down, true);
    window.addEventListener("keydown", key);
    window.addEventListener("blur", onClose);
    return () => {
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("keydown", key);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);

  if (!node || !def) return null;

  const run = (fn) => () => {
    fn();
    onClose();
  };

  const Item = ({ icon, label, hint, onClick, danger, disabled, accent }) => (
    <button
      type="button"
      className={`dsb-ctx-item ${danger ? "is-danger" : ""} ${accent ? "is-accent" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name={icon} size={13} />
      <span>{label}</span>
      {hint ? <em>{hint}</em> : null}
    </button>
  );

  return createPortal(
    // `dsb-portal` carries the builder's own --b-* palette and font: this is
    // mounted on <body>, outside .dsb-root, where none of them exist — without
    // it the menu paints with no background at all and the canvas shows through.
    <div className="dsb-portal dsb-ctx" ref={ref} style={{ left: pos.left, top: pos.top, width: MENU_W }}>
      <header className="dsb-ctx-head">
        <Icon name={def.icon} size={12} />
        <span>{node.name}</span>
        <span className="dsb-ctx-type">{def.label}</span>
        {node.common ? <em title={`From the common component “${node.common.name}”`}>common</em> : null}
        {node.access?.restricted ? (
          <em className="is-restricted" title="Shown only to users granted it on the Screen Box Permission page">
            restricted
          </em>
        ) : null}
      </header>

      {ancestors.length ? (
        <div className="dsb-ctx-up" title="Aim the menu at a container around this component">
          <Icon name="ArrowUp" size={10} />
          {ancestors.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                // Select it too, so the canvas outline shows what the menu is
                // now pointing at before anything is clicked.
                b.select(a.id);
                setTargetId(a.id);
              }}
            >
              {a.name}
            </button>
          ))}
        </div>
      ) : null}

      <Item
        icon="SquareStack"
        accent
        label={node.common ? "Save as new common component…" : "Save as common component…"}
        onClick={run(() => {
          b.select(node.id);
          common?.saveFrom(node.id);
        })}
      />
      {node.common ? (
        <Item
          icon="Save"
          label={`Update “${node.common.name}”`}
          onClick={run(() => {
            b.select(node.id);
            const existing = (common?.items || []).find((c) => c.id === node.common.id);
            common?.saveFrom(node.id, existing || { id: node.common.id, name: node.common.name });
          })}
        />
      ) : null}

      <div className="dsb-ctx-sep" />

      <Item icon="Copy" label="Copy" hint="Ctrl+C" onClick={run(() => b.copy(node.id))} />
      <Item
        icon="Layers"
        label="Paste inside"
        hint="Ctrl+V"
        disabled={!state.clipboard || !def.isContainer}
        onClick={run(() => b.paste(node.id))}
      />
      <Item icon="SquarePen" label="Duplicate" hint="Ctrl+D" disabled={isRoot} onClick={run(() => b.duplicate(node.id))} />

      <div className="dsb-ctx-sep" />

      <Item
        icon="Columns3"
        label="Wrap in Row"
        hint="Ctrl+G"
        disabled={isRoot}
        onClick={run(() => b.wrapInRow([node.id]))}
      />
      <Item
        icon="LayoutGrid"
        label="Wrap in Grid"
        hint="Ctrl+Shift+G"
        disabled={isRoot}
        onClick={run(() => b.wrapInGrid([node.id]))}
      />
      <Item
        icon="SquareStack"
        label="Ungroup"
        disabled={isRoot || !(node.children || []).length}
        onClick={run(() => b.ungroup(node.id))}
      />

      <div className="dsb-ctx-sep" />

      {/* Restricted boxes show at runtime only to the users granted them on the
          Screen Box Permission page (sb_screen_access). Lifting it leaves those
          grants in place, so restricting the box again restores them. */}
      <Item
        icon={node.access?.restricted ? "ShieldX" : "ShieldCheck"}
        label={node.access?.restricted ? "Remove access restriction" : "Restrict access…"}
        disabled={isRoot}
        onClick={run(() => {
          if (node.access?.restricted) {
            const ok = window.confirm(
              `“${node.name}” will be visible to everyone again once the screen is published. Continue?`,
            );
            if (ok) b.updateNode(node.id, { access: undefined });
          } else {
            b.updateNode(node.id, { access: { restricted: true } });
          }
        })}
      />

      <Item
        icon={node.hidden ? "Eye" : "EyeOff"}
        label={node.hidden ? "Show" : "Hide"}
        onClick={run(() => b.updateNode(node.id, { hidden: !node.hidden }))}
      />
      <Item
        icon="Lock"
        label={node.locked ? "Unlock" : "Lock"}
        onClick={run(() => b.updateNode(node.id, { locked: !node.locked }))}
      />
      <Item
        icon="Trash2"
        label="Delete"
        hint="Del"
        danger
        disabled={isRoot}
        onClick={run(() => b.removeNodes([node.id]))}
      />
    </div>,
    document.body,
  );
}
