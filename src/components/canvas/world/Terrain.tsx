import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  WORLD_HALF_SIZE,
  WATER_LEVEL,
  LAKE_CENTER,
  LAKE_RADIUS,
  getWorldTerrainHeight,
} from '../../../world/terrain';
import { pathInfluenceAt } from '../../../world/paths';

/**
 * Malla de terreno con relieve real, desplazada por vértice con la
 * MISMA función que usa el jugador para pararse.
 *
 * Dos decisiones clave para que el relieve SE VEA (antes se leía como
 * una alfombra plana difuminada):
 *
 * 1. `flatShading` — cada triángulo recibe una normal plana, así cada
 *    faceta capta la luz distinto y las lomas se leen como volumen.
 *    Con normales suavizadas + colores interpolados todo se fundía en
 *    un degradado verde sin forma.
 * 2. El color por vértice se decide por PENDIENTE, no solo por altura:
 *    las laderas empinadas viran a tierra/roca y las cimas a pasto
 *    claro, que es lo que realmente dibuja la silueta del terreno.
 */

const SEGMENTS = 190;

const C_GRASS_DEEP = new THREE.Color('#1d3d17');

const C_GRASS = new THREE.Color('#33632a');

const C_GRASS_LIT = new THREE.Color('#5d9138');

const C_DIRT = new THREE.Color('#5a4326');

const C_ROCK = new THREE.Color('#6b6559');

const C_SAND = new THREE.Color('#9c8452');

const C_PATH = new THREE.Color('#7a5f3a');

function smooth(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

// Los caminos ya no se definen aquí: vienen de world/paths.ts, la
// misma fuente que usan las losas de piedra y la exclusión de
// vegetación. Antes cada sistema tenía su propia fórmula y la tierra
// pisada no coincidía con las piedras.

export const Terrain: React.FC = React.memo(() => {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      WORLD_HALF_SIZE * 2,
      WORLD_HALF_SIZE * 2,
      SEGMENTS,
      SEGMENTS,
    );

    geo.rotateX(-Math.PI / 2);

    const position = geo.attributes.position;
    const colors = new Float32Array(position.count * 3);
    const c = new THREE.Color();

    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const h = getWorldTerrainHeight(x, z);

      position.setY(i, h);

      // Pendiente local (barata: dos muestras) — define si es pasto o
      // ladera pelada.
      const e = 0.7;
      const dx =
        getWorldTerrainHeight(x + e, z) - getWorldTerrainHeight(x - e, z);
      const dz =
        getWorldTerrainHeight(x, z + e) - getWorldTerrainHeight(x, z - e);
      const slope = Math.hypot(dx, dz) / (2 * e);

      const heightT = smooth((h + 4) / 12);

      c.copy(C_GRASS_DEEP)
        .lerp(C_GRASS, smooth(heightT * 1.8))
        .lerp(C_GRASS_LIT, smooth((heightT - 0.4) * 1.9));

      // Laderas: tierra; muy empinadas: roca.
      c.lerp(C_DIRT, smooth((slope - 0.55) * 1.5));
      c.lerp(C_ROCK, smooth((slope - 1.5) * 1.1));

      // Orilla arenosa alrededor del lago.
      const dLake = Math.hypot(x - LAKE_CENTER[0], z - LAKE_CENTER[1]);
      const shore =
        smooth(1 - Math.abs(dLake - LAKE_RADIUS * 1.05) / 3.2) *
        smooth((h - WATER_LEVEL + 1.2) / 1.5);
      c.lerp(C_SAND, shore * 0.9);

      // Senderos de tierra pisada.
      c.lerp(C_PATH, pathInfluenceAt(x, z) * 0.85);

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    return geo;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        vertexColors
        flatShading
        roughness={0.97}
        metalness={0}
      />
    </mesh>
  );
});

Terrain.displayName = 'Terrain';

export default Terrain;
