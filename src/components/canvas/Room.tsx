import React, { useCallback } from 'react';
import { Player } from './Player';
import { RoomSprite } from './RoomProps';

interface RoomProps { onInteractDesk: () => void; }
type V3 = [number, number, number];

const FLOOR: V3 = [-Math.PI / 2, 0, 0];
const BACK: V3 = [0, 0, 0];
const LEFT: V3 = [0, Math.PI / 2, 0];

/* Measured against the actual 1536x1024 room-props atlas. */
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
  { p: [-2.85, 3.45, -4.69], c: 'board', h: 1.82 },
  { p: [-0.15, 3.45, -4.68], c: 'window', h: 1.85 },
  { p: [2.05, 3.50, -4.67], c: 'poster', h: 1.48 },
  { p: [3.20, 3.10, -4.66], c: 'plant', h: 1.68 },
  { p: [4.18, 2.72, -4.65], c: 'guitar', h: 2.02 },
  { p: [3.15, 2.18, -4.64], c: 'wallShelf', h: 1.10 },
  { p: [3.00, 1.55, -4.63], c: 'todo', h: 1.02 },
  { p: [4.00, 1.52, -4.62], c: 'map', h: 1.18 },
  { p: [-4.72, 3.25, -2.55], c: 'board', h: 1.30, r: LEFT },
];

export const Room: React.FC<RoomProps> = React.memo(({ onInteractDesk }) => {
  const interactDesk = useCallback(() => onInteractDesk(), [onInteractDesk]);

  return (
    <group>
      {/* ========================= 2.5D FOUNDATION ========================= */}
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
      <mesh position={[-1, 0.22, 1.55]} castShadow receiveShadow>
        <boxGeometry args={[7.75, 0.16, 4.95]} />
        <meshStandardMaterial color="#171520" roughness={1} />
      </mesh>
      <mesh position={[-1, 0.315, 1.55]} receiveShadow>
        <boxGeometry args={[7.48, 0.035, 4.68]} />
        <meshStandardMaterial color="#302b3b" roughness={1} />
      </mesh>
      <mesh position={[-1, 0.35, 1.55]}>
        <boxGeometry args={[7.28, 0.018, 4.48]} />
        <meshStandardMaterial color="#3c3549" roughness={1} />
      </mesh>
      {([[-4.68, 0.25, 0], [0, 0.25, -4.68], [0, 0.25, 4.68]] as V3[]).map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={i === 0 ? [0.055, 0.035, 9.55] : [9.55, 0.035, 0.055]} />
          <meshStandardMaterial color="#3182ff" emissive="#3182ff" emissiveIntensity={1.9} toneMapped={false} />
        </mesh>
      ))}

      {/* ========================= WALLS ========================= */}
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

      {/* ========================= ATLAS WALL PROPS ========================= */}
      {wallProps.map(({ p, c, h, r = BACK }) => (
        <RoomSprite key={`${c}-${p.join('-')}`} position={p} crop={C[c]} height={h} rotation={r} depthOffset={0.03} />
      ))}

      {/* ========================= BED ========================= */}
      <group position={[-2.25, 0, -2.20]}>
        <mesh position={[0, 0.18, 0]} castShadow receiveShadow><boxGeometry args={[3.90, 0.38, 3.48]} /><meshStandardMaterial color="#090910" roughness={1} /></mesh>
        <mesh position={[0, 0.39, 0]} castShadow receiveShadow><boxGeometry args={[3.62, 0.18, 3.18]} /><meshStandardMaterial color="#382426" roughness={0.88} /></mesh>
        <mesh position={[0, 0.50, 0]}><boxGeometry args={[3.42, 0.07, 2.98]} /><meshStandardMaterial color="#69472f" roughness={0.80} /></mesh>
        <mesh position={[0, 0.98, -1.52]} castShadow receiveShadow><boxGeometry args={[3.55, 1.10, 0.24]} /><meshStandardMaterial color="#3c2727" roughness={0.90} /></mesh>
        <mesh position={[0, 1.48, -1.60]} castShadow><boxGeometry args={[3.74, 0.18, 0.34]} /><meshStandardMaterial color="#7e5638" roughness={0.74} /></mesh>
        <mesh position={[0, 1.34, -1.74]}><boxGeometry args={[3.30, 0.04, 0.025]} /><meshStandardMaterial color="#b27848" /></mesh>
        <RoomSprite position={[0, 0.58, 0.02]} crop={C.bed} height={2.72} rotation={FLOOR} depthOffset={0.07} />
      </group>

      {/* Bedside table: coffee + lamp are physically on top. */}
      <group position={[-0.15, 0, -3.62]}>
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow><boxGeometry args={[0.92, 0.78, 0.76]} /><meshStandardMaterial color="#34201e" roughness={0.92} /></mesh>
        <mesh position={[0, 0.84, 0]} castShadow><boxGeometry args={[1.05, 0.12, 0.84]} /><meshStandardMaterial color="#795039" roughness={0.78} /></mesh>
        <mesh position={[0, 1.18, 0]}><cylinderGeometry args={[0.045, 0.045, 0.28, 8]} /><meshStandardMaterial color="#14131a" /></mesh>
        <mesh position={[0, 1.38, 0]}><coneGeometry args={[0.21, 0.23, 8]} /><meshStandardMaterial color="#d88f45" emissive="#ff9f43" emissiveIntensity={0.4} /></mesh>
        <RoomSprite position={[0, 0.98, 0.20]} crop={C.coffee} height={0.30} depthOffset={0.02} />
        <pointLight position={[0, 1.40, 0.08]} intensity={0.42} color="#ffb15a" distance={2.5} decay={2} />
      </group>

      {/* ========================= WORKSTATION ========================= */}
      <group position={[1.95, 0, -3.52]} onClick={interactDesk}>
        <mesh position={[-1.72, 0.45, 0]} castShadow receiveShadow><boxGeometry args={[0.86, 0.80, 0.88]} /><meshStandardMaterial color="#291918" roughness={0.94} /></mesh>
        <mesh position={[1.72, 0.45, 0]} castShadow receiveShadow><boxGeometry args={[0.86, 0.80, 0.88]} /><meshStandardMaterial color="#291918" roughness={0.94} /></mesh>
        <mesh position={[0, 0.96, 0]} castShadow receiveShadow><boxGeometry args={[5.18, 0.22, 1.16]} /><meshStandardMaterial color="#71492f" roughness={0.76} /></mesh>
        <mesh position={[0, 0.82, -0.56]}><boxGeometry args={[4.84, 0.13, 0.10]} /><meshStandardMaterial color="#925e39" roughness={0.74} /></mesh>
        <mesh position={[0, 1.08, 0.45]}><boxGeometry args={[4.85, 0.07, 0.07]} /><meshStandardMaterial color="#9f6c43" /></mesh>
        <mesh position={[0, 0.15, -0.44]}><boxGeometry args={[4.28, 0.05, 0.035]} /><meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.5} toneMapped={false} /></mesh>
        <RoomSprite position={[-1.65, 1.43, -0.08]} crop={C.laptop} height={1.06} depthOffset={0.08} />
        <RoomSprite position={[-0.05, 1.56, -0.08]} crop={C.monitor} height={1.20} depthOffset={0.082} />
        <RoomSprite position={[1.40, 1.54, -0.07]} crop={C.sideMonitor} height={1.18} depthOffset={0.084} />
        <RoomSprite position={[2.12, 1.28, 0.16]} crop={C.deskLamp} height={1.10} depthOffset={0.086} />
        <RoomSprite position={[0.10, 1.16, 0.38]} crop={C.keyboard} height={0.34} rotation={FLOOR} depthOffset={0.088} />
        <RoomSprite position={[1.35, 1.16, 0.37]} crop={C.mousePad} height={0.30} rotation={FLOOR} depthOffset={0.09} />
        <RoomSprite position={[1.62, 1.18, 0.38]} crop={C.mouse} height={0.28} rotation={FLOOR} depthOffset={0.092} />
        <RoomSprite position={[-0.75, 1.18, 0.37]} crop={C.camera} height={0.26} depthOffset={0.094} />
        <RoomSprite position={[2.00, 1.18, 0.34]} crop={C.phone} height={0.25} rotation={FLOOR} depthOffset={0.096} />
        <RoomSprite position={[2.40, 1.23, 0.28]} crop={C.pencilCup} height={0.30} depthOffset={0.098} />
      </group>

      {/* ========================= CHAIR ========================= */}
      <group position={[1.65, 0.28, -2.05]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0,0.70,0]} castShadow receiveShadow><boxGeometry args={[1.18,0.18,1.05]} /><meshStandardMaterial color="#20212b" roughness={0.86}/></mesh>
        <mesh position={[0,1.28,0.36]} castShadow><boxGeometry args={[1.08,1.12,0.22]} /><meshStandardMaterial color="#151720" roughness={0.88}/></mesh>
        <mesh position={[0,1.18,0.22]}><boxGeometry args={[0.60,0.68,0.045]} /><meshStandardMaterial color="#303343" /></mesh>
        <mesh position={[-0.62,0.88,0]}><boxGeometry args={[0.14,0.12,0.68]} /><meshStandardMaterial color="#11131b"/></mesh>
        <mesh position={[0.62,0.88,0]}><boxGeometry args={[0.14,0.12,0.68]} /><meshStandardMaterial color="#11131b"/></mesh>
        <mesh position={[0,0.42,0]}><cylinderGeometry args={[0.08,0.08,0.42,8]} /><meshStandardMaterial color="#101119" metalness={0.5}/></mesh>
        <mesh position={[-0.42,0.18,0]}><boxGeometry args={[0.70,0.08,0.10]} /><meshStandardMaterial color="#11131b"/></mesh>
        <mesh position={[0.42,0.18,0]}><boxGeometry args={[0.70,0.08,0.10]} /><meshStandardMaterial color="#11131b"/></mesh>
      </group>

      {/* ========================= SOFA + COFFEE TABLE ========================= */}
      <group position={[-3.10, 0, 1.95]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0,0.46,0]} castShadow receiveShadow><boxGeometry args={[2.82,0.74,1.42]} /><meshStandardMaterial color="#20202d" roughness={0.95}/></mesh>
        <mesh position={[0,1.06,-0.48]} castShadow><boxGeometry args={[2.84,1.12,0.25]} /><meshStandardMaterial color="#171722" roughness={0.97}/></mesh>
        <mesh position={[-1.20,0.84,0]}><boxGeometry args={[0.28,0.92,1.48]} /><meshStandardMaterial color="#191923"/></mesh>
        <mesh position={[1.20,0.84,0]}><boxGeometry args={[0.28,0.92,1.48]} /><meshStandardMaterial color="#191923"/></mesh>
        <mesh position={[-0.65,0.84,0.15]}><boxGeometry args={[1.06,0.30,0.92]} /><meshStandardMaterial color="#303044"/></mesh>
        <mesh position={[0.65,0.84,0.15]}><boxGeometry args={[1.06,0.30,0.92]} /><meshStandardMaterial color="#303044"/></mesh>
        <RoomSprite position={[0.10,1.22,-0.56]} crop={C.couchCats} height={0.52} depthOffset={0.10}/>
      </group>

      <group position={[-0.85, 0, 1.35]}>
        <mesh position={[0,0.52,0]} castShadow receiveShadow><boxGeometry args={[2.45,0.18,1.40]} /><meshStandardMaterial color="#5e3928" roughness={0.80}/></mesh>
        {([[-0.92,0.20,-0.48],[0.92,0.20,-0.48],[-0.92,0.20,0.48],[0.92,0.20,0.48]] as V3[]).map((p,i)=><mesh key={i} position={p}><boxGeometry args={[0.14,0.40,0.14]}/><meshStandardMaterial color="#38231e"/></mesh>)}
        <RoomSprite position={[-0.62,0.64,-0.14]} crop={C.burger} height={0.30} rotation={FLOOR} depthOffset={0.11}/>
        <RoomSprite position={[0.05,0.64,0.12]} crop={C.pizza} height={0.29} rotation={FLOOR} depthOffset={0.112}/>
        <RoomSprite position={[0.58,0.64,-0.20]} crop={C.drink} height={0.28} depthOffset={0.114}/>
        <RoomSprite position={[0.76,0.64,0.20]} crop={C.bowl} height={0.26} rotation={FLOOR} depthOffset={0.116}/>
      </group>

      {/* ========================= STORAGE / PERSONAL CORNER ========================= */}
      <group position={[3.55,0,1.72]}>
        <mesh position={[0,0.72,0]} castShadow receiveShadow><boxGeometry args={[1.34,1.38,0.72]}/><meshStandardMaterial color="#241817" roughness={0.95}/></mesh>
        {[0.35,0.78,1.21].map(y=><mesh key={y} position={[0,y,-0.38]}><boxGeometry args={[1.02,0.055,0.025]}/><meshStandardMaterial color="#76513c"/></mesh>)}
        <mesh position={[0,1.48,0]}><boxGeometry args={[1.48,0.11,0.82]}/><meshStandardMaterial color="#6f4930"/></mesh>
        <RoomSprite position={[-0.15,1.55,-0.40]} crop={C.books} height={0.56} depthOffset={0.12}/>
        <RoomSprite position={[0.30,1.52,-0.38]} crop={C.plantLarge} height={0.48} depthOffset={0.122}/>
      </group>

      {/* Personal items are no longer random: they form a deliberate entry / media zone. */}
      <RoomSprite position={[-4.05,0.46,0.15]} crop={C.skateboard} height={1.42} rotation={FLOOR} depthOffset={0.04}/>
      <RoomSprite position={[-3.30,0.48,0.48]} crop={C.backpack} height={0.92} rotation={FLOOR} depthOffset={0.042}/>
      <RoomSprite position={[3.55,0.48,2.75]} crop={C.console} height={0.62} rotation={FLOOR} depthOffset={0.044}/>
      <RoomSprite position={[4.18,0.48,2.55]} crop={C.plantLarge} height={0.90} rotation={FLOOR} depthOffset={0.046}/>
      <RoomSprite position={[2.90,0.48,2.60]} crop={C.cityPrint} height={0.50} rotation={FLOOR} depthOffset={0.048}/>

      <Player onInteractDesk={interactDesk} />
    </group>
  );
});

Room.displayName = 'Room';