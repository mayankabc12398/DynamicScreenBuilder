import React, { useEffect } from "react";
import Tables from "..";
import Input from "../../../formComponent/Input";
import CustomSelect from "../../../formComponent/CustomSelect";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { GetBindAllDoctorConfirmation } from "../../../../store/reducers/common/CommonExportFunction";
import { AMOUNT_REGX, ROUNDOFF_VALUE } from "../../../../utils/constant";

// Charge types with no doctor to attribute - the Doctor dropdown stays
// blank on these rows the same way it already does for Type_ID === 3.
const NO_DOCTOR_TYPES = [
  "OT CHARGES",
  "OT GASES",
  "ANESTHESIA (MEDICINES) CHARGES",
  "INSTRUMENT CHARGES",
];

const SurgeryDetailsTable = ({
  THEAD,
  tbody,
  handleCustomSelect,
  handleItemsChange,
  handleSelect,
  payload
}) => {
  console.log("payld", payload)
  const isAmountSelected = payload?.CalculateOn?.value === "1";
  const isPercentSelected = payload?.CalculateOn?.value === "2";

  const isCharge = isPercentSelected ? true : false;
   const isChargeAmt = isAmountSelected ? true : false;

  const dispatch = useDispatch();
  const { GetBindAllDoctorConfirmationData } = useSelector(
    (state) => state.CommonSlice
  );

  useEffect(() => {
    dispatch(
      GetBindAllDoctorConfirmation({
        Department: "All",
      })
    );
  }, [dispatch]);
  return (
    <>
      <Tables
        thead={THEAD}
        tbody={tbody?.map((item, index) => {
          // debugger
          return {
            Select: (
              <input
                type="checkbox"
                name="IsChecked"
                className="table-checkbox"
                checked={item.IsChecked}
                onChange={(e) => handleSelect(e, index, item)}
              />
            ),
            "SNo,": index + 1,
            Type: item?.TYPE,
            Doctor:
              item?.Type_ID === 3 ||
              NO_DOCTOR_TYPES.includes(String(item?.TYPE || "").trim().toUpperCase()) ? (
                ""
              ) : (
                <>
                  <CustomSelect
                    option={[
                      ...GetBindAllDoctorConfirmationData.map((item) => {
                        return {
                          label: item?.Name,
                          value: item?.DoctorID,
                        };
                      }),
                    ]}
                    placeHolder="Select Doctor"
                    value={item?.SurgeryDoctorId}
                     requiredClassName="required-fields"
                    onChange={(name, e) => handleCustomSelect(index, name, e)}
                    name="SurgeryDoctorId"
                    isDisable={!item?.IsChecked}
                  />
                  {console.log("item?.Doctor", item)}
                </>
              ),

            /* Surgery rate ka guna - 0.5 par aadha, 1 par poora. Amount mode me
               charge user khud bharta hai, isliye wahan Quantity disabled rehti hai
               (Charges (%) ki tarah hi). */
            Quantity: (
              <Input
                className="table-input"
                name="Quantity"
                removeFormGroupClass={true}
                /* type="number" yahan kaam nahi karta: Input ka onInput har keystroke
                   par sanitized value DOM me wapas likhta hai, aur number input adhoore
                   "0." ko "" bana deta hai - yaani decimal point type hote hi mit jaata
                   hai. Isliye baaki amount fields ki tarah text + AMOUNT_REGX. */
                type="text"
                display="right"
                onChange={(e) => {
                  if (!AMOUNT_REGX(4).test(e.target.value)) return;
                  handleItemsChange(index, "Quantity", e.target.value, item);
                }}
                value={item?.Quantity ?? ""}
                disabled={isChargeAmt || !item?.IsChecked}
              />
            ),

            // "Charges (%)": (
            //   <Input
            //     className="table-input"
            //     name="DoctorChargePer"
            //     removeFormGroupClass={true}
            //     type="number"
            //     onChange={(e) =>
            //       handleItemsChange(
            //         index,
            //         "DoctorChargePer",
            //         e.target.value,
            //         item
            //       )
            //     }
            //     value={item?.DoctorChargePer}
            //     disabled={item?.IsChecked == true ? false : true}
            //   />
            // ),
            "Charges (%)": (
              <Input
                className="table-input"
                name="DoctorChargePer"
                removeFormGroupClass={true}
                type="number"
                onChange={(e) =>
                  handleItemsChange(
                    index,
                    "DoctorChargePer",
                    e.target.value,
                    item
                  )
                }
                value={item?.DoctorChargePer}
                // disabled={payload?.RateOn?.value === "1"
                // }
                disabled={isChargeAmt}
              />
            ),

            TaxGroup: item?.SalesTaxGroupName,
            SaleTaxPercentage: item?.SaleTaxPercentage ? item?.SaleTaxPercentage : "0",
            // "Charges (Amount)": (
            //   <Input
            //     className="table-input"
            //     name="chargeAmt"
            //     removeFormGroupClass={true}
            //     type="number"
            //     onChange={(e) =>
            //       handleItemsChange(index, "chargeAmt", e.target.value, item)
            //     }
            //     value={item?.chargeAmt}
            //     disabled={true}
            //     // disabled={item?.IsChecked == true ? false : true}
            //   />
            // ),
            "Charges (Amount)": (
              <Input
                className="table-input"
                name="chargeAmt"
                removeFormGroupClass={true}
                type="number"
                onChange={(e) =>
                  handleItemsChange(index, "chargeAmt", e.target.value, item)
                }
                value={item?.chargeAmt}
                // disabled={payload?.RateOn?.value === "2"
                // }
                disabled={isCharge}
              />
            ),

            "Discount (%)": (
              <Input
                className="table-input"
                name="DiscountPer"
                removeFormGroupClass={true}
                type="number"
                onChange={(e) =>
                  handleItemsChange(index, "DiscountPer", e.target.value, item)
                }
                value={item?.DiscountPer}
                disabled={item?.IsChecked == true ? false : true}
              />
            ),
            "Discount (Amount)": (
              <Input
                className="table-input"
                name="DiscountAmt"
                removeFormGroupClass={true}
                type="number"
                onChange={(e) =>
                  handleItemsChange(index, "DiscountAmt", e.target.value, item)
                }
                value={item?.DiscountAmt}
                disabled={item?.IsChecked == true ? false : true}
              />
            ),
            "Tax_Amount": ((Number(item?.chargeAmt ? item?.chargeAmt : 0) * 100 / (100 + item?.SaleTaxPercentage)) * item?.SaleTaxPercentage * 0.01).toFixed(ROUNDOFF_VALUE),
            "Net Amount": item?.NetAmt ? item?.NetAmt : "0.00",
            "Panel Non-Payable": item?.isPayable === 0 ? "Yes" : "No",
            "Panel Co-Payment": item?.CoPayment ? item?.CoPayment : "0.0000",
          };
        })}
        tableHeight={"tableHeight"}
        // 27-10-2026: taller so the surgery charge lines can be read without scrolling (was 120px, ~3 rows)
        style={{ maxHeight: "45vh" }}
      />
    </>
  );
};

export default SurgeryDetailsTable;
