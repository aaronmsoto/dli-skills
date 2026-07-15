# loop: M18.3b Vuelo garnish — motion, replay, prefetch · 2026-07-15 · loop/20260715-m18-vuelo-garnish

- Goal criteria addressed: completes "M18.3 — El Vuelo" (checkbox now [x]);
  also updates the queue line — M18 Ideas 1+2 COMPLETE on dev, M18.4 stays
  SME-blocked.
- What was done:
  - `css/redesign.css`: ALL motion inside `@media (prefers-reduced-motion:
    no-preference)` — clouds bob IN PLACE ≤4px with staggered delays (tap
    targets never travel), Lola hovers + wing-flap, a 0.5s perch swoop on a
    hit, wrong-tap wobble, 3★ landing sparkle. Under reduce the flight is the
    byte-identical static game from M18.3a.
  - `js/vuelo.js`: 🔊 replay affordance next to the prompt pill (the target
    form is deliberately not on screen, so the ear gets its own button) —
    rendered only when the caller injects `onSay` (i.e. `audioAvailable()`),
    removed at landing, 44px.
  - `js/app.js`: `requestIdleCallback` (setTimeout fallback) prefetch of the
    flight module post-boot so the celebration never waits on the network;
    failures silently ignored (the invite button keeps its own fallback).
  - about.html: 🌤️ El Vuelo row in the activities table (interpretive
    recognition framing, no-timer/no-failure/reduced-motion notes).
  - GOAL.md: M18.3 checked; queue line → M18 Ideas 1+2 complete on dev,
    riding the next dev→main release; post-release owner checklist added
    (`?m18demo=1` verification + optional nest-noun clip run).
- Validation: npm test 51/51 · e2e PASS with two new blocks (vuelo-bob
  animation present under normal motion and gone under reduce with the
  replay surviving — audio ≠ motion; voiceless context hides the replay and
  still deals a fully playable flight).
- Decisions & rationale: `.vuelo-hit`/`.vuelo-nope` override the bob loop so
  feedback animation never stacks on ambient animation (mascot scarcity
  rule applied to the sky).
- Dead ends / gotchas: none new.
- Next suggested step: none loop-workable — human merges the release PR;
  M18.4 waits on SME.
