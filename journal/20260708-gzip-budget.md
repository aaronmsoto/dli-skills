# 2026-07-08 — payload budget becomes 100 KB GZIPPED (owner decision)

**Branch:** `loop/20260708-gzip-budget`

The raw-byte budget (100 KB, owner-raised to 120 KB on 07-07) kept
tripping on comment/readability bytes that never reach users. Owner
decision: measure what actually crosses the wire — **sum of per-file
gzipped sizes < 100 KB** (GitHub Pages serves gzip; per-file compression
mirrors per-asset HTTP transfer). At changeover the app is ~37.5 KB
gzipped (119.8 KB raw), so headroom is ~2.7×. tests/payload.test.mjs now
gzips via node:zlib; GOAL (M5/M6), SPEC, and MASCOT references updated.
Budget changes remain owner-only. Mascot's 15 KB sub-budget unchanged.

Validation: `npm test` 46/46.
