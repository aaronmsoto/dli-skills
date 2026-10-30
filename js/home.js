/**
 * 🏠 Site homepage module (M31 B/C — docs/SPEC.md §4.7). The root of
 * dliskills.com is an app chooser: Lola greets, two cards link 🦉 Conjuga
 * (conjuga/) and 📚 Cuentos (cuentos/). This module only mounts Lola and
 * fills each card's progress line from the apps' OWN localStorage keys
 * (read-only — conjuga.v1 / cuentos.v1 are never written here). 🎧 badge
 * keys (Conjuga `.listen`, Cuentos `.escucha`) are a parallel track and
 * never count toward stars (CLAUDE.md standing rule 3). Every read is
 * guarded: a missing or corrupt store just shows "¡Empieza aquí!".
 */
import { createLola } from "./mascot.js";
import { pageView } from "./beacon.js";

/** Sum best[*].stars, skipping the badge-track suffix. Pure (unit-testable). */
export function sumStars(raw, badgeSuffix) {
  try {
    const best = JSON.parse(raw || "{}")?.best;
    if (!best || typeof best !== "object") return 0;
    let total = 0;
    for (const [key, entry] of Object.entries(best)) {
      if (key.endsWith(badgeSuffix)) continue;
      const s = Number(entry?.stars);
      if (Number.isFinite(s) && s > 0) total += s;
    }
    return total;
  } catch {
    return 0;
  }
}

function readKey(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function fillProgress(node, n) {
  const en = document.createElement("span");
  en.className = "h-en";
  en.lang = "en";
  if (n > 0) {
    node.textContent = `⭐ ${n} ${n === 1 ? "estrella" : "estrellas"}`;
    en.textContent = ` · ${n} ${n === 1 ? "star" : "stars"}`;
  } else {
    node.textContent = "¡Empieza aquí!";
    en.textContent = " Start here";
    node.classList.add("is-fresh");
  }
  node.append(en);
}

if (typeof document !== "undefined") {
  try {
    const slot = document.querySelector(".site-lola");
    if (slot) slot.append(createLola(84).el);
  } catch { /* decorative — never break the page */ }

  const apps = [
    ["conjuga", "conjuga.v1", ".listen"],
    ["cuentos", "cuentos.v1", ".escucha"],
  ];
  for (const [app, key, badge] of apps) {
    try {
      const node = document.querySelector(`.app-card[data-app="${app}"] .app-progress`);
      if (node) fillProgress(node, sumStars(readKey(key), badge));
    } catch { /* progress line is optional */ }
  }

  pageView("site"); // M28/M31 aggregate view count (all guards inside beacon.js)
}
