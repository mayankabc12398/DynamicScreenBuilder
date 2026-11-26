import React from "react";
import { createRoot } from "react-dom/client";
import { installConnection } from "./sb/connection";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { PrimeReactProvider } from "primereact/api";
import App from "@app/App";
import store from "@store/store";
import { DesignProvider, ThemeProvider } from "@app/providers";
import AppUpdateNotifier from "@components/AppUpdate/AppUpdateNotifier";
import * as serviceWorker from "./serviceWorker";
import "./utils/i18n";
import "./utils/DateOverRide.js";

import "./index.css";
import "@app/assets/css/theme.css";
import "@app/design-system/modern-skin/index.css";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primeicons/primeicons.css";
// The builder's SearchLookup control is an rc-easyui DataGrid.
import "rc-easyui/dist/themes/default/easyui.css";
import "rc-easyui/dist/themes/icon.css";
import "rc-easyui/dist/themes/react.css";

// Standalone screen builder: keep the chosen backend across logout, tag builder calls
// with the chosen database profile (src/sb/connection.js).
installConnection();

const root = createRoot(document.getElementById("root"));
root.render(
  <PrimeReactProvider>
    <Provider store={store}>
      <DesignProvider>
        <ThemeProvider>
          <BrowserRouter>
            <App />
            <AppUpdateNotifier />
          </BrowserRouter>
        </ThemeProvider>
      </DesignProvider>
    </Provider>
  </PrimeReactProvider>,
);

serviceWorker.unregister();
