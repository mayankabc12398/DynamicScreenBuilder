import React from "react";
import { useSelector } from "react-redux";
import BillCloseUI from "./BillCloseUI";

/**
 * What a finalized bill still lets you open.
 *
 * Once the bill is finalized (patient_medical_history.IsBilledClosed = 1) every tab of
 * the patient's folder was replaced by a padlock, with one screen hard-coded past it -
 * IPD Bill Print. That was written into the code, so a site that needed, say, the
 * discharge summary read after finalisation had no way to say so.
 *
 * The list is now a setting. fin_global_resources -> BillFinalizedOpenScreens holds the
 * screens that stay open after finalisation, by the name the tab carries:
 *
 *     ''                                  nothing extra - the padlock as it was
 *     'Discharge Summary'                 that one tab stays open
 *     'Discharge Summary,Discharge Reports'   several, comma separated
 *     'ALL'                               no padlock at all
 *
 * IPD Bill Print stays open whatever the setting says, because it always did and a bill
 * you cannot print is of no use to anyone.
 *
 * Nothing here decides whether the bill IS finalized - that is the bill's own flag and
 * the discharge process still owns it. This only decides what a finalized bill hides.
 */

/** Open whatever the setting says - printing the bill was never part of the lock. */
const ALWAYS_OPEN = ["IPD Bill Print"];

const clean = (text) => String(text ?? "").trim().toUpperCase();

export default function BillLockGate({ isBilledClosed, fileName, children }) {
  const { GetGlobalResources } = useSelector((state) => state?.CommonSlice);

  /* The resource list arrives as an array on some screens and as {data: []} on others,
     depending on which call last filled it, so both shapes are read. */
  const list = Array.isArray(GetGlobalResources)
    ? GetGlobalResources
    : GetGlobalResources?.data || [];

  const setting = String(
    list?.find((item) => item?.Name === "BillFinalizedOpenScreens")?.Value ?? "",
  );

  /* The same strict test the inline check used - the string "1", not a number and not a
     truthy value. Widened, a screen whose row carries 1 as a number would start locking
     where it never did, and this change is meant to open tabs, not close new ones. */
  if (isBilledClosed !== "1") return children;

  const allowed = setting
    .split(",")
    .map(clean)
    .filter(Boolean);

  const name = clean(fileName);
  const open =
    ALWAYS_OPEN.map(clean).includes(name) ||
    allowed.includes("ALL") ||
    allowed.includes(name);

  return open ? children : <BillCloseUI />;
}
