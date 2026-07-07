# 2026-07-07 — GOAL.md: capture M8 proposal (per-word tense matching)

**Branch:** `loop/20260707-goal-tense-matching` · **Type:** docs-only (no product code)

## What

Added milestone **M8 — 🧩 Per-word tense matching ("Construye la tabla")**
to GOAL.md as a **DECISION PENDING** entry. No implementation.

## Why

Direct feedback from a recent K-5 DLI graduate (owner's family): her
favorite classroom activity was rebuilding a verb's paradigm — teacher
gives the root word plus its conjugated forms, students match each form
to its person. It's essentially Empareja's matching interaction applied
to a single Estudia column.

The owner is deliberately undecided between shapes and asked for the
intent and options to be captured in GOAL.md first; the decision comes
afterwards. The entry records:

1. **Estudia toggle** — clear the table and fill it back in via matching.
2. **New quiz type** — "🧩 Construye", first quiz after Estudia in the
   recognition→production ladder.
3. **Another shape** — Empareja variant or unscored warm-up.

The entry includes an advisory loop recommendation (option 2, closest to
the classroom original and cleanest fit with the mode architecture, with
stars-vs-badges flagged as a sub-decision) and an explicit hold: loops
must NOT implement until the owner picks a direction and the acceptance
criteria are written.

## Validation

Docs-only change; `npm test` run as a regression formality — green.

## Next

Owner selects option 1/2/3 (and, if 2, stars vs. badges); the chosen
option becomes M8's acceptance criteria and the hold is lifted.
