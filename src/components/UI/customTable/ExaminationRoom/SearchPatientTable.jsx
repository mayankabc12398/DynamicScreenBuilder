import React, { useEffect, useState } from "react";
import Tables from "../../../UI/customTable/index";
import { useTranslation } from "react-i18next";
import SlideScreen from "../../../front-office/SlideScreen";

import SeeMoreSlideScreen from "../../SeeMoreSlideScreen";
import PatientDetailCard from "../../../commonComponents/PatientDetailCard";
import DocVitalSignPatientDetailCard from "../../../commonComponents/DocVitalSignPatientDetailCard";
import { getListBindMenu } from "../../../../networkServices/DoctorApi";
import { TempRoomOut } from "../../../SvgIcons";
import { UpdateTemperatureRoomOut } from "../../../../networkServices/examinationApi";
import { notify } from "../../../../utils/utils";
import IvfSeeMoreList from "../../../commonComponents/IvfSeeMoreList";
import TriageBookingDetails from "../../../../pages/doctor/OPD/TriageBookingDetails";
import VitalSign from "../../../../pages/doctor/OPD/VitalSign";
import { maskValue } from "../../../../utils/constant";
import { FaStar } from "react-icons/fa";
const index = ({
  tbody,
  handleClickPatientWise,
  setOpenPageModal,
  handleAPITempRoomOut,
  selectedPatient,
  setSelectedPatient,
  TemperatureRoomSearch,
  handleCallRoomTem,
  handleUnCallRoomTem,
}) => {
  const [selectedRows, setSelectedRows] = useState([]);

  // Keep the checkboxes in step when the page clears the selection (e.g. after
  // a successful transfer). Without this the rows stay ticked while the page
  // believes nothing is selected.
  useEffect(() => {
    if (selectedPatient === undefined) return;
    setSelectedRows(selectedPatient);
  }, [selectedPatient]);

  const [bodyData, setBodyData] = useState([]);
  const [visible, setVisible] = useState(false);
  const [seeMore, setSeeMore] = useState([]);
  const [BindFrameMenuByRoleIDS, setBindFrameMenuByRoleIDS] = useState([]);
  const [renderComponent, setRenderComponent] = useState({
    name: "",
    component: null,
  });
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = tbody?.map((item) => item?.App_ID);
      setSelectedRows(allIds);
      setSelectedPatient(allIds);
    } else {
      setSelectedRows([]);
      setSelectedPatient([]);
    }
  };
  const handleRowSelect = (id) => {
    setSelectedPatient((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const ModalComponent = (name, component) => {
    // debugger
    setVisible(true);
    setRenderComponent({
      name: name,
      component: component,
    });
  };
  const [t] = useTranslation();
  const thead = [
    {
      width: "1%",
      name: (
        <input
          type="checkbox"
          className="table-checkbox"
          checked={tbody?.length > 0 && selectedRows.length === tbody.length}
          onChange={handleSelectAll}
        />
      ),
      textAlign: "center",
    },
    { width: "1%", name: t("#"), textAlign: "center" },

    { width: "1%", name: t("SNO") },
    { width: "2%", name: t("Token No") },
    t("UHID"),
    t("PatientName"),
    t("Contact"),
    t("Sex"),
    t("SpouseId"),
    t("SpouseName"),
    t("AppointmentOn"),
    t("Visit No"),
    t("Doctor"),
    t("Panel"),
    t("VisitType"),
    // t("BookingDetails"),
    // SRS-2026-0060 point 1. The "Tep Room Out" text the client reported is the
    // English value stored against these keys in Country_langauge_master, not a
    // literal in this file. The migration corrects the data; the defaultValue
    // here keeps the caption sensible on a deployment where the row is absent.
    { width: "1%", name: t("TepRoomOut", { defaultValue: "Room Out" }) },
  ];

  // console.log("getListBindMenugetListBindMenu",ListBindMenu)

  const bindFrameMenuByRoleIDS = async (TID) => {
    // debugger;
    let apiResp = await getListBindMenu(TID);
    if (apiResp?.success) {
      setBindFrameMenuByRoleIDS(apiResp);
      return apiResp?.data;
    } else {
      return [];
    }
  };

  const hanleclickTemp = (ele, index) => {
    setOpenPageModal({
      isShow: true,
      component: (
        <h3 className="text-center">
          {" "}
          <strong style={{ color: "red" }}>
            {t("TepRoomOutContent", {
              defaultValue: "Do you want to mark this patient Room Out?",
            })}{" "}
          </strong>{" "}
        </h3>
      ),
      size: "20vw",
      Header: t("TepRoomOutHeading", {
        defaultValue: "Patient Out Confirmation",
      }),
      modalData: ele,
      handleAPI: handleAPITempRoomOut,
      buttonName: t("OUT"),
    });
    TemperatureRoomSearch();
  };
  const BookingDetails = (ele, index) => {
    setOpenPageModal({
      isShow: true,
      component: <VitalSign patientDetail={ele} />,

      size: "80vw",
      Header: t("Booking Details"),
      modalData: ele,
      handleAPI: handleAPITempRoomOut,
      buttonName: t("OUT"),
    });
  };

  useEffect(() => {
    let data = tbody?.map((ele, index) => ({
      colorcode:
        Number(ele?.IsDoctorConsultancyUrgent) === 1 ? "#ff6b6b" : "",
      actions: (
        <DocVitalSignPatientDetailCard
          ModalComponent={ModalComponent}
          setSeeMore={setSeeMore}
          data={ele}
          handleBindFrameMenu={bindFrameMenuByRoleIDS}
          handleSubmit={handleClickPatientWise}
          keyName={"menuName"}
          BindFrameMenuByList={BindFrameMenuByRoleIDS}
          isShowPatient={true}
        />
      ),
      SrNo: index + 1,
      UHID: ele?.MRNo,
      Pname: ele?.Pname,
      ContactNo: ele?.ContactNo,
      Sex: ele?.Sex,
      AppointmentDate: ele?.AppointmentDate,
      DName: ele?.DName,
      PanelName: ele?.PanelName,
      VisitType: ele?.VisitType,
      TempRoomOut: ele?.IsCompleated === "Pending" && ele?.IsPaid === 1 && (
        <span
          onClick={() => {
            hanleclickTemp(ele, index);
          }}
        >
          <TempRoomOut />
        </span>
      ),
    }));
    setBodyData(data);
    setSelectedRows(selectedRows);
  }, [tbody]);

  const handleChangeComponent = (e) => {
    ModalComponent(e?.label, e?.component);
  };

  const handleClassOnRow = (val, name) => {
    let data = tbody?.find((item) => {
      return item?.PatientID === val?.UHID;
    });
    if (data?.Status === "Call" && name === "Patient Name") {
      return "blink-text text-danger";
    }
  };

  // const getRowClass = (val) => {
  //   let data = tbody?.find((item) => {
  //     return item?.PatientID === val?.UHID;
  //   });
  //   debugger;

  //   if (val?.Status === "Call") {
  //     return "color-indicator-004-bg";
  //   }
  //   if (val?.Status === "Pending") {
  //     return "color-indicator-005-bg";
  //   }
  //   if (val?.Status === "Out") {
  //     return "color-indicator-003-bg";
  //   }
  //   if (val?.Status === "IN") {
  //     return "color-indicator-005-bg";
  //   }
  //   if (data?.IsEmergency === "1") {
  //     return "color-indicator-002-bg";
  //   }
  //   if (val?.IsPaid === 1) {
  //     return "color-indicator-001-bg";
  //   }
  // };
  const getRowClass = (val) => {
    const data = tbody?.find((item) => item?.PatientID == val?.UHID);
    // debugger;
    // 🚨 Highest priority
    /* if (data?.PatientType === "VIP") {
      return "color-indicator-vip-bg";
    } */
    if (data?.IsEmergency === "1") {
      return "color-indicator-002-bg";
    }

    // 📞 Called patient
    // if (data?.Status === "Call") {
    //   return "color-indicator-004-bg";
    // }

    // 🧍 Inside doctor room
    if (data?.Status === "IN") {
      return "color-indicator-005-bg";
    }

    // ⏳ Waiting
    // if (data?.Status === "Pending") {
    //   return "color-indicator-003-bg";
    // }

    // 🚪 Left
    if (data?.Status === "Out") {
      return "color-indicator-003-bg";
    }

    // 💰 Paid but no special status
    if (data?.IsPaid === 1) {
      return "color-indicator-001-bg";
    }

    return "";
  };
  useEffect(() => {
    let data = tbody?.map((ele, index) => ({
      colorcode:
        Number(ele?.IsDoctorConsultancyUrgent) === 1 ? "#ff6b6b" : "",
      Select: (
        <input
          type="checkbox"
          className="table-checkbox"
          checked={selectedRows.includes(ele?.App_ID)}
          onChange={() => handleRowSelect(ele?.App_ID)}
        />
      ),
      // SRS-2026-0060 point 1. A called patient keeps the room actions but also
      // gets an Uncall, so a wrong call can be reversed.
      //
      // The reversal is only offered while the patient is still waiting here:
      //   IsCompleated "Closed" -> already marked Room Out
      //   Status "Call"/"IN"/"Out" -> the doctor has called them, they are inside
      //                               the doctor room, or the visit is finished
      // Status is "Pending" only when IsCall/P_IN/P_Out are all 0, which is
      // exactly the window where un-calling is safe. The API repeats these checks;
      // this gate just keeps the button out of the way.
      actions: ele?.TemperatureRoomCall ? (
        <div className="d-flex align-items-center">
          <IvfSeeMoreList
            ModalComponent={ModalComponent}
            setSeeMore={setSeeMore}
            data={ele}
            handleBindFrameMenu={bindFrameMenuByRoleIDS}
            handleSubmit={handleClickPatientWise}
            keyName={"menuName"}
            BindFrameMenuByList={BindFrameMenuByRoleIDS}
            isShowPatient={true}
          />
          {ele?.IsCompleated === "Pending" && ele?.Status === "Pending" && (
            <button
              className="btn text-white mx-2"
              onClick={() => handleUnCallRoomTem(ele?.TransactionID)}
            >
              {t("UnCall", { defaultValue: "UnCall" })}
            </button>
          )}
        </div>
      ) : (
        <button
          className="btn text-white mx-2"
          onClick={() => handleCallRoomTem(ele?.TransactionID)}
        >
          {" "}
          {t("call")}{" "}
        </button>
      ),
      // <EDPSeeMoreList
      //   ModalComponent={ModalComponent}
      //   setSeeMore={setSeeMore}
      //   data={ele}
      //   setVisible={() => {
      //     setVisible(false);
      //   }}
      //   handleBindFrameMenu={bindFrameMenuByRoleIDS}
      //   name={
      //     <button className="btn text-white"> {t("Create Item")} </button>
      //   }
      // />
      // <IVFSeeMoreList
      //   ModalComponent={ModalComponent}
      //   setSeeMore={setSeeMore}
      //   data={ele}
      //   setVisible={() => {
      //     setVisible(false);
      //   }}
      //   handleBindFrameMenu={bindFrameMenuByRoleIDS}
      //   name={
      //     <button className="btn text-white"> {t("Create Item")} </button>
      //   }
      // />

      SrNo: index + 1,
      tokenno: (
        <>
          {ele?.GenralTokenNo != 0 && (
            <div className="text-center">
              <span className="bg-success px-3 py-2 rounded-circle">
                {ele?.GenralTokenNo}
              </span>
            </div>
          )}
        </>
      ),
      UHID: (
        <>
          <span className="">{ele?.MRNo}</span>{" "}
          {ele?.PatientType === "VIP" ? (
            <span>
              <FaStar className="text-warning" />
            </span>
          ) : (
            ""
          )}
        </>
      ),
      Pname:
        ele?.PatientType === "VIP" ? (
          <span className="masked-text-value">{maskValue(ele?.Pname)}</span>
        ) : (
          ele?.Pname
        ),

      ContactNo:
        ele?.PatientType === "VIP" ? (
          <span className="masked-text-value">{maskValue(ele?.ContactNo)}</span>
        ) : (
          ele?.ContactNo
        ),
      Sex:
        ele?.PatientType === "VIP" ? (
          <span className="masked-text-value">{maskValue(ele?.Sex)}</span>
        ) : (
          ele?.Sex
        ),
      SpouseId:
        ele?.PatientType === "VIP" ? (
          <span className="masked-text-value">{maskValue(ele?.Spouseid)}</span>
        ) : (
          ele?.Spouseid || "-"
        ),
      SpouseName:
        ele?.PatientType === "VIP" ? (
          <span className="masked-text-value">
            {maskValue(ele?.SpouseName)}
          </span>
        ) : (
          ele?.SpouseName || "-"
        ),
      AppointmentDate: ele?.AppointmentDate,
      transNo: ele?.TransNo,
      DName: ele?.DName,
      PanelName: ele?.PanelName,
      VisitType: ele?.VisitType,
      /* BookingDetails: (
        <i className="fa fa-book" onClick={() => BookingDetails(ele)}></i>
      ), */
      TempRoomOut: ele?.IsCompleated === "Pending" && ele?.IsPaid === 1 && (
        <span onClick={() => hanleclickTemp(ele, index)}>
          <TempRoomOut />
        </span>
      ),
    }));
    setBodyData(data);
  }, [tbody, selectedRows]);
  console.log("Selected Patient IDs:", selectedRows);

  return (
    <>
      <Tables
        thead={thead}
        tbody={bodyData}
        getRowClass={getRowClass}
        // style={{ height: "60vh" }}
        handleClassOnRow={handleClassOnRow}
        scrollView={"scrollView"}
      />

      <SlideScreen
        visible={visible}
        setVisible={() => {
          setVisible(false);
          setRenderComponent({
            name: null,
            component: null,
          });
        }}
        Header={
          <SeeMoreSlideScreen
            name={renderComponent?.name}
            seeMore={seeMore}
            handleChangeComponent={handleChangeComponent}
          />
        }
      >
        {renderComponent?.component}
      </SlideScreen>
    </>
  );
};

export default index;
