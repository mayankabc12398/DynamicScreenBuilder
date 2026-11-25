import Tables from "..";
import { ROUNDOFF_VALUE } from "../../../../utils/constant";
import Input from "../../../formComponent/Input";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
// Component code...

const SurgeryDepartmentDetailsTable = ({
  THEAD,
  tbody,
  handleIndexChange,
  handleDelete,
  payload,
  auth
}) => {
  const [t] = useTranslation();
  const { GetGlobalResources } = useSelector((state) => state?.CommonSlice);

  // Same switch the IPD services grid uses - with an active IsCptCodeEditable
  // row in fin_global_resources the CPT Code column can be typed into.
  const isCptCodeEditable =
    Array.isArray(GetGlobalResources) &&
    GetGlobalResources?.find((item) => item?.Name === "IsCptCodeEditable")
      ?.Value === "1";
  const getRate = (item) =>
    payload?.RateOn?.value === "2"
      ? Number(item?.SurgeonCharge ?? item?.surgeonCharge ?? 0)
      : Number(item?.DocCharge ?? item?.docCharge ?? 0);
  const calculateNewRate = (item) => {
    if (item?.NewRate !== undefined && item?.NewRate !== null && item?.NewRate !== "") {
      return Number(item?.NewRate).toFixed(ROUNDOFF_VALUE);
    }

    const rate = getRate(item);
    const reduce = Number(item?.Reduce ?? 0);

    if (reduce === 0) return rate.toFixed(ROUNDOFF_VALUE);
    return ((rate * reduce) / 100).toFixed(ROUNDOFF_VALUE);
  };
  // console.log(auth, "auth");
  // console.log("firstpayload?.RateOn?.value", payload?.RateOn?.value)
  return (
    <div style={{ width: "100%" }}>
      <Tables
        thead={THEAD}
        tbody={tbody?.map((item, index) => {
          return {
            "SNo,": index + 1,
            // SurgeryCode is the surgery's own code from f_surgery_master and is
            // what SaveSurgery posts as surgeryCode - rateListID was the rate row's
            // id and never reached the bill.
            "CPT Code": isCptCodeEditable ? (
              <Input
                className="table-input"
                name="SurgeryCode"
                removeFormGroupClass={true}
                type="text"
                maxLength={"50"}
                onChange={(e) =>
                  handleIndexChange(index, "SurgeryCode", e.target.value, item)
                }
                value={item?.SurgeryCode ?? ""}
              />
            ) : (
              item?.SurgeryCode
            ),
            "Surgery Name  ": item?.SurgeryName,
            Department: item?.Department,
            Remarks: (
              <Input
                className="table-input"
                name="Remarks"
                removeFormGroupClass={true}
                type="text"
                onChange={(e) =>
                  handleIndexChange(index, "Remarks", e.target.value, item)
                }
                value={item?.Remarks}
              />
            ),

            //   Rate: (
            //    payload?.RateOn?.value === "2" ?
            //  <Input
            //  disabled={true}
            //       className="table-input"
            //       name="SurgeonCharge"
            //       removeFormGroupClass={true}
            //       type="number"
            //       onChange={(e) =>
            //         handleIndexChange(
            //           index,
            //           "SurgeonCharge",
            //           e.target.value,
            //           item
            //         )
            //       }
            //       // value={payload?.RateOn?.value === "2" ? item?.SurgeonCharge : item?.DocCharge}  
            //       value={item?.SurgeonCharge}
            //     />
            // //  <Input
            // //       className="table-input"
            // //       name="surgeonCharge"
            // //       removeFormGroupClass={true}
            // //       type="number"
            // //       onChange={(e) =>
            // //         handleIndexChange(
            // //           index,
            // //           "surgeonCharge",
            // //           e.target.value,
            // //           item
            // //         )
            // //       }
            // //       // value={payload?.RateOn?.value === "2" ? item?.SurgeonCharge : item?.DocCharge}  
            // //       value={item?.surgeonCharge}
            // //     />
            //      :
            //       <Input
            //         disabled={true}
            //       className="table-input"
            //       name="DocCharge"
            //       removeFormGroupClass={true}
            //       type="number"
            //       onChange={(e) =>
            //         handleIndexChange(
            //           index,
            //           "DocCharge",
            //           e.target.value,
            //           item
            //         )
            //       }
            //       value={item?.DocCharge}
            //       // value={item?.surgeonCharge}
            //     />

            //   ),
            Rate: (
              (() => {
                const isRateEditable = auth?.IsRate === 1 === 1 && (item?.SurgeonCharge === 0 || item?.SurgeonCharge === null);
                // const isRateEditable = item?.SurgeonCharge === 0;

                console.log("Editable", isRateEditable)
                return payload?.RateOn?.value === "2" ? (
                  <Input
                    disabled={isRateEditable}
                    className="table-input"
                    name="SurgeonCharge"
                    removeFormGroupClass={true}
                    type="number"
                    onChange={(e) =>
                      handleIndexChange(
                        index,
                        "SurgeonCharge",
                        e.target.value,
                        item
                      )
                    }
                    value={item?.SurgeonCharge ?? item?.surgeonCharge}
                  />
                ) : (
                  <Input
                    disabled={isRateEditable}
                    className="table-input"
                    name="DocCharge"
                    removeFormGroupClass={true}
                    type="number"
                    onChange={(e) =>
                      handleIndexChange(
                        index,
                        "DocCharge",
                        e.target.value,
                        item
                      )
                    }
                    value={item?.DocCharge ?? item?.docCharge}
                  />
                );
              })()
            ),


            "Reduce(%)": (
              <Input
                disabled={true}
                className="table-input"
                removeFormGroupClass={true}
                name="Reduce"
                type="number"
                onChange={(e) =>
                  handleIndexChange(index, "Reduce", e.target.value, item)
                }
                value={item?.Reduce}
              />
            ),
            "New Rate": (
              <Input
                disabled={true}
                className="table-input"
                removeFormGroupClass={true}
                name="NewRate"
                type="number"
                value={calculateNewRate(item)}
              />
            ),

            Remove: (
              <button
                onClick={() => handleDelete(item, index)}
                className="btn btn-sm btn-danger"
              >
                {t("Delete")}
              </button>
            ),
          };
        })}
        tableHeight={"tableHeight"}
        style={{ maxHeight: "120px" }}
      />
    </div>
  );
};

export default SurgeryDepartmentDetailsTable;
