import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import Loading from "../../../components/loader/Loading";
import Input from "../../../components/formComponent/Input";
import { handleReactSelectDropDownOptions, notify } from "../../../utils/utils";
import {
  EDPLaboratorySetupBind,
  formulamasterDelete,
  formulamasterSaveFormula,
  GetFormula,
  LoadObservations,
} from "../../../networkServices/EDP/karanedp";
import Heading from "../../../components/UI/Heading";
import { BindDepartmentCountDetail } from "../../../networkServices/approvedunapprovedLog";

const FormulaMaster = ({ data }) => {
  const [investigation, setInvestigation] = useState([]);
  const [observationData, setObservationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departmentData, setDepartmentData] = useState([]);
  const [values, setValues] = useState({
    investigation: null, // Store as object {label, value}
    department: { label: "ALL", value: "0" },
    CPTCode: "",
  });

  const { t } = useTranslation();
  const [load, setLoad] = useState({
    deleteLoad: false,
    saveLoad: false,
  });

  const [splitData, setSplitData] = useState({
    value: "",
    TestID: "",
  });

  const [splitLeft, setSplitLeft] = useState({
    Left: [],
    Right: "",
  });

  // Fetch investigations based on department
  const handleGetNablInvestigations = useCallback(async (departmentId) => {
    // if (!departmentId && departmentId !== "0") return;
    setLoading(true);
    try {
      const response = await EDPLaboratorySetupBind(departmentId || "0");
      if (response?.success) {
        setInvestigation(response?.data || []);
      } else {
        setInvestigation([]);
      }
    } catch (error) {
      setInvestigation([]);
      notify(t("Error fetching investigations"), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load observations for selected investigation
  const handleLoadObservations = useCallback(async (investigationId) => {
    if (!investigationId) {
      setObservationData([]);
      return;
    }

    setLoading(true);
    try {
      const response = await LoadObservations(investigationId);
      if (response?.success) {
        const data = response?.data || [];
        const finalData = data.map((ele) => ({
          ...ele,
          TestName: `${ele?.name}#${ele?.labobservation_id}`,
          TestID: ele?.labobservation_id,
        }));
        setObservationData(finalData);
      } else {
        setObservationData([]);
        notify(response?.message || "No observations found", "info");
      }
    } catch (error) {
      setObservationData([]);
      notify(t("Error loading observations"), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = useCallback(
    (name, value) => {
      if (name === "department") {
        const departmentId = value?.value || "0";
        handleGetNablInvestigations(departmentId);
        setValues((prev) => ({
          ...prev,
          department: value,
          investigation: null, // Clear investigation on dept change
        }));
        setObservationData([]);
        setSplitData({ value: "", TestID: "" });
        setSplitLeft({ Left: [], Right: "" });
      } else if (name === "investigation") {
        setValues((prev) => ({ ...prev, investigation: value }));
        if (value?.value) {
          handleLoadObservations(value.value);
          setSplitData({ value: "", TestID: "" });
          setSplitLeft({ Left: [], Right: "" });
        }
      }
    },
    [handleGetNablInvestigations, handleLoadObservations],
  );

  // Saved formula as shown in the box: the expression after the FIRST "=" ("LSHHI333=..." -> "..."),
  // the same way Result Entry reads it; formulas saved without "ID=" are shown whole.
  const formulaExpression = (formula) => {
    const f = String(formula ?? "").trim();
    const i = f.indexOf("=");
    return i >= 0 ? f.substring(i + 1).trim() : f;
  };

  const handleObservationChange = (e) => {
    const { value } = e.target;
    const findvalue = observationData.find((ele) => ele.TestID == value);

    if (!findvalue) return;

    setSplitData({
      value: findvalue?.TestName,
      TestID: findvalue?.TestID,
    });

    const data = findvalue.TestName.split("#");
    // A formula being built (e.g. "LSHHI1357@+") stays while the next observation is picked for
    // "Right (Add ID)". Only an empty box shows the picked observation's saved formula;
    // "Left (Load Formula)" loads it on demand.
    setSplitLeft((prev) => ({
      Left: data,
      Right: prev.Right?.trim() ? prev.Right : formulaExpression(findvalue?.formula),
    }));
  };

  const handleChange = (e) => {
    const { value, name } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeRight = (e) => {
    const { value } = e.target;
    setSplitLeft((prev) => ({ ...prev, Right: value }));
  };

  const handleEvent = async (name) => {
    if (splitData.TestID !== "") {
      const data = splitData.value.split("#");

      if (name === "Left") {
        // Load existing formula from API or current observation data
        setLoading(true);
        try {
          const investigationId = values?.investigation?.value;
          const response = await LoadObservations(investigationId);

          if (response.success && response?.data) {
            const selectedObs = response.data.find(
              (obs) => obs.labobservation_id == splitData.TestID,
            );

            if (selectedObs && selectedObs.formula) {
              setSplitLeft({ Left: data, Right: formulaExpression(selectedObs.formula) });
            } else {
              setSplitLeft({ Left: data, Right: "" });
              notify(t("No formula found for this observation"), "info");
            }
          }
        } catch (err) {
          notify(t("Error loading formula"), "error");
        } finally {
          setLoading(false);
        }
      }

      if (name === "Right") {
        const observationId = data[1];
        setSplitLeft((prev) => ({
          ...prev,
          Right: (prev.Right || "") + observationId + "@",
        }));
      }
    } else {
      notify(t("Please select an observation first"), "warning");
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!splitLeft?.Left?.[1]) {
      notify(t("No observation selected to save"), "error");
      return;
    }

    if (!splitLeft?.Right || splitLeft.Right.trim() === "") {
      notify(t("Formula cannot be empty"), "error");
      return;
    }

    const observationId = splitLeft?.Left[1];

    // Target "ID=" is added automatically below - the expression itself must not
    // contain "=" (typed directly into the box) or the observation's own ID
    // (added via "Right (Add ID)" by mistake), either of which corrupts the
    // saved formula and breaks calculation in Result Entry.
    if (splitLeft.Right.includes("=")) {
      notify(
        t('Formula cannot contain "=" - it is added automatically for the selected target observation'),
        "error",
      );
      return;
    }
    if (splitLeft.Right.includes(`${observationId}@`)) {
      notify(
        t("Formula cannot reference the target observation's own ID"),
        "error",
      );
      return;
    }

    const finalFormula = `${observationId}=${splitLeft?.Right}`;
    const payload = {
      formula: finalFormula,
      formulaText: "formula",
      labObservationID: observationId,
    };

    setLoad((prev) => ({ ...prev, saveLoad: true }));

    try {
      const apiResp = await formulamasterSaveFormula(payload);
      if (apiResp?.success) {
        notify(apiResp?.message || "Formula saved successfully", "success");
        // Keep the investigation on screen and reload the list from the database (it used to
        // clear everything). Right is cleared though - otherwise it keeps showing this saved
        // expression on every later click, even on an unrelated observation with no formula of
        // its own, until the box happens to become non-empty again.
        setSplitLeft((prev) => ({ ...prev, Right: "" }));
        if (values?.investigation?.value) {
          await handleLoadObservations(values.investigation.value);
        }
      } else {
        notify(apiResp?.message || "Failed to save formula", "error");
      }
    } catch (error) {
      notify(t("Error saving formula"), "error");
    } finally {
      setLoad((prev) => ({ ...prev, saveLoad: false }));
    }
  }, [splitLeft, values?.investigation?.value, handleLoadObservations]);

  const handleDelete = useCallback(async () => {
    if (!splitLeft?.Left?.[1]) return;

    setLoad((prev) => ({ ...prev, deleteLoad: true }));
    try {
      const apiResp = await formulamasterDelete(splitLeft.Left[1]);
      if (apiResp?.success) {
        notify(apiResp?.message || "Formula deleted successfully", "success");
        setSplitLeft((prev) => ({ ...prev, Right: "" }));
        if (values?.investigation?.value) {
          await handleLoadObservations(values.investigation.value);
        }
      } else {
        notify(apiResp?.message || "Failed to delete formula", "error");
      }
    } catch (error) {
      notify(t("Error deleting formula"), "error");
    } finally {
      setLoad((prev) => ({ ...prev, deleteLoad: false }));
    }
  }, [splitLeft.Left, values?.investigation?.value, handleLoadObservations]);

  const handleButtonClick = (e) => {
    const buttonText = e.target.innerText;
    setSplitLeft((prev) => ({
      ...prev,
      Right: prev.Right + buttonText,
    }));
  };

  const handleBackspace = () => {
    setSplitLeft((prev) => ({
      ...prev,
      Right: prev.Right.slice(0, -1),
    }));
  };

  const handleClear = () => {
    setSplitData({ value: "", TestID: "" });
    setSplitLeft({ Left: [], Right: "" });
    setValues({
      investigation: null,
      department: { label: "ALL", value: "0" },
      CPTCode: "",
    });
    setObservationData([]);
  };

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await BindDepartmentCountDetail();
      if (response?.success) {
        setDepartmentData(response.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
    handleGetNablInvestigations("0");
  }, [fetchDepartments, handleGetNablInvestigations]);

  return (
    <div className="card">
      <Heading
        title={data?.breadcrumb}
        data={data}
        isSlideScreen={true}
        isBreadcrumb={true}
      />

      <div className="row pt-2 pl-2 pr-2 mt-1">
        <ReactSelect
          placeholderName={t("Department")}
          id="department"
          searchable={true}
          respclass="col-xl-4 col-md-4 col-sm-4 col-12"
          dynamicOptions={[
            { value: "0", label: t("ALL") },
            ...handleReactSelectDropDownOptions(
              departmentData,
              "Name",
              "ObservationType_ID",
            ),
          ]}
          handleChange={handleSelect}
          value={values?.department}
          name="department"
        />

        <div className="col-xl-8">
          <div className="row">
            <ReactSelect
              placeholderName={t("Investigation")}
              id="investigation"
              searchable={true}
              respclass="col-xl-6 col-md-6 col-sm-6 col-12"
              dynamicOptions={handleReactSelectDropDownOptions(
                investigation,
                "Name",
                "Investigation_id", // Note: Matches your API response field
              )}
              handleChange={handleSelect}
              value={values?.investigation}
              name="investigation"
            />

            <Input
              type="text"
              className="form-control"
              id="CPTCode"
              name="CPTCode"
              value={values?.CPTCode || ""}
              onChange={handleChange}
              label={t("CPT Code")}
              respclass="col-xl-6 col-md-6 col-sm-6 col-12"
            />
          </div>
        </div>

        <div className="col-lg-5">
          {loading ? (
            <Loading />
          ) : (
            <>
              <label className="form-label">{t("Select Observation")}</label>
              <select
                className="form-control formula-tag"
                onChange={handleObservationChange}
                value={splitData.TestID || ""}
                size="10"
                style={{ height: "auto", minHeight: "220px" }}
              >
                <option value="" disabled>
                  -- Select an observation --
                </option>
                {observationData.map((ele) => (
                  <option key={ele.TestID} value={ele.TestID}>
                    {ele.TestName}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="col-3">
          <div className="border rounded p-3">
            <button
              className="btn btn-success btn-sm btn-block mb-2"
              onClick={() => handleEvent("Left")}
              disabled={!splitData.TestID || loading}
            >
              ← {t("LEFT")} (Load Formula)
            </button>

            <button
              className="btn btn-primary btn-sm btn-block mb-3"
              onClick={() => handleEvent("Right")}
              disabled={!splitData.TestID}
            >
              → {t("RIGHT")} (Add ID)
            </button>

            <label className="form-label">{t("Selected Observation:")}</label>
            <Input
              className="form-control input-sm mb-2"
              value={splitLeft?.Left[0] || ""}
              readOnly
              placeholder={t("Test Name")}
            />
            <Input
              className="form-control input-sm"
              value={splitLeft?.Left[1] || ""}
              readOnly
              placeholder={t("Test ID")}
            />
          </div>

          {/* Calculator UI */}
          <div className="calc-container border mt-2">
            <div
              className="calc-buttons"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "2px",
              }}
            >
              {[
                "C",
                "/",
                "*",
                "⌫",
                "7",
                "8",
                "9",
                "-",
                "4",
                "5",
                "6",
                "+",
                "1",
                "2",
                "3",
                "%",
                "0",
                "(",
                ")",
              ].map((btn) => (
                <button
                  key={btn}
                  className="btn btn-sm btn-success border"
                  onClick={
                    btn === "C"
                      ? handleClear
                      : btn === "⌫"
                        ? handleBackspace
                        : handleButtonClick
                  }
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-4">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label m-0">{t("Formula :")}</label>
            {splitLeft?.Right && splitLeft?.Left?.[1] && (
              <button className="btn btn-danger btn-xs" onClick={handleDelete}>
                {load.deleteLoad ? "..." : t("✕ Delete")}
              </button>
            )}
          </div>
          <textarea
            className="form-control formula-tag"
            style={{ minHeight: "220px", fontFamily: "monospace" }}
            value={splitLeft?.Right || ""}
            onChange={handleChangeRight}
            placeholder={t("Build formula here...")}
          />
        </div>
      </div>

      <div className="row p-2">
        <div className="col-sm-2">
          <button
            className="btn btn-block btn-success btn-sm"
            onClick={handleSubmit}
            disabled={
              load.saveLoad || !splitLeft?.Right || !splitLeft?.Left?.[1]
            }
          >
            {load.saveLoad ? <Loading /> : t("Save Formula")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormulaMaster;
