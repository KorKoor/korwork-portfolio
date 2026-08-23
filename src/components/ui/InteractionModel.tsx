import React from 'react';

interface InteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
}

export const InteractionModal: React.FC<InteractionModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    }}>
      <div style={{
        background: '#0f172a',
        border: '3px solid #3b82f6',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#60a5fa' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: '#ef4444',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✖
          </button>
        </div>
        <div>{content}</div>
      </div>
    </div>
  );
};