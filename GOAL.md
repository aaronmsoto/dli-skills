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
- [x] **M3 — Listening mode (🎧 Escucha)** · complete on dev 2026-07-07 (recognition v1; typed variant deferred with SME)
  Owner decisions (2026-07-07): **recognition-only v1** (typed variant
  deferred until after SME input) and **badges, not stars** — listening
  earns a parallel 🎧 track (same 60/80/100% tiers) that is NEVER counted
  in the star totals, so devices without a Spanish voice are not penalized.
  Acceptance criteria:
  - [x] 🎧 Escucha card per group × tense, shown ONLY when a Spanish TTS
        voice exists; direct routes redirect to the group screen otherwise.
  - [x] Round of 10: TTS speaks the target form (no text shown beyond the
        infinitive + gloss); learner picks from 4 written options
        (existing distractor engine: person endings + tense/stress
        contrasts). Unlimited 🔊 replay + 🐢 slow replay (non-punitive).
        Listening prompts bypass the mute setting (entering Escucha is
        explicit audio intent).
  - [x] Badges recorded under `<set>.<tense>.listen`, displayed on the
        group screen, home cards (🎧 n/9), results, review queue, and a
        report column — excluded from every star total/denominator.
  - [x] E2e via the stubbed-voice pattern: spoken text equals the target,
        options never reveal it in the prompt, slow replay uses a lower
        rate, mode hidden + route guarded without a voice; suites green.
  - Deferred (not blocking M3): typed Escucha variant — revisit with SME.
- [ ] **M4 — Near-future & progressive**
  `ir a + infinitive` and present progressive (gerund generation with
  irregular gerunds: leyendo, oyendo, diciendo, pidiendo, viniendo, …),
  same test rigor as existing tenses; UI framing "muy pronto ⏭️ / ahora
  mismo 🔄".
- [ ] **M5 — Polish pass**
  Accessibility audit (keyboard-only full playthrough, screen-reader labels,
  contrast check), performance budget check (<100 KB), copy review by a
  bilingual educator, printable study-sheet layout tune-up.
- [x] **M6 — Mascot epic: Lola la Lechuza (complete on dev 2026-07-07; ships with the next release merge)**
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
  - [x] **V (validation):** e2e coverage — mascot states assert on
        correct/incorrect/completion; reduced-motion emulation shows static
        poses; mobile (360×640) and dark-mode screenshots; payload check
        stays < 100 KB total.
  - [x] **RT (regression):** full unit + e2e suites green with zero
        weakened assertions; answer-flow timing unchanged (existing e2e
        timings still pass); localStorage schema untouched; print styles
        unaffected (mascot hidden in print).

- [x] **M7 — 🔍 Pistas (hint mode)** · complete on dev 2026-07-07 · from direct K-5 user
  feedback (owner's kids, 2026-07-07): on quiz pages they want a hint icon
  that reveals the Estudia chart column for the verb being conjugated.
  Acceptance criteria:
  - [x] A 🔍 hint button on the prompt card in **Elige, Escribe, and the
        ⚔️ Contrast challenge**. Tapping it opens a mini study panel: the
        current verb's column (persons → forms) for the current tense,
        matching the Estudia table exactly (engine-generated, vosotros
        filtered per setting). Contrast shows BOTH past-tense columns so
        the tense decision remains the learner's task. The panel resets
        (closes) when the question advances.
  - [x] **Not** in Empareja (whole board already visible) or 🎧 Escucha
        (a visible column would undermine the listening task) — record
        this scoping in SPEC.
  - [x] **No scoring penalty for using hints** (non-punitive ethos;
        NBPTS Std IV scaffolding — the learner still maps the person to
        the row). Teachers/parents who disagree can turn hints off.
  - [x] **Lola pose:** new `is-hint` state — Lola holds a magnifying glass
        to her eye while the hint panel is open (SVG lens group added to
        js/mascot.js per docs/MASCOT.md; static under reduced motion;
        budget test still green). Pose ends when the panel closes.
  - [x] **Footer checkbox "🔍 Pistas / Hints", default CHECKED**, stored in
        settings (backward-compatible default). Unchecked → hint buttons
        render nowhere.
  - [x] E2e: hint visible by default and shows the engine-correct column;
        Lola enters/leaves `is-hint`; panel resets on advance; contrast
        shows two columns; footer toggle hides hints; mobile 360px layout
        clean; full regression green.
  - [x] **Estudia links to every current activity** (owner add-on,
        2026-07-07): the study screen's action buttons must include ALL
        quiz options for that group — the three games, 🎧 Escucha when a
        voice exists, and the ⚔️ Contrast challenge when the tense is a
        past tense — with e2e coverage.

## Non-goals (do not build)


Accounts, servers, dashboards, analytics, other languages (until M5 is done
and a human re-scopes), external services, and economy-style gamification
(coins, shops, loot, competitive leaderboards). The mascot companion (M6) is
explicitly IN scope; stars/streaks remain the only scorekeeping.

## Definition of done (any milestone item)

`npm test` green · `npm run e2e` green with new UI surface covered by the
suite · docs in sync (SPEC/STANDARDS/about.html/README) · `journal/` entry
written · PR into `dev` with auto-merge enabled, per docs/LOOP.md.
