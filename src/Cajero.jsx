import React, { useState, useEffect } from 'react';

const Cajero = () => {
  // --- CONFIGURACIÓN DE RED ---
  // Forzamos la detección de Render vs Localhost
  const isProd = window.location.hostname !== 'localhost';
  const API_BASE_URL = isProd 
    ? 'https://servidor-2db2.onrender.com/api' 
    : 'http://localhost:5000/api';
  
  const [cajas, setCajas] = useState([]);
  const [cajaSeleccionada, setCajaSeleccionada] = useState("");
  const [llamando, setLlamando] = useState(false);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  // 1. Cargar el estado inicial de las cajas desde el servidor
  useEffect(() => {
    const cargarCajas = async () => {
      setCargando(true);
      try {
        const res = await fetch(`${API_BASE_URL}/cajas`);
        if (!res.ok) throw new Error("No se pudieron obtener las cajas");
        const data = await res.json();
        
        if (data && data.length > 0) {
          setCajas(data);
          setCajaSeleccionada(data[0].id.toString());
        }
      } catch (err) {
        console.error("❌ Error inicial:", err);
        setError("Error de conexión: Verifica que el servidor de Render esté activo.");
      } finally {
        setCargando(false);
      }
    };

    cargarCajas();
  }, [API_BASE_URL]);

  // 2. Función principal para llamar al turno
  const llamarTurno = async () => {
    const cajaId = parseInt(cajaSeleccionada);
    const caja = cajas.find(c => c.id === cajaId);
    
    if (!caja?.activa) {
      setError('⚠️ Esta caja está inactiva en el sistema.');
      return;
    }

    try {
      setLlamando(true);
      setError("🔔 Comunicando con el servidor...");

      const response = await fetch(`${API_BASE_URL}/cajas/${cajaId}/llamar`, { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error en el servidor");
      }

      const data = await response.json();
      console.log("✅ Respuesta del servidor:", data);

      // ACTUALIZACIÓN DE ESTADO LOCAL
      // Sincronizamos el número del botón con lo que devolvió el servidor
      setCajas(prevCajas => prevCajas.map(c => 
        c.id === cajaId ? { ...c, ultimoTurno: data.turno.turno } : c
      ));
      
      setError(`✅ Turno ${data.turno.turno} enviado con éxito`);
      
    } catch (err) {
      console.error("❌ Error al llamar turno:", err);
      setError(`Error: ${err.message}. Revisa la consola.`);
    } finally {
      // Limpiamos el mensaje de estado después de 3 segundos
      setTimeout(() => { 
        setLlamando(false); 
        setError(null); 
      }, 3000);
    }
  };

  const cajaActual = cajas.find(c => c.id === parseInt(cajaSeleccionada));

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🏪 PANEL DEL CAJERO</h1>
      
      {/* Etiqueta de estado de conexión */}
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <span style={{
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '12px',
          backgroundColor: isProd ? '#e3f2fd' : '#fff3e0',
          color: isProd ? '#1565c0' : '#e65100',
          fontWeight: 'bold'
        }}>
          MODO: {isProd ? 'PRODUCCIÓN (RENDER)' : 'DESARROLLO (LOCAL)'}
        </span>
      </div>

      <div style={styles.content}>
        {/* MENSAJES DE ERROR O ÉXITO */}
        {error && (
          <div style={{
            ...styles.mensaje, 
            backgroundColor: error.includes('✅') ? '#4CAF50' : '#f44336',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            {error}
          </div>
        )}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Selección de Terminal</h2>
          <div style={styles.selectorContainer}>
            <label style={styles.label}>Caja Actual:</label>
            <select 
              style={styles.select} 
              value={cajaSeleccionada} 
              onChange={(e) => setCajaSeleccionada(e.target.value)}
              disabled={cargando || llamando}
            >
              {cajas.length > 0 ? cajas.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.activa ? '✅' : '❌ Inactiva'}
                </option>
              )) : (
                <option>Cargando terminales...</option>
              )}
            </select>
          </div>
        </div>

        <div style={styles.section}>
          <button 
            style={{
              ...styles.botonLlamar,
              ...(llamando ? styles.botonLlamando : {}),
              ...(!cajaActual?.activa ? styles.botonDeshabilitado : {})
            }}
            onClick={llamarTurno}
            disabled={llamando || !cajaActual?.activa || cargando}
          >
            {llamando 
              ? '🔔 PROCESANDO...' 
              : `📢 LLAMAR TURNO ${(cajaActual?.ultimoTurno || 0) + 1}`
            }
          </button>
        </div>

        <div style={styles.infoPanel}>
           <div style={styles.infoItem}>
              <span style={styles.infoLabel}>ESTADO SERVER</span>
              <span style={cargando ? styles.estadoError : styles.estadoOk}>
                {cargando ? 'CONECTANDO...' : 'EN LÍNEA'}
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '40px 20px', backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  title: { textAlign: 'center', color: '#1a237e', marginBottom: '10px', fontWeight: '800' },
  content: { maxWidth: '500px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
  section: { marginBottom: '25px' },
  sectionTitle: { fontSize: '1.1rem', color: '#555', marginBottom: '15px', borderBottom: '2px solid #f0f2f5', paddingBottom: '8px' },
  selectorContainer: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontWeight: '600', color: '#444', fontSize: '0.9rem' },
  select: { 
    padding: '12px', 
    fontSize: '1.1rem', 
    borderRadius: '10px', 
    border: '2px solid #1a237e',
    backgroundColor: '#fff',
    outline: 'none'
  },
  botonLlamar: { 
    width: '100%', padding: '20px', fontSize: '1.4rem', fontWeight: 'bold', 
    backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '12px', 
    cursor: 'pointer', transition: 'all 0.2s active',
    boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)'
  },
  botonLlamando: { backgroundColor: '#ef6c00', transform: 'scale(0.98)' },
  botonDeshabilitado: { backgroundColor: '#bdbdbd', cursor: 'not-allowed', boxShadow: 'none' },
  mensaje: { padding: '15px', borderRadius: '10px', color: 'white', textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' },
  infoPanel: { marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px', textAlign: 'center' },
  infoLabel: { fontSize: '0.7rem', color: '#888', display: 'block', marginBottom: '4px' },
  estadoOk: { color: '#4CAF50', fontWeight: 'bold', fontSize: '0.9rem' },
  estadoError: { color: '#f44336', fontWeight: 'bold', fontSize: '0.9rem' }
};

export default Cajero;