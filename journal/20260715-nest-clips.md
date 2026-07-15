# loop: nest-noun clips + manifest integrity guard · 2026-07-15 · loop/20260715-nest-clips

- Goal criteria addressed: the M18/M19 owner sign-off item "one ElevenLabs
  clip run (~15 nest nouns)" — owner directed 2026-07-15 (subscription
  window closing) with an explicit ask to avoid the initial set's
  accent-collision labeling issues.
- What was done:
  - Audited the existing manifest FIRST: 3,353 texts, 0 collisions,
    0 missing files, 0 non-NFC keys, all 40 accent-sibling pairs
    (paso/pasó…) safely distinct — the M12 slug+hash naming held. Found and
    DELETED 60 orphan mp3s (short-hash residue of the pre-fix initial run —
    the "issues" the owner remembered; nothing referenced them).
  - tools/generate-audio.mjs: new `--nest` flag + NEST_PHRASES — the EXACT
    strings js/nido.js speaks (la brizna / la ramita / la flor / la pluma +
    the three "tier y pluma" combos; keep in sync with TIER_NAMES/PLUMA).
  - Generated 14 clips (7 phrases × 🔊 0.85 / 🐢 0.70) ≈ 182 credits;
    verified sizes 4.5-10.2 KB and current slug+hash filenames.
  - NEW tests/audio-manifest.test.mjs (4 tests): NFC keys + both variants on
    disk; no clip file shared by two texts (accent-collision guard); zero
    orphan mp3s; every nido.js-speakable string has clips (imports
    tierMeta/PLUMA so the test breaks if the nest vocabulary drifts).
- Validation: npm test 56/56 · e2e PASS (clips context unaffected — lazy
  per-utterance fetches).
- Decisions & rationale: nest tap-to-hear now plays premium clips instead
  of device TTS wherever clips load; no app code change needed (exact-text
  manifest lookup already routes clip-first).
- Dead ends / gotchas: orphan detection = manifest-referenced set vs
  readdir; the 60 orphans all wore the old 4-char hash format.
- Next suggested step: none — queue empty again; clips ride the next
  release the owner merges.
