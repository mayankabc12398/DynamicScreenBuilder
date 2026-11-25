import React, { useEffect, useState } from "react";
import Heading from "../../UI/Heading";
import DatePicker from "../../formComponent/DatePicker";
import { useTranslation } from "react-i18next";
import TimePicker from "../../formComponent/TimePicker";
import IntakeOutputChartTable from "../../UI/customTable/IntakeOutputChartTable";
import TextAreaInput from "../../formComponent/TextAreaInput";
import Input from "../../formComponent/Input";
import {
  saveInTakeOutTakeChartApi,
  getIntakeOutputDetailsApi,
  deleteIntakeOutputByIdApi,
  searchIntakeOutputDetailsApi,
} from "../../../networkServices/Emergency";
import { notify } from "../../../utils/ustil2";
import moment from "moment";

const InTakeOutPutChart = ({ data }) => {
  console.log({ data });

  const { VITE_DATE_FORMAT } = import.meta.env;
  const [t] = useTranslation();
  const { transactionID, patientID } = data;
  const [payload, setPayload] = useState({
    Date1: new Date(),
  });
  const createEmptyRow = () => ({
    Date: new Date(),
    Time: new Date(),
    fluidNo: "",
    type: "",
    infused: "",
    poType: "",
    amount1: "",
    tubeType: "",
    amount2: "",
    vomit: "",
    stool: "",
    ng: "",
    urine: "",
    drain1: "",
    drain2: "",
    drain3: "",
    drain4: "",
    drain5: "",
    remarks: "",
  });
  const More_THEAD = [
    { colSpan: 1, name: "" },
    {
      colSpan: 8,
      name: t("Intake Chart (in ml)"),
      className: "text-center-table",
    },
    {
      colSpan: 13,
      name: t("Output Chart (in ml)"),
      className: "text-center-table",
    },
  ];

  const thed = [
    { colSpan: 1, name: t("Date"), width: "10%" },
    { colSpan: 1, name: t("Time") },
    { colSpan: 1, name: t("Fluid No") },
    { colSpan: 1, name: t("Type") },
    { colSpan: 1, name: t("Infused") },
    { colSpan: 1, name: t("PO Type") },
    { colSpan: 1, name: t("Amount") },
    { colSpan: 1, name: t("Tube Type") },
    { colSpan: 1, name: t("Amount") },
    { colSpan: 1, name: t("Vomit") },
    { colSpan: 1, name: t("Stool") },
    { colSpan: 1, name: t("N.G") },
    { colSpan: 1, name: t("Urine") },
    { colSpan: 1, name: t("Drain 1") },
    { colSpan: 1, name: t("Drain 2") },
    { colSpan: 1, name: t("Drain 3") },
    { colSpan: 1, name: t("Drain 4") },
    { colSpan: 1, name: t("Drain 5") },
  ];
  const tshow = [...thed];
  tshow.push(
    { colSpan: 1, name: t("Blance") },
    { colSpan: 1, name: t("Remark") },
    { colSpan: 1, name: t("sign") },
    { colSpan: 1, name: t("Action") }
  );

  const row2 = [
    { name: "" },
    { name: "Intravenous", colSpan: 4, className: "text-center-table" },
    { name: "Feeds", colSpan: 4, className: "text-center-table" },
    { name: "", colSpan: 13 },
  ];
  const [tableData, setTableData] = useState([createEmptyRow()]);
  const handleChangePayload = (e) => {
    const { name, value } = e.target;
    setPayload({ ...payload, [name]: value });
  };

  const handlePrint = () => {};
  const handleSaveAPI = async () => {
    const payload = {
      patientId: patientID || data?.PatientID,
      transactionId: transactionID || data?.TransactionID,
      date: tableData[0]?.Date || "",
      time: tableData[0]?.Time || "",

      fluidNo: tableData[0]?.fluidNo || 0,
      type: tableData[0]?.type || "",
      infused: tableData[0]?.infused || 0,

      poType: tableData[0]?.poType || "",
      amount1: tableData[0]?.amount1 || 0,
      tubeType: tableData[0]?.tubeType || "",
      amount2: tableData[0]?.amount2 || 0,

      vomit: tableData[0]?.vomit || 0,
      stool: tableData[0]?.stool || 0,
      ng: tableData[0]?.ng || 0,
      urine: tableData[0]?.urine || 0,

      drain1: tableData[0]?.drain1 || 0,
      drain2: tableData[0]?.drain2 || 0,
      drain3: tableData[0]?.drain3 || 0,
      drain4: tableData[0]?.drain4 || 0,
      drain5: tableData[0]?.drain5 || 0,
      remark: tableData[0]?.remarks || "",
    };
    // debugger
    const res = await saveInTakeOutTakeChartApi(payload);
    if (res?.success) {
      notify(res?.message, "success");
      getdatatype(0);
      getdatatype(1);
      getdatatype(2);
    } else {
      notify(res?.message, "error");
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;

    setTableData((prev) => {
      const updated = [...prev];
      updated[0] = {
        ...updated[0],
        [name]: value,
      };
      return updated;
    });
  };
  console.log(tableData);

  const TFooter = [
    { colSpan: 1, name: "" },
    { colSpan: 2, name: t("Total Intake"), className: "text-center-table" },
    { colSpan: 5, name: "", className: "text-center-table" },
    { colSpan: 2, name: t("Total Output"), className: "text-center-table" },
    { colSpan: 5, name: "", className: "text-center-table" },
    { colSpan: 2, name: t("Balance"), className: "text-center-table" },
  ];

  const handleChangeTable = (e, index, type) => {
    const { name, value } = e.target;
    debugger;
    if (type === "number") {
      const decimalWithNegativeRegex = /^-?\d+(\.\d+)?$/;
      if (value === "" || decimalWithNegativeRegex.test(value)) {
        const data = [...tableData];
        data[index][name] = value;
        setTableData(data);
      }
    } else {
      const data = [...tableData];
      data[index][name] = value;
      setTableData(data);
    }
  };
  console.log(tableData);

  const HandleInputField = (value, name, maxLength, type, index, isDisable) => {
    return (
      <Input
        value={value}
        type="text"
        className="table-input"
        name={name}
        removeFormGroupClass={true}
        maxLength={maxLength}
        onChange={(e) => {
          handleChangeTable(e, index, type);
        }}
        disabled={isDisable}
      />
    );
  };
  const [currentData, setCurrentData] = useState([]);
  const [previousData, setPreviousData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [footer, setFooter] = useState([...TFooter]);
  const [summery, setSummery] = useState("");

  const getdatatype = async (type) => {
    const payload = {
      type: type,
      pid: patientID || data?.PatientID,
      tid: transactionID || data?.TransactionID,
    };

    const res = await getIntakeOutputDetailsApi(payload);
    if (res?.success) {
      if (type === 0) {
        setCurrentData(res.data?.list);
      } else if (type === 1) {
        setPreviousData(res.data?.list);
      } else if (type === 2) {
        setAllData(res?.data?.list);
        const item = res?.data.details;

        const footerData = [
          { colSpan: 1, name: "" },
          {
            colSpan: 2,
            name: t("Total Intake"),
            className: "text-center-table",
          },
          {
            colSpan: 6,
            name: Number(item?.totalIntake) || 0,
            // name: Number(item.infused ?? 0) +
            //     Number(item.poAmount ?? 0) +
            //     Number(item.tubeAmount ?? 0) || 0,
            className: "text-center-table",
          },
          {
            colSpan: 2,
            name: t("Total Output"),
            className: "text-center-table",
          },
          {
            colSpan: 7,
            name: Number(item?.totalOutput),
            // name: Number(item?.vomit ?? 0) + Number(item?.stool ?? 0) + Number(item?.ng ?? 0) + Number(item?.urine ?? 0) || 0,
            className: "text-center-table",
          },
          { colSpan: 2, name: t("Balance"), className: "text-center-table" },
          {
            colSpan: 2,
            name: Number(item?.netBalance ?? 0) || 0,
            // name: Number(item?.balance ?? 0) || 0,
            className: "text-center-table",
          },
        ];
        setFooter(footerData);
        setSummery(item);
      }
    } else {
      // handle error
      if (type === 0) setCurrentData([]);
      if (type === 1) setPreviousData([]);
      if (type === 2) setAllData([]);
    }
  };
  useEffect(() => {
    getdatatype(0);
    getdatatype(1);
    getdatatype(2);
  }, []);

  // const mappedRowspPrevios = previousData?.map((item) => ({
  //     date: item?.date,
  //     time: item?.time,
  //     fluidNo: item?.fluidNo,
  //     type: item?.type,
  //     infused: item?.infused,
  //     tubeType: item?.tubeType,
  //     poAmount: item?.poAmount,
  //     poType: item?.poType,
  //     tubeAmount: item?.tubeAmount,
  //     vomit: item?.vomit,
  //     stool: item?.stool,
  //     ng: item?.ng,
  //     urine: item?.urine,
  //     drain1: item?.drain1,
  //     drain2: item?.drain2,
  //     drain3: item?.drain3,
  //     drain4: item?.drain4,
  //     drain5: item?.drain5,
  //     balance: item?.balance,
  //     remark: item?.remark,
  //     entryByName: item?.entryByName,
  //     canDelete: item?.canDelete === 1 ? <div className='text-center p-1'><i className="fa fa-trash text-danger" onClick={() => { handleDelete(item?.id) }} aria-hidden="true"></i> </div> : ''
  // }));
  // const mapCurrent = currentData?.map((item) => ({
  //     date: item?.date,
  //     time: item?.time,
  //     fluidNo: item?.fluidNo,
  //     type: item?.type,
  //     infused: item?.infused,
  //     tubeType: item?.tubeType,
  //     poAmount: item?.poAmount,
  //     poType: item?.poType,
  //     tubeAmount: item?.tubeAmount,
  //     vomit: item?.vomit,
  //     stool: item?.stool,
  //     ng: item?.ng,
  //     urine: item?.urine,
  //     drain1: item?.drain1,
  //     drain2: item?.drain2,
  //     drain3: item?.drain3,
  //     drain4: item?.drain4,
  //     drain5: item?.drain5,
  //     balance: item?.balance,
  //     remark: item?.remark,
  //     entryByName: item?.entryByName,
  //     canDelete: item?.canDelete === 1 ? <div className='text-center p-1'><i className="fa fa-trash text-danger" onClick={() => { handleDelete(item?.id) }} aria-hidden="true"></i> </div> : ""
  // }));
  // const allMapData = allData?.map((item) => ({
  //     date: item?.date,
  //     time: item?.time,
  //     fluidNo: item?.fluidNo,
  //     type: item?.type,
  //     infused: item?.infused,
  //     tubeType: item?.tubeType,
  //     poAmount: item?.poAmount,
  //     poType: item?.poType,
  //     tubeAmount: item?.tubeAmount,
  //     vomit: item?.vomit,
  //     stool: item?.stool,
  //     ng: item?.ng,
  //     urine: item?.urine,
  //     drain1: item?.drain1,
  //     drain2: item?.drain2,
  //     drain3: item?.drain3,
  //     drain4: item?.drain4,
  //     drain5: item?.drain5,
  //     balance: item?.balance,
  //     remark: item?.remark,
  //     entryByName: item?.entryByName,
  //     canDelete: item?.canDelete === 1 ? <div className='text-center p-1'><i className="fa fa-trash text-danger" onClick={() => { handleDelete(item?.id) }} aria-hidden="true"></i> </div> : ""
  // }));

  // const previousTbody = [...(mappedRowspPrevios || [])]
  // const currentTbody = [...(mapCurrent || [])]
  // const allTbody = [...(allMapData || [])]

  const SummaryFooter = ({ data }) => {
    return (
      <div
        style={{
          width: "100%",
          // background: "#dee1dc",
          padding: "20px",
          fontSize: "15px",
          fontWeight: "600",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ width: "33%", lineHeight: "28px" }}>
            <div>
              <b>{t("INTRAVENOUS :")}</b> {data.totalIVInfused}
            </div>
            <div>
              <b>{t("Feeds :")}</b> {data.totalPOAmount + data.totalTubeAmount}
            </div>

            <div style={{ marginTop: "15px" }}>
              <b>{t("TOTAL INTAKE (A) :")}</b> {data.totalIntake}
            </div>
            <div>
              <b>{t("Difference (A-B) =")}</b> {data.netBalance}
            </div>
          </div>

          <div
            style={{ width: "33%", lineHeight: "28px", textAlign: "center" }}
          >
            <div>
              <b>{t("TOTAL INTAKE:")}</b> {data.totalIntake}
            </div>
            <div>
              <b>{t("TOTAL OUTPUT:")}</b> {data.totalOutput}
            </div>
          </div>

          <div style={{ width: "33%", lineHeight: "28px", textAlign: "right" }}>
            <div>
              <b>{t("VOMIT :")}</b> {data.totalVomit}
            </div>
            <div>
              <b>{t("STOOL :")}</b> {data.totalStool}
            </div>
            <div>
              <b>{t("NASO GAST :")}</b> {data.totalNG}
            </div>
            <div>
              <b>{t("URINE :")}</b> {data.totalUrine}
            </div>
            <div>
              <b>{t("DRAIN :")}</b> {data.totalDrain}
            </div>

            <div style={{ marginTop: "15px" }}>
              <b>{t("TOTAL OUTPUT (B) :")}</b> {data.totalOutput}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleDelete = async (ID) => {
    const data = {
      id: ID,
    };
    const res = await deleteIntakeOutputByIdApi(data);
    if (res?.success) {
      notify(res?.message, "success");
      getdatatype(0);
      getdatatype(1);
      getdatatype(2);
    } else {
      notify(res?.message, "error");
    }
  };
  const handleSearch = async () => {
    const res = await searchIntakeOutputDetailsApi(
      patientID || data?.PatientID,
      transactionID || data?.TransactionID,
      moment(payload?.Date1).format("DD-MMM-YYYY")
    );
    if (res?.success) {
      notify(res?.message, "success");
      setAllData(res?.data?.list);
      const item = res?.data?.details;

      const footerData = [
        { colSpan: 1, name: "" },
        { colSpan: 2, name: t("Total Intake"), className: "text-center-table" },
        {
          colSpan: 6,
          name: Number(item?.totalIntake) || 0,
          className: "text-center-table",
        },
        { colSpan: 2, name: t("Total Output"), className: "text-center-table" },
        {
          colSpan: 7,
          name: Number(item?.totalOutput),
          className: "text-center-table",
        },
        { colSpan: 2, name: t("Balance"), className: "text-center-table" },
        {
          colSpan: 2,
          name: Number(item?.netBalance ?? 0) || 0,
          className: "text-center-table",
        },
      ];
      setFooter(footerData);
      setSummery(item);
    } else {
      setSummery([]);
      notify(res?.message, "error");
    }
  };
  return (
    <div className="mt-2 spatient_registration_card">
      <div className="patient_registration card">
        {tableData?.length > 0 ? (
          <div className="patient_registration card">
            <Heading
              title={t("Add Data ")}
              isBreadcrumb={false}
              secondTitle={
                <>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={handleSaveAPI}
                  >
                    {t("Save")}
                  </button>
                  {/* <button
                    className="btn btn-primary ml-2"
                    onClick={handlePrint}
                  >
                    {t("Print")}
                  </button> */}
                </>
              }
            />
            <div className="row p-2">
              <TextAreaInput
                type="text"
                className="form-textarea"
                id="remarks"
                name="remarks"
                value={tableData[0].remarks || ""}
                onChange={handleChange}
                lable={t("Comments")}
                placeholder=""
                respclass="col-xl-4 col-md-3 col-sm-4 col-12"
              />
            </div>

            <IntakeOutputChartTable
              THEAD={{ More_THEAD, row2, thed }}
              Tbody={tableData?.map((item, rowIndex) => ({
                Date: (
                  <DatePicker
                    className="custom-calendar"
                    id="Date"
                    name="Date"
                    placeholder={VITE_DATE_FORMAT}
                    lable={t("Date")}
                    respclass={""}
                    showTime
                    value={item?.Date}
                    handleChange={handleChange}
                    hourFormat="12"
                  />
                ),
                Time: (
                  <TimePicker
                    placeholderName={t("Time")}
                    lable={t("Time")}
                    id="Time"
                    name="Time"
                    respclass=""
                    value={item?.Time ? item?.Time : new Date()}
                    // value={new Date(`1970-01-01T00:00:00`)}
                    handleChange={handleChange}
                  />
                ),
                FluidNo: HandleInputField(
                  item?.fluidNo,
                  "fluidNo",
                  10,
                  "number",
                  rowIndex
                ),
                Type: HandleInputField(
                  item?.type,
                  "type",
                  10,
                  "text",
                  rowIndex
                ),
                Infused: HandleInputField(
                  item?.infused,
                  "infused",
                  5,
                  "number",
                  rowIndex
                ),
                poType: HandleInputField(
                  item?.poType,
                  "poType",
                  5,
                  "text",
                  rowIndex
                ),
                Amount1: HandleInputField(
                  item?.amount1,
                  "amount1",
                  5,
                  "number",
                  rowIndex
                ),
                TubeType: HandleInputField(
                  item?.tubeType,
                  "tubeType",
                  10,
                  "text",
                  rowIndex
                ),
                Amount2: HandleInputField(
                  item?.amount2,
                  "amount2",
                  5,
                  "number",
                  rowIndex
                ),

                Vomit: HandleInputField(
                  item?.vomit,
                  "vomit",
                  5,
                  "number",
                  rowIndex
                ),
                Stool: HandleInputField(
                  item?.stool,
                  "stool",
                  5,
                  "number",
                  rowIndex
                ),
                NG: HandleInputField(item?.ng, "ng", 5, "number", rowIndex),
                Urine: HandleInputField(
                  item?.urine,
                  "urine",
                  5,
                  "number",
                  rowIndex
                ),

                Drain1: HandleInputField(
                  item?.drain1,
                  "drain1",
                  5,
                  "number",
                  rowIndex
                ),
                Drain2: HandleInputField(
                  item?.drain2,
                  "drain2",
                  5,
                  "number",
                  rowIndex
                ),
                Drain3: HandleInputField(
                  item?.drain3,
                  "drain3",
                  5,
                  "number",
                  rowIndex
                ),
                Drain4: HandleInputField(
                  item?.drain4,
                  "drain4",
                  5,
                  "number",
                  rowIndex
                ),
                Drain5: HandleInputField(
                  item?.drain5,
                  "drain5",
                  5,
                  "number",
                  rowIndex
                ),
              }))}
              dataTitle={"thed"}
            />
          </div>
        ) : (
          ""
        )}

        {currentData?.length > 0 ? (
          <div>
            <Heading
              title={t("Current Date 6 AM To Till time")}
              isBreadcrumb={false}
            />
            <IntakeOutputChartTable
              THEAD={{ More_THEAD, row2, tshow }}
              Tbody={currentData?.map((item) => ({
                date: item?.date,
                time: item?.time,
                fluidNo: item?.fluidNo,
                type: item?.type,
                infused: item?.infused,
                tubeType: item?.tubeType,
                poAmount: item?.poAmount,
                poType: item?.poType,
                tubeAmount: item?.tubeAmount,
                vomit: item?.vomit,
                stool: item?.stool,
                ng: item?.ng,
                urine: item?.urine,
                drain1: item?.drain1,
                drain2: item?.drain2,
                drain3: item?.drain3,
                drain4: item?.drain4,
                drain5: item?.drain5,
                balance: item?.balance,
                remark: item?.remark,
                entryByName: item?.entryByName,
                canDelete:
                  item?.canDelete === 1 ? (
                    <div className="text-center p-1">
                      <i
                        className="fa fa-trash text-danger"
                        onClick={() => {
                          handleDelete(item?.id);
                        }}
                        aria-hidden="true"
                      ></i>{" "}
                    </div>
                  ) : (
                    ""
                  ),
              }))}
              dataTitle={"tshow"}
            />
          </div>
        ) : (
          ""
        )}
        {previousData?.length > 0 ? (
          <div>
            <Heading
              title={t("Previous Date 6 AM to Current Date 6 AM")}
              isBreadcrumb={false}
            />
            <IntakeOutputChartTable
              THEAD={{ More_THEAD, row2, tshow }}
              Tbody={previousData?.map((item) => ({
                date: item?.date,
                time: item?.time,
                fluidNo: item?.fluidNo,
                type: item?.type,
                infused: item?.infused,
                tubeType: item?.tubeType,
                poAmount: item?.poAmount,
                poType: item?.poType,
                tubeAmount: item?.tubeAmount,
                vomit: item?.vomit,
                stool: item?.stool,
                ng: item?.ng,
                urine: item?.urine,
                drain1: item?.drain1,
                drain2: item?.drain2,
                drain3: item?.drain3,
                drain4: item?.drain4,
                drain5: item?.drain5,
                balance: item?.balance,
                remark: item?.remark,
                entryByName: item?.entryByName,
                canDelete:
                  item?.canDelete === 1 ? (
                    <div className="text-center p-1">
                      <i
                        className="fa fa-trash text-danger"
                        onClick={() => {
                          handleDelete(item?.id);
                        }}
                        aria-hidden="true"
                      ></i>{" "}
                    </div>
                  ) : (
                    ""
                  ),
              }))}
              dataTitle={"tshow"}
            />
          </div>
        ) : (
          ""
        )}

        {allData?.length > 0 ? (
          <div>
            <Heading
              title={t("All Date Data")}
              isBreadcrumb={false}
              secondTitle={
                <div className="d-flex mt-1">
                  <DatePicker
                    className="custom-calendar mt-2"
                    id="Date"
                    name="Date1"
                    placeholder={VITE_DATE_FORMAT}
                    lable={t("Date1")}
                    // respclass={"col-xl-4 col-md-3 col-sm-4 col-12"}
                    showTime
                    value={payload.Date1}
                    handleChange={handleChangePayload}
                    hourFormat="12"
                  />

                  <button
                    className="btn btn-primary m-2"
                    type="button"
                    onClick={handleSearch}
                  >
                    {t("Search")}
                  </button>
                </div>
              }
            />

            <IntakeOutputChartTable
              THEAD={{ More_THEAD, row2, tshow }}
              Tbody={allData?.map((item) => ({
                date: item?.date,
                time: item?.time,
                fluidNo: item?.fluidNo,
                type: item?.type,
                infused: item?.infused,
                tubeType: item?.tubeType,
                poAmount: item?.poAmount,
                poType: item?.poType,
                tubeAmount: item?.tubeAmount,
                vomit: item?.vomit,
                stool: item?.stool,
                ng: item?.ng,
                urine: item?.urine,
                drain1: item?.drain1,
                drain2: item?.drain2,
                drain3: item?.drain3,
                drain4: item?.drain4,
                drain5: item?.drain5,
                balance: item?.balance,
                remark: item?.remark,
                entryByName: item?.entryByName,
                canDelete:
                  item?.canDelete === 1 ? (
                    <div className="text-center p-1">
                      <i
                        className="fa fa-trash text-danger"
                        onClick={() => {
                          handleDelete(item?.id);
                        }}
                        aria-hidden="true"
                      ></i>{" "}
                    </div>
                  ) : (
                    ""
                  ),
              }))}
              footer={footer}
              dataTitle={"tshow"}
            />
            <SummaryFooter data={summery} />
          </div>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default InTakeOutPutChart;
