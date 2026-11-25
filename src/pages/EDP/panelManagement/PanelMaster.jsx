import React, { useEffect, useState } from "react";
import Heading from "../../../components/UI/Heading";
import { useTranslation } from "react-i18next";
import moment from "moment";
import SlideScreen from "../../../components/front-office/SlideScreen";
import SeeMoreSlideScreen from "../../../components/UI/SeeMoreSlideScreen";
import EDPSeeMoreList from "../EDPSeeMoreList";
import { BindPanelDetailsAPI } from "../../../networkServices/EDP/edpApi";
import WrapTranslate from "../../../components/WrapTranslate";
import Tables from "../../../components/UI/customTable";
import Modal from "../../../components/modalComponent/Modal";
import ServiceOfferedItemsModal from "./ServiceOfferedItemsModal";
import ReduceServiceModal from "./ReduceServiceModal";
import CreatePanel from "./CreatePanel";
import CustomTooltip from "../../../components/formComponent/CustomTooltip";

function PanelMaster({ data }) {
  const [t] = useTranslation();
  const [visible, setVisible] = useState(false);
  const [seeMore, setSeeMore] = useState([]);
  const [editData, setEditData] = useState(null);
  const [modalData, setModalData] = useState({ visible: false });
  const thead = [
    { name: "S.No." },
    { name: "Action" },
    { name: "Master Type" },
    { name: "Parent Panel" },
    { name: "Panel Name" },
    { name: "Is Corporate" },
    { name: "Address1" },
    { name: "Ref-Rate(IPD) Panel" },
    { name: "Ref-Rate(OPD) Panel" },
    { name: "Contact Person" },
    { name: "Date From" },
    { name: "Date To" },
    { name: "Credit Limit" },
    { name: "Bill Curr." },
    { name: "Curr. Conv." },
    { name: "Panel Type/Cover Note" },
    // { name: "Service Offered" },
    // { name: "Reduce Item Details" },
    // { name: "Edit" }
  ];
  const [renderComponent, setRenderComponent] = useState({
    name: "",
    component: null,
  });
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

  const [panelList, setPanelList] = useState([]);
  const RoomMasterSetUp = async (param = "") => {
    let apiResp = await BindPanelDetailsAPI(param);
    if (apiResp?.success) {
      setPanelList(apiResp?.data);
    } else {
      setPanelList([]);
    }
  };
  useEffect(() => {
    RoomMasterSetUp();
  }, [visible, modalData]);

  const handleOpenServiceOfferedModal = (val) => {
    setModalData({
      visible: true,
      Component: (
        <ServiceOfferedItemsModal data={val} setModalData={setModalData} />
      ),
      width: "100%",
      footer: <></>,
      label: (
        <span>
          <span style={{ color: "rgb(4 51 208)" }}>({val?.Company_Name})</span>{" "}
          {t("Service Offered Items")}
        </span>
      ),
    });
  };
  const handleOpenReduceServiceModal = (val) => {
    setModalData({
      visible: true,
      Component: <ReduceServiceModal data={val} setModalData={setModalData} />,
      width: "40%",
      footer: <></>,
      label: (
        <span>
          <span style={{ color: "rgb(4 51 208)" }}>({val?.Company_Name})</span>{" "}
          {t("Reduce Service")}
        </span>
      ),
    });
  };

  const handleOpenEditModal = (val) => {
    debugger
    setEditData(val);
    // setModalData({
    //   visible: true,
    //   Component: <CreatePanel data={val} setModalData={setModalData} />,
    //   width: "80%",
    //   label: <span><span style={{ color: "rgb(4 51 208)" }}>({val?.Company_Name})</span> {t("Edit Panel")}</span>,
    //   footer: <></>,
    // })
  };

  useEffect(() => { }, [visible]);

  return (
    <>
      <div className="spatient_registration_card card mt-2">
        {/* <Heading
          title={data?.breadcrumb}
          data={data}
          isSlideScreen={true}
          isBreadcrumb={true}
          secondTitle={
            <>
              <EDPSeeMoreList
                ModalComponent={ModalComponent}
                setSeeMore={setSeeMore}
                data={{}}
                isRemoveSvg={true}
                setVisible={() => {
                  setVisible(false);
                }}
                handleBindFrameMenu={[
                  {
                    FileName: "Create Item Master",
                    URL: "CreatePanel",
                    FrameName: "Create Item Master",
                    Description: "Create Item Master",
                    header: true,
                  },
                ]}
                openFirstItem={false}
                name={
                  <button className="btn text-white">
                    {" "}
                    {t("Create Panel")}{" "}
                  </button>
                }
              />
            </>
          }
        /> */}

        {/* <CreatePanel/> */}

        {/* <PanelMasterTable panelList={panelList}/> */}
        <CreatePanel data={editData} RoomMasterSetUp={RoomMasterSetUp} />

        <div>
          <Heading title={t("Scheme Details")} isBreadcrumb={false} />
          <Tables
            thead={WrapTranslate(thead, "name")}
            isSearch={true}
            style={{ maxHeight: "66vh" }}
            scrollView={"scrollView"}
            tbody={panelList?.map((val, index) => ({
              Sno: index + 1,
              Action: (
                <>
                  <CustomTooltip
                    id={`cogs${index}`}
                    content={"View / Edit Service Offered"}
                    icon={<i id={`cogs${index}`} className="fa fa-cogs" onClick={() => { handleOpenServiceOfferedModal(val) }}></i>}
                  />

                  <CustomTooltip
                    id={`info${index}`}
                    content={"View / Edit Reduce Item Detail"}
                    icon={
                      <i
                        id={`info${index}`}
                        className="fa fa-info-circle mx-3"
                        onClick={() => { handleOpenReduceServiceModal(val) }}
                      ></i>
                    }
                  />
                  <CustomTooltip
                    id={`edit${index}`}
                    content={"Edit Panel"}
                    icon={
                      <i id={`edit${index}`} className="fa fa-edit ml-1" onClick={() => { handleOpenEditModal(val) }}></i>
                    }
                  />
                </>
              ),
              MasterPanel: val?.MasterType,
              ParentPanel: val?.ParentCompanyName,
              Company_Name: val?.Company_Name,
              IsCorporatePanel: val?.IsCorporatePanel==0 ? "No" : "Yes",
              Add1: val?.Add1,
              Ref_Company: val?.Ref_Company,
              Ref_CompanyOPD: val?.Ref_CompanyOPD,
              Contact_Person: val?.Contact_Person,
              DateFrom: val?.DateFrom,
              DateTo: val?.DateTo,
              CreditLimit: val?.CreditLimit,
              BillCurrencyNotation: val?.BillCurrencyNotation,
              BillCurrencyConversion: val?.BillCurrencyConversion
                ? val?.BillCurrencyConversion.toFixed(5)
                : "0.00000",
              BillingType: val?.BillingType,
              // ServiceOffered: <button className='btn btn-sm btn-primary tbl-btn' onClick={() => { handleOpenServiceOfferedModal(val) }}> {t("View / Edit Service Offered")}</button>,
              // ItemDetail: <button className='btn btn-sm btn-primary tbl-btn' onClick={() => { handleOpenReduceServiceModal(val) }}> {t("View / Edit Reduce Item Detail")}</button>,
              // Edit: <button className='btn btn-sm btn-primary tbl-btn' onClick={() => { handleOpenEditModal(val) }}> {t("Edit")}</button>
            }))}
          />
        </div>
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

      {modalData?.visible && (
        <Modal
          visible={modalData?.visible}
          setVisible={(ele, data) => {
            setModalData({ visible: false });
          }}
          modalData={modalData?.modalData}
          modalWidth={modalData?.width}
          Header={modalData?.label}
          buttonType="button"
          buttonName={modalData?.buttonName}
          footer={modalData?.footer}
          handleAPI={modalData?.CallAPI}
        >
          {modalData?.Component}
        </Modal>
      )}
    </>
  );
}

export default PanelMaster;
