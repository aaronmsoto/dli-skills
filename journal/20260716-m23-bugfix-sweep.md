# loop: M23 bug sweep — Práctica scroll, Reto dark pill, sticky-hover gaps · 2026-07-16 · loop/20260716-bugfix-sweep

- Goal criteria addressed: all of M23 (SCROLL / CUE-CHIP / DEMO-BANNER /
  STICKY-HOVER GAPS / V), owner-directed 2026-07-16.
- What was done:
  - **SCROLL**: `css/redesign.css` `.table-scroll` had `overflow: hidden
    auto` — the shorthand's two values are X then Y, so this was backwards
    and silently disabled real touch/wheel/drag horizontal scroll on
    Estudia/Práctica/Informe since M16, while `scrollLeft = n` kept working
    programmatically — exactly why the M13 e2e test (which used that
    assertion) stayed green through the whole regression. Fixed to explicit
    `overflow-x: auto; overflow-y: hidden`. Rewrote the M13 test to assert
    computed `overflow-x` directly AND perform a real `page.mouse.wheel()`
    gesture instead of a programmatic jump.
  - **CUE-CHIP**: Reto's `.prompt-tense.cue-chip` has no `data-tense` by
    design (coloring it would leak the answer), so it fell through the
    redesign layer's tense-colored rules to a hardcoded `#243026` ink with
    no background — 1.04:1 on the dark card. Gave it `--brand-tint`/`--ink`
    (11.82:1 light, 10.53:1 dark). Consolidated a duplicate `.prompt-tense`
    block found during triage (dead `color:#fff` immediately overridden).
  - **DEMO-BANNER**: found via a systematic grep of every element painted
    with `var(--accent)`/`var(--star)` — the lone one pairing it with white
    text instead of the established dark-ink pattern (2.93:1 light / 2.30:1
    dark). Fixed to match the other two accent-background elements.
  - **STICKY-HOVER GAPS**: `suppressHover(bankWrap)` was called on every
    Práctica bank render, but `redesign.css` never had the matching
    `.no-hover .bank-tile:hover` neutralizer, so the guard was a silent
    no-op — confirmed empirically (see gotcha below) that a reflowed tile
    genuinely matches `:hover` after a sibling's removal. Added the CSS,
    re-armed the JS guard after every removal (not just first render).
    Added `.no-hover .drop-slot:hover` defensively (legacy styles.css had
    it, redesign.css never carried it over).
  - **GOAL.md repair**: unrelated to the reported bugs — found while adding
    this entry that M22's own PR (#94, already merged) had silently deleted
    M21's milestone heading line during an insertion. Restored it; verified
    all M0-M23 headings present exactly once.
- Validation: npm test 56/56 · e2e PASS (run 4x total, no flakes) incl. 3
  new "bug sweep" blocks · screenshots reviewed (Reto + demo-banner in both
  themes; Práctica scroll before/after a real wheel gesture, both themes).
- Decisions & rationale: gave the cue-chip its own neutral chip rather than
  a `data-tense` value — the whole point of Reto is the player infers the
  tense from the cue word; coloring it would remove the challenge.
- Dead ends / gotchas (important for future loops): `page.hover()` in
  Playwright moves the real mouse to the target, which FIRES the exact
  `pointermove` event the sticky-hover guard listens for to clear itself —
  so `page.hover()` cannot test this guard; it always looks broken even
  when it works. Use `page.mouse.move()` once to park, then mutate the DOM
  without further real pointer movement (JS `.click()`), matching the
  pattern already used in the "sticky-hover regression" test earlier in
  the suite. Cost ~40 minutes of misdiagnosis before catching this.
- Next suggested step: none — queue empty; M23 rides the next release.
  Noted but NOT fixed (scope discipline): scrolling a container can also
  slide new content under a stationary mouse, which could theoretically
  produce a similar phantom-hover moment during a table scroll. No existing
  pattern in the app guards scroll-driven hover (only render/removal-driven
  hover is guarded anywhere), it's cosmetic-only, and building a new
  scroll-hover-suppression mechanism is a feature addition beyond this
  bug-sweep's scope — flagged for a future owner call, not implemented.
