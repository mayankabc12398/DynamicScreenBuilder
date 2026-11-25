/**
 * "What should it be called?" — the builder's own name prompt.
 *
 * `window.prompt` is not available in every host this builder runs in: inside
 * the hospital's embedded browser it returns null without ever showing, so
 * "New screen" and "Save this block" quietly did nothing. This is the same
 * question asked in the page itself — focused, Enter to accept, Escape to
 * leave — and it looks like the rest of the builder.
 */
import React, { useEffect, useRef, useState } from "react";
import Icon from "../registry/icons";

export default function AskName({
  title = "Name",
  label = "Name",
  placeholder = "",
  value = "",
  okText = "Save",
  onOk,
  onCancel,
}) {
  const [text, setText] = useState(value);
  const inputRef = useRef(null);

  // Focused with the current name selected: the usual answer is a small edit
  // of what is already there, and the usual alternative is typing over it.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, []);

  const submit = () => {
    const name = text.trim();
    if (!name) return;
    onOk?.(name);
  };

  return (
    <div className="dsb-modal-root" onClick={onCancel}>
      <div
        className="dsb-ask"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel?.();
          if (e.key === "Enter") submit();
        }}
      >
        <header className="dsb-ask-head">
          <span>{title}</span>
          <button type="button" className="dsb-icon-btn" title="Close" aria-label="Close" onClick={onCancel}>
            <Icon name="X" size={15} />
          </button>
        </header>
        <label className="dsb-ask-body">
          <span>{label}</span>
          <input
            ref={inputRef}
            className="dsbi-input"
            value={text}
            placeholder={placeholder}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <footer className="dsb-ask-foot">
          <button type="button" className="dsbi-mini" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="dsbi-mini is-primary" disabled={!text.trim()} onClick={submit}>
            {okText}
          </button>
        </footer>
      </div>
    </div>
  );
}
