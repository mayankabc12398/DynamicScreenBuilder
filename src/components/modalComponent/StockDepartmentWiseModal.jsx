import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Modal from "./Modal";
import ReactSelect from "../formComponent/ReactSelect";
import Tables from "../UI/customTable";
import { ToolBindDepartment } from "../../networkServices/BillingsApi";
import { BindStock } from "../../networkServices/InventoryApi";
import { ShowOtherDepMedicineItemSearch } from "../../networkServices/pharmecy";
import { handleReactSelectDropDownOptions } from "../../utils/utils";
import Input from "../formComponent/Input";
import Heading from "../UI/Heading";

export default function StockDepartmentWiseModal({ visible, setVisible }) {
  const [t] = useTranslation();

  const [Department, setDepartment] = useState([]);
  const [payload, setPayload] = useState({ Department: null });
  const [errors, setErrors] = useState({});
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);

  const GetDepartmentData = async () => {
    try {
      const response = await ToolBindDepartment();
      setDepartment(response?.data || []);
    } catch (error) {
      console.error(error);
      setDepartment([]);
    }
  };

  useEffect(() => {
    if (visible) {
      GetDepartmentData();
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Hook to fetch default stock when department changes or search term is cleared
  useEffect(() => {
    const fetchDefaultStock = async () => {
      if (payload?.Department?.value && searchTerm.trim().length < 3) {
        setLoading(true);
        try {
          const response = await BindStock("", payload.Department.value);
          if (response?.success) {
            setStockData(response?.data || []);
          } else {
            setStockData([]);
          }
        } catch (error) {
          console.error(error);
          setStockData([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDefaultStock();
  }, [payload?.Department, searchTerm]);

  const handleReactSelect = (name, option) => {
    setPayload((prev) => ({
      ...prev,
      [name]: option
    }));
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (value.trim().length >= 3) {
      const timeout = setTimeout(async () => {
        setLoading(true);
        try {
          const payloadData = {
            panelId: 1,
            roleID: Number(payload?.Department?.value) || 0,
            isCashPanel: 1,
            isPackage: 0,
            saleOn: "Rate",
            searchBy: "1",
            itemName: value.trim(),
            patientType: "OPD"
          };
          const response = await ShowOtherDepMedicineItemSearch(payloadData);
          if (response?.success) {
            setStockData(response?.data || []);
          } else {
            setStockData([]);
          }
        } catch (error) {
          console.error(error);
          setStockData([]);
        } finally {
          setLoading(false);
        }
      }, 500); // 500ms debounce
      setSearchTimeout(timeout);
    }
  };

  const thead = [
    t("S.No."),
    t("Item Name"),
    t("Batch No."),
    t("Expiry Date"),
    t("Avl. Qty."),
    t("Unit"),
    t("MRP")
  ];

  return (
    <Modal
      visible={visible}
      setVisible={setVisible}
      Header={t("Stock Department Wise")}
      modalWidth="65vw"
      footer={
        <div className="text-right">
          <button className="btn btn-sm btn-danger" onClick={() => setVisible(false)}>
            {t("Close")}
          </button>
        </div>
      }
    >
      <div className="card patient_registration border">
        <div className="row p-2 align-items-center">
          <ReactSelect
            placeholderName={t("Department")}
            id={"Department"}
            searchable={true}
            respclass="col-xl-6 col-md-6 col-12"
            name={"Department"}
            dynamicOptions={handleReactSelectDropDownOptions(
              Department,
              "roleName",
              "roleID",
            )}
            value={payload?.Department}
            handleChange={handleReactSelect}
            requiredClassName={`required-fields ${errors?.Department ? "required-fields-active" : ""}`}
          />
          <div className="col-xl-6 col-md-6 col-12">
            <div style={{ position: "relative" }}>
              <Input
                type="text"
                className="form-control"
                lable={t("Search Medicine Please Enter 3 Char")}
                id="mrNo"
                name="mrNo"
                onChange={handleSearchChange}
                value={searchTerm}
                required={true}
                disabled={!payload?.Department?.value}
                respclass="w-100"
              />
            </div>
          </div>
        </div>

        <div className="row p-2">
          <div className="col-12">
            <Heading title={t("Stock Items Details")} />
            {loading ? (
              <div className="text-center p-5 text-muted">
                <i className="fa fa-spinner fa-spin fa-2x mb-2"></i>
                <div>{t("Loading stock data...")}</div>
              </div>
            ) : stockData && stockData.length > 0 ? (
              <Tables
                thead={thead}
                tbody={stockData.map((item, index) => ({
                  "S.No.": index + 1,
                  "Item Name": item?.ItemName || "-",
                  "Batch No.": item?.BatchNumber || "-",
                  "Expiry Date": item?.Expiry || item?.MedExpiryDate || "-",
                  "Avl. Qty.": item?.AvlQty || "0",
                  "Unit": item?.UnitType || "-",
                  "MRP": item?.MRP ? Number(item?.MRP).toFixed(2) : "0"
                }))}
              />
            ) : (
              <div className="text-center p-5 text-muted" style={{ backgroundColor: "#f8f9f9ff" }}>
                <b>{t("No Stock Details Found")}</b>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
