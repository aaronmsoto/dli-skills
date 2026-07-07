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

- [ ] **M2 — Sentence-context practice (CURRENT)**
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

## Non-goals (do not build)

Accounts, servers, dashboards, analytics, other languages (until M5 is done
and a human re-scopes), gamification beyond stars/streaks, external services.

## Definition of done (any milestone item)

`npm test` green · `npm run e2e` green with new UI surface covered by the
suite · docs in sync (SPEC/STANDARDS/about.html/README) · `journal/` entry
written · PR into `dev` with auto-merge enabled, per docs/LOOP.md.
