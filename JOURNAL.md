# JOURNAL — iteration log

Append-only, chronological (newest at the bottom). Every loop iteration adds
one entry using the template in docs/LOOP.md. Read the last few entries before
starting work — this file is the project's memory across sessions.

---

## 2026-07-07 · v0.1 — core trainer shipped (M0)

- Built conjugation engine (regular paradigms + irregularity flags; automatic
  orthography for -car/-gar/-zar, y-insertion, -guir/-gir/-cer) and the
  100-verb frequency-ranked dataset (gustar deliberately swapped for comer).
- 4 activities (Estudia/Elige/Escribe/Empareja) × 3 tenses × 20 groups of 5;
  stars in localStorage (`conjuga.v1`); vosotros toggle (default off).
- 35 tests hand-verified against RAE tables. Playwright drive of all screens.
- Deployed to GitHub Pages via test-gated workflow. Blocked once on Pages
  enablement (admin-only) — owner enabled it and made the repo public.
- Standards research (NBPTS ECYA-WL, 2020 NJSLS-WL) baked into
  docs/STANDARDS.md. Key framing: past-tense accuracy is formally above
  Novice; we position it as scaffolding toward 7.1.NH.PRSNT.4 story retelling.

## 2026-07-07 · v0.2 — audio, contrast, review, printables (M1)

- 🔊 Web Speech TTS (auto-speak + mute; hidden without a Spanish voice).
- ⚔️ ¿Pretérito o imperfecto? per-group challenge using time-cue words
  (documented simplification: real usage is aspect-driven; sentences in M2
  will supersede cue words). Verified pret ≠ imp across all 600 past forms.
- 🔁 Repasa hoy: due after 0/1/3/7 days for 0/1/2/3 stars; legacy entries
  without timestamps are never due (no schema bump needed).
- 🖨️ Print stylesheet + #/informe progress report.
- Tests 35 → 40. Stars per set 27 → 30.

## 2026-07-07 · hotfixes

- Stray "null" text on home/study: null children passed to native append()
  get stringified — added a null-filtering mount() helper. Lesson: assert on
  rendered text, not only selectors, in browser validation.
- Empareja spoke bare forms; now speaks "yo voy" via the shared sayForm()
  path (match pairs carry their person index).

## 2026-07-07 · process — main-only deploys + loop harness

- deploy.yml now triggers only on push to `main` (+ manual dispatch); all
  work happens on dev branches; a human PR merge is the only path to prod.
- `main` created at parity with the dev branch. NOTE: first main deploy was
  rejected by the `github-pages` environment branch policy — owner must allow
  `main` in Settings → Environments (and ideally make `main` the default
  branch).
- Added the loop harness: GOAL.md (work source), this JOURNAL, docs/LOOP.md
  (protocol + guardrails). Loop output = one draft PR per iteration; no dev
  site (validation via tests + screenshots in the PR).
