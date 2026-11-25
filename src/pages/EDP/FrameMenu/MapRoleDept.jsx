import React, { useEffect, useState } from "react";
import Heading from "../../../components/UI/Heading";
import { useTranslation } from "react-i18next";
import { BindDepartmentBelong, EDPGetRole } from "../../../networkServices/EDP/govindedp";
import { notify } from "../../../utils/ustil2";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import MultiSelectComp from "../../../components/formComponent/MultiSelectComp";
import { SaveMapRoleToLabAPI } from "../../../networkServices/EDP/edpApi";

const MapRoleDept = () => {
    const [t] = useTranslation();
    const [values, setValues] = useState({});
    const [dropDownState, setDropDownState] = useState([]);

    const PrivledgeResponse = async () => {
        const response = await EDPGetRole();
        setDropDownState({
            ...dropDownState,
            Priviledge: response?.map((val) => ({
                label: val?.RoleName,
                value: val?.ID
            })),
        });
    };


    const BindDepartmentBelongData = async (role) => {
        try {
            const response = await BindDepartmentBelong(role);
            if (response?.success) {
                setDropDownState((val) => ({
                    ...val,
                    DeptBelong: response?.data?.map((val) => ({
                        name: val?.DeptBelong,
                        code: val?.DeptBelongID,
                    })),
                }))
                const filteredData = response?.data?.filter((val) => val?.IsMaped == "1");

                if (filteredData?.length > 0) {
                    setValues((val) => ({
                        ...val,
                        MapRoleDept: filteredData?.map((val) => ({
                            name: val?.DeptBelong,
                            code: val?.DeptBelongID,
                        })),
                    }))
                }
            } else {
                setDropDownState((val) => ({
                    ...val,
                    DeptBelong: [],
                }))
            }
        } catch (e) {
            notify(e?.message, "error");
        }
    }

    const handleReactSelect = (name, value) => {
        setValues((val) => ({
            ...val,
            [name]: value
        }))
        if (name === "role") {
            setValues((val) => ({
                ...val,
                MapRoleDept: []
            }))
        }
    }


    const handleSave = async () => {
        try {
            const payload = {
                DeptBelong: values?.MapRoleDept?.map((val) => `${val?.code}`),
                RoleID: values?.role?.value
            }

            const response = await SaveMapRoleToLabAPI(payload);
            if (response?.success) {
                notify(response?.message, "success");
                BindDepartmentBelongData(values?.role?.value)
            } else {
                notify(response?.message, "error");
            }
        } catch (e) {
            notify(e.message, "error");
        }
    }

    const handleMultiSelectChange = (name, selectedOptions) => {

        setValues((prev) => ({
            ...prev,
            [name]: selectedOptions,
        }));
    };

    useEffect(() => {
        if (values?.role?.value) {
            BindDepartmentBelongData(values?.role?.value);
        }
    }, [values?.role?.value])

    useEffect(() => {
        PrivledgeResponse();
    }, []);
    return (
        <div className="card mt-2">
            <Heading title={t("Map Role To Department")} isBreadcrumb={true} />
            <div className="row p-2">
                <ReactSelect
                    placeholderName={t("Role")}
                    name="role"
                    value={values?.role?.value}
                    handleChange={(name, e) => handleReactSelect(name, e)}
                    dynamicOptions={dropDownState?.Priviledge}
                    removeIsClearable={true}
                    searchable={true}
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                />
                <MultiSelectComp
                    key={"MapRoleDept"}
                    name={"MapRoleDept"}
                    id="MapRoleDept"
                    value={values?.MapRoleDept || []}
                    handleChange={(name, option) =>
                        handleMultiSelectChange(name, option)
                    }
                    dynamicOptions={dropDownState?.DeptBelong}
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    lable={t("Map Role Dept.")}
                    placeholderName={t("Map Role Dept.")}
                />
                <button className="btn btn-success" onClick={handleSave}>{t("Save")}</button>
            </div>
        </div>
    )
}
export default MapRoleDept;