// Builds the cabin room from the reference photo, block by block.
//
// Orientation: you spawn at the near end (high Z) looking down the room (-Z),
// exactly like the camera in the photo.
//   -X = left  : pine-panelled wall, black piano, floral armchair, exercise
//                bike, the long green shag rug
//   +X = right : log wall with the curtained windows and radiators, the floral
//                bed, the house plant, the beige sofa, the wall hanging
//   -Z = far    : window over the white bed, framed pictures
// One voxel is roughly 0.4 m, so the room is about 6.8 m x 12.4 m x 2.8 m.

import * as B from './blocks.js';
import { World } from './world.js';

export const ROOM = {
  size: [64, 32, 64],
  floorY: 8, // top surface of the floorboards
  ceilY: 16,
  minX: 14, maxX: 30, // interior, inclusive
  minZ: 10, maxZ: 40,
  spawn: [20.5, 9, 38.5],
  spawnYaw: 0, // looking towards -Z, down the length of the room
};

function fill(w, x0, y0, z0, x1, y1, z1, id) {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) {
        w.setRaw(x, y, z, id);
      }
    }
  }
}

function tree(w, x, z, h = 6) {
  const base = ROOM.floorY + 1;
  fill(w, x, base, z, x, base + h, z, B.TREE);
  const top = base + h;
  for (let dy = -2; dy <= 2; dy++) {
    const r = dy <= 0 ? 2 : dy === 1 ? 2 : 1;
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.abs(dx) === r && Math.abs(dz) === r && r > 1) continue;
        if (dx === 0 && dz === 0 && dy <= 0) continue;
        w.setRaw(x + dx, top + dy, z + dz, B.LEAVES);
      }
    }
  }
}

export function generateRoom(world = new World(...ROOM.size)) {
  const { floorY, ceilY, minX, maxX, minZ, maxZ } = ROOM;
  const wallMinX = minX - 1;
  const wallMaxX = maxX + 1;
  const wallMinZ = minZ - 1;
  const wallMaxZ = maxZ + 1;
  const { sx, sz } = world;

  // --- ground and meadow outside ---------------------------------------
  fill(world, 0, 0, 0, sx - 1, floorY - 4, sz - 1, B.STONE);
  fill(world, 0, floorY - 3, 0, sx - 1, floorY - 1, sz - 1, B.DIRT);
  fill(world, 0, floorY, 0, sx - 1, floorY, sz - 1, B.GRASS);

  for (const [tx, tz, th] of [[6, 16, 7], [8, 30, 6], [5, 44, 8], [40, 12, 7], [44, 26, 6], [38, 46, 7], [52, 34, 8], [30, 53, 6], [14, 50, 7]]) {
    tree(world, tx, tz, th);
  }

  // --- shell: floor, walls, ceiling -------------------------------------
  fill(world, wallMinX, floorY, wallMinZ, wallMaxX, floorY, wallMaxZ, B.FLOOR);
  fill(world, wallMinX, floorY + 1, wallMinZ, wallMaxX, ceilY, wallMaxZ, B.AIR);
  fill(world, wallMinX, ceilY, wallMinZ, wallMaxX, ceilY, wallMaxZ, B.CEILING);

  // Log walls all round; the near-left corner is lighter pine panelling,
  // as in the photo where the boarded wall meets the darker logs.
  fill(world, wallMinX, floorY + 1, wallMinZ, wallMinX, ceilY - 1, wallMaxZ, B.LOG);
  fill(world, wallMaxX, floorY + 1, wallMinZ, wallMaxX, ceilY - 1, wallMaxZ, B.LOG);
  fill(world, wallMinX, floorY + 1, wallMinZ, wallMaxX, ceilY - 1, wallMinZ, B.LOG_DARK);
  fill(world, wallMinX, floorY + 1, wallMaxZ, wallMaxX, ceilY - 1, wallMaxZ, B.LOG);
  fill(world, wallMinX, floorY + 1, 26, wallMinX, ceilY - 1, wallMaxZ, B.PANEL);

  // Stub wall that juts in on the left, forming the archway in the photo.
  fill(world, wallMinX + 1, floorY + 1, 25, wallMinX + 3, ceilY - 1, 25, B.PANEL);

  // Dark beams under the ceiling, plus the long one running down the room.
  for (const z of [13, 19, 25, 31, 37]) {
    fill(world, wallMinX, ceilY - 1, z, wallMaxX, ceilY - 1, z, B.BEAM);
  }
  fill(world, 27, ceilY - 1, wallMinZ, 27, ceilY - 1, 24, B.BEAM);

  // --- doorway at the near end, with a step down to the meadow ----------
  fill(world, 20, floorY + 1, wallMaxZ, 23, floorY + 5, wallMaxZ, B.AIR);
  fill(world, 20, floorY, wallMaxZ + 1, 23, floorY, wallMaxZ + 2, B.FLOOR_DARK);

  // --- windows ----------------------------------------------------------
  // Far wall, above the white bed.
  cutWindow(world,'z', wallMinZ, 15, 17, 11, 13);
  // Right-hand wall: the big curtained window with a radiator under it, and
  // the second window further down the room.
  cutWindow(world,'x', wallMaxX, 16, 19, 11, 13);
  cutWindow(world,'x', wallMaxX, 24, 27, 11, 13);
  fill(world, maxX, floorY + 1, 16, maxX, floorY + 2, 19, B.RADIATOR);
  fill(world, maxX, floorY + 1, 24, maxX, floorY + 2, 27, B.RADIATOR);

  // --- lights: the chandelier and the small ceiling lamp at the far end --
  world.setRaw(22, ceilY - 1, 22, B.BEAM);
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    world.setRaw(22 + dx, ceilY - 2, 22 + dz, B.LAMP);
  }
  world.setRaw(20, ceilY - 1, 14, B.LAMP);
  world.setRaw(24, ceilY - 1, 34, B.LAMP);

  // --- rugs (woven into the floorboards, like carpets lying flat) --------
  fill(world, 15, floorY, 28, 20, floorY, 40, B.RUG_GREEN);
  fill(world, 21, floorY, 26, 27, floorY, 33, B.RUG_GREY);
  fill(world, 16, floorY, 20, 19, floorY, 25, B.RUG_RED);

  // --- the white bed under the far window -------------------------------
  fill(world, 15, floorY + 1, 11, 19, floorY + 1, 17, B.FLOOR_DARK);
  fill(world, 15, floorY + 2, 11, 19, floorY + 2, 17, B.BED_WHITE);
  fill(world, 15, floorY + 3, 11, 18, floorY + 3, 12, B.BED_WHITE); // pillows

  // --- the floral bed along the right-hand wall --------------------------
  fill(world, 26, floorY + 1, 18, 30, floorY + 1, 25, B.FLOOR_DARK);
  fill(world, 26, floorY + 2, 18, 30, floorY + 2, 25, B.BED_FLORAL);
  fill(world, 27, floorY + 3, 18, 30, floorY + 3, 19, B.BED_FLORAL);

  // --- floral armchair with cushions, left of the archway ----------------
  fill(world, 14, floorY + 1, 29, 16, floorY + 2, 31, B.ARMCHAIR);
  fill(world, 14, floorY + 3, 29, 14, floorY + 3, 31, B.ARMCHAIR); // back
  fill(world, 16, floorY + 3, 29, 16, floorY + 3, 31, B.ARMCHAIR); // arm
  world.setRaw(15, floorY + 3, 30, B.RUG_RED);
  world.setRaw(15, floorY + 3, 31, B.BLANKET_BLUE);

  // --- exercise bike ----------------------------------------------------
  fill(world, 17, floorY + 1, 33, 17, floorY + 1, 35, B.METAL); // floor rails
  fill(world, 17, floorY + 2, 34, 17, floorY + 3, 34, B.METAL); // upright
  world.setRaw(17, floorY + 4, 35, B.METAL); // saddle
  world.setRaw(17, floorY + 4, 33, B.METAL); // handlebars

  // --- black piano against the panelled wall ----------------------------
  fill(world, 14, floorY + 1, 35, 15, floorY + 3, 40, B.PIANO);
  world.setRaw(14, floorY + 4, 36, B.FLOWER); // peonies on the lid
  world.setRaw(15, floorY + 4, 39, B.PICTURE);

  // --- beige sofa in the foreground, with throws and bags ---------------
  fill(world, 25, floorY + 1, 35, 30, floorY + 2, 40, B.SOFA);
  fill(world, 25, floorY + 3, 39, 30, floorY + 3, 40, B.SOFA); // backrest
  fill(world, 21, floorY + 1, 36, 22, floorY + 1, 37, B.RUG_GREY); // low stool
  fill(world, 21, floorY + 2, 36, 22, floorY + 2, 37, B.BLANKET_YELLOW);
  world.setRaw(21, floorY + 3, 36, B.BLANKET_BLUE);
  fill(world, 24, floorY + 1, 34, 24, floorY + 3, 35, B.PAPER_BAG);

  // --- house plant beside the sofa --------------------------------------
  fill(world, 29, floorY + 1, 27, 30, floorY + 1, 28, B.POT);
  fill(world, 29, floorY + 2, 27, 30, floorY + 4, 28, B.PLANT);

  // --- wall hanging, pictures and flowers --------------------------------
  fill(world, maxX, 12, 11, maxX, ceilY - 1, 15, B.WALL_RUG);
  fill(world, 21, 12, minZ, 22, 13, minZ, B.PICTURE);
  world.setRaw(24, 13, minZ, B.PICTURE);
  world.setRaw(26, floorY + 1, minZ, B.POT);
  world.setRaw(26, floorY + 2, minZ, B.FLOWER);

  // --- lace curtains around every window ---------------------------------
  curtains(world, 'z', minZ, 14, 18, 11, 14);
  curtains(world, 'x', maxX, 15, 20, 11, 14);
  curtains(world, 'x', maxX, 23, 28, 11, 14);

  // --- roof over the cabin ----------------------------------------------
  const span = Math.floor((wallMaxX - wallMinX) / 2);
  for (let k = 0; k <= span; k++) {
    const y = ceilY + 1 + k;
    fill(world, wallMinX + k, y, wallMinZ - 1, wallMinX + k, y, wallMaxZ + 1, B.BEAM);
    fill(world, wallMaxX - k, y, wallMinZ - 1, wallMaxX - k, y, wallMaxZ + 1, B.BEAM);
    // gable ends
    fill(world, wallMinX + k, ceilY + 1, wallMinZ, wallMaxX - k, y, wallMinZ, B.LOG_DARK);
    fill(world, wallMinX + k, ceilY + 1, wallMaxZ, wallMaxX - k, y, wallMaxZ, B.LOG);
  }

  world.computeLight();
  return world;
}

/** Cut a window opening and glaze it. axis 'x' or 'z' names the wall plane. */
function cutWindow(world, axis, at, a0, a1, y0, y1) {
  for (let a = a0; a <= a1; a++) {
    for (let y = y0; y <= y1; y++) {
      if (axis === 'x') world.setRaw(at, y, a, B.GLASS);
      else world.setRaw(a, y, at, B.GLASS);
    }
  }
  // pine sill under the opening
  for (let a = a0; a <= a1; a++) {
    if (axis === 'x') world.setRaw(at, y0 - 1, a, B.PANEL);
    else world.setRaw(a, y0 - 1, at, B.PANEL);
  }
}

/** Hang curtains on the inside face of a window: side panels plus a valance. */
function curtains(world, axis, inner, a0, a1, y0, y1) {
  for (let y = y0; y <= y1; y++) {
    for (const a of [a0, a1]) {
      if (axis === 'x') world.setRaw(inner, y, a, B.CURTAIN);
      else world.setRaw(a, y, inner, B.CURTAIN);
    }
  }
  for (let a = a0; a <= a1; a++) {
    if (axis === 'x') world.setRaw(inner, y1, a, B.CURTAIN);
    else world.setRaw(a, y1, inner, B.CURTAIN);
  }
}
