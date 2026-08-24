import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, OrbitControls, Preload, Sparkles, Stars, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Room } from './Room';

interface SceneProps {
  onInteractDesk: () => void;
}

// Fondo etéreo refinado
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
      {/* Esfera envolvente para el color base */}
      <mesh scale={100}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color="#02040a" side={THREE.BackSide} />
      </mesh>

      {/* Campo estelar profundo */}
      <Stars radius={40} depth={60} count={2000} factor={4} saturation={0.9} fade speed={0.4} />

      {/* Aros energéticos sutiles */}
      <group ref={ringsRef} position={[0, -5, -20]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2 + i * 0.4, 0, 0]} scale={1 + i * 0.2}>
            <torusGeometry args={[25, 0.05, 16, 100]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.1 - i * 0.03} />
          </mesh>
        ))}
      </group>

      {/* Polvo estelar flotante */}
      <Sparkles
        count={150}
        scale={18}
        size={2.5}
        speed={0.2}
        opacity={0.35}
        color="#8ebcff"
        position={[0, 5, 0]}
      />
    </group>
  );
};

// Luz respirante suave
const BreathingLight: React.FC<{
  position: [number, number, number];
  intensity: number;
  color: string;
  speed?: number;
}> = ({ position, intensity, color, speed = 2 }) => {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (lightRef.current) {
      const time = clock.getElapsedTime();
      const pulse = 1 + Math.sin(time * speed) * 0.12;
      lightRef.current.intensity = intensity * pulse;
    }
  });

  return <pointLight ref={lightRef} position={position} intensity={intensity} color={color} distance={9} decay={2} />;
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
          position: [16, 16, 16],
          zoom: 45,
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
        {/* Fondo etéreo */}
        <EtherealVoid />

        {/* Niebla coherente */}
        <fog attach="fog" args={['#02040a', 15, 45]} />

        {/* Iluminación base */}
        <ambientLight intensity={0.35} color="#a6c8ff" />
        <hemisphereLight intensity={0.25} color="#8ebcff" groundColor="#050811" />

        {/* Luz principal */}
        <directionalLight
          position={[11, 20, 9]}
          intensity={1.6}
          color="#fffaf0"
          castShadow
          shadow-mapSize={[4096, 4096]}
          shadow-bias={-0.0001}
          shadow-normalBias={0.02}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-camera-near={0.1}
          shadow-camera-far={60}
        />

        {/* Luces dinámicas */}
        <BreathingLight position={[2.8, 3.1, -4.3]} intensity={1.4} color="#00f0ff" speed={1.5} />
        <BreathingLight position={[-4.2, 2.8, 1.7]} intensity={1.0} color="#b14bff" speed={1.2} />

        {/* Luces de relleno */}
        <pointLight position={[5.0, 3.5, 3.0]} intensity={0.5} color="#4fa8ff" distance={10} decay={2} />
        <pointLight position={[-1.0, 2.25, -4.65]} intensity={0.7} color="#ffaa55" distance={6} decay={2} />

        {/* Sombras de contacto */}
        <ContactShadows
          position={[0, 0.05, 0]}
          opacity={0.8}
          scale={20}
          blur={1.5}
          far={10}
          resolution={2048}
          color="#000000"
        />

        {/* Habitación flotante */}
        <Float speed={1.2} rotationIntensity={0.04} floatIntensity={0.08} floatingRange={[-0.05, 0.05]}>
          <Suspense fallback={null}>
            <Room onInteractDesk={onInteractDesk} />
          </Suspense>
        </Float>

        {/* Cámara */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          enableRotate={false}
          enablePan={false}
          enableZoom
          zoomSpeed={0.6}
          minZoom={35}
          maxZoom={70}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 4}
          target={[0, 1.5, 0]}
        />

        {/* Postprocesado */}
        <EffectComposer enableNormalPass={false} multisampling={4}>
          <Bloom mipmapBlur intensity={0.4} luminanceThreshold={0.7} luminanceSmoothing={0.25} />
          <Vignette eskil={false} offset={0.15} darkness={0.5} />
          <ToneMapping />
        </EffectComposer>

        <Preload all />
      </Canvas>
    </div>
  );
};
