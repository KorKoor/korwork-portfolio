import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Terrain } from './Terrain';
import { EnvironmentDecor } from './EnvironmentDecor';
import { Wildlife } from './Wildlife';
import { CaveZone } from './CaveZone';
import { Waterfall } from './Waterfall';
import { Sky } from './Sky';
import { Clouds } from './Clouds';
import { StonePaths } from './StonePaths';
import { HouseExterior } from './HouseExterior';
import { NPCsLayer } from './NPCs';
import { Butterflies } from './Butterflies';
import {
  Fireflies,
  Glow,
  Flames,
  Smoke,
  DepthHaze,
} from './NightVFX';
import { WaterSurface } from './WaterSurface';
import { WeatherFX } from './WeatherFX';
import { useVitalsStore } from '../../../store/vitals';
import {
  useAtmosphereStore,
  evaluateSky,
  getNightFactor,
  getRainAmount,
} from '../../../world/atmosphere';
import { audio } from '../../../audio/AudioEngine';
import {
  getWorldTerrainHeight,
  WATER_LEVEL,
  LAKE_CENTER,
  LAKE_RADIUS,
  DOCK_POSITION,
  CAVE_CENTER,
} from '../../../world/terrain';

/* ============================================================
   AMBIENTE SONORO
   ============================================================
   El puente entre el estado del mundo y el motor de audio: viento,
   lluvia, grillos y agua siguen a la atmósfera y a dónde está el
   jugador, sin que ningún otro sistema tenga que saber de audio.
============================================================ */

function AmbientAudio({
  playerPositionRef,
}: {
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
}) {
  useFrame(() => {
    const atmo = useAtmosphereStore.getState();
    const pos = playerPositionRef.current;

    const distLake = Math.hypot(
      pos.x - LAKE_CENTER[0],
      pos.z - LAKE_CENTER[1],
    );

    audio.updateAmbience({
      windStrength: atmo.windStrength,
      rain: getRainAmount(atmo.weather, atmo.weatherBlend),
      night: getNightFactor(atmo.time),
      nearWater: Math.max(
        0,
        1 - Math.max(0, distLake - LAKE_RADIUS) / 12,
      ),
      indoors: false,
    });
  });

  return null;
}

/* ============================================================
   ZONAS DE VITALES
============================================================ */

/** Posición del cristal luminoso dentro de la cueva (ver CaveZone). */
const CAVE_GLOW: [number, number] = [CAVE_CENTER[0], CAVE_CENTER[1] - 6.8];

const HEAL_ZONE = { x: 10.5, z: 6.5, radius: 2.8, rate: 9 };

const HAZARD_ZONE = { x: 18.4, z: -9.8, radius: 1.8, rate: 7 };

function VitalsZones({
  playerPositionRef,
}: {
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
}) {
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30);
    const pos = playerPositionRef.current;
    const vitals = useVitalsStore.getState();
    const atmo = useAtmosphereStore.getState();

    if (Math.hypot(pos.x - HEAL_ZONE.x, pos.z - HEAL_ZONE.z) < HEAL_ZONE.radius) {
      vitals.heal(HEAL_ZONE.rate * delta);
    }

    if (Math.hypot(pos.x - HAZARD_ZONE.x, pos.z - HAZARD_ZONE.z) < HAZARD_ZONE.radius) {
      vitals.takeDamage(HAZARD_ZONE.rate * delta);
    }

    // Meterse al agua enfría: drena stamina. Es la primera regla de
    // "el mundo te afecta" que no depende de tocar un objeto.
    if (getWorldTerrainHeight(pos.x, pos.z) < WATER_LEVEL + 0.15) {
      vitals.drainStamina(16 * delta);
    }

    // Bajo tormenta, estar a la intemperie cansa un poco más.
    if (atmo.weather === 'storm') {
      vitals.drainStamina(2.5 * delta * atmo.weatherBlend);
    }
  });

  return null;
}

/* ============================================================
   FOGATA — luz viva + brasas
============================================================ */

const Campfire: React.FC<{ position: [number, number] }> = ({ position }) => {
  const lightRef = useRef<THREE.PointLight>(null);
  const emberRef = useRef<THREE.Points>(null);
  const y = getWorldTerrainHeight(position[0], position[1]);

  const embers = React.useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const n = 26;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i += 1) seed[i] = i * 0.37;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    // Parpadeo de fuego: dos senos incomensurables + un pulso rápido.
    // Una sola onda se nota como "latido" mecánico.
    if (lightRef.current) {
      const flicker =
        0.78 +
        Math.sin(t * 9.1) * 0.1 +
        Math.sin(t * 14.7) * 0.06 +
        Math.sin(t * 3.3) * 0.08;
      lightRef.current.intensity = 5.2 * flicker;
    }

    if (emberRef.current) {
      const arr = emberRef.current.geometry.attributes.position
        .array as Float32Array;
      const seeds = emberRef.current.geometry.attributes.aSeed
        .array as Float32Array;

      for (let i = 0; i < seeds.length; i += 1) {
        const s = seeds[i];
        const life = (t * (0.35 + (s % 0.3)) + s) % 1;
        arr[i * 3] = Math.sin(s * 12.9 + life * 3) * 0.28 * life;
        arr[i * 3 + 1] = life * 1.9;
        arr[i * 3 + 2] = Math.cos(s * 7.3 + life * 3) * 0.28 * life;
      }

      emberRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group position={[position[0], y, position[1]]}>
      <pointLight
        ref={lightRef}
        position={[0, 0.7, 0]}
        color="#ff9a3c"
        intensity={5}
        distance={16}
        decay={2}
        castShadow={false}
      />

      {/* Llamas + halo + humo: sin esto la fogata era solo un charco
          de luz en el suelo, sin nada brillando en el centro. */}
      <Flames position={[0, 0.12, 0]} />
      <Glow position={[0, 0.55, 0]} color="#ff9436" size={2.7} nightOnly={0.55} flicker={1} />
      <Smoke position={[0, 0.3, 0]} />

      <points ref={emberRef} geometry={embers} position={[0, 0.25, 0]}>
        <pointsMaterial
          size={0.09}
          color="#ffb457"
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  );
};

/* ============================================================
   FAROLES — se encienden solos al anochecer
============================================================ */

const LANTERNS: [number, number][] = [
  [6.4, 8.6],
  [14.6, 9.8],
  [-15.5, 12.5],
  [-19.5, 14.5],
  [-13.6, -12.8],
  [DOCK_POSITION[0] - 2.6, DOCK_POSITION[1] - 1.0],
  [0, 4.6],
];

const NightLanterns: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const atmo = useAtmosphereStore.getState();
    const night = getNightFactor(atmo.time);
    const t = clock.elapsedTime;

    groupRef.current?.children.forEach((child, i) => {
      const light = child as THREE.PointLight;
      // Cada farol tiene su propio parpadeo lento — encenderlos todos
      // igual se ve artificial.
      const flicker = 0.9 + Math.sin(t * (2.1 + i * 0.4) + i) * 0.1;
      light.intensity = night * 3.4 * flicker;
      light.visible = night > 0.02;
    });
  });

  return (
    <>
      <group ref={groupRef}>
        {LANTERNS.map(([x, z], i) => (
          <pointLight
            key={`lantern-${i}`}
            position={[x, getWorldTerrainHeight(x, z) + 2.1, z]}
            color="#ffb765"
            intensity={0}
            distance={13}
            decay={2}
          />
        ))}
      </group>

      {/* Halo visible de cada farol — la luz puntual ilumina el
          entorno, pero es el halo el que hace que el farol se lea
          como una fuente de luz desde lejos. */}
      {LANTERNS.map(([x, z], i) => (
        <Glow
          key={`lantern-glow-${i}`}
          position={[x, getWorldTerrainHeight(x, z) + 2.1, z]}
          color="#ffbd72"
          size={1.5}
          flicker={0.35}
        />
      ))}
    </>
  );
};

/* ============================================================
   NIEBLA SOBRE EL LAGO — capa baja al amanecer y con clima 'fog'
============================================================ */

const LakeMist: React.FC = () => {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  const mistTexture = React.useMemo(() => {
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

    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.7)');
    g.addColorStop(0.78, 'rgba(255,255,255,0.22)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useFrame(({ clock }) => {
    const atmo = useAtmosphereStore.getState();
    const sky = evaluateSky(atmo.time, atmo.weather, atmo.weatherBlend);

    // Más densa de madrugada (0.18–0.32) y con clima de niebla.
    const dawn = 1 - Math.min(1, Math.abs(atmo.time - 0.26) / 0.09);
    const fogWeather = atmo.weather === 'fog' ? atmo.weatherBlend : 0;
    const amount = Math.max(dawn * 0.8, fogWeather * 0.7);

    if (matRef.current) {
      // Bajo a propósito: la bruma del lago debe insinuarse. Con
      // valores altos el disco se lee como una mancha pegada encima
      // del paisaje en vez de vapor sobre el agua.
      matRef.current.opacity = amount * 0.26;
      matRef.current.color.copy(sky.fog).lerp(new THREE.Color('#ffffff'), 0.35);
      matRef.current.visible = amount > 0.02;
    }

    if (ref.current) {
      ref.current.position.y =
        WATER_LEVEL + 0.55 + Math.sin(clock.elapsedTime * 0.25) * 0.12;
      ref.current.rotation.z = clock.elapsedTime * 0.012;
    }
  });

  return (
    <mesh
      ref={ref}
      position={[LAKE_CENTER[0], WATER_LEVEL + 0.55, LAKE_CENTER[1]]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={10}
    >
      <circleGeometry args={[LAKE_RADIUS * 1.7, 36]} />
      {/* Con color plano el disco mostraba su BORDE como una curva
          nítida flotando sobre el paisaje. El degradado radial hace
          que la bruma se disuelva en los extremos. */}
      <meshBasicMaterial
        ref={matRef}
        map={mistTexture}
        color="#ffffff"
        transparent
        opacity={0}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
};

/* ============================================================
   WORLD
============================================================ */

interface WorldProps {
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

export const World: React.FC<WorldProps> = React.memo(({ playerPositionRef }) => {
  return (
    <group>
      <Sky />
      <Clouds />

      <Terrain />
      <StonePaths />
      <WaterSurface />
      <LakeMist />
      <EnvironmentDecor />
      <CaveZone />
      <Waterfall />
      <Wildlife playerPositionRef={playerPositionRef} />
      <NPCsLayer playerPositionRef={playerPositionRef} />
      <Butterflies />

      <Campfire position={[10.5, 6.5]} />
      <NightLanterns />
      <WeatherFX />
      <Fireflies />
      <DepthHaze />

      {/* Cristal de la cueva: también merece su halo. */}
      <Glow
        position={[
          CAVE_GLOW[0],
          getWorldTerrainHeight(CAVE_GLOW[0], CAVE_GLOW[1]) + 1.4,
          CAVE_GLOW[1],
        ]}
        color="#a78bfa"
        size={2.2}
        nightOnly={0}
        flicker={0.25}
      />

      <VitalsZones playerPositionRef={playerPositionRef} />
      <AmbientAudio playerPositionRef={playerPositionRef} />

      <HouseExterior />

      {/* Marco de la puerta de la casa. */}
      <group position={[0, 0, 4.6]}>
        <mesh position={[-1.8, getWorldTerrainHeight(-1.8, 4.6) + 1.2, 0]} castShadow>
          <boxGeometry args={[0.2, 2.4, 0.2]} />
          <meshStandardMaterial color="#3a2415" roughness={0.9} />
        </mesh>
        <mesh position={[1.8, getWorldTerrainHeight(1.8, 4.6) + 1.2, 0]} castShadow>
          <boxGeometry args={[0.2, 2.4, 0.2]} />
          <meshStandardMaterial color="#3a2415" roughness={0.9} />
        </mesh>
        <mesh position={[0, getWorldTerrainHeight(0, 4.6) + 2.5, 0]} castShadow>
          <boxGeometry args={[3.9, 0.22, 0.24]} />
          <meshStandardMaterial color="#4a3220" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
});

World.displayName = 'World';

export default World;
