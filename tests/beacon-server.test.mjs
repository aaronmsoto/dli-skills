/**
 * M28 beacon Worker — pure-handler tests against a fake D1. The privacy
 * invariants are TESTED here, not just documented: raw IP/UA must never
 * reach any SQL parameter or stored value.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBeacon, uniqueHash, getSalt, handleBeacon, handleAggregates, PAGES, EVENTS } from "../server/worker.js";

/** Minimal fake D1: records every bound parameter; simulates the three
 *  tables just enough for the handlers' SQL. */
function fakeDB() {
  const state = { counters: new Map(), salts: new Map(), uniques: new Set(), params: [] };
  return {
    state,
    prepare(sql) {
      return {
        bind(...args) {
          state.params.push(...args.map(String));
          return {
            async run() {
              if (sql.includes("INTO counters")) {
                const key = args.slice(0, 3).join("|");
                state.counters.set(key, (state.counters.get(key) ?? 0) + 1);
              } else if (sql.includes("INTO salts")) {
                state.salts.set(args[0], { period: args[1], value: args[2] });
              } else if (sql.includes("INTO uniques")) {
                state.uniques.add(args.join("|"));
              }
              return {};
            },
            async first() {
              if (sql.includes("FROM salts")) return state.salts.get(args[0]) ?? null;
              return null;
            },
            async all() { return { results: [] }; },
          };
        },
        async all() { return { results: [] }; },
      };
    },
  };
}

const req = (body, headers = {}) => ({
  text: async () => body,
  headers: { get: (k) => headers[k.toLowerCase()] ?? null },
});

test("parseBeacon accepts only allowlisted page/event pairs", () => {
  assert.deepEqual(parseBeacon('{"page":"home","event":"view"}'), { page: "home", event: "view" });
  for (const bad of [
    "", "not json", "[]", '{"page":"home"}', '{"page":"evil","event":"view"}',
    '{"page":"home","event":"track"}', '{"page":1,"event":"view"}',
  ]) assert.equal(parseBeacon(bad), null, bad);
  assert.ok(PAGES.includes("descargas") && EVENTS.includes("install"));
});

test("uniqueHash: stable per salt+ip+ua; device-separating; salt-severed", async () => {
  const a = await uniqueHash("s1", "1.2.3.4", "iPad");
  assert.equal(a, await uniqueHash("s1", "1.2.3.4", "iPad"), "same inputs → same hash (dedup)");
  assert.notEqual(a, await uniqueHash("s1", "1.2.3.4", "Chromebook"), "same school IP, other device → distinct");
  assert.notEqual(a, await uniqueHash("s2", "1.2.3.4", "iPad"), "rotated salt → unlinkable");
  assert.match(a, /^[0-9a-f]{16}$/);
});

test("getSalt keeps the period's salt and overwrites on rotation", async () => {
  const db = fakeDB();
  const s1 = await getSalt(db, "day", "2026-07-19");
  assert.equal(await getSalt(db, "day", "2026-07-19"), s1);
  const s2 = await getSalt(db, "day", "2026-07-20");
  assert.notEqual(s2, s1);
  assert.equal(db.state.salts.get("day").value, s2, "old salt destroyed by overwrite");
});

test("handleBeacon: counts, records both unique windows, never stores ip/ua", async () => {
  const db = fakeDB();
  const env = { DB: db };
  const now = new Date("2026-07-19T12:00:00Z");
  const headers = { "cf-connecting-ip": "203.0.113.9", "user-agent": "Mozilla/5.0 (iPad; K5)" };

  let res = await handleBeacon(req('{"page":"home","event":"view"}', headers), env, now);
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "https://dliskills.com");
  await handleBeacon(req('{"page":"home","event":"view"}', headers), env, now);

  assert.equal(db.state.counters.get("2026-07-19|home|view"), 2, "two views counted");
  const uniq = [...db.state.uniques];
  assert.equal(uniq.length, 2, "one day + one month token despite two views (dedup)");
  assert.ok(uniq.some((u) => u.startsWith("day|2026-07-19|")));
  assert.ok(uniq.some((u) => u.startsWith("month|2026-07|")));

  // a second device behind the same IP adds new tokens
  await handleBeacon(req('{"page":"home","event":"view"}', { ...headers, "user-agent": "Chromebook" }), env, now);
  assert.equal(db.state.uniques.size, 4);

  // THE invariant: raw ip/ua never reach the database in any form
  for (const p of db.state.params) {
    assert.ok(!p.includes("203.0.113.9"), "raw IP leaked into SQL params");
    assert.ok(!p.includes("Mozilla") && !p.includes("iPad") && !p.includes("Chromebook"), "raw UA leaked");
  }

  // invalid payloads: 204, nothing recorded
  const before = db.state.params.length;
  res = await handleBeacon(req('{"page":"home","event":"hack"}', headers), env, now);
  assert.equal(res.status, 204);
  assert.equal(db.state.params.length, before, "invalid payload wrote nothing");
});

test("non-view events count but never touch uniques", async () => {
  const db = fakeDB();
  await handleBeacon(req('{"page":"descargas","event":"dl"}', { "cf-connecting-ip": "1.1.1.1", "user-agent": "x" }), { DB: db }, new Date("2026-07-19T00:00:00Z"));
  assert.equal(db.state.counters.get("2026-07-19|descargas|dl"), 1);
  assert.equal(db.state.uniques.size, 0);
});

test("handleAggregates returns JSON with CORS and prunes old day tokens", async () => {
  const db = fakeDB();
  const res = await handleAggregates({ DB: db }, new Date("2026-07-19T00:00:00Z"));
  assert.equal(res.headers.get("content-type"), "application/json");
  const body = JSON.parse(await res.text());
  assert.ok("counters" in body && "dau" in body && "mau" in body);
});
