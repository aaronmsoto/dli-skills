# design/ — raw Claude Design export (repo source)

This directory holds the **unedited** Claude Design artifact for the M16
Conjuga redesign, kept as repo source of truth. It is **not** part of the
app and is **not** linked from any page or nav — do not import it, serve it
as a route, or count it toward the app payload budget.

## Contents

- **`Conjuga Redesign.dc.html`** — the design export the owner had open when
  the handoff was triggered. It renders via the Claude Design runtime and
  contains all iteration turns; the committed direction is **2a → 3a →
  4a/4b** ("Prado" palette, Baloo 2 + Nunito, sun/flag/loop tense icons,
  the custom line-icon family, and light + dark screens).
- **`support.js`** — the Claude Design runtime the export references
  (`<script src="./support.js">`); kept only so the artifact renders
  standalone. Generated vendor file — do not edit.

## How this maps to the app

The design is **distilled** — not copied — into:

- [`../docs/DESIGN.md`](../docs/DESIGN.md) — the human spec: tokens, type
  scale, spacing, radii, shadows, component inventory, and a screen→route map.
- [`../css/tokens.css`](../css/tokens.css) — the machine tokens (defined,
  not yet applied).

Later M16 tasks (G/T/I\*/RT) work from `docs/DESIGN.md` + `tokens.css` and
do **not** need to re-open this artifact — that is the point of committing R:
every downstream task is loop-capable without design-MCP access.
