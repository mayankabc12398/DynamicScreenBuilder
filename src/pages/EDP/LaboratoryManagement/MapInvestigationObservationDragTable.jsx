import React from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Table from "react-bootstrap/Table";

function MapInvestigationObservationDragTable({
  thead = [],
  tbody = [],
  onDragEnd,
}) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        id="no-more-tables"
        className="custom-scrollbar TabScroll"
        style={{ maxHeight: "65vh" }}
      >
        <div className="row">
          <div className="col-12">
            <Table className="mainTable pt-2" bordered>
              {/* ✅ SAME HEADER UI AS YOUR TABLE COMPONENT */}
              <thead>
                <tr>
                  {thead.map((head, i) => (
                    <th
                      key={i}
                      style={{
                        width: head?.width || "",
                        whiteSpace: head?.whiteSpace,
                      }}
                    >
                      {head?.name}
                      &nbsp;
                    </th>
                  ))}
                </tr>
              </thead>

              <Droppable droppableId="observationTable">
                {(provided) => (
                  <tbody
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{ backgroundColor: "white" }}
                  >
                    {tbody.map((row, index) => {
                      const { draggableId, ...restRow } = row;

                      return (
                        <Draggable
                          key={draggableId}
                          draggableId={draggableId}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <tr
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                backgroundColor: snapshot.isDragging
                                  ? "#eaf4ff"
                                  : "",
                                ...provided.draggableProps.style,
                              }}
                            >
                              {Object.keys(restRow).map((key, i) => (
                                <td key={i} className="px-2">
                                  {restRow[key] || restRow[key] === 0
                                    ? restRow[key]
                                    : <>&nbsp;</>}
                                </td>
                              ))}
                            </tr>
                          )}
                        </Draggable>
                      );
                    })}

                    {provided.placeholder}
                  </tbody>
                )}
              </Droppable>
            </Table>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}

export default MapInvestigationObservationDragTable;