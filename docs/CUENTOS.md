# CUENTOS.md — binding spec for 📚 Cuentos (Spanish reading comprehension)

Status: **owner-approved design, 2026-10-30** (decisions recorded inline).
Cuentos is the second DLIskills.com app, a sibling of Conjuga. Everything
in CLAUDE.md (golden rules, standing product rules, chrome, privacy,
no-build static site) applies unchanged unless this file says otherwise.

## 1. Purpose & audience

Gamified reading-comprehension practice in Spanish for K-5 DLI learners.
**Initial target: 3rd grade DLI** — most of the class is only beginning
Spanish reading comprehension but reads English well. Design consequences:

- Short, graded retellings of public-domain stories (never verbatim
  archaic text); three levels per story so one story serves a mixed class.
- English is a *support*, never the medium: tap-word glossary, an
  on-demand English hint line under each question, bilingual chrome.
- Comprehension strategies made explicit and sequenced: **before**
  (key words + schema activation) → **during** (glossary, read-along,
  optional prediction stops) → **after** (literal → inferential
  questions, retell by sequencing, story map, words in context).
- Feedback is informative, never punitive: a miss shows the answer AND
  highlights the evidence sentence in the passage.

Standards framing (owner, 2026-10-30): NBPTS ECYA-WL + NCSSFL-ACTFL
Interpretive Reading Can-Dos (Novice Mid → Novice High) **plus, for
Cuentos only, CCSS ELA Reading: Literature grade 3 (RL.3.1–RL.3.5) via
“Common Core en Español” (SDCOE)**. Conjuga's citations are unchanged.

## 2. Owner decisions (2026-10-30)

| Decision | Value |
|---|---|
| Name / URL | **Cuentos**, `https://dliskills.com/cuentos/` |
| First stories | El león y el ratón (Esopo) · La liebre y la tortuga (Esopo) · La pobre viejecita (Rafael Pombo, Colombia) · La tortuga gigante (Horacio Quiroga, Uruguay) · La muñeca negra (José Martí, Cuba) |
| Levels | 3 per story: 🌱 Nivel 1 · 🌳 Nivel 2 · 🌲 Nivel 3 |
| English support | tap-word glossary + on-demand English hint per question |
| Stars | per (story, level, activity): 5 ⭐ activities × 3 stars × 3 levels = **45 per story** |
| Payload budget | **150 KB gzip for everything under `cuentos/`** (own test) |
| Attribution | required and public: per-story source line + `#/creditos` + about.html |
| Rollout | build Cuentos first; homepage + Conjuga move to `/conjuga/` come later (owner-gated) |

## 3. Directory layout

```
cuentos/
  index.html            app shell (same inline theme loader; links ../css/*)
  css/cuentos.css       Cuentos-only styles (class prefix .cu-), reuses tokens
  js/app.js             hash router + screens
  js/reader.js          passage renderer: glossary, sentence audio, read-along, predict stops
  js/activities.js      PURE question/round builders (unit-tested, no DOM)
  js/storage.js         cuentos.v1 progress; settings come from ../../js/storage.js
  js/standards-info.js  per-screen ℹ️ copy (single source of truth)
  js/stories.js         index: imports every data module, exports STORIES (array, display order)
  js/data/<id>.js       one module per story (schema §5)
```
Shared, imported relatively from the repo root: `js/menu.js` (☰ + `el()`),
`js/mascot.js` (Lola), `js/audio.js` (clips + TTS), `js/storage.js`
(settings + pure star/review helpers), `js/beacon.js` (page views — same
privacy posture), `css/styles.css`, `css/tokens.css`, `css/redesign.css`.
Conjuga's payload test (js/ + css/) is unaffected; Cuentos has its own.

## 4. Routes & screens

| Route | Screen | Chrome |
|---|---|---|
| `#/` | **Biblioteca** — Lola greeter, total ⭐ / 🎧, 🔁 Repasa hoy queue, one book card per story (emoji cover, title, author · country flag, ⭐ x/45, 🎧 x/9, “¡Empieza aquí!” on the first fresh story) | ☰ only (no ℹ️ on home) |
| `#/cuento/<id>` | **Story screen** — title + attribution line, theme, Palabras clave chips (tap-to-hear), level picker (🌱🌳🌲 with per-level ⭐), activity cards for the selected level: 📖 Lee first, then ❓ ✅ 🧩 🔤 🗺️, then 🎧 Escucha only when `speakable()` | crumbs + ☰ (no ℹ️) |
| `#/lee/<id>/<n>` | **Lee** (unscored reader) — level pills, paragraphs with tap-word glossary, per-paragraph 🔊/🐢, ▶️ Leer en voz alta read-along (sentence highlight), prediction stops (levels 2–3; later paragraphs stay hidden until answered; any answer → “¡Vamos a ver!”), action row linking EVERY activity of this level (rule 2 analog) | crumbs + ☰ + ℹ️ next to h1 |
| `#/juego/<id>/<n>/<act>` | **Activity round** (`act` ∈ preguntas · verdad · ordena · palabras · mapa · escucha) | crumbs + ☰ + ℹ️ in the prompt-card corner |
| `#/informe` | printable report: story × level × activity stars, badges | crumbs + ☰ + ℹ️ |
| `#/creditos` | story sources & licenses (also linked from footer) | crumbs + ☰ |

`renderFooter()` on every screen: site name, links (Informe · Créditos ·
Acerca de → `../about.html` · Docs → `../docs/` · Borrar progreso), standards
note (NBPTS → NCSSFL-ACTFL → Common Core en Español), the owner credits line
(A1/A2 pseudonyms only). ☰ rows for Cuentos: Inicio · Informe · Créditos ·
Conjuga (`../`, labelled “Conjuga / Verbos”) · Acerca de · Docs · Ajustes
(Pistas, Sonido, Tema, Borrar — **no Vosotros**, no Descargas/Install in v1).
Cuentos is NOT linked from Conjuga until the owner links it (rule 5).

## 5. Story data schema (`cuentos/js/data/<id>.js`, `export default {...}`)

```js
{
  id: "leon-raton",                       // kebab; route + storage key
  title: "El león y el ratón",
  emoji: "🦁",                            // book-cover glyph
  theme: { es: "La bondad se devuelve.", en: "Kindness comes back around." },
  source: {
    author: "Esopo",                      // original author/tradition
    via: "Félix María de Samaniego, Fábulas en verso castellano (1781)", // PD Spanish text consulted, or null
    origin: { es: "Fábula griega", en: "Greek fable" },
    country: { es: "Grecia", en: "Greece", flag: "🇬🇷" },
    license: "Dominio público. Adaptación original de DLIskills.com (MIT).",
    url: "https://es.wikisource.org/wiki/..."   // public-domain source
  },
  keyWords: [ { es: "el león", en: "the lion", emoji: "🦁" }, ... ],   // 4–6
  levels: [ level1, level2, level3 ]
}
```
Each `level`:
```js
{
  nivel: 1,                                 // 1|2|3
  tense: "present" | "past",               // N1 present; N2–3 past (pretérito/imperfecto narration)
  paragraphs: [ ["Sentence.", "Sentence."], [...] ],   // 2–6 paragraphs of 1–5 sentences
  glossary: { "ruge": "roars", "la red": "the net" },  // key = exact lowercase surface form(s) as they appear, no punctuation; multi-word allowed
  predict: [ { after: 1, q: "¿Qué va a hacer el león?", en: "...", options: ["...","...","..."] } ], // [] at N1; 1–2 stops at N2–3; unscored, no `answer`
  questions: [ { q, en, options: [a,b,c], answer: 0|1|2, evidence: [p, s] } ],   // exactly 5
  tf:        [ { s, en, answer: true|false, evidence: [p, s] } ],               // exactly 5
  order:     [ "event 1", "event 2", ... ],                                     // N1: 4 · N2: 5 · N3: 6 short events, correct order
  vocab:     [ { word: "ruge", ref: [p, s], options: ["roars","sleeps","hides"], answer: 0 } ], // exactly 5; word ∈ glossary and ∈ sentence ref
  map: { personajes: { options: [3], answer }, lugar: {...}, problema: {...}, solucion: {...} },
  listen:    [ [p, s], ... ]                                                      // exactly 5 distinct sentence refs, 4–12 words each
}
```
Level bands (validator-enforced): N1 **60–100** words, present tense, ≤ 10
words/sentence average; N2 **130–190** words, past narration, connectors
(primero, después, al final), some dialogue; N3 **210–290** words, richer
vocabulary, a stated-but-subtle moral. Word count = whitespace tokens of
all sentences. Questions: 2 literal (quién/qué/dónde), 1 why/how
(inferential, text-supported), 1 sequence (¿qué pasa primero/después?),
1 feeling/central message (N2–3) or literal (N1). Exactly 3 options,
all plausible, one defensible answer, distractors drawn from the story
world. `evidence` points at the sentence that proves the answer.

Spanish conventions: Latin American standard (ustedes, never vosotros),
raya (—) for dialogue, full accents, kid-safe vocabulary, prefer verbs
from Conjuga's 100 (`js/verbs.js`). No English inside `paragraphs`,
`options` of questions/tf/order/map (English lives only in `en`,
`glossary` values, and `vocab.options`). Vocab options are English
meanings (the class reads English well — this is RL.3.4 in L2).

## 6. Activities & scoring tracks (rule 3)

| Key | Name | Track | Round |
|---|---|---|---|
| `preguntas` | ❓ Preguntas | ⭐ | 5 MC questions; passage panel OPEN; miss → answer + evidence highlight |
| `verdad` | ✅ ¿Verdad o mentira? | ⭐ | 5 statements, two big buttons; passage OPEN; evidence on miss |
| `ordena` | 🧩 Ordena el cuento | ⭐ | shuffled event tiles; tap tiles in order (or keyboard); score = events placed right on first tap of that slot; passage COLLAPSED (available as hint) |
| `palabras` | 🔤 Palabras | ⭐ | word shown highlighted inside its sentence; pick the English meaning (3); passage panel CLOSED by default; a miss shows the meaning («duerme» = sleeps + 🔊), not the sentence again |
| `mapa` | 🗺️ Mapa del cuento | ⭐ | 4 slots (Personajes · Lugar · Problema · Solución), each MC (3); total 4 |
| `escucha` | 🎧 Escucha | 🎧 badges | hear a sentence (never shown), pick it among 3 written sentences; renders only when `speakable()`; NEVER in star totals |
| `lee` | 📖 Lee | unscored | reader; records `reads` count only (no stars/badges) |

Stars use the shared `starsFor` (3 = 100 %, 2 ≥ 80 %, 1 ≥ 60 %). Story
total = 45; 🎧 total = 9. Audio gating: `speakable(text)` =
`ttsAvailable() || hasClip(text)` — never `audioAvailable()` alone (a
silent 🔊 breaks rule 1; story clips don't exist until the owner's
ElevenLabs run). Every audio affordance hides when `speakable()` is false
and every activity still works without audio. `say()` honors the sound
setting; 🎧 Escucha is the one mute exemption.

## 7. Storage

`localStorage["cuentos.v1"] = { best: { "<id>.<nivel>.<act>": { score, total, stars, plays, at } }, reads: { "<id>.<nivel>": { count, at } } }`.
Settings (theme, sound, hints) are READ/WRITTEN through the shared
`js/storage.js` (`conjuga.v1`) so the site stays consistent; “Borrar
progreso” inside Cuentos clears ONLY `cuentos.v1`. The shared review
helpers (`isDue`, `reviewIntervalMs`) drive 🔁 Repasa hoy.

## 8. Chrome, a11y, pedagogy guardrails

- Standard chrome (rule 5): crumbs top-left, ☰ top-right, ℹ️ beside the
  h1 (or prompt-card corner), `renderFooter()` everywhere.
- ≥ 44 px targets; glossary words are real `<button>`s; popover is a
  dismissible, keyboard-reachable bubble with the meaning + 🔊.
- `aria-live` announcements for feedback and results; Lola decorative
  (`aria-hidden`), silent, one-state-at-a-time; reduced motion respected.
- Spanish first everywhere; English in `.h-en` support spans.
- Print styles for `#/informe` and the reader (teachers print passages).
- Pistas setting: when on, activities show the “📖 Ver el cuento” panel
  toggle; when off, the panel is hidden during ordena/mapa (still
  available after the round). Never a scoring penalty either way.

## 9. Tests

- `tests/cuentos-data.test.mjs` — schema/band/reference validator over every data module (the writers' gate).
- `tests/cuentos-activities.test.mjs` — pure builders (distractors, order scoring, listen targets, shuffle).
- `tests/cuentos-standards.test.mjs` — STANDARDS_INFO keys ↔ screens.
- `tests/cuentos-payload.test.mjs` — `cuentos/**` ≤ 150 KB gzip.
- `tests/e2e/cuentos.mjs` — every screen + every activity to results + storage + axe (chained into `npm run e2e`).

## 9b. Implementation notes (phase A build, 2026-10-30)

- `#/creditos` DOES carry an ℹ️ (key `creditos` — Std III culture note);
  the route table above predates that decision.
- The aggregate beacon is not wired into Cuentos: `server/worker.js`
  allowlists Conjuga's page names; extending it is an owner decision.
- Correct answers auto-advance after ~1.2 s (any tap/key cancels; a
  "Siguiente ▶" button is still rendered); misses wait for a manual
  Siguiente so the evidence can be read (UX fix NH-6, 2026-10-30). The
  English hint toggle is always offered, independent of the Pistas setting.
- UX evaluation round (docs/audits/2026-10-30-cuentos-nielsen.md and
  -walkthrough.md): all HIGH/MEDIUM findings applied the same day. Open
  owner items: N1 Ordena has 4 events so one miss caps at 1★ (denominator
  rule); a Cuentos section in /docs (rule 5 — unlinked until owner links).
- The round's passage panel renders WITHOUT glossary buttons so 🔤
  Palabras cannot be answered by tapping the word.
- Map slot copy: "Personajes principales" (distractors never name
  characters who appear in the story).

## 10. Future (not v1)

ElevenLabs clips for story sentences (extend tools/generate-audio.mjs
with `--cuentos`), Descargas/offline packs, more stories (StoryWeaver
CC BY titles, Martí/Pombo/Quiroga/Calleja), a nest-style celebration
layer, teacher class packs.
