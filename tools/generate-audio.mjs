/**
 * M12 audio generation (dev-only tooling — like Playwright/axe, never an
 * app dependency, never run in CI). Generates the static Spanish clips
 * the app plays, using the owner's ElevenLabs account.
 *
 * Secrets: reads ELEVENLABS_API_KEY (and optional ELEVENLABS_VOICE_ID /
 * ELEVENLABS_MODEL) from the environment or a local .env file. The key
 * must NEVER be committed, printed, or reach CI — .env is git-ignored.
 *
 * Usage:
 *   node tools/generate-audio.mjs --samples          # audition set only
 *   node tools/generate-audio.mjs --sets 1,2         # specific groups
 *   node tools/generate-audio.mjs --sets all         # full dataset
 *
 * Output: audio/clips/<slug>-<hash>.mp3 + audio/manifest.json mapping
 * EXACT spoken text → clip path. Two variants per form: person-prefixed
 * ("yo hablo") for say/sayForm paths, and bare ("hablo") for 🎧 Escucha
 * (whose prompt must not reveal the person). Identical texts dedupe
 * naturally (ser/ir preterite "fue" is one clip). Idempotent: existing
 * manifest entries with a present file are skipped, so re-runs only fill
 * gaps. Sequential requests with backoff (free/starter concurrency).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SETS } from "../js/verbs.js";
import { conjugate, TENSES } from "../js/conjugator.js";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "audio");
const CLIPS = join(OUT, "clips");
const MANIFEST = join(OUT, "manifest.json");

// ---- env (.env fallback; never log values) ----
function loadEnv() {
  try {
    for (const line of readFileSync(join(ROOT, ".env"), "utf8").split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch { /* no .env — rely on the environment */ }
}
loadEnv();
const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVENLABS_VOICE_ID || "rixsIpPlTphvsJd2mI03"; // owner-chosen, 2026-07-08
const MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
const FORMAT = process.env.ELEVENLABS_FORMAT || "mp3_22050_32"; // compact; short phrases
if (!KEY) {
  console.error("ELEVENLABS_API_KEY missing (env or .env). Aborting — nothing generated.");
  process.exit(1);
}

// Must match SPEECH_PERSONS in js/app.js (short spoken person words).
const SPEECH_PERSONS = ["yo", "tú", "él", "nosotros", "vosotros", "ellos"];

// ---- what to say ----
function phrasesForSets(setIds) {
  const texts = new Set();
  for (const id of setIds) {
    for (const verb of SETS[id - 1].verbs) {
      for (const tense of TENSES) {
        const forms = conjugate(verb, tense);
        for (let p = 0; p < 6; p++) {
          texts.add(`${SPEECH_PERSONS[p]} ${forms[p]}`); // say/sayForm paths
          texts.add(forms[p]); // bare form for 🎧 Escucha
        }
      }
    }
  }
  return [...texts];
}

// Audition set: everyday + tricky (accents, diphthongs, irregulars).
const SAMPLES = [
  "yo hablo", "tú tenías", "él hizo", "nosotros fuimos",
  "ellos leyeron", "yo empecé", "habló", "oían",
];

// ---- filenames: diacritic-stripped slug + short hash (hablo vs habló) ----
function slug(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function hash4(text) {
  let h = 0;
  for (const c of text) h = (h * 31 + c.codePointAt(0)) >>> 0;
  return h.toString(36).slice(0, 4).padStart(4, "0");
}
const fileFor = (text) => `clips/${slug(text)}-${hash4(text)}.mp3`;

// ---- generation ----
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tts(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=${FORMAT}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "xi-api-key": KEY, "content-type": "application/json" },
      body: JSON.stringify({ text, model_id: MODEL }),
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (res.status === 429 || res.status >= 500) {
      await sleep(1500 * attempt);
      continue;
    }
    throw new Error(`TTS ${res.status} for "${text}": ${(await res.text()).slice(0, 200)}`);
  }
  throw new Error(`TTS retries exhausted for "${text}"`);
}

async function run() {
  const args = process.argv.slice(2);
  const samplesOnly = args.includes("--samples");
  const setsArg = args[args.indexOf("--sets") + 1];
  let texts;
  if (samplesOnly) {
    texts = SAMPLES;
  } else if (setsArg) {
    const ids = setsArg === "all" ? SETS.map((s) => s.id) : setsArg.split(",").map(Number);
    texts = phrasesForSets(ids);
  } else {
    console.error("Pass --samples or --sets 1,2 | --sets all");
    process.exit(1);
  }

  mkdirSync(CLIPS, { recursive: true });
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
  let made = 0, skipped = 0, chars = 0;
  for (const text of texts) {
    const rel = manifest[text] ?? fileFor(text);
    if (manifest[text] && existsSync(join(OUT, rel))) { skipped++; continue; }
    const audio = await tts(text);
    if (audio.length < 500) throw new Error(`suspiciously small clip for "${text}" (${audio.length}B)`);
    writeFileSync(join(OUT, rel), audio);
    manifest[text] = rel;
    made++;
    chars += text.length;
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + "\n"); // checkpoint per clip (resumable)
    await sleep(350); // stay friendly to free/starter concurrency limits
  }
  console.log(`done: ${made} generated (${chars} credits ≈ chars), ${skipped} already present, manifest ${Object.keys(manifest).length} entries`);
}

run().catch((e) => { console.error(e.message); process.exit(1); });
