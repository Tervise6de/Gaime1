'use strict';
const crypto = require('crypto');
const path = require('path');

const DEFAULT_EXPIRY_DAYS = 30;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per upload
const RATE_LIMIT_MAX = 30;               // uploads
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes per token

// extension -> acceptable mime types reported by browsers/OSes
const ALLOWED_TYPES = {
  jpg:  ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png:  ['image/png'],
  webp: ['image/webp'],
  pdf:  ['application/pdf'],
  csv:  ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip'],
};

/** Unguessable, URL-safe recipient token. */
function newToken() {
  return crypto.randomBytes(16).toString('base64url');
}

/** Randomized on-disk filename; original name lives only in the DB. */
function storedName(ext) {
  return crypto.randomBytes(16).toString('hex') + (ext ? '.' + ext : '');
}

/**
 * Validate an uploaded file by extension + reported mime type.
 * Returns { ok:true, ext } or { ok:false, reason }.
 */
function checkFile(originalName, mime) {
  const ext = path.extname(originalName || '').slice(1).toLowerCase();
  if (!ext || !Object.prototype.hasOwnProperty.call(ALLOWED_TYPES, ext)) {
    return { ok: false, reason: 'extension' };
  }
  const mimes = ALLOWED_TYPES[ext];
  if (!mimes.includes(String(mime || '').toLowerCase())) {
    return { ok: false, reason: 'mime' };
  }
  return { ok: true, ext };
}

/** Simple fixed-window-ish in-memory rate limiter (sliding log). */
class RateLimiter {
  constructor(max = RATE_LIMIT_MAX, windowMs = RATE_LIMIT_WINDOW_MS) {
    this.max = max;
    this.windowMs = windowMs;
    this.hits = new Map(); // key -> [timestamps]
  }

  /** Record an attempt for key; returns true if allowed. */
  allow(key, now = Date.now()) {
    const cutoff = now - this.windowMs;
    const list = (this.hits.get(key) || []).filter((t) => t > cutoff);
    if (list.length >= this.max) {
      this.hits.set(key, list);
      return false;
    }
    list.push(now);
    this.hits.set(key, list);
    // opportunistic cleanup to bound memory
    if (this.hits.size > 10000) {
      for (const [k, v] of this.hits) {
        if (v.every((t) => t <= cutoff)) this.hits.delete(k);
      }
    }
    return true;
  }
}

module.exports = {
  newToken,
  storedName,
  checkFile,
  RateLimiter,
  DEFAULT_EXPIRY_DAYS,
  MAX_FILE_BYTES,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  ALLOWED_TYPES,
};
