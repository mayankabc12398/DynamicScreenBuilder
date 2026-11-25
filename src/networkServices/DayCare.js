import { setLoading } from "../store/reducers/loadingSlice/loadingSlice";
import store from "../store/store";
import { apiUrls } from "./apiEndpoints";
import makeApiRequest from "./axiosInstance";

/**
 * Day Care network layer.
 *
 * Only the calls that are genuinely Day Care live here: the masters, the
 * booking/confirmation cycle, the admission and the board.
 *
 * Everything a patient needs AFTER admission - billing details, services,
 * clearance, discharge, the nursing and clinical forms - is not duplicated.
 * A day care episode is a short-stay episode, so those screens keep calling
 * the Emergency endpoints in ./Emergency.js with the day care TransactionID
 * and work unchanged. Re-exporting them here would create a second copy to
 * keep in step for no gain.
 */

/** Room types flagged IsDayCare in ipd_case_type_master. */
export const bindDayCareRoomType = async () => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.BindDayCareRoomType, { method: "get" });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

/**
 * Beds of one Day Care room type, with a live status for a given date AND time slot:
 * Free / Booked / Occupied / Cleaning.
 *
 * The slot matters: a chair booked 10:00-12:00 is free again at 14:00, so asking
 * without a slot means "the whole day" and will report anything already held that
 * day as Booked. Each bed also comes back with `BookedSlots`, every live hold on it
 * that day, so the desk can see how the chair is already spoken for.
 */
export const bindDayCareRoomBed = async (
  caseType, bookingDate, slotFrom, slotTo, excludeBookingId, fullDay,
) => {
  store.dispatch(setLoading(true));
  try {
    /* excludeBookingId: the hold being admitted against. Without it that
       booking blocks its own patient - the bed reads Booked and cannot be
       picked, which is a dead end on the admission screen. */
    const query =
      `?caseType=${caseType ?? ""}` +
      `${bookingDate ? `&bookingDate=${bookingDate}` : ""}` +
      `${slotFrom ? `&slotFrom=${encodeURIComponent(slotFrom)}` : ""}` +
      `${slotTo ? `&slotTo=${encodeURIComponent(slotTo)}` : ""}` +
      `${excludeBookingId ? `&excludeBookingId=${excludeBookingId}` : ""}` +
      /* Tells the two empty-slot cases apart. Without it the server cannot know
         whether a blank window means "the whole day" or "I have not chosen
         yet", and a chair booked for three hours reads Booked all day. */
      `${fullDay ? "&fullDay=true" : ""}`;
    const data = await makeApiRequest(`${apiUrls.BindDayCareRoomBed}${query}`, { method: "get" });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

/** Admit a patient to day care. Pass bookingID to close an advance booking against it. */
export const SaveDayCareAdmission = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.SaveDayCareAdmission, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

/** Hold a bed for a future date. */
export const SaveDayCareBooking = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.SaveDayCareBooking, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

/**
 * Book every session of a package in one call.
 *
 * All or nothing: if any one bed has gone since the popup read the board, the
 * server saves none of them and says which session clashed. That is deliberate -
 * a half-booked course would only be discovered later, in a ward.
 */
export const SaveDayCarePackageBooking = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.SaveDayCarePackageBooking, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

/**
 * Every medicine and investigation ordered for one day care visit, with its
 * billing status. "Billed" means the line carries an OPDTransactionID - the
 * same test the OPD module makes - so a Pending line is simply one the patient
 * has not taken to the counter yet.
 */
export const GetDayCareOrderSummary = async (transactionId) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetDayCareOrderSummary}?transactionId=${transactionId ?? 0}`,
      { method: "get" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

/** Write a day care order - medicines and investigations - for one visit. */
export const SaveDayCareOrder = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.SaveDayCareOrder, { method: "post", data: payload });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

/**
 * Unbilled day care investigations for a patient - the Day Care counterpart of
 * the CPOE list. Same row shape, so the counter adds them to the bill with the
 * very same handler.
 */
export const BindDayCareInvestigation = async (patientID) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.BindDayCareInvestigation}?patientID=${encodeURIComponent(patientID ?? "")}`,
      { method: "get" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

/** Bookings for the confirmation screen. */
export const GetDayCareBookings = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.GetDayCareBookings, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

/** Confirm a held booking. Confirming does not admit - it marks the hold as agreed. */
export const ConfirmDayCareBooking = async (id) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(`${apiUrls.ConfirmDayCareBooking}?id=${id}`, {
      method: "post",
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

/** Cancel a booking, or mark it a no-show. Either way the bed is released. */
export const CancelDayCareBooking = async (id, reason, isNoShow = false) => {
  store.dispatch(setLoading(true));
  try {
    const url = `${apiUrls.CancelDayCareBooking}?id=${id}&reason=${encodeURIComponent(
      reason ?? "",
    )}&isNoShow=${isNoShow ? "true" : "false"}`;
    const data = await makeApiRequest(url, { method: "post" });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

/** The day care board. Same row shape as Emergency/PatientSearch, scoped to day care. */
export const DayCarePatientSearchAPI = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.DayCarePatientSearch, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

/**
 * Tile counts for the board. Separate from the search so the tiles keep showing
 * the whole day while the grid is filtered to one status.
 */
export const DayCareDashboardCount = async (payload) => {
  try {
    // No global spinner: this runs alongside the search and a second spinner
    // would flicker the page.
    const data = await makeApiRequest(apiUrls.DayCareDashboardCount, {
      method: "post",
      data: payload,
    });
    return data;
  } catch (error) {
    return null;
  }
};

/**
 * Save the adult Nursing Initial Assessment for a visit.
 *
 * The whole form travels as one JSON string in `assessmentData`; a save
 * overwrites the visit's existing assessment rather than adding a second,
 * because a nurse completes this form in stages across a shift.
 */
export const SaveNursingInitialAssessment = async (payload) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(apiUrls.SaveNursingInitialAssessment, {
      method: "post",
      data: payload,
    });
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

/**
 * The saved assessment plus the patient/admission details the form shows
 * read-only and prints. Those details come from the visit on every open, so a
 * bed or consultant change shows through instead of being frozen in the form.
 */
export const GetNursingInitialAssessment = async (transactionId) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetNursingInitialAssessment}?transactionId=${transactionId}`,
      { method: "get" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

/**
 * The turnaround times of one visit: booked, confirmed, admitted, cleared,
 * discharged, and every gap in between.
 *
 * Takes either key - a transaction id for a visit that has been admitted, a
 * booking id for one that is still only booked or confirmed - because both
 * have a journey worth looking at.
 */
export const GetDayCareTAT = async (transactionId, bookingId) => {
  store.dispatch(setLoading(true));
  try {
    const data = await makeApiRequest(
      `${apiUrls.GetDayCareTAT}?transactionId=${Number(transactionId) || 0}&bookingId=${Number(bookingId) || 0}`,
      { method: "get" },
    );
    store.dispatch(setLoading(false));
    return data;
  } catch (error) {
    store.dispatch(setLoading(false));
    throw error;
  }
};

/**
 * Link day care sessions to the bill they were sold on.
 *
 * Called after the bill saves, because the sessions are booked before it
 * exists. No spinner: the bill is already done and this must not look like
 * part of it.
 */
export const LinkDayCareBookingsToBill = async (payload) => {
  try {
    return await makeApiRequest(apiUrls.LinkDayCareBookingsToBill, {
      method: "post",
      data: payload,
    });
  } catch (error) {
    console.error(error);
    return null;
  }
};
