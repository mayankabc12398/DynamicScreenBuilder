import React, { useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useTranslation } from "react-i18next";

/**
 * Reorder lines in a prescription (KMSI C18) - the Prescribed Medicine grid on View
 * Consultation.
 *
 * The grid itself is untouched: it keeps rendering `tags["Prescribed Medicine"]` in array
 * order, and the save reads the same array in the same order, so the sequence a doctor
 * sets here is exactly what prints and what the pharmacy sees. This panel only rewrites
 * that array's order. It opens from a "Reorder" button above the grid and closes with
 * "Done"; while it is open the grid stays visible below it.
 *
 * Uses react-beautiful-dnd, the library the project already uses for drag-and-drop
 * (components/UI/DragAndDropTable.jsx), plus up/down buttons for keyboard and touch.
 * "Group by timing" sorts the lines by their dosing instruction (the Time column) while
 * keeping the original order inside each group, so a prescription with several "1-0-1"
 * medicines reads as one block - the 用法ごとの統一化 half of the requirement.
 */

const textOf = (v) => {
  if (v == null) return "";
  if (typeof v === "object") return v.value ?? v.Text ?? "";
  return String(v);
};

/** Rows that carry a medicine; the trailing blank entry row is left where it is. */
export const isFilledMedicineRow = (row) =>
  !!(row?.Name?.ID || row?.Name?.isDisable || textOf(row?.Name).trim());

const reorder = (list, from, to) => {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

function MedicineReorderPanel({ rows = [], onChange, onClose }) {
  const [t] = useTranslation();
  const [dragging, setDragging] = useState(false);

  const filled = useMemo(() => rows.filter(isFilledMedicineRow), [rows]);
  const trailing = useMemo(() => rows.filter((r) => !isFilledMedicineRow(r)), [rows]);

  const commit = (nextFilled) => onChange([...nextFilled, ...trailing]);

  const onDragEnd = (result) => {
    setDragging(false);
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;
    commit(reorder(filled, from, to));
  };

  const move = (index, delta) => {
    const to = index + delta;
    if (to < 0 || to >= filled.length) return;
    commit(reorder(filled, index, to));
  };

  const groupByTiming = () => {
    // Stable: rows with the same timing keep their relative order; blank timing goes last.
    const keyed = filled.map((row, i) => ({ row, i, key: textOf(row?.Time).trim().toLowerCase() }));
    const order = [];
    keyed.forEach((k) => {
      if (k.key && !order.includes(k.key)) order.push(k.key);
    });
    keyed.sort((a, b) => {
      const ra = a.key ? order.indexOf(a.key) : order.length;
      const rb = b.key ? order.indexOf(b.key) : order.length;
      return ra - rb || a.i - b.i;
    });
    commit(keyed.map((k) => k.row));
  };

  return (
    <div className="rx-reorder">
      <div className="rx-reorder__bar">
        <div className="rx-reorder__title">
          <i className="fas fa-arrows-alt-v mr-2" aria-hidden="true"></i>
          {t("Reorder medicines")}
          <span className="rx-reorder__hint">
            {t("Drag a line to its new position, or use the arrows. This order is saved and printed.")}
          </span>
        </div>
        <div className="rx-reorder__actions">
          <button type="button" className="btn btn-sm rx-reorder__toggle" onClick={groupByTiming} disabled={filled.length < 2} title={t("Put medicines with the same timing together")}>
            <i className="fa fa-layer-group mr-1" aria-hidden="true"></i>
            {t("Group by timing")}
          </button>
          <button type="button" className="btn btn-sm btn-success" onClick={onClose}>
            <i className="fa fa-check mr-1" aria-hidden="true"></i>
            {t("Done")}
          </button>
        </div>
      </div>

      {filled.length === 0 ? (
        <div className="rx-reorder__empty">{t("Add medicines first, then reorder them here.")}</div>
      ) : (
        <DragDropContext onDragStart={() => setDragging(true)} onDragEnd={onDragEnd}>
          <Droppable droppableId="rx-reorder-list">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className={`rx-reorder__list${dragging ? " rx-reorder__list--dragging" : ""}`}>
                {filled.map((row, index) => {
                  const name = textOf(row?.Name);
                  const generic = row?.Name?.Generic ?? row?.Name?.composition ?? row?.AllItemListData?.Generic ?? "";
                  const meta = [textOf(row?.Dose), textOf(row?.Time), textOf(row?.Meal), textOf(row?.Duration)].filter(Boolean).join(" · ");
                  return (
                    <Draggable key={`${name}-${index}`} draggableId={`rx-${index}-${name}`} index={index}>
                      {(drag, snapshot) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          className={`rx-reorder__item${snapshot.isDragging ? " rx-reorder__item--dragging" : ""}`}
                        >
                          <span className="rx-reorder__handle" {...drag.dragHandleProps} title={t("Drag to reorder")}>
                            <i className="fa fa-grip-vertical" aria-hidden="true"></i>
                          </span>
                          <span className="rx-reorder__seq">{index + 1}</span>
                          <span className="rx-reorder__name">
                            {name}
                            {generic && <em className="rx-reorder__generic">{generic}</em>}
                            {meta && <span className="rx-reorder__meta">{meta}</span>}
                          </span>
                          <span className="rx-reorder__btns">
                            <button type="button" className="rx-reorder__btn" onClick={() => move(index, -1)} disabled={index === 0} title={t("Move up")}>
                              <i className="fa fa-chevron-up" aria-hidden="true"></i>
                            </button>
                            <button type="button" className="rx-reorder__btn" onClick={() => move(index, 1)} disabled={index === filled.length - 1} title={t("Move down")}>
                              <i className="fa fa-chevron-down" aria-hidden="true"></i>
                            </button>
                          </span>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}

export default MedicineReorderPanel;
