# Cuentos — cognitive walkthrough (pre-owner-review, 2026-10-30)

Method: `cognitive-walkthrough` skill; real app driven in Chromium,
primary viewport 360×740 touch, secondary 900×900; voiceless and stubbed
es-MX voice. Personas: "Mateo" (8–9, 3rd-grade DLI, reads English at
grade level, ~300 Spanish words, no adult help) and "Ms. R" (DLI teacher,
3 minutes between classes). Q1–Q4 = will try / will notice / will connect
/ will see progress. Code at `5c06722`.

## Task outcomes (summary)

- **T1 start first story:** card + "¡Empieza aquí!" in first screen ✅;
  story screen puts 📖 Lee ~2 screens down; tapping a level re-renders and
  jumps to top (❌ Q4); nothing says "read first".
- **T2 glossary / audio / Nivel 2 prediction:** bubble works ✅ but word
  hit area is 31px, bubble covers the next line, arrow misaligned after
  edge clamp; per-paragraph 🔊/🐢 unlabeled, no playing indicator (the
  read-along highlights ✅); at the prediction stop nothing says the story
  continues, and the activity row below invites skipping; prediction is
  never revisited.
- **T3 Preguntas:** miss feedback is excellent (✗/✓, "Casi", 📍 quote,
  highlighted sentence, auto-scroll) ✅; results don't say how to earn the
  3rd star; "Otra vez" is primary and the next activity isn't labeled
  "next".
- **T4 Ordena (360):** tiles below the fold; a wrong tap only shakes 650ms
  (nothing under reduced motion) and the explanation sits at y=888 on a
  740px screen (❌ Q4); one wrong tap at N1 (4 events) = 1★ (flag: owner's
  denominator).
- **T5 Mapa (360):** slot labels Spanish-only, no intro line; choices at
  y≈700 every question; slot fills off-screen above after focus moves.
- **T6 Escucha (voice):** found (6th card) ✅; results show 🎧🎧🎧 but the
  words insignia/badge appear nowhere; home shows 0 stars after 5/5 with
  no explanation (❌ Q3).
- **T7 return tomorrow:** 🔁 Repasa hoy prominent and actionable ✅;
  unplayed activities never surfaced; "¡Empieza aquí!" moved to story 2;
  "riega lo aprendido" metaphor too hard.
- **T8 Ms. R:** print is strong (hidden paragraphs print, Nombre/Fecha,
  2-column glossary) ✅ but 🖨️ only at the bottom of the reader; Informe
  reachable from footer/☰ only; 🎧 column "0/3" looks like stars; Pistas
  toggle appears to do nothing (affects only Ordena/Mapa panel, next round).
- **T9 keyboard:** order and 1/2/3 keys ✅; choice focus ring weak (UA
  1px); results drop focus to body; N2–3 readers have 33+ glossary Tab
  stops before the games.

## Prioritized issues

- **CW-1 High** Ordena wrong-tap feedback invisible at 360 (shake only;
  text off-screen). Show feedback above the tile bank / sticky; keep the
  wrong tile marked (dashed red + ✗) until the next correct placement;
  copy "❌ Ese no va en el número 2. ¡Prueba otro! / Not #2 — try another!"
- **CW-2 High** Level tap jumps to top; Lee ~1400px down. Keep scroll /
  scroll to section 3, focus the selected card; make 📖 Lee visually
  primary with "👉 Empieza aquí: 📖 Lee el cuento / Start here: read".
- **CW-3 High** Badge track never named. Results subline "🎧 ¡Ganaste
  insignias de escucha! Son aparte de las estrellas ⭐ / You earned
  listening badges — separate from stars"; home total "🎧 x/45
  insignias"; "🎧 x/3" on level cards when voice available.
- **CW-4 Med** Prediction stop: add "👇 El cuento sigue después de tu
  respuesta / The story continues after you answer"; hide/disable the
  activity row until stops are answered (or label "Después de leer");
  echo "Tú dijiste: «…». ¿Tenías razón?" after the reveal.
- **CW-5 Med** Mapa at 360: compact 2×2 board or board after choices;
  English on labels (Characters · Setting · Problem · Solution); intro
  "Completa el mapa del cuento / Fill in the story map"; scroll the filled
  slot into view before Siguiente.
- **CW-6 Med** Results: next activity primary when ≥2★, labeled
  "Siguiente juego: … / Next game"; star hint "Para ★★★: ¡todas bien!"
- **CW-7 Med** Pistas needs a sub-label: "Muestra 📖 Ver el cuento en 🧩
  Ordena y 🗺️ Mapa / Shows the story during Order & Map".
- **CW-8 Med** "▶️ Sigue aquí / Keep going" card for the most recent
  story/level with unplayed activities.
- **CW-9 Med** Glossary word hit area ≥44px (padding + negative margin);
  bubble above the word when room; recompute arrow after clamp.
- **CW-10 Low** Per-paragraph 🔊/🐢 placement/label; highlight the
  paragraph while it plays.
- **CW-11 Low** 🖨️ Imprimir next to the level pills and on the story
  screen; alphabetical print glossary.
- **CW-12 Low** Informe 🎧 column rendered as "🎧 0/3" with header
  "🎧 Escucha (insignias)".
- **CW-13 Low** Keyboard: focus results h1 / next button; "Saltar a los
  juegos / Skip to games" link above the article; 3px brand focus ring on
  choices.
- **CW-14 Low** Story screen at 360: level cards as a compact row of 3.
- **CW-15 Low** Copy: "¡Repasa para no olvidar! / Review so you don't
  forget!" instead of the "riega" metaphor.
- **Flag (owner):** N1 Ordena has 4 events, so one wrong tap caps at 1★
  and the last placement is always free.

## Works well

Miss feedback in Preguntas/Verdad (model-quality); glossary + print;
🔁 Repasa hoy; audio gating holds in every context; consistent bilingual
chrome with "📖 Lee" crumbs from every round.

## Verdict

~80% of first-time 3rd graders would complete read → Preguntas → Verdad
alone and understand their stars; stalls at Ordena (phone), the story
screen's level jump, Nivel 2 prediction stops, and unexplained 🎧
badges. CW-1..CW-5 are small local copy/layout changes; with them, "no
adult needed" is realistic on phones and small tablets (the 900px layout
already avoids most scroll problems).

## Fixes applied (2026-10-30, uncommitted pass)

- **CW-1** done — Ordena feedback sits sticky directly above the tiles; wrong tile stays marked (dashed red + ✗ + SR text) until the next correct placement; "❌ Ese no va en el número N. ¡Prueba otro!".
- **CW-2** done — in-place level swap (scroll kept, focus on the card, announced); 📖 Lee card primary with "👉 Empieza aquí: lee el cuento" until read.
- **CW-3** done — Escucha results name the badge track; home "🎧 x/45 insignias"; level cards "🎧 x/3" when speakable.
- **CW-4** done — "👇 El cuento sigue…" under the options; action row locked "🔒 Después de leer" until all stops are answered; "🔮 Tú dijiste: «…». ¿Tenías razón?" echo.
- **CW-5** done — see NH-3; the filled slot scrolls into view before Siguiente.
- **CW-6** done — see NH-5.
- **CW-7** done — Pistas sub-label via the new defaulted `switchNotes` option in js/menu.js (Conjuga DOM unchanged).
- **CW-8** done — see NH-12.
- **CW-9** done — glossary hit area ≥44px (padding + negative margin); bubble above the word when there is room; arrow recomputed after clamping.
- **CW-10** done — paragraph highlighted while its 🔊/🐢 plays.
- **CW-11** done — 🖨️ beside the level pills; "🖨️ Imprimir este nivel" on the story screen; print glossary alphabetical.
- **CW-12** done — Informe "🎧 0/3" cells under "🎧 Escucha (insignias)".
- **CW-13** done — results h1 focused; "Saltar a los juegos" skip button; 3px brand focus ring on choices/tiles/crumbs/result buttons.
- **CW-14** done — compact 3-across level cards at ≤480px.
- **CW-15** done — "¡Repasa para no olvidar! / Review so you don't forget!".
- **Flag (N1 Ordena one miss = 1★)** left for the owner.
