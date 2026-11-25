import React from "react";
import { useTranslation } from "react-i18next";

/** Low / High / Normal marker for a reading. Renders nothing for an unknown flag. */
export default function LabFlagChip({ flag, compact = false }) {
  const [t] = useTranslation();
  const map = { L: ["l", "Low"], H: ["h", "High"], N: ["n", "Normal"] };
  const entry = map[flag];
  if (!entry) return null;
  return (
    <span className={`lrt-flag lrt-flag--${entry[0]}`} title={t(entry[1])}>
      {compact ? flag : t(entry[1])}
    </span>
  );
}
