/**
 * Conjuga — UI shell. Hash-routed screens:
 *   #/                      home (set picker)
 *   #/set/3                 set detail (tense + mode picker)
 *   #/study/3/present       study tables
 *   #/play/3/present/choice game round (choice | type | match)
 */
import { SETS } from "./verbs.js";
import { conjugate, PERSONS, TENSES, TENSE_LABELS, normalizeAnswer, stripAccents } from "./conjugator.js";
import { sampleTargets, buildChoices, buildMatchPairs, shuffle, QUESTIONS_PER_ROUND } from "./game.js";
import * as store from "./storage.js";

const MODES = ["choice", "type", "match"];
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
const STARS_PER_SET = TENSES.length * MODES.length * 3;

const app = document.getElementById("app");
const live = document.getElementById("live");

function announce(msg) {
  live.textContent = "";
  requestAnimationFrame(() => (live.textContent = msg));
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

function starRow(n, max = 3) {
  return el("span", { class: "stars", "aria-label": `${n} de ${max} estrellas` },
    Array.from({ length: max }, (_, i) => el("span", { class: i < n ? "star on" : "star" }, i < n ? "★" : "☆")));
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
  if (parts[0] === "play" && SETS[+parts[1] - 1] && TENSES.includes(parts[2]) && MODES.includes(parts[3]))
    return { screen: "play", setId: +parts[1], tense: parts[2], mode: parts[3] };
  return { screen: "home" };
}

function go(hash) {
  location.hash = hash;
}

function render() {
  const route = parseRoute();
  app.replaceChildren();
  window.scrollTo(0, 0);
  if (route.screen === "home") renderHome();
  else if (route.screen === "set") renderSet(route.setId);
  else if (route.screen === "study") renderStudy(route.setId, route.tense);
  else renderPlay(route.setId, route.tense, route.mode);
}

window.addEventListener("hashchange", render);

// ---------------------------------------------------------------- home

function renderHome() {
  const totalEarned = SETS.reduce((sum, s) => sum + store.setStars(s.id, TENSES, MODES), 0);

  app.append(
    el("header", { class: "hero" },
      el("h1", {}, "🦉 Conjuga"),
      el("p", { class: "tagline" }, "Practica los verbos en español — ¡5 verbos a la vez!"),
      el("p", { class: "tagline-en" }, "Spanish verb practice for dual-language learners · present · preterite · imperfect"),
      el("p", { class: "total-stars" }, `⭐ ${totalEarned} / ${SETS.length * STARS_PER_SET} estrellas`),
    ),
    el("section", { class: "set-grid", "aria-label": "Grupos de verbos" },
      SETS.map((s) => {
        const earned = store.setStars(s.id, TENSES, MODES);
        return el("a", { class: "set-card", href: `#/set/${s.id}` },
          el("span", { class: "set-num" }, `Grupo ${s.id}`),
          el("span", { class: "set-verbs" }, s.verbs.map((v) => v.inf).join(" · ")),
          el("span", { class: "set-progress" }, `⭐ ${earned}/${STARS_PER_SET}`),
        );
      }),
    ),
    renderFooter(),
  );
}

function renderFooter() {
  const settings = store.getSettings();
  return el("footer", { class: "site-footer" },
    el("div", { class: "footer-controls" },
      el("label", { class: "toggle" },
        el("input", {
          type: "checkbox", checked: settings.vosotros,
          onchange: (e) => { store.setSetting("vosotros", e.target.checked); render(); },
        }),
        " Incluir vosotros/as",
      ),
      el("button", {
        class: "linklike",
        onclick: () => {
          if (confirm("¿Borrar todo el progreso? / Erase all progress?")) {
            store.resetProgress();
            render();
          }
        },
      }, "Borrar progreso"),
      el("a", { class: "linklike", href: "about.html" }, "Acerca de / Standards"),
    ),
    el("p", { class: "footer-note" },
      "Gratis y sin registro · Free, no login · Aligned to NJSLS-WL Novice levels & NBPTS World Languages standards"),
  );
}

// ---------------------------------------------------------------- set screen

function renderSet(setId) {
  const set = SETS[setId - 1];
  const tense = sessionStorage.getItem("conjuga.tense") || "present";

  app.append(
    el("nav", { class: "crumbs" }, el("a", { href: "#/" }, "← Todos los grupos")),
    el("h1", {}, `Grupo ${set.id}`),
    el("ul", { class: "verb-chips" },
      set.verbs.map((v) => el("li", { class: "chip" },
        el("strong", {}, v.inf), el("span", { class: "gloss" }, ` ${v.en}`)))),

    el("h2", {}, "1 · Elige un tiempo ", el("span", { class: "h-en" }, "(pick a tense)")),
    el("div", { class: "tense-row", role: "radiogroup", "aria-label": "Tiempo verbal" },
      TENSES.map((t) =>
        el("button", {
          class: `tense-card ${t === tense ? "selected" : ""}`,
          role: "radio", "aria-checked": String(t === tense),
          onclick: () => { sessionStorage.setItem("conjuga.tense", t); render(); },
        },
          el("span", { class: "tense-icon" }, TENSE_META[t].icon),
          el("strong", {}, TENSE_LABELS[t].es),
          el("span", { class: "tense-hint" }, TENSE_META[t].hint),
          el("span", { class: "tense-example" }, TENSE_META[t].example),
        ))),

    el("h2", {}, "2 · Estudia y juega ", el("span", { class: "h-en" }, "(study, then play)")),
    el("div", { class: "mode-row" },
      el("a", { class: "mode-card study", href: `#/study/${set.id}/${tense}` },
        el("span", { class: "mode-icon" }, "📖"),
        el("strong", {}, "Estudia"),
        el("span", { class: "mode-en" }, "See the tables"),
      ),
      MODES.map((m) => {
        const best = store.getBest(set.id, tense, m);
        return el("a", { class: "mode-card", href: `#/play/${set.id}/${tense}/${m}` },
          el("span", { class: "mode-icon" }, MODE_META[m].icon),
          el("strong", {}, MODE_META[m].es),
          el("span", { class: "mode-en" }, MODE_META[m].en),
          starRow(best?.stars ?? 0),
        );
      }),
    ),
  );
}

// ---------------------------------------------------------------- study

function renderStudy(setId, tense) {
  const set = SETS[setId - 1];
  const { vosotros } = store.getSettings();
  const persons = [0, 1, 2, 3, 4, 5].filter((p) => vosotros || p !== 4);

  app.append(
    el("nav", { class: "crumbs" }, el("a", { href: `#/set/${setId}` }, `← Grupo ${setId}`)),
    el("h1", {}, `📖 Estudia — ${TENSE_LABELS[tense].es}`),
    el("p", { class: "study-hint" }, `${TENSE_META[tense].icon} ${TENSE_META[tense].hint} — ej.: `,
      el("em", {}, TENSE_META[tense].example)),
    el("div", { class: "table-scroll" },
      el("table", { class: "conj-table" },
        el("thead", {},
          el("tr", {},
            el("th", { scope: "col" }, ""),
            set.verbs.map((v) => el("th", { scope: "col" },
              el("span", { class: "th-inf" }, v.inf), el("span", { class: "th-gloss" }, v.en))))),
        el("tbody", {},
          persons.map((p) =>
            el("tr", {},
              el("th", { scope: "row" }, personDisplay(p)),
              set.verbs.map((v) => el("td", {}, conjugate(v, tense)[p]))))),
      )),
    el("div", { class: "study-actions" },
      MODES.map((m) => el("a", { class: "btn primary", href: `#/play/${setId}/${tense}/${m}` },
        `${MODE_META[m].icon} ${MODE_META[m].es}`))),
  );
}

// ---------------------------------------------------------------- play

function renderPlay(setId, tense, mode) {
  const set = SETS[setId - 1];
  const { vosotros } = store.getSettings();

  if (mode === "match") return renderMatch(set, tense, vosotros);

  const targets = sampleTargets(set.verbs, tense, QUESTIONS_PER_ROUND, vosotros);
  const state = { i: 0, score: 0, streak: 0, misses: [], usedAccentRetry: false };

  const header = el("div", { class: "play-header" });
  const stage = el("div", { class: "stage" });
  app.append(
    el("nav", { class: "crumbs" },
      el("a", { href: `#/set/${setId}` }, "← Salir"),
      el("a", { href: `#/study/${setId}/${tense}` }, "📖 Estudia")),
    header, stage,
  );

  function renderHeader() {
    header.replaceChildren(
      el("div", { class: "progress-wrap" },
        el("div", { class: "progress-bar" },
          el("div", { class: "progress-fill", style: `width:${(state.i / targets.length) * 100}%` })),
        el("span", { class: "progress-text" }, `${Math.min(state.i + 1, targets.length)} / ${targets.length}`)),
      el("span", { class: "streak", "aria-label": "racha" }, state.streak >= 2 ? `🔥 ${state.streak}` : ""),
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

  function promptCard(t) {
    return el("div", { class: "prompt" },
      el("span", { class: "prompt-tense" }, `${TENSE_META[tense].icon} ${TENSE_LABELS[tense].es}`),
      el("div", { class: "prompt-main" },
        el("span", { class: "prompt-person" }, personDisplay(t.person)),
        el("span", { class: "prompt-blank" }, "____"),
      ),
      el("span", { class: "prompt-verb" }, `${t.verb.inf} — ${t.verb.en}`),
    );
  }

  function renderQuestion() {
    renderHeader();
    const t = targets[state.i];
    const feedback = el("div", { class: "feedback", role: "status" });
    stage.replaceChildren(promptCard(t), feedback);

    const lockAndAdvance = (correct, chosenText) => {
      if (correct) {
        state.score++;
        state.streak++;
        const msg = PRAISE[Math.floor(Math.random() * PRAISE.length)];
        feedback.className = "feedback good";
        feedback.textContent = `${msg} ${personDisplay(t.person)} ${t.answer}`;
        announce(msg);
        setTimeout(next, 950);
      } else {
        state.streak = 0;
        state.misses.push(t);
        feedback.className = "feedback bad";
        feedback.replaceChildren(
          `Casi. La respuesta es: `,
          el("strong", {}, `${personDisplay(t.person)} ${t.answer}`),
          el("div", {}, el("button", { class: "btn primary", onclick: next }, "Siguiente →")),
        );
        announce(`La respuesta es ${t.answer}`);
      }
    };

    if (mode === "choice") {
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

  const feedback = el("div", { class: "feedback", role: "status" });
  const board = el("div", { class: "match-board" });
  app.append(
    el("nav", { class: "crumbs" },
      el("a", { href: `#/set/${set.id}` }, "← Salir"),
      el("a", { href: `#/study/${set.id}/${tense}` }, "📖 Estudia")),
    el("h1", {}, `🧩 Empareja — ${TENSE_LABELS[tense].es}`),
    el("p", { class: "match-help" }, "Une cada persona con su forma. Match each person with its form."),
    board, feedback,
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
    if (a.card.id === card.id) {
      if (!state.attemptedIds.has(card.id)) state.firstTryHits++;
      state.attemptedIds.add(card.id);
      for (const b of [a.btn, btn]) { b.classList.add("done"); b.disabled = true; }
      state.matched++;
      feedback.className = "feedback good";
      feedback.textContent = PRAISE[Math.floor(Math.random() * PRAISE.length)];
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

// ---------------------------------------------------------------- results

function showResults(set, tense, mode, score, total, misses) {
  const { stars } = store.recordResult(set.id, tense, mode, score, total);
  const pct = Math.round((score / total) * 100);
  const msg = stars === 3 ? "¡Increíble! Lo dominas." :
    stars === 2 ? "¡Muy bien! Ya casi lo tienes." :
    stars === 1 ? "¡Buen trabajo! Sigue practicando." :
    "Estudia la tabla y vuelve a intentarlo. ¡Tú puedes!";

  const nextMode = MODES[MODES.indexOf(mode) + 1];
  app.replaceChildren(
    el("div", { class: "results" },
      el("h1", {}, "Resultados"),
      el("div", { class: "big-stars" }, starRow(stars)),
      el("p", { class: "score-line" }, `${score} / ${total} · ${pct}%`),
      el("p", { class: "result-msg" }, msg),
      misses.length ? el("div", { class: "review" },
        el("h2", {}, "Para repasar:"),
        el("ul", {},
          misses.map((m) => el("li", {},
            el("strong", {}, `${personDisplay(m.person)} ${m.answer}`),
            ` — ${m.verb.inf} (${TENSE_LABELS[m.tense].es})`)))) : null,
      el("div", { class: "result-actions" },
        el("a", { class: "btn primary", href: `#/play/${set.id}/${tense}/${mode}`, onclick: () => setTimeout(render, 0) },
          "🔁 Otra vez"),
        nextMode
          ? el("a", { class: "btn", href: `#/play/${set.id}/${tense}/${nextMode}` },
            `${MODE_META[nextMode].icon} ${MODE_META[nextMode].es}`)
          : el("a", { class: "btn", href: `#/set/${set.id}` }, "✨ Elige otro tiempo"),
        el("a", { class: "btn", href: `#/set/${set.id}` }, "🏠 Grupo"),
      ),
    ),
  );
  announce(`Resultados: ${score} de ${total}`);
}

render();
