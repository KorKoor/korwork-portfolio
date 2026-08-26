import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { getWorldTerrainHeight } from '../../../world/terrain';

/* ============================================================
   NPCs
   ============================================================
   Reutilizan la MISMA hoja del jugador (no hay un set de sprites de
   NPC dedicado) con un tinte de color propio por personaje — la
   técnica clásica de "palette swap" de sprites 2D — para que se
   lean como personajes distintos sin inventar un pipeline de arte
   nuevo. Cada uno tiene una rutina simple: deambula cerca de su
   "casa" (idle/wander, igual que Wildlife.tsx pero sin huir), y gira
   a encarar al jugador cuando se acerca — la señal mínima de "esto
   está vivo y te nota" que pide un NPC creíble.
============================================================ */

const ACTIONS_SHEET = '/assets/Player-Actions/actions/player-action.png';

const CROPS = {
  idleFront: { x: 36, y: 11, width: 100, height: 211 },
  idleBack: { x: 356, y: 11, width: 101, height: 211 },
  idleSide: { x: 151, y: 12, width: 95, height: 213 },
  idleSideAlt: { x: 258, y: 15, width: 88, height: 207 },
} as const;

const SPRITE_HEIGHT = 1.55;

// Reutilizado cada frame para no generar basura para el GC (mismo
// patrón que Player.tsx).
const _npcCamDir = new THREE.Vector3();

const REF_PIXELS = CROPS.idleFront.height;

const UNITS_PER_PX = SPRITE_HEIGHT / REF_PIXELS;

export interface NPCDef {
  id: string;
  name: string;
  home: [number, number];
  roamRadius: number;
  tint: string;
  greetings: string[];
}

export const NPCS: NPCDef[] = [
  {
    id: 'fisherman',
    name: 'Un pescador',
    home: [15.5, 12.0],
    roamRadius: 1.8,
    tint: '#8fd0ff',
    greetings: [
      '"El lago está tranquilo hoy. Buena señal para pescar."',
      '"Si el agua se pone gris, guarda la caña — viene tormenta."',
      '"Llevo aquí desde el amanecer. Todavía nada, pero se siente bien."',
    ],
  },
  {
    id: 'hiker',
    name: 'Una excursionista',
    home: [7.2, 3.2],
    roamRadius: 2.6,
    tint: '#ffb0c8',
    greetings: [
      '"El mirador de los cerezos vale la subida, créeme."',
      '"De noche salen luciérnagas cerca del lago. No te las pierdas."',
      '"¿Ya viste la cueva al noroeste? Ahí viven los murciélagos."',
    ],
  },
];

function useNpcFrames(base: THREE.Texture) {
  return useMemo(() => {
    const image = base.image as { width: number; height: number };

    const make = (crop: (typeof CROPS)[keyof typeof CROPS]) => {
      const tex = base.clone();
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.repeat.set(crop.width / image.width, crop.height / image.height);
      tex.offset.set(
        crop.x / image.width,
        1 - (crop.y + crop.height) / image.height,
      );
      tex.needsUpdate = true;
      return {
        texture: tex,
        w: crop.width * UNITS_PER_PX,
        h: crop.height * UNITS_PER_PX,
      };
    };

    return {
      front: make(CROPS.idleFront),
      back: make(CROPS.idleBack),
      side: [make(CROPS.idleSide), make(CROPS.idleSideAlt)],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);
}

interface NpcProps {
  def: NPCDef;
  baseTexture: THREE.Texture;
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

const NPC: React.FC<NpcProps> = React.memo(({ def, baseTexture, playerPositionRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const frames = useNpcFrames(baseTexture);

  const seed = useMemo(() => {
    let h = 0;
    for (let i = 0; i < def.id.length; i += 1) h = (h * 31 + def.id.charCodeAt(i)) % 1000;
    return h / 1000;
  }, [def.id]);

  const rng = useRef(seed);
  const next = () => {
    rng.current = ((rng.current * 9301 + 49297) % 233280) / 233280;
    return rng.current;
  };

  const target = useRef(new THREE.Vector3(def.home[0], 0, def.home[1]));
  const idleTimer = useRef(seed * 3);
  const facing = useRef(1);
  const sideFrame = useRef(0);
  const sideTimer = useRef(0);
  const noticing = useRef(false);

  useFrame((state, rawDelta) => {
    if (!groupRef.current || !meshRef.current || !materialRef.current) return;
    const delta = Math.min(rawDelta, 1 / 30);
    const pos = groupRef.current.position;
    const player = playerPositionRef.current;

    const distPlayer = Math.hypot(pos.x - player.x, pos.z - player.z);
    const aware = distPlayer < 3.4;

    idleTimer.current -= delta;

    if (!aware && idleTimer.current <= 0) {
      const a = next() * Math.PI * 2;
      const r = next() * def.roamRadius;
      target.current.set(def.home[0] + Math.cos(a) * r, 0, def.home[1] + Math.sin(a) * r);
      idleTimer.current = 2.5 + next() * 3.5;
    }

    let mode: 'front' | 'back' | 'left' | 'right' = 'front';

    if (aware) {
      // Se voltea a ver al jugador — el gesto mínimo de "te noto".
      noticing.current = true;
      const dx = player.x - pos.x;
      const dz = player.z - pos.z;
      mode = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'right' : 'left') : dz > 0 ? 'front' : 'back';
    } else {
      noticing.current = false;
      const dx = target.current.x - pos.x;
      const dz = target.current.z - pos.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.2) {
        const step = Math.min(dist, 0.55 * delta);
        pos.x += (dx / dist) * step;
        pos.z += (dz / dist) * step;
        mode = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'right' : 'left') : dz > 0 ? 'front' : 'back';
        if (Math.abs(dx) > 0.05) facing.current = dx >= 0 ? 1 : -1;
      }
    }

    if (mode === 'left' || mode === 'right') {
      facing.current = mode === 'right' ? 1 : -1;
    }

    pos.y = getWorldTerrainHeight(pos.x, pos.z);

    // Frame de lado alterna lento (respiración/idle) — como el
    // jugador, para que no se vea congelado al ver de perfil.
    sideTimer.current += delta;
    if (sideTimer.current > 1.1) {
      sideTimer.current = 0;
      sideFrame.current = (sideFrame.current + 1) % frames.side.length;
    }

    const frame =
      mode === 'front'
        ? frames.front
        : mode === 'back'
          ? frames.back
          : frames.side[sideFrame.current];

    if (materialRef.current.map !== frame.texture) {
      materialRef.current.map = frame.texture;
      materialRef.current.needsUpdate = true;
    }

    const flip = mode === 'left' || mode === 'right' ? facing.current : 1;

    meshRef.current.scale.set(flip * frame.w, frame.h, 1);
    meshRef.current.position.y = frame.h / 2 + 0.02;

    state.camera.getWorldDirection(_npcCamDir);
    meshRef.current.rotation.y = Math.atan2(-_npcCamDir.x, -_npcCamDir.z);
  });

  return (
    <group ref={groupRef} position={[def.home[0], 0, def.home[1]]}>
      <mesh ref={meshRef} castShadow>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          ref={materialRef}
          map={frames.front.texture}
          color={def.tint}
          transparent
          alphaTest={0.5}
          side={THREE.DoubleSide}
          roughness={1}
          toneMapped={false}
          emissive={def.tint}
          emissiveIntensity={0.18}
        />
      </mesh>
    </group>
  );
});

NPC.displayName = 'NPC';

interface NPCsProps {
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

export const NPCsLayer: React.FC<NPCsProps> = React.memo(({ playerPositionRef }) => {
  const baseTexture = useTexture(ACTIONS_SHEET) as THREE.Texture;

  return (
    <group>
      {NPCS.map((def) => (
        <NPC key={def.id} def={def} baseTexture={baseTexture} playerPositionRef={playerPositionRef} />
      ))}
    </group>
  );
});

NPCsLayer.displayName = 'NPCsLayer';

export default NPCsLayer;
