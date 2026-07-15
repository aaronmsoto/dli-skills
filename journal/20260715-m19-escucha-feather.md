# loop: M19 🎧 accessibility reframe + 🪶 nest feather · 2026-07-15 · loop/20260715-m19-escucha-feather

- Goal criteria addressed: all of M19 (REFRAME / FEATHER / V) — checkbox
  closed; queue line updated (M19 complete, rides the pending release).
- What was done:
  - REFRAME: about.html Escucha row rewritten — the badge split is stated as
    an accessibility guarantee ("progress never requires hearing"), the
    stale "appears only on devices with a Spanish voice" replaced with the
    clips-era truth; standards-info listen entry rewritten to match;
    js/app.js LISTEN comment reframed. (CLAUDE.md rule 3 was the owner's
    stub PR #84.)
  - FEATHER: `nestItems()` adds `feather: listenBadges(setId) === 9`
    (derived-only, hearing kept OUT of nestTier/allStarred); nido.js exports
    PLUMA, renders "… y la pluma" in the list (tap-to-hear speaks both
    nouns), draws a small quill in the scene, and shows listening-only
    groups as "Grupo N · la pluma"; home set-cards append 🪶 with a combined
    bilingual aria-label; nestSummary counts plumas; the ?m18demo=1 sample
    nest feathers groups 2/5/11/14 (14 = pluma-only).
  - Quiet discovery by design — no ceremony (consistent with the brizna;
    listening results keep their existing celebration surface).
- Validation: npm test 52/52 (new pluma unit test) · e2e PASS with three
  M19 blocks: 9/9 → feather in list/summary/home + tier class verified
  hearing-free; 8/9 → nothing; listening-only 9/9 → la pluma; about.html
  asserted to carry the new rationale and NOT the stale claim.
- Decisions & rationale: feather threshold is the full 9/9 (a completed
  parallel track earns the nest's parallel object); listening-only groups
  render so listen-first kids see their work in the nest.
- Dead ends / gotchas: e2e locator ordering — assert nido-item classes
  BEFORE navigating away to home (first draft read .nido-item on the home
  route and timed out).
- Next suggested step: none loop-workable — owner merges the release PR
  (#78) which now carries M18 Ideas 1+2 + M19.
