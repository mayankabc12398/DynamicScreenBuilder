import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Tables from "../../components/UI/customTable";
import SaveButton from "../../components/UI/SaveButton";
import {
  BindAttachmentDetails,
  BindAttachmentLab,
  BindPatientDetailsImage,
} from "../../networkServices/resultEntry";
import { notify, removeBase64Data } from "../../utils/utils";
import LabeledInput from "../../components/formComponent/LabeledInput";
import { NursingWardDiabeticChartPrintAPI } from "../../networkServices/nursingWardAPI";
import { RedirectURL } from "../../networkServices/PDFURL";
import { BindAttachment } from "../../networkServices/resultEntry";
import { HistoCytoGrossRemoveRadiologyUplodedData } from "../../networkServices/resultEntry";
import ConfirmBox from "../../components/modalComponent/ConfirmBox";
import { DocdownloadBase64File, fileToBase64 } from "../../utils/constant";
import { labLabel } from "../../utils/labNoLabel";
export default function AddFileResultLab({
  handleChangeModel,
  patientDetail,
  val,removeUpload,
  pdata,
}) {
  const [t] = useTranslation();
  const [inputs, setInputs] = useState(patientDetail);
  const [fileData, setFileData] = useState([]);
  const [file, setFile] = useState(null);
  // Attachment waiting for the user's Yes in the delete confirmation.
  const [deleteItem, setDeleteItem] = useState(null);
  const [values, setValues] = useState({
    BarcodeNo: val?.BarcodeNo || "",
    PatientName: val?.PName || "",
    UHID: val?.PatientID || "",
  });


  const handleBindPatientAtachmentDetails = async (Test_ID) => {
    // const params = LedgerTransactionNo ? `LedgerTransactionNo=${LedgerTransactionNo}` : `LedgerTransactionNo=${pdata?.LedgerTransactionNo}`
    // console.log("sssss", params);
    // debugger;
    try {
      const response = await BindAttachmentDetails(Test_ID);
      if (response.success) {
        setFileData(response.data);
      } else {
        console.error(
          "API returned success as false or invalid response:",
          response,
        );
        setFileData([]);
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
      setFileData([]);
    }
  };

  useEffect(() => {
    handleBindPatientAtachmentDetails(val?.Test_ID);
  }, []);

  // const handleDocumentChange = (e) => {
  //   e.preventDefault();
  //   let file = e.target.files[0];

  //   if (!file) return;

  //   // Validate file type
  //   // if (!["image/jpeg", "image/png"].includes(file.type)) {
  //   //   notify("Only JPEG and PNG files are allowed.", "warning");
  //   //   return;
  //   // }
  //   if (file.type !== "application/pdf") {
  //     notify("Only PDF files are allowed.", "warning");
  //     return;
  //   }

  //   // Validate file size (2MB limit)
  //   if (file.size > 2 * 1024 * 1024) {
  //     notify("File size exceeds 2MB.", "warning");
  //     return;
  //   }

  //   let reader = new FileReader();
  //   reader.onloadend = () => {
  //     setInputs((prev) => ({ ...prev, document: reader.result }));
  //     setFile(file);
  //   };
  //   reader.readAsDataURL(file);
  // };

   const handleDocumentChange = async (e) => {
     const file = e.target.files[0];
     if (!file) return;
   
     try {
       const result = await fileToBase64(file);
      setInputs((val) => ({ ...val, document: result?.base64, documentName: result?.fileName,documentType: result?.fileType }));
     } catch (error) {
       alert(error);
     }
   };
  const handleAttachment = async () => {
    if (!inputs?.document) {
      notify(t("Please upload an file before submitting."), "error");
      return;
    }

    const payload = {
      id: "",
      patientID: val?.PatientID,
      fileName: inputs?.documentName,
      fileUrl: "",
      documentName: "",
      test_ID: val?.Test_ID,
      attachedFile: "",
      entryDate: "",
      isOutsourced: "",
      flag: "",
      file: removeBase64Data(inputs.document),
    };

    try {
      const apiResp = await BindAttachmentLab(payload);
      if (apiResp.success) {
        notify(t("File Uploaded successfully!"), "success");
        setFile(null);
        setInputs((prev) => ({ ...prev, document: "" }));
        document.getElementById("document").value = "";

        await handleBindPatientAtachmentDetails(val?.Test_ID);
      } else {
        notify(t("Upload failed. Please try again."), "error");
      }
    } catch (error) {
      notify(t("An error occurred while uploading."), "error");
      console.error("Upload Error:", error);
    }
  };

  useEffect(() => {
    handleChangeModel(inputs);
  }, [inputs]);

  const viewImage = async (data, index) => {
    const payload = {
      id: data.Id,
      FileName: data.FileName,
      LedgerTransactionNo: val?.LedgerTransactionNo,
    };
    const resp = await BindPatientDetailsImage(payload);
    // console.log("button is working", resp);
    // if (resp.success && resp.data) {
    //   const base64Image = resp.data.url; // No prefix
    //   const imageMimeType = "image/png"; // or "image/jpeg"
    //   const imageSrc = `data:${imageMimeType};base64,${base64Image}`;

    //   const newTab = window.open();
    //   if (newTab) {
    //     newTab.document.write(`<img src="${imageSrc}" alt="Image"/>`);
    //     newTab.document.close();
    //     notify("success", "Image opened successfully");
    //   } else {
    //     notify("error", "Popup blocked");
    //   }
    // } else {
    //   notify(resp?.message || "Failed to load image", "error");
    // }

    if (resp.success && resp.data) {
        DocdownloadBase64File(resp?.data?.base64,resp?.data?.fileName,resp?.data?.mimeType)
      // const base64Data = resp.data?.url;
      // const byteCharacters = atob(base64Data);
      // const byteNumbers = new Array(byteCharacters.length)
      //   .fill()
      //   .map((_, i) => byteCharacters.charCodeAt(i));
      // const byteArray = new Uint8Array(byteNumbers);
      // const blob = new Blob([byteArray], { type: "application/pdf" });
      // const pdfURL = URL.createObjectURL(blob);
      // window.open(pdfURL, "_blank");
      notify(t("success"), "PDF opened successfully");
    } else {
      notify(response?.message || "Failed to load PDF", "error");
    }
  };

  // Delete: same endpoint the Histo/Cyto upload screen uses - removes the
  // patient_labinvestigation_attachment row and its file, then the list is re-read
  // (with no file left the Upload box shows again).
  const handleDelete = async () => {
    const row = deleteItem;
    setDeleteItem(null);
    if (!row) return;
    try {
      const response = await HistoCytoGrossRemoveRadiologyUplodedData({
        id: String(row?.Id ?? row?.id ?? ""),
        fileUrl: row?.FileUrl ?? "",
        ledgerTransactionNo: "",
      });
      if (response?.success) {
        notify(response?.message || t("Record deleted successfully."), "success");
      } else {
        notify(response?.message || t("The record was not deleted."), "error");
      }
    } catch (error) {
      notify(t("The record was not deleted."), "error");
    }
    await handleBindPatientAtachmentDetails(val?.Test_ID);
  };

  const thead = [t("View File"), t("File Name"), t("Uploaded By"), t("Date"), t("Delete")];

  return (
    <>

    {!removeUpload && <>

      <div className="row row-cols-lg-5 row-cols-md-2 row-cols-1 p-2">
        <div className="col-xl-4 col-md-4 col-sm-4 col-12">
          <LabeledInput
            label={labLabel(t("BarCode"))}
            value={values?.BarcodeNo || ""}
            readOnly
          />
        </div>
        <div className="col-xl-4 col-md-4 col-sm-4 col-12">
          <LabeledInput
            label={t("Patient Name")}
            value={values?.PatientName || ""}
            readOnly
          />
        </div>
        <div className="col-xl-4 col-md-4 col-sm-4 col-12">
          <LabeledInput label={t("UHID")} value={values?.UHID || ""} readOnly />
        </div>
      </div>

      {!fileData?.length > 0 && (
        <>
          <div className="row">
            <input
              type="file"
              name="document"
              id="document"
              style={{ marginLeft: 10 }}
              onChange={handleDocumentChange}
              // accept="image/jpeg, image/png"
              // accept="application/pdf"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"

            />
          </div>

          <div className="ftr_btn mb-4">
            <SaveButton btnName={"Upload"} onClick={handleAttachment} />
          </div>
        </>
      )}
      </>
      }

      <Tables
        thead={thead}
        tbody={fileData?.map((val, index) => ({
          viewBtn: (
            <i
              onClick={() => viewImage(val, index)}
              className="fa fa-search"
              aria-hidden="true"
            ></i>
          ),
          fileName: val.FileName,
          UploadedBy: val?.UploadedBy,
          Updatedate: val?.Updatedate,
          deleteBtn: (
            <i
              onClick={() => setDeleteItem(val)}
              className="fa fa-trash text-danger"
              style={{ cursor: "pointer" }}
              title={t("Delete")}
              aria-hidden="true"
            ></i>
          ),
        }))}
        tableHeight={"scrollView"}
      />
      {fileData?.length===0 ?<h1 className="text-center">{t("No Data Found")}</h1>:"" }
      <ConfirmBox
        visible={!!deleteItem}
        header={t("Delete File")}
        message={`${t("Are you sure you want to delete this file?")} ${deleteItem?.FileName ?? ""}`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
      
    </>
  );
}
