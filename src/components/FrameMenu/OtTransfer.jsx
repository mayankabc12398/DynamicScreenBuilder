import React, { useState } from "react";
import ReactSelect from "../formComponent/ReactSelect";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import { notify } from "../../utils/ustil2";
import { UpdateTransferAPI } from "../../networkServices/OT/otAPI";

const OtTransfer = () => {
  const [t] = useTranslation();
  const [payload, setPayload] = useState({
    id: "" || 0,
    sentBy: "",
    status: "",
  });

  const options = [{ value: "in", label: t("Shift To Ward") }];

  const handleSelectChange = (name, option) => {
    setPayload((prev) => ({
      ...prev,
      [name]: option?.value ?? "",
    }));
  };

  const handlesave = async () => {
    try {
      const response = await UpdateTransferAPI(payload);
      if (response?.success) {
        notify(response?.message, "success");
        setPayload({
          id: "",
          sentBy: "",
          status: "",
        });
      } else {
        notify(response?.message, "error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("Transfer to Ward")} isBreadcrumb={false} />
          <div className="row p-2">
            <ReactSelect
              placeholderName={t("Status ")}
              className="form-control"
              id={"status"}
              name={"status"}
              dynamicOptions={options}
              value={payload?.status}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              handleChange={handleSelectChange}
            />
            <button className="btn btn-sm btn-primary" onClick={handlesave}>
              {t("Transfer")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OtTransfer;
