'use strict';

/**
 * Generates synthetic PNG images (no dependencies — raw PNG encoder + zlib):
 *
 *  - test/fixtures/*.png            : small images for the e2e tests
 *  - harness/corpus/<id>.stub.png   : STAND-IN images for corpus entries that
 *                                     ship a ground-truth excerpt. They are
 *                                     NOT the real manuscripts — they only let
 *                                     the harness pipeline run end-to-end in
 *                                     stub mode before fetch-corpus.sh has
 *                                     been run. The harness refuses to use
 *                                     them with a real provider.
 *
 * Deterministic output. Run: node scripts/gen-fixtures.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** pixels: function (x, y) -> [r, g, b] */
function encodePng(width, height, pixels) {
  const raw = Buffer.alloc(height * (1 + width * 3));
  let off = 0;
  for (let y = 0; y < height; y++) {
    raw[off++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixels(x, y);
      raw[off++] = r;
      raw[off++] = g;
      raw[off++] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Paper-toned background with wavy dark "ink" lines — a stand-in that reads
// as "scan of a page" in the UI without pretending to be a real manuscript.
function paperImage(width, height, seed) {
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const rows = [];
  for (let i = 0; i < 7; i++) {
    rows.push({
      y: Math.floor(height * (0.15 + i * 0.12)),
      amp: 1 + rand() * 2,
      freq: 0.05 + rand() * 0.1,
      start: Math.floor(width * (0.08 + rand() * 0.05)),
      end: Math.floor(width * (0.75 + rand() * 0.2)),
    });
  }
  return encodePng(width, height, (x, y) => {
    // paper base with slight grain
    let r = 244 + Math.floor(((x * 7 + y * 13 + seed) % 9) - 4);
    let g = r - 6;
    let b = r - 22;
    for (const row of rows) {
      const wave = row.y + Math.sin(x * row.freq) * row.amp;
      if (x >= row.start && x <= row.end && Math.abs(y - wave) < 1.2) {
        return [58, 46, 30];
      }
    }
    return [clamp(r), clamp(g), clamp(b)];
  });
}

function clamp(v) {
  return Math.max(0, Math.min(255, v));
}

const root = path.join(__dirname, '..');

// e2e fixtures
const fixturesDir = path.join(root, 'test', 'fixtures');
fs.mkdirSync(fixturesDir, { recursive: true });
fs.writeFileSync(path.join(fixturesDir, 'handwriting-sample.png'), paperImage(480, 320, 0xa11ce));
fs.writeFileSync(path.join(fixturesDir, 'second-sample.png'), paperImage(400, 280, 0xbee5));
console.log('Wrote test/fixtures/handwriting-sample.png, second-sample.png');

// corpus stand-ins for entries that ship ground truth
const corpusDir = path.join(root, 'harness', 'corpus');
const manifest = JSON.parse(fs.readFileSync(path.join(corpusDir, 'manifest.json'), 'utf8'));
let n = 0;
for (const doc of manifest.documents) {
  if (!doc.ground_truth_included) continue;
  const name = `${doc.id}.stub.png`;
  fs.writeFileSync(path.join(corpusDir, name), paperImage(520, 360, crcSeed(doc.id)));
  n++;
}
console.log(`Wrote ${n} corpus stand-in images (*.stub.png) — stub-mode only.`);

function crcSeed(str) {
  return crc32(Buffer.from(str, 'utf8'));
}
