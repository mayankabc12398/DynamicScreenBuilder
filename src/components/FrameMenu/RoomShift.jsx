import React, { useEffect, useRef, useState } from "react";
import ReactSelect from "../formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import TimePicker from "../formComponent/TimePicker";
import DatePicker from "../formComponent/DatePicker";
import moment from "moment";
import { handleReactSelectDropDownOptions, notify } from "../../utils/utils";
import {
  BillingCategory,
  BindRoomBed,
  BindRoomDetails,
  DoctorAndRoomShift,
  handleValidateUserToBill,
  IPDAdmissionReport,
  RoomTypeWithoutRoleFilter,
} from "../../networkServices/BillingsApi";
import { CancelRoomShift } from "../../networkServices/DoctorShiftRequestApi";
import { RedirectURL } from "../../networkServices/PDFURL";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import RoomShiftTable from "../UI/customTable/billings/RoomShiftTable";
import Input from "../formComponent/Input";
import Modal from "../modalComponent/Modal";

const RoomShift = ({ activeClass, data }) => {
  console.log({ data });

  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;
  const ip = useLocalStorage("ip", "get");
  const { GetGlobalResources } = useSelector((state) => state?.CommonSlice);
  const globalResourcesList = Array.isArray(GetGlobalResources)
    ? GetGlobalResources
    : GetGlobalResources?.data || [];
  const printAdmissionOnRoomShift =
    globalResourcesList?.find((item) => item?.Name === "PrintAdmissionFormOnRoomShift")
      ?.Value === "1";
  const [RoomDetail, setRoomDetail] = useState([]);
  const [errors, setErrors] = useState({});
  const [DropDownState, setDropDownState] = useState({
    getRoomType: [],
    getBindRoomBed: [],
    getBillingCategory: [],
  });

  const [payload, setPayload] = useState({
    Doctor: "",
    IPDCaseTypeID: "",
    RoomBed: "",
    BillingCategory: "",
    shiftDate: new Date(),
    shiftTime: new Date(),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload({
      ...payload,
      [name]: value,
    });
  };

  const handleReactSelect = async (name, value, secondName) => {
    // debugger
    const obj = { ...payload };
    obj[name] = value?.value || "";
    if (secondName) obj[secondName] = value?.BillingCategoryID || "";

    // if (secondName) obj[secondName] = value?.value || "";
    setPayload(obj);
    if (name === "IPDCaseTypeID") {
      const response = await getBindRoom({ caseType: value.value });
      setDropDownState((prevState) => ({
        ...prevState,
        getBindRoomBed: response,
      }));
    }
  };

  const getBindRoomType = async () => {
    try {
      const data = await RoomTypeWithoutRoleFilter();
      return data?.data;
    } catch (error) {
      console.error(error);
    }
  };

  const getBindRoom = async (params) => {
    const newPayload = {
      caseType: String(params.caseType),
      isDisIntimated: 0,
      type: "1",
      bookingDate: "",
    };

    try {
      const dataRes = await BindRoomBed(newPayload);
      return dataRes?.data;
    } catch (error) {
      console.error(error);
    }
  };

  const getBindBillingCategory = async () => {
    try {
      const data = await BillingCategory();
      return data?.data;
    } catch (error) {
      console.error(error);
    }
  };
  const geBindRoomDetails = async () => {
    const TransactionID = data?.transactionID || data?.TransactionID;
    try {
      const response = await BindRoomDetails(TransactionID);
      setRoomDetail(response?.data);
    } catch (error) {
      console.error(error);
    }
  };

  const commonFetchAllDropDown = async () => {
    try {
      const response = await Promise.all([
        getBindRoomType(),
        getBindBillingCategory(),
      ]);

      const responseDropdown = {
        getRoomType: handleReactSelectDropDownOptions(
          response[0],
          "Name",
          "IPDCaseTypeID",
        ),
        getBillingCategory: handleReactSelectDropDownOptions(
          response[1],
          "Name",
          "IPDCaseTypeID",
        ),
      };

      return responseDropdown;
    } catch (error) {
      console.log(error, "Something Went Wrong");
    }
  };

  const FetchAllDropDown = async () => {
    try {
      const responseDropdown = await commonFetchAllDropDown();
      setDropDownState(responseDropdown);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    FetchAllDropDown();
    geBindRoomDetails();
  }, []);

  const ErrorHandling = () => {
    let errors = {};
    errors.id = [];
    if (!payload?.IPDCaseTypeID) {
      errors.IPDCaseTypeID = "Room Type Is Required";
      errors.id[errors.id?.length] = "IPDCaseTypeIDFocus";
    }
    if (!payload?.RoomBed) {
      errors.RoomBed = "Room/Bed Is Required";
      errors.id[errors.id?.length] = "RoomBedFocus";
    }
    if (payload?.RoomBed == data?.roomId) {
      errors.RoomBed = "Room/Bed should not be Same";
      errors.id[errors.id?.length] = "RoomBedFocus";
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
        RoomShiftSave();
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
      RoomShiftSave();
    }
  };
  const RoomShiftSave = async () => {
    try {
      const requestBody = {
        type: activeClass ? String(activeClass) : "",
        tid: Number(data?.transactionID ?? data?.TransactionID ?? 0),

        startDate: payload?.shiftDate
          ? moment(payload?.shiftDate).format("DD-MMM-YYYY")
          : "",
        time: payload?.shiftTime
          ? moment(payload?.shiftTime).format("hh:mm A")
          : "",
        doctorID: 0,
        ipAddress: ip || "",
        roomID: payload?.IPDCaseTypeID ? Number(payload?.IPDCaseTypeID) : 0,
        availRooms: payload?.RoomBed ? Number(payload?.RoomBed) : 0,
        panelID: Number(data?.panelID ?? data?.PanelID ?? 0),

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
        geBindRoomDetails();
        setPayload({
          Doctor: "",
          IPDCaseTypeID: "",
          RoomBed: "",
          BillingCategory: "",
          shiftDate: new Date(),
          shiftTime: new Date(),
        });
        if (printAdmissionOnRoomShift) {
          const transactionID = data?.transactionID ?? data?.TransactionID;
          try {
            const reportResp = await IPDAdmissionReport(Number(transactionID), 2);
            if (reportResp?.success) {
              RedirectURL(reportResp?.data?.pdfUrl);
            }
          } catch (err) {
            console.error("Admission form print failed", err);
          }
        }
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.error("Something went wrong", error);
    }
  };
  const handleCancelShift = async (item) => {
    if (!window.confirm(t("Are you sure you want to cancel this room shift?"))) return;
    try {
      const response = await CancelRoomShift({
        id: Number(item?.ID || 0),
        transactionID: Number(data?.transactionID ?? data?.TransactionID ?? 0),
      });
      if (response?.success) {
        notify(response?.message, "success");
        geBindRoomDetails();
      } else {
        notify(response?.message || t("Something went wrong"), "error");
      }
    } catch (error) {
      notify(t("Something went wrong"), "error");
    }
  };

  const thead = [
    t("S.No."),
    t("IPD No."),
    t("UHID"),
    t("Patient Name"),
    t("Room Type"),
    t("Room"),
    t("Entry Date"),
    t("Leave Date"),
    t("Shifted By"),
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
          placeholderName={t("Room_Type")}
          id={"IPDCaseTypeID"}
          name="IPDCaseTypeID"
          value={payload?.IPDCaseTypeID}
          handleChange={(name, e) =>
            handleReactSelect(name, e, "BillingCategory")
          }
          // dynamicOptions={DropDownState?.getRoomType?.map((item) => ({
          //   label: item?.Name,
          //   value: item?.IPDCaseTypeID,
          // }))}

          dynamicOptions={handleReactSelectDropDownOptions(
            DropDownState?.getRoomType ? DropDownState?.getRoomType : "",
            "Name",
            "IPDCaseTypeID",
          )}
          searchable={true}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          requiredClassName={`required-fields ${errors?.IPDCaseTypeID ? "required-fields-active" : ""}`}
        />

        <ReactSelect
          placeholderName={t("Room BedNo")}
          id={"RoomBed"}
          searchable={true}
          respclass="col-xl-2 col-md-2 col-sm-6 col-12"
          name="RoomBed"
          dynamicOptions={DropDownState?.getBindRoomBed?.map((item) => ({
            label: item?.Name,
            value: item?.RoomID,
          }))}
          value={payload?.RoomBed}
          handleChange={handleReactSelect}
          requiredClassName={`required-fields ${errors?.RoomBed ? "required-fields-active" : ""}`}
        />

        <ReactSelect
          isDisabled={true}
          placeholderName={t("Billing Category")}
          id={"BillingCategory"}
          searchable={true}
          respclass="col-xl-2 col-md-2 col-sm-6 col-12"
          name="BillingCategory"
          dynamicOptions={DropDownState?.getBillingCategory?.map((item) => ({
            label: item?.Name,
            value: item?.IPDCaseTypeID,
          }))}
          value={payload?.BillingCategory}
          handleChange={handleReactSelect}
        />

        <DatePicker
          className="custom-calendar"
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          id="shiftDate"
          name="shiftDate"
          value={payload?.shiftDate}
          handleChange={handleChange}
          label={t("Shift Date")}
          placeholder={VITE_DATE_FORMAT}
          // inputClassName="required-fields"
        />

        <TimePicker
          placeholderName={t("Shift Time")}
          respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          id="shiftTime"
          name="shiftTime"
          value={payload?.shiftTime}
          handleChange={handleChange}
          // className="required-fields"
        />

        <div className="col-sm-2">
          <button className="btn btn-sn btn-success" onClick={handleSave}>
            {t("Shift")}
          </button>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-12">
          <RoomShiftTable THEAD={thead} tbody={RoomDetail} onCancel={handleCancelShift} />
        </div>
      </div>
    </>
  );
};

export default RoomShift;
