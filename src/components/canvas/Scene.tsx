import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls, Preload } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import * as THREE from 'three';
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
      camera={{
        position: [16, 16, 16],
        zoom: 43,
        near: 0.05,
        far: 1000,
      }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
        logarithmicDepthBuffer: false,
      }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
      }}
    >
      <color attach="background" args={['#050811']} />
      <fog attach="fog" args={['#050811', 28, 62]} />

      {/*
        BASE LIGHT
        Mantiene visibles los colores del pixel-art sin borrar las
        sombras que construyen la altura de los muebles.
      */}
      <ambientLight intensity={0.42} color="#b9d5ff" />
      <hemisphereLight
        intensity={0.26}
        color="#8ebcff"
        groundColor="#080a12"
      />

      {/*
        KEY LIGHT
        Una fuente grande y diagonal hace que cada escalón del piso,
        zócalo, cama y mueble produzca una sombra claramente legible.
      */}
      <directionalLight
        position={[11, 18, 9]}
        intensity={1.65}
        color="#fff3df"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.00008}
        shadow-normalBias={0.025}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={0.1}
        shadow-camera-far={55}
      />

      {/* Luz azul de la zona de escritorio */}
      <pointLight
        position={[2.8, 3.1, -4.3]}
        intensity={1.55}
        color="#38bdf8"
        distance={8}
        decay={2}
      />

      {/* Luz morada de la zona lounge */}
      <pointLight
        position={[-4.2, 2.8, 1.7]}
        intensity={1.05}
        color="#a855f7"
        distance={8}
        decay={2}
      />

      {/* Fill frío */}
      <pointLight
        position={[5.0, 3.5, 3.0]}
        intensity={0.58}
        color="#60a5fa"
        distance={9}
        decay={2}
      />

      {/* Luz cálida de lectura junto a la cama */}
      <pointLight
        position={[-1.0, 2.25, -4.65]}
        intensity={0.78}
        color="#ffb86b"
        distance={5.5}
        decay={2}
      />

      {/*
        Pools de luz bajos: refuerzan el relieve del suelo sin hacer
        que parezca un plano completamente uniforme.
      */}
      <pointLight
        position={[-3.5, 0.65, 2.8]}
        intensity={0.34}
        color="#6d5cff"
        distance={5.5}
        decay={2}
      />
      <pointLight
        position={[4.8, 0.7, -1.0]}
        intensity={0.28}
        color="#2dd4bf"
        distance={5}
        decay={2}
      />

      {/* Sombras de contacto para los escalones y muebles bajos. */}
      <ContactShadows
        position={[0, 0.10, 0]}
        opacity={0.68}
        scale={17}
        blur={2.15}
        far={7}
        resolution={1024}
        frames={1}
      />

      <Suspense fallback={null}>
        <Room onInteractDesk={onInteractDesk} />
      </Suspense>

      {/*
        Perspectiva isométrica fija.
        No orbitamos porque los sprites del atlas están diseñados para
        una orientación concreta. Zoom sí está permitido.
      */}
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enableRotate={false}
        enablePan={false}
        enableZoom
        screenSpacePanning={false}
        zoomSpeed={0.72}
        minZoom={31}
        maxZoom={66}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 4}
        target={[0, 1.05, 0]}
      />

      {/*
        Postprocesado muy contenido: el relieve debe venir primero de
        geometría + sombras, no de Bloom.
      */}
      <EffectComposer enableNormalPass={false} multisampling={4}>
        <Bloom
          mipmapBlur
          intensity={0.32}
          luminanceThreshold={0.88}
          luminanceSmoothing={0.20}
        />
        <Vignette
          eskil={false}
          offset={0.17}
          darkness={0.42}
        />
        <ToneMapping />
      </EffectComposer>

      <Preload all />
    </Canvas>
  </div>
);
