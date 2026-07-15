# loop: M18.2b Nido ceremonies + home badges + demo flag · 2026-07-15 · loop/20260715-m18-nido-celebra

- Goal criteria addressed: completes "M18.2 — El Nido" (checkbox now [x]):
  crossing ceremonies, home-card tier badges, `?m18demo=1`, about.html note.
- What was done:
  - `js/app.js` showResults: tier-crossing detection — compare
    `nestTier(nestFactsFor(setId))` before vs after `recordResult`. Ceremony
    renders only on an UPGRADE to ramita/flor (never re-fires on replay;
    brizna stays a quiet discovery per the proposal). Bilingual ceremony card
    with `createNest` glyph + "Ver el nido" link; announce() includes it.
  - Home: `.set-tier` status glyphs (🌾/🪵/🌼, role=img + aria-label — the
    ⭐/🎧 status-glyph category, not an identity icon) on set cards via one
    `nestItems()` pass.
  - `?m18demo=1` (owner directive): sample 20-group nest + demo banner on
    `#/nido`, forced twig ceremony after any round, and — critically —
    recordResult is SKIPPED in demo (`starsFor` computes the display stars),
    so the flag can be used on the live site without touching progress.
  - `js/nido.js`: exported `tierMeta()` for shared glyph/name metadata.
  - about.html: nest row in the activities table + "every child's effort
    counts" equity bullet (TYMTR citation) in the research section.
- Validation: npm test 51/51 · e2e PASS with three new M18.2b blocks (twig
  crossing seeded at 1★-everywhere to prove the no-perfection-gate rule;
  flor at the 30/30 crossing; replay does not re-fire; demo writes nothing).
- Decisions & rationale: ceremonies live on the results screen (the one
  sanctioned celebration moment); Lola's state logic is untouched (mascot
  rules: one animation at a time — the ceremony card animates, not Lola).
- Dead ends / gotchas: none new; the seed helper writes `1.past.contrast`
  explicitly — contrast is part of the all-starred derivation.
- Next suggested step: M18.3a Vuelo core (lazy js/vuelo.js, reduced-motion
  grid first, round-end trigger + skip).
