# 2026-07-07 — GOAL.md: M9 transparency epic + M10 usability & a11y sprint

**Branch:** `loop/20260707-goal-usability-sprint` · **Type:** docs-only (no product code)

## What

Two new epics added to GOAL.md from an owner planning session:

- **M9 — 🪟 Transparency & attribution**: footer becomes a shared
  component on every screen (today `renderFooter()` renders only on home),
  gains links to the two standards documents (NBPTS ECYA-WL + 2020
  NJSLS-WL) and two exact credit lines (Lucia Perales, EdD; Aaron Soto,
  MHCID; consultants "A1"/"A2" — pseudonyms only, privacy invariant);
  every screen gets an ℹ️ info panel explaining how that page supports
  the standards, driven by a single data module mirrored into
  docs/STANDARDS.md and about.html.
- **M10 — 🔬 Usability & accessibility sprint** (after M9, so the new
  surfaces are in audit scope): four formal evaluations — Don Norman
  principles audit, Nielsen 10-heuristics evaluation (0-4 severity),
  cognitive walkthrough (4 personas incl. a 3rd grader on a tablet, ≥4
  tasks), WCAG 2.2 AA audit (axe-core dev-only via the Playwright
  harness + manual keyboard/zoom/reflow/contrast passes) — each with a
  report under `docs/audits/`; then a fix wave, a public
  `usability.html` findings page, and a public `/docs/` hub
  (`docs/index.html` — the docs dir already deploys with Pages).

Methodologies reviewed from mastepanoski/claude-skills (the four SKILL.md
files the owner referenced) and their process/severity/report structures
baked into the acceptance criteria.

## Owner decisions captured (2026-07-07, via Q&A)

1. Footer links = NBPTS ECYA-WL + 2020 NJSLS-WL (the documents we cite).
2. Fix autonomy = loops auto-fix WCAG Critical/Serious, Nielsen sev-3/4,
   and quick wins; design/pedagogy-changing findings become
   decision-pending GOAL tasks (M8 pattern).
3. /docs hub is BUILT this sprint, unlinked until the owner links it.
4. Info panels are bilingual, adult-focused (Spanish-first learner line +
   concise English standards mapping with citations).

Also noted in GOAL.md: M10 subsumes M5's a11y-audit and copy-review
items; M5 shrinks accordingly when M10 lands.

## Validation

Docs-only; `npm test` green as a formality.

## Next

Loop picks up M9 F1 (footer everywhere) when M9 becomes the current
milestone; M8 remains decision-pending and untouched.
