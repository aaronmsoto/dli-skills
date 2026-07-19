/**
 * M25.3 ⬇️ Descargas — pure-derivation invariants. The Cache API work is
 * covered by the e2e suite; here we prove the URL lists are complete and
 * collision-free against the real committed manifest.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SETS } from "../js/verbs.js";
import { conjugate, TENSES } from "../js/conjugator.js";
import { clipUrlsForSet, groupCacheName, fmtMB } from "../js/descargas.js";

const SPEECH_PERSONS = ["yo", "tú", "él", "nosotros", "vosotros", "ellos"];

const manifest = JSON.parse(
  readFileSync(new URL("../audio/manifest.json", import.meta.url), "utf8"),
);

test("group cache names are zero-padded and unique", () => {
  assert.equal(groupCacheName(1), "audio-g01");
  assert.equal(groupCacheName(20), "audio-g20");
  const names = new Set(SETS.map((s) => groupCacheName(s.id)));
  assert.equal(names.size, SETS.length);
});

test("every derived spoken text has a manifest entry with both speeds", () => {
  for (const set of SETS) {
    for (const verb of set.verbs) {
      for (const tense of TENSES) {
        conjugate(verb, tense).forEach((form, person) => {
          // both spoken shapes: person-prefixed (tap-to-hear) and the
          // bare form (the 🎧 Escucha prompt)
          for (const text of [`${SPEECH_PERSONS[person]} ${form}`, form]) {
            const entry = manifest[text];
            assert.ok(entry, `set ${set.id}: manifest hole for "${text}"`);
            assert.ok(entry.n && entry.s, `set ${set.id}: "${text}" missing a speed variant`);
          }
        });
      }
    }
  }
});

test("group clip lists are unique clip URLs (both speeds, all six persons)", () => {
  for (const set of SETS) {
    const urls = clipUrlsForSet(set, manifest);
    // 90 person-prefixed texts + 90 bare forms, × 2 speeds = 360 ceiling;
    // duplicates only lower it (imperfect yo/él share every bare form,
    // ser/ir share the whole preterite paradigm in set 1). Measured
    // range across the 20 sets: 326-350.
    assert.ok(urls.length >= 320 && urls.length <= 360,
      `set ${set.id}: ${urls.length} clip URLs (expected 320-360)`);
    for (const u of urls) assert.match(u, /^audio\/clips\/.+\.mp3$/);
    assert.equal(new Set(urls).size, urls.length, `set ${set.id}: duplicate URLs`);
  }
});

test("fmtMB renders kid-scale sizes sanely", () => {
  assert.equal(fmtMB(2 * 1024 * 1024), "2.0 MB");
  assert.equal(fmtMB(39.4 * 1024 * 1024), "39 MB");
});
