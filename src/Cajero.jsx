import React, { useState, useEffect } from 'react';

const Cajero = () => {
  // URL dinámica desde variable de entorno
  const API_URL = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api` 
    : 'http://localhost:5000/api';
  
  const [cajas, setCajas] = useState([]);
  const [cajaSeleccionada, setCajaSeleccionada] = useState(1);
  const [llamando, setLlamando] = useState(false);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Cargar cajas al iniciar
  useEffect(() => {
    console.log('🔄 Cajero usando API:', API_URL);
    setCargando(true);
    setError(null);
    
    fetch(`${API_URL}/cajas`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log(`✅ ${data.length} cajas cargadas`);
        setCajas(data);
        setCargando(false);
      })
      .catch(err => {
        console.error('❌ Error cargando cajas:', err);
        setError(`No se puede conectar al servidor: ${err.message}`);
        setCargando(false);
        
        // Datos de ejemplo para desarrollo si falla
        if (!import.meta.env.PROD) {
          console.log('📋 Usando datos de ejemplo');
          setCajas(Array.from({ length: 12 }, (_, i) => ({
            id: i + 1,
            numero: i + 1,
            nombre: `Caja ${i + 1}`,
            activa: true,
            ultimoTurno: 0,
            ultimaLlamada: null
          })));
        }
      });
  }, [API_URL]);

  const llamarTurno = async () => {
    // Verificar si hay caja seleccionada
    const caja = cajas.find(c => c.id === cajaSeleccionada);
    if (!caja) {
      setError('No hay caja seleccionada');
      return;
    }
    
    if (!caja.activa) {
      setError('Esta caja está inactiva');
      return;
    }

    try {
      setLlamando(true);
      setError(null);
      
      console.log(`📢 Llamando turno en caja ${cajaSeleccionada}...`);
      
      const response = await fetch(`${API_URL}/cajas/${cajaSeleccionada}/llamar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Turno llamado:', data);
      
      // Actualizar cajas
      const nuevasCajas = cajas.map(c => 
        c.id === data.caja.id ? data.caja : c
      );
      setCajas(nuevasCajas);
      
      // Efecto visual
      setTimeout(() => setLlamando(false), 1000);
      
      // Mostrar mensaje de éxito
      setTimeout(() => {
        setError(`✅ Turno ${data.turno.turno} llamado en Caja ${data.turno.caja}`);
        setTimeout(() => setError(null), 3000);
      }, 100);
      
    } catch (error) {
      console.error('❌ Error llamando turno:', error);
      setError(`Error: ${error.message}`);
      setLlamando(false);
    }
  };

  // Función para cambiar estado de caja
  const cambiarEstadoCaja = async (cajaId, nuevoEstado) => {
    try {
      const response = await fetch(`${API_URL}/cajas/${cajaId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activa: nuevoEstado })
      });
      
      if (!response.ok) throw new Error('Error cambiando estado');
      
      const data = await response.json();
      
      // Actualizar cajas
      const nuevasCajas = cajas.map(c => 
        c.id === cajaId ? data.caja : c
      );
      setCajas(nuevasCajas);
      
    } catch (error) {
      console.error('Error cambiando estado:', error);
      setError('Error cambiando estado de la caja');
    }
  };

  // Agregar animación CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🏪 PANEL DEL CAJERO</h1>
      <div style={styles.subtitle}>
        {import.meta.env.PROD ? '🚀 MODO PRODUCCIÓN' : '🛠️ MODO DESARROLLO'}
        <span style={styles.apiInfo}> | API: {API_URL}</span>
      </div>
      
      {/* Mostrar errores */}
      {error && (
        <div style={{
          ...styles.mensaje,
          backgroundColor: error.startsWith('✅') ? '#4CAF50' : '#f44336'
        }}>
          {error}
        </div>
      )}

      <div style={styles.content}>
        {/* Selector de caja */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Selecciona una caja
            {cargando && <span style={styles.cargandoText}> (cargando...)</span>}
          </h2>
          
          {cargando ? (
            <div style={styles.cargando}>
              <div style={styles.spinner}></div>
              <p>Cargando cajas...</p>
            </div>
          ) : (
            <div style={styles.cajasGrid}>
              {cajas.map(caja => (
                <button
                  key={caja.id}
                  style={{
                    ...styles.cajaBtn,
                    ...(cajaSeleccionada === caja.id ? styles.cajaSeleccionada : {}),
                    ...(!caja.activa ? styles.cajaInactiva : {})
                  }}
                  onClick={() => setCajaSeleccionada(caja.id)}
                  onDoubleClick={() => cambiarEstadoCaja(caja.id, !caja.activa)}
                  title={`${caja.nombre} - Doble click para ${caja.activa ? 'desactivar' : 'activar'}`}
                >
                  <div style={styles.cajaHeader}>
                    <div style={styles.cajaNumero}>#{caja.numero}</div>
                    <div style={{
                      ...styles.estadoIcono,
                      ...(caja.activa ? styles.estadoActivo : styles.estadoInactivo)
                    }}>
                      {caja.activa ? '●' : '○'}
                    </div>
                  </div>
                  <div style={styles.cajaNombre}>{caja.nombre}</div>
                  <div style={styles.cajaInfo}>
                    <div>Turno: {caja.ultimoTurno || 0}</div>
                    {caja.ultimaLlamada && (
                      <div style={styles.ultimaLlamada}>
                        {new Date(caja.ultimaLlamada).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botón para llamar */}
        <div style={styles.section}>
          <div style={styles.controles}>
            <button 
              style={{
                ...styles.botonLlamar,
                ...(llamando ? styles.botonLlamando : {}),
                ...(cargando ? styles.botonDeshabilitado : {})
              }}
              onClick={llamarTurno}
              disabled={llamando || cargando}
            >
              {llamando ? (
                <>
                  <span style={styles.iconoLlamando}>🔊</span>
                  <span>LLAMANDO TURNO...</span>
                </>
              ) : (
                <>
                  <span style={styles.iconoNormal}>📢</span>
                  <span>LLAMAR TURNO {
                    cajas.find(c => c.id === cajaSeleccionada) 
                      ? (cajas.find(c => c.id === cajaSeleccionada).ultimoTurno || 0) + 1
                      : 1
                  }</span>
                </>
              )}
            </button>
            
            <div style={styles.infoPanel}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Caja seleccionada:</span>
                <span style={styles.infoValor}>
                  #{cajaSeleccionada} - {cajas.find(c => c.id === cajaSeleccionada)?.nombre || 'Cargando...'}
                </span>
              </div>
              
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Próximo turno:</span>
                <span style={styles.infoValor}>
                  {cajas.find(c => c.id === cajaSeleccionada) 
                    ? (cajas.find(c => c.id === cajaSeleccionada).ultimoTurno || 0) + 1
                    : 1
                  }
                </span>
              </div>
              
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Estado:</span>
                <span style={styles.infoValor}>
                  {cajas.find(c => c.id === cajaSeleccionada)?.activa 
                    ? <span style={styles.estadoOk}>✅ ACTIVA</span>
                    : <span style={styles.estadoError}>⛔ INACTIVA</span>
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f0f2f5',
    minHeight: 'calc(100vh - 80px)', // Restar altura del selector de modo
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
  },
  title: {
    textAlign: 'center',
    color: '#1a237e',
    marginBottom: '10px',
    fontSize: '2.5rem',
    fontWeight: '700'
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '30px',
    fontSize: '1rem'
  },
  apiInfo: {
    fontSize: '0.9rem',
    color: '#888',
    fontFamily: 'monospace'
  },
  mensaje: {
    maxWidth: '800px',
    margin: '0 auto 20px auto',
    padding: '15px',
    borderRadius: '10px',
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    boxShadow: '0 3px 10px rgba(0,0,0,0.1)'
  },
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
  },
  section: {
    marginBottom: '40px'
  },
  sectionTitle: {
    color: '#1a237e',
    marginBottom: '20px',
    fontSize: '1.5rem',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '10px'
  },
  cargandoText: {
    color: '#666',
    fontSize: '1rem',
    fontWeight: 'normal'
  },
  cargando: {
    textAlign: 'center',
    padding: '40px'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f0f0f0',
    borderTop: '5px solid #1a237e',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px auto'
  },
  cajasGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '15px',
    marginTop: '15px'
  },
  cajaBtn: {
    padding: '20px 10px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    minHeight: '140px'
  },
  cajaSeleccionada: {
    borderColor: '#1a237e',
    backgroundColor: '#e8eaf6',
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 20px rgba(26, 35, 126, 0.15)'
  },
  cajaInactiva: {
    opacity: '0.7',
    backgroundColor: '#f5f5f5'
  },
  cajaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  cajaNumero: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1a237e'
  },
  estadoIcono: {
    fontSize: '20px'
  },
  estadoActivo: {
    color: '#4CAF50'
  },
  estadoInactivo: {
    color: '#f44336'
  },
  cajaNombre: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    textAlign: 'center'
  },
  cajaInfo: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  ultimaLlamada: {
    fontSize: '11px',
    color: '#888',
    fontStyle: 'italic'
  },
  controles: {
    textAlign: 'center'
  },
  botonLlamar: {
    width: '100%',
    padding: '25px',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '25px',
    boxShadow: '0 5px 15px rgba(76, 175, 80, 0.3)'
  },
  botonLlamando: {
    backgroundColor: '#FF9800',
    animation: 'pulse 1s infinite'
  },
  botonDeshabilitado: {
    opacity: '0.5',
    cursor: 'not-allowed'
  },
  iconoNormal: {
    fontSize: '2rem'
  },
  iconoLlamando: {
    fontSize: '2rem',
    animation: 'pulse 1s infinite'
  },
  infoPanel: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 3px 10px rgba(0,0,0,0.05)'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  infoLabel: {
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '5px'
  },
  infoValor: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#1a237e'
  },
  estadoOk: {
    color: '#4CAF50'
  },
  estadoError: {
    color: '#f44336'
  }
};

// Agregar animación spin para el spinner
const spinStyle = document.createElement('style');
spinStyle.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinStyle);

export default Cajero;