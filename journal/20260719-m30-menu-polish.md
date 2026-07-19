# 2026-07-19 — M30.4: menu polish (loop/20260719-m30-menu-polish)

## What (owner follow-up, appended to M30)

- **Settings order + switch UX** — Ajustes now lists Vosotros → Pistas
  → Sonido → Tema → Borrar. The first three are `role="switch"` rows:
  label left, visible track+thumb right (state = thumb position + tint,
  never color alone; 150ms thumb slide inside the reduced-motion media
  query only). Tema stacks its Auto/Claro/Oscuro options under the
  label. Note: the request said "Nosotros" — implemented as the
  VOSOTROS toggle (the only off-by-default setting; nosotros is never
  optional in Spanish), flagged in the plan the owner approved.
- **Tema default → AUTO** (owner decision in plan review, reversing the
  2026-07-09 Light default): all four inline head loaders drop the
  `||"light"` fallback (unset theme = OS scheme); themeSelector's
  `current()` falls back to "auto"; CLAUDE.md/SPEC updated together.
  Defaults otherwise unchanged: vosotros OFF, pistas ON, sonido ON.
- **Shared drawer, sitewide** — menuButton/installMenuItem/
  themeSelector/`el()` extracted into **js/menu.js** (hooks for the
  host: announce, soundGate, onUnmute greeting, mid-round-safe
  afterSetting, beacon feature, captured install prompt). js/app.js
  wires the app hooks in a 15-line wrapper; **js/static-menu.js**
  mounts the same drawer on about.html and docs/ (root-relative links,
  no beacon — static pages aren't in the allowlist). docs/index.html
  gains the missing styles.css link. sw.js SHELL += both modules,
  VERSION → shell-v4.

## Verification

- e2e: default-theme test INVERTED (fresh visitor on OS-dark now gets
  forest-night, data-theme unset); M30.2 hints assertion → aria-checked;
  NEW M30.4 block — settings order, switch role/track/thumb/persistence,
  vosotros defaults OFF, Tema flex-direction column, both static pages
  open the drawer and a theme change applies live; axe sweep grown to
  the two static pages + their menu-open states (zero critical/serious).
- Suites exit-code-verified green (unit 74/74; full e2e first try).
- Screenshot loop: app menu light/dark/360 + about.html + docs/ with
  the drawer open — switches render as real toggles in both themes.
