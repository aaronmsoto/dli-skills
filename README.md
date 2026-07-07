# 🦉 Conjuga — DLI Skills Builder

**A free, no-login Spanish verb conjugation skills builder for K-5 Dual Language
Immersion (DLI) programs.**

Learners practice the **100 most common Spanish verbs** — five at a time — across
three tenses (**present, preterite, imperfect**) through study tables and three
game modes, with star-based mastery tracking stored privately on the device.

**Live app:** https://aaronmsoto.github.io/dli-skills-builder/

## Why

Dual Language Immersion students acquire Spanish through content, but verb
morphology — especially the irregular high-frequency verbs and the
preterite/imperfect contrast — benefits from focused, low-stakes practice.
Conjuga provides that practice station: standards-grounded, kid-friendly,
zero-setup, and usable from any browser without registration or data collection.

## Features

- **100 highest-frequency verbs** in 20 groups of 5, ordered so the most useful
  (and most irregular) verbs come first: *ser, estar, tener, hacer, ir…*
- **Three tenses** with kid-friendly framing: Presente ☀️ (*ahora*),
  Pretérito ⭐ (*ayer, una vez*), Imperfecto 🌙 (*antes, muchas veces*)
- **Four activities per group × tense:**
  - 📖 **Estudia** — full conjugation tables for the group (tap any form to
    hear it)
  - ✅ **Elige** — multiple choice with linguistically-informed distractors
    (including "naive regularizations" like \*teno for *tengo*)
  - ✏️ **Escribe** — typed production with on-screen accent keys and
    accent-tolerant retry ("¡Casi! Revisa la tilde")
  - 🧩 **Empareja** — match each person to its verb form
- **⚔️ ¿Pretérito o imperfecto?** — a per-group challenge mode where a time
  cue (*ayer, una vez / siempre, todos los días…*) signals which past tense
  fits — the storytelling contrast, practiced head-to-head
- **🔊 Audio** — Spanish text-to-speech via the browser's built-in Web Speech
  API (no network, no data sent anywhere): correct answers and study-table
  taps are spoken; one-tap mute; hidden automatically on devices without a
  Spanish voice
- **🎧 Escucha** — listening mode (on devices with a Spanish voice): the
  form is spoken, never shown; pick what you heard from four options, with
  unlimited replay and a 🐢 slow button. Earns a parallel track of 🎧
  badges that never count toward stars, so voiceless devices lose nothing
- **🔍 Pistas (hints)** — kid-requested: a magnifying-glass button on quiz
  questions opens the Estudia column for that verb (both past columns in
  the contrast challenge); Lola raises her own magnifying glass while you
  peek. No penalty; a footer checkbox (on by default) can turn hints off
- **🔁 Repasa hoy** — a spaced-repetition queue on the home screen: activities
  come back for review after 0/1/3/7 days depending on stars earned
- **🖨️ Printables** — print-friendly conjugation tables and a progress report
  (star grid per group with a name line) students can hand to a teacher
- **🦉 Lola la Lechuza** — a silent barn-owl companion (inline SVG, ~5 KB):
  she flies along the progress bar toward her nest as answers land, hops on
  correct answers, tilts her head curiously on misses (never scolds), and
  does her signature head-spin on 3-star rounds; fully static under
  reduced-motion and hidden in print (design rationale in docs/MASCOT.md)
- **Mastery tracking** — 0-3 stars per activity, best-score persistence in
  `localStorage`; no accounts, no server, no analytics
- **Vosotros toggle** — off by default (US convention), one click to include
- **Accessible** — large touch targets, keyboard shortcuts (1-4 for choices),
  ARIA live announcements, dark mode, reduced-motion support
- **Bilingual UI** — Spanish-forward with English support, as befits DLI

## Standards grounding

The design is grounded in two frameworks (see [docs/STANDARDS.md](docs/STANDARDS.md)
for the full alignment):

- **[NJ Student Learning Standards — World Languages (2020)](https://www.nj.gov/education/standards/worldlang/):**
  activities map to Novice-band performance expectations across the Interpretive
  (7.1.NM.IPRET.1) and Presentational (7.1.NM.PRSNT.4, 7.1.NH.PRSNT.2) modes;
  past-tense practice scaffolds toward Novice High story retelling
  (7.1.NH.PRSNT.4).
- **[NBPTS World Languages Standards (ECYA-WL)](https://www.nbpts.org/wp-content/uploads/2021/09/ECYA-WL.pdf):**
  recognition before production, errors treated as learning data, timely
  non-punitive feedback, sequential simple-to-sophisticated design, and equitable
  zero-cost access.

## Running locally

No build step — it's a static site with ES modules.

```bash
npm start          # python3 -m http.server 8080 → http://localhost:8080
npm test           # accuracy + feature-logic + budget tests (Node ≥ 18)
```

## Project structure

```
index.html            App shell (single-page, hash-routed)
about.html            Standards & privacy page
css/styles.css        Kid-friendly theme, dark mode, a11y
js/conjugator.js      Conjugation engine (regular paradigms + irregularity flags)
js/verbs.js           The 100-verb dataset with irregularity flags
js/game.js            Question sampling, distractors, match pairs, contrast cues
js/storage.js         localStorage progress + spaced-repetition scheduling
js/audio.js           Web Speech TTS wrapper (Spanish voice pick + fallback)
js/app.js             Screens: home / set / study / play / contrast / report
tests/                Node test suite (hand-verified RAE forms)
docs/SPEC.md          Product & technical specification
docs/STANDARDS.md     Full standards-alignment document
.github/workflows/    GitHub Pages deployment
```

## Accuracy

All 1,800 forms (100 verbs × 3 tenses × 6 persons) are generated by the engine
and validated by tests covering every irregularity class in the dataset: fully
irregular verbs (*ser, ir, ver, dar, estar, oír*), strong preterites (*tuve,
dije, hice…*), stem changes (e→ie, o→ue, u→ue, e→i), third-person preterite
vowel changes (*pidió, murió*), orthographic changes (*busqué, llegué, empecé,
sigo, dirijo, conozco*), and y-insertion (*leyó, cayó*). Expected forms were
hand-verified against RAE conjugation tables. Found an error? Please
[open an issue](https://github.com/aaronmsoto/dli-skills-builder/issues).

## Roadmap ideas

- Sentence-context questions ("Ayer yo ___ a la escuela") and story-retell mode
- Listening comprehension mode (hear a form, pick or type what you heard)
- Additional tenses (ir a + infinitive, present progressive) and languages

## License

MIT — free for classrooms everywhere.
