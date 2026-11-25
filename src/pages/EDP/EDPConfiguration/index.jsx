import React, { useEffect, useState } from "react";
import Heading from "../../../components/UI/Heading";
import ReactSelect from "../../../components/formComponent/ReactSelect";
import { useTranslation } from "react-i18next";
import {
  GetEDPMasterSetupListAPI,
  GetEDPMasterSetupStepListAPI,
} from "../../../networkServices/EDP/edpApi";
import { handleReactSelectDropDownOptions } from "../../../utils/utils";
import Stepper from "./Stepper";
import RenderComponents from "./RenderComponents";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { setBreadcrumbValue } from "../../../store/reducers/common/BreadcrumbSlice";

export default function index({ data }) {
  console.log("datadatadata", data);
  const [t] = useTranslation();
  const location = useLocation();
  // { masterSetupID, stepID } sent by the header Menu Search. Ignored when this
  // screen is opened nested (data prop) from another configuration step.
  const searchTarget = data ? null : location?.state?.edpSearch;
  const [values, setValues] = useState({});
  const [stepList, setStepList] = useState([]);
  const [dropDownState, setDropDownState] = useState({
    centerManagementList: [],
    stepList: [],
  });

  const dispatch = useDispatch();

  const handleClick = (val) => {
    dispatch(setBreadcrumbValue(val?.breadcrumb));
    setValues((prev) => ({ ...prev, steps: val }));

    let updatedStepList = stepList?.map((step) => {
       if (step?.ID === val?.ID) {
        return { ...step, status: "active" };
      } if (step?.status === "active") {
        return { ...step, status: "completed" };
      } else if (step?.status === "completed") {
        return step;
      } else {
        return { ...step, status: "" };
      }
    });
    setStepList(updatedStepList);
  };
  const handleReactChange = async (name, e, centerManagementList, targetStepID) => {
    if (name === "centerManagement") {
      let apiResp = await GetEDPMasterSetupStepListAPI(e?.value);
      if (apiResp?.success) {
        // The step picked in Menu Search, else the type's default screen.
        const activeStep =
          (targetStepID != null &&
            apiResp?.data?.find((val) => String(val?.ID) === String(targetStepID))) ||
          apiResp?.data?.find((val) => val?.IsDefaultScreen === 1);
        setStepList(
          apiResp?.data?.map((val) => {
            if (val === activeStep) {
              handleClick(val);
            }
            return {
              ...val,
              status: val === activeStep ? "active" : "",
            };
          }),
        );

        setDropDownState((prev) => ({
          ...prev,
          // stepList: apiResp?.data?.map((val) => {
          //   if (val?.IsDefaultScreen === 1) {
          //     handleClick(val);
          //     // setValues((prev) => ({ ...prev, steps: val }));
          //   }
          //   return {
          //     ...val,
          //     status: val?.IsDefaultScreen === 1 ? "active" : "",
          //   };
          // }),
          centerManagementList:
            centerManagementList || prev?.centerManagementList,
        }));
      } else {
        setDropDownState((prev) => ({
          ...prev,
          // stepList: [],
        }));
        setValues((prev) => ({ ...prev, steps: {} }));
      }
    }
    setValues((val) => ({ ...val, [name]: e }));
  };

  const findSetupOption = (list, target) =>
    list?.find((option) => String(option?.value) === String(target?.masterSetupID));

  const getCenterManagementList = async (target) => {
    let apiResp = await GetEDPMasterSetupListAPI(0);
    if (apiResp?.success) {
      const centerManagementList = handleReactSelectDropDownOptions(
        apiResp?.data,
        "MasterType",
        "MasterSetupID",
      );
      handleReactChange(
        "centerManagement",
        findSetupOption(centerManagementList, target) || centerManagementList[0],
        centerManagementList,
        target?.stepID,
      );
    } else {
      setDropDownState((prev) => ({ ...prev, centerManagementList: [] }));
    }
  };
  
  async function fetchData() {
    let apiResp = await GetEDPMasterSetupStepListAPI(data?.AgainstMasterSetupID);
    if (apiResp?.success) {
      debugger
      setStepList(
        apiResp?.data?.map((val) => {
          if (val?.IsDefaultScreen === 1) {
            handleClick(val);
          }
          return {
            ...val,
            status: val?.IsDefaultScreen === 1 ? "active" : "",
          };
        }),
      );
    }
  }
  useEffect(() => {

    if (data) {
      fetchData();
    }else{
    getCenterManagementList(searchTarget);
    }
  }, []);

  // Menu Search used while this page is already open: same route, new state.
  // On first mount the list is still empty and the effect above handles it.
  useEffect(() => {
    if (!searchTarget || !dropDownState?.centerManagementList?.length) return;
    const option = findSetupOption(dropDownState.centerManagementList, searchTarget);
    if (option) {
      handleReactChange("centerManagement", option, undefined, searchTarget?.stepID);
    }
  }, [location.key]);

  return (
    <div className="pt-2">
      {/* <Heading title="EDP Configuration" secondTitle={<></>} /> */}
      <div
        className="p-2 card"
        // style={{
        //   height: `calc(100vh - ${dropDownState?.stepList?.length ===0?"150px":"224px"})`,
        //   overflow: "auto",
        // }}
      >
        <div className="row">
          {!data?
          <ReactSelect
            requiredClassName="required-fields"
            placeholderName={t("Configuration Type")}
            searchable={true}
            respclass="col-xl-2 col-md-2 col-sm-6 col-12"
            id={"centerManagement"}
            name={"centerManagement"}
            removeIsClearable={true}
            handleChange={(name, e) => handleReactChange(name, e)}
            dynamicOptions={dropDownState?.centerManagementList}
            value={values?.centerManagement?.value}
          />:""}
          <div className={`${data ? "col-xl-12 col-md-12" : "col-xl-10 col-md-10"} col-12`}>
            <Stepper handleClick={handleClick} steps={stepList} />
          </div>
        </div>
      </div>
      <RenderComponents stepDetails={values?.steps} />
      {/* {dropDownState?.stepList?.length > 0 && (
        <div className="card">
          <Stepper handleClick={handleClick} steps={dropDownState?.stepList} />
        </div>
      )} */}
    </div>
  );
}
