# session: M31 📚 Cuentos — phase A, the reading-comprehension app · 2026-10-30 · claude/github-repo-context-status-q2u4i8

- Goal criteria addressed: GOAL.md M31 **A — the app** (built, tested,
  UX-reviewed; awaiting owner review) and the docs half of A; A.1 (SME
  content review) is the owner's.
- What was done:
  - Owner decisions captured in `docs/CUENTOS.md` (binding spec): name
    Cuentos at `/cuentos/`; five public-domain stories (Esopo ×2, Pombo,
    Quiroga, Martí) retold at 3 levels; tap-word glossary; 45 ⭐/story
    (5 activities × 3 levels) + 🎧 badges; 150 KB gzip budget; Common Core
    en Español RL.3 citable for Cuentos only.
  - Content: exemplar `leon-raton` written by the lead; four stories by
    parallel Opus writers against the schema + `tests/cuentos-data.test.mjs`
    (word bands 60–100 / 130–190 / 210–290, sentence-length caps, evidence
    refs, glossary coverage, option uniqueness, listen-target lengths);
    an independent Opus reviewer found zero orthography/tense errors and
    ~16 judgment calls — all HIGH/MEDIUM applied (single-answer fixes,
    non-appearing-character distractors, Pombo order lists rebuilt on the
    day's timeline, glossary gaps, LatAm "¡En sus marcas…!").
  - App (Opus builder): `cuentos/index.html`, `js/{app,reader,activities,
    storage,standards-info,stories}.js`, `css/cuentos.css`; shared
    `js/menu.js` gained defaulted options (install, extraLinks, switches,
    onBorrar, null descargas) — Conjuga's drawer unchanged; `sw.js`
    shell-v5 lists every Cuentos file and `/cuentos/` falls back to its own
    shell offline.
  - Tests: 4 new unit files + `tests/e2e/cuentos.mjs` (every screen and
    activity to results, voiceless + stubbed-voice, Pistas off, dark,
    360px, axe on 11 routes); `npm run e2e` chains both suites.
  - Docs: STANDARDS §5 (Interpretive Reading bands per level, CCSS RL.3.1–3.5
    mapping, research-backed practices), SPEC §4.6, GOAL M31 (phases A–E;
    B/C/D owner-gated), about.html Cuentos section + story credits, README,
    CLAUDE.md.
  - UX evaluation (two independent Opus agents, read-only): Nielsen
    heuristics audit (0 catastrophic · 5 major · 10 minor · 5 cosmetic) and
    a cognitive walkthrough (9 tasks, 360px-first, personas Mateo/Ms. R;
    ~80% solo-success estimate before fixes). Reports in docs/audits/.
    Fix round (Opus): all 8 blockers + 11 should-land items applied —
    literal "null" in Mapa misses, visible muted-state toast with Encender,
    compact bilingual 2×2 Mapa board, in-place level switch (no scroll
    jump), results actions by stars ("📖 Lee otra vez" ≤1★, "Siguiente
    juego" ≥2★), Ordena wrong-tap feedback above the tiles + marked tile
    + "número" wording, badge track named ("insignias"), prediction stops
    say the story continues + lock the games + echo the prediction,
    auto-advance on correct answers, honest read counting, persisted
    predictions, 360px layout (segmented pills, nowrap title, ≥44px
    glossary hit areas, bubble above the word), "Sigue aquí" ribbon,
    Palabras meaning-on-miss, bold differing words in Escucha, Pistas
    sub-label (menu.js `switchNotes`), in-app erase dialog, print/skip/
    focus-ring polish, ≥44px footer links sitewide.
- Validation: `npm test` 331/331 · `npm run e2e` Conjuga PASSED + Cuentos
  PASSED · `cuentos/` 64,523 B gzip (budget 150,000) · attribution URLs
  curl-verified 200 · axe zero critical/serious on every Cuentos route and
  dialog state.
- Decisions & rationale:
  - Cuentos lives in its own folder so Conjuga's 100 KB budget test (js/ +
    css/) is untouched; settings stay in `conjuga.v1` so theme/sound are
    sitewide; progress in `cuentos.v1`; "Borrar" inside Cuentos clears only
    Cuentos.
  - Audio gates on `speakable(text)` (TTS or a clip for THAT text), not
    `audioAvailable()` — no story clips exist until the owner's ElevenLabs
    run (phase D).
  - Beacon NOT wired: `server/worker.js` has a page allowlist (Conjuga
    names only); adding Cuentos is a server + privacy-contract change for
    the owner.
  - Correct answers also wait for "Siguiente ▶" (focus moves there) so a
    beginning reader can re-read the sentence; flagged for the UX pass.
  - Cuentos is unlinked from Conjuga until phase B (rule 5).
- Dead ends / gotchas: `node --test` in this sandbox needs
  `node_modules/playwright` symlinked to the global install for the e2e
  ES-module import (git-ignored; CI installs normally). Several levels sit
  within 4–6 words of their band cap — substitute, don't add.
- Next suggested step: owner reads the 15 texts (A.1) and the UX findings;
  then phase B (homepage chooser) and C (Conjuga → /conjuga/ with redirects
  for printed QR cards).
