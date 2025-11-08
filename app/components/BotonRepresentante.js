"use client";

import { useState } from 'react';
import RepresentanteModal from './RepresentanteModal';

export default function BotonRepresentante({ estudiante, onUpdate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveRepresentante = async (representanteData) => {
    try {
      // Preparar los datos para la actualización
      const datosActualizados = {
        estudianteId: estudiante._id,
        representante: representanteData
      };

      // Llamar a la API para actualizar los datos del representante
      const response = await fetch('/api/representante', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosActualizados),
      });

      const data = await response.json();

      if (data.success) {
        // Cerrar el modal después de guardar
        setIsModalOpen(false);
        
        // Notificar al componente padre para que actualice la lista
        if (onUpdate) {
          onUpdate(data.estudiante);
        }
      } else {
        console.error('Error al guardar los datos del representante:', data.message);
        alert('Error al guardar los datos del representante: ' + data.message);
      }
    } catch (error) {
      console.error('Error al guardar los datos del representante:', error);
      alert('Error al guardar los datos del representante. Por favor, intente nuevamente.');
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
      <button
        onClick={handleOpenModal}
        className="p-2 bg-green-100 rounded-full text-green-600 hover:bg-green-200 hover:text-green-800 transition-all duration-300 transform hover:scale-110 relative"
        title="Gestionar representante"
      >
        <svg 
          className="w-5 h-5" 
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
        {tieneRepresentante && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        )}
      </button>

      <RepresentanteModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        estudiante={estudiante}
        onSave={handleSaveRepresentante}
      />
    </>
  );
}
