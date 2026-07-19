# server/ — Cloudflare setup runbook (owner actions)

This directory will hold the in-repo Cloudflare Worker (vanilla JS, no
framework) for the M28 analytics beacon — and, only if M27 ever unpauses,
the sync-code endpoints join the same Worker. Design: docs/SPEC.md §5.7
(and §5.6). **No Worker code may land here until the M28 beacon-only
privacy amendment in GOAL.md is signed** — this runbook is the vendor-setup
gate's instructions and can be completed before, after, or independently of
that signing (infrastructure setup involves no repo code and no learner
data).

## 1. Account (free)

Create a Cloudflare account at dash.cloudflare.com. The free tier covers
everything M28 needs: Workers 100,000 requests/day, D1 5 GB storage /
5 million rows read/day. No credit card required.

## 2. Domain: Cloudflare does NOT have to be the DNS provider

Two options — the Worker works either way, and GitHub Pages hosting of
dliskills.com is unaffected by both:

- **Option A — workers.dev subdomain (recommended start; zero DNS
  changes).** Every account gets `<name>.<account-subdomain>.workers.dev`
  for free. The beacon would live at e.g.
  `https://conjuga-api.<account>.workers.dev/beacon`. Your current DNS
  provider keeps serving dliskills.com untouched. It is still "our own
  server" (our account, in-repo source) for the amendment's purposes.
  Caveat: some school content filters block `*.workers.dev`; if beacon
  counts ever look implausibly low from school networks, that's the
  first suspect — and the cue to move to Option B.

- **Option B — api.dliskills.com (branded; requires Cloudflare DNS).**
  On the free plan, Workers custom domains require the `dliskills.com`
  zone to be **on Cloudflare** — i.e., moving the domain's nameservers to
  Cloudflare (partial/CNAME zone setup is a Business-plan feature).
  GitHub Pages keeps working: when adding the zone, Cloudflare imports
  (or you recreate) the existing records — the four A records
  185.199.108/109/110/111.153 and the `www` CNAME — and Pages' own HTTPS
  continues to work with those records set to "DNS only" (gray cloud).
  You can switch A→B later at any time with no client-code change beyond
  a one-line endpoint constant.

## 3. API token (if you want Claude/wrangler to deploy for you)

Deploys run with `npx wrangler` (never a repo dependency) authenticated by
`CLOUDFLARE_API_TOKEN`. To let an agent session run the deploy, create a
**scoped** token at dash.cloudflare.com → My Profile → API Tokens →
Create Token:

- Start from the **"Edit Cloudflare Workers"** template, then **add**:
  Account → **D1 → Edit**.
- Scope it to this account only (and, for Option B, the dliskills.com
  zone only). Do NOT use a Global API Key.
- Also note your **Account ID** (dashboard → Workers & Pages → right
  sidebar).

Provide both via the git-ignored `.env` (same pattern as the ElevenLabs
key — NEVER committed, NEVER echoed into logs):

```
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
```

Tokens are revocable and rotatable at any time from the same dashboard
page; revoke after the deploy if you prefer to hand out one-shot access.

## 4. First-time provisioning (once Worker code exists post-amendment)

```bash
npx wrangler@latest d1 create conjuga-db     # one time; note the database_id
npx wrangler@latest deploy                   # from server/, uses wrangler.toml
npx wrangler@latest d1 export conjuga-db --output=backup.sql   # portability proof
```

`wrangler.toml` (committed, no secrets — IDs are not secrets) will bind
the D1 database and, for Option B, declare the custom domain route.

## 5. What stays true regardless of option

- The database stores aggregate counters only — never IPs, cookies, or
  identifiers (GOAL.md M28 amendment text; SPEC §5.7).
- All server source lives in this directory and is reviewable in PRs.
- `wrangler d1 export` yields plain SQLite — the portability escape hatch.
