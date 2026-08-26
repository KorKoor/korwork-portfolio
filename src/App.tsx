import { useRef, useState, type ReactNode } from 'react';
import {
  Code,
  Sparkles,
  Heart,
  Mail,
  X,
  ExternalLink,
  GitBranch,
  Briefcase,
  Camera,
  Coffee,
  Hand,
} from 'lucide-react';
import { Scene } from './components/canvas/Scene';
import { TouchControls } from './components/ui/TouchControls';
import { useIsTouchDevice } from './hooks/useIsTouchDevice';
import type { InteractionZoneId } from './components/canvas/Player';

/* =========================================================
   CONTENIDO — sacado de korwork.org, una sección por zona
   interactuable del cuarto.
   ========================================================= */

interface Section {
  title: string;
  icon: ReactNode;
  accent: string;
  hint: string;
  content: ReactNode;
}

const chipStyle = (accent: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '999px',
  fontSize: '12.5px',
  fontWeight: 600,
  color: accent,
  background: `${accent}1a`,
  border: `1px solid ${accent}40`,
  margin: '3px 6px 3px 0',
});

const linkPillStyle = (accent: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#f8fafc',
  background: 'rgba(255,255,255,0.06)',
  border: `1px solid ${accent}55`,
  textDecoration: 'none',
  margin: '4px 8px 4px 0',
  transition: 'background 0.15s ease, transform 0.15s ease',
});

function ProjectRow({
  name,
  desc,
  tech,
  links,
  accent,
}: {
  name: string;
  desc: string;
  tech: string;
  links: { label: string; href: string }[];
  accent: string;
}) {
  return (
    <div
      style={{
        padding: '12px 0',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#f8fafc', fontSize: '14.5px' }}>
        {name}
      </p>
      <p style={{ margin: '0 0 6px', color: '#cbd5e1', fontSize: '13.5px', lineHeight: 1.55 }}>
        {desc}
      </p>
      <p style={{ margin: '0 0 6px', color: accent, fontSize: '12px', fontFamily: 'monospace' }}>
        {tech}
      </p>
      <div>
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            style={{ ...linkPillStyle(accent), padding: '5px 12px', fontSize: '12px' }}
          >
            <ExternalLink size={12} /> {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

const SECTIONS: Record<InteractionZoneId, Section> = {
  projects: {
    title: 'Proyectos',
    icon: <Code size={20} />,
    accent: '#7dd3fc',
    hint: 'en el escritorio',
    content: (
      <div>
        <p style={{ color: '#cbd5e1', fontSize: '13.5px', lineHeight: 1.6, marginTop: 0 }}>
          Algunas cosas que he construido últimamente ☕
        </p>
        <ProjectRow
          accent="#7dd3fc"
          name="ParDos: Zen Math"
          desc="Juego de puzzles en Google Play con certificación IARC, 80+ logros y arquitectura en Jetpack Compose."
          tech="Kotlin · Compose · Google Play"
          links={[{ label: 'Play Store', href: 'https://play.google.com/store/apps/details?id=com.korkoor.pardos' }]}
        />
        <ProjectRow
          accent="#7dd3fc"
          name="CV Analyzer (KorWork)"
          desc="SaaS que compara CVs contra vacantes reales de LinkedIn, OCC, Indeed y Computrabajo, con clustering hecho en JS puro."
          tech="JS · Serverless · Vercel · PDF.js"
          links={[
            { label: 'App', href: 'https://cv.korwork.org' },
            { label: 'GitHub', href: 'https://github.com/KorKoor/CV_Analyzer' },
          ]}
        />
        <ProjectRow
          accent="#7dd3fc"
          name="ACIF Hipertensión"
          desc="Monitoreo de presión arterial con gráficas de tendencia, pensado para accesibilidad en adultos mayores."
          tech="Kotlin · Android · SQLite"
          links={[{ label: 'Descargar APK', href: 'https://www.mediafire.com/file/8qqyd4hrw1ynlrv' }]}
        />
        <ProjectRow
          accent="#7dd3fc"
          name="ACIF Diabetes"
          desc="Gestión de glucosa y fases de tratamiento, en colaboración con el Departamento de Enfermería de la UAA."
          tech="Kotlin · HealthTech"
          links={[{ label: 'Descargar APK', href: 'https://www.mediafire.com/file/j9kd47buqd2lgxw' }]}
        />
        <ProjectRow
          accent="#7dd3fc"
          name="Online Screen"
          desc="Overlay de chat de Twitch en tiempo real vía WebSockets, listo para OBS."
          tech="WebSockets · JS · Twitch API"
          links={[{ label: 'Ver layout', href: 'https://stream.korwork.org/OnlineScreen.html' }]}
        />
        <div style={{ paddingTop: '12px' }}>
          <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#f8fafc', fontSize: '14.5px' }}>
            Natalia Castro · Eventos
          </p>
          <p style={{ margin: '0 0 6px', color: '#cbd5e1', fontSize: '13.5px', lineHeight: 1.55 }}>
            Sitio editorial premium para una productora de eventos de lujo, con animaciones cinematográficas.
          </p>
          <a
            href="https://www.korwork.org/landing-eventos-exclusivos"
            target="_blank"
            rel="noreferrer"
            style={{ ...linkPillStyle('#7dd3fc'), padding: '5px 12px', fontSize: '12px' }}
          >
            <ExternalLink size={12} /> Ver sitio
          </a>
        </div>
      </div>
    ),
  },

  skills: {
    title: 'Skills',
    icon: <Sparkles size={20} />,
    accent: '#c4b5fd',
    hint: 'en el librero',
    content: (
      <div>
        {[
          { label: 'Mobile', items: 'Kotlin · Jetpack Compose · Android' },
          { label: 'Web', items: 'React · HTML · CSS · JavaScript' },
          { label: 'Backend', items: 'Python · Django · FastAPI' },
          { label: 'Datos', items: 'SQLite · SQL / NoSQL' },
          { label: 'Herramientas', items: 'Google Play · Vercel · WebSockets · Twitch API · PDF.js' },
        ].map((group) => (
          <div key={group.label} style={{ marginBottom: '14px' }}>
            <p
              style={{
                margin: '0 0 6px',
                fontSize: '11.5px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#c4b5fd',
                fontWeight: 700,
              }}
            >
              {group.label}
            </p>
            <p style={{ margin: 0, color: '#e2e8f0', fontSize: '13.5px', lineHeight: 1.6 }}>
              {group.items}
            </p>
          </div>
        ))}
      </div>
    ),
  },

  about: {
    title: 'Sobre mí',
    icon: <Heart size={20} />,
    accent: '#fdba74',
    hint: 'en el sofá',
    content: (
      <div>
        <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#f8fafc', fontSize: '16px' }}>
          Carlos García Huerta
        </p>
        <p style={{ margin: '0 0 12px', color: '#fdba74', fontSize: '13px' }}>
          Software Developer · Aguascalientes, MX
        </p>
        <p style={{ margin: '0 0 12px', color: '#cbd5e1', fontSize: '13.5px', lineHeight: 1.65 }}>
          Desarrollador enfocado en el ecosistema móvil con Kotlin y Jetpack Compose, con apps
          publicadas en Google Play. También me muevo full-stack con React, Python
          (Django/FastAPI) y bases SQL/NoSQL. Me gusta trabajar en equipos multidisciplinarios,
          sobre todo en el sector salud.
        </p>
        <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: '12px' }}>
          Lic. en Informática y Tecnologías Computacionales — UAA
        </p>
        <div style={{ margin: '10px 0' }}>
          {['Pensamiento analítico', 'Adaptabilidad', 'Comunicación técnica', 'Resiliencia'].map(
            (skill) => (
              <span key={skill} style={chipStyle('#fdba74')}>
                {skill}
              </span>
            ),
          )}
        </div>
        <p style={{ margin: '10px 0 4px', color: '#e2e8f0', fontSize: '13px' }}>
          <b>Idiomas:</b> Español (nativo) · Inglés (B2)
        </p>
        <p style={{ margin: 0, color: '#e2e8f0', fontSize: '13px' }}>
          <b>Fuera del código:</b> IA &amp; LLMs, música, game dev, gaming
        </p>
      </div>
    ),
  },

  contact: {
    title: 'Contacto',
    icon: <Mail size={20} />,
    accent: '#6ee7b7',
    hint: 'en el armario',
    content: (
      <div>
        <p style={{ color: '#cbd5e1', fontSize: '13.5px', lineHeight: 1.6, marginTop: 0 }}>
          ¿Plática, chamba o colaboración? Aquí me encuentras:
        </p>
        <div>
          <a href="mailto:charliegarcia.it@gmail.com" style={linkPillStyle('#6ee7b7')}>
            <Mail size={14} /> Email
          </a>
          <a href="https://github.com/KorKoor" target="_blank" rel="noreferrer" style={linkPillStyle('#6ee7b7')}>
            <GitBranch size={14} /> GitHub
          </a>
          <a
            href="https://linkedin.com/in/charliegarcia-it"
            target="_blank"
            rel="noreferrer"
            style={linkPillStyle('#6ee7b7')}
          >
            <Briefcase size={14} /> LinkedIn
          </a>
          <a
            href="https://instagram.com/kourkoour"
            target="_blank"
            rel="noreferrer"
            style={linkPillStyle('#6ee7b7')}
          >
            <Camera size={14} /> Instagram
          </a>
        </div>
        <a
          href="https://www.korwork.org"
          target="_blank"
          rel="noreferrer"
          style={{ ...linkPillStyle('#6ee7b7'), marginTop: '10px' }}
        >
          <ExternalLink size={14} /> korwork.org
        </a>
      </div>
    ),
  },
};

/* =========================================================
   MODAL — estilo cozy/zen acorde al cuarto
   ========================================================= */

function InteractionModal({
  section,
  onClose,
}: {
  section: Section | null;
  onClose: () => void;
}) {
  if (!section) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(8, 6, 12, 0.6)',
        backdropFilter: 'blur(6px)',
        zIndex: 40,
        animation: 'kw-fade-in 0.18s ease-out',
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '520px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          margin: '20px',
          padding: '26px 26px 22px',
          borderRadius: '22px',
          background: 'linear-gradient(165deg, #1c1626 0%, #120e18 100%)',
          color: 'white',
          border: `1px solid ${section.accent}33`,
          boxShadow: `0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03), 0 0 40px ${section.accent}14`,
          fontFamily:
            "'Nunito', 'Segoe UI', system-ui, -apple-system, sans-serif",
          animation: 'kw-pop-in 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={15} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: section.accent,
              background: `${section.accent}1f`,
              border: `1px solid ${section.accent}40`,
            }}
          >
            {section.icon}
          </div>
          <h2 style={{ margin: 0, fontSize: '19px', color: '#f8fafc', fontWeight: 800 }}>
            {section.title}
          </h2>
        </div>

        {section.content}
      </div>
    </div>
  );
}

/* =========================================================
   HUD — cozy / zen / chill
   ========================================================= */

function CoinBadge({ coins }: { coins: number }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '18px',
        right: '18px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px 8px 10px',
        borderRadius: '999px',
        background: 'rgba(28, 22, 38, 0.55)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(253, 186, 116, 0.28)',
        boxShadow: '0 6px 20px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.03)',
        zIndex: 10,
        fontFamily: "'Nunito', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 35% 30%, #fde68a, #d97706)',
          color: '#3b2308',
          boxShadow: '0 0 10px rgba(253, 186, 116, 0.5)',
        }}
      >
        <Coffee size={14} strokeWidth={2.4} />
      </div>
      <span style={{ color: '#fde68a', fontWeight: 700, fontSize: '14px', letterSpacing: '0.01em' }}>
        {coins} <span style={{ color: '#e2c9a0', fontWeight: 500 }}>brews</span>
      </span>
    </div>
  );
}

function ControlsHint({ isTouch }: { isTouch: boolean }) {
  if (isTouch) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        borderRadius: '999px',
        background: 'rgba(28, 22, 38, 0.5)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
        color: '#cbd5e1',
        fontFamily: "'Nunito', 'Segoe UI', system-ui, sans-serif",
        fontSize: '13px',
        zIndex: 10,
      }}
    >
      <span style={{ display: 'flex', gap: '3px' }}>
        {['W', 'A', 'S', 'D'].map((k) => (
          <span
            key={k}
            style={{
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '5px',
              background: 'rgba(125, 211, 252, 0.12)',
              border: '1px solid rgba(125, 211, 252, 0.3)',
              color: '#7dd3fc',
              fontSize: '10.5px',
              fontWeight: 700,
            }}
          >
            {k}
          </span>
        ))}
      </span>
      <span style={{ opacity: 0.4 }}>·</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span
          style={{
            padding: '2px 7px',
            borderRadius: '5px',
            background: 'rgba(253, 186, 116, 0.12)',
            border: '1px solid rgba(253, 186, 116, 0.3)',
            color: '#fdba74',
            fontSize: '10.5px',
            fontWeight: 700,
          }}
        >
          E
        </span>
        interactuar
      </span>
    </div>
  );
}

function NearbyPrompt({ zone, isTouch }: { zone: InteractionZoneId | null; isTouch: boolean }) {
  if (!zone) return null;

  const section = SECTIONS[zone];

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: isTouch ? '128px' : '96px',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '9px 16px',
        borderRadius: '999px',
        background: 'rgba(28, 22, 38, 0.65)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${section.accent}55`,
        boxShadow: `0 8px 24px rgba(0,0,0,0.35), 0 0 24px ${section.accent}22`,
        color: '#f8fafc',
        fontFamily: "'Nunito', 'Segoe UI', system-ui, sans-serif",
        fontSize: '13px',
        fontWeight: 600,
        zIndex: 15,
        animation: 'kw-float 1.6s ease-in-out infinite',
        pointerEvents: 'none',
      }}
    >
      {isTouch ? <Hand size={14} color={section.accent} /> : (
        <span
          style={{
            padding: '2px 7px',
            borderRadius: '5px',
            background: `${section.accent}22`,
            border: `1px solid ${section.accent}55`,
            color: section.accent,
            fontSize: '10.5px',
            fontWeight: 800,
          }}
        >
          E
        </span>
      )}
      {isTouch ? 'Toca para ' : ''}
      {section.title}
    </div>
  );
}

/* =========================================================
   APP
   ========================================================= */

function App() {
  const [openZone, setOpenZone] = useState<InteractionZoneId | null>(null);
  const [nearbyZone, setNearbyZone] = useState<InteractionZoneId | null>(null);
  const [coins, setCoins] = useState(0);
  const visited = useRef<Set<InteractionZoneId>>(new Set());
  const isTouch = useIsTouchDevice();

  const handleInteract = (zoneId: InteractionZoneId) => {
    setOpenZone(zoneId);

    if (!visited.current.has(zoneId)) {
      visited.current.add(zoneId);
      setCoins((c) => c + 50);
    }
  };

  return (
    <main style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <style>
        {`
          @keyframes kw-fade-in { from { opacity: 0; } to { opacity: 1; } }
          @keyframes kw-pop-in {
            from { opacity: 0; transform: scale(0.96) translateY(6px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes kw-float {
            0%, 100% { transform: translateX(-50%) translateY(0); }
            50% { transform: translateX(-50%) translateY(-3px); }
          }
        `}
      </style>

      <CoinBadge coins={coins} />
      <ControlsHint isTouch={isTouch} />
      <NearbyPrompt zone={openZone ? null : nearbyZone} isTouch={isTouch} />

      <Scene onInteract={handleInteract} onNearbyZoneChange={setNearbyZone} />

      <TouchControls />

      <InteractionModal section={openZone ? SECTIONS[openZone] : null} onClose={() => setOpenZone(null)} />
    </main>
  );
}

export default App;
