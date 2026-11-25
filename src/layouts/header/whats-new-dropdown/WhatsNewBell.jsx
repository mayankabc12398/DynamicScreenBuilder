import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import {
  getPendingReleaseApi,
  acknowledgeReleaseApi,
} from "@app/networkServices/ReleaseUpdateApi";
import {
  formatReleaseDate,
  normalizeRelease,
} from "@app/pages/releaseUpdate/constants";
import { CategoryBadge } from "@app/pages/releaseUpdate/components/common";
import "@app/pages/releaseUpdate/releaseUpdate.css";
import { useTranslation } from "react-i18next";

const PANEL_WIDTH = 320;

// Header bell showing unread (un-acknowledged) release updates.
export default function WhatsNewBell() {
  const [t] = useTranslation();
  const navigate = useNavigate();
  const user = useLocalStorage("userData", "get");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const load = async () => {
    if (!user?.userValidateID) return;
    const res = await getPendingReleaseApi();
    if (res?.Success ?? res?.success) {
      const data = res?.Data ?? res?.data ?? [];
      setItems(Array.isArray(data) ? data.map(normalizeRelease) : []);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userValidateID]);

  // Position the portaled panel under the bell, kept on-screen.
  const positionPanel = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const left = Math.max(
      8,
      Math.min(rect.right - PANEL_WIDTH, window.innerWidth - PANEL_WIDTH - 8),
    );
    setCoords({ top: rect.bottom + 8, left });
  };

  useLayoutEffect(() => {
    if (open) positionPanel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (
        btnRef.current?.contains(e.target) ||
        panelRef.current?.contains(e.target)
      )
        return;
      setOpen(false);
    };
    const onReflow = () => setOpen(false); // close on scroll/resize (cheap + safe)
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open]);

  const handleMarkAll = async () => {
    await Promise.all(items.map((i) => acknowledgeReleaseApi(i.id)));
    setItems([]);
  };

  const goToItem = () => {
    setOpen(false);
    navigate("/whats-new");
  };

  const panel = (
    <div
      ref={panelRef}
      className="ru-bell-panel"
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        right: "auto",
        zIndex: 3000,
      }}
    >
      <div className="ru-bell-head">
        <span>
          <i className="fas fa-rocket" style={{ color: "#2563eb" }} /> {t("What's New")}
        </span>
        {items.length > 0 && (
          <button
            type="button"
            className="ru-btn ru-btn-link"
            style={{ fontSize: 12, padding: 0 }}
            onClick={handleMarkAll}
          >
            {t("Mark all read")}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="ru-bell-empty">
          <i className="fas fa-check-circle" style={{ fontSize: 20 }} />
          <div style={{ marginTop: 6 }}>{t("You're all caught up.")}</div>
        </div>
      ) : (
        items.map((it) => (
          <div key={it.id} className="ru-bell-item" onClick={goToItem}>
            <CategoryBadge category={it.category} />
            <div className="ru-bell-item-title">{it.title}</div>
            <div className="ru-item-meta">
              <span>
                <i className="fas fa-tag" /> {it.versionNo}
              </span>
              <span>
                <i className="fas fa-calendar" /> {formatReleaseDate(it.releaseDate)}
              </span>
            </div>
          </div>
        ))
      )}

      <div className="ru-bell-foot">
        <button type="button" className="ru-btn ru-btn-link" onClick={goToItem}>
          {t("View all updates")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="ru-bell">
      <button
        ref={btnRef}
        type="button"
        className="ru-bell-btn"
        title={t("What's New")}
        onClick={() => setOpen((o) => !o)}
      >
        <i className="fas fa-gift text-white fs-4" />
        {items.length > 0 && <span className="ru-bell-badge">{items.length}</span>}
      </button>

      {open && createPortal(panel, document.body)}
    </div>
  );
}
