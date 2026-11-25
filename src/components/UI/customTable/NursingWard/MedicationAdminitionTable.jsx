import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import NestedRowTable from "../NestedRowTable";
import DatePicker from "../../../formComponent/DatePicker";
import TimePicker from "../../../formComponent/TimePicker";
import Input from "../../../formComponent/Input";
import CustomSelect from "../../../formComponent/CustomSelect";
import { CancelMedicationRecord, MedicineDetailsCancel, MedicineDetailsSave, MedicineFreQuency, MedicineRoute, MedicineTimes, SaveMedicationRecord } from "../../../../networkServices/nursingWardAPI";
import { handleMedicineDetailsSavePayload, notify, WithoutObjecthandleReactSelectDropDownOptions } from "../../../../utils/utils";
import { useLocalStorage } from "../../../../utils/hooks/useLocalStorage";
import moment from "moment";
const index = ({ tbody, thead, tableHeight, setTbody, editMedicineDetail, setHandleModelData, handleModelData, setModalData, values, bindMedicationList, medicationAdmiTionList }) => {

    const localdata = useLocalStorage("userData", "get")

    const [t] = useTranslation();
    const { VITE_DATE_FORMAT } = import.meta.env;

    const [bodyData, setBodyData] = useState([])

    // fin_global_resources -> IsMedicationEntryRow
    // IsActive=1 aur Value=1 hone par purane (ASP.NET) wale screen jaisa behaviour:
    //   - har medicine par "+" aata hai, chahe uski koi entry na ho
    //   - expand karne par upar ek New row milti hai (Date, Time, Dose, Qty, Route,
    //     Frequency, Remark) jisme bhar kar Save kiya ja sakta hai
    // Row na ho / IsActive=0 ho to jaisa chal raha hai waisa hi chalega.
    const { GetGlobalResources } = useSelector((state) => state?.CommonSlice);
    const isMedicationEntryRow =
        String(
            (Array.isArray(GetGlobalResources) ? GetGlobalResources : [])?.find(
                (item) => item?.Name === "IsMedicationEntryRow",
            )?.Value ?? "",
        ).trim() === "1";

    // Route / Frequency parent se kabhi plain string list ke roop me aate hain
    // aur kabhi pehle se {label, value} bane hue. Dono ko ek hi shape me laata hai -
    // warna dobara wrap hone par label object ban jaata hai aur CustomSelect toot jaata hai.
    const toSelectOptions = (list) =>
        (Array.isArray(list) ? list : [])
            .map((item) => {
                if (item && typeof item === "object") {
                    const label = item?.label ?? item?.Route ?? item?.Frequency ?? item?.NAME ?? "";
                    const value = item?.value ?? label;
                    return { label: String(label), value: String(value) };
                }
                return { label: String(item ?? ""), value: String(item ?? "") };
            })
            .filter((item) => item.label !== "");

    // Entry row wale layout ke headers - MEDICATION_TABLE_INPUT_FIELD ki
    // keys ke saath 1:1 hain (positional match hota hai).
    const entryRowThead = [
        { name: t("S.NO."), width: "1%" },
        { name: t("Medicine Date"), width: "2%" },
        { name: t("Time"), width: "2%" },
        { name: t("Dose"), width: "1%" },
        { name: t("Qty"), width: "1%" },
        { name: t("Route"), width: "2%" },
        { name: t("Frequency"), width: "2%" },
        t("Remark"),
        t("Entry By"),
        { name: t("Entry Date & Time"), width: "2%" },
        { name: t("Action"), width: "1%" },
    ]

    const seondThead = [
        { name: t("S.NO."), width: "1%" },
        { name: t("Schedule Date"), width: "2%" },
        { name: t("Schedule Time"), width: "2%" },
        t("Remark"),
        { name: t("No Need"), width: "1%" },
        t("Given By"),
        { name: t("Given Date"), width: "10%" },
        { name: t("Given Time"), width: "1%" },
        { name: t("Status"), width: "1%" },
        { name: t("Action"), width: "1%" },

    ]

    const handleClickEdit = (val, index, isopen) => {
        tbody[index]["isopen"] = !isopen
        bindBodyData(tbody)
    }


    const handleSaveAPI = async (data) => {
        try {
            // data.status = "Started"
            const payload = handleMedicineDetailsSavePayload(data);
            const response = await MedicineDetailsSave(payload);
            // console.log("re", response)
            if (response?.success) {
                bindMedicationList(values?.category?.value);
                notify(response?.message, "success");
            } else {
                notify(response?.message, "error");
            }
        } catch (error) {
            console.log("Something Went Wrong");
        }
    };
    const handleSaveStartStopAPI = async (data, status, subItem) => {
        try {
            data.status = status
            const payload = handleMedicineDetailsSavePayload(data, subItem);
            // console.log("valval",payload)
            const response = await MedicineDetailsSave(payload);
            console.log("re", response)
            if (response?.success) {
                bindMedicationList(values?.category?.value);
                notify(response?.message, "success");
            } else {
                notify(response?.message, "error");
            }
        } catch (error) {
            console.log("Something Went Wrong");
        }
    };

    const MEDICATION_TABLE_INPUT_FIELD = (addState, index) => {
        // Purane page me entry sirf tab band hoti thi jab medicine "Stopped" ho -
        // "Requisition Done", "Completed" wagairah par bhi Save chalta tha.
        // Isliye flag on hone par wahi rule, warna purana (sirf Running) rule.
        const isEntryDisabled = isMedicationEntryRow
            ? addState?.STATUS === "Stopped"
            : addState?.STATUS !== "Running";

        return {
            // Entry row par "New" likha aata hai - niche saved entries 1, 2, 3... se number hoti hain.
            "S.No.": isMedicationEntryRow ? "New" : "*",
            DATE: (
                // <div style={{ minWidth: "90px" }}>
                <DatePicker
                    className="custom-calendar"
                    respclass={"nested-Table-Inputswidth"}
                    value={addState?.date ? addState?.date : new Date()}
                    // respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                    removeFormGroupClass={true}

                    id="Date"
                    name="date"
                    placeholder={VITE_DATE_FORMAT}
                    disable={isEntryDisabled}
                    showTime
                    hourFormat="12"
                    handleChange={(e) => handleChange(e, index)}
                />
                // </div>
            ),
            Time: (

                <TimePicker
                    placeholderName={t("Time")}
                    className="table-calender-height"
                    value={addState?.time ? addState?.time : new Date()}
                    id="Fromtime"
                    name="time"
                    respclass={"nested-Table-Inputswidth"}
                    handleChange={(e) => handleChange(e, index)}
                />
            ),

            Dose: (
                <Input
                    type="number"
                    className="table-input"
                    name={"dose"}
                    respclass={"nested-Table-Inputswidth"}
                    disabled={isEntryDisabled}
                    removeFormGroupClass={true}
                    onChange={(e) => handleChange(e, index)}
                    value={addState?.dose ? addState?.dose : ""}
                />
            ),
            Qty: (
                <Input
                    type="number"
                    className="table-input"
                    name={"Qty"}
                    respclass={"nested-Table-Inputswidth"}
                    disabled={isEntryDisabled}
                    removeFormGroupClass={true}
                    onChange={(e) => handleChange(e, index)}
                    value={addState?.Qty ? addState?.Qty : ""}
                />
            ),
            Route: (
                <CustomSelect
                    option={toSelectOptions(medicationAdmiTionList?.MedicineRoute)}
                    placeHolder="Select Route"
                    value={addState?.Route?.value}
                    isDisable={isEntryDisabled}
                    name="Route"
                    onChange={(name, e) => handleCustomSelect(index, name, e)}
                />
            ),
            Frequency: (
                <CustomSelect
                    option={toSelectOptions(medicationAdmiTionList?.MedicineFreQuency)}
                    placeHolder="Select Frequency"
                    value={addState?.Frequency?.value}
                    isDisable={isEntryDisabled}
                    name="Frequency"
                    onChange={(name, e) => handleCustomSelect(index, name, e)}
                />
            ),
            Remark: (
                <Input
                    type="text"
                    className="table-input"
                    name={"Remark"}
                    disabled={isEntryDisabled}
                    removeFormGroupClass={true}
                    respclass={"nested-Table-Inputswidth"}
                    value={addState?.Remark ? addState?.Remark : ""}
                    onChange={(e) => handleChange(e, index)}
                />
            ),
            "EntryBy": (
                <></>
            ),
            "entryDatetime": (
                <></>
            ),

            "Save": (<>
                {/* {Number(localdata?.defaultRole) === 52 ?
                    <> */}


                {/* Purane page me Save hamesha dikhta tha aur sirf "Stopped" par band hota tha,
                    isliye flag on hone par wahi rule. */}
                {(isMedicationEntryRow
                    ? Number(localdata?.defaultRole) !== 52
                    : addState?.STATUS === "Running" && Number(localdata?.defaultRole) !== 52) ?
                    <button className="btn btn-sm btn-primary" disabled={isEntryDisabled} onClick={() => {
                        // Flag on hone par entry seedhe cpoe_medication_record me jaati hai
                        // (purane MedicationRecord.aspx jaisa), warna purana schedule wala save.
                        if (isMedicationEntryRow) {
                            handleSaveMedicationRecord(addState);
                        } else {
                            handleSaveStartStopAPI(addState, "");
                        }
                    }} >
                        {t("Save")}
                    </button> :
                    ""}

                {Number(localdata?.defaultRole) === 52 ? <>
                    {addState?.STATUS === "Running" ? <button className="btn btn-sm btn-primary ml-1 " onClick={() => {
                        handleSaveStartStopAPI(addState, "Stopped");
                    }} >
                        {t("NursingWard.MedicationAdministrationRecord.Stop")}
                    </button> : (addState?.STATUS === "Stopped") && <button className="btn btn-sm btn-primary ml-1 " onClick={() => {
                        handleSaveStartStopAPI(addState, "Started")
                    }} >
                        {t("NursingWard.MedicationAdministrationRecord.Start")}
                    </button>}
                </> : <></>}

                {/* </> : <></>
                } */}
            </>
            ),



        };
    };


    const CancelComponentText = async (data) => {
        try {
            let payload = {
                "id": data?.subListitem?.ID,
                "transactionID": data?.subListitem?.TransactionID,
                "indentNo": data?.subListitem?.IndentNo,
                "itemID": data?.subListitem?.ItemID
            }
            let apiResp = await MedicineDetailsCancel(payload)
            if (apiResp?.success) {
                notify(apiResp?.message, "success");
                bindMedicationList(values?.category?.value);
                setHandleModelData((val) => ({ ...val, isOpen: false }));
            } else {
                notify(apiResp?.message, "error")

            }
        } catch (error) {

        }
    }

    const handleCancelSubRow = (listval, index, subListitem, i) => {
        setModalData({ listval: listval, index: index, subListitem: subListitem, i: i })
        setHandleModelData({
            label: t("NursingWard.MedicationAdministrationRecord.CancelMedicineDetails"),
            buttonName: t("NursingWard.MedicationAdministrationRecord.Cancel"),
            width: "20vw",
            isOpen: true,
            Component: <h3>{t("NursingWard.MedicationAdministrationRecord.CancelComponenttext")}</h3>,
            handleInsertAPI: CancelComponentText,
            extrabutton: <></>,
            CancelbuttonName: t("NursingWard.MedicationAdministrationRecord.Close")
        })
    }

    const getRowClass = (val, index) => {

        let status = tbody[index]["STATUS"]
        if (status === "Completed") {
            return "color-indicator-6-bg"
        }
        if (status === "Medicine Discontinued") {
            return "color-indicator-5-bg"
        }
        if (status === "Running") {
            return "color-indicator-4-bg"
        }
        if (status === "Requisition Done") {
            return "color-indicator-1-bg"
        }
        if (status === "Requisition Rejected") {
            return "color-indicator-3-bg"
        }
        if (status === "Pending Requisition") {
            return "color-indicator-2-bg"
        }

    };

    const handleSubRow = (val, index, subIndex) => {
        // Flag on hone par sabse upar New entry row lagti hai, isliye saved entries
        // ka index ek se khisak jaata hai. New row (subIndex 0) ka koi color nahi hota.
        const listIndex = isMedicationEntryRow ? subIndex - 1 : subIndex;
        if (listIndex < 0) return "";

        let data = tbody?.[index]?.["BindMedicineList"]?.[listIndex]?.["MedicineStatusValue"]
        if (data === 1) {
            return "color-indicator-7-bg";
        } else if (data === 2) {
            return "color-indicator-9-bg";
        } else if (data === 3) {
            return "color-indicator-10-bg";
        } else if (data === 4) {
            return "color-indicator-11-bg";
        } else if (data === 5) {
            return "color-indicator-12-bg";
        } else if (data === 6) {
            return "color-indicator-8-bg";
        }
    }

    // Nayi entry save karna - purane page ke Save button jaisa.
    const handleSaveMedicationRecord = async (val) => {
        try {
            if (!val?.Route?.value) {
                notify("Please Select Medicine Route", "warn");
                return;
            }
            if (!val?.Frequency?.value) {
                notify("Please Select Medicine Frequency", "warn");
                return;
            }

            const payload = {
                transactionID: Number(val?.tid) || 0,
                itemID: String(val?.ItemID ?? ""),
                itemName: String(val?.ItemName ?? ""),
                indentNo: String(val?.IndentNo ?? ""),
                issueDate: val?.DATE
                    ? moment(val?.DATE, "DD-MMM-YY hh:mm A").format("YYYY-MM-DD")
                    : "",
                medicineDate: moment(val?.date ? val?.date : new Date()).format("YYYY-MM-DD"),
                medicineTime: moment(val?.time ? val?.time : new Date()).format("YYYY-MM-DD HH:mm:ss"),
                dose: String(val?.dose ?? ""),
                qty: Number(val?.Qty) || 0,
                route: String(val?.Route?.value ?? ""),
                frequency: String(val?.Frequency?.value ?? ""),
                remark: String(val?.Remark ?? ""),
                statusType: String(val?.STATUS ?? ""),
            };

            const response = await SaveMedicationRecord(payload);
            if (response?.success) {
                notify(response?.message, "success");
                bindMedicationList(values?.category?.value);
            } else {
                notify(response?.message, "error");
            }
        } catch (error) {
            console.log("Something Went Wrong", error);
        }
    };

    const handleCancelMedicationRecord = async (item) => {
        try {
            const response = await CancelMedicationRecord({ id: Number(item?.ID) || 0 });
            if (response?.success) {
                notify(response?.message, "success");
                bindMedicationList(values?.category?.value);
            } else {
                notify(response?.message, "error");
            }
        } catch (error) {
            console.log("Something Went Wrong", error);
        }
    };

    // Entry row wale layout me pehle se saved entry ki row.
    // Keys entryRowThead ke saath 1:1 rehni chahiye.
    // Ye data BindMedicationRecord (cpoe_medication_record) se aata hai,
    // isliye har entry ka apna Dose / Route / Frequency hota hai.
    const MEDICATION_SAVED_ROW = (val, item, i) => {
        return {
            "S.No.": i + 1,
            DATE: item?.MedicineDate,
            Time: item?.MedicineTime,
            Dose: item?.Dose,
            Qty: item?.Qty,
            Route: item?.Route,
            Frequency: item?.Frequency,
            Remark: item?.Remark,
            EntryBy: item?.EntryBy,
            entryDatetime: item?.EntryDateTime,
            Save:
                Number(localdata?.defaultRole) !== 52 ? (
                    <i
                        className="fa fa-trash text-danger text-center"
                        aria-hidden="true"
                        onClick={() => { handleCancelMedicationRecord(item) }}
                    ></i>
                ) : (
                    <></>
                ),
        };
    };

    const bindBodyData = (tbody) => {
        let list = []
        tbody?.map((val, index) => {
            let secondTbody = []
            // val.GivenTime = val.GivenTime?val.GivenTime:new Date()

            // Flag on hone par sabse upar New entry row - isi me bhar kar Save hota hai.
            if (isMedicationEntryRow) {
                secondTbody.push(MEDICATION_TABLE_INPUT_FIELD(val, index))

                val?.BindMedicineList?.length > 0 &&
                    val?.BindMedicineList?.map((item, i) => {
                        secondTbody.push(MEDICATION_SAVED_ROW(val, item, i))
                    })
            }


            !isMedicationEntryRow && val?.BindMedicineList?.length > 0 && val?.BindMedicineList?.map((item, i) => {
                let obj = {
                    // rowColor: handleSubRowColor(item?.MedicineStatusValue),
                    sno: i + 1,
                    // ItemName: val?.ItemName,
                    ScheduleDate: item?.ScheduleDate,
                    ScheduleTime: item?.ScheduleTime,
                    // Dose: val?.Dose ? val?.Dose : "0",
                    // Qty: 1,
                    Remark: <Input
                        type="text"
                        className="table-input"
                        name={"Remark"}
                        disabled={(item?.IsSave === 0) ? true : false}
                        removeFormGroupClass={true}
                        respclass={"nested-Table-Inputswidth"}
                        value={item?.Remark ? item?.Remark : ""}
                        onChange={(e) => handleChange(e, index, i)}
                    />,
                    noNeed: item?.IsSave === 1 && <input type="checkbox" name="IsGiven" onChange={(e) => { handleChange(e, index, i, true) }} />,

                    GivenBy: item?.GivenBy,

                    DATE: item?.IsSave === 1 ? <DatePicker
                        // className="custom-calendar"
                        className="custom-calendar-table"
                        respclass={"nested-Table-Inputswidth"}
                        value={item?.GivenDateTime ? new Date(item?.GivenDateTime) : new Date()}
                        removeFormGroupClass={true}
                        id="GivenDateTime"
                        name="GivenDateTime"
                        placeholder={VITE_DATE_FORMAT}
                        showTime
                        hourFormat="12"
                        handleChange={(e) => handleChange(e, index, i)}
                    /> : item?.GivenDateTime && moment(item?.GivenDateTime).format("DD-MMM-YYYY"),
                    Time: item?.IsSave === 1 ? <TimePicker
                        placeholderName={t("Schedule Time")}
                        className="table-calender-height"
                        value={item?.GivenTime ? new Date(item?.GivenTime) : new Date()}
                        id="Fromtime"
                        name="GivenTime"
                        respclass={"nested-Table-Inputswidth"}
                        handleChange={(e) => handleChange(e, index, i)}
                    /> : item?.GivenDateTime && moment(item?.GivenDateTime).format("hh:mm A"),
                    MedicineStatus: item?.MedicineStatus,
                    "Save": (<>

                        {(item?.IsSave === 1) || val?.STATUS === "Running" && Number(localdata?.defaultRole) !== 52 ?
                            <button className="btn btn-sm btn-primary" onClick={() => {
                                handleSaveStartStopAPI(val, "", item);
                            }} >
                                {/* {console.log("val?.GivenTime",item?.GivenTime)} */}
                                {t("Save")}
                            </button> :
                            ""}

                        {Number(localdata?.defaultRole) === 52 ? <>
                            {val?.STATUS === "Running" ? <button className="btn btn-sm btn-primary ml-1 " onClick={() => {
                                handleSaveStartStopAPI(val, "Stopped");
                            }} >
                                {t("NursingWard.MedicationAdministrationRecord.Stop")}
                            </button> : (val?.STATUS === "Stopped") && <button className="btn btn-sm btn-primary ml-1 " onClick={() => {
                                handleSaveStartStopAPI(val, "Started")
                            }} >
                                {t("NursingWard.MedicationAdministrationRecord.Start")}
                            </button>}
                        </> : <></>}

                        {/* </> : <></>
                        } */}
                    </>)
                    // Remove: Number(localdata?.defaultRole) !== 52 ? <i className="fa fa-trash text-danger text-center" aria-hidden="true" onClick={() => { handleCancelSubRow(val, index, item, i + 1) }}></i> : <></>,
                }
                secondTbody.push(obj)
            })
            let obj = {}
            obj.index = (isMedicationEntryRow || val?.BindMedicineList?.length > 0) ? <span onClick={() => { handleClickEdit(val, index, val?.isopen) }}>
                {val?.isopen > 0 ? <i className="fa fa-minus" aria-hidden="true"></i> : <i className="fa fa-plus" aria-hidden="true"></i>}
            </span> : ""
            // obj.colorcode = getRowClass(val),
            obj.sno = index + 1,
                obj.MedicineName = val?.ItemName
            obj.DATE = val?.DATE
            obj.OrderQty = val?.IssueQty
            obj.IssueQty = val?.ReceiveQty
            obj.GivenQty = val?.GivenQty ? val?.GivenQty : ""
            obj.RemainingQty = val?.RemainingQty
            obj.Dose = val?.Dose
            obj.Timing = val?.Timing
            obj.Route = val?.Route
            obj.Duration = val?.Duration
            obj.STATUS = val?.STATUS
            obj.EName = val?.EName
            obj.Edit = (localdata?.defaultRole === 52) ? <i className="fa fa-edit" aria-hidden="true" onClick={() => { editMedicineDetail(val) }}></i> : <></>
            // NestedRowTable per-row secondThead support karta hai, isliye flag on hone par
            // sirf isi screen ka header set ho jaata hai - baaki jagah waise hi.
            obj.subRow = {
                subRowList: secondTbody,
                isopen: val?.isopen,
                ...(isMedicationEntryRow ? { secondThead: entryRowThead } : {}),
            }
            list.push(obj)
        })
        setBodyData(list)
    }
    useEffect(() => {
        bindBodyData(tbody)
    }, [tbody, medicationAdmiTionList])


    const handleChange = (e, parentIndex, childIndex, checkedBox) => {
        const { name, value, checked } = e.target;
        const newTableData = [...tbody]; // Create a copy of the current data

        // New entry row childIndex ke bina call karti hai - uski value medicine
        // (parent row) par hi rakhni hoti hai, warna BindMedicineList[undefined] par crash hota hai.
        if (childIndex === undefined || childIndex === null) {
            newTableData[parentIndex][name] = checkedBox ? checked : value;
        } else {
            newTableData[parentIndex]["BindMedicineList"][childIndex][name] = checkedBox ? checked : value; // Update the specific input field
        }
        bindBodyData(newTableData); // Set the updated state
        // setMedicineValues(newTableData[parentIndex])

    };

    const handleCustomSelect = (parentIndex, name, value) => {
        const newTableData = [...tbody]; // Create a copy of the current data
        newTableData[parentIndex][name] = value; // Update the specific input field
        bindBodyData(newTableData); // Set the updated state
        // setMedicineValues(newTableData[parentIndex])
    };



    return (
        <>
            <NestedRowTable
                thead={thead}
                seondThead={seondThead}
                tbody={bodyData}
                tableHeight={tableHeight}
                getRowClass={getRowClass}
                handleSubRow={handleSubRow}
                SubtableClass={"medRecordNestedTable"}
            />


        </>
    );
};

export default index;
