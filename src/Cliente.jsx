import React, { useState, useEffect, useRef } from 'react';

const Cliente = ({ 
  apiUrl = 'https://servidor-2db2.onrender.com/api',  // ← CON /api
  wsUrl = 'wss://servidor-2db2.onrender.com'          
}) => {
  const [ultimoTurno, setUltimoTurno] = useState(null);
  const [hora, setHora] = useState(new Date());
  const [sonidoActivo, setSonidoActivo] = useState(true);
  const [conectado, setConectado] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const audioRef = useRef(null);
  const ultimoTurnoRef = useRef(null);

  console.log('🔧 Cliente configurado con:', { apiUrl, wsUrl });

  // Función para formatear turno
  const formatearTurno = (data) => {
    if (!data) return null;
    
    return {
      caja: data.caja || data.numero || 0,
      nombre: data.nombre || `Caja ${data.caja || data.numero || 0}`,
      turno: data.turno || 0,
      hora: data.hora || data.ultimaLlamada || new Date().toISOString()
    };
  };

  // WebSocket
  useEffect(() => {
    console.log(`🔌 Conectando WebSocket a: ${wsUrl}`);
    setDebugInfo(`Conectando WS a: ${wsUrl}`);
    
    let ws;
    let reconectarTimeout;
    
    const conectarWebSocket = () => {
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('✅ WebSocket conectado');
          setDebugInfo('✅ WebSocket conectado');
          setConectado(true);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 Mensaje WS recibido:', data);
            
            let turnoData;
            
            // Manejar diferentes formatos
            if (data.ultimoTurno) {
              turnoData = data.ultimoTurno;
            } else if (data.type === 'llamada') {
              turnoData = data;
            } else if (data.caja && data.turno) {
              turnoData = data;
            } else if (data.data && data.data.caja) {
              turnoData = data.data;
            } else if (data.type === 'heartbeat') {
              console.log('❤️ Heartbeat');
              return;
            } else if (data.type === 'init') {
              console.log('📋 Datos iniciales recibidos');
              return;
            }
            
            if (turnoData) {
              const turnoFormateado = formatearTurno(turnoData);
              
              if (turnoFormateado && (!ultimoTurnoRef.current || 
                  turnoFormateado.turno > ultimoTurnoRef.current.turno)) {
                
                console.log('🔄 Nuevo turno detectado:', turnoFormateado);
                setUltimoTurno(turnoFormateado);
                ultimoTurnoRef.current = turnoFormateado;
                
                if (sonidoActivo) {
                  setTimeout(() => reproducirSonido(), 500);
                }
              }
            }
            
          } catch (error) {
            console.error('Error parseando mensaje:', error);
            setDebugInfo(`Error WS: ${error.message}`);
          }
        };
        
        ws.onerror = (error) => {
          console.error('❌ Error WebSocket:', error);
          setDebugInfo(`Error WS: ${error.type}`);
          setConectado(false);
        };
        
        ws.onclose = () => {
          console.log('🔌 WebSocket desconectado');
          setDebugInfo('🔌 WS desconectado - Reconectando...');
          setConectado(false);
          
          reconectarTimeout = setTimeout(() => {
            console.log('🔄 Intentando reconectar...');
            conectarWebSocket();
          }, 3000);
        };
        
      } catch (error) {
        console.error('Error creando WebSocket:', error);
        setDebugInfo(`Error: ${error.message}`);
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
        const url = `${apiUrl}/ultimo-turno`;
        console.log(`🔄 Polling a: ${url}`);
        setDebugInfo(`Polling: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.ultimoTurno) {
          const turnoFormateado = formatearTurno(data.ultimoTurno);
          
          if (turnoFormateado && (!ultimoTurnoRef.current || 
              turnoFormateado.turno > ultimoTurnoRef.current.turno)) {
            
            console.log('📨 Turno recibido via polling:', turnoFormateado);
            setDebugInfo(`Turno ${turnoFormateado.turno} - Caja ${turnoFormateado.caja}`);
            setUltimoTurno(turnoFormateado);
            ultimoTurnoRef.current = turnoFormateado;
            
            if (sonidoActivo) {
              setTimeout(() => reproducirSonido(), 500);
            }
          }
        }
      } catch (error) {
        console.error('Error en polling:', error);
        setDebugInfo(`Error polling: ${error.message}`);
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
        
        // Intentar reproducción automática
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('🔊 Sonido reproducido');
            setDebugInfo('🔊 Sonido reproducido');
          }).catch(error => {
            console.log('Audio autoplay bloqueado:', error);
            
            // Mostrar botón para activar sonido
            if (!window.sonidoActivado) {
              setDebugInfo('⚠️ Click para activar sonido');
              
              // Crear botón overlay para activar sonido
              const activarSonido = () => {
                audioRef.current.play();
                setDebugInfo('🔊 Sonido activado manualmente');
                window.sonidoActivado = true;
                document.removeEventListener('click', activarSonido);
              };
              
              document.addEventListener('click', activarSonido);
            }
          });
        }
      } catch (error) {
        console.error('Error reproduciendo sonido:', error);
        setDebugInfo(`Error sonido: ${error.message}`);
      }
    } else {
      console.warn('Audio ref no disponible');
      setDebugInfo('❌ Audio no disponible');
    }
  };

  // Alternar sonido activo/inactivo
  const toggleSonido = () => {
    const nuevoEstado = !sonidoActivo;
    setSonidoActivo(nuevoEstado);
    setDebugInfo(`Sonido ${nuevoEstado ? 'activado' : 'desactivado'}`);
  };

  // Render
  return (
    <div style={styles.container}>
      <audio 
        ref={audioRef} 
        preload="auto"
        style={{ display: 'none' }}
      >
        <source src="/assets/llamador.mp3" type="audio/mpeg" />
        <source src="https://assets.mixkit.co/active_storage/sfx/257/257-preview.mp3" type="audio/mpeg" />
        Tu navegador no soporta audio
      </audio>
      
      {/* Panel de debug */}
      <div style={styles.debugPanel}>
        <div>API: {apiUrl}</div>
        <div>WS: {wsUrl}</div>
        <div>Estado: {conectado ? '🟢' : '🔴'}</div>
        <div>Sonido: {sonidoActivo ? '🔊' : '🔇'}</div>
        <div>Debug: {debugInfo}</div>
        <div>Turno actual: {ultimoTurno ? `Caja ${ultimoTurno.caja} - #${ultimoTurno.turno}` : 'Ninguno'}</div>
      </div>
      
      <div style={{
        ...styles.conexionIndicador,
        backgroundColor: conectado ? '#4CAF50' : '#f44336'
      }}>
        {conectado ? '🟢 CONECTADO' : '🔴 DESCONECTADO'}
      </div>
      
      <button 
        onClick={toggleSonido}
        style={styles.botonSonido}
        title={sonidoActivo ? "Silenciar sonido" : "Activar sonido"}
      >
        {sonidoActivo ? '🔊' : '🔇'}
      </button>

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
            {hora.toLocaleTimeString('es-ES')}
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
          </>
        ) : (
          <div style={styles.esperando}>
            <div style={styles.iconoEspera}>⏳</div>
            <div style={styles.textoEspera}>ESPERANDO TURNO</div>
            <div style={styles.subtextoEspera}>
              Sistema en línea
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#da3b3b',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    position: 'relative',
    overflow: 'hidden'
  },
  debugPanel: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    background: 'rgba(0,0,0,0.7)',
    color: '#0f0',
    padding: '10px',
    borderRadius: '5px',
    fontSize: '12px',
    fontFamily: 'monospace',
    zIndex: 1000,
    maxWidth: '300px'
  },
  conexionIndicador: {
    position: 'absolute',
    top: '20px',
    right: '80px',
    padding: '10px 20px',
    borderRadius: '25px',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  botonSonido: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(255,255,255,0.2)',
    border: '2px solid white',
    color: 'white',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    fontSize: '24px',
    cursor: 'pointer'
  },
  header: {
    textAlign: 'center',
    paddingTop: '100px',
    marginBottom: '40px'
  },
  fechaHora: {
    marginBottom: '20px'
  },
  fecha: {
    fontSize: '20px',
    marginBottom: '10px'
  },
  horaActual: {
    fontSize: '40px',
    fontWeight: 'bold'
  },
  titulo: {
    fontSize: '48px',
    marginTop: '20px'
  },
  anuncio: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: '30px',
    padding: '40px',
    textAlign: 'center',
    margin: '0 20px',
    minHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  anuncioConTurno: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    animation: 'pulse 2s infinite'
  },
  mensaje: {
    fontSize: '36px',
    marginBottom: '20px',
    fontWeight: 'bold'
  },
  cajaDisplay: {
    margin: '30px 0'
  },
  cajaLabel: {
    fontSize: '28px',
    marginBottom: '10px'
  },
  cajaNumero: {
    fontSize: '120px',
    fontWeight: 'bold'
  },
  infoTurno: {
    marginTop: '20px',
    padding: '20px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '15px'
  },
  turnoNumero: {
    fontSize: '48px',
    fontWeight: 'bold',
    margin: '10px 0'
  },
  horaTurno: {
    fontSize: '20px'
  },
  esperando: {
    textAlign: 'center'
  },
  iconoEspera: {
    fontSize: '80px',
    marginBottom: '20px',
    animation: 'spin 4s linear infinite'
  },
  textoEspera: {
    fontSize: '36px',
    fontWeight: 'bold'
  },
  subtextoEspera: {
    fontSize: '18px',
    marginTop: '10px',
    opacity: 0.8
  }
};

// Agregar estilos globales
if (typeof document !== 'undefined') {
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
}

export default Cliente;