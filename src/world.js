// Voxel storage, flood-fill lighting and ray casting.
import { AIR, isOpaque, isSolid, lightCost, emitsLight } from './blocks.js';

export const CHUNK = 16;

export class World {
  constructor(sx = 64, sy = 32, sz = 64) {
    this.sx = sx;
    this.sy = sy;
    this.sz = sz;
    this.voxels = new Uint8Array(sx * sy * sz);
    this.sky = new Uint8Array(sx * sy * sz);
    this.block = new Uint8Array(sx * sy * sz);
    this.cx = Math.ceil(sx / CHUNK);
    this.cy = Math.ceil(sy / CHUNK);
    this.cz = Math.ceil(sz / CHUNK);
    this.edits = new Map(); // index -> id, so a session can be saved compactly
  }

  idx(x, y, z) {
    return (y * this.sz + z) * this.sx + x;
  }

  inBounds(x, y, z) {
    return x >= 0 && y >= 0 && z >= 0 && x < this.sx && y < this.sy && z < this.sz;
  }

  get(x, y, z) {
    if (!this.inBounds(x, y, z)) return AIR;
    return this.voxels[this.idx(x, y, z)];
  }

  /** Write without recording an edit — used by the world generator. */
  setRaw(x, y, z, id) {
    if (!this.inBounds(x, y, z)) return;
    this.voxels[this.idx(x, y, z)] = id;
  }

  /** Player-made change: recorded for saving, lighting/meshes refreshed by the caller. */
  set(x, y, z, id) {
    if (!this.inBounds(x, y, z)) return false;
    const i = this.idx(x, y, z);
    if (this.voxels[i] === id) return false;
    this.voxels[i] = id;
    this.edits.set(i, id);
    return true;
  }

  isSolidAt(x, y, z) {
    // Outside the world horizontally is solid so the player cannot walk off the map;
    // above the sky and below bedrock behave as open/solid respectively.
    if (y < 0) return true;
    if (y >= this.sy) return false;
    if (x < 0 || z < 0 || x >= this.sx || z >= this.sz) return true;
    return isSolid(this.voxels[this.idx(x, y, z)]);
  }

  skyAt(x, y, z) {
    if (y >= this.sy) return 15;
    if (!this.inBounds(x, y, z)) return 0;
    return this.sky[this.idx(x, y, z)];
  }

  blockLightAt(x, y, z) {
    if (!this.inBounds(x, y, z)) return 0;
    return this.block[this.idx(x, y, z)];
  }

  /** Daylight falls down every open column, then both light types flood sideways. */
  computeLight() {
    const { sx, sy, sz, voxels, sky, block } = this;
    sky.fill(0);
    block.fill(0);
    const queue = [];

    for (let z = 0; z < sz; z++) {
      for (let x = 0; x < sx; x++) {
        let level = 15;
        for (let y = sy - 1; y >= 0; y--) {
          const i = this.idx(x, y, z);
          const id = voxels[i];
          const cost = lightCost(id);
          if (cost === Infinity) break;
          if (id !== AIR) level = Math.max(0, level - (cost - 1));
          sky[i] = level;
          if (level > 0) queue.push(i);
        }
      }
    }
    this.#flood(sky, queue);

    const lit = [];
    for (let i = 0; i < voxels.length; i++) {
      const e = emitsLight(voxels[i]);
      if (e > 0) {
        block[i] = e;
        lit.push(i);
      }
    }
    this.#flood(block, lit);
  }

  #flood(field, queue) {
    const { sx, sy, sz, voxels } = this;
    let head = 0;
    while (head < queue.length) {
      const i = queue[head++];
      const level = field[i];
      if (level <= 1) continue;
      const x = i % sx;
      const z = Math.floor(i / sx) % sz;
      const y = Math.floor(i / (sx * sz));
      for (const [dx, dy, dz] of NEIGHBOURS) {
        const nx = x + dx;
        const ny = y + dy;
        const nz = z + dz;
        if (nx < 0 || ny < 0 || nz < 0 || nx >= sx || ny >= sy || nz >= sz) continue;
        const ni = this.idx(nx, ny, nz);
        const cost = lightCost(voxels[ni]);
        if (cost === Infinity) continue;
        const next = level - cost;
        if (next > field[ni]) {
          field[ni] = next;
          queue.push(ni);
        }
      }
    }
  }

  /**
   * Step a ray through the voxel grid (Amanatides & Woo).
   * Returns the first solid block hit plus the face normal, or null.
   */
  raycast(origin, dir, maxDist = 10) {
    let x = Math.floor(origin[0]);
    let y = Math.floor(origin[1]);
    let z = Math.floor(origin[2]);
    const step = [Math.sign(dir[0]), Math.sign(dir[1]), Math.sign(dir[2])];
    const tDelta = [
      dir[0] === 0 ? Infinity : Math.abs(1 / dir[0]),
      dir[1] === 0 ? Infinity : Math.abs(1 / dir[1]),
      dir[2] === 0 ? Infinity : Math.abs(1 / dir[2]),
    ];
    const bound = (o, d, c) => (d > 0 ? c + 1 - o : o - c);
    const tMax = [
      dir[0] === 0 ? Infinity : bound(origin[0], dir[0], x) * tDelta[0],
      dir[1] === 0 ? Infinity : bound(origin[1], dir[1], y) * tDelta[1],
      dir[2] === 0 ? Infinity : bound(origin[2], dir[2], z) * tDelta[2],
    ];
    let normal = [0, 0, 0];
    let t = 0;
    while (t <= maxDist) {
      if (this.inBounds(x, y, z) && this.voxels[this.idx(x, y, z)] !== AIR) {
        return { x, y, z, id: this.voxels[this.idx(x, y, z)], normal, distance: t };
      }
      if (tMax[0] < tMax[1] && tMax[0] < tMax[2]) {
        x += step[0];
        t = tMax[0];
        tMax[0] += tDelta[0];
        normal = [-step[0], 0, 0];
      } else if (tMax[1] < tMax[2]) {
        y += step[1];
        t = tMax[1];
        tMax[1] += tDelta[1];
        normal = [0, -step[1], 0];
      } else {
        z += step[2];
        t = tMax[2];
        tMax[2] += tDelta[2];
        normal = [0, 0, -step[2]];
      }
    }
    return null;
  }

  chunkKey(cx, cy, cz) {
    return (cy * this.cz + cz) * this.cx + cx;
  }

  chunkOf(x, y, z) {
    return this.chunkKey(Math.floor(x / CHUNK), Math.floor(y / CHUNK), Math.floor(z / CHUNK));
  }

  /** Chunks touching a block, including neighbours across a chunk border. */
  chunksAround(x, y, z) {
    const keys = new Set();
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const nx = x + dx;
          const ny = y + dy;
          const nz = z + dz;
          if (!this.inBounds(nx, ny, nz)) continue;
          keys.add(this.chunkOf(nx, ny, nz));
        }
      }
    }
    return keys;
  }

  saveEdits() {
    return JSON.stringify([...this.edits].map(([i, id]) => [i, id]));
  }

  loadEdits(json) {
    let list;
    try {
      list = JSON.parse(json);
    } catch {
      return 0;
    }
    if (!Array.isArray(list)) return 0;
    let n = 0;
    for (const entry of list) {
      if (!Array.isArray(entry) || entry.length !== 2) continue;
      const [i, id] = entry;
      if (!Number.isInteger(i) || i < 0 || i >= this.voxels.length) continue;
      if (!Number.isInteger(id) || id < 0 || id > 255) continue;
      this.voxels[i] = id;
      this.edits.set(i, id);
      n++;
    }
    return n;
  }
}

const NEIGHBOURS = [
  [1, 0, 0], [-1, 0, 0],
  [0, 1, 0], [0, -1, 0],
  [0, 0, 1], [0, 0, -1],
];

export { isOpaque };
