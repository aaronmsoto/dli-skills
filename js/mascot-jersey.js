/**
 * 🇪🇸 Seasonal hero variant (owner-approved via Claude Design handoff,
 * 2026-07-19): Lola in the Spain jersey — HOME hero only, July 2026
 * only (app.js gates; August reverts automatically, no deploy needed).
 *
 * Source of truth: assets/lola-spain.svg (delivered art, committed
 * verbatim). This module is that drawing with the mascot animation
 * hooks re-applied — root `.lola is-idle`, `.lola-body-g`,
 * `.lola-head`, `.lola-eyes`/`.lola-pupils`, and the `.lola-lids`
 * blink rects (absent from the delivered file) — so the idle bob,
 * blink, and prefers-reduced-motion handling in css/styles.css work
 * unchanged. Colors stay inlined per the delivered asset (a costume
 * keeps its identity in both themes). Separate module on purpose:
 * js/mascot.js has its own 8 KB budget (tests/payload.test.mjs).
 */

/** Same signature/geometry as svgMarkup in js/mascot.js. */
export function jerseyMarkup(size) {
  const height = Math.round((size * 140) / 120);
  return `
<svg class="lola is-idle" width="${size}" height="${height}" viewBox="0 0 120 140">
  <defs><clipPath id="espWingL"><ellipse cx="24" cy="101" rx="12" ry="24" transform="rotate(14 24 101)"/></clipPath><clipPath id="espWingR"><ellipse cx="96" cy="101" rx="12" ry="24" transform="rotate(-14 96 101)"/></clipPath><clipPath id="espBody"><ellipse cx="60" cy="96" rx="33" ry="38"/></clipPath></defs>
  <g class="lola-body-g">
    <ellipse cx="24" cy="101" rx="12" ry="24" fill="#b08447" transform="rotate(14 24 101)"/>
    <g clip-path="url(#espWingL)"><rect x="6" y="74" width="36" height="15" fill="#23306a" transform="rotate(14 24 101)"/><rect x="6" y="89" width="36" height="2" fill="#e0a54a" transform="rotate(14 24 101)"/></g>
    <ellipse cx="96" cy="101" rx="12" ry="24" fill="#b08447" transform="rotate(-14 96 101)"/>
    <g clip-path="url(#espWingR)"><rect x="78" y="74" width="36" height="15" fill="#23306a" transform="rotate(-14 96 101)"/><rect x="78" y="89" width="36" height="2" fill="#e0a54a" transform="rotate(-14 96 101)"/></g>
    <ellipse cx="60" cy="96" rx="33" ry="38" fill="#c8362f"/>
    <g clip-path="url(#espBody)">
      <rect x="27" y="58" width="66" height="76" fill="#c8362f"/>
      <rect x="37" y="58" width="2" height="76" fill="#b12b25"/>
      <rect x="51" y="58" width="2" height="76" fill="#b12b25"/>
      <rect x="65" y="58" width="2" height="76" fill="#b12b25"/>
      <rect x="79" y="58" width="2" height="76" fill="#b12b25"/>
      <rect x="44" y="58" width="1" height="76" fill="#e0a54a" opacity="0.4"/>
      <rect x="58" y="58" width="1" height="76" fill="#e0a54a" opacity="0.4"/>
      <rect x="72" y="58" width="1" height="76" fill="#e0a54a" opacity="0.4"/>
      <path d="M40 62 Q60 78 80 62 L80 70 Q60 84 40 70 Z" fill="#23306a"/>
    </g>
    <g transform="translate(70 89)" opacity="0.85">
      <path d="M-5 -6 h10 v6 q0 5 -5 8 q-5 -3 -5 -8 Z" fill="#e6cf7d"/>
      <path d="M-5 -6 h10 v2.6 h-10 Z" fill="#d6ba5e"/>
      <ellipse cx="0" cy="-0.5" rx="2.6" ry="2.3" fill="#efe1a4"/>
    </g>
    <ellipse cx="48" cy="133" rx="7" ry="4.5" fill="#e0a458"/>
    <ellipse cx="72" cy="133" rx="7" ry="4.5" fill="#e0a458"/>
  </g>
  <g class="lola-head">
    <circle cx="60" cy="48" r="33" fill="#c99a5b"/>
    <path d="M60 22 C44 20 30 32 33 50 C35 64 47 74 60 76 C73 74 85 64 87 50 C90 32 76 20 60 22 Z" fill="#fff7ec"/>
    <path d="M60 24 L60 72" stroke="#eadfc8" stroke-width="2"/>
    <g class="lola-eyes">
      <circle cx="46" cy="48" r="6.5" fill="#2e2a26"/>
      <circle cx="74" cy="48" r="6.5" fill="#2e2a26"/>
      <g class="lola-pupils">
        <circle cx="48" cy="46" r="2" fill="#fff"/>
        <circle cx="76" cy="46" r="2" fill="#fff"/>
      </g>
      <g class="lola-lids">
        <rect x="38" y="41" width="17" height="14" rx="4" fill="#fff7ec"/>
        <rect x="66" y="41" width="17" height="14" rx="4" fill="#fff7ec"/>
      </g>
    </g>
    <path d="M60 56 L54 66 Q60 71 66 66 Z" fill="#e0a458"/>
  </g>
</svg>`;
}
