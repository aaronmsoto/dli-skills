# WCAG 2.2 Level AA audit — Conjuga

**Date:** 2026-07-08 · **Auditor:** loop agent (M10 A4) · **Scope:** all 10
screens (home, group, Estudia, 🧱 Práctica, ✅ Elige, ✏️ Escribe,
🧩 Empareja, 🎧 Escucha, ⚔️ Contraste, 📄 Informe) + about.html, light and
dark themes, 360px-2560px.

## Method & limitations

- **Automated-style checks** run through the repo's own harness: computed
  WCAG luminance ratios for every design-token text/background pair in
  both themes (script preserved below findings); the e2e suite already
  exercises keyboard flows, reduced-motion, dark mode, print, and ARIA
  live feedback on every screen.
- **Manual passes:** code review of every ARIA attribute, role, heading,
  and focus handler in js/app.js; keyboard walkthrough of every activity;
  320px reflow inspection; 200% zoom reasoning (all type in rem).
- **Not done (flagged for a human pass):** real screen-reader testing
  (NVDA/VoiceOver) and testing with actual K-5 assistive-tech users. This
  is the audit's biggest gap — recommend pairing with the M5 SME review.

## Findings (by POUR, severity: Critical / Serious / Moderate / Minor)

### Perceivable

- **WCAG-1 · Serious · 1.4.3 Contrast (Minimum)** — `.footer-credits`
  renders at 0.8rem with `opacity: 0.85` over `--ink-soft`; effective
  contrast in the light theme is **4.04:1 < 4.5:1** (measured
  #737a84 on #fdf6ec). Dark theme passes (5.73:1). *Fix: remove the
  opacity (token already provides hierarchy).*
- **WCAG-2 · Moderate · 1.4.11 Non-text Contrast** — earned-star color
  `--star #f59e0b` on white cards is **2.15:1 < 3:1** (light theme; dark
  passes at 6.29:1). Mitigating: filled ★ vs hollow ☆ differ by shape,
  and every star row carries an aria-label with the count — state is not
  conveyed by color alone. Still worth fixing. *Fix: light-theme
  `--star: #d97706` (3.3:1) — same hue family, passes.*
- **PASS with rationale · 1.4.10 Reflow** — conjugation tables scroll
  horizontally inside `.table-scroll` at 320px; data tables are an
  allowed two-dimensional exception, and no page-level horizontal scroll
  occurs (e2e-asserted at 360px).
- **PASS** — 1.4.4 Resize (all rem), 1.4.12 Text Spacing (no fixed
  heights on text), 1.3.1 Info & Relationships (real `<table>/<th
  scope>`, headings per screen, `role="radiogroup"` on tense pickers).

### Operable

- **WCAG-3 · Serious · 2.4.2 Page Titled (Level A)** — `document.title`
  is static ("Conjuga — …") on every route; browser history, tabs, and
  screen-reader window announcements cannot distinguish screens. *Fix:
  set a per-route title in `render()`.*
- **WCAG-4 · Moderate · 2.4.1 Bypass Blocks (Level A)** — no skip link;
  repeated chrome is small (2-3 crumb links + toggles) so cost is low,
  but a "Saltar al contenido" link is a one-line win. *Fix: add.*
- **PASS** — 2.1.1 Keyboard (every control is a native `<button>/<a>/
  <input>`; Elige/Escucha have 1-4 shortcuts with visible kbd chips;
  practica/match are tap-tap, fully tabbable; no traps — the ℹ️ dialog
  holds focus intentionally and Esc exits, focus returns). 2.4.7 Focus
  Visible (UA outlines never suppressed; enhanced `:focus-visible`
  borders on cards/tiles). 2.5.8 Target Size Minimum (≥44px audited per
  control class; accent keys 44px). 2.3 Flashing (none). 2.2 Timing (no
  limits; auto-advance ~1s is not a timeout — content persists in the
  feedback region and review list).

### Understandable

- **WCAG-5 · Serious · 3.1.2 Language of Parts** — `<html lang="es">` is
  correct for the app, but the recurring English support copy (`.h-en`,
  `.mode-en`, `.tagline-en`, `.th-gloss`, verb glosses, bilingual footer
  lines) carries no `lang="en"`, so Spanish screen-reader voices will
  mispronounce the English halves. *Fix: `lang="en"` on the recurring
  English-copy elements.*
- **PASS** — 3.2 Predictable (consistent chrome after M9; navigation
  never auto-triggers), 3.3 Input Assistance (accent retry is
  penalty-free and explained; errors identified in text next to the
  field).
- **Note (owner-visible, not a violation):** footer setting toggles on a
  game screen re-render and restart the round — surfaced to Nielsen
  review as NN-1 (it is a control/feedback issue more than a WCAG one).

### Robust

- **PASS** — valid roles only (`dialog` + `aria-modal` + focus
  management on ℹ️ panels; `status` on feedback; `radiogroup/radio` with
  `aria-checked`); decorative SVG is `aria-hidden`; no ARIA overrides of
  native semantics; single `aria-live` region avoids double-announcing.

## Summary

| Severity | Count | IDs |
|---|---|---|
| Critical | 0 | — |
| Serious | 3 | WCAG-1, WCAG-3, WCAG-5 |
| Moderate | 2 | WCAG-2, WCAG-4 |
| Minor | 0 | — |

All three Serious and both Moderate findings are mechanical, low-risk
fixes → **auto-fix mandate applies** (owner decision 2026-07-07); fixed
in the M10 fix-wave PR. Remaining gap: human screen-reader pass (queued
with the M5 SME item).

## Contrast measurements (for reproducibility)

Light: ink/bg 12.38 · ink-soft/bg 5.57 · brand/bg 5.31 · brand/card 5.7 ·
good/bg 4.67 · bad/bg 6.03 · almost/bg 4.59 · brand/brand-soft 4.8 ·
star/card **2.15** · credits-effective **4.04**.
Dark: ink/bg 14.17 · ink-soft/bg 7.36 · brand/bg 5.89 · brand/card 4.96 ·
good/bg 9.2 · bad/bg 8.45 · almost/bg 12.16 · star/card 6.29 ·
credits-effective 5.73. (WCAG relative-luminance formula; blended colors
computed for opacity cases.)

---

## Round 2 (2026-07-10) — Prado redesign

**Date:** 2026-07-10 · **Auditor:** loop agent (M17 A4′) · **Scope:** the M16
"Prado" visual redesign, now the DEFAULT look (`data-redesign` set
unconditionally by every HTML head loader). All 10 screens + about.html +
/docs, both themes via the ☰ theme selector (Auto / Light / Dark, **Light
default**), 320–2560px. Prado changed **only colors/tokens and visual
styling** — DOM, ARIA, roles, headings, focus handling and keyboard flows are
byte-for-byte the Round 1 markup, so every Operable/Understandable/Robust PASS
carries forward (re-confirmed by code review). This round is a
**Perceivable / contrast** re-audit of the new palette.

### Method & what the automated gate misses

The e2e `redesign axe` checks run axe-core over every redesigned route in
light and forest-night and assert **zero critical/serious** — green. **But
axe snapshots empty-progress, pre-answer screens**, so the earned amber ★
glyphs (need score > 0) and the `.feedback.*` text (only after an answer)
never render during the axe run. Manual token-contrast computation is what
catches the two dynamic-state regressions below.

### Perceivable — findings (all light-theme only; dark passes everywhere)

- **WCAG-6 · Moderate · 1.4.11 Non-text Contrast** — *Round 1's WCAG-2,
  re-introduced by Prado.* Filled ★ glyphs (`.stars .star.on`) took
  `color: var(--star)`; light `--star #e0982f` = **2.41:1 on `--card`**,
  **2.24:1 on `--bg`** (< 3:1). Shape (★ vs ☆) + `aria-label` counts keep
  1.4.1 a PASS, but the glyph misses 3:1. **Found 2026-07-10 · FIXED
  2026-07-10** — split off a glyph-only token `--star-glyph: #b8770f`
  (**3.69:1 / 3.43:1**), leaving `--star` for the `.total-stars` pill fill
  (dark text on it stays 5.70:1). *Note:* Round 1's #d97706 is now
  insufficient — on Prado's cream `--bg` it is only 2.95:1, so the fix went
  darker.
- **WCAG-7 · Serious · 1.4.3 Contrast (Minimum)** — *NEW.* Correctness
  feedback text (`.feedback.good/.bad/.almost`, ~18.4px so 4.5:1 applies) all
  missed AA in light: good `--good` on `--good-bg` **3.68:1**, bad **3.94:1**,
  almost `--star` on its tint **~2.14:1**. Shown on every answer → Serious.
  **Found 2026-07-10 · FIXED 2026-07-10** — darker `--good-ink #1f6b3c`
  (5.56:1), `--bad-ink #a13318` (5.62:1), `--almost-ink #7d5200` (6.04:1);
  tokens resolve to the bright values in dark (already passing).
- **WCAG-8 · Moderate · 1.4.3** — *NEW.* `.footer-applied` ("✓ setting
  applied") renders `--good` as **text on `--bg`** = **3.99:1** light. (The
  `.choice.good`/`.match-card.matched` borders use `--good` as a 3:1 non-text
  element — those pass.) **Found 2026-07-10 · FIXED 2026-07-10** — reuse
  `--good-ink` (6.03:1 on `--bg`).
- **WCAG-9 · Minor · 1.4.11 / 1.4.1** — *NEW, theme selector.* Active option
  was signalled only by a fill swap (`--card #fff` on `.theme-options`
  `--brand-tint #e3f2df` ≈ **1.17:1**). `aria-pressed` covers AT users; low-
  vision sighted users get a weak cue. **Found 2026-07-10 · FIXED
  2026-07-10** — added a `2px solid var(--brand)` border on the pressed
  option (brand/card 6.29:1).
- **PASS (re-confirmed for Prado)** — 1.4.10 Reflow, 1.4.4 Resize, 1.4.12 Text
  Spacing, 1.3.1 Info & Relationships, 1.4.1 Use of Color (star shape+labels;
  tense hues also carry distinct mask-icons sun/flag/loop). Prado text pairs
  pass: ink/card 13.76, ink-soft/bg 5.63, brand/bg 5.84, brand-on-white 6.29.

### Operable / Understandable / Robust — PASS (DOM unchanged)

Keyboard, focus-visible (Prado adds `:focus-visible` brand borders at 6.29:1),
no traps, page titles, skip link, `lang="en"` parts, valid roles, single
`aria-live` region — all unchanged from Round 1 and re-confirmed. The new
theme selector is a labelled `role="group"` of `aria-pressed` toggles with a
live-region announcement — name/role/value all sound (visual note = WCAG-9,
now fixed).

### Summary (Round 2)

| Severity | Count | IDs | Status |
|---|---|---|---|
| Critical | 0 | — | — |
| Serious | 1 | WCAG-7 | FIXED 2026-07-10 |
| Moderate | 2 | WCAG-6, WCAG-8 | FIXED 2026-07-10 |
| Minor | 1 | WCAG-9 | FIXED 2026-07-10 |

All four were light-theme contrast regressions from the color swap, all
mechanical → auto-fixed in this PR (verified in `tests/e2e/smoke.mjs`, the
"M17 a11y fixes" block). Standing gap unchanged: real screen-reader / K-5 AT
user testing (queued with the M5 SME item).

### Contrast measurements — Prado palette, post-fix (for reproducibility)

**Light (Prado day; ✓ passes; text 4.5:1 / non-text 3:1):**
ink/bg 12.76 ✓ · ink/card 13.76 ✓ · ink-soft/bg 5.63 ✓ · brand/bg 5.84 ✓ ·
brand/card 6.29 ✓ · brand/white(btn) 6.29 ✓ · **star-glyph/card 3.69 ✓** ·
**star-glyph/bg 3.43 ✓** · star-pill dark-text 5.70 ✓ · **good-ink/good-bg
5.56 ✓** · **bad-ink/bad-bg 5.62 ✓** · **almost-ink/tint 6.04 ✓** ·
**good-ink/bg (applied) 6.03 ✓** · theme-active brand border/card 6.29 ✓.
**Dark (forest-night):** ink/bg 14.84 · ink-soft/bg 7.25 · brand/bg 8.07 ·
good/bg 8.27 · bad/bg 6.89 · almost 5.75 · star/card 8.00 — all ✓ (unchanged
by the fixes; the *-ink and -glyph tokens resolve to the bright dark values).
