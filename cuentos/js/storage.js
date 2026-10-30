/**
 * Cuentos progress (docs/CUENTOS.md §7) — localStorage key `cuentos.v1`:
 *   { best:  { "<id>.<nivel>.<act>": { score, total, stars, plays, at } },
 *     reads: { "<id>.<nivel>": { count, at } } }
 * Settings (theme, sound, hints) live in the SHARED conjuga.v1 via
 * ../../js/storage.js so the whole site stays consistent; "Borrar
 * progreso" here clears ONLY cuentos.v1. No accounts, no server.
 */
import { starsFor, isDue, reviewIntervalMs, getSettings, setSetting } from "../../js/storage.js";
import { STAR_ACTS, LISTEN_ACT } from "./activities.js";

export { getSettings, setSetting, starsFor };

const KEY = "cuentos.v1";
const LEVELS = [1, 2, 3];

const empty = () => ({ best: {}, reads: {} });

function load() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && typeof d === "object") {
        return {
          best: d.best && typeof d.best === "object" ? d.best : {},
          reads: d.reads && typeof d.reads === "object" ? d.reads : {},
        };
      }
    }
  } catch {
    /* corrupted or unavailable storage — start fresh */
  }
  return empty();
}

let state = load();

function save() {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota — progress just won't persist */
  }
}

/** Re-read storage (tests, or another tab changed it). */
export function reload() {
  state = load();
}

export function recordResult(id, nivel, act, score, total) {
  const key = `${id}.${nivel}.${act}`;
  const prev = state.best[key] || { score: 0, total, stars: 0, plays: 0 };
  const stars = starsFor(score, total);
  state.best[key] = {
    score: Math.max(prev.score || 0, score),
    total,
    stars: Math.max(prev.stars || 0, stars),
    plays: (prev.plays || 0) + 1,
    at: Date.now(),
  };
  save();
  return { stars, best: state.best[key] };
}

export function getBest(id, nivel, act) {
  return state.best[`${id}.${nivel}.${act}`] || null;
}

const starsOf = (id, nivel, act) => Number(getBest(id, nivel, act)?.stars) || 0;

/** ⭐ for one level (max 15 = 5 star activities × 3). */
export function levelStars(id, nivel) {
  return STAR_ACTS.reduce((sum, act) => sum + starsOf(id, nivel, act), 0);
}

/** ⭐ for a story (max 45). 🎧 never counts here (rule 3). */
export function storyStars(id) {
  return LEVELS.reduce((sum, n) => sum + levelStars(id, n), 0);
}

/** 🎧 badges for a story (max 9 = 3 levels × 3) — the parallel track. */
export function storyBadges(id) {
  return LEVELS.reduce((sum, n) => sum + starsOf(id, n, LISTEN_ACT), 0);
}

export function recordRead(id, nivel) {
  const key = `${id}.${nivel}`;
  const prev = state.reads[key] || { count: 0 };
  state.reads[key] = { count: (Number(prev.count) || 0) + 1, at: Date.now() };
  save();
  return state.reads[key];
}

export function getReads(id, nivel) {
  return Number(state.reads[`${id}.${nivel}`]?.count) || 0;
}

/**
 * The story played most recently (max `at` across best + reads), or null
 * when nothing has been played on this device. Drives "▶️ Sigue aquí".
 */
export function lastPlayed() {
  let best = null;
  const consider = (key, entry) => {
    const at = Number(entry?.at) || 0;
    if (at && (!best || at > best.at)) best = { id: key.split(".")[0], at };
  };
  for (const [k, e] of Object.entries(state.best)) consider(k, e);
  for (const [k, e] of Object.entries(state.reads)) consider(k, e);
  return best;
}

/**
 * Activities due for review (shared isDue/reviewIntervalMs), most overdue
 * first. Each: { id, nivel, act, stars, overdueMs }.
 */
export function dueForReview(now = Date.now(), limit = 5) {
  const due = [];
  for (const [key, entry] of Object.entries(state.best)) {
    if (!isDue(entry, now)) continue;
    const [id, nivel, act] = key.split(".");
    due.push({ id, nivel: Number(nivel), act, stars: entry.stars, overdueMs: now - entry.at - reviewIntervalMs(entry.stars) });
  }
  return due.sort((a, b) => b.overdueMs - a.overdueMs).slice(0, limit);
}

/** Clears ONLY cuentos.v1 — Conjuga progress and shared settings stay. */
export function resetProgress() {
  state = empty();
  try {
    globalThis.localStorage?.removeItem(KEY);
  } catch { /* nothing to clear */ }
}
