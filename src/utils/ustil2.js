import { toast } from "react-toastify";
import { toastBody } from "./toastBody";
const isMobile = window.innerWidth <= 768;
export const speakMessage = (message) => {
  const utterance = new SpeechSynthesisUtterance(message);
  const setFemaleVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    // Try to find a female voice based on common name patterns
    let femaleVoice = voices.find(
      (voice) =>
        voice.name.toLowerCase().includes("female") ||
        voice.name.toLowerCase().includes("susan") ||
        voice.name.toLowerCase().includes("samantha") ||
        voice.name.toLowerCase().includes("zira") || // Windows
        (voice.gender && voice.gender.toLowerCase() === "female"),
    );
    // Fallback to an English voice if no clear female voice is found
    if (!femaleVoice) {
      femaleVoice = voices.find((voice) =>
        voice.lang.toLowerCase().includes("en"),
      );
    }
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    window.speechSynthesis.speak(utterance);
  };
  // If voices are not yet loaded, wait for them
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = setFemaleVoice;
  } else {
    setFemaleVoice();
  }
};
export const notify = (message, type = "success") => {
  if (type === "success") {
    toast.success(toastBody(type, message), { autoClose: 3000 });
  } else if (type === "warn") {
    toast.warn(toastBody(type, message), { autoClose: 3000 });
  } else if (type === "error") {
    toast.error(toastBody(type, message), { autoClose: 3000 });
  }
};













































export function getThemeClassColor(className = "text-theme-colornew") {
  const root = document.getElementById("root") || document.body;
  const probe = document.createElement("span");
  probe.className = className;
  probe.style.display = "none";
  root.appendChild(probe); // must live inside #root so ".orange_theme .text-theme-colornew" matches
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color; // "rgb(213, 95, 0)"  ← #d55f00 for orange_theme
}


