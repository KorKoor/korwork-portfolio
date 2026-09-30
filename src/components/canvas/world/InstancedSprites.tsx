import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  useAtmosphereStore,
  evaluateSky,
  getSunDirection,
} from '../../../world/atmosphere';

/* ============================================================
   SPRITES INSTANCIADOS CON VIENTO
   ============================================================

   Toda la vegetación del mundo (miles de sprites) se dibuja con UNA
   sola llamada de dibujo por atlas, en vez de un mesh por planta.

   Además el billboard y el balanceo del viento se resuelven en el
   VERTEX SHADER:

   - Billboard cilíndrico (solo yaw), igual que el jugador: así los
     sprites nunca se inclinan hacia atrás ni se hunden en el suelo.
   - El viento desplaza más los vértices de arriba que los de abajo
     (peso por uv.y), con una fase distinta por instancia — sin eso
     todo el bosque se movería como un bloque.
   - Cada instancia tiene un tinte propio ligerísimo, que rompe la
     repetición evidente de usar el mismo recorte 300 veces.
============================================================ */

export interface SpriteInstance {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  /** Rect UV normalizado dentro del atlas: [offsetX, offsetY, repeatX, repeatY]. */
  uv: [number, number, number, number];
  /** Cuánto responde al viento (0 = rígido, 1 = hierba). */
  sway: number;
  /** Variación de tono por instancia. */
  tint: [number, number, number];
}

const VERTEX = /* glsl */ `
  attribute vec3 aOffset;
  attribute vec2 aSize;
  attribute vec4 aUvRect;
  attribute float aPhase;
  attribute float aSway;
  attribute vec3 aTint;

  uniform float uTime;
  uniform vec2 uWindDir;
  uniform float uWindStrength;

  varying vec2 vUv;
  varying vec3 vTint;
  varying float vHeight;

  #include <fog_pars_vertex>

  void main() {
    vUv = aUvRect.xy + uv * aUvRect.zw;
    vTint = aTint;
    vHeight = uv.y;

    // Billboard cilíndrico: el "derecha" de la cámara en espacio
    // mundo, aplanado en Y para que el sprite quede siempre vertical.
    vec3 camRight = normalize(vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]));

    vec3 worldPos = aOffset
      + camRight * (position.x * aSize.x)
      + vec3(0.0, position.y * aSize.y, 0.0);

    // Viento: dos armónicos desfasados por instancia. El peso ^1.6
    // hace que la base quede clavada y la copa sea la que ondea.
    float w = pow(uv.y, 1.6) * aSway * uWindStrength;
    float wave =
      sin(uTime * 1.7 + aPhase) * 0.62 +
      sin(uTime * 3.1 + aPhase * 1.7) * 0.22;

    worldPos.xz += uWindDir * wave * w * aSize.y * 0.16;
    // Al doblarse, la planta también pierde un poco de altura.
    worldPos.y -= abs(wave) * w * aSize.y * 0.035;

    vec4 mvPosition = viewMatrix * vec4(worldPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    #include <fog_vertex>
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uSunColor;
  uniform vec3 uAmbient;
  uniform float uSunIntensity;
  uniform float uAmbientIntensity;

  varying vec2 vUv;
  varying vec3 vTint;
  varying float vHeight;

  #include <fog_pars_fragment>

  void main() {
    vec4 tex = texture2D(uMap, vUv);
    if (tex.a < 0.45) discard;

    // Oclusión de contacto barata: la base del sprite se oscurece,
    // lo que "asienta" la planta en el suelo sin coste real.
    float contact = mix(0.55, 1.0, smoothstep(0.0, 0.42, vHeight));

    vec3 light =
      uAmbient * uAmbientIntensity +
      uSunColor * (uSunIntensity * 0.42);

    vec3 color = tex.rgb * vTint * light * contact;

    gl_FragColor = vec4(color, 1.0);
    #include <fog_fragment>
  }
`;

interface InstancedSpritesProps {
  texture: THREE.Texture;
  items: SpriteInstance[];
}

export const InstancedSprites: React.FC<InstancedSpritesProps> = React.memo(
  ({ texture, items }) => {
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const sunDir = useRef(new THREE.Vector3());

    const geometry = useMemo(() => {
      const geo = new THREE.InstancedBufferGeometry();

      // Quad con origen en la BASE (y va de 0 a 1), no en el centro:
      // así colocar una planta es simplemente darle la altura del
      // terreno, sin sumar media altura ni arriesgar que se entierre.
      geo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(
          [-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0],
          3,
        ),
      );
      geo.setAttribute(
        'uv',
        new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2),
      );
      geo.setIndex([0, 1, 2, 0, 2, 3]);

      const n = items.length;
      const offset = new Float32Array(n * 3);
      const size = new Float32Array(n * 2);
      const uvRect = new Float32Array(n * 4);
      const phase = new Float32Array(n);
      const sway = new Float32Array(n);
      const tint = new Float32Array(n * 3);

      items.forEach((it, i) => {
        offset[i * 3] = it.x;
        offset[i * 3 + 1] = it.y;
        offset[i * 3 + 2] = it.z;

        size[i * 2] = it.width;
        size[i * 2 + 1] = it.height;

        uvRect[i * 4] = it.uv[0];
        uvRect[i * 4 + 1] = it.uv[1];
        uvRect[i * 4 + 2] = it.uv[2];
        uvRect[i * 4 + 3] = it.uv[3];

        phase[i] = (i * 12.9898) % (Math.PI * 2);
        sway[i] = it.sway;

        tint[i * 3] = it.tint[0];
        tint[i * 3 + 1] = it.tint[1];
        tint[i * 3 + 2] = it.tint[2];
      });

      geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offset, 3));
      geo.setAttribute('aSize', new THREE.InstancedBufferAttribute(size, 2));
      geo.setAttribute('aUvRect', new THREE.InstancedBufferAttribute(uvRect, 4));
      geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));
      geo.setAttribute('aSway', new THREE.InstancedBufferAttribute(sway, 1));
      geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 3));

      geo.instanceCount = n;
      // El bounding sphere se calcula a mano: la geometría base es un
      // quad de 1x1 y three no sabe nada de los offsets instanciados.
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 400);

      return geo;
    }, [items]);

    const material = useMemo(() => {
      const mat = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          {
            uMap: { value: null },
            uTime: { value: 0 },
            uWindDir: { value: new THREE.Vector2(1, 0) },
            uWindStrength: { value: 0.5 },
            uSunColor: { value: new THREE.Color('#ffffff') },
            uAmbient: { value: new THREE.Color('#8899bb') },
            uSunIntensity: { value: 2.4 },
            uAmbientIntensity: { value: 0.45 },
          },
        ]),
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        fog: true,
        transparent: false,
        side: THREE.DoubleSide,
      });

      mat.uniforms.uMap.value = texture;
      return mat;
    }, [texture]);

    useFrame((state) => {
      const mat = materialRef.current ?? material;
      const atmo = useAtmosphereStore.getState();
      const sky = evaluateSky(atmo.time, atmo.weather, atmo.weatherBlend);

      mat.uniforms.uTime.value = state.clock.elapsedTime;
      mat.uniforms.uWindStrength.value = atmo.windStrength;
      mat.uniforms.uWindDir.value.set(
        Math.cos(atmo.windAngle),
        Math.sin(atmo.windAngle),
      );

      mat.uniforms.uSunColor.value.copy(sky.sun);
      mat.uniforms.uAmbient.value.copy(sky.ambient);
      mat.uniforms.uSunIntensity.value = sky.sunIntensity;
      mat.uniforms.uAmbientIntensity.value = sky.ambientIntensity;

      getSunDirection(atmo.time, sunDir.current);
    });

    return (
      <mesh geometry={geometry} frustumCulled={false} renderOrder={2}>
        <primitive ref={materialRef} object={material} attach="material" />
      </mesh>
    );
  },
);

InstancedSprites.displayName = 'InstancedSprites';

export default InstancedSprites;
