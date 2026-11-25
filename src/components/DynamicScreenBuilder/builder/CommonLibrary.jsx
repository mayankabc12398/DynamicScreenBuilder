/**
 * The common-component library: the palette's fifth section, the dialog that
 * fills it, and the one place that knows how to put a saved component back onto
 * a screen.
 *
 * Everything here works on a PACK (utils/commonComponents) rather than a node,
 * because what makes a component reusable is the wiring around it — the API it
 * calls, the data sources it reads, its rules, validation and events. Saving
 * and placing both go through this provider so the two halves cannot drift:
 * whatever the dialog says travels with a component is exactly what
 * `instantiateComponent` puts back.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import Icon from "../registry/icons";
import { useBuilder } from "../store/builderStore";
import { ComponentRepo, Storage } from "../utils/storage";
import { COMMON_CATEGORIES, instantiateComponent, packComponent, suggestName } from "../utils/commonComponents";
import { findNode } from "../utils/tree";
import { IconField } from "./editors";

const CommonCtx = createContext(null);
export const useCommon = () => useContext(CommonCtx);

/* -------------------------------------------------------------- save dialog */

function Stat({ icon, n, label }) {
  return (
    <div className="dsb-cc-stat">
      <Icon name={icon} size={13} />
      <strong>{n}</strong>
      <span>{label}</span>
    </div>
  );
}

function SaveCommonDialog({ node, existing, onClose, onSaved }) {
  const b = useBuilder();
  const { state } = b;

  // The component's own label, not the registry default in `node.name`: a
  // select captioned "Ward" is saved as "Ward", not as "Select".
  const [name, setName] = useState(existing?.name || suggestName(node));
  const [icon, setIcon] = useState(existing?.icon || "SquareStack");
  const [category, setCategory] = useState(existing?.category || "General");
  const [description, setDescription] = useState(existing?.description || "");
  const [busy, setBusy] = useState(false);

  // Built once from the live screen: the dialog is a preview of the pack, so
  // what is listed here is literally what gets written.
  const { report } = useMemo(
    () => packComponent({ node, screen: state.screen, meta: {} }),
    [node, state.screen],
  );

  const save = async () => {
    if (!name.trim()) {
      toast.error("Give the component a name");
      return;
    }
    setBusy(true);
    try {
      const { pack } = packComponent({
        node,
        screen: state.screen,
        meta: { id: existing?.id, name: name.trim(), icon, category: category.trim() || "General", description: description.trim() },
      });
      const saved = await ComponentRepo.save(pack);
      if (Storage.remote) toast.success(`“${saved.name}” saved to Common Components`);
      else toast.warning(`Saved in this browser only — ${Storage.lastError}`);
      onSaved?.(saved);
      onClose();
    } catch (e) {
      toast.error(e?.message || "Could not save the component");
    } finally {
      setBusy(false);
    }
  };

  if (!node) return null;

  return (
    // Fixed rather than the library's absolute overlay, and `dsb-portal` for
    // the --b-* palette: the provider sits outside the builder's positioned,
    // token-carrying root, so this backdrop covers the viewport and brings the
    // variables with it.
    <div className="dsb-portal dsb-cc-overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dsb-cc-dlg" role="dialog" aria-label="Save as common component">
        <header className="dsb-cc-head">
          <span className="dsb-cc-head-ic">
            <Icon name={icon || "SquareStack"} size={15} />
          </span>
          <div>
            <strong>{existing ? "Update common component" : "Save as common component"}</strong>
            <span>
              {/* Which node this is about, spelled out: a right-click lands on
                  the innermost component, and "SelectInput" when someone meant
                  the panel around it is the moment to notice. */}
              {node.name} · {node.type} · saved with its API, data, rules, validation and events
            </span>
          </div>
          <button type="button" className="dsb-icon-btn" onClick={onClose} title="Close">
            <Icon name="X" size={14} />
          </button>
        </header>

        <div className="dsb-cc-body">
          <div className="dsb-cc-form">
            <label className="dsb-cc-field">
              <span>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Patient search panel" autoFocus />
            </label>

            <label className="dsb-cc-field">
              <span>Category</span>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list="dsb-cc-cats"
                placeholder="General"
              />
              <datalist id="dsb-cc-cats">
                {COMMON_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>

            <div className="dsb-cc-field">
              <span>Icon</span>
              <IconField value={icon} onChange={setIcon} />
            </div>

            <label className="dsb-cc-field is-wide">
              <span>Description</span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What it is for, and what it expects on the screen around it"
              />
            </label>
          </div>

          <section className="dsb-cc-sec">
            <h5>
              <Icon name="Layers" size={12} /> What travels with it
            </h5>
            <div className="dsb-cc-stats">
              <Stat icon="Square" n={report.nodeCount} label={report.nodeCount === 1 ? "component" : "components"} />
              <Stat icon="Database" n={report.apis.length} label="API calls" />
              <Stat icon="Filter" n={report.ruleCount} label="rules" />
              <Stat icon="MousePointerClick" n={report.eventCount} label="actions" />
              <Stat icon="CheckCircle2" n={report.validationCount} label="validated" />
            </div>
          </section>

          {report.apis.length ? (
            <section className="dsb-cc-sec">
              <h5>
                <Icon name="Database" size={12} /> Endpoints
              </h5>
              <ul className="dsb-cc-list">
                {report.apis.map((a, i) => (
                  <li key={`${a.endpoint}-${i}`}>
                    <em className={`dsb-cc-verb is-${String(a.method).toLowerCase()}`}>{a.method}</em>
                    <code>{a.endpoint}</code>
                    <span>{a.owner}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="dsb-cc-note">
              <Icon name="Info" size={12} /> No API is wired up yet. Pick one on the component (Properties → Data) before
              saving it, and every copy comes with it.
            </p>
          )}

          {report.sources.length ? (
            <section className="dsb-cc-sec">
              <h5>
                <Icon name="Share2" size={12} /> Screen data sources copied along
              </h5>
              <ul className="dsb-cc-list">
                {report.sources.map((s) => (
                  <li key={s.id}>
                    <em className="dsb-cc-verb">{s.mode}</em>
                    <code>{s.name || s.id}</code>
                    <span>{s.url || "static"}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {report.variables.length || report.appModals.length ? (
            <section className="dsb-cc-sec">
              <h5>
                <Icon name="Tag" size={12} /> Also carried
              </h5>
              <div className="dsb-cc-chips">
                {report.variables.map((v) => (
                  <span key={v} className="dsb-cc-chip">
                    {`{{vars.${v}}}`}
                  </span>
                ))}
                {report.appModals.map((m) => (
                  <span key={m} className="dsb-cc-chip">
                    modal: {m}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {report.externalNodes.length || report.missingSources.length ? (
            <section className="dsb-cc-sec is-warn">
              <h5>
                <Icon name="AlertTriangle" size={12} /> These will not travel
              </h5>
              <ul className="dsb-cc-list">
                {report.externalNodes.map((id) => {
                  const hit = findNode(state.screen.root, id);
                  return (
                    <li key={id}>
                      <code>{hit ? hit.name : id}</code>
                      <span>an action points at a component outside this selection</span>
                    </li>
                  );
                })}
                {report.missingSources.map((id) => (
                  <li key={id}>
                    <code>{id}</code>
                    <span>data source is referenced but no longer exists on this screen</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <footer className="dsb-cc-foot">
          <span>
            {Storage.remote ? "Shared with everyone who opens the builder." : "The server is unreachable — this stays in your browser."}
          </span>
          <button type="button" className="dsbi-mini" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="dsbi-mini is-primary" onClick={save} disabled={busy}>
            <Icon name={busy ? "Loader" : "Save"} size={12} /> {existing ? "Update" : "Save component"}
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ delete confirm */

/**
 * Deleting a common component is the one destructive thing this panel does, and
 * it is destructive for EVERYONE — so it asks in the builder's own chrome
 * rather than through `window.confirm`, which is unstyled, blocks the tab, and
 * looks enough like a browser warning that people dismiss it without reading.
 */
function ConfirmDelete({ item, busy, onCancel, onConfirm }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const key = (e) => {
      if (e.key === "Escape") onCancel();
      // Enter confirms only because the focus starts on Cancel: the dangerous
      // button is never the one a stray keypress lands on.
      if (e.key === "Enter" && document.activeElement === cancelRef.current) onCancel();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onCancel]);

  return (
    <div className="dsb-portal dsb-cc-overlay" onPointerDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="dsb-cc-confirm" role="alertdialog" aria-label="Delete common component">
        <div className="dsb-cc-confirm-body">
          <span className="dsb-cc-confirm-ic">
            <Icon name="AlertTriangle" size={17} />
          </span>
          <div>
            <strong>Delete “{item.name}”?</strong>
            <p>
              It disappears from the Common Components palette for everyone. Screens that already use it keep their own
              copy — nothing on a built screen breaks.
            </p>
            {item.apis?.length ? (
              <p className="dsb-cc-confirm-meta">
                <Icon name="Database" size={11} /> {item.apis.length} endpoint{item.apis.length === 1 ? "" : "s"} saved
                with it
              </p>
            ) : null}
          </div>
        </div>
        <footer className="dsb-cc-foot">
          <span />
          <button type="button" className="dsbi-mini" ref={cancelRef} onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="dsbi-mini is-danger-solid" onClick={onConfirm} disabled={busy}>
            <Icon name={busy ? "Loader" : "Trash2"} size={12} /> Delete
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- provider */

export function CommonProvider({ children }) {
  const b = useBuilder();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null); // { node, existing }
  const [pendingDelete, setPendingDelete] = useState(null); // the component being deleted
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await ComponentRepo.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /** Open the save dialog for a node id (the right-click entry point). */
  const saveFrom = useCallback(
    (nodeId, existing) => {
      const node = findNode(b.getState().screen.root, nodeId);
      if (!node) return;
      setDialog({ node, existing: existing || null });
    },
    [b],
  );

  /**
   * Put a saved component on the screen.
   *
   * The node, the data sources it needs, the variables it reads and the modals
   * it opens go in as ONE commit, so undo takes the whole thing back out and
   * never leaves a component pointing at a source that is no longer there.
   */
  const place = useCallback(
    (pack, parentId, index = -1) => {
      const screen = b.getState().screen;
      const built = instantiateComponent(pack, screen);
      if (!built) return null;
      b.insertComponent({
        node: built.node,
        parentId: parentId || screen.root.id,
        index,
        dataSources: built.dataSources,
        variables: built.variables,
        appModals: built.appModals,
      });
      built.notes.forEach((n) => toast.info(n));
      return built.node;
    },
    [b],
  );

  const remove = useCallback(
    async (id) => {
      await ComponentRepo.remove(id);
      await reload();
    },
    [reload],
  );

  /** Ask first. The panel calls this; `remove` stays available for callers
   *  that have already asked. */
  const requestRemove = useCallback((item) => setPendingDelete(item), []);

  const confirmRemove = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await remove(pendingDelete.id);
      if (Storage.remote) toast.success(`“${pendingDelete.name}” deleted`);
      else toast.warning(`Deleted in this browser only — ${Storage.lastError}`);
      setPendingDelete(null);
    } catch (e) {
      toast.error(e?.message || "Could not delete the component");
    } finally {
      setDeleting(false);
    }
  }, [pendingDelete, remove]);

  const value = useMemo(
    () => ({ items, loading, reload, saveFrom, place, remove, requestRemove }),
    [items, loading, reload, saveFrom, place, remove, requestRemove],
  );

  return (
    <CommonCtx.Provider value={value}>
      {children}
      {dialog ? (
        <SaveCommonDialog
          node={dialog.node}
          existing={dialog.existing}
          onClose={() => setDialog(null)}
          onSaved={reload}
        />
      ) : null}
      {pendingDelete ? (
        <ConfirmDelete
          item={pendingDelete}
          busy={deleting}
          onCancel={() => !deleting && setPendingDelete(null)}
          onConfirm={confirmRemove}
        />
      ) : null}
    </CommonCtx.Provider>
  );
}

export default CommonProvider;
