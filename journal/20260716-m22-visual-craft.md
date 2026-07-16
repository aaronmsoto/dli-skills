# loop: M22 prado-visual-craft skill + cloud redesign · 2026-07-16 · loop/20260716-m22-visual-craft

- Goal criteria addressed: all of M22 (SKILL / CLOUDS / V), owner-directed
  2026-07-16 ("the clouds don't really look like clouds" + a lasting visual
  design capability).
- What was done:
  - Marketplace search first: no fit (poster-art generators; React/Tailwind
    artifact builders that violate the no-build rule). Vendored our own,
    following the .claude/skills audit-skill pattern.
  - **`.claude/skills/prado-visual-craft/SKILL.md`** — Prado tokens +
    personality, the two icon languages (M17), procedural shape craft
    (pill+puff silhouettes, drop-shadow-vs-box-shadow, filter stacking
    context, SVG scene rules), state signaling (background+ink, the M20
    opacity lesson, the sticky-hover contract), motion gating, a runnable
    contrast checker, and the MANDATORY screenshot-verify loop (render →
    LOOK at the PNG → iterate → lock with e2e assertions).
  - **Clouds** (skill applied, dogfooded): `.vuelo-cloud` rebuilt from a
    bare pill into a silhouette — two `background: inherit` puff circles
    (z-index -1 tucks their bottoms behind the body; `filter` provides the
    stacking context) + `drop-shadow` around the whole alpha shape; states
    moved from borders to background+ink (hover ink 11.8:1/10.5:1, hit
    5.56:1/6.02:1 — measured); focus-visible outline ring; soft sky wash
    behind the grid; sticky-hover guard retargeted to background.
  - Screenshot loop caught a real regression: at 360px the single-column
    clouds stretched into bars → `max-width: 230px` + centered; re-shot
    light/dark/360 and all read as clouds (dark = night clouds, on theme).
  - e2e: M20-3 assertions converted from border-color to background-color
    semantics (+ hover-returns check); new "M22 clouds" lock block (puffs
    are circles inheriting the cloud background, drop-shadow present,
    borderless, width cap, sky wash).
- Validation: npm test 56/56 · e2e PASS incl. the new lock · screenshots
  reviewed at 900px light, 900px dark, 360px light.
- Decisions & rationale: pseudo-element puffs over an SVG mask because
  masks clip focus outlines and box-shadows (a11y risk); `background:
  inherit` keeps every state recoloring the whole silhouette for free.
- Dead ends / gotchas: % -positioned puffs on a full-width pill vanish into
  nubs — cap widths on shape-buttons in single-column layouts.
- Next suggested step: none — queue empty; M22 rides the next release.
  Future visual work: load the prado-visual-craft skill first.
