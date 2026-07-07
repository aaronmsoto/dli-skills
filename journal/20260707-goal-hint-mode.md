# loop: GOAL redirect — M7 🔍 Pistas (hint mode) · 2026-07-07 · loop/20260707-goal-hint-mode

- Goal criteria addressed: none (owner redirect — new CURRENT milestone
  from direct K-5 user feedback: the owner's kids, in the exact target
  group, asked for a hint icon that shows the Estudia column for the verb
  being conjugated).
- What was done: M7 added to GOAL.md with acceptance criteria capturing
  the kids' design (🔍 button on quiz prompt cards; mini study panel =
  engine-generated column for the current verb+tense; Lola holds a
  magnifying glass to her eye via a new is-hint pose; footer checkbox
  "🔍 Pistas / Hints" default CHECKED). Scoping decisions encoded: Elige/
  Escribe/Contrast only (contrast shows BOTH past columns so the tense
  decision stays with the learner); not in Empareja or Escucha; no scoring
  penalty (NBPTS Std IV scaffolding; adults can disable). docs/MASCOT.md
  pose table gained is-hint.
- Validation: npm test 42/42 · docs-only.
- Decisions & rationale: hint reveals the full column including the answer
  cell — deliberate: the learner still maps person → row, which is the
  Estudia skill itself; the off switch is the control for stricter homes.
- Dead ends / gotchas: none.
- Next suggested step: implement M7 (single iteration: settings + panel +
  pose + e2e + docs sync).
