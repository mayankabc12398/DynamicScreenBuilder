import SidebarNavItem from "./SidebarNavItem";

export default function SidebarNav({ groups, activeUrl, collapsed, query, onChildClick }) {
  return (
    <nav
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: "8px 10px",
      }}
    >
      {groups.map((g) => (
        <SidebarNavItem
          key={g.label}
          group={g}
          activeUrl={activeUrl}
          collapsed={collapsed}
          forceOpen={!!query}
          onChildClick={onChildClick}
        />
      ))}
    </nav>
  );
}
