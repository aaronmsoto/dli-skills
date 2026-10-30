/**
 * Cuentos — PURE round builders (docs/CUENTOS.md §6). No DOM, no storage:
 * every function takes a story level (schema §5) and an optional seedable
 * rng, and returns plain data the UI renders. Unit-tested in
 * tests/cuentos-activities.test.mjs.
 *
 * Item shape shared by the multiple-choice builders:
 *   { prompt, en, options: [3 strings], answer: index, answerText,
 *     evidence: [p, s] | null, evidenceText: string | null, ... }
 * Options are shuffled per round; `answer` always tracks the shuffle.
 */

/** Star activities in play order (the "next activity" chain), then 🎧. */
export const STAR_ACTS = ["preguntas", "verdad", "ordena", "palabras", "mapa"];
export const LISTEN_ACT = "escucha";

/**
 * Activity metadata. `track` is the scoring track (CLAUDE.md rule 3):
 * "stars" counts toward ⭐ totals; "badges" is the parallel 🎧 track that
 * never does. `total(level)` = items per round (5, 5, order.length, 5, 4, 5).
 */
export const ACTIVITIES = [
  { key: "preguntas", icon: "❓", es: "Preguntas", en: "Questions", track: "stars", total: () => 5 },
  { key: "verdad", icon: "✅", es: "¿Verdad o mentira?", en: "True or false", track: "stars", total: () => 5 },
  { key: "ordena", icon: "🧩", es: "Ordena el cuento", en: "Put the story in order", track: "stars", total: (level) => level.order.length },
  { key: "palabras", icon: "🔤", es: "Palabras", en: "Words in context", track: "stars", total: () => 5 },
  { key: "mapa", icon: "🗺️", es: "Mapa del cuento", en: "Story map", track: "stars", total: () => 4 },
  { key: "escucha", icon: "🎧", es: "Escucha", en: "Listen & pick", track: "badges", total: () => 5 },
];
export const actMeta = (key) => ACTIVITIES.find((a) => a.key === key) || null;

export const MAP_SLOTS = [
  { key: "personajes", icon: "👥", es: "Personajes principales", en: "Main characters", q: "¿Quiénes son los personajes principales?" },
  { key: "lugar", icon: "📍", es: "Lugar", en: "Setting", q: "¿Dónde pasa el cuento?" },
  { key: "problema", icon: "❗", es: "Problema", en: "Problem", q: "¿Cuál es el problema?" },
  { key: "solucion", icon: "✅", es: "Solución", en: "Solution", q: "¿Cómo se resuelve el problema?" },
];

// ------------------------------------------------------------ helpers

/** Deterministic PRNG (mulberry32) for tests and reproducible rounds. */
export function seededRng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates on a copy; `rng` defaults to Math.random. */
export function shuffle(array, rng = Math.random) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffle options and return the new index of the answer. */
export function shuffleOptions(options, answer, rng = Math.random) {
  const order = shuffle(options.map((_, i) => i), rng);
  return { options: order.map((i) => options[i]), answer: order.indexOf(answer) };
}

/** The sentence at a [p, s] ref, or null. */
export const refText = (level, ref) => (ref ? level.paragraphs[ref[0]]?.[ref[1]] ?? null : null);

export const wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length;

function mcItem(level, { prompt, en = null, options, answer, evidence = null, ...rest }, rng) {
  const shuffled = shuffleOptions(options, answer, rng);
  return {
    prompt, en, ...shuffled,
    answerText: shuffled.options[shuffled.answer],
    evidence, evidenceText: refText(level, evidence),
    ...rest,
  };
}

// ------------------------------------------------------------ builders

/** ❓ 5 comprehension questions (data order: literal → inferential). */
export function buildPreguntas(level, rng = Math.random) {
  return level.questions.map((q) => mcItem(level, {
    prompt: q.q, en: q.en, options: q.options, answer: q.answer, evidence: q.evidence,
  }, rng));
}

/** ✅ 5 statements; options are fixed (Verdad first) — answer 0 = true. */
export function buildVerdad(level) {
  return level.tf.map((t) => ({
    prompt: t.s, en: t.en,
    options: ["Verdad", "Mentira"],
    answer: t.answer ? 0 : 1,
    answerText: t.answer ? "Verdad" : "Mentira",
    evidence: t.evidence, evidenceText: refText(level, t.evidence),
  }));
}

/** 🔤 5 words in context: the sentence with the word, pick the English. */
export function buildPalabras(level, rng = Math.random) {
  return level.vocab.map((v) => mcItem(level, {
    prompt: `¿Qué significa «${v.word}»?`, en: "What does it mean?",
    options: v.options, answer: v.answer, evidence: v.ref,
    word: v.word, sentence: refText(level, v.ref),
  }, rng));
}

/** 🗺️ 4 story-map slots in fixed order (Personajes · Lugar · Problema · Solución). */
export function buildMapa(level, rng = Math.random) {
  return MAP_SLOTS.map((slot) => mcItem(level, {
    prompt: slot.q, en: slot.en,
    options: level.map[slot.key].options, answer: level.map[slot.key].answer,
    slot: slot.key, icon: slot.icon, label: slot.es,
  }, rng));
}

/**
 * 🧩 shuffled event tiles + the correct sequence. Tiles carry their
 * correct slot index; the shuffle is never already in order (length > 1).
 */
export function buildOrdena(level, rng = Math.random) {
  const sequence = [...level.order];
  const idx = sequence.map((_, i) => i);
  let order = shuffle(idx, rng);
  if (order.length > 1 && order.every((v, i) => v === i)) {
    order = [...order.slice(1), order[0]]; // rotate: guaranteed out of order
  }
  return { tiles: order.map((i) => ({ text: sequence[i], index: i })), sequence };
}

/**
 * Score an Ordena round. `attempts[slot]` = the tile indices tapped for
 * that slot, in order; a slot counts only if its FIRST tap was right.
 */
export function scoreOrdena(attempts) {
  const score = attempts.reduce((n, tries, slot) => n + (tries?.[0] === slot ? 1 : 0), 0);
  return { score, total: attempts.length };
}

/**
 * 🎧 5 items: the target sentence (from `listen`, heard, never shown) and
 * 2 distractor sentences from the same level — distinct texts, closest in
 * word count when possible (picked randomly among the nearest few).
 */
export function buildEscucha(level, rng = Math.random) {
  const pool = [];
  level.paragraphs.forEach((para, p) => para.forEach((s, i) => pool.push({ text: s, ref: [p, i] })));
  return level.listen.map((ref) => {
    const target = refText(level, ref);
    const n = wordCount(target);
    const seen = new Set([target]);
    const candidates = shuffle(pool, rng)
      .filter((c) => (seen.has(c.text) ? false : (seen.add(c.text), true)))
      .sort((a, b) => Math.abs(wordCount(a.text) - n) - Math.abs(wordCount(b.text) - n));
    const near = shuffle(candidates.slice(0, 4), rng).slice(0, 2);
    return mcItem(level, {
      prompt: "¿Qué oración escuchas?", en: "Which sentence do you hear?",
      options: [target, ...near.map((c) => c.text)], answer: 0, evidence: ref,
      target,
    }, rng);
  });
}

/** Dispatch by activity key (ordena returns its own shape). */
export function buildRound(act, level, rng = Math.random) {
  switch (act) {
    case "preguntas": return buildPreguntas(level, rng);
    case "verdad": return buildVerdad(level);
    case "palabras": return buildPalabras(level, rng);
    case "mapa": return buildMapa(level, rng);
    case "escucha": return buildEscucha(level, rng);
    case "ordena": return buildOrdena(level, rng);
    default: return null;
  }
}
