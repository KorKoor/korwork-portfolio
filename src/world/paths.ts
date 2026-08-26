import { getWorldTerrainHeight } from './terrain';

/* ============================================================
   RED DE CAMINOS
   ============================================================
   Fuente única de verdad de por dónde pasan los senderos. La usan:

   - Terrain.tsx     → pinta la tierra pisada en el color por vértice
   - Paths.tsx       → coloca las losas de piedra
   - EnvironmentDecor→ excluye vegetación del camino
   - Wildlife        → los animales evitan/cruzan los caminos

   Los caminos se definen como polilíneas suavizadas (Catmull-Rom):
   dibujar caminos rectos entre dos puntos delata inmediatamente que
   el mundo es procedural, así que cada ruta tiene curvatura y
   anchura variable.
============================================================ */

export interface PathNode {
  x: number;
  z: number;
  /** Anchura del camino en este punto — varía para que no sea un tubo. */
  width: number;
}

export interface PathRoute {
  id: string;
  nodes: PathNode[];
  /** 'stone' = losas; 'dirt' = solo tierra pisada. */
  surface: 'stone' | 'dirt';
}

export const ROUTES: PathRoute[] = [
  {
    id: 'house-camp',
    surface: 'stone',
    nodes: [
      { x: 0.5, z: 6.0, width: 2.3 },
      { x: 3.4, z: 6.9, width: 2.1 },
      { x: 6.2, z: 6.2, width: 1.9 },
      { x: 8.8, z: 6.6, width: 2.2 },
      { x: 10.6, z: 7.4, width: 2.4 },
    ],
  },
  {
    id: 'camp-dock',
    surface: 'stone',
    nodes: [
      { x: 11.8, z: 8.2, width: 2.0 },
      { x: 14.0, z: 9.4, width: 1.8 },
      { x: 15.8, z: 10.0, width: 1.7 },
      { x: 17.2, z: 10.2, width: 1.9 },
    ],
  },
  {
    id: 'house-cave',
    surface: 'dirt',
    nodes: [
      { x: -2.0, z: 5.6, width: 2.2 },
      { x: -5.6, z: 7.2, width: 2.0 },
      { x: -9.4, z: 9.0, width: 1.9 },
      { x: -13.2, z: 11.0, width: 2.0 },
      { x: -17.6, z: 13.0, width: 2.2 },
      { x: -21.6, z: 14.8, width: 2.5 },
    ],
  },
  {
    id: 'house-cherry',
    surface: 'dirt',
    nodes: [
      { x: -2.4, z: 2.4, width: 2.0 },
      { x: -5.8, z: -1.6, width: 1.8 },
      { x: -9.0, z: -5.8, width: 1.7 },
      { x: -12.0, z: -9.4, width: 1.8 },
      { x: -15.2, z: -12.2, width: 2.0 },
    ],
  },
  {
    id: 'house-garden',
    surface: 'stone',
    nodes: [
      { x: 3.0, z: 1.4, width: 1.9 },
      { x: 6.6, z: -1.0, width: 1.7 },
      { x: 10.2, z: -3.4, width: 1.7 },
      { x: 13.4, z: -5.4, width: 1.9 },
    ],
  },
];

/** Catmull-Rom en una coordenada. */
function catmull(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

export interface PathSample {
  x: number;
  z: number;
  width: number;
  /** Dirección normalizada del camino en este punto. */
  dx: number;
  dz: number;
}

/** Muestrea una ruta en `steps` puntos suavizados. */
export function sampleRoute(route: PathRoute, steps: number): PathSample[] {
  const n = route.nodes;
  if (n.length < 2) return [];

  const out: PathSample[] = [];
  const segments = n.length - 1;

  for (let s = 0; s < segments; s += 1) {
    const p0 = n[Math.max(0, s - 1)];
    const p1 = n[s];
    const p2 = n[s + 1];
    const p3 = n[Math.min(n.length - 1, s + 2)];

    const perSeg = Math.ceil(steps / segments);

    for (let i = 0; i < perSeg; i += 1) {
      const t = i / perSeg;
      const x = catmull(p0.x, p1.x, p2.x, p3.x, t);
      const z = catmull(p0.z, p1.z, p2.z, p3.z, t);

      const tn = Math.min(1, t + 0.02);
      const nx = catmull(p0.x, p1.x, p2.x, p3.x, tn);
      const nz = catmull(p0.z, p1.z, p2.z, p3.z, tn);
      const len = Math.max(0.0001, Math.hypot(nx - x, nz - z));

      out.push({
        x,
        z,
        width: p1.width + (p2.width - p1.width) * t,
        dx: (nx - x) / len,
        dz: (nz - z) / len,
      });
    }
  }

  const last = n[n.length - 1];
  out.push({ x: last.x, z: last.z, width: last.width, dx: 0, dz: 1 });

  return out;
}

/** Todas las muestras de todos los caminos, cacheadas. */
let cachedSamples: (PathSample & { surface: 'stone' | 'dirt' })[] | null = null;

export function allPathSamples(): (PathSample & { surface: 'stone' | 'dirt' })[] {
  if (cachedSamples) return cachedSamples;

  cachedSamples = ROUTES.flatMap((r) =>
    sampleRoute(r, 44).map((s) => ({ ...s, surface: r.surface })),
  );

  return cachedSamples;
}

/**
 * 0..1 — cuánto "camino" hay en un punto del mundo. Se usa para el
 * color del terreno y para excluir vegetación. Es O(nº de muestras),
 * pero solo se llama al generar el mundo, no por frame.
 */
export function pathInfluenceAt(x: number, z: number): number {
  const samples = allPathSamples();
  let best = 0;

  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i];
    const dx = x - s.x;
    const dz = z - s.z;
    const d2 = dx * dx + dz * dz;
    const half = s.width * 0.5;

    if (d2 > (half + 1.4) * (half + 1.4)) continue;

    const d = Math.sqrt(d2);
    const t = 1 - Math.min(1, Math.max(0, (d - half * 0.55) / (half * 0.85 + 0.9)));
    const v = t * t * (3 - 2 * t);
    if (v > best) best = v;
    if (best > 0.995) break;
  }

  return best;
}

/** Altura del terreno en el camino — las losas se apoyan aquí. */
export function pathHeightAt(x: number, z: number): number {
  return getWorldTerrainHeight(x, z);
}
