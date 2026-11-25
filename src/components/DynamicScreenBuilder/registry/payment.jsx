/**
 * PAYMENT CONTROL — the app's own <PaymentGateway /> as a screen-builder component.
 *
 * Every billing screen in the product ends the same way: a currency + payment
 * mode picker over a table of tenders on the left, the amount ladder (gross,
 * discount, co-pay, round off, patient/panel payable, paid, balance, change)
 * on the right, and the save button underneath. That panel is not a layout — it
 * is a calculator with eleven endpoints behind it, a multi-currency conversion
 * factor, a patient-advance ceiling, and a discount block gated on an approval
 * list. Rebuilding it out of inputs and a table would be rebuilding the
 * arithmetic, and the two copies would drift the first time a rule changed.
 *
 * So nothing is rebuilt. The real component is mounted, exactly as a hand-coded
 * page mounts it, and this file is only the wiring a page would otherwise write
 * by hand:
 *
 *   - the state a page owns. <PaymentGateway /> is controlled: the page holds
 *     `screenType` (what is owed) and `paymentMethod` (what has been tendered)
 *     and hands both down with their setters. That state lives here, in the
 *     node, so the panel behaves identically — the same debounce that
 *     auto-selects the default payment mode, the same settle-on-every-edit.
 *   - the seed. A page calls `handlePaymentGateWay(details)` whenever a new
 *     bill is loaded: it clears the tenders and replaces the whole state.
 *     Here the same thing happens when the BOUND amounts change, so pointing
 *     `Gross amount` at {{values.billAmount}} is all a screen has to do.
 *   - the answers, published back into the form. The rows land under the node's
 *     field, the whole calculator under `stateField`, and the API-ready
 *     `paymentDetail` array — the same one `payloadSettlerForPaymentGateWay`
 *     builds for every hand-coded save — under `payloadField`. A Save button's
 *     action chain then posts {{values.paymentDetail}} and
 *     {{values.paymentState.netAmount}} without knowing any of this exists.
 *   - the lookups a page fetches for it: the discount reason list, the
 *     approval list and the signed-in user's eligible discount percent.
 *
 * The save button itself is a CHILD: the node is a container, and whatever is
 * dropped in it is handed to the panel as its `button` slot — so the button is
 * an ordinary Button component with an ordinary action chain, styled and
 * validated like every other button on the screen.
 *
 * On the canvas the real panel is never mounted. It calls its currency and
 * payment-mode endpoints the moment it appears and writes to the app's store;
 * a designer dragging a layout around must not be firing those. A static
 * look-alike of the same markup stands in, so the canvas still lays out at the
 * size and shape the real thing will take.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import PaymentGateway from "@app/components/front-office/PaymentGateway";
import Input from "@app/components/formComponent/Input";
import ReactSelect from "@app/components/formComponent/ReactSelect";
import { PAYMENT_OBJECT } from "@app/utils/constant";
import { payloadSettlerForPaymentGateWay } from "@app/utils/utils";
import {
  BindDisApprovalList,
  GetDiscReasonList,
  GetEligiableDiscountPercent,
} from "@app/networkServices/opdserviceAPI";

import { GROUPS, Icon, p } from "./shared";
import { tr } from "../utils/i18n";

/* -------------------------------------------------------------------------- */
/*  seeds                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A bound prop, as the panel wants it.
 *
 * Everything reaches a node as text — `{{values.billAmount}}` resolves to
 * "1250.00", a blank box to "". The panel compares several of these strictly
 * (`isReceipt === 0`, `switch (refund) { case 1: }`, `coPayIsDefault === 1`),
 * so handing it a string is not a cosmetic difference: it is the difference
 * between the refund filter running and silently not running.
 */
const coerce = (v, fallback) => {
  if (v === undefined || v === null) return fallback;
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (s === "") return fallback;
  if (s === "true") return true;
  if (s === "false") return false;
  if (s === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
};

/** A bound amount. Anything unreadable is 0, never NaN — NaN poisons the ladder. */
const num = (v, fallback = 0) => {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
};

/** A bound amount that is allowed to be "not set" — the payable ceilings. */
const numOrNull = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

/** An object-valued binding ({{vars.patient}}); anything else reads as none. */
const asRecord = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);

/**
 * The state a page would hand the panel for one bill.
 *
 * Mirrors `handlePaymentGateWay` on the hand-coded screens, key for key, on top
 * of the product's own PAYMENT_OBJECT defaults — so a screen that binds only
 * the gross amount still gets the panel a page gets.
 */
function seedOf(props) {
  const minimum = numOrNull(props.minimumPayableAmount);
  const constant = numOrNull(props.constantMinimumPayableAmount);
  const gross = num(props.billAmount);

  /**
   * "Nothing has been paid on this yet, so it can only go back as Credit."
   *
   * The panel already enforces this — but it decides WHEN by reading the
   * browser's path (`/opd-return`, `/patient-indent-issue-ipd`), which a built
   * screen replacing one of those pages does not have and never can. The rule
   * itself is not about the route: it is "credit only, unless the patient has
   * actually paid something", and the panel reaches it through `isReceipt === 0`
   * — the very same filter. So it is asked for here as a switch instead, and
   * reaches the panel the way the panel already understands.
   */
  const paid = num(asRecord(props.patientDetail)?.TotalPaidAmount, 0);
  const creditOnly = !!props.creditOnlyWhenUnpaid && paid === 0;
  // The panel caps the patient's share at this; unbound it is the whole net
  // amount, which is what a page passes when there is no scheme behind the bill.
  const ceiling = constant === null ? (minimum === null ? gross : minimum) : constant;
  return {
    panelID: coerce(props.panelID, 1),
    billAmount: gross,
    discountAmount: num(props.discountAmount),
    isReceipt: creditOnly ? 0 : coerce(props.isReceipt, true),
    patientAdvanceAmount: num(props.patientAdvanceAmount),
    panelAdvanceAmount: num(props.panelAdvanceAmount),
    autoPaymentMode: coerce(props.autoPaymentMode, 0),
    minimumPayableAmount: minimum === null ? ceiling : minimum,
    constantMinimumPayableAmount: ceiling,
    disableDiscount: !!props.disableDiscount,
    refund: coerce(props.refund, false),
    discountIsDefault: coerce(props.discountIsDefault, 0),
    coPayIsDefault: coerce(props.coPayIsDefault, 0),
    coPayAmount: num(props.coPayAmount),
    coPayPercent: num(props.coPayPercent),
    /**
     * The boxes the ladder itself fills in.
     *
     * PAYMENT_OBJECT does not carry them, so on a hand-coded page the net
     * amount, discount percent, round off and the rest are `undefined` until
     * the first settle — and React logs "changing an uncontrolled input to be
     * controlled" for each one on the way. Seeding them costs nothing (every
     * calculation derives from the gross and the discount, never from these)
     * and the panel starts as a set of proper controlled inputs.
     */
    netAmount: gross,
    roundOff: 0,
    discountPercentage: 0,
    discountPercentageWithoutRoundoff: 0,
    panelPayable: 0,
    paidAmount: 0,
    balanceAmount: gross,
    charge: "",
    Remark: "",
    DepositedBy: "",
    DiscountReasons1: "",
  };
}

/* -------------------------------------------------------------------------- */
/*  discount lookups                                                           */
/* -------------------------------------------------------------------------- */

const DEFAULT_THERMAL = [
  { label: "Yes", value: "1" },
  { label: "No", value: "0" },
];

/**
 * The approval list, whatever shape it arrived in.
 *
 * `BindDisApproval` answers with a different pair of column names per
 * deployment (ID/ApprovalType, ApproverEmpID/EmployeeName, ValueField/TextField),
 * and the panel reads exactly one of them. Same normalisation the hand-coded
 * booking screens do, so an approval list that works there works here.
 */
const normalizeApprovals = (list = []) =>
  (Array.isArray(list) ? list : []).map((item) => ({
    ...item,
    ID: item?.ID ?? item?.ApproverEmpID ?? item?.EmployeeID ?? item?.EmpID ?? item?.ApprovalID ?? item?.ValueField ?? "",
    ApprovalType: item?.ApprovalType ?? item?.Name ?? item?.EmployeeName ?? item?.NAME ?? item?.TextField ?? "",
  }));

/** A designer-typed option list -> the row shape the panel's selects expect. */
const optionsToRows = (list, labelKey, valueKey) =>
  (Array.isArray(list) ? list : []).map((o) => ({
    [labelKey]: o?.label ?? "",
    [valueKey]: o?.value ?? o?.label ?? "",
  }));

const EMPTY_DISCOUNTS = { discountReasonList: [], discountApprovalList: [], Eligible_DiscountPercent: 100 };

/**
 * The discount block's three lookups.
 *
 * A hand-coded page fetches these itself (GetDiscListAPI) and hands the panel
 * one `discounts` object; the node does the same. "Static" is for the screens
 * that have a fixed pair of lists, and "none" leaves the block empty — the
 * panel still disables it whenever the discount is zero, exactly as before.
 */
function useDiscounts(props, design) {
  const [discounts, setDiscounts] = useState(EMPTY_DISCOUNTS);
  const mode = props.discountSource || "api";
  const reasonsKey = JSON.stringify(props.discountReasons || []);
  const approvalsKey = JSON.stringify(props.discountApprovals || []);
  const employeeID = useMemo(() => {
    if (props.employeeID) return props.employeeID;
    try {
      return JSON.parse(window.localStorage.getItem("userData"))?.employeeID ?? "";
    } catch (e) {
      return "";
    }
  }, [props.employeeID]);

  useEffect(() => {
    if (design) return undefined;
    if (mode === "none") {
      setDiscounts({ ...EMPTY_DISCOUNTS, Eligible_DiscountPercent: num(props.eligibleDiscountPercent, 100) });
      return undefined;
    }
    if (mode === "static") {
      setDiscounts({
        discountReasonList: optionsToRows(JSON.parse(reasonsKey), "DiscountReason", "ID"),
        discountApprovalList: optionsToRows(JSON.parse(approvalsKey), "ApprovalType", "ID"),
        Eligible_DiscountPercent: num(props.eligibleDiscountPercent, 100),
      });
      return undefined;
    }
    let alive = true;
    (async () => {
      try {
        const [reasonRes, percentRes, approvalRes] = await Promise.all([
          GetDiscReasonList(props.discountType || "OPD"),
          GetEligiableDiscountPercent(employeeID),
          BindDisApprovalList(props.approvalType || "HOSPITAL", props.approvalListType ?? "1"),
        ]);
        if (!alive) return;
        setDiscounts({
          discountReasonList: Array.isArray(reasonRes?.data) ? reasonRes.data : [],
          discountApprovalList: normalizeApprovals(approvalRes?.data || []),
          // A user with no cap configured is not a user who may not discount:
          // the hand-coded screens leave the eligible percent alone when the
          // endpoint says nothing, and the panel's cap then never bites.
          Eligible_DiscountPercent: percentRes?.data?.Eligible_DiscountPercent ?? num(props.eligibleDiscountPercent, 100),
        });
      } catch (e) {
        // A lookup that fails must not take the panel down with it — the
        // amounts still work, the discount block simply offers nothing.
        console.error("Payment control: discount lookups failed", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [
    design,
    mode,
    props.discountType,
    props.approvalType,
    props.approvalListType,
    props.eligibleDiscountPercent,
    employeeID,
    reasonsKey,
    approvalsKey,
  ]);

  return discounts;
}

/* -------------------------------------------------------------------------- */
/*  the live panel                                                             */
/* -------------------------------------------------------------------------- */

function PaymentLive({ node, props, style, rt, slot }) {
  const seed = seedOf(props);
  const seedKey = JSON.stringify(seed);

  const [screenType, setScreenType] = useState(() => ({ ...PAYMENT_OBJECT, ...seed }));
  const [paymentMethod, setPaymentMethod] = useState([]);
  const [thermal, setThermal] = useState(() => String(coerce(props.thermalDefault, PAYMENT_OBJECT.isThermal)));
  const discounts = useDiscounts(props, false);

  const fieldRows = props.field || node.id;
  const fieldState = props.stateField || "";
  const fieldPayload = props.payloadField || "";
  const fieldThermal = props.thermalField || "isThermal";

  /**
   * A new bill: clear the tenders, replace the calculator.
   *
   * The same thing `handlePaymentGateWay` does on a hand-coded screen — and it
   * has to be a REPLACE, not a merge: a discount, a co-pay and a round-off
   * carried over from the previous bill would be applied to this one.
   *
   * Keyed on the bound values rather than on every render, so the panel's own
   * writes (it settles the ladder on every edit) never look like a new bill.
   */
  const seededRef = useRef(null);
  useEffect(() => {
    if (seededRef.current === null) {
      seededRef.current = seedKey; // the mount already seeded it
      return;
    }
    if (seededRef.current === seedKey) return;
    seededRef.current = seedKey;
    setPaymentMethod([]);
    setScreenType({ ...PAYMENT_OBJECT, ...JSON.parse(seedKey), isThermal: thermal });
    // `thermal` is deliberately not a dependency: re-seeding is about the bill.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey]);

  /**
   * Publish an answer into the form, once per genuine change.
   *
   * `rt.setValue` dispatches unconditionally, and these effects depend on
   * `rt.values` — so writing the same payload back every time would be a render
   * loop rather than a wasted render. Compared on the serialised value, which
   * is what a payload is anyway.
   */
  const published = useRef({});
  const publish = useCallback(
    (key, value) => {
      if (!key || !rt || rt.design) return;
      const next = JSON.stringify(value === undefined ? null : value);
      if (published.current[key] === next) return;
      published.current[key] = next;
      rt.setValue(key, value);
    },
    [rt],
  );

  // The tenders, and the array a save posts. `rt.values` is handed to the
  // settler as the page's own form values are: that is where the CMR fund
  // fields (AdvanceType, GoNumber, goDate, IGRSNumber, EstiMateNumber) come
  // from, so a screen that shows them has them in its payload for free.
  const values = rt?.values;
  useEffect(() => {
    publish(fieldRows, paymentMethod);
    if (fieldPayload) {
      publish(fieldPayload, payloadSettlerForPaymentGateWay(paymentMethod || [], values || {}, screenType || {}));
    }
  }, [paymentMethod, screenType, values, publish, fieldRows, fieldPayload]);

  // The whole calculator, so {{values.paymentState.netAmount}} reads the ladder.
  useEffect(() => {
    if (fieldState) publish(fieldState, screenType);
  }, [screenType, publish, fieldState]);

  // A default that is only on screen is not an answer: a save posts the form,
  // so the thermal choice nobody changed would go up empty. Same contract every
  // other control's default follows (shared/useSeedValue).
  useEffect(() => {
    if (props.thermalEnabled) publish(fieldThermal, thermal);
  }, [props.thermalEnabled, fieldThermal, thermal, publish]);

  /**
   * A screen-wide reset empties the panel too.
   *
   * `resetForm` — what a save runs once the receipt has printed — clears
   * rt.values and nothing else. The panel's own state lives HERE, not in the
   * form, so the previous patient's tenders, discount and ladder would still be
   * sitting on screen behind a blank form, ready to be saved a second time.
   *
   * A screen whose amount is bound to a form value resets anyway, because the
   * seed it is keyed on went with the rest of the form; one whose amount comes
   * from a variable, a data source or a fixed number does not, and those are
   * most of them. So the reset is read where it actually shows: this node's own
   * answer is gone from the form it just published it to.
   */
  const rowsInForm = rt?.values?.[fieldRows];
  useEffect(() => {
    if (!rt || rt.design) return;
    if (rowsInForm !== undefined) return;
    // Nothing published yet — this is the first render, not a reset.
    if (!Object.prototype.hasOwnProperty.call(published.current, fieldRows)) return;
    published.current = {};
    setPaymentMethod([]);
    setScreenType({ ...PAYMENT_OBJECT, ...JSON.parse(seedKey) });
    setThermal(String(coerce(props.thermalDefault, PAYMENT_OBJECT.isThermal)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsInForm, fieldRows, rt?.design]);

  /**
   * Event chains. Skipped on the first run of each: a screen that reacts to a
   * payment being added must not fire that chain for the empty list it starts
   * with.
   */
  const firstRows = useRef(true);
  const firstTotals = useRef(true);
  const fire = useCallback(
    (event, payload) => {
      if (!rt || rt.design || !node?.events?.[event]) return;
      rt.runEvent(node, event, payload);
    },
    [rt, node],
  );
  useEffect(() => {
    if (firstRows.current) {
      firstRows.current = false;
      return;
    }
    fire("onChange", { value: paymentMethod, field: fieldRows });
  }, [paymentMethod, fire, fieldRows]);
  useEffect(() => {
    if (firstTotals.current) {
      firstTotals.current = false;
      return;
    }
    fire("onTotalsChange", { value: screenType, field: fieldState || fieldRows });
  }, [screenType, fire, fieldState, fieldRows]);

  /** The thermal-printout select a few receipt screens add beside the totals. */
  const thermalPrintout = useMemo(() => {
    if (!props.thermalEnabled) return undefined;
    const options = Array.isArray(props.thermalOptions) && props.thermalOptions.length ? props.thermalOptions : DEFAULT_THERMAL;
    return {
      placeholderName: tr(props.thermalLabel || "Thermal Printout"),
      id: fieldThermal,
      name: fieldThermal,
      dynamicOptions: options,
      value: thermal,
      handleChange: (name, e) => {
        const next = e?.value ?? "";
        setThermal(String(next));
        setScreenType((prev) => ({ ...prev, isThermal: next }));
        publish(fieldThermal, next);
      },
    };
  }, [props.thermalEnabled, props.thermalLabel, props.thermalOptions, fieldThermal, thermal, publish]);

  /**
   * The UPI / Razorpay button inside the tender table.
   *
   * Only handed over when the screen actually bound a chain to it: the table
   * draws the button whenever the callback exists, and a button that does
   * nothing when pressed is worse than no button.
   */
  const onRazorpayClick = useMemo(() => {
    if (!node?.events?.onRazorpay) return undefined;
    return (amount) => rt?.runEvent(node, "onRazorpay", { value: amount, amount });
  }, [rt, node]);

  const patientDetail = asRecord(props.patientDetail);
  const singlePatientData = asRecord(props.singlePatientData);

  /**
   * Nothing owed: the panel draws nothing, exactly as it does on a hand-coded
   * page before a bill is loaded, and a screen that would rather say so out
   * loud sets `emptyText`.
   *
   * The note goes BESIDE the panel, never instead of it. <PaymentGateway />
   * fetches its four lookups once, on mount, but decides whether to auto-select
   * the default payment mode on a 500ms debounce off the amount — so a panel
   * first mounted with the amount already in it races its own currency list and
   * quietly settles nothing. Mounted from the start, as a page mounts it, the
   * lookups are long since in by the time an amount arrives.
   */
  const nothingOwed = !screenType?.billAmount;
  // Marked Required and saved with no tender: `validate` put the message under
  // this node's field, and a panel that did not draw it left a save that
  // stopped for no visible reason.
  const error = rt?.errors?.[fieldRows] || "";

  return (
    <div
      className={`dsb-payment ${nothingOwed ? "is-empty" : ""} ${error ? "is-error" : ""} ${props.wrapClass || ""}`}
      style={style}
      data-field={fieldRows}
    >
      {error ? <div className="dsb-err dsb-payment-err">{error}</div> : null}
      {nothingOwed && props.emptyText ? (
        <div className="dsb-payment-note">
          <Icon name="Receipt" size={16} />
          <span>{tr(props.emptyText)}</span>
        </div>
      ) : null}
      <PaymentGateway
        screenType={screenType}
        setScreenType={setScreenType}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        discounts={discounts}
        pkgDisable={!!props.lockPaymentMode}
        patientDetail={patientDetail}
        singlePatientData={singlePatientData}
        thermalPrintout={thermalPrintout}
        onRazorpayClick={onRazorpayClick}
        button={slot}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  the canvas stand-in                                                        */
/* -------------------------------------------------------------------------- */

const AMOUNT_CELL = "col-12 col-6 col-sm-6 col-md-4 col-lg-4 col-xl-4 col-xxl-3";

/** One read-only box of the amount ladder, drawn with the app's own control. */
const PreviewAmount = ({ label, value = "0.00" }) => (
  <Input
    type="text"
    className="form-control"
    lable={tr(label)}
    placeholder=" "
    display="right"
    disabled
    removeFormGroupClass={false}
    respclass={AMOUNT_CELL}
    value={value}
  />
);

const PreviewSelect = ({ label, cls }) => (
  <ReactSelect placeholderName={tr(label)} respclass={cls} dynamicOptions={[]} isDisabled value="" handleChange={() => {}} />
);

/**
 * What the canvas shows instead of the panel.
 *
 * Deliberately the same markup and the same grid classes as the real thing, so
 * a row that fits beside it on the canvas fits beside it on the page. Nothing
 * here calls anything.
 */
function PaymentPreview({ props, style, slot }) {
  const gross = num(props.billAmount).toFixed(2);
  return (
    <div className={`dsb-payment is-design ${props.wrapClass || ""}`} style={style}>
      <div className="row g-4 pt-2">
        <div className="col-md-7 col-sm-12">
          <div className="card">
            <div className="row p-2">
              <PreviewSelect label="Currency" cls="col-md-2" />
              <PreviewSelect label="PaymentMode" cls="col-md-3" />
              <Input
                type="text"
                className="form-control"
                lable={tr("Remark")}
                placeholder=" "
                disabled
                removeFormGroupClass={false}
                respclass="col-md-3"
                value=""
              />
              <div className="col-md-4">
                <label className="inrkey mx-2">
                  <span>0.0000 </span>
                </label>
                <label>{tr("Factor")} :</label>
                <label> 1 = </label>
              </div>
            </div>
            <div className="dsb-payment-grid">
              {["Payment Mode", "Paid Amount", "Currency", "Bank Name", "Ref No.", "Machine", "Base", "Action"].map((h) => (
                <span key={h}>{tr(h)}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="col-md-5 col-sm-12">
          <div className="card">
            <div className="row p-2">
              <PreviewAmount label="Gross_Amount" value={gross} />
              <PreviewAmount label="Discount_Amt" />
              <PreviewAmount label="Net_Amount" value={gross} />
              <PreviewAmount label="Co-Pay_Amount" />
              <PreviewAmount label="Discount_in%" />
              <PreviewAmount label="Patient_Payable" value={gross} />
              <PreviewAmount label="Co-Pay_Percent" />
              <PreviewAmount label="Round_Off" />
              <PreviewAmount label="Panel_Payable" />
              <PreviewAmount label="Paid_Amount" />
              <PreviewAmount label="Balance_Amount" value={gross} />
              <PreviewAmount label="Change" value="" />
              <PreviewAmount label="Return" value="" />
              <PreviewSelect label="Discount Type" cls={AMOUNT_CELL} />
              <PreviewAmount label="Discount Reason" value="" />
              <PreviewSelect label="Approved By" cls={AMOUNT_CELL} />
              <PreviewAmount label="Deposited By" value="" />
              {props.thermalEnabled ? <PreviewSelect label={props.thermalLabel || "Thermal Printout"} cls={AMOUNT_CELL} /> : null}
              <div className="col-12 dsb-payment-slot">
                {slot || <span className="dsb-drop-hint">Drop the save button here</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  the definition                                                             */
/* -------------------------------------------------------------------------- */

const bound = (key, label, extra = {}) => p.template(key, label, GROUPS.DATA, extra);

const PaymentControlDef = {
  type: "PaymentControl",
  label: "Payment Control",
  icon: "Wallet",
  category: "Form",
  isContainer: true,
  dropHint: "Drop the save button here",
  bindable: true,
  defaultProps: {
    // what is owed
    billAmount: "",
    discountAmount: "",
    panelID: "1",
    isReceipt: "",
    refund: "",
    patientAdvanceAmount: "",
    panelAdvanceAmount: "",
    autoPaymentMode: "",
    minimumPayableAmount: "",
    constantMinimumPayableAmount: "",
    coPayAmount: "",
    coPayPercent: "",
    disableDiscount: false,
    discountIsDefault: "",
    coPayIsDefault: "",
    lockPaymentMode: false,
    creditOnlyWhenUnpaid: false,
    patientDetail: "",
    singlePatientData: "",
    // what it answers with
    field: "paymentMethod",
    stateField: "paymentState",
    payloadField: "paymentDetail",
    // the discount block's lookups
    discountSource: "api",
    discountType: "OPD",
    approvalType: "HOSPITAL",
    approvalListType: "1",
    employeeID: "",
    eligibleDiscountPercent: "",
    discountReasons: [],
    discountApprovals: [],
    // extras
    thermalEnabled: false,
    thermalLabel: "Thermal Printout",
    thermalField: "isThermal",
    thermalDefault: "0",
    thermalOptions: DEFAULT_THERMAL,
    emptyText: "",
    wrapClass: "",
  },
  defaultStyle: {},
  events: ["onChange", "onTotalsChange", "onRazorpay"],
  /**
   * The panel answers under three names, not one, and a save reaches for the
   * payload far more often than for the raw tenders. All three are offered
   * wherever a value is picked — an endpoint's parameters above all.
   */
  publishes: (node) => [
    node?.props?.stateField,
    node?.props?.payloadField,
    node?.props?.thermalEnabled ? node?.props?.thermalField || "isThermal" : "",
  ],
  propSchema: [
    {
      key: "howNote",
      label: "How this works",
      type: "note",
      group: GROUPS.DATA,
      text:
        "The app's real payment panel is mounted here — currency conversion, payment modes, the patient-advance ceiling, discount, co-pay and round off all behave exactly as they do on a hand-coded billing page. Bind the gross amount below; drop a Button inside this component to be its save button.",
    },

    /* ---- what is owed --------------------------------------------------- */
    bound("billAmount", "Gross amount", {
      placeholder: "{{values.billAmount}}",
      hint: "The panel shows nothing until this is more than zero — the same as on a hand-coded page before a bill is loaded. Changing it clears the tenders and starts the bill again.",
    }),
    bound("discountAmount", "Discount amount", { placeholder: "0" }),
    bound("panelID", "Panel / scheme id", {
      placeholder: "{{selected.PanelID.PanelID}}",
      hint: "Decides which payment modes the panel offers (BindPaymentModePanelWise).",
    }),
    bound("minimumPayableAmount", "Patient payable", {
      placeholder: "{{values.patientPayable}}",
      hint: "The patient's share of a scheme bill. Left empty it is the whole net amount.",
    }),
    bound("constantMinimumPayableAmount", "Patient payable ceiling", {
      hint: "What the patient's share is reset to when the discount or co-pay changes. Left empty it follows Patient payable.",
    }),
    bound("patientAdvanceAmount", "Patient advance available", {
      placeholder: "{{row.OPDAdvanceAmount}}",
      hint: "Shown beside the Patient Advance payment mode and used as its ceiling.",
    }),
    bound("panelAdvanceAmount", "Panel advance available"),
    bound("coPayAmount", "Co-pay amount"),
    bound("coPayPercent", "Co-pay percent"),

    /* ---- how it behaves -------------------------------------------------- */
    bound("isReceipt", "Receipt mode", {
      group: GROUPS.BEHAVIOUR,
      placeholder: "1",
      hint: "0 restricts the panel to Credit only. Empty behaves as a normal receipt.",
    }),
    p.bool("creditOnlyWhenUnpaid", "Credit only until something has been paid", GROUPS.BEHAVIOUR, {
      hint: "What the Return and IPD indent-issue pages do: while the patient record's TotalPaidAmount is zero, Credit is the only payment mode offered. Needs Patient record bound.",
    }),
    bound("refund", "Refund / advance mode", {
      group: GROUPS.BEHAVIOUR,
      placeholder: "0",
      hint: "1 = refund modes only, 2 = advance modes only, 3 = everything but Patient Advance, 0 or empty = whatever the panel is given.",
    }),
    bound("autoPaymentMode", "Pre-select payment mode", {
      group: GROUPS.BEHAVIOUR,
      placeholder: "1",
      hint: "The PaymentModeID added automatically once the amount is known — Cash on most screens.",
    }),
    p.bool("disableDiscount", "Discount not allowed", GROUPS.BEHAVIOUR),
    bound("discountIsDefault", "Discount is fixed", {
      group: GROUPS.BEHAVIOUR,
      placeholder: "0",
      hint: "1 locks the discount boxes — the bill already carries its own discount.",
    }),
    bound("coPayIsDefault", "Co-pay is fixed", { group: GROUPS.BEHAVIOUR, placeholder: "0" }),
    p.bool("lockPaymentMode", "Lock the payment mode picker", GROUPS.BEHAVIOUR, {
      hint: "Used by package screens, where the mode is decided by the package.",
    }),
    p.text("emptyText", "Text when there is nothing to pay", GROUPS.CONTENT, {
      placeholder: "Search a patient to take a payment",
      hint: "Left empty the panel simply disappears, as it does on a hand-coded page.",
    }),

    /* ---- what it answers with -------------------------------------------- */
    p.text("field", "Tenders field", GROUPS.DATA, {
      hint: "The rows the user added, as {{values.paymentMethod}}. Mark the component Required to make at least one payment mode mandatory.",
    }),
    p.text("stateField", "Totals field", GROUPS.DATA, {
      hint: "The whole calculator: {{values.paymentState.netAmount}}, .balanceAmount, .discountAmount, .minimumPayableAmount, .discountReason, .discountApproveBy, .Remark, .DepositedBy.",
    }),
    p.text("payloadField", "Save payload field", GROUPS.DATA, {
      hint: "The paymentDetail array a save posts, built exactly as every hand-coded billing screen builds it. Post it as {{values.paymentDetail}}.",
    }),
    bound("patientDetail", "Patient record", {
      placeholder: "{{vars.patient}}",
      hint: "Its TotalPaidAmount is what the panel — and the switch above — judge a return by. Bind a whole record, not a field.",
    }),
    bound("singlePatientData", "Patient record for UPI", {
      placeholder: "{{vars.patient}}",
      hint: "Handed to the UPI / Razorpay tile inside the tender table.",
    }),

    /* ---- the discount block ---------------------------------------------- */
    p.select(
      "discountSource",
      "Discount lists come from",
      [
        { value: "api", label: "The discount endpoints" },
        { value: "static", label: "Lists typed here" },
        { value: "none", label: "No discount lists" },
      ],
      GROUPS.DATA,
    ),
    p.text("discountType", "Discount reason type", GROUPS.DATA, {
      placeholder: "OPD",
      when: (pr) => (pr.discountSource || "api") === "api",
      hint: "OPD, IPD, PHARMACY … — the Type the reason list is fetched for.",
    }),
    p.text("approvalType", "Approval list type", GROUPS.DATA, {
      placeholder: "HOSPITAL",
      when: (pr) => (pr.discountSource || "api") === "api",
    }),
    p.text("approvalListType", "Approval list sub-type", GROUPS.DATA, {
      placeholder: "1",
      when: (pr) => (pr.discountSource || "api") === "api",
    }),
    bound("employeeID", "Eligible percent for employee", {
      placeholder: "{{user.employeeID}}",
      when: (pr) => (pr.discountSource || "api") === "api",
      hint: "Left empty the signed-in user is used, as on a hand-coded page.",
    }),
    p.options("discountReasons", "Discount reasons", GROUPS.DATA, {
      when: (pr) => pr.discountSource === "static",
    }),
    p.options("discountApprovals", "Approved by", GROUPS.DATA, {
      when: (pr) => pr.discountSource === "static",
    }),
    p.number("eligibleDiscountPercent", "Maximum discount %", GROUPS.DATA, {
      hint: "The cap the discount-in-% box is clamped to. From the endpoint when the lists are fetched; this is the fallback.",
    }),

    /* ---- thermal printout ------------------------------------------------ */
    p.bool("thermalEnabled", "Ask about thermal printout", GROUPS.CONTENT),
    p.text("thermalLabel", "Thermal printout label", GROUPS.CONTENT, { when: (pr) => !!pr.thermalEnabled }),
    p.text("thermalField", "Thermal printout field", GROUPS.DATA, { when: (pr) => !!pr.thermalEnabled }),
    p.text("thermalDefault", "Thermal printout default", GROUPS.CONTENT, { when: (pr) => !!pr.thermalEnabled, placeholder: "0" }),
    p.options("thermalOptions", "Thermal printout options", GROUPS.CONTENT, { when: (pr) => !!pr.thermalEnabled }),

    /* ---- appearance ------------------------------------------------------ */
    p.text("wrapClass", "Extra CSS class", GROUPS.APPEARANCE),
  ],
  render: ({ node, props, style, rt, children }) =>
    rt?.design ? (
      <PaymentPreview props={props} style={style} slot={children} />
    ) : (
      <PaymentLive node={node} props={props} style={style} rt={rt} slot={children} />
    ),
};

export default [PaymentControlDef];
