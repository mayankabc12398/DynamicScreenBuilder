import React, { Suspense } from "react";
import PersonalDetailsOfPatient from "../FrameMenu/PersonalDetailsOfPatient";
import BillCloseUI from "./BillCloseUI";
import i18next from "i18next";
import BillLockGate from "./BillLockGate";
// import Test from '../../pages/pharmacy/PatientIssue/index.jsx'

const importComponentWithFormID = (FormId) => {
  return React.lazy(() =>
    import(`../../pages/FormBuilder/FormRenderer.jsx`)
      .then((module) => ({ default: module.default }))
      .catch(() => ({
        default: () => <div>{i18next.t("Component not found:")} {FormId}</div>,
      })),
  );
};

const importComponent = (path, IsMainMenu) => {
  const componentMap = {
    PatientIssue: () => import("../../pages/pharmacy/PatientIssue/index.jsx"),
    EditAdmissionBilling: () =>
      import("../../pages/Billing/IPD/IPDAdmissionNew.jsx"),
    NursingFormCreator: () =>
      import("../../components/FrameMenu/NursingFormCreator.jsx"),
   
  };

  if (IsMainMenu) {
    const loader = componentMap[path];
    if (!loader) {
      return React.lazy(() =>
        Promise.resolve({
          default: () => <div>{i18next.t("Component not found:")} {path}</div>,
        }),
      );
    }
    return React.lazy(() =>
      loader()
        .then((module) => ({ default: module.default }))
        .catch(() => ({
          default: () => <div>{i18next.t("Component not found:")} {path}</div>,
        })),
    );
  } else {
      return React.lazy(() =>
      import(`../FrameMenu/${path}.jsx`)
        .then((module) => ({ default: module.default }))
        .catch(() =>
          import(`../FrameMenu/Emergency/${path}.jsx`)
            .then((module) => ({ default: module.default }))
            .catch(() => fallbackComponent(path)),
        ),
    );
  }
};
//     return React.lazy(
//       () => import(`../FrameMenu/${path}.jsx`),
//       import(`../FrameMenu/Emergency/${path}.jsx`)
//         .then((module) => ({ default: module.default }))
//         .catch(() => ({
//           default: () => <div>Component not found: {path}</div>,
//         })),
//     );
//   }
// };

export default function BillingSeeMoreList(
  BindFrameMenuByRoleIDS,
  data,
  urgentOrderData,
) {
  let seeMore = [];
  for (let i = 0; i < BindFrameMenuByRoleIDS?.length; i++) {
    const { URL, FileName, IsMainMenu, FormId } = BindFrameMenuByRoleIDS[i];
    // const Component = importComponent(URL, IsMainMenu);
    const Component =
      FormId == 0
        ? importComponent(URL, IsMainMenu)
        : importComponentWithFormID(FormId);

    const Obj = {
      name: FileName,
      component: (
        <div key={i}>
          <Suspense fallback={<div>{i18next.t("Loading...")}</div>}>
            <PersonalDetailsOfPatient data={data} />
            {/* {
            FileName==="IPD Bill Print"  <Component data={data} />
           } */}

            {/* The padlock a finalized bill puts over this tab, and which tabs it
                leaves alone - see BillLockGate, which reads that from
                fin_global_resources instead of having it written in here. */}
            <BillLockGate isBilledClosed={data?.isBilledClosed} fileName={FileName}>
            {FormId == 0 ? (
              <Component
                data={{
                  ...data,
                  pathname: URL,
                  FileName: FileName,
                  urgentOrderData: urgentOrderData,
                }}
              />
            ) : (
              <Component data={data} formId={FormId} />
            )}
            </BillLockGate>
          </Suspense>
        </div>
      ),
    };

    seeMore.push(Obj);
  }

  return seeMore;
}
