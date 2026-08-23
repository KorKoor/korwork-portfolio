import React, { useEffect, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface RoomSpriteProps {
  position: [number, number, number];
  scale?: [number, number, number];
  crop?: {
    repeat: [number, number];
    offset: [number, number];
  };
  onClick?: () => void;
}

export const RoomSprite = React.memo<RoomSpriteProps>(
  ({
    position,
    scale = [2, 1.5, 1],
    crop,
    onClick,
  }) => {
    const texture = useTexture('/assets/room-props.png');

    const croppedTexture = useMemo(() => {
      const tex = texture.clone();

      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;

      tex.colorSpace = THREE.SRGBColorSpace;

      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;

      if (crop) {
        tex.repeat.set(
          crop.repeat[0],
          crop.repeat[1],
        );

        tex.offset.set(
          crop.offset[0],
          crop.offset[1],
        );
      }

      tex.needsUpdate = true;

      return tex;
    }, [
      texture,
      crop?.repeat[0],
      crop?.repeat[1],
      crop?.offset[0],
      crop?.offset[1],
    ]);

    useEffect(() => {
      return () => {
        croppedTexture.dispose();
      };
    }, [croppedTexture]);

    return (
      <mesh
        position={position}
        scale={scale}
        onClick={onClick}
      >
        <planeGeometry args={[1, 1]} />

        <meshStandardMaterial
          map={croppedTexture}
          transparent
          alphaTest={0.5}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    );
  },
);

RoomSprite.displayName = 'RoomSprite';