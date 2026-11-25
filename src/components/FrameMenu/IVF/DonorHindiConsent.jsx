import { blankDonorUSightRetrievalPickup } from "../../../networkServices/IVFApi";
import { RedirectURL } from "../../../networkServices/PDFURL";
import { notify } from "../../../utils/utils";
import Heading from "../../UI/Heading";
import { useTranslation } from "react-i18next";

const DonorHindiConsent = () => {
  const [t] = useTranslation();
  const hanldleprint = async () => {
    try {
      const response = await blankDonorUSightRetrievalPickup(1);

      if (response?.success) {
        RedirectURL(response?.data?.pdfUrl);
      }
    } catch (error) {
      notify(error?.message || "Print error", "error");
    }
  };
  return (
    <>
      <div className="m-2 spatient_registration_card">
        <div className="patient_registration card">
          <Heading title={t("Donor USight Retrieval Pickup")} />
          <div className="d-flex justify-content-center mt-2">
            <button className="btn btn-primary" onClick={hanldleprint}>
              {t("PrintBlank")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DonorHindiConsent;
