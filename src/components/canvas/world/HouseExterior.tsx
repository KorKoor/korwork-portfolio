import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getWorldTerrainHeight } from '../../../world/terrain';
import { Glow, Smoke } from './NightVFX';
import {
  useAtmosphereStore,
  getNightFactor,
} from '../../../world/atmosphere';

/* ============================================================
   FACHADA DE LA CASA
   ============================================================
   Antes solo existía el marco de la puerta flotando en el pasto —
   "arquitectura" real quiere decir que la casa se vea como un
   volumen habitado desde fuera: base de piedra, paredes con
   textura de tablón, techo a dos aguas, chimenea con humo, y
   ventanas que se encienden solas al anochecer (la misma regla que
   los faroles: la luz cálida es la que hace que un edificio se lea
   como "alguien vive aquí").

   Todo son primitivas (BoxGeometry) en el mismo lenguaje que
   Room.tsx/CaveZone.tsx — nada de mallas importadas.
============================================================ */

// Colores más claros/saturados de lo que "parece correcto" en el
// editor a propósito: bajo la luz ambiental+direccional del mundo
// (mucho más tenue que un render de estudio) cualquier tono oscuro
// se hunde en negro contra el bosque de fondo. Estos valores son los
// que de verdad se leen como madera cálida en el juego.
const WALL_COLOR = '#b8895a';

const WALL_DARK = '#6e4f36';

const ROOF_COLOR = '#a8483a';

const ROOF_DARK = '#7c342a';

const TRIM_COLOR = '#4a3320';

const STONE_COLOR = '#8a8272';

// Huella de la casa: centrada en el origen, con la puerta en su cara
// sur (z positivo, hacia donde spawnea el jugador).
const HALF_W = 3.4;

const DEPTH_N = -2.4; // pared trasera
const DEPTH_S = 4.6; // línea de la puerta (coincide con el marco existente)

const WALL_HEIGHT = 2.7;

// Coincide con los postes del marco de puerta ya colocados en
// World.tsx (x=±1.8) — así el hueco de la pared encaja exacto con
// el marco existente en vez de dejar un salto entre los dos.
const DOOR_HALF_W = 1.8;

// Frontón (gable) como escalera de cajas angostándose hacia la
// cumbrera — ver comentario junto a su uso más abajo. RIDGE_HEIGHT
// coincide con la posición de la cumbrera del techo (1.42).
const GABLE_RIDGE_HEIGHT = 1.42;

const GABLE_STEP_COUNT = 7;

const GABLE_STEP_HEIGHT = GABLE_RIDGE_HEIGHT / GABLE_STEP_COUNT;

const GABLE_STEPS: { y: number; depth: number }[] = Array.from(
  { length: GABLE_STEP_COUNT },
  (_, i) => {
    const t = i / (GABLE_STEP_COUNT - 1);
    return {
      y: t * GABLE_RIDGE_HEIGHT,
      depth: Math.max(0.08, (DEPTH_S - DEPTH_N) * (1 - t) * 0.97),
    };
  },
);

function Window({
  position,
  vertical = false,
}: {
  position: [number, number, number];
  vertical?: boolean;
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (!matRef.current) return;
    const atmo = useAtmosphereStore.getState();
    const night = getNightFactor(atmo.time);
    matRef.current.emissiveIntensity = 0.2 + night * 2.6;
  });

  const size: [number, number, number] = vertical
    ? [0.08, 0.62, 0.62]
    : [0.62, 0.62, 0.08];

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          ref={matRef}
          color="#3a2f1c"
          emissive="#ffcf82"
          emissiveIntensity={0.2}
          roughness={0.5}
        />
      </mesh>
      {/* Cruceta de la ventana */}
      <mesh position={[0, 0, vertical ? 0 : 0.001]}>
        <boxGeometry
          args={
            vertical
              ? [0.09, 0.64, 0.05]
              : [0.64, 0.05, 0.09]
          }
        />
        <meshStandardMaterial color={TRIM_COLOR} roughness={0.9} />
      </mesh>
      <mesh>
        <boxGeometry
          args={
            vertical
              ? [0.09, 0.05, 0.64]
              : [0.05, 0.64, 0.09]
          }
        />
        <meshStandardMaterial color={TRIM_COLOR} roughness={0.9} />
      </mesh>
    </group>
  );
}

export const HouseExterior: React.FC = React.memo(() => {
  const groundCenter = getWorldTerrainHeight(0, 1);
  const baseY = groundCenter + 0.1;

  return (
    <group position={[0, baseY, 0]}>
      {/* Terraza de piedra bajo toda la huella — la casa se apoya en
          una plataforma real, no flota sobre el pasto. */}
      <mesh position={[0, -0.06, (DEPTH_N + DEPTH_S) / 2 - 0.3]} receiveShadow>
        <boxGeometry
          args={[HALF_W * 2 + 0.7, 0.14, DEPTH_S - DEPTH_N + 1.1]}
        />
        <meshStandardMaterial color={STONE_COLOR} roughness={0.95} />
      </mesh>

      {/* Escalón de entrada. */}
      <mesh position={[0, -0.02, DEPTH_S + 0.35]} receiveShadow castShadow>
        <boxGeometry args={[2.6, 0.18, 0.5]} />
        <meshStandardMaterial color={STONE_COLOR} roughness={0.95} />
      </mesh>

      {/* Pared trasera. */}
      <mesh position={[0, WALL_HEIGHT / 2, DEPTH_N]} castShadow receiveShadow>
        <boxGeometry args={[HALF_W * 2, WALL_HEIGHT, 0.22]} />
        <meshStandardMaterial
          color={WALL_COLOR}
          emissive="#5a3c22"
          emissiveIntensity={0.4}
          roughness={0.8}
        />
      </mesh>

      {/* Paredes laterales. */}
      <mesh
        position={[-HALF_W, WALL_HEIGHT / 2, (DEPTH_N + DEPTH_S) / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.22, WALL_HEIGHT, DEPTH_S - DEPTH_N]} />
        <meshStandardMaterial
          color={WALL_DARK}
          emissive="#3e2a18"
          emissiveIntensity={0.4}
          roughness={0.8}
        />
      </mesh>
      <mesh
        position={[HALF_W, WALL_HEIGHT / 2, (DEPTH_N + DEPTH_S) / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.22, WALL_HEIGHT, DEPTH_S - DEPTH_N]} />
        <meshStandardMaterial
          color={WALL_DARK}
          emissive="#3e2a18"
          emissiveIntensity={0.4}
          roughness={0.8}
        />
      </mesh>

      {/* Pared frontal partida por la puerta (el marco ya existe en
          World.tsx en z=4.6 — aquí solo se rellenan los dos lados). */}
      <mesh
        position={[
          -(HALF_W + DOOR_HALF_W) / 2,
          WALL_HEIGHT / 2,
          DEPTH_S,
        ]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[HALF_W - DOOR_HALF_W, WALL_HEIGHT, 0.22]} />
        <meshStandardMaterial
          color={WALL_COLOR}
          emissive="#5a3c22"
          emissiveIntensity={0.4}
          roughness={0.8}
        />
      </mesh>
      <mesh
        position={[
          (HALF_W + DOOR_HALF_W) / 2,
          WALL_HEIGHT / 2,
          DEPTH_S,
        ]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[HALF_W - DOOR_HALF_W, WALL_HEIGHT, 0.22]} />
        <meshStandardMaterial
          color={WALL_COLOR}
          emissive="#5a3c22"
          emissiveIntensity={0.4}
          roughness={0.8}
        />
      </mesh>
      {/* Dintel sobre la puerta. */}
      <mesh position={[0, WALL_HEIGHT - 0.28, DEPTH_S]} castShadow>
        <boxGeometry args={[DOOR_HALF_W * 2 + 0.3, 0.5, 0.24]} />
        <meshStandardMaterial
          color={WALL_COLOR}
          emissive="#5a3c22"
          emissiveIntensity={0.4}
          roughness={0.8}
        />
      </mesh>

      {/* Zócalo de tablones — rompe la monotonía del color plano de
          las paredes con una franja más oscura. */}
      {[DEPTH_N, DEPTH_S].map((z, i) => (
        <mesh key={`plinth-${i}`} position={[0, 0.22, z]}>
          <boxGeometry args={[HALF_W * 2 + 0.02, 0.44, 0.24]} />
          <meshStandardMaterial color={TRIM_COLOR} roughness={0.9} />
        </mesh>
      ))}

      {/* Techo a dos aguas. */}
      <group position={[0, WALL_HEIGHT, (DEPTH_N + DEPTH_S) / 2]}>
        <mesh
          position={[0, 0.75, -1.15]}
          rotation={[0.62, 0, 0]}
          castShadow
        >
          <boxGeometry
            args={[HALF_W * 2 + 0.9, 0.14, (DEPTH_S - DEPTH_N) / 2 + 1.0]}
          />
          <meshStandardMaterial
            color={ROOF_COLOR}
            emissive="#5c2018"
            emissiveIntensity={0.35}
            roughness={0.7}
          />
        </mesh>
        <mesh
          position={[0, 0.75, 1.15]}
          rotation={[-0.62, 0, 0]}
          castShadow
        >
          <boxGeometry
            args={[HALF_W * 2 + 0.9, 0.14, (DEPTH_S - DEPTH_N) / 2 + 1.0]}
          />
          <meshStandardMaterial
            color={ROOF_COLOR}
            emissive="#5c2018"
            emissiveIntensity={0.35}
            roughness={0.7}
          />
        </mesh>
        {/* Cumbrera */}
        <mesh position={[0, 1.42, 0]} castShadow>
          <boxGeometry args={[HALF_W * 2 + 0.95, 0.18, 0.3]} />
          <meshStandardMaterial color={ROOF_DARK} roughness={0.85} />
        </mesh>
        {/* Frontones triangulares (tapan los huecos del techo a dos
            aguas visto de lado). Antes esto era un coneGeometry con
            3 segmentos radiales — que NO da un triángulo plano, da
            una pirámide gorda de radio 3.8 sin relación real con el
            ancho del techo, y desde ciertos ángulos se leía como un
            bulto deforme saliendo de la pared. Una escalera de cajas
            que se angosta hacia arriba se ve como un triángulo desde
            lejos (estilo pixel-art) y, al ser solo cajas, nunca se
            deforma sin importar el ángulo de cámara. */}
        {[-1, 1].map((side) =>
          GABLE_STEPS.map((s, i) => (
            <mesh
              key={`gable-${side}-${i}`}
              position={[side * HALF_W, s.y, 0]}
            >
              <boxGeometry args={[0.2, GABLE_STEP_HEIGHT + 0.015, s.depth]} />
              <meshStandardMaterial
                color={WALL_DARK}
                emissive="#3e2a18"
                emissiveIntensity={0.4}
                roughness={0.8}
              />
            </mesh>
          )),
        )}
      </group>

      {/* Chimenea con humo — la casa "respira". */}
      <group position={[HALF_W - 0.7, 0, DEPTH_N + 0.8]}>
        <mesh position={[0, 3.3, 0]} castShadow>
          <boxGeometry args={[0.42, 1.8, 0.42]} />
          <meshStandardMaterial color={STONE_COLOR} roughness={0.95} />
        </mesh>
        <Smoke position={[0, 4.3, 0]} />
      </group>

      {/* Ventanas — una por cada pared lateral, con luz cálida propia
          al anochecer, más el halo que ya usan faroles/fogata. */}
      <Window position={[-HALF_W + 0.01, 1.55, 0.6]} vertical />
      <Window position={[HALF_W - 0.01, 1.55, 0.6]} vertical />
      <Window
        position={[
          -(HALF_W + DOOR_HALF_W) / 2,
          1.55,
          DEPTH_S - 0.01,
        ]}
      />

      <Glow
        position={[-HALF_W + 0.05, 1.55, 0.6]}
        color="#ffcf82"
        size={1.1}
        nightOnly={0.7}
        flicker={0.15}
      />
    </group>
  );
});

HouseExterior.displayName = 'HouseExterior';

export default HouseExterior;
