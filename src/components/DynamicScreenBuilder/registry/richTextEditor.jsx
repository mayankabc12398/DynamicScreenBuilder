/**
 * The rich text editor of the Screen Builder's "Rich Text (CKEditor)" field.
 *
 * Its own copy of the app's CKEditor (src/utils/TextEditor.jsx) — same
 * toolbar, plugins, fonts, voice dictation and @ short keys — kept separate so
 * the builder can fix and extend it without touching the editor the
 * hand-coded screens (Result Entry, Discharge Report, Nursing Note…) use.
 *
 * What differs from that editor:
 *   - the @ short keys work: the API, the list and its keyboard handling are
 *     all here, and the list opens under the caret;
 *   - handlers read the latest props (ckeditor4-react keeps the first render's);
 *   - a write from code never swallows the user's next keystroke;
 *   - the parent's value is synced by one effect and not echoed back;
 *   - the editor is destroyed once (by ckeditor4-react), not twice;
 *   - `clear` clears once per signal; a dictation language switch cannot
 *     leave two recognitions running; Source mode keeps the body font;
 *   - optional readOnly / onBlur / onFocus / shortKeys props.
 */
import { CKEditor } from "ckeditor4-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { CKEditorShortKeyAPIControlsAPI } from "@app/networkServices/commonApi";

const EMPTY_EDITOR_CONTENT = "<p><br></p>";

function sanitizeContent(content) {
  if (!content || typeof content !== "string") return EMPTY_EDITOR_CONTENT;
  if (!/<(p|div|span)/i.test(content)) {
    return `<div>${content}</div>`;
  }
  return content;
}

function normalizeEditorText(html) {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isEditorDataEqual(editorData, valueData) {
  return normalizeEditorText(editorData || "") === normalizeEditorText(valueData || "");
}

// Short keys (@word) — one request shared by every editor on the page,
// refreshed after a few minutes so a key added meanwhile still shows up.
const SHORT_KEY_TTL = 5 * 60 * 1000;
let shortKeyCache = { at: 0, promise: null };
function loadShortKeys() {
  if (!shortKeyCache.promise || Date.now() - shortKeyCache.at > SHORT_KEY_TTL) {
    const promise = Promise.resolve()
      .then(() => CKEditorShortKeyAPIControlsAPI())
      .then((resp) => (resp?.success && Array.isArray(resp.data) ? resp.data : null))
      .catch(() => null)
      .then((list) => {
        // A failed call is not cached — the next @ asks again.
        if (!list && shortKeyCache.promise === promise) shortKeyCache = { at: 0, promise: null };
        return list || [];
      });
    shortKeyCache = { at: Date.now(), promise };
  }
  return shortKeyCache.promise;
}

const DsbRichTextEditor = ({
  value,
  setValue,
  EditTable,
  setEditTable,
  clear,
  height = 250,
  isMic,
  readOnly,
  onBlur,
  onFocus,
  shortKeys = true,
}) => {
  const editorRef = useRef(null);
  const wrapperRef = useRef(null);
  const [editor, setEditor] = useState(null);

  // ckeditor4-react keeps the handlers of the FIRST render for good, so
  // everything they read has to come through this ref — or a parent's
  // setValue / setEditTable would be the one from the first render.
  const latest = useRef({});
  latest.current = { value, setValue, setEditTable, onBlur, onFocus, shortKeys };

  // Voice Dictation States
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef(null);

  // Active Ref to prevent stale closures in event listeners
  const isListeningRef = useRef(false);
  const shouldBeListeningRef = useRef(false);

  // Short Key functionality
  const dropdownRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  // The @word being completed, so a late answer for an older word is dropped.
  const mentionRef = useRef(null);
  const dropdownState = useRef({});
  dropdownState.current = { showDropdown, suggestions, activeIndex };

  // True while the editor is being written to from code: the change events
  // that causes are not the user typing. Cleared after the write settles —
  // never left on to swallow the user's next keystroke.
  const isProgrammaticChange = useRef(false);
  // The HTML last handed to setValue, so it coming back as `value` is not
  // written into the editor again (which would move the caret).
  const lastEmitted = useRef(null);
  const prevClearRef = useRef(clear);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const setEditorData = useCallback((ed, html, after) => {
    if (!ed) return;
    isProgrammaticChange.current = true;
    const release = () => {
      setTimeout(() => {
        isProgrammaticChange.current = false;
      }, 0);
    };
    try {
      ed.setData(html, {
        callback: () => {
          release();
          if (after) after();
        },
      });
    } catch (e) {
      console.error("CKEditor setData failed:", e);
      release();
      try {
        ed.setData(EMPTY_EDITOR_CONTENT);
      } catch (e2) {
        /* editor gone */
      }
    }
  }, []);

  /** Hand the editor's HTML to the parent. */
  const emit = useCallback((ed) => {
    if (!ed) return;
    const html = ed.getData();
    lastEmitted.current = html;
    const { setValue: set } = latest.current;
    if (typeof set === "function") set(html);
  }, []);

  // Clear on the `clear` signal turning on (false -> true, or a new number) —
  // once per signal, not on every render while it stays on.
  useEffect(() => {
    const prev = prevClearRef.current;
    prevClearRef.current = clear;
    if (!clear || clear === prev) return;
    const ed = editorRef.current;
    if (ed && ed.status === "ready") setEditorData(ed, EMPTY_EDITOR_CONTENT);
    lastEmitted.current = "";
    const { setValue: set } = latest.current;
    if (typeof set === "function") set("");
  }, [clear, setEditorData]);

  // Keep the editor in step with `value` from the parent (a record loaded, a
  // form reset) — but not with the parent echoing what was just typed.
  useEffect(() => {
    if (editor?.status !== "ready") return;
    const incoming = value ?? "";
    if (incoming === lastEmitted.current) return;
    const current = editor.getData();
    if (current === incoming || isEditorDataEqual(current, incoming)) return;
    setEditorData(editor, sanitizeContent(incoming));
  }, [value, editor, setEditorData]);

  // Dictation must not outlive the editor. (The editor itself is destroyed
  // by ckeditor4-react on unmount — destroying it here too threw.)
  useEffect(() => {
    return () => {
      shouldBeListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Keep the highlighted short key in view while arrowing through the list.
  useEffect(() => {
    if (!dropdownRef.current) return;
    const activeItem = dropdownRef.current.querySelector(".item.active");
    if (activeItem) activeItem.scrollIntoView({ block: "nearest" });
  }, [activeIndex, showDropdown]);

  const closeDropdown = useCallback(() => {
    mentionRef.current = null;
    setShowDropdown(false);
  }, []);

  /** Text of the caret's text node up to the caret, or null. */
  const caretText = (ed) => {
    try {
      const range = ed.getSelection()?.getRanges()?.[0];
      if (!range || !range.collapsed) return null;
      const node = range.startContainer;
      if (!node || node.type !== 3) return null; // CKEDITOR.NODE_TEXT
      return { node, offset: range.startOffset, text: node.getText().slice(0, range.startOffset) };
    } catch (e) {
      return null;
    }
  };

  /** Place the short key list under the caret, inside this editor's box. */
  const updateDropdownPosition = (ed) => {
    try {
      const win = ed?.window?.$;
      const wrap = wrapperRef.current;
      const sel = win?.getSelection?.();
      if (!win || !wrap || !sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0).cloneRange();
      let rect = range.getClientRects()[0] || range.getBoundingClientRect();
      if (!rect || (!rect.top && !rect.left)) {
        const el = range.startContainer?.nodeType === 1 ? range.startContainer : range.startContainer?.parentElement;
        if (el) rect = el.getBoundingClientRect();
      }
      if (!rect) return;
      const frame = win.frameElement ? win.frameElement.getBoundingClientRect() : { top: 0, left: 0 };
      const box = wrap.getBoundingClientRect();
      const left = Math.max(0, Math.min(frame.left + rect.left - box.left, box.width - 250));
      setDropdownPos({ top: frame.top + rect.bottom - box.top + 4, left });
    } catch (e) {
      /* position stays where it was */
    }
  };

  const handleMention = async (ed) => {
    //SHort Key functionality
    const at = caretText(ed);
    const text = at ? at.text : String(ed.getData() || "").replace(/<[^>]*>/g, "");
    const match = text.match(/@(\w*)$/);
    if (!match) {
      closeDropdown();
      return;
    }
    const query = match[1].toLowerCase();
    mentionRef.current = { query };
    const all = await loadShortKeys();
    // Typed on (or moved away) while the list was loading.
    if (mentionRef.current?.query !== query) return;
    const filtered = all.filter((item) => String(item?.ShortKey ?? "").toLowerCase().includes(query));
    setSuggestions(filtered);
    setActiveIndex(0);
    setShowDropdown(filtered.length > 0);
    if (filtered.length) updateDropdownPosition(ed);
  };

  const selectUser = (user) => {
    //SHort Key functionality
    const ed = editorRef.current;
    if (!ed || !user) return;
    const query = mentionRef.current?.query ?? "";
    const html = `${user?.Descriptions ?? ""}&nbsp;`;
    let inserted = false;
    try {
      ed.focus();
      // Replace the @word at the caret — wherever in the text it is.
      const at = caretText(ed);
      const len = query.length + 1;
      if (at && at.offset >= len && at.node.getText().slice(at.offset - len, at.offset).toLowerCase() === `@${query}`) {
        const range = ed.getSelection().getRanges()[0];
        range.setStart(at.node, at.offset - len);
        range.deleteContents();
        range.select();
        ed.insertHtml(html);
        inserted = true;
        emit(ed);
      }
    } catch (e) {
      inserted = false;
    }
    if (!inserted) {
      // Caret lost: the old way — drop the trailing @word and append.
      const data = ed.getData().replace(/@[\w]*$/, "");
      setEditorData(ed, data + html, () => {
        try {
          ed.focus();
          const range = ed.createRange();
          range.moveToElementEditEnd(ed.editable());
          ed.getSelection().selectRanges([range]);
        } catch (e) {}
        emit(ed);
      });
    }
    closeDropdown();
  };

  const selectUserRef = useRef(selectUser);
  selectUserRef.current = selectUser;

  const applyBodyStyle = (ed) => {
    const body = ed?.document?.getBody();
    if (body) {
      body.setStyle("font-family", "Times New Roman");
      body.setStyle("font-size", "18px");
    }
  };

  const onInstanceReady = (evt) => {
    const readyEditor = evt.editor;
    editorRef.current = readyEditor;
    setEditor(readyEditor);
    applyBodyStyle(readyEditor);
    // Source mode and back rebuilds the document — the body style with it.
    readyEditor.on("contentDom", () => applyBodyStyle(readyEditor));
    // Arrow / Enter / Tab / Esc drive the short key list while it is open.
    readyEditor.on(
      "key",
      (e) => {
        const { showDropdown: open, suggestions: list, activeIndex: at } = dropdownState.current;
        if (!open || !list.length) return;
        const key = e.data.keyCode;
        const stop = () => {
          e.cancel();
          try {
            e.data.domEvent?.preventDefault();
          } catch (err) {}
        };
        if (key === 40) {
          stop();
          setActiveIndex((prev) => (prev < list.length - 1 ? prev + 1 : 0));
        } else if (key === 38) {
          stop();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : list.length - 1));
        } else if (key === 13 || key === 9) {
          stop();
          selectUserRef.current(list[at]);
        } else if (key === 27) {
          stop();
          closeDropdown();
        }
      },
      null,
      null,
      1,
    );
    // The value that arrived after the first render (initData is only read
    // once) is written by the sync effect, which runs on `editor` changing.
  };

  const onChange = (evt) => {
    if (isProgrammaticChange.current) {
      // Short key or programmatic update; ignore this event.
      return;
    }
    const { setEditTable: setEdit, shortKeys: keysOn } = latest.current;
    if (typeof setEdit === "function") setEdit(false);
    emit(evt.editor);
    if (keysOn !== false) handleMention(evt.editor); //SHort Key functionality
  };

  const handleBlur = () => {
    // A click in the list keeps focus (mousedown is prevented), so leaving
    // the editor means leaving the list too.
    setTimeout(() => {
      if (editorRef.current && !editorRef.current.focusManager?.hasFocus) closeDropdown();
    }, 150);
    const { onBlur: blur } = latest.current;
    if (typeof blur === "function") blur();
  };

  const handleFocus = () => {
    const { onFocus: focus } = latest.current;
    if (typeof focus === "function") focus();
  };

  // Append spoken text into the editor reliably at the cursor position
  const insertSpokenText = (text) => {
    if (!editorRef.current) return;
    const spoken = text.trim() + " ";

    // Primary: Insert exactly at the active cursor position!
    let inserted = false;
    try {
      editorRef.current.focus();
      editorRef.current.insertText(spoken);
      editorRef.current.fire("change");
      emit(editorRef.current);
      inserted = true;
    } catch (err) {
      console.error("Primary cursor speech insert failed:", err);
    }

    // Fallback: rebuild HTML with text appended to last paragraph if selection is lost
    if (!inserted) {
      try {
        const cur = editorRef.current.getData() || "";
        const hasContent = cur.replace(/<[^>]+>/g, "").trim().length > 0;
        let updated;
        if (!hasContent) {
          updated = `<p>${spoken.trim()}</p>`;
        } else {
          // Append inside the very last </p>
          updated = cur.replace(/(<\/p>)(?![\s\S]*<\/p>)/, ` ${spoken.trim()}$1`);
          if (updated === cur) updated = cur + `<p>${spoken.trim()}</p>`;
        }
        const ed = editorRef.current;
        setEditorData(ed, updated, () => emit(ed));
      } catch (e2) {
        console.error("Fallback speech insert failed:", e2);
      }
    }
  };

  // Speech Recognition Logic
  const startListening = (lang = selectedLanguage) => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }
    if (!editorRef.current) {
      alert("Editor is not ready yet.");
      return;
    }

    try {
      shouldBeListeningRef.current = true;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setInterimText("");
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          alert("Microphone access denied. Please grant microphone permissions in your browser settings.");
          shouldBeListeningRef.current = false;
        }
        setIsListening(false);
        isListeningRef.current = false;
        setInterimText("");
      };

      recognition.onend = () => {
        // A recognition that has been replaced (language switch) ends quietly:
        // restarting it would leave two listening at once.
        if (recognitionRef.current !== recognition) return;
        setIsListening(false);
        isListeningRef.current = false;
        setInterimText("");

        // Auto-restart if browser stopped it due to silence
        if (shouldBeListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {
            console.error("Failed to auto-restart recognition:", e);
          }
        }
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let currentInterim = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          insertSpokenText(finalTranscript);
        }
        setInterimText(currentInterim);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to initialize speech recognition:", err);
      setIsListening(false);
      isListeningRef.current = false;
      shouldBeListeningRef.current = false;
      setInterimText("");
    }
  };

  const stopListening = () => {
    shouldBeListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
    isListeningRef.current = false;
    setInterimText("");
  };

  const toggleListening = () => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    if (isListening) {
      stopListening();
      setTimeout(() => startListening(newLang), 400);
    }
  };

  const editorConfig = {
    contentsCss: ["/NewCkeditor/ckeditor/contents.css"],
    bodyClass: "editor-content",

    font_defaultLabel: "Times New Roman",
    fontSize_defaultLabel: "18px",

    allowedContent: true,
    extraAllowedContent: "span[contenteditable,style]; div[contenteditable,style]; p[contenteditable,style]",

    table_defaultAttributes: {
      style: "width:800px",
    },
    table_defaultStyles: {
      width: "800px",
    },

    extraPlugins:
      "lineheight,tableresize,basicstyles,image2,embed,autoembed,widget,clipboard,lineutils,dialog,dialogui,scayt,notification,toolbar,resize,justify,colorbutton,find,templates,colordialog,newpage,save,print,preview,pastefromword,pagebreak,font,stylescombo,uploadimage",
    removePlugins: "forms",

    toolbar: [
      {
        name: "document",
        items: ["Source", "Save", "NewPage", "Preview", "Print", "Templates"],
      },
      {
        name: "clipboard",
        items: ["Cut", "Copy", "Paste", "PasteText", "PasteFromWord", "Undo", "Redo"],
      },
      { name: "editing", items: ["Find", "Replace", "SelectAll", "Scayt"] },
      {
        name: "basicstyles",
        items: ["Bold", "Italic", "Underline", "Subscript", "Superscript"],
      },
      { name: "links", items: ["Link", "Unlink", "Anchor"] },
      { name: "colors", items: ["TextColor", "BGColor"] },
      "/", // ✅ First Row End

      {
        name: "paragraph",
        items: [
          "NumberedList",
          "BulletedList",
          "Outdent",
          "Indent",
          "Blockquote",
          "CreateDiv",
          "JustifyLeft",
          "JustifyCenter",
          "JustifyRight",
          "JustifyBlock",
          "BidiLtr",
          "BidiRtl",
          "Language",
          "lineheight",
        ],
      },

      {
        name: "insert",
        items: ["Image", "Table", "HorizontalRule", "Smiley", "SpecialChar", "PageBreak", "Iframe", "Embed"],
      },

      { name: "styles", items: ["Styles", "Format", "Font", "FontSize"] },
      { name: "tools", items: ["Maximize", "ShowBlocks"] },
      { name: "others", items: ["-"] },
    ],

    colorButton_colors: "000,800000,8B0000,FF0000,FFA500,FFD700,008000,00FF00,000080,0000FF,800080,FF00FF",
    colorButton_enableMore: true,
    colorButton_backColors: "FFFFCC,FFCC99,FF9999,99CCFF,CCFFFF,CCFFCC,FFFF99,CC99FF",
    height: height,
    enterMode: 2,
    line_height: ".5;.75;1;1.15;1.25;1.5;1.75;2;2.5;3",
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", marginBottom: "10px" }}>
      {isMic && (
        <style>
          {`
            @keyframes micPulse {
              0% {
                box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4);
              }
              70% {
                box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
              }
              100% {
                box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
              }
            }
            @keyframes micRipple {
              0% { transform: scale(1); opacity: 0.7; }
              100% { transform: scale(2.2); opacity: 0; }
            }
            .mic-pulse-button {
              animation: micPulse 1.5s infinite;
              background-color: #dc3545 !important;
              border-color: #dc3545 !important;
              color: #fff !important;
            }
            .speech-bar-container {
              display: flex;
              align-items: center;
              justify-content: space-between;
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              padding: 8px 15px;
              border-radius: 6px 6px 0 0;
              border: 1px solid #ced4da;
              border-bottom: none;
              gap: 12px;
              flex-wrap: wrap;
            }
            .speech-preview-box {
              background-color: #fff;
              padding: 6px 12px;
              margin-bottom: 8px;
              border-radius: 4px;
              font-size: 14px;
              color: #6c757d;
              font-style: italic;
              display: flex;
              align-items: center;
              gap: 8px;
              border: 1px solid #e9ecef;
              border-left: 3px solid #17a2b8;
            }
            .mic-overlay {
              position: fixed;
              inset: 0;
              z-index: 9999;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: rgba(0,0,0,0.18);
              pointer-events: none;
            }
            .mic-overlay-btn {
              position: relative;
              width: 72px;
              height: 72px;
              border-radius: 50%;
              background: #79a18eff;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 24px rgba(40,167,69,0.35);
            }
            .mic-overlay-btn i {
              font-size: 30px;
              color: #fff;
            }
            .mic-overlay-ripple {
              position: absolute;
              width: 72px;
              height: 72px;
              border-radius: 50%;
              background: rgba(91,192,222,0.45);
              animation: micRipple 1.4s ease-out infinite;
            }
            .mic-overlay-ripple:nth-child(2) {
              animation-delay: 0.5s;
            }
            .mic-overlay-label {
              margin-top: 18px;
              font-size: 15px;
              font-weight: 600;
              color: #fff;
              letter-spacing: 0.5px;
              text-shadow: 0 1px 4px rgba(0,0,0,0.4);
            }
          `}
        </style>
      )}

      {/* Centered mic loader overlay while listening */}
      {isMic && isListening && (
        <div className="mic-overlay">
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="mic-overlay-ripple" />
            <div className="mic-overlay-ripple" />
            <div className="mic-overlay-btn">
              <i className="fas fa-microphone" />
            </div>
          </div>
          <div className="mic-overlay-label">Listening...</div>
        </div>
      )}

      {/* Dictation Control Panel */}
      {isMic && (
        <div className="speech-bar-container">
          {/* Language selector — fixed on LEFT */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <select
              id="voice-lang-select"
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="form-control form-control-sm"
              style={{
                width: "160px",
                height: "30px",
                padding: "2px 8px",
                fontSize: "13px",
                borderRadius: "4px",
                border: "1px solid #ced4da",
              }}
            >
              <option value="en-IN">🇮🇳 English (India)</option>
              <option value="en-US">🇺🇸 English (US)</option>
              <option value="hi-IN">🇮🇳 Hindi</option>
            </select>
          </div>

          {/* Mic button — on RIGHT */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isListening && (
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span
                  className="spinner-grow spinner-grow-sm text-danger"
                  role="status"
                  style={{ width: "10px", height: "10px" }}
                ></span>
                Listening...
              </span>
            )}
            <button
              type="button"
              onClick={toggleListening}
              disabled={readOnly === true}
              className={`btn btn-sm text-white ${isListening ? "mic-pulse-button" : "btn-outline-secondary"}`}
              title={isListening ? "Stop Dictation" : "Start Voice Dictation"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: "600",
                borderRadius: "4px",
                padding: "6px 14px",
                transition: "all 0.3s ease",
              }}
            >
              <i className={`fas  ${isListening ? "fa-stop" : "fa-microphone"}`}></i>
              {isListening ? "Stop" : "Mic"}
            </button>
          </div>
        </div>
      )}

      {/* CKEditor Container */}
      <div
        style={
          isMic
            ? {
                border: "1px solid #ced4da",
                borderTop: "none",
                borderRadius: "0 0 6px 6px",
                overflow: "hidden",
              }
            : {}
        }
      >
        <CKEditor
          initData={sanitizeContent(value)}
          onChange={onChange}
          onInstanceReady={onInstanceReady}
          onBlur={handleBlur}
          onFocus={handleFocus}
          readOnly={typeof readOnly === "boolean" ? readOnly : undefined}
          config={editorConfig}
        />
      </div>

      {/* SHort Key functionality — the @word list, under the caret */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="mention-dropdown"
          role="listbox"
          style={{ top: dropdownPos.top, left: dropdownPos.left, maxHeight: "200px", overflowY: "auto" }}
        >
          {suggestions.map((user, index) => (
            <div
              key={user?.id ?? user?.ShortKey ?? index}
              role="option"
              aria-selected={index === activeIndex}
              className={`item ${index === activeIndex ? "active" : ""}`}
              title={typeof user?.Descriptions === "string" ? user.Descriptions.replace(/<[^>]+>/g, "") : undefined}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => {
                // Keep the caret in the editor, then insert.
                e.preventDefault();
                selectUser(user);
              }}
            >
              <span>{user?.ShortKey}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DsbRichTextEditor;
