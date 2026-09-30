import { create } from 'zustand';

interface VitalsState {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  isExhausted: boolean;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  drainStamina: (amount: number) => void;
  regenStamina: (amount: number) => void;
}

const MAX_HEALTH = 100;

const MAX_STAMINA = 100;

const EXHAUSTED_THRESHOLD = 8;

const RECOVER_THRESHOLD = 20;

/**
 * Salud y stamina del mundo exterior. Vive en zustand (no en Player,
 * que ya lee/escribe controles por getState() en useFrame) para que
 * el HUD pueda suscribirse reactivamente sin que Player tenga que
 * levantar callbacks para cada número.
 */
export const useVitalsStore = create<VitalsState>((set, get) => ({
  health: MAX_HEALTH,
  maxHealth: MAX_HEALTH,
  stamina: MAX_STAMINA,
  maxStamina: MAX_STAMINA,
  isExhausted: false,

  takeDamage: (amount) =>
    set((state) => ({
      health: Math.max(0, state.health - amount),
    })),

  heal: (amount) =>
    set((state) => ({
      health: Math.min(state.maxHealth, state.health + amount),
    })),

  drainStamina: (amount) => {
    const next = Math.max(0, get().stamina - amount);
    const wasExhausted = get().isExhausted;

    set({
      stamina: next,
      isExhausted: wasExhausted
        ? next < RECOVER_THRESHOLD
        : next < EXHAUSTED_THRESHOLD,
    });
  },

  regenStamina: (amount) => {
    const next = Math.min(get().maxStamina, get().stamina + amount);
    const wasExhausted = get().isExhausted;

    set({
      stamina: next,
      isExhausted: wasExhausted
        ? next < RECOVER_THRESHOLD
        : next < EXHAUSTED_THRESHOLD,
    });
  },
}));
