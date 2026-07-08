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
