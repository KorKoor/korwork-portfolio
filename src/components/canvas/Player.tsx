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

const DEFAULT_SPEED = 2.55;
const DEFAULT_DESK_POSITION: [number, number] = [2.55, -4.48];
const DEFAULT_INTERACT_RADIUS = 1.35;
const SPRITE_HEIGHT = 1.4;
const SPRITE_BASE_ASPECT = 1.0 / SPRITE_HEIGHT;
const PLAYER_RADIUS = 0.30;
const FRAME_DURATION_IDLE = 0.5;
const FRAME_DURATION_WALK_FRONT_BACK = 0.16;
const FRAME_DURATION_WALK_SIDE = 0.07;

/**
 * The floor top surface sits at y≈0.18-0.19 in Room.tsx (planks + base
 * layers), not at y=0. The player group's own y-position is controlled by
 * whoever mounts <Player>, but the ground shadow below is defined here in
 * local space, so we keep it just barely above the sprite's own feet
 * (y=0) rather than assuming a world floor height.
 */
const SHADOW_Y_OFFSET = 0.015;

/*
 * Physical map for the enlarged 14.8 x 12.6 room in Room.tsx.
 * Decorative wall art remains walkable; actual furniture and the raised
 * zone platforms it sits on receive solid AABB colliders, sized to cover
 * the full platform footprint (not just the furniture mesh) so the player
 * never walks onto a raised edge it can't visually stand on. Padding is
 * added to the player's circular footprint, not to the furniture itself.
 */
const ROOM_COLLIDERS: RoomCollider[] = [
  // Architecture
  { id: 'back-wall', minX: -6.15, maxX: 6.15, minZ: -6.22, maxZ: -5.78 },
  { id: 'left-wall', minX: -6.22, maxX: -5.78, minZ: -5.78, maxZ: 5.78 },

  // Bed platform (raised warm zone), flush with the back wall
  { id: 'bed-platform', minX: -5.98, maxX: -1.13, minZ: -5.13, maxZ: -0.85, padding: 0.05 },

  // Bedside chest (sits on the bed platform, kept as its own tighter box)
  { id: 'bedside-chest', minX: -0.92, maxX: 0.22, minZ: -5.52, maxZ: -4.54, padding: 0.05 },

  // Desk platform (tallest / tech zone)
  { id: 'desk-platform', minX: -0.48, maxX: 5.58, minZ: -5.46, maxZ: -3.08, padding: 0.05 },

  // Lounge platform (sunken zone: sofa + coffee table)
  { id: 'lounge-platform', minX: -6.0, maxX: -0.93, minZ: 1.45, maxZ: 4.05, padding: 0.05 },

  // Hobby / dining platform
  { id: 'hobby-platform', minX: 1.15, maxX: 4.60, minZ: 1.15, maxZ: 4.55, padding: 0.05 },

  // Storage platform (moved/shrunk to avoid overlapping the hobby platform)
  { id: 'storage-platform', minX: 4.78, maxX: 6.33, minZ: 0.475, maxZ: 2.03, padding: 0.05 },

  // Parked personal items beside the sofa
  { id: 'skateboard', minX: -5.72, maxX: -4.92, minZ: 2.00, maxZ: 3.15, padding: 0.04 },
  { id: 'backpack', minX: -5.35, maxX: -4.30, minZ: 0.92, maxZ: 1.90, padding: 0.04 },
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
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0.55)');
    gradient.addColorStop(0.55, 'rgba(0,0,0,0.32)');
    gradient.addColorStop(0.85, 'rgba(0,0,0,0.10)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }, []);
}

function circleHitsAABB(x: number, z: number, collider: RoomCollider): boolean {
  const padding = collider.padding ?? 0;
  const minX = collider.minX - padding;
  const maxX = collider.maxX + padding;
  const minZ = collider.minZ - padding;
  const maxZ = collider.maxZ + padding;

  const closestX = THREE.MathUtils.clamp(x, minX, maxX);
  const closestZ = THREE.MathUtils.clamp(z, minZ, maxZ);
  const dx = x - closestX;
  const dz = z - closestZ;

  return dx * dx + dz * dz < PLAYER_RADIUS * PLAYER_RADIUS;
}

function canOccupy(x: number, z: number): boolean {
  const insideBounds =
    x >= -5.48 + PLAYER_RADIUS &&
    x <= 6.48 - PLAYER_RADIUS &&
    z >= -5.48 + PLAYER_RADIUS &&
    z <= 5.48 - PLAYER_RADIUS;

  if (!insideBounds) return false;
  return !ROOM_COLLIDERS.some((collider) => circleHitsAABB(x, z, collider));
}

function moveWithCollisions(position: THREE.Vector3, dx: number, dz: number) {
  /* Small substeps prevent fast diagonal movement from tunnelling through
     furniture and make corners slide naturally instead of getting stuck. */
  const distance = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(distance / 0.08));
  const stepX = dx / steps;
  const stepZ = dz / steps;

  for (let i = 0; i < steps; i += 1) {
    const nextX = position.x + stepX;
    const nextZ = position.z + stepZ;

    if (canOccupy(nextX, nextZ)) {
      position.x = nextX;
      position.z = nextZ;
      continue;
    }

    // Slide along one axis when the diagonal corner is blocked.
    if (canOccupy(nextX, position.z)) position.x = nextX;
    if (canOccupy(position.x, nextZ)) position.z = nextZ;
  }
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
    [
      idleFrontTextures,
      idleSideTextures,
      idleBackTextures,
      walkFrontTextures,
      walkBackTextures,
      walkSideTextures,
    ],
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
      {
        id: 'desk',
        position: deskPosition,
        radius: interactRadius,
        onInteract: onInteractDesk,
      },
    ],
    [deskPosition, interactRadius, onInteractDesk],
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
      moveWithCollisions(currentPos, stepX, stepZ);
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

    spriteRef.current.quaternion.copy(state.camera.quaternion);

    const interactJustPressed = movement.interact && !wasInteractPressed.current;
    wasInteractPressed.current = movement.interact;

    if (interactJustPressed) {
      for (const target of interactables) {
        const dist = Math.hypot(
          currentPos.x - target.position[0],
          currentPos.z - target.position[1],
        );
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
        <mesh
          position={[0, SHADOW_Y_OFFSET, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={1}
        >
          <circleGeometry args={[0.40, 24]} />
          <meshBasicMaterial
            map={groundShadowTexture}
            transparent
            opacity={0.85}
            depthWrite={false}
            depthTest={true}
            polygonOffset
            polygonOffsetFactor={-4}
            polygonOffsetUnits={-4}
          />
        </mesh>
      )}

      <mesh
        ref={spriteRef}
        position={[0, SPRITE_HEIGHT / 2, 0]}
        castShadow={castShadow}
        receiveShadow
      >
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