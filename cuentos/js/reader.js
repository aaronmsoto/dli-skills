/**
 * Cuentos passage renderer (docs/CUENTOS.md §4 Lee, §8).
 * paragraphs → sentences → tokens. Glossary words/phrases (multi-word
 * keys, longest match first, case-insensitive, punctuation-agnostic)
 * become <button class="cu-gloss">; tapping one opens ONE small inline
 * bubble (English gloss + 🔊 when speakable). Per-paragraph 🔊/🐢,
 * ▶️ read-along with sentence highlight, and prediction stops (levels
 * 2–3, unscored). All DOM is built with el() — no innerHTML for data.
 */
import { el } from "../../js/menu.js";
import { refText } from "./activities.js";

// ------------------------------------------------------------ pure

const WORD = /[\p{L}\p{M}\p{N}]+/gu;

/**
 * Split a sentence into segments: [{ text }, { text, key }]. `key` is the
 * glossary key matched (longest multi-word match wins; case-insensitive;
 * punctuation between/around words ignored). Concatenating every
 * segment's text reproduces the sentence exactly.
 */
export function glossSegments(sentence, glossary) {
  const keys = Object.keys(glossary || {})
    .map((k) => ({ key: k, parts: k.toLowerCase().split(/\s+/).filter(Boolean) }))
    .filter((k) => k.parts.length)
    .sort((a, b) => b.parts.length - a.parts.length);
  const toks = [...sentence.matchAll(WORD)].map((m) => ({ w: m[0].toLowerCase(), start: m.index, end: m.index + m[0].length }));
  const segs = [];
  let pos = 0;
  let i = 0;
  while (i < toks.length) {
    const hit = keys.find((k) => k.parts.every((p, j) => toks[i + j]?.w === p));
    if (!hit) { i++; continue; }
    const start = toks[i].start;
    const end = toks[i + hit.parts.length - 1].end;
    if (start > pos) segs.push({ text: sentence.slice(pos, start) });
    segs.push({ text: sentence.slice(start, end), key: hit.key });
    pos = end;
    i += hit.parts.length;
  }
  if (pos < sentence.length) segs.push({ text: sentence.slice(pos) });
  return segs;
}

export const paragraphText = (para) => para.join(" ");

// ------------------------------------------------------------ gloss bubble

let bubbleSeq = 0;
let current = null; // { btn, bubble, off }

export function closeBubble({ focus = false } = {}) {
  if (!current) return;
  const { btn, bubble, off } = current;
  current = null;
  off();
  bubble.remove();
  btn.setAttribute("aria-expanded", "false");
  btn.classList.remove("open");
  if (focus) btn.focus();
}

function openBubble(btn, wrap, label, gloss, { speakable, say, onGloss }) {
  const id = `cu-bubble-${++bubbleSeq}`;
  // NH-17: the bubble shows the SURFACE text ("Había una vez"), not the key
  const bubble = el("span", { class: "cu-bubble", id, role: "group", "aria-label": `${label}: ${gloss}` },
    el("span", { class: "cu-bubble-es", lang: "es" }, label),
    el("span", { class: "cu-bubble-en", lang: "en" }, gloss),
    speakable(label)
      ? el("button", {
        class: "cu-bubble-say", type: "button", "aria-label": `Escuchar «${label}» / Listen`,
        onclick: (e) => { e.stopPropagation(); say(label); },
      }, "🔊")
      : null);
  wrap.append(bubble);
  btn.setAttribute("aria-expanded", "true");
  btn.setAttribute("aria-controls", id);
  btn.classList.add("open");
  placeBubble(btn, bubble);
  onGloss?.();
  const onDoc = (e) => { if (!wrap.contains(e.target)) closeBubble(); };
  const onKey = (e) => { if (e.key === "Escape") closeBubble({ focus: true }); };
  const t = setTimeout(() => document.addEventListener("click", onDoc), 0);
  document.addEventListener("keydown", onKey);
  current = {
    btn, bubble,
    off: () => {
      clearTimeout(t);
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    },
  };
}

/**
 * CW-9: above the word when there is room (so it never covers the next
 * line being read), below otherwise; clamped to the viewport, with the
 * arrow recomputed AFTER the clamp so it still points at the word.
 */
function placeBubble(btn, bubble) {
  const word = btn.getBoundingClientRect();
  const h = bubble.getBoundingClientRect().height;
  const above = word.top - h - 14 > 8;
  bubble.classList.toggle("above", above);
  const r = bubble.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  let shift = 0;
  if (r.right > vw - 8) shift = -(r.right - vw + 8);
  else if (r.left < 8) shift = 8 - r.left;
  if (shift) bubble.style.left = `${Math.round(shift)}px`;
  const left = r.left + shift;
  const center = (word.left + word.right) / 2;
  const arrow = Math.max(10, Math.min(r.width - 22, center - left - 6));
  bubble.style.setProperty("--arrow-x", `${Math.round(arrow)}px`);
}

function glossButton(text, key, gloss, audio) {
  const wrap = el("span", { class: "cu-gloss-wrap" });
  const btn = el("button", {
    class: "cu-gloss", type: "button", "aria-expanded": "false",
    onclick: () => {
      const same = current?.btn === btn;
      closeBubble();
      if (!same) openBubble(btn, wrap, text, gloss, audio);
    },
  }, text);
  void key;
  wrap.append(btn);
  return wrap;
}

// ------------------------------------------------------------ sentences

/** One sentence as a span (data-ref="p.s"); glossary → buttons when given. */
function sentenceSpan(sentence, p, s, { glossary = null, audio = null } = {}) {
  const span = el("span", { class: "cu-sent", "data-ref": `${p}.${s}` });
  if (!glossary) {
    span.append(sentence);
    return span;
  }
  // punctuation touching a word ("¡Por", "red.") rides inside the word's
  // no-wrap wrapper so it never breaks onto its own line
  const segs = glossSegments(sentence, glossary);
  segs.forEach((seg, i) => {
    if (!seg.key) return;
    const prev = segs[i - 1];
    const next = segs[i + 1];
    const lead = prev && !prev.key ? prev.text.match(/\S*$/)[0] : "";
    const trail = next && !next.key ? next.text.match(/^\S*/)[0] : "";
    if (lead) prev.text = prev.text.slice(0, -lead.length);
    if (trail) next.text = next.text.slice(trail.length);
    seg.lead = lead;
    seg.trail = trail;
  });
  for (const seg of segs) {
    if (!seg.key) { if (seg.text) span.append(seg.text); continue; }
    const wrap = glossButton(seg.text, seg.key, glossary[seg.key], audio);
    if (seg.lead) wrap.prepend(seg.lead);
    if (seg.trail) wrap.querySelector(".cu-gloss").after(seg.trail);
    span.append(wrap);
  }
  return span;
}

function paragraphNode(para, p, opts) {
  const text = el("p", { class: "cu-para-text" });
  para.forEach((s, i) => {
    if (i) text.append(" ");
    text.append(sentenceSpan(s, p, i, opts));
  });
  return text;
}

/** Sentence with `word` wrapped in <mark> (🔤 Palabras prompt). */
export function markedSentence(sentence, word) {
  const node = el("p", { class: "cu-word-sentence", lang: "es" });
  for (const seg of glossSegments(sentence, { [word]: word })) {
    node.append(seg.key ? el("mark", { class: "cu-mark" }, seg.text) : seg.text);
  }
  return node;
}

// ------------------------------------------------------------ rounds panel

/**
 * 📖 "Ver el cuento" panel for activity rounds: plain passage (no glossary
 * — it would give away 🔤 answers), collapsible. `highlight(ref)` marks the
 * evidence sentence (outline + left border + 📍 — never color alone) and
 * opens the panel.
 */
export function passagePanel(level, { open = false } = {}) {
  const body = el("div", { class: "cu-passage-body", lang: "es" },
    level.paragraphs.map((para, p) => paragraphNode(para, p, {})));
  const details = el("details", { class: "cu-passage" },
    el("summary", {}, "📖 Ver el cuento ", el("span", { class: "h-en", lang: "en" }, "Show the story")),
    body);
  if (open) details.open = true;
  const clear = () => {
    for (const n of body.querySelectorAll(".cu-evidence")) n.classList.remove("cu-evidence");
    for (const n of body.querySelectorAll(".cu-pin")) n.remove();
  };
  const highlight = (ref) => {
    clear();
    const node = ref && body.querySelector(`[data-ref="${ref[0]}.${ref[1]}"]`);
    if (!node) return;
    node.classList.add("cu-evidence");
    node.prepend(el("span", { class: "cu-pin", role: "img", "aria-label": "Evidencia / Evidence" }, "📍"));
    details.open = true;
    node.scrollIntoView?.({ block: "nearest" });
  };
  return { el: details, highlight, clear };
}

// ------------------------------------------------------------ the reader

let readToken = 0;
let stopActive = () => {};

/** Stop any read-along in progress (called on every route change). */
export function stopReading() {
  stopActive();
}

/**
 * Full Lee reader. opts: { speakable(text), say(text, rate), speak,
 * soundOn(), onMuted(replay), announce(msg), onGloss(), predictions
 * ({ after: optionIndex } already answered — NH-8), onPredict(after, i),
 * onStopsChange(allAnswered), onReadDone() }. Returns { el, lastPara,
 * stopsDone() }.
 */
export function createReader(level, opts) {
  const { speakable, say, soundOn, onMuted, announce } = opts;
  const gated = (fn) => (soundOn() ? fn() : onMuted(fn));
  const audio = { speakable, say: (t) => gated(() => say(t)), onGloss: opts.onGloss };
  const stops = [...level.predict].sort((a, b) => a.after - b.after);
  const saved = { ...(opts.predictions || {}) };
  const last = level.paragraphs.length - 1;
  const endOf = (stop) => stops.find((st) => st.after > stop.after)?.after ?? last;
  let through = last;
  for (const st of stops) {
    if (saved[st.after] == null) { through = st.after; break; }
  }

  const article = el("article", { class: "cu-reader", lang: "es" });
  const paraNodes = [];
  const cards = new Map();
  const echoes = new Map(); // paragraph index → echo nodes shown after it

  // NH-18 / CW-4: "🔮 Tú dijiste: «…»" after the part the prediction was about
  for (const st of stops) {
    const end = endOf(st);
    const echo = el("p", { class: "cu-predict-echo no-print", hidden: true });
    const show = (i) => {
      const said = st.options[i].replace(/[.…]+$/, "");
      echo.replaceChildren(`🔮 Tú dijiste: «${said}». ¿Tenías razón? `,
        el("span", { class: "h-en", lang: "en" }, "Was your prediction right?"));
      echo.dataset.answered = "1";
    };
    if (saved[st.after] != null) show(saved[st.after]);
    echoes.set(end, [...(echoes.get(end) || []), { echo, show, stop: st }]);
  }

  level.paragraphs.forEach((para, p) => {
    const text = paragraphText(para);
    let block = null;
    const playPara = (rate) => gated(async () => {
      block.classList.add("cu-current"); // CW-10: the paragraph being heard
      try { await say(text, rate); } finally { block.classList.remove("cu-current"); }
    });
    block = el("div", { class: "cu-para", "data-p": String(p), tabindex: "-1" },
      paragraphNode(para, p, { glossary: level.glossary, audio }),
      speakable(text)
        ? el("div", { class: "cu-para-audio no-print" },
          el("button", {
            class: "cu-say", type: "button", "aria-label": `Escuchar el párrafo ${p + 1} / Listen`,
            onclick: () => playPara(0.85),
          }, "🔊"),
          el("button", {
            class: "cu-say cu-slow", type: "button", "aria-label": `Escuchar despacio el párrafo ${p + 1} / Listen slowly`,
            onclick: () => playPara(0.5),
          }, "🐢"))
        : null);
    paraNodes.push(block);
    article.append(block);
    for (const e of echoes.get(p) || []) article.append(e.echo);
    const stop = stops.find((st) => st.after === p);
    if (stop) {
      const card = predictCard(stop, saved[stop.after], (i) => {
        saved[stop.after] = i;
        opts.onPredict?.(stop.after, i);
        for (const e of echoes.get(endOf(stop)) || []) if (e.stop === stop) e.show(i);
        const next = stops.find((st) => st.after > stop.after && saved[st.after] == null);
        through = next ? next.after : last;
        sync();
        paraNodes[stop.after + 1]?.focus();
      });
      cards.set(p, card);
      article.append(card);
    }
  });

  const stopsDone = () => stops.every((st) => saved[st.after] != null);
  function sync() {
    paraNodes.forEach((n, p) => { n.hidden = p > through; });
    for (const [p, card] of cards) card.hidden = p > through;
    for (const [p, list] of echoes) for (const e of list) e.echo.hidden = p > through || !e.echo.dataset.answered;
    opts.onStopsChange?.(stopsDone());
  }
  sync();

  // ▶️ read-along: sentence by sentence, revealed text only
  const allSpeakable = level.paragraphs.flat().every((s) => speakable(s));
  let playBtn = null;
  const setPlaying = (on) => {
    playBtn.classList.toggle("playing", on);
    playBtn.setAttribute("aria-pressed", String(on));
    playBtn.replaceChildren(on ? "⏹ Parar " : "▶️ Leer en voz alta ",
      el("span", { class: "h-en", lang: "en" }, on ? "Stop" : "Read aloud"));
  };
  const stopRead = () => {
    readToken++;
    stopActive = () => {};
    for (const n of article.querySelectorAll(".cu-current")) n.classList.remove("cu-current");
    if (playBtn?.isConnected) setPlaying(false);
    opts.speak?.(""); // cancels the clip/utterance in flight
  };
  async function readAlong() {
    if (!soundOn()) return onMuted(readAlong);
    const my = ++readToken;
    stopActive = stopRead;
    setPlaying(true);
    announce?.("Leyendo en voz alta / Reading aloud");
    const spans = [...article.querySelectorAll(".cu-para:not([hidden]) .cu-sent")];
    for (const span of spans) {
      if (my !== readToken || !span.isConnected) return;
      span.classList.add("cu-current");
      span.scrollIntoView?.({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
      await say(refText(level, span.dataset.ref.split(".").map(Number)));
      span.classList.remove("cu-current");
    }
    if (my === readToken) {
      readToken++;
      setPlaying(false);
      opts.onReadDone?.();
    }
  }
  const controls = allSpeakable
    ? el("div", { class: "cu-read-controls no-print" },
      (playBtn = el("button", {
        class: "btn primary cu-readalong", type: "button", "aria-pressed": "false",
        onclick: () => (playBtn.classList.contains("playing") ? stopRead() : readAlong()),
      })))
    : null;
  if (playBtn) setPlaying(false);

  // print-only glossary list (teachers print passages) — alphabetical (CW-11)
  const entries = Object.entries(level.glossary).sort(([a], [b]) => a.localeCompare(b, "es"));
  const glossList = el("section", { class: "cu-glossary-list print-only", "aria-label": "Glosario" },
    el("h2", {}, "Glosario ", el("span", { class: "h-en", lang: "en" }, "/ Glossary")),
    el("dl", {}, entries.flatMap(([k, v]) => [el("dt", { lang: "es" }, k), el("dd", { lang: "en" }, v)])));

  return {
    el: el("div", { class: "cu-reader-wrap" }, controls, article, glossList),
    lastPara: paraNodes[last],
    stopsDone,
  };
}

export const reducedMotion = () => !!globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function predictCard(stop, savedIdx, onAnswer) {
  const status = el("p", { class: "cu-predict-result", role: "status" });
  const cont = el("p", { class: "cu-predict-continue" }, "👇 El cuento sigue después de tu respuesta. ",
    el("span", { class: "h-en", lang: "en" }, "The story continues after you answer."));
  const mark = (btn) => {
    for (const b of buttons) b.disabled = true;
    btn.setAttribute("aria-pressed", "true");
    btn.classList.add("picked");
    cont.hidden = true;
    status.replaceChildren("¡Vamos a ver! ", el("span", { class: "h-en", lang: "en" }, "Let's find out"));
  };
  const buttons = stop.options.map((o, i) =>
    el("button", {
      class: "cu-predict-opt", type: "button", "aria-pressed": "false",
      onclick: (e) => {
        mark(e.currentTarget);
        onAnswer(i);
      },
    }, o));
  if (savedIdx != null && buttons[savedIdx]) mark(buttons[savedIdx]);
  return el("section", { class: "cu-predict no-print", "aria-label": "Predicción / Prediction" },
    el("p", { class: "cu-predict-kicker" }, "🔮 ¿Qué crees? ", el("span", { class: "h-en", lang: "en" }, "Make a prediction")),
    el("p", { class: "cu-predict-q" }, stop.q),
    el("p", { class: "cu-predict-en h-en", lang: "en" }, stop.en),
    el("div", { class: "cu-predict-opts" }, buttons),
    cont,
    status);
}
