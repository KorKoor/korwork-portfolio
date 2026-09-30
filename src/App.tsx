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
  Search,
  Smartphone,
  Globe,
  Server,
  Database,
  Layers,
  Brain,
  Music,
  Gamepad2,
  MessageCircle,
  Target,
  Phone,
  Infinity as InfinityIcon,
  Box,
  Dumbbell,
  Footprints,
  Cookie,
  Utensils,
  Puzzle,
  Tv,
  Unlock,
  Languages as LanguagesIcon,
  Pizza,
  Beef,
  Salad,
  Sandwich,
  Bone,
  Guitar,
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

interface ProjectData {
  name: string;
  desc: string;
  tags: string[];
  badge?: string;
  links: { label: string; href: string }[];
}

function ProjectCard({ data, accent }: { data: ProjectData; accent: string }) {
  return (
    <div
      style={{
        padding: '14px 0',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {data.badge && (
        <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 800, color: accent, letterSpacing: '0.02em' }}>
          {data.badge}
        </p>
      )}
      <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#f8fafc', fontSize: '14.5px' }}>
        {data.name}
      </p>
      <p style={{ margin: '0 0 8px', color: '#cbd5e1', fontSize: '13.5px', lineHeight: 1.55 }}>
        {data.desc}
      </p>
      <div style={{ marginBottom: '8px' }}>
        {data.tags.map((tag) => (
          <span key={tag} style={chipStyle(accent)}>
            {tag}
          </span>
        ))}
      </div>
      {data.links.length > 0 ? (
        <div>
          {data.links.map((link) => (
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
      ) : (
        <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
          🔒 Código privado
        </span>
      )}
    </div>
  );
}

const APPS_DATA: ProjectData[] = [
  {
    badge: '🎮 Google Play',
    name: 'ParDos: Zen Math',
    desc: 'Puzzle publicado en Google Play con certificación global IARC. Arquitectura 100% Jetpack Compose, 80+ logros únicos y animaciones Juicy UI.',
    tags: ['Kotlin', 'Jetpack Compose', 'Google Play', 'IARC'],
    links: [
      { label: 'Play Store', href: 'https://play.google.com/store/apps/details?id=com.korkoor.pardos' },
      { label: 'Sitio oficial', href: 'https://www.korwork.org/pardos.html' },
      { label: 'GitHub', href: 'https://github.com/KorKoor/ParDos-Puzzle-Game' },
    ],
  },
  {
    badge: '🏥 HealthTech',
    name: 'ACIF Hipertensión',
    desc: 'Herramienta médica para el control y registro de presión arterial. Genera reportes locales con gráficas de tendencia, pensada para accesibilidad en adultos mayores.',
    tags: ['Java', 'Android', 'SQLite', 'UX Médico'],
    links: [
      { label: 'Descargar APK', href: 'https://www.mediafire.com/file/8qqyd4hrw1ynlrv/ACIF_Hipertension.apk/file' },
      { label: 'GitHub', href: 'https://github.com/KorKoor/Hipertension_App_ACIF' },
    ],
  },
  {
    badge: '🏥 UAA · Salud',
    name: 'ACIF Diabetes',
    desc: 'Gestión de glucosa y fases de tratamiento, desarrollada en colaboración con el Departamento de Enfermería de la UAA. Proyecto real con impacto institucional.',
    tags: ['Kotlin', 'HealthTech', 'Colaboración UAA'],
    links: [
      { label: 'Descargar APK', href: 'https://www.mediafire.com/file/j9kd47buqd2lgxw/ACIF-Diabetes.apk/file' },
      { label: 'GitHub', href: 'https://github.com/KorKoor/Diabetes_App_ACIF' },
    ],
  },
  {
    badge: '🚀 Live',
    name: 'CV Analyzer — KorWork',
    desc: 'SaaS que analiza CVs en PDF y encuentra vacantes reales en LinkedIn, OCC, Indeed y Computrabajo. Motor de clusters en JS puro — sin IA, sin NLP — con funciones serverless en Vercel como proxy de scraping.',
    tags: ['JavaScript', 'Serverless', 'PDF.js', 'Vercel'],
    links: [
      { label: 'Abrir App', href: 'https://cv.korwork.org' },
      { label: 'GitHub', href: 'https://github.com/KorKoor/CV_Analyzer' },
    ],
  },
  {
    badge: '✨ Premium',
    name: 'Natalia Castro · Eventos',
    desc: 'Sitio web de ultra lujo para productora de eventos de alta gama: tipografía serif editorial, paleta dorada y animaciones cinematográficas.',
    tags: ['HTML', 'CSS', 'JS', 'Diseño Premium'],
    links: [
      { label: 'Ver sitio', href: 'https://www.korwork.org/landing-eventos-exclusivos' },
      { label: 'GitHub', href: 'https://github.com/KorKoor/landing-eventos-exclusivos' },
    ],
  },
  {
    badge: '🎙️ Stream',
    name: 'Online Screen',
    desc: 'Layout principal con integración real del chat de Twitch vía WebSockets, en tiempo real y sin polling. Totalmente responsivo para OBS Studio.',
    tags: ['WebSockets', 'JavaScript', 'Twitch API'],
    links: [
      { label: 'Ver layout', href: 'https://stream.korwork.org/OnlineScreen.html' },
      { label: 'GitHub', href: 'https://github.com/KorKoor/Streams-Layouts' },
    ],
  },
];

const CODE_DATA: ProjectData[] = [
  {
    badge: '🌐 Full Stack',
    name: 'PLAY-ZONE Social Network',
    desc: 'Plataforma social full-stack para gamers con perfiles, guías interactivas y reseñas. API RESTful propia con autenticación y persistencia de datos — producto completo end-to-end.',
    tags: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    links: [{ label: 'GitHub', href: 'https://github.com/KorKoor/PLAY-ZONE' }],
  },
  {
    badge: '🖐️ Open Source',
    name: 'Mario-64-WebCam',
    desc: 'Mod que controla Super Mario 64 CoopDX con gestos de las manos. Python + MediaPipe reconocen puño, palma y paz en tiempo real; un puente JSON los sincroniza con un mod en Lua — una mano mueve a Mario, la otra invoca objetos del mundo.',
    tags: ['Python', 'MediaPipe', 'Lua', 'OpenCV'],
    links: [{ label: 'GitHub', href: 'https://github.com/KorKoor/Mario-64-WebCam' }],
  },
  {
    badge: '📊 Data Science',
    name: 'Analizador Estadístico de Encuestas',
    desc: 'Procesa y visualiza resultados de encuestas con rigor estadístico: mapas de calor y gráficas de distribución generadas con pandas, SciPy, Matplotlib y Seaborn.',
    tags: ['Python', 'pandas', 'SciPy', 'Seaborn'],
    links: [],
  },
  {
    badge: '✂️ Computer Vision',
    name: 'Recomendador de Corte por Geometría Facial',
    desc: 'Analiza los landmarks faciales detectados por MediaPipe para determinar la forma del rostro y recomendar el corte de cabello ideal según proporciones geométricas.',
    tags: ['Python', 'MediaPipe', 'OpenCV'],
    links: [],
  },
  {
    badge: '🧬 Algoritmos',
    name: 'Sudoku Solver ADN',
    desc: 'Solucionador de sudokus 9×9 con algoritmos genéticos: mutación, selección natural y evolución iterativa. Alto rendimiento en C++ con metaheurísticas de optimización.',
    tags: ['C++', 'Algoritmos Genéticos', 'Optimización'],
    links: [{ label: 'GitHub', href: 'https://github.com/KorKoor/Sudoku_ADN' }],
  },
  {
    badge: '🎙️ Live',
    name: 'Stream Overlays — KorWork',
    desc: 'Suite de overlays para streaming en tiempo real: chat de Twitch vía WebSockets, pantalla BRB con marco de video y una animación de galaxia de partículas para el cierre.',
    tags: ['WebSockets', 'CSS Animations', 'Twitch API'],
    links: [{ label: 'GitHub', href: 'https://github.com/KorKoor/Streams-Layouts' }],
  },
];

function ProjectsPanel() {
  const [tab, setTab] = useState<'apps' | 'code'>('apps');
  const accent = '#7dd3fc';
  const data = tab === 'apps' ? APPS_DATA : CODE_DATA;

  return (
    <div>
      <p style={{ color: '#cbd5e1', fontSize: '13.5px', lineHeight: 1.6, margin: '0 0 14px' }}>
        Algunas cosas que he construido últimamente ☕
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        {(['apps', 'code'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '10px',
              border: `1px solid ${tab === key ? accent : 'rgba(255,255,255,0.1)'}`,
              background: tab === key ? `${accent}1f` : 'rgba(255,255,255,0.03)',
              color: tab === key ? accent : '#94a3b8',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {key === 'apps' ? '🚀 Apps & Productos' : '💻 Código & Experimentos'}
          </button>
        ))}
      </div>

      {data.map((project) => (
        <ProjectCard key={project.name} data={project} accent={accent} />
      ))}

      <div
        style={{
          marginTop: '16px',
          padding: '14px',
          borderRadius: '14px',
          background: 'rgba(125, 211, 252, 0.06)',
          border: '1px solid rgba(125, 211, 252, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '16px' }}>
          {[['15+', 'Repos'], ['3', 'Apps'], ['100%', 'Pasión']].map(([value, label]) => (
            <div key={label}>
              <p style={{ margin: 0, color: '#7dd3fc', fontWeight: 800, fontSize: '16px' }}>{value}</p>
              <p
                style={{
                  margin: 0,
                  color: '#94a3b8',
                  fontSize: '10.5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
        <a
          href="https://github.com/KorKoor?tab=repositories"
          target="_blank"
          rel="noreferrer"
          style={{ ...linkPillStyle(accent), padding: '7px 14px', fontSize: '12.5px' }}
        >
          <GitBranch size={13} /> Perfil completo
        </a>
      </div>
    </div>
  );
}

interface SkillItem {
  name: string;
  level: number;
}

interface SkillGroup {
  label: string;
  icon: ReactNode;
  accent: string;
  items: SkillItem[];
}

const SKILL_GROUPS: SkillGroup[] = [
  {
    label: 'Mobile — Android Nativo',
    icon: <Smartphone size={15} />,
    accent: '#7dd3fc',
    items: [
      { name: 'Kotlin', level: 68 },
      { name: 'Jetpack Compose', level: 65 },
      { name: 'Kotlin Multiplatform', level: 35 },
      { name: 'Android SDK', level: 60 },
      { name: 'MVVM / MVI', level: 55 },
      { name: 'Coroutines & Flow', level: 50 },
      { name: 'Room · Hilt · Retrofit', level: 50 },
    ],
  },
  {
    label: 'Frontend & Web',
    icon: <Globe size={15} />,
    accent: '#c4b5fd',
    items: [
      { name: 'React.js / Next.js', level: 50 },
      { name: 'JavaScript (ES6+)', level: 55 },
      { name: 'TypeScript', level: 40 },
      { name: 'Three.js / React Three Fiber', level: 35 },
      { name: 'HTML5 & CSS3', level: 60 },
      { name: 'Tailwind CSS', level: 45 },
      { name: 'APIs RESTful', level: 55 },
    ],
  },
  {
    label: 'Backend & Core',
    icon: <Server size={15} />,
    accent: '#6ee7b7',
    items: [
      { name: 'Python (Django / FastAPI)', level: 45 },
      { name: 'PHP (CodeIgniter)', level: 35 },
      { name: 'Node.js / Express', level: 40 },
      { name: 'C# (.NET)', level: 35 },
      { name: 'C / C++', level: 35 },
      { name: 'Arquitectura Limpia', level: 40 },
      { name: 'GraphQL', level: 25 },
    ],
  },
  {
    label: 'Data Science & Visión Artificial',
    icon: <Brain size={15} />,
    accent: '#fdba74',
    items: [
      { name: 'pandas / NumPy', level: 40 },
      { name: 'SciPy', level: 30 },
      { name: 'Matplotlib / Seaborn', level: 40 },
      { name: 'OpenCV', level: 40 },
      { name: 'MediaPipe', level: 40 },
      { name: 'scikit-learn', level: 30 },
    ],
  },
  {
    label: 'Data, Cloud & DevOps',
    icon: <Database size={15} />,
    accent: '#f9a8d4',
    items: [
      { name: 'SQL (PostgreSQL / MySQL)', level: 50 },
      { name: 'MongoDB / Firebase', level: 45 },
      { name: 'Git / GitHub', level: 60 },
      { name: 'Docker', level: 25 },
      { name: 'Algoritmos & Estructuras', level: 45 },
      { name: 'Google Play Store', level: 55 },
    ],
  },
  {
    label: 'Cross-platform & Extras',
    icon: <Layers size={15} />,
    accent: '#67e8f9',
    items: [
      { name: 'React Native', level: 35 },
      { name: 'WebSockets / Tiempo real', level: 40 },
      { name: 'Figma / UI Design', level: 40 },
      { name: 'HealthTech Apps', level: 50 },
      { name: 'Twitch / OBS Overlays', level: 45 },
      { name: 'Serverless (Render / Vercel)', level: 45 },
    ],
  },
];

function SkillBar({ name, level, accent }: { name: string; level: number; accent: string }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setWidth(level), 40);
    return () => clearTimeout(id);
  }, [level]);

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ color: '#e2e8f0', fontSize: '12.5px', fontWeight: 600 }}>{name}</span>
        <span style={{ color: accent, fontSize: '11.5px', fontWeight: 700, fontFamily: 'monospace' }}>
          {level}%
        </span>
      </div>
      <div
        style={{
          height: '6px',
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${width}%`,
            height: '100%',
            borderRadius: '999px',
            background: `linear-gradient(90deg, ${accent}88, ${accent})`,
            boxShadow: `0 0 8px ${accent}55`,
            transition: 'width 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
    </div>
  );
}

function SkillsPanel() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const filteredGroups = SKILL_GROUPS.map((group) => ({
    ...group,
    items: q ? group.items.filter((item) => item.name.toLowerCase().includes(q)) : group.items,
  })).filter((group) => group.items.length > 0);

  return (
    <div>
      <div
        style={{
          position: 'sticky',
          top: '-2px',
          zIndex: 2,
          background: 'linear-gradient(165deg, #1c1626 0%, #120e18 100%)',
          paddingBottom: '10px',
          marginBottom: '4px',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            color="#94a3b8"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar tecnología..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '9px 12px 9px 34px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(196, 181, 253, 0.3)',
              color: '#f8fafc',
              fontSize: '13px',
              fontFamily: "'Nunito', 'Segoe UI', system-ui, sans-serif",
              outline: 'none',
            }}
          />
        </div>
      </div>

      {filteredGroups.length === 0 && (
        <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
          Sin resultados para "{query}"
        </p>
      )}

      {filteredGroups.map((group) => (
        <div key={group.label} style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
            <span style={{ color: group.accent, display: 'flex' }}>{group.icon}</span>
            <p
              style={{
                margin: 0,
                fontSize: '11.5px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: group.accent,
                fontWeight: 800,
              }}
            >
              {group.label}
            </p>
          </div>
          {group.items.map((item) => (
            <SkillBar key={item.name} name={item.name} level={item.level} accent={group.accent} />
          ))}
        </div>
      ))}
    </div>
  );
}

interface PersonalChip {
  icon: ReactNode;
  label: string;
  color: string;
}

interface PersonalItem {
  icon: ReactNode;
  title: string;
  desc: string;
  stat: string;
  chips?: PersonalChip[];
}

interface PersonalGroup {
  label: string;
  items: PersonalItem[];
}

// Sacado directo de personal.js ("Mundo Interno") en korkoor.github.io —
// el lado humano detrás del código, en sus propias palabras.
const PERSONAL_GROUPS: PersonalGroup[] = [
  {
    label: 'Mi Esencia',
    items: [
      {
        icon: <Heart size={15} />,
        title: 'Sensibilidad',
        desc: 'No es fragilidad, es mi motor. Percibo matices que otros ignoran. Mi filosofía es "Todo o Nada": prefiero pocos intereses profundos y reales antes que muchos superficiales. Lo mío es verdad, incluso cuando duele.',
        stat: 'Esencia',
      },
      {
        icon: <InfinityIcon size={15} />,
        title: 'Neurodivergente',
        desc: 'Formo parte del espectro autista y no lo escondo: explica mi hiperfoco, mi honestidad sin filtros y mi necesidad de lógica y rutinas claras. Es la forma en la que proceso el mundo, no algo que deba disimular.',
        stat: 'TEA',
      },
      {
        icon: <Box size={15} />,
        title: 'Orden y Caos',
        desc: 'Los cubos Rubik satisfacen mi necesidad de demostrar que incluso el caos más complejo tiene una solución lógica.',
        stat: 'Resolución',
      },
      {
        icon: <Zap size={15} />,
        title: 'Mente Rápida',
        desc: 'No memorizo, comprendo. Cuando algo me atrapa, el tiempo se distorsiona y entro en un foco absoluto para desmontar la lógica de las cosas.',
        stat: 'Aprendizaje Profundo',
      },
      {
        icon: <Guitar size={15} />,
        title: 'Música',
        desc: 'Mi escape sensible. Tocar instrumentos conecta con esa parte de mí que siente intensamente.',
        stat: 'Pasión',
      },
      {
        icon: <Bone size={15} />,
        title: 'Fascinación',
        desc: 'Gigantes, antiguos y reales. Me asombra lo que deja huella en la historia.',
        stat: 'Historia',
      },
    ],
  },
  {
    label: 'Cuerpo & Descanso',
    items: [
      {
        icon: <Dumbbell size={15} />,
        title: 'Fuerza & Hipertrofia',
        desc: 'Contrarresto las horas de pantalla con entrenamiento de fuerza enfocado en hipertrofia, principalmente con mancuernas. Disciplina física para sostener el rendimiento mental.',
        stat: 'Gimnasio',
      },
      {
        icon: <Footprints size={15} />,
        title: 'Caminatas Largas',
        desc: 'Complemento el esfuerzo explosivo del gym con caminatas largas al aire libre. Despejan mi mente y mantienen mi condición cardiovascular.',
        stat: 'Cardio & Mente',
      },
      {
        icon: <Cookie size={15} />,
        title: 'Comfort Food',
        desc: 'Papas fritas y dulces: mi lado más simple y reconfortante. El placer culposo que balancea la disciplina del resto del día.',
        stat: 'Antojos',
      },
      {
        icon: <Utensils size={15} />,
        title: 'Mi Menú de Siempre',
        desc: 'Cuatro clásicos que nunca fallan. Sin pretensiones, directo al punto — igual que mi código.',
        stat: 'Comida Favorita',
        chips: [
          { icon: <Sandwich size={11} />, label: 'Hotdogs', color: '#D84315' },
          { icon: <Pizza size={11} />, label: 'Pizza', color: '#F57C00' },
          { icon: <Salad size={11} />, label: 'Ensalada', color: '#43A047' },
          { icon: <Beef size={11} />, label: 'Hamburguesa', color: '#6D4C41' },
        ],
      },
    ],
  },
  {
    label: 'Pantallas & Nostalgia',
    items: [
      {
        icon: <Gamepad2 size={15} />,
        title: 'Gamer Versátil',
        desc: 'Acción y competitividad en Call of Duty: Cold War, y progreso constante explorando el mundo real con Pokémon GO. Dos formas muy distintas de jugar.',
        stat: 'Videojuegos',
      },
      {
        icon: <Puzzle size={15} />,
        title: 'Modding',
        desc: 'Disfruto el entorno colaborativo de crear mods: Java con libGDX y experimentos dentro del ecosistema de Super Mario 64 CoopDX.',
        stat: 'Comunidad',
      },
      {
        icon: <Tv size={15} />,
        title: 'Nostalgia Toonix',
        desc: 'Mantengo vivo el gusto por la estética de los avatares Toonix de Cartoon Network. Un guiño constante a mi infancia.',
        stat: 'Recuerdos',
      },
      {
        icon: <Unlock size={15} />,
        title: 'Curiosidad Técnica',
        desc: 'Mi curiosidad no descansa ni en mis propios dispositivos: uso herramientas como Sideloadly para instalar apps fuera del ecosistema cerrado de iOS.',
        stat: 'Hacking Ético',
      },
    ],
  },
  {
    label: 'Fronteras',
    items: [
      {
        icon: <Brain size={15} />,
        title: 'Futuro & IA',
        desc: 'Investigo obsesivamente cómo la Inteligencia Artificial redefine nuestra capacidad de crear soluciones.',
        stat: 'Innovación',
      },
      {
        icon: <LanguagesIcon size={15} />,
        title: 'Fronteras del Idioma',
        desc: 'Pulo mi inglés (B2) para dominar entrevistas técnicas, y en paralelo me aventuro con los diálogos básicos del francés.',
        stat: 'Inglés B2 · Francés A1',
      },
    ],
  },
];

function PersonalCard({ item, accent }: { item: PersonalItem; accent: string }) {
  return (
    <div
      style={{
        padding: '12px 13px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        marginBottom: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ color: accent, display: 'flex' }}>{item.icon}</span>
        <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px' }}>{item.title}</span>
      </div>
      <p style={{ margin: '0 0 8px', color: '#94a3b8', fontSize: '12px', lineHeight: 1.55 }}>{item.desc}</p>
      {item.chips && (
        <div style={{ marginBottom: '8px' }}>
          {item.chips.map((chip) => (
            <span
              key={chip.label}
              style={{ ...chipStyle(chip.color), display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {chip.icon} {chip.label}
            </span>
          ))}
        </div>
      )}
      <span
        style={{
          fontSize: '10.5px',
          fontWeight: 800,
          color: accent,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {item.stat}
      </span>
    </div>
  );
}

function AboutProfessional() {
  return (
    <div>
      <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#f8fafc', fontSize: '16px' }}>
        Carlos García Huerta
      </p>
      <p style={{ margin: '0 0 6px', color: '#fdba74', fontSize: '13px' }}>
        Software Developer · Aguascalientes, MX
      </p>
      <p style={{ margin: '0 0 14px', color: '#94a3b8', fontSize: '12px' }}>
        Lic. en Informática y Tecnologías Computacionales — UAA
      </p>
      <p style={{ margin: '0 0 18px', color: '#cbd5e1', fontSize: '13.5px', lineHeight: 1.65 }}>
        Desarrollador de Software especializado en el ecosistema móvil con Kotlin y Jetpack
        Compose, con experiencia llevando proyectos desde la concepción hasta su publicación en
        Google Play Store. Además tengo visión integral: construyo plataformas web y backend con
        React, Python (Django/FastAPI) y bases SQL/NoSQL. He colaborado con equipos
        multidisciplinarios — especialmente en salud — traduciendo requerimientos complejos en
        herramientas digitales intuitivas.
      </p>

      <p
        style={{
          margin: '0 0 8px',
          fontSize: '11.5px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#fdba74',
          fontWeight: 800,
        }}
      >
        Soft Skills
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
        {[
          {
            icon: <Brain size={15} />,
            title: 'Pensamiento Analítico',
            desc: 'Descompongo problemas complejos en partes lógicas manejables.',
          },
          {
            icon: <Sparkles size={15} />,
            title: 'Curiosidad Técnica',
            desc: 'Salto entre tecnologías según lo que el problema realmente necesite.',
          },
          {
            icon: <MessageCircle size={15} />,
            title: 'Comunicación Directa',
            desc: 'Explico lo técnico sin rodeos, claro para cualquiera del equipo.',
          },
          {
            icon: <Target size={15} />,
            title: 'Persistencia',
            desc: 'Un bug difícil no me detiene: es un dato más para iterar.',
          },
        ].map((skill) => (
          <div
            key={skill.title}
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: '#fdba74' }}>
              {skill.icon}
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>{skill.title}</span>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '11.5px', lineHeight: 1.5 }}>{skill.desc}</p>
          </div>
        ))}
      </div>

      <p
        style={{
          margin: '0 0 6px',
          fontSize: '11.5px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#fdba74',
          fontWeight: 800,
        }}
      >
        Idiomas
      </p>
      <p style={{ margin: '0 0 4px', color: '#e2e8f0', fontSize: '13px' }}>
        <b>Español</b> — Nativo
      </p>
      <p style={{ margin: '0 0 18px', color: '#e2e8f0', fontSize: '13px', lineHeight: 1.55 }}>
        <b>Inglés</b> — B2 (Intermediate): entornos profesionales, lectura y escritura técnica.
      </p>

      <p
        style={{
          margin: '0 0 8px',
          fontSize: '11.5px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#fdba74',
          fontWeight: 800,
        }}
      >
        Fuera del código
      </p>
      <div>
        {[
          { label: 'IA & LLMs', icon: <Brain size={12} /> },
          { label: 'Músico', icon: <Music size={12} /> },
          { label: 'Game Dev', icon: <Code size={12} /> },
          { label: 'Gamer', icon: <Gamepad2 size={12} /> },
        ].map((tag) => (
          <span
            key={tag.label}
            style={{ ...chipStyle('#fdba74'), display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            {tag.icon} {tag.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function AboutEssence() {
  const accent = '#fdba74';

  return (
    <div>
      <p style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: 1.6, margin: '0 0 14px' }}>
        La parte humana detrás del código — en mis propias palabras.
      </p>
      {PERSONAL_GROUPS.map((group) => (
        <div key={group.label} style={{ marginBottom: '18px' }}>
          <p
            style={{
              margin: '0 0 10px',
              fontSize: '11.5px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: accent,
              fontWeight: 800,
            }}
          >
            {group.label}
          </p>
          {group.items.map((item) => (
            <PersonalCard key={item.title} item={item} accent={accent} />
          ))}
        </div>
      ))}
    </div>
  );
}

function AboutPanel() {
  const [tab, setTab] = useState<'pro' | 'esencia'>('pro');
  const accent = '#fdba74';

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['pro', 'esencia'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '10px',
              border: `1px solid ${tab === key ? accent : 'rgba(255,255,255,0.1)'}`,
              background: tab === key ? `${accent}1f` : 'rgba(255,255,255,0.03)',
              color: tab === key ? accent : '#94a3b8',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {key === 'pro' ? '💼 Profesional' : '🫀 Mi Esencia'}
          </button>
        ))}
      </div>
      {tab === 'pro' ? <AboutProfessional /> : <AboutEssence />}
    </div>
  );
}

const SECTIONS: Record<ContentZoneId, Section> = {
  projects: {
    title: 'Proyectos',
    icon: <Code size={20} />,
    accent: '#7dd3fc',
    hint: 'en el escritorio',
    content: <ProjectsPanel />,
  },

  skills: {
    title: 'Stack Tecnológico',
    icon: <Sparkles size={20} />,
    accent: '#c4b5fd',
    hint: 'en el librero',
    content: <SkillsPanel />,
  },

  about: {
    title: 'Sobre mí',
    icon: <Heart size={20} />,
    accent: '#fdba74',
    hint: 'en el sofá',
    content: <AboutPanel />,
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
          <a href="tel:+524496250145" style={linkPillStyle('#6ee7b7')}>
            <Phone size={14} /> 449 625 0145
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
          maxWidth: '580px',
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
