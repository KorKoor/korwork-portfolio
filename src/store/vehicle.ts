import { create } from 'zustand';

interface VehicleState {
  multiplier: number;
  label: string | null;
  expiresAt: number;
  setBoost: (multiplier: number, label: string, durationMs: number) => void;
}

/**
 * "Subirse" a la bici/patineta del mundo exterior no modela una
 * mecánica de montar completa (eso implicaría re-animar al
 * personaje sentado/rodando) — en su lugar da un boost de velocidad
 * temporal, real y medible, que Player.tsx lee en cada frame vía
 * getState(). Vencido el tiempo, vuelve solo a 1x.
 */
export const useVehicleStore = create<VehicleState>((set) => ({
  multiplier: 1,
  label: null,
  expiresAt: 0,
  setBoost: (multiplier, label, durationMs) =>
    set({ multiplier, label, expiresAt: Date.now() + durationMs }),
}));

export function getActiveSpeedMultiplier(): number {
  const state = useVehicleStore.getState();
  if (Date.now() > state.expiresAt) return 1;
  return state.multiplier;
}
