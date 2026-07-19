# 2026-07-19 — M25.1: PWA icons + manifest (loop/20260719-m25-icons-manifest)

## What

First M25 (PWA) iteration per docs/SPEC.md §5.5:

- `tools/generate-icons.mjs` — one-shot Playwright rasterizer (dev tooling
  only, never CI/runtime). Draws Lola's head mark (reused from
  js/mascot.js's head group) + one star spark on the Prado leaf-green tile
  and writes committed PNGs: `icons/icon-192.png`, `icons/icon-512.png`
  (rounded tile, transparent corners) and `icons/maskable-512.png`
  (full-bleed, mark scaled 0.9 so the star tip stays inside the circular
  80% safe zone — 192 px < 204.8 px radius at 512²).
- `manifest.webmanifest` — name/short_name, `lang: es`, `start_url "."`,
  `scope "."`, `display standalone`, Prado light tokens as
  background/theme colors, three icons incl. purpose `maskable`.
- `index.html` — `<link rel="manifest">`, `<meta name="theme-color">`,
  `apple-touch-icon` (all relative URLs; domain-root deploy).

## Visual verification (prado-visual-craft loop)

Rendered and reviewed all three PNGs directly: owl face reads at 192 px
(squint test), star spark uncropped on the maskable variant after the
0.9 rescale (first render put the tip ~217 px out — outside round masks).

## Tests

- e2e: new M25.1 block — manifest link + theme-color present in
  index.html; manifest parses; display/start_url asserted; purpose set
  covers `any` + `maskable`; every icon URL resolves to a real PNG
  (magic-byte check). `.webmanifest` MIME added to the harness server.
- unit: manifest.webmanifest joins the 100 KB gz payload budget (icons
  stay outside it like audio, as binary assets).

## Next

M25.2 SW CORE: hand-written `sw.js` (network-first shell, VERSION cache,
offline-only `ignoreSearch` nav fallback), gated registration, dedicated
e2e block.
