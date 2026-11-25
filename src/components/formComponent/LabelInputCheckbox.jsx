import { Tooltip } from "primereact/tooltip";
import React from "react";

function LabeledInput({ isChecked, name, label, value, relation, recontactNo, className, style = {}, setCheclBoxValue }) {
    const isMobile = window.innerWidth <= 768;
    const handlechange = (e) => {
        const { name, checked} = e?.target

        setCheclBoxValue(name, checked)
    }
    const renderValue =  (value) => {
            if (value?.length > 27) {
                return (
                    <>
                        <Tooltip
                            target={`#labelInput-${label.replace(/[^A-Za-z0-9]+/g, "")}`}
                            position="top"
                            content={value}
                            event="hover"
                        />
                        <div className="labelPicker">{label}</div>
                        <div
                            className="valueName"
                            id={`labelInput-${label.replace(/[^A-Za-z0-9]+/g, "")}`}
                        >
                            {value.substring(0, 27) + "..."}
                        </div>
                    </>
                );
            } else {
                return (
                    <div className={`${isMobile ? "mb-2" : "mb-2"}`}>
                        <div className="labelPicker">{label}</div>
                        <div className={`valueName`} style={style} onClick={()=>{setCheclBoxValue("name", !isChecked)}}>
                            <span className="" style={{ paddingLeft: "24px" }}> {`${value} (${relation}) - ${recontactNo} `}  </span>
                        </div>
                    </div>
                );
            }
        }
        // [value,isChecked]
 

    return (

        <div className={`${className}`} >
            {renderValue(value)}
            <input type="checkbox"
                id={name}
                name={name}
                checked={isChecked}
                className="table-checkbox"
                style={{ position: "absolute", top: "6px", left: "13px" }}
                onChange={handlechange}
            />
        </div>
    );
}

export default LabeledInput;
