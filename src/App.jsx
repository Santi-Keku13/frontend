import React, { useState } from 'react';
import Cajero from './Cajero';
import Cliente from './Cliente';
import './index.css';

function App() {
  const [modo, setModo] = useState('cajero');
  
  // URL dinámica para desarrollo/producción
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  // URL WebSocket dinámica
  const getWebSocketUrl = () => {
    if (import.meta.env.PROD) {
      // En producción, convertir https:// a wss://
      const backendUrl = import.meta.env.VITE_API_URL || 'https://servidor-2db2.onrender.com';
      if (backendUrl.startsWith('https://')) {
        return backendUrl.replace('https://', 'wss://');
      }
      return `wss://${backendUrl}`;
    }
    return 'ws://localhost:8080';
  };

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

      {/* Pasar las URLs como props a los componentes */}
      {modo === 'cajero' ? (
        <Cajero apiUrl={API_URL} />
      ) : (
        <Cliente apiUrl={API_URL} wsUrl={getWebSocketUrl()} />
      )}

      {/* Info dinámica para dev/prod */}
      <div className="info-dev">
        <p>
          {import.meta.env.PROD ? '🚀 PRODUCCIÓN' : '🛠️ DESARROLLO'} | 
          API: {API_URL} | 
          WebSocket: {getWebSocketUrl()}
        </p>
        <p>Modo: {modo} | Ambiente: {import.meta.env.MODE}</p>
      </div>
    </div>
  );
}

export default App;