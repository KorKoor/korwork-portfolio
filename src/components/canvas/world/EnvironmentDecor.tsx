import React, { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { RoomSprite } from '../RoomProps';
import { InstancedSprites, type SpriteInstance } from './InstancedSprites';
import { getWorldTerrainHeight, WATER_LEVEL, DOCK_POSITION } from '../../../world/terrain';
import {
  AMBIENT_SHEET,
  SHEET_W,
  SHEET_H,
  A,
  LANDMARKS,
  scatterBiome,
  lakeSurface,
  getRockFormations,
  getFallenLogs,
  type Placement,
} from '../../../world/collision';

// Re-exportados para no romper a quien ya los importaba de aquí
// (DebugOverlay.tsx usa biomeAt) — la fuente real ahora vive en
// world/collision.ts, junto a los datos que usa el sistema de
// colisiones de Player.tsx.
export { biomeAt, type BiomeId } from '../../../world/collision';

/* ============================================================
   OBJETOS 3D
============================================================ */

function Dock() {
  const [dx, dz] = DOCK_POSITION;
  const planks = 7;

  return (
    <group position={[dx, 0, dz]}>
      {Array.from({ length: planks }, (_, i) => {
        const z = i * 1.15;
        const y = WATER_LEVEL + 0.55;
        return (
          <React.Fragment key={`plank-${i}`}>
            <mesh position={[0, y, z]} castShadow receiveShadow>
              <boxGeometry args={[2.6, 0.16, 1.0]} />
              <meshStandardMaterial color="#6b4a2c" roughness={0.9} />
            </mesh>
            {i % 2 === 0 && (
              <>
                <mesh position={[-1.1, y - 0.9, z]} castShadow>
                  <boxGeometry args={[0.2, 1.8, 0.2]} />
                  <meshStandardMaterial color="#3f2a17" roughness={0.95} />
                </mesh>
                <mesh position={[1.1, y - 0.9, z]} castShadow>
                  <boxGeometry args={[0.2, 1.8, 0.2]} />
                  <meshStandardMaterial color="#3f2a17" roughness={0.95} />
                </mesh>
              </>
            )}
          </React.Fragment>
        );
      })}

      <mesh position={[-1.35, WATER_LEVEL + 1.6, -0.4]} castShadow>
        <boxGeometry args={[0.22, 2.0, 0.22]} />
        <meshStandardMaterial color="#4a3220" roughness={0.9} />
      </mesh>
      <mesh position={[1.35, WATER_LEVEL + 1.6, -0.4]} castShadow>
        <boxGeometry args={[0.22, 2.0, 0.22]} />
        <meshStandardMaterial color="#4a3220" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Peñascos 3D — la posición/escala vienen de world/collision.ts, la MISMA fuente que usa Player.tsx para no chocar contra una roca invisible. */
function RockFormations() {
  const rocks = useMemo(() => getRockFormations(), []);

  return (
    <group>
      {rocks.map((r, i) => (
        <mesh
          key={`rock3d-${i}`}
          position={r.pos}
          rotation={[0, r.rot, 0]}
          scale={r.scale}
          castShadow
          receiveShadow
        >
          {r.shape === 'dodeca' && <dodecahedronGeometry args={[1, r.detail]} />}
          {r.shape === 'icosa' && <icosahedronGeometry args={[1, r.detail]} />}
          {r.shape === 'octa' && <octahedronGeometry args={[1, r.detail]} />}
          <meshStandardMaterial color={r.color} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** Troncos caídos — cilindros reales tumbados, para variar el "suelo de bosque" más allá de rocas y sprites planos. */
function FallenLogs() {
  const logs = useMemo(() => getFallenLogs(), []);

  return (
    <group>
      {logs.map((l, i) => (
        <group key={`log-${i}`} position={l.pos} rotation={[0, l.rot, Math.PI / 2 + l.tilt]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[l.radius, l.radius * 0.85, l.length, 8]} />
            <meshStandardMaterial color="#4a3320" roughness={0.95} flatShading />
          </mesh>
          {/* Corte transversal en una punta — un anillo simple, pero
              es justo el detalle que vende "tronco" en vez de "palo". */}
          <mesh position={[0, l.length / 2, 0]} castShadow>
            <cylinderGeometry args={[l.radius * 0.9, l.radius * 0.9, 0.03, 8]} />
            <meshStandardMaterial color="#c9a878" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ============================================================
   SOMBRAS DE CONTACTO (instanciadas)
============================================================ */

function useBlobShadowTexture(): THREE.Texture {
  return useMemo(() => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      const t = new THREE.Texture();
      t.needsUpdate = true;
      return t;
    }

    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(0,0,0,0.6)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.26)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

/**
 * Los sprites no proyectan sombra real: son planos que giran hacia la
 * cámara y el shadow map dibujaba rectángulos girando por el suelo.
 * En su lugar, una mancha instanciada pegada al terreno — una sola
 * llamada de dibujo para miles de plantas.
 */
const VegetationShadows: React.FC<{ items: Placement[] }> = React.memo(({ items }) => {
  const texture = useBlobShadowTexture();
  const meshRef = React.useRef<THREE.InstancedMesh>(null);

  const big = useMemo(() => items.filter((p) => !p.flat && p.height >= 0.8), [items]);

  React.useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-Math.PI / 2, 0, 0),
    );
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();

    big.forEach((item, i) => {
      const r = item.height * 0.3;
      p.set(item.x, getWorldTerrainHeight(item.x, item.z) + 0.05, item.z);
      s.set(r, r, r);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [big]);

  if (big.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, big.length]}
      frustumCulled={false}
      renderOrder={1}
    >
      <circleGeometry args={[1, 10]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.7}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-3}
        polygonOffsetUnits={-3}
      />
    </instancedMesh>
  );
});

VegetationShadows.displayName = 'VegetationShadows';

/* ============================================================
   COMPONENTE
============================================================ */

export const EnvironmentDecor: React.FC = React.memo(() => {
  const atlas = useTexture(AMBIENT_SHEET) as THREE.Texture;

  const instancedAtlas = useMemo(() => {
    const t = atlas.clone();
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [atlas]);

  const scattered = useMemo(
    () => [
      ...scatterBiome(1, 1024, 'tree', 40, { minRadius: 8, maxSlope: 2.1 }),
      ...scatterBiome(2, 1024, 'bush', 40, { minRadius: 7, maxSlope: 2.2 }),
      ...scatterBiome(3, 2025, 'grass', 40, { minRadius: 5, maxSlope: 2.6 }),
      ...scatterBiome(4, 784, 'detail', 40, { minRadius: 6, maxSlope: 2.0 }),
    ],
    [],
  );

  const upright = useMemo(
    () =>
      [...LANDMARKS, ...scattered].filter(
        (p) => !p.flat && p.fixedRotationY === undefined,
      ),
    [scattered],
  );

  const special = useMemo(
    () => [
      ...LANDMARKS.filter((p) => p.fixedRotationY !== undefined),
      ...lakeSurface(),
    ],
    [],
  );

  const instances = useMemo<SpriteInstance[]>(
    () =>
      upright.map((p) => {
        const aspect = p.crop.width / p.crop.height;
        return {
          x: p.x,
          y: getWorldTerrainHeight(p.x, p.z),
          z: p.z,
          width: p.height * aspect,
          height: p.height,
          uv: [
            p.crop.x / SHEET_W,
            1 - (p.crop.y + p.crop.height) / SHEET_H,
            p.crop.width / SHEET_W,
            p.crop.height / SHEET_H,
          ],
          sway: p.sway ?? 0.4,
          tint: p.tint ?? [1, 1, 1],
        };
      }),
    [upright],
  );

  return (
    <group>
      <Dock />
      <RockFormations />
      <FallenLogs />
      <VegetationShadows items={upright} />

      <InstancedSprites texture={instancedAtlas} items={instances} />

      {/* Lo que no encaja en el sistema instanciado (elementos
          acostados en el agua y vallas con rotación fija) sigue como
          sprites sueltos — son pocas decenas. */}
      {special.map((p, i) => {
        const ground = getWorldTerrainHeight(p.x, p.z);
        const y = p.yOverride ?? (p.flat ? ground + 0.05 : ground + p.height / 2);

        return (
          <RoomSprite
            key={`special-${i}`}
            sheet="ambient"
            crop={p.crop}
            position={[p.x, y, p.z]}
            height={p.height}
            billboard={false}
            rotation={
              p.flat ? [-Math.PI / 2, 0, 0] : [0, p.fixedRotationY ?? 0, 0]
            }
            castShadow={false}
          />
        );
      })}
    </group>
  );
});

EnvironmentDecor.displayName = 'EnvironmentDecor';

export { A };

export default EnvironmentDecor;
