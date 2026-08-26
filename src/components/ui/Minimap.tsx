import React, { useEffect, useMemo, useRef } from 'react';
import {
  WORLD_HALF_SIZE,
  WATER_LEVEL,
  LAKE_CENTER,
  CAVE_CENTER,
  DOCK_POSITION,
  getWorldTerrainHeight,
} from '../../world/terrain';
import { usePlayerHudStore } from '../../store/player';

/** Puntos de interés que se marcan en el mapa. */
export const POIS: {
  id: string;
  label: string;
  x: number;
  z: number;
  color: string;
}[] = [
  { id: 'house', label: 'Casa', x: 0, z: 4.6, color: '#fdba74' },
  { id: 'camp', label: 'Campamento', x: 10.5, z: 6.5, color: '#fb923c' },
  { id: 'dock', label: 'Muelle', x: DOCK_POSITION[0], z: DOCK_POSITION[1], color: '#38bdf8' },
  { id: 'lake', label: 'Lago', x: LAKE_CENTER[0], z: LAKE_CENTER[1], color: '#22d3ee' },
  { id: 'cave', label: 'Cueva', x: CAVE_CENTER[0], z: CAVE_CENTER[1], color: '#a78bfa' },
  { id: 'garden', label: 'Jardín', x: 16.5, z: -7, color: '#fbbf24' },
  { id: 'cherry', label: 'Mirador', x: -16, z: -13.5, color: '#f9a8d4' },
  { id: 'ride', label: 'Rodadas', x: -7.5, z: 8, color: '#c4b5fd' },
];

const SIZE = 132;

const SAMPLES = 66;

/** Zona en la que está el jugador ahora — para el rótulo del HUD. */
export function currentZoneLabel(x: number, z: number): string {
  let best = 'Praderas';
  let bestD = Infinity;

  for (const p of POIS) {
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < 9 && d < bestD) {
      bestD = d;
      best = p.label;
    }
  }

  if (bestD === Infinity) {
    if (Math.hypot(x, z) > 30) return 'Bosque profundo';
    if (getWorldTerrainHeight(x, z) > 5) return 'Cordillera';
  }

  return best;
}

/**
 * Minimapa: el terreno se rasteriza UNA sola vez a un canvas offscreen
 * (es determinista), y encima se dibuja el punto del jugador en cada
 * actualización — así no se recalcula el mapa 10 veces por segundo.
 */
export const Minimap: React.FC = () => {
  const x = usePlayerHudStore((s) => s.x);
  const z = usePlayerHudStore((s) => s.z);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const terrainLayer = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = SAMPLES;
    c.height = SAMPLES;
    const ctx = c.getContext('2d');
    if (!ctx) return c;

    const img = ctx.createImageData(SAMPLES, SAMPLES);

    for (let j = 0; j < SAMPLES; j += 1) {
      for (let i = 0; i < SAMPLES; i += 1) {
        const wx = (i / (SAMPLES - 1)) * WORLD_HALF_SIZE * 2 - WORLD_HALF_SIZE;
        const wz = (j / (SAMPLES - 1)) * WORLD_HALF_SIZE * 2 - WORLD_HALF_SIZE;
        const h = getWorldTerrainHeight(wx, wz);
        const o = (j * SAMPLES + i) * 4;

        if (h < WATER_LEVEL) {
          img.data[o] = 40;
          img.data[o + 1] = 96;
          img.data[o + 2] = 150;
        } else {
          const t = Math.min(1, Math.max(0, (h + 4) / 14));
          img.data[o] = 30 + t * 70;
          img.data[o + 1] = 70 + t * 80;
          img.data[o + 2] = 28 + t * 45;
        }
        img.data[o + 3] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);
    return c;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(terrainLayer, 0, 0, SIZE, SIZE);

    const toPx = (wx: number, wz: number) => [
      ((wx + WORLD_HALF_SIZE) / (WORLD_HALF_SIZE * 2)) * SIZE,
      ((wz + WORLD_HALF_SIZE) / (WORLD_HALF_SIZE * 2)) * SIZE,
    ];

    POIS.forEach((p) => {
      const [px, py] = toPx(p.x, p.z);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    const [px, py] = toPx(x, z);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(px, py, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, [x, z, terrainLayer]);

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      style={{
        width: `${SIZE}px`,
        height: `${SIZE}px`,
        borderRadius: '12px',
        display: 'block',
      }}
    />
  );
};

export default Minimap;
