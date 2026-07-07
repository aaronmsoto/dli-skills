# loop: hint-panel forms are tap-to-hear · 2026-07-07 · loop/20260707-hint-vocalize

- Goal criteria addressed: owner correction to M7 — the Pistas table should
  match the Estudia table's tap-to-hear behavior.
- What was done: hint-panel cells now render each form as the same
  .cell-speak button used by Estudia, speaking "person + form" via
  sayForm() — which already honors both gates the owner named: voice
  availability (buttons only render when ttsAvailable()) and the 🔊/🔇
  sound setting (say() is silent when muted). Voiceless devices get plain
  text, not dead buttons.
- Validation: npm test 42/42 · e2e PASS with two new checks: voiced page
  taps a hint cell and the utterance equals the engine's "yo <form>";
  voiceless page asserts no .cell-speak inside the hint panel.
- Decisions & rationale: reused the .cell-speak class so styling and any
  future behavior changes stay in one place.
- Dead ends / gotchas: none.
- Next suggested step: queue unchanged — M2/typed-Escucha with SME; M4
  next unheld.
