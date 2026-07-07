/**
 * Progress persistence in localStorage — no accounts, no server.
 * Data model (versioned key so the schema can evolve safely):
 *   {
 *     settings: { vosotros: false, sound: true },
 *     best: { "<setId>.<tense>.<mode>": { score, total, stars, plays, at } }
 *   }
 * `at` (ms epoch of the last play) drives the spaced-repetition queue; it was
 * added after v0.1 — entries without it are simply never considered "due",
 * so the schema stays backward compatible (no version bump needed).
 */

const KEY = "conjuga.v1";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupted or unavailable storage — start fresh */
  }
  return { settings: { vosotros: false, sound: true }, best: {} };
}

let state = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota — progress just won't persist */
  }
}

export function getSettings() {
  return { vosotros: false, sound: true, ...state.settings };
}

export function setSetting(name, value) {
  state.settings = { ...getSettings(), [name]: value };
  save();
}

export function starsFor(score, total) {
  const pct = total === 0 ? 0 : score / total;
  if (pct >= 1) return 3;
  if (pct >= 0.8) return 2;
  if (pct >= 0.6) return 1;
  return 0;
}

export function recordResult(setId, tense, mode, score, total) {
  const key = `${setId}.${tense}.${mode}`;
  const prev = state.best[key] || { score: 0, total, stars: 0, plays: 0 };
  const stars = starsFor(score, total);
  state.best[key] = {
    score: Math.max(prev.score, score),
    total,
    stars: Math.max(prev.stars, stars),
    plays: prev.plays + 1,
    at: Date.now(),
  };
  save();
  return { stars, best: state.best[key] };
}

// ---------------- spaced repetition ----------------

const DAY = 24 * 60 * 60 * 1000;

/** Review interval by mastery: shaky skills come back sooner. */
export function reviewIntervalMs(stars) {
  return [0, 1 * DAY, 3 * DAY, 7 * DAY][Math.max(0, Math.min(3, stars))];
}

/** Pure check used by the queue (and tests): is this entry due at `now`? */
export function isDue(entry, now) {
  if (!entry || typeof entry.at !== "number") return false;
  return now - entry.at >= reviewIntervalMs(entry.stars);
}

/**
 * Activities due for review, most-overdue first, capped at `limit`.
 * Each item: { setId, tense, mode, stars, overdueMs }.
 */
export function dueForReview(now = Date.now(), limit = 5) {
  const due = [];
  for (const [key, entry] of Object.entries(state.best)) {
    if (!isDue(entry, now)) continue;
    const [setId, tense, mode] = key.split(".");
    due.push({
      setId: Number(setId),
      tense,
      mode,
      stars: entry.stars,
      overdueMs: now - entry.at - reviewIntervalMs(entry.stars),
    });
  }
  return due.sort((a, b) => b.overdueMs - a.overdueMs).slice(0, limit);
}

export function getBest(setId, tense, mode) {
  return state.best[`${setId}.${tense}.${mode}`] || null;
}

/** Total stars earned in a set (max = tenses × modes × 3). */
export function setStars(setId, tenses, modes) {
  let earned = 0;
  for (const t of tenses) for (const m of modes) earned += getBest(setId, t, m)?.stars ?? 0;
  return earned;
}

export function resetProgress() {
  state = { settings: state.settings, best: {} };
  save();
}
