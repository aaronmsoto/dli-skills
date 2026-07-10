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

---

## Round 2 (2026-07-10) — Prado redesign (M16)

**Date:** 2026-07-10 · **Auditor:** loop agent (M17 A1′) · same severity
scale. Scope: the now-default "Prado" visual system + the ☰-menu theme
selector. **Behavior, routes, DOM, scoring and ARIA are unchanged from Round
1**, so every Round 1 verdict carries over except where the new *visual* layer
moved it. Round 1's two DECISION-PENDING items (DN-4 footer-toggle restart,
DN-1 first-visit cue) shipped in M10 and are re-verified resolved.

### Principle carry-over (behavior unchanged → verdicts hold, mostly improved)

- **Feedback — strength (visually richer).** Same ~100ms loop; Prado adds
  semantic color (green/red `.choice` borders + tinted fills, brand progress
  fill, hue-coded tense badges). ARIA live still mirrors all of it.
- **Conceptual model — strength (reinforced).** The conjugation TABLE is
  intact; Prado adds a coherent tense triad (sun/amber presente,
  flag/persimmon pretérito, loop/green imperfecto) applied consistently.
- **Mapping — strength (extended).** Fixed person rows, frequency columns,
  Lola-to-nest motion, star tiers all unchanged; tense→hue→icon is a clean new
  natural mapping.
- **Constraints — strength (holds).** Structural prevention unchanged.
- **Affordances — strength (improved); DN-2 unchanged.** 22px radius cards +
  `--shadow-card` + hover lift read more pressable than Round 1. DN-2
  (`.cell-speak` afforded only via the hint line) still low, still accepted.
- **Discoverability — now a strength (was medium).** DN-1 fixed: the
  persimmon "¡Empieza aquí!" pill is the sole saturated element on the card
  grid; it reads as the entry point at a glance.

### Signifiers — the one principle Prado moved (light-theme contrast)

- **DN-5 · medium · = WCAG-6 / NN-6** — filled ★ progress glyph `--star`
  2.41:1 on white (< 3:1 non-text), a regression of the M10-fixed 3.3:1.
  **Found 2026-07-10 · FIXED 2026-07-10** (glyph-only `--star-glyph #b8770f`,
  3.69:1; pill fill unchanged).
- **DN-7 · low · = WCAG-9** — theme-selector active state signalled only by a
  ~1.17:1 fill swap. **Found 2026-07-10 · FIXED 2026-07-10** (2px `--brand`
  border on the pressed option).
- **DN-6 · medium · FIXED 2026-07-10 (owner chose option a)** — the imperfect
  tense badge put dark text on `--tense-imperfect #3f9256` = **3.58:1** (both
  dark and white text failed this mid-tone hue). **Resolved:** the light
  imperfect hue was darkened to a saturated `#1f7a45` (kept distinct from the
  muted `--brand #2f6b4f`) and the badge text switched to white via
  `--tense-imperfect-ink` — **white on #1f7a45 = 5.35:1**. Dark theme keeps
  dark text on its bright green (7.63:1).
- **DN-8 · low · FIXED 2026-07-10 (owner-directed icon-system cleanup)** —
  the mapping/signifier split flagged in Round 2 (activity/tense line-icons on
  the group cards but *emoji* elsewhere, incl. a **wrong 🌙 moon and ⭐ star**
  in the prompt-tense badge and informe headers that contradicted the
  star-free sun/flag/loop triad). **Resolved into two clean icon languages:**
  the Prado **line-icon set** now marks activity identity everywhere it
  appears (group cards + activity `h1` headings + the Estudia action row, via
  a reusable `.mode-icon.mi-inline`); the tense badge became a **text-only
  colored pill** (moon/star gone); decorative nav/footer/label emoji (📖 📄 📚)
  were **removed** for a text-forward look; and genuinely functional glyphs
  (🔊 🖨️ ℹ️ 🔍, plus ⭐/🎧 status counts) were kept as a deliberately separate
  category.

### Prioritized (Round 2)

1. **DN-5** star glyph 2.41:1 — FIXED (regressed M10 WCAG-2).
2. **DN-6** imperfect tense-badge text 3.58:1 — FIXED (hue → #1f7a45 + white text).
3. **DN-7** theme-selector active state — FIXED.
4. **DN-8** activity/tense icon-system split — FIXED (line-icons for identity, text elsewhere).

**Overall:** Prado is a net Norman gain — discoverability closed out,
feedback/affordances/mapping visibly strengthened, the model reinforced by
the tense triad. Behaviorally **7/7 principles at strength**; the visual layer
briefly reopened Signifiers (light-contrast items + the icon split), **all now
fixed**. Post-fix score: **7/7** — the two icon languages (line-icons for
identity, text/functional glyphs elsewhere) close the last consistency gap.
