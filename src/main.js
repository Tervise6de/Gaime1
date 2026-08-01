// CabinCraft — glue: world, renderer, player, input and UI.
import { World } from './world.js';
import { generateRoom, ROOM } from './room.js';
import { Renderer } from './renderer.js';
import { Player, PLAYER } from './player.js';
import { forwardVector } from './mat4.js';
import { AIR, PALETTE, blockDef } from './blocks.js';
import { TILE } from './textures.js';

const SAVE_KEY = 'cabincraft.world.v1';
const HOTBAR_SIZE = 9;

const el = (id) => document.getElementById(id);
const canvas = el('view');

// The single-file build is injected into a host page whose <head> we do not
// control, and without this a phone lays the page out at 980 px wide and
// shrinks every control to a third of its size.
if (!document.querySelector('meta[name="viewport"]')) {
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover';
  document.head.append(meta);
}

function fail(message) {
  const box = el('error');
  box.hidden = false;
  box.textContent = message;
  console.error(message);
}

// --- world ---------------------------------------------------------------
const world = new World(...ROOM.size);
generateRoom(world);

let loadedEdits = 0;
try {
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    loadedEdits = world.loadEdits(saved);
    if (loadedEdits) world.computeLight();
  }
} catch {
  /* private mode or storage disabled — play without saving */
}

const player = new Player(ROOM.spawn, ROOM.spawnYaw);

let renderer;
try {
  renderer = new Renderer(canvas, world);
  renderer.buildAll();
} catch (err) {
  fail(String(err.message || err));
  throw err;
}

// --- hotbar and picker ---------------------------------------------------
const hotbar = PALETTE.slice(0, HOTBAR_SIZE);
let selected = 0;

function iconFor(blockId, size = TILE * 3) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const tile = blockDef(blockId).tiles.side;
  const sx = (tile % 16) * TILE;
  const sy = Math.floor(tile / 16) * TILE;
  ctx.drawImage(renderer.atlasCanvas, sx, sy, TILE, TILE, 0, 0, size, size);
  return c;
}

function renderHotbar() {
  const bar = el('hotbar');
  bar.replaceChildren();
  hotbar.forEach((id, i) => {
    const slot = document.createElement('div');
    slot.className = 'slot' + (i === selected ? ' active' : '');
    slot.title = blockDef(id).label;
    slot.append(iconFor(id));
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = String(i + 1);
    slot.append(num);
    slot.addEventListener('click', () => {
      selected = i;
      renderHotbar();
      showHeld();
    });
    bar.append(slot);
  });
}

let heldTimer = 0;
function showHeld() {
  const held = el('held');
  held.textContent = blockDef(hotbar[selected]).label;
  held.style.opacity = '1';
  clearTimeout(heldTimer);
  heldTimer = setTimeout(() => { held.style.opacity = '0'; }, 1600);
}

function renderPicker() {
  const grid = el('picker-grid');
  grid.replaceChildren();
  for (const id of PALETTE) {
    const item = document.createElement('div');
    item.className = 'pick';
    item.append(iconFor(id));
    const label = document.createElement('span');
    label.textContent = blockDef(id).label;
    item.append(label);
    item.addEventListener('click', () => {
      hotbar[selected] = id;
      renderHotbar();
      showHeld();
      togglePicker(false);
    });
    grid.append(item);
  }
}

let pickerOpen = false;
function togglePicker(open) {
  pickerOpen = open ?? !pickerOpen;
  el('picker').hidden = !pickerOpen;
  el('picker-slot').textContent = String(selected + 1);
  if (TOUCH) el('touch').hidden = pickerOpen || paused; // thumbs off while choosing
  if (pickerOpen && document.pointerLockElement) document.exitPointerLock();
}

// --- editing -------------------------------------------------------------
let saveTimer = 0;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(SAVE_KEY, world.saveEdits());
    } catch {
      /* ignore quota / disabled storage */
    }
  }, 400);
}

function applyEdit(x, y, z, id) {
  const prevSky = world.sky.slice();
  const prevBlock = world.block.slice();
  if (!world.set(x, y, z, id)) return false;
  world.computeLight();

  const dirty = world.chunksAround(x, y, z);
  const { sx, sz } = world;
  for (let i = 0; i < world.sky.length; i++) {
    if (world.sky[i] === prevSky[i] && world.block[i] === prevBlock[i]) continue;
    const bx = i % sx;
    const bz = Math.floor(i / sx) % sz;
    const by = Math.floor(i / (sx * sz));
    for (const key of world.chunksAround(bx, by, bz)) dirty.add(key);
  }
  renderer.rebuildKeys(dirty);
  scheduleSave();
  return true;
}

function breakBlock() {
  const hit = target();
  if (!hit) return;
  applyEdit(hit.x, hit.y, hit.z, AIR);
}

function placeBlock() {
  const hit = target();
  if (!hit) return;
  const x = hit.x + hit.normal[0];
  const y = hit.y + hit.normal[1];
  const z = hit.z + hit.normal[2];
  if (!world.inBounds(x, y, z) || world.get(x, y, z) !== AIR) return;
  const id = hotbar[selected];
  // Do not entomb the player in their own block.
  if (blockDef(id).solid) {
    world.setRaw(x, y, z, id);
    const blocked = Player.intersectsSolid(world, player.pos, player.crouching);
    world.setRaw(x, y, z, AIR);
    if (blocked) return;
  }
  applyEdit(x, y, z, id);
}

function pickBlock() {
  const hit = target();
  if (!hit) return;
  const existing = hotbar.indexOf(hit.id);
  if (existing >= 0) selected = existing;
  else hotbar[selected] = hit.id;
  renderHotbar();
  showHeld();
}

function target() {
  const eye = player.eyePosition;
  const dir = forwardVector(player.yaw, player.pitch);
  return world.raycast(eye, dir, renderer.reach);
}

// --- input ---------------------------------------------------------------
const input = { forward: false, back: false, left: false, right: false, up: false, down: false, sprint: false, jumpPressed: false };
let hudVisible = true;
let paused = true;
let started = false;
let hadPointerLock = false;

const KEYS = {
  KeyW: 'forward', ArrowUp: 'forward',
  KeyS: 'back', ArrowDown: 'back',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  Space: 'up',
  ShiftLeft: 'down', ShiftRight: 'down',
  ControlLeft: 'sprint', ControlRight: 'sprint',
};

addEventListener('keydown', (e) => {
  if (KEYS[e.code]) {
    input[KEYS[e.code]] = true;
    if (e.code === 'Space') e.preventDefault();
    return;
  }
  if (e.code === 'Escape') {
    if (pickerOpen) togglePicker(false);
    else if (started) stop();
    return;
  }
  if (e.code === 'KeyE') { togglePicker(); return; }
  if (e.code === 'KeyF') { player.flying = !player.flying; player.vel[1] = 0; return; }
  if (e.code === 'KeyQ') { pickBlock(); return; }
  if (e.code === 'KeyH') { hudVisible = !hudVisible; el('hud').hidden = !hudVisible || paused; return; }
  if (e.code === 'KeyR') { resetRoom(); return; }
  const n = Number(e.key);
  if (Number.isInteger(n) && n >= 1 && n <= HOTBAR_SIZE) {
    selected = n - 1;
    renderHotbar();
    showHeld();
  }
});

addEventListener('keyup', (e) => {
  if (KEYS[e.code]) input[KEYS[e.code]] = false;
});

addEventListener('blur', () => {
  for (const k of Object.keys(input)) input[k] = false;
});

function useTool(button) {
  if (button === 0) breakBlock();
  else if (button === 2) placeBlock();
  else if (button === 1) pickBlock();
}

// Pointer lock is the good path, but it is refused inside embedded frames,
// so dragging the mouse looks around there instead.
let dragging = false;
let dragDistance = 0;
let lastX = 0;
let lastY = 0;
let lockedAt = 0;

canvas.addEventListener('mousedown', (e) => {
  if (pickerOpen) return;
  if (!started) { start(); return; }
  if (document.pointerLockElement) {
    useTool(e.button);
  } else {
    dragging = true;
    dragDistance = 0;
    lastX = e.clientX;
    lastY = e.clientY;
  }
});

addEventListener('mouseup', (e) => {
  if (dragging && dragDistance < 6) useTool(e.button); // a click, not a look
  dragging = false;
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

addEventListener('wheel', (e) => {
  if (!started || pickerOpen) return;
  selected = (selected + (e.deltaY > 0 ? 1 : -1) + HOTBAR_SIZE) % HOTBAR_SIZE;
  renderHotbar();
  showHeld();
}, { passive: true });

addEventListener('mousemove', (e) => {
  if (!started) return;
  const locked = !!document.pointerLockElement;
  if (!locked && !dragging) return;
  // While dragging, client coordinates are more dependable than movementX.
  const dx = locked ? e.movementX : e.clientX - lastX;
  const dy = locked ? e.movementY : e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  // Just after pointer lock engages the browser reports the cursor's jump from
  // wherever it was, which would snap the view; and no real mouse travels more
  // than ~120 px between two events. Ignore both kinds of bogus movement.
  if (locked && performance.now() - lockedAt < 400) return;
  if (Math.abs(dx) > 120 || Math.abs(dy) > 120) return;
  dragDistance += Math.abs(dx) + Math.abs(dy);
  const s = 0.0022;
  player.yaw -= dx * s;
  player.pitch -= dy * s;
  const limit = Math.PI / 2 - 0.001;
  player.pitch = Math.max(-limit, Math.min(limit, player.pitch));
});

function setPaused(value) {
  paused = value;
  el('menu').classList.toggle('hidden', !paused);
  for (const id of ['crosshair', 'hotbar', 'held']) el(id).hidden = paused;
  if (TOUCH) el('touch').hidden = paused;
  el('hud').hidden = paused || !hudVisible;
  if (!paused) showHeld();
}

// --- touch controls ------------------------------------------------------
// A phone has no keyboard and no pointer lock: the left thumb steers a stick,
// the right thumb reaches Break/Place/Jump, and dragging anywhere else looks.
const TOUCH = matchMedia('(any-pointer: coarse)').matches
  || new URLSearchParams(location.search).has('touch');

const JOY_RADIUS = 54;
const JOY_DEADZONE = 7;
let joyTouch = null; // { id, cx, cy }
let lookTouch = null; // { id, x, y, moved, at }

function joystickZone(t) {
  return t.clientX < innerWidth * 0.5 && t.clientY > innerHeight * 0.45;
}

function setJoystick(dx, dy) {
  const knob = el('knob');
  const distance = Math.hypot(dx, dy);
  const scale = distance > JOY_RADIUS ? JOY_RADIUS / distance : 1;
  knob.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
  if (distance < JOY_DEADZONE) {
    input.moveForward = 0;
    input.moveRight = 0;
    input.sprint = false;
    return;
  }
  const pull = Math.min(1, distance / JOY_RADIUS);
  input.moveRight = (dx / distance) * pull;
  input.moveForward = -(dy / distance) * pull;
  input.sprint = pull > 0.92; // push the stick all the way to run
}

function releaseJoystick() {
  joyTouch = null;
  input.moveForward = 0;
  input.moveRight = 0;
  input.sprint = false;
  const stick = el('joystick');
  el('knob').style.transform = '';
  stick.classList.remove('active');
  stick.style.left = '';
  stick.style.bottom = '';
}

let lastTouchAt = 0;

function holdButton(id, onDown, onUp) {
  const button = el(id);
  const down = (e) => {
    e.preventDefault();
    lastTouchAt = performance.now();
    button.classList.add('on');
    onDown();
  };
  const up = (e) => {
    e.preventDefault();
    button.classList.remove('on');
    onUp?.();
  };
  button.addEventListener('touchstart', down, { passive: false });
  button.addEventListener('touchend', up, { passive: false });
  button.addEventListener('touchcancel', up, { passive: false });
  button.addEventListener('click', (e) => {
    e.preventDefault();
    if (performance.now() - lastTouchAt < 600) return; // already handled as a tap
    onDown();
    if (onUp) setTimeout(onUp, 120); // a click has no hold, so pulse it
  });
}

function setupTouch() {
  document.body.classList.add('touch');
  el('touch').hidden = false;
  hudVisible = false;
  el('play').textContent = 'Tap to play';
  el('menu-note').textContent = 'Left thumb walks, drag to look, tap a block to break it.';

  holdButton('t-jump', () => { input.up = true; input.jumpPressed = true; }, () => { input.up = false; });
  holdButton('t-down', () => { input.down = true; }, () => { input.down = false; });
  holdButton('t-break', breakBlock);
  holdButton('t-place', placeBlock);
  holdButton('t-blocks', () => togglePicker());
  holdButton('t-fly', () => {
    player.flying = !player.flying;
    player.vel[1] = 0;
    el('t-fly').classList.toggle('on', player.flying);
  });
  holdButton('t-full', () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  });

  canvas.addEventListener('touchstart', (e) => {
    if (!started) { start(); return; }
    for (const t of e.changedTouches) {
      if (!joyTouch && joystickZone(t)) {
        joyTouch = { id: t.identifier, cx: t.clientX, cy: t.clientY };
        el('joystick').classList.add('active');
        // move the stick under the thumb wherever it landed
        el('joystick').style.left = `${t.clientX - 66}px`;
        el('joystick').style.bottom = `${innerHeight - t.clientY - 66}px`;
        setJoystick(0, 0);
      } else if (!lookTouch) {
        lookTouch = { id: t.identifier, x: t.clientX, y: t.clientY, moved: 0, at: performance.now() };
      }
    }
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (joyTouch && t.identifier === joyTouch.id) {
        setJoystick(t.clientX - joyTouch.cx, t.clientY - joyTouch.cy);
      } else if (lookTouch && t.identifier === lookTouch.id) {
        const dx = t.clientX - lookTouch.x;
        const dy = t.clientY - lookTouch.y;
        lookTouch.x = t.clientX;
        lookTouch.y = t.clientY;
        lookTouch.moved += Math.abs(dx) + Math.abs(dy);
        const s = 0.0034; // a thumb travels less far than a mouse
        player.yaw -= dx * s;
        player.pitch -= dy * s;
        const limit = Math.PI / 2 - 0.001;
        player.pitch = Math.max(-limit, Math.min(limit, player.pitch));
      }
    }
    e.preventDefault();
  }, { passive: false });

  const endTouch = (e) => {
    for (const t of e.changedTouches) {
      if (joyTouch && t.identifier === joyTouch.id) releaseJoystick();
      else if (lookTouch && t.identifier === lookTouch.id) {
        // a tap, rather than a look, breaks the block in the crosshair
        if (lookTouch.moved < 12 && performance.now() - lookTouch.at < 400) breakBlock();
        lookTouch = null;
      }
    }
    e.preventDefault();
  };
  canvas.addEventListener('touchend', endTouch, { passive: false });
  canvas.addEventListener('touchcancel', endTouch, { passive: false });
}

function start() {
  started = true;
  setPaused(false);
  try {
    if (!TOUCH) canvas.requestPointerLock?.();
  } catch {
    /* embedded frames refuse pointer lock — drag to look instead */
  }
  setTimeout(() => {
    if (started && !TOUCH && !document.pointerLockElement) {
      el('held').textContent = 'Drag to look around';
      el('held').style.opacity = '1';
      clearTimeout(heldTimer);
      heldTimer = setTimeout(() => { el('held').style.opacity = '0'; }, 3000);
    }
  }, 400);
}

function stop() {
  started = false;
  setPaused(true);
  if (document.pointerLockElement) document.exitPointerLock();
}

el('play').addEventListener('click', start);
document.addEventListener('pointerlockchange', () => {
  // Leaving pointer lock (Esc) pauses; entering it never does.
  if (!document.pointerLockElement && started && hadPointerLock) stop();
  hadPointerLock = !!document.pointerLockElement;
  lockedAt = performance.now();
});

function resetRoom() {
  world.edits.clear();
  world.voxels.fill(0);
  generateRoom(world);
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch { /* ignore */ }
  renderer.buildAll();
  player.respawn();
}

// --- loop ----------------------------------------------------------------
let last = performance.now();
let fpsAccum = 0;
let fpsFrames = 0;
let fps = 0;
let frames = 0;

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  if (!paused) {
    player.update(dt, input, world);
    input.jumpPressed = false; // latched taps are good for exactly one frame
  }

  const hit = target();
  renderer.render({ eye: player.eyePosition, yaw: player.yaw, pitch: player.pitch, fov: 72 }, hit);

  fpsAccum += dt;
  fpsFrames++;
  if (fpsAccum >= 0.5) {
    fps = Math.round(fpsFrames / fpsAccum);
    fpsAccum = 0;
    fpsFrames = 0;
    if (hudVisible && !paused) {
      const [x, y, z] = player.pos;
      el('hud-pos').textContent = `x ${x.toFixed(1)}  y ${y.toFixed(1)}  z ${z.toFixed(1)}${player.flying ? '  · flying' : ''}`;
      el('hud-look').textContent = hit ? `looking at ${blockDef(hit.id).label}` : 'looking at —';
      el('hud-perf').textContent = `${fps} fps · ${renderer.drawCalls} draws`;
    }
  }
  frames++;
  requestAnimationFrame(frame);
}

renderHotbar();
renderPicker();
if (TOUCH) setupTouch();
setPaused(true);
if (loadedEdits) {
  el('menu-note').textContent = `Restored ${loadedEdits} of your changes from this browser.`;
}
requestAnimationFrame(frame);

// Handles for the end-to-end tests.
window.__cabin = {
  world,
  player,
  renderer,
  get ready() { return frames > 0; },
  get frames() { return frames; },
  get fps() { return fps; },
  applyEdit,
  target,
  input,
  touch: TOUCH,
  PLAYER,
};
