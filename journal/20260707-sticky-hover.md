# loop: fix sticky-hover "still selected" outline · 2026-07-07 · loop/20260707-sticky-hover

- Goal criteria addressed: owner-directed bug fix (outside milestone queue).
- Bug: after answering, the next question could render with an option
  already outlined. Root cause: browsers re-apply :hover to whatever sits
  under the last pointer position — on touch the virtual pointer stays at
  the last tap, and the new grid's option occupies the same slot. Affected
  Elige, Contrast, Match (persistent cards), and Escribe's buttons.
- Fix: suppressHover(container) adds a .no-hover class on every fresh
  answer surface (and after each match-pair resolution); CSS neutralizes
  hover styles under .no-hover; the first genuine pointermove inside the
  container restores normal hover. Keyboard/focus-visible unaffected.
- Validation: npm test 42/42 · e2e 20/20 including a true reproduction
  (pointer parked over an option, answered via keyboard, fresh grid
  asserted borderless under the pointer, hover restored on move) plus
  no-hover presence checks in type/match/contrast.
- Dead ends / gotchas: pointermove only bubbles to the container while the
  pointer is INSIDE it — leaving no-hover set when the pointer exits is
  correct (nothing hovers outside); test must move within the grid. Also:
  same-hash page.goto() is a same-document navigation — reload() to reset
  a round in tests.
- Next suggested step: none; awaiting SME (M2) or owner direction.
