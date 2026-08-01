import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../../src/world.js';
import * as B from '../../src/blocks.js';

test('indices are unique and round-trip', () => {
  const w = new World(8, 8, 8);
  const seen = new Set();
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      for (let z = 0; z < 8; z++) {
        const i = w.idx(x, y, z);
        assert.equal(seen.has(i), false, `duplicate index at ${x},${y},${z}`);
        seen.add(i);
      }
    }
  }
  assert.equal(seen.size, 8 * 8 * 8);
});

test('get and set respect bounds', () => {
  const w = new World(4, 4, 4);
  assert.equal(w.set(1, 2, 3, B.LOG), true);
  assert.equal(w.get(1, 2, 3), B.LOG);
  assert.equal(w.set(1, 2, 3, B.LOG), false, 'setting the same block is a no-op');
  assert.equal(w.get(9, 9, 9), B.AIR);
  assert.equal(w.inBounds(-1, 0, 0), false);
});

test('outside the map is solid horizontally but open above', () => {
  const w = new World(4, 4, 4);
  assert.equal(w.isSolidAt(-1, 1, 1), true);
  assert.equal(w.isSolidAt(1, -1, 1), true);
  assert.equal(w.isSolidAt(1, 9, 1), false);
});

test('raycast hits the first block and reports the face it entered', () => {
  const w = new World(16, 16, 16);
  w.setRaw(8, 4, 4, B.LOG);
  const hit = w.raycast([4.5, 4.5, 4.5], [1, 0, 0], 10);
  assert.ok(hit, 'expected a hit');
  assert.deepEqual([hit.x, hit.y, hit.z], [8, 4, 4]);
  assert.deepEqual(hit.normal, [-1, 0, 0]);
  assert.equal(hit.id, B.LOG);
});

test('raycast misses when nothing is in range', () => {
  const w = new World(16, 16, 16);
  w.setRaw(15, 4, 4, B.LOG);
  assert.equal(w.raycast([4.5, 4.5, 4.5], [1, 0, 0], 3), null);
});

test('daylight fills open sky and fades under a roof', () => {
  const w = new World(16, 8, 16);
  for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) w.setRaw(x, 0, z, B.STONE);
  // a sealed box with one open side
  for (let x = 4; x <= 10; x++) for (let z = 4; z <= 10; z++) w.setRaw(x, 4, z, B.STONE);
  w.computeLight();
  assert.equal(w.skyAt(1, 5, 1), 15, 'open sky is full daylight');
  assert.ok(w.skyAt(7, 2, 7) < 15, 'under the roof is dimmer than open sky');
  assert.ok(w.skyAt(7, 2, 7) > 0, 'light still creeps in from the sides');
  assert.equal(w.skyAt(7, 0, 7), 0, 'inside stone stays dark');
});

test('a lamp lights its surroundings and decays with distance', () => {
  const w = new World(16, 16, 16);
  w.setRaw(8, 8, 8, B.LAMP);
  w.computeLight();
  assert.equal(w.blockLightAt(8, 8, 8), 15, 'the lamp itself is at full brightness');
  assert.equal(w.blockLightAt(9, 8, 8), 14, 'one block away loses one level');
  assert.equal(w.blockLightAt(11, 8, 8), 12);
  assert.equal(w.blockLightAt(8, 8, 0), 7, 'eight blocks away');
});

test('edits serialise and restore', () => {
  const a = new World(8, 8, 8);
  a.set(1, 1, 1, B.PIANO);
  a.set(2, 3, 4, B.RUG_GREEN);
  const json = a.saveEdits();

  const b = new World(8, 8, 8);
  assert.equal(b.loadEdits(json), 2);
  assert.equal(b.get(1, 1, 1), B.PIANO);
  assert.equal(b.get(2, 3, 4), B.RUG_GREEN);
});

test('corrupt or hostile save data is ignored safely', () => {
  const w = new World(8, 8, 8);
  assert.equal(w.loadEdits('not json'), 0);
  assert.equal(w.loadEdits('{"a":1}'), 0);
  assert.equal(w.loadEdits('[[999999,3],["x",1],[1,900],[2,3]]'), 1);
  assert.equal(w.get(2, 0, 0), 3);
});

test('chunksAround covers the block and its neighbouring chunks', () => {
  const w = new World(32, 32, 32);
  const inside = w.chunksAround(8, 8, 8);
  assert.equal(inside.size, 1);
  const onBorder = w.chunksAround(15, 8, 8);
  assert.equal(onBorder.size, 2, 'a block on a chunk face touches two chunks');
});
