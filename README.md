<div align="center">

# 🎮 korwork-portfolio

### Un portafolio que no se lee. Se juega.

Un mundo 3D isométrico pixel-art hecho con React Three Fiber donde cada rincón —el cuarto, el pueblo, la cueva, el lago— es en realidad una sección de mi portafolio. Nada de scroll interminable: caminas, interactúas, y el juego mismo te cuenta quién soy.

[**🕹️ Jugarlo en vivo → portrait.korwork.org**](https://portrait.korwork.org/)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r185-000000?logo=three.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Zustand](https://img.shields.io/badge/state-zustand-orange)
![Deploy](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)

</div>

---

## ✨ Qué es esto

Abres el sitio y apareces dentro de un cuarto pixel-art en perspectiva 2.5D. El escritorio son mis proyectos, el librero mis habilidades, el sofá mi historia, la puerta te saca a un mundo abierto con día/noche real, clima, fauna que huye o se te acerca según qué tan quieto estés parado, y NPCs con los que puedes hablar. Todo corre a 60fps en el navegador, sin backend, sin base de datos — es un `<canvas>` con una máquina de estados bastante ambiciosa detrás.

No hay un solo asset descargado de un banco de sonidos: cada paso, grillo, trueno o gota de lluvia se **sintetiza en tiempo real** con WebAudio. No hay un motor de terreno externo: el mundo entero (colinas, el valle de la cueva, la cuenca del lago) es una función matemática determinista evaluada por vértice.

## 🎬 Recorrido rápido

| 🏠 Interior | 🌳 Mundo abierto |
|---|---|
| Escritorio, sofá, cama, librero — cada mueble es una zona interactiva que abre contenido real del portafolio | Día/noche completo, 4 estados de clima, 5 biomas, un lago con shader de agua real, una cueva con cristales, una cascada |
| El personaje se sienta solo a armar un cubo de Rubik si te quedas quieto mucho rato | Perros que se acercan si no te mueves, ardillas y conejos que huyen, venados esquivos, murciélagos en la cueva |
| Sistema de energía/salud con cama para dormir | NPCs con diálogo, sistema de "vehículos" (bici/patineta) con boost real de velocidad |

## 🕹️ Controles

| Acción | Tecla / Input |
|---|---|
| Moverse | `WASD` o flechas |
| Correr (gasta energía) | `Shift` |
| Interactuar | `E` o `Espacio` |
| Rotar cámara | Clic derecho + arrastrar |
| Zoom | Rueda del mouse |
| Recentrar cámara | Doble clic |
| Móvil | Joystick virtual + botón de interactuar (se detecta el dispositivo solo) |

## 🏗️ Arquitectura — las decisiones que importan

Este proyecto se construyó con una regla no negociable: **lo que se ve y lo que se camina nunca se pueden desincronizar.** Eso llevó a un patrón que se repite en todo el código:

```
world/terrain.ts       →  altura del terreno (fuente única de verdad)
world/collision.ts     →  qué hay en cada punto del mapa y qué bloquea el paso
world/atmosphere.ts    →  hora del día, clima, viento — un solo reloj para todo
world/paths.ts         →  la red de caminos de piedra
```

Ni `Terrain.tsx` (la malla visual), ni `Player.tsx` (el movimiento), ni `Wildlife.tsx` (la fauna) calculan nada por su cuenta — **todos leen de las mismas cuatro funciones**. Si el terreno sube una colina, el jugador la sube exactamente igual y un venado que camina por ahí también respeta esa altura, porque literalmente es la misma llamada a `getWorldTerrainHeight(x, z)`.

Otras decisiones que vale la pena mencionar:

- **Sin `Math.random()` en el mundo.** Todo lo que decide dónde nace un árbol o una roca usa un `hash(seed)` determinista (senoidal, no una librería de ruido). El mapa es *siempre* el mismo entre recargas — esencial para que las colisiones y el render nunca diverjan.
- **Un jugador, dos hojas de sprites, una sola escala.** El personaje corta por UV una textura base (sin cargar 40 archivos sueltos); cada hoja de sprites tiene su propia densidad de píxeles, así que hay una constante de "unidades de mundo por píxel" calibrada por hoja para que sentado, corriendo o durmiendo se vea siempre del tamaño correcto.
- **Estado de alta frecuencia fuera de React.** Cámara, controles y física del jugador viven en refs / módulos zustand leídos con `getState()` dentro de `useFrame` — nada de eso dispara un re-render de React a 60fps.
- **Audio 100% procedural.** `AudioEngine.ts` sintetiza viento, lluvia, grillos, pasos y hasta truenos con osciladores y ruido rosa filtrado — cero archivos `.mp3` en el bundle, y el sonido reacciona al estado real del clima, no a un archivo pregrabado.
- **Nivel de calidad adaptativo.** `useQualityTier` detecta dispositivos táctiles o de pocos núcleos y baja resolución de sombras/DPR/MSAA automáticamente — la misma escena, a una fracción del costo de GPU en celulares de gama media.

## 🛠️ Stack tecnológico

| Capa | Herramienta |
|---|---|
| Render 3D | [Three.js](https://threejs.org/) vía [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) + [drei](https://github.com/pmndrs/drei) |
| Post-proceso | `@react-three/postprocessing` (bloom, MSAA condicional) |
| UI / lógica | React 19 + TypeScript (modo estricto) |
| Estado | Zustand (sin providers, sin boilerplate) |
| Audio | WebAudio API pura, sintetizado a mano |
| Build | Vite 8 |
| Lint | Oxlint |
| Hosting | Vercel |

## 📁 Estructura del proyecto

```
src/
├── App.tsx                    # Shell de la UI, contenido del portafolio, HUD
├── audio/AudioEngine.ts       # Motor de audio procedural (WebAudio)
├── world/                     # Fuente única de verdad del mundo exterior
│   ├── terrain.ts             #   altura/pendiente del terreno
│   ├── collision.ts           #   biomas, dispersión de vegetación, obstáculos
│   ├── atmosphere.ts          #   día/noche, clima, viento
│   └── paths.ts               #   caminos de piedra
├── components/
│   ├── canvas/
│   │   ├── Player.tsx         # Movimiento, animación, colisiones, interacción
│   │   ├── Room.tsx           # Cuarto interior (primitivas de caja)
│   │   ├── Scene.tsx          # Canvas, luces, post-proceso
│   │   └── world/             # Todo lo del mundo exterior: terreno, clima,
│   │                          # fauna, NPCs, casa, cueva, cascada, cielo...
│   └── ui/                    # HUD, minimapa, pantalla de carga, controles táctiles
├── store/                     # Zustand: vitals, cámara, controles, vehículo
└── hooks/                     # Teclado, detección táctil, nivel de calidad
```

## 🚀 Correrlo local

```bash
git clone https://github.com/KorKoor/korwork-portfolio.git
cd korwork-portfolio
npm install
npm run dev
```

Abre `http://localhost:5173`.

### Scripts disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Typecheck (`tsc -b`) + build de producción a `dist/` |
| `npm run preview` | Sirve el build de producción localmente |
| `npm run lint` | Oxlint sobre todo el proyecto |

## 🎨 El contenido es real

Cada zona interactiva abre información real, no texto de relleno: apps publicadas en Google Play, herramientas de salud desarrolladas con el Departamento de Enfermería de la UAA, y el resto de mi trabajo — con links a cada repo y descarga.

## 👤 Autor

**Carlo** — [KorKoor](https://github.com/KorKoor) · [korwork.org](https://korwork.org)

## 📄 Licencia

Código y assets sin licencia pública explícita — es mi portafolio personal. Si algo de la arquitectura te sirve de inspiración, adelante; si quieres reusar assets o contenido tal cual, pregúntame antes.
