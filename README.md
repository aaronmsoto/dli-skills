# 🦉 Conjuga — DLI Skills

**A free, no-login Spanish verb conjugation skills builder for K-5 Dual Language
Immersion (DLI) programs.**

Learners practice the **100 most common Spanish verbs** — five at a time — across
three tenses (**present, preterite, imperfect**) through study tables and three
game modes, with star-based mastery tracking stored privately on the device.

**Live app:** https://dliskills.com/

## Why

Dual Language Immersion students acquire Spanish through content, but verb
morphology — especially the irregular high-frequency verbs and the
preterite/imperfect contrast — benefits from focused, low-stakes practice.
Conjuga provides that practice station: standards-grounded, kid-friendly,
zero-setup, and usable from any browser without registration or data collection.

## Features

- **100 highest-frequency verbs** in 20 groups of 5, ordered so the most useful
  (and most irregular) verbs come first: *ser, estar, tener, hacer, ir…*
- **Three tenses** with kid-friendly framing and a color/icon triad
  (sun / flag / loop): Presente (*ahora*), Pretérito (*ayer, una vez*),
  Imperfecto (*antes, muchas veces*)
- **Four activities per group × tense:**
  - 📖 **Estudia** — full conjugation tables for the group (tap any form to
    hear it)
  - 🧱 **Práctica** — rebuild the conjugation table word by word with a
    matching word bank (pure practice: no stars, can't be failed)
  - ✅ **Elige** — multiple choice with linguistically-informed distractors
    (including "naive regularizations" like \*teno for *tengo*)
  - ✏️ **Escribe** — typed production with on-screen accent keys and
    accent-tolerant retry ("¡Casi! Revisa la tilde")
  - 🧩 **Empareja** — match each person to its verb form, with satisfying
    card-flip juice, up-only counts, and run celebrations that never
    punish a miss
- **⚔️ ¿Pretérito o imperfecto?** — a per-group challenge mode where a time
  cue (*ayer, una vez / siempre, todos los días…*) signals which past tense
  fits — the storytelling contrast, practiced head-to-head
- **🔊 Audio** — high-quality pre-recorded Spanish clips (static files that
  download like images — no text is sent anywhere), with the browser's
  built-in Web Speech voice as the offline fallback: correct answers and
  study-table taps are spoken; one-tap mute; controls hide only when
  neither source is available
- **🎧 Escucha** — listening mode (whenever Spanish audio is available —
  recorded clips online or a device voice): the form is spoken, never
  shown; pick what you heard from four options, with unlimited replay and
  a 🐢 slow button. Earns a parallel track of 🎧 badges that never count
  toward stars — **progress never requires hearing**, so deaf and
  hard-of-hearing learners (and muted devices) can reach every star
- **🪺 El Nido de Lola** — an unscored celebration layer: every earned star
  builds Lola's nest (first star = straw wisp, a fully-started group = twig,
  a perfect group = flower, full listening badges = feather). Nothing
  decays, nothing is random, and there's no counter of what's missing
- **🌤️ El Vuelo de Lola** — an optional 60-90 s celebration flight after
  any round: Lola visibly flies home across the sky, one cloud closer to
  her nest per correct answer. Plays *by ear* when audio is on (an ABC
  button shows the text for anyone who prefers to read); no timer, no
  failure state, fully playable with reduced motion
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

- **[NCSSFL-ACTFL Can-Do Statements](https://www.actfl.org/uploads/files/general/Professional-Learning/Can-Do-Intro-Overview.pdf):**
  proficiency levels for the Novice band (Novice Low → Novice High) across
  the Interpretive (Elige/Empareja/Escucha) and Presentational (Escribe)
  modes; the preterite/imperfect contrast scaffolds toward Novice High
  storytelling.
- **[NBPTS World Languages Standards (ECYA-WL)](https://www.nbpts.org/wp-content/uploads/2021/09/ECYA-WL.pdf):**
  recognition before production, errors treated as learning data, timely
  non-punitive feedback, sequential simple-to-sophisticated design, and equitable
  zero-cost access.

## Running locally

No build step — it's a static site with ES modules.

```bash
npm start          # python3 -m http.server 8080 → http://localhost:8080
npm test           # accuracy + feature-logic + budget tests (Node ≥ 18)
npm run e2e        # headless-Chromium end-to-end suite (see tests/e2e/smoke.mjs header)
```

## Project structure

```
index.html            App shell (single-page, hash-routed)
about.html            Standards & privacy page
css/styles.css        Structural base — layout, a11y, print, dark mode
css/tokens.css        M16 "Prado" design tokens (Auto/Light/Dark, Light default)
css/redesign.css      M16 Prado visual layer (the default look; gate always on)
js/conjugator.js      Conjugation engine (regular paradigms + irregularity flags)
js/verbs.js           The 100-verb dataset with irregularity flags
js/game.js            Question sampling, distractors, match pairs, contrast cues
js/storage.js         localStorage progress + spaced-repetition scheduling
js/audio.js           Recorded-clip player + Web Speech fallback + game SFX
js/mascot.js          Lola la Lechuza (inline SVG states; docs/MASCOT.md)
js/nido.js            El Nido celebration layer (derived nest tiers)
js/vuelo.js           El Vuelo celebration flight (lazy-loaded)
js/standards-info.js  Per-screen ℹ️ standards panel copy
js/app.js             Screens: home / set / study / play / contrast / nido / report
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
[open an issue](https://github.com/aaronmsoto/dli-skills/issues).

## Roadmap ideas

- Sentence-context questions ("Ayer yo ___ a la escuela") and story-retell mode
- Las Postales de Lola — a culture postcard album (designed and vetted in
  docs/games-proposal.html; awaiting educator review)
- A typed Escucha variant (hear a form, type what you heard)
- Additional tenses (ir a + infinitive, present progressive) and languages

## License

MIT — free for classrooms everywhere.
