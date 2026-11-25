import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import moment from "moment";

import ReactSelect from "../../../formComponent/ReactSelect";
import DatePicker from "../../../formComponent/DatePicker";
import Input from "../../../formComponent/Input";
import {
  bindDayCareRoomBed,
  bindDayCareRoomType,
  SaveDayCarePackageBooking,
} from "../../../../networkServices/DayCare";
import { notify, reactSelectOptionList } from "../../../../utils/utils";
import {
  DURATION_OPTIONS,
  START_TIME_OPTIONS,
  freeGaps,
  slotMode,
  slotRange,
  validateSlot,
} from "../../../../utils/dayCareSlots";
import {
  COURSE_PRESETS,
  MAX_SESSIONS,
  REPEAT_OPTIONS,
  WEEKDAYS,
  describeCourse,
  generateCourseDates,
} from "../../../../utils/dayCareCourse";

/*
 * Day Care session booking, from the OPD Service Booking package popup.
 *
 * The moment a package is on the bill the desk knows roughly when the patient
 * will come in for it, so this is where the sittings get scheduled. One row per
 * session: a date, a time slot and a SPECIFIC bed.
 *
 * A COURSE, NOT A SITTING
 *   Dialysis is three times a week for months; chemotherapy runs in cycles.
 *   Entering those one row at a time - date, room type, time, duration, then
 *   hunting a free bed on each date - is not something a desk will do twelve
 *   times, so the planner at the top takes the pattern once ("Mon/Wed/Fri,
 *   twelve sittings"), generates the dates, and allocates a bed on every one of
 *   them. The rows it produces are ordinary rows: any of them can then be moved
 *   to another date, time or bed individually.
 *
 *   Allocation prefers to give the patient the SAME bed for the whole course
 *   when one is free throughout. On a dialysis unit a patient is usually put
 *   back on the same machine, and a course that wanders across six chairs is
 *   harder for the unit to run even when every sitting is technically booked.
 *
 * Saving writes ordinary daycare_booking rows - the same rows the Day Care
 * Admission screen writes - so the beds immediately show as "Booked" on the Day
 * Care bed board and nobody else can take them. Nothing downstream has to know
 * a package was involved; the sessions just carry a shared group number so the
 * course can be seen as one thing.
 *
 * The save is all-or-nothing on the server. If a bed has gone since this popup
 * read the board, none of the sessions are written and the message says which
 * one clashed - a course saved with a hole in it would only be found out later,
 * in a ward.
 *
 * Rendered only when fin_global_resources.DayCarePackageBooking = '1'; the
 * caller checks the flag, so this component never has to.
 */

const BOX_CLASS = "card card_background border";
const FIELD_LABEL = { fontSize: "12px", fontWeight: 600, color: "#475569", margin: "6px 0" };
const EMPTY_HINT = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
  flexDirection: "column", textAlign: "center", color: "#94a3b8",
  fontSize: "12px", padding: "14px 10px", border: "1px dashed #e2e8f0",
  borderRadius: "8px", background: "#fafbfc",
};

/* Same vocabulary and colours the Day Care Admission bed board uses, so a bed
   means the same thing on both screens. Only Free is pickable. */
const BED_STATE = {
  Free: { c: "#15803d", dot: "#22c55e", selectable: true },
  Booked: { c: "#b45309", dot: "#f59e0b", selectable: false },
  /* Taken for part of the day only. Shown while no time is picked; choosing
     one turns it into Free or Booked. */
  PartBooked: { c: "#0369a1", dot: "#38bdf8", selectable: false },
  Occupied: { c: "#64748b", dot: "#94a3b8", selectable: false },
  Cleaning: { c: "#be123c", dot: "#f43f5e", selectable: false },
};

/* Slots are a START TIME plus a DURATION - an hour in the chair for one
   patient, three for the next - and the end time is derived. Shared with the
   Day Care Admission screen so the two cannot drift apart. */

/* The bed boards are read one request per date. Four at a time keeps a long
   course responsive without opening sixty connections at once. */
const FETCH_BATCH = 4;

const newSession = (date, defaults = {}) => ({
  key: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  date: date ?? moment().add(1, "day").toDate(),
  slotStart: defaults.slotStart ?? "",
  slotDuration: defaults.slotDuration ?? "",
  roomType: defaults.roomType ?? "",
  bed: "",
  // Beds for this session's room type AND date. Held per row because two
  // sessions on different dates have genuinely different availability.
  bedList: [],
  loadingBeds: false,
  // Collapsed rows keep a twelve-sitting course readable; a row opens when the
  // desk wants to move it, and anything unallocated opens itself.
  expanded: true,
});

const DayCarePackageBookingModal = ({
  singlePatientData,
  packageRow,
  doctorID,
  panelID,
  opdTransactionID,
  onClose,
  onBooked,
}) => {
  const [t] = useTranslation();
  const navigate = useNavigate();

  const [roomTypeList, setRoomTypeList] = useState([]);
  const [sessions, setSessions] = useState([newSession()]);
  const [instructions, setInstructions] = useState("");
  const [sendSMS, setSendSMS] = useState(true);
  const [saving, setSaving] = useState(false);

  /* The course planner. These are not part of the booking - they only decide
     which rows get generated. */
  const [plan, setPlan] = useState({
    pattern: REPEAT_OPTIONS[0],
    startDate: moment().add(1, "day").toDate(),
    count: "1",
    weekdays: [],
    everyNDays: "21",
    roomType: "",
    slotStart: "",
    slotDuration: "",
    sameBed: true,
  });
  const [generating, setGenerating] = useState(false);

  const setPlanField = (field, value) => setPlan((p) => ({ ...p, [field]: value }));
  const patternValue = plan.pattern?.value ?? "none";

  const packageName =
    packageRow?.ItemDisplayName ||
    packageRow?.ItemName ||
    packageRow?.label ||
    "";
  const packageID = Number(
    packageRow?.NewItemID ?? packageRow?.ItemID ?? packageRow?.itemID ?? packageRow?.val ?? 0,
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await bindDayCareRoomType();
        if (res?.success) {
          setRoomTypeList(reactSelectOptionList(res?.data, "Name", "IPDCaseTypeID"));
        } else {
          setRoomTypeList([]);
          if (res?.message) notify(res.message, "error");
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  const patch = (key, changes) =>
    setSessions((list) => list.map((s) => (s.key === key ? { ...s, ...changes } : s)));

  /* One read of the bed board. Kept free of state so the bulk allocator can
     call it for a whole course and decide on the results together. */
  const fetchBeds = async (caseTypeID, forDate, startValue, durationValue) => {
    if (!caseTypeID) return [];
    const { from, to } = slotRange(startValue, durationValue);
    const wholeDay = slotMode(startValue, durationValue) === "full";
    try {
      const res = await bindDayCareRoomBed(
        caseTypeID, moment(forDate).format("YYYY-MM-DD"), from, to, undefined, wholeDay,
      );
      return res?.success ? res?.data || [] : [];
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const freeBeds = (list) =>
    (list || []).filter((b) => BED_STATE[b?.BedStatus]?.selectable);

  /* Beds are re-read whenever the room type or the date of THAT row changes.
     Picking a bed and then moving the date would otherwise keep a bed that may
     be taken on the new date, so the bed is cleared when it is no longer free. */
  /* Availability is per date AND per slot: a chair booked 10:00-12:00 is free
     again at 14:00, so two sessions of the same course can even share a bed on
     one day as long as their times do not meet. */
  const loadBeds = async (session, caseTypeID, forDate, startValue, durationValue) => {
    if (!caseTypeID) {
      patch(session.key, { bedList: [], bed: "" });
      return;
    }
    patch(session.key, { loadingBeds: true });
    const list = await fetchBeds(caseTypeID, forDate, startValue, durationValue);
    setSessions((all) =>
      all.map((s) => {
        if (s.key !== session.key) return s;
        const stillFree =
          s.bed &&
          list.find(
            (b) => String(b?.RoomID) === String(s.bed?.value) && BED_STATE[b?.BedStatus]?.selectable,
          );
        return { ...s, bedList: list, loadingBeds: false, bed: stillFree ? s.bed : "" };
      }),
    );
  };

  const handleRoomType = (session, value) => {
    patch(session.key, { roomType: value, bed: "" });
    loadBeds(session, value?.value, session.date, session.slotStart, session.slotDuration);
  };

  const handleDate = (session, value) => {
    patch(session.key, { date: value });
    if (session?.roomType?.value) {
      loadBeds(session, session.roomType.value, value, session.slotStart, session.slotDuration);
    }
  };

  /* Either half of the slot changes which beds are free, so both re-read the
     board for that row. */
  const handleSlotPart = (session, field, value) => {
    patch(session.key, { [field]: value });
    const next = { ...session, [field]: value };
    if (session?.roomType?.value) {
      loadBeds(session, session.roomType.value, session.date, next.slotStart, next.slotDuration);
    }
  };

  const handleBedPick = (session, bed) => {
    const st = BED_STATE[bed?.BedStatus] || BED_STATE.Free;
    if (!st.selectable) {
      notify(
        bed?.BedStatus === "Booked"
          ? `${t("This bed is already booked")} ${bed?.BookedFor ? `(${bed.BookedFor})` : ""}`
          : bed?.BedStatus === "Cleaning"
            ? t("This bed is waiting for housekeeping clearance")
            : t("This bed is occupied"),
        "error",
      );
      return;
    }
    patch(session.key, { bed: { label: bed?.Name, value: bed?.RoomID } });
  };

  /* A manually added row inherits the planner's choices - adding one more
     sitting to a dialysis course should not mean re-picking the unit, the time
     and the duration. */
  const addSession = () => {
    const last = sessions[sessions.length - 1];
    const defaults = {
      roomType: last?.roomType || plan.roomType,
      slotStart: last?.slotStart || plan.slotStart,
      slotDuration: last?.slotDuration || plan.slotDuration,
    };
    const nextDate = last?.date
      ? moment(last.date).add(1, "day").toDate()
      : moment().add(1, "day").toDate();
    const row = { ...newSession(nextDate, defaults), expanded: true };
    setSessions((list) => [...list, row]);
    if (defaults.roomType?.value) {
      loadBeds(row, defaults.roomType.value, nextDate, defaults.slotStart, defaults.slotDuration);
    }
  };

  const removeSession = (key) =>
    setSessions((list) => (list.length === 1 ? list : list.filter((s) => s.key !== key)));

  const toggleExpanded = (key) =>
    setSessions((list) => list.map((s) => (s.key === key ? { ...s, expanded: !s.expanded } : s)));

  const toggleWeekday = (day) =>
    setPlan((p) => ({
      ...p,
      weekdays: p.weekdays.includes(day)
        ? p.weekdays.filter((d) => d !== day)
        : [...p.weekdays, day],
    }));

  const applyPreset = (preset) =>
    setPlan((p) => ({
      ...p,
      pattern: REPEAT_OPTIONS.find((o) => o.value === preset.pattern) ?? p.pattern,
      count: String(preset.count),
      weekdays: preset.weekdays ?? [],
      everyNDays: String(preset.everyNDays ?? p.everyNDays),
    }));

  /*
   * Build the course and give every sitting a bed.
   *
   * Preference order:
   *   1. one bed that is free on EVERY date (the patient keeps the same chair),
   *   2. failing that, the first free bed on each date individually.
   *
   * A date with nothing free is left unallocated and says so, rather than being
   * dropped - the desk needs to see which sitting could not be placed so it can
   * move that one, not discover later that the course is short.
   */
  const handleGenerate = async () => {
    const caseTypeID = plan.roomType?.value;
    if (!caseTypeID) {
      notify(t("Select a Day Care room type for the course"), "error");
      return;
    }
    if (patternValue === "weekdays" && plan.weekdays.length === 0) {
      notify(t("Pick at least one day of the week"), "error");
      return;
    }
    /* Allocation needs a definite window: which beds are free depends entirely
       on when. "Full Day" is a definite answer; nothing chosen is not. */
    const planCheck = validateSlot({
      start: plan.slotStart, duration: plan.slotDuration, date: plan.startDate,
    });
    if (!planCheck.ok) {
      notify(t(planCheck.error), "error");
      return;
    }
    if (planCheck.warning) notify(t(planCheck.warning), "success");

    const wanted = Number(plan.count) || 0;
    if (wanted < 1) {
      notify(t("Enter how many sessions the course has"), "error");
      return;
    }
    if (wanted > MAX_SESSIONS) {
      notify(`${t("A course can hold at most")} ${MAX_SESSIONS} ${t("sessions")}`, "error");
      return;
    }

    const dates = generateCourseDates({
      pattern: patternValue,
      startDate: plan.startDate,
      count: wanted,
      weekdays: plan.weekdays,
      everyNDays: Number(plan.everyNDays) || 1,
    });
    if (dates.length === 0) {
      notify(t("That pattern produced no dates"), "error");
      return;
    }

    setGenerating(true);
    try {
      // Read every date's board, a few at a time.
      const boards = [];
      for (let i = 0; i < dates.length; i += FETCH_BATCH) {
        const chunk = dates.slice(i, i + FETCH_BATCH);
        // eslint-disable-next-line no-await-in-loop
        const got = await Promise.all(
          chunk.map((d) => fetchBeds(caseTypeID, d, plan.slotStart, plan.slotDuration)),
        );
        boards.push(...got);
      }

      // A bed free on every single date, if there is one.
      let common = null;
      if (plan.sameBed) {
        const firstFree = freeBeds(boards[0]);
        common = firstFree.find((bed) =>
          boards.every((list) =>
            freeBeds(list).some((b) => String(b?.RoomID) === String(bed?.RoomID)),
          ),
        ) ?? null;
      }

      /* Two sittings can land on the same date (an occasional top-up), and the
         board was read before either was allocated, so a bed handed out once
         must not be handed out again for an overlapping slot on that date. */
      const taken = new Set();
      const dayKey = (d, roomID) => `${moment(d).format("YYYY-MM-DD")}#${roomID}`;

      const rows = dates.map((d, i) => {
        const free = freeBeds(boards[i]);
        const pick =
          (common && !taken.has(dayKey(d, common.RoomID))
            ? free.find((b) => String(b?.RoomID) === String(common.RoomID))
            : null) ?? free.find((b) => !taken.has(dayKey(d, b?.RoomID)));
        if (pick) taken.add(dayKey(d, pick.RoomID));

        return {
          ...newSession(d, {
            roomType: plan.roomType,
            slotStart: plan.slotStart,
            slotDuration: plan.slotDuration,
          }),
          key: `${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
          bedList: boards[i],
          bed: pick ? { label: pick?.Name, value: pick?.RoomID } : "",
          // Only the sittings that need a decision are open.
          expanded: !pick,
        };
      });

      setSessions(rows);

      const placed = rows.filter((r) => r?.bed?.value).length;
      if (placed === rows.length) {
        notify(
          common
            ? `${rows.length} ${t("sessions booked into")} ${common?.Name}`
            : `${rows.length} ${t("sessions allocated a bed")}`,
          "success",
        );
      } else {
        notify(
          `${placed} ${t("of")} ${rows.length} ${t("sessions got a bed. The rest have no free bed on that date.")}`,
          "error",
        );
      }
    } finally {
      setGenerating(false);
    }
  };

  /* Caught here so the clerk sees it on the row rather than as a server error:
     the same bed twice on the same day is a typing slip, not a race. */
  const duplicateKeys = useMemo(() => {
    const dupes = new Set();
    // Same overlap rule the server applies, so what the form accepts and what the
    // save accepts cannot disagree. No slot means the whole day.
    const span = (s) => {
      const r = slotRange(s?.slotStart, s?.slotDuration);
      return [r.from || "00:00:00", r.to || "23:59:59"];
    };
    for (let a = 0; a < sessions.length; a += 1) {
      for (let b = a + 1; b < sessions.length; b += 1) {
        const x = sessions[a];
        const y = sessions[b];
        if (!x?.bed?.value || !y?.bed?.value || !x?.date || !y?.date) continue;
        if (String(x.bed.value) !== String(y.bed.value)) continue;
        if (moment(x.date).format("YYYY-MM-DD") !== moment(y.date).format("YYYY-MM-DD")) continue;
        const [xf, xt] = span(x);
        const [yf, yt] = span(y);
        // Back-to-back slots (12:00 end, 12:00 start) do not overlap.
        if (xf < yt && xt > yf) {
          dupes.add(x.key);
          dupes.add(y.key);
        }
      }
    }
    return dupes;
  }, [sessions]);

  const allocated = sessions.filter((s) => s?.bed?.value).length;
  const unallocated = sessions.length - allocated;

  const handleBook = async () => {
    const incomplete = sessions.find((s) => !s?.date || !s?.bed?.value);
    if (incomplete) {
      notify(t("All sessions must have a date and a bed"), "error");
      // Open the ones that need attention so the desk is not hunting for them.
      setSessions((list) => list.map((s) => (s?.bed?.value ? s : { ...s, expanded: true })));
      return;
    }
    if (duplicateKeys.size > 0) {
      notify(t("Two sessions cannot use the same bed at overlapping times"), "error");
      return;
    }

    setSaving(true);
    try {
      const res = await SaveDayCarePackageBooking({
        patientID: singlePatientData?.PatientID ?? "",
        packageID,
        packageName,
        doctorID: Number(doctorID) || 0,
        panelID: Number(panelID) || 0,
        contactNo: singlePatientData?.Mobile ?? singlePatientData?.ContactNo ?? "",
        sendSMS,
        instructions,
        opdTransactionID: Number(opdTransactionID) || 0,
        sessions: sessions.map((s) => {
          const range = slotRange(s?.slotStart, s?.slotDuration);
          return {
            bookingDate: moment(s.date).format("YYYY-MM-DD"),
            slotFromTime: range.from,
            slotToTime: range.to,
            ipdCaseTypeID: Number(s?.roomType?.value) || 0,
            roomID: Number(s?.bed?.value) || 0,
            // The duration IS the expected stay - one number, chosen once.
            expectedStayHours: range.hours,
            advanceAmount: 0,
            procedureName: packageName,
            instructions,
          };
        }),
      });

      if (!res?.success) {
        notify(res?.message, "error");
        // Somebody else may have taken a bed - re-read every row's board so the
        // clerk is choosing from what is actually free now.
        sessions.forEach((s) => {
          if (s?.roomType?.value) loadBeds(s, s.roomType.value, s.date, s.slotStart, s.slotDuration);
        });
        return;
      }

      notify(res?.message, "success");
      if (onBooked) onBooked(res?.data);
      if (onClose) onClose();
    } catch (error) {
      console.error(error);
      notify(t("Something went wrong"), "error");
    } finally {
      setSaving(false);
    }
  };

  /* The other half of the decision the spec describes: the patient is here now,
     so skip the hold and admit them. The admission screen takes it from there -
     it is the only place that opens an episode, so there is one code path for
     that no matter where the user started. */
  const handleAdmitNow = () => {
    if (onClose) onClose();
    navigate("/day-care-admission", {
      state: {
        dayCarePrefill: {
          PatientID: singlePatientData?.PatientID,
          ProcedureName: packageName,
          PackageID: packageID,
        },
      },
    });
  };

  return (
    <div style={{ padding: "8px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* ── Who and what ───────────────────────────────────────────────── */}
      <div className={BOX_CLASS} style={{ marginBottom: "6px" }}>
        <div style={{ padding: "10px", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1f2a37" }}>
              {singlePatientData?.Title} {singlePatientData?.PName}
            </div>
            <div style={{ fontSize: "11.5px", color: "#64748b" }}>
              {singlePatientData?.PatientID}
              {singlePatientData?.Age ? ` · ${singlePatientData.Age}/${String(singlePatientData?.Gender || "").slice(0, 1)}` : ""}
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".3px" }}>
              {t("Package")}
            </div>
            <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#1f2a37" }}>
              {packageName || t("Not Set")}
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button type="button" className="btn btn-outline-primary btn-sm px-3" onClick={handleAdmitNow}>
              <i className="fas fa-procedures mr-2" aria-hidden="true" />
              {t("Admit To Day Care Now")}
            </button>
          </div>
        </div>
      </div>

      {/* ── Course planner ─────────────────────────────────────────────── */}
      <div className={BOX_CLASS} style={{ marginBottom: "6px" }}>
        <div className="card-header">
          <h4 className="card-title w-100 m-0 d-flex align-items-center justify-content-between" style={{ padding: "8px 12px", gap: "8px" }}>
            <span>
              <i className="fas fa-repeat mr-2" aria-hidden="true" />
              {t("Plan The Course")}
            </span>
            <span style={{ fontWeight: 400, fontSize: "11px", color: "#94a3b8" }}>
              {t("For a repeating treatment - dialysis, chemotherapy, physiotherapy")}
            </span>
          </h4>
        </div>

        <div style={{ padding: "8px 12px 0", display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {COURSE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset)}
              style={{
                border: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: "999px",
                padding: "3px 11px", fontSize: "11px", color: "#475569", fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t(preset.label)}
            </button>
          ))}
        </div>

        <div className="row pt-2 pl-2 pr-2">
          <ReactSelect
            placeholderName={t("Repeat")}
            id="coursePattern"
            name="coursePattern"
            searchable={false}
            respclass="col-xl-3 col-md-6 col-sm-6 col-12"
            dynamicOptions={REPEAT_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
            value={plan.pattern}
            handleChange={(name, value) => setPlanField("pattern", value)}
          />
          <DatePicker
            className="custom-calendar"
            id="courseStart"
            name="courseStart"
            lable={t("First Session")}
            value={moment(plan.startDate).toDate()}
            handleChange={(e) => setPlanField("startDate", e.target.value)}
            minDate={moment().toDate()}
            respclass="col-xl-3 col-md-6 col-sm-6 col-12"
          />
          {patternValue !== "none" && (
            <Input
              type="number"
              className="form-control"
              id="courseCount"
              name="courseCount"
              lable={t("Number Of Sessions")}
              placeholder=" "
              value={plan.count}
              onChange={(e) => setPlanField("count", e.target.value)}
              respclass="col-xl-2 col-md-6 col-sm-6 col-12"
            />
          )}
          {patternValue === "everyn" && (
            <Input
              type="number"
              className="form-control"
              id="courseEveryN"
              name="courseEveryN"
              lable={t("Gap In Days")}
              placeholder=" "
              value={plan.everyNDays}
              onChange={(e) => setPlanField("everyNDays", e.target.value)}
              respclass="col-xl-2 col-md-6 col-sm-6 col-12"
            />
          )}
        </div>

        {patternValue === "weekdays" && (
          <div style={{ padding: "0 12px 4px" }}>
            <div style={FIELD_LABEL}>{t("On These Days")}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {WEEKDAYS.map((d) => {
                const on = plan.weekdays.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleWeekday(d.value)}
                    style={{
                      border: on ? "1.5px solid #0d9488" : "1px solid #e2e8f0",
                      background: on ? "#ecfdf8" : "#fff",
                      color: on ? "#0f766e" : "#64748b",
                      borderRadius: "8px", padding: "4px 13px",
                      fontSize: "11.5px", fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    {t(d.label)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* These three apply to every generated sitting; a row can still be
            changed on its own afterwards. */}
        <div className="row pt-2 pl-2 pr-2">
          <ReactSelect
            placeholderName={t("RoomType")}
            id="courseRoomType"
            name="courseRoomType"
            searchable={true}
            respclass="col-xl-3 col-md-6 col-sm-6 col-12"
            dynamicOptions={roomTypeList}
            value={plan.roomType}
            handleChange={(name, value) => setPlanField("roomType", value)}
          />
          <ReactSelect
            placeholderName={t("Start Time")}
            id="courseStartTime"
            name="courseStartTime"
            searchable={true}
            respclass="col-xl-2 col-md-6 col-sm-6 col-12"
            dynamicOptions={START_TIME_OPTIONS}
            value={plan.slotStart}
            handleChange={(name, value) => setPlanField("slotStart", value)}
          />
          <ReactSelect
            placeholderName={t("Duration")}
            id="courseDuration"
            name="courseDuration"
            searchable={true}
            respclass="col-xl-2 col-md-6 col-sm-6 col-12"
            dynamicOptions={DURATION_OPTIONS}
            value={plan.slotDuration}
            handleChange={(name, value) => setPlanField("slotDuration", value)}
          />
          <div className="col-xl-5 col-md-12 col-sm-12 col-12 d-flex align-items-center" style={{ gap: "10px", flexWrap: "wrap" }}>
            <label style={{ fontSize: "12px", color: "#475569", display: "inline-flex", alignItems: "center", gap: "7px", margin: 0 }}>
              <input
                type="checkbox"
                checked={plan.sameBed}
                onChange={(e) => setPlanField("sameBed", e.target.checked)}
              />
              {t("Keep the same bed for every session when possible")}
            </label>
          </div>
        </div>

        <div style={{ padding: "4px 12px 12px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-primary btn-sm px-3"
            onClick={handleGenerate}
            disabled={generating}
          >
            <i className="fas fa-wand-magic-sparkles mr-1" aria-hidden="true" />
            {generating ? `${t("Allocating beds")}...` : t("Generate Sessions & Allocate Beds")}
          </button>
          {patternValue !== "none" && (
            <span style={{ fontSize: "11.5px", color: "#64748b" }}>
              {describeCourse({
                pattern: patternValue,
                count: plan.count,
                weekdays: plan.weekdays,
                everyNDays: plan.everyNDays,
              })}
              {" · "}
              {t("replaces the sessions below")}
            </span>
          )}
        </div>
      </div>

      {/* ── Allocation summary ─────────────────────────────────────────── */}
      {sessions.length > 1 && (
        <div
          className={BOX_CLASS}
          style={{ marginBottom: "6px", borderLeft: `3px solid ${unallocated ? "#e11d48" : "#15803d"}` }}
        >
          <div style={{ padding: "8px 12px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", fontSize: "12px" }}>
            <span style={{ fontWeight: 700, color: "#1f2a37" }}>
              {sessions.length} {t("sessions")}
            </span>
            <span style={{ color: "#15803d", fontWeight: 600 }}>
              <i className="fas fa-check-circle mr-1" aria-hidden="true" />
              {allocated} {t("with a bed")}
            </span>
            {unallocated > 0 && (
              <span style={{ color: "#e11d48", fontWeight: 600 }}>
                <i className="fas fa-exclamation-circle mr-1" aria-hidden="true" />
                {unallocated} {t("still need a bed")}
              </span>
            )}
            <span style={{ color: "#64748b" }}>
              {moment(sessions[0]?.date).format("DD-MMM-YYYY")}
              {" → "}
              {moment(sessions[sessions.length - 1]?.date).format("DD-MMM-YYYY")}
            </span>
            <button
              type="button"
              className="btn btn-sm"
              style={{ marginLeft: "auto", fontSize: "11px", fontWeight: 600, color: "#0f766e" }}
              onClick={() =>
                setSessions((list) => {
                  const anyOpen = list.some((s) => s.expanded);
                  return list.map((s) => ({ ...s, expanded: !anyOpen }));
                })
              }
            >
              {sessions.some((s) => s.expanded) ? t("Collapse All") : t("Expand All")}
            </button>
          </div>
        </div>
      )}

      {/* ── Sessions ───────────────────────────────────────────────────── */}
      {sessions.map((s, i) => {
        const isDupe = duplicateKeys.has(s.key);
        const range = slotRange(s.slotStart, s.slotDuration);
        const noBed = !s?.bed?.value;
        return (
          <div
            key={s.key}
            className={BOX_CLASS}
            style={{
              marginBottom: "6px",
              border: isDupe ? "1px solid #e11d48" : undefined,
              borderLeft: noBed ? "3px solid #e11d48" : "3px solid #15803d",
            }}
          >
            <div className="card-header">
              <h4
                className="card-title w-100 d-flex align-items-center justify-content-between m-0"
                style={{ padding: "8px 12px", gap: "8px", flexWrap: "wrap" }}
              >
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpanded(s.key)}
                  onKeyDown={(e) => { if (e.key === "Enter") toggleExpanded(s.key); }}
                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}
                >
                  <i className={`fas fa-chevron-${s.expanded ? "down" : "right"}`} style={{ fontSize: "10px", color: "#94a3b8" }} aria-hidden="true" />
                  <span>
                    {t("Session")} {i + 1} {t("of")} {sessions.length}
                  </span>
                  {/* The whole sitting on one line, so a long course can be read
                      without opening every row. */}
                  <span style={{ fontWeight: 400, fontSize: "11.5px", color: "#64748b" }}>
                    {moment(s.date).format("ddd, DD-MMM-YYYY")}
                    {" · "}
                    {range.from ? range.label : t("Full Day")}
                  </span>
                  {s?.bed?.value ? (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#0f766e", background: "#ecfdf8", borderRadius: "999px", padding: "2px 10px" }}>
                      <i className="fas fa-bed mr-1" aria-hidden="true" />
                      {s.bed.label}
                    </span>
                  ) : (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#e11d48", background: "#fff1f2", borderRadius: "999px", padding: "2px 10px" }}>
                      {t("No bed")}
                    </span>
                  )}
                </span>
                {sessions.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ color: "#e11d48", fontSize: "11px", fontWeight: 600 }}
                    onClick={() => removeSession(s.key)}
                  >
                    <i className="fas fa-times mr-1" aria-hidden="true" />
                    {t("Remove Session")}
                  </button>
                )}
              </h4>
            </div>

            {s.expanded && (
              <>
                <div className="row pt-2 pl-2 pr-2">
                  <DatePicker
                    className="custom-calendar"
                    id={`date_${s.key}`}
                    name={`date_${s.key}`}
                    lable={t("Session Date")}
                    value={moment(s.date).toDate()}
                    handleChange={(e) => handleDate(s, e.target.value)}
                    minDate={moment().toDate()}
                    respclass="col-xl-3 col-md-6 col-sm-6 col-12"
                  />
                  <ReactSelect
                    placeholderName={t("RoomType")}
                    id={`roomType_${s.key}`}
                    name={`roomType_${s.key}`}
                    searchable={true}
                    respclass="col-xl-3 col-md-6 col-sm-6 col-12"
                    dynamicOptions={roomTypeList}
                    value={s.roomType}
                    handleChange={(name, value) => handleRoomType(s, value)}
                  />
                  <ReactSelect
                    placeholderName={t("Start Time")}
                    id={`slotStart_${s.key}`}
                    name={`slotStart_${s.key}`}
                    searchable={true}
                    respclass="col-xl-2 col-md-6 col-sm-6 col-12"
                    dynamicOptions={START_TIME_OPTIONS}
                    value={s.slotStart}
                    handleChange={(name, value) => handleSlotPart(s, "slotStart", value)}
                  />
                  <ReactSelect
                    placeholderName={t("Duration")}
                    id={`slotDuration_${s.key}`}
                    name={`slotDuration_${s.key}`}
                    searchable={true}
                    respclass="col-xl-2 col-md-6 col-sm-6 col-12"
                    dynamicOptions={DURATION_OPTIONS}
                    value={s.slotDuration}
                    handleChange={(name, value) => handleSlotPart(s, "slotDuration", value)}
                  />
                  {/* Derived, never typed: start + duration, clamped to the day. */}
                  <div className="col-xl-2 col-md-6 col-sm-6 col-12">
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px" }}>{t("Slot")}</div>
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: range.from ? "#0f766e" : "#94a3b8" }}>
                      {range.from ? range.label : t("Full Day")}
                    </div>
                  </div>
                </div>

                {/* bed board for this session's type + date */}
                <div style={{ padding: "0 12px 10px" }}>
                  <div style={FIELD_LABEL}>
                    {t("Select Bed")}
                    <span style={{ fontWeight: 400, color: "#94a3b8" }}>
                      {" "}· {moment(s.date).format("DD-MMM-YYYY")}
                    </span>
                  </div>

                  {!s?.roomType?.value ? (
                    <div style={EMPTY_HINT}>
                      <i className="fas fa-bed" style={{ fontSize: "20px", color: "#cbd5e1" }} />
                      {t("Select a Day Care room type to see its beds")}
                    </div>
                  ) : s.loadingBeds ? (
                    <div style={EMPTY_HINT}>{t("Loading")}...</div>
                  ) : s.bedList.length === 0 ? (
                    <div style={EMPTY_HINT}>
                      <i className="fas fa-bed" style={{ fontSize: "20px", color: "#cbd5e1" }} />
                      {t("No bed found for this room type")}
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))", gap: "7px" }}>
                      {s.bedList.map((bd) => {
                        const st = BED_STATE[bd?.BedStatus] || BED_STATE.Free;
                        const active = String(s?.bed?.value) === String(bd?.RoomID);
                        return (
                          <button
                            key={bd?.RoomID}
                            type="button"
                            onClick={() => handleBedPick(s, bd)}
                            title={bd?.Name}
                            style={{
                              cursor: st.selectable ? "pointer" : "not-allowed",
                              textAlign: "left",
                              border: active ? "1.5px solid #0d9488" : "1px solid #e6eaf0",
                              background: active ? "#ecfdf8" : "#fff",
                              borderRadius: "8px", padding: "6px 8px",
                              display: "flex", flexDirection: "column", gap: "2px",
                              minWidth: 0, opacity: st.selectable ? 1 : 0.7,
                            }}
                          >
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1f2a37", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {bd?.RoomName}
                            </span>
                            {bd?.BedNo && (
                              <span style={{ fontSize: "10.5px", color: "#64748b" }}>
                                {t("Bed")}: {bd?.BedNo}
                              </span>
                            )}
                            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10.5px", color: st.c, fontWeight: 600 }}>
                              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: st.dot, display: "inline-block" }} />
                              {t(bd?.BedStatus)}
                            </span>
                            {bd?.BookedSlots && bd?.BedStatus !== "Occupied" && (
                              <span style={{ fontSize: "9.5px", color: "#b45309", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                                title={`${t("Booked")}: ${bd.BookedSlots}`}>
                                {bd.BookedSlots}
                              </span>
                            )}
                            {bd?.BedStatus === "PartBooked" && (
                              <span style={{ fontSize: "9.5px", color: "#15803d", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                                title={freeGaps(bd?.BookedWindows).map((g) => g.label).join(", ")}>
                                {t("Free")} {freeGaps(bd?.BookedWindows).map((g) => g.label).join(", ")}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {isDupe && (
                    <div style={{ marginTop: "6px", fontSize: "11.5px", color: "#e11d48" }}>
                      <i className="fas fa-exclamation-circle mr-1" aria-hidden="true" />
                      {t("Two sessions cannot use the same bed at overlapping times")}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* ── Shared fields + actions ────────────────────────────────────── */}
      <div className={BOX_CLASS}>
        <div className="row pt-2 pl-2 pr-2">
          <Input
            type="text"
            className="form-control"
            id="pkgInstructions"
            name="pkgInstructions"
            lable={t("Pre Procedure Instructions")}
            placeholder=" "
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            respclass="col-xl-8 col-md-8 col-sm-12 col-12"
          />
          <div className="col-xl-4 col-md-4 col-sm-12 col-12 d-flex align-items-center">
            <label style={{ fontSize: "12.5px", color: "#475569", display: "inline-flex", alignItems: "center", gap: "7px", margin: 0 }}>
              <input type="checkbox" checked={sendSMS} onChange={(e) => setSendSMS(e.target.checked)} />
              {t("Send SMS Confirmation")}
            </label>
          </div>
        </div>

        <div style={{ padding: "4px 12px 10px", fontSize: "11.5px", color: "#64748b" }}>
          <i className="fas fa-info-circle mr-2" style={{ color: "#94a3b8" }} aria-hidden="true" />
          {t("These beds will be held for this patient until the booking is confirmed or cancelled")}
        </div>

        <div style={{ padding: "0 12px 12px", display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-outline-secondary btn-sm px-3" onClick={addSession}>
            <i className="fas fa-plus mr-1" aria-hidden="true" />
            {t("Add Session")}
          </button>
          <button type="button" className="btn btn-secondary btn-sm px-4" onClick={onClose}>
            {t("Close")}
          </button>
          <button
            type="button"
            className="btn-primary btn-sm px-4 custom_save_button"
            onClick={handleBook}
            disabled={saving || generating}
          >
            {t("Book All Sessions")} ({sessions.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayCarePackageBookingModal;
