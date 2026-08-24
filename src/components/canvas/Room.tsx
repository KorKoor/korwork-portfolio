import React, { useCallback } from 'react';
import { Player } from './Player';
import { RoomSprite } from './RoomProps';

interface RoomProps {
  onInteractDesk: () => void;
}

/**
 * Habitación 2.5D.
 *
 * La escena está construida en tres capas:
 * 1. Arquitectura 3D: suelo, paredes, zócalos y molduras.
 * 2. Relieve 3D: tarima, alfombra, cama y escritorio con volumen real.
 * 3. Pixel-art: sprites del atlas colocados sobre la superficie correcta.
 *
 * No se aplica una rotación isométrica global a los sprites.
 */
export const Room: React.FC<RoomProps> = React.memo(({ onInteractDesk }) => {
  const handleDeskInteraction = useCallback(() => {
    onInteractDesk();
  }, [onInteractDesk]);

  return (
    <group>
      {/* FLOOR / TERRAIN */}
      <mesh position={[0, -0.18, 0]} receiveShadow>
        <boxGeometry args={[10.9, 0.34, 10.9]} />
        <meshStandardMaterial color="#0d0c12" roughness={0.92} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.015, 0]} receiveShadow castShadow>
        <boxGeometry args={[10.05, 0.12, 10.05]} />
        <meshStandardMaterial color="#282431" roughness={0.9} metalness={0.02} />
      </mesh>
      <mesh position={[0.15, 0.085, 0.5]} receiveShadow>
        <boxGeometry args={[7.05, 0.055, 5.7]} />
        <meshStandardMaterial color="#35303f" roughness={0.86} metalness={0.03} />
      </mesh>

      {/* Floor perimeter relief */}
      <mesh position={[0, 0.105, -4.68]} receiveShadow>
        <boxGeometry args={[9.35, 0.08, 0.16]} />
        <meshStandardMaterial color="#454052" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.105, 4.68]} receiveShadow>
        <boxGeometry args={[9.35, 0.08, 0.16]} />
        <meshStandardMaterial color="#17151d" roughness={0.9} />
      </mesh>
      <mesh position={[-4.68, 0.105, 0]} receiveShadow>
        <boxGeometry args={[0.16, 0.08, 9.35]} />
        <meshStandardMaterial color="#34303d" roughness={0.82} />
      </mesh>
      <mesh position={[4.68, 0.105, 0]} receiveShadow>
        <boxGeometry args={[0.16, 0.08, 9.35]} />
        <meshStandardMaterial color="#17151d" roughness={0.9} />
      </mesh>

      {/* Raised rug / play area */}
      <mesh position={[0.15, 0.125, 0.55]} receiveShadow castShadow>
        <boxGeometry args={[6.85, 0.065, 5.45]} />
        <meshStandardMaterial color="#3a3445" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0.15, 0.165, 0.55]} receiveShadow>
        <boxGeometry args={[6.55, 0.025, 5.15]} />
        <meshStandardMaterial color="#302b39" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0.15, 0.195, 3.08]} receiveShadow>
        <boxGeometry args={[6.55, 0.045, 0.06]} />
        <meshStandardMaterial color="#4b4354" roughness={0.9} />
      </mesh>

      {/* WALLS */}
      <mesh position={[0, 2.5, -5]} receiveShadow>
        <boxGeometry args={[10, 5, 0.18]} />
        <meshStandardMaterial color="#0f1728" roughness={0.96} metalness={0.02} />
      </mesh>
      <mesh position={[-5, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.18, 5, 10]} />
        <meshStandardMaterial color="#17223a" roughness={0.96} metalness={0.02} />
      </mesh>
      <mesh position={[-4.88, 2.55, -4.88]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 5.15, 0.22]} />
        <meshStandardMaterial color="#070a12" roughness={0.92} />
      </mesh>

      {/* Wall lower relief / wainscot */}
      <mesh position={[0, 0.46, -4.87]} receiveShadow>
        <boxGeometry args={[9.7, 0.72, 0.12]} />
        <meshStandardMaterial color="#0b1120" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.84, -4.81]} receiveShadow>
        <boxGeometry args={[9.7, 0.075, 0.13]} />
        <meshStandardMaterial color="#263149" roughness={0.75} />
      </mesh>
      <mesh position={[-4.82, 0.46, 0]} receiveShadow>
        <boxGeometry args={[0.13, 0.72, 9.7]} />
        <meshStandardMaterial color="#0b1120" roughness={0.92} />
      </mesh>
      <mesh position={[-4.76, 0.84, 0]} receiveShadow>
        <boxGeometry args={[0.14, 0.075, 9.7]} />
        <meshStandardMaterial color="#263149" roughness={0.75} />
      </mesh>
      <mesh position={[0, 4.88, -4.84]} receiveShadow>
        <boxGeometry args={[9.75, 0.16, 0.22]} />
        <meshStandardMaterial color="#080c16" roughness={0.9} />
      </mesh>
      <mesh position={[-4.84, 4.88, 0]} receiveShadow>
        <boxGeometry args={[0.22, 0.16, 9.75]} />
        <meshStandardMaterial color="#080c16" roughness={0.9} />
      </mesh>

      {/* WALL PIXEL ART */}
      <RoomSprite position={[-2.55, 3.42, -4.75]} crop={{ x: 351, y: 22, width: 384, height: 302 }} height={1.95} depthOffset={0.018} />
      <RoomSprite position={[0.25, 3.42, -4.74]} crop={{ x: 880, y: 28, width: 244, height: 278 }} height={2.05} depthOffset={0.02} />
      <RoomSprite position={[3.05, 3.42, -4.73]} crop={{ x: 1150, y: 15, width: 143, height: 196 }} height={1.55} depthOffset={0.022} />
      <RoomSprite position={[2.05, 2.85, -4.72]} crop={{ x: 744, y: 11, width: 114, height: 296 }} height={1.9} depthOffset={0.024} />
      <RoomSprite position={[4.35, 2.38, -4.71]} crop={{ x: 1424, y: 16, width: 102, height: 311 }} height={2.35} depthOffset={0.026} />

      {/* DESK — REAL 3D RELIEF */}
      <group position={[0.35, 0, -3.65]} onClick={handleDeskInteraction}>
        <mesh position={[0, 0.55, 0.38]} castShadow receiveShadow>
          <boxGeometry args={[4.65, 0.9, 0.16]} />
          <meshStandardMaterial color="#382419" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.52, 0.02]} castShadow receiveShadow>
          <boxGeometry args={[4.5, 0.82, 0.78]} />
          <meshStandardMaterial color="#4a3020" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.64, -0.39]} receiveShadow>
          <boxGeometry args={[4.05, 0.16, 0.035]} />
          <meshStandardMaterial color="#5d3b26" roughness={0.84} />
        </mesh>
        <mesh position={[0, 1.03, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.95, 0.18, 1.12]} />
          <meshStandardMaterial color="#6d4b31" roughness={0.82} metalness={0.02} />
        </mesh>
        <mesh position={[0, 1.145, -0.48]} castShadow>
          <boxGeometry args={[4.78, 0.07, 0.08]} />
          <meshStandardMaterial color="#8b6342" roughness={0.76} />
        </mesh>
        <mesh position={[-2.08, 0.47, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.22, 0.86, 0.86]} />
          <meshStandardMaterial color="#342219" roughness={0.95} />
        </mesh>
        <mesh position={[2.08, 0.47, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.22, 0.86, 0.86]} />
          <meshStandardMaterial color="#342219" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.17, 0.24]} castShadow receiveShadow>
          <boxGeometry args={[4.15, 0.12, 0.14]} />
          <meshStandardMaterial color="#241812" roughness={0.96} />
        </mesh>
        <mesh position={[0, 0.13, -0.39]}>
          <boxGeometry args={[3.75, 0.035, 0.025]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
      </group>

      {/* DESK EQUIPMENT */}
      <RoomSprite position={[-1.35, 1.43, -3.58]} crop={{ x: 220, y: 359, width: 263, height: 212 }} height={1.18} depthOffset={0.035} />
      <RoomSprite position={[0.05, 1.73, -3.83]} crop={{ x: 394, y: 345, width: 264, height: 195 }} height={1.35} depthOffset={0.038} />
      <RoomSprite position={[1.35, 1.70, -3.79]} crop={{ x: 662, y: 335, width: 135, height: 220 }} height={1.38} depthOffset={0.04} />
      <RoomSprite position={[2.15, 1.72, -3.52]} crop={{ x: 799, y: 318, width: 166, height: 244 }} height={1.45} depthOffset={0.042} />

      {/* RIGHT WALL DECOR */}
      <RoomSprite position={[3.05, 1.45, -4.69]} crop={{ x: 1103, y: 202, width: 322, height: 164 }} height={1.05} depthOffset={0.044} />
      <RoomSprite position={[3.45, 2.55, -4.70]} crop={{ x: 1080, y: 372, width: 177, height: 190 }} height={1.18} depthOffset={0.046} />
      <RoomSprite position={[4.15, 2.45, -4.69]} crop={{ x: 1270, y: 367, width: 251, height: 227 }} height={1.2} depthOffset={0.048} />

      {/* BED — VOLUMETRIC BASE + PIXEL ART */}
      <group position={[-2.65, 0, -1.55]}>
        <mesh position={[0, 0.16, 0]} receiveShadow castShadow>
          <boxGeometry args={[3.75, 0.24, 3.28]} />
          <meshStandardMaterial color="#11101a" roughness={0.96} />
        </mesh>
        <mesh position={[0, 0.30, 0]} receiveShadow castShadow>
          <boxGeometry args={[3.58, 0.16, 3.12]} />
          <meshStandardMaterial color="#2a2029" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.43, 0]} receiveShadow castShadow>
          <boxGeometry args={[3.38, 0.22, 2.92]} />
          <meshStandardMaterial color="#211e2b" roughness={0.98} />
        </mesh>
        <mesh position={[-1.64, 0.72, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.18, 0.9, 3.05]} />
          <meshStandardMaterial color="#3b2930" roughness={0.9} />
        </mesh>
        <mesh position={[-1.72, 1.18, 0]} castShadow>
          <boxGeometry args={[0.28, 0.12, 3.18]} />
          <meshStandardMaterial color="#61422f" roughness={0.82} />
        </mesh>
        <RoomSprite position={[0, 0.56, 0]} crop={{ x: 4, y: 569, width: 418, height: 371 }} height={3.0} rotation={[-Math.PI / 2, 0, 0]} depthOffset={0.055} />
      </group>

      {/* SMALL 3D RELIEF DETAILS */}
      <mesh position={[2.35, 0.20, -1.95]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.19, 0.12, 8]} />
        <meshStandardMaterial color="#11131b" roughness={0.75} metalness={0.3} />
      </mesh>
      <mesh position={[2.35, 0.275, -1.95]}>
        <cylinderGeometry args={[0.07, 0.07, 0.018, 8]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <mesh position={[2.85, 0.19, 1.75]} receiveShadow castShadow>
        <boxGeometry args={[0.65, 0.14, 0.65]} />
        <meshStandardMaterial color="#24202b" roughness={0.92} />
      </mesh>

      <Player onInteractDesk={onInteractDesk} />
    </group>
  );
});

Room.displayName = 'Room';