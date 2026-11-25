/**
 * Data access layer for screens, templates, component groups and versions.
 *
 * Screens, their version history and the template library live on the server
 * (HospediaAPI/ScreenBuilder — tables sb_screen, sb_screen_version,
 * sb_template), reached through networkServices/screenBuilderApi.js. A screen
 * designed on one machine therefore opens on another, and /screen/:id renders
 * for every user rather than only the one who drew it.
 *
 * localStorage is still here, as a mirror rather than the store:
 *
 *   - every successful read is cached, so opening a screen you have already
 *     opened does not wait on the network;
 *   - if the API cannot be reached — offline, or the tables not installed yet —
 *     the repos fall back to that cache and keep working, and `Storage.remote`
 *     goes false so the UI can say the work is local-only.
 *
 * Component groups and UI settings are deliberately still local: a group is a
 * scratch clipboard and settings are per-browser preferences.
 */
import { normalizeScreen, uid } from "../schema/schema";
import {
  installScreenStorage as apiInstall,
  deleteScreen as apiDeleteScreen,
  deleteScreenVersion as apiDeleteScreenVersion,
  deleteTemplate as apiDeleteTemplate,
  getScreen as apiGetScreen,
  getLiveScreen as apiGetLiveScreen,
  getScreenVersion as apiGetScreenVersion,
  listScreens as apiListScreens,
  listScreenVersions as apiListScreenVersions,
  listTemplates as apiListTemplates,
  publishScreen as apiPublishScreen,
  restoreScreenVersion as apiRestoreScreenVersion,
  saveScreen as apiSaveScreen,
  saveTemplate as apiSaveTemplate,
  seedTemplates as apiSeedTemplates,
} from "@app/networkServices/screenBuilderApi";

const K_SCREENS = "dsb.screens.v1";
const K_TEMPLATES = "dsb.templates.v1";
const K_COMPONENTS = "dsb.components.v1";
const K_GROUPS = "dsb.groups.v1";
const K_VERSIONS = "dsb.versions.v1";
const K_SETTINGS = "dsb.settings.v1";

const read = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    // Quota exceeded — surface it to the caller instead of silently losing work.
    console.warn("[ScreenBuilder] storage write failed", e);
    return false;
  }
};

/* ----------------------------------------------------------------- remote */

/**
 * Whether the server storage is answering.
 *
 * Flipped false the first time a call fails and left there: once the API is
 * unreachable, retrying it on every keystroke only makes the builder slow. It
 * is reset by `Storage.retry()`, which the UI can offer as "try again".
 */
export const Storage = {
  remote: true,
  lastError: "",
  retry() {
    Storage.remote = true;
    Storage.lastError = "";
  },
};

let warned = false;
let installing = null;

/**
 * The tables are created on first use.
 *
 * The DDL lives on the server and is CREATE TABLE IF NOT EXISTS throughout, so
 * this is safe to trigger and safe to repeat — but it is only attempted once
 * per session, and only in answer to the server actually reporting a missing
 * table, so a real outage does not turn into a retry loop.
 */
const MISSING_TABLE = /doesn'?t exist|does not exist|no such table|sb_screen|sb_template/i;

function ensureTables() {
  if (!installing) {
    installing = apiInstall()
      .then((res) => {
        if (res && res.success === false) throw new Error(res.message || "Install failed");
        console.info("[ScreenBuilder] screen storage tables created.");
        return true;
      })
      .catch((e) => {
        console.warn("[ScreenBuilder] could not create the storage tables", e);
        return false;
      });
  }
  return installing;
}

/**
 * Run an API call, falling back to the local mirror if the server cannot serve
 * it.
 *
 * Two things count as a failure and both have bitten this code:
 *
 *   - a thrown request (offline, 500, timeout);
 *   - a 200 carrying `success:false`. Every controller here answers 200 and
 *     reports in the envelope, so a write that failed looked like a write that
 *     worked, and the UI said "Screen saved" over a database error. Writes must
 *     therefore check the envelope; reads must NOT, because the same flag means
 *     "no rows" on an empty list.
 *
 * If the failure is a missing table, the tables are created and the call is
 * retried once before giving up.
 */
async function viaApi(call, fallback) {
  if (!Storage.remote) return fallback();
  try {
    return await call();
  } catch (e) {
    const message = e?.message || "The screen storage API did not answer";

    if (MISSING_TABLE.test(message) && (await ensureTables())) {
      try {
        return await call();
      } catch (retryError) {
        return giveUp(retryError?.message || message, fallback);
      }
    }
    return giveUp(message, fallback);
  }
}

function giveUp(message, fallback) {
  Storage.remote = false;
  Storage.lastError = message;
  if (!warned) {
    warned = true;
    console.warn(
      "[ScreenBuilder] falling back to this browser's local copy — " +
        message +
        ". Screens saved now will not be visible to anyone else.",
    );
  }
  return fallback();
}

/** The envelope every controller returns: { success, message, data }. */
const rows = (res) => (Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []);
const one = (res) => (res && res.success === false ? null : res?.data ?? null);

/**
 * A write's result. Unlike a read, `success:false` here is a real failure —
 * the message is the database's — so it is turned into a throw for `viaApi`.
 */
export function wrote(res) {
  if (res && res.success === false) throw new Error(res.message || "The server rejected the write");
  return res;
}

/** Server record -> the document the builder works with. Exported so the
 *  translation between the two shapes can be tested without a server. */
export function toScreen(record) {
  if (!record?.definition) return null;
  try {
    const doc = normalizeScreen(JSON.parse(record.definition));
    // The modules the screen is filed under. The server's list is the truth —
    // the library filters on it — and the document carries a copy so a screen
    // exported to JSON keeps them.
    if (Array.isArray(record.modules)) {
      doc.modules = record.modules
        .filter((m) => m && m.moduleId !== undefined && m.moduleId !== null && m.moduleId !== "")
        .map((m) => ({ id: String(m.moduleId), name: m.moduleName || "" }));
    } else {
      doc.modules = modulesOf(doc);
    }
    delete doc.module;
    return doc;
  } catch (e) {
    console.warn("[ScreenBuilder] a stored screen could not be parsed", record.screenKey, e);
    return null;
  }
}

/**
 * A document's modules as a list. Screens filed while a screen could sit in
 * only one module carry `module` (one, or null); they read as a list of that one.
 * `undefined` when the document has never been filed at all.
 */
export function modulesOf(doc) {
  if (Array.isArray(doc?.modules)) return doc.modules.filter((m) => m && m.id !== undefined && m.id !== "");
  if (doc && "module" in doc) return doc.module?.id ? [{ id: String(doc.module.id), name: doc.module.name || "" }] : [];
  return undefined;
}

/** The document -> what the API stores beside it. */
export const toSavePayload = (screen, extra = {}) => ({
  screenKey: screen.id,
  name: screen.name || "Untitled Screen",
  status: screen.status || "draft",
  version: screen.version || 1,
  definition: JSON.stringify(screen),
  /*
   * The modules, only once the document has an opinion on them: none at all (a
   * screen opened before it was filed) sends nothing, and the server keeps what
   * it has — an auto-save of an open screen must not unfile it. An empty list
   * is an explicit "no module" and clears them.
   */
  ...(modulesOf(screen) === undefined
    ? {}
    : { modules: modulesOf(screen).map((m) => ({ moduleId: String(m.id), moduleName: m.name || "" })) }),
  ...extra,
});

/**
 * A version kept in this browser — what the history shows while the server
 * cannot be reached. Same shape the list call maps the server's rows to.
 */
function localSnapshot(screen, note = "") {
  const versions = read(K_VERSIONS, {});
  const list = versions[screen.id] || [];
  list.unshift({
    versionId: uid("v"),
    at: new Date().toISOString(),
    note,
    version: screen.version || 1,
    doc: JSON.parse(JSON.stringify(screen)),
  });
  versions[screen.id] = list.slice(0, 50); // keep the last 50 snapshots
  write(K_VERSIONS, versions);
  return true;
}

/** Keep the local mirror in step after every successful remote write. */
function cacheScreen(doc) {
  const all = read(K_SCREENS, {});
  all[doc.id] = doc;
  write(K_SCREENS, all);
  return doc;
}

/**
 * Live screens already opened in this tab: id -> { doc, stamp }. Re-opening one
 * sends only its stamp, and the server answers "notModified" unless it was
 * published again — so switching between screens does not re-download them.
 */
const liveCache = new Map();

/**
 * What the builder last heard about each screen's live version:
 * id -> { publishedVersion, hasUnpublishedChanges }. Kept beside the document,
 * not in it, so it is never saved into the screen's JSON.
 */
const publishInfo = new Map();

/** Keep publishInfo in step with a record the server returned. */
function rememberPublishState(id, record) {
  if (!id || !record || typeof record !== "object") return;
  publishInfo.set(id, {
    publishedVersion: record.publishedVersion ?? null,
    hasUnpublishedChanges: !!record.hasUnpublishedChanges,
  });
}

export const ScreenRepo = {
  /**
   * Full documents, not summaries: the library grid draws a thumbnail of every
   * screen from its own tree, so a list of names would render empty cards.
   */
  async list() {
    return viaApi(
      async () =>
        rows(await apiListScreens({ includeDefinition: true }))
          .map((r) => {
            const doc = toScreen(r);
            return doc
              ? { ...doc, createdAt: r.createdOn, createdBy: r.createdBy, updatedAt: r.updatedOn, updatedBy: r.updatedBy }
              : null;
          })
          .filter(Boolean),
      () =>
        Object.values(read(K_SCREENS, {})).sort((a, b) =>
          String(b.updatedAt).localeCompare(String(a.updatedAt)),
        ),
    );
  },

  /**
   * File a screen under these modules (roles: [{ id, name }]) — none, one or
   * several; the list replaces what it was filed under. A plain save of the
   * whole document: the modules travel with it and the server's list follows.
   */
  async setModules(doc, modules) {
    const list = (Array.isArray(modules) ? modules : [])
      .filter((m) => m && m.id !== undefined && m.id !== "")
      .map((m) => ({ id: String(m.id), name: m.name || "" }));
    const next = { ...doc, modules: list };
    delete next.module;
    delete next.updatedAt;
    delete next.updatedBy;
    await this.save(next);
    return next;
  },

  /**
   * The saved document (the draft) — what the builder edits. Live users open
   * screens through getLive(), which serves the published version.
   */
  async get(id) {
    return viaApi(
      async () => {
        const record = one(await apiGetScreen(id));
        const doc = toScreen(record);
        rememberPublishState(id, record);
        // Cached on the way through, so re-opening it is instant and it is
        // still there if the network drops later.
        return doc ? cacheScreen(doc) : null;
      },
      () => {
        const all = read(K_SCREENS, {});
        return all[id] ? normalizeScreen(all[id]) : null;
      },
    );
  },

  /**
   * The published version — what /screen/:id shows to users. Served from the
   * API cache; a screen already opened in this tab costs one tiny "still the
   * same?" call. A copy is returned each time so the renderer can never change
   * the cached one.
   */
  async getLive(id) {
    const held = liveCache.get(id);
    return viaApi(
      async () => {
        const res = await apiGetLiveScreen(id, held?.stamp);
        // An API from before GetLiveScreen existed answers 404: open the saved
        // document instead, as this route always did.
        if (typeof res?.success !== "boolean") return ScreenRepo.get(id);

        if (res.success && res.data?.notModified && held) return structuredClone(held.doc);

        const record = one(res);
        const doc = toScreen(record);
        if (doc) liveCache.set(id, { doc: structuredClone(doc), stamp: record.stamp || "" });
        else liveCache.delete(id);
        return doc;
      },
      () => {
        const all = read(K_SCREENS, {});
        return all[id] ? normalizeScreen(all[id]) : null;
      },
    );
  },

  /**
   * For the builder: { publishedVersion, hasUnpublishedChanges } as of the last
   * open, save or publish of this screen. Null when not known (offline mode).
   */
  publishState(id) {
    return publishInfo.get(id) || null;
  },

  /**
   * @param opts.snapshot  also keep this state in the screen's version history
   *                       (a manual Save does; auto-save does not, or the
   *                       history would fill with every pause in typing)
   * @param opts.note      what the history row says — "Saved", "Restored from v3"
   */
  async save(screen, { snapshot = false, note = "" } = {}) {
    const doc = { ...screen, updatedAt: new Date().toISOString() };
    return viaApi(
      async () => {
        const res = wrote(await apiSaveScreen(toSavePayload(doc, snapshot ? { snapshot: true, note } : {})));
        rememberPublishState(doc.id, res?.data);
        return cacheScreen(doc);
      },
      () => {
        if (snapshot) localSnapshot(doc, note);
        return cacheScreen(doc);
      },
    );
  },

  /** One old version's whole document, ready to load onto the canvas. */
  async getVersion(screenId, versionKey) {
    const local = () => {
      const hit = (read(K_VERSIONS, {})[screenId] || []).find((v) => v.versionId === versionKey);
      return hit ? normalizeScreen(hit.doc) : null;
    };
    return viaApi(async () => toScreen(one(await apiGetScreenVersion(versionKey))), local);
  },

  /** Drop one old version from the history. The screen itself is untouched. */
  async deleteVersion(screenId, versionKey) {
    const local = () => {
      const versions = read(K_VERSIONS, {});
      versions[screenId] = (versions[screenId] || []).filter((v) => v.versionId !== versionKey);
      write(K_VERSIONS, versions);
      return true;
    };
    return viaApi(async () => {
      wrote(await apiDeleteScreenVersion(screenId, versionKey));
      return true;
    }, local);
  },

  async remove(id) {
    const drop = () => {
      const all = read(K_SCREENS, {});
      delete all[id];
      write(K_SCREENS, all);
      const versions = read(K_VERSIONS, {});
      delete versions[id];
      write(K_VERSIONS, versions);
      return true;
    };
    return viaApi(async () => {
      wrote(await apiDeleteScreen(id));
      return drop();
    }, drop);
  },

  async duplicate(id, name) {
    const src = await ScreenRepo.get(id);
    if (!src) return null;
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = uid("scr");
    copy.name = name || `${src.name} (copy)`;
    copy.status = "draft";
    copy.version = 1;
    copy.createdAt = new Date().toISOString();
    return ScreenRepo.save(copy);
  },

  /**
   * Publishing bumps the version, marks it published and snapshots it. The
   * server does all three in one call so a half-published screen cannot exist;
   * the local fallback does the same two writes it always did.
   */
  async publish(screen) {
    const doc = { ...screen, status: "published", version: (screen.version || 1) + 1 };
    return viaApi(
      async () => {
        const res = wrote(await apiPublishScreen(toSavePayload(doc, { note: "Published" })));
        rememberPublishState(doc.id, res?.data);
        liveCache.delete(doc.id);
        return cacheScreen({ ...doc, updatedAt: new Date().toISOString() });
      },
      async () => {
        await ScreenRepo.saveVersion(doc, "Published");
        return ScreenRepo.save(doc);
      },
    );
  },

  /** An explicit snapshot outside a publish. */
  async saveVersion(screen, note = "") {
    const local = () => localSnapshot(screen, note);
    return viaApi(async () => {
      wrote(await apiSaveScreen(toSavePayload(screen, { snapshot: true, note })));
      return true;
    }, local);
  },

  async versions(screenId, take = 100) {
    return viaApi(
      async () =>
        rows(await apiListScreenVersions(screenId, take)).map((v) => ({
          versionId: v.versionKey,
          at: v.createdOn,
          note: v.note,
          version: v.versionNo,
          by: v.createdBy,
        })),
      () => read(K_VERSIONS, {})[screenId] || [],
    );
  },

  /**
   * Restore a snapshot over the current draft. The server snapshots what it is
   * about to replace first, so restoring the wrong one is itself undoable.
   */
  async restoreVersion(screenId, versionId) {
    return viaApi(
      async () => {
        wrote(await apiRestoreScreenVersion(screenId, versionId));
        const restored = toScreen(one(await apiGetScreenVersion(versionId)));
        return restored ? cacheScreen({ ...restored, status: "draft" }) : null;
      },
      async () => {
        const list = read(K_VERSIONS, {})[screenId] || [];
        const hit = list.find((v) => v.versionId === versionId);
        if (!hit) return null;
        return ScreenRepo.save({ ...normalizeScreen(hit.doc), status: "draft" });
      },
    );
  },
};

/**
 * A template *is* a screen document — the library opens one directly and
 * duplicating one produces a screen. So the document comes back whole, with the
 * row's own columns laid over it rather than wrapped around it.
 */
export const toTemplate = (r) => {
  let doc = {};
  try {
    doc = r.definition ? JSON.parse(r.definition) : {};
  } catch (e) {
    console.warn("[ScreenBuilder] a stored template could not be parsed", r.templateKey, e);
    doc = {};
  }
  return {
    ...doc,
    id: r.templateKey,
    name: r.name || doc.name,
    status: doc.status || "template",
    category: r.category || doc.category || "",
    description: r.description || doc.description || "",
    thumbnail: r.thumbnail || "",
    builtIn: !!r.isBuiltIn,
    updatedAt: r.updatedOn,
  };
};

export const toTemplatePayload = (t) => ({
  templateKey: t.id,
  name: t.name || "Untitled template",
  category: t.category || "",
  description: t.description || "",
  thumbnail: t.thumbnail || "",
  definition: JSON.stringify(t),
  isBuiltIn: !!t.builtIn,
});

function cacheTemplate(t) {
  const all = read(K_TEMPLATES, {});
  all[t.id] = t;
  write(K_TEMPLATES, all);
  return t;
}

/**
 * Common components share the `sb_template` table rather than getting one of
 * their own: both are "a saved piece of design with a JSON body", and reusing
 * the table means a component someone saves in Delhi is in the palette in
 * Mumbai without a server change. The key prefix is what tells them apart, and
 * both repos filter on it so neither list shows the other's rows.
 */
const COMPONENT_KEY = "cmp_";
export const isComponentKey = (key) => String(key || "").startsWith(COMPONENT_KEY);

export const TemplateRepo = {
  async list() {
    return viaApi(
      async () => rows(await apiListTemplates()).filter((r) => !isComponentKey(r.templateKey)).map(toTemplate),
      () =>
        Object.values(read(K_TEMPLATES, {})).sort((a, b) =>
          String(a.name).localeCompare(String(b.name)),
        ),
    );
  },

  async save(template) {
    const doc = { ...template, updatedAt: new Date().toISOString() };
    return viaApi(
      async () => {
        wrote(await apiSaveTemplate(toTemplatePayload(doc)));
        return cacheTemplate(doc);
      },
      () => cacheTemplate(doc),
    );
  },

  async remove(id) {
    const drop = () => {
      const all = read(K_TEMPLATES, {});
      delete all[id];
      write(K_TEMPLATES, all);
      return true;
    };
    return viaApi(async () => {
      wrote(await apiDeleteTemplate(id));
      return drop();
    }, drop);
  },

  /**
   * Seed the templates the app ships with. Existing keys are left alone on both
   * paths, so a built-in someone has since edited stays edited.
   */
  async seed(templates) {
    return viaApi(
      async () => {
        wrote(await apiSeedTemplates((templates || []).map(toTemplatePayload)));
        return TemplateRepo.list();
      },
      () => {
        const all = read(K_TEMPLATES, {});
        let changed = false;
        (templates || []).forEach((t) => {
          if (!all[t.id]) {
            all[t.id] = t;
            changed = true;
          }
        });
        if (changed) write(K_TEMPLATES, all);
        return Object.values(all);
      },
    );
  },
};

/* ------------------------------------------------------- common components */

/**
 * A saved common component (utils/commonComponents) — the subtree WITH the API
 * config, the data sources it reads, its rules, validation and events.
 *
 * Unlike a group, this is shared: it is written to the server so the palette's
 * "Common Components" section is the same for everyone, with the usual local
 * mirror underneath when the API cannot be reached.
 */
const toComponent = (r) => {
  let pack = {};
  try {
    pack = r.definition ? JSON.parse(r.definition) : {};
  } catch (e) {
    console.warn("[ScreenBuilder] a stored common component could not be parsed", r.templateKey, e);
    pack = {};
  }
  return {
    ...pack,
    id: r.templateKey,
    name: r.name || pack.name || "Component",
    category: r.category || pack.category || "General",
    description: r.description || pack.description || "",
    icon: pack.icon || r.thumbnail || "SquareStack",
    updatedAt: r.updatedOn,
    updatedBy: r.updatedBy,
  };
};

const toComponentPayload = (c) => ({
  templateKey: c.id,
  name: c.name || "Component",
  category: c.category || "General",
  description: c.description || "",
  // The table has no icon column, and a thumbnail is a string — so the icon
  // name rides in it. `toComponent` reads the pack's own value first anyway.
  thumbnail: c.icon || "SquareStack",
  definition: JSON.stringify(c),
  isBuiltIn: false,
});

function cacheComponent(c) {
  const all = read(K_COMPONENTS, {});
  all[c.id] = c;
  write(K_COMPONENTS, all);
  return c;
}

export const ComponentRepo = {
  async list() {
    return viaApi(
      async () => {
        const list = rows(await apiListTemplates())
          .filter((r) => isComponentKey(r.templateKey))
          .map(toComponent);
        // Mirrored whole, so the palette still fills if the next call is offline.
        write(K_COMPONENTS, list.reduce((acc, c) => ({ ...acc, [c.id]: c }), {}));
        return list;
      },
      () =>
        Object.values(read(K_COMPONENTS, {})).sort((a, b) => String(a.name).localeCompare(String(b.name))),
    );
  },

  /** `pack` is what packComponent() produced; the id gets the shared prefix. */
  async save(pack) {
    const doc = {
      ...pack,
      id: isComponentKey(pack.id) ? pack.id : `${COMPONENT_KEY}${String(pack.id || uid("c")).replace(/^cmp_/, "")}`,
      updatedAt: new Date().toISOString(),
    };
    return viaApi(
      async () => {
        wrote(await apiSaveTemplate(toComponentPayload(doc)));
        return cacheComponent(doc);
      },
      () => cacheComponent(doc),
    );
  },

  async remove(id) {
    const drop = () => {
      const all = read(K_COMPONENTS, {});
      delete all[id];
      write(K_COMPONENTS, all);
      return true;
    };
    return viaApi(async () => {
      wrote(await apiDeleteTemplate(id));
      return drop();
    }, drop);
  },
};

/** Reusable configured blocks (e.g. a whole search panel). */
export const GroupRepo = {
  async list() {
    return Object.values(read(K_GROUPS, {}));
  },
  async save(group) {
    const all = read(K_GROUPS, {});
    all[group.id] = group;
    write(K_GROUPS, all);
    return group;
  },
  async remove(id) {
    const all = read(K_GROUPS, {});
    delete all[id];
    write(K_GROUPS, all);
    return true;
  },
};

export const Settings = {
  get() {
    return read(K_SETTINGS, { lastScreenId: "", panels: {} });
  },
  set(patch) {
    write(K_SETTINGS, { ...Settings.get(), ...patch });
  },
};

/** Browser download of the screen JSON. */
export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadText(filename, text, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
