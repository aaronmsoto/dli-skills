/**
 * M31 B/C — site homepage + Conjuga move invariants (docs/SPEC.md §4.7).
 *  - root index.html: the legacy-link redirect shim is the FIRST script in
 *    <head> (before any stylesheet), and both HTML shells carry the same
 *    inline Prado/theme loader (Auto default — CLAUDE.md visual system).
 *  - conjuga/index.html loads everything one level up (relative URLs).
 *  - js/home.js star sums skip the 🎧 badge tracks (standing rule 3).
 *  - Cuentos beacon page names: the contract with server/worker.js PAGES.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sumStars } from "../js/home.js";

const ROOT = new URL("..", import.meta.url).pathname;
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const LOADER = 'document.documentElement.setAttribute("data-redesign","")';

test("root index.html: redirect shim comes first, homepage has no app bundle", () => {
  const html = read("index.html");
  const head = html.slice(0, html.indexOf("</head>"));
  const shim = head.indexOf("location.replace(\"conjuga/\"+location.search+h)");
  assert.ok(shim > 0, "redirect shim missing");
  assert.ok(shim < head.indexOf("<link"), "shim must precede every <link> (stylesheets included)");
  assert.ok(head.indexOf("<script") < head.indexOf("<link"), "shim must be the first script");
  assert.match(head, /\/\^#\\\/\.\//, "shim only fires for #/… hashes (plain / never redirects)");
  assert.ok(!html.includes("js/app.js"), "homepage must not load the Conjuga bundle");
  assert.ok(html.includes('src="js/home.js"') && html.includes('src="js/static-menu.js"'));
  assert.ok(!/info-btn|Common Core/.test(html), "no ℹ️ / Common Core on the homepage");
  assert.ok(html.indexOf("NBPTS") < html.indexOf("NCSSFL-ACTFL"), "footer: NBPTS first");
});

test("both HTML shells carry the inline theme loader", () => {
  for (const f of ["index.html", "conjuga/index.html"]) {
    const html = read(f);
    assert.ok(html.includes(LOADER), `${f}: data-redesign loader missing`);
    assert.ok(html.includes('t==="light"||t==="dark"'), `${f}: Auto-default theme pin missing`);
    assert.match(html, /<html lang="es">/, `${f}: lang=es`);
  }
});

test("conjuga/index.html resolves every asset one level up", () => {
  const html = read("conjuga/index.html");
  for (const ref of ["../css/styles.css", "../css/tokens.css", "../css/redesign.css",
    "../js/app.js", "../manifest.webmanifest", "../icons/apple-touch-icon.png"]) {
    assert.ok(html.includes(`"${ref}"`), `conjuga/index.html missing ${ref}`);
  }
  const app = read("js/app.js");
  assert.ok(app.includes('register("../sw.js")'), "SW must register at the origin root scope");
  assert.ok(app.includes('const CLIP_BASE = "../audio/"'), "clip base must point at the shared /audio/");
});

test("sumStars: stars only, badge tracks excluded, corrupt input → 0", () => {
  const conjuga = JSON.stringify({ best: {
    "1.present.choice": { stars: 3 }, "1.past.contrast": { stars: 2 }, "2.present.listen": { stars: 3 },
  } });
  assert.equal(sumStars(conjuga, ".listen"), 5);
  const cuentos = JSON.stringify({ best: {
    "leon-raton.1.preguntas": { stars: 3 }, "leon-raton.1.escucha": { stars: 3 },
  } });
  assert.equal(sumStars(cuentos, ".escucha"), 3);
  assert.equal(sumStars(null, ".listen"), 0);
  assert.equal(sumStars("{not json", ".listen"), 0);
  assert.equal(sumStars('{"best":{"x":{"stars":"NaN"}}}', ".listen"), 0);
});

test("Cuentos beacon page names match the Worker contract", () => {
  const src = read("cuentos/js/app.js");
  for (const name of ["cuentos-home", "cuentos-story", "cuentos-lee", "cuentos-juego", "cuentos-report", "cuentos-creditos"]) {
    assert.ok(src.includes(`"${name}"`), `cuentos/js/app.js missing beacon page "${name}"`);
  }
  assert.ok(read("js/home.js").includes('pageView("site")'), "homepage must send page \"site\"");
});
