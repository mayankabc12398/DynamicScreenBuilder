import React, { useEffect, useState } from 'react'
import Heading from '../UI/Heading';
import { useTranslation } from 'react-i18next';
import Input from '../formComponent/Input';
import FullTextEditor from '../../utils/TextEditor';
import { notify } from '../../utils/ustil2';
import { createNursingNotesApi, getNursingNote, deleteNursingNoteAPI } from '../../networkServices/nursingWardAPI';
import Tables from '../UI/customTable';
import { Checkbox } from '@profabric/react-components';

const NursingNote = (props) => {
    // useTranslation must precede anything that calls t(). The thead/THEAD array
    // below is built during render, so with the hook declared after it the const
    // was still in its temporal dead zone and the component threw
    // "Cannot access 't' before initialization" on mount.
    const { t } = useTranslation();

    const { patientID, ipdno, transactionID } = props?.data || {};
    const [values, setValues] = useState({
        isFinal: 0,
    })
    const [tableData, setTableData] = useState([]);

    const THEAD = [
        { name: t("S.No"), width: "10%", textAlign: "center" },
        { name: t("Subject"), width: "10%", textAlign: "left" },
        // { name: "Notes", width: "20%", textAlign: "left" },
        { name: t("Entry By"), width: "10%", textAlign: "left" },
        { name: t("Entry Date"), width: "10%", textAlign: "left" },
        { name: t("IPDNo"), width: "10%", textAlign: "left" },
        { name: t("Action"), width: "10%", textAlign: "center" },
    ];

    const [editorValue, setEditorValue] = useState(false);
    const [buttontype, setButtonType] = useState(false);
    const [Editable, setEditable] = useState(false)
    const handleChangeeditor = (value) => {
        setEditorValue(value);
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((val) => ({ ...val, [name]: value }));
    };
    const handleSaveNotes = async (e, type) => {

        const payload = {
            id: type === 'add' ? "0" : String(values?.id),
            patientID: String(patientID),
            transactionId: String(transactionID),
            notes: editorValue ? String(editorValue) : "",
            subject: values?.subject ? String(values?.subject) : "",
            ipdno: String(ipdno),
            FinalSave:values?.isFinal
        }
        try {
            const response = await createNursingNotesApi(payload)
            if (response?.success) {
                notify(response?.message, "success");
                handleBindDetails();
                setButtonType(false)
                setValues({})
                setEditorValue("")
            } else {
                notify(response?.message, "error")
                setEditorValue("")
            }
        } catch (error) {
            notify(error?.message, "error")
        }
    }
    const handleEditTable = (row) => {

        setValues({
            ...values,
            subject: row?.Subject,
            id: row?.Id,
            isFinal:row?.FinalSave
        })
        const updated = row?.Notes ?? '';
        setEditorValue(updated);
        setEditable(true)
        setButtonType(true)
    }
    const handleDelete = async (data) => {

        try {
            const payload = {
                ID: data?.Id
            }
            const response = await deleteNursingNoteAPI(payload)
            if (response?.success) {
                notify(response?.message, "success")
                handleBindDetails()
                setValues({})
                setEditorValue(false)
                setButtonType(false)
            } else {
                notify(response?.message, "error")
                setValues({})
                setEditorValue(false)
                setButtonType(false)
            }

        } catch (error) {
            notify(error?.message, "error")
        }
    }
    const handleTable = (tableData) => {
        return tableData?.map((item, index) => {
            return {
                Sno: <div className="text-center">{index + 1}</div>,
                subject: item?.Subject,
                // notes: item?.Notes,
                Entry: item?.EntryBy,
                EntryDate: item?.EntryDate,
                IPDNo: item?.IPDNo,
                Action: (
                    <div className="p-1">
                        {item?.CanEditView === 1 &&
                            <span className="mx-1" onClick={() => handleEditTable(item)}>
                                <i className="fa fa-edit" aria-hidden="true"></i>
                            </span>
                        }
                        <span
                            className="mx-1"
                            onClick={() =>
                                handleDelete(item)
                            }
                        >
                            <i className="fa fa-trash text-danger"></i>
                        </span>
                    </div>
                ),
            };
        });
    };
    const handleBindDetails = async () => {
        try {
            const response = await getNursingNote(transactionID, patientID);
            setTableData(response?.data);
        } catch (error) {
            console.log(error, "Something Went Wrong");
        }
    }
    const handleCheckboxChange = async (name, checked) => {
        debugger
        setValues({
            ...values,
            isFinal: checked ? 1 : 0
        })
        console.log(values);

    }
    useEffect(() => {
        handleBindDetails()
    }, [])
    return (
        <div className='mt-2 spatient_registration_card'>
            <div className='patient_registration card'>

                <Heading title={t("Nursing Notes")} isBreadcrumb={false} />
                <div className='p-2'>
                    <div className='d-flex justify-content-between flex-wrap'>

                        <Input
                            type="text"
                            className="form-control "
                            id="subject"
                            name="subject"
                            value={values?.subject ? values?.subject : ""}
                            onChange={handleChange}
                            lable={t("subject")}
                            respclass="col-xl-2 col-md-4 col-sm-6 col-12"
                            placeholder=" "

                        />
                        <div className='col-xl-2 col-md-4 col-sm-6 col-12 p-2 d-sm-block d-none'>
                            <div className='d-flex g-5'>
                                <span >
                                    <label
                                        className="d-flex align-items-center mr-3"
                                        style={{ cursor: "pointer" }}
                                    >
                                        <Checkbox
                                            id="isFinal"
                                            className="mt-2 mr-1"
                                            name="isFinal"
                                            onChange={(e) =>
                                                handleCheckboxChange(e.target.name, e.target.checked)
                                            }
                                            disabled={values?.isFinal}
                                            checked={values?.isFinal}
                                        />
                                        {t("is Final")}
                                    </label>
                                </span>
                                {buttontype ?
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={(e) => handleSaveNotes(e, "edit")}
                                    >
                                        {t("Update")}
                                    </button>
                                    :
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={(e) => handleSaveNotes(e, "add")}
                                    >

                                        {t("Save")}
                                    </button>
                                }

                            </div>
                        </div>
                    </div>

                    <div className='col-sm-12'>

                        <FullTextEditor
                            value={editorValue}
                            // value={getTest}
                            setValue={handleChangeeditor}
                            EditTable={Editable}
                            setEditTable={setEditable}
                        />
                    </div>

                    <div className='col-xl-2 col-md-4 col-sm-6 col-12 p-2  d-sm-none'>
                        <div className='d-flex '>
                            <span >
                                <label
                                    className="d-flex align-items-center mr-3"
                                    style={{ cursor: "pointer" }}
                                >
                                    <Checkbox
                                        id="isFinal"
                                        className="mt-2 mr-1"
                                        name="isFinal"
                                        onChange={(e) =>
                                            handleCheckboxChange(e.target.name, e.target.checked)
                                        }
                                        disabled={values?.isFinal}
                                        checked={values?.isFinal}
                                    />
                                    {t("is Final")}
                                </label>
                            </span>
                            {buttontype ?
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={(e) => handleSaveNotes(e, "edit")}                            >
                                    {t("Update")}
                                </button>
                                :
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={(e) => handleSaveNotes(e, "add")}
                                >

                                    {t("Save")}
                                </button>

                            }
                        </div>

                    </div>

                </div>
                {tableData.length > 0 &&
                    <div className='patient_registration card'>
                        <Heading title={t("Nursing Notes List")} isBreadcrumb={false} />
                        <Tables thead={THEAD} tbody={handleTable(tableData)} />
                    </div>
                }

            </div>
        </div>
    )
}

export default NursingNote;