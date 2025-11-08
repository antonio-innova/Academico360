'use client';
import React, { useState } from 'react';

export default function BuscarEstudiante() {
  const [nombre, setNombre] = useState('');
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Función para buscar estudiantes por nombre
  const buscarEstudiantes = async (e) => {
    e.preventDefault();
    if (!nombre) {
      setError('Por favor, ingrese un nombre para buscar');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setEstudiantes([]);

      const response = await fetch(`/api/estudiantes?nombre=${encodeURIComponent(nombre)}`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setEstudiantes(data.data);
        setSuccess(`Se encontraron ${data.data.length} estudiantes`);
      } else {
        setError('No se encontraron estudiantes con ese nombre');
      }
    } catch (err) {
      console.error('Error al buscar estudiantes:', err);
      setError(`Error al buscar estudiantes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar el ID de un estudiante
  const actualizarId = async (estudianteId, nuevoId) => {
    if (!nuevoId) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Obtener primero los datos completos del estudiante
      const getResponse = await fetch(`/api/estudiantes/${estudianteId}`);
      const getData = await getResponse.json();

      if (!getData.success) {
        throw new Error('No se pudo obtener la información del estudiante');
      }

      const estudiante = getData.data;

      // Actualizar el ID del estudiante
      const response = await fetch(`/api/estudiantes/${estudianteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...estudiante,
          idU: nuevoId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`ID actualizado correctamente a: ${nuevoId}`);
        // Actualizar la lista de estudiantes
        const estudiantesActualizados = estudiantes.map(est => 
          est._id === estudianteId ? { ...est, idU: nuevoId } : est
        );
        setEstudiantes(estudiantesActualizados);
      } else {
        throw new Error(data.message || 'Error al actualizar ID');
      }
    } catch (err) {
      console.error('Error al actualizar ID:', err);
      setError(`Error al actualizar ID: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: '20px 0', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h2>Buscar Estudiante por Nombre</h2>
      <form onSubmit={buscarEstudiantes} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ingrese nombre del estudiante"
            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
      )}

      {success && (
        <div style={{ color: 'green', marginBottom: '10px' }}>{success}</div>
      )}

      {estudiantes.length > 0 && (
        <div>
          <h3>Resultados de la búsqueda</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Nombre</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>ID Actual</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((estudiante) => (
                <tr key={estudiante._id}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estudiante.nombre}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{estudiante.idU}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <button
                      onClick={() => {
                        const nuevoId = prompt(`Editar ID para ${estudiante.nombre}`, estudiante.idU);
                        if (nuevoId && nuevoId !== estudiante.idU) {
                          actualizarId(estudiante._id, nuevoId);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Editar ID
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}