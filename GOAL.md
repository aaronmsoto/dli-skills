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

**Queue (owner-set, 2026-07-07): M9 (CURRENT) → M10.**
M5's loop items done 2026-07-08 (SME copy review still open); M8 shipped
to dev 2026-07-07. M2 stays on hold (SME input); M4 is paused
indefinitely. Loops work the
queue in this order regardless of milestone numbering below.

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
- [ ] **M4 — Near-future & progressive (PAUSED indefinitely — owner
  decision 2026-07-07; loops must NOT work on this until the owner
  reactivates it here)**
  `ir a + infinitive` and present progressive (gerund generation with
  irregular gerunds: leyendo, oyendo, diciendo, pidiendo, viniendo, …),
  same test rigor as existing tenses; UI framing "muy pronto ⏭️ / ahora
  mismo 🔄".
- [ ] **M5 — Polish pass (reduced 2026-07-07: accessibility-audit items
  moved into M10's formal WCAG/heuristic work — only what M10 does NOT
  cover remains here; loop items complete 2026-07-08, awaiting SME item)**
  - [x] Performance budget check: <120 KB raw (raised from 100 KB by owner
        decision 2026-07-07; further raises are owner-only), enforced by
        tests/payload.test.mjs on every CI run.
  - [x] Printable study-sheet layout tune-up (2026-07-08): print-only
        Grupo/Nombre/Fecha header on study sheets, @page margins,
        repeating table heads, row break-inside protection, denser
        report typography in print — with e2e print-emulation coverage.
  - [ ] Copy review by a bilingual educator (human SME — NOT loop work;
        loops skip this item and treat M5 as passed for queue purposes).
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
        stays under the payload budget (100 KB then; 120 KB since 2026-07-07).
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

- [x] **M8 — 🧱 Práctica (rebuild the table)** · complete on dev 2026-07-07
  (icon is 🧱, not 🧩 — Empareja already owns 🧩 and icons stay distinct)
  Source — direct feedback from a recent K-5 DLI graduate (owner's family,
  2026-07-07): her favorite classroom activity was per-word matching of
  tenses — teacher provides the root word and the conjugated forms as
  options, students match each form to its person, rebuilding the paradigm
  inside the familiar table shape.
  **Owner decision (2026-07-07): Option 2 shape (a new activity following
  the Estudia table), named "🧱 Práctica", and UNSCORED — no stars, no
  badges, no result recording or attribution of any kind.** It is a
  pressure-free, practice-based extension of the Estudia interface — a
  bridging activity between passive study and the scored quizzes
  (Estudia → Práctica → Elige → Escribe → Empareja), active recall with
  the chart's visual scaffold intact (NBPTS Std IV scaffolding;
  recognition-before-production ladder preserved).
  Acceptance criteria:
  - [x] **Interaction:** the Estudia-style table for the group's 5 verbs ×
        current tense, with the active verb's column EMPTY; that verb's
        forms appear shuffled in a bank of big (≥44px) tap targets. The
        learner taps a form, then taps its person row (tap-tap matching —
        touch-first, fully keyboard-operable). Correct placement fills the
        cell; incorrect gets a gentle corrective cue and the form returns
        for retry — the activity cannot be failed. Work proceeds word by
        word, column by column: when a column completes, the next verb's
        column empties and its bank appears, through all 5 verbs, ending
        in a completion celebration.
  - [x] **Vocalization per standard rules:** correct placement speaks the
        form with its person (`sayForm`) when a Spanish voice exists;
        placed cells are tap-to-hear like the Estudia table; every audio
        affordance hides when `ttsAvailable()` is false (the activity
        itself works voiceless); the sound setting is respected.
  - [x] **Identical forms are interchangeable:** where two persons share a
        form (imperfect yo/él·ella·Ud. always; some preterites), placing
        the duplicate tile on either matching row is correct.
  - [x] **Unscored, truly:** no writes to stars or badges, no
        `recordResult`, STARS_PER_SET unchanged (30), informe and review
        queue unaffected. The set screen and study screen present Práctica
        with no star/badge affordance.
  - [x] **Entry points:** the study screen's action list presents
        🧱 Práctica FIRST (before Elige), per the standing rule that
        Estudia links every activity; the group screen offers it per
        tense without scoring UI.
  - [x] **Scoping:** vosotros filtered per setting (never removed from
        data); NO 🔍 hint button (the activity IS the chart — record in
        SPEC); Lola per docs/MASCOT.md (hop on placement, curious on
        miss, celebration on table completion).
  - [x] **Validation:** unit tests for any new sampling/shuffle helper
        (incl. the duplicate-form rule); e2e for the full flow — empty
        column + bank render, correct placement fills + speaks person-
        prefixed form, wrong placement corrects non-punitively, column
        advance, full completion, voiceless variant, and a localStorage
        assertion that NOTHING was recorded; docs in sync (SPEC,
        STANDARDS if pedagogy-affecting, README/about as needed); full
        regression green.

- [ ] **M9 — 🪟 Transparency & attribution epic**
  Make the app's standards grounding visible IN the product, and give every
  page the same footer, credits, and a per-page "why this page" explainer.
  Owner decisions (2026-07-07): footer links to the two standards documents
  we actually cite — **NBPTS ECYA-WL and the 2020 NJSLS-WL**; info panels
  are **bilingual, adult-focused** (one short Spanish-first line a learner
  can read, then concise English standards mapping with citations).
  Acceptance criteria, in order:
  - [ ] **F1 (footer everywhere):** `renderFooter()` becomes a shared
        component rendered on EVERY screen (home, group, Estudia, Elige,
        Escribe, Empareja, 🎧 Escucha, ⚔️ Contrast, informe) — today it
        renders only on home. Same toggles/links everywhere; footer keeps
        `.no-print`.
  - [ ] **F2 (standards links):** the footer links to the official NBPTS
        ECYA-WL standards document and the official 2020 NJSLS-WL document
        (external links, `rel="noopener"`); about.html and docs/STANDARDS.md
        use the same canonical URLs.
  - [ ] **F3 (credits):** two lines at the bottom of the footer, exactly:
        `Created by Lucia Perales, EdD (wife/mother/educator) and Aaron
        Soto, MHCID (husband/father/technologist)` `<br />` `DLI K-5
        Graduate “A1” (daughter/consultant) and DLI 3rd Grader “A2”
        (son/consultant)`. Kids appear ONLY as the pseudonyms A1/A2 —
        never add real names (privacy invariant).
  - [ ] **I1 (info panels):** an ℹ️ info icon on every screen opens an
        accessible pop-up/slide-out panel explaining how THAT page supports
        the standards: which NBPTS ECYA-WL standard(s) and NJSLS-WL
        indicator(s) the activity serves and how (e.g., Elige →
        interpretive recognition 7.1.NL.IPRET; Escribe → presentational
        production; ⚔️ Contrast → NH-level tense discrimination).
        Dialog semantics: focus moves in on open and returns on close,
        Esc + explicit close button, ≥44px targets, dark mode, static
        under reduced motion, hidden in print.
  - [ ] **I2 (single source of truth):** panel copy lives in one data
        module (e.g., `js/standards-info.js`) keyed by screen; a unit test
        asserts every screen key has an entry with citations. The same
        mapping is added to docs/STANDARDS.md as a per-screen table and
        summarized on about.html — repo docs and in-app panels must not
        drift (mirror the mapping, cite the module).
  - [ ] **V/RT:** e2e — footer (toggles, standards links, credits) present
        on every route; info panel opens/closes on every screen with
        correct per-screen citations; payload budget test still green
        (keep panel copy lean); full unit + e2e regression, zero weakened
        assertions.
- [ ] **M10 — 🔬 Usability & accessibility sprint (runs AFTER M9 so the new
  footer/panels are inside the audit scope)**
  Four formal evaluations, evidence-first fixes, and public reporting.
  Owner decisions (2026-07-07): loops **auto-fix WCAG Critical/Serious
  findings, Nielsen severity-3/4 violations, and low-risk quick wins**;
  any finding that would change visual design or pedagogy is appended to
  this milestone as a decision-pending task for owner triage (M8 pattern).
  /docs is BUILT this sprint, not just planned. New pages stay UNLINKED
  from app navigation until the owner links them.
  Note: M5 was reduced on 2026-07-07 — its accessibility-audit items now
  live here; M5 keeps only what M10 does not cover.
  Acceptance criteria, in order:
  - [ ] **A1 (UX principles audit):** Don-Norman-principles audit
        (discoverability, affordances, signifiers, feedback, mapping,
        constraints, conceptual model) across all screens per the
        methodology in mastepanoski/claude-skills
        `don-norman-principles-audit` — catastrophic/high/medium/low
        severities, per-principle evidence, 1-3 recommendations each,
        prioritized list + overall score. Report: `docs/audits/norman.md`.
  - [ ] **A2 (heuristic evaluation):** Nielsen 10-heuristics audit per
        `nielsen-heuristics-audit` — 0-4 severity scale, violations with
        exact locations and affected tasks, cross-heuristic patterns,
        quick wins, positive highlights. Report: `docs/audits/nielsen.md`.
  - [ ] **A3 (cognitive walkthrough):** per `cognitive-walkthrough` — the
        four questions (right goal? action findable? affordance clear?
        progress visible?) applied step-by-step to ≥4 defined tasks with
        defined personas: a DLI 3rd grader on a tablet (novice, emerging
        reader), a DLI K-5 graduate on a phone, a parent checking
        progress, a teacher printing study sheets. Tasks must include
        first-visit → finish first Elige round, find and play 🎧 Escucha,
        use 🔍 Pistas, and print the informe. Per-step ✅/⚠️/❌ ratings,
        failure points, success-likelihood table.
        Report: `docs/audits/walkthrough.md`.
  - [ ] **A4 (WCAG audit):** WCAG **2.2 Level AA** audit per
        `wcag-accessibility-audit` — automated pass (axe-core run
        dev-only through the existing Playwright harness; NEVER an app
        dependency) plus manual passes: full keyboard-only playthrough,
        200% zoom and 320px-width reflow, focus order/visibility, ARIA
        validity, contrast (light AND dark), reduced-motion. Findings
        organized by POUR with success-criterion citations and
        Critical/Serious/Moderate/Minor severities.
        Report: `docs/audits/wcag.md`.
  - [ ] **F (fix wave):** per the autonomy decision above — auto-fix the
        mandated tiers with tests per fix; each fix cites its finding ID;
        design/pedagogy-changing findings appended here as decision-pending
        tasks with the auditor's recommendation. No fix may weaken an
        existing test.
  - [ ] **P (usability report — part of /docs, owner decision
        2026-07-07):** `docs/usability.html` — the "Usability &
        Accessibility" page lives INSIDE the public /docs section (not a
        root page): methodology overview of all four evaluations, scores,
        findings summary, fixed-vs-open status, date of audit. Content
        mirrors docs/audits (no drift); bilingual header, English body;
        linked from the /docs hub, UNLINKED from app nav.
  - [ ] **D (public docs hub):** `docs/index.html` — the repo's `docs/`
        directory already deploys with Pages, so `/docs/` becomes a real
        public route. Three sections: **how to use the app** (learners /
        parents / teachers, incl. offline-ish behavior, localStorage
        privacy, voice availability), **how it supports DLI standards**
        (per-screen mapping, links to the two standards documents), and
        **usability & accessibility adherence** (links docs/usability.html
        + the four audit reports). Relative URLs only; unlinked from app
        nav until the owner links it.
  - [ ] **V/RT:** e2e coverage for docs/usability.html and docs/index.html
        (load, key content, relative links resolve); axe-core automated
        pass wired as a CI-friendly check with zero Critical/Serious
        remaining; full regression green.

## Non-goals (do not build)


Accounts, servers, dashboards, analytics, other languages (until M5 is done
and a human re-scopes), external services, and economy-style gamification
(coins, shops, loot, competitive leaderboards). The mascot companion (M6) is
explicitly IN scope; stars/streaks remain the only scorekeeping.

## Definition of done (any milestone item)

`npm test` green · `npm run e2e` green with new UI surface covered by the
suite · docs in sync (SPEC/STANDARDS/about.html/README) · `journal/` entry
written · PR into `dev` with auto-merge enabled, per docs/LOOP.md.
