import React, { useState } from "react";
import Heading from "../../../components/UI/Heading";
import Tables from "../../../components/UI/customTable";
import { useTranslation } from "react-i18next";
import Input from "../../../components/formComponent/Input";

const SpouseHistory = () => {
  const { t } = useTranslation();

  const thead = [
    { name: t("S.No."), width: "4%" },
    { name: t("Type") },
    { name: t("Mother") },
    { name: t("Age Onset") },
    { name: t("Father") },
    { name: t("Age Onset") },
    { name: t("Siblings") },
    { name: t("Age Onset") },
    { name: t("Grand Parents") },
    { name: t("Age Onset") },
  ];

  const [tableData, setTableData] = useState([
    {
      Type: "ekkkkkkkkkkkk",
      Mother: false,
      AgeOnsetOfMother: "",
      Father: false,
      AgeOnsetOfFather: "",
      Siblings: false,
      AgeOnsetOfSiblings: "",
      GrandParent: false,
      AgeOnsetOfGrandParent: "",
    },
  ]);

  // ✅ FIXED: update specific field in specific row
  const handleChange = (index, name, value) => {
    const updatedData = [...tableData];
    updatedData[index][name] = value;
    setTableData(updatedData);
  };

  // ✅ FIXED: checkbox handler
  const handleItemChange = (index, name, checked) => {
    const updatedData = [...tableData];
    updatedData[index][name] = checked;
    setTableData(updatedData);
  };

  return (
    <>
      <div className="card">
        <Heading title={t("Family History")} />

        <Tables
          thead={thead}
          tbody={tableData.map((ele, index) => ({
            "S.No.": index + 1,
            Type: ele?.Type,

            Mother: (
              <input
                type="checkbox"
                name="Mother"
                checked={ele?.Mother}
                onChange={(e) =>
                  handleItemChange(index, "Mother", e.target.checked)
                }
              />
            ),

            AgeOnsetOfMother: (
              <Input
                type="text"
                className="form-control"
                respclass="col-xl-6 col-lg-6 col-md-6 col-6"
                value={ele?.AgeOnsetOfMother}
                onChange={(e) =>
                  handleChange(index, "AgeOnsetOfMother", e.target.value)
                }
              />
            ),

            Father: (
              <input
                type="checkbox"
                name="Father"
                checked={ele?.Father}
                onChange={(e) =>
                  handleItemChange(index, "Father", e.target.checked)
                }
              />
            ),

            AgeOnsetOfFather: (
              <Input
                type="text"
                className="form-control"
                respclass="col-xl-6 col-lg-6 col-md-6 col-6"
                value={ele?.AgeOnsetOfFather}
                onChange={(e) =>
                  handleChange(index, "AgeOnsetOfFather", e.target.value)
                }
              />
            ),

            Siblings: (
              <input
                type="checkbox"
                name="Siblings"
                checked={ele?.Siblings}
                onChange={(e) =>
                  handleItemChange(index, "Siblings", e.target.checked)
                }
              />
            ),

            AgeOnsetOfSiblings: (
              <Input
                type="text"
                className="form-control"
                respclass="col-xl-6 col-lg-6 col-md-6 col-6"
                value={ele?.AgeOnsetOfSiblings}
                onChange={(e) =>
                  handleChange(index, "AgeOnsetOfSiblings", e.target.value)
                }
              />
            ),

            GrandParent: (
              <input
                type="checkbox"
                name="GrandParent"
                checked={ele?.GrandParent}
                onChange={(e) =>
                  handleItemChange(index, "GrandParent", e.target.checked)
                }
              />
            ),

            AgeOnsetOfGrandParent: (
              <Input
                type="text"
                className="form-control w-100"
                respclass="col-xl-6 col-lg-6 col-md-6 col-6"
                value={ele?.AgeOnsetOfGrandParent}
                onChange={(e) =>
                  handleChange(index, "AgeOnsetOfGrandParent", e.target.value)
                }
              />
            ),
          }))}
        />
      </div>
    </>
  );
};

export default SpouseHistory;