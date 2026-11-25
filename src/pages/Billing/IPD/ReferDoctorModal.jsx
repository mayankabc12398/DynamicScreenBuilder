import React, { useEffect } from 'react'
import ReactSelect from '../../../components/formComponent/ReactSelect'
import i18next from "i18next";
const t = (key, options) => i18next.t(key, options);
import Input from '../../../components/formComponent/Input'
import TextAreaInput from '../../../components/formComponent/TextAreaInput'
import { DeleteDoctorReferal, BindReferDoctorforEdit, UpdateReferDoctor } from '../../../networkServices/DoctorApi'
import { notify } from '../../../utils/utils'
import { GetBindReferDoctor } from '../../../store/reducers/common/CommonExportFunction'
import Heading from '../../../components/UI/Heading'
import { useDispatch } from 'react-redux'

const ReferDoctorModal = ({ isProName, setModalData, DropDownState }) => {
    const dispatch = useDispatch();
    const [doctorList, setDoctorList] = React.useState([]);
    const [nextDoctorCode, setNextDoctorCode] = React.useState(1);
    const [isEdit, setIsEdit] = React.useState(false);
    const [editId, setEditId] = React.useState(null);
    const [editDoctorCode, setEditDoctorCode] = React.useState("");
    const [values, setValues] = React.useState({
        title: { label: "", value: "" },
        name: '',
        contactNo: '',
        proName: { label: "", value: "" },
        address: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "contactNo" && value?.length > 15) {
            return
        }

        setValues((prevValues) => ({
            ...prevValues,
            [name]: value
        }));
    }

    const handleReactSelectChange = (name, value) => {
        setValues((prevValues) => ({
            ...prevValues,
            [name]: value
        }));
    }

    useEffect(() => {
        setModalData({ ...values, nextDoctorCode });
    }, [values, nextDoctorCode]);

    const fetchDoctorList = async () => {
        try {
            const resp = await BindReferDoctorforEdit();
            if (resp?.success) {
                setDoctorList(Array.isArray(resp?.data) ? resp.data : []);
                setNextDoctorCode(resp?.nextCode || 1);
            }
        } catch (error) {
            console.log(error?.message)
        }
    }

    useEffect(() => {
        fetchDoctorList();
    }, []);

    useEffect(() => {
        const saveBtn = document.querySelector('.refer-doctor-modal-container')?.closest('.p-dialog')?.querySelector('.ftr_btn button:first-child');
        if (saveBtn) {
            saveBtn.style.display = isEdit ? 'none' : 'inline-block';
        }
        return () => {
            if (saveBtn) {
                saveBtn.style.display = 'inline-block';
            }
        };
    }, [isEdit]);

    const handleEdit = (item) => {
        setValues({
            title: item?.Title ? { label: item?.Title, value: item?.Title } : { label: "", value: "" },
            name: item?.NAME || "",
            contactNo: item?.Mobile || "",
            proName: item?.proID ? { label: item?.ProName || "", value: item?.proID } : { label: "", value: "" },
            address: item?.House_No || ""
        });
        setEditDoctorCode(item?.DoctorCode || item?.DoctorID || "");
        setIsEdit(true);
        setEditId(item?.IPDDoctorReferal_ID || item?.DoctorID);
    };

    const handleUpdate = async () => {
        if (!values?.name || values?.name.trim() === "") {
            notify("Name is required", "error");
            return;
        }

        const payload = {
            doctorID: editId,
            title: values?.title?.value,
            doctorName: values?.name,
            mobile: values?.contactNo,
            address: values?.address,
        };

        try {
            const resp = await UpdateReferDoctor(payload);
            if (resp?.success) {
                notify(resp?.message, "success");
                fetchDoctorList();
                dispatch(GetBindReferDoctor());
                setValues({
                    title: { label: "", value: "" },
                    name: '',
                    contactNo: '',
                    proName: { label: "", value: "" },
                    address: ''
                });
                setIsEdit(false);
                setEditId(null);
            } else {
                notify(resp?.error || resp?.message || "Error updating refer doctor", "error");
            }
        } catch (error) {
            console.error("Error updating refer doctor:", error);
        }
    };

    const handleDelete = async (id) => {
        const payload = { id: id }
        try {
            const resp = await DeleteDoctorReferal(payload);
            if (resp?.success) {
                notify(resp?.message, "success");
                fetchDoctorList();
                dispatch(GetBindReferDoctor());
                const closeBtn = document.querySelector('.refer-doctor-modal-container')?.closest('.p-dialog')?.querySelector('.p-dialog-header-close');
                if (closeBtn) {
                    closeBtn.click();
                } else {
                    document.querySelector('.p-dialog-header-close')?.click();
                }
            } else {
                notify(resp?.error || resp?.message || "Error deleting refer doctor", "error");
            }
        } catch (error) {
            console.error("Error Found", error);
        }
    }

    return (
        <div className="refer-doctor-modal-container">
            {isProName ? (
                <div className="row">
                    <div className="d-flex justify-content-start align-items-center col-xl-12 col-md-12 col-sm-12 col-12">
                        <Input
                            type="text"
                            className="form-control required-fields"
                            removeFormGroupClass={false}
                            name="name"
                            lable={t("Name")}
                            required={true}
                            onChange={handleInputChange}
                            value={values?.name}
                            respclass="col-xl-12 col-md-12 col-sm-12 col-12"
                        />
                    </div>
                </div>
            ) : (
                <>
                    <div className="row">
                        <div className="d-flex justify-content-start align-items-center col-xl-12 col-md-12 col-sm-12 col-12">
                            <ReactSelect
                                placeholderName={t("Title")}
                                searchable={true}
                                name={"title"}
                                respclass="col-xl-3 col-md-3 col-sm-6 col-3"
                                dynamicOptions={[
                                    { label: t("Mr."), value: "Mr." },
                                    { label: t("Dr."), value: "Dr." },
                                    { label: t("Prof Dr."), value: "Prof Dr." },
                                ]}
                                handleChange={handleReactSelectChange}
                                value={values?.title?.value}
                                removeIsClearable={false}
                            />
                            <Input
                                type="text"
                                className="form-control"
                                placeholder={" "}
                                removeFormGroupClass={false}
                                name="doctorCode"
                                lable={t("Doctor Code")}
                                disabled={true}
                                value={isEdit ? (editDoctorCode || "") : nextDoctorCode}
                                respclass="col-xl-3 col-md-3 col-sm-6 col-3"
                                style={{ backgroundColor: "#f0f9f6", cursor: "not-allowed" }}
                            />
                            <Input
                                type="text"
                                className="form-control required-fields"
                                placeholder={" "}
                                removeFormGroupClass={false}
                                name="name"
                                lable={t("Name")}
                                required={true}
                                onChange={handleInputChange}
                                value={values?.name}
                                respclass="col-xl-6 col-md-6 col-sm-12"
                            />
                        </div>
                        <div className="d-flex justify-content-start align-items-center col-xl-12 col-md-12 col-sm-12 col-12">
                            <Input
                                type="Number"
                                className="form-control"
                                removeFormGroupClass={false}
                                name="contactNo"
                                lable={t("Contact No.")}
                                required={true}
                                onChange={handleInputChange}
                                value={values?.contactNo}
                                respclass="col-xl-6 col-md-6 col-sm-12"
                                placeholder={" "}
                            />
                            <ReactSelect
                                placeholderName={t("Pro Name")}
                                searchable={true}
                                name={"proName"}
                                respclass="col-xl-6 col-md-6 col-sm-12"
                                dynamicOptions={DropDownState?.getBindProList}
                                handleChange={handleReactSelectChange}
                                value={values?.proName}
                                removeIsClearable={false}
                            />
                        </div>
                        <div className="d-flex justify-content-start align-items-center col-xl-12 col-md-12 col-sm-12 col-12">
                            <TextAreaInput
                                type="text"
                                className="form-control min-h-70"
                                placeholder={" "}
                                removeFormGroupClass={false}
                                name="address"
                                lable={t("Address")}
                                required={true}
                                onChange={handleInputChange}
                                value={values?.address}
                                respclass="col-xl-12 col-md-12 col-sm-12 col-12 "
                            />
                        </div>
                        {isEdit && (
                            <div className="d-flex justify-content-end col-xl-12 col-md-12 col-sm-12 col-12 mt-2">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-primary me-2"
                                    onClick={handleUpdate}
                                >
                                    {t("Update")}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => {
                                        setValues({
                                            title: { label: "", value: "" },
                                            name: '',
                                            contactNo: '',
                                            proName: { label: "", value: "" },
                                            address: ''
                                        });
                                        setIsEdit(false);
                                        setEditId(null);
                                    }}
                                >
                                    {t("Cancel")}
                                </button>
                            </div>
                        )}
                    </div>
                    {doctorList?.length > 0 && (
                        <div className="row mt-2">
                            <div className="col-12">
                                <Heading title={t("Doctor List")} isBreadcrumb={false} />
                                <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                                    <table className="table table-bordered table-sm table-hover mainTable" style={{ fontSize: "0.82rem" }}>
                                        <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                                            <tr>
                                                <th style={{ width: "4%" }}>#</th>
                                                <th style={{ width: "8%" }}>{t("Title")}</th>
                                                <th style={{ width: "12%" }}>{t("Doctor Code")}</th>
                                                <th style={{ width: "28%" }}>{t("Doctor Name")}</th>
                                                <th style={{ width: "18%" }}>{t("Contact No.")}</th>
                                                <th style={{ width: "22%" }}>{t("Address")}</th>
                                                <th style={{ width: "8%" }}>{t("Action")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {doctorList.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>{item?.Title}</td>
                                                    <td><b style={{ color: "#16a085" }}>{item?.DoctorCode}</b></td>
                                                    <td>{item?.NAME}</td>
                                                    <td>{item?.Mobile}</td>
                                                    <td>{item?.House_No}</td>
                                                    <td>
                                                        <button className="btn btn-sm btn-success me-1" onClick={() => handleEdit(item)} title={t("Edit")}>
                                                            <i className="fas fa-edit" />
                                                        </button>
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item?.DoctorID)} title={t("Delete")}>
                                                            <i className="fas fa-trash" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default ReferDoctorModal
