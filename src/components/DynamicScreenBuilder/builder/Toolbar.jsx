/** Top toolbar: document actions, history, breakpoints, zoom, preview. */
import React, { useRef } from "react";
import Icon from "../registry/icons";
import { BREAKPOINTS } from "../schema/schema";
import { useBuilder } from "../store/builderStore";
import VersionHistory from "./VersionHistory";
import { ScreenRepo } from "../utils/storage";

const BP_ICONS = { desktop: "Monitor", tablet: "Tablet", mobile: "Smartphone" };
const STATUS_ICONS = { draft: "FilePen", published: "BadgeCheck", archived: "Archive" };

/**
 * An icon-only toolbar button. The title is the tooltip and the accessible
 * name both — a screen reader has nothing else to go on.
 */
function ToolBtn({ icon, label, className = "", ...rest }) {
  return (
    <button type="button" className={className} title={label} aria-label={label} {...rest}>
      <Icon name={icon} size={15} />
    </button>
  );
}

/** "5:42 pm", the way a status line says a time. */
const clock = (ms) =>
  new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }).toLowerCase();

export default function Toolbar({
  onSave,
  onPublish,
  onOpenLibrary,
  onExport,
  onImport,
  onExportCode,
  onNew,
  onOpenMigrate,
  saving,
  autoSave,
  autoSavedAt,
  autoError,
  onToggleAutoSave,
  historyOpen,
  onToggleHistory,
  viewingVersion,
  historyKey,
  onOpenVersion,
  onBackToLatest,
}) {
  const b = useBuilder();
  const { state } = b;
  const histRef = useRef(null);
  const canUndo = state.history.past.length > 0;
  const canRedo = state.history.future.length > 0;

  return (
    <header className="dsb-toolbar">
      <div className="dsb-tb-left">
        <span className="dsb-brand">
          <Icon name="Wand2" size={15} />
          <b>Screen Builder</b>
        </span>

        <span className="dsb-doc">
          <Icon name="Pencil" size={12} className="dsb-doc-edit" />
          <input
            className="dsb-doc-name"
            value={state.screen.name}
            onChange={(e) => b.setMeta({ name: e.target.value })}
            title="Screen name"
          />
          <span className="dsb-doc-flags">
            <span className={`dsb-status s-${state.screen.status}`}>
              <Icon name={STATUS_ICONS[state.screen.status] || "FileText"} size={10} />
              {state.screen.status}
            </span>
            {state.dirty ? <em className="dsb-dirty">unsaved</em> : null}
            {/* Save keeps a draft; users at /screen/:id see the published
                version until Publish. Say so, or a saved change looks lost. */}
            {ScreenRepo.publishState(state.screen.id)?.hasUnpublishedChanges ? (
              <em
                className="dsb-auto is-bad"
                title="Users still see the last published version. Click Publish to make these changes live."
              >
                <Icon name="TriangleAlert" size={10} /> not live yet — Publish
              </em>
            ) : null}
            {/* Auto-save says nothing out loud, so it says it here: the last
                time it wrote, or why it could not. */}
            {autoError ? (
              <em className="dsb-auto is-bad" title="Auto-save could not write — use Save">
                <Icon name="TriangleAlert" size={10} /> {autoError}
              </em>
            ) : autoSave && autoSavedAt ? (
              <em className="dsb-auto" title="Saved automatically">
                <Icon name="CircleCheck" size={10} /> saved {clock(autoSavedAt)}
              </em>
            ) : null}
          </span>
        </span>
      </div>

      <div className="dsb-tb-mid">
        <div className="dsb-tb-group">
          <ToolBtn icon="Undo2" label="Undo (Ctrl+Z)" disabled={!canUndo} onClick={b.undo} />
          <ToolBtn icon="Redo2" label="Redo (Ctrl+Y)" disabled={!canRedo} onClick={b.redo} />
        </div>

        <div className="dsb-tb-group">
          {BREAKPOINTS.map((bp) => (
            <button
              key={bp.key}
              type="button"
              className={state.breakpoint === bp.key ? "is-on" : ""}
              title={`${bp.label} (${bp.width}px)`}
              aria-label={`${bp.label} preview`}
              aria-pressed={state.breakpoint === bp.key}
              onClick={() => b.setBreakpoint(bp.key)}
            >
              <Icon name={BP_ICONS[bp.key]} size={15} />
            </button>
          ))}
        </div>

        <div className="dsb-tb-group">
          <ToolBtn icon="ZoomOut" label="Zoom out" onClick={() => b.setZoom(state.zoom - 0.1)} />
          <button type="button" className="dsb-zoom-val" title="Reset zoom" onClick={() => b.setZoom(1)}>
            {Math.round(state.zoom * 100)}%
          </button>
          <ToolBtn icon="ZoomIn" label="Zoom in" onClick={() => b.setZoom(state.zoom + 0.1)} />
        </div>

        <button
          type="button"
          className={`dsb-preview-btn ${state.mode === "preview" ? "is-on" : ""}`}
          onClick={() => b.setMode(state.mode === "preview" ? "design" : "preview")}
          title="Toggle live preview"
        >
          <Icon name={state.mode === "preview" ? "Pencil" : "Eye"} size={14} />
          <span>{state.mode === "preview" ? "Editing" : "Preview"}</span>
        </button>
      </div>

      <div className="dsb-tb-right">
        {/* Every saved version of the screen: load one onto the canvas, or
            delete it. Amber while an old version is on the canvas unsaved. */}
        <button
          ref={histRef}
          type="button"
          className={`dsb-tb-hist ${historyOpen ? "is-on" : ""} ${viewingVersion ? "is-viewing" : ""}`.trim()}
          title={viewingVersion ? `Viewing v${viewingVersion.version} — version history` : "Version history"}
          aria-label="Version history"
          aria-expanded={!!historyOpen}
          onClick={onToggleHistory}
        >
          <Icon name="History" size={15} />
          {viewingVersion ? <span className="dsb-tb-hist-dot" /> : null}
        </button>
        <VersionHistory
          open={!!historyOpen}
          anchor={histRef}
          screen={state.screen}
          dirty={state.dirty}
          viewing={viewingVersion}
          refreshKey={historyKey}
          onOpenVersion={onOpenVersion}
          onBackToLatest={onBackToLatest}
          onClose={onToggleHistory}
        />
        {/* Saving on a timer rather than on a click. Off by default, and
            remembered: it is a habit, not a property of the screen. */}
        <button
          type="button"
          className={`dsb-tb-auto ${autoSave ? "is-on" : ""}`}
          title={
            autoSave
              ? "Auto-save is on — every change is written a moment after you make it"
              : "Auto-save — write every change a moment after you make it"
          }
          aria-label="Auto-save"
          aria-pressed={!!autoSave}
          onClick={onToggleAutoSave}
        >
          <Icon name={autoSave ? "TimerReset" : "Timer"} size={15} />
        </button>
        <ToolBtn icon="FolderOpen" label="Template library" onClick={onOpenLibrary} />
        <ToolBtn icon="Plus" label="New screen" onClick={onNew} />
        <ToolBtn icon="Upload" label="Import JSON" onClick={onImport} />
        <ToolBtn icon="Download" label="Export JSON" onClick={onExport} />
        <ToolBtn icon="Code2" label="Export JSX code" onClick={onExportCode} />
        {/* Sits beside Save because that is where the document actions are, and
            because converting an old page ends the same way: a screen on the
            canvas that still has to be saved on purpose.

            Dev only. The converter reads src/pages off disk through a Node
            service on the developer's own machine (tools/screen-migrator), and
            a deployed build has neither — no service to reach, and no JSX left
            to parse. Shipping the button anyway gives every user on the server
            a control that can only ever answer "the migration service is not
            running", so it is not shipped. Migration is a build-time activity:
            convert here, then Save/Publish, and the SCREEN travels to the
            server, not the converter. */}
        {/* {import.meta.env.DEV ? (
          <ToolBtn icon="Sparkles" label="Convert an existing coded screen" className="dsb-tb-migrate" onClick={onOpenMigrate} />
        ) : null} */}
        <button type="button" className="dsb-btn-primary" onClick={onSave} disabled={saving}>
          <Icon name="Save" size={14} />
          <span>{saving ? "Saving…" : "Save"}</span>
        </button>
        <button type="button" className="dsb-btn-ghost" onClick={onPublish} title="Publish this version">
          <Icon name="Send" size={14} />
          <span>Publish</span>
        </button>
      </div>
    </header>
  );
}
