import React, { useState } from "react";
import { useSelector } from "react-redux";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import RoomShift from "./RoomShift";
import RoomShiftRequest from "./RoomShiftRequest";
import DoctorShift from "./DoctorShift";
import DoctorShiftRequest from "./DoctorShiftRequest";

const DoctorRoomShift = ({ data }) => {
  const [t] = useTranslation();
  const [activeClass, setActiveClass] = useState("DS");

  /* Room Shift has two shapes, chosen by the RoomShiftApprovalRequired resource key.

     OFF (default, and what every existing client gets): the ward picks a bed and the Shift
     button moves the patient there and then.

     ON: the ward can only RAISE A REQUEST with a reason. The bed does not move until somebody
     approves it on IPD > Request Room Shift. The direct Shift button is deliberately not left
     alongside it - an approval step that can be walked around is not an approval step. */
  const { GetGlobalResources } = useSelector((state) => state?.CommonSlice);

  const globalResourcesList = Array.isArray(GetGlobalResources)
    ? GetGlobalResources
    : GetGlobalResources?.data || [];

  const roomShiftApprovalRequired =
    globalResourcesList?.find((item) => item?.Name === "RoomShiftApprovalRequired")
      ?.Value === "1";

  /* Doctor Shift works the same way under DoctorShiftApprovalRequired: ON = the ward only
     raises a request (approved on IPD > Approve DoctorShift Request), OFF = direct Shift. */
  const doctorShiftApprovalRequired =
    globalResourcesList?.find((item) => item?.Name === "DoctorShiftApprovalRequired")
      ?.Value === "1";

  const handleClickShiftChange = (classes) => {
    setActiveClass(classes);
    if (classes === "RS") {
      //   bindPanelApprovalDetails()
    }
  };
  
  const HandleShiftPage = () => {
    return (
      <>
        <span
          className={`pointer-cursor ${activeClass === "DS" ? "Active-Shift" : ""}`}
          onClick={() => {
            handleClickShiftChange("DS");
          }}
        >
          {" "}
          {t("Doctor-Shift")}{" "}
        </span>
        <span
          className={`pointer-cursor ml-2 ${activeClass === "RS" ? "Active-Shift" : ""}`}
          onClick={() => {
            handleClickShiftChange("RS");
          }}
        >
          {" "}
          {t("Room-Shift")}{" "}
        </span>
      </>
    );
  };
  return (
    <>
      <div className="card">
        <Heading title={<HandleShiftPage />}> </Heading>
        {activeClass === "DS" ? (
          doctorShiftApprovalRequired ? (
            <DoctorShiftRequest data={data} />
          ) : (
            <DoctorShift activeClass={activeClass} data={data} />
          )
        ) : roomShiftApprovalRequired ? (
          <RoomShiftRequest data={data} />
        ) : (
          <RoomShift data={data} activeClass={activeClass} />
        )}
      </div>
    </>
  );
};

export default DoctorRoomShift;
