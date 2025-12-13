import React, { useState, useEffect, useRef } from 'react';

// Recibir URLs como props del App.jsx
const Cliente = ({ 
  apiUrl = 'http://localhost:5000/api',  // Valor por defecto para desarrollo
  wsUrl = 'ws://localhost:8080'          // Valor por defecto para desarrollo
}) => {
  const [ultimoTurno, setUltimoTurno] = useState(null);
  const [hora, setHora] = useState(new Date());
  const [sonidoActivo, setSonidoActivo] = useState(true);
  const [conectado, setConectado] = useState(false);
  const audioRef = useRef(null);
  const ultimoTurnoRef = useRef(null);

  console.log('🔧 Cliente configurado con:', { apiUrl, wsUrl });

  // WebSocket
  useEffect(() => {
    console.log(`🔌 Conectando WebSocket a: ${wsUrl}`);
    
    let ws;
    let reconectarTimeout;
    
    const conectarWebSocket = () => {
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('✅ WebSocket conectado');
          setConectado(true);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 Nuevo turno recibido:', data);
            
            // Verificar si es un turno nuevo
            if (!ultimoTurnoRef.current || data.turno > ultimoTurnoRef.current.turno) {
              setUltimoTurno(data);
              ultimoTurnoRef.current = data;
              
              // Reproducir sonido si está activo
              if (sonidoActivo) {
                reproducirSonido();
              }
            }
          } catch (error) {
            console.error('Error parseando mensaje:', error);
          }
        };
        
        ws.onerror = (error) => {
          console.error('❌ Error WebSocket:', error);
          setConectado(false);
        };
        
        ws.onclose = () => {
          console.log('🔌 WebSocket desconectado');
          setConectado(false);
          
          // Intentar reconectar después de 3 segundos
          reconectarTimeout = setTimeout(() => {
            console.log('🔄 Intentando reconectar...');
            conectarWebSocket();
          }, 3000);
        };
        
      } catch (error) {
        console.error('Error creando WebSocket:', error);
        setConectado(false);
      }
    };
    
    conectarWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconectarTimeout) {
        clearTimeout(reconectarTimeout);
      }
    };
  }, [sonidoActivo, wsUrl]);

  // Polling de respaldo cada 10 segundos
  useEffect(() => {
    const cargarUltimoTurno = async () => {
      try {
        console.log(`🔄 Polling a: ${apiUrl}/ultimo-turno`);
        const response = await fetch(`${apiUrl}/ultimo-turno`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.ultimoTurno) {
          // Verificar si es un turno nuevo
          if (!ultimoTurnoRef.current || data.ultimoTurno.turno > ultimoTurnoRef.current.turno) {
            console.log('📨 Turno recibido via polling:', data.ultimoTurno);
            setUltimoTurno(data.ultimoTurno);
            ultimoTurnoRef.current = data.ultimoTurno;
            
            // Reproducir sonido si está activo
            if (sonidoActivo) {
              reproducirSonido();
            }
          }
        }
      } catch (error) {
        console.error('Error en polling:', error);
      }
    };
    
    cargarUltimoTurno();
    const interval = setInterval(cargarUltimoTurno, 10000);
    return () => clearInterval(interval);
  }, [sonidoActivo, apiUrl]);

  // Actualizar hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setHora(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Función para reproducir sonido
  const reproducirSonido = () => {
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        
        audioRef.current.play().then(() => {
          console.log('🔊 Sonido reproducido');
        }).catch(error => {
          console.log('Audio autoplay bloqueado:', error);
          // Mostrar notificación para activar sonido
          if (!error.message.includes('user gesture')) {
            alert('Haz click en la pantalla para activar el sonido');
          }
        });
      } catch (error) {
        console.error('Error reproduciendo sonido:', error);
      }
    } else {
      console.warn('Audio ref no disponible');
    }
  };

  // Alternar sonido activo/inactivo
  const toggleSonido = () => {
    setSonidoActivo(!sonidoActivo);
  };

  return (
    <div style={styles.container}>
      {/* Elemento de audio */}
      <audio 
        ref={audioRef} 
        preload="auto"
        style={{ display: 'none' }}
      >
        <source src="/assets/llamador.mp3" type="audio/mpeg" />
      </audio>
      
      {/* Indicador de conexión */}
      <div style={{
        ...styles.conexionIndicador,
        backgroundColor: conectado ? '#4CAF50' : '#FF9800'
      }}>
        {conectado ? '🟢 CONECTADO' : '🟡 CONECTANDO...'}
      </div>
      
      {/* Botón para activar/desactivar sonido */}
      <button 
        onClick={toggleSonido}
        style={styles.botonSonido}
        title={sonidoActivo ? "Silenciar sonido" : "Activar sonido"}
      >
        {sonidoActivo ? '🔊' : '🔇'}
      </button>

      {/* Info de conexión (solo desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={styles.debugInfo}>
          <div>API: {apiUrl}</div>
          <div>WebSocket: {wsUrl}</div>
          <div>Conectado: {conectado ? 'Sí' : 'No'}</div>
        </div>
      )}

      <div style={styles.header}>
        <div style={styles.fechaHora}>
          <div style={styles.fecha}>
            {hora.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div style={styles.horaActual}>
            {hora.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>
        
        <h1 style={styles.titulo}>Blow Max</h1>
      </div>

      <div style={{
        ...styles.anuncio,
        ...(ultimoTurno ? styles.anuncioConTurno : {})
      }}>
        {ultimoTurno ? (
          <>
            <div style={styles.mensaje}>DIRÍJASE A LA</div>
            <div style={styles.cajaDisplay}>
              <div style={styles.cajaLabel}>CAJA</div>
              <div style={styles.cajaNumero}>{ultimoTurno.caja}</div>
            </div>
            
            {/* Información adicional del turno */}
            <div style={styles.infoTurno}>
              <div>TURNO</div>
              <div style={styles.turnoNumero}>#{ultimoTurno.turno}</div>
              <div style={styles.horaTurno}>
                {new Date(ultimoTurno.hora).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            
            {/* Indicador de sonido */}
            {sonidoActivo && (
              <div style={styles.indicadorSonido}>
                🔊 Sonido activo
              </div>
            )}
          </>
        ) : (
          <div style={styles.esperando}>
            <div style={styles.iconoEspera}>⏳</div>
            <div style={styles.textoEspera}>ESPERANDO TURNO</div>
            <div style={styles.subtextoEspera}>
              {sonidoActivo ? '🔊 Sonido activado' : '🔇 Sonido silenciado'}
            </div>
            <div style={styles.estadoConexion}>
              {conectado ? 'Conectado al sistema' : 'Conectando...'}
            </div>
          </div>
        )}
      </div>

      {/* Información del estado */}
      <div style={styles.estadoContainer}>
        <div style={styles.estadoItem}>
          <span style={styles.estadoLabel}>Estado sonido:</span>
          <span style={sonidoActivo ? styles.estadoActivo : styles.estadoInactivo}>
            {sonidoActivo ? 'ACTIVO' : 'SILENCIADO'}
          </span>
        </div>
        
        <div style={styles.estadoItem}>
          <span style={styles.estadoLabel}>Conexión:</span>
          <span style={conectado ? styles.estadoActivo : styles.estadoInactivo}>
            {conectado ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
        
        {ultimoTurno && (
          <div style={styles.estadoItem}>
            <span style={styles.estadoLabel}>Último turno:</span>
            <span style={styles.estadoValor}>
              Caja {ultimoTurno.caja} - #{ultimoTurno.turno}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#da3b3bff',
    color: 'white',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    position: 'relative'
  },
  
  // Indicador de conexión
  conexionIndicador: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    padding: '8px 15px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    zIndex: 100
  },
  
  // Botón de sonido
  botonSonido: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(255, 255, 255, 0.2)',
    border: '2px solid white',
    color: 'white',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s',
    zIndex: 100
  },
  
  // Info de debug (solo desarrollo)
  debugInfo: {
    position: 'absolute',
    top: '80px',
    left: '20px',
    background: 'rgba(0, 0, 0, 0.5)',
    padding: '10px',
    borderRadius: '5px',
    fontSize: '12px',
    fontFamily: 'monospace',
    maxWidth: '300px',
    display: process.env.NODE_ENV === 'development' ? 'block' : 'none'
  },
  
  header: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  
  fechaHora: {
    marginBottom: '20px'
  },
  
  fecha: {
    fontSize: '18px',
    color: '#ffebee'
  },
  
  horaActual: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#e7ece6ff'
  },
  
  titulo: {
    fontSize: '48px',
    color: '#f8f7f5ff',
    textTransform: 'uppercase',
    letterSpacing: '3px',
    marginTop: '10px'
  },
  
  anuncio: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '30px',
    padding: '50px',
    textAlign: 'center',
    minHeight: '500px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.5s ease',
    border: '5px solid rgba(255, 255, 255, 0.2)',
    margin: '0 auto',
    maxWidth: '800px'
  },
  
  anuncioConTurno: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: '#ffffff',
    boxShadow: '0 0 50px rgba(255, 255, 255, 0.5)',
    animation: 'pulse 2s infinite'
  },
  
  mensaje: {
    fontSize: '48px',
    color: '#ffffff',
    marginBottom: '30px',
    textShadow: '3px 3px 6px rgba(0, 0, 0, 0.4)',
    fontWeight: '900',
    letterSpacing: '2px'
  },
  
  cajaDisplay: {
    margin: '40px 0'
  },
  
  cajaLabel: {
    fontSize: '32px',
    color: '#ffebee',
    marginBottom: '15px',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
    letterSpacing: '2px'
  },
  
  cajaNumero: {
    fontSize: '160px',
    fontWeight: '900',
    color: '#ffffff',
    textShadow: '5px 5px 10px rgba(0, 0, 0, 0.5)',
    lineHeight: 1,
    margin: '20px 0'
  },
  
  infoTurno: {
    background: 'rgba(255, 255, 255, 0.2)',
    padding: '25px 50px',
    borderRadius: '20px',
    marginTop: '30px',
    border: '3px solid rgba(255, 255, 255, 0.4)'
  },
  
  turnoNumero: {
    fontSize: '60px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: '10px 0'
  },
  
  horaTurno: {
    fontSize: '24px',
    color: '#ffebee',
    marginTop: '10px'
  },
  
  indicadorSonido: {
    marginTop: '30px',
    padding: '12px 25px',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    color: 'white',
    borderRadius: '30px',
    fontSize: '18px',
    fontWeight: 'bold',
    animation: 'fadeInOut 2s infinite'
  },
  
  esperando: {
    textAlign: 'center'
  },
  
  iconoEspera: {
    fontSize: '100px',
    marginBottom: '30px',
    opacity: 0.8,
    animation: 'spin 4s linear infinite'
  },
  
  textoEspera: {
    fontSize: '42px',
    color: '#ffffff',
    marginBottom: '15px',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
    letterSpacing: '2px'
  },
  
  subtextoEspera: {
    fontSize: '20px',
    color: '#ffebee',
    opacity: 0.9,
    marginBottom: '10px'
  },
  
  estadoConexion: {
    fontSize: '16px',
    color: '#e7ece6ff',
    marginTop: '20px',
    padding: '10px 20px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '15px'
  },
  
  estadoContainer: {
    marginTop: '40px',
    padding: '25px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    display: 'flex',
    justifyContent: 'center',
    gap: '50px',
    flexWrap: 'wrap',
    maxWidth: '800px',
    margin: '40px auto'
  },
  
  estadoItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    minWidth: '150px'
  },
  
  estadoLabel: {
    fontSize: '14px',
    color: '#ffebee',
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  
  estadoActivo: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    padding: '8px 20px',
    borderRadius: '20px',
    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
  },
  
  estadoInactivo: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#f44336',
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    padding: '8px 20px',
    borderRadius: '20px',
    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
  },
  
  estadoValor: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center'
  }
};

// Agregar animaciones CSS globales
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0% { 
      box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
      transform: scale(1);
    }
    50% { 
      box-shadow: 0 0 60px rgba(255, 255, 255, 0.6);
      transform: scale(1.01);
    }
    100% { 
      box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
      transform: scale(1);
    }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes fadeInOut {
    0%, 100% { opacity: 0.7; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
  }
`;
document.head.appendChild(styleSheet);

export default Cliente;