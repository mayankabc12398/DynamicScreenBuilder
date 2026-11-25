import React, { useEffect, useState } from "react";
import ReactSelect from "../formComponent/ReactSelect";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import { notify } from "../../utils/ustil2";
import { useSelector } from "react-redux";
import Tables from "../UI/customTable";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage";
import UserPasswordVerificationModal from "../modalComponent/Utils/patientBillingModal/UserPasswordVerificationModal";
import {
  btnCentralLineapi,
  GetBindIPDVisit,
  handleSaveIPDVisit,
} from "../../networkServices/BillingsApi";

const CrossConsultation = (props) => {
  const { t } = useTranslation();
  const localdata = useLocalStorage("userData", "get");
  const [userConfirmation, setUserConfirmation] = useState(false);
  const isMobile = window.innerWidth <= 768;
  const {
    transactionID,
    patientID,
    roomId,
    doctorID,
    ipdCaseTypeID,
    panelID,
    patientType,
    admittedBy,
  } = props?.data || {};
  const { GetBindAllDoctorConfirmationData } = useSelector(
    (state) => state.CommonSlice,
  );
  const [tableData, setTableData] = useState([]);
  const [values, setValues] = useState({
    doctor: doctorID,
    Type: "",
  });

  const doctorName = GetBindAllDoctorConfirmationData?.find(
    (opt) => Number(opt?.DoctorID) === Number(values?.doctor),
  )?.Name;

  const fetchData = async () => {
    try {
      const response = await GetBindIPDVisit(
        transactionID,
        values?.doctor || doctorID,
        ipdCaseTypeID,
        panelID,
      );

      if (response?.success) {
        const formattedData = (response?.data || []).map((row) => ({
          ...row,
          visits: row.visits.map((v) => ({
            ...v,
            isLocked: v.checkedStatus === true && v.isDRCRApply !== 1,
            checkedStatus: v.checkedStatus === true && v.isDRCRApply === 1 ? false : v.checkedStatus,
          })),
        }));

        setTableData(formattedData);
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(error?.message || "Error fetching data", "error");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  const hisDRCRApplyandleItemChange = (rowIndex, visitItemId) => {
    // debugger;
    setTableData((prev) =>
      prev.map((row, i) => {
        if (i === rowIndex) {
          return {
            ...row,
            visits: row.visits.map((v) =>
              v.itemId === visitItemId
                ? { ...v, checkedStatus: !v.checkedStatus }
                : v,
            ),
          };
        }
        return row;
      }),
    );
  };
  const getSelectedVisits = (data) => {
    return data.flatMap((dateGroup) =>
      dateGroup.visits
        .filter((v) => v.checkedStatus && !v.isLocked)
        .map((v) => ({
          visitDate: dateGroup.visitDate,
          itemID: v.itemId,
          itemName: `${doctorName} (${v.itemName})`,
          rate: v.rate,
          rateListID: v.rateListID,
          subCategoryID: v.subcategoryId || "",
          itemCode: v.itemCode || "",
        })),
    );
  };
  const executeSave = async () => {
    const selectedVisits = getSelectedVisits(tableData);
    let doctorDetail = GetBindAllDoctorConfirmationData?.find(
      (val) => Number(val?.DoctorID) === Number(values?.doctor),
    );
    const reqBody = {
      patientID: patientID ?? "",
      transactionID: transactionID ?? "",
      userID: "",
      panelID: panelID ?? 0,
      doctorID: values?.doctor ?? 0,
      doctorName: doctorDetail?.Name || "",
      ipdCaseTypeID: ipdCaseTypeID ?? "",
      patientType: patientType ?? "",
      roomID: roomId ?? "",
      visits: selectedVisits,
    };

    try {
      const response = await handleSaveIPDVisit(reqBody);
      if (response?.success) {
        notify(response?.message, "success");
        fetchData();
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      notify(t("Error saving data"), "error");
    }
  };

  const handleSave = async () => {
    const selectedVisits = getSelectedVisits(tableData);
    if (selectedVisits.length === 0) {
      return notify(t("Please select at least one visit"), "error");
    }

    if (localdata?.validateUserForBill) {
      setUserConfirmation(true);
    } else {
      executeSave();
    }
  };



  const handleUpdateSecondModelAPI = async () => {
    if (!values?.Type) return notify(t("Type is Required"), "error");
    const requestBody = {
      transactionId: transactionID,
      chkType: values?.Type,
      doctorId: values?.doctor,
      room_ID: roomId,
      templateID: 10,
    };
    try {
      const response = await btnCentralLineapi(requestBody);
      if (response?.success) {
        notify(response?.message || "Saved successfully");
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };
  const dynamicHeaders = [t("Sr.No"), t("Visit Date")];
  if (tableData.length > 0) {
    tableData[0].visits.forEach((v) => {
      dynamicHeaders.push(t(v.itemName));
    });
  }
  const dynamicBody = tableData?.map((row, rowIndex) => {
    const tableRow = {
      sno: rowIndex + 1,
      "Visit Date": row.visitDate,
    };
    row.visits.forEach((visit) => {
      tableRow[visit.itemName] = (
        <input
          type="checkbox"
          checked={visit.checkedStatus}
          disabled={visit.isLocked}
          onChange={() => hisDRCRApplyandleItemChange(rowIndex, visit.itemId)}
        />
      );
    });

    return tableRow;
  });

  return (
    <>
      {userConfirmation && (
        <UserPasswordVerificationModal
          visible={userConfirmation}
          setVisible={setUserConfirmation}
          userId={localdata?.employeeID}
          onSuccess={executeSave}
        />
      )}
      <Heading isBreadcrumb={true} />
      <div className="card ">
        <div className="row p-2">
          <ReactSelect
            className="form-control"
            respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            name="doctor"
            value={values?.doctor}
            dynamicOptions={GetBindAllDoctorConfirmationData.map((item) => ({
              label: item?.Name,
              value: item?.DoctorID,
            }))}
            handleChange={(name, val) =>
              setValues((prev) => ({ ...prev, doctor: val?.value }))
            }
            placeholderName={t("Doctor")}
            removeIsClearable={true}
          />
          {values?.doctor !== doctorID && values?.doctor && (
            <ReactSelect
              className="form-control"
              respclass="col-xl-2 col-md-4 col-sm-4 col-12"
              name="Type"
              value={values?.Type}
              dynamicOptions={[
                { label: t("Urgent"), value: "Urgent" },
                { label: t("Routine"), value: "Routine" },
              ]}
              handleChange={(name, val) =>
                setValues((prev) => ({ ...prev, Type: val?.value }))
              }
              placeholderName={t("Type")}
            />
          )}
          <button className="btn btn-primary" onClick={fetchData}>
            {t("Search")}
          </button>
          {values?.doctor !== doctorID && values?.doctor && (
            <button
              className="btn btn-primary ml-2"
              onClick={handleUpdateSecondModelAPI}
            >
              {t("Reference Visit")}
            </button>
          )}
        </div>
      </div>
      {tableData?.length > 0 && (
        <>
          <Tables
            thead={dynamicHeaders}
            tbody={dynamicBody}
            tableHeight={"scrollView"}
            style={!isMobile ? { height: "40vh" } : {}}
          />
          <div className="row d-flex justify-content-end m-2">
            <button className="btn btn-primary" onClick={handleSave}>
              {t("Save")}
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default CrossConsultation;
