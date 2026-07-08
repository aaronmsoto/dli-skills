# 2026-07-08 — M13: frozen persons column on scrolling tables (owner bug report)

**Branch:** `loop/20260708-sticky-persons`

Owner-reported, critical on phones: scrolling Práctica's table to reach
later verb columns pushed the persons column out of view — the learner
lost the row labels exactly when placing a word. Spreadsheet-style
freeze applied: `position: sticky; left: 0` on the first column of every
`.table-scroll` conjugation table (Práctica, Estudia, informe), with
solid backgrounds (card, brand-soft header, and a solid mix for the
even-row striping so rows don't bleed through) and a subtle right
shadow for depth. Hint tables aren't in scroll containers and are
untouched. Print unaffected.

E2e: at 360px, for Práctica and Estudia — scroll the container 300px,
assert real overflow occurred AND the persons `<th>` x-position moved
≤1px. Full regression green.

GOAL records this as M13 (complete). SPEC 4.3i notes the guarantee.
