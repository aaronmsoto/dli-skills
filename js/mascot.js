/**
 * Lola la Lechuza — the Conjuga mascot (see docs/MASCOT.md for the binding
 * design brief). A barn owl rendered as inline SVG; every state is a single
 * CSS class on the <svg> root ("is-idle", "is-hop", "is-curious", "is-turn",
 * "is-spin", "is-celebrate", "is-watching"). All motion lives in
 * css/styles.css and is fully disabled under prefers-reduced-motion.
 *
 * Lola is decorative and silent: aria-hidden, never speaks via TTS, never
 * conveys information that isn't also in text (JiJi principles — character
 * as feedback, informative-never-punitive, silence).
 */

const STATES = ["is-idle", "is-hop", "is-curious", "is-turn", "is-spin", "is-celebrate", "is-watching", "is-hint"];

// One-shot states return to idle on their own; the rest hold until changed.
const ONE_SHOT_MS = { "is-hop": 520, "is-turn": 620 };

// Static, trusted markup only — no user-derived strings.
function svgMarkup(size) {
  const height = Math.round((size * 140) / 120);
  return `
<svg class="lola is-idle" width="${size}" height="${height}" viewBox="0 0 120 140">
  <g class="lola-body-g">
    <ellipse cx="26" cy="97" rx="13" ry="26" fill="var(--lola-wing)" transform="rotate(12 26 97)"/>
    <ellipse cx="94" cy="97" rx="13" ry="26" fill="var(--lola-wing)" transform="rotate(-12 94 97)"/>
    <ellipse cx="60" cy="96" rx="33" ry="38" fill="var(--lola-body)"/>
    <ellipse cx="60" cy="102" rx="21" ry="27" fill="var(--lola-chest)"/>
    <circle cx="52" cy="96" r="1.6" fill="var(--lola-body)" opacity="0.5"/>
    <circle cx="66" cy="104" r="1.6" fill="var(--lola-body)" opacity="0.5"/>
    <circle cx="57" cy="112" r="1.6" fill="var(--lola-body)" opacity="0.5"/>
    <ellipse cx="48" cy="133" rx="7" ry="4.5" fill="var(--lola-beak)"/>
    <ellipse cx="72" cy="133" rx="7" ry="4.5" fill="var(--lola-beak)"/>
  </g>
  <g class="lola-head">
    <circle cx="60" cy="48" r="33" fill="var(--lola-body)"/>
    <path d="M60 22 C44 20 30 32 33 50 C35 64 47 74 60 76 C73 74 85 64 87 50 C90 32 76 20 60 22 Z" fill="var(--lola-face)"/>
    <path d="M60 24 L60 72" stroke="var(--lola-face-line)" stroke-width="2"/>
    <g class="lola-eyes">
      <circle cx="46" cy="48" r="6.5" fill="var(--lola-eye)"/>
      <circle cx="74" cy="48" r="6.5" fill="var(--lola-eye)"/>
      <g class="lola-pupils">
        <circle cx="48" cy="46" r="2" fill="#fff"/>
        <circle cx="76" cy="46" r="2" fill="#fff"/>
      </g>
      <g class="lola-lids">
        <rect x="38" y="41" width="17" height="14" rx="4" fill="var(--lola-face)"/>
        <rect x="66" y="41" width="17" height="14" rx="4" fill="var(--lola-face)"/>
      </g>
    </g>
    <path d="M60 56 L54 66 Q60 71 66 66 Z" fill="var(--lola-beak)"/>
    <g class="lola-lens">
      <line x1="85" y1="59" x2="99" y2="77" stroke="var(--lola-eye)" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="74" cy="48" r="11.5" fill="#9ad2f2" opacity="0.22"/>
      <circle cx="74" cy="48" r="11.5" fill="none" stroke="var(--lola-eye)" stroke-width="3"/>
    </g>
  </g>
  <g class="lola-sparks">
    <path d="M22 20 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z" fill="var(--star)"/>
    <path d="M96 12 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="var(--star)"/>
    <path d="M104 44 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 Z" fill="var(--star)"/>
  </g>
</svg>`;
}

/**
 * Create a Lola instance. Returns { el, setState }.
 * `el` is an aria-hidden wrapper span; `setState("is-hop")` etc. swaps the
 * state class (unknown names are ignored). One-shot states self-reset.
 */
export function createLola(size = 64, { markup } = {}) {
  const wrap = document.createElement("span");
  wrap.className = "lola-wrap";
  wrap.setAttribute("aria-hidden", "true");
  // trusted static templates only — the default owl or a seasonal
  // variant module (never user-derived strings)
  wrap.innerHTML = (markup ?? svgMarkup)(size);
  const svg = wrap.querySelector("svg");
  let timer = null;

  function setState(name) {
    if (!STATES.includes(name)) return;
    clearTimeout(timer);
    for (const s of STATES) svg.classList.remove(s);
    svg.classList.add(name);
    if (ONE_SHOT_MS[name]) {
      timer = setTimeout(() => setState("is-idle"), ONE_SHOT_MS[name]);
    }
  }

  return { el: wrap, setState };
}

/** A small twig nest — the goal at the end of Lola's flight path. */
export function createNest(size = 26) {
  const wrap = document.createElement("span");
  wrap.className = "lola-nest";
  wrap.setAttribute("aria-hidden", "true");
  wrap.innerHTML = `
<svg width="${size}" height="${Math.round(size * 0.62)}" viewBox="0 0 60 37">
  <ellipse cx="30" cy="14" rx="26" ry="9" fill="var(--lola-chest)"/>
  <path d="M4 14 Q30 44 56 14 Q30 30 4 14 Z" fill="var(--lola-wing)"/>
  <path d="M6 16 Q30 36 54 16" stroke="var(--lola-body)" stroke-width="2.5" fill="none"/>
  <path d="M10 20 Q30 34 50 20" stroke="var(--lola-beak)" stroke-width="2" fill="none" opacity="0.7"/>
</svg>`;
  return wrap;
}
