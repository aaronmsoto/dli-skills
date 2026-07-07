# GOAL.md — north star and current milestone

This file is the **single source of work** for loop-based development
(see docs/LOOP.md). Loops derive their next step from the CURRENT milestone's
acceptance criteria and must not invent goals beyond this file. Humans edit
this file to redirect the loop; agents only check items off via PRs.

## Vision

A world-class, free, no-login skills builder for K-5 Spanish Dual Language
Immersion learners — starting with verb conjugation (100 most common verbs,
5 at a time, present/preterite/imperfect) and growing toward the skills that
bridge NJSLS-WL Novice levels to story retelling (7.1.NH.PRSNT.4). Pedagogy
is grounded in NBPTS ECYA-WL and the 2020 NJSLS-WL (docs/STANDARDS.md).

## Product invariants (violating these fails review — see CLAUDE.md)

1. Linguistic accuracy is test-gated; RAE tables are the reference.
2. Static site: no build step, no dependencies, no server, no login,
   no analytics. Progress lives only in localStorage.
3. Novice-first, non-punitive pedagogy; bilingual (Spanish-first) UI.
4. K-5 accessibility: big targets, dark mode, reduced motion, ARIA live.
5. Production = `main` = the live GitHub Pages site. Only a human merge
   deploys.

## Milestones

- [x] **M0 — Core trainer (v0.1)** · shipped 2026-07-07
  Engine + 100 verbs + Estudia/Elige/Escribe/Empareja + stars + Pages deploy.
- [x] **M1 — Audio, contrast, review, printables (v0.2)** · shipped 2026-07-07
  Web Speech TTS + ⚔️ ¿Pretérito o imperfecto? + 🔁 Repasa hoy + 🖨️ informe.

- [ ] **M2 — Sentence-context practice (ON HOLD — awaiting SME input on the
  sentence bank; loops must NOT work on this until the hold is lifted here)**
  Replace bare-paradigm prompts with real, kid-appropriate sentences.
  Acceptance criteria:
  - [ ] `js/sentences.js`: hand-written cloze sentences for **groups 1-4**
        (minimum), ≥2 sentences per verb per tense, each with the target
        person, a natural time framing for past tenses, and an English gloss.
        K-5 appropriate vocabulary only.
  - [ ] Data-integrity tests: every sentence references a valid verb/person/
        tense; the blank's answer equals the engine's conjugation; no sentence
        used for preterite/imperfect is compatible with both (a native-speaker
        review note in the PR is required for the sentence bank).
  - [ ] Elige and Escribe use sentence prompts when a sentence exists for the
        sampled (verb, person, tense); fall back to the current prompt style
        otherwise.
  - [ ] The ⚔️ contrast mode uses sentences instead of bare cue words for
        groups that have them.
  - [ ] Docs updated (SPEC 4.x, STANDARDS mapping to 7.1.NH.PRSNT.4) and
        remaining groups tracked here as follow-up items.
- [ ] **M3 — Listening mode (Escucha)**
  TTS speaks a form; learner picks (Elige-style) or types (Escribe-style)
  what they heard. Hidden entirely on devices without a Spanish voice.
  Counts toward stars as a fourth mode only where TTS is available (star
  math must not penalize voiceless devices).
- [ ] **M4 — Near-future & progressive**
  `ir a + infinitive` and present progressive (gerund generation with
  irregular gerunds: leyendo, oyendo, diciendo, pidiendo, viniendo, …),
  same test rigor as existing tenses; UI framing "muy pronto ⏭️ / ahora
  mismo 🔄".
- [ ] **M5 — Polish pass**
  Accessibility audit (keyboard-only full playthrough, screen-reader labels,
  contrast check), performance budget check (<100 KB), copy review by a
  bilingual educator, printable study-sheet layout tune-up.
- [ ] **M6 — Mascot epic: make the owl a fun, integrated companion (CURRENT)**
  Turn the placeholder 🦉 into a real character woven through the
  experience, applying the JiJi (ST Math) design principles documented in
  docs/MASCOT.md — character-as-feedback, forward-motion-as-progress,
  informative-never-punitive failure, silence, neutrality, "helping the
  character" framing — under our constraints: static/no-deps (inline SVG +
  CSS only, ≤15 KB), mobile-first (360px-first, never covering controls),
  a11y (decorative `aria-hidden`, full `prefers-reduced-motion` fallback,
  dark mode), and zero impact on pedagogy or TTS (the owl is silent; speech
  stays reserved for Spanish forms).
  Acceptance criteria, in order:
  - [x] **R (research):** extend docs/MASCOT.md with 2-3 more comparable
        mascots (e.g., Duolingo's Duo — including what to AVOID: nagging,
        streak guilt), and a short motion/a11y note for K-5 attention.
        No product code in this iteration.
  - [x] **D (design):** design brief in docs/MASCOT.md — name is DECIDED
        by the owner (2026-07-07): **Lola la Lechuza**. SVG art direction
        with pose sketches (idle, correct-hop, curious-miss, celebrate
        with head spin — owl-realistic ~270° tilt-turns for small moments,
        one playful full spin reserved for 3-star celebrations — and
        sleeping), per-screen placement map, animation timing spec
        (~600ms, subtle), dark-mode palette. Owner has waived the design
        gate (2026-07-07): the brief auto-merges like any iteration and
        implementation proceeds immediately after.
  - [x] **I1 (implementation):** mascot component (inline SVG + CSS states,
        no JS animation libs) on home + results screens; helping-frame copy
        ("Ayuda a <name>…"); reduced-motion + dark-mode verified.
  - [x] **I2 (implementation):** in-game integration — owl travels the
        round's progress path; reacts to correct (hop forward) and
        incorrect (curious tilt, never negative); 3-star celebration.
  - [ ] **V (validation):** e2e coverage — mascot states assert on
        correct/incorrect/completion; reduced-motion emulation shows static
        poses; mobile (360×640) and dark-mode screenshots; payload check
        stays < 100 KB total.
  - [ ] **RT (regression):** full unit + e2e suites green with zero
        weakened assertions; answer-flow timing unchanged (existing e2e
        timings still pass); localStorage schema untouched; print styles
        unaffected (mascot hidden in print).

## Non-goals (do not build)

Accounts, servers, dashboards, analytics, other languages (until M5 is done
and a human re-scopes), external services, and economy-style gamification
(coins, shops, loot, competitive leaderboards). The mascot companion (M6) is
explicitly IN scope; stars/streaks remain the only scorekeeping.

## Definition of done (any milestone item)

`npm test` green · `npm run e2e` green with new UI surface covered by the
suite · docs in sync (SPEC/STANDARDS/about.html/README) · `journal/` entry
written · PR into `dev` with auto-merge enabled, per docs/LOOP.md.
