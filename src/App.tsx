import { useState, type ReactNode } from 'react';
import { Scene } from './components/canvas/Scene';

function InteractionModal({
  isOpen,
  onClose,
  title,
  content,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: ReactNode;
}) {
  if (!isOpen) return null;

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
        background: 'rgba(0, 0, 0, 0.65)',
        zIndex: 20,
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '520px',
          margin: '20px',
          padding: '24px',
          borderRadius: '16px',
          background: '#0f172a',
          color: 'white',
          border: '1px solid #475569',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: '#334155',
            border: 'none',
            color: '#94a3b8',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          ✕
        </button>
        <h2 style={{ marginTop: 0, color: '#38bdf8' }}>{title}</h2>
        {content}
      </div>
    </div>
  );
}

function App() {
  const [isDeskOpen, setIsDeskOpen] = useState(false);
  const [coins, setCoins] = useState(0);

  const handleOpenDesk = () => {
    setIsDeskOpen(true);
    setCoins((prev) => prev + 50); // Recompensa por interactuar
  };

  return (
    <main style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* HUD Superior: Monedas */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(15, 23, 42, 0.85)',
        color: '#fbbf24',
        padding: '8px 16px',
        borderRadius: '20px',
        border: '1px solid #475569',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        fontSize: '16px',
        zIndex: 10,
      }}>
        🪙 {coins} DevCoins
      </div>

      {/* Indicador de Controles en pantalla */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(15, 23, 42, 0.85)',
        color: 'white',
        padding: '12px 18px',
        borderRadius: '12px',
        border: '1px solid #475569',
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 10,
      }}>
        🎮 <b>Mover:</b> WASD / Flechas | ⌨️ <b>Interactuar:</b> Tecla E o Clic
      </div>

      <Scene onInteractDesk={handleOpenDesk} />

      {/* Modal interactivo del escritorio */}
      <InteractionModal
        isOpen={isDeskOpen}
        onClose={() => setIsDeskOpen(false)}
        title="💻 Estación de Trabajo & Proyectos"
        content={
          <div>
            <p style={{ color: '#cbd5e1' }}>¡Bienvenido a mi espacio de desarrollo!</p>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#f8fafc' }}>
              <li><b>ParDos (Android App):</b> App en producción con Kotlin y MVVM.</li>
              <li><b>KMP & REST APIs:</b> Integración multiplataforma y pruebas con JUnit.</li>
              <li><b>Python / Data:</b> Procesamiento estadístico y visión artificial.</li>
            </ul>
            <p style={{ color: '#fbbf24', marginTop: '16px', fontWeight: 'bold' }}>
              ✨ ¡Ganaste +50 DevCoins por explorar!
            </p>
          </div>
        }
      />
    </main>
  );
}

export default App;