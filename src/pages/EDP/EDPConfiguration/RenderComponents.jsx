import React, { Suspense } from "react";
import { allRoutes } from "../../../routes/RenderRoute";
import { useTranslation } from "react-i18next";
import DynamicFormbuilderScreen from "../../../components/dynamicFormBuilder/DynamicFormbuilderScreen";

export default function RenderComponents({ stepDetails }) {
  // debugger;
  const [t] = useTranslation();
  const routes = [...allRoutes?.commonRoutes, ...(allRoutes?.roleRoutes || [])];
  const route = routes?.find((r) => r?.path === stepDetails?.ActualUrl);

  if (stepDetails?.IsDynamicScreen === 1) {
    return <DynamicFormbuilderScreen subMenuID={stepDetails?.SubMenuID} />;
  }

  if (!stepDetails && !route) {
    return <>{t("Loading Component...")}</>;
  }

  if (!route) {
    return <>{t("Component Not Found")}</>;
  }

  const Component = route.component;

  // DynamicFormbuilderScreen

  return (
    <>
      <Suspense fallback={<>{t("Loading...")}</>}>
        <Component urlId={stepDetails?.URLID} />
      </Suspense>
    </>
  );
}
