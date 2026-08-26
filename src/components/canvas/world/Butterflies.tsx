import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getWorldTerrainHeight } from '../../../world/terrain';
import { getNightFactor, useAtmosphereStore } from '../../../world/atmosphere';

/* ============================================================
   MARIPOSAS
   ============================================================
   No usan un recorte del atlas de animales: se dibujan
   proceduralmente en un canvas (2 alas + cuerpo, 2 frames de aleteo,
   3 colores) con el mismo método que ya usan los halos y las sombras
   de contacto en este proyecto — evita depender de coordenadas de
   sprite sin verificar visualmente.

   El vuelo también es más simple que la IA completa de Wildlife.tsx:
   una curva de Lissajous alrededor de un punto "casa" (los jardines
   y claros del bosque), sin necesidad de estados ni colisión — es
   fauna ambiental, no un personaje con el que se interactúa.
   Desaparecen de noche (son diurnas) y con lluvia/tormenta.
============================================================ */

interface ButterflyDef {
  id: string;
  home: [number, number];
  radius: number;
  color: string;
  speed: number;
}

const BUTTERFLIES: ButterflyDef[] = [
  { id: 'bf-1', home: [16.5, -7.0], radius: 2.4, color: '#ff9f43', speed: 1.0 },
  { id: 'bf-2', home: [15.0, -5.0], radius: 1.8, color: '#5aa9ff', speed: 1.3 },
  { id: 'bf-3', home: [18.5, -8.5], radius: 2.0, color: '#ffe066', speed: 0.9 },
  { id: 'bf-4', home: [13.5, -4.2], radius: 1.6, color: '#ff9f43', speed: 1.2 },
  { id: 'bf-5', home: [10.5, 6.5], radius: 2.6, color: '#5aa9ff', speed: 0.85 },
  { id: 'bf-6', home: [8.0, 8.5], radius: 1.9, color: '#ffe066', speed: 1.1 },
  { id: 'bf-7', home: [-15, -15], radius: 2.2, color: '#ff9f43', speed: 1.0 },
  { id: 'bf-8', home: [-18, -12.5], radius: 1.7, color: '#5aa9ff', speed: 1.15 },
  { id: 'bf-9', home: [0, 6], radius: 2.0, color: '#ffe066', speed: 0.95 },
  { id: 'bf-10', home: [-6, 8], radius: 1.8, color: '#ff9f43', speed: 1.05 },
  { id: 'bf-11', home: [20, -6], radius: 1.6, color: '#5aa9ff', speed: 1.25 },
  { id: 'bf-12', home: [3, -14], radius: 2.1, color: '#ffe066', speed: 0.9 },
];

/** Textura de 2 frames (alas abiertas/cerradas) para un color dado, dibujada en canvas. */
function drawButterflyFrame(color: string, wingsOpen: boolean): HTMLCanvasElement {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const spread = wingsOpen ? 1 : 0.35;

  ctx.save();
  ctx.translate(cx, cy);

  // Un par de alas por lado (una grande arriba, una chica abajo),
  // espejadas — suficiente para leerse como mariposa a esta escala.
  const wing = (side: 1 | -1) => {
    ctx.save();
    ctx.scale(side * spread, 1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(6, -4, 7, 6, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(5, 5, 5, 4.5, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Punto de acento en el ala superior.
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(6, -4, 2.2, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  wing(1);
  wing(-1);

  // Cuerpo.
  ctx.fillStyle = '#2a2018';
  ctx.beginPath();
  ctx.ellipse(0, 0, 1.4, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  return canvas;
}

function useButterflyTextures(): { texture: THREE.Texture }[][] {
  return useMemo(() => {
    const colors = Array.from(new Set(BUTTERFLIES.map((b) => b.color)));

    return colors.map((color) =>
      [true, false].map((open) => {
        const canvas = drawButterflyFrame(color, open);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;
        return { texture: tex };
      }),
    );
  }, []);
}

const _camDir = new THREE.Vector3();

const Butterfly: React.FC<{ def: ButterflyDef; colorIndex: number; frames: { texture: THREE.Texture }[][] }> = React.memo(
  ({ def, colorIndex, frames }) => {
    const groupRef = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.MeshBasicMaterial>(null);
    const flapTimer = useRef(0);
    const flapFrame = useRef(0);

    const seed = useMemo(() => {
      let h = 0;
      for (let i = 0; i < def.id.length; i += 1) h = (h * 31 + def.id.charCodeAt(i)) % 1000;
      return h / 97;
    }, [def.id]);

    useFrame((state, rawDelta) => {
      if (!groupRef.current || !meshRef.current || !materialRef.current) return;
      const delta = Math.min(rawDelta, 1 / 30);
      const t = state.clock.elapsedTime * def.speed + seed;

      // Curva de Lissajous: dos senos con frecuencias distintas —
      // se ve como revoloteo errático, no como una órbita perfecta.
      const x = def.home[0] + Math.sin(t * 1.3) * def.radius;
      const z = def.home[1] + Math.sin(t * 0.85 + 1.7) * def.radius * 0.8;
      const bob = Math.sin(t * 4.2) * 0.12;

      const groundY = getWorldTerrainHeight(x, z);
      groupRef.current.position.set(x, groundY + 0.55 + bob, z);

      // Encara la dirección de vuelo (derivada de la velocidad de la
      // curva), espejado simple en X.
      const dx = Math.cos(t * 1.3) * 1.3;
      if (Math.abs(dx) > 0.02) {
        meshRef.current.scale.x = Math.sign(dx) * 0.42;
      }

      flapTimer.current += delta;
      if (flapTimer.current > 0.09) {
        flapTimer.current = 0;
        flapFrame.current = 1 - flapFrame.current;
        materialRef.current.map = frames[colorIndex][flapFrame.current].texture;
        materialRef.current.needsUpdate = true;
      }

      const atmo = useAtmosphereStore.getState();
      const night = getNightFactor(atmo.time);
      const rainy = atmo.weather === 'rain' || atmo.weather === 'storm';
      const visible = night < 0.6 && !(rainy && atmo.weatherBlend > 0.4);
      groupRef.current.visible = visible;

      state.camera.getWorldDirection(_camDir);
      meshRef.current.rotation.y = Math.atan2(-_camDir.x, -_camDir.z);
    });

    return (
      <group ref={groupRef}>
        <mesh ref={meshRef} scale={[0.42, 0.42, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={materialRef}
            map={frames[colorIndex][0].texture}
            transparent
            alphaTest={0.3}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>
    );
  },
);

Butterfly.displayName = 'Butterfly';

export const Butterflies: React.FC = React.memo(() => {
  const frames = useButterflyTextures();

  const colorIndexById = useMemo(() => {
    const colors = Array.from(new Set(BUTTERFLIES.map((b) => b.color)));
    const map = new Map<string, number>();
    colors.forEach((c, i) => map.set(c, i));
    return map;
  }, []);

  return (
    <group>
      {BUTTERFLIES.map((def) => (
        <Butterfly
          key={def.id}
          def={def}
          colorIndex={colorIndexById.get(def.color) ?? 0}
          frames={frames}
        />
      ))}
    </group>
  );
});

Butterflies.displayName = 'Butterflies';

export default Butterflies;
