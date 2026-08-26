import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';
import { useControlsStore } from '../../store/controls';
import { useVitalsStore } from '../../store/vitals';
import { getActiveSpeedMultiplier, useVehicleStore } from '../../store/vehicle';
import {
  getWorldTerrainHeight,
  getWorldSlope,
  WORLD_HALF_SIZE,
  MAX_CLIMB_SLOPE,
  WATER_LEVEL,
  WATERFALL_POS,
} from '../../world/terrain';
import { audio } from '../../audio/AudioEngine';
import { Glow } from './world/NightVFX';
import { hitsStaticObstacle } from '../../world/collision';

type Direction = 'down' | 'up' | 'left' | 'right';

export type ContentZoneId = 'projects' | 'skills' | 'about' | 'contact';

export type RoomZoneId = ContentZoneId | 'exit-house';

export type WorldZoneId =
  | 'enter-house'
  | 'sit-bench'
  | 'ride-bike'
  | 'ride-skateboard'
  | 'enter-cave'
  | 'fish-dock'
  | 'cherry-lookout'
  | 'flower-garden'
  | 'greet-fisherman'
  | 'greet-hiker'
  | 'pet-dog'
  | 'waterfall-cove'
  // 'sleep' vive en el cuarto (junto a la cama), pero se despacha por
  // el mismo manejador genérico que el resto de estas zonas — no es
  // 'exit-house' ni una zona de contenido, así que cae aquí por tipo.
  | 'sleep';

export type InteractionZoneId = RoomZoneId | WorldZoneId;

export type PlayerMode = 'room' | 'world';

interface Interactable {
  id: InteractionZoneId;
  position: [number, number];
  radius: number;
}

// Las 4 zonas interactuables del cuarto — ancladas a las mismas
// posiciones de los muebles en Room.tsx (escritorio, librero, sofá,
// armario). Un solo callback (`onInteract`) recibe el id de la zona;
// App.tsx decide qué contenido mostrar.
const ROOM_INTERACTION_ZONES: Interactable[] = [
  // El escritorio (4.2x2.2) es grande y la silla está en z=-3.12,
  // lejos del centro real del mueble (z=-4.9) — el punto de la zona
  // se corre hacia el lado de la silla para que "sentarse a
  // trabajar" sí quede dentro del radio.
  { id: 'projects', position: [3.25, -3.9], radius: 1.6 },
  { id: 'skills', position: [6.9, -6.6], radius: 1.4 },
  { id: 'about', position: [-5.16, 4.6], radius: 1.7 },
  { id: 'contact', position: [-6.8, -5.9], radius: 1.4 },

  // Puerta de salida al mundo exterior — pared frontal, del lado del
  // comedor (frente al front-wall-shelf, lejos de todo lo demás).
  { id: 'exit-house', position: [0, 6.6], radius: 1.9 },

  // Centro del collider 'bed' de abajo — dormir restaura energía/salud.
  { id: 'sleep', position: [-4.42, -3.885], radius: 1.5 },
];

// Zonas interactuables del mundo exterior — mismas coordenadas que
// los props colocados en EnvironmentDecor.tsx.
const WORLD_INTERACTION_ZONES: Interactable[] = [
  { id: 'enter-house', position: [0, 4.6], radius: 2.4 },
  { id: 'sit-bench', position: [8.6, 9.4], radius: 1.8 },
  { id: 'ride-bike', position: [-6.8, 7.0], radius: 1.6 },
  { id: 'ride-skateboard', position: [-9.0, 7.4], radius: 1.6 },
  { id: 'enter-cave', position: [-24, 10], radius: 3.0 },
  // Punta del muelle, sobre el agua.
  { id: 'fish-dock', position: [17.5, 16.5], radius: 2.6 },
  { id: 'cherry-lookout', position: [-16.4, -12.5], radius: 2.6 },
  { id: 'flower-garden', position: [16.5, -7.0], radius: 3.0 },
  // Mismas coordenadas "home" que sus NPCs en NPCs.tsx.
  { id: 'greet-fisherman', position: [15.5, 12.0], radius: 2.0 },
  { id: 'greet-hiker', position: [7.2, 3.2], radius: 2.2 },

  // Mismas coordenadas "home" que los perritos en Wildlife.tsx —
  // acariciarlos donde de verdad suelen andar.
  { id: 'pet-dog', position: [5, 10], radius: 2.8 },
  { id: 'pet-dog', position: [12, 4], radius: 2.6 },
  { id: 'pet-dog', position: [-4, 11], radius: 2.6 },

  // Poza al pie de la cascada — un poco delante del centro del grupo
  // de Waterfall.tsx (que está pegado a la pared), para pararse en la
  // orilla real.
  { id: 'waterfall-cove', position: [WATERFALL_POS[0], WATERFALL_POS[1] + 1.2], radius: 2.6 },
];

interface RoomCollider {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  padding?: number;
}

interface PlayerProps {
  onInteract: (zoneId: InteractionZoneId) => void;
  onNearbyZoneChange?: (zoneId: InteractionZoneId | null) => void;
  initialPosition?: [number, number, number];
  speed?: number;
  showGroundShadow?: boolean;
  castShadow?: boolean;
  onPositionChange?: (position: [number, number, number]) => void;
  /** 'room' usa los colliders/pisos del cuarto; 'world' usa el terreno con relieve y sus propias zonas. */
  mode?: PlayerMode;
  /** Se dispara en cada pisada — lo usa el sistema de polvo. */
  onFootstep?: (x: number, y: number, z: number) => void;
}

// Todo el personaje (idle, caminar/correr, sentado armando el cubo,
// globos de pensamiento) sale de UNA sola hoja nueva, para que se
// vea homogéneo — mismo outfit, mismo pixel-scale, mismo estilo 2.5D
// en todos los estados. Antes el idle/thought-bubble usaba esta hoja
// pero caminar/correr seguían con la hoja vieja (otro personaje,
// suéter gris) — de ahí la inconsistencia.
const ACTIONS_SHEET = '/assets/Player-Actions/actions/player-action.png';

interface SpriteCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

const IDLE_FRONT_CROPS: SpriteCrop[] = [
  { x: 36, y: 11, width: 100, height: 211 },
];

const IDLE_BACK_CROPS: SpriteCrop[] = [
  { x: 356, y: 11, width: 101, height: 211 },
];

// Dos poses casi iguales alternadas lento — sin esto el idle de
// lado se ve congelado.
const IDLE_SIDE_CROPS: SpriteCrop[] = [
  { x: 151, y: 12, width: 95, height: 213 },
  { x: 258, y: 15, width: 88, height: 207 },
];

// La hoja no trae un ciclo de caminata de frente/espalda (solo la
// pose parada), así que de frente/espalda el "caminar" se apoya
// sobre todo en el bobbing procedural de abajo. De lado sí hay un
// ciclo de carrera con 4 frames reales — se usa tal cual para
// izquierda/derecha (espejado a la izquierda).
const RUN_SIDE_CROPS: SpriteCrop[] = [
  { x: 586, y: 9, width: 139, height: 207 },
  { x: 720, y: 9, width: 128, height: 202 },
  { x: 848, y: 9, width: 127, height: 204 },
  { x: 981, y: 10, width: 133, height: 202 },
];

// Globo de pensamiento que aparece cuando el jugador lleva un rato
// parado (son puros globitos flotantes, sin personaje).
const IDLE_THOUGHT_CROPS: SpriteCrop[] = [
  { x: 113, y: 609, width: 77, height: 70 }, // "..."
  { x: 257, y: 591, width: 69, height: 77 }, // idea
  { x: 369, y: 592, width: 67, height: 76 }, // código (Python)
  { x: 490, y: 594, width: 67, height: 74 }, // café
  { x: 725, y: 592, width: 71, height: 75 }, // viajar
  { x: 831, y: 594, width: 77, height: 78 }, // montañas
];

// Después de un rato más largo parado, el personaje se sienta a
// armar el cubo de Rubik y vuelve a pararse — el "TODO" que se pidió
// integrar como parte del idle.
const ACTIVITY_RUBIK_CROPS: SpriteCrop[] = [
  { x: 33, y: 235, width: 88, height: 196 }, // se sienta
  { x: 17, y: 433, width: 116, height: 152 },
  { x: 138, y: 433, width: 108, height: 152 },
  { x: 254, y: 435, width: 102, height: 151 },
  { x: 369, y: 438, width: 100, height: 148 },
  { x: 487, y: 434, width: 121, height: 152 }, // ¡resuelto!
  { x: 33, y: 235, width: 88, height: 196 }, // antes de pararse
];

// Hoja de acciones nueva (la que trae sentarse, dormir, bici, acariciar
// perros, etc.) — se usa ADEMÁS de player-action.png, no en vez de:
// idle/caminar/correr ya se ven bien con la hoja original, así que
// esta segunda hoja solo aporta las poses de contexto que la primera
// no tenía. Coordenadas obtenidas midiendo el canal alfa real del PNG
// (no a ojo) con un script de segmentación — ver notas de la sesión.
const BETTER_ACTIONS_SHEET = '/assets/Player-Actions/actions/Better-Actions.png';

// Segunda pose de espalda (alternada con IDLE_BACK_CROPS) — sin esto
// de espaldas se veía tan estático como antes de tener la hoja nueva.
const BACKPACK_ALT_CROPS: SpriteCrop[] = [
  { x: 19, y: 420, width: 39, height: 82 },
];

// Pose de "pensando" con el cuerpo agachado — reemplaza la pose idle
// normal mientras flota el globo de pensamiento, para que se lea como
// el personaje pensando y no solo un globo flotando sobre alguien
// parado.
const THINK_BODY_CROPS: SpriteCrop[] = [
  { x: 1221, y: 352, width: 49, height: 83 },
];

// Sentado con la laptop — la actividad de idle largo en el mundo
// exterior (el cubo de Rubik es del cuarto; afuera tiene más sentido
// que se siente a programar un rato).
const SIT_CROPS: SpriteCrop[] = [
  { x: 472, y: 337, width: 78, height: 76 },
];

// Acariciando al perrito — se dispara al interactuar cerca de una
// zona 'pet-dog' (ver WORLD_INTERACTION_ZONES).
const PETDOG_CROPS: SpriteCrop[] = [
  { x: 732, y: 417, width: 92, height: 84 },
];

// Durmiendo — se dispara al interactuar con la cama (zona 'sleep',
// solo en modo 'room').
const SLEEP_CROPS: SpriteCrop[] = [
  { x: 447, y: 525, width: 93, height: 109 },
];

// Pedaleando — reemplaza el ciclo de caminar/correr mientras el boost
// de useVehicleStore sea el de la bici (antes el "subirse a la bici"
// solo cambiaba la velocidad, sin ningún cambio visual).
const BIKE_CROPS: SpriteCrop[] = [
  { x: 918, y: 512, width: 80, height: 118 },
];

// Iconitos de emoción — se muestran en vez del globo de pensamiento
// mientras dura una pose sostenida (dormir, acariciar perro).
const EMOTE_BANG_CROP: SpriteCrop = { x: 306, y: 842, width: 65, height: 65 };
const EMOTE_HEART_CROP: SpriteCrop = { x: 935, y: 839, width: 35, height: 24 };
const EMOTE_ZZZ_CROP: SpriteCrop = { x: 853, y: 845, width: 46, height: 34 };

// Ciclo real de caminar de frente — 8 frames. Antes de frente/espalda
// solo existía la pose parada de player-action.png y el "caminar" era
// puro bobbing vertical (por eso se veía tieso). Coordenadas medidas
// una por una (las columnas de esta fila SE TOCAN entre sí en la hoja
// fuente — un recorte ancho de más agarraba el hombro del vecino).
const WALK_DOWN_CROPS: SpriteCrop[] = [
  { x: 383, y: 18, width: 40, height: 76 },
  { x: 428, y: 18, width: 40, height: 73 },
  { x: 477, y: 27, width: 32, height: 66 },
  { x: 523, y: 25, width: 34, height: 68 },
  { x: 570, y: 25, width: 34, height: 68 },
  { x: 613, y: 24, width: 38, height: 67 },
  { x: 660, y: 24, width: 38, height: 69 },
  { x: 706, y: 26, width: 37, height: 66 },
];

// Ciclo de caminar de espaldas — solo 3 frames limpios (el resto de la
// fila se solapa igual que en la de frente), pero 3 ya es muchísimo
// mejor que cero.
const WALK_UP_CROPS: SpriteCrop[] = [
  { x: 378, y: 167, width: 33, height: 65 },
  { x: 425, y: 167, width: 34, height: 65 },
  { x: 473, y: 167, width: 35, height: 66 },
];

const DEFAULT_SPEED = 2.55;

const SPRITE_HEIGHT = 1.6;

// Todos los recortes vienen del mismo personaje a la misma escala
// de píxeles en la hoja fuente, así que un solo factor "px por
// unidad de mundo" — calibrado con la pose de pie de frente — basta
// para que CUALQUIER recorte (sentado, corriendo, más chaparro,
// más ancho) se vea del tamaño correcto entre sí. Antes solo el
// ancho se ajustaba por aspect ratio y el alto quedaba fijo, lo que
// estiraba feo las poses sentadas (más bajas/anchas que de pie).
const REFERENCE_SPRITE_PIXELS =
  IDLE_FRONT_CROPS[0].height;

const WORLD_UNITS_PER_PIXEL =
  SPRITE_HEIGHT / REFERENCE_SPRITE_PIXELS;

// player-action.png y Better-Actions.png NO comparten escala de
// píxeles: la hoja nueva dibuja al personaje mucho más chico en
// términos absolutos (para caber 20 poses por sección), así que
// usar WORLD_UNITS_PER_PIXEL con sus recortes encogía al personaje a
// una fracción de su tamaño real ("se hace diminuto"). Referencia
// propia: una pose de pie de esa misma hoja (IDLE, de frente, 71px
// de alto medidos).
const BETTER_ACTIONS_REFERENCE_PIXELS = 71;

const BETTER_ACTIONS_UNITS_PER_PIXEL =
  SPRITE_HEIGHT / BETTER_ACTIONS_REFERENCE_PIXELS;

const PLAYER_RADIUS = 0.30;

const FRAME_DURATION_IDLE = 0.50;

const FRAME_DURATION_WALK_SIDE = 0.10;

const FRAME_DURATION_WALK_DOWN = 0.085;

const FRAME_DURATION_WALK_UP = 0.16;

const SHADOW_Y_OFFSET = 0.015;

// "Juice" procedural: de frente/espalda la hoja nueva solo trae UNA
// pose parada (no hay ciclo de piernas), así que este bobbing
// vertical es el que realmente vende el movimiento ahí — funciona
// igual en las 4 direcciones, incluidas las diagonales. De lado sí
// hay un ciclo de carrera real (RUN_SIDE_CROPS) y el bob se nota
// menos, pero se deja parejo para no romper el ritmo al girar.
const WALK_BOB_AMPLITUDE = 0.045;

const WALK_BOB_FREQUENCY = 9.5;

const IDLE_BREATH_AMPLITUDE = 0.012;

const IDLE_BREATH_FREQUENCY = 2.1;

// Cuánto tarda en aparecer el globo de pensamiento tras dejar de
// moverse, cuánto dura cada globito en pantalla, y qué tan rápido
// hace fade in/out entre uno y otro.
const IDLE_THOUGHT_DELAY = 3.2;

const IDLE_THOUGHT_CYCLE = 2.6;

const IDLE_THOUGHT_FADE = 0.4;

// Tras este rato SIN moverse (contado independiente del timer de los
// globitos), el personaje se sienta a armar el cubo de Rubik. Cada
// frame de la secuencia dura ACTIVITY_FRAME_DURATION; al llegar al
// último vuelve a pararse solo. Cualquier tecla de movimiento
// cancela la actividad al instante.
const ACTIVITY_DELAY = 9;

const ACTIVITY_FRAME_DURATION = 0.85;

const INTERACTION_PULSE_DURATION = 0.72;

// Cuánto dura la pose sostenida al dormir/acariciar un perro tras
// presionar E cerca de la zona — durante esta ventana el frame normal
// de idle/caminar queda reemplazado por completo.
const SLEEP_POSE_DURATION = 3.4;

const PETDOG_POSE_DURATION = 2.4;

const LOWER_FLOOR_Y = 0.115;

const UPPER_FLOOR_Y = 0.565;

const STAIR_MIN_Z = 0.55;

const STAIR_MAX_Z = 3.05;

const STAIR_MIN_X = -1.28;

const STAIR_MAX_X = 1.28;

const HEIGHT_LERP_SPEED = 7;

function getTargetHeight(
  x: number,
  z: number,
): number {
  if (
    x >= STAIR_MIN_X &&
    x <= STAIR_MAX_X &&
    z >= STAIR_MIN_Z &&
    z <= STAIR_MAX_Z
  ) {
    const progress = THREE.MathUtils.clamp(
      (z - STAIR_MIN_Z) /
        (STAIR_MAX_Z - STAIR_MIN_Z),
      0,
      1,
    );

    return THREE.MathUtils.lerp(
      UPPER_FLOOR_Y,
      LOWER_FLOOR_Y,
      progress,
    );
  }

  if (
    z <= 0.42 &&
    x >= -7.45 &&
    x <= 7.45
  ) {
    return UPPER_FLOOR_Y;
  }

  return LOWER_FLOOR_Y;
}

const ROOM_COLLIDERS: RoomCollider[] = [
  {
    id: 'back-wall',
    minX: -8.08,
    maxX: 8.08,
    minZ: -7.34,
    maxZ: -6.70,
  },

  {
    id: 'left-wall',
    minX: -7.40,
    maxX: -6.70,
    minZ: -6.70,
    maxZ: 6.70,
  },

  {
    id: 'right-boundary',
    minX: 7.30,
    maxX: 8.08,
    minZ: -6.70,
    maxZ: 6.70,
  },

  {
    id: 'front-wall',
    minX: -7.40,
    maxX: 7.30,
    minZ: 6.70,
    maxZ: 7.30,
  },

  // Upper/lower transition.
  // There is an opening only where the stairs are.
  {
    id: 'upper-edge-left',
    minX: -7.35,
    maxX: -1.42,
    minZ: 0.28,
    maxZ: 0.62,
    padding: 0.03,
  },

  {
    id: 'upper-edge-right',
    minX: 1.42,
    maxX: 7.35,
    minZ: 0.28,
    maxZ: 0.62,
    padding: 0.03,
  },

  // Bedroom.
  {
    id: 'bed',
    minX: -6.62,
    maxX: -2.22,
    minZ: -5.72,
    maxZ: -2.05,
    padding: 0.10,
  },

  {
    id: 'bedside-table',
    minX: -1.55,
    maxX: -0.38,
    minZ: -6.30,
    maxZ: -5.30,
    padding: 0.06,
  },

  // Office.
  {
    id: 'desk',
    minX: 0.18,
    maxX: 6.34,
    minZ: -5.70,
    maxZ: -4.02,
    padding: 0.10,
  },

  {
    id: 'desk-chair',
    minX: 2.55,
    maxX: 4.10,
    minZ: -3.82,
    maxZ: -2.42,
    padding: 0.08,
  },

  // Lower-left lounge.
  {
    id: 'sofa',
    minX: -7.20,
    maxX: -3.12,
    minZ: 3.42,
    maxZ: 5.25,
    padding: 0.10,
  },

  {
    id: 'coffee-table',
    minX: -3.36,
    maxX: -0.95,
    minZ: 3.45,
    maxZ: 5.12,
    padding: 0.08,
  },

  // Lower-right dining set.
  {
    id: 'dining-table',
    minX: 2.75,
    maxX: 6.35,
    minZ: 3.15,
    maxZ: 5.45,
    padding: 0.10,
  },

  {
    id: 'dining-chair-west',
    minX: 1.82,
    maxX: 2.72,
    minZ: 3.62,
    maxZ: 4.55,
    padding: 0.07,
  },

  {
    id: 'dining-chair-east',
    minX: 6.38,
    maxX: 7.18,
    minZ: 3.62,
    maxZ: 4.55,
    padding: 0.07,
  },

  {
    id: 'dining-chair-north',
    minX: 4.10,
    maxX: 5.00,
    minZ: 5.45,
    maxZ: 6.18,
    padding: 0.07,
  },

  {
    id: 'dining-chair-south',
    minX: 4.10,
    maxX: 5.00,
    minZ: 2.42,
    maxZ: 3.14,
    padding: 0.07,
  },

  // Bottom wall shelf.
  {
    id: 'front-wall-shelf',
    minX: 2.00,
    maxX: 7.30,
    minZ: 6.35,
    maxZ: 7.05,
    padding: 0.06,
  },

  // Personal items.
  {
    id: 'backpack',
    minX: -6.80,
    maxX: -5.90,
    minZ: -0.20,
    maxZ: 0.72,
    padding: 0.05,
  },

  {
    id: 'skateboard',
    minX: -6.95,
    maxX: -6.15,
    minZ: -1.20,
    maxZ: -0.15,
    padding: 0.05,
  },
];

// Como TODAS las poses del personaje ahora vienen recortadas por UV
// de una sola hoja (player-action.png), la textura ya no sabe su
// propio tamaño (texture.image apunta a la hoja completa de
// 1536x1024) — cada frame guarda su ancho/alto en unidades de mundo
// ya calculados del recorte original (ver WORLD_UNITS_PER_PIXEL),
// para que el plano quede proporcional Y del tamaño correcto frente
// a las demás poses.
interface SpriteFrame {
  texture: THREE.Texture;
  worldWidth: number;
  worldHeight: number;
}

interface AnimState {
  frames: SpriteFrame[];
  frameDuration: number;
  mirror: boolean;
}

function useGroundShadowTexture(): THREE.Texture {
  return useMemo(() => {
    const size = 128;

    const canvas = document.createElement(
      'canvas',
    );

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      const empty = new THREE.Texture();

      empty.needsUpdate = true;

      return empty;
    }

    const gradient =
      ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2,
      );

    gradient.addColorStop(
      0,
      'rgba(0,0,0,0.55)',
    );

    gradient.addColorStop(
      0.55,
      'rgba(0,0,0,0.32)',
    );

    gradient.addColorStop(
      0.85,
      'rgba(0,0,0,0.10)',
    );

    gradient.addColorStop(
      1,
      'rgba(0,0,0,0)',
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
      0,
      0,
      size,
      size,
    );

    const texture = new THREE.CanvasTexture(
      canvas,
    );

    texture.colorSpace =
      THREE.SRGBColorSpace;

    texture.magFilter =
      THREE.LinearFilter;

    texture.minFilter =
      THREE.LinearFilter;

    return texture;
  }, []);
}

function circleHitsAABB(
  x: number,
  z: number,
  collider: RoomCollider,
): boolean {
  const padding =
    collider.padding ?? 0;

  const minX =
    collider.minX - padding;

  const maxX =
    collider.maxX + padding;

  const minZ =
    collider.minZ - padding;

  const maxZ =
    collider.maxZ + padding;

  const closestX =
    THREE.MathUtils.clamp(
      x,
      minX,
      maxX,
    );

  const closestZ =
    THREE.MathUtils.clamp(
      z,
      minZ,
      maxZ,
    );

  const dx =
    x - closestX;

  const dz =
    z - closestZ;

  return (
    dx * dx + dz * dz <
    PLAYER_RADIUS * PLAYER_RADIUS
  );
}

function canOccupyRoom(
  x: number,
  z: number,
): boolean {
  const insideBounds =
    x >= -7.10 + PLAYER_RADIUS &&
    x <= 7.10 - PLAYER_RADIUS &&
    z >= -6.45 + PLAYER_RADIUS &&
    z <= 6.45 - PLAYER_RADIUS;

  if (!insideBounds) {
    return false;
  }

  return !ROOM_COLLIDERS.some(
    (collider) =>
      circleHitsAABB(
        x,
        z,
        collider,
      ),
  );
}

// El mundo exterior no tiene colliders finos por objeto (los props
// de EnvironmentDecor son decorativos) — solo el límite del mapa.
// Mantiene el sistema simple y evita tener que sincronizar cajas de
// colisión con cada árbol/roca colocado a mano.
/**
 * Yaw (rotación en Y) de la cámara, para billboards cilíndricos.
 * Se saca del vector de dirección en vez de camera.rotation.y porque
 * ese último depende del orden de ejes de Euler y da resultados
 * raros cuando la cámara está inclinada como la nuestra.
 */
const _camDir = new THREE.Vector3();

function getCameraYaw(camera: THREE.Camera): number {
  camera.getWorldDirection(_camDir);
  return Math.atan2(-_camDir.x, -_camDir.z);
}

// Huella sólida de la casa (ver HouseExterior.tsx: HALF_W=3.4,
// DEPTH_N=-2.4, DEPTH_S=4.6) — sin esto el jugador atravesaba las
// paredes derecho hacia el "interior" (que no existe como volumen,
// solo como pared visual), rompiendo la ilusión de una casa real.
// Se deja abierto un umbral frente a la puerta para poder pararse a
// interactuar.
const HOUSE_HALF_W = 3.15;

const HOUSE_MIN_Z = -2.2;

const HOUSE_MAX_Z = 4.4;

const HOUSE_DOOR_HALF_W = 1.55;

function insideHouseFootprint(
  x: number,
  z: number,
): boolean {
  if (
    x < -HOUSE_HALF_W ||
    x > HOUSE_HALF_W ||
    z < HOUSE_MIN_Z ||
    z > HOUSE_MAX_Z
  ) {
    return false;
  }

  // El umbral de la puerta (franja angosta pegada a la pared sur)
  // queda libre para poder pararse justo frente a ella.
  if (
    z > HOUSE_MAX_Z - 0.5 &&
    x > -HOUSE_DOOR_HALF_W &&
    x < HOUSE_DOOR_HALF_W
  ) {
    return false;
  }

  return true;
}

function canOccupyWorld(
  x: number,
  z: number,
): boolean {
  const margin = WORLD_HALF_SIZE - PLAYER_RADIUS - 0.5;
  return (
    x >= -margin &&
    x <= margin &&
    z >= -margin &&
    z <= margin &&
    !insideHouseFootprint(x, z) &&
    !hitsStaticObstacle(x, z, PLAYER_RADIUS)
  );
}

function moveWithCollisions(
  position: THREE.Vector3,
  dx: number,
  dz: number,
  canOccupy: (x: number, z: number) => boolean,
) {
  const distance = Math.hypot(
    dx,
    dz,
  );

  const steps = Math.max(
    1,
    Math.ceil(distance / 0.06),
  );

  const stepX =
    dx / steps;

  const stepZ =
    dz / steps;

  for (
    let index = 0;
    index < steps;
    index += 1
  ) {
    const nextX =
      position.x + stepX;

    const nextZ =
      position.z + stepZ;

    if (
      canOccupy(
        nextX,
        nextZ,
      )
    ) {
      position.x = nextX;
      position.z = nextZ;

      continue;
    }

    // Sliding resolution lets the player
    // move around furniture corners naturally.
    if (
      canOccupy(
        nextX,
        position.z,
      )
    ) {
      position.x = nextX;
    }

    if (
      canOccupy(
        position.x,
        nextZ,
      )
    ) {
      position.z = nextZ;
    }
  }
}

// Recorta N sub-imágenes de player-action.png por UV (un solo
// fetch/textura base, clonada y offset/repeat por recorte) en vez de
// cargar un archivo por pose. El mirror para izquierda/derecha ya NO
// se hace con repeat.x negativo (complicado sobre un recorte) sino
// invirtiendo la escala X del plano en useFrame — así el UV de cada
// recorte se queda intacto.
function useCroppedFrames(
  baseTexture: THREE.Texture,
  crops: SpriteCrop[],
  unitsPerPixel: number = WORLD_UNITS_PER_PIXEL,
): SpriteFrame[] {
  return useMemo(() => {
    const image = baseTexture.image as {
      width: number;
      height: number;
    };

    return crops.map((crop) => {
      const tex = baseTexture.clone();

      tex.magFilter =
        THREE.NearestFilter;

      tex.minFilter =
        THREE.NearestFilter;

      tex.generateMipmaps = false;

      tex.wrapS =
        THREE.ClampToEdgeWrapping;

      tex.wrapT =
        THREE.ClampToEdgeWrapping;

      tex.colorSpace =
        THREE.SRGBColorSpace;

      tex.repeat.set(
        crop.width / image.width,
        crop.height / image.height,
      );

      tex.offset.set(
        crop.x / image.width,
        1 -
          (crop.y + crop.height) /
            image.height,
      );

      tex.needsUpdate = true;

      return {
        texture: tex,
        worldWidth:
          crop.width *
          unitsPerPixel,
        worldHeight:
          crop.height *
          unitsPerPixel,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseTexture, crops, unitsPerPixel]);
}

export const Player: React.FC<PlayerProps> = ({
  onInteract,
  onNearbyZoneChange,
  initialPosition = [
    0,
    LOWER_FLOOR_Y,
    2.70,
  ],
  speed = DEFAULT_SPEED,
  showGroundShadow = true,
  castShadow = true,
  onPositionChange,
  mode = 'room',
  onFootstep,
}) => {
  const groupRef =
    useRef<THREE.Group>(null);

  const spriteRef =
    useRef<THREE.Mesh>(null);

  const materialRef =
    useRef<THREE.MeshStandardMaterial>(
      null,
    );

  // Silueta de lectura: una copia ligeramente más grande del mismo
  // sprite, sin luces, detrás del personaje. Un contorno OSCURO (no
  // de color) es lo que de verdad separa la silueta del follaje —
  // funciona sin importar si el fondo es pasto claro, sombra o
  // flores; un contorno de color se camufla contra su propio tono.
  // Mismo truco de "doble dibujo" que usan Hollow Knight / Sea of Stars.
  const outlineMaterialRef =
    useRef<THREE.MeshBasicMaterial>(
      null,
    );

  const pulseRef =
    useRef<THREE.Group>(null);

  const pulseRingRef =
    useRef<THREE.Mesh>(null);

  const pulseLightRef =
    useRef<THREE.PointLight>(null);

  const pulseTimer =
    useRef(0);

  useKeyboardControls();

  const activeZones =
    mode === 'world'
      ? WORLD_INTERACTION_ZONES
      : ROOM_INTERACTION_ZONES;

  const groundShadowTexture =
    useGroundShadowTexture();

  const actionsSheetTexture =
    useTexture(
      ACTIONS_SHEET,
    ) as THREE.Texture;

  const idleFrontFrames = useCroppedFrames(
    actionsSheetTexture,
    IDLE_FRONT_CROPS,
  );

  const idleBackFrames = useCroppedFrames(
    actionsSheetTexture,
    IDLE_BACK_CROPS,
  );

  const idleSideFrames = useCroppedFrames(
    actionsSheetTexture,
    IDLE_SIDE_CROPS,
  );

  const runSideFrames = useCroppedFrames(
    actionsSheetTexture,
    RUN_SIDE_CROPS,
  );

  const activityFrames = useCroppedFrames(
    actionsSheetTexture,
    ACTIVITY_RUBIK_CROPS,
  );

  const betterActionsTexture =
    useTexture(
      BETTER_ACTIONS_SHEET,
    ) as THREE.Texture;

  const backpackAltFrames = useCroppedFrames(
    betterActionsTexture,
    BACKPACK_ALT_CROPS,
    BETTER_ACTIONS_UNITS_PER_PIXEL,
  );

  // De espaldas alterna entre la pose de la hoja original y esta
  // nueva — dos fuentes distintas, mismo array de frames.
  const idleBackAllFrames = useMemo(
    () => [...idleBackFrames, ...backpackAltFrames],
    [idleBackFrames, backpackAltFrames],
  );

  const thinkBodyFrames = useCroppedFrames(
    betterActionsTexture,
    THINK_BODY_CROPS,
    BETTER_ACTIONS_UNITS_PER_PIXEL,
  );

  const sitFrames = useCroppedFrames(
    betterActionsTexture,
    SIT_CROPS,
    BETTER_ACTIONS_UNITS_PER_PIXEL,
  );

  const petDogFrames = useCroppedFrames(
    betterActionsTexture,
    PETDOG_CROPS,
    BETTER_ACTIONS_UNITS_PER_PIXEL,
  );

  const sleepFrames = useCroppedFrames(
    betterActionsTexture,
    SLEEP_CROPS,
    BETTER_ACTIONS_UNITS_PER_PIXEL,
  );

  const bikeFrames = useCroppedFrames(
    betterActionsTexture,
    BIKE_CROPS,
    BETTER_ACTIONS_UNITS_PER_PIXEL,
  );

  const walkDownFrames = useCroppedFrames(
    betterActionsTexture,
    WALK_DOWN_CROPS,
    BETTER_ACTIONS_UNITS_PER_PIXEL,
  );

  const walkUpFrames = useCroppedFrames(
    betterActionsTexture,
    WALK_UP_CROPS,
    BETTER_ACTIONS_UNITS_PER_PIXEL,
  );

  const emoteIconTextures = useMemo(() => {
    const image = betterActionsTexture.image as {
      width: number;
      height: number;
    };

    const build = (crop: SpriteCrop) => {
      const tex = betterActionsTexture.clone();
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.repeat.set(crop.width / image.width, crop.height / image.height);
      tex.offset.set(
        crop.x / image.width,
        1 - (crop.y + crop.height) / image.height,
      );
      tex.needsUpdate = true;
      return tex;
    };

    return {
      bang: build(EMOTE_BANG_CROP),
      heart: build(EMOTE_HEART_CROP),
      zzz: build(EMOTE_ZZZ_CROP),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [betterActionsTexture]);

  const idleThoughtTextures =
    useMemo(() => {
      const image =
        actionsSheetTexture.image as {
          width: number;
          height: number;
        };

      return IDLE_THOUGHT_CROPS.map(
        (crop) => {
          const tex =
            actionsSheetTexture.clone();

          tex.magFilter =
            THREE.NearestFilter;

          tex.minFilter =
            THREE.NearestFilter;

          tex.generateMipmaps =
            false;

          tex.wrapS =
            THREE.ClampToEdgeWrapping;

          tex.wrapT =
            THREE.ClampToEdgeWrapping;

          tex.colorSpace =
            THREE.SRGBColorSpace;

          tex.repeat.set(
            crop.width /
              image.width,
            crop.height /
              image.height,
          );

          tex.offset.set(
            crop.x /
              image.width,
            1 -
              (crop.y +
                crop.height) /
                image.height,
          );

          tex.needsUpdate = true;

          return tex;
        },
      );
    }, [actionsSheetTexture]);

  const allSpriteTextures = useMemo(
    () => [
      ...idleFrontFrames,
      ...idleBackAllFrames,
      ...idleSideFrames,
      ...runSideFrames,
      ...activityFrames,
      ...thinkBodyFrames,
      ...sitFrames,
      ...petDogFrames,
      ...sleepFrames,
      ...bikeFrames,
      ...walkDownFrames,
      ...walkUpFrames,
    ].map((f) => f.texture),
    [
      idleFrontFrames,
      idleBackAllFrames,
      idleSideFrames,
      runSideFrames,
      activityFrames,
      thinkBodyFrames,
      sitFrames,
      petDogFrames,
      sleepFrames,
      bikeFrames,
      walkDownFrames,
      walkUpFrames,
    ],
  );

  useEffect(() => {
    return () => {
      allSpriteTextures.forEach((tex) =>
        tex.dispose(),
      );

      idleThoughtTextures.forEach(
        (tex) => tex.dispose(),
      );

      Object.values(emoteIconTextures).forEach((tex) => tex.dispose());
    };
  }, [
    allSpriteTextures,
    idleThoughtTextures,
    emoteIconTextures,
  ]);

  const thoughtRef =
    useRef<THREE.Mesh>(null);

  const thoughtMaterialRef =
    useRef<THREE.MeshBasicMaterial>(
      null,
    );

  const idleTimer =
    useRef(0);

  const isSprinting =
    useRef(false);

  const stepPhase =
    useRef(0);

  // Actividad "sentado armando el cubo": independiente del ciclo de
  // caminar/idle normal — cuando está activa, reemplaza por completo
  // qué frame se dibuja.
  const activityActive =
    useRef(false);

  const activityFrame =
    useRef(0);

  const activityFrameTimer =
    useRef(0);

  // Qué actividad de idle largo toca: cubo de Rubik (cuarto) o
  // sentarse con la laptop (mundo exterior) — se decide una sola vez
  // al activarse, en base al modo actual.
  const activityKind =
    useRef<'rubik' | 'sit'>('rubik');

  // Pose sostenida por interacción explícita (E cerca de una zona),
  // NO por idle — dormir y acariciar al perro. Tiene prioridad total
  // sobre cualquier otro estado de animación mientras dure.
  const heldPose =
    useRef<'none' | 'sleep' | 'petdog'>('none');

  const heldPoseTimer =
    useRef(0);

  const frameTimer =
    useRef(0);

  const currentFrame =
    useRef(0);

  const currentDirection =
    useRef<Direction>('down');

  const wasMoving =
    useRef(false);

  const wasInteractPressed =
    useRef(false);

  const nearbyZone =
    useRef<InteractionZoneId | null>(
      null,
    );

  const lastInteractTarget =
    useRef<[number, number]>([
      0, 0,
    ]);

  const getAnimState = (
    direction: Direction,
    isMoving: boolean,
  ): AnimState => {
    switch (direction) {
      // Ciclo real de caminar (Better-Actions.png) mientras se mueve;
      // parado usa la pose idle de player-action.png de siempre.
      case 'down':
        return isMoving
          ? {
              frames: walkDownFrames,
              frameDuration: isSprinting.current
                ? FRAME_DURATION_WALK_DOWN * 0.62
                : FRAME_DURATION_WALK_DOWN,
              mirror: false,
            }
          : {
              frames: idleFrontFrames,
              frameDuration:
                FRAME_DURATION_IDLE,
              mirror: false,
            };

      case 'up':
        return isMoving
          ? {
              frames: walkUpFrames,
              frameDuration: isSprinting.current
                ? FRAME_DURATION_WALK_UP * 0.62
                : FRAME_DURATION_WALK_UP,
              mirror: false,
            }
          : {
              frames: idleBackAllFrames,
              frameDuration:
                FRAME_DURATION_IDLE,
              mirror: false,
            };

      case 'left':
      case 'right':
        return isMoving
          ? {
              frames: runSideFrames,
              // Corriendo el ciclo va más rápido — el mismo set de
              // frames se lee como sprint en vez de trote.
              frameDuration: isSprinting.current
                ? FRAME_DURATION_WALK_SIDE * 0.62
                : FRAME_DURATION_WALK_SIDE,
              mirror:
                direction === 'left',
            }
          : {
              frames: idleSideFrames,
              frameDuration:
                FRAME_DURATION_IDLE,
              mirror:
                direction === 'left',
            };
    }
  };

  useFrame(
    (state, rawDelta) => {
      if (
        !groupRef.current ||
        !spriteRef.current ||
        !materialRef.current
      ) {
        return;
      }

      const delta = Math.min(
        rawDelta,
        1 / 30,
      );

      const position =
        groupRef.current.position;

      const { keyboard, touch } =
        useControlsStore.getState();

      let moveX = 0;
      let moveZ = 0;

      if (keyboard.moveBackward) {
        moveZ += 1;
      }

      if (keyboard.moveForward) {
        moveZ -= 1;
      }

      if (keyboard.moveLeft) {
        moveX -= 1;
      }

      if (keyboard.moveRight) {
        moveX += 1;
      }

      moveX += touch.x;
      moveZ += touch.z;

      moveX = THREE.MathUtils.clamp(
        moveX,
        -1,
        1,
      );

      moveZ = THREE.MathUtils.clamp(
        moveZ,
        -1,
        1,
      );

      const isMoving =
        Math.hypot(moveX, moveZ) >
        0.05;

      if (isMoving) {
        idleTimer.current = 0;

        if (activityActive.current) {
          activityActive.current =
            false;

          activityFrame.current = 0;

          activityFrameTimer.current = 0;
        }

        // Caminar cancela cualquier pose sostenida al instante — no
        // tendría sentido seguir "dormido" o "acariciando" a medio paso.
        heldPose.current = 'none';
        heldPoseTimer.current = 0;
      } else {
        idleTimer.current += delta;

        if (
          !activityActive.current &&
          heldPose.current === 'none' &&
          idleTimer.current >
            ACTIVITY_DELAY
        ) {
          activityActive.current =
            true;

          // El cubo de Rubik es del escritorio del cuarto; afuera, sin
          // escritorio, tiene más sentido sentarse a programar.
          activityKind.current =
            mode === 'room' ? 'rubik' : 'sit';

          activityFrame.current = 0;

          activityFrameTimer.current = 0;
        }
      }

      // La pose sostenida (dormir/acariciar) cuenta regresiva y se
      // apaga sola — así no hace falta que el jugador la cancele.
      if (heldPose.current !== 'none') {
        heldPoseTimer.current -= delta;

        if (heldPoseTimer.current <= 0) {
          heldPose.current = 'none';
          heldPoseTimer.current = 0;
        }
      }

      if (
        activityActive.current &&
        activityKind.current === 'rubik'
      ) {
        activityFrameTimer.current +=
          delta;

        if (
          activityFrameTimer.current >=
          ACTIVITY_FRAME_DURATION
        ) {
          activityFrameTimer.current -=
            ACTIVITY_FRAME_DURATION;

          activityFrame.current += 1;

          if (
            activityFrame.current >=
            activityFrames.length
          ) {
            // Se acabó la secuencia: se para solo y deja el timer de
            // idle en 0 para que, si sigue sin moverse, el ciclo
            // (globo de pensamiento → sentarse) empiece de nuevo.
            activityActive.current =
              false;

            activityFrame.current = 0;

            idleTimer.current = 0;
          }
        }
      }

      let effectiveSpeed = speed;

      const sprinting =
        mode === 'world' &&
        keyboard.sprint &&
        isMoving;

      isSprinting.current = sprinting;

      if (mode === 'world') {
        effectiveSpeed *= getActiveSpeedMultiplier();

        const slope = getWorldSlope(
          position.x,
          position.z,
        );

        // Solo CORRER (Shift) gasta stamina — caminar, subas o no
        // subas una cuesta, siempre la recupera (un poco más lento
        // que estar parado del todo, para que sprintar siga siendo
        // la decisión real: "quiero llegar rápido y pagar el costo",
        // no un castigo por simplemente moverte por el mundo.
        const vitals =
          useVitalsStore.getState();

        if (sprinting) {
          effectiveSpeed *= 1.75;

          const staminaCost =
            (7 + Math.min(2.5, slope) * 1.3) *
            delta *
            2.2;

          vitals.drainStamina(
            staminaCost,
          );
        } else if (isMoving) {
          vitals.regenStamina(
            10 * delta,
          );
        } else {
          vitals.regenStamina(
            18 * delta,
          );
        }

        if (isMoving) {
          // Las cuestas empinadas siguen frenando físicamente (es
          // terreno difícil), pero eso ya NO consume stamina — es
          // un límite de velocidad, no de energía.
          effectiveSpeed *=
            THREE.MathUtils.clamp(
              1 - slope * 0.3,
              0.22,
              1,
            );
        }

        if (vitals.isExhausted) {
          effectiveSpeed *= 0.5;
        }
      }

      if (isMoving) {
        const length =
          Math.hypot(
            moveX,
            moveZ,
          );

        const stepX =
          (moveX / length) *
          effectiveSpeed *
          delta;

        const stepZ =
          (moveZ / length) *
          effectiveSpeed *
          delta;

        if (mode === 'world') {
          // Escalada: se permite subir mientras la pendiente hacia
          // donde va sea razonable. Si es un paredón (> MAX_CLIMB_SLOPE)
          // el paso se descarta, así el jugador "resbala" en vez de
          // treparse por una pared vertical.
          const nx = position.x + stepX;
          const nz = position.z + stepZ;

          const rise =
            getWorldTerrainHeight(nx, nz) -
            getWorldTerrainHeight(
              position.x,
              position.z,
            );

          const run = Math.hypot(stepX, stepZ);
          const climb =
            run > 0.0001 ? rise / run : 0;

          if (
            climb <= MAX_CLIMB_SLOPE &&
            canOccupyWorld(nx, nz)
          ) {
            position.x = nx;
            position.z = nz;
          } else {
            // Deslizar por la ladera: intenta cada eje por separado.
            if (
              canOccupyWorld(
                position.x + stepX,
                position.z,
              ) &&
              (getWorldTerrainHeight(
                position.x + stepX,
                position.z,
              ) -
                getWorldTerrainHeight(
                  position.x,
                  position.z,
                )) /
                Math.max(0.0001, Math.abs(stepX)) <=
                MAX_CLIMB_SLOPE
            ) {
              position.x += stepX;
            }

            if (
              canOccupyWorld(
                position.x,
                position.z + stepZ,
              ) &&
              (getWorldTerrainHeight(
                position.x,
                position.z + stepZ,
              ) -
                getWorldTerrainHeight(
                  position.x,
                  position.z,
                )) /
                Math.max(0.0001, Math.abs(stepZ)) <=
                MAX_CLIMB_SLOPE
            ) {
              position.z += stepZ;
            }
          }
        } else {
          moveWithCollisions(
            position,
            stepX,
            stepZ,
            canOccupyRoom,
          );
        }
      }

      const targetHeight =
        mode === 'world'
          ? getWorldTerrainHeight(
              position.x,
              position.z,
            )
          : getTargetHeight(
              position.x,
              position.z,
            );

      position.y =
        THREE.MathUtils.damp(
          position.y,
          targetHeight,
          HEIGHT_LERP_SPEED,
          delta,
        );

      onPositionChange?.([
        position.x,
        position.y,
        position.z,
      ]);

      let nextDirection =
        currentDirection.current;

      if (isMoving) {
        nextDirection =
          Math.abs(moveX) >=
          Math.abs(moveZ)
            ? moveX > 0
              ? 'right'
              : 'left'
            : moveZ > 0
              ? 'down'
              : 'up';
      }

      const directionChanged =
        nextDirection !==
        currentDirection.current;

      const motionChanged =
        isMoving !==
        wasMoving.current;

      if (
        directionChanged ||
        motionChanged
      ) {
        currentDirection.current =
          nextDirection;

        wasMoving.current =
          isMoving;

        currentFrame.current =
          0;

        frameTimer.current =
          0;
      }

      let targetFrame: SpriteFrame;

      let mirror = false;

      // El personaje va en bici mientras el boost activo sea el de la
      // bici (antes "subirse a la bici" solo cambiaba la velocidad,
      // sin ningún cambio visual) — prioridad justo debajo de las
      // poses sostenidas por interacción.
      const riding =
        mode === 'world' &&
        isMoving &&
        getActiveSpeedMultiplier() > 1 &&
        useVehicleStore.getState().label === 'bici';

      // Ventana en la que el globo de pensamiento normal está visible
      // (antes de que el idle largo dispare sentarse/rubik) — durante
      // esa ventana el cuerpo también cambia a la pose de "pensando".
      const isThinking =
        !isMoving &&
        !activityActive.current &&
        heldPose.current === 'none' &&
        idleTimer.current >
          IDLE_THOUGHT_DELAY;

      if (heldPose.current === 'sleep') {
        targetFrame = sleepFrames[0];
      } else if (heldPose.current === 'petdog') {
        targetFrame = petDogFrames[0];
      } else if (riding) {
        targetFrame = bikeFrames[0];

        mirror =
          currentDirection.current ===
          'left';
      } else if (activityActive.current) {
        // Modo actividad: el frame lo maneja el timer de arriba, no
        // este ciclo normal de walk/idle.
        targetFrame =
          activityKind.current === 'rubik'
            ? activityFrames[
                Math.min(
                  activityFrame.current,
                  activityFrames.length -
                    1,
                )
              ]
            : sitFrames[0];
      } else if (isThinking) {
        targetFrame = thinkBodyFrames[0];
      } else {
        const animState =
          getAnimState(
            currentDirection.current,
            isMoving,
          );

        mirror = animState.mirror;

        if (
          animState.frames.length > 1
        ) {
          frameTimer.current +=
            delta;

          while (
            frameTimer.current >=
            animState.frameDuration
          ) {
            currentFrame.current =
              (currentFrame.current +
                1) %
              animState.frames
                .length;

            frameTimer.current -=
              animState.frameDuration;
          }
        } else {
          currentFrame.current = 0;
        }

        targetFrame =
          animState.frames[
            currentFrame.current
          ];
      }

      if (
        materialRef.current.map !==
        targetFrame.texture
      ) {
        materialRef.current.map =
          targetFrame.texture;

        // También como emissiveMap, con baja intensidad: mantiene
        // el color del sprite "vivo" y saturado sin depender tanto
        // de las luces moody del cuarto (que si no, lo apagan).
        materialRef.current.emissiveMap =
          targetFrame.texture;

        materialRef.current.needsUpdate =
          true;

        if (outlineMaterialRef.current) {
          outlineMaterialRef.current.map =
            targetFrame.texture;

          outlineMaterialRef.current.needsUpdate =
            true;
        }
      }

      // El mirror ya no se hace con repeat.x negativo (complicaría
      // el recorte por UV): se invierte la escala X del plano, que
      // deja el UV intacto y solo espeja la geometría. La geometría
      // base es un cuadrado de 1x1 (ver JSX), así que scale.x/y SON
      // directamente el ancho/alto en unidades de mundo del recorte.
      spriteRef.current.scale.set(
        (mirror ? -1 : 1) *
          targetFrame.worldWidth,
        targetFrame.worldHeight,
        1,
      );

      // Billboard CILÍNDRICO (solo yaw), no esférico. Copiar el
      // quaternion completo de la cámara inclinaba el plano hacia
      // atrás siguiendo el ángulo rasante del rig, y el borde
      // inferior del sprite se hundía bajo el terreno. Rotando solo
      // en Y el sprite queda siempre vertical: los pies se quedan
      // exactamente sobre el suelo en cualquier pendiente.
      spriteRef.current.rotation.set(
        0,
        getCameraYaw(state.camera),
        0,
      );

      const bobOffset =
        isMoving && !activityActive.current
          ? Math.abs(
              Math.sin(
                state.clock
                  .elapsedTime *
                  WALK_BOB_FREQUENCY,
              ),
            ) * WALK_BOB_AMPLITUDE
          : activityActive.current ||
              heldPose.current !== 'none'
            ? 0
            : Math.sin(
                state.clock
                  .elapsedTime *
                  IDLE_BREATH_FREQUENCY,
              ) *
              IDLE_BREATH_AMPLITUDE;

      // Anclado por abajo: la mitad de la altura de ESTE frame
      // (no un alto fijo) para que sentado/de pie/corriendo todos
      // toquen el piso correctamente sin importar su proporción.
      // El +0.03 lo levanta lo justo para que en pendientes el
      // alpha del sprite no quede mordido por el triángulo del
      // terreno que tiene enfrente.
      spriteRef.current.position.y =
        targetFrame.worldHeight / 2 +
        bobOffset +
        0.03;

      /* ---------- pasos: sonido + polvo ----------
         El paso se dispara en el punto BAJO del bobbing (cuando el
         pie "toca"), no en un temporizador aparte: así el sonido
         siempre cae sincronizado con la animación, incluso al
         cambiar de velocidad. */
      if (isMoving && !activityActive.current) {
        const cadence = isSprinting.current
          ? WALK_BOB_FREQUENCY * 1.55
          : WALK_BOB_FREQUENCY;

        stepPhase.current += delta * cadence;

        if (stepPhase.current >= Math.PI) {
          stepPhase.current -= Math.PI;

          const surface =
            mode === 'world'
              ? getWorldTerrainHeight(position.x, position.z) <
                WATER_LEVEL + 0.3
                ? 'water'
                : 'grass'
              : 'wood';

          audio.footstep(surface);
          onFootstep?.(position.x, position.y, position.z);
        }
      } else {
        stepPhase.current = Math.PI * 0.9;
      }

      // El globo de pensamiento no tiene sentido mientras está
      // sentado armando el cubo (ya se ve claramente qué está
      // haciendo), así que se oculta durante la actividad. Durante
      // una pose sostenida (dormir/acariciar) se reemplaza por un
      // iconito fijo (zzz / corazón) en vez de ocultarse.
      if (
        heldPose.current !== 'none' &&
        thoughtRef.current &&
        thoughtMaterialRef.current
      ) {
        const icon =
          heldPose.current === 'sleep'
            ? emoteIconTextures.zzz
            : emoteIconTextures.heart;

        if (thoughtMaterialRef.current.map !== icon) {
          thoughtMaterialRef.current.map = icon;
          thoughtMaterialRef.current.needsUpdate = true;
        }

        thoughtMaterialRef.current.opacity = 0.95;
        thoughtRef.current.visible = true;

        thoughtRef.current.position.set(
          0,
          SPRITE_HEIGHT +
            0.3 +
            Math.sin(state.clock.elapsedTime * 2.4) * 0.05,
          0,
        );

        thoughtRef.current.rotation.set(
          0,
          getCameraYaw(state.camera),
          0,
        );
      } else if (
        activityActive.current &&
        thoughtRef.current
      ) {
        thoughtRef.current.visible =
          false;
      }

      if (
        thoughtRef.current &&
        thoughtMaterialRef.current &&
        !activityActive.current &&
        heldPose.current === 'none'
      ) {
        const elapsedIdle =
          idleTimer.current -
          IDLE_THOUGHT_DELAY;

        if (elapsedIdle > 0) {
          const thoughtIndex =
            Math.floor(
              elapsedIdle /
                IDLE_THOUGHT_CYCLE,
            ) %
            idleThoughtTextures.length;

          const targetThoughtTexture =
            idleThoughtTextures[
              thoughtIndex
            ];

          if (
            thoughtMaterialRef
              .current.map !==
            targetThoughtTexture
          ) {
            thoughtMaterialRef.current.map =
              targetThoughtTexture;

            thoughtMaterialRef.current.needsUpdate =
              true;
          }

          const localCycle =
            elapsedIdle %
            IDLE_THOUGHT_CYCLE;

          const fadeIn = Math.min(
            1,
            localCycle /
              IDLE_THOUGHT_FADE,
          );

          const fadeOut = Math.min(
            1,
            (IDLE_THOUGHT_CYCLE -
              localCycle) /
              IDLE_THOUGHT_FADE,
          );

          thoughtMaterialRef.current.opacity =
            Math.min(
              fadeIn,
              fadeOut,
            ) * 0.95;

          thoughtRef.current.visible =
            true;

          thoughtRef.current.position.set(
            0,
            SPRITE_HEIGHT +
              0.3 +
              Math.sin(
                state.clock
                  .elapsedTime *
                  1.6,
              ) *
                0.035,
            0,
          );

          thoughtRef.current.rotation.set(
            0,
            getCameraYaw(state.camera),
            0,
          );
        } else {
          thoughtRef.current.visible =
            false;
        }
      }

      const interactHeld =
        keyboard.interact ||
        touch.interact;

      const interactJustPressed =
        interactHeld &&
        !wasInteractPressed.current;

      wasInteractPressed.current =
        interactHeld;

      let closestZone: InteractionZoneId | null =
        null;

      for (
        const zone of activeZones
      ) {
        const distance =
          Math.hypot(
            position.x -
              zone.position[0],
            position.z -
              zone.position[1],
          );

        if (
          distance <=
          zone.radius
        ) {
          closestZone = zone.id;

          if (
            interactJustPressed
          ) {
            onInteract(zone.id);

            lastInteractTarget.current =
              zone.position;

            pulseTimer.current =
              INTERACTION_PULSE_DURATION;

            // Dormir/acariciar cambian la pose del personaje mismo,
            // no solo un toast — App.tsx sigue decidiendo el efecto
            // en vitals/audio, esto solo dispara el lado visual.
            if (zone.id === 'sleep') {
              heldPose.current = 'sleep';
              heldPoseTimer.current = SLEEP_POSE_DURATION;
              activityActive.current = false;
            } else if (zone.id === 'pet-dog') {
              heldPose.current = 'petdog';
              heldPoseTimer.current = PETDOG_POSE_DURATION;
              activityActive.current = false;
            }
          }

          break;
        }
      }

      if (
        closestZone !==
        nearbyZone.current
      ) {
        nearbyZone.current =
          closestZone;

        onNearbyZoneChange?.(
          closestZone,
        );
      }

      if (pulseRef.current) {
        if (
          pulseTimer.current > 0
        ) {
          pulseTimer.current =
            Math.max(
              0,
              pulseTimer.current -
                delta,
            );

          const progress =
            1 -
            pulseTimer.current /
              INTERACTION_PULSE_DURATION;

          const eased =
            1 -
            Math.pow(
              1 - progress,
              3,
            );

          const opacity =
            1 - progress;

          pulseRef.current.visible =
            true;

          pulseRef.current.scale.setScalar(
            0.45 +
              eased * 0.95,
          );

          pulseRef.current.position.set(
            lastInteractTarget
              .current[0] -
              position.x,

            Math.max(
              0.05,
              (mode === 'world'
                ? getWorldTerrainHeight
                : getTargetHeight)(
                lastInteractTarget
                  .current[0],
                lastInteractTarget
                  .current[1],
              ) -
                position.y +
                0.06,
            ),

            lastInteractTarget
              .current[1] -
              position.z,
          );

          const ringMaterial =
            pulseRingRef.current
              ?.material;

          if (
            ringMaterial instanceof
            THREE.MeshBasicMaterial
          ) {
            ringMaterial.opacity =
              opacity;
          }

          if (
            pulseLightRef.current
          ) {
            pulseLightRef.current.intensity =
              2.5 * opacity;
          }
        } else {
          pulseRef.current.visible =
            false;
        }
      }
    },
  );

  return (
    <group
      ref={groupRef}
      position={initialPosition}
    >
      {showGroundShadow && (
        <mesh
          position={[
            0,
            SHADOW_Y_OFFSET,
            0,
          ]}
          rotation={[
            -Math.PI / 2,
            0,
            0,
          ]}
          renderOrder={1}
        >
          <circleGeometry
            args={[0.40, 24]}
          />

          <meshBasicMaterial
            map={groundShadowTexture}
            transparent
            opacity={0.85}
            depthWrite={false}
            depthTest
            polygonOffset
            polygonOffsetFactor={-4}
            polygonOffsetUnits={-4}
          />
        </mesh>
      )}

      <mesh
        ref={spriteRef}
        position={[
          0,
          SPRITE_HEIGHT / 2,
          0,
        ]}
        castShadow={castShadow}
        receiveShadow
      >
        <planeGeometry
          args={[1, 1]}
        />

        <meshStandardMaterial
          ref={materialRef}
          transparent
          alphaTest={0.5}
          side={THREE.DoubleSide}
          roughness={1}
          metalness={0}
          toneMapped={false}
          emissive="#ffffff"
          emissiveIntensity={0.4}
        />

        {/* Contorno: hijo del sprite para heredar automáticamente su
            escala (incluido el espejado en X) y su rotación — un 12%
            más grande, sin luces (color plano), detrás en Z local y
            con renderOrder menor para que el sprite real se dibuje
            encima. */}
        <mesh
          scale={[1.12, 1.12, 1]}
          position={[0, 0, -0.01]}
          renderOrder={-1}
        >
          <planeGeometry args={[1, 1]} />

          <meshBasicMaterial
            ref={outlineMaterialRef}
            color={mode === 'world' ? '#2a1f10' : '#0c0a12'}
            transparent
            alphaTest={0.5}
            side={THREE.DoubleSide}
            toneMapped={false}
            depthWrite
          />
        </mesh>
      </mesh>

      {mode === 'world' && (
        <Glow
          position={[0, 0.09, 0]}
          color="#ffe6ac"
          size={1.15}
          nightOnly={0}
          flicker={0}
        />
      )}

      <mesh
        ref={thoughtRef}
        position={[0, SPRITE_HEIGHT + 0.3, 0]}
        visible={false}
        renderOrder={5}
      >
        <planeGeometry args={[0.4, 0.4]} />

        <meshBasicMaterial
          ref={thoughtMaterialRef}
          transparent
          opacity={0}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      <group
        ref={pulseRef}
        visible={false}
      >
        <mesh
          ref={pulseRingRef}
          rotation={[
            -Math.PI / 2,
            0,
            0,
          ]}
          renderOrder={20}
        >
          <ringGeometry
            args={[
              0.22,
              0.30,
              24,
            ]}
          />

          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        <pointLight
          ref={pulseLightRef}
          color="#38bdf8"
          intensity={0}
          distance={2.4}
          decay={2}
        />
      </group>
    </group>
  );
};