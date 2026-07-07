# MASCOT.md — research & design brief for the Conjuga mascot (epic M6)

Status: **research seeded** (2026-07-07); design phase pending; the design
brief at the bottom requires **human approval before any implementation**.

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
  mascot SVG/CSS, total app payload stays < 100 KB.
- **Mobile-first**: designed at 360×640 first; touch targets unaffected;
  the mascot never overlaps interactive controls or the feedback area.
- **Accessibility**: `aria-hidden="true"` on the mascot (purely decorative —
  all feedback remains in the ARIA live region as text);
  `prefers-reduced-motion` swaps every animation for static poses
  (opacity/pose changes only); dark-mode palette variant.
- **Never punitive**: no negative poses; the "miss" state reads as curious/
  encouraging.
- Works with the existing DOM/`el()` architecture; no schema changes.

## Open design decisions (resolve in design phase, with owner)

1. **Name** — working name "Ollie"; bilingual candidates: **Oli** (works in
   both languages), Lola la Lechuza, Búho Beto, Luna. Criteria: easy for
   K-5 to say in Spanish, gender-neutral, no trademark collisions.
2. Species flavor: generic cute owl vs. lechuza (barn owl) silhouette.
3. Where the owl lives on each screen (home greeter / play companion on the
   progress path / results celebration / study observer).
4. Whether the owl's journey persists (e.g., flies further as total stars
   grow) or resets per round.
