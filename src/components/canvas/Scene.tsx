import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  ContactShadows,
  Stars,
  Preload,
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ToneMapping,
} from '@react-three/postprocessing';
import { Room } from './Room';

interface SceneProps {
  onInteractDesk: () => void;
}

export const Scene: React.FC<SceneProps> = ({ onInteractDesk }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#050811',
      }}
    >
      <Canvas
        orthographic
        shadows="soft"
        dpr={[1, 2]}
        camera={{
          position: [12, 12, 12],
          zoom: 55,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
      >
        {/* =========================================================
            BACKGROUND
        ========================================================= */}

        <color attach="background" args={['#050811']} />

        <Stars
          radius={60}
          depth={50}
          count={900}
          factor={3}
          saturation={0.8}
          fade
          speed={0.7}
        />

        {/* =========================================================
            AMBIENT LIGHTING
        ========================================================= */}

        <ambientLight
          intensity={0.45}
          color="#b9d8ff"
        />

        <hemisphereLight
          intensity={0.35}
          color="#8ec5ff"
          groundColor="#080b16"
        />

        {/* =========================================================
            MAIN LIGHT
        ========================================================= */}

        <directionalLight
          position={[10, 18, 12]}
          intensity={1.8}
          color="#fff8ed"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0002}
          shadow-normalBias={0.02}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
          shadow-camera-near={0.1}
          shadow-camera-far={50}
        />

        {/* =========================================================
            NEON / ROOM LIGHTING
        ========================================================= */}

        {/* Azul — escritorio / fondo */}
        <pointLight
          position={[0, 2.5, -4]}
          intensity={2.8}
          color="#38bdf8"
          distance={7}
          decay={2}
        />

        {/* Morado — lateral */}
        <pointLight
          position={[-3, 2.5, 0]}
          intensity={1.8}
          color="#a855f7"
          distance={6}
          decay={2}
        />

        {/* Luz secundaria fría */}
        <pointLight
          position={[4, 3, 2]}
          intensity={0.8}
          color="#60a5fa"
          distance={7}
          decay={2}
      />

        {/* =========================================================
            CONTACT SHADOWS
        ========================================================= */}

        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.65}
          scale={14}
          blur={2.8}
          far={5}
          resolution={1024}
          frames={1}
        />

        {/* =========================================================
            ROOM
        ========================================================= */}

        <Suspense fallback={null}>
          <Room onInteractDesk={onInteractDesk} />
        </Suspense>

        {/* =========================================================
            ISOMETRIC CAMERA CONTROLS
        ========================================================= */}

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          enableZoom
          screenSpacePanning={false}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          minZoom={35}
          maxZoom={85}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.15}
        />

        {/* =========================================================
            POST PROCESSING
        ========================================================= */}

        <EffectComposer
          enableNormalPass={false}
          multisampling={4}
        >
          <Bloom
            mipmapBlur
            intensity={0.7}
            luminanceThreshold={0.75}
            luminanceSmoothing={0.4}
          />

          <Vignette
            eskil={false}
            offset={0.15}
            darkness={0.65}
          />

          <ToneMapping />
        </EffectComposer>

        {/* =========================================================
            PRELOAD
        ========================================================= */}

        <Preload all />
      </Canvas>
    </div>
  );
};