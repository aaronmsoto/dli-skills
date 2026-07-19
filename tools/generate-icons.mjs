/**
 * One-shot PWA icon generator (M25) — run manually, never in CI or at
 * runtime; the committed PNGs in icons/ are the artifact.
 *
 *   node tools/generate-icons.mjs
 *   (remote env: point CHROMIUM_PATH at the chromium binary under /opt/pw-browsers)
 *
 * Renders Lola's head mark on the Prado leaf-green tile at 192/512 plus a
 * maskable 512 (mark held inside the central 80% safe zone, full-bleed
 * background). Colors are the LIGHT-theme token values hard-coded on
 * purpose: manifest icons cannot read CSS custom properties, and home
 * screens need one stable artwork in both OS themes.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const ROOT = new URL("..", import.meta.url).pathname;

// Prado light tokens (css/tokens.css): --brand, --lola-*, --star.
const C = {
  tile: "#2f6b4f",
  face: "#fff7ec",
  faceLine: "#eadfc8",
  body: "#c99a5b",
  wing: "#b08447",
  eye: "#2e2a26",
  beak: "#e0a458",
  star: "#e0982f",
};

/**
 * The mark: Lola's head (js/mascot.js head group, recentered) + one star
 * spark. viewBox 0 0 120 120; `scale` shrinks the mark toward the center
 * (maskable safe zone); `rounded` gives the tile transparent rounded
 * corners (purpose "any"), false = full-bleed square (purpose "maskable").
 */
function iconSvg(px, { rounded, scale }) {
  const r = rounded ? 26 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 120 120">
  <rect x="0" y="0" width="120" height="120" rx="${r}" fill="${C.tile}"/>
  <g transform="translate(60 62) scale(${scale}) translate(-60 -48)">
    <circle cx="60" cy="48" r="33" fill="${C.body}"/>
    <path d="M60 22 C44 20 30 32 33 50 C35 64 47 74 60 76 C73 74 85 64 87 50 C90 32 76 20 60 22 Z" fill="${C.face}"/>
    <path d="M60 24 L60 72" stroke="${C.faceLine}" stroke-width="2"/>
    <circle cx="46" cy="48" r="6.5" fill="${C.eye}"/>
    <circle cx="74" cy="48" r="6.5" fill="${C.eye}"/>
    <circle cx="48" cy="46" r="2" fill="#fff"/>
    <circle cx="76" cy="46" r="2" fill="#fff"/>
    <path d="M60 56 L54 66 Q60 71 66 66 Z" fill="${C.beak}"/>
    <path d="M97 14 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z" fill="${C.star}"/>
  </g>
</svg>`;
}

const OUT = [
  { file: "icon-192.png", px: 192, rounded: true, scale: 1.28 },
  { file: "icon-512.png", px: 512, rounded: true, scale: 1.28 },
  // 0.9 keeps the star tip (~x110 in viewBox units) inside the circular
  // 80% safe zone: (110-60)*0.9*(512/120) ≈ 192 px < 204.8 px radius.
  { file: "maskable-512.png", px: 512, rounded: false, scale: 0.9 },
  // iOS composites transparency onto BLACK, so the touch icon must be
  // full-bleed (no transparent corners); iOS rounds the corners itself.
  // 1.1 keeps the star clear of that ~20% system corner radius.
  { file: "apple-touch-icon.png", px: 180, rounded: false, scale: 1.1 },
];

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const page = await browser.newPage();
mkdirSync(join(ROOT, "icons"), { recursive: true });

for (const { file, px, rounded, scale } of OUT) {
  await page.setViewportSize({ width: px, height: px });
  const svg = iconSvg(px, { rounded, scale });
  await page.setContent(
    `<!doctype html><style>*{margin:0}body{background:transparent}</style>${svg}`,
  );
  const buf = await page.screenshot({ omitBackground: true });
  writeFileSync(join(ROOT, "icons", file), buf);
  console.log(`icons/${file} (${px}x${px}) written`);
}

await browser.close();
