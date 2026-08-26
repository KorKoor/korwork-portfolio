import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  useAtmosphereStore,
  evaluateSky,
  getSunDirection,
  getNightFactor,
} from '../../../world/atmosphere';

/* ============================================================
   CIELO Y LUZ SOLAR
   ============================================================
   Una cúpula con degradado cenit→horizonte, un disco de sol/luna
   que recorre el cielo, estrellas que aparecen de noche, y las luces
   de la escena (direccional + ambiente + hemisférica + niebla) todas
   pilotadas por el mismo reloj de `atmosphere.ts`.

   Todo se actualiza mutando objetos ya existentes dentro de useFrame:
   ni un solo re-render de React por frame.
============================================================ */

const SKY_VERT = /* glsl */ `
  varying vec3 vWorldDir;
  void main() {
    vWorldDir = normalize((modelMatrix * vec4(position, 1.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  uniform float uNight;
  uniform float uTime;

  varying vec3 vWorldDir;

  // Ruido de valor barato para las estrellas.
  float hash21(vec2 p) {
    p = fract(p * vec2(233.34, 851.73));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
  }

  void main() {
    vec3 dir = normalize(vWorldDir);

    // Degradado vertical con una curva suave: el horizonte ocupa más
    // pantalla del que le tocaría en un lerp lineal, que es lo que
    // hace que un cielo se lea como cielo.
    float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
    float t = pow(smoothstep(0.35, 0.92, h), 0.85);
    vec3 color = mix(uHorizon, uZenith, t);

    // Halo alrededor del sol.
    float sunAmount = max(0.0, dot(dir, normalize(uSunDir)));
    color += uSunColor * pow(sunAmount, 22.0) * 1.4;
    color += uSunColor * pow(sunAmount, 4.0) * 0.16;

    // Estrellas: solo de noche y solo por encima del horizonte.
    if (uNight > 0.02 && dir.y > 0.02) {
      vec2 grid = floor(dir.xz / max(0.0001, abs(dir.y)) * 42.0);
      float n = hash21(grid);
      float star = step(0.9965, n);
      float twinkle = 0.65 + 0.35 * sin(uTime * 2.2 + n * 90.0);
      color += vec3(star * twinkle * uNight * smoothstep(0.02, 0.4, dir.y));
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

export const Sky: React.FC = () => {
  const { scene } = useThree();

  const sunRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const discRef = useRef<THREE.Mesh>(null);
  const discMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const sunDir = useRef(new THREE.Vector3());

  const skyMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uZenith: { value: new THREE.Color('#5f9fd6') },
          uHorizon: { value: new THREE.Color('#bfe0ef') },
          uSunColor: { value: new THREE.Color('#fff3d8') },
          uSunDir: { value: new THREE.Vector3(0, 1, 0) },
          uNight: { value: 0 },
          uTime: { value: 0 },
        },
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );

  const fog = useMemo(() => new THREE.Fog('#b7d3dd', 50, 130), []);

  useFrame((state, delta) => {
    const atmo = useAtmosphereStore.getState();
    atmo.advance(Math.min(delta, 0.1));

    const sky = evaluateSky(atmo.time, atmo.weather, atmo.weatherBlend);
    const night = getNightFactor(atmo.time);
    getSunDirection(atmo.time, sunDir.current);

    // BUG SUTIL PERO GRAVE: de noche el "sol" está bajo el horizonte,
    // así que la direccional quedaba DEBAJO del terreno e iluminaba
    // el mundo desde abajo — de ahí que la noche se viera negra por
    // arriba. Cuando el sol se pone, el astro que ilumina es la luna:
    // la misma dirección invertida.
    if (sunDir.current.y < 0.02) {
      sunDir.current.negate();
      sunDir.current.y = Math.max(0.28, sunDir.current.y);
      sunDir.current.normalize();
    }

    // -- cúpula --
    skyMaterial.uniforms.uZenith.value.copy(sky.zenith);
    skyMaterial.uniforms.uHorizon.value.copy(sky.horizon);
    skyMaterial.uniforms.uSunColor.value.copy(sky.sun);
    skyMaterial.uniforms.uSunDir.value.copy(sunDir.current);
    skyMaterial.uniforms.uNight.value = night;
    skyMaterial.uniforms.uTime.value = state.clock.elapsedTime;

    // -- niebla: es la que "funde" el mundo con el cielo --
    fog.color.copy(sky.fog);
    fog.near = sky.fogNear;
    fog.far = sky.fogFar;
    scene.fog = fog;

    // -- luces --
    if (sunRef.current) {
      sunRef.current.position
        .copy(sunDir.current)
        .multiplyScalar(60)
        .add(state.camera.position.clone().setY(0));
      sunRef.current.target.position.copy(state.camera.position).setY(0);
      sunRef.current.target.updateMatrixWorld();
      sunRef.current.color.copy(sky.sun);
      sunRef.current.intensity = sky.sunIntensity;
      // De noche el sol se apaga: la sombra dura de una luna llena
      // se ve peor que no tener sombra.
      sunRef.current.castShadow = sky.sunIntensity > 0.55;
    }

    if (fillRef.current) {
      fillRef.current.color.copy(sky.zenith);
      fillRef.current.intensity = 0.35 + night * 0.25;
    }

    if (ambientRef.current) {
      ambientRef.current.color.copy(sky.ambient);
      ambientRef.current.intensity = sky.ambientIntensity;
    }

    if (hemiRef.current) {
      hemiRef.current.color.copy(sky.horizon);
      hemiRef.current.groundColor.copy(sky.ground);
      hemiRef.current.intensity = 0.35 + night * 0.1;
    }

    // -- disco de sol / luna, pegado a la cúpula --
    if (discRef.current && discMatRef.current) {
      discRef.current.position
        .copy(state.camera.position)
        .add(sunDir.current.clone().multiplyScalar(180));
      discRef.current.lookAt(state.camera.position);

      const isMoon = night > 0.5;
      discMatRef.current.color.set(isMoon ? '#e8ecff' : '#fff6d8');
      discMatRef.current.opacity = sunDir.current.y > -0.15 ? 1 : 0;
      discRef.current.scale.setScalar(isMoon ? 5 : 7);
      discRef.current.visible = sunDir.current.y > -0.15;
    }
  });

  return (
    <group>
      <mesh scale={300} renderOrder={-100} frustumCulled={false}>
        <sphereGeometry args={[1, 32, 24]} />
        <primitive object={skyMaterial} attach="material" />
      </mesh>

      <mesh ref={discRef} renderOrder={-99}>
        <circleGeometry args={[1, 24]} />
        <meshBasicMaterial
          ref={discMatRef}
          color="#fff6d8"
          transparent
          fog={false}
          depthWrite={false}
        />
      </mesh>

      <directionalLight
        ref={sunRef}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-near={0.5}
        shadow-camera-far={160}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
      />
      <directionalLight ref={fillRef} position={[-25, 18, -20]} intensity={0.4} />
      <ambientLight ref={ambientRef} intensity={0.45} />
      <hemisphereLight ref={hemiRef} intensity={0.4} />
    </group>
  );
};

export default Sky;
