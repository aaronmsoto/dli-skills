# Cognitive walkthrough — Conjuga

**Date:** 2026-07-08 · **Facilitator:** loop agent (M10 A3).
Method: for every step of every task, the four questions — (Q1) will the
user form the right goal? (Q2) is the correct action findable? (Q3) will
they connect the action to their goal (affordance/signifier)? (Q4) after
acting, is progress visible? Ratings ✅ / ⚠️ / ❌ per step.

## Personas

- **P1 "A2-like"**: DLI 3rd grader on a shared tablet; emerging reader,
  taps big things first, gives up fast on walls of text.
- **P2 "A1-like"**: DLI K-5 graduate on a phone; fluent app user, skims,
  wants the game part quickly.
- **P3 Parent**: phone, evening; wants "is my kid progressing?" in
  under a minute; Spanish comprehension varies.
- **P4 Teacher**: laptop + printer; wants study sheets and a progress
  paper for a folder; will read exactly one screen of instructions.

## Task 1 — First visit → finish a first Elige round (P1, P2)

| Step | Q1 | Q2 | Q3 | Q4 | Notes |
|---|---|---|---|---|---|
| Land on home, choose a group | ⚠️ | ✅ | ⚠️ | ✅ | 20 identical cards; P1 hesitates. Grupo 1 is correct but unsignified (**CW-1** = NN-3/DN-1) |
| Pick a tense | ✅ | ✅ | ✅ | ✅ | icon + cue word + example sentence carry meaning for P1 |
| Estudia first? | ✅ | ✅ | ✅ | ✅ | study card is first in the row; ladder order reads naturally |
| Start ✅ Elige, answer 10 | ✅ | ✅ | ✅ | ✅ | progress bar + Lola position; wrong answers self-explain; P1 can tap 🔍 Pista |
| Understand results | ✅ | ✅ | ✅ | ✅ | stars + plain-language tiers + "otra vez / next mode" |

**Success likelihood:** P2 ~100%; P1 high (one hesitation at step 1).

## Task 2 — Find and play 🎧 Escucha (P2, voiced phone)

| Step | Q1 | Q2 | Q3 | Q4 | Notes |
|---|---|---|---|---|---|
| Know listening exists | ✅ | ✅ | ✅ | — | 🎧 card sits in the activity row; also linked from Estudia |
| Play by ear, replay/slow | ✅ | ✅ | ✅ | ✅ | 🔊/🐢 buttons; unlimited replays; mute-independent by design |
| Read badges vs stars | ✅ | ⚠️ | ✅ | ✅ | **CW-2 (low)**: 🎧 n/9 vs ⭐ n/30 distinction is learnable but unexplained in-app; ℹ️ panel (M9) now covers it — verify wording reaches kids |

**Success:** high. On voiceless devices the mode is invisible by design
(accepted tradeoff, documented in the /docs hub).

## Task 3 — Parent checks progress (P3)

| Step | Q1 | Q2 | Q3 | Q4 | Notes |
|---|---|---|---|---|---|
| Open app on kid's device | ✅ | ✅ | ✅ | ✅ | home cards show ⭐/🎧 per group at a glance |
| Deeper look | ✅ | ✅ | ✅ | ✅ | 📄 Informe linked in the footer of every screen (M9 helped: footer is everywhere) |
| Trust/privacy question | ✅ | ✅ | ✅ | ✅ | footer credits + standards links + about.html; "no login, no data" stated on informe |

**Success:** ~100%; M9 measurably improved this task.

## Task 4 — Teacher prints a study sheet + progress report (P4)

| Step | Q1 | Q2 | Q3 | Q4 | Notes |
|---|---|---|---|---|---|
| Reach a study table | ✅ | ✅ | ✅ | ✅ | |
| Print it | ✅ | ✅ | ✅ | ✅ | 🖨️ button; M5 header (Grupo/Nombre/Fecha) makes the artifact classroom-ready |
| Print the informe | ✅ | ✅ | ✅ | ✅ | fill-lines + star legend + no-chrome print layout |

**Success:** ~100% after M5.

## Task 5 (adversarial) — P1 fidgets with footer toggles mid-round

| Step | Q1 | Q2 | Q3 | Q4 | Notes |
|---|---|---|---|---|---|
| Tap "🔍 Pistas" checkbox at question 7 | ⚠️ | ✅ | ❌ | ❌ | Round silently restarts; P1's progress gone; no explanation (**CW-3** = NN-1/DN-4, the sprint's top interaction finding) |

## Failure-point summary

| ID | Severity | Same as | Status |
|---|---|---|---|
| CW-1 first-visit start cue | medium | NN-3/DN-1 | DECISION PENDING |
| CW-2 badge-vs-star wording reach | low | — | covered by ℹ️ panels; monitor |
| CW-3 mid-round toggle restart | high | NN-1/DN-4 | DECISION PENDING |

---

## Round 2 (2026-07-10) — Prado redesign

**Date:** 2026-07-10 · **Facilitator:** loop agent (M17 A3′). Re-run of the
five Round 1 tasks against the now-default "Prado" visual layer. Redesign is
**visual-only** — routes, DOM, and every flow unchanged (verified in
`js/app.js`). Round 1's CW-1 (first-visit cue) and CW-3 (mid-round toggle
restart) fixed in M10 and re-verified here. New surface: the ☰-menu theme
selector. Same four personas + four questions.

### Task 1 — First visit → finish a first Elige round (P1, P2)

| Step | Q1 | Q2 | Q3 | Q4 | Notes |
|---|---|---|---|---|---|
| Land on home, choose a group | ✅ | ✅ | ✅ | ✅ | **CW-1 resolved**: terracotta ¡Empieza aquí! ribbon is the only saturated element on a grid of white cards — reads as the entry point. |
| Pick a tense | ✅ | ✅ | ✅ | ✅ | **Improved**: Presente ships pre-selected with a green fill + ring — a far stronger selected-state signifier than Round 1's flat card. |
| Estudia first? | ✅ | ✅ | ⚠️ | ✅ | Numbered sections carry the ladder, but the six activity tiles are now visually uniform (**CW-5**, low: flattening slightly weakens the recognition-before-production signpost). |
| Start ✅ Elige, answer 10 | ✅ | ✅ | ✅ | ✅ | prompt card + tense chip + progress bar + Lola all clear; 🔍 Pista visible; ℹ️ at the prompt-card corner. |
| Understand results | ✅ | ✅ | ✅ | ✅ | flow unchanged; stars + plain-language tiers intact. |

**Success:** P2 ~100%; P1 high — the redesign made step 1 *easier* than Round 1.

### Task 2 — Find and play 🎧 Escucha (P2)

| Step | Q1 | Q2 | Q3 | Q4 | Notes |
|---|---|---|---|---|---|
| Know listening exists | ✅ | ✅ | ✅ | — | 🎧 tile in the activity grid + Estudia action row. |
| Play by ear, replay/slow | ✅ | ✅ | ✅ | ✅ | unchanged; unlimited 🔊/🐢, mute-independent. |
| Read badges vs stars | ✅ | ⚠️ | ✅ | ✅ | **CW-2 unchanged (low)**: 🎧 n/9 vs ⭐ n/30 still learnable-but-unexplained; ℹ️ panel covers it. |

### Task 3 — Parent checks progress (P3)

| Step | Q1 | Q2 | Q3 | Q4 | Notes |
|---|---|---|---|---|---|
| Open app | ✅ | ✅ | ✅ | ✅ | home cards show ⭐/🎧; Prado spacing aids scanning. |
| Deeper look (Informe) | ✅ | ✅ | ✅ | ✅ | 📄 Informe in every footer; the redesigned table (icon heads, zebra rows) is more legible. |
| Set light/dark theme | ✅ | ⚠️ | ⚠️ | ✅ | **CW-4 (new, low)**: theme + sound live behind the icon-only ☰ (unlabeled); a parent must guess it holds settings. Once open, the Auto/Light/Dark control is clear, `aria-pressed`-correct, and (post-fix) has a brand active border + 44px targets. Light-default means most parents never need it. |
| Trust/privacy | ✅ | ✅ | ✅ | ✅ | footer credits + standards + about; "no login, no data" intact. |

### Task 4 — Teacher prints (P4)

| Step | Q1 | Q2 | Q3 | Q4 | Notes |
|---|---|---|---|---|---|
| Reach a study table | ✅ | ✅ | ✅ | ✅ | redesign keeps the M5 Grupo/Nombre/Fecha header. |
| Print study sheet | ✅ | ✅ | ✅ | ✅ | 🖨️ is a white outline pill in the dark-green action row — de-emphasized but clearly labeled. |
| Print the informe | ✅ | ✅ | ✅ | ✅ | fill-lines + star legend + `.no-print` chrome survive. |

### Task 5 (adversarial) — mid-round toggle

| Step | Q1 | Q2 | Q3 | Q4 | Notes |
|---|---|---|---|---|---|
| Tap 🔍 Pistas at question 7 | ✅ | ✅ | ✅ | ✅ | **CW-3 resolved & re-verified**: setting saves without re-render (no restart) + a `role="status"` "✓ Guardado — se aplica al continuar" confirmation. Progress preserved; Prado de-emphasizes the footer, making the accidental tap even less likely. |

### Failure-point summary (Round 2)

| ID | Severity | Same as | Status |
|---|---|---|---|
| CW-1 first-visit start cue | — | NN-3/DN-1 | RESOLVED (ribbon; Prado makes it the sole saturated element) |
| CW-2 badge-vs-star wording | low | — | Unchanged; ℹ️ panels; monitor |
| CW-3 mid-round toggle restart | — | NN-1/DN-4 | RESOLVED & re-verified |
| CW-4 theme/sound behind unlabeled ☰ | low | NN-7/DN-2 | NEW — owner watch (Light default lowers urgency) |
| CW-5 activity tiles equal weight | low | — | NEW — owner watch (numbered sections mitigate) |
| CW-6 "0/600 estrellas" pill false affordance | low | DN-2 | NEW — owner watch (static pill reads tappable to P1) |

**Net:** Prado is a usability *gain* for the critical first-visit task,
strengthening the two Round 1 concerns most tied to visual hierarchy (CW-1
start cue, tense-selection affordance) with no new blockers. All three new
findings are low-severity signifier/discoverability polish; success
likelihoods are equal-to-better than Round 1 across all four personas.
