# GOAL.md — north star and current milestone

This file is the **single source of work** for loop-based development
(see docs/LOOP.md). Loops derive their next step from the CURRENT milestone's
acceptance criteria and must not invent goals beyond this file. Humans edit
this file to redirect the loop; agents only check items off via PRs.

## Vision

A world-class, free, no-login skills builder for K-5 Spanish Dual Language
Immersion learners — starting with verb conjugation (100 most common verbs,
5 at a time, present/preterite/imperfect) and growing toward the skills that
carry learners from Novice Low to Novice High storytelling (NCSSFL-ACTFL
Can-Do levels). Pedagogy is grounded in the NBPTS World Languages
standards (ECYA-WL), with proficiency levels from the NCSSFL-ACTFL
Can-Do Statements (docs/STANDARDS.md; national-only per owner
2026-07-08 — no state-specific standards).

## Product invariants (violating these fails review — see CLAUDE.md)

1. Linguistic accuracy is test-gated; RAE tables are the reference.
2. Static site: no build step, no dependencies, no server, no login,
   no analytics. Progress lives only in localStorage.
3. Novice-first, non-punitive pedagogy; bilingual (Spanish-first) UI.
4. K-5 accessibility: big targets, dark mode, reduced motion, ARIA live.
5. Production = `main` = the live GitHub Pages site. Only a human merge
   deploys.

## Milestones

**Queue: M17 LIVE (dev→main release PR #76 merged 2026-07-10). M18
(gamification) is in PROPOSAL state — the owner-directed proposal doc
(docs/games-proposal.html, 2026-07-15) pitches three vetted concepts and
awaits the owner's pick + the non-goals amendment signature. NO loop-workable
item is queued: loops must NOT implement any M18 phase until the owner
records their pick and the amendment here.**
M16 tasks R (design extraction), G (gate), T (theme selector, Light
default), I\* (per-screen migration), RT (regression), and FLIP (default
the gate on + retire the old look) all landed on `dev`; the go-live deploy
is the next dev→main release a human merges. M17 (round-2 audits) is the
next loop work and runs against the now-default redesign.
Prior milestones M0–M15 complete on dev; still awaiting owner as before:
M5's SME copy review + human screen-reader pass, the M2 hold, the M4 pause.
The queue line here — not milestone numbering — sets loop priority.

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
  - [ ] Docs updated (SPEC 4.x, STANDARDS mapping to the Novice High
        presentational Can-Dos) and
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
  - [x] Performance budget check: <100 KB GZIPPED (owner decision
        2026-07-08, replacing the earlier 100→120 KB raw budgets; ~37 KB
        at changeover; changes are owner-only), enforced by
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
        stays under the payload budget (raw then; 100 KB gzipped since 2026-07-08).
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

- [x] **M9 — 🪟 Transparency & attribution epic** · complete on dev 2026-07-08
  Make the app's standards grounding visible IN the product, and give every
  page the same footer, credits, and a per-page "why this page" explainer.
  Owner decisions (2026-07-07): footer links to the two standards documents
  we actually cite — **NBPTS ECYA-WL and the 2020 NJSLS-WL**; info panels
  are **bilingual, adult-focused** (one short Spanish-first line a learner
  can read, then concise English standards mapping with citations).
  Acceptance criteria, in order:
  - [x] **F1 (footer everywhere):** `renderFooter()` becomes a shared
        component rendered on EVERY screen (home, group, Estudia, Elige,
        Escribe, Empareja, 🎧 Escucha, ⚔️ Contrast, informe) — today it
        renders only on home. Same toggles/links everywhere; footer keeps
        `.no-print`.
  - [x] **F2 (standards links):** the footer links to the official NBPTS
        ECYA-WL standards document and the official 2020 NJSLS-WL document
        (external links, `rel="noopener"`); about.html and docs/STANDARDS.md
        use the same canonical URLs.
  - [x] **F3 (credits):** two lines at the bottom of the footer, exactly:
        `Created by Lucia Perales, EdD (wife/mother/educator) and Aaron
        Soto, MHCID (husband/father/technologist)` `<br />` `DLI K-5
        Graduate “A1” (daughter/consultant) and DLI 3rd Grader “A2”
        (son/consultant)`. Kids appear ONLY as the pseudonyms A1/A2 —
        never add real names (privacy invariant).
  - [x] **I1 (info panels):** an ℹ️ info icon on every screen opens an
        accessible pop-up/slide-out panel explaining how THAT page supports
        the standards: which NBPTS ECYA-WL standard(s) and NJSLS-WL
        indicator(s) the activity serves and how (e.g., Elige →
        interpretive recognition 7.1.NL.IPRET; Escribe → presentational
        production; ⚔️ Contrast → NH-level tense discrimination).
        Dialog semantics: focus moves in on open and returns on close,
        Esc + explicit close button, ≥44px targets, dark mode, static
        under reduced motion, hidden in print.
  - [x] **I2 (single source of truth):** panel copy lives in one data
        module (e.g., `js/standards-info.js`) keyed by screen; a unit test
        asserts every screen key has an entry with citations. The same
        mapping is added to docs/STANDARDS.md as a per-screen table and
        summarized on about.html — repo docs and in-app panels must not
        drift (mirror the mapping, cite the module).
  - [x] **V/RT:** e2e — footer (toggles, standards links, credits) present
        on every route; info panel opens/closes on every screen with
        correct per-screen citations; payload budget test still green
        (keep panel copy lean); full unit + e2e regression, zero weakened
        assertions.
- [x] **M10 — 🔬 Usability & accessibility sprint** · complete on dev
  2026-07-08 (owner triaged both open findings same day; every audit
  finding is now fixed or explicitly accepted)
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
  - [x] **A1 (UX principles audit):** Don-Norman-principles audit
        (discoverability, affordances, signifiers, feedback, mapping,
        constraints, conceptual model) across all screens per the
        methodology in mastepanoski/claude-skills
        `don-norman-principles-audit` — catastrophic/high/medium/low
        severities, per-principle evidence, 1-3 recommendations each,
        prioritized list + overall score. Report: `docs/audits/norman.md`.
  - [x] **A2 (heuristic evaluation):** Nielsen 10-heuristics audit per
        `nielsen-heuristics-audit` — 0-4 severity scale, violations with
        exact locations and affected tasks, cross-heuristic patterns,
        quick wins, positive highlights. Report: `docs/audits/nielsen.md`.
  - [x] **A3 (cognitive walkthrough):** per `cognitive-walkthrough` — the
        four questions (right goal? action findable? affordance clear?
        progress visible?) applied step-by-step to ≥4 defined tasks with
        defined personas: a DLI 3rd grader on a tablet (novice, emerging
        reader), a DLI K-5 graduate on a phone, a parent checking
        progress, a teacher printing study sheets. Tasks must include
        first-visit → finish first Elige round, find and play 🎧 Escucha,
        use 🔍 Pistas, and print the informe. Per-step ✅/⚠️/❌ ratings,
        failure points, success-likelihood table.
        Report: `docs/audits/walkthrough.md`.
  - [x] **A4 (WCAG audit):** WCAG **2.2 Level AA** audit per
        `wcag-accessibility-audit` — automated pass (axe-core run
        dev-only through the existing Playwright harness; NEVER an app
        dependency) plus manual passes: full keyboard-only playthrough,
        200% zoom and 320px-width reflow, focus order/visibility, ARIA
        validity, contrast (light AND dark), reduced-motion. Findings
        organized by POUR with success-criterion citations and
        Critical/Serious/Moderate/Minor severities.
        Report: `docs/audits/wcag.md`.
  - Decision-pending findings from the audits (owner triage — loops must
    NOT implement these until an option is chosen here):
    - [x] **NN-1/DN-4/CW-3 (high):** footer setting toggles on a game
          screen silently restart the round. Options: (a) confirm before
          restarting, (b) apply the setting at the next round instead,
          (c) disable the two toggles during an active round with a short
          note. Auditor recommendation: (b) — least friction, no modal.
          **Owner chose (b) 2026-07-08; shipped.**
    - [x] **NN-3/DN-1/CW-1 (medium):** no "start here" cue for a
          brand-new learner on the 20-card home grid. Options: (a) a
          small "¡Empieza aquí!" ribbon on the first unstarted group,
          (b) a "Continúa" card tracking the furthest-played group,
          (c) leave as is. Auditor recommendation: (a) — smallest, no
          new state. **Owner chose (a) 2026-07-08; shipped.**
  - [x] **F (fix wave):** per the autonomy decision above — auto-fix the
        mandated tiers with tests per fix; each fix cites its finding ID;
        design/pedagogy-changing findings appended here as decision-pending
        tasks with the auditor's recommendation. No fix may weaken an
        existing test.
  - [x] **P (usability report — part of /docs, owner decision
        2026-07-07):** `docs/usability.html` — the "Usability &
        Accessibility" page lives INSIDE the public /docs section (not a
        root page): methodology overview of all four evaluations, scores,
        findings summary, fixed-vs-open status, date of audit. Content
        mirrors docs/audits (no drift); bilingual header, English body;
        linked from the /docs hub, UNLINKED from app nav.
  - [x] **D (public docs hub):** `docs/index.html` — the repo's `docs/`
        directory already deploys with Pages, so `/docs/` becomes a real
        public route. Three sections: **how to use the app** (learners /
        parents / teachers, incl. offline-ish behavior, localStorage
        privacy, voice availability), **how it supports DLI standards**
        (per-screen mapping, links to the two standards documents), and
        **usability & accessibility adherence** (links docs/usability.html
        + the four audit reports). Relative URLs only; unlinked from app
        nav until the owner links it.
  - [x] **Owner add-on (2026-07-08):** the group screen's activity grid
        lays out 3-up on tablet/desktop (2 rows of 3 with all six
        activities) and 2-up under 560px (3 rows of 2); ⚔️ reto keeps its
        full-width row — with e2e grid-track + no-overflow coverage.
  - [x] **V/RT:** e2e coverage for docs/usability.html and docs/index.html
        (load, key content, relative links resolve); axe-core automated
        pass wired as a CI-friendly check with zero Critical/Serious
        remaining; full regression green.

- [x] **M11 — 🧭 Site menu & public docs linking (owner-directed, complete
  on dev 2026-07-08)**
  Owner decisions: footer standards links reordered NBPTS-first (the
  foundational teaching standards); /docs is now PUBLIC-LINKED via the
  footer ("📚 Documentación / Docs") and a new ☰ site menu; navigation is
  a top-right collapsed hamburger — deliberately unintrusive because
  contextual back-navigation lives top-left in the crumbs. The ☰ menu is
  a disclosure (not a modal): Inicio, Informe, Acerca de, Documentación;
  first link focused on open, Esc/click-outside close, focus returns to
  the button; on every screen incl. home (hero corner: ☰ owns top-right,
  🔊 shifts left) and hidden in print. E2e covers presence on all
  screens, link set, focus/Esc/outside-click behavior, NBPTS-first
  order, per-route footer docs link, and real navigation to /docs.

- [x] **M12 — 🎙️ Premium Spanish audio via pre-generated ElevenLabs clips**
  · complete on dev 2026-07-08. Inputs: voice `rixsIpPlTphvsJd2mI03`,
  key in local .env only (git-ignored); owner upgraded to Creator
  (unblocks library voices via API + carries the commercial license for
  distributing the clips). Owner tuning decisions after two
  audition rounds: **dual-generated speeds** — 🔊 normal 0.85 and 🐢
  despacio 0.70 (real recordings, no playbackRate tricks).
  Owner decision (2026-07-08): architecture is **pre-generated static
  clips** — never runtime API calls. A local, owner-run script generates
  every clip with the owner's ElevenLabs key; the key never ships, never
  enters CI, never gets committed; the app makes zero third-party calls
  at runtime, keeping the published privacy claims true. Rationale: an
  API key cannot be safely shipped in a public static site (ElevenLabs
  offers no domain restriction; their client-side pattern needs a
  token-minting server, which golden rule #2 forbids).
  **Required owner inputs before any loop work (the hold):**
  1. An ElevenLabs API key, provided as a local environment variable
     (`ELEVENLABS_API_KEY`) at generation time only.
  2. Voice direction: candidate voice IDs to audition, or a chosen
     es-MX/es-419 voice. R1 exists to support this choice.
  Acceptance criteria, in order:
  - [x] **R1 (voice audition — first, feeds owner input #2):**
        `tools/audition-voices.mjs` generates a small sample set (same
        6-8 phrases) for 3-4 candidate Latin-American Spanish voices;
        owner + SME pick the voice. Verify distribution license for
        generated audio on the chosen plan tier and record it here.
  - [x] **G (generation tooling, dev-only like Playwright/axe):**
        `tools/generate-audio.mjs` — reads the key from env, generates
        person-prefixed clips ("yo hablo") for all 100 verbs × 3 tenses ×
        6 persons (~1,800 clips, ~20k credits one-time; compact mp3
        format, ~15-35 MB total), idempotent/resumable (only missing
        clips), verifies files, writes a manifest consumed by the app
        and a unit test (manifest ↔ dataset correspondence). Clips are
        committed as static assets (outside the gzipped JS/CSS/HTML
        payload budget — they lazy-load per tap like images).
  - [x] **I (integration):** js/audio.js gains a backend chain —
        static clip (HTMLAudioElement) → Web Speech → hidden. Mute
        setting honored across backends; 🐢 Despacio via
        playbackRate 0.5 + preservesPitch (no second clip set);
        vosotros clips generated but filtered at UI as always.
        **Gate change:** audio availability = any backend, so
        🎧 Escucha unlocks on voiceless-but-online devices (the big
        classroom win: Chromebooks without Spanish voices).
  - [x] **V/RT:** e2e stubs network audio like it stubs
        speechSynthesis; asserts fallback order (clip first, Web Speech
        when clips unreachable, UI hidden when neither), despacio
        playbackRate, Escucha available voiceless-online and still
        hidden voiceless-offline, mute silences both backends; docs
        (SPEC/STANDARDS-neutral, about.html, /docs privacy wording)
        updated honestly: "audio files download like images; no text
        leaves the device"; full regression green.
  Non-negotiables: no runtime ElevenLabs calls from the app, no key in
  the repo or CI, no server/proxy, Web Speech remains the offline
  fallback, and the payload budget still governs code (not clips).

- [x] **M13 — 📌 Frozen persons column on scrolling tables (owner bug
  report, complete on dev 2026-07-08)**
  On phones, scrolling Práctica's table to reach later verb columns
  scrolled the persons column out of view — the learner lost the row
  labels mid-task. Fix: spreadsheet-style freeze (`position: sticky`,
  solid backgrounds incl. even-row striping) on the first column of
  every `.table-scroll` conjugation table — Práctica (critical),
  Estudia, and the informe. E2e scrolls the table at 360px and asserts
  the persons column's x-position does not move.

- [x] **M14 — 🧹 Chrome cleanup (owner-directed, complete on dev 2026-07-08)**
  ℹ️ standards buttons now sit next to the page/quiz headings — inside
  the h1 on Estudia/Práctica/Empareja/Informe, on the prompt-card corner
  in Elige/Escribe/Escucha/Contraste — and are REMOVED from the home and
  group screens (standards-info module + tests updated to match). The
  🔊 sound toggle moved inside the ☰ site menu as a labeled row
  ("Sonido: encendido/apagado"), cleaning the header chrome to just
  crumbs (top-left) + ☰ (top-right). E2e: ℹ️ present on the 7 activity
  routes and absent on home/group; placement asserted (h1 vs prompt
  card); both mute tests exercise the menu-hosted toggle.

- [x] **M15 — 🏛️ National standards + DLIskills.com branding (owner-directed,
  complete on dev 2026-07-08)**
  All public standards references are now NATIONAL-ONLY: NBPTS World
  Languages standards (teaching) + NCSSFL-ACTFL Can-Do Statements
  (proficiency levels, Novice Low → Novice High) — every NJSLS-WL mention
  and link removed from the app, About, /docs, README, SPEC, STANDARDS,
  and the ℹ️ panels (cites now name mode + Novice level). Footer reads
  "Aligned to NBPTS and NCSSFL-ACTFL World Language standards" with both
  linked (NBPTS first; ACTFL Can-Do overview PDF). Branding: footer site
  name "Dual-Language Immersion (DLI) Skills"; home shows
  "part of DLIskills.com" (exact capitalization) under the Conjuga
  heading (plain text until the domain serves; link it then). About page
  GitHub link removed. Standing rule 6 in CLAUDE.md encodes all of it.

- [ ] **M16 — 🎨 Conjuga visual redesign (Claude Design–driven;
  owner-directed 2026-07-09)**
  Reskin the entire app to the "Conjuga Redesign" Claude Design artifact
  (project `7f989447-…`, file `Conjuga Redesign.dc.html`) while holding
  functionality invariant. Owner decisions (2026-07-09):
  • **Gated rollout** — the redesign lands as a new token/stylesheet layer
    behind a `redesign` gate; loop PRs into `dev` never change today's live
    look; the SINGLE human PR to `main` flips the gate ON (the one clean
    redesign redeploy).
  • **Theme selector** — the ☰ menu gains an Auto / Light / Dark selector
    (localStorage-persisted, default **Light** per owner 2026-07-09; Auto is
    opt-in and follows the OS), working in both the old and new looks.
  • Design artifacts DRIVE visuals ONLY; routes, question sampling,
    scoring, localStorage schema, TTS/clip lookup, 🔍 hint logic,
    🧱 Práctica-unscored, every star denominator (STARS_PER_SET = 30), and
    print behavior are untouched (strict functional control — this is the
    product's guardrail for the redesign).
  Hard constraints unchanged: no build step / no deps, ≤100 KB GZIPPED
  **code** budget (clips excluded; the new tokens + redesign CSS DO count),
  inline-SVG mascot ≤15 KB, no external fonts or trackers (self-host a font
  within budget or substitute a system-font stack), relative URLs only,
  A1/A2 pseudonyms, national-standards branding (rule 6).
  Acceptance criteria, in order:
  - [x] **R (design extraction — REQUIRES the seeded design; run in the
        design-seeded/owner session, NOT a fresh loop) — done on dev
        2026-07-09:** commit the raw
        Claude Design export under `design/` (repo source, unlinked, not
        app nav) and distill it into `docs/DESIGN.md` — color tokens
        (light + dark), type scale, spacing, radii, shadows/elevation, and a
        component inventory (buttons, cards, prompt card, conjugation
        tables, ☰ menu, footer, Lola placement) with a screen-by-screen
        map to our routes — plus `css/tokens.css` (CSS custom properties,
        defined but NOT yet applied). This committed spec becomes the source
        of truth so every later task is loop-capable WITHOUT design-MCP
        access. No change to the live app. Docs/tests: a unit check that
        tokens.css parses and docs/DESIGN.md lists a token block per screen.
  - [x] **G (gate + preview scaffold) — done on dev 2026-07-09:** add the redesign gate — a
        `data-redesign` attribute on `<html>` and `css/redesign.css` loaded
        but INERT until the gate is on — plus a dev/e2e preview trigger
        (`?redesign=1`) for screenshots. Wire `tokens.css`. Default look
        UNCHANGED. E2e: default render unchanged; the preview flag applies
        the new tokens; payload budget green.
  - [x] **T (theme selector — Auto / Light / Dark) — done on dev 2026-07-09:** a ☰-menu segmented
        control below the existing 🔊 Sonido row; localStorage (versioned
        key; default **Light** per owner 2026-07-09 — an unset theme applies
        `data-theme="light"`; Auto is opt-in and follows
        `prefers-color-scheme`); Light/Dark override the OS; reduced-motion
        respected; applies in BOTH looks. Independently releasable. E2e:
        override beats the OS stub, Auto follows it, choice persists across
        reload, menu focus/Esc wiring intact, and both existing dark-mode
        e2e assertions still pass.
  - [x] **I\* (per-screen migration — ONE loop each, gate-only) — done on dev 2026-07-09 (owner-directed single-loop consolidation for overnight session):** restyle
        to `docs/DESIGN.md` via `redesign.css` for, in this order — home,
        group, Estudia, 🧱 Práctica, Elige, Escribe, Empareja, 🎧 Escucha,
        ⚔️ Contraste, informe, about.html, docs/index.html,
        docs/usability.html. Each loop keeps DOM structure, behavior, and
        e2e selectors identical; places Lola per the new design (SVG +
        budget + reduced-motion intact); adds a redesign-preview screenshot
        assertion; and runs the axe-core gate on the preview too (no new
        Critical/Serious). Any design element that would change pedagogy or
        break a golden rule is appended HERE as an owner-triage task
        (M8/M10 pattern) instead of being implemented.
  - [x] **RT (regression) — done on dev 2026-07-09:** full unit + e2e green throughout; ≤100 KB
        gzipped code with tokens + redesign CSS included; no functional,
        localStorage, or print regressions; BOTH the default and preview
        looks pass axe.
  - [x] **FLIP (code landed on dev 2026-07-09; go-live is the next
        dev→main release):** the inline head loader in every HTML now sets
        `data-redesign` unconditionally, so the Prado redesign is the
        DEFAULT look — the `?redesign=1` preview trigger is retired
        (redesign is always on). Theme selector reflects the new palette
        across Auto/Light/Dark (Light default). The old look is retired as a
        reachable/default state; `css/styles.css` stays as the structural
        base beneath the redesign override layer (removing it would drop
        layout + fallback tokens like `--brand-soft` the redesign still
        consumes) — a deeper CSS consolidation is a separate follow-up, not
        a blocker. E2e "default off" checks flipped to "default on";
        theme/star/gate assertions updated to Prado values; unit 50/50, e2e
        green. Docs (DESIGN/GOAL/SPEC/README/about) synced. The production
        redeploy of the new design is the next human-merged dev→main release.

- [x] **M17 — 🔬 Round-2 usability & accessibility audits (post-redesign;
  owner-directed 2026-07-09; COMPLETE on dev 2026-07-10 — audits, auto-fixes,
  and both owner design-decisions (option a) all landed)**
  Re-ran the four evaluations against the live Prado redesign and recorded
  dated results. The axe-core CI gate runs on the redesign, so this was the
  deeper manual round — and it earned its keep: axe snapshots empty screens,
  so it was blind to the earned-★ and post-answer feedback-text contrast
  regressions that manual token computation caught. Owner decision
  (2026-07-09): reports updated **IN PLACE** with dated "Round 2" sections +
  per-finding Found/Fixed dates, Round 1 preserved; `docs/usability.html`
  mirrors both rounds. Autonomy per M10: auto-fixed WCAG Critical/Serious,
  Nielsen 3/4, and low-risk quick wins; design/pedagogy-changing findings
  appended below for owner triage.
  Acceptance criteria, in order:
  - [x] **DATING** — dated-findings convention (ID + Found/Fixed dates,
        Round 1 back-dated) added across `docs/audits/*.md` and
        `docs/usability.html` (Round column, R1/R2 dates).
  - [x] **A1′ Don Norman · A2′ Nielsen · A3′ cognitive walkthrough ·
        A4′ WCAG 2.2 AA** — each re-run against the live redesign; dated
        Round 2 sections appended to `norman.md` / `nielsen.md` /
        `walkthrough.md` / `wcag.md`, IDs continuing the sequence (DN-5..7,
        NN-6..8, CW-4..6, WCAG-6..9).
  - [x] **F′ (fix wave)** — auto-fixed the mandated tiers, each citing its
        finding ID + Fixed date, locked by the "M17 a11y fixes" e2e block:
        WCAG-6 (★ glyph → `--star-glyph #b8770f`, 3.69:1), WCAG-7 (feedback
        text → `--good-ink/--bad-ink/--almost-ink`, ≥5.5:1), WCAG-8
        (`.footer-applied` → `--good-ink`, 6.03:1), WCAG-9/DN-7 (theme active
        state → brand border), NN-8 (theme options → 44px).
  - [x] **P′ (usability page)** — `docs/usability.html` updated with Round 2
        scores, a dated R1-vs-R2 findings table (Found/Fixed), and the
        2026-07-10 audit date; no drift from `docs/audits`.
  - [x] **V/RT** — e2e for the fixes (computed colors + target size),
        axe-core green (both themes), full regression 50/50 unit; journal
        entry written.
  - [x] **NN-7 / DN-8 (icon system) — RESOLVED 2026-07-10, owner chose
        option (a), refined.** Two clean icon languages: the Prado line-icon
        set marks activity identity everywhere it appears (group cards +
        activity `h1` headings + the Estudia action row, via a reusable
        `.mode-icon.mi-inline`); the prompt-tense badge is a **text-only
        colored pill** (the wrong 🌙/⭐ metaphors removed, incl. from the
        informe headers); decorative nav/menu/footer label emoji (📖 📄 📚)
        were **removed** for a text-forward look (owner direction); functional
        /status glyphs (🔊 🖨️ ℹ️ 🔍, ⭐/🎧 counts) kept as a separate category.
  - [x] **DN-6 (imperfect badge contrast) — RESOLVED 2026-07-10, owner chose
        option (a).** Light `--tense-imperfect` darkened `#3f9256 → #1f7a45`
        (distinct from `--brand`); imperfect badge text is white via
        `--tense-imperfect-ink` (**5.35:1**); dark theme unchanged. Locked by
        the "M17 owner fixes" e2e block.
  - Low-severity watch items (no action required; monitor with real K-5
    users): CW-4 (theme/sound behind the unlabeled ☰), CW-5 (activity tiles
    equal visual weight), CW-6 (star-total pill reads tappable), NN-4
    (native `confirm()` for reset — carried, accepted).

- [ ] **M18 — 🎮 Gamification (owner-directed 2026-07-15; PROPOSAL state —
  awaiting owner pick, do NOT implement)**
  The owner asked for real fun: game mechanics woven into existing exercises
  and/or a reward for a job well done. Process ran 2026-07-15: three research
  passes (learning-science evidence for ages 5-11, codebase/brand constraints,
  vanilla-JS touch-game engineering) → 8 candidate concepts → three
  adversarial critics (pedagogy, engineering, K-5 UX/a11y) → 3 finalists,
  fully specced in **docs/games-proposal.html** (unlinked from app nav, per
  standing rule 5). Evidence-based guardrails all finalists obey: rewards are
  deterministic + effort-earned (no randomness/rarity), informational
  surprises never announced contracts, nothing decays or is lost, no
  streaks/leagues/timers/leaderboards, celebration access never gates on
  perfection (flair scales instead), tap-tap on anchored ≥56px targets,
  reduced-motion parity, and the Prodigy test (the fastest route to more fun
  must be more Spanish). All three finalists are UNSCORED celebration layers
  fully derived from existing `best` data — zero `recordResult`, zero new
  scoring track, zero schema change.
  Blocking owner decisions (record them here to unblock loops):
  - [ ] **PICK** — which finalist(s) enter the queue: Idea 1 "El Vuelo al
        Nido" (flight mini-game + living-nest meta-progression, one metaphor;
        the critics' convergent recommendation), Idea 2 "Empareja con Chispa"
        (juice pass on matching; S-size, ship-first), Idea 3 "Las Postales de
        Lola" (culture postcard album; SME-gated, later phase).
  - [ ] **AMEND** — sign the non-goals clarification proposed in the doc
        (celebration layers derived from stars are allowed; currencies/shops/
        loot/leaderboards/streak-guilt stay banned; stars + 🎧 badges remain
        the only scorekeeping).
  Phases as proposed (do not start until PICK + AMEND are recorded):
  - [ ] **M18.1** — Empareja con Chispa + freebie F1 (Repasa-hoy droplet
        visual). Up-only counts (no combo meter — a visible reset is a
        punishment mechanic), decorative flip with synchronous state classes
        (existing e2e timing contracts hold), lazy WebAudio chirps gated on
        the sound setting, Lola `is-turn` on runs. ~1-2 KB gz. 1 iteration.
  - [ ] **M18.2** — El Nido: `#/nido` scene (new module `js/nido.js`, NOT in
        mascot.js — 8 KB cap), tiered growth derived from `best` (first star
        = wisp, group all-≥1★ = twig ceremony, 30/30 = flower + `is-spin`),
        never empty slots/counters, DOM-list a11y, home-card twig badges.
        ~4-6 KB gz. 2 iterations.
  - [ ] **M18.3** — El Vuelo: lazy `js/vuelo.js`, reduced-motion grid built
        FIRST then drift garnish, anchored ≥64px bobbing clouds (never
        moving-target taps), every finished round flies (skippable, flair
        scales with stars), clouds sample the round's verbs (clips already
        exist for conjugated forms), prefetch post-boot, silent offline
        degrade. ~8-12 KB gz. 2 iterations.
  - [ ] **M18.4** — Las Postales: 6 flat token-colored lazy SVG postcards
        (NOT 20 — art is the payload bomb), tiles reveal on NEW best-stars
        only (defuses stars-as-currency), album reached via the nest,
        aria-live reveal narration, modest STANDARDS.md culture-exposure
        claim. GATED on SME cultural review + owner clip run. 3 iterations.
  Killed (do not resurrect): Viste a Lola (violates MASCOT.md spec; cosmetic
  economy; shared-device loss mechanic) · Modo Rayo (streak in disguise;
  rewards comfort-zone speed) · Mapa del Viaje (regresses the audited home;
  lockstep path vs free choice) · Jardín de Verbos as pitched (no per-verb
  data exists; 100-target overload; backlog guilt — salvaged as freebie F1).

## Non-goals (do not build)


Accounts, servers, dashboards, analytics, other languages (until M5 is done
and a human re-scopes), external services, and economy-style gamification
(coins, shops, loot, competitive leaderboards). The mascot companion (M6) is
explicitly IN scope; stars/streaks remain the only scorekeeping.

## Definition of done (any milestone item)

`npm test` green · `npm run e2e` green with new UI surface covered by the
suite · docs in sync (SPEC/STANDARDS/about.html/README) · `journal/` entry
written · PR into `dev` with auto-merge enabled, per docs/LOOP.md.
