/**
 * Progress persistence in localStorage — no accounts, no server.
 * Data model (versioned key so the schema can evolve safely):
 *   {
 *     settings: { vosotros: false },
 *     best: { "<setId>.<tense>.<mode>": { score, total, stars, plays } }
 *   }
 */

const KEY = "conjuga.v1";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupted or unavailable storage — start fresh */
  }
  return { settings: { vosotros: false }, best: {} };
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
  return { vosotros: false, ...state.settings };
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
  };
  save();
  return { stars, best: state.best[key] };
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
