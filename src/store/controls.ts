import { create } from 'zustand';

interface KeyboardState {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  interact: boolean;
}

interface TouchState {
  x: number;
  z: number;
  interact: boolean;
}

interface ControlsStore {
  keyboard: KeyboardState;
  touch: TouchState;
  setKeyboardKey: (key: keyof KeyboardState, value: boolean) => void;
  setTouchAxis: (x: number, z: number) => void;
  setTouchInteract: (value: boolean) => void;
}

/**
 * Estado de controles combinado (teclado + joystick táctil). Player lee
 * esto vía getState() dentro de useFrame (transient updates de zustand)
 * en vez de suscribirse reactivamente, así el drag del joystick a 60fps
 * no dispara re-renders de React.
 */
export const useControlsStore = create<ControlsStore>((set) => ({
  keyboard: {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    interact: false,
  },
  touch: {
    x: 0,
    z: 0,
    interact: false,
  },
  setKeyboardKey: (key, value) =>
    set((state) => ({ keyboard: { ...state.keyboard, [key]: value } })),
  setTouchAxis: (x, z) => set((state) => ({ touch: { ...state.touch, x, z } })),
  setTouchInteract: (value) =>
    set((state) => ({ touch: { ...state.touch, interact: value } })),
}));
