import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  useAtmosphereStore,
  evaluateSky,
  getNightFactor,
  getRainAmount,
} from '../../../world/atmosphere';
import { getWorldTerrainHeight } from '../../../world/terrain';

/* ============================================================
   PARTÍCULAS ATMOSFÉRICAS
   ============================================================
   Un único sistema de puntos que cambia de papel según el clima y la
   hora, en vez de cinco sistemas encendiéndose y apagándose:

   - Lluvia / tormenta → gotas alargadas cayendo, inclinadas por el viento
   - Día despejado     → polen / motas de luz flotando
   - Noche             → luciérnagas con parpadeo propio
   - Viento fuerte     → hojas arrastradas

   Las partículas viven en una CAJA que sigue a la cámara, así que
   siempre están donde se ven y nunca se simulan de más.
============================================================ */

const COUNT = 900;

const BOX_XZ = 34;

const BOX_Y = 20;

const VERT = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;

  uniform float uTime;
  uniform vec3 uOrigin;
  uniform vec2 uWind;
  uniform float uWindStrength;
  uniform float uRain;
  uniform float uNight;
  uniform float uBoxXZ;
  uniform float uBoxY;
  uniform float uPixelRatio;

  varying float vAlpha;
  varying float vKind;

  void main() {
    // Cada partícula tiene una posición base pseudoaleatoria estable
    // derivada de su semilla; el movimiento se calcula sin estado.
    vec3 base = vec3(
      fract(sin(aSeed * 12.9898) * 43758.5453),
      fract(sin(aSeed * 78.2330) * 12345.6789),
      fract(sin(aSeed * 39.4250) * 24680.1357)
    );

    float speed = mix(1.4, 9.0, uRain);
    float fall = fract(base.y - uTime * speed * (0.35 + base.x * 0.4));

    // Deriva lateral: la lluvia va casi recta, el polen serpentea.
    float drift = mix(1.0, 0.15, uRain);
    float wobble = sin(uTime * (0.5 + base.z) + aSeed * 6.28) * drift;

    vec3 local = vec3(
      (base.x - 0.5) * 2.0 * uBoxXZ + wobble * 2.2 + uWind.x * uWindStrength * fall * 6.0,
      fall * uBoxY,
      (base.z - 0.5) * 2.0 * uBoxXZ + wobble * 1.6 + uWind.y * uWindStrength * fall * 6.0
    );

    // La caja sigue a la cámara, redondeada a la unidad para que el
    // seguimiento no se note como un "arrastre" de las partículas.
    vec3 world = floor(uOrigin) + local;

    vec4 mvPosition = viewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Tamaño: gotas finas, polen puntual, luciérnagas algo mayores.
    // Deliberadamente pequeño — motas gordas se leen como manchas de
    // suciedad en la pantalla, no como atmósfera.
    float night = uNight * (1.0 - uRain);
    float size = aSize * mix(0.55, 1.25, uRain) * mix(1.0, 1.7, night);
    gl_PointSize = clamp(size * uPixelRatio * (9.0 / max(1.0, -mvPosition.z)), 1.0, 7.0);

    // Desvanecer cerca del suelo y en los bordes de la caja.
    float edge = 1.0 - smoothstep(0.55, 1.0, length(local.xz) / uBoxXZ);
    float top = smoothstep(0.0, 0.12, fall) * (1.0 - smoothstep(0.85, 1.0, fall));

    // De día despejado el polvo es MUY sutil: se debe intuir, no ver.
    float amount = max(uRain, mix(0.11, 0.75, night));
    vAlpha = edge * top * amount;

    // Parpadeo de luciérnaga.
    if (night > 0.35 && uRain < 0.1) {
      vAlpha *= 0.35 + 0.65 * pow(abs(sin(uTime * 1.9 + aSeed * 31.0)), 3.0);
    }

    vKind = uRain > 0.35 ? 1.0 : (night > 0.35 ? 2.0 : 0.0);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uRainColor;
  uniform vec3 uMoteColor;
  uniform vec3 uFireflyColor;

  varying float vAlpha;
  varying float vKind;

  void main() {
    vec2 c = gl_PointCoord - 0.5;

    // Las gotas se estiran en vertical; lo demás es redondo.
    if (vKind > 0.5 && vKind < 1.5) {
      c.x *= 3.4;
    }

    float d = length(c);
    if (d > 0.5) discard;

    float soft = 1.0 - smoothstep(0.12, 0.5, d);

    vec3 color =
      vKind > 1.5 ? uFireflyColor :
      vKind > 0.5 ? uRainColor : uMoteColor;

    float a = vAlpha * soft;
    if (a < 0.01) discard;

    gl_FragColor = vec4(color, a);
  }
`;

export const WeatherFX: React.FC = () => {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    const sizes = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i += 1) {
      seeds[i] = i * 0.7317 + 1;
      sizes[i] = 1.1 + (i % 7) * 0.22;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uOrigin: { value: new THREE.Vector3() },
          uWind: { value: new THREE.Vector2(1, 0) },
          uWindStrength: { value: 0.5 },
          uRain: { value: 0 },
          uNight: { value: 0 },
          uBoxXZ: { value: BOX_XZ },
          uBoxY: { value: BOX_Y },
          uPixelRatio: { value: 1 },
          uRainColor: { value: new THREE.Color('#b9d6e8') },
          uMoteColor: { value: new THREE.Color('#fff3c4') },
          uFireflyColor: { value: new THREE.Color('#c8ff9e') },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame((state) => {
    const atmo = useAtmosphereStore.getState();
    const sky = evaluateSky(atmo.time, atmo.weather, atmo.weatherBlend);
    const rain = getRainAmount(atmo.weather, atmo.weatherBlend);
    const night = getNightFactor(atmo.time);

    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uRain.value = rain;
    u.uNight.value = night;
    u.uWindStrength.value = atmo.windStrength;
    u.uWind.value.set(Math.cos(atmo.windAngle), Math.sin(atmo.windAngle));
    u.uPixelRatio.value = state.gl.getPixelRatio();

    // La caja se centra bajo la cámara, a la altura del terreno.
    const cam = state.camera.position;
    const groundY = getWorldTerrainHeight(cam.x, cam.z);
    u.uOrigin.value.set(cam.x, groundY - 1, cam.z - 4);

    // Las motas de polvo toman el color de la luz del momento: doradas
    // al atardecer, azuladas al alba.
    u.uMoteColor.value.copy(sky.sun).lerp(new THREE.Color('#ffffff'), 0.25);
    u.uRainColor.value.copy(sky.horizon).lerp(new THREE.Color('#cfe6f2'), 0.5);
  });

  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={20}>
      <primitive ref={matRef} object={material} attach="material" />
    </points>
  );
};

export default WeatherFX;
