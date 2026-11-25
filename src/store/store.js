import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { uiSlice } from "@app/store/reducers/ui";

import {
  CommonSlice,
  DashboardSlices,
  TokenManagementSlice,
  authSlice,
  loadingSlice,
  reloadDoctor,
  logoutSlice,
  vitalSignSlice,
  BreadcrumbSlice,
} from "./reducers";
// import logger from "redux-logger";

const appReducer = combineReducers({
  ui: uiSlice.reducer,
  authSlice: authSlice,
  loadingSlice: loadingSlice,
  CommonSlice: CommonSlice,
  logoutSlice: logoutSlice,
  TokenManagementSlice: TokenManagementSlice,
  DashboardSlices: DashboardSlices,
  vitalSignSlice: vitalSignSlice,
  reloadDoctor: reloadDoctor,
  Breadcrumb: BreadcrumbSlice,
});

// RESET_STORE wipes all slices back to their initial state (each re-inits from
// undefined). Dispatched on session-expiry logout so the next login refetches
// menu/role instead of using stale data — replaces what the old full-page
// reload used to do for free.
const rootReducer = (state, action) =>
  appReducer(action.type === "RESET_STORE" ? undefined : state, action);

const store = configureStore({
  reducer: rootReducer,
  // middleware: (getDefaultMiddleware) =>
  //   getDefaultMiddleware({ serializableCheck: false }).concat(logger),
});

export default store;
