# Heuristic evaluation (Nielsen 10) — Conjuga

**Date:** 2026-07-08 · **Evaluator:** loop agent (M10 A2) · severity
scale 0 (none) - 4 (catastrophic). Every screen walked in light/dark,
360px/desktop, voiced/voiceless.

## Violations

- **NN-1 · Severity 3 · User control & freedom / Error prevention** —
  *Location: footer toggles (vosotros, 🔍 Pistas) on any game screen.*
  Since M9 put the footer everywhere, flipping a toggle mid-round
  re-renders the screen, which silently restarts the round and discards
  the round's progress. Affected task: any learner who scrolls and taps a
  toggle at question 7/10. No warning, no undo. **Design-changing →
  DECISION PENDING in GOAL.md M10** (options: confirm-before-restart,
  defer-to-next-round, or freeze toggles during rounds).
- **NN-2 · Severity 2 · Visibility of system status / Match with the
  world** — *Location: browser tab & history.* Static page title on all
  routes (same fact as WCAG-3); tabs and history read "Conjuga — …" ten
  times. **Auto-fixed** (per-route titles).
- **NN-3 · Severity 2 · Flexibility & efficiency vs. discoverability** —
  *Location: home.* Twenty visually identical group cards; a brand-new
  learner gets no "start here" cue (Grupo 1 is the implicit start, and
  frequency-ranking means it IS the right start, but nothing says so).
  Affected task: first-ever visit. **Design-changing → DECISION
  PENDING** (options: subtle "¡Empieza aquí!" ribbon on the first
  not-yet-started group; or a "Continúa" card that tracks the furthest
  group).
- **NN-4 · Severity 1 · Consistency & standards (aesthetic)** —
  *Location: "Borrar progreso".* Uses the browser-native `confirm()`,
  visually alien next to the app's dialogs (ℹ️ panel). Functionally
  fine, non-punitive, reversible-by-cancel. Cosmetic; noted, not queued.
- **NN-5 · Severity 1 · Recognition rather than recall** — *Location:
  🎧 Escucha discovery on voiceless devices.* The mode is intentionally
  invisible without a Spanish voice (correct: never dangle a broken
  door), but families on voiceless browsers never learn the feature
  exists at all. Consider one line in about.html/docs (recorded there in
  the M10 docs hub) rather than any in-app change. Accepted tradeoff.

## Cross-heuristic pattern

Both severity-2+ interaction findings (NN-1, NN-3) come from the same
root: global chrome (footer, home grid) not yet aware of *session
state* (mid-round vs idle; new vs returning learner). Any fix should
add state-awareness, not more chrome.

## Quick wins applied in the fix wave

Per-route titles (NN-2/WCAG-3), skip link (WCAG-4), credits contrast
(WCAG-1), light-theme star token (WCAG-2), `lang` parts (WCAG-5).

## Positive highlights (keep these)

- **Visibility of status**: progress bar + Lola's physical position +
  streak flame + per-card stars — status is ambient, never modal.
- **Informative, never punitive errors**: wrong answers show the correct
  form and require acknowledgment; accent slips get a free retry with a
  targeted hint; Práctica cannot be failed by design.
- **Recognition before recall** is the product's spine (Estudia →
  Práctica → Elige → Escribe), and 🔍 Pistas gives in-context recognition
  scaffolding without a scoring penalty.
- **Consistency**: one `el()`-built visual language; every activity
  declares a scoring track (stars/badges/unscored); icons are distinct
  per activity (🧱 vs 🧩 enforced during M8).
- **Minimalism**: no accounts, no nags, no streak guilt (explicit Duo
  anti-pattern note in docs/MASCOT.md).

---

## Round 2 (2026-07-10) — Prado redesign

**Date:** 2026-07-10 · **Evaluator:** loop agent (M17 A2′) · severity 0–4.
Scope: the M16 "Prado" redesign, now the DEFAULT look. Visual-only — routes,
DOM, behavior, scoring, ARIA unchanged, so Round 1 interaction findings are
re-confirmed, not re-walked. New surface: the ☰-menu theme selector.

### Round 1 status under Prado

- **NN-1** (mid-round toggle restart) — behavior untouched; toggles still
  defer. **Still resolved.**
- **NN-2** (per-route titles) — **still resolved.**
- **NN-3** (first-visit cue) — the "¡Empieza aquí!" ribbon renders as a
  persimmon `--accent` pill on Grupo 1; **resolved and improved** by the
  redesign's color coding.
- **NN-5** (Escucha on voiceless devices) — unchanged; accepted tradeoff.

### Violations (Round 2)

- **NN-6 · Severity 2 · Visibility of status (WCAG 1.4.11)** — amber `--star`
  ★ glyph 2.41:1 on white cards; a regression of the M10 WCAG-2 fix. Numeric
  "x/30" beside it keeps meaning (hence 2, not 3). **Found 2026-07-10 · FIXED
  2026-07-10** (`--star-glyph #b8770f`, 3.69:1; dark unchanged). *= WCAG-6 /
  DN-5.*
- **NN-7 · Severity 2 · Consistency & standards · OWNER DECISION (open)** —
  Prado gives the group screen monochrome line-icons (masked SVG, `--brand`),
  but the same activities keep full-color emoji everywhere else (Estudia
  action row, h1 headings, footer). One activity now wears two icons depending
  on screen. Round 1 praised distinct-per-activity icons as a strength; the
  split partially erodes that recognition cue. It's an aesthetic-direction
  call (push line-icons everywhere, or revert group cards to emoji) → appended
  to GOAL.md M17 for owner triage. Not mechanical.
- **NN-8 · Severity 1 · Touch target** — the 🎨 Tema segmented control was
  `min-height: 34px`, under the project's ≥44px K-5 rule (golden rule 4).
  **Found 2026-07-10 · FIXED 2026-07-10** (raised to 44px). Its active state
  also gained a brand border (= WCAG-9/DN-7, fixed).
- **NN-4 (carried) · Severity 1** — footer "Borrar progreso" still uses native
  `confirm()`; Prado's polish widens the visual gap. Functionally fine,
  reversible; noted, not queued.

### New theme selector (task T) — assessment

Net positive: immediate apply + `aria-live` "Tema: …" announcement (H1);
active option now signified by raised pill + shadow + bold + **brand border**
+ `aria-pressed` (H6). Light-default encoded consistently in the inline loader
and `themeSelector()`. Nit (not filed): **Auto** gives no readout of which OS
theme it currently resolves to — acceptable for this audience.

### Cross-heuristic pattern

NN-6 and NN-7 share a root: the Prado token/icon migration re-derived values
from the design artifact without re-inheriting the **accessibility deltas the
M10 fix wave had already baked in** (the star was darkened for contrast; the
emoji set kept uniform for recognition). Fix-forward rule: treat the shipped,
audited CSS as a constraint the reskin must satisfy, not prior art it can
overwrite.

### Positive highlights (new, keep these)

- **Aesthetic & minimalist design (H8) — the redesign's headline win.** Warm
  cream field, elevated 22px-radius white cards, gentle hero band, disciplined
  single green brand: a calm, single-system read with clear hierarchy.
- **Tense color-coding (H6/H2)** — the star-free sun/flag/loop triad adds a
  consistent recognition cue Round 1 lacked.
- **Text contrast holds AA** — the reskin did not regress running text; only
  the non-text star and post-answer feedback text (both now fixed).

### Quick wins (applied)

Darkened the light star glyph (NN-6) and feedback/applied text (WCAG-7/8), and
bumped `.theme-option` to 44px with a brand active border (NN-8, WCAG-9) —
all one-to-few-line CSS, all verified in e2e. Every non-owner Round 2 finding
is cleared; NN-7 (icon split) awaits owner triage.
