import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../../Modal";
import Input from "../../../formComponent/Input";
import { notify } from "../../../../utils/utils";
import { handleValidateUserToBill } from "../../../../networkServices/BillingsApi";

export default function UserPasswordVerificationModal({
  visible,
  setVisible,
  userId,
  onSuccess,
  onCancel,
}) {
  const [t] = useTranslation();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        if (passwordRef.current) {
          passwordRef.current.focus();
        }
      }, 100);
    }
  }, [visible]);

  const handleValidateUserToBillConfirmation = async () => {
    if (!password) {
      notify(t("Please Enter Password"), "error");
      return;
    }

    const requestbody = {
      userId: userId,
      password: password,
    };

    try {
      const response = await handleValidateUserToBill(requestbody);
      if (response?.success || response?.status) {
        notify(response?.message || "Verification Successful", "success");
        setVisible(false);
        setShowPassword(false);
        setPassword("");
        if (onSuccess) onSuccess();
      } else {
        notify(response?.message || "Invalid Password", "error");
      }
    } catch (error) {
      notify(
        error?.response?.data?.message || "Authentication Failed",
        "error",
      );
      console.log(error);
    }
  };

  const handleCancelComment = () => {
    setVisible(false);
    setShowPassword(false);
    setPassword("");
    if (onCancel) onCancel();
  };

  return (
    <Modal
      visible={visible}
      setVisible={setVisible}
      modalWidth="30vw"
      Header={t("User verification")}
      buttonType="button"
      modalData={false}
      handleAPI={handleValidateUserToBillConfirmation}
      buttonName={t("Yes")}
      handleCancelComment={handleCancelComment}
      IsCancelFlag={true}
    >
      <div className="text-center">
        <div className="position-relative w-100">
          <Input
            inputRef={passwordRef}
            type={showPassword ? "text" : "password"}
            lable={"Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("Password")}
            className="form-control required-fields w-100"
            style={{ paddingRight: "35px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleValidateUserToBillConfirmation();
            }}
          />
          <i
            className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"} position-absolute`}
            style={{
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              color: "#6c757d",
              zIndex: 10,
            }}
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? t("Hide Password") : t("Show Password")}
          ></i>
        </div>
      </div>
    </Modal>
  );
}
