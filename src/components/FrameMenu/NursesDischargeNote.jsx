import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import DatePicker from "../formComponent/DatePicker";
import TextAreaInput from "../formComponent/TextAreaInput";
import Tables from "../UI/customTable";
import {
  NursingWardBindDetails,
  NursingWardNursingDischargeDeleting,
  NursingWardNursingDischargeSave,
  BindNursing_DischargeNoteAllApi,
} from "../../networkServices/nursingWardAPI";
import { notify, NursingWardDischargePayload } from "../../utils/utils";
import ReactSelect from "../formComponent/ReactSelect";

const NursesDischargeNote = ({ data }) => {
  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();
  const { transactionID, patientID } = data;
  const { GetGlobalResources } = useSelector((state) => state.CommonSlice);
  const isShowEdit =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find((item) => item?.Name === "ShowDischargeNoteEdit")
      ?.Value === "1";
  const [itemList, setItemList] = useState([]);
  // const NURSEDISCHARGETHEAD = [
  //   "S.No",
  //   "Date",
  //   "Discharge Advice",
  //   "Issue Items",
  //   "Next Visit",
  //   "Entry By",
  //   "Remove",
  // ];
  const NURSEDISCHARGETHEAD = [
    t("S.No"),
    t("Date"),
    t("Discharge Advice"),
    t("Issue Items"),
    t("Next Visit"),
    t("Entry By"),
    { width: "4%", name: t("Action") },
  ];

  const [payload, setPayload] = useState({
    Date: new Date(),
    nextVisit: new Date(),
    DisChargeAdvice: "",
    IssueItems: "",
    transactionID: String(transactionID),
    patientID: patientID,
    item: "",
  });

  const [tableData, setTableData] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload({
      ...payload,
      [name]: value,
    });
  };

  const handleReactSelect = (name, e) => {
    setPayload({
      ...payload,
      [name]: e,
    });
  };
  console.log(payload);

  const handleIndicator = (state) => {
    return (
      <div className="text-danger">
        {t("max 200 Charcter")}{" "}
        <span className="text-dark">{t("Remaining")} : </span>{" "}
        <span className="text-success">{Number(200 - state?.length)}</span>
      </div>
    );
  };

  const handleNursingWardBindDetails = async (transactionID) => {
    try {
      const data = await NursingWardBindDetails(transactionID);
      if (data?.success) {
        setTableData(data?.data);
      }else{
        notify(data?.message, "error")
      }
    } catch (error) {
      console.log("Something Went Wrong");
    }
  };

  const handleEdit = (items) => {
    setPayload({
      ...payload,
      ID: items?.ID,
      Date: new Date(items?.DATE),
      nextVisit: items?.NextVisit ? new Date(items?.NextVisit) : new Date(),
      DisChargeAdvice: items?.ProgressNote || "",
      IssueItems: items?.Issueitem || "",
      item: items?.ItemId ? { label: items?.itemName, value: items?.ItemId } : "",
      transactionID: String(transactionID),
      patientID: patientID,
    });
  };

  const handleTbody = (tbody) => {

    return tbody?.map((items, index) => {
      return {
        SNO: index + 1,
        Date: items?.DATE,
        DischargeAdvice: items?.ProgressNote,
        IssueItems: items?.Issueitem,
        NextVisit: items?.NextVisit,
        EntryBy: items?.EntryBy,
        Action: (
          <div className="d-flex align-items-center" style={{ gap: "12px" }}>
            {isShowEdit && (
              <i
                className="fa fa-edit"
                style={{ cursor: "pointer", fontSize: "16px" }}
                aria-hidden="true"
                onClick={() => { handleEdit(items); }}
              ></i>
            )}
            <i
              className="fa fa-trash text-danger"
              style={{ cursor: "pointer", fontSize: "16px" }}
              aria-hidden="true"
              onClick={() => { handleRemove(items?.ID, items?.UserID); }}
            ></i>
          </div>
        ),
      };
    });
  };

  const handleNursingWardNursingDischargeSave = async () => {
    try {
      const apiPayload = NursingWardDischargePayload(payload);
      const data = await NursingWardNursingDischargeSave(apiPayload);
      if (data?.success) {
        handleNursingWardBindDetails(String(transactionID));
        setPayload({
          ID: 0,
          Date: new Date(),
          nextVisit: new Date(),
          DisChargeAdvice: "",
          IssueItems: "",
          item: "",
          transactionID: String(transactionID),
          patientID: patientID,
        });
        notify(data?.message, "success");
      } else {
        notify(data?.message, "error");
      }
    } catch (error) {
      console.log("Something Went Wrong");
    }
  };

  const handleRemove = async (id, UserID) => {
    try {
      const data = await NursingWardNursingDischargeDeleting({
        userID: String(UserID),
        id: String(id),
      });
      if (data?.success) {
        handleNursingWardBindDetails(String(transactionID));
        notify(data?.message, "success");
      } else {
        notify(data?.message, "error");
      }
    } catch (error) {
      console.log("SomeThing Went Wrong");
    }
  };
  const handleItemList = async () => {
    const response = await BindNursing_DischargeNoteAllApi();
    if (response?.success) {
      notify(response?.message, "success");
      setItemList(response?.data);
    } else {
      notify(response?.message, "error");
    }
  };
  console.log(itemList);

  useEffect(() => {
    handleNursingWardBindDetails(String(transactionID));
    handleItemList();
  }, []);
  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration card">
        <Heading title={t("Nurses Discharge Note")} isBreadcrumb={false} />

        <div className="row p-2">
          <div className="col-xl-2 col-md-3 col-sm-4 col-12">
            <DatePicker
              className="custom-calendar"
              lable={t("Date")}
              respclass={"mb-2"}
              value={payload?.Date}
              maxDate={new Date()}
              removeFormGroupClass={true}
              id="Date"
              name="Date"
              placeholder={VITE_DATE_FORMAT}
              showTime
              hourFormat="12"
              handleChange={(e) => handleChange(e)}
            />

            <DatePicker
              className="custom-calendar"
              lable={t("Next Visit")}
              respclass={"mb-2"}
              value={payload?.nextVisit}
              removeFormGroupClass={true}
              id="nextVisit"
              name="nextVisit"
              placeholder={VITE_DATE_FORMAT}
              minDate={new Date()}
              showTime
              hourFormat="12"
              handleChange={(e) => handleChange(e)}
            />

            <ReactSelect
              placeholderName={t("Select Item")}
              id={"item"}
              name="item"
              value={payload?.item}
              // handleChange={(name, e) =>
              //   handleReactSelect(name, e, "itemID")
              // }

              handleChange={handleReactSelect}
              dynamicOptions={itemList?.map((item) => ({
                label: item?.itemName,
                value: item?.ItemId,
              }))}
              searchable={true}
              removeIsClearable={true}
              // respclass="col-xl-2 col-md-4 col-sm-4 col-12"
            />
            <button
              className="btn btn-sm btn-success w-100"
              type="button"
              onClick={handleNursingWardNursingDischargeSave}
            >
              {payload?.ID ? t("Update") : t("Save")}
            </button>
          </div>

          <div className="col-xl-5 col-md-4 col-sm-4 col-12">
            <TextAreaInput
              lable={t("DisCharge Advice")}
              className="w-100"
              placeholder={""}
              id="DisChargeAdvice"
              rows={4}
              name="DisChargeAdvice"
              value={payload?.["DisChargeAdvice"]}
              onChange={(e) => handleChange(e)}
              maxLength={200}
            />
            {handleIndicator(payload?.["DisChargeAdvice"])}
          </div>
          <div className="col-xl-5 col-md-5 col-sm-4 col-12">
            <TextAreaInput
              lable={t("Issue Items")}
              placeholder=""
              className="w-100"
              name="IssueItems"
              value={payload?.["IssueItems"]}
              onChange={(e) => handleChange(e)}
              rows={4}
              maxLength={200}
            />
            {handleIndicator(payload?.["IssueItems"])}
          </div>
        </div>
      </div>

      {tableData?.length > 0 && <div className="patient_registration card">
        <Heading title={t("Details")} isBreadcrumb={false} />
        <Tables thead={NURSEDISCHARGETHEAD} tbody={handleTbody(tableData)} />
      </div>}
    </div>
  );
};

export default NursesDischargeNote;
