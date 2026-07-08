/**
 * M12 clip-manifest integrity: the committed audio manifest must cover
 * every text the app can speak — person-prefixed ("yo hablo") for
 * say/sayForm and bare ("hablo") for 🎧 Escucha, each in BOTH dual-generated speeds
 * (n=0.85, s=0.70) — and every entry must point at a real file. Extra entries (audition samples, "Hola") are
 * allowed; missing coverage is not.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SETS } from "../js/verbs.js";
import { conjugate, TENSES } from "../js/conjugator.js";

const ROOT = new URL("..", import.meta.url).pathname;
const SPEECH_PERSONS = ["yo", "tú", "él", "nosotros", "vosotros", "ellos"];

test("audio manifest: full dataset coverage, no dead entries", () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, "audio/manifest.json"), "utf8"));
  const missing = [];
  for (const set of SETS) {
    for (const verb of set.verbs) {
      for (const tense of TENSES) {
        const forms = conjugate(verb, tense);
        for (let p = 0; p < 6; p++) {
          for (const text of [`${SPEECH_PERSONS[p]} ${forms[p]}`, forms[p]]) {
            if (!manifest[text]?.n || !manifest[text]?.s) missing.push(text);
          }
        }
      }
    }
  }
  assert.equal(missing.length, 0, `manifest missing ${missing.length} texts, e.g. ${missing.slice(0, 5).join(", ")}`);
  assert.ok(manifest["Hola"]?.n, "the 🔊 unmute greeting needs a clip");
  for (const [text, variants] of Object.entries(manifest)) {
    for (const [v, rel] of Object.entries(variants)) {
      assert.ok(existsSync(join(ROOT, "audio", rel)), `manifest "${text}" (${v}) → ${rel} has no file`);
    }
  }
});

test("audio manifest: no two texts share the same clip file", { todo: "regenerate clips: node tools/generate-audio.mjs --sets all" }, () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, "audio/manifest.json"), "utf8"));
  const byFile = {};
  for (const [text, variants] of Object.entries(manifest)) {
    for (const [v, rel] of Object.entries(variants)) {
      if (!byFile[rel]) byFile[rel] = [];
      byFile[rel].push(text);
    }
  }
  const collisions = Object.entries(byFile).filter(([, texts]) => texts.length > 1);
  assert.equal(collisions.length, 0,
    `${collisions.length} clip files are shared by multiple texts, e.g. ${collisions[0]?.[0]} ← ${collisions[0]?.[1].join(" | ")}`);
});
