import React, { useState, useEffect } from 'react';

const Cajero = () => {
  const API_URL = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api` 
    : 'http://localhost:5000/api';
  
  const [cajas, setCajas] = useState([]);
  const [cajaSeleccionada, setCajaSeleccionada] = useState("");
  const [llamando, setLlamando] = useState(false);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    fetch(`${API_URL}/cajas`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setCajas(data);
        if (data.length > 0) setCajaSeleccionada(data[0].id);
        setCargando(false);
      })
      .catch(() => {
        // Fallback para desarrollo
        const mockCajas = Array.from({ length: 12 }, (_, i) => ({
          id: i + 1,
          numero: i + 1,
          nombre: `Caja ${i + 1}`,
          activa: true,
          ultimoTurno: 0
        }));
        setCajas(mockCajas);
        setCajaSeleccionada(1);
        setCargando(false);
      });
  }, [API_URL]);

  const llamarTurno = async () => {
    const cajaId = parseInt(cajaSeleccionada);
    const caja = cajas.find(c => c.id === cajaId);
    
    if (!caja?.activa) {
      setError('⚠️ Esta caja está inactiva. Actívala para llamar.');
      return;
    }

    try {
      setLlamando(true);
      const response = await fetch(`${API_URL}/cajas/${cajaId}/llamar`, { method: 'POST' });
      const data = await response.json();
      
      const nuevasCajas = cajas.map(c => c.id === data.caja.id ? data.caja : c);
      setCajas(nuevasCajas);
      
      setError(`✅ Turno ${data.turno.turno} llamado`);
      setTimeout(() => { setLlamando(false); setError(null); }, 3000);
    } catch (err) {
      setError('Error al conectar con el servidor');
      setLlamando(false);
    }
  };

  const cajaActual = cajas.find(c => c.id === parseInt(cajaSeleccionada));

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🏪 PANEL DEL CAJERO</h1>
      
      {error && (
        <div style={{...styles.mensaje, backgroundColor: error.includes('✅') ? '#4CAF50' : '#f44336'}}>
          {error}
        </div>
      )}

      <div style={styles.content}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Selección de Terminal</h2>
          
          <div style={styles.selectorContainer}>
            <label style={styles.label}>Caja Actual:</label>
            <select 
              style={styles.select} 
              value={cajaSeleccionada} 
              onChange={(e) => setCajaSeleccionada(e.target.value)}
              disabled={cargando}
            >
              {cajas.map(caja => (
                <option key={caja.id} value={caja.id}>
                  {caja.nombre} {caja.activa ? ' (Activa)' : ' (Inactiva)'}
                </option>
              ))}
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
            disabled={llamando || !cajaActual?.activa}
          >
            {llamando ? '🔔 LLAMANDO...' : `📢 LLAMAR TURNO ${(cajaActual?.ultimoTurno || 0) + 1}`}
          </button>

          <div style={styles.infoPanel}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Último Turno</span>
              <span style={styles.infoValor}>{cajaActual?.ultimoTurno || 0}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Estado</span>
              <span style={cajaActual?.activa ? styles.estadoOk : styles.estadoError}>
                {cajaActual?.activa ? 'CONECTADO' : 'INACTIVO'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '40px 20px', backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' },
  title: { textAlign: 'center', color: '#1a237e', marginBottom: '30px' },
  content: { maxWidth: '500px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  section: { marginBottom: '30px' },
  sectionTitle: { fontSize: '1.2rem', color: '#555', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '5px' },
  selectorContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontWeight: 'bold', color: '#666' },
  select: { 
    padding: '15px', 
    fontSize: '1.1rem', 
    borderRadius: '8px', 
    border: '2px solid #1a237e',
    backgroundColor: '#fff',
    cursor: 'pointer'
  },
  botonLlamar: { 
    width: '100%', padding: '20px', fontSize: '1.3rem', fontWeight: 'bold', 
    backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', 
    cursor: 'pointer', marginBottom: '20px', transition: '0.3s' 
  },
  botonLlamando: { backgroundColor: '#FF9800' },
  botonDeshabilitado: { backgroundColor: '#ccc', cursor: 'not-allowed' },
  infoPanel: { 
    display: 'flex', justifyContent: 'space-around', backgroundColor: '#f8f9fa', 
    padding: '15px', borderRadius: '8px', border: '1px solid #eee' 
  },
  infoItem: { textAlign: 'center' },
  infoLabel: { fontSize: '0.8rem', color: '#888', display: 'block' },
  infoValor: { fontSize: '1.2rem', fontWeight: 'bold', color: '#1a237e' },
  estadoOk: { color: '#4CAF50', fontWeight: 'bold' },
  estadoError: { color: '#f44336', fontWeight: 'bold' },
  mensaje: { padding: '15px', borderRadius: '8px', color: 'white', textAlign: 'center', marginBottom: '20px' }
};

export default Cajero;