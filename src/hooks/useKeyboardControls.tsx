import { useEffect } from 'react';
import { useControlsStore } from '../store/controls';

const KEY_MAP: Record<string, 'moveForward' | 'moveBackward' | 'moveLeft' | 'moveRight' | 'interact'> = {
  KeyW: 'moveForward',
  ArrowUp: 'moveForward',
  KeyS: 'moveBackward',
  ArrowDown: 'moveBackward',
  KeyA: 'moveLeft',
  ArrowLeft: 'moveLeft',
  KeyD: 'moveRight',
  ArrowRight: 'moveRight',
  KeyE: 'interact',
  Space: 'interact',
};

/**
 * Escucha el teclado y escribe directo al store de controles (sin
 * useState): evita re-renders en cada tecla, Player lee el resultado
 * combinado (teclado + touch) vía getState() dentro de useFrame.
 */
export const useKeyboardControls = () => {
  useEffect(() => {
    const setKey = useControlsStore.getState().setKeyboardKey;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = KEY_MAP[e.code];
      if (key) setKey(key, true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = KEY_MAP[e.code];
      if (key) setKey(key, false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
};
