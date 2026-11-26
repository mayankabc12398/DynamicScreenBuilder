import Heading from "@app/components/UI/Heading";
import FilterBar from "./FilterBar";
import SmartTable from "./SmartTable";

/*
  <ModernRecordPage
    heading={{ title, icon, breadcrumbs, actions, ...anyHeadingProps }}
    filter={{ fields, values, onChange, setFieldValue, onSubmit, submitLabel, submitIcon, extraActions, minColWidth, gap, showSubmit }}
    table={{ ...all SmartTable props }}
    gap={10}
  />
*/

export default function ModernRecordPage({ heading, filter, table, gap = 10, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, ...(style || {}) }}>
      {heading && <Heading {...heading} />}
      {filter && <FilterBar {...filter} />}
      {table && <SmartTable {...table} />}
    </div>
  );
}
