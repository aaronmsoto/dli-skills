/**
 * Tests for the contrast-mode generator, the Práctica word bank, and the
 * spaced-repetition logic. Run: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { SETS } from "../js/verbs.js";
import { conjugate } from "../js/conjugator.js";
import { buildContrastQuestions, buildPracticaBank, TENSE_CUES, QUESTIONS_PER_ROUND } from "../js/game.js";
import { reviewIntervalMs, isDue } from "../js/storage.js";

const DAY = 24 * 60 * 60 * 1000;

test("contrast: cues are tense-appropriate and options are the two past forms", () => {
  for (const set of [SETS[0], SETS[6], SETS[19]]) {
    const qs = buildContrastQuestions(set.verbs, QUESTIONS_PER_ROUND, false);
    assert.equal(qs.length, QUESTIONS_PER_ROUND);
    for (const q of qs) {
      assert.ok(["preterite", "imperfect"].includes(q.tense));
      assert.ok(TENSE_CUES[q.tense].includes(q.cue), `cue "${q.cue}" not in ${q.tense} bank`);
      assert.equal(q.answer, conjugate(q.verb, q.tense)[q.person]);
      const otherTense = q.tense === "preterite" ? "imperfect" : "preterite";
      const other = conjugate(q.verb, otherTense)[q.person];
      assert.deepEqual([...q.options].sort(), [q.answer, other].sort());
      assert.notEqual(q.answer, other, `${q.verb.inf} p${q.person}: past forms must differ`);
      assert.notEqual(q.person, 4, "vosotros excluded when toggled off");
    }
  }
});

test("contrast: both tenses appear in a round", () => {
  const qs = buildContrastQuestions(SETS[0].verbs, QUESTIONS_PER_ROUND, false);
  const tenses = new Set(qs.map((q) => q.tense));
  assert.ok(tenses.has("preterite") && tenses.has("imperfect"));
});

test("contrast: preterite and imperfect never coincide across the whole dataset", () => {
  for (const set of SETS) {
    for (const v of set.verbs) {
      const pret = conjugate(v, "preterite");
      const imp = conjugate(v, "imperfect");
      for (let p = 0; p < 6; p++) {
        assert.notEqual(pret[p], imp[p], `${v.inf} person ${p}`);
      }
    }
  }
});

test("práctica bank: one tile per person, multiset-equal to the engine's column", () => {
  const persons = [0, 1, 2, 3, 5]; // vosotros off
  for (const set of [SETS[0], SETS[9], SETS[19]]) {
    for (const v of set.verbs) {
      for (const tense of ["present", "preterite", "imperfect"]) {
        const bank = buildPracticaBank(v, tense, persons);
        const expected = persons.map((p) => conjugate(v, tense)[p]);
        assert.equal(bank.length, persons.length, `${v.inf} ${tense}: bank size`);
        assert.deepEqual([...bank].sort(), [...expected].sort(),
          `${v.inf} ${tense}: bank must match the column, duplicates included`);
      }
    }
  }
});

test("práctica bank: imperfect duplicates (yo/él) yield two identical tiles", () => {
  const hablar = SETS[0].verbs.find((v) => v.inf === "hablar") ?? SETS[0].verbs[0];
  const bank = buildPracticaBank(hablar, "imperfect", [0, 1, 2, 3, 5]);
  const yo = conjugate(hablar, "imperfect")[0];
  assert.equal(conjugate(hablar, "imperfect")[2], yo, "imperfect yo/él coincide");
  assert.equal(bank.filter((f) => f === yo).length, 2, "both duplicate tiles present");
});

test("práctica bank: respects the vosotros setting via the persons argument", () => {
  const verb = SETS[0].verbs[0];
  const withVos = buildPracticaBank(verb, "present", [0, 1, 2, 3, 4, 5]);
  assert.equal(withVos.length, 6);
  assert.ok(withVos.includes(conjugate(verb, "present")[4]), "vosotros form present when included");
});

test("standards info: every screen has a bilingual, cited entry (M9 I2)", async () => {
  const { STANDARDS_INFO } = await import("../js/standards-info.js");
  const screens = ["study", "practica", "choice", "type", "match", "listen", "contrast", "report"]; // home/group have no ℹ️ (owner, 2026-07-08)
  for (const key of screens) {
    const info = STANDARDS_INFO[key];
    assert.ok(info, `missing entry for screen "${key}"`);
    assert.ok(info.kid?.length > 5, `${key}: needs a Spanish-first kid line`);
    assert.ok(info.en?.length > 20, `${key}: needs an English standards mapping`);
    assert.ok(Array.isArray(info.cites) && info.cites.length >= 1, `${key}: needs citations`);
    assert.ok(info.cites.every((c) => /NBPTS|7\.1\.|NJSLS|COPPA/.test(c)), `${key}: cites must reference real standards`);
  }
  assert.deepEqual(Object.keys(STANDARDS_INFO).sort(), [...screens].sort(),
    "no orphan entries — module and router screens must match");
});

test("spaced repetition: intervals grow with mastery", () => {
  assert.equal(reviewIntervalMs(0), 0);
  assert.equal(reviewIntervalMs(1), 1 * DAY);
  assert.equal(reviewIntervalMs(2), 3 * DAY);
  assert.equal(reviewIntervalMs(3), 7 * DAY);
});

test("spaced repetition: isDue respects interval and tolerates legacy entries", () => {
  const now = 100 * DAY;
  assert.equal(isDue({ stars: 3, at: now - 8 * DAY }, now), true);
  assert.equal(isDue({ stars: 3, at: now - 6 * DAY }, now), false);
  assert.equal(isDue({ stars: 1, at: now - 2 * DAY }, now), true);
  assert.equal(isDue({ stars: 0, at: now }, now), true); // 0★ → practice again today
  assert.equal(isDue({ stars: 2, at: undefined }, now), false); // pre-`at` legacy entry
  assert.equal(isDue(null, now), false);
});
