import { create } from 'zustand';
import * as THREE from 'three';

/* ============================================================
   ATMÓSFERA — hora del día, clima y viento
   ============================================================

   Este es el "reloj" del que cuelga todo lo demás: iluminación,
   color del cielo, niebla, partículas, audio ambiental, el balanceo
   de la vegetación y hasta el comportamiento de los animales.

   Vive en un store de zustand pero se LEE con getState() dentro de
   useFrame (no por suscripción) en todo lo que corre a 60fps; solo
   el HUD se suscribe de verdad, y a través de valores redondeados
   para no re-renderizar React cada frame.
============================================================ */

export type WeatherKind = 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog';

export interface SkyPalette {
  zenith: THREE.Color;
  horizon: THREE.Color;
  sun: THREE.Color;
  ambient: THREE.Color;
  ground: THREE.Color;
  fog: THREE.Color;
  sunIntensity: number;
  ambientIntensity: number;
  fogNear: number;
  fogFar: number;
}

/** Duración de un día completo en segundos de tiempo real. */
export const DAY_LENGTH = 300;

interface AtmosphereState {
  /** 0..1 — 0 = medianoche, 0.25 = amanecer, 0.5 = mediodía, 0.75 = atardecer. */
  time: number;
  weather: WeatherKind;
  /** 0..1, sube/baja suavemente al cambiar de clima. */
  weatherBlend: number;
  windStrength: number;
  windAngle: number;
  paused: boolean;

  setTime: (t: number) => void;
  setWeather: (w: WeatherKind) => void;
  advance: (dt: number) => void;
}

/** Secuencia de climas: no es aleatoria pura, sigue transiciones creíbles. */
const WEATHER_CHAIN: Record<WeatherKind, WeatherKind[]> = {
  clear: ['clear', 'clear', 'cloudy', 'fog'],
  cloudy: ['cloudy', 'clear', 'rain', 'rain'],
  rain: ['rain', 'storm', 'cloudy', 'cloudy'],
  storm: ['storm', 'rain', 'rain'],
  fog: ['fog', 'clear', 'cloudy'],
};

let weatherTimer = 55;

let targetWeather: WeatherKind = 'clear';

export const useAtmosphereStore = create<AtmosphereState>((set, get) => ({
  // Arranca a media mañana: luz bonita y legible desde el primer frame.
  time: 0.34,
  weather: 'clear',
  weatherBlend: 1,
  windStrength: 0.45,
  windAngle: 0.6,
  paused: false,

  setTime: (t) => set({ time: ((t % 1) + 1) % 1 }),

  setWeather: (w) => {
    targetWeather = w;
    set({ weather: w, weatherBlend: 0 });
  },

  advance: (dt) => {
    const s = get();
    if (s.paused) return;

    const time = (s.time + dt / DAY_LENGTH) % 1;

    // Ráfagas de viento: una onda lenta + una rápida, más fuerte
    // cuanto peor esté el clima.
    const base =
      s.weather === 'storm'
        ? 1.5
        : s.weather === 'rain'
          ? 0.9
          : s.weather === 'cloudy'
            ? 0.6
            : 0.35;

    const t = performance.now() / 1000;
    const gust =
      base *
      (0.75 +
        Math.sin(t * 0.23) * 0.18 +
        Math.sin(t * 0.71 + 1.3) * 0.12);

    const windAngle = s.windAngle + Math.sin(t * 0.07) * 0.0016;

    let { weather, weatherBlend } = s;

    weatherTimer -= dt;

    if (weatherTimer <= 0) {
      // Nuevo clima elegido con una cadena de transiciones: nunca se
      // pasa de sol radiante a tormenta de golpe.
      const options = WEATHER_CHAIN[weather];
      const pick = options[Math.floor(Math.random() * options.length)];
      targetWeather = pick;
      weatherTimer = 45 + Math.random() * 60;
      if (pick !== weather) weatherBlend = 0;
      weather = pick;
    }

    if (weatherBlend < 1) {
      weatherBlend = Math.min(1, weatherBlend + dt / 6);
    }

    set({ time, windStrength: gust, windAngle, weather, weatherBlend });
  },
}));

/** Clima al que estamos transicionando (para mezclar paletas). */
export function getTargetWeather(): WeatherKind {
  return targetWeather;
}

// Consola de QA en desarrollo: permite forzar hora y clima para
// revisar la dirección artística sin esperar el ciclo completo.
//   __atmo.setState({ paused: true, time: 0.9, weather: 'storm' })
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { __atmo?: unknown }).__atmo = useAtmosphereStore;
}

/* ============================================================
   PALETAS — la "dirección de arte" del ciclo día/noche
============================================================ */

interface Keyframe {
  at: number;
  zenith: string;
  horizon: string;
  sun: string;
  ambient: string;
  ground: string;
  fog: string;
  sunIntensity: number;
  ambientIntensity: number;
}

/**
 * Keyframes del día. Los colores están elegidos para leerse bien con
 * el pixel-art del juego: nada de grises lavados, siempre con un
 * matiz (azul frío de noche, ámbar al atardecer).
 */
const DAY_KEYS: Keyframe[] = [
  // NOCHE. La clave de una noche de fantasía legible (la referencia)
  // es que NO sea negra: la luna aporta una direccional azul fuerte y
  // el ambiente tiene un suelo alto y saturado en azul-cian. Sin esto
  // el mundo se convierte en una silueta negra y solo se ven las
  // luces cálidas flotando en el vacío.
  { at: 0.00, zenith: '#0b1430', horizon: '#1d2c55', sun: '#8fb0ee', ambient: '#4d6099', ground: '#16241f', fog: '#1a2647', sunIntensity: 0.95, ambientIntensity: 0.62 },
  { at: 0.20, zenith: '#1f2c5e', horizon: '#4f4676', sun: '#b096d0', ambient: '#5a5f95', ground: '#1e2a24', fog: '#33355a', sunIntensity: 1.0, ambientIntensity: 0.62 },
  { at: 0.27, zenith: '#3c5b96', horizon: '#f0a066', sun: '#ffc48a', ambient: '#7d8fb8', ground: '#2a3324', fog: '#8f8296', sunIntensity: 1.75, ambientIntensity: 0.55 },
  { at: 0.38, zenith: '#5f9fd6', horizon: '#bfe0ef', sun: '#fff3d8', ambient: '#a8c4e0', ground: '#33471f', fog: '#b7d3dd', sunIntensity: 2.55, ambientIntensity: 0.46 },
  { at: 0.50, zenith: '#6fb2e6', horizon: '#d6ecf6', sun: '#ffffff', ambient: '#bcd6ec', ground: '#3a5122', fog: '#c8e0e8', sunIntensity: 2.9, ambientIntensity: 0.50 },
  { at: 0.64, zenith: '#5c9ad2', horizon: '#e8d2a8', sun: '#fff0cc', ambient: '#adc6de', ground: '#354a20', fog: '#c2cfc4', sunIntensity: 2.5, ambientIntensity: 0.46 },
  { at: 0.75, zenith: '#3a4f8e', horizon: '#f08a52', sun: '#ffb070', ambient: '#8a7fac', ground: '#2c3320', fog: '#9c7c86', sunIntensity: 1.7, ambientIntensity: 0.52 },
  { at: 0.82, zenith: '#1e2a58', horizon: '#5f4372', sun: '#a186c4', ambient: '#525b90', ground: '#1b2620', fog: '#373459', sunIntensity: 1.05, ambientIntensity: 0.6 },
  { at: 1.00, zenith: '#0b1430', horizon: '#1d2c55', sun: '#8fb0ee', ambient: '#4d6099', ground: '#16241f', fog: '#1a2647', sunIntensity: 0.95, ambientIntensity: 0.62 },
];

/** Cómo cada clima modifica la paleta base del día. */
interface WeatherMod {
  desaturate: number;
  darken: number;
  fogTint: string;
  fogAmount: number;
  sunScale: number;
  ambientScale: number;
}

const WEATHER_MODS: Record<WeatherKind, WeatherMod> = {
  clear: { desaturate: 0, darken: 0, fogTint: '#b7d3dd', fogAmount: 0, sunScale: 1, ambientScale: 1 },
  cloudy: { desaturate: 0.28, darken: 0.14, fogTint: '#9fb0b8', fogAmount: 0.3, sunScale: 0.62, ambientScale: 1.18 },
  rain: { desaturate: 0.45, darken: 0.3, fogTint: '#7d8f99', fogAmount: 0.55, sunScale: 0.34, ambientScale: 1.28 },
  storm: { desaturate: 0.55, darken: 0.45, fogTint: '#5d6a76', fogAmount: 0.72, sunScale: 0.2, ambientScale: 1.3 },
  fog: { desaturate: 0.4, darken: 0.12, fogTint: '#c3cbc8', fogAmount: 0.9, sunScale: 0.5, ambientScale: 1.35 },
};

const _a = new THREE.Color();
const _b = new THREE.Color();

function lerpKey(out: THREE.Color, from: string, to: string, t: number) {
  _a.set(from);
  _b.set(to);
  out.copy(_a).lerp(_b, t);
}

function desaturate(c: THREE.Color, amount: number) {
  const l = c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
  c.r += (l - c.r) * amount;
  c.g += (l - c.g) * amount;
  c.b += (l - c.b) * amount;
}

const _palette: SkyPalette = {
  zenith: new THREE.Color(),
  horizon: new THREE.Color(),
  sun: new THREE.Color(),
  ambient: new THREE.Color(),
  ground: new THREE.Color(),
  fog: new THREE.Color(),
  sunIntensity: 1,
  ambientIntensity: 0.4,
  fogNear: 40,
  fogFar: 120,
};

/**
 * Paleta resultante para un instante y clima dados. Devuelve SIEMPRE
 * el mismo objeto mutado — se llama cada frame y no queremos generar
 * basura para el GC.
 */
export function evaluateSky(
  time: number,
  weather: WeatherKind,
  blend: number,
): SkyPalette {
  let i = 0;
  while (i < DAY_KEYS.length - 2 && DAY_KEYS[i + 1].at < time) i += 1;

  const k0 = DAY_KEYS[i];
  const k1 = DAY_KEYS[i + 1];
  const span = Math.max(0.0001, k1.at - k0.at);
  const t = THREE.MathUtils.clamp((time - k0.at) / span, 0, 1);
  // Suavizado para que los cambios de luz no tengan "esquinas".
  const ts = t * t * (3 - 2 * t);

  lerpKey(_palette.zenith, k0.zenith, k1.zenith, ts);
  lerpKey(_palette.horizon, k0.horizon, k1.horizon, ts);
  lerpKey(_palette.sun, k0.sun, k1.sun, ts);
  lerpKey(_palette.ambient, k0.ambient, k1.ambient, ts);
  lerpKey(_palette.ground, k0.ground, k1.ground, ts);
  lerpKey(_palette.fog, k0.fog, k1.fog, ts);

  _palette.sunIntensity = THREE.MathUtils.lerp(k0.sunIntensity, k1.sunIntensity, ts);
  _palette.ambientIntensity = THREE.MathUtils.lerp(k0.ambientIntensity, k1.ambientIntensity, ts);

  // Aplicar el clima encima, mezclado por `blend` para que la
  // transición entre climas sea gradual.
  const mod = WEATHER_MODS[weather];
  const w = THREE.MathUtils.clamp(blend, 0, 1);

  const desat = mod.desaturate * w;
  const dark = mod.darken * w;

  [_palette.zenith, _palette.horizon, _palette.sun, _palette.ambient, _palette.ground].forEach(
    (c) => {
      desaturate(c, desat);
      c.multiplyScalar(1 - dark);
    },
  );

  _b.set(mod.fogTint);
  _palette.fog.lerp(_b, mod.fogAmount * w * 0.7);
  desaturate(_palette.fog, desat * 0.5);
  _palette.fog.multiplyScalar(1 - dark * 0.6);

  _palette.sunIntensity *= THREE.MathUtils.lerp(1, mod.sunScale, w);
  _palette.ambientIntensity *= THREE.MathUtils.lerp(1, mod.ambientScale, w);

  // La niebla se cierra con el mal tiempo y de noche.
  const night = 1 - Math.min(1, Math.abs(time - 0.5) * 3.2);
  const closeness = THREE.MathUtils.lerp(0, 1, mod.fogAmount * w) * 0.75 + (1 - night) * 0.15;
  _palette.fogNear = THREE.MathUtils.lerp(52, 12, closeness);
  _palette.fogFar = THREE.MathUtils.lerp(135, 48, closeness);

  return _palette;
}

/** Dirección del sol (o la luna) en el cielo para la hora dada. */
export function getSunDirection(time: number, out: THREE.Vector3): THREE.Vector3 {
  // El sol sale por el este (+X) a t=0.25 y se pone al oeste a 0.75.
  const angle = (time - 0.25) * Math.PI * 2;
  out.set(Math.cos(angle), Math.sin(angle), -0.35).normalize();
  return out;
}

/** 0 de día, 1 de noche cerrada — usado por luces, audio y fauna. */
export function getNightFactor(time: number): number {
  const day = THREE.MathUtils.clamp((Math.sin((time - 0.25) * Math.PI * 2) + 0.18) * 2.2, 0, 1);
  return 1 - day;
}

/** Intensidad de lluvia 0..1 según el clima actual. */
export function getRainAmount(weather: WeatherKind, blend: number): number {
  const base = weather === 'storm' ? 1 : weather === 'rain' ? 0.6 : 0;
  return base * THREE.MathUtils.clamp(blend, 0, 1);
}

export function weatherLabel(w: WeatherKind): string {
  switch (w) {
    case 'clear':
      return 'Despejado';
    case 'cloudy':
      return 'Nublado';
    case 'rain':
      return 'Lluvia';
    case 'storm':
      return 'Tormenta';
    case 'fog':
      return 'Niebla';
  }
}

/** Hora legible tipo 06:30 a partir del tiempo normalizado. */
export function clockLabel(time: number): string {
  const totalMinutes = Math.floor(time * 24 * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(Math.floor(m / 5) * 5).padStart(2, '0')}`;
}
