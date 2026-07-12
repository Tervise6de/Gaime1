'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { formatPrice, parsePriceToCents, formatWait } = require('../../src/format');

test('formatPrice: whole dollars drop cents', () => {
  assert.equal(formatPrice(4800), '$48');
  assert.equal(formatPrice(0), '$0');
});

test('formatPrice: non-whole shows two decimals', () => {
  assert.equal(formatPrice(4250), '$42.50');
  assert.equal(formatPrice(199), '$1.99');
});

test('formatPrice: nullish / invalid => empty string', () => {
  assert.equal(formatPrice(null), '');
  assert.equal(formatPrice(undefined), '');
  assert.equal(formatPrice(''), '');
  assert.equal(formatPrice('abc'), '');
});

test('parsePriceToCents: strips symbols, rounds to cents', () => {
  assert.equal(parsePriceToCents('48'), 4800);
  assert.equal(parsePriceToCents('$42.50'), 4250);
  assert.equal(parsePriceToCents('  12 '), 1200);
  assert.equal(parsePriceToCents('1.999'), 200); // rounds
});

test('parsePriceToCents: blank/invalid => null; negatives rejected', () => {
  assert.equal(parsePriceToCents(''), null);
  assert.equal(parsePriceToCents(null), null);
  assert.equal(parsePriceToCents('abc'), null);
});

test('formatWait phrasing', () => {
  assert.equal(formatWait(0), 'up next');
  assert.equal(formatWait(8), '~8 min');
  assert.equal(formatWait(60), '~1 hr');
  assert.equal(formatWait(75), '~1 hr 15 min');
});
