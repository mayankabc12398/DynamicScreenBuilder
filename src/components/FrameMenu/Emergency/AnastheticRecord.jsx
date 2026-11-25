import React from 'react'
import { useTranslation } from "react-i18next";

const AnastheticRecord = () => {
  const [t] = useTranslation();
  return (
    <div>{t("AnastheticRecord")}</div>
  )
}

export default AnastheticRecord