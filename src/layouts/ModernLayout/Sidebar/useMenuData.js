import { useMemo } from "react";
import { useSelector } from "react-redux";
import { MENU } from "@app/layouts/menu-sidebar/MenuSidebar";

function cleanFA(s) {
  if (!s || typeof s !== "string") return "";
  return s.replace(/\s+/g, " ").trim();
}

function normChild(c) {
  return {
    label: c.childrenName || c.name || "",
    icon: cleanFA(c.subMenuIcon || c.childrenIcon || c.icon || ""),
    url: c.url || c.path || "",
    breadcrumb: c.breadcrumb || "",
    actualUrl: c.actualUrl || c.url || c.path || "",
    subMenuID: c.subMenuID,
    raw: c,
  };
}

function normGroup(g) {
  const label = g.menuName || g.name || "";
  const isDashboard = (label || "").toUpperCase() === "DASHBOARD";
  return {
    label,
    icon:
      cleanFA(g.menuIcon || g.icon) ||
      (isDashboard ? "fas fa-tachometer-alt" : ""),
    children: Array.isArray(g.children) ? g.children.map(normChild) : [],
    raw: g,
  };
}

export function useMenuData() {
  const GetMenuList = useSelector(
    (state) => state.CommonSlice?.GetMenuList || []
  );

  const groups = useMemo(() => {
    const base = MENU?.commonComponent || [];
    return [...base, ...GetMenuList].map(normGroup).filter((g) => g.label);
  }, [GetMenuList]);

  return groups;
}

export function filterMenu(groups, q) {
  if (!q) return groups;
  const needle = q.toLowerCase();
  return groups
    .map((g) => {
      const children = g.children.filter((c) =>
        c.label.toLowerCase().includes(needle)
      );
      if (children.length === 0 && !g.label.toLowerCase().includes(needle)) {
        return null;
      }
      return { ...g, children };
    })
    .filter(Boolean);
}
