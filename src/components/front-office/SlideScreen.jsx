import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";

const SlideScreen = ({
  children,
  visible,
  setVisible,
  Header,
  containerId = "portal-root",
  hideClose = false,
}) => {
  const theme = useLocalStorage("theme", "get");
  const [remainingHeight, setRemainingHeight] = useState(0);
  const screenRef = useRef(null);
  // All enhancements below are Modern-View only. Old View keeps its original
  // behavior (single-close + CSS `bottom` transition) untouched.
  const isModern = () =>
    typeof document !== "undefined" &&
    document.documentElement.dataset.design === "modern";

  // Replay the slide-up whenever the content switches while already open — so
  // clicking a new screen re-enters from the bottom instead of just swapping.
  // Park the new (heavy) content off-screen BEFORE paint so its layout cost is
  // paid while hidden, then run the composited slide next frame — smooth, no
  // stutter and no flash of the new content at the top. MODERN ONLY.
  useLayoutEffect(() => {
    if (!visible || !isModern()) return;
    const node = screenRef.current;
    if (!node) return;
    // transition:none so parking off-screen doesn't animate a slide-DOWN first.
    // setProperty w/ important — modern base transition is !important.
    node.style.setProperty("transition", "none", "important");
    node.style.animation = "none";
    node.style.transform = "translateY(100%)";
    node.style.opacity = "0";
    // Two frames: frame 1 lets the heavy content lay out + paint while parked
    // off-screen; frame 2 releases it so the slide-up is a clean composited
    // animation with no layout work competing = no stutter.
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => {
        node.style.removeProperty("transition");
        node.style.animation = "";
        node.style.transform = "";
        node.style.opacity = "";
      });
    });
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
  }, [children, visible]);

  const handleCloseClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling to the parent
    if (isModern()) {
      // Modern: close every open slide screen (incl. nested), not just this one.
      window.dispatchEvent(new CustomEvent("slidescreen:close-all"));
    } else {
      // Old View: original behavior — close only this one.
      setVisible();
    }
  };

  // Modern-only: any slide screen listens for the global close and shuts itself.
  useEffect(() => {
    if (!isModern()) return;
    const closeAll = () => setVisible && setVisible();
    window.addEventListener("slidescreen:close-all", closeAll);
    return () => window.removeEventListener("slidescreen:close-all", closeAll);
  }, [setVisible]);

  const getOrCreateContainer = (containerId) => {
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      document.body.appendChild(container);
    }
    return container;
  };

  useEffect(() => {
    const calculateHeight = () => {
      // Start at the top edge of the blue top-nav bar (covers the nav bar and
      // the page-tabs row under it). Falls back to the whole #main-header when
      // the desktop bar isn't rendered (mobile sidebar layout).
      const navBar = document.querySelector("#main-header .bg-color-container");
      const headerEl = document.querySelector("#main-header");
      const headerHeight = navBar
        ? navBar.getBoundingClientRect().top
        : headerEl
          ? headerEl.offsetHeight
          : 0;
      const windowHeight = window.innerHeight;
      setRemainingHeight(windowHeight - headerHeight);
    };

    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, []);

  // Get or create the container dynamically
  const container = getOrCreateContainer(containerId);

  return ReactDOM.createPortal(
    <div
      ref={screenRef}
      className={`side-screen ${visible ? "open" : ""} ${theme}`}
      style={{
        height: `${remainingHeight}px`,
      }}
    >
      <div className={`p-dialog-header justify-content-between`}>
        <div className="">{Header}</div>
        {!hideClose && (
          <button
            type="button"
            className="p-dialog-header-icon p-dialog-header-close p-link py-1"
            data-pc-section="closebutton"
            onClick={handleCloseClick}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="p-icon p-dialog-header-close-icon"
              aria-hidden="true"
              data-pc-section="closebuttonicon"
            >
              <path
                d="M8.01186 7.00933L12.27 2.75116C12.341 2.68501 12.398 2.60524 12.4375 2.51661C12.4769 2.42798 12.4982 2.3323 12.4999 2.23529C12.5016 2.13827 12.4838 2.0419 12.4474 1.95194C12.4111 1.86197 12.357 1.78024 12.2884 1.71163C12.2198 1.64302 12.138 1.58893 12.0481 1.55259C11.9581 1.51625 11.8617 1.4984 11.7647 1.50011C11.6677 1.50182 11.572 1.52306 11.4834 1.56255C11.3948 1.60204 11.315 1.65898 11.2488 1.72997L6.99067 5.98814L2.7325 1.72997C2.59553 1.60234 2.41437 1.53286 2.22718 1.53616C2.03999 1.53946 1.8614 1.61529 1.72901 1.74767C1.59663 1.88006 1.5208 2.05865 1.5175 2.24584C1.5142 2.43303 1.58368 2.61419 1.71131 2.75116L5.96948 7.00933L1.71131 11.2675C1.576 11.403 1.5 11.5866 1.5 11.7781C1.5 11.9696 1.576 12.1532 1.71131 12.2887C1.84679 12.424 2.03043 12.5 2.2219 12.5C2.41338 12.5 2.59702 12.424 2.7325 12.2887L6.99067 8.03052L11.2488 12.2887C11.3843 12.424 11.568 12.5 11.7594 12.5C11.9509 12.5 12.1346 12.424 12.27 12.2887C12.4053 12.1532 12.4813 11.9696 12.4813 11.7781C12.4813 11.5866 12.4053 11.403 12.27 11.2675L8.01186 7.00933Z"
                fill="currentColor"
              ></path>
            </svg>
          </button>
        )}
      </div>

      <div className="main-content" id="screen-height" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    container
  );
};

export default SlideScreen;
