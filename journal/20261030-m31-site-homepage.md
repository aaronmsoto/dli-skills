# session: M31 B + C — site homepage at /, Conjuga moved to /conjuga/ · 2026-10-30 · claude/github-repo-context-status-q2u4i8-site

- Goal criteria addressed: GOAL.md M31 **B — site homepage** (dliskills.com/
  becomes an app chooser with Lola) and **C — move Conjuga to /conjuga/**
  (keep `conjuga.v1`, redirect legacy hash routes + printed QR URLs, update
  sw.js scope, manifest, e2e, docs). Owner decisions 2026-10-30.
- What was done:
  - `index.html` → `conjuga/index.html` (git mv; assets now `../`). New root
    `index.html` = static chooser (Lola, two whole-card links with ⭐ lines
    read from `conjuga.v1`/`cuentos.v1` minus 🎧 badges, teacher line,
    footer NBPTS → NCSSFL-ACTFL, A1/A2 credits, no ℹ️) + `js/home.js` +
    `css/home.css`. FIRST head script = redirect shim (`/#/…` →
    `conjuga/` + search + hash; also on in-page hashchange).
  - `js/app.js`: `CLIP_BASE = "../audio/"` for initClips/Descargas (cache keys
    stay `/audio/clips/…`), `../sw.js`, `../about.html`, `../docs/`,
    `../qr/`; brand line links `../`; ☰ gains Site home + Cuentos rows.
    `js/menu.js` defaults `../`; `js/static-menu.js` points Informe/Descargas
    at `conjuga/` and adds Conjuga/Cuentos rows; Cuentos ☰ → `../conjuga/` +
    site home. about.html crumbs + docs pages relinked.
  - `sw.js` shell-v6 (homepage + conjuga/ precached, per-app offline
    fallback); site-level manifest (id unchanged); QR SVGs regenerated to
    `https://dliskills.com/conjuga/#/set/N` (vendored encoder, offline).
  - Analytics: homepage `pageView("site")`; Cuentos `cuentos-*` page names
    per route render (Worker allowlist done by the lead in d273fe8).
- Validation: npm test 337/337 · e2e Conjuga smoke PASSED (incl. new
  homepage + shim section, beacon guards over / and /cuentos/) · Cuentos e2e
  PASSED · payload 88 931 B gz (< 100 KB).
- Decisions & rationale: one site-level manifest/SW (keeps installs and
  Descargas caches valid); shim lives in the homepage (GitHub Pages has no
  server redirects; hashes never reach a server anyway).
- Dead ends / gotchas: e2e `page.evaluate(import("./js/…"))` must be
  `../js/…` from /conjuga/; `addInitScript` reseeds on reload (use a fresh
  page for corrupt-storage cases); inline-flex links split `innerText`.
- Next suggested step: owner review of the homepage on a phone; decide
  whether per-app manifests are wanted (M31 D/E otherwise).
