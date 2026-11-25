import React, { useEffect, useState } from "react";
import IvfIPDDetailCard from "../../pages/IVF/ivf/IvfIPDDetailCard";
import { useTranslation } from "react-i18next";
import {
  GetLastVisitDetail,
  LastVisitDetails,
  PatientSearchbyBarcode,
} from "../../networkServices/opdserviceAPI";
import { useLocation } from "react-router-dom";
import Heading from "../UI/Heading";
import Modal from "../modalComponent/Modal";
import Index from "../../pages/pharmacy/PatientIssue";
import SearchItemEassyUI from "../commonComponents/SearchItemEassyUI";
import LastVisitAccordion from "../commonComponents/LastVisitAccordion";
import OverLay from "../modalComponent/OverLay";

const EditIVFAdmission = ({data}) => {
  const [t] = useTranslation();
  const [singlePatientData, setSinglePatientData] = useState({});
  const [visible, setVisible] = useState(false);
  const [SearchPatient, setSearchPatient] = useState({
    label: t("UHID/Patient Name/Mobile No/Alternate Mobile No"),
    id: "UHIDPatientNameMobileNo",
    value: "",
    patientDetail: {},
    isCallhandleChange: false,
  });
  console.log("SearchPatient", SearchPatient);  
  const [renderComponent, setRenderComponent] = useState({
    name: "",
    component: null,
  });
  const [handleModelData, setHandleModelData] = useState({});
  const { state } = useLocation();

  const handleGetLastVisitDetail = async (PatientID, DoctorID) => {
    try {
      const data = await GetLastVisitDetail(PatientID, DoctorID);
      return data?.data;
    } catch (error) {
      console.log(error, "error");
    }
  };
  const handleLastVisitDetails = async (PatientID) => {
    try {
      const data = await LastVisitDetails(PatientID);
      return data?.data;
    } catch (error) {
      console.log(error, "error");
    }
  };

  const handleJSXNotificationDetils = (details) => {
    const { getLastDetail, lastDetail } = details;
    const response = {
      getLastDetail: {},
      lastDetail: {},
    };

    // Sort to find the latest visit date for the header
    const parseDate = (dateStr) => {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    };
    const sortedVisits = [...(getLastDetail || [])].sort((a, b) => {
      if (a.Days !== undefined && b.Days !== undefined) {
        return Number(a.Days) - Number(b.Days);
      }
      const dateA = a.appDate ? new Date(a.appDate).getTime() : parseDate(a.VisitDate);
      const dateB = b.appDate ? new Date(b.appDate).getTime() : parseDate(b.VisitDate);
      return dateB - dateA;
    });

    const latestVisitDate = sortedVisits[0]?.VisitDate || "";
    response.getLastDetail.header = latestVisitDate ? "Last Visit Date: " + latestVisitDate : "Last Visit Details";

    const component = (
      <LastVisitAccordion getLastDetail={getLastDetail} />
    );

    response.getLastDetail.component = component;
    response.getLastDetail.autoClose = false;

    // lastDetail

    response.lastDetail.header = "Last Visit Details";

    const responselastDetail = lastDetail;

    const responselastDetailcomponent = (
      <table>
        <tbody>
          {responselastDetail?.map((ele, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td style={{ textAlign: "left" }}>{ele?.Name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    response.lastDetail.component = responselastDetailcomponent;
    return response;
  };
  const handleSinglePatientData = async (data) => {
    const { MRNo, ContactNo } = data;
    let blacklist = await CheckblacklistAPI(MRNo, ContactNo);
    if (blacklist?.success) {
      notify(blacklist?.message, "error");
      return;
    }
    try {
      const data = await PatientSearchbyBarcode(MRNo, 1);
      const responseGetLastVisitDetail = await handleGetLastVisitDetail(
        MRNo,
        " ",
      );
      const responseLastVisitDetail = await handleLastVisitDetails(MRNo);
      if (
        responseGetLastVisitDetail.length > 0 &&
        responseLastVisitDetail.length > 0
      ) {
        const { getLastDetail, lastDetail } = handleJSXNotificationDetils({
          getLastDetail: responseGetLastVisitDetail,
          lastDetail: responseLastVisitDetail,
        });
        const notificationResponse = [getLastDetail, lastDetail];
        setNotificationData(notificationResponse);
      }
      setSinglePatientData(
        Array.isArray(data?.data) ? data?.data[0] : data?.data,
      );
      // setPayloadData((val) => ({ ...val, DoctorID: data?.data?.DoctorID }));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (data?.patientID) {
      handleSinglePatientData({ MRNo: data?.patientID });
    }
  }, [data]);
  useEffect(() => {
    if (state?.uhid) {
      handleSinglePatientData({ MRNo: state?.uhid });
    }
  }, [state?.uhid]);

  const sendReset = (isopenIPDNumber) => {
    if (isopenIPDNumber) {
      setHandleModelData({
        label: t("IPD Number"),
        width: "30vw",
        isOpen: true,
        footer: <></>,
        Component: (
          <>
            <h1 className="text-center  PatientUHID">
              {" "}
              {t("IPD Number")} :{" "}
              <span className="text-red PatientUHID"> {isopenIPDNumber} </span>{" "}
            </h1>
          </>
        ),
        handleInsertAPI: () => {},
      });
    }
    setSinglePatientData({});
    setSearchPatient({
      label: t("UHID/IPDNo/EMGNo/Name/Mobile/Alternate Mobile No"),
      id: "UHIDPatientNameIPDNo",
      value: "",
      patientDetail: {},
      isCallhandleChange: false,
    });
  };
  const ModalComponent = (name, component) => {
    setVisible(true);
    setRenderComponent({
      name: name,
      component: component,
    });
  };

  const handleModalClose = () => {
    setVisible(false);
    setRenderComponent({
      name: "",
      component: null,
    });
  };
  const getPatientDetail = async (name) => {
    let apiResp = await Oldpatientsearch(name);
    return apiResp;
  };
  return (
    <>


      {handleModelData?.isOpen && (
        <Modal
          visible={handleModelData?.isOpen}
          setVisible={() => setHandleModelData({ ...handleModelData, isOpen: false })}
          modalWidth={handleModelData?.width}
          Header={t(handleModelData?.label)}
          footer={handleModelData?.footer}
          handleAPI={handleModelData?.handleInsertAPI}
        >

          {handleModelData?.Component}
        </Modal>
      )}
      <div className="card patient_registration border py-2">

        <Heading
          title={t("Search Criteria")}
          isBreadcrumb={true}
          secondTitle={
            !data && (
              <>
                <button
                  className="btn btn-primary btn-sm px-2 ml-1"
                  onClick={() =>
                    ModalComponent(
                      " New Registration",
                      <Index
                        bindDetail={true}
                        bindDetailAPI={handleSinglePatientData}
                        setVisible={setVisible}
                      />
                    )
                  }
                >
                  {t("NewRegistration")}
                </button>
                <button className="btn btn-primary btn-sm px-2 ml-1" onClick={() => ModalComponent("Admission Order", <AdmissionOrder setSearchPatient={setSearchPatient} handleModalClose={handleModalClose} sendReset={sendReset}/>)}>
                  {t("Admission Order")}
                </button>
              </>
            )

          }
        />
        {!data && Object.keys(singlePatientData)?.length === 0 ? (
          <>
            {/* <SearchComponentByUHIDMobileName
            onClick={handleSinglePatientData}
            data={data}
          /> */}
            <div className="col-xl-6 col-md-6 col-sm-6 col-12 pt-2">
              <SearchItemEassyUI
                onClick={handleSinglePatientData}
                BindListAPI={getPatientDetail}
                BindDetails={SearchPatient}
                Head={BIND_TABLE_OLDPATIENTSEARCH}
                // customInputRef={searchPatientRef}
                isSelectFirst={true}
              />
            </div>
          </>
        ) : (
          <>
            <IvfIPDDetailCard
              ModalComponent={ModalComponent}
              SearchPatient={SearchPatient}
              singlePatientData={singlePatientData}
              data={data}
              sendReset={sendReset}
              setVisible={setVisible}
              setSinglePatientData={setSinglePatientData}
              bindDetailAPI={handleSinglePatientData}
            />
          </>
        )}
      </div>
      <OverLay
        visible={visible}
        setVisible={setVisible}
        Header={renderComponent?.name}
      >
        {renderComponent?.component}
      </OverLay>
      {/* <IvfIPDDetailCard
        ModalComponent={ModalComponent}
        SearchPatient={SearchPatient}
        singlePatientData={singlePatientData}
        data={data}
        sendReset={sendReset}
        setVisible={setVisible}
        setSinglePatientData={setSinglePatientData}
        bindDetailAPI={handleSinglePatientData}
      /> */}
    </>
  );
};

export default EditIVFAdmission;
