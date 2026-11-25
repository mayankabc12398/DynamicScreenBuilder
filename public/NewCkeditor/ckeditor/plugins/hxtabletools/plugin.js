/**
 * hxtabletools - pick a table's size off a grid instead of filling in a dialog.
 *
 * The stock Table button opens a dialog and asks for rows, columns, width, border,
 * alignment, caption and a summary before it will make anything. Reporting wants a two by
 * three table and wants it now, the way Word and Docs give it: drop a grid open, sweep
 * across it, let go.
 *
 * Why the panel is built by hand rather than with the editor's own panel button: this
 * build ships only addButton and addRichCombo - there is no addPanelButton or
 * addMenuButton in it - and a rich combo renders a list of choices, not a grid you sweep
 * across. So the button is an ordinary one and the grid is a plain element placed under
 * it. That also keeps every part of the interaction here, where it can be read.
 *
 * Both ways of choosing work, because people reach for one or the other without thinking:
 *   - move across the grid and click, or
 *   - press, drag, and release.
 *
 * Everything after the table exists - adding a row, removing a column - is already in this
 * build's tabletools, on the right click menu inside a table. This does not duplicate it.
 */
(function () {
  "use strict";

  var ROWS = 10; // how far the grid goes before it stops offering more
  var COLS = 10;
  var CELL = 18; // px, each square
  var GAP = 2;

  /* The icon is a file in this plugin's own icons folder, registered below, and NOT a
     data: URI.

     A data: URI looks tidier and needs no file, but the editor puts every icon URL through
     getUrl, which appends a cache-busting ?t=... to anything with no query string of its
     own. On a real path that is harmless. On a data: URI it lands inside the base64 and
     the browser cannot decode it, so the button renders as an empty grey square - which is
     exactly what it did. */
  var ICON_FILE = "icons/hxtable.svg";

  /* `plugin.path` is where the editor actually found this file, so the icon is located the
     same way whatever base path the page is served from. */
  function registerIcon(plugin) {
    if (CKEDITOR.skin && CKEDITOR.skin.addIcon && plugin && plugin.path) {
      CKEDITOR.skin.addIcon("hxtable", plugin.path + ICON_FILE);
      CKEDITOR.skin.addIcon("hxrowdel", plugin.path + "icons/hxrowdel.svg");
      CKEDITOR.skin.addIcon("hxcoldel", plugin.path + "icons/hxcoldel.svg");
      CKEDITOR.skin.addIcon("hxtabledel", plugin.path + "icons/hxtabledel.svg");
      CKEDITOR.skin.addIcon("hxrowabove", plugin.path + "icons/hxrowabove.svg");
      CKEDITOR.skin.addIcon("hxrowbelow", plugin.path + "icons/hxrowbelow.svg");
      CKEDITOR.skin.addIcon("hxcolleft", plugin.path + "icons/hxcolleft.svg");
      CKEDITOR.skin.addIcon("hxcolright", plugin.path + "icons/hxcolright.svg");
    }
  }

  /** The table itself, matching what the Table dialog produces on this site. */
  function tableHtml(rows, cols) {
    var html =
      '<table border="1" cellpadding="4" cellspacing="0" ' +
      'style="width:800px;border-collapse:collapse"><tbody>';
    for (var r = 0; r < rows; r++) {
      html += "<tr>";
      for (var c = 0; c < cols; c++) {
        html += '<td style="border:1px solid #000;">&nbsp;</td>';
      }
      html += "</tr>";
    }
    return html + "</tbody></table><p>&nbsp;</p>";
  }

  CKEDITOR.plugins.add("hxtabletools", {
    onLoad: function () {
      registerIcon(this);
    },

    init: function (editor) {
      /* Again here, because onLoad can run before the skin object exists - the plugin file
         and the skin are fetched independently. addIcon only takes the first registration,
         so saying it twice costs nothing and leaves no window where the button has no
         icon. */
      registerIcon(this);

      var panel = null; // the grid, while it is open
      var cells = []; // the squares, row major
      var chosen = { rows: 0, cols: 0 };
      var dragging = false;

      function close() {
        if (!panel) return;
        if (panel.parentNode) panel.parentNode.removeChild(panel);
        panel = null;
        cells = [];
        dragging = false;
        document.removeEventListener("mousedown", onDocumentDown, true);
        document.removeEventListener("keydown", onKey, true);
        document.removeEventListener("mouseup", onDocumentUp, true);
      }

      function onDocumentDown(ev) {
        if (panel && !panel.contains(ev.target)) close();
      }

      function onKey(ev) {
        if (ev.key === "Escape") close();
      }

      /* Letting go anywhere outside the grid ends the drag without making a table. A
         sweep that overshoots the edge should not drop a table the size of the corner it
         happened to leave by. */
      function onDocumentUp(ev) {
        if (!dragging) return;
        dragging = false;
        if (panel && !panel.contains(ev.target)) paint(0, 0);
      }

      /* Light up everything from the top left corner to where the pointer is, and say so
         in words underneath - "3 x 4" is quicker to check than counting squares. */
      function paint(rows, cols) {
        chosen.rows = rows;
        chosen.cols = cols;
        for (var i = 0; i < cells.length; i++) {
          var cell = cells[i];
          var lit = cell.hxRow <= rows && cell.hxCol <= cols;
          cell.style.background = lit ? "#1a73e8" : "#fff";
          cell.style.borderColor = lit ? "#1a73e8" : "#c7c7c7";
        }
        if (panel && panel.hxLabel) {
          panel.hxLabel.textContent = rows && cols ? rows + " x " + cols : "Table";
        }
      }

      function insert() {
        if (!chosen.rows || !chosen.cols) return;
        var rows = chosen.rows;
        var cols = chosen.cols;
        close();
        editor.focus();
        editor.insertHtml(tableHtml(rows, cols));
      }

      function build(anchor) {
        panel = document.createElement("div");
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-label", "Insert table");
        panel.style.cssText =
          "position:absolute;z-index:100000;background:#fff;border:1px solid #b6b6b6;" +
          "border-radius:4px;box-shadow:0 4px 14px rgba(0,0,0,.18);padding:8px;" +
          "font:12px Arial,Helvetica,sans-serif;user-select:none;";

        var grid = document.createElement("div");
        grid.style.cssText =
          "display:grid;grid-template-columns:repeat(" +
          COLS +
          "," +
          CELL +
          "px);gap:" +
          GAP +
          "px;";

        for (var r = 1; r <= ROWS; r++) {
          for (var c = 1; c <= COLS; c++) {
            var cell = document.createElement("div");
            cell.hxRow = r;
            cell.hxCol = c;
            cell.style.cssText =
              "width:" +
              CELL +
              "px;height:" +
              CELL +
              "px;border:1px solid #c7c7c7;background:#fff;cursor:pointer;";
            grid.appendChild(cell);
            cells.push(cell);
          }
        }

        /* One listener on the grid rather than one per square: which square the pointer is
           over comes off the event, and a hundred listeners to tear down is a hundred ways
           to leak one. */
        grid.addEventListener("mouseover", function (ev) {
          var cell = ev.target;
          if (cell && cell.hxRow) paint(cell.hxRow, cell.hxCol);
        });
        grid.addEventListener("mousedown", function (ev) {
          var cell = ev.target;
          if (!cell || !cell.hxRow) return;
          ev.preventDefault(); // a drag must not select the page's text
          dragging = true;
          paint(cell.hxRow, cell.hxCol);
        });
        grid.addEventListener("mouseup", function (ev) {
          var cell = ev.target;
          if (cell && cell.hxRow) paint(cell.hxRow, cell.hxCol);
          dragging = false;
          insert(); // a click is a press and a release in one place
        });
        grid.addEventListener("mouseleave", function () {
          if (!dragging) paint(0, 0);
        });

        var label = document.createElement("div");
        label.style.cssText =
          "text-align:center;margin-top:6px;color:#444;min-height:16px;";
        label.textContent = "Table";
        panel.hxLabel = label;

        panel.appendChild(grid);
        panel.appendChild(label);
        document.body.appendChild(panel);

        /* Placed against the button in page coordinates, so it stays put when the page is
           scrolled mid-sweep, and flipped above the button when there is no room below. */
        var box = anchor.getBoundingClientRect();
        var height = panel.offsetHeight;
        var width = panel.offsetWidth;
        var below = box.bottom + window.scrollY + 2;
        var above = box.top + window.scrollY - height - 2;
        var room = window.innerHeight - box.bottom > height + 8;

        panel.style.top = (room || above < 0 ? below : above) + "px";
        panel.style.left =
          Math.max(
            4,
            Math.min(
              box.left + window.scrollX,
              window.scrollX + document.documentElement.clientWidth - width - 4,
            ),
          ) + "px";

        document.addEventListener("mousedown", onDocumentDown, true);
        document.addEventListener("keydown", onKey, true);
        document.addEventListener("mouseup", onDocumentUp, true);
      }

      editor.addCommand("hxInsertTableGrid", {
        // Nothing to insert into while the raw HTML is on screen.
        modes: { wysiwyg: 1 },
        editorFocus: false,
        exec: function () {
          if (panel) {
            close();
            return;
          }
          var button = editor.ui.get("HxTable");
          var anchor = button && button._ && document.getElementById(button._.id);
          if (!anchor) return; // no button on this toolbar, nothing to hang it on
          build(anchor);
          paint(0, 0);
        },
      });

      editor.ui.addButton("HxTable", {
        label: "Insert table",
        title: "Insert table - sweep across the grid, or click a square",
        command: "hxInsertTableGrid",
        toolbar: "insert,5",
        icon: "hxtable",
      });

      /* ---- Delete row / column / table, from the toolbar.

         They work on the page's own table and do not depend on the right click menu, which
         is off on purpose (a right click gives the browser's menu, with spelling
         suggestions). Whichever cell the cursor is in is the one acted on.

         A table with merged cells (rowspan / colspan) is left alone with a message: taking
         a row or column out of one would shift the cells that span it, and a report is not
         the place to find that out afterwards. Ctrl+Z undoes any of these. */
      function say(text) {
        if (editor.showNotification) editor.showNotification(text, "warning", 3000);
        else window.alert(text);
      }

      function currentCell() {
        var sel = editor.getSelection();
        var start = sel && sel.getStartElement();
        var cell = start && start.getAscendant({ td: 1, th: 1 }, true);
        if (!cell) {
          say("Click inside a table cell first.");
          return null;
        }
        return cell;
      }

      function hasMerged(table) {
        var cs = table.$.querySelectorAll("td, th");
        for (var i = 0; i < cs.length; i++) {
          if ((cs[i].rowSpan || 1) > 1 || (cs[i].colSpan || 1) > 1) return true;
        }
        return false;
      }

      // Put the cursor back inside the table so the next click on the button still works.
      function caretInto(element) {
        if (!element) return;
        var range = editor.createRange();
        range.moveToElementEditStart(element);
        range.select();
      }

      function removeTable(table) {
        var next = table.getNext() || table.getPrevious();
        table.remove();
        if (next) {
          var r = editor.createRange();
          r.moveToElementEditStart(next);
          r.select();
        }
      }

      editor.addCommand("hxDeleteRow", {
        modes: { wysiwyg: 1 },
        exec: function () {
          var cell = currentCell();
          if (!cell) return;
          var table = cell.getAscendant("table");
          if (hasMerged(table)) {
            say("This table has merged cells. Split them first, then delete the row.");
            return;
          }
          var row = cell.getParent();
          var rows = table.$.rows;
          editor.fire("saveSnapshot");
          if (rows.length <= 1) {
            removeTable(table); // the last row going takes the table with it
          } else {
            var idx = row.$.rowIndex;
            var col = cell.$.cellIndex;
            var keep = rows[idx + 1] || rows[idx - 1];
            row.remove();
            caretInto(new CKEDITOR.dom.element(keep.cells[Math.min(col, keep.cells.length - 1)]));
          }
          editor.fire("saveSnapshot");
        },
      });

      editor.addCommand("hxDeleteColumn", {
        modes: { wysiwyg: 1 },
        exec: function () {
          var cell = currentCell();
          if (!cell) return;
          var table = cell.getAscendant("table");
          if (hasMerged(table)) {
            say("This table has merged cells. Split them first, then delete the column.");
            return;
          }
          var col = cell.$.cellIndex;
          var rows = table.$.rows;
          var rowIdx = cell.getParent().$.rowIndex;
          editor.fire("saveSnapshot");
          if (rows[0].cells.length <= 1) {
            removeTable(table); // the last column going takes the table with it
          } else {
            for (var i = 0; i < rows.length; i++) {
              if (rows[i].cells[col]) rows[i].deleteCell(col);
            }
            var cur = table.$.rows[rowIdx];
            caretInto(new CKEDITOR.dom.element(cur.cells[Math.min(col, cur.cells.length - 1)]));
          }
          editor.fire("saveSnapshot");
        },
      });

      editor.addCommand("hxDeleteTable", {
        modes: { wysiwyg: 1 },
        exec: function () {
          var cell = currentCell();
          if (!cell) return;
          editor.fire("saveSnapshot");
          removeTable(cell.getAscendant("table"));
          editor.fire("saveSnapshot");
        },
      });

      /* ---- Add a row or a column, next to the cell the cursor is in.

         The new cells are copies of the cell they sit beside - same border, padding and
         width style - and empty, so the table keeps its look. Merged cells are refused for
         the same reason as in delete. */
      function blankCopy(cell) {
        var copy = cell.$.cloneNode(false); // the cell itself, none of its content
        copy.removeAttribute("id");
        copy.innerHTML = "&nbsp;";
        return copy;
      }

      function addRow(after) {
        var cell = currentCell();
        if (!cell) return;
        var table = cell.getAscendant("table");
        if (hasMerged(table)) {
          say("This table has merged cells. Split them first, then add the row.");
          return;
        }
        var row = cell.getParent();
        var col = cell.$.cellIndex;
        var fresh = row.$.cloneNode(false);
        fresh.removeAttribute("id");
        for (var i = 0; i < row.$.cells.length; i++) fresh.appendChild(blankCopy(new CKEDITOR.dom.element(row.$.cells[i])));
        editor.fire("saveSnapshot");
        row.$.parentNode.insertBefore(fresh, after ? row.$.nextSibling : row.$);
        caretInto(new CKEDITOR.dom.element(fresh.cells[col]));
        editor.fire("saveSnapshot");
      }

      function addColumn(after) {
        var cell = currentCell();
        if (!cell) return;
        var table = cell.getAscendant("table");
        if (hasMerged(table)) {
          say("This table has merged cells. Split them first, then add the column.");
          return;
        }
        var col = cell.$.cellIndex;
        var rowIdx = cell.getParent().$.rowIndex;
        var rows = table.$.rows;
        editor.fire("saveSnapshot");
        for (var i = 0; i < rows.length; i++) {
          var ref = rows[i].cells[col];
          if (!ref) continue;
          var fresh = blankCopy(new CKEDITOR.dom.element(ref));
          rows[i].insertBefore(fresh, after ? ref.nextSibling : ref);
        }
        caretInto(new CKEDITOR.dom.element(rows[rowIdx].cells[after ? col + 1 : col]));
        editor.fire("saveSnapshot");
      }

      editor.addCommand("hxRowAbove", { modes: { wysiwyg: 1 }, exec: function () { addRow(false); } });
      editor.addCommand("hxRowBelow", { modes: { wysiwyg: 1 }, exec: function () { addRow(true); } });
      editor.addCommand("hxColumnLeft", { modes: { wysiwyg: 1 }, exec: function () { addColumn(false); } });
      editor.addCommand("hxColumnRight", { modes: { wysiwyg: 1 }, exec: function () { addColumn(true); } });

      editor.ui.addButton("HxRowAbove", {
        label: "Insert row above",
        title: "Insert a row above the cursor's row",
        command: "hxRowAbove",
        toolbar: "insert,9",
        icon: "hxrowabove",
      });
      editor.ui.addButton("HxRowBelow", {
        label: "Insert row below",
        title: "Insert a row below the cursor's row",
        command: "hxRowBelow",
        toolbar: "insert,10",
        icon: "hxrowbelow",
      });
      editor.ui.addButton("HxColumnLeft", {
        label: "Insert column left",
        title: "Insert a column to the left of the cursor's column",
        command: "hxColumnLeft",
        toolbar: "insert,11",
        icon: "hxcolleft",
      });
      editor.ui.addButton("HxColumnRight", {
        label: "Insert column right",
        title: "Insert a column to the right of the cursor's column",
        command: "hxColumnRight",
        toolbar: "insert,12",
        icon: "hxcolright",
      });

      editor.ui.addButton("HxRowDelete", {
        label: "Delete row",
        title: "Delete the row the cursor is in",
        command: "hxDeleteRow",
        toolbar: "insert,6",
        icon: "hxrowdel",
      });
      editor.ui.addButton("HxColumnDelete", {
        label: "Delete column",
        title: "Delete the column the cursor is in",
        command: "hxDeleteColumn",
        toolbar: "insert,7",
        icon: "hxcoldel",
      });
      editor.ui.addButton("HxTableDelete", {
        label: "Delete table",
        title: "Delete the whole table the cursor is in",
        command: "hxDeleteTable",
        toolbar: "insert,8",
        icon: "hxtabledel",
      });

      // The editor going away with the grid still open would leave it on the page.
      editor.on("destroy", close);
      editor.on("mode", close);
    },
  });
})();
