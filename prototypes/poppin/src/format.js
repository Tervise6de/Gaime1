'use strict';

// Small pure formatting helpers, unit-tested.

// Cents -> "$40" or "$42.50". Whole-dollar amounts drop the ".00" for a
// cleaner boutique price list. Nullish price => '' (item has no set price).
function formatPrice(cents) {
  if (cents === null || cents === undefined || cents === '') return '';
  const n = Number(cents);
  if (!Number.isFinite(n)) return '';
  const dollars = n / 100;
  const whole = Math.round(dollars) === dollars;
  return whole
    ? `$${dollars.toFixed(0)}`
    : `$${dollars.toFixed(2)}`;
}

// Parse a user-typed price ("40", "$42.50", "42,50") into integer cents, or
// null if blank/invalid. Clamped to a sane non-negative range.
function parsePriceToCents(input) {
  if (input === null || input === undefined) return null;
  const cleaned = String(input).replace(/[^0-9.]/g, '').trim();
  if (cleaned === '') return null;
  const dollars = Number(cleaned);
  if (!Number.isFinite(dollars) || dollars < 0) return null;
  return Math.round(dollars * 100);
}

// Human wait phrasing from a minute count.
function formatWait(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m === 0) return 'up next';
  if (m < 60) return `~${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `~${h} hr` : `~${h} hr ${rem} min`;
}

module.exports = { formatPrice, parsePriceToCents, formatWait };
