#!/usr/bin/env node
// ================================================================
//  build-dawg.mjs  –  Poppy Wordy dictionary builder
//  ──────────────────────────────────────────────────────────────
//  Downloads the Aspell Italian word list, normalises accents,
//  filters to pure A-Z words (≥ 3 chars), and writes a compact
//  binary to public/dictionaries/it.dawg.
//
//  Run once during development:
//    node scripts/build-dawg.mjs
//
//  Binary format  ("ITWD"):
//    [4 bytes]  magic  0x49 0x54 0x57 0x44  ("ITWD")
//    [4 bytes]  word count  (uint32 LE)
//    [4 bytes]  data byte length  (uint32 LE)
//    [data]     prefix-delta encoded, sorted, uppercase words
//                 Each entry:
//                   [1 byte]  keep  – chars shared with prev word
//                   [1 byte]  add   – length of new suffix
//                   [add bytes]  suffix  (ASCII, A-Z only)
// ================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const DICT_DIR  = join(ROOT, 'public', 'dictionaries');
const OUT_FILE  = join(DICT_DIR, 'it.dawg');

// ── Expanded Italian word list (already expanded forms, one per line) ────────
const ASPELL_URL =
  'https://raw.githubusercontent.com/napolux/paroleitaliane/main/paroleitaliane/660000_parole_italiane.txt';

// ── Accent map ───────────────────────────────────────────────────
const ACCENT = {
  à:'A', á:'A', â:'A', ã:'A', ä:'A',
  è:'E', é:'E', ê:'E', ë:'E',
  ì:'I', í:'I', î:'I', ï:'I',
  ò:'O', ó:'O', ô:'O', õ:'O', ö:'O',
  ù:'U', ú:'U', û:'U', ü:'U',
};

function normalise(word) {
  return word
    .toLowerCase()
    .replace(/[àáâãäèéêëìíîïòóôõöùúûü]/g, c => ACCENT[c] ?? c)
    .toUpperCase();
}

function isValid(w) {
  return w.length >= 3 && /^[A-Z]+$/.test(w);
}

// ── HTTP fetch ───────────────────────────────────────────────────
function fetchText(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 30_000 }, res => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location && redirects > 0) {
        return fetchText(res.headers.location, redirects - 1).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ── Prefix-delta encoder ─────────────────────────────────────────
function encodeDelta(sortedWords) {
  const parts = [];
  let prev = '';
  for (const word of sortedWords) {
    let keep = 0;
    while (keep < prev.length && keep < word.length && prev[keep] === word[keep]) keep++;
    const suffix = word.slice(keep);
    const buf = Buffer.allocUnsafe(2 + suffix.length);
    buf[0] = keep;
    buf[1] = suffix.length;
    buf.write(suffix, 2, 'ascii');
    parts.push(buf);
    prev = word;
  }
  return Buffer.concat(parts);
}

// ── Main ─────────────────────────────────────────────────────────
(async () => {
  mkdirSync(DICT_DIR, { recursive: true });

  console.log('Downloading Aspell-it word list…');
  const raw = await fetchText(ASPELL_URL);

  console.log('Parsing…');
  const lines = raw.split(/\r?\n/);

  // The list is one word per line, no flags
  const seen = new Set();
  for (let line of lines) {
    const w = normalise(line.trim());
    if (isValid(w)) seen.add(w);
  }

  const words = [...seen].sort();
  console.log(`Words after normalisation: ${words.length.toLocaleString()}`);

  const data   = encodeDelta(words);
  const header = Buffer.allocUnsafe(12);
  // magic "ITWD"
  header.write('ITWD', 0, 'ascii');
  header.writeUInt32LE(words.length, 4);
  header.writeUInt32LE(data.length, 8);

  writeFileSync(OUT_FILE, Buffer.concat([header, data]));

  const kb = ((header.length + data.length) / 1024).toFixed(1);
  console.log(`✓  Written to ${OUT_FILE}  (${kb} KB, ${words.length.toLocaleString()} words)`);
})().catch(e => { console.error('Build failed:', e.message); process.exit(1); });
