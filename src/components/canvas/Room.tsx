import React, { useCallback } from 'react';
import { Player } from './Player';
import { RoomSprite } from './RoomProps';

interface RoomProps {
  onInteractDesk: () => void;
}

type V3 = [number, number, number];

const FLOOR_ROTATION: V3 = [-Math.PI / 2, 0, 0];
const WALL_ROTATION: V3 = [0, 0, 0];
const LEFT_WALL_ROTATION: V3 = [0, Math.PI / 2, 0];
const FRONT_WALL_ROTATION: V3 = [0, Math.PI, 0];

const FLOOR_Y = 0.05;
const UPPER_DECK_Y = 0.52;
const UPPER_DECK_HEIGHT = 0.48;
const STEP_HEIGHT = UPPER_DECK_Y / 4;

/** Exact crops from /public/assets/Rooms/room-props.png (1536x1024). */
const C = {
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
  vase: { x: 1080, y: 697, width: 90, height: 105 },
  ideas: { x: 1141, y: 697, width: 123, height: 100 },
  photo: { x: 1265, y: 713, width: 149, height: 86 },
  console: { x: 1112, y: 809, width: 123, height: 67 },
  cameraLarge: { x: 1265, y: 787, width: 96, height: 145 },
  books: { x: 1350, y: 787, width: 80, height: 145 },
  plantLarge: { x: 1409, y: 697, width: 122, height: 168 },
} as const;

function Block({
  position,
  size,
  color,
  roughness = 0.86,
  metalness = 0,
  emissive,
  emissiveIntensity = 0,
}: {
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
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} emissive={emissive} emissiveIntensity={emissiveIntensity} />
    </mesh>
  );
}

function Leg({ x, z, height = 0.82 }: { x: number; z: number; height?: number }) {
  return <Block position={[x, height / 2, z]} size={[0.16, height, 0.16]} color="#1c1518" roughness={0.92} />;
}

function WoodTable({ position, width, depth, height = 0.82 }: { position: V3; width: number; depth: number; height?: number }) {
  const legX = width / 2 - 0.18;
  const legZ = depth / 2 - 0.18;
  return (
    <group position={position}>
      <Block position={[0, height - 0.09, 0]} size={[width + 0.18, 0.18, depth + 0.18]} color="#171114" />
      <Block position={[0, height, 0]} size={[width, 0.16, depth]} color="#754c31" roughness={0.76} />
      <Block position={[0, height + 0.09, 0]} size={[width - 0.12, 0.04, depth - 0.12]} color="#a56d42" roughness={0.70} />
      <Block position={[0, height - 0.42, 0]} size={[width - 0.18, 0.08, 0.10]} color="#3a241a" roughness={0.90} />
      <Leg x={-legX} z={-legZ} height={height - 0.04} />
      <Leg x={legX} z={-legZ} height={height - 0.04} />
      <Leg x={-legX} z={legZ} height={height - 0.04} />
      <Leg x={legX} z={legZ} height={height - 0.04} />
    </group>
  );
}

function Rug({ position, width, depth, color = '#25243b' }: { position: V3; width: number; depth: number; color?: string }) {
  return (
    <group position={position}>
      <Block position={[0, 0.026, 0]} size={[width + 0.20, 0.07, depth + 0.20]} color="#0f0e15" roughness={1} />
      <Block position={[0, 0.065, 0]} size={[width, 0.035, depth]} color={color} roughness={1} />
      <Block position={[0, 0.087, -depth / 2 + 0.045]} size={[width - 0.10, 0.025, 0.06]} color="#6a5877" />
      <Block position={[0, 0.087, depth / 2 - 0.045]} size={[width - 0.10, 0.025, 0.06]} color="#6a5877" />
      <Block position={[-width / 2 + 0.045, 0.087, 0]} size={[0.06, 0.025, depth - 0.10]} color="#6a5877" />
      <Block position={[width / 2 - 0.045, 0.087, 0]} size={[0.06, 0.025, depth - 0.10]} color="#6a5877" />
    </group>
  );
}

function Platform({ position, width, depth, height, color, glow = '#4d8dff' }: { position: V3; width: number; depth: number; height: number; color: string; glow?: string }) {
  return (
    <group position={position}>
      <Block position={[0, height * 0.45, 0]} size={[width + 0.22, height * 0.90, depth + 0.22]} color="#08070c" roughness={1} />
      <Block position={[0, height * 0.78, 0]} size={[width, height * 0.68, depth]} color="#17141e" roughness={0.96} />
      <Block position={[0, height + 0.025, 0]} size={[width - 0.07, 0.05, depth - 0.07]} color={color} roughness={0.82} />
      <Block position={[0, height + 0.058, -depth / 2 + 0.03]} size={[width - 0.07, 0.025, 0.05]} color="#8ab8ff" emissive={glow} emissiveIntensity={1.2} />
      <Block position={[0, height + 0.058, depth / 2 - 0.03]} size={[width - 0.07, 0.025, 0.05]} color="#8ab8ff" emissive={glow} emissiveIntensity={1.2} />
    </group>
  );
}

function Staircase({ position, width = 2.55, steps = 4 }: { position: V3; width?: number; steps?: number }) {
  return (
    <group position={position}>
      {Array.from({ length: steps }, (_, index) => {
        const level = steps - index;
        const height = STEP_HEIGHT * level;
        const z = index * 0.62;
        return (
          <group key={`stair-${index}`} position={[0, 0, z]}>
            <Block position={[0, height / 2, 0]} size={[width, height, 0.72]} color="#2b2733" roughness={0.94} />
            <Block position={[0, height + 0.025, 0]} size={[width - 0.06, 0.05, 0.65]} color="#443b4d" roughness={0.86} />
            <Block position={[0, height + 0.06, -0.31]} size={[width - 0.08, 0.025, 0.05]} color="#8ab8ff" emissive="#4d8dff" emissiveIntensity={1.15} />
          </group>
        );
      })}
    </group>
  );
}

function WindowFrame({ position, width = 2.25, height = 2.05, rotation = WALL_ROTATION }: { position: V3; width?: number; height?: number; rotation?: V3 }) {
  return (
    <group position={position} rotation={rotation}>
      <Block position={[0, 0, 0]} size={[width + 0.28, height + 0.28, 0.14]} color="#20171c" roughness={0.8} />
      <Block position={[0, 0, 0.08]} size={[width, height, 0.035]} color="#111a2b" roughness={0.35} metalness={0.05} />
      <Block position={[0, -height / 2 + 0.08, 0.12]} size={[width + 0.10, 0.12, 0.10]} color="#6f4931" roughness={0.78} />
      <Block position={[-width / 2 - 0.05, 0, 0.11]} size={[0.10, height, 0.10]} color="#5f4030" roughness={0.8} />
      <Block position={[width / 2 + 0.05, 0, 0.11]} size={[0.10, height, 0.10]} color="#5f4030" roughness={0.8} />
      <Block position={[0, 0, 0.12]} size={[0.06, height, 0.03]} color="#405170" />
      <Block position={[0, 0, 0.12]} size={[width, 0.06, 0.03]} color="#405170" />
    </group>
  );
}

function SofaHorizontal({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <Block position={[0, 0.20, 0]} size={[4.05, 0.30, 1.62]} color="#111019" roughness={0.98} />
      <Block position={[0, 0.58, 0.08]} size={[3.85, 0.55, 1.46]} color="#242332" roughness={0.97} />
      <Block position={[0, 1.12, -0.50]} size={[3.88, 0.78, 0.42]} color="#302d41" roughness={0.96} />
      <Block position={[-1.88, 0.67, 0.02]} size={[0.24, 1.16, 1.66]} color="#16151f" />
      <Block position={[1.88, 0.67, 0.02]} size={[0.24, 1.16, 1.66]} color="#16151f" />
      <Block position={[-0.95, 0.85, 0.18]} size={[1.55, 0.18, 0.76]} color="#343247" roughness={0.98} />
      <Block position={[0.95, 0.85, 0.18]} size={[1.55, 0.18, 0.76]} color="#343247" roughness={0.98} />
      <Block position={[0, 0.08, 0]} size={[3.92, 0.12, 1.70]} color="#0b0a10" />
      <RoomSprite position={[0, 1.33, -0.67]} crop={C.couchCats} height={1.18} />
    </group>
  );
}

function DiningChair({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Block position={[0, 0.55, 0]} size={[0.92, 0.16, 0.88]} color="#5a3a28" roughness={0.78} />
      <Block position={[0, 1.04, -0.32]} size={[0.88, 1.05, 0.16]} color="#2c2223" roughness={0.92} />
      <Leg x={-0.32} z={-0.30} height={0.50} />
      <Leg x={0.32} z={-0.30} height={0.50} />
      <Leg x={-0.32} z={0.30} height={0.50} />
      <Leg x={0.32} z={0.30} height={0.50} />
    </group>
  );
}

function WallShelfUnit({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <Block position={[0, 0.06, 0]} size={[5.20, 0.16, 0.26]} color="#3c281f" roughness={0.78} />
      <Block position={[0, 0.84, 0]} size={[5.20, 0.12, 0.24]} color="#573827" roughness={0.78} />
      <Block position={[0, 1.62, 0]} size={[5.20, 0.12, 0.24]} color="#573827" roughness={0.78} />
      <Block position={[0, 2.18, 0.03]} size={[5.40, 0.16, 0.30]} color="#241a1a" roughness={0.90} />
      <RoomSprite position={[-2.05, 0.34, -0.18]} crop={C.books} height={0.52} />
      <RoomSprite position={[-0.95, 0.34, -0.18]} crop={C.console} height={0.40} />
      <RoomSprite position={[0.18, 0.34, -0.18]} crop={C.photo} height={0.44} />
      <RoomSprite position={[1.30, 0.34, -0.18]} crop={C.cameraLarge} height={0.60} />
      <RoomSprite position={[2.25, 1.11, -0.18]} crop={C.books} height={0.48} />
      <RoomSprite position={[-1.72, 1.12, -0.18]} crop={C.console} height={0.34} />
      <RoomSprite position={[0.55, 1.12, -0.18]} crop={C.vase} height={0.40} />
      <RoomSprite position={[2.05, 1.12, -0.18]} crop={C.plantLarge} height={0.62} />
      <RoomSprite position={[0.0, 1.97, -0.18]} crop={C.plantLarge} height={0.72} />
    </group>
  );
}

function WallPanel({ position, width = 2.2, height = 2.8, rotation = WALL_ROTATION }: { position: V3; width?: number; height?: number; rotation?: V3 }) {
  return (
    <group position={position} rotation={rotation}>
      <Block position={[0, 0, 0]} size={[width, height, 0.08]} color="#0c1425" roughness={0.98} />
      <Block position={[0, -height / 2 + 0.06, 0.07]} size={[width + 0.08, 0.10, 0.10]} color="#2c3d5b" />
      <Block position={[0, height / 2 - 0.06, 0.07]} size={[width + 0.08, 0.10, 0.10]} color="#1a2a45" />
      <Block position={[-width / 2 + 0.06, 0, 0.07]} size={[0.10, height, 0.10]} color="#1a2a45" />
      <Block position={[width / 2 - 0.06, 0, 0.07]} size={[0.10, height, 0.10]} color="#1a2a45" />
    </group>
  );
}

export const Room: React.FC<RoomProps> = React.memo(({ onInteractDesk }) => {
  const interactDesk = useCallback(() => onInteractDesk(), [onInteractDesk]);

  return (
    <group>
      {/* ==========================================================
          ROOM FOUNDATION / LOWER FLOOR
      ========================================================== */}
      <Block position={[0, -0.42, 0]} size={[18.70, 0.78, 16.20]} color="#05070d" roughness={0.99} />
      <Block position={[0, -0.04, 0]} size={[18.30, 0.18, 15.80]} color="#141119" roughness={0.99} />
      <Block position={[0, 0.07, 0]} size={[18.00, 0.08, 15.50]} color="#2c2731" roughness={0.96} />

      {Array.from({ length: 17 }, (_, index) => (
        <mesh key={`floor-plank-${index}`} position={[0, 0.12, -7.05 + index * 0.88]} receiveShadow>
          <boxGeometry args={[17.45, 0.045, 0.035]} />
          <meshStandardMaterial color={index % 2 === 0 ? '#403643' : '#493d4b'} roughness={0.93} />
        </mesh>
      ))}
      {Array.from({ length: 17 }, (_, index) => (
        <mesh key={`floor-seam-${index}`} position={[-7.5 + index * 0.92, 0.145, 0]} receiveShadow>
          <boxGeometry args={[0.028, 0.023, 15.10]} />
          <meshStandardMaterial color="#201b24" roughness={1} />
        </mesh>
      ))}

      <Block position={[0, 0.22, -7.52]} size={[17.70, 0.16, 0.30]} color="#4b4250" />
      <Block position={[-8.60, 0.22, 0]} size={[0.30, 0.16, 15.0]} color="#4b4250" />
      <Block position={[8.60, 0.22, 0]} size={[0.30, 0.16, 15.0]} color="#4b4250" />
      <Block position={[0, 0.22, 7.52]} size={[17.70, 0.16, 0.30]} color="#4b4250" />
      <Block position={[0, 0.30, 7.17]} size={[16.80, 0.035, 0.045]} color="#8ab8ff" emissive="#4d8dff" emissiveIntensity={1.4} />
      <Block position={[-8.17, 0.30, 0]} size={[0.045, 0.035, 14.55]} color="#8ab8ff" emissive="#4d8dff" emissiveIntensity={1.3} />
      <Block position={[8.17, 0.30, 0]} size={[0.045, 0.035, 14.55]} color="#8ab8ff" emissive="#4d8dff" emissiveIntensity={1.3} />

      {/* ==========================================================
          UPPER FLOOR / BED + OFFICE LEVEL
      ========================================================== */}
      <Platform position={[0, 0, -3.20]} width={16.55} depth={7.20} height={UPPER_DECK_HEIGHT} color="#201a25" glow="#4d8dff" />
      <Block position={[-5.45, 0.31, 0.43]} size={[5.90, 0.34, 0.22]} color="#16121a" roughness={0.98} />
      <Block position={[5.45, 0.31, 0.43]} size={[5.90, 0.34, 0.22]} color="#16121a" roughness={0.98} />
      <Block position={[-5.45, 0.52, 0.47]} size={[5.90, 0.05, 0.06]} color="#a4c8ff" emissive="#4d8dff" emissiveIntensity={1.3} />
      <Block position={[5.45, 0.52, 0.47]} size={[5.90, 0.05, 0.06]} color="#a4c8ff" emissive="#4d8dff" emissiveIntensity={1.3} />
      <Staircase position={[0, 0, 0.55]} width={2.55} steps={4} />

      {/* ==========================================================
          WALLS / RELIEF / FRONT FEATURE WALL
      ========================================================== */}
      <Block position={[0, 3.55, -7.76]} size={[17.70, 7.10, 0.30]} color="#0a1222" roughness={0.98} />
      <Block position={[-8.08, 3.55, 0]} size={[0.30, 7.10, 15.50]} color="#0e1729" roughness={0.98} />
      <Block position={[2.90, 1.45, 7.30]} size={[10.10, 2.80, 0.25]} color="#0a101c" roughness={0.98} />
      <Block position={[2.90, 0.56, 7.13]} size={[10.30, 0.30, 0.30]} color="#04060c" roughness={1} />
      <Block position={[2.90, 2.80, 7.12]} size={[10.30, 0.18, 0.30]} color="#18243a" roughness={0.95} />
      <Block position={[0, 0.48, -7.53]} size={[17.20, 0.34, 0.26]} color="#04060c" roughness={1} />
      <Block position={[0, 2.55, -7.48]} size={[16.95, 0.85, 0.06]} color="#111d34" roughness={0.92} />
      <Block position={[0, 6.85, -7.52]} size={[17.80, 0.24, 0.44]} color="#060910" roughness={0.96} />
      <Block position={[-7.52, 0.48, 0]} size={[0.26, 0.34, 15.10]} color="#04060c" roughness={1} />
      <Block position={[-7.48, 2.55, 0]} size={[0.06, 0.85, 14.65]} color="#152540" roughness={0.92} />
      <Block position={[-7.52, 6.85, 0]} size={[0.44, 0.24, 15.60]} color="#060910" roughness={0.96} />

      {[-6.0, -2.0, 2.0, 6.0].map((x) => (
        <Block key={`back-pilaster-${x}`} position={[x, 3.55, -7.54]} size={[0.055, 6.05, 0.06]} color="#243650" roughness={0.88} />
      ))}
      {[-5.0, -1.2, 2.6, 6.0].map((z) => (
        <Block key={`left-pilaster-${z}`} position={[-7.54, 3.55, z]} size={[0.06, 6.05, 0.055]} color="#21324e" roughness={0.88} />
      ))}

      {/* ==========================================================
          WINDOWS WITH DEEP FRAMES
      ========================================================== */}
      <WindowFrame position={[-4.60, 4.20, -7.42]} width={2.35} height={2.20} />
      <WindowFrame position={[1.45, 4.15, -7.42]} width={2.55} height={2.30} />
      <WindowFrame position={[-7.42, 4.05, -1.05]} width={2.20} height={2.15} rotation={LEFT_WALL_ROTATION} />
      <WindowFrame position={[-7.42, 3.72, 4.00]} width={1.95} height={1.95} rotation={LEFT_WALL_ROTATION} />
      <RoomSprite position={[-4.60, 4.20, -7.25]} crop={C.window} height={1.90} rotation={WALL_ROTATION} depthOffset={0.02} castShadow={false} />
      <RoomSprite position={[1.45, 4.15, -7.25]} crop={C.window} height={1.98} rotation={WALL_ROTATION} depthOffset={0.02} castShadow={false} />
      <RoomSprite position={[-7.25, 4.05, -1.05]} crop={C.window} height={1.86} rotation={LEFT_WALL_ROTATION} depthOffset={0.02} castShadow={false} />
      <RoomSprite position={[-7.25, 3.72, 4.00]} crop={C.window} height={1.72} rotation={LEFT_WALL_ROTATION} depthOffset={0.02} castShadow={false} />

      {/* ==========================================================
          BEDROOM: RUG + BED + NIGHTSTAND
      ========================================================== */
      <Rug position={[-4.45, UPPER_DECK_Y + 0.035, -3.85]} width={5.30} depth={4.35} color="#27233c" />
      <group position={[-4.45, UPPER_DECK_Y, -3.92]}>
        <Block position={[0, 0.19, 0]} size={[4.40, 0.34, 3.50]} color="#08090f" roughness={1} />
        <Block position={[0, 0.41, 0]} size={[4.14, 0.20, 3.28]} color="#3b2730" roughness={0.90} />
        <Block position={[0, 0.55, 0]} size={[3.95, 0.08, 3.10]} color="#795039" roughness={0.76} />
        <Block position={[0, 1.16, -1.52]} size={[4.04, 1.30, 0.30]} color="#3c292b" roughness={0.90} />
        <Block position={[0, 1.83, -1.66]} size={[4.22, 0.18, 0.38]} color="#855a3d" roughness={0.73} />
        <Block position={[0, 1.66, -1.83]} size={[3.82, 0.04, 0.035]} color="#c17f4d" roughness={0.71} />
        <RoomSprite position={[0, 0.64, 0.03]} crop={C.bed} height={2.92} rotation={FLOOR_ROTATION} depthOffset={0.08} />
      </group>
      <group position={[-0.95, UPPER_DECK_Y, -5.52]}>
        <Block position={[0, 0.42, 0]} size={[0.95, 0.78, 0.82]} color="#2c1d20" roughness={0.92} />
        <Block position={[0, 0.85, 0]} size={[1.06, 0.12, 0.90]} color="#7a5138" roughness={0.76} />
        <RoomSprite position={[0, 0.94, 0.01]} crop={C.coffee} height={0.30} rotation={FLOOR_ROTATION} elevation={0.01} />
        <RoomSprite position={[0, 1.27, -0.01]} crop={C.plantLarge} height={0.42} />
      </group>

      {/* Bed zone props */}
      <RoomSprite position={[-6.55, UPPER_DECK_Y + 0.08, -4.65]} crop={C.backpack} height={0.88} />
      <RoomSprite position={[-6.65, UPPER_DECK_Y + 0.08, -3.05]} crop={C.skateboard} height={1.72} depthOffset={0.02} />
      <WallPanel position={[-4.45, 4.35, -7.47]} width={3.50} height={2.70} />
      <RoomSprite position={[-4.45, 4.35, -7.28]} crop={C.board} height={1.60} depthOffset={0.04} />
      <RoomSprite position={[-5.45, 4.98, -7.26]} crop={C.poster} height={0.82} depthOffset={0.04} />
      <RoomSprite position={[-3.22, 4.93, -7.26]} crop={C.cityPrint} height={0.68} depthOffset={0.04} />

      {/* ==========================================================
          OFFICE: DESK + TECH + CHAIR
      ========================================================== */}
      <group position={[3.25, UPPER_DECK_Y, -4.90]} onClick={interactDesk}>
        <WoodTable position={[0, 0, 0]} width={6.15} depth={1.30} height={1.08} />
        <Block position={[0, 0.55, 0.55]} size={[5.45, 0.92, 0.12]} color="#2a1a1a" roughness={0.92} />
        <Block position={[0, 0.92, 0.58]} size={[5.15, 0.045, 0.05]} color="#a2643f" roughness={0.70} />
        <RoomSprite position={[-2.05, 1.33, 0.02]} crop={C.laptop} height={1.02} depthOffset={0.04} />
        <RoomSprite position={[0.05, 1.46, 0.04]} crop={C.monitor} height={1.40} depthOffset={0.05} />
        <RoomSprite position={[1.65, 1.36, 0.04]} crop={C.sideMonitor} height={1.24} depthOffset={0.05} />
        <RoomSprite position={[-0.75, 1.09, -0.48]} crop={C.keyboard} height={0.36} rotation={FLOOR_ROTATION} elevation={0.03} />
        <RoomSprite position={[0.78, 1.09, -0.47]} crop={C.mousePad} height={0.30} rotation={FLOOR_ROTATION} elevation={0.03} />
        <RoomSprite position={[1.42, 1.09, -0.46]} crop={C.mouse} height={0.22} rotation={FLOOR_ROTATION} elevation={0.03} />
        <RoomSprite position={[2.10, 1.12, -0.44]} crop={C.phone} height={0.28} rotation={FLOOR_ROTATION} elevation={0.03} />
        <RoomSprite position={[2.42, 1.18, -0.43]} crop={C.camera} height={0.24} rotation={FLOOR_ROTATION} elevation={0.03} />
        <RoomSprite position={[-2.75, 1.13, -0.44]} crop={C.pencilCup} height={0.38} elevation={0.04} />
        <RoomSprite position={[2.80, 1.48, -0.05]} crop={C.deskLamp} height={1.05} depthOffset={0.04} />
      </group>
      <group position={[3.25, UPPER_DECK_Y, -3.10]}>
        <Block position={[0, 0.56, 0]} size={[1.28, 0.18, 1.12]} color="#241f2c" roughness={0.93} />
        <Block position={[0, 1.18, 0.40]} size={[1.16, 1.30, 0.20]} color="#302a3b" roughness={0.95} />
        <Block position={[-0.56, 0.82, 0]} size={[0.12, 0.44, 0.84]} color="#17151e" />
        <Block position={[0.56, 0.82, 0]} size={[0.12, 0.44, 0.84]} color="#17151e" />
        <Leg x={-0.45} z={-0.38} height={0.46} /><Leg x={0.45} z={-0.38} height={0.46} /><Leg x={-0.45} z={0.38} height={0.46} /><Leg x={0.45} z={0.38} height={0.46} />
        <Block position={[0, 0.37, 0]} size={[0.12, 0.40, 0.12]} color="#16141b" metalness={0.35} roughness={0.42} />
      </group>

      <WallPanel position={[3.65, 4.33, -7.47]} width={5.10} height={2.85} />
      <RoomSprite position={[3.65, 4.32, -7.28]} crop={C.todo} height={0.90} depthOffset={0.04} />
      <RoomSprite position={[5.30, 4.78, -7.27]} crop={C.guitar} height={1.65} depthOffset={0.045} />
      <RoomSprite position={[2.40, 4.78, -7.27]} crop={C.pinkNote} height={0.48} depthOffset={0.04} />
      <RoomSprite position={[3.15, 4.78, -7.27]} crop={C.purpleNote} height={0.47} depthOffset={0.04} />
      <RoomSprite position={[3.90, 4.76, -7.27]} crop={C.greenNote} height={0.46} depthOffset={0.04} />
      <RoomSprite position={[5.82, 3.55, -7.27]} crop={C.map} height={0.86} depthOffset={0.045} />

      {/* ==========================================================
          LOWER-LEFT LOUNGE: SOFA AT CORNER
      ========================================================== */}
      <Rug position={[-5.25, FLOOR_Y + 0.055, 4.25]} width={5.55} depth={4.55} color="#29253a" />
      <SofaHorizontal position={[-5.25, FLOOR_Y, 4.30]} />
      <RoomSprite position={[-5.25, 0.18, 4.22]} crop={C.couchCats} height={0.90} rotation={FLOOR_ROTATION} elevation={0.16} />

      <WoodTable position={[-1.95, FLOOR_Y, 4.28]} width={2.45} depth={1.50} height={0.78} />
      <RoomSprite position={[-2.60, 0.89, 4.20]} crop={C.burger} height={0.28} rotation={FLOOR_ROTATION} elevation={0.03} />
      <RoomSprite position={[-2.00, 0.89, 4.20]} crop={C.pizza} height={0.27} rotation={FLOOR_ROTATION} elevation={0.03} />
      <RoomSprite position={[-1.43, 0.89, 4.15]} crop={C.bowl} height={0.28} rotation={FLOOR_ROTATION} elevation={0.03} />
      <RoomSprite position={[-2.45, 0.90, 4.76]} crop={C.drink} height={0.30} rotation={FLOOR_ROTATION} elevation={0.03} />
      <RoomSprite position={[-1.88, 0.90, 4.76]} crop={C.glass} height={0.28} rotation={FLOOR_ROTATION} elevation={0.03} />

      {/* ==========================================================
          CENTRAL STAIRS / CIRCULATION
      ========================================================== */}
      <Block position={[-1.78, 0.24, 0.82]} size={[0.10, 0.40, 1.95]} color="#342e39" />
      <Block position={[1.78, 0.24, 0.82]} size={[0.10, 0.40, 1.95]} color="#342e39" />
      <Block position={[0, 0.18, 2.35]} size={[3.35, 0.10, 0.10]} color="#65576c" />

      {/* ==========================================================
          LOWER-RIGHT DINING: TABLE + 4 CHAIRS + PROPS
      ========================================================== */
      <Rug position={[4.55, FLOOR_Y + 0.055, 4.30]} width={5.55} depth={4.70} color="#302a3c" />
      <group>
        <WoodTable position={[4.55, FLOOR_Y, 4.30]} width={3.45} depth={2.10} height={0.86} />
        <DiningChair position={[2.45, FLOOR_Y, 4.30]} rotation={Math.PI / 2} />
        <DiningChair position={[6.65, FLOOR_Y, 4.30]} rotation={-Math.PI / 2} />
        <DiningChair position={[4.55, FLOOR_Y, 2.65]} rotation={Math.PI} />
        <DiningChair position={[4.55, FLOOR_Y, 5.95]} rotation={0} />
        <RoomSprite position={[3.62, 0.98, 4.15]} crop={C.pizza} height={0.30} rotation={FLOOR_ROTATION} elevation={0.04} />
        <RoomSprite position={[4.38, 0.98, 4.14]} crop={C.burger} height={0.28} rotation={FLOOR_ROTATION} elevation={0.04} />
        <RoomSprite position={[5.20, 0.98, 4.10]} crop={C.bowl} height={0.28} rotation={FLOOR_ROTATION} elevation={0.04} />
        <RoomSprite position={[4.00, 0.99, 4.78]} crop={C.drink} height={0.30} rotation={FLOOR_ROTATION} elevation={0.04} />
        <RoomSprite position={[4.80, 0.99, 4.78]} crop={C.glass} height={0.29} rotation={FLOOR_ROTATION} elevation={0.04} />
        <RoomSprite position={[5.46, 1.00, 3.98]} crop={C.coffee} height={0.30} rotation={FLOOR_ROTATION} elevation={0.04} />
        <RoomSprite position={[3.90, 1.02, 3.55]} crop={C.cameraLarge} height={0.38} rotation={FLOOR_ROTATION} elevation={0.04} />
        <RoomSprite position={[5.18, 1.02, 4.68]} crop={C.console} height={0.25} rotation={FLOOR_ROTATION} elevation={0.04} />
      </group>

      <group position={[4.55, 3.30, 4.30]}>
        <Block position={[0, 0.60, 0]} size={[0.05, 1.20, 0.05]} color="#27232c" />
        <Block position={[0, 0.02, 0]} size={[0.60, 0.14, 0.60]} color="#2a2221" />
        <pointLight position={[0, -0.10, 0]} intensity={1.10} color="#f7c27e" distance={4.2} decay={2} />
      </group>

      {/* ==========================================================
          FRONT/BOTTOM WALL SHELF — attached to wall
      ========================================================== */}
      <WallShelfUnit position={[4.65, 0.62, 7.08]} />
      <RoomSprite position={[2.70, 2.24, 6.91]} crop={C.ideas} height={0.60} rotation={FRONT_WALL_ROTATION} depthOffset={0.03} />
      <RoomSprite position={[5.15, 2.25, 6.91]} crop={C.photo} height={0.56} rotation={FRONT_WALL_ROTATION} depthOffset={0.03} />
      <RoomSprite position={[7.05, 2.18, 6.91]} crop={C.map} height={0.68} rotation={FRONT_WALL_ROTATION} depthOffset={0.03} />

      {/* ==========================================================
          LEFT WALL DECORATION / PERSONAL ITEMS
      ========================================================== */}
      <RoomSprite position={[-7.28, 5.15, -5.25]} crop={C.board} height={1.36} rotation={LEFT_WALL_ROTATION} depthOffset={0.04} />
      <RoomSprite position={[-7.27, 5.05, 0.20]} crop={C.poster} height={1.14} rotation={LEFT_WALL_ROTATION} depthOffset={0.04} />
      <RoomSprite position={[-7.26, 3.68, 1.80]} crop={C.cityPrint} height={0.66} rotation={LEFT_WALL_ROTATION} depthOffset={0.04} />
      <RoomSprite position={[-7.26, 2.62, 3.05]} crop={C.pinkNote} height={0.48} rotation={LEFT_WALL_ROTATION} depthOffset={0.04} />
      <RoomSprite position={[-7.26, 2.62, 4.10]} crop={C.greenNote} height={0.46} rotation={LEFT_WALL_ROTATION} depthOffset={0.04} />
      <RoomSprite position={[-7.00, 5.70, 5.75]} crop={C.plant} height={1.22} rotation={LEFT_WALL_ROTATION} depthOffset={0.045} />
      <RoomSprite position={[0.10, 5.78, -7.28]} crop={C.plant} height={1.18} depthOffset={0.04} />

      {/* ==========================================================
          LIGHTING BY ROOM AREA
      ========================================================== */
      <pointLight position={[-4.55, 2.55, -6.75]} intensity={0.72} color="#ffad62" distance={4.0} decay={2} />
      <pointLight position={[3.25, 2.55, -6.70]} intensity={1.05} color="#38bdf8" distance={4.5} decay={2} />
      <pointLight position={[-5.85, 2.05, 4.30]} intensity={0.62} color="#a855f7" distance={3.8} decay={2} />
      <pointLight position={[6.35, 2.15, 5.90]} intensity={0.58} color="#f5a63c" distance={3.6} decay={2} />

      <Player
        onInteractDesk={onInteractDesk}
        initialPosition={[0, FLOOR_Y, 1.55]}
        deskPosition={[3.25, -4.90]}
        speed={2.55}
      />
    </group>
  );
});

Room.displayName = 'Room';
