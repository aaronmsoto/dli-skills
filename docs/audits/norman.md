# UX principles audit (Don Norman) — Conjuga

**Date:** 2026-07-08 · **Auditor:** loop agent (M10 A1) · severity:
catastrophic / high / medium / low. Evidence cites concrete UI.

## 1. Discoverability — **medium gap**
What can I do here? Group → tense → activity ladder is walkable in one
glance, and M9's ℹ️ buttons now expose the *why*. Gap (DN-1, medium =
NN-3): the 20-card home wall gives a first-time learner no starting
signifier. Recommendations: (a) "¡Empieza aquí!" cue on the first
unstarted group; (b) keep 🔁 Repasa hoy as the returning-user entry
(already good). DECISION PENDING (design change).

## 2. Feedback — **strength**
Every action answers within ~100ms: correct → praise + spoken form +
Lola hop; wrong → correction + curious owl, never negative; Práctica
placement fills the cell it names. ARIA live region mirrors all of it
non-visually. Keep.

## 3. Conceptual model — **strength**
The conjugation TABLE is the model everywhere: Estudia shows it, Pistas
reveals one column of it, Práctica rebuilds it, Empareja scatters and
re-pairs it. Learners manipulate one consistent object. This is the
app's best design property — protect it in future features.

## 4. Affordances — **strength, one gap**
Everything tappable is a real button/link with card affordance; bank
tiles look pickable, empty slots look fillable (dashed outline). Gap
(DN-2, low): `.cell-speak` table forms afford tapping only via the
"👆🔊 Toca una forma" hint line — acceptable, hint is always present.

## 5. Signifiers — **medium gap fixed in-wave**
Icons uniquely signify activities (🧱/🧩 collision was caught and fixed
in M8). kbd chips signify shortcuts. Fixed in wave: per-route page
titles (browser-level signifier, DN-3 = WCAG-3). Remaining (DN-4,
medium = NN-1): footer toggles on game screens don't signify their
blast radius (round restart). DECISION PENDING.

## 6. Mapping — **strength**
Rows are persons in a fixed 0-5 order app-wide; columns are verbs in
frequency order; Lola's leftward-to-nest motion maps to round progress;
star tiers map to fixed percentages stated on the results screen and
informe. Natural mappings all.

## 7. Constraints — **strength**
Answered options disable; matched cards lock; Práctica accepts only the
active column; vosotros row is filtered (not deleted) per setting;
Escucha is impossible to enter voiceless (route guard). Errors are
prevented structurally, not policed.

## Prioritized list

1. DN-4/NN-1 footer-toggle round restart (medium, decision pending)
2. DN-1/NN-3 first-visit start cue (medium, decision pending)
3. DN-3/WCAG-3 per-route titles (fixed in wave)
4. DN-2 cell-speak affordance (low, accepted with hint line)

**Overall:** strong feedback/model/mapping/constraints; the open work is
session-state awareness in global chrome. Score: 6/7 principles at
"strength" or better after the fix wave.
