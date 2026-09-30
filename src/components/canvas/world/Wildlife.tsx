import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  getWorldTerrainHeight,
  WATER_LEVEL,
  LAKE_CENTER,
  LAKE_RADIUS,
  CAVE_CENTER,
} from '../../../world/terrain';

/* ============================================================
   FAUNA PROCEDURAL
   ============================================================
   Antes recortaba sprites de animals.png, pero ese atlas traía
   animales deformados/mal recortados (mismo problema de fondo que
   la casa o las mariposas). En vez de arriesgar coordenadas de un
   atlas que no se pudo verificar visualmente, cada especie se dibuja
   en un canvas con primitivas simples (mismo método que Butterflies.tsx)
   — 2 frames por especie para que se lea el movimiento.
============================================================ */

type Species =
  | 'huskyPup'
  | 'bat'
  | 'birdOrange'
  | 'birdBlue'
  | 'squirrel'
  | 'rabbit'
  | 'duck'
  | 'deer';

/** Cómo se mueve una criatura por el mundo. */
type Locomotion = 'ground' | 'flyer' | 'swimmer';

/**
 * Estados de la IA. Antes solo había wander/flee; ahora cada criatura
 * decide entre varios comportamientos según su "personalidad"
 * (curiosity/skittishness) y qué tan cerca está el jugador.
 */
type AIState = 'idle' | 'wander' | 'graze' | 'flee' | 'approach' | 'circle';

interface CreatureDef {
  id: string;
  species: Species;
  locomotion: Locomotion;
  home: [number, number];
  roamRadius: number;
  speed: number;
  spriteHeight: number;
  flightY?: number;
  /** 0 = huye siempre, 1 = se acerca al jugador con confianza. */
  curiosity: number;
  /** Distancia a la que reacciona al jugador. */
  awareness: number;
}

const CREATURES: CreatureDef[] = [
  // Perritos: confiados, se acercan al jugador.
  { id: 'pup-1', species: 'huskyPup', locomotion: 'ground', home: [5, 10], roamRadius: 6, speed: 1.5, spriteHeight: 0.95, curiosity: 0.95, awareness: 9 },
  { id: 'pup-2', species: 'huskyPup', locomotion: 'ground', home: [12, 4], roamRadius: 5, speed: 1.4, spriteHeight: 0.9, curiosity: 0.9, awareness: 8 },
  { id: 'pup-3', species: 'huskyPup', locomotion: 'ground', home: [-4, 11], roamRadius: 5, speed: 1.45, spriteHeight: 0.9, curiosity: 0.85, awareness: 8 },

  // Ardillas: nerviosas, huyen rápido.
  { id: 'sq-1', species: 'squirrel', locomotion: 'ground', home: [-13, -14], roamRadius: 4, speed: 2.4, spriteHeight: 0.6, curiosity: 0.1, awareness: 6 },
  { id: 'sq-2', species: 'squirrel', locomotion: 'ground', home: [20, -4], roamRadius: 4, speed: 2.4, spriteHeight: 0.6, curiosity: 0.1, awareness: 6 },
  { id: 'sq-3', species: 'squirrel', locomotion: 'ground', home: [-20, -18], roamRadius: 5, speed: 2.3, spriteHeight: 0.6, curiosity: 0.15, awareness: 6 },

  // Conejos: pastan y huyen.
  { id: 'rb-1', species: 'rabbit', locomotion: 'ground', home: [-9, -6], roamRadius: 5, speed: 2.0, spriteHeight: 0.62, curiosity: 0.2, awareness: 7 },
  { id: 'rb-2', species: 'rabbit', locomotion: 'ground', home: [8, -14], roamRadius: 5, speed: 2.0, spriteHeight: 0.62, curiosity: 0.2, awareness: 7 },
  { id: 'rb-3', species: 'rabbit', locomotion: 'ground', home: [24, -14], roamRadius: 5, speed: 2.1, spriteHeight: 0.6, curiosity: 0.25, awareness: 7 },

  // Patos: nadan en el lago.
  { id: 'dk-1', species: 'duck', locomotion: 'swimmer', home: [LAKE_CENTER[0] - 2, LAKE_CENTER[1]], roamRadius: 5.5, speed: 0.9, spriteHeight: 0.6, curiosity: 0.4, awareness: 6 },
  { id: 'dk-2', species: 'duck', locomotion: 'swimmer', home: [LAKE_CENTER[0] + 3, LAKE_CENTER[1] + 2], roamRadius: 5, speed: 0.85, spriteHeight: 0.58, curiosity: 0.4, awareness: 6 },
  { id: 'dk-3', species: 'duck', locomotion: 'swimmer', home: [LAKE_CENTER[0], LAKE_CENTER[1] - 3], roamRadius: 5, speed: 0.9, spriteHeight: 0.56, curiosity: 0.35, awareness: 6 },

  // Pájaros: revolotean alto, indiferentes.
  { id: 'bd-1', species: 'birdOrange', locomotion: 'flyer', home: [17, -7], roamRadius: 8, speed: 3.2, spriteHeight: 0.48, flightY: 3.4, curiosity: 0.3, awareness: 5 },
  { id: 'bd-2', species: 'birdBlue', locomotion: 'flyer', home: [-7, -6], roamRadius: 9, speed: 3.4, spriteHeight: 0.46, flightY: 3.8, curiosity: 0.3, awareness: 5 },
  { id: 'bd-3', species: 'birdBlue', locomotion: 'flyer', home: [3, -18], roamRadius: 8, speed: 3.0, spriteHeight: 0.44, flightY: 3.2, curiosity: 0.25, awareness: 5 },
  { id: 'bd-4', species: 'birdOrange', locomotion: 'flyer', home: [-17, 2], roamRadius: 9, speed: 3.3, spriteHeight: 0.46, flightY: 3.6, curiosity: 0.3, awareness: 5 },

  // Murciélagos: orbitan la cueva, atraídos por el jugador.
  { id: 'bat-1', species: 'bat', locomotion: 'flyer', home: [CAVE_CENTER[0], CAVE_CENTER[1] - 1], roamRadius: 6, speed: 3.6, spriteHeight: 0.75, flightY: 2.6, curiosity: 0.8, awareness: 11 },
  { id: 'bat-2', species: 'bat', locomotion: 'flyer', home: [CAVE_CENTER[0] - 3, CAVE_CENTER[1] - 3], roamRadius: 6, speed: 3.8, spriteHeight: 0.65, flightY: 2.1, curiosity: 0.8, awareness: 11 },
  { id: 'bat-3', species: 'bat', locomotion: 'flyer', home: [CAVE_CENTER[0] + 2, CAVE_CENTER[1] + 2], roamRadius: 5.5, speed: 3.4, spriteHeight: 0.7, flightY: 3.0, curiosity: 0.75, awareness: 11 },
  { id: 'bat-4', species: 'bat', locomotion: 'flyer', home: [CAVE_CENTER[0] - 1, CAVE_CENTER[1] + 4], roamRadius: 6, speed: 3.7, spriteHeight: 0.68, flightY: 2.4, curiosity: 0.85, awareness: 11 },

  // Venados: esquivos, pastan cerca del mirador de cerezos y del bosque sur.
  { id: 'deer-1', species: 'deer', locomotion: 'ground', home: [-20, -18], roamRadius: 6, speed: 2.2, spriteHeight: 1.05, curiosity: 0.15, awareness: 9 },
  { id: 'deer-2', species: 'deer', locomotion: 'ground', home: [10, -24], roamRadius: 6.5, speed: 2.15, spriteHeight: 1.0, curiosity: 0.15, awareness: 9 },
];

interface CreatureFrame {
  texture: THREE.Texture;
  aspect: number;
}

function makeCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

function toFrame(canvas: HTMLCanvasElement, aspect: number): CreatureFrame {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return { texture: tex, aspect };
}

/** Perrito husky: cuerpo crema, "montura" negra en el lomo, orejas paradas. */
function drawHuskyPup(legPhase: boolean): CreatureFrame {
  const { canvas, ctx } = makeCanvas(48, 40);
  ctx.translate(24, 20);

  // Patas.
  ctx.fillStyle = '#e8e4de';
  const legY = legPhase ? 1 : -1;
  ctx.fillRect(-13, 4 + legY, 4, 9);
  ctx.fillRect(9, 4 - legY, 4, 9);
  ctx.fillRect(-6, 4 - legY, 4, 9);
  ctx.fillRect(2, 4 + legY, 4, 9);

  // Cuerpo.
  ctx.fillStyle = '#f2efe9';
  ctx.beginPath();
  ctx.ellipse(0, -2, 16, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Montura negra sobre el lomo.
  ctx.fillStyle = '#2b2b2f';
  ctx.beginPath();
  ctx.ellipse(-1, -6, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cola curveada.
  ctx.strokeStyle = '#f2efe9';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(15, -3);
  ctx.quadraticCurveTo(22, -10, 16, -14);
  ctx.stroke();

  // Cabeza.
  ctx.fillStyle = '#f2efe9';
  ctx.beginPath();
  ctx.ellipse(-15, -8, 7, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b2b2f';
  ctx.beginPath();
  ctx.ellipse(-16, -11, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Orejas.
  ctx.fillStyle = '#2b2b2f';
  ctx.beginPath();
  ctx.moveTo(-19, -13);
  ctx.lineTo(-21, -19);
  ctx.lineTo(-16, -14);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-11, -13);
  ctx.lineTo(-9, -19);
  ctx.lineTo(-14, -14);
  ctx.fill();

  // Hocico + ojo.
  ctx.fillStyle = '#f2efe9';
  ctx.beginPath();
  ctx.ellipse(-20, -7, 3, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(-14, -9, 1.1, 0, Math.PI * 2);
  ctx.fill();

  return toFrame(canvas, 48 / 40);
}

/** Ardilla: cuerpo café, cola esponjada por encima del lomo. */
function drawSquirrel(hop: boolean): CreatureFrame {
  const { canvas, ctx } = makeCanvas(36, 40);
  ctx.translate(18, 24 - (hop ? 3 : 0));

  ctx.fillStyle = '#8a5a34';
  // Cola grande curveada por detrás.
  ctx.beginPath();
  ctx.ellipse(6, -10, 9, 13, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a56f43';
  ctx.beginPath();
  ctx.ellipse(6, -10, 6, 9.5, 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Patas traseras (sentado).
  ctx.fillStyle = '#8a5a34';
  ctx.fillRect(-9, 2, 6, 6);
  ctx.fillRect(-1, 2, 6, 6);

  // Cuerpo.
  ctx.beginPath();
  ctx.ellipse(-4, -3, 8, 10, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Cabeza.
  ctx.beginPath();
  ctx.ellipse(-11, -11, 6, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Orejas.
  ctx.beginPath();
  ctx.ellipse(-14, -16, 2, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-8, -16, 2, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Panza clara + ojo.
  ctx.fillStyle = '#e9d3b8';
  ctx.beginPath();
  ctx.ellipse(-5, 0, 4, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(-13, -12, 1, 0, Math.PI * 2);
  ctx.fill();

  return toFrame(canvas, 36 / 40);
}

/** Conejo: cuerpo claro, orejas largas paradas. */
function drawRabbit(hop: boolean): CreatureFrame {
  const { canvas, ctx } = makeCanvas(32, 40);
  ctx.translate(16, hop ? 22 : 26);

  ctx.fillStyle = '#eee8de';

  // Patas traseras — más largas cuando salta.
  if (hop) {
    ctx.fillRect(-8, -2, 5, 10);
    ctx.fillRect(3, -2, 5, 10);
  } else {
    ctx.fillRect(-7, 0, 5, 6);
    ctx.fillRect(2, 0, 5, 6);
  }

  // Cuerpo.
  ctx.beginPath();
  ctx.ellipse(0, -8, 9, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cabeza.
  ctx.beginPath();
  ctx.ellipse(-8, -15, 5.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Orejas largas.
  ctx.beginPath();
  ctx.ellipse(-10, -25, 2.2, 8, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-5, -25, 2.2, 8, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e7a9b8';
  ctx.beginPath();
  ctx.ellipse(-10, -24, 1, 5.5, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Colita + ojo.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(8, -8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(-10, -16, 1, 0, Math.PI * 2);
  ctx.fill();

  return toFrame(canvas, 32 / 40);
}

/** Venado: cuerpo café esbelto, patas largas, cuello alto — se agacha a pastar. */
function drawDeer(graze: boolean): CreatureFrame {
  const { canvas, ctx } = makeCanvas(44, 52);
  ctx.translate(20, graze ? 38 : 34);

  ctx.fillStyle = '#8a6339';

  // Patas — largas y delgadas.
  ctx.fillRect(-10, -2, 3, 14);
  ctx.fillRect(-2, -2, 3, 14);
  ctx.fillRect(6, -4, 3, 15);
  ctx.fillRect(12, -4, 3, 15);

  // Cuerpo.
  ctx.beginPath();
  ctx.ellipse(2, -8, 13, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cuello — más horizontal si está pastando.
  ctx.save();
  ctx.translate(-10, -12);
  ctx.rotate(graze ? -0.9 : -0.35);
  ctx.fillRect(-3, -9, 6, 14);
  ctx.restore();

  // Cabeza.
  const headY = graze ? -2 : -22;
  const headX = graze ? -18 : -15;
  ctx.beginPath();
  ctx.ellipse(headX, headY, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Orejas.
  ctx.beginPath();
  ctx.ellipse(headX - 1, headY - 5, 1.8, 3, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(headX + 3, headY - 5, 1.8, 3, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Colita + panza clara + ojo.
  ctx.fillStyle = '#e9d8bc';
  ctx.beginPath();
  ctx.ellipse(3, -6, 5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(14, -10, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(headX - 2, headY - 1, 0.9, 0, Math.PI * 2);
  ctx.fill();

  return toFrame(canvas, 44 / 52);
}

/** Pato: cuerpo ovalado claro, pico y patas naranjas. */
function drawDuck(paddle: boolean): CreatureFrame {
  const { canvas, ctx } = makeCanvas(40, 32);
  ctx.translate(20, 18);

  ctx.fillStyle = '#f5924a';
  ctx.beginPath();
  ctx.ellipse(paddle ? 6 : -6, 8, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cuerpo.
  ctx.fillStyle = '#faf6ec';
  ctx.beginPath();
  ctx.ellipse(0, 2, 13, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ala.
  ctx.fillStyle = '#e4dcc8';
  ctx.beginPath();
  ctx.ellipse(1, 2, 7, 4.5, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Cabeza + pico.
  ctx.fillStyle = '#faf6ec';
  ctx.beginPath();
  ctx.ellipse(-11, -6, 6, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5924a';
  ctx.beginPath();
  ctx.moveTo(-16, -6);
  ctx.lineTo(-22, -5);
  ctx.lineTo(-16, -3);
  ctx.fill();

  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(-12, -8, 1, 0, Math.PI * 2);
  ctx.fill();

  return toFrame(canvas, 40 / 32);
}

/** Pájaro pequeño en vuelo — alas arriba/abajo. */
function drawBird(color: string, wingsUp: boolean): CreatureFrame {
  const { canvas, ctx } = makeCanvas(36, 28);
  ctx.translate(18, 16);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(-8, -2, 4.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e8a23f';
  ctx.beginPath();
  ctx.moveTo(-12, -2);
  ctx.lineTo(-16, -1);
  ctx.lineTo(-12, 0);
  ctx.fill();

  // Alas — dos triángulos que apuntan arriba o abajo.
  ctx.fillStyle = color;
  const wingY = wingsUp ? -1 : 1;
  ctx.beginPath();
  ctx.moveTo(-1, -1);
  ctx.lineTo(9, -9 * wingY);
  ctx.lineTo(4, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(1, -1);
  ctx.lineTo(11, -10 * wingY);
  ctx.lineTo(6, 3);
  ctx.fill();

  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(-8, -3, 0.9, 0, Math.PI * 2);
  ctx.fill();

  return toFrame(canvas, 36 / 28);
}

/** Murciélago: silueta oscura, alas angulosas anchas. */
function drawBat(wingsUp: boolean): CreatureFrame {
  const { canvas, ctx } = makeCanvas(46, 30);
  ctx.translate(23, 15);

  ctx.fillStyle = '#1c1a22';

  const wingY = wingsUp ? -10 : -2;
  // Ala izquierda.
  ctx.beginPath();
  ctx.moveTo(-2, -1);
  ctx.lineTo(-20, wingY);
  ctx.lineTo(-14, 1);
  ctx.lineTo(-9, -2);
  ctx.lineTo(-4, 2);
  ctx.closePath();
  ctx.fill();
  // Ala derecha.
  ctx.beginPath();
  ctx.moveTo(2, -1);
  ctx.lineTo(20, wingY);
  ctx.lineTo(14, 1);
  ctx.lineTo(9, -2);
  ctx.lineTo(4, 2);
  ctx.closePath();
  ctx.fill();

  // Cuerpo + orejas.
  ctx.beginPath();
  ctx.ellipse(0, 0, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-3, -4);
  ctx.lineTo(-4, -9);
  ctx.lineTo(-1, -4);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(3, -4);
  ctx.lineTo(4, -9);
  ctx.lineTo(1, -4);
  ctx.fill();

  ctx.fillStyle = '#e0524a';
  ctx.beginPath();
  ctx.arc(-1.5, -1, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(1.5, -1, 0.8, 0, Math.PI * 2);
  ctx.fill();

  return toFrame(canvas, 46 / 30);
}

const speciesFrameCache = new Map<Species, CreatureFrame[]>();

function buildSpeciesFrames(species: Species): CreatureFrame[] {
  switch (species) {
    case 'huskyPup':
      return [drawHuskyPup(false), drawHuskyPup(true)];
    case 'squirrel':
      return [drawSquirrel(false), drawSquirrel(true)];
    case 'rabbit':
      return [drawRabbit(false), drawRabbit(true)];
    case 'duck':
      return [drawDuck(false), drawDuck(true)];
    case 'birdOrange':
      return [drawBird('#e8783c', true), drawBird('#e8783c', false)];
    case 'birdBlue':
      return [drawBird('#4f8fd6', true), drawBird('#4f8fd6', false)];
    case 'bat':
      return [drawBat(true), drawBat(false)];
    case 'deer':
      return [drawDeer(false), drawDeer(true)];
  }
}

/** Frames procedurales de una especie — generados una sola vez y
 * compartidos por todas las criaturas de ese tipo. */
function useSpeciesFrames(species: Species): CreatureFrame[] {
  return useMemo(() => {
    let frames = speciesFrameCache.get(species);
    if (!frames) {
      frames = buildSpeciesFrames(species);
      speciesFrameCache.set(species, frames);
    }
    return frames;
  }, [species]);
}

interface CreatureProps {
  def: CreatureDef;
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

/**
 * Criatura con IA de estados. La decisión se re-evalúa cada ~0.4s
 * (no cada frame, para que no tiemble entre estados) y depende de la
 * distancia al jugador + la personalidad del bicho:
 *
 *  - Muy cerca + miedoso  → flee (huye rápido, y sigue huyendo un rato)
 *  - Cerca   + curioso    → approach (se acerca hasta cierta distancia)
 *  - Voladores curiosos   → circle (orbita al jugador)
 *  - Sin jugador cerca    → wander / graze / idle según su humor
 */
const Creature: React.FC<CreatureProps> = React.memo(
  ({ def, playerPositionRef }) => {
    const groupRef = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);

    const frames = useSpeciesFrames(def.species);

    // Semilla determinista por criatura — evita Math.random en render
    // y hace que cada bicho tenga su propio ritmo.
    const seed = useMemo(() => {
      let h = 0;
      for (let i = 0; i < def.id.length; i += 1) {
        h = (h * 31 + def.id.charCodeAt(i)) % 1000;
      }
      return h / 1000;
    }, [def.id]);

    const rng = useRef(seed);
    const nextRandom = () => {
      rng.current = (rng.current * 9301 + 49297) % 233280 / 233280;
      return rng.current;
    };

    const state = useRef<AIState>('wander');
    const stateTimer = useRef(seed * 2);
    const decisionTimer = useRef(seed * 0.4);
    const target = useRef(new THREE.Vector3(def.home[0], 0, def.home[1]));
    const circleAngle = useRef(seed * Math.PI * 2);
    const frameIndex = useRef(0);
    const frameTimer = useRef(0);
    const facing = useRef(1);
    const velocity = useRef(0);

    /** Elige un destino nuevo dentro del radio de casa. */
    const wanderTarget = () => {
      const a = nextRandom() * Math.PI * 2;
      const d = (0.35 + nextRandom() * 0.65) * def.roamRadius;
      let x = def.home[0] + Math.cos(a) * d;
      let z = def.home[1] + Math.sin(a) * d;

      if (def.locomotion === 'swimmer') {
        // Los patos se quedan dentro del lago.
        const dc = Math.hypot(x - LAKE_CENTER[0], z - LAKE_CENTER[1]);
        if (dc > LAKE_RADIUS * 0.85) {
          const s = (LAKE_RADIUS * 0.8) / dc;
          x = LAKE_CENTER[0] + (x - LAKE_CENTER[0]) * s;
          z = LAKE_CENTER[1] + (z - LAKE_CENTER[1]) * s;
        }
      } else if (def.locomotion === 'ground') {
        // Los terrestres no se meten al agua.
        if (getWorldTerrainHeight(x, z) < WATER_LEVEL + 0.4) {
          x = def.home[0];
          z = def.home[1];
        }
      }

      target.current.set(x, 0, z);
    };

    useFrame((frameState, rawDelta) => {
      if (!groupRef.current || !meshRef.current || !materialRef.current) return;
      const delta = Math.min(rawDelta, 1 / 30);
      const pos = groupRef.current.position;
      const player = playerPositionRef.current;

      const dxp = pos.x - player.x;
      const dzp = pos.z - player.z;
      const distPlayer = Math.hypot(dxp, dzp);

      /* ---------- decidir estado ---------- */
      decisionTimer.current -= delta;
      stateTimer.current -= delta;

      if (decisionTimer.current <= 0) {
        decisionTimer.current = 0.35 + nextRandom() * 0.25;

        const aware = distPlayer < def.awareness;
        const tooClose = distPlayer < def.awareness * 0.35;

        if (aware && tooClose && def.curiosity < 0.5) {
          state.current = 'flee';
          stateTimer.current = 1.6 + nextRandom();
        } else if (aware && def.curiosity > 0.6) {
          // Curiosos: los voladores orbitan, los terrestres se acercan.
          state.current =
            def.locomotion === 'flyer' ? 'circle' : 'approach';
          stateTimer.current = 2.5 + nextRandom() * 2;
        } else if (state.current === 'flee' && stateTimer.current <= 0) {
          state.current = 'wander';
          wanderTarget();
        } else if (stateTimer.current <= 0) {
          // Sin jugador cerca: alterna deambular / pastar / quedarse quieto.
          const roll = nextRandom();
          if (def.locomotion === 'ground' && roll < 0.35) {
            state.current = 'graze';
            stateTimer.current = 2 + nextRandom() * 3;
          } else if (roll < 0.5) {
            state.current = 'idle';
            stateTimer.current = 1 + nextRandom() * 2;
          } else {
            state.current = 'wander';
            stateTimer.current = 3 + nextRandom() * 3;
            wanderTarget();
          }
        }
      }

      /* ---------- ejecutar estado ---------- */
      let desiredX = 0;
      let desiredZ = 0;
      let speedMul = 1;

      switch (state.current) {
        case 'flee': {
          const len = Math.max(0.001, distPlayer);
          desiredX = dxp / len;
          desiredZ = dzp / len;
          speedMul = 1.9;
          break;
        }

        case 'approach': {
          // Se acerca pero respeta un espacio personal.
          if (distPlayer > 2.2) {
            const len = Math.max(0.001, distPlayer);
            desiredX = -dxp / len;
            desiredZ = -dzp / len;
            speedMul = 1.25;
          }
          break;
        }

        case 'circle': {
          circleAngle.current += delta * 0.9;
          const orbitR = 3.5;
          const tx = player.x + Math.cos(circleAngle.current) * orbitR;
          const tz = player.z + Math.sin(circleAngle.current) * orbitR;
          const dx = tx - pos.x;
          const dz = tz - pos.z;
          const len = Math.max(0.001, Math.hypot(dx, dz));
          desiredX = dx / len;
          desiredZ = dz / len;
          speedMul = 1.1;
          break;
        }

        case 'wander': {
          const dx = target.current.x - pos.x;
          const dz = target.current.z - pos.z;
          const len = Math.hypot(dx, dz);
          if (len > 0.25) {
            desiredX = dx / len;
            desiredZ = dz / len;
            speedMul = 0.75;
          } else {
            state.current = 'idle';
            stateTimer.current = 1 + nextRandom() * 2;
          }
          break;
        }

        case 'graze':
        case 'idle':
        default:
          break;
      }

      const moving = desiredX !== 0 || desiredZ !== 0;

      // Aceleración suave en vez de arrancar/frenar de golpe.
      const targetVel = moving ? def.speed * speedMul : 0;
      velocity.current = THREE.MathUtils.damp(
        velocity.current,
        targetVel,
        6,
        delta,
      );

      if (moving) {
        pos.x += desiredX * velocity.current * delta;
        pos.z += desiredZ * velocity.current * delta;
        if (Math.abs(desiredX) > 0.05) {
          facing.current = desiredX >= 0 ? 1 : -1;
        }
      }

      // Los terrestres no se meten al lago aunque huyan.
      if (
        def.locomotion === 'ground' &&
        getWorldTerrainHeight(pos.x, pos.z) < WATER_LEVEL + 0.4
      ) {
        pos.x -= desiredX * velocity.current * delta * 1.2;
        pos.z -= desiredZ * velocity.current * delta * 1.2;
      }

      /* ---------- altura según locomoción ---------- */
      const t = frameState.clock.elapsedTime;
      const groundY = getWorldTerrainHeight(pos.x, pos.z);

      if (def.locomotion === 'flyer') {
        pos.y =
          Math.max(groundY, 0) +
          (def.flightY ?? 3) +
          Math.sin(t * 2.4 + seed * 6) * 0.35;
      } else if (def.locomotion === 'swimmer') {
        pos.y = WATER_LEVEL + 0.1 + Math.sin(t * 1.5 + seed * 4) * 0.05;
      } else {
        // Terrestre: pegado al relieve, con un brinquito al correr
        // (los conejos y ardillas se leen mucho mejor así).
        const hop =
          velocity.current > 0.4
            ? Math.abs(Math.sin(t * 9 + seed * 5)) * 0.13
            : 0;
        pos.y = groundY + hop;
      }

      /* ---------- animación de frames ---------- */
      if (frames.length > 1) {
        const dur =
          def.locomotion === 'flyer'
            ? 0.09
            : velocity.current > 0.4
              ? 0.14
              : 0.3;

        frameTimer.current += delta;
        if (frameTimer.current >= dur) {
          frameTimer.current -= dur;
          frameIndex.current = (frameIndex.current + 1) % frames.length;
        }
      }

      const frame = frames[frameIndex.current];

      if (materialRef.current.map !== frame.texture) {
        materialRef.current.map = frame.texture;
        materialRef.current.needsUpdate = true;
      }

      // Al pastar, el sprite se agacha un pelín — lectura clara de
      // "está comiendo" sin necesitar un frame dedicado.
      const crouch = state.current === 'graze' ? 0.88 : 1;

      meshRef.current.scale.x =
        facing.current * def.spriteHeight * frame.aspect;
      meshRef.current.scale.y = def.spriteHeight * crouch;
      meshRef.current.position.y = (def.spriteHeight * crouch) / 2;
      meshRef.current.quaternion.copy(frameState.camera.quaternion);
    });

    return (
      <group ref={groupRef} position={[def.home[0], 0, def.home[1]]}>
        <mesh ref={meshRef} castShadow>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial
            ref={materialRef}
            map={frames[0].texture}
            transparent
            alphaTest={0.3}
            side={THREE.DoubleSide}
            roughness={1}
            toneMapped={false}
          />
        </mesh>
      </group>
    );
  },
);

Creature.displayName = 'Creature';

interface WildlifeProps {
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

export const Wildlife: React.FC<WildlifeProps> = React.memo(
  ({ playerPositionRef }) => {
    return (
      <group>
        {CREATURES.map((def) => (
          <Creature
            key={def.id}
            def={def}
            playerPositionRef={playerPositionRef}
          />
        ))}
      </group>
    );
  },
);

Wildlife.displayName = 'Wildlife';

export default Wildlife;
