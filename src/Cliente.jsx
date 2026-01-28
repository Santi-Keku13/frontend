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
    /* Eliminamos el height fijo de 100vh para que no tape el footer */
    <div style={styles.viewPort}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.tituloPrincipal}>BLOW MAX</h1>
          <p style={styles.eslogan}>El mayorista del centro</p>
        </header>

        <main style={styles.mainContent}>
          <div style={styles.videoSection}>
            <video 
              key="video-display"
              src="/assets/propaganda.mp4" 
              style={styles.videoPlayer}
              autoPlay muted loop playsInline
            />
          </div>

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
    /* Cambiamos height: '100vh' por minHeight y flexGrow */
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: '100%', 
    backgroundColor: '#fff',
    fontFamily: 'Arial, sans-serif',
    overflow: 'hidden'
  },
  container: { 
    /* El contenedor ahora ocupa el 100% del espacio disponible que le deje App.js */
    flex: 1,
    display: 'flex', 
    flexDirection: 'column', 
    padding: '1vh 2vw',
    boxSizing: 'border-box'
  },
  header: { 
    textAlign: 'center', 
    height: '12vh', 
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flexShrink: 0
  },
  tituloPrincipal: { 
    fontSize: 'clamp(30px, 7vh, 80px)', 
    color: '#FF0000', 
    fontWeight: '900', 
    margin: 0,
    lineHeight: '1'
  },
  eslogan: { 
    fontSize: 'clamp(14px, 2.5vh, 25px)', 
    color: '#cc0000', 
    margin: 0,
    fontWeight: 'bold'
  },
  mainContent: { 
    display: 'flex', 
    flex: 1, 
    gap: '2vw', 
    minHeight: 0, // Importante para que el flex no desborde
    marginBottom: '1vh' 
  },
  videoSection: { 
    flex: 1.6, 
    backgroundColor: '#000', 
    borderRadius: '25px', 
    overflow: 'hidden',
    border: '4px solid #f0f0f0'
  },
  videoPlayer: { 
    width: '100%', 
    height: '100%', 
    objectFit: 'cover' 
  },
  turnoSection: { 
    flex: 1,
  },
  display: { 
    height: '100%',
    borderRadius: '25px', 
    border: '1.2vh solid #FF0000', 
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
  mensaje: { fontSize: 'clamp(18px, 4vh, 45px)', fontWeight: 'bold' },
  cajaLabel: { fontSize: 'clamp(22px, 5vh, 55px)', fontWeight: 'bold' },
  cajaNumero: { 
    fontSize: 'clamp(80px, 26vh, 350px)', 
    fontWeight: '900', 
    lineHeight: '0.8'
  },
  turnoFooter: { 
    fontSize: 'clamp(18px, 5vh, 50px)', 
    backgroundColor: '#FF0000', 
    color: '#fff', 
    padding: '1vh 2vw', 
    borderRadius: '15px',
    fontWeight: 'bold',
    width: '90%',
    textAlign: 'center'
  },
  esperando: { textAlign: 'center' },
  textoEspera: { fontSize: '7vh', fontWeight: 'bold' },
  subtextoEspera: { fontSize: '2.5vh', opacity: 0.5 },
  displayActivo: {
    boxShadow: '0 0 50px rgba(255, 0, 0, 0.2)'
  }
};

export default ClienteFuncional;