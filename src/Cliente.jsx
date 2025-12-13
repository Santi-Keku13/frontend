import React, { useState, useEffect, useRef } from 'react';

const ClienteFuncional = ({ 
  apiUrl = 'https://servidor-2db2.onrender.com/api',
  wsUrl = 'wss://servidor-2db2.onrender.com'
}) => {
  const [ultimoTurno, setUltimoTurno] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [debug, setDebug] = useState('Esperando conexión...');
  const ultimoTurnoRef = useRef(null);
  const wsRef = useRef(null);
  const contadorRef = useRef(0);

  console.log('🚀 Cliente Funcional iniciado');

  // 1. WebSocket SIMPLE pero ROBUSTO
  useEffect(() => {
    console.log(`🔌 Conectando WebSocket a: ${wsUrl}`);
    setDebug('Conectando WebSocket...');
    
    const connect = () => {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('✅ WebSocket CONECTADO');
        setConectado(true);
        setDebug('WebSocket: Conectado ✅');
      };
      
      wsRef.current.onmessage = (event) => {
        contadorRef.current++;
        console.log(`📨 [${contadorRef.current}] Mensaje recibido:`, event.data);
        
        try {
          const data = JSON.parse(event.data);
          console.log(`📊 [${contadorRef.current}] JSON parseado:`, data);
          
          // ¡IMPORTANTE! ACEPTAR AMBOS FORMATOS
          if (data.type === 'llamada' || (data.caja && data.turno)) {
            console.log(`🎯 [${contadorRef.current}] ¡ES UN TURNO!`);
            
            const nuevoTurno = {
              caja: data.caja,
              nombre: data.nombre || `Caja ${data.caja}`,
              turno: data.turno,
              hora: data.hora || new Date().toISOString(),
              id: data.id || Date.now()
            };
            
            console.log(`🔄 [${contadorRef.current}] Actualizando estado con:`, nuevoTurno);
            
            // USAR useState CORRECTAMENTE
            setUltimoTurno(nuevoTurno);
            
            // También actualizar la ref
            ultimoTurnoRef.current = nuevoTurno;
            
            // Debug visual
            setDebug(`Caja ${nuevoTurno.caja} - Turno ${nuevoTurno.turno} ✅`);
            
            // Reproducir sonido
            reproducirSonido();
            
          } else if (data.type === 'init' && data.data) {
            console.log('📋 Datos iniciales recibidos');
            const nuevoTurno = {
              caja: data.data.caja,
              nombre: data.data.nombre || `Caja ${data.data.caja}`,
              turno: data.data.turno,
              hora: data.data.hora,
              id: data.data.id || Date.now()
            };
            setUltimoTurno(nuevoTurno);
            ultimoTurnoRef.current = nuevoTurno;
          } else if (data.type === 'heartbeat') {
            console.log('❤️ Heartbeat recibido');
          }
          
        } catch (error) {
          console.error(`❌ [${contadorRef.current}] Error parseando JSON:`, error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setDebug('WebSocket: Error ❌');
      };
      
      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket cerrado:', event.code, event.reason);
        setConectado(false);
        setDebug('WebSocket: Desconectado 🔌');
        
        // Reconectar después de 3 segundos
        setTimeout(() => {
          console.log('🔄 Reconectando...');
          connect();
        }, 3000);
      };
    };
    
    connect();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsUrl]);

  // 2. Polling AGGRESIVO como respaldo
  useEffect(() => {
    const poll = async () => {
      try {
        console.log('🔄 Polling activo...');
        const response = await fetch(`${apiUrl}/ultimo-turno?t=${Date.now()}`);
        const data = await response.json();
        
        if (data.ultimoTurno) {
          const turno = data.ultimoTurno;
          const nuevoTurno = {
            caja: turno.caja,
            nombre: turno.nombre || `Caja ${turno.caja}`,
            turno: turno.turno,
            hora: turno.hora,
            id: Date.now()
          };
          
          const actual = ultimoTurnoRef.current;
          
          if (!actual || nuevoTurno.turno > actual.turno || 
              (nuevoTurno.turno === actual.turno && nuevoTurno.caja !== actual.caja)) {
            
            console.log('📡 Polling detectó nuevo turno:', nuevoTurno);
            setUltimoTurno(nuevoTurno);
            ultimoTurnoRef.current = nuevoTurno;
            setDebug(`Polling: Caja ${nuevoTurno.caja} - Turno ${nuevoTurno.turno}`);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };
    
    // Polling cada 2 segundos
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  // 3. Función de sonido
  const reproducirSonido = () => {
    try {
      const audio = new Audio('/assets/llamador.mp3');
      audio.volume = 0.7;
      audio.play().catch(() => {
        console.log('Sonido necesita interacción del usuario');
      });
    } catch (error) {
      console.error('Error sonido:', error);
    }
  };

  // 4. Render SIMPLE pero FUNCIONAL
  return (
    <div style={styles.container}>
      {/* Panel de control */}
      <div style={styles.controlPanel}>
        <div style={{
          ...styles.status,
          background: conectado ? '#4CAF50' : '#f44336'
        }}>
          {conectado ? '✅ CONECTADO' : '❌ DESCONECTADO'}
        </div>
        
        <div style={styles.debugPanel}>
          <div>{debug}</div>
          <div>Mensajes: {contadorRef.current}</div>
          <div>Último: {ultimoTurno ? `Caja ${ultimoTurno.caja} - Turno ${ultimoTurno.turno}` : 'Ninguno'}</div>
        </div>
        
        <button 
          onClick={() => {
            const testTurno = {
              caja: Math.floor(Math.random() * 12) + 1,
              turno: (ultimoTurnoRef.current?.turno || 0) + 1,
              hora: new Date().toISOString(),
              id: Date.now()
            };
            console.log('🧪 Test manual:', testTurno);
            setUltimoTurno(testTurno);
            ultimoTurnoRef.current = testTurno;
            setDebug(`TEST: Caja ${testTurno.caja} - Turno ${testTurno.turno}`);
          }}
          style={styles.testButton}
        >
          🧪 TEST MANUAL
        </button>
      </div>

      {/* Display principal */}
      <div style={{
        ...styles.display,
        ...(ultimoTurno && styles.displayActivo)
      }}>
        {ultimoTurno ? (
          <>
            <div style={styles.mensaje}>DIRÍJASE A LA</div>
            
            <div style={styles.cajaContainer}>
              <div style={styles.cajaLabel}>CAJA</div>
              <div style={styles.cajaNumero}>{ultimoTurno.caja}</div>
            </div>
            
            <div style={styles.infoContainer}>
              <div style={styles.turnoInfo}>
                <div>TURNO</div>
                <div style={styles.turnoNumero}>#{ultimoTurno.turno}</div>
              </div>
              
              <div style={styles.horaInfo}>
                <div>HORA</div>
                <div style={styles.horaTexto}>
                  {new Date(ultimoTurno.hora).toLocaleTimeString('es-ES')}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={styles.esperando}>
            <div style={styles.iconoEspera}>⏳</div>
            <div style={styles.textoEspera}>SISTEMA ACTIVO</div>
            <div style={styles.subtextoEspera}>Esperando llamada...</div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    padding: '20px'
  },
  controlPanel: {
    position: 'fixed',
    top: '20px',
    left: '20px',
    right: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.7)',
    padding: '15px',
    borderRadius: '10px',
    zIndex: 1000
  },
  status: {
    padding: '10px 20px',
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  debugPanel: {
    flex: 1,
    margin: '0 20px',
    padding: '10px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '5px',
    fontSize: '12px',
    fontFamily: 'monospace'
  },
  testButton: {
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  display: {
    marginTop: '100px',
    padding: '40px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '20px',
    textAlign: 'center',
    minHeight: '500px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    border: '3px solid rgba(255,255,255,0.2)'
  },
  displayActivo: {
    background: 'rgba(255,255,255,0.25)',
    borderColor: '#4CAF50',
    animation: 'pulse 1s infinite'
  },
  mensaje: {
    fontSize: '32px',
    marginBottom: '40px',
    fontWeight: 'bold',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
  },
  cajaContainer: {
    margin: '40px 0'
  },
  cajaLabel: {
    fontSize: '24px',
    marginBottom: '10px',
    color: '#ffcc80'
  },
  cajaNumero: {
    fontSize: '160px',
    fontWeight: 'bold',
    textShadow: '0 0 20px rgba(255,255,255,0.7)'
  },
  infoContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: '40px',
    padding: '20px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '15px'
  },
  turnoInfo: {
    textAlign: 'center'
  },
  turnoNumero: {
    fontSize: '48px',
    fontWeight: 'bold',
    marginTop: '10px'
  },
  horaInfo: {
    textAlign: 'center'
  },
  horaTexto: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginTop: '10px'
  },
  esperando: {
    textAlign: 'center'
  },
  iconoEspera: {
    fontSize: '100px',
    marginBottom: '30px',
    animation: 'spin 4s linear infinite'
  },
  textoEspera: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  subtextoEspera: {
    fontSize: '20px',
    opacity: 0.8
  }
};

// Agregar animaciones
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default ClienteFuncional;