import React, { useCallback } from 'react';
import { Player } from './Player';
import { RoomSprite } from './RoomProps';

interface RoomProps {
  onInteractDesk: () => void;
}

/**
 * Habitación 2.5D.
 *
 * Regla importante:
 * - Las paredes y el mobiliario estructural son geometría 3D.
 * - Los props del artwork permanecen como sprites planos.
 * - Los elementos de pared permanecen verticales.
 * - Los elementos de suelo se colocan horizontalmente.
 * - Nunca rotamos todos los sprites juntos para "forzar" una perspectiva.
 */
export const Room: React.FC<RoomProps> = React.memo(
  ({ onInteractDesk }) => {
    const handleDeskInteraction = useCallback(() => {
      onInteractDesk();
    }, [onInteractDesk]);

    return (
      <group>
        {/* ROOM SHELL */}
        <mesh position={[0, -0.14, 0]} receiveShadow>
          <boxGeometry args={[10.6, 0.28, 10.6]} />
          <meshStandardMaterial color="#17151b" roughness={1} metalness={0} />
        </mesh>

        <mesh position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[10, 0.08, 10]} />
          <meshStandardMaterial color="#29242f" roughness={1} metalness={0} />
        </mesh>

        <mesh position={[0.15, 0.065, 0.55]} receiveShadow>
          <boxGeometry args={[6.8, 0.035, 5.4]} />
          <meshStandardMaterial color="#37313f" roughness={1} metalness={0} />
        </mesh>

        {/* WALLS */}
        <mesh position={[0, 2.5, -5]} receiveShadow>
          <boxGeometry args={[10, 5, 0.16]} />
          <meshStandardMaterial color="#111827" roughness={1} metalness={0} />
        </mesh>

        <mesh position={[-5, 2.5, 0]} receiveShadow>
          <boxGeometry args={[0.16, 5, 10]} />
          <meshStandardMaterial color="#182238" roughness={1} metalness={0} />
        </mesh>

        <mesh position={[-4.9, 2.5, -4.9]} receiveShadow>
          <boxGeometry args={[0.22, 5.1, 0.22]} />
          <meshStandardMaterial color="#080b13" roughness={1} metalness={0} />
        </mesh>

        {/* WALL ART — vertical, never rotated 45° */}
        <RoomSprite
          position={[-2.55, 3.42, -4.88]}
          crop={{ x: 351, y: 22, width: 384, height: 302 }}
          height={1.95}
          depthOffset={0.012}
        />

        <RoomSprite
          position={[0.25, 3.42, -4.87]}
          crop={{ x: 880, y: 28, width: 244, height: 278 }}
          height={2.05}
          depthOffset={0.014}
        />

        <RoomSprite
          position={[3.05, 3.42, -4.86]}
          crop={{ x: 1150, y: 15, width: 143, height: 196 }}
          height={1.55}
          depthOffset={0.016}
        />

        <RoomSprite
          position={[2.05, 2.85, -4.84]}
          crop={{ x: 744, y: 11, width: 114, height: 296 }}
          height={1.9}
          depthOffset={0.018}
        />

        <RoomSprite
          position={[4.35, 2.38, -4.83]}
          crop={{ x: 1424, y: 16, width: 102, height: 311 }}
          height={2.35}
          depthOffset={0.02}
        />

        {/* DESK */}
        <group position={[0.25, 0, -3.85]} onClick={handleDeskInteraction}>
          <mesh position={[0, 1.02, 0]} castShadow receiveShadow>
            <boxGeometry args={[4.8, 0.16, 1.05]} />
            <meshStandardMaterial color="#6f4c31" roughness={0.9} metalness={0} />
          </mesh>

          <mesh position={[0, 0.55, 0.34]} castShadow receiveShadow>
            <boxGeometry args={[4.35, 0.82, 0.12]} />
            <meshStandardMaterial color="#4b3021" roughness={0.95} metalness={0} />
          </mesh>

          <mesh position={[-2.05, 0.48, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.18, 0.9, 0.8]} />
            <meshStandardMaterial color="#3a251a" roughness={1} metalness={0} />
          </mesh>

          <mesh position={[2.05, 0.48, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.18, 0.9, 0.8]} />
            <meshStandardMaterial color="#3a251a" roughness={1} metalness={0} />
          </mesh>
        </group>

        {/* DESK EQUIPMENT — vertical sprites on the desk */}
        <RoomSprite
          position={[-1.35, 1.35, -3.78]}
          crop={{ x: 220, y: 359, width: 263, height: 212 }}
          height={1.18}
          depthOffset={0.03}
        />

        <RoomSprite
          position={[0.05, 1.65, -4.02]}
          crop={{ x: 394, y: 345, width: 264, height: 195 }}
          height={1.35}
          depthOffset={0.032}
        />

        <RoomSprite
          position={[1.35, 1.62, -3.98]}
          crop={{ x: 662, y: 335, width: 135, height: 220 }}
          height={1.38}
          depthOffset={0.034}
        />

        <RoomSprite
          position={[2.15, 1.65, -3.72]}
          crop={{ x: 799, y: 318, width: 166, height: 244 }}
          height={1.45}
          depthOffset={0.036}
        />

        {/* RIGHT WALL DECOR */}
        <RoomSprite
          position={[3.05, 1.45, -4.80]}
          crop={{ x: 1103, y: 202, width: 322, height: 164 }}
          height={1.05}
          depthOffset={0.04}
        />

        <RoomSprite
          position={[3.45, 2.55, -4.82]}
          crop={{ x: 1080, y: 372, width: 177, height: 190 }}
          height={1.18}
          depthOffset={0.042}
        />

        <RoomSprite
          position={[4.15, 2.45, -4.81]}
          crop={{ x: 1270, y: 367, width: 251, height: 227 }}
          height={1.2}
          depthOffset={0.044}
        />

        {/* BED — horizontal floor sprite */}
        <mesh position={[-2.65, 0.12, -1.55]} receiveShadow castShadow>
          <boxGeometry args={[3.55, 0.16, 3.15]} />
          <meshStandardMaterial color="#171522" roughness={1} metalness={0} />
        </mesh>

        <RoomSprite
          position={[-2.65, 0.215, -1.55]}
          crop={{ x: 4, y: 569, width: 418, height: 371 }}
          height={3.0}
          rotation={[-Math.PI / 2, 0, 0]}
          depthOffset={0.05}
        />

        <Player onInteractDesk={onInteractDesk} />
      </group>
    );
  },
);

Room.displayName = 'Room';