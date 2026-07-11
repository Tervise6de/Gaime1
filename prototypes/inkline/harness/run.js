'use strict';

/**
 * Accuracy harness.
 *
 * Runs transcribe() over every corpus document that has BOTH an image file and
 * a ground-truth .txt locally, then reports per-document CER / WER, mean and
 * median, and a hallucination proxy:
 *
 *   hallucination rate = (# words with confidence >= 0.9 whose normalized
 *   form does not appear anywhere in the ground truth) / (# words with
 *   confidence >= 0.9)
 *
 * Writes harness/results/{timestamp}.json and a markdown summary next to it.
 *
 * In stub mode the results are MEANINGLESS FOR ACCURACY (the stub echoes
 * ground truth or lorem) — every output is labeled accordingly. Supply
 * ANTHROPIC_API_KEY and TRANSCRIBE_PROVIDER=anthropic for a real run.
 */

const fs = require('fs');
const path = require('path');

const { transcribe, activeProviderName, isStub } = require('../src/transcribe');
const { cer, wer, normalize, tokens } = require('./cer');

const CORPUS_DIR = path.join(__dirname, 'corpus');
const RESULTS_DIR = path.join(__dirname, 'results');
const CONFIDENT = 0.9;

function flattenWords(lines) {
  const out = [];
  for (const line of lines) for (const w of line.words) out.push(w);
  return out;
}

function linesToText(lines) {
  return lines.map((l) => l.words.map((w) => w.text).join(' ')).join('\n');
}

function hallucinationRate(lines, groundTruth) {
  const gtSet = new Set(tokens(groundTruth));
  const confident = flattenWords(lines).filter(
    (w) => w.confidence >= CONFIDENT && w.text !== '[?]'
  );
  if (confident.length === 0) return { rate: 0, confidentWords: 0, hallucinated: 0 };
  let hallucinated = 0;
  for (const w of confident) {
    const norm = normalize(w.text);
    if (norm && !gtSet.has(norm)) hallucinated++;
  }
  return {
    rate: hallucinated / confident.length,
    confidentWords: confident.length,
    hallucinated,
  };
}

function median(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function pct(n) {
  return n == null ? 'n/a' : (n * 100).toFixed(2) + '%';
}

async function main() {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(CORPUS_DIR, 'manifest.json'), 'utf8')
  );

  const provider = activeProviderName();
  const stub = isStub();
  const label = stub
    ? 'STUB RUN — results are placeholders and MEANINGLESS for accuracy. Supply ANTHROPIC_API_KEY + TRANSCRIBE_PROVIDER=anthropic for a real run.'
    : `REAL RUN via provider "${provider}" (model: ${process.env.MODEL || 'claude-sonnet-5'})`;

  console.log('InkLine accuracy harness');
  console.log(label);
  console.log('');

  const results = [];
  const skipped = [];

  for (const doc of manifest.documents) {
    let imagePath = path.join(CORPUS_DIR, doc.image);
    const gtPath = path.join(CORPUS_DIR, doc.ground_truth);
    let usedStandIn = false;
    if (!fs.existsSync(imagePath)) {
      // Stand-in images (scripts/gen-fixtures.js) let the pipeline run
      // end-to-end in STUB MODE ONLY — they are not the real manuscripts,
      // so a real provider must never be scored against them.
      const standIn = path.join(CORPUS_DIR, `${doc.id}.stub.png`);
      if (stub && fs.existsSync(standIn)) {
        imagePath = standIn;
        usedStandIn = true;
      } else {
        skipped.push({ id: doc.id, reason: 'image not downloaded (run harness/fetch-corpus.sh)' });
        continue;
      }
    }
    if (!fs.existsSync(gtPath)) {
      skipped.push({ id: doc.id, reason: 'ground-truth .txt missing' });
      continue;
    }

    const groundTruth = fs.readFileSync(gtPath, 'utf8');
    process.stdout.write(`Transcribing ${doc.id} (${doc.difficulty}) ... `);
    const started = Date.now();
    const result = await transcribe(imagePath, {});
    const elapsedMs = Date.now() - started;

    if (result.status !== 'ok') {
      console.log(`FAILED (${elapsedMs}ms)`);
      results.push({
        id: doc.id,
        title: doc.title,
        difficulty: doc.difficulty,
        provider: result.provider,
        status: 'failed',
        warnings: result.warnings,
        elapsedMs,
      });
      continue;
    }

    const hypothesis = linesToText(result.lines);
    const docCer = cer(groundTruth, hypothesis);
    const docWer = wer(groundTruth, hypothesis);
    const hall = hallucinationRate(result.lines, groundTruth);
    console.log(
      `done (${elapsedMs}ms)  CER=${pct(docCer)}  WER=${pct(docWer)}  hallucination=${pct(hall.rate)}`
    );

    results.push({
      id: doc.id,
      title: doc.title,
      difficulty: doc.difficulty,
      provider: result.provider,
      usedStandInImage: usedStandIn,
      status: 'ok',
      cer: docCer,
      wer: docWer,
      hallucination: hall,
      wordCount: flattenWords(result.lines).length,
      warnings: result.warnings,
      elapsedMs,
    });
  }

  const ok = results.filter((r) => r.status === 'ok');
  const summary = {
    stub,
    label,
    provider,
    model: stub ? null : process.env.MODEL || 'claude-sonnet-5',
    confidentThreshold: CONFIDENT,
    ranAt: new Date().toISOString(),
    documents: results,
    skipped,
    aggregate: {
      count: ok.length,
      meanCer: mean(ok.map((r) => r.cer)),
      medianCer: median(ok.map((r) => r.cer)),
      meanWer: mean(ok.map((r) => r.wer)),
      medianWer: median(ok.map((r) => r.wer)),
      meanHallucinationRate: mean(ok.map((r) => r.hallucination.rate)),
      failedCount: results.length - ok.length,
    },
  };

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(RESULTS_DIR, `${stamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  const md = [];
  md.push(`# InkLine accuracy harness — ${stamp}`);
  md.push('');
  md.push(stub ? `> **${label}**` : `> ${label}`);
  md.push('');
  md.push('| Document | Difficulty | CER | WER | Hallucination rate (conf >= 0.9) | Status |');
  md.push('|---|---|---|---|---|---|');
  for (const r of results) {
    if (r.status === 'ok') {
      md.push(
        `| ${r.id} | ${r.difficulty} | ${pct(r.cer)} | ${pct(r.wer)} | ${pct(r.hallucination.rate)} (${r.hallucination.hallucinated}/${r.hallucination.confidentWords}) | ok |`
      );
    } else {
      md.push(`| ${r.id} | ${r.difficulty} | — | — | — | FAILED |`);
    }
  }
  md.push('');
  md.push(`**Mean CER:** ${pct(summary.aggregate.meanCer)} · **Median CER:** ${pct(summary.aggregate.medianCer)}`);
  md.push(`**Mean WER:** ${pct(summary.aggregate.meanWer)} · **Median WER:** ${pct(summary.aggregate.medianWer)}`);
  md.push(`**Mean hallucination rate:** ${pct(summary.aggregate.meanHallucinationRate)}`);
  md.push('');
  if (skipped.length) {
    md.push('## Skipped');
    for (const s of skipped) md.push(`- ${s.id}: ${s.reason}`);
    md.push('');
  }
  if (stub) {
    md.push('## STUB DISCLAIMER');
    md.push(
      'This run used the deterministic stub provider. CER/WER/hallucination numbers above do not measure any model — the stub replays ground truth (or lorem) with synthetic confidences. They exist only to prove the harness pipeline end-to-end.'
    );
  }
  const mdPath = path.join(RESULTS_DIR, `${stamp}.md`);
  fs.writeFileSync(mdPath, md.join('\n') + '\n');

  console.log('');
  console.log(`Documents scored: ${ok.length}, failed: ${summary.aggregate.failedCount}, skipped: ${skipped.length}`);
  if (skipped.length) {
    for (const s of skipped) console.log(`  skipped ${s.id}: ${s.reason}`);
  }
  console.log(`Mean CER: ${pct(summary.aggregate.meanCer)}  Median CER: ${pct(summary.aggregate.medianCer)}`);
  console.log(`Mean WER: ${pct(summary.aggregate.meanWer)}  Median WER: ${pct(summary.aggregate.medianWer)}`);
  console.log(`Mean hallucination rate: ${pct(summary.aggregate.meanHallucinationRate)}`);
  console.log('');
  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
  if (stub) {
    console.log('');
    console.log('REMINDER: STUB results — meaningless for accuracy.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
