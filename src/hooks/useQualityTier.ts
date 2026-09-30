import { useMemo } from 'react';

/* ============================================================
   NIVEL DE CALIDAD
   ============================================================
   Detección barata y de una sola vez (no monitoreo de FPS en vivo,
   eso es una capa aparte que no existe todavía) para que el juego
   "funcione en todos lados": sombras suaves de 4K, MSAA x4 y DPR de
   retina se ven geniales en una laptop/desktop, pero son exactamente
   el tipo de costo que hace que un celular de gama media caiga a
   15fps o pierda el contexto de WebGL.

   La señal es conservadora a propósito: cualquier dispositivo táctil
   (pointer grueso) o con pocos núcleos/poca RAM cae a 'low'. El
   contenido es el mismo en ambos niveles — solo cambia la resolución
   de sombras, el MSAA del post-proceso y el DPR — así que nada se ve
   "peor", se ve la misma escena a una fracción del costo de GPU.
============================================================ */

export type QualityTier = 'high' | 'low';

function detectQualityTier(): QualityTier {
  if (typeof navigator === 'undefined') return 'high';

  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8;
  const coarsePointer =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;

  if (cores <= 4 || memory <= 4 || coarsePointer) return 'low';
  return 'high';
}

export function useQualityTier(): QualityTier {
  return useMemo(() => detectQualityTier(), []);
}
