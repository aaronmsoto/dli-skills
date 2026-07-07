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
if ((await page.locator(".mode-card").count()) !== 5) fail("set: expected 5 activity cards");
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
if ((await voiced.locator(".mode-card").count()) !== 6) fail("escucha: voiced set screen should show 6 activity cards");
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

// ---------- wrap up ----------
if (errors.length) fail(`console/page errors: ${JSON.stringify(errors)}`);
await browser.close();
server.close();

if (failures.length) {
  console.error(`\nE2E FAILED — ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nE2E PASSED");
