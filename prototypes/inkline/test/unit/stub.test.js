'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const { transcribe, STUB_WARNING } = require('../../src/transcribe/stub');
const transcriber = require('../../src/transcribe');

const FIXTURE = path.join(__dirname, '..', 'fixtures', 'handwriting-sample.png');
const CORPUS_STANDIN = path.join(
  __dirname, '..', '..', 'harness', 'corpus', 'bixby-letter.stub.png'
);

test('stub is the default provider when no API key is configured', () => {
  const savedKey = process.env.ANTHROPIC_API_KEY;
  const savedProvider = process.env.TRANSCRIBE_PROVIDER;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.TRANSCRIBE_PROVIDER;
  try {
    assert.equal(transcriber.activeProviderName(), 'stub');
    assert.equal(transcriber.isStub(), true);
    // anthropic requested but no key -> still stub (never fake a real provider)
    process.env.TRANSCRIBE_PROVIDER = 'anthropic';
    assert.equal(transcriber.activeProviderName(), 'stub');
  } finally {
    if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey;
    if (savedProvider !== undefined) process.env.TRANSCRIBE_PROVIDER = savedProvider;
    else delete process.env.TRANSCRIBE_PROVIDER;
  }
});

test('stub output matches the provider interface', async () => {
  const result = await transcribe(FIXTURE);
  assert.equal(result.status, 'ok');
  assert.equal(result.provider, 'stub');
  assert.ok(Array.isArray(result.lines) && result.lines.length > 0);
  for (const line of result.lines) {
    assert.ok(Array.isArray(line.words) && line.words.length > 0);
    for (const w of line.words) {
      assert.equal(typeof w.text, 'string');
      assert.equal(typeof w.confidence, 'number');
      assert.ok(w.confidence >= 0 && w.confidence <= 1);
    }
  }
});

test('stub always carries the prominent stub warning', async () => {
  const result = await transcribe(FIXTURE);
  assert.ok(result.warnings.includes(STUB_WARNING));
  assert.match(STUB_WARNING, /supply ANTHROPIC_API_KEY/);
});

test('stub is deterministic: same file, byte-identical result', async () => {
  const a = await transcribe(FIXTURE);
  const b = await transcribe(FIXTURE);
  assert.deepEqual(a, b);
});

test('stub differs across different files (seeded by content hash)', async () => {
  const other = path.join(__dirname, '..', 'fixtures', 'second-sample.png');
  const a = await transcribe(FIXTURE);
  const b = await transcribe(other);
  assert.notDeepEqual(a.lines, b.lines);
});

test('stub injects some low-confidence and [?] words for the UI', async () => {
  const result = await transcribe(CORPUS_STANDIN);
  const words = result.lines.flatMap((l) => l.words);
  assert.ok(words.some((w) => w.confidence < 0.75), 'expected uncertain words');
  assert.ok(words.some((w) => w.text === '[?]'), 'expected [?] placeholders');
});

test('stub matches corpus fixtures and replays ground truth', async () => {
  const result = await transcribe(CORPUS_STANDIN);
  const gt = fs.readFileSync(
    path.join(__dirname, '..', '..', 'harness', 'corpus', 'bixby-letter.txt'),
    'utf8'
  );
  const flat = result.lines
    .flatMap((l) => l.words)
    .filter((w) => w.text !== '[?]')
    .map((w) => w.text);
  // Every non-[?] stub word must come from the ground truth (stub never invents).
  const gtWords = new Set(gt.split(/\s+/).filter(Boolean));
  for (const w of flat) assert.ok(gtWords.has(w), `stub invented word: ${w}`);
  assert.ok(
    result.warnings.some((w) => w.includes('bixby-letter')),
    'expected corpus-match warning'
  );
});

test('stub reports failure for unreadable file', async () => {
  const result = await transcribe('/nonexistent/nope.png');
  assert.equal(result.status, 'failed');
  assert.ok(result.warnings.includes(STUB_WARNING));
});
