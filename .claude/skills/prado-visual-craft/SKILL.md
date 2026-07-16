---
name: prado-visual-craft
description: >
  Visual frontend design for Conjuga's "Prado" design system. Use whenever
  creating or changing anything the learner SEES — game graphics, SVG art,
  CSS shapes, icons, animation, color, celebration scenes — or when the
  owner reports something "doesn't look right." Covers the token palette,
  the two icon languages, procedural SVG/CSS shape craft, state-signaling
  patterns, motion and contrast rules, and the mandatory screenshot-verify
  loop. Also use for visual design reviews of existing screens.
---

# Prado visual craft — Conjuga's design-system skill

You are doing VISUAL design work on a K-5 app whose look ("Prado", M16) is
warm, earthy, forest-picnic calm — deliberately NOT neon-gamified. Every
visual change must read clearly to a 5-year-old at arm's length on a
tablet, in BOTH themes, with reduced motion, and under the WCAG bars the
audits enforce. **You cannot judge visual work from code — you must render
and look at it** (see the screenshot-verify loop, step 5; you can read PNG
files directly).

## 1. The system (source of truth: css/tokens.css, docs/DESIGN.md)

- **Grounds:** cream `--bg #fbf6ea` / forest-night `#191e17`; cards
  `--card` (white / `#252c22`), radius `--radius-lg 22px`, soft shadows.
- **Brand:** leaf green `--brand` (#2f6b4f light / #74c489 dark) with
  `--brand-tint` washes. **Accent:** persimmon `--accent` — the ONE
  saturated pop; use sparingly (start-here ribbon, sunset, flower center).
- **Star amber** `--star` / `--star-glyph`; tense triad sun/flag/loop
  (`--tense-*`) is deliberately star-free.
- **Type:** `--font-display` (Baloo 2 stack) for headings/numbers,
  `--font-body` (Nunito stack). System stacks only — never link webfonts.
- **Personality test:** if a change would look at home in a slot machine or
  a neon arcade, it is wrong here. Rounded, soft, warm, one saturated
  accent at a time.

## 2. The two icon languages (M17 rule — binding)

1. **Identity → Prado line icons**: activities/tenses/nest use the 2px
   rounded-stroke mask set (`.mode-icon[data-icon=…]`, `.tense-icon`). New
   identity icons join THIS set (24×24 viewBox, stroke 2, currentColor via
   CSS mask, data-URI in redesign.css).
2. **Status/function → glyph characters**: ⭐ 🎧 🌾 🪵 🌼 🪶 🔊 🖨️ ℹ️ 🔍.
   Decorative label emoji in nav/footers were removed — do not reintroduce.

## 3. Shape craft — how to draw things that look like things

- **Procedural over hand-traced:** build scenes from a few primitives
  (ellipses, quadratic paths) that loop/rotate per item (see the nest in
  js/nido.js — one twig path, rotated). Payload is a budget (<100 KB gzip
  total); every path costs bytes.
- **CSS organic shapes:** a lone `border-radius: 999px` pill does NOT read
  as a cloud/leaf/animal. Compose silhouettes: base pill + 1-2 pseudo-
  element circles with `background: inherit` (so state colors follow), and
  use `filter: drop-shadow(…)` — it wraps the WHOLE alpha silhouette,
  unlike box-shadow which betrays the rectangle. Remember `filter` creates
  a stacking context: `z-index:-1` children sit behind the element's own
  background (useful: puff bottoms hide inside the body).
- **SVG for characters/scenes** (Lola, nest): inline, `aria-hidden`,
  colors ONLY via `--lola-*`/theme tokens so dark mode is automatic. Keep
  eyes/faces expressive — "eyes do most of the acting" (docs/MASCOT.md).
- **Recognizability test:** name the object, then squint at a 360px-wide
  screenshot. If a kid couldn't name it back, reshape it.

## 4. State signaling (interactive things must LOOK interactive)

- Big targets: ≥44px, prefer 56-64px for game surfaces; visible
  `:focus-visible` ALWAYS (outline follows border-radius; offset it).
- Signal states with **background + ink tokens**, never opacity fades
  (opacity washes contrast below WCAG — the M20-1 lesson) and never color
  alone (WCAG 1.4.1).
- **Sticky-hover contract:** any grid that re-renders under a parked touch
  pointer MUST use the `.no-hover` guard (add class on render, clear on
  first `pointermove` — listeners only fire while the pointer is OVER the
  element). Mirror the guard in CSS for every hover rule you add, and give
  e2e a computed-style assertion for it.
- Contrast bars: text ≥4.5:1, non-text ≥3:1, in BOTH themes. Verify with
  the ratio script (section 6) BEFORE shipping; the tokens file documents
  every measured pair — keep that habit.

## 5. The screenshot-verify loop (mandatory for visual changes)

Code that "should look right" usually doesn't on the first try. Loop:

1. Implement against tokens (never hard-coded colors unless measured and
   commented like the existing exceptions).
2. Render it headless and screenshot it — small driver script pattern:
   serve the repo root, drive to the state (seed localStorage if needed,
   `?m18demo=1` forces celebration states), `page.screenshot()`. The e2e
   suite's shots land in `tests/e2e/shots/` (gitignored).
3. **Open and LOOK at the PNG** (you can read images). Check: does the
   shape read? hierarchy? both themes (`settings.theme:"dark"` seed)?
   360px width? reduced-motion variant?
4. Iterate until it reads. Then lock the result with e2e computed-style
   assertions (colors, animation-names, sizes) — screenshots verify for
   you today; assertions verify forever.
5. Motion: EVERY moving rule lives inside
   `@media (prefers-reduced-motion: no-preference)`; the reduced variant
   must be the same feature with instant state swaps. Feedback animation
   ≤~600ms, one thing at a time; celebrations reserved for round completion
   (docs/MASCOT.md scarcity rule).

## 6. Contrast ratio checker (run in Bash, edit pairs as needed)

```bash
python3 - <<'EOF'
def lum(h):
    h=h.lstrip('#'); r,g,b=(int(h[i:i+2],16)/255 for i in (0,2,4))
    f=lambda c: c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
    r,g,b=f(r),f(g),f(b); return 0.2126*r+0.7152*g+0.0722*b
def ratio(a,b):
    la,lb=lum(a),lum(b); hi,lo=max(la,lb),min(la,lb); return (hi+0.05)/(lo+0.05)
for name,(fg,bg) in {"example ink/card":("243026","ffffff")}.items():
    print(name, round(ratio(fg,bg),2))
EOF
```

## 7. Ship checklist

- [ ] Both themes screenshotted and reviewed (light + dark)
- [ ] 360px mobile width checked (no overflow, shapes still read)
- [ ] Reduced-motion behavior verified (feature identical, motion gone)
- [ ] Contrast pairs measured and noted in a comment next to new colors
- [ ] `.no-hover` guard on any re-rendering hover surface + e2e assertion
- [ ] Line-icon vs status-glyph language respected (section 2)
- [ ] Payload: `npm test` (budget test) green; procedural art preferred
- [ ] e2e computed-style assertions lock the result
