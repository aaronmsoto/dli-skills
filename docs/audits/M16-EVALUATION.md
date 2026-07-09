# M16 redesign — usability & a11y evaluation

**Date:** 2026-07-09 · **Evaluator:** loop agent (M16 RT) · **Scope:** the
Prado redesign under `?redesign=1`, exercised in light + dark themes at
900×900, 360×640, and print. The formal Round 2 audits are M17's job; this
document records the RT sanity check and flags anything that warrants
Round 2 attention.

## What the RT step verified

- `npm test` **50/50** green (the same 49 pre-existing tests plus the M16
  R spec-guard test).
- **Preview screenshots** — the 12 morning-review PNGs live at
  `docs/audits/M16-preview/redesign-*.png` (committed with this PR):
  `home`, `group`, `study`, `practica`, `choice`, `type`, `match`,
  `contrast`, `informe`, `about`, `docs`, `usability`. Regenerated on
  every `npm run e2e` from `tests/e2e/shots/` (which is `.gitignore`d).
- `npm run e2e` **all checks pass**, including new blocks:
  - `gate` (default off, `?redesign=1` on),
  - `theme` (Auto follows the OS, Light beats OS-dark, Dark beats OS-light,
    choice persists across reload, redesign+Auto+OS-dark = Prado forest-night),
  - `redesign preview` (13 screens captured to `tests/e2e/shots/redesign-*.png`),
  - `redesign axe` (zero critical/serious across 9 app routes in light),
  - `redesign axe dark` (zero critical/serious in forest-night).
- **Payload** — 46 KB gzipped (54 KB budget headroom). `tokens.css` and
  `redesign.css` counted per M16's rule.
- **No functional / localStorage / print regressions.** The M10 axe gate,
  the M13 sticky persons column, the M12 clips backend, the M9 footer +
  info-panel blocks, and the M8 Práctica unscored block all still pass.
- **Every DOM class + `id` used by the e2e suite is preserved.** The
  redesign's per-tense / per-mode icons are picked by new `data-tense` /
  `data-mode` attributes added to already-existing elements — no new nodes,
  no removed classes, no changed hash routes.

## Round 1 audits — what still holds under the redesign

The redesign is **visual-only** (routes, sampling, scoring, `STARS_PER_SET`,
localStorage schema, TTS/clips, 🔍 hint logic, 🧱 Práctica-unscored, and
print behavior are all unchanged, by M16 charter). So most Round 1 findings
carry through unchanged. Notes per framework, using the Round 1 IDs:

### Nielsen 10 heuristics (`docs/audits/nielsen.md`)
- **NN-1 (mid-round toggle restarts, sev 3)** — resolved in M10 fix wave;
  redesign preserves the "defer, not restart" behavior (e2e still asserts).
- **NN-2 (system status, sev 2)** — redesign strengthens this: the tense
  chip is now colored by tense hue, the answer buttons carry a firm
  `--good` border on correct, and `.result-msg` uses `--brand` on the
  Prado green.
- **NN-3 (start-here discoverability, sev 2)** — resolved in M10; the
  redesign keeps the ¡Empieza aquí! pill and darkens its text to `#243026`
  on persimmon (4.81:1 axe-verified).
- **NN-4 (aesthetic consistency, sev 1)** — the whole redesign is a
  wholesale re-answer to this heuristic: one type system, one icon family,
  one palette across every screen.
- **NN-5 (recognition, sev 1)** — resolved in M10.

### Don Norman UX principles (`docs/audits/norman.md`)
- **Discoverability (medium gap)** — redesign does not change
  discoverability of routes/actions.
- **Feedback, conceptual model, affordances, mapping, constraints
  (strengths)** — all preserved.
- **Signifiers (medium gap fixed in-wave)** — redesign further improves
  signifiers by using distinct tense hues (sun / flag / loop) and per-mode
  line icons in place of mismatched emoji.

### Cognitive walkthrough (`docs/audits/walkthrough.md`)
- All Round 1 tasks (T1 first Elige round, T2 🎧 Escucha find-and-play,
  T3 parent progress check, T4 teacher print, T5 mid-round fidgeting) are
  behavior-preserving under the redesign — Q1–Q4 answers unchanged.

### WCAG 2.2 AA (`docs/audits/wcag.md`)
- **WCAG-1 · `.footer-credits` contrast** — resolved in M10 and still safe
  (redesign uses `--ink-soft #5c6558` on `--bg #fbf6ea`: 5.35:1).
- **WCAG-2 · earned-star non-text contrast** — the amber `#e0982f` still
  passes 3.3:1 on white in light; forest-night dark uses the design's
  `#f3b750` (higher on dark grounds).
- **WCAG-3 · page titles** — unchanged; e2e still asserts per-route titles.
- **WCAG-4 · skip link** — unchanged.
- **WCAG-5 · lang of parts** — unchanged.

**New tokens introduced by the redesign are all axe-verified.** Two design
values had to be darkened from the artifact to meet 4.5:1:
`--brand #3f9256 → #2f6b4f` and `--ink-soft #6c7568 → #5c6558`. The three
pill texts (`.total-stars`, `.start-here`, `.prompt-tense`) use a
hardcoded `#243026` because their warm-hued backgrounds stay light in both
palettes. See `docs/DESIGN.md` note-\*.

## Items to hand to M17 (Round 2)

- **Manual heuristic re-walk of the new tense triad.** The star-free
  sun / flag / loop metaphor is pedagogically clean but a real K-5 child
  walkthrough (not just the automated one) may surface icon-recognition
  questions.
- **Screen-reader run over the redesigned masked icons.** Icons render as
  CSS backgrounds, and their emoji-in-the-DOM originals are hidden with
  `font-size: 0` + `color: transparent`. Card labels (`<strong>Presente
  </strong>`) still name the target; SR verification should confirm the
  original emoji text does not double up in narration.
- **Sound of the persimmon accent on kids' displays.** `#e37a4f` passes
  axe but Round 2 should sanity-check its warmth on cheap classroom
  screens vs the design intent.
- **Print media × redesign.** The RT print e2e run confirms the existing
  print styles still hide non-essentials, but the redesign layer has not
  been reviewed for the printed Estudia sheet's black-and-white
  presentation. Low-risk (print CSS wins), worth a Round 2 pass.

## Handoff status

- Loops G, T, I\*, RT all pushed as `loop/20260709-m16-*`.
- All PRs into `dev`; **FLIP to `main` remains the human's** (it is the
  redeploy that turns the gate ON in production).
- Round 2 audit dating scheme (M17 DATING) can now use this document as
  a template for its "Round 2 (YYYY-MM-DD)" sections.
