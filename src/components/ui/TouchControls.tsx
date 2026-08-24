import React, { useEffect, useRef, useState } from 'react';
import { Hand } from 'lucide-react';
import { useControlsStore } from '../../store/controls';
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice';

const JOYSTICK_RADIUS = 52;

const DEADZONE = 0.12;

/**
 * Joystick analógico + botón de interacción para pantallas táctiles.
 * Solo se monta cuando se detecta un dispositivo con puntero "coarse"
 * (celular/tablet) — en desktop el HUD de teclado se queda como está.
 * Escribe directo al store de controles, igual que el teclado.
 */
export const TouchControls: React.FC = () => {
  const isTouch = useIsTouchDevice();
  const baseRef = useRef<HTMLDivElement>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [interactPressed, setInteractPressed] = useState(false);
  const activePointerId = useRef<number | null>(null);

  // Red de seguridad: si el pointerup/cancel ocurre fuera del propio
  // div (dedo se desliza fuera de la pantalla, gesto interrumpido por
  // el sistema, etc.), esto igual suelta el joystick en vez de
  // dejarlo "pegado" moviendo al personaje solo. Va antes del early
  // return de abajo porque los hooks no pueden ser condicionales.
  useEffect(() => {
    const releaseIfActive = (event: PointerEvent) => {
      if (activePointerId.current !== event.pointerId) return;
      activePointerId.current = null;
      setDragging(false);
      setKnobOffset({ x: 0, y: 0 });
      useControlsStore.getState().setTouchAxis(0, 0);
    };

    window.addEventListener('pointerup', releaseIfActive);
    window.addEventListener('pointercancel', releaseIfActive);

    return () => {
      window.removeEventListener('pointerup', releaseIfActive);
      window.removeEventListener('pointercancel', releaseIfActive);
    };
  }, []);

  if (!isTouch) return null;

  const updateAxis = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;

    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > JOYSTICK_RADIUS) {
      dx = (dx / dist) * JOYSTICK_RADIUS;
      dy = (dy / dist) * JOYSTICK_RADIUS;
    }

    setKnobOffset({ x: dx, y: dy });

    const normX = dx / JOYSTICK_RADIUS;
    const normZ = dy / JOYSTICK_RADIUS;

    useControlsStore.getState().setTouchAxis(
      Math.abs(normX) < DEADZONE ? 0 : normX,
      Math.abs(normZ) < DEADZONE ? 0 : normZ,
    );
  };

  const resetAxis = () => {
    setKnobOffset({ x: 0, y: 0 });
    useControlsStore.getState().setTouchAxis(0, 0);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    activePointerId.current = event.pointerId;
    setDragging(true);
    updateAxis(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== event.pointerId) return;
    updateAxis(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== event.pointerId) return;
    activePointerId.current = null;
    setDragging(false);
    resetAxis();
  };

  return (
    <>
      <div
        ref={baseRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          position: 'fixed',
          left: '24px',
          bottom: '28px',
          width: `${JOYSTICK_RADIUS * 2}px`,
          height: `${JOYSTICK_RADIUS * 2}px`,
          borderRadius: '50%',
          background: 'rgba(30, 24, 38, 0.55)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          boxShadow: dragging
            ? '0 0 0 1px rgba(56, 189, 248, 0.35), 0 8px 20px rgba(0,0,0,0.35)'
            : '0 8px 20px rgba(0,0,0,0.3)',
          touchAction: 'none',
          zIndex: 30,
          transition: 'box-shadow 0.2s ease',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 35% 30%, rgba(253, 230, 180, 0.9), rgba(180, 130, 90, 0.75))',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.15)',
            transform: `translate(-50%, -50%) translate(${knobOffset.x}px, ${knobOffset.y}px)`,
            transition: dragging ? 'none' : 'transform 0.15s ease-out',
          }}
        />
      </div>

      <button
        type="button"
        onPointerDown={(event) => {
          event.preventDefault();
          setInteractPressed(true);
          useControlsStore.getState().setTouchInteract(true);
        }}
        onPointerUp={() => {
          setInteractPressed(false);
          useControlsStore.getState().setTouchInteract(false);
        }}
        onPointerLeave={() => {
          setInteractPressed(false);
          useControlsStore.getState().setTouchInteract(false);
        }}
        aria-label="Interactuar"
        style={{
          position: 'fixed',
          right: '28px',
          bottom: '34px',
          width: '68px',
          height: '68px',
          borderRadius: '50%',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          background: interactPressed
            ? 'radial-gradient(circle at 35% 30%, #7dd3fc, #38bdf8)'
            : 'radial-gradient(circle at 35% 30%, rgba(56,189,248,0.55), rgba(30,64,90,0.65))',
          backdropFilter: 'blur(6px)',
          boxShadow: interactPressed
            ? '0 0 18px rgba(56, 189, 248, 0.55)'
            : '0 8px 20px rgba(0,0,0,0.3)',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'none',
          zIndex: 30,
          transition: 'transform 0.1s ease, box-shadow 0.2s ease',
          transform: interactPressed ? 'scale(0.94)' : 'scale(1)',
        }}
      >
        <Hand size={26} strokeWidth={2} />
      </button>
    </>
  );
};
