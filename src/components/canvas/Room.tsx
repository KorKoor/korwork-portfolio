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

/** Atlas coordinates for /public/assets/Rooms/room-props.png (1536x1024). */
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
  y = 0,
  roughness = 0.86,
  metalness = 0,
  emissive,
  emissiveIntensity = 0,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  y?: number;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
}) {
  return (
    <mesh position={[position[0], position[1] + y, position[2]]} castShadow receiveShadow>
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
  return <Block position={[x, h / 2, z]} size={[0.16, h, 0.16]} color="#1c1518" roughness={0.92} />;
}

function WoodTable({ position, width, depth, height = 0.82 }: {
  position: [number, number, number];
  width: number;
  depth: number;
  height?: number;
}) {
  const [x, , z] = position;
  return (
    <group position={position}>
      <Block position={[0, height - 0.08, 0]} size={[width + 0.16, 0.18, depth + 0.16]} color="#171114" />
      <Block position={[0, height, 0]} size={[width, 0.14, depth]} color="#754c31" roughness={0.76} />
      <Block position={[0, height + 0.075, 0]} size={[width - 0.12, 0.035, depth - 0.12]} color="#9a633c" roughness={0.72} />
      <Leg x={x - width / 2 + 0.18} z={z - depth / 2 + 0.18} h={height - 0.04} />
      <Leg x={x + width / 2 - 0.18} z={z - depth / 2 + 0.18} h={height - 0.04} />
      <Leg x={x - width / 2 + 0.18} z={z + depth / 2 - 0.18} h={height - 0.04} />
      <Leg x={x + width / 2 - 0.18} z={z + depth / 2 - 0.18} h={height - 0.04} />
    </group>
  );
}

export const Room: React.FC<RoomProps> = React.memo(({ onInteractDesk }) => {
  const interactDesk = useCallback(() => onInteractDesk(), [onInteractDesk]);

  return (
    <group>
      {/* ============================================================
          ARCHITECTURE / FLOOR RELIEF
          The room is deliberately larger and built in layers so the
          camera reads actual height instead of a single flat plane.
      ============================================================ */}
      <Block position={[0, -0.48, 0]} size={[14.8, 0.72, 12.6]} color="#05070d" roughness={0.98} />
      <Block position={[0, -0.05, 0]} size={[14.35, 0.20, 12.15]} color="#17131d" roughness={0.98} />
      <Block position={[0, 0.08, 0]} size={[14.05, 0.12, 11.85]} color="#292331" roughness={0.94} />

      {/* Floor planks */}
      {Array.from({ length: 13 }, (_, i) => (
        <mesh key={`plank-${i}`} position={[0, 0.16, -5.45 + i * 0.88]} receiveShadow>
          <boxGeometry args={[13.55, 0.045, 0.035]} />
          <meshStandardMaterial color={i % 2 ? '#45394a' : '#382f40'} roughness={0.92} />
        </mesh>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={`seam-${i}`} position={[-6.0 + i * 1.05, 0.175, 0]} receiveShadow>
          <boxGeometry args={[0.025, 0.025, 11.25]} />
          <meshStandardMaterial color="#1d1823" roughness={1} />
        </mesh>
      ))}

      {/* Raised perimeter / step */}
      <Block position={[0, 0.25, -5.72]} size={[13.85, 0.16, 0.28]} color="#4a4051" />
      <Block position={[-6.72, 0.25, 0]} size={[0.28, 0.16, 11.55]} color="#4a4051" />
      <Block position={[6.72, 0.25, 0]} size={[0.28, 0.16, 11.55]} color="#4a4051" />
      <Block position={[0, 0.25, 5.72]} size={[13.85, 0.16, 0.28]} color="#4a4051" />

      {/* Main rug, raised in three layers */}
      <Block position={[-0.35, 0.30, 1.10]} size={[10.55, 0.18, 6.55]} color="#0f0e15" roughness={1} />
      <Block position={[-0.35, 0.41, 1.10]} size={[10.22, 0.06, 6.22]} color="#2a2533" roughness={1} />
      <Block position={[-0.35, 0.46, 1.10]} size={[9.98, 0.025, 5.98]} color="#3a3244" roughness={1} />
      <Block position={[-0.35, 0.49, 1.10]} size={[9.62, 0.018, 5.62]} color="#25202e" roughness={1} />

      {/* Neon recessed trim */}
      <Block position={[0, 0.34, -5.48]} size={[12.7, 0.035, 0.045]} color="#8ab8ff" emissive="#4d8dff" emissiveIntensity={2.2} />
      <Block position={[-6.48, 0.34, 0]} size={[0.045, 0.035, 11.0]} color="#8ab8ff" emissive="#4d8dff" emissiveIntensity={2.2} />
      <Block position={[0, 0.34, 5.48]} size={[12.7, 0.035, 0.045]} color="#8ab8ff" emissive="#4d8dff" emissiveIntensity={2.2} />
      <Block position={[6.48, 0.34, 0]} size={[0.045, 0.035, 11.0]} color="#8ab8ff" emissive="#4d8dff" emissiveIntensity={2.2} />

      {/* ============================================================ WALLS — thick shells + skirting + crown trim
      ============================================================ */}
      <Block position={[0, 3.35, -6.05]} size={[14.25, 6.7, 0.28]} color="#0a1222" roughness={0.98} />
      <Block position={[-6.05, 3.35, 0]} size={[0.28, 6.7, 11.9]} color="#0e1729" roughness={0.98} />

      <Block position={[0, 0.65, -5.83]} size={[13.85, 0.72, 0.24]} color="#080d17" roughness={1} />
      <Block position={[-5.83, 0.65, 0]} size={[0.24, 0.72, 11.55]} color="#080d17" roughness={1} />
      <Block position={[0, 6.63, -5.88]} size={[14.45, 0.22, 0.42]} color="#060910" roughness={0.96} />
      <Block position={[-5.88, 6.63, 0]} size={[0.42, 0.22, 12.1]} color="#060910" roughness={0.96} />

      {/* Wall vertical relief strips */}
      {[-4.7, -1.5, 1.7, 4.9].map((x) => (
        <Block key={`wall-strip-${x}`} position={[x, 3.35, -5.84]} size={[0.055, 5.85, 0.035]} color="#1b2b45" roughness={0.9} />
      ))}
      {[-4.2, -1.2, 1.8, 4.8].map((z) => (
        <Block key={`left-strip-${z}`} position={[-5.84, 3.35, z]} size={[0.035, 5.85, 0.055]} color="#20314d" roughness={0.9} />
      ))}

      {/* ============================================================ BED ZONE — back-left, headboard flush to back wall
      ============================================================ */}
      <group position={[-3.55, 0, -3.25]}>
        <Block position={[0, 0.20, 0]} size={[4.25, 0.38, 3.55]} color="#08090f" roughness={1} />
        <Block position={[0, 0.43, 0]} size={[4.02, 0.20, 3.32]} color="#3a2527" roughness={0.86} />
        <Block position={[0, 0.56, 0]} size={[3.82, 0.06, 3.12]} color="#7c5135" roughness={0.78} />
        <Block position={[0, 1.18, -1.57]} size={[3.90, 1.25, 0.28]} color="#392528" roughness={0.9} />
        <Block position={[0, 1.78, -1.73]} size={[4.08, 0.18, 0.38]} color="#845839" roughness={0.74} />
        <Block position={[0, 1.62, -1.86]} size={[3.72, 0.04, 0.035]} color="#bd7c4c" roughness={0.72} />
        <RoomSprite position={[0, 0.62, 0.02]} crop={C.bed} height={2.85} rotation={FLOOR_ROTATION} depthOffset={0.08} />
      </group>

      {/* Bedside chest */}
      <group position={[-0.35, 0, -5.02]}>
        <Block position={[0, 0.48, 0]} size={[1.05, 0.86, 0.88]} color="#2d1d1d" roughness={0.92} />
        <Block position={[0, 0.96, 0]} size={[1.18, 0.12, 0.98]} color="#795039" roughness={0.76} />
        <Block position={[0, 0.56, 0.45]} size={[0.74, 0.035, 0.025]} color="#9d6841" />
        <RoomSprite position={[0, 1.02, 0.02]} crop={C.coffee} height={0.30} rotation={FLOOR_ROTATION} />
      </group>

      {/* ============================================================ DESK ZONE — back-right, separate from bed by a clear aisle
      ============================================================ */}
      <group onClick={interactDesk}>
        <WoodTable position={[2.55, 0, -4.48]} width={5.55} depth={1.28} height={1.05} />
        <Block position={[2.55, 0.60, -4.47]} size={[4.75, 0.86, 0.12]} color="#2a1a1a" roughness={0.92} />
        <Block position={[2.55, 0.88, -4.53]} size={[4.55, 0.045, 0.05]} color="#9d633e" roughness={0.72} />

        {/* Monitors are vertical; desk accessories lie on the desktop. */}
        <RoomSprite position={[1.10, 1.28, -4.98]} crop={C.laptop} height={1.02} depthOffset={0.04} />
        <RoomSprite position={[2.40, 1.34, -4.98]} crop={C.monitor} height={1.38} depthOffset={0.05} />
        <RoomSprite position={[3.72, 1.26, -4.97]} crop={C.sideMonitor} height={1.24} depthOffset={0.05} />
        <RoomSprite position={[1.65, 1.09, -4.22]} crop={C.keyboard} height={0.36} rotation={FLOOR_ROTATION} />
        <RoomSprite position={[2.95, 1.09, -4.18]} crop={C.mousePad} height={0.30} rotation={FLOOR_ROTATION} />
        <RoomSprite position={[3.56, 1.09, -4.16]} crop={C.mouse} height={0.22} rotation={FLOOR_ROTATION} />
        <RoomSprite position={[4.20, 1.12, -4.18]} crop={C.phone} height={0.28} rotation={FLOOR_ROTATION} />
        <RoomSprite position={[4.55, 1.20, -4.16]} crop={C.camera} height={0.24} rotation={FLOOR_ROTATION} />
        <RoomSprite position={[0.65, 1.15, -4.12]} crop={C.pencilCup} height={0.38} />
        <RoomSprite position={[4.80, 1.55, -4.30]} crop={C.deskLamp} height={1.05} depthOffset={0.04} />
      </group>

      {/* ============================================================ LOUNGE ZONE — sofa + table + plants + games
      ============================================================ */}
      <group position={[-3.95, 0, 2.55]}>
        <Block position={[0, 0.62, 0]} size={[3.70, 1.12, 1.48]} color="#20202e" roughness={0.98} />
        <Block position={[0, 1.24, -0.47]} size={[3.72, 0.84, 0.46]} color="#2c2b3d" roughness={0.96} />
        <Block position={[-1.62, 0.66, 0]} size={[0.22, 1.26, 1.70]} color="#14141f" />
        <Block position={[1.62, 0.66, 0]} size={[0.22, 1.26, 1.70]} color="#14141f" />
        <Block position={[0, 0.12, 0.02]} size={[3.95, 0.16, 1.72]} color="#11111a" />
        <RoomSprite position={[0, 1.43, -0.68]} crop={C.couchCats} height={1.00} />
      </group>

      {/* Lounge rug relief */}
      <Block position={[-3.95, 0.57, 2.55]} size={[4.35, 0.08, 2.12]} color="#171521" roughness={1} />
      <Block position={[-3.95, 0.62, 2.55]} size={[4.10, 0.035, 1.88]} color="#3a3043" roughness={1} />

      {/* Coffee table */}
      <WoodTable position={[-0.85, 0, 2.52]} width={2.60} depth={1.48} height={0.78} />
      <RoomSprite position={[-1.45, 0.89, 2.52]} crop={C.burger} height={0.28} rotation={FLOOR_ROTATION} />
      <RoomSprite position={[-0.80, 0.89, 2.52]} crop={C.pizza} height={0.27} rotation={FLOOR_ROTATION} />
      <RoomSprite position={[-0.18, 0.89, 2.45]} crop={C.bowl} height={0.28} rotation={FLOOR_ROTATION} />
      <RoomSprite position={[-0.95, 0.90, 2.93]} crop={C.drink} height={0.30} rotation={FLOOR_ROTATION} />
      <RoomSprite position={[-0.35, 0.90, 2.95]} crop={C.glass} height={0.28} rotation={FLOOR_ROTATION} />

      {/* ============================================================ WORK / HOBBY ZONE — table + chair + props
      ============================================================ */
      <WoodTable position={[3.25, 0, 2.62]} width={3.05} depth={1.82} height={0.84} />
      <Block position={[3.25, 0.47, 3.36]} size={[2.65, 0.72, 0.12]} color="#25191a" />
      <RoomSprite position={[2.35, 0.93, 2.35]} crop={C.ideas} height={0.44} rotation={FLOOR_ROTATION} />
      <RoomSprite position={[3.10, 0.93, 2.30]} crop={C.cameraLarge} height={0.42} rotation={FLOOR_ROTATION} />
      <RoomSprite position={[3.90, 0.93, 2.30]} crop={C.books} height={0.40} rotation={FLOOR_ROTATION} />
      <RoomSprite position={[3.45, 0.93, 2.92]} crop={C.globe} height={0.32} rotation={FLOOR_ROTATION} />

      {/* Chair */}
      <group position={[3.25, 0, 4.08]}>
        <Block position={[0, 0.55, 0]} size={[1.18, 0.18, 1.10]} color="#533624" roughness={0.8} />
        <Block position={[0, 1.18, 0.42]} size={[1.10, 1.20, 0.18]} color="#2b2228" roughness={0.94} />
        <Leg x={-0.42} z={-0.38} h={0.50} />
        <Leg x={0.42} z={-0.38} h={0.50} />
        <Leg x={-0.42} z={0.38} h={0.50} />
        <Leg x={0.42} z={0.38} h={0.50} />
      </group>

      {/* ============================================================ STORAGE / MEDIA ZONE — right wall, organized shelf
      ============================================================ */}
      <group position={[5.10, 0, 1.25]}>
        <Block position={[0, 0.90, 0]} size={[1.36, 1.80, 0.90]} color="#21171a" roughness={0.94} />
        <Block position={[0, 0.34, -0.47]} size={[1.52, 0.10, 1.04]} color="#754b32" roughness={0.78} />
        <Block position={[0, 0.92, -0.47]} size={[1.52, 0.10, 1.04]} color="#754b32" roughness={0.78} />
        <Block position={[0, 1.50, -0.47]} size={[1.52, 0.10, 1.04]} color="#754b32" roughness={0.78} />
        <RoomSprite position={[0, 1.86, -0.02]} crop={C.plantLarge} height={0.90} />
        <RoomSprite position={[-0.35, 0.68, -0.51]} crop={C.books} height={0.44} />
        <RoomSprite position={[0.34, 0.68, -0.51]} crop={C.console} height={0.32} />
        <RoomSprite position={[0.25, 1.26, -0.51]} crop={C.photo} height={0.35} />
      </group>

      {/* Backpack + skateboard are parked together beside the lounge. */}
      <RoomSprite position={[-5.12, 0.72, 2.55]} crop={C.skateboard} height={1.72} depthOffset={0.02} />
      <RoomSprite position={[-4.78, 0.72, 1.42]} crop={C.backpack} height={0.92} />

      {/* Small floor details deliberately grouped rather than scattered. */}
      <RoomSprite position={[1.55, 0.42, 4.86]} crop={C.pinkNote} height={0.52} rotation={FLOOR_ROTATION} />
      <RoomSprite position={[2.25, 0.42, 4.86]} crop={C.purpleNote} height={0.50} rotation={FLOOR_ROTATION} />
      <RoomSprite position={[2.90, 0.42, 4.86]} crop={C.greenNote} height={0.48} rotation={FLOOR_ROTATION} />
      <RoomSprite position={[4.10, 0.42, 4.75]} crop={C.sleepingCats} height={0.72} rotation={FLOOR_ROTATION} />

      {/* ============================================================ WALL DECORATION
      ============================================================ */}
      <RoomSprite position={[-3.80, 4.72, -5.84]} crop={C.board} height={1.72} rotation={WALL_ROTATION} />
      <RoomSprite position={[-1.10, 4.55, -5.84]} crop={C.window} height={1.48} rotation={WALL_ROTATION} />
      <RoomSprite position={[0.75, 4.48, -5.84]} crop={C.poster} height={1.26} rotation={WALL_ROTATION} />
      <RoomSprite position={[2.20, 4.35, -5.82]} crop={C.plant} height={1.54} rotation={WALL_ROTATION} />
      <RoomSprite position={[4.28, 3.72, -5.80]} crop={C.guitar} height={1.86} rotation={WALL_ROTATION} />
      <RoomSprite position={[3.72, 2.70, -5.79]} crop={C.wallShelf} height={0.86} rotation={WALL_ROTATION} />
      <RoomSprite position={[2.92, 2.05, -5.78]} crop={C.todo} height={0.82} rotation={WALL_ROTATION} />
      <RoomSprite position={[4.58, 2.00, -5.78]} crop={C.map} height={0.92} rotation={WALL_ROTATION} />

      {/* Second visual layer on left wall creates depth and balances the room. */}
      <RoomSprite position={[-5.80, 4.25, -1.35]} crop={C.board} height={1.30} rotation={LEFT_WALL_ROTATION} depthOffset={0.03} />
      <RoomSprite position={[-5.79, 3.10, 1.35]} crop={C.cityPrint} height={0.68} rotation={LEFT_WALL_ROTATION} depthOffset={0.03} />
      <RoomSprite position={[-5.78, 2.65, 2.45]} crop={C.pinkNote} height={0.50} rotation={LEFT_WALL_ROTATION} depthOffset={0.03} />

      {/* Warm practical lights reinforce furniture depth. */}
      <pointLight position={[-0.35, 1.35, -4.55]} intensity={0.55} color="#ffad62" distance={3.2} decay={2} />
      <pointLight position={[4.65, 1.60, -4.35]} intensity={0.75} color="#38bdf8" distance={3.4} decay={2} />
      <pointLight position={[-4.65, 2.00, 2.20]} intensity={0.35} color="#a855f7" distance={3.2} decay={2} />

      <Player
        onInteractDesk={onInteractDesk}
        initialPosition={[0, 0, 0.45]}
        deskPosition={[2.55, -4.48]}
        speed={2.55}
      />
    </group>
  );
});

Room.displayName = 'Room';
