/**
 * Performance-budget invariants (GOAL.md / docs/MASCOT.md):
 *  - the whole app payload stays under 120 KB raw (~30 KB gzipped over the
 *    wire) — raised from 100 KB by owner decision 2026-07-07 when 🧱
 *    Práctica landed with the app already at ~95 KB; further raises are
 *    owner decisions, never a loop's
 *  - the mascot stays a lightweight guest (js/mascot.js well under its
 *    15 KB combined JS+CSS budget)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { statSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;

function bytes(rel) {
  return statSync(join(ROOT, rel)).size;
}

test("total app payload < 120 KB", () => {
  let total = bytes("index.html") + bytes("about.html");
  for (const f of readdirSync(join(ROOT, "js"))) total += bytes(join("js", f));
  for (const f of readdirSync(join(ROOT, "css"))) total += bytes(join("css", f));
  assert.ok(total < 120_000, `payload ${total} bytes exceeds 120 KB budget`);
});

test("mascot module stays lightweight (≤ 8 KB of the 15 KB budget)", () => {
  const size = bytes("js/mascot.js");
  assert.ok(size <= 8_192, `js/mascot.js is ${size} bytes`);
});
