import { createRoot } from "react-dom/client";
import { installConnection } from "./sb/connection";
import { Provider } from "react-redux";
import App from "@app/App";
import store from "@store/store";
import { DesignProvider, ThemeProvider } from "@app/providers";
import "./utils/i18n";
import "./index.css";
import "@app/assets/css/theme.css";
import "@app/design-system/modern-skin/index.css";
import * as serviceWorker from "./serviceWorker";
import { BrowserRouter } from "react-router-dom";
import AppUpdateNotifier from "@components/AppUpdate/AppUpdateNotifier";
import ReactGA from "react-ga4";
import { PrimeReactProvider } from "primereact/api";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import React from "react";
import "../node_modules/flag-icon-css/css/flag-icons.min.css"; // ✅Changes made to fig the flag icon bug(Govind)

import "rc-easyui/dist/themes/default/easyui.css";
import "rc-easyui/dist/themes/icon.css";

import "leaflet/dist/leaflet.css";

import "primeicons/primeicons.css";
import "rc-easyui/dist/themes/default/easyui.css";
import "rc-easyui/dist/themes/icon.css";
import "rc-easyui/dist/themes/react.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "react-quill/dist/quill.snow.css";
// pdf.js (and its 1 MB worker bundle) is no longer pulled into the entry chunk:
// index.html loads it from the CDN, and utils/pdfjsLoader.js fetches the local
// copy on demand as the offline fallback. See ensurePdfJs().
import "./utils/DateOverRide.js";
import { installDpdpRuntime } from "./utils/dpdpRuntime";
// import "primeicons/primeicons.css";
// import "rc-easyui/dist/themes/default/easyui.css";
// import "rc-easyui/dist/themes/icon.css";
// import "rc-easyui/dist/themes/react.css";
// import "bootstrap-icons/font/bootstrap-icons.css";
// import "react-quill/dist/quill.snow.css";
const { VITE_NODE_ENV, VITE_GA_ID, VITE_APP_REACT_APP_BASENAME } = import.meta
  .env;

if (VITE_NODE_ENV === "production" && VITE_GA_ID) {
  ReactGA.initialize(VITE_GA_ID);
}

// DPDP Act: AI pseudonymisation + access log; idle until the DPDP module is installed and switched on
installDpdpRuntime();

// Standalone screen builder: keep the chosen backend across logout, tag builder calls
// with the chosen database profile (src/sb/connection.js).
installConnection();

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <PrimeReactProvider>
    <Provider store={store}>
      <DesignProvider>
        <ThemeProvider>
          {/* <BrowserRouter basename={VITE_APP_REACT_APP_BASENAME ? VITE_APP_REACT_APP_BASENAME : '/'}> */}
          <BrowserRouter>
           {/* <BrowserRouter basename="/hospedia_dev">  */}
            <App />
            <AppUpdateNotifier />
            {/* <Confirmation  /> */}
          </BrowserRouter>
        </ThemeProvider>
      </DesignProvider>
    </Provider>
  </PrimeReactProvider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
