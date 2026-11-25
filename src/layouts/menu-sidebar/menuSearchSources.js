import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import makeApiRequest from "@app/networkServices/axiosInstance";
import { apiUrls } from "@app/networkServices/apiEndpoints";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";

// Extra Menu Search entries for pages whose inner choices are not part of
// BindMenu. A source is searched only when its page is in the role's menu.
// Picking one of its items navigates to that page with
// `location.state[stateKey] = item.target`; the page reads it and preselects.

// Background lookup: no global loader, no error toast.
const QUIET = { method: "get", meta: { silent: true }, silentError: true };

const asList = (resp) => (Array.isArray(resp?.data) ? resp.data : []);

// Master Configuration: every Configuration Type and every step under it.
const fetchEdpConfigItems = async () => {
  const setups = asList(
    await makeApiRequest(`${apiUrls.GetEDPMasterSetupListURL}?pageURLID=0`, QUIET),
  );
  const stepResps = await Promise.all(
    setups.map((setup) =>
      makeApiRequest(
        `${apiUrls.GetEDPMasterSetupStepListURL}?masterSetupID=${setup?.MasterSetupID}`,
        QUIET,
      ),
    ),
  );

  const items = [];
  setups.forEach((setup, index) => {
    items.push({
      label: setup?.MasterType,
      category: "Configuration Type",
      target: { masterSetupID: setup?.MasterSetupID },
    });
    asList(stepResps[index]).forEach((step) => {
      items.push({
        label: step?.StepName,
        category: setup?.MasterType,
        target: { masterSetupID: setup?.MasterSetupID, stepID: step?.ID },
      });
    });
  });
  return items;
};

// Hospital Reports: every report this user/role may run.
const fetchReportItems = async () =>
  asList(await makeApiRequest(apiUrls.BindSubReportData, QUIET)).map((report) => ({
    label: report?.SubReportName,
    category: "Reports",
    target: { subReportID: report?.SubReportID },
  }));

// `title` heads the source's results in the Modern / NextGen sidebar search.
export const MENU_SEARCH_SOURCES = [
  {
    id: "edpConfig",
    title: "Master Configuration",
    url: "/edp-configuration",
    stateKey: "edpSearch",
    fetchItems: fetchEdpConfigItems,
  },
  {
    id: "reports",
    title: "Reports",
    url: "/data-report",
    stateKey: "reportSearch",
    fetchItems: fetchReportItems,
  },
];

// One load per source per user + role + centre (the SPs filter on these),
// shared by every caller.
const cache = new Map();

export const loadSourceItems = (source, cacheKey) => {
  const key = `${source.id}|${cacheKey}`;
  if (cache.has(key)) return cache.get(key);
  const promise = source
    .fetchItems()
    .then((items) => {
      const named = items.filter((item) => item.label);
      // Nothing came back: let the next search try again.
      if (!named.length) cache.delete(key);
      return named;
    })
    .catch(() => {
      cache.delete(key);
      return [];
    });
  cache.set(key, promise);
  return promise;
};

const linksTo = (child, url) =>
  [child?.url, child?.actualUrl].some(
    (link) => link?.toLowerCase().split("?")[0] === url,
  );

// Sources whose page is in this role's menu, each paired with that menu entry
// (`menuChildren`: the BindMenu children, flattened).
export const findActiveSources = (menuChildren) =>
  MENU_SEARCH_SOURCES.map((source) => ({
    source,
    menuChild: (menuChildren || []).find((child) => linksTo(child, source.url)),
  })).filter(({ menuChild }) => menuChild);

const currentUserKey = () => {
  const userData = useLocalStorage("userData", "get");
  return `${userData?.employeeID}_${userData?.defaultRole}_${userData?.defaultCentre}`;
};

export const loadActiveSourceItems = async (activeSources) => {
  const cacheKey = currentUserKey();
  const lists = await Promise.all(
    activeSources.map(async ({ source, menuChild }) =>
      (await loadSourceItems(source, cacheKey)).map((item) => ({
        ...item,
        type: source.id,
        stateKey: source.stateKey,
        menuChild,
      })),
    ),
  );
  return lists.flat();
};

// Items containing the query, those starting with it first. `extraText` lets a
// caller also match an untranslated name.
export const rankMatches = (items, query, extraText = () => "") => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const texts = (item) => [item.label, extraText(item)].map((s) => s?.toLowerCase() || "");
  const matches = items.filter((item) => texts(item).some((s) => s.includes(q)));
  const startsWithQuery = (item) => texts(item).some((s) => s.startsWith(q));
  return [
    ...matches.filter(startsWithQuery),
    ...matches.filter((item) => !startsWithQuery(item)),
  ];
};

// navigate() arguments for a source item: its page, with the menu entry's
// router state (keeps the menu highlight) plus the item to preselect.
export const sourceItemNavigation = (item) => [
  item.menuChild.url,
  {
    state: {
      data: item.menuChild.breadcrumb,
      subMenuID: item.menuChild.subMenuID,
      actualUrl: item.menuChild.actualUrl,
      [item.stateKey]: item.target,
    },
  },
];

// Sidebar search (Modern / NextGen): source results for `query`, grouped per
// source as [{ id, title, items }]. Loads on the first non-empty query.
export const useSourceSearchResults = (menuChildren, query) => {
  const [t] = useTranslation();
  const [items, setItems] = useState([]);
  const activeSources = findActiveSources(menuChildren);
  const sourcesKey = activeSources.map(({ source }) => source.id).join(",");
  const hasQuery = !!query?.trim();
  // Role / centre change: reload (the source SPs filter on them).
  const userKey = currentUserKey();

  useEffect(() => {
    if (!hasQuery || !activeSources.length) return;
    let cancelled = false;
    loadActiveSourceItems(activeSources).then((loaded) => {
      if (!cancelled) setItems(loaded);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasQuery, sourcesKey, userKey]);

  return useMemo(() => {
    const translated = items
      .filter((item) => sourcesKey.split(",").includes(item.type))
      .map((item) => ({ ...item, label: t(item.label), category: t(item.category) }));
    const matches = rankMatches(translated, query || "");
    return activeSources
      .map(({ source }) => ({
        id: source.id,
        title: t(source.title),
        items: matches.filter((item) => item.type === source.id),
      }))
      .filter((group) => group.items.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query, sourcesKey, t]);
};
