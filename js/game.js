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
