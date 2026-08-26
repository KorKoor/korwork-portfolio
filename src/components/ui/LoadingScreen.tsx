import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ============================================================
   PANTALLA DE CARGA
   ============================================================
   No es un spinner genérico: comparte la paleta y la tipografía del
   juego, muestra progreso real (lo alimenta el <Suspense> de R3F a
   través de useProgress), rota consejos, y sale con un fundido que
   se siente como parte de la experiencia y no como una interrupción.
============================================================ */

const TIPS: { icon: string; text: string }[] = [
  { icon: '🌿', text: 'Mantén Shift para correr — gasta energía, pero se recupera sola.' },
  { icon: '🐕', text: 'Los perros se acercan si te quedas quieto. Las ardillas huyen.' },
  { icon: '🎣', text: 'En el muelle del lago puedes pescar. A veces pica, a veces no.' },
  { icon: '🦇', text: 'La cueva del noroeste tiene murciélagos que orbitan a quien entra.' },
  { icon: '🔥', text: 'La fogata del campamento cura mientras te quedes cerca.' },
  { icon: '🌙', text: 'El día pasa de verdad: espera al anochecer para ver las luciérnagas.' },
  { icon: '🌧️', text: 'El clima cambia solo. Bajo tormenta el viento mueve toda la vegetación.' },
  { icon: '🚲', text: 'La bici y la patineta dan un empujón de velocidad temporal.' },
];

interface LoadingScreenProps {
  progress: number;
  visible: boolean;
  /** Texto de contexto: "Preparando el mundo", "Volviendo a casa"… */
  label?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  visible,
  label = 'Cargando',
}) => {
  const [tipIndex, setTipIndex] = useState(() =>
    Math.floor(Math.random() * TIPS.length),
  );
  const [mounted, setMounted] = useState(visible);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Se mantiene montada un momento extra tras `visible = false` para
  // que el fundido de salida se vea completo.
  useEffect(() => {
    if (visible) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setMounted(true);
    } else {
      hideTimer.current = setTimeout(() => setMounted(false), 620);
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(
      () => setTipIndex((i) => (i + 1) % TIPS.length),
      4200,
    );
    return () => clearInterval(id);
  }, [visible]);

  const motes = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: (i * 37.3) % 100,
        delay: (i * 0.61) % 7,
        duration: 7 + ((i * 1.7) % 6),
        size: 2 + ((i * 3) % 4),
      })),
    [],
  );

  if (!mounted) return null;

  const tip = TIPS[tipIndex];
  const pct = Math.round(Math.min(100, Math.max(0, progress)));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '26px',
        background:
          'radial-gradient(120% 100% at 50% 0%, #1d2a22 0%, #10161a 45%, #080b0f 100%)',
        fontFamily: "'Nunito', 'Segoe UI', system-ui, sans-serif",
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
        pointerEvents: visible ? 'auto' : 'none',
        overflow: 'hidden',
      }}
    >
      {/* Motas flotando: el mismo lenguaje que las partículas del
          mundo, para que la carga se sienta parte del juego. */}
      {motes.map((m, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            bottom: '-10px',
            left: `${m.left}%`,
            width: `${m.size}px`,
            height: `${m.size}px`,
            borderRadius: '50%',
            background: 'rgba(215, 232, 190, 0.55)',
            filter: 'blur(0.4px)',
            animation: `kw-rise ${m.duration}s linear ${m.delay}s infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}

      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div
          style={{
            fontSize: '13px',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#7f9a86',
            fontWeight: 800,
            marginBottom: '10px',
          }}
        >
          korwork
        </div>
        <div
          style={{
            fontSize: '30px',
            fontWeight: 900,
            color: '#f2f7ee',
            letterSpacing: '-0.01em',
          }}
        >
          {label}
        </div>
      </div>

      {/* Barra de progreso */}
      <div style={{ width: 'min(360px, 72vw)', zIndex: 1 }}>
        <div
          style={{
            height: '6px',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              borderRadius: '999px',
              background: 'linear-gradient(90deg, #6ee7b7, #7dd3fc)',
              boxShadow: '0 0 14px rgba(110, 231, 183, 0.55)',
              transition: 'width 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </div>
        <div
          style={{
            marginTop: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11.5px',
            color: '#6f8a78',
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          <span>{pct}%</span>
          <span>{pct < 100 ? 'preparando el mundo' : 'listo'}</span>
        </div>
      </div>

      {/* Consejo rotativo */}
      <div
        key={tipIndex}
        style={{
          maxWidth: 'min(430px, 84vw)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '13px 17px',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.045)',
          border: '1px solid rgba(255,255,255,0.07)',
          color: '#c3d3c6',
          fontSize: '13.5px',
          lineHeight: 1.55,
          zIndex: 1,
          animation: 'kw-fade-in 0.5s ease',
        }}
      >
        <span style={{ fontSize: '16px', lineHeight: 1.2 }}>{tip.icon}</span>
        <span>{tip.text}</span>
      </div>
    </div>
  );
};

export default LoadingScreen;
