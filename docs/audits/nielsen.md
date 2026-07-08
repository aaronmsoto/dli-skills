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
