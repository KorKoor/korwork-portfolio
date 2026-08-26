import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  HeartPulse,
  Zap,
  DoorOpen,
  TreePine,
  MapPin,
  Wind,
  Volume2,
  VolumeX,
  CloudSun,
  CloudRain,
  CloudLightning,
  Cloud,
  CloudFog,
  Clock,
  Compass,
} from 'lucide-react';
import { useProgress } from '@react-three/drei';
import { Minimap, currentZoneLabel } from './components/ui/Minimap';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { usePlayerHudStore } from './store/player';
import { audio } from './audio/AudioEngine';
import {
  useAtmosphereStore,
  clockLabel,
  weatherLabel,
  type WeatherKind,
} from './world/atmosphere';
import { Scene, type Location } from './components/canvas/Scene';
import { TouchControls } from './components/ui/TouchControls';
import { useIsTouchDevice } from './hooks/useIsTouchDevice';
import { useVitalsStore } from './store/vitals';
import { useVehicleStore } from './store/vehicle';
import { NPCS } from './components/canvas/world/NPCs';
import { DebugOverlay } from './components/ui/DebugOverlay';
import { recenterOrbit } from './store/cameraOrbit';
import type {
  ContentZoneId,
  InteractionZoneId,
  WorldZoneId,
} from './components/canvas/Player';

const CONTENT_ZONE_IDS: readonly ContentZoneId[] = [
  'projects',
  'skills',
  'about',
  'contact',
];

function isContentZone(id: InteractionZoneId): id is ContentZoneId {
  return (CONTENT_ZONE_IDS as readonly string[]).includes(id);
}

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

const SECTIONS: Record<ContentZoneId, Section> = {
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
      <span style={{ opacity: 0.4 }}>·</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span
          style={{
            padding: '2px 7px',
            borderRadius: '5px',
            background: 'rgba(110, 231, 183, 0.12)',
            border: '1px solid rgba(110, 231, 183, 0.3)',
            color: '#6ee7b7',
            fontSize: '10.5px',
            fontWeight: 700,
          }}
        >
          Shift
        </span>
        correr
      </span>
      <span style={{ opacity: 0.4 }}>·</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span
          style={{
            padding: '2px 7px',
            borderRadius: '5px',
            background: 'rgba(196, 181, 253, 0.12)',
            border: '1px solid rgba(196, 181, 253, 0.3)',
            color: '#c4b5fd',
            fontSize: '10.5px',
            fontWeight: 700,
          }}
        >
          clic derecho
        </span>
        rotar cámara · rueda: zoom
      </span>
    </div>
  );
}

const WORLD_ZONE_LABELS: Record<WorldZoneId, { title: string; accent: string }> = {
  'enter-house': { title: 'Entrar a la casa', accent: '#fdba74' },
  'sit-bench': { title: 'Sentarse a descansar', accent: '#6ee7b7' },
  'ride-bike': { title: 'Subirse a la bici', accent: '#7dd3fc' },
  'ride-skateboard': { title: 'Agarrar la patineta', accent: '#c4b5fd' },
  'enter-cave': { title: 'Cueva de los murciélagos', accent: '#a78bfa' },
  'fish-dock': { title: 'Pescar en el lago', accent: '#38bdf8' },
  'cherry-lookout': { title: 'Mirador de cerezos', accent: '#f9a8d4' },
  'flower-garden': { title: 'Jardín de flores', accent: '#fbbf24' },
  'greet-fisherman': { title: 'Hablar con el pescador', accent: '#8fd0ff' },
  'greet-hiker': { title: 'Hablar con la excursionista', accent: '#ffb0c8' },
  'pet-dog': { title: 'Acariciar al perrito', accent: '#f9a8d4' },
  'waterfall-cove': { title: 'La cascada escondida', accent: '#67e8f9' },
  // Zona dentro del cuarto (junto a la cama) — comparte el tipo
  // WorldZoneId porque cae en el mismo manejador genérico de abajo.
  sleep: { title: 'Dormir un rato', accent: '#a5b4fc' },
};

// Un índice por NPC (no estado de React: no hace falta re-renderizar
// nada por esto) para que las líneas roten en vez de repetir siempre
// la primera.
const greetingIndex: Record<string, number> = {};

function pickGreeting(npcId: string): string {
  const npc = NPCS.find((n) => n.id === npcId);
  if (!npc) return '"..."';

  const i = greetingIndex[npcId] ?? 0;
  greetingIndex[npcId] = (i + 1) % npc.greetings.length;

  return `💬 ${npc.greetings[i]}`;
}

function NearbyPrompt({ zone, isTouch }: { zone: InteractionZoneId | null; isTouch: boolean }) {
  if (!zone) return null;

  const section = isContentZone(zone)
    ? SECTIONS[zone]
    : zone === 'exit-house'
      ? { title: 'Salir al mundo exterior', accent: '#7dd3fc' }
      : WORLD_ZONE_LABELS[zone as WorldZoneId];

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
   VITALS HUD — salud/stamina del mundo exterior
   ========================================================= */

function VitalsBar({
  icon,
  value,
  max,
  color,
  glow,
}: {
  icon: ReactNode;
  value: number;
  max: number;
  color: string;
  glow: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
      <div style={{ color, display: 'flex' }}>{icon}</div>
      <div
        style={{
          width: '108px',
          height: '9px',
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
          boxShadow: glow ? `0 0 8px ${color}88` : 'none',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: '999px',
            transition: 'width 0.25s ease',
          }}
        />
      </div>
    </div>
  );
}

function VitalsHud() {
  const health = useVitalsStore((s) => s.health);
  const maxHealth = useVitalsStore((s) => s.maxHealth);
  const stamina = useVitalsStore((s) => s.stamina);
  const maxStamina = useVitalsStore((s) => s.maxStamina);
  const isExhausted = useVitalsStore((s) => s.isExhausted);
  const px = usePlayerHudStore((s) => s.x);
  const pz = usePlayerHudStore((s) => s.z);
  const boostLabel = useVehicleStore((s) => s.label);
  const boostExpires = useVehicleStore((s) => s.expiresAt);

  const boostActive = boostLabel !== null && Date.now() < boostExpires;
  const zone = currentZoneLabel(px, pz);

  return (
    <div
      style={{
        position: 'fixed',
        top: '18px',
        left: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '9px',
        padding: '12px',
        borderRadius: '18px',
        background: 'rgba(28, 22, 38, 0.58)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 6px 22px rgba(0,0,0,0.35)',
        zIndex: 10,
        fontFamily: "'Nunito', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <MapPin size={13} color="#94a3b8" />
        <span
          style={{
            color: '#f1f5f9',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.01em',
          }}
        >
          {zone}
        </span>
      </div>

      <AtmosphereHud />

      <VitalsBar icon={<HeartPulse size={14} />} value={health} max={maxHealth} color="#fb7185" glow={health < maxHealth * 0.3} />
      <VitalsBar icon={<Zap size={14} />} value={stamina} max={maxStamina} color={isExhausted ? '#f87171' : '#7dd3fc'} glow={isExhausted} />

      <div
        style={{
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.12)',
          lineHeight: 0,
        }}
      >
        <Minimap />
      </div>

      {boostActive && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: '#7dd3fc',
            fontSize: '11.5px',
            fontWeight: 700,
          }}
        >
          <Wind size={12} /> {boostLabel}
        </div>
      )}
    </div>
  );
}

function Toast({ text }: { text: string | null }) {
  if (!text) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '90px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '9px 18px',
        borderRadius: '999px',
        background: 'rgba(28, 22, 38, 0.75)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        color: '#f8fafc',
        fontFamily: "'Nunito', 'Segoe UI', system-ui, sans-serif",
        fontSize: '13.5px',
        fontWeight: 600,
        zIndex: 25,
        animation: 'kw-pop-in 0.2s ease-out',
        pointerEvents: 'none',
      }}
    >
      {text}
    </div>
  );
}

/* =========================================================
   RELOJ + CLIMA  (solo mundo abierto)
   ========================================================= */

const WEATHER_ICON: Record<WeatherKind, React.ReactNode> = {
  clear: <CloudSun size={14} />,
  cloudy: <Cloud size={14} />,
  rain: <CloudRain size={14} />,
  storm: <CloudLightning size={14} />,
  fog: <CloudFog size={14} />,
};

function AtmosphereHud() {
  // Se suscribe SOLO a valores ya redondeados/discretos: la hora
  // cruda cambia 60 veces por segundo, pero la etiqueta "07:35" solo
  // cambia cada varios segundos, así React re-renderiza casi nunca.
  const label = useAtmosphereStore((s) => clockLabel(s.time));
  const weather = useAtmosphereStore((s) => s.weather);
  const isNight = useAtmosphereStore(
    (s) => s.time < 0.24 || s.time > 0.79,
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '12px',
        fontWeight: 700,
        color: isNight ? '#a5b4fc' : '#e2e8f0',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Clock size={13} /> {label}
      </span>
      <span style={{ opacity: 0.35 }}>·</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        {WEATHER_ICON[weather]} {weatherLabel(weather)}
      </span>
    </div>
  );
}

function SoundToggle() {
  const [muted, setMuted] = useState(false);

  return (
    <button
      type="button"
      aria-label={muted ? 'Activar sonido' : 'Silenciar'}
      onClick={() => {
        const next = !muted;
        setMuted(next);
        audio.setMuted(next);
        if (!next) audio.ui('hover');
      }}
      style={{
        position: 'fixed',
        top: '18px',
        right: '150px',
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(28, 22, 38, 0.55)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.09)',
        color: muted ? '#94a3b8' : '#7dd3fc',
        cursor: 'pointer',
        zIndex: 12,
        transition: 'color 0.2s ease, transform 0.15s ease',
      }}
    >
      {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
    </button>
  );
}

function CameraRecenterButton() {
  return (
    <button
      type="button"
      aria-label="Centrar cámara"
      title="Centrar cámara"
      onClick={() => {
        recenterOrbit();
        audio.ui('hover');
      }}
      style={{
        position: 'fixed',
        top: '18px',
        right: '196px',
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(28, 22, 38, 0.55)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.09)',
        color: '#c4b5fd',
        cursor: 'pointer',
        zIndex: 12,
        transition: 'color 0.2s ease, transform 0.15s ease',
      }}
    >
      <Compass size={16} />
    </button>
  );
}

function LocationHint({ location }: { location: Location }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '18px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        borderRadius: '999px',
        background: 'rgba(28, 22, 38, 0.5)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        color: '#cbd5e1',
        fontFamily: "'Nunito', 'Segoe UI', system-ui, sans-serif",
        fontSize: '12.5px',
        fontWeight: 600,
        zIndex: 10,
      }}
    >
      {location === 'room' ? <TreePine size={13} /> : <DoorOpen size={13} />}
      {location === 'room' ? 'Puerta al mundo exterior' : 'Vuelve a la casa'}
    </div>
  );
}

/* =========================================================
   APP
   ========================================================= */

function App() {
  const [location, setLocation] = useState<Location>('room');
  const [openZone, setOpenZone] = useState<ContentZoneId | null>(null);
  const [nearbyZone, setNearbyZone] = useState<InteractionZoneId | null>(null);

  // Player se remonta entero al cambiar de escena (key={location} en
  // Scene.tsx) — su ref interna de "zona cercana" arranca en null, y
  // si sigue en null no hay CAMBIO que dispare onNearbyZoneChange, así
  // que el valor viejo (de la escena anterior) se quedaría pegado en
  // el HUD sin este reset explícito.
  useEffect(() => {
    setNearbyZone(null);
  }, [location]);
  const [coins, setCoins] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const visited = useRef<Set<InteractionZoneId>>(new Set());
  const isTouch = useIsTouchDevice();
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (text: string) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  /* ---------------- transición entre escenas ----------------
     Cambiar de escena ya no es un corte seco: se funde a negro, se
     hace el cambio mientras la pantalla está tapada (que además es
     cuando se cargan los assets nuevos), y se funde de vuelta. */
  const [veil, setVeil] = useState(0);
  const [transitionLabel, setTransitionLabel] = useState('Cargando');
  const transitionTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      transitionTimers.current.forEach(clearTimeout);
    };
  }, []);

  const travelTo = (next: Location, label: string) => {
    if (next === location) return;

    audio.ui(next === 'world' ? 'open' : 'close');
    setTransitionLabel(label);
    setVeil(1);

    transitionTimers.current.push(
      setTimeout(() => {
        setLocation(next);
        setOpenZone(null);
      }, 420),
    );

    transitionTimers.current.push(
      setTimeout(() => setVeil(0), 900),
    );
  };

  const handleWorldZone = (zoneId: WorldZoneId) => {
    switch (zoneId) {
      case 'enter-house':
        travelTo('room', 'Volviendo a casa');
        break;
      case 'enter-cave':
        audio.ui('open');
        showToast('🦇 La cueva de los murciélagos');
        break;
      case 'sit-bench':
        useVitalsStore.getState().heal(18);
        audio.ui('confirm');
        showToast('🌿 Te sientas un rato — +18 de salud');
        break;
      case 'ride-bike':
        useVehicleStore.getState().setBoost(1.8, 'bici', 8000);
        audio.reward();
        showToast('🚲 ¡A pedalear! +80% velocidad por 8s');
        break;
      case 'ride-skateboard':
        useVehicleStore.getState().setBoost(1.45, 'patineta', 8000);
        audio.reward();
        showToast('🛹 ¡Rodando! +45% velocidad por 8s');
        break;
      case 'fish-dock': {
        audio.splash();
        const roll = Math.random();
        if (roll < 0.5) {
          setCoins((c) => c + 25);
          transitionTimers.current.push(setTimeout(() => audio.reward(), 380));
          showToast('🎣 ¡Pescaste un pez! +25 brews');
        } else if (roll < 0.8) {
          useVitalsStore.getState().heal(12);
          transitionTimers.current.push(setTimeout(() => audio.ui('confirm'), 380));
          showToast('🐟 Un pez pequeño — +12 de salud');
        } else {
          showToast('🫧 Se te escapó... vuelve a intentar');
        }
        break;
      }
      case 'cherry-lookout':
        useVitalsStore.getState().heal(25);
        useVitalsStore.getState().regenStamina(45);
        audio.reward();
        showToast('🌸 Un respiro bajo los cerezos — salud y energía');
        break;
      case 'flower-garden':
        useVitalsStore.getState().regenStamina(60);
        audio.ui('confirm');
        showToast('🌻 El aroma te reanima — +energía');
        break;
      case 'greet-fisherman':
        audio.ui('confirm');
        showToast(pickGreeting('fisherman'));
        break;
      case 'greet-hiker':
        audio.ui('confirm');
        showToast(pickGreeting('hiker'));
        break;
      case 'pet-dog':
        useVitalsStore.getState().heal(8);
        audio.reward();
        showToast('🐾 Le rascas las orejas — +8 de salud');
        break;
      case 'waterfall-cove':
        useVitalsStore.getState().heal(15);
        useVitalsStore.getState().regenStamina(40);
        audio.ui('confirm');
        showToast('🌊 El agua fresca te revitaliza — salud y energía');
        break;
      case 'sleep':
        useVitalsStore.getState().regenStamina(100);
        useVitalsStore.getState().heal(35);
        audio.ui('confirm');
        showToast('💤 Duermes un rato — energía y salud restauradas');
        break;
    }
  };

  const handleInteract = (zoneId: InteractionZoneId) => {
    if (zoneId === 'exit-house') {
      travelTo('world', 'Saliendo al mundo');
    } else if (isContentZone(zoneId)) {
      audio.ui('open');
      setOpenZone(zoneId);
    } else {
      handleWorldZone(zoneId as WorldZoneId);
    }

    if (!visited.current.has(zoneId)) {
      visited.current.add(zoneId);
      setCoins((c) => c + 50);
    }
  };

  /* ---------------- carga y desbloqueo de audio ---------------- */

  const { progress, active } = useProgress();
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    // La pantalla de carga no se va en cuanto los assets están: se
    // espera un frame extra para que la primera imagen ya esté
    // compuesta y no se vea un parpadeo.
    if (!active && progress >= 100 && !booted) {
      const id = setTimeout(() => setBooted(true), 500);
      return () => clearTimeout(id);
    }
  }, [active, progress, booted]);

  useEffect(() => {
    // Política de autoplay: el audio no puede arrancar sin un gesto.
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

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
          @keyframes kw-rise {
            from { transform: translateY(0) scale(1); opacity: 0; }
            12% { opacity: 0.85; }
            to { transform: translateY(-105vh) scale(0.6); opacity: 0; }
          }
        `}
      </style>

      <CoinBadge coins={coins} />
      {location === 'world' && <VitalsHud />}
      <SoundToggle />
      <CameraRecenterButton />
      <DebugOverlay location={location} />
      <ControlsHint isTouch={isTouch} />
      <NearbyPrompt zone={openZone ? null : nearbyZone} isTouch={isTouch} />
      <Toast text={toast} />
      <LocationHint location={location} />

      <Scene
        location={location}
        onInteract={handleInteract}
        onNearbyZoneChange={setNearbyZone}
      />

      <TouchControls />

      <InteractionModal
        section={openZone ? SECTIONS[openZone] : null}
        onClose={() => {
          audio.ui('close');
          setOpenZone(null);
        }}
      />

      {/* Velo de transición entre escenas */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#080b0f',
          opacity: veil,
          transition: 'opacity 0.42s ease',
          pointerEvents: 'none',
          zIndex: 150,
        }}
      />

      <LoadingScreen
        progress={progress}
        visible={!booted}
        label={transitionLabel === 'Cargando' ? 'Cargando' : transitionLabel}
      />
    </main>
  );
}

export default App;
