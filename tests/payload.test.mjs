/**
 * Performance-budget invariants (GOAL.md / docs/MASCOT.md):
 *  - the whole app payload stays under 100 KB GZIPPED — what actually
 *    crosses the wire (GitHub Pages serves gzip; per-file compression
 *    mirrors per-asset HTTP transfer). Owner decision 2026-07-08,
 *    replacing the raw-byte budget (100 KB then 120 KB raw); the app
 *    measured ~37 KB gzipped at the changeover. Budget changes are
 *    owner decisions, never a loop's.
 *  - the mascot stays a lightweight guest (js/mascot.js well under its
 *    15 KB combined JS+CSS budget)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { statSync, readdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;

function bytes(rel) {
  return statSync(join(ROOT, rel)).size;
}

function gzBytes(rel) {
  return gzipSync(readFileSync(join(ROOT, rel))).length;
}

test("total app payload < 100 KB gzipped", () => {
  // manifest.webmanifest + sw.js ride the budget; icons/ PNGs are binary
  // assets outside it, like audio clips.
  let total = gzBytes("index.html") + gzBytes("about.html")
    + gzBytes("manifest.webmanifest") + gzBytes("sw.js");
  for (const f of readdirSync(join(ROOT, "js"))) total += gzBytes(join("js", f));
  for (const f of readdirSync(join(ROOT, "css"))) total += gzBytes(join("css", f));
  assert.ok(total < 100_000, `payload ${total} gzipped bytes exceeds 100 KB budget`);
});

test("mascot module stays lightweight (≤ 8 KB of the 15 KB budget)", () => {
  const size = bytes("js/mascot.js");
  assert.ok(size <= 8_192, `js/mascot.js is ${size} bytes`);
});
