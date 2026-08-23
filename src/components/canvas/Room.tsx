import React, { useCallback } from 'react';
import { Player } from './Player';
import * as THREE from 'three';

interface RoomSpriteProps {
  position: [number, number, number];
  scale: [number, number, number];
  onClick?: () => void;
}

const RoomSprite: React.FC<RoomSpriteProps> = React.memo(
  ({ position, scale, onClick }) => {
    const handleClick = useCallback(
      (event: THREE.Event) => {
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
        {/* Cuerpo principal del escritorio */}
        <mesh
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 1, 0.4]} />
          <meshStandardMaterial
            color="#8b5e3c"
            roughness={0.8}
            metalness={0}
          />
        </mesh>

        {/* Cubierta del escritorio */}
        <mesh
          position={[0, 0.55, 0.2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.9, 0.15, 0.5]} />
          <meshStandardMaterial
            color="#a67c52"
            roughness={0.7}
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
            ROOM LIGHTING
        ===================================================== */}

        <ambientLight
          intensity={0.35}
          color="#c7d8ff"
        />

        <directionalLight
          position={[6, 10, 6]}
          intensity={0.9}
          color="#fff4df"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0002}
          shadow-normalBias={0.02}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />

        {/* Luz cálida central */}
        <pointLight
          position={[0, 3, 0]}
          intensity={1}
          color="#ffa502"
          distance={8}
          decay={2}
        />

        {/* =====================================================
            FLOOR
        ===================================================== */}

        <mesh
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
        >
          <planeGeometry args={[10, 10]} />

          <meshStandardMaterial
            color="#1e1b18"
            roughness={0.92}
            metalness={0}
          />
        </mesh>

        {/* =====================================================
            BACK WALL
        ===================================================== */}

        <mesh
          receiveShadow
          position={[0, 2.5, -5]}
        >
          <planeGeometry args={[10, 5]} />

          <meshStandardMaterial
            color="#111827"
            roughness={0.9}
            metalness={0}
          />
        </mesh>

        {/* =====================================================
            LEFT WALL
        ===================================================== */}

        <mesh
          receiveShadow
          rotation={[0, Math.PI / 2, 0]}
          position={[-5, 2.5, 0]}
        >
          <planeGeometry args={[10, 5]} />

          <meshStandardMaterial
            color="#1f2937"
            roughness={0.9}
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