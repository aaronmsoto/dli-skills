# M16 R 🎨 design extraction — spec only · 2026-07-09 · loop/20260709-m16-r

- Goal criteria addressed: M16 task **R** (design extraction). Seeded
  Claude Design artifact committed, distilled to a token spec + machine
  tokens, unit-guarded. No change to the live app (spec only). Every later
  M16 task (G, T, I-star, RT) is now loop-capable WITHOUT design-MCP access.
- What was done:
  - `design/Conjuga Redesign.dc.html` + its `support.js` runtime committed
    as repo source, plus `design/README.md`. Unlinked — not app nav, not a
    route, not served; the raw artifact is source of truth only.
  - `docs/DESIGN.md` — distilled the committed "Prado" direction
    (2a → 3a → 4a/4b): color tokens (light + dark), type scale (Baloo 2
    display / Nunito body, by role), spacing, radii, shadows/elevation,
    the custom line-icon family, a component inventory (buttons, cards,
    prompt card, conjugation tables, ☰ menu, footer, Lola placement), and
    a screen-by-screen map to our routes with a token block per screen.
  - `css/tokens.css` — the machine tokens, DEFINED BUT NOT APPLIED: unlinked
    and scoped to `:root[data-redesign]` (nothing sets it), so provably zero
    runtime change. Forward-compatible with the G gate and the T theme
    selector (`[data-theme="light"|"dark"]` hooks; Auto = OS via
    `prefers-color-scheme`). Font tokens are family STACKS (no external
    fonts / no `@import`, per the M16 hard constraint).
  - `tests/design.test.mjs` — the R-required unit check: `tokens.css` parses
    (balanced, well-formed custom-property decls, ≥30 tokens, core tokens
    present) and `docs/DESIGN.md` carries a `css` token block for every
    screen.
- Validation: `npm test` 50/50 · `npm run e2e` all checks PASS (run against
  the pre-installed Chromium via `CHROMIUM_PATH`). e2e is unaffected by
  construction — no UI surface changed, `tokens.css` is unlinked/inert.
  Payload budget green (`tokens.css` counts toward it and is tiny).
- Decisions & rationale:
  - Committed direction is owner-selected 1b-palette + 1a-fonts + star-free
    tense triad (sun/flag/loop) — the ⭐ was retired so the tense cue never
    collides with the ★ progress star.
  - Dark `--bad`/`--bad-bg` are DERIVED (the dark mock draws no error state)
    and flagged in DESIGN.md for owner/SME + axe confirmation before I-star
    applies them.
  - Ticked the R box in GOAL.md; G/T/I-star/RT/FLIP remain open.
- Dead ends / gotchas: a `*/` accidentally embedded in a JS block comment
  (`I*/RT`) closed the comment early — reworded. e2e needs
  `npm i --no-save playwright` + `CHROMIUM_PATH` locally (CI installs it).
- Next suggested step: **G** — add the redesign gate (`data-redesign` on
  `<html>` + inert `css/redesign.css`), wire `tokens.css`, and the
  `?redesign=1` preview trigger for screenshots. Default look unchanged.
