import i18n from "@app/utils/i18n";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactSelect from "../formComponent/ReactSelect";
import Button from "../formComponent/Button";
import { AutoComplete } from "primereact/autocomplete";
import {
  BindPackageItemDetailsNew,
  GetAppointmentCount,
  GetBindLabInvestigationRate,
  GetDiscountWithCoPay,
  GetDoctorAppointmentTimeSlotConsecutive,
  GetGlobalResources,
  GetIsDoctorVisitedToday,
  GetLoadOPD_All_ItemsLabAutoComplete,
  GetPackageExpirayDate,
  GetRoleWiseOPDServiceBookingControls,
  GetValidateDoctorLeave,
  GetValidateDoctorMap,
  OPDDoctorConsulationData,
  OPDGetIsFollowUpExist,
  getAlreadyPrescribeItem,
  BindInvestigation,
} from "../../networkServices/opdserviceAPI";
import {
  SearchFutureBookingInv,
  GetFutureBookingDetailsForBilling,
} from "../../networkServices/futureInvestigationsAPI";
import FutureInvestigationModal from "../modalComponent/Utils/FutureInvestigationModal";
import {
  AddInvestigation,
  ReactSelectisDefaultValue,
  calculateBillAmount,
  filterByType,
  filterByTypes,
  handlereferDocotorIDByReferalType,
  notify,
} from "../../utils/utils";
import {
  ROUNDOFF_VALUE,
  SEARCH_BY_TEST,
  SEARCH_BY_TEST_DEFAULT,
} from "../../utils/constant";
import Confirm from "../modalComponent/Confirm";
import moment from "moment/moment";
import { useDispatch, useSelector } from "react-redux";
import { GetAllDoctor } from "../../store/reducers/common/CommonExportFunction";
import Modal from "../modalComponent/Modal";
import CPOEModal from "../modalComponent/Utils/CPOEModal";
import DayCareOrderModal from "../modalComponent/Utils/DayCare/DayCareOrderModal";
import icCpoe from "../../assets/image/front-office/cpoe.svg";
import icReferral from "../../assets/image/front-office/referral.svg";
import icBookedInv from "../../assets/image/front-office/booked-inv.svg";
import ReferralRequestModal, {
  isBindable,
  readApiResult,
  referralButtonState,
} from "./ReferralRequestModal";
import InvestigationModal from "../modalComponent/Utils/InvestigationModal";
import { bindAppointmentDetail } from "../../networkServices/OPDConfirmation";
import { GetPatientReferralRequests } from "../../networkServices/DoctorApi";
import i18next from "i18next";
const t = (key, options) => i18next.t(key, options);
import { use } from "react";
import Input from "../formComponent/Input";
import { translateOptions } from "@components/WrapTranslate";

/* The action bar's three buttons carry their colour inline rather than through
   btn-primary / btn-success, because the theme repaints those classes a pale pink
   that makes the buttons disappear into the form around them. Inline wins over the
   stylesheet, and .order-blink only animates box-shadow and opacity, so the blink
   still works on top of these. */
const FO_BTN = {
  cpoe: "#2563eb",      // blue  - prescription orders waiting
  dayCare: "#0f766e",   // deep teal - day care orders waiting to be billed
  bookedInv: "#0d9488", // teal  - investigations already booked
  referral: {
    pending: "#ea580c", // orange - a referral still to be booked
    booked: "#16a34a",  // green  - all booked, do not bill again
    error: "#dc2626",   // red    - the list could not be read
    none: "#7c3aed",    // violet - nothing pending, but still findable
  },
};

/* height is left to the theme: .btn is height:2rem !important, so setting it here
   would be ignored anyway. */
const foBtnStyle = (background) => ({
  width: 46,
  padding: 0,
  flex: "0 0 auto",
  background,
  borderColor: background,
  color: "#fff",
  boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
});

function TestPayment({
  testPaymentState,
  setTestPaymentState,
  payloadData,
  singlePatientData,
  setTestAddingTable,
  testAddingTableState,
  handlePaymentGateWay,
  TestData,
  presetSlot,
  setPayloadData,
  UHID,
  isUserInteraction,
  selectedPanel,
  isMemberShipCardAccess,
  patientMembershipMap,
  onBindReferral,
}) {

  console.log("selectedPanel?.panelID", selectedPanel)
  const dispatch = useDispatch();
  let getCheckedData = [];
  const { BindResource } = useSelector((state) => state?.CommonSlice);
  // fin_global_resources list from Redux (GetGlobalResources here is the API import).
  const globalResourceRows = useSelector(
    (state) => state?.CommonSlice?.GetGlobalResources,
  );
  // Same key as the Doctor field's unit tooltip on OPD Booking (ShowUnitDoctorNames).
  const showUnitDoctorNames =
    Array.isArray(globalResourceRows) &&
    globalResourceRows.find((item) => item?.Name === "ShowUnitDoctorNames")
      ?.Value === "1";
  // Search Test: hovered unit item -> its doctors, shown in the same dark tooltip as the
  // Doctor field (the list lives in a floating panel, so it is placed by screen position).
  const [unitHover, setUnitHover] = useState(null);
  /* KeepDoctorOnVisitSelect = 1: adding a doctor visit (consultation) from Search Test
     no longer replaces the Doctor chosen at the top of OPD Booking. 0 = old behaviour
     (the top Doctor becomes the visit's doctor). */
  const keepDoctorOnVisitSelect =
    Array.isArray(globalResourceRows) &&
    String(
      globalResourceRows.find((item) => item?.Name === "KeepDoctorOnVisitSelect")
        ?.Value ?? "",
    ).trim() === "1";
  const ref = useRef();
  const [value, setValue] = useState("");
  const [items, setItems] = useState([]);
  const [dropDownState, setDropDown] = useState({
    RoleWiseOPDServiceBookingControlData: [],
  });

  let isRateZero = false;

  // const [OPDFollowUpSubCategory, setOPDFollowUpSubCategory] = useState("");

  const [confirmBoxvisible, setConfirmBoxvisible] = useState({
    show: false,
    alertMessage: "",
    lableMessage: "",
    chidren: "",
  });

  const [modalHandlerState, setModalHandlerState] = useState({
    header: null,
    show: false,
    size: null,
    component: null,
    footer: null,
  });

  const handlegetCheckedData = (rowData) => {
    getCheckedData = rowData?.filter((row, index) => row?.isChecked);
  };

  // ── Booked (future) investigations ─────────────────────────────────────
  let futureCheckedData = [];
  const handleFutureCheckedData = (rows) => {
    futureCheckedData = rows || [];
  };
  const [hasFutureBookings, setHasFutureBookings] = useState(false);
  const [hasCpoeOrders, setHasCpoeOrders] = useState(false);
  /* Today's referral requests from the doctor module. Held here rather than
     fetched again by the popup: the same rows both light the button and fill it. */
  const [referralRows, setReferralRows] = useState([]);
  /* Kept apart from "no rows": a referral that cannot be READ must not look like a
     patient who has none, or a doctor's request is quietly lost at the counter. */
  const [referralError, setReferralError] = useState("");
  const referralState = referralButtonState(referralRows);
  const pickedReferralRef = useRef(null);
  const handleReferralPicked = (row) => {
    pickedReferralRef.current = row;
  };

  // On patient load, detect pending orders so CPOE + Booked-Inv buttons blink.
  useEffect(() => {
    const patID =
      singlePatientData?.PatientID ||
      singlePatientData?.PatientId ||
      singlePatientData?.patientID;
    if (!patID) {
      setHasFutureBookings(false);
      setHasCpoeOrders(false);
      setReferralRows([]);
      setReferralError("");
      return;
    }
    let active = true;
    (async () => {
      try {
        const fres = await SearchFutureBookingInv({
          PatientID: patID,
          FromDate: "01-Jan-2000",
          ToDate: moment().add(2, "years").format("DD-MMM-YYYY"),
        });
        if (active) setHasFutureBookings((fres?.data || []).length > 0);
      } catch (e) {
        if (active) setHasFutureBookings(false);
      }
      try {
        const cres = await BindInvestigation({
          patientId: patID,
          fromDate: moment().format("DD-MM-YYYY"),
          toDate: moment().format("DD-MM-YYYY"),
          condition: "CPOE Prescription",
        });
        if (active) setHasCpoeOrders((cres?.data || []).length > 0);
      } catch (e) {
        if (active) setHasCpoeOrders(false);
      }
      try {
        // No date range: the API answers today's referrals, which is the case the
        // front office is watching for - a doctor referring a patient mid-clinic.
        const rres = await GetPatientReferralRequests(patID);
        if (active) {
          // A failed call comes back as the axios response, not as a throw.
          const { rows, error } = readApiResult(rres);
          setReferralRows(rows);
          setReferralError(error);
        }
      } catch (e) {
        // A thrown call is the API refusing or failing, not an empty diary.
        if (active) {
          setReferralRows([]);
          setReferralError(
            e?.response?.data?.message || e?.message || t("Could not read the referral requests"),
          );
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [
    singlePatientData?.PatientID,
    singlePatientData?.PatientId,
    singlePatientData?.patientID,
  ]);

  const handleFutureInvModalState = () => {
    setModalHandlerState({
      show: true,
      header: i18n.t("Booked Investigations"),
      size: "60vw",
      component: (
        <FutureInvestigationModal
          singlePatientData={singlePatientData}
          handlegetCheckedData={handleFutureCheckedData}
        />
      ),
      footer: (
        <div>
          <div className="d-flex align-items-center justify-content-between">
            <div></div>
            <div>
              <Button
                name={t("Add to Billing")}
                className={"btn btn-sm btn-primary mx-1"}
                handleClick={handleAddFutureInvestigation}
              />
            </div>
          </div>
        </div>
      ),
    });
  };

  // Load selected booked tests into billing the same way CPOE does — we fetch
  // the full CPOE billable shape per booking date and reuse testAddingObject.
  const handleAddFutureInvestigation = async () => {
    if (!futureCheckedData || futureCheckedData.length === 0) {
      notify(t("Please select at least one investigation"), "warn");
      return;
    }
    try {
      isRateZero = false;
      const patID =
        singlePatientData?.PatientID ||
        singlePatientData?.PatientId ||
        singlePatientData?.patientID;

      // group selected PatientTest_IDs by their booking date
      const byDate = {};
      futureCheckedData.forEach((tst) => {
        const d = tst?.BookingDate;
        if (!d) return;
        (byDate[d] = byDate[d] || []).push(String(tst?.PatientTest_ID));
      });

      const test = [];
      for (const date of Object.keys(byDate)) {
        const res = await GetFutureBookingDetailsForBilling(patID, date);
        const fullRows = res?.data || [];
        const wanted = new Set(byDate[date]);
        const matched = fullRows.filter((r) =>
          wanted.has(String(r?.PatientTest_ID)),
        );
        for (const data of matched) {
          const modifiedData = AddInvestigation(data);
          // Same rule as the CPOE path. These rows carry no urgent mark today, so
          // this reads 0 exactly as before - it is here so the two paths cannot
          // drift if they ever do.
          const addtesting = await testAddingObject(
            data,
            data?.isUrgent ? 1 : 0,
            data?.PatientTest_ID,
            1,
            1,
            modifiedData?.appointmentID,
          );
          if (addtesting) test.push(addtesting);
        }
      }

      if (test.length === 0) {
        notify(t("Selected investigations could not be loaded"), "warn");
        return;
      }

      handlePaymentGateWay(
        calculateBillAmount(
          [...test, ...testAddingTableState],
          BindResource?.isReceipt,
          singlePatientData?.OPDAdvanceAmount,
          false,
          1,
          0.0,
          ((selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID) === 1) ? 1 : 0,
          // payloadData?.panelID?.value === 1 ? 1 : 0,
          0,
        ),
      );
      const finalData = [...test, ...testAddingTableState];
      if (
        isRateZero &&
        BindResource?.IsShowItemWithoutRate == "0" &&
        testPaymentState?.category !== "1"
      ) {
        notify(t("Selected Item Does not have Rate"), "warn");
        return;
      }
      setTestAddingTable(finalData);
      setModalHandlerState({ show: false });
    } catch (error) {
      console.error("Error loading future investigations:", error);
    }
  };

  const handleInvestigationSlot = (data) => {
    setModalHandlerState({
      header: "Investigation Slot",
      show: true,
      size: "95vw",
      footer: <></>,
      component: (
        <div>
          <InvestigationModal
            data={data}
            handleSetData={(e) => handleAddInvestigationSlot(e, data)}
          />
        </div>
      ),
    });
  };

  useEffect(() => {
    //
    if (
      TestData.length > 0 &&
      Object.keys(singlePatientData).length > 0 &&
      selectedPanel?.PanelID &&
      payloadData?.panelID?.value &&
      payloadData?.panelID?.panelCurrencyFactor
    ) {
      // handleAddInvestigation(TestData);

      validateInvestigation(TestData[0], 0, 0, 1, 0, 0);
    }
  }, [TestData, singlePatientData, payloadData?.panelID, selectedPanel?.PanelID]);

  const handleAddInvestigation = async () => {
    //
    if (getCheckedData.length > 0) {
      try {
        isRateZero = false;
        const test = [];
        for (const data of getCheckedData) {
          //
          const modifiedData = AddInvestigation(data);

          /* Second argument is the billing line's urgent flag (the U column). It
             comes from the doctor's mark on the CPOE row, so a test prescribed as
             urgent arrives in billing already ticked instead of the counter having
             to remember which one the popup showed in red. */
          const addtesting = await testAddingObject(
            data,
            data?.isUrgent ? 1 : 0,
            data?.PatientTest_ID,
            1,
            1,
            modifiedData?.appointmentID,
          );

          // const AppointedDateTime = await bindAppointmentDetail(
          //   String(modifiedData?.appointmentID)
          // );

          // const reponseDataOfAppointedDateTime = AppointedDateTime?.data[0];

          // addtesting.AppointedDateTime = reponseDataOfAppointedDateTime
          //   ? `${reponseDataOfAppointedDateTime?.Date}#${reponseDataOfAppointedDateTime?.Time}-${reponseDataOfAppointedDateTime?.EndTime}`
          //   : "";
          // test.push({ ...addtesting, DoctorID: modifiedData?.DoctorID });

          // Skip items rejected by a validation guard inside testAddingObject.
          if (addtesting) test.push(addtesting);
        }

        handlePaymentGateWay(
          calculateBillAmount(
            [...test, ...testAddingTableState],
            BindResource?.isReceipt,
            singlePatientData?.OPDAdvanceAmount,
            false,
            1,
            0.0,
            ((selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID) === 1) ? 1 : 0,
            // payloadData?.panelID?.value === 1 ? 1 : 0,
            0,
          ),
        );
        const finalData = [...test, ...testAddingTableState];
        if (
          isRateZero &&
          BindResource?.IsShowItemWithoutRate == "0" &&
          testPaymentState?.category !== "1"
        ) {
          notify(t("Selected Item Does not have Rate"), "warn");
          return;
        } else {
          setTestAddingTable(finalData);
        }
        // setTestAddingTable(finalData);
        TestData.pop();
        setModalHandlerState({ show: false });
      } catch (error) {
        console.error("Error validating investigation:", error);
      }
    } else {
      console.log("No data to validate.");
    }
  };

  /* Day Care Order - the same popup shape as CPOE, pointed at investigations
     ordered from Day Care. It reuses handlegetCheckedData and the same
     Add Investigation footer, so a ticked day care row reaches the bill through
     exactly the path a ticked CPOE row does; only the source list differs. */
  const handleDayCareOrderState = () => {
    setModalHandlerState({
      show: true,
      header: i18n.t("Day Care Order"),
      size: "70vw",
      component: (
        <DayCareOrderModal
          singlePatientData={singlePatientData}
          handlegetCheckedData={handlegetCheckedData}
        />
      ),
      footer: (
        <div>
          <div className="d-flex align-items-center justify-content-between">
            <div></div>
            <div>
              <Button
                name={t("Add Investigation")}
                className={"btn btn-sm btn-primary mx-1"}
                handleClick={handleAddInvestigation}
              />
            </div>
          </div>
        </div>
      ),
    });
  };

  const handleModalState = () => {
    setModalHandlerState({
      show: true,
      header: i18n.t("Prescription Search"),
      size: "70vw",
      component: (
        <CPOEModal
          singlePatientData={singlePatientData}
          handlegetCheckedData={handlegetCheckedData}
        />
      ),
      footer: (
        <div>
          <div className="d-flex align-items-center justify-content-between">
            <div></div>
            <div>
              <Button
                name={t("Add Investigation")}
                className={"btn btn-sm btn-primary mx-1"}
                handleClick={handleAddInvestigation}
              />

              {/* <Button
                name={"Close"}
                className={"btn btn-sm btn-primary mx-1"}
              /> */}
            </div>
          </div>
        </div>
      ),
    });
  };

  /* Referral popup. Binding points the booking at the doctor the referral names -
     department first, because the Doctor list on this screen is loaded per
     department - so the visit is booked against the right doctor. The front
     office still adds the consultation service and takes the payment; the bind
     is the part that was being re-keyed by hand off a phone call. */
  const handleBindPickedReferral = () => {
    const row = pickedReferralRef.current;
    if (!row) {
      notify(t("Please select a referral request"), "warn");
      return;
    }
    if (!isBindable(row)) {
      notify(
        row?.isBooked
          ? t("An appointment for this referral is already booked")
          : t("This referral cannot be booked at this centre"),
        "warn",
      );
      return;
    }
    if (typeof onBindReferral !== "function") return;
    onBindReferral(row);
    setModalHandlerState({ show: false, component: null, size: null });
    notify(
      `${t("Referral bound")}: ${row?.referToName || ""}`.trim(),
      "success",
    );
  };

  const handleReferralModalState = () => {
    setModalHandlerState({
      show: true,
      header: i18n.t("Referral Requests"),
      size: "70vw",
      component: (
        <ReferralRequestModal
          singlePatientData={singlePatientData}
          rows={referralRows}
          error={referralError}
          onSelectionChange={handleReferralPicked}
        />
      ),
      footer: (
        <div>
          <div className="d-flex align-items-center justify-content-between">
            <div></div>
            <div>
              <Button
                name={t("Bind Referral")}
                className={"btn btn-sm btn-primary mx-1"}
                handleClick={handleBindPickedReferral}
              />
            </div>
          </div>
        </div>
      ),
    });
  };

  const handleGetLoadOPD_All_ItemsLabAutoComplete = async (payload) => {
    try {
      const data = await GetLoadOPD_All_ItemsLabAutoComplete(payload);
      return data?.data?.length > 0 ? data?.data : [];
    } catch (error) {
      console.log(error, "error`");
    }
  };

  const search = async (event) => {
    if (event?.query?.length < 3) {
      return;
    }
    const item = await handleGetLoadOPD_All_ItemsLabAutoComplete({
      searchType: testPaymentState?.searchType,
      prefix: event?.query.trim(),
      type: testPaymentState?.type ? testPaymentState?.type : "100",
      categoryID: testPaymentState?.category ? testPaymentState?.category : "",
      subCategoryID: testPaymentState?.subCategory
        ? testPaymentState?.subCategory
        : "",
      itemID: "",
      doctorID: "",
      // PanelID: payloadData?.panelID?.PanelID,
      PanelID: selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID,
    });
    setItems(item);
  };

  const checkPatientFollowup = async (subID, doctorID) => {
    try {
      const response =
        payloadData?.panelID?.IsFollowupApplicable === 1 &&
        (await OPDGetIsFollowUpExist(
          singlePatientData?.PatientID,
          payloadData?.DoctorID,
        ));
      if (response?.success) {
        handleconsulationBooking(response?.data, doctorID);
        setTestPaymentState((preV) => ({
          ...preV,
          subCategory: response?.data,
        }));
      } else {
        handleconsulationBooking(
          subID ? subID : testPaymentState?.subCategory,
          doctorID,
        );
        setTestPaymentState((preV) => ({
          ...preV,
          subCategory: subID ? subID : testPaymentState?.subCategory,
        }));
      }
    } catch (error) {
      console.log(error, "error`");
    }
  };

  const IsRegistrationApplicables = localStorage.getItem("RegistrationChargeApplicable") || "0";
  const IsRegistrationChargeOncePerDoctorPerDay =
    localStorage.getItem("RegistrationChargeOncePerDoctorPerDay") || "0";

  // True when this patient was already booked TODAY with this same doctor.
  // A different doctor on the same day, or the same doctor on a later day, is
  // not a match - those still get the registration charge.
  // The server reads patient_medical_history, where the saved OPD booking
  // lands. Appointment is not usable here: a booking made without a slot
  // leaves no row there at all.
  const hasSameDoctorVisitToday = async (doctorID) => {
    const cleanDoctorID = String(doctorID ?? "").trim();
    const patientID = String(
      singlePatientData?.PatientID ||
        singlePatientData?.PatientId ||
        singlePatientData?.patientID ||
        ""
    ).trim();
    if (!cleanDoctorID || !patientID) {
      return false;
    }
    try {
      const res = await GetIsDoctorVisitedToday(patientID, cleanDoctorID);
      return Number(res?.data?.IsVisitedToday) === 1;
    } catch (error) {
      console.log(error, "error");
      return false;
    }
  };

  const registration = async () => {
    // && payloadData?.Source !== "OUTSOURCE"

    const isChargePerDoctorPerDay =
      IsRegistrationChargeOncePerDoctorPerDay === "1";

    if (
      // BindResource?.IsRegistrationApplicable === "1" &&
      IsRegistrationApplicables === "1" &&
      // f_panel_master.IsRegistrationChargeApplicable: 1 = this panel charges registration (added automatically
      // while the patient has not taken it yet, see the Registration check below); 0 = it never does.
      Number(selectedPanel?.IsRegistrationChargeApplicable) === 1 &&
      // Registration is patient_master.IsRegistrationApply: it is set to 1 on
      // the very first charge and never cleared, so on its own it would stop
      // the charge for good. Under the per-doctor-per-day rule the charge has
      // to come back for a new doctor and on the next day, so that flag is left
      // out of the decision and today's booking with this doctor decides.
      (isChargePerDoctorPerDay || singlePatientData?.Registration === 0) &&
      // payloadData?.panelID?.PanelGroupID === 1 &&
      payloadData?.DoctorID
    ) {
      if (isChargePerDoctorPerDay) {
        // Registration charges already sitting on this bill - the booking is
        // not saved yet, so no Appointment row exists to find it by.
        const alreadyOnBill = testAddingTableState?.some(
          (data) =>
            String(data?.NewItemID || data?.ItemID || "") ===
            String(BindResource?.RegistrationItemID),
        );
        if (alreadyOnBill) {
          return;
        }
        // Same doctor, same day: the charge was already taken on the first
        // booking, so skip it.
        const bookedTodayWithSameDoctor = await hasSameDoctorVisitToday(
          payloadData?.DoctorID
        );
        if (bookedTodayWithSameDoctor) {
          return;
        }
      }

      const payload = {
        searchType: SEARCH_BY_TEST_DEFAULT,
        doctorID: "",
        prefix: "",
        type: "all",
        categoryID: 0,
        subCategoryID: 0,
        // "itemID": 9,
        itemID: BindResource?.RegistrationItemID,
        // PanelID: payloadData?.panelID?.PanelID,
        PanelID: selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID,
      };

      const item = await handleGetLoadOPD_All_ItemsLabAutoComplete(payload);
      if (item) {
        const payload = {
          value: item[0],
        };

        validateInvestigation(payload, 0, 0, 1, 0, 0);
      }
    }
  };

  useEffect(() => {
    // if (payloadData?.Source === "OUTSOURCE") {
    //   return
    // }
    //
    if (BindResource?.RegistrationItemID && selectedPanel?.PanelID) {
      // if (BindResource?.RegistrationItemID && payloadData?.panelID?.PanelID) {
      !isUserInteraction.current && registration();
    }
  }, [
    // payloadData?.panelID?.PanelID,
    selectedPanel?.PanelID,
    singlePatientData?.PatientID,
    payloadData?.DoctorID,
    payloadData?.panelID,
  ]);

  const IsAutoDoctorConsultation =
    localStorage.getItem("AutoDoctorConsultationOnSelect") || "0";

  // Doctor picked -> the consultation charge should reach the bill on its own.
  // Setting Type = Consultation is all that is needed: the consultation effects
  // further down already read the doctor's subcategory and add the item, which
  // is the same path the user takes when choosing Type / Category by hand.
  useEffect(() => {
    if (IsAutoDoctorConsultation !== "1") {
      return;
    }
    if (!payloadData?.DoctorID) {
      return;
    }
    if (!(selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID)) {
      return;
    }
    // Already on Consultation - a doctor change is handled by the effects below.
    if (testPaymentState?.type === "4") {
      return;
    }
    // This doctor's consultation is already on the bill.
    const alreadyOnBill = testAddingTableState?.some(
      (item) =>
        Number(item?.CategoryID) === 1 &&
        String(item?.Type_ID ?? "") === String(payloadData?.DoctorID),
    );
    if (alreadyOnBill) {
      return;
    }
    // setTestPaymentState((preV) => ({ ...preV, type: "4", category: "1" }));
  }, [
    payloadData?.DoctorID,
    selectedPanel?.PanelID,
    payloadData?.panelID,
  ]);

  // Booked from the Appointment Calendar (presetSlot = doctor + date + time picked in its Doctor Slot popup):
  // once the patient and scheme are in, make that doctor the booking doctor and let his consultation
  // (First Visit / Follow Up - the same path as choosing Type = Consultation by hand) come onto the bill
  // by itself. handleDoctorSlotTime() then gives that row the picked date and time.
  const presetDoctorSets = useRef(0);
  const presetConsultTried = useRef("");
  useEffect(() => {
    if (!presetSlot?.doctorID) return;
    if (!(Object.keys(singlePatientData || {}).length > 0)) return;
    if (!(selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID)) return;
    if (String(payloadData?.DoctorID ?? "").trim() !== String(presetSlot.doctorID)) {
      // the patient search fills the doctor of the last visit - replace it (a few times only, never fight the user)
      if (presetDoctorSets.current < 3) {
        presetDoctorSets.current += 1;
        // functional update: a copy of payloadData taken from this render would wipe the panel the
        // patient search sets at the same moment (parentID then went to the API as null)
        setPayloadData((prev) => ({
          ...prev,
          DoctorID: presetSlot.doctorID,
          SelectDoctor: presetSlot.doctorID,
          DoctorName: presetSlot.doctorName,
        }));
      }
      return;
    }
    const key = `${singlePatientData?.PatientID}|${presetSlot.doctorID}|${presetSlot.date}|${presetSlot.time}`;
    if (presetConsultTried.current === key) return;
    presetConsultTried.current = key;
    const alreadyOnBill = testAddingTableState?.some(
      (item) => Number(item?.CategoryID) === 1 && String(item?.Type_ID ?? "") === String(presetSlot.doctorID),
    );
    if (alreadyOnBill) return;
    setTestPaymentState((prev) => ({ ...prev, type: "4", category: "1" }));
  }, [presetSlot, singlePatientData, selectedPanel?.PanelID, payloadData?.panelID, payloadData?.DoctorID]);

  const itemTemplate = (item) => {
    // Unit consultation (e.g. MED I): the search API sends the unit's active doctors.
    // Hover shows "MED I - Total Doctor: 2" and one doctor per line, like the Doctor field.
    const unitCount = Number(item?.UnitDoctorCount || 0);
    const unitNames = String(item?.UnitDoctorNames || "")
      .split(", ")
      .map((name) => name.trim())
      .filter(Boolean);
    const unitText =
      showUnitDoctorNames && unitCount > 0
        ? `${String(item?.typeName || "").trim()} - ${t("Total Doctor")}: ${unitCount}` +
          (unitNames.length > 0 ? `\n${unitNames.join("\n")}` : "")
        : "";
    return (
      <div
        className="p-clearfix"
        onMouseEnter={
          unitText
            ? (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                // In the empty right-hand part of the hovered row, level with it - not over other items.
                setUnitHover({ text: unitText, top: rect.top + rect.height / 2, left: rect.right - 75 });
              }
            : undefined
        }
        onMouseLeave={unitText ? () => setUnitHover(null) : undefined}
      // onClick={() => validateInvestigation(item, 0, 0, 1, 0)}
      >
        <div style={{ float: "left", fontSize: "12px", width: "100%" }}>
          {item?.autoCompleteItemName}
        </div>
      </div>
    );
  };

  const FetchAllDropDown = async () => {
    try {
      const response = await Promise.all([
        GetRoleWiseOPDServiceBookingControls(),
      ]);

      setDropDown({
        RoleWiseOPDServiceBookingControlData: response[0]?.data,
      });
    } catch (error) {
      console.log(error, "error");
    }
  };

  const handleReactSelect = (name, e) => {
    if (name === "category") {
      // "0" is this screen's "nothing picked yet" sentinel (see the subCategory
      // guards below) - resetting to "" instead let a bare Category change (type=4
      // Consultation, category auto/manually set to 1) read as "a subcategory was
      // picked" and silently auto-add the doctor's follow-up visit.
      setTestPaymentState((preV) => ({
        ...preV,
        subCategory: "0",
      }));
    }

    const { value } = e === null ? {} : e;
    setTestPaymentState((preV) => ({
      ...preV,
      [name]: value ?? e,
    }));
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTestPaymentState((val) => ({ ...val, [name]: value }));
  };
  /* const getGlobalResourseApiData = async () => {
    try {
      const data = await GetGlobalResources();

      const resources = data?.data?.length > 0 ? data.data : [];

      const registrationChargeApplicable = resources.find(
        (item) => item.Name === "RegistrationChargeApplicable"
      );
      localStorage.setItem(
        "RegistrationChargeApplicable",
        registrationChargeApplicable?.Value || "0"
      );

      // Registration charge once per doctor per day. Switchable from
      // fin_global_resources: the row has to be IsActive = 1 (GetGlobalResources
      // returns only those) and Value = 1, otherwise the charge behaves as before.
      const registrationChargeOncePerDoctorPerDay = resources.find(
        (item) => item.Name === "RegistrationChargeOncePerDoctorPerDay"
      );
      localStorage.setItem(
        "RegistrationChargeOncePerDoctorPerDay",
        registrationChargeOncePerDoctorPerDay?.Value || "0"
      );

      // Consultation charge added as soon as a doctor is picked. Same switch
      // style: IsActive = 1 and Value = 1, otherwise the user still has to
      // choose Type / Category by hand as before.
      const autoDoctorConsultationOnSelect = resources.find(
        (item) => item.Name === "AutoDoctorConsultationOnSelect"
      );
      localStorage.setItem(
        "AutoDoctorConsultationOnSelect",
        autoDoctorConsultationOnSelect?.Value || "0"
      );

      return resources;
    } catch (error) {
      console.log(error, "error");
    }
  }; */

  useEffect(() => {
    FetchAllDropDown();
    dispatch(GetAllDoctor());
    // getGlobalResourseApiData()
  }, []);

  const handleMakeStringToArray = (...rest) => {
    const data = rest?.reduce((acc, current) => {
      let splitStr = current?.value.split(",");
      let resultArray = splitStr.map((str) => str.replace(/'/g, ""));
      acc[current?.returnName] = resultArray;
      return acc;
    }, {});
    return data;
  };

  const handleGetPackageExpirayDate = async (PackageID, TnxTypeID) => {
    if (TnxTypeID != "23") {
      return true;
    }
    try {
      const data = await GetPackageExpirayDate(PackageID);
      return data?.data;
    } catch (error) {
      console.log(error, "error");
    }
  };

  const handleGetValidateDoctorMap = async (itemID, labType) => {
    if (labType === "OPD") {
      try {
        const data = await GetValidateDoctorMap(itemID);
        return data?.data;
      } catch (error) {
        console.log(error, "error");
      }
    } else {
      return true;
    }
  };

  const handleGetValidateDoctorLeave = async (itemID) => {
    try {
      const data = await GetValidateDoctorLeave(itemID);
      return data?.data;
    } catch (error) {
      console.log(error, "error");
    }
  };

  const handleGetDiscountWithCoPay = async (
    itemID,
    panelID,
    PatientTypeID,
    memberShipCardNo,
  ) => {
    try {
      const data = await GetDiscountWithCoPay(
        itemID,
        panelID,
        PatientTypeID,
        memberShipCardNo,
      );
      return data?.data;
    } catch (error) {
      console.log(error, "error");
    }
  };

  const handleGetAlreadyPrescribeItem = async (PatientID, itemID) => {
    try {
      const data = await getAlreadyPrescribeItem(PatientID, itemID);
      return data?.data;
    } catch (error) {
      console.log(error, "error");
    }
  };
  //
  const handleGetBindLabInvestigationRate = async (
    panelID,
    ItemID,
    CategoryID,
    TID,
    IPDCaseTypeID,
    panelCurrencyFactor,
  ) => {
    try {
      //
      const data = await GetBindLabInvestigationRate(
        panelID,
        ItemID,
        CategoryID,
        singlePatientData?.IsInternational,
        TID,
        IPDCaseTypeID,
        panelCurrencyFactor,
      );

      return data?.data;
    } catch (error) {
      console.log(error, "error");
    }
  };

  const handleGetAppointmentCount = async (
    tnxType,
    DoctorID,
    AppointedDate,
  ) => {
    if (tnxType === "5") {
      try {
        // An unparsable date ("Invalid date") makes the API fail with
        // "The string 'Invalid date' was not recognized as a valid DateTime",
        // so anything that is not a real date is replaced by today.
        const parsedDate = moment(
          AppointedDate,
          ["YYYY-MM-DD", "DD-MMM-YYYY", "DD-MM-YYYY", "DD/MM/YYYY", moment.ISO_8601],
          true,
        );
        const safeDate = parsedDate.isValid()
          ? parsedDate.format("YYYY-MM-DD")
          : moment().format("YYYY-MM-DD");
        const data = await GetAppointmentCount(DoctorID, safeDate);
        return data?.data ?? "00";
      } catch (error) {
        console.log(error, "error");
      }
    }
  };

  const handlePackageDetailsData = (packageData) => {
    for (let i = 0; i < packageData?.length > 0; i++) {
      if (Number(packageData[i]["PackageType"]) !== 2) {
        packageData[i]["DoctorID"] = Number(payloadData?.DoctorID);
        packageData[i]["DoctorName"] = payloadData?.DoctorName;
      } else if (
        ["0", 0, ""].includes(packageData[i]["InvestigationIdActual"]) &&
        Number(payloadData?.DoctorID)
      ) {
        // consultation visit with no doctor fixed in the package master: the booking's doctor by default
        packageData[i]["Investigation_Id"] = Number(payloadData?.DoctorID);
        packageData[i]["DoctorID"] = Number(payloadData?.DoctorID);
        packageData[i]["DoctorName"] = payloadData?.DoctorName;
        packageData[i]["Item"] = payloadData?.DoctorName;
      }
    }

    return packageData;
  };

  const handleBindPackageItemDetailsNew = async (TnxTypeID, packageID) => {
    if (TnxTypeID === "23") {
      try {
        const data = await BindPackageItemDetailsNew(packageID);
        const returnData = handlePackageDetailsData(data?.data);
        return returnData;
      } catch (error) {
        console.log(error, "error");
      }
    } else {
      return [];
    }
  };

  const handleDoctorSlotTime = async (modifiedData) => {
    try {
      isRateZero = false;
      // SubCategoryID is the visit being booked (First Visit / Emergency Visit /
      // Follow Up ...). Leaving it out sent 0, which switches DoctorTimingSlot's
      // visit filter off, so the slot picked here could belong to a different
      // visit's window. The slot popup does pass it, which is why it showed only
      // expired slots while the booking already held a valid looking time.
      // Booked from the Appointment Calendar: that doctor's consultation takes the date and time picked there
      const usePreset =
        presetSlot?.doctorID && String(presetSlot.doctorID) === String(modifiedData?.Type_ID) && presetSlot?.date;
      if (usePreset) modifiedData.AppointedDate = presetSlot.date;
      const apiResponse = await GetDoctorAppointmentTimeSlotConsecutive(
        modifiedData?.Type_ID,
        modifiedData?.AppointedDate,
        modifiedData?.SubCategoryID,
      );
      if (apiResponse?.success) {
        const AppointedDateTime =
          (usePreset &&
            apiResponse.data.find(
              (ele) => ele?.FromTimeDisplay === presetSlot.time && Number(ele?.SlotStatusID) === 1,
            )) ||
          apiResponse.data.find((ele) => ele?.IsDefault === 1);

        // A slot is only ever marked IsDefault while it is still Available, so
        // nothing here means every slot for this visit has passed or is taken.
        if (!AppointedDateTime) {
          notify(
            "No slot is available for this visit. Please choose another appointment date or visit type.",
            "warn",
          );
        }

        modifiedData.AppointedDateTime = AppointedDateTime
          ? `${AppointedDateTime?.SlotDateDisplay}#${AppointedDateTime?.FromTimeDisplay}-${AppointedDateTime?.ToTimeDisplay}`
          : "";
        const AddRow = [modifiedData, ...testAddingTableState];

        handlePaymentGateWay(
          calculateBillAmount(
            AddRow,
            BindResource?.isReceipt,
            singlePatientData?.OPDAdvanceAmount,
            false,
            0,
            0.0,
            ((selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID) === 1) ? 1 : 0,
            // payloadData?.panelID?.value === 1 ? 1 : 0,
            0,
          ),
        );

        // setTestAddingTable(AddRow);
        if (
          isRateZero &&
          BindResource?.IsShowItemWithoutRate == "0" &&
          AddRow[0]?.CategoryID !== 1
        ) {
          notify(t("Selected Item Does not have Rate"), "warn");
          return;
        } else {
          // Added this code for change culsultaion and
          // setTestAddingTable(test);
          if (modifiedData?.type === "4") {
            const CulsultaionfilterData = JSON.parse(
              JSON.stringify(AddRow),
            )?.filter((ele) => ele?.type !== "4");
            const updateDoctor = [modifiedData, ...CulsultaionfilterData]?.map(
              (val) => {
                return { ...val, DoctorID: payloadData?.DoctorID };
              },
            );

            handlePaymentGateWay(
              calculateBillAmount(
                updateDoctor,
                BindResource?.isReceipt,
                singlePatientData?.OPDAdvanceAmount,
                false,
                0,
                0.0,
                ((selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID) === 1) ? 1 : 0,
                // payloadData?.panelID?.value === 1 ? 1 : 0,
                0,
              ),
            );


            setTestAddingTable(updateDoctor);
            // setTestAddingTable(AddRow);
          } else {

            setTestAddingTable(AddRow);
          }
        }
      } else {
        notify(apiResponse?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleApiCallforTestAdding = async (modifiedData) => {
    //
    const packageData = await handleBindPackageItemDetailsNew(
      modifiedData?.TnxTypeID,
      modifiedData?.Type_ID,
    );

    modifiedData.PackageTable = packageData;

    const tokenData = await handleGetAppointmentCount(
      modifiedData?.TnxTypeID,
      modifiedData?.Type_ID,
      modifiedData?.AppointedDate,
    );

    modifiedData.Token = tokenData;

    // first Api
    const data = await handleGetPackageExpirayDate(
      modifiedData?.Type_ID,
      modifiedData?.TnxTypeID,
    );

    if (data) {
      // SecondApi
      const secondData = await handleGetValidateDoctorMap(
        modifiedData?.val,
        modifiedData?.LabType,
      );

      if (secondData) {
        // third Api

        const thirdData = await handleGetValidateDoctorLeave(modifiedData?.val);

        if (!thirdData) {
          // fourth APi
          const fouthData = await handleGetAlreadyPrescribeItem(
            singlePatientData?.PatientID,
            modifiedData?.val,
          );

          const userDecision = await new Promise((resolve) => {
            if (Object.keys(fouthData)?.length > 0) {
              setConfirmBoxvisible({
                show: true,
                lableMessage: <div>{t("Do You Want To Prescribe Again ?")}</div>,
                alertMessage: (
                  <div>
                    {t("This Service is Already Prescribed By")}{" "}
                    <span style={{ color: "blue", fontWeight: 700 }}>
                      {fouthData?.UserName}{" "}
                    </span>
                    {t("Date on")}{" "}
                    <span style={{ color: "blue", fontWeight: 700 }}>
                      {fouthData?.EntryDate}
                    </span>
                  </div>
                ),
                chidren: (
                  <div>
                    <button
                      className="btn btn-sm btn-primary mx-1"
                      onClick={() => {
                        setConfirmBoxvisible({
                          show: false,
                          alertMessage: "",
                          lableMessage: "",
                          chidren: "",
                        });
                        resolve(true); // Prescribe Again
                      }}
                    >
                      {t("Prescribe Again")}
                    </button>

                    {/* {testPaymentState?.type !== "4" && <button
                      className="btn btn-sm btn-primary mx-1"
                      onClick={() => {

                        setConfirmBoxvisible({
                          show: false,
                          alertMessage: "",
                          lableMessage: "",
                          chidren: "",
                        });
                        resolve(true); // Prescribe Again
                      }}
                    >
                      Prescribe Again
                    </button>} */}

                    <button
                      className="btn btn-sm btn-danger mx-1"
                      onClick={() => {
                        setConfirmBoxvisible({
                          show: false,
                          alertMessage: "",
                          lableMessage: "",
                          chidren: "",
                        });
                        resolve(false); // Cancel
                      }}
                    >
                      {t("Cancel")}
                    </button>
                  </div>
                ),
              });
            } else {
              resolve(true); // No need to confirm, proceed with prescribing
            }
          });

          if (Object.keys(fouthData).length === 0 || userDecision) {
            //orcondition confirmation modal
            // Fifth Api
            console.log(payloadData);

            const fifthData = await handleGetDiscountWithCoPay(
              modifiedData?.val,
              // payloadData?.panelID?.value,
              selectedPanel?.PanelID ?? payloadData?.panelID?.value,
              singlePatientData?.PatientTypeID,
              singlePatientData?.MemberShipCardNo,
            );

            const sixthData = await handleGetBindLabInvestigationRate(
              String(selectedPanel?.PanelID ?? payloadData?.panelID?.value),
              String(modifiedData?.val),
              String(modifiedData?.CategoryID),
              "",
              "",
              String(selectedPanel?.panelCurrencyFactor??payloadData?.panelID?.panelCurrencyFactor),
            );
            const memberRow = patientMembershipMap?.get(
              Number(modifiedData?.val),
            );
            modifiedData.discountPercentage = memberRow?.DiscPer
              ? Number(memberRow.DiscPer)
              : fifthData?.OPDPanelDiscAmount > 0
                ? 0
                : parseFloat(fifthData?.OPDPanelDiscPercent) || 0;

            modifiedData.IsPanelWiseDiscount =
              Number(fifthData?.OPDPanelDiscPercent) > 0 ? 1 : 0;
            modifiedData.coPaymentPercent =
              parseFloat(fifthData?.OPDCoPayPercent) || 0;

            modifiedData.IsPayable =
              fifthData?.IsPayble !== undefined && fifthData?.IsPayble !== null
                ? String(fifthData?.IsPayble)
                : "0";

            modifiedData.salesID = "";

            modifiedData.IsDiscountEnable = true;

            modifiedData.Rate = sixthData?.Rate ?? 0;
            modifiedData.constantRate = modifiedData.Rate;
            modifiedData.IsEmergencyRateApplied = sixthData?.IsEmergencyRateApplied ?? false;
            modifiedData.ERate = sixthData?.ERate ?? 0;
            modifiedData.ScheduleChargeID = sixthData?.ScheduleChargeID ?? 0;
            modifiedData.ID = sixthData?.ID ?? 0;
            modifiedData.ItemCode = sixthData?.ItemCode ?? "";
            modifiedData.ItemDisplayName = sixthData?.ItemDisplayName
              ? sixthData?.ItemDisplayName.trim() === ""
                ? modifiedData?.label
                : sixthData?.ItemDisplayName
              : modifiedData?.label;
            const discounAmountCalculation =
              Number(modifiedData.Rate) * Number(modifiedData?.defaultQty) <
                fifthData?.OPDPanelDiscAmount
                ? Number(modifiedData.Rate) * Number(modifiedData?.defaultQty)
                : fifthData?.OPDPanelDiscAmount;
            modifiedData.discountAmount =
              discounAmountCalculation > 0
                ? discounAmountCalculation
                : Number(modifiedData.Rate) *
                Number(modifiedData?.defaultQty) *
                Number(modifiedData?.discountPercentage) *
                0.01;

            modifiedData.amount =
              Number(modifiedData?.Rate) * Number(modifiedData?.defaultQty) -
              modifiedData?.discountAmount;

            modifiedData.GSTAmount = Number(
              Number(modifiedData.amount * modifiedData.GstPer * 0.01).toFixed(
                ROUNDOFF_VALUE,
              ),
            );

            modifiedData.coPaymentAmount = Number(
              Number(
                modifiedData.amount * modifiedData?.coPaymentPercent * 0.01,
              ).toFixed(ROUNDOFF_VALUE),
            );

            modifiedData.panelID = selectedPanel?.PanelID ?? payloadData?.panelID?.value;
            // modifiedData.panelID = payloadData?.panelID?.value;

            modifiedData.grossAmount =
              Number(modifiedData?.Rate) * Number(modifiedData?.defaultQty);
            modifiedData.discountPercentageWithoutRoundoff = modifiedData?.discountPercentage

            const initialAmount =
              // payloadData?.panelID?.IsCash === 1
              selectedPanel?.IsCash ?? payloadData?.panelID?.IsCash === 1
                ? modifiedData?.amount
                : modifiedData?.coPaymentAmount;

            modifiedData.PayableAmount =
              initialAmount && initialAmount !== 0
                ? initialAmount
                : modifiedData?.IsPayable === "1"
                  ? modifiedData?.amount
                  : modifiedData?.coPaymentAmount;

            // modifiedData.PayableAmount =
            //   payloadData?.panelID?.IsCash === 1 ? modifiedData?.amount : modifiedData?.coPaymentAmount ||
            //     modifiedData?.IsPayable === "1" ? modifiedData?.amount : modifiedData?.coPaymentAmount
            //
            // isRateZero =  Object.keys(sixthData).length > 0? true : false

            if (Object.keys(sixthData).length > 0 && sixthData?.Rate > 0) {
              isRateZero = false;
            } else {
              notify(t("Selected Item's Rate is Zero"), "warn");
              isRateZero = true;
            }

            return modifiedData;
          }
        }
      }
    }
  };

  const DoctorBindDefaultChecker = (tnxtypeID, DoctorID, type_ID, value) => {
    if (![5, 23].includes(Number(tnxtypeID))) {
      return Number(DoctorID);
    } else {
      if (Number(tnxtypeID) === 5 && !keepDoctorOnVisitSelect) {
        setPayloadData({
          ...payloadData,
          ["DoctorID"]: Number(type_ID),
          ["DoctorName"]: value?.typeName || "",
          referDoctorID: handlereferDocotorIDByReferalType(
            payloadData?.referalTypeID?.value,
            Number(type_ID),
            payloadData?.referDoctorID,
          ),
        });
      }
      return "";
    }
  };

  const testAddingObject = async (
    value,
    isUrgent,
    presribedID,
    defaultQty,
    isCpoeOrOnline,
    appointmentID,
  ) => {
    // console.log("bodyDatabodyDatabodyDatabodyData",payloadData)
    //
    const AppointTypeDropDown = filterByTypes(
      dropDownState?.RoleWiseOPDServiceBookingControlData,
      [6],
      ["TypeID"],
      "TextField",
      "ValueField",
      "IsDefault",
    );

    const checker = testAddingTableState.some(
      (row) => row?.val === value?.item_ID,
    );
    //
    // const opdChecker = testAddingTableState.some((row) => {

    //   return (Number(row?.DoctorID) === Number(value?.DoctorID)) &&
    //   (Number(row?.CategoryID) === Number(value?.categoryid));
    // });

    // if (opdChecker) {
    //   notify("A patient can have only one consultation with the same doctor under the same bill.", "error");
    //   return;
    // }
    //
    if (checker) {
      notify(t("Test Allready Exist!"), "error");
      return;
    }

    // ;
    const modifiedData = {
      label: value?.autoCompleteItemName,
      val: value?.item_ID,
      ConfigID: value?.ConfigID,
      isadvance: value?.isadvance,
      IsOutSource: value?.isOutSource,
      ItemCode: value?.itemCode,
      Type_ID: value?.type_ID,
      LabType: value?.labType,
      TnxTypeID: value?.tnxtype,
      SubCategoryID: value?.subCategoryID,
      sampleType: value?.sample,
      TypeName: value?.typeName,
      rateEditAble: value?.rateEditable,
      isMobileBooking: 0,
      CategoryID: value?.categoryid,
      isSlotWiseToken: value?.isSlotWisetoken,
      appointmentID: appointmentID,
      GstType: value?.SalesTaxGroupName,
      // IgstPercent: value?.iGSTPercent,
      // CgstPercent: value?.cGSTPercent,
      // SgstPercent: value?.sGSTPercent,
      GstPer: Number(value?.SaleTaxPercentage).toFixed(ROUNDOFF_VALUE),
      isUrgent: isUrgent,
      presribedID: presribedID,
      defaultQty: defaultQty,
      isCpoeOrOnline: isCpoeOrOnline,
      AppointedType: AppointTypeDropDown,
      DoctorName: presribedID ? value?.DoctorName : payloadData?.DoctorName,
      AppointedDate: moment().format("YYYY-MM-DD"),
      DoctorID: DoctorBindDefaultChecker(
        value?.tnxtype,
        payloadData?.DoctorID,
        value?.type_ID,
        value,
      ),
      typeOfApp: ReactSelectisDefaultValue(AppointTypeDropDown, "extraColomn")
        ?.value,
      type: value?.type, // This is for to check cunsultaion
      IsByPassDoctorSlot: value?.IsByPassDoctorSlot,
      SalesTaxGroupName: String(
        value?.SalesTaxGroupName ? value?.SalesTaxGroupName : "",
      ),
      SaleTaxPercentage: Number(
        value?.SaleTaxPercentage ? value?.SaleTaxPercentage : 0,
      ),
      PurchaseTaxPercentage: Number(
        value?.PurchaseTaxPercentage ? value?.PurchaseTaxPercentage : 0,
      ),
      PurchaseTaxGroupName: String(
        value?.PurchaseTaxGroupName ? value?.PurchaseTaxGroupName : "",
      ),
      SubCategory: value?.SubCategory,
      Category: value?.Category,
      SubCatDisplayName: value?.SubCatDisplayName,
      IsMembershipCard: value?.IsMembershipCard,
      itemID: value?.item_ID,
    };

    const apiCallData = await handleApiCallforTestAdding(modifiedData);



    return apiCallData;
  };

  const setTestAddingTableAfterPanelChange = async () => {
    try {
      isRateZero = false;
      const test = [];

      for (const data of testAddingTableState) {
        if (
          Number(selectedPanel?.IsRegistrationChargeApplicable) === 0 &&
          String(data?.NewItemID || data?.ItemID || "") === String(BindResource?.RegistrationItemID)
        ) {
          continue;
        }
        const apiCallData = await handleApiCallforTestAdding(data);
        // handleApiCallforTestAdding returns undefined when a validation guard
        // rejects the item; keep the existing row so the bill array never holds
        // an undefined entry (calculateBillAmount threw on it).
        test.push(apiCallData || data);
      }

      const hasRegInTest = test.some(
        (data) => String(data?.NewItemID || data?.ItemID || "") === String(BindResource?.RegistrationItemID)
      );

      // Same rule as registration(): under the per-doctor-per-day flag the
      // sticky patient flag is ignored and today's booking with this doctor
      // decides, so a panel change cannot re-add a charge that was skipped.
      const isChargePerDoctorPerDay =
        IsRegistrationChargeOncePerDoctorPerDay === "1";
      const skipForSameDoctorToday =
        isChargePerDoctorPerDay &&
        (await hasSameDoctorVisitToday(payloadData?.DoctorID));

      if (
        Number(selectedPanel?.IsRegistrationChargeApplicable) === 1 &&
        !hasRegInTest &&
        !skipForSameDoctorToday &&
        (isChargePerDoctorPerDay || singlePatientData?.Registration === 0) &&
        IsRegistrationApplicables === "1" &&
        payloadData?.DoctorID
      ) {
        const payload = {
          searchType: SEARCH_BY_TEST_DEFAULT,
          doctorID: "",
          prefix: "",
          type: "all",
          categoryID: 0,
          subCategoryID: 0,
          itemID: BindResource?.RegistrationItemID,
          PanelID: selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID,
        };

        const item = await handleGetLoadOPD_All_ItemsLabAutoComplete(payload);
        if (item && item.length > 0) {
          const apiCallData = await handleApiCallforTestAdding(item[0], 0, 0, 1, 0, 0);
          test.push(apiCallData);
        }
      }

      handlePaymentGateWay(
        calculateBillAmount(
          test,
          BindResource?.isReceipt,
          singlePatientData?.OPDAdvanceAmount,
          false,
          1,
          0.0,
          // payloadData?.panelID?.value === 1 ? 1 : 0,
          ((selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID) === 1) ? 1 : 0,
          0,
        ),
      );
      if (
        isRateZero &&
        BindResource?.IsShowItemWithoutRate == "0" &&
        testPaymentState?.category !== "1"
      ) {
        notify(t("Selected Item Does not have Rate"), "warn");
        return;
      } else {

        setTestAddingTable(test);
      }
      // setTestAddingTable(test);
      // console.log("All investigations validated successfully.");
    } catch (error) {
      console.error("Error validating investigation:", error);
    }
  };

  useEffect(() => {
    if (selectedPanel?.PanelID && testAddingTableState.length > 0) {
      setTestAddingTableAfterPanelChange();
    }
  }, [selectedPanel?.PanelID, payloadData?.panelID?.value]);

  const handleAddInvestigationSlot = (data) => {
    const AddRow = [data, ...testAddingTableState];

    handlePaymentGateWay(
      calculateBillAmount(
        AddRow,
        BindResource?.isReceipt,
        singlePatientData?.OPDAdvanceAmount,
        false,
        0,
        0.0,
        ((selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID) === 1) ? 1 : 0,
        // payloadData?.panelID?.value === 1 ? 1 : 0,
        0,
      ),
    );
    if (
      isRateZero &&
      BindResource?.IsShowItemWithoutRate == "0" &&
      testPaymentState?.category !== "1"
    ) {
      notify(t("Selected Item Does not have Rate"), "warn");
      return;
    } else {

      setTestAddingTable(AddRow);
    }
    // setTestAddingTable(AddRow);

    setModalHandlerState({
      header: null,
      show: false,
      size: null,
      component: null,
      footer: null,
    });
  };
  console.log("objectobjectobjectobjectobject", payloadData?.panelID?.value);
  const validateInvestigation = async (
    e,
    isUrgent,
    presribedID,
    defaultQty,
    isCpoeOrOnline,
    appointmentID,
  ) => {
    if (!selectedPanel?.PanelID) {
    // if (!payloadData?.panelID?.value) {
      notify(t("Please select the panel first."), "error");
      return 0;
    }
    if (!payloadData?.DoctorID) {
      notify(t("Please Select Doctor First"), "error");
      return 0;
    }

    setValue("");
    let data = {};
    if (
      String(e?.value?.NewItemID) ===
      String(BindResource?.RegistrationItemID) &&
      testAddingTableState?.length > 0
    ) {
      const datattt = testAddingTableState.map((item) => ({
        ...item,
        DoctorID: payloadData?.DoctorID,
      }));

      setTestAddingTable(datattt);
      return 0;
    } else {
      isRateZero = false;

      //
      data = await testAddingObject(
        e?.value ? e?.value : e,
        isUrgent,
        presribedID,
        defaultQty,
        isCpoeOrOnline,
        appointmentID,
      );
    }

    //
    // if(BindResource?.IsShowItemWithoutRate=="0" && (sixthData?.Rate ==0 || !sixthData)){
    //   // alert("mmskmkm")

    //   return
    // }

    if (data?.CategoryID === "7" && data?.isMobileBooking === 0) {
      handleInvestigationSlot(data);
    } else if (data?.TnxTypeID === "5") {
      //
      handleDoctorSlotTime(data);
    } else {
      const AddRow = data
        ? [data, ...testAddingTableState]
        : [...testAddingTableState];
      // handlePaymentGateWay(
      //   calculateBillAmount(
      //     AddRow,
      //     BindResource?.isReceipt,
      //     singlePatientData?.OPDAdvanceAmount,
      //     false,
      //     0,
      //     0.0,
      //     payloadData?.panelID?.value === 1 ? 1 : 0,
      //     0
      //   )
      // );
      //
      if (
        isRateZero &&
        BindResource?.IsShowItemWithoutRate === "0" &&
        testPaymentState?.category !== "1"
      ) {
        // isUserInteraction.current && notify("Selected Item Does not have Rate", "warn")
        // return
      }
      // else {
      //

      // if(BindResource?.RegistrationItemID){
      setTestAddingTable(AddRow);
      const checkAppointData = AddRow?.find((ele) => ele?.typeOfApp === "1");
      //

      handlePaymentGateWay(
        calculateBillAmount(
          AddRow,
          BindResource?.isReceipt,
          singlePatientData?.OPDAdvanceAmount,
          false,
          checkAppointData ? 4 : 0,
          0.0,
          ((selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID) === 1) ? 1 : 0,
          // payloadData?.panelID?.value === 1 ? 1 : 0,
          0,
        ),
      );
      // }

      // }
    }
  };


  // ===========================================================================
  // Registration Charge along with an OPD Consultation item.
  //
  // When any item with CategoryID = 1 (OPD CONSULTATION) reaches the bill, the
  // Registration Charge item is added with it, next to the doctor visit.
  //
  // The on/off switch lives in the DB table fin_global_resources:
  //     Name  = 'AutoAddRegistrationOnConsultation'
  //     Value = '1' -> on.  '0', or no row at all -> off.
  // That row reaches the UI through CommonAPI/BindResourceList, which reads the
  // table live. A site that does not want this simply has no row, so the same
  // code ships everywhere and nothing has to be changed to switch it off.
  //
  // Which item gets added is BindResource.RegistrationItemID, from the same
  // table, so the charge item is configurable per site too.
  //
  // Nothing existing is modified by this: it only reads the bill rows, which is
  // why every route an item can arrive by - Search Test, CPOE, Booked Inv and
  // the doctor-slot flow - is covered without touching those handlers.
  // ===========================================================================
  const IsAutoAddRegistrationOnConsultation =
    String(BindResource?.AutoAddRegistrationOnConsultation ?? "0") === "1";

  // Safety latch. The effect reacts to the bill rows and also writes to them, so
  // if an added row ever failed the "already on bill" test it would keep adding
  // for ever. This limits it to one attempt while a consultation is on the bill,
  // and rearms only when the consultation is gone.
  const registrationAutoAddTried = useRef(false);

  const addRegistrationChargeItem = async () => {
    const item = await handleGetLoadOPD_All_ItemsLabAutoComplete({
      searchType: SEARCH_BY_TEST_DEFAULT,
      doctorID: "",
      prefix: "",
      type: "all",
      categoryID: 0,
      subCategoryID: 0,
      itemID: BindResource?.RegistrationItemID,
      PanelID: selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID,
    });

    if (!item?.length) {
      return;
    }

    // validateInvestigation() is deliberately not used for this item: it has an
    // early branch for RegistrationItemID that only re-stamps the doctor on the
    // rows already on the bill and returns, so the charge would never be added.
    const row = await testAddingObject(item[0], 0, 0, 1, 0, 0);
    if (!row) {
      return;
    }

    const AddRow = [row, ...testAddingTableState];
    setTestAddingTable(AddRow);

    // Putting the row on the bill is only half the job - the totals are held
    // separately and are refreshed by this call. Without it the charge showed
    // its own rate but Gross, Net and Patient Payable all stayed at 0.00.
    // Same arguments as the normal add in validateInvestigation().
    const checkAppointData = AddRow?.find((ele) => ele?.typeOfApp === "1");
    handlePaymentGateWay(
      calculateBillAmount(
        AddRow,
        BindResource?.isReceipt,
        singlePatientData?.OPDAdvanceAmount,
        false,
        checkAppointData ? 4 : 0,
        0.0,
        (selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID) === 1 ? 1 : 0,
        0,
      ),
    );
  };

  useEffect(() => {
    if (!IsAutoAddRegistrationOnConsultation) {
      return;
    }

    const panelID = selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID;
    if (!BindResource?.RegistrationItemID || !panelID) {
      return;
    }

    // Same two rules as registration(): the panel must charge registration
    // (IsRegistrationChargeApplicable = 1), and it is added only while the patient has not
    // taken it yet (Registration = 0) - unless the per-doctor-per-day setting decides instead.
    if (Number(selectedPanel?.IsRegistrationChargeApplicable) !== 1) {
      return;
    }
    if (
      IsRegistrationChargeOncePerDoctorPerDay !== "1" &&
      singlePatientData?.Registration !== 0
    ) {
      return;
    }

    const hasConsultation = testAddingTableState?.some(
      (row) => Number(row?.CategoryID) === 1,
    );
    if (!hasConsultation) {
      registrationAutoAddTried.current = false;
      return;
    }

    const alreadyOnBill = testAddingTableState?.some(
      (row) =>
        String(
          row?.NewItemID || row?.ItemID || row?.itemID || row?.val || "",
        ) === String(BindResource?.RegistrationItemID),
    );
    if (alreadyOnBill) {
      registrationAutoAddTried.current = true;
      return;
    }
    if (registrationAutoAddTried.current) {
      return;
    }

    registrationAutoAddTried.current = true;
    addRegistrationChargeItem();
  }, [
    testAddingTableState,
    selectedPanel?.PanelID,
    payloadData?.panelID?.PanelID,
    BindResource?.RegistrationItemID,
    IsAutoAddRegistrationOnConsultation,
    selectedPanel?.IsRegistrationChargeApplicable,
    singlePatientData?.Registration,
  ]);

  const handleCategoryFilter = useCallback(
    (id) => {
      const handleConfigId = (id) => {
        switch (id) {
          case 2:
            return { value: ["25"], label: ["ConfigID"] };
          case 3:
            return { value: [["6", "20"]], label: ["ConfigID"] };
          case 4:
            return { value: ["5"], label: ["ConfigID"] };
          case 9:
            return { value: ["3", "3"], label: ["ConfigID", "CategoryID"] };
          case 10:
            return { value: ["3", "7"], label: ["ConfigID", "CategoryID"] };
          case 11:
            return { value: ["23"], label: ["ConfigID"] };
          case 12:
            return { value: ["7"], label: ["ConfigID"] };
          case 10000:
            return { value: ["-1"], label: ["ConfigID"] };
          case 100:
            const { ConfigID } =
              dropDownState?.RoleWiseOPDServiceBookingControlData?.find(
                (ele) => ele?.TypeID === 1,
              );

            const { filterConfigID } = handleMakeStringToArray({
              value: ConfigID,
              returnName: "filterConfigID",
            });

            return {
              value: [filterConfigID],
              label: ["ConfigID"],
            };
          default:
            return { value: [], label: [] };
        }
      };

      const { value, label } = handleConfigId(id);

      return filterByTypes(
        dropDownState?.RoleWiseOPDServiceBookingControlData,
        [3, ...value],
        ["TypeID", ...label],
        "TextField",
        "ValueField",
      );
    },
    [testPaymentState?.type],
  );

  const handleTypeFilter = useMemo(() => {
    if (dropDownState?.RoleWiseOPDServiceBookingControlData?.length > 0) {
      const data = filterByType(
        dropDownState?.RoleWiseOPDServiceBookingControlData,
        2,
        "TypeID",
        "TextField",
        "ValueField",
      );

      setTestPaymentState({
        ...testPaymentState,
        type: data[0]?.value,
      });

      return data;
    }
  }, [dropDownState?.RoleWiseOPDServiceBookingControlData]);

  useEffect(() => {
    if (Object.keys(singlePatientData)?.length > 0) ref?.current?.focus();
  }, [singlePatientData]);

  const handleconsulationBooking = async (subcategoryID, doctorID) => {
    if (
      testPaymentState?.subCategory !== "0" &&
      testPaymentState?.subCategory !== null
    ) {
      const item = await handleGetLoadOPD_All_ItemsLabAutoComplete({
        searchType: testPaymentState?.searchType,
        prefix: "",
        type: testPaymentState?.type,
        categoryID: testPaymentState?.category,
        subCategoryID: subcategoryID
          ? subcategoryID
          : testPaymentState?.subCategory,
        itemID: "",
        doctorID: payloadData?.DoctorID,
        PanelID: selectedPanel?.PanelID ?? payloadData?.panelID?.PanelID,
        // PanelID: payloadData?.panelID?.PanelID,
      });

      if (item?.length > 0) {
        const arg = {
          ...item[0],
          type: testPaymentState?.type
            ? testPaymentState?.type
            : doctorID
              ? "4"
              : "",
          DoctorID: payloadData?.DoctorID,
        };

        await validateInvestigation(arg, 0, 0, 1, 0, 0);
      }
      return;
    }
  };

  /* 16-11-2026: picking a Subcategory no longer adds the doctor's consultation by itself - it only
     narrows Search Test, and the item is added from there. AUTO_ADD_ON_SUBCATEGORY = true brings back
     the 27-10-2026 behaviour (pick Consultation subcategory -> visit added). */
  const AUTO_ADD_ON_SUBCATEGORY = false;
  useEffect(() => {
    if (
      AUTO_ADD_ON_SUBCATEGORY &&
      testPaymentState?.type === "4" &&
      testPaymentState?.category === "1" &&
      testPaymentState?.subCategory !== "0" &&
      testPaymentState?.subCategory !== null
    ) {
      const isDuplicate = testAddingTableState.some(
        (item) =>
          item?.CategoryID == testPaymentState?.category &&
          item?.Type_ID == payloadData?.DoctorID,
      );

      if (isDuplicate) {
        notify(
          t("A patient can have only one consultation with the same doctor under the same bill."),
          "warn",
        );
        return;
      } else {
        checkPatientFollowup();
      }
    }
  }, [testPaymentState?.subCategory, selectedPanel?.PanelID, payloadData?.panelID]);
  // }, [testPaymentState?.subCategory, payloadData?.panelID]);

  /* Parent-panel rule (set by OPD Booking in payloadData.RuleSubCategoryIDs): the
     consultation is of the rule's subcategory - the doctor's timing row for it when
     there is one, else the rule's first subcategory. No rule = the doctor's first row. */
  const pickConsultationSubCategory = (rows) => {
    const ruleIDs = (payloadData?.RuleSubCategoryIDs || []).map(String);
    if (ruleIDs.length) {
      const row = (rows || []).find((r) =>
        ruleIDs.includes(String(r?.subcategoryID)),
      );
      return row ? row.subcategoryID : ruleIDs[0];
    }
    return rows?.[0]?.subcategoryID;
  };
  const ruleSubCategoryDep = (payloadData?.RuleSubCategoryIDs || []).join(",");

  const OPDDoctorConsulatin = async () => {
    //
    //
    // const categoryOneItems = testAddingTableState.filter(item => item.CategoryID === 1);
    // if(categoryOneItems){
    //   alert("categoryOneItems",categoryOneItems)
    //   return
    // }

    //

    // Booked from the Appointment Calendar: that doctor's consultation is already on the bill, so this effect
    // (it re-fires whenever the panel / doctor object is refreshed) must not try to add it again - it only
    // produced "Test Already Exist!" and a loader on every pass.
    if (
      presetSlot?.doctorID &&
      testAddingTableState?.some(
        (item) =>
          Number(item?.CategoryID) === 1 && String(item?.Type_ID ?? "") === String(presetSlot.doctorID),
      )
    ) {
      return;
    }
    if (testPaymentState?.type === "4" && testPaymentState?.category === "1") {
      //
      // handleconsulationBooking()
      try {
        const response = await OPDDoctorConsulationData(payloadData?.DoctorID);
        if (response?.success || payloadData?.RuleSubCategoryIDs?.length) {
          const subcategoryID = pickConsultationSubCategory(
            response?.success ? response?.data : [],
          );
          checkPatientFollowup(subcategoryID);
        }
      } catch (error) {
        console.log("error", error);
      }
    }
  };
  const BindOPDDoctorConsulatin = async (doctorID) => {
    // Doctor ID is to handle culsultation functionality
    try {
      const response = await OPDDoctorConsulationData(payloadData?.DoctorID);
      if (response?.success || payloadData?.RuleSubCategoryIDs?.length) {
        const subcategoryID = pickConsultationSubCategory(
          response?.success ? response?.data : [],
        );
        checkPatientFollowup(subcategoryID, doctorID);
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  // 27-10-2026: picking Type / Category "Consultation" no longer adds the doctor's visit by itself - the
  // visit is added when a Subcategory is picked (the subCategory effect above). OPDDoctorConsulatin is kept
  // for reference; changing the doctor still swaps an already added consultation (effect below).
  // useEffect(() => {
  //   OPDDoctorConsulatin();
  // }, [testPaymentState?.category, payloadData?.panelID, payloadData?.DoctorID, ruleSubCategoryDep]);

  useEffect(() => {
    if (
      payloadData?.SelectDoctor &&
      testAddingTableState?.find((item) => item?.type === "4")?.ID
    ) {
      BindOPDDoctorConsulatin(payloadData?.SelectDoctor); // this is for bind new doctor consulation and remove old doctor consulation
    }
  }, [payloadData?.SelectDoctor]);

  /* Type chunte hi uski Category apne aap bind ho jati hai (us type ki pehli
     category) aur SubCategory khaali ho jati hai. "ALL" type par saari categories
     aati hain, isliye wahan Category khaali rehti hai. */
  useEffect(() => {
    const type = testPaymentState?.type;
    if (type === undefined || type === null || type === "") return;
    const typeOption = (handleTypeFilter || []).find(
      (opt) => String(opt?.value) === String(type),
    );
    const isAllType = String(typeOption?.label ?? "").trim().toUpperCase() === "ALL";
    const categories = isAllType ? [] : handleCategoryFilter(Number(type)) || [];
    const category =
      String(type) === "4"
        ? "1"
        : categories.length > 0
          ? categories[0]?.value
          : "";
    setTestPaymentState((prev) => ({
      ...prev,
      category: category ?? "",
      // "0" is the sentinel the subCategory-picked guards check for, not "" - see
      // handleReactSelect above for why this matters (Type auto-selecting "4" on
      // load auto-ran this effect, which was auto-adding the doctor's follow-up
      // visit before the user touched anything).
      subCategory: "0",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testPaymentState?.type]);

  return (
    <div className="card  patient_registration_card ">
      {!UHID && Object.keys(singlePatientData)?.length > 0 && (
        <div className="row  pt-2 pl-2 pr-2">
          <div className="col-xl-1 col-md-4 col-sm-4 col-12">
            <div className="form-group">
              <ReactSelect
                placeholderName={i18n.t("Type")}
                id="Type"
                searchable={true}
                name="type"
                dynamicOptions={handleTypeFilter}
                value={testPaymentState?.type}
                handleChange={handleReactSelect}
              />
            </div>
          </div>
          {isMemberShipCardAccess && (
            <Input
              type="text"
              className={`form-control ${isMemberShipCardAccess ? "required-fields" : ""}`}
              id="MemberShipCardNo"
              name="MemberShipCardNo"
              value={
                testPaymentState?.MemberShipCardNo
                  ? testPaymentState?.MemberShipCardNo
                  : ""
              }
              onChange={handleChange}
              lable={t("MemberShip CardNo")}
              placeholder=" "
              respclass="col-xl-1 col-md-3 col-sm-6 col-12"
              isUpperCase={true}
            />
          )}

          <div className="col-xl-2 col-md-4 col-sm-4 col-12">
            <div className="form-group">
              <ReactSelect
                placeholderName={i18n.t("Category")}
                id="Category"
                searchable={true}
                name="category"
                handleChange={handleReactSelect}
                value={testPaymentState?.category}
                dynamicOptions={handleCategoryFilter(
                  Number(testPaymentState?.type),
                )}
              />
            </div>
          </div>

          <div className="col-xl-2 col-md-4 col-sm-4 col-12">
            <div className="form-group">
              <ReactSelect
                placeholderName={i18n.t("SubCategory")}
                id="SubCategory"
                searchable={true}
                name={"subCategory"}
                handleChange={handleReactSelect}
                value={testPaymentState?.subCategory}
                dynamicOptions={filterByTypes(
                  dropDownState?.RoleWiseOPDServiceBookingControlData,
                  [4, testPaymentState?.category],
                  ["TypeID", "CategoryID"],
                  "TextField",
                  "ValueField",
                )}
              />
            </div>
          </div>

          <div className="col-xl-5 col-md-9 col-sm-4 col-12">
            <div className="d-flex">
              <div className="form-group w-25 mr-1">
                <ReactSelect
                  placeholderName={i18n.t("Search")}
                  id="Search"
                  searchable={true}
                  dynamicOptions={translateOptions(SEARCH_BY_TEST, t)}
                  value={testPaymentState?.searchType}
                  name={"searchType"}
                  handleChange={handleReactSelect}
                  removeIsClearable={true}

                />
              </div>
              <div
                className="form-group w-100"
                style={{ position: "relative" }}
              >
                <AutoComplete
                  delay={1000}
                  value={value}
                  suggestions={items}
                  completeMethod={search}
                  ref={ref}
                  className="w-100"
                  onHide={() => setUnitHover(null)}
                  onSelect={(e) => {
                    setUnitHover(null);
                    isUserInteraction.current = true;

                    validateInvestigation(e, 0, 0, 1, 0, 0);
                  }}
                  id="searchtest"
                  onChange={(e) => {
                    const data =
                      typeof e.value === "object"
                        ? e?.value?.autoCompleteItemName
                        : e.value;
                    setValue(data);
                    // setIsFirstLoad(false);
                  }}
                  itemTemplate={itemTemplate}
                />
                {unitHover && (
                  <div
                    className="p-tooltip p-component p-tooltip-right"
                    style={{
                      position: "fixed",
                      top: unitHover.top,
                      left: unitHover.left,
                      transform: "translateY(-50%)",
                      zIndex: 99999,
                      pointerEvents: "none",
                      display: "inline-block",
                      maxWidth: "22rem",
                    }}
                  >
                    <div className="p-tooltip-arrow" />
                    <div className="p-tooltip-text" style={{ whiteSpace: "pre-line" }}>
                      {unitHover.text}
                    </div>
                  </div>
                )}

                <label htmlFor={"searchtest"} className="lable searchtest">
                  {t("Search Test")}
                </label>
              </div>
            </div>
          </div>
          {/* The three actions as icons on one line. They used to be three grid
              columns of their own, which is why "Booked Inv" dropped onto a second
              row as soon as the bar got tight; one flex row that does not wrap
              keeps them together at every width. The label moves to the tooltip,
              and the button's colour still carries its state - blinking while
              something is pending, green once it is dealt with. */}
          <div className="col-xl-2 col-md-4 col-sm-6 col-12">
            <div className="form-group">
              <div className="d-flex flex-nowrap" style={{ gap: 6 }}>
                <button
                  type="button"
                  title={t("CPOE")}
                  aria-label={t("CPOE")}
                  className={`btn btn-sm d-inline-flex align-items-center justify-content-center${hasCpoeOrders ? " order-blink" : ""}`}
                  style={foBtnStyle(FO_BTN.cpoe)}
                  onClick={() => handleModalState()}
                >
                  <img src={icCpoe} alt="" width={18} height={18} />
                </button>
                {/* Day Care Order. Same job as CPOE for a day care visit, which
                    the CPOE list cannot show because it reaches patient_test
                    through `appointment` and a day care episode has none. */}
                <button
                  type="button"
                  title={t("Day Care Order")}
                  aria-label={t("Day Care Order")}
                  className="btn btn-sm d-inline-flex align-items-center justify-content-center"
                  style={foBtnStyle(FO_BTN.dayCare)}
                  onClick={() => handleDayCareOrderState()}
                >
                  <i className="fas fa-clinic-medical" style={{ fontSize: 15 }} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  title={
                    referralError
                      ? `${t("Referral")} — ${t("could not be read")}`
                      : referralState === "pending"
                        ? `${t("Referral")} — ${t("Pending booking")}`
                        : referralState === "booked"
                          ? `${t("Referral")} — ${t("Already booked")}`
                          : t("Referral")
                  }
                  aria-label={t("Referral")}
                  className={`btn btn-sm d-inline-flex align-items-center justify-content-center${
                    !referralError && referralState === "pending" ? " order-blink" : ""
                  }`}
                  style={foBtnStyle(
                    referralError
                      ? FO_BTN.referral.error
                      : FO_BTN.referral[referralState] || FO_BTN.referral.none,
                  )}
                  onClick={() => handleReferralModalState()}
                >
                  <img src={icReferral} alt="" width={18} height={18} />
                </button>
                <button
                  type="button"
                  title={t("Booked Inv")}
                  aria-label={t("Booked Inv")}
                  className={`btn btn-sm d-inline-flex align-items-center justify-content-center${hasFutureBookings ? " order-blink" : ""}`}
                  style={foBtnStyle(FO_BTN.bookedInv)}
                  onClick={() => handleFutureInvModalState()}
                >
                  <img src={icBookedInv} alt="" width={18} height={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmBoxvisible?.show && (
        <Confirm
          alertMessage={confirmBoxvisible?.alertMessage}
          lableMessage={confirmBoxvisible?.lableMessage}
          confirmBoxvisible={confirmBoxvisible}
        >
          {confirmBoxvisible?.chidren}
        </Confirm>
      )}

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
        >
          {modalHandlerState?.component}
        </Modal>
      )}
    </div>
  );
}

export default TestPayment;
