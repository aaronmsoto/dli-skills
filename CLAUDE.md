# CLAUDE.md — agent/contributor guide for Conjuga (dli-skills)

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

## Standing product rules (owner-set; apply them to every feature, old or new)

1. **Vocalization everywhere it makes sense.** Any Spanish conjugated form
   displayed to the learner is tap-to-hear via `sayForm` (person-prefixed,
   e.g. "yo hablo") whenever `ttsAvailable()` — Estudia cells, hint-panel
   cells, revealed answers, placed Práctica tiles, etc. Every audio
   affordance hides when no Spanish voice exists, and each feature must
   still work with no audio backend at all. `say()` respects the sound
   setting; explicit listening prompts (🎧 Escucha) are the only mute
   exemption. Gate on `audioAvailable()` (clips OR local voice), not
   `ttsAvailable()` alone.
2. **Estudia links every activity.** The study screen's action row must
   list ALL activities available for that group/tense. Adding, renaming,
   or gating an activity means updating the study-actions row, the group
   screen's cards, and the e2e assertions in the same PR.
3. **Declare the scoring track.** Every activity is exactly one of:
   ⭐ stars (choice/type/match + ⚔️ contrast — the STARS_PER_SET
   denominator), 🎧 badges (parallel track, NEVER in star totals), or
   unscored practice (🧱 Práctica — no `recordResult` at all). Changing
   any star denominator is an owner decision, never a loop's.
   The 🎧 split is an ACCESSIBILITY guarantee, not a device workaround
   (owner reframe 2026-07-15, M19): listening earns its own track so that
   progress never requires hearing — deaf/hard-of-hearing learners, muted
   devices, and offline+voiceless browsers can reach every star, and nest
   tiers must never depend on listen results. Folding badges into stars
   was considered and rejected; do not propose it again.
4. **Kids' privacy.** The owner's children appear ONLY as the pseudonyms
   "A1" and "A2" — never real names — anywhere in the repo or on the site.
5. **Standard chrome (owner layout, 2026-07-08).** Screens get the crumbs
   row (contextual back-nav, top-left) + the ☰ site menu (top-right,
   unintrusive — it HOSTS the 🔊 sound toggle as a labeled row). The ℹ️
   standards button sits NEXT TO the page/quiz heading (h1, or the
   prompt-card corner on quiz screens) — never in the crumbs, never on
   the home or group screens. `renderFooter()` is the single footer
   component and belongs on every screen. about.html and /docs are linked
   from the footer and ☰ menu; any FUTURE public page stays unlinked
   until the owner links it.
6. **Standards & branding (owner, 2026-07-08).** Public standards
   references are NATIONAL-ONLY: NBPTS World Languages standards
   (ECYA-WL, the teaching standards) + NCSSFL-ACTFL Can-Do Statements
   (the proficiency levels, Novice Low → Novice High). Never cite
   state-specific standards (all NJSLS-WL references were removed).
   Footer links NBPTS first, then NCSSFL-ACTFL (the Can-Do overview PDF
   on actfl.org). Site identity: footer site name "Dual-Language
   Immersion (DLI) Skills"; domain "DLIskills.com" (EXACT capitalization);
   home shows "part of DLIskills.com" under the Conjuga heading.
   about.html carries no GitHub link (owner, 2026-07-08). NCSSFL = the
   National Council of State Supervisors for Languages; ACTFL = the
   American Council on the Teaching of Foreign Languages (spelled out on
   about.html).
7. **Work the GOAL.md queue.** The queue line at the top of GOAL.md's
   Milestones section — not milestone numbering — sets loop priority.

## Commands

```bash
npm test     # node --test tests/*.test.mjs — accuracy/invariant/feature/budget tests
npm run e2e  # headless-Chromium end-to-end suite (tests/e2e/smoke.mjs)
npm start    # python3 -m http.server 8080 (any static server works)
```

For `npm run e2e`, install Playwright first (`npm i --no-save playwright`
plus `npx playwright install chromium`, or in the remote environment set
CHROMIUM_PATH=/opt/pw-browsers/chromium-*/chrome-linux/chrome). Any new UI
surface MUST be covered by the e2e suite — it is the gate that lets loop
iterations auto-merge into dev. Playwright is CI/dev tooling only; it must
never become an app dependency.

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
  same-tense-other-person), match pairs (unique forms only), the Práctica
  word bank (`buildPracticaBank` — one tile per person, duplicates kept), and the
  preterite/imperfect contrast generator (`TENSE_CUES` are the conventional
  classroom time-cue triggers — a deliberate novice simplification).
- `js/storage.js` — localStorage wrapper; stars = 3 (100%), 2 (≥80%), 1 (≥60%);
  each result stores an `at` timestamp driving the spaced-repetition queue
  (due after 0/1/3/7 days for 0/1/2/3 stars; entries without `at` never due).
- `js/audio.js` — two backends: pre-generated clips (audio/manifest.json,
  exact-spoken-text → mp3; generated via tools/generate-audio.mjs with the
  owner's ElevenLabs key in a git-ignored .env — NEVER commit keys or call
  ElevenLabs at runtime) then Web Speech TTS fallback (prefers a local
  es-MX/es-US voice). UI gates on `audioAvailable()` (either backend);
  Escucha works voiceless-but-online. `sound` setting mutes both.
  ElevenLabs voice: `rixsIpPlTphvsJd2mI03` (model: `eleven_multilingual_v2`,
  key: `sk_****...89`). Dual-generated speeds: 🔊 normal = 0.85, 🐢 despacio
  = 0.70 (ElevenLabs' floor). Regenerate clips:
  `node tools/generate-audio.mjs --sets all`.
- `js/mascot.js` — Lola la Lechuza (inline SVG; states are single CSS
  classes; decorative/aria-hidden; silent — TTS is for Spanish forms only;
  binding design spec in docs/MASCOT.md; keep within the 15 KB budget and
  the payload test in tests/payload.test.mjs).
- `js/app.js` — hash-routed screens (`#/set/3`, `#/study/3/present`,
  `#/practica/3/present`, `#/play/3/present/choice`, `#/play/3/contrast`,
  `#/informe`). 🧱 Práctica (`renderPractica`) is the unscored table rebuild
  — never give it stars/badges or a hint button. DOM built with
  a small `el()` helper; no innerHTML for user-derived strings. The contrast
  challenge records under key `<setId>.past.contrast` (STARS_PER_SET = 30).
  🎧 Escucha records under `<setId>.<tense>.listen` — badges on a parallel
  track, deliberately excluded from MODES and every star denominator;
  the mode renders only when `audioAvailable()` (clips or local voice).
  Print styles live in styles.css (`@media print` + `.no-print`).
- **Visual system (M16 "Prado", FLIP 2026-07-09).** Three stylesheets:
  `css/styles.css` is the structural base (layout, print, a11y);
  `css/tokens.css` defines the Prado design tokens; `css/redesign.css` is
  the visual layer. Every rule in tokens/redesign is scoped to
  `:root[data-redesign]`, and the inline `<head>` loader in each HTML now
  sets `data-redesign` UNCONDITIONALLY — so the Prado look is the default
  (the `?redesign=1` preview trigger is retired). redesign tokens win by
  specificity; styles.css tokens remain as fallback (e.g. `--brand-soft`),
  so don't delete it. Theme selector (☰ menu) is Auto/Light/Dark, **Light
  default** — an unset theme applies `data-theme="light"`; Auto follows the
  OS. Both the inline loader and `themeSelector()` in js/app.js encode that
  default; keep them in sync.
- Persons are always indexed 0-5 (yo, tú, él/ella/Ud., nosotros, vosotros,
  ellos/Uds.); vosotros (index 4) is filtered at the UI layer per user setting,
  never removed from data.

## Git workflow & deployment

- **Never commit or push directly to `main`.** All work happens on dev
  branches (`dev/<topic>`, `feature/<topic>`, or an agent session branch);
  commit there and push with `git push -u origin <branch>`.
- **Merging to `main` is the deploy.** `.github/workflows/deploy.yml` runs
  the test suite and publishes the repo root to GitHub Pages only on push to
  `main` (a PR merge) or a manual `workflow_dispatch`. Pushes to dev branches
  never deploy.
- **PR conventions.** All PRs target `dev` (never `main` directly). Use the
  `.github/pull_request_template.md` body format (`## What` / `## Validation`).
  Loop PRs title as `loop: <summary>` (see docs/LOOP.md); session PRs use a
  descriptive title. Squash-merge into `dev`; merge-commit into `main`. See
  `CONTRIBUTING.md` for the full branch model and PR conventions.
- Keep changes deployable: `main` should always represent the live site.
- All asset URLs must remain relative (the app is served from the domain
  root at dliskills.com via GitHub Pages custom domain).

## Semi-autonomous loops

Agent sessions doing unattended iterations MUST follow `docs/LOOP.md`.
Branch model: `loop/<date>-<slug>` (one per iteration, from `origin/dev`)
→ PR into `dev` with **native auto-merge** enabled, gated by the required
CI checks (`unit` + `e2e`) → a rolling `Release: dev → main` PR that only
a human merges (that merge is the production deploy). Work derives only
from `GOAL.md`'s current milestone; context comes from the newest
`journal/*.md` files; each iteration writes its own `journal/` entry.
Loops never push `dev`/`main` directly, never merge manually, never touch
workflows or settings, and never weaken tests to get green.

## Documentation map

- `GOAL.md` — north star, product invariants, milestone queue (the loop's
  only source of work; humans edit it to redirect)
- `JOURNAL.md` — append-only iteration log (read the tail before working)
- `docs/LOOP.md` — the loop protocol and its hard guardrails
- `README.md` — user/teacher-facing overview
- `docs/SPEC.md` — product + technical specification and design decisions
- `docs/STANDARDS.md` — NBPTS ECYA-WL and NCSSFL-ACTFL alignment (cite it when
  making pedagogy-affecting changes)
- `about.html` — learner/parent-facing standards & privacy page (keep in sync
  with docs/STANDARDS.md)
- `docs/index.html` + `docs/usability.html` — PUBLIC pages (the repo's docs/
  dir deploys with Pages, so /docs/ is a real route): how-to, standards
  support, and the audit findings summary. Self-contained styling; relative
  links; stay UNLINKED from app navigation until the owner links them.
- `docs/audits/*.md` — the M10 evaluation reports (finding IDs cited by
  fixes); `tests/e2e/vendor/axe.min.js` is vendored (MPL-2.0) for the CI
  a11y gate — do NOT npm-install it mid-run (npm prunes playwright)
