import React, { useEffect, useState } from "react";
import TextAreaInput from "../../../formComponent/TextAreaInput";
import {
    BillingRemarkSave,
    userRemarkLoad,
} from "../../../../networkServices/BillingsApi";
import { notify } from "../../../../utils/utils";
import { useTranslation } from "react-i18next";
import Tables from "../../../UI/customTable";
import Heading from "../../../UI/Heading";

const UserRemarksModal = ({
    pateintDetails,
    handleModalState,
    GetBindBillDepartment,
}) => {

    const [t] = useTranslation();

    const [tableData, setTableData] = useState([]);


    const THEAD = [
        { name: t("S.No."), width: "1%" },
        { name: t("Entry Date") },
        { name: t("Remark") },
        { name: t("Entry By") },
    ]
    const [billingRemark, setBillingRemark] = useState("");

    const handleIndicator = (state) => {
        return (
            <div className="text-danger">
                {t("max 200 Charcter")}{" "}
                <span className="text-dark">{t("Remaining")} : </span>{" "}
                <span className="text-success">{Number(200 - state?.length)}</span>
            </div>
        );
    };

    const handleChange = (e) => {
        const { value } = e.target;
        if (value.length <= 200) setBillingRemark(value);
    };

    const handleUserRemarkLoad = async (TransactionID) => {
        try {
            const response = await userRemarkLoad(TransactionID);
            if (response?.success) {
                setTableData(response?.data);
            } else {
                setBillingRemark("");
            }
        } catch (error) {
            console.log(error, "SomeThing Went Wrong");
        }
    };

    const handleUserRemarkSave = async () => {
        try {
            const payload = {
                TransactionID: pateintDetails?.TransactionID,
                Remarks: billingRemark,
            }
            const response = await BillingRemarkSave(payload);

            notify(response?.message, response?.success ? "success" : "error");
            if (response?.success) {
                // handleModalState(false, null, null, null, <></>);
                GetBindBillDepartment();
                handleUserRemarkLoad(pateintDetails?.TransactionID);
                setBillingRemark("");
            }
        } catch (error) {
            console.log(error, "SomeThing Went Wrong");
        }
    };

    useEffect(() => {
        handleUserRemarkLoad(pateintDetails?.TransactionID);
    }, []);
    return (
        <>
            <div className="row">
                <TextAreaInput
                    respclass={"col-12"}
                    lable={t("Remark")}
                    id={"Remark"}
                    rows={3}
                    value={billingRemark}
                    onChange={(e) => handleChange(e)}
                />
                <div className="col-6">{handleIndicator(billingRemark)}</div>
            </div>
            <div className="d-flex align-items-center justify-content-end">
                <button
                    className="btn btn-sm btn-primary"
                    onClick={handleUserRemarkSave}
                >
                    {t("Remark")}
                </button>
            </div>



            <div className="mt-2">
                <Heading title={"Remark Result"} isBreadcrumb={false} />
                <Tables thead={THEAD} tbody={tableData?.map((val, index) => ({
                    SNo: index + 1,
                    Date: val?.date,
                    Remark: val?.note,
                    EntryBy: val?.user,
                }))} />
            </div>
        </>
    );
};

export default UserRemarksModal;
