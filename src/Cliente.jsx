import React, { useState, useEffect, useRef } from 'react';

const API_URL = 'http://localhost:5000/api';

const Cliente = () => {
  const [ultimoTurno, setUltimoTurno] = useState(null);
  const [hora, setHora] = useState(new Date());
  const [sonidoActivo, setSonidoActivo] = useState(true);
  const audioRef = useRef(null);
  const ultimoTurnoRef = useRef(null); // Para comparar sin re-render

  // WebSocket
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');
    
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
    
    return () => ws.close();
  }, [sonidoActivo]);

  // Polling de respaldo cada 5 segundos
  useEffect(() => {
    const cargarUltimoTurno = async () => {
      try {
        const response = await fetch(`${API_URL}/ultimo-turno`);
        const data = await response.json();
        if (data.ultimoTurno) {
          // Verificar si es un turno nuevo
          if (!ultimoTurnoRef.current || data.ultimoTurno.turno > ultimoTurnoRef.current.turno) {
            setUltimoTurno(data.ultimoTurno);
            ultimoTurnoRef.current = data.ultimoTurno;
            
            // Reproducir sonido si está activo
            if (sonidoActivo) {
              reproducirSonido();
            }
          }
        }
      } catch (error) {
        console.error('Error cargando último turno:', error);
      }
    };
    
    cargarUltimoTurno();
    const interval = setInterval(cargarUltimoTurno, 5000);
    return () => clearInterval(interval);
  }, [sonidoActivo]);

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
        // Reiniciar el sonido si ya está reproduciéndose
        audioRef.current.currentTime = 0;
        
        // Intentar reproducir
        audioRef.current.play().then(() => {
          console.log('🔊 Sonido reproducido correctamente');
        }).catch(error => {
          console.log('Audio autoplay bloqueado:', error);
          // Si falla el autoplay, mostrar botón para activar sonido
        });
      } catch (error) {
        console.error('Error reproduciendo sonido:', error);
      }
    } else {
      console.warn('Audio ref no está disponible');
    }
  };

  // Alternar sonido activo/inactivo
  const toggleSonido = () => {
    setSonidoActivo(!sonidoActivo);
  };

  return (
    <div style={styles.container}>
      {/* Elemento de audio - CAMBIA EL NOMBRE DEL ARCHIVO AQUÍ */}
      <audio 
        ref={audioRef} 
        preload="auto"
        style={{ display: 'none' }}
      >
        {/* ⬇️ CAMBIA "mi-sonido.mp3" POR EL NOMBRE DE TU ARCHIVO ⬇️ */}
        <source src="/assets/llamador.mp3" type="audio/mpeg" />
        {/* ⬆️ CAMBIA "mi-sonido.mp3" POR EL NOMBRE DE TU ARCHIVO ⬆️ */}
        
        {/* Fallback para otros formatos si tienes */}
        {/* <source src="/assets/mi-sonido.ogg" type="audio/ogg" /> */}
        {/* <source src="/assets/mi-sonido.wav" type="audio/wav" /> */}
      </audio>
      
      {/* Botón para activar/desactivar sonido */}
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
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
    minHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.3s',
    border: '3px solid rgba(255, 255, 255, 0.2)'
  },
  
  anuncioConTurno: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: '#ffffff',
    boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)',
    animation: 'pulse 2s infinite'
  },
  
  mensaje: {
    fontSize: '48px',
    color: '#ffffff',
    marginBottom: '40px',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
    fontWeight: 'bold'
  },
  
  cajaDisplay: {
    marginBottom: '40px'
  },
  
  cajaLabel: {
    fontSize: '28px',
    color: '#ffebee',
    marginBottom: '10px',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)'
  },
  
  cajaNumero: {
    fontSize: '140px',
    fontWeight: 'bold',
    color: '#f2f7f1ff',
    textShadow: '3px 3px 6px rgba(0, 0, 0, 0.4)',
    lineHeight: 1
  },
  
  indicadorSonido: {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    color: 'white',
    borderRadius: '25px',
    fontSize: '16px',
    fontWeight: 'bold',
    animation: 'fadeInOut 2s infinite'
  },
  
  esperando: {
    textAlign: 'center'
  },
  
  iconoEspera: {
    fontSize: '80px',
    marginBottom: '20px',
    opacity: 0.8,
    animation: 'spin 4s linear infinite'
  },
  
  textoEspera: {
    fontSize: '36px',
    color: '#ffffff',
    marginBottom: '10px',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)'
  },
  
  subtextoEspera: {
    fontSize: '18px',
    color: '#ffebee',
    opacity: 0.9
  },
  
  estadoContainer: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '15px',
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
    flexWrap: 'wrap'
  },
  
  estadoItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px'
  },
  
  estadoLabel: {
    fontSize: '14px',
    color: '#ffebee',
    opacity: 0.8
  },
  
  estadoActivo: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    padding: '5px 15px',
    borderRadius: '15px'
  },
  
  estadoInactivo: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#f44336',
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    padding: '5px 15px',
    borderRadius: '15px'
  },
  
  estadoValor: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ffffff'
  }
};

// Agregar animaciones CSS globales
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
    50% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.6); }
    100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes fadeInOut {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);

export default Cliente;