/**
 * M29 one-shot QR generator (dev tooling only — never CI, never runtime).
 * Emits qr/g01.svg … qr/g20.svg, one scannable station link per group,
 * pointing at the live site's #/set/<n> routes. The committed SVGs are
 * the artifact; the encoder is the vendored MIT qrcode-generator
 * (tools/vendor/qrcode-generator.cjs, Kazuhiko Arase — same vendoring
 * pattern as tests/e2e/vendor/axe.min.js).
 *
 *   node tools/generate-qr.mjs
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const qrcode = require("./vendor/qrcode-generator.cjs");

const ROOT = new URL("..", import.meta.url).pathname;
mkdirSync(join(ROOT, "qr"), { recursive: true });

for (let id = 1; id <= 20; id++) {
  const qr = qrcode(0, "M"); // auto version, medium error correction
  qr.addData(`https://dliskills.com/#/set/${id}`);
  qr.make();
  const svg = qr.createSvgTag({ cellSize: 4, margin: 8, scalable: true });
  const file = `g${String(id).padStart(2, "0")}.svg`;
  writeFileSync(join(ROOT, "qr", file), svg + "\n");
  console.log(`qr/${file}`);
}
