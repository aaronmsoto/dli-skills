/**
 * M16 task R — design-extraction spec guards.
 *
 * The redesign is spec-only at this stage: css/tokens.css is DEFINED but
 * NOT APPLIED (unlinked, scoped to :root[data-redesign] which nothing
 * sets), and docs/DESIGN.md is the distilled source of truth. These checks
 * keep that spec honest so the later loop tasks (G, T, I-star, RT) can rely
 * on it without design-MCP access:
 *   1. css/tokens.css parses (balanced, well-formed custom-property decls).
 *   2. docs/DESIGN.md carries a token block for every app screen.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = new URL("..", import.meta.url);
const read = (rel) => readFileSync(fileURLToPath(new URL(rel, ROOT)), "utf8");

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

test("css/tokens.css parses and defines the token layer", () => {
  const raw = read("css/tokens.css");
  const css = stripComments(raw);

  // Balanced braces and parentheses.
  const opens = (css.match(/\{/g) || []).length;
  const closes = (css.match(/\}/g) || []).length;
  assert.equal(opens, closes, "unbalanced { } braces in tokens.css");
  const po = (css.match(/\(/g) || []).length;
  const pc = (css.match(/\)/g) || []).length;
  assert.equal(po, pc, "unbalanced ( ) parentheses in tokens.css");

  // Every innermost declaration block holds well-formed custom properties.
  const blocks = [...css.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]);
  assert.ok(blocks.length >= 3, "expected several declaration blocks");
  for (const body of blocks) {
    for (const decl of body.split(";")) {
      const d = decl.trim();
      if (!d) continue;
      assert.match(
        d,
        /^--[\w-]+\s*:\s*\S[\s\S]*$/,
        `malformed declaration in tokens.css: "${d}"`
      );
    }
  }

  // The token layer is present, scoped to the (inert) redesign gate.
  assert.ok(
    css.includes(":root[data-redesign]"),
    "tokens.css must scope tokens to :root[data-redesign] (defined, not applied)"
  );
  const props = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  assert.ok(props.size >= 30, `expected ≥30 distinct tokens, got ${props.size}`);

  // Core color tokens exist in both light and dark forms.
  for (const t of ["--bg", "--brand", "--accent", "--star", "--ink"]) {
    assert.ok(props.has(t), `missing core token ${t}`);
  }
});

test("docs/DESIGN.md lists a token block per screen", () => {
  const md = read("docs/DESIGN.md");

  // One H3 per screen, each carrying a ```css fenced block with tokens.
  const sections = md.split(/^### /m).slice(1);
  assert.ok(sections.length > 0, "no ### screen sections found in DESIGN.md");

  // The app's screens (routes per js/app.js); each must have a token block.
  const SCREENS = [
    "Home",
    "Group",
    "Estudia",
    "Práctica",
    "Elige",
    "Escribe",
    "Empareja",
    "Escucha",
    "Contraste",
    "Results",
    "Informe",
    "About",
    "Docs",
  ];

  for (const name of SCREENS) {
    const section = sections.find((s) => s.split("\n")[0].includes(name));
    assert.ok(section, `DESIGN.md is missing a screen section for "${name}"`);
    const fence = section.match(/```css\n([\s\S]*?)```/);
    assert.ok(fence, `screen "${name}" has no \`\`\`css token block`);
    assert.match(
      fence[1],
      /--[\w-]+/,
      `screen "${name}" token block names no --custom-properties`
    );
  }
});
