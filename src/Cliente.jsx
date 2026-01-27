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
          console.log("📩 Datos recibidos:", data);

          // Mapeo exacto según tu log de consola
          if (data.turno) {
            setUltimoTurno({
              // Priorizamos data.turno.caja que es lo que envía tu servidor
              caja: data.turno.caja || (data.caja ? data.caja.numero : "?"),
              turno: data.turno.turno,
              id: Date.now()
            });
            reproducirSonido();
          }
        } catch (e) {
          console.error("Error socket:", e);
        }
      };

      wsRef.current.onclose = () => setTimeout(connect, 3000);
    };
    connect();
    return () => wsRef.current?.close();
  }, [WS_URL]);

  const reproducirSonido = () => {
    const audio = new Audio('/assets/llamador.mp3');
    audio.play().catch(e => console.log("Audio bloqueado por navegador"));
  };

  return (
    <div style={styles.viewPort}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.tituloPrincipal}>BLOW MAX</h1>
          <p style={styles.eslogan}>El mayorista del centro</p>
        </header>

        <div style={styles.mainContent}>
          {/* SECCIÓN VIDEO - Corregida para Producción */}
          <div style={styles.videoSection}>
            <video 
              key="video-produccion" // Key para forzar recarga
              src="/assets/propaganda.mp4" 
              style={styles.videoPlayer}
              autoPlay 
              muted 
              loop 
              playsInline
              preload="auto"
            />
          </div>

          {/* SECCIÓN TURNO */}
          <div style={styles.turnoSection}>
            <div style={{...styles.display, ...(ultimoTurno && styles.displayActivo)}}>
              {ultimoTurno ? (
                <div style={styles.contentWrapper}>
                  <div style={styles.mensaje}>PASE A</div>
                  <div style={styles.cajaLabel}>CAJA</div>
                  {/* Forzamos que se muestre el valor o un guion si falla */}
                  <div style={styles.cajaNumero}>{ultimoTurno.caja || "-"}</div>
                  <div style={styles.turnoFooter}>
                    TURNO: {ultimoTurno.turno || "-"}
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

// Estilos (se mantienen igual, asegúrate de que cajaNumero tenga un color visible)
const styles = {
  viewPort: { height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: '#fff' },
  container: { height: '100%', display: 'flex', flexDirection: 'column', padding: '20px' },
  header: { textAlign: 'center', marginBottom: '20px' },
  tituloPrincipal: { fontSize: '8vh', color: '#FF0000', fontWeight: '900', margin: 0 },
  eslogan: { fontSize: '3vh', color: '#cc0000', fontStyle: 'italic' },
  mainContent: { display: 'flex', flex: 1, gap: '20px', minHeight: 0 },
  videoSection: { flex: 1.5, backgroundColor: '#000', borderRadius: '25px', overflow: 'hidden' },
  videoPlayer: { width: '100%', height: '100%', objectFit: 'cover' },
  turnoSection: { flex: 1, display: 'flex' },
  display: { 
    flex: 1, 
    borderRadius: '25px', 
    border: '12px solid #FF0000', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#fff',
    color: '#FF0000' 
  },
  contentWrapper: { textAlign: 'center', width: '100%' },
  mensaje: { fontSize: '5vh', fontWeight: 'bold' },
  cajaLabel: { fontSize: '6vh' },
  cajaNumero: { fontSize: '25vh', fontWeight: '900', lineHeight: 1 },
  turnoFooter: { 
    fontSize: '5vh', 
    backgroundColor: '#FF0000', 
    color: '#fff', 
    padding: '10px 40px', 
    borderRadius: '15px',
    marginTop: '20px',
    display: 'inline-block'
  },
  esperando: { textAlign: 'center' },
  textoEspera: { fontSize: '8vh', fontWeight: 'bold', color: '#FF0000' },
  subtextoEspera: { fontSize: '3vh', color: '#666' },
  displayActivo: { animation: 'pulseBg 1.5s infinite' }
};

export default ClienteFuncional;