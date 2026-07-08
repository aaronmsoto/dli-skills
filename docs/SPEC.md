# Conjuga — Product & Technical Specification (v0.1)

## 1. Purpose

A publicly available, registration-free web app that helps **novice** learners
in **K-5 Spanish Dual Language Immersion (DLI)** programs build accuracy with
**Spanish verb conjugation** across **present, preterite, and imperfect**
(indicative), covering the **100 most common Spanish verbs**, practiced
**5 verbs at a time**.

Grounded in:
- NBPTS World Languages Standards (ECYA-WL) — teaching practice
- 2020 NJSLS — World Languages — learner proficiency targets (ACTFL-aligned)

See docs/STANDARDS.md for the alignment detail.

## 2. Audience & proficiency target

- Primary: grade 2-5 students in Spanish DLI programs (NJSLS Novice Low →
  Novice High band; DLI contact hours push many toward Novice High early).
- Secondary: teachers (practice station) and families (home support).
- Reading level: short bilingual instructions; Spanish-forward UI.

## 3. Scope decisions (v0.1)

| Decision | Choice | Rationale |
|---|---|---|
| "Past" tense | Pretérito indefinido (preterite) | Standard novice progression alongside imperfect; enables the completed-vs-ongoing contrast central to storytelling |
| Mood | Indicative only | Novice scope |
| Persons | All 6; **vosotros hidden by default** (toggle) | US DLI convention; data retained for flexibility |
| Verb list | 100 highest-frequency verbs from standard Spanish frequency lists, in rank order | Highest payoff per practice minute; front-loads the irregular core (ser/estar/tener/hacer/ir) |
| gustar | Replaced with comer | Novices learn *me gusta* as a chunk; drilling *yo gusto* teaches an unnatural pattern |
| Grouping | 20 fixed groups of 5, by frequency rank | "5 at a time" requirement; predictable, spiraling progression |
| Tense framing | ☀️ ahora / ⭐ ayer, una vez / 🌙 antes, muchas veces | Kid-accessible semantic anchors for the preterite/imperfect contrast |
| Platform | Static site (vanilla ES modules), GitHub Pages | Free, no server, no accounts, works on school Chromebooks/iPads |
| Persistence | localStorage only | Zero data collection (COPPA/FERPA-friendly by construction) |

## 4. Functional requirements

### 4.1 Home
- Grid of 20 verb groups showing the 5 infinitives and stars earned (x/27:
  3 tenses × 3 game modes × 3 stars).
- Global star total; settings (vosotros toggle, erase progress); link to
  standards page.

### 4.2 Group screen
- The 5 verbs with English glosses.
- Step 1: pick a tense (Presente / Pretérito / Imperfecto) — each card shows
  icon, semantic hint, and an example sentence.
- Step 2: pick an activity — Estudia, 🧱 Práctica (unscored), Elige,
  Escribe, Empareja (+ 🎧 Escucha when a voice exists) — stars shown for
  the scored games in the selected tense. Layout: 3 columns on
  tablet/desktop (2 rows of 3 when all six show), 2 columns under 560px
  (3 rows of 2); the ⚔️ reto card keeps its own full-width row.

### 4.3 Activities
- **Estudia (study):** one table — rows = persons, columns = the 5 verbs —
  for the selected tense, with example sentence and quick links into the games.
- **Elige (multiple choice), 10 questions:** prompt = person + blank +
  infinitive + gloss + tense chip; 4 options = answer + 3 distractors chosen
  in priority order: (1) naive regularization of irregular forms (e.g. \*teno),
  (2) same person in another tense, (3) other persons in the same tense.
  Keyboard 1-4. Correct → praise + auto-advance (~1s); incorrect → show correct
  answer, require explicit "Siguiente" (learner reads the correction).
- **Escribe (typed production), 10 questions:** free-typed answer, on-screen
  accent keys (á é í ó ú ñ), Enter submits. If the only error is accents, one
  penalty-free retry with the hint "¡Casi! Revisa la tilde". Case and
  surrounding whitespace are ignored.
- **Empareja (matching):** 6 pairs (person + infinitive ↔ conjugated form),
  two shuffled columns; wrong pair shakes and both cards return; score = pairs
  matched on the first attempt.
- Every round samples targets so **each of the 5 verbs appears at least once**;
  remaining slots cover distinct (verb, person) cells; vosotros excluded when
  toggled off.

### 4.3b Contrast challenge (⚔️ ¿Pretérito o imperfecto?)
One per group (recorded under `past.contrast`): 10 questions mixing both past
tenses. A time-cue expression (preterite: *ayer, anoche, una vez, de repente,
el año pasado*; imperfect: *siempre, todos los días, muchas veces, de niño/a,
antes, cada verano*) signals the tense; the learner picks between the two past
forms of the same verb+person (these never coincide in Spanish — verified by
test across all 100 verbs). **Known simplification:** real tense choice is
aspect-driven, not word-driven; cue words are the standard novice scaffold and
the mode is framed as "una vez ⭐ o muchas veces 🌙". Sentence-context items
(roadmap) will supersede this.

### 4.3c Audio (clips + TTS fallback, M12)
Two backends, tried in order (js/audio.js):
1. **Pre-generated clips** — one mp3 per exact spoken text
   (audio/manifest.json), recorded ONCE by the owner with ElevenLabs
   (voice rixsIpPlTphvsJd2mI03; tools/generate-audio.mjs, key in a
   git-ignored .env only). Served as static assets like images: **no
   text ever leaves the device at runtime**, nothing is recorded or
   sent. FOUR clips per form (owner decisions 2026-07-08): text variants
   person-prefixed for say/sayForm and bare for 🎧 Escucha (the prompt
   must not reveal the person), × dual-generated speeds — 🔊 normal 0.85
   and 🐢 despacio 0.70, real recordings rather than playbackRate.
2. **Web Speech API** — device-local voice, works offline; rate 0.85
   (0.5 slow); prefers local es-MX/es-US/es-419.
UI gates on `audioAvailable()` (either backend): 🎧 Escucha therefore
works on voiceless-but-online devices (school Chromebooks). When neither
backend exists (offline + no Spanish voice), every audio control hides.
Auto-speaks the correct form after each question resolves, on match
success, and on study/hint/práctica taps; 🔊/🔇 persists in settings and
silences both backends.

### 4.3d Spaced repetition (🔁 Repasa hoy)
Every recorded result stores a timestamp. An activity is due again after
0 / 1 / 3 / 7 days for 0 / 1 / 2 / 3 stars. The home screen shows the 5 most
overdue activities as one-tap links. Entries saved before this feature (no
timestamp) are never marked due — backward compatible, no schema version bump.

### 4.3e Printables (🖨️)
A print stylesheet (`@media print`) renders study tables cleanly (nav, buttons
and footer hidden; bordered black-and-white tables). `#/informe` is a
printable progress report: name/date line, total stars, and a 20-row grid
(stars per tense ×9, reto ×3, total ×30 per group).

### 4.3f Mascot — Lola la Lechuza (M6)
A silent, gender-neutral barn-owl companion implementing the JiJi (ST Math)
principles (docs/MASCOT.md is the binding spec): character-as-feedback
(hop on correct, curious head-tilt on miss — never punitive), forward
motion as progress (she glides along the round's progress bar toward a
nest; "¡Ayuda a Lola a llegar a su nido!"), signature ~270° head turns and
a single 360° head-spin reserved for 3-star results, watching pose while
the learner types. Inline SVG + CSS only, aria-hidden, dark-mode palette
tokens, full prefers-reduced-motion static fallback, hidden in print,
budget-tested (tests/payload.test.mjs).

### 4.3g Listening mode (🎧 Escucha, M3 — recognition v1)
Per group × tense, shown only when a Spanish TTS voice exists (direct
routes redirect otherwise). The target form is spoken, never shown; the
learner picks from 4 written options built by the existing distractor
engine — which naturally forces person-ending discrimination
(tiene/tienes/tienen) and the stress-as-tense contrast (hablo/habló).
Unlimited 🔊 replay plus 🐢 slow replay (rate 0.65); listening prompts
bypass the mute setting (entering the mode is explicit audio intent).
**Badges, not stars:** results record under `<set>.<tense>.listen` on a
parallel 🎧 track (same 60/80/100% tiers) shown on group cards, home,
results, review queue, and the report — never counted in star totals, so
voiceless devices are not penalized. Typed variant deferred (owner
decision) pending SME input.

### 4.3h Hint mode (🔍 Pistas, M7 — from direct K-5 user feedback)
A 🔍 Pista button on quiz prompt cards (Elige, Escribe, ⚔️ Contrast) opens
a mini Estudia panel: the current verb's column (persons → forms),
engine-generated, vosotros-filtered. Contrast shows BOTH past columns so
choosing the tense remains the learner's job. The panel resets each
question; Lola holds a magnifying glass to her eye (is-hint pose) while it
is open. No scoring penalty (NBPTS Std IV scaffolding — the learner still
maps person → row); a footer checkbox "🔍 Pistas / Hints" (default CHECKED)
turns the feature off everywhere. Deliberately absent from Empareja (the
board is already visible) and 🎧 Escucha (a visible column would undermine
the listening task).

### 4.3i Práctica (🧱 rebuild the table, M8 — unscored, from direct K-5 user feedback)
A practice-based extension of the Estudia interface (a recent DLI graduate's
favorite classroom activity: teacher gives the root word and the forms,
students match each form to its person). The Estudia-style table renders
with the active verb's column EMPTY; that verb's forms sit shuffled in a
bank of big tap targets. Tap a word, then its person row: correct fills the
cell (which becomes tap-to-hear, per the standard vocalization rules) and
speaks person + form; incorrect shakes and invites a retry — the activity
cannot be failed. Columns advance verb by verb through the group; finishing
the table earns a Lola celebration and links onward to the games.
UNSCORED by owner decision: no stars, no badges, no recordResult of any
kind (the ladder is Estudia → Práctica → Elige → Escribe → Empareja).
Duplicate forms (imperfect yo/él) match by string equality, so either tile
fits either matching row. No 🔍 hint button — the activity IS the chart.
Entry points: first action link on the study screen; an unscored card on
the group screen. Icon is 🧱 (Empareja already owns 🧩). On narrow
screens the persons column stays frozen (position: sticky) while the
verb columns scroll — same guarantee on Estudia and the informe.

### 4.3j Footer — a component constant (M9 F1-F3)
`renderFooter()` renders on EVERY screen (home, group, Estudia, Práctica,
all game rounds, contrast, results, informe): settings toggles (vosotros,
🔍 Pistas), progress reset, informe + about links, external links to the
two standards documents we cite — NBPTS ECYA-WL (nbpts.org PDF) and the
2020 NJSLS-WL (nj.gov) — with `rel="noopener"`, and the owner-specified
credit lines (Lucia Perales, EdD · Aaron Soto, MHCID · DLI consultants
"A1"/"A2" — pseudonyms only, a privacy invariant). Hidden in print.
Settings toggles re-render the current screen — EXCEPT during an active
round (play/contrast/práctica), where the toggle saves, shows "✓ Guardado
— se aplica al continuar", and applies as play continues (hints: next
question; vosotros: next round) so a mid-round tap never discards
progress (NN-1 fix, owner option b, 2026-07-08).

### 4.1b Start-here cue (NN-3 fix, owner option a, 2026-07-08)
The first group with zero stars AND zero badges wears a "¡Empieza aquí! /
Start here" ribbon on the home grid; it advances as groups are started
and disappears when none are fresh.

### 4.3k Site menu (☰, M11 — owner-directed 2026-07-08)
A collapsed hamburger in the top-right of every screen's chrome (hero
corner on home) opening a compact disclosure with the main pages: Inicio,
Informe de progreso, Acerca de / Standards, Documentación (/docs). Kept
deliberately unintrusive: contextual back-navigation stays top-left in
the crumbs. Not a modal — links are normal tab stops; the first link is
focused on open; Esc and click-outside close and focus returns to ☰.
The footer also links /docs, and its standards links read NBPTS-first.
Hidden in print.

### 4.4 Results & progression
- Score, star award (≥60% ★, ≥80% ★★, 100% ★★★), encouraging message
  (never shaming), review list of missed items (person + correct form + verb +
  tense), actions: retry / next mode / back to group.
- Best score and stars persist per (group, tense, mode).

### 4.5 Non-functional
- **Accessibility:** WCAG-minded — ARIA live region for feedback, focus-visible
  styles, keyboard play, ≥44px targets, dark mode, prefers-reduced-motion.
- **Performance:** no network calls after load; total payload < 100 KB GZIPPED — the wire-transfer measure (owner, 2026-07-08; ~37 KB at changeover).
- **Privacy:** no cookies, no analytics, no external requests, no PII.
- **Browser support:** evergreen browsers (ES2020 modules).

## 5. Technical design

### 5.1 Conjugation engine (js/conjugator.js)
Regular paradigms are computed from the infinitive; irregular behavior is
declared per verb (js/verbs.js) via flags:

- `pres` / `pret` / `imp` — full 6-form overrides (ser, estar, ir, ver, dar, oír, hacer-preterite)
- `presYo` — irregular yo (tengo, hago, salgo, sé, …)
- `presStem` — boot stem change `e>ie | o>ue | u>ue | e>i` (persons yo/tú/él/ellos)
- `pretStem` — strong preterite stem (tuv, dij, quis, …) with unstressed endings; j-stems take -eron
- `pret3` — -ir third-person vowel change `e>i | o>u` (pidió, murió)

Automatic orthography (no flags needed): -car/-gar/-zar → -qué/-gué/-cé (yo
preterite); vowel-stem -er/-ir → y-insertion with accented weak endings (leyó,
cayó, oyó) excluding silent-u digraphs (seguir); -guir → -go, -ger/-gir → -jo,
vowel+-cer/-cir → -zco (yo present).

### 5.2 Testing (tests/conjugator.test.mjs)
35 Node-test cases: the top-10 verbs fully verified in all 3 tenses; one test
per irregularity class; structural invariants (exactly 100 unique verbs, ranks
1-100, 20×5 sets, every form matches `^[a-záéíóúñü]+$`). Expected values
hand-verified against RAE conjugation tables.

### 5.3 State & routing
Hash routing (`#/set/3`, `#/study/3/present`, `#/play/3/present/choice`) —
back button works, no server config needed on Pages. Selected tense is kept in
sessionStorage; mastery in localStorage under versioned key `conjuga.v1`.

### 5.4 Deployment
GitHub Actions workflow publishes the repository root to GitHub Pages on push
to `main` (and manually via workflow_dispatch). No build step.

## 6. Validation performed

v0.1:
- `npm test`: 35/35 passing.
- Playwright end-to-end drive of every screen: home (20 groups), group screen,
  study tables (soy/fui/era spot checks), full 10-question Elige round,
  Escribe correct-answer + accent-retry flows, full Empareja solve (6/6),
  results + star persistence, about page — zero console errors.

v0.2 (contrast mode, TTS, review queue, printables):
- `npm test`: 40/40 (adds contrast-generator invariants, the
  preterite≠imperfect check across all 600 past forms, review-interval logic).
- Playwright: full 10/10 contrast round via cue→tense solving; review queue
  appears when a stored result is backdated 8 days, links into the game, and
  is absent for fresh sessions; report renders 20 rows with correct star math;
  print media hides nav; TTS fallback (no voice → no controls) and stubbed-
  voice path ("yo soy" spoken; mute stops speech) — zero console errors.

## 7. Out of scope (roadmap)

Sentence-context items and story-retell (the bridge to 7.1.NH.PRSNT.4);
listening-comprehension mode (hear → pick/type); more tenses (perífrasis
ir a + inf., present progressive); other program languages (the engine/data
split was designed to generalize); cross-student teacher dashboards (requires
accounts — excluded by the privacy design; the printable report is the
substitute).
