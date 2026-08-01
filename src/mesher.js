// Turns a chunk of voxels into a renderable mesh: hidden faces are dropped,
// corners get ambient occlusion and each vertex samples the light field so
// daylight from the windows and the chandelier glow blend smoothly.
import { AIR, blockDef, isOpaque } from './blocks.js';
import { CHUNK } from './world.js';
import { ATLAS_COLS, ATLAS_SIZE } from './textures.js';

// origin + u*U + v*V walks the four corners of a face, counter-clockwise.
const FACES = [
  { n: [1, 0, 0], o: [1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], side: 'side', shade: 0.82 },
  { n: [-1, 0, 0], o: [0, 0, 0], u: [0, 0, 1], v: [0, 1, 0], side: 'side', shade: 0.78 },
  { n: [0, 1, 0], o: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1], side: 'top', shade: 1.0 },
  { n: [0, -1, 0], o: [0, 0, 0], u: [1, 0, 0], v: [0, 0, 1], side: 'bottom', shade: 0.55 },
  { n: [0, 0, 1], o: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], side: 'side', shade: 0.92 },
  { n: [0, 0, -1], o: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], side: 'side', shade: 0.88 },
];

const CORNERS = [[0, 0], [0, 1], [1, 1], [1, 0]];
const AO_LEVELS = [0.48, 0.68, 0.85, 1.0];
const AMBIENT = 0.3; // a cabin interior is dim, never pitch black
const INSET = 0.5 / ATLAS_SIZE;
const TS = 1 / ATLAS_COLS;

function tileUV(tile, cu, cv) {
  const tx = (tile % ATLAS_COLS) * TS;
  const ty = Math.floor(tile / ATLAS_COLS) * TS;
  return [
    tx + INSET + cu * (TS - 2 * INSET),
    ty + INSET + (1 - cv) * (TS - 2 * INSET),
  ];
}

function lightValue(world, x, y, z) {
  const sky = world.skyAt(x, y, z);
  const blk = world.blockLightAt(x, y, z);
  return Math.max(sky, blk) / 15;
}

/**
 * Build the two meshes (solid pass and translucent pass) for one chunk.
 * Returns interleaved vertices: x, y, z, u, v, light.
 */
export function buildChunkMesh(world, cx, cy, cz) {
  const solid = { verts: [], idx: [] };
  const blend = { verts: [], idx: [] };
  const x0 = cx * CHUNK;
  const y0 = cy * CHUNK;
  const z0 = cz * CHUNK;

  for (let x = x0; x < Math.min(x0 + CHUNK, world.sx); x++) {
    for (let y = y0; y < Math.min(y0 + CHUNK, world.sy); y++) {
      for (let z = z0; z < Math.min(z0 + CHUNK, world.sz); z++) {
        const id = world.get(x, y, z);
        if (id === AIR) continue;
        const def = blockDef(id);
        const target = def.blend ? blend : solid;

        for (const face of FACES) {
          const nx = x + face.n[0];
          const ny = y + face.n[1];
          const nz = z + face.n[2];
          const neighbour = world.inBounds(nx, ny, nz) ? world.get(nx, ny, nz) : AIR;
          if (isOpaque(neighbour)) continue;
          if (neighbour === id && (def.blend || def.cutout)) continue;

          const tile = def.tiles[face.side];
          const start = target.verts.length / 6;
          for (const [cu, cv] of CORNERS) {
            const px = x + face.o[0] + cu * face.u[0] + cv * face.v[0];
            const py = y + face.o[1] + cu * face.u[1] + cv * face.v[1];
            const pz = z + face.o[2] + cu * face.u[2] + cv * face.v[2];
            const [tu, tv] = tileUV(tile, cu, cv);

            // Sample the three neighbours that share this corner, one layer
            // out along the face normal.
            const su = cu ? 1 : -1;
            const sv = cv ? 1 : -1;
            const s1 = [nx + su * face.u[0], ny + su * face.u[1], nz + su * face.u[2]];
            const s2 = [nx + sv * face.v[0], ny + sv * face.v[1], nz + sv * face.v[2]];
            const dg = [s1[0] + s2[0] - nx, s1[1] + s2[1] - ny, s1[2] + s2[2] - nz];

            const o1 = isOpaque(world.get(...s1));
            const o2 = isOpaque(world.get(...s2));
            const oc = isOpaque(world.get(...dg));
            const ao = AO_LEVELS[o1 && o2 ? 0 : 3 - ((o1 ? 1 : 0) + (o2 ? 1 : 0) + (oc ? 1 : 0))];

            let sum = 0;
            let count = 0;
            for (const c of [[nx, ny, nz], s1, s2, dg]) {
              if (isOpaque(world.get(...c))) continue;
              sum += lightValue(world, ...c);
              count++;
            }
            const lit = count ? sum / count : lightValue(world, nx, ny, nz);
            const light = Math.min(1, (AMBIENT + (1 - AMBIENT) * Math.pow(lit, 0.85)) * ao * face.shade);

            target.verts.push(px, py, pz, tu, tv, light);
          }
          target.idx.push(start, start + 1, start + 2, start, start + 2, start + 3);
        }
      }
    }
  }

  return {
    solid: { verts: new Float32Array(solid.verts), idx: new Uint32Array(solid.idx) },
    blend: { verts: new Float32Array(blend.verts), idx: new Uint32Array(blend.idx) },
  };
}
