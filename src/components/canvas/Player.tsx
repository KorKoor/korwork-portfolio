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
  /** Posición inicial del jugador en el mundo (por defecto [0, 0.7, 0]) */
  initialPosition?: [number, number, number];
  /** Velocidad en unidades/segundo (independiente del framerate) */
  speed?: number;
  /** Posición del escritorio interactuable en el plano XZ */
  deskPosition?: [number, number];
  /** Radio de interacción con el escritorio */
  interactRadius?: number;
}

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------
// Carpeta "Walk": mezcla de poses idle y ciclos de caminata de frente/espalda.
// Mapeo confirmado con el usuario a partir de los sprites reales:
//   tile000 -> idle de frente
//   tile001, tile003 -> idle de lado (derecho), 2 frames de "respiración"
//   tile002 -> idle de espalda
//   tile004, tile005 -> caminar de frente (2 frames)
//   tile007 -> caminar de espalda (por ahora 1 solo frame; falta el segundo)
//   tile006, tile008, tile009 -> sin usar (008 es una variante con mochila
//   que todavía no existe como asset; se puede sumar al array de
//   walkBackPaths el día que exista, sin tocar el resto de la lógica)
const WALK_DIR = '/assets/Player-Actions/Walk';
const idleFrontPaths = [`${WALK_DIR}/tile000.png`];
const idleSidePaths = [`${WALK_DIR}/tile001.png`, `${WALK_DIR}/tile003.png`];
const idleBackPaths = [`${WALK_DIR}/tile002.png`];
const walkFrontPaths = [`${WALK_DIR}/tile004.png`, `${WALK_DIR}/tile005.png`];
const walkBackPaths = [`${WALK_DIR}/tile007.png`];

// Carpeta "Walk2": ciclo de caminata lateral (derecha), ya completo y
// correcto tal como estaba: 12 frames, saltando tile006.
const walkSideFiles = [
  'tile000', 'tile001', 'tile002', 'tile003', 'tile004', 'tile005',
  'tile007', 'tile008', 'tile009', 'tile010', 'tile011', 'tile012',
];
const walkSidePaths = walkSideFiles.map((f) => `${WALK_DIR}/Walk2/${f}.png`);

// ---------------------------------------------------------------------------
// Constantes de comportamiento
// ---------------------------------------------------------------------------
const DEFAULT_SPEED = 2.4; // unidades por segundo
const DEFAULT_DESK_POSITION: [number, number] = [0, -3.5];
const DEFAULT_INTERACT_RADIUS = 1.2;

// Duración de fotograma por tipo de animación (cada set tiene su propio
// "ritmo": el idle respira lento, caminar es más rápido).
const FRAME_DURATION_IDLE = 0.5;
const FRAME_DURATION_WALK_FRONT_BACK = 0.16;
const FRAME_DURATION_WALK_SIDE = 0.07;

interface AnimState {
  frames: THREE.Texture[];
  frameDuration: number;
  mirror: boolean; // si hay que espejar horizontalmente (mirando a la izquierda)
}

export const Player: React.FC<PlayerProps> = ({
  onInteractDesk,
  initialPosition = [0, 0.7, 0],
  speed = DEFAULT_SPEED,
  deskPosition = DEFAULT_DESK_POSITION,
  interactRadius = DEFAULT_INTERACT_RADIUS,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const movement = useKeyboardControls();

  // Carga de texturas (cacheadas por drei mientras las rutas no cambien)
  const idleFrontTextures = useTexture(idleFrontPaths) as THREE.Texture[];
  const idleSideTextures = useTexture(idleSidePaths) as THREE.Texture[];
  const idleBackTextures = useTexture(idleBackPaths) as THREE.Texture[];
  const walkFrontTextures = useTexture(walkFrontPaths) as THREE.Texture[];
  const walkBackTextures = useTexture(walkBackPaths) as THREE.Texture[];
  const walkSideTextures = useTexture(walkSidePaths) as THREE.Texture[];

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

  // Configuración de filtro Pixel Art + fix de mirroring
  useEffect(() => {
    allTextures.forEach((tex) => {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.center.set(0.5, 0.5); // Pivote para el efecto espejo
      // repeat.x = -1 (usado para espejar el sprite al mirar a la
      // izquierda) solo se refleja correctamente si el wrap mode permite
      // repetición; el wrap por defecto (ClampToEdgeWrapping) puede
      // producir bordes estirados en vez de un espejo limpio.
      tex.wrapS = THREE.RepeatWrapping;
    });
  }, [allTextures]);

  const frameTimer = useRef(0);
  const currentFrame = useRef(0);
  const currentDirection = useRef<Direction>('down');
  const wasMoving = useRef(false);
  const wasInteractPressed = useRef(false); // para detectar flanco de subida

  const interactables = useMemo<Interactable[]>(
    () => [
      {
        id: 'desk',
        position: deskPosition,
        radius: interactRadius,
        onInteract: onInteractDesk,
      },
    ],
    [deskPosition, interactRadius, onInteractDesk]
  );

  // Elige el set de animación correcto según dirección + si se está moviendo.
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

  useFrame((_, rawDelta) => {
    if (!meshRef.current || !materialRef.current) return;

    // Clamp del delta: evita "saltos" de posición si la pestaña estuvo en
    // segundo plano o hubo un frame drop grande.
    const delta = Math.min(rawDelta, 1 / 30);
    const currentPos = meshRef.current.position;

    // Movimiento: vector normalizado (la diagonal no es más rápida que un
    // solo eje) y velocidad en unidades/segundo, independiente del framerate.
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

    // Dirección del sprite: prioriza el eje con mayor intención de
    // movimiento (útil si se presionan dos teclas a la vez).
    let newDirection = currentDirection.current;
    if (isMoving) {
      if (Math.abs(moveX) >= Math.abs(moveZ)) {
        newDirection = moveX > 0 ? 'right' : 'left';
      } else {
        newDirection = moveZ > 0 ? 'down' : 'up';
      }
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

    // Avance de animación (con `while` para no "pegarse" si hay un frame
    // drop grande). Si el set tiene un solo frame (p.ej. walkBack por ahora),
    // esto simplemente no hace nada.
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

    // Fix de proporción: "Walk" (120x164) y "Walk2" (225x400) tienen
    // aspectos distintos. Sin esto, el plano fijo (1.0 x 1.4) estira o
    // encoge el sprite cada vez que cambia de set de texturas. Ajustamos
    // solo el ancho de la malla según el aspecto real de la textura activa,
    // manteniendo la altura constante (los pies no "flotan").
    const img = targetTexture.image as { width?: number; height?: number } | undefined;
    if (img?.width && img?.height) {
      const BASE_ASPECT = 1.0 / 1.4; // ancho / alto de la geometría base
      const texAspect = img.width / img.height;
      meshRef.current.scale.x = texAspect / BASE_ASPECT;
    }

    // Interacción: solo en el flanco de subida de la tecla (una vez por
    // pulsación), no en cada frame mientras se mantiene presionada.
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
    <mesh ref={meshRef} position={initialPosition}>
      <planeGeometry args={[1.0, 1.4]} />
      <meshStandardMaterial
        ref={materialRef}
        transparent={true}
        alphaTest={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};