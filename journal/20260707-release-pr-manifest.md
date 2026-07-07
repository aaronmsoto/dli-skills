# loop: release PR auto-manifest · 2026-07-07 · loop/20260707-release-pr-manifest

- Goal criteria addressed: owner-directed harness change ("each new PR
  contains new/current and relevant information").
- What was done: release-pr.yml now (re)generates the release PR body on
  every push to dev — commit/iteration list from compare(main...dev),
  file/±line diffstat, linked journal/ entries (README excluded), refresh
  timestamp + head sha, and the merge-commit-never-squash reminder. It
  edits the open PR's body (gh pr edit) or creates the PR with the
  manifest if none is open. docs/LOOP.md quick-reference updated.
- Validation: YAML parses; manifest generation simulated locally against a
  fixture compare payload (commit refs, journal links, diffstat verified).
  Live validation occurs on this very merge: the dev push must rewrite
  release PR #17's body with a real manifest.
- Decisions & rationale: compare API caps at 250 commits — far above any
  realistic release size here; loop PR bodies stay protocol-authored (they
  are already rich), so only the bot PR needed automation.
- Dead ends / gotchas: heredoc inside a YAML block scalar — keep the body
  content at the same indent as the script so YAML dedent leaves the
  terminator at column 0.
- Next suggested step: none; M2/typed-Escucha gated on SME, M4 next unheld.
