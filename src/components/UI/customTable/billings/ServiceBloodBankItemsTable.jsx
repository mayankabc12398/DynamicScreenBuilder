import React from "react";
import Tables from "..";
import Heading from "../../Heading";
import { useTranslation } from "react-i18next";

const ServiceBloodBankItemsTable = ({ THEAD, tbody, handleDelete }) => {
  const [t] = useTranslation();
  console.log(tbody);

  return (
    <>
      <Heading title={t("Service Items")} />
      <Tables
        thead={THEAD}
        tbody={tbody?.map((item, index) => ({
          "Sr No.": index + 1,
          Category: item?.Category,
          "Item Name": item?.itemName,
          BloodGroup: item?.Blood,
          Quantity: item?.Quantity,
          ReserveDate: item?.ReserveDate,
          Time: item?.Time,
          Doctor: item?.DoctorID,
          Remove: (
            <i
              onClick={() => handleDelete(item, index)}
              className="fa fa-trash text-danger text-center"
              style={{ color: "red" }}
              aria-hidden="true"
            ></i>
          ),
        }))}
        tableHeight={"tableHeight"}
        style={{ height: "auto" }}
        // getRowClass={getRowClass}
      />
    </>
  );
};

export default ServiceBloodBankItemsTable;
