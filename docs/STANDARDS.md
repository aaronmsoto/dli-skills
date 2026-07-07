# Standards Alignment — Conjuga (DLI Skills Builder)

This document grounds Conjuga's design in the two frameworks named in the
project charter and records exactly how each feature maps to them.

Sources (retrieved 2026-07):
- **NBPTS World Languages Standards, Second Edition (ECYA-WL)** — National Board
  for Professional Teaching Standards.
  https://www.nbpts.org/wp-content/uploads/2021/09/ECYA-WL.pdf
- **2020 New Jersey Student Learning Standards — World Languages (NJSLS-WL)** —
  https://www.nj.gov/education/standards/worldlang/ and the full standards
  document https://www.nj.gov/education/standards/worldlang/Docs/2020NJSLS-WL.pdf

## 1. NJSLS-WL: proficiency levels ("proficiency standards")

The 2020 NJSLS-WL benchmark seven ACTFL-aligned proficiency levels: **Novice
Low, Novice Mid, Novice High, Intermediate Low, Intermediate Mid, Intermediate
High, Advanced Low**. The Novice band — Conjuga's target — is defined as:

- **Novice Low** — "Students communicate using words and phrases that are
  memorized and practiced when talking about very familiar topics related to
  self, family, friends, school and home." *(NJ target: end of grade 2.)*
- **Novice Mid** — "Students communicate using memorized words and some phrases
  to talk about familiar topics related to school, home, and the community."
  *(NJ target: end of grade 5.)*
- **Novice High** — "Students communicate using words, lists, and simple
  sentences to ask and answer questions, to handle simple transactions related
  to everyday life, and to talk about subject matter studied in other classes."

The NJ grade-band targets assume ~90 minutes/week of instruction; DLI programs
far exceed that, so K-5 DLI learners commonly work through Novice Mid/High
earlier and push toward Intermediate Low. Conjuga therefore treats **Novice**
as its floor and Novice High as its working ceiling.

### Modes of communication (standard 7.1)

Performance expectations are coded `7.1.<Level>.<Mode>.<n>`:
- **Interpretive (IPRET)** — understanding spoken/written language (one-way).
- **Interpersonal (IPERS)** — two-way exchange with negotiation of meaning.
- **Presentational (PRSNT)** — producing language for an audience (one-way).

### Feature → NJSLS-WL mapping

| Conjuga feature | Performance expectations |
|---|---|
| ✅ Elige (multiple-choice recognition) | 7.1.NL.IPRET.1 — "Identify a few memorized and practiced words…"; 7.1.NM.IPRET.1 — "Identify familiar spoken and written words, phrases, and simple sentences…" |
| 🧩 Empareja (form ↔ person matching) | Interpretive mode, Novice: recognition of familiar written chunks with strong visual scaffolding |
| ✏️ Escribe (typed production) | 7.1.NM.PRSNT.4 — "Copy/write words, phrases, or simple guided texts on familiar topics"; 7.1.NH.PRSNT.2 — "Create and present brief messages using familiar vocabulary orally or in writing" |
| ⭐/🌙 Preterite & imperfect practice | Scaffolding toward 7.1.NH.PRSNT.4 — "Tell or retell stories… orally or in writing" — and, beyond Novice, 7.1.IH.IPERS.3 ("accuracy in the present tense and often across time frames") |
| ⚔️ ¿Pretérito o imperfecto? (time-cue contrast) | The storytelling contrast itself — the core grammatical distinction behind 7.1.NH.PRSNT.4 story retelling — practiced with the conventional novice cue-word scaffold (una vez vs. muchas veces) |
| 🔊 Audio (TTS on forms) | Interpretive-oral support: 7.1.NL.IPRET.1 / 7.1.NM.IPRET.1 include *spoken* words and phrases; audio pairs each written form with its sound, essential for K-2 pre-readers |
| 🔁 Repasa hoy (spaced review) | Operationalizes "extensive exposure over time" — practiced material resurfaces at expanding intervals rather than being left behind |
| 🖨️ Progress report (printable) | Student-mediated progress reporting to teachers/families without accounts or data collection |
| 5-verbs-at-a-time groups, frequency-ordered | NJ design principle of "research-based, spiraling and recursive" curriculum; Novice definitions built on "memorized and practiced" material |
| Star mastery tracking | Supports benchmarking progress along the named proficiency continuum (NM by end of grade 5) |

**Honest framing:** controlled accuracy *across time frames* is formally an
Intermediate-High expectation in NJSLS-WL. Conjuga's preterite/imperfect
practice is deliberately positioned as *stretch scaffolding* for DLI learners
heading toward Novice High story retelling — not as a claim that conjugation
drills alone constitute Novice-level communication. The app is a skills
station meant to sit inside a communicative program, not replace one.

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
presentational modes"; "supports the NJSLS-WL Novice Mid target for end of
grade 5"; "pedagogy consistent with NBPTS World Languages Standards IV-VII."

Claims we deliberately do **not** make: that the app teaches interpersonal
communication (it has no two-way exchange), that it develops cultural
competence (Std III is out of scope for v0.1), or that conjugation accuracy
equals proficiency.
