import React, { useEffect, useState } from "react";

const MessageCard = ({ header, children, key, variant, autoClose = true }) => {
  const [show, setShow] = useState(true);
  const [timeoutId, setTimeoutId] = useState(null);

  const handleClose = () => {
    setShow(false);
  };

  const clearTimeOut = (timeout) => {
    if (timeout) {
      clearTimeout(timeout);
    }
  };

  useEffect(() => {
    if (show && autoClose) {
      const timeout = setTimeout(() => {
        setShow(false);
      }, 5000);

      setTimeoutId(timeout);

      return () => clearTimeOut(timeout);
    }
  }, [show, key, autoClose]);


  const isModern = variant === "modern";

  return (
    show && (
      <>
        <div
          className={
            isModern ? "notification-content-modern" : "notification-content"
          }
          onMouseEnter={() => clearTimeOut(timeoutId)}
          onMouseLeave={() => {
            if (autoClose) {
              const timeout = setTimeout(() => {
                setShow(false);
              }, 5000);
              setTimeoutId(timeout);
            }
          }}
          key={key}
        >
          <div
            className={
              isModern
                ? "notification-modern-header"
                : "d-flex justify-content-between align-items-center"
            }
          >
            <div className={isModern ? "notification-modern-title" : ""}>
              {header}
            </div>
            <i
              className={`fa fa-times ${
                isModern ? "notification-modern-close" : ""
              }`}
              aria-hidden="true"
              onClick={handleClose}
            ></i>
          </div>
          <div>
            <div>{children}</div>
          </div>
        </div>
      </>
    )
  );
};

export default MessageCard;
