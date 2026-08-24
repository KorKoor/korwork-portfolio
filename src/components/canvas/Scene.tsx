import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Preload } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { Room } from './Room';

interface SceneProps {
  onInteractDesk: () => void;
}

export const Scene: React.FC<SceneProps> = ({ onInteractDesk }) => (
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
      camera={{ position: [16, 16, 16], zoom: 43, near: 0.1, far: 1000 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
    >
      <color attach="background" args={['#050811']} />

      <ambientLight intensity={0.52} color="#c7dcff" />
      <hemisphereLight intensity={0.30} color="#9ac7ff" groundColor="#090b14" />

      <directionalLight
        position={[12, 18, 10]}
        intensity={1.45}
        color="#fff4df"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00015}
        shadow-normalBias={0.018}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={0.1}
        shadow-camera-far={60}
      />

      <pointLight
        position={[2.8, 2.6, -4.2]}
        intensity={1.75}
        color="#38bdf8"
        distance={7}
        decay={2}
      />
      <pointLight
        position={[-4.2, 2.6, 1.8]}
        intensity={1.10}
        color="#a855f7"
        distance={7}
        decay={2}
      />
      <pointLight
        position={[5.0, 3.2, 2.8]}
        intensity={0.65}
        color="#60a5fa"
        distance={8}
        decay={2}
      />
      <pointLight
        position={[-0.4, 2.0, -4.4]}
        intensity={0.55}
        color="#ffb86b"
        distance={5}
        decay={2}
      />

      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.55}
        scale={17}
        blur={2.6}
        far={6}
        resolution={1024}
        frames={1}
      />

      <Suspense fallback={null}>
        <Room onInteractDesk={onInteractDesk} />
      </Suspense>

      {/* Fixed isometric view: room-props.png must not orbit with the camera. */}
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enableRotate={false}
        enablePan={false}
        enableZoom
        screenSpacePanning={false}
        zoomSpeed={0.75}
        minZoom={34}
        maxZoom={64}
        target={[0, 0.8, 0]}
      />

      <EffectComposer enableNormalPass={false} multisampling={4}>
        <Bloom
          mipmapBlur
          intensity={0.38}
          luminanceThreshold={0.84}
          luminanceSmoothing={0.24}
        />
        <Vignette eskil={false} offset={0.18} darkness={0.46} />
        <ToneMapping />
      </EffectComposer>

      <Preload all />
    </Canvas>
  </div>
);
