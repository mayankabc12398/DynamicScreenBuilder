import React from "react";
import { useTranslation } from "react-i18next";

export default function DoctorPrescriptionModalPrint({ url }) {
  const [t] = useTranslation();



  return (
    <div className="bg-white p-1 rounded-2xl shadow-lg w-[80%] h-[80%] relative">

      <iframe
        // src={"http://hospedia.itdoseinfo.com:8088/api/v1/DoctorPrescriptionPrint/RenderPdf?cacheKey=c6cd0a66-d3bd-48e0-88a8-f9fa65df057e"}
        src={url}
        title={t("Prescription Modal Print")}
        style={{ height: "100vh", width: "100%" }}
        id="myIframe"
      />
    </div>
  );
}
