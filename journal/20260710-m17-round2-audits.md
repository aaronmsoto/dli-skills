# M17 round-2 usability & accessibility audits · 2026-07-10 · loop/20260710-m17-round2-audits

Re-ran all four formal evaluations against the now-LIVE Prado redesign
(M16 shipped to main 2026-07-10), recorded dated Round 2 sections in place,
auto-fixed the mandated-tier findings, and refreshed the public usability
page. Two design-decision findings are left for the owner in GOAL.md M17.

## Method

Four parallel audit subagents, each invoking its skill against the live
redesign, using the 12 committed preview screenshots
(`docs/audits/M16-preview/redesign-*.png`) + the token/CSS source +
computed WCAG contrast ratios. Behavior/DOM/ARIA are unchanged from Round 1
(visual-only reskin), so Round 1's Operable/Understandable/Robust passes and
interaction findings carry over; this round is a Perceivable/contrast +
new-theme-selector re-audit.

## Key result: the automated gate had a blind spot

The e2e `redesign axe` gate is green, but it snapshots **empty-progress,
pre-answer** screens — so earned ★ glyphs (need score > 0) and `.feedback.*`
text (only after an answer) never render during the axe run. Manual token
computation caught two contrast regressions axe could not see (WCAG-6 star,
WCAG-7 feedback text). Both are now locked with dedicated e2e assertions
that inject the states directly.

## Findings & fixes

Auto-fixed (mandated tiers; all light-theme contrast, dark passed throughout):

| ID | Sev | Finding | Fix |
|---|---|---|---|
| WCAG-6 / NN-6 / DN-5 | Moderate/2 | ★ glyph `--star` 2.41:1 on white (re-opened R1 WCAG-2) | glyph-only `--star-glyph #b8770f` (3.69:1); pill fill unchanged |
| WCAG-7 | Serious | feedback good/bad/almost text < 4.5:1 | `--good-ink #1f6b3c` / `--bad-ink #a13318` / `--almost-ink #7d5200` (≥5.5:1) |
| WCAG-8 | Moderate | `.footer-applied` green text 3.99:1 on bg | reuse `--good-ink` (6.03:1) |
| WCAG-9 / DN-7 | Minor/low | theme active state a ~1.17:1 fill swap | 2px `--brand` border (6.29:1) |
| NN-8 | 1 | theme options 34px touch target | 44px |

New `*-ink` / `--star-glyph` tokens are theme-aware: light gets the darker
values, dark resolves to the existing bright tokens (which already passed),
so nothing in forest-night changed.

Owner triage (design-changing — appended to GOAL.md M17, NOT auto-fixed):
- **NN-7** — split icon system (group line-icons vs. emoji elsewhere).
- **DN-6** — imperfect tense badge text 3.58:1; the mid-tone hue fails with
  both dark and white text, so the fix means changing the tense hue.

Low watch items (monitor with real K-5 users): CW-4 (theme/sound behind the
unlabeled ☰), CW-5 (uniform activity-tile weight), CW-6 (star-total pill
reads tappable), NN-4 (native `confirm()`, carried).

## Validation

- `npm test` — **50/50**.
- `npm run e2e` — **all pass**, incl. the new **M17 a11y fixes** block
  (computed ★-glyph #b8770f, feedback ink colors, 44px theme options +
  brand active border) and both `redesign axe` gates (light + forest-night).
- No functional / localStorage / print regressions.

## Docs

- `docs/audits/{norman,nielsen,walkthrough,wcag}.md` — dated Round 2
  sections appended, Round 1 preserved, per-finding Found/Fixed dates.
- `docs/usability.html` — Round column + R1/R2 dated findings tables +
  2026-07-10 audit date; the two owner-open items marked pending.
- `GOAL.md` — M17 tasks checked; NN-7 + DN-6 as decision-pending; queue
  updated. `docs/DESIGN.md` contrast note already reflects Prado.

## Owner decision needed

Round 2 is otherwise complete; the app's live a11y is at 0 open
auto-fixable findings. NN-7 and DN-6 need an owner pick before a loop can
act on them (both change Prado design values). The standing screen-reader /
K-5 AT human pass remains queued with the M5 SME item.
