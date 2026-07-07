# CLAUDE.md — agent/contributor guide for Conjuga (dli-skills-builder)

## What this is

A static, no-build, no-login web app for K-5 Spanish Dual Language Immersion
learners: conjugation practice for the 100 most common Spanish verbs, 5 at a
time, in present / preterite / imperfect. Deployed to GitHub Pages from `main`.

## Golden rules

1. **Linguistic accuracy is the product.** Any change to `js/conjugator.js` or
   `js/verbs.js` MUST be accompanied by tests in `tests/conjugator.test.mjs`
   with hand-verified forms (RAE conjugation tables are the reference). Run
   `npm test` before committing — all tests must pass.
2. **No build step, no dependencies, no login, no analytics.** The app is plain
   ES modules served statically. Do not add bundlers, frameworks, trackers, or
   anything requiring a server. Progress lives only in `localStorage`
   (versioned key `conjuga.v1` — bump the version if the schema changes
   incompatibly).
3. **Novice-first pedagogy.** Feedback is corrective, never punitive; recognition
   (Elige) precedes production (Escribe); present tense is presented before past
   tenses. Keep UI text bilingual: Spanish first, short English support.
   Design decisions should be defensible against docs/STANDARDS.md.
4. **K-5 audience.** Big touch targets (≥44px), simple sentences, emoji-friendly,
   dark mode and reduced-motion respected, ARIA live regions for feedback.

## Commands

```bash
npm test     # node --test tests/*.test.mjs — 35 accuracy/invariant tests
npm start    # python3 -m http.server 8080 (any static server works)
```

To verify UI changes end-to-end, serve the app and drive it with Playwright
(chromium lives at /opt/pw-browsers/chromium-*/chrome-linux/chrome in the
remote environment); check for console errors and screenshot each screen.

## Architecture

- `js/conjugator.js` — pure engine. Regular paradigms computed from the
  infinitive; irregularities driven by per-verb flags (`pres`, `presYo`,
  `presStem`, `pret`, `pretStem`, `pret3`, `imp`). Orthographic changes
  (-car/-gar/-zar yo-preterite, vowel-stem y-insertion, -guir/-gir/-cer yo
  spellings) are automatic — don't add flags for them.
- `js/verbs.js` — dataset. 100 verbs, frequency-ranked, `SETS` = 20 groups of 5.
  Note: *gustar* is intentionally replaced by *comer* (novices learn gustar as
  a chunk, not a conjugated paradigm).
- `js/game.js` — question sampling (every verb in a set appears ≥1× per round),
  multiple-choice distractors (naive regularization > same-person-other-tense >
  same-tense-other-person), match pairs (unique forms only).
- `js/storage.js` — localStorage wrapper; stars = 3 (100%), 2 (≥80%), 1 (≥60%).
- `js/app.js` — hash-routed screens (`#/set/3`, `#/study/3/present`,
  `#/play/3/present/choice`). DOM built with a small `el()` helper; no innerHTML
  for user-derived strings.
- Persons are always indexed 0-5 (yo, tú, él/ella/Ud., nosotros, vosotros,
  ellos/Uds.); vosotros (index 4) is filtered at the UI layer per user setting,
  never removed from data.

## Deployment

`.github/workflows/deploy.yml` publishes the repo root to GitHub Pages on push
to `main` (plus manual `workflow_dispatch`). All asset URLs must remain
relative (the app is served from /dli-skills-builder/, not the domain root).

## Documentation map

- `README.md` — user/teacher-facing overview
- `docs/SPEC.md` — product + technical specification and design decisions
- `docs/STANDARDS.md` — NBPTS ECYA-WL and NJSLS-WL alignment (cite it when
  making pedagogy-affecting changes)
- `about.html` — learner/parent-facing standards & privacy page (keep in sync
  with docs/STANDARDS.md)
