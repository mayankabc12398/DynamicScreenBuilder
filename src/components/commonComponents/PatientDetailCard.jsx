import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import BillingSeeMoreList from "./BillingSeeMoreList";
import SeeMoreSlideScreen from "../UI/SeeMoreSlideScreen";
import PatientReceivedConfirmationModal from "../modalComponent/Utils/PatientReceivedConfirmationModal";
import Button from "../formComponent/Button";
import Modal from "../modalComponent/Modal";
import { Dialog } from "primereact/dialog";
import { IsReceivedPatient } from "../../networkServices/BillingsApi";
import { notify } from "../../utils/utils";

function PatientDetailCard({
  ModalComponent,
  setSeeMore,
  data,
  handleSubmit,
  urgentOrderData,
}) {
  const [t] = useTranslation();

  const { BindFrameMenuByRoleIDS, GetGlobalResources } = useSelector((state) => state?.CommonSlice);
  const [modalHandlerState, setModalHandlerState] = useState({
    header: null,
    show: false,
    size: null,
    component: null,
    footer: null,
  });
  const [reasonDialogVisible, setReasonDialogVisible] = useState(false);
  const [notAdmittedReason, setNotAdmittedReason] = useState("");

  const showNotAdmittedReason =
    Array.isArray(GetGlobalResources) &&
    String(
      GetGlobalResources?.find(
        (r) => r?.Name === "ShowNotAdmittedReason",
      )?.Value ?? "",
    ).trim() === "1";

  // Handle patient received logic
  const handleisPatientReceived = async () => {
    const response = await IsReceivedPatient({
      tid: data?.transactionID,
      isReceived: 1,
    });
    if (response.success) {
      setModalHandlerState({ ...modalHandlerState, show: false });
      handleSubmit();
      notify(response?.message, "success");
    } else {
      console.log("Error: ", response.errorMessage);
    }
  };

  const handleSaveNotAdmitted = async () => {
    if (!notAdmittedReason.trim()) return;
    setReasonDialogVisible(false);
    try {
      const response = await IsReceivedPatient({
        tid: data?.transactionID,
        isReceived: 2,
        notAdmittedReason: notAdmittedReason.trim(),
      });
      if (response.success) {
        handleSubmit();
        notify(response?.message || "Patient Not Admitted", "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleModalState = () => {
    if (!showNotAdmittedReason) {
      setModalHandlerState({
        show: true,
        header: t("Alert!!!"),
        size: "20vw",
        component: <PatientReceivedConfirmationModal />,
      });
    } else {
      setModalHandlerState({
        show: true,
        header: t("Alert!!!"),
        size: "25vw",
        component: <PatientReceivedConfirmationModal />,
        footer: (
          <div className="d-flex align-items-center justify-content-center" style={{ gap: "10px" }}>
            <button className="btn btn-sm btn-success" onClick={() => {
              setModalHandlerState((prev) => ({ ...prev, show: false }));
              handleisPatientReceived();
            }}>
              {t("Yes")}
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => {
              setModalHandlerState((prev) => ({ ...prev, show: false }));
              setNotAdmittedReason("");
              setReasonDialogVisible(true);
            }}>
              {t("No")}
            </button>
          </div>
        ),
      });
    }
  };

  const handleComponentRender = useCallback(async (data, items, urgentOrderData) => {
    const componentData = BillingSeeMoreList([items], data, urgentOrderData);
    ModalComponent(componentData[0]?.name, componentData[0]?.component);
    const forsetSeeMore = BillingSeeMoreList(
      BindFrameMenuByRoleIDS,
      data,
      urgentOrderData,
    );
    setSeeMore(forsetSeeMore);
  }, [BindFrameMenuByRoleIDS, ModalComponent, setSeeMore]);

  useEffect(() => {
    const handleNavigation = (event) => {
      const { targetMenu, transactionID } = event.detail;

      // Ensure the redirect is only handled by the patient card that triggered it
      if (transactionID && String(data?.transactionID) !== String(transactionID)) {
        return;
      }

      const foundItem = BindFrameMenuByRoleIDS?.find(
        (item) =>
          item?.URL === targetMenu ||
          item?.FileName === targetMenu ||
          item?.URL?.toLowerCase() === targetMenu?.toLowerCase() ||
          item?.FileName?.toLowerCase() === targetMenu?.toLowerCase()
      );
      if (foundItem) {
        handleComponentRender(data, foundItem, urgentOrderData);
      } else {
        console.warn(`Menu item ${targetMenu} not found in BindFrameMenuByRoleIDS`);
      }
    };

    window.addEventListener("navigateFrameMenu", handleNavigation);
    return () => {
      window.removeEventListener("navigateFrameMenu", handleNavigation);
    };
  }, [BindFrameMenuByRoleIDS, data, urgentOrderData, handleComponentRender]);

  const handleBindFrameMenuByRoleIDS = useCallback(
    (dataBind) => {
      return dataBind?.map((items, _) => {
        return {
          ...items,
          name: items?.FileName,
        };
      });
    },
    [BindFrameMenuByRoleIDS],
  );

  return (
    <>
      <div style={{ position: "relative" }}>
        {BindFrameMenuByRoleIDS?.length > 0 &&
          (Number(data?.isPatientReceived) === 0 ? (
            <div
              onClick={handleModalState}
              className="header p-1"
              style={{ cursor: "pointer" }}
            >
              <svg
                width={17}
                height={17}
                viewBox="0 0 64 64"
                fill={"black"}
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="12"
                  y="8"
                  width="40"
                  height="48"
                  rx="4"
                  ry="4"
                  fill="#fff"
                  stroke="#000"
                  strokeWidth="2"
                />
                <rect
                  x="24"
                  y="4"
                  width="16"
                  height="8"
                  rx="2"
                  ry="2"
                  fill="#f2c744"
                  stroke="#000"
                  strokeWidth="2"
                />
                <circle cx="18" cy="22" r="3" fill="#ff5f5f" />
                <rect x="26" y="20" width="20" height="2" rx="1" fill="#000" />
                <circle cx="18" cy="32" r="3" fill="#ff995f" />
                <rect x="26" y="30" width="20" height="2" rx="1" fill="#000" />
                <circle cx="18" cy="42" r="3" fill="#ffcf5f" />
                <rect x="26" y="40" width="20" height="2" rx="1" fill="#000" />
              </svg>
            </div>
          ) : (
            <SeeMoreSlideScreen
              seeMore={handleBindFrameMenuByRoleIDS(BindFrameMenuByRoleIDS)}
              handleChangeComponent={(item) =>
                handleComponentRender(data, item, urgentOrderData)
              }
            />
          ))}

        {modalHandlerState?.show && (
          <Modal
            visible={modalHandlerState?.show}
            setVisible={() =>
              setModalHandlerState({
                show: false,
                component: null,
                size: null,
              })
            }
            modalWidth={modalHandlerState?.size}
            Header={modalHandlerState?.header}
            footer={modalHandlerState?.footer}
            CancelbuttonName={showNotAdmittedReason ? undefined : t("No")}
            buttonName={showNotAdmittedReason ? undefined : t("Yes")}
            handleAPI={showNotAdmittedReason ? undefined : handleisPatientReceived}
          >
            {modalHandlerState?.component}
          </Modal>
        )}

        <Dialog
          header={t("Reason for Not Admitting")}
          visible={reasonDialogVisible}
          style={{ width: window.innerWidth <= 768 ? "90vw" : "30vw" }}
          onHide={() => setReasonDialogVisible(false)}
          draggable={false}
          footer={
            <div className="d-flex justify-content-end" style={{ gap: "10px" }}>
              <button className="btn btn-sm btn-secondary" onClick={() => setReasonDialogVisible(false)}>
                {t("Cancel")}
              </button>
              <button
                className="btn btn-sm btn-success"
                disabled={!notAdmittedReason.trim()}
                onClick={handleSaveNotAdmitted}
              >
                {t("Save")}
              </button>
            </div>
          }
        >
          <div style={{ padding: "5px" }}>
            <label style={{ fontWeight: 600, fontSize: "14px", marginBottom: "8px", display: "block" }}>
              {t("Reason for Not Admitting")}
            </label>
            <textarea
              className="form-control"
              rows={4}
              value={notAdmittedReason}
              onChange={(e) => setNotAdmittedReason(e.target.value)}
              placeholder={t("Enter reason...")}
              style={{ resize: "vertical" }}
              autoFocus
            />
          </div>
        </Dialog>
      </div>
    </>
  );
}

export default PatientDetailCard;
