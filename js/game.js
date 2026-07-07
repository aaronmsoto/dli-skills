/**
 * Question generation for the three practice modes.
 * A "question" targets one (verb, person, tense) cell of the paradigm.
 */
import { conjugate, PERSONS } from "./conjugator.js";

export const QUESTIONS_PER_ROUND = 10;
export const MATCH_PAIRS = 6;

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function activePersons(includeVosotros) {
  return [0, 1, 2, 3, 4, 5].filter((p) => includeVosotros || p !== 4);
}

/**
 * Sample `count` (verb, person) targets from a 5-verb set: every verb appears
 * at least once, persons rotate so the whole boot gets exercised.
 */
export function sampleTargets(verbs, tense, count, includeVosotros) {
  const persons = activePersons(includeVosotros);
  const targets = [];
  const pool = shuffle(verbs.flatMap((v) => persons.map((p) => ({ verb: v, person: p }))));
  // First pass: one question per verb (guarantees coverage of all 5).
  for (const v of shuffle(verbs)) {
    const pick = pool.find((t) => t.verb === v && !targets.includes(t));
    if (pick) targets.push(pick);
  }
  for (const t of pool) {
    if (targets.length >= count) break;
    if (!targets.some((x) => x.verb === t.verb && x.person === t.person)) targets.push(t);
  }
  return shuffle(targets.slice(0, count)).map(({ verb, person }) => ({
    verb,
    person,
    tense,
    answer: conjugate(verb, tense)[person],
    personLabel: PERSONS[person],
  }));
}

/**
 * A "naive regularization" of an irregular cell — the classic novice error
 * (e.g. *teno for tengo, *andé — great multiple-choice distractor).
 */
function naiveRegularForm(verb, person, tense) {
  const plain = { inf: verb.inf }; // same infinitive, no irregularity flags
  try {
    return conjugate(plain, tense)[person];
  } catch {
    return null;
  }
}

/** Build 4 options: the answer + 3 plausible distractors. */
export function buildChoices(target, allTenses) {
  const { verb, person, tense, answer } = target;
  const pool = new Set();

  const naive = naiveRegularForm(verb, person, tense);
  if (naive && naive !== answer) pool.add(naive);

  for (const t of allTenses) {
    const forms = conjugate(verb, t);
    for (let p = 0; p < forms.length; p++) {
      if (forms[p] !== answer) pool.add(forms[p]);
    }
  }

  // Prefer confusable distractors: same person other tense, then same tense
  // other persons, then anything else.
  const samePersonOtherTense = allTenses
    .filter((t) => t !== tense)
    .map((t) => conjugate(verb, t)[person])
    .filter((f) => pool.has(f));
  const sameTense = conjugate(verb, tense).filter((f) => pool.has(f));

  const ordered = [...new Set([...(naive && naive !== answer ? [naive] : []), ...samePersonOtherTense, ...shuffle(sameTense), ...shuffle([...pool])])];
  const distractors = ordered.slice(0, 3);
  return shuffle([answer, ...distractors]);
}

/**
 * Time-cue expressions for the preterite/imperfect contrast mode. These are
 * the conventional classroom triggers taught to novices; docs/SPEC.md notes
 * the simplification (real usage is aspect-driven, not word-driven).
 */
export const TENSE_CUES = {
  preterite: ["ayer", "anoche", "una vez", "de repente", "el año pasado"],
  imperfect: ["siempre", "todos los días", "muchas veces", "de niño/a", "antes", "cada verano"],
};

/**
 * Questions for the "¿Pretérito o imperfecto?" contrast mode: a time cue
 * signals the tense; the learner picks between the two past forms of the
 * same verb+person. (The two forms never coincide in Spanish.)
 */
export function buildContrastQuestions(verbs, count, includeVosotros) {
  const persons = activePersons(includeVosotros);
  const tenses = shuffle(
    Array.from({ length: count }, (_, i) => (i % 2 === 0 ? "preterite" : "imperfect")),
  );
  const targets = sampleTargets(verbs, "preterite", count, includeVosotros);
  return targets.map((t, i) => {
    const tense = tenses[i];
    const cue = TENSE_CUES[tense][Math.floor(Math.random() * TENSE_CUES[tense].length)];
    const answer = conjugate(t.verb, tense)[t.person];
    const other = conjugate(t.verb, tense === "preterite" ? "imperfect" : "preterite")[t.person];
    return {
      verb: t.verb,
      person: t.person,
      personLabel: t.personLabel,
      tense,
      cue,
      answer,
      options: shuffle([answer, other]),
    };
  });
}

/** Build the pairs for a matching round: personLabel+infinitive ↔ form. */
export function buildMatchPairs(verbs, tense, includeVosotros) {
  const targets = sampleTargets(verbs, tense, MATCH_PAIRS, includeVosotros)
    // forms must be unique or two right-side cards would be interchangeable
    .filter((t, i, arr) => arr.findIndex((x) => x.answer === t.answer) === i);
  return targets.map((t, i) => ({
    id: i,
    left: `${t.personLabel} · ${t.verb.inf}`,
    right: t.answer,
  }));
}
