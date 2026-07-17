# loop: M24 — fix a flaky e2e test that briefly failed the release PR · 2026-07-17 · loop/20260717-m24-hover-flake

- Goal criteria addressed: all of M24 (investigate + fix + V).
- What was done:
  - Investigated PR #97's red `e2e` check rather than just re-running it.
    The failing test was the M23-added "Práctica bank tiles never show a
    phantom hover border" block.
  - Reproduced locally: ran the exact scenario 15x (4 failures), then 20x
    with diagnostics (5 failures, all showing `wrapHasNoHover: false` AND
    `tileCount: 5` — i.e. no tile had actually been removed).
  - Root cause found in the TEST, not the product: drop-slots render only
    for active persons (`[0,1,2,3,5]` — vosotros off by default, 5 DOM
    elements), but the test used the raw logical person index (which can be
    5, for ellos/ustedes) as a direct array index into that 5-element
    NodeList. Index 5 is out of bounds on a 5-element array → `undefined`
    → `?.click()` silently no-op'd → the tile was never removed → the test
    was observing perfectly normal, correct hover on an untouched tile, not
    a phantom one.
  - Fixed the test's mapping to go through the same active-persons list the
    app itself builds (`activePersons.indexOf(logicalPerson)`), and added a
    hard precondition assertion (`placed !== 1` fails loudly) so this class
    of bug can't silently no-op and pass again.
  - Verified the fix conclusively: 30/30 clean trials with corrected
    mapping (every one showing `tileCount: 4`, i.e. genuine removal),
    versus the previous ~25% failure rate. The SHIPPED M23 product fix
    (CSS `.no-hover .bank-tile:hover` guard + re-armed `suppressHover`
    call) was correct all along.
  - Also hardened `js/app.js` `place()` defensively: moved
    `suppressHover(bankWrap)` to fire BEFORE `btn.remove()` instead of
    after — zero behavior change, removes a theoretical ordering race
    between the DOM mutation and the guard's activation.
  - Repaired a GOAL.md list-integrity check habit: verified all M0-M24
    milestone headings present exactly once before and after editing
    (continuing the discipline established after the M22 heading-loss
    incident).
- Validation: npm test 56/56 · full e2e suite run 5x consecutively with
  zero failures (previously reproduced at ~25% failure rate before the
  fix, in the exact same scenario).
- Decisions & rationale: fixed the test rather than weakening/removing the
  assertion — the underlying guard behavior IS worth locking in e2e; the
  bug was purely in how the test simulated tile placement.
- Dead ends / gotchas (important for future loops): when a NEW e2e test
  passes locally but fails in CI, don't assume "flaky CI" — reproduce with
  repeated local trials FIRST (single runs can get lucky). When a test
  manipulates DOM state to set up a scenario (not just asserting), verify
  the setup itself actually succeeded (add a precondition check) rather
  than trusting it and only checking the final assertion — a silently
  failed setup step produces a test that "passes" for the wrong reason
  (nothing to assert) as often as it "fails" for the wrong reason.
- Next suggested step: none — queue empty; M24 rides the next release
  alongside M23 (still not yet deployed as of this writing).
