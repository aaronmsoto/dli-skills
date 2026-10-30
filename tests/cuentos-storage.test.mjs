/**
 * Cuentos progress (docs/CUENTOS.md §7): cuentos.v1 schema, stars,
 * per-story totals, 🎧 isolation from ⭐, reads, review queue, and
 * "Borrar" clearing ONLY cuentos.v1. localStorage is stubbed BEFORE the
 * modules load (they read storage at import time).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};
mem.set("conjuga.v1", JSON.stringify({ settings: { sound: false, hints: true }, best: { "1.present.choice": { score: 10, total: 10, stars: 3, plays: 1, at: 1 } } }));

const store = await import("../cuentos/js/storage.js");
const DAY = 24 * 60 * 60 * 1000;
const saved = () => JSON.parse(mem.get("cuentos.v1"));

test("recordResult writes the cuentos.v1 schema with shared starsFor", () => {
  const r = store.recordResult("leon-raton", 1, "preguntas", 4, 5);
  assert.equal(r.stars, 2);
  const e = saved().best["leon-raton.1.preguntas"];
  assert.deepEqual({ score: e.score, total: e.total, stars: e.stars, plays: e.plays }, { score: 4, total: 5, stars: 2, plays: 1 });
  assert.equal(typeof e.at, "number");
  // best is kept; plays count up
  store.recordResult("leon-raton", 1, "preguntas", 2, 5);
  assert.equal(store.getBest("leon-raton", 1, "preguntas").stars, 2);
  assert.equal(store.getBest("leon-raton", 1, "preguntas").plays, 2);
  store.recordResult("leon-raton", 1, "preguntas", 5, 5);
  assert.equal(store.getBest("leon-raton", 1, "preguntas").stars, 3);
});

test("storyStars sums 3 levels × 5 star activities; 🎧 never counts", () => {
  store.recordResult("leon-raton", 2, "ordena", 5, 5);
  store.recordResult("leon-raton", 3, "mapa", 3, 4); // 75% → 1
  store.recordResult("leon-raton", 1, "escucha", 5, 5);
  store.recordResult("leon-raton", 2, "escucha", 4, 5);
  assert.equal(store.levelStars("leon-raton", 1), 3);
  assert.equal(store.storyStars("leon-raton"), 3 + 3 + 1);
  assert.equal(store.storyBadges("leon-raton"), 3 + 2);
  assert.equal(store.storyStars("otro"), 0);
});

test("recordRead counts reads per story+level", () => {
  store.recordRead("leon-raton", 2);
  store.recordRead("leon-raton", 2);
  assert.equal(store.getReads("leon-raton", 2), 2);
  assert.equal(saved().reads["leon-raton.2"].count, 2);
  assert.equal(store.getReads("leon-raton", 3), 0);
});

test("dueForReview uses the shared intervals", () => {
  const now = Date.now();
  const due = store.dueForReview(now + 2 * DAY, 10);
  const keys = due.map((d) => `${d.id}.${d.nivel}.${d.act}`);
  assert.ok(keys.includes("leon-raton.3.mapa"), "1-star entry due after 1 day");
  assert.ok(!keys.includes("leon-raton.1.preguntas"), "3-star entry not due before 7 days");
  assert.ok(store.dueForReview(now + 8 * DAY, 10).some((d) => d.act === "preguntas"));
  assert.equal(typeof due[0].nivel, "number");
});

test("settings are the shared conjuga.v1 settings", () => {
  assert.equal(store.getSettings().sound, false);
  assert.equal(store.starsFor(3, 5), 1);
});

test("resetProgress clears ONLY cuentos.v1", () => {
  store.resetProgress();
  assert.equal(mem.has("cuentos.v1"), false);
  assert.equal(store.storyStars("leon-raton"), 0);
  assert.equal(store.getReads("leon-raton", 2), 0);
  assert.ok(JSON.parse(mem.get("conjuga.v1")).best["1.present.choice"], "Conjuga progress untouched");
});

test("corrupted storage → fresh state, no throw", () => {
  mem.set("cuentos.v1", "{not json");
  store.reload();
  assert.equal(store.storyStars("leon-raton"), 0);
  mem.set("cuentos.v1", JSON.stringify({ best: null, reads: 7 }));
  store.reload();
  assert.equal(store.getReads("x", 1), 0);
  store.recordRead("x", 1);
  assert.equal(store.getReads("x", 1), 1);
});

test("lastPlayed: max `at` across best + reads; null when empty (NH-12)", async () => {
  store.resetProgress();
  assert.equal(store.lastPlayed(), null);
  const realNow = Date.now;
  try {
    Date.now = () => 1000;
    store.recordResult("leon-raton", 1, "preguntas", 5, 5);
    Date.now = () => 3000;
    store.recordRead("liebre-tortuga", 2);
    assert.deepEqual(store.lastPlayed(), { id: "liebre-tortuga", at: 3000 });
    Date.now = () => 5000;
    store.recordResult("leon-raton", 2, "mapa", 1, 4);
    assert.deepEqual(store.lastPlayed(), { id: "leon-raton", at: 5000 });
  } finally {
    Date.now = realNow;
    store.resetProgress();
  }
});
