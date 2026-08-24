import React, { useCallback } from 'react';
import { Player } from './Player';
import { RoomSprite } from './RoomProps';

interface RoomProps {
  onInteractDesk: () => void;
}

type V3 = [number, number, number];

const FLOOR: V3 = [-Math.PI / 2, 0, 0];
const BACK: V3 = [0, 0, 0];
const LEFT: V3 = [0, Math.PI / 2, 0];

/** 1536x1024 atlas coordinates, measured from the supplied room-props.png. */
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

const wallProps: Array<{ p: V3; c: keyof typeof C; h: number; r?: V3 }> = [
  { p: [-2.65, 3.58, -4.69], c: 'board', h: 1.62 },
  { p: [-0.25, 3.52, -4.68], c: 'window', h: 1.58 },
  { p: [1.65, 3.54, -4.67], c: 'poster', h: 1.30 },
  { p: [2.85, 3.05, -4.66], c: 'plant', h: 1.55 },
  { p: [4.12, 2.75, -4.65], c: 'guitar', h: 1.78 },
  { p: [3.02, 2.12, -4.64], c: 'wallShelf', h: 0.92 },
  { p: [2.65, 1.55, -4.63], c: 'todo', h: 0.82 },
  { p: [3.82, 1.50, -4.62], c: 'map', h: 0.98 },
  { p: [-4.72, 3.28, -2.55], c: 'board', h: 1.12, r: LEFT },
];

export const Room: React.FC<RoomProps> = React.memo(({ onInteractDesk }) => {
  const interactDesk = useCallback(() => onInteractDesk(), [onInteractDesk]);

  return (
    <group>
      {/* ============================================================
          2.5D FLOOR — layered so the room reads as a real diorama.
      ============================================================ */}
      <mesh position={[0, -0.30, 0]} castShadow receiveShadow>
        <boxGeometry args={[11.4, 0.48, 11.4]} />
        <meshStandardMaterial color="#05060a" roughness={1} />
      </mesh>
      <mesh position={[0, -0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[10.75, 0.20, 10.75]} />
        <meshStandardMaterial color="#17141d" roughness={0.96} />
      </mesh>
      <mesh position={[0, 0.10, 0]} receiveShadow>
        <boxGeometry args={[10.35, 0.10, 10.35]} />
        <meshStandardMaterial color="#2a2531" roughness={0.92} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[0, 0.17, -4.45 + i * 0.92]} receiveShadow>
          <boxGeometry args={[9.95, 0.025, 0.035]} />
          <meshStandardMaterial color="#514658" roughness={0.9} />
        </mesh>
      ))}

      {/* Main rug: slightly smaller and shifted forward to preserve clear circulation. */}
      <mesh position={[-0.55, 0.22, 1.25]} castShadow receiveShadow>
        <boxGeometry args={[7.55, 0.16, 4.65]} />
        <meshStandardMaterial color="#171520" roughness={1} />
      </mesh>
      <mesh position={[-0.55, 0.315, 1.25]} receiveShadow>
        <boxGeometry args={[7.28, 0.035, 4.38]} />
        <meshStandardMaterial color="#302b3b" roughness={1} />
      </mesh>
      <mesh position={[-0.55, 0.35, 1.25]}>
        <boxGeometry args={[7.08, 0.018, 4.18]} />
        <meshStandardMaterial color="#3c3549" roughness={1} />
      </mesh>

      {/* Neon perimeter. */}
      {([[-4.68, 0.25, 0], [0, 0.25, -4.68], [0, 0.25, 4.68]] as V3[]).map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={i === 0 ? [0.055, 0.035, 9.55] : [9.55, 0.035, 0.055]} />
          <meshStandardMaterial color="#3182ff" emissive="#3182ff" emissiveIntensity={1.9} toneMapped={false} />
        </mesh>
      ))}

      {/* ============================================================ WALLS ============================================================ */}
      <mesh position={[0, 2.55, -5]} receiveShadow>
        <boxGeometry args={[10, 5.1, 0.22]} />
        <meshStandardMaterial color="#0b1425" roughness={1} />
      </mesh>
      <mesh position={[-5, 2.55, 0]} receiveShadow>
        <boxGeometry args={[0.22, 5.1, 10]} />
        <meshStandardMaterial color="#101a2e" roughness={1} />
      </mesh>
      <mesh position={[0, 4.95, -4.84]} castShadow>
        <boxGeometry args={[10.15, 0.20, 0.30]} />
        <meshStandardMaterial color="#060911" roughness={0.94} />
      </mesh>
      <mesh position={[-4.84, 4.95, 0]} castShadow>
        <boxGeometry args={[0.30, 0.20, 10.15]} />
        <meshStandardMaterial color="#060911" roughness={0.94} />
      </mesh>
      <mesh position={[0, 0.58, -4.82]} receiveShadow>
        <boxGeometry args={[9.72, 0.70, 0.18]} />
        <meshStandardMaterial color="#080c16" roughness={0.98} />
      </mesh>
      <mesh position={[-4.82, 0.58, 0]} receiveShadow>
        <boxGeometry args={[0.18, 0.70, 9.72]} />
        <meshStandardMaterial color="#080c16" roughness={0.98} />
      </mesh>

      {/* ============================================================ WALL ART / PROPS ============================================================ */}
      {wallProps.map(({ p, c, h, r = BACK }) => (
        <RoomSprite
          key={`${c}-${p.join('-')}`}
          position={p}
          crop={C[c]}
          height={h}
          rotation={r}
          depthOffset={0.03}
        />
      ))}

      {/* ============================================================ BED ZONE — back-left, flush against the left/back wall.
          Its headboard is aligned to the same wall plane as the desk.
      ============================================================ */}
      <group position={[-2.35, 0, -2.28]}>
        <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.72, 0.38, 3.34]} />
          <meshStandardMaterial color="#090910" roughness={1} />
        </mesh>
        <mesh position={[0, 0.39, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.48, 0.18, 3.08]} />
          <meshStandardMaterial color="#382426" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.50, 0]}>
          <boxGeometry args={[3.30, 0.07, 2.90]} />
          <meshStandardMaterial color="#69472f" roughness={0.80} />
        </mesh>
        <mesh position={[0, 0.98, -1.48]} castShadow receiveShadow>
          <boxGeometry args={[3.42, 1.08, 0.24]} />
          <meshStandardMaterial color="#3c2727" roughness={0.90} />
        </mesh>
        <mesh position={[0, 1.47, -1.57]} castShadow>
          <boxGeometry args={[3.60, 0.18, 0.34]} />
          <meshStandardMaterial color="#7e5638" roughness={0.74} />
        </mesh>
        <mesh position={[0, 1.34, -1.70]}>
          <boxGeometry args={[3.18, 0.04, 0.025]} />
          <meshStandardMaterial color="#b27848" />
        </mesh>
        <RoomSprite
          position={[0, 0.58, 0.02]}
          crop={C.bed}
          height={2.58}
          rotation={FLOOR}
          depthOffset={0.07}
        />
      </group>

      {/* Bedside table stays between bed and wall, not in the walkway. */}
      <group position={[-0.15, 0, -3.60]}>
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.82, 0.78, 0.72]} />
          <meshStandardMaterial color="#34201e" roughness={0.92} />
        </mesh>
        <mesh position={[0, 0.84, 0]} castShadow>
          <boxGeometry args={[0.95, 0.12, 0.80]} />
          <meshStandardMaterial color="#795039" roughness={0.78} />
        </mesh>
        <mesh position={[0, 1.18, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.28, 8]} />
          <meshStandardMaterial color="#14131a" />
        </mesh>
        <mesh position={[0, 1.38, 0]}>
          <coneGeometry args={[0.21, 0.23, 8]} />
          <meshStandardMaterial color="#d88f45" emissive="#ff9f43" emissiveIntensity={0.4} />
        </mesh>
        <RoomSprite position={[0, 0.98, 0.20]} crop={C.coffee} height={0.27} depthOffset={0.02} />
        <pointLight position={[0, 1.40, 0.08]} intensity={0.42} color="#ffb15a" distance={2.5} decay={2} />
      </group>

      {/* ============================================================ DESK ZONE — back-right.
          Narrower than before so it never overlaps the bed footprint.
      ============================================================ */}
      <group position={[1.92, 0, -3.55]} onClick={interactDesk}>
        <mesh position={[-1.68, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.78, 0.80, 0.86]} />
          <meshStandardMaterial color="#291918" roughness={0.94} />
        </mesh>
        <mesh position={[1.68, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.78, 0.80, 0.86]} />
          <meshStandardMaterial color="#291918" roughness={0.94} />
        </mesh>
        <mesh position={[0, 0.96, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.96, 0.22, 1.10]} />
          <meshStandardMaterial color="#71492f" roughness={0.76} />
        </mesh>
        <mesh position={[0, 0.82, -0.53]}>
          <boxGeometry args={[4.65, 0.13, 0.10]} />
          <meshStandardMaterial color="#925e39" roughness={0.74} />
        </mesh>
        <mesh position={[0, 1.08, 0.43]}>
          <boxGeometry args={[4.66, 0.07, 0.07]} />
          <meshStandardMaterial color="#9f6c43" />
        </mesh>
        <mesh position={[0, 0.15, -0.43]}>
          <boxGeometry args={[4.10, 0.05, 0.035]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.5} toneMapped={false} />
        </mesh>

        <RoomSprite position={[-1.48, 1.30, -0.16]} crop={C.laptop} height={1.28} />
        <RoomSprite position={[-0.42, 1.34, -0.18]} crop={C.monitor} height={1.18} />
        <RoomSprite position={[0.68, 1.32, -0.18]} crop={C.sideMonitor} height={1.18} />
        <RoomSprite position={[1.57, 1.18, -0.08]} crop={C.deskLamp} height={1.02} />
        <RoomSprite position={[-0.34, 1.10, 0.18]} crop={C.keyboard} height={0.36} rotation={FLOOR} />
        <RoomSprite position={[0.80, 1.10, 0.18]} crop={C.mousePad} height={0.30} rotation={FLOOR} />
        <RoomSprite position={[1.35, 1.10, 0.18]} crop={C.mouse} height={0.26} rotation={FLOOR} />
        <RoomSprite position={[1.86, 1.13, 0.20]} crop={C.camera} height={0.24} rotation={FLOOR} />
        <RoomSprite position={[1.98, 1.12, 0.22]} crop={C.phone} height={0.25} rotation={FLOOR} />
        <RoomSprite position={[1.60, 1.14, 0.22]} crop={C.pencilCup} height={0.30} rotation={FLOOR} />
      </group>

      {/* ============================================================ SOFA ZONE — front-left.
          It is deliberately separated from the bed with a walking lane.
      ============================================================ */}
      <group position={[-3.05, 0, 1.78]} rotation={[0, 0, 0]}>
        <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.72, 0.72, 1.48]} />
          <meshStandardMaterial color="#24202b" roughness={0.92} />
        </mesh>
        <mesh position={[0, 0.88, -0.50]} castShadow>
          <boxGeometry args={[2.74, 0.96, 0.28]} />
          <meshStandardMaterial color="#2d2835" roughness={0.92} />
        </mesh>
        <mesh position={[-1.34, 0.68, 0]} castShadow>
          <boxGeometry args={[0.26, 1.04, 1.56]} />
          <meshStandardMaterial color="#2d2835" roughness={0.92} />
        </mesh>
        <mesh position={[1.34, 0.68, 0]} castShadow>
          <boxGeometry args={[0.26, 1.04, 1.56]} />
          <meshStandardMaterial color="#2d2835" roughness={0.92} />
        </mesh>
        <mesh position={[0, 0.84, 0.16]}>
          <boxGeometry args={[2.20, 0.08, 0.92]} />
          <meshStandardMaterial color="#302b39" roughness={1} />
        </mesh>
        <RoomSprite position={[0, 1.01, 0.05]} crop={C.couchCats} height={0.70} rotation={FLOOR} depthOffset={0.03} />
      </group>

      {/* ============================================================ COFFEE TABLE — center/front.
          Low enough to read as furniture without blocking the player.
      ============================================================ */}
      <group position={[0.05, 0, 1.72]}>
        <mesh position={[0, 0.54, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.35, 0.18, 1.42]} />
          <meshStandardMaterial color="#70472e" roughness={0.78} />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[1.86, 0.10, 0.92]} />
          <meshStandardMaterial color="#3a2523" roughness={0.90} />
        </mesh>
        {([-0.92, 0.92] as number[]).map((x) => (
          <React.Fragment key={x}>
            <mesh position={[x, 0.28, -0.50]}><boxGeometry args={[0.13, 0.55, 0.13]} /><meshStandardMaterial color="#4b2f26" /></mesh>
            <mesh position={[x, 0.28, 0.50]}><boxGeometry args={[0.13, 0.55, 0.13]} /><meshStandardMaterial color="#4b2f26" /></mesh>
          </React.Fragment>
        ))}
        <RoomSprite position={[-0.72, 0.66, 0]} crop={C.burger} height={0.34} rotation={FLOOR} />
        <RoomSprite position={[0.10, 0.66, 0.05]} crop={C.pizza} height={0.30} rotation={FLOOR} />
        <RoomSprite position={[0.75, 0.67, 0.02]} crop={C.drink} height={0.34} rotation={FLOOR} />
        <RoomSprite position={[0.45, 0.66, -0.38]} crop={C.glass} height={0.30} rotation={FLOOR} />
      </group>

      {/* ============================================================ STORAGE / HOBBY ZONE — front-right.
      ============================================================ */}
      <group position={[3.02, 0, 1.95]}>
        <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.55, 1.56, 0.78]} />
          <meshStandardMaterial color="#2c1d20" roughness={0.90} />
        </mesh>
        {[0.30, 0.72, 1.14].map((y) => (
          <mesh key={y} position={[0, y, 0.41]}>
            <boxGeometry args={[1.48, 0.045, 0.035]} />
            <meshStandardMaterial color="#815538" roughness={0.76} />
          </mesh>
        ))}
        <RoomSprite position={[-0.35, 1.66, 0.48]} crop={C.books} height={0.55} rotation={FLOOR} />
        <RoomSprite position={[0.36, 1.66, 0.48]} crop={C.plantLarge} height={0.72} rotation={FLOOR} />
        <RoomSprite position={[0, 1.70, 0.50]} crop={C.cameraLarge} height={0.54} rotation={FLOOR} />
      </group>

      {/* Hobby corner: skateboard + backpack are leaned against the left wall, not scattered. */}
      <RoomSprite position={[-4.18, 0.78, 1.12]} crop={C.skateboard} height={1.55} rotation={[0, 0, -0.18]} depthOffset={0.06} />
      <RoomSprite position={[-3.78, 0.48, 0.35]} crop={C.backpack} height={0.86} rotation={FLOOR} depthOffset={0.05} />

      {/* Small decorative props around the living area. */}
      <RoomSprite position={[-1.18, 0.68, 1.78]} crop={C.bowl} height={0.32} rotation={FLOOR} />
      <RoomSprite position={[-0.92, 0.66, 2.24]} crop={C.coffee} height={0.25} rotation={FLOOR} />
      <RoomSprite position={[1.62, 0.66, 2.22]} crop={C.ideas} height={0.44} rotation={FLOOR} />
      <RoomSprite position={[2.30, 0.66, 2.24]} crop={C.photo} height={0.35} rotation={FLOOR} />
      <RoomSprite position={[2.82, 0.67, 2.24]} crop={C.console} height={0.28} rotation={FLOOR} />

      {/* Player remains in the main circulation lane. */}
      <Player onInteractDesk={interactDesk} />
    </group>
  );
});

Room.displayName = 'Room';
