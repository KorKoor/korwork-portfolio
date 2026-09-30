import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import {
  orbitState,
  clampOrbit,
  recenterOrbit,
} from '../../store/cameraOrbit';

/* ============================================================
   INPUT DE CÁMARA ORBITAL
   ============================================================
   Traduce gestos de mouse/touch a orbitState (yaw/pitch/zoom). No
   toca camera.position directamente — eso lo sigue haciendo
   CameraRig cada frame con damping, para que el arrastre nunca se
   sienta como un salto ni pelee con el seguimiento del jugador.

   - Click derecho + arrastrar   → rotar (yaw/pitch)
   - Rueda del mouse             → zoom
   - Un dedo + arrastrar         → rotar
   - Dos dedos (pinch)           → zoom
   - Doble click / doble tap     → recentrar

   El botón IZQUIERDO se deja libre a propósito: Room.tsx usa click
   izquierdo para interactuar con los muebles.
============================================================ */

const YAW_SENSITIVITY = 0.0072;

const PITCH_SENSITIVITY = 0.0055;

const WHEEL_ZOOM_SENSITIVITY = 0.0011;

const PINCH_ZOOM_SENSITIVITY = 0.012;

export function CameraOrbitControls() {
  const { gl } = useThree();

  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const activePointerId = useRef<number | null>(null);
  const pinchStartDist = useRef<number | null>(null);
  const lastTapTime = useRef(0);
  const touches = useRef(new Map<number, { x: number; y: number }>());

  useEffect(() => {
    const el = gl.domElement;

    const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot(a.x - b.x, a.y - b.y);

    const applyDrag = (dx: number, dy: number) => {
      orbitState.yaw -= dx * YAW_SENSITIVITY;
      orbitState.pitch += dy * PITCH_SENSITIVITY;
      clampOrbit();
    };

    const onContextMenu = (e: MouseEvent) => {
      // El click derecho es el gesto de rotar la cámara — el menú
      // contextual del navegador no debería aparecer encima.
      e.preventDefault();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (touches.current.size === 1) {
          activePointerId.current = e.pointerId;
          lastPointer.current = { x: e.clientX, y: e.clientY };
          orbitState.dragging = true;

          const now = performance.now();
          if (now - lastTapTime.current < 280) {
            recenterOrbit();
          }
          lastTapTime.current = now;
        } else if (touches.current.size === 2) {
          // Al entrar el segundo dedo, se pasa de rotar a pellizcar.
          activePointerId.current = null;
          const pts = [...touches.current.values()];
          pinchStartDist.current = distance(pts[0], pts[1]);
        }
        return;
      }

      // Mouse: solo el botón derecho (button === 2) rota.
      if (e.button !== 2) return;
      activePointerId.current = e.pointerId;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      orbitState.dragging = true;
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' && touches.current.has(e.pointerId)) {
        touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (touches.current.size === 2 && pinchStartDist.current !== null) {
          const pts = [...touches.current.values()];
          const d = distance(pts[0], pts[1]);
          const delta = d - pinchStartDist.current;
          pinchStartDist.current = d;
          orbitState.zoom += delta * PINCH_ZOOM_SENSITIVITY;
          clampOrbit();
          return;
        }
      }

      if (
        activePointerId.current === null ||
        e.pointerId !== activePointerId.current ||
        !lastPointer.current
      ) {
        return;
      }

      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      applyDrag(dx, dy);
    };

    const endDrag = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        touches.current.delete(e.pointerId);
        if (touches.current.size < 2) pinchStartDist.current = null;
        if (touches.current.size === 0) orbitState.dragging = false;
        if (activePointerId.current === e.pointerId) {
          activePointerId.current = null;
          lastPointer.current = null;
        }
        return;
      }

      if (activePointerId.current === e.pointerId) {
        activePointerId.current = null;
        lastPointer.current = null;
        orbitState.dragging = false;
        if (el.hasPointerCapture(e.pointerId)) {
          el.releasePointerCapture(e.pointerId);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitState.zoom -= e.deltaY * WHEEL_ZOOM_SENSITIVITY;
      clampOrbit();
    };

    const onDoubleClick = () => {
      recenterOrbit();
    };

    el.addEventListener('contextmenu', onContextMenu);
    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('dblclick', onDoubleClick);

    return () => {
      el.removeEventListener('contextmenu', onContextMenu);
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('dblclick', onDoubleClick);
    };
  }, [gl]);

  return null;
}

export default CameraOrbitControls;
