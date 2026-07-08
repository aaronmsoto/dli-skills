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
if (!greeting.includes("Lola la Lechuza")) fail(`home: greeting missing, got "${greeting}"`);
await page.screenshot({ path: `${SHOTS}/home.png` });
ok("home renders 20 groups + Lola greeter");

// ---------- set screen ----------
await page.click('a[href="#/set/1"]');
await page.waitForSelector(".tense-card");
if ((await page.locator(".tense-card").count()) !== 3) fail("set: expected 3 tense cards");
if ((await page.locator(".mode-card").count()) !== 6) fail("set: expected 6 activity cards");
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
      speak: (u) => window.__spoken.push({ text: u.text, rate: u.rate }),
    },
  });
  window.SpeechSynthesisUtterance = function (text) { this.text = text; };
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
if ((await voiced.locator(".mode-card").count()) !== 7) fail("escucha: voiced set screen should show 7 activity cards");
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

// mute stops speech
await voiced.goto(`${BASE}/#/study/1/present`);
await voiced.waitForSelector(".sound-toggle");
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
const darkBody = await darkPage.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--lola-body").trim());
if (darkBody.toLowerCase() !== "#a8834e") fail(`dark mode: expected dark Lola body token, got "${darkBody}"`);
await darkPage.screenshot({ path: `${SHOTS}/home-dark.png` });
await darkPage.close();
ok("dark mode: Lola dark palette active");

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
  if (!hrefs.some(([h]) => h.includes("nj.gov/education/standards/worldlang"))) fail("footer: NJSLS-WL link missing");
  if (!hrefs[0][0].includes("nbpts.org")) fail("footer: NBPTS must come first (owner order, 2026-07-08)");
  if (!hrefs.some(([h]) => h.includes("nbpts.org") && h.includes("ECYA-WL"))) fail("footer: NBPTS ECYA-WL link missing");
  if (hrefs.some(([, rel]) => !rel.includes("noopener"))) fail("footer: standards links need rel=noopener");
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
  const ROUTES = ["#/", "#/set/1", "#/study/1/present", "#/practica/1/present",
    "#/play/1/present/choice", "#/play/1/present/type", "#/play/1/present/match",
    "#/play/1/contrast", "#/informe"];
  for (const r of ROUTES) {
    await page.goto(`${BASE}/${r}`);
    await page.reload();
    await page.waitForSelector(".info-btn", { timeout: 4000 }).catch(() => fail(`info: ℹ️ button missing on ${r}`));
  }
  // open on the study screen: dialog semantics, content, Esc closes, focus returns
  await page.goto(`${BASE}/#/study/1/present`);
  await page.reload();
  await page.waitForSelector(".info-btn");
  await page.locator(".info-btn").click();
  await page.waitForSelector('.info-panel[role="dialog"]');
  const kid = await page.locator(".info-kid").innerText();
  if (!kid.includes("tabla")) fail(`info: study kid-line wrong — "${kid}"`);
  const cites = await page.locator(".info-cites").innerText();
  if (!/7\.1\./.test(cites)) fail(`info: study panel must cite NJSLS — "${cites}"`);
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
  // contrast tokens: credits no longer translucent; light star is the AA-passing amber
  const creditsOpacity = await page.evaluate(() => getComputedStyle(document.querySelector(".footer-credits")).opacity);
  if (creditsOpacity !== "1") fail(`contrast: footer credits must not be translucent, opacity=${creditsOpacity}`);
  const starTok = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--star").trim());
  if (!starTok.startsWith("#d97706")) fail(`contrast: light --star should be #d97706, got "${starTok}"`);
  const darkStar = await browser.newPage({ colorScheme: "dark" });
  trackErrors(darkStar);
  await darkStar.goto(`${BASE}/#/`);
  await darkStar.waitForSelector(".set-card");
  const starDark = await darkStar.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--star").trim());
  if (!starDark.startsWith("#f59e0b")) fail(`contrast: dark --star should stay #f59e0b, got "${starDark}"`);
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
  if (await docs.locator("td.pending").count()) fail("usability page: no findings should remain in owner triage");
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
    for (const r of ["#/", "#/set/1", "#/study/1/present", "#/practica/1/present", "#/play/1/present/choice", "#/play/1/contrast", "#/informe"]) {
      await axePage.goto(`${BASE}/${r}`);
      await axePage.reload();
      await axePage.waitForSelector(".site-footer");
      await axePage.addScriptTag({ content: axeSource });
      const bad = await axePage.evaluate(async () => {
        const res = await window.axe.run(document, { resultTypes: ["violations"] });
        return res.violations
          .filter((v) => v.impact === "critical" || v.impact === "serious")
          .map((v) => `${v.id}(${v.impact}) ×${v.nodes.length} e.g. ${v.nodes[0]?.target?.join(" ")}`);
      });
      if (bad.length) fail(`axe ${r}: ${bad.join(" | ")}`);
    }
    await axePage.close();
    ok("axe-core: zero critical/serious violations across 7 representative routes");
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
  await page.locator(".footer-controls .toggle input").first().check();
  await page.waitForSelector(".conj-table tbody tr:nth-child(6)");
  await page.locator(".footer-controls .toggle input").first().uncheck();
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
  // first link receives focus; Esc closes and returns focus to ☰
  if (!(await page.evaluate(() => document.activeElement?.classList?.contains("menu-link")))) fail("menu: first link should get focus on open");
  await page.keyboard.press("Escape");
  if (await page.locator(".menu-panel:not([hidden])").count()) fail("menu: Esc must close");
  if (!(await page.evaluate(() => document.activeElement?.classList?.contains("menu-btn")))) fail("menu: focus must return to ☰");
  // click-outside closes
  await page.locator(".menu-btn").click();
  await page.waitForSelector(".menu-panel:not([hidden])");
  await page.locator("h1").click();
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
      constructor(src) { this.src = src; this.playbackRate = 1; this.preservesPitch = false; }
      play() { window.__played.push({ src: this.src, rate: this.playbackRate }); return Promise.resolve(); }
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
  if ((await clips.locator(".mode-card").count()) !== 7) fail("clips: set screen should show 7 activity cards");
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
  // mute silences the clip backend too
  await clips.goto(`${BASE}/#/study/1/present`);
  await clips.waitForSelector(".sound-toggle");
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
    const before = await sticky.evaluate(() => document.querySelector(".conj-table tbody th").getBoundingClientRect().x);
    const scrolled = await sticky.evaluate(() => {
      const sc = document.querySelector(".table-scroll");
      sc.scrollLeft = 300;
      return sc.scrollLeft;
    });
    if (scrolled < 100) fail(`sticky ${route}: table should overflow-scroll at 360px (scrollLeft=${scrolled})`);
    await sticky.waitForTimeout(60);
    const after = await sticky.evaluate(() => document.querySelector(".conj-table tbody th").getBoundingClientRect().x);
    if (Math.abs(after - before) > 1) fail(`sticky ${route}: persons column moved (x ${before} → ${after})`);
  }
  await sticky.close();
  ok("sticky: persons column frozen while Práctica/Estudia tables scroll on phones");
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
