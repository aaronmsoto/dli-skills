/**
 * Tests for the contrast-mode generator and the spaced-repetition logic.
 * Run: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { SETS } from "../js/verbs.js";
import { conjugate } from "../js/conjugator.js";
import { buildContrastQuestions, TENSE_CUES, QUESTIONS_PER_ROUND } from "../js/game.js";
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
