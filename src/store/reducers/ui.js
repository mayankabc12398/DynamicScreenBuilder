import { createSlice } from '@reduxjs/toolkit';
import {
  addWindowClass,
  calculateWindowSize,
  removeWindowClass,
} from '@app/utils/helpers';
import {
  NAVBAR_DARK_VARIANTS,
  NAVBAR_LIGHT_VARIANTS,
  SIDEBAR_DARK_SKINS,
  SIDEBAR_LIGHT_SKINS,
} from '@app/utils/themes';


const initialState = {
  screenSize: calculateWindowSize(window.innerWidth),
  darkMode: false,
  navbarVariant: 'navbar-light',
  sidebarSkin: 'sidebar-dark-primary',
  menuSidebarCollapsed: false,
  controlSidebarCollapsed: true,
  headerBorder: false,
  headerFixed: false,
  footerFixed: true,
  layoutBoxed: false,
  menuItemFlat: false,
  menuChildIndent: false,
  layoutFixed: false,
  // ----- Modern layout (additive; classic layout is unaffected) -----
  // Shell selector: 'classic' (legacy, default) or 'modern' (opt-in).
  layoutMode:
    (typeof window !== 'undefined' && window.localStorage.getItem('layoutMode')) ||
    'classic',
  // Desktop collapse state for the modern left sidebar (icon-only rail).
  modernSidebarCollapsed:
    typeof window !== 'undefined' &&
    window.localStorage.getItem('modernSidebarCollapsed') === 'true',
  // Modern shell theme: 'light' (default) or 'dark'. Scoped to the modern
  // layout only, so it never touches the classic AdminLTE dark-mode.
  modernTheme:
    (typeof window !== 'undefined' && window.localStorage.getItem('modernTheme')) ||
    'light',
};

addWindowClass('layout-footer-fixed');

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebarMenu: (state) => {
      state.menuSidebarCollapsed = !state.menuSidebarCollapsed;
    },
    toggleControlSidebar: (state) => {
      state.controlSidebarCollapsed = !state.controlSidebarCollapsed;
    },
    toggleHeaderBorder: (state) => {
      state.headerBorder = !state.headerBorder;
    },
    toggleHeaderFixed: (state) => {
      state.headerFixed = !state.headerFixed;
      if (state.headerFixed) {
        addWindowClass('layout-navbar-fixed');
      } else {
        removeWindowClass('layout-navbar-fixed');
      }
    },
    toggleFooterFixed: (state) => {
      state.footerFixed = !state.footerFixed;
      if (state.footerFixed) {
        addWindowClass('layout-footer-fixed');
      } else {
        removeWindowClass('layout-footer-fixed');
      }
    },
    toggleLayoutBoxed: (state) => {
      state.layoutBoxed = !state.layoutBoxed;
      if (state.layoutBoxed) {
        addWindowClass('layout-boxed');
      } else {
        removeWindowClass('layout-boxed');
      }
    },
    toggleLayoutFixed: (state) => {
      state.layoutFixed = !state.layoutFixed;
      if (state.layoutFixed) {
        removeWindowClass('layout-fixed');
      } else {
        addWindowClass('layout-fixed');
      }
    },
    toggleMenuItemFlat: (state) => {
      state.menuItemFlat = !state.menuItemFlat;
    },
    toggleMenuChildIndent: (state) => {
      state.menuChildIndent = !state.menuChildIndent;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      if (state.darkMode) {
        state.navbarVariant = NAVBAR_DARK_VARIANTS[0].value;
        state.sidebarSkin = SIDEBAR_DARK_SKINS[0].value;
      } else {
        state.navbarVariant = NAVBAR_LIGHT_VARIANTS[0].value;
        state.sidebarSkin = SIDEBAR_LIGHT_SKINS[0].value;
      }
      if (state.darkMode) {
        addWindowClass('dark-mode');
      } else {
        removeWindowClass('dark-mode');
      }
    },
    setNavbarVariant: (state, { payload }) => {
      if (state.darkMode) {
        state.navbarVariant = payload || NAVBAR_DARK_VARIANTS[0].value;
      } else {
        state.navbarVariant = payload || NAVBAR_LIGHT_VARIANTS[0].value;
      }
    },
    setSidebarSkin: (state, { payload }) => {
      if (state.darkMode) {
        state.sidebarSkin = payload || SIDEBAR_DARK_SKINS[0].value;
      } else {
        state.sidebarSkin = payload || SIDEBAR_LIGHT_SKINS[0].value;
      }
    },
    setWindowSize: (state, { payload }) => {
      state.screenSize = payload;
    },
    setLayoutMode: (state, { payload }) => {
      state.layoutMode = payload === 'modern' ? 'modern' : 'classic';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('layoutMode', state.layoutMode);
      }
    },
    toggleLayoutMode: (state) => {
      state.layoutMode = state.layoutMode === 'modern' ? 'classic' : 'modern';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('layoutMode', state.layoutMode);
      }
    },
    toggleModernSidebar: (state) => {
      state.modernSidebarCollapsed = !state.modernSidebarCollapsed;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          'modernSidebarCollapsed',
          String(state.modernSidebarCollapsed),
        );
      }
    },
    setModernTheme: (state, { payload }) => {
      state.modernTheme = payload === 'dark' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('modernTheme', state.modernTheme);
      }
    },
    toggleModernTheme: (state) => {
      state.modernTheme = state.modernTheme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('modernTheme', state.modernTheme);
      }
    },
  },
});

export const {
  toggleSidebarMenu,
  setWindowSize,
  toggleControlSidebar,
  toggleDarkMode,
  setNavbarVariant,
  setSidebarSkin,
  toggleHeaderBorder,
  toggleHeaderFixed,
  toggleFooterFixed,
  toggleLayoutBoxed,
  toggleMenuItemFlat,
  toggleMenuChildIndent,
  toggleLayoutFixed,
  setLayoutMode,
  toggleLayoutMode,
  toggleModernSidebar,
  setModernTheme,
  toggleModernTheme,
} = uiSlice.actions;

export default uiSlice.reducer;
