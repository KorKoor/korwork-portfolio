import React, { useEffect, useRef, useState } from 'react';
import { usePlayerHudStore } from '../../store/player';
import { useAtmosphereStore, clockLabel, weatherLabel } from '../../world/atmosphere';
import { biomeAt } from '../canvas/world/EnvironmentDecor';
import type { Location } from '../canvas/Scene';

/* ============================================================
   DEBUG OVERLAY (F3, como Minecraft)
   ============================================================
   Panel de QA barato: FPS real (medido con rAF, no confiar en
   supuestos), posición, bioma, hora/clima y algunos flags de
   estado. Vive fuera del árbol de R3F a propósito — lee todo por
   polling ligero desde fuera, así que un bug dentro de la escena
   3D nunca se lo lleva consigo.
============================================================ */

function useFps(enabled: boolean): number {
  const [fps, setFps] = useState(0);
  const frames = useRef(0);
  const last = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;

    const tick = () => {
      frames.current += 1;
      const now = performance.now();
      const elapsed = now - last.current;

      if (elapsed >= 500) {
        setFps(Math.round((frames.current * 1000) / elapsed));
        frames.current = 0;
        last.current = now;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  return fps;
}

export const DebugOverlay: React.FC<{ location: Location }> = ({ location }) => {
  const [open, setOpen] = useState(false);
  const fps = useFps(open);
  const px = usePlayerHudStore((s) => s.x);
  const pz = usePlayerHudStore((s) => s.z);
  const time = useAtmosphereStore((s) => s.time);
  const weather = useAtmosphereStore((s) => s.weather);
  const windStrength = useAtmosphereStore((s) => s.windStrength);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'F3') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;

  const biome = location === 'world' ? biomeAt(px, pz).biome.id : '—';
  const dpr = Math.round((window.devicePixelRatio || 1) * 100) / 100;

  const row = (label: string, value: string): React.ReactNode => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px' }}>
      <span style={{ color: '#7a8a9a' }}>{label}</span>
      <span style={{ color: '#e8f0f6' }}>{value}</span>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: '18px',
        left: '50%',
        transform: 'translateX(-50%)',
        minWidth: '220px',
        padding: '10px 14px',
        borderRadius: '10px',
        background: 'rgba(6, 10, 14, 0.82)',
        border: '1px solid rgba(255,255,255,0.1)',
        fontFamily: "'JetBrains Mono', 'Consolas', monospace",
        fontSize: '11.5px',
        lineHeight: 1.65,
        zIndex: 999,
        pointerEvents: 'none',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={{
          color: fps >= 55 ? '#6ee7b7' : fps >= 30 ? '#fbbf24' : '#fb7185',
          fontWeight: 800,
          marginBottom: '4px',
        }}
      >
        {fps || '—'} FPS
      </div>
      {row('scene', location)}
      {row('pos', `${px.toFixed(1)}, ${pz.toFixed(1)}`)}
      {row('biome', String(biome))}
      {row('time', clockLabel(time))}
      {row('weather', `${weatherLabel(weather)} (viento ${windStrength.toFixed(2)})`)}
      {row('dpr', String(dpr))}
      <div style={{ marginTop: '4px', color: '#4a5a68', fontSize: '10px' }}>
        F3 para cerrar
      </div>
    </div>
  );
};

export default DebugOverlay;
