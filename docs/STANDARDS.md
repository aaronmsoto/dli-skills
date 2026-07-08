# Standards Alignment — Conjuga (DLI Skills Builder)

This document grounds Conjuga's design in two national frameworks — NBPTS
(the teaching standards) and NCSSFL-ACTFL (the proficiency levels) — and
records exactly how each feature maps to them.

Sources (retrieved 2026-07; national-only per owner decision 2026-07-08 —
state-specific standards such as NJSLS-WL are no longer referenced):
- **NBPTS World Languages Standards, Second Edition (ECYA-WL)** — National Board
  for Professional Teaching Standards.
  https://www.nbpts.org/wp-content/uploads/2021/09/ECYA-WL.pdf
- **NCSSFL-ACTFL Can-Do Statements** — a joint framework of the National
  Council of State Supervisors for Languages (NCSSFL) and the American
  Council on the Teaching of Foreign Languages (ACTFL).
  https://www.actfl.org/uploads/files/general/Professional-Learning/Can-Do-Intro-Overview.pdf

## 1. NCSSFL-ACTFL Can-Do Statements: proficiency levels

The Can-Do Statements describe what learners can do at each ACTFL
proficiency level across three modes of communication:
- **Interpretive** — understanding spoken/written language (one-way).
- **Interpersonal** — two-way exchange with negotiation of meaning.
- **Presentational** — producing language for an audience (one-way).

The Novice band — Conjuga's target — in Can-Do terms:

- **Novice Low** — can communicate using practiced, memorized words and
  phrases on very familiar topics.
- **Novice Mid** — can communicate using memorized words and some phrases
  about familiar topics.
- **Novice High** — can communicate using words, lists, and simple
  sentences; can ask and answer simple questions.

DLI programs' contact hours far exceed typical world-language courses, so
K-5 DLI learners commonly work through Novice Mid/High early and push
toward Intermediate Low. Conjuga treats **Novice Low as its floor and
Novice High as its working ceiling**.

### Feature → Can-Do mapping

| Conjuga feature | Mode & level |
|---|---|
| ✅ Elige (multiple-choice recognition) | Interpretive Reading, Novice Low–Mid — identify memorized/familiar written forms |
| 🧱 Práctica (rebuild the table, unscored) | Interpretive active recall inside the chart's visual scaffold — the NBPTS Std IV bridge between studying and quizzing; pressure-free by design |
| 🧩 Empareja (form ↔ person matching) | Interpretive Reading, Novice Low — recognition of familiar written chunks with strong visual scaffolding |
| ✏️ Escribe (typed production) | Presentational Writing, Novice Mid–High — write memorized words and phrases accurately |
| ⭐/🌙 Preterite & imperfect practice | Scaffolding toward Novice High storytelling and, beyond Novice, the Intermediate across-time-frames Can-Dos |
| ⚔️ ¿Pretérito o imperfecto? (time-cue contrast) | The storytelling contrast behind Novice High narration, practiced with the conventional novice cue-word scaffold (una vez vs. muchas veces) |
| 🔊 Audio (clips + TTS on forms) | Interpretive Listening, Novice Low–Mid — pairs each written form with its sound, essential for K-2 pre-readers |
| 🎧 Escucha (listening mode) | Interpretive Listening, Novice Low–Mid — the target is heard, never shown |
| 🔁 Repasa hoy (spaced review) | Operationalizes "extensive exposure over time" — practiced material resurfaces at expanding intervals |
| 🖨️ Progress report (printable) | Student-mediated progress reporting to teachers/families without accounts or data collection |
| 5-verbs-at-a-time groups, frequency-ordered | Research-based, spiraling curriculum; Novice Can-Dos are built on "memorized and practiced" material |
| Star mastery tracking | Supports benchmarking progress along the Novice → Novice High continuum |

**Honest framing:** controlled accuracy *across time frames* is formally an
Intermediate-and-above expectation. Conjuga's preterite/imperfect practice
is deliberately positioned as *stretch scaffolding* for DLI learners
heading toward Novice High story retelling — not as a claim that
conjugation drills alone constitute Novice-level communication. The app is
a skills station meant to sit inside a communicative program, not replace
one.

## 2. NBPTS World Languages Standards (ECYA-WL)

The nine standards: **I Knowledge of Students · II Knowledge of Language ·
III Knowledge of Culture · IV Knowledge of Language Acquisition · V Fair and
Equitable Learning Environment · VI Designing Curriculum and Planning
Instruction · VII Assessment · VIII Reflection · IX Professionalism.**

Design-relevant principles and how Conjuga embodies them:

| NBPTS principle | Conjuga design response |
|---|---|
| **Std IV:** learners acquire language "in predictable developmental patterns… at different rates and in different ways"; structures "require extensive exposure… before students acquire them" | Self-paced, repeatable rounds; recognition (Elige/Empareja) before production (Escribe); unlimited replays with fresh sampling |
| **Std IV:** distinguish salient errors from systematic developmental ones; foster students' ability to "monitor and correct their use of language" | Accent-only errors get a penalty-free "¡Casi! Revisa la tilde" retry; wrong answers always show the correct form and pause for reading; naive-regularization distractors surface the classic developmental errors on purpose |
| **Std VII:** "clear, meaningful, and timely feedback" that models self-assessment; help students "reflect on their own progress" | Immediate per-item feedback; end-of-round review list of missed forms; persistent star/mastery display per group × tense × mode |
| **Std VI:** curriculum that is "sequential, long-range, and continuous," moving "from simple to sophisticated" | Frequency-ordered groups (most useful verbs first), present before past, study → recognize → produce ladder within every group |
| **Std V:** equitable, low-anxiety environments where "all students learn actively"; technology as a legitimate strategy | Free, no login, no ads, no data collection; bilingual instructions; dark mode, reduced motion, screen-reader announcements, keyboard play; praise-based messaging, never punitive |
| **Std I:** knowledge of students (K-5 development) | Large targets, emoji anchors, short instructions, ~3-minute rounds matched to elementary attention spans |

## 3. Teacher-facing claims (for classroom use)

Appropriate claims: "standards-aligned novice practice for the interpretive and
presentational modes"; "targets the NCSSFL-ACTFL Novice band (Novice Low →
Novice High)"; "pedagogy consistent with NBPTS World Languages Standards IV-VII."

Claims we deliberately do **not** make: that the app teaches interpersonal
communication (it has no two-way exchange), that it develops cultural
competence (Std III is out of scope for v0.1), or that conjugation accuracy
equals proficiency.

## Per-screen standards panels (M9; placement per owner 2026-07-08)

The study, práctica, quiz, and informe screens carry an ℹ️ button next to
their heading (prompt-card corner on quiz screens) opening a bilingual
panel that explains how that page supports the standards. The copy lives
in `js/standards-info.js` (the single source of truth — this table mirrors
it; update both together, enforced by a unit test on the module's shape):

| Screen | Kid line (es) | Standards mapping |
|---|---|---|
| Estudia | Mira la tabla y toca una palabra para escucharla. | Interpretive Reading + Listening, Novice Low–Mid |
| 🧱 Práctica | Reconstruye la tabla palabra por palabra. | Active recall inside the chart's scaffold, unscored — NBPTS Std IV |
| ✅ Elige | Lee y elige la forma correcta. | Interpretive Reading, Novice Low–Mid, with informed distractors |
| ✏️ Escribe | Escribe la forma del verbo. | Presentational Writing, Novice Mid–High |
| 🧩 Empareja | Une cada persona con su forma. | Interpretive Reading, Novice Low, visual support |
| 🎧 Escucha | Escucha y elige lo que oyes. | Interpretive Listening, Novice Low–Mid (badges, not stars) |
| ⚔️ Contraste | La palabra del tiempo es tu pista. | Toward Novice High storytelling — NBPTS Std IV |
| 📄 Informe | Tu progreso, listo para compartir. | Paper progress sharing, no data collection — NBPTS Std IV |
