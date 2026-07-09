/**
 * Conjuga — UI shell. Hash-routed screens:
 *   #/                      home (set picker + review queue)
 *   #/set/3                 set detail (tense + mode picker)
 *   #/study/3/present       study tables
 *   #/practica/3/present    🧱 rebuild-the-table practice (unscored)
 *   #/play/3/present/choice game round (choice | type | match)
 *   #/play/3/contrast       ¿pretérito o imperfecto? challenge
 *   #/informe               printable progress report
 */
import { SETS } from "./verbs.js";
import { conjugate, PERSONS, TENSES, TENSE_LABELS, normalizeAnswer, stripAccents } from "./conjugator.js";
import { sampleTargets, buildChoices, buildMatchPairs, buildPracticaBank, buildContrastQuestions, shuffle, QUESTIONS_PER_ROUND } from "./game.js";
import * as store from "./storage.js";
import { speak, ttsAvailable, audioAvailable, initClips } from "./audio.js";
import { createLola, createNest } from "./mascot.js";
import { STANDARDS_INFO } from "./standards-info.js";

const MODES = ["choice", "type", "match"];
// Escucha is a parallel track: badges, not stars — never in MODES, so no
// star denominator, sampling, or next-mode logic ever counts it.
const LISTEN = "listen";
const LISTEN_META = { icon: "🎧", es: "Escucha", en: "Listen & pick" };
// Práctica is UNSCORED by owner decision (M8): no stars/badges/recordResult.
// Icon is 🧱 — Empareja owns 🧩 and icons stay distinct.
const PRACTICA_META = { icon: "🧱", es: "Práctica", en: "Rebuild the table" };
const MODE_META = {
  choice: { icon: "✅", es: "Elige", en: "Pick it" },
  type: { icon: "✏️", es: "Escribe", en: "Type it" },
  match: { icon: "🧩", es: "Empareja", en: "Match it" },
};
const TENSE_META = {
  present: { icon: "☀️", hint: "ahora — now", example: "Hoy hablo con mi amiga." },
  preterite: { icon: "⭐", hint: "ayer, una vez — completed past", example: "Ayer hablé con ella." },
  imperfect: { icon: "🌙", hint: "antes, muchas veces — ongoing past", example: "Antes hablaba cada día." },
};
const PRAISE = ["¡Muy bien!", "¡Excelente!", "¡Genial!", "¡Fantástico!", "¡Perfecto!", "¡Súper!"];
// 3 tenses × 3 modes + the past-tense contrast challenge, 3 stars each.
const STARS_PER_SET = (TENSES.length * MODES.length + 1) * 3;
const CONTRAST_KEY = { tense: "past", mode: "contrast" };

// Short person words for speech (the display labels are too wordy to say).
const SPEECH_PERSONS = ["yo", "tú", "él", "nosotros", "vosotros", "ellos"];

/** Speak Spanish if audio is on and the device has a Spanish voice. */
function say(text) {
  if (audioAvailable() && store.getSettings().sound) return speak(text);
  return Promise.resolve();
}

function sayForm(person, form) {
  return say(`${SPEECH_PERSONS[person]} ${form}`);
}

/**
 * ℹ️ per-screen standards panel (M9 I1): a small dialog explaining how the
 * current page supports the cited standards. Bilingual, adult-focused —
 * one Spanish-first line for learners, concise English for adults.
 * Content lives in js/standards-info.js (single source of truth).
 */
function infoButton(key) {
  const info = STANDARDS_INFO[key];
  if (!info) return null;
  let overlay = null;
  const onKey = (e) => {
    if (e.key === "Escape") return close();
    if (e.key === "Tab" && overlay) {
      // the close button is the panel's only focusable — keep focus there
      e.preventDefault();
      overlay.querySelector(".info-close").focus();
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
          el("button", { class: "info-close", "aria-label": "Cerrar / Close", onclick: close }, "✕"),
          el("p", { class: "info-kid" }, info.kid),
          el("p", { class: "info-en" }, info.en),
          el("p", { class: "info-cites" }, info.cites.join(" · ")),
          el("p", { class: "info-more" }, "Más en el pie de página y en ",
            el("a", { href: "about.html" }, "Acerca de / Standards"), ".")));
      document.body.append(overlay);
      btn.setAttribute("aria-expanded", "true");
      overlay.querySelector(".info-close").focus();
      document.addEventListener("keydown", onKey);
    },
  }, "ℹ️");
  return btn;
}

/**
 * ☰ site menu (M11): top-right disclosure with the main pages — global nav
 * collapses here because contextual back-nav lives top-left in the crumbs.
 */
function menuButton() {
  let open = false;
  const panel = el("nav", { class: "menu-panel", hidden: true, "aria-label": "Páginas principales / Site menu" },
    el("a", { class: "menu-link", href: "#/" }, "🏠 Inicio / Home"),
    el("a", { class: "menu-link", href: "#/informe" }, "📄 Informe / Status"),
    el("a", { class: "menu-link", href: "about.html" }, "🦉 Acerca de / Standards"),
    el("a", { class: "menu-link", href: "docs/" }, "📚 Documentación / Docs"),
    soundToggle(),
    themeSelector());
  const onDoc = (e) => { if (!wrap.contains(e.target)) close(); };
  const onKey = (e) => { if (e.key === "Escape") { close(); btn.focus(); } };
  const close = () => {
    if (!open) return;
    open = false;
    panel.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onDoc);
    document.removeEventListener("keydown", onKey);
  };
  const btn = el("button", {
    class: "menu-btn", type: "button",
    "aria-expanded": "false", "aria-label": "Menú del sitio / Site menu",
    onclick: () => {
      if (open) return close();
      open = true;
      panel.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      setTimeout(() => document.addEventListener("click", onDoc), 0); // skip the opening click
      document.addEventListener("keydown", onKey);
      panel.querySelector("a").focus();
    },
  }, "☰");
  const wrap = el("span", { class: "menu-wrap no-print" }, btn, panel);
  return wrap;
}

/**
 * M16 T: 🎨 theme selector — Auto / Light / Dark, inside the ☰ menu below
 * the 🔊 Sonido row. Light is the DEFAULT (owner, 2026-07-09): an unset
 * theme sets `data-theme="light"`. Auto follows `prefers-color-scheme`;
 * Light and Dark set `data-theme` on <html> and win over the OS in both the
 * current and the redesign looks. Persisted in settings.theme; the inline
 * loader in each HTML head re-applies it before paint so there is no FOUC.
 */
function applyTheme(t) {
  const html = document.documentElement;
  if (t === "light" || t === "dark") html.setAttribute("data-theme", t);
  else html.removeAttribute("data-theme");
}
function themeSelector() {
  const options = [
    { value: "auto", label: "Auto" },
    { value: "light", label: "Claro / Light" },
    { value: "dark", label: "Oscuro / Dark" },
  ];
  const current = () => store.getSettings().theme || "light";
  const buttons = options.map((o) =>
    el("button", {
      class: "theme-option", type: "button",
      "aria-pressed": String(current() === o.value),
      "data-theme-value": o.value,
      onclick: (e) => {
        store.setSetting("theme", o.value);
        applyTheme(o.value);
        for (const b of buttons) {
          const active = b.getAttribute("data-theme-value") === o.value;
          b.setAttribute("aria-pressed", String(active));
        }
        announce(`Tema: ${o.label}`);
      },
    }, o.label));
  return el("div", { class: "menu-link theme-selector", role: "group", "aria-label": "Tema / Theme" },
    el("span", { class: "theme-label" }, "🎨 Tema / Theme"),
    el("div", { class: "theme-options" }, ...buttons));
}

/**
 * 🔊/🔇 toggle — lives INSIDE the ☰ menu (owner, 2026-07-08: cleaner
 * header). Hidden entirely when no audio backend exists.
 */
function soundToggle() {
  if (!audioAvailable()) return null;
  const label = (on) => (on ? "🔊 Sonido: encendido / Sound on" : "🔇 Sonido: apagado / Sound off");
  const on = store.getSettings().sound;
  return el("button", {
    class: "menu-link sound-toggle", type: "button",
    "aria-pressed": String(on),
    onclick: (e) => {
      const next = !store.getSettings().sound;
      store.setSetting("sound", next);
      e.currentTarget.textContent = label(next);
      e.currentTarget.setAttribute("aria-pressed", String(next));
      if (next) say("Hola");
    },
  }, label(on));
}

const app = document.getElementById("app");
const live = document.getElementById("live");

function announce(msg) {
  live.textContent = "";
  requestAnimationFrame(() => (live.textContent = msg));
}

/** Append screen content, skipping nulls (native append() stringifies them). */
function mount(...nodes) {
  app.append(...nodes.flat().filter(Boolean));
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) node.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    node.append(c.nodeType ? c : document.createTextNode(c));
  }
  return node;
}

/**
 * Sticky-hover fix: browsers re-apply :hover to whatever lands under the
 * last pointer position, so a freshly rendered answer grid can show a
 * "still selected" outline in the previous answer's slot (especially on
 * touch, where the virtual pointer stays at the last tap). Suppress hover
 * styling until the pointer genuinely moves again.
 */
function suppressHover(container) {
  container.classList.add("no-hover");
  container.addEventListener("pointermove", () => container.classList.remove("no-hover"), { once: true });
}

/**
 * M7 🔍 Pista (from direct K-5 user feedback): a hint button that reveals
 * the Estudia column(s) for the verb in play. No scoring penalty — the
 * learner still maps the person to the row (NBPTS Std IV scaffolding).
 * Lola raises her magnifying glass while the panel is open.
 */
function makeHint(verb, tenses, lola) {
  const { vosotros } = store.getSettings();
  const persons = [0, 1, 2, 3, 4, 5].filter((p) => vosotros || p !== 4);
  const panel = el("div", { class: "hint-panel", hidden: true },
    el("div", { class: "hint-tables" },
      tenses.map((tn) =>
        el("table", { class: "conj-table hint-table" },
          el("thead", {}, el("tr", {},
            el("th", { scope: "col" }, ""),
            el("th", { scope: "col" }, `${verb.inf} · ${TENSE_LABELS[tn].es}`))),
          el("tbody", {}, persons.map((pp) => {
            const form = conjugate(verb, tn)[pp];
            return el("tr", {},
              el("th", { scope: "row" }, personDisplay(pp)),
              el("td", {}, audioAvailable()
                // same tap-to-hear affordance as the Estudia table
                ? el("button", { class: "cell-speak", onclick: () => sayForm(pp, form) }, form)
                : form));
          }))))));
  const btn = el("button", {
    class: "hint-btn", type: "button", "aria-expanded": "false",
    "aria-label": "Pista: ver la tabla del verbo",
    onclick: () => {
      const open = panel.hidden;
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      btn.classList.toggle("open", open);
      const typing = document.activeElement?.classList?.contains("type-input");
      lola.setState(open ? "is-hint" : typing ? "is-watching" : "is-idle");
    },
  }, "🔍 Pista");
  return { btn, panel };
}

function starRow(n, max = 3) {
  return el("span", { class: "stars", "aria-label": `${n} de ${max} estrellas` },
    Array.from({ length: max }, (_, i) => el("span", { class: i < n ? "star on" : "star" }, i < n ? "★" : "☆")));
}

function badgeRow(n, max = 3) {
  return el("span", { class: "stars badges", "aria-label": `${n} de ${max} insignias de escucha` },
    Array.from({ length: max }, (_, i) => el("span", { class: i < n ? "badge on" : "badge" }, "🎧")));
}

/** 🎧 badges earned in a set (max 9 = 3 tenses × 3); parallel to stars. */
function listenBadges(setId) {
  return TENSES.reduce((sum, t) => sum + (store.getBest(setId, t, LISTEN)?.stars ?? 0), 0);
}

function personDisplay(i) {
  return PERSONS[i];
}

// ---------------------------------------------------------------- routing

function parseRoute() {
  const h = location.hash.replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean);
  if (parts[0] === "set" && SETS[+parts[1] - 1]) return { screen: "set", setId: +parts[1] };
  if (parts[0] === "study" && SETS[+parts[1] - 1] && TENSES.includes(parts[2]))
    return { screen: "study", setId: +parts[1], tense: parts[2] };
  if (parts[0] === "practica" && SETS[+parts[1] - 1] && TENSES.includes(parts[2]))
    return { screen: "practica", setId: +parts[1], tense: parts[2] };
  if (parts[0] === "play" && SETS[+parts[1] - 1] && parts[2] === "contrast")
    return { screen: "contrast", setId: +parts[1] };
  if (parts[0] === "play" && SETS[+parts[1] - 1] && TENSES.includes(parts[2]) && (MODES.includes(parts[3]) || parts[3] === LISTEN))
    return { screen: "play", setId: +parts[1], tense: parts[2], mode: parts[3] };
  if (parts[0] === "informe") return { screen: "report" };
  return { screen: "home" };
}

/** Stars earned in a set including the contrast challenge (max STARS_PER_SET). */
function earnedStars(setId) {
  return (
    store.setStars(setId, TENSES, MODES) +
    (store.getBest(setId, CONTRAST_KEY.tense, CONTRAST_KEY.mode)?.stars ?? 0)
  );
}

function go(hash) {
  location.hash = hash;
}

/** Per-route page titles (WCAG 2.4.2) — tabs/history distinguish screens. */
function routeTitle(r) {
  if (r.screen === "set") return `Grupo ${r.setId} · Conjuga`;
  if (r.screen === "study") return `Estudia ${TENSE_LABELS[r.tense].es} · Grupo ${r.setId} · Conjuga`;
  if (r.screen === "practica") return `Práctica · Grupo ${r.setId} · Conjuga`;
  if (r.screen === "contrast") return `¿Pretérito o imperfecto? · Grupo ${r.setId} · Conjuga`;
  if (r.screen === "play") {
    const label = r.mode === LISTEN ? LISTEN_META.es : MODE_META[r.mode].es;
    return `${label} ${TENSE_LABELS[r.tense].es} · Grupo ${r.setId} · Conjuga`;
  }
  if (r.screen === "report") return "Informe / Status · Conjuga";
  return "Conjuga — Spanish Verb Skills Builder (K-5 DLI)";
}

function render() {
  const route = parseRoute();
  document.title = routeTitle(route);
  app.replaceChildren();
  window.scrollTo(0, 0);
  if (route.screen === "home") renderHome();
  else if (route.screen === "set") renderSet(route.setId);
  else if (route.screen === "study") renderStudy(route.setId, route.tense);
  else if (route.screen === "practica") renderPractica(route.setId, route.tense);
  else if (route.screen === "contrast") renderContrast(route.setId);
  else if (route.screen === "report") renderReport();
  else renderPlay(route.setId, route.tense, route.mode);
}

window.addEventListener("hashchange", render);

// skip link (WCAG 2.4.1): focus main content without disturbing the hash router
document.getElementById("skip")?.addEventListener("click", (e) => {
  e.preventDefault();
  app.focus();
});

// ---------------------------------------------------------------- home

function reviewLabel(item) {
  if (item.mode === "contrast") return `Grupo ${item.setId} · ⚔️ ¿Pretérito o imperfecto?`;
  if (item.mode === LISTEN) return `Grupo ${item.setId} · ${TENSE_LABELS[item.tense].es} · 🎧 Escucha`;
  return `Grupo ${item.setId} · ${TENSE_LABELS[item.tense].es} · ${MODE_META[item.mode].icon} ${MODE_META[item.mode].es}`;
}

function reviewHref(item) {
  if (item.mode === "contrast") return `#/play/${item.setId}/contrast`;
  return `#/play/${item.setId}/${item.tense}/${item.mode}`;
}

function renderReviewQueue() {
  const due = store.dueForReview();
  if (!due.length) return null;
  return el("section", { class: "review-queue", "aria-label": "Repaso de hoy" },
    el("h2", {}, "🔁 Repasa hoy ", el("span", { class: "h-en", lang: "en" }, "(today's review)")),
    el("div", { class: "review-list" },
      due.map((item) =>
        el("a", { class: "review-item", href: reviewHref(item) },
          el("span", {}, reviewLabel(item)),
          item.mode === LISTEN ? badgeRow(item.stars) : starRow(item.stars)))),
  );
}

function renderHome() {
  const totalEarned = SETS.reduce((sum, s) => sum + earnedStars(s.id), 0);

  mount(
    el("header", { class: "hero" },
      menuButton(),
      el("h1", { class: "home-title" }, createLola(76).el, "Conjuga"),
      el("p", { class: "brand-sub", lang: "en" }, "part of DLIskills.com"),
      el("p", { class: "lola-greeting" }, "¡Hola! Soy Lola la Lechuza."),
      el("p", { class: "tagline" }, "Practica los verbos en español — ¡5 verbos a la vez!"),
      el("p", { class: "tagline-en", lang: "en" }, "Spanish verb practice for dual-language learners · present · preterite · imperfect"),
      el("p", { class: "total-stars" }, `⭐ ${totalEarned} / ${SETS.length * STARS_PER_SET} estrellas`),
    ),
    renderReviewQueue(),
    el("section", { class: "set-grid", "aria-label": "Grupos de verbos" },
      // NN-3 fix (owner decision 2026-07-08, option a): the first group with
      // no stars AND no badges gets a "start here" ribbon for new learners
      (() => {
        const firstFresh = SETS.find((s) => earnedStars(s.id) === 0 && listenBadges(s.id) === 0)?.id;
        return SETS.map((s) => {
        const earned = earnedStars(s.id);
        return el("a", { class: "set-card", href: `#/set/${s.id}` },
          el("span", { class: "set-num" }, `Grupo ${s.id}`),
          el("span", { class: "set-verbs" }, s.verbs.map((v) => v.inf).join(" · ")),
          el("span", { class: "set-progress" },
            `⭐ ${earned}/${STARS_PER_SET}`,
            listenBadges(s.id) ? ` · 🎧 ${listenBadges(s.id)}/9` : ""),
          s.id === firstFresh
            ? el("span", { class: "start-here" }, "¡Empieza aquí! ", el("span", { class: "h-en", lang: "en" }, "Start here"))
            : null,
        );
        });
      })(),
    ),
    renderFooter(),
  );
}

function renderFooter() {
  const settings = store.getSettings();
  // NN-1 (option b): mid-round, toggles save WITHOUT re-rendering — a
  // re-render would silently restart the round; applies as play continues.
  const inRound = ["play", "contrast", "practica"].includes(parseRoute().screen);
  const applied = el("p", { class: "footer-applied", role: "status", hidden: true },
    "✓ Guardado — se aplica al continuar. Saved — applies as you continue.");
  const applySetting = (name, value) => {
    store.setSetting(name, value);
    if (!inRound) return render();
    applied.hidden = false;
  };
  return el("footer", { class: "site-footer" },
    el("div", { class: "footer-top" },
      el("span", { class: "footer-site" }, "Dual-Language Immersion (DLI) Skills"),
      el("label", { class: "toggle" },
        el("input", {
          class: "hints-toggle", type: "checkbox", checked: settings.hints,
          onchange: (e) => applySetting("hints", e.target.checked),
        }),
        " 🔍 Pistas / Hints",
      ),
      el("label", { class: "toggle" },
        el("input", {
          type: "checkbox", checked: settings.vosotros,
          onchange: (e) => applySetting("vosotros", e.target.checked),
        }),
        " Incluir vosotros/as",
      ),
      applied,
    ),
    el("div", { class: "footer-links" },
      el("a", { class: "linklike", href: "#/informe" }, "📄 Informe / Status"),
      el("a", { class: "linklike", href: "about.html" }, "Acerca de / Standards"),
      el("a", { class: "linklike footer-docs", href: "docs/" }, "📚 Documentación / Docs"),
      el("button", {
        class: "linklike",
        onclick: () => {
          if (confirm("¿Borrar todo el progreso? / Erase all progress?")) {
            store.resetProgress();
            render();
          }
        },
      }, "Borrar progreso"),
    ),
    el("p", { class: "footer-note" },
      "Gratis y sin registro · Free, no login · Aligned to ",
      el("a", { class: "footer-std", href: "https://www.nbpts.org/wp-content/uploads/2021/09/ECYA-WL.pdf", target: "_blank", rel: "noopener" },
        "NBPTS"),
      " and ",
      el("a", { class: "footer-std", href: "https://www.actfl.org/uploads/files/general/Professional-Learning/Can-Do-Intro-Overview.pdf", target: "_blank", rel: "noopener" },
        "NCSSFL-ACTFL"),
      " World Language standards"),
    // owner-specified credits (M9 F3); kids appear ONLY as pseudonyms
    el("p", { class: "footer-credits", lang: "en" },
      "Created by Lucia Perales, EdD (wife/mother/educator) and Aaron Soto, MHCID (husband/father/technologist)",
      el("br"),
      "DLI K-5 Graduate “A1” (daughter/consultant) and DLI 3rd Grader “A2” (son/consultant)"),
  );
}

// ---------------------------------------------------------------- set screen

function renderSet(setId) {
  const set = SETS[setId - 1];
  const tense = sessionStorage.getItem("conjuga.tense") || "present";

  const contrastBest = store.getBest(set.id, CONTRAST_KEY.tense, CONTRAST_KEY.mode);

  mount(
    el("nav", { class: "crumbs" }, el("a", { href: "#/" }, "← Todos los grupos"), menuButton()),
    el("h1", {}, `Grupo ${set.id}`),
    el("ul", { class: "verb-chips" },
      set.verbs.map((v) => el("li", { class: "chip" },
        el("strong", {}, v.inf), el("span", { class: "gloss", lang: "en" }, ` ${v.en}`)))),

    el("h2", {}, "1 · Elige un tiempo ", el("span", { class: "h-en", lang: "en" }, "(pick a tense)")),
    el("div", { class: "tense-row", role: "radiogroup", "aria-label": "Tiempo verbal" },
      TENSES.map((t) =>
        el("button", {
          class: `tense-card ${t === tense ? "selected" : ""}`,
          "data-tense": t,
          role: "radio", "aria-checked": String(t === tense),
          onclick: () => { sessionStorage.setItem("conjuga.tense", t); render(); },
        },
          el("span", { class: "tense-icon" }, TENSE_META[t].icon),
          el("strong", {}, TENSE_LABELS[t].es),
          el("span", { class: "tense-hint" }, TENSE_META[t].hint),
          el("span", { class: "tense-example" }, TENSE_META[t].example),
        ))),

    el("h2", {}, "2 · Estudia y juega ", el("span", { class: "h-en", lang: "en" }, "(study, then play)")),
    el("div", { class: "mode-row" },
      el("a", { class: "mode-card study", "data-mode": "study", href: `#/study/${set.id}/${tense}` },
        el("span", { class: "mode-icon" }, "📖"),
        el("strong", {}, "Estudia"),
        el("span", { class: "mode-en", lang: "en" }, "See the tables"),
      ),
      // unscored on purpose: no starRow here, ever (M8 owner decision)
      el("a", { class: "mode-card practica-card", "data-mode": "practica", href: `#/practica/${set.id}/${tense}` },
        el("span", { class: "mode-icon" }, PRACTICA_META.icon),
        el("strong", {}, PRACTICA_META.es),
        el("span", { class: "mode-en", lang: "en" }, PRACTICA_META.en),
        el("span", { class: "mode-free" }, "práctica libre · free practice"),
      ),
      MODES.map((m) => {
        const best = store.getBest(set.id, tense, m);
        return el("a", { class: "mode-card", "data-mode": m, href: `#/play/${set.id}/${tense}/${m}` },
          el("span", { class: "mode-icon" }, MODE_META[m].icon),
          el("strong", {}, MODE_META[m].es),
          el("span", { class: "mode-en", lang: "en" }, MODE_META[m].en),
          starRow(best?.stars ?? 0),
        );
      }),
      // Escucha exists only where a Spanish voice does; badges, not stars.
      audioAvailable()
        ? el("a", { class: "mode-card listen-card", "data-mode": "listen", href: `#/play/${set.id}/${tense}/${LISTEN}` },
          el("span", { class: "mode-icon" }, LISTEN_META.icon),
          el("strong", {}, LISTEN_META.es),
          el("span", { class: "mode-en", lang: "en" }, LISTEN_META.en),
          badgeRow(store.getBest(set.id, tense, LISTEN)?.stars ?? 0))
        : null,
    ),

    el("h2", {}, "3 · Reto ", el("span", { class: "h-en", lang: "en" }, "(challenge)")),
    el("div", { class: "mode-row contrast-row" },
      el("a", { class: "mode-card contrast-card", "data-mode": "contrast", href: `#/play/${set.id}/contrast` },
        el("span", { class: "mode-icon" }, "⚔️"),
        el("strong", {}, "¿Pretérito o imperfecto?"),
        el("span", { class: "mode-en", lang: "en" }, "Read the time clue, pick the past tense"),
        starRow(contrastBest?.stars ?? 0),
      ),
    ),
    renderFooter(),
  );
}

// ---------------------------------------------------------------- study

function renderStudy(setId, tense) {
  const set = SETS[setId - 1];
  const { vosotros } = store.getSettings();
  const persons = [0, 1, 2, 3, 4, 5].filter((p) => vosotros || p !== 4);

  const speakable = audioAvailable();

  mount(
    el("nav", { class: "crumbs" }, el("a", { href: `#/set/${setId}` }, `← Grupo ${setId}`), menuButton()),
    el("h1", {}, `📖 Estudia — ${TENSE_LABELS[tense].es}`, infoButton("study")),
    // classroom print header: appears only on the printed study sheet
    el("p", { class: "print-fields print-only" },
      `Grupo ${setId} · Nombre: `, el("span", { class: "fill-line" }, ""),
      "  Fecha: ", el("span", { class: "fill-line short" }, "")),
    el("p", { class: "study-hint" }, `${TENSE_META[tense].icon} ${TENSE_META[tense].hint} — ej.: `,
      el("em", {}, TENSE_META[tense].example)),
    speakable
      ? el("p", { class: "study-hint tap-hint" }, "👆🔊 Toca una forma para escucharla. Tap a form to hear it.")
      : null,
    el("div", { class: "table-scroll" },
      el("table", { class: "conj-table" },
        el("thead", {},
          el("tr", {},
            el("th", { scope: "col" }, ""),
            set.verbs.map((v) => el("th", { scope: "col" },
              el("span", { class: "th-inf" }, v.inf), el("span", { class: "th-gloss", lang: "en" }, v.en))))),
        el("tbody", {},
          persons.map((p) =>
            el("tr", {},
              el("th", { scope: "row" }, personDisplay(p)),
              set.verbs.map((v) => {
                const form = conjugate(v, tense)[p];
                if (!speakable) return el("td", {}, form);
                return el("td", {},
                  el("button", { class: "cell-speak", onclick: () => sayForm(p, form) }, form));
              })))),
      )),
    el("div", { class: "study-actions" },
      // Práctica first: the rebuild-the-table step sits between studying
      // the chart and the scored games (Estudia → Práctica → Elige → …)
      el("a", { class: "btn primary practica-link", href: `#/practica/${setId}/${tense}` },
        `${PRACTICA_META.icon} ${PRACTICA_META.es}`),
      MODES.map((m) => el("a", { class: "btn primary", href: `#/play/${setId}/${tense}/${m}` },
        `${MODE_META[m].icon} ${MODE_META[m].es}`)),
      // every current activity is reachable from Estudia (M7 owner add-on)
      audioAvailable()
        ? el("a", { class: "btn primary listen-link", href: `#/play/${setId}/${tense}/${LISTEN}` },
          `${LISTEN_META.icon} ${LISTEN_META.es}`)
        : null,
      tense !== "present"
        ? el("a", { class: "btn contrast-link", href: `#/play/${setId}/contrast` },
          "⚔️ ¿Pretérito o imperfecto?")
        : null,
      el("button", { class: "btn print-btn", onclick: () => window.print() }, "🖨️ Imprimir")),
    renderFooter(),
  );
}

// ---------------------------------------------------------------- práctica

/**
 * 🧱 Práctica (M8) — rebuild the Estudia table by matching each form to its
 * person, column by column. UNSCORED by owner decision: no stars/badges,
 * no recordResult, can't be failed. Vocalization per the standard rules.
 * Duplicate forms (imperfect yo/él) match by string equality, so either
 * tile fits either matching row.
 */
function renderPractica(setId, tense) {
  const set = SETS[setId - 1];
  const { vosotros } = store.getSettings();
  const persons = [0, 1, 2, 3, 4, 5].filter((p) => vosotros || p !== 4);
  const speakable = audioAvailable();
  const lola = createLola(52);
  const state = { verbIdx: 0, selected: null, remaining: 0 };

  const feedback = el("div", { class: "feedback", role: "status" });
  const bankWrap = el("div", { class: "practica-bank-wrap" });
  const say2 = (cls, text) => { feedback.className = `feedback ${cls}`; feedback.textContent = text; announce(text); };

  const heads = set.verbs.map((v) => el("th", { scope: "col" },
    el("span", { class: "th-inf" }, v.inf), el("span", { class: "th-gloss", lang: "en" }, v.en)));
  const cells = set.verbs.map(() => ({}));
  const table = el("table", { class: "conj-table practica-table" },
    el("thead", {}, el("tr", {}, el("th", { scope: "col" }, ""), heads)),
    el("tbody", {}, persons.map((p) =>
      el("tr", {},
        el("th", { scope: "row" }, personDisplay(p)),
        set.verbs.map((v, vi) => (cells[vi][p] = el("td", { class: "practica-cell" })))))));

  mount(
    el("nav", { class: "crumbs" },
      el("a", { href: `#/set/${setId}` }, "← Salir"),
      el("a", { href: `#/study/${setId}/${tense}` }, "📖 Estudia"),
      menuButton()),
    el("h1", { class: "match-title" }, lola.el, `${PRACTICA_META.icon} Práctica — ${TENSE_LABELS[tense].es}`, infoButton("practica")),
    el("p", { class: "match-help" },
      "Reconstruye la tabla palabra por palabra. Rebuild the table word by word — no stars, just practice."),
    el("div", { class: "table-scroll" }, table),
    bankWrap, feedback,
    renderFooter(),
  );

  function startColumn() {
    const verb = set.verbs[state.verbIdx];
    state.selected = null;
    state.remaining = persons.length;
    heads.forEach((h, vi) => h.classList.toggle("col-active", vi === state.verbIdx));
    for (const p of persons) {
      const td = cells[state.verbIdx][p];
      td.classList.add("col-active");
      td.replaceChildren(el("button", {
        class: "drop-slot", "aria-label": `Colocar la forma de ${personDisplay(p)}`,
        onclick: () => place(p),
      }, "____"));
    }
    bankWrap.replaceChildren(
      el("p", { class: "bank-title" },
        el("strong", {}, verb.inf), ` — ${verb.en} · toca una palabra y luego su fila`),
      el("div", { class: "practica-bank", "aria-label": `Palabras de ${verb.inf}` },
        buildPracticaBank(verb, tense, persons).map((form) => {
          const b = el("button", {
            class: "match-card bank-tile", "aria-pressed": "false",
            onclick: () => pickTile(form, b),
          }, form);
          return b;
        })));
    suppressHover(bankWrap);
  }

  function pickTile(form, btn) {
    const prev = bankWrap.querySelector(".bank-tile.picked");
    if (prev && prev !== btn) { prev.classList.remove("picked"); prev.setAttribute("aria-pressed", "false"); }
    const on = !btn.classList.contains("picked");
    btn.classList.toggle("picked", on);
    btn.setAttribute("aria-pressed", String(on));
    state.selected = on ? { form, btn } : null;
  }

  function place(p) {
    const verb = set.verbs[state.verbIdx];
    if (!state.selected) {
      return say2("almost", "Primero toca una palabra del banco. Pick a word from the bank first.");
    }
    const { form, btn } = state.selected;
    const td = cells[state.verbIdx][p];
    if (form === conjugate(verb, tense)[p]) {
      state.selected = null;
      btn.remove();
      td.classList.remove("col-active");
      td.classList.add("filled");
      td.replaceChildren(speakable
        ? el("button", { class: "cell-speak", onclick: () => sayForm(p, form) }, form)
        : form);
      lola.setState("is-hop");
      say2("good", `${PRAISE[Math.floor(Math.random() * PRAISE.length)]} ${personDisplay(p)} ${form}`);
      sayForm(p, form);
      if (--state.remaining === 0) columnDone();
    } else {
      lola.setState("is-curious");
      for (const b of [btn, td.querySelector(".drop-slot")]) {
        if (!b) continue;
        b.classList.add("shake");
        setTimeout(() => b.classList.remove("shake"), 400);
      }
      say2("bad", "Casi — inténtalo otra vez. Try again!");
    }
  }

  function columnDone() {
    state.verbIdx++;
    if (state.verbIdx < set.verbs.length) {
      say2("good", "¡Columna completa! Siguiente verbo →");
      return startColumn();
    }
    heads.forEach((h) => h.classList.remove("col-active"));
    lola.setState("is-celebrate");
    say2("good", "¡Tabla completa!");
    bankWrap.replaceChildren(
      el("div", { class: "practica-done" },
        el("p", { class: "score-line" }, "¡Tabla completa! 🎉"),
        el("p", {}, "¡Muy bien! Ahora, ¿un juego? · Great! Ready for a game?"),
        el("div", { class: "result-actions" },
          el("a", { class: "btn", href: `#/study/${setId}/${tense}` }, "📖 Estudia"),
          el("button", { class: "btn", onclick: () => render() }, "🔁 Otra vez"),
          el("a", { class: "btn primary", href: `#/play/${setId}/${tense}/choice` }, "✅ Elige"))));
  }

  startColumn();
}

// ---------------------------------------------------------------- play

function renderPlay(setId, tense, mode) {
  const set = SETS[setId - 1];
  const { vosotros } = store.getSettings();

  if (mode === "match") return renderMatch(set, tense, vosotros);
  if (mode === LISTEN && !audioAvailable()) {
    // shared/bookmarked link on a voiceless device — send to the group screen
    go(`#/set/${setId}`);
    return;
  }

  const targets = sampleTargets(set.verbs, tense, QUESTIONS_PER_ROUND, vosotros);
  const state = { i: 0, score: 0, streak: 0, misses: [], usedAccentRetry: false };
  const lola = createLola(46);

  const header = el("div", { class: "play-header" });
  const stage = el("div", { class: "stage" });
  mount(
    el("nav", { class: "crumbs" },
      el("a", { href: `#/set/${setId}` }, "← Salir"),
      el("a", { href: `#/study/${setId}/${tense}` }, "📖 Estudia"),
      menuButton()),
    el("p", { class: "lola-help" }, "¡Ayuda a Lola a llegar a su nido! · Help Lola reach her nest!"),
    header, stage,
    renderFooter(),
  );

  function renderHeader() {
    const pct = (state.i / targets.length) * 100;
    header.replaceChildren(
      el("div", { class: "progress-wrap" },
        el("div", { class: "bar-holder" },
          el("div", { class: "progress-bar" },
            el("div", { class: "progress-fill", style: `width:${pct}%` })),
          el("span", { class: "play-lola", style: `left:clamp(26px, ${pct}%, calc(100% - 28px))` }, lola.el),
          createNest()),
        el("span", { class: "progress-text" }, `${Math.min(state.i + 1, targets.length)} / ${targets.length}`)),
      // role="img" so the aria-label is permitted (axe: aria-prohibited-attr)
      el("span", { class: "streak", role: "img", "aria-label": "racha" }, state.streak >= 2 ? `🔥 ${state.streak}` : ""),
    );
  }

  function finish() {
    showResults(set, tense, mode, state.score, targets.length, state.misses);
  }

  function next() {
    state.i++;
    state.usedAccentRetry = false;
    if (state.i >= targets.length) return finish();
    renderQuestion();
  }

  // Escucha: the form is heard, never shown. Prompts bypass the mute
  // setting — entering the listening mode is explicit audio intent.
  function listenPromptCard(t) {
    return el("div", { class: "prompt" },
      el("span", { class: "prompt-tense", "data-tense": tense }, `${TENSE_META[tense].icon} ${TENSE_LABELS[tense].es}`),
      infoButton(mode),
      el("p", { class: "listen-question" }, "¿Qué forma escuchas? ", el("span", { class: "h-en", lang: "en" }, "Which form do you hear?")),
      el("div", { class: "listen-controls" },
        el("button", { class: "btn primary", type: "button", onclick: () => speak(t.answer) }, "🔊 Escuchar"),
        // 0.5, not ~0.65: iOS maps sub-1.0 rates non-linearly and many
        // Android voices quantize, so smaller contrasts sound identical.
        el("button", { class: "btn", type: "button", onclick: () => speak(t.answer, 0.5) }, "🐢 Despacio")),
      el("span", { class: "prompt-verb" }, `${t.verb.inf} — ${t.verb.en}`),
    );
  }

  function promptCard(t) {
    return el("div", { class: "prompt" },
      el("span", { class: "prompt-tense", "data-tense": tense }, `${TENSE_META[tense].icon} ${TENSE_LABELS[tense].es}`),
      infoButton(mode),
      el("div", { class: "prompt-main" },
        el("span", { class: "prompt-person" }, personDisplay(t.person)),
        el("span", { class: "prompt-blank" }, "____"),
      ),
      el("span", { class: "prompt-verb" }, `${t.verb.inf} — ${t.verb.en}`),
    );
  }

  function renderQuestion() {
    renderHeader();
    lola.setState("is-idle");
    const t = targets[state.i];
    const feedback = el("div", { class: "feedback", role: "status" });
    const card = mode === LISTEN ? listenPromptCard(t) : promptCard(t);
    // 🔍 Pista: Elige + Escribe only here (Escucha would be undermined)
    const hint = mode !== LISTEN && store.getSettings().hints ? makeHint(t.verb, [tense], lola) : null;
    if (hint) card.append(hint.btn);
    stage.replaceChildren(card, ...(hint ? [hint.panel] : []), feedback);
    if (mode === LISTEN) speak(t.answer);

    const lockAndAdvance = (correct, chosenText) => {
      if (correct) {
        state.score++;
        state.streak++;
        lola.setState(state.streak >= 3 ? "is-turn" : "is-hop");
        const msg = PRAISE[Math.floor(Math.random() * PRAISE.length)];
        feedback.className = "feedback good";
        feedback.textContent = `${msg} ${personDisplay(t.person)} ${t.answer}`;
        announce(msg);
        const played = sayForm(t.person, t.answer);
        if (mode === LISTEN) {
          played.then(() => setTimeout(next, 300));
        } else {
          setTimeout(next, 950);
        }
      } else {
        state.streak = 0;
        state.misses.push(t);
        lola.setState("is-curious");
        feedback.className = "feedback bad";
        feedback.replaceChildren(
          `Casi. La respuesta es: `,
          el("strong", {}, `${personDisplay(t.person)} ${t.answer}`),
          el("div", {}, el("button", { class: "btn primary", onclick: next }, "Siguiente →")),
        );
        announce(`La respuesta es ${t.answer}`);
        sayForm(t.person, t.answer);
      }
    };

    if (mode === "choice" || mode === LISTEN) {
      const options = buildChoices(t, TENSES);
      const grid = el("div", { class: "choices" },
        options.map((opt, idx) =>
          el("button", {
            class: "choice",
            onclick: (e) => {
              for (const b of grid.querySelectorAll("button")) b.disabled = true;
              const correct = opt === t.answer;
              e.currentTarget.classList.add(correct ? "correct" : "wrong");
              if (!correct) {
                for (const b of grid.querySelectorAll("button")) {
                  if (b.textContent.endsWith(t.answer)) b.classList.add("correct");
                }
              }
              lockAndAdvance(correct, opt);
            },
          }, el("kbd", {}, String(idx + 1)), ` ${opt}`)));
      suppressHover(grid);
      stage.insertBefore(grid, feedback);

      const onKey = (e) => {
        const n = +e.key;
        if (n >= 1 && n <= options.length) {
          const btn = grid.querySelectorAll("button")[n - 1];
          if (btn && !btn.disabled) btn.click();
        }
      };
      document.addEventListener("keydown", onKey, { once: false });
      // Clean up when the stage re-renders.
      const obs = new MutationObserver(() => {
        if (!grid.isConnected) { document.removeEventListener("keydown", onKey); obs.disconnect(); }
      });
      obs.observe(stage, { childList: true });
    } else {
      // type mode
      const input = el("input", {
        class: "type-input", type: "text", autocomplete: "off", autocapitalize: "none",
        spellcheck: "false", "aria-label": "Escribe la forma del verbo", enterkeyhint: "done",
        onfocus: () => lola.setState("is-watching"),
        onblur: () => lola.setState("is-idle"),
      });
      const check = () => {
        const given = normalizeAnswer(input.value);
        if (!given) return;
        if (given === t.answer) return lockAndAdvance(true, given);
        if (!state.usedAccentRetry && stripAccents(given) === stripAccents(t.answer)) {
          state.usedAccentRetry = true;
          feedback.className = "feedback almost";
          feedback.textContent = "¡Casi! Revisa la tilde (á é í ó ú). Try again!";
          announce("Casi, revisa la tilde");
          input.focus();
          return;
        }
        input.disabled = true;
        lockAndAdvance(false, given);
      };
      const accents = el("div", { class: "accent-row", "aria-label": "letras con tilde" },
        ["á", "é", "í", "ó", "ú", "ñ"].map((ch) =>
          el("button", {
            class: "accent-btn", type: "button",
            onclick: () => { input.value += ch; input.focus(); },
          }, ch)));
      const form = el("form", {
        class: "type-form",
        onsubmit: (e) => { e.preventDefault(); check(); },
      }, input, accents, el("button", { class: "btn primary", type: "submit" }, "Comprobar ✔"));
      suppressHover(form);
      stage.insertBefore(form, feedback);
      input.focus();
    }
  }

  renderQuestion();
}

// ---------------------------------------------------------------- match mode

function renderMatch(set, tense, vosotros) {
  const pairs = buildMatchPairs(set.verbs, tense, vosotros);
  const state = { matched: 0, firstTryHits: 0, attemptedIds: new Set(), selected: null };
  const lola = createLola(52);

  const feedback = el("div", { class: "feedback", role: "status" });
  const board = el("div", { class: "match-board" });
  mount(
    el("nav", { class: "crumbs" },
      el("a", { href: `#/set/${set.id}` }, "← Salir"),
      el("a", { href: `#/study/${set.id}/${tense}` }, "📖 Estudia"),
      menuButton()),
    el("h1", { class: "match-title" }, lola.el, `🧩 Empareja — ${TENSE_LABELS[tense].es}`, infoButton("match")),
    el("p", { class: "match-help" }, "Une cada persona con su forma. Match each person with its form."),
    board, feedback,
    renderFooter(),
  );

  const leftCards = shuffle(pairs).map((p) => ({ side: "L", id: p.id, label: p.left }));
  const rightCards = shuffle(pairs).map((p) => ({ side: "R", id: p.id, label: p.right }));

  const buttons = new Map();
  const col = (cards, cls) => el("div", { class: `match-col ${cls}` },
    cards.map((c) => {
      const b = el("button", { class: "match-card", onclick: () => pick(c, b) }, c.label);
      buttons.set(`${c.side}${c.id}`, b);
      return b;
    }));
  board.append(col(leftCards, "left"), col(rightCards, "right"));
  suppressHover(board);

  function pick(card, btn) {
    if (btn.classList.contains("done")) return;
    if (!state.selected) {
      state.selected = { card, btn };
      btn.classList.add("picked");
      return;
    }
    if (state.selected.btn === btn) {
      btn.classList.remove("picked");
      state.selected = null;
      return;
    }
    if (state.selected.card.side === card.side) {
      state.selected.btn.classList.remove("picked");
      state.selected = { card, btn };
      btn.classList.add("picked");
      return;
    }
    const a = state.selected;
    state.selected = null;
    a.btn.classList.remove("picked");
    suppressHover(board);
    if (a.card.id === card.id) {
      if (!state.attemptedIds.has(card.id)) state.firstTryHits++;
      state.attemptedIds.add(card.id);
      for (const b of [a.btn, btn]) { b.classList.add("done"); b.disabled = true; }
      state.matched++;
      lola.setState("is-turn");
      feedback.className = "feedback good";
      feedback.textContent = PRAISE[Math.floor(Math.random() * PRAISE.length)];
      const pair = pairs.find((p) => p.id === card.id);
      sayForm(pair.person, pair.right);
      if (state.matched === pairs.length) {
        setTimeout(() => showResults(set, tense, "match", state.firstTryHits, pairs.length, []), 700);
      }
    } else {
      state.attemptedIds.add(card.id).add(a.card.id);
      for (const b of [a.btn, btn]) {
        b.classList.add("shake");
        setTimeout(() => b.classList.remove("shake"), 400);
      }
      feedback.className = "feedback bad";
      feedback.textContent = "Casi — inténtalo otra vez. Try again!";
    }
  }
}

// ---------------------------------------------------------------- contrast

function renderContrast(setId) {
  const set = SETS[setId - 1];
  const { vosotros } = store.getSettings();
  const questions = buildContrastQuestions(set.verbs, QUESTIONS_PER_ROUND, vosotros);
  const state = { i: 0, score: 0, streak: 0, misses: [] };
  const lola = createLola(46);

  const header = el("div", { class: "play-header" });
  const stage = el("div", { class: "stage" });
  mount(
    el("nav", { class: "crumbs" },
      el("a", { href: `#/set/${setId}` }, "← Salir"),
      el("a", { href: `#/study/${setId}/preterite` }, "📖 Pretérito"),
      el("a", { href: `#/study/${setId}/imperfect` }, "📖 Imperfecto"),
      menuButton()),
    el("h1", { class: "contrast-title" }, "⚔️ ¿Pretérito o imperfecto?"),
    el("p", { class: "match-help" },
      "La palabra del tiempo es la pista: ", el("strong", {}, "una vez ⭐"), " o ",
      el("strong", {}, "muchas veces 🌙"), ". The time word is your clue."),
    el("p", { class: "lola-help" }, "¡Ayuda a Lola a llegar a su nido! · Help Lola reach her nest!"),
    header, stage,
    renderFooter(),
  );

  function renderHeader() {
    const pct = (state.i / questions.length) * 100;
    header.replaceChildren(
      el("div", { class: "progress-wrap" },
        el("div", { class: "bar-holder" },
          el("div", { class: "progress-bar" },
            el("div", { class: "progress-fill", style: `width:${pct}%` })),
          el("span", { class: "play-lola", style: `left:clamp(26px, ${pct}%, calc(100% - 28px))` }, lola.el),
          createNest()),
        el("span", { class: "progress-text" }, `${Math.min(state.i + 1, questions.length)} / ${questions.length}`)),
      // role="img" so the aria-label is permitted (axe: aria-prohibited-attr)
      el("span", { class: "streak", role: "img", "aria-label": "racha" }, state.streak >= 2 ? `🔥 ${state.streak}` : ""),
    );
  }

  function next() {
    state.i++;
    if (state.i >= questions.length)
      return showResults(set, CONTRAST_KEY.tense, CONTRAST_KEY.mode, state.score, questions.length, state.misses);
    renderQuestion();
  }

  function renderQuestion() {
    renderHeader();
    lola.setState("is-idle");
    const q = questions[state.i];
    const feedback = el("div", { class: "feedback", role: "status" });
    const grid = el("div", { class: "choices contrast-choices" },
      q.options.map((opt, idx) =>
        el("button", {
          class: "choice",
          onclick: (e) => {
            for (const b of grid.querySelectorAll("button")) b.disabled = true;
            const correct = opt === q.answer;
            e.currentTarget.classList.add(correct ? "correct" : "wrong");
            if (correct) {
              state.score++;
              state.streak++;
              lola.setState(state.streak >= 3 ? "is-turn" : "is-hop");
              const msg = PRAISE[Math.floor(Math.random() * PRAISE.length)];
              feedback.className = "feedback good";
              feedback.textContent = `${msg} ${q.cue} → ${TENSE_LABELS[q.tense].es} ${TENSE_META[q.tense].icon}`;
              announce(msg);
              sayForm(q.person, q.answer);
              setTimeout(next, 1100);
            } else {
              state.streak = 0;
              state.misses.push({ person: q.person, answer: q.answer, verb: q.verb, tense: q.tense });
              lola.setState("is-curious");
              for (const b of grid.querySelectorAll("button")) {
                if (b.textContent.endsWith(q.answer)) b.classList.add("correct");
              }
              feedback.className = "feedback bad";
              feedback.replaceChildren(
                `"${q.cue}" pide el ${TENSE_LABELS[q.tense].es.toLowerCase()} ${TENSE_META[q.tense].icon}: `,
                el("strong", {}, `${personDisplay(q.person)} ${q.answer}`),
                el("div", {}, el("button", { class: "btn primary", onclick: next }, "Siguiente →")),
              );
              announce(`La respuesta es ${q.answer}`);
              sayForm(q.person, q.answer);
            }
          },
        }, el("kbd", {}, String(idx + 1)), ` ${opt}`)));
    suppressHover(grid);

    // 🔍 Pista shows BOTH past columns — the tense decision stays the task
    const hint = store.getSettings().hints ? makeHint(q.verb, ["preterite", "imperfect"], lola) : null;
    const promptEl = el("div", { class: "prompt" },
      el("span", { class: "prompt-tense cue-chip" }, `🕐 ${q.cue}`),
      infoButton("contrast"),
      el("div", { class: "prompt-main" },
        el("span", { class: "prompt-person" }, personDisplay(q.person)),
        el("span", { class: "prompt-blank" }, "____"),
      ),
      el("span", { class: "prompt-verb" }, `${q.verb.inf} — ${q.verb.en}`),
    );
    if (hint) promptEl.append(hint.btn);
    stage.replaceChildren(promptEl, ...(hint ? [hint.panel] : []), grid, feedback);

    const onKey = (e) => {
      const n = +e.key;
      if (n >= 1 && n <= q.options.length) {
        const btn = grid.querySelectorAll("button")[n - 1];
        if (btn && !btn.disabled) btn.click();
      }
    };
    document.addEventListener("keydown", onKey);
    const obs = new MutationObserver(() => {
      if (!grid.isConnected) { document.removeEventListener("keydown", onKey); obs.disconnect(); }
    });
    obs.observe(stage, { childList: true });
  }

  renderQuestion();
}

// ---------------------------------------------------------------- report

function renderReport() {
  const today = new Date().toLocaleDateString("es", { year: "numeric", month: "long", day: "numeric" });
  const totalEarned = SETS.reduce((sum, s) => sum + earnedStars(s.id), 0);

  mount(
    el("nav", { class: "crumbs no-print" }, el("a", { href: "#/" }, "← Volver"), menuButton()),
    el("div", { class: "report" },
      el("h1", {}, "📄 Informe de progreso ", el("span", { class: "h-en", lang: "en" }, "/ Status"), " — Conjuga", infoButton("report")),
      el("p", { class: "report-fields" },
        "Nombre: ", el("span", { class: "fill-line" }, ""),
        "  Fecha: ", el("span", { class: "fill-line short" }, today)),
      el("p", { class: "report-total" },
        `⭐ Total: ${totalEarned} / ${SETS.length * STARS_PER_SET} estrellas`),
      el("div", { class: "table-scroll" },
        el("table", { class: "conj-table report-table" },
          el("thead", {},
            el("tr", {},
              el("th", { scope: "col" }, "Grupo"),
              TENSES.map((t) => el("th", { scope: "col" }, `${TENSE_META[t].icon} ${TENSE_LABELS[t].es}`)),
              el("th", { scope: "col" }, "⚔️ Reto"),
              el("th", { scope: "col" }, "🎧 Escucha"),
              el("th", { scope: "col" }, "Total ⭐"))),
          el("tbody", {},
            SETS.map((s) =>
              el("tr", {},
                el("th", { scope: "row" },
                  `Grupo ${s.id}`,
                  el("span", { class: "report-verbs" }, s.verbs.map((v) => v.inf).join(", "))),
                TENSES.map((t) => {
                  const earned = MODES.reduce((sum, m) => sum + (store.getBest(s.id, t, m)?.stars ?? 0), 0);
                  return el("td", {}, `${earned}/9`);
                }),
                el("td", {}, `${store.getBest(s.id, CONTRAST_KEY.tense, CONTRAST_KEY.mode)?.stars ?? 0}/3`),
                el("td", {}, `${listenBadges(s.id)}/9`),
                el("td", { class: "report-row-total" }, `${earnedStars(s.id)}/${STARS_PER_SET}`)))))),
      el("p", { class: "report-note" },
        "Estrellas por actividad: ★ ≥60% · ★★ ≥80% · ★★★ 100%. ",
        "Las insignias 🎧 (escucha) son un logro aparte y no cuentan en el total de estrellas. ",
        "El progreso vive solo en este dispositivo (sin cuentas). ",
        "Stars per activity; progress is stored only on this device."),
      el("div", { class: "study-actions no-print" },
        el("button", { class: "btn primary", onclick: () => window.print() }, "🖨️ Imprimir")),
    ),
    renderFooter(),
  );
}

// ---------------------------------------------------------------- results

function showResults(set, tense, mode, score, total, misses) {
  const { stars } = store.recordResult(set.id, tense, mode, score, total);
  const pct = Math.round((score / total) * 100);
  const msg = stars === 3 ? "¡Increíble! Lo dominas." :
    stars === 2 ? "¡Muy bien! Ya casi lo tienes." :
    stars === 1 ? "¡Buen trabajo! Sigue practicando." :
    "Lola sabe que puedes. Estudia la tabla y ¡inténtalo otra vez!";

  const lola = createLola(116);
  lola.setState(stars === 3 ? "is-spin" : stars >= 1 ? "is-celebrate" : "is-idle");

  const isContrast = mode === CONTRAST_KEY.mode;
  const retryHref = isContrast ? `#/play/${set.id}/contrast` : `#/play/${set.id}/${tense}/${mode}`;
  const nextMode = isContrast ? null : MODES[MODES.indexOf(mode) + 1];
  app.replaceChildren(
    el("div", { class: "results" },
      el("h1", {}, "Resultados"),
      lola.el,
      el("div", { class: "big-stars" }, mode === LISTEN ? badgeRow(stars) : starRow(stars)),
      el("p", { class: "score-line" }, `${score} / ${total} · ${pct}%`),
      el("p", { class: "result-msg" }, msg),
      misses.length ? el("div", { class: "review" },
        el("h2", {}, "Para repasar:"),
        el("ul", {},
          misses.map((m) => el("li", {},
            el("strong", {}, `${personDisplay(m.person)} ${m.answer}`),
            ` — ${m.verb.inf} (${TENSE_LABELS[m.tense].es})`)))) : null,
      el("div", { class: "result-actions" },
        el("a", { class: "btn primary", href: retryHref, onclick: () => setTimeout(render, 0) },
          "🔁 Otra vez"),
        nextMode
          ? el("a", { class: "btn", href: `#/play/${set.id}/${tense}/${nextMode}` },
            `${MODE_META[nextMode].icon} ${MODE_META[nextMode].es}`)
          : el("a", { class: "btn", href: `#/set/${set.id}` }, "✨ Elige otro tiempo"),
        el("a", { class: "btn", href: `#/set/${set.id}` }, "🏠 Grupo"),
      ),
    ),
    renderFooter(),
  );
  announce(`Resultados: ${score} de ${total}`);
}

// boot: learn whether clips exist, then paint (offline → instant fallback)
initClips().finally(render);
