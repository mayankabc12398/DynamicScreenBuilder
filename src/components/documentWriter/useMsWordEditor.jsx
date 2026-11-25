import React, { useEffect, useRef, useState } from "react";
import {
  createRadiologyWordDoc,
  deleteRadiologyWordDoc,
  getRadiologyWordHtml,
  getRadiologyWordStatus,
} from "../../networkServices/radiologyWordApi";
import { notify } from "../../utils/utils";
import { APIBaseURL } from "../../networkServices/axiosInstance";

/**
 * "Report Editor": edit a piece of HTML (a report, a template) in desktop MS
 * Word. The API keeps it as a .docx and serves it to Word over WebDAV, so Word
 * saves straight back to the server; every save is polled here and handed to
 * `onHtml`. When Word is closed the file is removed from the server.
 *
 * fin_global_resources.IsDocumentEditor: '1' = plain MS Word link, '2' = the
 * Hospedia Word Helper link (public/word-helper), which closes Word on Ctrl+S.
 *
 * contextKey - what is being edited (a test, a template). While a document is
 *   open for that key the same file is reused; when the key changes the
 *   session ends, so a late save never lands in something else.
 */
export const getDocumentEditorMode = (globalResources) => {
  const value = Array.isArray(globalResources)
    ? globalResources.find((item) => item?.Name === "IsDocumentEditor")?.Value
    : undefined;
  return {
    isEnabled: value === "1" || value === "2",
    useHelper: value === "2",
  };
};

const launchWord = (url) => {
  // A protocol link: Windows hands it to Word and this page stays where it is.
  const link = document.createElement("a");
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const POLL_MS = 3000;

export default function useMsWordEditor({
  contextKey,
  getHtml,
  getTitle,
  onHtml,
  useHelper = false,
}) {
  // { token, version, launchUrl, contextKey, helper, seenOpen, saved }
  const [session, setSession] = useState(null);
  const busyRef = useRef(false);

  // The interval outlives renders - always call the latest callbacks.
  const onHtmlRef = useRef(onHtml);
  onHtmlRef.current = onHtml;
  const sessionRef = useRef(null);
  sessionRef.current = session;

  const key = String(contextKey ?? "");

  const endSession = (ending) => {
    setSession((prev) => (prev?.token === ending?.token ? null : prev));
    if (ending?.token) deleteRadiologyWordDoc(ending.token);
  };

  const openInWord = async () => {
    if (!key) {
      notify("Nothing is selected to open in MS Word", "warn");
      return;
    }
    // Already open for this item: bring the same file back up instead of
    // making a new one - Word switches to the window it already has.
    if (session?.contextKey === key) {
      launchWord(session.launchUrl);
      return;
    }
    if (session) endSession(session);

    const res = await createRadiologyWordDoc({
      Html: getHtml?.() || "",
      Title: getTitle?.() || "Report",
      // Word runs on this PC, so the API address this browser uses reaches it
      // too - the API's own idea of its host can be an internal one behind nginx.
      BaseUrl: new URL(APIBaseURL, window.location.href).href,
    });
    const data = res?.data;
    const launchUrl = useHelper ? data?.helperUrl : data?.wordUrl;
    if (!res?.success || !launchUrl) {
      notify(res?.message || "Could not open in MS Word", "error");
      return;
    }
    setSession({
      token: data.token,
      version: data.version,
      launchUrl,
      contextKey: key,
      helper: useHelper,
    });
    launchWord(launchUrl);
  };

  const pull = async (current, { force = false } = {}) => {
    if (!current || busyRef.current) return;
    busyRef.current = true;
    let wordClosed = false;
    try {
      if (!force) {
        const status = await getRadiologyWordStatus(current.token);
        // Only an explicit "not found" ends the session - a network blip doesn't.
        if (status?.success === false) {
          setSession(null);
          notify("The MS Word link has expired. Open Report Editor again.", "warn");
          return;
        }
        if (!status?.success) return;

        // Word locks the file while it is open and unlocks it on close. But
        // while opening it does LOCK -> UNLOCK -> LOCK, so an unlock only means
        // "closed" once something was saved. With the helper a save closes
        // Word itself, so a save with no lock is a close too.
        const isOpen = !!status?.data?.isOpenInWord;
        const changed = status?.data?.version !== current.version;
        const saved = !!current.saved || changed;
        wordClosed =
          !isOpen &&
          ((!!current.seenOpen && saved) || (current.helper && changed));
        if (isOpen && !current.seenOpen) {
          setSession((prev) =>
            prev?.token === current.token ? { ...prev, seenOpen: true } : prev,
          );
        }
        if (!changed) {
          if (wordClosed) endSession(current);
          return;
        }
      }
      const res = await getRadiologyWordHtml(current.token);
      if (!res?.success) return;
      onHtmlRef.current?.(res.data?.html || "");
      if (wordClosed) {
        endSession(current);
      } else {
        setSession((prev) =>
          prev?.token === current.token
            ? { ...prev, version: res.data?.version, saved: true }
            : prev,
        );
      }
      notify("Updated from MS Word", "success");
    } finally {
      busyRef.current = false;
    }
  };

  // Watch Word's saves while the same item is still on screen.
  useEffect(() => {
    if (!session) return undefined;
    // Empty while the screen reloads its data: just wait.
    if (!key) return undefined;
    if (key !== session.contextKey) {
      endSession(session);
      return undefined;
    }
    const timer = setInterval(() => pull(session), POLL_MS);
    return () => clearInterval(timer);
  }, [session, key]);

  // Leaving the screen: don't leave the file behind on the server.
  useEffect(
    () => () => {
      if (sessionRef.current?.token)
        deleteRadiologyWordDoc(sessionRef.current.token);
    },
    [],
  );

  return {
    session,
    openInWord,
    pullNow: () => pull(session, { force: true }),
    reopen: () => session && launchWord(session.launchUrl),
    close: () => endSession(session),
  };
}

/** Bottom-right bar shown while a document is open in MS Word. */
export function MsWordSessionBar({ word, t }) {
  const tr = t || ((text) => text);
  if (!word?.session) return null;
  return (
    <div
      className="alert alert-info shadow d-flex align-items-center flex-wrap mb-0"
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 1050,
        maxWidth: 520,
        gap: 8,
      }}
    >
      <i className="fa fa-file-word-o" />
      <span style={{ flex: "1 1 240px" }}>
        {word.session.helper
          ? tr("Open in MS Word. Save (Ctrl+S) - Word closes and the text comes in here.")
          : tr("Open in MS Word. Save (Ctrl+S) and close Word - the text comes in here.")}
      </span>
      <button type="button" className="btn btn-sm btn-primary" onClick={word.pullNow}>
        {tr("Get from Word")}
      </button>
      <button type="button" className="btn btn-sm btn-secondary" onClick={word.reopen}>
        {tr("Reopen Word")}
      </button>
      <button
        type="button"
        className="btn btn-sm btn-light"
        onClick={word.close}
        title={tr("Stop taking changes from Word")}
      >
        <i className="fa fa-times" />
      </button>
    </div>
  );
}
