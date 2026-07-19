/**
 * M26 stretch constructions — hand-verified against RAE conjugation
 * tables (gerundio column; perífrasis ir a + infinitivo / estar +
 * gerundio). Golden rule 1: every irregular-gerund class in the dataset
 * gets an explicit expected form here.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { VERBS } from "../js/verbs.js";
import { gerund, conjugateStretch, STRETCH_TENSES, TENSES } from "../js/conjugator.js";

const byInf = Object.fromEntries(VERBS.map((v) => [v.inf, v]));

// Hand-verified gerunds (RAE), one per formation class + every irregular.
const GERUNDS = {
  // regular -ar / -er / -ir
  hablar: "hablando",
  trabajar: "trabajando",
  comer: "comiendo",
  correr: "corriendo",
  vivir: "viviendo",
  escribir: "escribiendo",
  cumplir: "cumpliendo",
  abrir: "abriendo",
  // full-override auxiliaries & friends
  ser: "siendo",
  estar: "estando",
  ver: "viendo",
  dar: "dando",
  saber: "sabiendo",
  ir: "yendo",
  // y-insertion after a vowel stem
  leer: "leyendo",
  creer: "creyendo",
  caer: "cayendo",
  "oír": "oyendo",
  traer: "trayendo",
  // -ir e>i (gerund shares the pret3 stem change)
  pedir: "pidiendo",
  seguir: "siguiendo",
  conseguir: "consiguiendo",
  servir: "sirviendo",
  sentir: "sintiendo",
  convertir: "convirtiendo",
  // -ir o>u
  morir: "muriendo",
  // explicit `ger` overrides
  decir: "diciendo",
  venir: "viniendo",
  poder: "pudiendo",
  // stem-changing verbs whose gerund is nevertheless regular
  pensar: "pensando",
  volver: "volviendo",
  perder: "perdiendo",
  entender: "entendiendo",
  jugar: "jugando",
  tener: "teniendo",
  hacer: "haciendo",
  querer: "queriendo",
  poner: "poniendo",
  contar: "contando",
  empezar: "empezando",
};

test("gerunds match RAE for every formation class in the dataset", () => {
  for (const [inf, expected] of Object.entries(GERUNDS)) {
    const verb = byInf[inf];
    assert.ok(verb, `dataset missing "${inf}"`);
    assert.equal(gerund(verb), expected, `gerund of ${inf}`);
  }
});

test("every dataset gerund is well-formed and never misapplies -yendo", () => {
  for (const verb of VERBS) {
    const g = gerund(verb);
    assert.match(g, /^(\S+)?(ando|iendo|yendo)$/, `${verb.inf} → ${g}`);
    // -yendo only ever follows a vowel (leyendo, oyendo) or starts the
    // word (yendo) — never a consonant (no "comyendo")
    const i = g.indexOf("yendo");
    if (i > 0) assert.match(g[i - 1], /[aeioáéíóú]/, `${verb.inf} → ${g}`);
    // -ar verbs never take -iendo/-yendo
    if (verb.inf.endsWith("ar")) assert.ok(g.endsWith("ando"), `${verb.inf} → ${g}`);
  }
});

test("ir a + infinitive: full paradigm, hand-verified", () => {
  assert.deepEqual(conjugateStretch(byInf.hablar, "nearfuture"), [
    "voy a hablar", "vas a hablar", "va a hablar",
    "vamos a hablar", "vais a hablar", "van a hablar",
  ]);
  // the auxiliary is ALWAYS present-tense ir, whatever the main verb
  assert.deepEqual(conjugateStretch(byInf.ser, "nearfuture")[2], "va a ser");
  assert.deepEqual(conjugateStretch(byInf.ir, "nearfuture")[0], "voy a ir");
  assert.deepEqual(conjugateStretch(byInf.tener, "nearfuture")[5], "van a tener");
});

test("estar + gerund: full paradigm, hand-verified", () => {
  assert.deepEqual(conjugateStretch(byInf.hablar, "progressive"), [
    "estoy hablando", "estás hablando", "está hablando",
    "estamos hablando", "estáis hablando", "están hablando",
  ]);
  assert.equal(conjugateStretch(byInf.pedir, "progressive")[2], "está pidiendo");
  assert.equal(conjugateStretch(byInf.leer, "progressive")[1], "estás leyendo");
  assert.equal(conjugateStretch(byInf.decir, "progressive")[5], "están diciendo");
  assert.equal(conjugateStretch(byInf.morir, "progressive")[0], "estoy muriendo");
});

test("stretch tenses stay out of the scored TENSES list", () => {
  for (const s of STRETCH_TENSES) assert.ok(!TENSES.includes(s));
  assert.equal(TENSES.length, 3); // STARS_PER_SET math depends on this
});

test("conjugateStretch rejects unknown constructions", () => {
  assert.throws(() => conjugateStretch(byInf.hablar, "future"));
});
