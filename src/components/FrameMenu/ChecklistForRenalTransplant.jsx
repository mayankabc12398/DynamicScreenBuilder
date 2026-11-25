import React, { useEffect, useState } from 'react'
import Heading from '../UI/Heading';
import Tables from '../UI/customTable';
import { useTranslation } from 'react-i18next';
import { getAllFieldsValueOfChecklistForRenalTransplantApi, saveOrUpdateRenalTransplantChecklistApi, getRenalTransplantChecklistApi } from '../../networkServices/nursingWardAPI';
import ReactSelect from '../formComponent/ReactSelect';
import { notify } from '../../utils/ustil2';
import Input from '../formComponent/Input';
import DatePicker from '../formComponent/DatePicker';
import moment from 'moment';

const ChecklistForRenalTransplant = ({ data }) => {
    const { patientID, transactionID } = data;
    const [t] = useTranslation();
    const [checklistRows, setChecklistRows] = useState([]);
    const { VITE_DATE_FORMAT } = import.meta.env;
    const [payload, setPayload] = useState({
        Date: new Date(),
        id: 0,
    })
    const [tableData, setTableData] = useState([])
    const SECTION_HEADINGS = [
        "In the Ward",
        "ICU",
        "Ward post transplant",
        "On Discharge"
    ];
    const mapChecklistToState = (apiData = []) => {
        const mapped = apiData?.map(item => ({
            RenalTransplantMasterID: item.Id,
            RequirementMode: item.Checklist,
            Status: "",
            Comments: "",
            isHeading: SECTION_HEADINGS.includes(item.Checklist)
        }));

        setChecklistRows(mapped);
    };
    const TRUE_FALSE_OPTIONS = [
        { label: t("Yes"), value: "1" },
        { label: t("No"), value: "0" },
    ];
    const [isSave, setIsSave] = useState(false)

    const THEAD = [
        { name: t("Requirement Mode") },
        { name: t("Status"), width: "20%" },
        { name: t("comments"), width: "20%" }
    ]
    const THEAD1 = [
        { name: t("S.No"), width: "1%" },
        { name: t("UHID"), width: "10%" },
        { name: t("created By"), width: "10%" },
        { name: t("Action"), width: "1%" },
    ]
    const handleStatusChange = (value, index) => {
        const updated = [...checklistRows];
        updated[index].Status = value?.value ?? "";
        setChecklistRows(updated);
    };
    console.log(checklistRows);

    const fetchCheckListData = async () => {
        const res = await getAllFieldsValueOfChecklistForRenalTransplantApi()
        if (res?.success) {
            mapChecklistToState(res?.data)
        } else {
            notify(res?.message, "error")
        }
    }


    useEffect(() => {
        fetchCheckListData()
    }, [])
    const handleChange = (e) => {
        const { name, value } = e.target;
        setPayload({
            ...payload,
            [name]: value,
        });
    };
    const handleEdit = (row) => {

        setPayload(prev => ({
            ...prev,
            nurseName: row[0]?.nurseName || "",
            Date: row[0]?.nurseDate
                ? new Date(row[0]?.nurseDate)
                : new Date(),
            id:1,
        }));

        setChecklistRows(prevRows =>
            prevRows.map(item => {

                if (item.isHeading) {
                    return {
                        ...item,
                        Status: "",
                        Comments: ""
                    };
                }

                const matched = row.find(
                    r => r.renalTransplantMasterID == item.RenalTransplantMasterID
                );

                return {
                    ...item,
                    RenalTransplantMasterID: item.RenalTransplantMasterID,
                    RequirementMode: item.RequirementMode,
                    Status: matched ? String(matched.status) : "",
                    Comments: matched?.comments || "",
                    isHeading: false
                };
            })
        );

        setIsSave("true");
    }

    console.log(checklistRows);



    const buildSavePayload = ({
        patientId,
        transactionId,
    }) => {

        return {
            data: checklistRows
                ?.filter(row => !row.isHeading)
                ?.map(row => ({
                    renalTransplantMasterID: row.RenalTransplantMasterID || 0,
                    requirementMode: row.RequirementMode || "",
                    status: row.Status !== "" ? Number(row.Status) : 0,
                    comments: row.Comments || "",
                    patientId: patientId || "",
                    transactionId: transactionId || "",
                    nurseName: payload?.nurseName || "",
                    nurseDate: payload?.Date ? moment(payload?.Date).format("DD-MM-YYYY") : "",
                }))
        };
    };
    const handleSaveCheckList = async () => {
        const payloadData = buildSavePayload({
            patientId: patientID,
            transactionId: transactionID,
        });
        const data = {
            ...payloadData,
            isUpdate: payload?.id == "1" ? 1 : 0
        }
        const res = await saveOrUpdateRenalTransplantChecklistApi(data)
        if (res?.success) {
            notify(res?.message, "success")
            fetchDataList()
        } else {
            notify(res?.message, "error")
        }
    }
    const handlePrint = () => {

    }
    const getSelectedOption = (value) =>
        TRUE_FALSE_OPTIONS.find(opt => opt.value === value) || null;

    const fetchDataList = async () => {
        const res = await getRenalTransplantChecklistApi(patientID);
        if (res?.success) {
            setTableData(res?.data)
            setIsSave("false")
        } else {
            setIsSave("true")
            setTableData([])
        }
    }
    console.log(isSave);
    
    useEffect(() => {
        fetchDataList()
    }, [])
    return (
        <div className='mt-2 spatient_registration_card card'>
            <Heading title={t("CheckList For Rental Transparent")} />
            {checklistRows?.length > 0 ? <>
                <Tables thead={THEAD}
                    tbody={checklistRows?.map((item, index) => {
                        if (item.isHeading) {
                            return {
                                RequirementMode:
                                    <span className='col-12'>{item?.RequirementMode} </span>,
                                Status: "",
                                comments: ""
                            };
                        }

                        return {
                            RequirementMode: item?.RequirementMode || "",
                            Status:
                                <ReactSelect
                                    placeholderName={t("Status")}
                                    value={item?.Status ?? 0}
                                    handleChange={(name, value) => handleStatusChange(value, index)}
                                    dynamicOptions={TRUE_FALSE_OPTIONS}
                                    respclass="col-12"
                                    removeIsClearable={false}   // set true if you want clear icon
                                />,
                            comments: (
                                <input
                                    className="form-control"
                                    value={item.Comments}
                                    onChange={(e) => {
                                        const updated = [...checklistRows];
                                        updated[index].Comments = e.target.value;
                                        setChecklistRows(updated);
                                    }}
                                />

                            )
                        }
                    })}

                />
            </>
                : ""}

            {tableData?.length > 0 ?
                <>
                    <Heading title={t("Apache Score Sheet List")} />
                    <Tables thead={THEAD1}
                        tbody={tableData?.length > 0
                            ? [
                                {
                                    SNO: 1,
                                    PatientID: tableData[0]?.patientId,
                                    createdBy: tableData[0]?.createdBy,
                                    Edit: (
                                        <i
                                            className="fa fa-edit"
                                            aria-hidden="true"
                                            onClick={() => handleEdit(tableData)}
                                            style={{ cursor: "pointer" }}
                                        ></i>
                                    )
                                }
                            ]
                            : []}

                    />
                </>
                : ""
            }
            <div className="footer-dyamic-component">
                <div className='row'>
                    <Input
                        type="text"
                        className="form-control"
                        lable={t("Nurse Name")}
                        placeholder=""
                        name="nurseName"
                        id="NurseName"
                        value={payload?.nurseName}
                        respclass="col-xl-2 col-md-3 col-sm-4 col-12"
                        onChange={handleChange}
                    />
                    <DatePicker
                        className="custom-calendar"
                        placeholder={VITE_DATE_FORMAT}
                        lable={t("Date")}
                        respclass={"col-xl-2 col-md-3 col-sm-4 col-12"}
                        name="Date"
                        id="Date"
                        value={payload?.Date}
                        showTime
                        hourFormat="12"
                        handleChange={handleChange}
                    />
                </div>

                {isSave == 'true' ?
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={handleSaveCheckList}
                    >
                        {tableData?.length > 0? t("Update"): t("Save") }
                    </button>
                    : ""}
{/* 
                <button className="btn btn-sm btn-primary mx-2" onClick={handlePrint}>
                    {t("Print")}
                </button> */}
            </div>
        </div>
    )
}

export default ChecklistForRenalTransplant;