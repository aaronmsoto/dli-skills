# Audit methodology — how to (re-)run Conjuga's four evaluations

First run: 2026-07-08 (M10). The generic methodologies are vendored as
agent skills in `.claude/skills/` (MIT, from mastepanoski/claude-skills);
this file records how Conjuga applies them, so a re-run is reproducible
and comparable.

## When to re-run

- After any milestone that adds a screen, activity, or navigation surface.
- Before linking a previously unlinked public page.
- WCAG portion: continuously — the axe-core gate runs in every CI e2e job.

## Project-specific parameters (use these every time)

**Scope:** every routed screen (home, set, study, práctica, choice, type,
match, listen, contrast, informe) + about.html + /docs pages; light AND
dark themes; 360px and ~900-1280px; voiced and voiceless contexts.

**Personas (cognitive walkthrough):**
1. "A2-like" — DLI 3rd grader, shared tablet, emerging reader.
2. "A1-like" — DLI K-5 graduate, phone, skims, wants games fast.
3. Parent — phone, "is my kid progressing?" in under a minute.
4. Teacher — laptop + printer, one screen of instructions max.

**Core tasks:** first visit → finish first Elige round; find & play 🎧
Escucha; use 🔍 Pistas; print a study sheet and the informe; plus one
adversarial fidget task (e.g., mid-round settings toggles).

**Severity scales:** Nielsen 0-4; WCAG Critical/Serious/Moderate/Minor;
Norman catastrophic/high/medium/low. Cross-reference IDs (NN-x, DN-x,
CW-x, WCAG-x) when findings coincide.

## Measurements (repeat exactly)

- **Contrast:** compute WCAG relative-luminance ratios for every text/bg
  token pair in BOTH `:root` blocks of css/styles.css, including
  opacity-blended effective colors. The formula + first-run numbers are
  preserved at the bottom of `wcag.md`.
- **Automated a11y:** `npm run e2e` — the vendored
  `tests/e2e/vendor/axe.min.js` runs on 7 representative routes and
  fails CI on any critical/serious violation. (Do NOT
  `npm i --no-save axe-core` mid-run; npm prunes playwright.)
- **Keyboard/reflow/motion:** the e2e suite already asserts skip-link,
  focus behavior, 360px no-overflow, reduced-motion static poses, print.

## Outputs & bookkeeping (same shape every run)

1. Update the four reports in `docs/audits/` (or append a dated section).
2. Every finding gets an ID, a severity, and a location.
3. Triage per the standing owner decision: auto-fix WCAG
   Critical/Serious, Nielsen sev-3/4, and low-risk quick wins (each fix
   cites its finding ID, with tests); design/pedagogy-changing findings
   become DECISION-PENDING items in GOAL.md with options + a
   recommendation.
4. Refresh `docs/usability.html`: statuses (FIXED / OWNER TRIAGE /
   accepted), date line, and keep the e2e assertions on those statuses
   in sync.
5. Record positives explicitly so they don't get "fixed" away.
6. Journal the run; note the standing limitation (no human screen-reader
   pass) until an SME session closes it.
