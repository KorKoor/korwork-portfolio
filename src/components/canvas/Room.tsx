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
      {/* FLOOR */}
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

      {/* Raised rug gives the room a real floor plane. */}
      <mesh position={[-0.35, 0.16, 1.10]} receiveShadow castShadow>
        <boxGeometry args={[7.2, 0.10, 4.9]} />
        <meshStandardMaterial color="#292334" roughness={1} />
      </mesh>
      <mesh position={[-0.35, 0.22, 1.10]}>
        <boxGeometry args={[6.96, 0.025, 4.66]} />
        <meshStandardMaterial color="#363047" roughness={1} />
      </mesh>
      <mesh position={[-0.35, 0.245, -1.20]}>
        <boxGeometry args={[7.0, 0.04, 0.07]} />
        <meshStandardMaterial color="#5a5267" roughness={0.84} />
      </mesh>
      <mesh position={[-0.35, 0.245, 3.40]}>
        <boxGeometry args={[7.0, 0.04, 0.07]} />
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

      {/* Neon edge. */}
      <mesh position={[0, 0.235, -4.63]}>
        <boxGeometry args={[9.4, 0.035, 0.055]} />
        <meshStandardMaterial color="#2563eb" emissive="#1d4ed8" emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
      <mesh position={[-4.63, 0.235, 0]}>
        <boxGeometry args={[0.055, 0.035, 9.4]} />
        <meshStandardMaterial color="#2563eb" emissive="#1d4ed8" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>

      {/* WALLS */}
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

      {/* WALL DECOR */}
      <RoomSprite position={[-2.55, 3.45, -4.72]} crop={{ x: 351, y: 22, width: 384, height: 302 }} height={1.72} depthOffset={0.02} />
      <RoomSprite position={[0.05, 3.45, -4.71]} crop={{ x: 880, y: 28, width: 244, height: 278 }} height={1.82} depthOffset={0.022} />
      <RoomSprite position={[2.35, 3.50, -4.70]} crop={{ x: 1150, y: 15, width: 143, height: 196 }} height={1.42} depthOffset={0.024} />
      <RoomSprite position={[3.38, 2.88, -4.69]} crop={{ x: 744, y: 11, width: 114, height: 296 }} height={1.72} depthOffset={0.026} />
      <RoomSprite position={[4.25, 2.58, -4.68]} crop={{ x: 1424, y: 16, width: 102, height: 311 }} height={2.05} depthOffset={0.028} />

      {/* BED — back/left, touching the wall. */}
      <group position={[-2.15, 0, -2.18]}>
        <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.55, 0.28, 3.15]} />
          <meshStandardMaterial color="#111019" roughness={0.94} />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.40, 0.12, 3.00]} />
          <meshStandardMaterial color="#312531" roughness={0.92} />
        </mesh>
        <mesh position={[0, 0.88, -1.44]} castShadow receiveShadow>
          <boxGeometry args={[3.36, 1.08, 0.22]} />
          <meshStandardMaterial color="#4b3027" roughness={0.86} />
        </mesh>
        <mesh position={[0, 1.43, -1.48]} castShadow>
          <boxGeometry args={[3.52, 0.14, 0.30]} />
          <meshStandardMaterial color="#785338" roughness={0.76} />
        </mesh>
        <RoomSprite position={[0, 0.54, 0.03]} crop={{ x: 4, y: 569, width: 418, height: 371 }} height={2.72} rotation={FLAT} depthOffset={0.055} />
      </group>

      {/* Nightstand + warm bedside lamp. */}
      <group position={[-0.02, 0, -3.55]}>
        <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.72, 0.82, 0.62]} />
          <meshStandardMaterial color="#4d3025" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.92, 0]} castShadow>
          <boxGeometry args={[0.84, 0.10, 0.70]} />
          <meshStandardMaterial color="#765038" roughness={0.75} />
        </mesh>
        <mesh position={[0, 1.10, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.22, 10]} />
          <meshStandardMaterial color="#19151b" />
        </mesh>
        <mesh position={[0, 1.28, 0]}>
          <coneGeometry args={[0.22, 0.24, 12]} />
          <meshStandardMaterial color="#d18b42" emissive="#f59e0b" emissiveIntensity={0.3} />
        </mesh>
        <pointLight position={[0, 1.3, 0.08]} intensity={0.35} color="#ffb15a" distance={2.2} decay={2} />
      </group>

      {/* DESK — long workstation on the back/right wall. */}
      <group position={[1.95, 0, -3.55]} onClick={interactDesk}>
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

      {/* Full workstation setup, all sitting on the desk. */}
      <RoomSprite position={[0.10, 1.40, -3.52]} crop={{ x: 220, y: 359, width: 263, height: 212 }} height={1.05} depthOffset={0.035} />
      <RoomSprite position={[1.46, 1.60, -3.70]} crop={{ x: 394, y: 345, width: 264, height: 195 }} height={1.24} depthOffset={0.038} />
      <RoomSprite position={[2.62, 1.62, -3.66]} crop={{ x: 662, y: 335, width: 135, height: 220 }} height={1.28} depthOffset={0.040} />
      <RoomSprite position={[3.43, 1.46, -3.44]} crop={{ x: 799, y: 318, width: 166, height: 244 }} height={1.24} depthOffset={0.042} />
      <RoomSprite position={[0.65, 1.02, -3.30]} crop={{ x: 850, y: 625, width: 110, height: 115 }} height={0.42} rotation={FLAT} depthOffset={0.045} />
      <RoomSprite position={[2.05, 1.03, -3.28]} crop={{ x: 965, y: 610, width: 120, height: 135 }} height={0.44} rotation={FLAT} depthOffset={0.047} />

      {/* Desk chair. */}
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
      </group>

      {/* SOFA — front/left living area. */}
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
      <RoomSprite position={[-2.55, 1.01, 1.88]} crop={{ x: 930, y: 835, width: 145, height: 105 }} height={0.66} rotation={FLAT} depthOffset={0.08} />
      <RoomSprite position={[-3.12, 1.00, 1.84]} crop={{ x: 1060, y: 835, width: 145, height: 115 }} height={0.62} rotation={FLAT} depthOffset={0.082} />

      {/* TV console opposite sofa. */}
      <group position={[-2.50, 0, 3.55]}>
        <mesh position={[0, 0.50, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.15, 0.78, 0.72]} />
          <meshStandardMaterial color="#4b3024" roughness={0.86} />
        </mesh>
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[3.30, 0.14, 0.82]} />
          <meshStandardMaterial color="#70492f" roughness={0.76} />
        </mesh>
      </group>
      <RoomSprite position={[-2.50, 1.48, 3.52]} crop={{ x: 1060, y: 670, width: 225, height: 155 }} height={0.94} depthOffset={0.08} />
      <RoomSprite position={[-3.52, 1.08, 3.52]} crop={{ x: 860, y: 785, width: 150, height: 130 }} height={0.48} rotation={FLAT} depthOffset={0.09} />

      {/* CENTER COFFEE/DINING TABLE. */}
      <group position={[0.55, 0, 2.10]}>
        <mesh position={[0, 0.54, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.05, 0.18, 1.25]} />
          <meshStandardMaterial color="#603d28" roughness={0.80} />
        </mesh>
        <mesh position={[0, 0.62, 0]} castShadow>
          <boxGeometry args={[2.18, 0.08, 1.36]} />
          <meshStandardMaterial color="#7a5032" roughness={0.72} />
        </mesh>
        {[-0.78, 0.78].map((x) => [-0.42, 0.42].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.26, z]} castShadow>
            <boxGeometry args={[0.12, 0.52, 0.12]} />
            <meshStandardMaterial color="#2b1b14" roughness={0.92} />
          </mesh>
        )))}
      </group>
      <RoomSprite position={[0.00, 0.68, 1.93]} crop={{ x: 680, y: 625, width: 120, height: 100 }} height={0.50} rotation={FLAT} depthOffset={0.09} />
      <RoomSprite position={[0.72, 0.68, 2.22]} crop={{ x: 780, y: 620, width: 95, height: 125 }} height={0.54} rotation={FLAT} depthOffset={0.092} />
      <RoomSprite position={[-0.05, 0.68, 2.45]} crop={{ x: 680, y: 710, width: 125, height: 90 }} height={0.46} rotation={FLAT} depthOffset={0.094} />
      <RoomSprite position={[0.82, 0.68, 1.92]} crop={{ x: 850, y: 635, width: 85, height: 115 }} height={0.52} rotation={FLAT} depthOffset={0.096} />

      {/* Dining chair. */}
      <group position={[0.62, 0, 3.18]}>
        <mesh position={[0, 0.58, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.08, 0.15, 0.96]} />
          <meshStandardMaterial color="#513526" roughness={0.86} />
        </mesh>
        <mesh position={[0, 1.02, -0.37]} castShadow>
          <boxGeometry args={[1.10, 0.88, 0.16]} />
          <meshStandardMaterial color="#25202d" roughness={0.96} />
        </mesh>
      </group>

      {/* RIGHT BOOKCASE / PROP STATION. */}
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
          <meshStandardMaterial color="#6b4630" />
        </mesh>
        <mesh position={[0, 0.55, 0.38]}>
          <boxGeometry args={[1.12, 0.06, 0.035]} />
          <meshStandardMaterial color="#6b4630" />
        </mesh>
      </group>
      <RoomSprite position={[3.55, 1.45, 1.95]} crop={{ x: 520, y: 600, width: 190, height: 300 }} height={0.86} rotation={FLAT} depthOffset={0.08} />
      <RoomSprite position={[3.55, 0.83, 1.95]} crop={{ x: 850, y: 770, width: 135, height: 80 }} height={0.46} rotation={FLAT} depthOffset={0.082} />
      <RoomSprite position={[3.55, 0.22, 1.95]} crop={{ x: 1260, y: 790, width: 180, height: 130 }} height={0.48} rotation={FLAT} depthOffset={0.084} />

      {/* Floor lamp + plants create the vertical silhouettes from the reference. */}
      <mesh position={[2.82, 0.20, 1.15]} castShadow>
        <cylinderGeometry args={[0.16, 0.23, 0.14, 12]} />
        <meshStandardMaterial color="#17131a" roughness={0.80} />
      </mesh>
      <mesh position={[2.82, 1.30, 1.15]} castShadow>
        <cylinderGeometry args={[0.045, 0.055, 2.10, 8]} />
        <meshStandardMaterial color="#2a2530" metalness={0.35} roughness={0.70} />
      </mesh>
      <mesh position={[2.82, 2.38, 1.15]} castShadow>
        <coneGeometry args={[0.34, 0.42, 16, 1, true]} />
        <meshStandardMaterial color="#a36c3c" emissive="#f59e0b" emissiveIntensity={0.30} roughness={0.82} side={2} />
      </mesh>
      <pointLight position={[2.82, 2.36, 1.22]} intensity={0.65} color="#ffad5a" distance={3.2} decay={2} />

      <RoomSprite position={[-4.10, 1.62, -2.65]} crop={{ x: 744, y: 11, width: 114, height: 296 }} height={1.60} depthOffset={0.035} />
      <RoomSprite position={[4.08, 1.58, -3.48]} crop={{ x: 1080, y: 372, width: 177, height: 190 }} height={0.98} depthOffset={0.035} />
      <RoomSprite position={[-4.10, 0.34, 0.95]} crop={{ x: 430, y: 575, width: 105, height: 330 }} height={1.10} rotation={FLAT} depthOffset={0.07} />
      <RoomSprite position={[4.08, 0.34, 3.60]} crop={{ x: 980, y: 675, width: 135, height: 145 }} height={0.64} rotation={FLAT} depthOffset={0.086} />

      <Player
        onInteractDesk={onInteractDesk}
        initialPosition={[0.15, 0, 0.10]}
        deskPosition={[1.95, -3.55]}
      />
    </group>
  );
});

Room.displayName = 'Room';
