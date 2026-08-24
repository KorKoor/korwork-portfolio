import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';

type Direction = 'down' | 'up' | 'left' | 'right';

interface Interactable {
  id: string;
  position: [number, number]; // [x, z]
  radius: number;
  onInteract: () => void;
}

interface PlayerProps {
  onInteractDesk: () => void;
  /** Posición inicial del jugador en el mundo (x, y del piso, z) */
  initialPosition?: [number, number, number];
  /** Velocidad en unidades/segundo (independiente del framerate) */
  speed?: number;
  /** Posición del escritorio interactuable en el plano XZ */
  deskPosition?: [number, number];
  /** Radio de interacción con el escritorio */
  interactRadius?: number;
  /** Muestra una sombra de contacto elíptica bajo los pies (default: true) */
  showGroundShadow?: boolean;
  /** El sprite proyecta sombra dinámica sobre otros objetos (default: true) */
  castShadow?: boolean;
}

// ---------------------------------------------------------------------------
// Assets (sin cambios respecto a la versión anterior)
// ---------------------------------------------------------------------------
const WALK_DIR = '/assets/Player-Actions/Walk';
const idleFrontPaths = [`${WALK_DIR}/tile000.png`];
const idleSidePaths = [`${WALK_DIR}/tile001.png`, `${WALK_DIR}/tile003.png`];
const idleBackPaths = [`${WALK_DIR}/tile002.png`];
const walkFrontPaths = [`${WALK_DIR}/tile004.png`, `${WALK_DIR}/tile005.png`];
const walkBackPaths = [`${WALK_DIR}/tile007.png`];

const walkSideFiles = [
  'tile000', 'tile001', 'tile002', 'tile003', 'tile004', 'tile005',
  'tile007', 'tile008', 'tile009', 'tile010', 'tile011', 'tile012',
];
const walkSidePaths = walkSideFiles.map((f) => `${WALK_DIR}/Walk2/${f}.png`);

// ---------------------------------------------------------------------------
// Constantes de comportamiento
// ---------------------------------------------------------------------------
const DEFAULT_SPEED = 2.4;
const DEFAULT_DESK_POSITION: [number, number] = [0, -3.5];
const DEFAULT_INTERACT_RADIUS = 1.2;
const SPRITE_HEIGHT = 1.4; // altura local del quad del personaje
const SPRITE_BASE_ASPECT = 1.0 / SPRITE_HEIGHT;

const FRAME_DURATION_IDLE = 0.5;
const FRAME_DURATION_WALK_FRONT_BACK = 0.16;
const FRAME_DURATION_WALK_SIDE = 0.07;

interface AnimState {
  frames: THREE.Texture[];
  frameDuration: number;
  mirror: boolean;
}

// ---------------------------------------------------------------------------
// Textura procedural para la sombra de contacto: un radial-gradient simple,
// generado una sola vez en un <canvas> offscreen (no requiere ningún asset).
// ---------------------------------------------------------------------------
function useGroundShadowTexture(): THREE.Texture {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(0,0,0,0.45)');
    gradient.addColorStop(0.7, 'rgba(0,0,0,0.25)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

export const Player: React.FC<PlayerProps> = ({
  onInteractDesk,
  initialPosition = [0, 0, 0],
  speed = DEFAULT_SPEED,
  deskPosition = DEFAULT_DESK_POSITION,
  interactRadius = DEFAULT_INTERACT_RADIUS,
  showGroundShadow = true,
  castShadow = true,
}) => {
  // El group es quien se mueve por el mundo (x/z); el sprite es un hijo que
  // solo rota para mirar a la cámara (billboard), sin arrastrar esa rotación
  // a la posición ni a la sombra de piso.
  const groupRef = useRef<THREE.Group>(null);
  const spriteRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const movement = useKeyboardControls();

  const idleFrontTextures = useTexture(idleFrontPaths) as THREE.Texture[];
  const idleSideTextures = useTexture(idleSidePaths) as THREE.Texture[];
  const idleBackTextures = useTexture(idleBackPaths) as THREE.Texture[];
  const walkFrontTextures = useTexture(walkFrontPaths) as THREE.Texture[];
  const walkBackTextures = useTexture(walkBackPaths) as THREE.Texture[];
  const walkSideTextures = useTexture(walkSidePaths) as THREE.Texture[];
  const groundShadowTexture = useGroundShadowTexture();

  const allTextures = useMemo(
    () => [
      ...idleFrontTextures,
      ...idleSideTextures,
      ...idleBackTextures,
      ...walkFrontTextures,
      ...walkBackTextures,
      ...walkSideTextures,
    ],
    [idleFrontTextures, idleSideTextures, idleBackTextures, walkFrontTextures, walkBackTextures, walkSideTextures]
  );

  useEffect(() => {
    allTextures.forEach((tex) => {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.center.set(0.5, 0.5);
      tex.wrapS = THREE.RepeatWrapping;
    });
  }, [allTextures]);

  const frameTimer = useRef(0);
  const currentFrame = useRef(0);
  const currentDirection = useRef<Direction>('down');
  const wasMoving = useRef(false);
  const wasInteractPressed = useRef(false);

  const interactables = useMemo<Interactable[]>(
    () => [
      { id: 'desk', position: deskPosition, radius: interactRadius, onInteract: onInteractDesk },
    ],
    [deskPosition, interactRadius, onInteractDesk]
  );

  const getAnimState = (direction: Direction, isMoving: boolean): AnimState => {
    switch (direction) {
      case 'down':
        return isMoving
          ? { frames: walkFrontTextures, frameDuration: FRAME_DURATION_WALK_FRONT_BACK, mirror: false }
          : { frames: idleFrontTextures, frameDuration: FRAME_DURATION_IDLE, mirror: false };
      case 'up':
        return isMoving
          ? { frames: walkBackTextures, frameDuration: FRAME_DURATION_WALK_FRONT_BACK, mirror: false }
          : { frames: idleBackTextures, frameDuration: FRAME_DURATION_IDLE, mirror: false };
      case 'left':
      case 'right':
        return isMoving
          ? { frames: walkSideTextures, frameDuration: FRAME_DURATION_WALK_SIDE, mirror: direction === 'left' }
          : { frames: idleSideTextures, frameDuration: FRAME_DURATION_IDLE, mirror: direction === 'left' };
    }
  };

  useFrame((state, rawDelta) => {
    if (!groupRef.current || !spriteRef.current || !materialRef.current) return;

    const delta = Math.min(rawDelta, 1 / 30);
    const currentPos = groupRef.current.position;

    // --- Movimiento (igual que antes: diagonal normalizada, delta-time) ---
    let moveX = 0;
    let moveZ = 0;
    if (movement.moveBackward) moveZ += 1;
    if (movement.moveForward) moveZ -= 1;
    if (movement.moveLeft) moveX -= 1;
    if (movement.moveRight) moveX += 1;

    const isMoving = moveX !== 0 || moveZ !== 0;

    if (isMoving) {
      const length = Math.hypot(moveX, moveZ);
      currentPos.x += (moveX / length) * speed * delta;
      currentPos.z += (moveZ / length) * speed * delta;
    }

    // --- Dirección del sprite (misma lógica que antes) ---
    let newDirection = currentDirection.current;
    if (isMoving) {
      newDirection =
        Math.abs(moveX) >= Math.abs(moveZ)
          ? moveX > 0 ? 'right' : 'left'
          : moveZ > 0 ? 'down' : 'up';
    }

    const directionChanged = newDirection !== currentDirection.current;
    const movementStateChanged = isMoving !== wasMoving.current;

    if (directionChanged || movementStateChanged) {
      currentDirection.current = newDirection;
      wasMoving.current = isMoving;
      currentFrame.current = 0;
      frameTimer.current = 0;
    }

    const { frames, frameDuration, mirror } = getAnimState(currentDirection.current, isMoving);

    if (frames.length > 1) {
      frameTimer.current += delta;
      while (frameTimer.current >= frameDuration) {
        currentFrame.current = (currentFrame.current + 1) % frames.length;
        frameTimer.current -= frameDuration;
      }
    } else {
      currentFrame.current = 0;
    }

    const targetTexture = frames[currentFrame.current];
    targetTexture.repeat.x = mirror ? -1 : 1;

    if (materialRef.current.map !== targetTexture) {
      materialRef.current.map = targetTexture;
      materialRef.current.needsUpdate = true;
    }

    // --- Fix de proporción entre hojas de distinto aspecto ---
    const img = targetTexture.image as { width?: number; height?: number } | undefined;
    if (img?.width && img?.height) {
      const texAspect = img.width / img.height;
      spriteRef.current.scale.x = texAspect / SPRITE_BASE_ASPECT;
    }

    // -----------------------------------------------------------------
    // BILLBOARD: el sprite copia la rotación de la cámara para mirarla
    // siempre de frente, sea cual sea el ángulo desde el que se lo vea
    // (evita que se vea "de canto" al mover la cámara o al caminar de
    // lado). Solo rota el hijo `sprite`, nunca el `group` — así la
    // posición y la sombra de piso no se ven afectadas.
    // -----------------------------------------------------------------
    spriteRef.current.quaternion.copy(state.camera.quaternion);

    // --- Interacción (flanco de subida, como antes) ---
    const interactJustPressed = movement.interact && !wasInteractPressed.current;
    wasInteractPressed.current = movement.interact;

    if (interactJustPressed) {
      for (const target of interactables) {
        const dist = Math.hypot(currentPos.x - target.position[0], currentPos.z - target.position[1]);
        if (dist < target.radius) {
          target.onInteract();
          break;
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={initialPosition}>
      {/* Sombra de contacto: plana en el piso, gira con el mundo, NO con la
          cámara, para que siempre se vea como una mancha en el suelo. */}
      {showGroundShadow && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
          <circleGeometry args={[0.42, 24]} />
          <meshBasicMaterial
            map={groundShadowTexture}
            transparent
            opacity={0.9}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1}
          />
        </mesh>
      )}

      {/* Sprite del personaje: billboard, recibe luz del entorno */}
      <mesh ref={spriteRef} position={[0, SPRITE_HEIGHT / 2, 0]} castShadow={castShadow} receiveShadow>
        <planeGeometry args={[1.0, SPRITE_HEIGHT]} />
        <meshStandardMaterial
          ref={materialRef}
          transparent
          alphaTest={0.5}
          side={THREE.DoubleSide}
          // Superficie mate: sin esto, el specular de un material lit se ve
          // raro sobre pixel art (brillos donde no deberían), y además al
          // ser billboard la normal siempre mira a cámara, así que cualquier
          // specular quedaría pegado siempre al centro del sprite.
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  );
};