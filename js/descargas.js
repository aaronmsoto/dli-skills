/**
 * ⬇️ Descargas (M25.3 — design: docs/SPEC.md §5.5): offline audio
 * download manager. Populates the per-group `audio-gNN` caches that
 * sw.js serves cache-first; this module is the ONLY writer of those
 * caches. Pure derivation (clip URL lists) is separated from the
 * Cache API work so unit tests can cover it in Node.
 */
import { conjugate, TENSES } from "./conjugator.js";

// Short person words for speech — must mirror SPEECH_PERSONS in js/app.js
// (the manifest is keyed by these exact spoken texts).
const SPEECH_PERSONS = ["yo", "tú", "él", "nosotros", "vosotros", "ellos"];

export function groupCacheName(setId) {
  return `audio-g${String(setId).padStart(2, "0")}`;
}

/**
 * Every clip URL for a group: 5 verbs × 3 tenses × 6 persons × both
 * speeds (normal + despacio), in BOTH spoken shapes — person-prefixed
 * ("yo hablo", the tap-to-hear voice everywhere) AND the bare form
 * ("hablo", what 🎧 Escucha plays as its prompt), so a downloaded group
 * is fully offline including Escucha. All six persons are always
 * included — the vosotros setting filters the UI, never the data.
 * Texts missing from the manifest are skipped (they keep TTS fallback).
 */
export function clipUrlsForSet(set, map, base = "audio/") {
  const urls = [];
  const push = (text) => {
    const entry = map[text];
    if (!entry) return;
    if (entry.n) urls.push(base + entry.n);
    if (entry.s) urls.push(base + entry.s);
  };
  for (const verb of set.verbs) {
    for (const tense of TENSES) {
      conjugate(verb, tense).forEach((form, person) => {
        push(`${SPEECH_PERSONS[person]} ${form}`);
        push(form);
      });
    }
  }
  return [...new Set(urls)];
}

export function downloadsSupported() {
  return typeof caches !== "undefined";
}

/** {cached, total} for a group — drives the row state. */
export async function groupStatus(set, map) {
  const urls = clipUrlsForSet(set, map);
  const cache = await caches.open(groupCacheName(set.id));
  const keys = await cache.keys();
  return { cached: keys.length, total: urls.length };
}

/**
 * Sequential fetch+put with skip-existing (resume for free). Calls
 * onProgress(done, total) after every clip. Returns {ok, failed}.
 */
export async function downloadGroup(set, map, onProgress = () => {}) {
  const urls = clipUrlsForSet(set, map);
  const cache = await caches.open(groupCacheName(set.id));
  let done = 0;
  let failed = 0;
  for (const url of urls) {
    if (await cache.match(url)) {
      onProgress(++done, urls.length);
      continue;
    }
    try {
      const res = await fetch(url);
      if (res.ok) await cache.put(url, res);
      else failed++;
    } catch {
      failed++;
    }
    onProgress(++done, urls.length);
  }
  return { ok: failed === 0, failed };
}

export async function deleteGroup(setId) {
  return caches.delete(groupCacheName(setId));
}

/** Best-effort storage snapshot; null where unsupported. */
export async function storageSnapshot() {
  try {
    if (!navigator.storage?.estimate) return null;
    const { usage, quota } = await navigator.storage.estimate();
    return { usage: usage ?? 0, quota: quota ?? 0 };
  } catch {
    return null;
  }
}

/** Ask the browser to protect our storage from eviction (first download). */
export async function requestPersistence() {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

export function fmtMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}
