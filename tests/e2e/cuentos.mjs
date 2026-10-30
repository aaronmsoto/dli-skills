/**
 * 📚 Cuentos end-to-end suite (docs/CUENTOS.md §9). Same harness style as
 * smoke.mjs: own static server on port 0, headless Chromium, a VOICELESS
 * context (audio/manifest.json → 204, no local Spanish voice), console-
 * error tracking, text assertions, screenshots to tests/e2e/shots/, and
 * the vendored axe-core gate (zero critical/serious).
 * Correct answers are computed from the story data itself.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { mkdirSync, readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";
import { STORIES } from "../../cuentos/js/stories.js";

const ROOT = new URL("../..", import.meta.url).pathname;
const SHOTS = join(ROOT, "tests/e2e/shots");
mkdirSync(SHOTS, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
};

const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (path.endsWith("/")) path += "index.html";
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(normalize(ROOT))) throw new Error("traversal");
    const body = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});
await new Promise((resolve) => server.listen(0, resolve));
const BASE = `http://localhost:${server.address().port}/cuentos/`;

const failures = [];
const fail = (msg) => { console.error("FAIL:", msg); failures.push(msg); };
const ok = (msg) => console.log("ok:", msg);

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const errors = [];
const nativeDialogs = [];
const trackErrors = (p) => {
  p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  p.on("pageerror", (e) => errors.push(String(e)));
  p.on("dialog", (d) => { nativeDialogs.push(d.message()); d.accept(); });
};
async function newVoiceless(viewport = { width: 900, height: 900 }) {
  const p = await browser.newPage({ viewport });
  trackErrors(p);
  await p.route("**/audio/manifest.json", (r) => r.fulfill({ status: 204 }));
  return p;
}
const page = await newVoiceless();

const story = STORIES[0];
const L1 = story.levels[0];
const L2 = story.levels[1];
const ref = (lvl, [p, s]) => lvl.paragraphs[p][s];

async function go(hash, p = page) {
  // same-URL goto is a no-op fragment navigation — reload to restart a round
  if (p.url() === `${BASE}${hash}`) await p.reload();
  else await p.goto(`${BASE}${hash}`);
  await p.waitForSelector(".site-footer");
}
async function screenChecks(name, p = page) {
  const text = await p.locator("#app").innerText();
  if (/\bnull\b|\bundefined\b|NaN|\[object/.test(text)) fail(`${name}: stray null/undefined/NaN in rendered text`);
  if (!(await p.locator(".site-footer").count())) fail(`${name}: footer missing`);
  if (!(await p.locator(".crumbs .menu-btn, .hero .menu-btn").count())) fail(`${name}: ☰ menu missing`);
}
const store = (p = page) => p.evaluate(() => JSON.parse(localStorage.getItem("cuentos.v1") || "{}"));
const optionTexts = (p = page) => p.locator(".cu-choices .choice").evaluateAll((bs) =>
  bs.map((b) => [...b.childNodes].filter((n) => n.nodeName !== "KBD").map((n) => n.textContent).join("").trim()));
async function clickOption(text, p = page) {
  const texts = await optionTexts(p);
  const i = texts.indexOf(text);
  if (i === -1) { fail(`option "${text}" not found among ${JSON.stringify(texts)}`); return; }
  await p.locator(".cu-choices .choice").nth(i).click();
}

// ---------- Biblioteca ----------
await page.goto(BASE);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await go("#/");
const books = await page.locator(".cu-book").count();
if (books !== STORIES.length) fail(`home: expected ${STORIES.length} book cards, got ${books}`);
const firstCard = await page.locator(".cu-book").first().innerText();
if (!firstCard.includes("¡Empieza aquí!")) fail("home: first card lacks ¡Empieza aquí!");
if ((await page.locator(".start-here").count()) !== 1) fail("home: exactly one start-here ribbon expected");
if (!firstCard.includes(`⭐ 0/45`)) fail(`home: first card progress missing, got ${firstCard}`);
for (const s of STORIES) {
  const card = await page.locator(`.cu-book[data-story="${s.id}"]`).innerText();
  if (!card.includes(s.title) || !card.includes(s.source.author)) fail(`home: card for ${s.id} lacks title/author`);
}
if ((await page.locator(".hero .lola-wrap").getAttribute("aria-hidden")) !== "true") fail("home: Lola must be aria-hidden");
if (!(await page.locator(".lola-greeting").innerText()).includes("¿Leemos un cuento?")) fail("home: greeting missing");
if (!(await page.locator(".brand-sub").innerText()).includes("DLIskills.com")) fail("home: brand line missing");
if (await page.locator(".info-btn").count()) fail("home: no ℹ️ allowed on the Biblioteca");
if (!(await page.locator(".total-stars").innerText()).includes(`/ ${STORIES.length * 45}`)) fail("home: total star denominator wrong");
if (await page.locator(".review-queue").count()) fail("home: review queue should be empty on a fresh device");
if ((await page.title()) !== "Cuentos — Spanish Reading Skills Builder (K-5 DLI)") fail(`home: title ${await page.title()}`);
await screenChecks("home");
await page.screenshot({ path: `${SHOTS}/cuentos-home.png`, fullPage: true });
ok(`Biblioteca renders ${STORIES.length} book cards + start-here + Lola greeter`);

// ---------- story screen ----------
await page.locator(".cu-book").first().click();
await page.waitForSelector(".cu-level-card");
{
  const attrib = await page.locator(".cu-attrib").innerText();
  if (!attrib.includes("Dominio público") || !attrib.includes(story.source.author)) fail(`story: attribution wrong: ${attrib}`);
  if (await page.locator(".info-btn").count()) fail("story: no ℹ️ allowed on the story screen");
  if ((await page.locator(".cu-keywords li").count()) !== story.keyWords.length) fail("story: key word chips count");
  if (await page.locator(".cu-key-say").count()) fail("story: key words must not be tap-to-hear without a voice");
  const kwText = await page.locator(".cu-keywords").innerText();
  if (!kwText.includes(story.keyWords[0].en)) fail("story: key word English missing");
  if ((await page.locator(".cu-level-card").count()) !== 3) fail("story: 3 level cards expected");
  if ((await page.locator('.cu-level-card[aria-checked="true"]').getAttribute("data-level")) !== "1") fail("story: level 1 selected by default");
  const acts = await page.locator(".cu-acts .mode-card").evaluateAll((as) => as.map((a) => a.dataset.act));
  if (JSON.stringify(acts) !== JSON.stringify(["lee", "preguntas", "verdad", "ordena", "palabras", "mapa"]))
    fail(`story: activity cards wrong: ${acts}`);
  if (await page.locator('[data-act="escucha"]').count()) fail("story: 🎧 Escucha must be ABSENT voiceless");
  if (await page.locator(".cu-lee-card .star").count()) fail("story: Lee is unscored — no stars");
  await page.screenshot({ path: `${SHOTS}/cuentos-story.png`, fullPage: true });
  // CW-2: 📖 Lee is primary + "Empieza aquí" while unread
  if (!(await page.locator(".cu-lee-card .cu-lee-start").innerText()).includes("Empieza aquí")) fail("story: Lee card lacks the 'Empieza aquí: lee el cuento' line");
  if (!(await page.locator(".cu-print-link").count())) fail("story: 🖨️ Imprimir este nivel link missing (CW-11)");
  // level picker switches IN PLACE (NH-4): no re-render, scroll kept, focus on the card
  await page.evaluate(() => { document.querySelector("h1").dataset.mark = "same"; window.scrollTo(0, 300); });
  await page.click('.cu-level-card[data-level="2"]');
  await page.waitForSelector('.cu-level-card[data-level="2"][aria-checked="true"]');
  if ((await page.locator('h1[data-mark="same"]').count()) !== 1) fail("story: level pick must not re-render the screen");
  if ((await page.evaluate(() => scrollY)) === 0) fail("story: level pick reset scroll to the top");
  if ((await page.evaluate(() => document.activeElement?.dataset.level)) !== "2") fail("story: focus must stay on the chosen level card");
  if ((await page.locator('.cu-level-card.selected').count()) !== 1 || (await page.locator('.cu-level-card[aria-checked="true"]').count()) !== 1) fail("story: exactly one selected level card");
  if (!(await page.locator(".cu-acts-heading").innerText()).includes("Nivel 2")) fail("story: activities heading not swapped to Nivel 2");
  await page.waitForFunction(() => document.getElementById("live").textContent.includes("Nivel 2 elegido"));
  if (!(await page.locator('.cu-lee-card').getAttribute("href")).endsWith("/2")) fail("story: Lee card not switched to level 2");
  if ((await page.evaluate(() => sessionStorage.getItem("cuentos.nivel.leon-raton"))) !== "2") fail("story: level not remembered in sessionStorage");
  await page.reload();
  await page.waitForSelector('.cu-level-card[data-level="2"][aria-checked="true"]');
  await page.click('.cu-level-card[data-level="1"]');
  await page.waitForSelector('.cu-level-card[data-level="1"][aria-checked="true"]');
  await screenChecks("story");
  ok("story screen: attribution, key words, level picker (remembered), activity cards, no 🎧 voiceless");
}

// ---------- reader N1 ----------
await go(`#/lee/${story.id}/1`);
await page.waitForSelector(".cu-para");
{
  const paras = await page.locator(".cu-para:visible").count();
  if (paras !== L1.paragraphs.length) fail(`reader N1: expected ${L1.paragraphs.length} paragraphs, got ${paras}`);
  const text = await page.locator(".cu-reader").innerText();
  for (const s of L1.paragraphs.flat()) if (!text.replace(/\s+/g, " ").includes(s)) fail(`reader N1: sentence missing: ${s}`);
  if (await page.locator(".cu-say, .cu-readalong, .cu-para-audio, .cu-bubble-say").count()) fail("reader: NO 🔊/🐢/▶️ controls allowed voiceless");
  if (!(await page.locator("h1 .info-btn").count())) fail("reader: ℹ️ must sit beside the h1");
  if (await page.locator(".lola-wrap").count()) fail("reader: no Lola on the reader (scarcity of stimulation)");
  const pills = await page.locator(".cu-pill").count();
  if (pills !== 3) fail("reader: 3 level pills expected");
  if ((await page.locator('.cu-pill[aria-current="page"]').getAttribute("aria-label")) !== "Nivel 1") fail("reader: current pill wrong");
  if (!(await page.locator(".cu-lee-bar .print-btn").count())) fail("reader: 🖨️ next to the level pills missing (CW-11)");
  if (!(await page.locator(".tap-hint").innerText()).includes("Toca las palabras subrayadas")) fail("reader: short tap hint missing");
  if ((await page.locator(".cu-skip-games").count()) !== 1) fail("reader: Saltar a los juegos link missing (CW-13)");
  const links = await page.locator(".cu-actions .cu-act-link").evaluateAll((as) => as.map((a) => a.dataset.act));
  if (JSON.stringify(links) !== JSON.stringify(["preguntas", "verdad", "ordena", "palabras", "mapa"])) fail(`reader: action row must link every activity, got ${links}`);
  if (!(await page.locator(".cu-actions .print-btn").count())) fail("reader: print button missing");
  // NH-7: counted only on evidence of reading (last paragraph on screen ≥2 s), once per session
  await page.locator(".cu-para").last().scrollIntoViewIfNeeded();
  await page.waitForFunction((k) => JSON.parse(localStorage.getItem("cuentos.v1") || "{}").reads?.[k]?.count === 1, `${story.id}.1`, { timeout: 6000 })
    .catch(() => fail("reader: read not recorded after the last paragraph was seen"));
  // glossary: tap → English gloss; Escape closes; focus returns
  const gloss = page.locator(".cu-gloss", { hasText: "duerme" }).first();
  await gloss.click();
  await page.waitForSelector(".cu-bubble");
  const bubble = await page.locator(".cu-bubble").innerText();
  if (!bubble.includes(L1.glossary.duerme)) fail(`reader: bubble shows "${bubble}", expected "${L1.glossary.duerme}"`);
  if ((await gloss.getAttribute("aria-expanded")) !== "true") fail("reader: gloss button aria-expanded not true");
  if ((await page.locator(".cu-bubble").count()) !== 1) fail("reader: only ONE bubble at a time");
  await page.screenshot({ path: `${SHOTS}/cuentos-reader.png`, fullPage: true });
  await page.keyboard.press("Escape");
  if (await page.locator(".cu-bubble").count()) fail("reader: Escape must close the bubble");
  if (!(await page.evaluate(() => document.activeElement?.classList.contains("cu-gloss")))) fail("reader: focus must return to the word");
  // another word replaces, outside tap closes
  await page.locator(".cu-gloss").nth(1).click();
  await page.locator(".cu-gloss").nth(2).click();
  if ((await page.locator(".cu-bubble").count()) !== 1) fail("reader: second word must replace the first bubble");
  await page.click("h1");
  if (await page.locator(".cu-bubble").count()) fail("reader: outside tap must close the bubble");
  // keyboard: Tab reaches a glossary button, Enter opens it
  await page.locator(".cu-pill").last().focus();
  let reached = false;
  for (let i = 0; i < 20 && !reached; i++) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(() => document.activeElement?.classList.contains("cu-gloss"));
  }
  if (!reached) fail("reader: Tab never reached a glossary button");
  await page.keyboard.press("Enter");
  if (!(await page.locator(".cu-bubble").count())) fail("reader: Enter on a glossary button must open it");
  await page.keyboard.press("Escape");
  if (await page.locator(".tap-hint:visible").count()) fail("reader: tap hint must hide after the first glossary tap");
  // NH-17: the bubble shows the surface text
  const multi = Object.keys(L1.glossary).find((k) => /[A-ZÁÉÍÓÚÑ]/.test(ref(L1, [0, 0])) && ref(L1, [0, 0]).toLowerCase().startsWith(k) && k.includes(" "));
  if (multi) {
    await page.locator(".cu-gloss").first().click();
    const es = await page.locator(".cu-bubble-es").innerText();
    if (es !== ref(L1, [0, 0]).slice(0, multi.length)) fail(`reader: bubble shows "${es}", expected the surface text`);
    await page.keyboard.press("Escape");
  }
  // CW-9: glossary hit area ≥44px tall, no line-box shift
  {
    const h = await page.locator(".cu-gloss").first().evaluate((b) => b.getBoundingClientRect().height);
    if (h < 44) fail(`reader: glossary button hit area ${h}px < 44px`);
  }
  // pill round trip: read count stays 1
  await page.click('.cu-pill[aria-label="Nivel 2"]');
  await page.waitForSelector('.cu-pill.current[aria-label="Nivel 2"]');
  await page.click('.cu-pill[aria-label="Nivel 1"]');
  await page.waitForSelector('.cu-pill.current[aria-label="Nivel 1"]');
  await page.locator(".cu-para").last().scrollIntoViewIfNeeded();
  await page.waitForTimeout(2400);
  if ((await store()).reads?.[`${story.id}.1`]?.count !== 1) fail(`reader: read count must stay 1 across a pill round trip, got ${(await store()).reads?.[`${story.id}.1`]?.count}`);
  if ((await store()).reads?.[`${story.id}.2`]) fail("reader: N2 read must not count without evidence of reading");
  await screenChecks("reader N1");
  ok("reader N1: all paragraphs, glossary bubble (tap/Escape/outside/keyboard), no audio controls voiceless, action row");
}

// ---------- reader N2: prediction stop ----------
await go(`#/lee/${story.id}/2`);
await page.waitForSelector(".cu-predict");
{
  const stop = [...L2.predict].sort((a, b) => a.after - b.after)[0];
  const visible = await page.locator(".cu-para:visible").count();
  if (visible !== stop.after + 1) fail(`reader N2: ${visible} paragraphs visible before the prediction, expected ${stop.after + 1}`);
  const hiddenText = ref(L2, [stop.after + 1, 0]);
  if ((await page.locator(".cu-reader").innerText()).includes(hiddenText)) fail("reader N2: later paragraphs must stay hidden");
  if (!(await page.locator(".cu-predict").innerText()).includes(stop.q)) fail("reader N2: prediction question missing");
  if (!(await page.locator(".cu-predict-continue").innerText()).includes("El cuento sigue después de tu respuesta")) fail("reader N2: continuation line missing (CW-4)");
  if ((await page.locator('.cu-act-link[aria-disabled="true"]').count()) !== 5) fail("reader N2: activity row must be locked until the prediction is answered");
  if (!(await page.locator(".cu-locked-note").innerText()).includes("Después de leer")) fail("reader N2: 'Después de leer' label missing");
  const picked = stop.options[1];
  await page.locator(".cu-predict-opt").nth(1).click();
  await page.waitForSelector(".cu-predict-result:has-text('¡Vamos a ver!')");
  const next = L2.predict.find((p) => p.after > stop.after);
  const expectVisible = next ? next.after + 1 : L2.paragraphs.length;
  if ((await page.locator(".cu-para:visible").count()) !== expectVisible) fail("reader N2: paragraphs not revealed after predicting");
  if (!(await page.locator(".cu-reader").innerText()).includes(hiddenText)) fail("reader N2: revealed text missing");
  if (await page.locator(".cu-predict .correct, .cu-predict .wrong").count()) fail("reader N2: predictions are unscored — no right/wrong");
  // answer any further stops, then the echo + unlocked row
  while (await page.locator(".cu-predict:visible .cu-predict-opt:not([disabled])").count()) {
    await page.locator(".cu-predict:visible .cu-predict-opt:not([disabled])").first().click();
  }
  const echo = await page.locator(".cu-predict-echo:visible").first().innerText().catch(() => "");
  if (!echo.includes(`Tú dijiste: «${picked.replace(/[.…]+$/, "")}»`) || !echo.includes("¿Tenías razón?")) fail(`reader N2: prediction echo wrong: "${echo}"`);
  if (await page.locator('.cu-act-link[aria-disabled="true"]').count()) fail("reader N2: activity row must unlock after the predictions");
  // NH-8: predictions survive a pill round trip (sessionStorage)
  await page.click('.cu-pill[aria-label="Nivel 1"]');
  await page.waitForSelector('.cu-pill.current[aria-label="Nivel 1"]');
  await page.click('.cu-pill[aria-label="Nivel 2"]');
  await page.waitForSelector('.cu-pill.current[aria-label="Nivel 2"]');
  if ((await page.locator(".cu-para:visible").count()) !== L2.paragraphs.length) fail("reader N2: predictions reset after a pill round trip");
  if (!(await page.locator(".cu-predict-opt.picked").first().innerText()).includes(picked)) fail("reader N2: picked prediction not restored");
  // ☰ setting toggle does not re-render the reader
  await page.click(".menu-btn");
  await page.click(".settings-toggle");
  await page.click(".setting-hints");
  await page.click(".setting-hints");
  await page.keyboard.press("Escape");
  if ((await page.locator(".cu-para:visible").count()) !== L2.paragraphs.length) fail("reader N2: ☰ setting toggle re-rendered the reader");
  await screenChecks("reader N2");
  ok("reader N2: prediction stop hides later paragraphs until answered, then ¡Vamos a ver!");
}

// ---------- activity rounds (leon-raton N1), all correct ----------
const juego = (act, n = 1) => `#/juego/${story.id}/${n}/${act}`;
async function roundBasics(act) {
  if (!(await page.locator(".prompt .info-btn").count())) fail(`${act}: ℹ️ must sit in the prompt-card corner`);
  if (!(await page.locator(".progress-text").innerText()).includes("1 /")) fail(`${act}: progress text`);
  await screenChecks(act);
}
async function expectResults(act, score, total) {
  await page.waitForSelector(".results");
  const line = await page.locator(".score-line").innerText();
  if (!line.startsWith(`${score} / ${total}`)) fail(`${act}: results show "${line}", expected ${score} / ${total}`);
  await screenChecks(`${act} results`);
}
async function playMC(act, answerFor) {
  await go(juego(act));
  await page.waitForSelector(".cu-prompt");
  await roundBasics(act);
  const total = await page.locator(".progress-text").innerText().then((t) => Number(t.split("/")[1]));
  for (let i = 0; i < total; i++) {
    await page.waitForSelector(".cu-prompt");
    await answerFor();
    await page.waitForSelector(".cu-next");
    if (!(await page.locator(".feedback.good").count())) fail(`${act}: item ${i + 1} not marked correct`);
    if (!(await page.evaluate(() => document.activeElement?.classList.contains("cu-next")))) fail(`${act}: focus must move to Siguiente`);
    // NH-6: a correct answer auto-advances (no Siguiente tap)
    await page.waitForFunction((n) => document.querySelector(".results")
      || document.querySelector(".progress-text")?.textContent.startsWith(`${n + 1} /`), i + 1, { timeout: 5000 })
      .catch(() => fail(`${act}: item ${i + 1} did not auto-advance after a correct answer`));
  }
  await expectResults(act, total, total);
  const best = (await store()).best?.[`${story.id}.1.${act}`];
  if (best?.stars !== 3) fail(`${act}: expected 3 stars in cuentos.v1, got ${JSON.stringify(best)}`);
}

// ❓ preguntas (passage panel OPEN)
await go(juego("preguntas"));
if (!(await page.locator("details.cu-passage[open]").count())) fail("preguntas: passage panel must start OPEN");
await page.screenshot({ path: `${SHOTS}/cuentos-preguntas.png`, fullPage: true });
await playMC("preguntas", async () => {
  const q = (await page.locator(".cu-q").innerText()).trim();
  const item = L1.questions.find((x) => x.q === q);
  if (!item) return fail(`preguntas: unknown question ${q}`);
  // on-demand English hint
  await page.click(".cu-en-toggle");
  if (!(await page.locator(".cu-en-line:visible").innerText()).includes(item.en)) fail("preguntas: English hint missing");
  await clickOption(item.options[item.answer]);
});
await page.screenshot({ path: `${SHOTS}/cuentos-results.png`, fullPage: true });
// results actions: retry, next activity, story
{
  const acts = await page.locator(".result-actions").innerText();
  if (!acts.includes("Otra vez") || !acts.includes("¿Verdad o mentira?") || !acts.includes("Cuento")) fail(`results: actions wrong: ${acts}`);
  if ((await page.locator(".results .big-stars .star.on").count()) !== 3) fail("results: 3 stars expected");
  // NH-5 / CW-6: ≥2★ → primary = next game; 🔁 secondary; no star hint at 3★
  if (!(await page.locator(".result-actions .btn.primary").innerText()).includes("Siguiente juego: ✅ ¿Verdad o mentira?")) fail("results: ≥2★ primary must be the next game");
  if (await page.locator(".cu-retry.primary").count()) fail("results: 🔁 Otra vez must be secondary");
  if (await page.locator(".cu-star-hint").count()) fail("results: no star hint at 3★");
  if (!(await page.locator('.crumbs a[href$="/1"]', { hasText: "📖 Lee" }).count())) fail("results: 📖 Lee crumb missing");
  if (!(await page.evaluate(() => document.activeElement?.tagName === "H1"))) fail("results: focus must move to the results h1");
}
ok("❓ Preguntas: 5/5 → 3 stars stored; English hint; auto-advance; results actions (next game primary, h1 focus)");

// NH-12: "▶️ Sigue aquí" on the story just played; no "Empieza aquí" once anything is played
await go("#/");
{
  const card = await page.locator(`.cu-book[data-story="${story.id}"]`).innerText();
  if (!card.includes("Sigue aquí")) fail(`home: last-played story should show ▶️ Sigue aquí, got ${card}`);
  if ((await page.locator("#app").innerText()).includes("¡Empieza aquí!")) fail("home: ¡Empieza aquí! only on a fresh device");
}
ok("home: ▶️ Sigue aquí on the most recently played story");

// ✅ verdad
await go(juego("verdad"));
if (!(await page.locator("details.cu-passage[open]").count())) fail("verdad: passage panel must start OPEN");
{
  const h = await page.locator(".cu-tf-btn").first().boundingBox();
  if (h.height < 56) fail(`verdad: V/M buttons must be ≥56px tall, got ${h.height}`);
}
await page.screenshot({ path: `${SHOTS}/cuentos-verdad.png`, fullPage: true });
await playMC("verdad", async () => {
  const s = (await page.locator(".cu-statement").innerText()).trim().replace(/^🤔\s*/, "");
  if ((await page.locator(".cu-statement").innerText()).includes("«")) fail("verdad: statements must not use «» (NH-16)");
  const item = L1.tf.find((x) => x.s === s);
  if (!item) return fail(`verdad: unknown statement ${s}`);
  await page.click(item.answer ? ".cu-true" : ".cu-false");
});
ok("✅ Verdad o mentira: 5/5 → 3 stars");

// 🔤 palabras
await go(juego("palabras"));
await page.screenshot({ path: `${SHOTS}/cuentos-palabras.png`, fullPage: true });
await playMC("palabras", async () => {
  const word = (await page.locator(".cu-mark").innerText()).trim().toLowerCase();
  const item = L1.vocab.find((v) => v.word === word);
  if (!item) return fail(`palabras: unknown word ${word}`);
  if (!(await page.locator(".cu-q").innerText()).includes(`¿Qué significa «${item.word}»?`)) fail("palabras: question text");
  await clickOption(item.options[item.answer]);
});
ok("🔤 Palabras: word marked in its sentence, 5/5 → 3 stars");

// 🗺️ mapa (4 slots; panel collapsed with Pistas on)
await go(juego("mapa"));
if ((await page.locator(".cu-map-slot").count()) !== 4) fail("mapa: 4 slots expected");
if (!(await page.locator("details.cu-passage:not([open])").count())) fail("mapa: passage panel must start COLLAPSED (Pistas on)");
await page.screenshot({ path: `${SHOTS}/cuentos-mapa.png`, fullPage: true });
await playMC("mapa", async () => {
  const slot = await page.locator(".cu-map-slot.current").getAttribute("data-slot");
  const m = L1.map[slot];
  await clickOption(m.options[m.answer]);
});
ok("🗺️ Mapa: 4 labelled slots, 4/4 → 3 stars");
{
  await go(juego("mapa"));
  if (!(await page.locator(".cu-map-intro").innerText()).includes("Completa el mapa del cuento")) fail("mapa: intro line missing");
  const labels = await page.locator(".cu-map-label").allInnerTexts();
  for (const w of ["Main characters", "Setting", "Problem", "Solution"]) if (!labels.join(" ").includes(w)) fail(`mapa: bilingual label "${w}" missing`);
  if (!(await page.locator(".cu-map-slot.current .cu-map-now").count())) fail("mapa: '← ahora' tag missing on the current slot");
  const style = await page.locator(".cu-map-slot").first().evaluate((n) => getComputedStyle(n).borderTopStyle);
  if (style !== "solid") fail(`mapa: slots must have solid borders, got ${style}`);
  if (await page.locator(".cu-map-value:visible").count()) fail("mapa: values hidden until filled");
  // NH-1: a miss shows no "null", points back to the story, opens the passage
  const m = L1.map.personajes;
  await clickOption(m.options.find((_, i) => i !== m.answer));
  await page.waitForSelector(".feedback.bad");
  const fb = await page.locator(".feedback.bad").innerText();
  if (/\bnull\b|\bundefined\b/.test(fb)) fail(`mapa miss: feedback shows null/undefined: ${fb}`);
  if (!fb.includes("Busca la respuesta en el cuento")) fail("mapa miss: 'Busca la respuesta en el cuento' missing");
  await screenChecks("mapa miss");
  await page.click(".cu-look");
  if (!(await page.locator("details.cu-passage[open]").count())) fail("mapa miss: 📖 button must open the passage panel");
  // a miss does NOT auto-advance
  await page.waitForTimeout(1500);
  if (!(await page.locator(".cu-next").count())) fail("mapa miss: misses keep the manual Siguiente");
  await page.screenshot({ path: `${SHOTS}/cuentos-mapa-miss.png`, fullPage: true });
  // finish wrong → 0★ → results primary = 📖 Lee otra vez
  for (let i = 0; i < 3; i++) {
    await page.click(".cu-next");
    const slot = await page.locator(".cu-map-slot.current").getAttribute("data-slot");
    const mm = L1.map[slot];
    await clickOption(mm.options.find((_, j) => j !== mm.answer));
  }
  await page.click(".cu-next");
  await expectResults("mapa (all wrong)", 0, 4);
  if (!(await page.locator(".result-actions .btn.primary.cu-reread").count())) fail("results: ≤1★ primary must be 📖 Lee otra vez");
  if ((await page.locator(".result-actions .btn.primary").getAttribute("href")) !== `#/lee/${story.id}/1`) fail("results: reread must go to the reader");
  if (!(await page.locator(".cu-star-hint").innerText()).includes("Para ★★★: ¡todas bien!")) fail("results: star hint missing below 3★");
  if (await page.locator(".cu-next-level").count()) fail("results: Siguiente nivel only with ≥10⭐ on the level");
}
ok("🗺️ Mapa: intro, bilingual solid 2×2 board, '← ahora'; miss → no null + 📖 opens the passage; 0★ → 📖 Lee otra vez primary + star hint");

// 🧩 ordena — all first try
async function playOrdena({ wrongFirst = false } = {}) {
  await go(juego("ordena"));
  await page.waitForSelector(".cu-tile");
  // N-1: the last tile auto-places after the penultimate correct tap.
  for (let i = 0; i < L1.order.length - 1; i++) {
    if (wrongFirst && i === 0) {
      const wrong = page.locator(".cu-tile", { hasText: L1.order[1] });
      await wrong.click();
      await page.waitForSelector(".feedback.bad");
      if ((await page.locator(".cu-slot.filled").count()) !== 0) fail("ordena: a wrong tile must not fill the slot");
      if (!(await page.locator(".cu-tile", { hasText: L1.order[1] }).count())) fail("ordena: wrong tile must return to the bank");
      const fb = await page.locator(".feedback.bad").innerText();
      if (!fb.includes("Ese no va en el número 1") || /lugar/i.test(fb)) fail(`ordena: wrong-tap copy must use "número": ${fb}`);
      if (!(await page.locator(".cu-tile.cu-wrong", { hasText: L1.order[1] }).count())) fail("ordena: wrong tile must stay marked");
    }
    await page.locator(".cu-tile", { hasText: L1.order[i] }).first().click();
    if (wrongFirst && i === 0 && (await page.locator(".cu-tile.cu-wrong").count())) fail("ordena: wrong mark must clear on the next correct placement");
  }
  await page.waitForSelector(".cu-next");
  await page.click(".cu-next");
}
await go(juego("ordena"));
if ((await page.locator(".cu-slot").count()) !== L1.order.length) fail("ordena: one numbered slot per event");
{
  const tiles = await page.locator(".cu-tile").allInnerTexts();
  if (JSON.stringify(tiles.map((t) => t.trim())) === JSON.stringify(L1.order)) fail("ordena: tiles must start shuffled");
}
await roundBasics("ordena");
await page.screenshot({ path: `${SHOTS}/cuentos-ordena.png`, fullPage: true });
await playOrdena();
await expectResults("ordena", L1.order.length - 1, L1.order.length - 1);
if ((await store()).best?.[`${story.id}.1.ordena`]?.stars !== 3) fail("ordena: 3 stars expected in storage");
// first-try scoring: one wrong tap on slot 1 → (n-1)/n, best stays 3
await playOrdena({ wrongFirst: true });
await expectResults("ordena", L1.order.length - 2, L1.order.length - 1);
if (!(await page.locator(".cu-misses").innerText()).includes(L1.order[0])) fail("ordena: miss list must name the event");
if (!(await page.locator(".cu-misses").innerText()).includes("Número 1")) fail("ordena: results must say 'Número', not 'Lugar'");
if ((await store()).best?.[`${story.id}.1.ordena`]?.plays !== 2) fail("ordena: plays should count 2");
// keyboard operable: tiles are buttons
await go(juego("ordena"));
await page.locator(".cu-tile", { hasText: L1.order[0] }).focus();
await page.keyboard.press("Enter");
if ((await page.locator(".cu-slot.filled").count()) !== 1) fail("ordena: Enter on a focused tile must place it");
ok("🧩 Ordena: shuffled tiles, N-1 first-try scoring (3/3 then 2/3, last tile forced), wrong tile returns, keyboard operable");

// ---------- a deliberate miss: answer + evidence highlighted ----------
await go(juego("preguntas"));
{
  const q = (await page.locator(".cu-q").innerText()).trim();
  const item = L1.questions.find((x) => x.q === q);
  const wrong = item.options.find((_, i) => i !== item.answer);
  await clickOption(wrong);
  await page.waitForSelector(".feedback.bad");
  const fb = await page.locator(".feedback.bad").innerText();
  const evidence = ref(L1, item.evidence);
  if (!fb.includes("Casi. La respuesta es:") || !fb.includes(item.options[item.answer])) fail(`miss: feedback lacks the answer: ${fb}`);
  if (!fb.includes(evidence)) fail(`miss: feedback lacks the evidence sentence "${evidence}"`);
  if (!(await page.locator("details.cu-passage[open] .cu-evidence").count())) fail("miss: evidence not highlighted in the open passage");
  const hl = await page.locator(".cu-evidence").innerText();
  if (!hl.includes(evidence) || !hl.includes("📍")) fail("miss: highlighted sentence/📍 marker wrong");
  const outline = await page.locator(".cu-evidence").evaluate((n) => getComputedStyle(n).outlineStyle);
  if (outline === "none") fail("miss: evidence highlight must not rely on color alone (outline)");
  if (!(await page.locator(".choice.correct").count())) fail("miss: correct option must be marked");
  await page.screenshot({ path: `${SHOTS}/cuentos-miss.png`, fullPage: true });
  // finish the round answering correctly; the miss appears in the review list with evidence
  await page.click(".cu-next");
  for (let i = 1; i < 5; i++) {
    const qq = (await page.locator(".cu-q").innerText()).trim();
    const it = L1.questions.find((x) => x.q === qq);
    await clickOption(it.options[it.answer]);
    await page.click(".cu-next");
  }
  await expectResults("preguntas (miss)", 4, 5);
  const review = await page.locator(".cu-misses").innerText();
  if (!review.includes(item.q) || !review.includes(item.options[item.answer]) || !review.includes(evidence)) fail("miss: results review lacks question/answer/evidence");
  if ((await store()).best?.[`${story.id}.1.preguntas`]?.stars !== 3) fail("miss: best stars must stay 3");
}
ok("miss: 'Casi. La respuesta es' + evidence sentence in feedback, 📍 highlight in the auto-opened passage, review list");

// ---------- 🎧 Escucha absent voiceless ----------
await go(`#/cuento/${story.id}`);
if (await page.locator('[data-act="escucha"]').count()) fail("escucha: card must be ABSENT voiceless");
await page.goto(`${BASE}${juego("escucha")}`);
await page.waitForFunction(() => location.hash === "#/cuento/leon-raton");
await page.waitForSelector(".cu-level-card");
ok("🎧 Escucha: card absent and route redirects to the story voiceless");

// ---------- Pistas off: ordena/mapa hide the passage panel ----------
await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem("conjuga.v1") || "{}");
  d.settings = { ...(d.settings || {}), hints: false };
  localStorage.setItem("conjuga.v1", JSON.stringify(d));
});
await page.goto(`${BASE}${juego("mapa")}`);
await page.reload();
await page.waitForSelector(".cu-prompt");
if (await page.locator("details.cu-passage").count()) fail("pistas off: mapa must hide the passage panel");
await page.goto(`${BASE}${juego("preguntas")}`);
await page.reload();
await page.waitForSelector(".cu-prompt");
if (!(await page.locator("details.cu-passage[open]").count())) fail("pistas off: preguntas keeps its evidence panel");
await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem("conjuga.v1"));
  d.settings.hints = true;
  localStorage.setItem("conjuga.v1", JSON.stringify(d));
});
await page.reload();
ok("Pistas off hides the ordena/mapa passage panel, never the evidence panels");

// ---------- home & story reflect progress ----------
await go("#/");
{
  const card = await page.locator(`.cu-book[data-story="${story.id}"]`).innerText();
  if (!card.includes("⭐ 15/45")) fail(`home: leon-raton card should show ⭐ 15/45, got ${card}`);
  if (await page.locator(".start-here").count()) fail("home: N1 complete (15⭐) and something played → no ribbon");
  if (!(await page.locator(".review-water").count() === 0 || (await page.locator(".review-water").innerText()).includes("Repasa para no olvidar"))) fail("home: review copy (CW-15)");
}
await go(`#/cuento/${story.id}`);
if (!(await page.locator('.cu-level-card[data-level="1"]').innerText()).includes("15/15")) fail("story: level 1 should show 15/15");
ok("progress reflected on the shelf (⭐ 15/45, ribbon retires at 15⭐) and the level picker (15/15)");

// ---------- informe ----------
await go("#/informe");
{
  if (!(await page.locator("h1 .info-btn").count())) fail("informe: ℹ️ beside the h1");
  const total = await page.locator(".report-total").innerText();
  if (!total.includes(`⭐ Total: 15 / ${STORIES.length * 45}`)) fail(`informe: total wrong: ${total}`);
  const row = await page.locator(`tr[data-story="${story.id}"][data-level="1"]`).innerText();
  if ((row.match(/3\/3/g) || []).length !== 5 || !row.includes("15/15")) fail(`informe: N1 row wrong: ${row}`);
  if ((await page.locator(".cu-report-table tbody tr").count()) !== STORIES.length * 3) fail("informe: one row per story × level");
  if (!(await page.locator(".report button", { hasText: "Imprimir" }).count())) fail("informe: print button");
  if (!row.includes("🎧 0/3")) fail(`informe: 🎧 cell must read "🎧 0/3": ${row}`);
  if (!(await page.locator(".cu-report-table thead").innerText()).includes("🎧 Escucha (insignias)")) fail("informe: 🎧 header must say insignias (CW-12)");
  await screenChecks("informe");
  await page.screenshot({ path: `${SHOTS}/cuentos-informe.png`, fullPage: true });
}
ok("informe: stars per story × level × activity, totals, ℹ️, print");

// ---------- créditos ----------
await go("#/creditos");
{
  const text = await page.locator("#app").innerText();
  for (const s of STORIES) {
    if (!text.includes(s.title)) fail(`créditos: missing ${s.title}`);
    if (!text.includes(s.source.author)) fail(`créditos: missing author ${s.source.author}`);
  }
  if (!text.includes("MIT")) fail("créditos: MIT line missing");
  const links = await page.locator(".cu-credit a").evaluateAll((as) => as.map((a) => [a.target, a.rel, a.href]));
  if (links.length !== STORIES.length) fail("créditos: one source link per story");
  for (const [t, r, h] of links) if (t !== "_blank" || r !== "noopener" || !h.startsWith("https://")) fail(`créditos: bad link ${h}`);
  await screenChecks("créditos");
  await page.screenshot({ path: `${SHOTS}/cuentos-creditos.png`, fullPage: true });
}
ok("créditos lists every story with author, source link (noopener, new tab), MIT line");

// ---------- footer ----------
{
  const f = await page.locator(".site-footer").innerText();
  for (const s of ["Dual-Language Immersion (DLI) Skills", "Informe", "Créditos", "Acerca de", "Documentación", "Borrar progreso", "NBPTS", "NCSSFL-ACTFL", "Common Core en Español", "“A1”", "“A2”"])
    if (!f.includes(s)) fail(`footer: missing "${s}"`);
  const order = await page.locator(".footer-std").allInnerTexts();
  if (order[0] !== "NBPTS" || order[1] !== "NCSSFL-ACTFL") fail(`footer: standards order ${order}`);
  if ((await page.locator('.site-footer a[href="../about.html"]').count()) !== 1) fail("footer: about link must be ../about.html");
}
ok("footer: site name, links, standards order NBPTS → NCSSFL-ACTFL → Common Core en Español, A1/A2 credits");

// ---------- ☰ menu ----------
await go("#/");
await page.click(".menu-btn");
await page.waitForSelector(".menu-panel:not([hidden])");
{
  const rows = await page.locator(".menu-panel > .menu-link").allInnerTexts();
  const want = ["Inicio", "Informe", "Créditos", "DLIskills", "Conjuga", "Acerca de", "Documentación", "Ajustes"];
  const got = want.map((w) => rows.findIndex((r) => r.startsWith(w)));
  if (got.includes(-1) || got.some((v, i) => i && v < got[i - 1])) fail(`menu: rows/order wrong: ${JSON.stringify(rows)}`);
  if (rows.some((r) => /Descargas|Instalar/.test(r))) fail("menu: no Descargas/Install rows in Cuentos v1");
  // M31 B/C: Conjuga moved to /conjuga/; the site homepage is ../
  if ((await page.locator('.menu-panel a[href="../conjuga/"]').count()) !== 1) fail("menu: Conjuga link must be ../conjuga/");
  if (!(await page.locator('.menu-panel a[href="../"]').innerText()).startsWith("DLIskills · Inicio")) fail("menu: site-home row (../) missing");
  await page.click(".settings-toggle");
  if (await page.locator(".setting-vosotros").count()) fail("menu: no Vosotros switch in Cuentos");
  if (!(await page.locator(".setting-hints").count())) fail("menu: Pistas switch missing");
  if (!(await page.locator(".setting-hints .switch-note").innerText()).includes("Muestra 📖 Ver el cuento en 🧩 Ordena y 🗺️ Mapa")) fail("menu: Pistas sub-label missing (CW-7)");
  if (await page.locator(".sound-toggle").count()) fail("menu: Sonido hidden voiceless");
  // Borrar clears cuentos.v1 ONLY
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("conjuga.v1") || "{}");
    d.best = { ...(d.best || {}), "1.present.choice": { score: 10, total: 10, stars: 3, plays: 1, at: 1 } };
    localStorage.setItem("conjuga.v1", JSON.stringify(d));
  });
  await page.click(".borrar-row");
  await page.waitForSelector('.info-panel[role="dialog"] .cu-erase-confirm');
  if (await page.locator(".menu-panel:not([hidden])").count()) fail("menu: drawer must close before the erase dialog opens");
  if (!(await page.evaluate(() => document.activeElement?.classList.contains("cu-erase-cancel")))) fail("menu: Cancelar must be the focused default");
  await page.click(".cu-erase-confirm");
  await page.waitForSelector(".cu-book");
  const after = await page.evaluate(() => [localStorage.getItem("cuentos.v1"), JSON.parse(localStorage.getItem("conjuga.v1") || "{}")]);
  if (after[0] && Object.keys(JSON.parse(after[0]).best || {}).length) fail("menu: Borrar must clear cuentos.v1");
  if (!after[1].best?.["1.present.choice"]) fail("menu: Borrar must NOT touch conjuga.v1");
  if (!(await page.locator(".cu-book").first().innerText()).includes("⭐ 0/45")) fail("menu: shelf not re-rendered after Borrar");
}
ok("☰ menu: Inicio · Informe · Créditos · DLIskills · Conjuga · Acerca de · Documentación · Ajustes; no Vosotros; Borrar clears only cuentos.v1");

// footer Borrar also scoped
await go(`#/lee/${story.id}/1`);
await page.click(".cu-borrar");
await page.waitForSelector(".cu-erase-cancel");
await page.click(".cu-erase-cancel");
if (await page.locator(".info-overlay").count()) fail("footer Borrar: Cancelar must close the dialog");
await page.click(".cu-borrar");
await page.click(".cu-erase-confirm");
await page.waitForSelector(".cu-reader");
if (nativeDialogs.length) fail(`Borrar must not use native confirm(): ${nativeDialogs}`);
if (!(await page.evaluate(() => !!JSON.parse(localStorage.getItem("conjuga.v1")).best["1.present.choice"]))) fail("footer Borrar touched conjuga.v1");
ok("footer Borrar is scoped to cuentos.v1");

// ---------- unknown route → home ----------
await go("#/nope/123");
if (!(await page.locator(".cu-book").count())) fail("unknown route must render the Biblioteca");
ok("unknown routes fall back to the Biblioteca");

// ---------- 360px phone ----------
{
  const phone = await newVoiceless({ width: 360, height: 760 });
  for (const [name, hash] of [["reader", `#/lee/${story.id}/1`], ["round", juego("preguntas")], ["ordena", juego("ordena")], ["home", "#/"]]) {
    await phone.goto(`${BASE}${hash}`);
    await phone.waitForSelector(".site-footer");
    if (name === "reader") {
      await phone.locator(".cu-gloss").last().click();
      await phone.waitForSelector(".cu-bubble");
      const r = await phone.locator(".cu-bubble").boundingBox();
      if (r.x < 0 || r.x + r.width > 360) fail(`360px: glossary bubble off-screen (${r.x}, ${r.width})`);
    }
    const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 0) fail(`360px ${name}: horizontal overflow ${overflow}px`);
    await phone.screenshot({ path: `${SHOTS}/cuentos-360-${name}.png`, fullPage: true });
  }
  // CW-1: Ordena wrong-tap feedback visible inside the 360×740 viewport
  await phone.setViewportSize({ width: 360, height: 740 });
  await phone.goto(`${BASE}${juego("ordena")}`);
  await phone.reload();
  await phone.waitForSelector(".cu-tile");
  await phone.locator(".cu-tile", { hasText: L1.order[2] }).click();
  await phone.waitForSelector(".feedback.bad");
  {
    const fb = await phone.locator(".feedback.bad").boundingBox();
    if (!fb || fb.y < 0 || fb.y + fb.height > 740) fail(`360 ordena: wrong-tap feedback outside the viewport (${JSON.stringify(fb)})`);
    const text = await phone.locator(".feedback.bad").innerText();
    if (!text.includes("❌ Ese no va en el número 1. ¡Prueba otro!")) fail(`360 ordena: copy wrong: ${text}`);
    await phone.screenshot({ path: `${SHOTS}/cuentos-360-ordena-wrong.png` });
  }
  // NH-3: Mapa choices inside the first 740px
  await phone.goto(`${BASE}${juego("mapa")}`);
  await phone.reload();
  await phone.waitForSelector(".cu-choice");
  {
    const bottom = await phone.locator(".cu-choice").last().evaluate((b) => b.getBoundingClientRect().bottom);
    if (bottom > 740) fail(`360 mapa: last choice ends at ${bottom}px (> 740)`);
    await phone.screenshot({ path: `${SHOTS}/cuentos-360-mapa.png` });
  }
  // NH-20: footer targets ≥44px
  {
    const hs = await phone.locator(".site-footer a, .site-footer button").evaluateAll((ns) => ns.map((n) => n.getBoundingClientRect().height));
    if (hs.some((h) => h < 44)) fail(`360 footer: targets under 44px: ${hs}`);
  }
  // CW-14: level cards one row of 3
  await phone.goto(`${BASE}#/cuento/${story.id}`);
  await phone.waitForSelector(".cu-level-card");
  {
    const ys = await phone.locator(".cu-level-card").evaluateAll((ns) => ns.map((n) => Math.round(n.getBoundingClientRect().top)));
    if (new Set(ys).size !== 1) fail(`360 story: level cards must share one row, tops ${ys}`);
  }
  await phone.close();
  ok("360px: no horizontal scroll; bubble on screen; Ordena wrong-tap visible ('número'); Mapa choices ≤740; footer ≥44px; level cards in one row");
}

// ---------- dark theme parity (screenshot) ----------
{
  const dark = await browser.newPage({ viewport: { width: 900, height: 900 }, colorScheme: "dark" });
  trackErrors(dark);
  await dark.route("**/audio/manifest.json", (r) => r.fulfill({ status: 204 }));
  await dark.goto(`${BASE}#/lee/${story.id}/2`);
  await dark.waitForSelector(".cu-reader");
  const bg = await dark.evaluate(() => getComputedStyle(document.querySelector(".cu-reader")).backgroundColor);
  if (bg !== "rgb(37, 44, 34)") fail(`dark: reader card should use the dark --card, got ${bg}`);
  await dark.screenshot({ path: `${SHOTS}/cuentos-dark-reader.png`, fullPage: true });
  await dark.close();
  ok("dark mode: reader card follows the Prado dark tokens");
}


// ---------- voiced context (stubbed local Spanish voice) ----------
{
  const voiced = await newVoiceless();
  await voiced.addInitScript(() => {
    const fakeVoice = { lang: "es-MX", localService: true, name: "Fake ES" };
    window.__spoken = [];
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => [fakeVoice],
        addEventListener: () => {},
        cancel: () => {},
        speak: (u) => {
          window.__spoken.push({ text: u.text, rate: u.rate });
          setTimeout(() => u._cbs?.end?.(), 0);
        },
      },
    });
    window.SpeechSynthesisUtterance = function (text) {
      this.text = text;
      this._cbs = {};
      this.addEventListener = (ev, fn) => { this._cbs[ev] = fn; };
    };
  });
  const spoken = () => voiced.evaluate(() => window.__spoken.splice(0));
  await voiced.goto(`${BASE}#/lee/${story.id}/1`);
  await voiced.waitForSelector(".cu-readalong");
  if ((await voiced.locator(".cu-para-audio").count()) !== L1.paragraphs.length) fail("voiced: 🔊/🐢 per paragraph expected");
  await voiced.locator(".cu-para-audio .cu-say").first().click();
  await voiced.locator(".cu-para-audio .cu-slow").first().click();
  let said = await spoken();
  if (said[0]?.text !== L1.paragraphs[0].join(" ") || said[0]?.rate !== 0.85) fail(`voiced: paragraph 🔊 said ${JSON.stringify(said[0])}`);
  if (said[1]?.rate !== 0.5) fail("voiced: 🐢 must request the slow clip (rate 0.5)");
  await voiced.locator(".cu-gloss", { hasText: "duerme" }).first().click();
  await voiced.click(".cu-bubble-say");
  said = await spoken();
  if (said[0]?.text !== "duerme") fail(`voiced: bubble 🔊 said ${JSON.stringify(said)}`);
  await voiced.keyboard.press("Escape");
  await voiced.click(".cu-readalong");
  await voiced.waitForSelector(".cu-readalong:not(.playing)");
  said = await spoken();
  if (JSON.stringify(said.map((x) => x.text)) !== JSON.stringify(L1.paragraphs.flat())) fail(`voiced: read-along order wrong: ${JSON.stringify(said.map((x) => x.text))}`);
  await voiced.screenshot({ path: `${SHOTS}/cuentos-voiced-reader.png`, fullPage: true });
  if (!(await voiced.evaluate(() => sessionStorage.getItem("cuentos.read.leon-raton.1")))) fail("voiced: finishing the read-along counts as a read");
  // CW-10: the paragraph is highlighted while its 🔊 plays
  await voiced.evaluate(() => {
    const orig = window.speechSynthesis.speak;
    window.speechSynthesis.speak = (u) => { window.__held = u; window.__spoken.push({ text: u.text, rate: u.rate }); };
    window.__restore = () => { window.speechSynthesis.speak = orig; window.__held?._cbs?.end?.(); };
  });
  await voiced.locator(".cu-para-audio .cu-say").first().click();
  if (!(await voiced.locator(".cu-para.cu-current").count())) fail("voiced: paragraph must be highlighted while it plays");
  await voiced.evaluate(() => window.__restore());
  await voiced.waitForFunction(() => !document.querySelector(".cu-para.cu-current"));
  await spoken();
  // NH-9: at 360 with a voice, N2 text starts above y=380
  await voiced.setViewportSize({ width: 360, height: 740 });
  await voiced.goto(`${BASE}#/lee/${story.id}/2`);
  await voiced.waitForSelector(".cu-readalong");
  {
    const y = (await voiced.locator(".cu-para-text").first().boundingBox()).y;
    if (y >= 380) fail(`360 reader N2: text starts at y=${y} (≥ 380)`);
    const t = await voiced.locator("h1 .info-btn").boundingBox();
    const h = await voiced.locator("h1 .cu-title-text").boundingBox();
    if (t.y > h.y + h.height) fail("360 reader: ℹ️ wrapped under the title");
    await voiced.screenshot({ path: `${SHOTS}/cuentos-360-reader-n2.png` });
  }
  await voiced.setViewportSize({ width: 900, height: 900 });
  // story screen: key words tap-to-hear + 🎧 card
  await voiced.goto(`${BASE}#/cuento/${story.id}`);
  await voiced.waitForSelector(".cu-key-say");
  if (!(await voiced.locator('[data-act="escucha"]').count())) fail("voiced: 🎧 Escucha card expected with a voice");
  // 🎧 Escucha round: target heard, never shown in the prompt
  await voiced.goto(`${BASE}#/juego/${story.id}/1/escucha`);
  await voiced.waitForSelector(".cu-listen");
  const targets = L1.listen.map((r) => ref(L1, r));
  {
    await voiced.addScriptTag({ content: readFileSync(join(ROOT, "tests/e2e/vendor/axe.min.js"), "utf8") });
    const bad = await voiced.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations
      .filter((v) => v.impact === "critical" || v.impact === "serious").map((v) => `${v.id} e.g. ${v.nodes[0]?.target}`));
    if (bad.length) fail(`axe escucha (voiced): ${bad.join(" | ")}`);
    await voiced.screenshot({ path: `${SHOTS}/cuentos-escucha.png`, fullPage: true });
  }
  for (let i = 0; i < 5; i++) {
    await voiced.waitForSelector(".cu-listen");
    await voiced.waitForTimeout(30);
    said = await spoken();
    const heard = said.at(-1)?.text;
    if (!targets.includes(heard)) fail(`escucha: auto-play said ${heard}`);
    const prompt = await voiced.locator(".cu-prompt").innerText();
    if (prompt.includes(heard)) fail("escucha: the prompt must never show the target text");
    if (i === 0 && (await voiced.locator(".cu-choices .choice").evaluateAll((bs) => bs.filter((b) => b.querySelector(".cu-diff")).length)) !== 3) fail("escucha: every option must bold its differing words (NH-14)");
    await clickOption(heard, voiced);
    await voiced.click(".cu-next");
  }
  await voiced.waitForSelector(".results");
  if ((await voiced.locator(".results .badge.on").count()) !== 3) fail("escucha: 3 🎧 badges expected");
  if (!(await voiced.locator(".cu-badge-note").innerText()).includes("¡Ganaste insignias de escucha! Son aparte de las estrellas")) fail("escucha: badge track not named on results (CW-3)");
  const st = await voiced.evaluate(() => JSON.parse(localStorage.getItem("cuentos.v1")));
  if (st.best[`${story.id}.1.escucha`]?.stars !== 3) fail("escucha: badges not stored under act escucha");
  await voiced.goto(`${BASE}#/`);
  await voiced.waitForSelector(".cu-book");
  const card = await voiced.locator(`.cu-book[data-story="${story.id}"]`).innerText();
  if (!card.includes("🎧 3/9") || !card.includes("⭐ 0/45")) fail(`escucha: badges must never count as stars: ${card}`);
  if (!(await voiced.locator(".total-stars").innerText()).includes(`🎧 3/${STORIES.length * 9} insignias`)) fail("home: 🎧 total must say insignias (CW-3)");
  await voiced.goto(`${BASE}#/cuento/${story.id}`);
  await voiced.waitForSelector(".cu-level-badges");
  if (!(await voiced.locator('.cu-level-card[data-level="1"] .cu-level-badges').innerText()).includes("🎧 3/3")) fail("story: level card must show 🎧 x/3 when speakable");
  // muted: say() is silent, Escucha still speaks (the one exemption)
  await voiced.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("conjuga.v1") || "{}");
    d.settings = { ...(d.settings || {}), sound: false };
    localStorage.setItem("conjuga.v1", JSON.stringify(d));
  });
  await voiced.goto(`${BASE}#/lee/${story.id}/1`);
  await voiced.reload();
  await voiced.waitForSelector(".cu-readalong");
  await spoken();
  await voiced.click(".cu-readalong");
  await voiced.locator(".cu-para-audio .cu-say").first().click();
  await voiced.waitForTimeout(100);
  if ((await spoken()).length) fail("muted: reader audio must respect the sound setting");
  // NH-2: the muted tap is VISIBLE — toast + "Encender" turns sound on and replays
  {
    const toast = voiced.locator('.cu-toast[role="status"]');
    if (!(await toast.isVisible())) fail("muted: toast must appear on a muted 🔊 tap");
    if (!(await toast.innerText()).includes("El sonido está apagado")) fail("muted: toast copy wrong");
    await voiced.screenshot({ path: `${SHOTS}/cuentos-muted-toast.png` });
    await voiced.click(".cu-unmute");
    await voiced.waitForTimeout(50);
    const replay = await spoken();
    if (replay[0]?.text !== L1.paragraphs[0].join(" ")) fail(`muted: Encender must replay the paragraph, said ${JSON.stringify(replay)}`);
    if (!(await voiced.evaluate(() => JSON.parse(localStorage.getItem("conjuga.v1")).settings.sound))) fail("muted: Encender must set sound=true");
    // key-word chips go through the same gate
    await voiced.evaluate(() => {
      const d = JSON.parse(localStorage.getItem("conjuga.v1"));
      d.settings.sound = false;
      localStorage.setItem("conjuga.v1", JSON.stringify(d));
    });
    await voiced.goto(`${BASE}#/cuento/${story.id}`);
    await voiced.reload();
    await voiced.waitForSelector(".cu-key-say");
    await voiced.locator(".cu-key-say").first().click();
    if (!(await voiced.locator(".cu-toast").isVisible())) fail("muted: key-word chip must show the muted toast");
    if ((await spoken()).length) fail("muted: key-word chip must stay silent while muted");
    await voiced.waitForTimeout(3300);
    if (await voiced.locator(".cu-toast").count()) fail("muted: toast must dismiss after ~3 s");
  }
  await voiced.goto(`${BASE}#/juego/${story.id}/1/escucha`);
  await voiced.waitForSelector(".cu-listen");
  await voiced.waitForTimeout(30);
  if (!(await spoken()).length) fail("muted: 🎧 Escucha is the mute exemption and must still speak");
  await voiced.close();
  ok("voiced: paragraph 🔊/🐢 (0.85/0.5), bubble 🔊, read-along in order, key words, 🎧 Escucha (never shown, badges ≠ stars), mute respected except Escucha");
}

// ---------- axe-core gate: zero critical/serious ----------
{
  const axeSource = readFileSync(join(ROOT, "tests/e2e/vendor/axe.min.js"), "utf8");
  const axePage = await newVoiceless();
  const runAxe = async (label) => {
    await axePage.addScriptTag({ content: axeSource });
    const bad = await axePage.evaluate(async () => {
      const res = await window.axe.run(document, { resultTypes: ["violations"] });
      return res.violations
        .filter((v) => v.impact === "critical" || v.impact === "serious")
        .map((v) => `${v.id}(${v.impact}) ×${v.nodes.length} e.g. ${v.nodes[0]?.target?.join(" ")}`);
    });
    if (bad.length) fail(`axe ${label}: ${bad.join(" | ")}`);
  };
  const routes = ["#/", `#/cuento/${story.id}`, `#/lee/${story.id}/1`, `#/lee/${story.id}/2`, `#/lee/${story.id}/3`,
    ...["preguntas", "verdad", "ordena", "palabras", "mapa"].map((a) => juego(a)), "#/informe", "#/creditos"];
  for (const r of routes) {
    await axePage.goto(`${BASE}${r}`);
    await axePage.reload();
    await axePage.waitForSelector(".site-footer");
    await runAxe(r);
  }
  // interactive states: glossary bubble, miss feedback + evidence, results, menu, ℹ️ dialog
  await axePage.goto(`${BASE}#/lee/${story.id}/1`);
  await axePage.reload();
  await axePage.locator(".cu-gloss").first().click();
  await runAxe("gloss bubble");
  await axePage.goto(`${BASE}${juego("verdad")}`);
  await axePage.reload();
  await axePage.waitForSelector(".cu-statement");
  {
    const s = (await axePage.locator(".cu-statement").innerText()).trim().replace(/^🤔\s*/, "");
    const item = L1.tf.find((x) => x.s === s);
    await axePage.click(item.answer ? ".cu-false" : ".cu-true");
    await axePage.waitForSelector(".cu-evidence");
    await runAxe("miss + evidence");
    for (let i = 0; i < 5; i++) {
      await axePage.click(".cu-next");
      if (i === 4) break;
      await axePage.click(".cu-true");
    }
    await axePage.waitForSelector(".results");
    await runAxe("results");
  }
  await axePage.click(".menu-btn");
  await axePage.click(".settings-toggle");
  await runAxe("menu open");
  await axePage.keyboard.press("Escape");
  await axePage.click(".cu-borrar");
  await axePage.waitForSelector(".cu-erase-confirm");
  await runAxe("erase dialog");
  await axePage.click(".cu-erase-cancel");
  await axePage.goto(`${BASE}${juego("mapa")}`);
  await axePage.reload();
  await axePage.waitForSelector(".cu-choice");
  {
    const m = L1.map.personajes;
    const texts = await optionTexts(axePage);
    await axePage.locator(".cu-choices .choice").nth(texts.indexOf(m.options.find((_, i) => i !== m.answer))).click();
    await axePage.waitForSelector(".cu-look");
    await runAxe("mapa miss");
  }
  await axePage.goto(`${BASE}${juego("ordena")}`);
  await axePage.reload();
  await axePage.locator(".cu-tile", { hasText: L1.order[1] }).click();
  await axePage.waitForSelector(".cu-tile.cu-wrong");
  await runAxe("ordena wrong tile");
  await axePage.keyboard.press("Escape");
  await axePage.goto(`${BASE}#/informe`);
  await axePage.reload();
  await axePage.click("h1 .info-btn");
  await axePage.waitForSelector(".info-panel");
  await runAxe("info dialog");
  await axePage.close();
  ok(`axe-core: zero critical/serious across ${routes.length} routes + bubble/miss/results/menu/erase dialog/mapa miss/ordena wrong/info dialog states`);
}

// ---------- wrap up ----------
if (errors.length) fail(`console/page errors: ${JSON.stringify(errors)}`);
await browser.close();
server.close();

if (failures.length) {
  console.error(`\nCUENTOS E2E FAILED — ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nCUENTOS E2E PASSED");
