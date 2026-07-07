# loop: fix 🐢 Despacio sounding same-speed · 2026-07-07 · loop/20260707-despacio-rate

- Goal criteria addressed: owner-reported bug on live Escucha.
- Bug: slow replay (rate 0.65) was audibly identical to normal (0.85) on
  real devices — iOS maps sub-1.0 rates non-linearly and several Android/
  local voices quantize rate, flattening small contrasts.
- Fix: 🐢 Despacio now uses rate 0.5, the value that slows audibly on all
  major engines; normal stays 0.85. E2e asserts both exact rates.
- Validation: npm test 42/42 · e2e suite PASS.
- Dead ends / gotchas: don't fine-tune rates in the 0.6-0.9 band — treat
  0.5 (slow) and 0.85-1.0 (normal) as the only reliable settings. If a
  device voice ignores rate entirely, no Web Speech setting can help.
- Next suggested step: none pending; SME conversation gates M2/typed-Escucha.
