/**
 * Single source of truth for the per-screen ℹ️ standards panels (M9 I2).
 * Every screen key the router can render MUST have an entry (unit-tested).
 * The same mapping is mirrored as a table in docs/STANDARDS.md and
 * summarized on about.html — update all three together.
 *
 * Shape: kid = one short Spanish-first line a learner can read;
 * en = concise English standards mapping for parents/teachers;
 * cites = the specific standards references behind the claim.
 */
export const STANDARDS_INFO = {
  home: {
    kid: "¡Elige un grupo de verbos y empieza a practicar!",
    en: "Five-verb groups sequence high-frequency vocabulary in small sets, and stars/badges show progress at a glance — self-paced practice with predictable structure (NBPTS Std IV: language develops over time with extensive exposure).",
    cites: ["NBPTS ECYA-WL Std IV", "NJSLS-WL Novice ladder"],
  },
  set: {
    kid: "Primero el tiempo, después la actividad.",
    en: "Tense cards pair each tense with a time cue and an example sentence (meaning before form); the activity ladder runs recognition before production: Estudia → Práctica → Elige → Escribe → Empareja.",
    cites: ["NBPTS ECYA-WL Std IV (scaffolding)", "7.1.NL.IPRET.1"],
  },
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
