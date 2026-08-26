import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  LAKE_CENTER,
  LAKE_RADIUS,
  WATER_LEVEL,
  getWorldTerrainHeight,
} from '../../../world/terrain';
import {
  useAtmosphereStore,
  evaluateSky,
  getSunDirection,
  getRainAmount,
} from '../../../world/atmosphere';

/* ============================================================
   AGUA
   ============================================================
   Antes: un círculo azul opaco con borde duro.
   Ahora: malla con oleaje real por vértice, color por profundidad,
   espuma en la orilla, brillo especular del sol, y salpicaduras de
   lluvia cuando el clima lo pide.

   La profundidad se calcula CONTRA EL TERRENO (la misma función que
   usa el jugador), así el agua se aclara sola donde el fondo sube —
   que es lo que hace que un lago se lea como un lago.
============================================================ */

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uWaves;

  varying vec2 vWorldXZ;
  varying float vWave;

  #include <fog_pars_vertex>

  void main() {
    vec3 pos = position;
    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorldXZ = world.xz;

    // Tres trenes de olas cruzados: sin el tercero se nota el patrón.
    float w =
      sin(world.x * 0.55 + uTime * 1.10) * 0.5 +
      sin(world.z * 0.43 - uTime * 0.85) * 0.42 +
      sin((world.x + world.z) * 0.27 + uTime * 1.6) * 0.28;

    vWave = w;
    world.y += w * 0.075 * uWaves;

    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;

    #include <fog_vertex>
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec2 uCenter;
  uniform float uRadius;
  uniform vec3 uShallow;
  uniform vec3 uDeep;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  uniform float uSunIntensity;
  uniform float uRain;
  uniform sampler2D uDepthMap;

  varying vec2 vWorldXZ;
  varying float vWave;

  #include <fog_pars_fragment>

  float hash21(vec2 p) {
    p = fract(p * vec2(233.34, 851.73));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
  }

  void main() {
    // Profundidad leída de un mapa pre-horneado del fondo del lago.
    vec2 uvDepth = (vWorldXZ - uCenter) / (uRadius * 2.0) + 0.5;
    float depth = texture2D(uDepthMap, uvDepth).r;

    // Fuera del lago no se dibuja nada: así el borde sigue la forma
    // real del terreno en vez de ser un círculo perfecto.
    if (depth <= 0.004) discard;

    float shallowness = 1.0 - clamp(depth * 1.5, 0.0, 1.0);

    vec3 color = mix(uDeep, uShallow, shallowness);

    // Espuma en la orilla, ondulada para que no sea un anillo liso.
    float foamBand = smoothstep(0.10, 0.0, depth);
    float foamNoise = 0.5 + 0.5 * sin(vWorldXZ.x * 5.0 + vWorldXZ.y * 4.0 + uTime * 2.4);
    float foam = foamBand * (0.45 + foamNoise * 0.55);
    color = mix(color, vec3(0.86, 0.94, 0.97), foam * 0.75);

    // Brillo especular: la cresta de la ola capta el sol.
    float crest = smoothstep(0.35, 1.0, vWave);
    float sunUp = clamp(uSunDir.y, 0.0, 1.0);
    color += uSunColor * crest * 0.32 * uSunIntensity * 0.35 * sunUp;

    // Cáusticas sugeridas en la zona somera.
    float caustic = sin(vWorldXZ.x * 3.1 + uTime * 1.3) * sin(vWorldXZ.y * 2.7 - uTime * 1.1);
    color += uSunColor * max(0.0, caustic) * shallowness * 0.10 * sunUp;

    // Lluvia: puntitos que aparecen y desaparecen.
    if (uRain > 0.01) {
      vec2 cell = floor(vWorldXZ * 3.5);
      float t = fract(uTime * 1.6 + hash21(cell));
      float ring = smoothstep(0.0, 0.12, t) * smoothstep(0.45, 0.12, t);
      color += vec3(0.55) * ring * uRain * 0.4;
    }

    float alpha = mix(0.72, 0.94, clamp(depth * 2.0, 0.0, 1.0));
    alpha = mix(alpha, 1.0, foam * 0.6);

    gl_FragColor = vec4(color, alpha);
    #include <fog_fragment>
  }
`;

const MAP_SIZE = 128;

export const WaterSurface: React.FC = () => {
  const sunDir = useRef(new THREE.Vector3());

  /**
   * Mapa de profundidad del lago pre-horneado en CPU. Muestrear la
   * función de terreno en el shader sería imposible (es JS), y
   * hacerlo por vértice deja el borde dentado — con una textura de
   * 128×128 el borde queda suave y además sale gratis en runtime.
   */
  const depthMap = useMemo(() => {
    const data = new Uint8Array(MAP_SIZE * MAP_SIZE * 4);
    const span = LAKE_RADIUS * 2;

    for (let j = 0; j < MAP_SIZE; j += 1) {
      for (let i = 0; i < MAP_SIZE; i += 1) {
        const wx = LAKE_CENTER[0] + ((i / (MAP_SIZE - 1)) - 0.5) * span * 2;
        const wz = LAKE_CENTER[1] + ((j / (MAP_SIZE - 1)) - 0.5) * span * 2;
        const depth = Math.max(0, WATER_LEVEL - getWorldTerrainHeight(wx, wz));
        const v = Math.min(255, Math.round((depth / 3.5) * 255));
        const o = (j * MAP_SIZE + i) * 4;
        data[o] = v;
        data[o + 1] = v;
        data[o + 2] = v;
        data[o + 3] = 255;
      }
    }

    const tex = new THREE.DataTexture(data, MAP_SIZE, MAP_SIZE);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return tex;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          {
            uTime: { value: 0 },
            uWaves: { value: 1 },
            uCenter: { value: new THREE.Vector2(LAKE_CENTER[0], LAKE_CENTER[1]) },
            uRadius: { value: LAKE_RADIUS * 2 },
            uShallow: { value: new THREE.Color('#4fa8c4') },
            uDeep: { value: new THREE.Color('#12354f') },
            uSunColor: { value: new THREE.Color('#ffffff') },
            uSunDir: { value: new THREE.Vector3(0, 1, 0) },
            uSunIntensity: { value: 2.4 },
            uRain: { value: 0 },
            uDepthMap: { value: depthMap },
          },
        ]),
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        fog: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [depthMap],
  );

  useFrame((state) => {
    const atmo = useAtmosphereStore.getState();
    const sky = evaluateSky(atmo.time, atmo.weather, atmo.weatherBlend);
    getSunDirection(atmo.time, sunDir.current);

    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uSunColor.value.copy(sky.sun);
    u.uSunIntensity.value = sky.sunIntensity;
    u.uSunDir.value.copy(sunDir.current);
    u.uRain.value = getRainAmount(atmo.weather, atmo.weatherBlend);
    // Con tormenta el oleaje sube.
    u.uWaves.value = 1 + atmo.windStrength * 0.9;

    // El agua toma color del cielo: un lago gris bajo tormenta y
    // turquesa a mediodía sin tocar nada más.
    u.uShallow.value.set('#4fa8c4').lerp(sky.horizon, 0.32);
    u.uDeep.value.set('#12354f').lerp(sky.zenith, 0.28);
  });

  return (
    <mesh
      position={[LAKE_CENTER[0], WATER_LEVEL, LAKE_CENTER[1]]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={3}
    >
      <planeGeometry args={[LAKE_RADIUS * 4, LAKE_RADIUS * 4, 72, 72]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

export default WaterSurface;
