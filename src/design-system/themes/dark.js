import { palette } from "../tokens/colors";

export const darkTheme = {
  name: "dark",
  colors: {
    bg: palette.slate[950],
    panel: "#111827",
    panel2: palette.slate[900],
    border: palette.slate[800],
    text: "#E2E8F0",
    textMuted: palette.slate[400],
    accent: "#2DD4BF",
    accentSoft: "rgba(45,212,191,.12)",
    headerGradient: "linear-gradient(110deg,#0F172A,#1E293B)",
    inputBg: palette.slate[900],
    success: palette.semantic.success,
    warning: palette.semantic.warning,
    danger: palette.semantic.danger,
    info: palette.semantic.info,
  },
};
