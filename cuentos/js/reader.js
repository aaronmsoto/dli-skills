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

function openBubble(btn, wrap, key, gloss, { speakable, say }) {
  const id = `cu-bubble-${++bubbleSeq}`;
  const bubble = el("span", { class: "cu-bubble", id, role: "group", "aria-label": `${key}: ${gloss}` },
    el("span", { class: "cu-bubble-es", lang: "es" }, key),
    el("span", { class: "cu-bubble-en", lang: "en" }, gloss),
    speakable(key)
      ? el("button", {
        class: "cu-bubble-say", type: "button", "aria-label": `Escuchar «${key}» / Listen`,
        onclick: (e) => { e.stopPropagation(); say(key); },
      }, "🔊")
      : null);
  wrap.append(bubble);
  btn.setAttribute("aria-expanded", "true");
  btn.setAttribute("aria-controls", id);
  btn.classList.add("open");
  // keep the bubble on screen (narrow phones)
  const r = bubble.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  if (r.right > vw - 8) bubble.style.left = `${Math.round(-(r.right - vw + 8))}px`;
  else if (r.left < 8) bubble.style.left = `${Math.round(8 - r.left)}px`;
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

function glossButton(text, key, gloss, audio) {
  const wrap = el("span", { class: "cu-gloss-wrap" });
  const btn = el("button", {
    class: "cu-gloss", type: "button", "aria-expanded": "false",
    onclick: () => {
      const same = current?.btn === btn;
      closeBubble();
      if (!same) openBubble(btn, wrap, key, gloss, audio);
    },
  }, text);
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
  for (const seg of glossSegments(sentence, glossary)) {
    span.append(seg.key ? glossButton(seg.text, seg.key, glossary[seg.key], audio) : seg.text);
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
 * soundOn(), onMuted(), announce(msg) }. Returns { el }.
 */
export function createReader(level, opts) {
  const { speakable, say, soundOn, onMuted, announce } = opts;
  const audio = { speakable, say: (t) => (soundOn() ? say(t) : onMuted()) };
  const stops = [...level.predict].sort((a, b) => a.after - b.after);
  const last = level.paragraphs.length - 1;
  let through = stops.length ? stops[0].after : last;

  const article = el("article", { class: "cu-reader", lang: "es" });
  const paraNodes = [];
  const cards = new Map();

  level.paragraphs.forEach((para, p) => {
    const text = paragraphText(para);
    const block = el("div", { class: "cu-para", "data-p": String(p), tabindex: "-1" },
      paragraphNode(para, p, { glossary: level.glossary, audio }),
      speakable(text)
        ? el("div", { class: "cu-para-audio no-print" },
          el("button", {
            class: "cu-say", type: "button", "aria-label": `Escuchar el párrafo ${p + 1} / Listen`,
            onclick: () => (soundOn() ? say(text) : onMuted()),
          }, "🔊"),
          el("button", {
            class: "cu-say cu-slow", type: "button", "aria-label": `Escuchar despacio el párrafo ${p + 1} / Listen slowly`,
            onclick: () => (soundOn() ? say(text, 0.5) : onMuted()),
          }, "🐢"))
        : null);
    paraNodes.push(block);
    article.append(block);
    const stop = stops.find((st) => st.after === p);
    if (stop) {
      const card = predictCard(stop, () => {
        const next = stops.find((st) => st.after > stop.after);
        through = next ? next.after : last;
        sync();
        const first = paraNodes[stop.after + 1];
        first?.focus();
      });
      cards.set(p, card);
      article.append(card);
    }
  });

  function sync() {
    paraNodes.forEach((n, p) => { n.hidden = p > through; });
    for (const [p, card] of cards) card.hidden = p > through;
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
    if (!soundOn()) return onMuted();
    const my = ++readToken;
    stopActive = stopRead;
    setPlaying(true);
    announce?.("Leyendo en voz alta / Reading aloud");
    const spans = [...article.querySelectorAll(".cu-para:not([hidden]) .cu-sent")];
    for (const span of spans) {
      if (my !== readToken || !span.isConnected) return;
      span.classList.add("cu-current");
      span.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
      await say(refText(level, span.dataset.ref.split(".").map(Number)));
      span.classList.remove("cu-current");
    }
    if (my === readToken) { readToken++; setPlaying(false); }
  }
  const controls = allSpeakable
    ? el("div", { class: "cu-read-controls no-print" },
      (playBtn = el("button", {
        class: "btn primary cu-readalong", type: "button", "aria-pressed": "false",
        onclick: () => (playBtn.classList.contains("playing") ? stopRead() : readAlong()),
      })))
    : null;
  if (playBtn) setPlaying(false);

  // print-only glossary list (teachers print passages)
  const glossList = el("section", { class: "cu-glossary-list print-only", "aria-label": "Glosario" },
    el("h2", {}, "Glosario ", el("span", { class: "h-en", lang: "en" }, "/ Glossary")),
    el("dl", {}, Object.entries(level.glossary).flatMap(([k, v]) => [
      el("dt", { lang: "es" }, k), el("dd", { lang: "en" }, v)])));

  return { el: el("div", { class: "cu-reader-wrap" }, controls, article, glossList) };
}

function predictCard(stop, onAnswer) {
  const status = el("p", { class: "cu-predict-result", role: "status" });
  const buttons = stop.options.map((o) =>
    el("button", {
      class: "cu-predict-opt", type: "button", "aria-pressed": "false",
      onclick: (e) => {
        for (const b of buttons) b.disabled = true;
        e.currentTarget.setAttribute("aria-pressed", "true");
        e.currentTarget.classList.add("picked");
        status.replaceChildren("¡Vamos a ver! ", el("span", { class: "h-en", lang: "en" }, "Let's find out"));
        onAnswer();
      },
    }, o));
  return el("section", { class: "cu-predict no-print", "aria-label": "Predicción / Prediction" },
    el("p", { class: "cu-predict-kicker" }, "🔮 ¿Qué crees? ", el("span", { class: "h-en", lang: "en" }, "Make a prediction")),
    el("p", { class: "cu-predict-q" }, stop.q),
    el("p", { class: "cu-predict-en h-en", lang: "en" }, stop.en),
    el("div", { class: "cu-predict-opts" }, buttons),
    status);
}
