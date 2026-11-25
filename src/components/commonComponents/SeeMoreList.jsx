import React, { Fragment } from "react";
import PatientRegistration from "../../pages/frontOffice/PatientRegistration/Index";
import PanelDetails from "../front-office/PanelDetails";

// PatientID, setVisible, bindDetailAPI,handleBindPanelByPatientID
export default function SeeMoreList(
  BindSeeMoreListData,
  PatientRegistrationArg
) {
  let seeMore = [];
  BindSeeMoreListData?.map((item) => {
    let obj = {};
    obj.menuURL = item?.MenuURL;
    if (item?.MenuURL === "PatientRegistration") {
      obj.name = item?.MenuName;
      obj.component = (
        <PatientRegistration
          PatientID={PatientRegistrationArg?.PatientID}
          type={"update"}
          setVisible={PatientRegistrationArg?.setVisible}
          bindDetail={true}
          bindDetailAPI={PatientRegistrationArg?.bindDetailAPI}
        />
      );
    } else if (item?.MenuURL === "Add/RemovePanelsList") {
      obj.name = item?.MenuName;
      obj.component = (
        <PatientRegistration
          PatientID={PatientRegistrationArg?.PatientID}
          /* The visit the panel documents uploaded in this popup belong to. Screens that
             open it on an existing encounter (IPD, Emergency, panel approval) pass one;
             OPD Booking has no transaction until the booking is saved, and the API then
             files the documents under the patient's most recent visit. */
          TransactionID={PatientRegistrationArg?.TransactionID}
          type={"panelDetail"}
          setVisible={PatientRegistrationArg?.setVisible}
          bindDetail={true}
          bindDetailAPI={PatientRegistrationArg?.bindDetailAPI}
          updateButtonName={"Update Panel"}
          handleBindPanelByPatientID={
            PatientRegistrationArg?.handleBindPanelByPatientID
          }
        />
      );
    } else {
      obj.name = item?.MenuName;
      obj.component = <Fragment />;
    }
    seeMore.push(obj);
  });

  return seeMore;
}
