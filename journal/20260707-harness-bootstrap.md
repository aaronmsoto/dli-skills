# loop: harness bootstrap dry-run · 2026-07-07 · loop/20260707-harness-bootstrap

- Goal criteria addressed: none (process validation — first journal/ entry
  exercising the loop → dev auto-merge pipeline end to end)
- What was done: recorded the harness bootstrap as the inaugural
  per-iteration journal entry; this PR itself is the live test that a
  loop/* branch auto-merges into dev when the required `unit` and `e2e`
  checks pass.
- Validation: npm test 40/40 · e2e pass (CI on this PR is the proof)
- Decisions & rationale: release PRs merge with a merge commit (not squash)
  so dev and main histories stay convergent; loop PRs squash into dev.
- Dead ends / gotchas: release-pr.yml needs "Allow GitHub Actions to create
  and approve pull requests" (Settings → Actions → General) or it fails
  with GraphQL "not permitted"; the github-pages environment must allow
  `main` or deploys are rejected in seconds with zero steps run.
- Next suggested step: begin GOAL.md M2 — scaffold js/sentences.js with the
  data format, integrity tests, and group 1 present-tense sentences.
