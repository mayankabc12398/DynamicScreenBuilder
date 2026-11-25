import React, { useState, useEffect } from "react";
import NestedRowTable from "../NestedRowTable";
import { useTranslation } from "react-i18next";
import Input from "../../../formComponent/Input";
import { GiMedicinePills } from "react-icons/gi";
import { notify } from "../../../../utils/utils";
import { GiveOutsideMedication } from "../../../../networkServices/nursingWardAPI";
import { useLocalStorage } from "../../../../utils/hooks/useLocalStorage";
import moment from "moment";
import Heading from "../../Heading";
import SearchByMedicine from "../../../commonComponents/SearchByMedicine";
import ReactSelect from "../../../formComponent/ReactSelect";

export default function OutsideMecationTable({
  outsideMediData,
  outMedicineThead,
  onDataUpdate,
  handleSaveOutsideMedication,
  handleChange,
  handleReactSelectChange,
  values,
  state,
  setState,
  medicineFrequency,
  durationOptions,
  medicineRoute,
  pateintDetails,
  handleItemSelect,
}) {
  const [t] = useTranslation();
  const [givingStates, setGivingStates] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [bodyData, setBodyData] = useState([]);
  const localData = useLocalStorage("userData", "get");

  const { VITE_DATE_FORMAT } = import.meta.env;

  const thead = [
    { name: " ", width: "2%" },
    { name: t("SNO"), width: "3%" },
    { name: t("MedicineName") },
    { name: t("EntryDateTime") },
    { name: t("OrderQty") },
    { name: t("IssuedQty") },
    { name: t("GivenQty") },
    { name: t("RemainingQty") },
    { name: t("Dose") },
    { name: t("Time") },
    { name: t("Route") },
    { name: t("Duration") },
    { name: t("Status") },
    { name: t("EntryBy") },
    { name: t("Give Medication") },
  ];

  const seondThead = [
    { name: t("S.NO."), width: "2%" },
    { name: t("Given Date"), width: "15%" },
    { name: t("Given Time"), width: "15%" },
    { name: t("Given Quantity"), width: "15%" },
    { name: t("Remark") },
    { name: t("Given By") },
  ];

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleMedicineChange = (e) => {
    setState({
      ...state,
      medicineName: e.target.value,
    });
  };

  const handleGiveMedicationChange = (medicationId, field, value) => {
    setGivingStates((prev) => ({
      ...prev,
      [medicationId]: {
        ...prev[medicationId],
        [field]: value,
      },
    }));
  };

  const handleGiveMedication = async (medication) => {
    const giveState = givingStates[medication.ID] || {};

    if (!giveState.givenQty || giveState.givenQty <= 0) {
      notify(t("Please enter valid quantity"), "error");
      return;
    }

    if (giveState.givenQty > medication.RemainingQty) {
      notify(
        `Cannot give more than remaining quantity (${medication.RemainingQty})`,
        "error",
      );
      return;
    }

    const payload = {
      outsideMedicationID: medication.ID,
      givenQty: parseFloat(giveState.givenQty),
      remark: giveState.remark || "",
      entryBy: localData?.employeeID || "EMP001",
    };

    try {
      const response = await GiveOutsideMedication(payload);
      if (response?.success) {
        notify(response?.message || "Medicine given successfully", "success");
        // Clear the giving state for this medication
        setGivingStates((prev) => ({
          ...prev,
          [medication.ID]: undefined,
        }));
        // Refresh the data
        if (onDataUpdate) {
          onDataUpdate();
        }
      } else {
        notify(response?.message || "Failed to give medication", "error");
      }
    } catch (error) {
      console.error("Error giving medication:", error);
      notify(t("Error giving medication"), "error");
    }
  };

  useEffect(() => {
    if (!outsideMediData || !Array.isArray(outsideMediData)) {
      setBodyData([]);
      return;
    }

    const list = outsideMediData.map((item, index) => {
      const giveState = givingStates[item.ID] || {};
      const canGive = Number(item.RemainingQty) > 0;
      const isCompleted =
        Number(item.RemainingQty) <= 0 || item.Status === "Completed";
      const isExpanded = expandedRows[item.ID] || false;

      // Transform Given History for nested table
      const secondTbody =
        item.GivenHistory && item.GivenHistory.length > 0
          ? item.GivenHistory.map((history, historyIndex) => ({
              sno: historyIndex + 1,
              GivenDate: history.GivenDateTime
                ? moment(history.GivenDateTime).format(
                    VITE_DATE_FORMAT || "DD-MMM-YYYY",
                  )
                : history.GivenDate || "-",
              GivenTime: history.GivenDateTime
                ? moment(history.GivenDateTime).format("hh:mm A")
                : history.GivenTime || "-",
              GivenQty: history.GivenQty || "-",
              Remark: history.Remark || "-",
              GivenBy: history.EntryBy || history.GivenBy || "-",
            }))
          : [
              {
                sno: 1,
                GivenDate: "-",
                GivenTime: "-",
                GivenQty: "-",
                Remark: t("No history available"),
                GivenBy: "-",
              },
            ];

      return {
        index: (
          <span
            onClick={() => toggleRow(item.ID)}
            style={{ cursor: "pointer" }}
          >
            {isExpanded ? (
              <i className="fa fa-minus" aria-hidden="true"></i>
            ) : (
              <i className="fa fa-plus" aria-hidden="true"></i>
            )}
          </span>
        ),
        sno: index + 1,
        MedicineName: item.MedicineName || "-",
        EntryDateTime: item.EntryDate || "-",
        OrderQty: item.Qty || "-",
        IssuedQty: item.IssuedQty ?? item.Qty ?? "-",
        GivenQty: item.GivenQty || "-",
        RemainingQty: item.RemainingQty || "-",
        Dose: item.Dose || "-",
        Time: item.Frequency || "-",
        Route: item.Route || "-",
        Duration: item.Duration || "-",
        Status: item.Status || "-",
        EntryBy: item.EntryBy || "-",
        GiveMedicationForm: canGive ? (
          <div className="d-flex align-items-center gap-2">
            <Input
              type="number"
              className="table-input"
              name="givenQty"
              placeholder={t("Qty")}
              value={giveState.givenQty || ""}
              onChange={(e) =>
                handleGiveMedicationChange(item.ID, "givenQty", e.target.value)
              }
              // respclass="w-25"
              style={{ width: "80px" }}
            />
            <Input
              type="text"
              className="table-input"
              name="remark"
              placeholder={t("Remark")}
              value={giveState.remark || ""}
              onChange={(e) =>
                handleGiveMedicationChange(item.ID, "remark", e.target.value)
              }
              // respclass="w-50"
              style={{ width: "150px" }}
            />
            <button
              className="btn btn-sm btn-success"
              onClick={() => handleGiveMedication(item)}
            >
              {/* {t("Give")} */}
              <GiMedicinePills />
            </button>
          </div>
        ) : (
          <span className="text-muted">
            {Number(item.RemainingQty) <= 0 ? t("Completed") : t("Cannot give")}
          </span>
        ),
        colorcode: isCompleted ? "#e1f7e1" : "",
        subRow: {
          isopen: isExpanded,
          subRowList: secondTbody,
        },
      };
    });

    setBodyData(list);
  }, [outsideMediData, givingStates, expandedRows, t, VITE_DATE_FORMAT]);

  return (
    <>
      <div className="m-2 card">
        <Heading title={t("Outside Medication")} />
        <div className="row p-2">
          <div className="col-xl-2 col-md-2 col-sm-2 col-12">
            {/* <div className="required-fields"> */}
              <SearchByMedicine
                handleItemSelect={handleItemSelect}
                pateintDetails={pateintDetails}
                itemName={state?.medicineName}
                requiredClassName={`required-fields`}
              />
            {/* </div> */}
          </div>
          <Input
            type="number"
            className={`form-control required-fields`}
            id="qty"
            name="qty"
            onChange={handleChange}
            value={state?.qty}
            lable={t("Quantity")}
            placeholder=" "
            respclass="col-xl-1 col-md-2 col-sm-2 col-12"
            />
          <Input
            type="text"
            className={`form-control required-fields`}
            id="dose"
            name="dose"
            onChange={handleChange}
            value={state?.dose}
            lable={t("Dose")}
            placeholder=" "
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
          />
          <ReactSelect
            placeholderName={t("Frequency")}
            searchable={true}
            id="frequency"
            dynamicOptions={medicineFrequency}
            name="frequency"
            value={`${state?.frequency?.value || state?.frequency}`}
            handleChange={handleReactSelectChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            requiredClassName={values?.frequency ? "" : "required-fields"}
          />
          <ReactSelect
            placeholderName={t("Duration")}
            searchable={true}
            id="duration"
            dynamicOptions={durationOptions}
            name="duration"
            value={`${state?.duration?.value || state?.duration}`}
            handleChange={handleReactSelectChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            requiredClassName={values?.duration ? "" : "required-fields"}
          />
          <ReactSelect
            placeholderName={t("Route")}
            searchable={true}
            id="route"
            dynamicOptions={medicineRoute}
            name="route"
            value={`${state?.route?.value || state?.route}`}
            handleChange={handleReactSelectChange}
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            requiredClassName={values?.route ? "" : "required-fields"}
          />

          <div className="col-xl-1 col-md-2 col-sm-2 col-12 text-right">
            <button
              className="btn btn-success btn-sm"
              onClick={handleSaveOutsideMedication}
            >
              {t("Save")}
            </button>
          </div>
        </div>
        <div className="outside-medication-table">
          {bodyData.length > 0 ? (
            <NestedRowTable
              thead={thead}
              seondThead={seondThead}
              tbody={bodyData}
              tableHeight="table-height"
            />
          ) : (
            <div className="text-center p-3">
              <p className="text-muted">{t("No outside medications found")}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
