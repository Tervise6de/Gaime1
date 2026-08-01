import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['Pixel 5'] });

// Playwright can tap but not drag a finger, so the gestures are dispatched as
// real TouchEvents against the canvas — the same events a phone would send.
const GESTURES = `
  window.__finger = {
    send(type, id, x, y, selector) {
      const el = document.querySelector(selector || '#view');
      const touch = new Touch({ identifier: id, target: el, clientX: x, clientY: y });
      el.dispatchEvent(new TouchEvent(type, {
        bubbles: true, cancelable: true,
        touches: type === 'touchend' ? [] : [touch],
        changedTouches: [touch],
      }));
    },
  };
`;

async function boot(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(GESTURES);
  await page.goto('/?touch=1');
  await page.waitForFunction(() => window.__cabin?.ready === true, null, { timeout: 20_000 });
  await page.tap('#play');
  return errors;
}

test('the touch controls appear on a phone', async ({ page }) => {
  const errors = await boot(page);
  await expect(page.locator('#touch')).toBeVisible();
  await expect(page.locator('#joystick')).toBeVisible();
  await expect(page.locator('#t-jump')).toBeVisible();
  await expect(page.locator('#menu')).toBeHidden();
  expect(await page.evaluate(() => window.__cabin.touch)).toBe(true);
  expect(errors).toEqual([]);
});

test('the thumbstick walks the player, and releasing it stops them', async ({ page }) => {
  await boot(page);
  const start = await page.evaluate(() => [...window.__cabin.player.pos]);

  // press near the bottom-left, then push the stick straight up = forwards
  await page.evaluate(() => window.__finger.send('touchstart', 1, 80, 700));
  await page.evaluate(() => window.__finger.send('touchmove', 1, 80, 640));
  const pushed = await page.evaluate(() => ({ ...window.__cabin.input }));
  expect(pushed.moveForward).toBeCloseTo(1, 1);
  expect(Math.abs(pushed.moveRight)).toBeLessThan(0.01);

  await page.waitForTimeout(600);
  const moved = await page.evaluate(() => [...window.__cabin.player.pos]);
  expect(start[2] - moved[2]).toBeGreaterThan(1); // walked towards -Z

  await page.evaluate(() => window.__finger.send('touchend', 1, 80, 640));
  const released = await page.evaluate(() => ({ ...window.__cabin.input }));
  expect(released.moveForward).toBe(0);
  expect(released.moveRight).toBe(0);

  await page.waitForTimeout(300);
  const a = await page.evaluate(() => window.__cabin.player.pos[2]);
  await page.waitForTimeout(300);
  const b = await page.evaluate(() => window.__cabin.player.pos[2]);
  expect(Math.abs(b - a)).toBeLessThan(0.05); // and stayed put
});

test('a half-pushed stick walks slower than a full one', async ({ page }) => {
  await boot(page);
  const distanceFor = async (offset) => {
    await page.evaluate(() => { window.__cabin.player.respawn(); });
    await page.evaluate(() => window.__finger.send('touchstart', 2, 80, 700));
    await page.evaluate((o) => window.__finger.send('touchmove', 2, 80, 700 - o), offset);
    const before = await page.evaluate(() => window.__cabin.player.pos[2]);
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => window.__cabin.player.pos[2]);
    await page.evaluate(() => window.__finger.send('touchend', 2, 80, 700));
    return before - after;
  };
  const gentle = await distanceFor(20); // a quarter of the way
  const full = await distanceFor(60); // hard against the rim
  expect(full).toBeGreaterThan(gentle * 1.5);
});

test('dragging looks around, and a tap breaks the block ahead', async ({ page }) => {
  await boot(page);
  const yawBefore = await page.evaluate(() => window.__cabin.player.yaw);
  await page.evaluate(() => {
    window.__finger.send('touchstart', 3, 300, 400);
    window.__finger.send('touchmove', 3, 380, 400);
    window.__finger.send('touchend', 3, 380, 400);
  });
  const yawAfter = await page.evaluate(() => window.__cabin.player.yaw);
  expect(yawAfter - yawBefore).toBeCloseTo(-80 * 0.0034, 3);

  // aim down at the floor, then tap without moving
  await page.evaluate(() => { window.__cabin.player.pitch = -1.2; });
  const aimed = await page.evaluate(() => {
    const h = window.__cabin.target();
    return h && { x: h.x, y: h.y, z: h.z };
  });
  expect(aimed).not.toBeNull();
  await page.evaluate(() => {
    window.__finger.send('touchstart', 4, 300, 400);
    window.__finger.send('touchend', 4, 300, 400);
  });
  const after = await page.evaluate((p) => window.__cabin.world.get(p.x, p.y, p.z), aimed);
  expect(after).toBe(0);
});

test('the jump and place buttons work under a thumb', async ({ page }) => {
  await boot(page);
  await page.waitForFunction(() => window.__cabin.player.onGround);
  const floor = await page.evaluate(() => window.__cabin.player.pos[1]);

  await page.tap('#t-jump');
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => window.__cabin.player.pos[1])).toBeGreaterThan(floor);
  expect(await page.evaluate(() => window.__cabin.input.up)).toBe(false); // released

  // place a block on the floor the player is looking at
  await page.evaluate(() => { window.__cabin.player.pitch = -1.2; });
  const spot = await page.evaluate(() => {
    const h = window.__cabin.target();
    return h && { x: h.x + h.normal[0], y: h.y + h.normal[1], z: h.z + h.normal[2] };
  });
  await page.tap('#t-place');
  const placed = await page.evaluate((p) => window.__cabin.world.get(p.x, p.y, p.z), spot);
  expect(placed).toBeGreaterThan(0);
});

test('the fly toggle lifts the player off the floor', async ({ page }) => {
  await boot(page);
  await page.tap('#t-fly');
  expect(await page.evaluate(() => window.__cabin.player.flying)).toBe(true);

  const before = await page.evaluate(() => window.__cabin.player.pos[1]);
  await page.evaluate(() => { window.__cabin.input.up = true; });
  await page.waitForTimeout(400);
  await page.evaluate(() => { window.__cabin.input.up = false; });
  expect(await page.evaluate(() => window.__cabin.player.pos[1])).toBeGreaterThan(before);
});

test('the block list opens over the controls and changes the held block', async ({ page }) => {
  await boot(page);
  await page.tap('#t-blocks');
  await expect(page.locator('#picker')).toBeVisible();
  await expect(page.locator('#touch')).toBeHidden(); // thumbs out of the way

  const before = await page.evaluate(() => window.__cabin.input && document.querySelector('#held').textContent);
  await page.locator('.pick').nth(20).tap();
  await expect(page.locator('#picker')).toBeHidden();
  await expect(page.locator('#touch')).toBeVisible();
  const after = await page.evaluate(() => document.querySelector('#held').textContent);
  expect(after).not.toBe(before);
});
