import { createElement, useSyncExternalStore } from "react";
import { notify } from "./utils";

/**
 * AI on/off switches, set on the Vertex AI settings page (/edp-vertex-ai-setting).
 * The server keeps them (AISettings/GetAISettings) and refuses AI calls for a feature
 * that is off; here they hide the AI widgets and stop the calls before they leave.
 *
 * Every AI feature of the app is listed in AI_FEATURES. A new AI feature adds its
 * entry here and passes `feature: "<key>"` to getAIResponseAPI / GenerateFromFileAPI
 * (or wraps its widget with withAiFeature). A key never saved is on.
 */
export const AI_FEATURES = [
  { key: "patientRegistrationVoice", label: "Voice form filler", module: "Front Office · Patient Registration" },
  { key: "aadhaarAddress", label: "Aadhaar address cleanup", module: "Front Office · Patient Registration" },
  { key: "opdVoiceForm", label: "Voice form filler", module: "Front Office · OPD Booking" },
  { key: "ipdVoiceForm", label: "Voice form filler", module: "Billing · IPD" },
  { key: "doctorAssistant", label: "AI patient summary & doctor assistant", module: "Doctor · Consultation" },
  { key: "medicalAIAssistant", label: "Medical AI assistant (voice notes)", module: "Doctor · Consultation" },
  { key: "drugInteraction", label: "Drug & allergy interaction check", module: "Doctor · Prescription" },
  { key: "handwritingNotepad", label: "Handwriting recognition", module: "Doctor · Notepad" },
  { key: "dischargeSummary", label: "AI discharge summary", module: "IPD · Discharge Summary" },
  { key: "resultEntry", label: "AI report drafting", module: "Laboratory · Result Entry" },
  { key: "reportChat", label: "Chat with report", module: "Reports" },
  { key: "chatbot", label: "Patient chatbot", module: "Chatbot" },
  { key: "prescriptionReader", label: "Prescription reader", module: "Prescription Details" },
  { key: "pharmacyPrescription", label: "Prescription auto-fill", module: "Pharmacy · Patient Issue" },
  { key: "grnInvoice", label: "Invoice reader", module: "Inventory · GRN / Asset GRN" },
  { key: "quotationAutoFill", label: "Supplier quotation auto-fill", module: "Purchase · Quotation" },
  { key: "itemRateImport", label: "Rate list reader", module: "EDP · Set Item Rate" },
  { key: "ambulanceOdometer", label: "Odometer reader", module: "Ambulance · Issue Vehicle" },
  { key: "recruitmentResume", label: "Resume reader", module: "HR · Recruitment" },
  { key: "printDesigner", label: "AI layout from document", module: "HR · Print Designer" },
  { key: "mastersImport", label: "AI Excel import", module: "Masters" },
];

const CACHE_KEY = "aiSettings";

const readCache = () => {
  try {
    return JSON.parse(window.localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
};

const normalize = (value) => ({
  enabled: value?.enabled !== false,
  features: { ...(value?.features || {}) },
});

// Last known settings, so widgets render right on reload before the server answers.
let state = normalize(readCache());
const listeners = new Set();

export const setAiSettingsState = (value) => {
  state = normalize(value);
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable: the in-memory state still applies
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getState = () => state;

export const isAiFeatureEnabled = (key) =>
  state.enabled && (!key || state.features[key] !== false);

export const useAiSettings = () => useSyncExternalStore(subscribe, getState);

export const useAiFeature = (key) =>
  useSyncExternalStore(subscribe, () => isAiFeatureEnabled(key));

/** Renders `Component` only while AI feature `key` is on; `fallback` (or nothing) otherwise. */
export const withAiFeature = (key, Component, fallback = null) => {
  const AiFeatureGate = (props) =>
    useAiFeature(key) ? createElement(Component, props) : fallback;
  AiFeatureGate.displayName = `withAiFeature(${Component.displayName || Component.name || key})`;
  return AiFeatureGate;
};

export const AI_DISABLED_MESSAGE = "AI is turned off for this feature in AI Settings.";

// Callers retry failed AI calls, so one notice per feature per few seconds.
const lastNotice = {};

/** The response an AI API wrapper returns instead of calling the server when the feature is off. */
export const aiDisabledResponse = (key) => {
  const now = Date.now();
  if (!lastNotice[key] || now - lastNotice[key] > 5000) {
    lastNotice[key] = now;
    notify(AI_DISABLED_MESSAGE, "warn");
  }
  return { success: false, data: null, message: AI_DISABLED_MESSAGE };
};
