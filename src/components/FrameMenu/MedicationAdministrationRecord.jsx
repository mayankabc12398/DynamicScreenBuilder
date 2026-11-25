import React, { useEffect, useState } from "react";
import Heading from "../UI/Heading";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import ReactSelect from "../formComponent/ReactSelect";
import Tables from "../UI/customTable";
import {
  AddOutsideMedication,
  BindMedicationRecord,
  BindMedicineDetail,
  BindMedicineGrid,
  CategoryMedicationRecordNew,
  GetOutsideMedication,
  MedicineFreQuency,
  MedicineRoute,
  MedicineTimes,
  updateMedicineDetailAPI,
} from "../../networkServices/nursingWardAPI";
import { GetTimeDuration } from "../../networkServices/BillingsApi";
import { handleReactSelectDropDownOptions, notify } from "../../utils/utils";
import MedicationAdminitionTable from "../UI/customTable/NursingWard/MedicationAdminitionTable.jsx";
import Modal from "../modalComponent/Modal.jsx";
import MedicalInfoModal from "../../components/modalComponent/Utils/MedicalInfoModal.jsx";
import EditMedicineDetailsModel from "../modalComponent/Utils/EditMedicineDetailsModel.jsx";
import ColorCodingSearch from "../commonComponents/ColorCodingSearch.jsx";
import { GetPatientMedicalInfo } from "../../networkServices/DoctorApi.js";
import Input from "../formComponent/Input.jsx";
import { useLocalStorage } from "../../utils/hooks/useLocalStorage.js";
import OutsideMecationTable from "../UI/customTable/NursingWard/OutsideMecationTable";

export default function MedicationAdministrationRecord({ data }) {
  let [t] = useTranslation();

  const thead = [
    { width: "2%", name: " " },
    { width: "1%", name: t("SNO") },
    t("MedicineName"),
    t("EntryDateTime"),
    t("OrderQty"),
    t("IssuedQty"),
    t("GivenQty"),
    t("RemainingQty"),
    t("Dose"),
    t("Time"),
    t("Route"),
    t("Duration"),
    t("Status"),
    t("EntryBy"),
    { width: "1%", name: t("Edit") },
  ];
  const outMedicineThead = [
    { width: "2%", name: " " },
    { width: "2%", name: t("SNO") },
    t("MedicineName"),
    t("EntryDateTime"),
    t("OrderQty"),
    t("IssuedQty"),
    t("GivenQty"),
    t("RemainingQty"),
    t("Dose"),
    t("Time"),
    t("Route"),
    t("Duration"),
    t("Status"),
    t("EntryBy"),
  ];
  const initialState = {
    transactionID: "",
    patientID: "",
    medicineName: "",
    qty: 1,
    dose: 1,
    frequency: "",
    route: "",
    duration: "",
    entryBy: "",
  };
  const localData = useLocalStorage("userData", "get");
  const [handleModelData, setHandleModelData] = useState({});
  const [state, setState] = useState(initialState);
  const [modalData, setModalData] = useState({});
  const [medicalInfos, setmedicalInfo] = useState(null);
  const [outsideMediData, setOutsideMediData] = useState([]);
  const [show, setShow] = useState(false);
  const setIsOpen = () => {
    setHandleModelData((val) => ({ ...val, isOpen: false }));
  };
  const handleChangeModel = (inputData) => {
    setModalData(inputData);
  };

  const [medicationRecord, setMedicationRecord] = useState([]);
  const [tbody, setTbody] = useState([]);
  const [values, setValues] = useState({});
  const BindCategoryMedicationRecordNewAPI = async () => {
    const apiResp = await CategoryMedicationRecordNew();
    if (apiResp?.success) {
      const data = handleReactSelectDropDownOptions(
        apiResp?.data,
        "NAME",
        "CategoryID",
      );
      setMedicationRecord(data);
    } else {
      notify(apiResp?.message, "error");
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleReactSelectChange = (name, value) => {
    setState((prev) => ({
      ...prev,
      [name]: value || "",
    }));
  };

  const handleItemSelect = (itemName, itemID, item, type, e, index) => {
    setState((prev) => ({
      ...prev,
      medicineName: itemName,
    }));
  };
  const refreshOutsideMedications = () => {
    GetOutsideMedications();
  };
  const [medicationAdmiTionList, setMedicationAdmiTionList] = useState({
    medicineTime: [],
    MedicineRoute: [],
    MedicineFreQuency: [],
    medicationRecord: [],
    durationOptions: [],
  });
  const handleSaveOutsideMedication = async () => {
    if (!state?.medicineName) {
      notify(t("Please enter medicine name"), "error");
      return;
    }
    if (!state?.qty) {
      notify(t("Please enter quantity"), "error");
      return;
    }
    if (!state?.dose) {
      notify(t("Please enter dose"), "error");
      return;
    }
    if (!state?.frequency) {
      notify(t("Please enter frequency"), "error");
      return;
    }
    if (!state?.route) {
      notify(t("Please enter route"), "error");
      return;
    }
    if (!state?.duration) {
      notify(t("Please enter duration"), "error");
      return;
    }
    const payload = {
      transactionID: data?.transactionID || data?.TransactionID,
      patientID: data?.patientID || data?.PatientID,
      entryBy: localData?.employeeID,
      qty: state?.qty,
      medicineName: state?.medicineName,
      duration: state?.duration?.value || state?.duration,
      frequency: state?.frequency?.value || state?.frequency,
      route: state?.route?.value || state?.route,
      dose: state?.dose,
    };
    try {
      const apiResp = await AddOutsideMedication(payload);
      if (apiResp?.success) {
        debugger;
        notify(apiResp?.message, "success");
        setState({ ...initialState });
        GetOutsideMedications();
      } else {
        notify(apiResp?.message, "error");
      }
    } catch (error) {
      console.error("Error Add Expense", error);
    }
  };
  const GetOutsideMedications = async () => {
    const apiResp = await GetOutsideMedication(
      data?.transactionID || data?.TransactionID,
    );
    debugger;
    if (apiResp?.success) {
      setOutsideMediData(apiResp?.data);
    } else {
      notify(apiResp?.message, "error");
    }
  };

  const BindMedicineListItem = async () => {
    try {
      Promise.all([
        MedicineTimes(),
        MedicineRoute(),
        MedicineFreQuency(),
        CategoryMedicationRecordNew(),
        GetTimeDuration(),
      ]).then(
        ([
          medicineTime,
          MedicineRoute,
          MedicineFreQuency,
          medicationRecord,
          durationOptions,
        ]) => {
          setMedicationAdmiTionList((val) => ({
            ...val,
            medicineTime: medicineTime?.data,
            MedicineRoute: handleReactSelectDropDownOptions(
              MedicineRoute?.data,
              "Route",
              "Route",
            ),
            MedicineFreQuency: handleReactSelectDropDownOptions(
              MedicineFreQuency?.data,
              "Frequency",
              "Frequency",
            ),
            durationOptions: handleReactSelectDropDownOptions(
              durationOptions?.data,
              "NAME",
              "Quantity",
            ),
            medicationRecord: handleReactSelectDropDownOptions(
              medicationRecord?.data,
              "NAME",
              "CategoryID",
            ),
          }));
          setValues((val) => ({ ...val, category: { value: 5 } }));
          handleReactSelect("category", { value: 5 });
        },
      );
    } catch (error) {
      console.log("error", error);
    }
  };
  useEffect(() => {
    BindMedicineListItem();
    GetOutsideMedications();
  }, []);
  useEffect(() => {
    if (data?.patientID) {
      const fetchMedicalInfo = async () => {
        const res = await GetPatientMedicalInfo(data?.patientID);
        if (res?.success) {
          setmedicalInfo(res?.data);
        }
      };
      fetchMedicalInfo();
    }
  }, [data?.patientID]);

  // useEffect(() => {
  //     // BindCategoryMedicationRecordNewAPI()
  // }, [])

  // fin_global_resources -> IsMedicationEntryRow
  // On hone par purane MedicationRecord.aspx jaisa behaviour: entries
  // cpoe_medication_record se aati hain (har entry ka apna Dose/Route/Frequency).
  const { GetGlobalResources } = useSelector((state) => state?.CommonSlice);
  const isMedicationEntryRow =
    String(
      (Array.isArray(GetGlobalResources) ? GetGlobalResources : [])?.find(
        (item) => item?.Name === "IsMedicationEntryRow",
      )?.Value ?? "",
    ).trim() === "1";

  const BindMedicineDetailAPI = async (payload) => {
    let apiResp = isMedicationEntryRow
      ? await BindMedicationRecord(payload)
      : await BindMedicineDetail(payload);
    if (apiResp?.success) {
      return apiResp?.data;
    } else {
      return [];
    }
  };

  const bindMedicationList = async (value) => {
    const apiResp = await BindMedicineGrid({
      tid: data?.transactionID || data?.TransactionID,
      categoryID: value,
    });
    if (apiResp?.success) {
      const updatedArray = await Promise.all(
        apiResp?.data.map(async (obj) => {
          const secondApiResponse = await BindMedicineDetailAPI({
            tid: data?.transactionID || data?.TransactionID,
            itemID: obj?.ItemID,
            indentNo: obj?.IndentNo,
          });
          const secondApiData = await secondApiResponse;
          return {
            ...obj,
            BindMedicineList: secondApiData,
            dose: obj?.Dose,
            isopen:
              obj?.STATUS === "Running" ||
              obj?.STATUS === "Completed" ||
              obj?.STATUS === "Stopped"
                ? true
                : false,
            tid: data?.transactionID || data?.TransactionID,
          };
        }),
      );
      setTbody(updatedArray);
    } else {
      notify(apiResp?.message, "error");
    }
  };

  const handleReactSelect = async (label, value) => {
    setValues((val) => ({ ...val, [label]: value }));
    if (label === "category") {
      bindMedicationList(value?.value);
    }
  };

  const updateMedicineDetail = async (data) => {
    try {
      let apiResp = await updateMedicineDetailAPI(data);
      if (apiResp?.success) {
        notify(apiResp?.message, "success");
        bindMedicationList(values?.category?.value);
        setIsOpen();
      } else {
        notify(apiResp?.message, "error");
      }
    } catch (error) {}
  };
  const editMedicineDetail = (data) => {
    setHandleModelData({
      label: t("EditMedicineDetails"),
      buttonName: t("Update"),
      width: "40vw",
      isOpen: true,
      Component: (
        <EditMedicineDetailsModel
          inputData={data}
          handleChangeModel={handleChangeModel}
          medicineTime={medicationAdmiTionList?.medicineTime}
        />
      ),
      handleInsertAPI: updateMedicineDetail,
      extrabutton: <></>,
    });
  };

  return (
    <>
      <div className="mt-2 spatient_registration_card">
        <Heading
          title={t("Medication Administration Record")}
          // title=""
          isBreadcrumb={false}
          removeSecondHeadAlignClass={true}
          secondTitle={
            <>
              <ColorCodingSearch
                color={"color-indicator-2-bg"}
                label={t("Pending Request")}
                onClick={() => {}}
              />
              <ColorCodingSearch
                color={"color-indicator-1-bg"}
                label={t("Request Done")}
                onClick={() => {}}
              />
              <ColorCodingSearch
                color={"color-indicator-3-bg"}
                label={t("Request Rejected")}
                onClick={() => {}}
              />
              <ColorCodingSearch
                color={"color-indicator-4-bg"}
                label={t("Running")}
                onClick={() => {}}
              />
              <ColorCodingSearch
                color={"color-indicator-5-bg"}
                label={t("Medicine Discontinued")}
                onClick={() => {}}
              />
              <ColorCodingSearch
                color={"color-indicator-6-bg"}
                label={t("Completed")}
                onClick={() => {}}
              />
              <ColorCodingSearch
                color={"color-indicator-7-bg"}
                label={t("Missed")}
                onClick={() => {}}
              />
              <ColorCodingSearch
                color={"color-indicator-8-bg"}
                label={t("Before Time")}
                onClick={() => {}}
              />
              <ColorCodingSearch
                color={"color-indicator-9-bg"}
                label={t("Ontime(Within 1 hrs)")}
                onClick={() => {}}
              />
              <ColorCodingSearch
                color={"color-indicator-10-bg"}
                label={t("Late(More than 1 hrs)")}
                onClick={() => {}}
              />
              <ColorCodingSearch
                color={"color-indicator-11-bg"}
                label={t("Upcoming")}
                onClick={() => {}}
              />
              <ColorCodingSearch
                color={"color-indicator-12-bg"}
                label={t("No Need")}
                onClick={() => {}}
              />
            </>
          }
        />
        <div className="card ">
          {/* <Heading title={t("SearchOption")} /> */}

          <div className="d-flex">
            <ReactSelect
              placeholderName={t("medical")}
              searchable={true}
              id="category"
              dynamicOptions={medicationAdmiTionList?.medicationRecord}
              name="category"
              value={`${values?.category?.value ? values?.category?.value : ""}`}
              handleChange={handleReactSelect}
              respclass="w-25 m-2"
              //tabIndex="-1"
            />

            <div className="w-75 m-2">
              <span style={{ color: "#CC3300" }}>
                <strong>{t("Note")}</strong>:<strong>1.</strong>
                {t(
                  "In case of Completed, Either the Duration is finished OR the Remaining Qty. is",
                )}{" "}
                0.
                {/* <strong className='ml-1'>2.</strong>  If medicine Name is brown color and large means it is a outside medicine. */}
              </span>
            </div>
            <button
              className="btn btn-success btn-sm my-2"
              onClick={() => {
                setShow(!show);
              }}
            >
              {t("Outside Medication")}
            </button>
          </div>

          <div className="d-flex">
            {/* <div className='w-25'>
                        <Heading title={t("PatientDetail")} secondTitle={t("TotalPatient") + " 0"} />
                        <Tables
                            thead={theadPatientDetail}
                            tbody={[{ sr: "1", DOC: "Test", "patientName": "Mayank" }]}
                            tableHeight={"nurse-assignment-table-height"}
                        />
                    </div> */}
            <div className="w-100 ml-2">
              <Heading
                title={t("SampleDetail")}
                secondTitle={t("TotalTest") + " 0"}
              />
              {tbody?.length > 0 && (
                <MedicationAdminitionTable
                  thead={thead}
                  tbody={tbody}
                  setTbody={setTbody}
                  values={values}
                  editMedicineDetail={editMedicineDetail}
                  handleModelData={handleModelData}
                  setHandleModelData={setHandleModelData}
                  setModalData={setModalData}
                  bindMedicationList={bindMedicationList}
                  medicationAdmiTionList={medicationAdmiTionList}
                />
              )}
              {/* <Tables
                            thead={thead}
                            tbody={[
                                {
                                    expend: "+", sr: "1", MedicineName: "PARALUP 650MG TAB", "EntryDateTime": "09-May-24 5:37 PM", OrderQty: "30.000000", IssuedQty: "30.000000", "GivenQty": "24", "RemainingQty": "224", "Dose": "5", "Time": "HOURLY", "Route": "TOPICAL", "Duration": "2024-05-12", "Status": "Completed", "EntryBy": "Mr. Administrator"

                                }
                            ]}
                            tableHeight={"nurse-assignment-table-height"}
                        /> */}
            </div>
          </div>
        </div>
      </div>
      {show && (
        <OutsideMecationTable
          outsideMediData={outsideMediData}
          outMedicineThead={outMedicineThead}
          onDataUpdate={refreshOutsideMedications}
          handleSaveOutsideMedication={handleSaveOutsideMedication}
          handleChange={handleChange}
          handleReactSelectChange={handleReactSelectChange}
          values={values}
          state={state}
          setState={setState}
          medicineFrequency={medicationAdmiTionList?.MedicineFreQuency}
          durationOptions={medicationAdmiTionList?.durationOptions}
          medicineRoute={medicationAdmiTionList?.MedicineRoute}
          pateintDetails={data}
          handleItemSelect={handleItemSelect}
        />
      )}

      {(medicalInfos?.diagnosisList?.length > 0 ||
        medicalInfos?.allergyList?.length > 0) && (
        <Modal
          visible={medicalInfos}
          setVisible={setmedicalInfo}
          modalWidth={"60vw"}
          Header={t("Medical Information")}
          footer={<></>}
        >
          <MedicalInfoModal medicalData={medicalInfos} />
        </Modal>
      )}

      {handleModelData?.isOpen && (
        <Modal
          visible={handleModelData?.isOpen}
          setVisible={setIsOpen}
          modalWidth={handleModelData?.width}
          Header={t(handleModelData?.label)}
          buttonType={"submit"}
          buttons={handleModelData?.extrabutton}
          buttonName={handleModelData?.buttonName}
          modalData={modalData}
          setModalData={setModalData}
          footer={handleModelData?.footer}
          handleAPI={handleModelData?.handleInsertAPI}
          CancelbuttonName={handleModelData?.CancelbuttonName}
        >
          {handleModelData?.Component}
        </Modal>
      )}
    </>
  );
}
