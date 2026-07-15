# M18 gamification proposal · 2026-07-15 · claude/github-repo-context-status-q2u4i8

Owner-directed session (not a loop iteration): "be ambitious adding to our
GOAL.md for our next objective — more gamification," with a mandated process:
research → ideate → adversarially critique → iterate → pitch 1-3 ideas in a
rich docs/ artifact. Definition of done: a proposal doc of implementable
ideas; the winning idea gets GOAL.md implementation tasks after owner review.

## Process actually run

1. **Three parallel research briefs:** (a) learning-science evidence on
   gamification for ages 5-11 (meta-analyses, SDT, reward crowding-out,
   Duolingo/Prodigy/TYMTR/DreamBox pattern analysis); (b) codebase/brand
   constraints (MASCOT.md spec + pre-sanctioned nest idea, Prado tokens,
   storage grain `setId.tense.mode`, 47.9 KB of the 100 KB gzip budget used,
   clips manifest covers conjugated forms only); (c) vanilla-JS touch-game
   engineering (DOM+CSS+SVG over canvas, tap-tap over drag, anchored targets,
   reduced-motion-first, WebAudio oscillators, lazy import, js13k calibration).
2. **8 candidates** spanning weave-into-exercise / reward-game /
   meta-progression, deliberately including one spec-violating stress test.
3. **Three adversarial critics** (pedagogy, engineering, K-5 UX/a11y) issued
   per-candidate KILL/REFINE/KEEP verdicts. Notable: all three independently
   converged on the same hybrid (flight lands at the nest). Pedagogy vetoed
   Modo Rayo despite two KEEPs (streak in disguise); engineering exposed the
   garden's per-verb data fiction and the postcards' art-payload bomb; UX
   flagged the flight's moving-target taps (worst input for K-2 motor
   skills) and every perfection-gated reward's equity failure.
4. **Synthesis → 3 finalists** in `docs/games-proposal.html` (self-contained
   Prado-styled page, unlinked from app nav): Idea 1 El Vuelo al Nido
   (flight + living nest, one metaphor — recommended), Idea 2 Empareja con
   Chispa (S-size juice pass, ship-first), Idea 3 Las Postales de Lola
   (culture album, SME-gated). Kill list + salvage notes documented in-page.

## Key design commitments (all finalists)

Deterministic effort-earned rewards; informational surprise, never announced
contract; nothing decays; no streaks/leagues/timers; celebration access never
gates on perfection (flair scales); unscored celebration layers fully derived
from `best` — zero recordResult, zero new track, zero schema change; the
Prodigy test.

## GOAL.md

Queue line updated (M17 LIVE via release PR #76; M18 in PROPOSAL state — no
loop-workable item until the owner records PICK + AMEND). M18 stub milestone
added with blocking owner decisions and phases M18.1-M18.4. Non-goals section
deliberately NOT amended — the exact amendment text is proposed in the doc
and awaits the owner's signature.

## Validation

Docs-only change (no app code touched): `npm test` green pre-commit; e2e not
required (no UI surface changed). The proposal page follows the docs/ rules:
self-contained styling, relative links, light/dark via the conjuga.v1 theme
loader, stays unlinked from app navigation.

## For the next session/loop

Nothing is loop-workable until the owner records the PICK and AMEND decisions
in GOAL.md M18. On approval, M18.1 (Chispa) is a single S iteration and the
natural first PR.
