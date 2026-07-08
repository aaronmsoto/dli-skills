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
