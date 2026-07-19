/**
 * End-to-end smoke suite. Drives every screen and all four game modes in
 * headless Chromium, asserts on rendered text (not just selectors), and
 * fails on any console/page error.
 *
 * Run locally:  npm i --no-save playwright && npx playwright install chromium
 *               npm run e2e
 * Chromium override (e.g. remote sandboxes): CHROMIUM_PATH=/path/to/chrome
 * Screenshots land in tests/e2e/shots/ (gitignored; uploaded as CI artifact).
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";

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
const BASE = `http://localhost:${server.address().port}`;

const failures = [];
const fail = (msg) => { console.error("FAIL:", msg); failures.push(msg); };
const ok = (msg) => console.log("ok:", msg);

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const errors = [];
const trackErrors = (p) => {
  p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  p.on("pageerror", (e) => errors.push(String(e)));
};
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
trackErrors(page);
// M12: this context simulates NO AUDIO AT ALL (no local voice, clips
// unreachable) so every "voiceless" assertion below keeps its meaning.
// 204 (not abort): the empty body fails res.json() → clip backend stays
// off, and nothing is logged to the console-error tracker.
await page.route("**/audio/manifest.json", (r) => r.fulfill({ status: 204 }));

async function assertNoStrayNull(name) {
  const text = await page.locator("#app").innerText();
  if (/\bnull\b|\bundefined\b/.test(text)) fail(`${name}: stray null/undefined in rendered text`);
}

// ---------- home ----------
await page.goto(`${BASE}/`);
await page.waitForSelector(".set-card");
const cards = await page.locator(".set-card").count();
if (cards !== 20) fail(`home: expected 20 set cards, got ${cards}`);
await assertNoStrayNull("home");
// mascot: Lola greets on home, decorative only
await page.waitForSelector(".home-title .lola-wrap .lola");
if ((await page.locator(".lola-wrap").getAttribute("aria-hidden")) !== "true") fail("home: Lola must be aria-hidden");
const greeting = await page.locator(".lola-greeting").innerText();
// date-agnostic: the July-2026 Mundial greeting or the standard one —
// the seasonal block below pins each side with an injected clock
if (!greeting.includes("Lola")) fail(`home: greeting missing, got "${greeting}"`);
await page.screenshot({ path: `${SHOTS}/home.png` });
ok("home renders 20 groups + Lola greeter");

// ---------- set screen ----------
await page.click('a[href="#/set/1"]');
await page.waitForSelector(".tense-card");
if ((await page.locator(".tense-card").count()) !== 3) fail("set: expected 3 tense cards");
// M26: stretch cards share .mode-card styling but are NOT activities — exclude them.
if ((await page.locator(".mode-card:not(.stretch-card)").count()) !== 6) fail("set: expected 6 activity cards");
if (!(await page.locator(".practica-card").count())) fail("set: Práctica card missing");
if (await page.locator(".practica-card .star").count()) fail("set: Práctica is unscored — no stars on its card");
if (await page.locator(".listen-card").count()) fail("set: Escucha must be hidden without a Spanish voice");
await assertNoStrayNull("set");
await page.screenshot({ path: `${SHOTS}/set.png` });
ok("set screen renders tenses + activities + reto");

// ---------- study tables: engine spot checks ----------
for (const [tense, expected] of [["present", "soy"], ["preterite", "fui"], ["imperfect", "era"]]) {
  await page.goto(`${BASE}/#/study/1/${tense}`);
  await page.waitForSelector(".conj-table");
  const first = await page.locator(".conj-table tbody tr").first().locator("td").first().innerText();
  if (first !== expected) fail(`study ${tense}: expected "${expected}", got "${first}"`);
  await assertNoStrayNull(`study ${tense}`);
}
if ((await page.locator(".conj-table tbody tr").count()) !== 5) fail("study: expected 5 person rows (vosotros off)");
if (await page.locator(".lola-wrap").count()) fail("study: no mascot allowed (scarcity of stimulation)");
// Estudia links every available activity (M7 owner add-on)
// (we're on the imperfect page after the loop above)
if (!(await page.locator(".study-actions .contrast-link").count())) fail("study: past tense must link the contrast challenge");
if (await page.locator(".study-actions .listen-link").count()) fail("study: no Escucha link without a voice");
await page.goto(`${BASE}/#/study/1/present`);
await page.waitForSelector(".conj-table");
if (await page.locator(".study-actions .contrast-link").count()) fail("study: present tense must not link the past-tense contrast");
await page.screenshot({ path: `${SHOTS}/study.png` });
ok("study tables verified: soy / fui / era");

// helper: compute the correct answer for the current prompt via the app's own modules
const currentAnswer = (tenseExpr) => page.evaluate(async (tenseCode) => {
  const { SETS } = await import("./js/verbs.js");
  const { conjugate, PERSONS } = await import("./js/conjugator.js");
  const { TENSE_CUES } = await import("./js/game.js");
  let tense = tenseCode;
  if (tense === "FROM_CUE") {
    const cue = document.querySelector(".cue-chip").textContent.replace(/^🕐 /, "");
    tense = TENSE_CUES.preterite.includes(cue) ? "preterite" : "imperfect";
  }
  const person = document.querySelector(".prompt-person").textContent;
  const inf = document.querySelector(".prompt-verb").textContent.split(" — ")[0];
  const verb = SETS[0].verbs.find((v) => v.inf === inf);
  return conjugate(verb, tense)[PERSONS.indexOf(person)];
}, tenseExpr);

// ---------- sticky-hover regression: no lingering highlight after advancing ----------
await page.goto(`${BASE}/#/play/1/present/choice`);
await page.waitForSelector(".choice");
{
  const box = await page.locator(".choice").first().boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy); // park the pointer over option 1
  const correct = await currentAnswer("present");
  const texts = await page.locator(".choice").allInnerTexts();
  const idx = texts.findIndex((t) => t.replace(/^\d/, "").trim() === correct);
  if (idx === -1) fail("hover-regression: correct option not located");
  await page.keyboard.press(String(idx + 1)); // answer WITHOUT moving the pointer
  await page.waitForTimeout(1150); // auto-advance to question 2
  if (!(await page.locator(".choices.no-hover").count())) fail("hover-regression: fresh grid missing no-hover");
  const border = await page.evaluate(([x, y]) => {
    const c = document.elementFromPoint(x, y)?.closest(".choice");
    return c ? getComputedStyle(c).borderTopColor : "none";
  }, [cx, cy]);
  if (border !== "none" && border !== "rgba(0, 0, 0, 0)")
    fail(`hover-regression: option under parked pointer shows border ${border}`);
  // moving the pointer WITHIN the grid restores normal hover
  const box2 = await page.locator(".choice").nth(1).boundingBox();
  await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
  await page.waitForTimeout(60);
  if (await page.locator(".choices.no-hover").count()) fail("hover-regression: no-hover must clear on pointer move");
  ok("sticky-hover regression: fresh grid renders untouched, hover restored on move");
}

// Same guard must hold in the REDESIGN look, whose [data-redesign] .choice:hover
// rule outspecifies styles.css's .no-hover unless redesign.css mirrors it.
await page.goto(`${BASE}/?redesign=1#/play/1/present/choice`);
await page.waitForSelector(".choice");
{
  const box = await page.locator(".choice").first().boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy); // park the pointer over option 1
  const correct = await currentAnswer("present");
  const texts = await page.locator(".choice").allInnerTexts();
  const idx = texts.findIndex((t) => t.replace(/^\d/, "").trim() === correct);
  if (idx === -1) fail("redesign hover-regression: correct option not located");
  await page.keyboard.press(String(idx + 1)); // answer WITHOUT moving the pointer
  await page.waitForTimeout(1150); // auto-advance to question 2
  if (!(await page.locator(".choices.no-hover").count())) fail("redesign hover-regression: fresh grid missing no-hover");
  const border = await page.evaluate(([x, y]) => {
    const c = document.elementFromPoint(x, y)?.closest(".choice");
    return c ? getComputedStyle(c).borderTopColor : "none";
  }, [cx, cy]);
  if (border !== "none" && border !== "rgba(0, 0, 0, 0)")
    fail(`redesign hover-regression: option under parked pointer shows border ${border}`);
  ok("sticky-hover regression (redesign look): no lingering selection border after advancing");
  await page.reload(); // leave a fresh round for the full-round section (same-hash goto won't reload)
}

// ---------- Elige: complete a full round ----------
await page.goto(`${BASE}/#/play/1/present/choice`);
await page.waitForSelector(".play-lola .lola");
if (!(await page.locator(".lola-nest").count())) fail("play: nest missing from progress bar");
if (!(await page.locator(".lola-help").count())) fail("play: helping copy missing");
let sawCurious = false;
for (let q = 0; q < 10; q++) {
  await page.waitForSelector(".choice:not(:disabled)");
  await page.locator(".choice").first().click();
  try {
    const nextBtn = page.locator(".feedback.bad button");
    await nextBtn.waitFor({ timeout: 400 });
    // wrong answer → Lola is curious, never negative
    if (await page.locator(".play-lola .lola.is-curious").count()) sawCurious = true;
    await nextBtn.click();
  } catch { /* correct → auto-advance */ }
  await page.waitForTimeout(1050);
}
if (!sawCurious) fail("play: expected Lola is-curious on at least one wrong answer");
await page.waitForSelector(".results");
// Lola state must match the star count deterministically
{
  const starsOn = await page.locator(".big-stars .star.on").count();
  const expectClass = starsOn === 3 ? "is-spin" : starsOn >= 1 ? "is-celebrate" : "is-idle";
  if (!(await page.locator(`.results .lola.${expectClass}`).count()))
    fail(`results: ${starsOn} stars should show Lola ${expectClass}`);
}
ok(`choice round completes → ${(await page.locator(".score-line").innerText()).trim()}`);
await page.screenshot({ path: `${SHOTS}/choice-results.png` });

// ---------- Escribe: correct answer + accent tolerance ----------
await page.goto(`${BASE}/#/play/1/present/type`);
await page.waitForSelector(".type-input");
if (!(await page.locator(".type-form.no-hover").count())) fail("type: fresh form missing no-hover");
await page.waitForSelector(".play-lola .lola.is-watching"); // input autofocus → Lola watches
const a1 = await currentAnswer("present");
await page.fill(".type-input", a1);
await page.click(".type-form .btn.primary");
await page.waitForSelector(".feedback.good");
await page.waitForSelector(".play-lola .lola.is-hop", { timeout: 800 }); // correct → hop
ok(`type mode accepts correct answer: ${a1} (Lola watches, then hops)`);
await page.waitForTimeout(1100);
const a2 = await currentAnswer("present");
const stripped = a2.normalize("NFD").replace(/[̀-ͯ]/g, "");
if (stripped !== a2) {
  await page.fill(".type-input", stripped);
  await page.click(".type-form .btn.primary");
  await page.waitForSelector(".feedback.almost");
  ok(`type mode accent-retry works: ${a2}`);
} else {
  ok("type mode q2 accent-free; retry path not applicable this run");
}

// ---------- Empareja: full solve ----------
await page.goto(`${BASE}/#/play/1/present/match`);
await page.waitForSelector(".match-card");
if (!(await page.locator(".match-board.no-hover").count())) fail("match: fresh board missing no-hover");
// first pair clicked via UI so we can watch Lola's look-back turn
{
  const first = await page.evaluate(async () => {
    const { SETS } = await import("./js/verbs.js");
    const { conjugate, PERSONS } = await import("./js/conjugator.js");
    const l = document.querySelector(".match-col.left .match-card");
    const [personLabel, inf] = l.textContent.split(" · ");
    const verb = SETS[0].verbs.find((v) => v.inf === inf);
    return { left: l.textContent, right: conjugate(verb, "present")[PERSONS.indexOf(personLabel)] };
  });
  // exact-text matching: hasText is substring-based and "es" ⊂ "eres" etc.
  const exact = (t) => new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
  await page.locator(".match-col.left .match-card").filter({ hasText: exact(first.left) }).first().click();
  await page.locator(".match-col.right .match-card").filter({ hasText: exact(first.right) }).first().click();
  await page.waitForSelector(".match-title .lola.is-turn", { timeout: 1200 });
  ok("match: Lola turns her head on a matched pair");
}
const solved = await page.evaluate(async () => {
  const { SETS } = await import("./js/verbs.js");
  const { conjugate, PERSONS } = await import("./js/conjugator.js");
  const left = [...document.querySelectorAll(".match-col.left .match-card:not(.done)")];
  const right = [...document.querySelectorAll(".match-col.right .match-card")];
  for (const l of left) {
    const [personLabel, inf] = l.textContent.split(" · ");
    const verb = SETS[0].verbs.find((v) => v.inf === inf);
    const form = conjugate(verb, "present")[PERSONS.indexOf(personLabel)];
    const r = right.find((x) => x.textContent === form && !x.disabled);
    if (!r) return `no right card for ${personLabel} ${inf} → ${form}`;
    l.click(); r.click();
    await new Promise((res) => setTimeout(res, 40));
  }
  return "ok";
});
if (solved !== "ok") fail(`match: ${solved}`);
await page.waitForSelector(".results");
const matchScore = (await page.locator(".score-line").innerText()).trim();
if (!matchScore.startsWith("6 / 6")) fail(`match: expected 6/6, got ${matchScore}`);
// 6/6 = 3 stars → Lola's signature head-spin celebration
if (!(await page.locator(".results .lola.is-spin").count())) fail("results: expected Lola is-spin on 3 stars");
ok(`match mode full solve → ${matchScore} (Lola spins)`);

// ---------- Contrast: full solve via cue → tense ----------
await page.goto(`${BASE}/#/play/1/contrast`);
await page.waitForSelector(".play-lola .lola");
for (let q = 0; q < 10; q++) {
  if (q === 1 && !(await page.locator(".contrast-choices.no-hover").count()))
    fail("contrast: fresh grid missing no-hover");
  await page.waitForSelector(".contrast-choices .choice:not(:disabled)");
  const correct = await currentAnswer("FROM_CUE");
  const buttons = page.locator(".contrast-choices .choice");
  if ((await buttons.count()) !== 2) fail("contrast: expected exactly 2 options");
  for (let b = 0; b < 2; b++) {
    const text = (await buttons.nth(b).innerText()).replace(/^\d/, "").trim();
    if (text === correct) { await buttons.nth(b).click(); break; }
  }
  await page.waitForTimeout(1250);
}
await page.waitForSelector(".results");
const contrastScore = (await page.locator(".score-line").innerText()).trim();
if (!contrastScore.startsWith("10 / 10")) fail(`contrast: expected 10/10, got ${contrastScore}`);
ok(`contrast mode full solve → ${contrastScore}`);
await page.screenshot({ path: `${SHOTS}/contrast-results.png` });

// ---------- review queue: due items appear and link into a game ----------
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem("conjuga.v1"));
  for (const k of Object.keys(s.best)) s.best[k].at = Date.now() - 8 * 24 * 3600 * 1000;
  localStorage.setItem("conjuga.v1", JSON.stringify(s));
});
await page.goto(`${BASE}/#/`);
await page.reload();
await page.waitForSelector(".review-queue");
await page.click(".review-item");
await page.waitForSelector(".choice, .type-input, .match-card");
ok("review queue appears when due and links into a game");
await page.screenshot({ path: `${SHOTS}/review-queue.png` });

// fresh context → no queue, no stray text
const fresh = await browser.newPage();
trackErrors(fresh);
await fresh.goto(`${BASE}/#/`);
await fresh.waitForSelector(".set-card");
if (await fresh.locator(".review-queue").count()) fail("review queue shown with no progress");
const freshText = await fresh.locator("#app").innerText();
if (/\bnull\b/.test(freshText)) fail("fresh home: stray null text");
await fresh.close();
ok("fresh session: no review queue, clean text");

// ---------- report ----------
await page.goto(`${BASE}/#/informe`);
await page.waitForSelector(".report-table");
if ((await page.locator(".report-table tbody tr").count()) !== 20) fail("report: expected 20 rows");
await page.emulateMedia({ media: "print" });
if (await page.locator(".crumbs").isVisible().catch(() => false)) fail("report print: nav visible");
await page.emulateMedia({ media: "screen" });
await page.screenshot({ path: `${SHOTS}/report.png` });
ok("report renders 20 rows; print media hides nav");

// ---------- TTS: hidden without a voice; speaks person + form with one ----------
const toggles = await page.locator(".sound-toggle").count();
const available = await page.evaluate(async () => (await import("./js/audio.js")).ttsAvailable());
if (!available && toggles > 0) fail("sound toggle rendered though TTS unavailable");
ok(`tts availability honest (available=${available}, toggles=${toggles})`);

const voiced = await browser.newPage();
trackErrors(voiced);
// M12: block clips here too — this context exercises the Web Speech path.
await voiced.route("**/audio/manifest.json", (r) => r.fulfill({ status: 204 }));
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
await voiced.goto(`${BASE}/#/study/1/present`);
await voiced.waitForSelector(".cell-speak");
await voiced.locator(".cell-speak").first().click();
const spoken = await voiced.evaluate(() => window.__spoken);
if (!spoken.length || spoken[0].text !== "yo soy") fail(`stub voice: expected "yo soy", got ${JSON.stringify(spoken)}`);
// match mode speaks person + form (regression: used to speak bare forms)
await voiced.goto(`${BASE}/#/play/1/present/match`);
await voiced.waitForSelector(".match-card");
await voiced.evaluate(async () => {
  window.__spoken.length = 0;
  const { SETS } = await import("./js/verbs.js");
  const { conjugate, PERSONS } = await import("./js/conjugator.js");
  const left = [...document.querySelectorAll(".match-col.left .match-card")];
  const right = [...document.querySelectorAll(".match-col.right .match-card")];
  const [personLabel, inf] = left[0].textContent.split(" · ");
  const verb = SETS[0].verbs.find((v) => v.inf === inf);
  const form = conjugate(verb, "present")[PERSONS.indexOf(personLabel)];
  left[0].click();
  right.find((x) => x.textContent === form).click();
});
const matchSpoken = await voiced.evaluate(() => window.__spoken);
const shortPersons = ["yo", "tú", "él", "nosotros", "vosotros", "ellos"];
if (!matchSpoken.length || !shortPersons.includes(matchSpoken[0].text.split(" ")[0]) || matchSpoken[0].text.split(" ").length < 2) {
  fail(`match speech: expected "person form", got ${JSON.stringify(matchSpoken)}`);
}
ok(`tts speaks person + form (study: "${spoken[0].text}", match: "${matchSpoken[0].text}")`);
// ---------- 🎧 Escucha (listen mode): voiced device ----------
await voiced.goto(`${BASE}/#/set/1`);
await voiced.waitForSelector(".listen-card");
if ((await voiced.locator(".mode-card:not(.stretch-card)").count()) !== 7) fail("escucha: voiced set screen should show 7 activity cards");
await voiced.goto(`${BASE}/#/study/1/present`);
await voiced.waitForSelector(".conj-table");
if (!(await voiced.locator(".study-actions .listen-link").count())) fail("study: voiced device must link Escucha");
await voiced.goto(`${BASE}/#/play/1/present/listen`);
await voiced.waitForSelector(".listen-controls");
if (await voiced.locator(".hint-btn").count()) fail("escucha: hint button must not exist here");
// the form is heard, never shown: no person, no blank in the prompt
if (await voiced.locator(".prompt .prompt-person").count()) fail("escucha: prompt must not show the person");
if (await voiced.locator(".prompt .prompt-main").count()) fail("escucha: prompt must not show the form");
// slow replay uses a lower rate
await voiced.locator(".listen-controls .btn", { hasText: "Despacio" }).click();
const slow = await voiced.evaluate(() => window.__spoken.at(-1));
if (slow.rate !== 0.5) fail(`escucha: 🐢 replay rate must be 0.5 (audible on all engines), got ${slow.rate}`);
const normalRate = await voiced.evaluate(() => window.__spoken.find((u) => u.rate !== 0.5)?.rate);
if (normalRate !== 0.85) fail(`escucha: normal rate should be 0.85, got ${normalRate}`);
// play all 10 by trusting our ears (the stub tells us what was spoken)
for (let q = 0; q < 10; q++) {
  await voiced.waitForSelector(".choice:not(:disabled)");
  const heard = await voiced.evaluate(() => {
    const bare = window.__spoken.filter((u) => !u.text.includes(" "));
    return bare.at(-1).text;
  });
  const opts = voiced.locator(".choice");
  const n = await opts.count();
  let clicked = false;
  for (let b = 0; b < n; b++) {
    const text = (await opts.nth(b).innerText()).replace(/^\d/, "").trim();
    if (text === heard) { await opts.nth(b).click(); clicked = true; break; }
  }
  if (!clicked) { fail(`escucha: heard "${heard}" but no matching option`); break; }
  await voiced.waitForTimeout(1050);
}
await voiced.waitForSelector(".results");
if ((await voiced.locator(".big-stars .badge.on").count()) !== 3) fail("escucha: 10/10 should award 3 🎧 badges");
ok(`escucha: full round by ear → ${(await voiced.locator(".score-line").innerText()).trim()} (3 badges)`);
await voiced.screenshot({ path: `${SHOTS}/escucha-results.png` });
// badges surface on set screen and home, outside the star totals
await voiced.goto(`${BASE}/#/set/1`);
await voiced.waitForSelector(".listen-card");
if ((await voiced.locator(".listen-card .badge.on").count()) !== 3) fail("escucha: set card should show 3 badges");
await voiced.goto(`${BASE}/#/`);
await voiced.waitForSelector(".set-card");
const g1 = await voiced.locator('.set-card[href="#/set/1"]').innerText();
if (!g1.includes("🎧 3/9")) fail(`escucha: home card should show 🎧 3/9, got "${g1.replace(/\n/g, " ")}"`);
if (!g1.includes("⭐ 0/30")) fail("escucha: badges must NOT count toward stars");
ok("escucha: badges on set + home cards, star totals untouched");

// voiceless device: direct listen route redirects to the group screen
await page.goto(`${BASE}/#/play/1/present/listen`);
await page.waitForSelector(".tense-card");
ok("escucha: voiceless direct route redirects to group screen");

// hint-panel forms are tap-to-hear on voiced devices (parity with Estudia)
await voiced.goto(`${BASE}/#/play/1/present/choice`);
await voiced.waitForSelector(".hint-btn");
await voiced.locator(".hint-btn").click();
await voiced.waitForSelector(".hint-panel:not([hidden]) .cell-speak");
const hintExpected = await voiced.evaluate(async () => {
  const { SETS } = await import("./js/verbs.js");
  const { conjugate } = await import("./js/conjugator.js");
  const inf = document.querySelector(".prompt-verb").textContent.split(" — ")[0];
  const verb = SETS[0].verbs.find((v) => v.inf === inf);
  return `yo ${conjugate(verb, "present")[0]}`;
});
await voiced.locator(".hint-panel .cell-speak").first().click();
const hintSpoken = await voiced.evaluate(() => window.__spoken.at(-1).text);
if (hintSpoken !== hintExpected) fail(`hint speak: expected "${hintExpected}", got "${hintSpoken}"`);
ok(`hint: tapping a form speaks it ("${hintSpoken}")`);

// 🧱 Práctica on a voiced device: placement speaks person + form (standard
// rules), filled cells become tap-to-hear like the Estudia table, Lola hops
await voiced.goto(`${BASE}/#/practica/1/present`);
await voiced.waitForSelector(".bank-tile");
const placeSpoken = await voiced.evaluate(async () => {
  window.__spoken.length = 0;
  const { SETS } = await import("./js/verbs.js");
  const { conjugate } = await import("./js/conjugator.js");
  const yo = conjugate(SETS[0].verbs[0], "present")[0];
  [...document.querySelectorAll(".bank-tile")].find((t) => t.textContent === yo).click();
  document.querySelector(".practica-table tbody tr .drop-slot").click();
  return { spoken: window.__spoken.map((u) => u.text), yo };
});
if (placeSpoken.spoken.at(-1) !== `yo ${placeSpoken.yo}`)
  fail(`practica speech: expected "yo ${placeSpoken.yo}", got ${JSON.stringify(placeSpoken.spoken)}`);
await voiced.waitForSelector(".match-title .lola.is-hop", { timeout: 800 });
await voiced.evaluate(() => { window.__spoken.length = 0; });
await voiced.locator(".practica-table td.filled .cell-speak").first().click();
const cellSpoken = await voiced.evaluate(() => window.__spoken.at(-1)?.text);
if (cellSpoken !== `yo ${placeSpoken.yo}`) fail(`practica cell speak: expected "yo ${placeSpoken.yo}", got "${cellSpoken}"`);
ok(`practica voiced: placement speaks "yo ${placeSpoken.yo}", filled cell replays it, Lola hops`);

// mute stops speech (🔊 toggle now lives inside the ☰ menu — owner 2026-07-08)
await voiced.goto(`${BASE}/#/study/1/present`);
await voiced.waitForSelector(".menu-btn");
await voiced.locator(".menu-btn").click();
await voiced.click(".settings-toggle"); // M30.2: sound lives under Ajustes
await voiced.waitForSelector(".menu-panel:not([hidden]) .sound-toggle");
await voiced.locator(".sound-toggle").click();
await voiced.evaluate(() => { window.__spoken.length = 0; });
await voiced.locator(".cell-speak").first().click();
if ((await voiced.evaluate(() => window.__spoken.length)) !== 0) fail("mute: spoke while muted");
ok("mute toggle silences speech");
await voiced.close();

// ---------- print: Lola hidden everywhere ----------
await page.goto(`${BASE}/#/`);
await page.waitForSelector(".lola-wrap");
await page.emulateMedia({ media: "print" });
if (await page.locator(".lola-wrap").first().isVisible()) fail("print: Lola must be hidden");
await page.emulateMedia({ media: "screen" });
ok("print: Lola hidden");

// ---------- print: study sheet gets a classroom header (M5 tune-up) ----------
await page.goto(`${BASE}/#/study/1/present`);
await page.waitForSelector(".conj-table");
if (await page.locator(".print-fields").isVisible()) fail("study: name/date header must be print-only");
await page.emulateMedia({ media: "print" });
if (!(await page.locator(".print-fields").isVisible())) fail("study print: name/date header missing");
const printHeader = await page.locator(".print-fields").innerText();
if (!/Grupo 1/.test(printHeader) || !/Nombre:/.test(printHeader) || !/Fecha:/.test(printHeader))
  fail(`study print: header incomplete — "${printHeader}"`);
const theadDisplay = await page.evaluate(() => getComputedStyle(document.querySelector(".conj-table thead")).display);
if (theadDisplay !== "table-header-group") fail(`print: thead should repeat across pages, got "${theadDisplay}"`);
await page.emulateMedia({ media: "screen" });
ok("print: study sheet shows Grupo/Nombre/Fecha header, repeating table heads");

// ---------- dark mode: Lola renders with dark palette ----------
const darkPage = await browser.newPage({ colorScheme: "dark", viewport: { width: 900, height: 900 } });
trackErrors(darkPage);
await darkPage.goto(`${BASE}/#/`);
await darkPage.waitForSelector(".home-title .lola");
// Light is the default now, so opt into Auto to let OS-dark drive the dark palette.
await darkPage.click(".menu-btn");
await darkPage.click(".settings-toggle"); // M30.2: theme lives under Ajustes
await darkPage.waitForSelector(".theme-selector");
await darkPage.click('.theme-option[data-theme-value="auto"]');
await darkPage.waitForFunction(() => !document.documentElement.hasAttribute("data-theme"));
await darkPage.keyboard.press("Escape");
await darkPage.waitForSelector(".menu-panel", { state: "hidden" });
const darkBody = await darkPage.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--lola-body").trim());
if (darkBody.toLowerCase() !== "#a8834e") fail(`dark mode: expected dark Lola body token, got "${darkBody}"`);
await darkPage.screenshot({ path: `${SHOTS}/home-dark.png` });
await darkPage.close();
ok("dark mode: Lola dark palette active");

// ---------- M16 T: theme selector (Auto / Light / Dark) ----------
{
  const themeBg = (page) => page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--bg").trim().toLowerCase());
  // Post-FLIP: the redesign (Prado) is the only look now, so every route
  // resolves the Prado palette — light day #fbf6ea, forest-night #191e17.
  // AUTO is the DEFAULT (owner 2026-07-19, reversing the 2026-07-09 Light
  // default): a fresh visitor has NO data-theme, so the OS scheme drives —
  // an OS-dark device gets forest-night out of the box.
  const def = await browser.newPage({ colorScheme: "dark" });
  trackErrors(def);
  await def.goto(`${BASE}/#/`);
  await def.waitForSelector(".set-card");
  const defAttr = await def.evaluate(() => document.documentElement.getAttribute("data-theme"));
  if (defAttr !== null) fail(`theme default Auto: data-theme should be unset by default, got "${defAttr}"`);
  const defBg = await themeBg(def);
  if (defBg !== "#191e17") fail(`theme default Auto: OS-dark should show forest-night #191e17, got "${defBg}"`);
  await def.close();

  // Auto is opt-in: selecting it clears data-theme so the OS scheme wins → forest-night.
  const auto = await browser.newPage({ colorScheme: "dark" });
  trackErrors(auto);
  await auto.goto(`${BASE}/#/`);
  await auto.waitForSelector(".set-card");
  await auto.click(".menu-btn");
  await auto.click(".settings-toggle"); // M30.2: theme lives under Ajustes
  await auto.waitForSelector(".theme-selector");
  await auto.click('.theme-option[data-theme-value="auto"]');
  await auto.waitForFunction(() => !document.documentElement.hasAttribute("data-theme"));
  const autoBg = await themeBg(auto);
  if (autoBg !== "#191e17") fail(`theme Auto: OS-dark should apply Prado forest-night #191e17, got "${autoBg}"`);
  await auto.close();

  // Light beats OS dark: pick Light in the menu, then confirm bg + persistence.
  const light = await browser.newPage({ colorScheme: "dark" });
  trackErrors(light);
  await light.goto(`${BASE}/#/`);
  await light.waitForSelector(".set-card");
  await light.click(".menu-btn");
  await light.click(".settings-toggle"); // M30.2: theme lives under Ajustes
  await light.waitForSelector(".theme-selector");
  await light.click('.theme-option[data-theme-value="light"]');
  await light.waitForFunction(() => document.documentElement.getAttribute("data-theme") === "light");
  const lightBg = await themeBg(light);
  if (lightBg !== "#fbf6ea") fail(`theme Light: should override OS-dark to Prado day #fbf6ea, got "${lightBg}"`);
  const pressedLight = await light.evaluate(() =>
    document.querySelector('.theme-option[data-theme-value="light"]').getAttribute("aria-pressed"));
  if (pressedLight !== "true") fail(`theme Light: aria-pressed should be "true", got "${pressedLight}"`);
  // Persist across reload — Esc closes the menu first (menu wiring intact).
  await light.keyboard.press("Escape");
  await light.waitForSelector(".menu-panel", { state: "hidden" });
  await light.reload();
  await light.waitForSelector(".set-card");
  const lightBgReload = await themeBg(light);
  if (lightBgReload !== "#fbf6ea") fail(`theme Light: choice did not persist across reload, got "${lightBgReload}"`);
  await light.close();

  // Dark beats OS light: pick Dark, then confirm forest-night bg.
  const dark = await browser.newPage({ colorScheme: "light" });
  trackErrors(dark);
  await dark.goto(`${BASE}/#/`);
  await dark.waitForSelector(".set-card");
  await dark.click(".menu-btn");
  await dark.click(".settings-toggle"); // M30.2: theme lives under Ajustes
  await dark.click('.theme-option[data-theme-value="dark"]');
  await dark.waitForFunction(() => document.documentElement.getAttribute("data-theme") === "dark");
  const darkBg = await themeBg(dark);
  if (darkBg !== "#191e17") fail(`theme Dark: should override OS-light to Prado forest-night #191e17, got "${darkBg}"`);
  await dark.close();

  ok("theme (post-flip, Prado only): Light default (OS-dark → day #fbf6ea, persists); Auto opt-in follows OS → forest-night #191e17; Dark beats OS-light");
}

// ---------- M17 Round 2: WCAG contrast fixes (light Prado) ----------
{
  const p = await browser.newPage({ colorScheme: "light" });
  trackErrors(p);
  await p.goto(`${BASE}/#/`);
  await p.waitForSelector(".set-card");
  // Inject one node per fixed surface and read the COMPUTED color under the
  // live Prado CSS (these states — earned ★, post-answer feedback — don't
  // render on the empty home the axe gate snapshots, so assert them directly).
  const col = await p.evaluate(() => {
    const probe = (html, sel) => {
      const w = document.createElement("div");
      w.innerHTML = html; document.body.appendChild(w);
      const c = getComputedStyle(w.querySelector(sel)).color; w.remove(); return c;
    };
    return {
      star: probe('<span class="stars"><span class="star on">★</span></span>', ".star.on"),
      good: probe('<div class="feedback good">x</div>', ".feedback.good"),
      bad: probe('<div class="feedback bad">x</div>', ".feedback.bad"),
      almost: probe('<div class="feedback almost">x</div>', ".feedback.almost"),
    };
  });
  if (col.star !== "rgb(184, 119, 15)") fail(`WCAG-6: filled ★ glyph should be --star-glyph #b8770f, got "${col.star}"`);
  if (col.good !== "rgb(31, 107, 60)") fail(`WCAG-7: .feedback.good text should be --good-ink #1f6b3c, got "${col.good}"`);
  if (col.bad !== "rgb(161, 51, 24)") fail(`WCAG-7: .feedback.bad text should be --bad-ink #a13318, got "${col.bad}"`);
  if (col.almost !== "rgb(125, 82, 0)") fail(`WCAG-7: .feedback.almost text should be --almost-ink #7d5200, got "${col.almost}"`);
  // NN-8 + WCAG-9/DN-7: theme option ≥44px touch target and a brand-border active cue.
  await p.click(".menu-btn");
  await p.click(".settings-toggle"); // M30.2: theme lives under Ajustes
  await p.waitForSelector(".theme-selector");
  const opt = await p.evaluate(() => {
    const b = document.querySelector('.theme-option[data-theme-value="light"]');
    const s = getComputedStyle(b);
    return { h: parseFloat(s.minHeight), pressed: b.getAttribute("aria-pressed"), border: s.borderTopColor, bw: s.borderTopWidth };
  });
  if (opt.h < 44) fail(`NN-8: .theme-option min-height should be ≥44px, got ${opt.h}`);
  if (opt.pressed === "true" && (opt.border !== "rgb(47, 107, 79)" || parseFloat(opt.bw) < 2))
    fail(`WCAG-9: active theme option needs a 2px --brand border, got ${opt.bw} ${opt.border}`);
  await p.close();
  ok("M17 a11y fixes: ★ glyph #b8770f (3.69:1), feedback text ink ≥4.5:1, theme options 44px + brand active border");
}

// ---------- M17 owner-decision fixes: NN-7 (line-icons everywhere) + DN-6 (imperfect badge) ----------
{
  const p = await browser.newPage({ colorScheme: "light" });
  trackErrors(p);
  // NN-7: the group card AND the h1 heading AND the Estudia action row all
  // show the SAME masked line-icon (data-icon), sized > 0 (regression guard
  // for the mode-icon re-key + the mi-inline font-size restore).
  await p.goto(`${BASE}/#/set/1`);
  await p.waitForSelector('.mode-card[data-mode="study"] .mode-icon[data-icon="study"]');
  const iconOK = (sel) => p.evaluate((s) => {
    const el = document.querySelector(s); if (!el) return { w: 0, mask: "none" };
    const cs = getComputedStyle(el);
    return { w: parseFloat(cs.width), mask: cs.maskImage || cs.webkitMaskImage || "none" };
  }, sel);
  const card = await iconOK('.mode-card[data-mode="study"] .mode-icon[data-icon="study"]');
  if (card.w < 8 || card.mask === "none") fail(`NN-7: group-card study icon lost its mask after re-key (w=${card.w})`);
  await p.goto(`${BASE}/#/study/1/present`);
  await p.waitForSelector("h1 .mode-icon.mi-inline[data-icon='study']");
  const head = await iconOK("h1 .mode-icon.mi-inline[data-icon='study']");
  if (head.w < 8 || head.mask === "none") fail(`NN-7: heading line-icon not rendering (w=${head.w}, mask=${head.mask})`);
  const actionIcons = await p.locator(".study-actions .mode-icon.mi-inline").count();
  if (actionIcons < 4) fail(`NN-7: expected ≥4 line-icons in the Estudia action row, got ${actionIcons}`);
  await p.close();

  // DN-6: the imperfect tense badge is now WHITE text on the darkened green
  // #1f7a45 (5.35:1); present/preterite keep dark text (verified elsewhere).
  const q = await browser.newPage({ colorScheme: "light" });
  trackErrors(q);
  await q.goto(`${BASE}/#/play/1/imperfect/choice`);
  await q.waitForSelector('.prompt-tense[data-tense="imperfect"]');
  const badge = await q.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('.prompt-tense[data-tense="imperfect"]'));
    return { color: cs.color, bg: cs.backgroundColor };
  });
  if (badge.color !== "rgb(255, 255, 255)") fail(`DN-6: imperfect badge text should be white, got ${badge.color}`);
  if (badge.bg !== "rgb(31, 122, 69)") fail(`DN-6: imperfect badge bg should be #1f7a45, got ${badge.bg}`);
  await q.close();
  ok("M17 owner fixes: NN-7 line-icons on card+heading+action row; DN-6 imperfect badge white-on-#1f7a45");
}

// ---------- mobile 360×640: no overflow, perch inside viewport ----------
const mob = await browser.newPage({ viewport: { width: 360, height: 640 } });
trackErrors(mob);
await mob.goto(`${BASE}/#/play/1/present/choice`);
await mob.waitForSelector(".play-lola .lola");
const overflow = await mob.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
if (overflow) fail("mobile: horizontal overflow on play screen");
const box = await mob.locator(".play-lola").boundingBox();
if (!box || box.x < 0 || box.x + box.width > 360) fail(`mobile: perch out of viewport (${JSON.stringify(box)})`);
await mob.screenshot({ path: `${SHOTS}/play-mobile.png` });
await mob.close();
ok("mobile 360px: no overflow, Lola perch in view");

// ---------- reduced motion: Lola must be static ----------
const rmPage = await browser.newPage({ reducedMotion: "reduce" });
trackErrors(rmPage);
await rmPage.goto(`${BASE}/#/`);
await rmPage.waitForSelector(".lola.is-idle");
const anim = await rmPage.evaluate(() => getComputedStyle(document.querySelector(".lola.is-idle")).animationName);
if (anim !== "none") fail(`reduced motion: idle animation should be none, got "${anim}"`);
await rmPage.close();
ok("reduced motion: Lola idle is static");

// ---------- 🔍 M7 hint mode (Pistas) ----------
await page.goto(`${BASE}/#/play/1/present/choice`);
await page.reload();
await page.waitForSelector(".choice");
await page.waitForSelector(".hint-btn"); // default ON
{
  await page.locator(".hint-btn").click();
  await page.waitForSelector(".hint-panel:not([hidden])");
  if (!(await page.locator(".play-lola .lola.is-hint").count())) fail("hint: Lola should raise her magnifying glass");
  // the column must match the engine exactly for the verb in play
  const colOk = await page.evaluate(async () => {
    const { SETS } = await import("./js/verbs.js");
    const { conjugate, PERSONS } = await import("./js/conjugator.js");
    const inf = document.querySelector(".prompt-verb").textContent.split(" — ")[0];
    const verb = SETS[0].verbs.find((v) => v.inf === inf);
    const want = [0, 1, 2, 3, 5].map((p) => conjugate(verb, "present")[p]);
    const got = [...document.querySelectorAll(".hint-table tbody td")].map((td) => td.textContent);
    return JSON.stringify(want) === JSON.stringify(got) || `want ${want} got ${got}`;
  });
  if (colOk !== true) fail(`hint: column mismatch — ${colOk}`);
  // second tap closes it and Lola relaxes
  await page.locator(".hint-btn").click();
  if (await page.locator(".hint-panel:not([hidden])").count()) fail("hint: second tap should close the panel");
  if (await page.locator(".play-lola .lola.is-hint").count()) fail("hint: Lola should lower the lens on close");
  // open again, answer, and the next question must start hint-closed
  await page.locator(".hint-btn").click();
  await page.locator(".choice").first().click();
  try { await page.locator(".feedback.bad button").click({ timeout: 400 }); } catch {}
  await page.waitForTimeout(1100);
  if (await page.locator(".hint-panel:not([hidden])").count()) fail("hint: panel must reset on question advance");
  ok("hint: 🔍 shows the engine-correct column, Lola investigates, panel resets");
}
// hint cells are plain text without a voice (no dead buttons)
if (await page.locator(".hint-panel .cell-speak").count()) fail("hint: voiceless devices must not render speak buttons");

// contrast: hint shows BOTH past columns
await page.goto(`${BASE}/#/play/1/contrast`);
await page.waitForSelector(".hint-btn");
await page.locator(".hint-btn").click();
await page.waitForSelector(".hint-panel:not([hidden])");
if ((await page.locator(".hint-table").count()) !== 2) fail("hint: contrast should show two past-tense columns");
ok("hint: contrast reveals both past columns (tense choice stays the task)");
// footer toggle OFF hides hints everywhere; back ON restores
await page.goto(`${BASE}/#/`);
await page.waitForSelector(".hints-toggle");
await page.locator(".hints-toggle").uncheck();
await page.goto(`${BASE}/#/play/1/present/type`);
await page.waitForSelector(".type-input");
if (await page.locator(".hint-btn").count()) fail("hint: toggle OFF must remove hint buttons");
await page.goto(`${BASE}/#/`);
await page.locator(".hints-toggle").check();
await page.goto(`${BASE}/#/play/1/present/type`);
await page.waitForSelector(".hint-btn");
ok("hint: footer toggle hides and restores hints (default checked)");

// ---------- 🧱 M8 Práctica: unscored table rebuild ----------
await page.goto(`${BASE}/#/study/1/present`);
await page.reload();
await page.waitForSelector(".study-actions");
if (!(await page.locator(".study-actions .practica-link").count())) fail("practica: study screen must link Práctica");
await page.goto(`${BASE}/#/set/1`);
await page.waitForSelector(".practica-card");
const beforeStore = await page.evaluate(() => localStorage.getItem("conjuga.v1"));
await page.goto(`${BASE}/#/practica/1/present`);
await page.waitForSelector(".bank-tile");
// voiceless: the activity still works, with zero audio affordances
if (await page.locator(".cell-speak").count()) fail("practica: voiceless device must not render speak buttons");
if ((await page.locator(".drop-slot").count()) !== 5) fail("practica: active column should show 5 empty slots (vosotros off)");
if ((await page.locator(".bank-tile").count()) !== 5) fail("practica: bank should hold 5 tiles");
// wrong placement: corrective, non-punitive, tile not consumed
{
  const wrong = await page.evaluate(async () => {
    const { SETS } = await import("./js/verbs.js");
    const { conjugate } = await import("./js/conjugator.js");
    const yo = conjugate(SETS[0].verbs[0], "present")[0];
    return [...document.querySelectorAll(".bank-tile")].find((t) => t.textContent !== yo).textContent;
  });
  const exact = (t) => new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
  const wrongTile = page.locator(".bank-tile").filter({ hasText: exact(wrong) }).first();
  await wrongTile.click();
  await page.locator(".practica-table tbody tr").first().locator(".drop-slot").click();
  await page.waitForSelector(".feedback.bad");
  if (!(await page.locator(".match-title .lola.is-curious").count())) fail("practica: Lola should be curious on a miss, never negative");
  if ((await page.locator(".bank-tile").count()) !== 5) fail("practica: wrong placement must not consume the tile");
  if (await page.locator(".practica-table td.filled").count()) fail("practica: wrong placement must not fill the cell");
  await wrongTile.click(); // deselect before the scripted solve
}
// full rebuild: all 5 columns, word by word, driven by the engine
const solvedPractica = await page.evaluate(async () => {
  const { SETS } = await import("./js/verbs.js");
  const { conjugate } = await import("./js/conjugator.js");
  const persons = [0, 1, 2, 3, 5];
  for (let vi = 0; vi < 5; vi++) {
    const verb = SETS[0].verbs[vi];
    for (let ri = 0; ri < persons.length; ri++) {
      const form = conjugate(verb, "present")[persons[ri]];
      const tile = [...document.querySelectorAll(".bank-tile")].find((t) => t.textContent === form);
      if (!tile) return `no tile for ${verb.inf} → ${form}`;
      if (!tile.classList.contains("picked")) tile.click();
      const slot = document.querySelectorAll(".practica-table tbody tr")[ri].querySelector(".drop-slot");
      if (!slot) return `no slot at row ${ri} for ${verb.inf}`;
      slot.click();
      await new Promise((r) => setTimeout(r, 15));
    }
  }
  return "ok";
});
if (solvedPractica !== "ok") fail(`practica: ${solvedPractica}`);
await page.waitForSelector(".practica-done");
if (!(await page.locator(".match-title .lola.is-celebrate").count())) fail("practica: Lola should celebrate the finished table");
// the rebuilt table must equal the engine's, cell by cell
const gridOk = await page.evaluate(async () => {
  const { SETS } = await import("./js/verbs.js");
  const { conjugate } = await import("./js/conjugator.js");
  const persons = [0, 1, 2, 3, 5];
  const rows = [...document.querySelectorAll(".practica-table tbody tr")];
  for (let ri = 0; ri < rows.length; ri++) {
    const tds = [...rows[ri].querySelectorAll("td")];
    for (let vi = 0; vi < 5; vi++) {
      const want = conjugate(SETS[0].verbs[vi], "present")[persons[ri]];
      if (tds[vi].textContent !== want) return `cell r${ri}v${vi}: want "${want}" got "${tds[vi].textContent}"`;
    }
  }
  return true;
});
if (gridOk !== true) fail(`practica: rebuilt table mismatch — ${gridOk}`);
// unscored, truly: completing the whole table writes NOTHING
const afterStore = await page.evaluate(() => localStorage.getItem("conjuga.v1"));
if (afterStore !== beforeStore) fail("practica: must not record any progress (stars, badges, or otherwise)");
ok("practica: full table rebuild, corrective retry, celebration, nothing recorded");

// ---------- 2026-07-16 bug sweep: Reto dark-pill, Práctica scroll+sticky-hover ----------
{
  // Reto (⚔️ contrast): the 🕐 time-cue chip has no data-tense (would leak the
  // answer), so it must carry its OWN theme-aware background — regression
  // check for the "dark text on dark card" report.
  const reto = await browser.newPage();
  trackErrors(reto);
  await reto.addInitScript(() =>
    localStorage.setItem("conjuga.v1", JSON.stringify({ settings: { theme: "dark" }, best: {} })));
  await reto.goto(`${BASE}/#/play/1/contrast`);
  await reto.waitForSelector(".cue-chip");
  const chip = await reto.evaluate(() => {
    const c = document.querySelector(".cue-chip");
    const s = getComputedStyle(c);
    return { bg: s.backgroundColor, color: s.color, hasDataTense: c.hasAttribute("data-tense") };
  });
  if (chip.hasDataTense) fail("reto cue-chip: must never carry data-tense (would leak the answer's tense)");
  if (chip.bg === "rgba(0, 0, 0, 0)" || chip.bg === "transparent")
    fail(`reto cue-chip (dark theme): no background — falls through to the card, unreadable (bg=${chip.bg})`);
  if (chip.color === chip.bg) fail("reto cue-chip: text color matches background");
  await reto.close();
  ok("bug sweep: Reto cue-chip has its own readable background in dark theme, still reveals no tense");

  // Práctica: table must genuinely wheel-scroll (not just accept scrollLeft=n
  // programmatically — see the M13 test fix above for why that check alone
  // is insufficient) so the hidden columns are actually reachable.
  const scroll = await browser.newPage({ viewport: { width: 360, height: 640 } });
  trackErrors(scroll);
  await scroll.goto(`${BASE}/#/practica/1/present`);
  await scroll.waitForSelector(".conj-table tbody th");
  const overflowX = await scroll.evaluate(() => getComputedStyle(document.querySelector(".table-scroll")).overflowX);
  if (overflowX === "hidden") fail("practica: overflow-x:hidden blocks horizontal scroll to the other verb columns");
  const box = await scroll.locator(".table-scroll").boundingBox();
  await scroll.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await scroll.mouse.wheel(300, 0);
  await scroll.waitForTimeout(80);
  const scrolled = await scroll.evaluate(() => document.querySelector(".table-scroll").scrollLeft);
  if (scrolled < 100) fail(`practica: wheel gesture did not scroll the table (scrollLeft=${scrolled})`);
  await scroll.close();
  ok("bug sweep: Práctica table genuinely wheel-scrolls to reveal the other verb columns");

  // Práctica bank: removing a placed tile reflows its siblings — one can
  // land under a touch-parked pointer. suppressHover(bankWrap) is re-armed
  // on every removal AND the CSS neutralizer must actually exist (it didn't).
  // Methodology note: page.hover() itself fires the pointermove that clears
  // this guard, so it CANNOT be used to test it — park via mouse.move once,
  // then mutate the DOM without further real pointer movement (JS .click()).
  const bank = await browser.newPage();
  trackErrors(bank);
  await bank.goto(`${BASE}/#/practica/1/present`);
  await bank.waitForSelector(".bank-tile");
  const bankBox = await bank.locator(".practica-bank").boundingBox();
  const cx = bankBox.x + bankBox.width / 2, cy = bankBox.y + bankBox.height / 2;
  await bank.mouse.move(cx, cy);
  await bank.waitForTimeout(50);
  const placed = await bank.evaluate(async () => {
    const { SETS } = await import("./js/verbs.js");
    const { conjugate } = await import("./js/conjugator.js");
    const tile0 = document.querySelectorAll(".bank-tile")[0];
    const form = tile0.textContent;
    tile0.click();
    const verb = SETS[0].verbs[0];
    const forms = conjugate(verb, "present");
    let logicalPerson = -1;
    for (let i = 0; i < 6; i++) if (forms[i] === form) logicalPerson = i;
    // BUG FIX (2026-07-17): drop-slots render only for ACTIVE persons
    // (vosotros off by default → [0,1,2,3,5], 5 slots, not 6), so the
    // logical person index is NOT a valid direct array index into that
    // compacted NodeList — using it raw silently no-ops for any form
    // mapped to person 5 (ellos/ustedes), leaving the tile un-removed and
    // making this test observe ordinary correct hover, not a phantom one.
    // Map through the same active-persons list the app itself builds.
    const activePersons = [0, 1, 2, 3, 4, 5].filter((x) => x !== 4);
    const domIndex = activePersons.indexOf(logicalPerson);
    const before = document.querySelectorAll(".bank-tile").length;
    document.querySelectorAll(".drop-slot")[domIndex]?.click();
    return before - document.querySelectorAll(".bank-tile").length;
  });
  if (placed !== 1) fail(`practica bank: tile removal setup failed (removed ${placed}, expected 1) — test precondition broken`);
  await bank.waitForTimeout(500);
  const afterRemoval = await bank.evaluate(([x, y]) => {
    const el = document.elementFromPoint(x, y)?.closest(".bank-tile");
    return { hovering: document.querySelectorAll(".bank-tile:hover").length > 0, border: el ? getComputedStyle(el).borderTopColor : null };
  }, [cx, cy]);
  // if the reflow happened to leave no tile under the point, there's nothing
  // to assert — only check when the browser's own :hover truly matches
  if (afterRemoval.hovering && afterRemoval.border !== "rgba(0, 0, 0, 0)")
    fail(`practica bank: reflowed tile under a touch-parked pointer shows a phantom hover border (${afterRemoval.border})`);
  await bank.close();
  ok("bug sweep: Práctica bank tiles never show a phantom hover border after a sibling is removed");
}
await page.screenshot({ path: `${SHOTS}/practica-done.png` });

// ---------- 🪟 M9 F1-F3: footer on every screen, standards links, credits ----------
{
  const ROUTES = ["#/", "#/set/1", "#/study/1/present", "#/practica/1/present",
    "#/play/1/present/choice", "#/play/1/present/type", "#/play/1/present/match",
    "#/play/1/contrast", "#/informe"];
  for (const r of ROUTES) {
    await page.goto(`${BASE}/${r}`);
    await page.reload();
    await page.waitForSelector(".site-footer", { timeout: 4000 }).catch(() => fail(`footer: missing on ${r}`));
    const credits = await page.locator(".footer-credits").innerText().catch(() => "");
    if (!credits.includes("Lucia Perales, EdD") || !credits.includes("Aaron Soto, MHCID"))
      fail(`footer: creator credits missing on ${r}`);
    if (!credits.includes("“A1”") || !credits.includes("“A2”")) fail(`footer: consultant credits missing on ${r}`);
    if ((await page.locator(".footer-std").count()) !== 2) fail(`footer: expected 2 standards links on ${r}`);
    if (!(await page.locator(".footer-docs").count())) fail(`footer: docs link missing on ${r}`);
  }
  const hrefs = await page.locator(".footer-std").evaluateAll((as) => as.map((a) => [a.href, a.rel]));
  // national-only standards (owner, 2026-07-08): NBPTS first, then NCSSFL-ACTFL
  if (!hrefs[0][0].includes("nbpts.org")) fail("footer: NBPTS must come first");
  if (!hrefs.some(([h]) => h.includes("actfl.org") && h.includes("Can-Do"))) fail("footer: NCSSFL-ACTFL Can-Do link missing");
  if (hrefs.some(([h]) => h.includes("nj.gov"))) fail("footer: state-specific standards must not be linked");
  if (hrefs.some(([, rel]) => !rel.includes("noopener"))) fail("footer: standards links need rel=noopener");
  const siteName = await page.locator(".footer-site").first().innerText();
  if (siteName !== "Dual-Language Immersion (DLI) Skills") fail(`footer: site name wrong — "${siteName}"`);
  // home shows the DLIskills.com brand line with exact capitalization
  await page.goto(`${BASE}/#/`);
  await page.reload();
  await page.waitForSelector(".brand-sub");
  const brand = await page.locator(".brand-sub").innerText();
  if (brand !== "part of DLIskills.com") fail(`brand: expected "part of DLIskills.com", got "${brand}"`);
  // about.html: national-only standards, no GitHub link (owner, 2026-07-08)
  const aboutHtml = await page.evaluate(async () => (await fetch("about.html")).text());
  if (/NJSLS|nj\.gov/.test(aboutHtml)) fail("about: state-specific standards must be gone");
  if (/github\.com/.test(aboutHtml)) fail("about: GitHub link must be removed");
  if (!aboutHtml.includes("National Council of State Supervisors for Languages")) fail("about: NCSSFL must be spelled out");
  if (!aboutHtml.includes("American Council on the Teaching of Foreign Languages")) fail("about: ACTFL must be spelled out");
  // results screen gets the footer too
  await page.goto(`${BASE}/#/play/1/present/match`);
  await page.reload();
  await page.waitForSelector(".match-card");
  await page.evaluate(async () => {
    const { SETS } = await import("./js/verbs.js");
    const { conjugate, PERSONS } = await import("./js/conjugator.js");
    for (const l of document.querySelectorAll(".match-col.left .match-card")) {
      const [personLabel, inf] = l.textContent.split(" · ");
      const verb = SETS[0].verbs.find((v) => v.inf === inf);
      const form = conjugate(verb, "present")[PERSONS.indexOf(personLabel)];
      l.click();
      [...document.querySelectorAll(".match-col.right .match-card")].find((x) => x.textContent === form && !x.disabled).click();
      await new Promise((res) => setTimeout(res, 30));
    }
  });
  await page.waitForSelector(".results");
  if (!(await page.locator(".site-footer").count())) fail("footer: missing on results screen");
  ok("footer: every screen carries controls, standards links (noopener), and credits");
}

// ---------- ℹ️ M9 I1/I2: per-screen standards panels ----------
{
  const ROUTES = ["#/study/1/present", "#/practica/1/present",
    "#/play/1/present/choice", "#/play/1/present/type", "#/play/1/present/match",
    "#/play/1/contrast", "#/informe"];
  for (const r of ROUTES) {
    await page.goto(`${BASE}/${r}`);
    await page.reload();
    await page.waitForSelector(".info-btn", { timeout: 4000 }).catch(() => fail(`info: ℹ️ button missing on ${r}`));
  }
  // owner (2026-07-08): ℹ️ sits next to headings/quiz cards — and is GONE
  // from the home and group screens
  for (const r of ["#/", "#/set/1"]) {
    await page.goto(`${BASE}/${r}`);
    await page.reload();
    await page.waitForSelector(".menu-btn");
    if (await page.locator(".info-btn").count()) fail(`info: ℹ️ must not render on ${r}`);
  }
  // placement: inside the h1 on study, inside the prompt card on quizzes
  await page.goto(`${BASE}/#/study/1/present`);
  await page.reload();
  if (!(await page.locator("h1 .info-btn").count())) fail("info: study ℹ️ should sit in the heading");
  await page.goto(`${BASE}/#/play/1/present/choice`);
  await page.reload();
  await page.waitForSelector(".choice");
  if (!(await page.locator(".prompt .info-btn").count())) fail("info: quiz ℹ️ should sit on the prompt card");
  // open on the study screen: dialog semantics, content, Esc closes, focus returns
  await page.goto(`${BASE}/#/study/1/present`);
  await page.reload();
  await page.waitForSelector(".info-btn");
  await page.locator(".info-btn").click();
  await page.waitForSelector('.info-panel[role="dialog"]');
  const kid = await page.locator(".info-kid").innerText();
  if (!kid.includes("tabla")) fail(`info: study kid-line wrong — "${kid}"`);
  const cites = await page.locator(".info-cites").innerText();
  if (!/Novice|NBPTS/.test(cites)) fail(`info: study panel must cite NCSSFL-ACTFL levels or NBPTS — "${cites}"`);
  const focused = await page.evaluate(() => document.activeElement?.className);
  if (focused !== "info-close") fail(`info: focus should land on close, got "${focused}"`);
  await page.keyboard.press("Escape");
  if (await page.locator(".info-panel").count()) fail("info: Esc must close the panel");
  const focusBack = await page.evaluate(() => document.activeElement?.classList?.contains("info-btn"));
  if (!focusBack) fail("info: focus must return to the ℹ️ button on close");
  // per-screen content: the listen panel differs from the study panel
  await page.goto(`${BASE}/#/play/1/present/choice`);
  await page.reload();
  await page.waitForSelector(".info-btn");
  await page.locator(".info-btn").click();
  const kidChoice = await page.locator(".info-kid").innerText();
  if (kidChoice === kid) fail("info: panels must be per-screen, not shared copy");
  await page.locator(".info-close").click();
  if (await page.locator(".info-panel").count()) fail("info: ✕ must close the panel");
  ok("info: ℹ️ on all screens; dialog focus/Esc behavior; per-screen cited content");
}

// ---------- M10 fix wave: titles, skip link, lang parts, contrast tokens ----------
{
  await page.goto(`${BASE}/#/study/2/preterite`);
  await page.reload();
  await page.waitForSelector(".conj-table");
  const t1 = await page.title();
  if (!/Grupo 2/.test(t1) || !/Pretérito/i.test(t1)) fail(`title: study route title wrong — "${t1}"`);
  await page.goto(`${BASE}/#/`);
  const t2 = await page.title();
  if (t1 === t2) fail("title: routes must have distinct titles (WCAG 2.4.2)");
  // skip link: first Tab reveals it; activating focuses main content
  await page.keyboard.press("Tab");
  const skipFocused = await page.evaluate(() => document.activeElement?.id === "skip");
  if (!skipFocused) fail("skip: first Tab should land on the skip link");
  await page.keyboard.press("Enter");
  const mainFocused = await page.evaluate(() => document.activeElement?.id === "app");
  if (!mainFocused) fail("skip: activating must focus #app");
  const hashAfter = await page.evaluate(() => location.hash);
  if (hashAfter === "#app") fail("skip: must not disturb the hash router");
  // lang parts: English support copy is marked lang=en
  await page.goto(`${BASE}/#/set/1`);
  await page.waitForSelector(".mode-en");
  for (const sel of [".mode-en", ".h-en", ".footer-credits"]) {
    const lang = await page.locator(sel).first().getAttribute("lang");
    if (lang !== "en") fail(`lang: ${sel} must carry lang="en" (WCAG 3.1.2), got "${lang}"`);
  }
  // contrast tokens: credits no longer translucent; post-flip the Prado
  // amber --star (#e0982f light) is the token in play.
  const creditsOpacity = await page.evaluate(() => getComputedStyle(document.querySelector(".footer-credits")).opacity);
  if (creditsOpacity !== "1") fail(`contrast: footer credits must not be translucent, opacity=${creditsOpacity}`);
  const starTok = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--star").trim());
  if (!starTok.startsWith("#e0982f")) fail(`contrast: light --star should be Prado #e0982f, got "${starTok}"`);
  const darkStar = await browser.newPage({ colorScheme: "dark" });
  trackErrors(darkStar);
  await darkStar.goto(`${BASE}/#/`);
  await darkStar.waitForSelector(".set-card");
  // Light is the default now — opt into Auto so OS-dark yields the dark --star.
  await darkStar.click(".menu-btn");
  await darkStar.click(".settings-toggle"); // M30.2: theme lives under Ajustes
  await darkStar.waitForSelector(".theme-selector");
  await darkStar.click('.theme-option[data-theme-value="auto"]');
  await darkStar.waitForFunction(() => !document.documentElement.hasAttribute("data-theme"));
  const starDark = await darkStar.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--star").trim());
  if (!starDark.startsWith("#f3b750")) fail(`contrast: dark --star should be Prado #f3b750, got "${starDark}"`);
  await darkStar.close();
  ok("fix wave: per-route titles, skip link, lang=en parts, contrast tokens");
}

// ---------- /docs public pages (M10 P+D) ----------
{
  const docs = await browser.newPage();
  trackErrors(docs);
  await docs.goto(`${BASE}/docs/`);
  const dTitle = await docs.title();
  if (!/Documentación/.test(dTitle)) fail(`docs hub: bad title "${dTitle}"`);
  for (const frag of ["Cómo usar", "Estándares DLI", "Usabilidad y accesibilidad"]) {
    if (!(await docs.getByRole("heading", { name: new RegExp(frag) }).count())) fail(`docs hub: missing section "${frag}"`);
  }
  // every relative link on the hub must resolve (app, about, reports, usability)
  const rel = await docs.evaluate(() =>
    [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("http")));
  for (const href of rel) {
    const status = await docs.evaluate(async (u) => (await fetch(u)).status, href);
    if (status !== 200) fail(`docs hub: relative link ${href} → HTTP ${status}`);
  }
  await docs.goto(`${BASE}/docs/usability.html`);
  if (!(await docs.getByRole("heading", { name: /Usability & Accessibility/ }).count())) fail("usability page: h1 missing");
  if ((await docs.locator("td.fixed").count()) < 7) fail("usability page: expected ≥7 FIXED findings");
  // Round 2 may leave design-DECISION items open for the owner; each pending
  // cell must say "owner" so a stray unresolved finding can't hide here.
  const pending = await docs.locator("td.pending").allInnerTexts();
  const stray = pending.filter((t) => !/owner/i.test(t));
  if (stray.length) fail(`usability page: non-owner finding still pending: ${stray.join(" | ")}`);
  if (pending.length > 2) fail(`usability page: ${pending.length} pending findings (expected ≤2 owner-decision)`);
  await docs.close();
  ok("docs: hub + usability page render; all sections, statuses, and relative links OK");
}

// ---------- axe-core automated a11y gate (M10 V/RT): zero critical/serious ----------
{
  // axe-core is vendored (tests/e2e/vendor/, MPL-2.0 banner retained):
  // deterministic + offline, and `npm i --no-save axe-core` mid-run would
  // PRUNE playwright from node_modules (no-deps package.json). Test-only
  // tooling — never an app dependency, never in the payload budget.
  const { readFileSync } = await import("node:fs");
  let axeSource = null;
  try {
    axeSource = readFileSync(join(ROOT, "tests/e2e/vendor/axe.min.js"), "utf8");
  } catch (e) {
    fail(`axe: vendored axe.min.js missing — ${e.message}`);
  }
  if (axeSource) {
    const axePage = await browser.newPage();
    trackErrors(axePage);
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
    // M30.3: sweep grew — teacher/offline routes join the route list.
    for (const r of ["#/", "#/set/1", "#/study/1/present", "#/practica/1/present", "#/play/1/present/choice", "#/play/1/contrast", "#/informe", "#/descargas", "#/pack/1", "#/study/1/nearfuture"]) {
      await axePage.goto(`${BASE}/${r}`);
      await axePage.reload();
      await axePage.waitForSelector(".site-footer");
      await runAxe(r);
    }
    // M30.3: interactive STATES of the new menu — open, settings
    // expanded, and the install dialog — must also be clean.
    await axePage.goto(`${BASE}/#/`);
    await axePage.reload();
    await axePage.waitForSelector(".site-footer");
    await axePage.click(".menu-btn");
    await axePage.waitForSelector(".menu-panel:not([hidden])");
    await runAxe("menu-open");
    await axePage.click(".settings-toggle");
    await axePage.waitForSelector(".menu-settings:not([hidden])");
    await runAxe("menu-settings-expanded");
    await axePage.click(".menu-panel .install-link");
    await axePage.waitForSelector(".install-panel");
    await runAxe("install-dialog");
    await axePage.keyboard.press("Escape");
    // M30.4: the STATIC pages carry the shared drawer now — scan them too.
    for (const staticPage of ["about.html", "docs/"]) {
      await axePage.goto(`${BASE}/${staticPage}`);
      await axePage.waitForSelector(".static-nav .menu-btn");
      await runAxe(staticPage);
      await axePage.click(".menu-btn");
      await axePage.waitForSelector(".menu-panel:not([hidden])");
      await runAxe(`${staticPage} menu-open`);
    }
    await axePage.close();
    ok("axe-core: zero critical/serious violations across 12 pages + menu/dialog states");
  }
}

// ---------- M10 triage fixes: NN-1 defer-not-restart, NN-3 start-here ribbon ----------
{
  // NN-3: a fresh learner sees exactly one ribbon, on Grupo 1
  const freshHome = await browser.newPage();
  trackErrors(freshHome);
  await freshHome.goto(`${BASE}/#/`);
  await freshHome.waitForSelector(".set-card");
  if ((await freshHome.locator(".start-here").count()) !== 1) fail("ribbon: fresh home should show exactly one ribbon");
  const freshTarget = await freshHome.locator(".set-card:has(.start-here)").getAttribute("href");
  if (freshTarget !== "#/set/1") fail(`ribbon: fresh learner should start at Grupo 1, got ${freshTarget}`);
  // placement: the pill must sit fully INSIDE its card at any viewport
  // (regression: an absolute top:-10px overhang rendered differently per
  // device — owner report 2026-07-08)
  for (const vp of [{ width: 1100, height: 600 }, { width: 360, height: 640 }]) {
    await freshHome.setViewportSize(vp);
    await freshHome.waitForTimeout(60);
    const card = await freshHome.locator(".set-card:has(.start-here)").boundingBox();
    const pill = await freshHome.locator(".start-here").boundingBox();
    if (!card || !pill || pill.x < card.x || pill.y < card.y ||
        pill.x + pill.width > card.x + card.width + 1 || pill.y + pill.height > card.y + card.height + 1)
      fail(`ribbon: pill outside its card at ${vp.width}px (card ${JSON.stringify(card)}, pill ${JSON.stringify(pill)})`);
  }
  await freshHome.close();
  // this context has Grupo-1 progress → the ribbon moves to Grupo 2
  await page.goto(`${BASE}/#/`);
  await page.reload();
  await page.waitForSelector(".set-card");
  const seasonedTarget = await page.locator(".set-card:has(.start-here)").getAttribute("href");
  if (seasonedTarget !== "#/set/2") fail(`ribbon: with Grupo 1 played it should point at Grupo 2, got ${seasonedTarget}`);
  // NN-1: toggling a footer setting mid-round saves without restarting
  await page.goto(`${BASE}/#/play/1/present/choice`);
  await page.reload();
  await page.waitForSelector(".choice");
  await page.locator(".choice").first().click();
  try { await page.locator(".feedback.bad button").click({ timeout: 400 }); } catch {}
  await page.waitForTimeout(1100);
  const progressBefore = await page.locator(".progress-text").innerText();
  if (!progressBefore.startsWith("2 /")) fail(`nn1: expected to be at question 2, got "${progressBefore}"`);
  await page.locator(".hints-toggle").uncheck();
  await page.waitForSelector(".footer-applied:not([hidden])");
  const progressAfter = await page.locator(".progress-text").innerText();
  if (progressAfter !== progressBefore) fail(`nn1: round restarted (${progressBefore} → ${progressAfter})`);
  // the saved setting takes effect on the NEXT question
  await page.locator(".choice:not(:disabled)").first().click();
  try { await page.locator(".feedback.bad button").click({ timeout: 400 }); } catch {}
  await page.waitForTimeout(1100);
  if (await page.locator(".hint-btn").count()) fail("nn1: hints-off must apply on the next question");
  // off-round screens still re-render immediately (study table gains vosotros row)
  await page.goto(`${BASE}/#/study/1/present`);
  await page.reload();
  await page.waitForSelector(".conj-table");
  await page.locator(".footer-top .toggle input").nth(1).check();
  await page.waitForSelector(".conj-table tbody tr:nth-child(6)");
  await page.locator(".footer-top .toggle input").nth(1).uncheck();
  await page.waitForSelector(".conj-table");
  if ((await page.locator(".conj-table tbody tr").count()) !== 5) fail("nn1: off-round toggle should re-render immediately");
  await page.goto(`${BASE}/#/`);
  await page.locator(".hints-toggle").check();
  ok("triage fixes: mid-round toggles defer (no restart); start-here ribbon tracks progress");
}

// ---------- set screen activity grid: 3-up desktop, 2-up small phones ----------
{
  const tracks = async (p, sel) =>
    (await p.evaluate((s) => getComputedStyle(document.querySelector(s)).gridTemplateColumns, sel))
      .split(" ").filter(Boolean).length;
  await page.goto(`${BASE}/#/set/1`);
  await page.reload();
  await page.waitForSelector(".mode-card");
  if ((await tracks(page, ".mode-row")) !== 3) fail("grid: desktop activities should sit in 3 columns");
  if ((await tracks(page, ".contrast-row")) !== 1) fail("grid: reto card should keep a full-width row");
  const phone = await browser.newPage({ viewport: { width: 360, height: 640 } });
  trackErrors(phone);
  await phone.goto(`${BASE}/#/set/1`);
  await phone.waitForSelector(".mode-card");
  if ((await tracks(phone, ".mode-row")) !== 2) fail("grid: small phones should show 2 columns (3 rows of 2)");
  const phoneOverflow = await phone.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (phoneOverflow) fail("grid: 360px set screen must not overflow horizontally");
  await phone.close();
  ok("set grid: 3 columns on desktop, 2 on small phones, reto full-width");
}

// ---------- ☰ site menu: on every screen, unintrusive top-right ----------
{
  for (const r of ["#/", "#/set/1", "#/study/1/present", "#/practica/1/present", "#/play/1/present/choice", "#/informe"]) {
    await page.goto(`${BASE}/${r}`);
    await page.reload();
    await page.waitForSelector(".menu-btn", { timeout: 4000 }).catch(() => fail(`menu: ☰ missing on ${r}`));
  }
  await page.goto(`${BASE}/#/study/1/present`);
  await page.reload();
  await page.waitForSelector(".menu-btn");
  await page.locator(".menu-btn").click();
  await page.waitForSelector(".menu-panel:not([hidden])");
  const menuHrefs = await page.locator(".menu-link").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  for (const want of ["#/", "#/informe", "about.html", "docs/"]) {
    if (!menuHrefs.includes(want)) fail(`menu: missing link ${want} (got ${menuHrefs})`);
  }
  // M30.2: text-only rows (owner: no icons) + the Ajustes group present
  const menuText = await page.locator(".menu-panel").innerText();
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(menuText)) fail(`menu: icon glyphs remain in rows: ${menuText}`);
  if (!(await page.locator(".menu-panel .settings-toggle").count())) fail("menu: Ajustes/Settings group missing");
  // first link receives focus; Esc closes and returns focus to ☰
  if (!(await page.evaluate(() => document.activeElement?.classList?.contains("menu-link")))) fail("menu: first link should get focus on open");
  await page.keyboard.press("Escape");
  if (await page.locator(".menu-panel:not([hidden])").count()) fail("menu: Esc must close");
  if (!(await page.evaluate(() => document.activeElement?.classList?.contains("menu-btn")))) fail("menu: focus must return to ☰");
  // click-outside closes
  await page.locator(".menu-btn").click();
  await page.waitForSelector(".menu-panel:not([hidden])");
  await page.locator(".study-hint").first().click(); // neutral target (h1 now hosts the ℹ️ button)
  if (await page.locator(".menu-panel:not([hidden])").count()) fail("menu: click-outside must close");
  // the docs link actually reaches the public hub from a hash route
  await page.locator(".menu-btn").click();
  await page.locator('.menu-link[href="docs/"]').click();
  await page.waitForSelector("h1");
  if (!/Documentación/.test(await page.title())) fail("menu: docs link should land on the /docs hub");
  await page.goBack();
  await page.waitForSelector(".conj-table");
  ok("menu: ☰ on all screens; links/focus/Esc/click-outside; docs hub reachable");
}

// ---------- 🎙️ M12 clips backend: voiceless-but-online device ----------
{
  const clips = await browser.newPage();
  trackErrors(clips);
  // NO speechSynthesis stub (voiceless device); clips reachable; Audio stubbed
  await clips.addInitScript(() => {
    window.__played = [];
    class FakeAudio {
      constructor(src) { this.src = src; this.playbackRate = 1; this.preservesPitch = false; this._cbs = {}; }
      addEventListener(ev, fn) { this._cbs[ev] = fn; }
      play() { window.__played.push({ src: this.src, rate: this.playbackRate }); setTimeout(() => this._cbs?.ended?.(), 0); return Promise.resolve(); }
      pause() {}
    }
    Object.defineProperty(window, "Audio", { configurable: true, value: FakeAudio });
  });
  const manifest = JSON.parse(await (await fetch(`${BASE}/audio/manifest.json`)).text());
  // audio UI renders from clips alone
  await clips.goto(`${BASE}/#/study/1/present`);
  await clips.waitForSelector(".cell-speak");
  await clips.locator(".cell-speak").first().click();
  const p1 = await clips.evaluate(() => window.__played.at(-1));
  if (!p1 || !p1.src.endsWith(manifest["yo soy"].n)) fail(`clips: study tap should play the NORMAL "yo soy" clip, got ${JSON.stringify(p1)}`);
  // 🎧 Escucha unlocks voiceless-but-online (the M12 classroom win)
  await clips.goto(`${BASE}/#/set/1`);
  await clips.waitForSelector(".mode-card");
  if (!(await clips.locator(".listen-card").count())) fail("clips: Escucha card must appear with clips available");
  if ((await clips.locator(".mode-card:not(.stretch-card)").count()) !== 7) fail("clips: set screen should show 7 activity cards");
  await clips.goto(`${BASE}/#/play/1/present/listen`);
  await clips.waitForSelector(".listen-controls");
  const prompt = await clips.evaluate(() => window.__played.at(-1));
  const bare = Object.entries(manifest).filter(([t]) => !t.includes(" "));
  if (!prompt || !bare.some(([, v]) => prompt.src.endsWith(v.n)))
    fail(`clips: escucha must speak a BARE-form NORMAL clip, got ${JSON.stringify(prompt)}`);
  await clips.locator(".listen-controls .btn", { hasText: "Despacio" }).click();
  const slow = await clips.evaluate(() => window.__played.at(-1));
  if (!bare.some(([, v]) => slow.src.endsWith(v.s)))
    fail(`clips: 🐢 must play the dual-generated SLOW (0.70) clip, got ${JSON.stringify(slow)}`);
  // mute silences the clip backend too (toggle lives in the ☰ menu)
  await clips.goto(`${BASE}/#/study/1/present`);
  await clips.waitForSelector(".menu-btn");
  await clips.locator(".menu-btn").click();
  await clips.click(".settings-toggle"); // M30.2: sound lives under Ajustes
  await clips.waitForSelector(".menu-panel:not([hidden]) .sound-toggle");
  await clips.locator(".sound-toggle").click();
  await clips.evaluate(() => { window.__played.length = 0; });
  await clips.locator(".cell-speak").first().click();
  if (await clips.evaluate(() => window.__played.length)) fail("clips: mute must silence clip playback");
  await clips.close();
  ok("clips: voiceless-but-online audio incl. Escucha; bare prompts; 🐢 = real 0.70 clip; mute works");
}

// ---------- 📌 M13: persons column stays frozen while tables scroll (360px) ----------
{
  const sticky = await browser.newPage({ viewport: { width: 360, height: 640 } });
  trackErrors(sticky);
  for (const route of ["#/practica/1/present", "#/study/1/present"]) {
    await sticky.goto(`${BASE}/${route}`);
    await sticky.waitForSelector(".conj-table tbody th");
    // computed overflow-x is the real gate: `scrollLeft = n` succeeds even
    // when overflow-x:hidden (a CSS quirk that let a backwards shorthand
    // — `overflow: hidden auto` — pass a scrollLeft-only assertion while
    // real touch/wheel/drag scroll stayed silently disabled for users;
    // owner bug report 2026-07-16). Assert the computed style directly.
    const overflowX = await sticky.evaluate(() => getComputedStyle(document.querySelector(".table-scroll")).overflowX);
    if (overflowX === "hidden") fail(`sticky ${route}: overflow-x:hidden blocks real user scroll (scrollLeft alone can't catch this)`);
    // simulate an actual user gesture (wheel), not a programmatic jump
    const box = await sticky.locator(".table-scroll").boundingBox();
    await sticky.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    const before = await sticky.evaluate(() => document.querySelector(".conj-table tbody th").getBoundingClientRect().x);
    await sticky.mouse.wheel(300, 0);
    await sticky.waitForTimeout(80);
    const scrolled = await sticky.evaluate(() => document.querySelector(".table-scroll").scrollLeft);
    if (scrolled < 100) fail(`sticky ${route}: wheel scroll did not move the table (scrollLeft=${scrolled})`);
    const after = await sticky.evaluate(() => document.querySelector(".conj-table tbody th").getBoundingClientRect().x);
    if (Math.abs(after - before) > 1) fail(`sticky ${route}: persons column moved (x ${before} → ${after})`);
  }
  await sticky.close();
  ok("sticky: persons column frozen while Práctica/Estudia tables genuinely wheel-scroll on phones");
}

// ---------- M16 FLIP: redesign gate is now DEFAULT ON ----------
{
  // Post-flip: every page's inline head loader sets data-redesign, so the
  // Prado look is the live default with no ?redesign=1 needed. tokens.css
  // and redesign.css load 200 and now drive the visible look.
  const on = await browser.newPage();
  trackErrors(on);
  const linkStatus = { tokens: null, redesign: null };
  on.on("response", (r) => {
    if (r.url().endsWith("/css/tokens.css")) linkStatus.tokens = r.status();
    if (r.url().endsWith("/css/redesign.css")) linkStatus.redesign = r.status();
  });
  await on.goto(`${BASE}/`);
  await on.waitForSelector(".set-card");
  const state = await on.evaluate(() => ({
    hasGate: document.documentElement.hasAttribute("data-redesign"),
    bg: getComputedStyle(document.body).backgroundColor,
    brand: getComputedStyle(document.documentElement).getPropertyValue("--brand").trim(),
    linksHref: [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => new URL(l.href).pathname),
  }));
  if (!state.hasGate) fail("gate: data-redesign must be set by DEFAULT after the flip (no query needed)");
  if (linkStatus.tokens !== 200) fail(`gate: css/tokens.css did not load 200 (got ${linkStatus.tokens})`);
  if (linkStatus.redesign !== 200) fail(`gate: css/redesign.css did not load 200 (got ${linkStatus.redesign})`);
  if (!state.linksHref.some((p) => p.endsWith("/css/tokens.css"))) fail("gate: tokens.css link missing");
  if (!state.linksHref.some((p) => p.endsWith("/css/redesign.css"))) fail("gate: redesign.css link missing");
  // Prado ground + brand are live by default now (light default → --bg #fbf6ea = rgb(251,246,234)).
  if (state.bg !== "rgb(251, 246, 234)") fail(`gate: default body bg should be Prado day rgb(251, 246, 234), got "${state.bg}"`);
  // tokens.css light --brand is #2f6b4f (darkened from the artifact's #3f9256
  // during I* to pass WCAG AA 4.5:1 — see docs/DESIGN.md contrast note).
  if (!/^#2f6b4f$/i.test(state.brand)) fail(`gate: --brand should resolve to Prado #2f6b4f by default, got "${state.brand}"`);
  await on.close();
  ok(`gate: redesign is DEFAULT ON (data-redesign set, Prado bg ${state.bg}, --brand ${state.brand})`);
}

// ---------- M16 I*: redesign-preview screenshots + preview axe gate ----------
{
  // One screenshot per redesigned screen for morning review. Also validates
  // key tokens landed as computed styles (fonts, backgrounds), so a broken
  // redesign selector loudly fails here instead of quietly shipping.
  const previewRoutes = [
    ["home", `?redesign=1#/`],
    ["group", `?redesign=1#/set/1`],
    ["study", `?redesign=1#/study/1/present`],
    ["practica", `?redesign=1#/practica/1/present`],
    ["choice", `?redesign=1#/play/1/present/choice`],
    ["type", `?redesign=1#/play/1/present/type`],
    ["match", `?redesign=1#/play/1/present/match`],
    ["contrast", `?redesign=1#/play/1/contrast`],
    ["informe", `?redesign=1#/informe`],
  ];
  const prev = await browser.newPage({ viewport: { width: 900, height: 900 } });
  trackErrors(prev);
  for (const [name, path] of previewRoutes) {
    await prev.goto(`${BASE}/${path}`);
    await prev.waitForSelector(".site-footer");
    await prev.screenshot({ path: `${SHOTS}/redesign-${name}.png` });
    // Every preview page uses the redesign body font (Nunito stack) and
    // the Prado ground (var(--bg) = #fbf6ea in light).
    const state = await prev.evaluate(() => ({
      hasGate: document.documentElement.hasAttribute("data-redesign"),
      fontFamily: getComputedStyle(document.body).fontFamily,
      bg: getComputedStyle(document.documentElement).getPropertyValue("--bg").trim().toLowerCase(),
    }));
    if (!state.hasGate) fail(`redesign preview ${name}: gate lost`);
    if (!/nunito|ui-rounded|system-ui/i.test(state.fontFamily)) fail(`redesign preview ${name}: body font not the Prado stack — got "${state.fontFamily}"`);
    if (state.bg !== "#fbf6ea") fail(`redesign preview ${name}: --bg should be Prado #fbf6ea, got "${state.bg}"`);
  }
  await prev.goto(`${BASE}/?redesign=1&redesign=1#/set/1`); // path param survives real-world usage
  await prev.close();

  // Also screenshot about + docs in redesign.
  const prevStatic = await browser.newPage({ viewport: { width: 900, height: 900 } });
  trackErrors(prevStatic);
  await prevStatic.goto(`${BASE}/about.html?redesign=1`);
  await prevStatic.waitForSelector("main");
  await prevStatic.screenshot({ path: `${SHOTS}/redesign-about.png` });
  await prevStatic.goto(`${BASE}/docs/?redesign=1`);
  await prevStatic.waitForSelector("main");
  await prevStatic.screenshot({ path: `${SHOTS}/redesign-docs.png` });
  await prevStatic.goto(`${BASE}/docs/usability.html?redesign=1`);
  await prevStatic.waitForSelector("main");
  await prevStatic.screenshot({ path: `${SHOTS}/redesign-usability.png` });
  await prevStatic.close();

  ok(`redesign preview: screenshots captured for 13 screens (${previewRoutes.length} app + 3 static)`);

  // Preview axe gate — the M16 spec: no new critical/serious violations
  // under ?redesign=1 either. Uses the vendored axe.min.js loaded earlier.
  const { readFileSync } = await import("node:fs");
  const axeSource = readFileSync(join(ROOT, "tests/e2e/vendor/axe.min.js"), "utf8");
  const axePrev = await browser.newPage();
  trackErrors(axePrev);
  for (const [, path] of previewRoutes) {
    await axePrev.goto(`${BASE}/${path}`);
    await axePrev.reload();
    await axePrev.waitForSelector(".site-footer");
    await axePrev.addScriptTag({ content: axeSource });
    const bad = await axePrev.evaluate(async () => {
      const res = await window.axe.run(document, { resultTypes: ["violations"] });
      return res.violations
        .filter((v) => v.impact === "critical" || v.impact === "serious")
        .map((v) => `${v.id}(${v.impact}) ×${v.nodes.length} e.g. ${v.nodes[0]?.target?.join(" ")}`);
    });
    if (bad.length) fail(`redesign axe ${path}: ${bad.join(" | ")}`);
  }
  await axePrev.close();
  ok(`redesign axe: zero critical/serious violations across ${previewRoutes.length} redesigned routes`);

  // Dark theme × redesign preview: exercise the forest-night palette
  // through axe on the home route so a dark-mode contrast regression
  // (e.g. --brand vs --bg dark) can't slip through.
  const axeDark = await browser.newPage({ colorScheme: "dark" });
  trackErrors(axeDark);
  await axeDark.goto(`${BASE}/?redesign=1#/`);
  await axeDark.reload();
  await axeDark.waitForSelector(".site-footer");
  // Light is the default now — opt into Auto so OS-dark yields the forest-night palette.
  await axeDark.click(".menu-btn");
  await axeDark.click(".settings-toggle"); // M30.2: theme lives under Ajustes
  await axeDark.waitForSelector(".theme-selector");
  await axeDark.click('.theme-option[data-theme-value="auto"]');
  await axeDark.waitForFunction(() => !document.documentElement.hasAttribute("data-theme"));
  await axeDark.keyboard.press("Escape");
  await axeDark.addScriptTag({ content: axeSource });
  const badDark = await axeDark.evaluate(async () => {
    const res = await window.axe.run(document, { resultTypes: ["violations"] });
    return res.violations
      .filter((v) => v.impact === "critical" || v.impact === "serious")
      .map((v) => `${v.id}(${v.impact}) ×${v.nodes.length}`);
  });
  if (badDark.length) fail(`redesign axe dark: ${badDark.join(" | ")}`);
  await axeDark.close();
  ok("redesign axe: zero critical/serious violations in the forest-night (dark) preview");
}

// ---------- M18.1 "Empareja con Chispa": up-only counts, run celebration, F1 droplet ----------
{
  const chispa = await browser.newPage();
  trackErrors(chispa);
  await chispa.goto(`${BASE}/#/play/1/present/match`);
  await chispa.waitForSelector(".match-card");
  // counter starts empty (no "0 parejas" — nothing to celebrate yet)
  if ((await chispa.locator(".pareja-count").innerText()).trim() !== "")
    fail("chispa: pareja counter should start empty");
  // deliberate miss: counter stays empty, no visible reset artifact anywhere.
  // Miss against the LAST left pair's card — the solve loop below excludes
  // that pair, so exactly one solved pair is non-first-try and the run
  // deterministically reaches 3+ ("seguidas") regardless of shuffle order.
  await chispa.evaluate(async () => {
    const { SETS } = await import("./js/verbs.js");
    const { conjugate, PERSONS } = await import("./js/conjugator.js");
    const formOf = (cardEl) => {
      const [personLabel, inf] = cardEl.textContent.split(" · ");
      const verb = SETS[0].verbs.find((v) => v.inf === inf);
      return conjugate(verb, "present")[PERSONS.indexOf(personLabel)];
    };
    const left = [...document.querySelectorAll(".match-col.left .match-card")];
    const lastForm = formOf(left[left.length - 1]);
    const wrong = [...document.querySelectorAll(".match-col.right .match-card")]
      .find((x) => x.textContent === lastForm);
    left[0].click(); wrong.click();
  });
  if ((await chispa.locator(".pareja-count").innerText()).trim() !== "")
    fail("chispa: counter must not change on a miss");
  if (!(await chispa.locator(".feedback.bad").count())) fail("chispa: miss feedback missing");
  // solve all but ONE pair (results render 700ms after the last match would
  // tear down the board mid-assertion); counter must only ever go up and a
  // run must get celebrated along the way
  const chispaRun = await chispa.evaluate(async () => {
    const { SETS } = await import("./js/verbs.js");
    const { conjugate, PERSONS } = await import("./js/conjugator.js");
    const seen = [];
    const left = [...document.querySelectorAll(".match-col.left .match-card:not(.done)")];
    for (const l of left.slice(0, -1)) {
      const [personLabel, inf] = l.textContent.split(" · ");
      const verb = SETS[0].verbs.find((v) => v.inf === inf);
      const form = conjugate(verb, "present")[PERSONS.indexOf(personLabel)];
      const r = [...document.querySelectorAll(".match-col.right .match-card")]
        .find((x) => x.textContent === form && !x.disabled);
      if (!r) return { err: `no right card for ${form}` };
      l.click(); r.click();
      seen.push(parseInt(document.querySelector(".pareja-count").textContent, 10));
      await new Promise((res) => setTimeout(res, 40));
    }
    return { seen, feedback: document.querySelector(".feedback").textContent };
  });
  if (chispaRun.err) fail(`chispa: ${chispaRun.err}`);
  const upOnly = chispaRun.seen.every((n, i) => n === i + 1);
  if (!upOnly) fail(`chispa: counter not up-only (${chispaRun.seen.join(",")})`);
  if (!/seguidas/.test(chispaRun.feedback)) fail("chispa: run celebration missing after consecutive matches");
  // pop animation is wired (decorative; reduced-motion removes it)
  const popAnim = await chispa.evaluate(() =>
    getComputedStyle(document.querySelector(".match-card.done")).animationName);
  if (popAnim !== "chispa-pop") fail(`chispa: expected chispa-pop animation, got ${popAnim}`);
  // reduced motion strips transform/animation juice but the game is identical
  await chispa.emulateMedia({ reducedMotion: "reduce" });
  const rmAnim = await chispa.evaluate(() =>
    getComputedStyle(document.querySelector(".match-card.done")).animationName);
  if (rmAnim === "chispa-pop") fail("chispa: pop animation must be removed under reduced motion");
  await chispa.emulateMedia({ reducedMotion: null });
  // finish the round so the result records, then verify F1 on home
  await chispa.evaluate(async () => {
    const { SETS } = await import("./js/verbs.js");
    const { conjugate, PERSONS } = await import("./js/conjugator.js");
    const l = document.querySelector(".match-col.left .match-card:not(.done)");
    const [personLabel, inf] = l.textContent.split(" · ");
    const verb = SETS[0].verbs.find((v) => v.inf === inf);
    const form = conjugate(verb, "present")[PERSONS.indexOf(personLabel)];
    const r = [...document.querySelectorAll(".match-col.right .match-card")]
      .find((x) => x.textContent === form && !x.disabled);
    l.click(); r.click();
  });
  await chispa.waitForSelector(".results");
  // F1 droplet: the review queue reads as watering, not backlog
  await chispa.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("conjuga.v1"));
    for (const k of Object.keys(s.best)) s.best[k].at = Date.now() - 8 * 24 * 3600 * 1000;
    localStorage.setItem("conjuga.v1", JSON.stringify(s));
  });
  await chispa.goto(`${BASE}/#/`);
  await chispa.reload();
  await chispa.waitForSelector(".review-queue");
  const water = await chispa.locator(".review-water").innerText();
  if (!/riega/.test(water)) fail("chispa F1: watering line missing from review queue");
  if (/\d/.test(water)) fail("chispa F1: watering line must never show a backlog count");
  await chispa.screenshot({ path: `${SHOTS}/m18-chispa-home.png` });
  await chispa.close();
  ok("M18.1 chispa: up-only pareja count, run celebration, pop juice (motion-gated), F1 watering line");
}

// ---------- M18.2a "El Nido de Lola": derived tiers, a11y list, voiceless parity ----------
{
  const nido = await browser.newPage();
  trackErrors(nido);
  // fresh visitor: inviting empty state, no list, no counters of what's missing
  await nido.goto(`${BASE}/#/nido`);
  await nido.waitForSelector(".nido");
  const emptyText = await nido.locator(".nido").innerText();
  if (!/espera su primera brizna/.test(emptyText)) fail("nido: inviting empty state missing");
  if (await nido.locator(".nido-list").count()) fail("nido: fresh nest must not render a list");
  if (/\/\s*20|faltan/.test(emptyText)) fail("nido: empty state must never show a deficit count");
  if ((await nido.title()) !== "El Nido de Lola · Conjuga") fail("nido: page title missing");
  // seed three groups at the three tiers: wisp (one star), twig (all ≥1★), flower (30/30)
  await nido.evaluate(() => {
    const best = {};
    const entry = (stars) => ({ score: 6, total: 6, stars, plays: 1, at: Date.now() });
    best["1.present.choice"] = entry(1); // group 1 → brizna
    for (const t of ["present", "preterite", "imperfect"])
      for (const m of ["choice", "type", "match"]) {
        best[`2.${t}.${m}`] = entry(1); // group 2 → ramita (all ≥1★, far from perfect)
        best[`3.${t}.${m}`] = entry(3); // group 3 → flor (30/30)
      }
    best["2.past.contrast"] = entry(1);
    best["3.past.contrast"] = entry(3);
    localStorage.setItem("conjuga.v1", JSON.stringify({ settings: {}, best }));
  });
  await nido.reload();
  await nido.waitForSelector(".nido-list");
  const items = await nido.locator(".nido-list .nido-item").allInnerTexts();
  if (items.length !== 3) fail(`nido: expected 3 items, got ${items.length}`);
  if (!items.some((t) => /Grupo 1 · la brizna/.test(t))) fail("nido: group 1 should be a brizna");
  if (!items.some((t) => /Grupo 2 · la ramita/.test(t))) fail("nido: group 2 (all ≥1★, imperfect) should be a ramita — no perfection gate");
  if (!items.some((t) => /Grupo 3 · la flor/.test(t))) fail("nido: group 3 (30/30) should be a flor");
  const summary = await nido.locator(".nido-summary").innerText();
  if (!/1 ramita, 1 flor y 1 brizna/.test(summary)) fail(`nido: summary wrong: ${summary}`);
  // scene is decorative; the list is the semantic surface
  if ((await nido.locator(".nido-scene").getAttribute("aria-hidden")) !== "true")
    fail("nido: scene svg must be aria-hidden");
  // clips are served in this context → audio affordance renders as buttons
  if ((await nido.locator(".nido-say").count()) !== 3) fail("nido: expected tap-to-hear buttons with audio available");
  // home hero links into the nest
  await nido.goto(`${BASE}/#/`);
  await nido.waitForSelector(".nido-link");
  await nido.click(".nido-link");
  await nido.waitForSelector(".nido-summary");
  ok("M18.2a nido: tiers derive correctly (no perfection gate), semantic list + aria-hidden scene, home link works");
  await nido.screenshot({ path: `${SHOTS}/m18-nido.png` });
  await nido.close();

  // voiceless device: same nest, plain list items, zero broken affordances
  const mute = await browser.newPage();
  trackErrors(mute);
  await mute.route("**/audio/manifest.json", (r) => r.fulfill({ status: 204 }));
  await mute.addInitScript(() => {
    // voiceless: speechSynthesis exists but reports no voices (matches real
    // devices; a bare `undefined` would crash audio.js's boot listener)
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { getVoices: () => [], addEventListener: () => {}, cancel: () => {} },
    });
    const best = { "1.present.choice": { score: 6, total: 6, stars: 1, plays: 1, at: Date.now() } };
    localStorage.setItem("conjuga.v1", JSON.stringify({ settings: {}, best }));
  });
  await mute.goto(`${BASE}/#/nido`);
  await mute.waitForSelector(".nido-list");
  if (await mute.locator(".nido-say").count()) fail("nido voiceless: audio buttons must hide");
  if ((await mute.locator(".nido-plain").count()) !== 1) fail("nido voiceless: plain items expected");
  await mute.close();
  ok("M18.2a nido: voiceless device gets the same nest with no audio affordance");
}

// ---------- M18.2b: tier-crossing ceremonies, home badges, ?m18demo=1 ----------
{
  const solveMatch = async (pg) => pg.evaluate(async () => {
    const { SETS } = await import("./js/verbs.js");
    const { conjugate, PERSONS } = await import("./js/conjugator.js");
    const left = [...document.querySelectorAll(".match-col.left .match-card:not(.done)")];
    for (const l of left) {
      const [personLabel, inf] = l.textContent.split(" · ");
      const verb = SETS[0].verbs.find((v) => v.inf === inf);
      const form = conjugate(verb, "present")[PERSONS.indexOf(personLabel)];
      const r = [...document.querySelectorAll(".match-col.right .match-card")]
        .find((x) => x.textContent === form && !x.disabled);
      if (!r) return `no right card for ${form}`;
      l.click(); r.click();
      await new Promise((res) => setTimeout(res, 40));
    }
    return "ok";
  });
  const seed = (pg, matchStars, otherStars) => pg.addInitScript(([ms, os]) => {
    const best = {};
    const entry = (stars) => ({ score: 6, total: 6, stars, plays: 1, at: Date.now() });
    for (const t of ["present", "preterite", "imperfect"])
      for (const m of ["choice", "type", "match"]) best[`1.${t}.${m}`] = entry(os);
    best["1.past.contrast"] = entry(os);
    if (ms === null) delete best["1.present.match"]; else best["1.present.match"] = entry(ms);
    localStorage.setItem("conjuga.v1", JSON.stringify({ settings: {}, best }));
  }, [matchStars, otherStars]);

  // twig crossing: group 1 all ≥1★ EXCEPT present/match unplayed → perfect
  // match makes every activity starred → ramita ceremony (no perfection gate)
  const twig = await browser.newPage();
  trackErrors(twig);
  await seed(twig, null, 1);
  await twig.goto(`${BASE}/#/play/1/present/match`);
  await twig.waitForSelector(".match-card");
  const tw = await solveMatch(twig);
  if (tw !== "ok") fail(`nido-celebra twig: ${tw}`);
  await twig.waitForSelector(".results");
  await twig.waitForSelector(".nido-ceremony.tier-2");
  const twigMsg = await twig.locator(".ceremony-msg").innerText();
  if (!/ramita nueva/.test(twigMsg)) fail(`nido-celebra: expected twig ceremony, got: ${twigMsg}`);
  // ceremony links into the nest; group 1 shows as ramita there
  await twig.click(".nido-ceremony a");
  await twig.waitForSelector(".nido-list");
  if (!(await twig.locator(".nido-item", { hasText: "Grupo 1 · la ramita" }).count()))
    fail("nido-celebra: group 1 missing as ramita after ceremony");
  // home card shows the tier status glyph with an accessible name
  await twig.goto(`${BASE}/#/`);
  await twig.waitForSelector(".set-card");
  const tierBadge = twig.locator(".set-card .set-tier").first();
  if (!(await tierBadge.count())) fail("nido-celebra: home set-card tier glyph missing");
  if (!/en el nido/.test(await tierBadge.getAttribute("aria-label")))
    fail("nido-celebra: tier glyph needs an accessible name");
  // replaying the same round must NOT re-fire the ceremony (upgrade-only)
  await twig.goto(`${BASE}/#/play/1/present/match`);
  await twig.waitForSelector(".match-card");
  const re = await solveMatch(twig);
  if (re !== "ok") fail(`nido-celebra replay: ${re}`);
  await twig.waitForSelector(".results");
  if (await twig.locator(".nido-ceremony").count()) fail("nido-celebra: ceremony re-fired on replay");
  await twig.close();
  ok("M18.2b: twig ceremony on all-starred crossing (1★ everywhere — equity), upgrade-only, home badge + nest link");

  // flower crossing: all 3★ except present/match at 1★ → perfect match → 30/30
  const flor = await browser.newPage();
  trackErrors(flor);
  await seed(flor, 1, 3);
  await flor.goto(`${BASE}/#/play/1/present/match`);
  await flor.waitForSelector(".match-card");
  const fl = await solveMatch(flor);
  if (fl !== "ok") fail(`nido-celebra flor: ${fl}`);
  await flor.waitForSelector(".results");
  await flor.waitForSelector(".nido-ceremony.tier-3");
  if (!/flor nueva/.test(await flor.locator(".ceremony-msg").innerText()))
    fail("nido-celebra: expected flower ceremony at 30/30");
  await flor.screenshot({ path: `${SHOTS}/m18-flor-ceremony.png` });
  await flor.close();
  ok("M18.2b: flower ceremony fires on the 30/30 crossing");

  // ?m18demo=1 — sample nest + forced ceremony, ZERO storage writes
  const demo = await browser.newPage();
  trackErrors(demo);
  await demo.goto(`${BASE}/?m18demo=1#/nido`);
  await demo.waitForSelector(".nido-list");
  if (!(await demo.locator(".demo-banner").count())) fail("m18demo: banner missing");
  if ((await demo.locator(".nido-item").count()) < 10) fail("m18demo: sample nest looks empty");
  await demo.goto(`${BASE}/?m18demo=1#/play/1/present/match`);
  await demo.waitForSelector(".match-card");
  const dm = await solveMatch(demo);
  if (dm !== "ok") fail(`m18demo: ${dm}`);
  await demo.waitForSelector(".results");
  await demo.waitForSelector(".nido-ceremony.tier-2");
  const stored = await demo.evaluate(() => localStorage.getItem("conjuga.v1"));
  if (stored !== null && JSON.stringify(JSON.parse(stored).best ?? {}) !== "{}")
    fail(`m18demo: demo mode wrote progress: ${stored}`);
  await demo.close();
  ok("M18.2b: ?m18demo=1 shows sample nest + forced ceremony and writes nothing");
}

// ---------- M18.3a "El Vuelo de Lola": core flight (static anchored grid) ----------
{
  const solveMatchRound = async (pg) => {
    await pg.goto(`${BASE}/#/play/1/present/match`);
    await pg.waitForSelector(".match-card");
    const r = await pg.evaluate(async () => {
      const { SETS } = await import("./js/verbs.js");
      const { conjugate, PERSONS } = await import("./js/conjugator.js");
      const left = [...document.querySelectorAll(".match-col.left .match-card:not(.done)")];
      for (const l of left) {
        const [personLabel, inf] = l.textContent.split(" · ");
        const verb = SETS[0].verbs.find((v) => v.inf === inf);
        const form = conjugate(verb, "present")[PERSONS.indexOf(personLabel)];
        const rc = [...document.querySelectorAll(".match-col.right .match-card")]
          .find((x) => x.textContent === form && !x.disabled);
        if (!rc) return `no right card for ${form}`;
        l.click(); rc.click();
        await new Promise((res) => setTimeout(res, 40));
      }
      return "ok";
    });
    if (r !== "ok") fail(`vuelo setup: ${r}`);
    await pg.waitForSelector(".results");
  };

  const fly = await browser.newPage();
  trackErrors(fly);
  await solveMatchRound(fly); // perfect → 3 stars
  await fly.waitForSelector(".vuelo-invite");
  await fly.click(".vuelo-invite");
  await fly.waitForSelector(".vuelo .vuelo-cloud");
  // 3★ flair = 5 clouds (flair scales; access never gated); ≥64px targets
  if ((await fly.locator(".vuelo-cloud").count()) !== 5)
    fail("vuelo: expected 5 clouds on a 3-star flight");
  const cbb = await fly.locator(".vuelo-cloud").first().boundingBox();
  if (cbb.height < 64) fail(`vuelo: cloud tap target ${cbb.height}px < 64px`);
  // wrong tap: NO failure state — prompt unchanged, cloud stays tappable
  const wrongTap = await fly.evaluate(async () => {
    const { SETS } = await import("./js/verbs.js");
    const { conjugate, PERSONS } = await import("./js/conjugator.js");
    const pill = document.querySelector(".vuelo-prompt");
    const [personLabel, inf] = pill.textContent.split(" · ");
    const verb = SETS[0].verbs.find((v) => v.inf === inf);
    const form = conjugate(verb, "present")[PERSONS.indexOf(personLabel)];
    const wrong = [...document.querySelectorAll(".vuelo-cloud")].find((c) => c.textContent !== form);
    const before = pill.textContent;
    wrong.click();
    return { before, after: pill.textContent, disabled: wrong.disabled };
  });
  if (wrongTap.before !== wrongTap.after) fail("vuelo: wrong tap must not advance the prompt");
  if (wrongTap.disabled) fail("vuelo: wrong cloud must stay tappable (no failure state)");
  // fly the whole route home
  const flew = await fly.evaluate(async () => {
    const { SETS } = await import("./js/verbs.js");
    const { conjugate, PERSONS } = await import("./js/conjugator.js");
    for (let k = 0; k < 7; k++) {
      const pill = document.querySelector(".vuelo-prompt");
      if (!pill || !pill.textContent.includes("·")) break;
      const [personLabel, inf] = pill.textContent.split(" · ");
      const verb = SETS[0].verbs.find((v) => v.inf === inf);
      const form = conjugate(verb, "present")[PERSONS.indexOf(personLabel)];
      const cloud = [...document.querySelectorAll(".vuelo-cloud")].find((c) => c.textContent === form);
      if (!cloud) return `no cloud for ${form}`;
      cloud.click();
      await new Promise((res) => setTimeout(res, 720));
    }
    return "ok";
  });
  if (flew !== "ok") fail(`vuelo: ${flew}`);
  await fly.waitForSelector(".vuelo-landing");
  if (!/Qué vuelo/.test(await fly.locator(".vuelo-done").innerText()))
    fail("vuelo: landing message missing");
  await fly.screenshot({ path: `${SHOTS}/m18-vuelo-landing.png` });
  await fly.click(".vuelo-landing .btn.primary");
  if (await fly.locator(".vuelo").count()) fail("vuelo: overlay must close on Seguir");
  if (!(await fly.locator(".results").count())) fail("vuelo: results must remain underneath");
  // reduced motion: the SAME game (structure identical), skip closes
  await fly.emulateMedia({ reducedMotion: "reduce" });
  await fly.click(".vuelo-invite");
  await fly.waitForSelector(".vuelo .vuelo-cloud");
  if ((await fly.locator(".vuelo-cloud").count()) !== 5)
    fail("vuelo: reduced-motion flight must be the identical game");
  await fly.click(".vuelo-skip");
  if (await fly.locator(".vuelo").count()) fail("vuelo: Saltar must close the overlay");
  await fly.close();
  ok("M18.3a vuelo: invitation on results, 5-cloud 3★ flight, ≥64px anchored targets, no failure state, landing + skip, reduced-motion parity");

  // offline degrade: UNTRACKED page — the blocked module fetch logs an
  // EXPECTED console error; the app itself must not crash and the button
  // must explain itself bilingually.
  const off = await browser.newPage();
  await off.route("**/js/vuelo.js", (r) => r.abort());
  await solveMatchRound(off);
  await off.waitForSelector(".vuelo-invite");
  await off.click(".vuelo-invite");
  await off.waitForTimeout(300);
  const offBtn = off.locator(".vuelo-invite");
  if (!(await offBtn.isDisabled())) fail("vuelo offline: button should disable");
  if (!/conexión/.test(await offBtn.innerText())) fail("vuelo offline: bilingual fallback message missing");
  if (!(await off.locator(".results").count())) fail("vuelo offline: results must survive");
  await off.close();
  ok("M18.3a vuelo: offline import degrades to a message, results intact");
}

// ---------- M18.3b: flight garnish (motion-gated) + 🔊 replay affordance ----------
{
  const solveMatchRound2 = async (pg) => {
    await pg.goto(`${BASE}/#/play/1/present/match`);
    await pg.waitForSelector(".match-card");
    const r = await pg.evaluate(async () => {
      const { SETS } = await import("./js/verbs.js");
      const { conjugate, PERSONS } = await import("./js/conjugator.js");
      const left = [...document.querySelectorAll(".match-col.left .match-card:not(.done)")];
      for (const l of left) {
        const [personLabel, inf] = l.textContent.split(" · ");
        const verb = SETS[0].verbs.find((v) => v.inf === inf);
        const form = conjugate(verb, "present")[PERSONS.indexOf(personLabel)];
        const rc = [...document.querySelectorAll(".match-col.right .match-card")]
          .find((x) => x.textContent === form && !x.disabled);
        if (!rc) return `no right card for ${form}`;
        l.click(); rc.click();
        await new Promise((res) => setTimeout(res, 40));
      }
      return "ok";
    });
    if (r !== "ok") fail(`vuelo-garnish setup: ${r}`);
    await pg.waitForSelector(".results");
    await pg.click(".vuelo-invite");
    await pg.waitForSelector(".vuelo .vuelo-cloud");
  };

  const gar = await browser.newPage();
  trackErrors(gar);
  await solveMatchRound2(gar);
  // clips are served here → the ear gets its replay affordance
  if (!(await gar.locator(".vuelo-replay").count())) fail("vuelo-garnish: 🔊 replay missing with audio available");
  // clouds bob in place under normal motion…
  const bob = await gar.evaluate(() =>
    getComputedStyle(document.querySelector(".vuelo-cloud")).animationName);
  if (bob !== "vuelo-bob") fail(`vuelo-garnish: expected vuelo-bob, got ${bob}`);
  // …and hold still under reduced motion — same game, replay stays (audio ≠ motion)
  await gar.emulateMedia({ reducedMotion: "reduce" });
  const still = await gar.evaluate(() =>
    getComputedStyle(document.querySelector(".vuelo-cloud")).animationName);
  if (still === "vuelo-bob") fail("vuelo-garnish: bobbing must stop under reduced motion");
  if (!(await gar.locator(".vuelo-replay").count())) fail("vuelo-garnish: replay must survive reduced motion");
  await gar.close();
  ok("M18.3b: clouds bob in place (motion-gated off under reduce), 🔊 replay present with audio");

  // voiceless device: no replay affordance, flight fully playable
  const quiet = await browser.newPage();
  trackErrors(quiet);
  await quiet.route("**/audio/manifest.json", (r) => r.fulfill({ status: 204 }));
  await quiet.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { getVoices: () => [], addEventListener: () => {}, cancel: () => {} },
    });
  });
  await solveMatchRound2(quiet);
  if (await quiet.locator(".vuelo-replay").count()) fail("vuelo-garnish: replay must hide on voiceless devices");
  if ((await quiet.locator(".vuelo-cloud").count()) < 4) fail("vuelo-garnish: voiceless flight must still deal clouds");
  await quiet.close();
  ok("M18.3b: voiceless flight hides the replay affordance and stays fully playable");
}

// ---------- M19: 🪶 feather at 🎧 9/9 + accessibility reframe ----------
{
  const fea = await browser.newPage();
  trackErrors(fea);
  // group 1: one star + FULL listening badges → brizna y pluma
  await fea.addInitScript(() => {
    const e = (stars) => ({ score: 10, total: 10, stars, plays: 1, at: Date.now() });
    const best = { "1.present.choice": e(1) };
    for (const t of ["present", "preterite", "imperfect"]) best[`1.${t}.listen`] = e(3);
    localStorage.setItem("conjuga.v1", JSON.stringify({ settings: {}, best }));
  });
  await fea.goto(`${BASE}/#/nido`);
  await fea.waitForSelector(".nido-list");
  const item = await fea.locator(".nido-item").first().innerText();
  if (!/Grupo 1 · la brizna y la pluma/.test(item)) fail(`feather: expected brizna y pluma, got: ${item}`);
  if (!/pluma/.test(await fea.locator(".nido-summary").innerText())) fail("feather: summary must count plumas");
  // nest tiers stay hearing-free: badges alone never make a twig
  const tierClass = await fea.locator(".nido-item").first().getAttribute("class");
  if (/tier-2|tier-3/.test(tierClass)) fail("feather: listening must never upgrade a star tier");
  // home card announces both
  await fea.goto(`${BASE}/#/`);
  await fea.waitForSelector(".set-card");
  const lab = await fea.locator(".set-card .set-tier").first().getAttribute("aria-label");
  if (!/la brizna y la pluma en el nido/.test(lab)) fail(`feather: home glyph label wrong: ${lab}`);
  await fea.close();
  ok("M19 feather: 🎧 9/9 adds la pluma (list + summary + home glyph), star tiers untouched");

  // 8/9 is not a feather; listening-only progress still shows as la pluma
  const edge = await browser.newPage();
  trackErrors(edge);
  await edge.addInitScript(() => {
    const e = (stars) => ({ score: 10, total: 10, stars, plays: 1, at: Date.now() });
    const best = {};
    best["1.present.listen"] = e(3); best["1.preterite.listen"] = e(3); best["1.imperfect.listen"] = e(2);
    for (const t of ["present", "preterite", "imperfect"]) best[`2.${t}.listen`] = e(3);
    localStorage.setItem("conjuga.v1", JSON.stringify({ settings: {}, best }));
  });
  await edge.goto(`${BASE}/#/nido`);
  await edge.waitForSelector(".nido-list");
  const items = await edge.locator(".nido-item").allInnerTexts();
  if (items.length !== 1) fail(`feather edge: expected only the 9/9 group, got ${items.length}`);
  if (!/Grupo 2 · la pluma/.test(items[0])) fail(`feather edge: listening-only group should be la pluma, got: ${items[0]}`);
  await edge.close();
  ok("M19 feather: 8/9 earns nothing yet; a listening-only 9/9 group appears as la pluma");

  // demo nest includes feathers; about.html carries the accessibility reframe
  const rf = await browser.newPage();
  trackErrors(rf);
  await rf.goto(`${BASE}/?m18demo=1#/nido`);
  await rf.waitForSelector(".nido-list");
  if ((await rf.locator(".nido-item.has-pluma").count()) < 4) fail("feather: demo nest should include plumas");
  await rf.goto(`${BASE}/about.html`);
  const aboutText = await rf.locator("main").innerText();
  if (!/progress never requires hearing/.test(aboutText)) fail("reframe: about.html accessibility rationale missing");
  if (/only on devices with a Spanish voice/.test(aboutText)) fail("reframe: stale voice-support claim still on about.html");
  await rf.close();
  ok("M19 reframe: demo nest has plumas; about.html states the accessibility rationale");
}

// ---------- M20 a11y sprint: done-card ink, primary-button ink, cloud sticky-hover ----------
{
  const matchOnePair = async (pg) => pg.evaluate(async () => {
    const { SETS } = await import("./js/verbs.js");
    const { conjugate, PERSONS } = await import("./js/conjugator.js");
    const l = document.querySelector(".match-col.left .match-card");
    const [personLabel, inf] = l.textContent.split(" · ");
    const verb = SETS[0].verbs.find((v) => v.inf === inf);
    const form = conjugate(verb, "present")[PERSONS.indexOf(personLabel)];
    const r = [...document.querySelectorAll(".match-col.right .match-card")]
      .find((x) => x.textContent === form);
    l.click(); r.click();
  });
  const fullSolve = async (pg) => {
    const r = await pg.evaluate(async () => {
      const { SETS } = await import("./js/verbs.js");
      const { conjugate, PERSONS } = await import("./js/conjugator.js");
      const left = [...document.querySelectorAll(".match-col.left .match-card:not(.done)")];
      for (const l of left) {
        const [personLabel, inf] = l.textContent.split(" · ");
        const verb = SETS[0].verbs.find((v) => v.inf === inf);
        const form = conjugate(verb, "present")[PERSONS.indexOf(personLabel)];
        const rc = [...document.querySelectorAll(".match-col.right .match-card")]
          .find((x) => x.textContent === form && !x.disabled);
        if (!rc) return "missing card";
        l.click(); rc.click();
        await new Promise((res) => setTimeout(res, 40));
      }
      return "ok";
    });
    if (r !== "ok") fail(`m20 setup: ${r}`);
    await pg.waitForSelector(".results");
  };
  const doneStyle = (pg) => pg.evaluate(() => {
    const s = getComputedStyle(document.querySelector(".match-card.done"));
    return { color: s.color, opacity: s.opacity };
  });

  for (const theme of ["light", "dark"]) {
    const pg = await browser.newPage();
    trackErrors(pg);
    if (theme === "dark") {
      await pg.addInitScript(() => {
        localStorage.setItem("conjuga.v1", JSON.stringify({ settings: { theme: "dark" }, best: {} }));
      });
    }
    await pg.goto(`${BASE}/#/play/1/present/match`);
    await pg.waitForSelector(".match-card");
    // M20-1: done-card ink is the success ink at full opacity
    await matchOnePair(pg);
    await pg.waitForSelector(".match-card.done");
    const ds = await doneStyle(pg);
    const wantInk = theme === "light" ? "rgb(31, 107, 60)" : "rgb(108, 200, 136)";
    if (ds.color !== wantInk) fail(`m20-1 ${theme}: done-card ink ${ds.color}, expected ${wantInk}`);
    if (ds.opacity !== "1") fail(`m20-1 ${theme}: done card still faded (opacity ${ds.opacity})`);
    // M20-2: primary-button ink + .h-en inherit (results screen)
    await fullSolve(pg);
    await pg.waitForSelector(".vuelo-invite");
    const btnInk = await pg.evaluate(() => {
      const b = document.querySelector(".vuelo-invite");
      return { btn: getComputedStyle(b).color, en: getComputedStyle(b.querySelector(".h-en")).color };
    });
    const wantBtn = theme === "light" ? "rgb(255, 255, 255)" : "rgb(36, 48, 38)";
    if (btnInk.btn !== wantBtn) fail(`m20-2 ${theme}: primary ink ${btnInk.btn}, expected ${wantBtn}`);
    if (btnInk.en !== wantBtn) fail(`m20-2 ${theme}: .h-en on primary is ${btnInk.en}, expected ${wantBtn}`);
    await pg.screenshot({ path: `${SHOTS}/m20-results-${theme}.png` });
    // M20-3: cloud sticky-hover guard (light run only — theme-independent)
    if (theme === "light") {
      await pg.click(".vuelo-invite");
      await pg.waitForSelector(".vuelo .vuelo-cloud");
      // click the CORRECT cloud with the real mouse so the pointer stays parked
      const target = await pg.evaluate(async () => {
        const { SETS } = await import("./js/verbs.js");
        const { conjugate, PERSONS } = await import("./js/conjugator.js");
        const [personLabel, inf] = document.querySelector(".vuelo-prompt").textContent.split(" · ");
        const verb = SETS[0].verbs.find((v) => v.inf === inf);
        const form = conjugate(verb, "present")[PERSONS.indexOf(personLabel)];
        return [...document.querySelectorAll(".vuelo-cloud")].findIndex((c) => c.textContent === form);
      });
      const box = await pg.locator(".vuelo-cloud").nth(target).boundingBox();
      const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
      await pg.mouse.click(cx, cy);
      await pg.waitForTimeout(750); // next prompt deals fresh clouds
      if (!(await pg.locator(".vuelo-sky.no-hover").count()))
        fail("m20-3: fresh sky missing the no-hover guard");
      // M22: cloud states signal via BACKGROUND (not borders). Under the
      // guard, the cloud beneath the parked pointer must match its
      // unhovered siblings — no phantom hover tint.
      const bgs = await pg.evaluate(([x, y]) => {
        const parked = document.elementFromPoint(x, y)?.closest(".vuelo-cloud");
        const clouds = [...document.querySelectorAll(".vuelo-cloud")];
        const sibling = clouds.find((c) => c !== parked);
        return {
          parked: parked ? getComputedStyle(parked).backgroundColor : "none",
          sibling: sibling ? getComputedStyle(sibling).backgroundColor : "none",
        };
      }, [cx, cy]);
      if (bgs.parked !== "none" && bgs.parked !== bgs.sibling)
        fail(`m20-3: cloud under parked pointer shows phantom hover tint (${bgs.parked} vs ${bgs.sibling})`);
      // move WITHIN the sky (to another cloud's center — a fixed offset was
      // flaky: depending on which shuffled cloud was correct it could exit
      // the sky, where the pointermove listener never fires). Same semantics
      // as the .choice grid test: hover restores on movement within the grid.
      const other = await pg.locator(".vuelo-cloud").nth(1).boundingBox();
      const ox = other.x + other.width / 2, oy = other.y + other.height / 2;
      await pg.mouse.move(ox, oy);
      await pg.waitForTimeout(60);
      if (await pg.locator(".vuelo-sky.no-hover").count())
        fail("m20-3: no-hover must clear on real pointer movement");
      const hoverBg = await pg.evaluate(([x, y]) => {
        const c = document.elementFromPoint(x, y)?.closest(".vuelo-cloud");
        return c ? getComputedStyle(c).backgroundColor : "none";
      }, [ox, oy]);
      if (hoverBg === bgs.sibling)
        fail("m20-3: hover tint must return once the pointer really moves");
    }
    await pg.close();
    ok(`M20 a11y sprint (${theme}): done-card ink + primary-button ink${theme === "light" ? " + cloud sticky-hover guard" : ""} verified`);
  }
}

// ---------- M21 "La Travesía": traversal, listen-first + ABC toggle, sky stages ----------
{
  const intoFlight = async (pg) => {
    await pg.goto(`${BASE}/#/play/1/present/match`);
    await pg.waitForSelector(".match-card");
    const r = await pg.evaluate(async () => {
      const { SETS } = await import("./js/verbs.js");
      const { conjugate, PERSONS } = await import("./js/conjugator.js");
      const left = [...document.querySelectorAll(".match-col.left .match-card:not(.done)")];
      for (const l of left) {
        const [personLabel, inf] = l.textContent.split(" · ");
        const verb = SETS[0].verbs.find((v) => v.inf === inf);
        const form = conjugate(verb, "present")[PERSONS.indexOf(personLabel)];
        const rc = [...document.querySelectorAll(".match-col.right .match-card")]
          .find((x) => x.textContent === form && !x.disabled);
        if (!rc) return "missing card";
        l.click(); rc.click();
        await new Promise((res) => setTimeout(res, 40));
      }
      return "ok";
    });
    if (r !== "ok") fail(`m21 setup: ${r}`);
    await pg.waitForSelector(".vuelo-invite");
    await pg.click(".vuelo-invite");
    await pg.waitForSelector(".vuelo .vuelo-cloud");
  };
  const answerOne = (pg) => pg.evaluate(async () => {
    const { SETS } = await import("./js/verbs.js");
    const { conjugate, PERSONS } = await import("./js/conjugator.js");
    const [personLabel, inf] = document.querySelector(".vuelo-prompt").textContent.split(" · ");
    const verb = SETS[0].verbs.find((v) => v.inf === inf);
    const form = conjugate(verb, "present")[PERSONS.indexOf(personLabel)];
    [...document.querySelectorAll(".vuelo-cloud")].find((c) => c.textContent === form).click();
  });

  // clips context → listen-first: prompt hidden, ear + toggle present
  const trav = await browser.newPage();
  trackErrors(trav);
  await intoFlight(trav);
  if (!(await trav.locator(".vuelo.vuelo-listen").count())) fail("m21: listen mode missing with audio");
  if ((await trav.locator(".vuelo-prompt").evaluate((n) => getComputedStyle(n).display)) !== "none")
    fail("m21: written prompt must hide in listen mode");
  if (!(await trav.locator(".vuelo-ear").count())) fail("m21: 🎧 ear cue missing");
  const abc = trav.locator(".vuelo-text-toggle");
  if ((await abc.getAttribute("aria-pressed")) !== "false") fail("m21: ABC toggle should start unpressed");
  await abc.click();
  if ((await trav.locator(".vuelo-prompt").evaluate((n) => getComputedStyle(n).display)) === "none")
    fail("m21: ABC toggle must reveal the written prompt");
  if ((await abc.getAttribute("aria-pressed")) !== "true") fail("m21: ABC toggle aria-pressed must update");
  // journey strip: 6 puffs + nest + Lola at the start
  if ((await trav.locator(".vuelo-puff").count()) !== 6) fail("m21: expected 6 journey puffs");
  if (!(await trav.locator(".vuelo-journey-nest").count())) fail("m21: journey nest missing");
  if ((await trav.locator(".vuelo-card").getAttribute("data-step")) !== "0") fail("m21: journey should start at step 0");
  // one correct answer → Lola advances one puff, sky stage ticks
  await answerOne(trav);
  await trav.waitForTimeout(760);
  if ((await trav.locator(".vuelo-card").getAttribute("data-step")) !== "1") fail("m21: data-step should advance to 1");
  if ((await trav.locator(".vuelo-puff-done").count()) !== 1) fail("m21: first puff should fill");
  const prog = await trav.locator(".vuelo-journey").evaluate((n) => n.style.getPropertyValue("--vuelo-progress"));
  if (Math.abs(parseFloat(prog) - 1 / 6) > 0.01) fail(`m21: --vuelo-progress should be 1/6, got ${prog}`);
  // finish the journey → landing at step 6, all puffs filled
  for (let k = 0; k < 5; k++) { await answerOne(trav); await trav.waitForTimeout(760); }
  await trav.waitForSelector(".vuelo-landing");
  if ((await trav.locator(".vuelo-card").getAttribute("data-step")) !== "6") fail("m21: landing should be step 6");
  if ((await trav.locator(".vuelo-puff-done").count()) !== 6) fail("m21: all puffs should fill at landing");
  if (await trav.locator(".vuelo-text-toggle").count()) fail("m21: ABC toggle should retire at landing");
  await trav.screenshot({ path: `${SHOTS}/m21-travesia-landing.png` });
  await trav.close();
  ok("M21 travesía: listen-first + ABC toggle, puff-by-puff traversal, sky stages, landing at the nest");

  // muted context: clips available but sound off → text prompts, no ear affordances
  const muted = await browser.newPage();
  trackErrors(muted);
  await muted.addInitScript(() => {
    localStorage.setItem("conjuga.v1", JSON.stringify({ settings: { sound: false }, best: {} }));
  });
  await intoFlight(muted);
  if (await muted.locator(".vuelo.vuelo-listen").count()) fail("m21 muted: listen mode must not engage with sound off");
  if ((await muted.locator(".vuelo-prompt").evaluate((n) => getComputedStyle(n).display)) === "none")
    fail("m21 muted: text prompt must show when sound is off");
  if (await muted.locator(".vuelo-text-toggle").count()) fail("m21 muted: no ABC toggle in text mode");
  if (await muted.locator(".vuelo-replay").count()) fail("m21 muted: no replay affordance with sound off");
  await muted.close();
  ok("M21 travesía: muted device gets text prompts with no dangling audio affordances");
}

// ---------- M22: clouds are cloud-shaped (prado-visual-craft lock) ----------
{
  const shape = await browser.newPage();
  trackErrors(shape);
  await shape.goto(`${BASE}/?m18demo=1#/play/1/present/match`);
  await shape.waitForSelector(".match-card");
  const sr = await shape.evaluate(async () => {
    const { SETS } = await import("./js/verbs.js");
    const { conjugate, PERSONS } = await import("./js/conjugator.js");
    const left = [...document.querySelectorAll(".match-col.left .match-card:not(.done)")];
    for (const l of left) {
      const [personLabel, inf] = l.textContent.split(" · ");
      const verb = SETS[0].verbs.find((v) => v.inf === inf);
      const form = conjugate(verb, "present")[PERSONS.indexOf(personLabel)];
      const rc = [...document.querySelectorAll(".match-col.right .match-card")]
        .find((x) => x.textContent === form && !x.disabled);
      if (!rc) return "missing card";
      l.click(); rc.click();
      await new Promise((res) => setTimeout(res, 40));
    }
    return "ok";
  });
  if (sr !== "ok") fail(`m22 setup: ${sr}`);
  await shape.waitForSelector(".vuelo-invite");
  await shape.click(".vuelo-invite");
  await shape.waitForSelector(".vuelo .vuelo-cloud");
  const cloud = await shape.evaluate(() => {
    const c = document.querySelector(".vuelo-cloud");
    const s = getComputedStyle(c);
    const p1 = getComputedStyle(c, "::before");
    const p2 = getComputedStyle(c, "::after");
    return {
      filter: s.filter, border: s.borderTopWidth, maxWidth: s.maxWidth,
      puff1: { w: p1.width, r: p1.borderRadius, bg: p1.backgroundColor },
      puff2: { w: p2.width, r: p2.borderRadius, bg: p2.backgroundColor },
      bg: s.backgroundColor,
      sky: getComputedStyle(document.querySelector(".vuelo-sky")).backgroundColor,
    };
  });
  if (!/drop-shadow/.test(cloud.filter)) fail("m22: cloud silhouette needs its drop-shadow");
  if (cloud.border !== "0px") fail("m22: clouds are borderless (states signal via background)");
  if (cloud.maxWidth !== "230px") fail("m22: cloud width cap missing (360px bar regression)");
  for (const [i, p] of [cloud.puff1, cloud.puff2].entries()) {
    if (p.r !== "50%") fail(`m22: puff ${i + 1} must be a circle, got radius ${p.r}`);
    if (p.bg !== cloud.bg) fail(`m22: puff ${i + 1} must inherit the cloud background (${p.bg} vs ${cloud.bg})`);
    if (parseFloat(p.w) < 24) fail(`m22: puff ${i + 1} too small to read (${p.w})`);
  }
  if (cloud.sky === "rgba(0, 0, 0, 0)") fail("m22: sky wash missing behind the cloud grid");
  await shape.close();
  ok("M22 clouds: puff silhouette (inherited backgrounds), drop-shadow, borderless states, width cap, sky wash");
}

// ---------- M25.1 PWA: manifest links, parses, icons resolve ----------
{
  const html = await (await fetch(`${BASE}/index.html`)).text();
  if (!html.includes('rel="manifest"')) fail("m25.1: index.html missing manifest link");
  if (!html.includes('name="theme-color"')) fail("m25.1: index.html missing theme-color meta");
  const res = await fetch(`${BASE}/manifest.webmanifest`);
  if (res.status !== 200) fail("m25.1: manifest.webmanifest not served");
  let man = null;
  try { man = await res.json(); } catch { fail("m25.1: manifest is not valid JSON"); }
  // iOS: dedicated FULL-BLEED touch icon (transparent corners composite
  // onto black on the home screen) + stable manifest id.
  if (!html.includes('rel="apple-touch-icon"')) fail("m25.1: index.html missing apple-touch-icon link");
  {
    const r = await fetch(`${BASE}/icons/apple-touch-icon.png`);
    const buf = new Uint8Array(await r.arrayBuffer());
    if (r.status !== 200 || buf[0] !== 0x89 || buf[1] !== 0x50) {
      fail("m25.1: icons/apple-touch-icon.png does not resolve to a PNG");
    }
  }
  if (man) {
    if (man.id !== "./") fail("m25.1: manifest id missing/wrong");
    if (man.display !== "standalone" || man.start_url !== ".") fail("m25.1: manifest display/start_url wrong");
    const purposes = (man.icons || []).map((i) => i.purpose || "any");
    if (!purposes.includes("maskable")) fail("m25.1: manifest lacks a maskable icon");
    if (!purposes.includes("any")) fail("m25.1: manifest lacks a purpose-any icon");
    for (const icon of man.icons || []) {
      const r = await fetch(`${BASE}/${icon.src}`);
      const buf = new Uint8Array(await r.arrayBuffer());
      if (r.status !== 200 || buf[0] !== 0x89 || buf[1] !== 0x50) {
        fail(`m25.1: icon ${icon.src} does not resolve to a PNG`);
      }
    }
  }
  ok("M25.1 PWA: manifest links, parses, and all icons resolve as PNGs");
}

// ---------- M25.3 ⬇️ Descargas: download/resume/delete + voiceless fallback ----------
{
  // Voiceless context first (the main page keeps its manifest-204 stub):
  // the screen must render its "audio unreachable" message, no rows.
  await page.goto(`${BASE}/#/descargas`);
  await page.waitForSelector(".dl-unavailable");
  if (await page.locator(".dl-row").count()) fail("m25.3: rows rendered without a clip manifest");
  await assertNoStrayNull("descargas-voiceless");

  // Real-manifest context (own page, SW-free — the Cache API needs no SW):
  // stub every clip mp3 with tiny bytes so "downloads" stay instant.
  const dlPage = await browser.newPage({ viewport: { width: 900, height: 900 } });
  trackErrors(dlPage);
  const FAKE_MP3 = Buffer.from("ID3fakeclip");
  await dlPage.route("**/audio/clips/*.mp3", (r) =>
    r.fulfill({ status: 200, contentType: "audio/mpeg", body: FAKE_MP3 }));
  await dlPage.goto(`${BASE}/#/descargas`);
  await dlPage.waitForSelector(".dl-row");
  const rows = await dlPage.locator(".dl-row").count();
  if (rows !== 20) fail(`m25.3: expected 20 group rows, got ${rows}`);
  if (!(await dlPage.locator(".dl-all").count())) fail("m25.3: download-all button missing");
  if (!(await dlPage.locator(".dl-warning").count())) fail("m25.3: iOS eviction warning missing");

  // ☰ menu links the screen (Estudia-links rule analogue for site chrome).
  if (!(await dlPage.locator('.menu-panel a[href="#/descargas"]').count())) {
    fail("m25.3: ☰ menu missing the Descargas link");
  }

  // Group 1: download fills audio-g01 with every derived clip URL.
  const g1 = dlPage.locator(".dl-row").first();
  await g1.locator(".dl-btn").click();
  await dlPage.waitForFunction(
    () => document.querySelector(".dl-row .dl-status")?.textContent?.includes("Descargado"),
    { timeout: 30000 },
  );
  const cacheInfo = await dlPage.evaluate(async () => {
    const keys = await caches.keys();
    const cache = await caches.open("audio-g01");
    return { keys, count: (await cache.keys()).length };
  });
  if (!cacheInfo.keys.includes("audio-g01")) fail("m25.3: audio-g01 cache not created");
  // Prefixed + bare shapes, both speeds; dupes (ser/ir preterite,
  // imperfect yo=él) lower the ceiling — see tests/descargas.test.mjs.
  if (cacheInfo.count < 320 || cacheInfo.count > 360) {
    fail(`m25.3: audio-g01 holds ${cacheInfo.count} clips (expected 320-360)`);
  }
  if ((await g1.locator(".dl-btn").isVisible())) fail("m25.3: download button still visible after completion");

  // Delete: cache disappears, button returns.
  await g1.locator(".dl-del").click();
  await dlPage.waitForFunction(async () => !(await caches.has("audio-g01")));
  await dlPage.waitForFunction(() => {
    const btn = document.querySelector(".dl-row .dl-btn");
    return btn && !btn.hidden;
  });
  ok("m25.3 descargas: 20 rows, ☰ link, group download fills audio-g01, delete clears it, voiceless fallback message");

  await dlPage.evaluate(async () => { for (const k of await caches.keys()) await caches.delete(k); });
  await dlPage.close();
}

// ---------- M26 ⏭️🔄 stretch tenses: cards, Estudia, Práctica, unscored ----------
{
  // Set screen: two stretch cards, star-free, linking to study only.
  await page.goto(`${BASE}/#/set/1`);
  await page.waitForSelector(".stretch-card");
  if ((await page.locator(".stretch-card").count()) !== 2) fail("m26: expected 2 stretch cards");
  if (await page.locator(".stretch-row .star").count()) fail("m26: stretch cards must be unscored — no stars");
  if (!(await page.locator('.stretch-card[href="#/study/1/nearfuture"]').count())) {
    fail("m26: nearfuture card must link to study");
  }

  // Estudia nearfuture (group 1): ir a + infinitive phrases, RAE forms.
  await page.click('.stretch-card[data-stretch="nearfuture"]');
  await page.waitForSelector(".conj-table");
  const nfText = await page.locator(".conj-table").innerText();
  for (const form of ["voy a ser", "vas a estar", "va a tener", "vamos a hacer", "van a ir"]) {
    if (!nfText.includes(form)) fail(`m26: study nearfuture missing "${form}"`);
  }
  // Action row: Práctica + print ONLY — no scored-game links for stretch.
  if (await page.locator('.study-actions a[href*="/play/"]').count()) {
    fail("m26: stretch study must not link scored games");
  }
  if (!(await page.locator(".study-actions .practica-link").count())) fail("m26: stretch study missing Práctica link");
  // Voiceless harness context: no clips for stretch texts and no TTS →
  // cells must be plain (a silent 🔊 button would break rule 1).
  if (await page.locator(".conj-table .cell-speak").count()) {
    fail("m26: stretch study rendered speak buttons with no playable backend");
  }
  await assertNoStrayNull("study-nearfuture");

  // Estudia progressive (group 2): irregular gerunds diciendo/pudiendo/viendo.
  await page.goto(`${BASE}/#/study/2/progressive`);
  await page.waitForSelector(".conj-table");
  const pgText = await page.locator(".conj-table").innerText();
  for (const form of ["estoy diciendo", "estás pudiendo", "está viendo", "estamos dando", "están sabiendo"]) {
    if (!pgText.includes(form)) fail(`m26: study progressive missing "${form}"`);
  }

  // Práctica nearfuture (group 1): bank of 5 phrase tiles; a correct
  // placement fills the cell.
  await page.goto(`${BASE}/#/practica/1/nearfuture`);
  await page.waitForSelector(".bank-tile");
  if ((await page.locator(".bank-tile").count()) !== 5) fail("m26: práctica stretch bank should hold 5 tiles");
  await page.locator(".bank-tile", { hasText: "voy a ser" }).first().click();
  await page.locator("tbody tr", { hasText: "yo" }).first().locator(".drop-slot").click();
  await page.waitForSelector(".practica-cell.filled");
  const filled = await page.locator(".practica-cell.filled").innerText();
  if (!filled.includes("voy a ser")) fail(`m26: práctica placed "${filled}" instead of "voy a ser"`);
  await assertNoStrayNull("practica-nearfuture");

  // Stretch never reaches play routes: the router bounces to home.
  await page.goto(`${BASE}/#/play/1/nearfuture/choice`);
  await page.waitForSelector(".set-card");
  if ((await page.locator(".set-card").count()) !== 20) fail("m26: stretch play route must fall back to home");

  ok("M26 stretch: set cards (unscored), Estudia RAE phrases, Práctica placement, voiceless parity, no play routes");
}

// ---------- M29.1 🍎 class pack: sheets, keys, print emulation ----------
{
  await page.goto(`${BASE}/#/set/1`);
  await page.waitForSelector(".teacher-line");
  if (!(await page.locator('.pack-link[href="#/pack/1"]').count())) fail("m29.1: set screen missing the pack link");

  await page.click(".pack-link");
  await page.waitForSelector(".pack-sheet");
  // M29.2 station card + 5 blank sheets (3 core + 2 stretch) + 5 keys.
  const sheets = await page.locator(".pack-sheet:not(.pack-key):not(.pack-station)").count();
  const keys = await page.locator(".pack-key").count();
  if (sheets !== 5) fail(`m29.1: expected 5 blank sheets, got ${sheets}`);
  if (keys !== 5) fail(`m29.1: expected 5 answer keys, got ${keys}`);
  // Station QR: present, resolves as an SVG, alt text names the group.
  if ((await page.locator(".pack-station .station-qr").count()) !== 1) fail("m29.2: station QR missing");
  const qrRes = await fetch(`${BASE}/qr/g01.svg`);
  if (qrRes.status !== 200 || !(await qrRes.text()).startsWith("<svg")) {
    fail("m29.2: qr/g01.svg does not resolve as an SVG");
  }
  // Blank sheets are actually blank; keys carry RAE forms incl. stretch.
  const blankText = await page.locator(".pack-sheet:not(.pack-key) .pack-blank").first().innerText();
  if (blankText.trim() !== "") fail("m29.1: blank cell is not blank");
  const keysText = await page.locator(".pack-keys").innerText();
  for (const form of ["soy", "fuiste", "éramos", "voy a ser", "estoy siendo"]) {
    if (!keysText.includes(form)) fail(`m29.1: answer keys missing "${form}"`);
  }
  // Print emulation: chrome + screen-only helpers vanish, sheets remain.
  await page.emulateMedia({ media: "print" });
  const printState = await page.evaluate(() => ({
    crumbs: getComputedStyle(document.querySelector(".crumbs")).display,
    actions: getComputedStyle(document.querySelector(".pack-actions")).display,
    teacherSheet: getComputedStyle(document.querySelector(".pack-sheet")).display,
    breakAfter: getComputedStyle(document.querySelector(".pack-sheet")).breakAfter,
  }));
  await page.emulateMedia({ media: "screen" });
  if (printState.crumbs !== "none") fail("m29.1: crumbs visible in print");
  if (printState.actions !== "none") fail("m29.1: print button visible in print");
  if (printState.teacherSheet === "none") fail("m29.1: sheets hidden in print");
  if (printState.breakAfter !== "page") fail(`m29.1: sheets missing page breaks (${printState.breakAfter})`);
  await assertNoStrayNull("pack");
  // Teacher landing section on about.html (M29.2 go-live content).
  const aboutRes = await fetch(`${BASE}/about.html`);
  const aboutHtml = await aboutRes.text();
  if (!aboutHtml.includes("Para maestros")) fail("m29.2: about.html missing the teacher section");
  ok("M29 teacher mode: pack link, station QR resolves, 5 sheets + 5 keys, print emulation, about section");
}

// ---------- M25.4 📲 install UX: ☰ row, panel steps, Descargas link ----------
{
  await page.goto(`${BASE}/`);
  await page.waitForSelector(".set-card");
  await page.click(".menu-btn");
  if (!(await page.locator(".menu-panel .install-link").count())) {
    fail("m25.4: ☰ menu missing the install row");
  }
  await page.click(".menu-panel .install-link");
  await page.waitForSelector(".install-panel");
  // No beforeinstallprompt in the harness → generic steps, never the
  // install-now button; the panel links to Descargas.
  if (await page.locator(".install-panel .install-now").count()) {
    fail("m25.4: install-now button rendered without a captured prompt");
  }
  if ((await page.locator(".install-panel .install-steps li").count()) < 2) {
    fail("m25.4: install steps missing");
  }
  if (!(await page.locator('.install-panel a[href="#/descargas"]').count())) {
    fail("m25.4: install panel missing the Descargas link");
  }
  await page.keyboard.press("Escape");
  if (await page.locator(".install-panel").count()) fail("m25.4: Escape did not close the install panel");
  await assertNoStrayNull("install-panel");
  ok("m25.4 install UX: ☰ row opens the panel, steps + Descargas link, Escape closes");
}

// ---------- M25.2 PWA: SW registers (gated), offline shell, query preservation ----------
{
  // Fresh context: SW registrations are per-context, so nothing here can
  // leak into the other blocks (which stay SW-free via the webdriver gate).
  const swPage = await browser.newPage({ viewport: { width: 900, height: 900 } });
  trackErrors(swPage);
  await swPage.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  await swPage.goto(`${BASE}/`);
  await swPage.waitForSelector(".set-card");
  await swPage.evaluate(() => navigator.serviceWorker.ready);
  const controlled = await swPage.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return !!(reg && reg.active);
  });
  if (!controlled) fail("m25.2: service worker did not reach active state");

  // Offline: the whole shell must come from the VERSION cache.
  await swPage.context().setOffline(true);
  await swPage.reload();
  await swPage.waitForSelector(".set-card");
  const offlineCards = await swPage.locator(".set-card").count();
  if (offlineCards !== 20) fail(`m25.2: offline shell rendered ${offlineCards}/20 set cards`);

  // Offline navigation WITH a querystring: ignoreSearch fallback serves
  // the shell AND the query survives in location.search.
  await swPage.goto(`${BASE}/?m18demo=1`);
  await swPage.waitForSelector(".set-card");
  const offSearch = await swPage.evaluate(() => location.search);
  if (offSearch !== "?m18demo=1") fail(`m25.2: offline query lost, got "${offSearch}"`);

  // Back online: querystrings pass through untouched (no ignoreSearch).
  await swPage.context().setOffline(false);
  await swPage.goto(`${BASE}/?m18demo=1`);
  await swPage.waitForSelector(".set-card");
  const onSearch = await swPage.evaluate(() => location.search);
  if (onSearch !== "?m18demo=1") fail(`m25.2: online query lost, got "${onSearch}"`);

  // The registration gate itself: a page with conjuga.noSW must not register.
  const noSwPage = await browser.newPage({ viewport: { width: 900, height: 900 } });
  trackErrors(noSwPage);
  await noSwPage.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    sessionStorage.setItem("conjuga.noSW", "1");
  });
  await noSwPage.goto(`${BASE}/`);
  await noSwPage.waitForSelector(".set-card");
  const gated = await noSwPage.evaluate(async () => !(await navigator.serviceWorker.getRegistration()));
  if (!gated) fail("m25.2: conjuga.noSW gate did not prevent registration");
  await noSwPage.close();

  // Clean up so this block leaves no trace for reruns against the same browser.
  await swPage.evaluate(async () => {
    for (const reg of await navigator.serviceWorker.getRegistrations()) await reg.unregister();
    for (const key of await caches.keys()) await caches.delete(key);
  });
  await swPage.close();
  ok("M25.2 PWA: SW active, offline shell (20 groups), ?m18demo=1 preserved offline+online, noSW gate holds");
}

// ---------- M30.1 ⭐ durability: a populated legacy profile renders stars AND badges ----------
{
  // The suites' other seeds round-trip within one session; THIS fixture
  // simulates a returning learner: realistic pre-existing data, incl. a
  // legacy at-less entry, loaded by the CURRENT build. It exists so a
  // selective star-read break can never hide behind the static 🎧
  // iconography again (2026-07-19 owner report).
  const profilePage = await browser.newPage({ viewport: { width: 900, height: 900 } });
  trackErrors(profilePage);
  await profilePage.route("**/audio/manifest.json", (r) => r.fulfill({ status: 204 }));
  await profilePage.addInitScript(() => {
    localStorage.setItem("conjuga.v1", JSON.stringify({
      settings: { vosotros: false, sound: true, hints: true },
      best: {
        "1.present.choice": { score: 10, total: 10, stars: 3, plays: 2, at: 1752000000000 },
        "1.present.type": { score: 8, total: 10, stars: 2, plays: 1, at: 1752000000000 },
        "1.present.match": { score: 6, total: 6, stars: 3, plays: 1 }, // legacy: no `at`
        "1.preterite.choice": { score: 9, total: 10, stars: 2, plays: 1, at: 1752000000000 },
        "1.past.contrast": { score: 10, total: 10, stars: 3, plays: 1, at: 1752000000000 },
        "2.present.listen": { score: 10, total: 10, stars: 3, plays: 1, at: 1752000000000 },
      },
    }));
  });
  await profilePage.goto(`${BASE}/`);
  await profilePage.waitForSelector(".set-card");
  const card1 = await profilePage.locator(".set-card").nth(0).innerText();
  const card2 = await profilePage.locator(".set-card").nth(1).innerText();
  if (!card1.includes("⭐ 13/30")) fail(`m30.1: group 1 should show ⭐ 13/30, got "${card1}"`);
  if (!card2.includes("🎧 3/9")) fail(`m30.1: group 2 should show earned badges 🎧 3/9, got "${card2}"`);
  if (!card2.includes("⭐ 0/30")) fail("m30.1: group 2 stars should be 0/30 (badges are a separate track)");
  // informe totals agree with the same data
  await profilePage.goto(`${BASE}/#/informe`);
  const informe = await profilePage.locator("#app").innerText();
  if (!informe.includes("13")) fail("m30.1: informe missing group 1 star total");
  await profilePage.close();
  ok("M30.1 durability: legacy populated profile renders ⭐ 13/30 + 🎧 3/9 (stars and badges together)");
}

// ---------- M28.2 📊 beacon guards: the harness must fire ZERO analytics requests ----------
{
  let beacons = 0;
  const guardPage = await browser.newPage({ viewport: { width: 900, height: 900 } });
  trackErrors(guardPage);
  await guardPage.route("**/beacon", (r) => { beacons++; r.fulfill({ status: 204 }); });
  // webdriver context (like the whole suite): must stay silent
  await guardPage.goto(`${BASE}/`);
  await guardPage.waitForSelector(".set-card");
  await guardPage.click('a[href="#/set/1"]');
  await guardPage.waitForSelector(".tense-card");
  // even with webdriver hidden, localhost + GPC must each block
  await guardPage.close();
  const gpcPage = await browser.newPage({ viewport: { width: 900, height: 900 } });
  trackErrors(gpcPage);
  await gpcPage.route("**/beacon", (r) => { beacons++; r.fulfill({ status: 204 }); });
  await gpcPage.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    Object.defineProperty(navigator, "globalPrivacyControl", { get: () => true });
  });
  await gpcPage.goto(`${BASE}/`);
  await gpcPage.waitForSelector(".set-card");
  await gpcPage.close();
  if (beacons !== 0) fail(`m28.2: ${beacons} beacon request(s) escaped the guards`);
  ok("M28.2 beacon guards: zero analytics requests from webdriver, localhost, and GPC contexts");
}

// ---------- M30.2 ☰ hamburger overhaul: scrim, settings group, dialog above menu ----------
{
  await page.goto(`${BASE}/`);
  await page.waitForSelector(".set-card");
  await page.click(".menu-btn");
  await page.waitForSelector(".menu-panel:not([hidden])");
  // scrim: visible while open, visual-only (pointer-events none)
  const scrim = await page.evaluate(() => {
    const s = document.querySelector(".menu-scrim");
    const cs = getComputedStyle(s);
    return { hidden: s.hidden, pe: cs.pointerEvents, z: cs.zIndex };
  });
  if (scrim.hidden) fail("m30.2: scrim should show while the menu is open");
  if (scrim.pe !== "none") fail("m30.2: scrim must be visual-only (pointer-events none)");
  // settings group: collapsed by default, expands, a toggle actually applies
  if (await page.locator(".menu-settings:not([hidden])").count()) fail("m30.2: settings should start collapsed");
  await page.click(".settings-toggle");
  await page.waitForSelector(".menu-settings:not([hidden])");
  const hintsBefore = await page.locator(".setting-hints").getAttribute("aria-checked");
  await page.click(".setting-hints");
  await page.waitForSelector(".menu-btn"); // home re-renders on setting change
  const applied = await page.evaluate(() => JSON.parse(localStorage.getItem("conjuga.v1")).settings.hints);
  if (String(applied) === hintsBefore) fail("m30.2: hints toggle did not apply");
  // restore
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("conjuga.v1"));
    d.settings.hints = true;
    localStorage.setItem("conjuga.v1", JSON.stringify(d));
  });

  // install dialog: opening it CLOSES the menu and renders ON TOP
  await page.reload();
  await page.waitForSelector(".set-card");
  await page.click(".menu-btn");
  await page.waitForSelector(".menu-panel:not([hidden])");
  await page.click(".menu-panel .install-link");
  await page.waitForSelector(".install-panel");
  if (await page.locator(".menu-panel:not([hidden])").count()) fail("m30.2: menu must close when a dialog opens");
  const onTop = await page.evaluate(() => {
    const panel = document.querySelector(".install-panel");
    const r = panel.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + 10);
    return panel.contains(hit) || hit === panel;
  });
  if (!onTop) fail("m30.2: install dialog is not the topmost layer at its own center");
  await page.keyboard.press("Escape");
  await page.waitForSelector(".install-panel", { state: "detached" });
  ok("M30.2 hamburger: visual scrim, collapsed Ajustes group applies settings, dialogs close the menu and render on top");
}

// ---------- M30.3 ⌨️ keyboard-only pass through the drawer ----------
{
  await page.goto(`${BASE}/`);
  await page.waitForSelector(".set-card");
  await page.focus(".menu-btn");
  await page.keyboard.press("Enter");
  await page.waitForSelector(".menu-panel:not([hidden])");
  const seq = [];
  for (let i = 0; i < 7; i++) {
    seq.push(await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 10) ?? "?"));
    await page.keyboard.press("Tab");
  }
  if (!seq[0].startsWith("Inicio")) fail(`m30.3: first focus should be Inicio, got "${seq[0]}"`);
  if (!seq.some((s) => s.startsWith("Ajustes"))) fail(`m30.3: Tab order never reached Ajustes (${seq.join(",")})`);
  // keyboard focus is VISIBLE: the focused row takes the tint background
  await page.focus(".menu-panel .menu-link");
  await page.keyboard.press("Tab");
  const focusBg = await page.evaluate(() => getComputedStyle(document.activeElement).backgroundColor);
  if (focusBg === "rgba(0, 0, 0, 0)") fail("m30.3: keyboard focus on a menu row must be visibly styled");
  await page.keyboard.press("Escape");
  if (!(await page.evaluate(() => document.activeElement?.classList?.contains("menu-btn")))) {
    fail("m30.3: focus must return to ☰ after keyboard close");
  }
  ok("M30.3 keyboard: Tab traverses rows to Ajustes, focus visibly styled, Escape returns to ☰");
}

// ---------- M30.4 ⚙️ settings order, switch UX, stacked Tema, static-page nav ----------
{
  await page.goto(`${BASE}/`);
  await page.waitForSelector(".set-card");
  await page.click(".menu-btn");
  await page.click(".settings-toggle");
  await page.waitForSelector(".menu-settings:not([hidden])");
  // Owner order: Vosotros → Pistas → Sonido → Tema → Borrar. (Sonido is
  // gated off in this voiceless context — assert relative order of the rest.)
  const rowOrder = await page.evaluate(() =>
    [...document.querySelectorAll(".menu-settings > *")].map((n) => n.className.split(" ").pop()));
  const idx = (c) => rowOrder.findIndex((x) => x === c);
  if (!(idx("setting-vosotros") < idx("setting-hints") && idx("setting-hints") < idx("theme-selector") && idx("theme-selector") < idx("borrar-row"))) {
    fail(`m30.4: settings order wrong: ${rowOrder.join(",")}`);
  }
  // Switch UX: role=switch, visible track+thumb, toggling persists.
  const sw = await page.evaluate(() => {
    const s = document.querySelector(".setting-vosotros");
    return { role: s.getAttribute("role"), checked: s.getAttribute("aria-checked"), track: !!s.querySelector(".switch-track"), thumb: !!s.querySelector(".switch-thumb") };
  });
  if (sw.role !== "switch" || !sw.track || !sw.thumb) fail(`m30.4: vosotros row is not a switch control (${JSON.stringify(sw)})`);
  if (sw.checked !== "false") fail("m30.4: vosotros must default OFF");
  await page.click(".setting-vosotros");
  await page.waitForSelector(".set-card"); // re-render on setting change
  const vosNow = await page.evaluate(() => JSON.parse(localStorage.getItem("conjuga.v1")).settings.vosotros);
  if (vosNow !== true) fail("m30.4: vosotros switch did not persist");
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("conjuga.v1"));
    d.settings.vosotros = false;
    localStorage.setItem("conjuga.v1", JSON.stringify(d));
  });
  // Tema stacked: label above, options underneath.
  await page.reload();
  await page.waitForSelector(".set-card");
  await page.click(".menu-btn");
  await page.click(".settings-toggle");
  const stacked = await page.evaluate(() => getComputedStyle(document.querySelector(".theme-selector")).flexDirection);
  if (stacked !== "column") fail(`m30.4: Tema should stack label over options, got flex-direction ${stacked}`);
  await page.keyboard.press("Escape");

  // Static pages carry the same drawer, and settings apply live there.
  for (const [url, root] of [["about.html", "."], ["docs/", ".."]]) {
    const sp = await browser.newPage({ viewport: { width: 900, height: 900 } });
    trackErrors(sp);
    await sp.goto(`${BASE}/${url}`);
    await sp.waitForSelector(".static-nav .menu-btn");
    await sp.click(".menu-btn");
    await sp.waitForSelector(".menu-panel:not([hidden])");
    if ((await sp.locator(".menu-panel a.menu-link").count()) < 5) fail(`m30.4: ${url} drawer missing nav links`);
    await sp.click(".settings-toggle");
    await sp.click('.theme-option[data-theme-value="dark"]');
    const themed = await sp.evaluate(() => document.documentElement.getAttribute("data-theme"));
    if (themed !== "dark") fail(`m30.4: theme change did not apply live on ${url}`);
    await sp.close();
  }
  ok("M30.4 menu polish: owner order, switch controls persist, Tema stacked, static pages share the live drawer");
}

// ---------- 🇪🇸 seasonal hero: Spain jersey in July 2026, auto-revert in August ----------
{
  const fakeNow = (iso) => `
    const RealDate = Date;
    const fixed = new RealDate("${iso}");
    window.Date = class extends RealDate {
      constructor(...a) { if (a.length === 0) { super(fixed.getTime()); } else { super(...a); } }
      static now() { return fixed.getTime(); }
    };`;
  const heroState = (p) => p.evaluate(() => {
    const svg = document.querySelector(".home-title .lola");
    return {
      jersey: !!svg.querySelector('[fill="#c8362f"]'),
      standard: !!svg.querySelector('[fill="var(--lola-body)"]'),
      lids: !!svg.querySelector(".lola-lids"),
      head: !!svg.querySelector(".lola-head"),
      idle: svg.classList.contains("is-idle"),
      hidden: svg.closest(".lola-wrap")?.getAttribute("aria-hidden"),
    };
  });

  // Mid-July 2026: the home hero wears the jersey, with every hook intact.
  const jul = await browser.newPage({ viewport: { width: 900, height: 900 } });
  trackErrors(jul);
  await jul.route("**/audio/manifest.json", (r) => r.fulfill({ status: 204 }));
  await jul.addInitScript(fakeNow("2026-07-25T12:00:00"));
  await jul.goto(`${BASE}/`);
  await jul.waitForSelector(".home-title .lola");
  const j = await heroState(jul);
  if (!j.jersey) fail("jersey: July 2026 home hero should wear the Spain jersey");
  if (!j.lids || !j.head) fail("jersey: animation hooks (.lola-head/.lola-lids) missing from the variant");
  if (!j.idle) fail("jersey: variant must keep the is-idle bob/blink class");
  if (j.hidden !== "true") fail("jersey: hero must stay aria-hidden (decorative)");
  const julGreeting = await jul.locator(".lola-greeting").innerText();
  if (!julGreeting.includes("felicita a España")) fail(`jersey: July greeting should congratulate Spain, got "${julGreeting}"`);
  // Every other screen keeps the standard owl, even in July.
  await jul.goto(`${BASE}/#/practica/1/present`);
  await jul.waitForSelector(".match-title .lola");
  const other = await jul.evaluate(() => !!document.querySelector(".match-title .lola [fill=\"#c8362f\"]"));
  if (other) fail("jersey: non-home screens must keep the standard Lola");
  await jul.close();

  // August 2026: the standard owl is back on home — no deploy needed.
  const aug = await browser.newPage({ viewport: { width: 900, height: 900 } });
  trackErrors(aug);
  await aug.route("**/audio/manifest.json", (r) => r.fulfill({ status: 204 }));
  await aug.addInitScript(fakeNow("2026-08-02T12:00:00"));
  await aug.goto(`${BASE}/`);
  await aug.waitForSelector(".home-title .lola");
  const a = await heroState(aug);
  if (a.jersey) fail("jersey: August must auto-revert to the standard Lola");
  if (!a.standard) fail("jersey: August hero should be the token-colored standard owl");
  const augGreeting = await aug.locator(".lola-greeting").innerText();
  if (!augGreeting.includes("¡Hola! Soy Lola la Lechuza.")) fail(`jersey: August greeting must revert, got "${augGreeting}"`);
  await aug.close();
  ok("🇪🇸 seasonal hero: jersey in July 2026 (hooks + aria intact, home only), standard owl from August");
}

// ---------- wrap up ----------
if (errors.length) fail(`console/page errors: ${JSON.stringify(errors)}`);
await browser.close();
server.close();

if (failures.length) {
  console.error(`\nE2E FAILED — ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nE2E PASSED");
