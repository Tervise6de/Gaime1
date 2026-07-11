'use strict';

/**
 * Real transcription provider using the Anthropic API (vision).
 *
 * Selected only when TRANSCRIBE_PROVIDER=anthropic AND ANTHROPIC_API_KEY is
 * present. The SDK is loaded lazily so the app runs without it configured.
 *
 * The model is asked to output ONLY strict JSON matching the provider
 * interface. We additionally pass the schema via output_config.format
 * (structured outputs) and still parse defensively — unparseable or
 * schema-violating output is reported as a failure, never invented.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_MODEL = 'claude-sonnet-5';

const MEDIA_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

// JSON schema for the transcription payload. Included in the prompt AND
// enforced via structured outputs.
const TRANSCRIPTION_SCHEMA = {
  type: 'object',
  properties: {
    lines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          words: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                confidence: { type: 'number' },
              },
              required: ['text', 'confidence'],
              additionalProperties: false,
            },
          },
        },
        required: ['words'],
        additionalProperties: false,
      },
    },
    warnings: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['lines', 'warnings'],
  additionalProperties: false,
};

const PROMPT = `You are transcribing a photograph or scan of a HANDWRITTEN historical document.

Rules — follow all of them exactly:
1. Transcribe the handwriting faithfully, word by word, in reading order. Preserve original spelling, capitalization, and punctuation. Do not modernize, correct, or paraphrase.
2. One JSON line object per physical line of writing in the image.
3. Give every word a confidence score between 0 and 1 reflecting how certain you are of THAT word.
4. If a word is illegible or you are genuinely unsure, output the placeholder "[?]" as its text with a LOW confidence (below 0.4). NEVER guess a plausible word and give it high confidence. It is far better to emit "[?]" than to hallucinate.
5. Partially legible words: transcribe what you can read and use a confidence that honestly reflects your uncertainty.
6. If the image contains no handwriting, return an empty "lines" array and explain in "warnings".
7. Put any caveats (damage, cropping, unusual script, non-handwritten content) in "warnings".

Output ONLY strict JSON matching this exact schema — no prose, no markdown fences:
${JSON.stringify(TRANSCRIPTION_SCHEMA, null, 2)}

Example of the required output shape:
{"lines":[{"words":[{"text":"Dear","confidence":0.98},{"text":"[?]","confidence":0.2}]}],"warnings":["lower right corner is torn"]}`;

let clientPromise = null;
function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      return new Anthropic(); // reads ANTHROPIC_API_KEY from env
    })();
  }
  return clientPromise;
}

function fail(warnings) {
  return { status: 'failed', provider: 'anthropic', lines: [], warnings };
}

function extractJson(text) {
  // Defensive: tolerate accidental markdown fences or leading prose.
  const trimmed = text.trim();
  const candidates = [trimmed];
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) candidates.push(fence[1].trim());
  const brace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (brace >= 0 && lastBrace > brace) candidates.push(trimmed.slice(brace, lastBrace + 1));
  for (const c of candidates) {
    try {
      return JSON.parse(c);
    } catch {
      /* try next */
    }
  }
  return null;
}

function validate(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (!Array.isArray(payload.lines)) return null;
  const lines = [];
  for (const line of payload.lines) {
    if (!line || !Array.isArray(line.words)) return null;
    const words = [];
    for (const w of line.words) {
      if (!w || typeof w.text !== 'string' || typeof w.confidence !== 'number') return null;
      words.push({
        text: w.text,
        confidence: Math.min(1, Math.max(0, w.confidence)),
      });
    }
    lines.push({ words });
  }
  const warnings = Array.isArray(payload.warnings)
    ? payload.warnings.filter((w) => typeof w === 'string')
    : [];
  return { lines, warnings };
}

async function transcribe(imagePath, opts = {}) {
  const ext = path.extname(imagePath).toLowerCase();
  const mediaType = opts.mediaType || MEDIA_TYPES[ext];
  if (!mediaType) {
    return fail([`Unsupported image extension "${ext}" for the anthropic provider.`]);
  }

  let data;
  try {
    data = fs.readFileSync(imagePath).toString('base64');
  } catch (err) {
    return fail([`Could not read file: ${err.message}`]);
  }

  const model = process.env.MODEL || DEFAULT_MODEL;

  let response;
  try {
    const client = await getClient();
    response = await client.messages.create({
      model,
      max_tokens: 16000,
      output_config: {
        format: { type: 'json_schema', schema: TRANSCRIPTION_SCHEMA },
      },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });
  } catch (err) {
    return fail([`Anthropic API error: ${err.message}`]);
  }

  if (response.stop_reason === 'refusal') {
    return fail(['The model declined to process this image (stop_reason: refusal).']);
  }
  if (response.stop_reason === 'max_tokens') {
    return fail(['Transcription was truncated (stop_reason: max_tokens); result discarded rather than partially invented.']);
  }

  const text = (response.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const parsed = extractJson(text);
  const valid = validate(parsed);
  if (!valid) {
    return fail(['Model output was not valid JSON matching the transcription schema; refusing to invent a result.']);
  }

  return {
    status: 'ok',
    provider: `anthropic:${model}`,
    lines: valid.lines,
    warnings: valid.warnings,
  };
}

module.exports = { transcribe, TRANSCRIPTION_SCHEMA, DEFAULT_MODEL };
