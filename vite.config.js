import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Splits the configured API base into what a proxy targets and what it must put back.
 *
 * The base is not always just an origin: "http://host:90/HospediaAPI/api/v1" has the API
 * under a virtual directory, so forwarding to the origin alone would ask for /apiforge at
 * the web root and get a 404. Everything before /api/v1 is that prefix, and it goes back on
 * the way out.
 */
const apiForgeProxy = (base) => {
  let url;

  try {
    url = new URL(base);
  } catch {
    // No usable base. Leaving the proxy off fails far less obscurely than pointing it at
    // something invented.
    return undefined;
  }

  const prefix = url.pathname.replace(/\/api\/v\d+\/?$/i, "").replace(/\/$/, "");

  const entry = {
    target: url.origin,
    // false, so the Host header still says :5173 and the cookies the API sets are written
    // for the origin the browser is actually on. That is the whole point of proxying.
    changeOrigin: false,
    rewrite: (p) => prefix + p,
  };

  return { "/apiforge": entry, "/api/v1/ApiForge": entry };
};

/**
 * Identity of this build, for auto-reload after a deploy (src/components/AppUpdate).
 *
 * GitLab CI: commit + pipeline id — the same for every server one pipeline deploys to, and
 * new on a re-run of the same commit. Local builds: a timestamp. Override with BUILD_ID.
 */
const BUILD_ID =
  process.env.BUILD_ID ||
  (process.env.CI_PIPELINE_ID
    ? `${process.env.CI_COMMIT_SHORT_SHA || "ci"}-${process.env.CI_PIPELINE_ID}`
    : `local-${Date.now()}`);

/** Writes dist/version.json, which open tabs poll to learn a new build is live. */
const emitVersionFile = () => ({
  name: "emit-version-json",
  apply: "build",
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "version.json",
      source: JSON.stringify({ build: BUILD_ID, builtAt: new Date().toISOString() }),
    });
  },
});

/**
 * Standalone screen builder: the backend is chosen at runtime (Connect page), not at build
 * time. Every `import.meta.env.VITE_APP_REACT_APP_BASE_URL` read in the copied app code
 * is rewritten to prefer `globalThis.__SB_API_BASE__`, which index.html sets from
 * localStorage "sb.connection" before the app loads. The .env value stays the fallback.
 * Copied files are left byte-identical to hospediav12-fe, so they can be re-synced.
 */
const runtimeApiBase = () => ({
  name: "sb-runtime-api-base",
  enforce: "pre",
  transform(code, id) {
    if (id.includes("node_modules") || !/\.(jsx?|tsx?)$/.test(id.split("?")[0])) return null;
    const needle = "import.meta.env.VITE_APP_REACT_APP_BASE_URL";
    if (!code.includes(needle)) return null;
    return {
      code: code.split(needle).join(`(globalThis.__SB_API_BASE__ || ${needle})`),
      map: null,
    };
  },
});

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    mode,
    // base: '/hospedia_uat/',
      // base: '/hospedia_dev/',
    define: {
      __BUILD_ID__: JSON.stringify(BUILD_ID),
    },
    plugins: [runtimeApiBase(), react(), emitVersionFile()],
    resolve: {
      alias: {
        "@app": path.resolve(__dirname, "./src"),
        "@app/pages/HR": path.resolve(__dirname, "./src/pages/Hr"),
        "@store": path.resolve(__dirname, "./src/store"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@modules": path.resolve(__dirname, "./src/modules"),
        "@pages": path.resolve(__dirname, "./src/pages"),
      },
    },
    build: {
      chunkSizeWarningLimit: 20000,
      sourcemap: false,
      rollupOptions: {
        output: {
          // Vendor code is left to Rollup, deliberately.
          //
          // An earlier version of this file split node_modules into a dozen named chunks
          // (vendor-react, vendor-state, vendor-dnd, …). Rollup reported the consequence
          // as "Circular chunk: vendor-state -> vendor-dnd -> vendor-state": libraries
          // that import each other landed in different chunks, so neither could be
          // evaluated first. In the browser that surfaced as
          //     Uncaught ReferenceError: Cannot access 'F' before initialization
          // and a blank page on a hard reload — the class of bug that only appears in a
          // production build, which is the worst place to find it.
          //
          // Rollup's own chunking derives the graph from the real imports, so it cannot
          // produce that cycle. The bundle savings that mattered did not come from this
          // grouping anyway: they came from making pdf.js and the spreadsheet/PDF export
          // libraries load on demand (see src/utils/pdfjsLoader.js and
          // src/utils/exportLibrary/index.js), which is untouched by this change.
          //
          // If vendor splitting is ever worth revisiting, add ONE group at a time and
          // check `vite build` reports no "Circular chunk" line before keeping it.
        },
      },
    },
    esbuild: {
      drop: mode === "production" ? ["console", "debugger"] : [],
    },
    server: {
      hmr: true,
      // Dev-only escape hatch for the testing API's invalid TLS certificate.
      // The browser hard-fails XHR to it (net::ERR_CERT_*) with no way to accept
      // the risk, so route calls through the dev server instead: Node does the
      // TLS leg, and secure:false lets it skip cert verification. Inert unless
      // VITE_DEV_API_PROXY_TARGET is set in .env, and never used by a build.
      ...(process.env.VITE_DEV_API_PROXY_TARGET
        ? {
            proxy: {
              "/api/v1": {
                target: process.env.VITE_DEV_API_PROXY_TARGET,
                changeOrigin: true,
                secure: false,
              },
            },
          }
        : {}),
    },
  });
};
