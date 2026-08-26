/* ============================================================
   CÁMARA ORBITAL — estado
   ============================================================
   Todo lo que el usuario controla arrastrando/haciendo scroll:
   rotación (yaw), inclinación (pitch) y zoom, MÁS un desplazamiento
   sobre el ángulo/distancia base que ya usaba el CameraRig fijo.

   Vive fuera de React (mismo patrón que store/controls.ts) porque
   se escribe en cada pointermove/wheel y se lee en cada useFrame —
   meterlo en estado de React dispararía un render por cada pixel
   de arrastre.
============================================================ */

export interface OrbitState {
  /** Rotación adicional alrededor del jugador, en radianes. 0 = detrás del jugador (comportamiento original). */
  yaw: number;
  /** Inclinación adicional sobre el ángulo base, en radianes. Positivo = más cenital. */
  pitch: number;
  /** Multiplicador de distancia/zoom respecto al encuadre base. 1 = el zoom original. */
  zoom: number;
  /** true mientras el usuario está arrastrando activamente (para pausar el damping "hacia cero"). */
  dragging: boolean;
}

export const orbitState: OrbitState = {
  yaw: 0,
  pitch: 0,
  zoom: 1,
  dragging: false,
};

export const ORBIT_PITCH_MIN = -0.34; // ~-19° — no dejar que se acueste demasiado (rompe la lectura 2.5D)
export const ORBIT_PITCH_MAX = 0.62; // ~+35° sobre el ángulo base — evita caer en top-down puro

export const ORBIT_ZOOM_MIN = 0.5;
export const ORBIT_ZOOM_MAX = 2.4;

export function clampOrbit(): void {
  orbitState.pitch = Math.min(
    ORBIT_PITCH_MAX,
    Math.max(ORBIT_PITCH_MIN, orbitState.pitch),
  );
  orbitState.zoom = Math.min(
    ORBIT_ZOOM_MAX,
    Math.max(ORBIT_ZOOM_MIN, orbitState.zoom),
  );
}

/** Vuelve suavemente (se llama desde useFrame, no de golpe) al encuadre por defecto. */
export function recenterOrbit(): void {
  orbitState.yaw = 0;
  orbitState.pitch = 0;
  orbitState.zoom = 1;
}
