import logoItdose from "@app/assets/image/logoitdose.png";
import { useTheme } from "@app/hooks/useTheme";
import SidebarPinDrag from "./SidebarPinDrag";

export default function SidebarBrand({ collapsed, pin, mobileOpen, onCloseMobile }) {
  useTheme();

  const pillStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: collapsed ? "10px 0" : "10px 12px",
    borderRadius: 12,
    background: "#fff",
    border: "1px solid #ECEFF4",
    boxShadow: "0 1px 2px rgba(16,24,40,.04)",
    justifyContent: collapsed ? "center" : "flex-start",
    position: "relative",
    overflow: "hidden",
    marginBlock: "6px",
  };

  const content = (
    <>
      {/* itDose brand lockup */}
      <img
        src={logoItdose}
        alt="itDose"
        style={{
          height: collapsed ? 26 : 30,
          width: "auto",
          maxWidth: collapsed ? 40 : 78,
          objectFit: "contain",
          flexShrink: 0,
        }}
      />

      {!collapsed && (
        <>
          {/* divider */}
          <span
            aria-hidden
            style={{
              width: 1,
              alignSelf: "stretch",
              margin: "2px 0",
              background: "#E2E6EE",
              flexShrink: 0,
            }}
          />

          {/* Patient Portal title block */}
          <div
            style={{
              lineHeight: 1.1,
              minWidth: 0,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: 0.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: "#1B2A4A" }}>Hos</span>{""}
              <span style={{ color: "#C0392B" }}>pedia</span>
            </div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 9.5,
                letterSpacing: 2,
                color: "#9AA3B2",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              ITDOSE HEALTH
            </div>
          </div>

          {/* collapse chevron — on mobile it closes the drawer (no pin-drag there) */}
          <span
            role={mobileOpen && onCloseMobile ? "button" : undefined}
            aria-label={mobileOpen && onCloseMobile ? "Close menu" : undefined}
            aria-hidden={mobileOpen && onCloseMobile ? undefined : true}
            onClick={
              mobileOpen && onCloseMobile
                ? (e) => {
                    e.stopPropagation();
                    onCloseMobile();
                  }
                : undefined
            }
            style={{
              color: "#9AA3B2",
              fontSize: 18,
              fontWeight: 700,
              lineHeight: 1,
              flexShrink: 0,
              cursor: mobileOpen && onCloseMobile ? "pointer" : undefined,
              padding: mobileOpen && onCloseMobile ? "4px 6px" : undefined,
            }}
          >
            {collapsed ? "»" : "«"}
          </span>
        </>
      )}
    </>
  );

  return (
    <div style={{ padding: "0px 5px 0 5px", flexShrink: 0 }}>
      {pin ? (
        <SidebarPinDrag {...pin} style={pillStyle}>
          {content}
        </SidebarPinDrag>
      ) : (
        <div style={pillStyle}>{content}</div>
      )}
    </div>
  );
}
