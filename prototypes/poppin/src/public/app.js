'use strict';

// Copy-to-clipboard for share links (falls back to select-all on older phones).
document.addEventListener('click', function (e) {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  e.preventDefault();
  const value = btn.getAttribute('data-copy');
  const done = () => {
    const label = btn.querySelector('[data-copy-label]') || btn;
    const original = label.textContent;
    label.textContent = 'Copied!';
    setTimeout(() => { label.textContent = original; }, 1600);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(value).then(done).catch(done);
  } else {
    const input = document.querySelector('[data-copy-target]');
    if (input) { input.focus(); input.select(); }
    done();
  }
});

// Native share sheet where available.
document.addEventListener('click', function (e) {
  const btn = e.target.closest('[data-share]');
  if (!btn) return;
  if (!navigator.share) return; // fall through to default (copy) behavior
  e.preventDefault();
  navigator.share({
    title: btn.getAttribute('data-share-title') || document.title,
    url: btn.getAttribute('data-share'),
  }).catch(() => {});
});

// Generic live poller: elements with [data-poll] fetch JSON every N ms and call
// a named renderer. Keeps the owner board + customer spot obviously live.
function startPoll(url, intervalMs, render) {
  let stopped = false;
  async function tick() {
    if (stopped) return;
    try {
      const res = await fetch(url, { headers: { 'accept': 'application/json' } });
      if (res.ok) render(await res.json());
    } catch (_) { /* transient; try again next tick */ }
    if (!stopped) setTimeout(tick, intervalMs);
  }
  setTimeout(tick, intervalMs);
  // Refresh immediately when the tab regains focus.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !stopped) tick();
  });
  return () => { stopped = true; };
}
window.startPoll = startPoll;
