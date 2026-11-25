import React, { useEffect, useRef, useState } from "react";
import ReactSelect from "../formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { GetBindAllDoctorConfirmation } from "../../store/reducers/common/CommonExportFunction";
import TimePicker from "../formComponent/TimePicker";
import DatePicker from "../formComponent/DatePicker";
import moment from "moment";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import {
  BindDocDetails,
  DoctorAndRoomShift,
  handleValidateUserToBill,
} from "../../networkServices/BillingsApi";
import { CancelDoctorShift } from "../../networkServices/DoctorShiftRequestApi";
import { notify } from "../../utils/utils";
import DoctorShiftTable from "../UI/customTable/billings/DoctorShiftTable";
import Modal from "../modalComponent/Modal";
import Input from "../formComponent/Input";

const DoctorShift = ({ activeClass, data }) => {
  const { t } = useTranslation();
  const ip = useLocalStorage("ip", "get");
  const dispatch = useDispatch();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [DoctorDetail, setDoctorDetail] = useState([]);
  const [errors, setErrors] = useState({});
  const [payload, setPayload] = useState({
    Doctor: "",
    shiftDate: new Date(),
    shiftTime: new Date(),
  });

  const handleReactSelect = (name, value) => {
    setPayload((val) => ({
      ...val,
      [name]: value?.value || "",
      [`label_${name}`]: value?.label,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload({
      ...payload,
      [name]: value,
    });
  };

  const { GetBindAllDoctorConfirmationData } = useSelector(
    (state) => state.CommonSlice,
  );

  useEffect(() => {
    dispatch(
      GetBindAllDoctorConfirmation({
        Department: "All",
      }),
    );
  }, [dispatch]);

  const geBindDocDetails = async () => {
    const TransactionID = data?.transactionID
      ? data?.transactionID
      : data?.TransactionID;
    try {
      const response = await BindDocDetails(TransactionID);
      setDoctorDetail(response?.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    geBindDocDetails();
  }, []);
  console.log(data);
  console.log(payload);
  const ErrorHandling = () => {
    let errors = {};
    errors.id = [];
    if (payload?.Doctor === "") {
      errors.Doctor = "Doctor is required";
      errors.id[errors.id?.length] = "DoctorFocus";
    }
    if (payload?.Doctor == data?.doctorID) {
      errors.Doctor = "Doctor should not be Same";
      errors.id[errors.id.length] = "DoctorFocus";
    }

    return errors;
  };
  let userData = useLocalStorage("userData", "get");
  const [password, setPassword] = useState("");
  const [userConfirmation, setUserConfirmation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleValidateUserToBillConfirmation = async () => {
    if (!password) {
      notify(t("Please Enter Password"), "error");
      return;
    }

    const requestbody = {
      userId: userData?.employeeID,
      password: password,
    };

    try {
      const response = await handleValidateUserToBill(requestbody);
      if (response?.success || response?.status) {
        notify(response?.message || "Verification Successful", "success");
        setUserConfirmation(false);
        setShowPassword(false);
        setPassword("");
        DoctorShiftSave();
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
    setUserConfirmation(false);
    setShowPassword(false);
    setPassword("");
  };
const passwordRef = useRef(null);
useEffect(() => {
  if (userConfirmation) {
     setTimeout(() => {
      if (passwordRef.current) {
        passwordRef.current.focus();
      }
    }, 100); 
  }
}, [userConfirmation]);
  const handleSave = () => {
    const customerrors = ErrorHandling();
    if (Object.keys(customerrors)?.length > 1) {
      if (Object.values(customerrors)[0]) {
        notify(Object.values(customerrors)[1], "error");
        setErrors(customerrors);
      }
      return;
    }
    setPassword("");
    if (userData?.validateUserForBill) {
      setUserConfirmation(true);
    } else {
      DoctorShiftSave();
    }
  };
  const DoctorShiftSave = async () => {
    try {
      const requestBody = {
        type: activeClass ? String(activeClass) : "",
        tid: Number(data?.transactionID ?? data?.TransactionID ?? 0),
        startDate: payload?.shiftDate
          ? moment(payload?.shiftDate).format("DD-MMM-YYYY")
          : "",
        time: moment(payload?.shiftTime).format("hh:mm:ss A"),
        doctorID: payload?.Doctor ? Number(payload?.Doctor) : 0,
        ipAddress: ip || "",
        DoctorName: payload?.label_Doctor ? payload?.label_Doctor : "",
        roomID: payload?.IPDCaseTypeID ? Number(payload?.IPDCaseTypeID) : 0,
        availRooms: payload?.RoomBed ? Number(payload?.RoomBed) : 0,
        panelID: data?.panelID ? Number(data?.panelID) : 0,
        patientID: String(data?.patientID ?? data?.PatientID ?? ""),
        billCategory: payload?.BillingCategory
          ? String(payload?.BillingCategory)
          : "",
        scheduleChargeID: data?.scheduleChargeID
          ? Number(data?.scheduleChargeID)
          : 0,
      };

      const response = await DoctorAndRoomShift(requestBody);

      if (response?.success) {
        notify(response?.message, "success");
        geBindDocDetails();
        setPayload({
          Doctor: "",
          shiftDate: new Date(),
          shiftTime: new Date(),
        });
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.error("Something went wrong", error);
    }
  };
  const handleCancelShift = async (item) => {
    if (!window.confirm(t("Are you sure you want to cancel this doctor shift?"))) return;
    try {
      const response = await CancelDoctorShift({
        id: Number(item?.ID || 0),
        transactionID: Number(data?.transactionID ?? data?.TransactionID ?? 0),
      });
      if (response?.success) {
        notify(response?.message, "success");
        geBindDocDetails();
      } else {
        notify(response?.message || t("Something went wrong"), "error");
      }
    } catch (error) {
      notify(t("Something went wrong"), "error");
    }
  };

  const thead = [
    t("S.No."),
    t("Admitted Under"),
    t("Current Doctor"),
    t("Entry Date"),
    t("Leave Date"),
    t("User"),
    t("Status"),
  ];
  return (
    <>
      {userConfirmation && (
        <Modal
          visible={userConfirmation}
          setVisible={setUserConfirmation}
          modalWidth="30vw"
          Header={t("User verification")}
          buttonType="button"
          modalData={false}
          handleAPI={handleValidateUserToBillConfirmation}
          buttonName={t("Yes")}
          handleCancelComment={handleCancelComment}
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
                className={`form-control required-fields w-100`}
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
      )}
      <div className="row m-2">
        <ReactSelect
          placeholderName={t("Select Doctor")}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          id={"Doctor"}
          name={"Doctor"}
          value={payload?.Doctor}
          removeIsClearable={true}
          handleChange={handleReactSelect}
          dynamicOptions={GetBindAllDoctorConfirmationData.map((item) => ({
            label: item?.Name,
            value: item?.DoctorID,
          }))}
        />
        <DatePicker
          className="custom-calendar"
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
          id="shiftDate"
          name="shiftDate"
          value={payload?.shiftDate}
          handleChange={handleChange}
          label={t("Shift Date")}
          placeholder={VITE_DATE_FORMAT}
        />
        <TimePicker
          placeholderName={t("Shift Time")}
          respclass="col-xl-2 col-md-4 col-sm-4 col-sm-4 col-12"
          id="shiftTime"
          name="shiftTime"
          value={payload?.shiftTime}
          handleChange={handleChange}
        />
        <div className="co-sm-2">
          <button className="btn btn-sn btn-success" onClick={handleSave}>
            {t("Shift")}
          </button>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-12">
          <DoctorShiftTable THEAD={thead} tbody={DoctorDetail} onCancel={handleCancelShift} />
        </div>
      </div>
    </>
  );
};

export default DoctorShift;
