import React, { useEffect, useRef, useState } from "react";
import { scribeConsultation } from "../../../utils/aiClinicalAI";
import { diagnosisText } from "../../../utils/aiClinicalLogic";

/**
 * Scribe: records the consultation (microphone), shows live captions where the browser can, and on Stop
 * sends the audio to the central AI, which writes a speaker-labelled transcript and a structured note.
 * The doctor can also type or paste a conversation. The note is applied section by section, only on Apply.
 */

const MAX_AUDIO_BYTES = 14 * 1024 * 1024;
const BARS = 34;

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

const SECTIONS = [
  ["chiefComplaint", "Chief Complaint"],
  ["historyOfPresentIllness", "History of Present Illness"],
  ["signsAndSymptoms", "Sign & Symptoms"],
  ["generalExamination", "General Examination"],
  ["systemicExamination", "Systematic Examination"],
  ["pastHistory", "Past History"],
  ["provisionalDiagnosis", "Provisional Diagnosis"],
  ["investigations", "Investigation(Lab & Radio)"],
  ["medicines", "Prescribed Medicine"],
  ["advice", "Doctor Advice"],
  ["notes", "Doctor Notes"],
  ["followUpDays", "Next Visit"],
];

const filled = (note, key) => {
  const v = note?.[key];
  return Array.isArray(v) ? v.length > 0 : !!v;
};

export default function AIScribe({ tr, ctx, store, put, applyToRx, setStatus }) {
  const saved = store.scribe || {};
  const [phase, setPhase] = useState("idle"); // idle | recording | working
  const [seconds, setSeconds] = useState(0);
  const [live, setLive] = useState("");
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState(saved.typed || "");
  const [error, setError] = useState("");
  const [picks, setPicks] = useState(() => new Set(SECTIONS.map(([k]) => k)));
  const [applied, setApplied] = useState(!!saved.applied);
  const rec = useRef({});
  const waveRef = useRef(null);

  const stopAll = () => {
    const r = rec.current;
    clearInterval(r.timer);
    cancelAnimationFrame(r.raf);
    try {
      r.recognition?.stop();
    } catch (e) {
      /* already stopped */
    }
    r.stream?.getTracks?.().forEach((tk) => tk.stop());
    r.audioCtx?.close?.().catch(() => {});
  };
  useEffect(() => () => stopAll(), []);

  const drawWave = () => {
    const r = rec.current;
    const bars = waveRef.current?.children;
    if (!r.analyser || !bars) return;
    const data = new Uint8Array(r.analyser.frequencyBinCount);
    r.analyser.getByteFrequencyData(data);
    const step = Math.max(1, Math.floor(data.length / BARS));
    for (let i = 0; i < bars.length; i += 1) {
      const v = data[i * step] / 255;
      bars[i].style.height = `${4 + v * 30}px`;
    }
    r.raf = requestAnimationFrame(drawWave);
  };

  const run = async (input) => {
    setPhase("working");
    setError("");
    setStatus({ mode: "thinking", text: "Writing the note" });
    try {
      const result = await scribeConsultation({ ...input, ctx });
      const has = SECTIONS.filter(([k]) => filled(result.note, k)).map(([k]) => k);
      setPicks(new Set(has));
      setApplied(false);
      put("scribe", { result, typed: input.transcriptText || "", applied: false });
      if (!result.transcript.length && !has.length) setError(tr("Nothing clinical was heard. Try again closer to the microphone, or type the conversation."));
    } catch (e) {
      setError(e?.message || tr("The AI could not be reached"));
    } finally {
      setPhase("idle");
      setStatus({ mode: "", text: "Ready" });
    }
  };

  const start = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === "undefined") {
      setError(tr("This browser cannot record audio. Type or paste the conversation instead."));
      setTyping(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"].find((m) => window.MediaRecorder.isTypeSupported?.(m)) || "";
      const recorder = new window.MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks = [];
      recorder.ondataavailable = (e) => e.data?.size && chunks.push(e.data);
      rec.current = { stream, recorder, chunks, mime: recorder.mimeType || mime || "audio/webm", captions: "" };

      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const audioCtx = new AC();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        audioCtx.createMediaStreamSource(stream).connect(analyser);
        rec.current.audioCtx = audioCtx;
        rec.current.analyser = analyser;
      }

      // Live captions where the browser offers speech recognition (Chrome, Edge). The AI still
      // transcribes the audio itself on Stop; captions are a fallback if the audio is too long.
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = navigator.language || "en-IN";
        recognition.onresult = (e) => {
          let finalText = "";
          let interim = "";
          for (let i = 0; i < e.results.length; i += 1) {
            if (e.results[i].isFinal) finalText += `${e.results[i][0].transcript} `;
            else interim += e.results[i][0].transcript;
          }
          rec.current.captions = finalText;
          setLive(`${finalText}${interim}`.slice(-400));
        };
        recognition.onend = () => {
          if (rec.current.recorder?.state === "recording") {
            try {
              recognition.start();
            } catch (e) {
              /* the browser stopped it for good */
            }
          }
        };
        recognition.onerror = () => {};
        try {
          recognition.start();
          rec.current.recognition = recognition;
        } catch (e) {
          /* captions are optional */
        }
      }

      recorder.start(1000);
      setSeconds(0);
      setLive("");
      rec.current.timer = setInterval(() => setSeconds((s) => s + 1), 1000);
      setPhase("recording");
      setStatus({ mode: "listening", text: "Listening to the consultation" });
      drawWave();
    } catch (e) {
      setError(tr("Microphone access was refused. Allow the microphone for this site, or type the conversation."));
    }
  };

  const stop = () => {
    const r = rec.current;
    if (!r.recorder) return;
    r.recorder.onstop = async () => {
      const blob = new Blob(r.chunks, { type: r.mime });
      stopAll();
      if (blob.size > MAX_AUDIO_BYTES) {
        if (r.captions?.trim()) {
          run({ transcriptText: r.captions });
          return;
        }
        setError(tr("The recording is too long to send. Record shorter parts, or type the conversation."));
        setPhase("idle");
        setStatus({ mode: "", text: "Ready" });
        return;
      }
      if (blob.size < 2000) {
        setError(tr("The recording is empty."));
        setPhase("idle");
        setStatus({ mode: "", text: "Ready" });
        return;
      }
      const audioBase64 = await blobToBase64(blob);
      run({ audioBase64, mimeType: r.mime });
    };
    r.recorder.stop();
    if (waveRef.current) [...waveRef.current.children].forEach((b) => (b.style.height = "4px"));
  };

  const result = saved.result;
  const note = result?.note;

  const togglePick = (key) =>
    setPicks((p) => {
      const n = new Set(p);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  const apply = async () => {
    if (!note) return;
    const on = (k) => picks.has(k) && filled(note, k);
    const ok = await applyToRx({
      texts: {
        "Chief Complaint": on("chiefComplaint") ? note.chiefComplaint : [],
        "Sign & Symptoms": on("signsAndSymptoms") ? note.signsAndSymptoms : [],
        "General Examination": on("generalExamination") ? note.generalExamination : [],
        "Systematic Examination": on("systemicExamination") ? note.systemicExamination : [],
        "Past History": on("pastHistory") ? note.pastHistory : [],
        "Provisional Diagnosis": on("provisionalDiagnosis") ? note.provisionalDiagnosis.map(diagnosisText) : [],
        "Doctor Advice": on("advice") ? note.advice : [],
        "Doctor Notes": on("notes") ? note.notes : [],
      },
      hpi: on("historyOfPresentIllness") ? note.historyOfPresentIllness : "",
      medicines: on("medicines") ? note.medicines : [],
      investigations: on("investigations") ? note.investigations : [],
      followUpDays: on("followUpDays") ? note.followUpDays : null,
    });
    if (ok) {
      setApplied(true);
      put("scribe", (s) => ({ ...s, applied: true }));
    }
  };

  const renderValue = (key) => {
    const v = note[key];
    if (key === "historyOfPresentIllness") return <div className="ccp-aitext" style={{ fontSize: 14 }}>{v}</div>;
    if (key === "followUpDays") return <div>{`${tr("In")} ${v} ${tr("days")}`}</div>;
    if (key === "provisionalDiagnosis")
      return v.map((d, i) => (
        <span className="ccp-chip" key={i}>
          {d.icd10 && <code>{d.icd10}</code>}
          {d.name}
          {d.confidence != null && <span className="ccp-conf">{d.confidence}%</span>}
        </span>
      ));
    if (key === "investigations") return v.map((d, i) => <span className="ccp-chip" key={i}>{d.name}</span>);
    if (key === "medicines")
      return (
        <ul style={{ paddingLeft: 16, margin: 0 }}>
          {v.map((m, i) => (
            <li key={i}>
              <b>{m.name}</b> {[m.dose, m.frequency, m.meal, m.duration].filter(Boolean).join(" · ")}
            </li>
          ))}
        </ul>
      );
    return (
      <ul style={{ paddingLeft: 16, margin: 0 }}>
        {v.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    );
  };

  const mm = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div>
      <p className="ccp-intro">
        {tr("AI listens to the consultation and turns it into a structured note. Nothing is added until you apply it.")}
      </p>
      <div className="ccp-rec">
        <button
          type="button"
          className={`ccp-recbtn${phase === "recording" ? " ccp-recbtn--live" : ""}`}
          onClick={phase === "recording" ? stop : start}
          disabled={phase === "working"}
          aria-label={phase === "recording" ? tr("Stop and write the note") : tr("Start listening")}
          title={phase === "recording" ? tr("Stop and write the note") : tr("Start listening")}
        >
          <i className={`fas ${phase === "recording" ? "fa-stop" : "fa-microphone"}`} />
        </button>
        <div className="ccp-wave" ref={waveRef} aria-hidden="true">
          {Array.from({ length: BARS }).map((_, i) => (
            <span key={i} />
          ))}
        </div>
        <span className="ccp-timer">{mm}</span>
      </div>
      {phase === "recording" && (
        <div className="ccp-live">{live || tr("Listening… speak normally; press stop when the consultation ends.")}</div>
      )}

      <div className="ccp-row" style={{ marginBottom: 8 }}>
        <button type="button" className="ccp-btn ccp-btn--sm" onClick={() => setTyping((v) => !v)} disabled={phase !== "idle"}>
          <i className="fas fa-keyboard" /> {typing ? tr("Hide text box") : tr("Type or paste the conversation")}
        </button>
      </div>
      {typing && (
        <div style={{ marginBottom: 10 }}>
          <textarea
            className="ccp-textarea"
            rows={5}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={tr("Doctor: What brings you in today?  Patient: Cough for three days…")}
          />
          <button
            type="button"
            className="ccp-btn ccp-btn--ai"
            style={{ marginTop: 6 }}
            disabled={!typed.trim() || phase !== "idle"}
            onClick={() => run({ transcriptText: typed })}
          >
            ✦ {tr("Structure the note")}
          </button>
        </div>
      )}

      {error && <div className="ccp-error">{error}</div>}

      {phase === "working" && (
        <div>
          <p className="ccp-intro" style={{ margin: "10px 0 2px" }}>{tr("Structuring the note…")}</p>
          <div className="ccp-shimmer" />
          <div className="ccp-shimmer" style={{ width: "80%" }} />
          <div className="ccp-shimmer" style={{ width: "60%" }} />
        </div>
      )}

      {phase !== "working" && result?.transcript?.length > 0 && (
        <details style={{ marginTop: 6 }}>
          <summary className="ccp-h4" style={{ cursor: "pointer", margin: "6px 0" }}>
            {tr("Transcript")} ({result.transcript.length})
          </summary>
          {result.transcript.map((l, i) => (
            <div key={i} className={`ccp-line ccp-line--${l.speaker.toLowerCase()}`}>
              <span className="ccp-line__who">{tr(l.speaker)}</span>
              <span>{l.text}</span>
            </div>
          ))}
        </details>
      )}

      {phase !== "working" && note && (
        <div className="ccp-notecard ccp-pop">
          <h5>
            <span className="ccp-spark">✦</span>
            {tr("Structured note ready")}
          </h5>
          {result.bullets.length > 0 && (
            <ul>
              {result.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
          {SECTIONS.filter(([k]) => filled(note, k)).map(([key, label]) => (
            <div key={key} className={`ccp-sec${picks.has(key) ? "" : " ccp-sec--off"}`}>
              <label className="ccp-sec__head">
                <input type="checkbox" checked={picks.has(key)} onChange={() => togglePick(key)} />
                {tr(label)}
                {Array.isArray(note[key]) && <small>{note[key].length}</small>}
              </label>
              <div className="ccp-sec__body">{renderValue(key)}</div>
            </div>
          ))}
          <button
            type="button"
            className={`ccp-btn ccp-btn--block ${applied ? "ccp-btn--done" : "ccp-btn--ai"}`}
            style={{ marginTop: 8 }}
            disabled={!picks.size}
            onClick={apply}
          >
            {applied ? `✓ ${tr("Applied - apply again to add anything new")}` : `✦ ${tr("Apply to consultation")}`}
          </button>
        </div>
      )}
    </div>
  );
}
