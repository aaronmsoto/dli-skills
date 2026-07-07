# LOOP.md — semi-autonomous iteration protocol

For an AI agent (or a human contributor) running **one bounded development
iteration** on this repo. Multiple iterations can progress in parallel and
integrate autonomously; the human's control points are GOAL.md (what to
build) and the release PR into `main` (what ships to production).

## Branch model

```
loop/<yyyymmdd>-<slug>   one branch per iteration/task, created from dev
        │  PR + native auto-merge, gated by CI (unit + e2e)
        ▼
dev                      shared integration branch — always CI-green
        │  rolling "Release: dev → main" PR, HUMAN review + merge
        ▼
main                     production — merge = deploy to GitHub Pages (test-gated)
```

- Auto-merge into `dev` is native GitHub auto-merge waiting on the required
  `unit` and `e2e` checks (`.github/workflows/ci.yml`).
- `release-pr.yml` keeps a rolling `Release: dev → main` PR open whenever
  `dev` is ahead. Only a human merges it; that merge is the deploy.

## The loop

1. **Sync & branch.** `git fetch origin dev` and create
   `loop/<yyyymmdd>-<slug>` from `origin/dev`. Never work on `dev`, `main`,
   or another iteration's branch.
2. **Load context.** Read `GOAL.md` (current milestone + acceptance
   criteria), the newest few files in `journal/` (plus JOURNAL.md for older
   history), and `CLAUDE.md`. Check open PRs into `dev` to avoid duplicating
   or colliding with in-flight iterations — prefer work items that touch
   different files than open PRs.
3. **Pick the smallest next step** that advances an unchecked acceptance
   criterion of the CURRENT milestone. One iteration should be reviewable in
   minutes. If the milestone is complete, ambiguous, or blocked on a human
   decision: **stop and ask** (draft PR or issue describing the question) —
   do not invent goals, do not start the next milestone.
4. **Implement** within the product invariants (GOAL.md) and golden rules
   (CLAUDE.md). Engine/dataset changes require hand-verified tests.
5. **Validate locally.** `npm test` green **and** `npm run e2e` green
   (install Playwright per the header of tests/e2e/smoke.mjs). Extend the
   e2e suite to cover any new UI surface — untested surface is how
   auto-merge ships regressions.
6. **Record.** Write `journal/<yyyymmdd>-<slug>.md` (template below) on the
   branch — one file per iteration, so parallel merges never conflict.
   Check off completed acceptance criteria in GOAL.md (only the lines your
   iteration completed).
7. **Publish.** Push the branch, open a PR into **dev** titled
   `loop: <summary>` (body: criteria addressed, test results, screenshots,
   risks), then **enable auto-merge (squash)** on it. CI green → it merges
   itself; CI red → it waits, and fixing it is fair game for a follow-up
   iteration.
8. **Stop.** One iteration = one branch = one PR into dev. Do not merge
   anything manually, do not iterate again in the same session, do not
   react to your own PR.

## Hard rules (non-negotiable guardrails)

- **`main` is production.** Never push it, never open auto-merged PRs into
  it, never touch the rolling release PR beyond reading it. Only a human
  merges to `main`.
- **Auto-merge is allowed into `dev` only**, and only on your own
  `loop/*` PR, and only via native auto-merge (so the CI gate decides).
- **Never modify** `.github/workflows/*`, repo settings, branch protection,
  GOAL.md's invariants/non-goals, or this protocol — propose such changes in
  a PR description and leave the change to a human.
- **E2E is the contract.** A green `unit` + `e2e` is what lets your work
  integrate unreviewed into dev; never weaken, skip, or narrow existing
  tests to get green. If a test is wrong, fixing it *is* the iteration —
  explain in the journal entry.
- **Red never auto-merges.** If you can't get green, push the branch, open
  the PR titled `loop(RED): …`, do **not** enable auto-merge, explain.
- **Scope discipline.** Nothing outside GOAL.md's current milestone; respect
  Non-goals absolutely. No new dependencies, build steps, analytics, logins.
  (Playwright is CI/dev tooling only — it must never become an app
  dependency.)
- **Journal per iteration**: one `journal/*.md` file per loop; never edit
  another iteration's journal file; JOURNAL.md itself is a human-curated
  index — loops don't edit it.
- **Schema care.** Incompatible localStorage changes bump the versioned key
  (`conjuga.v1` → v2) with a migration or documented reset.

## journal/<yyyymmdd>-<slug>.md template

```markdown
# loop: <summary> · <yyyy-mm-dd> · <branch>

- Goal criteria addressed: <quote the GOAL.md checkbox item(s)>
- What was done: <2-6 bullets>
- Validation: npm test <n>/<n> · e2e <pass/fail> · <screens driven>
- Decisions & rationale: <anything a future iteration must know>
- Dead ends / gotchas: <what NOT to retry and why>
- Next suggested step: <one line>
```

## Human quick-reference

- **Redirect the loop:** edit GOAL.md (reorder milestones, edit criteria).
- **Ship to production:** review the rolling `Release: dev → main` PR and
  merge it — deploy.yml republishes GitHub Pages (test-gated).
- **Reject an iteration:** close its PR into dev (pre-merge) or revert the
  squash commit on dev (post-merge); add a GOAL.md clarification so the next
  loop doesn't repeat it.
- **One-time repo settings this model depends on:**
  1. Settings → General → ✅ *Allow auto-merge*.
  2. Settings → Branches → protection rule for `dev`: require status checks
     `unit` and `e2e` to pass (this is what auto-merge waits on).
  3. Protection rule for `main`: require a pull request with 1 approval.
  4. Settings → General → default branch = `main`.
  5. Settings → Environments → `github-pages` → allow `main` to deploy.
