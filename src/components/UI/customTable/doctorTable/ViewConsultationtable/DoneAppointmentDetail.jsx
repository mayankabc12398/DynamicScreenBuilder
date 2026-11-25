import React from "react";
import Heading from "../../../Heading";
import Tables from "../..";
import { useTranslation } from "react-i18next";
import { Tooltip } from "primereact/tooltip";
import OverLay from "../../../../modalComponent/OverLay";
import RPM from "../../../../../pages/doctor/OPD/RPM";

const DoneAppointmentDetail = ({
  thead,
  tbody,
  handleCallButtonClick,
  handlePatientSelect,
  start,
  showRPM = false,
}) => {
  const [t] = useTranslation();
  const [rpmModal, setRpmModal] = React.useState({
    show: false,
    patient: null,
    index: null,
  });
  return (
    <>
      {rpmModal?.show && (
        <OverLay
          visible={rpmModal?.show}
          setVisible={() =>
            setRpmModal({
              show: false,
              patient: null,
              index: null,
            })
          }
          Header={t("Giloys RPM")}
          modalWidth={"96vw"}
        >
          <RPM
            patientDetail={{
              currentPatient: rpmModal?.patient,
              TotaltableData: tbody,
              index: rpmModal?.index,
            }}
            isPopup={true}
          />
        </OverLay>
      )}
      {/* {tbody.map((item, index) => (
        <Tooltip
          key={index}
          target={`#Doctor-${index}}`}
          position="top"
        //   content={item.Dname}
        />
      ))} */}
      {/* <Heading title={t("Item Details")} /> */}
      <Tables
        thead={thead}
        tbody={tbody?.map((item, index) => ({
          "Sr.No": index + 1,
          MRNo: item?.MRNo,
          Pname: item?.Pname,
          Age: (
            <span>
              {" "}
              {item?.Age}/{item?.Sex}
            </span>
          ),
          Doctor: (
            <>
              <span
                id={`Doctor-${index}`}
                data-pr-tooltip={item?.DName}
                style={{ fontSize: "11px" }}
              >
                {`${item?.DName}...`}
                {/* {`${item?.DoctorName?.substring(0, 8)}...`} */}
              </span>
            </>
          ),
          AppointmentDate: item?.AppointmentDate,
          ...(showRPM
            ? {
                RPM: (
                  <button
                    className="btn btn-sm text-white"
                    onClick={() =>
                      setRpmModal({
                        show: true,
                        patient: item,
                        index,
                      })
                    }
                    style={{ backgroundColor: "#0b8f08" }}
                  >
                    {t("RPM")}
                  </button>
                ),
              }
            : {}),
          IsCall: (
            <>
              {/* <i className="pi pi-check" onClick={() => handlePatientSelect(item,index)}
              disabled={item?.IsCall === 1 ? false : true}></i> */}
              <button
                className="btn btn-sm text-white"
                onClick={() => handlePatientSelect(item, index, "done")}
              >
                {t("In")}
              </button>
            </>
          ),
        }))}
        tableHeight={"tableHeight scrollView"}
        style={{ height: "auto" }}
      />
    </>
  );
};

export default DoneAppointmentDetail;
