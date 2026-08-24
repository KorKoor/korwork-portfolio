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

interface HeightZone {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  y: number;
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
const SHADOW_Y_OFFSET = 0.015;

/**
 * Must match the constants in Room.tsx (FLOOR_TOP / TIER_LOW / TIER_MED /
 * TIER_HIGH). Kept duplicated here since Room and Player are separate
 * modules — if you rework the room's heights, update both.
 */
const FLOOR_TOP = 0.1825;
const TIER_LOW = 0.16;
const TIER_MED = 0.24;
const TIER_HIGH = 0.34;
const HEIGHT_LERP_SPEED = 6; // higher = snappier climb/descend

/**
 * Zones where the player's Y should rise or fall to match the platform
 * they're standing on. Bounds are intentionally the FULL platform + stair
 * footprint (not just the furniture), so the climb starts as soon as the
 * player sets foot on the stairs, not only once fully on top.
 * Order matters: first match wins, so keep these non-overlapping.
 */
const HEIGHT_ZONES: HeightZone[] = [
  { id: 'bed-zone', minX: -6.05, maxX: -1.05, minZ: -5.10, maxZ: -0.40, y: FLOOR_TOP + TIER_LOW },
  { id: 'desk-zone', minX: -0.50, maxX: 5.60, minZ: -5.45, maxZ: -2.27, y: FLOOR_TOP + TIER_HIGH },
  { id: 'lounge-zone', minX: -5.90, maxX: -0.50, minZ: 0.60, maxZ: 4.80, y: FLOOR_TOP + TIER_LOW },
  { id: 'dining-zone', minX: -0.20, maxX: 5.50, minZ: 0.90, maxZ: 4.90, y: FLOOR_TOP + TIER_MED },
];

function getTargetHeight(x: number, z: number): number {
  for (const zone of HEIGHT_ZONES) {
    if (x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ) {
      return zone.y;
    }
  }
  return FLOOR_TOP;
}

/*
 * Physical map for the 14.8 x 12.6 room in Room.tsx. Unlike before, these
 * colliders now cover ONLY the actual furniture footprint, not the whole
 * platform — the platform itself is walkable (the player climbs onto it
 * via the height-zone system above), only the solid objects on top of it
 * block movement.
 */
const ROOM_COLLIDERS: RoomCollider[] = [
  { id: 'back-wall', minX: -6.15, maxX: 6.15, minZ: -6.22, maxZ: -5.78 },
  { id: 'left-wall', minX: -6.22, maxX: -5.78, minZ: -5.78, maxZ: 5.78 },

  { id: 'bed', minX: -5.68, maxX: -1.43, minZ: -5.03, maxZ: -1.48, padding: 0.08 },
  { id: 'bedside-chest', minX: -0.92, maxX: 0.22, minZ: -5.52, maxZ: -4.54, padding: 0.05 },
  { id: 'desk', minX: -0.20, maxX: 5.30, minZ: -5.15, maxZ: -3.75, padding: 0.08 },

  { id: 'sofa', minX: -6.06, maxX: -2.34, minZ: 1.36, maxZ: 2.85, padding: 0.06 },
  { id: 'coffee-table', minX: -3.80, maxX: -1.60, minZ: 2.86, maxZ: 4.34, padding: 0.06 },

  { id: 'dining-table', minX: 1.375, maxX: 4.425, minZ: 1.69, maxZ: 3.51, padding: 0.06 },
  { id: 'chair', minX: 2.38, maxX: 3.42, minZ: 3.45, maxZ: 4.55, padding: 0.06 },
  { id: 'storage-shelf', minX: 4.22, maxX: 5.58, minZ: 1.33, maxZ: 2.27, padding: 0.06 },

  { id: 'skateboard', minX: -5.85, maxX: -5.45, minZ: -2.75, maxZ: -1.95, padding: 0.04 },
  { id: 'backpack', minX: -5.65, maxX: -5.05, minZ: -2.05, maxZ: -1.25, padding: 0.04 },
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

    if (canOccupy(nextX, position.z)) position.x = nextX;
    if (canOccupy(position.x, nextZ)) position.z = nextZ;
  }
}

export const Player: React.FC<PlayerProps> = ({
  onInteractDesk,
  initialPosition = [0, FLOOR_TOP, 0],
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
    [idleFrontTextures, idleSideTextures, idleBackTextures, walkFrontTextures, walkBackTextures, walkSideTextures],
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
    () => [{ id: 'desk', position: deskPosition, radius: interactRadius, onInteract: onInteractDesk }],
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

    // Climb/descend: smoothly move toward the height of the zone the
    // player's feet are currently over.
    const targetY = getTargetHeight(currentPos.x, currentPos.z);
    currentPos.y = THREE.MathUtils.damp(currentPos.y, targetY, HEIGHT_LERP_SPEED, delta);

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
        <mesh position={[0, SHADOW_Y_OFFSET, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
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