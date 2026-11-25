import { t } from 'i18next';
import React from 'react';


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleError = this.handleError.bind(this);
    this.handleRejection = this.handleRejection.bind(this);
  }

  // React render-time crashes (e.g. `X.map is not a function`) unmount the whole
  // tree → blank page. getDerivedStateFromError catches them here so the
  // fallback UI renders instead of a blank screen. componentDidCatch logs it.
  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  componentDidMount() {
    // also surface async / global runtime errors that never pass through render
    window.addEventListener('error', this.handleError);
    window.addEventListener('unhandledrejection', this.handleRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleError);
    window.removeEventListener('unhandledrejection', this.handleRejection);
  }

  handleError(event) {
    // A window 'error' event without an Error object is not a crash:
    // "ResizeObserver loop completed with undelivered notifications" (browser
    // notice when a resize handler resizes something in the same frame — the
    // nursing form's fit-width zoom does this now and then) and cross-origin
    // "Script error." both arrive this way. Turning them into a page-wide
    // "Something went wrong" killed working screens at random; just log them.
    if (!event?.error) {
      // eslint-disable-next-line no-console
      console.warn('Ignored non-fatal window error:', event?.message);
      return;
    }
    const error = event.error;
    // A development build of React re-throws, through this same global event,
    // every error that a nested error boundary has ALREADY caught and shown in
    // place (a dialog that could not open, say). Such a boundary marks the
    // error as handled while React processes it — after this event — so the
    // decision waits a tick; an error nobody handled still takes the page.
    setTimeout(() => {
      if (error && error.__handledByBoundary) return;
      this.setState({ error });
    }, 0);
  }

  handleRejection(event) {
    const reason = event?.reason;
    this.setState({
      error:
        reason instanceof Error
          ? reason
          : new Error(String(reason || 'An error occurred')),
    });
  }

  render() {
    const { error } = this.state;

    if (error) {
    // Modern design shows an attractive centered card; legacy keeps its plain
    // look untouched. Design mode is set by DesignProvider on <html data-design>.
    const isModern =
      (typeof document !== "undefined" &&
        document.documentElement.dataset.design === "modern") ||
      (typeof localStorage !== "undefined" &&
        localStorage.getItem("designMode") === "modern");

    if (isModern) {
      return (
        <div className="meb-wrap">
          {/* floating ambient orbs */}
          <span className="meb-orb meb-orb1" aria-hidden="true" />
          <span className="meb-orb meb-orb2" aria-hidden="true" />
          <span className="meb-orb meb-orb3" aria-hidden="true" />

          <div className="meb-card">
            <div className="meb-icon-wrap" aria-hidden="true">
              <span className="meb-ring meb-ring1" />
              <span className="meb-ring meb-ring2" />
              <div className="meb-icon">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
                  <path
                    d="M12 8v5m0 3.5h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <h2 className="meb-title">Oops! Something went wrong</h2>
            <p className="meb-msg">
              {error?.message || "An unexpected error occurred."}
            </p>

            <div className="meb-actions">
              <button
                type="button"
                className="meb-reload"
                onClick={() => window.location.reload()}
              >
                <svg
                  className="meb-reload-ic"
                  viewBox="0 0 24 24"
                  width="17"
                  height="17"
                  fill="none"
                >
                  <path
                    d="M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Reload page</span>
              </button>

              <button
                type="button"
                className="meb-home"
                onClick={() => {
                  window.location.href = "/";
                }}
              >
                Go home
              </button>
            </div>

            {error?.stack && (
              <details className="meb-details">
                <summary>Technical details</summary>
                <pre>{error.stack}</pre>
              </details>
            )}
          </div>

          <style>{`
            .meb-wrap{
              position:fixed; inset:0; z-index:99999; overflow:hidden;
              display:flex; align-items:center; justify-content:center;
              padding:24px;
              background:
                radial-gradient(1100px 620px at 12% -12%, rgba(139,92,246,.20), transparent 60%),
                radial-gradient(900px 520px at 112% 118%, rgba(20,184,166,.18), transparent 55%),
                linear-gradient(160deg,#0a0f1e 0%,#0d1326 60%,#0a0f1e 100%);
              font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
              animation: meb-fade .4s ease both;
            }
            /* ambient floating orbs */
            .meb-orb{ position:absolute; border-radius:50%; filter:blur(46px); opacity:.55; pointer-events:none; }
            .meb-orb1{ width:340px; height:340px; top:-90px; left:-70px;
              background:radial-gradient(circle,#7c3aed,transparent 68%); animation: meb-float 12s ease-in-out infinite; }
            .meb-orb2{ width:300px; height:300px; bottom:-80px; right:-60px;
              background:radial-gradient(circle,#14b8a6,transparent 68%); animation: meb-float 15s ease-in-out infinite reverse; }
            .meb-orb3{ width:220px; height:220px; top:55%; left:8%;
              background:radial-gradient(circle,#ec4899,transparent 70%); opacity:.4; animation: meb-float 18s ease-in-out infinite; }

            .meb-card{
              position:relative; overflow:hidden;
              width:100%; max-width:460px;
              padding:40px 32px 28px;
              text-align:center;
              background:rgba(255,255,255,.94);
              backdrop-filter:blur(14px) saturate(140%);
              -webkit-backdrop-filter:blur(14px) saturate(140%);
              border-radius:24px;
              box-shadow:0 40px 90px -30px rgba(2,6,23,.85), inset 0 1px 0 rgba(255,255,255,.6);
              animation: meb-pop .5s cubic-bezier(.16,1,.3,1) both;
            }
            /* animated gradient border */
            .meb-card::before{
              content:""; position:absolute; inset:0; border-radius:24px; padding:1.5px;
              background:linear-gradient(120deg,#6d28d9,#8b5cf6,#14b8a6,#ec4899,#6d28d9);
              background-size:300% 300%;
              -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
              -webkit-mask-composite:xor; mask-composite:exclude;
              animation: meb-border 6s linear infinite;
              pointer-events:none;
            }

            .meb-icon-wrap{
              position:relative; width:90px; height:90px; margin:0 auto 20px;
              display:flex; align-items:center; justify-content:center;
            }
            .meb-ring{
              position:absolute; inset:0; border-radius:50%;
              border:2px solid rgba(225,29,72,.35);
              animation: meb-pulse 2.4s ease-out infinite;
            }
            .meb-ring2{ animation-delay:1.2s; }
            .meb-icon{
              position:relative; width:66px; height:66px;
              display:flex; align-items:center; justify-content:center;
              color:#e11d48; border-radius:50%;
              background:radial-gradient(circle at 50% 32%, #ffe4e6, #fff1f2);
              box-shadow:0 10px 26px -8px rgba(225,29,72,.55), inset 0 0 0 1px rgba(225,29,72,.08);
              animation: meb-bob 2.8s ease-in-out infinite;
            }

            .meb-title{
              margin:0 0 9px; font-size:23px; font-weight:800; letter-spacing:-.015em;
              background:linear-gradient(90deg,#6d28d9,#8b5cf6,#14b8a6);
              -webkit-background-clip:text; background-clip:text;
              -webkit-text-fill-color:transparent; color:transparent;
            }
            .meb-msg{
              margin:0 auto 24px; max-width:350px;
              font-size:13.5px; line-height:1.6; color:#64748b; word-break:break-word;
            }
            .meb-actions{ display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
            .meb-reload{
              display:inline-flex; align-items:center; gap:9px;
              padding:12px 26px; font-size:14px; font-weight:700; color:#6d28d9;
              border:1px solid rgba(109,40,217,.20) !important; border-radius:13px; cursor:pointer;
              background:#ede9fe !important;
              box-shadow:0 12px 24px -12px rgba(109,40,217,.45);
              transition:transform .18s ease, box-shadow .25s ease, background .2s ease;
            }
            .meb-reload:hover{
              transform:translateY(-2px); background:#e3ddfc !important;
              box-shadow:0 18px 32px -14px rgba(109,40,217,.6);
            }
            .meb-reload:active{ transform:translateY(0) scale(.98); }
            .meb-reload:hover .meb-reload-ic{ transform:rotate(-360deg); }
            .meb-reload-ic{ transition:transform .6s cubic-bezier(.16,1,.3,1); }
            .meb-home{
              display:inline-flex; align-items:center;
              padding:12px 22px; font-size:14px; font-weight:700;
              color:#0f766e; cursor:pointer;
              background:#d9f5ec !important;
              border:1px solid rgba(20,184,166,.28) !important; border-radius:13px;
              transition:background .2s ease, transform .18s ease, border-color .2s ease;
            }
            .meb-home:hover{ background:#c8efe0 !important; border-color:rgba(20,184,166,.5) !important; transform:translateY(-2px); }
            .meb-home:active{ transform:translateY(0) scale(.98); }

            .meb-details{
              margin-top:22px; text-align:left;
              border-top:1px dashed rgba(148,163,184,.35); padding-top:12px;
            }
            .meb-details summary{
              cursor:pointer; font-size:12px; font-weight:600; color:#94a3b8;
              list-style:none; user-select:none; transition:color .15s ease;
            }
            .meb-details summary::-webkit-details-marker{ display:none; }
            .meb-details summary:hover{ color:#6d28d9; }
            .meb-details pre{
              margin:10px 0 0; max-height:180px; overflow:auto;
              font-size:11px; line-height:1.5; color:#475569;
              background:#f8fafc; border:1px solid #eef2f7; border-radius:10px;
              padding:10px 12px; white-space:pre-wrap; word-break:break-word;
            }
            @keyframes meb-fade{ from{opacity:0} to{opacity:1} }
            @keyframes meb-pop{ from{opacity:0; transform:translateY(16px) scale(.96)} to{opacity:1; transform:none} }
            @keyframes meb-border{ to{ background-position:300% 50% } }
            @keyframes meb-float{ 0%,100%{ transform:translate(0,0) } 50%{ transform:translate(26px,-30px) } }
            @keyframes meb-pulse{ 0%{ transform:scale(.85); opacity:.7 } 100%{ transform:scale(1.5); opacity:0 } }
            @keyframes meb-bob{ 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-6px) } }
            @media (prefers-reduced-motion: reduce){
              .meb-wrap *,.meb-card,.meb-card::before{ animation:none!important; transition:none!important; }
            }
          `}</style>
        </div>
      );
    }

    return (
      <>
        <div className='errorBoundary'>
          <div>
            <h2>{t("Something went wrong:")}</h2>
            <p>{t("Error message:")} {error?.message}</p>
            <p>{t("Error stack trace:")}</p>
            <pre>{error?.stack}</pre>
          </div>
        </div>
      </>
    );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;



























