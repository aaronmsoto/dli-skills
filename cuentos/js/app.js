/**
 * 📚 Cuentos — UI shell (binding spec: docs/CUENTOS.md). Hash routes:
 *   #/                         Biblioteca (shelf + 🔁 Repasa hoy)
 *   #/cuento/<id>              story screen (key words, level picker, activities)
 *   #/lee/<id>/<n>             📖 Lee — unscored reader
 *   #/juego/<id>/<n>/<act>     activity round (preguntas · verdad · ordena · palabras · mapa · escucha)
 *   #/informe                  printable progress report
 *   #/creditos                 story sources & licenses
 * Shared with Conjuga (imported relatively): js/menu.js (☰ + el()),
 * js/mascot.js (Lola), js/audio.js (clips + TTS), js/storage.js (settings).
 * Beacon: NOT called — the Worker's page allowlist (server/worker.js PAGES)
 * is Conjuga-only, and extending it is a server + privacy-contract change.
 */
import { STORIES, byId } from "./stories.js";
import { ACTIVITIES, STAR_ACTS, LISTEN_ACT, actMeta, buildRound, scoreOrdena, refText, diffWords } from "./activities.js";
import * as store from "./storage.js";
import { STANDARDS_INFO } from "./standards-info.js";
import { createReader, passagePanel, markedSentence, stopReading, closeBubble, reducedMotion } from "./reader.js";
import { el, createMenuButton } from "../../js/menu.js";
import { speak, ttsAvailable, hasClip, initClips } from "../../js/audio.js";
import { createLola } from "../../js/mascot.js";
import { pageView } from "../../js/beacon.js";

const LEVELS = [1, 2, 3];
const LEVEL_META = {
  1: { emoji: "🌱", hint: "Presente · cuento corto", en: "Present tense · short" },
  2: { emoji: "🌳", hint: "Pasado · cuento mediano", en: "Past tense · medium" },
  3: { emoji: "🌲", hint: "Pasado · cuento largo", en: "Past tense · longer" },
};
const STARS_PER_STORY = STAR_ACTS.length * 3 * LEVELS.length; // 45
const STARS_PER_LEVEL = STAR_ACTS.length * 3; // 15
// verified 2026-10-30: redirects to sdcoe.net/common-core-espanol (SDCOE)
const COMMON_CORE = { href: "https://commoncore-espanol.sdcoe.net/", label: "Common Core en Español" };
const PRAISE = ["¡Muy bien!", "¡Excelente!", "¡Genial!", "¡Fantástico!", "¡Perfecto!", "¡Súper!"];
// passage panel per activity: open (evidence-based) · closed (hint) · none.
// Pistas off hides the panel during ordena/mapa only (§8); palabras starts
// closed so the sentence isn't shown three times (NH-15).
const PANEL = { preguntas: "open", verdad: "open", palabras: "closed", ordena: "closed", mapa: "closed", escucha: "none" };
const PISTAS_PANEL = ["ordena", "mapa"];
const AUTO_ADVANCE_MS = 1200; // NH-6: correct answers move on by themselves

const app = document.getElementById("app");
const live = document.getElementById("live");

// ------------------------------------------------------------ audio gating

/** Rule 1 + CUENTOS §6: a 🔊 renders only when THIS text can be heard. */
const speakable = (text) => !!text && (ttsAvailable() || hasClip(text));
/** say() honors the sound setting; 🎧 Escucha calls speak() directly. */
function say(text, rate = 0.85) {
  if (store.getSettings().sound && speakable(text)) return speak(text, rate);
  return Promise.resolve();
}
const soundOn = () => !!store.getSettings().sound;

/**
 * NH-2: a muted tap is never silent-and-invisible. A visible role=status
 * toast (3 s, held while hovered/focused) says sound is off and offers
 * "🔊 Encender", which turns sound on and replays what was asked for.
 */
let toastTimer = 0;
function onMuted(replay) {
  document.querySelector(".cu-toast")?.remove();
  clearTimeout(toastTimer);
  const toast = el("div", { class: "cu-toast no-print", role: "status" },
    el("span", {}, "🔇 El sonido está apagado. ", el("span", { class: "h-en", lang: "en" }, "Sound is off.")),
    el("button", {
      class: "btn primary cu-unmute", type: "button",
      onclick: () => {
        store.setSetting("sound", true);
        for (const sw of document.querySelectorAll(".sound-toggle")) sw.setAttribute("aria-checked", "true");
        toast.remove();
        replay?.();
      },
    }, "🔊 Encender ", el("span", { class: "h-en", lang: "en" }, "Turn on")));
  const arm = () => {
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (!toast.matches(":hover, :focus-within")) toast.remove();
      else arm();
    }, 3000);
  };
  document.body.append(toast);
  arm();
}
/** Every 🔊 outside 🎧 Escucha goes through here (reader, chips, evidence). */
function sayGated(text, rate) {
  if (soundOn()) return say(text, rate);
  onMuted(() => say(text, rate));
  return Promise.resolve();
}
const escuchaAvailable = (level) => level.listen.every((r) => speakable(refText(level, r)));
const anyAudio = () => ttsAvailable() || STORIES.some((s) => s.levels.some((l) => escuchaAvailable(l)));

// ------------------------------------------------------------ small helpers

function announce(msg) {
  live.textContent = "";
  requestAnimationFrame(() => (live.textContent = msg));
}

function mount(...nodes) {
  app.append(...nodes.flat().filter(Boolean));
}

const en = (t) => el("span", { class: "h-en", lang: "en" }, ` ${t}`);

function ssGet(k) {
  try { return sessionStorage.getItem(k); } catch { return null; }
}
function ssSet(k, v) {
  try { sessionStorage.setItem(k, v); } catch { /* private mode */ }
}

function suppressHover(container) {
  container.classList.add("no-hover");
  container.addEventListener("pointermove", () => container.classList.remove("no-hover"), { once: true });
}

function starRow(n, max = 3) {
  return el("span", { class: "stars", role: "img", "aria-label": `${n} de ${max} estrellas` },
    Array.from({ length: max }, (_, i) => el("span", { class: i < n ? "star on" : "star", "aria-hidden": "true" }, i < n ? "★" : "☆")));
}

function badgeRow(n, max = 3) {
  return el("span", { class: "stars badges", role: "img", "aria-label": `${n} de ${max} insignias de escucha` },
    Array.from({ length: max }, (_, i) => el("span", { class: i < n ? "badge on" : "badge", "aria-hidden": "true" }, "🎧")));
}

function actIcon(emoji) {
  return el("span", { class: "cu-act-icon", "aria-hidden": "true" }, emoji);
}

/**
 * Shared overlay dialog (the ℹ️ chrome): focus trap, Escape, scrim click.
 * `build(close)` returns the panel's children. Focus returns to `opener`.
 */
function openDialog({ label, opener, build, onClose = () => {} }) {
  let overlay = null;
  const onKey = (e) => {
    if (e.key === "Escape") return close();
    if (e.key === "Tab" && overlay) {
      const focusables = [...overlay.querySelectorAll("button, a")];
      const i = focusables.indexOf(document.activeElement);
      e.preventDefault();
      focusables[(i + (e.shiftKey ? -1 : 1) + focusables.length) % focusables.length].focus();
    }
  };
  function close({ refocus = true } = {}) {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.removeEventListener("keydown", onKey);
    onClose();
    if (refocus && opener?.isConnected) opener.focus();
  }
  overlay = el("div", { class: "info-overlay", onclick: (e) => { if (e.target === overlay) close(); } },
    el("div", { class: "info-panel", role: "dialog", "aria-modal": "true", "aria-label": label },
      el("button", { class: "info-close", type: "button", "aria-label": "Cerrar / Close", onclick: () => close() }, "✕"),
      build(close)));
  document.body.append(overlay);
  document.addEventListener("keydown", onKey);
  return { overlay, close };
}

/** ℹ️ standards dialog (mirrors Conjuga's infoButton). */
function infoButton(key) {
  const info = STANDARDS_INFO[key];
  if (!info) return null;
  let dlg = null;
  const btn = el("button", {
    class: "info-btn no-print", type: "button", "aria-expanded": "false",
    "aria-label": "Cómo apoya esta página los estándares / How this page supports the standards",
    onclick: () => {
      if (dlg) return dlg.close();
      dlg = openDialog({
        label: "Estándares de esta página", opener: btn,
        onClose: () => { dlg = null; btn.setAttribute("aria-expanded", "false"); },
        build: () => [
          el("p", { class: "info-kid" }, info.kid),
          el("p", { class: "info-en", lang: "en" }, info.en),
          el("p", { class: "info-cites" }, info.cites.join(" · ")),
          el("p", { class: "info-more" }, "Más en el pie de página y en ",
            el("a", { href: "../about.html" }, "Acerca de / Standards"), "."),
        ],
      });
      btn.setAttribute("aria-expanded", "true");
      dlg.overlay.querySelector(".info-close").focus();
    },
  }, "ℹ️");
  return btn;
}

/**
 * NH-11: Borrar uses the in-app dialog (no native confirm): Cancelar is
 * the primary, safe default; erasing is a deliberate second, secondary
 * destructive button. Clears ONLY cuentos.v1 (+ this tab's session marks).
 */
function eraseDialog(opener) {
  // the ☰ drawer closes BEFORE the dialog opens (M30.2 handoff)
  const menuBtn = document.querySelector('.menu-btn[aria-expanded="true"]');
  if (menuBtn) { menuBtn.click(); opener = menuBtn; }
  const dlg = openDialog({
    label: "Borrar progreso / Erase progress", opener,
    build: (close) => [
      el("p", { class: "info-kid" }, "🗑️ ¿Borrar el progreso de Cuentos?"),
      el("p", { class: "info-en" }, "Se borran las estrellas ⭐, las insignias 🎧 y las lecturas de este dispositivo. Conjuga no cambia.",
        en("Erases Cuentos stars, badges, and reads on this device. Conjuga is not affected.")),
      el("div", { class: "cu-dialog-actions" },
        el("button", { class: "btn primary cu-erase-cancel", type: "button", onclick: () => close() }, "Cancelar ", en("Cancel")),
        el("button", {
          class: "btn cu-erase-confirm", type: "button",
          onclick: () => {
            store.resetProgress();
            clearSessionMarks();
            close({ refocus: false });
            announce("Progreso borrado / Progress erased");
            render();
          },
        }, "🗑️ Sí, borrar ", en("Yes, erase"))),
    ],
  });
  dlg.overlay.querySelector(".cu-erase-cancel").focus();
}

function clearSessionMarks() {
  try {
    for (const k of Object.keys(sessionStorage)) {
      if (/^cuentos\.(read|predict)\./.test(k)) sessionStorage.removeItem(k);
    }
  } catch { /* storage blocked */ }
}

function menuButton() {
  return createMenuButton({
    announce,
    soundGate: anyAudio,
    onUnmute: () => { if (speakable("Hola")) speak("Hola"); },
    // mid-round AND mid-read setting changes save WITHOUT re-rendering
    // (Conjuga NN-1 b; NH-8 — the reader keeps predictions and scroll)
    afterSetting: () => { if (!["juego", "lee"].includes(parseRoute().screen)) render(); },
    onReset: () => render(),
    links: { home: "#/", informe: "#/informe", acerca: "../about.html", docs: "../docs/" },
    install: false,
    extraLinks: [
      { href: "#/creditos", label: "Créditos / Story credits" },
      { href: "../", label: "DLIskills · Inicio / Site home" },
      { href: "../conjuga/", label: "Conjuga / Verbos" },
    ],
    switches: ["hints", "sound"],
    switchNotes: { hints: "Muestra 📖 Ver el cuento en 🧩 Ordena y 🗺️ Mapa. / Shows the story during Order & Map." },
    onBorrar: () => { eraseDialog(null); return false; },
  });
}

function crumbs(...links) {
  return el("nav", { class: "crumbs", "aria-label": "Navegación / Breadcrumbs" }, ...links, menuButton());
}

// ------------------------------------------------------------ routing

function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const story = byId(parts[1] || "");
  const n = Number(parts[2]);
  const okLevel = LEVELS.includes(n);
  if (parts[0] === "cuento" && story) return { screen: "cuento", story };
  if (parts[0] === "lee" && story && okLevel) return { screen: "lee", story, n };
  if (parts[0] === "juego" && story && okLevel && actMeta(parts[3] || ""))
    return { screen: "juego", story, n, act: parts[3] };
  if (parts[0] === "informe") return { screen: "informe" };
  if (parts[0] === "creditos") return { screen: "creditos" };
  return { screen: "home" };
}

function routeTitle(r) {
  if (r.screen === "cuento") return `${r.story.title} · Cuentos`;
  if (r.screen === "lee") return `Lee: ${r.story.title} · Nivel ${r.n} · Cuentos`;
  if (r.screen === "juego") return `${actMeta(r.act).es} · ${r.story.title} · Nivel ${r.n} · Cuentos`;
  if (r.screen === "informe") return "Informe / Status · Cuentos";
  if (r.screen === "creditos") return "Créditos / Credits · Cuentos";
  return "Cuentos — Spanish Reading Skills Builder (K-5 DLI)";
}

let keyHandler = null;
document.addEventListener("keydown", (e) => {
  if (!keyHandler || e.ctrlKey || e.metaKey || e.altKey) return;
  if (document.querySelector(".info-overlay") || document.body.classList.contains("menu-open")) return;
  keyHandler(e);
});

function render() {
  const route = parseRoute();
  stopReading();
  closeBubble();
  keyHandler = null;
  document.title = routeTitle(route);
  app.replaceChildren();
  window.scrollTo(0, 0);
  if (route.screen === "cuento") renderStory(route.story);
  else if (route.screen === "lee") renderLee(route.story, route.n);
  else if (route.screen === "juego") renderJuego(route.story, route.n, route.act);
  else if (route.screen === "informe") renderInforme();
  else if (route.screen === "creditos") renderCreditos();
  else renderHome();
  pageView(BEACON_PAGES[route.screen]); // M28/M31 aggregate view count (all guards inside beacon.js)
}

// M31: Cuentos page names — the contract with server/worker.js PAGES
// (one view per route render; results count as the round's view).
const BEACON_PAGES = {
  home: "cuentos-home",
  cuento: "cuentos-story",
  lee: "cuentos-lee",
  juego: "cuentos-juego",
  informe: "cuentos-report",
  creditos: "cuentos-creditos",
};

window.addEventListener("hashchange", render);

document.getElementById("skip")?.addEventListener("click", (e) => {
  e.preventDefault();
  app.focus();
});

// Offline shell: the site-wide worker (../sw.js) caches Cuentos too.
// Same guard as Conjuga so the e2e harness stays SW-free.
try {
  if ("serviceWorker" in navigator && !navigator.webdriver && !sessionStorage.getItem("conjuga.noSW")) {
    navigator.serviceWorker.register("../sw.js").catch(() => {});
  }
} catch { /* storage blocked — skip offline support */ }

// ------------------------------------------------------------ shared bits

const levelOf = (story, n) => story.levels[n - 1];
const hrefJuego = (id, n, act) => `#/juego/${id}/${n}/${act}`;

function attribution(story) {
  const s = story.source;
  return el("p", { class: "cu-attrib" },
    `Adaptado de: ${s.origin.es} · ${s.author} (${s.country.es} `,
    el("span", { "aria-hidden": "true" }, s.country.flag), ") · Dominio público",
    en(`Adapted from: ${s.origin.en}, ${s.author} (${s.country.en}) · Public domain`));
}

function badgesVisible(story) {
  return store.storyBadges(story.id) > 0 || story.levels.some(escuchaAvailable);
}

// ------------------------------------------------------------ Biblioteca

function reviewQueue() {
  const due = store.dueForReview(Date.now(), 8).filter((d) => {
    const story = byId(d.id);
    if (!story || !LEVELS.includes(d.nivel) || !actMeta(d.act)) return false;
    return d.act !== LISTEN_ACT || escuchaAvailable(levelOf(story, d.nivel));
  }).slice(0, 5);
  if (!due.length) return null;
  return el("section", { class: "review-queue", "aria-label": "Repaso de hoy" },
    el("h2", {}, "🔁 Repasa hoy ", el("span", { class: "h-en", lang: "en" }, "(today's review)")),
    el("p", { class: "review-water" }, "¡Repasa para no olvidar!",
      en("Review so you don't forget!")),
    el("div", { class: "review-list" },
      due.map((d) => {
        const story = byId(d.id);
        const m = actMeta(d.act);
        return el("a", { class: "review-item", href: hrefJuego(d.id, d.nivel, d.act) },
          el("span", {}, `${story.emoji} ${story.title} · ${LEVEL_META[d.nivel].emoji} Nivel ${d.nivel} · ${m.icon} ${m.es}`),
          d.act === LISTEN_ACT ? badgeRow(d.stars) : starRow(d.stars));
      })));
}

function renderHome() {
  const totalStars = STORIES.reduce((sum, s) => sum + store.storyStars(s.id), 0);
  const totalBadges = STORIES.reduce((sum, s) => sum + store.storyBadges(s.id), 0);
  const showBadges = STORIES.some(badgesVisible);
  // NH-12 / CW-8: "▶️ Sigue aquí" on the most recently played story while
  // its Nivel 1 is unfinished; "¡Empieza aquí!" only on a fresh device.
  const last = store.lastPlayed();
  const startId = last ? null : STORIES[0]?.id;
  const keepId = last && byId(last.id) && store.levelStars(last.id, 1) < STARS_PER_LEVEL ? last.id : null;
  const lola = createLola(76);

  mount(
    el("header", { class: "hero cu-hero" },
      menuButton(),
      el("h1", { class: "home-title" }, lola.el, "Cuentos"),
      el("p", { class: "brand-sub", lang: "en" }, "part of DLIskills.com"),
      el("p", { class: "lola-greeting" }, "¡Hola! Soy Lola la Lechuza. ¿Leemos un cuento?"),
      el("p", { class: "tagline" }, "Lee cuentos en español y juega con ellos — ¡tres niveles por cuento!"),
      el("p", { class: "tagline-en", lang: "en" }, "Spanish reading comprehension for dual-language learners · read, then play"),
      el("p", { class: "total-stars" },
        `⭐ ${totalStars} / ${STORIES.length * STARS_PER_STORY} estrellas`,
        showBadges ? ` · 🎧 ${totalBadges}/${STORIES.length * 9} insignias` : null)),
    reviewQueue(),
    el("h2", { class: "cu-shelf-title" }, "📚 La biblioteca ", el("span", { class: "h-en", lang: "en" }, "(the library)")),
    el("section", { class: "cu-shelf", "aria-label": "Cuentos" },
      STORIES.map((s) => el("a", { class: "cu-book", href: `#/cuento/${s.id}`, "data-story": s.id },
        el("span", { class: "cu-cover", "aria-hidden": "true" }, s.emoji),
        el("span", { class: "cu-book-title" }, s.title),
        el("span", { class: "cu-book-author" }, `${s.source.author} · `,
          el("span", { "aria-hidden": "true" }, `${s.source.country.flag} `), s.source.country.es),
        el("span", { class: "cu-book-progress" },
          `⭐ ${store.storyStars(s.id)}/${STARS_PER_STORY}`,
          badgesVisible(s) ? ` · 🎧 ${store.storyBadges(s.id)}/9` : null),
        s.id === startId
          ? el("span", { class: "start-here" }, "¡Empieza aquí! ", el("span", { class: "h-en", lang: "en" }, "Start here"))
          : null,
        s.id === keepId
          ? el("span", { class: "start-here cu-keep-going" }, "▶️ Sigue aquí ", el("span", { class: "h-en", lang: "en" }, "Keep going"))
          : null))),
    renderFooter(),
  );
}

// ------------------------------------------------------------ story screen

function renderStory(story) {
  const saved = Number(ssGet(`cuentos.nivel.${story.id}`));
  let n = LEVELS.includes(saved) ? saved : 1;

  const actsHeading = el("h2", { class: "cu-acts-heading", tabindex: "-1" });
  const actsBox = el("div", { class: "cu-acts-box" });
  const fillActs = () => {
    actsHeading.replaceChildren(`3 · Lee y juega — ${LEVEL_META[n].emoji} Nivel ${n} `, el("span", { class: "h-en", lang: "en" }, "(read, then play)"));
    actsBox.replaceChildren(...storyActivities(story, n));
  };
  fillActs();

  const cards = LEVELS.map((lv) => el("button", {
    class: `tense-card cu-level-card ${lv === n ? "selected" : ""}`,
    type: "button", role: "radio", "aria-checked": String(lv === n), "data-level": String(lv),
    onclick: (e) => pickLevel(lv, e.currentTarget),
  },
    el("span", { class: "cu-level-emoji", "aria-hidden": "true" }, LEVEL_META[lv].emoji),
    el("strong", {}, `Nivel ${lv}`),
    el("span", { class: "tense-hint" }, LEVEL_META[lv].hint),
    el("span", { class: "tense-example", lang: "en" }, LEVEL_META[lv].en),
    el("span", { class: "cu-level-stars" }, `⭐ ${store.levelStars(story.id, lv)}/${STARS_PER_LEVEL}`),
    levelBadgesVisible(story, lv)
      ? el("span", { class: "cu-level-badges" }, `🎧 ${store.getBest(story.id, lv, LISTEN_ACT)?.stars ?? 0}/3`)
      : null));

  // NH-4 / CW-2: picking a level swaps ONLY the activities section — no
  // re-render, no jump to the top, focus stays on the chosen card.
  function pickLevel(lv, card) {
    ssSet(`cuentos.nivel.${story.id}`, String(lv));
    n = lv;
    for (const c of cards) {
      const on = Number(c.dataset.level) === lv;
      c.classList.toggle("selected", on);
      c.setAttribute("aria-checked", String(on));
    }
    fillActs();
    card.focus({ preventScroll: true });
    const r = actsBox.getBoundingClientRect();
    if (r.top > innerHeight * 0.6 || r.top < 0) {
      actsHeading.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" });
    }
    announce(`${LEVEL_META[lv].emoji} Nivel ${lv} elegido / Level ${lv} selected`);
  }

  mount(
    crumbs(el("a", { href: "#/" }, "← Biblioteca")),
    el("h1", { class: "cu-story-title" }, el("span", { class: "cu-title-emoji", "aria-hidden": "true" }, story.emoji), story.title),
    attribution(story),
    el("p", { class: "cu-theme" }, "💡 ", el("strong", {}, "Tema: "), story.theme.es, en(story.theme.en)),

    el("h2", {}, "1 · Palabras clave ", el("span", { class: "h-en", lang: "en" }, "(key words)")),
    el("ul", { class: "verb-chips cu-keywords" },
      story.keyWords.map((k) => {
        const inner = [
          el("span", { class: "cu-key-emoji", "aria-hidden": "true" }, k.emoji),
          el("strong", { lang: "es" }, k.es),
          el("span", { class: "gloss", lang: "en" }, k.en),
        ];
        const voiced = speakable(k.es);
        return el("li", { class: voiced ? "chip cu-key" : "chip cu-key cu-key-flat" },
          voiced
            ? el("button", { class: "cu-key-say", type: "button", onclick: () => sayGated(k.es) }, ...inner, el("span", { class: "cu-key-ear", "aria-hidden": "true" }, "🔊"))
            : el("span", { class: "cu-key-static" }, ...inner));
      })),

    el("h2", {}, "2 · Elige un nivel ", el("span", { class: "h-en", lang: "en" }, "(pick a level)")),
    el("div", { class: "tense-row cu-level-row", role: "radiogroup", "aria-label": "Nivel / Level" }, cards),

    actsHeading,
    actsBox,
    renderFooter(),
  );
}

function levelBadgesVisible(story, lv) {
  return escuchaAvailable(levelOf(story, lv)) || (store.getBest(story.id, lv, LISTEN_ACT)?.stars ?? 0) > 0;
}

/** Section 3 of the story screen for one level (swapped in place). */
function storyActivities(story, n) {
  const level = levelOf(story, n);
  const reads = store.getReads(story.id, n);
  return [
    el("div", { class: "mode-row cu-acts" },
      el("a", { class: "mode-card cu-act-card cu-lee-card", "data-act": "lee", href: `#/lee/${story.id}/${n}` },
        actIcon("📖"),
        el("strong", {}, "Lee"),
        el("span", { class: "mode-en", lang: "en" }, "Read the story"),
        reads === 0
          ? el("span", { class: "cu-lee-start" }, "👉 Empieza aquí: lee el cuento ", el("span", { class: "h-en", lang: "en" }, "Start here: read the story"))
          : null,
        el("span", { class: "mode-free" }, `leído ${reads} ${reads === 1 ? "vez" : "veces"} · sin estrellas`)),
      ACTIVITIES.filter((a) => a.track === "stars").map((a) =>
        el("a", { class: "mode-card cu-act-card", "data-act": a.key, href: hrefJuego(story.id, n, a.key) },
          actIcon(a.icon),
          el("strong", {}, a.es),
          el("span", { class: "mode-en", lang: "en" }, a.en),
          starRow(store.getBest(story.id, n, a.key)?.stars ?? 0))),
      escuchaAvailable(level)
        ? el("a", { class: "mode-card cu-act-card listen-card", "data-act": LISTEN_ACT, href: hrefJuego(story.id, n, LISTEN_ACT) },
          actIcon("🎧"),
          el("strong", {}, actMeta(LISTEN_ACT).es),
          el("span", { class: "mode-en", lang: "en" }, actMeta(LISTEN_ACT).en),
          badgeRow(store.getBest(story.id, n, LISTEN_ACT)?.stars ?? 0))
        : null),
    el("p", { class: "cu-print-level no-print" },
      el("a", {
        class: "cu-print-link", href: `#/lee/${story.id}/${n}`,
        onclick: () => ssSet("cuentos.print", "1"),
      }, "🖨️ Imprimir este nivel ", en("Print this level"))),
  ];
}

// ------------------------------------------------------------ Lee (reader)

function levelPills(story, n, hrefFor) {
  // NH-9: one 3-column segmented row ("🌱 1 · 🌳 2 · 🌲 3" at phone width)
  return el("nav", { class: "cu-levels no-print", "aria-label": "Nivel / Level" },
    LEVELS.map((lv) => el("a", {
      class: `cu-pill ${lv === n ? "current" : ""}`, href: hrefFor(lv),
      "aria-current": lv === n ? "page" : null, "aria-label": `Nivel ${lv}`,
    }, `${LEVEL_META[lv].emoji} `, el("span", { class: "cu-pill-word" }, "Nivel "), String(lv))));
}

function activityLinks(story, n, onLeave = () => {}) {
  const level = levelOf(story, n);
  return [
    ...ACTIVITIES.filter((a) => a.track === "stars").map((a) =>
      el("a", { class: "btn primary cu-act-link", "data-act": a.key, href: hrefJuego(story.id, n, a.key), onclick: onLeave },
        actIcon(a.icon), ` ${a.es}`)),
    escuchaAvailable(level)
      ? el("a", { class: "btn primary cu-act-link listen-link", "data-act": LISTEN_ACT, href: hrefJuego(story.id, n, LISTEN_ACT), onclick: onLeave },
        actIcon("🎧"), ` ${actMeta(LISTEN_ACT).es}`)
      : null,
  ];
}

const printBtn = (extra = "") => el("button", {
  class: `btn print-btn ${extra}`.trim(), type: "button", "aria-label": "Imprimir / Print", onclick: () => window.print(),
}, "🖨️", el("span", { class: "cu-print-word" }, " Imprimir"));

function renderLee(story, n) {
  const level = levelOf(story, n);
  ssSet(`cuentos.nivel.${story.id}`, String(n));

  // NH-7: count a read ONCE per (story, level) per tab session, and only
  // on evidence of reading — never on mount or re-render.
  const readKey = `cuentos.read.${story.id}.${n}`;
  const markRead = () => {
    if (ssGet(readKey)) return;
    ssSet(readKey, "1");
    store.recordRead(story.id, n);
  };
  // NH-8: answered prediction stops survive re-renders / pill round trips
  const predictKey = `cuentos.predict.${story.id}.${n}`;
  let predictions = {};
  try { predictions = JSON.parse(ssGet(predictKey) || "{}") || {}; } catch { predictions = {}; }

  const hint = ssGet("cuentos.glossTapped") ? null
    : el("p", { class: "study-hint tap-hint" }, "👆 Toca las palabras subrayadas. ", en("Tap underlined words."));
  const gamesHeading = el("h2", { class: "no-print cu-games-heading", id: "cu-games", tabindex: "-1" },
    "¿Listos? Juega con el cuento ", el("span", { class: "h-en", lang: "en" }, "(ready? play with the story)"));
  const lockNote = el("p", { class: "cu-locked-note no-print", hidden: true },
    "🔒 Después de leer ", el("span", { class: "h-en", lang: "en" }, "After reading"),
    " — ", "responde la predicción para seguir. ", el("span", { class: "h-en", lang: "en" }, "Answer the prediction to keep going."));
  const links = activityLinks(story, n, markRead).filter(Boolean);
  // CW-4: the activity row waits until every prediction stop is answered
  const setLocked = (locked) => {
    lockNote.hidden = !locked;
    for (const a of links) {
      if (locked) {
        a.dataset.href ||= a.getAttribute("href");
        a.removeAttribute("href");
        a.setAttribute("aria-disabled", "true");
        a.classList.add("is-locked");
      } else if (a.dataset.href) {
        a.setAttribute("href", a.dataset.href);
        a.removeAttribute("aria-disabled");
        a.classList.remove("is-locked");
      }
    }
  };

  const reader = createReader(level, {
    speakable, say, speak, soundOn, onMuted, announce,
    predictions,
    onPredict: (after, i) => {
      predictions[after] = i;
      ssSet(predictKey, JSON.stringify(predictions));
    },
    onStopsChange: (done) => setLocked(!done),
    onGloss: () => {
      ssSet("cuentos.glossTapped", "1");
      if (hint) hint.hidden = true;
    },
    onReadDone: markRead,
  });
  setLocked(!reader.stopsDone());

  mount(
    crumbs(el("a", { href: `#/cuento/${story.id}` }, `← ${story.title}`)),
    el("h1", { class: "cu-lee-title" },
      el("span", { class: "cu-title-emoji", "aria-hidden": "true" }, story.emoji),
      el("span", { class: "cu-title-text" }, story.title), infoButton("lee")),
    el("div", { class: "cu-lee-bar no-print" },
      levelPills(story, n, (lv) => `#/lee/${story.id}/${lv}`),
      printBtn("cu-print-top")),
    el("p", { class: "print-fields print-only" },
      `${LEVEL_META[n].emoji} Nivel ${n} · Nombre: `, el("span", { class: "fill-line" }, ""),
      "  Fecha: ", el("span", { class: "fill-line short" }, "")),
    hint,
    // CW-13: keyboard users can jump past 30+ glossary buttons
    el("button", {
      class: "cu-skip-games no-print", type: "button",
      onclick: () => { gamesHeading.focus({ preventScroll: true }); gamesHeading.scrollIntoView({ block: "start" }); },
    }, "Saltar a los juegos · Skip to games"),
    reader.el,
    el("p", { class: "cu-attrib-small" }, `${story.source.author} · ${story.source.origin.es} · Dominio público · Adaptación de DLIskills.com`),
    gamesHeading,
    lockNote,
    el("div", { class: "study-actions cu-actions" }, links, printBtn()),
    renderFooter(),
  );

  // evidence of reading: the last paragraph revealed AND on screen for 2 s
  const lastPara = reader.lastPara;
  if (lastPara && "IntersectionObserver" in window) {
    let dwell = 0;
    const io = new IntersectionObserver((entries) => {
      if (!lastPara.isConnected) { io.disconnect(); clearTimeout(dwell); return; }
      const seen = entries.some((e) => e.isIntersecting) && !lastPara.hidden;
      clearTimeout(dwell);
      if (seen) dwell = setTimeout(() => { if (lastPara.isConnected) { markRead(); io.disconnect(); } }, 2000);
    });
    io.observe(lastPara);
  }
  // CW-11: "🖨️ Imprimir este nivel" from the story screen
  if (ssGet("cuentos.print")) {
    ssSet("cuentos.print", "");
    setTimeout(() => window.print(), 300);
  }
}

// ------------------------------------------------------------ activity rounds

/** replaceChildren that drops null/false children (NH-1: never "null"). */
function fill(node, ...kids) {
  node.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));
  return node;
}

function choiceButton(label, idx, onPick, extra = {}) {
  return el("button", { class: "choice cu-choice", type: "button", onclick: onPick, ...extra },
    el("kbd", { "aria-hidden": "true" }, String(idx + 1)), " ", ...[].concat(label));
}

function englishToggle(text) {
  if (!text) return null;
  const line = el("p", { class: "prompt-en cu-en-line", lang: "en", hidden: true }, text);
  const btn = el("button", {
    class: "cu-en-toggle", type: "button", "aria-expanded": "false",
    onclick: () => {
      line.hidden = !line.hidden;
      btn.setAttribute("aria-expanded", String(!line.hidden));
    },
  }, "💬 En inglés ", el("span", { class: "h-en", lang: "en" }, "English hint"));
  return [btn, line];
}

function renderJuego(story, n, act) {
  const level = levelOf(story, n);
  const meta = actMeta(act);
  if (act === LISTEN_ACT && !escuchaAvailable(level)) {
    // bookmarked/shared link on a voiceless device → back to the story
    location.hash = `#/cuento/${story.id}`;
    return;
  }
  const hints = store.getSettings().hints;
  const panelMode = PISTAS_PANEL.includes(act) && !hints ? "none" : PANEL[act];
  const panel = panelMode === "none" ? null : passagePanel(level, { open: panelMode === "open" });
  const lola = createLola(44);
  const header = el("div", { class: "play-header cu-play-header" });
  const stage = el("div", { class: "stage cu-stage", "data-act": act });

  mount(
    crumbs(
      el("a", { href: `#/cuento/${story.id}` }, `← ${story.title}`),
      el("a", { href: `#/lee/${story.id}/${n}` }, "📖 Lee")),
    el("h1", { class: "cu-round-title" }, actIcon(meta.icon), ` ${meta.es} `,
      el("span", { class: "cu-round-level" }, `· ${LEVEL_META[n].emoji} Nivel ${n}`)),
    header, stage, panel?.el,
    renderFooter(),
  );

  function renderHeader(done, total) {
    const pct = (done / total) * 100;
    header.replaceChildren(
      el("div", { class: "progress-wrap" },
        el("div", { class: "bar-holder" },
          el("div", { class: "progress-bar", role: "progressbar", "aria-label": "Progreso / Progress", "aria-valuemin": "0", "aria-valuemax": String(total), "aria-valuenow": String(done) },
            el("div", { class: "progress-fill", style: `width:${pct}%` }))),
        el("span", { class: "progress-text" }, `${Math.min(done + 1, total)} / ${total}`)),
      el("span", { class: "cu-round-lola" }, lola.el));
  }

  if (act === "ordena") return playOrdena({ story, n, level, act, lola, header, stage, panel, renderHeader });

  const items = buildRound(act, level);
  const state = { i: 0, score: 0, misses: [] };
  const mapBoard = act === "mapa" ? mapaBoard(items) : null;
  const mapIntro = act === "mapa"
    ? el("p", { class: "cu-map-intro" }, "Completa el mapa del cuento. ", en("Fill in the story map."))
    : null;

  function promptCard(item) {
    const card = el("div", { class: "prompt cu-prompt" }, infoButton(act));
    if (act === "preguntas") card.append(el("p", { class: "cu-q" }, item.prompt), ...(englishToggle(item.en) || []));
    else if (act === "verdad") {
      card.append(
        el("p", { class: "cu-q-kicker" }, "¿Verdad o mentira? ", el("span", { class: "h-en", lang: "en" }, "True or false?")),
        el("p", { class: "cu-q cu-statement" }, el("span", { "aria-hidden": "true" }, "🤔 "), item.prompt),
        ...(englishToggle(item.en) || []));
    } else if (act === "palabras") {
      card.append(markedSentence(item.sentence, item.word),
        el("p", { class: "cu-q" }, item.prompt, en(item.en)));
    } else if (act === "mapa") {
      // the board above already names the slot ("← ahora"), so no kicker
      card.append(el("p", { class: "cu-q" }, item.prompt));
    } else if (act === LISTEN_ACT) {
      card.append(
        el("p", { class: "cu-q listen-question" }, item.prompt, en(item.en)),
        el("div", { class: "listen-controls" },
          el("button", { class: "btn primary cu-listen", type: "button", onclick: () => speak(item.target) }, "🔊 Escuchar"),
          el("button", { class: "btn cu-listen-slow", type: "button", onclick: () => speak(item.target, 0.5) }, "🐢 Despacio")));
    }
    return card;
  }

  function renderItem() {
    const item = items[state.i];
    renderHeader(state.i, items.length);
    lola.setState("is-idle");
    panel?.clear();
    const feedback = el("div", { class: "feedback cu-feedback" });
    const pick = (idx, btn) => {
      const buttons = [...grid.querySelectorAll("button")];
      for (const b of buttons) b.disabled = true;
      const correct = idx === item.answer;
      btn.classList.add(correct ? "correct" : "wrong", correct ? "good" : "bad");
      if (!correct) buttons[item.answer]?.classList.add("correct", "good");
      let lookBtn = null;
      if (correct) {
        state.score++;
        lola.setState("is-hop");
        const msg = PRAISE[Math.floor(Math.random() * PRAISE.length)];
        feedback.className = "feedback good cu-feedback";
        fill(feedback, el("p", { class: "cu-fb-line" }, msg));
        announce(msg);
      } else {
        state.misses.push(item);
        lola.setState("is-curious");
        feedback.className = "feedback bad cu-feedback";
        if (act === "palabras") {
          // NH-15: the meaning, not the sentence a third time
          fill(feedback,
            el("p", { class: "cu-fb-line" }, "Casi. La respuesta es: ", el("strong", {}, item.answerText)),
            el("p", { class: "cu-meaning" },
              el("q", { lang: "es" }, item.word), " = ", el("span", { lang: "en" }, item.answerText),
              speakable(item.word)
                ? el("button", { class: "cu-say", type: "button", "aria-label": `Escuchar «${item.word}» / Listen`, onclick: () => sayGated(item.word) }, "🔊")
                : null));
          announce(`Casi. ${item.word} significa ${item.answerText}.`);
        } else if (!item.evidenceText) {
          // NH-1: Mapa items carry no evidence — point back to the story
          lookBtn = panel
            ? el("button", {
              class: "btn cu-look", type: "button",
              onclick: () => {
                panel.el.open = true;
                panel.el.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" });
                panel.el.querySelector("summary")?.focus({ preventScroll: true });
              },
            }, "📖 Ver el cuento ", en("Show the story"))
            : null;
          fill(feedback,
            el("p", { class: "cu-fb-line" }, "Casi. La respuesta es: ", el("strong", {}, item.answerText)),
            el("p", { class: "cu-look-line" }, "📖 Busca la respuesta en el cuento. ", en("Look for it in the story.")),
            lookBtn);
          announce(`Casi. La respuesta es: ${item.answerText}. Busca la respuesta en el cuento.`);
        } else {
          fill(feedback,
            el("p", { class: "cu-fb-line" }, "Casi. La respuesta es: ", el("strong", {}, item.answerText)),
            evidenceQuote(item.evidenceText));
          panel?.highlight(item.evidence);
          announce(`Casi. La respuesta es: ${item.answerText}. El cuento dice: ${item.evidenceText}`);
        }
      }
      const slot = mapBoard?.fill(state.i, item.answerText, correct);
      state.i++;
      const last = state.i >= items.length;
      let timer = 0;
      const cancel = () => {
        clearTimeout(timer);
        document.removeEventListener("pointerdown", cancel, true);
        document.removeEventListener("keydown", cancel, true);
      };
      const next = el("button", {
        class: "btn primary cu-next", type: "button",
        onclick: () => {
          cancel();
          if (!next.isConnected) return;
          if (last) showResults(story, n, act, state.score, items.length, state.misses);
          else renderItem();
        },
      }, last ? "Ver resultados ▶" : "Siguiente ▶");
      feedback.append(el("div", {}, next));
      keyHandler = (e) => { if (e.key === "Enter" && document.activeElement === document.body) next.click(); };
      if (slot) {
        // CW-5: show the slot that just filled, then hand focus to Siguiente
        slot.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
        next.focus({ preventScroll: true });
        if (!correct) setTimeout(() => next.isConnected && next.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" }), 900);
      } else next.focus();
      if (correct) {
        // NH-6: correct answers move on by themselves; any tap/key cancels
        timer = setTimeout(() => { cancel(); if (next.isConnected) next.click(); }, AUTO_ADVANCE_MS);
        document.addEventListener("pointerdown", cancel, true);
        document.addEventListener("keydown", cancel, true);
      }
    };
    const grid = act === "verdad"
      ? el("div", { class: "cu-tf" },
        el("button", { class: "choice cu-tf-btn cu-true", type: "button", onclick: (e) => pick(0, e.currentTarget) },
          el("span", { "aria-hidden": "true" }, "✔ "), "Verdad", en("True")),
        el("button", { class: "choice cu-tf-btn cu-false", type: "button", onclick: (e) => pick(1, e.currentTarget) },
          el("span", { "aria-hidden": "true" }, "✘ "), "Mentira", en("False")))
      : el("div", { class: `choices cu-choices ${act === LISTEN_ACT ? "cu-listen-choices" : ""}`, lang: act === "palabras" ? "en" : "es" },
        (act === LISTEN_ACT ? diffLabels(item.options) : item.options)
          .map((opt, idx) => choiceButton(opt, idx, (e) => pick(idx, e.currentTarget))));
    suppressHover(grid);
    fill(stage, mapIntro, mapBoard?.el, promptCard(item), grid, feedback);
    keyHandler = (e) => {
      const k = act === "verdad" ? { v: 1, m: 2, 1: 1, 2: 2 }[e.key.toLowerCase()] : Number(e.key);
      const btn = k ? grid.querySelectorAll("button")[k - 1] : null;
      if (btn && !btn.disabled) btn.click();
    };
    if (act === LISTEN_ACT) speak(item.target); // the one mute exemption
  }

  renderItem();
}

function evidenceQuote(text) {
  if (!text) return null;
  return el("p", { class: "cu-evidence-quote" },
    el("span", { "aria-hidden": "true" }, "📍 "), "El cuento dice: ",
    el("q", { lang: "es" }, text),
    speakable(text) ? el("button", { class: "cu-say", type: "button", "aria-label": "Escuchar / Listen", onclick: () => sayGated(text) }, "🔊") : null);
}

/** 🎧 NH-14: full sentences with the differing words in bold. */
function diffLabels(options) {
  return diffWords(options).map((segs) => segs.map((x) => (x.diff ? el("strong", { class: "cu-diff" }, x.text) : x.text)));
}

/**
 * 🗺️ the 4 labelled slots, filled one at a time as the round goes.
 * NH-3 / CW-5: a compact 2×2 summary (solid borders — not a drop zone),
 * bilingual labels, value hidden until filled, "← ahora" on the current.
 */
function mapaBoard(items) {
  const now = () => el("span", { class: "cu-map-now" }, "← ahora ", el("span", { class: "h-en", lang: "en" }, "now"));
  const slots = items.map((item) => el("div", { class: "cu-map-slot", "data-slot": item.slot },
    el("span", { class: "cu-map-label" }, el("span", { "aria-hidden": "true" }, `${item.icon} `), item.label,
      el("span", { class: "h-en", lang: "en" }, ` · ${item.en}`)),
    el("span", { class: "cu-map-value", hidden: true })));
  const node = el("div", { class: "cu-map", role: "group", "aria-label": "Mapa del cuento / Story map" }, slots);
  const mark = (i) => slots.forEach((s, j) => {
    s.classList.toggle("current", j === i);
    s.querySelector(".cu-map-now")?.remove();
    if (j === i) s.querySelector(".cu-map-label").append(now());
  });
  mark(0);
  return {
    el: node,
    fill(i, text, correct) {
      const v = slots[i].querySelector(".cu-map-value");
      v.replaceChildren(el("span", { "aria-hidden": "true" }, correct ? "✓ " : "→ "), text);
      v.hidden = false;
      slots[i].classList.add("filled", correct ? "first-try" : "fixed");
      mark(i + 1);
      return slots[i];
    },
  };
}

/** 🧩 Ordena: tap tiles into numbered slots; score = first-try slots. */
function playOrdena({ story, n, level, act, lola, stage, panel, renderHeader }) {
  const { tiles, sequence } = buildRound("ordena", level);
  const attempts = sequence.map(() => []);
  let next = 0;
  // CW-1: feedback sits directly ABOVE the tiles (sticky), so a wrong tap
  // is explained where the eyes are — at 360×740 too, motion or not.
  const feedback = el("div", { class: "feedback cu-feedback cu-ordena-fb" });
  const slotNodes = sequence.map((_, i) => el("li", { class: "cu-slot", "data-slot": String(i) },
    el("span", { class: "cu-slot-num", "aria-hidden": "true" }, String(i + 1)),
    el("span", { class: "cu-slot-text" }, el("span", { class: "sr-only" }, `Número ${i + 1}: vacío`))));
  const clearWrong = () => {
    for (const b of bank.querySelectorAll(".cu-wrong")) {
      b.classList.remove("cu-wrong");
      b.querySelector(".cu-tile-x")?.remove();
    }
  };
  const slots = el("ol", { class: "cu-slots", "aria-label": "Orden del cuento / Story order" }, slotNodes);
  const bank = el("div", { class: "cu-tiles", role: "group", "aria-label": "Eventos / Events" });
  // N-1 scored slots (owner, 2026-10-30): the last tile is forced, so it
  // auto-places and never counts — the progress bar counts scored slots.
  const scored = Math.max(1, sequence.length - 1);
  const sync = () => {
    renderHeader(Math.min(next, scored), scored);
    slotNodes.forEach((s, i) => s.classList.toggle("current", i === next));
  };
  for (const t of tiles) {
    const btn = el("button", {
      class: "cu-tile", type: "button",
      onclick: () => {
        if (next >= sequence.length) return;
        attempts[next].push(t.index);
        if (t.index === next) {
          const first = attempts[next].length === 1;
          const slot = slotNodes[next];
          slot.querySelector(".cu-slot-text").replaceChildren(t.text);
          slot.classList.add("filled", first ? "first-try" : "fixed");
          const remaining = [...bank.querySelectorAll(".cu-tile")];
          const pos = remaining.indexOf(btn);
          btn.remove();
          clearWrong();
          next++;
          lola.setState("is-hop");
          feedback.className = "feedback good cu-feedback cu-ordena-fb";
          fill(feedback, el("p", { class: "cu-fb-line" }, `¡Sí! ${next}. ${t.text}`));
          announce(`¡Sí! Número ${next}: ${t.text}`);
          if (next >= sequence.length) return done();
          sync();
          const left = [...bank.querySelectorAll(".cu-tile")];
          if (left.length === 1 && sequence.length > 1) return left[0].click(); // forced last tile
          (left[pos] || left[left.length - 1])?.focus();
        } else {
          lola.setState("is-curious");
          btn.classList.remove("cu-nope");
          void btn.offsetWidth; // restart the shake
          btn.classList.add("cu-nope");
          setTimeout(() => btn.classList.remove("cu-nope"), 650);
          if (!btn.classList.contains("cu-wrong")) {
            btn.classList.add("cu-wrong");
            btn.prepend(el("span", { class: "cu-tile-x" },
              el("span", { "aria-hidden": "true" }, "✗ "),
              el("span", { class: "sr-only" }, `No va en el número ${next + 1}: `)));
          }
          feedback.className = "feedback bad cu-feedback cu-ordena-fb";
          fill(feedback, el("p", { class: "cu-fb-line" },
            `❌ Ese no va en el número ${next + 1}. ¡Prueba otro! `,
            el("span", { class: "h-en", lang: "en" }, `Not #${next + 1} — try another!`)));
          announce(`Ese no va en el número ${next + 1}. ¡Prueba otro!`);
        }
      },
    }, t.text);
    bank.append(btn);
  }
  suppressHover(bank);

  function done() {
    sync();
    renderHeader(scored, scored);
    const { score, total } = scoreOrdena(attempts);
    const misses = attempts
      .slice(0, total)
      .map((tries, i) => (tries[0] === i ? null : { prompt: `Número ${i + 1}`, answerText: sequence[i] }))
      .filter(Boolean);
    const btn = el("button", {
      class: "btn primary cu-next", type: "button",
      onclick: () => showResults(story, n, act, score, total, misses),
    }, "Ver resultados ▶");
    feedback.append(el("div", {}, btn));
    btn.focus();
  }

  stage.replaceChildren(
    el("div", { class: "prompt cu-prompt" },
      infoButton(act),
      el("p", { class: "cu-q" }, "Toca los eventos en orden: ¿qué pasa primero?"),
      el("p", { class: "h-en cu-q-en", lang: "en" }, "Tap the events in order: what happens first?")),
    slots, feedback, bank);
  sync();
  void panel;
}

// ------------------------------------------------------------ results

function showResults(story, n, act, score, total, misses) {
  keyHandler = null;
  const stars = store.recordResult(story.id, n, act, score, total).stars;
  const listen = act === LISTEN_ACT;
  const pct = Math.round((score / total) * 100);
  const msg = stars === 3 ? ["¡Increíble! Entendiste todo.", "Amazing! You understood it all."] :
    stars === 2 ? ["¡Muy bien! Ya casi lo tienes.", "Great! Almost there."] :
    stars === 1 ? ["¡Buen trabajo! Vuelve a leer y sigue practicando.", "Good work! Reread and keep practicing."] :
    ["Lola sabe que puedes. Lee el cuento otra vez y ¡inténtalo de nuevo!", "Lola knows you can. Reread the story and try again!"];
  const lola = createLola(116);
  lola.setState(stars === 3 ? "is-spin" : stars >= 1 ? "is-celebrate" : "is-idle");
  const level = levelOf(story, n);
  const retryHref = hrefJuego(story.id, n, act);
  const leeHref = `#/lee/${story.id}/${n}`;

  // NH-5 / CW-6: the primary action follows the result. ≤1★ → reread;
  // ≥2★ → the next game (after Mapa: the next level once this level has
  // ≥10⭐, else reread). 🔁 Otra vez is always the secondary.
  const reread = (cls) => el("a", { class: `btn ${cls} cu-reread`, href: leeHref }, "📖 Lee otra vez ", en("Reread"));
  const retry = el("a", { class: "btn cu-retry", href: retryHref, onclick: () => setTimeout(render, 0) }, "🔁 Otra vez ", en("Try again"));
  let primary;
  const nextAct = listen ? null : STAR_ACTS[STAR_ACTS.indexOf(act) + 1];
  if (stars <= 1) primary = reread("primary");
  else if (nextAct) {
    const m = actMeta(nextAct);
    primary = el("a", { class: "btn primary cu-next-act", href: hrefJuego(story.id, n, nextAct) },
      `Siguiente juego: ${m.icon} ${m.es} `, en("Next game"));
  } else if (act === "mapa" && n < 3 && store.levelStars(story.id, n) >= 10) {
    primary = el("a", { class: "btn primary cu-next-level", href: `#/lee/${story.id}/${n + 1}` }, "📖 Siguiente nivel ", en("Next level"));
  } else if (act === "mapa") primary = reread("primary");
  else primary = el("a", { class: "btn primary cu-story-next", href: `#/cuento/${story.id}` }, "📚 Cuento ", en("Story"));
  const storyLink = primary.classList.contains("cu-story-next")
    ? null
    : el("a", { class: "btn cu-story-link", href: `#/cuento/${story.id}` }, "📚 Cuento");

  const h1 = el("h1", { tabindex: "-1" }, "Resultados ", el("span", { class: "h-en", lang: "en" }, "/ Results"));
  window.scrollTo(0, 0);
  app.replaceChildren(
    crumbs(
      el("a", { href: `#/cuento/${story.id}` }, `← ${story.title}`),
      el("a", { href: leeHref }, "📖 Lee")),
    el("div", { class: "results cu-results", role: "region", "aria-label": "Resultados" },
      h1,
      lola.el,
      el("div", { class: "big-stars" }, listen ? badgeRow(stars) : starRow(stars)),
      el("p", { class: "score-line" }, `${score} / ${total} · ${pct}%`),
      el("p", { class: "result-msg" }, msg[0], en(msg[1])),
      // CW-3: name the parallel 🎧 track where it is earned
      listen
        ? el("p", { class: "cu-badge-note" },
          stars > 0 ? "🎧 ¡Ganaste insignias de escucha! Son aparte de las estrellas ⭐. " : "🎧 Las insignias de escucha son aparte de las estrellas ⭐. ",
          el("span", { class: "h-en", lang: "en" },
            stars > 0 ? "You earned listening badges — they're separate from stars." : "Listening badges are separate from stars."))
        : null,
      stars < 3
        ? el("p", { class: "cu-star-hint" },
          listen ? "Para 🎧🎧🎧: ¡todas bien! " : "Para ★★★: ¡todas bien! ",
          el("span", { class: "h-en", lang: "en" }, listen ? "3 badges = all correct." : "3 stars = all correct."))
        : null,
      misses.length ? el("div", { class: "review cu-misses" },
        el("h2", {}, "Para repasar ", el("span", { class: "h-en", lang: "en" }, "(to review)")),
        el("ul", {}, misses.map((m) => el("li", {},
          el("span", { class: "cu-miss-q" }, listen ? "🎧" : m.prompt),
          el("span", { class: "cu-miss-a" }, " → ", el("strong", {}, m.answerText)),
          m.evidenceText && !listen ? evidenceQuote(m.evidenceText) : null)))) : null,
      // ordena/mapa: the passage stays available after the round (§8)
      ["ordena", "mapa"].includes(act) ? passagePanel(level).el : null,
      el("div", { class: "result-actions" }, primary, retry, storyLink)),
    renderFooter(),
  );
  h1.focus({ preventScroll: true });
  announce(`Resultados: ${score} de ${total}. ${listen ? `${stars} insignias` : `${stars} estrellas`}. ${msg[0]}`);
}

// ------------------------------------------------------------ informe

function renderInforme() {
  const today = new Date().toLocaleDateString("es", { year: "numeric", month: "long", day: "numeric" });
  const totalStars = STORIES.reduce((sum, s) => sum + store.storyStars(s.id), 0);
  const totalBadges = STORIES.reduce((sum, s) => sum + store.storyBadges(s.id), 0);
  const starActs = ACTIVITIES.filter((a) => a.track === "stars");
  const cell = (n) => el("td", {}, `${n}/3`);
  const badgeCell = (n) => el("td", { class: "cu-badge-cell" }, `🎧 ${n}/3`);

  mount(
    crumbs(el("a", { href: "#/" }, "← Biblioteca")),
    el("div", { class: "report cu-report" },
      el("h1", {}, "Informe de lectura ", el("span", { class: "h-en", lang: "en" }, "/ Status"), " — Cuentos", infoButton("report")),
      el("p", { class: "report-fields" },
        "Nombre: ", el("span", { class: "fill-line" }, ""),
        "  Fecha: ", el("span", { class: "fill-line short" }, today)),
      el("p", { class: "report-total" },
        `⭐ Total: ${totalStars} / ${STORIES.length * STARS_PER_STORY} estrellas · 🎧 ${totalBadges} / ${STORIES.length * 9} insignias`),
      // axe scrollable-region-focusable: the table may overflow on narrow
      // screens / fallback fonts, so the scroller is keyboard-reachable.
      el("div", { class: "table-scroll", tabindex: "0", role: "region", "aria-label": "Tabla de progreso / Progress table" },
        el("table", { class: "conj-table report-table cu-report-table" },
          el("caption", { class: "sr-only" }, "Estrellas por cuento, nivel y actividad"),
          el("thead", {},
            el("tr", {},
              el("th", { scope: "col" }, "Cuento · Nivel"),
              el("th", { scope: "col" }, "📖 Lee"),
              starActs.map((a) => el("th", { scope: "col" }, `${a.icon} ${a.es}`)),
              el("th", { scope: "col" }, "🎧 Escucha (insignias)"),
              el("th", { scope: "col" }, "Total ⭐"))),
          el("tbody", {},
            STORIES.flatMap((s) => LEVELS.map((lv) => el("tr", { "data-story": s.id, "data-level": String(lv) },
              el("th", { scope: "row" }, `${s.emoji} ${s.title}`, el("span", { class: "report-verbs" }, `${LEVEL_META[lv].emoji} Nivel ${lv}`)),
              el("td", {}, `${store.getReads(s.id, lv)}×`),
              starActs.map((a) => cell(store.getBest(s.id, lv, a.key)?.stars ?? 0)),
              badgeCell(store.getBest(s.id, lv, LISTEN_ACT)?.stars ?? 0),
              el("td", { class: "report-row-total" }, `${store.levelStars(s.id, lv)}/${STARS_PER_LEVEL}`))))))),
      el("p", { class: "report-note" },
        "Estrellas por actividad: ★ ≥60% · ★★ ≥80% · ★★★ 100%. ",
        "Las insignias 🎧 (escucha) son un logro aparte y no cuentan en el total de estrellas. ",
        "📖 Lee no tiene estrellas: cuenta las lecturas. ",
        "El progreso vive solo en este dispositivo (sin cuentas). ",
        el("span", { lang: "en" }, "Stars per activity; listening badges are a separate track; progress is stored only on this device.")),
      el("div", { class: "study-actions no-print" },
        el("button", { class: "btn primary", type: "button", onclick: () => window.print() }, "🖨️ Imprimir"))),
    renderFooter(),
  );
}

// ------------------------------------------------------------ créditos

function renderCreditos() {
  mount(
    crumbs(el("a", { href: "#/" }, "← Biblioteca")),
    el("h1", {}, "Créditos ", el("span", { class: "h-en", lang: "en" }, "/ Story credits"), infoButton("creditos")),
    el("p", { class: "cu-credits-intro" },
      "Cada cuento es una adaptación original, en tres niveles, de un texto de dominio público.",
      en("Each story is an original three-level adaptation of a public-domain text.")),
    STORIES.map((s) => el("section", { class: "cu-credit", "data-story": s.id },
      el("h2", {}, el("span", { "aria-hidden": "true" }, `${s.emoji} `), s.title),
      el("dl", { class: "cu-credit-list" },
        el("dt", {}, "Autor / Author"), el("dd", {}, s.source.author),
        el("dt", {}, "País / Country"), el("dd", {}, el("span", { "aria-hidden": "true" }, `${s.source.country.flag} `), `${s.source.country.es} / ${s.source.country.en}`),
        el("dt", {}, "Origen / Origin"), el("dd", {}, `${s.source.origin.es} / ${s.source.origin.en}`),
        s.source.via ? [el("dt", {}, "Texto consultado / Source text"), el("dd", {}, s.source.via)] : null,
        el("dt", {}, "Licencia / License"), el("dd", {}, s.source.license),
        el("dt", {}, "Fuente / Source"), el("dd", {},
          el("a", { href: s.source.url, target: "_blank", rel: "noopener" }, "Ver el texto original ", en("(opens a new tab)")))))),
    el("p", { class: "cu-credits-note" },
      "Adaptaciones, preguntas y actividades: DLIskills.com, con licencia MIT.",
      en("Adaptations, questions, and activities by DLIskills.com, MIT License.")),
    renderFooter(),
  );
}

// ------------------------------------------------------------ footer

function renderFooter() {
  return el("footer", { class: "site-footer" },
    el("div", { class: "footer-top" },
      el("span", { class: "footer-site" }, "Dual-Language Immersion (DLI) Skills")),
    el("div", { class: "footer-links" },
      el("a", { class: "linklike", href: "#/informe" }, "Informe / Status"),
      el("a", { class: "linklike", href: "#/creditos" }, "Créditos / Credits"),
      el("a", { class: "linklike", href: "../about.html" }, "Acerca de / Standards"),
      el("a", { class: "linklike footer-docs", href: "../docs/" }, "Documentación / Docs"),
      el("button", {
        class: "linklike cu-borrar", type: "button",
        onclick: (e) => eraseDialog(e.currentTarget),
      }, "Borrar progreso")),
    el("p", { class: "footer-note" },
      "Gratis y sin registro · Free, no login · Aligned to ",
      el("a", { class: "footer-std", href: "https://www.nbpts.org/wp-content/uploads/2021/09/ECYA-WL.pdf", target: "_blank", rel: "noopener" }, "NBPTS"),
      ", ",
      el("a", { class: "footer-std", href: "https://www.actfl.org/uploads/files/general/Professional-Learning/Can-Do-Intro-Overview.pdf", target: "_blank", rel: "noopener" }, "NCSSFL-ACTFL"),
      " World Language standards and ",
      el("a", { class: "footer-std", href: COMMON_CORE.href, target: "_blank", rel: "noopener" }, COMMON_CORE.label)),
    el("p", { class: "footer-credits", lang: "en" },
      "Created by Lucia Perales, EdD (wife/mother/educator) and Aaron Soto, MHCID (husband/father/technologist)",
      el("br"),
      "DLI K-5 Graduate “A1” (daughter/consultant) and DLI 3rd Grader “A2” (son/consultant)"),
  );
}

// boot: learn whether clips exist, then paint (offline → instant fallback)
initClips("../audio/").finally(render);
