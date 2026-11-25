import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Divider } from "primereact/divider";
import React, { useEffect, useRef, useState } from "react";
import NotificationModal from "../../../components/modalComponent/Utils/NotificationModal";
import Modal from "../../../components/modalComponent/Modal";

const NotificationsDropdown = () => {
  const [t] = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModal, setIsModal] = useState(false);
  const [isNotification, SetIsNotification] = useState(false);
  const { GetNotifications } = useSelector((state) => state.CommonSlice);
  const dropdownRef = useRef(null);



  /* const handlePrevClick = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 5);
    }
  }; */

  /* const handleNextClick = () => {
    if (currentIndex + 5 < GetNotifications?.length) {
      setCurrentIndex(currentIndex + 5);
    }
  }; */

  // const GetNotifications = [
  //   { message: "Sample Notification 1" },
  //   { message: "Sample Notification 2" },
  //   { message: "Sample Notification 3" },
  // ];
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        SetIsNotification(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <Modal
        visible={isModal}
        setVisible={setIsModal}
        modalWidth="40vw"
        Header={t("Message")}
        footer={<></>}
      >
        <NotificationModal />
      </Modal>

      {/* 
      ===========================
      OLD DROPDOWN DESIGN (COMMENTED)
      ===========================
      <NotificationMenu hideArrow>
        <div slot="head">
          <i className="far fa-bell text-white" />
          <span className="badge badge-warning navbar-badge">
            {GetNotifications.length}
          </span>
        </div>
        <div slot="body">
          <span className="dropdown-item dropdown-header">
            {GetNotifications?.message}
          </span>
          <div className="dropdown-divider" />
          {GetNotifications?.slice(currentIndex, currentIndex + 5)?.map(
            (item, key) => {
              return (
                <Link to={item?.pagePath} className="dropdown-item" key={key} >
                  <div className="overflow-x-hidden text-truncate" onClick={() => setIsModal(true)}>
                    <i className="fas fa-envelope mr-2" />
                    <span>{item?.message}</span>
                    <span className="float-right text-muted text-sm">
                      {t("measurement.quantityUnit", {
                        quantity: "3",
                        unit: "mins",
                      })}
                    </span>
                  </div>
                </Link>
              );
            }
          )}
          <Divider />
          {GetNotifications?.length > 5 && (
            <div className="d-flex justify-content-center mb-3">
              <button
                className={
                  currentIndex === 0
                    ? "grayColorBtnDisabled btn btn-sm mx-3"
                    : "btn btn-sm btn-primary mx-3"
                }
                type="button"
                onClick={handlePrevClick}
                disabled={currentIndex === 0}
              >
                <i className="pi pi-arrow-left"></i>
              </button>
              <button
                className={
                  currentIndex + 5 >= GetNotifications?.length
                    ? "grayColorBtnDisabled btn btn-sm"
                    : "btn btn-sm btn-primary"
                }
                type="button"
                onClick={handleNextClick}
                disabled={currentIndex + 5 >= GetNotifications?.length}
              >
                <i className="pi pi-arrow-right"></i>
              </button>
            </div>
          )}
        </div>
      </NotificationMenu>
      */}

      {/* ===========================
          ACTIVE DROPDOWN DESIGN
      =========================== */}
      <div className="position-relative d-inline-block" ref={dropdownRef}>
        <div onClick={() => SetIsNotification(!isNotification)}>
          <i className="far fa-bell text-white fs-4"></i>
          <span className="badge bg-warning text-dark position-absolute top-0 start-100 translate-middle navbar-Notificationbadge">
            {GetNotifications?.length ?? 0}
          </span>
        </div>

        {isNotification && (
          <div
            className={`position-absolute notification-dropdown-body ${GetNotifications?.length <= 5 ? "" : "notification-dropdown-body-height"
              }`}
          >
            <span className="dropdown-header p-0">
              {GetNotifications?.length <= 0 ? (
                <span className="dropdown-header">{t("Notification Not Found")}</span>
              ) : (
                GetNotifications?.map((item, key, arr) => (
                  <React.Fragment key={key}>
                    <Link /* to={item?.pagePath} */ className="dropdown-item">
                      <div
                        className="overflow-x-hidden text-truncate text-left"
                        onClick={() => setIsModal(true)}
                      >
                        <i className="fas fa-envelope mr-2" />
                        {item?.message}
                      </div>
                    </Link>
                    {key < arr.length - 1 && <hr className="m-0" />}
                  </React.Fragment>
                ))
              )}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationsDropdown;
