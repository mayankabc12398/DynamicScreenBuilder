import { APIBaseURL } from "../networkServices/axiosInstance";

/**
 * Central AI for the browser (4 Nov 2026). No AI key lives in the front end any more.
 *
 * Every AI feature posts its usual Gemini generateContent body; aiFetch sends it to the API (AI/Generate),
 * which adds the key from fin_global_resources (UseAI / AIName / AIKey - Vertex service account or Gemini key)
 * and returns Gemini's response JSON unchanged. Callers keep reading data.candidates[0].content.parts[0].text.
 * The model is chosen centrally (AIName); the model a screen asks for is ignored.
 *
 * openAiCompatFetch keeps the two OpenAI-shaped callers (chat completions, Whisper transcription) working
 * on the same central AI: it converts the request and answers in OpenAI's shape.
 */

/** Kept so existing `fetch(URL, ...)` call shapes read naturally; the URL is not used. */
export const AI_GENERATE_URL = "hospedia-ai://generate";

const readLocal = (k) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : null;
  } catch {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  }
};

const proxyUrl = () => {
  const user = readLocal("userData");
  const base = String(APIBaseURL || "").replace(/\/$/, "");
  return `${base}/AI/Generate${user?.userValidateID ? `?userValidateID=${encodeURIComponent(user.userValidateID)}` : ""}`;
};

/** fetch() replacement for Gemini generateContent calls. Returns a real Response. */
export const aiFetch = (_ignoredUrl, options = {}) => {
  const token = readLocal("token");
  const headers = { ...(options.headers || {}), "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return window.fetch(proxyUrl(), { ...options, method: "POST", headers, credentials: "include" });
};

/** Prompt (and optional parts) in, text out. Throws with the server's message on failure. */
export const aiText = async (prompt, { temperature = 0.2, json = false, parts = [], system } = {}) => {
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }, ...parts] }],
    generationConfig: { temperature, ...(json ? { responseMimeType: "application/json" } : {}) },
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
  };
  const res = await aiFetch(AI_GENERATE_URL, { body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `AI error ${res.status}`);
  return (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
};

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

const jsonResponse = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

/** OpenAI chat message content -> Gemini parts (text and data-URL images). */
const toParts = (content) => {
  if (typeof content === "string") return [{ text: content }];
  return (content || []).map((c) => {
    if (c?.type === "text") return { text: c.text || "" };
    const url = c?.image_url?.url || c?.image_url || "";
    const m = /^data:([^;]+);base64,(.*)$/s.exec(url);
    return m ? { inlineData: { mimeType: m[1], data: m[2] } } : { text: url };
  });
};

/**
 * Drop-in for fetch("https://api.openai.com/v1/chat/completions" | ".../audio/transcriptions", options).
 * Answers like OpenAI: { choices: [{ message: { content } }] } or { text }.
 */
export const openAiCompatFetch = async (url, options = {}) => {
  try {
    if (String(url).includes("/audio/transcriptions")) {
      const file = options.body instanceof FormData ? options.body.get("file") : null;
      if (!file) return jsonResponse({ error: { message: "No audio" } }, 400);
      const data = await blobToBase64(file);
      const text = await aiText("Transcribe this audio exactly as spoken. Return only the transcript text.", {
        temperature: 0,
        parts: [{ inlineData: { mimeType: (file.type || "audio/webm").split(";")[0], data } }],
      });
      return jsonResponse({ text: text.trim() });
    }
    const req = JSON.parse(options.body || "{}");
    const msgs = req.messages || [];
    const system = msgs.filter((m) => m.role === "system").map((m) => (typeof m.content === "string" ? m.content : "")).join("\n");
    const contents = msgs
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: toParts(m.content) }));
    const body = {
      contents,
      generationConfig: {
        ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
        ...(req.max_tokens ? { maxOutputTokens: req.max_tokens } : {}),
        ...(req.response_format?.type === "json_object" ? { responseMimeType: "application/json" } : {}),
      },
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    };
    const res = await aiFetch(AI_GENERATE_URL, { body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return jsonResponse({ error: { message: data?.error?.message || `AI error ${res.status}` } }, res.status);
    const content = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
    return jsonResponse({ choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }] });
  } catch (e) {
    return jsonResponse({ error: { message: e?.message || "AI request failed" } }, 500);
  }
};
