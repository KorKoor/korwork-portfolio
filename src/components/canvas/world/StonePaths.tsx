import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ROUTES, sampleRoute } from '../../../world/paths';
import { getWorldTerrainHeight } from '../../../world/terrain';

/* ============================================================
   CAMINOS DE PIEDRA
   ============================================================
   Losas individuales, no una textura pintada encima del terreno.
   Cada losa:

   - se coloca sobre la altura real del terreno;
   - se inclina siguiendo la NORMAL del terreno, así en las cuestas
     el camino sube con el suelo en vez de flotar;
   - tiene tamaño, giro y tono propios, para que el camino se lea
     como piedra colocada a mano y no como un patrón repetido.

   Todo en dos InstancedMesh (losas + bordillos): dos draw calls para
   varios cientos de piedras.
============================================================ */

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

interface Slab {
  x: number;
  y: number;
  z: number;
  sx: number;
  sz: number;
  rotY: number;
  tiltX: number;
  tiltZ: number;
  shade: number;
}

const STONE_BASE = new THREE.Color('#8a8578');

const STONE_DARK = new THREE.Color('#4e4a42');

export const StonePaths: React.FC = React.memo(() => {
  const slabMesh = useRef<THREE.InstancedMesh>(null);
  const edgeMesh = useRef<THREE.InstancedMesh>(null);

  const { slabs, edges } = useMemo(() => {
    const slabsOut: Slab[] = [];
    const edgesOut: Slab[] = [];
    let seed = 0;

    ROUTES.forEach((route) => {
      // Los caminos de tierra no llevan losas, solo algún canto
      // suelto en el borde.
      const density = route.surface === 'stone' ? 1 : 0.22;
      const samples = sampleRoute(route, route.surface === 'stone' ? 70 : 40);

      samples.forEach((s, i) => {
        // Perpendicular al camino, para repartir las losas a lo ancho.
        const px = -s.dz;
        const pz = s.dx;

        const across = route.surface === 'stone' ? 3 : 2;

        for (let k = 0; k < across; k += 1) {
          seed += 1;
          if (hash(seed) > density) continue;

          // Offset lateral escalonado + jitter: filas perfectamente
          // alineadas gritan "generado por bucle".
          const lane = (k - (across - 1) / 2) / Math.max(1, across - 1);
          const jitter = (hash(seed * 3.1) - 0.5) * 0.55;
          const lateral = lane * s.width * 0.62 + jitter;

          const x = s.x + px * lateral + (hash(seed * 5.7) - 0.5) * 0.28;
          const z = s.z + pz * lateral + (hash(seed * 7.3) - 0.5) * 0.28;

          // Normal del terreno → inclinación de la losa.
          const e = 0.5;
          const hL = getWorldTerrainHeight(x - e, z);
          const hR = getWorldTerrainHeight(x + e, z);
          const hD = getWorldTerrainHeight(x, z - e);
          const hU = getWorldTerrainHeight(x, z + e);

          const slope = Math.hypot(hR - hL, hU - hD) / (2 * e);
          // En paredes muy inclinadas no hay camino, hay ladera.
          if (slope > 1.5) continue;

          const y = getWorldTerrainHeight(x, z);

          const size = 0.42 + hash(seed * 11.9) * 0.36;

          slabsOut.push({
            x,
            y: y + 0.045,
            z,
            sx: size * (0.85 + hash(seed * 2.3) * 0.5),
            sz: size * (0.85 + hash(seed * 4.1) * 0.5),
            rotY: hash(seed * 13.7) * Math.PI,
            tiltX: -(hU - hD) / (2 * e),
            tiltZ: (hR - hL) / (2 * e),
            shade: 0.72 + hash(seed * 17.3) * 0.5,
          });
        }

        // Bordillos: cantos algo mayores cada pocas muestras, en los
        // dos lados. Son los que le dan silueta al camino.
        if (i % 4 === 0) {
          [-1, 1].forEach((side) => {
            seed += 1;
            if (hash(seed) > 0.62) return;

            const lateral = side * (s.width * 0.62 + 0.22);
            const x = s.x + px * lateral + (hash(seed * 6.1) - 0.5) * 0.3;
            const z = s.z + pz * lateral + (hash(seed * 8.7) - 0.5) * 0.3;
            const y = getWorldTerrainHeight(x, z);

            const size = 0.3 + hash(seed * 9.3) * 0.28;

            edgesOut.push({
              x,
              y: y + size * 0.3,
              z,
              sx: size,
              sz: size * (0.8 + hash(seed * 3.7) * 0.5),
              rotY: hash(seed * 5.9) * Math.PI,
              tiltX: 0,
              tiltZ: 0,
              shade: 0.6 + hash(seed * 12.1) * 0.55,
            });
          });
        }
      });
    });

    return { slabs: slabsOut, edges: edgesOut };
  }, []);

  useEffect(() => {
    const apply = (
      mesh: THREE.InstancedMesh | null,
      items: Slab[],
      flat: boolean,
    ) => {
      if (!mesh) return;

      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const e = new THREE.Euler();
      const p = new THREE.Vector3();
      const sc = new THREE.Vector3();
      const c = new THREE.Color();

      items.forEach((it, i) => {
        e.set(it.tiltX, it.rotY, it.tiltZ, 'YXZ');
        q.setFromEuler(e);
        p.set(it.x, it.y, it.z);
        sc.set(it.sx, flat ? 0.09 : it.sx * 0.75, it.sz);
        m.compose(p, q, sc);
        mesh.setMatrixAt(i, m);

        c.copy(STONE_DARK).lerp(STONE_BASE, Math.min(1, it.shade));
        mesh.setColorAt(i, c);
      });

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    };

    apply(slabMesh.current, slabs, true);
    apply(edgeMesh.current, edges, false);
  }, [slabs, edges]);

  return (
    <group>
      <instancedMesh
        ref={slabMesh}
        args={[undefined, undefined, Math.max(1, slabs.length)]}
        receiveShadow
        frustumCulled={false}
      >
        {/* Cilindro de 6 lados: canto de piedra irregular, mucho más
            barato que una malla de roca y se lee perfecto a esta
            escala. */}
        <cylinderGeometry args={[0.55, 0.62, 1, 6]} />
        <meshStandardMaterial roughness={0.94} metalness={0} flatShading />
      </instancedMesh>

      <instancedMesh
        ref={edgeMesh}
        args={[undefined, undefined, Math.max(1, edges.length)]}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <dodecahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial roughness={1} metalness={0} flatShading />
      </instancedMesh>
    </group>
  );
});

StonePaths.displayName = 'StonePaths';

export default StonePaths;
