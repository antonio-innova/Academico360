"use client";

import { useState, useEffect } from 'react';
import RepresentanteModal from './RepresentanteModal';

export default function TablaRepresentantes({ estudiantes, onUpdate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstudiante, setSelectedEstudiante] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Mostrar los datos de estudiantes en la consola para depuración
  useEffect(() => {
    console.log('Datos de estudiantes en TablaRepresentantes:', estudiantes);
    if (estudiantes && estudiantes.length > 0) {
      console.log('Primer estudiante:', estudiantes[0]);
      console.log('Año y sección del primer estudiante:', {
        anio: estudiantes[0].anio,
        seccion: estudiantes[0].seccion
      });
    }
  }, [estudiantes]);

  const handleOpenModal = (estudiante) => {
    setSelectedEstudiante(estudiante);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveRepresentante = async (representanteData) => {
    try {
      if (!selectedEstudiante) return;

      // Preparar los datos para la actualización
      const datosActualizados = {
        estudianteId: selectedEstudiante._id,
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

  // Filtrar estudiantes por término de búsqueda
  const filteredEstudiantes = estudiantes.filter(estudiante => {
    const searchLower = searchTerm.toLowerCase();
    const nombreCompleto = `${estudiante.nombre} ${estudiante.apellido}`.toLowerCase();
    const cedula = estudiante.idU ? estudiante.idU.toLowerCase() : '';
    
    // Buscar también en los datos del representante si existen
    let representanteMatch = false;
    if (estudiante.representante) {
      const nombreRepresentante = `${estudiante.representante.nombre} ${estudiante.representante.apellido}`.toLowerCase();
      const cedulaRepresentante = estudiante.representante.cedula ? estudiante.representante.cedula.toLowerCase() : '';
      representanteMatch = nombreRepresentante.includes(searchLower) || cedulaRepresentante.includes(searchLower);
    }
    
    return nombreCompleto.includes(searchLower) || cedula.includes(searchLower) || representanteMatch;
  });

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2 md:mb-0">
            Representantes de Alumnos
          </h2>
          <div className="w-full md:w-64">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre o cédula..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Alumno
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Representante
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parentesco
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEstudiantes.length > 0 ? (
              filteredEstudiantes.map((estudiante, index) => (
                <tr key={estudiante._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">{estudiante.nombre.charAt(0)}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {estudiante.nombre} {estudiante.apellido}
                        </div>
                        <div className="text-sm text-gray-500">
                          {estudiante.idU || ''}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          {estudiante.anio && estudiante.seccion ? `${estudiante.anio} - ${estudiante.seccion}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {estudiante.representante && (estudiante.representante.nombre || estudiante.representante.apellido) ? (
                      <div className="text-sm text-gray-900">
                        {estudiante.representante.nombre} {estudiante.representante.apellido}
                      </div>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        No asignado
                      </span>
                    )}
                    {estudiante.representante && estudiante.representante.cedula && (
                      <div className="text-sm text-gray-500">
                        {estudiante.representante.cedula}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {estudiante.representante && (estudiante.representante.correo || estudiante.representante.telefono) ? (
                      <div>
                        {estudiante.representante.correo && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            {estudiante.representante.correo}
                          </div>
                        )}
                        {estudiante.representante.telefono && (
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            {estudiante.representante.telefono}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No disponible</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {estudiante.representante && estudiante.representante.parentesco ? (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        estudiante.representante.parentesco === 'Padre' || estudiante.representante.parentesco === 'Madre' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {estudiante.representante.parentesco}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">No especificado</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(estudiante)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 p-2 rounded-full transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                  {searchTerm ? (
                    <div className="flex flex-col items-center py-6">
                      <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                      <p className="text-base">No se encontraron resultados para "{searchTerm}"</p>
                      <button 
                        className="mt-2 text-blue-600 hover:text-blue-800"
                        onClick={() => setSearchTerm('')}
                      >
                        Limpiar búsqueda
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-6">
                      <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                      </svg>
                      <p className="text-base">No hay alumnos registrados</p>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para editar datos del representante */}
      {selectedEstudiante && (
        <RepresentanteModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          estudiante={selectedEstudiante}
          onSave={handleSaveRepresentante}
        />
      )}
    </div>
  );
}
