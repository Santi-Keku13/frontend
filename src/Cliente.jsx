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

      wsRef.current.onopen = () => console.log("✅ Conectado al servidor");

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📩 Mensaje recibido:", data);

          // LÓGICA DE DETECCIÓN SEGÚN TU SERVIDOR:
          // Tu servidor envía: { type: 'llamada', caja: X, turno: Y }
          // O a veces envía el objeto dentro de 'turno': { turno: { caja: X, turno: Y } }
          
          let numeroCaja = null;
          let numeroTurno = null;

          if (data.type === 'llamada' || data.type === 'init') {
            // Si los datos vienen directos (como en tu broadcast actual)
            numeroCaja = data.caja;
            numeroTurno = data.turno;

            // Si por alguna razón vienen anidados en data.turno
            if (typeof data.turno === 'object') {
              numeroCaja = data.turno.caja;
              numeroTurno = data.turno.turno;
            }
          }

          if (numeroCaja !== undefined && numeroTurno !== undefined) {
            setUltimoTurno({
              caja: numeroCaja,
              turno: numeroTurno,
              id: Date.now()
            });
            reproducirSonido();
          }
        } catch (e) {
          console.error("❌ Error procesando datos:", e);
        }
      };

      wsRef.current.onclose = () => {
        console.log("🔌 Conexión perdida, reintentando...");
        setTimeout(connect, 3000);
      };
    };

    connect();
    return () => wsRef.current?.close();
  }, [WS_URL]);

  const reproducirSonido = () => {
    const audio = new Audio('/assets/llamador.mp3');
    audio.play().catch(() => console.log("Audio esperando interacción del usuario"));
  };

  return (
    <div style={styles.viewPort}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.tituloPrincipal}>BLOW MAX</h1>
          <p style={styles.eslogan}>El mayorista del centro</p>
        </header>

        <div style={styles.mainContent}>
          {/* SECCIÓN VIDEO */}
          <div style={styles.videoSection}>
            <video 
              key="video-display"
              src="/assets/propaganda.mp4" 
              style={styles.videoPlayer}
              autoPlay muted loop playsInline
            />
          </div>

          {/* SECCIÓN TURNO */}
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

const styles = {
  viewPort: { height: '100vh', width: '100%', overflow: 'hidden', backgroundColor: '#fff' },
  container: { height: '100%', display: 'flex', flexDirection: 'column', padding: '10px 20px' },
  header: { textAlign: 'center', marginBottom: '10px' },
  tituloPrincipal: { fontSize: 'clamp(40px, 8vh, 80px)', color: '#FF0000', fontWeight: '900', margin: 0 },
  eslogan: { fontSize: 'clamp(18px, 3vh, 28px)', color: '#cc0000', fontStyle: 'italic', margin: 0 },
  mainContent: { display: 'flex', flex: 1, gap: '20px', minHeight: 0, marginBottom: '20px' },
  videoSection: { flex: 1.5, backgroundColor: '#000', borderRadius: '25px', overflow: 'hidden', border: '4px solid #f0f0f0' },
  videoPlayer: { width: '100%', height: '100%', objectFit: 'cover' },
  turnoSection: { flex: 1, display: 'flex' },
  display: { 
    flex: 1, borderRadius: '25px', border: '12px solid #FF0000', 
    display: 'flex', flexDirection: 'column', alignItems: 'center', 
    justifyContent: 'center', backgroundColor: '#fff', color: '#FF0000' 
  },
  contentWrapper: { textAlign: 'center' },
  mensaje: { fontSize: 'clamp(20px, 4vh, 45px)', fontWeight: 'bold' },
  cajaLabel: { fontSize: 'clamp(25px, 5vh, 55px)' },
  cajaNumero: { fontSize: 'clamp(80px, 25vh, 250px)', fontWeight: '900', lineHeight: 1 },
  turnoFooter: { 
    fontSize: 'clamp(20px, 5vh, 50px)', backgroundColor: '#FF0000', color: '#fff', 
    padding: '10px 40px', borderRadius: '15px', marginTop: '20px', display: 'inline-block' 
  },
  esperando: { textAlign: 'center' },
  textoEspera: { fontSize: '6vh', fontWeight: 'bold' },
  subtextoEspera: { fontSize: '2vh', opacity: 0.5 },
  displayActivo: { animation: 'pulse 1s infinite alternate' }
};

export default ClienteFuncional;