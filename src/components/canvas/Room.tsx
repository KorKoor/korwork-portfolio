import React, { useCallback, useEffect, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { Player } from './Player';
import * as THREE from 'three';

const ROOM_PROPS = '/assets/Rooms/room-props.png';

/**
 * El atlas está definido en coordenadas de píxel,
 * empezando desde la esquina superior izquierda.
 */
interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RoomSpriteProps {
  position: [number, number, number];
  crop: Crop;

  /**
   * Altura visual del sprite.
   * El ancho se calcula automáticamente para evitar
   * deformar el pixel-art.
   */
  height: number;

  /**
   * Rotación explícita del sprite.
   *
   * Para los elementos de pared usamos el ángulo
   * isométrico de la cámara.
   *
   * Para objetos especiales podemos modificarlo.
   */
  rotation?: [number, number, number];

  /**
   * Micro-offset de profundidad.
   */
  depth?: number;

  onClick?: () => void;
}

/**
 * Ángulo horizontal de nuestra cámara isométrica.
 *
 * Cámara:
 * [12, 12, 12]
 *
 * Por lo tanto los sprites deben mirar aproximadamente
 * hacia la diagonal +X/+Z.
 */
const ISO_YAW = Math.PI / 4;

/**
 * Sprite pixel-art del atlas.
 *
 * Importante:
 * - No usamos meshStandardMaterial.
 * - No usamos escala arbitraria.
 * - No deformamos el aspect ratio.
 * - El sprite conserva su iluminación original.
 */
const RoomSprite = React.memo<RoomSpriteProps>(
  ({
    position,
    crop,
    height,
    rotation = [0, ISO_YAW, 0],
    depth = 0,
    onClick,
  }) => {
    const atlas = useTexture(ROOM_PROPS);

    const texture = useMemo(() => {
      const tex = atlas.clone();

      const image = atlas.image as {
        width: number;
        height: number;
      };

      const atlasWidth = image.width;
      const atlasHeight = image.height;

      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;

      /**
       * MUY IMPORTANTE para pixel-art.
       */
      tex.generateMipmaps = false;

      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;

      tex.colorSpace = THREE.SRGBColorSpace;

      tex.repeat.set(
        crop.width / atlasWidth,
        crop.height / atlasHeight,
      );

      /**
       * El atlas está definido de arriba → abajo,
       * mientras Three.js trabaja de abajo → arriba.
       */
      tex.offset.set(
        crop.x / atlasWidth,
        1 - (crop.y + crop.height) / atlasHeight,
      );

      tex.needsUpdate = true;

      return tex;
    }, [
      atlas,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
    ]);

    useEffect(() => {
      return () => {
        texture.dispose();
      };
    }, [texture]);

    /**
     * Nunca deformamos el sprite.
     *
     * width = height × aspectRatio
     */
    const aspect = crop.width / crop.height;
    const width = height * aspect;

    const handleClick = useCallback(
      (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onClick?.();
      },
      [onClick],
    );

    return (
      <mesh
        position={[
          position[0],
          position[1],
          position[2] + depth,
        ]}
        rotation={rotation}
        onClick={handleClick}
      >
        <planeGeometry args={[width, height]} />

        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.08}
          depthWrite
          depthTest
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
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
      <group>
        {/* =====================================================
            FLOOR BASE
        ===================================================== */}

        <mesh
          position={[0, -0.12, 0]}
          receiveShadow
        >
          <boxGeometry args={[10.5, 0.24, 10.5]} />

          <meshStandardMaterial
            color="#211c25"
            roughness={1}
            metalness={0}
          />
        </mesh>

        {/* =====================================================
            FLOOR
        ===================================================== */}

        <mesh
          position={[0, 0.015, 0.5]}
          receiveShadow
        >
          <boxGeometry args={[8.8, 0.04, 8.8]} />

          <meshStandardMaterial
            color="#29232d"
            roughness={1}
            metalness={0}
          />
        </mesh>

        {/* =====================================================
            RUG
        ===================================================== */}

        <mesh
          position={[0.15, 0.04, 0.75]}
          receiveShadow
        >
          <boxGeometry args={[6.4, 0.035, 4.8]} />

          <meshStandardMaterial
            color="#342d3b"
            roughness={1}
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
            color="#111827"
            roughness={1}
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
            color="#182238"
            roughness={1}
            metalness={0}
          />
        </mesh>

        {/* =====================================================
            WALL CORNER
        ===================================================== */}

        <mesh
          position={[-4.9, 2.5, -4.9]}
          receiveShadow
        >
          <boxGeometry args={[0.22, 5.1, 0.22]} />

          <meshStandardMaterial
            color="#080b13"
            roughness={1}
            metalness={0}
          />
        </mesh>

        {/* =====================================================
            WALL DECORATION
        ===================================================== */}

        {/* ---------------- CORCHO ---------------- */}

        <RoomSprite
          position={[-2.35, 3.25, -4.82]}
          crop={{
            x: 350,
            y: 22,
            width: 385,
            height: 302,
          }}
          height={2.05}
          depth={0.01}
        />

        {/* ---------------- WINDOW ---------------- */}

        <RoomSprite
          position={[0.95, 3.2, -4.81]}
          crop={{
            x: 875,
            y: 28,
            width: 245,
            height: 297,
          }}
          height={2.25}
          depth={0.015}
        />

        {/* ---------------- HANGING PLANT ---------------- */}

        <RoomSprite
          position={[3.35, 3.15, -4.79]}
          crop={{
            x: 744,
            y: 11,
            width: 126,
            height: 319,
          }}
          height={2.4}
          depth={0.02}
        />

        {/* ---------------- GUITAR ---------------- */}

        <RoomSprite
          position={[4.35, 2.45, -4.78]}
          crop={{
            x: 1435,
            y: 16,
            width: 91,
            height: 312,
          }}
          height={2.65}
          depth={0.025}
        />

        {/* =====================================================
            DESK
        ===================================================== */}

        {/*
         * Ya NO construimos un escritorio completo con cajas.
         *
         * El artwork del atlas contiene el lenguaje visual
         * que queremos mantener.
         */}

        <RoomSprite
          position={[-0.35, 1.45, -4.55]}
          crop={{
            x: 215,
            y: 345,
            width: 720,
            height: 250,
          }}
          height={1.55}
          depth={0.05}
          onClick={handleDeskInteraction}
        />

        {/* =====================================================
            DESK LAMP
        ===================================================== */}

        <RoomSprite
          position={[2.0, 1.65, -4.5]}
          crop={{
            x: 800,
            y: 318,
            width: 180,
            height: 187,
          }}
          height={1.2}
          depth={0.06}
        />

        {/* =====================================================
            SHELF
        ===================================================== */}

        <RoomSprite
          position={[3.05, 1.48, -4.65]}
          crop={{
            x: 1100,
            y: 195,
            width: 345,
            height: 165,
          }}
          height={1.28}
          depth={0.07}
        />

        {/* =====================================================
            NOTES
        ===================================================== */}

        <RoomSprite
          position={[3.1, 3.15, -4.68]}
          crop={{
            x: 1080,
            y: 365,
            width: 177,
            height: 197,
          }}
          height={1.35}
          depth={0.08}
        />

        {/* =====================================================
            AGUASCALIENTES MAP
        ===================================================== */}

        <RoomSprite
          position={[4.0, 2.35, -4.67]}
          crop={{
            x: 1265,
            y: 365,
            width: 256,
            height: 235,
          }}
          height={1.45}
          depth={0.08}
        />

        {/* =====================================================
            BED
        ===================================================== */}

        {/*
         * La cama es el elemento especial.
         *
         * NO queremos que parezca un cuadro pegado a una pared.
         *
         * La mantenemos orientada hacia nuestra composición
         * isométrica y la desplazamos hacia el fondo/lateral.
         *
         * La posición Y representa el nivel visual del objeto,
         * mientras la orientación mantiene el pixel-art
         * consistente con la cámara.
         */}

        <RoomSprite
          position={[-3.0, 1.48, -1.9]}
          crop={{
            x: 1,
            y: 570,
            width: 414,
            height: 380,
          }}
          height={3.05}
          rotation={[0, ISO_YAW, 0]}
          depth={0.12}
        />

        {/* =====================================================
            FLOOR PETS / FLOOR DECORATION
        ===================================================== */}

        <RoomSprite
          position={[1.2, 0.72, 1.15]}
          crop={{
            x: 680,
            y: 770,
            width: 430,
            height: 140,
          }}
          height={0.95}
          rotation={[0, ISO_YAW, 0]}
          depth={0.15}
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