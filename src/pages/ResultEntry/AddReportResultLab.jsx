import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Tables from "../../components/UI/customTable";
import SaveButton from "../../components/UI/SaveButton";
import {
  BindAttachment,
  BindAttachmentLab,
  BindAttachmentPdf,
  BindTestDDLlab,
} from "../../networkServices/resultEntry";
import {
  handleReactSelectDropDownOptions,
  notify,
  removeBase64Data,
} from "../../utils/utils";
import ReactSelect from "../../components/formComponent/ReactSelect";
import { DocdownloadBase64File, fileToBase64 } from "../../utils/constant";

export default function AddReportResultLab({
  handleChangeModel,
  patientDetail,
  bindTestLab,
  pdata,
  removeUpload=false
}) {
  const [t] = useTranslation();
  const [inputs, setInputs] = useState(patientDetail);
  const [bindTestLabRender, setBindTestLabRender] = useState([]);
  const [testOptions, setTestOptions] = useState([]);
  const [values, setValues] = useState({ TestName: "" });

  const [fileData, setFileData] = useState([]);

  const handleSelect = (name, value) => {
    setValues((val) => ({ ...val, [name]: value }));
  };

  const BindTestDDLlabData = async (data) => {
    const params = {
      TestID: String(data.Test_ID),
    };
    try {
      const response = await BindTestDDLlab(params);
      if (response.success) {
        setBindTestLabRender(
          handleReactSelectDropDownOptions(response?.data, "Name", "Test_ID"),
        );
      } else {
        console.error(
          "API returned success as false or invalid response:",
          response,
        );
        setBindTestLabRender([]);
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
      setBindTestLabRender([]);
    }
  };

  useEffect(() => {
    if (bindTestLab?.length > 0) {
      setBindTestLabRender(
        handleReactSelectDropDownOptions(bindTestLab, "Name", "Test_ID"),
      );
    } else {
      BindTestDDLlabData(pdata);
    }
  }, []);

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
  // const handleDocumentChange = (e) => {
  //   e.preventDefault();
  //   let file = e.target.files[0];

  //   if (!file) return;

  //   // Validate file type
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
  //     setInputs((val) => ({ ...val, document: reader.result }));
  //   };
  //   reader.readAsDataURL(file);
  // };

  // useEffect(() => {
  //   const formattedOptions = bindTestLab.map((val) => ({
  //     value: val.Test_ID,
  //     label: val.Name,
  //   }));
  //   setTestOptions(formattedOptions);

  // }, [bindTestLab]);

  useEffect(() => {
    handleChangeModel(inputs);
  }, [inputs]);

  const thead = [t("View File"), t("File Name"), t("UploadedBY"), t("dtEntry")];

  const handleAttachment = async () => {
    const testID = values?.TestName?.value || "";
    const fileContent = inputs?.document;
    console.log("sss", testID);

    if (!testID) {
      notify(t("Please select a test."), "error");
      return;
    }

    if (!fileContent) {
      notify(t("Please upload a file."), "error");
      return;
    }

    const payload = {
      id: "",
      ledgerTransactionNo: "",
      patientID: "",
      fileName: inputs?.documentName,
      fileUrl: "",
      documentName: "",
      Test_ID: testID,
      attachedFile: "",
      entryDate: "",
      isOutsourced: "",
      flag: "Addreport",
      file: removeBase64Data(fileContent),
    };
// debugger
//     return
    try {
      const apiResp = await BindAttachmentLab(payload);
      if (apiResp.success) {
        notify(t("Data saved successfully"), "success");
        setInputs({});
        setValues({ TestName: "" });
        document.getElementById("document").value = "";
        // debugger
        await handleBindAttachment(testID);
      } else {
        notify(t("Some error occurred"), "error");
      }
    } catch (error) {
      notify(t("An error occurred while fetching data"), "error");
    }
  };

  const viewPdf = async (val, index) => {
    const payload = {
      testID: pdata?.Test_ID,
      FileUrl: val.FileUrl,
      id: val.id,
    };
    const resp = await BindAttachmentPdf(payload);

    if (resp.success && resp.data) {
      DocdownloadBase64File(resp?.data?.base64,resp?.data?.fileName,resp?.data?.mimeType)
      // const base64Data = resp.data;
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
      notify(resp?.message || "Failed to load PDF", "error");
    }
  };

  const handleBindAttachment = async (testID) => {
    // debugger
    const params = {
      testID: testID,
    };
    // console.log("call",params);

    try {
      const response = await BindAttachment(params);
      if (response.success) {
        setFileData(response.data);
      } else {
        // notify(response.message, "error");
        setFileData([]);
      }
    } catch (error) {
      console.error("Error fetching department data:", error);
      setFileData([]);
    }
  };

  useEffect(() => {
    handleBindAttachment(pdata?.Test_ID);
  }, []);

  return (
    <>
    {!removeUpload && <>
      {!fileData?.length > 0 && (
        <>
          <div className="row row-cols-lg-5 row-cols-md-2 row-cols-1 p-2">
            <ReactSelect
              placeholderName={t("Test")}
              id={"TestName"}
              searchable={true}
              respclass="col-xl-8 col-md-4 col-sm-4 col-12"
              dynamicOptions={bindTestLabRender}
              handleChange={handleSelect}
              value={values?.TestName}
              name={"TestName"}
            />
          </div>

          <input
            type="file"
            name="document"
            id="document"
            style={{ marginLeft: 10 }}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleDocumentChange}
          />

          <div className="ftr_btn mb-4">
            <SaveButton btnName={"Upload"} onClick={handleAttachment} />
          </div>
        </>
      )}
      </>
    }
      <Tables
        thead={thead}
        // tbody={[2]}
        tbody={fileData?.map((val, index) => ({
          viewBtn: (
            <i
              onClick={() => viewPdf(val, index)}
              className="fa fa-search"
              aria-hidden="true"
            ></i>
          ),
          fileName: val.AttachedFile.split("/").pop(),
          UploadedBy: val?.UploadedBy,
          dtEntry: val?.dtEntry,
        }))}
        tableHeight={"scrollView"}
      />
       {(removeUpload && fileData?.length===0) ?<h1 className="text-center">{t("No Data Found")}</h1>:"" }
    </>
  );
}
