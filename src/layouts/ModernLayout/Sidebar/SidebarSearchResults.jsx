import { useNavigate } from "react-router-dom";
import { useTheme } from "@app/hooks/useTheme";
import { applyRootThemeClass } from "@app/utils/helpers";
import {
  sourceItemNavigation,
  useSourceSearchResults,
} from "@app/layouts/menu-sidebar/menuSearchSources";

const FONT =
  "Inter, 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// Master Configuration steps / reports matching the sidebar search, listed
// under the menu matches. Picking one opens its page with it preselected.
export default function SidebarSearchResults({ groups, query, onPick }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const navigate = useNavigate();
  const results = useSourceSearchResults(
    groups.flatMap((g) => g.children.map((ch) => ch.raw)),
    query,
  );

  if (!results.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "0 10px 8px" }}>
      {results.map((group) => (
        <div key={group.id}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 12px",
              color: "hsl(220 12% 48%)",
              fontWeight: 500,
              fontSize: "0.9375rem",
              letterSpacing: "-0.01em",
              fontFamily: FONT,
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 22,
                height: 22,
                borderRadius: 6,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: c.accentSoft,
                color: c.accent,
              }}
            >
              <i className="fas fa-search" style={{ fontSize: "0.75rem", lineHeight: 1 }} />
            </span>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {group.title}
            </span>
          </div>
          <div
            style={{
              marginLeft: 14,
              marginTop: 2,
              paddingLeft: 14,
              borderLeft: `1.5px solid ${c.border}`,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {group.items.map((item, i) => (
              <button
                key={`${item.label}-${item.category}-${i}`}
                type="button"
                title={`${item.label} — ${item.category}`}
                onClick={(e) => {
                  applyRootThemeClass();
                  navigate(...sourceItemNavigation(item));
                  onPick?.(e);
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "hsl(220 12% 48%)",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  letterSpacing: "-0.01em",
                  fontFamily: FONT,
                  transition: "background .15s",
                  maxWidth: "100%",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = c.accentSoft)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.label}
                </span>
                {item.category !== group.title && (
                  <span style={{ fontSize: "0.75rem", opacity: 0.75, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.category}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
