import React, { useEffect, useState } from "react";
import Heading from "../../../components/UI/Heading";
import MultiSelectComp from "../../../components/formComponent/MultiSelectComp";
import { useTranslation } from "react-i18next";
import { notify } from "../../../utils/ustil2";
import { BindLabDeptAPI, SaveRoleToLabAPI } from "../../../networkServices/EDP/edpApi";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import { EDPGetRole } from "../../../networkServices/EDP/govindedp";
import { useLocalStorage } from "../../../utils/hooks/useLocalStorage";
const MapLabDept = () => {

    const [t] = useTranslation();

    const [values, setValues] = useState({
        mapLabDept: [],
    });
    console.log("values", values)

    const [dropDownState, setDropDownState] = useState([]);

    console.log("dro", dropDownState)



    const handleMultiSelectChange = (name, selectedOptions) => {

        setValues((prev) => ({
            ...prev,
            [name]: selectedOptions,
        }));
    };

    const handleReactSelect = (label, value) => {
        setValues((val) => ({ ...val, [label]: value }));
        if (label === "selectPriviledge") {
            setValues((val) => ({
                ...val,
                mapLabDept: []
            }))
        }
    };


    const bindMapLabDept = async () => {
        try {
            debugger
            const response = await BindLabDeptAPI(values?.selectPriviledge?.value);

            if (response?.success) {
                setDropDownState((val) => ({
                    ...val,
                    mapLabData: response?.data,
                }))

                const isExistData = response?.data?.filter((val) => val?.isExist == "1");

                if (isExistData?.length > 0) {
                    setValues((val) => ({
                        ...val,
                        mapLabDept: isExistData?.map((val) => ({
                            name: val?.NAME,
                            code: val?.ObservationType_ID
                        }))
                    }))
                }
            } else {
                setDropDownState((val) => ({
                    ...val,
                    mapLabData: [],
                }))
            }
        } catch (e) {
            notify(e.message, "error");
        }
    }
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

    const ip = useLocalStorage("ip", "get");

    const handleSave = async () => {
        try {
            debugger
            const payload = {

                labIdName: values?.mapLabDept?.map((val) => `${val?.code},${val?.name}`),
                roleID: values?.selectPriviledge?.value,
                roleName: values?.selectPriviledge?.label,
                ipAddress: ip
            }

            const response = await SaveRoleToLabAPI(payload);
            if (response?.success) {
                notify(response?.message, 'success');
                setValues((val) => ({
                    ...val,
                    mapLabDept: [],
                }))
                bindMapLabDept();
            } else {
                notify(response?.message, "error")
            }
        } catch (e) {
            notify(e.message, "error");
        }
    }
    useEffect(() => {
        if (values?.selectPriviledge?.value) {
            bindMapLabDept();

        }
    }, [values?.selectPriviledge?.value])

    useEffect(() => {
        PrivledgeResponse();
    }, []);

    return (
        <div className="card mt-2">
            <Heading title={t("Map Lab Department")} isBreadcrumb={true} />
            <div className="row p-2">
                <ReactSelect
                    placeholderName={t("Role")}
                    name="selectPriviledge"
                    value={values?.selectPriviledge?.value}
                    handleChange={(name, e) => handleReactSelect(name, e)}
                    dynamicOptions={dropDownState?.Priviledge}
                    removeIsClearable={true}
                    searchable={true}
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                />
                <MultiSelectComp
                    key={"mapLabDept"}
                    name={"mapLabDept"}
                    id="mapLabDept"
                    value={values?.mapLabDept || []}
                    handleChange={(name, option) =>
                        handleMultiSelectChange(name, option)
                    }
                    dynamicOptions={dropDownState?.mapLabData?.map((val) => ({
                        name: val?.NAME,
                        code: val?.ObservationType_ID,
                    }))}
                    respclass="col-xl-2 col-md-4 col-sm-4 col-12"
                    lable={t("Map Lab Dept")}
                    placeholderName={t("Map Lab Dept")}
                />
                <button className="btn btn-success" onClick={handleSave}>{t("Save")}</button>
            </div>
        </div>
    )
}


export default MapLabDept;
