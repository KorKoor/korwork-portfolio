import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  useAtmosphereStore,
  evaluateSky,
} from '../../../world/atmosphere';

/* ============================================================
   NUBES
   ============================================================
   Puñados de "borrones" billboard (mismo lenguaje visual que los
   halos de NightVFX) agrupados en racimos para que cada nube tenga
   silueta irregular en vez de leerse como un círculo perfecto.
   Todas viven en una sola InstancedMesh — un draw call para el
   cielo entero.

   Responden al clima real (más densas y grises bajo tormenta/lluvia,
   dispersas y blancas en despejado) y se desplazan con el viento de
   atmosphere.ts, envolviendo alrededor del jugador para que nunca se
   "acaben" — el mismo truco de caja-que-sigue-a-cámara que usa
   WeatherFX para la lluvia.
============================================================ */

const CLUSTERS = 26;

const PUFFS_PER_CLUSTER = 4;

const TOTAL_PUFFS = CLUSTERS * PUFFS_PER_CLUSTER;

const FIELD_SIZE = 130;

const CLOUD_HEIGHT = 46;

const VERT = /* glsl */ `
  attribute vec3 aCenter;
  attribute float aSize;
  attribute float aSeed;
  attribute float aOpacity;

  uniform float uTime;
  uniform vec2 uWind;
  uniform float uWindStrength;
  uniform float uFieldSize;
  uniform vec3 uCamPos;

  varying float vOpacity;
  varying vec2 vUv2;

  void main() {
    // Deriva con el viento + una respiración lentísima de tamaño.
    float drift = uTime * (0.35 + uWindStrength * 0.5);
    vec3 center = aCenter;
    center.x += uWind.x * drift * 3.0;
    center.z += uWind.y * drift * 3.0;

    // Envolver alrededor de la cámara en una rejilla de uFieldSize,
    // así el campo de nubes es "infinito" sin recalcular posiciones.
    vec2 rel = center.xz - uCamPos.xz;
    rel = mod(rel + uFieldSize * 0.5, uFieldSize) - uFieldSize * 0.5;
    center.xz = uCamPos.xz + rel;

    vec3 camRight = normalize(vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]));
    vec3 world = center + camRight * (position.x * aSize) + vec3(0.0, position.y * aSize, 0.0);

    vec4 mv = viewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * mv;

    vOpacity = aOpacity;
    vUv2 = uv;
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColorLit;
  uniform vec3 uColorShadow;
  uniform float uGlobalOpacity;

  varying float vOpacity;
  varying vec2 vUv2;

  void main() {
    vec2 c = vUv2 - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    float soft = 1.0 - smoothstep(0.18, 0.5, d);
    // La base del borrón (uv.y bajo) se sombrea, el tope se ilumina —
    // le da a la nube algo de volumen sin geometría real.
    vec3 color = mix(uColorShadow, uColorLit, smoothstep(0.15, 0.75, vUv2.y));

    float a = soft * vOpacity * uGlobalOpacity;
    if (a < 0.01) discard;

    gl_FragColor = vec4(color, a);
  }
`;

export const Clouds: React.FC = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.InstancedBufferGeometry();

    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0],
        3,
      ),
    );
    geo.setAttribute(
      'uv',
      new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2),
    );
    geo.setIndex([0, 1, 2, 0, 2, 3]);

    const center = new Float32Array(TOTAL_PUFFS * 3);
    const size = new Float32Array(TOTAL_PUFFS);
    const seed = new Float32Array(TOTAL_PUFFS);
    const opacity = new Float32Array(TOTAL_PUFFS);

    let i = 0;
    for (let c = 0; c < CLUSTERS; c += 1) {
      const cx = (Math.sin(c * 12.9898) * 0.5 + 0.5) * FIELD_SIZE - FIELD_SIZE / 2;
      const cz = (Math.sin(c * 78.233 + 4.1) * 0.5 + 0.5) * FIELD_SIZE - FIELD_SIZE / 2;
      const clusterY = CLOUD_HEIGHT + Math.sin(c * 5.31) * 6;
      const clusterOpacity = 0.55 + (Math.sin(c * 3.7) * 0.5 + 0.5) * 0.35;
      const baseSize = 7 + (Math.sin(c * 9.13) * 0.5 + 0.5) * 6;

      for (let p = 0; p < PUFFS_PER_CLUSTER; p += 1) {
        const a = (p / PUFFS_PER_CLUSTER) * Math.PI * 2 + c;
        const r = baseSize * 0.32 * (p === 0 ? 0 : 1);

        center[i * 3] = cx + Math.cos(a) * r;
        center[i * 3 + 1] = clusterY + Math.sin(a * 1.7) * baseSize * 0.12;
        center[i * 3 + 2] = cz + Math.sin(a) * r;

        size[i] = baseSize * (p === 0 ? 1 : 0.6 + Math.sin(a) * 0.15);
        seed[i] = i * 0.618;
        opacity[i] = clusterOpacity;
        i += 1;
      }
    }

    geo.setAttribute('aCenter', new THREE.InstancedBufferAttribute(center, 3));
    geo.setAttribute('aSize', new THREE.InstancedBufferAttribute(size, 1));
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1));
    geo.setAttribute('aOpacity', new THREE.InstancedBufferAttribute(opacity, 1));
    geo.instanceCount = TOTAL_PUFFS;
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uWind: { value: new THREE.Vector2(1, 0) },
          uWindStrength: { value: 0.4 },
          uFieldSize: { value: FIELD_SIZE },
          uCamPos: { value: new THREE.Vector3() },
          uColorLit: { value: new THREE.Color('#ffffff') },
          uColorShadow: { value: new THREE.Color('#8fa0b8') },
          uGlobalOpacity: { value: 0.6 },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  );

  useFrame((state) => {
    const atmo = useAtmosphereStore.getState();
    const sky = evaluateSky(atmo.time, atmo.weather, atmo.weatherBlend);
    const mat = materialRef.current ?? material;

    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uWindStrength.value = atmo.windStrength;
    mat.uniforms.uWind.value.set(Math.cos(atmo.windAngle), Math.sin(atmo.windAngle));
    mat.uniforms.uCamPos.value.copy(state.camera.position);

    // Nubladas y densas bajo mal clima; dispersas y luminosas en
    // despejado — así el cielo confirma visualmente lo que ya dice
    // el HUD de clima.
    const overcast =
      atmo.weather === 'storm'
        ? 1
        : atmo.weather === 'rain'
          ? 0.78
          : atmo.weather === 'cloudy'
            ? 0.55
            : atmo.weather === 'fog'
              ? 0.35
              : 0.16;

    const blend = atmo.weatherBlend;
    const target = 0.16 + (overcast - 0.16) * blend;

    mat.uniforms.uGlobalOpacity.value = THREE.MathUtils.damp(
      mat.uniforms.uGlobalOpacity.value,
      target,
      1.2,
      Math.min(0.1, state.clock.getDelta()),
    );

    mat.uniforms.uColorLit.value.copy(sky.sun).lerp(new THREE.Color('#ffffff'), 0.55);
    mat.uniforms.uColorShadow.value
      .copy(sky.zenith)
      .lerp(new THREE.Color(atmo.weather === 'storm' ? '#333c46' : '#8fa0b8'), 0.6);
  });

  return (
    <mesh geometry={geometry} frustumCulled={false} renderOrder={-50}>
      <primitive ref={materialRef} object={material} attach="material" />
    </mesh>
  );
};

export default Clouds;
