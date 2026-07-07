/**
 * Text-to-speech via the browser's built-in Web Speech API. No network, no
 * dependencies. If the device has no Spanish voice (or no speechSynthesis at
 * all), `ttsAvailable()` returns false and the UI hides every audio control.
 *
 * Voice quality varies by device; we prefer a local es-* voice and fall back
 * to any Spanish voice. Rate is slightly slowed for young learners.
 */

let cachedVoice = null;
let voicesReady = false;

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  if (!voices.length) return null;
  const es = voices.filter((v) => v.lang?.toLowerCase().startsWith("es"));
  if (!es.length) return null;
  // Prefer local voices, and Latin-American Spanish where present (typical
  // for US DLI programs), then any Spanish.
  const rank = (v) =>
    (v.localService ? 2 : 0) +
    (/es[-_](mx|us|419)/i.test(v.lang) ? 1 : 0);
  return es.sort((a, b) => rank(b) - rank(a))[0];
}

function refreshVoice() {
  cachedVoice = pickVoice();
  voicesReady = true;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  refreshVoice();
  // Chrome loads voices asynchronously.
  window.speechSynthesis.addEventListener?.("voiceschanged", refreshVoice);
}

export function ttsAvailable() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  if (!voicesReady) refreshVoice();
  return cachedVoice !== null;
}

/** Speak Spanish text (queued after anything currently speaking is cancelled). */
export function speak(text) {
  if (!ttsAvailable() || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.voice = cachedVoice;
  u.lang = cachedVoice.lang;
  u.rate = 0.85; // a touch slower for young learners
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
