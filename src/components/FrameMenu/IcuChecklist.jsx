import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Tables from "../UI/customTable";
import Input from "../formComponent/Input";
import {
  bindICUDataApi,
  save_ICUApi,
} from "../../networkServices/nursingWardAPI";
import { notify } from "../../utils/utils";
import DatePicker from "../formComponent/DatePicker";
import moment from "moment";

const IcuChecklist = ({ data }) => {
  const { transactionID, patientID } = data || {};
  const { t } = useTranslation();
  const { VITE_DATE_FORMAT } = import.meta.env;

  const tableItems = [
    {
      type: "row",
      label: (
        <div>
          <div className="text-center fw-bold mb-1">{t("Pre-Operative")}</div>

          <div>
            {t("The ICU nurse should visit the patient pre operatively and take the")}
            <br />
            {t("patient on an orientation tour in the intensive care unit. The nurse")}
            <br />
            {t("also introduces the patient to the various machines that will be")}
            <br />
            {t("used in the post-operative period.")}
          </div>
        </div>
      ),
      payloadKeys: {
        done: "icU_Done1",
        dateDone: "labDate_Done136",
        notDone: "icU_NotDone1",
        comment: "icU_Comment1",
      },
    },
    {
      type: "row",
      label: (
        <span>
          {t("Post-Operative Bed preparation A complete admission bed made post op")}
        </span>
      ),
      payloadKeys: {
        done: "icU_Done2",
        dateDone: "labDate_Done137",
        notDone: "icU_NotDone2",
        comment: "icU_Comment2",
      },
    },
    {
      type: "row",
      label: (
        <span>
          {t("Bedside locker with all surgical consumables")} <br />
          {t("for any ICU patient per protocol")}
        </span>
      ),
      payloadKeys: {
        done: "icU_Done3",
        dateDone: "labDate_Done138",
        notDone: "icU_NotDone3",
        comment: "icU_Comment3",
      },
    },

    {
      type: "row",
      label: (
        <span>
          {t("Surgical consumables for Airway Management - Airways, suction")}
          <br />
          {t("catheters of assorted sizes Breathing Apparatus - Oxygen mask, nasal")}
          <br />
          {t("prongs Circulation devices such as assorted cannulas, IV 3000, 3 Way")}
          <br />
          {t("taps. intravenous and blood aiving sets")}
        </span>
      ),
      payloadKeys: {
        done: "icU_Done4",
        dateDone: "labDate_Done139",
        notDone: "icU_NotDone4",
        comment: "icU_Comment4",
      },
    },
    {
      type: "row",
      label: <span>{t("Complete suction unit")} </span>,
      payloadKeys: {
        done: "icU_Done5",
        dateDone: "labDate_Done140",
        notDone: "icU_NotDone5",
        comment: "icU_Comment5",
      },
    },
    {
      type: "row",
      label: (
        <span>
          {t("Surgical spirit, dry cotton swabs, hand sanitizer,")}
          <br /> {t("and aloves (non sterile and sterile.)")}
        </span>
      ),
      payloadKeys: {
        done: "icU_Done6",
        dateDone: "labDate_Done141",
        notDone: "icU_NotDone6",
        comment: "icU_Comment6",
      },
    },

    {
      type: "row",
      label: (
        <>
          <span className="fw-semibold">{t("Complete Cardiac Monitor")} </span>
          <ol className="mb-0 ps-3">
            <li>{t("ETCO2 sensor")}</li>
            <li>{t("SPO2 sensor")}</li>
            <li>{t("Ensure consent if fully signed")}</li>
            <li>{t("Temperature probe")}</li>
            <li>{t("Pressure Monitoring points (CVP and Arterial pressures)")}</li>
            <li>{t("All cables as above")}</li>
          </ol>
        </>
      ),
      payloadKeys: {
        done: "icU_Done7",
        dateDone: "labDate_Done142",
        notDone: "icU_NotDone7",
        comment: "icU_Comment7",
      },
    },

    {
      type: "row",
      label: (
        <>
          <ol className="mb-0 ps-3">
            <li>
              {t("Syringe and infusion pumps - 3 syringe pumps for medications")}
            </li>
            <li>{t("SPO2 sensor")}</li>
            <li>
              {t("Continuous infusions pump for intravenous maintenance fluids")}
            </li>
          </ol>
        </>
      ),
      payloadKeys: {
        done: "icU_Done8",
        dateDone: "labDate_Done143",
        notDone: "icU_NotDone8",
        comment: "icU_Comment8",
      },
    },

    {
      type: "row",
      label: (
        <span>
          {t("Ensure enough supply of assorted intravenous fluids Normal saline,")}
          <br /> {t("Hartmans solution, DNS, Haesteril, 5% dextrose")}
        </span>
      ),
      payloadKeys: {
        done: "icU_Done9",
        dateDone: "labDate_Done144",
        notDone: "icU_NotDone9",
        comment: "icU_Comment9",
      },
    },

    {
      type: "row",
      label: <span>{t("Cardiac charts")} </span>,
      payloadKeys: {
        done: "icU_Done10",
        dateDone: "labDate_Done145",
        notDone: "icU_NotDone10",
        comment: "icU_Comment10",
      },
    },

    {
      type: "row",
      label: <span>{t("ICU Nurses notes")} </span>,
      payloadKeys: {
        done: "icU_Done11",
        dateDone: "labDate_Done146",
        notDone: "icU_NotDone11",
        comment: "icU_Comment11",
      },
    },
    {
      type: "row",
      label: <span>{t("Complete crash cart next to the patient")}</span>,
      payloadKeys: {
        done: "icU_Done12",
        dateDone: "labDate_Done147",
        notDone: "icU_NotDone12",
        comment: "icU_Comment12",
      },
    },
    {
      type: "row",
      label: <span>{t("Functioning Defibrillator next to the patient")}</span>,
      payloadKeys: {
        done: "icU_Done13",
        dateDone: "labDate_Done148",
        notDone: "icU_NotDone13",
        comment: "icU_Comment13",
      },
    },
    ,
    { type: "section", label: t("Drugs") },
    {
      type: "row",
      label: <span>{t("a. Propofol")}</span>,
      payloadKeys: {
        done: "icU_Done14",
        dateDone: "labDate_Done149",
        notDone: "icU_NotDone14",
        comment: "icU_Comment14",
      },
    },
    {
      type: "row",
      label: <span>{t("b. Isoflurane")}</span>,
      payloadKeys: {
        done: "icU_Done15",
        dateDone: "labDate_Done150",
        notDone: "icU_NotDone15",
        comment: "icU_Comment15",
      },
    },

    {
      type: "row",
      label: <span>{t("C. Fentanyl")}</span>,
      payloadKeys: {
        done: "icU_Done16",
        dateDone: "labDate_Done151",
        notDone: "icU_NotDone16",
        comment: "icU_Comment16",
      },
    },
    {
      type: "row",
      label: <span>{t("d. Morphine")}</span>,
      payloadKeys: {
        done: "icU_Done17",
        dateDone: "labDate_Done152",
        notDone: "icU_NotDone17",
        comment: "icU_Comment17",
      },
    },
    {
      type: "row",
      label: <span>{t("e. Tracurium/Nimbex/Scoline")}</span>,
      payloadKeys: {
        done: "icU_Done18",
        dateDone: "labDate_Done153",
        notDone: "icU_NotDone18",
        comment: "icU_Comment18",
      },
    },
    {
      type: "row",
      label: <span>{t("f.Cardioplegia solution")}</span>,
      payloadKeys: {
        done: "icU_Done19",
        dateDone: "labDate_Done154",
        notDone: "icU_NotDone19",
        comment: "icU_Comment19",
      },
    },
    {
      type: "row",
      label: <span>{t("g. Assorted IV fluids")}</span>,
      payloadKeys: {
        done: "icU_Done20",
        dateDone: "labDate_Done155",
        notDone: "icU_NotDone20",
        comment: "icU_Comment20",
      },
    },
    {
      type: "row",
      label: <span>{t("h. Heparin")}</span>,
      payloadKeys: {
        done: "icU_Done21",
        dateDone: "labDate_Done156",
        notDone: "icU_NotDone21",
        comment: "icU_Comment21",
      },
    },
    {
      type: "row",
      label: <span>{t("i.Protamine sulphate")}</span>,
      payloadKeys: {
        done: "icU_Done22",
        dateDone: "labDate_Done157",
        notDone: "icU_NotDone22",
        comment: "icU_Comment22",
      },
    },
    {
      type: "row",
      label: <span>{t("j. Atropine")}</span>,
      payloadKeys: {
        done: "icU_Done23",
        dateDone: "labDate_Done158",
        notDone: "icU_NotDone23",
        comment: "icU_Comment23",
      },
    },
    {
      type: "row",
      label: <span>{t("k. Neostigmine")}</span>,
      payloadKeys: {
        done: "icU_Done24",
        dateDone: "labDate_Done159",
        notDone: "icU_NotDone24",
        comment: "icU_Comment24",
      },
    },

    {
      type: "row",
      label: <span>{t("I. Adrenalin")}</span>,
      payloadKeys: {
        done: "icU_Done25",
        dateDone: "labDate_Done160",
        notDone: "icU_NotDone25",
        comment: "icU_Comment25",
      },
    },
    {
      type: "row",
      label: <span>{t("m. Nitroglycerine")}</span>,
      payloadKeys: {
        done: "icU_Done26",
        dateDone: "labDate_Done161",
        notDone: "icU_NotDone26",
        comment: "icU_Comment26",
      },
    },
    {
      type: "row",
      label: <span>{t("n. Magnesium Sulphate")}</span>,
      payloadKeys: {
        done: "icU_Done27",
        dateDone: "labDate_Done162",
        notDone: "icU_NotDone27",
        comment: "icU_Comment27",
      },
    },
    {
      type: "row",
      label: <span>{t("o. Calcium Chloride")}</span>,
      payloadKeys: {
        done: "icU_Done28",
        dateDone: "labDate_Done163",
        notDone: "icU_NotDone28",
        comment: "icU_Comment28",
      },
    },
    {
      type: "row",
      label: <span>{t("p. Calcium gluconate")}</span>,
      payloadKeys: {
        done: "icU_Done29",
        dateDone: "labDate_Done164",
        notDone: "icU_NotDone29",
        comment: "icU_Comment29",
      },
    },
    {
      type: "row",
      label: <span>{t("q. IV Lignocaine")}</span>,
      payloadKeys: {
        done: "icU_Done30",
        dateDone: "labDate_Done165",
        notDone: "icU_NotDone30",
        comment: "icU_Comment30",
      },
    },
    {
      type: "row",
      label: (
        <div>
          <div className="text-center fw-bold mb-1">{t("Pre-Operative")}</div>

          <div>
            {t("The ICU nurse should visit the patient pre operatively and take the")}
            <br />
            {t("patient on an orientation tour in the intensive care unit. The nurse")}
            <br />
            {t("also introduces the patient to the various machines that will be")}
            <br />
            {t("used in the post-operative period.")}
          </div>
        </div>
      ),
      payloadKeys: {
        done: "icU_Done31",
        dateDone: "labDate_Done166",
        notDone: "icU_NotDone31",
        comment: "icU_Comment31",
      },
    },
    {
      type: "row",
      label: (
        <span>
          {t("Post-Operative Bed preparation A complete admission bed made post op")}{" "}
        </span>
      ),
      payloadKeys: {
        done: "icU_Done32",
        dateDone: "labDate_Done167",
        notDone: "icU_NotDone32",
        comment: "icU_Comment32",
      },
    },
    {
      type: "row",
      label: (
        <span>
          {t("Bedside locker with all surgical consumables")} <br />
          {t("for any ICU patient per protocol")}
        </span>
      ),
      payloadKeys: {
        done: "icU_Done33",
        dateDone: "labDate_Done168",
        notDone: "icU_NotDone33",
        comment: "icU_Comment33",
      },
    },

    {
      type: "row",
      label: (
        <span>
          {t("Surgical consumables for Airway Management - Airways, suction")}
          <br />
          {t("catheters of assorted sizes Breathing Apparatus - Oxygen mask, nasal")}
          <br />
          {t("prongs Circulation devices such as assorted cannulas, IV 3000, 3 Way")}
          <br />
          {t("taps. intravenous and blood aiving sets")}
        </span>
      ),
      payloadKeys: {
        done: "icU_Done34",
        dateDone: "labDate_Done169",
        notDone: "icU_NotDone34",
        comment: "icU_Comment34",
      },
    },
    {
      type: "row",
      label: <span>{t("Complete suction unit")} </span>,
      payloadKeys: {
        done: "icU_Done35",
        dateDone: "labDate_Done170",
        notDone: "icU_NotDone35",
        comment: "icU_Comment35",
      },
    },
    {
      type: "row",
      label: (
        <span>
          {t("Surgical spirit, dry cotton swabs, hand sanitizer,")}
          <br /> {t("and aloves (non sterile and sterile.)")}
        </span>
      ),
      payloadKeys: {
        done: "icU_Done36",
        dateDone: "labDate_Done171",
        notDone: "icU_NotDone36",
        comment: "icU_Comment36",
      },
    },

    {
      type: "row",
      label: (
        <>
          <span className="fw-semibold">{t("Complete Cardiac Monitor")} </span>
          <ol className="mb-0 ps-3">
            <li>{t("ETCO2 sensor")}</li>
            <li>{t("SPO2 sensor")}</li>
            <li>{t("Ensure consent if fully signed")}</li>
            <li>{t("Temperature probe")}</li>
            <li>{t("Pressure Monitoring points (CVP and Arterial pressures)")}</li>
            <li>{t("All cables as above")}</li>
          </ol>
        </>
      ),
      payloadKeys: {
        done: "icU_Done37",
        dateDone: "labDate_Done172",
        notDone: "icU_NotDone37",
        comment: "icU_Comment37",
      },
    },

    {
      type: "row",
      label: (
        <>
          <ol className="mb-0 ps-3">
            <li>
              {t("Syringe and infusion pumps - 3 syringe pumps for medications")}
            </li>
            <li>{t("SPO2 sensor")}</li>
            <li>
              {t("Continuous infusions pump for intravenous maintenance fluids")}
            </li>
          </ol>
        </>
      ),
      payloadKeys: {
        done: "icU_Done38",
        dateDone: "labDate_Done173",
        notDone: "icU_NotDone38",
        comment: "icU_Comment38",
      },
    },

    {
      type: "row",
      label: (
        <span>
          {t("Ensure enough supply of assorted intravenous fluids Normal saline,")}
          <br /> {t("Hartmans solution, DNS, Haesteril, 5% dextrose")}
        </span>
      ),
      payloadKeys: {
        done: "icU_Done39",
        dateDone: "labDate_Done174",
        notDone: "icU_NotDone39",
        comment: "icU_Comment39",
      },
    },

    {
      type: "row",
      label: <span>{t("Cardiac charts")} </span>,
      payloadKeys: {
        done: "icU_Done40",
        dateDone: "labDate_Done175",
        notDone: "icU_NotDone40",
        comment: "icU_Comment40",
      },
    },

    {
      type: "row",
      label: <span>{t("ICU Nurses notes")} </span>,
      payloadKeys: {
        done: "icU_Done41",
        dateDone: "labDate_Done176",
        notDone: "icU_NotDone41",
        comment: "icU_Comment41",
      },
    },
    {
      type: "row",
      label: <span>{t("Complete crash cart next to the patient")}</span>,
      payloadKeys: {
        done: "icU_Done42",
        dateDone: "labDate_Done177",
        notDone: "icU_NotDone42",
        comment: "icU_Comment42",
      },
    },
    {
      type: "row",
      label: <span>{t("Functioning Defibrillator next to the patient")}</span>,
      payloadKeys: {
        done: "icU_Done43",
        dateDone: "labDate_Done178",
        notDone: "icU_NotDone43",
        comment: "icU_Comment43",
      },
    },
    ,
    { type: "section", label: t("Drugs") },
    {
      type: "row",
      label: <span>{t("a. Propofol")}</span>,
      payloadKeys: {
        done: "icU_Done44",
        dateDone: "labDate_Done179",
        notDone: "icU_NotDone44",
        comment: "icU_Comment44",
      },
    },
    {
      type: "row",
      label: <span>{t("b. Isoflurane")}</span>,
      payloadKeys: {
        done: "icU_Done45",
        dateDone: "labDate_Done180",
        notDone: "icU_NotDone45",
        comment: "icU_Comment45",
      },
    },

    {
      type: "row",
      label: <span>{t("C. Fentanyl")}</span>,
      payloadKeys: {
        done: "icU_Done46",
        dateDone: "labDate_Done181",
        notDone: "icU_NotDone46",
        comment: "icU_Comment46",
      },
    },
    {
      type: "row",
      label: <span>{t("d. Morphine")}</span>,
      payloadKeys: {
        done: "icU_Done47",
        dateDone: "labDate_Done182",
        notDone: "icU_NotDone47",
        comment: "icU_Comment47",
      },
    },
    {
      type: "row",
      label: <span>{t("e. Tracurium/Nimbex/Scoline")}</span>,
      payloadKeys: {
        done: "icU_Done48",
        dateDone: "labDate_Done183",
        notDone: "icU_NotDone48",
        comment: "icU_Comment48",
      },
    },
    {
      type: "row",
      label: <span>{t("f.Cardioplegia solution")}</span>,
      payloadKeys: {
        done: "icU_Done49",
        dateDone: "labDate_Done184",
        notDone: "icU_NotDone49",
        comment: "icU_Comment49",
      },
    },
    {
      type: "row",
      label: <span>{t("g. Assorted IV fluids")}</span>,
      payloadKeys: {
        done: "icU_Done50",
        dateDone: "labDate_Done185",
        notDone: "icU_NotDone50",
        comment: "icU_Comment50",
      },
    },
    {
      type: "row",
      label: <span>{t("h. Heparin")}</span>,
      payloadKeys: {
        done: "icU_Done51",
        dateDone: "labDate_Done186",
        notDone: "icU_NotDone51",
        comment: "icU_Comment51",
      },
    },
    {
      type: "row",
      label: <span>{t("i.Protamine sulphate")}</span>,
      payloadKeys: {
        done: "icU_Done52",
        dateDone: "labDate_Done187",
        notDone: "icU_NotDone52",
        comment: "icU_Comment52",
      },
    },
    {
      type: "row",
      label: <span>{t("j. Atropine")}</span>,
      payloadKeys: {
        done: "icU_Done53",
        dateDone: "labDate_Done188",
        notDone: "icU_NotDone53",
        comment: "icU_Comment53",
      },
    },
    {
      type: "row",
      label: <span>{t("k. Neostigmine")}</span>,
      payloadKeys: {
        done: "icU_Done54",
        dateDone: "labDate_Done189",
        notDone: "icU_NotDone54",
        comment: "icU_Comment54",
      },
    },

    {
      type: "row",
      label: <span>{t("I. Adrenalin")}</span>,
      payloadKeys: {
        done: "icU_Done55",
        dateDone: "labDate_Done190",
        notDone: "icU_NotDone55",
        comment: "icU_Comment55",
      },
    },
    {
      type: "row",
      label: <span>{t("m. Nitroglycerine")}</span>,
      payloadKeys: {
        done: "icU_Done56",
        dateDone: "labDate_Done191",
        notDone: "icU_NotDone56",
        comment: "icU_Comment56",
      },
    },
    {
      type: "row",
      label: <span>{t("n. Magnesium Sulphate")}</span>,
      payloadKeys: {
        done: "icU_Done57",
        dateDone: "labDate_Done192",
        notDone: "icU_NotDone57",
        comment: "icU_Comment57",
      },
    },
    {
      type: "row",
      label: <span>{t("o. Calcium Chloride")}</span>,
      payloadKeys: {
        done: "icU_Done58",
        dateDone: "labDate_Done193",
        notDone: "icU_NotDone58",
        comment: "icU_Comment58",
      },
    },
    {
      type: "row",
      label: <span>{t("p. Calcium gluconate")}</span>,
      payloadKeys: {
        done: "icU_Done59",
        dateDone: "labDate_Done194",
        notDone: "icU_NotDone59",
        comment: "icU_Comment59",
      },
    },
    {
      type: "row",
      label: <span>{t("q. IV Lignocaine")}</span>,
      payloadKeys: {
        done: "icU_Done60",
        dateDone: "labDate_Done195",
        notDone: "icU_NotDone60",
        comment: "icU_Comment60",
      },
    },
  ];

  const THEAD = [
    { name: t("Sr.No"), width: "5%" },
    { name: t("ITEMS"), width: "2%" },
    { name: t("DATE DONE"), width: "" },
    { name: t("NOT DONE"), width: "15%" },
    { name: t("ACTION / COMMENTS"), width: "" },
  ];

  const [payload, savePayload] = useState({
    icU_Done1: "",
    labDate_Done136: "",
    icU_NotDone1: "",
    icU_Comment1: "",
    icU_Done2: "",
    labDate_Done137: "",
    icU_NotDone2: "",
    icU_Comment2: "",
    icU_Done3: "",
    labDate_Done138: "",
    icU_NotDone3: "",
    icU_Comment3: "",
    icU_Done4: "",
    labDate_Done139: "",
    icU_NotDone4: "",
    icU_Comment4: "",
    icU_Done5: "",
    labDate_Done140: "",
    icU_NotDone5: "",
    icU_Comment5: "",
    icU_Done6: "",
    labDate_Done141: "",
    icU_NotDone6: "",
    icU_Comment6: "",
    icU_Done7: "",
    labDate_Done142: "",
    icU_NotDone7: "",
    icU_Comment7: "",
    icU_Done8: "",
    labDate_Done143: "",
    icU_NotDone8: "",
    icU_Comment8: "",
    icU_Done9: "",
    labDate_Done144: "",
    icU_NotDone9: "",
    icU_Comment9: "",
    icU_Done10: "",
    labDate_Done145: "",
    icU_NotDone10: "",
    icU_Comment10: "",
    icU_Done11: "",
    labDate_Done146: "",
    icU_NotDone11: "",
    icU_Comment11: "",
    icU_Done12: "",
    labDate_Done147: "",
    icU_NotDone12: "",
    icU_Comment12: "",
    icU_Done13: "",
    labDate_Done148: "",
    icU_NotDone13: "",
    icU_Comment13: "",
    icU_Done14: "",
    labDate_Done149: "",
    icU_NotDone14: "",
    icU_Comment14: "",
    icU_Done15: "",
    labDate_Done150: "",
    icU_NotDone15: "",
    icU_Comment15: "",
    icU_Done16: "",
    labDate_Done151: "",
    icU_NotDone16: "",
    icU_Comment16: "",
    icU_Done17: "",
    labDate_Done152: "",
    icU_NotDone17: "",
    icU_Comment17: "",
    icU_Done18: "",
    labDate_Done153: "",
    icU_NotDone18: "",
    icU_Comment18: "",
    icU_Done19: "",
    labDate_Done154: "",
    icU_NotDone19: "",
    icU_Comment19: "",
    icU_Done20: "",
    labDate_Done155: "",
    icU_NotDone20: "",
    icU_Comment20: "",
    icU_Done21: "",
    labDate_Done156: "",
    icU_NotDone21: "",
    icU_Comment21: "",
    icU_Done22: "",
    labDate_Done157: "",
    icU_NotDone22: "",
    icU_Comment22: "",
    icU_Done23: "",
    labDate_Done158: "",
    icU_NotDone23: "",
    icU_Comment23: "",
    icU_Done24: "",
    labDate_Done159: "",
    icU_NotDone24: "",
    icU_Comment24: "",
    icU_Done25: "",
    labDate_Done160: "",
    icU_NotDone25: "",
    icU_Comment25: "",
    icU_Done26: "",
    labDate_Done161: "",
    icU_NotDone26: "",
    icU_Comment26: "",
    icU_Done27: "",
    labDate_Done162: "",
    icU_NotDone27: "",
    icU_Comment27: "",
    icU_Done28: "",
    labDate_Done163: "",
    icU_NotDone28: "",
    icU_Comment28: "",
    icU_Done29: "",
    labDate_Done164: "",
    icU_NotDone29: "",
    icU_Comment29: "",
    icU_Done30: "",
    labDate_Done165: "",
    icU_NotDone30: "",
    icU_Comment30: "",
    pid: "",
    tid: "",
    icU_Done31: "",
    labDate_Done166: "",
    icU_NotDone31: "",
    icU_Comment31: "",
    icU_Done32: "",
    labDate_Done167: "",
    icU_NotDone32: "",
    icU_Comment32: "",
    icU_Done33: "",
    labDate_Done168: "",
    icU_NotDone33: "",
    icU_Comment33: "",
    icU_Done34: "",
    labDate_Done169: "",
    icU_NotDone34: "",
    icU_Comment34: "",
    icU_Done35: "",
    labDate_Done170: "",
    icU_NotDone35: "",
    icU_Comment35: "",
    icU_Done36: "",
    labDate_Done171: "",
    icU_NotDone36: "",
    icU_Comment36: "",
    icU_Done37: "",
    labDate_Done172: "",
    icU_NotDone37: "",
    icU_Comment37: "",
    icU_Done38: "",
    labDate_Done173: "",
    icU_NotDone38: "",
    icU_Comment38: "",
    icU_Done39: "",
    labDate_Done174: "",
    icU_NotDone39: "",
    icU_Comment39: "",
    icU_Done40: "",
    labDate_Done175: "",
    icU_NotDone40: "",
    icU_Comment40: "",
    icU_Done41: "",
    labDate_Done176: "",
    icU_NotDone41: "",
    icU_Comment41: "",
    icU_Done42: "",
    labDate_Done177: "",
    icU_NotDone42: "",
    icU_Comment42: "",
    icU_Done43: "",
    labDate_Done178: "",
    icU_NotDone43: "",
    icU_Comment43: "",
    icU_Done44: "",
    labDate_Done179: "",
    icU_NotDone44: "",
    icU_Comment44: "",
    icU_Done45: "",
    labDate_Done180: "",
    icU_NotDone45: "",
    icU_Comment45: "",
    icU_Done46: "",
    labDate_Done181: "",
    icU_NotDone46: "",
    icU_Comment46: "",
    icU_Done47: "",
    labDate_Done182: "",
    icU_NotDone47: "",
    icU_Comment47: "",
    icU_Done48: "",
    labDate_Done183: "",
    icU_NotDone48: "",
    icU_Comment48: "",
    icU_Done49: "",
    labDate_Done184: "",
    icU_NotDone49: "",
    icU_Comment49: "",
    icU_Done50: "",
    labDate_Done185: "",
    icU_NotDone50: "",
    icU_Comment50: "",
    icU_Done51: "",
    labDate_Done186: "",
    icU_NotDone51: "",
    icU_Comment51: "",
    icU_Done52: "",
    labDate_Done187: "",
    icU_NotDone52: "",
    icU_Comment52: "",
    icU_Done53: "",
    labDate_Done188: "",
    icU_NotDone53: "",
    icU_Comment53: "",
    icU_Done54: "",
    labDate_Done189: "",
    icU_NotDone54: "",
    icU_Comment54: "",
    icU_Done55: "",
    labDate_Done190: "",
    icU_NotDone55: "",
    icU_Comment55: "",
    icU_Done56: "",
    labDate_Done191: "",
    icU_NotDone56: "",
    icU_Comment56: "",
    icU_Done57: "",
    labDate_Done192: "",
    icU_NotDone57: "",
    icU_Comment57: "",
    icU_Done58: "",
    labDate_Done193: "",
    icU_NotDone58: "",
    icU_Comment58: "",
    icU_Done59: "",
    labDate_Done194: "",
    icU_NotDone59: "",
    icU_Comment59: "",
    icU_Done60: "",
    labDate_Done195: "",
    icU_NotDone60: "",
    icU_Comment60: "",
  });
  const [isRecordExist, setIsRecordExist] = useState(false);

const parseApiDate = (dateStr) => {
    if (!dateStr) return null;

    const [datePart, timePart] = dateStr.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour = 0, minute = 0, second = 0] = (timePart || "")
      .split(":")
      .map(Number);

    return new Date(year, month - 1, day, hour, minute, second);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    savePayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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
    const res = await save_ICUApi(savePayload);

    if (res?.success) {
      notify(res.message, "success");
      fetchList();
    }
  };

 const fetchList = async () => {
  const res = await bindICUDataApi(transactionID, patientID);

  if (res?.success) {
    const r = res.data[0];

    savePayload({
      pid: patientID,
      tid: transactionID,

      icU_Done1: r.Item1_Done || "",
      labDate_Done136: parseApiDate(r.Item1_Date),
      icU_NotDone1: r.Item1_NotDone || "",
      icU_Comment1: r.Item1_Comment || "",

      icU_Done2: r.Item2_Done || "",
      labDate_Done137: parseApiDate(r.Item2_Date),
      icU_NotDone2: r.Item2_NotDone || "",
      icU_Comment2: r.Item2_Comment || "",

      icU_Done3: r.Item3_Done || "",
      labDate_Done138: parseApiDate(r.Item3_Date),
      icU_NotDone3: r.Item3_NotDone || "",
      icU_Comment3: r.Item3_Comment || "",

      icU_Done4: r.Item4_Done || "",
      labDate_Done139: parseApiDate(r.Item4_Date),
      icU_NotDone4: r.Item4_NotDone || "",
      icU_Comment4: r.Item4_Comment || "",

      icU_Done5: r.Item5_Done || "",
      labDate_Done140: parseApiDate(r.Item5_Date),
      icU_NotDone5: r.Item5_NotDone || "",
      icU_Comment5: r.Item5_Comment || "",

      icU_Done6: r.Item6_Done || "",
      labDate_Done141: parseApiDate(r.Item6_Date),
      icU_NotDone6: r.Item6_NotDone || "",
      icU_Comment6: r.Item6_Comment || "",

      icU_Done7: r.Item7_Done || "",
      labDate_Done142: parseApiDate(r.Item7_Date),
      icU_NotDone7: r.Item7_NotDone || "",
      icU_Comment7: r.Item7_Comment || "",

      icU_Done8: r.Item8_Done || "",
      labDate_Done143: parseApiDate(r.Item8_Date),
      icU_NotDone8: r.Item8_NotDone || "",
      icU_Comment8: r.Item8_Comment || "",

      icU_Done9: r.Item9_Done || "",
      labDate_Done144: parseApiDate(r.Item9_Date),
      icU_NotDone9: r.Item9_NotDone || "",
      icU_Comment9: r.Item9_Comment || "",

      icU_Done10: r.Item10_Done || "",
      labDate_Done145: parseApiDate(r.Item10_Date),
      icU_NotDone10: r.Item10_NotDone || "",
      icU_Comment10: r.Item10_Comment || "",

      icU_Done11: r.Item11_Done || "",
      labDate_Done146: parseApiDate(r.Item11_Date),
      icU_NotDone11: r.Item11_NotDone || "",
      icU_Comment11: r.Item11_Comment || "",

      icU_Done12: r.Item12_Done || "",
      labDate_Done147: parseApiDate(r.Item12_Date),
      icU_NotDone12: r.Item12_NotDone || "",
      icU_Comment12: r.Item12_Comment || "",

      icU_Done13: r.Item13_Done || "",
      labDate_Done148: parseApiDate(r.Item13_Date),
      icU_NotDone13: r.Item13_NotDone || "",
      icU_Comment13: r.Item13_Comment || "",

      icU_Done14: r.Item14_Done || "",
      labDate_Done149: parseApiDate(r.Item14_Date),
      icU_NotDone14: r.Item14_NotDone || "",
      icU_Comment14: r.Item14_Comment || "",

      icU_Done15: r.Item15_Done || "",
      labDate_Done150: parseApiDate(r.Item15_Date),
      icU_NotDone15: r.Item15_NotDone || "",
      icU_Comment15: r.Item15_Comment || "",

      icU_Done16: r.Item16_Done || "",
      labDate_Done151: parseApiDate(r.Item16_Date),
      icU_NotDone16: r.Item16_NotDone || "",
      icU_Comment16: r.Item16_Comment || "",

      icU_Done17: r.Item17_Done || "",
      labDate_Done152: parseApiDate(r.Item17_Date),
      icU_NotDone17: r.Item17_NotDone || "",
      icU_Comment17: r.Item17_Comment || "",

      icU_Done18: r.Item18_Done || "",
      labDate_Done153: parseApiDate(r.Item18_Date),
      icU_NotDone18: r.Item18_NotDone || "",
      icU_Comment18: r.Item18_Comment || "",

      icU_Done19: r.Item19_Done || "",
      labDate_Done154: parseApiDate(r.Item19_Date),
      icU_NotDone19: r.Item19_NotDone || "",
      icU_Comment19: r.Item19_Comment || "",

      icU_Done20: r.Item20_Done || "",
      labDate_Done155: parseApiDate(r.Item20_Date),
      icU_NotDone20: r.Item20_NotDone || "",
      icU_Comment20: r.Item20_Comment || "",

      icU_Done21: r.Item21_Done || "",
      labDate_Done156: parseApiDate(r.Item21_Date),
      icU_NotDone21: r.Item21_NotDone || "",
      icU_Comment21: r.Item21_Comment || "",

      icU_Done22: r.Item22_Done || "",
      labDate_Done157: parseApiDate(r.Item22_Date),
      icU_NotDone22: r.Item22_NotDone || "",
      icU_Comment22: r.Item22_Comment || "",

      icU_Done23: r.Item23_Done || "",
      labDate_Done158: parseApiDate(r.Item23_Date),
      icU_NotDone23: r.Item23_NotDone || "",
      icU_Comment23: r.Item23_Comment || "",

      icU_Done24: r.Item24_Done || "",
      labDate_Done159: parseApiDate(r.Item24_Date),
      icU_NotDone24: r.Item24_NotDone || "",
      icU_Comment24: r.Item24_Comment || "",

      icU_Done25: r.Item25_Done || "",
      labDate_Done160: parseApiDate(r.Item25_Date),
      icU_NotDone25: r.Item25_NotDone || "",
      icU_Comment25: r.Item25_Comment || "",

      icU_Done26: r.Item26_Done || "",
      labDate_Done161: parseApiDate(r.Item26_Date),
      icU_NotDone26: r.Item26_NotDone || "",
      icU_Comment26: r.Item26_Comment || "",

      icU_Done27: r.Item27_Done || "",
      labDate_Done162: parseApiDate(r.Item27_Date),
      icU_NotDone27: r.Item27_NotDone || "",
      icU_Comment27: r.Item27_Comment || "",

      icU_Done28: r.Item28_Done || "",
      labDate_Done163: parseApiDate(r.Item28_Date),
      icU_NotDone28: r.Item28_NotDone || "",
      icU_Comment28: r.Item28_Comment || "",

      icU_Done29: r.Item29_Done || "",
      labDate_Done164: parseApiDate(r.Item29_Date),
      icU_NotDone29: r.Item29_NotDone || "",
      icU_Comment29: r.Item29_Comment || "",

      icU_Done30: r.Item30_Done || "",
      labDate_Done165: parseApiDate(r.Item30_Date),
      icU_NotDone30: r.Item30_NotDone || "",
      icU_Comment30: r.Item30_Comment || "",

      icU_Done31: r.Item31_Done || "",
      labDate_Done166: parseApiDate(r.Item31_Date),
      icU_NotDone31: r.Item31_NotDone || "",
      icU_Comment31: r.Item31_Comment || "",

      icU_Done32: r.Item32_Done || "",
      labDate_Done167: parseApiDate(r.Item32_Date),
      icU_NotDone32: r.Item32_NotDone || "",
      icU_Comment32: r.Item32_Comment || "",

      icU_Done33: r.Item33_Done || "",
      labDate_Done168: parseApiDate(r.Item33_Date),
      icU_NotDone33: r.Item33_NotDone || "",
      icU_Comment33: r.Item33_Comment || "",

      icU_Done34: r.Item34_Done || "",
      labDate_Done169: parseApiDate(r.Item34_Date),
      icU_NotDone34: r.Item34_NotDone || "",
      icU_Comment34: r.Item34_Comment || "",

      icU_Done35: r.Item35_Done || "",
      labDate_Done170: parseApiDate(r.Item35_Date),
      icU_NotDone35: r.Item35_NotDone || "",
      icU_Comment35: r.Item35_Comment || "",

      icU_Done36: r.Item36_Done || "",
      labDate_Done171: parseApiDate(r.Item36_Date),
      icU_NotDone36: r.Item36_NotDone || "",
      icU_Comment36: r.Item36_Comment || "",

      icU_Done37: r.Item37_Done || "",
      labDate_Done172: parseApiDate(r.Item37_Date),
      icU_NotDone37: r.Item37_NotDone || "",
      icU_Comment37: r.Item37_Comment || "",

      icU_Done38: r.Item38_Done || "",
      labDate_Done173: parseApiDate(r.Item38_Date),
      icU_NotDone38: r.Item38_NotDone || "",
      icU_Comment38: r.Item38_Comment || "",

      icU_Done39: r.Item39_Done || "",
      labDate_Done174: parseApiDate(r.Item39_Date),
      icU_NotDone39: r.Item39_NotDone || "",
      icU_Comment39: r.Item39_Comment || "",

      icU_Done40: r.Item40_Done || "",
      labDate_Done175: parseApiDate(r.Item40_Date),
      icU_NotDone40: r.Item40_NotDone || "",
      icU_Comment40: r.Item40_Comment || "",

      icU_Done41: r.Item41_Done || "",
      labDate_Done176: parseApiDate(r.Item41_Date),
      icU_NotDone41: r.Item41_NotDone || "",
      icU_Comment41: r.Item41_Comment || "",

      icU_Done42: r.Item42_Done || "",
      labDate_Done177: parseApiDate(r.Item42_Date),
      icU_NotDone42: r.Item42_NotDone || "",
      icU_Comment42: r.Item42_Comment || "",

      icU_Done43: r.Item43_Done || "",
      labDate_Done178: parseApiDate(r.Item43_Date),
      icU_NotDone43: r.Item43_NotDone || "",
      icU_Comment43: r.Item43_Comment || "",

      icU_Done44: r.Item44_Done || "",
      labDate_Done179: parseApiDate(r.Item44_Date),
      icU_NotDone44: r.Item44_NotDone || "",
      icU_Comment44: r.Item44_Comment || "",

      icU_Done45: r.Item45_Done || "",
      labDate_Done180: parseApiDate(r.Item45_Date),
      icU_NotDone45: r.Item45_NotDone || "",
      icU_Comment45: r.Item45_Comment || "",

      icU_Done46: r.Item46_Done || "",
      labDate_Done181: parseApiDate(r.Item46_Date),
      icU_NotDone46: r.Item46_NotDone || "",
      icU_Comment46: r.Item46_Comment || "",

      icU_Done47: r.Item47_Done || "",
      labDate_Done182: parseApiDate(r.Item47_Date),
      icU_NotDone47: r.Item47_NotDone || "",
      icU_Comment47: r.Item47_Comment || "",

      icU_Done48: r.Item48_Done || "",
      labDate_Done183: parseApiDate(r.Item48_Date),
      icU_NotDone48: r.Item48_NotDone || "",
      icU_Comment48: r.Item48_Comment || "",

      icU_Done49: r.Item49_Done || "",
      labDate_Done184: parseApiDate(r.Item49_Date),
      icU_NotDone49: r.Item49_NotDone || "",
      icU_Comment49: r.Item49_Comment || "",

      icU_Done50: r.Item50_Done || "",
      labDate_Done185: parseApiDate(r.Item50_Date),
      icU_NotDone50: r.Item50_NotDone || "",
      icU_Comment50: r.Item50_Comment || "",

      icU_Done51: r.Item51_Done || "",
      labDate_Done186: parseApiDate(r.Item51_Date),
      icU_NotDone51: r.Item51_NotDone || "",
      icU_Comment51: r.Item51_Comment || "",

      icU_Done52: r.Item52_Done || "",
      labDate_Done187: parseApiDate(r.Item52_Date),
      icU_NotDone52: r.Item52_NotDone || "",
      icU_Comment52: r.Item52_Comment || "",

      icU_Done53: r.Item53_Done || "",
      labDate_Done188: parseApiDate(r.Item53_Date),
      icU_NotDone53: r.Item53_NotDone || "",
      icU_Comment53: r.Item53_Comment || "",

      icU_Done54: r.Item54_Done || "",
      labDate_Done189: parseApiDate(r.Item54_Date),
      icU_NotDone54: r.Item54_NotDone || "",
      icU_Comment54: r.Item54_Comment || "",

      icU_Done55: r.Item55_Done || "",
      labDate_Done190: parseApiDate(r.Item55_Date),
      icU_NotDone55: r.Item55_NotDone || "",
      icU_Comment55: r.Item55_Comment || "",

      icU_Done56: r.Item56_Done || "",
      labDate_Done191: parseApiDate(r.Item56_Date),
      icU_NotDone56: r.Item56_NotDone || "",
      icU_Comment56: r.Item56_Comment || "",

      icU_Done57: r.Item57_Done || "",
      labDate_Done192: parseApiDate(r.Item57_Date),
      icU_NotDone57: r.Item57_NotDone || "",
      icU_Comment57: r.Item57_Comment || "",

      icU_Done58: r.Item58_Done || "",
      labDate_Done193: parseApiDate(r.Item58_Date),
      icU_NotDone58: r.Item58_NotDone || "",
      icU_Comment58: r.Item58_Comment || "",

      icU_Done59: r.Item59_Done || "",
      labDate_Done194: parseApiDate(r.Item59_Date),
      icU_NotDone59: r.Item59_NotDone || "",
      icU_Comment59: r.Item59_Comment || "",

      icU_Done60: r.Item60_Done || "",
      labDate_Done195: parseApiDate(r.Item60_Date),
      icU_NotDone60: r.Item60_NotDone || "",
      icU_Comment60: r.Item60_Comment || "",
    });

    setIsRecordExist(true);
  }
};


  useEffect(() => {
    fetchList();
  }, []);

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
            className="form-control"
            respclass={"col-xl-6 col-lg-6 col-md-6 col-6"}
            name={done}
            value={payload[done]}
            onChange={handleChange}
          />
          <DatePicker
            className="custom-calender"
            respclass={"col-xl-6 col-lg-6 col-md-6 col-6"}
            placeholder={VITE_DATE_FORMAT}
            name={dateDone}
            value={payload[dateDone]}
            handleChange={handleChange}
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

export default IcuChecklist;
