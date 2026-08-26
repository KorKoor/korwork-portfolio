import {
  getWorldTerrainHeight,
  getWorldSlope,
  WATER_LEVEL,
  LAKE_CENTER,
  LAKE_RADIUS,
  CAVE_CENTER,
  DOCK_POSITION,
  WATERFALL_POS,
} from './terrain';
import { pathInfluenceAt } from './paths';

/* ============================================================
   DATOS DEL MUNDO — biomas, puntos de interés y dispersión
   ============================================================
   Todo lo que decide QUÉ hay en cada punto del mapa (árboles,
   arbustos, rocas, estructuras) vive aquí, separado de cómo se
   DIBUJA (EnvironmentDecor.tsx) — así el sistema de colisiones de
   Player.tsx puede consultar exactamente los mismos datos que usa
   el renderer, sin duplicar la lógica de generación ni arriesgarse
   a que un árbol se vea en un lado y bloquee en otro.
============================================================ */

const AMBIENT_SHEET = '/assets/environment/ambient.png';

export { AMBIENT_SHEET };

export const SHEET_W = 1536;

export const SHEET_H = 1024;

export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Placement {
  crop: Crop;
  x: number;
  z: number;
  height: number;
  sway?: number;
  tint?: [number, number, number];
  flat?: boolean;
  fixedRotationY?: number;
  yOverride?: number;
}

/* ---------------- atlas ---------------- */

export const A = {
  // Árboles. OJO: (1335,355) NO es un árbol sino una hamaca entre
  // troncos — usarlo como árbol llenaba el bosque de hamacas.
  treeLeafy: { x: 1337, y: 121, width: 103, height: 145 },
  treeConifer: { x: 1443, y: 124, width: 85, height: 132 },
  treePine: { x: 1295, y: 3, width: 92, height: 137 },
  treeAutumn: { x: 1391, y: 253, width: 121, height: 140 },
  treeCherry: { x: 1391, y: 8, width: 131, height: 137 },
  hammock: { x: 1335, y: 355, width: 196, height: 162 },

  // Arbustos
  bushRound: { x: 579, y: 3, width: 100, height: 80 },
  bushFlowerPink: { x: 687, y: 4, width: 86, height: 77 },
  bushFlowerRed: { x: 778, y: 4, width: 77, height: 74 },
  bushSmall: { x: 510, y: 207, width: 68, height: 59 },
  bushOrange: { x: 422, y: 246, width: 87, height: 67 },
  bushConical: { x: 1235, y: 3, width: 63, height: 83 },

  // Pasto
  grassA: { x: 653, y: 211, width: 49, height: 61 },
  grassB: { x: 708, y: 213, width: 52, height: 60 },
  grassC: { x: 766, y: 212, width: 39, height: 62 },
  grassD: { x: 813, y: 213, width: 35, height: 62 },
  grassE: { x: 854, y: 217, width: 51, height: 54 },
  grassF: { x: 228, y: 411, width: 52, height: 52 },
  grassG: { x: 157, y: 412, width: 49, height: 52 },
  grassH: { x: 88, y: 413, width: 50, height: 51 },

  // Flores
  sunflower: { x: 952, y: 81, width: 47, height: 73 },
  flowerPlanter: { x: 1312, y: 825, width: 69, height: 75 },

  // Suelo
  rockMossy: { x: 1189, y: 216, width: 79, height: 85 },
  rockSmall: { x: 523, y: 271, width: 57, height: 40 },
  rockFlat: { x: 950, y: 273, width: 85, height: 42 },
  rockCluster: { x: 1111, y: 274, width: 71, height: 50 },
  boulder: { x: 1268, y: 152, width: 70, height: 110 },
  log: { x: 745, y: 280, width: 60, height: 42 },
  stump: { x: 924, y: 321, width: 76, height: 63 },
  mushroomRed: { x: 682, y: 274, width: 52, height: 49 },
  mushroomBlue: { x: 814, y: 273, width: 54, height: 50 },

  // Agua
  lilyPad: { x: 671, y: 543, width: 51, height: 28 },
  lilyLotus: { x: 792, y: 542, width: 54, height: 39 },
  lilyPadB: { x: 857, y: 540, width: 43, height: 35 },
  pondRipple: { x: 729, y: 540, width: 54, height: 35 },

  // Estructuras
  campfire: { x: 1310, y: 709, width: 103, height: 82 },
  bench: { x: 406, y: 749, width: 183, height: 111 },
  archway: { x: 1112, y: 760, width: 191, height: 188 },
  lantern: { x: 600, y: 742, width: 51, height: 114 },
  lanternPost: { x: 1234, y: 610, width: 67, height: 145 },
  stringLights: { x: 1314, y: 598, width: 158, height: 46 },
  woodSign: { x: 308, y: 683, width: 94, height: 121 },
  signPost: { x: 1236, y: 432, width: 55, height: 118 },
  ropeFence: { x: 8, y: 796, width: 171, height: 88 },
  woodFence: { x: 186, y: 796, width: 98, height: 83 },
  crate: { x: 300, y: 810, width: 79, height: 85 },
  barrel: { x: 1358, y: 890, width: 166, height: 114 },
  bike: { x: 608, y: 844, width: 148, height: 146 },
  skateboard: { x: 289, y: 900, width: 72, height: 92 },
  treeStumpSeat: { x: 1425, y: 726, width: 59, height: 61 },
} as const;

/* ---------------- biomas ---------------- */

export type BiomeId = 'pineHighlands' | 'meadow' | 'lakeside' | 'cherryGrove' | 'caveBarrens';

export interface Biome {
  id: BiomeId;
  trees: Crop[];
  bushes: Crop[];
  grasses: Crop[];
  details: Crop[];
  treeDensity: number;
  bushDensity: number;
  grassDensity: number;
  tint: [number, number, number];
  treeHeight: [number, number];
}

export const BIOMES: Record<BiomeId, Biome> = {
  pineHighlands: {
    id: 'pineHighlands',
    trees: [A.treePine, A.treeConifer, A.treePine, A.treeConifer, A.treeLeafy],
    bushes: [A.bushConical, A.bushSmall, A.bushRound],
    grasses: [A.grassC, A.grassD, A.grassA],
    details: [A.rockMossy, A.boulder, A.rockCluster, A.stump, A.log],
    treeDensity: 1.15,
    bushDensity: 0.6,
    grassDensity: 0.55,
    tint: [0.82, 0.92, 0.9],
    treeHeight: [3.0, 4.6],
  },
  meadow: {
    id: 'meadow',
    trees: [A.treeLeafy, A.treeAutumn, A.treeLeafy, A.treePine],
    bushes: [
      A.bushRound,
      A.bushFlowerPink,
      A.bushFlowerRed,
      A.bushOrange,
      A.bushSmall,
      A.sunflower,
    ],
    grasses: [A.grassA, A.grassB, A.grassE, A.grassF, A.grassG, A.grassH],
    details: [A.rockSmall, A.rockFlat, A.mushroomRed, A.log, A.stump],
    treeDensity: 0.55,
    bushDensity: 1.15,
    grassDensity: 1.5,
    tint: [1.04, 1.02, 0.9],
    treeHeight: [2.6, 3.9],
  },
  lakeside: {
    id: 'lakeside',
    trees: [A.treeLeafy, A.treeLeafy, A.treeAutumn],
    bushes: [A.bushRound, A.bushFlowerPink, A.bushSmall, A.sunflower],
    grasses: [A.grassC, A.grassD, A.grassB, A.grassA],
    details: [A.rockFlat, A.rockCluster, A.rockSmall, A.mushroomBlue],
    treeDensity: 0.5,
    bushDensity: 0.9,
    grassDensity: 1.8,
    tint: [0.92, 1.05, 1.0],
    treeHeight: [2.6, 3.8],
  },
  cherryGrove: {
    id: 'cherryGrove',
    trees: [A.treeCherry, A.treeCherry, A.treeAutumn, A.treeLeafy],
    bushes: [A.bushFlowerPink, A.bushFlowerRed, A.bushRound, A.flowerPlanter],
    grasses: [A.grassF, A.grassG, A.grassH, A.grassE],
    details: [A.rockSmall, A.stump, A.mushroomRed],
    treeDensity: 1.0,
    bushDensity: 1.0,
    grassDensity: 1.1,
    tint: [1.08, 0.98, 1.02],
    treeHeight: [3.2, 4.6],
  },
  caveBarrens: {
    id: 'caveBarrens',
    trees: [A.treeConifer, A.treePine],
    bushes: [A.bushConical, A.bushSmall],
    grasses: [A.grassC, A.grassD],
    details: [A.boulder, A.rockMossy, A.rockCluster, A.mushroomBlue, A.mushroomRed, A.log],
    treeDensity: 0.35,
    bushDensity: 0.4,
    grassDensity: 0.35,
    tint: [0.76, 0.84, 0.9],
    treeHeight: [2.6, 3.8],
  },
};

export function biomeAt(x: number, z: number): { biome: Biome; weight: number } {
  const h = getWorldTerrainHeight(x, z);

  const scores: [BiomeId, number][] = [
    ['pineHighlands', Math.max(0, (-z - 6) / 22) + Math.max(0, (h - 3) / 6)],
    ['lakeside', Math.max(0, 1 - Math.hypot(x - LAKE_CENTER[0], z - LAKE_CENTER[1]) / 18)],
    ['cherryGrove', Math.max(0, 1 - Math.hypot(x + 16, z + 13.5) / 13)],
    ['caveBarrens', Math.max(0, 1 - Math.hypot(x - CAVE_CENTER[0], z - CAVE_CENTER[1]) / 17)],
    ['meadow', 0.42],
  ];

  let bestId: BiomeId = 'meadow';
  let best = -Infinity;
  let total = 0;

  scores.forEach(([id, s]) => {
    total += Math.max(0, s);
    if (s > best) {
      best = s;
      bestId = id;
    }
  });

  return { biome: BIOMES[bestId], weight: total > 0 ? best / total : 1 };
}

/* ---------------- puntos de interés ---------------- */

export const LANDMARKS: Placement[] = [
  // Campamento
  { crop: A.campfire, x: 10.5, z: 6.5, height: 1.3, sway: 0 },
  { crop: A.bench, x: 8.6, z: 9.4, height: 1.7, sway: 0 },
  { crop: A.treeStumpSeat, x: 13.2, z: 8.2, height: 0.95, sway: 0 },
  { crop: A.treeStumpSeat, x: 12.4, z: 4.4, height: 0.95, sway: 0 },
  { crop: A.barrel, x: 14.4, z: 6.4, height: 1.4, sway: 0 },
  { crop: A.crate, x: 7.2, z: 4.0, height: 0.95, sway: 0 },
  { crop: A.lanternPost, x: 6.4, z: 8.6, height: 2.3, sway: 0.06 },
  { crop: A.lanternPost, x: 14.6, z: 9.8, height: 2.3, sway: 0.06 },
  { crop: A.hammock, x: 5.0, z: 5.2, height: 2.6, sway: 0.12 },

  // Rincón de rodadas
  { crop: A.bike, x: -6.8, z: 7.0, height: 1.7, sway: 0 },
  { crop: A.skateboard, x: -9.0, z: 7.4, height: 0.95, sway: 0 },
  { crop: A.woodFence, x: -8.2, z: 9.6, height: 1.15, fixedRotationY: 0 },
  { crop: A.woodFence, x: -5.4, z: 9.6, height: 1.15, fixedRotationY: 0 },
  { crop: A.signPost, x: -4.2, z: 8.0, height: 1.6, sway: 0 },

  // Jardín de flores
  { crop: A.sunflower, x: 16.5, z: -7.5, height: 1.25, sway: 0.9 },
  { crop: A.sunflower, x: 18.0, z: -6.0, height: 1.15, sway: 0.9 },
  { crop: A.sunflower, x: 15.2, z: -5.4, height: 1.2, sway: 0.9 },
  { crop: A.bushFlowerPink, x: 14.6, z: -9.4, height: 1.2, sway: 0.5 },
  { crop: A.bushFlowerRed, x: 18.4, z: -9.8, height: 1.15, sway: 0.5 },
  { crop: A.bushFlowerPink, x: 20.0, z: -7.2, height: 1.1, sway: 0.5 },
  { crop: A.flowerPlanter, x: 16.2, z: -3.8, height: 1.0, sway: 0.2 },
  { crop: A.ropeFence, x: 13.2, z: -6.6, height: 1.0, fixedRotationY: Math.PI / 2 },
  { crop: A.ropeFence, x: 13.2, z: -10.2, height: 1.0, fixedRotationY: Math.PI / 2 },
  { crop: A.woodSign, x: 13.0, z: -4.4, height: 1.5, sway: 0 },

  // Mirador de cerezos
  { crop: A.treeCherry, x: -15, z: -15, height: 4.6, sway: 0.55 },
  { crop: A.treeCherry, x: -18.5, z: -12.5, height: 4.0, sway: 0.55 },
  { crop: A.bench, x: -16.4, z: -11.2, height: 1.7, sway: 0 },
  { crop: A.lantern, x: -13.6, z: -12.8, height: 1.35, sway: 0.1 },
  { crop: A.stump, x: -12.2, z: -16.6, height: 1.0, sway: 0 },

  // Camino de la cueva
  { crop: A.archway, x: -11, z: 10.5, height: 3.2, fixedRotationY: Math.PI / 6 },
  { crop: A.lanternPost, x: -15.5, z: 12.5, height: 2.3, sway: 0.06 },
  { crop: A.lanternPost, x: -19.5, z: 14.5, height: 2.3, sway: 0.06 },
  { crop: A.woodSign, x: -13.5, z: 11.8, height: 1.5, sway: 0 },

  // Muelle
  { crop: A.crate, x: DOCK_POSITION[0] - 2.2, z: DOCK_POSITION[1] + 0.8, height: 0.9, sway: 0 },
  { crop: A.barrel, x: DOCK_POSITION[0] + 2.4, z: DOCK_POSITION[1] + 1.0, height: 1.3, sway: 0 },
  { crop: A.lanternPost, x: DOCK_POSITION[0] - 2.6, z: DOCK_POSITION[1] - 1.0, height: 2.2, sway: 0.06 },
  { crop: A.woodSign, x: DOCK_POSITION[0] + 3.0, z: DOCK_POSITION[1] + 2.2, height: 1.45, sway: 0 },
];

/* ---------------- dispersión determinista ---------------- */

export function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const CLEARINGS: { x: number; z: number; r: number }[] = [
  { x: 0, z: 0, r: 7 },
  { x: 10.5, z: 7, r: 6 },
  { x: -7.5, z: 8, r: 4.5 },
  { x: 16.5, z: -7, r: 6 },
  { x: -16, z: -13.5, r: 5.5 },
  { x: CAVE_CENTER[0], z: CAVE_CENTER[1], r: 10 },
  { x: DOCK_POSITION[0], z: DOCK_POSITION[1], r: 5 },
];

export function inClearing(x: number, z: number): boolean {
  return CLEARINGS.some((c) => Math.hypot(x - c.x, z - c.z) < c.r);
}

export function isWaterAt(x: number, z: number): boolean {
  if (getWorldTerrainHeight(x, z) < WATER_LEVEL + 1.2) return true;
  return Math.hypot(x - LAKE_CENTER[0], z - LAKE_CENTER[1]) < LAKE_RADIUS * 1.45;
}

export function onPath(x: number, z: number): boolean {
  return pathInfluenceAt(x, z) > 0.42;
}

export type ScatterLayer = 'tree' | 'bush' | 'grass' | 'detail';

export function scatterBiome(
  seed: number,
  attempts: number,
  layer: ScatterLayer,
  maxRadius: number,
  opts: { minRadius?: number; maxSlope?: number } = {},
): Placement[] {
  const out: Placement[] = [];
  const { minRadius = 0, maxSlope = 2.0 } = opts;
  const cols = Math.ceil(Math.sqrt(attempts));
  const cell = (maxRadius * 2) / cols;

  for (let i = 0; i < cols * cols; i += 1) {
    const gx = i % cols;
    const gz = Math.floor(i / cols);
    const n = seed * 7919 + i;

    const x = -maxRadius + (gx + 0.1 + hash(n) * 0.8) * cell;
    const z = -maxRadius + (gz + 0.1 + hash(n + 0.37) * 0.8) * cell;

    const r = Math.hypot(x, z);
    if (r < minRadius || r > maxRadius) continue;
    if (isWaterAt(x, z)) continue;
    if (inClearing(x, z)) continue;
    if (onPath(x, z)) continue;
    if (getWorldSlope(x, z) > maxSlope) continue;

    const { biome } = biomeAt(x, z);

    const density =
      layer === 'tree'
        ? biome.treeDensity
        : layer === 'bush'
          ? biome.bushDensity
          : layer === 'grass'
            ? biome.grassDensity
            : 0.8;

    if (hash(n + 0.51) > density * 0.72) continue;

    const pool =
      layer === 'tree'
        ? biome.trees
        : layer === 'bush'
          ? biome.bushes
          : layer === 'grass'
            ? biome.grasses
            : biome.details;

    const crop = pool[Math.floor(hash(n + 0.71) * pool.length) % pool.length];
    const t = hash(n + 0.93);

    const height =
      layer === 'tree'
        ? biome.treeHeight[0] + (biome.treeHeight[1] - biome.treeHeight[0]) * t
        : layer === 'bush'
          ? 0.85 + t * 0.75
          : layer === 'grass'
            ? 0.45 + t * 0.55
            : 0.4 + t * 0.7;

    const sway =
      layer === 'grass' ? 1.0 : layer === 'bush' ? 0.55 : layer === 'tree' ? 0.3 : 0.05;

    const v = 0.9 + hash(n + 1.31) * 0.22;

    out.push({
      crop,
      x,
      z,
      height,
      sway,
      tint: [biome.tint[0] * v, biome.tint[1] * v, biome.tint[2] * v],
    });
  }

  return out;
}

export function lakeSurface(): Placement[] {
  const out: Placement[] = [];
  const crops = [A.lilyPad, A.lilyLotus, A.lilyPadB, A.pondRipple];

  for (let i = 0; i < 30; i += 1) {
    const a = (i / 30) * Math.PI * 2 + hash(i * 3.3) * 0.5;
    const rad = LAKE_RADIUS * (0.2 + hash(i * 7.7) * 0.68);
    out.push({
      crop: crops[i % crops.length],
      x: LAKE_CENTER[0] + Math.cos(a) * rad,
      z: LAKE_CENTER[1] + Math.sin(a) * rad,
      height: 0.4 + hash(i * 5.1) * 0.22,
      flat: true,
      yOverride: WATER_LEVEL + 0.06,
    });
  }

  return out;
}

/* ---------------- rocas 3D ---------------- */

export interface RockSpec {
  pos: [number, number, number];
  scale: [number, number, number];
  rot: number;
  color: string;
  detail: number;
}

const ROCK_SPOTS: [number, number][] = [
  [-28, -6], [-25, 2], [26, -12], [30, 4], [-8, -24],
  [6, -26], [22, -22], [-30, 10], [18, 26], [-14, 26],
  [33, 14], [-33, -16], [2, 28], [-20, -22], [12, -18],
  [-35, 20], [35, -2], [-4, 34], [24, 32], [-26, 30],
];

let cachedRocks: RockSpec[] | null = null;

/**
 * Rocas 3D del mundo — una sola fuente de verdad para render y
 * colisión. `shape` varía entre dodecaedro/icosaedro/octaedro: la
 * MISMA geometría repetida 20 veces se nota; alternar la silueta
 * (aunque el color/escala se mantenga en familia) rompe el patrón.
 */
export type RockShape = 'dodeca' | 'icosa' | 'octa';

export interface RockSpecShaped extends RockSpec {
  shape: RockShape;
}

const ROCK_SHAPES: RockShape[] = ['dodeca', 'icosa', 'octa'];

export function getRockFormations(): RockSpecShaped[] {
  if (cachedRocks) return cachedRocks as RockSpecShaped[];

  const rocks: RockSpecShaped[] = ROCK_SPOTS.map(([x, z], i) => {
    const y = getWorldTerrainHeight(x, z);
    const s = 0.45 + hash(i * 13.7) * 0.85;
    return {
      pos: [x, y + s * 0.35, z] as [number, number, number],
      scale: [s * 1.3, s * 0.85, s * 1.15] as [number, number, number],
      rot: hash(i * 9.1) * Math.PI,
      color: i % 3 === 0 ? '#6a6355' : i % 3 === 1 ? '#544e44' : '#5e5749',
      detail: 0,
      shape: ROCK_SHAPES[i % ROCK_SHAPES.length],
    };
  });

  cachedRocks = rocks;
  return rocks;
}

/* ---------------- troncos caídos 3D ---------------- */

export interface LogSpec {
  pos: [number, number, number];
  length: number;
  radius: number;
  rot: number;
  tilt: number;
}

const LOG_SPOTS: [number, number][] = [
  [-6, -10], [9, -18], [-19, -4], [4, 16], [-11, 18],
  [21, -16], [-2, -20], [16, 18], [-24, -8], [13, -3],
];

let cachedLogs: LogSpec[] | null = null;

/** Troncos caídos — refuerzan el "suelo de bosque" pedido, y también bloquean el paso (son 3D reales, no decoración plana). */
export function getFallenLogs(): LogSpec[] {
  if (cachedLogs) return cachedLogs;

  cachedLogs = LOG_SPOTS.map(([x, z], i) => {
    const y = getWorldTerrainHeight(x, z);
    const radius = 0.22 + hash(i * 6.3) * 0.1;
    return {
      pos: [x, y + radius, z] as [number, number, number],
      length: 2.2 + hash(i * 4.7) * 1.6,
      radius,
      rot: hash(i * 8.9) * Math.PI * 2,
      tilt: (hash(i * 11.1) - 0.5) * 0.12,
    };
  });

  return cachedLogs;
}

/* ============================================================
   COLISIÓN
   ============================================================
   Círculos simples (mismo enfoque que los colliders del cuarto):
   cada obstáculo es {x, z, radius}. Se arma UNA vez (deterministo,
   no cambia en runtime) y se cachea — Player.tsx lo recorre cada
   frame que el jugador se mueve, y unos cientos de comparaciones de
   distancia no cuestan nada.

   Deliberadamente NO todo bloquea: arbustos, pasto, flores y hongos
   son decorativos y se camina sobre ellos sin problema (como en
   casi cualquier juego top-down) — solo troncos, rocas y estructuras
   grandes detienen al jugador.
============================================================ */

export interface Obstacle {
  x: number;
  z: number;
  radius: number;
}

/** Radio de colisión aproximado por tipo de estructura (no el ancho visual completo — un poco menor, para que no se sienta "gordo"). */
const STRUCTURE_RADII = new Map<Crop, number>([
  [A.campfire, 0.85],
  [A.bench, 1.15],
  [A.archway, 0.55], // solo los dos postes cuentan, no el vano
  [A.barrel, 0.42],
  [A.crate, 0.4],
  [A.hammock, 0.55],
  [A.lanternPost, 0.16],
  [A.signPost, 0.14],
  [A.woodSign, 0.28],
]);

let cachedObstacles: Obstacle[] | null = null;

export function getStaticObstacles(): Obstacle[] {
  if (cachedObstacles) return cachedObstacles;

  const out: Obstacle[] = [];

  // Troncos de árbol — solo el tronco bloquea, no la copa entera,
  // así el jugador puede pasar cerca del follaje sin sentirse
  // atrapado por un círculo gigante.
  const trees = scatterBiome(1, 1024, 'tree', 40, { minRadius: 8, maxSlope: 2.1 });
  trees.forEach((t) => out.push({ x: t.x, z: t.z, radius: 0.34 }));

  // Estructuras del campamento/jardín/muelle que de verdad deberían
  // bloquear el paso.
  LANDMARKS.forEach((l) => {
    const r = STRUCTURE_RADII.get(l.crop);
    if (r !== undefined) out.push({ x: l.x, z: l.z, radius: r });
  });

  // Peñascos 3D.
  getRockFormations().forEach((r) => {
    out.push({ x: r.pos[0], z: r.pos[2], radius: (r.scale[0] + r.scale[2]) / 2 * 0.92 });
  });

  // Troncos caídos — un óvalo real de colisión sería más preciso
  // (son largos y delgados), pero un círculo pequeño centrado en el
  // tronco ya evita el caso molesto (caminar derecho ENCIMA de un
  // tronco) sin bloquear una zona grande alrededor de sus puntas.
  getFallenLogs().forEach((l) => {
    out.push({ x: l.pos[0], z: l.pos[2], radius: l.radius + 0.55 });
  });

  // Pared del acantilado de la cascada (ver Waterfall.tsx) — el
  // offset en Z lo saca del centro del grupo hacia la pared real,
  // no hacia la poza (esa sí se puede pisar por la orilla).
  out.push({ x: WATERFALL_POS[0], z: WATERFALL_POS[1] - 2.4, radius: 4.6 });

  cachedObstacles = out;
  return out;
}

/** true si el círculo del jugador (radius) en (x,z) choca con algún obstáculo. */
export function hitsStaticObstacle(x: number, z: number, playerRadius: number): boolean {
  const obstacles = getStaticObstacles();
  for (let i = 0; i < obstacles.length; i += 1) {
    const o = obstacles[i];
    const minDist = o.radius + playerRadius;
    const dx = x - o.x;
    const dz = z - o.z;
    if (dx * dx + dz * dz < minDist * minDist) return true;
  }
  return false;
}
