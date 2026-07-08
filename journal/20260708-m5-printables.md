# 2026-07-08 — M5 (reduced): printable study-sheet tune-up

**Branch:** `loop/20260708-m5-printables` · **Milestone:** M5 loop items done

## What shipped

- Study sheets now print with a classroom header — `Grupo N · Nombre: ___
  Fecha: ___` — via a `.print-only` element (hidden on screen, shown in
  `@media print`), matching the informe's existing fill-line pattern.
- Print layout hygiene: `@page { margin: 14mm }`, `thead` repeats across
  pages (`table-header-group`), table rows and review-list items get
  `break-inside: avoid`, tighter print h1/hints, denser report-table and
  verb-list typography so the 20-group informe fits comfortably.
- E2e: print-emulation asserts the header is print-only, contains
  Grupo/Nombre/Fecha, and thead repeats; all prior print checks intact.

## M5 status

Budget check ✓ (enforced at 120 KB, owner-set). Printables ✓ (this).
Copy review by a bilingual educator stays open — human SME work; loops
treat M5 as passed for queue purposes. Queue advances to M9.

## Validation

`npm test` 45/45 · `npm run e2e` PASSED (new print checks included).
