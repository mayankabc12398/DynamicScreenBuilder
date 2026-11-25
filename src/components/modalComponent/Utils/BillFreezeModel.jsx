import React from "react";
import { useTranslation } from "react-i18next";

const BillFreezeModel = ({data}) => {
    const [t] = useTranslation();
    console.log(data)
  return (
    <>
      <div className="row">
        <div className="col-sm-12 text-center">
          {/* <label className="" > */}
            <strong className="text-danger bold" style={{fontSize:"50px"}}>

            {t("You are about to Freez bill. after bill freez no further services or item can be added into the bill.")}
            </strong>
          {/* </label> */}
        </div>
      </div>
    </>
  );
};

export default BillFreezeModel;
