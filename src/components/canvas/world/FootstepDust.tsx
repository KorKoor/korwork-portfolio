import React, { useImperativeHandle, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ============================================================
   POLVO DE PISADAS
   ============================================================
   Pool de partículas de tamaño fijo (nada de crear/destruir objetos
   en caliente): cada pisada "revive" unas cuantas partículas muertas
   y las lanza hacia arriba y hacia fuera. Cuando su vida llega a 0
   vuelven al pool. Coste constante, cero basura para el GC.
============================================================ */

const POOL = 120;

const PER_STEP = 5;

export interface FootstepDustHandle {
  burst: (x: number, y: number, z: number, strength?: number) => void;
}

export const FootstepDust = React.forwardRef<FootstepDustHandle>((_, ref) => {
  const pointsRef = useRef<THREE.Points>(null);

  const state = useMemo(
    () => ({
      pos: new Float32Array(POOL * 3),
      vel: new Float32Array(POOL * 3),
      life: new Float32Array(POOL),
      maxLife: new Float32Array(POOL),
      size: new Float32Array(POOL),
      cursor: 0,
    }),
    [],
  );

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(state.pos, 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(POOL), 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(state.size, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    return geo;
  }, [state]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color('#cbbfa4') },
          uPixelRatio: { value: 1 },
        },
        vertexShader: /* glsl */ `
          attribute float aAlpha;
          attribute float aSize;
          uniform float uPixelRatio;
          varying float vAlpha;
          void main() {
            vAlpha = aAlpha;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = aSize * uPixelRatio * (26.0 / max(1.0, -mv.z));
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            float soft = 1.0 - smoothstep(0.1, 0.5, d);
            float a = vAlpha * soft * 0.55;
            if (a < 0.01) discard;
            gl_FragColor = vec4(uColor, a);
          }
        `,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      burst: (x, y, z, strength = 1) => {
        for (let k = 0; k < PER_STEP; k += 1) {
          const i = state.cursor;
          state.cursor = (state.cursor + 1) % POOL;

          const a = Math.random() * Math.PI * 2;
          const sp = (0.25 + Math.random() * 0.5) * strength;

          state.pos[i * 3] = x + Math.cos(a) * 0.08;
          state.pos[i * 3 + 1] = y + 0.04;
          state.pos[i * 3 + 2] = z + Math.sin(a) * 0.08;

          state.vel[i * 3] = Math.cos(a) * sp;
          state.vel[i * 3 + 1] = 0.35 + Math.random() * 0.4;
          state.vel[i * 3 + 2] = Math.sin(a) * sp;

          state.maxLife[i] = 0.45 + Math.random() * 0.35;
          state.life[i] = state.maxLife[i];
          state.size[i] = 2.2 + Math.random() * 2.6;
        }
      },
    }),
    [state],
  );

  useFrame((frame, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30);
    const geo = pointsRef.current?.geometry;
    if (!geo) return;

    const alphaAttr = geo.attributes.aAlpha as THREE.BufferAttribute;
    const alphas = alphaAttr.array as Float32Array;

    for (let i = 0; i < POOL; i += 1) {
      if (state.life[i] <= 0) {
        alphas[i] = 0;
        continue;
      }

      state.life[i] -= delta;

      // Gravedad suave + fricción del aire: el polvo sube, frena y cae.
      state.vel[i * 3 + 1] -= 1.4 * delta;
      state.vel[i * 3] *= 1 - 2.2 * delta;
      state.vel[i * 3 + 2] *= 1 - 2.2 * delta;

      state.pos[i * 3] += state.vel[i * 3] * delta;
      state.pos[i * 3 + 1] += state.vel[i * 3 + 1] * delta;
      state.pos[i * 3 + 2] += state.vel[i * 3 + 2] * delta;

      const t = Math.max(0, state.life[i] / state.maxLife[i]);
      alphas[i] = t * t;
    }

    (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    alphaAttr.needsUpdate = true;
    (geo.attributes.aSize as THREE.BufferAttribute).needsUpdate = true;

    material.uniforms.uPixelRatio.value = frame.gl.getPixelRatio();
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false} renderOrder={15}>
      <primitive object={material} attach="material" />
    </points>
  );
});

FootstepDust.displayName = 'FootstepDust';

export default FootstepDust;
