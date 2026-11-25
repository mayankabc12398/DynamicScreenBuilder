import { useEffect, useMemo } from "react"
import Input from "../formComponent/Input"

const DynamicModal = ({ field, modalData, setModalData }) => {

    const parsePayloadSchema = (payloadString) => {
        if (!payloadString) return [];

        return payloadString.split("#").map((field) => {
            const clean = field.split("^")[0];

            let name, type, required;

            if (clean.includes("$$")) {
                const [fieldName, rest] = clean.split("$$");
                const parts = rest.split("$");
                name = fieldName;
                type = parts[0];
                required = parts[1] === "1";
            } else {
                const parts = clean.split("$");
                name = parts[0];
                type = parts[2];
                required = parts[3] === "1";
            }

            return { name, type, required };
        });
    };

    const parsedData = useMemo(() => {
        try {
            return field?.accordionName
                ? JSON.parse(field.accordionName)
                : null;
        } catch (e) {
            console.error("Invalid accordionName JSON", e);
            return null;
        }
    }, [field?.accordionName]);
    const handleModalDataChange = (name, value) => {
        setModalData((prev) => ({
            ...prev, [`modalData`]: {
                ...prev?.modalData, [name]: value
            }
        }))
    }

    const payloadSchema = useMemo(
        () => parsePayloadSchema(parsedData?.payload),
        [parsedData?.payload]
    );


    useEffect(() => {
        debugger
        setModalData((prev) => ({

            ...prev, [`modalData`]: {
                ...prev?.modalData, saveData: {
                    api: parsedData?.APIName,
                    method: parsedData?.method,
                    payload: parsedData?.payload
                }
            }
        }))
    }, [parsedData])


    return (
        <div>
            {
                parsedData?.controllerName?.map((item, index) => {
                    const fieldSchema = payloadSchema[index];
                    if (!fieldSchema) return null;

                    const { name, type, required } = fieldSchema;
                    console.log("modalDate", modalData)
                    debugger
                    return (
                        <Input
                            key={name}
                            id={name}
                            name={name}
                            type={type === "number" ? "number" : "text"}
                            className={`form-control ${required ? "required-fields" : ""}`}
                            value={modalData?.modalData?.[name] || ""}
                            lable={`Create ${name}`}
                            placeholder={""}
                            respclass="col-6"
                            onChange={(e) =>
                                handleModalDataChange(name, e.target.value)
                            }
                        />
                    );
                })
            }

        </div>
    )
}

export default DynamicModal