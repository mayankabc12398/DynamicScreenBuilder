import React, { useCallback, useEffect, useMemo, useState } from "react";
import Heading from "../../../components/UI/Heading";
import { useTranslation } from "react-i18next";
import SearchComponentByUHIDMobileName from "../../../components/commonComponents/SearchComponentByUHIDMobileName";
import {
  bindHashCode,
  bindPanelByPatientID,
  BindPRO,
  CheckblacklistAPI,
  GetBindDoctorDept,
  GetLastVisitDetail,
  LastVisitDetails,
  Oldpatientsearch,
  PatientSearchbyBarcode,
} from "../../../networkServices/opdserviceAPI";
import OverLay from "../../../components/modalComponent/OverLay";
import Index from "../../frontOffice/PatientRegistration/Index";
import LastVisitAccordion from "../../../components/commonComponents/LastVisitAccordion";
import DetailCard from "./IDPDetailCard";
import Modal from "../../../components/modalComponent/Modal";
import { useLocation } from "react-router-dom";
import AdmissionOrder from "../../frontOffice/PatientRegistration/AdmissionOrder";
import SearchItemEassyUI from "../../../components/commonComponents/SearchItemEassyUI";
import { BIND_TABLE_OLDPATIENTSEARCH } from "../../../utils/constant";
import { notify } from "../../../utils/utils";

const IPDAdmissionNew = ({ data, showActions, prefillUHID }) => {
  // debugger

  const [t] = useTranslation();
  const [singlePatientData, setSinglePatientData] = useState({});
  const [notificationData, setNotificationData] = useState([]);
  const [visible, setVisible] = useState(false);
  const [SearchPatient, setSearchPatient] = useState({
    label: t("UHID/IPDNo/EMGNo/Name/Mobile No/Aadhaar No/Staff ID/ Trustee ID"),
    id: "UHIDPatientNameMobileNo",
    value: "",
    patientDetail: {},
    isCallhandleChange: false,
  });
  console.log("singlePatientData", singlePatientData)
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
  const handleSinglePatientData = async (searchPatientRow) => {
    const { MRNo, ContactNo } = searchPatientRow;
    let blacklist = await CheckblacklistAPI(MRNo, ContactNo);
    if (blacklist?.success) {
      notify(blacklist?.message, "error")
      return
    }
    try {
      const response = await PatientSearchbyBarcode(MRNo, 1);
      const responseGetLastVisitDetail = await handleGetLastVisitDetail(MRNo, " ");
      const responseLastVisitDetail = await handleLastVisitDetails(MRNo);
      if (responseGetLastVisitDetail?.length > 0 && responseLastVisitDetail?.length > 0) {
        const { getLastDetail, lastDetail = [] } = handleJSXNotificationDetils({
          getLastDetail: responseGetLastVisitDetail,
          lastDetail: responseLastVisitDetail,
        });
        const notificationResponse = [getLastDetail, lastDetail];
        setNotificationData(notificationResponse);
      }
      const barcodeData = Array.isArray(response?.data) ? response?.data[0] : response?.data;
      setSinglePatientData({
        ...searchPatientRow,
        ...barcodeData,
      });
      if (!data && Number(searchPatientRow?.ActiveIPDTransactionID) > 0) {
        notify(t("Patient is currently admitted - showing the current admission"), "success");
      }
      // setPayloadData((val) => ({ ...val, DoctorID: response?.data?.DoctorID }));
    } catch (error) {
      console.log(error);
    }
  };

  // `data` means "EDIT an existing admission" (used by the see-more / billing flows):
  // IDPDetailCard fetches the admission for editing and hides the new-admission detail row.
  useEffect(() => {
    if (data?.patientID) {
      handleSinglePatientData({ MRNo: data?.patientID });
    }
  }, [data]);

  // `prefillUHID` pre-selects a patient for a NEW admission (e.g. from the Single
  // Window) WITHOUT the `data` prop — so the form stays in NEW (Save) mode instead of
  // edit mode. We replicate a manual search+select: look the patient up via
  // Oldpatientsearch and feed the real row to the loader (same as clicking a result).
  useEffect(() => {
    if (!prefillUHID) return;
    (async () => {
      try {
        const resp = await Oldpatientsearch(prefillUHID);
        const rows = resp?.data || [];
        const match = rows.find((r) => String(r?.MRNo) === String(prefillUHID)) || rows[0];
        console.log("match", match)

        handleSinglePatientData(match || { MRNo: prefillUHID });
      } catch (err) {
        console.log(err);
        handleSinglePatientData({ MRNo: prefillUHID });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillUHID]);
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
        Component: (<>
          <h1 className="text-center  PatientUHID">
            {" "}
            {t("IPD Number")} :{" "}
            <span className="text-red PatientUHID"> {isopenIPDNumber} </span>{" "}
          </h1>
        </>),
        handleInsertAPI: () => { },
      });
    }
    setSinglePatientData({});
    setSearchPatient({
      label: t("UHID/IPDNo/EMGNo/Name/Mobile No/Aadhaar No/Staff ID/ Trustee ID"),
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
  // A patient who is already admitted must not get a blank NEW-admission form: open the current
  // admission in the existing edit mode (the same one used when `data` is passed in), so its details
  // show and can be updated. memoised so IDPDetailCard's effect on `data` does not refire each render.
  const activeAdmission = useMemo(() => {
    const transactionID = Number(singlePatientData?.ActiveIPDTransactionID);
    const patientID = singlePatientData?.PatientID || singlePatientData?.MRNo;
    return transactionID > 0 && patientID ? { patientID, transactionID } : null;
  }, [singlePatientData?.ActiveIPDTransactionID, singlePatientData?.PatientID, singlePatientData?.MRNo]);

  const getPatientDetail = async (name) => {
    let apiResp = await Oldpatientsearch(name);
    console.log("apiResp", apiResp)
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
            (showActions ?? !data) && (
              <>
                 <span id="ipd-voice-mic-slot" className="d-inline-flex align-items-center mr-1" />
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
                <button className="btn btn-primary btn-sm px-2 ml-1" onClick={() => ModalComponent("Admission Order", <AdmissionOrder setSearchPatient={setSearchPatient} handleModalClose={handleModalClose} sendReset={sendReset} />)}>
                  {t("Admission Order")}
                </button>
              </>
            )

          }
        />
        {!data && Object.keys(singlePatientData)?.length === 0 ? (
          // Hide the search box while a prefill patient is auto-loading (Single Window)
          !prefillUHID && (
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
          )
        ) : (
          <>
            <DetailCard
              ModalComponent={ModalComponent}
              SearchPatient={SearchPatient}
              singlePatientData={singlePatientData}
              data={data ?? activeAdmission}
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


    </>
  );
};

export default IPDAdmissionNew;


