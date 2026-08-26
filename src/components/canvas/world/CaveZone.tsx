import React, { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { CAVE_CENTER, getWorldTerrainHeight } from '../../../world/terrain';

// Arco de entrada pintado (de environment/Bordes2.png) que se superpone
// al frente de la boca de cueva de cajas — un remate "profesional" en
// vez de dejar la abertura como un simple hueco entre bloques.
const CAVE_ARCH_SHEET = '/assets/environment/Bordes2.png';
const CAVE_ARCH_CROP = { x: 718, y: 642, width: 95, height: 105 };
const CAVE_ARCH_SHEET_W = 1536;
const CAVE_ARCH_SHEET_H = 1024;

/**
 * Boca de cueva tallada en la ladera del valle — bloques de color
 * sólido (mismo lenguaje que Room.tsx) en vez de una malla de roca
 * detallada, para que combine con el resto del juego. Suficientemente
 * oscura por dentro para que los murciélagos (Wildlife.tsx) y una
 * luz cálida al fondo se sientan como una cueva real.
 *
 * Segunda pasada: además de la boca + fondo con un cristal, ahora hay
 * un racimo de cristales de varios colores/tamaños, estalagmitas en
 * el piso (antes solo colgaban estalactitas), un charquito reflejando
 * el brillo morado, y rocalla suelta — para que se sienta una cueva
 * habitada, no una caja vacía con una luz al fondo.
 */

const ROCK = '#2a2620';

const ROCK_DARK = '#171410';

const ROCK_LIGHT = '#3d382c';

function Rock({
  position,
  size,
  color = ROCK,
  rotationY = 0,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  rotationY?: number;
}) {
  return (
    <mesh position={position} rotation={[0, rotationY, 0]} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.96} />
    </mesh>
  );
}

// Determinista, sin Math.random — mismo truco que el resto del mundo.
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

interface CrystalSpec {
  position: [number, number, number];
  scale: number;
  color: string;
  shape: 'octa' | 'icosa';
  tilt: number;
}

const CRYSTAL_CLUSTER: CrystalSpec[] = [
  { position: [0, 1.1, -6.8], scale: 0.55, color: '#8b5cf6', shape: 'octa', tilt: 0 },
  { position: [-0.9, 0.55, -6.3], scale: 0.3, color: '#a78bfa', shape: 'octa', tilt: 0.4 },
  { position: [0.85, 0.5, -6.5], scale: 0.28, color: '#67e8f9', shape: 'icosa', tilt: -0.3 },
  { position: [-4.6, 0.6, -3.4], scale: 0.32, color: '#f0abfc', shape: 'octa', tilt: 0.6 },
  { position: [-4.2, 0.32, -2.9], scale: 0.18, color: '#c4b5fd', shape: 'octa', tilt: 0.2 },
  { position: [4.9, 0.5, -3.1], scale: 0.3, color: '#67e8f9', shape: 'icosa', tilt: -0.5 },
  { position: [4.5, 0.28, -2.6], scale: 0.16, color: '#8b5cf6', shape: 'octa', tilt: 0.1 },
  { position: [-2.6, 0.24, -0.4], scale: 0.15, color: '#a78bfa', shape: 'octa', tilt: 0.7 },
];

// Estalagmitas: conos angostos parados sobre el piso, tamaño/posición
// determinista via hash() en vez de a mano una por una.
const STALAGMITES = Array.from({ length: 9 }, (_, i) => {
  const a = hash(i * 3.1 + 1) * Math.PI * 2;
  const r = 3.2 + hash(i * 3.1 + 2) * 4.6;
  const h = 0.5 + hash(i * 3.1 + 3) * 1.1;
  return {
    position: [Math.cos(a) * r, h / 2, -1.5 + Math.sin(a) * r * 0.6] as [number, number, number],
    height: h,
    radius: 0.16 + hash(i * 3.1 + 4) * 0.16,
  };
});

// Rocalla suelta sobre el piso — variedad de bulto sin ser protagonista.
const RUBBLE = Array.from({ length: 12 }, (_, i) => {
  const a = hash(i * 5.7 + 10) * Math.PI * 2;
  const r = 1.5 + hash(i * 5.7 + 11) * 6.5;
  const s = 0.12 + hash(i * 5.7 + 12) * 0.22;
  return {
    position: [Math.cos(a) * r, s * 0.4, 1.5 + Math.sin(a) * r * 0.7] as [number, number, number],
    scale: s,
    rot: hash(i * 5.7 + 13) * Math.PI,
  };
});

function CaveArch() {
  const texture = useTexture(CAVE_ARCH_SHEET) as THREE.Texture;

  const archTexture = useMemo(() => {
    const tex = texture.clone();
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.repeat.set(
      CAVE_ARCH_CROP.width / CAVE_ARCH_SHEET_W,
      CAVE_ARCH_CROP.height / CAVE_ARCH_SHEET_H,
    );
    tex.offset.set(
      CAVE_ARCH_CROP.x / CAVE_ARCH_SHEET_W,
      1 - (CAVE_ARCH_CROP.y + CAVE_ARCH_CROP.height) / CAVE_ARCH_SHEET_H,
    );
    tex.needsUpdate = true;
    return tex;
  }, [texture]);

  const aspect = CAVE_ARCH_CROP.width / CAVE_ARCH_CROP.height;
  const archHeight = 4.6;

  return (
    <mesh position={[0, archHeight / 2 - 0.1, -0.85]} renderOrder={2}>
      <planeGeometry args={[archHeight * aspect, archHeight]} />
      <meshStandardMaterial
        map={archTexture}
        transparent
        alphaTest={0.4}
        side={THREE.DoubleSide}
        roughness={1}
      />
    </mesh>
  );
}

export const CaveZone: React.FC = React.memo(() => {
  const [cx, cz] = CAVE_CENTER;
  const groundY = getWorldTerrainHeight(cx, cz);

  const crystalGeoms = useMemo(
    () => ({
      octa: <octahedronGeometry args={[1, 0]} />,
      icosa: <icosahedronGeometry args={[1, 0]} />,
    }),
    [],
  );

  return (
    <group position={[cx, groundY, cz]}>
      {/* Piso interior, más plano que el valle de afuera. */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[9, 28]} />
        <meshStandardMaterial color={ROCK_DARK} roughness={1} />
      </mesh>

      {/* Arco pintado que remata la boca de la cueva — se ve de frente
          (no billboardea), igual que el resto de props fijos del
          mundo (bancas, arcos de EnvironmentDecor). */}
      <CaveArch />

      {/* "Ladera" que enmarca la entrada — bloques irregulares
          alrededor de un arco central abierto. */}
      <Rock position={[-4.2, 2.4, -2.5]} size={[3.4, 5.0, 3.0]} rotationY={0.3} />
      <Rock position={[4.4, 2.8, -2.2]} size={[3.6, 5.6, 3.2]} rotationY={-0.25} />
      <Rock position={[0, 4.6, -3.0]} size={[6.5, 2.0, 3.0]} color={ROCK_LIGHT} />
      <Rock position={[-6.5, 1.6, 0.5]} size={[2.6, 3.2, 4.0]} rotationY={0.6} />
      <Rock position={[6.6, 1.8, 0.8]} size={[2.8, 3.6, 4.2]} rotationY={-0.5} />

      {/* Interior: paredes cerrando el fondo de la cueva. */}
      <Rock position={[0, 3.0, -8.0]} size={[13.0, 6.5, 1.6]} color={ROCK_DARK} />
      <Rock position={[-6.2, 3.0, -6.0]} size={[2.2, 6.5, 5.0]} color={ROCK_DARK} rotationY={0.4} />
      <Rock position={[6.2, 3.0, -6.0]} size={[2.2, 6.5, 5.0]} color={ROCK_DARK} rotationY={-0.4} />

      {/* Estalactitas colgando de la entrada, puramente decorativas. */}
      <Rock position={[-2.0, 4.6, -1.0]} size={[0.4, 1.4, 0.4]} color={ROCK_LIGHT} />
      <Rock position={[1.6, 4.4, -1.4]} size={[0.35, 1.1, 0.35]} color={ROCK_LIGHT} />
      <Rock position={[0.3, 4.7, -0.6]} size={[0.3, 0.9, 0.3]} color={ROCK_LIGHT} />

      {/* Estalagmitas: antes solo colgaba roca, ahora también crece
          del piso — se siente mucho más una cueva real y menos una
          caja vacía. */}
      {STALAGMITES.map((s, i) => (
        <mesh key={`stalag-${i}`} position={s.position} castShadow receiveShadow>
          <coneGeometry args={[s.radius, s.height, 6]} />
          <meshStandardMaterial color={ROCK_LIGHT} roughness={0.95} flatShading />
        </mesh>
      ))}

      {/* Rocalla suelta — variedad de bulto en el piso. */}
      {RUBBLE.map((r, i) => (
        <mesh
          key={`rubble-${i}`}
          position={r.position}
          rotation={[0, r.rot, 0]}
          scale={r.scale}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={ROCK} roughness={1} flatShading />
        </mesh>
      ))}

      {/* Racimo de cristales — antes había uno solo al fondo; ahora
          hay grupos más chicos cerca de las paredes laterales también,
          para que el brillo morado/cian se sienta por toda la cueva. */}
      {CRYSTAL_CLUSTER.map((c, i) => (
        <mesh
          key={`crystal-${i}`}
          position={c.position}
          rotation={[c.tilt, i * 0.7, c.tilt * 0.5]}
          scale={c.scale}
          castShadow
        >
          {crystalGeoms[c.shape]}
          <meshStandardMaterial
            color={c.color}
            emissive={c.color}
            emissiveIntensity={2.0}
            roughness={0.25}
            metalness={0.15}
          />
        </mesh>
      ))}

      {/* Charquito al fondo, reflejando el brillo del cristal grande —
          una cueva con cristales y sin una gota de agua se siente
          incompleta. */}
      <mesh position={[0, 0.01, -5.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 20]} />
        <meshStandardMaterial
          color="#150f28"
          emissive="#5b21b6"
          emissiveIntensity={0.5}
          roughness={0.15}
          metalness={0.3}
        />
      </mesh>

      <pointLight position={[0, 1.6, -6.8]} intensity={3.5} color="#a78bfa" distance={9} decay={2} />
      <pointLight position={[0, 3.0, -2.0]} intensity={0.6} color="#7dd3fc" distance={7} decay={2} />
      {/* Un par de luces bajas cerca de los racimos laterales, para
          que su brillo también ilumine el piso a su alrededor. */}
      <pointLight position={[-4.4, 0.9, -3.1]} intensity={1.1} color="#c4b5fd" distance={4.5} decay={2} />
      <pointLight position={[4.7, 0.9, -2.8]} intensity={1.1} color="#67e8f9" distance={4.5} decay={2} />

      <mesh position={[0, 0.9, -8.7]} visible={false}>
        <boxGeometry args={[12, 5, 0.4]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
});

CaveZone.displayName = 'CaveZone';

export default CaveZone;
