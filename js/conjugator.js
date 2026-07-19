/**
 * Spanish conjugation engine for present (presente), preterite (pretérito
 * indefinido), and imperfect (pretérito imperfecto) — indicative mood.
 *
 * Regular paradigms are computed from the infinitive. Irregularities are
 * driven by flags on each verb entry (see js/verbs.js):
 *
 *   presYo    — irregular first-person-singular present ("tengo", "hago")
 *   presStem  — vowel change in persons yo/tú/él/ellos: "e>ie" | "o>ue" | "u>ue" | "e>i"
 *   pres      — full 6-form override for the present (ser, estar, ir, ...)
 *   pretStem  — strong (unstressed) preterite stem ("tuv", "dij", ...)
 *   pret3     — third-person vowel change in the preterite for -ir verbs: "e>i" | "o>u"
 *   pret      — full 6-form override for the preterite (ser/ir, dar, ver, hacer)
 *   imp       — full 6-form override for the imperfect (ser, ir, ver)
 *
 * Orthographic (spelling-only) changes are applied automatically:
 *   -car/-gar/-zar  → -qué/-gué/-cé in the yo preterite (buscar → busqué)
 *   vowel + -er/-ir → -yó/-yeron + accented weak endings (leer → leyó, leí)
 *   -guir           → yo present -go (seguir → sigo)
 *   -ger/-gir       → yo present -jo (dirigir → dirijo)
 *   vowel + -cer/-cir → yo present -zco (conocer → conozco)
 *
 * Persons are indexed 0..5: yo, tú, él/ella/usted, nosotros/as, vosotros/as,
 * ellos/ellas/ustedes.
 */

export const PERSONS = [
  "yo",
  "tú",
  "él / ella / usted",
  "nosotros/as",
  "vosotros/as",
  "ellos / ellas / ustedes",
];

export const TENSES = ["present", "preterite", "imperfect"];

export const TENSE_LABELS = {
  present: { es: "Presente", en: "Present" },
  preterite: { es: "Pretérito", en: "Preterite (simple past)" },
  imperfect: { es: "Imperfecto", en: "Imperfect (ongoing past)" },
};

// M26 stretch constructions (M4 reactivated, unscored-first): deliberately
// SEPARATE from TENSES so nothing that iterates TENSES (question sampling,
// star math, informe, contrast) ever picks them up. Estudia/Práctica only.
export const STRETCH_TENSES = ["nearfuture", "progressive"];

export const STRETCH_LABELS = {
  nearfuture: { es: "Muy pronto", en: "Near future (ir a + infinitive)" },
  progressive: { es: "Ahora mismo", en: "Right now (estar + -ndo)" },
};

const ENDINGS = {
  present: {
    ar: ["o", "as", "a", "amos", "áis", "an"],
    er: ["o", "es", "e", "emos", "éis", "en"],
    ir: ["o", "es", "e", "imos", "ís", "en"],
  },
  preterite: {
    ar: ["é", "aste", "ó", "amos", "asteis", "aron"],
    er: ["í", "iste", "ió", "imos", "isteis", "ieron"],
    ir: ["í", "iste", "ió", "imos", "isteis", "ieron"],
  },
  imperfect: {
    ar: ["aba", "abas", "aba", "ábamos", "abais", "aban"],
    er: ["ía", "ías", "ía", "íamos", "íais", "ían"],
    ir: ["ía", "ías", "ía", "íamos", "íais", "ían"],
  },
};

// Strong (unstressed) preterite endings; j-stems drop the i in ellos.
const STRONG_ENDINGS = ["e", "iste", "o", "imos", "isteis", "ieron"];

const STEM_CHANGE_PERSONS = [0, 1, 2, 5]; // yo, tú, él, ellos — the "boot"

function splitInfinitive(inf) {
  const ending = inf.slice(-2) === "ír" ? "ir" : inf.slice(-2); // oír → o + ir
  if (ending !== "ar" && ending !== "er" && ending !== "ir") {
    throw new Error(`Not an infinitive: ${inf}`);
  }
  return { stem: inf.slice(0, -2), ending };
}

/** Replace the LAST occurrence of `from` in `stem` with `to` (pensar → piens). */
function applyStemChange(stem, change) {
  const [from, to] = change.split(">");
  const i = stem.lastIndexOf(from);
  if (i === -1) throw new Error(`Stem change ${change} not applicable to "${stem}"`);
  return stem.slice(0, i) + to + stem.slice(i + from.length);
}

/** True if the preterite stem ends in a true vowel sound (leer, caer, oír — not seguir). */
function stemEndsInVowel(stem) {
  if (/(gu|qu)$/.test(stem)) return false; // silent-u digraphs
  return /[aeioáéíóú]$/i.test(stem);
}

/** Spelling adjustment for yo-present after stem changes: sigo, dirijo, conozco. */
function fixYoPresentSpelling(inf, bootStem) {
  if (inf.endsWith("guir")) return bootStem.replace(/gu$/, "g");
  if (inf.endsWith("ger") || inf.endsWith("gir")) return bootStem.replace(/g$/, "j");
  if (/[aeiou]c(er|ir)$/.test(inf)) return bootStem.replace(/c$/, "zc");
  return bootStem;
}

/** Spelling adjustment for yo-preterite of -ar verbs: busqué, llegué, empecé. */
function fixYoPreteriteSpelling(inf, stem) {
  if (inf.endsWith("car")) return stem.replace(/c$/, "qu");
  if (inf.endsWith("gar")) return stem.replace(/g$/, "gu");
  if (inf.endsWith("zar")) return stem.replace(/z$/, "c");
  return stem;
}

function conjugatePresent(verb) {
  if (verb.pres) return [...verb.pres];
  const { stem, ending } = splitInfinitive(verb.inf);
  const ends = ENDINGS.present[ending];
  const bootStem = verb.presStem ? applyStemChange(stem, verb.presStem) : stem;
  return ends.map((suffix, person) => {
    if (person === 0 && verb.presYo) return verb.presYo;
    const useBoot = STEM_CHANGE_PERSONS.includes(person);
    let s = useBoot ? bootStem : stem;
    if (person === 0) s = fixYoPresentSpelling(verb.inf, s);
    return s + suffix;
  });
}

function conjugatePreterite(verb) {
  if (verb.pret) return [...verb.pret];
  const { stem, ending } = splitInfinitive(verb.inf);

  if (verb.pretStem) {
    // Strong preterite: tuve, tuviste, tuvo... (dij- takes -eron)
    return STRONG_ENDINGS.map((suffix, person) => {
      if (person === 5 && verb.pretStem.endsWith("j")) return verb.pretStem + "eron";
      return verb.pretStem + suffix;
    });
  }

  const ends = ENDINGS.preterite[ending];

  if (ending !== "ar" && stemEndsInVowel(stem)) {
    // leer → leí, leíste, leyó, leímos, leísteis, leyeron
    const Y_ENDINGS = ["í", "íste", "yó", "ímos", "ísteis", "yeron"];
    return Y_ENDINGS.map((suffix) => stem + suffix);
  }

  // -ir verbs with a vowel change in él and ellos: pidió, durmió
  const thirdStem = verb.pret3 ? applyStemChange(stem, verb.pret3) : stem;

  return ends.map((suffix, person) => {
    let s = person === 2 || person === 5 ? thirdStem : stem;
    if (person === 0 && ending === "ar") s = fixYoPreteriteSpelling(verb.inf, s);
    return s + suffix;
  });
}

function conjugateImperfect(verb) {
  if (verb.imp) return [...verb.imp];
  const { stem, ending } = splitInfinitive(verb.inf);
  return ENDINGS.imperfect[ending].map((suffix) => stem + suffix);
}

/** Returns the 6 forms (yo → ellos) of `verb` in `tense`. */
export function conjugate(verb, tense) {
  switch (tense) {
    case "present":
      return conjugatePresent(verb);
    case "preterite":
      return conjugatePreterite(verb);
    case "imperfect":
      return conjugateImperfect(verb);
    default:
      throw new Error(`Unknown tense: ${tense}`);
  }
}

/** Full conjugation table: { present: [...], preterite: [...], imperfect: [...] } */
export function conjugateAll(verb) {
  return Object.fromEntries(TENSES.map((t) => [t, conjugate(verb, t)]));
}

// ---------------- M26 stretch constructions ----------------

// The two auxiliaries are fixed paradigms — hard-coded here so the engine
// needs no dataset import (and stays pure).
const IR_PRESENT = ["voy", "vas", "va", "vamos", "vais", "van"];
const ESTAR_PRESENT = ["estoy", "estás", "está", "estamos", "estáis", "están"];

/**
 * Gerund (gerundio). Regulars from the infinitive (-ando / -iendo);
 * vowel-final stems take -yendo (leyendo, oyendo, trayendo); -ir verbs
 * with a `pret3` vowel change use that SAME change here (RAE: pidiendo,
 * siguiendo, muriendo — the gerund shares the third-person preterite
 * stem); `ger` is the explicit override for the rest (diciendo,
 * viniendo, pudiendo); ir → yendo.
 */
export function gerund(verb) {
  if (verb.ger) return verb.ger;
  if (verb.inf === "ir") return "yendo";
  const { stem, ending } = splitInfinitive(verb.inf);
  if (ending === "ar") return stem + "ando";
  const gStem = ending === "ir" && verb.pret3 ? applyStemChange(stem, verb.pret3) : stem;
  if (stemEndsInVowel(gStem)) return gStem + "yendo";
  return gStem + "iendo";
}

/** Returns the 6 phrase forms (yo → ellos) of a stretch construction. */
export function conjugateStretch(verb, tense) {
  switch (tense) {
    case "nearfuture":
      return IR_PRESENT.map((aux) => `${aux} a ${verb.inf}`);
    case "progressive": {
      const g = gerund(verb);
      return ESTAR_PRESENT.map((aux) => `${aux} ${g}`);
    }
    default:
      throw new Error(`Unknown stretch tense: ${tense}`);
  }
}

/** Normalize for lenient answer checking (trim, lowercase, collapse spaces). */
export function normalizeAnswer(s) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Strip accents (n-tilde preserved) — detects "right except for the accent" answers. */
export function stripAccents(s) {
  const PLACEHOLDER = "\u0001";
  return s
    .replace(/\u00f1/g, PLACEHOLDER)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0001/g, "\u00f1");
}
