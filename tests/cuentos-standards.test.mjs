/**
 * Cuentos ℹ️ panels (docs/CUENTOS.md §9): STANDARDS_INFO keys ↔ screens,
 * shape { kid, en, cites }, kid lines Spanish-first.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STANDARDS_INFO } from "../cuentos/js/standards-info.js";

const KEYS = ["lee", "preguntas", "verdad", "ordena", "palabras", "mapa", "escucha", "report", "creditos"];

test("STANDARDS_INFO keys are exactly the Cuentos screens", () => {
  assert.deepEqual(Object.keys(STANDARDS_INFO).sort(), [...KEYS].sort());
});

test("every entry has kid/en/cites; kid lines are Spanish-first", () => {
  for (const [k, info] of Object.entries(STANDARDS_INFO)) {
    assert.ok(typeof info.kid === "string" && info.kid.length > 10, `${k}.kid`);
    assert.ok(typeof info.en === "string" && info.en.length > 20, `${k}.en`);
    assert.ok(Array.isArray(info.cites) && info.cites.length >= 2, `${k}.cites`);
    for (const c of info.cites) assert.ok(typeof c === "string" && c.length, `${k}.cites entry`);
    // Spanish signal: accents/ñ/¿¡ or common Spanish function words
    assert.match(info.kid, /[áéíóúñ¿¡]|\b(el|la|los|las|tu|y|en|de|que|es)\b/i, `${k}.kid should be Spanish`);
    assert.doesNotMatch(info.kid, /^(The|This|Read|Tap|Your)\b/, `${k}.kid must start in Spanish`);
  }
});

test("cites match the owner-approved references", () => {
  assert.ok(STANDARDS_INFO.lee.cites.includes("CCSS en Español RL.3.5 (partes del cuento)"));
  assert.ok(STANDARDS_INFO.preguntas.cites.some((c) => c.startsWith("CCSS en Español RL.3.1")));
  assert.deepEqual(STANDARDS_INFO.preguntas.cites, STANDARDS_INFO.verdad.cites);
  assert.ok(STANDARDS_INFO.escucha.cites.includes("accessibility: 🎧 badges never required for ⭐"));
  assert.ok(STANDARDS_INFO.creditos.cites.some((c) => c.includes("Std III")));
  // never state-specific standards (CLAUDE.md rule 6)
  for (const info of Object.values(STANDARDS_INFO)) for (const c of info.cites) assert.doesNotMatch(c, /NJSLS/);
});

test("every ℹ️ key is wired in cuentos/js/app.js", () => {
  const src = readFileSync(new URL("../cuentos/js/app.js", import.meta.url), "utf8");
  for (const k of ["lee", "report", "creditos"]) assert.ok(src.includes(`infoButton("${k}")`), `infoButton("${k}") missing`);
  // rounds pass the activity key itself: infoButton(act)
  assert.ok(src.includes("infoButton(act)"), "rounds must call infoButton(act)");
});
