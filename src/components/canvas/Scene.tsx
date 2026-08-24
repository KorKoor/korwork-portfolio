import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Preload } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Player } from './Player';
import { Room } from './Room';

/* =========================================================
   INTERFAZ PRINCIPAL DE LA ESCENA
   ========================================================= */

interface SceneProps {
  onInteractDesk: () => void;
}

/* =========================================================
   ETHEREAL VOID
   ========================================================= */

const EtherealVoid: React.FC = () => {
  return (
    <group>
      <mesh scale={120}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color="#000000" side={THREE.BackSide} />
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
   ángulo bastante cenital (≈57° de elevación), al estilo de un
   juego 2.5D top-down: ya NO intenta encuadrar el cuarto
   completo, sino una porción cercana alrededor del personaje.
   ========================================================= */

// Ángulo del rig: y+7.4, z+4.8 ⇒ ≈57° de elevación (más cenital
// que el rig anterior, que era ≈38.5°).
const CAM_OFFSET_Y = 7.4;
const CAM_OFFSET_Z = 4.8;

// Zoom base de la cámara cercana (en "unidades de zoom por cada
// 720px de alto de viewport"), calibrado para encuadrar al jugador
// y su entorno inmediato.
const CLOSE_ZOOM_AT_720P = 130;

// Límite para que la cámara no se pegue tanto a las paredes que
// termine mostrando el vacío de fondo más allá del cuarto.
const LOOK_AT_CLAMP = 6.4;

const CameraRig: React.FC<{
  playerPosition: [number, number, number];
}> = ({ playerPosition }) => {
  const { camera, size } = useThree();

  useFrame((_, delta) => {
    // Cámara cercana estilo 2.5D: sigue al jugador directamente en
    // vez de mantener el cuarto completo en cuadro.
    const lookAtTarget = new THREE.Vector3(
      THREE.MathUtils.clamp(playerPosition[0], -LOOK_AT_CLAMP, LOOK_AT_CLAMP),
      playerPosition[1] + 0.9,
      THREE.MathUtils.clamp(playerPosition[2], -LOOK_AT_CLAMP, LOOK_AT_CLAMP),
    );

    const desiredPosition = new THREE.Vector3(
      lookAtTarget.x,
      lookAtTarget.y + CAM_OFFSET_Y,
      lookAtTarget.z + CAM_OFFSET_Z,
    );

    camera.position.lerp(desiredPosition, 1 - Math.exp(-delta * 3.2));
    camera.lookAt(lookAtTarget);

    if (camera instanceof THREE.OrthographicCamera) {
      // Zoom fijo (relativo al alto del viewport) para que el
      // encuadre cercano se vea consistente en cualquier tamaño de
      // pantalla, sin recalcular para mostrar el cuarto entero.
      const targetZoom = (size.height / 720) * CLOSE_ZOOM_AT_720P;

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

export const Scene: React.FC<SceneProps> = ({ onInteractDesk }) => {
  const [playerPosition, setPlayerPosition] = useState<
    [number, number, number]
  >([0, 0.115, 2.7]);

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
        shadows="soft"
        dpr={[1, 2]}
        camera={{
          // Posición/zoom iniciales — CameraRig los recalcula ya en
          // el primer frame, pero conviene que el valor de arranque
          // esté cerca del real para evitar un "salto" visible.
          position: [0, 0.115 + 0.9 + CAM_OFFSET_Y, 2.7 + CAM_OFFSET_Z],
          zoom: CLOSE_ZOOM_AT_720P,
          near: 0.05,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
        }}
      >
        <EtherealVoid />

        {/* Fog ampliado: con la cámara alejada para mostrar el cuarto
            completo, las esquinas más lejanas quedan a ~18-20
            unidades de la cámara. Con el rango anterior (12→32)
            esas esquinas ya se veían visiblemente "lavadas" por la
            niebla. Este rango mantiene el cuarto nítido y deja la
            niebla solo para el vacío de fondo. */}
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
          shadow-mapSize={[4096, 4096]}
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
          resolution={2048}
          color="#000000"
        />

        <Suspense fallback={null}>
          {/* Player vive SOLO aquí. Antes también se renderizaba
              dentro de <Room>, lo que duplicaba el personaje en
              pantalla — ya se quitó de Room.tsx. */}
          <Player
            onInteractDesk={onInteractDesk}
            initialPosition={[0, 0.115, 2.7]}
            deskPosition={[3.25, -4.9]}
            onPositionChange={setPlayerPosition}
            speed={2.55}
          />

          <Room onInteractDesk={onInteractDesk} />
        </Suspense>

        <CameraRig playerPosition={playerPosition} />

        <EffectComposer enableNormalPass={false} multisampling={4}>
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