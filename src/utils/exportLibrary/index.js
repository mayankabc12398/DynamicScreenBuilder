import store from "../../store/store";
import { setLoading } from "../../store/reducers/loadingSlice/loadingSlice";

/* ---------------------------------------------------------------------------
   Export libraries are loaded on first use, not on app start.

   This module is reached from the shared customTable component, so a static
   import put exceljs + xlsx-js-style + html2pdf.js (~2.5 MB of the entry chunk)
   into the eager graph — downloaded by every user on every cold load, including
   the ones who never export anything. Exporting is a click, so paying for the
   library at that moment is free in practice.

   The bindings stay module-level `let`s so the synchronous helpers below keep
   working unchanged: every public entry point awaits `ensureExportLibs()` first,
   and the helpers only ever run after that.
   --------------------------------------------------------------------------- */
let html2pdf;
let ExcelJS;
let XLSX;
let saveAs;
let _libsPromise;

const ensureExportLibs = () => {
  if (!_libsPromise) {
    _libsPromise = Promise.all([
      import("html2pdf.js"),
      import("exceljs"),
      import("xlsx-js-style"),
      import("file-saver"),
    ])
      .then(([pdfMod, excelMod, xlsxMod, saverMod]) => {
        html2pdf = pdfMod.default ?? pdfMod;
        ExcelJS = excelMod.default ?? excelMod;
        XLSX = xlsxMod.default ?? xlsxMod;
        saveAs = saverMod.saveAs ?? saverMod.default;
      })
      .catch((err) => {
        // a failed chunk fetch (flaky network, deploy mid-session) must not be
        // remembered — clear it so the next export retries instead of the button
        // being dead for the rest of the session
        _libsPromise = undefined;
        throw err;
      });
  }
  return _libsPromise;
};

import { dpdpLogExport } from "../dpdpRuntime";

// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// Function to export data to Excel
// export const exportToExcel = (data, fileName, header1, header2,condition=false) => {
//   const ws = XLSX.utils.json_to_sheet(data);

//   // Calculate maximum column widths
//   const maxWidths = data.reduce((colWidths, row) => {
//     Object.keys(row).forEach((key, index) => {
//       const value = row[key]?.toString() || "";
//       colWidths[index] = Math.max(colWidths[index] || 0, value.length);
//     });
//     return colWidths;
//   }, []);

//   // Set column widths in the worksheet
//   ws["!cols"] = maxWidths.map((width) => ({ wch: width + 2 }));

//   // Add filters to the first row
//   ws["!autofilter"] = {
//     ref: XLSX.utils.encode_range({
//       s: { c: 0, r: 0 }, // Start column and row
//       e: { c: maxWidths.length - 1, r: data.length }, // End column and row
//     }),
//   };

//   // Create and append worksheet to a new workbook
//   const wb = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

//   // Save the workbook
//   XLSX.writeFile(wb, `${fileName}.xlsx`);
// };

// export const exportToExcel = async (data, header1, header2, condition = false,fileName) => {

//   const workbook = new ExcelJS.Workbook();
//   const worksheet = workbook.addWorksheet("Sheet1");

//   // Determine the number of columns dynamically
//   const numColumns = Object.keys(data[0] || {}).length;
//   let rowNumber = 1; // Track row numbers dynamically

//   // ✅ Conditional Heading 1 (Title)
//   if (header1) {
//     const titleRow = worksheet.addRow([header1]);
//     titleRow.font = { bold: true, size: 16, color: { argb: condition ? "FF0000" : "000000" } }; // Red if condition is true
//     titleRow.alignment = { horizontal: "center", vertical: "middle" };
//     titleRow.height = 25;
//     worksheet.mergeCells(rowNumber, 1, rowNumber, numColumns);
//     rowNumber++; // Move to the next row
//   }

//   // ✅ Conditional Heading 2 (Subtitle)
//   if (header2) {
//     const subtitleRow = worksheet.addRow([header2]);
//     subtitleRow.font = { bold: true, size: 14 };
//     subtitleRow.alignment = { horizontal: "center", vertical: "middle" };
//     subtitleRow.height = 25;

//     // 🔹 Change background color based on condition
//     if (header2.includes("Summary")) {
//       subtitleRow.eachCell((cell) => {
//         cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF00" } }; // Yellow
//       });
//     }

//     worksheet.mergeCells(rowNumber, 1, rowNumber, numColumns);
//     rowNumber++;
//   }

//   // ✅ Column Headers (Row 3)
//   const columnHeaders = Object.keys(data[0]);
//   const headerRow = worksheet.addRow(columnHeaders);
//   headerRow.font = { bold: true, size: 12 };
//   headerRow.alignment = { horizontal: "center", vertical: "middle" };
//   headerRow.height = 25;
//   headerRow.eachCell((cell) => {
//     cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4F81BD" } };
//     cell.font = { color: { argb: "FFFFFF" }, bold: true };
//     cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
//   });

//   // ✅ Apply Filter on Row
//   worksheet.autoFilter = { from: { row: rowNumber, column: 1 }, to: { row: rowNumber, column: numColumns } };

//   // ✅ Add Data (from next row onwards)
//   data.forEach((rowData) => {
//     const row = worksheet.addRow(Object.values(rowData));
//     row.height = 15;
//     row.eachCell((cell) => {
//       cell.alignment = { vertical: "middle", horizontal: "left" };
//       cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
//     });
//   });

//   // ✅ Add Thick Border Around Data
//   const lastRow = worksheet.rowCount;
//   const lastColumn = worksheet.columnCount;
//   for (let i = 1; i <= lastRow; i++) {
//     for (let j = 1; j <= lastColumn; j++) {
//       const cell = worksheet.getCell(i, j);
//       // cell.border = {
//       //   top: { style: i === 1 ? "thick" : "thin" },
//       //   bottom: { style: i === lastRow ? "thick" : "thin" },
//       //   left: { style: j === 1 ? "thick" : "thin" },
//       //   right: { style: j === lastColumn ? "thick" : "thin" },
//       // };
//     }
//   }

//   // ✅ Auto-adjust column width
//   worksheet.columns.forEach((column) => { column.width = 20; });

//   // ✅ Create & Download Excel File
//   const buffer = await workbook.xlsx.writeBuffer();
//   const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
//   saveAs(blob, `${fileName?fileName:header1}.xlsx`);
// };

export const exportToExcel = async (
  data,
  header1,
  header2,
  condition = false,
  fileName,
) => {
  await ensureExportLibs();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");

  if (!data || data.length === 0) return;
  dpdpLogExport(data, fileName || header1); // DPDP access log

  // Determine the number of columns dynamically
  const numColumns = Object.keys(data[0] || {}).length;
  let rowNumber = 1;

  // ✅ Conditional Heading 1 (Title)
  if (header1) {
    const titleRow = worksheet.addRow([header1]);
    titleRow.font = {
      bold: true,
      size: 16,
      color: { argb: condition ? "FF0000" : "FF000000" },
    };
    titleRow.alignment = { horizontal: "center", vertical: "middle" };
    titleRow.height = 25;

    worksheet.mergeCells(rowNumber, 1, rowNumber, numColumns);

    // ✅ Title row fill white
    titleRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };
    });

    rowNumber++;
  }

  // ✅ Conditional Heading 2 (Subtitle)
  if (header2) {
    const subtitleRow = worksheet.addRow([header2]);
    subtitleRow.font = { bold: true, size: 14 };
    subtitleRow.alignment = { horizontal: "center", vertical: "middle" };
    subtitleRow.height = 25;

    worksheet.mergeCells(rowNumber, 1, rowNumber, numColumns);

    // 🔹 Change background color based on condition
    if (header2.includes("Summary")) {
      subtitleRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFF00" }, // Yellow
        };
      });
    } else {
      subtitleRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFFFF" }, // White
        };
      });
    }

    rowNumber++;
  }

  // ✅ Column Headers
  const columnHeaders = Object.keys(data[0]);
  const headerRow = worksheet.addRow(columnHeaders);
  headerRow.font = { bold: true, size: 12 };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 25;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F81BD" }, // Blue
    };
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true };

    // ✅ border header
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  });

  // ✅ Apply Filter on Header Row
  worksheet.autoFilter = {
    from: { row: rowNumber, column: 1 },
    to: { row: rowNumber, column: numColumns },
  };

  // ✅ Add Data
  data.forEach((rowData) => {
    const row = worksheet.addRow(Object.values(rowData));
    row.height = 15;

    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: "left" };

      // ✅ default white background
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };

      // ✅ thin border
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });
  });

  // ✅ Auto-adjust column width
  worksheet.columns.forEach((column) => {
    column.width = 20;
  });

  // ==========================================================
  // ✅ IMPORTANT PART (FULL GRID BORDER + WHITE BG FOR ALL CELLS)
  // ==========================================================
  const lastRow = worksheet.rowCount;
  const lastCol = worksheet.columnCount;

  for (let r = 1; r <= lastRow; r++) {
    for (let c = 1; c <= lastCol; c++) {
      const cell = worksheet.getCell(r, c);

      // ✅ Ensure white background for all cells (but do not override header/subtitle fills)
      if (!cell.fill) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFFFF" },
        };
      }

      // ✅ Apply thin grid border for all cells (default)
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    }
  }

  // ✅ Outer thick border (FULL SHEET USED RANGE)
  for (let r = 1; r <= lastRow; r++) {
    for (let c = 1; c <= lastCol; c++) {
      const cell = worksheet.getCell(r, c);

      const top = r === 1 ? "thick" : "thin";
      const bottom = r === lastRow ? "thick" : "thin";
      const left = c === 1 ? "thick" : "thin";
      const right = c === lastCol ? "thick" : "thin";

      cell.border = {
        top: { style: top, color: { argb: "FF000000" } },
        bottom: { style: bottom, color: { argb: "FF000000" } },
        left: { style: left, color: { argb: "FF000000" } },
        right: { style: right, color: { argb: "FF000000" } },
      };
    }
  }

  // ✅ Create & Download Excel File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `${fileName ? fileName : header1}.xlsx`);
};

// Function to export HTML content to PDF
export const exportHtmlToPDF = async (elementId, fileName) => {
  store.dispatch(setLoading(true));
  // capture the DOM before awaiting the lazily-loaded libraries
  const hiddenTemplate = window.document.getElementById(elementId).innerHTML;
  await ensureExportLibs();

  // Temporarily show the element
  // hiddenTemplate.style.display = "block";

  const options = {
    margin: 0.5,
    filename: `${fileName}.pdf`,
    image: { type: "jpeg", quality: 0.98 }, // Adjust quality if needed
    html2canvas: { scale: 2 }, // Adjust settings for performance
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    pagebreak: { after: "section", mode: ["avoid-all", "css", "legacy"] }, // Handling page breaks
  };

  try {
    // Convert the temporary container to PDF and save
    // Adding a footer with page numbers
    await html2pdf()
      .from(hiddenTemplate)
      .set(options)
      .toContainer()
      .toCanvas()
      .toPdf()
      .get("pdf")
      .then((pdf) => {
        const totalPages = pdf.internal.getNumberOfPages();
        console.log("getHeight:" + pdf.internal.pageSize.getHeight());
        console.log("getWidth:" + pdf.internal.pageSize.getWidth());
        // const headerContent = document.querySelector('.main-template-Container').outerHTML;

        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);

          pdf.setFontSize(8);
          pdf.setTextColor(64, 64, 64);
          pdf.text(
            "Page " + i + " of " + totalPages,
            pdf.internal.pageSize.getWidth() / 2,
            pdf.internal.pageSize.getHeight() - 0.2,
          );
        }
      })
      .save();
  } catch (error) {
    console.error("Error generating PDF:", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const exportHtmlToPDFNoPrint = async (
  elementId,
  fileName,
  width = "200px",
  orientation = "portrait",
) => {
  store.dispatch(setLoading(true));
  // capture (and clone) the DOM before awaiting the lazily-loaded libraries
  const hiddenTemplate = window.document.getElementById(elementId);
  const clonedElement = hiddenTemplate.cloneNode(true);
  await ensureExportLibs();

  // clonedElement.querySelectorAll(".no-print").forEach(el => el.remove());

  // Remove .no-print elements and their empty parents
  clonedElement.querySelectorAll(".no-print").forEach((el) => {
    const parent = el.parentNode;
    el.remove();
    if (parent && parent.childElementCount === 0) parent.remove();
  });

  const options = {
    margin: [0.2, 0.2, 0.4, 0],
    filename: `${fileName}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, windowWidth: width },
    jsPDF: { unit: "in", format: "a4", orientation: orientation },
    pagebreak: { after: "section", mode: ["avoid-all", "css", "legacy"] }, // Fix page break issues
  };

  try {
    await html2pdf()
      .from(clonedElement)
      .set(options)
      .toContainer()
      .toCanvas()
      .toPdf()
      .get("pdf")
      .then((pdf) => {
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(64, 64, 64);
          pdf.text(
            `Page ${i} of ${totalPages}`,
            pdf.internal.pageSize.getWidth() / 2,
            pdf.internal.pageSize.getHeight() - 0.2,
          );
        }
      })
      .save();
  } catch (error) {
    console.error("Error generating PDF:", error);
  } finally {
    store.dispatch(setLoading(false));
  }
};

// export const exportHtmlToPDFNoPrintFinance = async (
//   elementId,
//   fileName,
//   orientation = "landscape"
// ) => {
//   store.dispatch(setLoading(true));

//   try {
//     const element = document.getElementById(elementId);

//     // ✅ Clone
//     const clonedElement = element.cloneNode(true);

//     // ✅ Remove no-print elements
//     clonedElement.querySelectorAll(".no-print").forEach(el => el.remove());

//     // ✅ Force width
//     clonedElement.style.width = "1600px";
//     clonedElement.style.maxWidth = "1600px";

//     await html2pdf()
//       .set({
//         margin: [10, 10, 15, 10],
//         filename: `${fileName}.pdf`,
//         image: { type: "jpeg", quality: 1 },
//         html2canvas: {
//           scale: 1.5,
//           useCORS: true,
//           scrollX: 0,
//           scrollY: 0,
//           windowWidth: 1600,
//         },
//         jsPDF: {
//           unit: "mm",
//           format: "a4",
//           orientation,
//         },
//         pagebreak: {
//           mode: ["css", "avoid-all"],
//           avoid: ["tr"],
//         },
//       })
//       .from(clonedElement) // 🔥 USE CLONE
//       .save();
//   } catch (err) {
//     console.error("PDF Error:", err);
//   } finally {
//     store.dispatch(setLoading(false));
//   }
// };

// html to excel part start
const applyRowspanAndColspan = (table, worksheet, startRow) => {
  const merges = worksheet["!merges"] || [];
  const rows = table.rows;

  for (let r = 0; r < rows.length; r++) {
    let excelCol = 0;

    for (let c = 0; c < rows[r].cells.length; c++) {
      const cell = rows[r].cells[c];

      while (
        merges.some(
          (m) =>
            m.s.r <= r + startRow &&
            m.e.r >= r + startRow &&
            m.s.c <= excelCol &&
            m.e.c >= excelCol,
        )
      ) {
        excelCol++;
      }

      const rowspan = cell.rowSpan || 1;
      const colspan = cell.colSpan || 1;

      if (rowspan > 1 || colspan > 1) {
        const start = { r: r + startRow, c: excelCol };
        const end = {
          r: r + startRow + rowspan - 1,
          c: excelCol + colspan - 1,
        };

        merges.push({ s: start, e: end });

        // 🔥 alignment MUST be applied to top-left cell only
        const ref = XLSX.utils.encode_cell(start);
        worksheet[ref].s = {
          ...(worksheet[ref]?.s || {}),
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
        };
      }

      excelCol += colspan;
    }
  }

  worksheet["!merges"] = merges;
};

const applyStylesFromHTML = (table, worksheet, startRow) => {
  const rows = table.rows;

  for (let r = 0; r < rows.length; r++) {
    let excelCol = 0;

    for (let c = 0; c < rows[r].cells.length; c++) {
      const cell = rows[r].cells[c];

      const excelRowIndex = r + startRow;

      // 🔥 ABSOLUTE BLOCK: REPORT HEADER ROW KO TOUCH MAT KARO
      if (excelRowIndex === 0) {
        excelCol += cell.colSpan || 1;
        continue;
      }

      const ref = XLSX.utils.encode_cell({
        r: excelRowIndex,
        c: excelCol,
      });

      if (!worksheet[ref]) {
        excelCol += cell.colSpan || 1;
        continue;
      }

      const isHeader = cell.tagName === "TH";

      worksheet[ref].s = {
        ...(worksheet[ref].s || {}),
        font: {
          bold: isHeader,
          color: { rgb: "000000" },
        },
        fill: isHeader
          ? {
              patternType: "solid",
              fgColor: { rgb: "D9D9D9" },
            }
          : undefined,
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: false,
        },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };

      excelCol += cell.colSpan || 1;
    }
  }
};

export const exportHtmlToExcel = async (parentDivId, reportName) => {
  // capture the table before awaiting the lazily-loaded libraries — a detached
  // node still reads fine, a node the caller has already unmounted does not
  const table = document.getElementById(parentDivId)?.querySelector("table");

  if (!table) return;
  await ensureExportLibs();

  /* =========================
     1️⃣ TABLE → WORKSHEET
  ========================= */
  const worksheet = XLSX.utils.table_to_sheet(table, {
    origin: "A3",
  });

  /* =========================
     2️⃣ REPORT HEADING
  ========================= */
  worksheet["A1"] = {
    v: reportName,
    t: "s",
    s: {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: false, // 🔥 IMPORTANT
      },
      fill: { fgColor: { rgb: "305496" } },
    },
  };

  const range = XLSX.utils.decode_range(worksheet["!ref"]);

  worksheet["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: range.e.c },
    },
  ];

  /* =========================
     3️⃣ ROWSPAN / COLSPAN
  ========================= */
  applyRowspanAndColspan(table, worksheet, 2);

  /* =========================
     4️⃣ COLORS + BORDERS
  ========================= */
  applyStylesFromHTML(table, worksheet, 2);

  /* =========================
     5️⃣ COLUMN WIDTH
  ========================= */
  worksheet["!cols"] = Array(range.e.c + 1).fill({ wch: 22 });

  /* =========================
     6️⃣ EXPORT
  ========================= */
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

  const buffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${reportName}.xlsx`,
  );
};

export const exportHtmlToPDFNoPrintFinance = async (
  elementId,
  fileName = "report",
) => {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error("PDF Export: Element not found");
    return;
  }

  // 🔥 Force desktop width
  const originalWidth = element.style.width;
  element.style.width = "1200px";

  const options = {
    margin: [10, 10, 10, 10],
    filename: `${fileName}.pdf`,
    image: { type: "jpeg", quality: 0.98 },

    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: 1200,

      // 🚫 IGNORE ELEMENTS WITH .no-print
      ignoreElements: (el) => {
        return el.classList?.contains("no-print");
      },
    },

    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "landscape",
    },

    pagebreak: {
      mode: ["avoid-all", "css", "legacy"],
    },
  };

  await ensureExportLibs();
  html2pdf()
    .set(options)
    .from(element)
    .save()
    .finally(() => {
      element.style.width = originalWidth;
    });
};

export const exportToExcelManualHeaders = async (
  data,
  manualHeaders,
  header1,
  header2,
  condition = false,
  fileName,
) => {
  await ensureExportLibs();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");

  if (!data || data.length === 0) return;
  dpdpLogExport(data, fileName || header1); // DPDP access log
  const numColumns = manualHeaders
    ? manualHeaders.length
    : Object.keys(data[0] || {}).length;
  let rowNumber = 1;

  if (header1) {
    const titleRow = worksheet.addRow([header1]);
    // ... (rest of your styling code for titleRow)
    worksheet.mergeCells(rowNumber, 1, rowNumber, numColumns);
    rowNumber++;
  }
  if (header2) {
    const subtitleRow = worksheet.addRow([header2]);
    worksheet.mergeCells(rowNumber, 1, rowNumber, numColumns);
    rowNumber++;
  }

  const columnHeaders = manualHeaders ? manualHeaders : Object.keys(data[0]);
  const headerRow = worksheet.addRow(columnHeaders);

  headerRow.font = { bold: true, size: 12 };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 25;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F81BD" },
    };
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // ✅ Add Data
  data.forEach((rowData) => {
    const rowValues = Array.isArray(rowData) ? rowData : Object.values(rowData);
    const row = worksheet.addRow(rowValues);

    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${fileName || "Export"}.xlsx`);
};

// html to excel part ended
