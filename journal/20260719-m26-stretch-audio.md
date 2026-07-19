# 2026-07-19 — M26 owner action: --stretch ElevenLabs run (loop/20260719-m26-stretch-audio)

## What

Owner-directed audio run (owner: "Do the audio run using the key in the
local .env file"): `node tools/generate-audio.mjs --stretch` generated
all **2,400 stretch clips** (1,200 person-prefixed phrases × normal +
despacio; ~46.7k ElevenLabs credits). Manifest grew 3,360 → **4,560
texts**; audio/clips now holds 9,120 files (~80 MB total). The stretch
🔊 buttons on Estudia/Práctica light up automatically via the M26.2
`hasClip` probe — no code change needed.

## Verification

- Coverage sweep: every one of the 1,200 derived stretch texts has both
  speed variants on disk, all files ≥ 500 B (0 missing, 0 bad).
- unit 66/66 (incl. the audio-manifest integrity suite: NFC keys, no
  file shared by two texts, zero orphan mp3s) — exit-code verified.
- e2e PASSED — exit-code verified (voiceless-parity assertions still
  hold; the harness's manifest-204 contexts are unaffected).
- GOAL: the M26 "OWNER ACTION: run --stretch" box checked.

## Notes

Descargas group caches intentionally exclude stretch phrases (they're
Estudia/Práctica tap-to-hear, not part of the per-group offline promise);
if the owner ever wants them downloadable, extend clipUrlsForSet.
