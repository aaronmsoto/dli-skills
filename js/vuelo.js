/**
 * El Vuelo de Lola (M18.3; rebuilt M21 "La Travesía", owner pick A+B+C
 * 2026-07-15) — the 60-90s celebration flight, lazy-loaded from the results
 * screen. UNSCORED: no recordResult, no storage, no failure state — wrong
 * clouds simply stay in the sky. The reward IS recognition-mode Spanish:
 * clouds carry conjugated forms sampled from the round just played (the
 * Prodigy test: the fastest route to more fun is more Spanish).
 *
 * M21 shape:
 *  A. TRAVERSAL — progress is physical: Lola visibly flies puff-to-puff
 *     along the journey strip toward the nest; arrival is the finish line
 *     ("help Lola get home" is the mechanic, not a metaphor about one).
 *  B. LISTEN-FIRST — when the caller wires audio (available AND unmuted),
 *     the prompt is heard, not read: an ear game, distinct from Elige.
 *     The ABC toggle reveals the written prompt (equity escape hatch for
 *     deaf/hard-of-hearing learners); voiceless or muted contexts get the
 *     text prompt by default.
 *  C. ATMOSPHERE — parallax cloud drift behind the anchored targets and a
 *     sky that warms toward sunset as the journey progresses. All motion is
 *     CSS gated on prefers-reduced-motion; state swaps stay instant and the
 *     game is identical without it.
 *
 * Constraints (non-negotiable, from the M18 critique): anchored ≥64px tap
 * targets that never travel, no timer, no failure state, reduced-motion
 * parity, flair scales with stars but access never gates.
 */

import { conjugate, PERSONS } from "./conjugator.js";
import { shuffle } from "./game.js";

// tiny local element helper (same pattern as nido.js — the app entry's el()
// is not importable without booting the whole app)
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

function lolaSvg(size = 48) {
  const wrap = h("span", { class: "vuelo-lola", "aria-hidden": "true" });
  wrap.innerHTML = `
<svg width="${size}" height="${size}" viewBox="0 0 60 60">
  <ellipse cx="30" cy="38" rx="16" ry="17" fill="var(--lola-body)"/>
  <ellipse cx="30" cy="41" rx="10" ry="11" fill="var(--lola-chest)"/>
  <path class="vuelo-wing-l" d="M14 36 Q2 30 8 22 Q18 26 20 33 Z" fill="var(--lola-wing)"/>
  <path class="vuelo-wing-r" d="M46 36 Q58 30 52 22 Q42 26 40 33 Z" fill="var(--lola-wing)"/>
  <circle cx="30" cy="20" r="14" fill="var(--lola-body)"/>
  <path d="M30 9 Q20 7 18 14 Q24 12 30 13 Q36 12 42 14 Q40 7 30 9" fill="var(--lola-wing)"/>
  <ellipse cx="24" cy="20" rx="5.5" ry="6" fill="var(--lola-face)"/>
  <ellipse cx="36" cy="20" rx="5.5" ry="6" fill="var(--lola-face)"/>
  <circle cx="25" cy="21" r="2.6" fill="var(--lola-eye)"/>
  <circle cx="35" cy="21" r="2.6" fill="var(--lola-eye)"/>
  <path d="M30 23 l-2.4 3.6 h4.8 Z" fill="var(--lola-beak)"/>
</svg>`;
  return wrap;
}

/** Build the flight's question list from the round's own verbs (covert
 *  micro-review). count clouds per prompt; no prompt repeats a target. */
function buildFlightPrompts(set, tense, persons, promptCount, cloudCount) {
  const pool = [];
  for (const verb of set.verbs)
    for (const p of persons) pool.push({ verb, person: p, form: conjugate(verb, tense)[p] });
  const targets = shuffle(pool).slice(0, promptCount);
  return targets.map((t) => {
    const wrong = shuffle(pool.filter((c) => c.form !== t.form)).slice(0, cloudCount - 1);
    return { ...t, clouds: shuffle([t, ...wrong].map((c) => c.form)) };
  });
}

/**
 * createVuelo({ set, tense, stars, persons, onSay, onDone }) → overlay element.
 * stars only scales the flair (cloud count / sparkles) — access never gates.
 * onSay(text) is injected by the caller (audio backend + mute rules live
 * there); pass null when no audio backend exists OR sound is muted — that
 * flips the flight from listen-first to text prompts.
 */
export function createVuelo({ set, tense, stars = 1, persons, onSay = null, onDone = null }) {
  const cloudCount = stars === 3 ? 5 : 4; // flair scales, access doesn't
  const prompts = buildFlightPrompts(set, tense, persons, 6, cloudCount);
  const listenMode = !!onSay; // B: hear-first whenever the ear can play
  let i = 0;
  let textShown = !listenMode;

  const live = h("p", { class: "vuelo-live", role: "status", "aria-live": "polite" });
  const promptPill = h("p", { class: "vuelo-prompt" });
  const sky = h("div", { class: "vuelo-sky" });
  const lola = lolaSvg();
  const progress = h("p", { class: "vuelo-progress", "aria-hidden": "true" });
  const spoken = (q) => `${["yo", "tú", "él", "nosotros", "vosotros", "ellos"][q.person]} ${q.form}`;
  // 🔊 replay: in listen mode the target lives in the ear — replay is the
  // primary affordance; rendered only when the caller wired audio.
  const replay = onSay ? h("button", {
    class: "vuelo-replay", type: "button",
    "aria-label": "Escuchar otra vez",
    onclick: () => { if (i < prompts.length) onSay(spoken(prompts[i])); },
  }, "🔊") : null;
  // B: ABC toggle — reveals the written prompt in listen mode. Equity escape
  // hatch: a deaf or hard-of-hearing learner (or a noisy classroom) flips to
  // text in one tap; not persisted, the next flight starts by ear again.
  const textToggle = listenMode ? h("button", {
    class: "vuelo-text-toggle btn", type: "button", "aria-pressed": "false",
    "aria-label": "Ver el texto / Show the text",
    onclick: () => {
      textShown = !textShown;
      textToggle.setAttribute("aria-pressed", String(textShown));
      promptPill.classList.toggle("vuelo-hidden", !textShown);
    },
  }, "ABC") : null;
  promptPill.classList.toggle("vuelo-hidden", !textShown);

  // A: the journey strip — one puff per prompt, the nest at the end, Lola
  // traversing via --vuelo-progress. CSS transitions the flight; reduced
  // motion repositions her instantly. Decorative: the real progress lives
  // in the aria announcements + the n/6 text.
  const puffs = prompts.map(() => h("span", { class: "vuelo-puff" }));
  const journey = h("div", { class: "vuelo-journey", "aria-hidden": "true" },
    puffs,
    h("span", { class: "vuelo-journey-nest" }, "🪺"),
    lola);

  const card = h("div", { class: "vuelo-card", "data-step": "0" },
    h("div", { class: "vuelo-skyband" }),
    h("div", { class: "vuelo-drift vuelo-drift-far", "aria-hidden": "true" }),
    h("div", { class: "vuelo-drift vuelo-drift-near", "aria-hidden": "true" }),
    h("div", { class: "vuelo-content" },
      h("div", { class: "vuelo-top" },
        h("h2", { class: "vuelo-title" }, "El vuelo de Lola"),
        h("button", { class: "vuelo-skip btn", type: "button", onclick: close }, "Saltar ✕")),
      journey,
      h("div", { class: "vuelo-prompt-row" },
        listenMode ? h("span", { class: "vuelo-ear", "aria-hidden": "true" }, "🎧") : null,
        promptPill, replay, textToggle),
      progress, sky, live));

  const overlay = h("div", {
    class: `vuelo ${stars === 3 ? "vuelo-flair" : ""}${listenMode ? " vuelo-listen" : ""}`,
    role: "dialog", "aria-modal": "true", "aria-label": "El vuelo de Lola",
  }, card);

  function setStep(n) {
    card.dataset.step = String(n);
    journey.style.setProperty("--vuelo-progress", String(n / prompts.length));
  }

  function close() {
    overlay.remove();
    onDone?.();
  }

  function showPrompt() {
    if (i >= prompts.length) return land();
    const q = prompts[i];
    promptPill.textContent = `${PERSONS[q.person]} · ${q.verb.inf}`;
    progress.textContent = `${i + 1} / ${prompts.length}`;
    sky.replaceChildren(...q.clouds.map((form) =>
      h("button", { class: "vuelo-cloud", type: "button", onclick: (e) => pick(form, e.currentTarget) }, form)));
    // M20 sticky-hover guard (same pattern as the answer grids): a touch
    // leaves the virtual pointer parked where the tapped cloud was, so a
    // freshly dealt cloud under it would paint :hover as a phantom selection.
    sky.classList.add("no-hover");
    sky.addEventListener("pointermove", () => sky.classList.remove("no-hover"), { once: true });
    lola.classList.remove("vuelo-swoop");
    onSay?.(spoken(q));
  }

  function pick(form, btn) {
    const q = prompts[i];
    if (form !== q.form) {
      // no failure state: the cloud shrugs, the sky keeps floating
      btn.classList.add("vuelo-nope");
      setTimeout(() => btn.classList.remove("vuelo-nope"), 350);
      return;
    }
    btn.classList.add("vuelo-hit");
    puffs[i].classList.add("vuelo-puff-done");
    i++;
    setStep(i); // A: Lola flies one puff closer to home
    lola.classList.add("vuelo-swoop");
    live.textContent = `¡Sí! ${PERSONS[q.person]} ${q.form}`;
    setTimeout(showPrompt, 700);
  }

  function land() {
    sky.replaceChildren();
    promptPill.textContent = "";
    progress.textContent = "";
    replay?.remove();
    textToggle?.remove();
    card.querySelector(".vuelo-content").append(
      h("div", { class: "vuelo-landing" },
        h("span", { class: "vuelo-nest", "aria-hidden": "true" }, "🪺"),
        h("p", { class: "vuelo-done" }, "¡Qué vuelo! ",
          h("span", { class: "h-en", lang: "en" }, "What a flight!")),
        h("button", { class: "btn primary", type: "button", onclick: close }, "Seguir")));
    live.textContent = "¡Qué vuelo! Lola llegó al nido.";
  }

  setStep(0);
  showPrompt();
  return overlay;
}
