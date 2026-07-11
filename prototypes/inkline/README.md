# InkLine (prototype)

Upload a photo/scan of a handwritten historical document → side-by-side
transcription with per-word uncertainty highlighting → shareable public
"artifact page" with a conversion CTA for relatives.

**Honesty note:** this environment has no AI API key and its network policy
blocks archive hosts, so everything model-related runs against a clearly
labeled deterministic **stub**. Nothing pretends to be a real transcription.

## Run

```bash
npm install
npm run dev        # or: npm start   → http://localhost:3000
```

Without a key the app runs in stub mode and says so, loudly, on every page
that shows stub output.

## Real transcription (supply a key)

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export TRANSCRIBE_PROVIDER=anthropic
export MODEL=claude-sonnet-5   # optional, this is the default
npm start
```

The Anthropic provider (`src/transcribe/anthropic.js`) is loaded lazily, asks
the model for strict JSON (schema in the prompt + structured outputs), parses
defensively, and reports unparseable output as a **failure** — it never
invents words. Uncertain/illegible words come back as `[?]` with low
confidence and are highlighted amber in the UI (threshold: confidence < 0.75).

## Tests

```bash
npm test           # unit (node:test) + e2e (Playwright, stub mode)
npm run test:unit  # CER/WER math, stub determinism & interface
npm run test:e2e   # full journey: upload → artifact → share → collection → CTA
```

Playwright uses the preinstalled browsers at `/opt/pw-browsers`
(`PLAYWRIGHT_BROWSERS_PATH` is set by the script — do not run
`playwright install`).

## Accuracy harness

```bash
npm run harness
```

Runs `transcribe()` over the corpus and writes
`harness/results/{timestamp}.json` + a markdown summary with per-document
CER / WER (Levenshtein, normalization options in `harness/cer.js`), mean and
median, and a **hallucination proxy**: the share of words with
confidence ≥ 0.9 whose normalized form doesn't appear in the ground truth.

- **Stub mode (default):** the run completes end-to-end but is labeled
  `STUB RUN — meaningless for accuracy` everywhere. It scores against
  generated stand-in images (`harness/corpus/*.stub.png`) that only exercise
  the pipeline.
- **Real mode:** supply `ANTHROPIC_API_KEY` + `TRANSCRIBE_PROVIDER=anthropic`,
  then first download the real corpus:

```bash
bash harness/fetch-corpus.sh   # needs normal internet access
```

`harness/corpus/manifest.json` lists 11 public-domain handwritten documents
(clean formal hands and degraded/hard items) with image URLs and the source
of each published transcription. **Downloads failed in the build environment**
(network policy blocks wikimedia/loc/wikisource/archive), so only manifest +
fetch script + 4 ground-truth excerpts ship in-repo. After fetching, verify
each ground-truth `.txt` against the actual downloaded page (trim multi-page
transcriptions) before trusting CER numbers — see the header of
`fetch-corpus.sh`.

## Layout

```
src/server.js            Express app (routes, upload limits, tokenized URLs)
src/db.js                better-sqlite3 (documents, collections) in data/
src/transcribe/          provider-agnostic module: index.js, anthropic.js, stub.js
src/views/               EJS templates (home, document/artifact, collection)
public/                  shared CSS + vanilla JS (drag-drop, copy link)
harness/                 cer.js, run.js, corpus/, fetch-corpus.sh, results/
test/                    unit (node:test) + e2e (Playwright) + fixtures
```

## Security/hygiene

- Artifact & collection URLs use `crypto.randomBytes(16)` base64url tokens.
- Uploads: 15MB limit, mime whitelist (jpeg/png/webp), random stored names,
  served only through `/a/:token/image` — never from a guessable path.
- DB + uploads live in `data/` (gitignored at repo root and here).
- `.env.example` documents the env vars; no secrets are committed.
