# 2026-07-08 — fix: "¡Empieza aquí!" pill placement (owner bug report)

**Branch:** `loop/20260708-ribbon-fix`

The NN-3 start-here ribbon was absolutely positioned with a top:-10px
overhang outside its card — verified via before/after screenshots: it
floated over the card's top-left boundary, collided with the card above
on mid-grid placements, and rendered differently across devices.

Fix: the pill now lives in the card's normal flex flow (`align-self:
flex-start`, first child above "Grupo N"); the `.set-card
{ position: relative }` helper and the pill's floaty shadow are gone.
Identical rendering at every viewport by construction.

E2e: the ribbon block now asserts the pill's bounding box sits fully
inside its card at both 1100px and 360px — the exact regression class
the owner reported. Full suites green.
