import { palette } from "../tokens/colors";

export const lightTheme = {
  name: "light",
  colors: {
    bg: palette.slate[100],
    panel: palette.white,
    panel2: palette.slate[50],
    border: palette.slate[200],
    text: palette.slate[900],
    textMuted: palette.slate[500],
    accent: palette.brand[600],
    accentSoft: "rgba(15,118,110,.08)",
    headerGradient: "linear-gradient(110deg,#0F766E,#14B8A6)",
    inputBg: palette.white,
    success: palette.semantic.success,
    warning: palette.semantic.warning,
    danger: palette.semantic.danger,
    info: palette.semantic.info,
  },
};
