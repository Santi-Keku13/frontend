import React, { useState, useEffect, useRef } from 'react';

const ClienteFuncional = ({ 
  apiUrl = 'https://servidor-2db2.onrender.com/api',
  wsUrl = 'wss://servidor-2db2.onrender.com'
}) => {
  const [ultimoTurno, setUltimoTurno] = useState(null);
  const ultimoTurnoRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'llamada' || (data.caja && data.turno)) {
            const nuevoTurno = {
              caja: data.caja,
              turno: data.turno,
              hora: data.hora || new Date().toISOString(),
              id: Date.now()
            };
            setUltimoTurno(nuevoTurno);
            ultimoTurnoRef.current = nuevoTurno;
            reproducirSonido();
          }
        } catch (e) { console.error("Error socket", e); }
      };
      wsRef.current.onclose = () => setTimeout(connect, 3000);
    };
    connect();
    return () => wsRef.current?.close();
  }, [wsUrl]);

  const reproducirSonido = () => {
    const audio = new Audio('/assets/llamador.mp3');
    audio.play().catch(e => console.log("Audio en espera"));
  };

  return (
    <div style={styles.viewPort}>
      <div style={styles.container}>
        {/* CABECERA */}
        <header style={styles.header}>
          <h1 style={styles.tituloPrincipal}>BLOW MAX</h1>
          <p style={styles.eslogan}>El mayorista del centro</p>
        </header>

        {/* CUERPO CENTRAL */}
        <div style={styles.mainContent}>
          {/* LADO IZQUIERDO: VIDEO */}
          <div style={styles.videoSection}>
            <video 
              src="/assets/propaganda.mp4" 
              style={styles.videoPlayer}
              autoPlay 
              muted // ESENCIAL para que el navegador permita el auto-play
              loop 
              playsInline
            />
          </div>

          {/* LADO DERECHO: PANEL DE TURNO */}
          <div style={styles.turnoSection}>
            <div style={{
              ...styles.display,
              ...(ultimoTurno && styles.displayActivo)
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
        </div>
      </div>
    </div>
  );
};

const styles = {
  // Contenedor que limita el alto total considerando el footer y el header de la App
  viewPort: {
    height: 'calc(100vh - 140px)', // Ajusta este valor (140px) según el alto real de tu footer/header externo
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 20px 10px 20px',
    boxSizing: 'border-box',
  },
  header: {
    textAlign: 'center',
    padding: '10px 0',
    flex: '0 0 auto', // No permite que el header crezca o se achique
  },
  tituloPrincipal: {
    fontSize: 'clamp(40px, 8vh, 80px)', 
    color: '#FF0000',
    fontWeight: '900',
    margin: 0,
    lineHeight: '1.1',
    textTransform: 'uppercase'
  },
  eslogan: {
    fontSize: 'clamp(18px, 3vh, 28px)',
    color: '#cc0000',
    margin: '0',
    fontWeight: '400',
    fontStyle: 'italic'
  },
  mainContent: {
    display: 'flex',
    flex: '1 1 auto', // Ocupa exactamente el espacio sobrante
    gap: '20px',
    minHeight: 0, // CRÍTICO para que el contenido no desborde en Flexbox
    paddingBottom: '5px'
  },
  videoSection: {
    flex: '1.4',
    backgroundColor: '#000',
    borderRadius: '25px',
    overflow: 'hidden',
    border: '4px solid #f0f0f0',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' // Asegura que el video llene el contenedor
  },
  turnoSection: {
    flex: '1',
    display: 'flex',
    minHeight: 0
  },
  display: {
    flex: '1',
    backgroundColor: '#fff',
    borderRadius: '25px',
    border: 'min(1.5vw, 12px) solid #FF0000',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#FF0000',
    padding: '10px',
    boxSizing: 'border-box',
    overflow: 'hidden'
  },
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-evenly', // Distribuye los textos proporcionalmente
    height: '100%',
    width: '100%'
  },
  mensaje: { fontSize: 'clamp(20px, 4vh, 45px)', fontWeight: 'bold' },
  cajaLabel: { fontSize: 'clamp(25px, 5vh, 55px)', margin: 0 },
  cajaNumero: { 
    fontSize: 'clamp(80px, 25vh, 250px)', 
    fontWeight: '900',
    lineHeight: '0.8'
  },
  turnoFooter: {
    fontSize: 'clamp(20px, 5vh, 50px)',
    fontWeight: 'bold',
    backgroundColor: '#FF0000',
    color: '#fff',
    padding: '5px 30px',
    borderRadius: '15px',
    textAlign: 'center',
    width: '85%'
  },
  esperando: { textAlign: 'center' },
  textoEspera: { fontSize: 'clamp(30px, 6vh, 60px)', fontWeight: 'bold' },
  subtextoEspera: { fontSize: '2vh', opacity: 0.5 },
  displayActivo: {
    animation: 'pulseBg 1.5s infinite'
  }
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulseBg {
    0% { background-color: #ffffff; }
    50% { background-color: #fff0f0; }
    100% { background-color: #ffffff; }
  }
`;
document.head.appendChild(styleSheet);

export default ClienteFuncional;