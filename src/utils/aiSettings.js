

const CACHE_KEY = "aiSettings";

const readCache = () => {
  try {
    return JSON.parse(window.localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
};

const normalize = (value) => ({
  enabled: value?.enabled !== false,
  features: { ...(value?.features || {}) },
});

// Last known settings, so widgets render right on reload before the server answers.
let state = normalize(readCache());
const listeners = new Set();










