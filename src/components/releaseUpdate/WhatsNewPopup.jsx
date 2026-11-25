import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
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
import { CategoryBadge, ReleaseBody } from "@app/pages/releaseUpdate/components/common";
import "@app/pages/releaseUpdate/releaseUpdate.css";
import { useTranslation } from "react-i18next";

// Shows pending release popups once per browser session after login.
// "Acknowledge" records server-side (won't return next login).
// "Remind Me Later" only sets a session flag (returns on the next login).
const SESSION_KEY = "ru_popup_seen";

export default function WhatsNewPopup() {
  const [t] = useTranslation();
  const navigate = useNavigate();
  const user = useLocalStorage("userData", "get");
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user?.userValidateID) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    let active = true;
    (async () => {
      const res = await getPendingReleaseApi();
      if (!active) return;
      if (res?.Success ?? res?.success) {
        const data = res?.Data ?? res?.data ?? [];
        const popups = (Array.isArray(data) ? data : [])
          .map(normalizeRelease)
          .filter((r) => r.isPopup);
        if (popups.length) {
          setQueue(popups);
          setIndex(0);
          setVisible(true);
        }
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userValidateID]);

  const current = queue[index];

  const closeForSession = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  };

  const handleAcknowledge = async () => {
    if (current?.id) await acknowledgeReleaseApi(current.id);
    if (index < queue.length - 1) {
      setIndex((i) => i + 1); // show next pending popup
    } else {
      closeForSession();
    }
  };

  const handleReadMore = () => {
    closeForSession();
    navigate("/whats-new");
  };

  if (!current) return null;

  const hero = (
    <div className="ru-pop-hero">
      <div className="ru-pop-kicker">{t("🚀 What's New")}</div>
      <div className="ru-pop-version">{t("Version")} {current.versionNo}</div>
      <div className="ru-pop-date">{formatReleaseDate(current.releaseDate)}</div>
    </div>
  );

  const footer = (
    <div className="ru-pop-footer">
      <button type="button" className="ru-btn ru-btn-link" onClick={handleReadMore}>
        <i className="fas fa-arrow-up-right-from-square" /> {t("Read More")}
      </button>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="ru-btn ru-btn-ghost" onClick={closeForSession}>
          {t("Remind Me Later")}
        </button>
        <button type="button" className="ru-btn ru-btn-primary" onClick={handleAcknowledge}>
          <i className="fas fa-check" /> {t("Acknowledge")}
        </button>
      </div>
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={closeForSession}
      header={hero}
      footer={footer}
      draggable={false}
      dismissableMask={false}
      closable={false}
      style={{ width: "480px", maxWidth: "94vw" }}
      contentStyle={{ paddingTop: 18 }}
    >
      <div className="ru-pop ru-pop-body">
        <div style={{ marginBottom: 10 }}>
          <CategoryBadge category={current.category} />
        </div>
        <h3 style={{ margin: "0 0 10px", color: "#0f172a", fontSize: 17 }}>
          {current.title}
        </h3>
        <ReleaseBody html={current.description} />
        {queue.length > 1 && (
          <div className="ru-pop-count">
            {index + 1} {t("of")} {queue.length} {t("updates")}
          </div>
        )}
      </div>
    </Dialog>
  );
}
