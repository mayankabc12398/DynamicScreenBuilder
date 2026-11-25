import React, { useState } from 'react'
import Modal from '../../../modalComponent/Modal'
import MakePayment from './MakePayment'
import { useTranslation } from 'react-i18next';

const MPaisaPAyment = ({isUPIMODE,singlePatientData,onRazorpayClick}) => {
      const [t] = useTranslation();
     const [handleModelData, setHandleModelData] = useState({
        
      });
     const setIsOpen = () => {
        setHandleModelData((val) => ({ ...val, isOpen: false }));
    };
    const handleMakePayment=()=>{
    debugger
     setHandleModelData({
                        label: t("M-PESA PAYMENT"),
                        buttonName: t("Save"),
                        width: "50vw",
                        isOpen: true,
                        Component: (
                          <MakePayment isUPIMODE={isUPIMODE}  singlePatientData={singlePatientData}/>
                            // <SelectAllocation selectData={newData} panelList={DropDownState?.Panel} setHandleModelData={setHandleModelData} selectRow={val} />
                        ),
                        // handleInsertAPI: handleSaveModaldata,
                        extrabutton: <></>,
                        footer: <></>,
                    });
  }
  return (
  <div className=" spatient_registration_card card">
                {/* <Heading title={t("Blood Collection")} isBreadcrumb={true} /> */}

                <div className="row ">
        
        
       <div className="col-12 p-2 d-flex flex-wrap" style={{ gap: "8px" }}>
                        <button
                            className="btn btn-sm btn-success"
                            type="button"
                            onClick={handleMakePayment}
                        >
                            {t("Make Payment")}
                        </button>
                        {typeof onRazorpayClick === "function" && (
                            <button
                                className="btn btn-sm btn-primary"
                                type="button"
                                onClick={() => onRazorpayClick(isUPIMODE?.Amount)}
                            >
                                {t("Pay via Razorpay")}
                            </button>
                        )}
                    </div>
        </div>
         {handleModelData?.isOpen && (
                      <Modal
                          visible={handleModelData?.isOpen}
                       
                          setVisible={setIsOpen}
                          modalWidth={handleModelData?.width}
                          Header={t(handleModelData?.label)}
                          buttonType={"submit"}
                          buttons={handleModelData?.extrabutton}
                          buttonName={handleModelData?.buttonName}
                          modalData={handleModelData?.modalData}
                          setModalData={(data) =>
                              setHandleModelData((prev) => ({ ...prev, modalData: data }))
                          }
      
                          footer={handleModelData?.footer}
                          handleAPI={handleModelData?.handleInsertAPI}
                      >
                          {handleModelData?.Component}
                      </Modal>
                  )}
        </div>
  )
}

export default MPaisaPAyment