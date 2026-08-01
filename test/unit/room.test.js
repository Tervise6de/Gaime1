import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRoom, ROOM } from '../../src/room.js';
import { World } from '../../src/world.js';
import { Player, PLAYER } from '../../src/player.js';
import { buildChunkMesh } from '../../src/mesher.js';
import * as B from '../../src/blocks.js';

const world = generateRoom(new World(...ROOM.size));

test('the room has a floor, walls and a ceiling', () => {
  const midX = 22;
  const midZ = 30;
  assert.equal(world.get(midX, ROOM.floorY, midZ), B.RUG_GREY, 'rug lies in the floor surface');
  assert.equal(world.get(15, ROOM.floorY, 22), B.FLOOR, 'bare floorboards elsewhere');
  assert.ok(B.isOpaque(world.get(ROOM.minX - 1, 12, midZ)), 'left wall is solid');
  assert.ok(B.isOpaque(world.get(ROOM.maxX + 1, 12, 35)), 'right wall is solid');
  assert.equal(world.get(midX, ROOM.ceilY, midZ), B.CEILING);
  assert.equal(world.get(midX, ROOM.ceilY - 1, 25), B.BEAM, 'dark beams cross the ceiling');
});

test('the room is hollow from floor to ceiling in the open middle', () => {
  for (let y = ROOM.floorY + 1; y < ROOM.ceilY - 1; y++) {
    assert.equal(world.get(22, y, 30), B.AIR, `expected air at y=${y}`);
  }
});

test('windows are glazed and dressed with curtains', () => {
  assert.equal(world.get(ROOM.maxX + 1, 12, 17), B.GLASS, 'right-hand window');
  assert.equal(world.get(16, 12, ROOM.minZ - 1), B.GLASS, 'far window');
  assert.equal(world.get(ROOM.maxX, 12, 15), B.CURTAIN);
  assert.equal(world.get(ROOM.maxX, 10, 17), B.RADIATOR, 'radiator under the window');
});

test('the furniture from the photo is in place', () => {
  assert.equal(world.get(14, 11, 37), B.PIANO, 'black piano on the left');
  assert.equal(world.get(17, ROOM.floorY + 2, 14), B.BED_WHITE, 'white bed under the far window');
  assert.equal(world.get(28, ROOM.floorY + 2, 21), B.BED_FLORAL, 'floral bed by the right wall');
  assert.equal(world.get(15, ROOM.floorY + 1, 30), B.ARMCHAIR, 'armchair');
  assert.equal(world.get(27, ROOM.floorY + 1, 37), B.SOFA, 'sofa in the foreground');
  assert.equal(world.get(17, ROOM.floorY + 1, 34), B.METAL, 'exercise bike');
  assert.equal(world.get(18, ROOM.floorY, 32), B.RUG_GREEN, 'green shag rug');
  assert.equal(world.get(29, ROOM.floorY + 3, 27), B.PLANT, 'house plant');
});

test('the chandelier hangs from the ceiling and lights the room', () => {
  assert.equal(world.get(22, ROOM.ceilY - 2, 22), B.LAMP);
  assert.ok(world.blockLightAt(22, ROOM.floorY + 1, 22) > 6, 'floor under the chandelier is lit');
});

test('daylight reaches the room through the windows', () => {
  const byWindow = world.skyAt(ROOM.maxX - 1, 12, 17);
  assert.ok(byWindow > 4, `expected daylight near the window, got ${byWindow}`);
  assert.ok(world.skyAt(22, 12, 30) > 0, 'some daylight carries into the middle of the room');
});

test('you can walk out of the doorway', () => {
  for (let y = ROOM.floorY + 1; y <= ROOM.floorY + 4; y++) {
    assert.equal(world.get(21, y, ROOM.maxZ + 1), B.AIR, 'doorway is open');
  }
  assert.equal(world.get(21, ROOM.floorY, ROOM.maxZ + 4), B.GRASS, 'meadow outside');
});

test('the spawn point is standing room, on solid ground', () => {
  assert.equal(Player.intersectsSolid(world, ROOM.spawn), false, 'spawn is clear');
  assert.ok(world.isSolidAt(Math.floor(ROOM.spawn[0]), ROOM.spawn[1] - 1, Math.floor(ROOM.spawn[2])), 'floor underfoot');
  const headroom = ROOM.ceilY - ROOM.spawn[1];
  assert.ok(headroom > PLAYER.height, `ceiling must clear the player (${headroom} vs ${PLAYER.height})`);
});

test('gravity pulls the player to the floor and jumping lifts them', () => {
  const p = new Player([20.5, 11, 30.5]);
  const input = { forward: false, back: false, left: false, right: false, up: false, down: false, sprint: false };
  for (let i = 0; i < 200; i++) p.update(1 / 60, input, world);
  assert.ok(p.onGround, 'player lands');
  assert.ok(Math.abs(p.pos[1] - (ROOM.floorY + 1)) < 0.01, `lands on the floorboards, y=${p.pos[1]}`);

  input.up = true;
  p.update(1 / 60, input, world);
  assert.ok(p.pos[1] > ROOM.floorY + 1, 'jump leaves the ground');
});

test('the player cannot walk through a wall', () => {
  const p = new Player([16.5, ROOM.floorY + 1, 22.5]); // clear floor, no furniture
  assert.equal(Player.intersectsSolid(world, p.pos), false, 'test starts in open air');
  const input = { forward: false, back: false, left: true, right: false, up: false, down: false, sprint: true };
  for (let i = 0; i < 120; i++) p.update(1 / 60, input, world);
  assert.ok(p.pos[0] > ROOM.minX, `stopped inside the room, x=${p.pos[0]}`);
  assert.ok(p.pos[0] < ROOM.minX + 0.5 + PLAYER.halfWidth, `walked up to the wall, x=${p.pos[0]}`);
});

test('chunk meshes are well formed', () => {
  const mesh = buildChunkMesh(world, 1, 0, 1);
  assert.ok(mesh.solid.verts.length > 0, 'the room chunk produces geometry');
  assert.equal(mesh.solid.verts.length % 6, 0, 'six floats per vertex');
  const vertexCount = mesh.solid.verts.length / 6;
  assert.equal(mesh.solid.idx.length % 3, 0, 'triangles');
  for (const i of mesh.solid.idx) assert.ok(i < vertexCount, 'indices stay in range');
  for (let i = 5; i < mesh.solid.verts.length; i += 6) {
    const light = mesh.solid.verts[i];
    assert.ok(light >= 0 && light <= 1, `light ${light} out of range`);
  }
});

test('window glass is meshed in the translucent pass', () => {
  const cx = Math.floor((ROOM.maxX + 1) / 16);
  const mesh = buildChunkMesh(world, cx, 0, 1);
  assert.ok(mesh.blend.verts.length > 0, 'glass goes to the blended pass');
});
