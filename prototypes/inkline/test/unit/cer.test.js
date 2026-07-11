'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { levenshtein, cer, wer, normalize, tokens } = require('../../harness/cer');

test('levenshtein: known distances', () => {
  assert.equal(levenshtein('', ''), 0);
  assert.equal(levenshtein('abc', ''), 3);
  assert.equal(levenshtein('', 'abc'), 3);
  assert.equal(levenshtein('abc', 'abc'), 0);
  assert.equal(levenshtein('kitten', 'sitting'), 3);
  assert.equal(levenshtein('flaw', 'lawn'), 2);
  assert.equal(levenshtein('saturday', 'sunday'), 3);
  assert.equal(levenshtein('intention', 'execution'), 5);
});

test('levenshtein: works on arrays (word level)', () => {
  assert.equal(levenshtein(['a', 'b', 'c'], ['a', 'x', 'c']), 1);
  assert.equal(levenshtein(['a'], ['a', 'b', 'c']), 2);
});

test('normalize: case folding, punctuation, whitespace', () => {
  assert.equal(normalize('Hello,   World!'), 'hello world');
  assert.equal(normalize("Nature's God — entitled?"), 'natures god entitled');
  assert.equal(normalize('Hello, World!', { caseFold: false }), 'Hello World');
  assert.equal(normalize('a,b', { stripPunct: false }), 'a,b');
  assert.equal(normalize('  a \n\n b\t c '), 'a b c');
});

test('cer: identical text is 0, fully different reference-length-normalized', () => {
  assert.equal(cer('four score and seven', 'four score and seven'), 0);
  assert.equal(cer('abc', 'abc'), 0);
  // 'abcd' -> 'abxd': 1 substitution over 4 reference chars
  assert.equal(cer('abcd', 'abxd'), 0.25);
  // empty reference with non-empty hypothesis
  assert.equal(cer('', 'anything'), 1);
  assert.equal(cer('', ''), 0);
});

test('cer: normalization folds case and punctuation by default', () => {
  assert.equal(cer('Four score, and seven years ago.', 'four score and seven years ago'), 0);
  assert.ok(cer('Four score', 'four score', { caseFold: false }) > 0);
});

test('wer: known word-level distances', () => {
  assert.equal(wer('the cat sat', 'the cat sat'), 0);
  // 1 substitution over 3 reference words
  assert.ok(Math.abs(wer('the cat sat', 'the dog sat') - 1 / 3) < 1e-12);
  // insertion: hypothesis has an extra word
  assert.ok(Math.abs(wer('the cat sat', 'the big cat sat') - 1 / 3) < 1e-12);
  assert.equal(wer('', ''), 0);
  assert.equal(wer('', 'word'), 1);
});

test('tokens: splits normalized words', () => {
  assert.deepEqual(tokens('Hello, World!'), ['hello', 'world']);
  assert.deepEqual(tokens('   '), []);
});
