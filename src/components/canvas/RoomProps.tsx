import React, { useEffect, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface RoomSpriteCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RoomSpriteProps {
  position: [number, number, number];
  height: number;
  crop?: RoomSpriteCrop;
  rotation?: [number, number, number];
  depthOffset?: number;
  onClick?: () => void;
  billboard?: boolean;

  /** Elevación adicional para que los props puedan quedar realmente sobre muebles. */
  elevation?: number;
  /** Permite hacer que un sprite parezca ligeramente separado de la superficie. */
  lift?: number;
  /** Sombra del sprite sobre el suelo/mueble/pared. */
  castShadow?: boolean;
  /** Recibe sombras de otros objetos. */
  receiveShadow?: boolean;
  /** Intensidad de la integración con la iluminación 3D. */
  toneMapped?: boolean;
}

export const RoomSprite = React.memo<RoomSpriteProps>(
  ({
    position,
    height,
    crop,
    rotation = [0, 0, 0],
    depthOffset = 0,
    onClick,
    billboard = false,
    elevation = 0,
    lift = 0,
    castShadow = true,
    receiveShadow = true,
    toneMapped = true,
  }) => {
    const texture = useTexture('/assets/Rooms/room-props.png');

    const croppedTexture = useMemo(() => {
      const tex = texture.clone();
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 1;

      if (!crop) {
        tex.repeat.set(1, 1);
        tex.offset.set(0, 0);
      } else {
        const image = texture.image as { width: number; height: number };
        const imageWidth = image.width;
        const imageHeight = image.height;

        tex.repeat.set(crop.width / imageWidth, crop.height / imageHeight);
        tex.offset.set(
          crop.x / imageWidth,
          1 - (crop.y + crop.height) / imageHeight,
        );
      }

      tex.needsUpdate = true;
      return tex;
    }, [texture, crop?.x, crop?.y, crop?.width, crop?.height]);

    useEffect(() => {
      return () => croppedTexture.dispose();
    }, [croppedTexture]);

    const aspectRatio = crop ? crop.width / crop.height : 1;
    const width = height * aspectRatio;
    const finalY = position[1] + elevation + lift;

    return (
      <mesh
        position={[position[0], finalY, position[2] + depthOffset]}
        rotation={rotation}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.();
        }}
      >
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={croppedTexture}
          transparent
          alphaTest={0.18}
          side={THREE.DoubleSide}
          roughness={0.92}
          metalness={0}
          toneMapped={toneMapped}
          depthWrite
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
    );
  },
);

RoomSprite.displayName = 'RoomSprite';
