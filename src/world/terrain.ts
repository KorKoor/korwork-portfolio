/**
 * Altura del terreno exterior — fuente única de verdad, compartida
 * por la malla visual (Terrain.tsx), el movimiento del jugador
 * (Player.tsx) y la fauna (Wildlife.tsx), así lo que se ve y lo que
 * se camina nunca se desincronizan.
 *
 * Suma de senoides deterministas (sin librería de ruido) para lomas,
 * más "features" con forma propia: la meseta de la casa, el valle de
 * la cueva, la cuenca del lago y una cordillera al norte.
 */

export const WORLD_HALF_SIZE = 42;

export const HOUSE_PLATFORM_RADIUS = 10;

export const CAVE_CENTER: [number, number] = [-24, 17];

export const CAVE_VALLEY_RADIUS = 9;

/** Centro y radio del lago — la superficie de agua se dibuja a WATER_LEVEL. */
export const LAKE_CENTER: [number, number] = [21, 17];

export const LAKE_RADIUS = 9.5;

export const WATER_LEVEL = -1.5;

/** Muelle de pesca: se para en la orilla sur del lago. */
export const DOCK_POSITION: [number, number] = [17.5, 10.5];

/** Rincón de la cascada — ver Waterfall.tsx. */
export const WATERFALL_POS: [number, number] = [-27, -22];

/**
 * Meseta del mirador de cerezos: una terraza REAL, no una loma
 * suave — plana arriba, con un acantilado alrededor que solo se
 * puede subir por un corredor angosto (donde ya llega el camino de
 * tierra 'house-cherry' en paths.ts). Fuera de ese corredor la
 * pendiente supera MAX_CLIMB_SLOPE a propósito: el jugador la ve,
 * pero tiene que rodear hasta la entrada para subir.
 */
export const CHERRY_PLATEAU_CENTER: [number, number] = [-16.4, -12.5];

export const CHERRY_PLATEAU_RADIUS = 6.2;

const CHERRY_PLATEAU_HEIGHT = 3.4;

// Ángulo (rad) del corredor de subida, apuntando desde la meseta
// hacia la casa — el camino ya se acerca por ese lado.
const CHERRY_CORRIDOR_ANGLE = Math.atan2(
  0 - CHERRY_PLATEAU_CENTER[1],
  0 - CHERRY_PLATEAU_CENTER[0],
);

const CHERRY_CORRIDOR_HALF_WIDTH = 0.62; // rad

function smoothstep(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/** 1 en el centro → 0 en el borde. */
function falloff(distance: number, radius: number): number {
  return 1 - smoothstep(distance / radius);
}

/**
 * Relieve base. Amplitudes deliberadamente grandes (±4-5 unidades):
 * con la cámara casi rasante del juego, lomas de ±1 se leían
 * completamente planas en pantalla.
 */
function baseRelief(x: number, z: number): number {
  return (
    Math.sin(x * 0.075) * Math.cos(z * 0.085) * 2.6 +
    Math.sin(x * 0.042 + z * 0.036) * 2.1 +
    Math.cos(x * 0.13 - z * 0.10) * 1.05 +
    Math.sin((x + z) * 0.19) * 0.5 +
    Math.cos(x * 0.27 + z * 0.23) * 0.28
  );
}

export function getWorldTerrainHeight(x: number, z: number): number {
  let h = baseRelief(x, z);

  // Cordillera al norte: pared natural que cierra el mapa por arriba
  // en vez de un borde invisible seco.
  const ridge = smoothstep((-z - 20) / 12);
  h += ridge * 11;

  // Colinas al este y oeste, más suaves, para que el mapa se sienta
  // contenido en un valle.
  const eastWest = smoothstep((Math.abs(x) - 24) / 12);
  h += eastWest * 7;

  // Cuenca del lago: hondonada amplia que baja por debajo del nivel
  // del agua para que el agua realmente se vea "metida".
  const dLake = Math.hypot(x - LAKE_CENTER[0], z - LAKE_CENTER[1]);
  const lakeDip = falloff(dLake, LAKE_RADIUS * 1.5);
  h = h * (1 - lakeDip * 0.85) - lakeDip * 3.4;

  // Meseta plana bajo la casa, con transición suave a las lomas.
  const dHouse = Math.hypot(x, z);
  const houseFlat = falloff(dHouse, HOUSE_PLATFORM_RADIUS);
  h = h * (1 - houseFlat) + 0.15 * houseFlat;

  // Valle hundido hacia la boca de la cueva.
  const dCave = Math.hypot(x - CAVE_CENTER[0], z - CAVE_CENTER[1]);
  h -= falloff(dCave, CAVE_VALLEY_RADIUS) * 3.2;

  // Cordillera perimetral: una pared de montaña real que encierra
  // TODO el mapa jugable, no solo el norte/este/oeste que ya tenían
  // su propio relieve. Antes el sur (y las esquinas) se quedaban
  // relativamente planos — nada detenía al jugador salvo un límite
  // invisible en X/Z. Empieza a 9 unidades del borde y sube fuerte,
  // así la pendiente ahí supera MAX_CLIMB_SLOPE por sí sola: el
  // límite del mundo ahora se VE (y se siente) como una cordillera,
  // no como una pared de cristal.
  const distFromCenter = Math.hypot(x, z);
  const rim = smoothstep((distFromCenter - (WORLD_HALF_SIZE - 9)) / 9);
  h += rim * 18;

  // Meseta del mirador — plana arriba, acantilado alrededor salvo en
  // el corredor de subida (ver comentario junto a las constantes).
  const dxCherry = x - CHERRY_PLATEAU_CENTER[0];
  const dzCherry = z - CHERRY_PLATEAU_CENTER[1];
  const dCherry = Math.hypot(dxCherry, dzCherry);

  let angleDelta =
    Math.atan2(dzCherry, dxCherry) - CHERRY_CORRIDOR_ANGLE;
  angleDelta =
    ((angleDelta + Math.PI) % (Math.PI * 2)) - Math.PI;

  const inCorridor = smoothstep(
    1 - Math.abs(angleDelta) / CHERRY_CORRIDOR_HALF_WIDTH,
  );

  // Banda de transición angosta (acantilado) en general, ancha
  // (rampa subible) dentro del corredor.
  const band = 0.55 + (3.4 - 0.55) * inCorridor;
  const edge = dCherry - CHERRY_PLATEAU_RADIUS;
  const plateauT = 1 - smoothstep(edge / band + 0.5);

  h = h + plateauT * CHERRY_PLATEAU_HEIGHT;

  return h;
}

/** Pendiente aproximada (Δaltura por unidad horizontal). */
export function getWorldSlope(x: number, z: number): number {
  const e = 0.4;
  const hL = getWorldTerrainHeight(x - e, z);
  const hR = getWorldTerrainHeight(x + e, z);
  const hD = getWorldTerrainHeight(x, z - e);
  const hU = getWorldTerrainHeight(x, z + e);
  return Math.hypot(hR - hL, hU - hD) / (2 * e);
}

/** Normal del terreno — para orientar la sombra del jugador y sombrear la malla. */
export function getWorldNormal(x: number, z: number): [number, number, number] {
  const e = 0.4;
  const dx = getWorldTerrainHeight(x + e, z) - getWorldTerrainHeight(x - e, z);
  const dz = getWorldTerrainHeight(x, z + e) - getWorldTerrainHeight(x, z - e);
  const len = Math.hypot(-dx, 2 * e, -dz);
  return [-dx / len, (2 * e) / len, -dz / len];
}

export function isUnderWater(x: number, z: number): boolean {
  return getWorldTerrainHeight(x, z) < WATER_LEVEL;
}

/** Pendiente máxima que el jugador puede escalar; más empinado que esto lo detiene. */
export const MAX_CLIMB_SLOPE = 1.9;
