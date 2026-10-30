/**
 * Cuentos story-data validator (docs/CUENTOS.md §5) — the writers' gate.
 * Every module in cuentos/js/data/ is checked structurally and against the
 * level bands; stories.js must list exactly those modules.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = new URL("..", import.meta.url).pathname;
const DATA = join(ROOT, "cuentos/js/data");

export const BANDS = {
  1: { words: [60, 100], avg: 10, order: 4, predict: [0, 0], glossary: 6, tense: "present" },
  2: { words: [130, 190], avg: 14, order: 5, predict: [1, 2], glossary: 10, tense: "past" },
  3: { words: [210, 290], avg: 18, order: 6, predict: [1, 2], glossary: 14, tense: "past" },
};

const ACTS = ["preguntas", "verdad", "ordena", "palabras", "mapa", "escucha"];
const MAP_SLOTS = ["personajes", "lugar", "problema", "solucion"];
// English function words that must never appear inside Spanish text.
const ENGLISH = /\b(the|and|with|is|are|was|were|his|her|their|very|because|then|but|of|to)\b/i;

export const words = (s) => s.trim().split(/\s+/).filter(Boolean);
/** lowercase, strip punctuation/dialogue marks, keep letters + spaces */
export const normalize = (s) => s.toLowerCase()
  .replace(/[¡!¿?.,;:«»"“”()\-—–…]/g, " ")
  .replace(/\s+/g, " ").trim();
const hasPhrase = (text, phrase) => new RegExp(`(^| )${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`).test(text);

const files = readdirSync(DATA).filter((f) => f.endsWith(".js")).sort();
const modules = await Promise.all(files.map(async (f) => [f, (await import(pathToFileURL(join(DATA, f)).href)).default]));

test("at least one story module exists", () => assert.ok(modules.length >= 1));

test("stories.js lists exactly the data modules, unique ids, in a sane order", async () => {
  const { STORIES } = await import(pathToFileURL(join(ROOT, "cuentos/js/stories.js")).href);
  const ids = STORIES.map((s) => s.id);
  assert.deepEqual(new Set(ids).size, ids.length, "duplicate ids in stories.js");
  assert.deepEqual([...ids].sort(), files.map((f) => f.replace(/\.js$/, "")).sort(),
    "stories.js and cuentos/js/data/ are out of sync");
});

for (const [file, story] of modules) {
  test(`${file}: top-level shape + attribution`, () => {
    assert.equal(story.id, file.replace(/\.js$/, ""), "id must equal the file name");
    assert.match(story.id, /^[a-z0-9-]+$/);
    assert.ok(story.title && story.emoji, "title + emoji");
    assert.ok(story.theme?.es && story.theme?.en, "theme es/en");
    const src = story.source;
    for (const k of ["author", "origin", "country", "license", "url"]) assert.ok(src?.[k], `source.${k}`);
    assert.ok(src.origin.es && src.origin.en && src.country.es && src.country.en && src.country.flag);
    assert.match(src.license, /[Dd]ominio público/, "license must state public domain");
    assert.match(src.url, /^https:\/\//);
    assert.ok(Array.isArray(story.keyWords) && story.keyWords.length >= 4 && story.keyWords.length <= 6, "4–6 keyWords");
    for (const k of story.keyWords) assert.ok(k.es && k.en && k.emoji, "keyWord es/en/emoji");
    assert.equal(story.levels.length, 3, "exactly 3 levels");
  });

  story.levels.forEach((lvl, i) => {
    const n = i + 1;
    const band = BANDS[n];
    const label = `${file} N${n}`;
    const sentences = lvl.paragraphs.flat();
    const text = normalize(sentences.join(" "));
    const ref = ([p, s]) => lvl.paragraphs[p]?.[s];
    const validRef = (r, what) => {
      assert.ok(Array.isArray(r) && r.length === 2 && typeof ref(r) === "string", `${label}: ${what} has an invalid ref ${JSON.stringify(r)}`);
    };
    const mc = (item, what, { english = false } = {}) => {
      assert.equal(item.options.length, 3, `${label}: ${what} needs 3 options`);
      assert.equal(new Set(item.options).size, 3, `${label}: ${what} options must be unique`);
      assert.ok([0, 1, 2].includes(item.answer), `${label}: ${what} answer index`);
      if (!english) for (const o of item.options) assert.ok(!ENGLISH.test(o), `${label}: ${what} option looks English: "${o}"`);
    };

    test(`${label}: level band (${band.words[0]}–${band.words[1]} words, ${band.tense})`, () => {
      assert.equal(lvl.nivel, n);
      assert.equal(lvl.tense, band.tense);
      assert.ok(lvl.paragraphs.length >= 2 && lvl.paragraphs.length <= 6, "2–6 paragraphs");
      for (const p of lvl.paragraphs) assert.ok(p.length >= 1 && p.length <= 6, "1–6 sentences per paragraph");
      const count = words(sentences.join(" ")).length;
      assert.ok(count >= band.words[0] && count <= band.words[1], `word count ${count} outside band`);
      const avg = count / sentences.length;
      assert.ok(avg <= band.avg, `average sentence length ${avg.toFixed(1)} > ${band.avg}`);
      for (const s of sentences) {
        assert.ok(!ENGLISH.test(s), `English word in passage: "${s}"`);
        assert.ok(!/vosotros|vuestr/i.test(s), `vosotros in passage: "${s}"`);
        assert.match(s, /[.!?»”]$/, `sentence must end with punctuation: "${s}"`);
      }
    });

    test(`${label}: glossary keys appear in the text (≥ ${band.glossary} entries)`, () => {
      const keys = Object.keys(lvl.glossary);
      assert.ok(keys.length >= band.glossary, `only ${keys.length} glossary entries`);
      for (const k of keys) {
        assert.equal(k, normalize(k), `glossary key must be lowercase/unpunctuated: "${k}"`);
        assert.ok(hasPhrase(text, k), `glossary key not found in text: "${k}"`);
        assert.ok(typeof lvl.glossary[k] === "string" && lvl.glossary[k].length, `empty gloss for "${k}"`);
      }
    });

    test(`${label}: prediction stops`, () => {
      assert.ok(Array.isArray(lvl.predict));
      assert.ok(lvl.predict.length >= band.predict[0] && lvl.predict.length <= band.predict[1], `predict count ${lvl.predict.length}`);
      for (const p of lvl.predict) {
        assert.ok(Number.isInteger(p.after) && p.after >= 0 && p.after < lvl.paragraphs.length - 1, "predict.after must leave at least one paragraph to reveal");
        assert.ok(p.q && p.en, "predict q/en");
        assert.equal(p.options.length, 3);
        assert.equal("answer" in p, false, "prediction stops are unscored — no answer key");
      }
    });

    test(`${label}: 5 preguntas with evidence`, () => {
      assert.equal(lvl.questions.length, 5);
      for (const q of lvl.questions) {
        assert.match(q.q, /^¿.*\?$/, `question must be ¿…?: "${q.q}"`);
        assert.ok(q.en, "English hint");
        mc(q, `pregunta "${q.q}"`);
        validRef(q.evidence, `pregunta "${q.q}"`);
      }
    });

    test(`${label}: 5 verdad/mentira with evidence`, () => {
      assert.equal(lvl.tf.length, 5);
      const answers = new Set(lvl.tf.map((t) => t.answer));
      assert.ok(answers.has(true) && answers.has(false), "need both true and false statements");
      for (const t of lvl.tf) {
        assert.ok(typeof t.answer === "boolean" && t.s && t.en);
        assert.ok(!ENGLISH.test(t.s), `English in statement: "${t.s}"`);
        validRef(t.evidence, `statement "${t.s}"`);
      }
    });

    test(`${label}: ordena has ${band.order} unique events`, () => {
      assert.equal(lvl.order.length, band.order);
      assert.equal(new Set(lvl.order).size, band.order);
      for (const o of lvl.order) assert.ok(!ENGLISH.test(o), `English in event: "${o}"`);
    });

    test(`${label}: 5 palabras — each in glossary and in its sentence`, () => {
      assert.equal(lvl.vocab.length, 5);
      assert.equal(new Set(lvl.vocab.map((v) => v.word)).size, 5, "vocab words must be distinct");
      for (const v of lvl.vocab) {
        assert.ok(v.word in lvl.glossary, `vocab word not in glossary: "${v.word}"`);
        validRef(v.ref, `vocab "${v.word}"`);
        assert.ok(hasPhrase(normalize(ref(v.ref)), v.word), `vocab word "${v.word}" not in its sentence`);
        mc(v, `vocab "${v.word}"`, { english: true });
      }
    });

    test(`${label}: mapa del cuento has 4 slots`, () => {
      assert.deepEqual(Object.keys(lvl.map).sort(), [...MAP_SLOTS].sort());
      for (const slot of MAP_SLOTS) mc(lvl.map[slot], `mapa.${slot}`);
    });

    test(`${label}: 5 distinct listen targets of 4–12 words`, () => {
      assert.equal(lvl.listen.length, 5);
      assert.equal(new Set(lvl.listen.map(String)).size, 5, "listen refs must be distinct");
      for (const r of lvl.listen) {
        validRef(r, "listen");
        const n = words(ref(r)).length;
        assert.ok(n >= 4 && n <= 12, `listen sentence has ${n} words: "${ref(r)}"`);
      }
    });
  });
}

test("activity keys are stable", () => assert.deepEqual(ACTS, ["preguntas", "verdad", "ordena", "palabras", "mapa", "escucha"]));
