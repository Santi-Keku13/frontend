import React, { useState, useEffect } from 'react';

const Cajero = () => {
  const isProd = window.location.hostname !== 'localhost';
  const API_URL = isProd 
    ? 'https://servidor-2db2.onrender.com/api' 
    : 'http://localhost:5000/api';
  
  const [cajas, setCajas] = useState([]);
  const [cajaSeleccionada, setCajaSeleccionada] = useState("");
  const [llamando, setLlamando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/cajas`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (data.length > 0) {
          setCajas(data);
          setCajaSeleccionada(data[0].id.toString());
        }
      })
      .catch(err => console.error("Error cargando cajas:", err));
  }, [API_URL]);

  const llamarTurno = async () => {
    const cajaId = parseInt(cajaSeleccionada);
    try {
      setLlamando(true);
      const response = await fetch(`${API_URL}/cajas/${cajaId}/llamar`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      console.log("✅ Respuesta Cajero:", data);

      // Actualizamos el estado local para que el botón muestre el siguiente número
      setCajas(prev => prev.map(c => 
        c.id === cajaId ? { ...c, ultimoTurno: data.turno.turno } : c
      ));
      
      setError(`✅ Turno ${data.turno.turno} llamado`);
    } catch (err) {
      setError('❌ Error de conexión');
    } finally {
      setTimeout(() => { setLlamando(false); setError(null); }, 3000);
    }
  };

  const cajaActual = cajas.find(c => c.id === parseInt(cajaSeleccionada));

  return (
    <div style={stylesCajero.container}>
      <h1 style={stylesCajero.title}>🏪 PANEL DEL CAJERO</h1>
      <div style={stylesCajero.content}>
        {error && <div style={{...stylesCajero.mensaje, backgroundColor: error.includes('✅') ? '#4CAF50' : '#f44336'}}>{error}</div>}
        
        <div style={stylesCajero.section}>
          <label style={stylesCajero.label}>Seleccionar Caja:</label>
          <select 
            style={stylesCajero.select} 
            value={cajaSeleccionada} 
            onChange={(e) => setCajaSeleccionada(e.target.value)}
          >
            {cajas.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} {c.activa ? '(Activa)' : '(Inactiva)'}</option>
            ))}
          </select>
        </div>

        <button 
          style={{...stylesCajero.boton, ...(llamando && {backgroundColor: '#ffa000'})}}
          onClick={llamarTurno}
          disabled={llamando || !cajaActual?.activa}
        >
          {llamando ? '🔔 LLAMANDO...' : `📢 LLAMAR TURNO ${(cajaActual?.ultimoTurno || 0) + 1}`}
        </button>
      </div>
    </div>
  );
};

const stylesCajero = {
  container: { padding: '40px 20px', backgroundColor: '#f0f2f5', minHeight: '100vh' },
  title: { textAlign: 'center', color: '#1a237e' },
  content: { maxWidth: '400px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
  section: { marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontWeight: 'bold' },
  select: { padding: '10px', borderRadius: '8px', border: '2px solid #1a237e' },
  boton: { width: '100%', padding: '20px', fontSize: '1.2rem', fontWeight: 'bold', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' },
  mensaje: { padding: '10px', color: 'white', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' }
};

export default Cajero;