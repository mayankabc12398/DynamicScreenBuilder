// Bridges non-React code (axios interceptor) to React Router navigation +
// redux, WITHOUT a full browser reload. A top-level component inside <Provider>
// and <Router> registers the live navigate() + a logout/reset handler here;
// the axios 401 handler then calls redirectToLogin() to soft-navigate.
//
// Avoids circular imports: this module imports nothing. It only holds refs that
// React-land injects at runtime.

let _navigate = null; // react-router navigate(path, opts)
let _onLogout = null; // resets redux store (RESET_STORE dispatch)

export const setNavigator = (fn) => {
  _navigate = fn;
};

export const setLogoutHandler = (fn) => {
  _onLogout = fn;
};

// Soft redirect to /login. Clears redux (so the next login refetches menu/role,
// matching the old full-reload behavior) and swaps the route in-app — no
// window.location.href, so no white-flash browser reload. Falls back to a hard
// redirect only if React hasn't registered a navigator yet (pre-mount).
export const redirectToLogin = () => {
  try {
    if (_onLogout) _onLogout();
  } catch {
    /* ignore reset failure — still navigate */
  }
  if (_navigate) {
    _navigate("/login", { replace: true });
  } else {
    window.location.href = "/login";
  }
};
