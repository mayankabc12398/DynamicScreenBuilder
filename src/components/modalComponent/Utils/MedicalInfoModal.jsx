import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../../UI/Heading";

/**
 * "Medical Information" popup - the patient's recorded diagnoses (ICD) and allergies.
 *
 * One shared component, mounted inside the project Modal by:
 *   - Pharmacy Issue / IPD Pharmacy Issue (when a patient is selected)
 *   - Medication Administration Record (ward)
 *   - View Consultation > patient details (doctor)
 * so every screen shows the same design.
 *
 * Data (Common/GetPatientMedicalInfo):
 *   diagnosisList[] { diagnosis (ICD code), diagnosisDesc, entryDate }
 *   allergyList[]   { allergies, entryDate }
 *
 * Layout: a summary strip (counts), then two cards side by side - diagnoses as a list of
 * ICD entries with the code as a badge, allergies as hazard chips. The same allergy
 * recorded on several visits is shown once with all its dates, so a long history does
 * not repeat the same word down the page. Section titles use the project Heading so the
 * hierarchy matches every other card in the app; styles are .rx-medinfo* in index.css.
 */

const text = (v) => (v === undefined || v === null ? "" : String(v).trim());

export default function MedicalInfoModal({ medicalData }) {
  const [t] = useTranslation();

  const diagnoses = useMemo(
    () =>
      (medicalData?.diagnosisList || []).map((d) => ({
        code: text(d?.diagnosis ?? d?.Diagnosis),
        desc: text(d?.diagnosisDesc ?? d?.DiagnosisDesc),
        date: text(d?.entryDate ?? d?.EntryDate),
      })),
    [medicalData],
  );

  const allergies = useMemo(() => {
    const groups = new Map();
    (medicalData?.allergyList || []).forEach((a) => {
      const name = text(a?.allergies ?? a?.Allergies);
      const date = text(a?.entryDate ?? a?.EntryDate);
      const key = name.toLowerCase();
      if (!groups.has(key)) groups.set(key, { name, dates: [] });
      if (date && !groups.get(key).dates.includes(date)) groups.get(key).dates.push(date);
    });
    // named allergies first, unnamed records last
    return [...groups.values()].sort((a, b) => (a.name ? 0 : 1) - (b.name ? 0 : 1));
  }, [medicalData]);

  const allergyRecords = medicalData?.allergyList?.length || 0;
  const hasAllergy = allergies.some((a) => a.name);

  return (
    <div className="rx-medinfo">
      <div className="rx-medinfo__summary">
        <span className="rx-medinfo__stat rx-medinfo__stat--dx">
          <i className="fas fa-stethoscope" aria-hidden="true"></i>
          <b>{diagnoses.length}</b> {t(diagnoses.length === 1 ? "Diagnosis" : "Diagnoses")}
        </span>
        <span className={`rx-medinfo__stat ${hasAllergy ? "rx-medinfo__stat--allergy" : "rx-medinfo__stat--ok"}`}>
          <i className={`fas ${hasAllergy ? "fa-exclamation-triangle" : "fa-check-circle"}`} aria-hidden="true"></i>
          <b>{allergyRecords}</b> {t(allergyRecords === 1 ? "Allergy" : "Allergies")}
        </span>
        {hasAllergy && (
          <span className="rx-medinfo__warn">{t("Check every medicine against the recorded allergies")}</span>
        )}
      </div>

      <div className="row">
        <div className="col-lg-7 col-12 rx-medinfo__col">
          <div className="card rx-medinfo__card rx-medinfo__card--dx">
            <Heading title={t("Diagnosis")} />
            {diagnoses.length === 0 ? (
              <div className="rx-medinfo__empty">{t("No diagnosis recorded")}</div>
            ) : (
              <ul className="rx-medinfo__list">
                {diagnoses.map((d, i) => (
                  <li key={`${d.code}-${d.date}-${i}`} className="rx-medinfo__dx">
                    <span className="rx-medinfo__code" title={t("ICD code")}>
                      {d.code || "—"}
                    </span>
                    <span className="rx-medinfo__desc">
                      {d.desc || <span className="rx-medinfo__muted">{t("No description")}</span>}
                    </span>
                    {d.date && (
                      <span className="rx-medinfo__date">
                        <i className="far fa-calendar-alt mr-1" aria-hidden="true"></i>
                        {d.date}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="col-lg-5 col-12 rx-medinfo__col">
          <div className={`card rx-medinfo__card ${hasAllergy ? "rx-medinfo__card--allergy" : "rx-medinfo__card--ok"}`}>
            <Heading title={t("Allergies")} />
            {allergies.length === 0 ? (
              <div className="rx-medinfo__empty">
                <i className="fas fa-check-circle mr-1" aria-hidden="true"></i>
                {t("No allergy recorded")}
              </div>
            ) : (
              <ul className="rx-medinfo__chips">
                {allergies.map((a, i) => (
                  <li
                    key={`${a.name}-${i}`}
                    className={`rx-medinfo__chip${a.name ? "" : " rx-medinfo__chip--blank"}`}
                  >
                    <span className="rx-medinfo__chipname">
                      <i className="fas fa-allergies mr-1" aria-hidden="true"></i>
                      {a.name || t("Allergy recorded without a name")}
                    </span>
                    {a.dates.length > 0 && (
                      <span className="rx-medinfo__chipdates">
                        {a.dates.map((d) => (
                          <span key={d} className="rx-medinfo__date">
                            {d}
                          </span>
                        ))}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
