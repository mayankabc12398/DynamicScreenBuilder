import React, { useEffect, useState } from "react";
import ReactSelect from "../../formComponent/ReactSelect";
import { useTranslation } from "react-i18next";

const AllergyModal = ({
    editList = [],
    editData = null,
    inputData = {},
    handleSave,
}) => {
    const [t] = useTranslation();

    const [mode, setMode] = useState("Save"); 
    const [selectedAllergy, setSelectedAllergy] = useState(null);
    const [allergyName, setAllergyName] = useState("");


    useEffect(() => {
        if (mode === "Save") {
            setSelectedAllergy(null);
            setAllergyName("");
        }

        if (mode === "" && editData) {
            setSelectedAllergy(editData);
            setAllergyName(editData?.name || "");
        }
    }, [mode]);


    const makePayload = () => ({
        id: mode === "Save" ? 0 : selectedAllergy?.ID,
        name: allergyName,
        type: mode, // "add" or "edit"
        ...inputData,
    });

    useEffect(() => {
        handleSave.current = makePayload;
    }, [mode, selectedAllergy, allergyName]);
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
                    {t("Add Allergy")}
                </label>

                <label>
                    <input
                        type="radio"
                        checked={mode === ""}
                        onChange={() => setMode("")}
                    />{" "}
                    {t("Edit Allergy")}
                </label>
            </div>

            {/* ADD MODE */}
            {mode === "Save" && (
                <div className="row mb-3">
                    <label className="col-md-4">{t("Allergy Name :")}</label>
                    <div className="col-md-8">
                        <input
                            type="text"
                            className="form-control"
                            value={allergyName}
                            onChange={(e) => setAllergyName(e.target.value)}
                        />
                    </div>
                </div>
            )}


            {mode === "" && (
                <>
                    {/* Select Allergy */}
                    <div className="row mb-3">
                        <label className="col-md-4">{t("Select Allergy :")}</label>
                        <div className="col-md-8">
                            <ReactSelect
                                placeholderName="Select Allergy"
                                name="allergySelect"
                                value={selectedAllergy?.ID || ""}
                                handleChange={(name, value) => {
                                    debugger
                                    const found = editList.find((x) => x?.ID === Number(value?.value));
                                    setSelectedAllergy(found);
                                    setAllergyName(found?.label || "");
                                }}
                                dynamicOptions={editList.map((item) => ({
                                    label: item.AllergyName,
                                    value: item.ID
                                }))}
                                searchable={true}
                                id="allergySelect"
                                removeIsClearable={true}
                                respclass="col-xl-12 col-md-12 col-sm-12 col-12"
                            />
                        </div>
                    </div>

                    {/* Update name */}
                    {selectedAllergy && (
                        <div className="row mb-3">
                            <label className="col-md-4">{t("Allergy Name :")}</label>
                            <div className="col-md-8">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={allergyName}
                                    onChange={(e) => setAllergyName(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AllergyModal;
