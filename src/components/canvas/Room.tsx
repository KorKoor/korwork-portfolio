import React, { useCallback } from 'react';
import { Player } from './Player';
import type { ThreeEvent } from '@react-three/fiber';

interface RoomSpriteProps {
  position: [number, number, number];
  scale: [number, number, number];
  onClick?: () => void;
}

const RoomSprite: React.FC<RoomSpriteProps> = React.memo(
  ({ position, scale, onClick }) => {
    const handleClick = useCallback(
      (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onClick?.();
      },
      [onClick],
    );

    return (
      <group
        position={position}
        scale={scale}
        onClick={handleClick}
      >
        {/* =====================================================
            DESK BODY
        ===================================================== */}

        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 0.4]} />

          <meshStandardMaterial
            color="#6f472d"
            roughness={0.86}
            metalness={0}
          />
        </mesh>

        {/* =====================================================
            DESK TOP
        ===================================================== */}

        <mesh
          position={[0, 0.55, 0.2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.94, 0.14, 0.52]} />

          <meshStandardMaterial
            color="#a67c52"
            roughness={0.72}
            metalness={0}
          />
        </mesh>

        {/* =====================================================
            FRONT PANEL
        ===================================================== */}

        <mesh
          position={[0, 0, 0.205]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.92, 0.82, 0.025]} />

          <meshStandardMaterial
            color="#57351f"
            roughness={0.9}
            metalness={0}
          />
        </mesh>
      </group>
    );
  },
);

RoomSprite.displayName = 'RoomSprite';

interface RoomProps {
  onInteractDesk: () => void;
}

export const Room: React.FC<RoomProps> = React.memo(
  ({ onInteractDesk }) => {
    const handleDeskInteraction = useCallback(() => {
      onInteractDesk();
    }, [onInteractDesk]);

    return (
      <group position={[0, 0, 0]}>

        {/* =====================================================
            LOCAL ROOM LIGHT
            Scene.tsx already handles global lighting.
        ===================================================== */}

        <pointLight
          position={[0, 3.2, -2.8]}
          intensity={0.75}
          color="#ffb45c"
          distance={7}
          decay={2}
        />

        {/* =====================================================
            FLOOR
        ===================================================== */}

        <mesh
          position={[0, -0.08, 0]}
          receiveShadow
        >
          <boxGeometry args={[10, 0.16, 10]} />

          <meshStandardMaterial
            color="#171411"
            roughness={0.94}
            metalness={0}
          />
        </mesh>

        {/* =====================================================
            BACK WALL
        ===================================================== */}

        <mesh
          position={[0, 2.5, -5]}
          receiveShadow
        >
          <boxGeometry args={[10, 5, 0.16]} />

          <meshStandardMaterial
            color="#0d1421"
            roughness={0.91}
            metalness={0}
          />
        </mesh>

        {/* =====================================================
            LEFT WALL
        ===================================================== */}

        <mesh
          position={[-5, 2.5, 0]}
          receiveShadow
        >
          <boxGeometry args={[0.16, 5, 10]} />

          <meshStandardMaterial
            color="#172033"
            roughness={0.92}
            metalness={0}
          />
        </mesh>

        {/* =====================================================
            DESK
        ===================================================== */}

        <RoomSprite
          position={[0, 1.8, -4.6]}
          scale={[3.2, 2.2, 1]}
          onClick={handleDeskInteraction}
        />

        {/* =====================================================
            PLAYER
        ===================================================== */}

        <Player
          onInteractDesk={onInteractDesk}
        />

      </group>
    );
  },
);

Room.displayName = 'Room';