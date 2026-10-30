# Cuentos — Nielsen heuristics audit (pre-owner-review, 2026-10-30)

Method: `nielsen-heuristics-audit` skill; real app driven with Playwright at
900×900, 360×740 (touch), 1024×768, dark mode, with/without a stubbed es-MX
voice; every route, all six activities (with deliberate misses), results,
Informe, Créditos, ☰ (Ajustes/Borrar), footer. Code at `5c06722`.
Personas: P1 = 3rd grader, strong English reader, new to Spanish reading,
classroom iPad; P2 = DLI teacher setting up a station.

Totals: 0 catastrophic · 5 major · 10 minor · 5 cosmetic. Finding IDs
(NH-n) are cited by the fix commits.

## Severity 3 (major)

- **NH-1 · H9/H2 · Mapa miss shows the literal word "null".** Map items
  have no `evidence`, `evidenceQuote()` returns null and
  `feedback.replaceChildren(..., null)` renders a text node. Also no
  pointer back to the text; results "Para repasar" has no quote for Mapa.
  Fix: filter falsy children; on a Mapa miss show "📖 Busca la respuesta
  en el cuento / Look for it in the story" with a button that opens the
  passage panel; optionally add `evidence` to `map.*` in the schema.
- **NH-2 · H1 · Sound off: every 🔊/▶️/🐢 stays visible and silently does
  nothing** (only the sr-only live region changes; key-word chips say
  nothing at all). Fix: visible muted state — inline toast "🔇 El sonido
  está apagado / Sound is off" + "🔊 Encender / Turn on" that flips the
  setting and replays; or `.is-muted` 🔇 styling; route key chips through
  the same gate.
- **NH-3 · H6/H4 · Mapa board above the question looks tappable (same
  dashed look as Ordena slots) and at 360px pushes all answers below the
  fold** (first option at y≈715/740). Fix: move the board below the
  feedback as a filling "Tu mapa" summary, or compact 2×2 with solid
  borders and a "← ahora" tag; at ≤480px a 4-dot progress instead.
- **NH-4 · H3/H1 · Picking a level on the story screen re-renders, jumps
  to the top, drops focus** (activities ~1400px below at 360px). Fix: swap
  only the activity section + `aria-checked`; or restore scroll and
  `scrollIntoView` the activities, focus the chosen card, announce
  "🌳 Nivel 2 elegido".
- **NH-5 · H3/H2 · Low-score results say "Lee el cuento otra vez" but
  offer only 🔁 Otra vez / next activity / 📚 Cuento; after Mapa at 0★ the
  second button is "📖 Siguiente nivel".** Fix: at ≤1★ make "📖 Lee otra
  vez" primary and Otra vez secondary; show Siguiente nivel only when the
  level has ≥10★ (or Mapa ≥2★); add the 📖 Lee crumb to results.

## Severity 2 (minor)

- **NH-6 · H4/H7 · Correct answers also require "Siguiente ▶" (25 extra
  taps per level) while Ordena auto-advances.** Fix: auto-advance ~1200ms
  after a correct answer (cancel on any tap), keep manual Siguiente on a
  miss; keyboard path stays.
- **NH-7 · H1 · Read count increments on every render** (level-pill
  switches, ☰ setting toggles). Fix: count once per (story, level) per
  session on evidence of reading (last paragraph seen / read-along done /
  leaving via an activity link); dedupe in sessionStorage.
- **NH-8 · H3 · Prediction stops reset on any reader re-render** (menu
  toggle, pill round trip, back nav). Fix: persist answered stops in
  sessionStorage; don't re-render Lee from `afterSetting`.
- **NH-9 · H8 · At 360px the text starts at y≈432/740** (ℹ️ wraps under
  the title, pills take two rows, tap hint, controls). Fix: title
  `flex-wrap:nowrap` + smaller h1 at ≤480; pills as one 3-column segmented
  row ("🌱 1 · 🌳 2 · 🌲 3", aria-labels); shorten the tap hint and hide it
  after the first glossary tap; read-along on the pills row on wide
  screens.
- **NH-10 · H4 · "Lugar" means slot position in Ordena and setting in
  Mapa.** Fix: Ordena uses "número"/"paso" in feedback, SR text, results.
- **NH-11 · H5 · One-tap "Borrar progreso" in every footer next to
  Informe; native confirm(); no shared-station guidance.** Fix: keep
  Borrar in ☰ Ajustes only (or after credits); in-app dialog with a
  deliberate second step; one teacher line in the Informe ℹ️: "Estación
  compartida: imprime el informe y luego borra el progreso".
- **NH-12 · H6/H1 · "¡Empieza aquí!" jumps to the next book after one
  star.** Fix: "Sigue aquí ▶ / Keep going" on the most recently played
  story while its Nivel 1 < 15★; "¡Empieza aquí!" only when nothing played.
- **NH-13 · H10 · Docs link goes to Conjuga's docs; no Cuentos how-to;
  Pistas means something different here.** Fix: Cuentos docs section
  (owner-gated per rule 5); meanwhile a context-specific Pistas
  description: "Muestra el cuento en Ordena y Mapa".
- **NH-14 · H8/H2 · Escucha options are full 6–9-word sentences at every
  level** (reading load highest in the listening task). Fix: bold the
  differing words / emoji cue at N1; distractors sharing the opening words
  at N3; or 🔊 per option. Scoring unchanged.
- **NH-15 · H8 · Palabras miss repeats the sentence three times.** Fix:
  miss feedback gives the meaning («duerme» = sleeps + 🔊), passage panel
  closed by default for Palabras.

## Severity 1 (cosmetic)

- **NH-16** Verdad statements in «guillemets» look like quotes from the
  story. Plain text with a 🤔 lead.
- **NH-17** Glossary bubble shows the lowercased key instead of the
  surface text ("Había una vez").
- **NH-18** Predictions are never revisited — add an unscored closing
  line "🔮 Tú dijiste: «…». ¿Pasó así?".
- **NH-19** Voiceless key-word chips look like buttons — flatten the
  static variant.
- **NH-20** Footer links are 17–21px tall at 360px — `min-height:44px`
  on `.site-footer a, .site-footer button` (shared footer).

## Works well (don't regress)

Evidence-based misses (📍 quote + highlighted sentence, carried into
"Para repasar"); glossary as real buttons with ≥44px hit area and phrase
matching; prediction stops; story-screen 1-2-3 structure and Lee's
all-activities action row; Ordena's gentle wrong-tap recovery and
first-try scoring; keyboard path (1/2/3, focus to Siguiente, Enter);
consistent bilingual chrome; the ⭐/🎧 split everywhere; print views
(reader with glossary, Informe table); dark mode; no horizontal overflow
at 360px; A1/A2-only credits.

## Verdict

Well structured; the read-with-support → answer-with-evidence loop is
executed with care. Land NH-1, NH-2, NH-5 before the owner sees it; NH-3,
NH-4, NH-7, NH-8 are localized and cheap. Teacher-station guidance
(NH-11, NH-13) is the main remaining gap for persona 2.
