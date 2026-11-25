import React, { useEffect } from "react";
import Tables from "../../../../components/UI/customTable";
import SlideScreen from "../../../../components/front-office/SlideScreen";
import SeeMoreSlideScreen from "../../../../components/UI/SeeMoreSlideScreen";

import { useState } from "react";
import { BindFrameMenuByRoleID } from "../../../../store/reducers/common/CommonExportFunction";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import EDPSeeMoreList from "../../EDPSeeMoreList";
import Heading from "../../../../components/UI/Heading";
import { useTranslation } from "react-i18next";
import { EDPGetEmployee } from "../../../../networkServices/EDP/edpApi";
import moment from "moment";
const EmployeeTableList = ({
  tableData,
  setTableData,
  list,
  setTableItemDetails,
}) => {
  console.log("TableData", tableData);
  //
  const [t] = useTranslation();
  const THEAD = [
    { name: t("S.No."), width: "1%" },
    { name: t("Action"), width: "1%" },
    { name: t("Title"), width: "1%" },
    { name: t("Employee Name"), width: "10%" },
    { name: t("Emp Code"), width: "8%" },
    { name: t("D.O.B"), width: "10%" },
    { name: t("Mobile No."), width: "10%" },
    { name: t("Email"), width: "10%" },
    { name: t("D.O.J"), width: "10%" },
    { name: t("Employee Group"), width: "10%" },
    { name: t("Department"), width: "10%" },
    { name: t("Designation"), width: "10%" },
    { name: t("Address"), width: "10%" },
    { name: t("Active"), width: "5%" },
  ];
  const [visible, setVisible] = useState(false);
  const [renderComponent, setRenderComponent] = useState({
    name: null,
    component: null,
  });
  const dispatch = useDispatch();
  const [seeMore, setSeeMore] = useState([]);
  const handleChangeComponent = (e) => {
    ModalComponent(e?.label, e?.component);
  };
  const ModalComponent = (name, component) => {
    setVisible(true);
    setRenderComponent({
      name: name,
      component: component,
    });
  };

  // const GetEmpyInfo = async () => {
  //   const data = await EDPGetEmployee(tableData[0]?.);
  // };

  const { BindFrameMenuByRoleIDS } = useSelector((state) => state?.CommonSlice);
  useEffect(() => {
    dispatch(BindFrameMenuByRoleID({ frameName: "EDP-EMPLOYEE" }));
  }, []);

  return (
    <>
      <div>
        <Heading title={t("Employee List")} />
        <Tables
        isSearch={true}
          thead={THEAD}
          tbody={tableData.map((ele, index) => ({

            Sno: index + 1,
            Select: (
              <i
                className="fa fa-edit"
                onClick={() => {
                  setTableItemDetails({ ...ele, employeeId: ele?.EmployeeID });
                }}
              >
                {/* {console.log("ele from empTable", ele)}
                <EDPSeeMoreList
                  ModalComponent={ModalComponent}
                  setSeeMore={setSeeMore}
                  data={{ ...ele, list: list }}
                  setVisible={() => {
                    // EmergencyPatientSearch()
                    setVisible(false);
                  }}
                  handleBindFrameMenu={BindFrameMenuByRoleIDS}
                  isShowPatient={true}
                /> */}
              </i>
            ),
            Title: ele?.title,
            EmployeeName: ele?.NAME,
            EmpCode: ele?.EmployeeCode || "",
            DOB:moment(ele?.DOB).format("DD-MM-YYYY"),
            MobileNo: ele?.Mobile,
            Email: ele?.Email,
            DOJ: moment( ele?.DOJ).format("DD-MM-YYYY"),
            UserGroup: ele?.EmployeeGroup,
            Department: ele?.Department,
            Designation: ele?.Designaition,
            Address: ele?.House_No,
            Active: ele?.Active,
          }))}
          style={{ minHeight: "10vw", maxHeight: "68vw" }}
        />
      </div>

      <SlideScreen
        visible={visible}
        setVisible={() => {
          setVisible(false);
          setRenderComponent({
            name: null,
            component: null,
          });
        }}
        Header={
          <SeeMoreSlideScreen
            name={renderComponent?.name}
            seeMore={seeMore}
            handleChangeComponent={handleChangeComponent}
          />
        }
      >
        {renderComponent?.component}
      </SlideScreen>
    </>
  );
};

export default EmployeeTableList;
