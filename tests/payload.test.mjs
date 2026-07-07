/**
 * Performance-budget invariants (GOAL.md / docs/MASCOT.md):
 *  - the whole app payload stays under 100 KB
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

test("total app payload < 100 KB", () => {
  let total = bytes("index.html") + bytes("about.html");
  for (const f of readdirSync(join(ROOT, "js"))) total += bytes(join("js", f));
  for (const f of readdirSync(join(ROOT, "css"))) total += bytes(join("css", f));
  assert.ok(total < 100_000, `payload ${total} bytes exceeds 100 KB budget`);
});

test("mascot module stays lightweight (≤ 8 KB of the 15 KB budget)", () => {
  const size = bytes("js/mascot.js");
  assert.ok(size <= 8_192, `js/mascot.js is ${size} bytes`);
});
