/**
 * Spanish audio, two backends (M12):
 *  1. Pre-generated clips (audio/manifest.json → mp3s, one per exact spoken
 *     text) — recorded once with ElevenLabs by the owner, served as static
 *     assets like images. No text ever leaves the device at runtime.
 *  2. Web Speech API fallback — device-local, works offline.
 * UI gates on `audioAvailable()` (either backend). `ttsAvailable()` still
 * reports the local-voice backend alone. Everything hides when neither
 * backend exists (offline device without a Spanish voice).
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

// ---------------- clip backend (M12) ----------------

let clipIndex = null; // { base, map: spokenText → relative mp3 path }
let currentClip = null;

/** Load the clip manifest (call once at boot; resolves even offline). */
export async function initClips(base = "audio/") {
  try {
    const res = await fetch(`${base}manifest.json`);
    if (res.ok) clipIndex = { base, map: await res.json() };
  } catch { /* offline or clips absent — Web Speech remains the fallback */ }
}

export function clipsAvailable() {
  return clipIndex !== null;
}

/** The loaded manifest map (spoken text → clip files), or null. Descargas
 *  (M25.3) derives per-group download lists from it. */
export function clipMap() {
  return clipIndex?.map ?? null;
}

/** Either backend works → audio UI may render. */
export function audioAvailable() {
  return clipsAvailable() || ttsAvailable();
}

let pendingResolve = null;

/** Speak Spanish text: clip first, Web Speech fallback. Returns a Promise
 *  that resolves when playback finishes (or immediately if no audio). */
export function speak(text, rate = 0.85) {
  if (pendingResolve) { pendingResolve(); pendingResolve = null; }
  currentClip?.pause();
  window.speechSynthesis?.cancel?.();

  if (!text) return Promise.resolve();
  // dual-generated speeds (owner, 2026-07-08): 🐢 plays a REAL slower
  // recording (0.70) rather than a playbackRate trick; normal is 0.85
  const rel = clipIndex?.map[text]?.[rate <= 0.5 ? "s" : "n"];
  if (rel) {
    const clip = new Audio(clipIndex.base + rel);
    currentClip = clip;
    return new Promise(resolve => {
      pendingResolve = resolve;
      const done = () => { if (pendingResolve === resolve) pendingResolve = null; resolve(); };
      clip.addEventListener("ended", done, { once: true });
      clip.addEventListener("error", done, { once: true });
      clip.play().catch(done);
    });
  }
  if (!ttsAvailable()) return Promise.resolve();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = cachedVoice;
  u.lang = cachedVoice.lang;
  u.rate = rate;
  return new Promise(resolve => {
    pendingResolve = resolve;
    const done = () => { if (pendingResolve === resolve) pendingResolve = null; resolve(); };
    u.addEventListener("end", done, { once: true });
    u.addEventListener("error", done, { once: true });
    window.speechSynthesis.speak(u);
  });
}

// ---------------- tiny synthesized game SFX (M18.1 "Chispa") ----------------
// WebAudio oscillator blips for game juice — no files, no manifest entries.
// The context is created lazily inside a user-gesture call chain (iOS unlock
// rule) and every call is fail-safe: sound is juice, never the only signal.

let sfxCtx = null;

function sfxContext() {
  if (sfxCtx) return sfxCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  sfxCtx = new AC();
  return sfxCtx;
}

/** Short celebratory blip. kind: "match" (two rising notes) | "run" (three). */
export function chirp(kind = "match") {
  try {
    const c = sfxContext();
    if (!c) return;
    if (c.state === "suspended") c.resume();
    const notes = kind === "run" ? [523.25, 659.25, 783.99] : [523.25, 783.99];
    notes.forEach((freq, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      const t0 = c.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      o.connect(g);
      g.connect(c.destination);
      o.start(t0);
      o.stop(t0 + 0.2);
    });
  } catch { /* decorative only — never break gameplay */ }
}
