/**
 * Clip-manifest integrity (owner-directed 2026-07-15, after the initial
 * generation run left accent-collision residue). Guards the invariants the
 * M12 slug+hash naming scheme promises:
 *  - exact-text keys, NFC-normalized (lookups in js/audio.js are exact
 *    string matches against app-generated text);
 *  - no two texts may share a clip file (hablo ≠ habló — the hash covers
 *    the ORIGINAL accented text, so diacritic siblings never collide);
 *  - every referenced file exists; no orphan mp3s linger on disk;
 *  - every string the nest (js/nido.js) can speak has both speed variants.
 * Run: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../audio/manifest.json", import.meta.url), "utf8"));
const clipsDir = new URL("../audio/clips/", import.meta.url);

test("manifest: keys are NFC and every entry has both speed variants on disk", () => {
  for (const [text, entry] of Object.entries(manifest)) {
    assert.equal(text, text.normalize("NFC"), `non-NFC key: ${JSON.stringify(text)}`);
    for (const v of ["n", "s"]) {
      assert.ok(entry[v], `"${text}" missing variant ${v}`);
      assert.ok(existsSync(new URL(`../audio/${entry[v]}`, import.meta.url)),
        `"${text}" references missing file ${entry[v]}`);
    }
  }
});

test("manifest: no clip file is shared by two texts (accent-collision guard)", () => {
  const owner = new Map();
  for (const [text, entry] of Object.entries(manifest)) {
    for (const v of ["n", "s"]) {
      const prev = owner.get(entry[v]);
      assert.ok(!prev || prev === text,
        `collision: ${entry[v]} claimed by ${JSON.stringify(prev)} and ${JSON.stringify(text)}`);
      owner.set(entry[v], text);
    }
  }
});

test("clips dir: no orphan mp3s (residue of the pre-hash naming scheme)", () => {
  const referenced = new Set();
  for (const entry of Object.values(manifest))
    for (const v of ["n", "s"]) referenced.add(entry[v].replace("clips/", ""));
  const orphans = readdirSync(clipsDir).filter((f) => f.endsWith(".mp3") && !referenced.has(f));
  assert.deepEqual(orphans, [], `orphan clips on disk: ${orphans.slice(0, 5).join(", ")}${orphans.length > 5 ? "…" : ""}`);
});

test("nest audio (M18.2/M19): every string js/nido.js can speak has clips", async () => {
  const { tierMeta, PLUMA } = await import("../js/nido.js");
  const spoken = [PLUMA.article];
  for (const tier of [1, 2, 3]) {
    const t = tierMeta(tier);
    spoken.push(t.article, `${t.article} y ${PLUMA.article}`);
  }
  for (const text of spoken) {
    assert.ok(manifest[text]?.n && manifest[text]?.s,
      `nest phrase ${JSON.stringify(text)} missing from the clip manifest — run: node tools/generate-audio.mjs --nest`);
  }
});
