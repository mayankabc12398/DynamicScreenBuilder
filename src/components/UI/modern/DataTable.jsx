import React from "react";

/**
 * DataTable — modern list table (design system .hx-table).
 *
 *   columns: [{ key, label, width, align, className, headerClassName, render(row, index), nolabel }]
 *            width  "24%" | "120px" - applied to the header cell (table-layout: fixed)
 *            align  "left" (default) | "center" | "right" - header and body cells alike
 *   rows:    array of records
 *   rowKey(row, index)        key for React (default index)
 *   rowAccent(row, index)     colour for the left accent bar, or falsy
 *   rowSelected(row, index)   highlight the row
 *   expanded(row, index)      when truthy, renderDetail(row, index) is shown in a row below
 *   cards                     stack rows as cards under 768px (each cell gets its column
 *                             label from data-label; mark a column `nolabel` to skip it)
 *   footer                    node shown under the table (e.g. "Showing 1-6 of 6")
 *   empty                     node shown when there are no rows
 */
const alignClass = (align) =>
  align === "center" ? "hx-table__center" : align === "right" ? "hx-table__right" : "";

const DataTable = ({
  columns = [],
  rows = [],
  rowKey,
  rowAccent,
  rowSelected,
  expanded,
  renderDetail,
  cards = true,
  footer,
  empty = null,
  className = "",
}) => (
  <div className={`hx-table-wrap ${className}`}>
    <table className={`hx-table${cards ? " hx-table--cards" : ""}`}>
      <colgroup>
        {columns.map((col) => (
          <col key={col.key} style={col.width ? { width: col.width } : undefined} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              className={`${col.headerClassName || ""} ${alignClass(col.align)}`.trim()}
              style={col.width ? { width: col.width } : undefined}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && empty ? (
          <tr>
            <td colSpan={columns.length} className="hx-table__nolabel">
              {empty}
            </td>
          </tr>
        ) : null}
        {rows.map((row, index) => {
          const accent = rowAccent?.(row, index);
          const isOpen = !!expanded?.(row, index);
          const cls = [
            accent ? "hx-table__row--accent" : "",
            rowSelected?.(row, index) ? "hx-table__row--selected" : "",
          ]
            .filter(Boolean)
            .join(" ");
          const key = rowKey ? rowKey(row, index) : index;
          return (
            <React.Fragment key={key}>
              <tr className={cls} style={accent ? { "--hx-row-accent": accent } : undefined}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`${col.className || ""} ${alignClass(col.align)}${col.nolabel ? " hx-table__nolabel" : ""}`.trim()}
                    data-label={col.nolabel ? undefined : typeof col.label === "string" ? col.label : col.key}
                  >
                    {col.render ? col.render(row, index) : row?.[col.key]}
                  </td>
                ))}
              </tr>
              {isOpen && renderDetail ? (
                <tr className="hx-table__detail">
                  <td colSpan={columns.length} className="hx-table__nolabel">
                    {renderDetail(row, index)}
                  </td>
                </tr>
              ) : null}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
    {footer ? <div className="hx-table__foot">{footer}</div> : null}
  </div>
);

export default DataTable;
