// Procedural 16x16 pixel textures, drawn into one atlas canvas.
// Every material here is modelled on the reference photo of the cabin room:
// pine log walls, board ceiling, wide pine floor, floral fabrics, shag rug.

export const TILE = 16;
export const ATLAS_COLS = 16;
export const ATLAS_SIZE = TILE * ATLAS_COLS;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);
const rgb = (r, g, b, a = 255) => [r, g, b, a];
const shade = (c, f) => [clamp255(c[0] * f), clamp255(c[1] * f), clamp255(c[2] * f), c[3]];
const mix = (a, b, t) => [
  clamp255(a[0] + (b[0] - a[0]) * t),
  clamp255(a[1] + (b[1] - a[1]) * t),
  clamp255(a[2] + (b[2] - a[2]) * t),
  clamp255(a[3] + (b[3] - a[3]) * t),
];
const TRANSPARENT = [0, 0, 0, 0];

// --- material generators -----------------------------------------------
// Each generator gets (put, rnd) where put(x, y, color) writes one texel.

// Wide pine floorboards. `axis` 0 = seams run along x, 1 = along y.
function boards(base, seamW, axis, grain = 0.09) {
  return (put, rnd) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const along = axis === 0 ? x : y;
        const across = axis === 0 ? y : x;
        const board = Math.floor(across / seamW);
        let c = shade(base, 0.9 + ((board * 37) % 5) * 0.045);
        // long grain streaks
        const streak = Math.sin(along * 0.9 + board * 3.1 + across * 0.4) * 0.5 + 0.5;
        c = shade(c, 1 - grain * streak + rnd() * grain * 0.7);
        if (across % seamW === 0) c = shade(c, 0.62); // seam shadow
        if (across % seamW === seamW - 1) c = shade(c, 1.06); // lit edge
        put(x, y, c);
      }
    }
  };
}

// Horizontal round logs, as on the cabin's dark inner walls.
function logWall(base, logH) {
  return (put, rnd) => {
    for (let y = 0; y < TILE; y++) {
      const inLog = y % logH;
      const t = inLog / (logH - 1); // 0 top .. 1 bottom of the log face
      // rounded log: bright just above the middle, dark at both seams
      const round = 1.16 - Math.abs(t - 0.42) * 0.85;
      for (let x = 0; x < TILE; x++) {
        let c = shade(base, round);
        c = shade(c, 0.94 + Math.sin(x * 0.7 + Math.floor(y / logH) * 2.3) * 0.05 + rnd() * 0.06);
        if (inLog === 0) c = shade(c, 0.45); // chinking seam
        // occasional knot
        const knotX = (Math.floor(y / logH) * 7 + 3) % 16;
        if (inLog === Math.floor(logH / 2) && x === knotX) c = shade(c, 0.5);
        put(x, y, c);
      }
    }
  };
}

function fabric(base, rough = 0.1) {
  return (put, rnd) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const weave = ((x + y) % 2 === 0 ? 1.03 : 0.97) * ((x % 4 === 0 || y % 4 === 0) ? 0.97 : 1);
        put(x, y, shade(base, weave * (1 - rough / 2 + rnd() * rough)));
      }
    }
  };
}

// Fabric with scattered blossoms — the beds and the armchair in the photo.
function floral(base, petal, leaf, density = 0.9) {
  const cloth = fabric(base, 0.08);
  return (put, rnd) => {
    const buf = [];
    cloth((x, y, c) => { buf[y * TILE + x] = c; }, rnd);
    const blooms = Math.max(1, Math.round(3 * density));
    for (let i = 0; i < blooms; i++) {
      const cx = Math.floor(rnd() * TILE);
      const cy = Math.floor(rnd() * TILE);
      for (const [dx, dy, kind] of [
        [0, 0, 0], [1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, -1, 0],
        [1, 1, 1], [-1, -1, 1], [2, 0, 1], [-2, 1, 1],
      ]) {
        const x = (cx + dx + TILE) % TILE;
        const y = (cy + dy + TILE) % TILE;
        const col = kind === 0 ? petal : leaf;
        buf[y * TILE + x] = shade(col, 0.86 + rnd() * 0.28);
      }
    }
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) put(x, y, buf[y * TILE + x]);
  };
}

function noiseTile(a, b, scale = 1) {
  return (put, rnd) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const n = rnd() * scale + (1 - scale) * 0.5;
        put(x, y, mix(a, b, n));
      }
    }
  };
}

// --- the atlas ----------------------------------------------------------

export const TILES = {}; // name -> tile index
const GENERATORS = [];

function define(name, gen) {
  TILES[name] = GENERATORS.length;
  GENERATORS.push(gen);
  return TILES[name];
}

const PINE = rgb(196, 148, 96);
const PINE_LIGHT = rgb(214, 172, 118);
const PINE_DARK = rgb(120, 82, 48);
const LOG_BROWN = rgb(126, 84, 50);
const BEAM_BROWN = rgb(74, 47, 28);

// --- structure
define('floor_plank', boards(PINE, 8, 1, 0.1));
define('floor_plank_dark', boards(shade(PINE, 0.78), 8, 1, 0.12));
define('log_wall', logWall(LOG_BROWN, 4));
define('log_wall_dark', logWall(shade(LOG_BROWN, 0.72), 4));
define('plank_wall', boards(PINE_LIGHT, 4, 0, 0.08));
define('ceil_plank', boards(rgb(206, 166, 116), 5, 0, 0.07));
define('beam', boards(BEAM_BROWN, 16, 1, 0.16));
define('stone', noiseTile(rgb(116, 116, 118), rgb(150, 150, 152), 0.9));

// --- window
define('glass', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const edge = x === 0 || y === 0 || x === TILE - 1 || y === TILE - 1;
      const bar = x === 8 || y === 8;
      if (edge) put(x, y, rgb(232, 228, 218, 255));
      else if (bar) put(x, y, rgb(238, 234, 226, 235));
      else {
        const sheen = x + y > 20 && x + y < 24 ? 60 : 0;
        put(x, y, rgb(212 + sheen, 226 + sheen, 236, 46 + sheen / 2 + rnd() * 8));
      }
    }
  }
});
define('curtain', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const fold = Math.sin(x * 1.15) * 0.5 + 0.5;
      let c = mix(rgb(224, 220, 210), rgb(255, 253, 248), fold);
      c = shade(c, 0.97 + rnd() * 0.05);
      if (y < 2) c = shade(c, 0.86); // gathered top
      put(x, y, c);
    }
  }
});
define('radiator', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const fin = x % 3;
      let c = fin === 0 ? rgb(198, 196, 190) : rgb(238, 237, 232);
      if (y < 2 || y > TILE - 3) c = rgb(226, 225, 220);
      put(x, y, shade(c, 0.98 + rnd() * 0.04));
    }
  }
});

// --- lights
define('lamp', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5) / 11;
      put(x, y, shade(mix(rgb(255, 250, 226), rgb(246, 214, 150), d), 0.97 + rnd() * 0.06));
    }
  }
});

// --- furniture
define('piano', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      let c = rgb(30, 22, 20);
      const sheen = Math.max(0, 1 - Math.abs(x - 4) / 3) * 0.5 + Math.max(0, 1 - Math.abs(y - 12) / 6) * 0.15;
      c = mix(c, rgb(96, 78, 70), sheen);
      put(x, y, shade(c, 0.94 + rnd() * 0.1));
    }
  }
});
define('piano_keys', (put) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (y < 3) put(x, y, rgb(28, 20, 18));
      else if (x % 4 === 3) put(x, y, y < 10 ? rgb(20, 16, 14) : rgb(242, 238, 228));
      else put(x, y, x % 4 === 0 ? rgb(214, 210, 200) : rgb(246, 243, 234));
    }
  }
});
define('bed_white', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const quilt = (x % 8 === 0 || y % 8 === 0) ? 0.9 : 1;
      const puff = Math.sin(x * 0.8) * Math.sin(y * 0.8) * 0.05 + 1;
      put(x, y, shade(rgb(233, 231, 224), quilt * puff * (0.98 + rnd() * 0.04)));
    }
  }
});
define('bed_floral', floral(rgb(224, 214, 196), rgb(196, 74, 84), rgb(96, 128, 78), 1.2));
define('chair_floral', floral(rgb(152, 160, 172), rgb(214, 220, 228), rgb(74, 92, 108), 1.8));
define('sofa_beige', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const stripe = y % 6 === 0 ? 0.9 : 1;
      put(x, y, shade(rgb(208, 190, 162), stripe * (0.96 + rnd() * 0.09)));
    }
  }
});
define('blanket_yellow', fabric(rgb(226, 190, 62), 0.12));
define('blanket_blue', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const band = y % 8 < 2 ? rgb(240, 240, 244) : rgb(38, 74, 148);
      put(x, y, shade(band, 0.96 + rnd() * 0.09));
    }
  }
});
define('paper_bag', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      let c = rgb(174, 134, 88);
      if (x === 5 || x === 11) c = shade(c, 0.86); // fold
      if (y < 2) c = shade(c, 1.08); // rolled rim
      put(x, y, shade(c, 0.96 + rnd() * 0.08));
    }
  }
});
define('metal', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const hi = Math.max(0, 1 - Math.abs(x - 5) / 2.5);
      const base = mix(rgb(58, 60, 66), rgb(236, 238, 242), hi * 0.9);
      put(x, y, shade(y % 7 === 0 ? shade(base, 0.7) : base, 0.95 + rnd() * 0.1));
    }
  }
});

// --- rugs
define('rug_green', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      // shag: chunky tufts of several greens
      const tuft = rnd();
      let c = tuft < 0.3 ? rgb(46, 62, 34) : tuft < 0.65 ? rgb(74, 96, 52) : tuft < 0.9 ? rgb(104, 124, 70) : rgb(132, 148, 96);
      if (rnd() < 0.04) c = rgb(122, 46, 52); // the odd red tuft, as in the photo
      put(x, y, c);
    }
  }
});
define('rug_grey', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const weave = (x % 2 === 0) !== (y % 2 === 0) ? 0.94 : 1.02;
      put(x, y, shade(rgb(112, 114, 116), weave * (0.97 + rnd() * 0.06)));
    }
  }
});
define('rug_red', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const ring = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
      let c = ring > 6 ? rgb(58, 34, 30) : ring > 4 ? rgb(140, 52, 44) : ring > 2 ? rgb(96, 40, 38) : rgb(158, 70, 54);
      put(x, y, shade(c, 0.95 + rnd() * 0.1));
    }
  }
});
define('wall_rug', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      let c = rgb(96, 88, 76);
      const diamond = (Math.abs((x % 8) - 4) + Math.abs((y % 8) - 4)) < 3;
      if (diamond) c = rgb(126, 116, 100);
      if (y > TILE - 3) c = rgb(150, 142, 126); // fringe
      put(x, y, shade(c, 0.93 + rnd() * 0.12));
    }
  }
});
define('picture', (put) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const edge = x < 2 || y < 2 || x > TILE - 3 || y > TILE - 3;
      if (edge) put(x, y, rgb(88, 60, 34));
      else if (y > 10) put(x, y, rgb(64, 72, 46)); // dark meadow
      else put(x, y, mix(rgb(112, 106, 88), rgb(158, 146, 120), y / 10)); // aged sky
    }
  }
});

// --- plants and outdoors
define('plant', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const leaf = Math.sin(x * 0.9 + y * 0.5) + Math.cos(y * 0.8 - x * 0.3);
      let c = leaf > 0.6 ? rgb(70, 108, 52) : leaf > -0.4 ? rgb(46, 80, 38) : rgb(30, 58, 28);
      if (rnd() < 0.06) c = rgb(96, 132, 62); // fresh growth
      put(x, y, c);
    }
  }
});
define('pot', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      let c = y < 3 ? rgb(150, 92, 62) : rgb(126, 74, 50);
      put(x, y, shade(c, 0.95 + rnd() * 0.1));
    }
  }
});
define('flower_pink', (put, rnd) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) put(x, y, TRANSPARENT);
  for (let y = 6; y < TILE; y++) {
    put(7 + (y % 2), y, rgb(72, 104, 54));
    if (y > 9) put(6 - (y % 2), y, rgb(64, 94, 48));
  }
  for (const [cx, cy] of [[7, 4], [4, 7], [11, 6]]) {
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1]]) {
      const x = cx + dx;
      const y = cy + dy;
      if (x < 0 || y < 0 || x >= TILE || y >= TILE) continue;
      put(x, y, shade(dx === 0 && dy === 0 ? rgb(252, 236, 240) : rgb(238, 176, 194), 0.92 + rnd() * 0.16));
    }
  }
});
define('grass_top', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = rnd();
      put(x, y, n < 0.35 ? rgb(88, 128, 56) : n < 0.75 ? rgb(104, 146, 62) : rgb(122, 162, 74));
    }
  }
});
define('grass_side', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const topDepth = 3 + ((x * 7) % 3);
      if (y < topDepth) put(x, y, rnd() < 0.5 ? rgb(96, 138, 58) : rgb(112, 152, 68));
      else put(x, y, shade(rgb(126, 96, 64), 0.92 + rnd() * 0.16));
    }
  }
});
define('dirt', noiseTile(rgb(108, 80, 54), rgb(140, 106, 72), 0.85));
define('bark', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const ridge = Math.sin(x * 2.1) * 0.5 + 0.5;
      put(x, y, shade(mix(rgb(82, 58, 38), rgb(122, 92, 60), ridge), 0.94 + rnd() * 0.12));
    }
  }
});
define('log_top', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const r = Math.hypot(x - 7.5, y - 7.5);
      const ring = Math.sin(r * 2.2) * 0.5 + 0.5;
      put(x, y, shade(mix(rgb(168, 128, 84), rgb(198, 158, 108), ring), 0.96 + rnd() * 0.08));
    }
  }
});
define('leaves', (put, rnd) => {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (rnd() < 0.12) { put(x, y, TRANSPARENT); continue; }
      const n = rnd();
      put(x, y, n < 0.4 ? rgb(48, 84, 40) : n < 0.8 ? rgb(64, 104, 48) : rgb(84, 126, 58));
    }
  }
});

export const TILE_COUNT = GENERATORS.length;

/** Render every tile into one atlas canvas. */
export function buildAtlas(createCanvas) {
  const canvas = createCanvas(ATLAS_SIZE, ATLAS_SIZE);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(ATLAS_SIZE, ATLAS_SIZE);
  for (let i = 0; i < GENERATORS.length; i++) {
    const ox = (i % ATLAS_COLS) * TILE;
    const oy = Math.floor(i / ATLAS_COLS) * TILE;
    const rnd = mulberry32(0x9e37 + i * 2654435761);
    GENERATORS[i]((x, y, c) => {
      if (x < 0 || y < 0 || x >= TILE || y >= TILE) return;
      const p = ((oy + y) * ATLAS_SIZE + (ox + x)) * 4;
      img.data[p] = c[0];
      img.data[p + 1] = c[1];
      img.data[p + 2] = c[2];
      img.data[p + 3] = c[3] === undefined ? 255 : c[3];
    }, rnd);
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
