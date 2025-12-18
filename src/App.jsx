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
    <div className="app">
      {/* Selector de modo */}
      <div className="modo-selector">
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

      {/* Mostrar componente según el modo */}
      {modo === 'cajero' ? (
        <Cajero apiUrl={API_URL} />
      ) : (
        <Cliente apiUrl={API_URL} wsUrl={WS_URL} />
      )}

      {/* Info del sistema */}
      <div className="info-dev">
        <p>
          {import.meta.env.PROD ? '🚀 PRODUCCIÓN' : '🛠️ DESARROLLO'} | 
          Modo: <strong>{modo.toUpperCase()}</strong>
        </p>
        <p>
          Derechos Reservados 2025
        </p>
        <p className="hint">
          Front-end Vera Santiago
        </p>
      </div>
    </div>
  );
}

export default App;