import React, { useEffect, useState } from 'react'
import Input from '../../../components/formComponent/Input'
import { useTranslation } from 'react-i18next';
import ReactSelect from '../../../components/formComponent/ReactSelect';
import Tables from '../../../components/UI/customTable';
import { EDPPanelSetUpSaveServiceReduceDetails, getBindReduceitemdetails } from '../../../networkServices/EDP/edpApi';
import { handleReactSelectDropDownOptions } from '../../../utils/utils';
import { notify } from '../../../utils/ustil2';
import { useLocalStorage } from '../../../utils/hooks/useLocalStorage';

export default function ReduceServiceModal({ data, setModalData }) {
    const initialValues = { ReduceType: { value: "0" } };
    const [values, setValues] = useState(initialValues);
    const tableData = [
        { ServiceName: "Surgery", SequenceNo: "1", Reduce_per: "", Remarks: "" },
        { ServiceName: "Surgery", SequenceNo: "2", Reduce_per: "", Remarks: "" },
        { ServiceName: "Surgery", SequenceNo: "3", Reduce_per: "", Remarks: "" },
        { ServiceName: "Surgery", SequenceNo: "4", Reduce_per: "", Remarks: "" },
    ];
    const [bodyData, setBodyData] = useState(tableData);
    console.log("bodyData", bodyData)

    const [t] = useTranslation();

    const thead = [
        t("S.No."),
        t("Reduce Type"),
        t("Sequnce Type"),
        t("Reduce Per"),
        t("Remarks"),
    ];

    const handleSelect = async (name, value) => {
        let apiResp = await getBindReduceitemdetails(value?.label, data?.PanelID)
        if (apiResp?.success) {
            setBodyData(apiResp?.data)
        }
        setValues((val) => ({
            ...val,
            [name]: value,
        }));
    }



    const handleCustomInput = (index, name, value, type, max = 9999999999999) => {
        if (type === "number") {
            if (!isNaN(value) && Number(value) <= max) {
                const data = JSON.parse(JSON.stringify(bodyData));
                data[index][name] = value;
                setBodyData(data);
            }
        } else {
            const data = JSON.parse(JSON.stringify(bodyData));
            data[index][name] = value;
            setBodyData(data);
        }
    }

    const handleSave = async () => {
        const ip = useLocalStorage("ip", "get");

        // const filteredData = bodyData?.filter((ele) => ele?.Reduce_per?.length > 0)
        // if (filteredData?.length === 0) {
        //     notify("Please enter reduce percentage", "error");
        //     return
        // }
        const payload = {
            "serviceReduces": bodyData?.map((ele, index) => ({
                "reduceType": "Surgery",
                "reudceSequnce": ele?.SequenceNo,
                "reduceper": ele?.Reduce_per ? ele?.Reduce_per : "",
                "remarks": ele?.Remarks ? ele?.Remarks : "",
                "ipAddress": ip,
            })),
            "panelID": data?.PanelID
        }

        const response = await EDPPanelSetUpSaveServiceReduceDetails(payload);
        if (response?.success) {
            notify(response?.message, "success");
            setModalData({ visible: false })
        } else {
            notify(response?.message, "error");
        }
    }

    return (
        <>
            <ReactSelect
                placeholderName={t("Reduce Type")}
                searchable={true}
                removeIsClearable={true}
                respclass="w-50"
                dynamicOptions={[{ label: t("Select"), value: "0" }, { label: t("Surgery"), value: "1" }]}
                handleChange={handleSelect}
                value={`${values?.ReduceType?.value}`}
                name={"ReduceType"}
            />

            <div>
                <Tables thead={thead}
                    tbody={bodyData?.map((ele, index) => ({
                        SNo: index + 1,
                        ItemName: <div style={{ whiteSpace: "normal", width: "100%" }}>{ele?.ServiceName}</div>,
                        SequenceNo: ele?.SequenceNo,
                        Reduce_per: <Input
                            type="number"
                            className="table-input"
                            respclass={"w-100"}
                            removeFormGroupClass={true}
                            name={"Reduce_per	"}
                            value={ele?.Reduce_per ? String(ele?.Reduce_per) : "0"}
                            onChange={(e) => { handleCustomInput(index, "Reduce_per", e.target.value, "number", 100) }}
                        />,
                        Remarks: <Input
                            type="text"
                            className="table-input"
                            respclass={"w-100"}
                            removeFormGroupClass={true}
                            name={"Remarks"}
                            value={ele?.Remarks ? String(ele?.Remarks) : "0"}
                            onChange={(e) => { handleCustomInput(index, "Remarks", e.target.value, "text") }}
                        />,
                    }))}
                /></div>
            <div className='d-flex justify-content-end mt-2' style={{ gap: "2px" }}>
                <button className='btn btn-success' onClick={handleSave}>{t("Save")}</button>
                <button className='btn btn-success' onClick={() => setModalData({ visible: false })}> {t("Cancel")}</button>
            </div>
        </>
    )
}
