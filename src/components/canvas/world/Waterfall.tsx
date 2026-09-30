import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getWorldTerrainHeight, WATERFALL_POS } from '../../../world/terrain';
import { RoomSprite } from '../RoomProps';
import { A } from '../../../world/collision';

/* ============================================================
   RINCÓN DE LA CASCADA
   ============================================================
   Un paisaje nuevo, autocontenido (mismo truco que CaveZone: se
   ancla a la altura real del terreno en su punto y arma el resto
   como geometría fija encima, sin intentar seguir la pendiente
   real vértice a vértice). Cascada + poza con dos shaders chicos
   —caída de agua procedural y una poza circular simplificada, sin
   mapa de profundidad horneado, algo que sí necesita el lago
   grande pero sería exagerado aquí— más lirios reciclados del
   lago y rocas de borde.
============================================================ */

const CLIFF_DARK = '#241f1a';
const CLIFF = '#3a3226';
const CLIFF_MOSS = '#2f3a24';

const FALL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FALL_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float scroll = uTime * 1.7;

    // Franjas verticales que caen — varias frecuencias para que no
    // se vea como una textura repetida obvia.
    float streakA = sin(vUv.x * 46.0 + hash(floor(vUv * vec2(24.0, 3.0))) * 6.0 - scroll * 9.0);
    float streakB = sin(vUv.x * 23.0 - scroll * 6.0 + 1.7);
    float streak = pow(clamp(streakA * 0.6 + streakB * 0.4, 0.0, 1.0), 2.2);

    float grain = hash(floor(vUv * vec2(10.0, 22.0) + vec2(0.0, scroll * 0.6)));

    vec3 water = mix(vec3(0.42, 0.68, 0.78), vec3(0.97, 0.99, 1.0), streak * 0.65 + grain * 0.18);

    // Se desvanece en los bordes de arriba/abajo/lados en vez de
    // cortar en seco — así no se ve como una tarjeta rectangular.
    float edgeY = smoothstep(0.0, 0.10, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
    float edgeX = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);

    float alpha = (0.5 + streak * 0.4) * edgeY * edgeX;

    gl_FragColor = vec4(water, alpha);
  }
`;

function FallingWater({
  position,
  width,
  height,
}: {
  position: [number, number, number];
  width: number;
  height: number;
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: FALL_VERT,
        fragmentShader: FALL_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  );

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh position={position} renderOrder={4}>
      <planeGeometry args={[width, height]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

const POND_VERT = /* glsl */ `
  uniform float uTime;
  varying vec2 vLocal;
  varying float vWave;

  void main() {
    vLocal = position.xy;

    float w =
      sin(position.x * 1.4 + uTime * 1.2) * 0.5 +
      sin(position.y * 1.1 - uTime * 0.9) * 0.5;
    vWave = w;

    vec3 pos = position;
    pos.z += w * 0.025;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const POND_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uRadius;
  varying vec2 vLocal;
  varying float vWave;

  void main() {
    float dist = length(vLocal);
    if (dist > uRadius) discard;

    float shallow = 1.0 - clamp(dist / uRadius, 0.0, 1.0);
    vec3 color = mix(vec3(0.06, 0.16, 0.22), vec3(0.28, 0.62, 0.68), shallow);

    float foamBand = smoothstep(uRadius * 0.82, uRadius, dist);
    float foamNoise = 0.5 + 0.5 * sin(vLocal.x * 6.0 + vLocal.y * 5.0 + uTime * 2.2);
    color = mix(color, vec3(0.85, 0.93, 0.95), foamBand * (0.4 + foamNoise * 0.5) * 0.7);

    float crest = smoothstep(0.4, 1.0, vWave);
    color += vec3(0.7, 0.85, 0.9) * crest * 0.18;

    float alpha = mix(0.78, 0.95, shallow);
    gl_FragColor = vec4(color, alpha);
  }
`;

function PondSurface({ radius }: { radius: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uRadius: { value: radius },
        },
        vertexShader: POND_VERT,
        fragmentShader: POND_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [radius],
  );

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
      <planeGeometry args={[radius * 2.2, radius * 2.2, 24, 24]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function CliffRock({
  position,
  size,
  color = CLIFF,
  rotationY = 0,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  rotationY?: number;
}) {
  return (
    <mesh position={position} rotation={[0, rotationY, 0]} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

const POND_RADIUS = 2.6;

export const Waterfall: React.FC = React.memo(() => {
  const [wx, wz] = WATERFALL_POS;
  const groundY = getWorldTerrainHeight(wx, wz);

  const lilies = useMemo(() => {
    const crops = [A.lilyPad, A.lilyLotus, A.lilyPadB];
    return Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2 + i * 0.6;
      const r = POND_RADIUS * (0.25 + ((i * 37) % 10) / 14);
      return {
        crop: crops[i % crops.length],
        x: Math.cos(a) * r,
        z: 1.4 + Math.sin(a) * r,
      };
    });
  }, []);

  return (
    <group position={[wx, groundY, wz]}>
      {/* Pared del acantilado de la que cae el agua — bloques
          irregulares, mismo lenguaje que CaveZone/HouseExterior. */}
      <CliffRock position={[0, 3.2, -3.0]} size={[7.0, 6.4, 2.6]} color={CLIFF_DARK} />
      <CliffRock position={[-3.6, 4.0, -2.4]} size={[2.6, 8.0, 3.2]} rotationY={0.3} />
      <CliffRock position={[3.4, 4.4, -2.2]} size={[2.8, 8.8, 3.4]} rotationY={-0.25} />
      <CliffRock position={[-1.6, 6.6, -3.4]} size={[3.2, 2.0, 2.4]} color={CLIFF_MOSS} rotationY={0.15} />
      <CliffRock position={[1.8, 7.0, -3.2]} size={[2.6, 2.2, 2.2]} color={CLIFF_MOSS} rotationY={-0.2} />

      {/* Caída de agua — dos planos superpuestos a distinto ancho
          para dar algo de profundidad sin duplicar el shader. */}
      <FallingWater position={[0, 4.6, -1.55]} width={1.5} height={7.2} />
      <FallingWater position={[0.15, 4.4, -1.5]} width={0.9} height={6.6} />

      {/* Neblina en la base — un halo suave y plano, mismo truco que
          las sombras de contacto del resto del mundo. */}
      <mesh position={[0, 0.35, -0.9]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <circleGeometry args={[1.3, 20]} />
        <meshBasicMaterial color="#eaf6fb" transparent opacity={0.28} depthWrite={false} />
      </mesh>

      {/* Poza al pie de la cascada. */}
      <group position={[0, 0.05, 1.2]}>
        <PondSurface radius={POND_RADIUS} />
      </group>

      {/* Lirios reciclados del mismo atlas que usa el lago grande —
          consistencia visual entre las dos masas de agua del mundo. */}
      {lilies.map((l, i) => (
        <RoomSprite
          key={`wf-lily-${i}`}
          sheet="ambient"
          crop={l.crop}
          position={[l.x, 0.08, l.z]}
          height={0.42}
          billboard={false}
          rotation={[-Math.PI / 2, 0, 0]}
          castShadow={false}
        />
      ))}

      {/* Rocas de borde alrededor de la poza. */}
      <CliffRock position={[-2.2, 0.3, 0.6]} size={[1.0, 0.6, 0.9]} color={CLIFF} rotationY={0.4} />
      <CliffRock position={[2.3, 0.35, 0.9]} size={[1.1, 0.7, 1.0]} color={CLIFF} rotationY={-0.5} />
      <CliffRock position={[-1.6, 0.25, 3.1]} size={[0.8, 0.5, 0.8]} color={CLIFF_MOSS} rotationY={0.7} />
      <CliffRock position={[1.9, 0.28, 3.3]} size={[0.9, 0.56, 0.85]} color={CLIFF_MOSS} rotationY={-0.3} />
    </group>
  );
});

Waterfall.displayName = 'Waterfall';

export default Waterfall;
