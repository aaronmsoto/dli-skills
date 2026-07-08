/**
 * Single source of truth for the per-screen ℹ️ standards panels (M9 I2).
 * ℹ️ sits next to the page/quiz heading (owner, 2026-07-08) on the study,
 * práctica, quiz, and informe screens — home and group screens have none.
 * Every key here MUST have a matching button and vice versa (unit-tested).
 * The same mapping is mirrored as a table in docs/STANDARDS.md and
 * summarized on about.html — update all three together.
 *
 * Shape: kid = one short Spanish-first line a learner can read;
 * en = concise English standards mapping for parents/teachers;
 * cites = the specific standards references behind the claim.
 */
export const STANDARDS_INFO = {
  study: {
    kid: "Mira la tabla y toca una palabra para escucharla.",
    en: "Reference tables with tap-to-hear forms support interpretive reading AND listening of memorized words; printed sheets extend practice offline.",
    cites: ["7.1.NL.IPRET.1", "7.1.NM.IPRET.1", "NBPTS ECYA-WL Std IV"],
  },
  practica: {
    kid: "Reconstruye la tabla palabra por palabra. ¡Sin estrellas, solo práctica!",
    en: "Active recall inside the chart's visual scaffold — the bridge between studying and quizzing. Unscored on purpose: pressure-free retrieval practice (informative, never punitive).",
    cites: ["NBPTS ECYA-WL Std IV (scaffolding)", "7.1.NL.IPRET.1"],
  },
  choice: {
    kid: "Lee y elige la forma correcta.",
    en: "Interpretive recognition: learners identify the written form for a person + tense among linguistically-informed distractors (naive regularizations, cross-tense contrasts).",
    cites: ["7.1.NL.IPRET.1", "7.1.NM.IPRET.1"],
  },
  type: {
    kid: "Escribe la forma del verbo.",
    en: "Presentational writing at the word level: typed production with accent support and a penalty-free accent retry (corrective, never punitive feedback).",
    cites: ["7.1.NM.PRSNT.4", "7.1.NH.PRSNT.2"],
  },
  match: {
    kid: "Une cada persona con su forma.",
    en: "Interpretive recognition of form↔person links with strong visual support; scoring counts first-try matches to reward careful reading.",
    cites: ["7.1.NL.IPRET.1 (recognition with visual support)"],
  },
  listen: {
    kid: "Escucha y elige lo que oyes.",
    en: "Interpretive LISTENING: the target is heard, never shown — person endings and stress-as-tense (hablo/habló) by ear. Earns 🎧 badges, separate from stars, so devices without a Spanish voice are never penalized.",
    cites: ["7.1.NM.IPRET.1 (spoken words and phrases)"],
  },
  contrast: {
    kid: "La palabra del tiempo es tu pista: ¿pretérito o imperfecto?",
    en: "The storytelling tense contrast behind narration: conventional classroom time cues (una vez vs. muchas veces) scaffold the preterite/imperfect decision novices need for retelling.",
    cites: ["7.1.NH.PRSNT.4 (tell/retell)", "NBPTS ECYA-WL Std IV"],
  },
  report: {
    kid: "Tu progreso, listo para compartir.",
    en: "A printable snapshot of stars and 🎧 badges per group — students share progress with teachers and families on paper. No accounts, no data collection; everything lives on this device.",
    cites: ["NBPTS Std IV (progress over time)", "COPPA/FERPA-friendly by design"],
  },
};
