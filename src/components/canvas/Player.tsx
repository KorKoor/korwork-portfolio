import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';

type Direction = 'down' | 'up' | 'left' | 'right';

interface Interactable {
  id: string;
  position: [number, number];
  radius: number;
  onInteract: () => void;
}

interface RoomCollider {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  padding?: number;
}

interface PlayerProps {
  onInteractDesk: () => void;
  initialPosition?: [number, number, number];
  speed?: number;
  deskPosition?: [number, number];
  interactRadius?: number;
  showGroundShadow?: boolean;
  castShadow?: boolean;
}

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

const DEFAULT_SPEED = 2.4;
const DEFAULT_DESK_POSITION: [number, number] = [0.35, -3.45];
const DEFAULT_INTERACT_RADIUS = 1.2;
const SPRITE_HEIGHT = 1.4;
const SPRITE_BASE_ASPECT = 1.0 / SPRITE_HEIGHT;
const PLAYER_RADIUS = 0.28;
const FRAME_DURATION_IDLE = 0.5;
const FRAME_DURATION_WALK_FRONT_BACK = 0.16;
const FRAME_DURATION_WALK_SIDE = 0.07;

/*
 * Collision layer for the first pass.
 *
 * These coordinates intentionally match the large physical pieces in Room.tsx.
 * Decorative sprites are not blockers yet; they can be added here progressively
 * without changing the movement system.
 */
const ROOM_COLLIDERS: RoomCollider[] = [
  // Back wall / left wall
  { id: 'back-wall', minX: -4.65, maxX: 4.65, minZ: -4.72, maxZ: -4.45 },
  { id: 'left-wall', minX: -4.72, maxX: -4.45, minZ: -4.45, maxZ: 4.65 },

  // Desk and its deep tabletop/body
  { id: 'desk', minX: -2.15, maxX: 2.90, minZ: -4.28, maxZ: -3.00, padding: 0.08 },

  // Bed frame + mattress + headboard
  { id: 'bed', minX: -4.32, maxX: -0.58, minZ: -3.28, maxZ: 0.12, padding: 0.08 },
];

interface AnimState {
  frames: THREE.Texture[];
  frameDuration: number;
  mirror: boolean;
}

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

function pointHitsCollider(x: number, z: number, collider: RoomCollider): boolean {
  const padding = PLAYER_RADIUS + (collider.padding ?? 0);
  return (
    x >= collider.minX - padding &&
    x <= collider.maxX + padding &&
    z >= collider.minZ - padding &&
    z <= collider.maxZ + padding
  );
}

function canOccupy(x: number, z: number): boolean {
  // Hard room bounds. The front/right sides stay open visually, but the player
  // should never walk outside the playable floor.
  const insideBounds =
    x >= -4.42 + PLAYER_RADIUS &&
    x <= 4.42 - PLAYER_RADIUS &&
    z >= -4.42 + PLAYER_RADIUS &&
    z <= 4.42 - PLAYER_RADIUS;

  if (!insideBounds) return false;

  return !ROOM_COLLIDERS.some((collider) => pointHitsCollider(x, z, collider));
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

    let moveX = 0;
    let moveZ = 0;
    if (movement.moveBackward) moveZ += 1;
    if (movement.moveForward) moveZ -= 1;
    if (movement.moveLeft) moveX -= 1;
    if (movement.moveRight) moveX += 1;

    const isMoving = moveX !== 0 || moveZ !== 0;

    if (isMoving) {
      const length = Math.hypot(moveX, moveZ);
      const stepX = (moveX / length) * speed * delta;
      const stepZ = (moveZ / length) * speed * delta;

      const nextX = currentPos.x + stepX;
      const nextZ = currentPos.z + stepZ;

      // Resolve each axis independently so the player slides along furniture
      // instead of getting stuck on a diagonal corner.
      if (canOccupy(nextX, nextZ)) {
        currentPos.x = nextX;
        currentPos.z = nextZ;
      } else if (canOccupy(nextX, currentPos.z)) {
        currentPos.x = nextX;
      } else if (canOccupy(currentPos.x, nextZ)) {
        currentPos.z = nextZ;
      }
    }

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

    const img = targetTexture.image as { width?: number; height?: number } | undefined;
    if (img?.width && img?.height) {
      const texAspect = img.width / img.height;
      spriteRef.current.scale.x = texAspect / SPRITE_BASE_ASPECT;
    }

    // Billboard solo para el personaje; la posición física sigue siendo X/Z.
    spriteRef.current.quaternion.copy(state.camera.quaternion);

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

      <mesh ref={spriteRef} position={[0, SPRITE_HEIGHT / 2, 0]} castShadow={castShadow} receiveShadow>
        <planeGeometry args={[1.0, SPRITE_HEIGHT]} />
        <meshStandardMaterial
          ref={materialRef}
          transparent
          alphaTest={0.5}
          side={THREE.DoubleSide}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  );
};