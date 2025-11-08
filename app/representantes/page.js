"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TablaRepresentantes from '../components/TablaRepresentantes';

export default function RepresentantesPage() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Cargar los estudiantes al montar el componente
    fetchEstudiantes();
  }, []);

  const fetchEstudiantes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/estudiantes');
      const data = await response.json();

      if (data.success) {
        setEstudiantes(data.data);
      } else {
        setError(data.message || 'Error al cargar los estudiantes');
      }
    } catch (error) {
      console.error('Error al cargar los estudiantes:', error);
      setError('Error al cargar los estudiantes. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEstudiante = (estudianteActualizado) => {
    // Actualizar el estudiante en la lista
    setEstudiantes(prev => 
      prev.map(est => 
        (est._id === estudianteActualizado._id) ? estudianteActualizado : est
      )
    );
  };

  const handleVolver = () => {
    router.push('/sidebar');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Representantes</h1>
          <button
            onClick={handleVolver}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Volver
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError(null)}
            >
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Cerrar</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </button>
          </div>
        ) : (
          <TablaRepresentantes 
            estudiantes={estudiantes} 
            onUpdate={handleUpdateEstudiante} 
          />
        )}
      </div>
    </div>
  );
}
