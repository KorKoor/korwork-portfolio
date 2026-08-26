import { create } from 'zustand';

interface PlayerHudState {
  x: number;
  z: number;
  setPosition: (x: number, z: number) => void;
}

/**
 * Posición del jugador expuesta al HUD (minimapa, brújula, nombre de
 * zona). Se actualiza con throttle desde Scene — el bucle de render
 * NO escribe aquí cada frame, porque esto sí dispara re-renders de
 * React.
 */
export const usePlayerHudStore = create<PlayerHudState>((set) => ({
  x: 0,
  z: 0,
  setPosition: (x, z) => set({ x, z }),
}));
