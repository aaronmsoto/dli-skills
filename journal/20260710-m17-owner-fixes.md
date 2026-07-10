# M17 owner design-decisions + icon-system cleanup · 2026-07-10 · loop/20260710-m17-owner-fixes

The owner chose **option (a)** for the two M17 design-decision findings
(NN-7 icon split, DN-6 imperfect badge), then refined the icon direction
mid-implementation: rather than convert *every* emoji to a line-icon,
establish **two clean icon languages** and remove decorative emoji that
have no line-icon.

## DN-6 — imperfect tense badge contrast (option a)

- Light `--tense-imperfect` darkened `#3f9256 → #1f7a45` (a saturated green
  kept distinct from the muted `--brand #2f6b4f`).
- Imperfect badge text switched to white via a new `--tense-imperfect-ink`
  token (light `#fff`, dark `#243026`) → **white on #1f7a45 = 5.35:1**.
- Dark theme unchanged (dark text on the bright green already passed).

## NN-7 / DN-8 — the icon system (option a, refined)

Two languages, cleanly separated:

1. **Activity & tense identity → the Prado line-icon set.** Re-keyed the
   masks from `.mode-card[data-mode=X] .mode-icon` to `.mode-icon[data-icon=X]`
   so the same glyph works anywhere, added a reusable `.mode-icon.mi-inline`
   variant (sized in `em`, tinted `currentColor` → ink in headings, white on
   the green primary buttons), and a `modeIcon(kind, emoji)` helper. Applied
   to the activity **h1 headings** (Estudia / Práctica / Empareja / Contraste)
   and the **Estudia action row** — matching the group cards.
2. **Everything else → text or a functional glyph.** The prompt-tense badge
   became a **text-only colored pill** (the wrong 🌙 moon / ⭐ star gone, incl.
   from the study hint, contrast feedback, and informe headers). Decorative
   nav/menu/footer label emoji (📖 back-links, 📄 Informe, 📚 Docs) **removed**
   for a text-forward look. Genuinely functional/status glyphs kept as a
   separate universal category: 🔊/🔇 sound, 🖨️ print, ℹ️ standards, 🔍 hint,
   and the ⭐/🎧 count glyphs.

Why refined: "line-icons literally everywhere" would mean inventing icons for
nav/footer labels with no natural glyph and busying tiny pills; the moon/star
in the badge were also simply *wrong* metaphors against the star-free
sun/flag/loop triad. Text-forward + line-icons-for-identity is more elegant
and resolves the recognition inconsistency without an emoji purge.

## Gotcha fixed during implementation

The base `.mode-icon` sets `font-size: 0 !important` and
`color: transparent !important` to hide the emoji fallback. The first
`.mi-inline` pass sized icons in `em` (→ 0 against font-size 0) and tinted
with `currentColor` (→ transparent) — invisible. Fix: `mi-inline` restores
`font-size: inherit` + `color: inherit` and hides the emoji with
`text-indent: -9999px; overflow: hidden` instead. Verified in the regenerated
preview screenshots.

## Validation

- `npm test` — 50/50.
- `npm run e2e` — all pass, incl. a new **"M17 owner fixes"** block
  (group-card + heading + action-row line-icons render with a mask and
  non-zero size; imperfect badge white-on-#1f7a45) and both `redesign axe`
  gates (light + forest-night).
- Preview screenshots reviewed: study/contrast headings show line-icons,
  nav/footer are clean text, the tense badge is a text-only pill, the informe
  table has text headers.

## Docs

`docs/audits/norman.md` (DN-6 fixed, DN-8 added, 7/7), `nielsen.md` (NN-7
fixed), `docs/usability.html` (NN-7/DN-8 + DN-6 rows → fixed), `GOAL.md`
(M17 complete, both decisions resolved, queue updated). These + the M17
a11y fixes ship on the next dev→main release.
