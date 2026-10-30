/**
 * Cuentos pure round builders (docs/CUENTOS.md §6, §9): counts, option
 * uniqueness, answer tracking after the shuffle, Ordena never pre-sorted,
 * Escucha distractors distinct from the target, scoreOrdena. Runs over
 * EVERY story module × level listed in cuentos/js/stories.js.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { STORIES } from "../cuentos/js/stories.js";
import {
  ACTIVITIES, STAR_ACTS, LISTEN_ACT, MAP_SLOTS, shuffle, shuffleOptions, seededRng, refText,
  buildPreguntas, buildVerdad, buildPalabras, buildMapa, buildOrdena, buildEscucha, scoreOrdena, buildRound,
} from "../cuentos/js/activities.js";
import { glossSegments } from "../cuentos/js/reader.js";

const levels = STORIES.flatMap((s) => s.levels.map((l) => [`${s.id} N${l.nivel}`, l]));

test("ACTIVITIES metadata: keys, tracks, totals", () => {
  assert.deepEqual(ACTIVITIES.map((a) => a.key), ["preguntas", "verdad", "ordena", "palabras", "mapa", "escucha"]);
  assert.deepEqual(STAR_ACTS, ["preguntas", "verdad", "ordena", "palabras", "mapa"]);
  for (const a of ACTIVITIES) {
    assert.ok(a.icon && a.es && a.en, `${a.key} labels`);
    assert.equal(a.track, a.key === LISTEN_ACT ? "badges" : "stars", `${a.key} track`);
  }
  const lvl = STORIES[0].levels[0];
  assert.deepEqual(ACTIVITIES.map((a) => a.total(lvl)), [5, 5, lvl.order.length, 5, 4, 5]);
});

test("shuffle: seedable, a permutation, does not mutate", () => {
  const src = [1, 2, 3, 4, 5, 6, 7, 8];
  const a = shuffle(src, seededRng(42));
  const b = shuffle(src, seededRng(42));
  assert.deepEqual(a, b, "same seed → same order");
  assert.deepEqual([...a].sort((x, y) => x - y), src);
  assert.deepEqual(src, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.notDeepEqual(shuffle(src, seededRng(1)), shuffle(src, seededRng(2)));
});

test("shuffleOptions tracks the answer index", () => {
  for (let seed = 1; seed < 50; seed++) {
    const { options, answer } = shuffleOptions(["a", "b", "c"], 2, seededRng(seed));
    assert.equal(options[answer], "c");
  }
});

for (const [label, lvl] of levels) {
  test(`${label}: preguntas — 5 items, unique options, answer tracked, evidence text`, () => {
    for (let seed = 1; seed <= 10; seed++) {
      const items = buildPreguntas(lvl, seededRng(seed));
      assert.equal(items.length, 5);
      items.forEach((it, i) => {
        const src = lvl.questions[i];
        assert.equal(it.options.length, 3);
        assert.equal(new Set(it.options).size, 3);
        assert.equal(it.options[it.answer], src.options[src.answer]);
        assert.equal(it.answerText, src.options[src.answer]);
        assert.equal(it.evidenceText, refText(lvl, src.evidence));
        assert.ok(it.evidenceText);
      });
    }
  });

  test(`${label}: verdad — 5 statements, Verdad/Mentira answer`, () => {
    const items = buildVerdad(lvl);
    assert.equal(items.length, 5);
    items.forEach((it, i) => {
      assert.deepEqual(it.options, ["Verdad", "Mentira"]);
      assert.equal(it.answer, lvl.tf[i].answer ? 0 : 1);
      assert.equal(it.answerText, it.options[it.answer]);
      assert.ok(it.evidenceText);
    });
  });

  test(`${label}: palabras — 5 words, sentence contains the word, English answer tracked`, () => {
    const items = buildPalabras(lvl, seededRng(7));
    assert.equal(items.length, 5);
    items.forEach((it, i) => {
      const v = lvl.vocab[i];
      assert.equal(it.options[it.answer], v.options[v.answer]);
      assert.equal(new Set(it.options).size, 3);
      assert.ok(glossSegments(it.sentence, { [it.word]: "" }).some((s) => s.key === it.word), `"${it.word}" not marked in "${it.sentence}"`);
    });
  });

  test(`${label}: mapa — 4 slots in order, answer tracked`, () => {
    const items = buildMapa(lvl, seededRng(3));
    assert.deepEqual(items.map((i) => i.slot), MAP_SLOTS.map((s) => s.key));
    for (const it of items) {
      const src = lvl.map[it.slot];
      assert.equal(it.options[it.answer], src.options[src.answer]);
      assert.equal(new Set(it.options).size, 3);
    }
  });

  test(`${label}: ordena — tiles are the sequence, never pre-sorted`, () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { tiles, sequence } = buildOrdena(lvl, seededRng(seed));
      assert.deepEqual(sequence, lvl.order);
      assert.equal(tiles.length, sequence.length);
      assert.deepEqual(tiles.map((t) => t.index).sort((a, b) => a - b), sequence.map((_, i) => i));
      for (const t of tiles) assert.equal(t.text, sequence[t.index]);
      assert.ok(tiles.some((t, i) => t.index !== i), `seed ${seed}: shuffle left tiles in order`);
    }
  });

  test(`${label}: escucha — 5 items, target + 2 distinct distractors`, () => {
    for (let seed = 1; seed <= 10; seed++) {
      const items = buildEscucha(lvl, seededRng(seed));
      assert.equal(items.length, 5);
      items.forEach((it, i) => {
        const target = refText(lvl, lvl.listen[i]);
        assert.equal(it.target, target);
        assert.equal(it.options.length, 3);
        assert.equal(new Set(it.options).size, 3, "options distinct");
        assert.equal(it.options[it.answer], target);
        assert.equal(it.options.filter((o) => o === target).length, 1, "target appears once");
        const all = lvl.paragraphs.flat();
        for (const o of it.options) assert.ok(all.includes(o), "distractors come from the same level");
      });
    }
  });
}

test("ordena: a 2-event level that shuffles into order is rotated", () => {
  const lvl = { order: ["a", "b"] };
  for (let seed = 1; seed <= 30; seed++) {
    const { tiles } = buildOrdena(lvl, seededRng(seed));
    assert.deepEqual(tiles.map((t) => t.index), [1, 0]);
  }
  assert.deepEqual(buildOrdena({ order: ["solo"] }).tiles, [{ text: "solo", index: 0 }]);
});

test("escucha: distractors prefer similar length", () => {
  const lvl = {
    paragraphs: [["Uno dos tres cuatro.", "Cinco seis siete ocho.", "Nueve diez once doce.",
      "Trece catorce quince dieciséis.", "Hola amigo mío querido.", "Sol luna mar cielo.",
      "Este es un texto muchísimo más largo que todos los demás de verdad."]],
    listen: [[0, 0]],
  };
  for (let seed = 1; seed <= 20; seed++) {
    const [it] = buildEscucha(lvl, seededRng(seed));
    assert.ok(!it.options.includes(lvl.paragraphs[0][6]), "the long sentence should not be picked");
  }
});

test("scoreOrdena counts first-try slots only", () => {
  assert.deepEqual(scoreOrdena([[0], [1], [2], [3]]), { score: 4, total: 4 });
  assert.deepEqual(scoreOrdena([[2, 0], [1], [3, 2], [3]]), { score: 2, total: 4 });
  assert.deepEqual(scoreOrdena([[1, 0], [2, 1], [3, 2], [3]]), { score: 1, total: 4 });
  assert.deepEqual(scoreOrdena([[], []]), { score: 0, total: 2 });
});

test("buildRound dispatches every activity key", () => {
  const lvl = STORIES[0].levels[1];
  for (const a of ACTIVITIES) assert.ok(buildRound(a.key, lvl), a.key);
  assert.equal(buildRound("nope", lvl), null);
});

test("glossSegments: longest match, case-insensitive, punctuation-agnostic, lossless", () => {
  const g = { "deja ir": "lets go", "deja": "leaves", "había una vez": "once upon a time", "red": "net" };
  const s = "Había una vez un león que deja ir al ratón; ¡la RED!";
  const segs = glossSegments(s, g);
  assert.equal(segs.map((x) => x.text).join(""), s, "lossless");
  assert.deepEqual(segs.filter((x) => x.key).map((x) => [x.text, x.key]),
    [["Había una vez", "había una vez"], ["deja ir", "deja ir"], ["RED", "red"]]);
  // whole words only: "red" must not match inside "redondo"
  assert.equal(glossSegments("Un plato redondo.", g).filter((x) => x.key).length, 0);
});

test("glossSegments: every glossary key is found in its level's passage", () => {
  for (const s of STORIES) for (const lvl of s.levels) {
    const found = new Set(lvl.paragraphs.flat().flatMap((sen) => glossSegments(sen, lvl.glossary).filter((x) => x.key).map((x) => x.key)));
    for (const k of Object.keys(lvl.glossary)) {
      // a short key may be shadowed by a longer overlapping one; it must then be part of a found key
      assert.ok(found.has(k) || [...found].some((f) => f.includes(k)), `${s.id} N${lvl.nivel}: "${k}" never rendered as a gloss button`);
    }
  }
});
