import React, { useCallback } from 'react';
import { Player } from './Player';
import { RoomSprite } from './RoomProps';

interface RoomProps {
  onInteractDesk: () => void;
}

const FLAT: [number, number, number] = [-Math.PI / 2, 0, 0];

export const Room: React.FC<RoomProps> = React.memo(({ onInteractDesk }) => {
  const interactDesk = useCallback(() => onInteractDesk(), [onInteractDesk]);

  return (
    <group>
      {/* ============================================================
          FLOOR / ARCHITECTURE
      ============================================================ */}
      <mesh position={[0, -0.18, 0]} receiveShadow>
        <boxGeometry args={[10.9, 0.34, 10.9]} />
        <meshStandardMaterial color="#07080d" roughness={0.98} />
      </mesh>
      <mesh position={[0, 0.04, 0]} receiveShadow castShadow>
        <boxGeometry args={[10.05, 0.18, 10.05]} />
        <meshStandardMaterial color="#211b24" roughness={0.9} />
      </mesh>

      {[-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6].map((z) => (
        <mesh key={z} position={[0, 0.145, z]} receiveShadow>
          <boxGeometry args={[9.65, 0.035, 0.055]} />
          <meshStandardMaterial color="#443640" roughness={0.84} />
        </mesh>
      ))}

      {/* Main raised rug. */}
      <mesh position={[-0.35, 0.16, 1.10]} receiveShadow castShadow>
        <boxGeometry args={[7.2, 0.10, 4.9]} />
        <meshStandardMaterial color="#292334" roughness={1} />
      </mesh>
      <mesh position={[-0.35, 0.22, 1.10]} receiveShadow>
        <boxGeometry args={[6.96, 0.025, 4.66]} />
        <meshStandardMaterial color="#363047" roughness={1} />
      </mesh>
      <mesh position={[-0.35, 0.245, -1.20]}>
        <boxGeometry args={[7, 0.04, 0.07]} />
        <meshStandardMaterial color="#5a5267" roughness={0.84} />
      </mesh>
      <mesh position={[-0.35, 0.245, 3.40]}>
        <boxGeometry args={[7, 0.04, 0.07]} />
        <meshStandardMaterial color="#5a5267" roughness={0.84} />
      </mesh>
      <mesh position={[-3.82, 0.245, 1.10]}>
        <boxGeometry args={[0.07, 0.04, 4.72]} />
        <meshStandardMaterial color="#5a5267" roughness={0.84} />
      </mesh>
      <mesh position={[3.12, 0.245, 1.10]}>
        <boxGeometry args={[0.07, 0.04, 4.72]} />
        <meshStandardMaterial color="#5a5267" roughness={0.84} />
      </mesh>

      {/* Blue architectural light. */}
      <mesh position={[0, 0.235, -4.63]}>
        <boxGeometry args={[9.4, 0.035, 0.055]} />
        <meshStandardMaterial color="#2563eb" emissive="#1d4ed8" emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
      <mesh position={[-4.63, 0.235, 0]}>
        <boxGeometry args={[0.055, 0.035, 9.4]} />
        <meshStandardMaterial color="#2563eb" emissive="#1d4ed8" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>

      {/* Walls and chunky trim. */}
      <mesh position={[0, 2.5, -5]} receiveShadow>
        <boxGeometry args={[10, 5, 0.18]} />
        <meshStandardMaterial color="#0e1627" roughness={0.98} />
      </mesh>
      <mesh position={[-5, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.18, 5, 10]} />
        <meshStandardMaterial color="#142039" roughness={0.98} />
      </mesh>
      <mesh position={[0, 4.86, -4.86]} castShadow>
        <boxGeometry args={[9.85, 0.16, 0.25]} />
        <meshStandardMaterial color="#080b13" roughness={0.9} />
      </mesh>
      <mesh position={[-4.86, 4.86, 0]} castShadow>
        <boxGeometry args={[0.25, 0.16, 9.85]} />
        <meshStandardMaterial color="#080b13" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.48, -4.84]} receiveShadow>
        <boxGeometry args={[9.72, 0.72, 0.16]} />
        <meshStandardMaterial color="#090d17" roughness={0.94} />
      </mesh>
      <mesh position={[0, 0.86, -4.74]}>
        <boxGeometry args={[9.55, 0.075, 0.08]} />
        <meshStandardMaterial color="#303b55" roughness={0.76} />
      </mesh>
      <mesh position={[-4.84, 0.48, 0]} receiveShadow>
        <boxGeometry args={[0.16, 0.72, 9.72]} />
        <meshStandardMaterial color="#090d17" roughness={0.94} />
      </mesh>

      {/* ============================================================
          WALL DECOR FROM THE REAL ATLAS
      ============================================================ */}
      <RoomSprite position={[-2.55, 3.45, -4.72]} crop={{ x: 351, y: 22, width: 384, height: 302 }} height={1.72} depthOffset={0.02} />
      <RoomSprite position={[0.05, 3.45, -4.71]} crop={{ x: 880, y: 28, width: 244, height: 278 }} height={1.82} depthOffset={0.022} />
      <RoomSprite position={[2.35, 3.50, -4.70]} crop={{ x: 1150, y: 15, width: 143, height: 196 }} height={1.42} depthOffset={0.024} />
      <RoomSprite position={[3.38, 2.88, -4.69]} crop={{ x: 744, y: 11, width: 114, height: 296 }} height={1.72} depthOffset={0.026} />
      <RoomSprite position={[4.25, 2.58, -4.68]} crop={{ x: 1424, y: 16, width: 102, height: 311 }} height={2.05} depthOffset={0.028} />

      {/* ============================================================
          BED: thick wooden frame + inset mattress + real atlas bed
      ============================================================ */}
      <group position={[-2.15, 0, -2.18]}>
        {/* shadow plinth */}
        <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.72, 0.30, 3.30]} />
          <meshStandardMaterial color="#0d0b12" roughness={0.98} />
        </mesh>
        {/* wooden frame */}
        <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.52, 0.18, 3.12]} />
          <meshStandardMaterial color="#3b2724" roughness={0.86} />
        </mesh>
        <mesh position={[0, 0.43, 0]}>
          <boxGeometry args={[3.30, 0.08, 2.92]} />
          <meshStandardMaterial color="#5b3a2d" roughness={0.82} />
        </mesh>
        {/* headboard: layered like pixel-art furniture */}
        <mesh position={[0, 0.92, -1.48]} castShadow receiveShadow>
          <boxGeometry args={[3.48, 1.14, 0.22]} />
          <meshStandardMaterial color="#422a27" roughness={0.88} />
        </mesh>
        <mesh position={[0, 1.42, -1.53]} castShadow>
          <boxGeometry args={[3.62, 0.18, 0.32]} />
          <meshStandardMaterial color="#7a5237" roughness={0.74} />
        </mesh>
        <mesh position={[0, 1.30, -1.66]}>
          <boxGeometry args={[3.25, 0.045, 0.025]} />
          <meshStandardMaterial color="#b0784a" emissive="#5b3a27" emissiveIntensity={0.12} />
        </mesh>
        {/* exact bed sprite remains horizontal */}
        <RoomSprite position={[0, 0.54, 0.03]} crop={{ x: 4, y: 569, width: 418, height: 371 }} height={2.72} rotation={FLAT} depthOffset={0.055} />
      </group>

      {/* Nightstand with inset drawer and warm lamp. */}
      <group position={[-0.02, 0, -3.55]}>
        <mesh position={[0, 0.43, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.82, 0.78, 0.68]} />
          <meshStandardMaterial color="#3d2723" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.84, 0]} castShadow>
          <boxGeometry args={[0.94, 0.11, 0.78]} />
          <meshStandardMaterial color="#795039" roughness={0.76} />
        </mesh>
        <mesh position={[0, 0.56, 0.35]}>
          <boxGeometry args={[0.58, 0.22, 0.025]} />
          <meshStandardMaterial color="#2b1c1b" roughness={0.82} />
        </mesh>
        <mesh position={[0, 0.57, 0.37]}>
          <boxGeometry args={[0.12, 0.035, 0.025]} />
          <meshStandardMaterial color="#9c704b" />
        </mesh>
        <mesh position={[0, 1.10, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.22, 8]} />
          <meshStandardMaterial color="#17131a" />
        </mesh>
        <mesh position={[0, 1.27, 0]}>
          <coneGeometry args={[0.23, 0.24, 8]} />
          <meshStandardMaterial color="#d28b43" emissive="#f59e0b" emissiveIntensity={0.34} />
        </mesh>
        <pointLight position={[0, 1.28, 0.08]} intensity={0.38} color="#ffb15a" distance={2.3} decay={2} />
      </group>

      {/* ============================================================
          DESK: wide wood top, framed drawers, legs, back rail and blue glow
      ============================================================ */}
      <group position={[1.95, 0, -3.55]} onClick={interactDesk}>
        {/* cabinet bodies */}
        <mesh position={[-1.72, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.78, 0.78, 0.82]} />
          <meshStandardMaterial color="#2a1b18" roughness={0.94} />
        </mesh>
        <mesh position={[1.72, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.78, 0.78, 0.82]} />
          <meshStandardMaterial color="#2a1b18" roughness={0.94} />
        </mesh>
        {/* inset drawer fronts */}
        <mesh position={[-1.72, 0.55, -0.425]}>
          <boxGeometry args={[0.58, 0.20, 0.025]} />
          <meshStandardMaterial color="#4a2e23" roughness={0.82} />
        </mesh>
        <mesh position={[-1.72, 0.29, -0.425]}>
          <boxGeometry args={[0.58, 0.20, 0.025]} />
          <meshStandardMaterial color="#4a2e23" roughness={0.82} />
        </mesh>
        <mesh position={[1.72, 0.55, -0.425]}>
          <boxGeometry args={[0.58, 0.20, 0.025]} />
          <meshStandardMaterial color="#4a2e23" roughness={0.82} />
        </mesh>
        <mesh position={[1.72, 0.29, -0.425]}>
          <boxGeometry args={[0.58, 0.20, 0.025]} />
          <meshStandardMaterial color="#4a2e23" roughness={0.82} />
        </mesh>
        {/* top and thick front lip */}
        <mesh position={[0, 0.94, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.12, 0.20, 1.08]} />
          <meshStandardMaterial color="#70492f" roughness={0.76} />
        </mesh>
        <mesh position={[0, 0.82, -0.51]}>
          <boxGeometry args={[4.72, 0.12, 0.10]} />
          <meshStandardMaterial color="#8b5a37" roughness={0.76} />
        </mesh>
        {/* legs / lower stretcher */}
        <mesh position={[-2.15, 0.34, 0]} castShadow>
          <boxGeometry args={[0.18, 0.70, 0.78]} />
          <meshStandardMaterial color="#241715" roughness={0.95} />
        </mesh>
        <mesh position={[2.15, 0.34, 0]} castShadow>
          <boxGeometry args={[0.18, 0.70, 0.78]} />
          <meshStandardMaterial color="#241715" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.14, -0.36]}>
          <boxGeometry args={[4.25, 0.055, 0.035]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
      </group>

      {/* Workstation sprites sit ON the new desk. */}
      <RoomSprite position={[0.10, 1.40, -3.52]} crop={{ x: 220, y: 359, width: 263, height: 212 }} height={1.05} depthOffset={0.035} />
      <RoomSprite position={[1.46, 1.60, -3.70]} crop={{ x: 394, y: 345, width: 264, height: 195 }} height={1.24} depthOffset={0.038} />
      <RoomSprite position={[2.62, 1.62, -3.66]} crop={{ x: 662, y: 335, width: 135, height: 220 }} height={1.28} depthOffset={0.040} />
      <RoomSprite position={[3.43, 1.46, -3.44]} crop={{ x: 799, y: 318, width: 166, height: 244 }} height={1.24} depthOffset={0.042} />
      <RoomSprite position={[0.65, 1.02, -3.30]} crop={{ x: 850, y: 625, width: 110, height: 115 }} height={0.42} rotation={FLAT} depthOffset={0.045} />
      <RoomSprite position={[2.05, 1.03, -3.28]} crop={{ x: 965, y: 610, width: 120, height: 135 }} height={0.44} rotation={FLAT} depthOffset={0.047} />

      {/* ============================================================
          PIXEL-ART GAMING CHAIR
      ============================================================ */
      <group position={[1.95, 0, -2.28]}>
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.18, 0.16, 1.04]} />
          <meshStandardMaterial color="#211c28" roughness={0.96} />
        </mesh>
        <mesh position={[0, 1.05, -0.40]} castShadow receiveShadow>
          <boxGeometry args={[1.20, 1.00, 0.18]} />
          <meshStandardMaterial color="#181620" roughness={0.98} />
        </mesh>
        <mesh position={[0, 1.10, -0.50]}>
          <boxGeometry args={[0.58, 0.68, 0.04]} />
          <meshStandardMaterial color="#2f2940" roughness={0.98} />
        </mesh>
        <mesh position={[-0.48, 0.70, 0]} castShadow>
          <boxGeometry args={[0.12, 0.16, 0.80]} />
          <meshStandardMaterial color="#121018" />
        </mesh>
        <mesh position={[0.48, 0.70, 0]} castShadow>
          <boxGeometry args={[0.12, 0.16, 0.80]} />
          <meshStandardMaterial color="#121018" />
        </mesh>
        <mesh position={[0, 0.27, 0]}>
          <cylinderGeometry args={[0.08, 0.11, 0.50, 8]} />
          <meshStandardMaterial color="#17141c" metalness={0.25} roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.36, 0.36, 0.07, 8]} />
          <meshStandardMaterial color="#111018" metalness={0.25} roughness={0.72} />
        </mesh>
      </group>

      {/* ============================================================
          SOFA: deep cushions, thick arms, feet and wood-like trim
      ============================================================ */
      <group position={[-2.55, 0, 1.90]}>
        {/* dark shadow base */}
        <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.55, 0.46, 1.56]} />
          <meshStandardMaterial color="#15131c" roughness={1} />
        </mesh>
        {/* seat frame */}
        <mesh position={[0, 0.60, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.35, 0.46, 1.42]} />
          <meshStandardMaterial color="#30283a" roughness={0.96} />
        </mesh>
        {/* back frame */}
        <mesh position={[0, 1.02, -0.52]} castShadow receiveShadow>
          <boxGeometry args={[3.40, 1.02, 0.32]} />
          <meshStandardMaterial color="#211d2a" roughness={0.98} />
        </mesh>
        {/* left/right arms */}
        <mesh position={[-1.57, 0.78, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.30, 0.82, 1.48]} />
          <meshStandardMaterial color="#25202f" roughness={0.96} />
        </mesh>
        <mesh position={[1.57, 0.78, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.30, 0.82, 1.48]} />
          <meshStandardMaterial color="#25202f" roughness={0.96} />
        </mesh>
        {/* two inset cushions */}
        <mesh position={[-0.78, 0.89, 0.10]} castShadow>
          <boxGeometry args={[1.26, 0.18, 1.02]} />
          <meshStandardMaterial color="#3b3348" roughness={1} />
        </mesh>
        <mesh position={[0.78, 0.89, 0.10]} castShadow>
          <boxGeometry args={[1.26, 0.18, 1.02]} />
          <meshStandardMaterial color="#3b3348" roughness={1} />
        </mesh>
        {/* cushion seams */}
        <mesh position={[0, 0.995, 0.11]}>
          <boxGeometry args={[0.035, 0.025, 0.90]} />
          <meshStandardMaterial color="#51485f" />
        </mesh>
        {/* wooden lower trim */}
        <mesh position={[0, 0.16, 0]}>
          <boxGeometry args={[3.20, 0.10, 1.38]} />
          <meshStandardMaterial color="#493128" roughness={0.82} />
        </mesh>
        {/* small feet */}
        <mesh position={[-1.38, 0.05, 0.55]}>
          <boxGeometry args={[0.16, 0.18, 0.16]} />
          <meshStandardMaterial color="#100d13" />
        </mesh>
        <mesh position={[1.38, 0.05, 0.55]}>
          <boxGeometry args={[0.16, 0.18, 0.16]} />
          <meshStandardMaterial color="#100d13" />
        </mesh>
      </group>

      {/* Small sofa side table. */}
      <group position={[-0.45, 0, 1.88]}>
        <mesh position={[0, 0.46, 0]} castShadow>
          <boxGeometry args={[0.74, 0.12, 0.62]} />
          <meshStandardMaterial color="#71472e" roughness={0.78} />
        </mesh>
        <mesh position={[-0.27, 0.22, 0]}>
          <boxGeometry args={[0.10, 0.48, 0.10]} />
          <meshStandardMaterial color="#39251e" />
        </mesh>
        <mesh position={[0.27, 0.22, 0]}>
          <boxGeometry args={[0.10, 0.48, 0.10]} />
          <meshStandardMaterial color="#39251e" />
        </mesh>
      </group>

      {/* ============================================================
          COFFEE TABLE: chunky tabletop + lower shelf + props
      ============================================================ */}
      <group position={[-0.95, 0, 1.90]}>
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.25, 0.18, 1.30]} />
          <meshStandardMaterial color="#75482f" roughness={0.76} />
        </mesh>
        <mesh position={[0, 0.30, 0]} receiveShadow>
          <boxGeometry args={[1.85, 0.08, 1.00]} />
          <meshStandardMaterial color="#39251f" roughness={0.9} />
        </mesh>
        {[-0.90, 0.90].flatMap((x) => [-0.47, 0.47].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.27, z]} castShadow>
            <boxGeometry args={[0.12, 0.54, 0.12]} />
            <meshStandardMaterial color="#42291f" roughness={0.82} />
          </mesh>
        )))}
        {/* props grouped on top instead of on the floor */}
        <RoomSprite position={[-0.52, 0.69, -0.10]} crop={{ x: 676, y: 625, width: 120, height: 105 }} height={0.38} rotation={FLAT} depthOffset={0.06} />
        <RoomSprite position={[0.15, 0.70, 0.05]} crop={{ x: 800, y: 600, width: 135, height: 130 }} height={0.40} rotation={FLAT} depthOffset={0.062} />
        <RoomSprite position={[0.66, 0.69, -0.16]} crop={{ x: 965, y: 610, width: 120, height: 135 }} height={0.34} rotation={FLAT} depthOffset={0.064} />
      </group>

      {/* ============================================================
          DINING / DEV TABLE + TWO CHAIRS
      ============================================================ */
      <group position={[2.25, 0, 1.95]}>
        <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.35, 0.20, 1.52]} />
          <meshStandardMaterial color="#71472e" roughness={0.78} />
        </mesh>
        <mesh position={[0, 0.80, 0]}>
          <boxGeometry args={[2.08, 0.07, 1.26]} />
          <meshStandardMaterial color="#8a5a39" roughness={0.76} />
        </mesh>
        {[-0.92, 0.92].flatMap((x) => [-0.55, 0.55].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.42, z]} castShadow>
            <boxGeometry args={[0.14, 0.78, 0.14]} />
            <meshStandardMaterial color="#3f2921" roughness={0.84} />
          </mesh>
        )))}
        <mesh position={[0, 0.26, 0]}>
          <boxGeometry args={[1.72, 0.08, 0.92]} />
          <meshStandardMaterial color="#38251f" roughness={0.9} />
        </mesh>
        <RoomSprite position={[-0.58, 1.06, -0.10]} crop={{ x: 676, y: 625, width: 120, height: 105 }} height={0.34} rotation={FLAT} depthOffset={0.07} />
        <RoomSprite position={[0.35, 1.07, 0.10]} crop={{ x: 800, y: 600, width: 135, height: 130 }} height={0.38} rotation={FLAT} depthOffset={0.072} />
      </group>

      {/* dining chair */}
      <group position={[2.28, 0, 3.00]}>
        <mesh position={[0, 0.60, 0]} castShadow>
          <boxGeometry args={[0.90, 0.12, 0.88]} />
          <meshStandardMaterial color="#6b442d" roughness={0.82} />
        </mesh>
        <mesh position={[0, 1.08, -0.34]} castShadow>
          <boxGeometry args={[0.92, 0.88, 0.14]} />
          <meshStandardMaterial color="#4a3028" roughness={0.90} />
        </mesh>
        {[-0.34, 0.34].map((x) => (
          <mesh key={x} position={[x, 0.29, 0]}>
            <boxGeometry args={[0.10, 0.55, 0.10]} />
            <meshStandardMaterial color="#39251f" />
          </mesh>
        ))}
      </group>

      {/* ============================================================
          STORAGE / BOOKCASE — a real vertical furniture silhouette
      ============================================================ */}
      <group position={[3.95, 0, 1.95]}>
        <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.05, 2.30, 0.62]} />
          <meshStandardMaterial color="#2a1b18" roughness={0.94} />
        </mesh>
        {[0.42, 0.98, 1.54].map((y) => (
          <mesh key={y} position={[0, y, -0.34]}>
            <boxGeometry args={[0.86, 0.06, 0.04]} />
            <meshStandardMaterial color="#8a5938" roughness={0.76} />
          </mesh>
        ))}
        {[0.50, 1.06, 1.62].map((y, i) => (
          <group key={y} position={[0, y, -0.37]}>
            <mesh position={[-0.24, 0, 0]}>
              <boxGeometry args={[0.12, 0.38, 0.035]} />
              <meshStandardMaterial color={i === 1 ? '#5c3850' : '#75422f'} roughness={0.8} />
            </mesh>
            <mesh position={[-0.05, 0, 0]}>
              <boxGeometry args={[0.10, 0.32, 0.035]} />
              <meshStandardMaterial color="#8a5b36" roughness={0.8} />
            </mesh>
            <mesh position={[0.15, 0, 0]}>
              <boxGeometry args={[0.12, 0.35, 0.035]} />
              <meshStandardMaterial color="#3f536f" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Floor lamp in the living zone. */}
      <group position={[-3.75, 0, 2.95]}>
        <mesh position={[0, 1.18, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 2.30, 8]} />
          <meshStandardMaterial color="#17131a" metalness={0.2} roughness={0.72} />
        </mesh>
        <mesh position={[0, 2.30, 0]}>
          <coneGeometry args={[0.30, 0.38, 8]} />
          <meshStandardMaterial color="#c78642" emissive="#f59e0b" emissiveIntensity={0.28} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.30, 0.30, 0.07, 8]} />
          <meshStandardMaterial color="#17131a" />
        </mesh>
        <pointLight position={[0, 2.28, 0]} intensity={0.42} color="#ffb15a" distance={3.2} decay={2} />
      </group>

      {/* A few atlas props are deliberately anchored to furniture/walls. */}
      <RoomSprite position={[3.85, 2.38, -4.58]} crop={{ x: 930, y: 835, width: 220, height: 155 }} height={0.70} depthOffset={0.055} />
      <RoomSprite position={[4.12, 1.40, 1.62]} crop={{ x: 1140, y: 580, width: 160, height: 190 }} height={0.92} depthOffset={0.05} />

      {/* Player stays in the central free space. */}
      <Player onInteractDesk={onInteractDesk} />
    </group>
  );
});

Room.displayName = 'Room';
