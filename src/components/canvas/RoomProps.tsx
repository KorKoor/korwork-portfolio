import React, { useEffect, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface RoomSpriteCrop {
  /**
   * Coordenadas del sprite dentro del atlas,
   * expresadas en píxeles.
   */
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RoomSpriteProps {
  position: [number, number, number];

  /**
   * Altura visual del sprite en unidades 3D.
   * El ancho se calcula automáticamente conservando
   * el aspect ratio original del sprite.
   */
  height: number;

  crop?: RoomSpriteCrop;

  /**
   * Para sprites que pertenecen a una superficie
   * horizontal, como cama, alfombra, escritorio, etc.
   */
  rotation?: [number, number, number];

  /**
   * Permite controlar ligeramente el orden de profundidad.
   */
  depthOffset?: number;

  onClick?: () => void;

  /**
   * Por defecto el sprite mira hacia la cámara.
   *
   * false:
   * mantiene la orientación del mundo.
   *
   * true:
   * billboard controlado.
   */
  billboard?: boolean;
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

      /*
       * Sin recorte:
       * usamos el atlas completo.
       */
      if (!crop) {
        tex.repeat.set(1, 1);
        tex.offset.set(0, 0);
      } else {
        const image = texture.image as { width: number; height: number };
        const imageWidth = image.width;
        const imageHeight = image.height;

        /*
         * repeat define qué fracción del atlas usamos.
         */
        tex.repeat.set(
          crop.width / imageWidth,
          crop.height / imageHeight,
        );

        /*
         * Three.js utiliza el origen inferior izquierdo
         * mientras que normalmente describimos sprites
         * usando coordenadas desde la esquina superior izquierda.
         */
        tex.offset.set(
          crop.x / imageWidth,
          1 - (crop.y + crop.height) / imageHeight,
        );
      }

      tex.needsUpdate = true;

      return tex;
    }, [
      texture,
      crop?.x,
      crop?.y,
      crop?.width,
      crop?.height,
    ]);

    useEffect(() => {
      return () => {
        croppedTexture.dispose();
      };
    }, [croppedTexture]);

    /*
     * Mantener el aspect ratio es CRÍTICO.
     *
     * Antes:
     *
     *   plane 1x1
     *       +
     *   scale arbitrario
     *
     * podía convertir una cama en un rectángulo
     * completamente deformado.
     *
     * Ahora:
     *
     *   height × aspectRatio = width
     */
    const aspectRatio = crop
      ? crop.width / crop.height
      : 1;

    const width = height * aspectRatio;

    return (
      <mesh
        position={[
          position[0],
          position[1],
          position[2] + depthOffset,
        ]}
        rotation={rotation}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.();
        }}
      >
        <planeGeometry
          args={[
            width,
            height,
          ]}
        />

        {billboard ? (
          <meshBasicMaterial
            map={croppedTexture}
            transparent
            alphaTest={0.08}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        ) : (
          <meshBasicMaterial
            map={croppedTexture}
            transparent
            alphaTest={0.08}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        )}
      </mesh>
    );
  },
);

RoomSprite.displayName = 'RoomSprite';