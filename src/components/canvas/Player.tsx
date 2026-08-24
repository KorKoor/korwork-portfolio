import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';

type Direction = 'down' | 'up' | 'left' | 'right';

interface Interactable { id: string; position: [number, number]; radius: number; onInteract: () => void; }
interface RoomCollider { id: string; minX: number; maxX: number; minZ: number; maxZ: number; padding?: number; }
interface HeightZone { id: string; minX: number; maxX: number; minZ: number; maxZ: number; y: number; }
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
const walkSideFiles = ['tile000','tile001','tile002','tile003','tile004','tile005','tile007','tile008','tile009','tile010','tile011','tile012'];
const walkSidePaths = walkSideFiles.map((f) => `${WALK_DIR}/Walk2/${f}.png`);

const DEFAULT_SPEED = 2.55;
const DEFAULT_DESK_POSITION: [number, number] = [2.75, -4.82];
const DEFAULT_INTERACT_RADIUS = 1.35;
const SPRITE_HEIGHT = 1.4;
const SPRITE_BASE_ASPECT = 1.0 / SPRITE_HEIGHT;
const PLAYER_RADIUS = 0.30;
const FRAME_DURATION_IDLE = 0.5;
const FRAME_DURATION_WALK_FRONT_BACK = 0.16;
const FRAME_DURATION_WALK_SIDE = 0.10;
const SHADOW_Y_OFFSET = 0.015;
const INTERACTION_PULSE_DURATION = 0.72;

const FLOOR_TOP = 0.1825;
const UPPER_FLOOR_TOP = FLOOR_TOP + 0.44;
const HEIGHT_LERP_SPEED = 7;

const HEIGHT_ZONES: HeightZone[] = [
  { id: 'upper-bedroom-office', minX: -6.65, maxX: 6.40, minZ: -6.00, maxZ: -1.55, y: UPPER_FLOOR_TOP },
  { id: 'lounge', minX: -6.65, maxX: -1.15, minZ: -1.20, maxZ: 6.25, y: FLOOR_TOP },
  { id: 'dining', minX: -0.95, maxX: 6.55, minZ: -1.20, maxZ: 6.25, y: FLOOR_TOP },
];

function getTargetHeight(x: number, z: number): number {
  const stairStart = -1.55;
  const stairEnd = 1.20;
  if (x > -0.80 && x < 1.70 && z >= stairStart && z <= stairEnd) {
    const t = THREE.MathUtils.clamp((z - stairStart) / (stairEnd - stairStart), 0, 1);
    return THREE.MathUtils.lerp(UPPER_FLOOR_TOP, FLOOR_TOP, t);
  }
  for (const zone of HEIGHT_ZONES) {
    if (x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ) return zone.y;
  }
  return FLOOR_TOP;
}

const ROOM_COLLIDERS: RoomCollider[] = [
  { id: 'back-wall', minX: -7.25, maxX: 7.25, minZ: -7.18, maxZ: -6.70 },
  { id: 'left-wall', minX: -7.18, maxX: -6.70, minZ: -6.70, maxZ: 6.70 },
  { id: 'front-low-wall', minX: -7.20, maxX: 7.20, minZ: 6.72, maxZ: 7.18 },
  { id: 'bed', minX: -5.85, maxX: -1.25, minZ: -5.72, maxZ: -2.20, padding: 0.10 },
  { id: 'bedside-table', minX: -1.30, maxX: -0.15, minZ: -6.35, maxZ: -5.40, padding: 0.06 },
  { id: 'desk', minX: 0.05, maxX: 5.45, minZ: -5.55, maxZ: -4.05, padding: 0.10 },
  { id: 'desk-chair', minX: 1.95, maxX: 3.55, minZ: -3.90, maxZ: -2.55, padding: 0.06 },
  { id: 'sofa', minX: -6.82, maxX: -2.25, minZ: 3.88, maxZ: 5.45, padding: 0.10 },
  { id: 'coffee-table', minX: -5.85, maxX: -3.05, minZ: 2.12, maxZ: 3.62, padding: 0.08 },
  { id: 'dining-table', minX: 1.95, maxX: 5.35, minZ: 2.40, maxZ: 4.56, padding: 0.10 },
  { id: 'dining-chair-north', minX: 3.20, maxX: 4.10, minZ: 4.45, maxZ: 5.60, padding: 0.06 },
  { id: 'dining-chair-south', minX: 3.20, maxX: 4.10, minZ: 1.45, maxZ: 2.55, padding: 0.06 },
  { id: 'dining-chair-west', minX: 0.90, maxX: 2.10, minZ: 3.05, maxZ: 3.95, padding: 0.06 },
  { id: 'dining-chair-east', minX: 5.20, maxX: 6.30, minZ: 3.05, maxZ: 3.95, padding: 0.06 },
  { id: 'front-shelf', minX: 2.70, maxX: 6.10, minZ: 6.30, maxZ: 7.00, padding: 0.06 },
  { id: 'skateboard', minX: -6.62, maxX: -5.80, minZ: -0.20, maxZ: 0.65, padding: 0.04 },
  { id: 'backpack', minX: -5.95, maxX: -5.20, minZ: 0.20, maxZ: 1.05, padding: 0.04 },
];

interface AnimState { frames: THREE.Texture[]; frameDuration: number; mirror: boolean; }

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
  const insideBounds = x >= -6.52 + PLAYER_RADIUS && x <= 6.52 - PLAYER_RADIUS && z >= -6.52 + PLAYER_RADIUS && z <= 6.52 - PLAYER_RADIUS;
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
  const pulseRef = useRef<THREE.Group>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);
  const pulseLightRef = useRef<THREE.PointLight>(null);
  const pulseTimer = useRef(0);
  const movement = useKeyboardControls();

  const idleFrontTextures = useTexture(idleFrontPaths) as THREE.Texture[];
  const idleSideTextures = useTexture(idleSidePaths) as THREE.Texture[];
  const idleBackTextures = useTexture(idleBackPaths) as THREE.Texture[];
  const walkFrontTextures = useTexture(walkFrontPaths) as THREE.Texture[];
  const walkBackTextures = useTexture(walkBackPaths) as THREE.Texture[];
  const walkSideTextures = useTexture(walkSidePaths) as THREE.Texture[];
  const groundShadowTexture = useGroundShadowTexture();

  const allTextures = useMemo(
    () => [...idleFrontTextures, ...idleSideTextures, ...idleBackTextures, ...walkFrontTextures, ...walkBackTextures, ...walkSideTextures],
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
        return isMoving ? { frames: walkFrontTextures, frameDuration: FRAME_DURATION_WALK_FRONT_BACK, mirror: false } : { frames: idleFrontTextures, frameDuration: FRAME_DURATION_IDLE, mirror: false };
      case 'up':
        return isMoving ? { frames: walkBackTextures, frameDuration: FRAME_DURATION_WALK_FRONT_BACK, mirror: false } : { frames: idleBackTextures, frameDuration: FRAME_DURATION_IDLE, mirror: false };
      case 'left':
      case 'right':
        return isMoving ? { frames: walkSideTextures, frameDuration: FRAME_DURATION_WALK_SIDE, mirror: direction === 'left' } : { frames: idleSideTextures, frameDuration: FRAME_DURATION_IDLE, mirror: direction === 'left' };
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
      moveWithCollisions(currentPos, (moveX / length) * speed * delta, (moveZ / length) * speed * delta);
    }

    const targetY = getTargetHeight(currentPos.x, currentPos.z);
    currentPos.y = THREE.MathUtils.damp(currentPos.y, targetY, HEIGHT_LERP_SPEED, delta);

    let newDirection = currentDirection.current;
    if (isMoving) newDirection = Math.abs(moveX) >= Math.abs(moveZ) ? (moveX > 0 ? 'right' : 'left') : (moveZ > 0 ? 'down' : 'up');
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
    } else currentFrame.current = 0;

    const targetTexture = frames[currentFrame.current];
    targetTexture.repeat.x = mirror ? -1 : 1;
    if (materialRef.current.map !== targetTexture) {
      materialRef.current.map = targetTexture;
      materialRef.current.needsUpdate = true;
    }

    const img = targetTexture.image as { width?: number; height?: number } | undefined;
    if (img?.width && img?.height) spriteRef.current.scale.x = (img.width / img.height) / SPRITE_BASE_ASPECT;
    spriteRef.current.quaternion.copy(state.camera.quaternion);

    const interactJustPressed = movement.interact && !wasInteractPressed.current;
    wasInteractPressed.current = movement.interact;
    if (interactJustPressed) {
      for (const target of interactables) {
        if (Math.hypot(currentPos.x - target.position[0], currentPos.z - target.position[1]) < target.radius) {
          target.onInteract();
          pulseTimer.current = INTERACTION_PULSE_DURATION;
          break;
        }
      }
    }

    if (pulseRef.current) {
      if (pulseTimer.current > 0) {
        pulseTimer.current = Math.max(0, pulseTimer.current - delta);
        const progress = 1 - pulseTimer.current / INTERACTION_PULSE_DURATION;
        const eased = 1 - Math.pow(1 - progress, 3);
        pulseRef.current.visible = true;
        pulseRef.current.scale.setScalar(0.45 + eased * 0.95);
        pulseRef.current.position.set(
          deskPosition[0] - currentPos.x,
          Math.max(0.04, getTargetHeight(deskPosition[0], deskPosition[1]) - currentPos.y + 0.05),
          deskPosition[1] - currentPos.z,
        );
        const opacity = 1 - progress;
        const ringMaterial = pulseRingRef.current?.material;
        if (ringMaterial instanceof THREE.MeshBasicMaterial) ringMaterial.opacity = opacity;
        if (pulseLightRef.current) pulseLightRef.current.intensity = 2.5 * opacity;
      } else {
        pulseRef.current.visible = false;
      }
    }
  });

  return (
    <group ref={groupRef} position={initialPosition}>
      {showGroundShadow && (
        <mesh position={[0, SHADOW_Y_OFFSET, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
          <circleGeometry args={[0.40, 24]} />
          <meshBasicMaterial map={groundShadowTexture} transparent opacity={0.85} depthWrite={false} depthTest polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
        </mesh>
      )}
      <mesh ref={spriteRef} position={[0, SPRITE_HEIGHT / 2, 0]} castShadow={castShadow} receiveShadow>
        <planeGeometry args={[1.0, SPRITE_HEIGHT]} />
        <meshStandardMaterial ref={materialRef} transparent alphaTest={0.5} side={THREE.DoubleSide} roughness={1} metalness={0} />
      </mesh>
      <group ref={pulseRef} visible={false}>
        <mesh ref={pulseRingRef} rotation={[-Math.PI / 2, 0, 0]} renderOrder={20}>
          <ringGeometry args={[0.22, 0.30, 24]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
        <pointLight ref={pulseLightRef} color="#38bdf8" intensity={0} distance={2.4} decay={2} />
      </group>
    </group>
  );
};
