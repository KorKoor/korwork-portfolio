import { useEffect, useState } from 'react';

export const useKeyboardControls = () => {
  const [movement, setMovement] = useState({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    interact: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setMovement((m) => ({ ...m, moveForward: true }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setMovement((m) => ({ ...m, moveBackward: true }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setMovement((m) => ({ ...m, moveLeft: true }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setMovement((m) => ({ ...m, moveRight: true }));
          break;
        case 'KeyE':
        case 'Space':
          setMovement((m) => ({ ...m, interact: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setMovement((m) => ({ ...m, moveForward: false }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setMovement((m) => ({ ...m, moveBackward: false }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setMovement((m) => ({ ...m, moveLeft: false }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setMovement((m) => ({ ...m, moveRight: false }));
          break;
        case 'KeyE':
        case 'Space':
          setMovement((m) => ({ ...m, interact: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return movement;
};