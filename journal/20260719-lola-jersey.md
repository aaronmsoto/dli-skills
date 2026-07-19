# 2026-07-19 — 🇪🇸 seasonal hero: Lola's Spain jersey (loop/20260719-lola-jersey)

## What (Claude Design handoff, owner-directed)

The previously PARKED jersey task unblocked: the real asset arrived via
a claudeusercontent URL and was verified before touching the repo —
3,086 B, viewBox 0 0 120 140 with geometry IDENTICAL to js/mascot.js
(same head/face/beak/talon coordinates), no scripts, no foreignObject,
no external references (the only "http" is the SVG namespace).

- **assets/lola-spain.svg** — the delivered art, committed verbatim as
  the source of truth.
- **js/mascot-jersey.js** — the same drawing with the mascot animation
  hooks re-applied: root `.lola is-idle`, `.lola-body-g`, `.lola-head`,
  `.lola-eyes`/`.lola-pupils`, and the `.lola-lids` blink rects (absent
  from the delivered file) — idle bob, blink, and reduced-motion
  handling work unchanged. Separate module on purpose: js/mascot.js has
  its own 8 KB budget (4,812 B + ~3 KB would have crowded it).
- **js/mascot.js** — `createLola(size, { markup })`: a trusted static
  template can replace the default owl; identical wrapper (aria-hidden,
  size, classes).
- **js/app.js** — `seasonalHeroMarkup()`: HOME hero only, and only when
  `year === 2026 && month === July`. August 1 reverts automatically with
  no deploy; the variant never resurfaces in later years. Every other
  screen keeps the standard Lola.
- **sw.js** — SHELL += js/mascot-jersey.js; VERSION → shell-v5.

## Verification

- e2e (clock injection, both sides of the boundary): July 2026 → home
  hero wears the jersey with `.lola-head`/`.lola-lids`/`is-idle` +
  aria-hidden intact, while Práctica keeps the standard owl; August
  2026 → the token-colored standard owl is back on home. Suites
  exit-code-verified green (unit 74/74; full e2e).
- Screenshot review: jersey hero light + dark — reads as Lola in a red
  crested jersey at the exact hero size/position.

## Note for the record

Delivered colors are hard-coded (per the asset) — the costume stays
light-toned in dark mode by design; the standard owl continues to use
the theme tokens.
