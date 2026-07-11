'use strict';

/**
 * STUB transcription provider.
 *
 * Used whenever no real provider is configured (no ANTHROPIC_API_KEY).
 * It NEVER produces real transcription results:
 *
 *  - If the uploaded file matches a corpus fixture (by sha256 or filename),
 *    it returns that fixture's ground-truth text with synthetic, deterministic
 *    confidences and a few injected low-confidence '[?]' words, so the
 *    uncertainty UI can be developed against realistic-shaped data.
 *  - Otherwise it returns clearly-labeled lorem-style placeholder lines.
 *
 * Every stub result carries a prominent warning that the UI must display.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STUB_WARNING =
  '[STUB TRANSCRIPTION — supply ANTHROPIC_API_KEY for real results]';

const CORPUS_DIR = path.join(__dirname, '..', '..', 'harness', 'corpus');

// Deterministic PRNG (mulberry32) seeded from file hash so the same upload
// always produces byte-identical output.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(path.join(CORPUS_DIR, 'manifest.json'), 'utf8'));
  } catch {
    return { documents: [] };
  }
}

function findCorpusMatch(imagePath, sha, originalName) {
  const manifest = loadManifest();
  const names = new Set([path.basename(imagePath)]);
  if (originalName) names.add(path.basename(originalName));
  for (const doc of manifest.documents) {
    // Match the real corpus filename or the generated stand-in (<id>.stub.png)
    // by name (stored path or upload's original name) or by content hash.
    let matches = names.has(doc.image) || names.has(`${doc.id}.stub.png`);
    for (const candidate of [doc.image, `${doc.id}.stub.png`]) {
      if (matches) break;
      const candidatePath = path.join(CORPUS_DIR, candidate);
      if (fs.existsSync(candidatePath)) {
        try {
          matches = sha256File(candidatePath) === sha;
        } catch {
          matches = false;
        }
      }
    }
    if (matches) {
      const gtPath = path.join(CORPUS_DIR, doc.ground_truth);
      if (fs.existsSync(gtPath)) {
        return { doc, text: fs.readFileSync(gtPath, 'utf8') };
      }
    }
  }
  return null;
}

const LOREM =
  'the old letter speaks of harvest and kin of long roads and quiet rivers ' +
  'she wrote in a steady hand about the winter stores the new calf and the ' +
  'neighbors who came by wagon from the county line sending love to all at home';

function textToLines(text, rand) {
  const lines = [];
  const rawLines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const raw of rawLines) {
    const tokens = raw.split(/\s+/).filter(Boolean);
    // Break long paragraphs into plausible manuscript lines of ~8-12 words.
    let i = 0;
    while (i < tokens.length) {
      const take = 8 + Math.floor(rand() * 5);
      const lineTokens = tokens.slice(i, i + take);
      i += take;
      const words = lineTokens.map((t) => {
        const r = rand();
        if (r < 0.06) {
          // Injected illegible word: low confidence + '[?]' placeholder.
          return { text: '[?]', confidence: round2(0.15 + rand() * 0.25) };
        }
        if (r < 0.2) {
          // Uncertain but legible word.
          return { text: t, confidence: round2(0.45 + rand() * 0.28) };
        }
        return { text: t, confidence: round2(0.78 + rand() * 0.22) };
      });
      lines.push({ words });
    }
  }
  return lines;
}

function round2(n) {
  return Math.min(1, Math.max(0, Math.round(n * 100) / 100));
}

async function transcribe(imagePath, opts = {}) {
  let sha;
  try {
    sha = sha256File(imagePath);
  } catch (err) {
    return {
      status: 'failed',
      provider: 'stub',
      lines: [],
      warnings: [STUB_WARNING, `Could not read file: ${err.message}`],
    };
  }

  const seed = parseInt(sha.slice(0, 8), 16);
  const rand = mulberry32(seed);

  const match = findCorpusMatch(imagePath, sha, opts.originalName);
  const warnings = [STUB_WARNING];
  let text;
  if (match) {
    warnings.push(
      `Stub matched corpus fixture "${match.doc.id}" — returning its ground truth with synthetic confidences.`
    );
    text = match.text;
  } else {
    warnings.push('No corpus fixture matched; returning placeholder text.');
    text = LOREM;
  }

  return {
    status: 'ok',
    provider: 'stub',
    lines: textToLines(text, rand),
    warnings,
  };
}

module.exports = { transcribe, STUB_WARNING };
