// Render viewpoints of the room to PNGs, for checking how the room looks
// without putting on a headset of any kind.
//   node scripts/shoot.mjs [outputDir]
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const OUT = process.argv[2] || 'shots';
const PORT = 3210;

// Viewpoints: [name, x, y, z, yawDegrees, pitchDegrees]
const VIEWS = [
  ['01-from-the-doorway', 20.5, 9, 38.5, 0, -6],
  ['02-down-the-room', 22.5, 9, 34.5, 6, -3],
  ['03-piano-corner', 19.5, 9, 33.5, -55, -4],
  ['04-windows-and-beds', 20.5, 9, 24.5, 62, 0],
  ['05-far-window-bed', 22.5, 9, 20.5, 12, -2],
  ['06-sofa-and-plant', 22.0, 9, 30.5, 48, -8],
  ['07-ceiling-beams', 22.5, 9, 28.5, 10, 42],
  ['08-outside-the-cabin', 22.5, 9, 50.5, 0, 4],
];

const server = spawn('node', ['server.mjs'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
process.on('exit', () => server.kill());

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => console.error('page error:', e.message));

let ok = false;
for (let attempt = 0; attempt < 20 && !ok; attempt++) {
  try {
    await page.goto(`http://localhost:${PORT}/`, { timeout: 3000 });
    ok = true;
  } catch {
    await new Promise((r) => setTimeout(r, 400));
  }
}
await page.waitForFunction(() => window.__cabin?.ready === true, null, { timeout: 30_000 });
// start from the room as generated, ignoring anything a previous run saved
await page.evaluate(() => localStorage.clear());

for (const [name, x, y, z, yaw, pitch] of VIEWS) {
  await page.evaluate(({ x, y, z, yaw, pitch }) => {
    const { player } = window.__cabin;
    player.pos = [x, y, z];
    player.vel = [0, 0, 0];
    player.yaw = (yaw * Math.PI) / 180;
    player.pitch = (pitch * Math.PI) / 180;
    document.getElementById('menu').classList.add('hidden');
  }, { x, y, z, yaw, pitch });
  await page.waitForTimeout(220);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`${OUT}/${name}.png`);
}

await browser.close();
server.kill();
process.exit(0);
