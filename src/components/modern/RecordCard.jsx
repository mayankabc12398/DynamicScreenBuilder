import React from "react";
import { useTheme } from "@app/hooks/useTheme";
import { FIELD_COLORS, accentFromSeed } from "./chipColors";

/*
  <RecordCard
    accentSeed="OPD"
    selected={bool}
    onToggleSelect={fn}
    header={{ badges:[{text,kind?}], index, action:{ icon, onClick, title } }}
    title={{ icon, text, trailing:{ kind, label, value } }}
    chips={[{ kind, label, value }]}
    footnote={{ icon, text }}
    footer={<>...</>}
    visibility={(key)=>bool}     // gates header.badges/index/action, title, chips, footnote, footer
  />
*/

function Chip({ kind, label, value, title, inline, colors }) {
  const palette = colors || FIELD_COLORS;
  const c = palette[kind] || palette.user;
  const Ico = c.icon;
  return (
    <span
      title={title || (value ? String(value) : "")}
      style={{
        display: inline ? "inline-flex" : "flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 6px 2px 4px",
        borderRadius: 5,
        background: c.bg,
        border: `1px solid ${c.fg}22`,
        fontSize: 10,
        lineHeight: 1.2,
        minWidth: 0,
        width: inline ? "auto" : "100%",
        maxWidth: inline ? "60%" : "100%",
        overflow: "hidden",
        flexShrink: inline ? 0 : 1,
      }}
    >
      <span
        style={{
          display: "inline-grid",
          placeItems: "center",
          width: 13,
          height: 13,
          borderRadius: 4,
          background: c.fg + "22",
          color: c.fg,
          flexShrink: 0,
        }}
      >
        {Ico ? <Ico size={8.5} strokeWidth={2.4} /> : null}
      </span>
      <span
        style={{
          color: c.fg,
          fontWeight: 700,
          fontSize: 8.5,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: "inherit",
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          minWidth: 0,
          flex: 1,
        }}
      >
        {value || "—"}
      </span>
    </span>
  );
}

export default function RecordCard({
  accentSeed,
  selected,
  onToggleSelect,
  header,
  title,
  chips,
  footnote,
  footer,
  visibility,
  colors,
  style,
}) {
  const { theme } = useTheme();
  const T = theme.colors;
  const ac = accentFromSeed(accentSeed);
  const palette = colors || FIELD_COLORS;
  const vis = (k) => (visibility ? visibility(k) : true);

  const visibleChips = (chips || []).filter((ch) => !ch.key || vis(ch.key));

  const badges = (header?.badges || []).filter((b) => !b.key || vis(b.key));
  const showIndex = header?.index != null && (!header.indexKey || vis(header.indexKey));
  const showAction = header?.action && (!header.action.key || vis(header.action.key));

  const titleTextVis = title && (!title.key || vis(title.key));
  const trailingVis =
    title?.trailing && (!title.trailing.key || vis(title.trailing.key));
  const showTitle =
    title && (titleTextVis || (trailingVis && title.trailing?.value));
  const trailing = trailingVis ? title.trailing : null;

  const showFootnote = footnote && (!footnote.key || vis(footnote.key));
  const showFooter = footer && (!footer.key || vis(footer.key));

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 10,
        border: `1px solid ${selected ? ac : T.border}`,
        background: T.panel,
        boxShadow: selected
          ? `0 0 0 2px ${ac}22, 0 6px 16px -10px ${ac}77`
          : "0 1px 2px rgba(15,23,42,.04)",
        padding: "8px 10px 9px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 0,
        transition: "border-color .15s, box-shadow .15s, transform .15s",
        ...(style || {}),
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: `linear-gradient(180deg, ${ac}, ${ac}aa)`,
          borderRadius: "10px 0 0 10px",
        }}
      />

      {(onToggleSelect || badges.length > 0 || showIndex || showAction) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={() => onToggleSelect()}
              style={{ accentColor: ac, cursor: "pointer", margin: 0 }}
            />
          )}
          {badges.map((b, i) => {
            const c = palette[b.kind] || null;
            const bg = b.solid
              ? `linear-gradient(135deg, ${ac}, ${ac}cc)`
              : c
                ? c.bg
                : ac + "1f";
            const fg = b.solid ? "#fff" : c ? c.fg : ac;
            const border = b.solid ? "none" : `1px solid ${(c ? c.fg : ac) + "33"}`;
            return (
              <span
                key={i}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  background: bg,
                  color: fg,
                  textTransform: "uppercase",
                  border,
                  boxShadow: b.solid ? `0 2px 6px -2px ${ac}77` : "none",
                }}
              >
                {b.text || "—"}
              </span>
            );
          })}
          {showIndex && (
            <span
              style={{
                fontSize: 9.5,
                color: T.textMuted,
                marginLeft: "auto",
                fontWeight: 600,
              }}
            >
              #{header.index}
            </span>
          )}
          {showAction && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                header.action.onClick && header.action.onClick();
              }}
              title={header.action.title || ""}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                display: "inline-grid",
                placeItems: "center",
                cursor: "pointer",
                color: "#fff",
                background: `linear-gradient(135deg, ${ac}, ${ac}cc)`,
                boxShadow: `0 2px 6px -2px ${ac}77`,
                marginLeft: showIndex ? 0 : "auto",
              }}
            >
              {header.action.icon
                ? React.createElement(header.action.icon, { size: 12 })
                : null}
            </span>
          )}
        </div>
      )}

      {showTitle && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
            minHeight: 18,
          }}
        >
          {titleTextVis && title.icon && (
            <span
              style={{
                display: "inline-grid",
                placeItems: "center",
                width: 18,
                height: 18,
                borderRadius: 5,
                background: ac + "1a",
                color: ac,
                flexShrink: 0,
              }}
            >
              {React.createElement(title.icon, { size: 11, strokeWidth: 2.4 })}
            </span>
          )}
          {titleTextVis && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: T.text,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flex: 1,
              }}
              title={title.text}
            >
              {title.text || "—"}
            </span>
          )}
          {trailing && trailing.value && (
            <Chip
              kind={trailing.kind}
              label={trailing.label}
              value={trailing.value}
              inline
              colors={palette}
            />
          )}
        </div>
      )}

      {visibleChips.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              visibleChips.length === 1 ? "1fr" : "1fr 1fr",
            gap: 4,
          }}
        >
          {visibleChips.map((ch, i) => (
            <Chip
              key={ch.key || i}
              kind={ch.kind}
              label={ch.label}
              value={ch.value}
              title={ch.title}
              colors={palette}
            />
          ))}
        </div>
      )}

      {showFootnote && footnote.text && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 4,
            fontSize: 10,
            color: T.textMuted,
            lineHeight: 1.35,
            overflow: "hidden",
          }}
          title={footnote.text}
        >
          {footnote.icon &&
            React.createElement(footnote.icon, {
              size: 10,
              strokeWidth: 2.2,
              style: {
                color: (palette[footnote.kind] || palette.addr).fg,
                flexShrink: 0,
                marginTop: 1,
              },
            })}
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {footnote.text}
          </span>
        </div>
      )}

      {showFooter && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: "auto",
            paddingTop: 2,
          }}
        >
          {typeof footer === "function" ? footer({ accent: ac, T }) : footer}
        </div>
      )}
    </div>
  );
}

export { Chip as RecordChip };
