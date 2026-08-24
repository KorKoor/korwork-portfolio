import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  ContactShadows,
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
        {/* =====================================================
            WORLD BACKGROUND
        ===================================================== */}

        <color
          attach="background"
          args={['#050811']}
        />

        {/* =====================================================
            BASE LIGHT
            Suave para no destruir los colores del pixel-art.
        ===================================================== */}

        <ambientLight
          intensity={0.55}
          color="#c7dcff"
        />

        <hemisphereLight
          intensity={0.28}
          color="#9ac7ff"
          groundColor="#090b14"
        />

        {/* =====================================================
            MAIN MOON / WINDOW LIGHT
        ===================================================== */}

        <directionalLight
          position={[8, 16, 10]}
          intensity={1.35}
          color="#fff4df"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.00015}
          shadow-normalBias={0.015}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
          shadow-camera-near={0.1}
          shadow-camera-far={50}
        />

        {/* =====================================================
            CYAN DESK LIGHT
        ===================================================== */}

        <pointLight
          position={[0, 2.8, -3.8]}
          intensity={1.9}
          color="#38bdf8"
          distance={6}
          decay={2}
        />

        {/* =====================================================
            PURPLE SIDE LIGHT
        ===================================================== */}

        <pointLight
          position={[-3.5, 2.5, -0.5]}
          intensity={1.15}
          color="#a855f7"
          distance={6}
          decay={2}
        />

        {/* =====================================================
            SOFT BLUE FILL
        ===================================================== */}

        <pointLight
          position={[4, 3, 2]}
          intensity={0.55}
          color="#60a5fa"
          distance={7}
          decay={2}
        />

        {/* =====================================================
            WARM ROOM LIGHT
        ===================================================== */}

        <pointLight
          position={[-2.5, 2, -2.5]}
          intensity={0.45}
          color="#ffb86b"
          distance={5}
          decay={2}
        />

        {/* =====================================================
            CONTACT SHADOWS
        ===================================================== */}

        <ContactShadows
          position={[0, 0.015, 0]}
          opacity={0.5}
          scale={14}
          blur={2.4}
          far={5}
          resolution={1024}
          frames={1}
        />

        {/* =====================================================
            ROOM
        ===================================================== */}

        <Suspense fallback={null}>
          <Room
            onInteractDesk={onInteractDesk}
          />
        </Suspense>

        {/* =====================================================
            CONTROLLED ISOMETRIC CAMERA
        ===================================================== */}

        <OrbitControls
          enableDamping
          dampingFactor={0.08}

          /*
           * IMPORTANT:
           *
           * The room uses pixel-art sprites drawn from one
           * specific perspective.
           *
           * Therefore the camera must NOT rotate around them.
           */
          enableRotate={false}

          enablePan={false}
          enableZoom

          screenSpacePanning={false}

          zoomSpeed={0.75}

          /*
           * Keeps the room framed instead of allowing the
           * camera to become absurdly close/far.
           */
          minZoom={42}
          maxZoom={78}

          /*
           * Keep the camera centered slightly above the
           * actual origin of the room.
           */
          target={[0, 0.7, 0]}
        />

        {/* =====================================================
            POST PROCESSING
        ===================================================== */}

        <EffectComposer
          enableNormalPass={false}
          multisampling={4}
        >
          {/* Very subtle bloom.
              We don't want to blur the pixel-art. */}
          <Bloom
            mipmapBlur
            intensity={0.42}
            luminanceThreshold={0.82}
            luminanceSmoothing={0.25}
          />

          {/* Cinematic edges without crushing the room. */}
          <Vignette
            eskil={false}
            offset={0.18}
            darkness={0.48}
          />

          <ToneMapping />
        </EffectComposer>

        {/* =====================================================
            PRELOAD
        ===================================================== */}

        <Preload all />
      </Canvas>
    </div>
  );
};