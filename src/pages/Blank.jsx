import React from 'react'
import { useTranslation } from "react-i18next";

const Blank = () => {
  const [t] = useTranslation();
  return (
    <div>{t("Compokanent")}</div>
  )
}

export default Blank