# LOOP.md — semi-autonomous iteration protocol

For an AI agent (or a human contributor) running **one bounded development
iteration** on this repo. The human's control points are GOAL.md (what to
build) and PR review (what ships). Everything between those is the loop.

## The loop

1. **Sync & branch.** `git fetch origin main` and create
   `loop/<yyyymmdd>-<slug>` from `origin/main`. Never work on `main` or on
   another iteration's branch.
2. **Load context.** Read `GOAL.md` (current milestone + acceptance criteria),
   the last ~3 entries of `JOURNAL.md`, and `CLAUDE.md`. Check open PRs to
   avoid duplicating in-flight work.
3. **Pick the smallest next step** that advances an unchecked acceptance
   criterion of the CURRENT milestone. One iteration should be reviewable in
   minutes, not hours. If the milestone is complete, ambiguous, or blocked on
   a human decision: **stop and ask** (PR comment or draft PR describing the
   question) — do not invent goals, do not start the next milestone.
4. **Implement** within the product invariants (GOAL.md) and golden rules
   (CLAUDE.md). Any engine/dataset change requires hand-verified tests.
5. **Validate.** `npm test` must be green. Drive every changed screen in a
   real browser (Playwright; chromium path in CLAUDE.md); assert on rendered
   text, not just selectors; capture screenshots of changed UI.
6. **Record.** Append a JOURNAL.md entry (template below) in the same branch.
   Check off any completed acceptance criteria in GOAL.md.
7. **Publish.** Push the branch and open a **draft PR** into `main` titled
   `loop: <summary>`. Body must include: the GOAL.md criteria addressed, test
   results, screenshots, known risks/limitations, and suggested review focus.
8. **Stop.** One iteration = one branch = one draft PR. Do not merge, do not
   iterate again in the same session, do not react to your own PR.

## Hard rules (non-negotiable guardrails)

- **Never push to `main`.** Merging is a human decision; a merge is a deploy.
- **Never merge or mark ready** any PR, including your own.
- **Never modify** `.github/workflows/*`, repo settings, branch protection,
  or this protocol/GOAL.md's invariants — propose such changes in a PR
  description instead, and leave the change itself to a human.
- **No dev deployments.** There is no dev site; validation happens locally
  (tests + browser) and is evidenced in the PR. If it can't be evidenced,
  it isn't done.
- **Red is allowed but loud.** If tests can't be made green within the
  iteration, still push and open the draft PR prefixed `loop(RED):`, explain
  the failure in the PR and JOURNAL. The deploy workflow is test-gated, so a
  red branch can never reach production anyway.
- **Scope discipline.** Nothing outside GOAL.md's current milestone; respect
  the Non-goals list absolutely. New dependencies, build steps, analytics,
  logins: never.
- **Schema care.** Any incompatible localStorage change bumps the versioned
  key (`conjuga.v1` → v2) with a migration or a documented reset.

## JOURNAL entry template

```markdown
## <yyyy-mm-dd> · loop: <summary> (<branch>)

- Goal criteria addressed: <quote the GOAL.md checkbox item(s)>
- What was done: <2-6 bullets>
- Validation: npm test <n>/<n> · <screens driven, screenshots location>
- Decisions & rationale: <anything a future iteration must know>
- Dead ends / gotchas: <what NOT to retry and why>
- Next suggested step: <one line>
```

## Human quick-reference

- **Redirect the loop:** edit GOAL.md (reorder milestones, edit criteria).
- **Ship an iteration:** review its draft PR → mark ready → merge → the
  test-gated workflow deploys `main` to GitHub Pages automatically.
- **Reject an iteration:** close the PR, optionally add a JOURNAL note or a
  GOAL.md clarification so the next loop doesn't repeat it.
- **Recommended repo settings** (one-time, Settings → Branches): protect
  `main` — require a pull request with 1 approval before merging. This makes
  the human gate structural rather than behavioral.
