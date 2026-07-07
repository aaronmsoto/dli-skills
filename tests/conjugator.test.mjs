/**
 * Conjugation accuracy tests. Expected forms are hand-verified against
 * standard references (RAE conjugation tables). Every irregularity class
 * in the dataset is covered, plus structural invariants over all 100 verbs.
 *
 * Run: npm test  (node --test tests/)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { VERBS, SETS, SET_SIZE } from "../js/verbs.js";
import { conjugate, TENSES, PERSONS, stripAccents, normalizeAnswer } from "../js/conjugator.js";

const byInf = Object.fromEntries(VERBS.map((v) => [v.inf, v]));

function expectForms(inf, tense, expected) {
  const got = conjugate(byInf[inf], tense);
  assert.deepEqual(got, expected, `${inf} (${tense})`);
}

// ---------- Top-10 fully verified in all three tenses ----------

test("ser — all tenses", () => {
  expectForms("ser", "present", ["soy", "eres", "es", "somos", "sois", "son"]);
  expectForms("ser", "preterite", ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"]);
  expectForms("ser", "imperfect", ["era", "eras", "era", "éramos", "erais", "eran"]);
});

test("estar — all tenses", () => {
  expectForms("estar", "present", ["estoy", "estás", "está", "estamos", "estáis", "están"]);
  expectForms("estar", "preterite", ["estuve", "estuviste", "estuvo", "estuvimos", "estuvisteis", "estuvieron"]);
  expectForms("estar", "imperfect", ["estaba", "estabas", "estaba", "estábamos", "estabais", "estaban"]);
});

test("tener — all tenses", () => {
  expectForms("tener", "present", ["tengo", "tienes", "tiene", "tenemos", "tenéis", "tienen"]);
  expectForms("tener", "preterite", ["tuve", "tuviste", "tuvo", "tuvimos", "tuvisteis", "tuvieron"]);
  expectForms("tener", "imperfect", ["tenía", "tenías", "tenía", "teníamos", "teníais", "tenían"]);
});

test("hacer — all tenses", () => {
  expectForms("hacer", "present", ["hago", "haces", "hace", "hacemos", "hacéis", "hacen"]);
  expectForms("hacer", "preterite", ["hice", "hiciste", "hizo", "hicimos", "hicisteis", "hicieron"]);
  expectForms("hacer", "imperfect", ["hacía", "hacías", "hacía", "hacíamos", "hacíais", "hacían"]);
});

test("ir — all tenses", () => {
  expectForms("ir", "present", ["voy", "vas", "va", "vamos", "vais", "van"]);
  expectForms("ir", "preterite", ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"]);
  expectForms("ir", "imperfect", ["iba", "ibas", "iba", "íbamos", "ibais", "iban"]);
});

test("decir — all tenses", () => {
  expectForms("decir", "present", ["digo", "dices", "dice", "decimos", "decís", "dicen"]);
  expectForms("decir", "preterite", ["dije", "dijiste", "dijo", "dijimos", "dijisteis", "dijeron"]);
  expectForms("decir", "imperfect", ["decía", "decías", "decía", "decíamos", "decíais", "decían"]);
});

test("poder — all tenses", () => {
  expectForms("poder", "present", ["puedo", "puedes", "puede", "podemos", "podéis", "pueden"]);
  expectForms("poder", "preterite", ["pude", "pudiste", "pudo", "pudimos", "pudisteis", "pudieron"]);
  expectForms("poder", "imperfect", ["podía", "podías", "podía", "podíamos", "podíais", "podían"]);
});

test("ver — all tenses", () => {
  expectForms("ver", "present", ["veo", "ves", "ve", "vemos", "veis", "ven"]);
  expectForms("ver", "preterite", ["vi", "viste", "vio", "vimos", "visteis", "vieron"]);
  expectForms("ver", "imperfect", ["veía", "veías", "veía", "veíamos", "veíais", "veían"]);
});

test("dar — all tenses", () => {
  expectForms("dar", "present", ["doy", "das", "da", "damos", "dais", "dan"]);
  expectForms("dar", "preterite", ["di", "diste", "dio", "dimos", "disteis", "dieron"]);
  expectForms("dar", "imperfect", ["daba", "dabas", "daba", "dábamos", "dabais", "daban"]);
});

test("saber — all tenses", () => {
  expectForms("saber", "present", ["sé", "sabes", "sabe", "sabemos", "sabéis", "saben"]);
  expectForms("saber", "preterite", ["supe", "supiste", "supo", "supimos", "supisteis", "supieron"]);
  expectForms("saber", "imperfect", ["sabía", "sabías", "sabía", "sabíamos", "sabíais", "sabían"]);
});

// ---------- Regular paradigms ----------

test("regular -ar: hablar", () => {
  expectForms("hablar", "present", ["hablo", "hablas", "habla", "hablamos", "habláis", "hablan"]);
  expectForms("hablar", "preterite", ["hablé", "hablaste", "habló", "hablamos", "hablasteis", "hablaron"]);
  expectForms("hablar", "imperfect", ["hablaba", "hablabas", "hablaba", "hablábamos", "hablabais", "hablaban"]);
});

test("regular -er: comer", () => {
  expectForms("comer", "present", ["como", "comes", "come", "comemos", "coméis", "comen"]);
  expectForms("comer", "preterite", ["comí", "comiste", "comió", "comimos", "comisteis", "comieron"]);
  expectForms("comer", "imperfect", ["comía", "comías", "comía", "comíamos", "comíais", "comían"]);
});

test("regular -ir: vivir", () => {
  expectForms("vivir", "present", ["vivo", "vives", "vive", "vivimos", "vivís", "viven"]);
  expectForms("vivir", "preterite", ["viví", "viviste", "vivió", "vivimos", "vivisteis", "vivieron"]);
  expectForms("vivir", "imperfect", ["vivía", "vivías", "vivía", "vivíamos", "vivíais", "vivían"]);
});

test("regular -ar with vowel stem: crear (no y-insertion in -ar verbs)", () => {
  expectForms("crear", "preterite", ["creé", "creaste", "creó", "creamos", "creasteis", "crearon"]);
});

// ---------- Present stem changes ----------

test("e>ie boot: pensar, querer, entender, empezar, comenzar, perder", () => {
  expectForms("pensar", "present", ["pienso", "piensas", "piensa", "pensamos", "pensáis", "piensan"]);
  expectForms("querer", "present", ["quiero", "quieres", "quiere", "queremos", "queréis", "quieren"]);
  expectForms("entender", "present", ["entiendo", "entiendes", "entiende", "entendemos", "entendéis", "entienden"]);
  expectForms("empezar", "present", ["empiezo", "empiezas", "empieza", "empezamos", "empezáis", "empiezan"]);
  expectForms("comenzar", "present", ["comienzo", "comienzas", "comienza", "comenzamos", "comenzáis", "comienzan"]);
  expectForms("perder", "present", ["pierdo", "pierdes", "pierde", "perdemos", "perdéis", "pierden"]);
});

test("o>ue boot: encontrar, volver, contar, recordar, morir", () => {
  expectForms("encontrar", "present", ["encuentro", "encuentras", "encuentra", "encontramos", "encontráis", "encuentran"]);
  expectForms("volver", "present", ["vuelvo", "vuelves", "vuelve", "volvemos", "volvéis", "vuelven"]);
  expectForms("contar", "present", ["cuento", "cuentas", "cuenta", "contamos", "contáis", "cuentan"]);
  expectForms("recordar", "present", ["recuerdo", "recuerdas", "recuerda", "recordamos", "recordáis", "recuerdan"]);
  expectForms("morir", "present", ["muero", "mueres", "muere", "morimos", "morís", "mueren"]);
});

test("e>i boot: pedir, servir, seguir (with g-spelling), conseguir", () => {
  expectForms("pedir", "present", ["pido", "pides", "pide", "pedimos", "pedís", "piden"]);
  expectForms("servir", "present", ["sirvo", "sirves", "sirve", "servimos", "servís", "sirven"]);
  expectForms("seguir", "present", ["sigo", "sigues", "sigue", "seguimos", "seguís", "siguen"]);
  expectForms("conseguir", "present", ["consigo", "consigues", "consigue", "conseguimos", "conseguís", "consiguen"]);
});

test("u>ue boot: jugar", () => {
  expectForms("jugar", "present", ["juego", "juegas", "juega", "jugamos", "jugáis", "juegan"]);
});

// ---------- Irregular yo-forms ----------

test("-go verbs: poner, salir, venir, traer, caer, suponer, mantener", () => {
  expectForms("poner", "present", ["pongo", "pones", "pone", "ponemos", "ponéis", "ponen"]);
  expectForms("salir", "present", ["salgo", "sales", "sale", "salimos", "salís", "salen"]);
  expectForms("venir", "present", ["vengo", "vienes", "viene", "venimos", "venís", "vienen"]);
  expectForms("traer", "present", ["traigo", "traes", "trae", "traemos", "traéis", "traen"]);
  expectForms("caer", "present", ["caigo", "caes", "cae", "caemos", "caéis", "caen"]);
  expectForms("suponer", "present", ["supongo", "supones", "supone", "suponemos", "suponéis", "suponen"]);
  expectForms("mantener", "present", ["mantengo", "mantienes", "mantiene", "mantenemos", "mantenéis", "mantienen"]);
});

test("-zco verbs (automatic): conocer, parecer, aparecer, reconocer, ofrecer, nacer, producir", () => {
  expectForms("conocer", "present", ["conozco", "conoces", "conoce", "conocemos", "conocéis", "conocen"]);
  expectForms("parecer", "present", ["parezco", "pareces", "parece", "parecemos", "parecéis", "parecen"]);
  expectForms("aparecer", "present", ["aparezco", "apareces", "aparece", "aparecemos", "aparecéis", "aparecen"]);
  expectForms("reconocer", "present", ["reconozco", "reconoces", "reconoce", "reconocemos", "reconocéis", "reconocen"]);
  expectForms("ofrecer", "present", ["ofrezco", "ofreces", "ofrece", "ofrecemos", "ofrecéis", "ofrecen"]);
  expectForms("nacer", "present", ["nazco", "naces", "nace", "nacemos", "nacéis", "nacen"]);
  expectForms("producir", "present", ["produzco", "produces", "produce", "producimos", "producís", "producen"]);
});

test("g>j yo (automatic): dirigir", () => {
  expectForms("dirigir", "present", ["dirijo", "diriges", "dirige", "dirigimos", "dirigís", "dirigen"]);
});

test("oír — full present, automatic y-preterite, regular imperfect", () => {
  expectForms("oír", "present", ["oigo", "oyes", "oye", "oímos", "oís", "oyen"]);
  expectForms("oír", "preterite", ["oí", "oíste", "oyó", "oímos", "oísteis", "oyeron"]);
  expectForms("oír", "imperfect", ["oía", "oías", "oía", "oíamos", "oíais", "oían"]);
});

// ---------- Preterite: strong stems ----------

test("strong preterites: querer, poner, venir, suponer, mantener", () => {
  expectForms("querer", "preterite", ["quise", "quisiste", "quiso", "quisimos", "quisisteis", "quisieron"]);
  expectForms("poner", "preterite", ["puse", "pusiste", "puso", "pusimos", "pusisteis", "pusieron"]);
  expectForms("venir", "preterite", ["vine", "viniste", "vino", "vinimos", "vinisteis", "vinieron"]);
  expectForms("suponer", "preterite", ["supuse", "supusiste", "supuso", "supusimos", "supusisteis", "supusieron"]);
  expectForms("mantener", "preterite", ["mantuve", "mantuviste", "mantuvo", "mantuvimos", "mantuvisteis", "mantuvieron"]);
});

test("j-stem preterites drop the i in ellos: traer, producir", () => {
  expectForms("traer", "preterite", ["traje", "trajiste", "trajo", "trajimos", "trajisteis", "trajeron"]);
  expectForms("producir", "preterite", ["produje", "produjiste", "produjo", "produjimos", "produjisteis", "produjeron"]);
});

// ---------- Preterite: orthographic yo (-car/-gar/-zar, automatic) ----------

test("-gar → -gué: llegar, pagar, jugar", () => {
  expectForms("llegar", "preterite", ["llegué", "llegaste", "llegó", "llegamos", "llegasteis", "llegaron"]);
  expectForms("pagar", "preterite", ["pagué", "pagaste", "pagó", "pagamos", "pagasteis", "pagaron"]);
  expectForms("jugar", "preterite", ["jugué", "jugaste", "jugó", "jugamos", "jugasteis", "jugaron"]);
});

test("-car → -qué: buscar, sacar, tocar, explicar", () => {
  expectForms("buscar", "preterite", ["busqué", "buscaste", "buscó", "buscamos", "buscasteis", "buscaron"]);
  expectForms("sacar", "preterite", ["saqué", "sacaste", "sacó", "sacamos", "sacasteis", "sacaron"]);
  expectForms("tocar", "preterite", ["toqué", "tocaste", "tocó", "tocamos", "tocasteis", "tocaron"]);
  expectForms("explicar", "preterite", ["expliqué", "explicaste", "explicó", "explicamos", "explicasteis", "explicaron"]);
});

test("-zar → -cé: empezar, comenzar, realizar, alcanzar, utilizar", () => {
  expectForms("empezar", "preterite", ["empecé", "empezaste", "empezó", "empezamos", "empezasteis", "empezaron"]);
  expectForms("comenzar", "preterite", ["comencé", "comenzaste", "comenzó", "comenzamos", "comenzasteis", "comenzaron"]);
  expectForms("realizar", "preterite", ["realicé", "realizaste", "realizó", "realizamos", "realizasteis", "realizaron"]);
  expectForms("alcanzar", "preterite", ["alcancé", "alcanzaste", "alcanzó", "alcanzamos", "alcanzasteis", "alcanzaron"]);
  expectForms("utilizar", "preterite", ["utilicé", "utilizaste", "utilizó", "utilizamos", "utilizasteis", "utilizaron"]);
});

// ---------- Preterite: y-insertion (vowel stems, automatic) ----------

test("vowel-stem -er: creer, leer, caer", () => {
  expectForms("creer", "preterite", ["creí", "creíste", "creyó", "creímos", "creísteis", "creyeron"]);
  expectForms("leer", "preterite", ["leí", "leíste", "leyó", "leímos", "leísteis", "leyeron"]);
  expectForms("caer", "preterite", ["caí", "caíste", "cayó", "caímos", "caísteis", "cayeron"]);
});

// ---------- Preterite: -ir third-person vowel changes ----------

test("e>i in él/ellos: pedir, sentir, servir, seguir, conseguir, convertir", () => {
  expectForms("pedir", "preterite", ["pedí", "pediste", "pidió", "pedimos", "pedisteis", "pidieron"]);
  expectForms("sentir", "preterite", ["sentí", "sentiste", "sintió", "sentimos", "sentisteis", "sintieron"]);
  expectForms("servir", "preterite", ["serví", "serviste", "sirvió", "servimos", "servisteis", "sirvieron"]);
  expectForms("seguir", "preterite", ["seguí", "seguiste", "siguió", "seguimos", "seguisteis", "siguieron"]);
  expectForms("conseguir", "preterite", ["conseguí", "conseguiste", "consiguió", "conseguimos", "conseguisteis", "consiguieron"]);
  expectForms("convertir", "preterite", ["convertí", "convertiste", "convirtió", "convertimos", "convertisteis", "convirtieron"]);
});

test("o>u in él/ellos: morir", () => {
  expectForms("morir", "preterite", ["morí", "moriste", "murió", "morimos", "moristeis", "murieron"]);
});

// ---------- Structural invariants over the whole dataset ----------

test("dataset: exactly 100 verbs, unique infinitives, ranks 1..100", () => {
  assert.equal(VERBS.length, 100);
  assert.equal(new Set(VERBS.map((v) => v.inf)).size, 100);
  assert.deepEqual(VERBS.map((v) => v.rank), Array.from({ length: 100 }, (_, i) => i + 1));
});

test("dataset: 20 sets of 5", () => {
  assert.equal(SET_SIZE, 5);
  assert.equal(SETS.length, 20);
  for (const s of SETS) assert.equal(s.verbs.length, 5);
});

test("every verb conjugates to 6 well-formed forms in every tense", () => {
  for (const v of VERBS) {
    for (const t of TENSES) {
      const forms = conjugate(v, t);
      assert.equal(forms.length, PERSONS.length, `${v.inf} ${t}`);
      for (const f of forms) {
        assert.match(f, /^[a-záéíóúñü]+$/, `${v.inf} ${t}: "${f}"`);
      }
    }
  }
});

test("full-override arrays have exactly 6 forms", () => {
  for (const v of VERBS) {
    for (const key of ["pres", "pret", "imp"]) {
      if (v[key]) assert.equal(v[key].length, 6, `${v.inf}.${key}`);
    }
  }
});

// ---------- Answer-checking helpers ----------

test("normalizeAnswer and stripAccents", () => {
  assert.equal(normalizeAnswer("  Hablé "), "hablé");
  assert.equal(stripAccents("hablé"), "hable");
  assert.equal(stripAccents("veíamos"), "veiamos");
  assert.equal(stripAccents("año"), "año"); // ñ preserved
});
