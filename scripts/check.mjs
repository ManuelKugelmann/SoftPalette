#!/usr/bin/env node
// Dependency-free static checks for SoftPalette (single-file WebGL2 app).
// Catches the classes of bug that have actually shipped from this repo:
//   1. JS syntax traps in the inline <script> (e.g. a function swallowed by an
//      orphaned /* comment — the "oklabToLinearJS is not defined" crash).
//   2. images/<file> referenced in the HTML with no matching file on disk.
//   3. palette preset buttons with no PRESETS entry (or PRESETS keys with no
//      button) — a dead/broken preset chip.
//   4. image-tab wiring: bindImageBtn('id', loader) with a missing element id
//      or loader function (the dangling-anime-button null.addEventListener crash).
//   5. leftover git conflict markers.
//
// No browser, no dependencies — runs anywhere Node is installed:
//   node scripts/check.mjs
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const errors = [];
const fail = (m) => errors.push(m);

// 1. Inline-script syntax via `node --check`.
const m = html.match(/\r?\n<script>\r?\n([\s\S]*?)\r?\n<\/script>/);
if (!m) {
  fail('could not locate the inline <script> block');
} else {
  const tmp = join(tmpdir(), 'softpalette_check.js');
  writeFileSync(tmp, m[1]);
  try {
    execSync(`node --check "${tmp}"`, { stdio: 'pipe' });
  } catch (e) {
    fail('inline script syntax error:\n' + (e.stderr?.toString() || e.message));
  }
}

// 2. Git conflict markers.
const markers = html.match(/^(<{7}|={7}|>{7})/gm);
if (markers) fail(`${markers.length} git conflict marker(s) left in index.html`);

// 3. images/<file> references resolve to a real file.
const refs = new Set([...html.matchAll(/images\/([\w.\-]+\.(?:png|jpe?g))/gi)].map((x) => x[1]));
for (const f of refs) {
  if (!existsSync(join(root, 'images', f))) fail(`image referenced but missing: images/${f}`);
}

// 4. Palette preset buttons <-> PRESETS keys (both directions).
const btns = new Set([...html.matchAll(/data-preset="([^"]+)"/g)].map((x) => x[1]));
const keys = new Set([...html.matchAll(/^\s*'([A-Za-z0-9_\-]+)':\s*\[/gm)].map((x) => x[1]));
for (const b of btns) if (!keys.has(b)) fail(`preset button "${b}" has no PRESETS entry`);
for (const k of keys) if (!btns.has(k)) fail(`PRESETS entry "${k}" has no preset button`);

// 5. Image-tab wiring: bindImageBtn('id', loader) needs id="id" and function loader.
for (const [, id, loader] of html.matchAll(/bindImageBtn\(\s*'([^']+)'\s*,\s*(\w+)\s*\)/g)) {
  if (!html.includes(`id="${id}"`)) fail(`bindImageBtn('${id}', …) but no element id="${id}"`);
  if (!new RegExp(`function\\s+${loader}\\b`).test(html)) fail(`bindImageBtn(…, ${loader}) but no function ${loader}`);
}

if (errors.length) {
  console.error('FAIL — static checks:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log(`OK — static checks passed (${refs.size} images, ${keys.size} presets, ${btns.size} preset buttons)`);
