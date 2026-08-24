import React, { useCallback, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Player } from './Player';
import { RoomSprite } from './RoomProps';

interface RoomProps {
  onInteractDesk: () => void;
}

type V3 = [number, number, number];
type Crop = { x: number; y: number; width: number; height: number };

const FLOOR_ROTATION: V3 = [-Math.PI / 2, 0, 0];
const WALL_ROTATION: V3 = [0, 0, 0];
const FLOOR_TOP = 0.1825;
const TIER_LOW = 0.16;
const TIER_MED = 0.24;
const TIER_HIGH = 0.34;

const C: Record<string, Crop> = {
  board: { x: 350, y: 22, width: 385, height: 302 },
  plant: { x: 744, y: 11, width: 116, height: 296 },
  window: { x: 880, y: 28, width: 244, height: 278 },
  poster: { x: 1150, y: 15, width: 143, height: 197 },
  guitar: { x: 1424, y: 16, width: 102, height: 312 },
  wallShelf: { x: 1103, y: 202, width: 323, height: 164 },
  todo: { x: 1080, y: 371, width: 177, height: 191 },
  map: { x: 1270, y: 367, width: 251, height: 227 },
  laptop: { x: 220, y: 359, width: 178, height: 210 },
  monitor: { x: 394, y: 344, width: 264, height: 198 },
  sideMonitor: { x: 662, y: 335, width: 135, height: 220 },
  deskLamp: { x: 799, y: 318, width: 166, height: 244 },
  keyboard: { x: 431, y: 545, width: 236, height: 81 },
  mousePad: { x: 660, y: 558, width: 138, height: 72 },
  mouse: { x: 792, y: 558, width: 105, height: 108 },
  camera: { x: 801, y: 478, width: 58, height: 68 },
  phone: { x: 852, y: 555, width: 64, height: 73 },
  pencilCup: { x: 950, y: 413, width: 51, height: 86 },
  bed: { x: 1, y: 569, width: 422, height: 373 },
  skateboard: { x: 431, y: 648, width: 84, height: 260 },
  backpack: { x: 518, y: 638, width: 151, height: 190 },
  burger: { x: 681, y: 638, width: 95, height: 70 },
  pizza: { x: 681, y: 710, width: 95, height: 67 },
  drink: { x: 783, y: 625, width: 47, height: 78 },
  glass: { x: 852, y: 640, width: 53, height: 67 },
  bowl: { x: 792, y: 708, width: 82, height: 66 },
  coffee: { x: 610, y: 826, width: 88, height: 78 },
  couchCats: { x: 698, y: 773, width: 195, height: 100 },
  sleepingCats: { x: 901, y: 770, width: 200, height: 110 },
  cityPrint: { x: 1055, y: 582, width: 131, height: 105 },
  pinkNote: { x: 1200, y: 582, width: 92, height: 105 },
  purpleNote: { x: 1305, y: 588, width: 88, height: 103 },
  greenNote: { x: 1405, y: 600, width: 84, height: 95 },
  globe: { x: 1020, y: 697, width: 115, height: 94 },
  ideas: { x: 1141, y: 697, width: 123, height: 100 },
  photo: { x: 1265, y: 713, width: 149, height: 86 },
  console: { x: 1112, y: 809, width: 123, height: 67 },
  cameraLarge: { x: 1265, y: 787, width: 96, height: 145 },
  books: { x: 1350, y: 787, width: 80, height: 145 },
  plantLarge: { x: 1409, y: 697, width: 122, height: 168 },
};

function Block({ position, size, color, roughness = 0.86, metalness = 0, emissive, emissiveIntensity = 0 }: {
  position: V3;
  size: V3;
  color: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
}

function Leg({ x, z, h = 0.82 }: { x: number; z: number; h?: number }) {
  return <Block position={[x, h / 2, z]} size={[0.16, h, 0.16]} color="#171217" roughness={0.92} />;
}

function WoodTable({ position, width, depth, height = 0.82 }: { position: V3; width: number; depth: number; height?: number }) {
  const lx = width / 2 - 0.18;
  const lz = depth / 2 - 0.18;
  return (
    <group position={position}>
      <Block position={[0, height - 0.08, 0]} size={[width + 0.16, 0.18, depth + 0.16]} color="#171114" />
      <Block position={[0, height, 0]} size={[width, 0.14, depth]} color="#754c31" roughness={0.76} />
      <Block position={[0, height + 0.075, 0]} size={[width - 0.12, 0.035, depth - 0.12]} color="#9a633c" roughness={0.72} />
      <Leg x={-lx} z={-lz} h={height - 0.04} />
      <Leg x={lx} z={-lz} h={height - 0.04} />
      <Leg x={-lx} z={lz} h={height - 0.04} />
      <Leg x={lx} z={lz} h={height - 0.04} />
    </group>
  );
}

function Platform({ position, width, depth, height, topColor, trimColor, trimEmissive, stepSide }: {
  position: V3;
  width: number;
  depth: number;
  height: number;
  topColor: string;
  trimColor: string;
  trimEmissive: string;
  stepSide: 'north' | 'south' | 'east' | 'west';
}) {
  const trim = 0.04;
  const stepW = 0.72;
  const stepH = height * 0.5;
  const stepPos: V3 = stepSide === 'south'
    ? [0, stepH / 2, depth / 2 + stepW / 2]
    : stepSide === 'north'
      ? [0, stepH / 2, -(depth / 2 + stepW / 2)]
      : stepSide === 'east'
        ? [width / 2 + stepW / 2, stepH / 2, 0]
        : [-(width / 2 + stepW / 2), stepH / 2, 0];
  const stepSize: V3 = stepSide === 'south' || stepSide === 'north'
    ? [width * 0.55, stepH, stepW]
    : [stepW, stepH, depth * 0.55];

  return (
    <group position={position}>
      <Block position={[0, height * 0.35, 0]} size={[width + 0.12, height * 0.7, depth + 0.12]} color="#08070c" roughness={1} />
      <Block position={[0, height * 0.62, 0]} size={[width, height * 0.55, depth]} color="#171420" roughness={0.95} />
      <Block position={[0, height + 0.02, 0]} size={[width - 0.05, 0.04, depth - 0.05]} color={topColor} roughness={0.8} />
      <Block position={[0, height + 0.045, -depth / 2 + trim / 2]} size={[width - 0.06, 0.02, trim]} color={trimColor} emissive={trimEmissive} emissiveIntensity={1.8} />
      <Block position={[0, height + 0.045, depth / 2 - trim / 2]} size={[width - 0.06, 0.02, trim]} color={trimColor} emissive={trimEmissive} emissiveIntensity={1.8} />
      <Block position={[-width / 2 + trim / 2, height + 0.045, 0]} size={[trim, 0.02, depth - 0.06]} color={trimColor} emissive={trimEmissive} emissiveIntensity={1.8} />
      <Block position={[width / 2 - trim / 2, height + 0.045, 0]} size={[trim, 0.02, depth - 0.06]} color={trimColor} emissive={trimEmissive} emissiveIntensity={1.8} />
      <Block position={stepPos} size={stepSize} color="#211d29" roughness={0.95} />
    </group>
  );
}

function Sofa() {
  return (
    <group position={[-4.05, TIER_LOW + 0.04, 2.05]}>
      <Block position={[0, 0.22, 0]} size={[3.75, 0.44, 1.30]} color="#211d2b" roughness={0.94} />
      <Block position={[0, 0.50, 0.02]} size={[3.40, 0.28, 1.08]} color="#302a3c" roughness={0.90} />
      <Block position={[0, 0.90, -0.44]} size={[3.52, 0.74, 0.30]} color="#272233" roughness={0.94} />
      <Block position={[-1.76, 0.60, 0]} size={[0.28, 0.56, 1.22]} color="#25202f" />
      <Block position={[1.76, 0.60, 0]} size={[0.28, 0.56, 1.22]} color="#25202f" />
      <RoomSprite position={[0, 0.66, 0.02]} crop={C.couchCats} height={1.08} rotation={FLOOR_ROTATION} elevation={0.02} depthOffset={0.03} />
    </group>
  );
}

function ParallaxBackground() {
  const farRef = useRef<THREE.Group>(null);
  const midRef = useRef<THREE.Group>(null);
  const nearRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (farRef.current) {
      farRef.current.position.x = camera.position.x * 0.006;
      farRef.current.position.z = camera.position.z * 0.003;
    }
    if (midRef.current) {
      midRef.current.position.x = camera.position.x * 0.014;
      midRef.current.position.z = camera.position.z * 0.007;
    }
    if (nearRef.current) {
      nearRef.current.position.x = camera.position.x * 0.025;
      nearRef.current.position.z = camera.position.z * 0.012;
    }
  });

  return (
    <group>
      <group ref={farRef} position={[0, 3.5, -13]}>
        <mesh>
          <planeGeometry args={[42, 25]} />
          <meshBasicMaterial color="#02040a" />
        </mesh>
        {[-8, -4, 0, 4, 8].map(x => (
          <mesh key={x} position={[x, 2.2, -0.05]}>
            <boxGeometry args={[0.035, 14, 0.04]} />
            <meshBasicMaterial color="#0b1830" />
          </mesh>
        ))}
      </group>
      <group ref={midRef} position={[0, 2.5, -10]}>
        <mesh>
          <planeGeometry args={[34, 20]} />
          <meshBasicMaterial color="#07101e" transparent opacity={0.82} />
        </mesh>
        <mesh position={[0, 3.6, 0.05]}>
          <planeGeometry args={[26, 0.06]} />
          <meshBasicMaterial color="#21406c" transparent opacity={0.38} />
        </mesh>
      </group>
      <group ref={nearRef} position={[0, 2, -8]}>
        <mesh>
          <planeGeometry args={[27, 16]} />
          <meshBasicMaterial color="#0a1325" transparent opacity={0.28} />
        </mesh>
      </group>
    </group>
  );
}

export const Room: React.FC<RoomProps> = React.memo(({ onInteractDesk }) => {
  const { scene } = useThree();
  const interactDesk = useCallback(() => onInteractDesk(), [onInteractDesk]);

  useEffect(() => {
    const previousFog = scene.fog;
    scene.fog = new THREE.Fog('#050811', 13, 31);
    return () => {
      scene.fog = previousFog;
    };
  }, [scene]);

  return (
    <group>
      <ParallaxBackground />

      {/* FOUNDATION + FLOOR RELIEF */}
      <Block position={[0, -0.48, 0]} size={[14.8, 0.72, 12.6]} color="#05070d" roughness={0.98} />
      <Block position={[0, -0.05, 0]} size={[14.35, 0.20, 12.15]} color="#17131d" roughness={0.98} />
      <Block position={[0, 0.08, 0]} size={[14.05, 0.12, 11.85]} color="#292331" roughness={0.94} />
      {Array.from({ length: 13 }, (_, i) => (
        <mesh key={`plank-${i}`} position={[0, 0.16, -5.45 + i * 0.88]} receiveShadow>
          <boxGeometry args={[13.55, 0.045, 0.035]} />
          <meshStandardMaterial color={i % 2 ? '#45394a' : '#382f40'} roughness={0.92} />
        </mesh>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={`seam-${i}`} position={[-6 + i * 1.05, 0.175, 0]} receiveShadow>
          <boxGeometry args={[0.025, 0.025, 11.25]} />
          <meshStandardMaterial color="#1d1823" roughness={1} />
        </mesh>
      ))}

      {/* THICK FLOOR FRAME */}
      <Block position={[0, 0.25, -5.72]} size={[13.85, 0.16, 0.28]} color="#4a4051" />
      <Block position={[-6.72, 0.25, 0]} size={[0.28, 0.16, 11.55]} color="#4a4051" />
      <Block position={[6.72, 0.25, 0]} size={[0.28, 0.16, 11.55]} color="#4a4051" />
      <Block position={[0, 0.25, 5.72]} size={[13.85, 0.16, 0.28]} color="#4a4051" />
      <Block position={[0, 0.34, -5.48]} size={[12.7, 0.035, 0.045]} color="#8ab8ff" emissive="#4d8dff" emissiveIntensity={1.6} />
      <Block position={[-6.48, 0.34, 0]} size={[0.045, 0.035, 11]} color="#8ab8ff" emissive="#4d8dff" emissiveIntensity={1.6} />
      <Block position={[0, 0.34, 5.48]} size={[12.7, 0.035, 0.045]} color="#8ab8ff" emissive="#4d8dff" emissiveIntensity={1.6} />
      <Block position={[6.48, 0.34, 0]} size={[0.045, 0.035, 11]} color="#8ab8ff" emissive="#4d8dff" emissiveIntensity={1.6} />

      {/* THICK WALLS, BASEBOARDS, MOLDINGS */}
      <Block position={[0, 3.35, -6.05]} size={[14.25, 6.7, 0.28]} color="#0a1222" roughness={0.98} />
      <Block position={[-6.05, 3.35, 0]} size={[0.28, 6.7, 11.9]} color="#0e1729" roughness={0.98} />
      <Block position={[0, 0.42, -5.83]} size={[13.85, 0.30, 0.26]} color="#04060c" roughness={1} />
      <Block position={[-5.83, 0.42, 0]} size={[0.26, 0.30, 11.55]} color="#04060c" roughness={1} />
      <Block position={[0, 2.6, -5.85]} size={[13.6, 0.9, 0.06]} color="#111d34" roughness={0.9} />
      <Block position={[-5.85, 2.6, 0]} size={[0.06, 0.9, 11.3]} color="#152540" roughness={0.9} />
      <Block position={[0, 6.63, -5.88]} size={[14.45, 0.22, 0.42]} color="#060910" roughness={0.96} />
      <Block position={[-5.88, 6.63, 0]} size={[0.42, 0.22, 12.1]} color="#060910" roughness={0.96} />

      {/* WALL PROPS */}
      <RoomSprite position={[-4.55, 3.65, -5.87]} crop={C.board} height={1.65} rotation={WALL_ROTATION} depthOffset={-0.03} />
      <RoomSprite position={[-2.25, 3.72, -5.87]} crop={C.plant} height={1.40} rotation={WALL_ROTATION} depthOffset={-0.04} />
      <RoomSprite position={[0.55, 3.95, -5.87]} crop={C.window} height={1.65} rotation={WALL_ROTATION} depthOffset={-0.05} />
      <RoomSprite position={[3.25, 4.05, -5.87]} crop={C.poster} height={1.15} rotation={WALL_ROTATION} depthOffset={-0.06} />
      <RoomSprite position={[5.35, 3.25, -5.86]} crop={C.guitar} height={1.75} rotation={WALL_ROTATION} depthOffset={-0.07} />
      <RoomSprite position={[4.15, 2.95, -5.84]} crop={C.wallShelf} height={1.15} rotation={WALL_ROTATION} depthOffset={-0.08} />
      <RoomSprite position={[4.70, 1.95, -5.82]} crop={C.todo} height={0.82} rotation={WALL_ROTATION} depthOffset={-0.09} />
      <RoomSprite position={[5.65, 1.85, -5.82]} crop={C.map} height={0.90} rotation={WALL_ROTATION} depthOffset={-0.09} />

      {/* BEDROOM AREA */}
      <Platform position={[-3.55, 0, -3.15]} width={4.85} depth={3.95} height={TIER_LOW} topColor="#241a1e" trimColor="#ffb27a" trimEmissive="#ff8a3d" stepSide="south" />
      <group position={[-3.55, TIER_LOW, -3.25]}>
        <Block position={[0, 0.20, 0]} size={[4.25, 0.38, 3.55]} color="#08090f" roughness={1} />
        <Block position={[0, 0.43, 0]} size={[4.02, 0.20, 3.32]} color="#3a2527" />
        <Block position={[0, 0.56, 0]} size={[3.82, 0.06, 3.12]} color="#7c5135" />
        <Block position={[0, 1.18, -1.57]} size={[3.90, 1.25, 0.28]} color="#392528" />
        <Block position={[0, 1.78, -1.73]} size={[4.08, 0.18, 0.38]} color="#845839" />
        <RoomSprite position={[0, 0.62, 0.02]} crop={C.bed} height={2.85} rotation={FLOOR_ROTATION} elevation={0.02} depthOffset={0.08} />
        <RoomSprite position={[0.85, 1.20, -0.55]} crop={C.sleepingCats} height={0.52} rotation={FLOOR_ROTATION} elevation={0.04} depthOffset={0.09} />
      </group>

      {/* BEDSIDETABLE */}
      <group position={[-0.35, TIER_LOW, -5.02]}>
        <Block position={[0, 0.48, 0]} size={[1.05, 0.86, 0.88]} color="#2d1d1d" />
        <Block position={[0, 0.96, 0]} size={[1.18, 0.12, 0.98]} color="#795039" />
        <RoomSprite position={[0, 1.02, 0.02]} crop={C.coffee} height={0.30} rotation={FLOOR_ROTATION} elevation={0.02} />
      </group>

      {/* DESK / WORK AREA */}
      <Platform position={[2.55, 0, -4.48]} width={6.05} depth={1.95} height={TIER_HIGH} topColor="#1a1420" trimColor="#8ab8ff" trimEmissive="#4d8dff" stepSide="south" />
      <group position={[0, TIER_HIGH, 0]} onClick={interactDesk}>
        <WoodTable position={[2.55, 0, -4.48]} width={5.55} depth={1.28} height={1.05} />
        <Block position={[2.55, 0.60, -4.47]} size={[4.75, 0.86, 0.12]} color="#2a1a1a" />
        <RoomSprite position={[1.10, 1.28, -4.98]} crop={C.monitor} height={1.42} rotation={FLOOR_ROTATION} elevation={0.04} depthOffset={0.03} />
        <RoomSprite position={[3.20, 1.25, -4.98]} crop={C.sideMonitor} height={1.20} rotation={FLOOR_ROTATION} elevation={0.04} depthOffset={0.03} />
        <RoomSprite position={[4.30, 1.22, -4.72]} crop={C.deskLamp} height={1.20} rotation={FLOOR_ROTATION} elevation={0.04} depthOffset={0.04} />
        <RoomSprite position={[0.95, 1.20, -4.42]} crop={C.laptop} height={0.92} rotation={FLOOR_ROTATION} elevation={0.04} depthOffset={0.05} />
        <RoomSprite position={[1.65, 1.10, -4.02]} crop={C.keyboard} height={0.36} rotation={FLOOR_ROTATION} elevation={0.04} depthOffset={0.06} />
        <RoomSprite position={[3.12, 1.10, -4.02]} crop={C.mousePad} height={0.34} rotation={FLOOR_ROTATION} elevation={0.04} depthOffset={0.06} />
        <RoomSprite position={[3.80, 1.11, -4.00]} crop={C.mouse} height={0.30} rotation={FLOOR_ROTATION} elevation={0.04} depthOffset={0.06} />
        <RoomSprite position={[4.45, 1.10, -4.03]} crop={C.phone} height={0.28} rotation={FLOOR_ROTATION} elevation={0.04} depthOffset={0.06} />
        <RoomSprite position={[4.80, 1.16, -4.08]} crop={C.pencilCup} height={0.48} rotation={FLOOR_ROTATION} elevation={0.04} depthOffset={0.06} />
        <RoomSprite position={[2.70, 1.09, -4.03]} crop={C.camera} height={0.30} rotation={FLOOR_ROTATION} elevation={0.04} depthOffset={0.07} />
      </group>

      {/* LOUNGE AREA - SOFA IS HORIZONTAL */}
      <Platform position={[-3.75, 0, 2.35]} width={4.70} depth={3.55} height={TIER_LOW} topColor="#201a2a" trimColor="#c58cff" trimEmissive="#a855f7" stepSide="east" />
      <Sofa />

      {/* COFFEE TABLE */}
      <group position={[-1.55, TIER_LOW, 3.05]}>
        <WoodTable position={[0, 0, 0]} width={2.15} depth={1.25} height={0.62} />
        <RoomSprite position={[-0.45, 0.72, 0]} crop={C.burger} height={0.34} rotation={FLOOR_ROTATION} elevation={0.03} />
        <RoomSprite position={[0.35, 0.72, 0.02]} crop={C.pizza} height={0.32} rotation={FLOOR_ROTATION} elevation={0.03} />
        <RoomSprite position={[0.72, 0.72, -0.30]} crop={C.drink} height={0.34} rotation={FLOOR_ROTATION} elevation={0.03} />
        <RoomSprite position={[-0.65, 0.72, -0.28]} crop={C.glass} height={0.30} rotation={FLOOR_ROTATION} elevation={0.03} />
        <RoomSprite position={[0.05, 0.72, 0.30]} crop={C.bowl} height={0.32} rotation={FLOOR_ROTATION} elevation={0.03} />
      </group>

      {/* DINING / HOBBY AREA */}
      <Platform position={[2.55, 0, 2.85]} width={5.10} depth={3.55} height={TIER_MED} topColor="#171521" trimColor="#7dd3fc" trimEmissive="#38bdf8" stepSide="north" />
      <group position={[2.65, TIER_MED, 2.65]}>
        <WoodTable position={[0, 0, 0]} width={3.15} depth={1.85} height={0.82} />
        <RoomSprite position={[-0.85, 0.95, -0.25]} crop={C.globe} height={0.42} rotation={FLOOR_ROTATION} elevation={0.03} />
        <RoomSprite position={[0.05, 0.95, -0.20]} crop={C.ideas} height={0.44} rotation={FLOOR_ROTATION} elevation={0.03} />
        <RoomSprite position={[0.82, 0.96, 0.15]} crop={C.photo} height={0.40} rotation={FLOOR_ROTATION} elevation={0.03} />
      </group>

      {/* CHAIR */}
      <group position={[2.65, TIER_MED, 4.05]}>
        <Block position={[0, 0.52, 0]} size={[0.90, 0.14, 0.82]} color="#754c31" />
        <Block position={[0, 1.00, 0.32]} size={[0.90, 1.05, 0.14]} color="#5d3b2c" />
        <Leg x={-0.34} z={-0.28} h={0.48} />
        <Leg x={0.34} z={-0.28} h={0.48} />
        <Leg x={-0.34} z={0.28} h={0.48} />
        <Leg x={0.34} z={0.28} h={0.48} />
      </group>

      {/* MEDIA / STORAGE AREA */}
      <group position={[5.10, TIER_MED, 1.05]}>
        <Block position={[0, 1.25, 0]} size={[1.25, 2.50, 0.92]} color="#171421" roughness={0.94} />
        <Block position={[0, 2.42, 0]} size={[1.38, 0.16, 1.05]} color="#5f3c2d" />
        <Block position={[0, 1.55, 0.48]} size={[1.05, 0.05, 0.05]} color="#8ab8ff" emissive="#4d8dff" emissiveIntensity={1.4} />
        <RoomSprite position={[0, 1.35, -0.50]} crop={C.console} height={0.48} rotation={FLOOR_ROTATION} elevation={0.05} />
        <RoomSprite position={[-0.30, 1.72, -0.48]} crop={C.books} height={0.72} rotation={FLOOR_ROTATION} elevation={0.05} />
        <RoomSprite position={[0.34, 1.65, -0.46]} crop={C.cameraLarge} height={0.72} rotation={FLOOR_ROTATION} elevation={0.05} />
        <RoomSprite position={[0.12, 2.65, -0.12]} crop={C.plantLarge} height={0.82} rotation={FLOOR_ROTATION} elevation={0.05} />
      </group>

      {/* ENTRY STORAGE / BACKPACK */}
      <group position={[-5.15, TIER_LOW, -0.65]}>
        <Block position={[0, 0.62, 0]} size={[0.95, 1.24, 0.70]} color="#241a22" />
        <Block position={[0, 1.27, 0]} size={[1.08, 0.12, 0.82]} color="#6b4434" />
        <RoomSprite position={[0, 1.38, 0]} crop={C.backpack} height={0.68} rotation={FLOOR_ROTATION} elevation={0.04} />
      </group>
      <RoomSprite position={[-5.15, TIER_LOW + 0.04, -2.25]} crop={C.skateboard} height={1.10} rotation={[0, 0, 0]} depthOffset={0.08} />

      {/* SMALL WALL NOTES */}
      <RoomSprite position={[0.65, 4.15, -5.86]} crop={C.pinkNote} height={0.48} rotation={WALL_ROTATION} depthOffset={-0.09} />
      <RoomSprite position={[1.25, 4.05, -5.86]} crop={C.purpleNote} height={0.48} rotation={WALL_ROTATION} depthOffset={-0.09} />
      <RoomSprite position={[1.85, 4.02, -5.86]} crop={C.greenNote} height={0.45} rotation={WALL_ROTATION} depthOffset={-0.09} />

      <Player onInteractDesk={onInteractDesk} initialPosition={[0, FLOOR_TOP, 0.85]} />
    </group>
  );
});

Room.displayName = 'Room';
