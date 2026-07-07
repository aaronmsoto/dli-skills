# MASCOT.md — research & design brief for the Conjuga mascot (epic M6)

Status: **D brief complete** (2026-07-07). Name: Lola la Lechuza. R and D
phases below are the binding spec for implementation iterations I1/I2.

## Why a mascot

Owner direction: kids respond strongly to well-integrated mascot characters —
the reference point is **JiJi®**, the penguin from ST Math (MIND Research
Institute / MIND Education). Conjuga already ships a placeholder owl (🦉);
this epic makes it a real, integrated companion.

## Research: what makes JiJi work

(Sources: mindeducation.org "Who is JiJi?"; Nautilus, "Does a Cartoon Penguin
Make Math Education Great Again?"; M. Peterson TEDxOrangeCoast "Teaching
without words"; ggwash.org/view/34934; mindresearch.org alumni blog.)

- **Character-as-feedback.** JiJi's motion *is* the answer feedback: solve
  the puzzle and JiJi walks across the screen into the next one. The
  character is the progress indicator, not a bolt-on cheerleader.
- **Forward motion = progress.** Crossing the screen replaces points as the
  reward signal.
- **Informative, never punitive failure.** Wrong answers play out as an
  animation showing *why* the path is blocked; JiJi waits patiently through
  unlimited retries. No buzzers, no red X, no scolding.
- **Silence.** JiJi never speaks — removes language load (designed
  partly for ELL/special-needs learners; highly relevant to a DLI audience).
- **Gender/age/race neutrality.** A neutral, non-human animal lets every
  child project their own relationship onto it (helper, guide, or peer).
- **"Helping the character" framing.** Kids aren't being scored; they're
  helping JiJi past obstacles — lowers anxiety, builds real affection
  (JiJi Day, plush toys, fan letters).
- **Scarcity of stimulation.** One character, one goal, no noisy reward
  effects; the learning concept stays center stage.

**IP boundary:** JiJi® is a registered trademark with a copyrighted design.
We borrow the *principles* above only — no penguin, no name similarity, no
visual imitation.

## How the principles map to Conjuga

| Principle | Conjuga application (proposal) |
|---|---|
| Character-as-feedback | The owl reacts to every answer: correct → a small hop/glide forward along a progress path; incorrect → a calm, curious head-tilt while the correction is shown (never sad/angry at the learner) |
| Forward motion = progress | The round's progress bar becomes the owl's flight path across the screen; finishing a round = the owl completing its journey (stars at the landing spot) |
| Informative failure | Owl gestures toward the correct form when shown; the existing corrective feedback stays the star of the moment |
| Silence | The owl NEVER speaks or hoots via TTS — speech stays reserved for Spanish verb forms (pedagogical audio only) |
| Neutrality | Gender-neutral owl; naming decision below |
| Helping framing | Copy shift: "Ayuda a <name> a volar a casa" — each correct answer helps the owl fly home |
| Scarcity of stimulation | One mascot, subtle animations (~600ms), no confetti storms; celebrations reserved for round completion and 3-star moments |

## Constraints (non-negotiable, from CLAUDE.md/GOAL.md)

- Static site, **zero dependencies**: mascot = inline SVG + CSS animations
  (no Lottie, no GIFs, no sprite sheets from CDNs). Budget: ≤ 15 KB for all
  mascot SVG/CSS, total app payload stays < 120 KB (owner-raised 2026-07-07).
- **Mobile-first**: designed at 360×640 first; touch targets unaffected;
  the mascot never overlaps interactive controls or the feedback area.
- **Accessibility**: `aria-hidden="true"` on the mascot (purely decorative —
  all feedback remains in the ARIA live region as text);
  `prefers-reduced-motion` swaps every animation for static poses
  (opacity/pose changes only); dark-mode palette variant.
- **Never punitive**: no negative poses; the "miss" state reads as curious/
  encouraging.
- Works with the existing DOM/`el()` architecture; no schema changes.

## Comparable mascots — what to borrow, what to avoid (R phase)

**Duo (Duolingo)** — the green owl; enormous brand success, but the
cautionary tale for us. Duo's engagement machinery leans on *extrinsic
pressure*: push-notification nagging, streak-loss guilt, passive-aggressive
memes. Effective for adult retention; wrong for K-5 pedagogy and directly
opposed to NBPTS Std V (low-anxiety environments). **Borrow:** the
owl-as-teacher archetype, an instantly readable silhouette, expressive eyes
doing most of the acting. **Avoid:** guilt mechanics, notifications of any
kind, sadness/disappointment poses, any tie between the mascot's mood and
the learner's failures.

**ClassDojo monsters** — proof that a *classroom-culture* mascot works in
K-5: kids name them, draw them, and the characters frame the experience
without living inside the learning content. **Borrow:** rounded shapes and
big eyes (safe, huggable proportions), mascot-as-classroom-identity.
**Avoid:** tying the character to behavior points — our stars measure
mastery, and Lola never judges.

**Scratch Cat (MIT Scratch)** — a silent, neutral tool mascot: the default
sprite that belongs to the kids, never instructs, never gates anything.
**Borrow:** quiet dependable presence owned by the learner. **Avoid (for
us):** being so neutral that no feedback relationship exists — JiJi's core
lesson is that the character should carry the progress signal.

## Motion & attention notes for K-5 (R phase)

- **Feedback animations ≤ ~600 ms**, one at a time; on a miss the child's
  eye must land on the corrective text, so miss-motion stays smaller and
  slower than success-motion.
- **Idle motion minimal** (blink every 4-6 s, gentle 2-3 px bob) — constant
  animation next to reading material harms early-reader attention.
- **Vestibular safety:** spins can cause real discomfort;
  `prefers-reduced-motion` must replace ALL motion — including the
  celebration head spin — with static pose swaps (opacity/pose only).
- Mascot is decorative: `aria-hidden="true"`; no information may exist only
  in the mascot (text + ARIA live region stay authoritative).
- Never animate while the learner is typing (Escribe input focused =
  Lola holds still and watches).

## Design decisions

1. **Name: RESOLVED — Lola la Lechuza** (owner, 2026-07-07). K-5-friendly
   Spanish alliteration; "lechuza" (barn owl) gives the white heart-shaped
   face — a silhouette, palette, and species treatment visually distinct
   from every existing mascot owl (Duo is a round green cartoon owl; no
   imitation risk).
2. **Head spin: ADOPTED as the signature move** (owner request).
   Owl-realistic ~270° look-back turns for small delights; ONE playful full
   360° spin reserved for 3-star celebrations. Static "sparkle-eyed" pose
   under reduced motion.
3. **Species flavor:** lechuza (barn owl) — white heart face, tawny body,
   dark button eyes.
4. Remaining for the D brief (next iteration): per-screen placement map,
   full pose/timing spec, light/dark palettes, copy lines, and whether
   Lola's journey persists across rounds (stars-driven) or resets per round.

## D — Design brief (binding spec for I1/I2)

### Character

A **barn owl (lechuza)** with rounded, huggable K-5 proportions: head ≈ 55%
of total height, pear-shaped body. White heart-shaped facial disc, tawny
golden body, cream chest, dark charcoal button eyes (eyes do most of the
acting), small warm-tan beak, stubby wings, tiny feet. No clothes or
accessories. Gender-neutral styling; "Lola" is a name, not a costume.

SVG structure (one inline component, target ≈2-3 KB):

```
<svg class="lola" viewBox="0 0 120 140" aria-hidden="true">
  <g class="lola-body">   body, chest, wings (.lola-wing-l/r), feet
  <g class="lola-head">   facial disc, eyes (.lola-eyes with eyelid rects), beak
  <g class="lola-sparks"> 3 star sparkles, hidden except celebrations
</svg>
```

`transform-origin` for `.lola-head` at the neck center so head tilts/turns
/spins read naturally; `transform-box: fill-box` for cross-browser SVG
transform sanity.

### Palette (CSS custom properties; dark-mode overrides)

| Token | Light | Dark |
|---|---|---|
| `--lola-face` | #FFF7EC | #F2EAD9 |
| `--lola-body` | #C99A5B | #A8834E |
| `--lola-chest` | #F3E4C8 | #D9C6A0 |
| `--lola-eye` | #2E2A26 | #1E1B18 |
| `--lola-beak` | #E0A458 | #C98F45 |
| sparkles | var(--star) | var(--star) |

### Pose & animation spec

All states are a single class on the `.lola` root; transitions ≤600 ms
(one sanctioned exception below); under `prefers-reduced-motion` every
state maps to a static pose (no keyframes run — poses via non-animated
transforms/opacity only).

| Class | Trigger | Motion | Duration | Reduced-motion pose |
|---|---|---|---|---|
| `is-idle` (default) | screen load | blink every ~5 s (eyelid), 2 px bob loop | loop | static |
| `is-watching` | Escribe input focused | perfectly still, pupils shifted toward input | — | same (static by design) |
| `is-hop` | correct answer | 8 px hop with squash-stretch, tiny wing lift | 450 ms | proud pose (wings slightly out) |
| `is-curious` | wrong answer | gentle 18° head tilt, holds while correction shows | 350 ms | tilted static pose |
| `is-turn` | streak ≥3 · match pair found | quick ~270° look-back head turn and return | 550 ms | side-glance pose |
| `is-spin` | **3-star results only** | full 360° head spin + sparkles + one bounce | 900 ms, once | sparkle-eyed static pose |
| `is-celebrate` | 1-2 star results | double hop + wing flap | 600 ms | wings-out pose |
| `is-hint` | hint panel open (M7) | Lola raises a magnifying glass to her eye and holds it (investigator pose) while the learner studies the column | pose in ≤300 ms, holds | same static pose |

The head spin is the signature move (owner request) and the only sanctioned
>600 ms moment; it fires at most once per results screen.
`is-curious` is deliberately the smallest, slowest motion — the corrective
text must win the child's attention (see K-5 notes above). Lola is never
sad, angry, or disappointed; there is no negative pose in the system.

### Placement map (mobile-first, 360×640 baseline)

| Screen | Lola | Size | Notes |
|---|---|---|---|
| Home hero | idle greeter beside the title; copy "¡Hola! Soy Lola la Lechuza." | 84-96 px | replaces the 🦉 emoji in the h1 |
| Play (Elige/Escribe/Contrast) | perched on the progress bar at the fill edge, advancing with progress; hop on correct, curious on miss; SVG twig **nest at the bar's end** | 48-56 px | helping copy under the header: "¡Ayuda a Lola a llegar a su nido! · Help Lola reach her nest!" — forward motion = progress, arriving at the nest = round complete |
| Empareja | beside the title; `is-turn` on each matched pair | 56 px | board stays uncluttered |
| Results | centered above the stars; 3★ `is-spin`, 1-2★ `is-celebrate`, 0★ `is-idle` + copy "Lola sabe que puedes. ¡Inténtalo otra vez!" | 110-120 px | celebration is the payoff moment |
| Study / Informe / About / Print | **no Lola** | — | scarcity of stimulation; print CSS hides any mascot regardless |

The mascot never overlaps buttons, inputs, or the feedback area; on play
screens she lives strictly inside the header band above the prompt card.

### Journey persistence

**Per-round journey** (each round is one flight to the nest). A persistent
world (e.g., Lola's nest gaining a twig per fully-starred group on the home
screen) is noted as a future idea, explicitly OUT of M6 scope.

### Tech contract (for I1/I2)

- `js/mascot.js` exports `createLola(size)` → `{ el, setState(state) }`;
  state change = class swap only, no JS-driven animation, no timers except
  returning to `is-idle` after one-shot states.
- All motion in styles.css under a `/* -------- lola -------- */` section
  guarded by `@media (prefers-reduced-motion: reduce)` overrides.
- Root carries `aria-hidden="true"`; no semantics, ever.
- Budget: mascot JS+CSS+SVG ≤ 15 KB; app total stays < 120 KB (owner-raised 2026-07-07).
- Print: `.lola` display:none inside `@media print`.
- e2e hooks: state classes are the observable contract (asserted in
  tests/e2e/smoke.mjs).
