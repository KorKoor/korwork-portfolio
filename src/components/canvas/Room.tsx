import React, { useCallback } from 'react';
import { Player } from './Player';
import { RoomSprite } from './RoomProps';

interface RoomProps {
  onInteractDesk: () => void;
}

const FLOOR_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0];

/**
 * Main 2.5D room composition.
 *
 * The composition intentionally follows the approved reference:
 * - bed locked against the back/left wall;
 * - desk separated from the bed and aligned to the back wall;
 * - lounge sofa on the left/front zone;
 * - coffee table + chair in the center/front zone;
 * - props grouped on furniture instead of scattered over the floor.
 */
export const Room: React.FC<RoomProps> = React.memo(({ onInteractDesk }) => {
  const handleDeskInteraction = useCallback(() => onInteractDesk(), [onInteractDesk]);

  return (
    <group>
      {/* =========================================================
          FLOOR / 2.5D TERRAIN
      ========================================================= */}
      <mesh position={[0, -0.18, 0]} receiveShadow>
        <boxGeometry args={[10.9, 0.34, 10.9]} />
        <meshStandardMaterial color="#0b0a10" roughness={0.94} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.015, 0]} receiveShadow castShadow>
        <boxGeometry args={[10.05, 0.12, 10.05]} />
        <meshStandardMaterial color="#272330" roughness={0.91} />
      </mesh>

      {/* Central raised rug/platform */}
      <mesh position={[0.25, 0.09, 0.55]} receiveShadow castShadow>
        <boxGeometry args={[7.35, 0.14, 6.25]} />
        <meshStandardMaterial color="#302b3b" roughness={0.98} />
      </mesh>
      <mesh position={[0.25, 0.17, 0.55]} receiveShadow>
        <boxGeometry args={[7.08, 0.035, 5.98]} />
        <meshStandardMaterial color="#363141" roughness={0.99} />
      </mesh>
      <mesh position={[0.25, 0.205, -2.38]} receiveShadow>
        <boxGeometry args={[7.08, 0.045, 0.07]} />
        <meshStandardMaterial color="#51495c" roughness={0.86} />
      </mesh>
      <mesh position={[0.25, 0.205, 3.48]} receiveShadow>
        <boxGeometry args={[7.08, 0.045, 0.07]} />
        <meshStandardMaterial color="#51495c" roughness={0.86} />
      </mesh>
      <mesh position={[-3.25, 0.205, 0.55]} receiveShadow>
        <boxGeometry args={[0.07, 0.045, 5.98]} />
        <meshStandardMaterial color="#51495c" roughness={0.86} />
      </mesh>
      <mesh position={[3.75, 0.205, 0.55]} receiveShadow>
        <boxGeometry args={[0.07, 0.045, 5.98]} />
        <meshStandardMaterial color="#51495c" roughness={0.86} />
      </mesh>

      {/* Floor perimeter relief */}
      <mesh position={[0, 0.105, -4.68]} receiveShadow>
        <boxGeometry args={[9.35, 0.08, 0.16]} />
        <meshStandardMaterial color="#454052" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.105, 4.68]} receiveShadow>
        <boxGeometry args={[9.35, 0.08, 0.16]} />
        <meshStandardMaterial color="#17151d" roughness={0.9} />
      </mesh>
      <mesh position={[-4.68, 0.105, 0]} receiveShadow>
        <boxGeometry args={[0.16, 0.08, 9.35]} />
        <meshStandardMaterial color="#34303d" roughness={0.84} />
      </mesh>
      <mesh position={[4.68, 0.105, 0]} receiveShadow>
        <boxGeometry args={[0.16, 0.08, 9.35]} />
        <meshStandardMaterial color="#17151d" roughness={0.9} />
      </mesh>

      {/* =========================================================
          WALLS + MOLDINGS
      ========================================================= */}
      <mesh position={[0, 2.5, -5]} receiveShadow>
        <boxGeometry args={[10, 5, 0.18]} />
        <meshStandardMaterial color="#0f1728" roughness={0.96} />
      </mesh>
      <mesh position={[-5, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.18, 5, 10]} />
        <meshStandardMaterial color="#17223a" roughness={0.96} />
      </mesh>
      <mesh position={[-4.88, 2.55, -4.88]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 5.15, 0.22]} />
        <meshStandardMaterial color="#070a12" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.48, -4.87]} receiveShadow>
        <boxGeometry args={[9.7, 0.74, 0.12]} />
        <meshStandardMaterial color="#0b1120" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.87, -4.81]} receiveShadow>
        <boxGeometry args={[9.7, 0.075, 0.13]} />
        <meshStandardMaterial color="#263149" roughness={0.74} />
      </mesh>
      <mesh position={[-4.82, 0.48, 0]} receiveShadow>
        <boxGeometry args={[0.13, 0.74, 9.7]} />
        <meshStandardMaterial color="#0b1120" roughness={0.92} />
      </mesh>
      <mesh position={[-4.76, 0.87, 0]} receiveShadow>
        <boxGeometry args={[0.14, 0.075, 9.7]} />
        <meshStandardMaterial color="#263149" roughness={0.74} />
      </mesh>
      <mesh position={[0, 4.88, -4.84]} receiveShadow>
        <boxGeometry args={[9.75, 0.16, 0.22]} />
        <meshStandardMaterial color="#080c16" roughness={0.9} />
      </mesh>
      <mesh position={[-4.84, 4.88, 0]} receiveShadow>
        <boxGeometry args={[0.22, 0.16, 9.75]} />
        <meshStandardMaterial color="#080c16" roughness={0.9} />
      </mesh>

      {/* =========================================================
          WALL DECORATION
      ========================================================= */}
      <RoomSprite position={[-2.35, 3.42, -4.75]} crop={{ x: 351, y: 22, width: 384, height: 302 }} height={1.9} depthOffset={0.018} />
      <RoomSprite position={[0.25, 3.42, -4.74]} crop={{ x: 880, y: 28, width: 244, height: 278 }} height={2.0} depthOffset={0.02} />
      <RoomSprite position={[2.45, 3.48, -4.73]} crop={{ x: 1150, y: 15, width: 143, height: 196 }} height={1.5} depthOffset={0.022} />
      <RoomSprite position={[3.38, 2.86, -4.72]} crop={{ x: 744, y: 11, width: 114, height: 296 }} height={1.82} depthOffset={0.024} />
      <RoomSprite position={[4.35, 2.35, -4.71]} crop={{ x: 1424, y: 16, width: 102, height: 311 }} height={2.3} depthOffset={0.026} />
      <RoomSprite position={[3.1, 1.52, -4.69]} crop={{ x: 1080, y: 372, width: 177, height: 190 }} height={1.12} depthOffset={0.04} />
      <RoomSprite position={[4.05, 1.58, -4.68]} crop={{ x: 1270, y: 367, width: 251, height: 227 }} height={1.18} depthOffset={0.042} />
      <RoomSprite position={[4.35, 1.18, -4.67]} crop={{ x: 1103, y: 202, width: 322, height: 164 }} height={1.0} depthOffset={0.044} />

      {/* =========================================================
          BED ZONE — locked to the left/back wall
      ========================================================= */}
      <group position={[-2.25, 0, -2.02]}>
        <mesh position={[0, 0.16, 0]} receiveShadow castShadow>
          <boxGeometry args={[3.55, 0.24, 3.05]} />
          <meshStandardMaterial color="#11101a" roughness={0.96} />
        </mesh>
        <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
          <boxGeometry args={[3.42, 0.16, 2.9]} />
          <meshStandardMaterial color="#28212d" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.43, 0]} receiveShadow castShadow>
          <boxGeometry args={[3.28, 0.22, 2.76]} />
          <meshStandardMaterial color="#211e2b" roughness={0.98} />
        </mesh>

        {/* Headboard touches the back wall, parallel to the desk */}
        <mesh position={[0, 0.82, -1.39]} castShadow receiveShadow>
          <boxGeometry args={[3.35, 0.95, 0.2]} />
          <meshStandardMaterial color="#3b2930" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.35, -1.45]} castShadow>
          <boxGeometry args={[3.52, 0.14, 0.28]} />
          <meshStandardMaterial color="#62432f" roughness={0.82} />
        </mesh>
        <mesh position={[0, 0.55, -1.31]} receiveShadow>
          <boxGeometry args={[3.1, 0.08, 0.08]} />
          <meshStandardMaterial color="#754d35" roughness={0.8} />
        </mesh>
        <RoomSprite position={[0, 0.56, 0]} crop={{ x: 4, y: 569, width: 418, height: 371 }} height={2.88} rotation={FLOOR_ROTATION} depthOffset={0.055} />
      </group>

      {/* =========================================================
          DESK ZONE — moved right so it never overlaps the bed
      ========================================================= */}
      <group position={[1.72, 0, -3.68]} onClick={handleDeskInteraction}>
        <mesh position={[0, 0.48, 0.35]} castShadow receiveShadow>
          <boxGeometry args={[4.55, 0.82, 0.82]} />
          <meshStandardMaterial color="#4a3020" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.98, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.9, 0.18, 1.08]} />
          <meshStandardMaterial color="#6d4b31" roughness={0.82} />
        </mesh>
        <mesh position={[0, 1.09, -0.48]} castShadow>
          <boxGeometry args={[4.72, 0.07, 0.08]} />
          <meshStandardMaterial color="#8b6342" roughness={0.76} />
        </mesh>
        <mesh position={[-2.02, 0.45, 0]} castShadow>
          <boxGeometry args={[0.22, 0.82, 0.84]} />
          <meshStandardMaterial color="#342219" roughness={0.95} />
        </mesh>
        <mesh position={[2.02, 0.45, 0]} castShadow>
          <boxGeometry args={[0.22, 0.82, 0.84]} />
          <meshStandardMaterial color="#342219" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.14, 0.25]} castShadow>
          <boxGeometry args={[4.08, 0.12, 0.14]} />
          <meshStandardMaterial color="#241812" roughness={0.96} />
        </mesh>
        <mesh position={[0, 0.12, -0.39]}>
          <boxGeometry args={[3.82, 0.035, 0.025]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
      </group>

      {/* Monitors + laptop + desk gear, grouped on the desktop */}
      <RoomSprite position={[0.15, 1.45, -3.59]} crop={{ x: 220, y: 359, width: 263, height: 212 }} height={1.18} depthOffset={0.035} />
      <RoomSprite position={[1.52, 1.72, -3.82]} crop={{ x: 394, y: 345, width: 264, height: 195 }} height={1.35} depthOffset={0.038} />
      <RoomSprite position={[2.7, 1.7, -3.78]} crop={{ x: 662, y: 335, width: 135, height: 220 }} height={1.38} depthOffset={0.04} />
      <RoomSprite position={[3.42, 1.7, -3.48]} crop={{ x: 799, y: 318, width: 166, height: 244 }} height={1.4} depthOffset={0.042} />

      {/* =========================================================
          LOUNGE SOFA — left/front zone
      ========================================================= */
      <group position={[-2.45, 0, 2.15]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.65, 0.72, 1.25]} />
          <meshStandardMaterial color="#292536" roughness={0.96} />
        </mesh>
        <mesh position={[0, 0.98, -0.45]} castShadow receiveShadow>
          <boxGeometry args={[3.72, 1.08, 0.32]} />
          <meshStandardMaterial color="#211e2d" roughness={0.98} />
        </mesh>
        <mesh position={[-1.7, 0.86, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.28, 0.82, 1.4]} />
          <meshStandardMaterial color="#242132" roughness={0.96} />
        </mesh>
        <mesh position={[1.7, 0.86, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.28, 0.82, 1.4]} />
          <meshStandardMaterial color="#242132" roughness={0.96} />
        </mesh>
        <mesh position={[-0.85, 0.92, 0.08]} castShadow>
          <boxGeometry args={[1.35, 0.16, 1.02]} />
          <meshStandardMaterial color="#353044" roughness={1} />
        </mesh>
        <mesh position={[0.85, 0.92, 0.08]} castShadow>
          <boxGeometry args={[1.35, 0.16, 1.02]} />
          <meshStandardMaterial color="#353044" roughness={1} />
        </mesh>
        <mesh position={[-1.45, 0.2, 0]} castShadow>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color="#15131b" roughness={0.85} />
        </mesh>
        <mesh position={[1.45, 0.2, 0]} castShadow>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color="#15131b" roughness={0.85} />
        </mesh>
      </group>

      {/* Cat / cozy decoration belongs on the sofa */}
      <RoomSprite position={[-2.45, 0.98, 2.15]} crop={{ x: 930, y: 835, width: 145, height: 105 }} height={0.75} rotation={FLOOR_ROTATION} depthOffset={0.08} />
      <RoomSprite position={[-3.15, 0.98, 2.08]} crop={{ x: 1060, y: 835, width: 145, height: 115 }} height={0.68} rotation={FLOOR_ROTATION} depthOffset={0.082} />

      {/* =========================================================
          COFFEE TABLE + CHAIR — central/front zone
      ========================================================= */
      <group position={[0.55, 0, 2.05]}>
        <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.05, 0.16, 1.05]} />
          <meshStandardMaterial color="#5b3b27" roughness={0.82} />
        </mesh>
        <mesh position={[-0.78, 0.22, -0.34]} castShadow>
          <boxGeometry args={[0.13, 0.45, 0.13]} />
          <meshStandardMaterial color="#281a14" roughness={0.92} />
        </mesh>
        <mesh position={[0.78, 0.22, -0.34]} castShadow>
          <boxGeometry args={[0.13, 0.45, 0.13]} />
          <meshStandardMaterial color="#281a14" roughness={0.92} />
        </mesh>
        <mesh position={[-0.78, 0.22, 0.34]} castShadow>
          <boxGeometry args={[0.13, 0.45, 0.13]} />
          <meshStandardMaterial color="#281a14" roughness={0.92} />
        </mesh>
        <mesh position={[0.78, 0.22, 0.34]} castShadow>
          <boxGeometry args={[0.13, 0.45, 0.13]} />
          <meshStandardMaterial color="#281a14" roughness={0.92} />
        </mesh>
        <mesh position={[0, 0.57, 0]} castShadow>
          <boxGeometry args={[2.18, 0.08, 1.18]} />
          <meshStandardMaterial color="#754d32" roughness={0.76} />
        </mesh>
      </group>

      {/* Food / drinks stay on the table */}
      <RoomSprite position={[0.05, 0.62, 1.92]} crop={{ x: 680, y: 625, width: 120, height: 100 }} height={0.58} rotation={FLOOR_ROTATION} depthOffset={0.09} />
      <RoomSprite position={[0.72, 0.62, 2.18]} crop={{ x: 780, y: 620, width: 95, height: 125 }} height={0.62} rotation={FLOOR_ROTATION} depthOffset={0.092} />
      <RoomSprite position={[0.0, 0.62, 2.42]} crop={{ x: 680, y: 710, width: 125, height: 90 }} height={0.5} rotation={FLOOR_ROTATION} depthOffset={0.094} />
      <RoomSprite position={[0.82, 0.62, 1.88]} crop={{ x: 850, y: 635, width: 85, height: 115 }} height={0.58} rotation={FLOOR_ROTATION} depthOffset={0.096} />

      {/* Chair */}
      <group position={[0.65, 0, 3.12]}>
        <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.15, 0.14, 1.0]} />
          <meshStandardMaterial color="#4b3022" roughness={0.86} />
        </mesh>
        <mesh position={[0, 1.05, -0.38]} castShadow receiveShadow>
          <boxGeometry args={[1.15, 0.92, 0.16]} />
          <meshStandardMaterial color="#252131" roughness={0.96} />
        </mesh>
        <mesh position={[-0.43, 0.3, 0]} castShadow>
          <boxGeometry args={[0.12, 0.6, 0.12]} />
          <meshStandardMaterial color="#1c1512" roughness={0.92} />
        </mesh>
        <mesh position={[0.43, 0.3, 0]} castShadow>
          <boxGeometry args={[0.12, 0.6, 0.12]} />
          <meshStandardMaterial color="#1c1512" roughness={0.92} />
        </mesh>
      </group>

      {/* =========================================================
          ORGANIZED STORAGE / PROPS
      ========================================================= */
      <group position={[3.65, 0, 2.65]}>
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.15, 2.0, 0.62]} />
          <meshStandardMaterial color="#241c20" roughness={0.92} />
        </mesh>
        <mesh position={[0, 1.78, 0]} castShadow>
          <boxGeometry args={[1.28, 0.1, 0.72]} />
          <meshStandardMaterial color="#65432f" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.08, 0]}>
          <boxGeometry args={[1.28, 0.08, 0.72]} />
          <meshStandardMaterial color="#65432f" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.38, 0]} castShadow>
          <boxGeometry args={[1.28, 0.1, 0.72]} />
          <meshStandardMaterial color="#65432f" roughness={0.8} />
        </mesh>
      </group>
      <RoomSprite position={[3.65, 2.04, 2.30]} crop={{ x: 520, y: 600, width: 190, height: 300 }} height={1.0} rotation={FLOOR_ROTATION} depthOffset={0.08} />
      <RoomSprite position={[3.65, 1.33, 2.30]} crop={{ x: 850, y: 770, width: 135, height: 80 }} height={0.52} rotation={FLOOR_ROTATION} depthOffset={0.082} />
      <RoomSprite position={[3.65, 0.64, 2.30]} crop={{ x: 1260, y: 790, width: 180, height: 130 }} height={0.6} rotation={FLOOR_ROTATION} depthOffset={0.084} />

      {/* Small props are intentionally grouped near their furniture */}
      <RoomSprite position={[-3.72, 0.22, 0.92]} crop={{ x: 430, y: 575, width: 105, height: 330 }} height={1.15} rotation={FLOOR_ROTATION} depthOffset={0.07} />
      <RoomSprite position={[-3.48, 0.22, 0.98]} crop={{ x: 520, y: 600, width: 190, height: 300 }} height={0.95} rotation={FLOOR_ROTATION} depthOffset={0.072} />
      <RoomSprite position={[3.05, 0.23, 3.45]} crop={{ x: 980, y: 675, width: 135, height: 145 }} height={0.72} rotation={FLOOR_ROTATION} depthOffset={0.086} />
      <RoomSprite position={[3.45, 0.23, 3.72]} crop={{ x: 1080, y: 690, width: 190, height: 145 }} height={0.68} rotation={FLOOR_ROTATION} depthOffset={0.088} />
      <RoomSprite position={[2.95, 0.23, 3.82]} crop={{ x: 1135, y: 790, width: 150, height: 105 }} height={0.58} rotation={FLOOR_ROTATION} depthOffset={0.09} />

      {/* A warm floor lamp anchor */}
      <mesh position={[2.95, 0.56, 1.15]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.25, 0.16, 10]} />
        <meshStandardMaterial color="#17141b" roughness={0.78} />
      </mesh>
      <mesh position={[2.95, 1.55, 1.15]} castShadow>
        <cylinderGeometry args={[0.045, 0.055, 1.9, 8]} />
        <meshStandardMaterial color="#27232d" roughness={0.7} metalness={0.35} />
      </mesh>
      <mesh position={[2.95, 2.5, 1.15]} castShadow>
        <coneGeometry args={[0.34, 0.42, 16, 1, true]} />
        <meshStandardMaterial color="#6c4a2f" emissive="#f59e0b" emissiveIntensity={0.32} roughness={0.8} side={2} />
      </mesh>
      <pointLight position={[2.95, 2.45, 1.15]} intensity={0.7} color="#f59e0b" distance={3.2} decay={2} />

      <Player onInteractDesk={onInteractDesk} initialPosition={[0.3, 0, 0.15]} deskPosition={[1.72, -3.45]} />
    </group>
  );
});

Room.displayName = 'Room';
