import React from 'react'
import Tables from '../../../components/UI/customTable'
import { useTranslation } from 'react-i18next';

const SmartDetails = () => {
    const { t } = useTranslation();
     const THEAD = [
        { name: t("S.No"), width: "1%" },
        { name: t("Acknowledge"), width: "10%" },
        { name: t("Reject"), width: "5%" },
        { name: t("Blood Ready"), width: "5%" },
        { name: t("Issue"), width: "5%" },
        { name: t("Id"), width: "5%" },
        { name: t("IPD No"), width: "10%" },
        { name: t("Patient Id"), width: "10%" },
        { name: t("Patient Name"), width: "10%" },
        { name: t("Blood Product Require"), width: "10%" },
        { name: t("Nature of requisition"), width: "10%" },
        { name: t("Cross/Issue"), width: "10%" },
        { name: t("Acknowledge By"), width: "15%" },
        { name: t("Acknowledge Date"), width: "10%" },
        { name: t("Rejected By"), width: "10%" },
        { name: t("Prepared By"), width: "10%" },
        { name: t("Issue Req By"), width: "10%" },
        { name: t("Issue By"), width: "10%" },

    ]

  return (
    <div>
        {t("Page Uder Development Comming Soon")}
        {/* <Tables
        thead={THEAD}
        scrollView={"scrollView"}
        style={{
          maxHeight: "125px",
        }}
        // tbody={}
        fs={"12"}
      /> */}
    </div>
  )
}

export default SmartDetails