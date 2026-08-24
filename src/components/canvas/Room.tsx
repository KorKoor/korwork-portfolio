import React, { useCallback } from 'react';
import { Player } from './Player';
import { RoomSprite } from './RoomProps';

interface RoomProps {
  onInteractDesk: () => void;
}

const FLAT: [number, number, number] = [-Math.PI / 2, 0, 0];

/**
 * Cozy 2.5D room composition.
 *
 * Layout target:
 *   back-left  -> bed + nightstand
 *   back-right -> long developer desk
 *   front-left -> sofa + TV console
 *   front-right-> dining/work table + chair + storage
 *
 * Atlas sprites are deliberately placed on furniture/walls instead of
 * being dropped directly on the floor.
 */
export const Room: React.FC<RoomProps> = React.memo(({ onInteractDesk }) => {
  const handleDeskInteraction = useCallback(() => onInteractDesk(), [onInteractDesk]);

  return (
    <group>
      {/* =========================================================
          FLOOR / WOOD PLATFORM
      ========================================================= */}
      <mesh position={[0, -0.18, 0]} receiveShadow>
        <boxGeometry args={[10.9, 0.34, 10.9]} />
        <meshStandardMaterial color="#08090e" roughness={0.96} />
      </mesh>

      <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
        <boxGeometry args={[10.05, 0.16, 10.05]} />
        <meshStandardMaterial color="#211b24" roughness={0.9} />
      </mesh>

      {/* Individual raised floor boards: visible relief rather than a flat slab. */}
      {[-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6].map((z) => (
        <mesh key={`floor-${z}`} position={[0, 0.125, z]} receiveShadow>
          <boxGeometry args={[9.65, 0.035, 0.055]} />
          <meshStandardMaterial color="#3b3038" roughness={0.86} />
        </mesh>
      ))}

      {/* Large rug under the living area. */}
      <mesh position={[-0.35, 0.16, 1.18]} receiveShadow castShadow>
        <boxGeometry args={[7.15, 0.075, 4.95]} />
        <meshStandardMaterial color="#292334" roughness={1} />
      </mesh>
      <mesh position={[-0.35, 0.205, 1.18]} receiveShadow>
        <boxGeometry args={[6.92, 0.025, 4.72]} />
        <meshStandardMaterial color="#343047" roughness={1} />
      </mesh>

      {/* Rug relief border. */}
      <mesh position={[-0.35, 0.225, -1.17]}>
        <boxGeometry args={[6.95, 0.035, 0.07]} />
        <meshStandardMaterial color="#575064" roughness={0.88} />
      </mesh>
      <mesh position={[-0.35, 0.225, 3.53]}>
        <boxGeometry args={[6.95, 0.035, 0.07]} />
        <meshStandardMaterial color="#575064" roughness={0.88} />
      </mesh>
      <mesh position={[-3.82, 0.225, 1.18]}>
        <boxGeometry args={[0.07, 0.035, 4.78]} />
        <meshStandardMaterial color="#575064" roughness={0.88} />
      </mesh>
      <mesh position={[3.12, 0.225, 1.18]}>
        <boxGeometry args={[0.07, 0.035, 4.78]} />
        <meshStandardMaterial color="#575064" roughness={0.88} />
      </mesh>

      {/* Blue architectural accent recessed into the platform. */}
      <mesh position={[0, 0.22, -4.63]}>
        <boxGeometry args={[9.4, 0.035, 0.055]} />
        <meshStandardMaterial color="#2563eb" emissive="#1d4ed8" emissiveIntensity={1.7} toneMapped={false} />
      </mesh>
      <mesh position={[-4.63, 0.22, 0]}>
        <boxGeometry args={[0.055, 0.035, 9.4]} />
        <meshStandardMaterial color="#2563eb" emissive="#1d4ed8" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>

      {/* =========================================================
          WALLS / WOOD TRIM
      ========================================================= */}
      <mesh position={[0, 2.5, -5]} receiveShadow>
        <boxGeometry args={[10, 5, 0.18]} />
        <meshStandardMaterial color="#101827" roughness={0.97} />
      </mesh>
      <mesh position={[-5, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.18, 5, 10]} />
        <meshStandardMaterial color="#141e33" roughness={0.97} />
      </mesh>

      <mesh position={[0, 4.86, -4.86]} castShadow>
        <boxGeometry args={[9.85, 0.16, 0.25]} />
        <meshStandardMaterial color="#080b13" roughness={0.88} />
      </mesh>
      <mesh position={[-4.86, 4.86, 0]} castShadow>
        <boxGeometry args={[0.25, 0.16, 9.85]} />
        <meshStandardMaterial color="#080b13" roughness={0.88} />
      </mesh>

      {/* Dark wooden skirting boards give the walls depth. */}
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
      <mesh position={[-4.74, 0.86, 0]}>
        <boxGeometry args={[0.08, 0.075, 9.55]} />
        <meshStandardMaterial color="#303b55" roughness={0.76} />
      </mesh>

      {/* =========================================================
          WALL PROPS — deliberately spaced like a real room
      ========================================================= */}
      <RoomSprite position={[-2.55, 3.45, -4.73]} crop={{ x: 351, y: 22, width: 384, height: 302 }} height={1.72} depthOffset={0.02} />
      <RoomSprite position={[0.05, 3.45, -4.72]} crop={{ x: 880, y: 28, width: 244, height: 278 }} height={1.82} depthOffset={0.022} />
      <RoomSprite position={[2.38, 3.52, -4.71]} crop={{ x: 1150, y: 15, width: 143, height: 196 }} height={1.42} depthOffset={0.024} />
      <RoomSprite position={[3.42, 2.85, -4.70]} crop={{ x: 744, y: 11, width: 114, height: 296 }} height={1.72} depthOffset={0.026} />
      <RoomSprite position={[4.25, 2.62, -4.69]} crop={{ x: 1424, y: 16, width: 102, height: 311 }} height={2.05} depthOffset={0.028} />

      {/* =========================================================
          BEDROOM ZONE — bed touches the back wall
      ========================================================= */}
      <group position={[-2.15, 0, -2.18]}>
        {/* thick platform */}
        <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.55, 0.26, 3.15]} />
          <meshStandardMaterial color="#111019" roughness={0.94} />
        </mesh>
        <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.40, 0.12, 3.00]} />
          <meshStandardMaterial color="#312531" roughness={0.92} />
        </mesh>

        {/* Bed headboard is perpendicular to the bed and flush to the back wall. */}
        <mesh position={[0, 0.86, -1.43]} castShadow receiveShadow>
          <boxGeometry args={[3.35, 1.05, 0.22]} />
          <meshStandardMaterial color="#4b3027" roughness={0.86} />
        </mesh>
        <mesh position={[0, 1.40, -1.47]} castShadow>
          <boxGeometry args={[3.52, 0.14, 0.30]} />
          <meshStandardMaterial color="#785338" roughness={0.76} />
        </mesh>
        <mesh position={[0, 0.48, -1.30]}>
          <boxGeometry args={[3.08, 0.06, 0.08]} />
          <meshStandardMaterial color="#68452f" roughness={0.78} />
        </mesh>

        {/* Actual bed texture lies horizontally. */}
        <RoomSprite
          position={[0, 0.53, 0.03]}
          crop={{ x: 4, y: 569, width: 418, height: 371 }}
          height={2.72}
          rotation={FLAT}
          depthOffset={0.055}
        />

        {/* Two tiny feet visible under the platform. */}
        <mesh position={[-1.38, 0.06, 1.22]}>
          <boxGeometry args={[0.14, 0.14, 0.14]} />
          <meshStandardMaterial color="#0a0910" />
        </mesh>
        <mesh position={[1.38, 0.06, 1.22]}>
          <boxGeometry args={[0.14, 0.14, 0.14]} />
          <meshStandardMaterial color="#0a0910" />
        </mesh>
      </group>

      {/* Bedside table + warm lamp. */}
      <group position={[-0.05, 0, -3.52]}>
        <mesh position={[0, 0.47, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.72, 0.82, 0.62]} />
          <meshStandardMaterial color="#4d3025" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.92, 0]} castShadow>
          <boxGeometry args={[0.84, 0.10, 0.70]} />
          <meshStandardMaterial color="#765038" roughness={0.75} />
        </mesh>
        <mesh position={[0, 1.12, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.22, 10]} />
          <meshStandardMaterial color="#19151b" />
        </mesh>
        <mesh position={[0, 1.29, 0]}>
          <coneGeometry args={[0.22, 0.24, 12]} />
          <meshStandardMaterial color="#d18b42" emissive="#f59e0b" emissiveIntensity={0.28} />
        </mesh>
        <pointLight position={[0, 1.30, 0.08]} intensity={0.35} color="#ffb15a" distance={2.2} decay={2} />
      </group>

      {/* =========================================================
          DEVELOPER DESK — long, clear and separated from the bed
      ========================================================= */}
      <group position={[1.95, 0, -3.55]} onClick={handleDeskInteraction}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.75, 0.78, 0.86]} />
          <meshStandardMaterial color="#3d281f" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.94, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.05, 0.18, 1.08]} />
          <meshStandardMaterial color="#70492f" roughness={0.78} />
        </mesh>
        <mesh position={[-2.18, 0.43, 0]} castShadow>
          <boxGeometry args={[0.20, 0.84, 0.88]} />
          <meshStandardMaterial color="#2a1b16" roughness={0.94} />
        </mesh>
        <mesh position={[2.18, 0.43, 0]} castShadow>
          <boxGeometry args={[0.20, 0.84, 0.88]} />
          <meshStandardMaterial color="#2a1b16" roughness={0.94} />
        </mesh>
        <mesh position={[0, 0.14, -0.36]}>
          <boxGeometry args={[4.15, 0.05, 0.025]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
      </group>

      {/* Desk setup — laptop, central monitor, side monitor and accessories. */}
      <RoomSprite position={[0.10, 1.40, -3.52]} crop={{ x: 220, y: 359, width: 263, height: 212 }} height={1.05} depthOffset={0.035} />
      <RoomSprite position={[1.46, 1.60, -3.70]} crop={{ x: 394, y: 345, width: 264, height: 195 }} height={1.24} depthOffset={0.038} />
      <RoomSprite position={[2.62, 1.62, -3.66]} crop={{ x: 662, y: 335, width: 135, height: 220 }} height={1.28} depthOffset={0.040} />
      <RoomSprite position={[3.43, 1.46, -3.44]} crop={{ x: 799, y: 318, width: 166, height: 244 }} height={1.24} depthOffset={0.042} />
      <RoomSprite position={[0.65, 1.02, -3.30]} crop={{ x: 850, y: 625, width: 110, height: 115 }} height={0.42} rotation={FLAT} depthOffset={0.045} />
      <RoomSprite position={[2.05, 1.03, -3.28]} crop={{ x: 965, y: 610, width: 120, height: 135 }} height={0.44} rotation={FLAT} depthOffset={0.047} />

      {/* Desk chair, centered under the main workstation. */}
      <group position={[1.95, 0, -2.28]}>
        <mesh position={[0, 0.60, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.15, 0.15, 1.0]} />
          <meshStandardMaterial color="#25202b" roughness={0.96} />
        </mesh>
        <mesh position={[0, 1.04, -0.40]} castShadow receiveShadow>
          <boxGeometry args={[1.16, 0.92, 0.17]} />
          <meshStandardMaterial color="#211d28" roughness={0.98} />
        </mesh>
        <mesh position={[0, 0.30, 0]}>
          <cylinderGeometry args={[0.09, 0.12, 0.48, 10]} />
          <meshStandardMaterial color="#17141c" metalness={0.25} roughness={0.72} />
        </mesh>
        {[-0.32, 0.32].map((x) => (
          <mesh key={x} position={[x, 0.10, 0]} rotation={[0, 0, x < 0 ? 0.35 : -0.35]}>
            <boxGeometry args={[0.08, 0.48, 0.08]} />
            <meshStandardMaterial color="#17141c" metalness={0.25} roughness={0.72} />
          </mesh>
        ))}
      </group>

      {/* =========================================================
          LIVING ROOM — sofa + TV console
      ========================================================= */
      <group position={[-2.55, 0, 1.90]}>
        <mesh position={[0, 0.43, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.25, 0.70, 1.32]} />
          <meshStandardMaterial color="#292432" roughness={0.96} />
        </mesh>
        <mesh position={[0, 0.94, -0.46]} castShadow receiveShadow>
          <boxGeometry args={[3.34, 1.05, 0.32]} />
          <meshStandardMaterial color="#211d2a" roughness={0.98} />
        </mesh>
        <mesh position={[-1.55, 0.82, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.80, 1.45]} />
          <meshStandardMaterial color="#24202e" roughness={0.96} />
        </mesh>
        <mesh position={[1.55, 0.82, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.80, 1.45]} />
          <meshStandardMaterial color="#24202e" roughness={0.96} />
        </mesh>
        <mesh position={[-0.78, 0.90, 0.06]} castShadow>
          <boxGeometry args={[1.18, 0.15, 1.00]} />
          <meshStandardMaterial color="#363043" roughness={1} />
        </mesh>
        <mesh position={[0.78, 0.90, 0.06]} castShadow>
          <boxGeometry args={[1.18, 0.15, 1.00]} />
          <meshStandardMaterial color="#363043" roughness={1} />
        </mesh>
      </group>

      {/* Cats belong on the sofa. */}
      <RoomSprite position={[-2.55, 1.01, 1.88]} crop={{ x: 930, y: 835, width: 145, height: 105 }} height={0.66} rotation={FLAT} depthOffset={0.08} />
      <RoomSprite position={[-3.12, 1.00, 1.84]} crop={{ x: 1060, y: 835, width: 145, height: 115 }} height={0.62} rotation={FLAT} depthOffset={0.082} />

      {/* TV console in front of sofa, with console + screen props. */}
      <group position={[-2.50, 0, 3.55]}>
        <mesh position={[0, 0.50, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.15, 0.78, 0.72]} />
          <meshStandardMaterial color="#4b3024" roughness={0.86} />
        </mesh>
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[3.30, 0.14, 0.82]} />
          <meshStandardMaterial color="#70492f" roughness={0.76} />
        </mesh>
        <mesh position={[-1.10, 0.52, 0.39]}>
          <boxGeometry args={[0.06, 0.52, 0.02]} />
          <meshStandardMaterial color="#17131a" />
        </mesh>
        <mesh position={[1.10, 0.52, 0.39]}>
          <boxGeometry args={[0.06, 0.52, 0.02]} />
          <meshStandardMaterial color="#17131a" />
        </mesh>
      </group>
      <RoomSprite position={[-2.50, 1.55, 3.53]} crop={{ x: 1060, y: 670, width: 225, height: 155 }} height={1.0} depthOffset={0.08} />
      <RoomSprite position={[-3.52, 1.08, 3.52]} crop={{ x: 860, y: 785, width: 150, height: 130 }} height={0.48} rotation={FLAT} depthOffset={0.09} />

      {/* =========================================================
          CENTER TABLE + DINING CHAIR
      ========================================================= */
      <group position={[0.55, 0, 2.10]}>
        <mesh position={[0, 0.54, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.05, 0.18, 1.25]} />
          <meshStandardMaterial color="#603d28" roughness={0.80} />
        </mesh>
        <mesh position={[0, 0.62, 0]} castShadow>
          <boxGeometry args={[2.18, 0.08, 1.36]} />
          <meshStandardMaterial color="#7a5032" roughness={0.72} />
        </mesh>
        {[-0.78, 0.78].flatMap((x) => [-0.42, 0.42].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.26, z]} castShadow>
            <boxGeometry args={[0.12, 0.52, 0.12]} />
            <meshStandardMaterial color="#2b1b14" roughness={0.92} />
          </mesh>
        )))}
      </group>

      {/* Table props: coffee, food, books and controller. */}
      <RoomSprite position={[0.00, 0.68, 1.93]} crop={{ x: 680, y: 625, width: 120, height: 100 }} height={0.50} rotation={FLAT} depthOffset={0.09} />
      <RoomSprite position={[0.72, 0.68, 2.22]} crop={{ x: 780, y: 620, width: 95, height: 125 }} height={0.54} rotation={FLAT} depthOffset={0.092} />
      <RoomSprite position={[-0.05, 0.68, 2.45]} crop={{ x: 680, y: 710, width: 125, height: 90 }} height={0.46} rotation={FLAT} depthOffset={0.094} />
      <RoomSprite position={[0.82, 0.68, 1.92]} crop={{ x: 850, y: 635, width: 85, height: 115 }} height={0.52} rotation={FLAT} depthOffset={0.096} />

      <group position={[0.62, 0, 3.18]}>
        <mesh position={[0, 0.58, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.08, 0.15, 0.96]} />
          <meshStandardMaterial color="#513526" roughness={0.86} />
        </mesh>
        <mesh position={[0, 1.02, -0.37]} castShadow>
          <boxGeometry args={[1.10, 0.88, 0.16]} />
          <meshStandardMaterial color="#25202d" roughness={0.96} />
        </mesh>
        <mesh position={[-0.38, 0.28, 0]}>
          <boxGeometry args={[0.10, 0.56, 0.10]} />
          <meshStandardMaterial color="#201712" />
        </mesh>
        <mesh position={[0.38, 0.28, 0]}>
          <boxGeometry args={[0.10, 0.56, 0.10]} />
          <meshStandardMaterial color="#201712" />
        </mesh>
      </group>

      {/* =========================================================
          RIGHT STORAGE / BOOKCASE
      ========================================================= */
      <group position={[3.55, 0, 2.35]}>
        <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.22, 1.84, 0.72]} />
          <meshStandardMaterial color="#21191c" roughness={0.92} />
        </mesh>
        <mesh position={[0, 1.78, 0]} castShadow>
          <boxGeometry args={[1.34, 0.10, 0.80]} />
          <meshStandardMaterial color="#70482f" roughness={0.78} />
        </mesh>
        <mesh position={[0, 1.18, 0.38]}>
          <boxGeometry args={[1.12, 0.06, 0.035]} />
          <meshStandardMaterial color="#6b4630" roughness={0.82} />
        </mesh>
        <mesh position={[0, 0.55, 0.38]}>
          <boxGeometry args={[1.12, 0.06, 0.035]} />
          <meshStandardMaterial color="#6b4630" roughness={0.82} />
        </mesh>
      </group>

      <RoomSprite position={[3.55, 1.45, 1.95]} crop={{ x: 520, y: 600, width: 190, height: 300 }} height={0.86} rotation={FLAT} depthOffset={0.08} />
      <RoomSprite position={[3.55, 0.83, 1.95]} crop={{ x: 850, y: 770, width: 135, height: 80 }} height={0.46} rotation={FLAT} depthOffset={0.082} />
      <RoomSprite position={[3.55, 0.22, 1.95]} crop={{ x: 1260, y: 790, width: 180, height: 130 }} height={0.48} rotation={FLAT} depthOffset={0.084} />

      {/* Floor lamp beside the storage unit. */}
      <mesh position={[2.85, 0.20, 1.18]} castShadow>
        <cylinderGeometry args={[0.16, 0.23, 0.14, 12]} />
        <meshStandardMaterial color="#17131a" roughness={0.80} />
      </mesh>
      <mesh position={[2.85, 1.30, 1.18]} castShadow>
        <cylinderGeometry args={[0.045, 0.055, 2.10, 8]} />
        <meshStandardMaterial color="#2a2530" metalness={0.35} roughness={0.70} />
      </mesh>
      <mesh position={[2.85, 2.38, 1.18]} castShadow>
        <coneGeometry args={[0.34, 0.42, 16, 1, true]} />
        <meshStandardMaterial color="#a36c3c" emissive="#f59e0b" emissiveIntensity={0.30} roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[2.85, 2.36, 1.22]} intensity={0.65} color="#ffad5a" distance={3.2} decay={2} />

      {/* Plants add vertical silhouettes to the otherwise dark room. */}
      <RoomSprite position={[-4.12, 1.62, -2.65]} crop={{ x: 744, y: 11, width: 114, height: 296 }} height={1.60} depthOffset={0.035} />
      <RoomSprite position={[4.08, 1.58, -3.48]} crop={{ x: 1080, y: 372, width: 177, height: 190 }} height={0.98} depthOffset={0.035} />

      {/* A few large floor silhouettes, each tied to a zone. */}
      <RoomSprite position={[-4.10, 0.34, 0.95]} crop={{ x: 430, y: 575, width: 105, height: 330 }} height={1.10} rotation={FLAT} depthOffset={0.07} />
      <RoomSprite position={[4.08, 0.34, 3.60]} crop={{ x: 980, y: 675, width: 135, height: 145 }} height={0.64} rotation={FLAT} depthOffset={0.086} />

      {/* =========================================================
          PLAYER
      ========================================================= */}
      <Player
        onInteractDesk={onInteractDesk}
        initialPosition={[0.15, 0, 0.10]}
        deskPosition={[1.95, -3.55]}
      />
    </group>
  );
});

Room.displayName = 'Room';
