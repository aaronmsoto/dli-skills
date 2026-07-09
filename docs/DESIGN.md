# DESIGN.md — Conjuga visual system (M16 redesign)

Source of truth for the M16 reskin. Distilled from the Claude Design export
committed at [`design/Conjuga Redesign.dc.html`](../design/Conjuga%20Redesign.dc.html)
(the raw artifact — repo source, **not** linked from app nav). The machine
copy of these values lives in [`css/tokens.css`](../css/tokens.css).

> **Status: spec only (task R).** `tokens.css` is defined but **not applied**
> — it is unlinked and scoped to `:root[data-redesign]`, which nothing sets
> yet. Wiring the gate is task **G**; per-screen migration is **I\***; the
> human `main` flip is **FLIP**. Nothing here changes the live app.

## The committed direction — "Prado"

After three turns of iteration the owner settled on **2a → 3a → 4a/4b**:

- **Palette "Prado"** — warm, earthy, forest-themed: leaf **green** brand +
  **persimmon** accent on a soft cream ground. Retires the old purple
  "AI" brand (`--brand: #7c3aed`).
- **Type** — **Baloo 2** (rounded display) for headings/wordmark/labels,
  **Nunito** for body and answer buttons. Retires Comic Sans.
- **Tense icons** — a star-free triad so the tense cue never collides with
  the ★ progress star: **sun** (Presente · *ahora*), **planted flag**
  (Pretérito · *una vez*), **repeat loop** (Imperfecto · *muchas veces*).
  Replaces the ☀️⭐🌙 emoji.
- **Custom line-icon family** — one 2px-stroke, rounded, `currentColor`
  family replacing the mismatched activity emoji.
- **Lola la Lechuza** — kept, re-themed only, via `--lola-*` tokens.
- **Dark mode** — a warm **forest-night** palette (replaces the old
  blue-purple night), following `prefers-color-scheme`, plus the manual
  Auto/Light/Dark selector that task T adds.

Functional invariants (routes, sampling, scoring, `STARS_PER_SET = 30`,
localStorage schema, TTS/clips, 🔍 hints, 🧱 Práctica-unscored, print) are
untouched — this document governs **visuals only**.

---

## Color tokens

Token names match `css/tokens.css`. Light = "Prado"; dark = "forest night".

| Token | Role | Light | Dark |
|---|---|---|---|
| `--bg` | page ground | `#fbf6ea` | `#191e17` |
| `--card` | card / surface | `#ffffff` | `#252c22` |
| `--ink` | primary text | `#243026` | `#eef1e9` |
| `--ink-soft` | secondary text | `#5c6558` * | `#a3ad98` |
| `--brand` | leaf-green brand | `#2f6b4f` * | `#74c489` |
| `--brand-tint` | soft brand fill (`--brand-2`) | `#e3f2df` | `#2c3a2b` |
| `--accent` | persimmon accent | `#e37a4f` | `#f0946a` |
| `--good` | correct | `#2f8a52` | `#6cc888` |
| `--good-bg` | correct fill | `#dff2e2` | `#243a22` |
| `--bad` | incorrect | `#c2492f` | `#ef8a6f` † |
| `--bad-bg` | incorrect fill | `#f8e2da` | `#3a231c` † |
| `--star` | progress stars (amber) | `#e0982f` | `#f3b750` |
| `--tense-present` | sun hue | `#e0982f` | `#f3b750` |
| `--tense-preterite` | flag hue | `#e37a4f` | `#f0946a` |
| `--tense-imperfect` | loop hue | `#3f9256` | `#74c489` |

**Lola tokens** — `--lola-face`, `--lola-face-line`, `--lola-body`,
`--lola-wing`, `--lola-chest`, `--lola-eye`, `--lola-beak`. Light:
`#fff7ec / #eadfc8 / #c99a5b / #b08447 / #f3e4c8 / #2e2a26 / #e0a458`.
Dark: `#f2ead9 / #d9cbae / #a8834e / #8f6e3e / #d9c6a0 / #1e1b18 / #c98f45`.

\* **Darkened from the artifact for WCAG AA.** The design mocks the light
palette at `--brand: #3f9256` and `--ink-soft: #6c7568`; both fail the
4.5:1 text-contrast bar (3.84 and 4.44 respectively). During I\* the axe
gate flagged them and they were darkened to `#2f6b4f` (5.85:1 vs `#fff`,
5.7:1 vs `--bg`) and `#5c6558` (5.35:1 vs `--bg`). Dark values were
already safe against the forest-night ground and stay unchanged.

† **Derived, not in the artifact.** The dark mock (4b) never draws an error
state, so `--bad`/`--bad-bg` dark are proposed values (warm terracotta on a
deep ground). Flagged for owner/SME confirmation during I\*; verify contrast
(≥ 4.5:1 for text) before applying.

**Contrast note.** The star amber was chosen against WCAG non-text contrast
(the old system documented 3.3:1 on white / 6.29:1 on dark). Re-verify every
new pairing with axe during I\* — the M16 gate runs axe on the preview.

---

## Type scale

Two families, mapped by role. Sizes are as drawn in the 394px artifact; the
migration maps each **role** onto the app's existing rem rhythm rather than
hard-coding these px.

| Token | Family / weight | Size | Used for |
|---|---|---|---|
| `--fs-wordmark` | display 800 | 31px | "Conjuga" hero wordmark |
| `--fs-h2` | display 800 | 20px | screen title (Grupo N, Estudia) |
| `--fs-results` | display 800 | 22px | results score ("8 de 10") |
| `--fs-prompt` | display 600 | 23px | play prompt verb |
| `--fs-title` | display 700 | 15px | card / group title |
| `--fs-answer` | body 800 | 15px | answer buttons |
| `--fs-section` | display 700 | 12.5px | numbered section headers |
| `--fs-body` | body 400/600 | 11.5px | running text |
| `--fs-caption` | body | 10.5px | secondary labels |
| `--fs-fine` | body | 9px | footer fine print |

- `--font-display: "Baloo 2", ui-rounded, "Segoe UI Rounded", system-ui, sans-serif`
- `--font-body: "Nunito", ui-rounded, system-ui, -apple-system, "Segoe UI", sans-serif`

> **No external fonts (M16 hard constraint).** Do **not** add a Google Fonts
> `<link>` (external font + tracker, and it would blow the budget). Either
> self-host a woff2 **subset** of Baloo 2 + Nunito inside the 100 KB gzip
> code budget, or ship the system stacks above. `tokens.css` counts toward
> `tests/payload.test.mjs`.

---

## Spacing

Design uses 2px granularity; the load-bearing steps are tokenized:
`--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`,
`--space-5: 20px`, `--space-6: 24px`. Screen body padding
`--pad-screen: 18px 16px 20px`; card padding `--pad-card: 12px 13px`.
Common grid gaps: 8–10px (tile grids), 9px (answer grid), 12–16px (sections).

## Radii

| Token | Value | Used for |
|---|---|---|
| `--radius-xs` | 5px | kbd number chips |
| `--radius-sm` | 11px | review rows |
| `--radius-table` | 14px | conjugation-table clip |
| `--radius-md` | 16px | answer buttons, activity tiles, review boxes |
| `--radius-lg` | 22px | cards, prompt card, hero band |
| `--radius-pill` | 999px | badges, chips, progress bar |

(The 30px device shell in the artifact is mock-frame chrome, not an app radius.)

## Shadows / elevation

| Token | Value (light) |
|---|---|
| `--shadow-sm` | `0 1px 4px rgba(30,40,30,.08)` |
| `--shadow-card` | `0 2px 8px rgba(30,40,30,.08)` |
| `--shadow-raised` | `0 2px 10px rgba(30,40,30,.08)` |
| `--shadow-pop` | `0 12px 30px rgba(30,40,30,.16), 0 2px 6px rgba(30,40,30,.1)` |

Dark deepens the alpha (`rgba(0,0,0,.4–.5)`) — see `tokens.css`.

---

## Icon family

One line family: `viewBox 0 0 24 24`, `stroke-width 2`, round caps/joins,
`currentColor` (so any icon inherits `--brand` / `--accent` / `--star` etc.).
Shipped as `<symbol>` defs referenced by `<use href="#id">`. Solid glyphs
(star, tense dots) use `fill="currentColor"`.

| id | Glyph | Meaning |
|---|---|---|
| `i-star` / `i-star-o` | star (solid / outline) | progress (the **only** scorekeeper) |
| `i-head` | headphones | 🎧 Escucha badge track |
| `i-book` | open book | Estudia |
| `i-grid` | table grid | 🧱 Práctica |
| `i-choose` | radio list | Elige (choice) |
| `i-pencil` | pencil | Escribe (type) |
| `i-link` | linked cards | Empareja (match) |
| `i-fork` | verb splitting two ways | ⚔️ Reto / Contraste |
| `i-sun` | sun | Presente tense |
| `i-flag` | planted flag | Pretérito tense |
| `i-loop` | repeat loop | Imperfecto tense |
| `i-search` | magnifying glass | 🔍 Pistas (ties to Lola's lens) |
| `i-info` | info circle | contextual page info |
| `i-speaker` | speaker | sound toggle (optional; may stay a text row) |
| `i-menu` | ☰ | site menu |
| `i-back` | chevron | back nav |

`i-tl-now` / `i-tl-once` / `i-tl-many` are the rejected 3b "timeline" tense
alternates — retained in the artifact for reference, **not** used.

Emoji retired by this system: ☀️⭐🌙 (→ sun/flag/loop), 🧱🎧🔍✅✏️🧩⚔️
(→ line icons). The mascot stays inline SVG (≤ 15 KB budget).

---

## Component inventory

- **Buttons — answer** — `--radius-md`, 3px border, `--font-body`
  `--fw-extrabold` `--fs-answer`; default `border: transparent` on `--card`
  with `--shadow-card`; correct = `3px solid --good` on `--good-bg`. Leading
  `<kbd>` number chip (`--radius-xs`, `--brand-tint` fill). Targets ≥ 44px.
- **Buttons — pill actions** (Otra vez / Siguiente, Elige/Escribe chips) —
  `--radius-pill`, `--font-display` `--fw-bold`; primary = `--brand` fill,
  secondary = `--card` + hairline border.
- **Cards — set / group** — `--radius-lg`, `--pad-card`. Active card =
  `--brand-tint` fill + `2px solid --brand`; the "start here" card carries an
  `--accent` "¡Empieza aquí! · Start" pill. Inactive = `--card` +
  `--shadow-card`. Footer row = ★ progress + `n/27`.
- **Prompt card (play)** — `--radius-lg` `--card` `--shadow-card`, centered.
  Top-right `i-info`; a tense chip (tense hue fill, pill) at top; prompt in
  `--font-display` `--fw-semibold` `--fs-prompt` with the person in `--brand`
  and a blanked verb; verb + English gloss in `--ink-soft` below. Below the
  answer grid: a **Pista** chip (`i-search`, `--accent`) — pill, hairline
  `--brand-tint` border.
- **Conjugation tables (Estudia)** — wrapper `--radius-table` +
  `--shadow-card`; `--brand-tint` header row; verb column heads +
  person-column row heads in `--brand` `--fw-bold`; zebra rows via
  `color-mix(--brand-tint 40%, transparent)`; tap-a-form-to-hear (`i-speaker`
  affordance). **Frozen persons column preserved (M13).**
- **Progress** — ★ stars in `--star` (filled) vs `rgba(…, .16/.2)` (empty);
  the 🎧 Escucha badge track is a **separate** headphone meter (`80%`), never
  mixed into the star denominator. Play screen has a `--brand` progress bar
  (`--radius-pill`) toward "Lola's nest".
- **☰ menu** — top-right `i-menu` trigger (`--ink-soft`); opens the existing
  `.menu-panel` nav. The 🔊 Sonido row stays; task **T** adds the
  Auto/Light/Dark segmented control directly below it. Keep focus-trap / Esc.
- **Footer** — centered row: **"Dual-Language Immersion (DLI) Skills"** +
  Informe + Acerca de links (`--ink-soft`), then the family credit line
  *"Un proyecto familiar · Lucía Perales, EdD · Aaron Soto, MHCID"* in
  `--fs-fine`. Home also shows **"parte de DLIskills.com"** under the
  wordmark (plain text until the domain serves — national-standards branding,
  CLAUDE.md rule 6).
- **Lola placement** — see per-screen map. Re-themed via `--lola-*`; idle
  bob + blink honor `prefers-reduced-motion`. Wordmark "Conjuga" sits in
  `--brand` `--font-display` `--fw-extrabold` directly under her.

---

## Screen-by-screen map to routes

Each screen lists the tokens that carry its look. Routes per `js/app.js`.
Icons/emoji shown are the design intent; DOM structure and e2e selectors
stay identical through I\* (gate-only restyle).

### Home — `#/`
Hero band (Lola + wordmark + "12 estrellas" pill), the "start here" Grupo 1
card + Grupo 2 card, **Repasa hoy** review queue, footer.
```css
/* home */
--bg; --brand; --brand-tint;      /* hero gradient band */
--font-display; --fs-wordmark;    /* Conjuga wordmark */
--star;                           /* total-stars pill + card ★ */
--accent;                         /* ¡Empieza aquí! pill */
--radius-lg; --shadow-card;       /* set cards */
--lola-body; --lola-face;         /* mascot (idle) */
```

### Group / set detail — `#/set/:id`
Back + ☰ row, "Grupo N" title + `i-info`, verb-chip row, **1 · Elige un
tiempo** (sun/flag/loop tiles), **2 · Elige una actividad** activity grid,
Reto card.
```css
/* group */
--font-display; --fs-h2; --fs-section;
--tense-present; --tense-preterite; --tense-imperfect;  /* tense tiles */
--brand; --brand-tint; --radius-md; --shadow-card;      /* activity tiles */
--accent;                                               /* i-fork Reto */
--star;                                                 /* per-activity ★ */
```

### Estudia (study tables) — `#/study/:id/:tense`
`i-book` title + `i-info`, tense caption with `i-sun`, the conjugation table,
jump-to chips (Elige / Escribe / Práctica).
```css
/* estudia */
--radius-table; --shadow-card;   /* table wrapper */
--brand; --brand-tint;           /* header row + person heads + zebra */
--tense-present;                 /* tense caption icon */
--ink; --ink-soft; --fs-body;
```

### Práctica (🧱 rebuild, unscored) — `#/practica/:id/:tense`
Same table chrome as Estudia; `i-grid` glyph; **no stars/badges** (M8).
```css
/* practica */
--radius-table; --shadow-card;
--brand; --brand-tint;
--ink; --ink-soft;   /* unscored — no --star here */
```

### Elige (choice) — `#/play/:id/:tense/choice`
Prompt card + 2×2 answer grid + Pista chip; Lola runs toward her nest above
the progress bar.
```css
/* elige */
--radius-lg; --card; --shadow-card;         /* prompt card */
--radius-md; --good; --good-bg; --radius-xs;/* answer buttons + kbd */
--accent;                                   /* Pista (i-search) */
--brand; --radius-pill;                     /* progress bar */
--tense-present; --tense-preterite; --tense-imperfect;  /* tense chip */
```

### Escribe (type) — `#/play/:id/:tense/type`
Prompt card + text input + check; `i-pencil`. Same prompt-card tokens as
Elige, single input instead of the answer grid.
```css
/* escribe */
--radius-lg; --card; --shadow-card;
--ink; --brand; --font-body; --fs-answer;
--good; --good-bg; --bad; --bad-bg;   /* validation feedback */
```

### Empareja (match) — `#/play/:id/:tense/match`
Linked-card pairs (`i-link`); matched pairs snap to `--good`/`--good-bg`.
```css
/* empareja */
--radius-md; --card; --shadow-card;
--brand; --brand-tint;
--good; --good-bg;    /* matched pair */
```

### Escucha (🎧 listen track) — `#/play/:id/:tense/listen`
Parallel **badge** track (`i-head`), never stars. Prompt audio + pick.
```css
/* escucha */
--radius-lg; --card; --shadow-card;
--brand;              /* i-head badge meter — separate from --star */
--good; --good-bg;
```

### Contraste (⚔️ Reto) — `#/play/:id/contrast`
¿Pretérito o imperfecto? `i-fork` splitting one verb into two past choices;
flag vs loop hues carry "una vez" vs "muchas veces".
```css
/* contraste */
--accent;             /* i-fork + flag (preterite) */
--tense-preterite; --tense-imperfect;
--radius-md; --good; --good-bg;
```

### Results (round summary)
End-of-round state within `#/play`: Lola with sparkles, big ★ score,
"Para repasar" review list, Otra vez / Siguiente pills.
```css
/* results */
--star; --fs-results; --font-display;   /* big score */
--brand; --brand-tint; --radius-md;     /* review box */
--lola-body; --lola-face;               /* Lola + sparkles (--star) */
--radius-pill;                          /* action buttons */
```

### Informe (printable report) — `#/informe`
Print-friendly progress table; respects existing print CSS.
```css
/* informe */
--ink; --ink-soft; --brand;
--radius-table; --shadow-card;   /* screen only; print flattens shadow */
--star;                          /* progress marks */
```

### About — `about.html`
Standards + privacy page; wordmark, section cards, footer credit.
```css
/* about */
--bg; --card; --ink; --ink-soft;
--brand; --font-display; --radius-lg;
```

### Docs — `docs/index.html`, `docs/usability.html`
Public docs index + usability report; same tokens as About, editorial layout.
```css
/* docs */
--bg; --card; --ink; --ink-soft;
--brand; --radius-lg; --shadow-card;
```

---

## Open items for later M16 tasks

- **Fonts** — self-host Baloo 2 + Nunito subsets within budget, or ship the
  system stacks (task decision at G/I\*).
- **Dark `--bad` / `--bad-bg`** — confirm the derived values (†) with the
  owner/SME and axe before applying.
- **Speaker icon** — optional; the sound toggle may remain a labeled ☰ row.
- **Theme selector contract** — `tokens.css` already exposes the
  `[data-theme="light"|"dark"]` hooks task **T** needs (default Auto follows
  the OS).
