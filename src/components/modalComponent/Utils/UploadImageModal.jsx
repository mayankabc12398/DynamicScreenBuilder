// import React, { useEffect, useRef, useState } from "react";
// import nurse from "../../../assets/image/nurse.png";
// import { useDispatch, useSelector } from "react-redux";
// import { GetPanelDocument } from "../../../store/reducers/common/CommonExportFunction";
// import Modal from "../Modal";
// import WebcamCapture from "../../commonComponents/WebcamCapture";
// import { useTranslation } from "react-i18next";
// const UploadImageModal = ({
//   isuploadOpen,
//   closeCameraStream,
//   setIsuploadOpen,
//   handleImageChange,
//   startCamera,
//   cameraStream,
//   handleAPI,
//   setModalData,
//   modalData,
//   takePhoto,
//   canvasRef
// }) => {
//   //
//   const [t]=useTranslation();
//   const isMobile = window.innerWidth <= 768;
//   return (
//     <Modal
//       visible={isuploadOpen}
//       handleAPI={handleAPI}
//       setModalData={setModalData}
//       modalData={modalData}
//       setVisible={() => {
//         closeCameraStream("close"); // Close camera stream before closing modal
//         setIsuploadOpen(false);
//       }}
//       modalWidth={`500px`}
//       buttonName="Done"
//       Header="Scan Aadhaar"
//       buttons={
//         <>
//           <input
//             type="file"
//             id="fileInput"
//             onChange={handleImageChange}
//             style={{ display: "none" }}
//             accept="image/png, image/gif, image/jpeg"
//           />
//           <button className="btn btn-sm">
//             <label htmlFor="fileInput" className="text-white file-type-browse">
//               {t("Browse")}
//             </label>
//           </button>
//           {!isMobile && <button className="text-white" onClick={startCamera}>
//             {t("Webcam")}
//           </button>}

//         </>
//       }
//     >

//       <div className={`d-flex upload-image-model text-center justify-content-center`}>
//         {modalData?.preview && !cameraStream?.active ? (
//           <div style={{ height: "150px" }}>
//             <img src={modalData?.preview} alt="Preview" width="200" height="150" />
//           </div>
//         ) : (
//           <WebcamCapture height={"150"} width={'200'} takePhoto={takePhoto} canvasRef={canvasRef}/>
//         )}
//       </div>
//     </Modal>
//   );
// };

// export default UploadImageModal;

import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import WebcamCapture from "../../commonComponents/WebcamCapture";
import { useTranslation } from "react-i18next";

const UploadImageModal = ({
  isuploadOpen,
  closeCameraStream,
  setIsuploadOpen,
  handleImageChange,
  startCamera,
  cameraStream,
  handleAPI,
  setModalData,
  modalData,
  takePhoto,
  canvasRef,
}) => {
  const [t] = useTranslation();
  const isMobile = window.innerWidth <= 768;

  const isAadhaarMode = Boolean(
    modalData?.step || modalData?.frontPreview || modalData?.backPreview,
  );

  const activeStep = modalData?.step === "back" ? "back" : "front";
  const currentPreview = modalData?.preview || "";
  const frontPreview = modalData?.frontPreview || "";
  const backPreview = modalData?.backPreview || "";
  const isProcessing = Boolean(modalData?.isProcessing);

  const [viewMode, setViewMode] = useState(
    currentPreview ? "preview" : "empty",
  );

  const fileInputId = isAadhaarMode
    ? "aadhaar-scan-file-input"
    : "single-upload-file-input";

  useEffect(() => {
    if (!isuploadOpen) {
      setViewMode("empty");
      return;
    }

    setViewMode(currentPreview ? "preview" : "empty");
  }, [isuploadOpen]);

  useEffect(() => {
    if (!isAadhaarMode) return;
    setViewMode(currentPreview ? "preview" : "empty");
  }, [activeStep]);

  useEffect(() => {
    if (currentPreview) {
      setViewMode("preview");
    }
  }, [currentPreview]);

  const closeModal = () => {
    setViewMode("empty");
    closeCameraStream?.("close");
    setIsuploadOpen(false);
  };

  const handleBrowseChange = (e) => {
    setViewMode("empty");
    handleImageChange?.(e);
    e.target.value = "";
  };

  const handleWebcamClick = () => {
    setViewMode("camera");
    startCamera?.();
  };

  const renderPreviewCard = (label, imageSrc, isActive) => (
    <div
      style={{
        flex: 1,
        minWidth: "120px",
        border: isActive ? "2px solid #0d6efd" : "1px solid #d0d7de",
        borderRadius: "10px",
        padding: "10px",
        background: isActive ? "#f4f8ff" : "#fafbfc",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 600,
          marginBottom: "8px",
          color: "#495057",
        }}
      >
        {label}
      </div>

      {imageSrc ? (
        <img
          src={imageSrc}
          alt={label}
          style={{
            width: "100%",
            height: "90px",
            objectFit: "cover",
            borderRadius: "8px",
            border: "1px solid #dee2e6",
          }}
        />
      ) : (
        <div
          style={{
            height: "90px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
            border: "1px dashed #ced4da",
            color: "#6c757d",
            fontSize: "12px",
          }}
        >
          {t("Not Added")}
        </div>
      )}
    </div>
  );

  return (
    <Modal
      visible={isuploadOpen}
      handleAPI={handleAPI}
      setModalData={setModalData}
      modalData={modalData}
      setVisible={closeModal}
      modalWidth="560px"
      buttonName={t("Done")}
      Header={isAadhaarMode ? "Scan Aadhaar" : "Upload Image"}
      buttons={
        <>
          <input
            type="file"
            id={fileInputId}
            onChange={handleBrowseChange}
            style={{ display: "none" }}
            accept="image/png, image/gif, image/jpeg"
          />

          <button type="button" className="btn btn-sm">
            <label
              htmlFor={fileInputId}
              className="text-white file-type-browse"
              style={{ cursor: "pointer", marginBottom: 0 }}
            >
              {isAadhaarMode
                ? activeStep === "front"
                  ? t("Browse Front")
                  : t("Browse Back")
                : t("Browse")}
            </label>
          </button>

          {!isMobile && (
            <button
              type="button"
              className="text-white"
              onClick={handleWebcamClick}
            >
              {isAadhaarMode
                ? activeStep === "front"
                  ? t("Webcam Front")
                  : t("Webcam Back")
                : t("Webcam")}
            </button>
          )}
        </>
      }
    >
      <div className="upload-image-model">
        {isAadhaarMode && (
          <>
            <div className="text-center mb-3">
              <div style={{ fontWeight: 600, fontSize: "16px" }}>
                {activeStep === "front"
                  ? t("Step 1: Upload Aadhaar Front")
                  : t("Step 2: Upload Aadhaar Back")}
              </div>
              <div style={{ fontSize: "13px", color: "#6c757d" }}>
                {activeStep === "front"
                  ? t("Add the front image first. After that, upload the back image.")
                  : t("Add the back image, then click Done to extract details.")}
              </div>
            </div>

            <div
              className="d-flex gap-2 mb-3"
              style={{ gap: "10px", flexWrap: "wrap" }}
            >
              {renderPreviewCard(
                "Front Side",
                frontPreview,
                activeStep === "front",
              )}
              {renderPreviewCard(
                "Back Side",
                backPreview,
                activeStep === "back",
              )}
            </div>
          </>
        )}

        {isProcessing && (
          <div
            className="text-center mb-3"
            style={{ color: "#0d6efd", fontWeight: 600 }}
          >
            {t("Processing Aadhaar details...")}
          </div>
        )}

        <div className="d-flex justify-content-center text-center">
          {viewMode === "camera" ? (
            <WebcamCapture
              height="220"
              width="320"
              takePhoto={takePhoto}
              canvasRef={canvasRef}
            />
          ) : currentPreview ? (
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <img
                src={currentPreview}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "260px",
                  objectFit: "contain",
                  borderRadius: "10px",
                  border: "1px solid #dee2e6",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                minHeight: "220px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px dashed #ced4da",
                borderRadius: "12px",
                background: "#f8f9fa",
                padding: "20px",
                color: "#6c757d",
                fontSize: "14px",
              }}
            >
              {isAadhaarMode
                ? activeStep === "front"
                  ? t("Choose Browse Front or Webcam Front to add the Aadhaar front image.")
                  : t("Choose Browse Back or Webcam Back to add the Aadhaar back image.")
                : t("Choose Browse or Webcam to add an image.")}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UploadImageModal;
