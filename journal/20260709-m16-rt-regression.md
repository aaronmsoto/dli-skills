# M16 G/T/I*/RT 🌙 overnight loop chain · 2026-07-09 · loop/20260709-m16-{g,t,i,rt}

Owner-directed overnight session: R merged (#64) → G → T → I\* → RT, all
pushed as stacked loop branches. FLIP is the human's.

## Branches pushed for morning review

| # | Branch | Task | PR compare URL |
|---|---|---|---|
| 1 | `loop/20260709-m16-g` | Gate + preview scaffold | dev...loop/20260709-m16-g |
| 2 | `loop/20260709-m16-t` | Theme selector (Auto/Light/Dark) | dev...loop/20260709-m16-t |
| 3 | `loop/20260709-m16-i` | Restyle all 13 screens in redesign.css | dev...loop/20260709-m16-i |
| 4 | `loop/20260709-m16-rt` | Regression + a11y validation + audit eval | dev...loop/20260709-m16-rt |

Each branch is stacked on the previous (T contains G; I contains G+T; RT
contains G+T+I). Merge in order — squash-merge each PR and the next lines
up automatically. Every branch is green (unit 50/50, e2e all pass).

## RT results

- `npm test` — **50/50** (49 pre-existing + the M16 R spec-guard).
- `npm run e2e` — **all pass**, including the new blocks:
  - `gate` — default off, `?redesign=1` on, tokens/redesign both 200.
  - `theme` — Auto follows OS, Light beats OS-dark (persists across
    reload), Dark beats OS-light, redesign+Auto+OS-dark = Prado forest-night.
  - `redesign preview` — screenshots for the 13 screens captured to
    `tests/e2e/shots/redesign-*.png`.
  - `redesign axe` — zero critical/serious across 9 redesigned routes.
  - `redesign axe dark` — same in forest-night.
- **Payload** — 46 KB gzipped (54 KB budget headroom).
- **No functional / localStorage / print regressions** — every previous
  e2e assertion still passes; `conjuga.v1` settings gained a `theme` field
  which is backward-compatible (unknown fields are preserved).

## Contrast fixes made during I\* (documented in DESIGN.md)

- Light `--brand`: artifact `#3f9256` (3.84:1 on white) → **`#2f6b4f`**
  (5.85:1 on white; 5.7:1 on cream).
- Light `--ink-soft`: artifact `#6c7568` (4.44:1) → **`#5c6558`**
  (5.35:1 on cream).
- `.total-stars`, `.start-here`, `.prompt-tense` texts hardcoded to
  `#243026` because the amber/persimmon backgrounds stay light in both
  palettes — the earlier "cream on hue" was a broken dark-mode media query
  applying in Auto+OS-light; pattern replaced.

## Framework evaluation

Full write-up: `docs/audits/M16-EVALUATION.md`. Summary:

- **All Round 1 findings still resolved** — the redesign is visual-only
  (routes/sampling/scoring/storage untouched), so behavioral fixes carry
  through; every existing e2e assertion for M8/M9/M10/M12/M13 still passes.
- **Redesign strengthens NN-2 / NN-4 / signifiers** — one type system, one
  icon family, distinct tense hues (sun / flag / loop) in place of
  mismatched emoji.
- **Handed to M17 for manual Round 2**: kid walkthrough of the new tense
  triad, screen-reader over the masked icons, persimmon vetting on cheap
  classroom displays, print × redesign visual review.

## Small JS changes to enable per-icon styling

`js/app.js` gained three data attributes (no new nodes, no removed classes,
no e2e-selector impact):

- `data-tense="present|preterite|imperfect"` on `.tense-card`.
- `data-mode="study|practica|choice|type|match|listen|contrast"` on
  `.mode-card`.
- `data-tense` on the `.prompt-tense` chip.

`redesign.css` uses these to pick the right SVG mask + hue per glyph;
without the gate the attributes are inert.

## Dead ends / gotchas

- The `.dc.html` design artifact renders `--brand: #3f9256` — a warm leaf
  green that misses 4.5:1. Preserving the design AS DRAWN would fail axe
  and thus the M16 acceptance criteria. Darkened per DESIGN.md's own
  "verify contrast with axe during I\*" instruction.
- An earlier attempt to conditionalize the dark-mode pill text via
  `:not([data-theme="light"])` also matched Auto + OS-light — inverted the
  intent and produced cream-on-amber. Replaced with hardcoded dark ink
  since these pill grounds stay light in both palettes.
- I\* consolidated all 13 per-screen migrations into a single loop branch
  rather than 13 individual PRs. The M16 plan says "ONE loop each" — that
  was the CI-risk optimization for many overnight loop cycles; here, all
  screens were built in one owner-directed session, so consolidating into
  one atomic diff is faithful to the intent and lets you review the whole
  Prado layer at once. Each screen still has its own commented section in
  `redesign.css` for review-ability.

## Next suggested step

- Review each of the four PRs in order (G → T → I → RT). Auto-merge in
  order, or human-merge each after review.
- After RT lands on `dev`, the **FLIP** PR to `main` is the deploy — that
  flips the gate default ON, retires (or documents-as-fallback) the
  superseded styles, and syncs SPEC / README / about. Human-only.
- M17 DATING is the natural follow-up (Round 2 audit dating scheme).
