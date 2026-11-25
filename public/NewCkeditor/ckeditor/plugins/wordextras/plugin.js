/**
 * wordextras - Word "Paragraph" group tools that CKEditor 4 has no ready button for.
 *   BulletStyle / NumberStyle : the list type dialog (disc, circle, square, 1 2 3, a b c, i ii iii ...)
 *                               for the list the cursor is in (commands come from the liststyle plugin).
 *   SortList                  : Word's "Sort" - sorts the list items (or the selected paragraphs) A-Z,
 *                               and Z-A when they already are A-Z.
 * Multilevel list = Indent / Outdent (Tab / Shift+Tab) inside a list item.
 */
CKEDITOR.plugins.add("wordextras", {
  init: function (editor) {
    var sortIcon =
      "data:image/svg+xml;charset=utf8," +
      encodeURIComponent(
        "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'>" +
          "<text x='0' y='7' font-size='7' font-family='Arial' font-weight='bold'>A</text>" +
          "<text x='0' y='15' font-size='7' font-family='Arial' font-weight='bold'>Z</text>" +
          "<path d='M11 1v12M8 10l3 4 3-4' stroke='black' fill='none'/></svg>"
      );

    editor.addCommand("sortSelection", {
      exec: function (ed) {
        var selection = ed.getSelection();
        var start = selection && selection.getStartElement();
        if (!start) return;

        var nodes = [];
        var list = start.getAscendant({ ul: 1, ol: 1 }, true);
        if (list) {
          nodes = list.getChildren().toArray().filter(function (n) {
            return n.type === CKEDITOR.NODE_ELEMENT && n.is("li");
          });
        } else {
          selection.getRanges().forEach(function (range) {
            var iterator = range.createIterator();
            iterator.enforceRealBlocks = true;
            var block;
            while ((block = iterator.getNextParagraph())) nodes.push(block);
          });
        }
        if (nodes.length < 2) return;

        var parent = nodes[0].getParent();
        var sameParent = nodes.every(function (n) {
          return n.getParent() && n.getParent().equals(parent);
        });
        if (!sameParent) return;

        var key = function (n) {
          return n.getText().trim().toLowerCase();
        };
        var asc = nodes.slice().sort(function (a, b) {
          return key(a).localeCompare(key(b));
        });
        var alreadyAsc = asc.every(function (n, i) {
          return n.equals(nodes[i]);
        });
        var sorted = alreadyAsc ? asc.slice().reverse() : asc;

        ed.fire("saveSnapshot");
        var anchor = ed.document.createElement("span");
        anchor.insertBefore(nodes[0]);
        sorted.forEach(function (n) {
          n.insertBefore(anchor);
        });
        anchor.remove();
        ed.fire("saveSnapshot");
      },
    });

    // ---- Bullet library / Numbering library: Word-style gallery panels ---------------------------
    // Recently Used + library grid + Change List Level + Define New Bullet. Picks the style for the list
    // the cursor is in (a list is created first when the cursor is outside one). The standard types
    // (disc, circle, square, numbers, letters, roman) are plain list-style-type values that the Word copy
    // keeps; the symbol bullets use a CSS string marker, so the Word copy may show a normal bullet.
    var BULLETS = [
      ["none", "none", "", "None"],
      ["disc", "disc", "\u25CF", "Filled round"],
      ["circle", "circle", "\u25CB", "Hollow round"],
      ["square", "square", "\u25A0", "Square"],
      ['"\u2756  "', "b-4", "\u2756", "Diamond cross"],
      ['"\u27A2  "', "b-5", "\u27A2", "Arrow"],
      ['"\u2713  "', "b-6", "\u2713", "Check mark"],
      ['"\u2714  "', "b-7", "\u2714", "Heavy check mark"],
      ['"\u25C6  "', "b-8", "\u25C6", "Diamond"],
      ['"\u2726  "', "b-9", "\u2726", "Star"],
      ['"\u2605  "', "b-10", "\u2605", "Black star"],
      ['"\u2794  "', "b-11", "\u2794", "Right arrow"],
      ['"\u25BA  "', "b-12", "\u25BA", "Pointer"],
      ['"\u2013  "', "b-13", "\u2013", "Dash"],
      ['"\u2022  "', "b-14", "\u2022", "Small bullet"],
      ['"\u2192  "', "b-15", "\u2192", "Arrow right"],
    ];
    var NUMBERS = [
      ["none", "none", "", "None"],
      ["decimal", "decimal", "1.", "1, 2, 3"],
      ["decimal-leading-zero", "zero", "01", "01, 02, 03"],
      ["lower-alpha", "lower-alpha", "a.", "a, b, c"],
      ["upper-alpha", "upper-alpha", "A.", "A, B, C"],
      ["lower-roman", "lower-roman", "i.", "i, ii, iii"],
      ["upper-roman", "upper-roman", "I.", "I, II, III"],
      ["lower-greek", "lower-greek", "\u03B1.", "\u03B1, \u03B2, \u03B3"],
    ];

    var RECENT_KEY = "wordextrasRecent";
    var readRecent = function (kind) {
      try {
        var all = JSON.parse(window.localStorage.getItem(RECENT_KEY) || "{}");
        return all[kind] || [];
      } catch (e) {
        return [];
      }
    };
    var pushRecent = function (kind, option) {
      try {
        var all = JSON.parse(window.localStorage.getItem(RECENT_KEY) || "{}");
        var list = (all[kind] || []).filter(function (o) {
          return o[0] !== option[0];
        });
        list.unshift(option);
        all[kind] = list.slice(0, 6);
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(all));
      } catch (e) {
        /* recent list is optional */
      }
    };

    var applyListStyle = function (ed, listTag, cssValue) {
      ed.focus();
      ed.fire("saveSnapshot");
      var findList = function () {
        var sel = ed.getSelection();
        var el = sel && sel.getStartElement();
        return el ? el.getAscendant({ ul: 1, ol: 1 }, true) : null;
      };
      var list = findList();
      // not in a list, or in the other kind of list: let CKEditor make / convert it first
      if (!list || !list.is(listTag)) {
        ed.execCommand(listTag === "ul" ? "bulletedlist" : "numberedlist");
        list = findList();
        // the command toggles an existing list off; run it again to get the list back
        if (!list) {
          ed.execCommand(listTag === "ul" ? "bulletedlist" : "numberedlist");
          list = findList();
        }
      }
      if (list) list.setStyle("list-style-type", cssValue);
      ed.fire("saveSnapshot");
    };

    var cellStyle =
      "display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;font-size:20px;" +
      "border:1px solid #c8c8c8;margin:2px;color:#000;text-decoration:none;cursor:pointer;" +
      "background:#fff;font-family:Arial,sans-serif;vertical-align:top";
    var titleStyle = "font:bold 12px Arial,sans-serif;color:#444;padding:6px 6px 2px;background:#f3f3f3";
    var rowStyle = "display:block;padding:6px 8px;font:13px Arial,sans-serif;color:#000;text-decoration:none;cursor:pointer";

    var addGallery = function (name, label, listTag, options, order, kind) {
      var build = function () {
        var html = '<div style="width:300px;padding:2px">';
        var recent = readRecent(kind);
        if (recent.length) {
          html += '<div style="' + titleStyle + '">Recently Used</div><div>';
          recent.forEach(function (o, i) {
            html +=
              '<a href="javascript:void(0)" data-act="recent" data-i="' + i + '" title="' + o[3] +
              '" style="' + cellStyle + '">' + (o[2] || "\u2013") + "</a>";
          });
          html += "</div>";
        }
        html += '<div style="' + titleStyle + '">' + label + " Library</div><div>";
        options.forEach(function (o, i) {
          html +=
            '<a href="javascript:void(0)" data-act="opt" data-i="' + i + '" title="' + o[3] +
            '" style="' + cellStyle + '">' + (o[2] || '<span style="font-size:11px">None</span>') + "</a>";
        });
        html += "</div>";
        html += '<div style="' + titleStyle + '">List</div>';
        html += '<a href="javascript:void(0)" data-act="indent" style="' + rowStyle + '">Increase list level (Indent)</a>';
        html += '<a href="javascript:void(0)" data-act="outdent" style="' + rowStyle + '">Decrease list level (Outdent)</a>';
        if (listTag === "ul") {
          html += '<a href="javascript:void(0)" data-act="define" style="' + rowStyle + '">Define new bullet...</a>';
        }
        html += "</div>";
        return html;
      };

      editor.ui.add(name, CKEDITOR.UI_PANELBUTTON, {
        label: label + " library",
        title: label + " library",
        toolbar: "paragraph," + order,
        icon: listTag === "ul" ? "bulletedlist" : "numberedlist",
        modes: { wysiwyg: 1 },
        editorFocus: 0,
        allowedContent: "ul ol{list-style-type}",
        panel: {
          css: [CKEDITOR.skin.getPath("editor")],
          attributes: { role: "listbox", "aria-label": label + " library" },
        },
        // CKEditor's panel button hands over the block it already created (no panel.addBlock here).
        onBlock: function (panel, block) {
          block.autoSize = true;
          block.element.setHtml(build());
          block.element.on("click", function (evt) {
            var target = evt.data.getTarget();
            var link = target.getAscendant("a", true);
            if (!link) return;
            evt.data.preventDefault();
            var act = link.getAttribute("data-act");
            var i = parseInt(link.getAttribute("data-i"), 10);
            panel.hide();

            if (act === "indent" || act === "outdent") {
              editor.focus();
              editor.execCommand(act);
              return;
            }
            var chosen = null;
            if (act === "opt") chosen = options[i];
            else if (act === "recent") chosen = readRecent(kind)[i];
            else if (act === "define") {
              var ch = window.prompt("Type the bullet character (for example \u2192 \u2605 \u2756):", "\u2192");
              if (ch && ch.trim()) {
                var c = ch.trim().slice(0, 2);
                chosen = ['"' + c.replace(/"/g, "") + '  "', "u-" + c, c, "Custom bullet " + c];
              }
            }
            if (!chosen) return;
            applyListStyle(editor, listTag, chosen[0]);
            pushRecent(kind, chosen);
            block.element.setHtml(build());
          });
        },
      });
    };
    addGallery("BulletLibrary", "Bullet", "ul", BULLETS, 86, "bullets");
    addGallery("NumberLibrary", "Numbering", "ol", NUMBERS, 87, "numbers");

    // ---- All capitals: Ctrl+Shift+A (Word's shortcut) / AllCaps button --------------------------
    // Turns the selected text into capital letters. The characters themselves are changed (not a
    // display style), keeping bold / italic / colours; with nothing selected the word at the cursor
    // is changed.
    editor.addCommand("allCapsSelection", {
      // do not re-focus the editor first: that can reset the selection to the start
      editorFocus: false,
      exec: function (ed) {
        var win = ed.document.getWindow().$;
        var doc = ed.document.$;
        var native = win.getSelection && win.getSelection();
        if (!native || native.rangeCount === 0) return;
        var range = native.getRangeAt(0);

        var sc = range.startContainer, so = range.startOffset;
        var ec = range.endContainer, eo = range.endOffset;
        var changed = false;
        ed.fire("saveSnapshot");

        var upperPart = function (node, from, to) {
          var text = node.nodeValue;
          if (to <= from) return;
          var up = text.slice(0, from) + text.slice(from, to).toUpperCase() + text.slice(to);
          if (up !== text) {
            node.nodeValue = up;
            changed = true;
          }
        };

        if (range.collapsed) {
          // nothing selected: the word around the cursor
          if (sc.nodeType === 3) {
            var text = sc.nodeValue;
            var s = so, e = so;
            while (s > 0 && /\S/.test(text.charAt(s - 1))) s--;
            while (e < text.length && /\S/.test(text.charAt(e))) e++;
            upperPart(sc, s, e);
          }
        } else {
          var walker = doc.createTreeWalker(range.commonAncestorContainer.nodeType === 3 ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer, NodeFilter.SHOW_TEXT, null);
          var nodes = [];
          // a text node as the common ancestor is walked through its parent
          var n;
          while ((n = walker.nextNode())) {
            if (range.intersectsNode(n)) nodes.push(n);
          }
          nodes.forEach(function (node) {
            var from = node === sc ? so : 0;
            var to = node === ec ? eo : node.nodeValue.length;
            upperPart(node, from, to);
          });
        }

        // changing a text node's data moves the selection; put it back as it was
        try {
          var restore = doc.createRange();
          restore.setStart(sc, Math.min(so, sc.nodeType === 3 ? sc.nodeValue.length : sc.childNodes.length));
          restore.setEnd(ec, Math.min(eo, ec.nodeType === 3 ? ec.nodeValue.length : ec.childNodes.length));
          native.removeAllRanges();
          native.addRange(restore);
        } catch (err) {
          /* selection is cosmetic */
        }

        if (changed) {
          ed.fire("saveSnapshot");
          ed.fire("change");
        }
      },
    });    editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.SHIFT + 65, "allCapsSelection"); // Ctrl+Shift+A
    editor.ui.addButton("AllCaps", {
      label: "ALL CAPITALS (Ctrl+Shift+A)",
      command: "allCapsSelection",
      toolbar: "basicstyles,95",
      icon:
        "data:image/svg+xml;charset=utf8," +
        encodeURIComponent(
          "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'>" +
            "<text x='0' y='13' font-size='13' font-family='Arial' font-weight='bold'>AA</text></svg>"
        ),
    });

    // ---- Tab inside a table cell ---------------------------------------------------------------
    // config.tabSpaces types spaces for every Tab, which also stopped Tab from moving to the next
    // cell of a table. This handler runs first: in a table cell Tab / Shift+Tab move between cells
    // (like Word), anywhere else the spaces are typed as set in tabSpaces.
    editor.on(
      "key",
      function (evt) {
        var code = evt.data.keyCode;
        if (code !== 9 && code !== CKEDITOR.SHIFT + 9) return;
        var sel = editor.getSelection();
        var el = sel && sel.getStartElement();
        var cell = el && el.getAscendant({ td: 1, th: 1 }, true);
        if (!cell) return;
        if (editor.execCommand(code === 9 ? "selectNextCell" : "selectPreviousCell")) {
          evt.cancel();
        }
      },
      null,
      null,
      1
    );

    // ---- Bigger / smaller text: Ctrl+Shift+> and Ctrl+Shift+< (Word's shortcuts) -------------
    // Steps the selected text through Word's size list (8 9 10 11 12 14 16 18 20 22 24 26 28 36 48 72,
    // in px here) from the size it has now. With nothing selected the size for the next typing changes.
    var SIZE_STEPS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
    var nextSize = function (current, grow) {
      var i;
      if (grow) {
        for (i = 0; i < SIZE_STEPS.length; i++) if (SIZE_STEPS[i] > current) return SIZE_STEPS[i];
        return SIZE_STEPS[SIZE_STEPS.length - 1];
      }
      for (i = SIZE_STEPS.length - 1; i >= 0; i--) if (SIZE_STEPS[i] < current) return SIZE_STEPS[i];
      return SIZE_STEPS[0];
    };
    // exposed so it can be tested without a browser
    CKEDITOR.wordExtrasNextSize = nextSize;

    var changeFontSize = function (ed, grow) {
      var selection = ed.getSelection();
      var el = selection && selection.getStartElement();
      if (!el) return;
      var current = parseFloat(ed.document.getWindow().$.getComputedStyle(el.$).fontSize) || 18;
      var size = nextSize(Math.round(current), grow);
      var style = new CKEDITOR.style({
        element: "span",
        styles: { "font-size": size + "px" },
        overrides: [{ element: "font", attributes: { size: null } }],
      });
      ed.fire("saveSnapshot");
      ed.applyStyle(style);
      ed.fire("saveSnapshot");
    };
    editor.addCommand("fontSizeUp", {
      exec: function (ed) {
        changeFontSize(ed, true);
      },
    });
    editor.addCommand("fontSizeDown", {
      exec: function (ed) {
        changeFontSize(ed, false);
      },
    });
    // Ctrl+Shift+> (the "." key) and Ctrl+Shift+< (the "," key)
    editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.SHIFT + 190, "fontSizeUp");
    editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.SHIFT + 188, "fontSizeDown");

    editor.ui.addButton("SortList", {
      label: "Sort A-Z / Z-A",
      command: "sortSelection",
      toolbar: "paragraph,90",
      icon: sortIcon,
    });
    // liststyle owns these two commands; they open the list-type dialog.
    editor.ui.addButton("BulletStyle", {
      label: "Bullet style",
      command: "bulletedListStyle",
      toolbar: "paragraph,91",
      icon: "bulletedlist",
    });
    editor.ui.addButton("NumberStyle", {
      label: "Numbering style",
      command: "numberedListStyle",
      toolbar: "paragraph,92",
      icon: "numberedlist",
    });
  },
});
