# loop: Estudia links every activity · 2026-07-07 · loop/20260707-study-links

- Goal criteria addressed: final M7 checkbox ("Estudia links to every
  current activity" — owner add-on); M7 marked complete.
- What was done: the study screen's action row now includes 🎧 Escucha
  (when a Spanish voice exists) and the ⚔️ ¿Pretérito o imperfecto?
  challenge (when the tense is preterite or imperfect) alongside the three
  games and print. Present-tense study intentionally omits the contrast
  link (it is a past-tenses activity).
- Validation: npm test 42/42 · e2e PASS with new assertions: past-tense
  study shows the contrast link, present does not; voiceless devices get
  no Escucha link; the stubbed-voice page does.
- Decisions & rationale: gating mirrors the set screen exactly, so the two
  surfaces can never disagree about what exists.
- Dead ends / gotchas: none.
- Next suggested step: M7 done → release PR carries hint mode + links.
  Queue: M2/typed-Escucha await SME; M4 next unheld.
