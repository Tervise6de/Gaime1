'use strict';

/**
 * Provider-agnostic transcription module.
 *
 *   transcribe(imagePath, opts) -> {
 *     status: 'ok' | 'failed',
 *     provider: string,                      // e.g. 'stub' or 'anthropic:claude-sonnet-5'
 *     lines: [{ words: [{ text, confidence: 0..1 }] }],
 *     warnings: [string],
 *   }
 *
 * Provider selection:
 *   TRANSCRIBE_PROVIDER=anthropic + ANTHROPIC_API_KEY present -> real Anthropic vision provider
 *   otherwise                                                 -> deterministic stub (clearly labeled)
 */

function activeProviderName() {
  if (
    process.env.TRANSCRIBE_PROVIDER === 'anthropic' &&
    process.env.ANTHROPIC_API_KEY
  ) {
    return 'anthropic';
  }
  return 'stub';
}

async function transcribe(imagePath, opts = {}) {
  const name = activeProviderName();
  // Lazy require so the anthropic SDK is only loaded when actually selected.
  const provider =
    name === 'anthropic' ? require('./anthropic') : require('./stub');
  return provider.transcribe(imagePath, opts);
}

function isStub() {
  return activeProviderName() === 'stub';
}

module.exports = { transcribe, activeProviderName, isStub };
