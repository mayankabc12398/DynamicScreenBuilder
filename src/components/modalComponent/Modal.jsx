import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import SaveButton from "@components/UI/SaveButton";
import CancelButton from "../UI/CancelButton";
import { useLocalStorage } from "@app/utils/hooks/useLocalStorage";
import i18next from "i18next";
const t = (key, options) => i18next.t(key, options);

const Modal = ({
  setVisible,
  visible,
  children,
  Header,
  buttons,
  modalWidth,
  setModalData,
  modalData,
  handleAPI,
  buttonName,
  buttonDisabled = false,
  footer,
  CancelbuttonName,
  IsCancelFlag = false,
  handleCancelComment,
  style,
  contentStyle,
}) => {
  const isMobile = window.innerWidth <= 768;
  const theme = useLocalStorage("theme", "get");

  const handleSubmit = () => {
    if (typeof handleAPI === "function") {
      handleAPI(modalData);
    }
  };

  const footerContent = (
    <div>
      <div className="ftr_btn">
        {buttons}
        <SaveButton
          btnName={buttonName ? buttonName : t("Save")}
          onClick={handleSubmit}
          disabled={buttonDisabled}
        />
        <CancelButton
          cancleBtnName={CancelbuttonName ? CancelbuttonName : t("Cancel")}
          onClick={() => {
            setVisible(false);
            if (IsCancelFlag && typeof handleCancelComment === "function") {
              handleCancelComment();
            }
          }}
        />
      </div>
    </div>
  );
  return (
    <>
    
    
      <Dialog
        header={Header}
        visible={visible}
        style={{ width: isMobile ? "900vw" : (modalWidth || "92vw") ,...style}}
        contentStyle={contentStyle}
        onHide={() => {
          setVisible(false,modalData);
        }}
        draggable={false}
        className={theme}
        footer={footer ? footer : footerContent}
      >
        <Divider className={`custom-divider-header ${theme}`} />

        <p className={`m-0 ${theme}`}>{children}</p>
      </Dialog>
    </>
  );
};

export default Modal;
