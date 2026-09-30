import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Preload } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Player, type InteractionZoneId } from './Player';
import { Room } from './Room';
import { World } from './world/World';
import { FootstepDust, type FootstepDustHandle } from './world/FootstepDust';
import { CameraOrbitControls } from './CameraOrbitControls';
import { WORLD_HALF_SIZE, getWorldTerrainHeight } from '../../world/terrain';
import { usePlayerHudStore } from '../../store/player';
import { orbitState, ORBIT_PITCH_MIN, ORBIT_PITCH_MAX } from '../../store/cameraOrbit';
import { useQualityTier } from '../../hooks/useQualityTier';

/* =========================================================
   INTERFAZ PRINCIPAL DE LA ESCENA
   ========================================================= */

export type Location = 'room' | 'world';

interface SceneProps {
  location: Location;
  onInteract: (zoneId: InteractionZoneId) => void;
  onNearbyZoneChange?: (zoneId: InteractionZoneId | null) => void;
}

const ROOM_SPAWN: [number, number, number] = [0, 0.115, 2.7];

const WORLD_SPAWN: [number, number, number] = [0, 0, 7.5];

/* =========================================================
   ETHEREAL VOID
   ========================================================= */

const EtherealVoid: React.FC<{ color: string }> = ({ color }) => {
  return (
    <group>
      <mesh scale={220}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial color={color} side={THREE.BackSide} fog={false} />
      </mesh>
    </group>
  );
};

/* =========================================================
   BREATHING LIGHT
   ========================================================= */

const BreathingLight: React.FC<{
  position: [number, number, number];
  intensity: number;
  color: string;
  speed?: number;
}> = ({ position, intensity, color, speed = 2 }) => {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const pulse = 1 + Math.sin(clock.getElapsedTime() * speed) * 0.1;
    lightRef.current.intensity = intensity * pulse;
  });

  return (
    <pointLight
      ref={lightRef}
      position={position}
      intensity={intensity}
      color={color}
      distance={10}
      decay={2}
    />
  );
};

/* =========================================================
   CAMERA RIG — 2.5D top-down cercano
   =========================================================

   Cámara orthográfica que sigue al jugador de cerca, con un
   ángulo bajo/"pegado al piso" (≈28° de elevación, no cenital)
   al estilo de un juego 2.5D top-down: ya NO intenta encuadrar
   el cuarto completo, sino una porción cercana alrededor del
   personaje.
   ========================================================= */

// Ángulo del rig: y+4.5, z+8.5 ⇒ ≈28° de elevación. Ojo: subir Y
// o bajar Z INCLINA LA CÁMARA HACIA ABAJO (más top-down); para el
// look "pegado al piso" que se busca aquí hay que ir al revés
// (Y más chico, Z más grande).
const CAM_OFFSET_Y = 4.5;
const CAM_OFFSET_Z = 8.5;

// En el mundo abierto la cámara sube bastante más (≈46°) por dos
// razones: a 28° rasantes el relieve se aplastaba contra el
// horizonte y parecía plano, y además cualquier árbol delante del
// jugador lo tapaba por completo. Desde más arriba las lomas se leen
// como volumen y el personaje casi nunca queda oculto.
const WORLD_CAM_OFFSET_Y = 17;
const WORLD_CAM_OFFSET_Z = 16;

// Zoom base (en "unidades de zoom por cada 720px de alto de
// viewport"). El cuarto usa un encuadre cerrado; el mundo abierto
// necesita MUCHO más campo de visión — con el zoom del cuarto solo
// se veían ~6 unidades de ancho y el bosque entero quedaba fuera de
// cuadro, por eso "no había vegetación".
const ROOM_ZOOM_AT_720P = 130;

const WORLD_ZOOM_AT_720P = 33;

// Límite para que la cámara no se pegue tanto a las paredes que
// termine mostrando el vacío de fondo más allá del cuarto — el
// mundo exterior es mucho más grande, así que usa su propio radio.
const ROOM_LOOK_AT_CLAMP = 6.4;

const WORLD_LOOK_AT_CLAMP = WORLD_HALF_SIZE - 3;

// Suavizado de la órbita del usuario: cuando NO está arrastrando, el
// yaw/pitch/zoom hacen damping hacia orbitState.* (que a su vez el
// usuario mueve a mano) — el arrastre en sí ya se siente instantáneo
// porque orbitState se escribe directo en CameraOrbitControls; este
// damping es solo para que soltar el mouse no "frene en seco".
const dampedYaw = { current: 0 };
const dampedPitch = { current: 0 };
const dampedZoom = { current: 1 };

const _orbitOffset = new THREE.Vector3();
const _lookAtTarget = new THREE.Vector3();
const _desiredPosition = new THREE.Vector3();

const CameraRig: React.FC<{
  playerPosition: [number, number, number];
  clampRadius: number;
  zoomAt720p: number;
  offsetY: number;
  offsetZ: number;
  terrainAware: boolean;
  /** Rotación máxima (rad) permitida a cada lado del "detrás del jugador" original. undefined = 360° libres. */
  maxYaw?: number;
  /** Cuánto se puede inclinar hacia abajo (rad) respecto al ángulo base — el cuarto necesita menos que el mundo abierto. */
  minPitchOffset?: number;
}> = ({
  playerPosition,
  clampRadius,
  zoomAt720p,
  offsetY,
  offsetZ,
  terrainAware,
  maxYaw,
  minPitchOffset = ORBIT_PITCH_MIN,
}) => {
  const { camera, size } = useThree();

  // Distancia/ángulo base del encuadre fijo original, ahora tratados
  // como el "centro" alrededor del cual orbita el usuario.
  const baseDistance = Math.hypot(offsetY, offsetZ);
  const basePitch = Math.atan2(offsetY, offsetZ);

  useFrame((_, delta) => {
    // El cuarto es un interior cerrado y chico: orbitar más allá de
    // cierto ángulo saca la cámara por fuera de las paredes y solo
    // se ve el vacío negro de EtherealVoid. En el mundo abierto
    // maxYaw viene undefined — ahí sí es 360° libres, que es todo el
    // punto de un terreno con relieve real.
    const targetYaw =
      maxYaw === undefined
        ? orbitState.yaw
        : THREE.MathUtils.clamp(orbitState.yaw, -maxYaw, maxYaw);

    dampedYaw.current = THREE.MathUtils.damp(dampedYaw.current, targetYaw, 8, delta);

    const targetPitch = THREE.MathUtils.clamp(
      orbitState.pitch,
      minPitchOffset,
      ORBIT_PITCH_MAX,
    );

    dampedPitch.current = THREE.MathUtils.damp(dampedPitch.current, targetPitch, 8, delta);
    dampedZoom.current = THREE.MathUtils.damp(dampedZoom.current, orbitState.zoom, 6, delta);

    // Cámara cercana estilo 2.5D: sigue al jugador directamente en
    // vez de mantener el cuarto completo en cuadro.
    _lookAtTarget.set(
      THREE.MathUtils.clamp(playerPosition[0], -clampRadius, clampRadius),
      playerPosition[1] + 0.9,
      THREE.MathUtils.clamp(playerPosition[2], -clampRadius, clampRadius),
    );

    const pitch = THREE.MathUtils.clamp(
      basePitch + dampedPitch.current,
      0.06,
      Math.PI / 2 - 0.08,
    );

    // OJO: la distancia física de la cámara NO controla el zoom en
    // una cámara ortográfica (la proyección ortográfica no encoge
    // con la distancia) — el zoom real se aplica más abajo sobre
    // camera.zoom. La distancia se deja fija en la base para que
    // pitch/anti-clipping trabajen con una órbita de tamaño estable.
    const distance = baseDistance;

    // Offset esférico alrededor del target: yaw=0 coincide EXACTO
    // con el encuadre fijo original (detrás del jugador, en +Z), así
    // que sin tocar nada el juego se ve idéntico a antes.
    _orbitOffset.set(
      distance * Math.cos(pitch) * Math.sin(dampedYaw.current),
      distance * Math.sin(pitch),
      distance * Math.cos(pitch) * Math.cos(dampedYaw.current),
    );

    _desiredPosition.copy(_lookAtTarget).add(_orbitOffset);

    // Anti-clipping barato: si la órbita metería la cámara bajo el
    // relieve del terreno (mirando desde muy abajo hacia una loma),
    // se levanta lo justo para quedar por encima — sin esto, rotar
    // hacia una colina metía la cámara DENTRO de ella.
    if (terrainAware) {
      const groundAtCamera = getWorldTerrainHeight(
        _desiredPosition.x,
        _desiredPosition.z,
      );
      const minY = groundAtCamera + 1.4;
      if (_desiredPosition.y < minY) {
        _desiredPosition.y = minY;
      }
    }

    // Cámara "fija" respecto al jugador: sin lerp de POSICIÓN del
    // target (eso mareaba, ver comentario histórico más abajo) — el
    // único suavizado es el de yaw/pitch/zoom de arriba, que solo se
    // nota cuando el usuario está orbitando activamente.
    camera.position.copy(_desiredPosition);
    camera.lookAt(_lookAtTarget);

    if (camera instanceof THREE.OrthographicCamera) {
      // Zoom base (relativo al alto del viewport, para que el
      // encuadre se vea consistente en cualquier tamaño de pantalla)
      // multiplicado por el zoom manual del usuario — en una cámara
      // ortográfica esto SÍ es lo que de verdad acerca/aleja: la
      // distancia física de la cámara no afecta el tamaño aparente.
      const targetZoom =
        (size.height / 720) * zoomAt720p * dampedZoom.current;

      camera.zoom = THREE.MathUtils.damp(camera.zoom, targetZoom, 4, delta);
      camera.updateProjectionMatrix();
    }
  });

  return null;
};

/* =========================================================
   DYNAMIC ROOM LIGHTS
   ========================================================= */

const DynamicRoomLights: React.FC = () => {
  const lightsRef = useRef<Array<THREE.PointLight | null>>([]);

  useFrame(({ clock }) => {
    lightsRef.current.forEach((light, index) => {
      if (!light) return;
      const baseIntensity = [1.25, 0.9, 0.75, 0.7][index] ?? 0.7;
      const pulse =
        1 + Math.sin(clock.getElapsedTime() * (1.4 + index * 0.45)) * 0.18;
      light.intensity = baseIntensity * pulse;
    });
  });

  return (
    <group>
      <pointLight
        ref={(node) => {
          lightsRef.current[0] = node;
        }}
        position={[3.2, 3.2, -5.0]}
        intensity={1.25}
        color="#7dd3fc"
        distance={12}
        decay={2}
      />

      <pointLight
        ref={(node) => {
          lightsRef.current[1] = node;
        }}
        position={[-4.8, 2.9, 2.2]}
        intensity={0.9}
        color="#d8b4fe"
        distance={10}
        decay={2}
      />

      <pointLight
        ref={(node) => {
          lightsRef.current[2] = node;
        }}
        position={[5.6, 3.0, 4.2]}
        intensity={0.75}
        color="#fde68a"
        distance={12}
        decay={2}
      />

      <pointLight
        ref={(node) => {
          lightsRef.current[3] = node;
        }}
        position={[-1.6, 2.7, -5.4]}
        intensity={0.7}
        color="#fdba74"
        distance={9}
        decay={2}
      />
    </group>
  );
};

/* =========================================================
   SCENE
   ========================================================= */

export const Scene: React.FC<SceneProps> = ({
  location,
  onInteract,
  onNearbyZoneChange,
}) => {
  const spawn = location === 'world' ? WORLD_SPAWN : ROOM_SPAWN;
  const tier = useQualityTier();

  const [playerPosition, setPlayerPosition] =
    useState<[number, number, number]>(spawn);

  // Referencia "en vivo" de la posición del jugador (además del
  // estado de React de arriba, que solo mueve la cámara): la fauna
  // y las zonas de salud del mundo la leen cada frame sin
  // suscribirse a React, para no re-renderizar nada por esto.
  const playerPositionRef = useRef(
    new THREE.Vector3(spawn[0], spawn[1], spawn[2]),
  );

  const hudThrottle = useRef(0);
  const dustRef = useRef<FootstepDustHandle>(null);

  const handleFootstep = (x: number, y: number, z: number) => {
    dustRef.current?.burst(x, y, z);
  };

  const handlePositionChange = (
    position: [number, number, number],
  ) => {
    setPlayerPosition(position);
    playerPositionRef.current.set(
      position[0],
      position[1],
      position[2],
    );

    // El HUD (minimapa/brújula) solo necesita ~10 actualizaciones por
    // segundo; escribir al store en cada frame re-renderizaría React
    // 60 veces por segundo sin ganancia visible.
    const now = performance.now();
    if (now - hudThrottle.current > 100) {
      hudThrottle.current = now;
      usePlayerHudStore
        .getState()
        .setPosition(position[0], position[2]);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#000000',
      }}
    >
      <Canvas
        orthographic
        shadows={tier === 'low' ? true : 'soft'}
        dpr={tier === 'low' ? 1 : [1, 2]}
        camera={{
          // Posición/zoom iniciales — CameraRig los recalcula ya en
          // el primer frame, pero conviene que el valor de arranque
          // esté cerca del real para evitar un "salto" visible.
          position: [
            spawn[0],
            spawn[1] + 0.9 + CAM_OFFSET_Y,
            spawn[2] + CAM_OFFSET_Z,
          ],
          zoom:
            location === 'room'
              ? ROOM_ZOOM_AT_720P
              : WORLD_ZOOM_AT_720P,
          near: -200,
          far: 1000,
        }}
        gl={{
          // El anti-aliasing real lo da el multisampling del
          // EffectComposer de más abajo — pedirlo también aquí hace
          // que WebGL reserve un framebuffer MSAA que el composer
          // nunca llega a usar (renderiza a su propio render target),
          // puro desperdicio de memoria y ancho de banda de GPU.
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
        }}
      >
        {/* El vacío negro solo tiene sentido dentro del cuarto: en el
            mundo abierto la cúpula del cielo (<Sky/>) es la que pinta
            el fondo, y además cambia con la hora. */}
        {location === 'room' && <EtherealVoid color="#000000" />}

        {location === 'room' ? (
          <>
            {/* Fog ampliado: con la cámara alejada para mostrar el
                cuarto completo, las esquinas más lejanas quedan a
                ~18-20 unidades de la cámara. Con el rango anterior
                (12→32) esas esquinas ya se veían visiblemente
                "lavadas" por la niebla. Este rango mantiene el
                cuarto nítido y deja la niebla solo para el vacío de
                fondo. */}
            <fog attach="fog" args={['#060911', 20, 46]} />

            <ambientLight intensity={0.42} color="#dbeafe" />

            <hemisphereLight
              intensity={0.35}
              color="#c7d9ff"
              groundColor="#050811"
            />

            <directionalLight
              position={[12, 22, 10]}
              intensity={1.8}
              color="#fffaf0"
              castShadow
              shadow-mapSize={tier === 'low' ? [1536, 1536] : [4096, 4096]}
              shadow-bias={-0.00012}
              shadow-normalBias={0.02}
              shadow-camera-left={-22}
              shadow-camera-right={22}
              shadow-camera-top={22}
              shadow-camera-bottom={-22}
              shadow-camera-near={0.1}
              shadow-camera-far={70}
            />

            <BreathingLight
              position={[3.2, 3.2, -5.0]}
              intensity={1.35}
              color="#00f0ff"
              speed={1.5}
            />

            <BreathingLight
              position={[-5.4, 2.8, 3.8]}
              intensity={0.95}
              color="#b14bff"
              speed={1.15}
            />

            <DynamicRoomLights />

            <ContactShadows
              position={[0, 0.05, 0]}
              opacity={0.92}
              scale={24}
              blur={1.1}
              far={11}
              resolution={tier === 'low' ? 1024 : 2048}
              color="#000000"
            />
          </>
        ) : null}
        {/* Ojo: NADA de <ContactShadows> en el mundo abierto. Es un
            plano receptor plano a una altura fija; sobre un terreno
            con relieve (alturas de -5 a +11) tapaba media pantalla
            con una mancha negra donde el suelo quedaba por debajo
            del plano. Aquí las sombras las da el directionalLight
            del World. */}

        <Suspense fallback={null}>
          {/* key={location} fuerza un remount limpio de Player al
              cambiar de escena: su posición/animación viven en refs
              imperativos (no en props reactivas), así que sin esto
              se quedaría "pegado" en las coordenadas de la escena
              anterior. */}
          <Player
            key={location}
            onInteract={onInteract}
            onNearbyZoneChange={onNearbyZoneChange}
            initialPosition={spawn}
            onPositionChange={handlePositionChange}
            speed={2.55}
            mode={location}
            onFootstep={handleFootstep}
          />

          {location === 'room' ? (
            <Room onInteract={onInteract} />
          ) : (
            <>
              <World playerPositionRef={playerPositionRef} />
              <FootstepDust ref={dustRef} />
            </>
          )}
        </Suspense>

        <CameraOrbitControls />

        <CameraRig
          playerPosition={playerPosition}
          clampRadius={
            location === 'room'
              ? ROOM_LOOK_AT_CLAMP
              : WORLD_LOOK_AT_CLAMP
          }
          zoomAt720p={
            location === 'room'
              ? ROOM_ZOOM_AT_720P
              : WORLD_ZOOM_AT_720P
          }
          offsetY={
            location === 'room'
              ? CAM_OFFSET_Y
              : WORLD_CAM_OFFSET_Y
          }
          offsetZ={
            location === 'room'
              ? CAM_OFFSET_Z
              : WORLD_CAM_OFFSET_Z
          }
          terrainAware={location === 'world'}
          maxYaw={location === 'room' ? 0.6 : undefined}
          minPitchOffset={location === 'room' ? -0.12 : ORBIT_PITCH_MIN}
        />

        <EffectComposer enableNormalPass={false} multisampling={tier === 'low' ? 0 : 4}>
          <Bloom
            mipmapBlur
            intensity={0.28}
            luminanceThreshold={0.74}
            luminanceSmoothing={0.25}
          />

          <Vignette eskil={false} offset={0.12} darkness={0.46} />

          <ToneMapping />
        </EffectComposer>

        <Preload all />
      </Canvas>
    </div>
  );
};