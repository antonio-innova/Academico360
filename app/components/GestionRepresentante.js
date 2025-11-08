"use client";

import { useState, useEffect } from 'react';
import RepresentanteModal from './RepresentanteModal';

export default function GestionRepresentante({ estudiante, onUpdate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Limpiar el mensaje de éxito después de 3 segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSaveRepresentante = async (representanteData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validar que los campos requeridos estén presentes
      if (!representanteData.nombre || !representanteData.apellido || !representanteData.cedula || !representanteData.telefono) {
        setError('Todos los campos marcados con * son obligatorios');
        setLoading(false);
        return;
      }

      // Preparar los datos para la actualización
      const datosActualizados = {
        estudianteId: estudiante._id,
        representante: representanteData
      };

      console.log('Enviando datos del representante:', datosActualizados);

      // Llamar a la API para actualizar los datos del representante
      const response = await fetch('/api/representante', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosActualizados),
      });

      const data = await response.json();
      console.log('Respuesta de la API:', data);

      if (data.success) {
        // Cerrar el modal después de guardar
        setIsModalOpen(false);
        setSuccess(true);
        
        // Notificar al componente padre para que actualice la lista
        if (onUpdate) {
          onUpdate(data.estudiante);
        }
      } else {
        console.error('Error al guardar los datos del representante:', data.message);
        setError(data.message || 'Error al guardar los datos del representante');
      }
    } catch (error) {
      console.error('Error al guardar los datos del representante:', error);
      setError('Error al guardar los datos del representante. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Determinar si hay datos del representante para mostrar un indicador
  const tieneRepresentante = estudiante && 
                            estudiante.representante && 
                            (estudiante.representante.nombre || 
                             estudiante.representante.apellido || 
                             estudiante.representante.cedula);

  return (
    <>
      <div className="relative">
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Gestionar representante"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Cargando...
            </>
          ) : (
            <>
              <svg 
                className="w-4 h-4 mr-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {tieneRepresentante ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              ) : 'Representante'}
            </>
          )}
        </button>
        
        {/* Mensaje de éxito */}
        {success && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-green-100 border border-green-400 text-green-700 px-3 py-1 rounded text-xs z-10">
            Datos guardados correctamente
            <button 
              onClick={() => setSuccess(false)} 
              className="absolute top-1 right-1 text-green-700"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        )}
        
        {/* Mensaje de error */}
        {error && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded text-xs z-10">
            {error}
            <button 
              onClick={() => setError(null)} 
              className="absolute top-1 right-1 text-red-700"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        )}
      </div>

      <RepresentanteModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        estudiante={estudiante}
        onSave={handleSaveRepresentante}
      />
    </>
  );
}
