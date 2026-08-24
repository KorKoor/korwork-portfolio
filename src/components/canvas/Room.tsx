import React, { useCallback, useMemo } from 'react';
import { RoomSprite } from './RoomProps';

interface RoomProps {
  onInteractDesk: () => void;
}

type V3 = [number, number, number];

const FLOOR_ROTATION: V3 = [-Math.PI / 2, 0, 0];
const WALL_ROTATION: V3 = [0, 0, 0];
const LEFT_WALL_ROTATION: V3 = [0, Math.PI / 2, 0];
const RIGHT_WALL_ROTATION: V3 = [0, -Math.PI / 2, 0];
const FRONT_WALL_ROTATION: V3 = [0, Math.PI, 0];

/* ============================================================
   ATLAS (mapeo exacto del spritesheet original)
============================================================ */

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
  deskLamp: { x: 805, y: 315, width: 155, height: 180 },

  keyboard: { x: 431, y: 545, width: 236, height: 81 },
  mousePad: { x: 660, y: 558, width: 138, height: 72 },
  mouse: { x: 693, y: 563, width: 54, height: 58 },

  camera: { x: 797, y: 453, width: 80, height: 72 },
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

  globe: { x: 1018, y: 699, width: 68, height: 78 },
  vase: { x: 1087, y: 694, width: 50, height: 89 },
  ideas: { x: 1141, y: 697, width: 123, height: 100 },
  photo: { x: 1265, y: 713, width: 149, height: 86 },

  console: { x: 1112, y: 809, width: 123, height: 67 },
  cameraLarge: { x: 1238, y: 810, width: 88, height: 86 },
  books: { x: 1328, y: 787, width: 100, height: 148 },
  plantLarge: { x: 1409, y: 697, width: 122, height: 168 },
} as const;

/* ============================================================
   ATLAS — house-props.png (hoja nueva, 1536x1024)
   Crops calculados automáticamente detectando los bounding boxes
   de alpha > 0 de cada sprite, así que son pixel-perfect.
============================================================ */

const H = {
  aquarium: { x: 1115, y: 254, width: 82, height: 75 },
  catTree: { x: 1442, y: 364, width: 84, height: 137 },
  beanBag: { x: 1307, y: 364, width: 151, height: 88 },
  hangingPlant: { x: 1461, y: 8, width: 70, height: 241 },
  recordPlayer: { x: 1134, y: 728, width: 180, height: 93 },
  tallPlant: { x: 395, y: 703, width: 77, height: 295 },
  miniFridge: { x: 1387, y: 744, width: 133, height: 132 },
  petBowls: { x: 1241, y: 454, width: 130, height: 55 },
  pillows: { x: 1421, y: 885, width: 102, height: 120 },
  hoodie: { x: 1164, y: 465, width: 61, height: 94 },
  deskGlobe: { x: 1384, y: 176, width: 108, height: 100 },
  mountainPoster: { x: 850, y: 752, width: 86, height: 138 },
} as const;

/* ============================================================
   COLORES DEL DISEÑO
============================================================ */

const COLORS = {
  void: '#05070d',
  floorBase: '#17131d',
  floor: '#292331',
  floorLight: '#45394a',
  floorDark: '#1d1823',

  wallBack: '#0a1222',
  wallSide: '#0e1729',
  wallPanel: '#111d34',
  wallTrim: '#20314d',

  woodDark: '#2a1a1b',
  wood: '#754c31',
  woodLight: '#9a633c',

  black: '#08090f',
  metal: '#171b24',
  metalLight: '#2b3442',

  purple: '#8b5cf6',
  purpleDark: '#4c2d72',
  blue: '#38bdf8',
  blueTrim: '#8ab8ff',
  orange: '#ffad62',
  warm: '#ffd08a',

  rug: '#251c2e',
  rugLight: '#3a2c42',

  sofa: '#2c2b3d',
  sofaDark: '#1f1e2e',

  plant: '#365f4a',
  ceramic: '#573b40',
};

/* ============================================================
   HELPERS 3D
   (La geometría, tamaños y posiciones de las piezas "ancla" —
   plataformas, escaleras, y los grupos de muebles principales —
   se mantienen EXACTAMENTE como en el archivo de referencia
   porque están sincronizadas con los colliders de Player.tsx.
   Todo lo demás se enriquece visualmente.)
============================================================ */

function Block({
  position,
  size,
  color,
  y = 0,
  roughness = 0.85,
  metalness = 0,
  emissive,
  emissiveIntensity = 0,
  visible = true,
  receiveShadow = true,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  y?: number;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  visible?: boolean;
  receiveShadow?: boolean;
}) {
  return (
    <mesh
      position={[position[0], position[1] + y, position[2]]}
      castShadow
      receiveShadow={receiveShadow}
      visible={visible}
    >
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

function Hitbox({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <Block
      position={position}
      size={size}
      color="#000000"
      visible={false}
      receiveShadow={false}
    />
  );
}

function Leg({
  offsetX,
  offsetZ,
  h = 0.82,
  thickness = 0.16,
}: {
  offsetX: number;
  offsetZ: number;
  h?: number;
  thickness?: number;
}) {
  return (
    <Block
      position={[offsetX, h / 2, offsetZ]}
      size={[thickness, h, thickness]}
      color="#1c1518"
      roughness={0.95}
    />
  );
}

/* ---------------- MESA DE MADERA ---------------- */

function WoodTable({
  position,
  width,
  depth,
  height = 0.82,
}: {
  position: [number, number, number];
  width: number;
  depth: number;
  height?: number;
}) {
  const legX = width / 2 - 0.18;
  const legZ = depth / 2 - 0.18;

  return (
    <group position={position}>
      <Block
        position={[0, height - 0.08, 0]}
        size={[width + 0.16, 0.18, depth + 0.16]}
        color={COLORS.woodDark}
      />
      <Block
        position={[0, height, 0]}
        size={[width, 0.14, depth]}
        color={COLORS.wood}
        roughness={0.76}
      />
      <Block
        position={[0, height + 0.075, 0]}
        size={[width - 0.12, 0.035, depth - 0.12]}
        color={COLORS.woodLight}
        roughness={0.72}
      />

      <Leg offsetX={-legX} offsetZ={-legZ} h={height - 0.04} thickness={0.18} />
      <Leg offsetX={legX} offsetZ={-legZ} h={height - 0.04} thickness={0.18} />
      <Leg offsetX={-legX} offsetZ={legZ} h={height - 0.04} thickness={0.18} />
      <Leg offsetX={legX} offsetZ={legZ} h={height - 0.04} thickness={0.18} />
    </group>
  );
}

/* ---------------- SILLA ---------------- */

function Chair({
  position,
  rotation = 0,
  variant = 0,
}: {
  position: [number, number, number];
  rotation?: number;
  variant?: number;
}) {
  const colors = ['#3a2527', '#2e1e20', '#4a2a2c'];
  const seatColor = colors[variant % colors.length];

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Block position={[0, 0.45, 0]} size={[0.55, 0.08, 0.55]} color={seatColor} roughness={0.8} />
      <Block position={[0, 0.85, -0.28]} size={[0.5, 0.7, 0.05]} color={seatColor} roughness={0.8} />
      <Block position={[-0.3, 0.6, 0]} size={[0.06, 0.08, 0.5]} color="#2a1a1b" roughness={0.9} />
      <Block position={[0.3, 0.6, 0]} size={[0.06, 0.08, 0.5]} color="#2a1a1b" roughness={0.9} />

      <Leg offsetX={-0.22} offsetZ={-0.22} h={0.42} thickness={0.1} />
      <Leg offsetX={0.22} offsetZ={-0.22} h={0.42} thickness={0.1} />
      <Leg offsetX={-0.22} offsetZ={0.22} h={0.42} thickness={0.1} />
      <Leg offsetX={0.22} offsetZ={0.22} h={0.42} thickness={0.1} />
    </group>
  );
}

/* ---------------- PLATAFORMA (soporta elevar o hundir el piso) ---------------- */

function Platform({
  position,
  width,
  depth,
  height = 0.22,
  topColor,
  step = false,
  stepSide = 'south',
  trimColor = COLORS.blueTrim,
  trimEmissive = '#4d8dff',
  trimIntensity = 2.0,
}: {
  position: [number, number, number];
  width: number;
  depth: number;
  height?: number;
  topColor: string;
  step?: boolean;
  stepSide?: 'north' | 'south' | 'east' | 'west';
  trimColor?: string;
  trimEmissive?: string;
  trimIntensity?: number;
}) {
  // height puede ser negativo (plataforma hundida) o positivo (plataforma elevada).
  const dir = height < 0 ? -1 : 1;
  const h = Math.max(0.04, Math.abs(height));
  const trimT = 0.04;
  const stepH = h / 2;
  const stepW = 0.8;

  const stepPos: [number, number, number] =
    stepSide === 'south'
      ? [0, (dir * stepH) / 2, depth / 2 + stepW / 2]
      : stepSide === 'north'
        ? [0, (dir * stepH) / 2, -(depth / 2 + stepW / 2)]
        : stepSide === 'east'
          ? [width / 2 + stepW / 2, (dir * stepH) / 2, 0]
          : [-(width / 2 + stepW / 2), (dir * stepH) / 2, 0];

  const stepSize: [number, number, number] =
    stepSide === 'south' || stepSide === 'north'
      ? [width * 0.6, stepH, stepW]
      : [stepW, stepH, depth * 0.6];

  return (
    <group position={position}>
      <Block
        position={[0, dir * h * 0.35, 0]}
        size={[width + 0.15, h * 0.7, depth + 0.15]}
        color="#08070c"
        roughness={1}
      />

      <Block
        position={[0, dir * h * 0.62, 0]}
        size={[width, h * 0.55, depth]}
        color="#171420"
        roughness={0.95}
      />

      <Block
        position={[0, height + dir * 0.02, 0]}
        size={[width - 0.05, 0.04, depth - 0.05]}
        color={topColor}
        roughness={0.85}
      />

      <Block
        position={[0, height + dir * 0.045, -depth / 2 + trimT / 2]}
        size={[width - 0.06, 0.02, trimT]}
        color={trimColor}
        emissive={trimEmissive}
        emissiveIntensity={trimIntensity}
      />
      <Block
        position={[0, height + dir * 0.045, depth / 2 - trimT / 2]}
        size={[width - 0.06, 0.02, trimT]}
        color={trimColor}
        emissive={trimEmissive}
        emissiveIntensity={trimIntensity}
      />
      <Block
        position={[-width / 2 + trimT / 2, height + dir * 0.045, 0]}
        size={[trimT, 0.02, depth - 0.06]}
        color={trimColor}
        emissive={trimEmissive}
        emissiveIntensity={trimIntensity}
      />
      <Block
        position={[width / 2 - trimT / 2, height + dir * 0.045, 0]}
        size={[trimT, 0.02, depth - 0.06]}
        color={trimColor}
        emissive={trimEmissive}
        emissiveIntensity={trimIntensity}
      />

      {step && (
        <Block position={stepPos} size={stepSize} color="#211d29" roughness={0.95} />
      )}
    </group>
  );
}

/* ---------------- ESCALERAS ---------------- */

function Stairs({
  position,
  steps = 4,
  width = 2.5,
  depth = 0.5,
  height = 0.08,
  color = '#241a1e',
}: {
  position: [number, number, number];
  steps?: number;
  width?: number;
  depth?: number;
  height?: number;
  color?: string;
}) {
  // height puede ser negativo para que la escalera BAJE en vez de subir
  // (usado para conectar la plataforma elevada del dormitorio/escritorio
  // con el piso inferior de la sala/comedor).
  return (
    <group position={position}>
      {Array.from({ length: steps }, (_, i) => (
        <Block
          key={`step-${i}`}
          position={[0, (i + 0.5) * height, (i + 1) * depth - depth / 2]}
          size={[width, Math.abs(height), depth]}
          color={color}
          roughness={0.95}
        />
      ))}

      <Hitbox
        position={[0, (steps * height) / 2, (steps * depth) / 2]}
        size={[width, Math.abs(steps * height), steps * depth]}
      />
    </group>
  );
}

/* ---------------- LÁMPARA DE ESCRITORIO ---------------- */

function DeskLamp({
  position,
  scale = 1,
  color = '#d8b4fe',
  intensity = 1.2,
  rotation = 0,
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
  intensity?: number;
  rotation?: number;
}) {
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      <Block position={[0, 0.2, 0]} size={[0.3, 0.05, 0.3]} color="#1c1518" roughness={0.8} />
      <Block position={[0, 0.6, 0]} size={[0.08, 0.7, 0.08]} color="#1c1518" roughness={0.8} />
      <Block position={[0, 1.1, -0.2]} size={[0.25, 0.25, 0.3]} color="#1c1518" roughness={0.8} />
      <Block
        position={[0, 1.0, -0.25]}
        size={[0.1, 0.1, 0.05]}
        color={color}
        emissive={color}
        emissiveIntensity={1.5}
      />
      <pointLight position={[0, 1.1, -0.3]} intensity={intensity} color={color} distance={5} decay={2} />
    </group>
  );
}

/* ---------------- ESTANTE DE PARED ---------------- */

function WallShelf({
  position,
  width,
  depth = 0.2,
}: {
  position: [number, number, number];
  width: number;
  depth?: number;
}) {
  return (
    <group position={position}>
      <Block position={[0, 0, 0]} size={[width, 0.1, depth]} color="#2d1d1d" roughness={0.9} />
      <Block position={[-width / 2, -0.15, 0]} size={[0.1, 0.2, depth]} color="#2d1d1d" roughness={0.9} />
      <Block position={[width / 2, -0.15, 0]} size={[0.1, 0.2, depth]} color="#2d1d1d" roughness={0.9} />
    </group>
  );
}

/* ---------------- ALFOMBRA (capas con borde) ---------------- */

function Rug({
  position,
  width,
  depth,
  color = COLORS.rug,
  accent = COLORS.rugLight,
}: {
  position: [number, number, number];
  width: number;
  depth: number;
  color?: string;
  accent?: string;
}) {
  return (
    <group position={position}>
      <Block position={[0, 0.02, 0]} size={[width + 0.15, 0.04, depth + 0.15]} color="#0b0910" roughness={1} />
      <Block position={[0, 0.04, 0]} size={[width, 0.02, depth]} color={color} roughness={1} />
      <Block position={[0, 0.05, 0]} size={[width - 0.15, 0.01, depth - 0.15]} color={accent} roughness={1} />
    </group>
  );
}

/* ---------------- CÓMODA ---------------- */

function Dresser({
  position,
  width = 1.2,
  height = 0.95,
  depth = 0.55,
}: {
  position: [number, number, number];
  width?: number;
  height?: number;
  depth?: number;
}) {
  return (
    <group position={position}>
      <Block position={[0, height / 2, 0]} size={[width, height, depth]} color="#241719" roughness={0.9} />
      <Block position={[0, height + 0.05, 0]} size={[width + 0.06, 0.06, depth + 0.06]} color={COLORS.wood} roughness={0.75} />
      {[0.22, 0.48, 0.74].map((y, i) => (
        <React.Fragment key={`drawer-${i}`}>
          <Block position={[0, y * height, depth / 2 + 0.01]} size={[width - 0.14, 0.18, 0.03]} color="#382225" roughness={0.85} />
          <Block position={[0, y * height, depth / 2 + 0.04]} size={[0.18, 0.03, 0.03]} color="#8f6a4b" metalness={0.25} roughness={0.45} />
        </React.Fragment>
      ))}
      <Hitbox position={[0, height / 2, 0]} size={[width, height, depth]} />
    </group>
  );
}

/* ---------------- ARMARIO ---------------- */

function Wardrobe({
  position,
  width = 1.9,
  height = 2.6,
  depth = 0.7,
  rotation = 0,
}: {
  position: [number, number, number];
  width?: number;
  height?: number;
  depth?: number;
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Block position={[0, height / 2, 0]} size={[width, height, depth]} color="#171217" roughness={0.92} />
      <Block position={[0, height + 0.04, 0]} size={[width + 0.1, 0.08, depth + 0.06]} color={COLORS.wood} roughness={0.78} />
      <Block position={[-width / 4, height / 2, depth / 2 + 0.012]} size={[width / 2 - 0.04, height - 0.14, 0.03]} color="#211920" roughness={0.75} />
      <Block position={[width / 4, height / 2, depth / 2 + 0.012]} size={[width / 2 - 0.04, height - 0.14, 0.03]} color="#211920" roughness={0.75} />
      <Block position={[-0.05, height / 2, depth / 2 + 0.04]} size={[0.03, height - 0.16, 0.02]} color="#5d4350" />
      <Block position={[0.05, height / 2, depth / 2 + 0.04]} size={[0.03, height - 0.16, 0.02]} color="#5d4350" />
      <Hitbox position={[0, height / 2, 0]} size={[width, height, depth]} />
    </group>
  );
}

/* ---------------- LIBRERO ---------------- */

function Bookcase({
  position,
  width = 1.4,
  height = 2.1,
  depth = 0.4,
}: {
  position: [number, number, number];
  width?: number;
  height?: number;
  depth?: number;
}) {
  const shelves = [0.5, 1.0, 1.5, 2.0];

  return (
    <group position={position}>
      <Block position={[-width / 2, height / 2, 0]} size={[0.09, height, depth]} color="#2d1d1d" />
      <Block position={[width / 2, height / 2, 0]} size={[0.09, height, depth]} color="#2d1d1d" />
      <Block position={[0, height, 0]} size={[width + 0.09, 0.1, depth]} color="#2d1d1d" />

      {shelves.map((y, i) => (
        <Block key={`shelf-${i}`} position={[0, y, 0]} size={[width, 0.07, depth]} color="#3a2527" />
      ))}

      <RoomSprite position={[-0.35, 0.3, 0.18]} crop={C.books} height={0.42} rotation={FLOOR_ROTATION} />
      <RoomSprite position={[0.2, 0.8, 0.18]} crop={C.books} height={0.4} rotation={FLOOR_ROTATION} />
      <RoomSprite position={[-0.15, 1.3, 0.18]} crop={C.books} height={0.38} rotation={FLOOR_ROTATION} />
      <RoomSprite position={[0.3, 1.75, 0.18]} crop={C.cameraLarge} height={0.35} rotation={FLOOR_ROTATION} />

      <Hitbox position={[0, height / 2, 0]} size={[width, height, depth]} />
    </group>
  );
}

/* ---------------- MESA AUXILIAR ---------------- */

function SideTable({
  position,
  width = 0.6,
  depth = 0.5,
  height = 0.5,
}: {
  position: [number, number, number];
  width?: number;
  depth?: number;
  height?: number;
}) {
  return (
    <group position={position}>
      <Block position={[0, height, 0]} size={[width, 0.1, depth]} color={COLORS.wood} roughness={0.75} />
      <Leg offsetX={-width / 2 + 0.08} offsetZ={-depth / 2 + 0.08} h={height} thickness={0.08} />
      <Leg offsetX={width / 2 - 0.08} offsetZ={-depth / 2 + 0.08} h={height} thickness={0.08} />
      <Leg offsetX={-width / 2 + 0.08} offsetZ={depth / 2 - 0.08} h={height} thickness={0.08} />
      <Leg offsetX={width / 2 - 0.08} offsetZ={depth / 2 - 0.08} h={height} thickness={0.08} />
      <Hitbox position={[0, height / 2, 0]} size={[width, height, depth]} />
    </group>
  );
}

/* ---------------- PUF ---------------- */

function Pouf({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <Block position={[0, 0.24, 0]} size={[0.6, 0.42, 0.6]} color="#3c2d4c" roughness={0.95} />
      <Block position={[0, 0.46, 0]} size={[0.55, 0.06, 0.55]} color={COLORS.purpleDark} roughness={0.9} />
      <Hitbox position={[0, 0.3, 0]} size={[0.65, 0.6, 0.65]} />
    </group>
  );
}

/* ---------------- LÁMPARA DE PIE ---------------- */

function FloorLamp({ position, color = COLORS.warm }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      <Block position={[0, 0.04, 0]} size={[0.45, 0.06, 0.45]} color="#141119" metalness={0.5} />
      <Block position={[0, 1.1, 0]} size={[0.06, 2.1, 0.06]} color="#20232d" metalness={0.6} />
      <Block position={[0, 2.0, 0]} size={[0.45, 0.3, 0.45]} color="#332a36" roughness={0.75} />
      <Block position={[0, 1.92, 0]} size={[0.24, 0.06, 0.24]} color={color} emissive={color} emissiveIntensity={2} />
      <pointLight position={[0, 1.92, 0]} intensity={0.9} color={color} distance={3.5} decay={2} />
      <Hitbox position={[0, 1.0, 0]} size={[0.5, 2.0, 0.5]} />
    </group>
  );
}

/* ---------------- PANEL DECORATIVO DE PARED ---------------- */

function WallPanel({
  position,
  width,
  height,
  color = COLORS.wallPanel,
}: {
  position: [number, number, number];
  width: number;
  height: number;
  color?: string;
}) {
  return (
    <group position={position}>
      <Block position={[0, 0, 0]} size={[width, height, 0.05]} color={color} roughness={0.9} />
      <Block position={[-width / 2, 0, -0.04]} size={[0.035, height, 0.035]} color={COLORS.blueTrim} emissive={COLORS.blue} emissiveIntensity={0.7} />
      <Block position={[width / 2, 0, -0.04]} size={[0.035, height, 0.035]} color={COLORS.blueTrim} emissive={COLORS.blue} emissiveIntensity={0.7} />
    </group>
  );
}

/* ============================================================
   ROOM PRINCIPAL
   Zonas y física EXACTAS del archivo de referencia:
   - Plataforma superior (dormitorio + escritorio): y = 0.45
   - Piso inferior (sala + comedor): y = 0.115 (hundido -0.45)
   - Escalera central conecta ambos niveles en x=0, z=0.55→3.05
   NOTA: <Player> ya NO se renderiza aquí — vive únicamente en
   Scene.tsx, que es quien necesita su posición para mover la
   cámara. Tenerlo también aquí duplicaba al personaje en pantalla.
============================================================ */

export const Room: React.FC<RoomProps> = React.memo(({ onInteractDesk }) => {
  const interactDesk = useCallback(() => onInteractDesk(), [onInteractDesk]);

  const floorPattern = useMemo(() => Array.from({ length: 20 }, (_, i) => i), []);
  const verticalSeams = useMemo(() => Array.from({ length: 16 }, (_, i) => i), []);

  return (
    <group>
      {/* ======================================================
          1. ARQUITECTURA BASE Y SUELO
      ====================================================== */}

      <Block position={[0, -0.48, 0]} size={[20.0, 0.72, 16.0]} color={COLORS.void} roughness={0.98} />
      <Block position={[0, -0.05, 0]} size={[19.5, 0.2, 15.5]} color={COLORS.floorBase} roughness={0.98} />
      <Block position={[0, 0.08, 0]} size={[19.0, 0.12, 15.0]} color={COLORS.floor} roughness={0.94} />

      {floorPattern.map((i) => (
        <mesh key={`floor-plank-${i}`} position={[0, 0.16, -7.0 + i * 0.88]} receiveShadow>
          <boxGeometry args={[18.5, 0.045, 0.035]} />
          <meshStandardMaterial color={i % 2 ? '#45394a' : '#382f40'} roughness={0.92} />
        </mesh>
      ))}

      {verticalSeams.map((i) => (
        <mesh key={`floor-seam-${i}`} position={[-8.0 + i * 1.05, 0.175, 0]} receiveShadow>
          <boxGeometry args={[0.025, 0.025, 14.5]} />
          <meshStandardMaterial color={COLORS.floorDark} roughness={1} />
        </mesh>
      ))}

      {/* Base elevada perimetral */}
      <Block position={[0, 0.25, -7.5]} size={[19.0, 0.16, 0.28]} color="#4a4051" />
      <Block position={[-9.0, 0.25, 0]} size={[0.28, 0.16, 15.0]} color="#4a4051" />
      <Block position={[9.0, 0.25, 0]} size={[0.28, 0.16, 15.0]} color="#4a4051" />
      <Block position={[0, 0.25, 7.5]} size={[19.0, 0.16, 0.28]} color="#4a4051" />

      {/* Neón perimetral */}
      <Block position={[0, 0.34, -7.2]} size={[17.5, 0.035, 0.045]} color={COLORS.blueTrim} emissive="#4d8dff" emissiveIntensity={1.8} />
      <Block position={[-8.6, 0.34, 0]} size={[0.045, 0.035, 14.2]} color={COLORS.blueTrim} emissive="#4d8dff" emissiveIntensity={1.8} />
      <Block position={[0, 0.34, 7.2]} size={[17.5, 0.035, 0.045]} color={COLORS.blueTrim} emissive="#4d8dff" emissiveIntensity={1.8} />
      <Block position={[8.6, 0.34, 0]} size={[0.045, 0.035, 14.2]} color={COLORS.blueTrim} emissive="#4d8dff" emissiveIntensity={1.8} />

      <Hitbox position={[0, -0.2, 0]} size={[20, 1, 16]} />

      {/* ======================================================
          2. PAREDES, MOLDURAS Y CORNISAS
      ====================================================== */}

      <Block position={[0, 4.5, -7.8]} size={[19.5, 9.0, 0.28]} color={COLORS.wallBack} roughness={0.98} />
      <Block position={[-7.8, 4.5, 0]} size={[0.28, 9.0, 15.5]} color={COLORS.wallSide} roughness={0.98} />
      <Block position={[7.8, 4.5, 0]} size={[0.28, 9.0, 15.5]} color={COLORS.wallSide} roughness={0.98} />

      <Block position={[0, 0.42, -7.5]} size={[19.0, 0.3, 0.26]} color="#04060c" roughness={1} />
      <Block position={[-7.5, 0.42, 0]} size={[0.26, 0.3, 15.0]} color="#04060c" roughness={1} />
      <Block position={[7.5, 0.42, 0]} size={[0.26, 0.3, 15.0]} color="#04060c" roughness={1} />

      <Block position={[0, 3.5, -7.6]} size={[18.5, 1.2, 0.06]} color={COLORS.wallPanel} roughness={0.9} />
      <Block position={[-7.6, 3.5, 0]} size={[0.06, 1.2, 15.0]} color="#152540" roughness={0.9} />
      <Block position={[7.6, 3.5, 0]} size={[0.06, 1.2, 15.0]} color="#152540" roughness={0.9} />

      <Block position={[0, 8.8, -7.6]} size={[19.8, 0.22, 0.42]} color="#060910" roughness={0.96} />
      <Block position={[-7.6, 8.8, 0]} size={[0.42, 0.22, 15.8]} color="#060910" roughness={0.96} />
      <Block position={[7.6, 8.8, 0]} size={[0.42, 0.22, 15.8]} color="#060910" roughness={0.96} />

      {[-6.5, -3.5, -0.5, 2.5, 5.5].map((x) => (
        <Block key={`back-frame-${x}`} position={[x, 4.5, -7.6]} size={[0.055, 7.8, 0.035]} color={COLORS.wallTrim} />
      ))}
      {[-6, -3, 0, 3, 6].map((z) => (
        <Block key={`left-frame-${z}`} position={[-7.6, 4.5, z]} size={[0.035, 7.8, 0.055]} color={COLORS.wallTrim} />
      ))}
      {[-6, -3, 0, 3, 6].map((z) => (
        <Block key={`right-frame-${z}`} position={[7.6, 4.5, z]} size={[0.035, 7.8, 0.055]} color={COLORS.wallTrim} />
      ))}

      <Hitbox position={[0, 4, -7.8]} size={[19.5, 9, 0.5]} />
      <Hitbox position={[-7.8, 4, 0]} size={[0.5, 9, 15.5]} />
      <Hitbox position={[7.8, 4, 0]} size={[0.5, 9, 15.5]} />

      {/* ======================================================
          3. VENTANALES TRASEROS
      ====================================================== */}

      {[-4.5, 0.0, 4.5].map((x) => (
        <React.Fragment key={`window-${x}`}>
          <RoomSprite position={[x, 5.0, -7.6]} crop={C.window} height={2.2} rotation={WALL_ROTATION} depthOffset={0.02} />
          <Block position={[x, 6.1, -7.55]} size={[2.3, 0.1, 0.1]} color="#2d1d1d" />
          <Block position={[x, 3.9, -7.55]} size={[2.3, 0.1, 0.1]} color="#2d1d1d" />
          <Block position={[x - 1.0, 5.0, -7.55]} size={[0.1, 2.2, 0.1]} color="#2d1d1d" />
          <Block position={[x + 1.0, 5.0, -7.55]} size={[0.1, 2.2, 0.1]} color="#2d1d1d" />
          <Block position={[x, 5.0, -7.56]} size={[0.055, 2.1, 0.05]} color="#1a1a24" />
          <Block position={[x, 5.0, -7.56]} size={[2.15, 0.055, 0.05]} color="#1a1a24" />
        </React.Fragment>
      ))}

      {/* ======================================================
          4. PLATAFORMA SUPERIOR — dormitorio + escritorio
          (posición, tamaño y altura EXACTOS del archivo de referencia)
      ====================================================== */}

      {/* Z ajustado para llegar hasta la pared trasera (antes se quedaba
          corta en z=-3.55 y la cama/librero quedaban "flotando" fuera
          de la plataforma visible). Cubre exactamente la zona donde
          getTargetHeight() devuelve UPPER_FLOOR_Y en Player.tsx. */}
      <Platform position={[0, 0, -3.15]} width={15.2} depth={7.2} height={0.45} topColor="#1a1420" step={false} />

      {/* ---- Dormitorio (ancla física: -4.4, 0.565, -3.85) ---- */}

      <group position={[-4.4, 0.565, -3.85]}>
        <Block position={[0, 0.02, 0]} size={[4.8, 0.04, 4.2]} color="#1a1520" roughness={1} />
        <Block position={[0, 0.04, 0]} size={[4.4, 0.02, 3.8]} color="#2a1f30" roughness={1} />
        <Block position={[0, 0.05, 0]} size={[4.3, 0.01, 3.7]} color="#3a2c42" roughness={1} />

        <Leg offsetX={-1.8} offsetZ={-1.5} h={0.3} thickness={0.2} />
        <Leg offsetX={1.8} offsetZ={-1.5} h={0.3} thickness={0.2} />
        <Leg offsetX={-1.8} offsetZ={1.5} h={0.3} thickness={0.2} />
        <Leg offsetX={1.8} offsetZ={1.5} h={0.3} thickness={0.2} />

        <Block position={[0, 0.35, 0]} size={[3.8, 0.2, 3.0]} color="#08090f" roughness={1} />
        <Block position={[0, 0.55, 0]} size={[3.6, 0.3, 2.8]} color="#3a2527" roughness={0.86} />
        <Block position={[0, 0.72, 0]} size={[3.4, 0.08, 2.6]} color="#7c5135" roughness={0.78} />

        <Block position={[0, 1.2, -1.5]} size={[3.8, 1.2, 0.28]} color="#392528" roughness={0.9} />
        <Block position={[0, 1.85, -1.5]} size={[3.9, 0.1, 0.35]} color="#2a1a1b" roughness={0.9} />
        <Block position={[-1.2, 1.4, -1.35]} size={[0.1, 0.8, 0.05]} color="#2a1a1b" roughness={0.9} />
        <Block position={[1.2, 1.4, -1.35]} size={[0.1, 0.8, 0.05]} color="#2a1a1b" roughness={0.9} />

        <Block position={[-0.8, 0.85, -1.2]} size={[0.9, 0.15, 0.6]} color="#5a3a3a" roughness={0.8} />
        <Block position={[0.8, 0.85, -1.2]} size={[0.9, 0.15, 0.6]} color="#5a3a3a" roughness={0.8} />
        <Block position={[-0.8, 0.93, -1.2]} size={[0.8, 0.08, 0.5]} color="#6a4a4a" roughness={0.8} />
        <Block position={[0.8, 0.93, -1.2]} size={[0.8, 0.08, 0.5]} color="#6a4a4a" roughness={0.8} />

        <Block position={[0, 0.85, 0.8]} size={[2.0, 0.08, 0.8]} color={COLORS.purple} roughness={0.8} />
        <Block position={[0, 0.85, 1.1]} size={[2.0, 0.05, 0.2]} color="#7c4cf6" roughness={0.8} />

        <RoomSprite position={[0, 0.85, 0.2]} crop={C.bed} height={2.0} rotation={FLOOR_ROTATION} depthOffset={0.08} />
        <RoomSprite position={[0, 0.9, 0.3]} crop={C.sleepingCats} height={0.8} rotation={FLOOR_ROTATION} depthOffset={0.02} />

        <Hitbox position={[0, 0.6, 0]} size={[3.8, 1.2, 3.0]} />
      </group>

      {/* Mesita de noche (ancla original) */}
      <group position={[-0.95, 0.565, -5.8]}>
        <Block position={[0, 0.48, 0]} size={[1.0, 0.86, 0.8]} color="#2d1d1d" roughness={0.92} />
        <Block position={[0, 0.3, 0]} size={[0.9, 0.05, 0.7]} color="#1f1515" roughness={0.9} />
        <Block position={[-0.45, 0.48, 0.4]} size={[0.1, 0.1, 0.02]} color="#000000" />
        <Block position={[-0.45, 0.25, 0.4]} size={[0.1, 0.1, 0.02]} color="#000000" />
        <Block position={[0, 0.96, 0]} size={[1.1, 0.12, 0.9]} color="#795039" roughness={0.76} />
        <DeskLamp position={[0, 1.02, 0]} color={COLORS.orange} intensity={1.5} />
        <RoomSprite position={[0.35, 1.1, 0.15]} crop={H.deskGlobe} sheet="house" height={0.3} rotation={FLOOR_ROTATION} />
        <Hitbox position={[0, 0.5, 0]} size={[1.1, 1.0, 0.9]} />
      </group>

      {/* -- Extra: armario del dormitorio --
          Verificado contra Player.tsx: su huella (tras rotar 90°) cae
          por completo dentro del colchón de colisión de "left-wall" +
          "back-wall", así que no genera zonas atravesables. Se quitó
          la Dresser y la SideTable sueltas que SÍ sobresalían de
          cualquier collider (el jugador las atravesaba). */}
      <Wardrobe position={[-7.0, 0.565, -5.9]} width={1.75} height={2.5} depth={0.65} rotation={Math.PI / 2} />
      <RoomSprite position={[-7.55, 2.0, -1.8]} crop={H.hoodie} sheet="house" height={0.6} rotation={LEFT_WALL_ROTATION} depthOffset={0.02} />

      {/* Mochila y patineta — reposicionadas para coincidir EXACTAMENTE
          con los colliders "backpack" y "skateboard" de Player.tsx
          (antes estaban en z=5.5/4.5, dentro de la zona del comedor,
          sin ningún collider ahí: el jugador las atravesaba, y a la
          vez chocaba contra una pared invisible junto a la escalera
          donde en realidad SÍ existen esos colliders). */}
      <RoomSprite position={[-6.55, 2.45, -0.675]} crop={C.skateboard} height={1.5} rotation={LEFT_WALL_ROTATION} depthOffset={0.02} />
      <RoomSprite position={[-6.35, 1.45, 0.26]} crop={C.backpack} height={0.8} rotation={LEFT_WALL_ROTATION} depthOffset={0.02} />

      <RoomSprite position={[-7.6, 5.5, -5.0]} crop={C.cityPrint} height={1.0} rotation={LEFT_WALL_ROTATION} depthOffset={0.02} />
      <RoomSprite position={[-7.6, 5.5, -2.6]} crop={C.pinkNote} height={0.65} rotation={LEFT_WALL_ROTATION} depthOffset={0.02} />

      {/* ======================================================
          5. ESCRITORIO GAMING (ancla física: 3.25, 0.565, -4.90)
      ====================================================== */}

      <group position={[3.25, 0.565, -4.9]} onClick={interactDesk}>
        <WoodTable position={[0, 0, 0]} width={4.2} depth={2.2} height={1.05} />

        <Block position={[1.7, 1.05, -0.8]} size={[0.6, 0.5, 0.6]} color="#0f0f0f" roughness={0.4} metalness={0.6} />
        <Block position={[1.7, 1.3, -0.8]} size={[0.5, 0.7, 0.5]} color="#111111" roughness={0.4} metalness={0.6} />
        <Block position={[1.7, 1.3, -0.55]} size={[0.45, 0.6, 0.02]} color={COLORS.blue} emissive={COLORS.blue} emissiveIntensity={2.0} />
        <Block position={[1.7, 1.3, -1.05]} size={[0.45, 0.6, 0.02]} color={COLORS.blue} emissive={COLORS.blue} emissiveIntensity={2.0} />

        <RoomSprite position={[-1.6, 1.38, -0.6]} crop={C.laptop} height={0.9} depthOffset={0.04} />
        <RoomSprite position={[-0.3, 1.45, -0.6]} crop={C.monitor} height={1.2} depthOffset={0.05} />
        <RoomSprite position={[1.0, 1.38, -0.6]} crop={C.sideMonitor} height={1.1} depthOffset={0.05} />

        <RoomSprite position={[-1.2, 1.1, 0.7]} crop={C.keyboard} height={0.32} rotation={FLOOR_ROTATION} />
        <RoomSprite position={[0.0, 1.1, 0.7]} crop={C.mousePad} height={0.28} rotation={FLOOR_ROTATION} />
        <RoomSprite position={[0.6, 1.1, 0.7]} crop={C.mouse} height={0.2} rotation={FLOOR_ROTATION} />

        <RoomSprite position={[1.8, 1.12, 0.7]} crop={C.phone} height={0.28} rotation={FLOOR_ROTATION} />
        <RoomSprite position={[-2.0, 1.15, 0.5]} crop={C.pencilCup} height={0.35} />
        <RoomSprite position={[2.2, 1.65, -0.2]} crop={C.deskLamp} height={0.9} depthOffset={0.04} />
        <RoomSprite position={[2.0, 1.15, 0.7]} crop={C.camera} height={0.24} rotation={FLOOR_ROTATION} />

        <DeskLamp position={[-2.0, 1.1, -0.5]} color={COLORS.blue} intensity={2.0} rotation={Math.PI / 2} />

        {/* Barra LED trasera */}
        <Block position={[0, 1.16, -0.95]} size={[3.6, 0.035, 0.035]} color={COLORS.blue} emissive={COLORS.blue} emissiveIntensity={2.5} />
      </group>

      <Chair position={[3.25, 0.565, -3.12]} rotation={Math.PI} variant={1} />

      {/* -- Extra: estante y librero sobre el escritorio -- */}
      <WallShelf position={[3.25, 4.0, -7.5]} width={3.0} depth={0.25} />
      <RoomSprite position={[2.4, 4.25, -7.35]} crop={C.plant} height={0.6} rotation={WALL_ROTATION} />
      <RoomSprite position={[3.25, 4.25, -7.35]} crop={C.cameraLarge} height={0.45} rotation={WALL_ROTATION} />
      <RoomSprite position={[4.1, 4.25, -7.35]} crop={C.books} height={0.45} rotation={WALL_ROTATION} />

      {/* Z corregido a -7.05 (antes -6.6): con depth=0.42 el librero
          sobresalía ~1.15 m fuera del colchón de "back-wall"
          (Z -7.34/-6.70), quedando parcialmente atravesable. */}
      <Bookcase position={[6.9, 0.565, -7.05]} width={1.5} height={2.2} depth={0.42} />
      <RoomSprite position={[6.9, 2.85, -7.05]} crop={H.aquarium} sheet="house" height={0.45} rotation={FLOOR_ROTATION} />

      <RoomSprite position={[7.6, 5.5, -3.5]} crop={C.todo} height={1.0} rotation={RIGHT_WALL_ROTATION} depthOffset={0.02} />
      <RoomSprite position={[7.6, 5.5, -1.0]} crop={C.ideas} height={0.85} rotation={RIGHT_WALL_ROTATION} depthOffset={0.02} />
      <RoomSprite position={[7.6, 5.5, 1.5]} crop={H.mountainPoster} sheet="house" height={1.2} rotation={RIGHT_WALL_ROTATION} depthOffset={0.02} />

      {/* ======================================================
          6. ESCALERA CENTRAL (ancla y altura EXACTAS)
      ====================================================== */}

      <Stairs position={[0, 0.45, 0.55]} steps={5} width={2.56} depth={0.5} height={-0.09} color="#2a1f2e" />

      {/* ======================================================
          7. PLATAFORMA INFERIOR — sala + comedor
          (posición, tamaño y altura EXACTOS del archivo de referencia)
      ====================================================== */}

      <Platform position={[0, 0, 4.8]} width={15.2} depth={5.0} height={-0.45} topColor="#251a16" step={false} />

      {/* ---- Sala de estar (ancla física: -5.16, 0.115, 4.33) ---- */}

      <group position={[-5.16, 0.115, 4.33]}>
        <Block position={[0, 0.03, 0]} size={[4.5, 0.06, 3.5]} color="#1a1520" roughness={1} />
        <Block position={[0, 0.05, 0]} size={[4.4, 0.02, 3.4]} color="#251c2e" roughness={1} />

        <Block position={[0, 0.35, 0]} size={[2.8, 0.7, 1.6]} color={COLORS.sofa} roughness={0.96} />
        <Block position={[0, 0.9, -0.75]} size={[2.8, 1.0, 0.15]} color={COLORS.sofaDark} roughness={0.96} />
        <Block position={[0, 0.8, -0.65]} size={[2.8, 0.4, 0.15]} color={COLORS.sofa} roughness={0.96} />
        <Block position={[0, 0.25, 0.2]} size={[2.6, 0.4, 1.3]} color="#3a3043" roughness={0.9} />

        <Block position={[-1.4, 0.65, 0]} size={[0.15, 0.8, 1.6]} color={COLORS.sofaDark} roughness={0.96} />
        <Block position={[1.4, 0.65, 0]} size={[0.15, 0.8, 1.6]} color={COLORS.sofaDark} roughness={0.96} />

        <Block position={[-0.7, 0.65, 0.55]} size={[0.5, 0.3, 0.1]} color={COLORS.purple} roughness={0.9} />
        <Block position={[0.7, 0.65, 0.55]} size={[0.5, 0.3, 0.1]} color="#5e8fb1" roughness={0.9} />

        <RoomSprite position={[0, 0.65, 0.4]} crop={C.couchCats} height={0.6} rotation={FLOOR_ROTATION} depthOffset={0.02} />
        <RoomSprite position={[0.9, 0.85, 0.35]} crop={H.pillows} sheet="house" height={0.35} rotation={FLOOR_ROTATION} depthOffset={0.02} />

        <Hitbox position={[0, 0.4, 0]} size={[2.8, 0.9, 1.6]} />
        <Hitbox position={[0, 0.8, -0.75]} size={[2.8, 1.2, 0.2]} />
        <Hitbox position={[-1.4, 0.6, 0]} size={[0.2, 1.0, 1.6]} />
        <Hitbox position={[1.4, 0.6, 0]} size={[0.2, 1.0, 1.6]} />
      </group>

      {/* Mesa de centro con TV, snacks y consola (ancla original) */}
      <WoodTable position={[-2.15, 0.115, 4.28]} width={1.8} depth={1.2} height={0.55} />
      <RoomSprite position={[-2.15, 0.68, 4.28]} crop={C.coffee} height={0.3} rotation={FLOOR_ROTATION} />

      <Block position={[-2.15, 0.75, 4.05]} size={[1.0, 0.5, 0.1]} color="#000000" roughness={0.3} />
      <Block position={[-2.15, 0.75, 4.0]} size={[0.9, 0.4, 0.02]} color={COLORS.blue} emissive={COLORS.blue} emissiveIntensity={1.5} />
      <RoomSprite position={[-2.15, 0.65, 4.5]} crop={C.console} height={0.25} rotation={FLOOR_ROTATION} />

      <RoomSprite position={[-1.65, 0.65, 4.28]} crop={C.burger} height={0.25} rotation={FLOOR_ROTATION} />
      <RoomSprite position={[-2.65, 0.65, 4.28]} crop={C.drink} height={0.25} rotation={FLOOR_ROTATION} />
      <RoomSprite position={[-2.35, 0.65, 4.5]} crop={C.bowl} height={0.25} rotation={FLOOR_ROTATION} />

      {/* -- Extra: lámpara de pie junto a la sala --
          (verificada: cae dentro del colchón de "left-wall". Se quitó
          el Pouf que tenía aquí porque no caía dentro de ningún
          collider — sofá, mesa de centro y pared frontal quedaban
          todos a más de 0.6 m de él — así que el jugador lo
          atravesaba.) */}
      <FloorLamp position={[-7.0, 0.115, 6.6]} color={COLORS.purple} />
      <RoomSprite position={[-7.6, 5.5, 6.5]} crop={C.purpleNote} height={0.65} rotation={LEFT_WALL_ROTATION} depthOffset={0.02} />

      {/* -- Extra: rincón del gato junto a la sala -- */}
      <RoomSprite position={[-7.4, 0.115, 2.7]} crop={H.catTree} sheet="house" height={1.85} billboard />
      <RoomSprite position={[-7.1, 0.14, 3.3]} crop={H.petBowls} sheet="house" height={0.22} rotation={FLOOR_ROTATION} />
      <RoomSprite position={[-3.6, 0.13, 6.6]} crop={H.beanBag} sheet="house" height={0.55} rotation={FLOOR_ROTATION} />

      {/* ======================================================
          8. COMEDOR (ancla física: 4.55, 0.115, 4.30)
      ====================================================== */}

      <group position={[4.55, 0.115, 4.3]}>
        <Block position={[0, 0.03, 0]} size={[3.5, 0.06, 3.0]} color="#14100e" roughness={1} />
        <Block position={[0, 0.05, 0]} size={[3.4, 0.02, 2.9]} color="#1c1714" roughness={1} />
        {Array.from({ length: 4 }, (_, i) => (
          <Block key={`tile-${i}`} position={[-1.2 + i * 0.8, 0.06, 0]} size={[0.7, 0.01, 2.8]} color="#2a211d" roughness={1} />
        ))}

        <WoodTable position={[0, 0, 0]} width={2.8} depth={1.8} height={0.82} />

        <RoomSprite position={[-0.8, 0.92, -0.3]} crop={C.pizza} height={0.3} rotation={FLOOR_ROTATION} />
        <RoomSprite position={[0.0, 0.92, -0.3]} crop={C.burger} height={0.28} rotation={FLOOR_ROTATION} />
        <RoomSprite position={[0.8, 0.92, -0.3]} crop={C.bowl} height={0.28} rotation={FLOOR_ROTATION} />
        <RoomSprite position={[-0.8, 0.93, 0.3]} crop={C.drink} height={0.3} rotation={FLOOR_ROTATION} />
        <RoomSprite position={[0.8, 0.93, 0.3]} crop={C.glass} height={0.28} rotation={FLOOR_ROTATION} />
        <RoomSprite position={[0.0, 0.95, 0.0]} crop={C.vase} height={0.4} rotation={FLOOR_ROTATION} />

        <Chair position={[0, 0, -1.4]} rotation={0} variant={0} />
        <Chair position={[0, 0, 1.4]} rotation={Math.PI} variant={2} />
        <Chair position={[1.8, 0, 0]} rotation={Math.PI / 2} variant={1} />
        <Chair position={[-1.8, 0, 0]} rotation={-Math.PI / 2} variant={0} />
      </group>

      {/* Estantería del comedor (ancla original) */}
      <WallShelf position={[7.6, 3.0, 3.5]} width={2.0} depth={0.3} />
      <RoomSprite position={[7.6, 3.2, 4.0]} crop={C.plant} height={0.5} rotation={RIGHT_WALL_ROTATION} depthOffset={0.01} />
      <RoomSprite position={[7.6, 3.2, 3.0]} crop={C.globe} height={0.4} rotation={RIGHT_WALL_ROTATION} depthOffset={0.01} />
      <RoomSprite position={[7.6, 3.2, 2.0]} crop={C.books} height={0.5} rotation={RIGHT_WALL_ROTATION} depthOffset={0.01} />
      <RoomSprite position={[7.6, 5.5, 6.5]} crop={C.greenNote} height={0.6} rotation={RIGHT_WALL_ROTATION} depthOffset={0.02} />

      {/* Planta grande junto al comedor — X corregido de 8.5 a 7.6:
          8.5 caía FUERA de la pared derecha (el muro visual está en
          x=7.8 y el collider "right-boundary" llega hasta x=8.08),
          así que la maceta flotaba fuera del cuarto. */}
      <RoomSprite position={[7.6, 0.115, 5.9]} crop={C.plantLarge} height={1.4} billboard />
      <Block position={[7.6, 0.2, 5.9]} size={[1.0, 0.7, 1.0]} color="#2d1d1d" roughness={0.9} />
      <Block position={[7.6, 0.6, 5.9]} size={[0.8, 0.1, 0.8]} color="#1f1515" roughness={0.9} />

      {/* -- Extra: mini refrigerador y planta alta junto al comedor -- */}
      <RoomSprite position={[6.6, 0.115, 6.8]} crop={H.miniFridge} sheet="house" height={1.05} billboard />
      <RoomSprite position={[1.2, 0.115, 6.7]} crop={H.tallPlant} sheet="house" height={2.2} billboard />

      {/* ======================================================
          8.5 PARED FRONTAL — estante (faltaba por completo)
          Player.tsx define el collider "front-wall-shelf"
          (X 2.00–7.30, Z 6.35–7.05) pero ningún archivo anterior
          tenía nada renderizado ahí: por eso el jugador chocaba con
          una "pared invisible" cerca de la mesa del comedor.
      ====================================================== */}

      <WallShelf position={[4.65, 3.2, 6.9]} width={5.0} depth={0.3} />
      <RoomSprite position={[3.3, 3.4, 6.75]} crop={C.plant} height={0.5} rotation={FRONT_WALL_ROTATION} depthOffset={0.01} />
      <RoomSprite position={[4.65, 3.4, 6.75]} crop={C.ideas} height={0.42} rotation={FRONT_WALL_ROTATION} depthOffset={0.01} />
      <RoomSprite position={[6.0, 3.4, 6.75]} crop={C.globe} height={0.4} rotation={FRONT_WALL_ROTATION} depthOffset={0.01} />
      <RoomSprite position={[2.2, 3.35, 6.75]} crop={H.recordPlayer} sheet="house" height={0.4} rotation={FRONT_WALL_ROTATION} depthOffset={0.01} />

      {/* ======================================================
          9. DECORACIÓN PARED TRASERA (ancla original)
      ====================================================== */}

      <RoomSprite position={[-2.5, 6.0, -7.6]} crop={C.poster} height={1.8} rotation={WALL_ROTATION} depthOffset={0.02} />
      <RoomSprite position={[2.5, 6.0, -7.6]} crop={C.map} height={1.8} rotation={WALL_ROTATION} depthOffset={0.02} />
      <RoomSprite position={[-5.5, 6.5, -7.6]} crop={C.guitar} height={2.2} rotation={WALL_ROTATION} depthOffset={0.02} />
      <RoomSprite position={[5.5, 6.5, -7.6]} crop={C.board} height={2.2} rotation={WALL_ROTATION} depthOffset={0.02} />
      <RoomSprite position={[-2.25, 6.6, -7.6]} crop={H.hangingPlant} sheet="house" height={1.6} rotation={WALL_ROTATION} depthOffset={0.02} />

      <Block position={[-2.5, 6.0, -7.55]} size={[1.9, 1.9, 0.1]} color="#1f1515" />
      <Block position={[2.5, 6.0, -7.55]} size={[1.9, 1.9, 0.1]} color="#1f1515" />

      <WallPanel position={[0, 7.4, -7.6]} width={7.5} height={0.8} color="#10192c" />
      <Block position={[0, 7.4, -7.53]} size={[5.0, 0.025, 0.025]} color={COLORS.blue} emissive={COLORS.blue} emissiveIntensity={2} />

      <RoomSprite position={[-7.6, 5.5, -4.0]} crop={C.cityPrint} height={1.0} rotation={LEFT_WALL_ROTATION} depthOffset={0.02} />
      <RoomSprite position={[-7.6, 5.5, 4.0]} crop={C.cityPrint} height={1.0} rotation={LEFT_WALL_ROTATION} depthOffset={0.02} />

      <RoomSprite position={[7.6, 5.5, -4.0]} crop={C.todo} height={1.0} rotation={RIGHT_WALL_ROTATION} depthOffset={0.02} />
      <RoomSprite position={[7.6, 5.5, 4.0]} crop={C.todo} height={1.0} rotation={RIGHT_WALL_ROTATION} depthOffset={0.02} />

      {/* ======================================================
          10. ILUMINACIÓN
      ====================================================== */}

      <pointLight position={[-4.0, 3.0, -3.5]} intensity={1.2} color={COLORS.orange} distance={5.0} decay={2} />
      <pointLight position={[3.25, 2.8, -4.9]} intensity={2.0} color={COLORS.blue} distance={5.0} decay={2} />
      <pointLight position={[-5.16, 3.0, 4.33]} intensity={1.0} color={COLORS.purple} distance={5.0} decay={2} />
      <pointLight position={[4.55, 3.0, 4.3]} intensity={1.4} color={COLORS.warm} distance={5.0} decay={2} />

      <pointLight position={[0, 6.0, -6.0]} intensity={0.4} color="#ffffff" distance={4.0} decay={2} />
      <pointLight position={[-7.0, 5.0, 0]} intensity={0.3} color={COLORS.purple} distance={4.0} decay={2} />
      <pointLight position={[7.0, 5.0, 0]} intensity={0.3} color={COLORS.warm} distance={4.0} decay={2} />
      <pointLight position={[0, 5.5, 0]} intensity={0.45} color="#b7c7ff" distance={7} decay={2} />

      <ambientLight intensity={0.35} color="#444466" />
      <hemisphereLight intensity={0.2} color="#c7d9ff" groundColor="#050811" />
    </group>
  );
});

Room.displayName = 'Room';

export default Room;