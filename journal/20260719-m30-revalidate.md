# 2026-07-19 — M30.3: sitewide revalidation; M30 shipped (loop/20260719-m30-revalidate)

## What

- **Axe gate extended** — the sweep now covers 10 routes (adds
  Descargas, Pack, stretch Estudia) AND three interactive states of the
  new drawer (menu open, Ajustes expanded, install dialog): **zero
  critical/serious violations everywhere**.
- **Keyboard-only e2e pass** — Enter opens the drawer, Tab traverses
  the rows in order down to Ajustes, keyboard focus is visibly styled
  (tint background asserted), Escape closes and returns focus to ☰.
- **docs/SPEC.md §4.3k** rewritten for the M30.2 pattern (disclosure
  nav, Ajustes group, scrim, dialog handoff, z-layers, focus contract).
- **GOAL** — M30.3 checked; **M30 marked shipped**; queue back to "no
  active loop milestone".

## Sprint wrap-up (M30.1-M30.3)

1. ⭐ "reset": diagnosed as a storage-context event, not a code bug
   (agent-verified across the full day's diffs); `persist()` now runs
   at boot; the returning-learner e2e fixture guards the read path
   forever; the iOS separate-container answer is documented in product.
2. ☰ menu: full hamburger overhaul (text rows, Ajustes group, scrim,
   focus contract) with the install-under-menu bug fixed at both roots.
3. Revalidation: axe + keyboard + screenshot sweeps all green.

Owner actions: merge the release PR; on the affected device, check
`localStorage.getItem("conjuga.v1")` to settle which storage event hit
(fresh iOS container vs eviction vs demo-mode rounds).
