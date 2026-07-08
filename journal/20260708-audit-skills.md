# 2026-07-08 — vendor the four audit skills + METHODOLOGY.md (owner-directed)

**Branch:** `loop/20260708-audit-skills` · docs/tooling only, no product code

- Vendored the four evaluation skills from mastepanoski/claude-skills
  (MIT; upstream LICENSE copied to `.claude/skills/UPSTREAM-LICENSE`,
  attribution README added) into `.claude/skills/`: don-norman-
  principles-audit, nielsen-heuristics-audit, cognitive-walkthrough,
  wcag-accessibility-audit. Future loop sessions in this repo now load
  them as local agent skills — re-evaluations use the exact same
  methodology with no external dependency.
- Added `docs/audits/METHODOLOGY.md`: Conjuga-specific parameters
  (scope, the four personas, core + adversarial tasks, severity scales,
  cross-referencing), the exact measurement procedures (token contrast
  math incl. opacity blending, the vendored axe-core CI gate and its
  npm-prune trap), and the run-output bookkeeping (reports → triage per
  standing owner decision → usability.html refresh → journal).
- Payload test unaffected (.claude/ and docs/ are not app payload).

Validation: `npm test` 46/46 (docs-only otherwise).
