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
      ringsRef.current.rotation.x = clock.getElapsedTime() * 0.012;
      ringsRef.current.rotation.y = clock.getElapsedTime() * 0.006;
    }
  });

  return (
    <group>
      <mesh scale={100}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color="#02040a" side={THREE.BackSide} />
      </mesh>
      <Stars radius={48} depth={70} count={1800} factor={3.5} saturation={0.9} fade speed={0.35} />
      <group ref={ringsRef} position={[0, -6, -24]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2 + i * 0.35, 0, 0]} scale={1 + i * 0.18}>
            <torusGeometry args={[26, 0.045, 16, 100]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.08 - i * 0.02} />
          </mesh>
        ))}
      </group>
      <Sparkles count={130} scale={20} size={2.3} speed={0.18} opacity={0.28} color="#8ebcff" position={[0, 5, 0]} />
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
    const pulse = 1 + Math.sin(clock.getElapsedTime() * speed) * 0.10;
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
          position: [20, 20, 20],
          zoom: 36,
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
        <fog attach="fog" args={['#02040a', 17, 48]} />

        <ambientLight intensity={0.35} color="#a6c8ff" />
        <hemisphereLight intensity={0.24} color="#8ebcff" groundColor="#050811" />

        <directionalLight
          position={[12, 22, 10]}
          intensity={1.7}
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

        <BreathingLight position={[3.2, 3.2, -5.0]} intensity={1.35} color="#00f0ff" speed={1.5} />
        <BreathingLight position={[-5.4, 2.8, 3.8]} intensity={0.95} color="#b14bff" speed={1.15} />
        <pointLight position={[5.8, 3.6, 4.2]} intensity={0.55} color="#4fa8ff" distance={11} decay={2} />
        <pointLight position={[-1.4, 2.8, -5.4]} intensity={0.70} color="#ffaa55" distance={7} decay={2} />

        <ContactShadows
          position={[0, 0.05, 0]}
          opacity={0.78}
          scale={22}
          blur={1.65}
          far={11}
          resolution={2048}
          color="#000000"
        />

        <Suspense fallback={null}>
          <Room onInteractDesk={onInteractDesk} />
        </Suspense>

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          enableRotate={false}
          enablePan={false}
          enableZoom
          zoomSpeed={0.6}
          minZoom={29}
          maxZoom={52}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 4}
          target={[0, 0.65, 0.45]}
        />

        <EffectComposer enableNormalPass={false} multisampling={4}>
          <Bloom mipmapBlur intensity={0.40} luminanceThreshold={0.70} luminanceSmoothing={0.25} />
          <Vignette eskil={false} offset={0.15} darkness={0.50} />
          <ToneMapping />
        </EffectComposer>

        <Preload all />
      </Canvas>
    </div>
  );
};
