import React, { useState, useEffect, useRef } from 'react';

const ClienteFuncional = ({ apiUrl, wsUrl }) => { // Recibimos props de App.js
  const [ultimoTurno, setUltimoTurno] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      if (wsRef.current) wsRef.current.close();
      
      // Usamos la wsUrl que viene por props de App.js para no romper la conexión
      wsRef.current = new WebSocket(wsUrl);

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
        } catch (e) { console.error("Error en socket:", e); }
      };
      wsRef.current.onclose = () => setTimeout(connect, 3000);
    };
    connect();
    return () => wsRef.current?.close();
  }, [wsUrl]);

  const reproducirSonido = () => {
    const audio = new Audio('/assets/llamador.mp3');
    audio.play().catch(() => {});
  };

  return (
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
    /* El secreto: calc(100vh - 160px) resta el espacio del selector y el footer de App.js */
    height: 'calc(100vh - 160px)', 
    width: '100%', 
    overflow: 'hidden', 
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column'
  },
  container: { 
    height: '100%', 
    display: 'flex', 
    flexDirection: 'column', 
    padding: '10px 20px',
    boxSizing: 'border-box'
  },
  header: { 
    textAlign: 'center', 
    height: '15%', 
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  tituloPrincipal: { 
    fontSize: '6vh', 
    color: '#FF0000', 
    fontWeight: '900', 
    margin: 0,
    lineHeight: 1
  },
  eslogan: { fontSize: '2.5vh', color: '#cc0000', margin: 0 },
  mainContent: { 
    display: 'flex', 
    height: '85%', // Ocupa el resto del contenedor
    gap: '20px', 
    paddingBottom: '10px'
  },
  videoSection: { 
    flex: 1.6, 
    backgroundColor: '#000', 
    borderRadius: '20px', 
    overflow: 'hidden',
    height: '100%'
  },
  videoPlayer: { width: '100%', height: '100%', objectFit: 'cover' },
  turnoSection: { flex: 1, height: '100%' },
  display: { 
    height: '100%',
    borderRadius: '20px', 
    border: '1vh solid #FF0000', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'space-around', 
    boxSizing: 'border-box',
    padding: '2vh'
  },
  contentWrapper: { 
    display: 'flex', flexDirection: 'column', alignItems: 'center', 
    justifyContent: 'space-between', height: '100%', width: '100%' 
  },
  mensaje: { fontSize: '4vh', fontWeight: 'bold', color: '#FF0000' },
  cajaLabel: { fontSize: '5vh', fontWeight: 'bold', color: '#FF0000' },
  cajaNumero: { fontSize: '24vh', fontWeight: '900', color: '#FF0000', lineHeight: 0.8 },
  turnoFooter: { 
    fontSize: '5vh', backgroundColor: '#FF0000', color: '#fff', 
    padding: '1vh 2vw', borderRadius: '15px', fontWeight: 'bold' 
  },
  esperando: { textAlign: 'center', color: '#FF0000' },
  textoEspera: { fontSize: '6vh', fontWeight: 'bold' },
  subtextoEspera: { fontSize: '2vh', opacity: 0.5 },
  displayActivo: { boxShadow: '0 0 30px rgba(255, 0, 0, 0.2)' }
};

export default ClienteFuncional;