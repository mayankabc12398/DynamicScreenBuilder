import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";

const FIELD_MAP = [
  { id: "Barcode", type: "text", keywords: ["barcode", "bar code", "scan code"] },
  { id: "Mobile", type: "text", keywords: ["mobile", "mobile number", "phone", "phone number", "contact", "contact number"] },
  { id: "PFirstName", type: "text", keywords: ["first name", "firstname", "first"] },
  { id: "PLastName", type: "text", keywords: ["last name", "lastname", "last", "surname"] },
  { id: "Age", type: "text", keywords: ["age"] },
  { id: "Email", type: "text", keywords: ["email", "e-mail", "mail"] },
  { id: "House_No", type: "text", keywords: ["local address", "address", "house", "house number", "location"] },
  {id: "ParmanentAddress", type: "text", keywords: ["permanent address", "permanent", "home address"]},
  { id: "ID_Proof_No", type: "text", keywords: ["id proof number", "proof number", "identity proof number"] },
  { id: "Staff_ID", type: "text", keywords: ["staff id", "staff", "employee id", "employee"] },
  { id: "Dependent_ID", type: "text", keywords: ["dependent id", "dependent"] },
  { id: "National_ID", type: "text", keywords: ["national id", "national", "national identity"] },
  { id: "Merge_Family_Number", type: "text", keywords: ["family number", "family", "merge family", "merge"] },
  { id: "KRA_PIN", type: "text", keywords: ["kra pin", "kra", "pin", "pin code"] },
  {id: "Pregnancy_Days", type: "text", keywords: ["pregnancy days", "pregnancy"]},

  {
    id: "Title",
    name: "Title",
    type: "select",
    apiType: 1,
    keywords: ["title", "salutation"],
    aliases: {
      mister: "mr",
      mr: "mr",
      "m r": "mr",
      missus: "mrs",
      mrs: "mrs",
      "m r s": "mrs",
      ms: "ms",
      "m s": "ms",
      miss: "miss",
      doctor: "dr",
      dr: "dr",
      "d r": "dr",
      professor: "prof",
      prof: "prof",
    },
  },
  {
    id: "Gender",
    name: "Gender",
    type: "select",
    apiType: 22,
    keywords: ["gender", "sex"],
  },
  {
    id: "MaritalStatus",
    name: "MaritalStatus",
    type: "select",
    apiType: 24,
    keywords: ["marital status", "marital"],
  },
  {
    id: "countryID",
    name: "countryID",
    type: "select",
    apiType: 7,
    keywords: ["country"],
  },
  {
    id: "StateID",
    name: "StateID",
    type: "select",
    apiType: 8,
    keywords: ["county", "state"],
  },
  {
    id: "districtID",
    name: "districtID",
    type: "select",
    apiType: 9,
    keywords: ["subcounty", "sub county", "district"],
  },
  {
    id: "documentName",
    name: "documentName",
    type: "select",
    apiType: 13,
    keywords: ["id proof name", "id proof type", "document name", "document type", "proof name"],
  },
  {
    id: "DOB",
    name: "DOB",
    type: "date",
    keywords: ["date of birth", "birth date", "dob"],
  },
];

const NUMERIC_FIELDS = new Set([
  "Mobile",
  "Barcode",
  "Age",
  "ID_Proof_No",
  "Staff_ID",
  "Dependent_ID",
  "National_ID",
  "Merge_Family_Number",
  "KRA_PIN",
]);

const MONTH_MAP = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

function normalizeText(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findFieldByKeyword(text) {
  const lower = normalizeText(text);

  for (const field of FIELD_MAP) {
    const sortedKeywords = [...field.keywords].sort((a, b) => b.length - a.length);
    for (const kw of sortedKeywords) {
      if (lower.includes(normalizeText(kw))) {
        return field;
      }
    }
  }

  return null;
}

function stripFieldKeyword(text, field) {
  let result = normalizeText(text);

  const sortedKeywords = [...field.keywords].sort((a, b) => b.length - a.length);
  for (const kw of sortedKeywords) {
    const normalizedKeyword = normalizeText(kw);
    if (result.includes(normalizedKeyword)) {
      result = result.replace(normalizedKeyword, "").trim();
      break;
    }
  }

  return result;
}

function focusField(id) {
  const el = document.getElementById(id);
  if (el) {
    el.focus?.();
    el.scrollIntoView?.({ behavior: "smooth", block: "center" });
    el.style.transition = "box-shadow 0.3s";
    el.style.boxShadow = "0 0 0 3px rgba(99,179,237,0.7)";
    setTimeout(() => {
      el.style.boxShadow = "";
    }, 2000);
  }
  return el;
}

function setNativeValue(el, value) {
  if (!el) return;

  const prototype = Object.getPrototypeOf(el);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  const setter = descriptor?.set;

  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }
}

function setTextFieldValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return false;

  setNativeValue(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function getNormalizedSearches(spokenValue, field) {
  const normalizedSpoken = normalizeText(spokenValue);
  const searches = new Set([normalizedSpoken]);

  if (field?.aliases) {
    Object.entries(field.aliases).forEach(([alias, canonical]) => {
      if (normalizeText(alias) === normalizedSpoken) {
        searches.add(normalizeText(canonical));
      }
    });
  }

  return [...searches];
}

function getMatchedOption(spokenValue, options = [], field = null) {
  const searches = getNormalizedSearches(spokenValue, field);
  if (!searches.length) return null;

  const getTexts = (option) =>
    [
      option?.label,
      option?.TextField,
      option?.name,
      option?.value,
      option?.ValueField,
    ]
      .filter((item) => item !== undefined && item !== null && item !== "")
      .map((item) => normalizeText(item));

  const exactMatch = options.find((option) =>
    getTexts(option).some((text) => searches.includes(text)),
  );
  if (exactMatch) return exactMatch;

  const startsWithMatch = options.find((option) =>
    getTexts(option).some((text) =>
      searches.some((search) => text.startsWith(search)),
    ),
  );
  if (startsWithMatch) return startsWithMatch;

  const includesMatch = options.find((option) =>
    getTexts(option).some((text) =>
      searches.some((search) => text.includes(search) || search.includes(text)),
    ),
  );
  if (includesMatch) return includesMatch;

  return null;
}

function selectOptionFromData(
  field,
  spokenValue,
  handleReactSelect,
  handleCustomReactSelect,
  getDynamicOptionData,
) {
  if (!field?.apiType || !spokenValue?.trim()) return false;

  const options = getDynamicOptionData?.(field.apiType) || [];
  if (!options.length) return false;

  const matchedOption = getMatchedOption(spokenValue, options, field);
  if (!matchedOption) return false;

  if (field.name === "Gender" || field.name === "Title") {
    handleCustomReactSelect?.(field.name, matchedOption);
  } else {
    handleReactSelect?.(field.name, matchedOption);
  }

  return matchedOption;
}

function parseVoiceDate(spokenValue) {
  const normalized = normalizeText(spokenValue);
  const parts = normalized.split(" ").filter(Boolean);

  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const year = parseInt(parts[2], 10);

  let month = MONTH_MAP[parts[1]];
  if (!month) {
    month = parseInt(parts[1], 10);
  }

  if (!day || !month || !year) return null;

  const parsed = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function VoiceFormFiller({
  handleReactSelect,
  handleCustomReactSelect,
  getDynamicOptionData,
  handleVoiceDOB,
}) {
  const [t] = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [statusMsg, setStatusMsg] = useState("Click mic to start");
  const [transcript, setTranscript] = useState("");
  const [pulseRing, setPulseRing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const recognitionRef = useRef(null);
  const activeFieldRef = useRef(null);
  const micStreamRef = useRef(null);
  const bufferRef = useRef("");
  const toastTimer = useRef(null);
  const isListeningRef = useRef(false);
  const isStoppingRef = useRef(false);

  activeFieldRef.current = activeField;

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2500);
  }, []);

  const stopRecognition = useCallback(() => {
  const rec = recognitionRef.current;

  isListeningRef.current = false;
  isStoppingRef.current = true;

  if (rec) {
    // Remove handlers first so old instance cannot restart itself
    rec.onstart = null;
    rec.onend = null;
    rec.onresult = null;
    rec.onerror = null;

    try {
      rec.abort();
    } catch (_) {}

    try {
      rec.stop();
    } catch (_) {}

    recognitionRef.current = null;
  }

  if (micStreamRef.current) {
    micStreamRef.current.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
  }

  setPulseRing(false);
  setTimeout(() => {
    isStoppingRef.current = false;
  }, 200);
}, []);

useEffect(() => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setStatusMsg("Browser not supported. Use Chrome.");
    return;
  }

  return () => {
    stopRecognition();
  };
}, [stopRecognition]);

const createRecognition = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const rec = new SpeechRecognition();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = "en-US";

  rec.onstart = () => {
    setPulseRing(true);
    setStatusMsg("Listening... say a field name");
  };

  rec.onend = () => {
    setPulseRing(false);

    if (isListeningRef.current && !isStoppingRef.current) {
      setTimeout(() => {
        if (isListeningRef.current && !isStoppingRef.current) {
          recognitionRef.current = createRecognition();
          try {
            recognitionRef.current.start();
          } catch (_) {}
        }
      }, 250);
    }
  };

  rec.onresult = (e) => {
    let interimText = "";
    let finalText = "";

    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += t;
      else interimText += t;
    }

    setTranscript(interimText || finalText);

    if (!finalText) return;

const spoken = finalText.trim();
if (!spoken) return;

    const currentFieldId = activeFieldRef.current;
      const detectedField = findFieldByKeyword(spoken);

      if (detectedField) {
        if (currentFieldId && bufferRef.current.trim()) {
          const previousField = FIELD_MAP.find((f) => f.id === currentFieldId);
          if (previousField?.type === "text") {
            setTextFieldValue(currentFieldId, bufferRef.current.trim());
          }
        }

        bufferRef.current = "";
        setActiveField(detectedField.id);
        activeFieldRef.current = detectedField.id;
        focusField(detectedField.id);
        setStatusMsg(`Filling: ${detectedField.id}`);
        showToast(`Active: ${detectedField.id}`);

        const inlineValue = stripFieldKeyword(spoken, detectedField);

        if (inlineValue) {
          if (detectedField.type === "select") {
            const selected = selectOptionFromData(
              detectedField,
              inlineValue,
              handleReactSelect,
              handleCustomReactSelect,
              getDynamicOptionData,
            );

            if (selected) {
              setStatusMsg(`Selecting: ${selected.label}`);
              showToast(`Selected ${selected.label}`);
            } else {
              setStatusMsg(`No match found for ${inlineValue}`);
              showToast(`No match for ${inlineValue}`);
            }
          } else if (detectedField.type === "date") {
            const parsedDate = parseVoiceDate(inlineValue);

            if (parsedDate) {
              handleVoiceDOB?.(parsedDate);
              setStatusMsg(`DOB set to ${formatDate(parsedDate)}`);
              showToast(`DOB: ${formatDate(parsedDate)}`);
            } else {
              setStatusMsg(`Invalid DOB: ${inlineValue}`);
              showToast(`Invalid DOB: ${inlineValue}`);
            }
          } else {
            bufferRef.current = inlineValue;
            setTextFieldValue(detectedField.id, inlineValue);
          }
        }

        return;
      }

      if (!currentFieldId) {
        setStatusMsg("Say a field name first");
        return;
      }

      const currentField = FIELD_MAP.find((f) => f.id === currentFieldId);
      if (!currentField) return;

      if (currentField.type === "select") {
        const selected = selectOptionFromData(
          currentField,
          spoken,
          handleReactSelect,
          handleCustomReactSelect,
          getDynamicOptionData,
        );

        if (selected) {
          setStatusMsg(`Selecting: ${selected.label}`);
          showToast(`Selected ${selected.label}`);
        } else {
          setStatusMsg(`No match found for ${spoken}`);
          showToast(`No match for ${spoken}`);
        }
      } else if (currentField.type === "date") {
        const parsedDate = parseVoiceDate(spoken);

        if (parsedDate) {
          handleVoiceDOB?.(parsedDate);
          setStatusMsg(`DOB set to ${formatDate(parsedDate)}`);
          showToast(`DOB: ${formatDate(parsedDate)}`);
        } else {
          setStatusMsg(`Invalid DOB: ${spoken}`);
          showToast(`Invalid DOB: ${spoken}`);
        }
      } else {
        const cleanSpoken = spoken.replace(/\s+/g, "");
  const isNumericField = NUMERIC_FIELDS.has(currentField.id);

  if (isNumericField) {
    bufferRef.current = (bufferRef.current + cleanSpoken).replace(/\s+/g, "");
  } else {
    bufferRef.current += (bufferRef.current ? " " : "") + spoken;
  }

  setTextFieldValue(currentField.id, bufferRef.current);
  setStatusMsg(`Filling: ${currentField.id}`);
      }


    // 🔴 IMPORTANT: keep your EXISTING logic from here
  };

  rec.onerror = (e) => {
    if (e.error !== "no-speech" && !isStoppingRef.current) {
      setStatusMsg("Error: " + e.error);
    }
  };

  return rec;
};

const toggleListening = useCallback(() => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setStatusMsg("Browser not supported. Use Chrome.");
    return;
  }

  if (!isListening) {
    const rec = createRecognition();
    // rec.continuous = true;
    // rec.interimResults = true;
    // rec.lang = "en-US";

    // rec.onstart = () => {
    //   setPulseRing(true);
    //   setStatusMsg("Listening... say a field name");
    // };

    // rec.onresult = (e) => {
    //   let interimText = "";
    //   let finalText = "";

    //   for (let i = e.resultIndex; i < e.results.length; i++) {
    //     const t = e.results[i][0].transcript;
    //     if (e.results[i].isFinal) finalText += t;
    //     else interimText += t;
    //   }

    //   setTranscript(interimText || finalText);

    //   const spoken = (finalText || interimText).trim();
    //   if (!spoken) return;
    //   const currentFieldId = activeFieldRef.current;
    //   const detectedField = findFieldByKeyword(spoken);

    //   if (detectedField) {
    //     if (currentFieldId && bufferRef.current.trim()) {
    //       const previousField = FIELD_MAP.find((f) => f.id === currentFieldId);
    //       if (previousField?.type === "text") {
    //         setTextFieldValue(currentFieldId, bufferRef.current.trim());
    //       }
    //     }

    //     bufferRef.current = "";
    //     setActiveField(detectedField.id);
    //     activeFieldRef.current = detectedField.id;
    //     focusField(detectedField.id);
    //     setStatusMsg(`Filling: ${detectedField.id}`);
    //     showToast(`Active: ${detectedField.id}`);

    //     const inlineValue = stripFieldKeyword(spoken, detectedField);

    //     if (inlineValue) {
    //       if (detectedField.type === "select") {
    //         const selected = selectOptionFromData(
    //           detectedField,
    //           inlineValue,
    //           handleReactSelect,
    //           handleCustomReactSelect,
    //           getDynamicOptionData,
    //         );

    //         if (selected) {
    //           setStatusMsg(`Selecting: ${selected.label}`);
    //           showToast(`Selected ${selected.label}`);
    //         } else {
    //           setStatusMsg(`No match found for ${inlineValue}`);
    //           showToast(`No match for ${inlineValue}`);
    //         }
    //       } else if (detectedField.type === "date") {
    //         const parsedDate = parseVoiceDate(inlineValue);

    //         if (parsedDate) {
    //           handleVoiceDOB?.(parsedDate);
    //           setStatusMsg(`DOB set to ${formatDate(parsedDate)}`);
    //           showToast(`DOB: ${formatDate(parsedDate)}`);
    //         } else {
    //           setStatusMsg(`Invalid DOB: ${inlineValue}`);
    //           showToast(`Invalid DOB: ${inlineValue}`);
    //         }
    //       } else {
    //         bufferRef.current = inlineValue;
    //         setTextFieldValue(detectedField.id, inlineValue);
    //       }
    //     }

    //     return;
    //   }

    //   if (!currentFieldId) {
    //     setStatusMsg("Say a field name first");
    //     return;
    //   }

    //   const currentField = FIELD_MAP.find((f) => f.id === currentFieldId);
    //   if (!currentField) return;

    //   if (currentField.type === "select") {
    //     const selected = selectOptionFromData(
    //       currentField,
    //       spoken,
    //       handleReactSelect,
    //       handleCustomReactSelect,
    //       getDynamicOptionData,
    //     );

    //     if (selected) {
    //       setStatusMsg(`Selecting: ${selected.label}`);
    //       showToast(`Selected ${selected.label}`);
    //     } else {
    //       setStatusMsg(`No match found for ${spoken}`);
    //       showToast(`No match for ${spoken}`);
    //     }
    //   } else if (currentField.type === "date") {
    //     const parsedDate = parseVoiceDate(spoken);

    //     if (parsedDate) {
    //       handleVoiceDOB?.(parsedDate);
    //       setStatusMsg(`DOB set to ${formatDate(parsedDate)}`);
    //       showToast(`DOB: ${formatDate(parsedDate)}`);
    //     } else {
    //       setStatusMsg(`Invalid DOB: ${spoken}`);
    //       showToast(`Invalid DOB: ${spoken}`);
    //     }
    //   } else {
    //     bufferRef.current += (bufferRef.current ? " " : "") + spoken;
    //     setTextFieldValue(currentField.id, bufferRef.current);
    //     setStatusMsg(`Filling: ${currentField.id}`);
    //   }
    // };

    // rec.onerror = (e) => {
    //   if (e.error !== "no-speech" && !isStoppingRef.current) {
    //     setStatusMsg("Error: " + e.error);
    //   }
    // };

    recognitionRef.current = rec;
    bufferRef.current = "";
    setActiveField(null);
    setTranscript("");

    isListeningRef.current = true;
    isStoppingRef.current = false;
    setIsListening(true);

    try {
      rec.start();
    } catch (_) {}

    setStatusMsg("Listening... say a field name");
  } else {
    setIsListening(false);
    setActiveField(null);
    setTranscript("");
    setStatusMsg("Click mic to start");
    stopRecognition();
    showToast(t("Stopped"));
  }
}, [
  isListening,
  showToast,
  stopRecognition,
  handleReactSelect,
  handleCustomReactSelect,
  getDynamicOptionData,
  handleVoiceDOB,
]);


  return (
    <>
      <div style={styles.fabWrap}>
        {pulseRing && (
          <>
            <span style={{ ...styles.ring, animationDelay: "0s" }} />
            <span style={{ ...styles.ring, animationDelay: "0.4s" }} />
          </>
        )}

        {showTooltip && (
          <div style={styles.tooltip}>
            {isListening ? t("Stop voice input") : t("Start voice input")}
          </div>
        )}

        <button
          type="button"
          onClick={toggleListening}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          title={isListening ? "Stop" : "Start voice input"}
          style={{
            ...styles.fab,
            background: isListening
              ? "linear-gradient(135deg,#f56565,#c53030)"
              : "linear-gradient(135deg,#4299e1,#2b6cb0)",
            boxShadow: isListening
              ? "0 4px 24px rgba(197,48,48,0.55)"
              : "0 4px 24px rgba(66,153,225,0.55)",
          }}
        >
          {isListening ? (
            <svg viewBox="0 0 24 24" style={styles.icon}>
              <rect x="6" y="6" width="12" height="12" rx="2" fill="white" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" style={styles.icon}>
              <path fill="white" d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 17.93V21H9v2h6v-2h-2v-2.07A8.001 8.001 0 0 0 20 11h-2a6 6 0 0 1-12 0H4a8.001 8.001 0 0 0 7 6.93z" />
            </svg>
          )}
        </button>
      </div>

      {isListening && (
        <div style={styles.hud}>
          <div style={styles.hudStatus}>{statusMsg}</div>
          {transcript && (
            <div style={styles.hudTranscript}>
              <span style={styles.hudLabel}>{t("Hearing:")} </span>
              <span style={styles.hudText}>{transcript}</span>
            </div>
          )}
          {activeField && (
            <div style={styles.hudField}>
              <span style={styles.hudLabel}>{t("Active field:")} </span>
              <span style={styles.hudFieldName}>{activeField.replace(/_/g, " ")}</span>
            </div>
          )}
        </div>
      )}

      {toastMsg && <div style={styles.toast}>{toastMsg}</div>}

      <style>{`
        @keyframes vff-ring {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes vff-fadein {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes vff-toast {
          0%   { opacity:0; transform:translateX(-50%) translateY(10px); }
          15%  { opacity:1; transform:translateX(-50%) translateY(0); }
          80%  { opacity:1; }
          100% { opacity:0; }
        }
      `}</style>
    </>
  );
}

const styles = {
  fabWrap: {
    // position: "fixed",
    // bottom: "32px",
    // right: "32px",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "12px",
  },
  fab: {
    // width: "62px",
    // height: "62px",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.15s, box-shadow 0.3s",
    outline: "none",
    position: "relative",
    zIndex: 2,
  },
  icon: {
    width: "22px",
    height: "22px",
  },
  ring: {
    position: "absolute",
    width: "62px",
    height: "62px",
    borderRadius: "50%",
    background: "rgba(66,153,225,0.35)",
    animation: "vff-ring 1.4s ease-out infinite",
    zIndex: 1,
  },
  tooltip: {
    position: "absolute",
    bottom: "22px",
    right: "0",
    background: "#1a202c",
    color: "#e2e8f0",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    whiteSpace: "nowrap",
    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
    animation: "vff-fadein 0.2s ease",
    zIndex: 3,
  },
  hud: {
    position: "fixed",
    bottom: "108px",
    right: "24px",
    background: "rgba(17,24,39,0.92)",
    backdropFilter: "blur(8px)",
    color: "#f7fafc",
    borderRadius: "14px",
    padding: "14px 18px",
    minWidth: "240px",
    maxWidth: "320px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    zIndex: 99998,
    animation: "vff-fadein 0.25s ease",
    fontFamily: "system-ui, sans-serif",
    fontSize: "13px",
    lineHeight: "1.6",
  },
  hudStatus: {
    fontWeight: "600",
    fontSize: "14px",
    marginBottom: "6px",
    color: "#90cdf4",
  },
  hudTranscript: {
    background: "rgba(255,255,255,0.07)",
    borderRadius: "8px",
    padding: "6px 10px",
    marginTop: "6px",
    wordBreak: "break-word",
  },
  hudField: {
    marginTop: "8px",
  },
  hudLabel: {
    color: "#a0aec0",
    fontSize: "12px",
  },
  hudText: {
    color: "#fefce8",
    fontStyle: "italic",
  },
  hudFieldName: {
    color: "#68d391",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  toast: {
    position: "fixed",
    bottom: "108px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#1a202c",
    color: "#f7fafc",
    padding: "10px 22px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: "500",
    boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
    zIndex: 99999,
    animation: "vff-toast 2.5s ease forwards",
    whiteSpace: "nowrap",
    fontFamily: "system-ui, sans-serif",
  },
};