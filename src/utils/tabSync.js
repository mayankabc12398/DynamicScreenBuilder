// Cross-tab session sync: when the role (or centre) changes in one tab, every
// other open tab of the app reloads onto /dashboard so its menu, token and
// cached screens match the new claims. The tab that made the change already
// navigates itself, so it never reloads.
//
// BroadcastChannel is the primary transport; the localStorage `storage` event
// is the fallback for browsers without it.
import { notify } from "@app/utils/utils";

const CHANNEL_NAME = "hims-tab-sync";
const STORAGE_KEY = "__hims_tab_sync__";
const RELOAD_DELAY_MS = 1500;

const MESSAGES = {
  ROLE_CHANGED: "Role changed in another tab. Refreshing…",
  CENTRE_CHANGED: "Centre changed in another tab. Refreshing…",
};

const tabId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getChannel = (() => {
  let channel;
  return () => {
    if (channel !== undefined) return channel;
    channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel(CHANNEL_NAME)
        : null;
    return channel;
  };
})();


let reloadScheduled = false;

const handleMessage = (message) => {
  if (!message || message.from === tabId || !MESSAGES[message.type]) return;
  if (reloadScheduled) return;
  // logged-out tabs (login page) have nothing stale to refresh
  if (!window.localStorage.getItem("token")) return;
  reloadScheduled = true;
  notify(MESSAGES[message.type], "warn");
  setTimeout(() => {
    window.location.replace(`${import.meta.env.BASE_URL || "/"}dashboard`);
  }, RELOAD_DELAY_MS);
};

// Call once at app start; returns a cleanup function.
export const listenForSessionChanges = () => {
  const channel = getChannel();
  const onChannel = (e) => handleMessage(e.data);
  const onStorage = (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      handleMessage(JSON.parse(e.newValue));
    } catch (err) {
      // ignore malformed payloads
    }
  };

  if (channel) channel.addEventListener("message", onChannel);
  else window.addEventListener("storage", onStorage);

  return () => {
    if (channel) channel.removeEventListener("message", onChannel);
    else window.removeEventListener("storage", onStorage);
  };
};
