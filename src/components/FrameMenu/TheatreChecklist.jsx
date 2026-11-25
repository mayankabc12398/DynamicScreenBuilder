import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Tables from "../UI/customTable";
import Input from "../formComponent/Input";
import {
  bindBioMedicalDataApi,
  bindThreatreDataApi,
  save_TheatreApi,
  saveBiomedicalApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";
import DatePicker from "../formComponent/DatePicker";
import moment from "moment";

const TheatreChecklist = ({ data }) => {
  const { transactionID, patientID } = data || {};
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;

  const [isRecordExist, setIsRecordExist] = useState(false);

  const tableItems = [
    {
      type: "row",
      label:(
       <span> "Inform the surgeon, anesthetist, perfusionist and <br/>{t("other team member of the date and time of planned surgery\"")}</span>
      ),
      payloadKeys: {
        done: "theatrE_Done1",
        dateDone: "labDate_Done30",
        notDone: "theatrE_NotDone1",
        comment: "theatrE_Comment1",
      },
    },
    {
      type: "row",
      label: (
        <span>
          {t("Confirm the patient is done a dental")}
          <br /> {t("checkup a week before the opera")}
        </span>
      ),
      payloadKeys: {
        done: "theatrE_Donenew1",
        dateDone: "labDate_Done31",
        notDone: "theatrE_NotDonenew1",
        comment: "theatrE_Commentnew1",
      },
    },
    {
      type: "row",
      label: (
        <span>
          {t("Ensure all blood works are done as above")}
          <br /> {t("and results are available in the file")}
        </span>
      ),
      payloadKeys: {
        done: "theatrE_Done2",
        dateDone: "labDate_Done32",
        notDone: "theatrE_NotDone2",
        comment: "theatrE_Comment2",
      },
    },

    {
      type: "row",
      label: (
        <span>
          {t("Ensure patient has had an ECG and a chest X-ray")} <br />
          {t("preoperatively and results are in file")}
        </span>
      ),
      payloadKeys: {
        done: "theatrE_Done3",
        dateDone: "labDate_Done33",
        notDone: "theatrE_NotDone3",
        comment: "theatrE_Comment3",
      },
    },
    {
      type: "row",
      label: (
        <span>
          {t("Ensure the weight and height of the patient have been recorded")}
        </span>
      ),
      payloadKeys: {
        done: "theatrE_Done4",
        dateDone: "labDate_Done34",
        notDone: "theatrE_NotDone4",
        comment: "theatrE_Comment4",
      },
    },
    {
      type: "row",
      label: (
        <span>
          Confirm whether patient has been on anticoagulation e.g. <br />
          {t("ASA or warfarin. These should be stopped 3 days pre operatively")}
        </span>
      ),
      payloadKeys: {
        done: "theatrE_Done5",
        dateDone: "labDate_Done35",
        notDone: "theatrE_NotDone5",
        comment: "theatrE_Comment5",
      },
    },
    {
      type: "row",
      label: (
        <span>
          {t("Ensure the consent form has been fully signed by all parties")}
        </span>
      ),
      payloadKeys: {
        done: "theatrE_Done6",
        dateDone: "labDate_Done36",
        notDone: "theatrE_NotDone6",
        comment: "theatrE_Comment6",
      },
    },
    {
      type: "row",
      label: (
        <span>
          {t("The cardiac team should have a meeting to be briefed")} <br />
          {t("on the patient before the operation")}{" "}
        </span>
      ),
      payloadKeys: {
        done: "theatrE_Done7",
        dateDone: "labDate_Done37",
        notDone: "theatrE_NotDone7",
        comment: "theatrE_Comment7",
      },
    },
    {
      type: "row",
      label: (
        <span>
          {t("The patient is taken for a tour of the theatre a day before the operation")}
        </span>
      ),
      payloadKeys: {
        done: "theatrE_Done8",
        dateDone: "labDate_Done38",
        notDone: "theatrE_NotDone8",
        comment: "theatrE_Comment8",
      },
    },
    {
      type: "row",
      label: (
        <>
          <span className="fw-semibold">
            {t("Theatre nurse should visit the patient to")}
          </span>
          <ol className="mb-0 ps-3">
            <li>{t("Ensure all necessary investigations are done and file")}</li>
            <li>{t("Ensure weight and height of the patient is done")}</li>
            <li>{t("Ensure consent if fully signed")}</li>
            <li>{t("To take history and reassure the patient")}</li>
          </ol>
        </>
      ),
      payloadKeys: {
        done: "theatrE_Done9",
        dateDone: "labDate_Done39",
        notDone: "theatrE_NotDone9",
        comment: "theatrE_Comment9",
      },
    },

    {
      type: "row",
      label: (
        <span>
          {t("The theatre nurse will brief the cardiac team on the patient history")}
        </span>
      ),
      payloadKeys: {
        done: "theatrE_Done10",
        dateDone: "labDate_Done40",
        notDone: "theatrE_NotDone10",
        comment: "theatrE_Comment10",
      },
    },
    { type: "section", label: t("Operation Day") },

    {
      type: "row",
      label: (
        <span>
          {t("The patient is wheeled to theatre 30minutes before the operation")}{" "}
        </span>
      ),
      payloadKeys: {
        done: "theatrE_Done11",
        dateDone: "labDate_Done41",
        notDone: "theatrE_NotDone11",
        comment: "theatrE_Comment11",
      },
    },
    {
      type: "row",
      label: (
        <>
          <span className="fw-semibold">
            {t("The theatre nurse confirms the following")}{" "}
          </span>
          <ol className="mb-0 ps-3">
            <li>{t("It's the right patient for the operation")}</li>
            <li>{t("Patient has been starved")}</li>
            <li>{t("Patient has an identity band and theatre gown on")}</li>
            <li>{t("Consent if fully signed")}</li>
            <li>{t("Pre-medication has been administered")}</li>
          </ol>
        </>
      ),
      payloadKeys: {
        done: "theatrE_Done12",
        dateDone: "labDate_Done42",
        notDone: "theatrE_NotDone12",
        comment: "theatrE_Comment12",
      },
    },

    {
      type: "row",
      label: (
        <span>
          {t("Theatre nurse positions the patient in cardiac position i.e. sitting up")}
        </span>
      ),
      payloadKeys: {
        done: "theatrE_Done13",
        dateDone: "labDate_Done43",
        notDone: "theatrE_NotDone13",
        comment: "theatrE_Comment13",
      },
    },
    {
      type: "row",
      label: (
        <span>
          {t("In theatre the patient is reassured once again by the nurse")} <br />
          {t("who confirms the theatre checklist is complete")}
        </span>
      ),
      payloadKeys: {
        done: "theatrE_Done14",
        dateDone: "labDate_Done44",
        notDone: "theatrE_NotDone14",
        comment: "theatrE_Comment14",
      },
    },
    {
      type: "row",
      label: <span>{t("Patient is then wheeled to the operating room")}</span>,
      payloadKeys: {
        done: "theatrE_Done15",
        dateDone: "labDate_Done45",
        notDone: "theatrE_NotDone15",
        comment: "theatrE_Comment15",
      },
    },
    {
      type: "row",
      label: (
        <>
          <span className="fw-semibold">
            {t("The theatre Nurse will ensure the following items are ready and readily")}
            <br /> {t("available before the operation day")}
          </span>
          <ol className="mb-0 ps-3">
            <li>{t("1. Diathermy cables")}</li>
          </ol>
        </>
      ),
      payloadKeys: {
        done: "theatrE_Done16",
        dateDone: "labDate_Done46",
        notDone: "theatrE_NotDone16",
        comment: "theatrE_Comment16",
      },
    },
    {
      type: "row",
      label: (
        <>
          <span>{t("2. Sutures-Prolenes 3/0 W 630")}</span>
          <ul className="mb-0 ps-3">
            <li>i. 3/0 W 8522</li>
            <li>{t("ii. 4/0 W 8845")}</li>
            <li>{t("iii. 4/0 W 8557")}</li>
            <li>{t("iv. 5/0 W 8556")}</li>
            <li>{t("v. 6/0MW 8706")}</li>
          </ul>
        </>
      ),
      payloadKeys: {
        done: "theatrE_Done17",
        dateDone: "labDate_Done47",
        notDone: "theatrE_NotDone17",
        comment: "theatrE_Comment17",
      },
    },
    {
      type: "row",
      label: <span>{t("3. Steel Wire W 945")}</span>,
      payloadKeys: {
        done: "theatrE_Done18",
        dateDone: "labDate_Done48",
        notDone: "theatrE_NotDone18",
        comment: "theatrE_Comment18",
      },
    },

    {
      type: "row",
      label: <span>{t("4. Nylon Tape W 786")}</span>,
      payloadKeys: {
        done: "theatrE_Done19",
        dateDone: "labDate_Done49",
        notDone: "theatrE_NotDone19",
        comment: "theatrE_Comment19",
      },
    },
    {
      type: "row",
      label: <span>{t("5. Vicryl 2/0 W 9363")}</span>,
      payloadKeys: {
        done: "theatrE_Done20",
        dateDone: "labDate_Done50",
        notDone: "theatrE_NotDone20",
        comment: "theatrE_Comment20",
      },
    },
    {
      type: "row",
      label: <span>{t("6. Vicryl 3/0 W 9525")}</span>,
      payloadKeys: {
        done: "theatrE_Done21",
        dateDone: "labDate_Done51",
        notDone: "theatrE_NotDone21",
        comment: "theatrE_Comment21",
      },
    },

    {
      type: "row",
      label: <span>{t("7. Bone Wax W 810")}</span>,
      payloadKeys: {
        done: "theatrE_Done22",
        dateDone: "labDate_Done52",
        notDone: "theatrE_NotDone22",
        comment: "theatrE_Comment22",
      },
    },

    {
      type: "row",
      label: <span>{t("8. Surgical Blade x2 -Size 15 i. Size 24")}</span>,
      payloadKeys: {
        done: "theatrE_Done23",
        dateDone: "labDate_Done53",
        notDone: "theatrE_NotDone23",
        comment: "theatrE_Comment23",
      },
    },

    {
      type: "row",
      label: <span>{t("9. Open Heart Set")}</span>,
      payloadKeys: {
        done: "theatrE_Done24",
        dateDone: "labDate_Done54",
        notDone: "theatrE_NotDone24",
        comment: "theatrE_Comment24",
      },
    },
    {
      type: "row",
      label: <span>{t("10. Set of Bowls")}</span>,
      payloadKeys: {
        done: "theatrE_Done25",
        dateDone: "labDate_Done55",
        notDone: "theatrE_NotDone25",
        comment: "theatrE_Comment25",
      },
    },

    {
      type: "row",
      label: <span>{t("11. Oscillating saw(Sternum saw)")}</span>,
      payloadKeys: {
        done: "theatrE_Done26",
        dateDone: "labDate_Done56",
        notDone: "theatrE_NotDone26",
        comment: "theatrE_Comment26",
      },
    },
    {
      type: "row",
      label: <span>{t("12. T-connectors")}</span>,
      payloadKeys: {
        done: "theatrE_Done27",
        dateDone: "labDate_Done57",
        notDone: "labDate_Done57",
        comment: "theatrE_Comment27",
      },
    },
    {
      type: "row",
      label: <span>{t("13. Opsite drape")}</span>,
      payloadKeys: {
        done: "theatrE_Done28",
        dateDone: "labDate_Done58",
        notDone: "theatrE_NotDone28",
        comment: "theatrE_Comment28",
      },
    },

    {
      type: "row",
      label: <span>{t("14. Mitral Valve depending on operation")}</span>,
      payloadKeys: {
        done: "theatrE_Done29",
        dateDone: "labDate_Done59",
        notDone: "theatrE_NotDone29",
        comment: "theatrE_Comment29",
      },
    },

    {
      type: "row",
      label: <span>{t("15. Aortic valve")}</span>,
      payloadKeys: {
        done: "theatrE_Done30",
        dateDone: "labDate_Done60",
        notDone: "theatrE_NotDone30",
        comment: "theatrE_Comment30",
      },
    },
    {
      type: "row",
      label: <span>{t("16. Nasogastric tubes")}</span>,
      payloadKeys: {
        done: "theatrE_Done31",
        dateDone: "labDate_Done61",
        notDone: "theatrE_NotDone31",
        comment: "theatrE_Comment31",
      },
    },

    {
      type: "row",
      label: <span>{t("17. Urofix urine bag")}</span>,
      payloadKeys: {
        done: "theatrE_Done32",
        dateDone: "labDate_Done62",
        notDone: "theatrE_NotDone32",
        comment: "theatrE_Comment32",
      },
    },

    {
      type: "row",
      label: <span>{t("18. Certofix")}</span>,
      payloadKeys: {
        done: "theatrE_Done33",
        dateDone: "labDate_Done63",
        notDone: "theatrE_NotDone33",
        comment: "theatrE_Comment33",
      },
    },

    {
      type: "row",
      label: <span>{t("19. Dual Thoracic drain")}</span>,
      payloadKeys: {
        done: "theatrE_Done34",
        dateDone: "labDate_Done64",
        notDone: "theatrE_NotDone34",
        comment: "theatrE_Comment34",
      },
    },

    {
      type: "row",
      label: <span>{t("20. Aortic root cannulae")}</span>,
      payloadKeys: {
        done: "theatrE_Done35",
        dateDone: "labDate_Done65",
        notDone: "theatrE_NotDone35",
        comment: "theatrE_Comment35",
      },
    },

    {
      type: "row",
      label: <span>{t("21. Left Ventricular Vent")}</span>,
      payloadKeys: {
        done: "theatrE_Done36",
        dateDone: "labDate_Done66",
        notDone: "theatrE_NotDone36",
        comment: "theatrE_Comment36",
      },
    },

    {
      type: "row",
      label: <span>{t("22. Needles assorted sizes")}</span>,
      payloadKeys: {
        done: "theatrE_Done37",
        dateDone: "labDate_Done67",
        notDone: "theatrE_NotDone37",
        comment: "theatrE_Comment37",
      },
    },
    {
      type: "row",
      label: <span>{t("23. Gloves assorted sizes")}</span>,
      payloadKeys: {
        done: "theatrE_Done38",
        dateDone: "labDate_Done68",
        notDone: "theatrE_NotDone38",
        comment: "theatrE_Comment38",
      },
    },
    {
      type: "row",
      label: <span>{t("24. 5% dextrose solution")}</span>,
      payloadKeys: {
        done: "theatrE_Done39",
        dateDone: "labDate_Done69",
        notDone: "theatrE_NotDone39",
        comment: "theatrE_Comment39",
      },
    },
    {
      type: "row",
      label: <span>{t("25. DNS solution 500mls & 1000mls")}</span>,
      payloadKeys: {
        done: "theatrE_Done40",
        dateDone: "labDate_Done70",
        notDone: "theatrE_NotDone40",
        comment: "theatrE_Comment40",
      },
    },

    {
      type: "row",
      label: <span>{t("26. Ringers lactate 500mls & 1000mls")}</span>,
      payloadKeys: {
        done: "theatrE_Done41",
        dateDone: "labDate_Done71",
        notDone: "theatrE_NotDone41",
        comment: "theatrE_Comment41",
      },
    },
    {
      type: "row",
      label: <span>{t("27. Mannitol solution")}</span>,
      payloadKeys: {
        done: "theatrE_Done42",
        dateDone: "labDate_Done72",
        notDone: "theatrE_NotDone42",
        comment: "theatrE_Comment42",
      },
    },
    {
      type: "row",
      label: <span>{t("28. ACT Haemacron Bottles")}</span>,
      payloadKeys: {
        done: "theatrE_Done43",
        dateDone: "labDate_Done73",
        notDone: "theatrE_NotDone43",
        comment: "theatrE_Comment43",
      },
    },

    {
      type: "row",
      label: <span>{t("29. Primapore dressing")}</span>,
      payloadKeys: {
        done: "theatrE_Done44",
        dateDone: "labDate_Done74",
        notDone: "theatrE_NotDone44",
        comment: "theatrE_Comment44",
      },
    },

    {
      type: "row",
      label: <span>{t("30. Cannula dressing IV 3000")}</span>,
      payloadKeys: {
        done: "theatrE_Done45",
        dateDone: "labDate_Done75",
        notDone: "theatrE_NotDone45",
        comment: "theatrE_Comment45",
      },
    },

    {
      type: "row",
      label: <span>{t("31. Foleys catheter")}</span>,
      payloadKeys: {
        done: "theatrE_Done46",
        dateDone: "labDate_Done76",
        notDone: "theatrE_NotDone46",
        comment: "theatrE_Comment46",
      },
    },
    {
      type: "row",
      label: <span>{t("32. 3 way taps")}</span>,
      payloadKeys: {
        done: "theatrE_Done47",
        dateDone: "labDate_Done77",
        notDone: "theatrE_NotDone47",
        comment: "theatrE_Comment47",
      },
    },
    {
      type: "row",
      label: <span>{t("33. Arterial Cannula")}</span>,
      payloadKeys: {
        done: "theatrE_Done48",
        dateDone: "labDate_Done78",
        notDone: "theatrE_NotDone48",
        comment: "theatrE_Comment48",
      },
    },
    {
      type: "row",
      label: <span>{t("34. IV extensions line")}</span>,
      payloadKeys: {
        done: "theatrE_Done49",
        dateDone: "labDate_Done79",
        notDone: "theatrE_NotDone49",
        comment: "theatrE_Comment49",
      },
    },
    {
      type: "row",
      label: <span>{t("35. Betadine solution")}</span>,
      payloadKeys: {
        done: "theatrE_Done50",
        dateDone: "labDate_Done80",
        notDone: "theatrE_NotDone50",
        comment: "theatrE_Comment50",
      },
    },
    {
      type: "row",
      label: <span>{t("36. Hibitane in water")}</span>,
      payloadKeys: {
        done: "theatrE_Done51",
        dateDone: "labDate_Done81",
        notDone: "theatrE_NotDone51",
        comment: "theatrE_Comment51",
      },
    },
    {
      type: "row",
      label: <span>{t("37. Dacron Patch")}</span>,
      payloadKeys: {
        done: "theatrE_Done52",
        dateDone: "labDate_Done82",
        notDone: "theatrE_NotDone52",
        comment: "theatrE_Comment52",
      },
    },

    {
      type: "row",
      label: <span>{t("38. Gortex")}</span>,
      payloadKeys: {
        done: "theatrE_Done53",
        dateDone: "labDate_Done83",
        notDone: "theatrE_NotDone53",
        comment: "theatrE_Comment53",
      },
    },

    {
      type: "row",
      label: <span>{t("39. Glutaldehyde in sodium bicarbonate")}</span>,
      payloadKeys: {
        done: "theatrE_Done54",
        dateDone: "labDate_Done84",
        notDone: "theatrE_NotDone54",
        comment: "theatrE_Comment54",
      },
    },
    {
      type: "row",
      label: <span>{t("40. Slash frozen Ringers lactate")}</span>,
      payloadKeys: {
        done: "theatrE_Done55",
        dateDone: "labDate_Done85",
        notDone: "theatrE_NotDone55",
        comment: "theatrE_Comment55",
      },
    },

    {
      type: "row",
      label: <span>{t("41. Cannulas assorted sizes")}</span>,
      payloadKeys: {
        done: "theatrE_Done56",
        dateDone: "labDate_Done86",
        notDone: "theatrE_NotDone56",
        comment: "theatrE_Comment56",
      },
    },
    {
      type: "row",
      label: <span>{t("42. IV giving sets")}</span>,
      payloadKeys: {
        done: "theatrE_Done57",
        dateDone: "labDate_Done87",
        notDone: "theatrE_NotDone57",
        comment: "theatrE_Comment57",
      },
    },

    {
      type: "row",
      label: <span>{t("43. Blood giving sets")}</span>,
      payloadKeys: {
        done: "theatrE_Done58",
        dateDone: "labDate_Done88",
        notDone: "theatrE_NotDone58",
        comment: "theatrE_Comment58",
      },
    },

    {
      type: "row",
      label: <span>{t("44. Solusets")}</span>,
      payloadKeys: {
        done: "theatrE_Done59",
        dateDone: "labDate_Done89",
        notDone: "theatrE_NotDone59",
        comment: "theatrE_Comment59",
      },
    },
    {
      type: "row",
      label: <span>{t("45. Transfer needle")}</span>,
      payloadKeys: {
        done: "theatrE_Done60",
        dateDone: "labDate_Done90",
        notDone: "theatrE_NotDone60",
        comment: "theatrE_Comment60",
      },
    },
    {
      type: "row",
      label: <span>{t("46. Vickers Extension lines")}</span>,
      payloadKeys: {
        done: "theatrE_Done61",
        dateDone: "labDate_Done91",
        notDone: "theatrE_NotDone61",
        comment: "theatrE_Comment61",
      },
    },

    {
      type: "row",
      label: <span>{t("47. Aortic cannula")}</span>,
      payloadKeys: {
        done: "theatrE_Done62",
        dateDone: "labDate_Done92",
        notDone: "theatrE_NotDone62",
        comment: "theatrE_Comment62",
      },
    },
    {
      type: "row",
      label: <span>{t("48. Venous Cannula")}</span>,
      payloadKeys: {
        done: "theatrE_Done63",
        dateDone: "labDate_Done93",
        notDone: "theatrE_NotDone63",
        comment: "theatrE_Comment63",
      },
    },
    {
      type: "row",
      label: <span>{t("49. Intra cardiac suction")}</span>,
      payloadKeys: {
        done: "theatrE_Done64",
        dateDone: "labDate_Done94",
        notDone: "theatrE_NotDone64",
        comment: "theatrE_Comment64",
      },
    },

    {
      type: "row",
      label: <span>{t("50. Custom pack")}</span>,
      payloadKeys: {
        done: "theatrE_Done65",
        dateDone: "labDate_Done95",
        notDone: "theatrE_NotDone65",
        comment: "theatrE_Comment65",
      },
    },
    {
      type: "row",
      label: <span>{t("51. Oxygenator")}</span>,
      payloadKeys: {
        done: "theatrE_Done66",
        dateDone: "labDate_Done96",
        notDone: "theatrE_NotDone66",
        comment: "theatrE_Comment66",
      },
    },
    {
      type: "row",
      label: <span>{t("52. Underwater seal drain bottles (2)")}</span>,
      payloadKeys: {
        done: "theatrE_Done67",
        dateDone: "labDate_Done97",
        notDone: "theatrE_NotDone67",
        comment: "theatrE_Comment67",
      },
    },
    {
      type: "row",
      label: <span>{t("53. Thoracic catheters(2)")}</span>,
      payloadKeys: {
        done: "theatrE_Done68",
        dateDone: "labDate_Done98",
        notDone: "theatrE_NotDone68",
        comment: "theatrE_Comment68",
      },
    },
    {
      type: "row",
      label: <span>{t("54. Yankuar suction tubes")}</span>,
      payloadKeys: {
        done: "theatrE_Done69",
        dateDone: "labDate_Done99",
        notDone: "theatrE_NotDone69",
        comment: "theatrE_Comment69",
      },
    },
    {
      type: "row",
      label: <span>{t("55. Filter guards")}</span>,
      payloadKeys: {
        done: "theatrE_Done70",
        dateDone: "labDate_Done100",
        notDone: "theatrE_NotDone70",
        comment: "theatrE_Comment70",
      },
    },
    {
      type: "row",
      label: <span>{t("56. ET Tubes")}</span>,
      payloadKeys: {
        done: "theatrE_Done71",
        dateDone: "labDate_Done101",
        notDone: "theatrE_NotDone71",
        comment: "theatrE_Comment71",
      },
    },
    {
      type: "row",
      label: <span>{t("57. Catheter mount")}</span>,
      payloadKeys: {
        done: "theatrE_Done72",
        dateDone: "labDate_Done102",
        notDone: "theatrE_NotDone72",
        comment: "theatrE_Comment72",
      },
    },
    {
      type: "row",
      label: <span>{t("58. Bacterial filter")}</span>,
      payloadKeys: {
        done: "theatrE_Done73",
        dateDone: "labDate_Done103",
        notDone: "theatrE_NotDone73",
        comment: "theatrE_Comment73",
      },
    },
    {
      type: "row",
      label: <span>{t("59. A complete crash cart in the theatre")}</span>,
      payloadKeys: {
        done: "theatrE_Done74",
        dateDone: "labDate_Done104",
        notDone: "theatrE_NotDone74",
        comment: "theatrE_Comment74",
      },
    },
    {
      type: "row",
      label: <span>{t("60. A functioning defibrillator in the OR")}</span>,
      payloadKeys: {
        done: "theatrE_Done75",
        dateDone: "labDate_Done105",
        notDone: "theatrE_NotDone75",
        comment: "theatrE_Comment75",
      },
    },
    { type: "section", label: t("Drugs") },
    {
      type: "row",
      label: <span>{t("Propofol injection 5")}</span>,
      payloadKeys: {
        done: "theatrE_Done76",
        dateDone: "labDate_Done106",
        notDone: "theatrE_NotDone76",
        comment: "theatrE_Comment76",
      },
    },
    {
      type: "row",
      label: <span>{t("Fentanyl Injection 5")}</span>,
      payloadKeys: {
        done: "theatrE_Done77",
        dateDone: "labDate_Done107",
        notDone: "theatrE_NotDone77",
        comment: "theatrE_Comment77",
      },
    },

    {
      type: "row",
      label: <span>{t("Dormicum inj 5mg 1")}</span>,
      payloadKeys: {
        done: "theatrE_Done78",
        dateDone: "labDate_Done108",
        notDone: "theatrE_NotDone78",
        comment: "theatrE_Comment78",
      },
    },
    {
      type: "row",
      label: <span>{t("Dexamethasone inj 4mg 2")}</span>,
      payloadKeys: {
        done: "theatrE_Done79",
        dateDone: "labDate_Done109",
        notDone: "theatrE_NotDone79",
        comment: "theatrE_Comment79",
      },
    },
    {
      type: "row",
      label: <span>{t("Magensium sulphate 10mls 1")}</span>,
      payloadKeys: {
        done: "theatrE_Done80",
        dateDone: "labDate_Done110",
        notDone: "theatrE_NotDone80",
        comment: "theatrE_Comment80",
      },
    },
    {
      type: "row",
      label: <span>{t("Narcan Inj 0.4mls 1")}</span>,
      payloadKeys: {
        done: "theatrE_Done81",
        dateDone: "labDate_Done111",
        notDone: "theatrE_NotDone81",
        comment: "theatrE_Comment81",
      },
    },

    {
      type: "row",
      label: <span>{t("Annexate 1")}</span>,
      payloadKeys: {
        done: "theatrE_Done82",
        dateDone: "labDate_Done112",
        notDone: "theatrE_NotDone82",
        comment: "theatrE_Comment82",
      },
    },
    {
      type: "row",
      label: <span>{t("Zinacef Inj 750mg 2")}</span>,
      payloadKeys: {
        done: "theatrE_Done83",
        dateDone: "labDate_Done113",
        notDone: "theatrE_NotDone83",
        comment: "theatrE_Comment83",
      },
    },
    {
      type: "row",
      label: <span>{t("NA HCO3 10mls 10")}</span>,
      payloadKeys: {
        done: "theatrE_Done84",
        dateDone: "labDate_Done114",
        notDone: "theatrE_NotDone84",
        comment: "theatrE_Comment84",
      },
    },
    {
      type: "row",
      label: <span>{t("Lasix Inj 20mg 5")}</span>,
      payloadKeys: {
        done: "theatrE_Done85",
        dateDone: "labDate_Done115",
        notDone: "theatrE_NotDone85",
        comment: "theatrE_Comment85",
      },
    },

    {
      type: "row",
      label: <span>{t("Heparin 5000iu 5")}</span>,
      payloadKeys: {
        done: "theatrE_Done86",
        dateDone: "labDate_Done116",
        notDone: "theatrE_NotDone86",
        comment: "theatrE_Comment86",
      },
    },
    {
      type: "row",
      label: <span>{t("Atropine Inj 1mg 3")}</span>,
      payloadKeys: {
        done: "theatrE_Done87",
        dateDone: "labDate_Done117",
        notDone: "theatrE_NotDone87",
        comment: "theatrE_Comment87",
      },
    },
    {
      type: "row",
      label: <span>{t("Adrenalin 1:1000 5")}</span>,
      payloadKeys: {
        done: "theatrE_Done88",
        dateDone: "labDate_Done118",
        notDone: "theatrE_NotDone88",
        comment: "theatrE_Comment88",
      },
    },
    {
      type: "row",
      label: <span>{t("Cordarone 150mg")}</span>,
      payloadKeys: {
        done: "theatrE_Done89",
        dateDone: "labDate_Done119",
        notDone: "theatrE_NotDone89",
        comment: "theatrE_Comment89",
      },
    },
    {
      type: "row",
      label: <span>{t("Tracrium 50mg 5")}</span>,
      payloadKeys: {
        done: "theatrE_Done90",
        dateDone: "labDate_Done120",
        notDone: "theatrE_NotDone90",
        comment: "theatrE_Comment90",
      },
    },
    {
      type: "row",
      label: <span>{t("Morphine 10mg 1")}</span>,
      payloadKeys: {
        done: "theatrE_Done91",
        dateDone: "labDate_Done121",
        notDone: "theatrE_NotDone91",
        comment: "theatrE_Comment91",
      },
    },
    {
      type: "row",
      label: <span>{t("Hemsamic 500mg 5")}</span>,
      payloadKeys: {
        done: "theatrE_Done92",
        dateDone: "labDate_Done122",
        notDone: "theatrE_NotDone92",
        comment: "theatrE_Comment92",
      },
    },

    {
      type: "row",
      label: <span>{t("Mannitol 20% 1")}</span>,
      payloadKeys: {
        done: "theatrE_Done93",
        dateDone: "labDate_Done123",
        notDone: "theatrE_NotDone93",
        comment: "theatrE_Comment93",
      },
    },
    {
      type: "row",
      label: <span>{t("Ultiva Inj 2mg 2")}</span>,
      payloadKeys: {
        done: "theatrE_Done94",
        dateDone: "labDate_Done124",
        notDone: "theatrE_NotDone94",
        comment: "theatrE_Comment94",
      },
    },
    {
      type: "row",
      label: <span>{t("Inj Zofran 2")}</span>,
      payloadKeys: {
        done: "theatrE_Done95",
        dateDone: "labDate_Done125",
        notDone: "theatrE_NotDone95",
        comment: "theatrE_Comment95",
      },
    },
    {
      type: "row",
      label: <span>{t("Inj Kytril 2")}</span>,
      payloadKeys: {
        done: "theatrE_Done96",
        dateDone: "labDate_Done126",
        notDone: "dental_NotDone2",
        comment: "theatrE_Comment96",
      },
    },
    {
      type: "row",
      label: <span>{t("Inj Perfalgan 1gm 1")}</span>,
      payloadKeys: {
        done: "theatrE_Done97",
        dateDone: "labDate_Done127",
        notDone: "theatrE_NotDone97",
        comment: "theatrE_Comment97",
      },
    },
    {
      type: "row",
      label: <span>{t("Protamine Sulfate inj 10")}</span>,
      payloadKeys: {
        done: "theatrE_Done98",
        dateDone: "labDate_Done128",
        notDone: "theatrE_NotDone98",
        comment: "theatrE_Comment98",
      },
    },
    {
      type: "row",
      label: <span>{t("Cardioplegia inj 2")}</span>,
      payloadKeys: {
        done: "theatrE_Done99",
        dateDone: "labDate_Done129",
        notDone: "theatrE_NotDone99",
        comment: "theatrE_Comment99",
      },
    },
    {
      type: "row",
      label: <span>{t("Phenylephrine 1")}</span>,
      payloadKeys: {
        done: "theatrE_Done100",
        dateDone: "labDate_Done130",
        notDone: "theatrE_NotDone100",
        comment: "theatrE_Comment100",
      },
    },
    {
      type: "row",
      label: <span>{t("NTG 5mg 2")}</span>,
      payloadKeys: {
        done: "theatrE_Done101",
        dateDone: "labDate_Done131",
        notDone: "theatrE_NotDone101",
        comment: "theatrE_Comment101",
      },
    },
    {
      type: "row",
      label: <span>{t("Haesteril IV 6% 2")}</span>,
      payloadKeys: {
        done: "theatrE_Done102",
        dateDone: "labDate_Done132",
        notDone: "theatrE_NotDone102",
        comment: "theatrE_Comment102",
      },
    },
    {
      type: "row",
      label: <span>{t("Neostigmnie 2.5mg 1")}</span>,
      payloadKeys: {
        done: "theatrE_Done103",
        dateDone: "labDate_Done133",
        notDone: "theatrE_NotDone103",
        comment: "theatrE_Comment103",
      },
    },
    {
      type: "row",
      label: <span>{t("Whole blood 6 units")}</span>,
      payloadKeys: {
        done: "theatrE_Done104",
        dateDone: "labDate_Done134",
        notDone: "theatrE_NotDone104",
        comment: "theatrE_Comment104",
      },
    },

    {
      type: "row",
      label: <span>{t("FFP 4 units")}</span>,
      payloadKeys: {
        done: "theatrE_Done105",
        dateDone: "labDate_Done135",
        notDone: "theatrE_NotDone105",
        comment: "theatrE_Comment105",
      },
    },
  ];

  const THEAD = [
    { name: t("Sr.No"), width: "5%" },
    { name: t("ITEMS"), width: "2%" },
    { name: t("DATE DONE"), width: "28%" },
    { name: t("NOT DONE"), width: "" },
    { name: t("ACTION / COMMENTS"), width: "" },
  ];

  const [payload, savePayload] = useState({
    theatrE_Done1: "",
    labDate_Done30: "",
    theatrE_NotDone1: "",
    theatrE_Comment1: "",
    theatrE_Donenew1: "",
    labDate_Done31: "",
    theatrE_NotDonenew1: "",
    theatrE_Commentnew1: "",
    theatrE_Done2: "",
    labDate_Done32: "",
    theatrE_NotDone2: "",
    theatrE_Comment2: "",
    theatrE_Done3: "",
    labDate_Done33: "",
    theatrE_NotDone3: "",
    theatrE_Comment3: "",
    theatrE_Done4: "",
    labDate_Done34: "",
    theatrE_NotDone4: "",
    theatrE_Comment4: "",
    theatrE_Done5: "",
    labDate_Done35: "",
    theatrE_NotDone5: "",
    theatrE_Comment5: "",
    theatrE_Done6: "",
    labDate_Done36: "",
    theatrE_NotDone6: "",
    theatrE_Comment6: "",
    theatrE_Done7: "",
    labDate_Done37: "",
    theatrE_NotDone7: "",
    theatrE_Comment7: "",
    theatrE_Done8: "",
    labDate_Done38: "",
    theatrE_NotDone8: "",
    theatrE_Comment8: "",
    theatrE_Done9: "",
    labDate_Done39: "",
    theatrE_NotDone9: "",
    theatrE_Comment9: "",
    theatrE_Done10: "",
    labDate_Done40: "",
    theatrE_NotDone10: "",
    theatrE_Comment10: "",
    theatrE_Done11: "",
    labDate_Done41: "",
    theatrE_NotDone11: "",
    theatrE_Comment11: "",
    theatrE_Done12: "",
    labDate_Done42: "",
    theatrE_NotDone12: "",
    theatrE_Comment12: "",
    theatrE_Done13: "",
    labDate_Done43: "",
    theatrE_NotDone13: "",
    theatrE_Comment13: "",
    theatrE_Done14: "",
    labDate_Done44: "",
    theatrE_NotDone14: "",
    theatrE_Comment14: "",
    theatrE_Done15: "",
    labDate_Done45: "",
    theatrE_NotDone15: "",
    theatrE_Comment15: "",
    theatrE_Done16: "",
    labDate_Done46: "",
    theatrE_NotDone16: "",
    theatrE_Comment16: "",
    theatrE_Done17: "",
    labDate_Done47: "",
    theatrE_NotDone17: "",
    theatrE_Comment17: "",
    theatrE_Done18: "",
    labDate_Done48: "",
    theatrE_NotDone18: "",
    theatrE_Comment18: "",
    theatrE_Done19: "",
    labDate_Done49: "",
    theatrE_NotDone19: "",
    theatrE_Comment19: "",
    theatrE_Done20: "",
    labDate_Done50: "",
    theatrE_NotDone20: "",
    theatrE_Comment20: "",
    theatrE_Done21: "",
    labDate_Done51: "",
    theatrE_NotDone21: "",
    theatrE_Comment21: "",
    theatrE_Done22: "",
    labDate_Done52: "",
    theatrE_NotDone22: "",
    theatrE_Comment22: "",
    theatrE_Done23: "",
    labDate_Done53: "",
    theatrE_NotDone23: "",
    theatrE_Comment23: "",
    theatrE_Done24: "",
    labDate_Done54: "",
    theatrE_NotDone24: "",
    theatrE_Comment24: "",
    theatrE_Done25: "",
    labDate_Done55: "",
    theatrE_NotDone25: "",
    theatrE_Comment25: "",
    theatrE_Done26: "",
    labDate_Done56: "",
    theatrE_NotDone26: "",
    theatrE_Comment26: "",
    theatrE_Done27: "",
    labDate_Done57: "",
    theatrE_NotDone27: "",
    theatrE_Comment27: "",
    theatrE_Done28: "",
    labDate_Done58: "",
    theatrE_NotDone28: "",
    theatrE_Comment28: "",
    theatrE_Done29: "",
    labDate_Done59: "",
    theatrE_NotDone29: "",
    theatrE_Comment29: "",
    theatrE_Done30: "",
    labDate_Done60: "",
    theatrE_NotDone30: "",
    theatrE_Comment30: "",
    theatrE_Done31: "",
    labDate_Done61: "",
    theatrE_NotDone31: "",
    theatrE_Comment31: "",
    theatrE_Done32: "",
    labDate_Done62: "",
    theatrE_NotDone32: "",
    theatrE_Comment32: "",
    theatrE_Done33: "",
    labDate_Done63: "",
    theatrE_NotDone33: "",
    theatrE_Comment33: "",
    theatrE_Done34: "",
    labDate_Done64: "",
    theatrE_NotDone34: "",
    theatrE_Comment34: "",
    theatrE_Done35: "",
    labDate_Done65: "",
    theatrE_NotDone35: "",
    theatrE_Comment35: "",
    theatrE_Done36: "",
    labDate_Done66: "",
    theatrE_NotDone36: "",
    theatrE_Comment36: "",
    theatrE_Done37: "",
    labDate_Done67: "",
    theatrE_NotDone37: "",
    theatrE_Comment37: "",
    theatrE_Done38: "",
    labDate_Done68: "",
    theatrE_NotDone38: "",
    theatrE_Comment38: "",
    theatrE_Done39: "",
    labDate_Done69: "",
    theatrE_NotDone39: "",
    theatrE_Comment39: "",
    pid: "",
    tid: "",
    theatrE_Done40: "",
    labDate_Done70: "",
    theatrE_NotDone40: "",
    theatrE_Comment40: "",
    theatrE_Done41: "",
    labDate_Done71: "",
    theatrE_NotDone41: "",
    theatrE_Comment41: "",
    theatrE_Done42: "",
    labDate_Done72: "",
    theatrE_NotDone42: "",
    theatrE_Comment42: "",
    theatrE_Done43: "",
    labDate_Done73: "",
    theatrE_NotDone43: "",
    theatrE_Comment43: "",
    theatrE_Done44: "",
    labDate_Done74: "",
    theatrE_NotDone44: "",
    theatrE_Comment44: "",
    theatrE_Done45: "",
    labDate_Done75: "",
    theatrE_NotDone45: "",
    theatrE_Comment45: "",
    theatrE_Done46: "",
    labDate_Done76: "",
    theatrE_NotDone46: "",
    theatrE_Comment46: "",
    theatrE_Done47: "",
    labDate_Done77: "",
    theatrE_NotDone47: "",
    theatrE_Comment47: "",
    theatrE_Done48: "",
    labDate_Done78: "",
    theatrE_NotDone48: "",
    theatrE_Comment48: "",
    theatrE_Done49: "",
    labDate_Done79: "",
    theatrE_NotDone49: "",
    theatrE_Comment49: "",
    theatrE_Done50: "",
    labDate_Done80: "",
    theatrE_NotDone50: "",
    theatrE_Comment50: "",
    theatrE_Done51: "",
    labDate_Done81: "",
    theatrE_NotDone51: "",
    theatrE_Comment51: "",
    theatrE_Done52: "",
    labDate_Done82: "",
    theatrE_NotDone52: "",
    theatrE_Comment52: "",
    theatrE_Done53: "",
    labDate_Done83: "",
    theatrE_NotDone53: "",
    theatrE_Comment53: "",
    theatrE_Done54: "",
    labDate_Done84: "",
    theatrE_NotDone54: "",
    theatrE_Comment54: "",
    theatrE_Done55: "",
    labDate_Done85: "",
    theatrE_NotDone55: "",
    theatrE_Comment55: "",
    theatrE_Done56: "",
    labDate_Done86: "",
    theatrE_NotDone56: "",
    theatrE_Comment56: "",
    theatrE_Done57: "",
    labDate_Done87: "",
    theatrE_NotDone57: "",
    theatrE_Comment57: "",
    theatrE_Done58: "",
    labDate_Done88: "",
    theatrE_NotDone58: "",
    theatrE_Comment58: "",
    theatrE_Done59: "",
    labDate_Done89: "",
    theatrE_NotDone59: "",
    theatrE_Comment59: "",
    theatrE_Done60: "",
    labDate_Done90: "",
    theatrE_NotDone60: "",
    theatrE_Comment60: "",
    theatrE_Done61: "",
    labDate_Done91: "",
    theatrE_NotDone61: "",
    theatrE_Comment61: "",
    theatrE_Done62: "",
    labDate_Done92: "",
    theatrE_NotDone62: "",
    theatrE_Comment62: "",
    theatrE_Done63: "",
    labDate_Done93: "",
    theatrE_NotDone63: "",
    theatrE_Comment63: "",
    theatrE_Done64: "",
    labDate_Done94: "",
    theatrE_NotDone64: "",
    theatrE_Comment64: "",
    theatrE_Done65: "",
    labDate_Done95: "",
    theatrE_NotDone65: "",
    theatrE_Comment65: "",
    theatrE_Done66: "",
    labDate_Done96: "",
    theatrE_NotDone66: "",
    theatrE_Comment66: "",
    theatrE_Done67: "",
    labDate_Done97: "",
    theatrE_NotDone67: "",
    theatrE_Comment67: "",
    theatrE_Done68: "",
    labDate_Done98: "",
    theatrE_NotDone68: "",
    theatrE_Comment68: "",
    theatrE_Done69: "",
    labDate_Done99: "",
    theatrE_NotDone69: "",
    theatrE_Comment69: "",
    theatrE_Done70: "",
    labDate_Done100: "",
    theatrE_NotDone70: "",
    theatrE_Comment70: "",
    theatrE_Done71: "",
    labDate_Done101: "",
    theatrE_NotDone71: "",
    theatrE_Comment71: "",
    theatrE_Done72: "",
    labDate_Done102: "",
    theatrE_NotDone72: "",
    theatrE_Comment72: "",
    theatrE_Done73: "",
    labDate_Done103: "",
    theatrE_NotDone73: "",
    theatrE_Comment73: "",
    theatrE_Done74: "",
    labDate_Done104: "",
    theatrE_NotDone74: "",
    theatrE_Comment74: "",
    theatrE_Done75: "",
    labDate_Done105: "",
    theatrE_NotDone75: "",
    theatrE_Comment75: "",
    theatrE_Done76: "",
    labDate_Done106: "",
    theatrE_NotDone76: "",
    theatrE_Comment76: "",
    theatrE_Done77: "",
    labDate_Done107: "",
    theatrE_NotDone77: "",
    theatrE_Comment77: "",
    theatrE_Done78: "",
    labDate_Done108: "",
    theatrE_NotDone78: "",
    theatrE_Comment78: "",
    theatrE_Done79: "",
    labDate_Done109: "",
    theatrE_NotDone79: "",
    theatrE_Comment79: "",
    theatrE_Done80: "",
    labDate_Done110: "",
    theatrE_NotDone80: "",
    theatrE_Comment80: "",
    theatrE_Done81: "",
    labDate_Done111: "",
    theatrE_NotDone81: "",
    theatrE_Comment81: "",
    theatrE_Done82: "",
    labDate_Done112: "",
    theatrE_NotDone82: "",
    theatrE_Comment82: "",
    theatrE_Done83: "",
    labDate_Done113: "",
    theatrE_NotDone83: "",
    theatrE_Comment83: "",
    theatrE_Done84: "",
    labDate_Done114: "",
    theatrE_NotDone84: "",
    theatrE_Comment84: "",
    theatrE_Done85: "",
    labDate_Done115: "",
    theatrE_NotDone85: "",
    theatrE_Comment85: "",
    theatrE_Done86: "",
    labDate_Done116: "",
    theatrE_NotDone86: "",
    theatrE_Comment86: "",
    theatrE_Done87: "",
    labDate_Done117: "",
    theatrE_NotDone87: "",
    theatrE_Comment87: "",
    theatrE_Done88: "",
    labDate_Done118: "",
    theatrE_NotDone88: "",
    theatrE_Comment88: "",
    theatrE_Done89: "",
    labDate_Done119: "",
    theatrE_NotDone89: "",
    theatrE_Comment89: "",
    theatrE_Done90: "",
    labDate_Done120: "",
    theatrE_NotDone90: "",
    theatrE_Comment90: "",
    theatrE_Done91: "",
    labDate_Done121: "",
    theatrE_NotDone91: "",
    theatrE_Comment91: "",
    theatrE_Done92: "",
    labDate_Done122: "",
    theatrE_NotDone92: "",
    theatrE_Comment92: "",
    theatrE_Done93: "",
    labDate_Done123: "",
    theatrE_NotDone93: "",
    theatrE_Comment93: "",
    theatrE_Done94: "",
    labDate_Done124: "",
    theatrE_NotDone94: "",
    theatrE_Comment94: "",
    theatrE_Done95: "",
    labDate_Done125: "",
    theatrE_NotDone95: "",
    theatrE_Comment95: "",
    theatrE_Done96: "",
    labDate_Done126: "",
    theatrE_NotDone96: "",
    theatrE_Comment96: "",
    theatrE_Done97: "",
    labDate_Done127: "",
    theatrE_NotDone97: "",
    theatrE_Comment97: "",
    theatrE_Done98: "",
    labDate_Done128: "",
    theatrE_NotDone98: "",
    theatrE_Comment98: "",
    theatrE_Done99: "",
    labDate_Done129: "",
    theatrE_NotDone99: "",
    theatrE_Comment99: "",
    theatrE_Done100: "",
    labDate_Done130: "",
    theatrE_NotDone100: "",
    theatrE_Comment100: "",
    theatrE_Done101: "",
    labDate_Done131: "",
    theatrE_NotDone101: "",
    theatrE_Comment101: "",
    theatrE_Done102: "",
    labDate_Done132: "",
    theatrE_NotDone102: "",
    theatrE_Comment102: "",
    theatrE_Done103: "",
    labDate_Done133: "",
    theatrE_NotDone103: "",
    theatrE_Comment103: "",
    theatrE_Done104: "",
    labDate_Done134: "",
    theatrE_NotDone104: "",
    theatrE_Comment104: "",
    theatrE_Done105: "",
    labDate_Done135: "",
    theatrE_NotDone105: "",
    theatrE_Comment105: "",
  });

  const parseApiDate = (date) => {
    if (!date) return null;
    return new Date(date);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    savePayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchDishargeData = async () => {
    const res = await bindThreatreDataApi(transactionID, patientID);

    if (!res?.success || !res.data?.length) {
      setIsRecordExist(false);
      return;
    }

    const r = res.data[0];
    const mappedPayload = {};
    let itemIndex = 1;

    tableItems.forEach((item) => {
      if (item.type === "row" && item.payloadKeys) {
        const { done, dateDone, notDone, comment } = item.payloadKeys;

        mappedPayload[done] = r[`Item${itemIndex}_Done`] ?? "";
        mappedPayload[dateDone] = parseApiDate(r[`Item${itemIndex}_Date`]);
        mappedPayload[notDone] = r[`Item${itemIndex}_NotDone`] ?? "";
        mappedPayload[comment] = r[`Item${itemIndex}_Comment`] ?? "";

        itemIndex++;
      }
    });

    mappedPayload.pid = patientID;
    mappedPayload.tid = transactionID;

    savePayload(mappedPayload);
    setIsRecordExist(true);
  };

  useEffect(() => {
    fetchDishargeData();
  }, []);

  const handleSave = async () => {
    const savePayload = {
      pid: patientID,
      tid: transactionID,
    };

    tableItems.forEach((item) => {
      if (item.type === "row" && item.payloadKeys) {
        const { done, dateDone, notDone, comment } = item.payloadKeys;

        savePayload[done] = payload[done] || "";

        savePayload[dateDone] = payload[dateDone]
          ? moment(payload[dateDone]).format("YYYY-MM-DD")
          : "";

        savePayload[notDone] = payload[notDone] || "";
        savePayload[comment] = payload[comment] || "";
      }
    });
    const res = await save_TheatreApi(savePayload);

    if (res?.success) {
      notify(res.message, "success");
      fetchDishargeData();
    }
  };

  let srNo = 1;
  const TBODY = tableItems.map((item) => {
    if (item.type === "section") {
      return {
        "Sr.No": "",
        ITEMS: <b>{item.label}</b>,
        "DONE / DATE": "",
        "NOT DONE": "",
        "ACTION / COMMENTS": "",
      };
    }

    const { done, dateDone, notDone, comment } = item.payloadKeys;

    return {
      "Sr.No": srNo++,
      ITEMS: item.label,
      "DATE DONE": (
        <div className="row">
          <Input
            type="text"
            respclass={"col-xl-6 col-lg-6 col-md-6 col-6"}
            className="form-control"
            name={done}
            value={payload[done]}
            onChange={handleChange}
          />
          <DatePicker
            className="custom-calender"
            placeholder={VITE_DATE_FORMAT}
            name={dateDone}
            value={payload[dateDone]}
            handleChange={handleChange}
            respclass={"col-xl-6 col-lg-6 col-md-6 col-6"}
          />
        </div>
      ),
      "NOT DONE": (
        <Input
          type="text"
          name={notDone}
          className="form-control"
          value={payload[notDone]}
          onChange={handleChange}
        />
      ),
      "ACTION / COMMENTS": (
        <Input
          type="text"
          className="form-control"
          name={comment}
          value={payload[comment]}
          onChange={handleChange}
        />
      ),
    };
  });

  return (
    <>
      <div className="patient_registration card mt-2">
        <Tables thead={THEAD} tbody={TBODY} tableHeight={"tableHeight"} />
      </div>

      <div className="d-flex justify-content-end mb-2 mt-2">
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          {isRecordExist ? t("Update") : t("Save")}
        </button>
      </div>
    </>
  );
};

export default TheatreChecklist;
