# loop: M6-V+RT validation, regression, docs · 2026-07-07 · loop/20260707-mascot-vrt

- Goal criteria addressed: "V (validation)" and "RT (regression)" — closing
  out M6 (milestone checked complete; ships with the next release merge).
- What was done: payload-budget unit tests (app < 100 KB — currently well
  under; mascot module ≤ 8 KB of its 15 KB budget); e2e additions: Lola
  hidden in print, dark-mode palette token asserted + screenshot, 360×640
  mobile run (no horizontal overflow, perch bounding box inside viewport),
  reduced-motion already covered. Docs synced: README feature bullet,
  CLAUDE.md architecture entry, SPEC 4.3f, about.html standards row
  (NBPTS Std V framing).
- Validation: npm test 42/42 · full e2e PASS (19 checks incl. all mascot
  states, print/dark/mobile/reduced-motion evidence).
- **Defects caught by V (worth remembering):** (1) the I1 dark-palette CSS
  insert had silently failed — dark mode was showing light-Lola until the
  V check asserted the computed token; lesson: assert insertions in the
  same script that makes them. (2) The perch overhung the viewport by 2 px
  at question 1 (translateX(-40%) at left:0) — now clamped
  `clamp(26px, pct%, calc(100% - 28px))` with translateX(-50%).
- Next suggested step: M6 done. M2 remains ON HOLD for SME input; M3
  (listening mode) is the next unheld milestone if the owner lifts nothing.
