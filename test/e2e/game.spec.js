import { test, expect } from '@playwright/test';

async function boot(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/');
  await page.waitForFunction(() => window.__cabin?.ready === true, null, { timeout: 20_000 });
  return errors;
}

test('the room loads and renders without errors', async ({ page }) => {
  const errors = await boot(page);
  await expect(page.locator('#error')).toBeHidden();
  await expect(page.locator('#menu')).toBeVisible();

  const stats = await page.evaluate(() => ({
    chunks: window.__cabin.renderer.chunks.size,
    draws: window.__cabin.renderer.drawCalls,
    spawn: window.__cabin.player.pos,
  }));
  expect(stats.chunks).toBeGreaterThan(0);
  expect(stats.draws).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('the view is a lit room, not an empty screen', async ({ page }) => {
  await boot(page);
  await page.waitForFunction(() => window.__cabin.frames > 30);

  // Sample the frame: a rendered room has many distinct colours, and the
  // wood tones make it warm (more red than blue) unlike the sky-blue clear.
  const stats = await page.evaluate(() => {
    const canvas = document.getElementById('view');
    const gl = canvas.getContext('webgl2');
    const w = canvas.width;
    const h = canvas.height;
    const px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const colours = new Set();
    let r = 0;
    let b = 0;
    let n = 0;
    for (let i = 0; i < px.length; i += 4 * 97) {
      colours.add(`${px[i] >> 3},${px[i + 1] >> 3},${px[i + 2] >> 3}`);
      r += px[i];
      b += px[i + 2];
      n++;
    }
    return { distinct: colours.size, avgR: r / n, avgB: b / n };
  });

  expect(stats.distinct).toBeGreaterThan(40);
  expect(stats.avgR).toBeGreaterThan(stats.avgB);
});

test('blocks can be broken and placed, and the change survives a reload', async ({ page }) => {
  await boot(page);
  const spot = await page.evaluate(() => {
    const { world, applyEdit } = window.__cabin;
    const before = world.get(22, 9, 30);
    applyEdit(22, 9, 30, 2); // put a dark floorboard down in the open room
    const after = world.get(22, 9, 30);
    return { before, after };
  });
  expect(spot.before).toBe(0);
  expect(spot.after).toBe(2);

  await page.waitForTimeout(600); // let the debounced save run
  await page.reload();
  await page.waitForFunction(() => window.__cabin?.ready === true);
  const restored = await page.evaluate(() => window.__cabin.world.get(22, 9, 30));
  expect(restored).toBe(2);

  // and breaking it again clears it
  await page.evaluate(() => window.__cabin.applyEdit(22, 9, 30, 0));
  expect(await page.evaluate(() => window.__cabin.world.get(22, 9, 30))).toBe(0);
});

test('the player looks at the room and can walk', async ({ page }) => {
  await boot(page);
  // At spawn you are looking down the length of an empty room, so aim at the
  // floorboards to check the ray finds them.
  const looking = await page.evaluate(() => {
    window.__cabin.player.pitch = -1.3;
    const hit = window.__cabin.target();
    return hit ? hit.id : null;
  });
  expect(looking).not.toBeNull();

  const moved = await page.evaluate(() => {
    const { player, world } = window.__cabin;
    const start = [...player.pos];
    const input = { forward: true, back: false, left: false, right: false, up: false, down: false, sprint: false };
    for (let i = 0; i < 60; i++) player.update(1 / 60, input, world);
    return { start, end: [...player.pos] };
  });
  expect(Math.abs(moved.end[2] - moved.start[2])).toBeGreaterThan(1);
});
