import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  useAtmosphereStore,
  evaluateSky,
  getNightFactor,
  getRainAmount,
} from '../../../world/atmosphere';
import {
  getWorldTerrainHeight,
  LAKE_CENTER,
} from '../../../world/terrain';

/* ============================================================
   LUCIÉRNAGAS
   ============================================================
   No son "N partículas aleatorias por el mapa": las luciérnagas se
   organizan en ENJAMBRES anclados a sitios con sentido (claros del
   bosque, orilla del lago, alrededor de los árboles grandes), y cada
   individuo orbita el centro de su enjambre con su propio ritmo.

   Eso es lo que las hace leerse como bichos y no como polvo: se ven
   grupos, huecos, y movimiento coherente dentro de cada grupo.
============================================================ */

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const SWARMS = 14;

const PER_SWARM = 26;

const FIREFLY_COUNT = SWARMS * PER_SWARM;

const FIREFLY_VERT = /* glsl */ `
  attribute vec3 aCenter;
  attribute float aSeed;
  attribute float aRadius;

  uniform float uTime;
  uniform float uNight;
  uniform float uPixelRatio;

  varying float vGlow;

  void main() {
    float s = aSeed;

    // Órbita irregular: tres frecuencias incomensurables para que el
    // recorrido nunca se repita de forma perceptible.
    float t = uTime * (0.22 + fract(s * 0.37) * 0.3);
    vec3 offset = vec3(
      sin(t * 1.7 + s * 6.3) * 0.7 + sin(t * 0.6 + s * 2.1) * 0.45,
      sin(t * 1.1 + s * 4.7) * 0.35 + 0.35,
      cos(t * 1.4 + s * 5.9) * 0.7 + cos(t * 0.5 + s * 3.3) * 0.45
    );

    vec3 world = aCenter + offset * aRadius;

    vec4 mv = modelViewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * mv;

    // Parpadeo: cada bicho tiene su propia fase y su propio ritmo,
    // con silencios largos (pow alto) como las luciérnagas reales.
    float pulse = pow(abs(sin(uTime * (0.9 + fract(s * 0.7) * 1.1) + s * 12.0)), 5.0);
    vGlow = pulse * uNight;

    gl_PointSize = (2.5 + pulse * 5.5) * uPixelRatio * (16.0 / max(1.0, -mv.z));
  }
`;

const FIREFLY_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying float vGlow;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    // Núcleo brillante + halo suave: una sola gaussiana se ve plana.
    float core = 1.0 - smoothstep(0.0, 0.16, d);
    float halo = 1.0 - smoothstep(0.05, 0.5, d);

    float a = (core * 0.9 + halo * 0.45) * vGlow;
    if (a < 0.01) discard;

    gl_FragColor = vec4(uColor * (0.7 + core * 0.9), a);
  }
`;

const Fireflies: React.FC = () => {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uNight: { value: 0 },
          uPixelRatio: { value: 1 },
          uColor: { value: new THREE.Color('#b6ff7a') },
        },
        vertexShader: FIREFLY_VERT,
        fragmentShader: FIREFLY_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(FIREFLY_COUNT * 3);
    const center = new Float32Array(FIREFLY_COUNT * 3);
    const seed = new Float32Array(FIREFLY_COUNT);
    const radius = new Float32Array(FIREFLY_COUNT);

    // Anclas de enjambre elegidas a mano donde tienen sentido: claros,
    // orilla del lago, arboleda de cerezos, borde del campamento.
    const anchors: [number, number][] = [
      [4, 12], [-4, 14], [-12, 6], [-16, -10], [-19, -14],
      [8, -10], [14, -12], [18, 2], [LAKE_CENTER[0] - 10, LAKE_CENTER[1] - 4],
      [LAKE_CENTER[0] + 8, LAKE_CENTER[1] + 6], [-24, 4], [22, 12],
      [-8, -20], [6, 20],
    ];

    let i = 0;
    for (let s = 0; s < SWARMS; s += 1) {
      const [ax, az] = anchors[s % anchors.length];
      const jx = ax + (hash(s * 3.1) - 0.5) * 5;
      const jz = az + (hash(s * 7.7) - 0.5) * 5;
      const ground = getWorldTerrainHeight(jx, jz);
      const swarmRadius = 1.6 + hash(s * 5.3) * 2.6;

      for (let k = 0; k < PER_SWARM; k += 1) {
        const a = hash(i * 1.7) * Math.PI * 2;
        const r = hash(i * 2.9) * swarmRadius;

        center[i * 3] = jx + Math.cos(a) * r;
        center[i * 3 + 1] = ground + 0.7 + hash(i * 4.3) * 1.9;
        center[i * 3 + 2] = jz + Math.sin(a) * r;

        seed[i] = i * 0.618;
        radius[i] = 0.5 + hash(i * 6.1) * 0.9;
        i += 1;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aCenter', new THREE.BufferAttribute(center, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    geo.setAttribute('aRadius', new THREE.BufferAttribute(radius, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

    return geo;
  }, []);

  useFrame((state) => {
    const atmo = useAtmosphereStore.getState();
    const night = getNightFactor(atmo.time);
    const rain = getRainAmount(atmo.weather, atmo.weatherBlend);

    material.uniforms.uTime.value = state.clock.elapsedTime;
    // Con lluvia las luciérnagas se esconden.
    material.uniforms.uNight.value = night * (1 - rain * 0.9);
    material.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
  });

  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={22}>
      <primitive object={material} attach="material" />
    </points>
  );
};

/* ============================================================
   HALO DE LUZ
   ============================================================
   Un quad aditivo que siempre mira a la cámara. Es lo que convierte
   una luz puntual (que solo ilumina superficies) en una fuente que
   se VE: sin esto, una fogata de noche es un charco de luz en el
   suelo sin nada brillando en el centro.
============================================================ */

function useGlowTexture(): THREE.Texture {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      const t = new THREE.Texture();
      t.needsUpdate = true;
      return t;
    }

    // Caída AGRESIVA: un halo con caída suave se convierte en una
    // mancha lechosa que aplana toda la escena. Lo que se busca es un
    // núcleo pequeño y muy brillante con un velo tenue alrededor.
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.06, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.16, 'rgba(255,255,255,0.34)');
    g.addColorStop(0.34, 'rgba(255,255,255,0.10)');
    g.addColorStop(0.62, 'rgba(255,255,255,0.025)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

interface GlowProps {
  position: [number, number, number];
  color: string;
  size: number;
  /** 0 = siempre visible, 1 = solo de noche. */
  nightOnly?: number;
  flicker?: number;
}

export const Glow: React.FC<GlowProps> = ({
  position,
  color,
  size,
  nightOnly = 1,
  flicker = 0,
}) => {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const texture = useGlowTexture();

  useFrame((state) => {
    if (!ref.current || !matRef.current) return;

    const atmo = useAtmosphereStore.getState();
    const night = getNightFactor(atmo.time);
    const t = state.clock.elapsedTime;

    const f =
      flicker > 0
        ? 1 +
          (Math.sin(t * 9.3) * 0.12 +
            Math.sin(t * 15.1) * 0.07 +
            Math.sin(t * 3.7) * 0.09) *
            flicker
        : 1;

    const visibility = THREE.MathUtils.lerp(1, night, nightOnly);

    matRef.current.opacity = 0.55 * visibility * f;
    ref.current.scale.setScalar(size * (0.92 + f * 0.08));
    ref.current.visible = visibility > 0.02;

    // Billboard esférico: un halo debe encarar la cámara del todo.
    ref.current.quaternion.copy(state.camera.quaternion);
  });

  return (
    <mesh ref={ref} position={position} renderOrder={21}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={matRef}
        map={texture}
        color={color}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </mesh>
  );
};

/* ============================================================
   LLAMAS
   ============================================================
   Capas de quads aditivos con escala y opacidad animadas en
   contrafase. Es la técnica clásica de fuego 2D y encaja mucho mejor
   con el pixel-art que un sistema de partículas realista.
============================================================ */

const FLAME_LAYERS = 5;

export const Flames: React.FC<{ position: [number, number, number] }> = ({
  position,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useGlowTexture();

  const layers = useMemo(
    () =>
      Array.from({ length: FLAME_LAYERS }, (_, i) => ({
        phase: i * 1.37,
        speed: 1.6 + i * 0.42,
        baseScale: 0.62 - i * 0.075,
        color: i < 2 ? '#fff3b0' : i < 4 ? '#ff9a34' : '#e2451c',
        rise: 0.16 + i * 0.1,
      })),
    [],
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const cfg = layers[i];
      const wave = Math.sin(t * cfg.speed + cfg.phase);
      const wave2 = Math.sin(t * cfg.speed * 1.7 + cfg.phase * 2.1);

      mesh.position.y = cfg.rise + wave * 0.055;
      mesh.position.x = wave2 * 0.045;
      mesh.scale.set(
        cfg.baseScale * (0.86 + wave2 * 0.16),
        cfg.baseScale * (1.25 + wave * 0.3),
        1,
      );
      mesh.quaternion.copy(state.camera.quaternion);

      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.55 + wave * 0.2;
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {layers.map((l, i) => (
        <mesh key={i} renderOrder={21}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={texture}
            color={l.color}
            transparent
            opacity={0.6}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
};

/* ============================================================
   HUMO
============================================================ */

export const Smoke: React.FC<{ position: [number, number, number] }> = ({
  position,
}) => {
  const ref = useRef<THREE.Points>(null);
  const texture = useGlowTexture();

  const geometry = useMemo(() => {
    const n = 20;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i += 1) seed[i] = i / n;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return geo;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const atmo = useAtmosphereStore.getState();

    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    const seeds = ref.current.geometry.attributes.aSeed.array as Float32Array;

    for (let i = 0; i < seeds.length; i += 1) {
      const life = (t * 0.16 + seeds[i]) % 1;
      // El humo se va con el viento: conecta el fuego con el clima.
      const drift = atmo.windStrength * life * 1.6;
      arr[i * 3] =
        Math.sin(seeds[i] * 22 + life * 3.4) * 0.3 * life +
        Math.cos(atmo.windAngle) * drift;
      arr[i * 3 + 1] = 0.55 + life * 3.4;
      arr[i * 3 + 2] =
        Math.cos(seeds[i] * 17 + life * 2.8) * 0.3 * life +
        Math.sin(atmo.windAngle) * drift;
    }

    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry} position={position} renderOrder={19}>
      <pointsMaterial
        map={texture}
        size={1.1}
        color="#6b6257"
        transparent
        opacity={0.16}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
};

/* ============================================================
   BRUMA DE PROFUNDIDAD
   ============================================================
   Planos horizontales translúcidos a distintas alturas. Separan
   visualmente los planos del paisaje (lo que la referencia consigue
   con capas de niebla entre las hileras de árboles) sin coste real.
============================================================ */

export const DepthHaze: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  // Muy sutil a propósito: la bruma debe separar planos, no lavar la
  // imagen. La niebla "de verdad" la pone scene.fog.
  const layers = useMemo(
    () => [
      { y: -2.5, radius: 60, opacity: 0.055 },
      { y: 0.6, radius: 52, opacity: 0.035 },
      { y: 3.2, radius: 46, opacity: 0.022 },
    ],
    [],
  );

  useFrame((state) => {
    if (!groupRef.current) return;

    const atmo = useAtmosphereStore.getState();
    const sky = evaluateSky(atmo.time, atmo.weather, atmo.weatherBlend);
    const fogWeather = atmo.weather === 'fog' ? atmo.weatherBlend : 0;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const cfg = layers[i];

      mat.color.copy(sky.fog);
      mat.opacity = cfg.opacity * (0.55 + fogWeather * 1.5);
      // Rotación lentísima: la bruma nunca está del todo quieta.
      mesh.rotation.z = t * 0.006 * (i + 1);
      mesh.position.set(state.camera.position.x, cfg.y, state.camera.position.z);
    });
  });

  return (
    <group ref={groupRef}>
      {layers.map((l, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} renderOrder={18}>
          <circleGeometry args={[l.radius, 24]} />
          <meshBasicMaterial
            transparent
            opacity={l.opacity}
            depthWrite={false}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
};

export { Fireflies };

export default Fireflies;
