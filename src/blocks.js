// Block registry. Every block maps to atlas tiles per face and to the
// physical properties the world, lighting and physics code needs.
import { TILES } from './textures.js';

export const AIR = 0;

const BLOCKS = [{ id: 0, name: 'Air', solid: false, opaque: false, tiles: null }];
export const BY_NAME = {};

function block(name, spec) {
  const id = BLOCKS.length;
  const t = spec.tiles;
  const tiles = typeof t === 'string'
    ? { top: t, bottom: t, side: t }
    : { top: t.top ?? t.side, bottom: t.bottom ?? t.top ?? t.side, side: t.side ?? t.top };
  const def = {
    id,
    name,
    label: spec.label ?? name,
    solid: spec.solid !== false,
    opaque: spec.opaque !== false,
    light: spec.light ?? 0,
    blend: spec.blend === true, // drawn in the translucent pass
    cutout: spec.cutout === true, // alpha-tested, does not hide neighbours
    tiles: {
      top: TILES[tiles.top],
      bottom: TILES[tiles.bottom],
      side: TILES[tiles.side],
    },
  };
  BLOCKS.push(def);
  BY_NAME[name] = id;
  return id;
}

// --- cabin structure
export const FLOOR = block('floor', { label: 'Pine floorboard', tiles: { top: 'floor_plank', side: 'floor_plank', bottom: 'floor_plank_dark' } });
export const FLOOR_DARK = block('floor_dark', { label: 'Dark floorboard', tiles: 'floor_plank_dark' });
export const LOG = block('log', { label: 'Log wall', tiles: { side: 'log_wall', top: 'log_top' } });
export const LOG_DARK = block('log_dark', { label: 'Aged log wall', tiles: { side: 'log_wall_dark', top: 'log_top' } });
export const PANEL = block('panel', { label: 'Pine panelling', tiles: 'plank_wall' });
export const CEILING = block('ceiling', { label: 'Ceiling board', tiles: 'ceil_plank' });
export const BEAM = block('beam', { label: 'Roof beam', tiles: 'beam' });
export const STONE = block('stone', { label: 'Stone', tiles: 'stone' });

// --- window
export const GLASS = block('glass', { label: 'Window pane', tiles: 'glass', opaque: false, blend: true });
export const CURTAIN = block('curtain', { label: 'Lace curtain', tiles: 'curtain' });
export const RADIATOR = block('radiator', { label: 'Radiator', tiles: 'radiator' });

// --- lights
export const LAMP = block('lamp', { label: 'Chandelier globe', tiles: 'lamp', light: 15 });

// --- furniture
export const PIANO = block('piano', { label: 'Black piano', tiles: { side: 'piano', top: 'piano_keys' } });
export const BED_WHITE = block('bed_white', { label: 'White bed', tiles: 'bed_white' });
export const BED_FLORAL = block('bed_floral', { label: 'Floral bed', tiles: 'bed_floral' });
export const ARMCHAIR = block('armchair', { label: 'Floral armchair', tiles: 'chair_floral' });
export const SOFA = block('sofa', { label: 'Beige sofa', tiles: 'sofa_beige' });
export const BLANKET_YELLOW = block('blanket_yellow', { label: 'Yellow blanket', tiles: 'blanket_yellow' });
export const BLANKET_BLUE = block('blanket_blue', { label: 'Blue bag', tiles: 'blanket_blue' });
export const PAPER_BAG = block('paper_bag', { label: 'Paper bag', tiles: 'paper_bag' });
export const METAL = block('metal', { label: 'Steel frame', tiles: 'metal' });

// --- textiles
export const RUG_GREEN = block('rug_green', { label: 'Green shag rug', tiles: 'rug_green' });
export const RUG_GREY = block('rug_grey', { label: 'Grey rug', tiles: 'rug_grey' });
export const RUG_RED = block('rug_red', { label: 'Red rug', tiles: 'rug_red' });
export const WALL_RUG = block('wall_rug', { label: 'Wall hanging', tiles: 'wall_rug' });
export const PICTURE = block('picture', { label: 'Framed picture', tiles: 'picture' });

// --- plants and outdoors
export const PLANT = block('plant', { label: 'House plant', tiles: 'plant' });
export const POT = block('pot', { label: 'Clay pot', tiles: 'pot' });
export const FLOWER = block('flower', { label: 'Pink peony', tiles: 'flower_pink', solid: false, opaque: false, cutout: true });
export const GRASS = block('grass', { label: 'Grass', tiles: { top: 'grass_top', side: 'grass_side', bottom: 'dirt' } });
export const DIRT = block('dirt', { label: 'Dirt', tiles: 'dirt' });
export const TREE = block('tree', { label: 'Tree trunk', tiles: { side: 'bark', top: 'log_top' } });
export const LEAVES = block('leaves', { label: 'Leaves', tiles: 'leaves', opaque: false, cutout: true });

export function blockDef(id) {
  return BLOCKS[id] || BLOCKS[0];
}

export function isSolid(id) {
  return id !== AIR && BLOCKS[id].solid;
}

export function isOpaque(id) {
  return id !== AIR && BLOCKS[id].opaque;
}

/** Light lost when passing through this block (opaque blocks stop light entirely). */
export function lightCost(id) {
  if (id === AIR) return 1;
  const b = BLOCKS[id];
  if (b.opaque) return Infinity;
  return 1; // glass and leaves pass light with the same falloff as air
}

export function emitsLight(id) {
  return id === AIR ? 0 : BLOCKS[id].light;
}

export const ALL_BLOCKS = BLOCKS;

/** Blocks offered in the hotbar / picker, in a sensible building order. */
export const PALETTE = [
  LOG, PANEL, CEILING, BEAM, FLOOR, FLOOR_DARK, STONE,
  GLASS, CURTAIN, RADIATOR, LAMP,
  PIANO, BED_WHITE, BED_FLORAL, ARMCHAIR, SOFA, BLANKET_YELLOW, BLANKET_BLUE, PAPER_BAG, METAL,
  RUG_GREEN, RUG_GREY, RUG_RED, WALL_RUG, PICTURE,
  PLANT, POT, FLOWER, GRASS, DIRT, TREE, LEAVES,
];
