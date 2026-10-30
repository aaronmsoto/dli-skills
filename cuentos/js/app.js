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
import { ACTIVITIES, STAR_ACTS, LISTEN_ACT, actMeta, buildRound, scoreOrdena, refText } from "./activities.js";
import * as store from "./storage.js";
import { STANDARDS_INFO } from "./standards-info.js";
import { createReader, passagePanel, markedSentence, stopReading, closeBubble } from "./reader.js";
import { el, createMenuButton } from "../../js/menu.js";
import { speak, ttsAvailable, hasClip, initClips } from "../../js/audio.js";
import { createLola } from "../../js/mascot.js";

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
// passage panel per activity: open (evidence-based) · closed (hint) · none
const PANEL = { preguntas: "open", verdad: "open", palabras: "open", ordena: "closed", mapa: "closed", escucha: "none" };

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
const onMuted = () => announce("🔇 El sonido está apagado (☰ Ajustes). Sound is off (☰ Settings).");
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

/** ℹ️ standards dialog (mirrors Conjuga's infoButton). */
function infoButton(key) {
  const info = STANDARDS_INFO[key];
  if (!info) return null;
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
  const close = () => {
    overlay?.remove();
    overlay = null;
    document.removeEventListener("keydown", onKey);
    btn.setAttribute("aria-expanded", "false");
    btn.focus();
  };
  const btn = el("button", {
    class: "info-btn no-print", type: "button", "aria-expanded": "false",
    "aria-label": "Cómo apoya esta página los estándares / How this page supports the standards",
    onclick: () => {
      if (overlay) return close();
      overlay = el("div", { class: "info-overlay", onclick: (e) => { if (e.target === overlay) close(); } },
        el("div", { class: "info-panel", role: "dialog", "aria-modal": "true", "aria-label": "Estándares de esta página" },
          el("button", { class: "info-close", type: "button", "aria-label": "Cerrar / Close", onclick: close }, "✕"),
          el("p", { class: "info-kid" }, info.kid),
          el("p", { class: "info-en", lang: "en" }, info.en),
          el("p", { class: "info-cites" }, info.cites.join(" · ")),
          el("p", { class: "info-more" }, "Más en el pie de página y en ",
            el("a", { href: "../about.html" }, "Acerca de / Standards"), ".")));
      document.body.append(overlay);
      btn.setAttribute("aria-expanded", "true");
      overlay.querySelector(".info-close").focus();
      document.addEventListener("keydown", onKey);
    },
  }, "ℹ️");
  return btn;
}

function confirmErase() {
  return confirm("¿Borrar el progreso de Cuentos? Conjuga no cambia. / Erase Cuentos progress? Conjuga is not affected.");
}

function menuButton() {
  return createMenuButton({
    announce,
    soundGate: anyAudio,
    onUnmute: () => { if (speakable("Hola")) speak("Hola"); },
    // mid-round setting changes save WITHOUT re-rendering (Conjuga NN-1 b)
    afterSetting: () => { if (parseRoute().screen !== "juego") render(); },
    onReset: () => render(),
    links: { home: "#/", informe: "#/informe", acerca: "../about.html", docs: "../docs/" },
    install: false,
    extraLinks: [
      { href: "#/creditos", label: "Créditos / Story credits" },
      { href: "../", label: "Conjuga / Verbos" },
    ],
    switches: ["hints", "sound"],
    onBorrar: () => confirmErase() && (store.resetProgress(), true),
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
}

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
    el("p", { class: "review-water" }, "Un poquito de repaso riega lo aprendido.",
      en("A little review waters what you've learned.")),
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
  const firstFresh = STORIES.find((s) => store.storyStars(s.id) === 0 && store.storyBadges(s.id) === 0)?.id;
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
        showBadges ? ` · 🎧 ${totalBadges} / ${STORIES.length * 9}` : null)),
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
        s.id === firstFresh
          ? el("span", { class: "start-here" }, "¡Empieza aquí! ", el("span", { class: "h-en", lang: "en" }, "Start here"))
          : null))),
    renderFooter(),
  );
}

// ------------------------------------------------------------ story screen

function renderStory(story) {
  const saved = Number(ssGet(`cuentos.nivel.${story.id}`));
  const n = LEVELS.includes(saved) ? saved : 1;
  const level = levelOf(story, n);

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
        return el("li", { class: "chip cu-key" },
          speakable(k.es)
            ? el("button", { class: "cu-key-say", type: "button", onclick: () => say(k.es) }, ...inner, el("span", { class: "cu-key-ear", "aria-hidden": "true" }, "🔊"))
            : el("span", { class: "cu-key-static" }, ...inner));
      })),

    el("h2", {}, "2 · Elige un nivel ", el("span", { class: "h-en", lang: "en" }, "(pick a level)")),
    el("div", { class: "tense-row cu-level-row", role: "radiogroup", "aria-label": "Nivel / Level" },
      LEVELS.map((lv) => el("button", {
        class: `tense-card cu-level-card ${lv === n ? "selected" : ""}`,
        type: "button", role: "radio", "aria-checked": String(lv === n), "data-level": String(lv),
        onclick: () => { ssSet(`cuentos.nivel.${story.id}`, String(lv)); render(); },
      },
        el("span", { class: "cu-level-emoji", "aria-hidden": "true" }, LEVEL_META[lv].emoji),
        el("strong", {}, `Nivel ${lv}`),
        el("span", { class: "tense-hint" }, LEVEL_META[lv].hint),
        el("span", { class: "tense-example", lang: "en" }, LEVEL_META[lv].en),
        el("span", { class: "cu-level-stars" }, `⭐ ${store.levelStars(story.id, lv)}/${STARS_PER_LEVEL}`)))),

    el("h2", {}, `3 · Lee y juega — ${LEVEL_META[n].emoji} Nivel ${n} `, el("span", { class: "h-en", lang: "en" }, "(read, then play)")),
    el("div", { class: "mode-row cu-acts" },
      el("a", { class: "mode-card cu-act-card cu-lee-card", "data-act": "lee", href: `#/lee/${story.id}/${n}` },
        actIcon("📖"),
        el("strong", {}, "Lee"),
        el("span", { class: "mode-en", lang: "en" }, "Read the story"),
        el("span", { class: "mode-free" }, `leído ${store.getReads(story.id, n)} ${store.getReads(story.id, n) === 1 ? "vez" : "veces"} · sin estrellas`)),
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
    renderFooter(),
  );
}

// ------------------------------------------------------------ Lee (reader)

function levelPills(story, n, hrefFor) {
  return el("nav", { class: "cu-levels no-print", "aria-label": "Nivel / Level" },
    LEVELS.map((lv) => el("a", {
      class: `cu-pill ${lv === n ? "current" : ""}`, href: hrefFor(lv),
      "aria-current": lv === n ? "page" : null,
    }, `${LEVEL_META[lv].emoji} Nivel ${lv}`)));
}

function activityLinks(story, n) {
  const level = levelOf(story, n);
  return [
    ...ACTIVITIES.filter((a) => a.track === "stars").map((a) =>
      el("a", { class: "btn primary cu-act-link", "data-act": a.key, href: hrefJuego(story.id, n, a.key) },
        actIcon(a.icon), ` ${a.es}`)),
    escuchaAvailable(level)
      ? el("a", { class: "btn primary cu-act-link listen-link", "data-act": LISTEN_ACT, href: hrefJuego(story.id, n, LISTEN_ACT) },
        actIcon("🎧"), ` ${actMeta(LISTEN_ACT).es}`)
      : null,
  ];
}

function renderLee(story, n) {
  const level = levelOf(story, n);
  ssSet(`cuentos.nivel.${story.id}`, String(n));
  store.recordRead(story.id, n);
  const reader = createReader(level, { speakable, say, speak, soundOn, onMuted, announce });

  mount(
    crumbs(el("a", { href: `#/cuento/${story.id}` }, `← ${story.title}`)),
    el("h1", { class: "cu-lee-title" }, el("span", { "aria-hidden": "true" }, `${story.emoji} `), story.title, infoButton("lee")),
    levelPills(story, n, (lv) => `#/lee/${story.id}/${lv}`),
    el("p", { class: "print-fields print-only" },
      `${LEVEL_META[n].emoji} Nivel ${n} · Nombre: `, el("span", { class: "fill-line" }, ""),
      "  Fecha: ", el("span", { class: "fill-line short" }, "")),
    el("p", { class: "study-hint tap-hint" }, "👆 Toca una palabra subrayada para ver qué significa.",
      en("Tap an underlined word to see what it means.")),
    reader.el,
    el("p", { class: "cu-attrib-small" }, `${story.source.author} · ${story.source.origin.es} · Dominio público · Adaptación de DLIskills.com`),
    el("h2", { class: "no-print" }, "¿Listos? Juega con el cuento ", el("span", { class: "h-en", lang: "en" }, "(ready? play with the story)")),
    el("div", { class: "study-actions cu-actions" },
      activityLinks(story, n),
      el("button", { class: "btn print-btn", type: "button", onclick: () => window.print() }, "🖨️ Imprimir")),
    renderFooter(),
  );
}

// ------------------------------------------------------------ activity rounds

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
  const panelMode = PANEL[act] === "closed" && !hints ? "none" : PANEL[act];
  const panel = panelMode === "none" ? null : passagePanel(level, { open: panelMode === "open" });
  const lola = createLola(44);
  const header = el("div", { class: "play-header cu-play-header" });
  const stage = el("div", { class: "stage cu-stage" });

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

  function promptCard(item) {
    const card = el("div", { class: "prompt cu-prompt" },
      el("span", { class: "prompt-tense cue-chip" }, `${meta.icon} ${meta.es}`),
      infoButton(act));
    if (act === "preguntas") card.append(el("p", { class: "cu-q" }, item.prompt), ...(englishToggle(item.en) || []));
    else if (act === "verdad") {
      card.append(
        el("p", { class: "cu-q-kicker" }, "¿Verdad o mentira? ", el("span", { class: "h-en", lang: "en" }, "True or false?")),
        el("p", { class: "cu-q cu-statement" }, `«${item.prompt}»`),
        ...(englishToggle(item.en) || []));
    } else if (act === "palabras") {
      card.append(markedSentence(item.sentence, item.word),
        el("p", { class: "cu-q" }, item.prompt, en(item.en)));
    } else if (act === "mapa") {
      card.append(el("p", { class: "cu-q-kicker" }, `${item.icon} ${item.label} `, el("span", { class: "h-en", lang: "en" }, item.en)),
        el("p", { class: "cu-q" }, item.prompt));
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
      if (correct) {
        state.score++;
        lola.setState("is-hop");
        const msg = PRAISE[Math.floor(Math.random() * PRAISE.length)];
        feedback.className = "feedback good cu-feedback";
        feedback.replaceChildren(el("p", { class: "cu-fb-line" }, msg));
        announce(msg);
      } else {
        state.misses.push(item);
        lola.setState("is-curious");
        feedback.className = "feedback bad cu-feedback";
        feedback.replaceChildren(
          el("p", { class: "cu-fb-line" }, "Casi. La respuesta es: ", el("strong", {}, item.answerText)),
          evidenceQuote(item.evidenceText));
        panel?.highlight(item.evidence);
        announce(`Casi. La respuesta es: ${item.answerText}.${item.evidenceText ? ` El cuento dice: ${item.evidenceText}` : ""}`);
      }
      mapBoard?.fill(state.i, item.answerText, correct);
      state.i++;
      const last = state.i >= items.length;
      const next = el("button", {
        class: "btn primary cu-next", type: "button",
        onclick: () => (last ? showResults(story, n, act, state.score, items.length, state.misses) : renderItem()),
      }, last ? "Ver resultados ▶" : "Siguiente ▶");
      feedback.append(el("div", {}, next));
      keyHandler = (e) => { if (e.key === "Enter" && document.activeElement === document.body) next.click(); };
      next.focus();
    };
    const grid = act === "verdad"
      ? el("div", { class: "cu-tf" },
        el("button", { class: "choice cu-tf-btn cu-true", type: "button", onclick: (e) => pick(0, e.currentTarget) },
          el("span", { "aria-hidden": "true" }, "✔ "), "Verdad", en("True")),
        el("button", { class: "choice cu-tf-btn cu-false", type: "button", onclick: (e) => pick(1, e.currentTarget) },
          el("span", { "aria-hidden": "true" }, "✘ "), "Mentira", en("False")))
      : el("div", { class: `choices cu-choices ${act === LISTEN_ACT ? "cu-listen-choices" : ""}`, lang: act === "palabras" ? "en" : "es" },
        item.options.map((opt, idx) => choiceButton(opt, idx, (e) => pick(idx, e.currentTarget))));
    suppressHover(grid);
    stage.replaceChildren(...[mapBoard?.el, promptCard(item), grid, feedback].filter(Boolean));
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
    speakable(text) ? el("button", { class: "cu-say", type: "button", "aria-label": "Escuchar / Listen", onclick: () => say(text) }, "🔊") : null);
}

/** 🗺️ the 4 labelled slots, filled one at a time as the round goes. */
function mapaBoard(items) {
  const slots = items.map((item) => el("div", { class: "cu-map-slot", "data-slot": item.slot },
    el("span", { class: "cu-map-label" }, el("span", { "aria-hidden": "true" }, `${item.icon} `), item.label),
    el("span", { class: "cu-map-value" }, "…")));
  const node = el("div", { class: "cu-map", role: "group", "aria-label": "Mapa del cuento / Story map" }, slots);
  const mark = (i) => slots.forEach((s, j) => s.classList.toggle("current", j === i));
  mark(0);
  return {
    el: node,
    fill(i, text, correct) {
      const v = slots[i].querySelector(".cu-map-value");
      v.replaceChildren(el("span", { "aria-hidden": "true" }, correct ? "✓ " : "→ "), text);
      slots[i].classList.add("filled", correct ? "first-try" : "fixed");
      mark(i + 1);
    },
  };
}

/** 🧩 Ordena: tap tiles into numbered slots; score = first-try slots. */
function playOrdena({ story, n, level, act, lola, stage, panel, renderHeader }) {
  const { tiles, sequence } = buildRound("ordena", level);
  const attempts = sequence.map(() => []);
  let next = 0;
  const feedback = el("div", { class: "feedback cu-feedback" });
  const slotNodes = sequence.map((_, i) => el("li", { class: "cu-slot", "data-slot": String(i) },
    el("span", { class: "cu-slot-num", "aria-hidden": "true" }, String(i + 1)),
    el("span", { class: "cu-slot-text" }, el("span", { class: "sr-only" }, `Lugar ${i + 1}: vacío`))));
  const slots = el("ol", { class: "cu-slots", "aria-label": "Orden del cuento / Story order" }, slotNodes);
  const bank = el("div", { class: "cu-tiles", role: "group", "aria-label": "Eventos / Events" });
  const sync = () => {
    renderHeader(Math.min(next, sequence.length - 1), sequence.length);
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
          next++;
          lola.setState("is-hop");
          feedback.className = "feedback good cu-feedback";
          feedback.replaceChildren(el("p", { class: "cu-fb-line" }, `¡Sí! ${next}. ${t.text}`));
          announce(`¡Sí! Lugar ${next}: ${t.text}`);
          if (next >= sequence.length) return done();
          sync();
          const left = [...bank.querySelectorAll(".cu-tile")];
          (left[pos] || left[left.length - 1])?.focus();
        } else {
          lola.setState("is-curious");
          btn.classList.remove("cu-nope");
          void btn.offsetWidth; // restart the shake
          btn.classList.add("cu-nope");
          setTimeout(() => btn.classList.remove("cu-nope"), 650);
          feedback.className = "feedback bad cu-feedback";
          feedback.replaceChildren(el("p", { class: "cu-fb-line" },
            `Casi. Ese evento no va en el lugar ${next + 1}. ¡Prueba otro! `,
            el("span", { class: "h-en", lang: "en" }, `Not this one for spot ${next + 1} — try another!`)));
          announce(`Casi. Ese evento no va en el lugar ${next + 1}. Prueba otro.`);
        }
      },
    }, t.text);
    bank.append(btn);
  }
  suppressHover(bank);

  function done() {
    sync();
    renderHeader(sequence.length, sequence.length);
    const { score, total } = scoreOrdena(attempts);
    const misses = attempts
      .map((tries, i) => (tries[0] === i ? null : { prompt: `Lugar ${i + 1}`, answerText: sequence[i] }))
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
      el("span", { class: "prompt-tense cue-chip" }, "🧩 Ordena el cuento"),
      infoButton(act),
      el("p", { class: "cu-q" }, "Toca los eventos en orden: ¿qué pasa primero?"),
      el("p", { class: "h-en cu-q-en", lang: "en" }, "Tap the events in order: what happens first?")),
    slots, bank, feedback);
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
  const nextAct = STAR_ACTS[STAR_ACTS.indexOf(act) + 1];
  let nextLink = null;
  if (nextAct) {
    const m = actMeta(nextAct);
    nextLink = el("a", { class: "btn cu-next-act", href: hrefJuego(story.id, n, nextAct) }, `${m.icon} ${m.es}`);
  } else if (act === "mapa" && n < 3) {
    nextLink = el("a", { class: "btn cu-next-level", href: `#/lee/${story.id}/${n + 1}` }, "📖 Siguiente nivel ", en("Next level"));
  }
  const retryHref = hrefJuego(story.id, n, act);

  app.replaceChildren(
    crumbs(el("a", { href: `#/cuento/${story.id}` }, `← ${story.title}`)),
    el("div", { class: "results cu-results", role: "region", "aria-label": "Resultados" },
      el("h1", {}, "Resultados ", el("span", { class: "h-en", lang: "en" }, "/ Results")),
      lola.el,
      el("div", { class: "big-stars" }, listen ? badgeRow(stars) : starRow(stars)),
      el("p", { class: "score-line" }, `${score} / ${total} · ${pct}%`),
      el("p", { class: "result-msg" }, msg[0], en(msg[1])),
      misses.length ? el("div", { class: "review cu-misses" },
        el("h2", {}, "Para repasar ", el("span", { class: "h-en", lang: "en" }, "(to review)")),
        el("ul", {}, misses.map((m) => el("li", {},
          el("span", { class: "cu-miss-q" }, listen ? "🎧" : m.prompt),
          el("span", { class: "cu-miss-a" }, " → ", el("strong", {}, m.answerText)),
          m.evidenceText && !listen ? evidenceQuote(m.evidenceText) : null)))) : null,
      // ordena/mapa: the passage stays available after the round (§8)
      ["ordena", "mapa"].includes(act) ? passagePanel(level).el : null,
      el("div", { class: "result-actions" },
        el("a", { class: "btn primary cu-retry", href: retryHref, onclick: () => setTimeout(render, 0) }, "🔁 Otra vez"),
        nextLink,
        el("a", { class: "btn cu-story-link", href: `#/cuento/${story.id}` }, "📚 Cuento"))),
    renderFooter(),
  );
  announce(`Resultados: ${score} de ${total}. ${listen ? `${stars} insignias` : `${stars} estrellas`}. ${msg[0]}`);
}

// ------------------------------------------------------------ informe

function renderInforme() {
  const today = new Date().toLocaleDateString("es", { year: "numeric", month: "long", day: "numeric" });
  const totalStars = STORIES.reduce((sum, s) => sum + store.storyStars(s.id), 0);
  const totalBadges = STORIES.reduce((sum, s) => sum + store.storyBadges(s.id), 0);
  const starActs = ACTIVITIES.filter((a) => a.track === "stars");
  const cell = (n) => el("td", {}, `${n}/3`);

  mount(
    crumbs(el("a", { href: "#/" }, "← Biblioteca")),
    el("div", { class: "report cu-report" },
      el("h1", {}, "Informe de lectura ", el("span", { class: "h-en", lang: "en" }, "/ Status"), " — Cuentos", infoButton("report")),
      el("p", { class: "report-fields" },
        "Nombre: ", el("span", { class: "fill-line" }, ""),
        "  Fecha: ", el("span", { class: "fill-line short" }, today)),
      el("p", { class: "report-total" },
        `⭐ Total: ${totalStars} / ${STORIES.length * STARS_PER_STORY} estrellas · 🎧 ${totalBadges} / ${STORIES.length * 9} insignias`),
      el("div", { class: "table-scroll" },
        el("table", { class: "conj-table report-table cu-report-table" },
          el("caption", { class: "sr-only" }, "Estrellas por cuento, nivel y actividad"),
          el("thead", {},
            el("tr", {},
              el("th", { scope: "col" }, "Cuento · Nivel"),
              el("th", { scope: "col" }, "📖 Lee"),
              starActs.map((a) => el("th", { scope: "col" }, `${a.icon} ${a.es}`)),
              el("th", { scope: "col" }, "🎧 Escucha"),
              el("th", { scope: "col" }, "Total ⭐"))),
          el("tbody", {},
            STORIES.flatMap((s) => LEVELS.map((lv) => el("tr", { "data-story": s.id, "data-level": String(lv) },
              el("th", { scope: "row" }, `${s.emoji} ${s.title}`, el("span", { class: "report-verbs" }, `${LEVEL_META[lv].emoji} Nivel ${lv}`)),
              el("td", {}, `${store.getReads(s.id, lv)}×`),
              starActs.map((a) => cell(store.getBest(s.id, lv, a.key)?.stars ?? 0)),
              cell(store.getBest(s.id, lv, LISTEN_ACT)?.stars ?? 0),
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
        onclick: () => {
          if (confirmErase()) {
            store.resetProgress();
            render();
          }
        },
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
