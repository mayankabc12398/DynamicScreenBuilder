import { CKEditor } from "ckeditor4-react";
import React, { useRef, useState } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

/** The stock toolbar: every group the editor ships with. */
const FULL_TOOLBAR = [
  {
    name: "document",
    items: ["Source", "Save", "NewPage", "Preview", "Print", "Templates"],
  },
  {
    /* Cut, Copy and Paste are gone.

       No modern browser lets a page read or write the clipboard from a button - it is a
       security rule, not a setting - so those three never did anything except raise
       "Press Ctrl+Shift+V to paste. Your browser doesn't support pasting with the toolbar
       button". Pressed a few times while looking for something else, the notices stack up
       and cover the report.

       Ctrl+X / Ctrl+C / Ctrl+V work as they always have. PasteText and PasteFromWord stay:
       they open a dialog to paste into, which browsers do allow. */
    name: "clipboard",
    items: ["PasteText", "PasteFromWord", "Undo", "Redo"],
  },
  {
    name: "editing",
    items: ["Find", "Replace", "SelectAll", "Scayt", "HxGoogleLookup"],
  },
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
      "ParagraphSpacing",
    ],
  },

  {
    name: "insert",
    items: [
      "Image",
      // The grid first: it is what a table is made with day to day. "Table" is kept
      // beside it for the few that need a caption, a summary or an odd border.
      "HxTable",
      "HxRowAbove",
      "HxRowBelow",
      "HxColumnLeft",
      "HxColumnRight",
      "HxRowDelete",
      "HxColumnDelete",
      "HxTableDelete",
      "Table",
      "HorizontalRule",
      "Smiley",
      "SpecialChar",
      "PageBreak",
      "Iframe",
      "Embed",
    ],
  },

  { name: "styles", items: ["Styles", "Format", "Font", "FontSize"] },
  { name: "tools", items: ["Maximize", "ShowBlocks"] },
  { name: "others", items: ["-"] },
];

/**
 * Reporting toolbar — the writing tools a radiologist actually uses, on one
 * row. Drops document/clipboard/insert/embed groups so the toolbar costs a
 * header strip instead of a third of the panel.
 */
const BASIC_TOOLBAR = [
  { name: "clipboard", items: ["Undo", "Redo"] },
  { name: "basicstyles", items: ["Bold", "Italic", "Underline", "RemoveFormat"] },
  {
    name: "paragraph",
    items: [
      "NumberedList",
      "BulletedList",
      "Outdent",
      "Indent",
      "ParagraphSpacing",
    ],
  },
  { name: "align", items: ["JustifyLeft", "JustifyCenter", "JustifyRight"] },
  { name: "styles", items: ["Format", "FontSize"] },
  { name: "colors", items: ["TextColor"] },
  { name: "insert", items: ["HxTable", "HxRowAbove", "HxRowBelow", "HxColumnLeft", "HxColumnRight", "HxRowDelete", "HxColumnDelete", "HxTableDelete"] },
  { name: "tools", items: ["Find", "Maximize"] },
];


/* ====================================================================   Paragraph spacing - the half of Word's line-spacing menu the lineheight
   plugin does not ship.

   The numeric list (1.0 / 1.15 / 1.5 / 2.0 ...) is line height WITHIN a
   paragraph and is handled by `lineheight`. The gap BETWEEN paragraphs is a
   margin, so it gets its own commands. Both live under one "Line Spacing"
   menu button so the control reads the way it does in Word.
   =========================================================================== */

/** 12pt before / after, the same step Word's own menu applies. */
const PARAGRAPH_SPACE = "12pt";

/** Runs `fn` over every paragraph touched by the selection, undoable as one step. */
const eachSelectedBlock = (editor, fn) => {
  const selection = editor.getSelection();
  if (!selection) return;
  editor.fire("saveSnapshot");
  selection.getRanges().forEach((range) => {
    const iterator = range.createIterator();
    iterator.enlargeBr = true;
    let block;
    while ((block = iterator.getNextParagraph())) fn(block);
  });
  editor.fire("saveSnapshot");
  editor.fire("change");
};

/**
 * Registers the Line Spacing menu button. Called once per editor while the
 * plugins are loading - the toolbar is built straight after, so a button added
 * any later would never be drawn.
 */
/* "Search on Google" on the right click menu, for whatever is selected.
 *
 * A radiologist reading a report meets a term, a drug or an abbreviation they want to
 * look up. Today that means copying it, leaving the report, opening a tab and pasting.
 * This does all four in one click, in a new tab, so the report is never left.
 *
 * On the editor's own context menu rather than the browser's, because the editor already
 * replaces the browser's menu on right click - contextmenu is compiled into this build.
 * So this adds to the menu that is actually shown; it takes nothing away. The browser's
 * own menu, with the spelling suggestions, is still there on Ctrl + right click.
 *
 * Only when something is selected. With nothing selected there is nothing to look up, and
 * an item that does nothing is worse than no item.
 *
 * `noopener,noreferrer` because the new tab must not be able to reach back into this one,
 * and the search must not carry a referrer that says which page it came from.
 */
const registerGoogleLookup = (editor) => {
  const CKEDITOR = window.CKEDITOR;
  if (!CKEDITOR || !editor?.addCommand) return;

  const selectedText = () => {
    try {
      return String(editor.getSelection()?.getSelectedText?.() || "").trim();
    } catch (err) {
      return "";
    }
  };

  editor.addCommand("hxGoogleLookup", {
    exec: () => {
      const text = selectedText();
      if (!text) return;
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer",
      );
    },
  });

  const lookupIcon =
    "data:image/svg+xml;base64," +
    window.btoa(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">' +
        '<circle cx="7" cy="7" r="4.5" fill="none" stroke="#1a73e8" stroke-width="1.6"/>' +
        '<line x1="10.4" y1="10.4" x2="14" y2="14" stroke="#1a73e8" stroke-width="1.8" stroke-linecap="round"/>' +
        "</svg>",
    );

  /* On the toolbar as well as the right-click menu.

     It used to live only on the editor's context menu. That menu is now given up so the
     browser's own can be reached - the spelling corrections and Add to dictionary are in
     there - and taking a working feature away to add another one is no trade at all. The
     button does the same thing and is in plain sight, so it is found by people who never
     thought to right click.

     Ctrl+Shift+G too, for anyone who reads with their hands on the keyboard. */
  if (editor.ui?.addButton) {
    editor.ui.addButton("HxGoogleLookup", {
      label: "Search on Google",
      title: "Search the selected text on Google (Ctrl+Shift+G)",
      command: "hxGoogleLookup",
      toolbar: "editing,100",
      icon: lookupIcon,
    });
  }

  if (editor.setKeystroke) {
    editor.setKeystroke(
      CKEDITOR.CTRL + CKEDITOR.SHIFT + 71 /* G */,
      "hxGoogleLookup",
    );
  }

  // The context menu is only there when CKEditor's own menu has been kept.
  if (!editor.addMenuItem || !editor.contextMenu) return;

  editor.addMenuGroup("hxLookupGroup", 100);
  editor.addMenuItem("hxGoogleLookup", {
    label: "Search on Google",
    group: "hxLookupGroup",
    order: 1,
    command: "hxGoogleLookup",
    icon:
      "data:image/svg+xml;base64," +
      window.btoa(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">' +
          '<circle cx="7" cy="7" r="4.5" fill="none" stroke="#1a73e8" stroke-width="1.6"/>' +
          '<line x1="10.4" y1="10.4" x2="14" y2="14" stroke="#1a73e8" stroke-width="1.8" stroke-linecap="round"/>' +
          "</svg>",
      ),
  });

  editor.contextMenu.addListener(() =>
    selectedText() ? { hxGoogleLookup: CKEDITOR.TRISTATE_OFF } : null,
  );
};

const registerParagraphSpacing = (editor) => {
  const CKEDITOR = window.CKEDITOR;
  if (!CKEDITOR || !editor.ui.addMenuButton) return;

  const setSpace = (side, value) => {
    const property = side === "before" ? "margin-top" : "margin-bottom";
    eachSelectedBlock(editor, (block) => block.setStyle(property, value));
  };

  const lineHeights = ["1.0", "1.15", "1.5", "2.0", "2.5", "3.0"];

  lineHeights.forEach((size) => {
    editor.addCommand(`paraLine${size.replace(".", "_")}`, {
      exec: () =>
        eachSelectedBlock(editor, (block) => {
          block.setStyle("line-height", size);
        }),
    });
  });

  editor.addCommand("paraSpaceBeforeAdd", { exec: () => setSpace("before", PARAGRAPH_SPACE) });
  editor.addCommand("paraSpaceBeforeRemove", { exec: () => setSpace("before", "0") });
  editor.addCommand("paraSpaceAfterAdd", { exec: () => setSpace("after", PARAGRAPH_SPACE) });
  editor.addCommand("paraSpaceAfterRemove", { exec: () => setSpace("after", "0") });

  editor.addMenuGroup("paraLineGroup", 1);
  editor.addMenuGroup("paraSpaceGroup", 2);

  const menuItems = {};
  lineHeights.forEach((size, index) => {
    menuItems[`paraLine${index}`] = {
      label: size,
      group: "paraLineGroup",
      order: index,
      command: `paraLine${size.replace(".", "_")}`,
    };
  });

  menuItems.paraSpaceBeforeAdd = {
    label: "Add Space Before Paragraph",
    group: "paraSpaceGroup",
    order: 1,
    command: "paraSpaceBeforeAdd",
  };
  menuItems.paraSpaceBeforeRemove = {
    label: "Remove Space Before Paragraph",
    group: "paraSpaceGroup",
    order: 2,
    command: "paraSpaceBeforeRemove",
  };
  menuItems.paraSpaceAfterAdd = {
    label: "Add Space After Paragraph",
    group: "paraSpaceGroup",
    order: 3,
    command: "paraSpaceAfterAdd",
  };
  menuItems.paraSpaceAfterRemove = {
    label: "Remove Space After Paragraph",
    group: "paraSpaceGroup",
    order: 4,
    command: "paraSpaceAfterRemove",
  };

  editor.addMenuItems(menuItems);

  editor.ui.addMenuButton("ParagraphSpacing", {
    label: "Line and Paragraph Spacing",
    toolbar: "paragraph,100",
    // Borrow the lineheight plugin's own icon so the button matches the rest
    // of the strip instead of rendering as an empty square.
    icon: CKEDITOR.getUrl("plugins/lineheight/icons/lineheight.png"),
    onMenu: () => {
      const state = {};
      Object.keys(menuItems).forEach((key) => {
        state[key] = CKEDITOR.TRISTATE_OFF;
      });
      return state;
    },
  });
};


/* ---- Pascal case helpers ----
   Typing ke waqt yeh batate hain ki caret se theek pehle kya hai, taaki naye letter
   ko capital karna hai ya chhota, yeh tay ho sake. */

const BLOCK_ELEMENTS =
  /^(address|blockquote|body|dd|div|dl|dt|h[1-6]|li|ol|p|pre|table|tbody|td|th|tr|ul)$/i;

/** Node ke subtree ka aakhri character. <br> aur block element par space lautata
    hai - caller ke liye "nayi line" aur "space" dono word boundary hi hain. */
const lastCharOfNode = (node) => {
  if (!node) return "";
  if (node.nodeType === 3) {
    const text = node.textContent;
    return text ? text.charAt(text.length - 1) : "";
  }
  if (node.nodeType !== 1) return "";
  if (node.nodeName === "BR" || BLOCK_ELEMENTS.test(node.nodeName)) return " ";
  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    const ch = lastCharOfNode(node.childNodes[i]);
    if (ch) return ch;
  }
  return "";
};

/** Caret se pehla character; editor ke shuru me khaali string. */
const charBeforeCaret = (doc) => {
  const selection = doc?.getSelection && doc.getSelection();
  if (!selection || !selection.rangeCount) return "";
  const range = selection.getRangeAt(0);
  let node = range.startContainer;

  if (node.nodeType === 3) {
    const before = node.textContent.slice(0, range.startOffset);
    if (before) return before.charAt(before.length - 1);
  } else if (range.startOffset > 0) {
    const child = node.childNodes[range.startOffset - 1];
    const ch = lastCharOfNode(child);
    if (ch) return ch;
    node = child || node;
  }

  /* Caret apne node ke bilkul shuru me hai - peeche ke siblings me, phir upar ke
     level me dhoondhte hain. Block ke shuru par pahunche to nayi line maan lete hain. */
  while (node && node !== doc.body) {
    for (let prev = node.previousSibling; prev; prev = prev.previousSibling) {
      const ch = lastCharOfNode(prev);
      if (ch) return ch;
    }
    node = node.parentNode;
    if (node && node.nodeType === 1 && BLOCK_ELEMENTS.test(node.nodeName)) return " ";
  }
  return "";
};
/**
 * "Word" toolbar - the File, Home and Insert tabs of MS Word, laid out in the same order, for the
 * Radiology Report. Only what CKEditor 4 offers is here: Word's header / footer, page numbers, shapes,
 * charts, SmartArt, equations and text boxes have no equivalent in this editor.
 *   File   : New, Preview, Print, Templates, Source
 *   Home   : Clipboard (Cut, Copy, Paste, Paste as text, Paste from Word, Copy Formatting),
 *            Font (name, size, bold, italic, underline, strike, sub / superscript, clear formatting,
 *            font colour, highlight), Paragraph (lists, indent, alignment, line spacing, quote),
 *            Styles, Editing (Find, Replace, Select All)
 *   Insert : Table, Picture, Link, Anchor, Horizontal line, Symbol, Page break, Emoji, Embed
 */
// The extra Word tools (Bullet style, Numbering style, Sort) live in the CKEditor plugin file
// public/NewCkeditor/ckeditor/plugins/wordextras/plugin.js (loaded through extraPlugins below).
const WORD_TOOLBAR = [
  { name: "file", items: ["NewPage", "Preview", "Print", "Templates", "Source"] },
  {
    name: "clipboard",
    items: ["Undo", "Redo", "Cut", "Copy", "Paste", "PasteText", "PasteFromWord", "CopyFormatting"],
  },
  { name: "font", items: ["Font", "FontSize"] },
  { name: "styles", items: ["Styles", "Format"] },
  "/",
  {
    name: "basicstyles",
    items: ["Bold", "Italic", "Underline", "Strike", "Subscript", "Superscript", "AllCaps", "RemoveFormat"],
  },
  { name: "colors", items: ["TextColor", "BGColor"] },
  {
    name: "paragraph",
    items: [
      "NumberedList",
      "BulletedList",
      "Outdent",
      "Indent",
      "Blockquote",
      "JustifyLeft",
      "JustifyCenter",
      "JustifyRight",
      "JustifyBlock",
      "lineheight",
      "BulletLibrary",
      "NumberLibrary",
      "SortList",
    ],
  },
  { name: "editing", items: ["Find", "Replace", "SelectAll", "Scayt"] },
  "/",
  {
    name: "insert",
    items: [
      "Table",
      "Image",
      "Link",
      "Unlink",
      "Anchor",
      "HorizontalRule",
      "SpecialChar",
      "PageBreak",
      "Smiley",
      "Embed",
    ],
  },
  { name: "tools", items: ["ShowBlocks", "Maximize"] },
];

// ---------------------------------------------------------------------------
// Ctrl + mouse word-selection helpers (MS Word-like behaviour)
// ---------------------------------------------------------------------------

/** Expand a collapsed range outward to the non-whitespace word it sits within. */
function expandRangeToWord(range) {
  const r = range.cloneRange();
  const node = range.startContainer;
  if (node.nodeType !== 3) return r; // not a text node — return as-is
  const text = node.textContent;
  let s = range.startOffset;
  let e = range.startOffset;
  while (s > 0 && /\S/.test(text[s - 1])) s--;
  while (e < text.length && /\S/.test(text[e])) e++;
  if (s === e) return r; // clicked on whitespace
  r.setStart(node, s);
  r.setEnd(node, e);
  return r;
}

/**
 * Attach a Ctrl+mousedown listener inside the CKEditor iframe so that
 * holding Ctrl while clicking selects the word under the cursor and tries
 * to add it to the existing selection.
 *
 * Browser note — Chrome 58+ removed multi-range Selection support:
 *   selection.addRange() replaces any existing range instead of appending.
 *   Firefox still supports it (Ctrl+click builds a true multi-word selection).
 *   In Chrome each Ctrl+click simply selects the one word under the pointer
 *   (the previous selection is lost), which is the closest reliable fallback.
 *
 * All standard Ctrl shortcuts (A / C / X / V / Z / Y / B / I / U) are
 * handled by CKEditor's built-in command layer and are unaffected.
 */
function installCtrlWordSelect(ed) {
  const iframeWin = ed.window?.$;
  const iframeDoc = ed.document?.$;
  if (!iframeWin || !iframeDoc) return;

  // Guard: avoid wiring twice on the same document instance.
  if (iframeDoc.__ctrlWordSelectInstalled) return;
  iframeDoc.__ctrlWordSelectInstalled = true;

  iframeDoc.addEventListener("mousedown", function ctrlWordDown(e) {
    if (!e.ctrlKey || e.button !== 0) return;
    // Prevent the browser from starting its own drag-selection from this point
    // so we can place our own word range cleanly.
    e.preventDefault();

    const sel = iframeWin.getSelection();
    if (!sel) return;

    // Snapshot existing ranges before the browser clears them.
    const saved = [];
    for (let i = 0; i < sel.rangeCount; i++) {
      saved.push(sel.getRangeAt(i).cloneRange());
    }

    // Locate the text position at the click coordinates.
    let clickRange = null;
    if (iframeDoc.caretRangeFromPoint) {
      // Chrome / Safari
      clickRange = iframeDoc.caretRangeFromPoint(e.clientX, e.clientY);
    } else if (iframeDoc.caretPositionFromPoint) {
      // Firefox
      const pos = iframeDoc.caretPositionFromPoint(e.clientX, e.clientY);
      if (pos) {
        clickRange = iframeDoc.createRange();
        clickRange.setStart(pos.offsetNode, pos.offset);
        clickRange.collapse(true);
      }
    }
    if (!clickRange) return;

    const wordRange = expandRangeToWord(clickRange);

    // Restore previous ranges then append the new word.
    // Firefox: addRange truly appends → real multi-word selection.
    // Chrome: each addRange replaces → only the last word remains selected
    //         (acknowledged limitation; the word-level snap is still useful).
    sel.removeAllRanges();
    for (const r of saved) {
      try { sel.addRange(r); } catch (_) {}
    }
    try { sel.addRange(wordRange); } catch (_) {}
  });
}

const FullTextEditor = ({
  value,
  setValue,
  EditTable,
  setEditTable,
  clear,
  height = 250,
  isMic,
  toolbarMode = "full", // "full" | "basic" | "word"
  // Browser ka apna spellcheck - galat shabd ke neeche laal lakeer, aur right-click
  // par sahi spelling ke suggestions. Opt-in hai kyunki iske liye CKEditor ka apna
  // context menu hatana padta hai (neeche dekhein).
  enableSpellCheck: enableSpellCheckProp = false,
  /* Khaali rakhna hi sahi default hai: browser apni configured dictionary use karta
     hai. Yahan koi lang thopne par Chrome usse match karne ki koshish karta hai, aur
     match na mile (jaise bare "en" jabki install "en-US" hai) to underline to lagata
     hai par suggestions dena band kar deta hai. Sirf tab bharein jab kisi screen ko
     pakki dictionary chahiye, aur tab poora tag dein - "en-US", "en-GB". */
  spellCheckLang = "",
  /* Ctrl+S: editor ke andar dabane par yeh callback editor ke abhi ke HTML ke saath
     chalta hai (browser ka "Save page" dialog rok diya jaata hai). Prop na dein to
     Ctrl+S ka default browser behaviour waisa hi rehta hai. */
  onSaveShortcut,
  /* Typing ke waqt har word ka pehla letter capital aur baaki chhote kar deta hai.
     Sirf jo type hota hai uspar - paste, template aur dictation ka content chheda
     nahi jaata. */
  pascalCase = false,
  /* Optional ref: parent gets `getDataRef.current()` returning the editor's live HTML.
     A save button should read this rather than the `value` state - text typed through
     the pascalCase path (insertText) does not always raise onChange before the click. */
  getDataRef,
  // Optional: show the text at a fixed page width (e.g. "17cm" = A4 minus the 2 cm Word
  // margins) so lines wrap exactly as in the MS Word copy. Not set = full width (as before).
  pageWidth,
}) => {
  const [t] = useTranslation();
  console.log("value",value)
  const editorRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [pageCount, setPageCount] = useState(1);

  /* fin_global_resources -> EnableEditorSpellCheck.
     Off, the editor behaves exactly as it does today - no underlining at all.
     A screen can still opt in on its own through the enableSpellCheck prop. */
  const { GetGlobalResources } = useSelector((state) => state?.CommonSlice || {});
  const enableSpellCheck =
    Boolean(enableSpellCheckProp) ||
    (Array.isArray(GetGlobalResources) &&
      GetGlobalResources?.find((item) => item?.Name === "EnableEditorSpellCheck")
        ?.Value === "1");

  /* onInstanceReady sirf ek baar chalta hai, isliye callback ko ref me rakhte hain -
     warna keystroke handler pehle render wale (stale) prop ko hi pakde rehta. */
  const onSaveShortcutRef = useRef(onSaveShortcut);
  onSaveShortcutRef.current = onSaveShortcut;
  const pascalCaseRef = useRef(pascalCase);
  pascalCaseRef.current = pascalCase;

  /* Naya instance banne me CKEditor thoda waqt leta hai. Tab tak parent ka value
     badal chuka ho sakta hai (jaise save ke baad khaali ho jaana), isliye instance
     ready hone par purana closure nahi, ye ref padha jaata hai - warna hataaya hua
     text wapas bind ho jaata hai. */
  const valueRef = useRef(value);
  valueRef.current = value;

  // Unmount/destroy shuru hone ke baad aane wale change events ignore karne ke liye.
  const isDestroyingRef = useRef(false);

  /* fin_global_resources -> EditorBrowserContextMenu.

     Right click now reaches the BROWSER's menu, which is where the spelling corrections
     and "Add to dictionary" are. This build compiles in CKEditor's own context menu,
     which used to take that right click first - so a misspelt word was underlined and
     there was no way to act on it, and the Paste item in that menu could only ever answer
     "Press Ctrl+V to paste", because no browser lets a page read the clipboard from a
     menu.

     Set to '0' to bring CKEditor's own menu back: the right-click table menu (merge
     cells, insert row) and the "Search on Google" item come with it, and Add to dictionary
     moves to Ctrl + right click.

     Read as "not '0'" rather than "is '1'" on purpose. The config is fixed when the
     editor is built - ckeditor4-react keeps it in a ref and never looks at it again - and
     the settings list is fetched once at login. A site whose list does not carry this row
     yet would otherwise sit with the old behaviour until someone signed out and in, with
     nothing on screen to say why. Missing means the new behaviour, which is the one that
     was asked for. */
  const browserContextMenu =
    !Array.isArray(GetGlobalResources) ||
    GetGlobalResources?.find((item) => item?.Name === "EditorBrowserContextMenu")
      ?.Value !== "0";

  // Voice Dictation States
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef(null);

  // Active Ref to prevent stale closures in event listeners
  const isListeningRef = useRef(false);
  const shouldBeListeningRef = useRef(false);

  // Used to ignore change events caused by programmatic setData calls.
  const isProgrammaticChange = useRef(false);
  const prevClearRef = useRef(clear);

  const handleMention = async (content) => {
    // debugger
    const text = content.replace(/<[^>]*>/g, "");
    const match = text.match(/@(\w*)$/);
    if (match) {
      const query = match[1].toLowerCase();
      let apiResp = await CKEditorShortKeyAPIControlsAPI(query);
      if (apiResp?.success) {
        const filtered = apiResp.data.filter((item) =>
          item.ShortKey.toLowerCase().includes(query)
        );
        setSuggestions(filtered);
        setActiveIndex(0)
        setShowDropdown(true);
      }
    } else {
      setShowDropdown(false);
    }
  };
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

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
    const normalizedEditorData = normalizeEditorText(editorData || "");
    const normalizedValueData = normalizeEditorText(valueData || "");
    return normalizedEditorData === normalizedValueData;
  }

  useEffect(() => {
    if (!editorRef.current) return;
    if (clear == null) return;

    if (clear) {
      isProgrammaticChange.current = true;
      try {
        if (editorRef.current && typeof editorRef.current.setData === "function") {
          editorRef.current.setData(EMPTY_EDITOR_CONTENT);
        }
      } catch (e) {
        console.error("Failed to clear editor:", e);
      }
      setValue("");
    }
  }, [clear, setValue]);

  useEffect(() => {
    if (editor?.status !== "ready") return;

    const currentData = editor.getData();
    const normalizedCurrent = normalizeEditorText(currentData || "");
    const normalizedValue = normalizeEditorText(value || "");

    if (normalizedCurrent === normalizedValue) return;

    isProgrammaticChange.current = true;
    const newData = sanitizeContent(value || "");

    setTimeout(() => {
      try {
        editor.setData(newData);
      } catch (e) {
        console.error("CKEditor setData failed:", e);
        editor.setData(EMPTY_EDITOR_CONTENT);
      }
    }, 0);
  }, [value, editor]);

  // Keep editor synchronized with parent `value` when it becomes available.
  useEffect(() => {
    if (editor?.status !== "ready") return;

    const current = editor.getData();
    if (!isEditorDataEqual(current, value)) {
      isProgrammaticChange.current = true;
      editor.setData(sanitizeContent(value));
    }
  }, [editor, value]);

  // NOTE: clear handling is now performed in the single effect above which
  // listens for changes to the `clear` prop. This avoids requiring callers
  // to change their signal type (boolean/number) and prevents duplicate
  // clears on editor ready.

  useEffect(() => {
    // the previous run's cleanup flips this to true when `editor` changes (null -> ready);
    // without resetting it every later onChange was dropped and typed text never reached the parent
    isDestroyingRef.current = false;
    return () => {
      isDestroyingRef.current = true;
      if (editor) {
        editor.destroy(true);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) { }
      }
    };
  }, [editor]);

  // Chrome moves the caret to the next/previous cell in reading order on
  // ArrowUp/ArrowDown inside a table, instead of to the cell above/below.
  // When the caret is on the first/last line of its cell, jump to the same
  // column in the previous/next row ourselves.
  const handleTableArrowKey = (evt) => {
    const ed = evt.editor;
    const keyCode = evt.data.keyCode; // modifiers are added in, so Shift+Arrow won't match
    if (keyCode !== 38 && keyCode !== 40) return;
    const isDown = keyCode === 40;

    const selection = ed.getSelection();
    const range = selection?.getRanges()?.[0];
    if (!range || !range.collapsed) return;
    const cell = selection.getStartElement()?.getAscendant({ td: 1, th: 1 }, true);
    if (!cell) return;

    // Leave multi-line cells to the browser until the caret reaches the edge line.
    try {
      const nativeRange = selection.getNative().getRangeAt(0);
      // Rest of the cell in the direction of travel.
      const rest = ed.document.$.createRange();
      rest.selectNodeContents(cell.$);
      if (isDown) rest.setStart(nativeRange.startContainer, nativeRange.startOffset);
      else rest.setEnd(nativeRange.startContainer, nativeRange.startOffset);
      // A hard line break in between (ignoring the filler <br> at the cell's end).
      const breaks = rest.cloneContents().querySelectorAll("br,p,div,li,table");
      const fillerAtEnd = isDown && cell.$.lastChild?.nodeName === "BR" ? 1 : 0;
      if (breaks.length > fillerAtEnd) return;
      // A soft-wrapped line in between.
      const caretRects = nativeRange.getClientRects();
      const restRects = rest.getClientRects();
      if (caretRects.length && restRects.length) {
        const caret = caretRects[0];
        const edgeRect = isDown ? restRects[restRects.length - 1] : restRects[0];
        if (isDown ? edgeRect.top >= caret.bottom - 2 : edgeRect.bottom <= caret.top + 2) return;
      }
    } catch (e) {
      // Can't measure - fall through and treat it as the edge line.
    }

    const table = cell.getAscendant("table");
    const row = cell.getParent();
    const targetRow = table?.$.rows[row.$.rowIndex + (isDown ? 1 : -1)];
    const newRange = ed.createRange();
    if (targetRow && targetRow.cells.length) {
      const target = new window.CKEDITOR.dom.element(
        targetRow.cells[Math.min(cell.$.cellIndex, targetRow.cells.length - 1)]
      );
      if (isDown) newRange.moveToElementEditStart(target);
      else newRange.moveToElementEditEnd(target);
    } else if (table) {
      // First/last row: step out into the text just above/below the table.
      const { CKEDITOR } = window;
      const notBlank = (n) => !(n.type === CKEDITOR.NODE_TEXT && !n.getText().trim());
      const sibling = isDown ? table.getNext(notBlank) : table.getPrevious(notBlank);
      if (sibling?.type === CKEDITOR.NODE_TEXT) {
        newRange.setStart(sibling, isDown ? 0 : sibling.getLength());
        newRange.collapse(true);
      } else if (sibling?.type === CKEDITOR.NODE_ELEMENT && !sibling.is("br", "table")) {
        if (isDown) newRange.moveToElementEditStart(sibling);
        else newRange.moveToElementEditEnd(sibling);
      } else {
        newRange.moveToPosition(
          table,
          isDown ? CKEDITOR.POSITION_AFTER_END : CKEDITOR.POSITION_BEFORE_START
        );
      }
    } else {
      return;
    }
    selection.selectRanges([newRange]);
    evt.cancel();
  };

  /* Har typed letter ko uski jagah ke hisaab se badal deta hai: word ke shuru me
     capital, warna chhota. Key ko rok kar sudhra hua letter khud daalte hain, isse
     caret apni jagah par hi rehta hai. */
  const attachPascalCase = (ckEditor) => {
    const editable = ckEditor.editable();
    if (!editable) return;
    /* attachListener isliye ki content DOM dobara bane (source mode se wapas aana
       waghairah) to purana listener apne aap hat jaaye. */
    editable.attachListener(ckEditor.document, "keypress", (event) => {
      if (!pascalCaseRef.current) return;
      const domEvent = event.data.$;
      if (domEvent.ctrlKey || domEvent.metaKey || domEvent.altKey) return;

      const key = domEvent.key;
      if (!key || key.length !== 1) return;
      // Sirf case rakhne wale letters - digits, space, punctuation chhod dete hain.
      if (key.toLowerCase() === key.toUpperCase()) return;

      const prevChar = charBeforeCaret(ckEditor.document?.$);
      const wordStart = !prevChar || /[\s\u00a0]/.test(prevChar);
      const fixed = wordStart ? key.toUpperCase() : key.toLowerCase();
      if (fixed === key) return;

      event.data.preventDefault();
      ckEditor.insertText(fixed);
    });
  };

  const onInstanceReady = (evt) => {
    const readyEditor = evt.editor;
    /* Picking another template (e.g. Death Summary) remounts the editor; the old
       instance can still fire "instanceReady" after its iframe is gone, and then
       body.setStyle throws "reading 'isContentEditable'". Ignore that instance. */
    if (readyEditor.status === "destroyed" || !readyEditor.document?.getBody()?.$) return;
    editorRef.current = readyEditor;
    setEditor(readyEditor);
    readyEditor.on("key", handleTableArrowKey);
    if (getDataRef)
      getDataRef.current = () =>
        readyEditor.status === "destroyed" ? undefined : readyEditor.getData();


    /* TEMPORARY - says which build is actually running in the browser.
       Remove once the right-click menu is confirmed working. */
    console.log(
      "[TextEditor] build=2026-10-09-ctxmenu",
      "removePlugins:", readyEditor.config.removePlugins,
      "contextMenu present:", !!readyEditor.contextMenu,
      "browserContextMenu flag:", browserContextMenu,
    );

    /* Let the browser's own right-click menu through.

       removePlugins should already have dropped CKEditor's context menu, but that is
       settled when the editor is built - and if the settings list or the module is a
       moment behind, the menu comes back and with it the Paste item that can only ever
       answer "Press Ctrl+V". This does the same thing from the other side, after the
       editor exists, so it does not depend on the config having been right at build time.

       CKEditor listens for contextmenu on the editable and calls preventDefault() there,
       which is what hides the browser's menu. A listener at a lower priority number runs
       first; stop() ends the chain before CKEditor's runs, so preventDefault never
       happens and the browser shows its own menu - with the spelling suggestions and
       Add to dictionary.

       stop(), not cancel(): cancel() would preventDefault itself and take the browser's
       menu away too.

       Re-attached on contentDom because switching to Source and back builds a new
       editable, and the listener belongs to the editable, not the editor. */
    if (browserContextMenu) {
      const letBrowserMenuThrough = () => {
        const editable = readyEditor.editable();
        if (!editable) return;
        editable.on("contextmenu", (ev) => ev.stop(), null, null, 1);
      };
      letBrowserMenuThrough();
      readyEditor.on("contentDom", letBrowserMenuThrough);
    }
    // MS Word-style Ctrl+click word selection inside the iframe.
    installCtrlWordSelect(readyEditor);
    // contentDom fires whenever the inner document is (re)created (e.g. after
    // setData rebuilds the iframe) — re-attach the listener each time.
    readyEditor.on("contentDom", () => installCtrlWordSelect(readyEditor));

    // setData() rebuilds the editing iframe's document, which drops styles put on <body>
    // once - so re-apply them every time the content document is (re)created.
    const applyBodyStyle = () => {
      /* Also re-run on resize / contentDom: skip an editor that has been torn down (template
         switch remounts it), or setStyle throws "reading 'isContentEditable'". */
      if (readyEditor.status === "destroyed") return;
      const body = readyEditor.document?.getBody();
      if (!body?.$) return;
      try {
        body.setStyle("font-family", "Times New Roman");
        body.setStyle("font-size", "18px");
      } catch (err) {
        console.warn("CKEditor body style skipped:", err);
        return;
      }
      /* spellcheck config se bhi lagta hai, par yahan seedhe bhi set kar dete hain
         taaki uski timing par bharosa na karna pade. lang jaan bujh kar nahi lagate -
         browser ki apni dictionary hi chunne dete hain (dekhein spellCheckLang). */
      if (enableSpellCheck) {
        body.setAttribute("spellcheck", "true");
        if (spellCheckLang) {
          body.setAttribute("lang", spellCheckLang);
          readyEditor.document
            ?.getDocumentElement()
            ?.setAttribute("lang", spellCheckLang);
        }
      }
      if (pageWidth) {
        // Looks like the Word page: grey background, a white A4 sheet with the same 2 cm
        // left/right margins, and a text column of `pageWidth` (17 cm) - so lines wrap at the
        // same words as in the MS Word copy. Zoomed to fill the editor like Word's page view;
        // zoom scales text and width together, so line breaks do not change.
        const margin = "2cm";
        readyEditor.document.getDocumentElement()?.setStyle("background", "#e9ecef");
        body.setStyle("width", pageWidth);
        body.setStyle("box-sizing", "content-box");
        body.setStyle("margin", "12px auto");
        body.setStyle("padding", `1.5cm ${margin}`);
        body.setStyle("background", "#ffffff");
        body.setStyle("box-shadow", "0 1px 4px rgba(0,0,0,0.18)");
        // Same text size as MS Word at 100%: Word ignores the browser's own zoom (Ctrl +/-),
        // so undo it here. Browser zoom ~= outerWidth / innerWidth of the main window
        // (e.g. 80% zoom -> 0.8 -> editor zoom 1.25). 11pt then looks exactly like Word's 11pt.
        const top = window.top || window;
        const browserZoom =
          top.outerWidth && top.innerWidth ? top.outerWidth / top.innerWidth : 1;
        const zoom = Math.max(0.5, Math.min(2, 1 / (browserZoom || 1)));
        const appliedZoom = Math.round(zoom * 20) / 20;
        body.setStyle("zoom", String(appliedZoom));

        // The white sheet opens full: as tall as the editing pane (like Word's blank page), but
        // never taller than one A4 text area, so the page count stays right. Longer text simply
        // grows the sheet. min-height is in the zoomed unit; the 12px margins and the 1.5 cm
        // padding (top and bottom) are subtracted so the sheet ends at the bottom of the pane.
        try {
          const paneHeight = readyEditor.window.getViewPaneSize().height;
          const padding = 2 * 1.5 * 37.7953;
          const wanted = paneHeight / appliedZoom - 24 - padding;
          const onePage = (29.7 - 4) * 37.7953;
          body.setStyle("min-height", `${Math.max(0, Math.min(wanted, onePage))}px`);
        } catch (e) {
          body.setStyle("min-height", "0");
        }
      }
    };
    readyEditor.on("contentDom", () => {
      applyBodyStyle();
      // Editor resized (window / panel / maximize) -> zoom again.
      if (pageWidth) readyEditor.window?.$?.addEventListener("resize", applyBodyStyle);
    });
    readyEditor.on("resize", applyBodyStyle);
    applyBodyStyle();

    // "Pages: N" - how many A4 pages (2 cm margins, as in the Word copy) the report takes.
    // Only for the page view (pageWidth). Body height / usable page height; the zoom does not
    // matter because the computed height is the un-zoomed layout height.
    if (pageWidth) {
      const refreshPages = () => setTimeout(() => updatePageCount(readyEditor), 60);
      readyEditor.on("change", refreshPages);
      readyEditor.on("dataReady", refreshPages);
      readyEditor.on("contentDom", refreshPages);
      readyEditor.on("afterCommandExec", refreshPages);
      refreshPages();
    }
    /* Ctrl+S ko editor ke andar hi pakad lete hain: browser ka save-page dialog band
       ho jaata hai, aur parent ko wahi HTML milta hai jo is waqt editor me hai -
       React state update ka intezaar nahi karna padta. */
    const CKEDITOR = window.CKEDITOR;
    if (CKEDITOR) {
      readyEditor.on("key", (evt) => {
        if (evt.data?.keyCode !== CKEDITOR.CTRL + 83) return;
        if (!onSaveShortcutRef.current) return;
        evt.cancel();
        evt.data.domEvent?.preventDefault?.();
        /* Data seedha callback ko dete hain. Yahan setValue karne ki zaroorat nahi -
           parent ko latest HTML mil hi raha hai, aur save ke turant pehle ek extra
           render karne se clear hone wale value ke saath race ban jaati hai. */
        onSaveShortcutRef.current(readyEditor.getData());
      });
    }

    attachPascalCase(readyEditor);
    // Content DOM dobara banne par listener naye editable par lagana padta hai.
    readyEditor.on("contentDom", () => attachPascalCase(readyEditor));

    readyEditor.setData(sanitizeContent(valueRef.current));
  };

  // A4 = 29.7 cm tall, 2 cm top and bottom margin -> 25.7 cm of text per page (1 cm = 37.795 px).
  const PAGE_TEXT_HEIGHT_PX = (29.7 - 4) * 37.7953;
  const updatePageCount = (ed) => {
    try {
      const body = ed?.document?.getBody()?.$;
      if (!body || !ed.window?.$) return;
      const height = parseFloat(ed.window.$.getComputedStyle(body).height);
      if (!height || Number.isNaN(height)) return;
      setPageCount(Math.max(1, Math.ceil((height - 2) / PAGE_TEXT_HEIGHT_PX)));
    } catch (e) {
      // the count is informational only
    }
  };

  const onChange = (evt) => {
    /* Instance destroy hote waqt bhi CKEditor change de sakta hai. Us waqt parent ka
       value pehle hi clear ho chuka hota hai, aur ye purana content usme wapas likh
       deta - isliye yahan se nikal jaate hain. */
    if (isDestroyingRef.current) return;

    if (isProgrammaticChange.current) {
      // Short key or programmatic update; ignore this event.
      isProgrammaticChange.current = false;
      return;
    }
    setEditTable(false);
    const newContent = evt.editor.getData();
    setValue(newContent);

    handleMention(newContent); //SHort Key functionality
    updateDropdownPosition(); //SHort Key functionality
  };

  // const selectUser = (user) => {

  //   isProgrammaticChange.current = true;
  //   // const editor = editorRef.current;
  //   editor.insertHtml(`${user?.Descriptions}&nbsp;`);
  //   // editor.focus();

  //   // setValue((prev) =>
  //   //   prev?.slice(0, -1) +
  //   //   `<span style="color:#2563EB; font-weight:500;">${user?.Descriptions}</span>&nbsp;&nbsp;`
  //   // );
  //   // setValue((prev) => prev?.slice(0, -1) + `<span style="color:#2563EB; font-weight:500;">${user?.Descriptions}</span>&nbsp;&nbsp;`);
  //   setShowDropdown(false);
  // };

  const selectUser = (user) => {
    //SHort Key functionality
    const editor = editorRef.current;
    isProgrammaticChange.current = true;
    if (!editor) return;

    let data = editor.getData();

    // 🔥 remove last @word
    data = data.replace(/@[\w]*$/, "");

    // insert new value
    const newData = data + `${user?.Descriptions}&nbsp;`;

    editor.setData(newData, {
      callback: function () {
        editor.focus();

        const range = editor.createRange();
        range.moveToElementEditEnd(editor.editable());
        editor.getSelection().selectRanges([range]);
      },
    });

    setShowDropdown(false);
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
      setValue(editorRef.current.getData());
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
          updated = cur.replace(
            /(<\/p>)(?![\s\S]*<\/p>)/,
            ` ${spoken.trim()}$1`,
          );
          if (updated === cur) updated = cur + `<p>${spoken.trim()}</p>`;
        }
        editorRef.current.setData(updated);
        editorRef.current.fire("change");
        setValue(updated);
      } catch (e2) {
        console.error("Fallback speech insert failed:", e2);
      }
    }
  };

  // Speech Recognition Logic
  const startListening = (lang = selectedLanguage) => {
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) {
      alert(
        t("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge."),
      );
      return;
    }
    if (!editorRef.current) {
      alert(t("Editor is not ready yet."));
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
          alert(
            t("Microphone access denied. Please grant microphone permissions in your browser settings."),
          );
          shouldBeListeningRef.current = false;
        }
        setIsListening(false);
        isListeningRef.current = false;
        setInterimText("");
      };

      recognition.onend = () => {
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
      } catch (e) { }
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

  // const handleMention = (content) => {
  //   const plainText = content.replace(/<[^>]+>/g, "");
  //   const match = plainText.match(/@(\w*)$/);
  //   setShowDropdown(!!match);
  // };

  const updateDropdownPosition = () => {
    // placeholder: position logic for mention dropdown can be added here
  };

  const editorConfig = {
    contentsCss: ["/NewCkeditor/ckeditor/contents.css"],
    bodyClass: "editor-content",

    /* The browser's own spell checker, underlining a misspelt word as it is typed and
       offering corrections on right click.

       The editor turns this off by default - disableNativeSpellChecker is true unless it
       is said otherwise - which is why a report typed here has never been checked.

       The browser's, deliberately, not the Scayt button already on the toolbar: Scayt
       sends the text to WebSpellChecker's servers and needs a subscription, so on a
       hospital network with no way out it does nothing. The browser's dictionary is
       already installed, works offline, and never sends a patient's report anywhere.

       It does not know radiology words, so the first few reports will underline terms
       that are perfectly correct. Right click such a word and choose Add to dictionary -
       the browser remembers it for that user from then on.

       Behind EnableEditorSpellCheck so a site that does not want the underlining can turn
       it off without a build. */
    disableNativeSpellChecker: !enableSpellCheck,

    font_defaultLabel: "Times New Roman",
    fontSize_defaultLabel: "18px",

    allowedContent: true,
    extraAllowedContent:
      "span[contenteditable,style]; div[contenteditable,style]; p[contenteditable,style]",

    table_defaultAttributes: {
      style: "width:800px",
    },
    table_defaultStyles: {
      width: "800px",
    },

    extraPlugins:
      "lineheight,menu,menubutton,tableresize,basicstyles,removeformat,image2,embed,autoembed,widget,clipboard,lineutils,dialog,dialogui,scayt,notification,toolbar,resize,justify,colorbutton,find,templates,colordialog,newpage,save,print,preview,pastefromword,pagebreak,font,stylescombo,uploadimage,hxtabletools" +
      (toolbarMode === "word"
        ? ",copyformatting,liststyle,tabletools,tableselection,showblocks,specialchar,smiley,link,wordextras"
        : ""),
    /* contextmenu is dropped together with tabletools and liststyle, whose items hang on
       it. CKEditor guards those calls (if (editor.contextMenu) ...), so leaving them in
       breaks nothing - they go together because that menu was what they were for. */
    removePlugins: browserContextMenu
      ? "forms,contextmenu,tabletools,liststyle"
      : "forms",

    // The toolbar is built immediately after plugins load, so the Line Spacing
    // button has to be registered here rather than in onInstanceReady.
    on: {
      pluginsLoaded: (evt) => {
        registerParagraphSpacing(evt.editor);
        registerGoogleLookup(evt.editor);
      },
    },

  toolbar:
    toolbarMode === "basic"
      ? BASIC_TOOLBAR
      : toolbarMode === "word"
        ? WORD_TOOLBAR
        : FULL_TOOLBAR,


    colorButton_colors:
      "000,800000,8B0000,FF0000,FFA500,FFD700,008000,00FF00,000080,0000FF,800080,FF00FF",
    colorButton_enableMore: true,
    // Word toolbar (Radiology Report): Tab types a tab-sized gap (8 spaces) at the cursor instead of
    // moving the focus out of the editor. Inside a list Tab still indents the item and inside a
    // table it still moves to the next cell - CKEditor handles those first.
    ...(toolbarMode === "word" ? { tabSpaces: 8 } : {}),
    colorButton_backColors:
      "FFFFCC,FFCC99,FF9999,99CCFF,CCFFFF,CCFFCC,FFFF99,CC99FF",
    height: height,
    enterMode: 2,
    line_height: 
      // Chhoti values (0.05 se 0.45) template ko sikodne ke liye - lab/radiology
      // template me lines paas-paas chahiye hoti hain.
      "0.05;0.10;0.15;0.20;0.25;0.30;0.35;0.40;0.45;.5;.75;1;1.15;1.25;1.5;1.75;2;2.5;3",
    // Plugin default me line-height <span> par lagti hai, jo sirf ek paragraph ke
    // andar ki lines par asar karti hai. Do paragraph ke beech ka gap <p> ke margin
    // se aata tha, isliye line height ghatane par bhi kam nahi hota tha. Ab style
    // block (p) par lagti hai aur uska margin bhi hata deti hai.
    lineHeight_style: {
      element: 'p',
      styles: {
        // Chuni hui value seedhe line-height banti hai - 1.2 par thodi jagah,
        // 2 par dugni, 3 par tigni. Paragraph ka apna margin hata dete hain,
        // warna wo line-height ke upar se apna gap jod deta tha aur value badalne
        // par fark saaf nahi dikhta tha.
        'line-height': '#(size)',
        'margin-top': '0',
        'margin-bottom': '0',
      },
      overrides: [{ element: 'line-height', attributes: { size: null } }],
    },

    // Spell checker: browser native (red underlines) + SCAYT auto-start
    disableNativeSpellChecker: false,
    scayt_autoStartup: true,
    scayt_sLang: "en_US",
  };

  return (
    <div style={{ position: "relative", marginBottom: "10px" }}>
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
          <div className="mic-overlay-label">{t("Listening...")}</div>
        </div>
      )}

      {/* Dictation Control Panel */}
      {isMic && (
        <div className="speech-bar-container">
          {/* Language selector — fixed on LEFT */}
          {
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* <label
                htmlFor="voice-lang-select"
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: "500",
                }}
              >
                Language:
              </label> */}
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
                <option value="en-IN">{t("🇮🇳 English (India)")}</option>
                <option value="en-US">{t("🇺🇸 English (US)")}</option>
                <option value="hi-IN">{t("🇮🇳 Hindi")}</option>
                {/* <option value="kn-IN">🇮🇳 Kannada</option>
              <option value="ta-IN">🇮🇳 Tamil</option>
              <option value="te-IN">🇮🇳 Telugu</option>
              <option value="mr-IN">🇮🇳 Marathi</option>
              <option value="bn-IN">🇮🇳 Bengali</option>
              <option value="gu-IN">🇮🇳 Gujarati</option> */}
              </select>
            </div>
          }

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
                {t("Listening...")}
              </span>
            )}
            <button
              type="button"
              onClick={toggleListening}
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
              <i
                className={`fas  ${isListening ? "fa-stop" : "fa-microphone"}`}
              ></i>
              {isListening ? t("Stop") : t("Mic")}
            </button>
          </div>
        </div>
      )}

      {/* Live Interim Result Preview */}
      {/* {isMic && isListening && interimText && (
        <div className="speech-preview-box">
          <i
            className="fas fa-quote-left text-info"
            style={{ fontSize: "11px" }}
          ></i>
          <span>{interimText}</span>
          <i
            className="fas fa-ellipsis-h text-muted"
            style={{ fontSize: "12px" }}
          ></i>
        </div>
      )} */}

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
          config={editorConfig}
        />
      </div>
      {pageWidth && (
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#495057",
            textAlign: "right",
            padding: "2px 8px",
          }}
          title="A4 page, 2 cm margins on every side - the same page the Word copy uses"
        >
          {`Pages: ${pageCount}`}
        </div>
      )}
    </div>
  );
};

export default FullTextEditor;



// import { CKEditor } from "ckeditor4-react";
// import React, { useRef, useState } from "react";
// import { useEffect } from "react";

// const FullTextEditor = ({
//   value,
//   setValue,
//   EditTable,
//   setEditTable,
//   clear,
//   height=250,
//   isMic,
// }) => {
//   console.log("value",value)
//   const editorRef = useRef(null);
//   const [editor, setEditor] = useState(null);

//   // Voice Dictation States
//   const [isListening, setIsListening] = useState(false);
//   const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
//   const [interimText, setInterimText] = useState("");
//   const recognitionRef = useRef(null);

//   // Active Ref to prevent stale closures in event listeners
//   const isListeningRef = useRef(false);
//   const shouldBeListeningRef = useRef(false);

//   // Short key / mention feature refs and state
//   const isProgrammaticChange = useRef(false);
//   const lastEditorData = useRef("");
//   const hasInitialized = useRef(false);


//   const handleMention = async (content) => {
//     // debugger
//     const text = content.replace(/<[^>]*>/g, "");
//     const match = text.match(/@(\w*)$/);
//     if (match) {
//       const query = match[1].toLowerCase();
//       let apiResp = await CKEditorShortKeyAPIControlsAPI(query);
//       if (apiResp?.success) {
//         const filtered = apiResp.data.filter((item) =>
//           item.ShortKey.toLowerCase().includes(query)
//         );
//         setSuggestions(filtered);
//         setActiveIndex(0)
//         setShowDropdown(true);
//       }
//     } else {
//       setShowDropdown(false);
//     }
//   };
//   const [showDropdown, setShowDropdown] = useState(false);

//   useEffect(() => {
//     isListeningRef.current = isListening;
//   }, [isListening]);

//   function sanitizeContent(content) {
//     if (!content || typeof content !== "string") return "";
//     if (!/<(p|div|span)/i.test(content)) {
//       return `<div>${content}</div>`;
//     }
//     return content;
//   }

//   useEffect(() => {
//     if (clear && editorRef.current) {
//       editorRef.current.setData("");
//       setValue("");
//       lastEditorData.current = "";
//       hasInitialized.current = false;
//     }
//   }, [clear, setValue]);

//   useEffect(() => {
//     if (editor?.status === "ready" && EditTable) {
//       setTimeout(() => {
//         try {
//           editor.setData(sanitizeContent(value));
//         } catch (e) {
//           console.error("CKEditor setData failed:", e);
//           editor.setData("");
//         }
//       }, 0);
//     }
//   }, [value, EditTable, editor]);

//   // First-time bind: value may arrive async after editor ready, even when EditTable is false.
//   useEffect(() => {
//     if (editor?.status === "ready" && value && !hasInitialized.current) {
//       const current = editor.getData();
//       if (!current || current.trim() === "") {
//         editor.setData(sanitizeContent(value));
//       }
//       hasInitialized.current = true;
//     }
//   }, [editor, value]);

//   useEffect(() => {
//     if (editor?.status === "ready" && clear) {
//       editor.setData("");
//     }
//   }, [clear, editor]);

//   useEffect(() => {
//     return () => {
//       if (editor) {
//         editor.destroy(true);
//       }
//       if (recognitionRef.current) {
//         try {
//           recognitionRef.current.stop();
//         } catch (e) {}
//       }
//     };
//   }, [editor]);

//   const onInstanceReady = (evt) => {
//     const readyEditor = evt.editor;
//     editorRef.current = readyEditor;
//     setEditor(readyEditor);
//     const body = readyEditor.document?.getBody();
//     if (body) {
//       body.setStyle("font-family", "Times New Roman");
//       body.setStyle("font-size", "18px");
//     }
//     if (value) {
//       readyEditor.setData(sanitizeContent(value));
//     }
//   };

//   const onChange = (evt) => {
//     if (isProgrammaticChange.current) {
//       //SHort Key functionality
//       isProgrammaticChange.current = false;
//       return; // 🔥 skip
//     }
//     setEditTable(false);
//     const newContent = evt.editor.getData();
//     setValue(newContent);

//     handleMention(newContent); //SHort Key functionality
//     updateDropdownPosition(); //SHort Key functionality
//   };

//   // const selectUser = (user) => {

//   //   isProgrammaticChange.current = true;
//   //   // const editor = editorRef.current;
//   //   editor.insertHtml(`${user?.Descriptions}&nbsp;`);
//   //   // editor.focus();

//   //   // setValue((prev) =>
//   //   //   prev?.slice(0, -1) +
//   //   //   `<span style="color:#2563EB; font-weight:500;">${user?.Descriptions}</span>&nbsp;&nbsp;`
//   //   // );
//   //   // setValue((prev) => prev?.slice(0, -1) + `<span style="color:#2563EB; font-weight:500;">${user?.Descriptions}</span>&nbsp;&nbsp;`);
//   //   setShowDropdown(false);
//   // };

//   const selectUser = (user) => {
//     //SHort Key functionality
//     const editor = editorRef.current;
//     isProgrammaticChange.current = true;
//     if (!editor) return;

//     let data = editor.getData();

//     // 🔥 remove last @word
//     data = data.replace(/@[\w]*$/, "");

//     // insert new value
//     const newData = data + `${user?.Descriptions}&nbsp;`;

//     editor.setData(newData, {
//       callback: function () {
//         editor.focus();

//         const range = editor.createRange();
//         range.moveToElementEditEnd(editor.editable());
//         editor.getSelection().selectRanges([range]);
//       },
//     });

//     setShowDropdown(false);
//   };

//   // Append spoken text into the editor reliably at the cursor position
//   const insertSpokenText = (text) => {
//     if (!editorRef.current) return;
//     const spoken = text.trim() + " ";

//     // Primary: Insert exactly at the active cursor position!
//     let inserted = false;
//     try {
//       editorRef.current.focus();
//       editorRef.current.insertText(spoken);
//       editorRef.current.fire("change");
//       setValue(editorRef.current.getData());
//       inserted = true;
//     } catch (err) {
//       console.error("Primary cursor speech insert failed:", err);
//     }

//     // Fallback: rebuild HTML with text appended to last paragraph if selection is lost
//     if (!inserted) {
//       try {
//         const cur = editorRef.current.getData() || "";
//         const hasContent = cur.replace(/<[^>]+>/g, "").trim().length > 0;
//         let updated;
//         if (!hasContent) {
//           updated = `<p>${spoken.trim()}</p>`;
//         } else {
//           // Append inside the very last </p>
//           updated = cur.replace(
//             /(<\/p>)(?![\s\S]*<\/p>)/,
//             ` ${spoken.trim()}$1`,
//           );
//           if (updated === cur) updated = cur + `<p>${spoken.trim()}</p>`;
//         }
//         editorRef.current.setData(updated);
//         editorRef.current.fire("change");
//         setValue(updated);
//       } catch (e2) {
//         console.error("Fallback speech insert failed:", e2);
//       }
//     }
//   };

//   // Speech Recognition Logic
//   const startListening = (lang = selectedLanguage) => {
//     const SpeechRecognition =
//       window.webkitSpeechRecognition || window.SpeechRecognition;
//     if (!SpeechRecognition) {
//       alert(
//         "Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.",
//       );
//       return;
//     }
//     if (!editorRef.current) {
//       alert("Editor is not ready yet.");
//       return;
//     }

//     try {
//       shouldBeListeningRef.current = true;
//       const recognition = new SpeechRecognition();
//       recognition.continuous = true;
//       recognition.interimResults = true;
//       recognition.lang = lang;

//       recognition.onstart = () => {
//         setIsListening(true);
//         isListeningRef.current = true;
//         setInterimText("");
//       };

//       recognition.onerror = (event) => {
//         console.error("Speech recognition error:", event.error);
//         if (event.error === "not-allowed") {
//           alert(
//             "Microphone access denied. Please grant microphone permissions in your browser settings.",
//           );
//           shouldBeListeningRef.current = false;
//         }
//         setIsListening(false);
//         isListeningRef.current = false;
//         setInterimText("");
//       };

//       recognition.onend = () => {
//         setIsListening(false);
//         isListeningRef.current = false;
//         setInterimText("");

//         // Auto-restart if browser stopped it due to silence
//         if (shouldBeListeningRef.current) {
//           try {
//             recognition.start();
//           } catch (e) {
//             console.error("Failed to auto-restart recognition:", e);
//           }
//         }
//       };

//       recognition.onresult = (event) => {
//         let finalTranscript = "";
//         let currentInterim = "";

//         for (let i = event.resultIndex; i < event.results.length; ++i) {
//           if (event.results[i].isFinal) {
//             finalTranscript += event.results[i][0].transcript;
//           } else {
//             currentInterim += event.results[i][0].transcript;
//           }
//         }

//         if (finalTranscript) {
//           insertSpokenText(finalTranscript);
//         }
//         setInterimText(currentInterim);
//       };

//       recognitionRef.current = recognition;
//       recognition.start();
//     } catch (err) {
//       console.error("Failed to initialize speech recognition:", err);
//       setIsListening(false);
//       isListeningRef.current = false;
//       shouldBeListeningRef.current = false;
//       setInterimText("");
//     }
//   };

//   const stopListening = () => {
//     shouldBeListeningRef.current = false;
//     if (recognitionRef.current) {
//       try {
//         recognitionRef.current.stop();
//       } catch (e) {}
//     }
//     setIsListening(false);
//     isListeningRef.current = false;
//     setInterimText("");
//   };

//   const toggleListening = () => {
//     if (isListeningRef.current) {
//       stopListening();
//     } else {
//       startListening();
//     }
//   };

//   const handleLanguageChange = (e) => {
//     const newLang = e.target.value;
//     setSelectedLanguage(newLang);
//     if (isListening) {
//       stopListening();
//       setTimeout(() => startListening(newLang), 400);
//     }
//   };

//   // const handleMention = (content) => {
//   //   const plainText = content.replace(/<[^>]+>/g, "");
//   //   const match = plainText.match(/@(\w*)$/);
//   //   setShowDropdown(!!match);
//   // };

//   const updateDropdownPosition = () => {
//     // placeholder: position logic for mention dropdown can be added here
//   };

//   const editorConfig = {
//     contentsCss: ["/NewCkeditor/ckeditor/contents.css"],
//     bodyClass: "editor-content",

//     font_defaultLabel: "Times New Roman",
//     fontSize_defaultLabel: "18px",

//     allowedContent: true,
//     extraAllowedContent:
//       "span[contenteditable,style]; div[contenteditable,style]; p[contenteditable,style]",

//     table_defaultAttributes: {
//       style: "width:800px",
//     },
//     table_defaultStyles: {
//       width: "800px",
//     },

//     extraPlugins:
//       "lineheight,tableresize,basicstyles,image2,embed,autoembed,widget,clipboard,lineutils,dialog,dialogui,scayt,notification,toolbar,resize,justify,colorbutton,find,templates,colordialog,newpage,save,print,preview,pastefromword,pagebreak,font,stylescombo,uploadimage",
//     removePlugins: "forms",

//   toolbar: [
//   {
//     name: "document",
//     items: ["Source", "Save", "NewPage", "Preview", "Print", "Templates"],
//   },
//   {
//     name: "clipboard",
//     items: [
//       "Cut",
//       "Copy",
//       "Paste",
//       "PasteText",
//       "PasteFromWord",
//       "Undo",
//       "Redo",
//     ],
//   },
//   { name: "editing", items: ["Find", "Replace", "SelectAll", "Scayt"] },
//   {
//     name: "basicstyles",
//     items: ["Bold", "Italic", "Underline", "Subscript", "Superscript"],
//   },
//   { name: "links", items: ["Link", "Unlink", "Anchor"] },
//   { name: "colors", items: ["TextColor", "BGColor"] },
//   "/", // ✅ First Row End

//   {
//     name: "paragraph",
//     items: [
//       "NumberedList",
//       "BulletedList",
//       "Outdent",
//       "Indent",
//       "Blockquote",
//       "CreateDiv",
//       "JustifyLeft",
//       "JustifyCenter",
//       "JustifyRight",
//       "JustifyBlock",
//       "BidiLtr",
//       "BidiRtl",
//       "Language",
//       "lineheight",
//     ],
//   },

//   {
//     name: "insert",
//     items: [
//       "Image",
//       "Table",
//       "HorizontalRule",
//       "Smiley",
//       "SpecialChar",
//       "PageBreak",
//       "Iframe",
//       "Embed",
//     ],
//   },

//   { name: "styles", items: ["Styles", "Format", "Font", "FontSize"] },
//   { name: "tools", items: ["Maximize", "ShowBlocks"] },
//   { name: "others", items: ["-"] },
// ],

//     colorButton_colors:
//       "000,800000,8B0000,FF0000,FFA500,FFD700,008000,00FF00,000080,0000FF,800080,FF00FF",
//     colorButton_enableMore: true,
//     colorButton_backColors:
//       "FFFFCC,FFCC99,FF9999,99CCFF,CCFFFF,CCFFCC,FFFF99,CC99FF",
//     height: height,
//     enterMode: 2,
//     line_height: ".5;.75;1;1.15;1.25;1.5;1.75;2;2.5;3",
//   };

//   return (
//     <div style={{ position: "relative", marginBottom: "10px" }}>
//       {isMic && (
//         <style>
//           {`
//             @keyframes micPulse {
//               0% {
//                 box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4);
//               }
//               70% {
//                 box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
//               }
//               100% {
//                 box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
//               }
//             }
//             @keyframes micRipple {
//               0% { transform: scale(1); opacity: 0.7; }
//               100% { transform: scale(2.2); opacity: 0; }
//             }
//             .mic-pulse-button {
//               animation: micPulse 1.5s infinite;
//               background-color: #dc3545 !important;
//               border-color: #dc3545 !important;
//               color: #fff !important;
//             }
//             .speech-bar-container {
//               display: flex;
//               align-items: center;
//               justify-content: space-between;
//               background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
//               padding: 8px 15px;
//               border-radius: 6px 6px 0 0;
//               border: 1px solid #ced4da;
//               border-bottom: none;
//               gap: 12px;
//               flex-wrap: wrap;
//             }
//             .speech-preview-box {
//               background-color: #fff;
//               padding: 6px 12px;
//               margin-bottom: 8px;
//               border-radius: 4px;
//               font-size: 14px;
//               color: #6c757d;
//               font-style: italic;
//               display: flex;
//               align-items: center;
//               gap: 8px;
//               border: 1px solid #e9ecef;
//               border-left: 3px solid #17a2b8;
//             }
//             .mic-overlay {
//               position: fixed;
//               inset: 0;
//               z-index: 9999;
//               display: flex;
//               flex-direction: column;
//               align-items: center;
//               justify-content: center;
//               background: rgba(0,0,0,0.18);
//               pointer-events: none;
//             }
//             .mic-overlay-btn {
//               position: relative;
//               width: 72px;
//               height: 72px;
//               border-radius: 50%;
//               background: #79a18eff;
//               display: flex;
//               align-items: center;
//               justify-content: center;
//               box-shadow: 0 4px 24px rgba(40,167,69,0.35);
//             }
//             .mic-overlay-btn i {
//               font-size: 30px;
//               color: #fff;
//             }
//             .mic-overlay-ripple {
//               position: absolute;
//               width: 72px;
//               height: 72px;
//               border-radius: 50%;
//               background: rgba(91,192,222,0.45);
//               animation: micRipple 1.4s ease-out infinite;
//             }
//             .mic-overlay-ripple:nth-child(2) {
//               animation-delay: 0.5s;
//             }
//             .mic-overlay-label {
//               margin-top: 18px;
//               font-size: 15px;
//               font-weight: 600;
//               color: #fff;
//               letter-spacing: 0.5px;
//               text-shadow: 0 1px 4px rgba(0,0,0,0.4);
//             }
//           `}
//         </style>
//       )}

//       {/* Centered mic loader overlay while listening */}
//       {isMic && isListening && (
//         <div className="mic-overlay">
//           <div
//             style={{
//               position: "relative",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <div className="mic-overlay-ripple" />
//             <div className="mic-overlay-ripple" />
//             <div className="mic-overlay-btn">
//               <i className="fas fa-microphone" />
//             </div>
//           </div>
//           <div className="mic-overlay-label">Listening...</div>
//         </div>
//       )}

//       {/* Dictation Control Panel */}
//       {isMic && (
//         <div className="speech-bar-container">
//           {/* Language selector — fixed on LEFT */}
//           {
//             <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//               {/* <label
//                 htmlFor="voice-lang-select"
//                 style={{
//                   margin: 0,
//                   fontSize: "13px",
//                   fontWeight: "500",
//                 }}
//               >
//                 Language:
//               </label> */}
//               <select
//                 id="voice-lang-select"
//                 value={selectedLanguage}
//                 onChange={handleLanguageChange}
//                 className="form-control form-control-sm"
//                 style={{
//                   width: "160px",
//                   height: "30px",
//                   padding: "2px 8px",
//                   fontSize: "13px",
//                   borderRadius: "4px",
//                   border: "1px solid #ced4da",
//                 }}
//               >
//                 <option value="en-IN">🇮🇳 English (India)</option>
//                 <option value="en-US">🇺🇸 English (US)</option>
//                 <option value="hi-IN">🇮🇳 Hindi</option>
//                 {/* <option value="kn-IN">🇮🇳 Kannada</option>
//               <option value="ta-IN">🇮🇳 Tamil</option>
//               <option value="te-IN">🇮🇳 Telugu</option>
//               <option value="mr-IN">🇮🇳 Marathi</option>
//               <option value="bn-IN">🇮🇳 Bengali</option>
//               <option value="gu-IN">🇮🇳 Gujarati</option> */}
//               </select>
//             </div>
//           }

//           {/* Mic button — on RIGHT */}
//           <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//             {isListening && (
//               <span
//                 style={{
//                   fontSize: "13px",
//                   fontWeight: "600",
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "4px",
//                 }}
//               >
//                 <span
//                   className="spinner-grow spinner-grow-sm text-danger"
//                   role="status"
//                   style={{ width: "10px", height: "10px" }}
//                 ></span>
//                 Listening...
//               </span>
//             )}
//             <button
//               type="button"
//               onClick={toggleListening}
//               className={`btn btn-sm text-white ${isListening ? "mic-pulse-button" : "btn-outline-secondary"}`}
//               title={isListening ? "Stop Dictation" : "Start Voice Dictation"}
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "6px",
//                 fontWeight: "600",
//                 borderRadius: "4px",
//                 padding: "6px 14px",
//                 transition: "all 0.3s ease",
//               }}
//             >
//               <i
//                 className={`fas  ${isListening ? "fa-stop" : "fa-microphone"}`}
//               ></i>
//               {isListening ? "Stop" : "Mic"}
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Live Interim Result Preview */}
//       {/* {isMic && isListening && interimText && (
//         <div className="speech-preview-box">
//           <i
//             className="fas fa-quote-left text-info"
//             style={{ fontSize: "11px" }}
//           ></i>
//           <span>{interimText}</span>
//           <i
//             className="fas fa-ellipsis-h text-muted"
//             style={{ fontSize: "12px" }}
//           ></i>
//         </div>
//       )} */}

//       {/* CKEditor Container */}
//       <div
//         style={
//           isMic
//             ? {
//                 border: "1px solid #ced4da",
//                 borderTop: "none",
//                 borderRadius: "0 0 6px 6px",
//                 overflow: "hidden",
//               }
//             : {}
//         }
//       >
//         <CKEditor
//           initData={value ? value : ""}
//           onChange={onChange}
//           onInstanceReady={onInstanceReady}
//           config={editorConfig}
//         />
//       </div>
//     </div>
//   );
// };

// export default FullTextEditor;
