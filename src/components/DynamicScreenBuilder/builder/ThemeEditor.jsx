/**
 * Theme editor — edits the screen's token overrides and its reusable colour
 * swatch library. Every registry component reads these tokens, so a change
 * here restyles the whole screen instantly, in both the canvas and the page.
 */
import React from "react";
import Icon from "../registry/icons";
import { DEFAULT_SWATCHES, LIGHT_TOKENS, TOKEN_GROUPS, resolveTokens } from "../theme/tokens";
import { useBuilder } from "../store/builderStore";
import { ColorField, DebouncedInput, Row, Section } from "./editors";

export default function ThemeEditor({ onClose }) {
  const b = useBuilder();
  const { state } = b;
  const theme = state.screen.theme || { mode: "light", tokens: {} };
  const resolved = resolveTokens(theme);
  const palette = state.screen.palette || [];

  const setSwatch = (i, patch) => b.setPalette(palette.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <div className="dsb-drawer-panel">
      <header className="dsb-dp-head">
        <Icon name="Contrast" size={15} />
        <h3>Theme & colour system</h3>
        <button type="button" onClick={onClose}>
          <Icon name="X" size={15} />
        </button>
      </header>

      <div className="dsb-dp-body">
        <Section title="Mode">
          <div className="dsb-seg is-wide">
            <button type="button" className={theme.mode !== "dark" ? "is-on" : ""} onClick={() => b.setTheme({ mode: "light" })}>
              Light
            </button>
            <button type="button" className={theme.mode === "dark" ? "is-on" : ""} onClick={() => b.setTheme({ mode: "dark" })}>
              Dark
            </button>
          </div>
          <button type="button" className="dsbi-mini" onClick={() => b.setTheme({ tokens: {} })}>
            <Icon name="RefreshCw" size={12} /> Reset all tokens
          </button>
        </Section>

        <Section title="Layout direction">
          <div className="dsb-seg is-wide">
            {[
              { value: "auto", label: "Auto" },
              { value: "ltr", label: "Left → right" },
              { value: "rtl", label: "Right → left" },
            ].map((o) => (
              <button
                key={o.value}
                type="button"
                className={(theme.direction === "ltr" || theme.direction === "rtl" ? theme.direction : "auto") === o.value ? "is-on" : ""}
                onClick={() => b.setTheme({ direction: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="dsbi-note">
            Auto follows the app's language: Arabic, Urdu, Persian or Hebrew mirror the screen — columns, inputs, labels and
            icons swap sides. Pin a direction to keep one layout whatever the language.
          </p>
        </Section>

        {TOKEN_GROUPS.map((g) => (
          <Section key={g.label} title={g.label} defaultOpen={g.label === "Brand"}>
            {g.tokens.map((t) => (
              <Row key={t.key} label={t.label}>
                {t.type === "color" ? (
                  <ColorField value={theme.tokens?.[t.key] ?? resolved[t.key]} onChange={(v) => b.setToken(t.key, v)} palette={palette} />
                ) : (
                  <DebouncedInput
                    value={theme.tokens?.[t.key] ?? resolved[t.key]}
                    onChange={(v) => b.setToken(t.key, v)}
                    placeholder={LIGHT_TOKENS[t.key]}
                  />
                )}
              </Row>
            ))}
          </Section>
        ))}

        <Section title="Swatch library" right={<span className="dsbi-badge">{palette.length}</span>}>
          <p className="dsbi-note">
            Swatches appear in every colour picker and in the rule builder, so the same status colours are reused across screens.
          </p>
          <div className="dsb-swatchlist">
            {palette.map((s, i) => (
              <div key={i} className="dsb-swatchrow-edit">
                <span className="dsbi-swatch is-lg" style={{ background: s.bg, color: s.fg }}>
                  Aa
                </span>
                <DebouncedInput value={s.name} onChange={(v) => setSwatch(i, { name: v })} placeholder="Name" />
                <ColorField value={s.bg} onChange={(v) => setSwatch(i, { bg: v })} />
                <ColorField value={s.fg} onChange={(v) => setSwatch(i, { fg: v })} />
                <button type="button" className="dsbi-x" onClick={() => b.setPalette(palette.filter((_, j) => j !== i))}>
                  <Icon name="X" size={11} />
                </button>
              </div>
            ))}
          </div>
          <div className="dsb-dp-actions">
            <button type="button" className="dsbi-add" onClick={() => b.setPalette([...palette, { name: "New", bg: "#e2e8f0", fg: "#0f172a" }])}>
              <Icon name="Plus" size={12} /> Add swatch
            </button>
            <button type="button" className="dsbi-add" onClick={() => b.setPalette([...palette, ...DEFAULT_SWATCHES])}>
              <Icon name="Sparkles" size={12} /> Load HIS status set
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
