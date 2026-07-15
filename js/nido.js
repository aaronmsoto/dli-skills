/**
 * El Nido de Lola (M18.2) — the living nest, Conjuga's meta-progression
 * celebration layer. UNSCORED and 100% DERIVED from existing star data:
 * no recordResult, no new storage, no counters, no empty slots — the nest
 * is a mirror of growth, never a checklist (docs/games-proposal.html).
 *
 * Tiers per group (deterministic, additive only):
 *   0 — nothing yet (the group simply isn't in the nest)
 *   1 — brizna (straw wisp): first star earned anywhere in the group
 *   2 — ramita (twig): every star activity in the group has ≥1 star
 *   3 — flor (flower on the twig): perfect group (30/30)
 *
 * The module renders a semantic list FIRST (screen-reader-real: each item is
 * a focusable element naming its group and tier) with the decorative SVG
 * scene beside it. Motion lives in CSS state classes; reduced-motion swaps
 * to static poses. Spanish item names are tap-to-hear only when an audio
 * backend exists (rule 1: affordances hide, features still work).
 */

const TIER_NAMES = [null,
  { es: "brizna", article: "la brizna", emoji: "🌾" },
  { es: "ramita", article: "la ramita", emoji: "🪵" },
  { es: "flor", article: "la flor", emoji: "🌼" },
];

/** Display metadata for a tier (glyph + Spanish names) — status-glyph
 *  category per the M17 icon rules, shared by the nest list, the results
 *  ceremony, and the home-card badges. */
export function tierMeta(tier) {
  return TIER_NAMES[tier] ?? null;
}

/** tier from a group's derived star facts (pure, unit-testable). */
export function nestTier({ earned, allStarred, perfect }) {
  if (perfect) return 3;
  if (allStarred) return 2;
  if (earned > 0) return 1;
  return 0;
}

/** One-line Spanish summary for the top of the scene and the live region. */
export function nestSummary(items) {
  // a flower is an upgraded twig — count each item once, by its own tier
  const twigs = items.filter((i) => i.tier === 2).length;
  const flowers = items.filter((i) => i.tier === 3).length;
  const wisps = items.filter((i) => i.tier === 1).length;
  if (!items.length) return "El nido de Lola espera su primera brizna. ¡Tú puedes!";
  const parts = [];
  if (twigs) parts.push(`${twigs} ramita${twigs === 1 ? "" : "s"}`);
  if (flowers) parts.push(`${flowers} flor${flowers === 1 ? "" : "es"}`);
  if (wisps) parts.push(`${wisps} brizna${wisps === 1 ? "" : "s"}`);
  const list = parts.length > 2
    ? `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`
    : parts.join(" y ");
  return `El nido tiene ${list}.`;
}

// tiny local element helper (app.js's el() is not exported; this module
// stays dependency-free so the flight (M18.3) can lazy-import it too)
function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    node.append(c.nodeType ? c : document.createTextNode(c));
  }
  return node;
}

// decorative nest scene — one path template per tier, rotated per item so
// twenty twigs are one drawing, not twenty (procedural, payload-cheap)
function nestScene(items) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 240 150");
  svg.setAttribute("class", "nido-scene");
  svg.setAttribute("aria-hidden", "true");
  const add = (name, attrs) => {
    const n = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    svg.append(n);
    return n;
  };
  // the nest bowl (always present — Lola always has a home)
  add("ellipse", { cx: 120, cy: 96, rx: 78, ry: 26, fill: "var(--lola-chest)" });
  add("path", { d: "M42 96 Q120 178 198 96 Q120 140 42 96 Z", fill: "var(--lola-wing)" });
  add("path", { d: "M48 102 Q120 160 192 102", stroke: "var(--lola-body)", "stroke-width": 5, fill: "none" });
  // earned items arc around the rim, oldest group leftmost
  items.forEach((item, i) => {
    const n = items.length;
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = 34 + t * 172;
    const y = 92 - Math.sin(t * Math.PI) * 22;
    const rot = -24 + t * 48;
    const g = document.createElementNS(NS, "g");
    g.setAttribute("transform", `translate(${x} ${y}) rotate(${rot})`);
    g.setAttribute("class", `nido-item-g tier-${item.tier}`);
    const p = document.createElementNS(NS, "path");
    if (item.tier === 1) {
      p.setAttribute("d", "M0 8 Q1 -6 -2 -14");
      p.setAttribute("stroke", "var(--lola-chest)");
      p.setAttribute("stroke-width", "2.5");
    } else {
      p.setAttribute("d", "M-9 8 Q0 -4 9 -12");
      p.setAttribute("stroke", "var(--lola-body)");
      p.setAttribute("stroke-width", "4");
    }
    p.setAttribute("fill", "none");
    p.setAttribute("stroke-linecap", "round");
    g.append(p);
    if (item.tier === 3) {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", "9"); c.setAttribute("cy", "-12"); c.setAttribute("r", "5");
      c.setAttribute("fill", "var(--star)");
      const c2 = document.createElementNS(NS, "circle");
      c2.setAttribute("cx", "9"); c2.setAttribute("cy", "-12"); c2.setAttribute("r", "2");
      c2.setAttribute("fill", "var(--accent)");
      g.append(c, c2);
    }
    svg.append(g);
  });
  return svg;
}

/**
 * Render the nest into a container.
 * items: [{ setId, tier }] tier ≥ 1 only (derived by the caller from stars).
 * opts: { canSpeak: boolean, speak: (text) => void } — audio affordance
 * renders only when a backend exists; the list is fully usable without it.
 */
export function createNido(items, opts = {}) {
  const shown = items.filter((i) => i.tier > 0);
  const wrap = h("div", { class: "nido" });
  wrap.append(h("p", { class: "nido-summary" }, nestSummary(shown)));
  wrap.append(nestScene(shown));
  if (shown.length) {
    wrap.append(h("ul", { class: "nido-list", "aria-label": "Lo que hay en el nido" },
      shown.map((item) => {
        const t = TIER_NAMES[item.tier];
        const label = `Grupo ${item.setId} · ${t.article}`;
        const glyph = h("span", { class: "nido-glyph", "aria-hidden": "true" }, t.emoji);
        if (!opts.canSpeak) return h("li", { class: `nido-item nido-plain tier-${item.tier}` }, glyph, label);
        return h("li", { class: `nido-item tier-${item.tier}` },
          h("button", {
            class: "nido-say", type: "button",
            "aria-label": `${label} — toca para escuchar`,
            onclick: () => opts.speak(t.article),
          }, glyph, label, h("span", { class: "nido-speaker", "aria-hidden": "true" }, " 🔊")));
      })));
  } else {
    wrap.append(h("p", { class: "nido-empty" },
      "Cada estrella nueva trae algo al nido. ",
      h("span", { class: "h-en", lang: "en" }, "Every new star brings something home.")));
  }
  return wrap;
}
