import React, { useState } from 'react';
import Cajero from './Cajero';
import Cliente from './Cliente';
import './index.css';

function App() {
  const [modo, setModo] = useState('cajero');
  
  // URL BASE (sin /api al final para WebSocket)
  const BASE_URL = import.meta.env.PROD 
    ? 'https://servidor-2db2.onrender.com'
    : 'http://localhost:5000';
  
  // API URL (con /api para las rutas REST)
  const API_URL = `${BASE_URL}/api`;
  
  // WebSocket URL (sin /api)
  const WS_URL = BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');

  console.log('🔧 URLs configuradas:');
  console.log('  Base:', BASE_URL);
  console.log('  API:', API_URL);
  console.log('  WebSocket:', WS_URL);
  
  return (
    <div className="app" style={appStyles.appContainer}>
      {/* Selector de modo */}
      <div className="modo-selector" style={appStyles.selector}>
        <button 
          className={modo === 'cajero' ? 'active' : ''}
          onClick={() => setModo('cajero')}
        >
          👨‍💼 Modo Cajero
        </button>
        <button 
          className={modo === 'cliente' ? 'active' : ''}
          onClick={() => setModo('cliente')}
        >
          👥 Modo Cliente
        </button>
      </div>

      {/* CONTENEDOR ELÁSTICO: Este es el secreto */}
      <div style={appStyles.mainContent}>
        {modo === 'cajero' ? (
          <Cajero apiUrl={API_URL} />
        ) : (
          <Cliente apiUrl={API_URL} wsUrl={WS_URL} />
        )}
      </div>

      {/* Info del sistema (Tu Footer) */}
      <div className="info-dev" style={appStyles.footer}>
        <p>
          {import.meta.env.PROD ? '🚀 PRODUCCIÓN' : '🛠️ DESARROLLO'} | 
          Modo: <strong>{modo.toUpperCase()}</strong>
        </p>
        <p>Desarrollado por</p>
        <p className="hint">FullStack Vera Santiago</p>
      </div>
    </div>
  );
}

// Estilos rápidos para App.js para asegurar el largo
const appStyles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh', // Ocupa el 100% de la ventana
    width: '100vw',
    overflow: 'hidden', // Evita scroll doble
    margin: 0,
    padding: 0
  },
  selector: {
    flexShrink: 0, // No deja que el selector se achique
    padding: '10px',
    textAlign: 'center'
  },
  mainContent: {
    flex: 1, // <--- Esto estira el Cliente hasta el footer
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden', // Importante para que el video no se salga
    minHeight: 0
  },
  footer: {
    flexShrink: 0, // No deja que el footer se achique o se suba
    textAlign: 'center',
    padding: '5px',
    backgroundColor: '#f8f8f8',
    borderTop: '1px solid #ddd'
  }
};

export default App;