'use strict';

/**
 * Character Error Rate (CER) and Word Error Rate (WER) via Levenshtein
 * distance. No dependencies.
 *
 * Rates are edit distance divided by REFERENCE length, so they can exceed 1
 * when the hypothesis is much longer than the reference.
 *
 * normalize(text, opts):
 *   opts.caseFold        (default true)  lowercase everything
 *   opts.stripPunct      (default true)  remove punctuation (unicode-aware)
 *   opts.collapseSpace   (default true)  collapse all whitespace runs to ' '
 */

function normalize(text, opts = {}) {
  const { caseFold = true, stripPunct = true, collapseSpace = true } = opts;
  let t = String(text);
  if (caseFold) t = t.toLowerCase();
  if (stripPunct) {
    // Remove punctuation & symbols; keep letters, numbers, whitespace.
    t = t.replace(/[^\p{L}\p{N}\s]/gu, '');
  }
  if (collapseSpace) t = t.replace(/\s+/g, ' ').trim();
  return t;
}

/**
 * Levenshtein distance between two sequences (strings or arrays).
 * Two-row dynamic programming, O(len(a)*len(b)) time, O(len(b)) space.
 */
function levenshtein(a, b) {
  const n = a.length;
  const m = b.length;
  if (n === 0) return m;
  if (m === 0) return n;

  let prev = new Array(m + 1);
  let curr = new Array(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;

  for (let i = 1; i <= n; i++) {
    curr[0] = i;
    const ai = a[i - 1];
    for (let j = 1; j <= m; j++) {
      const cost = ai === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[m];
}

/** Character error rate: distance / reference character count. */
function cer(reference, hypothesis, opts = {}) {
  const ref = normalize(reference, opts);
  const hyp = normalize(hypothesis, opts);
  if (ref.length === 0) return hyp.length === 0 ? 0 : 1;
  return levenshtein(ref, hyp) / ref.length;
}

/** Word error rate: word-level distance / reference word count. */
function wer(reference, hypothesis, opts = {}) {
  const ref = tokens(reference, opts);
  const hyp = tokens(hypothesis, opts);
  if (ref.length === 0) return hyp.length === 0 ? 0 : 1;
  return levenshtein(ref, hyp) / ref.length;
}

function tokens(text, opts = {}) {
  const t = normalize(text, opts);
  return t.length ? t.split(' ') : [];
}

module.exports = { normalize, levenshtein, cer, wer, tokens };
