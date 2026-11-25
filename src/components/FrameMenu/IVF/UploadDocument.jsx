import { useTranslation } from "react-i18next";
import ReactSelect from "../../formComponent/ReactSelect";
import Heading from "../../UI/Heading";
import { useState } from "react";
import BrowseButton from "../../formComponent/BrowseButton";
import { notify } from "../../../utils/utils";

const UploadDocument = () => {
  const [t] = useTranslation();

  const [payload, setPayload] = useState({
    Document: "",
    SelectFile: null,
    Document_Base64: "",
    FileExtension: "",
  });

  const handleSelect = (name, val) => {
    setPayload((prev) => ({
      ...prev,
      [name]: val?.value || "",
    }));
  };

  const handleImageChange = (e) => {
    const file = e?.target?.files[0];

    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      notify(t("File size exceeds 5MB. Please choose a smaller file."));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(",")[1];
      const fileExtension = file.name.split(".").pop();

      setPayload((prev) => ({
        ...prev,
        SelectFile: file,
        Document_Base64: base64String,
        FileExtension: fileExtension,
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleUploadFile = async () => {
    if (!payload.SelectFile) {
      notify(t("Please select a file first"));
      return;
    }

    console.log("Uploading file payload:", payload);
  };

  const handleSave = async () => {
    console.log("Saving document:", payload);
  };

  return (
    <>
      <div className="m-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("UploadDocument")} isBreadcrumb={false} />

          <div className="row p-2">
            <ReactSelect
              placeholderName={t("Document")}
              id="Document"
              name="Document"
              searchable={true}
              respclass="col-xl-2 col-md-3 col-sm-4 col-12"
              removeIsClearable={true}
              value={payload.Document}
              handleChange={handleSelect}
            />

            <div className="col-xl-2 col-md-4 col-sm-6 col-12 mb-2">
              <div className="d-flex align-items-center">
                <BrowseButton
                  label={t("Select File")}
                  handleImageChange={handleImageChange}
                />

                <button
                  className="btn btn-sm btn-primary mx-1"
                  onClick={handleUploadFile}
                >
                  {t("Upload File")}
                </button>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end p-2">
            <button className="btn btn-primary" onClick={handleSave}>
              {t("Save")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UploadDocument;
