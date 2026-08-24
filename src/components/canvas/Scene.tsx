import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, OrbitControls, Preload, Sparkles, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Room } from './Room';

interface SceneProps {
  onInteractDesk: () => void;
}

const EtherealVoid: React.FC = () => {
  const ringsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.x = clock.getElapsedTime() * 0.015;
      ringsRef.current.rotation.y = clock.getElapsedTime() * 0.008;
    }
  });

  return (
    <group>
      <mesh scale={100}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color="#02040a" side={THREE.BackSide} />
      </mesh>
      <Stars radius={44} depth={65} count={2200} factor={4} saturation={0.9} fade speed={0.35} />
      <group ref={ringsRef} position={[0, -5, -20]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2 + i * 0.4, 0, 0]} scale={1 + i * 0.2}>
            <torusGeometry args={[25, 0.05, 16, 100]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.1 - i * 0.03} />
          </mesh>
        ))}
      </group>
      <Sparkles count={170} scale={22} size={2.5} speed={0.2} opacity={0.30} color="#8ebcff" position={[0, 5, 0]} />
    </group>
  );
};

const BreathingLight: React.FC<{
  position: [number, number, number];
  intensity: number;
  color: string;
  speed?: number;
}> = ({ position, intensity, color, speed = 2 }) => {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const pulse = 1 + Math.sin(clock.getElapsedTime() * speed) * 0.12;
    lightRef.current.intensity = intensity * pulse;
  });
  return <pointLight ref={lightRef} position={position} intensity={intensity} color={color} distance={10} decay={2} />;
};

export const Scene: React.FC<SceneProps> = ({ onInteractDesk }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#02040a',
        backgroundImage: 'radial-gradient(circle at center, #0a0b1a 0%, #02040a 100%)',
      }}
    >
      <Canvas
        orthographic
        shadows="soft"
        dpr={[1, 2]}
        camera={{
          position: [18, 18, 18],
          zoom: 39,
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
          gl.toneMappingExposure = 1.05;
        }}
      >
        <EtherealVoid />
        <fog attach="fog" args={['#02040a', 18, 52]} />

        <ambientLight intensity={0.35} color="#a6c8ff" />
        <hemisphereLight intensity={0.25} color="#8ebcff" groundColor="#050811" />

        <directionalLight
          position={[12, 22, 10]}
          intensity={1.65}
          color="#fffaf0"
          castShadow
          shadow-mapSize={[4096, 4096]}
          shadow-bias={-0.0001}
          shadow-normalBias={0.02}
          shadow-camera-left={-22}
          shadow-camera-right={22}
          shadow-camera-top={22}
          shadow-camera-bottom={-22}
          shadow-camera-near={0.1}
          shadow-camera-far={70}
        />

        <BreathingLight position={[2.8, 3.4, -4.3]} intensity={1.35} color="#00f0ff" speed={1.5} />
        <BreathingLight position={[-4.5, 3.0, 2.5]} intensity={0.95} color="#b14bff" speed={1.2} />
        <pointLight position={[5.0, 4.0, 3.5]} intensity={0.55} color="#4fa8ff" distance={12} decay={2} />
        <pointLight position={[-2.0, 2.6, -5.0]} intensity={0.65} color="#ffaa55" distance={7} decay={2} />

        <ContactShadows
          position={[0, 0.05, 0]}
          opacity={0.82}
          scale={23}
          blur={1.6}
          far={11}
          resolution={2048}
          color="#000000"
        />

        {/* The room stays physically fixed; only the camera and background provide depth. */}
        <Suspense fallback={null}>
          <Room onInteractDesk={onInteractDesk} />
        </Suspense>

        <OrbitControls
          enableDamping
          dampingFactor={0.06}
          enableRotate={false}
          enablePan={false}
          enableZoom
          zoomSpeed={0.6}
          minZoom={31}
          maxZoom={58}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 4}
          target={[0, 1.35, 0.30]}
        />

        <EffectComposer enableNormalPass={false} multisampling={4}>
          <Bloom mipmapBlur intensity={0.42} luminanceThreshold={0.70} luminanceSmoothing={0.25} />
          <Vignette eskil={false} offset={0.15} darkness={0.50} />
          <ToneMapping />
        </EffectComposer>

        <Preload all />
      </Canvas>
    </div>
  );
};
