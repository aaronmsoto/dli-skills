/**
 * Cuentos — single source of truth for the per-screen ℹ️ standards panels
 * (mirrors js/standards-info.js). ℹ️ sits beside the h1 (reader, informe,
 * créditos) or in the prompt-card corner (rounds); never on the Biblioteca
 * or story screens. Keys are unit-tested (tests/cuentos-standards.test.mjs).
 *
 * Shape: kid = one short Spanish-first line a learner can read;
 * en = concise English mapping for parents/teachers; cites = references.
 * Cuentos-only framing (owner, 2026-10-30): NBPTS ECYA-WL + NCSSFL-ACTFL
 * Interpretive Can-Dos + CCSS RL.3 via Common Core en Español.
 */
export const STANDARDS_INFO = {
  lee: {
    kid: "Lee el cuento. Toca una palabra para ver qué significa.",
    en: "Graded retellings at three levels let one story serve a mixed class. Tap-word glossary, read-aloud with sentence highlighting, and optional prediction stops make before/during-reading strategies explicit. Unscored on purpose.",
    cites: ["NCSSFL-ACTFL Interpretive Reading (Novice Mid–High)", "CCSS en Español RL.3.5 (partes del cuento)", "NBPTS ECYA-WL Std IV"],
  },
  preguntas: {
    kid: "Lee la pregunta y busca la respuesta en el cuento.",
    en: "Literal (who/what/where), inferential (why/how), sequence, and central-message questions. A miss shows the answer AND highlights the sentence that proves it — informative, never punitive.",
    cites: ["CCSS en Español RL.3.1 (preguntas y respuestas con evidencia del texto)", "NCSSFL-ACTFL Interpretive Reading (Novice Mid–High)", "NBPTS ECYA-WL Std VII (feedback)"],
  },
  verdad: {
    kid: "¿Es verdad o es mentira? El cuento tiene la respuesta.",
    en: "True/false statements checked against the text; every answer points back to its evidence sentence, which is highlighted on a miss.",
    cites: ["CCSS en Español RL.3.1 (preguntas y respuestas con evidencia del texto)", "NCSSFL-ACTFL Interpretive Reading (Novice Mid–High)", "NBPTS ECYA-WL Std VII (feedback)"],
  },
  ordena: {
    kid: "Pon los eventos del cuento en orden: primero, después, al final.",
    en: "Retelling by sequencing key events (beginning–middle–end). Scoring counts events placed right on the first try; a wrong tap simply returns the tile.",
    cites: ["CCSS en Español RL.3.2 (recontar cuentos y fábulas)", "RL.3.5", "NBPTS Std IV"],
  },
  palabras: {
    kid: "Mira la palabra en su oración. ¿Qué significa?",
    en: "Word meaning from context: the word is shown inside its own sentence and learners pick the English meaning (the class reads English well — RL.3.4 in the second language).",
    cites: ["CCSS en Español RL.3.4 (significado de palabras en contexto)", "NCSSFL-ACTFL Interpretive Reading (Novice Mid)"],
  },
  mapa: {
    kid: "Completa el mapa: personajes, lugar, problema y solución.",
    en: "A story map (characters, setting, problem, solution) builds the story-grammar schema behind retelling and the central message.",
    cites: ["CCSS en Español RL.3.2 (mensaje central) y RL.3.3 (personajes)", "NBPTS Std IV"],
  },
  escucha: {
    kid: "Escucha la oración y elige la que oyes.",
    en: "Interpretive LISTENING: the sentence is heard, never shown. Earns 🎧 badges on a separate track — progress never requires hearing, so every ⭐ stays reachable without audio.",
    cites: ["NCSSFL-ACTFL Interpretive Listening (Novice Mid)", "accessibility: 🎧 badges never required for ⭐"],
  },
  report: {
    kid: "Tu progreso de lectura, listo para compartir.",
    en: "A printable snapshot of stars, 🎧 badges, and reads per story and level. No accounts, no personal data; progress lives only on this device.",
    cites: ["NBPTS Std VII (progress over time)", "COPPA/FERPA-friendly by design"],
  },
  creditos: {
    kid: "Estos cuentos vienen de muchos países. ¡Gracias a sus autores!",
    en: "Every story is a graded adaptation of a public-domain text, credited to its author, country, and source — a window on Hispanic and world literary culture.",
    cites: ["NBPTS ECYA-WL Std III (culture: authors from Cuba, Colombia, Uruguay, Greece)", "Public-domain sources, attribution required"],
  },
};
