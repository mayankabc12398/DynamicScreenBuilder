/**
 * Layers / component tree. Mirrors the JSON structure exactly: select, rename,
 * reorder by drag (same DnD engine as the canvas), toggle visibility, lock.
 */
import React, { useState } from "react";
import Icon from "../registry/icons";
import { getDef } from "../registry";
import { useBuilder } from "../store/builderStore";
import { useDnd } from "./DndManager";
import { GroupRepo } from "../utils/storage";
import AskName from "./AskName";
import { uid } from "../schema/schema";
import NodeMenu from "./NodeMenu";
import usePanelFold from "./usePanelFold";
import Tap from "./Tap";

function LayerRow({ node, depth, collapsed, toggleCollapse, onSaveGroup, onMenu }) {
  const b = useBuilder();
  const dnd = useDnd();
  const { state } = b;
  const def = getDef(node.type);
  const selected = state.selectedIds.includes(node.id);
  const [renaming, setRenaming] = useState(false);
  const kids = node.children || [];
  const isCollapsed = collapsed.includes(node.id);

  return (
    <>
      <div
        className={`dsb-layer ${selected ? "is-sel" : ""} ${node.hidden ? "is-hidden" : ""}`}
        style={{ paddingLeft: 6 + depth * 13 }}
        onClick={(e) => (e.metaKey || e.ctrlKey ? b.toggleSelect(node.id) : b.select(node.id))}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          b.select(node.id);
          onMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
        }}
      >
        <button
          type="button"
          className="dsb-layer-caret"
          onClick={(e) => {
            e.stopPropagation();
            if (kids.length) toggleCollapse(node.id);
          }}
        >
          {kids.length ? <Icon name={isCollapsed ? "ChevronRight" : "ChevronDown"} size={11} /> : <span className="dsb-layer-dot" />}
        </button>

        <span
          className="dsb-layer-grip"
          title="Drag to move"
          onPointerDown={(e) => {
            if (node.locked || node.id === state.screen.root.id) return;
            e.stopPropagation();
            dnd?.startDrag({ kind: "move", type: node.type, nodeId: node.id, label: node.name, icon: def?.icon }, e);
          }}
        >
          <Icon name="GripVertical" size={11} />
        </span>

        <Icon name={def?.icon || "Square"} size={12} />

        {renaming ? (
          <input
            className="dsb-layer-rename"
            defaultValue={node.name}
            autoFocus
            onBlur={(e) => {
              b.updateNode(node.id, { name: e.target.value || node.type });
              setRenaming(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setRenaming(false);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="dsb-layer-name" onDoubleClick={() => setRenaming(true)}>
            {node.name}
            {/* Dropped from the common-component palette — worth seeing here,
                because editing this copy does not change the saved original. */}
            {node.common ? (
              <span className="dsb-layer-common" title={`Common component: ${node.common.name}`}>
                <Icon name="SquareStack" size={10} />
              </span>
            ) : null}
            {node.access?.restricted ? (
              <span className="dsb-layer-restricted" title="Restricted — shown only to users granted it">
                <Icon name="ShieldCheck" size={10} />
              </span>
            ) : null}
          </span>
        )}

        <span className="dsb-layer-tools">
          <button
            type="button"
            title="Save as reusable block"
            onClick={(e) => {
              e.stopPropagation();
              onSaveGroup(node);
            }}
          >
            <Icon name="SquareStack" size={11} />
          </button>
          <button
            type="button"
            title={node.hidden ? "Show" : "Hide"}
            onClick={(e) => {
              e.stopPropagation();
              b.updateNode(node.id, { hidden: !node.hidden });
            }}
          >
            <Icon name={node.hidden ? "EyeOff" : "Eye"} size={11} />
          </button>
          <button
            type="button"
            title={node.locked ? "Unlock" : "Lock"}
            onClick={(e) => {
              e.stopPropagation();
              b.updateNode(node.id, { locked: !node.locked });
            }}
          >
            <Icon name="Lock" size={11} style={{ opacity: node.locked ? 1 : 0.4 }} />
          </button>
        </span>
      </div>

      {!isCollapsed
        ? kids.map((c) => (
            <LayerRow
              key={c.id}
              node={c}
              depth={depth + 1}
              collapsed={collapsed}
              toggleCollapse={toggleCollapse}
              onSaveGroup={onSaveGroup}
              onMenu={onMenu}
            />
          ))
        : null}
    </>
  );
}

export default function LayersPanel({ onReloadGroups }) {
  const b = useBuilder();
  const { state } = b;
  const [collapsed, setCollapsed] = useState([]);
  const [menu, setMenu] = useState(null);
  const [folded, toggleFold] = usePanelFold("layers");
  // Asked in the page rather than with window.prompt, which some of the hosts
  // this builder runs in do not implement (see builder/AskName).
  const [saveAsk, setSaveAsk] = useState(null);

  const toggleCollapse = (id) => setCollapsed((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const saveGroup = (node) => setSaveAsk(node);

  const storeGroup = async (node, name) => {
    await GroupRepo.save({ id: uid("grp"), name, node: JSON.parse(JSON.stringify(node)), at: new Date().toISOString() });
    onReloadGroups?.();
  };

  return (
    <div className={`dsb-layers ${folded ? "is-folded" : ""}`}>
      {saveAsk ? (
        <AskName
          title="Save this block"
          label="Save it for reuse as"
          value={saveAsk.name || ""}
          onCancel={() => setSaveAsk(null)}
          onOk={(name) => {
            const node = saveAsk;
            setSaveAsk(null);
            storeGroup(node, name);
          }}
        />
      ) : null}
      <header className="dsb-layers-head">
        <Tap
          className="dsb-fold-head is-inline"
          aria-expanded={!folded}
          title={folded ? "Show the layers" : "Fold the layers away"}
          onClick={toggleFold}
        >
          <Icon name={folded ? "ChevronRight" : "ChevronDown"} size={13} className="dsb-fold-chev" />
          <Icon name="Layers" size={13} />
          <span>Layers</span>
        </Tap>
        <div className="dsb-layers-tools">
          <button
            type="button"
            title="Wrap selection in a Row — equal widths, wraps when narrow (Ctrl+G)"
            disabled={!state.selectedIds.length}
            onClick={() => b.wrapInRow(state.selectedIds)}
          >
            <Icon name="Columns3" size={12} />
          </button>
          <button
            type="button"
            title="Wrap selection in a Grid — columns auto-fit (Ctrl+Shift+G)"
            disabled={!state.selectedIds.length}
            onClick={() => b.wrapInGrid(state.selectedIds)}
          >
            <Icon name="LayoutGrid" size={12} />
          </button>
          <button
            type="button"
            title="Wrap selection in a stacked Container"
            disabled={!state.selectedIds.length}
            onClick={() => b.group(state.selectedIds, { containerType: "Container", name: "Group" })}
          >
            <Icon name="Rows3" size={12} />
          </button>
          <button
            type="button"
            title="Ungroup"
            disabled={state.selectedIds.length !== 1}
            onClick={() => b.ungroup(state.selectedIds[0])}
          >
            <Icon name="SquareStack" size={12} />
          </button>
        </div>
      </header>
      {folded ? null : (
      <div className="dsb-layers-body">
        <LayerRow
          node={state.screen.root}
          depth={0}
          collapsed={collapsed}
          toggleCollapse={toggleCollapse}
          onSaveGroup={saveGroup}
          onMenu={setMenu}
        />
      </div>
      )}
      {menu ? <NodeMenu x={menu.x} y={menu.y} nodeId={menu.nodeId} onClose={() => setMenu(null)} /> : null}
    </div>
  );
}
