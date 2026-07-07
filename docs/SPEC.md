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
- Step 2: pick an activity — Estudia, Elige, Escribe, Empareja — with stars
  earned for the selected tense.

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

### 4.4 Results & progression
- Score, star award (≥60% ★, ≥80% ★★, 100% ★★★), encouraging message
  (never shaming), review list of missed items (person + correct form + verb +
  tense), actions: retry / next mode / back to group.
- Best score and stars persist per (group, tense, mode).

### 4.5 Non-functional
- **Accessibility:** WCAG-minded — ARIA live region for feedback, focus-visible
  styles, keyboard play, ≥44px targets, dark mode, prefers-reduced-motion.
- **Performance:** no network calls after load; total payload < 100 KB.
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

## 6. Validation performed (v0.1)

- `npm test`: 35/35 passing.
- Playwright end-to-end drive of every screen: home (20 groups), group screen,
  study tables (soy/fui/era spot checks), full 10-question Elige round,
  Escribe correct-answer + accent-retry flows, full Empareja solve (6/6),
  results + star persistence, about page — zero console errors.

## 7. Out of scope for v0.1 (roadmap)

Audio/TTS and listening comprehension; sentence-context items and story-retell
(the bridge to 7.1.NH.PRSNT.4); spaced-repetition scheduling across sessions;
teacher dashboards/printables; more tenses (perífrasis ir a + inf., present
progressive); other program languages (the engine/data split was designed to
generalize).
