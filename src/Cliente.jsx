import React, { useState, useEffect, useRef } from 'react';

const ClienteFuncional = () => {
  const [ultimoTurno, setUltimoTurno] = useState(null);
  const wsRef = useRef(null);

  // --- CONFIGURACIÓN DE RED ---
  const isProd = window.location.hostname !== 'localhost';
  const WS_URL = isProd 
    ? 'wss://servidor-2db2.onrender.com' 
    : 'ws://localhost:5000';

  useEffect(() => {
    const connect = () => {
      if (wsRef.current) wsRef.current.close();
      
      console.log("🚀 Conectando a:", WS_URL);
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => console.log("✅ Conectado al servidor de turnos");

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📩 Mensaje recibido:", data);

          // Extraemos los datos según la estructura de tu consola
          // data.turno.turno (el número) y data.turno.caja (el ID de caja)
          if (data.turno) {
            setUltimoTurno({
              caja: data.turno.caja || (data.caja ? data.caja.numero : "?"),
              turno: data.turno.turno,
              id: Date.now()
            });
            reproducirSonido();
          }
        } catch (e) {
          console.error("❌ Error en formato de datos", e);
        }
      };

      wsRef.current.onclose = () => {
        console.log("🔌 Conexión perdida. Reintentando...");
        setTimeout(connect, 3000);
      };
    };

    connect();
    return () => wsRef.current?.close();
  }, [WS_URL]);

  const reproducirSonido = () => {
    const audio = new Audio('/assets/llamador.mp3');
    audio.play().catch(() => console.log("Audio en espera de interacción"));
  };

  return (
    <div style={styles.viewPort}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.tituloPrincipal}>BLOW MAX</h1>
          <p style={styles.eslogan}>El mayorista del centro</p>
        </header>

        <div style={styles.mainContent}>
          <div style={styles.videoSection}>
            <video 
              key="video-promo"
              src="/assets/propaganda.mp4" 
              style={styles.videoPlayer}
              autoPlay muted loop playsInline
            />
          </div>

          <div style={styles.turnoSection}>
            <div style={{...styles.display, ...(ultimoTurno && styles.displayActivo)}}>
              {ultimoTurno ? (
                <div style={styles.contentWrapper}>
                  <div style={styles.mensaje}>PASE A</div>
                  <div style={styles.cajaLabel}>CAJA</div>
                  <div style={styles.cajaNumero}>{ultimoTurno.caja}</div>
                  <div style={styles.turnoFooter}>TURNO: {ultimoTurno.turno}</div>
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

// --- (Estilos del cliente iguales a los anteriores) ---
const styles = {
  viewPort: { height: 'calc(100vh - 140px)', width: '100%', overflow: 'hidden', backgroundColor: '#fff' },
  container: { height: '100%', display: 'flex', flexDirection: 'column', padding: '0 20px 10px 20px', boxSizing: 'border-box' },
  header: { textAlign: 'center', padding: '10px 0' },
  tituloPrincipal: { fontSize: 'clamp(40px, 8vh, 80px)', color: '#FF0000', fontWeight: '900', margin: 0 },
  eslogan: { fontSize: 'clamp(18px, 3vh, 28px)', color: '#cc0000', margin: 0 },
  mainContent: { display: 'flex', flex: 1, gap: '20px', minHeight: 0 },
  videoSection: { flex: 1.4, backgroundColor: '#000', borderRadius: '25px', overflow: 'hidden', border: '4px solid #f0f0f0' },
  videoPlayer: { width: '100%', height: '100%', objectFit: 'cover' },
  turnoSection: { flex: 1, display: 'flex', minHeight: 0 },
  display: { flex: 1, backgroundColor: '#fff', borderRadius: '25px', border: '12px solid #FF0000', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#FF0000', padding: '10px' },
  contentWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', height: '100%', width: '100%' },
  mensaje: { fontSize: 'clamp(20px, 4vh, 45px)', fontWeight: 'bold' },
  cajaLabel: { fontSize: 'clamp(25px, 5vh, 55px)', margin: 0 },
  cajaNumero: { fontSize: 'clamp(80px, 22vh, 250px)', fontWeight: '900' },
  turnoFooter: { fontSize: 'clamp(20px, 4vh, 50px)', fontWeight: 'bold', backgroundColor: '#FF0000', color: '#fff', padding: '5px 30px', borderRadius: '15px' },
  esperando: { textAlign: 'center' },
  textoEspera: { fontSize: 'clamp(30px, 6vh, 60px)', fontWeight: 'bold' },
  subtextoEspera: { fontSize: '2.5vh', opacity: 0.5 },
  displayActivo: { animation: 'pulseBg 1.5s infinite' }
};

export default ClienteFuncional;