import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactSelect from "../../formComponent/ReactSelect";
import TextAreaInput from "../../formComponent/TextAreaInput";
import { notify } from "../../../utils/utils";
import {
  getRejectReasonOptionsApi,
  SaveSampleRejectReasonApi,
} from "../../../networkServices/SampleCollectionAPI";

export default function SampleCollectionRejectModel({
  handleChangeModel,
  inputData,
}) {
  const [t] = useTranslation();
  const [inputs, setInputs] = useState(inputData);
  const [reasons, setReasons] = useState([]);
  const [isInput, setIsInput] = useState(false);
  const [newReason, setNewReason] = useState("");

  useEffect(() => {
    handleChangeModel(inputs);
  }, [inputs]);

  const handleReactSelect = (name, e) => {
    if (e?.value === "Other") {
      // Dropdown me "Other" hi select rehna chahiye, warna select blank dikhta
      // hai aur neeche likha reason upar bind hota hua nazar nahi aata.
      setIsInput(true);
      setInputs((val) => ({ ...val, [name]: "Other", newReason: "" }));
    } else {
      setIsInput(false);
      setInputs((val) => ({ ...val, [name]: e?.value, newReason: "" }));
    }
  };

  const handleChange = (e) => {
    const typedReason = e.target.value;
    setInputs((prev) => ({
      ...prev,
      [e.target.name]: typedReason,
      // Other me jo type ho raha hai wahi upar wale dropdown me dikhe.
      rejectreason: typedReason?.trim() ? typedReason : "Other",
    }));
  };
  const handleGetReason = async () => {
    try {
      const response = await getRejectReasonOptionsApi();
      if (response?.success) {
        setReasons(response?.data);
      }
    } catch (error) {
      notify(t("Error fetching data"), "error");
    }
  };



  useEffect(() => {
    handleGetReason();
  }, []);

  return (
    <>
      <div className="d-flex align-items-baseline w-100">
        <div className="row p-2 w-100">
          <ReactSelect
            placeholderName={t("Select Reason . . .")}
            searchable={true}
            removeIsClearable={true}
            id="rejectreason"
            name="rejectreason"
            value={inputs?.rejectreason ? inputs?.rejectreason : ""}
            handleChange={handleReactSelect}
            respclass="w-100 "
            dynamicOptions={[
              ...(reasons?.map((item) => ({
                label: item?.Reasion,
                value: item?.Reasion,
              })) || []),
              {
                label: t("Other"),
                value: "Other",
              },
              // Other wala typed reason bhi option ki tarah rakha jata hai,
              // tabhi ReactSelect use upar select karke dikha paata hai.
              ...(isInput &&
              inputs?.newReason?.trim() &&
              !reasons?.some((item) => item?.Reasion === inputs?.newReason)
                ? [
                    {
                      label: inputs?.newReason,
                      value: inputs?.newReason,
                    },
                  ]
                : []),
              // A reason passed in (saved earlier, possibly typed under "Other") that is not in the
              // master list still has to be an option, or the dropdown shows blank.
              ...(!isInput &&
              inputs?.rejectreason &&
              inputs?.rejectreason !== "Other" &&
              !reasons?.some((item) => item?.Reasion === inputs?.rejectreason)
                ? [
                    {
                      label: inputs?.rejectreason,
                      value: inputs?.rejectreason,
                    },
                  ]
                : []),
            ]}
          />
          {isInput && (
            <div className="w-100">
              <TextAreaInput
                placeholder={t("Enter Reason . . .")}
                className="w-100 required-fields mt-2"
                id="newReason"
                rows={4}
                respclass="w-100"
                name="newReason"
                // value={newReason ? inputs?.newReason : ""}
                value={inputs?.newReason ? inputs?.newReason : ""}
                // onChange={(e) => setNewReason(e.target.value)}
                onChange={handleChange}
                maxLength={1000}
              />
              
              {/* <div className="d-flex justify-content-end">
                <button
                  className="btn btn-primary"
                  onClick={handleSaveRejectReason}
                >
                  {t("Add New")}
                </button>
              </div> */}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
