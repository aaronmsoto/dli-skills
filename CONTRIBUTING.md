# Contributing to Conjuga (DLI Skills)

Thank you for your interest in Conjuga! This guide covers conventions for
both automated loop agents and human contributors.

## Getting started

```bash
npm test     # unit tests (node --test)
npm run e2e  # headless Chromium end-to-end suite
npm start    # local dev server (python3 -m http.server 8080)
```

No build step, no framework, no install beyond dev tooling. The app is
plain ES modules served statically.

## Branch model

All work flows through `dev` before reaching `main`:

```
loop/<yyyymmdd>-<slug>  ──┐
feature/<topic>          ──┼── PR (squash) ──▸ dev ──▸ PR (merge) ──▸ main
claude/<session-slug>   ──┘                          ▲ human only
```

- **`dev`** — integration branch. All PRs target `dev`.
- **`main`** — production. Deploys to GitHub Pages on merge. Only a human
  merges the rolling `Release: dev → main` PR.
- **Never push directly to `dev` or `main`.**

### Branch naming

| Source            | Pattern                            | Example                             |
|-------------------|------------------------------------|--------------------------------------|
| Loop agent        | `loop/<yyyymmdd>-<slug>`           | `loop/20260708-footer-layout`        |
| Session agent     | `claude/<session-slug>`            | `claude/github-repo-context-q2u4i8`  |
| Human contributor | `feature/<topic>` or `dev/<topic>` | `feature/new-verb-group`             |

## Pull request conventions

### PRs into dev (all contributors)

**Title format:**

| Source           | Format                                             |
|------------------|----------------------------------------------------|
| Loop agent       | `loop: <summary>` (or `loop(RED): …` if CI fails) |
| Session / human  | Descriptive title (no prefix required)             |

**Body format** — use the PR template (`.github/pull_request_template.md`):

```markdown
## What

What changed and why.

## Validation

- `npm test` — N/N
- `npm run e2e` — N/N
- Any manual checks performed
```

**Merge method:** squash merge. Loop PRs enable native auto-merge (squash)
after push so CI decides. Session/human PRs may be merged manually once
CI is green.

### Release PRs (dev → main)

- **Title:** `Release: dev → main` (auto-generated, never edit)
- **Body:** auto-maintained by `.github/workflows/release-pr.yml`
- **Merge method:** merge commit (never squash)
- **Merged by:** human only — this merge is the production deploy

## Testing requirements

Every PR must pass both CI checks before merging:

- **`unit`** — `npm test` (conjugation accuracy, invariants, feature tests)
- **`e2e`** — `npm run e2e` (Playwright headless Chromium, all screens)

New UI surfaces must be covered by the e2e suite. Never weaken, skip, or
narrow existing tests to get green.

### Linguistic accuracy

Changes to `js/conjugator.js` or `js/verbs.js` must include tests in
`tests/conjugator.test.mjs` with hand-verified forms (RAE conjugation
tables are the reference).

## Code style

- No build step, no dependencies, no login, no third-party analytics
- ES modules, plain DOM via `el()` helper, hash routing
- No `innerHTML` for user-derived strings
- UI text: Spanish first, short English support
- Touch targets ≥ 44px, dark mode + reduced-motion respected
- Comments only when the "why" is non-obvious

## Privacy

- No accounts, no third-party analytics; no network calls except
  same-origin assets (audio clips) and the disclosed aggregate visit
  beacon (GOAL.md invariant 2 — counts only, never IPs or identifiers)
- Progress in localStorage only (`conjuga.v1`)
- Owner's children appear only as pseudonyms "A1" and "A2"

## Documentation

| File                | Purpose                                 |
|---------------------|-----------------------------------------|
| `CLAUDE.md`         | Agent/contributor technical guide       |
| `GOAL.md`           | North star, milestones, work queue      |
| `docs/LOOP.md`      | Loop agent protocol and guardrails      |
| `docs/SPEC.md`      | Product + technical specification       |
| `docs/STANDARDS.md` | NBPTS/NCSSFL-ACTFL alignment            |
| `about.html`        | Learner/parent-facing standards & privacy |

## License

MIT — see [LICENSE](LICENSE).
