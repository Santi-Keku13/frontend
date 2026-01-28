import React, { useState, useEffect, useRef } from 'react';

const ClienteFuncional = () => {
  const [ultimoTurno, setUltimoTurno] = useState(null);
  const wsRef = useRef(null);

  const isProd = window.location.hostname !== 'localhost';
  const WS_URL = isProd 
    ? 'wss://servidor-2db2.onrender.com' 
    : 'ws://localhost:5000';

  useEffect(() => {
    const connect = () => {
      if (wsRef.current) wsRef.current.close();
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          let numeroCaja = null;
          let numeroTurno = null;

          // Mantenemos la lógica de detección que te funcionó
          if (data.type === 'llamada' || data.type === 'init' || data.turno) {
            if (typeof data.turno === 'object') {
              numeroCaja = data.turno.caja;
              numeroTurno = data.turno.turno;
            } else {
              numeroCaja = data.caja;
              numeroTurno = data.turno;
            }
          }

          if (numeroCaja !== null && numeroTurno !== null) {
            setUltimoTurno({
              caja: numeroCaja,
              turno: numeroTurno,
              id: Date.now()
            });
            reproducirSonido();
          }
        } catch (e) { console.error("Error:", e); }
      };
      wsRef.current.onclose = () => setTimeout(connect, 3000);
    };
    connect();
    return () => wsRef.current?.close();
  }, [WS_URL]);

  const reproducirSonido = () => {
    const audio = new Audio('/assets/llamador.mp3');
    audio.play().catch(() => {});
  };

  return (
    <div style={styles.viewPort}>
      <div style={styles.container}>
        {/* Cabecera Adaptable */}
        <header style={styles.header}>
          <h1 style={styles.tituloPrincipal}>BLOW MAX</h1>
          <p style={styles.eslogan}>El mayorista del centro</p>
        </header>

        {/* Cuerpo Principal Responsivo */}
        <main style={styles.mainContent}>
          {/* Sección de Video */}
          <div style={styles.videoSection}>
            <video 
              key="video-display"
              src="/assets/propaganda.mp4" 
              style={styles.videoPlayer}
              autoPlay muted loop playsInline
            />
          </div>

          {/* Sección de Turno Llamado */}
          <div style={styles.turnoSection}>
            <div style={{
              ...styles.display,
              ...(ultimoTurno ? styles.displayActivo : {})
            }}>
              {ultimoTurno ? (
                <div style={styles.contentWrapper}>
                  <div style={styles.mensaje}>PASE A</div>
                  <div style={styles.cajaLabel}>CAJA</div>
                  <div style={styles.cajaNumero}>{ultimoTurno.caja}</div>
                  <div style={styles.turnoFooter}>
                    TURNO: {ultimoTurno.turno}
                  </div>
                </div>
              ) : (
                <div style={styles.esperando}>
                  <div style={styles.textoEspera}>BIENVENIDOS</div>
                  <div style={styles.subtextoEspera}>aguarde su turno...</div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const styles = {
  viewPort: { 
    height: '100vh', 
    width: '100vw', 
    margin: 0,
    padding: 0,
    overflow: 'hidden', 
    backgroundColor: '#fff',
    fontFamily: 'Arial, sans-serif'
  },
  container: { 
    height: '100%', 
    display: 'flex', 
    flexDirection: 'column', 
    padding: '1vh 2vw' 
  },
  header: { 
    textAlign: 'center', 
    height: '15vh', // Altura fija para la cabecera
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  tituloPrincipal: { 
    fontSize: '8vh', 
    color: '#FF0000', 
    fontWeight: '900', 
    margin: 0,
    lineHeight: '1'
  },
  eslogan: { 
    fontSize: '3vh', 
    color: '#cc0000', 
    margin: 0,
    fontWeight: 'bold'
  },
  mainContent: { 
    display: 'flex', 
    flex: 1, // Ocupa todo el resto del alto
    gap: '2vw', 
    height: '80vh', // Altura del contenido principal
    marginBottom: '2vh'
  },
  videoSection: { 
    flex: 1.6, // El video es más ancho
    backgroundColor: '#000', 
    borderRadius: '25px', 
    overflow: 'hidden',
    border: '4px solid #f0f0f0',
    height: '100%'
  },
  videoPlayer: { 
    width: '100%', 
    height: '100%', 
    objectFit: 'cover' 
  },
  turnoSection: { 
    flex: 1, // El cuadro de turno ocupa el resto
    height: '100%'
  },
  display: { 
    height: '100%',
    borderRadius: '25px', 
    border: '1.5vh solid #FF0000', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'space-around', 
    backgroundColor: '#fff', 
    color: '#FF0000',
    boxSizing: 'border-box',
    padding: '2vh'
  },
  contentWrapper: { 
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    width: '100%'
  },
  mensaje: { fontSize: '5vh', fontWeight: 'bold' },
  cajaLabel: { fontSize: '6vh', fontWeight: 'bold' },
  cajaNumero: { 
    fontSize: '28vh', // Número gigante adaptable
    fontWeight: '900', 
    lineHeight: '0.8'
  },
  turnoFooter: { 
    fontSize: '6vh', 
    backgroundColor: '#FF0000', 
    color: '#fff', 
    padding: '1.5vh 4vw', 
    borderRadius: '20px',
    fontWeight: 'bold',
    width: '90%',
    textAlign: 'center'
  },
  esperando: { textAlign: 'center' },
  textoEspera: { fontSize: '8vh', fontWeight: 'bold' },
  subtextoEspera: { fontSize: '3vh', opacity: 0.5 },
  displayActivo: {
    // Animación de parpadeo suave cuando llega turno
    boxShadow: '0 0 50px rgba(255, 0, 0, 0.2)'
  }
};

export default ClienteFuncional;