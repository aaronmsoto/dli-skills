/**
 * Cuentos budget (docs/CUENTOS.md §2): everything under cuentos/ ≤ 150 KB
 * gzipped (per-file gzip, like tests/payload.test.mjs). Budget changes are
 * owner decisions. Also: sw.js precaches every Cuentos shell file.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIR = join(ROOT, "cuentos");

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

test("cuentos/ payload ≤ 150 000 bytes gzipped", () => {
  let total = 0;
  for (const f of walk(DIR)) total += gzipSync(readFileSync(f)).length;
  console.log(`# cuentos/ gzip payload: ${total} bytes`);
  assert.ok(total <= 150_000, `cuentos/ payload ${total} gzipped bytes exceeds the 150 KB budget`);
});

test("sw.js precaches every Cuentos shell file", () => {
  const sw = readFileSync(join(ROOT, "sw.js"), "utf8");
  const shell = [...sw.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  for (const f of walk(DIR)) {
    const rel = relative(ROOT, f);
    if (!/\.(html|css|js)$/.test(rel)) continue;
    assert.ok(shell.includes(rel), `sw.js SHELL is missing ${rel}`);
  }
});
