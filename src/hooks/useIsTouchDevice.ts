import { useState } from 'react';

function detectTouch(): boolean {
  if (typeof window === 'undefined') return false;

  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return coarse || hasTouch;
}

/** Detecta un dispositivo táctil/coarse-pointer para mostrar el joystick en vez del hint de teclado. */
export function useIsTouchDevice(): boolean {
  const [isTouch] = useState(detectTouch);
  return isTouch;
}
