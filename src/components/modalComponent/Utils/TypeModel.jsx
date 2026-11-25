import React, { useEffect, useState } from "react";
import ReactSelect from "../../formComponent/ReactSelect";
import { useTranslation } from "react-i18next";

const TypeModal = ({
    editList = [],
    editData = null,
    inputData = {},
    handleSave,
}) => {
    const [t] = useTranslation();

    const [mode, setMode] = useState("Save"); 
    const [selectedType, setSelectedType] = useState(null);
    const [typeName, setTypeName] = useState("");


    useEffect(() => {
        if (mode === "Save") {
            setSelectedType(null);
            setTypeName("");
        }

        if (mode === "" && editData) {
            setSelectedType(editData);
            setTypeName(editData?.name || "");
        }
    }, [mode]);


    const makePayload = () => ({
        id: mode === "Save" ? 0 : selectedType?.ID,
        name: typeName,
        type: mode, // "add" or "edit"
        ...inputData,
    });

    useEffect(() => {
        handleSave.current = makePayload;
    }, [mode, selectedType, typeName]);
console.log(editList);

    return (
        <div style={{ padding: 0 }}>

            {/* MODE SELECTOR */}
            <div className="mb-3">
                <label className="mr-2">
                    <input
                        className=""
                        type="radio"
                        checked={mode === "Save"}
                        onChange={() => setMode("Save")}
                    />{" "}
                    {t("Add Type")}
                </label>

                <label>
                    <input
                        type="radio"
                        checked={mode === ""}
                        onChange={() => setMode("")}
                    />{" "}
                    {t("Edit Type")}
                </label>
            </div>

            {mode === "Save" && (
                <div className="row mb-3">
                    <label className="col-md-4">{t("Type Name :")}</label>
                    <div className="col-md-8">
                        <input
                            type="text"
                            className="form-control"
                            value={typeName}
                            onChange={(e) => setTypeName(e.target.value)}
                        />
                    </div>
                </div>
            )}


            {mode === "" && (
                <>
                    
                    <div className="row mb-3">
                        <label className="col-md-4">{t("Select Type :")}</label>
                        <div className="col-md-8">
                            <ReactSelect
                                placeholderName="Select Type"
                                name="typeSelect"
                                value={selectedType?.ID || ""}
                                handleChange={(name, value) => {
                                    debugger
                                    const found = editList.find((x) => x?.ID === Number(value?.value));
                                    setSelectedType(found);
                                    setTypeName(found?.label || "");
                                }}
                                dynamicOptions={editList.map((item) => ({
                                    label: item.TypeName,
                                    value: item.ID
                                }))}
                                searchable={true}
                                id="typeSelect"
                                removeIsClearable={true}
                                respclass="col-xl-12 col-md-12 col-sm-12 col-12"
                            />
                        </div>
                    </div>

                    {/* Update name */}
                    {selectedType && (
                        <div className="row mb-3">
                            <label className="col-md-4">{t("Type Name :")}</label>
                            <div className="col-md-8">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={typeName}
                                    onChange={(e) => setTypeName(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TypeModal;
