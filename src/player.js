// Player physics: an axis-aligned box swept against the voxel grid.
// Units are voxels (~0.4 m each), so the player is 1.76 m tall.

export const PLAYER = {
  halfWidth: 0.35,
  height: 4.4,
  eye: 4.0,
  crouchEye: 3.2,
  walkSpeed: 9,
  sprintSpeed: 14,
  flySpeed: 18,
  gravity: 58,
  jumpSpeed: 13.5,
  maxFall: 90,
};

export class Player {
  constructor(spawn, yaw = 0) {
    this.pos = [...spawn]; // feet, centred horizontally
    this.vel = [0, 0, 0];
    this.yaw = yaw;
    this.pitch = 0;
    this.onGround = false;
    this.flying = false;
    this.crouching = false;
    this.spawn = [...spawn];
    this.spawnYaw = yaw;
  }

  get eyePosition() {
    return [this.pos[0], this.pos[1] + (this.crouching ? PLAYER.crouchEye : PLAYER.eye), this.pos[2]];
  }

  respawn() {
    this.pos = [...this.spawn];
    this.vel = [0, 0, 0];
    this.yaw = this.spawnYaw;
    this.pitch = 0;
  }

  update(dt, input, world) {
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    // Keys are on/off; a thumbstick is analogue, so both feed the same pair of
    // axes and a partly pushed stick walks slower. Forward is -Z at yaw 0.
    const ahead = (input.forward ? 1 : 0) - (input.back ? 1 : 0) + (input.moveForward || 0);
    const aside = (input.right ? 1 : 0) - (input.left ? 1 : 0) + (input.moveRight || 0);
    let wx = -sin * ahead + cos * aside;
    let wz = -cos * ahead - sin * aside;
    const len = Math.hypot(wx, wz);
    if (len > 1) { wx /= len; wz /= len; } // never faster than full tilt

    // A tap on a touch button can begin and end between two frames, so a
    // latched press counts as well as a held key.
    const wantUp = input.up || input.jumpPressed;
    this.crouching = !this.flying && input.down;
    const speed = this.flying
      ? PLAYER.flySpeed * (input.sprint ? 1.8 : 1)
      : (input.sprint ? PLAYER.sprintSpeed : PLAYER.walkSpeed) * (this.crouching ? 0.45 : 1);

    this.vel[0] = wx * speed;
    this.vel[2] = wz * speed;

    if (this.flying) {
      this.vel[1] = (wantUp ? 1 : 0) * speed - (input.down ? 1 : 0) * speed;
    } else {
      this.vel[1] -= PLAYER.gravity * dt;
      if (this.vel[1] < -PLAYER.maxFall) this.vel[1] = -PLAYER.maxFall;
      if (wantUp && this.onGround) {
        this.vel[1] = PLAYER.jumpSpeed;
        this.onGround = false;
      }
    }

    this.#move(world, this.vel[0] * dt, this.vel[1] * dt, this.vel[2] * dt);

    if (this.pos[1] < -8) this.respawn();
  }

  #move(world, dx, dy, dz) {
    this.onGround = false;
    this.pos[0] += dx;
    this.#resolve(world, 0, dx);
    this.pos[1] += dy;
    if (this.#resolve(world, 1, dy)) {
      if (dy < 0) this.onGround = true;
      this.vel[1] = 0;
    }
    this.pos[2] += dz;
    this.#resolve(world, 2, dz);
  }

  /** Push the box out of any block it overlaps along one axis. */
  #resolve(world, axis, delta) {
    if (delta === 0) return false;
    const h = PLAYER.halfWidth;
    const height = this.crouching ? PLAYER.height - 0.9 : PLAYER.height;
    const [px, py, pz] = this.pos;
    const min = [px - h, py, pz - h];
    const max = [px + h, py + height, pz + h];

    const x0 = Math.floor(min[0]);
    const x1 = Math.floor(max[0] - 1e-6);
    const y0 = Math.floor(min[1]);
    const y1 = Math.floor(max[1] - 1e-6);
    const z0 = Math.floor(min[2]);
    const z1 = Math.floor(max[2] - 1e-6);

    // Snap to the blocking cell nearest the direction of travel, not merely
    // the first one found — otherwise a box overlapping several blocks (a
    // player who jumps into a ceiling, say) can be flung the wrong way.
    let best = null;
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        for (let z = z0; z <= z1; z++) {
          if (!world.isSolidAt(x, y, z)) continue;
          const cell = [x, y, z][axis];
          if (best === null || (delta > 0 ? cell < best : cell > best)) best = cell;
        }
      }
    }
    if (best === null) return false;

    if (delta > 0) this.pos[axis] = best - (axis === 1 ? height : h) - 1e-4;
    else this.pos[axis] = best + 1 + (axis === 1 ? 0 : h) + 1e-4;
    if (axis !== 1) this.vel[axis] = 0;
    return true;
  }

  /** True if the player box would overlap a solid block at this position. */
  static intersectsSolid(world, pos, crouching = false) {
    const h = PLAYER.halfWidth;
    const height = crouching ? PLAYER.height - 0.9 : PLAYER.height;
    for (let x = Math.floor(pos[0] - h); x <= Math.floor(pos[0] + h - 1e-6); x++) {
      for (let y = Math.floor(pos[1]); y <= Math.floor(pos[1] + height - 1e-6); y++) {
        for (let z = Math.floor(pos[2] - h); z <= Math.floor(pos[2] + h - 1e-6); z++) {
          if (world.isSolidAt(x, y, z)) return true;
        }
      }
    }
    return false;
  }
}
